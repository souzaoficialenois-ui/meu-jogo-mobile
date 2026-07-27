// ManifestManager.ts - Manages local & remote configurations, category list file metadata and active vocal settings.

export interface PackMetadata {
    version?: number;
    required?: boolean;
    optional?: boolean;
    size: string;
    hash?: string;
}

export interface RemoteManifest {
    core_audio: PackMetadata;
    voice_packs: Record<string, PackMetadata>;
    music_packs?: Record<string, PackMetadata>;
}

// File-by-File Manifest Definition for First Launch System
export interface AssetFile {
    path: string;       // File path or virtual storage key
    sizeBytes: number;  // File size in bytes for progress calculators
    sizeStr: string;    // User readable size
    category: 'Músicas' | 'Efeitos Sonoros' | 'Animações' | 'Personagens' | 'UI Básica';
    hash: string;       // Checksum hash for integrity validation
    required: boolean;  // Must be installed before playing
}

export interface GameAssetsManifest {
    version: string;
    lastUpdated: string;
    files: AssetFile[];
}

export class ManifestManager {
    private static readonly LOCAL_MANIFEST_KEY = 'dd_local_manifest_v1';
    private static readonly ACTIVE_LANGUAGE_KEY = 'dd_active_voice_lang';

    // 1. Classical metadata (for backwards compatibility with settings or standard preloader pack system)
    private static CURRENT_REMOTE_MANIFEST: RemoteManifest = {
        core_audio: {
            version: 3,
            required: true,
            size: "45MB",
            hash: "sha256_core_audio_v3_98a7cbd"
        },
        voice_packs: {
            pt_br: {
                optional: true,
                size: "120MB",
                hash: "sha256_voice_pt_br_v1_0a3b"
            },
            en_us: {
                optional: true,
                size: "118MB",
                hash: "sha256_voice_en_us_v1_d892"
            },
            jp: {
                optional: true,
                size: "240MB",
                hash: "sha256_voice_jp_v1_9e4c"
            }
        },
        music_packs: {
            music_ost: {
                version: 2,
                optional: true,
                size: "95MB",
                hash: "sha256_music_ost_v2_f812"
            }
        }
    };

    // 2. New File-level Manifest comprising all mandatory first launch resources
    private static LATEST_ASSETS_MANIFEST: GameAssetsManifest = {
        version: "2.2.0",
        lastUpdated: "2026-05-30T20:00:00Z",
        files: [
            // Category: Músicas do Sistema
            {
                path: "audio/system/menu_music.ogg",
                sizeBytes: 1572864, // 1.5MB
                sizeStr: "1.5 MB",
                category: "Músicas",
                hash: "fnv1a_0a7be251",
                required: true
            },
            {
                path: "audio/system/battle_music.ogg",
                sizeBytes: 2202009, // 2.1MB
                sizeStr: "2.1 MB",
                category: "Músicas",
                hash: "fnv1a_1b93f2ea",
                required: true
            },
            {
                path: "audio/system/summon_music.ogg",
                sizeBytes: 1887436, // 1.8MB
                sizeStr: "1.8 MB",
                category: "Músicas",
                hash: "fnv1a_c920f12d",
                required: true
            },

            // Category: Efeitos Sonoros
            {
                path: "audio/system/click.ogg",
                sizeBytes: 81920, // 80KB
                sizeStr: "80 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_8fa1b203",
                required: true
            },
            {
                path: "audio/system/punch.ogg",
                sizeBytes: 122880, // 120KB
                sizeStr: "120 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_c35fde18",
                required: true
            },
            {
                path: "audio/system/block.ogg",
                sizeBytes: 92160, // 90KB
                sizeStr: "90 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_b5e28cd1",
                required: true
            },
            {
                path: "audio/system/ready.ogg",
                sizeBytes: 153600, // 150KB
                sizeStr: "150 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_d83ffe92",
                required: true
            },
            {
                path: "audio/system/fight.ogg",
                sizeBytes: 163840, // 160KB
                sizeStr: "160 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_ea3b2f91",
                required: true
            },
            {
                path: "audio/system/ko.ogg",
                sizeBytes: 143360, // 140KB
                sizeStr: "140 KB",
                category: "Efeitos Sonoros",
                hash: "fnv1a_7cfa029f",
                required: true
            },

            // Category: Animações Essenciais
            {
                path: "EFEITOS/COMBO/1.gif",
                sizeBytes: 430080, // 420KB
                sizeStr: "420 KB",
                category: "Animações",
                hash: "fnv1a_ff21503c",
                required: true
            },
            {
                path: "AURA/1.gif",
                sizeBytes: 542720, // 530KB
                sizeStr: "530 KB",
                category: "Animações",
                hash: "fnv1a_ab110d9e",
                required: true
            },
            {
                path: "AURA/11.gif",
                sizeBytes: 655360, // 640KB
                sizeStr: "640 KB",
                category: "Animações",
                hash: "fnv1a_db44bc2f",
                required: true
            },

            // Category: Personagem Inicial (Goku Base)
            {
                path: "personagens/goku/idle.gif",
                sizeBytes: 1003520, // 980KB
                sizeStr: "980 KB",
                category: "Personagens",
                hash: "fnv1a_0a3f78dc",
                required: true
            },
            {
                path: "personagens/goku/walk.gif",
                sizeBytes: 768000, // 750KB
                sizeStr: "750 KB",
                category: "Personagens",
                hash: "fnv1a_5a21e428",
                required: true
            },
            {
                path: "personagens/goku/intro.gif",
                sizeBytes: 1153433, // 1.1MB
                sizeStr: "1.1 MB",
                category: "Personagens",
                hash: "fnv1a_ee33fc88",
                required: true
            },
            {
                path: "personagens/goku/charge.gif",
                sizeBytes: 1363148, // 1.3MB
                sizeStr: "1.3 MB",
                category: "Personagens",
                hash: "fnv1a_ab4900c2",
                required: true
            },

            // Category: UI Básica
            {
                path: "images/ui/hud_health.webp",
                sizeBytes: 317440, // 310KB
                sizeStr: "310 KB",
                category: "UI Básica", // matched dynamically
                hash: "fnv1a_d82efc90",
                required: true
            },
            {
                path: "images/ui/button_menu.webp",
                sizeBytes: 97280, // 95KB
                sizeStr: "95 KB",
                category: "UI Básica",
                hash: "fnv1a_b5e9ca33",
                required: true
            },
            {
                path: "images/ui/joystick_base.webp",
                sizeBytes: 128000, // 125KB
                sizeStr: "125 KB",
                category: "UI Básica",
                hash: "fnv1a_eeef0142",
                required: true
            }
        ]
    };

