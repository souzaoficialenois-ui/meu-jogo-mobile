import { NetworkManager } from './NetworkManager';
import { RemoteConfigService } from './RemoteConfigService';
import { VersionChecker } from './VersionChecker';

export type OnlineStatus = 'LOADING' | 'OFFLINE_NO_INTERNET' | 'OFFLINE_SERVER_DOWN' | 'MAINTENANCE' | 'UPDATE_REQUIRED' | 'ONLINE';

export class OnlineService {
    private static status: OnlineStatus = 'LOADING';
    private static listeners: Set<(status: OnlineStatus) => void> = new Set();
    private static checkInProgress: boolean = false;
    private static initDone: boolean = false;

    static get currentStatus(): OnlineStatus {
        return this.status;
    }

    static subscribe(listener: (status: OnlineStatus) => void) {
        this.listeners.add(listener);
        listener(this.status);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private static notify() {
        this.listeners.forEach(l => l(this.status));
    }

    static async initialize() {
        if (this.initDone) return;
        this.initDone = true;

        NetworkManager.addListener((isOnline) => {
            if (isOnline) {
                if (this.status === 'OFFLINE_NO_INTERNET') {
                    this.checkStatus(true);
                }
            } else {
                this.setStatus('OFFLINE_NO_INTERNET');
            }
        });

        await this.checkStatus();
        
        // Auto retry every 5 minutes if offline for some server issue or update
        setInterval(() => {
            if (this.status !== 'ONLINE') {
                this.checkStatus(true);
            }
        }, 5 * 60 * 1000);
    }

    static async checkStatus(forceRefresh: boolean = false) {
        if (this.checkInProgress) return;
        
        if (!NetworkManager.isOnline()) {
            this.setStatus('OFFLINE_NO_INTERNET');
            return;
        }

        this.checkInProgress = true;
        // Do not update state to LOADING if it's a silent background refresh, unless we want to show loading
        if (!forceRefresh && this.status !== 'LOADING') {
             // Keep old status while checking silently
        }

        try {
            await RemoteConfigService.fetchConfig(forceRefresh);
            const config = RemoteConfigService.getConfig();

            if (config.maintenance_mode || config.maintenance) {
                this.setStatus('MAINTENANCE');
            } else if (VersionChecker.isUpdateRequired()) {
                this.setStatus('UPDATE_REQUIRED');
            } else {
                this.setStatus('ONLINE');
            }
        } catch (error) {
            console.error("OnlineService check failed:", error);
            // Fallback to offline if server is unreachable
            this.setStatus('OFFLINE_SERVER_DOWN');
        } finally {
            this.checkInProgress = false;
        }
    }

    private static setStatus(newStatus: OnlineStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.notify();
        }
    }

    public static canPlayOnline(): boolean {
        return this.status === 'ONLINE';
    }
}
