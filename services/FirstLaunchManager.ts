// FirstLaunchManager.ts - Manages logic around first execution checking and restrictions.
import { ManifestManager } from './ManifestManager';

export class FirstLaunchManager {
    private static readonly FIRST_LAUNCH_DONE_KEY = 'dd_first_launch_done_v2';

    /**
     * Checks if this is the first execution of the application
     */
    public static isFirstLaunch(): boolean {
        const done = localStorage.getItem(this.FIRST_LAUNCH_DONE_KEY);
        if (done === 'true') {
            return false;
        }
        return true;
    }

    /**
     * Marks the first launch phase as completed once mandatory resources finish downloading
     */
    public static markFirstLaunchCompleted(): void {
        localStorage.setItem(this.FIRST_LAUNCH_DONE_KEY, 'true');
        console.log("FirstLaunchManager: First launch phase successfully COMPLETED.");
    }

    /**
     * Resets first launch status (useful for development testing of the download screen)
     */
    public static resetFirstLaunch(): void {
        localStorage.removeItem(this.FIRST_LAUNCH_DONE_KEY);
        console.log("FirstLaunchManager: First launch status has been RESET.");
    }
}