    /**
     * Simulates fetching manifest.json from the remote CDN server.
     * Supports connectivity testing, retry, and latency modeling.
     */
    public static async fetchRemoteManifest(): Promise<RemoteManifest> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(JSON.parse(JSON.stringify(this.CURRENT_REMOTE_MANIFEST)));
            }, 300); // Small realistic delay
        });
    }

    /**
     * Fetches the latest file-level manifest from server CDN
     */
    public static async fetchLatestManifest(): Promise<GameAssetsManifest> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(JSON.parse(JSON.stringify(this.LATEST_ASSETS_MANIFEST)));
            }, 400); // Small realistic network latency
        });
    }

    /**
     * Get local status manifest dictionary mapping file paths to statuses
     */
    public static getLocalManifest(): Record<string, { version: number; installed: boolean; hash: string }> {
        const saved = localStorage.getItem(this.LOCAL_MANIFEST_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {};
            }
        }
        return {};
    }

    /**
     * Update local manifest details of completed chunks or packs
     */
    public static saveLocalManifest(key: string, version: number, installed: boolean, hash: string) {
        const local = this.getLocalManifest();
        local[key] = { version, installed, hash };
        localStorage.setItem(this.LOCAL_MANIFEST_KEY, JSON.stringify(local));
    }

    /**
     * Remove key from local manifest
     */
    public static removeLocalManifestPack(key: string) {
        const local = this.getLocalManifest();
        delete local[key];
        localStorage.setItem(this.LOCAL_MANIFEST_KEY, JSON.stringify(local));
    }

    /**
     * Check if a pack is fully installed locally and up to date
     */
    public static isPackInstalled(key: string): boolean {
        const local = this.getLocalManifest();
        const pack = local[key];
        if (!pack || !pack.installed) return false;

        // Verify if it is up-to-date with remote
        if (key === 'core_audio') {
            return pack.version >= this.CURRENT_REMOTE_MANIFEST.core_audio.version!;
        } else {
            const remotePack = this.CURRENT_REMOTE_MANIFEST.voice_packs[key] || this.CURRENT_REMOTE_MANIFEST.music_packs?.[key];
            if (remotePack && remotePack.version !== undefined) {
                return pack.version >= remotePack.version;
            }
        }
        return true;
    }

    /**
     * Check if an update is available for an installed pack
     */
    public static isUpdateAvailable(key: string): boolean {
        const local = this.getLocalManifest();
        const pack = local[key];
        if (!pack || !pack.installed) return false;

        if (key === 'core_audio') {
            return pack.version < this.CURRENT_REMOTE_MANIFEST.core_audio.version!;
        } else {
            const remotePack = this.CURRENT_REMOTE_MANIFEST.voice_packs[key] || this.CURRENT_REMOTE_MANIFEST.music_packs?.[key];
            if (remotePack && remotePack.version !== undefined) {
                 return pack.version < remotePack.version;
            }
        }
        return false;
    }

    /**
     * Track active vocal language selected by player
     */
    public static getActiveLanguage(): string {
        return localStorage.getItem(this.ACTIVE_LANGUAGE_KEY) || 'pt_br';
    }

    public static setActiveLanguage(lang: string) {
        localStorage.setItem(this.ACTIVE_LANGUAGE_KEY, lang);
    }
}
