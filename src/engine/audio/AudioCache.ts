// src/engine/audio/AudioCache.ts
import { Howl } from 'howler';
import { CacheManager } from '../../../services/CacheManager';
import { ManifestManager } from '../../../services/ManifestManager';
import { AUDIO_MANIFEST, SoundCategory } from './AudioManifest';
import { localizeUrl } from '../../../services/UrlLocalizer';

export class AudioCache {
    private static instance: AudioCache;
    private registry: Map<string, Howl> = new Map();
    private blobUrls: Map<string, string> = new Map();

    private constructor() {
        // Setup initial listeners if required
    }

    public static getInstance(): AudioCache {
        if (!AudioCache.instance) {
            AudioCache.instance = new AudioCache();
        }
        return AudioCache.instance;
    }

    /**
     * Resolves local virtual file paths to blob URLs or falls back to public URLs
     */
    public async resolveAssetPath(key: string, category: SoundCategory): Promise<string> {
        // Enforce voice package checks early on to block unwanted online streams & downloads
        if (category === SoundCategory.VOICE) {
            const lowerKey = key.toLowerCase();
            const isExternalUrl = lowerKey.startsWith('http') || lowerKey.includes('github') || lowerKey.includes('raw.githubusercontent');
            if (!isExternalUrl) {
                let targetLang = ManifestManager.getActiveLanguage() || 'pt_br';
                
                if (lowerKey.includes('en_us')) {
                    targetLang = 'en_us';
                } else if (lowerKey.includes('jp')) {
                    targetLang = 'jp';
                } else if (lowerKey.includes('pt_br') || lowerKey.includes('dublagem')) {
                    targetLang = 'pt_br';
                }
                
                const isTargetInstalled = ManifestManager.isPackInstalled(targetLang);
                if (!isTargetInstalled) {
                    throw new Error(`[AUDIO_CACHE] Voice pack for ${targetLang} is not installed. Blocking voice play/download for key: ${key}`);
                }
            }
        }

        if (key.startsWith('http://') || key.startsWith('https://')) {
            return key;
        }

        let virtualPath = '';

        if (category === SoundCategory.UI || category === SoundCategory.SFX) {
            virtualPath = `audio/core/${key}.ogg`;
        } else if (category === SoundCategory.BGM) {
            // Map BGM shorthand keys
            const trackMapping: Record<string, string> = {
                menu: 'audio/music/menu.ogg',
                battle: 'audio/music/battle.ogg',
                summon: 'audio/music/summon.ogg',
                'char-select': 'audio/music/char_select.ogg'
            };
            virtualPath = trackMapping[key] || `audio/music/${key}.ogg`;
        } else if (category === SoundCategory.VOICE) {
            const lang = ManifestManager.getActiveLanguage() || 'pt_br';
            virtualPath = `audio/voices/${lang}/${key}.ogg`;
        }

        try {
            // 1. Check if the asset already has an active Blob URL constructed in this session
            if (this.blobUrls.has(virtualPath)) {
                return this.blobUrls.get(virtualPath)!;
            }

            // 2. Check localized persistent Offline database disk
            const hasOfflineFile = await CacheManager.hasFile(virtualPath);
            if (hasOfflineFile) {
                const blobUrl = await CacheManager.getFileBlobUrl(virtualPath);
                if (blobUrl) {
                    this.blobUrls.set(virtualPath, blobUrl);
                    console.log(`[AUDIO_CACHE] Resolved offline disk source for ${key}: ${virtualPath}`);
                    return blobUrl;
                }
            }

            // 3. Fallback level 1: default voice pack language pt_br fallback if request is voice and language isn't pt_br
            if (category === SoundCategory.VOICE) {
                const defaultVoPath = `audio/voices/pt_br/${key}.ogg`;
                if (await CacheManager.hasFile(defaultVoPath)) {
                    const fallbackBlobUrl = await CacheManager.getFileBlobUrl(defaultVoPath);
                    if (fallbackBlobUrl) {
                        this.blobUrls.set(defaultVoPath, fallbackBlobUrl);
                        console.log(`[AUDIO_CACHE] Resolved fallback language (PT_BR) track for voice ${key}`);
                        return fallbackBlobUrl;
                    }
                }
            }
        } catch (err) {
            console.warn(`[AUDIO_CACHE] Offline disk verification error for sound: ${key}, path: ${virtualPath}`, err);
        }

        // Check if voice packs are installed before fallback streaming/play
        if (category === SoundCategory.VOICE) {
            const lowerKey = key.toLowerCase();
            const isExternalUrl = lowerKey.startsWith('http') || lowerKey.includes('github') || lowerKey.includes('raw.githubusercontent');
            if (!isExternalUrl) {
                const activeLang = ManifestManager.getActiveLanguage() || 'pt_br';
                const isLangInstalled = ManifestManager.isPackInstalled(activeLang);
                const isDefaultInstalled = ManifestManager.isPackInstalled('pt_br');
                
                if (!isLangInstalled && !isDefaultInstalled) {
                    throw new Error(`[AUDIO_CACHE] Voice pack for ${activeLang} (and fallback pt_br) is not installed.`);
                }
                if (!isLangInstalled && activeLang !== 'pt_br') {
                    // If active lang is not installed but pt_br fallback is, but we couldn't resolve the file in pt_br offline either, prevent streaming
                    throw new Error(`[AUDIO_CACHE] Active language ${activeLang} is not installed and fallback pt_br file is missing offline.`);
                }
            }
        }

        // 4. Fallback Level 2: Retrieve public online fallback URL mapped inside absolute defaults
        let finalUrl = "";
        const manifestItem = AUDIO_MANIFEST[key];
        if (manifestItem) {
            finalUrl = localizeUrl(manifestItem.fallbackUrl);
        } else {
            finalUrl = localizeUrl(key);
        }

        // Under user rules and offline constraint, block remote CDN/GitHub requests for audio entirely
        if (finalUrl.startsWith('http://') || finalUrl.startsWith('https://') || finalUrl.includes('github') || finalUrl.includes('raw.githubusercontent') || finalUrl.includes('jsdelivr')) {
            // Return base64 encoded silent 1-second WAV audio file to satisfy Howler without making network requests
            return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA';
        }
        return finalUrl;
    }

