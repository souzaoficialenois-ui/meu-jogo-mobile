/**
 * CpuStreakManager
 * Tracks the human player's win streak against CPU opponents.
 * Used by AIController to gradually increase CPU aggressiveness and difficulty
 * as the player builds a win streak.
 */

export class CpuStreakManager {
  private static STORAGE_KEY = 'fighter_legend_cpu_win_streak';
  private static MAX_RECORDED_STREAK = 'fighter_legend_cpu_max_win_streak';
  private static listeners: Array<(streak: number) => void> = [];

  public static getStreak(): number {
    if (typeof localStorage === 'undefined') return 0;
    const val = localStorage.getItem(this.STORAGE_KEY);
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  public static getMaxStreak(): number {
    if (typeof localStorage === 'undefined') return 0;
    const val = localStorage.getItem(this.MAX_RECORDED_STREAK);
    if (!val) return 0;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  public static recordWin(): number {
    const current = this.getStreak();
    const newStreak = current + 1;
    this.setStreak(newStreak);

    const maxStreak = this.getMaxStreak();
    if (newStreak > maxStreak) {
      this.setMaxStreak(newStreak);
    }

    return newStreak;
  }

  public static recordLoss(): number {
    this.setStreak(0);
    return 0;
  }

  public static setStreak(streak: number): void {
    if (typeof localStorage !== 'undefined') {
      const sanitized = Math.max(0, streak);
      localStorage.setItem(this.STORAGE_KEY, sanitized.toString());
      this.notifyListeners(sanitized);
    }
  }

  public static setMaxStreak(maxStreak: number): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.MAX_RECORDED_STREAK, Math.max(0, maxStreak).toString());
    }
  }

  public static resetStreak(): void {
    this.setStreak(0);
  }

  public static subscribe(listener: (streak: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(streak: number): void {
    this.listeners.forEach(l => {
      try {
        l(streak);
      } catch (err) {
        console.error('Error in CpuStreakManager listener:', err);
      }
    });
  }

  /**
   * Calculates the aggressiveness and skill multiplier boost based on current win streak.
   * E.g., Streak 0 = 1.0x (No boost), Streak 1 = +8% boost, Streak 5 = +35% boost, etc.
   */
  public static getAggressivenessMultiplier(streak: number = this.getStreak()): number {
    if (streak <= 0) return 1.0;
    // Smooth logarithmic curve capping at 1.5x boost around streak 8+
    return 1.0 + Math.min(0.50, streak * 0.08);
  }
}
