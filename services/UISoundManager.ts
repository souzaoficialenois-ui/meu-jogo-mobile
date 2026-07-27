// services/UISoundManager.ts - Backwards-compatible proxy routing user interface sounds to our new Howler UI sound manager
import { UISoundManager as NewUISoundManager } from '../src/engine/audio/UISoundManager';
import { AudioSettings } from '../src/engine/audio/AudioSettings';
import { SoundCategory } from '../src/engine/audio/AudioManifest';

export class UISoundManager {
    private static instance: UISoundManager;
    
    private constructor() {}

    public static getInstance(): UISoundManager {
        if (!UISoundManager.instance) {
            UISoundManager.instance = new UISoundManager();
        }
        return UISoundManager.instance;
    }

    public getVolume(): number {
        return AudioSettings.getInstance().getVolume(SoundCategory.UI);
    }

    public getEffectiveVolume(): number {
        return AudioSettings.getInstance().getEffectiveVolume(SoundCategory.UI);
    }

    public setMixFactors(master: number, sfx: number) {
        // Automatically coordinated by new global settings
    }

    public setVolume(vol: number) {
        AudioSettings.getInstance().setVolume(SoundCategory.UI, vol);
    }

    public setMuted(muted: boolean) {
        AudioSettings.getInstance().setMuted(SoundCategory.UI, muted);
    }

    public isSoundMuted(): boolean {
        return AudioSettings.getInstance().isMuted(SoundCategory.UI);
    }

    public playSFX(key: 'click' | 'confirm' | 'cancel' | 'reveal' | 'ready' | 'fight' | 'ko') {
        NewUISoundManager.getInstance().playSFX(key);
    }

    public stopAllUI() {
        NewUISoundManager.getInstance().stopAllUI();
    }
}
export default UISoundManager;
