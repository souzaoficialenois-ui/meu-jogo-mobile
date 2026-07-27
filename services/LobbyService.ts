
import { 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    getDoc,
    serverTimestamp,
    updateDoc,
    addDoc,
    runTransaction
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { handleFirestoreError, OperationType } from './error_handler';
import { PlayerProfile } from '../types';
import { NetworkManager } from './NetworkManager';

export interface RoomConfig {
    name: string;
    maxCharacters: number;
    isPrivate: boolean;
    password?: string;
    // Ambassador Custom Overrides
    customGravityMultiplier?: number;
    customSpeedMultiplier?: number;
    customDamageMultiplier?: number;
    customWorldWidth?: number;
    customGroundHeight?: number;
}

export class LobbyService {
    private static instance: LobbyService;

    private constructor() {}

    public static getInstance(): LobbyService {
        if (!LobbyService.instance) {
            LobbyService.instance = new LobbyService();
        }
        return LobbyService.instance;
    }

    /**
     * Join global matchmaking queue
     */
    public async joinQueue(profile: PlayerProfile, peerId: string, onMatch: (room: any) => void) {
        if (!auth.currentUser) return;
        
        const entry = {
            userId: auth.currentUser.uid,
            name: profile.name,
            numericId: profile.numericId || '00000000',
            avatarId: profile.avatarId,
            rankTier: profile.ranked?.br?.tier || 'APPRENTICE',
            title: profile.activeTitle || '',
            peerId: peerId,
            timestamp: Date.now()
        };

        try {
            await setDoc(doc(db, 'matchmaking_queue_v2', auth.currentUser.uid), entry);
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'matchmaking_queue_v2');
        }

        // Start listening for matches (rooms where I am the guest)
        return onSnapshot(
            query(collection(db, 'online_rooms_v2'), where('guestId', '==', auth.currentUser.uid), where('status', '==', 'PREPARING')),
            (snapshot) => {
                if (!snapshot.empty) {
                    const roomData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    onMatch(roomData);
                }
            },
            (error) => console.error("Lobby Match Snapshot Error:", error)
        );
    }

    public async leaveQueue() {
        if (!auth.currentUser) return;
        try {
            await deleteDoc(doc(db, 'matchmaking_queue_v2', auth.currentUser.uid));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'matchmaking_queue_v2');
        }
    }

    /**
     * Background routine to check for available opponents and pair them.
     */
    public async findOpponent(myProfile: PlayerProfile): Promise<string | null> {
        if (!auth.currentUser) return null;
        const myPeerId = NetworkManager.getInstance().id;
        if (!myPeerId) return null;

        const q = query(
            collection(db, 'matchmaking_queue_v2'), 
            where('userId', '!=', auth.currentUser.uid),
            orderBy('userId'),
            orderBy('timestamp', 'asc'),
            limit(1)
        );

        try {
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const opponent = snapshot.docs[0].data();
            
            // Try to claim the match
            const roomId = await runTransaction(db, async (transaction) => {
                const oppRef = doc(db, 'matchmaking_queue_v2', opponent.userId);
                const oppSnap = await transaction.get(oppRef);
                
                if (!oppSnap.exists()) return null;

                // Remove opponent and myself from queue
                transaction.delete(oppRef);
                transaction.delete(doc(db, 'matchmaking_queue_v2', auth.currentUser!.uid));

                // Create room with numeric ID
                const roomId = Math.floor(100000 + Math.random() * 899999).toString();
                const newRoomRef = doc(db, 'online_rooms_v2', roomId);
                
                transaction.set(newRoomRef, {
                    id: roomId,
                    hostId: auth.currentUser!.uid,
                    hostName: myProfile.name,
                    hostNumericId: myProfile.numericId || '00000000',
                    hostAvatar: myProfile.avatarId,
                    hostTitle: myProfile.activeTitle || '',
                    hostRankTier: myProfile.ranked?.br?.tier || 'APPRENTICE',
                    hostPeerId: myPeerId,
                    guestId: opponent.userId,
                    guestName: opponent.name,
                    guestNumericId: opponent.numericId || '00000000',
                    guestAvatar: opponent.avatarId || '1',
                    guestTitle: opponent.title || '',
                    guestRankTier: opponent.rankTier || 'APPRENTICE',
                    guestPeerId: opponent.peerId,
                    status: 'PREPARING',
                    maxCharacters: 1, // standard matchmaking max
                    roomName: 'Partida Rápida',
                    isPrivate: false,
                    createdAt: serverTimestamp()
                });

                return roomId;
            });

            return roomId;
        } catch (error) {
            handleFirestoreError(error, OperationType.LIST, 'matchmaking_queue_v2');
            return null;
        }
    }

    public async createCustomRoom(config: RoomConfig, profile: PlayerProfile, peerId: string): Promise<string> {
        if (!auth.currentUser) throw new Error("Autenticação necessária");

        // Generate a numeric 6-digit ID (minimum 4 digits as requested)
        let roomId = Math.floor(100000 + Math.random() * 899999).toString();
        
        console.log(`Creating custom room: ${roomId}`);
        const roomRef = doc(db, 'online_rooms_v2', roomId);

        const roomData = {
            id: roomId, 
            hostId: auth.currentUser.uid,
            hostName: profile.name,
            hostNumericId: profile.numericId || '0000',
            hostAvatar: profile.avatarId,
            hostTitle: profile.activeTitle || '',
            hostRank: profile.ranked?.br?.rank || 'Aprendiz',
            hostRankTier: profile.ranked?.br?.tier || 'APPRENTICE',
            hostSubRank: profile.ranked?.br?.subRank || 'V',
            hostWins: profile.wins || 0,
            hostLosses: profile.losses || 0,
            hostPeerId: peerId,
            hostReady: false,
            guestId: '',
            guestName: '',
            guestPeerId: '',
            guestReady: false,
            maxCharacters: config.maxCharacters,
            roomName: config.name,
            isPrivate: config.isPrivate,
            password: config.password || '',
            status: 'WAITING',
            createdAt: serverTimestamp(), // Use server timestamp
            // Ambassador Custom Overrides
            customGravityMultiplier: config.customGravityMultiplier || null,
            customSpeedMultiplier: config.customSpeedMultiplier || null,
            customDamageMultiplier: config.customDamageMultiplier || null,
            customWorldWidth: config.customWorldWidth || null,
            customGroundHeight: config.customGroundHeight || null
        };

        try {
            await setDoc(roomRef, roomData);
            console.log("Room created successfully in Firestore");
            return roomId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'online_rooms_v2');
            throw error;
        }
    }

    public async joinRoom(roomId: string, profile: PlayerProfile, peerId: string) {
        if (!auth.currentUser) return;
        
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        await updateDoc(roomRef, {
            guestId: auth.currentUser.uid,
            guestName: profile.name,
            guestNumericId: profile.numericId || '0000',
            guestAvatar: profile.avatarId,
            guestTitle: profile.activeTitle || '',
            guestRank: profile.ranked?.br?.rank || 'Aprendiz',
            guestRankTier: profile.ranked?.br?.tier || 'APPRENTICE',
            guestSubRank: profile.ranked?.br?.subRank || 'V',
            guestWins: profile.wins || 0,
            guestLosses: profile.losses || 0,
            guestPeerId: peerId,
            status: 'PREPARING'
        });
    }

    public async leaveRoom(roomId: string, userId: string) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        const snap = await getDoc(roomRef);
        if (!snap.exists()) return;
        
        const data = snap.data();
        if (data.hostId === userId) {
            // If host leaves, delete the room
            await deleteDoc(roomRef);
        } else if (data.guestId === userId) {
            // If guest leaves, reset room to WAITING
            await updateDoc(roomRef, {
                guestId: '',
                guestName: '',
                guestPeerId: '',
                guestReady: false,
                status: 'WAITING'
            });
        }
    }

    public subscribeToRoom(roomId: string, onUpdate: (data: any) => void) {
        return onSnapshot(doc(db, 'online_rooms_v2', roomId), (doc) => {
            if (doc.exists()) {
                onUpdate(doc.data());
            }
        }, (error) => console.error("Room Subscription Snapshot Error:", error));
    }

    public async updateReadyStatus(roomId: string, isHost: boolean, ready: boolean, characterIds: string[]) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        if (isHost) {
            await updateDoc(roomRef, { hostReady: ready, hostCharacters: characterIds });
        } else {
            await updateDoc(roomRef, { guestReady: ready, guestCharacters: characterIds });
        }
    }

    public async setRoomStatus(roomId: string, status: 'WAITING' | 'PREPARING' | 'SELECTION' | 'STAGE_SELECT' | 'VS' | 'BATTLE' | 'FINISHED') {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        const updates: any = { status };
        if (status === 'SELECTION') {
            updates.hostReady = false;
            updates.guestReady = false;
            updates.hostCharacters = [];
            updates.guestCharacters = [];
            updates.selectionStartedAt = Date.now();
        } else if (status === 'STAGE_SELECT') {
            updates.hostReady = false;
            updates.guestReady = false;
            updates.hostStageChoice = '';
            updates.guestStageChoice = '';
            updates.hostMusicChoice = '';
            updates.guestMusicChoice = '';
            updates.stageMusicStartedAt = Date.now();
        } else if (status === 'VS') {
            updates.hostReady = false;
            updates.guestReady = false;
            updates.hostLoadingProgress = 0;
            updates.guestLoadingProgress = 0;
        }
        await updateDoc(roomRef, updates);
    }

    public async getPublicRooms() {
        const q = query(
            collection(db, 'online_rooms_v2'), 
            where('status', '==', 'WAITING'), 
            orderBy('createdAt', 'desc'),
            limit(20)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    /**
     * Sends a direct room invitation to a friend.
     */
    public async sendInvite(roomId: string, hostProfile: PlayerProfile, friendId: string, mode: string): Promise<string> {
        if (!auth.currentUser) throw new Error("Autenticação necessária");

        const inviteId = `${auth.currentUser.uid}_${friendId}_${roomId}_${Date.now()}`;
        const inviteRef = doc(db, 'room_invitations_v2', inviteId);

        const inviteData = {
            id: inviteId,
            roomId,
            hostId: auth.currentUser.uid,
            hostName: hostProfile.name,
            hostAvatar: hostProfile.avatarId,
            inviteeId: friendId,
            gameMode: mode,
            status: 'PENDING',
            expiresAt: Date.now() + 30000, // 30 seconds expiration
            createdAt: serverTimestamp()
        };

        try {
            await setDoc(inviteRef, inviteData);
            return inviteId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'room_invitations_v2');
            throw error;
        }
    }

    /**
     * Listens for incoming pending invitations for a user.
     */
    public subscribeToInvites(userId: string, onInviteReceived: (invite: any) => void) {
        const q = query(
            collection(db, 'room_invitations_v2'),
            where('inviteeId', '==', userId),
            where('status', '==', 'PENDING')
        );

        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    // Validate if invite hasn't expired yet
                    if (data.expiresAt > Date.now()) {
                        onInviteReceived({ id: change.doc.id, ...data });
                    }
                }
            });
        }, (error) => console.error("Invites Snapshot Error:", error));
    }

    /**
     * Updates an invitation's status (ACCEPTED or DECLINED).
     */
    public async respondToInvite(inviteId: string, status: 'ACCEPTED' | 'DECLINED') {
        const inviteRef = doc(db, 'room_invitations_v2', inviteId);
        try {
            await updateDoc(inviteRef, { status });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'room_invitations_v2');
        }
    }

    /**
     * Checks if a room exists in the active room list.
     */
    public async checkRoomExists(roomId: string): Promise<boolean> {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        try {
            const snap = await getDoc(roomRef);
            return snap.exists();
        } catch (error) {
            return false;
        }
    }

    public async updatePlayerConnection(roomId: string, isHost: boolean, connected: boolean) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        try {
            const snap = await getDoc(roomRef);
            if (!snap.exists()) return;
            const data = snap.data();
            
            const updates: any = {};
            if (isHost) {
                updates.hostConnected = connected;
            } else {
                updates.guestConnected = connected;
            }

            // Detect disconnection transition
            if (!connected) {
                if (!data.disconnectTimerStart) {
                    updates.disconnectTimerStart = Date.now();
                    updates.reconnectStatus = 'RECONNECTING';
                }
            } else {
                const otherConnected = isHost ? (data.guestConnected ?? true) : (data.hostConnected ?? true);
                if (otherConnected) {
                    updates.disconnectTimerStart = null;
                    updates.reconnectStatus = 'ACTIVE';
                }
            }
            await updateDoc(roomRef, updates);
        } catch (error) {
            console.error("Error updating player connection status:", error);
        }
    }

    public async saveBattleState(roomId: string, state: any) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        try {
            await updateDoc(roomRef, {
                savedBattleState: state
            });
        } catch (error) {
            console.error("Error saving battle state:", error);
        }
    }

    public async getRoom(roomId: string) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        try {
            const snap = await getDoc(roomRef);
            return snap.exists() ? snap.data() : null;
        } catch (error) {
            console.error("Error getting room:", error);
            return null;
        }
    }
}
