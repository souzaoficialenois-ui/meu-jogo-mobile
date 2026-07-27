// services/BattleSFXManager.ts - Backwards-compatible proxy routing high priority battle sfx to our new Howler SFX Manager
import { SFXManager as NewSFXManager } from '../src/engine/audio/SFXManager';
import { AudioSettings } from '../src/engine/audio/AudioSettings';
import { SoundCategory } from '../src/engine/audio/AudioManifest';
import { AudioManager } from './AudioManager';

export enum SFXPriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2
}

export class BattleSFXManager {
    private static instance: BattleSFXManager;

    private constructor() {}

    public static getInstance(): BattleSFXManager {
        if (!BattleSFXManager.instance) {
            BattleSFXManager.instance = new BattleSFXManager();
        }
        return BattleSFXManager.instance;
    }

    public getVolume(): number {
        return AudioSettings.getInstance().getVolume(SoundCategory.SFX);
    }

    public getEffectiveVolume(): number {
        return AudioSettings.getInstance().getEffectiveVolume(SoundCategory.SFX);
    }

    public setMixFactors(master: number, sfx: number) {
        // Automatically coordinated by new global settings
    }

    public setVolume(vol: number) {
        AudioSettings.getInstance().setVolume(SoundCategory.SFX, vol);
    }

    public setMuted(muted: boolean) {
        AudioSettings.getInstance().setMuted(SoundCategory.SFX, muted);
    }

    public isSFXMuted(): boolean {
        return AudioSettings.getInstance().isMuted(SoundCategory.SFX);
    }

    public playSFX(key: string, customMultiplier: number = 1.0) {
        if (!AudioManager.isInBattle) {
            const isWhiteListed = [
                'click', 'confirm', 'cancel', 'reveal', 'summon',
                'ready', 'fight', 'ko', 'victory', 'defeat',
                'narrator_ready', 'narrator_fight', 'narrator_change', 
                'narrator_nice_combo', 'narrator_great_combo',
                'narrator_excellent_combo', 'narrator_wonderful_power', 
                'narrator_max_power', 'narrator_perfect'
            ].includes(key) || key.toLowerCase().includes('intro');

            if (!isWhiteListed) {
                return;
            }
        }
        NewSFXManager.getInstance().playSFX(key, customMultiplier);
    }

    public stopAllSFX() {
        NewSFXManager.getInstance().stopAllSFX();
    }
}
export { SFXPriority as BattleSFXPriority };
export default BattleSFXManager;
