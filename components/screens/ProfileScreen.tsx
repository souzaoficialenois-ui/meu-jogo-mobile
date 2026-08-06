import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, PlayerProfile } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { motion, AnimatePresence } from 'motion/react';
import { AVATAR_LIST, BACKGROUND_LIST, BASE_CHARACTERS } from '../../constants';
import { RankService, RANKS } from '../../services/RankService';
import { STAGE_DB } from '../../constants/StageDatabase';
import { 
    ChevronLeft, 
    Trophy,
    Copy,
    PenLine,
    LogOut,
    Award,
    CheckCircle2,
    Check,
    X,
    User,
    ShieldCheck,
    Swords,
    Sparkles,
    Search,
    SlidersHorizontal,
    TrendingUp,
    Flame,
    Filter,
    Lock
} from 'lucide-react';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { PanelCard, SettingRow } from './settings/SettingsSharedComponents';
import { TitleManager, TitleCategory } from '../../services/TitleManager';
import { PlayerTitleBadge } from '../ui/PlayerTitleBadge';

// Customization configs
interface TitleConfig {
    id: string;
    name: { pt_br: string; en_us: string };
    color: string;
    img?: string;
}

const TITLES: TitleConfig[] = [
    { id: 'warrior', name: { pt_br: 'Guerreiro Supremo', en_us: 'Supreme Warrior' }, color: 'text-amber-400 border-amber-500/30' },
    { id: 'instinct', name: { pt_br: 'Instinto Divino', en_us: 'Divine Instinct' }, color: 'text-cyan-400 border-cyan-500/30' },
    { id: 'destroyer', name: { pt_br: 'Ego Destruidor', en_us: 'Destroyer Ego' }, color: 'text-purple-400 border-purple-500/30' },
    { id: 'legend', name: { pt_br: 'Lenda do Clã', en_us: 'Saiyan Legend' }, color: 'text-red-400 border-red-500/30', img: '/Assets/ui/Titulos/Exclusivo_Beta.png' },
    { id: 'Fighter Legend', name: { pt_br: 'Lenda Beta (Fonte: Missão Beta)', en_us: 'Fighter Legend (Beta Mission)' }, color: 'text-orange-500 border-orange-600/30', img: '/Assets/ui/Titulos/Exclusivo_Beta.png' },
    { id: 'god', name: { pt_br: 'Deus do Combate', en_us: 'God of Combat' }, color: 'text-orange-400 border-orange-500/30' },
    { id: 'unbreakable', name: { pt_br: 'Inabalável', en_us: 'The Unbreakable' }, color: 'text-emerald-400 border-emerald-500/30' }
];

