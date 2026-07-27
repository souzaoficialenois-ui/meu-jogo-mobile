// src/engine/audio/AudioSettings.ts
import { SoundCategory } from './AudioManifest';

export class AudioSettings {
    private static instance: AudioSettings;

    // Default to 100 across all audio systems
    private volumes: Record<SoundCategory, number> = {
        [SoundCategory.BGM]: 100,
        [SoundCategory.SFX]: 100,
        [SoundCategory.VOICE]: 100,
        [SoundCategory.UI]: 100
    };

    private mutes: Record<SoundCategory, boolean> = {
        [SoundCategory.BGM]: false,
        [SoundCategory.SFX]: false,
        [SoundCategory.VOICE]: false,
        [SoundCategory.UI]: false
    };

    private masterVolume: number = 100;
    private listeners: (() => void)[] = [];

    private constructor() {
        this.loadSettings();
    }

    public static getInstance(): AudioSettings {
        if (!AudioSettings.instance) {
            AudioSettings.instance = new AudioSettings();
        }
        return AudioSettings.instance;
    }

    private loadSettings() {
        if (typeof window === 'undefined') return;
        try {
            const masterVal = localStorage.getItem('dragondash_volume_master');
            if (masterVal !== null) {
                const parsedVal = parseFloat(masterVal);
                this.masterVolume = parsedVal <= 1.0 && parsedVal > 0 
                    ? Math.round(parsedVal * 100) 
                    : Math.max(0, Math.min(100, parsedVal));
            } else {
                this.masterVolume = 100;
            }

            Object.values(SoundCategory).forEach((cat) => {
                const volVal = localStorage.getItem(`dragondash_volume_${cat}`);
                if (volVal !== null) {
                    const parsedVal = parseFloat(volVal);
                    this.volumes[cat] = parsedVal <= 1.0 && parsedVal > 0 
                        ? Math.round(parsedVal * 100) 
                        : Math.max(0, Math.min(100, parsedVal));
                } else {
                    this.volumes[cat] = 100;
                }

                const muteVal = localStorage.getItem(`dragondash_mute_${cat}`);
                if (muteVal !== null) {
                    this.mutes[cat] = muteVal === 'true';
                }
            });
        } catch (e) {
            console.error('[AUDIO_SETTINGS] Failed reading localStorage configurations:', e);
        }
    }

    public saveSettings() {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('dragondash_volume_master', String(this.masterVolume));
            Object.values(SoundCategory).forEach((cat) => {
                localStorage.setItem(`dragondash_volume_${cat}`, String(this.volumes[cat]));
                localStorage.setItem(`dragondash_mute_${cat}`, String(this.mutes[cat]));
            });
            this.notifyListeners();
        } catch (e) {
            console.error('[AUDIO_SETTINGS] Failed saving localStorage configurations:', e);
        }
    }

    public getMasterVolume(): number {
        return this.masterVolume;
    }

    public setMasterVolume(vol: number) {
        this.masterVolume = Math.max(0, Math.min(100, vol));
        this.saveSettings();
    }

    public getVolume(cat: SoundCategory): number {
        return this.volumes[cat];
    }

    public setVolume(cat: SoundCategory, vol: number) {
        this.volumes[cat] = Math.max(0, Math.min(100, vol));
        this.saveSettings();
    }

    public isMuted(cat: SoundCategory): boolean {
        return this.mutes[cat];
    }

    public setMuted(cat: SoundCategory, isMuted: boolean) {
        this.mutes[cat] = isMuted;
        this.saveSettings();
    }

    public getEffectiveVolume(cat: SoundCategory): number {
        if (this.mutes[cat] || this.masterVolume <= 0) {
            return 0;
        }
        // Scale 0-100 percentage values down to a clean 0.0 - 1.0 float for Howler
        const product = this.volumes[cat] * this.masterVolume;
        return Math.max(0, Math.min(1.0, product / 10000));
    }

    public addListener(cb: () => void) {
        this.listeners.push(cb);
    }

    public removeListener(cb: () => void) {
        this.listeners = this.listeners.filter(l => l !== cb);
    }

    private notifyListeners() {
        this.listeners.forEach(cb => { try { cb(); } catch {} });
    }
}
