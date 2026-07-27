import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, Mission, MissionType, GameEvent } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { motion, AnimatePresence } from 'framer-motion';
import { RESOURCE_SPRITES, AVATAR_LIST, BACKGROUND_LIST } from '../../constants';
import { 
    CheckCircle2, 
    Ticket, 
    Gem, 
    CircleDollarSign, 
    ChevronLeft, 
    Zap, 
    Trophy, 
    Flame,
    Target,
    Clock,
    Calendar,
    Star,
    Rocket,
    Gift,
    Handshake,
    Swords,
    Sun,
    Image as ImageIcon,
    Sparkles,
    Check,
    Award,
    Box,
    CheckCheck
} from 'lucide-react';

type TabType = MissionType | 'OVERVIEW';
type FilterStatus = 'ALL' | 'IN_PROGRESS' | 'READY' | 'CLAIMED';

interface DailyMilestone {
    id: number;
    target: number; // Number of completed daily missions required
    coins: number;
    gems: number;
    tickets: number;
    xp: number;
    label: string;
}

const DAILY_MILESTONES: DailyMilestone[] = [
    { id: 1, target: 2, coins: 300, gems: 20, tickets: 0, xp: 200, label: '2 Dailies' },
    { id: 2, target: 5, coins: 500, gems: 50, tickets: 1, xp: 400, label: '5 Dailies' },
    { id: 3, target: 7, coins: 1000, gems: 100, tickets: 2, xp: 600, label: '7 Dailies' },
];