const ProfileScreenContent: React.FC = () => {
    const { 
        playerProfile, 
        changeScene, 
        logout,
        unlockedCharacters,
        unlockedItems,
        settings,
        updateProfile,
        equipTitle,
        checkAndGrantTitles,
        isOfflineMode,
        t,
        isPaused
    } = useSceneManager();

    const isPt = settings.language === 'pt' || settings.language === 'pt-BR' || settings.language?.startsWith('pt');

    // UI Toast
    const [showCopyToast, setShowCopyToast] = useState(false);
    
    // Edit identity states
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showBgSelector, setShowBgSelector] = useState(false);

    // Title Category Tab Filter
    const [selectedTitleTab, setSelectedTitleTab] = useState<TitleCategory>('ALL');

    const equippedTitleId = playerProfile?.activeTitle || (typeof window !== "undefined" && localStorage.getItem("fighter_profile_title")) || "warrior";

    useEffect(() => {
        if (checkAndGrantTitles) {
            checkAndGrantTitles();
        }
    }, [checkAndGrantTitles]);

    // Default Profile Fallbacks
    const rawProfile: PlayerProfile = playerProfile || {
        playerId: 'GUEST_FIGHTER_X',
        numericId: '1088452271',
        name: 'GUEST_SAIYAN',
        avatarId: 'avatar_1',
        backgroundId: 'bg_1',
        createdDate: Date.now(),
        lastLoginDate: Date.now(),
        bio: isPt ? 'Elevando meu poder ao limite extremo!' : 'Pushing my power to the extreme absolute!',
        wins: 48,
        losses: 12,
        conductScore: 100,
    };

    useEffect(() => {
        if (rawProfile) {
            setNameInput(rawProfile.name);
            setBioInput(rawProfile.bio || '');
        }
    }, [playerProfile]);

    // Compute rank points
    const currentRanked = rawProfile.ranked?.br || RankService.getDefaultRankedData();
    const calculatedPoints = currentRanked.points;
    const rankInfo = RankService.getRankFromPoints(calculatedPoints);
    const currentIndex = RANKS.findIndex(r => r.name === rankInfo.name);
    const currentTier = RANKS[currentIndex]?.tier || 'APPRENTICE';

    const profile = {
        ...rawProfile,
        rank: `${t(`rank_${currentTier.toLowerCase()}`)} ${rankInfo.subRank}`,
        points: calculatedPoints,
        rankTier: t(`rank_${currentTier.toLowerCase()}`)
    };

    const avatarUrl = AVATAR_LIST.find(a => a.id === profile.avatarId)?.url || "/Assets/avatar/retrato/1.png";
    const equippedBgUrl = BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url;

    const totalMatches = profile.wins + profile.losses;
    const winRate = totalMatches > 0 ? Math.round((profile.wins / totalMatches) * 100) : 0;
    const activeTitle = TITLES.find(t => t.id === equippedTitleId) || TITLES[0];

    // Character Combat Statistics states & logic
    const [characterSearch, setCharacterSearch] = useState('');
    const [characterSort, setCharacterSort] = useState<'played' | 'winrate' | 'wins' | 'name'>('played');
    const [selectedCharDetail, setSelectedCharDetail] = useState<any | null>(null);

    const rawCharStats = profile.characterStats || {};

    const defaultGuestStats: Record<string, { wins: number; losses: number; matches: number }> = {
        'goku_ssj': { wins: 28, losses: 5, matches: 33 },
        'vegeta_ssj_majin': { wins: 14, losses: 4, matches: 18 },
        'teen_gohan_ssj2': { wins: 6, losses: 3, matches: 9 },
    };

    const characterCombatList = (BASE_CHARACTERS && BASE_CHARACTERS.length > 0 ? BASE_CHARACTERS : unlockedCharacters).map(char => {
        const userStat = rawCharStats[char.id];
        const stat = userStat || (Object.keys(rawCharStats).length === 0 ? defaultGuestStats[char.id] : null) || { wins: 0, losses: 0, matches: 0 };
        const wins = stat.wins || 0;
        const losses = stat.losses || 0;
        const matches = stat.matches || (wins + losses);
        const charWinRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

        let grade = 'N/A';
        let gradeColor = 'text-stone-500 border-stone-800 bg-stone-900/40';
        if (matches > 0) {
            if (charWinRate >= 80 && matches >= 5) {
                grade = 'SS';
                gradeColor = 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
            } else if (charWinRate >= 70) {
                grade = 'S';
                gradeColor = 'text-purple-400 border-purple-500/50 bg-purple-500/10';
            } else if (charWinRate >= 55) {
                grade = 'A';
                gradeColor = 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
            } else if (charWinRate >= 40) {
                grade = 'B';
                gradeColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
            } else {
                grade = 'C';
                gradeColor = 'text-stone-400 border-stone-700 bg-stone-800/40';
            }
        }

        return {
            character: char,
            wins,
            losses,
            matches,
            winRate: charWinRate,
            grade,
            gradeColor,
            isUnlocked: unlockedCharacters.some(u => u.id === char.id)
        };
    });

    const mostUsedFighter = [...characterCombatList].sort((a, b) => b.matches - a.matches)[0];
    const mostEfficientFighter = [...characterCombatList]
        .filter(c => c.matches > 0)
        .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)[0];

    const filteredCharacterList = characterCombatList
        .filter(item => {
            const charName = isPt ? item.character.name : ((item.character as any).nameEn || item.character.name);
            return charName.toLowerCase().includes(characterSearch.toLowerCase());
        })
        .sort((a, b) => {
            if (characterSort === 'played') return b.matches - a.matches;
            if (characterSort === 'winrate') return b.winRate - a.winRate || b.matches - a.matches;
            if (characterSort === 'wins') return b.wins - a.wins;
            if (characterSort === 'name') return (isPt ? a.character.name : (a.character as any).nameEn || a.character.name).localeCompare(isPt ? b.character.name : (b.character as any).nameEn || b.character.name);
            return 0;
        });

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        changeScene(isPaused ? SceneName.PAUSE : SceneName.MAIN_MENU);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(profile.numericId || profile.playerId);
        AudioManager.getInstance().playSFX('confirm');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    const handleLogout = () => {
        AudioManager.getInstance().playSFX('click');
        logout();
        changeScene(SceneName.AUTH);
    };

    const handleTitleSelect = (titleId: string) => {
        AudioManager.getInstance().playSFX('confirm');
        if (equipTitle) {
            equipTitle(titleId);
        } else {
            updateProfile(profile.name, profile.avatarId, profile.backgroundId, profile.bio, titleId);
        }
        if (typeof window !== "undefined") {
            localStorage.setItem("fighter_profile_title", titleId);
        }
    };

    const handleAvatarSelect = (id: string) => {
        if (isOfflineMode) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        AudioManager.getInstance().playSFX('confirm');
        updateProfile(profile.name, id, profile.backgroundId, profile.bio);
        setShowAvatarSelector(false);
    };

    const handleBgSelect = (id: string) => {
        if (isOfflineMode) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        AudioManager.getInstance().playSFX('confirm');
        updateProfile(profile.name, profile.avatarId, id, profile.bio);
        setShowBgSelector(false);
    };

    const handleSaveName = () => {
        if (isOfflineMode) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        if (!nameInput.trim()) return;
        AudioManager.getInstance().playSFX('confirm');
        updateProfile(nameInput.trim().toUpperCase(), profile.avatarId, profile.backgroundId, profile.bio);
        setIsEditingName(false);
    };

    const handleSaveBio = () => {
        if (isOfflineMode) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        AudioManager.getInstance().playSFX('confirm');
        updateProfile(profile.name, profile.avatarId, profile.backgroundId, bioInput);
        setIsEditingBio(false);
    };

    return (
        <div className="w-full h-full min-h-screen flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200 select-none">
            {/* Background Layer matching SettingsScreen */}
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute left-[-5%] bottom-[-5%] opacity-40 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/goku/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            {/* Cubes Texture Overlay */}
            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Bloom / Glow Light Effect */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Edge Light Accent */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent z-30" />

            {/* HEADER matching SettingsScreen */}
            <motion.header 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0"
            >
                <div className="flex items-center gap-3 md:gap-8">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                    </button>
                    <div className="flex flex-col text-left">
                        <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">
                            {isPt ? 'DOSSIÊ DO GUERREIRO' : 'WARRIOR DOSSIER'}
                        </span>
                        <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                            {profile.name}
                        </h2>
                        <div className="mt-1">
                            <PlayerTitleBadge titleKey={equippedTitleId} size="sm" isPt={isPt} showRarityTag />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">
                            {isPt ? 'GUERREIRO ID' : 'WARRIOR ID'}
                        </span>
                        <span className="text-[10px] md:text-sm font-black text-orange-500 uppercase italic font-mono tracking-widest mt-1">
                            #{profile.numericId || profile.playerId}
                        </span>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="group flex items-center gap-2 px-4 py-3 bg-stone-900/40 hover:bg-red-900/30 text-red-500 hover:text-white border border-white/5 hover:border-red-500/50 rounded-xl transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] cursor-pointer shadow-lg backdrop-blur-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden xs:inline">{isPt ? 'SAIR' : 'LOGOUT'}</span>
                    </button>
                </div>
            </motion.header>

            {/* TOAST */}
            <AnimatePresence>
                {showCopyToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute left-1/2 -translate-x-1/2 z-[100] top-24 bg-orange-600 text-white font-black uppercase tracking-widest rounded-xl flex items-center border border-orange-400 px-5 py-3 text-[10px] gap-2 shadow-[0_0_30px_rgba(234,88,12,0.4)]"
                    >
                        <CheckCircle2 size={14} />
                        <span>{isPt ? 'IDENTIDADE COPIADA!' : 'IDENTITY COPIED!'}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
                
                {/* VIEWPORT SCROLLABLE CONTAINER */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-8 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        
                        {/* LEFT COLUMN: IDENTIDADE & RANK */}
                        <div className="space-y-6 md:space-y-8">
                            
                            {/* PANEL 1: IDENTIDADE DO GUERREIRO */}
                            <PanelCard 
                                title={isPt ? "Identidade do Guerreiro" : "Warrior Identity"} 
                                subtitle={isPt ? "Avatar, fundo de perfil, nome e lema" : "Avatar, profile background, name and motto"} 
                                icon={ShieldCheck}
                            >
                                <div className="space-y-6">
                                    {/* Main Profile Card with Avatar + Background */}
                                    <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-stone-950/80 shadow-2xl p-5 sm:p-6 group">
                                        
                                        {/* Profile Background Banner */}
                                        {equippedBgUrl && (
                                            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                                                <img 
                                                    src={equippedBgUrl} 
                                                    alt="Fundo do Perfil" 
                                                    className="w-full h-full object-cover object-center opacity-40 filter contrast-125 saturate-125 scale-105 transition-transform duration-700 group-hover:scale-110" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/90" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/50" />
                                            </div>
                                        )}

                                        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                            
                                            {/* Avatar & Background Buttons */}
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                {/* Avatar Button */}
                                                <button 
                                                    onClick={() => {
                                                        if (isOfflineMode) { AudioManager.getInstance().playSFX('cancel'); return; }
                                                        AudioManager.getInstance().playSFX('click');
                                                        setShowAvatarSelector(!showAvatarSelector);
                                                        setShowBgSelector(false);
                                                    }}
                                                    className={`relative group/avatar shrink-0 rounded-2xl overflow-hidden bg-stone-950/90 border-2 transition-all w-22 h-22 sm:w-28 sm:h-28 shadow-[0_0_25px_rgba(249,115,22,0.15)] ${
                                                        isOfflineMode ? 'border-stone-800 opacity-60 grayscale cursor-not-allowed' : 'border-orange-500/40 hover:border-orange-500 active:scale-95 cursor-pointer'
                                                    }`}
                                                    title={isPt ? "Alterar Avatar" : "Change Avatar"}
                                                >
                                                    {equippedBgUrl && (
                                                        <img 
                                                            src={equippedBgUrl} 
                                                            alt="Background" 
                                                            className="absolute inset-0 w-full h-full object-cover opacity-70 filter contrast-110" 
                                                        />
                                                    )}
                                                    <img src={avatarUrl} className="relative z-10 w-full h-full object-contain filter contrast-125 p-1 drop-shadow-xl" alt="Avatar" />
                                                    {!isOfflineMode && (
                                                        <div className="absolute inset-0 bg-orange-500/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm transition-opacity z-20">
                                                            {isPt ? "AVATAR" : "AVATAR"}
                                                        </div>
                                                    )}
                                                </button>

                                                {/* Background Selector Button */}
                                                <button 
                                                    onClick={() => {
                                                        if (isOfflineMode) { AudioManager.getInstance().playSFX('cancel'); return; }
                                                        AudioManager.getInstance().playSFX('click');
                                                        setShowBgSelector(!showBgSelector);
                                                        setShowAvatarSelector(false);
                                                    }}
                                                    className={`relative group/bg shrink-0 rounded-xl overflow-hidden bg-stone-900/80 border transition-all w-22 h-9 sm:w-28 sm:h-10 shadow-md ${
                                                        isOfflineMode ? 'border-stone-800 opacity-60 grayscale cursor-not-allowed' : 'border-white/10 hover:border-orange-500 active:scale-95 cursor-pointer'
                                                    }`}
                                                    title={isPt ? "Alterar Fundo do Perfil" : "Change Profile Background"}
                                                >
                                                    {equippedBgUrl && (
                                                        <img 
                                                            src={equippedBgUrl} 
                                                            alt="Background" 
                                                            className="absolute inset-0 w-full h-full object-cover" 
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/50 group-hover/bg:bg-orange-600/60 flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-xs transition-all">
                                                        {isPt ? "FUNDO PERFIL" : "BG ART"}
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Details Header Text */}
                                            <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
                                                {/* Player Name & Actions */}
                                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                                    {isEditingName ? (
                                                        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-xl border border-orange-500/50 shadow-xl">
                                                            <input 
                                                                type="text"
                                                                value={nameInput}
                                                                onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 12))}
                                                                className="bg-transparent font-black text-white px-2 py-0.5 text-base focus:outline-none w-32 uppercase tracking-tight"
                                                                autoFocus
                                                            />
                                                            <button onClick={handleSaveName} className="bg-emerald-600 hover:bg-emerald-500 rounded-lg p-1.5 text-white transition-colors cursor-pointer"><Check size={14} /></button>
                                                            <button onClick={() => { setIsEditingName(false); setNameInput(profile.name); }} className="bg-stone-800 hover:bg-red-900 rounded-lg p-1.5 text-white transition-colors cursor-pointer"><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group/name">
                                                            <h3 className="text-xl sm:text-2xl font-black italic tracking-tight text-white uppercase drop-shadow-md leading-none">
                                                                {profile.name}
                                                            </h3>
                                                            {!isOfflineMode && (
                                                                <button 
                                                                    onClick={() => setIsEditingName(true)} 
                                                                    className="opacity-60 group-hover/name:opacity-100 hover:bg-white/10 rounded-lg p-1.5 text-stone-400 hover:text-white transition-all cursor-pointer"
                                                                >
                                                                    <PenLine size={14} />
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={handleCopyId}
                                                                className="bg-stone-900/60 hover:bg-orange-500/20 border border-white/10 text-stone-400 hover:text-orange-500 rounded-lg p-1.5 transition-all cursor-pointer"
                                                                title={isPt ? "Copiar ID da Conta" : "Copy Account ID"}
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Active Title Badge beneath Username */}
                                                <div className="flex items-center justify-center sm:justify-start">
                                                    <PlayerTitleBadge titleKey={equippedTitleId} size="md" isPt={isPt} showRarityTag />
                                                </div>

                                                {/* ID display */}
                                                <div className="text-stone-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                                                    ID: #{profile.numericId || profile.playerId}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Avatar Picker Modal inside card */}
                                        <AnimatePresence>
                                            {showAvatarSelector && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-white/5 mt-5 pt-4 text-left relative z-10"
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{isPt ? "SELECIONE SEU AVATAR" : "SELECT AVATAR"}</span>
                                                        <button onClick={() => setShowAvatarSelector(false)} className="text-stone-500 hover:text-white p-1 transition-colors"><X size={14} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-5 xs:grid-cols-7 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/60 rounded-2xl border border-white/5">
                                                        {AVATAR_LIST.filter(avatar => {
                                                            const idNum = parseInt(avatar.id.replace('avatar_', ''));
                                                            if (!isNaN(idNum) && idNum <= 15) return true;
                                                            return (unlockedItems[avatar.id]?.quantity || 0) > 0;
                                                        }).map((avatar, idx) => {
                                                            const isSelected = profile.avatarId === avatar.id;
                                                            return (
                                                                <button
                                                                    key={`avatar-${avatar.id}-${idx}`}
                                                                    onClick={() => handleAvatarSelect(avatar.id)}
                                                                    className={`aspect-square rounded-xl bg-stone-900/50 border-2 relative flex items-center justify-center transition-all cursor-pointer group/avataritem ${
                                                                        isSelected ? 'border-orange-500 bg-orange-500/20 scale-105 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-stone-800 hover:border-stone-600'
                                                                    }`}
                                                                >
                                                                    <img src={avatar.url} className={`w-full h-full object-contain p-1 transition-transform ${isSelected ? 'scale-110' : 'group-hover/avataritem:scale-110'}`} alt="" referrerPolicy="no-referrer" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Background Picker Modal inside card */}
                                        <AnimatePresence>
                                            {showBgSelector && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-white/5 mt-5 pt-4 text-left relative z-10"
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{isPt ? "SELECIONE O FUNDO DE PERFIL" : "SELECT PROFILE BACKGROUND"}</span>
                                                        <button onClick={() => setShowBgSelector(false)} className="text-stone-500 hover:text-white p-1 transition-colors"><X size={14} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/60 rounded-2xl border border-white/5">
                                                        {BACKGROUND_LIST.filter(bg => {
                                                            const idNum = parseInt(bg.id.replace('bg_', ''));
                                                            if (!isNaN(idNum) && idNum <= 4) return true;
                                                            return (unlockedItems[bg.id]?.quantity || 0) > 0;
                                                        }).map((bg, idx) => {
                                                            const isSelected = profile.backgroundId === bg.id;
                                                            return (
                                                                <button
                                                                    key={`bg-${bg.id}-${idx}`}
                                                                    onClick={() => handleBgSelect(bg.id)}
                                                                    className={`aspect-video rounded-lg bg-stone-900/50 border-2 relative flex items-center justify-center transition-all cursor-pointer group/bgitem ${
                                                                        isSelected ? 'border-orange-500 bg-orange-500/20 scale-105 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-stone-800 hover:border-stone-600'
                                                                    }`}
                                                                >
                                                                    <img src={bg.url} className={`w-full h-full object-cover rounded-md transition-transform ${isSelected ? 'scale-110' : 'group-hover/bgitem:scale-110'}`} alt="" referrerPolicy="no-referrer" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Motto Section */}
                                        <div className="mt-5 pt-4 border-t border-white/10 text-left group/bio relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-stone-400 uppercase tracking-[0.2em] block leading-none text-[9px]">
                                                    {isPt ? 'LEMA DO GUERREIRO' : 'WARCRY MOTTO'}
                                                </span>
                                                {!isEditingBio && !isOfflineMode && (
                                                    <button 
                                                        onClick={() => setIsEditingBio(true)} 
                                                        className="opacity-60 group-hover/bio:opacity-100 hover:bg-white/10 rounded-lg p-1 text-stone-400 hover:text-white transition-all cursor-pointer"
                                                    >
                                                        <PenLine size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingBio ? (
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <textarea 
                                                        value={bioInput}
                                                        onChange={(e) => setBioInput(e.target.value.slice(0, 60))}
                                                        className="bg-stone-950/90 border border-orange-500/50 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-orange-500 resize-none w-full p-3 font-medium tracking-wide shadow-inner"
                                                        rows={2}
                                                        placeholder={isPt ? "Escreva seu grito de guerra..." : "Write your warcry..."}
                                                    />
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest px-1">
                                                        <span className="text-stone-500">{bioInput.length} / 60</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={handleSaveBio} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-lg text-white transition-all cursor-pointer shadow-lg">{isPt ? 'CONFIRMAR' : 'SAVE'}</button>
                                                            <button onClick={() => { setIsEditingBio(false); setBioInput(profile.bio || ''); }} className="bg-stone-800 hover:bg-stone-700 px-4 py-1.5 rounded-lg text-stone-300 transition-all cursor-pointer">{isPt ? 'CANCELAR' : 'CANCEL'}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-stone-300 text-xs sm:text-sm italic font-medium mt-1 leading-relaxed px-1 bg-stone-950/50 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                                                    "{profile.bio || (isPt ? 'Lutar até o limite extremo.' : 'Fight beyond the limit.')}"
                                                </p>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </PanelCard>

                            {/* PANEL 2: PATENTE RANQUEADA */}
                            <PanelCard 
                                title={isPt ? "Classificação Competitiva" : "Competitive Rank"} 
                                subtitle={isPt ? "Divisão oficial e pontuação de arena" : "Official division and arena points"} 
                                icon={Trophy}
                            >
                                <SettingRow 
                                    label={profile.rank} 
                                    description={`${profile.points.toLocaleString()} Battle Points (${profile.rankTier})`}
                                >
                                    <span className="text-orange-500 font-black text-base sm:text-xl font-mono tracking-widest bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                        {profile.points.toLocaleString()} PTS
                                    </span>
                                </SettingRow>
                            </PanelCard>

                        </div>

                        {/* RIGHT COLUMN: STATS & TITLES */}
                        <div className="space-y-6 md:space-y-8">
                            
                            {/* PANEL 3: DESEMPENHO EM DUELOS */}
                            <PanelCard 
                                title={isPt ? "Desempenho em Duelos" : "Tactical Performance"} 
                                subtitle={isPt ? "Porcentagem de vitórias e histórico de combates" : "Win rate percentage and combat history"} 
                                icon={Swords}
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    {/* Win Rate Ring */}
                                    <div className="relative flex items-center justify-center shrink-0 w-24 h-24 group/winrate">
                                        <div className="absolute inset-0 bg-orange-500/5 rounded-full blur-xl group-hover/winrate:bg-orange-500/10 transition-colors" />
                                        <svg className="w-full h-full transform -rotate-90 relative z-10">
                                            <circle 
                                                cx="48" 
                                                cy="48" 
                                                r="42" 
                                                className="text-stone-900" 
                                                strokeWidth="6" 
                                                stroke="currentColor" 
                                                fill="transparent" 
                                            />
                                            <circle 
                                                cx="48" 
                                                cy="48" 
                                                r="42" 
                                                className="text-orange-500" 
                                                strokeWidth="6" 
                                                strokeDasharray={`${2 * Math.PI * 42}`}
                                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - winRate / 100)}`}
                                                strokeLinecap="round"
                                                stroke="currentColor" 
                                                fill="transparent" 
                                                style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.4))' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                            <span className="font-black text-2xl text-white tracking-tighter leading-none">{winRate}%</span>
                                            <span className="text-[8px] text-stone-500 uppercase tracking-[0.3em] font-black mt-1">W/R</span>
                                        </div>
                                    </div>

                                    {/* Numbers Grid */}
                                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                                        {[
                                            { label: isPt ? 'VITÓRIAS' : 'WINS', value: profile.wins, color: 'text-white' },
                                            { label: isPt ? 'DERROTAS' : 'LOSSES', value: profile.losses, color: 'text-stone-500' },
                                            { label: isPt ? 'DISPUTAS' : 'MATCHES', value: totalMatches, color: 'text-white' },
                                            { label: isPt ? 'GUERREIROS' : 'UNLOCKED', value: unlockedCharacters.length, color: 'text-orange-500' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-stone-950/60 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                                                <span className="text-[8px] text-stone-500 uppercase block font-black tracking-widest mb-1">{stat.label}</span>
                                                <span className={`text-lg font-black italic tracking-tighter ${stat.color}`}>{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PanelCard>

                            {/* PANEL 4: SISTEMA DE TÍTULOS DE HONRA & CONQUISTAS */}
                            <PanelCard 
                                title={isPt ? "Títulos de Honra & Conquistas" : "Honorary Titles & Achievements"} 
                                subtitle={isPt ? "Desbloqueie títulos lendários no Hall da Fama e exiba suas conquistas na arena" : "Unlock legendary titles in the Hall of Fame and showcase achievements"} 
                                icon={Award}
                            >
                                {(() => {
                                    const allTitles = TitleManager.getAllTitles();
                                    const unlockedSet = new Set<string>(rawProfile.unlockedTitles || ['warrior']);
                                    unlockedSet.add('warrior');

                                    // Count unlocked
                                    const totalUnlocked = allTitles.filter(t => unlockedSet.has(t.id) || (t.checkUnlock && t.checkUnlock(rawProfile))).length;
                                    const progressPercent = Math.min(100, Math.round((totalUnlocked / allTitles.length) * 100));

                                    const categories: { id: TitleCategory; label: { pt: string; en: string } }[] = [
                                        { id: 'ALL', label: { pt: 'TODOS', en: 'ALL' } },
                                        { id: 'HALL_OF_FAME', label: { pt: 'HALL DA FAMA', en: 'HALL OF FAME' } },
                                        { id: 'RANK', label: { pt: 'RANQUEADAS', en: 'RANKED' } },
                                        { id: 'ACHIEVEMENTS', label: { pt: 'CONQUISTAS', en: 'ACHIEVEMENTS' } },
                                        { id: 'SPECIAL', label: { pt: 'ESPECIAIS', en: 'SPECIAL' } },
                                    ];

                                    const filteredTitles = TitleManager.getTitlesByCategory(selectedTitleTab);

                                    return (
                                        <div className="space-y-4 pt-1">
                                            {/* Header Progress Bar & Open Gallery Button */}
                                            <div className="bg-stone-950/80 border border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                                                        <Trophy className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest block">
                                                            {isPt ? 'Progresso de Títulos' : 'Title Progress'}
                                                        </span>
                                                        <span className="text-sm font-black text-white">
                                                            {totalUnlocked} / {allTitles.length} {isPt ? 'Desbloqueados' : 'Unlocked'} ({progressPercent}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="w-full sm:w-36 bg-stone-900 border border-stone-800 rounded-full h-3 overflow-hidden p-0.5">
                                                        <div 
                                                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            AudioManager.getInstance().playSFX('confirm');
                                                            changeScene(SceneName.TITLES_GALLERY);
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-stone-950 shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                                                    >
                                                        <Award size={13} />
                                                        {isPt ? 'Galeria Completa' : 'Full Gallery'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Category Filter Tabs */}
                                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                                {categories.map((cat) => {
                                                    const isActive = selectedTitleTab === cat.id;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            onClick={() => setSelectedTitleTab(cat.id)}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                                                                isActive
                                                                    ? 'bg-orange-500 border-orange-400 text-stone-950 shadow-md scale-105'
                                                                    : 'bg-stone-950/60 border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                                                            }`}
                                                        >
                                                            {isPt ? cat.label.pt : cat.label.en}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Titles List Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                                                {filteredTitles.map((t) => {
                                                    const isUnlocked = unlockedSet.has(t.id) || (t.checkUnlock && t.checkUnlock(rawProfile));
                                                    const isSelected = equippedTitleId === t.id;

                                                    return (
                                                        <div
                                                            key={t.id}
                                                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden ${
                                                                isSelected
                                                                    ? 'bg-orange-950/30 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                                                    : isUnlocked
                                                                    ? 'bg-stone-950/70 border-white/10 hover:border-white/20'
                                                                    : 'bg-stone-950/30 border-stone-800/60 opacity-60 grayscale'
                                                            }`}
                                                        >
                                                            {/* Title Badge & Status */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <PlayerTitleBadge titleKey={t.id} size="md" isPt={isPt} showRarityTag />

                                                                {/* Action / Status Pill */}
                                                                {isUnlocked ? (
                                                                    <button
                                                                        onClick={() => !isOfflineMode && handleTitleSelect(t.id)}
                                                                        disabled={isOfflineMode || isSelected}
                                                                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border ${
                                                                            isSelected
                                                                                ? 'bg-orange-500 border-orange-400 text-stone-950 shadow-md cursor-default'
                                                                                : 'bg-stone-900 border-stone-700 text-orange-400 hover:bg-orange-500 hover:text-stone-950 hover:border-orange-400 cursor-pointer'
                                                                        }`}
                                                                    >
                                                                        {isSelected ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip')}
                                                                    </button>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-stone-500 bg-stone-900/80 px-2.5 py-1 rounded-lg border border-stone-800">
                                                                        <Lock size={10} className="text-stone-500" />
                                                                        {isPt ? 'Bloqueado' : 'Locked'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Description & Requirement */}
                                                            <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">
                                                                {isPt ? t.description.pt_br : t.description.en_us}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </PanelCard>

                        </div>

                        {/* PANEL 5: ESTATÍSTICAS DE COMBATE POR GUERREIRO */}
                        <div className="md:col-span-2 mt-2">
                            <PanelCard 
                                title={isPt ? "Eficiência por Guerreiro" : "Fighter Combat Efficiency"} 
                                subtitle={isPt ? "Estatísticas de vitórias e derrotas individuais por cada lutador" : "Individual wins, losses, and combat efficiency stats per fighter"} 
                                icon={Swords}
                            >
                                {/* Top Highlights Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                    {/* Highlight 1: Most Played */}
                                    {mostUsedFighter && (
                                        <div className="bg-stone-950/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                                            <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-stone-900 border border-orange-500/30">
                                                <img 
                                                    src={mostUsedFighter.character.portraitUrl || (mostUsedFighter.character as any).avatarUrl || ''} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[9px] text-stone-500 font-black uppercase tracking-wider block">
                                                    {isPt ? "MAIS UTILIZADO" : "MOST PLAYED"}
                                                </span>
                                                <div className="text-xs font-black text-white truncate">
                                                    {isPt ? mostUsedFighter.character.name : ((mostUsedFighter.character as any).nameEn || mostUsedFighter.character.name)}
                                                </div>
                                                <div className="text-[10px] text-orange-400 font-bold mt-0.5">
                                                    {mostUsedFighter.matches} {isPt ? "batalhas" : "matches"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Highlight 2: Highest Efficiency */}
                                    {mostEfficientFighter && (
                                        <div className="bg-stone-950/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                                            <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-stone-900 border border-emerald-500/30">
                                                <img 
                                                    src={mostEfficientFighter.character.portraitUrl || (mostEfficientFighter.character as any).avatarUrl || ''} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[9px] text-stone-500 font-black uppercase tracking-wider block">
                                                    {isPt ? "MAIOR EFICIÊNCIA" : "BEST WIN RATE"}
                                                </span>
                                                <div className="text-xs font-black text-white truncate">
                                                    {isPt ? mostEfficientFighter.character.name : ((mostEfficientFighter.character as any).nameEn || mostEfficientFighter.character.name)}
                                                </div>
                                                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                                                    {mostEfficientFighter.winRate}% W/R ({mostEfficientFighter.wins}V)
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Highlight 3: Total Recorded Matches */}
                                    <div className="bg-stone-950/80 p-3.5 rounded-xl border border-white/5 flex items-center gap-3">
                                        <div className="shrink-0 w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9px] text-stone-500 font-black uppercase tracking-wider block">
                                                {isPt ? "TOTAL REGISTRADO" : "TOTAL COMBATS"}
                                            </span>
                                            <div className="text-lg font-black text-white italic tracking-tighter">
                                                {characterCombatList.reduce((acc, curr) => acc + curr.matches, 0)} {isPt ? "LUTAS" : "FIGHTS"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Search & Filter Bar */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                                    {/* Search Input */}
                                    <div className="relative flex-1 w-full">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                                        <input 
                                            type="text" 
                                            value={characterSearch} 
                                            onChange={(e) => setCharacterSearch(e.target.value)} 
                                            placeholder={isPt ? "Buscar lutador por nome..." : "Search fighter by name..."}
                                            className="w-full bg-stone-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-orange-500/50"
                                        />
                                        {characterSearch && (
                                            <button 
                                                onClick={() => setCharacterSearch('')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Sort Filter Buttons */}
                                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                                        {[
                                            { id: 'played', label: isPt ? 'Mais Jogados' : 'Most Played' },
                                            { id: 'winrate', label: isPt ? 'Maior %' : 'Win Rate' },
                                            { id: 'wins', label: isPt ? 'Vitórias' : 'Wins' },
                                            { id: 'name', label: isPt ? 'Nome' : 'Name' }
                                        ].map(sortOpt => (
                                            <button
                                                key={sortOpt.id}
                                                onClick={() => setCharacterSort(sortOpt.id as any)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${
                                                    characterSort === sortOpt.id
                                                    ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                                    : 'bg-stone-950/60 text-stone-400 border-white/5 hover:bg-white/5 hover:text-stone-200'
                                                }`}
                                            >
                                                {sortOpt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Character List Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                    {filteredCharacterList.map((item) => {
                                        const charName = isPt ? item.character.name : ((item.character as any).nameEn || item.character.name);
                                        return (
                                            <motion.div
                                                key={item.character.id}
                                                whileHover={{ scale: 1.01 }}
                                                onClick={() => setSelectedCharDetail(item)}
                                                className="bg-stone-950/70 p-3 rounded-xl border border-white/5 hover:border-orange-500/40 transition-all cursor-pointer relative overflow-hidden group/charcard"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="relative shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-stone-900 border border-white/10 group-hover/charcard:border-orange-500/60 transition-colors">
                                                        <img 
                                                            src={item.character.portraitUrl || (item.character as any).avatarUrl || ''} 
                                                            alt={charName} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                        {!item.isUnlocked && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                                <span className="text-[8px] font-black text-amber-400 bg-black/80 px-1 rounded border border-amber-500/40">
                                                                    LOCKED
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Name & Grade */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                                            <h4 className="text-xs font-black text-white truncate group-hover/charcard:text-orange-400 transition-colors">
                                                                {charName}
                                                            </h4>
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest shrink-0 ${item.gradeColor}`}>
                                                                {item.grade}
                                                            </span>
                                                        </div>

                                                        {/* Win / Loss / Matches Counts */}
                                                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold mb-1.5">
                                                            <span className="text-emerald-400">{item.wins}V</span>
                                                            <span className="text-stone-600">/</span>
                                                            <span className="text-rose-400">{item.losses}D</span>
                                                            <span className="text-stone-600">•</span>
                                                            <span className="text-stone-300">{item.matches} {isPt ? "lutas" : "matches"}</span>
                                                        </div>

                                                        {/* Win Rate Progress Bar */}
                                                        <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden border border-white/5 relative">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    item.winRate >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                    item.winRate >= 50 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                                                    'bg-stone-600'
                                                                }`}
                                                                style={{ width: `${item.matches > 0 ? item.winRate : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hover accent */}
                                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 group-hover/charcard:opacity-100 transition-opacity" />
                                            </motion.div>
                                        );
                                    })}

                                    {filteredCharacterList.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-stone-500 text-xs font-bold">
                                            {isPt ? "Nenhum guerreiro encontrado para a busca." : "No fighter found matching your search."}
                                        </div>
                                    )}
                                </div>
                            </PanelCard>
                        </div>

                    </div>
                </div>

            </main>

            {/* CHARACTER COMBAT DETAIL MODAL */}
            <AnimatePresence>
                {selectedCharDetail && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedCharDetail(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-stone-950 border border-orange-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setSelectedCharDetail(null)}
                                className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-900 border-2 border-orange-500/50 shrink-0">
                                    <img 
                                        src={selectedCharDetail.character.portraitUrl || (selectedCharDetail.character as any).avatarUrl || ''} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest inline-block mb-1 ${selectedCharDetail.gradeColor}`}>
                                        {selectedCharDetail.grade} RANK
                                    </span>
                                    <h3 className="text-lg font-black text-white italic tracking-tight">
                                        {isPt ? selectedCharDetail.character.name : ((selectedCharDetail.character as any).nameEn || selectedCharDetail.character.name)}
                                    </h3>
                                    <p className="text-xs text-orange-400 font-bold">
                                        {selectedCharDetail.winRate}% {isPt ? "Taxa de Eficiência em Combate" : "Combat Efficiency Rate"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6 bg-stone-900/60 p-4 rounded-xl border border-white/5">
                                <div className="text-center">
                                    <span className="text-[9px] text-stone-500 font-black block uppercase">{isPt ? "VITÓRIAS" : "WINS"}</span>
                                    <span className="text-xl font-black text-emerald-400 italic">{selectedCharDetail.wins}</span>
                                </div>
                                <div className="text-center border-x border-white/5">
                                    <span className="text-[9px] text-stone-500 font-black block uppercase">{isPt ? "DERROTAS" : "LOSSES"}</span>
                                    <span className="text-xl font-black text-rose-400 italic">{selectedCharDetail.losses}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-[9px] text-stone-500 font-black block uppercase">{isPt ? "TOTAL" : "MATCHES"}</span>
                                    <span className="text-xl font-black text-white italic">{selectedCharDetail.matches}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedCharDetail(null)}
                                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                {isPt ? "FECHAR DOSSIÊ" : "CLOSE DOSSIER"}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3836; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #504945; }
            `}</style>
        </div>
    );
};

export const ProfileScreen: React.FC = () => (
    <UIProvider>
        <ProfileScreenContent />
    </UIProvider>
);
