import { Peer, DataConnection } from 'peerjs';

export class NetworkManager {
    private static instance: NetworkManager;
    public peer: Peer | null = null;
    public connection: DataConnection | null = null;
    public isHost: boolean = false;
    public id: string = "";
    
    public onConnect: (isHost: boolean, opponentId: string, profile?: any) => void = () => {};
    public onGameStart: (remoteChar?: any) => void = () => {};
    public onInputReceived: (input: any) => void = () => {};
    public onReadyReceived: () => void = () => {};
    public onDisconnect: () => void = () => {};
    public onReconnectSync: (state: any) => void = () => {};
    public onRealtimeStateSync: (state: any) => void = () => {};

    private constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log("[Network] Window online event");
                NetworkManager.notifyOnlineStatus(true);
                if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
                    console.log("[Network] Attempting to reconnect peer after window online");
                    this.peer.reconnect();
                }
            });
            window.addEventListener('offline', () => {
                console.log("[Network] Window offline event");
                NetworkManager.notifyOnlineStatus(false);
            });
        }
    }

    public static getInstance(): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }

    private getPeerOptions() {
        return {
            debug: 1,
            secure: true,
            pingInterval: 5000,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ],
                sdpSemantics: 'unified-plan'
            }
        };
    }

    private setupPeerListeners(peer: Peer) {
        peer.on('open', (id) => {
            console.log(`[Network] Peer successfully opened with ID: ${id}`);
            this.id = id;
        });

        peer.on('disconnected', () => {
            console.warn("[Network] Peer disconnected from signaling server. Attempting reconnect...");
            if (!peer.destroyed) {
                peer.reconnect();
            }
        });

        peer.on('error', (err: any) => {
            console.error(`[Network] Peer error: ${err.type}`, err);
            
            // If the peer is destroyed or has a terminal error, we should mark it as such
            if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
                console.warn("[Network] Critical peer error. Signaling server might be unreachable.");
            }
        });

        peer.on('connection', (conn) => {
            console.log(`[Network] Incoming connection from ${conn.peer}`);
            this.connection = conn;
            this.setupConnection();
        });
    }

    public async initializeHost(numericId?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.peer && !this.peer.destroyed) {
                if (this.peer.open) {
                    resolve(this.peer.id);
                    return;
                }
                // If not open but exists, wait for open or error
                this.peer.once('open', (id) => resolve(id));
                this.peer.once('error', (err) => reject(err));
                return;
            }

            this.reset();
            const peerId = 'fl1-' + (numericId || Math.floor(Math.random() * 1000000).toString());
            console.log(`[Network] Initializing host peer with preferred ID: ${peerId}`);
            
            try {
                this.peer = new Peer(peerId, this.getPeerOptions());
                this.setupPeerListeners(this.peer);
                
                this.peer.once('open', (id) => {
                    console.log(`[Network] Peer successfully opened with ID: ${id}`);
                    this.id = id;
                    resolve(id);
                });

                this.peer.once('error', (err: any) => {
                    if (err.type === 'unavailable-id') {
                        console.warn(`[Network] Peer ID ${peerId} unavailable (collision). Retrying with random ID...`);
                        this.peer = new Peer(this.getPeerOptions());
                        this.setupPeerListeners(this.peer);
                        this.peer.once('open', (id) => {
                            console.log(`[Network] Peer successfully opened with random ID: ${id}`);
                            this.id = id;
                            resolve(id);
                        });
                        this.peer.once('error', (innerErr) => reject(innerErr));
                    } else {
                        reject(err);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    public connectToPeer(peerId: string) {
        console.log(`[Network] Connecting to peer: ${peerId}`);
        if (!this.peer || this.peer.destroyed) {
            this.peer = new Peer(this.getPeerOptions());
            this.setupPeerListeners(this.peer);
            this.peer.once('open', () => {
                this.id = this.peer!.id;
                this.startConnection(peerId);
            });
        } else if (this.peer.disconnected) {
            console.log("[Network] Peer is disconnected from signaling server. Reconnecting before connecting to peer...");
            this.peer.reconnect();
            this.peer.once('open', () => this.startConnection(peerId));
        } else {
            this.startConnection(peerId);
        }
    }

    private startConnection(peerId: string, retryCount = 0) {
        if (!this.peer || this.peer.destroyed) {
            console.warn("[Network] Cannot start connection: Peer not initialized or destroyed");
            return;
        }
        
        const MAX_RETRIES = 10;
        console.log(`[Network] Starting connection to ${peerId} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        this.closeConnection(); // Close any existing
        
        try {
            this.connection = this.peer.connect(peerId, { 
                reliable: false,
                metadata: { profile: null } 
            });
            
            this.setupConnection();

            // Specific error handling for this connection attempt
            const errorHandler = (err: any) => {
                console.error(`[Network] Connection to ${peerId} failed (Type: ${err.type}):`, err);
                
                if (err.type === 'peer-unavailable' && retryCount < MAX_RETRIES) {
                    const delay = 2000 + (retryCount * 500); // Exponential backoff
                    console.warn(`[Network] Peer ${peerId} not found yet. Retrying in ${delay/1000}s...`);
                    setTimeout(() => {
                        this.startConnection(peerId, retryCount + 1);
                    }, delay);
                } else if (err.type === 'peer-unavailable') {
                    console.error(`[Network] Peer ${peerId} remains unavailable after ${MAX_RETRIES + 1} attempts.`);
                }
            };

            this.connection.once('error', errorHandler);
        } catch (err) {
            console.error("[Network] Critical error during peer.connect:", err);
        }
    }

    private setupConnection() {
        if (!this.connection) return;
        
        this.connection.on('open', () => {
            console.log(`[Network] Connection established with ${this.connection?.peer}`);
            this.onConnect(this.isHost, this.connection!.peer);
        });

        this.connection.on('data', (data: any) => {
            if (data?.type === 'INPUT') {
                this.onInputReceived(data.input);
            } else if (data?.type === 'P2P_READY') {
                 this.onReadyReceived();
            } else if (data?.type === 'GAME_START') {
                 this.onGameStart(data.char);
            } else if (data?.type === 'RECONNECT_SYNC') {
                 this.onReconnectSync(data.state);
            } else if (data?.type === 'REALTIME_STATE_SYNC') {
                 this.onRealtimeStateSync(data.state);
            }
        });
        
        this.connection.on('close', () => {
             console.log("[Network] Connection closed");
             this.onDisconnect();
             this.closeConnection();
        });

        this.connection.on('error', (err) => {
            console.error("[Network] Connection error:", err);
            this.onDisconnect();
            this.closeConnection();
        });
    }

    public sendInput(input: any) {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'INPUT', input });
        }
    }

    public sendReady() {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'P2P_READY' });
        }
    }

    public sendGameStart(char: any) {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'GAME_START', char });
        }
    }

    public sendReconnectSync(state: any) {
        if (this.connection && this.connection.open) {
            this.connection.send({ type: 'RECONNECT_SYNC', state });
        }
    }

    public closeConnection() {
        if (this.connection) {
            try {
                this.connection.close();
            } catch (e) {}
            this.connection = null;
        }
    }

    public reset() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.id = "";
        this.isHost = false;
        this.onConnect = () => {};
        this.onGameStart = () => {};
        this.onInputReceived = () => {};
        this.onDisconnect = () => {};
        this.onReconnectSync = () => {};
        this.onRealtimeStateSync = () => {};
    }

    // --- Online Status Logic ---
    private static listeners: Set<(status: boolean) => void> = new Set();
    
    static isOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    static addListener(callback: (status: boolean) => void) {
        NetworkManager.listeners.add(callback);
    }
    
    private static notifyOnlineStatus(isOnline: boolean) {
        NetworkManager.listeners.forEach(cb => cb(isOnline));
    }
}

