// BattleAudioManager.ts - Backward-compatible wrapper delegating directly to BattleSFXManager
import { BattleSFXManager } from './BattleSFXManager';

export class BattleAudioManager {
    private static instance: BattleAudioManager;

    private constructor() {}

    public static getInstance(): BattleAudioManager {
        if (!BattleAudioManager.instance) {
            BattleAudioManager.instance = new BattleAudioManager();
        }
        return BattleAudioManager.instance;
    }

    /**
     * Instantly executes a battle sound effect through our highly-optimized independent BattleSFXManager.
     */
    public playSFX(key: string, volume: number): void {
        BattleSFXManager.getInstance().playSFX(key, volume);
    }

    /**
     * Safe clean-up delegation.
     */
    public stopAllSFX() {
        BattleSFXManager.getInstance().stopAllSFX();
    }
}
