import React, { useEffect, useState, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { NetworkManager } from '../../services/NetworkManager';
import { LobbyService } from '../../services/LobbyService';
import { SceneName } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle, RefreshCw, LogOut, Loader2, Play } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { BASE_CHARACTERS } from '../../constants';
import { AudioManager } from '../../services/AudioManager';

interface ReconnectionScreenProps {
    roomId: string;
    isHost: boolean;
    onClose: () => void;
}

export const ReconnectionScreen: React.FC<ReconnectionScreenProps> = ({ roomId, isHost, onClose }) => {
    const { 
        gameEngine, 
        createGameSession, 
        changeScene, 
        destroyGameSession,
        unlockedCharacters,
        settings
    } = useSceneManager();
    const isPt = settings?.language === 'pt';

    const [statusText, setStatusText] = useState(isPt ? "Detectando estado da partida..." : "Detecting match state...");
    const [countdown, setCountdown] = useState<number>(30);
    const [opponentConnected, setOpponentConnected] = useState<boolean>(true);
    const [p2pConnected, setP2pConnected] = useState<boolean>(false);
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [roomData, setRoomData] = useState<any>(null);
    const [isRecreatingSession, setIsRecreatingSession] = useState(false);

    const net = NetworkManager.getInstance();
    const lobby = LobbyService.getInstance();
    const reconnectAttempted = useRef(false);

    useEffect(() => {
        // Play warning/ambient chime
        try {
            AudioManager.getInstance().playSFX('cancel');
        } catch (e) {}

        // 1. Subscribe to Firestore Room State
        const unsubscribe = onSnapshot(doc(db, 'online_rooms_v2', roomId), async (docSnap) => {
            if (!docSnap.exists()) {
                setStatusText(isPt ? "A partida foi encerrada pelo servidor." : "The match was ended by the server.");
                setIsExpired(true);
                return;
            }

            const room = docSnap.data();
            setRoomData(room);

            // Check countdown based on disconnectTimerStart
            if (room.disconnectTimerStart) {
                const elapsed = Math.floor((Date.now() - room.disconnectTimerStart) / 1000);
                const remaining = Math.max(0, 30 - elapsed);
                setCountdown(remaining);
                if (remaining <= 0) {
                    setIsExpired(true);
                    setStatusText(isPt ? "Tempo limite de reconexão excedido." : "Reconnection timeout exceeded.");
                    // Set status to EXPIRED
                    lobby.updatePlayerConnection(roomId, isHost, false);
                    return;
                }
            } else {
                setCountdown(30);
            }

            const isOpponentConnected = isHost ? (room.guestConnected ?? true) : (room.hostConnected ?? true);
            setOpponentConnected(isOpponentConnected);

            // Re-create local game session if we just refreshed/booted the app
            if (!gameEngine && !isRecreatingSession && room.status === 'BATTLE') {
                setIsRecreatingSession(true);
                setStatusText(isPt ? "Restaurando arena de combate..." : "Restoring battle arena...");
                
                const hostCharId = room.hostCharacters?.[0];
                const guestCharId = room.guestCharacters?.[0];
                
                const p1Char = BASE_CHARACTERS.find(c => c.id === hostCharId) || BASE_CHARACTERS[0];
                const p2Char = BASE_CHARACTERS.find(c => c.id === guestCharId) || BASE_CHARACTERS[0];

                if (p1Char && p2Char) {
                    createGameSession([p1Char], [p2Char], false, 'ONLINE', null, 1, {
                        customGravityMultiplier: room.customGravityMultiplier,
                        customSpeedMultiplier: room.customSpeedMultiplier,
                        customDamageMultiplier: room.customDamageMultiplier,
                        customWorldWidth: room.customWorldWidth,
                        customGroundHeight: room.customGroundHeight
                    });

                    // Pause the newly created engine immediately so it waits for sync
                    setTimeout(() => {
                        const newEngine = useSceneManager().gameEngine;
                        if (newEngine) {
                            newEngine.isPausedForReconnection = true;
                            // Apply state saved in Firestore
                            if (room.savedBattleState) {
                                newEngine.applySyncedState(room.savedBattleState);
                            }
                        }
                        setIsRecreatingSession(false);
                    }, 100);
                }
            }

            // If opponent reconnects and we are connected, check if we need to resume
            if (room.hostConnected && room.guestConnected && p2pConnected) {
                handleResumeMatch();
            }
        });

        // 2. Start connection recovery loop
        attemptPeerRecovery();

        const timerInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    setIsExpired(true);
                    setStatusText(isPt ? "Tempo limite de reconexão excedido." : "Reconnection timeout exceeded.");
                    clearInterval(timerInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(timerInterval);
        };
    }, [roomId, isHost, p2pConnected]);

    const attemptPeerRecovery = async () => {
        if (reconnectAttempted.current) return;
        reconnectAttempted.current = true;

        setStatusText(isPt ? "Iniciando reconexão de rede..." : "Starting network reconnection...");

        try {
            // Update our status in Firestore to true (meaning we are trying to connect)
            await lobby.updatePlayerConnection(roomId, isHost, true);

            // Re-establish peer
            if (isHost) {
                setStatusText(isPt ? "Aguardando conexão do adversário..." : "Waiting for opponent connection...");
                // Initialize peer using our custom room numeric ID
                await net.initializeHost(roomId);
                
                net.onConnect = (hostFlag, oppId) => {
                    console.log("P2P connection re-established!");
                    setP2pConnected(true);
                    setStatusText(isPt ? "Conectado! Sincronizando estado da luta..." : "Connected! Synchronizing battle state...");
                    
                    // Host sends current state
                    if (gameEngine) {
                        const statePayload = {
                            hostHp: gameEngine.player1.hp,
                            guestHp: gameEngine.player2.hp,
                            hostKi: gameEngine.player1.ki,
                            guestKi: gameEngine.player2.ki,
                            timer: Math.floor(gameEngine.gameTimer / 60)
                        };
                        net.sendReconnectSync(statePayload);
                        setTimeout(() => handleResumeMatch(), 500);
                    }
                };
            } else {
                setStatusText(isPt ? "Conectando ao anfitrião..." : "Connecting to host...");
                // Guest connects
                const room = await lobby.getRoom(roomId);
                if (room && room.hostPeerId) {
                    net.connectToPeer(room.hostPeerId);
                    
                    net.onConnect = () => {
                        console.log("P2P Guest connected back!");
                        setP2pConnected(true);
                        setStatusText(isPt ? "Conectado! Aguardando sincronização de luta..." : "Connected! Waiting for battle synchronization...");
                        
                        // If Guest was still in match, they can send the state too
                        if (gameEngine) {
                            const statePayload = {
                                hostHp: gameEngine.player1.hp,
                                guestHp: gameEngine.player2.hp,
                                hostKi: gameEngine.player1.ki,
                                guestKi: gameEngine.player2.ki,
                                timer: Math.floor(gameEngine.gameTimer / 60)
                            };
                            net.sendReconnectSync(statePayload);
                            setTimeout(() => handleResumeMatch(), 500);
                        }
                    };
                }
            }

            // Hook up sync callbacks
            net.onReconnectSync = (state) => {
                console.log("Received peer sync state in overlay:", state);
                if (gameEngine) {
                    gameEngine.applySyncedState(state);
                }
                setP2pConnected(true);
                handleResumeMatch();
            };

        } catch (e) {
            console.error("Reconnection attempt failed:", e);
            reconnectAttempted.current = false;
        }
    };

    const handleResumeMatch = async () => {
        setStatusText(isPt ? "Luta sincronizada! Retornando..." : "Battle synchronized! Returning...");
        try {
            AudioManager.getInstance().playSFX('confirm');
        } catch (e) {}

        // Make sure we update Firestore to set both as fully connected
        await lobby.updatePlayerConnection(roomId, isHost, true);

        if (gameEngine) {
            gameEngine.isPausedForReconnection = false;
        }

        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const handleExitToMenu = async () => {
        try {
            AudioManager.getInstance().playSFX('cancel');
        } catch (e) {}

        // Clear room info
        localStorage.removeItem("current_online_room_id");
        net.reset();
        destroyGameSession();
        changeScene(SceneName.MAIN_MENU);
        onClose();
    };

    return (
        <div id="reconnection-overlay" className="fixed inset-0 z-[9999] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-6 text-center select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-950/20 via-transparent to-transparent pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-stone-900 border-2 border-orange-500/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden"
            >
                {/* Border effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 animate-[pulse_2s_infinite]" />

                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-orange-500/10 border-2 border-orange-500 rounded-full flex items-center justify-center animate-pulse mb-4">
                        {isExpired ? (
                            <WifiOff className="w-8 h-8 text-red-500" />
                        ) : (
                            <Wifi className="w-8 h-8 text-orange-500 animate-bounce" />
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-header italic uppercase tracking-wider text-orange-400">
                        {isExpired ? (isPt ? "CONEXÃO PERDIDA" : "CONNECTION LOST") : (isPt ? "RECONECTANDO PARTIDA" : "RECONNECTING MATCH")}
                    </h2>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">
                        {isPt ? "SISTEMA DE AUTOCONEXÃO" : "AUTO-RECONNECTION SYSTEM"}
                    </p>
                </div>

                {/* Progress bar or expired icon */}
                <div className="bg-stone-950 border border-white/5 p-4 rounded-xl mb-6 text-left">
                    <div className="flex items-center gap-3">
                        {!isExpired && <Loader2 className="w-4 h-4 text-orange-500 animate-spin shrink-0" />}
                        <span className="text-xs font-mono text-zinc-300">{statusText}</span>
                    </div>

                    {!isExpired && (
                        <div className="mt-3">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase mb-1">
                                <span>{isPt ? "Tempo limite de retorno" : "Return timeout"}</span>
                                <span className="text-orange-500 font-bold">{countdown}s</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                                    animate={{ width: `${(countdown / 30) * 100}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!isExpired && (
                        <button
                            onClick={attemptPeerRecovery}
                            className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-header italic uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {isPt ? "Forçar Reconexão" : "Force Reconnection"}
                        </button>
                    )}

                    <button
                        onClick={handleExitToMenu}
                        className="w-full py-3 bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:border-red-500 text-red-200 hover:text-white rounded-lg text-xs font-header italic uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {isPt ? "Desistir / Voltar ao Menu" : "Forfeit / Return to Menu"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
