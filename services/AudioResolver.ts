// AudioResolver.ts - Resource-sound resolving proxy and vocal fallback chain.
import { CacheManager } from './CacheManager';
import { ManifestManager } from './ManifestManager';
import { AudioCacheManager } from './AudioCacheManager';

interface ActiveVoiceNode {
    sourceNode?: AudioBufferSourceNode;
    gainNode?: GainNode;
}

export class AudioResolver {
    private static activeVoiceNodes: Map<string, ActiveVoiceNode> = new Map();

    /**
     * Set up shared context for synthesized system fallback beeps
     */
    private static getAudioContext(): AudioContext | null {
        return AudioCacheManager.getInstance().getAudioContext();
    }

    /**
     * Resolves and plays any sound effect (core sound or synthesized fallback)
     */
    public static async resolveAndPlaySFX(sfxKey: string, volume: number): Promise<void> {
        if (volume <= 0) return;

        const localPath = `audio/core/${sfxKey}.ogg`;
        const hasCoreInstalled = ManifestManager.isPackInstalled('core_audio');

        if (hasCoreInstalled) {
            try {
                // Check if file is stored in indexedDB local storage
                const hasLocalFile = await CacheManager.hasFile(localPath);
                if (hasLocalFile) {
                    const data = await CacheManager.readFile(localPath);
                    const size = data instanceof Blob ? data.size : (data instanceof ArrayBuffer ? data.byteLength : 0);
                    
                    // Real files must be larger than 1024 bytes. Bypass smaller dummy mock clips to engage retro synth.
                    if (size > 1024) {
                        const cacheManager = AudioCacheManager.getInstance();
                        const ctx = cacheManager.getAudioContext();
                        if (ctx) {
                            if (ctx.state === 'suspended') {
                                await ctx.resume().catch(() => {});
                            }

                            // Keep decoding cached per key to optimize performance
                            let decodedBuffer = cacheManager.getDecodedBuffer(sfxKey);
                            if (!decodedBuffer) {
                                const success = await cacheManager.cacheSound(sfxKey, data);
                                if (success) {
                                    decodedBuffer = cacheManager.getDecodedBuffer(sfxKey);
                                }
                            }

                            if (decodedBuffer) {
                                const source = ctx.createBufferSource();
                                source.buffer = decodedBuffer;
                                const gain = ctx.createGain();
                                gain.gain.setValueAtTime(volume, ctx.currentTime);
                                source.connect(gain);
                                gain.connect(ctx.destination);
                                source.start(0);
                                return;
                            }
                        }
                    } else {
                        console.log(`[DEBUG_AUDIO] SFX "${sfxKey}" is a mock file (size: ${size} bytes). Engaging retro synthesizer.`);
                    }
                }
            } catch (e) {
                console.warn(`Local file load failed or blocked for SFX: ${sfxKey}, launching synth fallback...`, e);
            }
        }

        // --- FALLBACK SYSTEM STEP 3: System buzzer fallback synthesizer ---
        this.playSynthesizedSystemBeep(sfxKey, volume);
    }

    /**
     * Resolves and plays character voices or narrator vocations with full fallback chains!
     * 1. Try selected language selected in configs (pt_br, en_us, jp)
     * 2. Try default language fallback (pt_br)
     * 3. System buzzer/beep fallback
     * 4. Complete Silence
     */
    public static async resolveAndPlayVoice(voiceKey: string, volume: number): Promise<void> {
        if (volume <= 0) return;

        const selectedLang = ManifestManager.getActiveLanguage(); // e.g. 'pt_br' | 'en_us' | 'jp'
        if (!ManifestManager.isPackInstalled(selectedLang)) {
            // Player has not manually downloaded this language pack, refuse voice line playing
            return;
        }

        const defaultLang = 'pt_br';

        // 1. Try selected language voice pack in getExternalFilesDir()
        if (ManifestManager.isPackInstalled(selectedLang)) {
            const path = `audio/voices/${selectedLang}/${voiceKey}.ogg`;
            const played = await this.playLocalVocalBlob(voiceKey, path, volume);
            if (played) {
                console.log(`Vocal Resolve Success: ${voiceKey} played in active language [${selectedLang.toUpperCase()}]`);
                return;
            }
        }

        // 2. Try default language fallback (pt_br) if it differs from the selected language
        if (selectedLang !== defaultLang && ManifestManager.isPackInstalled(defaultLang)) {
            const fallbackPath = `audio/voices/${defaultLang}/${voiceKey}.ogg`;
            const played = await this.playLocalVocalBlob(voiceKey, fallbackPath, volume);
            if (played) {
                console.warn(`Vocal Fallback Level 1: ${voiceKey} language [${selectedLang.toUpperCase()}] not found. Played default [PT_BR]`);
                return;
            }
        }

        // 3. Fallback level 2: System synthesized beep / vocalized simulation
        console.warn(`Vocal Fallback Level 2: Local voice packs disabled or corrupted for '${voiceKey}'. Utilizing System beep.`);
        this.playSynthesizedVoiceTone(voiceKey, volume);
    }

