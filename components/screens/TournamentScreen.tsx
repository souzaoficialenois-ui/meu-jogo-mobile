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
    SubTournamentGroup,
    DivisionTournament,
    DivisionMatch,
    PlayerDivisionProgress
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
    Lock,
    Layers,
    Flag,
    Swords,
    UserCheck,
    Medal,
    Target,
    BarChart3,
    Gift
} from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { auth } from '../../services/firebase';
import { DivisionStatusIndicator } from '../DivisionStatusIndicator';
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

    const [activeTab, setActiveTab] = useState<'DIVISION' | 'OFFICIAL' | 'COMMUNITY' | 'LOCAL'>(activeTournament ? 'LOCAL' : 'DIVISION');
    const [communityTourneys, setCommunityTourneys] = useState<CommunityTournament[]>([]);
    const [officialTourneys, setOfficialTourneys] = useState<OfficialTournament[]>([]);
    const [divisionTourneys, setDivisionTourneys] = useState<DivisionTournament[]>([]);
    
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [currentCommunity, setCurrentCommunity] = useState<CommunityTournament | null>(null);
    const [selectedOfficialId, setSelectedOfficialId] = useState<string | null>(null);
    const [currentOfficial, setCurrentOfficial] = useState<OfficialTournament | null>(null);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [currentDivision, setCurrentDivision] = useState<DivisionTournament | null>(null);
    
    const [divisionSubTab, setDivisionSubTab] = useState<'MY_PANEL' | 'PUBLIC_VIEW'>('MY_PANEL');

    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [admIsDivisionMode, setAdmIsDivisionMode] = useState(true);
    const [admTitle, setAdmTitle] = useState(t('tourney_default_title') || 'TORNEIO DO PODER (DIVISÕES)');
    const [admType, setAdmType] = useState<'WITH_PHASES' | 'WITHOUT_PHASES'>('WITH_PHASES');
    const [admTeamSize, setAdmTeamSize] = useState(3);
    const [admRules, setAdmRules] = useState(t('tourney_default_rules') || 'Batalhas por divisões. Avance eliminando cada oponente.');
    const [admCoins, setAdmCoins] = useState(10000);
    const [admGems, setAdmGems] = useState(300);
    const [admTickets, setAdmTickets] = useState(10);
    const [admSubTime, setAdmSubTime] = useState(5);
    const [admMaxPlayers, setAdmMaxPlayers] = useState(32);
    const [admBanner, setAdmBanner] = useState<'POWER' | 'SAIYANS' | 'GODS' | 'LEGEND'>('POWER');
    const [admRegion, setAdmRegion] = useState('SA - Brasil');
    const [admMatchDuration, setAdmMatchDuration] = useState(180);

    const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);

    useEffect(() => {
        const service = OnlineTournamentService.getInstance();
        const unsubCommunity = service.subscribeToCommunityTournaments(setCommunityTourneys);
        const unsubOfficial = service.subscribeToOfficialTournaments(setOfficialTourneys);
        const unsubDivision = service.subscribeToDivisionTournaments(setDivisionTourneys);
        return () => { unsubCommunity(); unsubOfficial(); unsubDivision(); };
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
        if (!selectedDivisionId) { setCurrentDivision(null); return; }
        return OnlineTournamentService.getInstance().subscribeToSingleDivisionTournament(selectedDivisionId, setCurrentDivision);
    }, [selectedDivisionId]);

    useEffect(() => {
        if (unlockedCharacters && unlockedCharacters.length > 0 && selectedCharIds.length === 0) {
            setSelectedCharIds([unlockedCharacters[0].id]);
        }
    }, [unlockedCharacters, selectedCharIds]);

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        if (selectedCommunityId) setSelectedCommunityId(null);
        else if (selectedOfficialId) setSelectedOfficialId(null);
        else if (selectedDivisionId) setSelectedDivisionId(null);
        else exitTournament();
    };

    const handleJoinDivision = async (tourneyId: string) => {
        if (!playerProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        try {
            await OnlineTournamentService.getInstance().joinDivisionTournament(tourneyId, playerProfile, selectedCharIds);
            setSelectedDivisionId(tourneyId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao entrar no torneio");
        }
    };

    const handleLeaveDivision = async (tourneyId: string) => {
        if (!currentUser) return;
        AudioManager.getInstance().playSFX('cancel');
        try {
            await OnlineTournamentService.getInstance().leaveDivisionTournament(tourneyId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao sair");
        }
    };

    const handleStartDivision = async (tourneyId: string) => {
        if (!isAdmin) return;
        AudioManager.getInstance().playSFX('confirm');
        try {
            await OnlineTournamentService.getInstance().startDivisionTournament(tourneyId);
        } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao iniciar torneio");
        }
    };

    const handlePlayDivisionMatch = (match: DivisionMatch) => {
        if (!currentDivision || !currentUser) return;
        AudioManager.getInstance().playSFX('confirm');
        const isP1 = match.p1Id === currentUser.uid;
        const opponentId = isP1 ? match.p2Id : match.p1Id;
        const opponentDetails = currentDivision.playerDetails[opponentId];
        if (!opponentId || !opponentDetails) return;
        
        const myTeam = selectedCharIds.slice(0, currentDivision.teamSize);
        const playerTeamData = myTeam.map(id => unlockedCharacters.find(c => c.id === id) || BASE_CHARACTERS.find(c => c.id === id)!);
        const opponentTeamData = opponentDetails.team.map(id => BASE_CHARACTERS.find(c => c.id === id)!);

        localStorage.setItem('pending_online_tournament_match', JSON.stringify({
            tourneyId: currentDivision.id,
            matchId: match.id,
            opponentId,
            isDivisionTourney: true,
            playerTeamIds: myTeam,
            rewards: currentDivision.rewards
        }));

        createGameSession(playerTeamData, opponentTeamData, false, 'TOURNAMENT');
        startLoading(SceneName.VS_SCREEN);
    };

    const handleCreateDivisionFromAdmin = async () => {
        if (!isAdmin) return;
        AudioManager.getInstance().playSFX('confirm');
        const rewardsObj = {
            coins: admCoins,
            gems: admGems,
            tickets: admTickets,
            title: "Campeão Fighter Legend",
            badge: "👑 Lenda do Torneio"
        };
        try {
            await OnlineTournamentService.getInstance().createDivisionTournament(
                admTitle,
                "Torneio Oficial por Divisões com progressão em tempo real e classificação geral.",
                admBanner,
                admMaxPlayers,
                admTeamSize,
                admRegion,
                admMatchDuration,
                admRules,
                rewardsObj,
                admSubTime,
                admSubTime + 10,
                playerProfile || { name: 'Admin', avatarId: 'goku_base', numericId: '0001' } as any,
                selectedCharIds
            );
            setShowAdminPanel(false);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Erro ao criar torneio por divisões");
        }
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
            return currentCommunity.matches.find(m => m.status !== 'FINISHED' && (m.p1Id === currentUser.uid || m.p2Id === currentUser.uid));
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
            return currentMatch.p1Id === currentUser.uid ? (currentMatch as any).p2Team : (currentMatch as any).p1Team;
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
                    <div key={`bracket-match-${m.id || i}-${i}`} className="bg-stone-950/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-500 hover:border-orange-500/20">
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
                        {(!selectedCommunityId && !selectedOfficialId && !selectedDivisionId) ? (
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

                                <button onClick={() => { setActiveTab('DIVISION'); setSelectedDivisionId(null); }} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
                                    activeTab === 'DIVISION' 
                                        ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-[0_0_40px_rgba(245,158,11,0.15)]' 
                                        : 'bg-stone-900/40 border-white/5 text-stone-500 hover:text-stone-300 hover:border-white/10'
                                }`}>
                                    <div className="flex items-center gap-5">
                                        <Layers className={`w-6 h-6 transition-transform duration-500 group-hover:scale-110 ${activeTab === 'DIVISION' ? 'text-amber-400' : ''}`} />
                                        <div className="flex flex-col text-left">
                                            <span className={`text-sm uppercase tracking-[0.2em] font-black italic ${activeTab === 'DIVISION' ? 'text-white' : ''}`}>DIVISÕES (NOVO)</span>
                                            <span className="text-[9px] text-amber-500/80 font-black uppercase tracking-widest">SISTEMA POR PROGRESSÃO</span>
                                        </div>
                                    </div>
                                    {activeTab === 'DIVISION' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />}
                                </button>
                                
                                <button onClick={() => { setActiveTab('OFFICIAL'); setSelectedOfficialId(null); }} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
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

                                <button onClick={() => { setActiveTab('COMMUNITY'); setSelectedCommunityId(null); }} className={`w-full group flex items-center justify-between px-8 py-6 rounded-[1.5rem] transition-all duration-500 border ${
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
                                                            {currentMatch.p1Id === currentUser?.uid ? (currentMatch as any).p2Name : (currentMatch as any).p1Name}
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
                        {/* 1. DIVISION TOURNAMENT LIST */}
                        {activeTab === 'DIVISION' && !selectedDivisionId && (
                            <motion.div key="division-list" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-4">
                                {isAdmin && (
                                    <button 
                                        onClick={() => {
                                            setAdmTitle("TORNEIO OFICIAL POR DIVISÕES");
                                            setAdmIsDivisionMode(true);
                                            setShowAdminPanel(true);
                                        }}
                                        className="w-full py-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all group cursor-pointer shadow-xl"
                                    >
                                        <Plus className="text-amber-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-amber-300 font-black uppercase tracking-[0.3em] text-xs italic">CRIAR NOVO TORNEIO POR DIVISÕES (ADM)</span>
                                    </button>
                                )}
                                <PanelCard title="SISTEMA DE TORNEIOS POR DIVISÕES" subtitle="PROGRESSÃO CONTINUA EM TEMPO REAL" icon={Layers}>
                                    <div className="grid gap-4">
                                        {divisionTourneys.length === 0 ? (
                                            <div className="py-20 flex flex-col items-center gap-6 opacity-40 text-center">
                                                <Layers size={64} className="text-amber-500/50 animate-pulse" />
                                                <p className="text-stone-400 font-black uppercase tracking-[0.3em] text-[11px]">Nenhum torneio por divisões ativo no momento.</p>
                                                {isAdmin && <span className="text-xs text-amber-400 font-bold">Use o botão acima para publicar um novo torneio oficial!</span>}
                                            </div>
                                        ) : (
                                            divisionTourneys.map((t, idx) => (
                                                <div 
                                                    key={`div-t-${t.id}-${idx}`}
                                                    onClick={() => setSelectedDivisionId(t.id)}
                                                    className="w-full bg-stone-900/50 hover:bg-stone-800/60 border border-amber-500/20 hover:border-amber-500/50 rounded-[1.8rem] p-7 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 group cursor-pointer active:scale-[0.98] relative overflow-hidden shadow-2xl"
                                                >
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
                                                    
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                                                            <Crown size={32} />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                                                                    {t.region}
                                                                </span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-950/60 px-2.5 py-0.5 rounded border border-white/5">
                                                                    {t.teamSize}v{t.teamSize}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-white font-black text-2xl uppercase tracking-wider italic mt-2 group-hover:text-amber-300 transition-colors">
                                                                {t.title}
                                                            </h4>
                                                            <p className="text-stone-400 text-xs font-semibold line-clamp-1 mt-1 opacity-80">
                                                                {t.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 relative z-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-2">
                                                                <Users size={14} className="text-amber-400" />
                                                                <span className="text-white text-sm font-black font-mono">{t.players.length}/{t.maxPlayers}</span>
                                                            </div>
                                                            <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">PARTICIPANTES</span>
                                                        </div>

                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border flex items-center gap-2 ${
                                                            t.status === 'REGISTRATION'
                                                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                                : t.status === 'ACTIVE'
                                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                                                                : 'bg-stone-800 border-white/10 text-stone-400'
                                                        }`}>
                                                            <div className={`w-2 h-2 rounded-full ${t.status === 'REGISTRATION' ? 'bg-green-400' : 'bg-amber-400'}`} />
                                                            {t.status === 'REGISTRATION' ? 'INSCRIÇÕES ABERTAS' : t.status === 'ACTIVE' ? 'EM ANDAMENTO' : 'ENCERRADO'}
                                                        </div>

                                                        <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center text-stone-400 transition-all">
                                                            <ChevronRight size={24} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </PanelCard>
                            </motion.div>
                        )}

                        {/* 2. DIVISION TOURNAMENT DETAIL VIEW */}
                        {selectedDivisionId && currentDivision && (
                            <motion.div key="division-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Tournament Banner Header */}
                                <div className="bg-gradient-to-r from-amber-950/60 via-stone-900/80 to-stone-950 border border-amber-500/30 rounded-[2rem] p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                                <div className="w-full h-full bg-stone-950 rounded-[0.9rem] flex items-center justify-center text-amber-400">
                                                    <Trophy size={40} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full">
                                                        TORNEIO POR DIVISÕES
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-stone-950/80 text-stone-300 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                                        <Flag size={12} className="text-amber-400" /> {currentDivision.region}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-stone-950/80 text-stone-300 border border-white/10 px-3 py-1 rounded-full">
                                                        {currentDivision.teamSize}v{currentDivision.teamSize}
                                                    </span>
                                                </div>
                                                <h2 className="text-4xl font-black italic uppercase tracking-wider text-white mt-2 drop-shadow-md">
                                                    {currentDivision.title}
                                                </h2>
                                                <p className="text-stone-400 text-xs font-medium mt-1">
                                                    {currentDivision.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Joining / Admin Controls */}
                                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
                                            {currentDivision.status === 'REGISTRATION' && (
                                                currentUser && currentDivision.players.includes(currentUser.uid) ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-6 py-4 bg-green-500/15 border border-green-500/30 text-green-400 font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-2">
                                                            <CheckCircle size={18} /> INSCRITO NO TORNEIO
                                                        </div>
                                                        <button 
                                                            onClick={() => handleLeaveDivision(currentDivision.id)}
                                                            className="px-5 py-4 bg-stone-900/80 hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                                        >
                                                            SAIR
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleJoinDivision(currentDivision.id)}
                                                        className="px-8 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:scale-[1.03] active:scale-95 text-stone-950 font-black uppercase italic tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all flex items-center gap-3"
                                                    >
                                                        <Swords size={20} /> GARANTIR MINHA VAGA
                                                    </button>
                                                )
                                            )}

                                            {isAdmin && currentDivision.status === 'REGISTRATION' && (
                                                <button 
                                                    onClick={() => handleStartDivision(currentDivision.id)}
                                                    className="px-8 py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic tracking-[0.2em] text-sm rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all flex items-center gap-3"
                                                >
                                                    <Play size={20} /> INICIAR DIVISÕES (ADM)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sub-Tabs Selector */}
                                    <div className="flex items-center gap-4 mt-8 border-t border-white/10 pt-6">
                                        <button 
                                            onClick={() => setDivisionSubTab('MY_PANEL')}
                                            className={`px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-3 ${
                                                divisionSubTab === 'MY_PANEL'
                                                    ? 'bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                    : 'bg-stone-900/60 text-stone-400 hover:text-white border border-white/5'
                                            }`}
                                        >
                                            <Target size={18} /> MEU PAINEL DE PROGRESSÃO
                                        </button>
                                        <button 
                                            onClick={() => setDivisionSubTab('PUBLIC_VIEW')}
                                            className={`px-6 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all flex items-center gap-3 ${
                                                divisionSubTab === 'PUBLIC_VIEW'
                                                    ? 'bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                                    : 'bg-stone-900/60 text-stone-400 hover:text-white border border-white/5'
                                            }`}
                                        >
                                            <BarChart3 size={18} /> CLASSIFICAÇÃO GERAL EM TEMPO REAL
                                        </button>
                                    </div>
                                </div>

                                {/* SUB-TAB 1: MEU PAINEL */}
                                {divisionSubTab === 'MY_PANEL' && (
                                    <div className="space-y-6">
                                        {/* Linha de Progressão (Timeline Stepper) */}
                                        <PanelCard title="LINHA DE PROGRESSÃO POR DIVISÕES" subtitle="SUA CAMINHADA NO TORNEIO" icon={Layers}>
                                            <div className="relative py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                                                    {currentDivision.divisions.map((div, idx) => {
                                                        const myProg = currentUser ? currentDivision.playersProgress[currentUser.uid] : null;
                                                        const isCompleted = myProg && myProg.divisionIndex > div.index;
                                                        const isCurrent = myProg && myProg.divisionIndex === div.index && myProg.status === 'ACTIVE';
                                                        const isEliminated = myProg && myProg.divisionIndex === div.index && myProg.status === 'ELIMINATED';
                                                        const isWinner = myProg && myProg.status === 'WINNER' && idx === currentDivision.divisions.length - 1;

                                                        return (
                                                            <div 
                                                                key={`div-step-${div.id}-${idx}`}
                                                                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                                                                    isWinner
                                                                        ? 'bg-gradient-to-b from-amber-500/20 to-yellow-600/30 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                                        : isCurrent
                                                                        ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                                        : isCompleted
                                                                        ? 'bg-green-500/10 border-green-500/30'
                                                                        : isEliminated
                                                                        ? 'bg-red-500/10 border-red-500/30'
                                                                        : 'bg-stone-950/40 border-white/5 opacity-60'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                                                                        FASE {div.index + 1}
                                                                    </span>
                                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                                                        isWinner ? 'bg-amber-400 text-stone-950' :
                                                                        isCurrent ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                                                                        isCompleted ? 'bg-green-500/20 text-green-400' :
                                                                        isEliminated ? 'bg-red-500/20 text-red-400' :
                                                                        'bg-stone-800 text-stone-500'
                                                                    }`}>
                                                                        {isWinner ? <Crown size={16} /> : isCompleted ? <Check size={16} /> : isEliminated ? <X size={16} /> : (idx + 1)}
                                                                    </div>
                                                                </div>

                                                                <h4 className="font-black text-white text-base uppercase italic tracking-wider">
                                                                    {div.title}
                                                                </h4>

                                                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                                                                        STATUS:
                                                                    </span>
                                                                    <DivisionStatusIndicator 
                                                                        status={
                                                                            isWinner ? 'CHAMPION' : 
                                                                            isCurrent ? 'IN_PROGRESS' : 
                                                                            isCompleted ? 'COMPLETED' : 
                                                                            isEliminated ? 'ELIMINATED' : 
                                                                            'PENDING'
                                                                        }
                                                                        customLabel={
                                                                            isWinner ? '🏆 CAMPEÃO' : 
                                                                            isCurrent ? 'EM ANDAMENTO' : 
                                                                            isCompleted ? 'CLASSIFICADO' : 
                                                                            isEliminated ? 'ELIMINADO' : 
                                                                            'BLOQUEADO'
                                                                        }
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </PanelCard>

                                        {/* Card de Próximo Adversário */}
                                        <PanelCard title="PRÓXIMO CONFRONTO NA DIVISÃO" subtitle="INFORMAÇÕES DETALHADAS DO ADVERSÁRIO" icon={Swords}>
                                            {(() => {
                                                const myProg = currentUser ? currentDivision.playersProgress[currentUser.uid] : null;
                                                const myMatch = currentDivision.matches.find(m => m.status !== 'FINISHED' && (m.p1Id === currentUser?.uid || m.p2Id === currentUser?.uid));

                                                if (myMatch && currentUser) {
                                                    const isP1 = myMatch.p1Id === currentUser.uid;
                                                    const oppId = isP1 ? myMatch.p2Id : myMatch.p1Id;
                                                    const oppDetail = currentDivision.playerDetails[oppId];

                                                    return (
                                                        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                                                                {/* Opponent Profile Card */}
                                                                <div className="flex items-center gap-6">
                                                                    <div className="relative">
                                                                        <div className="w-24 h-24 rounded-2xl bg-stone-900 border-2 border-amber-500/50 overflow-hidden shadow-xl">
                                                                            <img 
                                                                                src={oppDetail?.avatar || "/Assets/UI/Avatars/profile_avatar_default.png"} 
                                                                                alt={oppDetail?.name} 
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <span className="absolute -bottom-2 -right-2 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow">
                                                                            {oppDetail?.countryFlag || '🇧🇷'} #{oppDetail?.idNumber || '1042'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex flex-col text-left">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded">
                                                                                {oppDetail?.title || 'Lenda Saiyajin'}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-stone-400 uppercase">
                                                                                Nível {oppDetail?.level || 85}
                                                                            </span>
                                                                        </div>
                                                                        <h3 className="text-3xl font-black italic uppercase text-white tracking-wide mt-1">
                                                                            {oppDetail?.name || 'ADVERSÁRIO'}
                                                                        </h3>
                                                                        
                                                                        <div className="flex items-center gap-4 mt-3 text-xs font-bold text-stone-400">
                                                                            <div>Poder de Equipe: <span className="text-amber-400 font-mono font-black">{oppDetail?.teamPower || '15.400'} AP</span></div>
                                                                            <div>Taxa de Vitória: <span className="text-green-400 font-mono font-black">{oppDetail?.winRate || '78%'}</span></div>
                                                                            <div>Sequência: <span className="text-orange-400 font-mono font-black">{oppDetail?.winStreak || '5x'}</span></div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Match Start Action */}
                                                                <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
                                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                                                                        DIVISÃO {myMatch.divisionIndex + 1}: PRONTO PARA O COMBATE
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handlePlayDivisionMatch(myMatch)}
                                                                        className="w-full lg:w-auto px-10 py-6 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 hover:scale-[1.03] active:scale-95 text-stone-950 font-black uppercase italic tracking-[0.3em] text-lg rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-4 group"
                                                                    >
                                                                        <Play size={24} className="fill-stone-950 group-hover:scale-110 transition-transform" /> ENTRAR NA PARTIDA
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (myProg?.status === 'ELIMINATED') {
                                                    return (
                                                        <div className="py-12 flex flex-col items-center text-center gap-4 bg-red-950/20 border border-red-500/20 rounded-3xl">
                                                            <X size={48} className="text-red-500" />
                                                            <h4 className="text-2xl font-black text-red-400 uppercase italic">VOCÊ FOI ELIMINADO NA DIVISÃO {myProg.divisionIndex + 1}</h4>
                                                            <p className="text-stone-400 text-xs font-semibold max-w-md">Você pode acompanhar a Classificação Geral em Tempo Real e torcer pelos finalistas na aba ao lado!</p>
                                                        </div>
                                                    );
                                                }

                                                if (myProg?.status === 'WINNER') {
                                                    return (
                                                        <div className="py-12 flex flex-col items-center text-center gap-4 bg-gradient-to-b from-amber-500/20 to-yellow-600/30 border border-amber-400 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                                            <Crown size={56} className="text-amber-400 animate-bounce" />
                                                            <h4 className="text-3xl font-black text-amber-300 uppercase italic">PARABÉNS! VOCÊ É O CAMPEÃO DO TORNEIO!</h4>
                                                            <p className="text-amber-200/80 text-xs font-semibold">Suas recompensas exclusivas já foram adicionadas à sua conta.</p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="py-12 flex flex-col items-center text-center gap-4 bg-stone-950/40 border border-white/5 rounded-3xl">
                                                        <Clock size={40} className="text-amber-500 animate-spin-slow" />
                                                        <h4 className="text-xl font-black text-stone-300 uppercase italic">AGUARDANDO CONFRONTO DA DIVISÃO</h4>
                                                        <p className="text-stone-500 text-xs font-semibold max-w-md">O sistema está processando as partidas anteriores da divisão. O próximo adversário será atualizado em breve.</p>
                                                    </div>
                                                );
                                            })()}
                                        </PanelCard>

                                        {/* Premiações do Torneio */}
                                        <PanelCard title="PREMIAÇÕES OFICIAIS" subtitle="RECOMPENSAS DE ALTO NÍVEL" icon={Gift}>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-5 bg-stone-950/60 border border-white/10 rounded-2xl flex items-center gap-4">
                                                    <img src={RESOURCE_SPRITES.curr_coins} alt="Ouro" className="w-10 h-10 object-contain" />
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[10px] font-black text-stone-500 uppercase">OURO</span>
                                                        <span className="text-xl font-black text-yellow-400 font-mono">+{currentDivision.rewards.coins}</span>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-stone-950/60 border border-white/10 rounded-2xl flex items-center gap-4">
                                                    <img src={RESOURCE_SPRITES.curr_gems} alt="Gemas" className="w-10 h-10 object-contain" />
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[10px] font-black text-stone-500 uppercase">DIAMANTES</span>
                                                        <span className="text-xl font-black text-cyan-400 font-mono">+{currentDivision.rewards.gems}</span>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-stone-950/60 border border-white/10 rounded-2xl flex items-center gap-4">
                                                    <Ticket size={32} className="text-purple-400" />
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[10px] font-black text-stone-500 uppercase">TICKETS</span>
                                                        <span className="text-xl font-black text-purple-400 font-mono">+{currentDivision.rewards.tickets}</span>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-stone-950/60 border border-white/10 rounded-2xl flex items-center gap-4">
                                                    <Award size={32} className="text-amber-400" />
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-[10px] font-black text-stone-500 uppercase">TÍTULO/EMBLEMA</span>
                                                        <span className="text-xs font-black text-amber-300 uppercase truncate">{currentDivision.rewards.title || 'CAMPEÃO SUPREMO'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </PanelCard>
                                    </div>
                                )}

                                {/* SUB-TAB 2: CLASSIFICAÇÃO GERAL EM TEMPO REAL */}
                                {divisionSubTab === 'PUBLIC_VIEW' && (
                                    <div className="space-y-6">
                                        <PanelCard title="CLASSIFICAÇÃO GERAL EM TEMPO REAL" subtitle="RANKING COMPLETO DOS PARTICIPANTES" icon={BarChart3}>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-white/10 text-[10px] font-black uppercase text-stone-500 tracking-wider">
                                                            <th className="py-4 px-4"># POS</th>
                                                            <th className="py-4 px-4">JOGADOR</th>
                                                            <th className="py-4 px-4 text-center">DIVISÃO ALCANÇADA</th>
                                                            <th className="py-4 px-4 text-center">V / D</th>
                                                            <th className="py-4 px-4 text-center">PONTOS</th>
                                                            <th className="py-4 px-4 text-right">STATUS</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {Object.values(currentDivision.playersProgress || currentDivision.playerDetails || {})
                                                            .sort((a, b) => (b.divisionIndex ?? 0) - (a.divisionIndex ?? 0) || (b.wins ?? 0) - (a.wins ?? 0) || (b.points ?? 0) - (a.points ?? 0))
                                                            .map((p, idx) => {
                                                                const detail = currentDivision.playerDetails[p.uid || p.playerId] || p;
                                                                const isMe = (p.uid || p.playerId) === currentUser?.uid;
                                                                const rank = idx + 1;

                                                                return (
                                                                    <tr key={`rank-row-${p.uid || p.playerId}-${idx}`} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-amber-500/15 border-l-4 border-amber-400' : ''}`}>
                                                                        <td className="py-4 px-4 font-black font-mono text-sm">
                                                                            {rank === 1 ? (
                                                                                <span className="flex items-center gap-1 text-yellow-400 font-extrabold text-base drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">🥇 1º</span>
                                                                            ) : rank === 2 ? (
                                                                                <span className="flex items-center gap-1 text-slate-300 font-extrabold text-base drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]">🥈 2º</span>
                                                                            ) : rank === 3 ? (
                                                                                <span className="flex items-center gap-1 text-amber-600 font-extrabold text-base drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]">🥉 3º</span>
                                                                            ) : (
                                                                                <span className="text-stone-400">#{rank}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-4 px-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 overflow-hidden shrink-0 relative">
                                                                                    <img src={detail?.avatar || "/Assets/UI/Avatars/profile_avatar_default.png"} alt="" className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-black text-white text-sm uppercase italic flex items-center gap-2">
                                                                                        {detail?.name || 'JOGADOR'} {isMe && <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded shadow">VOCÊ</span>}
                                                                                    </span>
                                                                                    <span className="text-[9px] text-stone-500 font-bold uppercase">
                                                                                        {detail?.countryFlag || '🇧🇷'} #{detail?.idNumber || '1042'} • <span className="text-stone-400">{detail?.title || 'Lenda'}</span>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-4 px-4 text-center">
                                                                            <span className="text-xs font-black uppercase text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm">
                                                                                Divisão {(p.divisionIndex ?? 0) + 1}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-4 px-4 text-center font-mono font-black text-sm">
                                                                            <span className="text-green-400">{p.wins ?? 0}V</span> / <span className="text-red-400">{p.losses ?? 0}D</span>
                                                                        </td>
                                                                        <td className="py-4 px-4 text-center font-mono font-black text-amber-400 text-sm">
                                                                            {p.points ?? 0} PTS
                                                                        </td>
                                                                        <td className="py-4 px-4 text-right font-black text-xs">
                                                                            <DivisionStatusIndicator 
                                                                                status={p.status || 'ACTIVE'}
                                                                                size="sm"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </PanelCard>
                                    </div>
                                )}
                            </motion.div>
                        )}

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
                                            officialTourneys.map((t, idx) => <TournamentCard key={`official-t-${t.id}-${idx}`} type="OFFICIAL" title={t.title} players={t.players.length} maxPlayers={t.maxPlayers} status={t.status} onClick={() => setSelectedOfficialId(t.id)} />)
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
                                            communityTourneys.map((t, idx) => <TournamentCard key={`community-t-${t.id}-${idx}`} type="COMMUNITY" title={t.title} players={t.players.length} maxPlayers={t.maxPlayers} status={t.status} onClick={() => setSelectedCommunityId(t.id)} />)
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
                                                    onClick={() => selectedCommunityId ? handlePlayCommunityMatch(currentMatch as any) : handlePlayOfficialMatch(currentMatch as any, userOfficialGroupIndex)}
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
                                    onClick={handleCreateDivisionFromAdmin} 
                                    className="flex-1 py-6 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-3"
                                >
                                    <Layers size={18} /> PUBLICAR DIVISÕES
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
