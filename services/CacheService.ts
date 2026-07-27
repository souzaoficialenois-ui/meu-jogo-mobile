export class CacheService {
    private static readonly CACHE_NAME = 'dragon-duel-assets-v1';
    private static blobUrlMap: Map<string, string> = new Map();
    private static arrayBufferMap: Map<string, ArrayBuffer> = new Map();

    /**
     * Identifica se a aplicação está rodando compilada nativamente como APK (Android/iOS)
     * através do Capacitor ou Cordova, ou se está em protocolo de aplicativo local.
     */
    public static isNativeAPK(): boolean {
        if (typeof window === 'undefined') return false;
        
        const isCapacitor = (window as any).Capacitor !== undefined;
        const isLocalProtocol = window.location.protocol === 'capacitor:' || window.location.protocol === 'file:';
        const isAndroidUserAgent = navigator.userAgent.toLowerCase().includes('android');

        return isCapacitor || isLocalProtocol || (isAndroidUserAgent && !window.location.origin.includes('localhost:3000'));
    }

    /**
     * Retorna os Buffers necessários para decodificar frames de GIFs de personagens.
     * Oferece tratamento de erro unificado e fallback robusto para evitar travamento do app.
     */
    public static async getCachedArrayBuffer(url: string): Promise<ArrayBuffer> {
        if (this.arrayBufferMap.has(url)) {
            return this.arrayBufferMap.get(url)!;
        }

        const isRemote = url.startsWith('http://') || url.startsWith('https://');

        // Se estiver rodando como APK e não for remoto, fazemos fetch direto local.
        if (this.isNativeAPK() && !isRemote) {
            try {
                const resp = await fetch(url);
                if (resp.ok) {
                    const buffer = await resp.arrayBuffer();
                    this.arrayBufferMap.set(url, buffer);
                    return buffer;
                }
            } catch (err) {
                console.warn('Direct local APK resource fetch failed for ArrayBuffer:', url, err);
            }
        }

        // Tenta usar Cache API para persistência
        const hasCacheAPI = typeof window !== 'undefined' && 'caches' in window;
        if (hasCacheAPI) {
            try {
                const cache = await caches.open(this.CACHE_NAME);
                let match = await cache.match(url);
                
                if (!match) {
                    const resp = await fetch(url);
                    if (resp.ok) {
                        try {
                            await cache.put(url, resp.clone());
                        } catch (putErr) {
                            // Ignora erros ao salvar no cache (ex: cota estourada)
                        }
                        match = resp;
                    } else {
                        const buffer = await resp.arrayBuffer();
                        this.arrayBufferMap.set(url, buffer);
                        return buffer;
                    }
                }
                
                if (match) {
                    const buffer = await match.arrayBuffer();
                    this.arrayBufferMap.set(url, buffer);
                    return buffer;
                }
            } catch (e) {
                console.warn('Cache API fetch failed, falling back to direct fetch:', e);
            }
        }

        // Fallback final: tentativa de direct fetch direta
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const buffer = await resp.arrayBuffer();
                this.arrayBufferMap.set(url, buffer);
                return buffer;
            }
            throw new Error(`HTTP status ${resp.status}`);
        } catch (e) {
            console.error('Final direct fetch fallback failed for ArrayBuffer:', url, e);
            // Retorna um buffer vazio para evitar quebrar ou travar a execução do renderizador de sprites
            const emptyBuffer = new ArrayBuffer(0);
            this.arrayBufferMap.set(url, emptyBuffer);
            return emptyBuffer;
        }
    }

    /**
     * Retorna a URL para carregar uma imagem ou áudio do jogo.
     * No Android APK, retornamos a própria rota local do assets instalados nativamente.
     * Se for um recurso remoto do GitHub, usamos Blob URLs para caching de alta performance.
     */
    public static async getCachedBlobUrl(url: string): Promise<string> {
        const isRemote = url.startsWith('http://') || url.startsWith('https://');

        // Se for uma rota local do APK, retornamos diretamente.
        if (this.isNativeAPK() && !isRemote) {
            return url; 
        }

        if (this.blobUrlMap.has(url)) {
            return this.blobUrlMap.get(url)!;
        }

        const hasCacheAPI = typeof window !== 'undefined' && 'caches' in window;
        if (hasCacheAPI) {
            try {
                const cache = await caches.open(this.CACHE_NAME);
                let match = await cache.match(url);
                
                if (!match) {
                    const resp = await fetch(url);
                    if (resp.ok) {
                        try {
                            await cache.put(url, resp.clone());
                        } catch (putErr) {
                            // Ignora erros ao salvar no cache
                        }
                        match = resp;
                    }
                }
                
                if (match) {
                    const blob = await match.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    this.blobUrlMap.set(url, blobUrl);
                    return blobUrl;
                }
            } catch (e) {
                console.warn('Fallback standard Cache fetch failed:', e);
            }
        }

        // Fallback final direto
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const blob = await resp.blob();
                const blobUrl = URL.createObjectURL(blob);
                this.blobUrlMap.set(url, blobUrl);
                return blobUrl;
            }
        } catch (e) {
             console.warn('Fallback direct fetch URL failed:', e);
        }

        return url;
    }

    /**
     * Limpa toda a memória cache temporária de blobs e buffers.
     * Previne vazamento de memória RAM no celular se o jogador ficar ativo por horas.
     */
    public static clearMemoryCache() {
        this.blobUrlMap.forEach(url => {
            if (url.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {
                    // Ignore revoke errors
                }
            }
        });
        this.blobUrlMap.clear();
        this.arrayBufferMap.clear();
        console.log('CacheService: Limpeza total de memória RAM executada com sucesso.');
    }

    /**
     * Deleta o banco de dados e arquivos de cache históricos persistidos pelo navegador no celular,
     * garantindo liberação imediata de armazenamento em disco.
     */
    public static async wipeAllPersistentCaches(): Promise<boolean> {
        this.clearMemoryCache();
        
        if (typeof window !== 'undefined' && 'caches' in window) {
            try {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
                console.log('CacheService: Todos os caches persistentes foram excluídos do disco.');
                return true;
            } catch (err) {
                console.error('Falha ao excluir caches persistentes:', err);
            }
        }
        return false;
    }

    /**
     * Informa a quantidade aproximada de recursos temporários ativos atualmente na memória RAM.
     */
    public static getActiveResourcesCount(): { blobs: number; buffers: number } {
        return {
            blobs: this.blobUrlMap.size,
            buffers: this.arrayBufferMap.size
        };
    }
}
