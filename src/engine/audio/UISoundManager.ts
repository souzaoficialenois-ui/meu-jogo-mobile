// src/engine/audio/UISoundManager.ts
import { Howl } from 'howler';
import { AudioCache } from './AudioCache';
import { AudioPriority, SoundCategory } from './AudioManifest';
import { AudioPool } from './AudioPool';
import { AudioSettings } from './AudioSettings';

export class UISoundManager {
    private static instance: UISoundManager;

    private constructor() {
        AudioSettings.getInstance().addListener(() => {
            const effVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.UI);
            AudioPool.getInstance().applyCategoryVolume(SoundCategory.UI, effVol);
        });
    }

    public static getInstance(): UISoundManager {
        if (!UISoundManager.instance) {
            UISoundManager.instance = new UISoundManager();
        }
        return UISoundManager.instance;
    }

    /**
     * Trigger low latency interface click / confirm sound effects
     */
    public async playSFX(key: 'click' | 'confirm' | 'cancel' | 'reveal' | 'ready' | 'fight' | 'ko') {
        const settings = AudioSettings.getInstance();
        const baseVol = settings.getEffectiveVolume(SoundCategory.UI);
        const effVol = Math.max(0, Math.min(1.0, baseVol * 1.6)); // Boost interface sounds for clarity

        if (effVol <= 0) return;

        try {
            const howlNode = await AudioCache.getInstance().getOrCreateHowl(key, SoundCategory.UI);
            if (howlNode) {
                const howlId = howlNode.play();
                howlNode.volume(effVol, howlId);

                // Check with AudioPool to enforce anti-spam limits
                const allowed = AudioPool.getInstance().registerAndCheck(key, SoundCategory.UI, AudioPriority.LOW, howlNode, howlId);
                if (!allowed) {
                    howlNode.stop(howlId);
                    return;
                }
                return;
            }
        } catch (err) {
            console.warn(`[UI_SOUND_MANAGER] Failed compiling UI feedback: ${key}. Custom beep triggered.`, err);
        }

        // Failsafe beep
        this.playSyntheticBeep(key, effVol);
    }

    private playSyntheticBeep(key: string, vol: number) {
        try {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            gainNode.gain.setValueAtTime(vol * 0.15, ctx.currentTime);

            if (key === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(950, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (key === 'confirm') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.setValueAtTime(800, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            } else if (key === 'cancel') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            }
        } catch {}
    }

    public stopAllUI() {
        AudioPool.getInstance().stopCategory(SoundCategory.UI);
    }
}
