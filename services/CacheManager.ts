// CacheManager.ts - Local IndexedDB persistence representing getExternalFilesDir() storage.
export class CacheManager {
    private static readonly DB_NAME = 'dragon_duel_downloads_db';
    private static readonly STORE_NAME = 'downloaded_assets_v2';
    private static db: IDBDatabase | null = null;

    private static initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB is not supported in this environment.'));
                return;
            }

            const request = indexedDB.open(this.DB_NAME, 2);

            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = (e: any) => {
                this.db = e.target.result;
                resolve(this.db!);
            };

            request.onerror = (e) => {
                console.error("IndexedDB open error", e);
                reject(request.error);
            };
        });
    }

    /**
     * Save a virtual file buffer/blob locally
     */
    public static async saveFile(filePath: string, content: Blob | ArrayBuffer): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.put(content, filePath);
            
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Read a virtual file blob/buffer from local storage
     */
    public static async readFile(filePath: string): Promise<Blob | ArrayBuffer | null> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.get(filePath);

            req.onsuccess = () => {
                resolve(req.result || null);
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Retrieve a resolved blob URL of local file
     */
    public static async getFileBlobUrl(filePath: string): Promise<string | null> {
        try {
            const data = await this.readFile(filePath);
            if (!data) return null;
            const blob = data instanceof Blob ? data : new Blob([data]);
            return URL.createObjectURL(blob);
        } catch (e) {
            console.warn(`Failed to create blob URL for ${filePath}`, e);
            return null;
        }
    }

    /**
     * Delete file from local storage
     */
    public static async deleteFile(filePath: string): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.delete(filePath);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Delete all files matching a directory prefix
     */
    public static async deleteFolder(dirPrefix: string): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.openKeyCursor();

            req.onsuccess = (e: any) => {
                const cursor = e.target.result;
                if (cursor) {
                    const key = cursor.primaryKey as string;
                    if (key.startsWith(dirPrefix)) {
                        store.delete(key);
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Checks if file exists in the simulated disk
     */
    public static async hasFile(filePath: string): Promise<boolean> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const req = store.count(filePath);
            req.onsuccess = () => {
                resolve(req.result > 0);
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Get list of all installed file paths
     */
    public static async getAllFiles(): Promise<string[]> {
        try {
            const db = await this.initDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.STORE_NAME, 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const req = store.getAllKeys();
                req.onsuccess = () => resolve(req.result as string[]);
                req.onerror = () => reject(req.error);
            });
        } catch {
            return [];
        }
    }
}
