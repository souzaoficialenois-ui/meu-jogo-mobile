import React, { useState, useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, GameMode } from '../../types';
import { LocalMultiplayerManager, DeviceState, SideSelection } from '../../services/LocalMultiplayerManager';
import { AudioManager } from '../../services/AudioManager';
import { 
    Gamepad2, 
    Keyboard, 
    Check, 
    X, 
    ChevronLeft, 
    ArrowLeftRight, 
    AlertCircle, 
    Zap,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getDeviceList = (obj: any): DeviceState[] => {
    return Object.values(obj) as DeviceState[];
};

export const SideSelectionScreen: React.FC = () => {
    const { changeScene, beginCharacterSelection, t, settings } = useSceneManager();
    const isPt = settings?.language === 'pt';
    const [devices, setDevices] = useState<Record<string, DeviceState>>({});
    const [allowed, setAllowed] = useState(false);
    
    const manager = LocalMultiplayerManager.getInstance();

    // Ref to track last action time for each device to debounce gamepad polling
    const lastActionTime = useRef<Record<string, number>>({});
    const actionCooldown = 250; // ms

    useEffect(() => {
        // Sync devices status
        const unsubscribe = manager.subscribe(() => {
            setDevices({ ...manager.deviceStates });
            setAllowed(manager.isLocalMultiplayerAllowed());
        });

        // Keydown listener for the keyboard
        const handleKeyDown = (e: KeyboardEvent) => {
            const kbState = manager.deviceStates['keyboard'];
            if (!kbState) return;

            const now = performance.now();
            const lastTime = lastActionTime.current['keyboard'] || 0;
            if (now - lastTime < actionCooldown) return;

            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                if (!kbState.confirmed) {
                    // Try to go Left
                    const leftTaken = getDeviceList(manager.deviceStates).some(
                        (s) => s.device.id !== 'keyboard' && s.side === 'left'
                    );
                    if (!leftTaken) {
                        manager.setSide('keyboard', 'left');
                        AudioManager.getInstance().playSFX('click');
                        lastActionTime.current['keyboard'] = now;
                    }
                }
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                if (!kbState.confirmed) {
                    // Try to go Right
                    const rightTaken = getDeviceList(manager.deviceStates).some(
                        (s) => s.device.id !== 'keyboard' && s.side === 'right'
                    );
                    if (!rightTaken) {
                        manager.setSide('keyboard', 'right');
                        AudioManager.getInstance().playSFX('click');
                        lastActionTime.current['keyboard'] = now;
                    }
                }
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                if (!kbState.confirmed && kbState.side !== 'neutral') {
                    manager.setSide('keyboard', 'neutral');
                    AudioManager.getInstance().playSFX('click');
                    lastActionTime.current['keyboard'] = now;
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (kbState.side !== 'neutral') {
                    manager.toggleConfirm('keyboard');
                    AudioManager.getInstance().playSFX('confirm');
                    lastActionTime.current['keyboard'] = now;
                }
            } else if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                if (kbState.confirmed) {
                    manager.toggleConfirm('keyboard');
                    AudioManager.getInstance().playSFX('cancel');
                    lastActionTime.current['keyboard'] = now;
                } else if (kbState.side !== 'neutral') {
                    manager.setSide('keyboard', 'neutral');
                    AudioManager.getInstance().playSFX('cancel');
                    lastActionTime.current['keyboard'] = now;
                } else {
                    // Exit side selection
                    AudioManager.getInstance().playSFX('cancel');
                    manager.resetSides();
                    changeScene(SceneName.SINGLE_PLAYER_MENU);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Polling loop for connected gamepads
        let rafId: number;
        const pollGamepads = () => {
            if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                const gps = navigator.getGamepads();
                const now = performance.now();

                for (let i = 0; i < gps.length; i++) {
                    const gp = gps[i];
                    if (gp && gp.connected) {
                        const deviceId = `gamepad_${i}`;
                        const gpState = manager.deviceStates[deviceId];
                        if (!gpState) continue;

                        const lastTime = lastActionTime.current[deviceId] || 0;
                        if (now - lastTime < actionCooldown) continue;

                        const axes = gp.axes;
                        const btns = gp.buttons;
                        const threshold = 0.5;

                        // Directions
                        const leftPressed = (axes[0] < -threshold) || (btns[14] && btns[14].pressed);
                        const rightPressed = (axes[0] > threshold) || (btns[15] && btns[15].pressed);
                        const downPressed = (axes[1] > threshold) || (btns[13] && btns[13].pressed);

                        const confirmPressed = btns[0] && btns[0].pressed; // Button A
                        const cancelPressed = btns[1] && btns[1].pressed; // Button B

                        if (leftPressed && !gpState.confirmed) {
                            const leftTaken = getDeviceList(manager.deviceStates).some(
                                (s) => s.device.id !== deviceId && s.side === 'left'
                            );
                            if (!leftTaken) {
                                manager.setSide(deviceId, 'left');
                                AudioManager.getInstance().playSFX('click');
                                lastActionTime.current[deviceId] = now;
                            }
                        } else if (rightPressed && !gpState.confirmed) {
                            const rightTaken = getDeviceList(manager.deviceStates).some(
                                (s) => s.device.id !== deviceId && s.side === 'right'
                            );
                            if (!rightTaken) {
                                manager.setSide(deviceId, 'right');
                                AudioManager.getInstance().playSFX('click');
                                lastActionTime.current[deviceId] = now;
                            }
                        } else if (downPressed && !gpState.confirmed && gpState.side !== 'neutral') {
                            manager.setSide(deviceId, 'neutral');
                            AudioManager.getInstance().playSFX('click');
                            lastActionTime.current[deviceId] = now;
                        } else if (confirmPressed) {
                            if (gpState.side === 'neutral') {
                                // Join an empty side automatically when pressing A in neutral
                                const leftTaken = getDeviceList(manager.deviceStates).some((s) => s.side === 'left');
                                const rightTaken = getDeviceList(manager.deviceStates).some((s) => s.side === 'right');
                                if (!leftTaken) {
                                    manager.setSide(deviceId, 'left');
                                    AudioManager.getInstance().playSFX('click');
                                } else if (!rightTaken) {
                                    manager.setSide(deviceId, 'right');
                                    AudioManager.getInstance().playSFX('click');
                                }
                                lastActionTime.current[deviceId] = now;
                            } else {
                                manager.toggleConfirm(deviceId);
                                AudioManager.getInstance().playSFX('confirm');
                                lastActionTime.current[deviceId] = now;
                            }
                        } else if (cancelPressed) {
                            if (gpState.confirmed) {
                                manager.toggleConfirm(deviceId);
                                AudioManager.getInstance().playSFX('cancel');
                                lastActionTime.current[deviceId] = now;
                            } else if (gpState.side !== 'neutral') {
                                manager.setSide(deviceId, 'neutral');
                                AudioManager.getInstance().playSFX('cancel');
                                lastActionTime.current[deviceId] = now;
                            } else {
                                // Exit side selection on back from neutral gamepad
                                AudioManager.getInstance().playSFX('cancel');
                                manager.resetSides();
                                changeScene(SceneName.SINGLE_PLAYER_MENU);
                                return;
                            }
                        }
                    }
                }
            }
            rafId = requestAnimationFrame(pollGamepads);
        };

        rafId = requestAnimationFrame(pollGamepads);

        return () => {
            unsubscribe();
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(rafId);
        };
    }, [changeScene, manager]);

    // Check if both sides are ready (fully confirmed)
    const p1Ready = getDeviceList(devices).some((s) => s.side === 'left' && s.confirmed);
    const p2Ready = getDeviceList(devices).some((s) => s.side === 'right' && s.confirmed);
    const bothReady = p1Ready && p2Ready;

    const handleConfirmStart = () => {
        if (!bothReady) return;
        AudioManager.getInstance().playSFX('confirm');
        // Let's transition to character size or directly selection
        // First team size selection or direct character selection depending on constraints
        beginCharacterSelection('LOCAL_VS');
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative bg-grain">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m6.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-15"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>

            <div className="scanline" />
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* TOP HEADER */}
            <header className="absolute top-0 left-0 right-0 h-16 md:h-24 px-4 md:px-10 flex items-center justify-between z-50 bg-stone-900/40 border-b border-white/5 shadow-lg backdrop-blur-sm">
                <button 
                    onClick={() => { 
                        AudioManager.getInstance().playSFX('cancel'); 
                        manager.resetSides(); 
                        changeScene(SceneName.SINGLE_PLAYER_MENU); 
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 rounded-full border border-stone-600 flex items-center justify-center bg-stone-950/40 hover:border-orange-500 hover:bg-stone-800 text-stone-300 hover:text-white transition-all shadow-lg active:scale-95 shrink-0 group cursor-pointer"
                >
                    <ChevronLeft className="w-5 h-5 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="flex flex-col items-center">
                    <h1 className="text-sm md:text-3xl font-black italic uppercase tracking-widest text-white">
                        {t('side_selection_title') || (isPt ? 'SELEÇÃO DE LADOS' : 'SIDE SELECTION')}
                    </h1>
                    <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-wider mt-0.5">
                        {t('side_selection_subtitle') || (isPt ? 'Escolha seu lado para a batalha local' : 'Choose your side for the local battle')}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-stone-900/80 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono">
                    <Users className="w-4 h-4 text-orange-500 animate-pulse" />
                    <span>{manager.gamepads.length} {manager.gamepads.length === 1 ? (isPt ? 'Controle' : 'Controller') : (isPt ? 'Controles' : 'Controllers')}</span>
                    <span className="text-stone-500">|</span>
                    <span>{manager.keyboardAvailable ? (isPt ? 'Teclado OK' : 'Keyboard OK') : (isPt ? 'Sem Teclado' : 'No Keyboard')}</span>
                </div>
            </header>

            {/* MAIN SELECTION GRID */}
            <main className="flex-1 w-full flex items-center justify-center mt-20 md:mt-24 px-4 md:px-10 gap-4 md:gap-8 overflow-hidden relative z-10">
                {/* LADO ESQUERDO - JOGADOR 1 */}
                <div className="flex-1 h-[65vh] rounded-2xl border-2 border-stone-800 bg-gradient-to-b from-blue-950/20 to-stone-950/80 p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div>
                        <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">{isPt ? 'LADO ESQUERDO' : 'LEFT SIDE'}</span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase text-blue-400">{isPt ? 'JOGADOR 1' : 'PLAYER 1'}</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <AnimatePresence mode="popLayout">
                            {getDeviceList(devices)
                                .filter((d) => d.side === 'left')
                                .map((d) => (
                                    <motion.div 
                                        key={d.device.id}
                                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={`p-4 md:p-6 rounded-xl border flex flex-col items-center gap-3 w-4/5 max-w-[240px] text-center shadow-2xl relative transition-colors ${
                                            d.confirmed 
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                                                : 'bg-stone-900/90 border-blue-500/40 text-stone-200'
                                        }`}
                                    >
                                        {d.device.type === 'keyboard' ? (
                                            <Keyboard className={`w-8 h-8 md:w-12 md:h-12 ${d.confirmed ? 'text-emerald-400' : 'text-blue-400'}`} />
                                        ) : (
                                            <Gamepad2 className={`w-8 h-8 md:w-12 md:h-12 ${d.confirmed ? 'text-emerald-400' : 'text-blue-400'}`} />
                                        )}
                                        <div>
                                            <p className="font-bold text-sm md:text-base leading-tight truncate max-w-[180px]">{d.device.name}</p>
                                            <p className="text-[10px] font-mono opacity-60 mt-1 uppercase tracking-widest">
                                                {d.confirmed ? (isPt ? 'CONFIRMADO' : 'READY') : (isPt ? 'AJUSTANDO' : 'ADJUSTING')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            {getDeviceList(devices).filter((d) => d.side === 'left').length === 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-stone-600 text-center text-xs md:text-sm font-bold uppercase tracking-widest"
                                >
                                    {isPt ? 'AGUARDANDO...' : 'WAITING...'}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-t border-white/5 pt-2">
                        <span>P1 CONTROLS</span>
                        <span className="flex items-center gap-1">
                            <ArrowLeftRight className="w-3 h-3 text-blue-400" /> {isPt ? 'Direcionais ou Analógico' : 'D-Pad or Analog'}
                        </span>
                    </div>
                </div>

                {/* CENTRAL POOL - DISPOSITIVOS DISPONÍVEIS */}
                <div className="w-[200px] md:w-[300px] h-[65vh] flex flex-col justify-between items-center py-2 bg-stone-900/20 border border-stone-800 rounded-xl p-4">
                    <div className="text-center w-full">
                        <span className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">{isPt ? 'DISPOSITIVOS DETECTADOS' : 'DETECTED DEVICES'}</span>
                        <div className="h-px bg-stone-800 w-full my-2" />
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2 overflow-y-auto py-2 px-1">
                        <AnimatePresence>
                            {getDeviceList(devices)
                                .filter((d) => d.side === 'neutral')
                                .map((d) => (
                                    <motion.div
                                        key={d.device.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="w-full p-2.5 rounded-lg border border-stone-800 bg-stone-950/80 flex items-center gap-3 text-left transition-all hover:border-orange-500/50"
                                    >
                                        {d.device.type === 'keyboard' ? (
                                            <Keyboard className="w-5 h-5 text-stone-400" />
                                        ) : (
                                            <Gamepad2 className="w-5 h-5 text-stone-400 animate-bounce" style={{ animationDuration: '3s' }} />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[11px] md:text-xs text-stone-300 truncate">{d.device.name}</p>
                                            <p className="text-[9px] font-mono text-orange-500 uppercase tracking-widest">{isPt ? 'Pressione qualquer botão' : 'Press any button'}</p>
                                        </div>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                        
                        {getDeviceList(devices).filter((d) => d.side === 'neutral').length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-stone-600 text-center text-[10px] md:text-xs uppercase font-mono px-2 py-4">
                                <span>{isPt ? 'Sem controles neutros' : 'No neutral controllers'}</span>
                                <span className="text-[9px] text-stone-700 mt-1">{isPt ? 'Todos os dispositivos já escolheram lados' : 'All devices have chosen sides'}</span>
                            </div>
                        )}
                    </div>

                    {/* REQUISITOS STATUS */}
                    <div className="w-full mt-2 bg-stone-950/80 border border-stone-800 rounded-lg p-2 flex flex-col gap-1 text-[10px] font-mono">
                        <span className="text-stone-500 uppercase tracking-wider text-center">{isPt ? 'REQUISITOS MÍNIMOS' : 'MINIMUM REQUIREMENTS'}</span>
                        <div className="flex items-center justify-between mt-1">
                            <span>{isPt ? '2 Controles (Gamepad):' : '2 Controllers (Gamepad):'}</span>
                            {manager.gamepads.length >= 2 ? (
                                <span className="text-emerald-400 font-bold">{isPt ? 'ATENDIDO' : 'MET'}</span>
                            ) : (
                                <span className="text-stone-500">{isPt ? 'INDISPONÍVEL' : 'UNAVAILABLE'}</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span>{isPt ? '1 Teclado + 1 Gamepad:' : '1 Keyboard + 1 Gamepad:'}</span>
                            {manager.keyboardAvailable && manager.gamepads.length >= 1 ? (
                                <span className="text-emerald-400 font-bold">{isPt ? 'ATENDIDO' : 'MET'}</span>
                            ) : (
                                <span className="text-stone-500">{isPt ? 'INDISPONÍVEL' : 'UNAVAILABLE'}</span>
                            )}
                        </div>
                        <div className="h-px bg-stone-800 my-1" />
                        <div className="flex items-center justify-center gap-1 text-center font-bold">
                            {allowed ? (
                                <span className="text-emerald-400">{isPt ? 'MULTIPLAYER LIBERADO' : 'MULTIPLAYER UNLOCKED'}</span>
                            ) : (
                                <span className="text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {isPt ? 'BLOQUEADO' : 'LOCKED'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* LADO DIREITO - JOGADOR 2 */}
                <div className="flex-1 h-[65vh] rounded-2xl border-2 border-stone-800 bg-gradient-to-b from-red-950/20 to-stone-950/80 p-4 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="text-right">
                        <span className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">{isPt ? 'LADO DIREITO' : 'RIGHT SIDE'}</span>
                        <h2 className="text-2xl md:text-4xl font-black italic uppercase text-red-400">{isPt ? 'JOGADOR 2' : 'PLAYER 2'}</h2>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <AnimatePresence mode="popLayout">
                            {getDeviceList(devices)
                                .filter((d) => d.side === 'right')
                                .map((d) => (
                                    <motion.div 
                                        key={d.device.id}
                                        initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        className={`p-4 md:p-6 rounded-xl border flex flex-col items-center gap-3 w-4/5 max-w-[240px] text-center shadow-2xl relative transition-colors ${
                                            d.confirmed 
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                                                : 'bg-stone-900/90 border-red-500/40 text-stone-200'
                                        }`}
                                    >
                                        {d.device.type === 'keyboard' ? (
                                            <Keyboard className={`w-8 h-8 md:w-12 md:h-12 ${d.confirmed ? 'text-emerald-400' : 'text-red-400'}`} />
                                        ) : (
                                            <Gamepad2 className={`w-8 h-8 md:w-12 md:h-12 ${d.confirmed ? 'text-emerald-400' : 'text-red-400'}`} />
                                        )}
                                        <div>
                                            <p className="font-bold text-sm md:text-base leading-tight truncate max-w-[180px]">{d.device.name}</p>
                                            <p className="text-[10px] font-mono opacity-60 mt-1 uppercase tracking-widest">
                                                {d.confirmed ? (isPt ? 'CONFIRMADO' : 'READY') : (isPt ? 'AJUSTANDO' : 'ADJUSTING')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            {getDeviceList(devices).filter((d) => d.side === 'right').length === 0 && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-stone-600 text-center text-xs md:text-sm font-bold uppercase tracking-widest"
                                >
                                    {isPt ? 'AGUARDANDO...' : 'WAITING...'}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 border-t border-white/5 pt-2">
                        <span>P2 CONTROLS</span>
                        <span className="flex items-center gap-1">
                            <ArrowLeftRight className="w-3 h-3 text-red-400" /> {isPt ? 'Direcionais ou Analógico' : 'D-Pad or Analog'}
                        </span>
                    </div>
                </div>
            </main>

            {/* ACTION BOTTOM PANEL */}
            <footer className="h-16 md:h-20 bg-stone-900/50 border-t border-white/5 px-4 md:px-10 flex items-center justify-between z-30 relative backdrop-blur-sm">
                <div className="text-stone-400 text-[10px] md:text-xs font-medium uppercase tracking-wider max-w-md">
                    <span>{isPt ? 'Ajuda: Movimente para o lado desejado, pressione o botão de Confirmação (Enter / Botão A) para travar o controle.' : 'Help: Move to desired side, press Confirm (Enter / Button A) to lock controls.'}</span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            AudioManager.getInstance().playSFX('cancel');
                            manager.resetSides();
                            changeScene(SceneName.SINGLE_PLAYER_MENU);
                        }}
                        className="px-4 py-2 border border-stone-700 hover:border-stone-500 hover:bg-stone-800 text-stone-300 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                        {t('back') || 'Voltar'}
                    </button>

                    <button 
                        onClick={handleConfirmStart}
                        disabled={!bothReady}
                        className={`px-6 py-3 border-2 uppercase font-black italic tracking-widest text-xs md:text-sm flex items-center gap-2 rounded-tr-xl rounded-bl-xl transition-all shadow-xl ${
                            bothReady
                                ? 'bg-orange-500 hover:bg-orange-600 border-orange-400 text-white cursor-pointer active:scale-95'
                                : 'bg-stone-800/80 border-stone-700/50 text-stone-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                        <Zap className={`w-4 h-4 md:w-5 md:h-5 ${bothReady ? 'fill-white text-white animate-pulse' : ''}`} />
                        <span>{isPt ? 'Confirmar Partida' : 'Confirm Match'}</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};