export const MissionScreen: React.FC = () => {
    const { 
        changeScene, 
        missions, 
        activeEvents, 
        claimMissionReward, 
        currentUser,
        t,
        settings: gameSettings,
        coins,
        gems,
        addCoins,
        addGems,
        addTickets,
        addPassXp
    } = useSceneManager();

    const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [claimedMilestones, setClaimedMilestones] = useState<number[]>([]);
    const [rewardToast, setRewardToast] = useState<string | null>(null);

    const isPt = gameSettings.language === 'pt' || gameSettings.language === 'pt-BR';

    // Date key for today's milestone persistence
    const getTodayKey = () => {
        const d = new Date();
        const uid = currentUser?.uid || 'guest';
        return `dd2d_daily_milestones_${uid}_${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}`;
    };

    // Load milestone progress
    useEffect(() => {
        try {
            const saved = localStorage.getItem(getTodayKey());
            if (saved) {
                setClaimedMilestones(JSON.parse(saved));
            } else {
                setClaimedMilestones([]);
            }
        } catch (_) {
            setClaimedMilestones([]);
        }
    }, [currentUser]);

    // Daily countdown timer until midnight
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);
            const diff = Math.max(0, tomorrow.getTime() - now.getTime());
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

    // Sidebar Tabs
    const tabs = [
        { id: 'OVERVIEW' as TabType, label: isPt ? 'VISÃO GERAL' : 'OVERVIEW', icon: Target },
        { id: 'DAILY' as TabType, label: isPt ? 'DIÁRIO' : 'DAILY', icon: Zap },
        { id: 'WEEKLY' as TabType, label: isPt ? 'SEMANAL' : 'WEEKLY', icon: Trophy },
        { id: 'MONTHLY' as TabType, label: isPt ? 'MENSAL' : 'MONTHLY', icon: Calendar },
        { id: 'SEASONAL' as TabType, label: isPt ? 'SAZONAL' : 'SEASONAL', icon: Sun },
        { id: 'SPECIAL' as TabType, label: isPt ? 'ESPECIAL' : 'SPECIAL', icon: Star },
        { id: 'LAUNCH' as TabType, label: isPt ? 'LANÇAMENTO' : 'LAUNCH', icon: Rocket },
        { id: 'ANNIVERSARY' as TabType, label: isPt ? 'ANIVERSÁRIO' : 'ANNIVERSARY', icon: Gift },
        { id: 'COLLAB' as TabType, label: isPt ? 'COLABORAÇÃO' : 'COLLAB', icon: Handshake },
        { id: 'COMPETITIVE' as TabType, label: isPt ? 'COMPETITIVO' : 'COMPETITIVE', icon: Swords },
        { id: 'WEEKEND' as TabType, label: isPt ? 'FIM DE SEMANA' : 'WEEKEND', icon: Clock },
    ];

    // Calculate daily progress stats
    const dailyMissions = missions.filter(m => m.type === 'DAILY');
    const completedDailiesCount = dailyMissions.filter(m => m.claimed || m.current >= m.target).length;
    const totalDailiesCount = Math.max(dailyMissions.length, 7);
    const readyDailiesCount = dailyMissions.filter(m => !m.claimed && m.current >= m.target).length;

    // Filter missions by active tab and filter status
    let currentTabMissions = selectedEventId 
        ? missions.filter(m => m.eventId === selectedEventId) 
        : missions.filter(m => m.type === activeTab);

    if (filterStatus === 'IN_PROGRESS') {
        currentTabMissions = currentTabMissions.filter(m => !m.claimed && m.current < m.target);
    } else if (filterStatus === 'READY') {
        currentTabMissions = currentTabMissions.filter(m => !m.claimed && m.current >= m.target);
    } else if (filterStatus === 'CLAIMED') {
        currentTabMissions = currentTabMissions.filter(m => m.claimed);
    }

    const readyInCurrentTab = currentTabMissions.filter(m => !m.claimed && m.current >= m.target).length;

    // Get count of ready missions per tab for notification badges
    const getUnclaimedCount = (type: MissionType) => {
        return missions.filter(m => m.type === type && !m.claimed && m.current >= m.target).length;
    };

    const totalUnclaimedOverview = missions.filter(m => !m.claimed && m.current >= m.target).length;

    const showToast = (msg: string) => {
        setRewardToast(msg);
        setTimeout(() => setRewardToast(null), 3000);
    };

    const handleClaim = (id: string) => {
        const m = missions.find(x => x.id === id);
        if (!m) return;
        claimMissionReward(id);
        AudioManager.getInstance().playSFX('confirm');
        showToast(isPt ? `Recompensa Resgatada! +${m.rewardAmount} ${m.rewardType}` : `Reward Claimed! +${m.rewardAmount} ${m.rewardType}`);
    };

    // Claim all ready missions in current active list
    const handleClaimAll = () => {
        const readyList = currentTabMissions.filter(m => !m.claimed && m.current >= m.target);
        if (readyList.length === 0) return;

        readyList.forEach(m => {
            claimMissionReward(m.id);
        });

        AudioManager.getInstance().playSFX('confirm');
        showToast(isPt ? `Todas as ${readyList.length} missões foram resgatadas!` : `Claimed all ${readyList.length} ready missions!`);
    };

    // Claim daily milestone chest
    const handleClaimMilestone = (ms: DailyMilestone) => {
        if (claimedMilestones.includes(ms.id) || completedDailiesCount < ms.target) return;

        if (ms.coins > 0) addCoins(ms.coins);
        if (ms.gems > 0) addGems(ms.gems);
        if (ms.tickets > 0) addTickets(ms.tickets);
        if (ms.xp > 0 && addPassXp) addPassXp(ms.xp);

        const updated = [...claimedMilestones, ms.id];
        setClaimedMilestones(updated);
        localStorage.setItem(getTodayKey(), JSON.stringify(updated));

        AudioManager.getInstance().playSFX('victory');
        showToast(isPt ? `Baú de Bônus Resgatado! +${ms.xp} XP & Recursos!` : `Daily Bonus Chest Unlocked! +${ms.xp} XP & Resources!`);
    };

    const renderMissionItem = (mission: Mission, idx: number) => {
        const isReady = !mission.claimed && mission.current >= mission.target;
        const progress = Math.min(100, (mission.current / mission.target) * 100);

        let rewardSprite = '';
        if (mission.rewardType === 'COIN') rewardSprite = RESOURCE_SPRITES.COIN;
        else if (mission.rewardType === 'GEM') rewardSprite = RESOURCE_SPRITES.GEM;
        else if (mission.rewardType === 'TICKET') rewardSprite = RESOURCE_SPRITES[mission.rewardData || ''] || RESOURCE_SPRITES.TICKET;
        else if (mission.rewardType === 'CRYSTAL' && mission.rewardData) rewardSprite = RESOURCE_SPRITES[mission.rewardData];
        else if (mission.rewardType === 'XP') rewardSprite = RESOURCE_SPRITES.XP;
        else if (mission.rewardType === 'AVATAR' && mission.rewardData) {
            const avatar = AVATAR_LIST.find(a => a.id === mission.rewardData || a.id === `avatar_${mission.rewardData}`);
            if (avatar) rewardSprite = avatar.url;
        } else if (mission.rewardType === 'AVATAR_BG' && mission.rewardData) {
            const bg = BACKGROUND_LIST.find(b => b.id === mission.rewardData || b.id === `bg_${mission.rewardData}`);
            if (bg) rewardSprite = bg.url;
        } else if (mission.rewardType === 'TITLE') {
            rewardSprite = RESOURCE_SPRITES.TITLE_LEGEND;
        }

        return (
            <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`
                    relative flex items-center p-4 md:p-5 rounded-2xl border transition-all gap-4 md:gap-6 overflow-hidden
                    ${mission.claimed 
                        ? 'bg-stone-900/40 border-stone-800 opacity-60' 
                        : isReady 
                            ? 'bg-gradient-to-r from-orange-950/40 via-stone-900/80 to-stone-900/90 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                            : 'bg-stone-900/70 border-white/5 hover:border-white/10'}
                `}
            >
                {/* Reward Preview */}
                <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-black/50 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden shadow-inner">
                    {rewardSprite ? (
                        <img src={rewardSprite} alt={mission.rewardType} className="w-8 h-8 md:w-11 md:h-11 object-contain relative z-10 drop-shadow-md" />
                    ) : (
                        <>
                            {mission.rewardType === 'CHARACTER' && <ImageIcon className="text-purple-400 w-6 h-6 md:w-8 md:h-8 relative z-10" />}
                            {mission.rewardType === 'TITLE' && <Trophy className="text-yellow-400 w-6 h-6 md:w-8 md:h-8 relative z-10" />}
                            {mission.rewardType === 'AVATAR' && <ImageIcon className="text-blue-400 w-6 h-6 md:w-8 md:h-8 relative z-10" />}
                            {mission.rewardType === 'BUNDLE' && <Gift className="text-orange-400 w-6 h-6 md:w-8 md:h-8 relative z-10" />}
                        </>
                    )}
                    <span className="absolute bottom-1 right-1 text-[9px] md:text-[10px] font-black text-white/90 bg-black/70 px-1 rounded border border-white/10">{mission.rewardAmount}</span>
                </div>

                {/* Details & Progress Bar */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="pr-2">
                            <span className="text-[8px] md:text-[9px] font-black text-orange-400/90 tracking-widest uppercase mb-0.5 block">
                                {mission.type} • {mission.actionType.replace('_', ' ')}
                            </span>
                            <h4 className="text-xs md:text-base font-black italic uppercase text-stone-100 truncate leading-tight">
                                {t(`mission_${mission.id}_desc`) !== `mission_${mission.id}_desc` 
                                    ? t(`mission_${mission.id}_desc`) 
                                    : mission.description}
                            </h4>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{isPt ? 'PROGRESSO' : 'PROGRESS'}</p>
                            <p className={`text-sm md:text-lg font-black italic ${isReady ? 'text-orange-400' : 'text-stone-300'}`}>
                                {mission.current >= 1000 ? mission.current.toLocaleString() : mission.current} / {mission.target >= 1000 ? mission.target.toLocaleString() : mission.target}
                            </p>
                        </div>
                    </div>
                    
                    {/* Animated Progress Bar */}
                    <div className="w-full h-2 md:h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 relative p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isReady ? 'bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]' : 'bg-stone-600'}`}
                        />
                    </div>
                </div>

                {/* Claim Button */}
                <button
                    onClick={() => isReady && handleClaim(mission.id)}
                    disabled={!isReady && !mission.claimed}
                    className={`
                        w-24 md:w-36 h-10 md:h-12 rounded-xl font-black italic uppercase tracking-widest text-[10px] md:text-xs transition-all border shrink-0 flex items-center justify-center gap-1.5 cursor-pointer
                        ${mission.claimed 
                            ? 'bg-stone-900/60 border-stone-800 text-stone-500 cursor-default' 
                            : isReady 
                                ? 'bg-gradient-to-r from-orange-600 to-amber-500 border-orange-400 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-950/50' 
                                : 'bg-stone-800/40 border-white/5 text-stone-600 cursor-default'}
                    `}
                >
                    {mission.claimed ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-stone-500" />
                            <span>{isPt ? 'COLETADO' : 'CLAIMED'}</span>
                        </>
                    ) : isReady ? (
                        <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>{isPt ? 'RESGATAR' : 'CLAIM'}</span>
                        </>
                    ) : (
                        <span>{isPt ? 'EM CURSO' : 'ONGOING'}</span>
                    )}
                </button>
            </motion.div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-stone-950/70" />
                <div className="absolute left-[-5%] bottom-[-5%] opacity-30 scale-[1.1] blur-[1px] pointer-events-none">
                    <img src="/Assets/personagens/gokubase/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Toast Banner */}
            <AnimatePresence>
                {rewardToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white font-black italic uppercase tracking-wider text-xs md:text-sm rounded-2xl shadow-2xl border border-orange-300 flex items-center gap-3 backdrop-blur-md"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
                        <span>{rewardToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <motion.header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between relative z-50 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3 md:gap-6">
                    <button 
                        onClick={() => { 
                            AudioManager.getInstance().playSFX('cancel'); 
                            changeScene(SceneName.MAIN_MENU);
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-stone-900/60 hover:bg-stone-800 flex items-center justify-center border border-white/10 rounded-xl transition-all shadow-lg cursor-pointer hover:border-orange-500/50"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-7 md:h-7 text-stone-200" />
                    </button>
                    <div>
                        <h2 className="text-lg md:text-3xl font-black italic uppercase tracking-widest text-white drop-shadow-lg flex items-center gap-2">
                            <span>{isPt ? 'EVENTOS E MISSÕES' : 'EVENTS & MISSIONS'}</span>
                            <Zap className="w-5 h-5 text-orange-500 fill-orange-500 hidden sm:inline" />
                        </h2>
                        <p className="text-[9px] md:text-[11px] font-bold text-stone-400 uppercase tracking-widest hidden sm:block">
                            {isPt ? 'COMPLETE TAREFAS DIÁRIAS E GANHE MOEDAS E XP' : 'COMPLETE DAILY TASKS TO EARN CURRENCY & XP'}
                        </p>
                    </div>
                </div>
                
                {/* Economy Display */}
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl">
                        <img src={RESOURCE_SPRITES.COIN} alt="Coins" className="w-5 h-5 object-contain" />
                        <span className="text-xs md:text-sm font-black text-amber-400">{coins.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl">
                        <img src={RESOURCE_SPRITES.GEM} alt="Gems" className="w-5 h-5 object-contain" />
                        <span className="text-xs md:text-sm font-black text-cyan-400">{gems.toLocaleString()}</span>
                    </div>
                </div>
            </motion.header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-3 md:p-6 gap-4 md:gap-6">
                
                {/* SIDEBAR TABS */}
                <motion.div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none snap-x w-full md:w-64 shrink-0">
                    {tabs.map((tab) => {
                        const unclaimed = tab.id === 'OVERVIEW' 
                            ? totalUnclaimedOverview 
                            : getUnclaimedCount(tab.id as MissionType);
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => { 
                                    setActiveTab(tab.id); 
                                    setSelectedEventId(null);
                                    AudioManager.getInstance().playSFX('click'); 
                                }}
                                className={`
                                    relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all min-w-[150px] md:w-full shrink-0 group cursor-pointer border
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-orange-600/30 to-amber-600/10 border-orange-500/50 text-white font-black italic shadow-lg shadow-orange-950/30' 
                                        : 'bg-stone-900/40 border-white/5 text-stone-400 hover:text-stone-200 hover:bg-white/5 hover:border-white/10'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'}`} />
                                    <span className="text-[10px] md:text-xs uppercase tracking-[0.15em] select-none truncate font-black">{tab.label}</span>
                                </div>

                                {unclaimed > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-md border border-orange-400 shrink-0">
                                        {unclaimed}
                                    </span>
                                )}

                                {isActive && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-orange-500 hidden md:block" />}
                            </button>
                        );
                    })}
                </motion.div>

                {/* VIEWPORT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-5">
                    
                    {/* DAILY PROGRESS TRACKER HEADER CARD (Visible on DAILY tab & OVERVIEW tab) */}
                    {(activeTab === 'DAILY' || activeTab === 'OVERVIEW') && !selectedEventId && (
                        <motion.section 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-gradient-to-r from-stone-900/90 via-stone-900/80 to-stone-950/90 border border-orange-500/30 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

                            {/* Title & Reset Countdown Row */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-orange-400" />
                                        <h3 className="text-base md:text-xl font-black italic text-white uppercase tracking-wider">
                                            {isPt ? 'PROGRESSO DE MISSÕES DIÁRIAS' : 'DAILY MISSION PROGRESS'}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-stone-400 font-bold mt-0.5">
                                        {isPt ? 'Conclua missões diárias para desbloquear baús de bônus com moedas, gemas e XP!' : 'Complete daily missions to unlock bonus chests with currency, gems & XP!'}
                                    </p>
                                </div>

                                {/* Reset Timer */}
                                <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                                    <Clock className="w-4 h-4 text-orange-400 animate-spin-slow" />
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest block leading-none">{isPt ? 'RESETA EM' : 'RESETS IN'}</span>
                                        <span className="text-xs font-black text-white italic">
                                            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Progress Bar & Counter */}
                            <div className="mb-6">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-300">
                                        {isPt ? 'TAREFAS CONCLUÍDAS HOJE' : 'TASKS COMPLETED TODAY'}
                                    </span>
                                    <span className="text-base md:text-xl font-black italic text-orange-400">
                                        {completedDailiesCount} / {totalDailiesCount}
                                    </span>
                                </div>
                                <div className="w-full h-3 md:h-4 bg-black/60 rounded-full overflow-hidden border border-white/10 relative p-0.5 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (completedDailiesCount / totalDailiesCount) * 100)}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(249,115,22,0.7)]"
                                    />
                                </div>
                            </div>

                            {/* Daily Milestone Chests */}
                            <div>
                                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-stone-400 mb-3">
                                    {isPt ? 'BAÚS DE BÔNUS DE META DIÁRIA' : 'DAILY MILESTONE BONUS CHESTS'}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {DAILY_MILESTONES.map((ms) => {
                                        const isClaimed = claimedMilestones.includes(ms.id);
                                        const isUnlocked = completedDailiesCount >= ms.target;
                                        const canClaim = isUnlocked && !isClaimed;

                                        return (
                                            <div 
                                                key={ms.id}
                                                className={`
                                                    relative p-3 rounded-2xl border transition-all flex items-center justify-between gap-3
                                                    ${isClaimed 
                                                        ? 'bg-stone-900/50 border-stone-800 opacity-60' 
                                                        : canClaim 
                                                            ? 'bg-gradient-to-r from-orange-900/40 to-amber-900/30 border-orange-500 shadow-md shadow-orange-950/40 animate-pulse' 
                                                            : 'bg-black/40 border-white/5'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${canClaim ? 'bg-orange-600 border-orange-300 text-white' : isClaimed ? 'bg-stone-800 border-stone-700 text-stone-500' : 'bg-stone-900 border-white/10 text-stone-400'}`}>
                                                        <Box className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider block">{ms.label}</span>
                                                        <span className="text-[10px] md:text-xs font-bold text-stone-200">
                                                            +{ms.xp} XP {ms.coins > 0 ? `• +${ms.coins} Moedas` : ''} {ms.gems > 0 ? `• +${ms.gems} Gemas` : ''} {ms.tickets > 0 ? `• +${ms.tickets} Ticket` : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => canClaim && handleClaimMilestone(ms)}
                                                    disabled={!canClaim}
                                                    className={`
                                                        px-3 py-1.5 rounded-xl font-black italic uppercase text-[9px] md:text-[10px] tracking-wider transition-all border shrink-0 cursor-pointer
                                                        ${isClaimed 
                                                            ? 'bg-stone-800 border-stone-700 text-stone-500 cursor-default' 
                                                            : canClaim 
                                                                ? 'bg-orange-600 hover:bg-orange-500 border-orange-300 text-white shadow-md hover:scale-105 active:scale-95' 
                                                                : 'bg-stone-800/40 border-white/5 text-stone-600 cursor-default'}
                                                    `}
                                                >
                                                    {isClaimed ? (isPt ? 'COLETADO' : 'CLAIMED') : canClaim ? (isPt ? 'ABRIR' : 'OPEN') : `${completedDailiesCount}/${ms.target}`}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* FILTER STATUS TABS & CLAIM ALL ROW */}
                    {activeTab !== 'OVERVIEW' && !selectedEventId && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-900/60 p-3 rounded-2xl border border-white/5">
                            {/* Filter Status Buttons */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                                {([
                                    { id: 'ALL', label: isPt ? 'TODAS' : 'ALL' },
                                    { id: 'IN_PROGRESS', label: isPt ? 'EM CURSO' : 'IN PROGRESS' },
                                    { id: 'READY', label: isPt ? 'PRONTAS' : 'READY' },
                                    { id: 'CLAIMED', label: isPt ? 'COLETADAS' : 'CLAIMED' },
                                ] as { id: FilterStatus; label: string }[]).map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilterStatus(f.id)}
                                        className={`
                                            px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer shrink-0
                                            ${filterStatus === f.id 
                                                ? 'bg-orange-600/30 border-orange-500 text-orange-400' 
                                                : 'bg-black/30 border-white/5 text-stone-400 hover:text-stone-200'}
                                        `}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Claim All Button */}
                            {readyInCurrentTab > 0 && (
                                <button
                                    onClick={handleClaimAll}
                                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 border border-orange-300 text-white font-black italic uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-orange-950/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    <span>{isPt ? `RESGATAR TODAS (${readyInCurrentTab})` : `CLAIM ALL (${readyInCurrentTab})`}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* MAIN MISSION LIST VIEWPORT */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab + (selectedEventId || '') + filterStatus}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-3 pb-16"
                        >
                            {/* OVERVIEW TAB */}
                            {activeTab === 'OVERVIEW' && !selectedEventId && (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm md:text-base font-black italic text-stone-400 uppercase tracking-[0.2em]">{isPt ? 'EVENTOS ATIVOS' : 'ACTIVE EVENTS'}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {activeEvents.map((event) => (
                                            <motion.div 
                                                key={event.id}
                                                whileHover={{ scale: 1.01 }}
                                                onClick={() => { setSelectedEventId(event.id); AudioManager.getInstance().playSFX('click'); }}
                                                className={`relative h-48 md:h-56 rounded-3xl overflow-hidden cursor-pointer border border-white/10 group bg-stone-900 shadow-xl`}
                                            >
                                                <img src={event.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                                <div className={`absolute inset-0 bg-gradient-to-t ${event.color} opacity-40 mix-blend-multiply`} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                                
                                                <div className="absolute bottom-0 left-0 p-5 md:p-6 w-full">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-orange-400 mb-2 inline-block border border-white/10">{event.type}</span>
                                                            <h4 className="text-lg md:text-2xl font-black italic uppercase text-white drop-shadow-lg mb-1">
                                                                {t(`mission_${event.id.replace('evt_', '')}_title`) !== `mission_${event.id.replace('evt_', '')}_title`
                                                                    ? t(`mission_${event.id.replace('evt_', '')}_title`)
                                                                    : event.title}
                                                            </h4>
                                                            <p className="text-stone-300 text-xs line-clamp-2 max-w-md opacity-80">
                                                                {t(`mission_${event.id.replace('evt_', '')}_desc`) !== `mission_${event.id.replace('evt_', '')}_desc`
                                                                    ? t(`mission_${event.id.replace('evt_', '')}_desc`)
                                                                    : event.description}
                                                            </p>
                                                        </div>
                                                        <div className="text-right hidden sm:block shrink-0">
                                                            <Clock className="w-4 h-4 text-orange-400 mb-1 ml-auto" />
                                                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{isPt ? 'TERMINA EM' : 'ENDS IN'}</p>
                                                            <p className="text-xs font-bold text-white italic">{new Date(event.endsAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* SELECTED EVENT MISSIONS */}
                            {selectedEventId && (
                                <>
                                    <div className="flex items-center gap-4 mb-3">
                                        <button 
                                            onClick={() => { setSelectedEventId(null); AudioManager.getInstance().playSFX('cancel'); }}
                                            className="px-3 py-1.5 bg-stone-900/60 hover:bg-stone-800 text-xs font-black italic uppercase rounded-xl border border-white/10 transition-all cursor-pointer"
                                        >
                                            {isPt ? 'VOLTAR' : 'BACK'}
                                        </button>
                                        <h3 className="text-base md:text-lg font-black italic text-orange-400 uppercase tracking-widest">
                                            {activeEvents.find(e => e.id === selectedEventId)?.title}
                                        </h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {currentTabMissions.map((m, idx) => renderMissionItem(m, idx))}
                                        {currentTabMissions.length === 0 && (
                                            <p className="text-center py-12 text-stone-500 font-bold uppercase tracking-widest text-xs">
                                                {isPt ? 'NENHUMA MISSÃO ENCONTRADA' : 'NO MISSIONS FOUND'}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* STANDARD CATEGORY TAB MISSIONS */}
                            {activeTab !== 'OVERVIEW' && !selectedEventId && (
                                <div className="grid grid-cols-1 gap-3">
                                    {currentTabMissions.map((m, idx) => renderMissionItem(m, idx))}
                                    {currentTabMissions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 opacity-30">
                                            <Zap className="w-12 h-12 mb-3 text-stone-400" />
                                            <p className="font-black italic uppercase tracking-widest text-xs">
                                                {isPt ? 'NENHUMA MISSÃO NESTA CATEGORIA' : 'NO MISSIONS IN THIS CATEGORY'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3836; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #504945; }
                
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 12s linear infinite;
                }
            `}</style>
        </div>
    );
};
