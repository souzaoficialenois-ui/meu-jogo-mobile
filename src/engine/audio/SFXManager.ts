// src/engine/audio/SFXManager.ts
import { Howl } from 'howler';
import { AudioCache } from './AudioCache';
import { AUDIO_MANIFEST, AudioPriority, SoundCategory } from './AudioManifest';
import { AudioPool } from './AudioPool';
import { AudioSettings } from './AudioSettings';

export class SFXManager {
    private static instance: SFXManager;
    private activeLoops: Map<string, { howl: Howl | null, id: number, isCancelled?: boolean }> = new Map();

    private constructor() {
        // Automatically adjust category volumes
        AudioSettings.getInstance().addListener(() => {
            const effVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.SFX);
            AudioPool.getInstance().applyCategoryVolume(SoundCategory.SFX, effVol);
        });
    }

    public static getInstance(): SFXManager {
        if (!SFXManager.instance) {
            SFXManager.instance = new SFXManager();
        }
        return SFXManager.instance;
    }

    /**
     * Resolves priority layer of a gameplay key
     */
    public getSFXPriority(key: string): AudioPriority {
        const manifestItem = AUDIO_MANIFEST[key];
        if (manifestItem) return manifestItem.defaultPriority;

        const k = key.toLowerCase();
        if (k.includes('clash') || k.includes('ultimate') || k.includes('transform') || k.includes('ready') || k.includes('fight') || k.includes('ko') || k.includes('summon') || k.includes('victory') || k.includes('defeat')) {
            return AudioPriority.HIGH;
        }
        if (k.includes('punch') || k.includes('attack') || k.includes('block') || k.includes('dash')) {
            return AudioPriority.MEDIUM;
        }
        return AudioPriority.LOW;
    }

    /**
     * Play combat sound effect natively, fallback dynamically if missing.
     */
    public async playSFX(key: string, customMultiplier: number = 1.0) {
        const settings = AudioSettings.getInstance();
        const baseVol = settings.getEffectiveVolume(SoundCategory.SFX);
        const effVol = Math.max(0, Math.min(1.0, baseVol * customMultiplier * 1.5)); // Boost combat effects slightly so they feel punchy as defined in guides

        if (effVol <= 0) return;

        const priority = this.getSFXPriority(key);

        try {
            const howlNode = await AudioCache.getInstance().getOrCreateHowl(key, SoundCategory.SFX);
            if (howlNode) {
                // Compile and play sound
                const howlId = howlNode.play();
                howlNode.volume(effVol, howlId);

                // Check with AudioPool if we are allowed to play this sound (handles anti-spam and polyphony caps)
                const allowed = AudioPool.getInstance().registerAndCheck(key, SoundCategory.SFX, priority, howlNode, howlId);
                if (!allowed) {
                    howlNode.stop(howlId); // Halt instantly if discard rules qualify
                    return;
                }
                return;
            }
        } catch (err) {
            console.warn(`[SFX_MANAGER] Failed compiling dynamic SFX: ${key}. Attempting procedural fallback beep.`, err);
        }

        // --- LAYER 3: Emergency Dynamic Synthesized Arcade Tone Fallback ---
        this.playSyntheticBeep(key, effVol);
    }

    /**
     * Reclaim WebAudio Context to generate a physical arcade tone if are elements fail to play or are corrupt.
     */
    private playSyntheticBeep(key: string, vol: number) {
        try {
            // Retrieve global browser AudioContext safely
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioCtx) return;
            
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            gainNode.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
            const k = key.toLowerCase();

            if (k.includes('punch') || k.includes('hit')) {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (k.includes('block')) {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1400, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (k.includes('dash')) {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(250, ctx.currentTime);
                osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(330, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch {}
    }

    public stopAllSFX() {
        AudioPool.getInstance().stopCategory(SoundCategory.SFX);
        for (const loopKey of this.activeLoops.keys()) {
            this.stopLoopedSFX(loopKey);
        }
    }

    /**
     * Plays a looped SFX, identified by loopKey to later stop it.
     */
    public async playLoopedSFX(key: string, loopKey: string, customMultiplier: number = 1.0) {
        if (this.activeLoops.has(loopKey)) return;

        // Mark as pending/loading
        const loopRecord = { howl: null as Howl | null, id: -1, isCancelled: false };
        this.activeLoops.set(loopKey, loopRecord);

        const settings = AudioSettings.getInstance();
        const baseVol = settings.getEffectiveVolume(SoundCategory.SFX);
        const effVol = Math.max(0, Math.min(1.0, baseVol * customMultiplier * 1.5));

        if (effVol <= 0) {
            if (this.activeLoops.get(loopKey) === loopRecord) {
                this.activeLoops.delete(loopKey);
            }
            return;
        }

        try {
            const howlNode = await AudioCache.getInstance().getOrCreateHowl(key, SoundCategory.SFX, true);
            
            // Check if it was cancelled during our await
            if (loopRecord.isCancelled) {
                if (this.activeLoops.get(loopKey) === loopRecord) {
                    this.activeLoops.delete(loopKey);
                }
                return;
            }

            if (howlNode) {
                const howlId = howlNode.play();
                howlNode.volume(effVol, howlId);
                howlNode.loop(true, howlId);
                
                loopRecord.howl = howlNode;
                loopRecord.id = howlId;
            } else {
                if (this.activeLoops.get(loopKey) === loopRecord) {
                    this.activeLoops.delete(loopKey);
                }
            }
        } catch (err) {
            console.warn(`[SFX_MANAGER] Failed playing looped SFX "${key}":`, err);
            if (this.activeLoops.get(loopKey) === loopRecord) {
                this.activeLoops.delete(loopKey);
            }
        }
    }

    /**
     * Stops a running looped SFX.
     */
    public stopLoopedSFX(loopKey: string) {
        const loop = this.activeLoops.get(loopKey);
        if (loop) {
            loop.isCancelled = true;
            if (loop.howl) {
                try {
                    loop.howl.stop(loop.id);
                } catch {}
            }
            this.activeLoops.delete(loopKey);
        }
    }
}
export { AudioPriority as SFXPriority };
