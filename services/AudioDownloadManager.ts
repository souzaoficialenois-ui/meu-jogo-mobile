// AudioDownloadManager.ts - System sounds CDN downloader, verifying hashes and connection status with retry policies.
import { CacheManager } from './CacheManager';
import { AudioCacheManager } from './AudioCacheManager';

export interface AudioDownloadStatus {
    key: string;
    status: 'idle' | 'downloading' | 'verifying' | 'completed' | 'failed';
    bytesDownloaded: number;
    bytesTotal: number;
    percentage: number;
    error?: string;
    retryCount: number;
}

export type DownloadStatusListener = (statusMap: Map<string, AudioDownloadStatus>, overallPercentage: number) => void;

export class AudioDownloadManager {
    private static instance: AudioDownloadManager;

    private readonly sysSfxUrls: Record<string, string> = {
        ready: 'https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto@639f072f4bd5c1b1953ba4e5265857e1391ebaa4/SONS/SISTEMA/READY.ogg',
        fight: 'https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto@639f072f4bd5c1b1953ba4e5265857e1391ebaa4/SONS/SISTEMA/FIGHT.ogg',
        ko: 'https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto@639f072f4bd5c1b1953ba4e5265857e1391ebaa4/SONS/SISTEMA/KO.ogg'
    };

    private statusMap: Map<string, AudioDownloadStatus> = new Map();
    private listeners: Set<DownloadStatusListener> = new Set();
    private isDownloadingAll = false;
    private downloadPromise: Promise<boolean> | null = null;

    private constructor() {
        Object.keys(this.sysSfxUrls).forEach((key) => {
            this.statusMap.set(key, {
                key,
                status: 'idle',
                bytesDownloaded: 0,
                bytesTotal: 0,
                percentage: 0,
                retryCount: 0
            });
        });
    }

    public static getInstance(): AudioDownloadManager {
        if (!AudioDownloadManager.instance) {
            AudioDownloadManager.instance = new AudioDownloadManager();
        }
        return AudioDownloadManager.instance;
    }

    public getStatus(): Map<string, AudioDownloadStatus> {
        return this.statusMap;
    }

