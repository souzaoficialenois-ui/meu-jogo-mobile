import React, { useMemo, useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { BASE_CHARACTERS, AVATAR_LIST, BACKGROUND_LIST, RESOURCE_SPRITES } from '../../constants';
import { AudioManager } from '../../services/AudioManager';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { KiParticles } from '../KiParticles';
import { AdBanner } from '../ads/AdBanner';
import { 
  ShoppingBag, 
  Settings, 
  Users, 
  Users2,
  Mail, 
  Trophy, 
  LayoutGrid,
  ShieldAlert,
  Star,
  Swords,
  Play,
  Zap,
  Tv,
  Award,
  Coins,
  Gem,
  Ticket,
  ChevronRight,
  Backpack,
  MessageSquare,
  Calendar,
  Sparkles,
  X,
  Compass,
  Globe,
  Shield,
  Target,
  Flame,
  BookOpen
} from 'lucide-react';

import { UpdatePopup } from '../dialogs/UpdatePopup';
import { OnlineService, OnlineStatus } from '../../services/OnlineService';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { AdOverlayModal } from '../ads/AdOverlayModal';
import { RewardToastModal } from '../ads/RewardToastModal';
import { PlayerTitleBadge } from '../ui/PlayerTitleBadge';

const MainMenuScreenContent: React.FC = () => {
    const { 
        changeScene, 
        beginCharacterSelection,
        setAiDifficulty,
        playerProfile, 
        coins, 
        gems, 
        bannerTokens,
        inbox,
        isAdmin,
        unlockedCharacters,
        currentUser,
        isOfflineMode,
        isChatOpen,
        setIsChatOpen,
        settings,
        addCoins,
        addGems,
        addRoomTokens,
        t
    } = useSceneManager();

    const { s } = useUI();

    const [isAdOpen, setIsAdOpen] = useState(false);
    const [rewardToast, setRewardToast] = useState<{
        isOpen: boolean;
        title?: string;
        coins?: number;
        gems?: number;
        tokens?: number;
    } | null>(null);

    const handleAdClose = (receivedReward: boolean) => {
        setIsAdOpen(false);
        if (receivedReward) {
            addCoins(500);
            if (addGems) addGems(50);
            if (addRoomTokens) addRoomTokens(1);
            AudioManager.getInstance().playSFX('victory');
            setRewardToast({
                isOpen: true,
                title: "¡RECOMPENSA DE VÍDEO RECEBIDA!",
                coins: 500,
                gems: 50,
                tokens: 1
            });
        }
    };

    // DIRECT BATTLE MODES IN MAIN MENU
    const menuItems = useMemo(() => [
        { 
            id: 'ARCADE', 
            label: t('mode_selection_arcade_title') || 'ARCADE', 
            desc: t('mode_selection_arcade_subtitle') || 'HISTÓRIA & DESAFIO IA', 
            icon: Swords, 
            color: 'from-orange-500 to-red-600',
            glow: 'rgba(249, 115, 22, 0.4)',
            img: '/Assets/fundosdastelas/modos/m1.png',
            badge: 'CPU'
        },
        { 
            id: 'LOCAL_VS', 
            label: t('mode_selection_local_vs') || 'VERSUS LOCAL', 
            desc: 'P1 VS P2 - BATALHA NO MESMO APARELHO', 
            icon: Users2, 
            color: 'from-blue-600 to-indigo-600',
            glow: 'rgba(37, 99, 235, 0.4)',
            img: '/Assets/fundosdastelas/modos/m2.png',
            badge: 'MULTIPLAYER'
        },
        { 
            id: 'ONLINE', 
            label: t('mode_selection_online_title') || 'MULTIPLAYER ONLINE', 
            desc: t('mode_selection_online_subtitle') || 'RANKED & GLOBAL WARS', 
            icon: Globe, 
            color: 'from-emerald-600 to-teal-600',
            glow: 'rgba(16, 185, 129, 0.4)',
            img: '/Assets/fundosdastelas/modos/m3.png',
            badge: 'RANKED'
        },
        { 
            id: 'TOURNAMENT', 
            label: t('mode_selection_tournament_title') || 'TORNEIO', 
            desc: t('mode_selection_tournament_subtitle') || 'COPA DOS GUERREIROS', 
            icon: Trophy, 
            color: 'from-amber-500 to-orange-600',
            glow: 'rgba(245, 158, 11, 0.4)',
            img: '/Assets/fundosdastelas/modos/m4.png',
            badge: 'ARENA'
        },
        { 
            id: 'TRAINING', 
            label: t('mode_selection_training_title') || 'TREINO', 
            desc: t('mode_selection_training_subtitle') || 'SALA DO TEMPO', 
            icon: Target, 
            color: 'from-stone-600 to-stone-800',
            glow: 'rgba(120, 113, 108, 0.4)',
            img: '/Assets/fundosdastelas/modos/m5.png',
            badge: 'PRÁTICA'
        },
        { 
            id: 'SURVIVAL', 
            label: t('mode_selection_survival_title') || 'SOBREVIVÊNCIA', 
            desc: t('mode_selection_survival_subtitle') || 'HORDAS INFINITAS', 
            icon: Shield, 
            color: 'from-purple-600 to-pink-600',
            glow: 'rgba(147, 51, 234, 0.4)',
            img: '/Assets/fundosdastelas/modos/m6.png',
            badge: 'DESAFIO'
        },
        { 
            id: 'BOSS', 
            label: t('mode_selection_boss_title') || 'MODO CHEFE', 
            desc: t('mode_selection_boss_subtitle') || 'BATALHA ÉPICA CONTRA CHEFES', 
            icon: Flame, 
            color: 'from-red-700 to-orange-800',
            glow: 'rgba(220, 38, 38, 0.4)',
            img: '/Assets/fundosdastelas/modos/m7.png',
            badge: 'PERIGO'
        }
    ], [t]);

    const modeOrder = ['ARCADE', 'LOCAL_VS', 'ONLINE', 'TOURNAMENT', 'TRAINING', 'SURVIVAL', 'BOSS'];

    const [selectedIndex, setSelectedIndex] = useState<number>(() => {
        try {
            const savedMode = localStorage.getItem('fighter_legend_selected_mode');
            if (savedMode) {
                const idx = modeOrder.indexOf(savedMode);
                if (idx !== -1) return idx;
            }
        } catch (e) {
            console.error(e);
        }
        return 0;
    });

    useEffect(() => {
        if (menuItems[selectedIndex]) {
            try {
                localStorage.setItem('fighter_legend_selected_mode', menuItems[selectedIndex].id);
            } catch (e) {
                console.error(e);
            }
        }
    }, [selectedIndex, menuItems]);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const unreadMails = inbox.filter(m => !m.read).length;

    const [showUpdatePopup, setShowUpdatePopup] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('LOADING');
    const hasShownPopupRef = React.useRef(false);

    useEffect(() => {
        let isUnmounted = false;
        
        const fetchStatus = async () => {
            await OnlineService.checkStatus();
            if (isUnmounted) return;
            const current = OnlineService.currentStatus;
            setOnlineStatus(current);
            if (!hasShownPopupRef.current && (current === 'UPDATE_REQUIRED' || current === 'MAINTENANCE')) {
                setShowUpdatePopup(true);
                hasShownPopupRef.current = true;
            }
        };

        fetchStatus();

        const unsub = OnlineService.subscribe((status) => {
            if (!isUnmounted) {
                setOnlineStatus(status);
                if (!hasShownPopupRef.current && (status === 'UPDATE_REQUIRED' || status === 'MAINTENANCE')) {
                    setShowUpdatePopup(true);
                    hasShownPopupRef.current = true;
                }
            }
        });

        return () => {
            isUnmounted = true;
            unsub();
        };
    }, []);

    const bgRef = React.useRef<HTMLDivElement>(null);
    const targetOffset = React.useRef({ x: 0, y: 0 });
    const currentOffset = React.useRef({ x: 0, y: 0 });

    useEffect(() => {
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

    const handleAction = (scene: SceneName) => {
        AudioManager.getInstance().playSFX('click');

        if (isOfflineMode && (scene === SceneName.PROFILE || scene === SceneName.PROFILE_EDIT)) {
            AudioManager.getInstance().playSFX('cancel');
            alert(t('offline_profile_error') || 'Perfil indisponível no modo Offline.');
            return;
        }

        // Check if an online-only scene is requested
        const isOnlineScene = 
            scene === SceneName.FRIENDS_MANAGEMENT || 
            scene === SceneName.SOCIAL ||
            scene === SceneName.MULTIPLAYER;

        if (isOnlineScene && (onlineStatus === 'UPDATE_REQUIRED' || onlineStatus === 'MAINTENANCE')) {
            setShowUpdatePopup(true);
            return;
        }

        changeScene(scene as SceneName);
    };

    // FLOATING BUTTONS ON INITIAL MAIN SCREEN
    const floatingFeatures = [
        {
            id: SceneName.SUMMON,
            label: t('menu_summon') || 'Invocação',
            badge: 'GACHA',
            icon: Star,
            color: 'from-amber-500/80 to-yellow-600/80 border-amber-400/50 text-amber-300 shadow-amber-500/20'
        },
        {
            id: SceneName.STRIKE_PASS,
            label: t('menu_pass') || 'Passe',
            badge: 'PASSE',
            icon: ShieldAlert,
            color: 'from-yellow-500/80 to-amber-600/80 border-yellow-400/50 text-yellow-300 shadow-yellow-500/20'
        },
        {
            id: SceneName.HALL_OF_FAME,
            label: t('menu_hall_of_fame') || 'Hall da Fama',
            badge: 'TOP 100',
            icon: Award,
            color: 'from-rose-500/80 to-red-600/80 border-rose-400/50 text-rose-300 shadow-rose-500/20'
        },
        {
            id: SceneName.WAREHOUSE,
            label: 'Armazém',
            badge: 'ITENS',
            icon: Backpack,
            color: 'from-cyan-500/80 to-blue-600/80 border-cyan-400/50 text-cyan-300 shadow-cyan-500/20'
        }
    ];

    const handleConfirmMode = (modeId: string) => {
        AudioManager.getInstance().playSFX('confirm');
        try {
            localStorage.setItem('fighter_legend_selected_mode', modeId);
        } catch (e) {
            console.error(e);
        }

        if (modeId === 'SURVIVAL') {
            setAiDifficulty('MEDIUM');
            beginCharacterSelection('SURVIVAL');
        } else if (modeId === 'BOSS') {
            setAiDifficulty('BOSS');
            beginCharacterSelection('BOSS');
        } else if (modeId === 'ONLINE') {
            if (onlineStatus === 'UPDATE_REQUIRED' || onlineStatus === 'MAINTENANCE') {
                setShowUpdatePopup(true);
            } else {
                changeScene(SceneName.MULTIPLAYER);
            }
        } else if (modeId === 'LOCAL_VS') {
            changeScene(SceneName.SIDE_SELECTION);
        } else if (modeId === 'TOURNAMENT') {
            beginCharacterSelection('TOURNAMENT');
        } else if (modeId === 'TRAINING') {
            beginCharacterSelection('TRAINING');
        } else {
            beginCharacterSelection('ARCADE');
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

            if (isInput(active) || isInput(target) || isChatOpen || isAdOpen || rewardToast?.isOpen) {
                return;
            }

            if (e.key === 'Escape' && isMenuOpen) {
                e.preventDefault();
                setIsMenuOpen(false);
                AudioManager.getInstance().playSFX('cancel');
                return;
            }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'w') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
                AudioManager.getInstance().playSFX('click');
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 's') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % menuItems.length);
                AudioManager.getInstance().playSFX('click');
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConfirmMode(menuItems[selectedIndex].id);
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

                    if (now - lastGpActionTime > gpActionDelay) {
                        if (leftPressed || upPressed) {
                            setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
                            AudioManager.getInstance().playSFX('click');
                            lastGpActionTime = now;
                        } else if (rightPressed || downPressed) {
                            setSelectedIndex(prev => (prev + 1) % menuItems.length);
                            AudioManager.getInstance().playSFX('click');
                            lastGpActionTime = now;
                        }
                    }

                    if (confirmPressed && (now - lastGpActionTime > gpActionDelay)) {
                        lastGpActionTime = now;
                        handleConfirmMode(menuItems[selectedIndex].id);
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
    }, [selectedIndex, isMenuOpen, isChatOpen, isAdOpen, rewardToast]);

    const handleItemClick = (i: number) => {
        setSelectedIndex(i);
        AudioManager.getInstance().playSFX('click');
    };

    const totalTickets = useMemo(() => {
        return Object.values(bannerTokens || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    }, [bannerTokens]);

    // Motion variants for cascade effect
    const panelVariants: Variants = {
        closed: {
            x: '100%',
            opacity: 0,
            transition: {
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1] as const
            }
        },
        open: {
            x: '0%',
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: [0.0, 0.0, 0.2, 1] as const,
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const buttonVariants: Variants = {
        closed: {
            x: 80,
            opacity: 0,
            scale: 0.95
        },
        open: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 320,
                damping: 24
            }
        }
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* BACKGROUND LAYERS */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <AnimatePresence mode="wait">
                    {menuItems[selectedIndex] && (
                        <motion.div
                            key={`bg-${menuItems[selectedIndex].id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.25 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                            className="absolute inset-0"
                        >
                            <img 
                                src={menuItems[selectedIndex].img} 
                                className="w-full h-full object-cover filter brightness-[0.6] contrast-[1.1] grayscale-[10%] blur-sm" 
                                alt="" 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Texture and Gradients */}
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute inset-0 backdrop-blur-md bg-stone-950/40" />
                
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />

                {/* Parallax Orbs & Ki Energy Sparkles */}
                <div 
                    ref={bgRef}
                    className="absolute inset-0 pointer-events-none will-change-transform z-0"
                >
                    <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-orange-600/10 rounded-full blur-[140px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/3 w-[60vw] h-[60vw] bg-yellow-500/10 rounded-full blur-[160px] animate-pulse" />
                    
                    {/* Floating Ki Energy Sparks */}
                    <div className="absolute top-1/3 left-1/6 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ki-sparkle" />
                    <div className="absolute top-2/3 right-1/4 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316] animate-ki-sparkle [animation-delay:0.7s]" />
                    <div className="absolute top-1/2 left-3/4 w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047] animate-ki-sparkle [animation-delay:1.4s]" />
                    <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-ki-sparkle [animation-delay:2s]" />
                </div>
            </div>

            {/* HEADER */}
            <header 
                className="relative w-full z-40 border-b border-white/5 bg-stone-950/50 backdrop-blur-xl shrink-0 flex items-center justify-between"
                style={{ height: s(100), padding: `0 ${s(48)}px` }}
            >
                <div className="flex items-center" style={{ gap: s(32) }}>
                    {/* Profile Summary */}
                    <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center cursor-pointer group"
                        style={{ gap: s(16) }}
                        onClick={() => handleAction(SceneName.PROFILE)}
                    >
                        <div 
                            className="relative rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-stone-900 group-hover:border-orange-500/80 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-300"
                            style={{ width: s(50), height: s(50) }}
                        >
                            <div className="absolute inset-0 bg-orange-500/10 rounded-xl animate-aura-glow pointer-events-none" />
                            {BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url && (
                                <img src={BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            )}
                            <img src={AVATAR_LIST.find(a => a.id === playerProfile?.avatarId)?.url || "/Assets/avatar/retrato/1.png"} alt="" className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-black italic uppercase tracking-[0.2em] text-white text-sm leading-none">{playerProfile?.name || 'PLAYER'}</span>
                            <div className="mt-1">
                                <PlayerTitleBadge 
                                    titleKey={playerProfile?.activeTitle || (typeof window !== 'undefined' ? localStorage.getItem('fighter_profile_title') || 'warrior' : 'warrior')} 
                                    size="xs" 
                                    isPt={settings?.language !== 'en'} 
                                />
                            </div>
                            <span className="text-orange-500 font-black uppercase tracking-[0.1em] text-[9px] mt-1 opacity-80">LEVEL {Math.floor(unlockedCharacters.length * 1.5)}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Resources */}
                <div className="flex items-center" style={{ gap: s(40) }}>
                    <div className="hidden lg:flex items-center bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md" style={{ padding: `${s(8)}px ${s(24)}px`, gap: s(32) }}>
                        <ResourceWidget type="GEM" value={gems} color="text-sky-400" />
                        <ResourceWidget type="COIN" value={coins} color="text-amber-400" />
                        <ResourceWidget type="TICKET" value={totalTickets} color="text-rose-400" />
                    </div>
                    
                    <div className="flex items-center" style={{ gap: s(12) }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                AudioManager.getInstance().playSFX('click');
                                setIsAdOpen(true);
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-2xl shadow-lg shadow-amber-500/20 border border-amber-300/40 cursor-pointer hover:brightness-110 transition-all text-xs uppercase tracking-wider"
                        >
                            <Tv className="w-4 h-4 animate-bounce" />
                            <span className="hidden sm:inline">GANHAR RECOMPENSAS</span>
                            <span className="sm:hidden">RECOMPENSAS</span>
                        </motion.button>
                        <HeaderButton icon={Users} onClick={() => handleAction(SceneName.FRIENDS_MANAGEMENT)} />
                        <HeaderButton icon={Mail} count={unreadMails} onClick={() => handleAction(SceneName.MESSAGES)} />
                        <HeaderButton icon={Settings} onClick={() => handleAction(SceneName.SETTINGS)} />
                    </div>
                </div>
            </header>

            {/* MAIN VIEWPORT - CLEAN & IMMERSIVE HERO AREA */}
            <main className="flex-1 w-full flex overflow-hidden relative z-10 p-6 md:p-10">
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {menuItems[selectedIndex] && (
                            <motion.div
                                key={menuItems[selectedIndex].id}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.04 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="flex-1 flex flex-col"
                            >
                                {/* Mode Hero Banner */}
                                <div className="relative flex-1 rounded-[36px] md:rounded-[48px] overflow-hidden border border-white/10 shadow-2xl bg-stone-900/30 backdrop-blur-xl group">
                                    <img 
                                        src={menuItems[selectedIndex].img} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[12s] group-hover:scale-105 opacity-50 brightness-90" 
                                        alt="" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
                                    
                                    {/* FLOATING BUTTONS ON INITIAL MAIN SCREEN (GACHA, SHOP, PASSE, HALL DA FAMA, ARMAZÉM, MISSÕES) */}
                                    <div className="absolute top-5 left-5 md:top-8 md:left-8 z-30 flex flex-wrap max-w-2xl gap-2 md:gap-3 pointer-events-auto">
                                        {floatingFeatures.map((feat) => {
                                            const Icon = feat.icon;
                                            return (
                                                <motion.button
                                                    key={feat.id}
                                                    whileHover={{ scale: 1.08, y: -2 }}
                                                    whileTap={{ scale: 0.94 }}
                                                    onClick={() => handleAction(feat.id)}
                                                    className="flex items-center gap-2.5 px-3.5 md:px-4 py-2 md:py-2.5 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all cursor-pointer group bg-stone-950/75 border-white/10 hover:border-orange-500/50 hover:bg-stone-900/90"
                                                >
                                                    <div className={`p-1.5 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-md`}>
                                                        <Icon size={18} className="text-white" />
                                                    </div>
                                                    <div className="flex flex-col items-start text-left">
                                                        <span className="text-[8px] font-black tracking-widest text-orange-400 uppercase leading-none mb-0.5">{feat.badge}</span>
                                                        <span className="text-xs md:text-sm font-black italic uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors leading-none">{feat.label}</span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Logo in Top Right of Hero */}
                                    <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20 pointer-events-none">
                                        <motion.img 
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            src={RESOURCE_SPRITES.LOGO} 
                                            alt="Fighter Legend" 
                                            className="h-16 md:h-24 object-contain filter drop-shadow-[0_0_35px_rgba(255,107,0,0.5)] opacity-90" 
                                        />
                                    </div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                                        <div className="flex flex-col gap-3 max-w-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="px-4 py-1.5 bg-orange-500/20 border border-orange-500/40 rounded-full backdrop-blur-md">
                                                    <span className="text-[11px] font-black italic uppercase tracking-[0.3em] text-orange-400">
                                                        MODO SELECIONADO
                                                    </span>
                                                </div>
                                            </div>
                                            <h2 className="text-5xl sm:text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.85] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                                                {menuItems[selectedIndex].label}
                                            </h2>
                                            <p className="text-stone-300 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm md:text-base opacity-90">
                                                {menuItems[selectedIndex].desc}
                                            </p>
                                        </div>

                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleConfirmMode(menuItems[selectedIndex].id)}
                                            className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:brightness-110 text-white font-black italic uppercase tracking-[0.2em] rounded-3xl flex items-center justify-center transition-all shadow-[0_20px_50px_rgba(234,88,12,0.4)] cursor-pointer group px-8 md:px-12 py-5 md:py-6 gap-4 text-xl md:text-2xl"
                                        >
                                            <span>ENTRAR</span>
                                            <ChevronRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} size={28} />
                                        </motion.button>
                                    </div>

                                    {/* Animated Character Background Decoration */}
                                    <div className="absolute right-4 bottom-0 pointer-events-none opacity-25 transition-opacity group-hover:opacity-35 duration-700 hidden lg:block">
                                        <img src="/Assets/personagens/goku/parado.gif" className="h-[55vh] object-contain" alt="" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* BACKDROP OVERLAY WHEN LATERAL PANEL IS OPEN */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            AudioManager.getInstance().playSFX('cancel');
                            setIsMenuOpen(false);
                        }}
                        className="fixed inset-0 z-40 bg-stone-950/70 backdrop-blur-xs cursor-pointer"
                    />
                )}
            </AnimatePresence>

            {/* LATERAL PANEL WITH GAME MODES (SLIDE-IN FROM RIGHT TO LEFT WITH CASCADE ANIMATION) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        variants={panelVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed right-0 top-0 bottom-0 z-50 w-[90vw] sm:w-[440px] md:w-[490px] lg:w-[520px] bg-stone-950/95 border-l border-white/10 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col pt-10 pb-28 px-6 md:px-8"
                    >
                        {/* Header of Lateral Panel */}
                        <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                                    <LayoutGrid size={26} />
                                </div>
                                <div>
                                    <h3 className="font-black italic uppercase tracking-[0.2em] text-white text-lg md:text-xl">
                                        MODOS DE JOGO
                                    </h3>
                                    <p className="text-[11px] md:text-xs text-stone-400 font-bold uppercase tracking-widest">
                                        SELECIONE O MODO DESEJADO
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    AudioManager.getInstance().playSFX('cancel');
                                    setIsMenuOpen(false);
                                }}
                                className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-stone-400 hover:text-white transition-all cursor-pointer"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* AMPLIFIED SCROLLABLE GAME MODES LIST WITH CASCADE ANIMATION */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 pb-6">
                            {menuItems.map((item, i) => {
                                const isSelected = selectedIndex === i;
                                const Icon = item.icon;
                                return (
                                    <motion.button
                                        key={item.id}
                                        variants={buttonVariants}
                                        whileHover={{ scale: 1.02, x: -6 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            handleItemClick(i);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`
                                            relative w-full flex items-center gap-5 p-5 md:p-6 rounded-3xl transition-all duration-300 group text-left border overflow-hidden shrink-0 shadow-2xl cursor-pointer
                                            ${isSelected 
                                                ? 'border-orange-500 bg-stone-900/90 text-white shadow-[0_15px_40px_rgba(249,115,22,0.25)] ring-2 ring-orange-500/30' 
                                                : 'border-white/10 bg-stone-900/60 text-stone-300 hover:border-orange-500/40 hover:text-white hover:bg-stone-900/90'
                                            }
                                        `}
                                    >
                                        {/* Background Image */}
                                        <img 
                                            src={item.img} 
                                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 pointer-events-none
                                                ${isSelected ? 'opacity-40 brightness-110' : 'opacity-20 brightness-60 group-hover:opacity-35'}
                                            `} 
                                            alt="" 
                                        />
                                        
                                        {/* Readability Overlay */}
                                        <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelected ? 'bg-gradient-to-r from-orange-950/80 via-stone-900/80 to-stone-950/90' : 'bg-stone-950/70 group-hover:bg-stone-950/50'}`} />

                                        {/* Amplified Icon Container */}
                                        <div className={`
                                            relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-xl
                                            ${isSelected 
                                                ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-500/40' 
                                                : 'bg-stone-950/80 text-orange-400 group-hover:text-white group-hover:bg-orange-600/80 border border-white/10'
                                            }
                                        `}>
                                            <Icon size={28} />
                                        </div>

                                        {/* Amplified Labels */}
                                        <div className="relative z-10 flex flex-col flex-1 min-w-0">
                                            <span className={`font-black italic uppercase tracking-[0.2em] text-base md:text-xl leading-snug mb-1 transition-colors ${isSelected ? 'text-white' : 'text-stone-200 group-hover:text-white'}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-xs md:text-sm font-bold uppercase tracking-[0.1em] opacity-60 truncate text-stone-400">
                                                {item.desc}
                                            </span>
                                        </div>

                                        <div className="relative z-10 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                            <ChevronRight size={24} className={isSelected ? 'text-orange-400' : 'text-stone-400'} />
                                        </div>

                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full z-20 shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP/BOTTOM BANNER AD */}
            <AdBanner className="mb-1" />

            {/* FOOTER BAR */}
            <motion.footer 
                className="relative z-30 bg-stone-950/80 border-t border-white/10 backdrop-blur-2xl shrink-0 flex items-center justify-between"
                style={{ height: s(84), padding: `0 ${s(48)}px` }}
            >
                {/* LEFT SIDE: MODOS DE JOGO MENU BUTTON & NAVIGATION */}
                <div className="flex items-center gap-4 md:gap-8">
                    {/* MODOS DE JOGO BUTTON IN BOTTOM LEFT FOOTER */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            AudioManager.getInstance().playSFX('click');
                            setIsMenuOpen(prev => !prev);
                        }}
                        className={`
                            flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 rounded-2xl border-2 backdrop-blur-2xl shadow-xl transition-all cursor-pointer group
                            ${isMenuOpen 
                                ? 'bg-red-600 border-red-400 text-white shadow-red-600/30' 
                                : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 border-orange-300/60 text-white shadow-orange-600/40 hover:brightness-110'
                            }
                        `}
                    >
                        <div className={`p-1 rounded-lg transition-transform ${isMenuOpen ? 'rotate-90 bg-red-700' : 'bg-orange-700/50 group-hover:rotate-12'}`}>
                            {isMenuOpen ? <X size={20} /> : <LayoutGrid size={22} />}
                        </div>
                        <span className="font-black italic uppercase tracking-[0.2em] text-xs md:text-sm drop-shadow-md">
                            {isMenuOpen ? 'FECHAR MENU' : 'MODOS DE JOGO'}
                        </span>
                    </motion.button>

                    <div className="flex" style={{ gap: s(36) }}>
                        <FooterButton icon={ShoppingBag} label={t('menu_shop') || "LOJA"} onClick={() => handleAction(SceneName.SHOP)} />
                        <FooterButton icon={MessageSquare} label="CHAT" onClick={() => setIsChatOpen(true)} />
                        <FooterButton icon={Calendar} label={t('menu_events') || "EVENTOS"} onClick={() => handleAction(SceneName.MISSIONS)} />
                    </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6">
                    {isAdmin && (
                        <button 
                            onClick={() => handleAction(SceneName.ADMIN_PANEL)}
                            className="bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 font-black italic uppercase tracking-[0.3em] rounded-xl transition-all cursor-pointer backdrop-blur-md"
                            style={{ fontSize: s(11), padding: `${s(12)}px ${s(24)}px` }}
                        >
                            ADMIN
                        </button>
                    )}

                    <div className="flex flex-col items-end opacity-40 hidden lg:flex">
                        <span className="text-[8px] font-black tracking-[0.2em] uppercase">VERSION 2.4.0</span>
                        <span className="text-[8px] font-black tracking-[0.2em] uppercase">FIGHTER LEGEND ENGINE</span>
                    </div>
                </div>
            </motion.footer>

            <UpdatePopup 
                isOpen={showUpdatePopup} 
                status={onlineStatus} 
                onClose={() => setShowUpdatePopup(false)} 
            />

            {/* Video Ad Modal */}
            <AdOverlayModal
                isOpen={isAdOpen}
                rewardConfig={{ type: 'COINS', amount: 500 }}
                onClose={handleAdClose}
            />

            {/* Visual Feedback Modal */}
            {rewardToast && (
                <RewardToastModal
                    isOpen={rewardToast.isOpen}
                    title={rewardToast.title}
                    coins={rewardToast.coins}
                    gems={rewardToast.gems}
                    tokens={rewardToast.tokens}
                    onClose={() => setRewardToast(null)}
                />
            )}
        </div>
    );
};

