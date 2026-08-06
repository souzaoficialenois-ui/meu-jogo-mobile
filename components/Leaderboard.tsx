import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trophy, Search, Shield, RefreshCw, Flame, Award, 
    Calendar, Sparkles, ChevronDown, User, Star, Filter, Info, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RankService, SeasonInfo, DEFAULT_SEASONS } from '../services/RankService';
import { useSceneManager } from '../contexts/SceneContext';
import { AudioManager } from '../services/AudioManager';
import { AVATAR_LIST } from '../personagens/CharacterDatabase';
import { PlayerProfileModal } from './social/PlayerProfileModal';
import { PlayerTitleBadge } from './ui/PlayerTitleBadge';

interface LeaderboardProps {
    className?: string;
    showTitle?: boolean;
    onClose?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
    className = "", 
    showTitle = true,
    onClose
}) => {
    const { playerProfile, settings, checkAndGrantTitles } = useSceneManager();
    const isPt = settings?.language === 'pt';
    const [seasons, setSeasons] = useState<SeasonInfo[]>(DEFAULT_SEASONS);
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('season_1');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);

    // Fetch available seasons on mount
    useEffect(() => {
        const loadSeasons = async () => {
            const list = await RankService.getSeasons();
            setSeasons(list);
            
            // Default to first active season or 'season_1'
            const activeSeason = list.find(s => s.status === 'ACTIVE' && s.id !== 'global') || list[0];
            if (activeSeason) {
                setSelectedSeasonId(activeSeason.id);
            }
        };
        loadSeasons();
    }, []);

    // Listen to leaderboard real-time changes when selected season changes
    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = RankService.listenToLeaderboard((data) => {
            // Sort by points descending just in case
            const sorted = [...data].sort((a, b) => (b.points || 0) - (a.points || 0));
            setLeaderboardData(sorted);
            setIsLoading(false);
        }, 100, selectedSeasonId);

        return () => {
            unsubscribe();
        };
    }, [selectedSeasonId]);

    const activeSeasonObj = useMemo(() => {
        return seasons.find(s => s.id === selectedSeasonId) || seasons[0];
    }, [seasons, selectedSeasonId]);

    // Filtered leaderboard data by search query
    const filteredLeaderboard = useMemo(() => {
        if (!searchQuery.trim()) return leaderboardData;
        const q = searchQuery.toLowerCase().trim();
        return leaderboardData.filter(item => 
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.userId && item.userId.toLowerCase().includes(q))
        );
    }, [leaderboardData, searchQuery]);

    // Top 3 for podium
    const topThree = useMemo(() => {
        return leaderboardData.slice(0, 3);
    }, [leaderboardData]);

    // Current player's rank entry
    const myPlayerEntry = useMemo(() => {
        if (!playerProfile?.playerId) return null;
        const index = leaderboardData.findIndex(item => item.userId === playerProfile.playerId);
        if (index !== -1) {
            return {
                ...leaderboardData[index],
                rank: index + 1
            };
        }
        // Fallback for current player if not in leaderboard data yet
        const points = playerProfile.ranked?.br?.points ?? 1000;
        const wins = playerProfile.wins || 0;
        const losses = playerProfile.losses || 0;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        
        return {
            userId: playerProfile.playerId,
            name: playerProfile.name,
            avatarId: playerProfile.avatarId,
            title: playerProfile.activeTitle || 'Desafiante',
            points,
            winRate,
            wins,
            losses,
            rank: leaderboardData.length + 1,
            isFallback: true
        };
    }, [leaderboardData, playerProfile]);

    useEffect(() => {
        if (myPlayerEntry?.rank && checkAndGrantTitles) {
            checkAndGrantTitles(myPlayerEntry.rank);
        }
    }, [myPlayerEntry?.rank, checkAndGrantTitles]);

    const getAvatarUrl = (avatarId?: string) => {
        if (!avatarId) return "/Assets/avatar/retrato/1.png";
        const cleanId = avatarId.toString().replace('avatar_', '');
        const found = AVATAR_LIST.find(a => a.id === avatarId || a.id === `avatar_${cleanId}`);
        if (found?.url) return found.url;
        return `/Assets/avatar/retrato/${cleanId}.png`;
    };

    const handleSelectSeason = (seasonId: string) => {
        AudioManager.getInstance().playSFX('navigation');
        setSelectedSeasonId(seasonId);
        setIsSeasonDropdownOpen(false);
    };

    const getTierBadge = (points: number) => {
        const { name } = RankService.getRankFromPoints(points);
        switch (name) {
            case 'Zeno': return { label: 'Zeno', color: 'from-purple-500 to-pink-500 border-pink-400 text-pink-300', icon: Sparkles };
            case 'Anjo': return { label: 'Anjo', color: 'from-cyan-400 to-blue-600 border-cyan-300 text-cyan-200', icon: Star };
            case 'Deus da Destruição': return { label: 'Deus da Destruição', color: 'from-purple-600 to-indigo-900 border-purple-400 text-purple-300', icon: Shield };
            case 'Lenda': return { label: 'Lenda', color: 'from-amber-500 to-red-600 border-amber-400 text-amber-300', icon: Trophy };
            case 'Super Elite': return { label: 'Super Elite', color: 'from-red-600 to-orange-500 border-red-400 text-red-300', icon: Flame };
            case 'Elite': return { label: 'Elite', color: 'from-orange-500 to-yellow-500 border-orange-400 text-orange-300', icon: Award };
            case 'Guerreiro': return { label: 'Guerreiro', color: 'from-yellow-500 to-amber-600 border-yellow-400 text-yellow-300', icon: Shield };
            case 'Lutador': return { label: 'Lutador', color: 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-300', icon: Shield };
            default: return { label: 'Aprendiz', color: 'from-stone-600 to-stone-800 border-stone-500 text-stone-300', icon: User };
        }
    };

    return (
        <div className={`w-full h-full flex flex-col bg-stone-950 text-white rounded-3xl border border-stone-800 overflow-hidden shadow-2xl relative ${className}`}>
            {/* Header section with title & live indicator */}
            {showTitle && (
                <div className="p-4 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)]" />
                    
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                            <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center text-amber-400">
                                <Trophy size={24} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase text-white flex items-center gap-2">
                                {isPt ? 'Ranking Global' : 'Global Leaderboard'}
                                <span className="text-xs font-mono not-italic px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase">
                                    Firebase Live
                                </span>
                            </h1>
                            <p className="text-xs text-stone-400 font-medium">
                                {isPt ? 'Classificação de combate com filtro por temporada' : 'Competitive combat ranking filtered by season'}
                            </p>
                        </div>
                    </div>

                    {/* Top Controls */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {isPt ? 'AO VIVO' : 'LIVE'}
                        </div>
                    </div>
                </div>
            )}

            {/* Season Selector & Info Banner */}
            <div className="p-4 sm:p-5 bg-stone-900/80 border-b border-stone-850 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Season Dropdown / Tabs */}
                    <div className="relative flex-1 max-w-md">
                        <label className="text-[10px] font-black uppercase text-amber-400/90 tracking-wider mb-1 block flex items-center gap-1.5">
                            <Filter size={12} className="text-amber-400" />
                            {isPt ? 'Filtrar por Temporada:' : 'Filter by Season:'}
                        </label>

                        <button 
                            onClick={() => {
                                AudioManager.getInstance().playSFX('click');
                                setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
                            }}
                            className="w-full bg-stone-950 border border-stone-750 hover:border-amber-500/60 px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider text-left flex items-center justify-between text-white transition-colors cursor-pointer shadow-inner"
                        >
                            <span className="truncate flex items-center gap-2">
                                <Trophy size={14} className="text-amber-400 shrink-0" />
                                {activeSeasonObj.name}
                            </span>
                            <ChevronDown size={16} className={`text-stone-400 transition-transform ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isSeasonDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-stone-900 border-2 border-stone-750 rounded-2xl shadow-2xl z-40 overflow-hidden p-1.5 space-y-1 backdrop-blur-md"
                                >
                                    {seasons.map(season => {
                                        const isSelected = season.id === selectedSeasonId;
                                        return (
                                            <button
                                                key={season.id}
                                                onClick={() => handleSelectSeason(season.id)}
                                                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between text-xs cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 text-amber-300 font-black' 
                                                        : 'hover:bg-stone-800/80 text-stone-300 font-semibold'
                                                }`}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-bold truncate uppercase">{season.name}</p>
                                                    <p className="text-[10px] text-stone-400 truncate mt-0.5">{season.description}</p>
                                                </div>
                                                <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    season.status === 'ACTIVE' 
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                        : season.status === 'COMPLETED' 
                                                            ? 'bg-stone-800 text-stone-400 border border-stone-700' 
                                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {season.status === 'ACTIVE' ? (isPt ? 'Ativa' : 'Active') : season.status === 'COMPLETED' ? (isPt ? 'Encerrada' : 'Ended') : (isPt ? 'Em Breve' : 'Soon')}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-xs self-end">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider mb-1 block">
                            {isPt ? 'Buscar Guerreiro:' : 'Search Fighter:'}
                        </label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isPt ? "Buscar por nome..." : "Search by name..."}
                                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Active Season Banner details */}
                {activeSeasonObj && (
                    <div className="bg-stone-950/70 border border-stone-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-amber-400 shrink-0" />
                            <span className="text-stone-300 font-medium">
                                <strong className="text-white">{isPt ? 'Período:' : 'Period:'}</strong> {new Date(activeSeasonObj.startDate).toLocaleDateString()} - {new Date(activeSeasonObj.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        {activeSeasonObj.rewardsDescription && (
                            <div className="flex items-center gap-2 text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                                <Sparkles size={13} className="text-amber-400 shrink-0" />
                                <span>{isPt ? 'Recompensas:' : 'Rewards:'} {activeSeasonObj.rewardsDescription}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                
                {/* PODIUM TOP 3 (1º, 2º, 3º LUGAR) */}
                {!isLoading && topThree.length > 0 && !searchQuery && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
                        
                        {/* 2nd Place (Left) */}
                        {topThree[1] ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                onClick={() => setSelectedPlayerId(topThree[1].userId)}
                                className="bg-gradient-to-b from-stone-900 via-stone-900/80 to-stone-950 border border-slate-400/40 hover:border-slate-300 p-3 sm:p-4 rounded-2xl text-center flex flex-col items-center relative cursor-pointer group shadow-lg transition-all hover:scale-105"
                            >
                                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-stone-950 font-black text-[10px] tracking-wider uppercase border border-white shadow-md">
                                    2º Lugar
                                </div>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-slate-300 bg-stone-950 overflow-hidden my-2 relative group-hover:shadow-[0_0_15px_rgba(203,213,225,0.5)] transition-all">
                                    <img 
                                        src={getAvatarUrl(topThree[1].avatarId)} 
                                        alt={topThree[1].name} 
                                        className="w-full h-full object-contain p-1"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                <h3 className="text-xs sm:text-sm font-black uppercase text-white truncate max-w-full">
                                    {topThree[1].name}
                                </h3>
                                <p className="text-[10px] text-slate-300 font-mono font-bold mt-0.5">
                                    {topThree[1].points || 0} PTS
                                </p>
                                <span className="text-[9px] text-stone-400 mt-1 font-semibold">
                                    {topThree[1].winRate || 0}% Vitórias
                                </span>
                            </motion.div>
                        ) : <div />}

                        {/* 1st Place (Center - HIGHEST) */}
                        {topThree[0] ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedPlayerId(topThree[0].userId)}
                                className="bg-gradient-to-b from-amber-950/60 via-stone-900 to-stone-950 border-2 border-amber-400 hover:border-amber-300 p-4 sm:p-5 rounded-3xl text-center flex flex-col items-center relative cursor-pointer group shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all hover:scale-105 -translate-y-2 z-10"
                            >
                                <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs tracking-wider uppercase border-2 border-white shadow-lg flex items-center gap-1">
                                    <Trophy size={13} className="fill-stone-950" />
                                    1º CAMPEÃO
                                </div>
                                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-400 bg-stone-950 overflow-hidden my-3 relative shadow-[0_0_20px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-all">
                                    <img 
                                        src={getAvatarUrl(topThree[0].avatarId)} 
                                        alt={topThree[0].name} 
                                        className="w-full h-full object-contain p-1"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                <h3 className="text-sm sm:text-base font-black italic uppercase text-amber-300 truncate max-w-full drop-shadow">
                                    {topThree[0].name}
                                </h3>
                                <p className="text-xs sm:text-sm text-amber-400 font-mono font-black mt-0.5">
                                    {topThree[0].points || 0} <span className="text-[10px] text-stone-400">PTS</span>
                                </p>
                                <div className="mt-2 flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[9px] text-amber-300 font-bold">
                                    <Flame size={12} className="text-orange-500" />
                                    <span>{topThree[0].winStreak ? `${topThree[0].winStreak} Win Streak` : `${topThree[0].winRate || 0}% WR`}</span>
                                </div>
                            </motion.div>
                        ) : <div />}

                        {/* 3rd Place (Right) */}
                        {topThree[2] ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                onClick={() => setSelectedPlayerId(topThree[2].userId)}
                                className="bg-gradient-to-b from-stone-900 via-stone-900/80 to-stone-950 border border-amber-700/50 hover:border-amber-600 p-3 sm:p-4 rounded-2xl text-center flex flex-col items-center relative cursor-pointer group shadow-lg transition-all hover:scale-105"
                            >
                                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-white font-black text-[10px] tracking-wider uppercase border border-amber-500 shadow-md">
                                    3º Lugar
                                </div>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-amber-700 bg-stone-950 overflow-hidden my-2 relative group-hover:shadow-[0_0_15px_rgba(180,83,9,0.5)] transition-all">
                                    <img 
                                        src={getAvatarUrl(topThree[2].avatarId)} 
                                        alt={topThree[2].name} 
                                        className="w-full h-full object-contain p-1"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                <h3 className="text-xs sm:text-sm font-black uppercase text-white truncate max-w-full">
                                    {topThree[2].name}
                                </h3>
                                <p className="text-[10px] text-amber-500 font-mono font-bold mt-0.5">
                                    {topThree[2].points || 0} PTS
                                </p>
                                <span className="text-[9px] text-stone-400 mt-1 font-semibold">
                                    {topThree[2].winRate || 0}% Vitórias
                                </span>
                            </motion.div>
                        ) : <div />}
                    </div>
                )}

                {/* LEADERBOARD LIST TABLE */}
                <div className="bg-stone-950/80 border border-stone-850 rounded-2xl overflow-hidden shadow-xl">
                    <div className="px-4 py-3 bg-stone-900 border-b border-stone-800 grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                        <div className="col-span-2 sm:col-span-1 text-center">Pos #</div>
                        <div className="col-span-6 sm:col-span-5">{isPt ? 'Guerreiro' : 'Fighter'}</div>
                        <div className="hidden sm:block sm:col-span-3 text-center">{isPt ? 'Divisão / Elo' : 'Division'}</div>
                        <div className="col-span-4 sm:col-span-3 text-right">{isPt ? 'Pontuação' : 'Points'}</div>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="animate-spin text-amber-500" size={32} />
                            <p className="text-xs font-bold uppercase tracking-wider">{isPt ? 'Carregando ranking da temporada...' : 'Loading season rankings...'}</p>
                        </div>
                    ) : filteredLeaderboard.length === 0 ? (
                        <div className="py-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
                            <Info size={32} className="text-stone-600" />
                            <p className="text-xs font-bold uppercase">{isPt ? 'Nenhum guerreiro registrado nesta temporada.' : 'No fighters recorded for this season yet.'}</p>
                            <p className="text-[10px] text-stone-600">{isPt ? 'Jogue partidas ranqueadas para acumular pontos!' : 'Play ranked matches to earn points!'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-850">
                            {filteredLeaderboard.map((item, index) => {
                                const rankPos = index + 1;
                                const isMe = playerProfile?.playerId === item.userId;
                                const tierInfo = getTierBadge(item.points || 0);

                                return (
                                    <div 
                                        key={`leaderboard-${item.userId || 'player'}-${index}`}
                                        onClick={() => {
                                            AudioManager.getInstance().playSFX('click');
                                            setSelectedPlayerId(item.userId);
                                        }}
                                        className={`px-4 py-3 grid grid-cols-12 gap-2 items-center transition-all cursor-pointer ${
                                            isMe 
                                                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-l-4 border-amber-400' 
                                                : 'hover:bg-stone-900/90'
                                        }`}
                                    >
                                        {/* Rank Position */}
                                        <div className="col-span-2 sm:col-span-1 text-center font-mono font-black text-xs sm:text-sm">
                                            {rankPos === 1 ? (
                                                <span className="text-amber-400 font-bold">🥇 1</span>
                                            ) : rankPos === 2 ? (
                                                <span className="text-slate-300 font-bold">🥈 2</span>
                                            ) : rankPos === 3 ? (
                                                <span className="text-amber-600 font-bold">🥉 3</span>
                                            ) : (
                                                <span className="text-stone-400">#{rankPos}</span>
                                            )}
                                        </div>

                                        {/* Avatar & Player Name */}
                                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl border border-stone-800 bg-stone-900 overflow-hidden shrink-0 relative">
                                                <img 
                                                    src={getAvatarUrl(item.avatarId)} 
                                                    alt={item.name} 
                                                    className="w-full h-full object-contain p-0.5"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-xs sm:text-sm font-black uppercase italic truncate ${isMe ? 'text-amber-300' : 'text-white'}`}>
                                                        {item.name || 'Guerreiro Anônimo'}
                                                    </p>
                                                    {isMe && (
                                                        <span className="text-[9px] font-bold uppercase bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded shrink-0">
                                                            {isPt ? 'VOCÊ' : 'YOU'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-stone-400 truncate">
                                                    {item.title || 'Desafiante'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tier Badge */}
                                        <div className="hidden sm:flex sm:col-span-3 items-center justify-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border bg-gradient-to-r ${tierInfo.color}`}>
                                                <tierInfo.icon size={12} />
                                                {tierInfo.label}
                                            </span>
                                        </div>

                                        {/* Points & WR */}
                                        <div className="col-span-4 sm:col-span-3 text-right">
                                            <p className="text-xs sm:text-sm font-black font-mono text-amber-400">
                                                {item.points || 0} <span className="text-[10px] text-stone-500">RP</span>
                                            </p>
                                            <p className="text-[9px] text-stone-400 font-semibold">
                                                {item.winRate ?? 0}% WR ({item.wins || 0}V)
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Current Player Footer */}
            {myPlayerEntry && (
                <div className="p-3 sm:p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border-2 border-amber-500 bg-stone-950 overflow-hidden shrink-0">
                            <img 
                                src={getAvatarUrl(myPlayerEntry.avatarId)} 
                                alt={myPlayerEntry.name} 
                                className="w-full h-full object-contain p-0.5"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black italic uppercase text-amber-300">
                                    {myPlayerEntry.name}
                                </span>
                                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                    #{myPlayerEntry.rank}
                                </span>
                            </div>
                            <p className="text-[10px] text-stone-400 font-medium">
                                {isPt ? 'Sua posição nesta temporada' : 'Your position in this season'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-mono font-black text-amber-400">{myPlayerEntry.points} RP</p>
                            <p className="text-[9px] text-stone-400">{myPlayerEntry.winRate}% WR</p>
                        </div>
                        <button 
                            onClick={() => setSelectedPlayerId(myPlayerEntry.userId)}
                            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl border border-stone-700 hover:border-amber-500 transition-colors cursor-pointer"
                            title={isPt ? "Ver Meu Perfil" : "View My Profile"}
                        >
                            <Eye size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Player Profile Modal */}
            {selectedPlayerId && (
                <PlayerProfileModal 
                    playerId={selectedPlayerId}
                    isOpen={!!selectedPlayerId}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
};
