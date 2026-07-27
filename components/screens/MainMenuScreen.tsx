import React, { useMemo, useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { BASE_CHARACTERS, AVATAR_LIST, BACKGROUND_LIST, RESOURCE_SPRITES } from '../../constants';
import { AudioManager } from '../../services/AudioManager';
import { motion, AnimatePresence } from 'framer-motion';
import { KiParticles } from '../KiParticles';
import { 
  ShoppingBag, 
  Settings, 
  Users, 
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
  Sparkles
} from 'lucide-react';

import { UpdatePopup } from '../dialogs/UpdatePopup';
import { OnlineService, OnlineStatus } from '../../services/OnlineService';
import { useUI, UIProvider } from '../../contexts/UIContext';

const MainMenuScreenContent: React.FC = () => {
    const { 
        changeScene, 
        playerProfile, 
        coins, 
        gems, 
        bannerTokens,
        inbox,
        isAdmin,
        unlockedCharacters,
        currentUser,
        isOfflineMode,
        setIsChatOpen,
        t
    } = useSceneManager();

    const { s } = useUI();

    const [selectedIndex, setSelectedIndex] = useState<number>(0);
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

        changeScene(scene);
    };

    const menuItems = [
        { 
            id: SceneName.SINGLE_PLAYER_MENU, 
            label: t('menu_arcade') || 'BATALHA', 
            desc: t('mode_selection_arcade_subtitle') || 'STORY & EVENTS', 
            icon: Swords, 
            color: 'from-orange-500 to-red-600',
            glow: 'rgba(249, 115, 22, 0.4)',
            img: '/Assets/fundosdastelas/modos/m1.png'
        },
        { 
            id: SceneName.SUMMON, 
            label: t('menu_summon') || 'INVOCAÇÃO', 
            desc: t('menu_summon_sub') || 'GACHA SYSTEM', 
            icon: Star, 
            color: 'from-yellow-400 to-amber-600',
            glow: 'rgba(234, 179, 8, 0.4)',
            img: '/Assets/fundosdastelas/modos/m3.png'
        },
        { 
            id: SceneName.SHOP, 
            label: t('menu_shop') || 'MERCADO', 
            desc: t('menu_shop_sub') || 'ITEM SHOP', 
            icon: ShoppingBag, 
            color: 'from-orange-500 to-yellow-500',
            glow: 'rgba(249, 115, 22, 0.4)',
            img: '/Assets/fundosdastelas/modos/m4.png'
        },
        { 
            id: SceneName.TOURNAMENT, 
            label: t('menu_tournament') || 'ARENA', 
            desc: t('mode_selection_online_subtitle') || 'RANKED MATCHES', 
            icon: Trophy, 
            color: 'from-red-600 to-rose-700',
            glow: 'rgba(220, 38, 38, 0.4)',
            img: '/Assets/fundosdastelas/modos/m5.png'
        },
        { 
            id: SceneName.STRIKE_PASS, 
            label: t('menu_pass') || 'PASS', 
            desc: t('menu_pass_sub') || 'SEASON REWARDS', 
            icon: ShieldAlert, 
            color: 'from-yellow-500 to-amber-500',
            glow: 'rgba(234, 179, 8, 0.4)',
            img: '/Assets/fundosdastelas/modos/m6.png'
        },
        { 
            id: SceneName.HALL_OF_FAME, 
            label: t('menu_hall_of_fame') || 'HALL DA FAMA', 
            desc: t('menu_hall_of_fame_sub') || 'TEMPORADAS & LENDAS', 
            icon: Award, 
            color: 'from-amber-500 to-red-600',
            glow: 'rgba(245, 158, 11, 0.4)',
            img: '/Assets/fundosdastelas/modos/m7.png'
        },
        { 
            id: SceneName.WAREHOUSE, 
            label: 'ARMAZÉM', 
            desc: 'INVENTÁRIO & RECURSOS', 
            icon: Backpack, 
            color: 'from-cyan-500 to-blue-600',
            glow: 'rgba(6, 182, 212, 0.4)',
            img: '/Assets/fundosdastelas/modos/m3.png'
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
                handleAction(menuItems[selectedIndex].id);
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
                        handleAction(menuItems[selectedIndex].id);
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
    }, [selectedIndex]);

    const handleItemClick = (i: number, id: SceneName) => {
        if (selectedIndex === i) {
            handleAction(id);
        } else {
            setSelectedIndex(i);
            AudioManager.getInstance().playSFX('click');
        }
    };

    const totalTickets = useMemo(() => {
        return Object.values(bannerTokens || {}).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    }, [bannerTokens]);

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* BACKGROUND LAYERS - Matching SettingsScreen DNA */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <AnimatePresence mode="wait">
                    {menuItems[selectedIndex] && (
                        <motion.div
                            key={`bg-${menuItems[selectedIndex].id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0"
                        >
                            <img 
                                src={menuItems[selectedIndex].img} 
                                className="w-full h-full object-cover filter brightness-[0.5] contrast-[1.1] grayscale-[20%] blur-md" 
                                alt="" 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Texture and Gradients */}
                <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute inset-0 backdrop-blur-md bg-stone-950/40" />
                
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

                {/* Parallax Orbs */}
                <div 
                    ref={bgRef}
                    className="absolute inset-0 pointer-events-none will-change-transform z-0"
                >
                    <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-orange-600/5 rounded-full blur-[140px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/3 w-[60vw] h-[60vw] bg-yellow-500/5 rounded-full blur-[160px] animate-pulse" />
                </div>
            </div>

            {/* HEADER - Similar to Settings but with resources */}
            <header 
                className="relative w-full z-50 border-b border-white/5 bg-stone-950/40 backdrop-blur-xl shrink-0 flex items-center justify-between"
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
                            className="relative rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-stone-900 group-hover:border-orange-500/50 transition-all duration-300"
                            style={{ width: s(50), height: s(50) }}
                        >
                            {BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url && (
                                <img src={BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            )}
                            <img src={AVATAR_LIST.find(a => a.id === playerProfile?.avatarId)?.url || "/Assets/UI/avatar_placeholder.png"} alt="" className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black italic uppercase tracking-[0.2em] text-white text-sm leading-none">{playerProfile?.name || 'PLAYER'}</span>
                            <span className="text-orange-500 font-black uppercase tracking-[0.1em] text-[10px] mt-1 opacity-80">LEVEL {Math.floor(unlockedCharacters.length * 1.5)}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Resources - Shared DNA with Settings Rows */}
                <div className="flex items-center" style={{ gap: s(40) }}>
                    <div className="hidden lg:flex items-center bg-white/5 border border-white/5 rounded-2xl backdrop-blur-md" style={{ padding: `${s(8)}px ${s(24)}px`, gap: s(32) }}>
                        <ResourceWidget type="GEM" value={gems} color="text-sky-400" />
                        <ResourceWidget type="COIN" value={coins} color="text-amber-400" />
                        <ResourceWidget type="TICKET" value={totalTickets} color="text-rose-400" />
                    </div>
                    
                    <div className="flex" style={{ gap: s(12) }}>
                        <HeaderButton icon={Mail} count={unreadMails} onClick={() => handleAction(SceneName.MESSAGES)} />
                        <HeaderButton icon={Settings} onClick={() => handleAction(SceneName.SETTINGS)} />
                    </div>
                </div>
            </header>

            {/* MAIN LAYOUT - VIEWPORT + SIDEBAR (Sidebar now on the right) */}
            <main className="flex-1 w-full flex overflow-hidden relative z-10 p-6 md:p-10 gap-10">
                
                {/* VIEWPORT - MODE DETAIL (Like Content area in Settings) */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {menuItems[selectedIndex] && (
                            <motion.div
                                key={menuItems[selectedIndex].id}
                                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 1.05, x: 20 }}
                                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                className="flex-1 flex flex-col"
                            >
                                {/* Mode Hero Area */}
                                <div className="relative flex-1 rounded-[40px] overflow-hidden border border-white/5 shadow-2xl bg-stone-900/20 backdrop-blur-2xl group">
                                    <img 
                                        src={menuItems[selectedIndex].img} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-40 brightness-75" 
                                        alt="" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                                    
                                    {/* Logo in Hero Area */}
                                    <div className="absolute top-12 right-12 z-20 pointer-events-none">
                                        <motion.img 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            src={RESOURCE_SPRITES.LOGO} 
                                            alt="Logo" 
                                            className="h-20 object-contain filter drop-shadow-[0_0_30px_rgba(255,107,0,0.4)] opacity-80" 
                                        />
                                    </div>
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-12 flex items-end justify-between">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full">
                                                    <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-orange-500">SELECTED MODE</span>
                                                </div>
                                            </div>
                                            <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.8] drop-shadow-2xl">
                                                {menuItems[selectedIndex].label}
                                            </h2>
                                            <p className="text-stone-400 font-black uppercase tracking-[0.4em] text-sm opacity-80 mt-2">
                                                {menuItems[selectedIndex].desc}
                                            </p>
                                        </div>

                                        <motion.button 
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleAction(menuItems[selectedIndex].id)}
                                            className="bg-orange-600 hover:bg-orange-500 text-white font-black italic uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center transition-all shadow-[0_20px_50px_rgba(234,88,12,0.3)] hover:shadow-[0_25px_60px_rgba(234,88,12,0.4)] cursor-pointer group"
                                            style={{ height: s(100), width: s(280), gap: s(16), fontSize: s(24) }}
                                        >
                                            <span>{t('menu_access') || 'ENTRAR'}</span>
                                            <ChevronRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
                                        </motion.button>
                                    </div>

                                    {/* Animated Character Background Decoration (Small & Subtle) */}
                                    <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 transition-opacity group-hover:opacity-30 duration-700">
                                        <img src="/Assets/personagens/goku/parado.gif" className="h-[60vh] object-contain translate-x-1/4" alt="" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDEBAR - VERTICAL MODES (Now on the Right) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-3 w-80 shrink-0 custom-scrollbar overflow-y-auto pl-4"
                >
                    <div className="mb-4 text-right">
                        <span className="text-[10px] font-black tracking-[0.3em] text-stone-500 uppercase opacity-60 px-4">GAME MODES</span>
                    </div>
                    {menuItems.map((item, i) => {
                        const isSelected = selectedIndex === i;
                        const Icon = item.icon;
                        return (
                            <motion.button
                                key={item.id}
                                whileHover={{ x: -8 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleItemClick(i, item.id)}
                                className={`
                                    relative flex items-center gap-5 px-6 py-5 rounded-2xl transition-all duration-300 group text-left border overflow-hidden
                                    ${isSelected 
                                        ? 'border-orange-500/50 text-white shadow-[0_10px_30px_rgba(249,115,22,0.1)]' 
                                        : 'border-white/5 text-stone-500 hover:text-stone-300'
                                    }
                                `}
                            >
                                {/* Background Image with dynamic styling */}
                                <img 
                                    src={item.img} 
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 pointer-events-none
                                        ${isSelected ? 'opacity-40 brightness-125' : 'opacity-20 brightness-50 grayscale group-hover:grayscale-0 group-hover:opacity-30'}
                                    `} 
                                    alt="" 
                                />
                                
                                {/* Readability Overlay */}
                                <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelected ? 'bg-orange-600/10' : 'bg-stone-950/60 group-hover:bg-stone-950/40'}`} />

                                <div className={`
                                    relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                    ${isSelected ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-stone-950/40 text-stone-600 group-hover:text-stone-400'}
                                `}>
                                    <Icon size={20} />
                                </div>
                                <div className="relative z-10 flex flex-col overflow-hidden">
                                    <span className={`font-black italic uppercase tracking-[0.2em] text-sm leading-none mb-1 transition-colors ${isSelected ? 'text-white' : ''}`}>{item.label}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-40 truncate">{item.desc}</span>
                                </div>
                                {isSelected && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="absolute right-0 w-1.5 h-1/2 bg-orange-500 rounded-l-full z-20"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </main>

            {/* FOOTER BAR - Consistent with Absolute Bottom in Settings */}
            <motion.footer 
                className="relative z-40 bg-stone-950/80 border-t border-white/10 backdrop-blur-2xl shrink-0 flex items-center justify-between"
                style={{ height: s(84), padding: `0 ${s(48)}px` }}
            >
                <div className="flex" style={{ gap: s(48) }}>
                    <FooterButton icon={MessageSquare} label="CHAT" onClick={() => setIsChatOpen(true)} />
                    <FooterButton icon={Users} label={t('menu_friends') || "AMIGOS"} onClick={() => handleAction(SceneName.FRIENDS_MANAGEMENT)} />
                    <FooterButton icon={Calendar} label={t('menu_events') || "EVENTOS"} onClick={() => handleAction(SceneName.MISSIONS)} />
                </div>
                
                <div className="flex items-center gap-6">
                    {isAdmin && (
                        <button 
                            onClick={() => handleAction(SceneName.ADMIN_PANEL)}
                            className="bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 font-black italic uppercase tracking-[0.3em] rounded-xl transition-all cursor-pointer backdrop-blur-md"
                            style={{ fontSize: s(11), padding: `${s(12)}px ${s(24)}px` }}
                        >
                            ADMIN
                        </button>
                    )}
                    <div className="flex flex-col items-end opacity-40">
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

