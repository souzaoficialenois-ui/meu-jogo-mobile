
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CharacterData, PlayerProfile } from '../../types';
import { NetworkManager } from '../../services/NetworkManager';
import { LobbyService, RoomConfig } from '../../services/LobbyService';
import { BASE_CHARACTERS, AVATAR_LIST } from '../../constants';
import { CharacterPreview } from '../CharacterPreview';
import { BattleCharacterSelectionScreen } from './BattleCharacterSelectionScreen';
import { AudioManager } from '../../services/AudioManager';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { STAGE_DB } from '../../constants/StageDatabase';
import { useUI } from '../../contexts/UIContext';

const BATTLE_MUSICS = [
    { id: 'random', name: 'Aleatória', url: null, creator: 'Música Aleatória' },
    { id: 'broly_theme', name: "Broly's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/brolys%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'gogeta_ssj4', name: 'Gogeta (SSJ4) Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/gogeta%20(ssj4)%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'gogeta_blue', name: 'Gogeta Blue Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/gogeta%20blues%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'hits_theme', name: "Hit's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/hits%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'super_baby_2', name: 'Super Baby 2 Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/super%20baby%202s%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'ui_goku', name: "UI Goku's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/ultra%20instinct%20gokus%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'vegito_blue', name: 'Vegito Blue Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/vegito%20blues%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'zamasu_theme', name: "Zamasu's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/zamasus%20theme.ogg', creator: 'DBFZ OST' },
];
import { 
    Crown, 
    Rocket, 
    Users, 
    Lock, 
    Globe, 
    ChevronLeft, 
    ArrowLeft,
    Plus, 
    Search,
    RefreshCw,
    Eye,
    Shield,
    Swords,
    CheckCircle2,
    Check,
    Trophy,
    Play,
    Compass,
    Sliders,
    Cpu,
    Wifi,
    User,
    Gamepad2,
    Hash,
    Flame,
    Zap,
    Activity,
    Sparkles,
    AlertCircle,
    Sun,
    Moon,
    Orbit,
    Map as MapIcon,
    ChevronRight,
    Clock
} from 'lucide-react';

const ICONS: Record<string, any> = {
    'DAY': Sun,
    'ALIEN': Orbit,
    'ARENA': MapIcon,
    'NIGHT': Moon
};

const STAGES = STAGE_DB.map(s => ({
    ...s,
    icon: ICONS[s.id] || MapIcon
}));
import { motion, AnimatePresence } from 'motion/react';
import { MultiplayerSidebar } from '../multiplayer/MultiplayerSidebar';
import { CreateRoomTab } from '../multiplayer/CreateRoomTab';
import { RoomBrowserTab } from '../multiplayer/RoomBrowserTab';
import { MatchmakingTab } from '../multiplayer/MatchmakingTab';
import { ActiveRoomView } from '../multiplayer/ActiveRoomView';

