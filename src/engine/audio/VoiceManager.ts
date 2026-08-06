// src/engine/audio/VoiceManager.ts
import { Howl } from 'howler';
import { AudioCache } from './AudioCache';
import { AudioPriority, SoundCategory } from './AudioManifest';
import { AudioPool } from './AudioPool';
import { AudioSettings } from './AudioSettings';
import { ManifestManager } from '../../../services/ManifestManager';
import { SpatialAudioService } from '../../../services/SpatialAudioService';

interface ActiveVoiceRecord {
    key: string;
    howlRef: Howl;
    howlId: number;
    priority: AudioPriority;
}

export class VoiceManager {
    private static instance: VoiceManager;

    // Active talkers mapping: character_prefix -> speech quote meta
    private characterMonologues: Map<string, ActiveVoiceRecord> = new Map();

    private constructor() {
        AudioSettings.getInstance().addListener(() => {
            const effVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
            AudioPool.getInstance().applyCategoryVolume(SoundCategory.VOICE, effVol);
        });
    }

    public static getInstance(): VoiceManager {
        if (!VoiceManager.instance) {
            VoiceManager.instance = new VoiceManager();
        }
        return VoiceManager.instance;
    }

    /**
     * Resolves priority of character vocal quotes
     */
    public getVoicePriority(key: string): AudioPriority {
        const k = key.toLowerCase();
        if (k.includes('carregando') || k.includes('ki') || k.includes('charge')) {
            return AudioPriority.HIGH;
        }
        if (k.includes('ult') || k.includes('intro') || k.includes('win') || k.includes('ko') || k.includes('victory') || k.includes('defeat')) {
            return AudioPriority.HIGH;
        }
        if (k.includes('power') || k.includes('trans') || k.includes('beam') || k.includes('super')) {
            return AudioPriority.MEDIUM;
        }
        return AudioPriority.LOW;
    }

    /**
     * Extract owner character key (e.g. goku_blue_charge -> goku, narrator_ready -> narrator)
     */
    private extractSpeaker(key: string): string {
        const k = key.toLowerCase();
        let speaker = 'narrator';
        if (k.startsWith('http')) {
            if (k.includes('goku_blue') || k.includes('goku%20blue')) {
                speaker = 'gokublue';
            } else if (k.includes('goku_ssj') || k.includes('goku%20ssj')) {
                speaker = 'gokussj';
            } else if (k.includes('goku_mui') || k.includes('goku%20mui')) {
                speaker = 'gokumui';
            } else if (k.includes('goku_black') || k.includes('goku%20black')) {
                speaker = 'gokublack';
            } else if (k.includes('goku_base') || k.includes('goku%20base')) {
                speaker = 'gokubase';
            } else if (k.includes('vegeta_base') || k.includes('vegeta%20base')) {
                speaker = 'vegetabase';
            } else if (k.includes('vegeta_ego') || k.includes('vegeta%20ego')) {
                speaker = 'vegetaego';
            } else if (k.includes('vegeta')) {
                speaker = 'vegeta';
            } else if (k.includes('trunks')) {
                speaker = 'trunks';
            } else if (k.includes('teen_gohan') || k.includes('gohan') || k.includes('teen%20gohan')) {
                speaker = 'teengohanssj2';
            } else {
                const lastSlash = k.lastIndexOf('/');
                if (lastSlash !== -1) {
                    const filename = k.substring(lastSlash + 1);
                    speaker = 'url_voice_' + filename.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
                } else {
                    speaker = 'url_voice_' + key.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
                }
            }
        } else {
            const parts = key.split('_');
            if (parts.length > 0) {
                speaker = parts[0].toLowerCase();
            }
        }

        // Separate combo and charging ki tracks into their own non-conflicting speakers to avoid interrupting normal monologue slots
        if (k.includes('carregando') || k.includes('ki') || k.includes('charge')) {
            speaker += '_charge';
        } else if (k.includes('combo')) {
            speaker += '_combo';
        }
        return speaker;
    }