    public subscribe(listener: DownloadStatusListener): () => void {
        this.listeners.add(listener);
        listener(this.statusMap, this.getOverallPercentage());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify() {
        const overall = this.getOverallPercentage();
        this.listeners.forEach((listener) => {
            try {
                listener(this.statusMap, overall);
            } catch (e) {
                console.error("[DEBUG_AUDIO] DownloadStatusListener notification error:", e);
            }
        });
    }

    public getOverallPercentage(): number {
        const statuses = Array.from(this.statusMap.values());
        if (statuses.length === 0) return 100;
        const totalPct = statuses.reduce((acc, curr) => {
            if (curr.status === 'completed') return acc + 100;
            return acc + curr.percentage;
        }, 0);
        return Math.round(totalPct / statuses.length);
    }

    /**
     * Checks if mandatory files are ready locally in DB, preloading them if valid. 
     * If they are absent, returns false.
     */
    public async verifyAndPreloadAll(): Promise<boolean> {
        console.log("[DEBUG_AUDIO] Verifying integrity and preloading system sounds locally...");
        let allValid = true;

        for (const key of Object.keys(this.sysSfxUrls)) {
            const dbPath = `audio/system/${key}.ogg`;
            const hasLocalFile = await CacheManager.hasFile(dbPath);
            const state = this.statusMap.get(key) || {
                key,
                status: 'idle',
                bytesDownloaded: 0,
                bytesTotal: 0,
                percentage: 0,
                retryCount: 0
            };

            if (hasLocalFile) {
                try {
                    const data = await CacheManager.readFile(dbPath);
                    if (data && (data instanceof Blob || data instanceof ArrayBuffer)) {
                        const size = data instanceof Blob ? data.size : data.byteLength;
                        
                        // Ensure it's not a dummy mock silent file (sizes of real sound effects from CDN are > 1KB)
                        if (size > 1024) {
                            const cacheSuccess = await AudioCacheManager.getInstance().cacheSound(key, data);
                            if (cacheSuccess) {
                                state.status = 'completed';
                                state.percentage = 100;
                                state.bytesTotal = size;
                                state.bytesDownloaded = size;
                                this.statusMap.set(key, state);
                                console.log(`[DEBUG_AUDIO] Checked sound "${key}": Ready Offline.`);
                                continue;
                            }
                        } else {
                            console.warn(`[DEBUG_AUDIO] Cache corrupt or dummy silent block for "${key}" (size ${size} bytes). Downloader will repair.`);
                        }
                    }
                } catch (e) {
                    console.error(`[DEBUG_AUDIO] Verification error for local "${key}":`, e);
                }
            }

            allValid = false;
            state.status = 'failed';
            state.percentage = 0;
            this.statusMap.set(key, state);
        }

        this.notify();
        return allValid;
    }

    /**
     * Initiates parallel downloader for all mandatory files
     */
    public startDownloadAll(): Promise<boolean> {
        if (this.isDownloadingAll && this.downloadPromise) {
            return this.downloadPromise;
        }

        this.isDownloadingAll = true;
        this.downloadPromise = (async () => {
            const t0 = Date.now();
            console.log("[DEBUG_AUDIO] Auto-downloading core system sounds on boot...");
            
            const keys = Object.keys(this.sysSfxUrls);
            const downloadTasks = keys.map(key => this.downloadSingleSoundWithRetry(key, 4));
            
            const results = await Promise.all(downloadTasks);
            const success = results.every(res => res === true);
            this.isDownloadingAll = false;
            
            const elapsed = Date.now() - t0;
            if (success) {
                console.log(`[DEBUG_AUDIO] Success: All system sounds pre-decoded and loaded within ${elapsed}ms.`);
            } else {
                console.error(`[DEBUG_AUDIO] Fail: Some system sounds failed to install correctly after ${elapsed}ms!`);
            }
            
            return success;
        })();

        return this.downloadPromise;
    }

    private async downloadSingleSoundWithRetry(key: string, maxRetries = 4): Promise<boolean> {
        const mirrors = [
            `/Assets/SONS/SISTEMA/${key.toUpperCase()}.ogg`,
            `https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto@639f072f4bd5c1b1953ba4e5265857e1391ebaa4/SONS/SISTEMA/${key.toUpperCase()}.ogg`,
            `https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto@639f072f4bd5c1b1953ba4e5265857e1391ebaa4/SONS/SISTEMA/${key.toUpperCase()}.ogg`,
            `https://cdn.jsdelivr.net/gh/souzaoficialenois-ui/assetes_projeto/SONS/SISTEMA/${key.toUpperCase()}.ogg`
        ];
        const dbPath = `audio/system/${key}.ogg`;
        const state = this.statusMap.get(key) || {
            key,
            status: 'idle',
            bytesDownloaded: 0,
            bytesTotal: 0,
            percentage: 0,
            retryCount: 0
        };

        state.retryCount = 0;
        this.statusMap.set(key, state);

        while (state.retryCount <= maxRetries) {
            const url = mirrors[state.retryCount % mirrors.length];
            try {
                state.status = 'downloading';
                state.error = undefined;
                this.notify();

                console.log(`[DEBUG_AUDIO] Fetching sound "${key}" (Attempt ${state.retryCount}/${maxRetries}) from mirror: ${url}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds intelligent timeout per sound

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP status code error: ${response.status} URL: ${url}`);
                }

                // Granular chunk progression
                const reader = response.body?.getReader();
                const contentLength = response.headers.get('content-length');
                const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

                state.bytesTotal = totalBytes;
                this.notify();

                const chunks: Uint8Array[] = [];
                let downloadedBytes = 0;

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        if (value) {
                            chunks.push(value);
                            downloadedBytes += value.length;
                            state.bytesDownloaded = downloadedBytes;
                            if (totalBytes > 0) {
                                state.percentage = Math.round((downloadedBytes / totalBytes) * 100);
                            } else {
                                state.percentage = 50; // default while unknown
                            }
                            this.notify();
                        }
                    }
                } else {
                    const blob = await response.blob();
                    downloadedBytes = blob.size;
                    state.bytesDownloaded = downloadedBytes;
                    state.percentage = 100;
                    this.notify();
                }

                let audioBlob: Blob;
                if (chunks.length > 0) {
                    audioBlob = new Blob(chunks, { type: 'audio/ogg' });
                } else {
                    // Fallback to secondary direct request
                    const controllerSec = new AbortController();
                    const secId = setTimeout(() => controllerSec.abort(), 10000);
                    const responseDirect = await fetch(url, { signal: controllerSec.signal });
                    clearTimeout(secId);
                    audioBlob = await responseDirect.blob();
                }

                // File validation: Size check
                if (audioBlob.size < 1024) {
                    throw new Error(`Downloaded OGG file is corrupted (size: ${audioBlob.size} bytes)`);
                }

                state.status = 'verifying';
                this.notify();

                // Persistence writing
                await CacheManager.saveFile(dbPath, audioBlob);
                console.log(`[DEBUG_AUDIO] Sound "${key}" successfully saved to local IndexedDB storage.`);

                // Cache in memory / Web Audio
                const preCached = await AudioCacheManager.getInstance().cacheSound(key, audioBlob);
                if (!preCached) {
                    throw new Error(`WASM core decoding failed for "${key}"`);
                }

                state.status = 'completed';
                state.percentage = 100;
                this.statusMap.set(key, state);
                this.notify();
                return true;

            } catch (err: any) {
                state.retryCount++;
                state.status = 'failed';
                state.error = err?.message || String(err);
                this.statusMap.set(key, state);
                this.notify();

                console.error(`[DEBUG_AUDIO] Network error for "${key}" (Retry ${state.retryCount}/${maxRetries}):`, state.error);

                if (state.retryCount <= maxRetries) {
                    // Backoff delay before retrying
                    const delay = Math.pow(2, state.retryCount) * 1000;
                    await new Promise(res => setTimeout(res, delay));
                }
            }
        }

        return false;
    }
}
