// src/engine/audio/AudioEngine.ts
import { Howler } from 'howler';
import { GameSettings } from '../../../types';
import { BGMManager } from './BGMManager';
import { SFXManager } from './SFXManager';
import { VoiceManager } from './VoiceManager';
import { UISoundManager } from './UISoundManager';
import { AudioSettings } from './AudioSettings';
import { AudioCache } from './AudioCache';
import { AudioPool } from './AudioPool';
import { SoundCategory } from './AudioManifest';
import { SpatialAudioService } from '../../../services/SpatialAudioService';

export class AudioEngine {
    private static instance: AudioEngine;
    public static ready: boolean = false;

    private constructor() {
        this.initializeEngine();
    }

    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    private initializeEngine() {
        console.log('[AUDIO_ENGINE] Initializing brand new decoupled High-Performance Audio Engine...');
        if (typeof window !== 'undefined') {
            (window as any).AudioEngine = this;
            (window as any).HowlerActive = true;

            // Prevent duplicate sound leakage from older HMR compiles
            try {
                Howler.unload();
            } catch (e) {
                console.warn('[AUDIO_ENGINE] Failed unloading old Howler:', e);
            }

            // Handle tab visibility and window focus changes
            const handleVisibilityChange = () => {
                const isHidden = document.hidden;
                console.log(`[AUDIO_ENGINE] Visibility changed: hidden=${isHidden}`);
                if (isHidden) {
                    Howler.mute(true);
                } else {
                    Howler.mute(false);
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
            window.addEventListener('pagehide', () => {
                try {
                    Howler.mute(true);
                } catch {}
            }, { passive: true });
            window.addEventListener('beforeunload', () => {
                try {
                    Howler.unload();
                } catch {}
            }, { passive: true });
        }
        AudioEngine.ready = true;
    }

    /**
     * Map GameSettings directly to independent channel volumes inside our new mixer
     */
    public updateSettings(settings: GameSettings) {
        console.log('[AUDIO_ENGINE] Syncing game configurations across mixer units...');
        let master = typeof settings.masterVolume === 'number' ? settings.masterVolume : 100;
        let music = typeof settings.musicVolume === 'number' ? settings.musicVolume : 100;
        let sfx = typeof settings.sfxVolume === 'number' ? settings.sfxVolume : 100;
        let voice = typeof settings.voiceVolume === 'number' ? settings.voiceVolume : sfx;
        let ui = typeof settings.uiVolume === 'number' ? settings.uiVolume : sfx;

        if (master <= 1.0 && master > 0) master = Math.round(master * 100);
        if (music <= 1.0 && music > 0) music = Math.round(music * 100);
        if (sfx <= 1.0 && sfx > 0) sfx = Math.round(sfx * 100);
        if (voice <= 1.0 && voice > 0) voice = Math.round(voice * 100);
        if (ui <= 1.0 && ui > 0) ui = Math.round(ui * 100);

        const config = AudioSettings.getInstance();
        config.setMasterVolume(master);
        
        // Map settings directly to volumes (representing full 100% capability)
        config.setVolume(SoundCategory.BGM, music);
        config.setVolume(SoundCategory.SFX, sfx);
        config.setVolume(SoundCategory.VOICE, voice);
        config.setVolume(SoundCategory.UI, ui);

        if (settings.spatialAudioMode) {
            SpatialAudioService.getInstance().setMode(settings.spatialAudioMode);
        }
    }

    /**
     * Plays smooth background music
     */
    public async playBGM(url: string, skipFade: boolean = false) {
        await BGMManager.getInstance().playBGM(url, skipFade);
    }

    /**
     * Stops background music
     */
    public stopBGM(skipFade: boolean = false) {
        BGMManager.getInstance().stopBGM(skipFade);
    }

    /**
     * Pauses background music
     */
    public pauseBGM() {
        BGMManager.getInstance().pauseBGM();
    }

    /**
     * Resumes background music
     */
    public resumeBGM() {
        BGMManager.getInstance().resumeBGM();
    }

    /**
     * Maps high-level gameplay scenes to BGM tracks
     */
    public async playMusic(type: 'menu' | 'battle' | 'summon' | 'char-select') {
        await BGMManager.getInstance().playMusic(type);
    }

    /**
     * Executes gameplay Sound Effects (hits, explosions, blocking aura)
     */
    public playSFX(key: string, customMultiplier: number = 1.0, worldX?: number, getPositionX?: () => number) {
        // Intercept UI sounds vs Battle effects of identical namespaces
        if (['click', 'confirm', 'cancel', 'reveal'].includes(key)) {
            UISoundManager.getInstance().playSFX(key as any);
        } else {
            SFXManager.getInstance().playSFX(key, customMultiplier, worldX, getPositionX);
        }
    }

    /**
     * Triggers character speech voice actor lines
     */
    public playVoice(voiceKey: string, worldX?: number, getPositionX?: () => number) {
        VoiceManager.getInstance().playVoice(voiceKey, worldX, getPositionX);
    }

    /**
     * Preloads standard combat sounds prior to initiating match frames, eliminating late-loading micro-freezes.
     */
    public async preloadStaticCombatGroup() {
        console.log('[AUDIO_ENGINE] Running battle pre-cache thread...');
        const uiGroup = ['click', 'confirm', 'cancel', 'reveal'];
        const sfxGroup = [
            'punch', 'attack', 'block', 'charge', 'dash', 'ready', 'fight', 'ko', 'summon', 'victory', 'defeat',
            'combo_leve_1', 'combo_leve_2', 'combo_leve_3',
            'combo_medio_1', 'combo_medio_2', 'combo_medio_3', 'combo_forte',
            'ki_charge_start', 'ki_charge_loop', 'jump', 'land', 'dragon_rush_inicio', 'dragon_rush_combo', 'dragon_rush_final', 'teleport', 'guard_break', 'entrada_ko',
            'narrator_ready', 'narrator_fight', 'narrator_change', 'narrator_nice_combo', 'narrator_great_combo',
            'narrator_excellent_combo', 'narrator_wonderful_power', 'narrator_max_power', 'narrator_perfect',
            'goku_base_kamehameha_inicio', 'goku_base_kamehameha_lancado',
            'goku_base_genkidama_inicio', 'goku_base_genkidama_criando', 'goku_base_genkidama_colisao', 'goku_base_genkidama_explosao',
            'goku_black_rose_intro_inicio', 'goku_black_rose_intro_final'
        ];
        
        await Promise.all([
            AudioCache.getInstance().preloadGroup(uiGroup, SoundCategory.UI),
            AudioCache.getInstance().preloadGroup(sfxGroup, SoundCategory.SFX)
        ]);
        console.log('[AUDIO_ENGINE] Target pre-cache process finished successfully.');
    }

    /**
     * Clears allocated buffers, stops emitters, and garbage collects unused objects to conserve mobile RAM.
     */
    public cleanAllMemory() {
        console.log('[AUDIO_ENGINE] Initiating memory garbage collection...');
        this.stopBGM();
        this.stopAllEffects();
        AudioCache.getInstance().clearCache();
    }

    /**
     * Silences gameplay sound effects, ui alerts, and voice lines instantly.
     */
    public stopAllEffects() {
        UISoundManager.getInstance().stopAllUI();
        SFXManager.getInstance().stopAllSFX();
        VoiceManager.getInstance().stopAllVoices();
        AudioPool.getInstance().stopAllEffects();
    }

    /**
     * Estimated duration for announcers or sound cues to configure triggers
     */
    public getSFXDuration(key: string): number {
        // Approximate standard timing duration as a fallback to guide scripts
        const timings: Record<string, number> = {
            ready: 1.5,
            fight: 1.2,
            ko: 2.0,
            click: 0.25,
            confirm: 0.45,
            cancel: 0.35
        };
        return timings[key] || 0.5;
    }

    /**
     * Plays a looped gameplay sound effect
     */
    public playLoopedSFX(key: string, loopKey: string, customMultiplier: number = 1.0) {
        SFXManager.getInstance().playLoopedSFX(key, loopKey, customMultiplier);
    }

    /**
     * Stops a looped gameplay sound effect
     */
    public stopLoopedSFX(loopKey: string) {
        SFXManager.getInstance().stopLoopedSFX(loopKey);
    }
}