    /**
     * Play vocal quote with monologue interruption and priority checks.
     */
    public async playVoice(voiceKey: string, worldX?: number, getPositionX?: () => number) {
        const settings = AudioSettings.getInstance();
        const baseVol = settings.getEffectiveVolume(SoundCategory.VOICE);
        if (baseVol <= 0) return;

        const lowerKey = voiceKey.toLowerCase();
        const isExternalUrl = lowerKey.startsWith('http') || lowerKey.includes('github') || lowerKey.includes('raw.githubusercontent');
        
        if (!isExternalUrl) {
            const activeLang = ManifestManager.getActiveLanguage() || 'pt_br';
            if (!ManifestManager.isPackInstalled(activeLang)) {
                // Prevent playing character voices if the manual download has not occurred
                return;
            }
        }

        let speaker = this.extractSpeaker(voiceKey);
        const priority = this.getVoicePriority(voiceKey);
        const isCombo = voiceKey.toLowerCase().includes('combo');

        if (isCombo) {
            // Suffix speaker with a unique ID so it is treated completely independently and can overlap
            const uniqueId = Math.random().toString(36).substring(2, 9);
            speaker = `${speaker}_${uniqueId}`;
        } else {
            // --- ALWAYS EXECUTE FOR NON-COMBO VOICES ---
            // Interrupt any existing voice for this speaker to let the new voice start immediately to avoid overlapping
            const existingVoice = this.characterMonologues.get(speaker);
            if (existingVoice) {
                try {
                    if (existingVoice.howlRef) {
                        existingVoice.howlRef.stop(existingVoice.howlId);
                    }
                } catch (err) {
                    console.warn("[VOICE_MANAGER] Error stopping existing voice:", err);
                }
                this.characterMonologues.delete(speaker);
            }
        }

        // Register synchronously as a pending monologue to block duplicate triggers if needed, but allow new requests
        this.characterMonologues.set(speaker, {
            key: voiceKey,
            howlRef: null as any,
            howlId: 0,
            priority
        });

        try {
            const howlNode = await AudioCache.getInstance().getOrCreateHowl(voiceKey, SoundCategory.VOICE);
            if (howlNode) {
                // Verify the monologue record was not overwritten or removed while loading
                const pending = this.characterMonologues.get(speaker);
                if (!pending || pending.key !== voiceKey) {
                    return;
                }

                const howlId = howlNode.play();
                howlNode.volume(baseVol, howlId);

                if (worldX !== undefined || getPositionX) {
                    const posX = getPositionX ? getPositionX() : (worldX ?? 0);
                    SpatialAudioService.getInstance().applyPan(howlNode, howlId, posX);
                    if (getPositionX) {
                        SpatialAudioService.getInstance().registerActiveTrack(howlId, howlNode, getPositionX);
                    }
                }

                // Enforce global channel ceilings and register in pool
                const allowed = AudioPool.getInstance().registerAndCheck(voiceKey, SoundCategory.VOICE, priority, howlNode, howlId);
                if (!allowed) {
                    howlNode.stop(howlId);
                    this.characterMonologues.delete(speaker);
                    return;
                }

                const record: ActiveVoiceRecord = {
                    key: voiceKey,
                    howlRef: howlNode,
                    howlId,
                    priority
                };

                // Store speaker active reference
                this.characterMonologues.set(speaker, record);

                howlNode.once('end', () => {
                    const current = this.characterMonologues.get(speaker);
                    if (current && current.howlId === howlId) {
                        this.characterMonologues.delete(speaker);
                    }
                }, howlId);

                return;
            } else {
                this.characterMonologues.delete(speaker);
            }
        } catch (err) {
            console.warn(`[VOICE_MANAGER] Vocal load error for "${voiceKey}". Simulating voice.`, err);
            this.characterMonologues.delete(speaker);
        }

        // Fallback: procedural voice grunts when sound packs are absent or loading fails
        this.playSynthesizedVocalGrunt(speaker, baseVol);
    }

    /**
     * Emergency procedural voice grunts
     */
    private playSynthesizedVocalGrunt(speaker: string, vol: number) {
        try {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioCtx) return;
            
            let ctx = (window as any)._sharedProceduralAudioCtx;
            if (!ctx || ctx.state === 'closed') {
                ctx = new AudioCtx();
                (window as any)._sharedProceduralAudioCtx = ctx;
            }
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(vol * 0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

            if (speaker === 'goku') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.3);
            } else if (speaker === 'vegeta') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.4);
            } else if (speaker === 'trunks') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.35);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(280, ctx.currentTime);
            }

            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        } catch {}
    }

    public stopAllVoices() {
        this.characterMonologues.forEach(rec => {
            try { rec.howlRef.stop(rec.howlId); } catch {}
        });
        this.characterMonologues.clear();
        AudioPool.getInstance().stopCategory(SoundCategory.VOICE);
    }

    public isVoicePlaying(voiceKey: string): boolean {
        for (const record of this.characterMonologues.values()) {
            if (record && record.key === voiceKey) {
                try {
                    if (record.howlRef && record.howlRef.playing(record.howlId)) {
                        return true;
                    }
                } catch {
                    return true;
                }
            }
        }
        return false;
    }

    public getVoiceProgress(voiceKey: string): number {
        for (const record of this.characterMonologues.values()) {
            if (record && record.key === voiceKey && record.howlRef) {
                try {
                    const currentPos = record.howlRef.seek(record.howlId);
                    const duration = record.howlRef.duration();
                    if (typeof currentPos === 'number' && duration > 0) {
                        return currentPos / duration;
                    }
                } catch {}
            }
        }
        return -1;
    }

    public isComboVoicePlaying(characterId: string): boolean {
        const charClean = (characterId || "").toLowerCase();
        for (const [speaker, record] of this.characterMonologues.entries()) {
            if (speaker.includes('_combo')) {
                const comboIdx = speaker.indexOf('_combo');
                const speakerPrefix = speaker.substring(0, comboIdx);
                const cleanSpeaker = speakerPrefix.replace(/_/g, '');
                const cleanChar = charClean.replace(/_/g, '');
                if (cleanChar.includes(cleanSpeaker) || cleanSpeaker.includes(cleanChar)) {
                    if (record && record.howlRef) {
                        try {
                            if (record.howlRef.playing(record.howlId)) {
                                return true;
                            }
                        } catch {
                            return true;
                        }
                    } else if (record) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
export { AudioPriority as VoicePriority };