export const MultiplayerScreen: React.FC = () => {
    const { 
        t, 
        changeScene, 
        startLoading, 
        startBattleTransition, 
        selectedOnlineCharId, 
        unlockedCharacters, 
        createGameSession, 
        playerProfile,
        autoJoinRoomId,
        setAutoJoinRoomId,
        setShowProfileId,
        isAdmin,
        isAmbassador,
        isModerator,
        isVeteran,
        setStageTheme,
        setBattleMusic
    } = useSceneManager();
    const { s, sx, sy, getPos } = useUI();
    
    const [view, setView] = useState<'LOBBY' | 'MATCHMAKING' | 'BROWSER' | 'CREATE' | 'ROOM' | 'SELECTION' | 'STAGE_SELECT'>('LOBBY');
    const [publicRooms, setPublicRooms] = useState<any[]>([]);
    const [currentRoom, setCurrentRoom] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [roomConfig, setRoomConfig] = useState<RoomConfig>({
        name: `${playerProfile?.name || 'Invocador'}'s Room`,
        maxCharacters: 1,
        isPrivate: false,
        password: ''
    });
    const [matchmakingTimer, setMatchmakingTimer] = useState(0);
    const [matchmakingStatusIdx, setMatchmakingStatusIdx] = useState(0);
    const [activeFilter, setActiveFilter] = useState<'ALL' | '1' | '2' | '3'>('ALL');
    const [selectionTimeLeft, setSelectionTimeLeft] = useState<number>(30);
    const [stageTimeLeft, setStageTimeLeft] = useState<number>(30);
    const [selectedStage, setSelectedStage] = useState<string>('DAY');
    const [selectedMusic, setSelectedMusic] = useState<string>('random');
    const [isMusicSelect, setIsMusicSelect] = useState(false);

    const matchmakingStatusList = [
        "Iniciando barramento de dados quânticos...",
        "Buscando fendas de servidores disponíveis...",
        "Autenticando credenciais do invocador com segurança...",
        "Escaneando arenas de duelo ativas...",
        "Verificando integridade e latência de rede...",
        "Sincronizando banco de dados de heróis...",
        "Procurando um guerreiro digno do seu poder...",
        "Filtrando candidatos por índice de maestria (MMR)...",
        "Ajustando conexão direta de baixa latência (P2P)..."
    ];

    useEffect(() => {
        let timerId: any = null;
        let statusId: any = null;

        if (view === 'MATCHMAKING') {
            setMatchmakingTimer(0);
            setMatchmakingStatusIdx(0);

            timerId = setInterval(() => {
                setMatchmakingTimer(t => t + 1);
            }, 1000);

            statusId = setInterval(() => {
                setMatchmakingStatusIdx(idx => (idx + 1) % matchmakingStatusList.length);
            }, 3000);
        } else {
            setMatchmakingTimer(0);
            setMatchmakingStatusIdx(0);
        }

        return () => {
            if (timerId) clearInterval(timerId);
            if (statusId) clearInterval(statusId);
        };
    }, [view]);

    const [myReady, setMyReady] = useState(false);
    const [readyCharacters, setReadyCharacters] = useState<string[]>([]);
    const [opponentReady, setOpponentReady] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<any>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [opponentChar, setOpponentChar] = useState<CharacterData | null>(null);

    const net = NetworkManager.getInstance();
    const lobby = LobbyService.getInstance();
    const searchInterval = useRef<any>(null);
    const activeMatchmakingListener = useRef<(() => void) | null>(null);

    // Handle Network Events
    useEffect(() => {
        setReadyCharacters([]); // Reset selection when entering lobby or changing rooms
        setMyReady(false);
        setIsCreating(false);
        setErrorMsg(null);
        
        net.onConnect = (isHost, opponentId, profile) => {
            console.log(`[Multiplayer] Connected to ${opponentId}`);
            AudioManager.getInstance().playSFX('confirm');
            setErrorMsg(null);
        };

        net.onGameStart = (remoteChar) => {
            setOpponentChar(remoteChar);
        };

        net.onDisconnect = () => {
            console.warn("[Multiplayer] Peer disconnected");
            setErrorMsg("Conexão com o oponente perdida.");
            // If in a room, maybe stay there but show error
            setOpponentReady(false);
            setMyReady(false);
        };

        return () => {
             if (searchInterval.current) clearInterval(searchInterval.current);
             if (activeMatchmakingListener.current) activeMatchmakingListener.current();
             lobby.leaveQueue();
             net.onConnect = () => {};
             net.onDisconnect = () => {};
             net.onGameStart = () => {};
        };
    }, []);

    // Auto-join room when accepted invite triggers it
    useEffect(() => {
        if (!autoJoinRoomId || !playerProfile) return;

        const autoJoin = async () => {
            try {
                const roomSnap = await getDoc(doc(db, 'online_rooms_v2', autoJoinRoomId));
                if (roomSnap.exists()) {
                    const roomData = { id: roomSnap.id, ...roomSnap.data() };
                    await joinRoom(roomData);
                } else {
                    setErrorMsg("A sala de partida expirou ou não está mais disponível.");
                }
            } catch (err) {
                console.error("Auto-join failed:", err);
                setErrorMsg("Erro ao entrar automaticamente na sala.");
            } finally {
                setAutoJoinRoomId(null); // Clear the trigger
            }
        };

        autoJoin();
    }, [autoJoinRoomId, playerProfile]);

    const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
    const viewRef = useRef(view);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (viewRef.current !== 'LOBBY') return;
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            setBgOffset({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    const charsRef = useRef(unlockedCharacters);
    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { charsRef.current = unlockedCharacters; }, [unlockedCharacters]);

    const opponentTeam = useMemo(() => {
        const charIds = net.isHost ? currentRoom?.guestCharacters : currentRoom?.hostCharacters;
        if (!charIds || !Array.isArray(charIds)) return [];
        return charIds.map(id => BASE_CHARACTERS.find(c => c.id === id)).filter(Boolean) as CharacterData[];
    }, [currentRoom?.guestCharacters, currentRoom?.hostCharacters, net.isHost]);

    // Subscribe to current room
    useEffect(() => {
        if (!currentRoom?.id) return;

        const unsubscribe = lobby.subscribeToRoom(currentRoom.id, (room) => {
            // Kick guest if they were removed by the host or moderator
            if (!net.isHost && room.guestId !== auth.currentUser?.uid) {
                setCurrentRoom(null);
                setView('LOBBY');
                setErrorMsg('Você foi expulso da sala pelo anfitrião ou por um moderador.');
                setTimeout(() => setErrorMsg(null), 5000);
                return;
            }

            setCurrentRoom({ id: currentRoom.id, ...room });
            setOpponentReady(net.isHost ? room.guestReady : room.hostReady);
            
            // Sync characters
            const remoteChars = net.isHost ? room.guestCharacters : room.hostCharacters;
            if (remoteChars && remoteChars.length > 0) {
                 const char = charsRef.current.find(c => c.id === remoteChars[0]);
                 if (char) setOpponentChar(char);
            }

            // Check for phase transitions
            console.log(`[LOBBY] Room status updated: ${room.status}, Current View: ${viewRef.current}`);

            if (room.status === 'SELECTION' && viewRef.current === 'ROOM') {
                console.log("[LOBBY] Transitioning to SELECTION view");
                setView('SELECTION');
                setMyReady(false);
                setReadyCharacters([]);
            }

            if (room.status === 'STAGE_SELECT' && viewRef.current === 'SELECTION') {
                console.log("[LOBBY] Transitioning to STAGE_SELECT view");
                setView('STAGE_SELECT');
                setMyReady(false);
            }

            if (room.status === 'VS' && (viewRef.current === 'STAGE_SELECT' || viewRef.current === 'SELECTION' || viewRef.current === 'ROOM')) {
                console.log("[LOBBY] Transitioning to VS screen");
                // Sincronizar carregamento
                if (currentRoom?.id) {
                    localStorage.setItem("current_online_room_id", currentRoom.id);
                    localStorage.setItem("is_online_host", net.isHost ? "true" : "false");
                }
                handleVsStart(room);
            }

            if (room.status === 'BATTLE' && (viewRef.current === 'ROOM' || viewRef.current === 'SELECTION' || viewRef.current === 'STAGE_SELECT')) {
                console.log("[LOBBY] Transitioning to BATTLE directly");
                handleBattleStart(room);
            }
        });

        return () => unsubscribe();
    }, [currentRoom?.id]); // removed view and unlockedCharacters to prevent cycle hooks

    const handleVsStart = (room: any) => {
        const hostCharId = room.hostCharacters?.[0];
        const guestCharId = room.guestCharacters?.[0];

        const p1Char = BASE_CHARACTERS.find(c => c.id === hostCharId) || BASE_CHARACTERS[0];
        const p2Char = BASE_CHARACTERS.find(c => c.id === guestCharId) || BASE_CHARACTERS[0];

        if (p1Char && p2Char) {
            setStageTheme(room.finalStage || 'DAY');
            setBattleMusic(room.finalMusicUrl || null);

            createGameSession([p1Char], [p2Char], false, 'ONLINE', null, 1, {
                customGravityMultiplier: room.customGravityMultiplier,
                customSpeedMultiplier: room.customSpeedMultiplier,
                customDamageMultiplier: room.customDamageMultiplier,
                customWorldWidth: room.customWorldWidth,
                customGroundHeight: room.customGroundHeight
            });
            startLoading(SceneName.VS_SCREEN);
        }
    };

    const handleBattleStart = (room: any) => {
        const myChars = unlockedCharacters.filter(c => 
            (net.isHost ? room.hostCharacters : room.guestCharacters).includes(c.id)
        );
        
        const hostCharId = room.hostCharacters?.[0];
        const guestCharId = room.guestCharacters?.[0];

        // Ensure we find the characters from BASE_CHARACTERS if not in unlockedCharacters
        const p1Char = net.isHost ? (myChars[0] || BASE_CHARACTERS.find(c => c.id === hostCharId) || BASE_CHARACTERS[0]) : (unlockedCharacters.find(c => c.id === hostCharId) || BASE_CHARACTERS.find(c => c.id === hostCharId));
        const p2Char = net.isHost ? (unlockedCharacters.find(c => c.id === guestCharId) || BASE_CHARACTERS.find(c => c.id === guestCharId)) : (myChars[0] || BASE_CHARACTERS.find(c => c.id === guestCharId) || BASE_CHARACTERS[0]);

        if (p1Char && p2Char) {
            createGameSession([p1Char], [p2Char], false, 'ONLINE', null, 1, {
                customGravityMultiplier: room.customGravityMultiplier,
                customSpeedMultiplier: room.customSpeedMultiplier,
                customDamageMultiplier: room.customDamageMultiplier,
                customWorldWidth: room.customWorldWidth,
                customGroundHeight: room.customGroundHeight
            });
            startLoading(SceneName.VS_SCREEN);
        }
    };

    const startMatchmaking = async () => {
        if (!playerProfile) {
            setErrorMsg("Perfil não encontrado. Tente novamente.");
            return;
        }
        setView('MATCHMAKING');
        setIsSearching(true);
        setErrorMsg(null);

        try {
            const peerId = await net.initializeHost(playerProfile.numericId);
            
            const unsub = await lobby.joinQueue(playerProfile, peerId, (roomData) => {
                // I am the guest in a match found by someone else
                if (searchInterval.current) clearInterval(searchInterval.current);
                if (activeMatchmakingListener.current) activeMatchmakingListener.current();
                setCurrentRoom(roomData);
                setView('ROOM');
                net.isHost = false;
                net.connectToPeer(roomData.hostPeerId);
            });
            activeMatchmakingListener.current = unsub || null;

            searchInterval.current = setInterval(async () => {
                const matchedRoomId = await lobby.findOpponent(playerProfile);
                if (matchedRoomId) {
                    clearInterval(searchInterval.current);
                    if (activeMatchmakingListener.current) activeMatchmakingListener.current();
                    
                    // We just created the room as host
                    const roomRef = doc(db, 'online_rooms_v2', matchedRoomId);
                    const snap = await getDoc(roomRef);
                    if (snap.exists()) {
                        setCurrentRoom({ id: matchedRoomId, ...snap.data() });
                        setView('ROOM');
                        net.isHost = true;
                    }
                }
            }, 3000);
        } catch (e: any) {
            setErrorMsg("Busca de partida falhou: " + (e.message || "Erro desconhecido"));
            setIsSearching(false);
        }
    };

    const cancelMatchmaking = () => {
        if (searchInterval.current) clearInterval(searchInterval.current);
        if (activeMatchmakingListener.current) activeMatchmakingListener.current();
        lobby.leaveQueue();
        net.reset();
        setIsSearching(false);
        setView('BROWSER');
    };

    const openBrowser = async () => {
        setView('BROWSER');
        refreshRooms();
    };

    const refreshRooms = async () => {
        try {
            const rooms = await lobby.getPublicRooms();
            setPublicRooms(rooms);
        } catch (e) {
            setErrorMsg("Falha ao atualizar salas.");
        }
    };

    const goToCreateMode = () => {
        setView('CREATE');
        setErrorMsg(null);
        // Pre-initialize host connection while they fill the form to save time later
        // Use numeric ID as peer ID if available
        net.initializeHost(playerProfile?.numericId).catch(e => {
            console.warn("Pre-initialization warning:", e);
        });
    };

    const handleCreateRoom = async () => {
        if (!playerProfile) {
            setErrorMsg("Perfil não carregado. Faça login novamente.");
            return;
        }
        
        setIsCreating(true);
        setErrorMsg(null);

        try {
            console.log("Initializing host...");
            const peerId = await net.initializeHost(playerProfile.numericId);
            console.log("Host initialized with ID:", peerId);
            
            console.log("Creating custom room in lobby...");
            const roomId = await lobby.createCustomRoom(roomConfig, playerProfile, peerId);
            console.log("Room created with ID:", roomId);
            
            setCurrentRoom({ id: roomId, ...roomConfig, hostId: playerProfile.playerId });
            net.isHost = true;
            setView('ROOM');
        } catch (e: any) {
            console.error("Critical error creating room:", e);
            setErrorMsg("Erro ao criar sala: " + (e.message || "Falha na conexão"));
        } finally {
            setIsCreating(false);
        }
    };

    const joinRoom = async (room: any, password?: string) => {
        if (!playerProfile) return;
        
        if (room.isPrivate && room.password && password !== room.password) {
            if (!password) {
                setShowPasswordPrompt(room);
                return;
            } else {
                setErrorMsg("Incorrect encryption key.");
                return;
            }
        }

        try {
            const peerId = await net.initializeHost(playerProfile.numericId); 
            await lobby.joinRoom(room.id, playerProfile, peerId);
            net.isHost = false;
            net.connectToPeer(room.hostPeerId);
            setCurrentRoom(room);
            setView('ROOM');
            setShowPasswordPrompt(null);
            setPasswordInput('');
        } catch (e) {
            setErrorMsg("Failed to join room.");
        }
    };

    // Filter rooms based on search
    const filteredRooms = publicRooms.filter(r => 
        r.roomName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.includes(searchQuery)
    );

    const toggleReady = async () => {
        if (!currentRoom) return;
        
        if (view === 'SELECTION') {
            const newReady = !myReady;
            setMyReady(newReady);
            await lobby.updateReadyStatus(currentRoom.id, net.isHost, newReady, readyCharacters);
            return;
        }

        if (view === 'STAGE_SELECT') {
            const newReady = !myReady;
            setMyReady(newReady);
            try {
                const roomRef = doc(db, 'online_rooms_v2', currentRoom.id);
                if (net.isHost) {
                    await updateDoc(roomRef, { hostReady: newReady });
                } else {
                    await updateDoc(roomRef, { guestReady: newReady });
                }
            } catch (e) {
                console.error(e);
            }
            return;
        }

        // Lobby phase
        const newReady = !myReady;
        setMyReady(newReady);
        await lobby.updateReadyStatus(currentRoom.id, net.isHost, newReady, []);
    };

    // Sync character selection timer
    useEffect(() => {
        if (view !== 'SELECTION' || !currentRoom?.selectionStartedAt) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - currentRoom.selectionStartedAt) / 1000);
            const remaining = Math.max(0, 30 - elapsed);
            setSelectionTimeLeft(remaining);

            if (remaining === 0 && !myReady) {
                clearInterval(interval);
                triggerAutoCharacterSelection();
            }
        }, 500);

        return () => clearInterval(interval);
    }, [view, currentRoom?.selectionStartedAt, myReady]);

    const triggerAutoCharacterSelection = async () => {
        if (!currentRoom || myReady) return;
        console.log("Time is up! Triggering auto character selection...");
        
        const available = unlockedCharacters.filter(c => c.id !== "random");
        const selected: any[] = [];
        const maxSelection = currentRoom.maxCharacters || 1;

        for (let i = 0; i < maxSelection; i++) {
            const unused = available.filter(c => !selected.some(s => s.id === c.id));
            if (unused.length > 0) {
                const randomChar = unused[Math.floor(Math.random() * unused.length)];
                selected.push(randomChar);
            } else if (available.length > 0) {
                selected.push(available[0]);
            }
        }

        const charIds = selected.map(c => c.id);
        setReadyCharacters(charIds);
        setMyReady(true);
        try {
            await lobby.updateReadyStatus(currentRoom.id, net.isHost, true, charIds);
        } catch (e) {
            console.error(e);
        }
    };

    // Sync stage & music selection timer
    useEffect(() => {
        if (view !== 'STAGE_SELECT' || !currentRoom?.stageMusicStartedAt) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - currentRoom.stageMusicStartedAt) / 1000);
            const remaining = Math.max(0, 30 - elapsed);
            setStageTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                if (net.isHost) {
                    finalizeStageAndMusicSelection();
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [view, currentRoom?.stageMusicStartedAt, net.isHost]);

    const finalizeStageAndMusicSelection = async () => {
        if (!net.isHost || !currentRoom) return;

        let hostStage = currentRoom.hostStageChoice;
        let guestStage = currentRoom.guestStageChoice;
        let hostMusic = currentRoom.hostMusicChoice;
        let guestMusic = currentRoom.guestMusicChoice;

        // Auto-select if missing
        if (!hostStage) {
            hostStage = STAGE_DB[Math.floor(Math.random() * STAGE_DB.length)].id;
        }
        if (!guestStage) {
            guestStage = STAGE_DB[Math.floor(Math.random() * STAGE_DB.length)].id;
        }

        if (!hostMusic) {
            const playableTracks = BATTLE_MUSICS.filter(m => m.id !== 'random');
            hostMusic = playableTracks[Math.floor(Math.random() * playableTracks.length)].id;
        }
        if (!guestMusic) {
            const playableTracks = BATTLE_MUSICS.filter(m => m.id !== 'random');
            guestMusic = playableTracks[Math.floor(Math.random() * playableTracks.length)].id;
        }

        // Draw Stage
        let finalStage = hostStage;
        if (hostStage !== guestStage) {
            finalStage = Math.random() < 0.5 ? hostStage : guestStage;
        }

        // Draw Music
        let finalMusicId = hostMusic;
        if (hostMusic !== guestMusic) {
            finalMusicId = Math.random() < 0.5 ? hostMusic : guestMusic;
        }

        // Resolve music URL
        let finalMusicUrl = "";
        const track = BATTLE_MUSICS.find(m => m.id === finalMusicId);
        if (track && track.url) {
            finalMusicUrl = track.url;
        } else {
            const playableTracks = BATTLE_MUSICS.filter(m => m.id !== 'random');
            finalMusicUrl = playableTracks[Math.floor(Math.random() * playableTracks.length)].url || "";
        }

        console.log(`Final Selection Decided: Stage = ${finalStage}, MusicId = ${finalMusicId}`);

        const roomRef = doc(db, 'online_rooms_v2', currentRoom.id);
        await updateDoc(roomRef, {
            finalStage,
            finalMusicId,
            finalMusicUrl,
            hostReady: false,
            guestReady: false,
            hostLoadingProgress: 0,
            guestLoadingProgress: 0,
            status: 'VS'
        });
    };

    const handleSelectStage = async (stageId: string) => {
        if (!currentRoom) return;
        setSelectedStage(stageId);
        try {
            const roomRef = doc(db, 'online_rooms_v2', currentRoom.id);
            if (net.isHost) {
                await updateDoc(roomRef, { hostStageChoice: stageId });
            } else {
                await updateDoc(roomRef, { guestStageChoice: stageId });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectMusic = async (musicId: string) => {
        if (!currentRoom) return;
        setSelectedMusic(musicId);
        
        // Play live preview of the battle track
        if (musicId !== 'random') {
            const track = BATTLE_MUSICS.find(m => m.id === musicId);
            if (track && track.url) {
                setBattleMusic(track.url);
            }
        } else {
            setBattleMusic(null);
        }

        try {
            const roomRef = doc(db, 'online_rooms_v2', currentRoom.id);
            if (net.isHost) {
                await updateDoc(roomRef, { hostMusicChoice: musicId });
            } else {
                await updateDoc(roomRef, { guestMusicChoice: musicId });
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Reset music select view when entering stage select phase
    useEffect(() => {
        if (view === 'STAGE_SELECT') {
            setIsMusicSelect(false);
            setMyReady(false);
        }
    }, [view]);

    // Host automation for phase transitions
    useEffect(() => {
        if (!net.isHost || !currentRoom) return;

        const checkTransitions = async () => {
            if (!currentRoom) return;

            // Use combination of local state and room state for more reactive transitions
            const isBothReady = myReady && opponentReady;

            // Auto start selection if both ready in room
            if (view === 'ROOM' && isBothReady && (currentRoom.status === 'WAITING' || currentRoom.status === 'PREPARING')) {
                console.log("[HOST] Both players ready in ROOM. Transitioning to SELECTION...");
                await lobby.setRoomStatus(currentRoom.id, 'SELECTION');
            }

            // Auto start stage select if both ready in character selection
            if (view === 'SELECTION' && isBothReady && currentRoom.status === 'SELECTION') {
                const hostChars = net.isHost ? readyCharacters : currentRoom.hostCharacters;
                const guestChars = !net.isHost ? readyCharacters : currentRoom.guestCharacters;
                
                if (hostChars?.length > 0 && guestChars?.length > 0) {
                    console.log("[HOST] Both players selected characters. Transitioning to STAGE_SELECT...");
                    await lobby.setRoomStatus(currentRoom.id, 'STAGE_SELECT');
                }
            }

            // Auto start VS if both ready in STAGE_SELECT
            if (view === 'STAGE_SELECT' && isBothReady && currentRoom.status === 'STAGE_SELECT') {
                console.log("[HOST] Both players ready in STAGE_SELECT. Transitioning to VS...");
                await finalizeStageAndMusicSelection();
            }
        };

        const timer = setTimeout(checkTransitions, 500); // Slight delay to ensure state and DB sync
        return () => clearTimeout(timer);
    }, [myReady, opponentReady, view, currentRoom?.status, net.isHost, readyCharacters, currentRoom?.hostReady, currentRoom?.guestReady, currentRoom?.hostCharacters, currentRoom?.guestCharacters]);

    const leaveRoom = async () => {
        if (currentRoom) {
            await lobby.leaveRoom(currentRoom.id, playerProfile?.id || auth.currentUser?.uid || '');
            net.reset();
            setCurrentRoom(null);
            setView('BROWSER');
        } else {
            setView('BROWSER');
        }
    };

    const handleStartSelection = async () => {
        if (!currentRoom) return;
        try {
            await lobby.setRoomStatus(currentRoom.id, 'SELECTION');
            setMyReady(false);
            setReadyCharacters([]);
        } catch (e) {
            setErrorMsg("Falha ao iniciar seleção.");
        }
    };

    const handleStartBattle = async () => {
        if (!currentRoom) return;
        if (readyCharacters.length === 0) {
            setErrorMsg("Selecione um personagem primeiro!");
            return;
        }
        try {
            await lobby.setRoomStatus(currentRoom.id, 'BATTLE');
        } catch (e) {
            setErrorMsg("Falha ao iniciar batalha.");
        }
    };

    const handleBack = () => {
        net.reset();
        lobby.leaveQueue();
        changeScene(SceneName.MAIN_MENU);
    };

    const myChar = unlockedCharacters.find(c => c.id === readyCharacters[0]);


    const sidebarTabs = [
        { id: 'MATCHMAKING', label: 'Matchmaking', icon: Rocket, desc: 'Duelo Ranqueado' },
        { id: 'BROWSER', label: 'Explorar', icon: Globe, desc: 'Salas Públicas' },
        { id: 'CREATE', label: 'Criar Arena', icon: Plus, desc: 'Sua Própria Sala' },
    ];

    const isLobbyView = ['LOBBY', 'MATCHMAKING', 'BROWSER', 'CREATE'].includes(view);

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200 select-none">
            {/* Background Layer (Same as Settings) */}
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute right-[-5%] bottom-[-5%] opacity-40 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/goku/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            <AnimatePresence mode="wait">
                    {isLobbyView && (
                        <motion.div 
                            key="lobby-layout"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col relative z-10"
                        >
                            {/* GLOBAL HEADER (Same as Settings) */}
                            <motion.header 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0"
                            >
                                <div className="flex items-center gap-3 md:gap-8">
                                    <button 
                                        onClick={handleBack}
                                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
                                    >
                                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300 group-hover:text-white transition-colors" />
                                    </button>
                                    <div className="flex flex-col">
                                        <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                                            {t('lobby_multiplayer')}
                                        </h2>
                                    </div>
                                </div>
                            </motion.header>

                            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
                                    <MultiplayerSidebar 
                                        activeTab={view === 'LOBBY' ? 'MATCHMAKING' : view}
                                        onTabChange={(id) => {
                                            AudioManager.getInstance().playSFX('click');
                                            if (id === 'MATCHMAKING') startMatchmaking();
                                            else if (id === 'BROWSER') refreshRooms();
                                            else if (id === 'CREATE') goToCreateMode();
                                            setView(id as any);
                                        }}
                                        tabs={sidebarTabs}
                                        onBack={handleBack}
                                        playerProfile={playerProfile}
                                        t={t}
                                    />
                        
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <div className="max-w-4xl mx-auto w-full h-full">
                                        {(view === 'LOBBY' || view === 'MATCHMAKING') && (
                                        <MatchmakingTab 
                                            isSearching={isSearching}
                                            startMatchmaking={startMatchmaking}
                                            cancelMatchmaking={cancelMatchmaking}
                                            matchmakingTimer={matchmakingTimer}
                                            matchmakingStatus={matchmakingStatusList[matchmakingStatusIdx]}
                                            playerProfile={playerProfile}
                                            errorMsg={errorMsg}
                                            playSFX={(id) => AudioManager.getInstance().playSFX(id)}
                                            t={t}
                                        />
                                    )}
                                    {view === 'BROWSER' && (
                                        <RoomBrowserTab 
                                            rooms={publicRooms}
                                            refreshRooms={refreshRooms}
                                            joinRoom={joinRoom}
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            errorMsg={errorMsg}
                                            s={s}
                                            playSFX={(id) => AudioManager.getInstance().playSFX(id)}
                                        />
                                    )}
                                    {view === 'CREATE' && (
                                        <CreateRoomTab 
                                            roomConfig={roomConfig}
                                            setRoomConfig={setRoomConfig}
                                            handleCreateRoom={handleCreateRoom}
                                            isCreating={isCreating}
                                            errorMsg={errorMsg}
                                            s={s}
                                            playSFX={(id) => AudioManager.getInstance().playSFX(id)}
                                        />
                                    )}
                                    </div>
                                </div>
                            </main>
                        </motion.div>
                    )}



                {view === 'ROOM' && (
                    <motion.div 
                        key="room-view"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full h-full z-20"
                    >
                        <ActiveRoomView 
                            currentRoom={currentRoom}
                            playerProfile={playerProfile}
                            net={net}
                            lobby={lobby}
                            myReady={myReady}
                            opponentReady={opponentReady}
                            toggleReady={toggleReady}
                            leaveRoom={leaveRoom}
                            handleStartSelection={handleStartSelection}
                            s={s}
                            playSFX={(id) => AudioManager.getInstance().playSFX(id)}
                            AVATAR_LIST={AVATAR_LIST}
                            t={t}
                        />
                    </motion.div>
                )}

                    {view === 'SELECTION' && (
                        <motion.div 
                            key="selection" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="absolute inset-0 z-50 overflow-y-auto bg-stone-950 flex flex-col"
                        >
                            {/* Background Image for Selection Screen */}
                            <div className="absolute inset-0 z-[-1] pointer-events-none">
                                <img src="/Assets/Modos/sele%C3%A7%C3%A3o%20de%20modo%20fundo2.png" className="w-full h-full object-cover grayscale-[10%] opacity-40" alt="" />
                                <div className="absolute inset-0 bg-stone-950/60" />
                                <div className="absolute inset-0 backdrop-blur-sm" />
                            </div>

                            <BattleCharacterSelectionScreen
                                overrideMaxSelection={currentRoom?.maxCharacters || 1}
                                isMultiplayer={true}
                                onTeamChange={async (teamIds) => {
                                    if (currentRoom) {
                                        await lobby.updateReadyStatus(currentRoom.id, net.isHost, myReady, teamIds);
                                    }
                                }}
                                onConfirmSelection={async (team) => {
                                    const charIds = team.map(c => c.id);
                                    setReadyCharacters(charIds);
                                    setMyReady(true);
                                    try {
                                        await lobby.updateReadyStatus(currentRoom.id, net.isHost, true, charIds);
                                    } catch(e) {
                                        console.error(e);
                                    }
                                }}
                                onBack={() => {
                                    setMyReady(false);
                                    setReadyCharacters([]);
                                    setView('ROOM');
                                }}
                            />
                            
                            <AnimatePresence>
                                {myReady && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-12 pointer-events-none"
                                    >
                                        <div className="text-center bg-stone-950/40 backdrop-blur-2xl border border-white/10 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-orange-500/10 animate-pulse pointer-events-none" />
                                            <div className="w-32 h-32 md:w-32 md:h-32 border-2 border-orange-500/50 rounded-full flex items-center justify-center relative mb-8 mx-auto">
                                                <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                                <CheckCircle2 size={48} className="text-orange-400 animate-pulse" />
                                            </div>
                                            <h4 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tighter drop-">PRONTO!</h4>
                                            <p className="text-xs font-bold text-orange-500 uppercase tracking-[0.5em] mt-4 animate-pulse">AGUARDANDO OPONENTE...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {view === 'STAGE_SELECT' && (
                        <motion.div 
                            key="stage_select" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="absolute inset-0 z-50 flex flex-col bg-stone-950 font-sans text-stone-200 select-none overflow-hidden"
                        >
                            {/* Background Texture Layers */}
                            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10" />
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-orange-600/10 rounded-full blur-[140px]" />
                                <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[160px]" />
                            </div>

                            {/* Dynamic Background based on selected stage */}
                            <AnimatePresence mode="wait">
                                {STAGES.find(s => s.id === selectedStage) && (
                                    <motion.div
                                        key={`bg-${selectedStage}`}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 0.5, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="absolute inset-0 z-0 pointer-events-none"
                                    >
                                        <img src={STAGES.find(s => s.id === selectedStage)?.img || undefined} className="w-full h-full object-cover grayscale-[10%]" alt="" />
                                        <div className={`absolute inset-0 bg-gradient-to-tr ${STAGES.find(s => s.id === selectedStage)?.color} opacity-30 mix-blend-color-dodge`} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* TOP HEADER */}
                            <header 
                                className="relative w-full px-6 md:px-12 flex items-center justify-between z-40 border-b border-white/5 bg-stone-900/30 backdrop-blur-xl shrink-0"
                                style={{ height: s(96) }}
                            >
                                <button 
                                    onClick={() => {
                                        AudioManager.getInstance().playSFX('click');
                                        if (isMusicSelect) {
                                            setIsMusicSelect(false);
                                        }
                                    }}
                                    disabled={!isMusicSelect}
                                    className={`rounded-xl border border-stone-800 flex items-center justify-center bg-stone-900/60 transition-all shadow-lg active:scale-95 shrink-0 group ${!isMusicSelect ? 'opacity-0 pointer-events-none' : 'hover:border-orange-500/80 text-stone-400 hover:text-white cursor-pointer'}`}
                                    style={{ width: s(48), height: s(48) }}
                                >
                                    <ChevronLeft style={{ width: s(24), height: s(24) }} className="group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
                                </button>
                                
                                <h1 
                                    className="font-black italic uppercase tracking-wider text-white "
                                    style={{ fontSize: s(36) }}
                                >
                                    {isMusicSelect ? 'SELEÇÃO DE MÚSICA' : 'SELEÇÃO DE ARENA'}
                                </h1>

                                {/* Timer & Matchup Info */}
                                <div className="flex items-center" style={{ gap: s(16) }}>
                                    {/* Timer */}
                                    <div className="flex flex-col items-end" style={{ marginRight: s(16) }}>
                                        <span className="font-black uppercase tracking-widest text-orange-500 mb-0.5" style={{ fontSize: s(8) }}>TIME LEFT</span>
                                        <span className="font-black italic text-white animate-pulse" style={{ fontSize: s(24) }}>{stageTimeLeft}s</span>
                                    </div>

                                    {/* Matchup Badge */}
                                    <div 
                                        className="hidden md:flex items-center bg-stone-950/60 border border-stone-800 rounded-2xl backdrop-blur-xl"
                                        style={{ gap: s(14), padding: `${s(8)}px ${s(20)}px` }}
                                    >
                                        <div className="flex -space-x-2">
                                            {currentRoom?.hostAvatar ? (
                                                <img 
                                                    src={AVATAR_LIST.find(a => a.id === currentRoom.hostAvatar)?.url} 
                                                    alt="P1" 
                                                    className="rounded-full border-2 border-orange-500 bg-orange-950 object-cover shadow-lg" 
                                                    style={{ width: s(32), height: s(32) }}
                                                />
                                            ) : (
                                                <div 
                                                    className="rounded-full border-2 border-orange-500 bg-orange-950 flex items-center justify-center font-black text-orange-300"
                                                    style={{ width: s(32), height: s(32), fontSize: s(10) }}
                                                >
                                                    P1
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-black italic text-orange-500 drop-shadow" style={{ fontSize: s(14) }}>VS</span>
                                        <div className="flex -space-x-2">
                                            {currentRoom?.guestAvatar ? (
                                                <img 
                                                    src={AVATAR_LIST.find(a => a.id === currentRoom.guestAvatar)?.url} 
                                                    alt="P2" 
                                                    className="rounded-full border-2 border-red-500 bg-red-950 object-cover shadow-lg" 
                                                    style={{ width: s(32), height: s(32) }}
                                                />
                                            ) : (
                                                <div 
                                                    className="rounded-full border-2 border-red-500 bg-red-950 flex items-center justify-center font-black text-red-300"
                                                    style={{ width: s(32), height: s(32), fontSize: s(10) }}
                                                >
                                                    P2
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </header>
                                  {/* MAIN AREA */}
                            <main 
                                className="flex-1 w-full flex items-center relative z-20 overflow-hidden"
                                style={{ padding: `${s(24)}px ${s(96)}px` }}
                            >
                                <AnimatePresence mode="wait">
                                    {!isMusicSelect ? (
                                        <motion.div
                                            key="stage-info"
                                            initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                            transition={{ duration: 0.45 }}
                                            className="text-left"
                                            style={{ maxWidth: s(640) }}
                                        >
                                            <div className="flex items-center mb-3.5" style={{ gap: s(14) }}>
                                                <div 
                                                    className="rounded-2xl bg-stone-900/95 border border-stone-800 flex items-center justify-center shadow-2xl backdrop-blur-md transform -rotate-6"
                                                    style={{ width: s(48), height: s(48) }}
                                                >
                                                    {(() => {
                                                        const StageIcon = STAGES.find(s => s.id === selectedStage)?.icon || MapIcon;
                                                        return <StageIcon className="text-orange-500" style={{ width: s(20), height: s(20) }} />;
                                                    })()}
                                                </div>
                                                <span 
                                                    className="font-black italic uppercase tracking-widest text-orange-400 bg-orange-400/5 rounded-xl border border-orange-500/10"
                                                    style={{ fontSize: s(14), padding: `${s(4)}px ${s(12)}px` }}
                                                >
                                                    ARENA
                                                </span>
                                            </div>

                                            <h2 
                                                className="font-black italic uppercase tracking-wider text-white leading-none mb-4 drop-shadow-md"
                                                style={{ fontSize: s(64) }}
                                            >
                                                {STAGES.find(s => s.id === selectedStage)?.name || 'Aleatória'}
                                            </h2>

                                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6" style={{ width: s(64), height: s(4) }} />
                                            
                                            <p className="font-bold italic text-stone-400 leading-relaxed mb-8" style={{ fontSize: s(18), maxWidth: s(600) }}>
                                                {STAGES.find(s => s.id === selectedStage)?.desc || 'Um cenário aleatório para seu combate.'}
                                            </p>

                                            <div className="flex flex-col" style={{ gap: s(16) }}>
                                                <div 
                                                    className="flex items-center bg-stone-900/40 border border-white/5 rounded-2xl backdrop-blur-sm"
                                                    style={{ gap: s(16), padding: s(16), maxWidth: s(384) }}
                                                >
                                                    <div className="bg-orange-500 rounded-full" style={{ width: s(4), height: s(32) }} />
                                                    <div className="min-w-0">
                                                        <span className="text-stone-500 font-bold uppercase tracking-wider block" style={{ fontSize: s(10) }}>OPPONENT PREFERENCE</span>
                                                        <span className="font-black italic uppercase text-white truncate block" style={{ fontSize: s(14) }}>
                                                            {STAGE_DB.find(s => s.id === (net.isHost ? currentRoom?.guestStageChoice : currentRoom?.hostStageChoice))?.name || 'Aleatória'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => {
                                                        AudioManager.getInstance().playSFX('click');
                                                        setIsMusicSelect(true);
                                                    }}
                                                    className="w-fit bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-orange-400 text-white transition-all uppercase font-black italic tracking-widest flex items-center rounded-2xl active:scale-95 group duration-300 cursor-pointer"
                                                    style={{ padding: `${s(16)}px ${s(32)}px`, gap: s(10) }}
                                                >
                                                    <span className="font-black italic" style={{ fontSize: s(16) }}>CONFIRMAR ARENA</span>
                                                    <ChevronRight className="group-hover:translate-x-0.5 transition-transform stroke-[3]" style={{ width: s(20), height: s(20) }} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="music-info"
                                            initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                            transition={{ duration: 0.45 }}
                                            className="text-left"
                                            style={{ maxWidth: s(640) }}
                                        >
                                            <div className="flex items-center mb-3.5" style={{ gap: s(14) }}>
                                                <div 
                                                    className="rounded-2xl bg-stone-900/95 border border-stone-800 flex items-center justify-center shadow-2xl backdrop-blur-md transform -rotate-6"
                                                    style={{ width: s(48), height: s(48) }}
                                                >
                                                    <Play className="text-orange-500" style={{ width: s(20), height: s(20) }} />
                                                </div>
                                                <span 
                                                    className="font-black italic uppercase tracking-widest text-orange-400 bg-orange-400/5 rounded-xl border border-orange-500/10"
                                                    style={{ fontSize: s(14), padding: `${s(4)}px ${s(12)}px` }}
                                                >
                                                    TRILHA SONORA
                                                </span>
                                            </div>

                                            <h2 
                                                className="font-black italic uppercase tracking-wider text-white leading-none mb-4 drop-shadow-md"
                                                style={{ fontSize: s(64) }}
                                            >
                                                {BATTLE_MUSICS.find(m => m.id === selectedMusic)?.name || 'Aleatória'}
                                            </h2>

                                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6" style={{ width: s(64), height: s(4) }} />
                                            
                                            <p className="font-bold italic text-stone-400 leading-relaxed mb-8" style={{ fontSize: s(18), maxWidth: s(600) }}>
                                                {BATTLE_MUSICS.find(m => m.id === selectedMusic)?.creator || 'Música de batalha aleatória.'}
                                            </p>

                                            <div className="flex flex-col" style={{ gap: s(16) }}>
                                                <div 
                                                    className="flex items-center bg-stone-900/40 border border-white/5 rounded-2xl backdrop-blur-sm"
                                                    style={{ gap: s(16), padding: s(16), maxWidth: s(384) }}
                                                >
                                                    <div className="bg-orange-500 rounded-full" style={{ width: s(4), height: s(32) }} />
                                                    <div className="min-w-0">
                                                        <span className="text-stone-500 font-bold uppercase tracking-wider block" style={{ fontSize: s(10) }}>OPPONENT PREFERENCE</span>
                                                        <span className="font-black italic uppercase text-white truncate block" style={{ fontSize: s(14) }}>
                                                            {BATTLE_MUSICS.find(m => m.id === (net.isHost ? currentRoom?.guestMusicChoice : currentRoom?.hostMusicChoice))?.name || 'Aleatória'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={toggleReady}
                                                    className={`w-fit bg-gradient-to-r transition-all uppercase font-black italic tracking-widest flex items-center rounded-2xl active:scale-95 shadow-2xl group duration-300 cursor-pointer border ${
                                                        myReady 
                                                            ? 'from-stone-800 to-stone-700 text-stone-400 border-white/10' 
                                                            : 'from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-orange-400 text-white'
                                                    }`}
                                                    style={{ padding: `${s(18)}px ${s(48)}px`, gap: s(10) }}
                                                >
                                                    <span className="font-black italic" style={{ fontSize: s(16) }}>
                                                        {myReady ? 'AGUARDANDO OPONENTE...' : 'CONFIRMAR ESCOLHAS'}
                                                    </span>
                                                    {!myReady && <Check className="group-hover:scale-110 transition-transform stroke-[3]" style={{ width: s(20), height: s(20) }} />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </main>

                            {/* BOTTOM SELECTION CARDS */}
                            <footer 
                                className="w-full relative z-30 flex items-end justify-start shrink-0 overflow-x-auto py-4 custom-scrollbar"
                                style={{ padding: `0 ${s(48)}px`, paddingBottom: s(64), gap: s(16) }}
                            >
                                {!isMusicSelect ? STAGES.map((item, i) => {
                                    const isSelected = selectedStage === item.id;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => !myReady && handleSelectStage(item.id)}
                                            className={`
                                                relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 transform group cursor-pointer
                                                ${isSelected ? 'scale-105 border-2 border-orange-500  z-20' : 'border border-stone-800/80 hover:border-stone-600 scale-100 opacity-60 hover:opacity-90'}
                                                ${myReady ? 'pointer-events-none' : ''}
                                            `}
                                            style={{ height: s(112), minWidth: s(130), maxWidth: s(180) }}
                                        >
                                            <div className="absolute inset-0 z-0">
                                                <img src={item.img || undefined} className="w-full h-full object-cover grayscale-[30%] group-hover:scale-105 group-hover:grayscale-0 transition-transform duration-500 opacity-40" alt="" />
                                                <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? item.color : 'from-stone-900 to-stone-950'} opacity-30`} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
                                            </div>
                                            
                                            <div className="absolute inset-0 flex flex-col justify-end items-center text-center z-10" style={{ padding: s(14) }}>
                                                <div 
                                                    className={`rounded-lg transition-all duration-300 border flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white border-orange-400' : 'bg-stone-950 border-stone-800 text-stone-400 group-hover:text-stone-200'}`}
                                                    style={{ padding: s(6), marginBottom: s(6) }}
                                                >
                                                    <Icon className="drop-shadow-md" style={{ width: s(16), height: s(16) }} />
                                                </div>
                                                <span 
                                                    className={`font-black italic uppercase tracking-wider drop-shadow-md leading-none ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`}
                                                    style={{ fontSize: s(12) }}
                                                >
                                                    {item.name}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                }) : BATTLE_MUSICS.map((item, i) => {
                                    const isSelected = selectedMusic === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => !myReady && handleSelectMusic(item.id)}
                                            className={`
                                                relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 transform group cursor-pointer
                                                ${isSelected ? 'scale-105 border-2 border-orange-500  z-20' : 'border border-stone-800/80 hover:border-stone-600 scale-100 opacity-60 hover:opacity-90'}
                                                ${myReady ? 'pointer-events-none' : ''}
                                            `}
                                            style={{ height: s(112), minWidth: s(130), maxWidth: s(180) }}
                                        >
                                            <div className="absolute inset-0 bg-stone-900/60 group-hover:bg-stone-900/80 transition-colors z-0" />
                                            <div className="absolute inset-0 flex flex-col justify-end items-center text-center z-10" style={{ padding: s(14) }}>
                                                <div 
                                                    className={`rounded-lg transition-all duration-300 border flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white border-orange-400' : 'bg-stone-950 border-stone-800 text-stone-400 group-hover:text-stone-200'}`}
                                                    style={{ padding: s(6), marginBottom: s(6) }}
                                                >
                                                    <Play className="drop-shadow-md fill-current" style={{ width: s(16), height: s(16) }} />
                                                </div>
                                                <span 
                                                    className={`font-black italic uppercase tracking-wider drop-shadow-md leading-none truncate max-w-full ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`}
                                                    style={{ fontSize: s(12) }}
                                                >
                                                    {item.name}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </footer>

                            {/* READY OVERLAY */}
                             <AnimatePresence>
                                 {myReady && (
                                     <motion.div 
                                         initial={{ opacity: 0 }} 
                                         animate={{ opacity: 1 }} 
                                         exit={{ opacity: 0 }}
                                         className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                                         style={{ padding: s(48) }}
                                     >
                                         <div 
                                             className="text-center bg-stone-900/90 border-2 border-orange-500/50 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md"
                                             style={{ padding: s(48) }}
                                         >
                                             <div className="absolute inset-0 bg-orange-500/5 animate-pulse pointer-events-none" />
                                             <div 
                                                 className="border-2 border-orange-500/30 rounded-full flex items-center justify-center relative mx-auto"
                                                 style={{ width: s(96), height: s(96), marginBottom: s(24) }}
                                             >
                                                 <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                                 <CheckCircle2 className="text-orange-400 animate-pulse" style={{ width: s(40), height: s(40) }} />
                                             </div>
                                             <h4 className="font-black italic uppercase text-white tracking-tighter" style={{ fontSize: s(40) }}>PRONTO!</h4>
                                             <p 
                                                 className="font-bold text-orange-500 uppercase tracking-[0.4em] animate-pulse"
                                                 style={{ fontSize: s(10), marginTop: s(12) }}
                                             >
                                                 AGUARDANDO OPONENTE...
                                             </p>
                                         </div>
                                     </motion.div>
                                 )}
                             </AnimatePresence>
                         </motion.div>
                     )}
                 </AnimatePresence>

                {errorMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 50 }} 
                        className="absolute bg-red-600 text-white rounded-2xl shadow-2xl font-black italic uppercase tracking-widest flex items-center gap-4 z-50"
                        style={{ bottom: sy(48), padding: `${s(16)}px ${s(32)}px` }}
                    >
                        <Shield style={{ width: s(24), height: s(24) }} />
                        <span style={{ fontSize: s(16) }}>ERROR: {errorMsg}</span>
                    </motion.div>
                )}

                {showPasswordPrompt && (
                    <div 
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
                        style={{ padding: s(24) }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="w-full bg-slate-900 border border-white/10 rounded-3xl shadow-2xl"
                            style={{ maxWidth: s(448), padding: s(32) }}
                        >
                            <div className="flex items-center mb-6" style={{ gap: s(16) }}>
                                <div 
                                    className="bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30 text-red-500"
                                    style={{ width: s(48), height: s(48) }}
                                >
                                    <Lock size={s(24)} />
                                </div>
                                <div>
                                    <h3 className="font-black italic uppercase tracking-tighter" style={{ fontSize: s(20) }}>{t('lobby_password')}</h3>
                                    <p className="font-bold text-slate-500 uppercase tracking-widest" style={{ fontSize: s(10) }}>AUTHENTICATION REQUIRED</p>
                                </div>
                            </div>
                            <input 
                                autoFocus
                                type="password" 
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && joinRoom(showPasswordPrompt, passwordInput)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl font-black italic text-white focus:border-red-500 focus:outline-none transition-all uppercase placeholder:text-slate-800"
                                style={{ padding: `${s(16)}px ${s(24)}px`, marginBottom: s(24), fontSize: s(16) }}
                                placeholder="ENTER_KEY"
                            />
                            <div className="flex" style={{ gap: s(16) }}>
                                <button 
                                    onClick={() => { setShowPasswordPrompt(null); setPasswordInput(''); }} 
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black italic uppercase tracking-widest rounded-xl transition-all"
                                    style={{ padding: `${s(16)}px 0`, fontSize: s(14) }}
                                >
                                    {t('lobby_cancel')}
                                </button>
                                <button 
                                    onClick={() => joinRoom(showPasswordPrompt, passwordInput)} 
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black italic uppercase tracking-widest rounded-xl shadow-lg transition-all"
                                    style={{ padding: `${s(16)}px 0`, fontSize: s(14) }}
                                >
                                    {t('lobby_confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        );
    };

const MenuButton: React.FC<{ icon: any, title: string, description: string, color: string, onClick: () => void }> = ({ icon: Icon, title, description, color, onClick }) => {
    const { s } = useUI();
    const colors: any = { orange: 'bg-orange-500', blue: 'bg-orange-600', purple: 'bg-orange-600' };
    return (
        <motion.button 
            whileHover={{ y: -10 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={onClick} 
            className="group relative flex flex-col items-start justify-end rounded-[40px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl"
            style={{ height: '45vmin', padding: s(40) }}
        >
            <div 
                className={`absolute rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}
                style={{ top: s(40), right: s(40), width: s(96), height: s(96) }}
            >
                <Icon size={s(40)} className="text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
            <div className="relative z-10 text-left">
                <h2 className="font-black italic uppercase tracking-tighter mb-4" style={{ fontSize: s(36) }}>{title}</h2>
                <p 
                    className="text-slate-400 font-bold uppercase leading-relaxed tracking-widest" 
                    style={{ fontSize: s(10), maxWidth: s(200), marginBottom: s(24) }}
                >
                    {description}
                </p>
                <div 
                    className={`rounded-full ${colors[color]} group-hover:w-full transition-all duration-500`} 
                    style={{ width: s(64), height: s(8) }}
                />
            </div>
        </motion.button>
    );
};

const FormRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => {
    const { s } = useUI();
    return (
        <div style={{ gap: s(12) }} className="flex flex-col">
            <label className="font-black italic uppercase tracking-widest text-slate-500" style={{ fontSize: s(10), padding: `0 ${s(8)}px` }}>{label}</label>
            {children}
        </div>
    );
};
