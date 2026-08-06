import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { GameMode, SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { 
    Zap, 
    ChevronLeft, 
    Target, 
    Gamepad2, 
    Trophy, 
    Globe, 
    Flame, 
    Shield, 
    Users2, 
    AlertCircle,
} from 'lucide-react';
import { OnlineStatus } from '../../services/OnlineService';
import { UpdatePopup } from '../dialogs/UpdatePopup';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalMultiplayerManager } from '../../services/LocalMultiplayerManager';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { KiParticles } from '../KiParticles';

const ModeSelectionScreenContent: React.FC = () => {
    const { changeScene, beginCharacterSelection, setAiDifficulty, t, settings, isChatOpen } = useSceneManager();
    const isPt = settings?.language === 'pt';
    const { s } = useUI();
    const [selectedMode, setSelectedMode] = useState<GameMode>(() => {
        try {
            const savedMode = localStorage.getItem('fighter_legend_selected_mode');
            if (savedMode) return savedMode as GameMode;
        } catch (e) {
            console.error(e);
        }
        return 'ARCADE';
    });

    useEffect(() => {
        if (selectedMode) {
            try {
                localStorage.setItem('fighter_legend_selected_mode', selectedMode);
            } catch (e) {
                console.error(e);
            }
        }
    }, [selectedMode]);
    const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('LOADING');
    const [isLocalVsAllowed, setIsLocalVsAllowed] = useState(false);

    useEffect(() => {
        const unsubscribe = LocalMultiplayerManager.getInstance().subscribe(() => {
            setIsLocalVsAllowed(LocalMultiplayerManager.getInstance().isLocalMultiplayerAllowed());
        });
        return unsubscribe;
    }, []);

    const bgRef = React.useRef<HTMLDivElement>(null);
    const targetOffset = React.useRef({ x: 0, y: 0 });
    const currentOffset = React.useRef({ x: 0, y: 0 });

    useEffect(() => {
        let isUnmounted = false;
        import('../../services/OnlineService').then(({ OnlineService }) => {
            if (isUnmounted) return;
            setOnlineStatus(OnlineService.currentStatus);
            OnlineService.subscribe((status) => {
                if (!isUnmounted) setOnlineStatus(status);
            });
        });
        
        const handleMouseMove = (e: MouseEvent) => {
            targetOffset.current = {
                x: (e.clientX / window.innerWidth - 0.5) * 30,
                y: (e.clientY / window.innerHeight - 0.5) * 30
            };
        };

        let animId: number;
        const updateParallax = () => {
            const lerpVal = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
            
            currentOffset.current.x = lerpVal(currentOffset.current.x, targetOffset.current.x, 0.08);
            currentOffset.current.y = lerpVal(currentOffset.current.y, targetOffset.current.y, 0.08);

            if (bgRef.current) {
                bgRef.current.style.transform = `translate3d(${currentOffset.current.x}px, ${currentOffset.current.y}px, 0)`;
            }
            animId = requestAnimationFrame(updateParallax);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animId = requestAnimationFrame(updateParallax);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animId);
        };
    }, []);

    const modes: { id: GameMode, title: string, subtitle: string, desc: string, img: string, icon: any, color: string, badge?: string }[] = [
        {
            id: 'ARCADE',
            title: t('mode_selection_arcade_title') || 'PLAYER VS CPU',
            subtitle: t('mode_selection_arcade_subtitle') || 'ARCADE',
            desc: isPt ? 'Enfrente uma série de oponentes controlados por IA em uma sequência de batalhas com dificuldade progressiva.' : 'Face a series of AI-controlled opponents in a sequence of battles with progressive difficulty.',
            img: '/Assets/fundosdastelas/modos/m1.png',
            icon: Gamepad2,
            color: 'from-orange-600/50 to-red-600/50'
        },
        {
            id: 'LOCAL_VS' as any,
            title: t('mode_selection_local_vs') || 'VERSUS LOCAL',
            subtitle: 'P1 VS P2',
            desc: 'Batalhe contra um amigo localmente no mesmo aparelho usando dois controles gamepad ou o mesmo teclado físico.',
            img: '/Assets/fundosdastelas/modos/m2.png',
            icon: Users2,
            color: 'from-blue-600/50 to-indigo-600/50',
            badge: 'MULTIPLAYER'
        },
        {
            id: 'ONLINE',
            title: t('mode_selection_online_title') || 'RANKED',
            subtitle: t('mode_selection_online_subtitle') || 'GLOBAL WARS',
            desc: t('mode_selection_online_desc') || 'Conecte-se e lute contra jogadores reais do mundo todo. Suba de patente e ganhe prêmios.',
            img: '/Assets/fundosdastelas/modos/m3.png',
            icon: Globe,
            color: 'from-emerald-600/50 to-teal-600/50'
        },
        {
            id: 'TOURNAMENT',
            title: t('mode_selection_tournament_title') || 'TORNEIO',
            subtitle: t('mode_selection_tournament_subtitle') || 'COPA DOS GUERREIROS',
            desc: t('mode_selection_tournament_desc') || 'Participe de um torneio eliminatório brutal e seja o único a chegar ao topo.',
            img: '/Assets/fundosdastelas/modos/m4.png',
            icon: Trophy,
            color: 'from-amber-500/50 to-orange-600/50'
        },
        {
            id: 'TRAINING',
            title: t('mode_selection_training_title') || 'TREINO',
            subtitle: t('mode_selection_training_subtitle') || 'SALA DO TEMPO',
            desc: t('mode_selection_training_desc') || 'Aprimore combos e descubra os limites do seu personagem contra um alvo imortal.',
            img: '/Assets/fundosdastelas/modos/m5.png',
            icon: Target,
            color: 'from-stone-600/50 to-stone-800/50'
        },
        {
            id: 'SURVIVAL',
            title: t('mode_selection_survival_title') || 'SOBREVIVÊNCIA',
            subtitle: t('mode_selection_survival_subtitle') || 'HORDAS INFINITAS',
            desc: t('mode_selection_survival_desc') || 'Enfrente ondas infinitas de oponentes. Quanto mais você sobrevive, mais fortes eles ficam.',
            img: '/Assets/fundosdastelas/modos/m6.png',
            icon: Shield,
            color: 'from-purple-600/50 to-pink-600/50'
        },
        {
            id: 'BOSS',
            title: t('mode_selection_boss_title') || 'CHEFE',
            subtitle: t('mode_selection_boss_subtitle') || 'BATALHA ÉPICA',
            desc: t('mode_selection_boss_desc') || 'Enfrente 3 chefes poderosos em sequência usando apenas 1 personagem. Sobreviva ao desafio final!',
            img: '/Assets/fundosdastelas/modos/m7.png',
            icon: Flame,
            color: 'from-red-700/50 to-orange-800/50',
            badge: 'PERIGO'
        }
    ];

    const selectedModeData = modes.find(m => m.id === selectedMode) || modes[0];
    const [showUpdatePopup, setShowUpdatePopup] = useState(false);

    const handleConfirm = () => {
        if (!selectedMode) return;
        AudioManager.getInstance().playSFX('confirm');

        if (selectedMode === 'SURVIVAL') {
            setAiDifficulty('MEDIUM');
        } else if (selectedMode === 'BOSS') {
            setAiDifficulty('BOSS');
        }

        if (selectedMode === 'STORY') {
            changeScene(SceneName.STORY_MODE);
        } else if (selectedMode === 'ONLINE') {
            import('../../services/OnlineService').then(({ OnlineService }) => {
                if (OnlineService.currentStatus === 'UPDATE_REQUIRED' || OnlineService.currentStatus === 'MAINTENANCE') {
                    setShowUpdatePopup(true);
                } else {
                    changeScene(SceneName.MULTIPLAYER);
                }
            });
        } else if (selectedMode === 'LOCAL_VS' as any) {
            if (LocalMultiplayerManager.getInstance().isLocalMultiplayerAllowed()) {
                changeScene(SceneName.SIDE_SELECTION);
            } else {
                AudioManager.getInstance().playSFX('cancel');
            }
        } else {
            beginCharacterSelection(selectedMode);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            const target = e.target as HTMLElement | null;
            const isInput = (el: HTMLElement | null) => !!(el && (
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.tagName === 'SELECT' ||
                el.isContentEditable
            ));

            if (isInput(active) || isInput(target) || isChatOpen) {
                return;
            }

            const currentIdx = modes.findIndex(m => m.id === selectedMode);
            if (currentIdx === -1) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'w') {
                e.preventDefault();
                const nextIdx = (currentIdx - 1 + modes.length) % modes.length;
                setSelectedMode(modes[nextIdx].id);
                AudioManager.getInstance().playSFX('click');
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 's') {
                e.preventDefault();
                const nextIdx = (currentIdx + 1) % modes.length;
                setSelectedMode(modes[nextIdx].id);
                AudioManager.getInstance().playSFX('click');
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                AudioManager.getInstance().playSFX('cancel');
                changeScene(SceneName.MAIN_MENU);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Gamepad navigation polling
        let rafId: number;
        let lastGpActionTime = 0;
        const gpActionDelay = 220; // ms between repeated sequential moves

        const pollGamepadNav = () => {
            if (typeof navigator !== 'undefined' && navigator.getGamepads) {
                const gps = navigator.getGamepads();
                const gp = gps[0] || gps[1]; // Check first or second gamepad
                if (gp && gp.connected) {
                    const now = performance.now();
                    const axes = gp.axes;
                    const btns = gp.buttons;
                    const axisThreshold = 0.5;

                    // Directions
                    const leftPressed = (axes[0] < -axisThreshold) || (btns[14] && btns[14].pressed);
                    const rightPressed = (axes[0] > axisThreshold) || (btns[15] && btns[15].pressed);
                    const upPressed = (axes[1] < -axisThreshold) || (btns[12] && btns[12].pressed);
                    const downPressed = (axes[1] > axisThreshold) || (btns[13] && btns[13].pressed);

                    const confirmPressed = btns[0] && btns[0].pressed; // Button A
                    const backPressed = btns[1] && btns[1].pressed; // Button B

                    if (now - lastGpActionTime > gpActionDelay) {
                        const idx = modes.findIndex(m => m.id === selectedMode);
                        if (idx !== -1) {
                            if (leftPressed || upPressed) {
                                const nextIdx = (idx - 1 + modes.length) % modes.length;
                                setSelectedMode(modes[nextIdx].id);
                                AudioManager.getInstance().playSFX('click');
                                lastGpActionTime = now;
                            } else if (rightPressed || downPressed) {
                                const nextIdx = (idx + 1) % modes.length;
                                setSelectedMode(modes[nextIdx].id);
                                AudioManager.getInstance().playSFX('click');
                                lastGpActionTime = now;
                            }
                        }
                    }

                    if (confirmPressed && (now - lastGpActionTime > gpActionDelay)) {
                        lastGpActionTime = now;
                        handleConfirm();
                    } else if (backPressed && (now - lastGpActionTime > gpActionDelay)) {
                        lastGpActionTime = now;
                        AudioManager.getInstance().playSFX('cancel');
                        changeScene(SceneName.MAIN_MENU);
                    }
                }
            }
            rafId = requestAnimationFrame(pollGamepadNav);
        };

        rafId = requestAnimationFrame(pollGamepadNav);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(rafId);
        };
    }, [selectedMode, changeScene]);

    const handleModeClick = (mode: GameMode) => {
        if (selectedMode === mode) {
            handleConfirm();
            return;
        }
        setSelectedMode(mode);
        AudioManager.getInstance().playSFX('click');
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* Background Texture Layers */}
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10" />
            
            {/* Ki Particles */}
            <KiParticles color="orange" particleCount={25} speed={1.0} />

            <div 
                ref={bgRef}
                className="absolute inset-0 pointer-events-none will-change-transform z-0"
            >
                <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-orange-600/10 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-yellow-600/10 rounded-full blur-[160px] animate-pulse" />
            </div>

            {/* Dynamic Background Image */}
            <AnimatePresence mode="wait">
                {selectedModeData && (
                    <motion.div
                        key={`bg-${selectedModeData.id}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.2, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <img src={selectedModeData.img} className="w-full h-full object-cover mix-blend-luminosity grayscale-[20%]" alt="" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${selectedModeData.color} opacity-40 mix-blend-overlay`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/40 to-stone-950" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP HEADER */}
            <header 
                className="relative w-full px-6 md:px-12 flex items-center justify-between z-40 border-b border-white/10 bg-stone-900 shrink-0"
                style={{ height: s(96), padding: `0 ${s(48)}px` }}
            >
                <div className="flex items-center" style={{ gap: s(32) }}>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { AudioManager.getInstance().playSFX('cancel'); changeScene(SceneName.MAIN_MENU); }}
                        className="rounded-xl border-stone-700 border flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all shrink-0 group cursor-pointer"
                        style={{ width: s(54), height: s(54) }}
                    >
                        <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" style={{ width: s(24), height: s(24) }} />
                    </motion.button>
                    
                    <h1 className="font-header italic uppercase tracking-wider text-white" style={{ fontSize: s(40) }}>
                        {t('mode_selection_title') || 'SELEÇÃO DE MODO'}
                    </h1>
                </div>

                <div className="flex flex-col items-end opacity-40">
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase">FIGHTER LEGEND</span>
                    <span className="text-[8px] font-black tracking-[0.2em] uppercase">BATTLE MODES</span>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full flex overflow-hidden relative z-10 p-6 md:p-10 gap-10">
                
                {/* VIEWPORT - MODE DETAIL (Left) */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {selectedModeData && (
                            <motion.div
                                key={selectedModeData.id}
                                initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="flex-1 flex flex-col"
                            >
                                {/* Mode Hero Display */}
                                <div className="relative flex-1 rounded-[40px] overflow-hidden border border-white/5 shadow-2xl bg-stone-900/40 backdrop-blur-2xl group">
                                    <img 
                                        src={selectedModeData.img} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-40 brightness-75" 
                                        alt="" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-12 flex items-end justify-between">
                                        <div className="flex flex-col gap-4 max-w-2xl">
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center transform -rotate-3"
                                                    style={{ width: s(48), height: s(48) }}
                                                >
                                                    {React.createElement(selectedModeData.icon, { style: { width: s(24), height: s(24) }, className: "text-orange-500" })}
                                                </div>
                                                <span 
                                                    className="font-black italic uppercase tracking-widest text-orange-400 bg-orange-400/5 rounded-xl border border-orange-500/10"
                                                    style={{ fontSize: s(14), padding: `${s(4)}px ${s(12)}px` }}
                                                >
                                                    {selectedModeData.subtitle}
                                                </span>
                                            </div>

                                            <h2 className="font-black italic uppercase tracking-wider text-white leading-tight font-header" style={{ fontSize: s(72) }}>
                                                {selectedModeData.title}
                                            </h2>
                                            
                                            <p className="font-bold italic text-stone-300 leading-relaxed max-w-xl" style={{ fontSize: s(18) }}>
                                                {selectedModeData.desc}
                                            </p>

                                            <div className="flex flex-col mt-6" style={{ gap: s(12) }}>
                                                {selectedModeData.id === 'LOCAL_VS' as any && !isLocalVsAllowed && (
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl flex items-center animate-pulse w-fit" style={{ padding: s(12), gap: s(10) }}>
                                                        <AlertCircle className="text-red-500 shrink-0" style={{ width: s(20), height: s(20) }} />
                                                        <span className="text-red-400 font-extrabold uppercase tracking-wider leading-snug" style={{ fontSize: s(12) }}>
                                                            REQUER CONTROLES: 2 GAMEPADS OU 1 TECLADO + 1 GAMEPAD
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <motion.button 
                                            disabled={selectedModeData.id === 'LOCAL_VS' as any && !isLocalVsAllowed}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleConfirm}
                                            className={`
                                                font-black italic uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center transition-all shadow-2xl cursor-pointer group
                                                ${selectedModeData.id === 'LOCAL_VS' as any && !isLocalVsAllowed
                                                    ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed opacity-50'
                                                    : 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white shadow-orange-500/20'
                                                }
                                            `}
                                            style={{ height: s(100), width: s(300), gap: s(16), fontSize: s(24) }}
                                        >
                                            <Zap className="group-hover:scale-110 transition-transform fill-white stroke-[2.5]" style={{ width: s(28), height: s(28) }} />
                                            <span>
                                                {selectedModeData.id === 'LOCAL_VS' as any
                                                    ? (isLocalVsAllowed ? 'COMBAT' : 'LOCKED')
                                                    : selectedModeData.id === 'ONLINE'
                                                        ? (t('mode_btn_matchmaking') || 'MATCHMAKING')
                                                        : (t('mode_btn_mission') || 'COMBAT')}
                                            </span>
                                        </motion.button>
                                    </div>

                                    {/* Subtle character background decoration */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 transition-opacity group-hover:opacity-30 duration-700 scale-125">
                                        <img src="/Assets/personagens/goku/parado.gif" className="h-[50vh] object-contain" alt="" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR - MODE LIST (Right) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-3 w-[340px] shrink-0 custom-scrollbar overflow-y-auto pl-2"
                >
                    <div className="mb-4 text-right pr-4">
                        <span className="text-[10px] font-black tracking-[0.3em] text-stone-500 uppercase opacity-60">MODOS DISPONÍVEIS</span>
                    </div>
                    {modes.map((item, i) => {
                        const isSelected = selectedMode === item.id;
                        const Icon = item.icon;
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ x: -8 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleModeClick(item.id)}
                                className={`
                                    relative flex items-center gap-5 px-6 py-5 rounded-2xl transition-all duration-300 group text-left border overflow-hidden
                                    ${isSelected 
                                        ? 'border-orange-500/50 text-white shadow-xl shadow-orange-500/10 ring-2 ring-orange-500/20' 
                                        : 'border-white/5 text-stone-500 hover:text-stone-300 hover:bg-white/5'
                                    }
                                `}
                            >
                                {/* Thumbnail Background */}
                                <div className="absolute inset-0 z-0">
                                    <img 
                                        src={item.img} 
                                        className={`w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 pointer-events-none
                                            ${isSelected ? 'opacity-40 brightness-110' : 'opacity-15 brightness-50 grayscale group-hover:grayscale-0 group-hover:opacity-25'}
                                        `} 
                                        alt="" 
                                    />
                                    <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelected ? 'bg-orange-600/5' : 'bg-stone-950/70 group-hover:bg-stone-950/40'}`} />
                                </div>

                                <div className={`
                                    relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all
                                    ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'bg-stone-900/60 text-stone-500 group-hover:text-stone-300'}
                                `}>
                                    <Icon size={22} />
                                </div>

                                <div className="relative z-10 flex flex-col overflow-hidden flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-black italic uppercase tracking-[0.2em] text-sm leading-none mb-1 transition-colors ${isSelected ? 'text-white' : ''}`}>
                                            {item.title}
                                        </span>
                                        {item.badge && (
                                            <span 
                                                className="font-black tracking-[0.1em] bg-red-600 text-white rounded px-2 py-0.5 animate-pulse shrink-0"
                                                style={{ fontSize: s(8) }}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-50 truncate">
                                        {item.subtitle}
                                    </span>
                                </div>

                                {isSelected && (
                                    <motion.div 
                                        layoutId="mode-sidebar-active"
                                        className="absolute right-0 w-1.5 h-1/2 bg-orange-500 rounded-l-full z-20"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </main>

            <UpdatePopup 
                isOpen={showUpdatePopup} 
                status={onlineStatus} 
                onClose={() => setShowUpdatePopup(false)} 
            />
        </div>
    );
};

export const ModeSelectionScreen: React.FC = () => (
    <UIProvider>
        <ModeSelectionScreenContent />
    </UIProvider>
);
