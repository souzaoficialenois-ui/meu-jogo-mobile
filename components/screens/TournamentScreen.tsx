import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, TournamentMatch, CharacterData } from '../../types';
import { TournamentManager } from '../../services/TournamentManager';
import { 
    OnlineTournamentService, 
    CommunityTournament, 
    OfficialTournament, 
    OnlineMatch, 
    SubTournamentGroup 
} from '../../services/OnlineTournamentService';
import { BASE_CHARACTERS, RESOURCE_SPRITES } from '../../constants';
import { 
    Trophy, 
    ChevronLeft, 
    Zap, 
    Sparkles, 
    Check, 
    Crown, 
    Users, 
    Plus, 
    Calendar, 
    Clock, 
    Coins, 
    Gem, 
    Ticket, 
    Shield, 
    Play, 
    CheckCircle, 
    X, 
    AlertTriangle,
    Eye,
    ChevronRight,
    Settings,
    Award,
    Lock
} from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { auth } from '../../services/firebase';
import { UIProvider, useUI } from '../../contexts/UIContext';

// A deterministic scoreboard to maintain stability for Local tournaments.
const getDeterministicMatchScore = (match: TournamentMatch) => {
    if (!match.winnerTeam || !match.p1Team || !match.p2Team) {
        return { p1: '-', p2: '-', winner: null };
    }
    const p1Id = match.p1Team[0];
    const p2Id = match.p2Team[0];
    const winnerId = match.winnerTeam[0];
    const isP1Winner = p1Id === winnerId;
    
    const seed = match.id.charCodeAt(match.id.length - 1) + p1Id.charCodeAt(0) + p2Id.charCodeAt(0);
    const score1 = isP1Winner ? 2 : (seed % 2);
    const score2 = isP1Winner ? (seed % 2) : 2;

    return { p1: score1, p2: score2, winner: winnerId };
};

