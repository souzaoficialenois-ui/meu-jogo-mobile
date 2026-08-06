import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Trophy, 
    BarChart3, 
    Layers, 
    Crown, 
    Medal, 
    Swords, 
    Users, 
    Search, 
    ArrowLeft, 
    Shield, 
    Star, 
    Award, 
    TrendingUp, 
    ChevronRight,
    CheckCircle,
    XCircle,
    Percent
} from 'lucide-react';
import { 
    OnlineTournamentService, 
    DivisionTournament, 
    PlayerDivisionProgress 
} from '../../services/OnlineTournamentService';
import { AudioManager } from '../../services/AudioManager';
import { auth } from '../../services/firebase';
import { useSceneManager } from '../../contexts/SceneContext';
import { DivisionStatusIndicator } from '../DivisionStatusIndicator';

interface TournamentRankingScreenProps {
    tourneyId?: string;
    onBack?: () => void;
}

export const TournamentRankingScreen: React.FC<TournamentRankingScreenProps> = ({ 
    tourneyId: initialTourneyId, 
    onBack 
}) => {
    const { exitTournament } = useSceneManager();
    const currentUser = auth.currentUser;

    const [tournaments, setTournaments] = useState<DivisionTournament[]>([]);
    const [selectedTourneyId, setSelectedTourneyId] = useState<string | null>(initialTourneyId || null);
    const [currentTourney, setCurrentTourney] = useState<DivisionTournament | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'POINTS' | 'DIVISION' | 'WIN_RATE' | 'WINS'>('DIVISION');
    const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<number | 'ALL'>('ALL');

    // Subscribe to division tournaments list
    useEffect(() => {
        const unsub = OnlineTournamentService.getInstance().subscribeToDivisionTournaments((list) => {
            setTournaments(list);
            if (!selectedTourneyId && list.length > 0) {
                setSelectedTourneyId(list[0].id);
            }
        });
        return () => unsub();
    }, []);

    // Subscribe to selected division tournament detail
    useEffect(() => {
        if (!selectedTourneyId) {
            setCurrentTourney(null);
            return;
        }
        const unsub = OnlineTournamentService.getInstance().subscribeToSingleDivisionTournament(selectedTourneyId, (t) => {
            setCurrentTourney(t);
        });
        return () => unsub();
    }, [selectedTourneyId]);

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        if (onBack) {
            onBack();
        } else {
            exitTournament();
        }
    };

    // Calculate processed & sorted players list
    const processedPlayers = useMemo(() => {
        if (!currentTourney) return [];

        const playersMap = currentTourney.playersProgress || currentTourney.playerDetails || {};
        let list: (PlayerDivisionProgress & { winRatePercent: number; totalMatches: number })[] = Object.values(playersMap).map(p => {
            const wins = p.wins || 0;
            const losses = p.losses || 0;
            const totalMatches = wins + losses;
            const winRatePercent = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            return {
                ...p,
                totalMatches,
                winRatePercent
            };
        });

        // Filter by Search Term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.numericId && p.numericId.includes(term)) ||
                (p.title && p.title.toLowerCase().includes(term))
            );
        }

        // Filter by Division
        if (selectedDivisionFilter !== 'ALL') {
            list = list.filter(p => (p.divisionIndex ?? 0) === selectedDivisionFilter);
        }

        // Sort List
        list.sort((a, b) => {
            if (sortBy === 'DIVISION') {
                const divDiff = (b.divisionIndex ?? 0) - (a.divisionIndex ?? 0);
                if (divDiff !== 0) return divDiff;
                const ptsDiff = (b.points ?? 0) - (a.points ?? 0);
                if (ptsDiff !== 0) return ptsDiff;
                return (b.wins ?? 0) - (a.wins ?? 0);
            } else if (sortBy === 'POINTS') {
                const ptsDiff = (b.points ?? 0) - (a.points ?? 0);
                if (ptsDiff !== 0) return ptsDiff;
                return (b.divisionIndex ?? 0) - (a.divisionIndex ?? 0);
            } else if (sortBy === 'WIN_RATE') {
                const rateDiff = b.winRatePercent - a.winRatePercent;
                if (rateDiff !== 0) return rateDiff;
                return (b.wins ?? 0) - (a.wins ?? 0);
            } else {
                const winsDiff = (b.wins ?? 0) - (a.wins ?? 0);
                if (winsDiff !== 0) return winsDiff;
                return (b.points ?? 0) - (a.points ?? 0);
            }
        });

        return list;
    }, [currentTourney, searchTerm, sortBy, selectedDivisionFilter]);

    // Group players by current division
    const groupedByDivision = useMemo(() => {
        if (!currentTourney) return [];

        const divisions = currentTourney.divisions || [];
        return divisions.map(div => {
            const divPlayers = processedPlayers.filter(p => (p.divisionIndex ?? 0) === div.index);
            return {
                division: div,
                players: divPlayers
            };
        }).reverse(); // Show highest division (Final) first
    }, [currentTourney, processedPlayers]);

    return (
        <div className="relative w-full h-full bg-stone-950 text-white font-sans overflow-hidden flex flex-col select-none">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-stone-900/60 backdrop-blur-xl">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 rounded-2xl bg-stone-800/80 hover:bg-amber-500 hover:text-stone-950 border border-white/10 text-stone-300 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg group cursor-pointer"
                    >
                        <ArrowLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                                FIGHTER LEGEND
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                                RANKING EM TEMPO REAL
                            </span>
                        </div>
                        <h1 className="text-2xl font-black italic uppercase tracking-wider text-white mt-0.5 flex items-center gap-3">
                            CLASSIFICAÇÃO GERAL POR DIVISÕES <Trophy className="text-amber-400 w-6 h-6 inline" />
                        </h1>
                    </div>
                </div>

                {/* Tournament Selector Dropdown/Tabs if multiple tournaments exist */}
                {tournaments.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-widest text-stone-400 hidden md:inline">Torneio:</span>
                        <select 
                            value={selectedTourneyId || ''} 
                            onChange={(e) => setSelectedTourneyId(e.target.value)}
                            className="bg-stone-900 border border-amber-500/30 text-amber-300 font-black text-xs uppercase px-4 py-2.5 rounded-xl outline-none cursor-pointer focus:border-amber-400 transition-colors shadow-lg"
                        >
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id} className="bg-stone-900 text-white">
                                    {t.title} ({t.status === 'ACTIVE' ? 'EM ANDAMENTO' : t.status === 'REGISTRATION' ? 'INSCRIÇÕES' : 'ENCERRADO'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 relative z-10 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                {!currentTourney ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                        <Layers size={64} className="text-amber-500/50 animate-pulse mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-widest text-stone-300">NENHUM TORNEIO SELECIONADO</h3>
                        <p className="text-xs text-stone-500 mt-2">Aguardando dados dos torneios em andamento...</p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Tournament Overview Summary Banner */}
                        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900/80 to-stone-950 border border-amber-500/30 rounded-[2rem] p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                    <div className="w-full h-full bg-stone-950 rounded-[0.9rem] flex items-center justify-center text-amber-400">
                                        <Crown size={38} />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full">
                                            {currentTourney.region}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-stone-950 text-stone-300 border border-white/10 px-3 py-0.5 rounded-full">
                                            {currentTourney.teamSize}v{currentTourney.teamSize}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-wider text-white mt-1">
                                        {currentTourney.title}
                                    </h2>
                                    <p className="text-xs text-stone-400 mt-0.5 font-medium">
                                        {currentTourney.description}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Chips */}
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
                                <div className="px-5 py-3 bg-stone-950/60 border border-white/10 rounded-2xl text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 block">INSCRITOS</span>
                                    <span className="text-xl font-black font-mono text-amber-400">{currentTourney.players.length}/{currentTourney.maxPlayers}</span>
                                </div>
                                <div className="px-5 py-3 bg-stone-950/60 border border-white/10 rounded-2xl text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 block">DIVISÃO ATUAL</span>
                                    <span className="text-xl font-black font-mono text-cyan-400">FASE {(currentTourney.currentDivisionIndex ?? 0) + 1}</span>
                                </div>
                                <div className="px-5 py-3 bg-stone-950/60 border border-white/10 rounded-2xl text-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 block">STATUS</span>
                                    <span className={`text-xs font-black uppercase tracking-widest block mt-1 ${currentTourney.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                                        {currentTourney.status === 'ACTIVE' ? 'EM BATALHA' : currentTourney.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Filters, Search & Sort Bar */}
                        <div className="bg-stone-900/60 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                            {/* Search Input */}
                            <div className="relative w-full md:w-80">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar participante por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-stone-950 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-stone-500 outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                                {/* Division Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Divisão:</span>
                                    <select 
                                        value={selectedDivisionFilter}
                                        onChange={(e) => setSelectedDivisionFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                        className="bg-stone-950 border border-white/10 text-white font-bold text-xs uppercase px-3 py-2 rounded-xl outline-none focus:border-amber-500"
                                    >
                                        <option value="ALL">Todas as Divisões</option>
                                        {currentTourney.divisions.map(d => (
                                            <option key={d.index} value={d.index}>
                                                Fase {d.index + 1} ({d.name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Ordenar por:</span>
                                    <div className="flex bg-stone-950 border border-white/10 rounded-xl p-1 gap-1">
                                        <button 
                                            onClick={() => setSortBy('DIVISION')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                sortBy === 'DIVISION' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
                                            }`}
                                        >
                                            Divisão
                                        </button>
                                        <button 
                                            onClick={() => setSortBy('POINTS')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                sortBy === 'POINTS' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
                                            }`}
                                        >
                                            Pontos
                                        </button>
                                        <button 
                                            onClick={() => setSortBy('WIN_RATE')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                sortBy === 'WIN_RATE' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-white'
                                            }`}
                                        >
                                            % Vitórias
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GROUPED RANKING TABLES BY DIVISION */}
                        {groupedByDivision.map(({ division, players }) => {
                            if (selectedDivisionFilter !== 'ALL' && selectedDivisionFilter !== division.index) return null;

                            return (
                                <div key={`div-group-${division.index}`} className="bg-stone-900/40 border border-amber-500/20 rounded-[1.8rem] overflow-hidden backdrop-blur-md shadow-xl">
                                    {/* Division Header Banner */}
                                    <div className="bg-gradient-to-r from-amber-500/20 via-stone-900 to-stone-950 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                                                {division.index + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black italic uppercase tracking-wider text-white">
                                                    {division.name}
                                                </h3>
                                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                                    {players.length} PARTICIPANTE(S) NESTA ETAPA
                                                </span>
                                            </div>
                                        </div>

                                        <DivisionStatusIndicator 
                                            status={division.status === 'COMPLETED' ? 'COMPLETED' : division.status === 'ACTIVE' ? 'IN_PROGRESS' : 'PENDING'}
                                            customLabel={division.status === 'COMPLETED' ? 'ETAPA CONCLUÍDA' : division.status === 'ACTIVE' ? 'ETAPA EM ANDAMENTO' : 'ETAPA FUTURA'}
                                            size="sm"
                                        />
                                    </div>

                                    {/* Division Ranking Table */}
                                    <div className="overflow-x-auto">
                                        {players.length === 0 ? (
                                            <div className="py-10 text-center opacity-40 text-stone-400 text-xs font-bold uppercase tracking-widest">
                                                Nenhum participante nesta divisão.
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-[9px] font-black uppercase text-stone-400 tracking-widest bg-stone-950/40">
                                                        <th className="py-3 px-6">POS</th>
                                                        <th className="py-3 px-6">PARTICIPANTE</th>
                                                        <th className="py-3 px-6 text-center">PAÍS</th>
                                                        <th className="py-3 px-6 text-center">V / D</th>
                                                        <th className="py-3 px-6 text-center">TAXA DE VITÓRIA</th>
                                                        <th className="py-3 px-6 text-center">PONTUAÇÃO</th>
                                                        <th className="py-3 px-6 text-right">STATUS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {players.map((p, pIdx) => {
                                                        const isMe = (p.uid || p.playerId) === currentUser?.uid;
                                                        const globalIndex = processedPlayers.findIndex(item => (item.uid || item.playerId) === (p.uid || p.playerId));
                                                        const rankPos = globalIndex !== -1 ? globalIndex + 1 : pIdx + 1;

                                                        return (
                                                            <tr key={`p-row-${p.uid || p.playerId}`} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-amber-500/15 border-l-4 border-amber-400' : ''}`}>
                                                                <td className="py-4 px-6 font-black font-mono text-sm">
                                                                    {rankPos === 1 ? (
                                                                        <span className="text-yellow-400 font-extrabold flex items-center gap-1">🥇 1º</span>
                                                                    ) : rankPos === 2 ? (
                                                                        <span className="text-slate-300 font-extrabold flex items-center gap-1">🥈 2º</span>
                                                                    ) : rankPos === 3 ? (
                                                                        <span className="text-amber-600 font-extrabold flex items-center gap-1">🥉 3º</span>
                                                                    ) : (
                                                                        <span className="text-stone-400">#{rankPos}</span>
                                                                    )}
                                                                </td>

                                                                <td className="py-4 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 overflow-hidden shrink-0 relative">
                                                                            <img 
                                                                                src={p.avatar || p.avatarId || "/Assets/UI/Avatars/profile_avatar_default.png"} 
                                                                                alt={p.name} 
                                                                                className="w-full h-full object-cover" 
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-white text-sm uppercase italic flex items-center gap-2">
                                                                                {p.name} {isMe && <span className="text-[8px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded shadow">VOCÊ</span>}
                                                                            </span>
                                                                            <span className="text-[9px] text-stone-500 font-bold uppercase">
                                                                                {p.title || 'Lenda Saiyajin'} • Nível {p.level || 1}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="py-4 px-6 text-center text-xs font-bold text-stone-300">
                                                                    {p.countryFlag || p.country || '🇧🇷'}
                                                                </td>

                                                                <td className="py-4 px-6 text-center font-mono font-black text-sm">
                                                                    <span className="text-green-400">{p.wins || 0}V</span> / <span className="text-red-400">{p.losses || 0}D</span>
                                                                </td>

                                                                <td className="py-4 px-6 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <span className="font-mono font-black text-xs text-stone-200">
                                                                            {p.winRatePercent}%
                                                                        </span>
                                                                        <div className="w-12 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                                                                            <div 
                                                                                className="h-full bg-gradient-to-r from-amber-500 to-green-400 rounded-full" 
                                                                                style={{ width: `${p.winRatePercent}%` }} 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="py-4 px-6 text-center font-mono font-black text-amber-400 text-sm">
                                                                    {p.points || 0} PTS
                                                                </td>

                                                                <td className="py-4 px-6 text-right font-black text-xs">
                                                                    <DivisionStatusIndicator 
                                                                        status={p.status || p.currentStatus || 'ACTIVE'}
                                                                        size="sm"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
