// services/BattleAnnouncerManager.ts
// 100% independent and decoupled narrator announcer manager to handle battle sounds
import { AudioManager } from './AudioManager';

export class BattleAnnouncerManager {
    private static instance: BattleAnnouncerManager | null = null;

    // Tracking states for combos to avoid duplication or spamming
    private p1MilestonesPlayed: Set<number> = new Set();
    private p2MilestonesPlayed: Set<number> = new Set();
    private p1LastCombo: number = 0;
    private p2LastCombo: number = 0;

    // Throttle to ensure max power isn't played repeatedly inside a very fast window
    private lastMaxPowerTime: number = 0;

    private constructor() {}

    public static getInstance(): BattleAnnouncerManager {
        if (!BattleAnnouncerManager.instance) {
            BattleAnnouncerManager.instance = new BattleAnnouncerManager();
        }
        return BattleAnnouncerManager.instance;
    }

    /**
     * Resets of all narrator battle states
     */
    public reset(): void {
        this.p1MilestonesPlayed.clear();
        this.p2MilestonesPlayed.clear();
        this.p1LastCombo = 0;
        this.p2LastCombo = 0;
        this.lastMaxPowerTime = 0;
        console.log('[ANNOUNCER] States successfully reset for next match round.');
    }

    /**
     * Announces READY (Announcer intro)
     */
    public playReady(): void {
        console.log('[ANNOUNCER] Playing high-quality Ready...');
        AudioManager.getInstance().playSFX('narrator_ready');
    }

    /**
     * Announces FIGHT
     */
    public playFight(): void {
        console.log('[ANNOUNCER] Playing high-quality Fight...');
        AudioManager.getInstance().playSFX('narrator_fight');
    }

    /**
     * Announces character TAG swap (Change)
     */
    public playChange(): void {
        console.log('[ANNOUNCER] Playing high-quality Change callout...');
        AudioManager.getInstance().playSFX('narrator_change');
    }

    /**
     * Announces MAXIMO POWER (Maximum PowerReached)
     */
    public playMaxPower(): void {
        const now = Date.now();
        // 5 seconds debounce to prevent overlapping plays
        if (now - this.lastMaxPowerTime > 5000) {
            console.log('[ANNOUNCER] Playing high-quality Maximo Power...');
            AudioManager.getInstance().playSFX('narrator_max_power');
            this.lastMaxPowerTime = now;
        }
    }

    /**
     * Announces PERFECT victory round
     */
    public playPerfect(): void {
        console.log('[ANNOUNCER] Playing Perfect Announcer Voice!');
        AudioManager.getInstance().playSFX('narrator_perfect');
    }

    /**
     * Updates and monitors player combo state transitions to play callouts
     */
    public updateCombo(isP1: boolean, currentCombo: number): void {
        const lastCombo = isP1 ? this.p1LastCombo : this.p2LastCombo;
        const milestones = isP1 ? this.p1MilestonesPlayed : this.p2MilestonesPlayed;

        if (isP1) {
            this.p1LastCombo = currentCombo;
        } else {
            this.p2LastCombo = currentCombo;
        }

        // Combo ended or reset
        if (currentCombo === 0) {
            if (lastCombo > 0) {
                milestones.clear();
            }
            return;
        }

        // Check Milestones ascending
        if (currentCombo > lastCombo) {
            if (currentCombo >= 35) {
                if (!milestones.has(35)) {
                    milestones.add(35);
                    console.log(`[ANNOUNCER] Combo milestone 35 hits reached! Playing Wonderful Power.`);
                    AudioManager.getInstance().playSFX('narrator_wonderful_power');
                }
            } else if (currentCombo >= 24) {
                if (!milestones.has(24)) {
                    milestones.add(24);
                    console.log(`[ANNOUNCER] Combo milestone 24 hits reached! Playing Excellent.`);
                    AudioManager.getInstance().playSFX('narrator_excellent_combo');
                }
            } else if (currentCombo >= 14) {
                if (!milestones.has(14)) {
                    milestones.add(14);
                    console.log(`[ANNOUNCER] Combo milestone 14 hits reached! Playing Great.`);
                    AudioManager.getInstance().playSFX('narrator_great_combo');
                }
            } else if (currentCombo >= 7) {
                if (!milestones.has(7)) {
                    milestones.add(7);
                    console.log(`[ANNOUNCER] Combo milestone 7 hits reached! Playing Nice.`);
                    AudioManager.getInstance().playSFX('narrator_nice_combo');
                }
            }
        }
    }
}
export default BattleAnnouncerManager;