const TournamentContent: React.FC = () => {
    const { s } = useUI();
    const { 
        activeTournament, exitTournament, createGameSession, startLoading, 
        unlockedCharacters, playerProfile, isAdmin, currentUser, t
    } = useSceneManager();

    const [activeTab, setActiveTab] = useState<'LOCAL' | 'COMMUNITY' | 'OFFICIAL'>(activeTournament ? 'LOCAL' : 'OFFICIAL');
    const [communityTourneys, setCommunityTourneys] = useState<CommunityTournament[]>([]);
    const [officialTourneys, setOfficialTourneys] = useState<OfficialTournament[]>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [currentCommunity, setCurrentCommunity] = useState<CommunityTournament | null>(null);
    const [selectedOfficialId, setSelectedOfficialId] = useState<string | null>(null);
    const [currentOfficial, setCurrentOfficial] = useState<OfficialTournament | null>(null);

    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [admTitle, setAdmTitle] = useState(t('tourney_default_title') || 'TORNEIO DO PODER');
    const [admType, setAdmType] = useState<'WITH_PHASES' | 'WITHOUT_PHASES'>('WITH_PHASES');
    const [admTeamSize, setAdmTeamSize] = useState(3);
    const [admRules, setAdmRules] = useState(t('tourney_default_rules') || 'Batalha com equipes de até 3 personagens.');
    const [admCoins, setAdmCoins] = useState(5000);
    const [admGems, setAdmGems] = useState(150);
    const [admTickets, setAdmTickets] = useState(5);
    const [admSubTime, setAdmSubTime] = useState(5);

    const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);

    useEffect(() => {
        const service = OnlineTournamentService.getInstance();
        const unsubCommunity = service.subscribeToCommunityTournaments(setCommunityTourneys);
        const unsubOfficial = service.subscribeToOfficialTournaments(setOfficialTourneys);
        return () => { unsubCommunity(); unsubOfficial(); };
    }, []);

    useEffect(() => {
        if (!selectedCommunityId) { setCurrentCommunity(null); return; }
        return OnlineTournamentService.getInstance().subscribeToSingleCommunityTournament(selectedCommunityId, setCurrentCommunity);
    }, [selectedCommunityId]);

    useEffect(() => {
        if (!selectedOfficialId) { setCurrentOfficial(null); return; }
        return OnlineTournamentService.getInstance().subscribeToSingleOfficialTournament(selectedOfficialId, setCurrentOfficial);
    }, [selectedOfficialId]);

    useEffect(() => {
        if (unlockedCharacters && unlockedCharacters.length > 0 && selectedCharIds.length === 0) {
            setSelectedCharIds([unlockedCharacters[0].id]);
        }
    }, [unlockedCharacters, selectedCharIds]);

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        if (selectedCommunityId) setSelectedCommunityId(null);
        else if (selectedOfficialId) setSelectedOfficialId(null);
        else exitTournament();
    };

    const handleJoinCommunity = async (tourneyId: string) => {
        if (!playerProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        try {
            await OnlineTournamentService.getInstance().joinCommunityTournament(tourneyId, playerProfile, selectedCharIds);
            setSelectedCommunityId(tourneyId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao entrar");
        }
    };

    const handleJoinOfficial = async (tourneyId: string) => {
        if (!playerProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        try {
            await OnlineTournamentService.getInstance().joinOfficialTournament(tourneyId, playerProfile, selectedCharIds);
            setSelectedOfficialId(tourneyId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao participar");
        }
    };

    const handleCreateOfficialFromPlayground = async () => {
        if (!isAdmin) return;
        AudioManager.getInstance().playSFX('confirm');
        const now = Date.now();
        const dates = { phase1: now, phase2: now + (2 * 60 * 1000), phase3: now + (5 * 60 * 1000) };
        const rewardsObj = { coins: admCoins, gems: admGems, tickets: admTickets };
        try {
            await OnlineTournamentService.getInstance().createOfficialTournament(admTitle, admType, admTeamSize, admRules, rewardsObj, admSubTime, dates);
            setShowAdminPanel(false);
        } catch (e) { console.error(e); }
    };

    const handleCreateCommunityFromAdmin = async () => {
        if (!isAdmin || !playerProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        try {
            await OnlineTournamentService.getInstance().createCommunityTournament(admTitle, 16, admTeamSize, playerProfile, selectedCharIds);
            setShowAdminPanel(false);
        } catch (e) { 
            console.error(e);
            alert(e instanceof Error ? e.message : "Erro ao criar");
        }
    };

    const handlePlayCommunityMatch = (match: OnlineMatch) => {
        if (!currentCommunity || !currentUser) return;
        AudioManager.getInstance().playSFX('confirm');
        const isP1 = match.p1Id === currentUser.uid;
        const opponentId = isP1 ? match.p2Id : match.p1Id;
        const opponentTeamIds = isP1 ? match.p2Team : match.p1Team;
        if (!opponentId || !opponentTeamIds) return;
        const myTeam = selectedCharIds.slice(0, currentCommunity.teamSize);
        const playerTeamData = myTeam.map(id => unlockedCharacters.find(c => c.id === id) || BASE_CHARACTERS.find(c => c.id === id)!);
        const opponentTeamData = opponentTeamIds.map(id => BASE_CHARACTERS.find(c => c.id === id)!);
        localStorage.setItem('pending_online_tournament_match', JSON.stringify({
            tourneyId: currentCommunity.id, matchId: match.id, opponentId: opponentId, isOfficial: false, playerTeamIds: myTeam, rewards: { coins: 500, gems: 10 }
        }));
        createGameSession(playerTeamData, opponentTeamData, false, 'TOURNAMENT');
        startLoading(SceneName.VS_SCREEN);
    };

    const handlePlayOfficialMatch = (match: any, groupIndex: number) => {
        if (!currentOfficial || !currentUser) return;
        AudioManager.getInstance().playSFX('confirm');
        const isP1 = match.p1Id === currentUser.uid;
        const opponentId = isP1 ? match.p2Id : match.p1Id;
        const phaseKey = `phase${currentOfficial.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
        const targetGroup = currentOfficial.type === 'WITH_PHASES' ? currentOfficial.phaseGroups?.[phaseKey]?.[groupIndex]! : currentOfficial.singleGroup!;
        const opponentDetail = targetGroup.playerDetails[opponentId];
        if (!opponentDetail) return;
        const myTeam = selectedCharIds.slice(0, currentOfficial.maxCharactersPerPlayer);
        const playerTeamData = myTeam.map(id => unlockedCharacters.find(c => c.id === id) || BASE_CHARACTERS.find(c => c.id === id)!);
        const opponentTeamData = opponentDetail.team.map(id => BASE_CHARACTERS.find(c => c.id === id)!);
        localStorage.setItem('pending_online_tournament_match', JSON.stringify({
            tourneyId: currentOfficial.id, matchId: match.id, opponentId, isOfficial: true, isPhaseMode: currentOfficial.type === 'WITH_PHASES', groupIndex, playerTeamIds: myTeam, rewards: currentOfficial.rewards
        }));
        createGameSession(playerTeamData, opponentTeamData, false, 'TOURNAMENT');
        startLoading(SceneName.VS_SCREEN);
    };

    const PanelCard: React.FC<{ title: string; subtitle?: string; icon: any; children: React.ReactNode; className?: string }> = ({ title, subtitle, icon: Icon, children, className }) => (
        <div className={`bg-stone-900/30 border border-white/5 rounded-[2rem] p-8 backdrop-blur-3xl relative overflow-hidden transition-all duration-500 group ${className}`}>
            {/* Subtle gloss effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px] group-hover:bg-orange-500/10 transition-all duration-700" />
            
            <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-stone-950/50 border border-white/10 flex items-center justify-center text-orange-500 shrink-0 shadow-2xl group-hover:border-orange-500/30 group-hover:shadow-orange-500/10 transition-all duration-500">
                    <Icon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-white font-black text-3xl uppercase tracking-[0.1em] italic leading-none drop-shadow-md">{title}</h3>
                    {subtitle && (
                        <div className="flex items-center gap-3 mt-3">
                            <div className="h-[1px] w-4 bg-orange-500/50" />
                            <p className="text-orange-500/70 text-[10px] font-black uppercase tracking-[0.3em]">{subtitle}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );

    const TournamentCard: React.FC<{ title: string; players: number; maxPlayers: number; status: string; onClick: () => void; type: 'OFFICIAL' | 'COMMUNITY' }> = ({ title, players, maxPlayers, status, onClick, type }) => (
        <button 
            onClick={onClick}
            className="w-full bg-stone-900/40 hover:bg-stone-800/40 border border-white/5 rounded-[1.5rem] p-6 flex items-center justify-between transition-all duration-300 group cursor-pointer active:scale-[0.98] text-left overflow-hidden relative"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-transparent group-hover:from-orange-500/5 transition-all duration-500" />
            
            <div className="flex items-center gap-6 relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    type === 'OFFICIAL' 
                        ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20' 
                        : 'bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500/20'
                }`}>
                    {type === 'OFFICIAL' ? <Trophy size={28} /> : <Users size={28} />}
                </div>
                <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-widest italic group-hover:text-orange-400 transition-colors">{title}</h4>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-stone-950/50 rounded-md border border-white/5">
                            <Users size={12} className="text-stone-500" />
                            <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest">{players}/{maxPlayers}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-2 py-0.5 rounded-md border ${
                            status === 'REGISTRATION' 
                                ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        }`}>
                            <div className={`w-1 h-1 rounded-full ${status === 'REGISTRATION' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {status === 'REGISTRATION' ? 'ABERTO' : 'EM CURSO'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-orange-500 transition-all duration-500 relative z-10">
                <ChevronRight className="text-stone-500 group-hover:text-white transition-colors" size={24} />
            </div>
        </button>
    );

    const currentMatch = useMemo(() => {
        if (selectedCommunityId && currentCommunity && currentUser) {
            return currentCommunity.matches.find(m => !m.isComplete && (m.p1Id === currentUser.uid || m.p2Id === currentUser.uid));
        }
        if (selectedOfficialId && currentOfficial && currentUser) {
            const phaseKey = `phase${currentOfficial.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
            const groups = currentOfficial.type === 'WITH_PHASES' ? currentOfficial.phaseGroups?.[phaseKey] || [] : [currentOfficial.singleGroup].filter(Boolean) as SubTournamentGroup[];
            for (const group of groups) {
                const match = group.matches.find(m => !m.isComplete && (m.p1Id === currentUser.uid || m.p2Id === currentUser.uid));
                if (match) return match;
            }
        }
        return null;
    }, [selectedCommunityId, currentCommunity, selectedOfficialId, currentOfficial, currentUser]);

    const opponentTeamIds = useMemo(() => {
        if (!currentMatch || !currentUser) return null;
        if (selectedCommunityId && currentCommunity) {
            return currentMatch.p1Id === currentUser.uid ? currentMatch.p2Team : currentMatch.p1Team;
        }
        if (selectedOfficialId && currentOfficial) {
            // In official we need to find the opponent from the target group
            const phaseKey = `phase${currentOfficial.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
            const groups = currentOfficial.type === 'WITH_PHASES' ? currentOfficial.phaseGroups?.[phaseKey] || [] : [currentOfficial.singleGroup].filter(Boolean) as SubTournamentGroup[];
            const opponentId = currentMatch.p1Id === currentUser.uid ? currentMatch.p2Id : currentMatch.p1Id;
            for (const group of groups) {
                const detail = group.playerDetails[opponentId];
                if (detail) return detail.team;
            }
        }
        return null;
    }, [currentMatch, currentUser, selectedCommunityId, currentCommunity, selectedOfficialId, currentOfficial]);

    const userOfficialGroup = useMemo(() => {
        if (!currentOfficial || !currentUser) return null;
        const phaseKey = `phase${currentOfficial.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
        const groups = currentOfficial.type === 'WITH_PHASES' ? currentOfficial.phaseGroups?.[phaseKey] || [] : [currentOfficial.singleGroup].filter(Boolean) as SubTournamentGroup[];
        return groups.find(g => g.players.includes(currentUser.uid)) || null;
    }, [currentOfficial, currentUser]);

    const userOfficialGroupIndex = useMemo(() => {
        if (!currentOfficial || !currentUser) return -1;
        const phaseKey = `phase${currentOfficial.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
        const groups = currentOfficial.type === 'WITH_PHASES' ? currentOfficial.phaseGroups?.[phaseKey] || [] : [currentOfficial.singleGroup].filter(Boolean) as SubTournamentGroup[];
        return groups.findIndex(g => g.players.includes(currentUser.uid));
    }, [currentOfficial, currentUser]);

    const OnlineBracket: React.FC<{ matches: OnlineMatch[], players: string[], teamSize: number }> = ({ matches, players, teamSize }) => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {matches.map((m, i) => (
                    <div key={`bracket-match-${m.id || i}`} className="bg-stone-950/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 hover:border-orange-500/20">
                        <div className="absolute top-0 left-0 w-[2px] h-0 bg-orange-500 group-hover:h-full transition-all duration-700" />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex flex-col gap-3 flex-1">
                                <span className="text-[9px] text-stone-600 font-black uppercase tracking-[0.4em] mb-1">ARENA MATCH #{i+1}</span>
                                
                                <div className="flex items-center justify-between bg-stone-900/30 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${m.winnerId === m.p1Id ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]' : 'bg-stone-800'}`} />
                                        <span className={`text-sm font-black italic uppercase tracking-wider ${m.winnerId === m.p1Id ? 'text-white' : 'text-stone-500'}`}>{m.p1Name}</span>
                                    </div>
                                    <span className="text-sm font-black font-mono text-stone-400">{m.score1}</span>
                                </div>

                                <div className="flex items-center justify-between bg-stone-900/30 p-3 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${m.winnerId === m.p2Id ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]' : 'bg-stone-800'}`} />
                                        <span className={`text-sm font-black italic uppercase tracking-wider ${m.winnerId === m.p2Id ? 'text-white' : 'text-stone-500'}`}>{m.p2Name}</span>
                                    </div>
                                    <span className="text-sm font-black font-mono text-stone-400">{m.score2}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-4 ml-6">
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest border transition-all duration-500 ${
                                    m.status === 'FINISHED' 
                                        ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                                        : 'bg-orange-500/10 border-orange-500/20 text-orange-500 animate-pulse'
                                }`}>
                                    {m.status === 'FINISHED' ? 'COMPLETO' : 'EM AGUARDO'}
                                </div>
                                {m.winnerId && <Crown size={20} className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                            </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200 animate-fade-in">
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-stone-950/60" />
                
                {/* Cinematic character sprites */}
                <div className="absolute right-[-8%] top-[5%] opacity-40 scale-[1.5] blur-[1px]">
                    <img src="/Assets/personagens/gokumui/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
                <div className="absolute left-[-5%] bottom-[-5%] opacity-35 scale-[1.2] blur-[1px] grayscale">
                    <img src="/Assets/personagens/jiren/parado.gif" className="h-[75vh] w-auto object-contain" alt="" />
                </div>

                {/* Energy flares */}
                <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] bg-orange-600/10 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            <motion.header initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="h-24 px-10 flex items-center justify-between relative z-50 shrink-0 bg-stone-950/40 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-8">
                    <button onClick={handleBack} className="w-16 h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl group transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-sm">
                        <ChevronLeft className="w-8 h-8 text-stone-300 group-hover:text-white" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-orange-500/80 font-black tracking-[0.2em] uppercase font-mono text-[9px]">{t('tourney_ops_room') || 'SALA DE OPERAÇÕES'}</span>
                        <h2 className="text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                            {selectedCommunityId || selectedOfficialId ? (currentCommunity?.title || currentOfficial?.title || t('tourney_label') || 'TORNEIO') : (t('tourney_hall') || 'SALA DE TORNEIOS')}
                        </h2>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">SESSÃO ATIVA</span>
                    <span className="text-sm font-black text-orange-500 uppercase italic tracking-widest mt-1 drop-shadow-lg">{currentUser?.email || 'CONVIDADO'}</span>
                </div>
            </motion.header>

            <main className="flex-1 w-full flex overflow-hidden relative z-10 p-10 gap-10">
                {/* LEFT SIDEBAR: CATEGORIES OR OPPONENT */}
                <div className="flex flex-col gap-6 shrink-0 w-96 z-20">
                    <AnimatePresence mode="wait">
                        {(!selectedCommunityId && !selectedOfficialId) ? (
                            <motion.div 
                                key="categories"
                                initial={{ opacity: 0, x: -30 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -30 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-4 mb-6 pl-2">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] opacity-70 whitespace-nowrap">SELECIONAR ARENA</span>
                                </div>
                                
                                <button onClick={() => setActiveTab('OFFICIAL')} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
                                    activeTab === 'OFFICIAL' 
                                        ? 'bg-orange-500/10 border-orange-500/30 text-white shadow-[0_0_40px_rgba(249,115,22,0.1)]' 
                                        : 'bg-stone-900/40 border-white/5 text-stone-500 hover:text-stone-300 hover:border-white/10'
                                }`}>
                                    <div className="flex items-center gap-5">
                                        <Trophy className={`w-6 h-6 transition-transform duration-500 group-hover:scale-110 ${activeTab === 'OFFICIAL' ? 'text-orange-500' : ''}`} />
                                        <span className={`text-sm uppercase tracking-[0.2em] font-black italic ${activeTab === 'OFFICIAL' ? 'text-white' : ''}`}>{t('tourney_tab_official') || 'EVENTOS OFICIAIS'}</span>
                                    </div>
                                    {activeTab === 'OFFICIAL' && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]" />}
                                </button>

                                <button onClick={() => setActiveTab('COMMUNITY')} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
                                    activeTab === 'COMMUNITY' 
                                        ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_40px_rgba(6,182,212,0.1)]' 
                                        : 'bg-stone-900/40 border-white/5 text-stone-500 hover:text-stone-300 hover:border-white/10'
                                }`}>
                                    <div className="flex items-center gap-5">
                                        <Users className={`w-6 h-6 transition-transform duration-500 group-hover:scale-110 ${activeTab === 'COMMUNITY' ? 'text-cyan-500' : ''}`} />
                                        <span className={`text-sm uppercase tracking-[0.2em] font-black italic ${activeTab === 'COMMUNITY' ? 'text-white' : ''}`}>{t('tourney_tab_community') || 'COMUNIDADE'}</span>
                                    </div>
                                    {activeTab === 'COMMUNITY' && <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />}
                                </button>

                                {activeTournament && (
                                    <button onClick={() => setActiveTab('LOCAL')} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
                                        activeTab === 'LOCAL' 
                                            ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                                            : 'bg-stone-900/40 border-white/5 text-stone-500 hover:text-stone-300'
                                    }`}>
                                        <div className="flex items-center gap-5">
                                            <Zap className={`w-6 h-6 ${activeTab === 'LOCAL' ? 'text-amber-500' : ''}`} />
                                            <span className="text-sm uppercase tracking-[0.2em] font-black italic">{t('tourney_tab_local') || 'TORNEIO LOCAL'}</span>
                                        </div>
                                    </button>
                                )}

                                {isAdmin && (
                                    <button 
                                        onClick={() => setShowAdminPanel(true)} 
                                        className="mt-12 w-full px-8 py-6 bg-stone-950/60 hover:bg-red-500/10 text-stone-500 hover:text-red-500 border border-white/5 hover:border-red-500/20 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-500 group cursor-pointer group shadow-2xl"
                                    >
                                        <Settings size={18} className="transition-transform duration-700 group-hover:rotate-180" /> 
                                        <span className="text-[11px] font-black tracking-[0.4em] uppercase">CONSELHO ADM</span>
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="opponent"
                                initial={{ opacity: 0, x: -30 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -30 }}
                            >
                                <PanelCard title={t('tourney_opponent_label') || "OPONENTE"} subtitle={t('tourney_realtime_team') || "TIME EM TEMPO REAL"} icon={Shield}>
                                    <div className="flex flex-col gap-6">
                                        {currentMatch ? (
                                            <>
                                                <div className="p-6 bg-stone-950/50 border border-white/10 rounded-2xl flex items-center gap-6 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 font-black italic shadow-[0_0_30px_rgba(239,68,68,0.2)] relative z-10">VS</div>
                                                    <div className="relative z-10 flex-1 min-w-0">
                                                        <h4 className="text-white font-black text-lg uppercase tracking-widest truncate italic">
                                                            {currentMatch.p1Id === currentUser?.uid ? currentMatch.p2Name : currentMatch.p1Name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest opacity-70">{t('tourney_ready_label') || 'PRONTO'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {opponentTeamIds?.map((charId, idx) => {
                                                        const char = BASE_CHARACTERS.find(c => c.id === charId);
                                                        return (
                                                            <div key={`opp-char-${charId}-${idx}`} className="aspect-square bg-stone-950/80 border border-white/10 rounded-2xl overflow-hidden relative group shadow-2xl transition-all duration-500 hover:border-red-500/30">
                                                                {char ? (
                                                                    <img src={char.spriteConfig?.portraitUrl} alt={char.name} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-stone-800 font-black text-2xl">?</div>
                                                                )}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center gap-6 text-stone-700">
                                                <div className="relative">
                                                    <Clock className="w-16 h-16 animate-spin-slow opacity-20" />
                                                    <div className="absolute inset-0 bg-orange-500/5 blur-3xl animate-pulse" />
                                                </div>
                                                <span className="font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Aguardando chaveamento...</span>
                                            </div>
                                        )}
                                    </div>
                                </PanelCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar pr-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'OFFICIAL' && !selectedOfficialId && (
                            <motion.div key="official-list" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                <PanelCard title="EVENTOS OFICIAIS" subtitle="BATALHAS DO SERVIDOR" icon={Trophy}>
                                    <div className="grid gap-3">
                                        {officialTourneys.length === 0 ? (
                                            <div className="py-20 flex flex-col items-center gap-6 opacity-30">
                                                <Trophy size={64} className="text-stone-800" />
                                                <p className="text-stone-500 font-black uppercase tracking-[0.3em] text-[10px]">Aguardando novos eventos...</p>
                                            </div>
                                        ) : (
                                            officialTourneys.map(t => <TournamentCard key={t.id} type="OFFICIAL" title={t.title} players={t.players.length} maxPlayers={t.maxPlayers} status={t.status} onClick={() => setSelectedOfficialId(t.id)} />)
                                        )}
                                    </div>
                                </PanelCard>
                            </motion.div>
                        )}
                        {activeTab === 'COMMUNITY' && !selectedCommunityId && (
                            <motion.div key="community-list" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-4">
                                {isAdmin && (
                                    <button 
                                        onClick={() => {
                                            setAdmTitle("TORNEIO DA COMUNIDADE");
                                            setShowAdminPanel(true);
                                        }}
                                        className="w-full py-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all group cursor-pointer"
                                    >
                                        <Plus className="text-cyan-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-cyan-500 font-black uppercase tracking-[0.3em] text-xs italic">CRIAR ARENA COMUNITÁRIA</span>
                                    </button>
                                )}
                                <PanelCard title="ARENAS DA COMUNIDADE" subtitle="BATALHAS PERSONALIZADAS" icon={Users}>
                                    <div className="grid gap-4">
                                        {communityTourneys.length === 0 ? (
                                            <div className="py-20 flex flex-col items-center gap-6 opacity-30">
                                                <Users size={64} className="text-stone-800" />
                                                <p className="text-stone-500 font-black uppercase tracking-[0.3em] text-[10px]">Aguardando novas arenas...</p>
                                            </div>
                                        ) : (
                                            communityTourneys.map(t => <TournamentCard key={t.id} type="COMMUNITY" title={t.title} players={t.players.length} maxPlayers={t.maxPlayers} status={t.status} onClick={() => setSelectedCommunityId(t.id)} />)
                                        )}
                                    </div>
                                </PanelCard>
                            </motion.div>
                        )}
                        {(selectedCommunityId || selectedOfficialId) && (
                            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <PanelCard title="DISTRIBUIÇÃO E CHAVES" subtitle="ESTADO DA ARENA" icon={Award}>
                                    <div className="flex flex-col gap-8">
                                        {/* Visual Distribution Part */}
                                        <div className="bg-black/40 border border-white/5 rounded-3xl p-6 min-h-[300px]">
                                            {selectedCommunityId && currentCommunity && (
                                                <OnlineBracket matches={currentCommunity.matches} players={currentCommunity.players} teamSize={currentCommunity.teamSize} />
                                            )}
                                            {selectedOfficialId && currentOfficial && (
                                                <div className="flex flex-col gap-8">
                                                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em]">STATUS DA ETAPA</span>
                                                            <h3 className="text-3xl font-black italic text-white uppercase mt-2 tracking-tighter">
                                                                {currentOfficial.type === 'WITH_PHASES' ? `FASE ${currentOfficial.currentPhase}` : 'GRUPO ÚNICO'}
                                                            </h3>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.4em]">MEU GRUPO</span>
                                                            <span className="text-xl font-black italic text-white uppercase mt-2">{userOfficialGroup?.name || '---'}</span>
                                                        </div>
                                                    </div>

                                                    {userOfficialGroup ? (
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            {userOfficialGroup.matches.map((m, idx) => {
                                                                const p1 = userOfficialGroup.playerDetails[m.p1Id];
                                                                const p2 = userOfficialGroup.playerDetails[m.p2Id];
                                                                return (
                                                                    <div key={`group-match-${m.id || idx}`} className="bg-stone-950/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 hover:border-orange-500/20">
                                                                        <div className="absolute top-0 left-0 w-[2px] h-0 bg-orange-500 group-hover:h-full transition-all duration-700" />
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex flex-col gap-3 flex-1">
                                                                                <div className="flex items-center justify-between bg-stone-900/30 p-3 rounded-xl border border-white/5">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-2 h-2 rounded-full ${m.winnerId === m.p1Id ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]' : 'bg-stone-800'}`} />
                                                                                        <span className={`text-sm font-black italic uppercase tracking-wider ${m.winnerId === m.p1Id ? 'text-white' : 'text-stone-500'}`}>{p1?.name || 'TBD'}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center justify-between bg-stone-900/30 p-3 rounded-xl border border-white/5">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className={`w-2 h-2 rounded-full ${m.winnerId === m.p2Id ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)]' : 'bg-stone-800'}`} />
                                                                                        <span className={`text-sm font-black italic uppercase tracking-wider ${m.winnerId === m.p2Id ? 'text-white' : 'text-stone-500'}`}>{p2?.name || 'TBD'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-col items-end gap-2 ml-6">
                                                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest border ${m.isComplete ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500 animate-pulse'}`}>
                                                                                    {m.isComplete ? 'FIM' : 'READY'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-20 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-white/10 rounded-3xl">
                                                            <div className="w-16 h-16 bg-stone-900/50 rounded-full flex items-center justify-center text-stone-700">
                                                                <Lock size={32} />
                                                            </div>
                                                            <p className="text-stone-500 font-black uppercase tracking-[0.3em] text-[10px]">Aguardando início oficial do evento...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            {currentMatch ? (
                                                <button 
                                                    onClick={() => selectedCommunityId ? handlePlayCommunityMatch(currentMatch) : handlePlayOfficialMatch(currentMatch, userOfficialGroupIndex)}
                                                    className="flex-1 py-8 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-black uppercase italic tracking-[0.3em] rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 bg-[url('/Assets/efeitos/flare.png')] opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                                        <Play size={24} /> ENTRAR NA ARENA
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="flex-1 py-8 bg-stone-900/60 border border-white/5 rounded-3xl flex items-center justify-center gap-6">
                                                    <div className="relative">
                                                        <Clock className="w-8 h-8 text-orange-500 animate-spin-slow" />
                                                        <div className="absolute inset-0 bg-orange-500/20 blur-xl animate-pulse" />
                                                    </div>
                                                    <span className="text-stone-500 font-black uppercase tracking-[0.3em] italic text-sm">AGUARDANDO PRÓXIMA RODADA...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </PanelCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {showAdminPanel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/90 backdrop-blur-xl">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <PanelCard title="CONSELHO ADMINISTRATIVO" subtitle="GERENCIAMENTO DE ARENAS" icon={Settings}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">TÍTULO DA ARENA</label>
                                        <input 
                                            value={admTitle} 
                                            onChange={e => setAdmTitle(e.target.value)} 
                                            className="w-full bg-stone-950/50 border border-white/10 p-6 rounded-[1.2rem] text-white font-black uppercase tracking-widest focus:border-orange-500/50 outline-none transition-all placeholder:text-stone-800" 
                                            placeholder="EX: TORNEIO DOS DEUSES"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">TIPO DE EVENTO</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setAdmType('WITH_PHASES')}
                                                className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${admType === 'WITH_PHASES' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-stone-900/40 text-stone-500 border-white/5 hover:border-white/10'}`}
                                            >
                                                COM FASES
                                            </button>
                                            <button 
                                                onClick={() => setAdmType('WITHOUT_PHASES')}
                                                className={`py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${admType === 'WITHOUT_PHASES' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-stone-900/40 text-stone-500 border-white/5 hover:border-white/10'}`}
                                            >
                                                LIGA ÚNICA
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">MOEDAS</label>
                                        <input type="number" value={admCoins} onChange={e => setAdmCoins(Number(e.target.value))} className="w-full bg-stone-950/50 border border-white/10 p-6 rounded-[1.2rem] text-white font-black focus:border-orange-500/50 outline-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">GEMAS</label>
                                        <input type="number" value={admGems} onChange={e => setAdmGems(Number(e.target.value))} className="w-full bg-stone-950/50 border border-white/10 p-6 rounded-[1.2rem] text-white font-black focus:border-orange-500/50 outline-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">TIME (TAM.)</label>
                                        <input type="number" min={1} max={5} value={admTeamSize} onChange={e => setAdmTeamSize(Number(e.target.value))} className="w-full bg-stone-950/50 border border-white/10 p-6 rounded-[1.2rem] text-white font-black focus:border-orange-500/50 outline-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] ml-2">TEMPO (MIN)</label>
                                        <input type="number" value={admSubTime} onChange={e => setAdmSubTime(Number(e.target.value))} className="w-full bg-stone-950/50 border border-white/10 p-6 rounded-[1.2rem] text-white font-black focus:border-orange-500/50 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-12 border-t border-white/5 pt-10">
                                <button 
                                    onClick={() => setShowAdminPanel(false)} 
                                    className="flex-1 py-6 bg-stone-900 hover:bg-stone-800 text-stone-500 font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95"
                                >
                                    FECHAR
                                </button>
                                <button 
                                    onClick={handleCreateCommunityFromAdmin} 
                                    className="flex-1 py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex items-center justify-center gap-3"
                                >
                                    <Users size={18} /> PUBLICAR COMUNIDADE
                                </button>
                                <button 
                                    onClick={handleCreateOfficialFromPlayground} 
                                    className="flex-1 py-6 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3"
                                >
                                    <Trophy size={18} /> PUBLICAR OFICIAL
                                </button>
                            </div>
                        </PanelCard>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export const TournamentScreen: React.FC = () => {
    return (
        <UIProvider>
            <TournamentContent />
        </UIProvider>
    );
};
