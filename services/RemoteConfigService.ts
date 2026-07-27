import { APIManager, AppConfigData } from './APIManager';

export class RemoteConfigService {
    private static cachedConfig: AppConfigData | null = null;
    
    // Default fallback locally
    private static defaultConfig: AppConfigData = {
        game_version: "1.0.0",
        maintenance_mode: false,
        update_url: "https://example.com",
        currentVersion: "1.0.0",
        forceUpdate: false,
        maintenance: false,
        updateMessage: "Atualize o jogo para acessar o multiplayer online.",
        downloadUrl: "https://example.com"
    };

    static async fetchConfig(forceRefresh: boolean = false): Promise<AppConfigData> {
        if (!forceRefresh && this.cachedConfig) {
            return this.cachedConfig;
        }

        try {
            const config = await APIManager.getAppConfig();
            if (config) {
                // Save to local cache
                this.cachedConfig = config;
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('cachedAppConfig', JSON.stringify(config));
                }
                return config;
            }
        } catch (e) {
            console.error("fetchConfig failed", e);
        }

        // Try load from local storage if network fails
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('cachedAppConfig');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.cachedConfig = parsed;
                    return parsed;
                } catch(e) {}
            }
        }

        return this.cachedConfig || this.defaultConfig;
    }

    static getConfig(): AppConfigData {
        if (this.cachedConfig) return this.cachedConfig;
        
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('cachedAppConfig');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.cachedConfig = parsed;
                    return parsed;
                } catch(e) {}
            }
        }

        return this.defaultConfig;
    }
}