export const MainMenuScreen: React.FC = () => (
    <UIProvider>
        <MainMenuScreenContent />
    </UIProvider>
);

// --- SUB-COMPONENTS ---

const ResourceWidget = ({ type, value, color }: { type: 'GEM' | 'COIN' | 'TICKET', value: number, color: string }) => {
    const { s } = useUI();
    return (
        <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <img 
                    src={RESOURCE_SPRITES[type]} 
                    alt={type} 
                    className="object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 relative z-10" 
                    style={{ width: s(32), height: s(32) }}
                    referrerPolicy="no-referrer"
                    draggable={false}
                />
            </div>
            <div className="flex flex-col">
                <span className="font-black tracking-[0.3em] text-stone-500 uppercase leading-none mb-1.5" style={{ fontSize: s(9) }}>{type === 'GEM' ? 'DIAMANTES' : type === 'COIN' ? 'OURO' : 'TOKENS'}</span>
                <span className={`font-black text-white ${color} leading-none tracking-wider`} style={{ fontSize: s(18) }}>{value.toLocaleString()}</span>
            </div>
        </div>
    );
};

const HeaderButton = ({ icon: Icon, count, onClick }: { icon: any, count?: number, onClick: () => void }) => {
    const { s } = useUI();
    return (
        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(41, 37, 36, 0.8)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick} 
            className="flex items-center justify-center bg-stone-900/60 border border-white/10 rounded-xl text-stone-400 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-xl"
            style={{ width: s(54), height: s(54) }}
        >
            <Icon style={{ width: s(24), height: s(24) }} />
            {count !== undefined && count > 0 && (
                <span 
                    className="absolute bg-orange-600 rounded-full text-white font-black flex items-center justify-center border-2 border-stone-950 shadow-xl"
                    style={{ top: s(-4), right: s(-4), width: s(22), height: s(22), fontSize: s(10) }}
                >
                    {count}
                </span>
            )}
        </motion.button>
    );
};

const FooterButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => {
    const { s } = useUI();
    return (
        <button 
            onClick={onClick} 
            className="flex items-center text-stone-500 hover:text-white transition-all cursor-pointer group gap-4"
        >
            <div className="p-2 rounded-lg bg-stone-900/40 border border-white/5 group-hover:border-orange-500/50 group-hover:bg-stone-800 transition-all">
                <Icon style={{ width: s(22), height: s(22) }} className="group-hover:text-orange-500 transition-colors" />
            </div>
            <span className="font-black italic uppercase tracking-[0.3em]" style={{ fontSize: s(13) }}>{label}</span>
        </button>
    );
};


