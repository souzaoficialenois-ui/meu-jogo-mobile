import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { motion, AnimatePresence } from 'motion/react';
import { AVATAR_LIST, BACKGROUND_LIST } from '../../constants';
import { RankService, RANKS } from '../../services/RankService';
import { STAGE_DB } from '../../constants/StageDatabase';
import { 
    ArrowLeft, 
    Trophy,
    Copy,
    PenLine,
    LogOut,
    Award,
    CheckCircle2,
    Check,
    X
} from 'lucide-react';
import { useUI, UIProvider } from '../../contexts/UIContext';

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

interface AuraConfig {
    id: string;
    name: { pt_br: string; en_us: string };
    glowColor: string;
    borderColor: string;
    accentText: string;
    gradient: string;
    particleColor: string;
    ambientBg: string;
}

const AURAS: AuraConfig[] = [
    { id: 'gold', name: { pt_br: 'Super Sayajin', en_us: 'Super Saiyan Gold' }, glowColor: '#f59e0b', borderColor: 'border-amber-500/50', accentText: 'text-amber-400', gradient: 'from-amber-600 via-yellow-500 to-amber-300', particleColor: 'bg-amber-400', ambientBg: 'bg-amber-600/5' },
    { id: 'blue', name: { pt_br: 'Deus Azul', en_us: 'Divine Blue' }, glowColor: '#06b6d4', borderColor: 'border-cyan-500/50', accentText: 'text-cyan-400', gradient: 'from-cyan-600 via-blue-500 to-teal-400', particleColor: 'bg-cyan-400', ambientBg: 'bg-cyan-600/5' },
    { id: 'silver', name: { pt_br: 'Instinto Superior', en_us: 'Instinct Silver' }, glowColor: '#94a3b8', borderColor: 'border-slate-400/50', accentText: 'text-slate-100', gradient: 'from-slate-400 via-zinc-300 to-slate-100', particleColor: 'bg-slate-300', ambientBg: 'bg-slate-200/5' },
    { id: 'purple', name: { pt_br: 'Ego Superior', en_us: 'Destruction Ego' }, glowColor: '#d946ef', borderColor: 'border-fuchsia-500/50', accentText: 'text-fuchsia-400', gradient: 'from-purple-600 via-fuchsia-500 to-violet-400', particleColor: 'bg-fuchsia-400', ambientBg: 'bg-purple-600/5' },
    { id: 'red', name: { pt_br: 'Kaioken', en_us: 'Rage Kaioken' }, glowColor: '#ef4444', borderColor: 'border-red-500/50', accentText: 'text-red-500', gradient: 'from-red-600 via-orange-500 to-red-400', particleColor: 'bg-red-500', ambientBg: 'bg-red-600/5' },
    { id: 'green', name: { pt_br: 'Poder Lendário', en_us: 'Legendary Green' }, glowColor: '#10b981', borderColor: 'border-emerald-500/50', accentText: 'text-emerald-400', gradient: 'from-emerald-600 via-green-500 to-lime-400', particleColor: 'bg-emerald-400', ambientBg: 'bg-emerald-600/5' },
    { id: 'beta_pioneer', name: { pt_br: 'Pioneiro Beta', en_us: 'Beta Pioneer' }, glowColor: '#f97316', borderColor: 'border-orange-500/50', accentText: 'text-orange-500', gradient: 'from-orange-600 via-yellow-500 to-orange-400', particleColor: 'bg-orange-500', ambientBg: 'bg-orange-600/5' }
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
        isOfflineMode,
        t
    } = useSceneManager();

    const { s } = useUI();
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

    // Profile preferences loaded from localStorage
    const [selectedAura, setSelectedAura] = useState<string>(() => {
        return (typeof window !== "undefined" && localStorage.getItem("fighter_profile_aura")) || "gold";
    });

    const [selectedStageId, setSelectedStageId] = useState<string>(() => {
        return (typeof window !== "undefined" && localStorage.getItem("fighter_profile_favorite_stage")) || "TORNEIO_DO_PODER";
    });

    const [equippedTitleId, setEquippedTitleId] = useState<string>(() => {
        return (typeof window !== "undefined" && localStorage.getItem("fighter_profile_title")) || "warrior";
    });

    // Default Profile Fallbacks
    const rawProfile = playerProfile || {
        playerId: 'GUEST_FIGHTER_X',
        numericId: '1088452271',
        name: 'GUEST_SAIYAN',
        avatarId: 'avatar_1',
        backgroundId: 'bg_1',
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

    const activeAuraConfig = AURAS.find(a => a.id === selectedAura) || AURAS[0];

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

    const avatarUrl = AVATAR_LIST.find(a => a.id === profile.avatarId)?.url || "/Assets/UI/avatar_placeholder.png";

    const totalMatches = profile.wins + profile.losses;
    const winRate = totalMatches > 0 ? Math.round((profile.wins / totalMatches) * 100) : 0;

    const activeStage = STAGE_DB.find(stg => stg.id === selectedStageId) || STAGE_DB[0];
    const activeTitle = TITLES.find(t => t.id === equippedTitleId) || TITLES[0];

    const logoUrl = localizeUrl('/Assets/ui/logo/logojogo.png');

    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        changeScene(SceneName.MAIN_MENU);
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
        setEquippedTitleId(titleId);
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
        <div className="absolute inset-0 bg-stone-950 text-white flex flex-col font-sans overflow-hidden select-none">
            {/* Background Layer with active stage backdrop */}
            <div className="absolute inset-0 z-0">
                {activeStage.img ? (
                    <img 
                        src={activeStage.img} 
                        alt="Background" 
                        className="w-full h-full object-cover opacity-30 scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-stone-900 opacity-25" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-stone-950/80" />
            </div>

            <div className="scanline" />
            
            {/* Ambient Background backglow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[85vw] h-[65vh] ${activeAuraConfig.ambientBg} rounded-full pointer-events-none transition-all duration-700`} />

            {/* HEADER */}
            <header 
                className="h-[8vh] min-h-[60px] max-h-20 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] flex items-center justify-between relative z-50 bg-stone-950/90 border-b border-stone-900/80 backdrop-blur-md shrink-0"
            >
                <div className="flex items-center gap-3 md:gap-5">
                    <img src={logoUrl} alt="Logo" className="h-10 md:h-12 object-contain" />
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 md:w-12 md:h-12 bg-stone-900/50 hover:bg-orange-500/20 text-stone-400 hover:text-orange-500 rounded-xl flex items-center justify-center transition-all border border-stone-800 hover:border-orange-500/50 group active:scale-95 cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex flex-col text-left">
                        <span className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] leading-none mb-1">
                            {isPt ? 'DOSSIÊ DO GUERREIRO' : 'WARRIOR DOSSIER'}
                        </span>
                        <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                            {profile.name}
                        </h1>
                    </div>
                </div>

                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    className="group flex items-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50 hover:border-red-500 rounded-xl transition-all active:scale-95 font-black uppercase tracking-widest text-[10px] cursor-pointer"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{isPt ? 'SAIR' : 'LOGOUT'}</span>
                </button>
            </header>

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

            {/* MAIN 2-COLUMN WORKSPACE */}
            <main className="flex-1 w-full flex flex-col lg:flex-row gap-6 px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] py-6 overflow-hidden relative z-10 items-stretch justify-center">
                
                {/* COLUMN 1: PLAYER IDENTITY & STATS */}
                <section className="w-full lg:w-[48%] bg-stone-950/20 backdrop-blur-xl flex flex-col overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                        
                        {/* 1. Identity Card */}
                        <div className="bg-stone-950/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden group/idcard">
                            {BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url && (
                                <img 
                                    src={BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url} 
                                    alt="Background" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-overlay transition-transform duration-700 group-hover/idcard:scale-110" 
                                />
                            )}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${activeAuraConfig.gradient} z-10 opacity-70`} />
                            
                            <div className="flex items-start gap-5 relative z-10">
                                <div className="flex flex-col gap-3">
                                    {/* Avatar Selector Toggle */}
                                    <button 
                                        onClick={() => { 
                                            if (isOfflineMode) {
                                                AudioManager.getInstance().playSFX('cancel');
                                                return;
                                            }
                                            AudioManager.getInstance().playSFX('click'); 
                                            setShowAvatarSelector(!showAvatarSelector); 
                                            setShowBgSelector(false);
                                        }}
                                        className={`relative group shrink-0 rounded-2xl overflow-hidden bg-stone-900/80 border-2 transition-all w-20 h-20 md:w-24 md:h-24 shadow-xl ${
                                            isOfflineMode ? 'border-stone-800 opacity-60 grayscale cursor-not-allowed' : 'border-stone-800 hover:border-orange-500 active:scale-95 cursor-pointer'
                                        }`}
                                        title={isOfflineMode ? (isPt ? "Edição desativada offline" : "Editing disabled offline") : (isPt ? "Alterar Avatar" : "Change Avatar")}
                                    >
                                        {BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url && (
                                            <img 
                                                src={BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url} 
                                                alt="Background" 
                                                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                                            />
                                        )}
                                        <img src={avatarUrl} className="w-full h-full object-contain filter contrast-125 p-2 relative z-10" alt="Avatar" />
                                        {!isOfflineMode && (
                                            <div className="absolute inset-0 bg-orange-500/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm transition-opacity z-20">
                                                {isPt ? "AVATAR" : "AVATAR"}
                                            </div>
                                        )}
                                    </button>

                                    {/* Background Selector Toggle */}
                                    <button 
                                        onClick={() => { 
                                            if (isOfflineMode) {
                                                AudioManager.getInstance().playSFX('cancel');
                                                return;
                                            }
                                            AudioManager.getInstance().playSFX('click'); 
                                            setShowBgSelector(!showBgSelector); 
                                            setShowAvatarSelector(false);
                                        }}
                                        className={`relative group shrink-0 rounded-xl overflow-hidden bg-stone-900/80 border transition-all w-20 h-10 md:w-24 md:h-12 shadow-md ${
                                            isOfflineMode ? 'border-stone-800 opacity-60 grayscale cursor-not-allowed' : 'border-stone-800 hover:border-orange-500 active:scale-95 cursor-pointer'
                                        }`}
                                        title={isOfflineMode ? (isPt ? "Edição desativada offline" : "Editing disabled offline") : (isPt ? "Alterar Fundo" : "Change Background")}
                                    >
                                        {BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url && (
                                            <img 
                                                src={BACKGROUND_LIST.find(b => b.id === profile.backgroundId)?.url} 
                                                alt="Background" 
                                                className="absolute inset-0 w-full h-full object-cover" 
                                            />
                                        )}
                                        {!isOfflineMode && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm transition-opacity">
                                                {isPt ? "FUNDO" : "BG"}
                                            </div>
                                        )}
                                    </button>
                                </div>
                                
                                {/* Identity text details */}
                                <div className="flex-1 min-w-0 text-left space-y-2 mt-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {isEditingName ? (
                                            <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-lg border border-orange-500/30">
                                                <input 
                                                    type="text"
                                                    value={nameInput}
                                                    onChange={(e) => setNameInput(e.target.value.toUpperCase().slice(0, 12))}
                                                    className="bg-transparent font-black text-white px-2 py-0.5 text-base focus:outline-none w-32 uppercase placeholder:text-stone-700"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveName} className="bg-emerald-600 hover:bg-emerald-500 rounded p-1.5 text-white transition-colors cursor-pointer"><Check size={14} /></button>
                                                <button onClick={() => { setIsEditingName(false); setNameInput(profile.name); }} className="bg-stone-800 hover:bg-red-900 rounded p-1.5 text-white transition-colors cursor-pointer"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group/name">
                                                <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase truncate drop-shadow-lg leading-none">
                                                    {profile.name}
                                                </h2>
                                                {!isOfflineMode && (
                                                    <button 
                                                        onClick={() => setIsEditingName(true)} 
                                                        className="opacity-0 group-hover/name:opacity-100 hover:bg-white/10 rounded-lg p-1.5 text-stone-400 hover:text-white transition-all cursor-pointer"
                                                    >
                                                        <PenLine size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={handleCopyId}
                                            className="bg-stone-900/50 hover:bg-orange-500/20 border border-white/5 text-stone-500 hover:text-orange-500 rounded-lg p-1.5 transition-all cursor-pointer"
                                            title={isPt ? "Copiar ID da Conta" : "Copy Account ID"}
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <p className="font-mono text-[10px] text-stone-500 font-bold tracking-wider uppercase bg-black/30 px-2 py-0.5 rounded">ID: {profile.numericId || profile.playerId}</p>
                                        {activeTitle.img ? (
                                            <img 
                                                src={activeTitle.img} 
                                                alt="Title" 
                                                className="h-10 md:h-12 object-contain drop-shadow-[0_0_10px_rgba(234,88,12,0.4)]" 
                                            />
                                        ) : (
                                            <span className={`inline-flex items-center rounded-lg font-black tracking-widest uppercase bg-stone-900/80 border border-white/5 text-[9px] px-3 py-1 ${activeTitle.color} shadow-lg`}>
                                                <Award size={10} className="mr-1.5 shrink-0" />
                                                {isPt ? activeTitle.name.pt_br : activeTitle.name.en_us}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Collapsible Avatar Picker */}
                            <AnimatePresence>
                                {showAvatarSelector && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-white/5 mt-6 pt-5 text-left relative z-10"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{isPt ? "SELECIONE SEU AVATAR" : "SELECT AVATAR"}</span>
                                            <button onClick={() => setShowAvatarSelector(false)} className="text-stone-500 hover:text-white p-1 transition-colors"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-5 xs:grid-cols-7 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/40 rounded-2xl border border-white/5">
                                            {AVATAR_LIST.filter(avatar => {
                                                // Avatars avatar_1 to avatar_15 are always available (free)
                                                // Other avatars must be unlocked via Gacha or Missions
                                                const idNum = parseInt(avatar.id.replace('avatar_', ''));
                                                if (!isNaN(idNum) && idNum <= 15) return true;
                                                return (unlockedItems[avatar.id]?.quantity || 0) > 0;
                                            }).map((avatar) => {
                                                const isSelected = profile.avatarId === avatar.id;
                                                return (
                                                    <button
                                                        key={avatar.id}
                                                        onClick={() => handleAvatarSelect(avatar.id)}
                                                        className={`aspect-square rounded-xl bg-stone-900/50 border-2 relative flex items-center justify-center transition-all cursor-pointer group/avatar ${
                                                            isSelected ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'border-stone-800 hover:border-stone-600'
                                                        }`}
                                                    >
                                                        <img src={avatar.url} className={`w-full h-full object-contain p-1 transition-transform ${isSelected ? 'scale-110' : 'group-hover/avatar:scale-110'}`} alt="" referrerPolicy="no-referrer" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Collapsible Background Picker */}
                            <AnimatePresence>
                                {showBgSelector && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-white/5 mt-6 pt-5 text-left relative z-10"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">{isPt ? "SELECIONE SEU FUNDO" : "SELECT BACKGROUND"}</span>
                                            <button onClick={() => setShowBgSelector(false)} className="text-stone-500 hover:text-white p-1 transition-colors"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-black/40 rounded-2xl border border-white/5">
                                            {BACKGROUND_LIST.filter(bg => {
                                                // Backgrounds bg_1 to bg_4 are always available
                                                const idNum = parseInt(bg.id.replace('bg_', ''));
                                                if (!isNaN(idNum) && idNum <= 4) return true;
                                                return (unlockedItems[bg.id]?.quantity || 0) > 0;
                                            }).map((bg) => {
                                                const isSelected = profile.backgroundId === bg.id;
                                                return (
                                                    <button
                                                        key={bg.id}
                                                        onClick={() => handleBgSelect(bg.id)}
                                                        className={`aspect-video rounded-lg bg-stone-900/50 border-2 relative flex items-center justify-center transition-all cursor-pointer group/bg ${
                                                            isSelected ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'border-stone-800 hover:border-stone-600'
                                                        }`}
                                                    >
                                                        <img src={bg.url} className={`w-full h-full object-cover rounded-md transition-transform ${isSelected ? 'scale-110' : 'group-hover/bg:scale-110'}`} alt="" referrerPolicy="no-referrer" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Warcry Bio Editor */}
                            <div className="mt-6 pt-5 border-t border-white/5 text-left group/bio relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-stone-500 uppercase tracking-[0.3em] block leading-none text-[9px]">
                                        {isPt ? 'LEMA DO GUERREIRO' : 'WARCRY MOTTO'}
                                    </span>
                                    {!isEditingBio && !isOfflineMode && (
                                        <button 
                                            onClick={() => setIsEditingBio(true)} 
                                            className="opacity-0 group-hover/bio:opacity-100 hover:bg-white/10 rounded-lg p-1.5 text-stone-500 hover:text-white transition-all cursor-pointer"
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
                                            className="bg-stone-900/80 border border-orange-500/30 rounded-xl text-stone-200 text-xs focus:outline-none focus:border-orange-500 resize-none w-full p-3 font-medium tracking-wide shadow-inner"
                                            rows={2}
                                            placeholder={isPt ? "Escreva seu grito de guerra..." : "Write your warcry..."}
                                        />
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest px-1">
                                            <span className="text-stone-600">{bioInput.length} / 60</span>
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveBio} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-lg text-white transition-all cursor-pointer shadow-lg">{isPt ? 'CONFIRMAR' : 'SAVE'}</button>
                                                <button onClick={() => { setIsEditingBio(false); setBioInput(profile.bio || ''); }} className="bg-stone-800 hover:bg-stone-700 px-4 py-1.5 rounded-lg text-stone-300 transition-all cursor-pointer">{isPt ? 'CANCELAR' : 'CANCEL'}</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-stone-300 text-sm italic font-medium mt-1 leading-relaxed px-1">
                                        "{profile.bio || (isPt ? 'Lutar até o limite extremo.' : 'Fight beyond the limit.')}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 2. Rank Division Card */}
                        <div className="bg-stone-950/40 border border-white/5 rounded-2xl p-6 text-left relative overflow-hidden shadow-xl">
                            <span className="font-black text-orange-500 uppercase tracking-[0.3em] text-[9px] block mb-3">
                                {isPt ? 'PATENTE RANQUEADA' : 'COMPETITIVE RANK'}
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-900 to-black border border-white/10 flex items-center justify-center text-orange-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
                                    <Trophy size={32} className="drop-shadow-[0_0_10px_rgba(234,88,12,0.4)]" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none mb-1">
                                        {profile.rank}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-orange-400 font-black text-xs">{profile.points.toLocaleString()} <span className="text-[10px] text-stone-600 ml-0.5 tracking-tighter uppercase">Battle Points</span></span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-lg">
                                        <span className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em]">
                                            {profile.rankTier}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Core Stats Grid */}
                        <div className="bg-stone-950/40 border border-white/5 rounded-2xl p-6 text-left shadow-xl">
                            <span className="font-black text-orange-500 uppercase tracking-[0.3em] text-[9px] block mb-5">
                                {isPt ? 'DESEMPENHO EM DUELOS' : 'TACTICAL PERFORMANCE'}
                            </span>

                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                {/* Circular Win Rate Graphic */}
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
                                            style={{ filter: 'drop-shadow(0 0 8px rgba(234,88,12,0.4))' }}
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
                                        <div key={i} className="bg-stone-900/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                                            <span className="text-[8px] text-stone-500 uppercase block font-black tracking-widest mb-1">{stat.label}</span>
                                            <span className={`text-lg font-black italic tracking-tighter ${stat.color}`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* COLUMN 2: CUSTOMIZATION CONTROLS */}
                <section className="w-full lg:w-[48%] bg-stone-950/20 backdrop-blur-xl flex flex-col overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 text-left">
                        
                        <div className="border-b border-white/5 pb-4 mb-2">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1 block">
                                {isPt ? 'ESTILO & IDENTIDADE' : 'STYLE & IDENTITY'}
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                {isPt ? 'PERSONALIZAR GUERREIRO' : 'CUSTOMIZE WARRIOR'}
                            </h3>
                        </div>

                        {/* Title selector */}
                        <div className="bg-stone-950/40 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">
                                        {isPt ? 'TÍTULO DE HONRA' : 'HONORARY TITLE'}
                                    </h4>
                                    <p className="text-[9px] text-stone-500 font-medium uppercase tracking-wider">{isPt ? 'EXIBIDO ABAIXO DO SEU NOME' : 'DISPLAYED BENEATH YOUR NAME'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                                {TITLES.filter(t => t.id === 'warrior' || profile.unlockedTitles?.includes(t.id)).map((t) => {
                                    const isSelected = equippedTitleId === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => !isOfflineMode && handleTitleSelect(t.id)}
                                            disabled={isOfflineMode}
                                            className={`flex items-center justify-between font-black uppercase transition-all border rounded-xl px-4 py-3 text-[10px] tracking-widest relative overflow-hidden group/titlebtn ${
                                                isSelected 
                                                ? 'bg-orange-500/20 border-orange-500 text-white shadow-[0_0_20px_rgba(234,88,12,0.2)]' 
                                                : 'bg-stone-900/60 border-white/5 text-stone-500 hover:text-stone-300 hover:border-stone-700'
                                            } ${isOfflineMode ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                        >
                                            {t.img ? (
                                                <img src={t.img} alt={t.id} className={`h-8 object-contain relative z-10 ${isSelected ? '' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all'}`} />
                                            ) : (
                                                <span className="relative z-10">{isPt ? t.name.pt_br : t.name.en_us}</span>
                                            )}
                                            <div className={`w-2 h-2 rounded-full relative z-10 shadow-sm transition-transform duration-300 ${isSelected ? 'bg-orange-500 scale-125' : 'bg-stone-700 group-hover/titlebtn:scale-110'}`} />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </section>

            </main>
        </div>
    );
};

export const ProfileScreen: React.FC = () => (
    <UIProvider>
        <ProfileScreenContent />
    </UIProvider>
);