    /**
     * Gets or compiles a Howl container for a sound key
     */
    public async getOrCreateHowl(key: string, category: SoundCategory, loop: boolean = false): Promise<Howl | null> {
        const lang = category === SoundCategory.VOICE ? (ManifestManager.getActiveLanguage() || 'pt_br') : '';
        const cacheKey = `${category}:${lang}:${key}:${loop ? 'loop' : 'once'}`;

        if (this.registry.has(cacheKey)) {
            const preservedHowl = this.registry.get(cacheKey)!;
            // Guard against broken buffers or unloaded states
            if (preservedHowl.state() === 'unloaded') {
                preservedHowl.load();
            }
            return preservedHowl;
        }

        try {
            const sourceUrl = await this.resolveAssetPath(key, category);
            
            // Create a reliable Howler instance with built-in mobile optimizations
            const howlNode = new Howl({
                src: [sourceUrl],
                format: ['ogg', 'mp3', 'opus', 'm4a', 'mp4', 'wav'], // Support .ogg, compressed WebM/opus, mp3 and .m4a/mp4 AAC audio files from CDN
                loop: loop,
                autoplay: false,
                preload: true,
                html5: category === SoundCategory.BGM, // True BGM streaming for low-memory allocation
                pool: category === SoundCategory.VOICE ? 2 : 5, // Custom pooling per sound
                volume: 0, // Handle default silencing initially, volume is managed globally inside classes
                onloaderror: (id, err) => {
                    console.warn(`[AUDIO_CACHE] Howl compile onloaderror for sound key: ${key}, url: ${sourceUrl}. Reason:`, err);
                },
                onplayerror: (id, err) => {
                    console.warn(`[AUDIO_CACHE] Howl playerror occurred for sound key: ${key}. Reason:`, err);
                }
            });

            this.registry.set(cacheKey, howlNode);
            return howlNode;
        } catch (creationErr) {
            console.error(`[AUDIO_CACHE] Failed creating Howl for "${key}" in category [${category}]`, creationErr);
            return null;
        }
    }

    /**
     * Preloads sound assets into memory to suppress micro-stutters during actual battle play
     */
    public getAllBGMHowls(): Howl[] {
        const bgmHowls: Howl[] = [];
        this.registry.forEach((howl, cacheKey) => {
            if (cacheKey.startsWith(`${SoundCategory.BGM}:`)) {
                bgmHowls.push(howl);
            }
        });
        return bgmHowls;
    }

    /**
     * Preloads sound assets into memory to suppress micro-stutters during actual battle play
     */
    public async preloadGroup(keys: string[], category: SoundCategory): Promise<void> {
        console.log(`[AUDIO_CACHE] Starting batch preload of ${keys.length} items in category [${category}]`);
        const preloads = keys.map(async (key) => {
            try {
                await this.getOrCreateHowl(key, category, false);
            } catch (err) {
                console.warn(`[AUDIO_CACHE] Preload failure on sound: ${key}`, err);
            }
        });
        await Promise.all(preloads);
    }

    /**
     * Clears and unloads cache components
     */
    public clearCache() {
        console.log('[AUDIO_CACHE] Resetting registry caches...');
        this.registry.forEach((howl) => {
            try {
                howl.unload();
            } catch {}
        });
        this.registry.clear();

        // Release URL pointers to prevent memory retention leaks
        this.blobUrls.forEach((url) => {
            try {
                URL.revokeObjectURL(url);
            } catch {}
        });
        this.blobUrls.clear();
    }
}
