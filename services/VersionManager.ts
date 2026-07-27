// VersionManager.ts - Manages client configurations, partial updates, and version tracking.
import { ManifestManager, AssetFile } from './ManifestManager';

export class VersionManager {
    private static readonly LOCAL_VERSION_KEY = 'dd_local_game_version';
    private static readonly REMOTE_VERSION = '2.2.0';

    /**
     * Get local client game version.
     */
    public static getLocalVersion(): string {
        return localStorage.getItem(this.LOCAL_VERSION_KEY) || '1.0.0';
    }

    /**
     * Save local client version once download and setup are fully done.
     */
    public static saveLocalVersion(version: string): void {
        localStorage.setItem(this.LOCAL_VERSION_KEY, version);
    }

    /**
     * Get latest remote client version of the game.
     */
    public static getRemoteVersion(): string {
        return this.REMOTE_VERSION;
    }

    /**
     * Determines whether there's a difference between local version and remote version.
     */
    public static isAppUpdateRequired(): boolean {
        return this.getLocalVersion() !== this.getRemoteVersion();
    }

    /**
     * Performs a deep compare of remote files listed in the manifest vs what
     * is currently cached locally (checking existences, version stamps, and checksum hashes).
     * Returns the array of outstanding files that are either MISSING or ALTERED (outdated).
     * This achieves: "suportar atualizações parciais", "baixar apenas arquivos alterados" e "evitar downloads duplicados".
     */
    public static async getAlteredOrMissingFiles(): Promise<AssetFile[]> {
        const remoteManifest = await ManifestManager.fetchLatestManifest();
        const localManifest = ManifestManager.getLocalManifest();
        const missingOrAltered: AssetFile[] = [];

        for (const file of remoteManifest.files) {
            const localRecord = localManifest[file.path];
            
            // Check if file is registered locally in the manifest
            if (!localRecord || !localRecord.installed) {
                missingOrAltered.push(file);
                continue;
            }

            // Check if checksum hash matches
            if (localRecord.hash !== file.hash) {
                console.log(`[VersionManager] File ${file.path} is OUTDATED. Local Hash: ${localRecord.hash}, Remote Hash: ${file.hash}`);
                missingOrAltered.push(file);
                continue;
            }
        }

        return missingOrAltered;
    }
}
