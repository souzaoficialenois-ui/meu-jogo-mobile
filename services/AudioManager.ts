// services/AudioManager.ts - Fast backwards-compatible routing facade mapping to decoupled Howler Audio Engine
import { GameSettings } from '../types';
import { AudioEngine } from '../src/engine/audio/AudioEngine';
import { AudioDownloadManager } from './AudioDownloadManager';

export class AudioManager {
    private static instance: AudioManager;
    public static ready: boolean = false;
    public static isInBattle: boolean = false;

    private constructor() {
        this.preloadSFX();
        if (typeof window !== 'undefined') {
            (window as any).AudioSystem = this;
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public async downloadSystemSounds(): Promise<void> {
        console.log("[DEBUG_AUDIO] Centralized system sounds download triggered");
        await AudioDownloadManager.getInstance().startDownloadAll();
        AudioManager.ready = true;
    }

    private async preloadSFX() {
        console.log("[DEBUG_AUDIO] Centralized system sounds preload verification triggered");
        const success = await AudioDownloadManager.getInstance().verifyAndPreloadAll();
        if (success) {
            AudioManager.ready = true;
        }
        // Warm up our new Howler caches
        try {
            await AudioEngine.getInstance().preloadStaticCombatGroup();
        } catch {}
    }

    /**
     * Map old GameSettings structure down to our new decoupled engine settings.
     */
    public updateSettings(settings: GameSettings) {
        AudioEngine.getInstance().updateSettings(settings);
    }

    public async playBGM(url: string) {
        await AudioEngine.getInstance().playBGM(url);
    }

    public stopBGM(skipFade: boolean = false) {
        AudioEngine.getInstance().stopBGM(skipFade);
    }

    public async playMusic(type: 'menu' | 'battle' | 'summon' | 'char-select') {
        await AudioEngine.getInstance().playMusic(type);
    }

    public playSFX(type: 'click' | 'confirm' | 'cancel' | 'punch' | 'summon' | 'victory' | 'defeat' | 'charge' | 'reveal' | 'attack' | 'block' | 'ready' | 'fight' | 'ko' | 'narrator_ready' | 'narrator_fight' | 'narrator_change' | 'narrator_nice_combo' | 'narrator_great_combo' | 'narrator_excellent_combo' | 'narrator_wonderful_power' | 'narrator_max_power' | 'narrator_perfect' | string) {
        if (!AudioManager.isInBattle) {
            const isWhiteListed = [
                'click', 'confirm', 'cancel', 'reveal', 'summon',
                'ready', 'fight', 'ko', 'victory', 'defeat',
                'narrator_ready', 'narrator_fight', 'narrator_change', 
                'narrator_nice_combo', 'narrator_great_combo',
                'narrator_excellent_combo', 'narrator_wonderful_power', 
                'narrator_max_power', 'narrator_perfect'
            ].includes(type) || (type || "").toLowerCase().includes('intro');

            if (!isWhiteListed) {
                return;
            }
        }
        AudioEngine.getInstance().playSFX(type);
    }

    public playLoopedSFX(type: string, loopKey: string, customMultiplier: number = 1.0) {
        if (!AudioManager.isInBattle) {
            const isWhiteListed = (type || "").toLowerCase().includes('intro');
            if (!isWhiteListed) {
                return;
            }
        }
        AudioEngine.getInstance().playLoopedSFX(type, loopKey, customMultiplier);
    }

    public stopLoopedSFX(loopKey: string) {
        AudioEngine.getInstance().stopLoopedSFX(loopKey);
    }

    public playVoice(voiceKey: string) {
        if (!AudioManager.isInBattle) {
            const lower = (voiceKey || "").toLowerCase();
            const isWhiteListed = lower.includes('intro') || 
                                  lower.includes('win') || 
                                  lower.includes('victory') || 
                                  lower.includes('defeat') || 
                                  lower.startsWith('narrator');
            if (!isWhiteListed) {
                return;
            }
        }
        AudioEngine.getInstance().playVoice(voiceKey);
    }

    public clearAudioCaches() {
        console.log("[DEBUG_AUDIO] Cleaning and resetting all active memory voice and sfx caches due to configuration updates.");
        try {
            AudioEngine.getInstance().cleanAllMemory();
        } catch (e) {
            console.error("Failed to clean audio caches:", e);
        }
    }

    public stopAllEffects() {
        try {
            AudioEngine.getInstance().stopAllEffects();
        } catch (e) {
            console.error("Failed to stop all audio effects:", e);
        }
    }

    public getSFXDuration(type: string): number {
        return AudioEngine.getInstance().getSFXDuration(type);
    }
}
export default AudioManager;