    /**
     * Loads a voice blob dynamically from storage and plays it
     */
    private static async playLocalVocalBlob(voiceKey: string, path: string, volume: number): Promise<boolean> {
        try {
            const hasFile = await CacheManager.hasFile(path);
            if (hasFile) {
                const data = await CacheManager.readFile(path);
                const size = data instanceof Blob ? data.size : (data instanceof ArrayBuffer ? data.byteLength : 0);
                
                if (size > 1024) {
                    const cacheManager = AudioCacheManager.getInstance();
                    const ctx = cacheManager.getAudioContext();
                    if (ctx) {
                        if (ctx.state === 'suspended') {
                            await ctx.resume().catch(() => {});
                        }

                        // Silence any existing voiced item in high-vibration battle loops to prevent overlapping
                        const existing = this.activeVoiceNodes.get(path);
                        if (existing && existing.sourceNode) {
                            try { existing.sourceNode.stop(); } catch {}
                        }

                        // Retrieve active decoding of voice
                        let decodedBuffer = cacheManager.getDecodedBuffer(voiceKey);
                        if (!decodedBuffer) {
                            const success = await cacheManager.cacheSound(voiceKey, data);
                            if (success) {
                                decodedBuffer = cacheManager.getDecodedBuffer(voiceKey);
                            }
                        }

                        if (decodedBuffer) {
                            const source = ctx.createBufferSource();
                            source.buffer = decodedBuffer;

                            const gain = ctx.createGain();
                            gain.gain.setValueAtTime(volume, ctx.currentTime);

                            source.connect(gain);
                            gain.connect(ctx.destination);

                            this.activeVoiceNodes.set(path, {
                                sourceNode: source,
                                gainNode: gain
                            });

                            source.onended = () => {
                                const current = this.activeVoiceNodes.get(path);
                                if (current && current.sourceNode === source) {
                                    this.activeVoiceNodes.delete(path);
                                }
                            };

                            source.start(0);
                            return true;
                        }
                    }
                } else {
                    console.log(`[DEBUG_AUDIO] Voice "${path}" is a mock file (size: ${size} bytes). Falling back on synthesized voice tone.`);
                }
            }
        } catch (e) {
            console.warn(`Failed to play local vocal blob: ${path}`, e);
        }
        return false;
    }

    /**
     * Stop all active vocal plays
     */
    public static stopAllVoices() {
        this.activeVoiceNodes.forEach(node => {
            if (node.sourceNode) {
                try {
                    node.sourceNode.stop();
                } catch {}
            }
        });
        this.activeVoiceNodes.clear();
    }

    /**
     * Synthesizer of essential game system tones
     */
    private static playSynthesizedSystemBeep(key: string, volume: number) {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);

            if (key.includes('click')) {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(850, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (key.includes('perfect_guard')) {
                // High-pitched resonant metallic energy chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
                
                // Add a second harmonics oscillator for extra metallic resonance
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                gain2.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(2400, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(3600, ctx.currentTime + 0.08);
                osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
                
                osc.start();
                osc2.start();
                
                osc.stop(ctx.currentTime + 0.4);
                osc2.stop(ctx.currentTime + 0.4);
            } else if (key.includes('confirm')) {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(580, ctx.currentTime);
                osc.frequency.setValueAtTime(780, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (key.includes('ready')) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(volume * 0.05, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else if (key.includes('fight')) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.4);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            }
        } catch (e) {
            console.warn("Synth fallback error", e);
        }
    }

    /**
     * Synthesizes vocal pitch grunts based on characters parameters when no voice pack is installed
     */
    private static playSynthesizedVoiceTone(key: string, volume: number) {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        try {
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            // Pitch depends on the sound line character
            if (key.includes('goku')) {
                // Energetic mid-range tone
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.25);
            } else if (key.includes('vegeta')) {
                // Deeper gruff character tone
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.35);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
            }

            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            console.warn("Vocal synth fail", e);
        }
    }
}
