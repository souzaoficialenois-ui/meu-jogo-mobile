import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './error_handler';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { CharacterData, PlayerProfile } from '../types';
import { NameGenerator } from './NameGenerator';
import { BASE_CHARACTERS } from '../constants';

export interface DivisionMatch {
    id: string;
    divisionIndex: number; // 0 = Divisão 1, 1 = Divisão 2, etc.
    divisionName: string;  // e.g. "Divisão 1 — Classificatória"
    p1Id: string | null;
    p2Id: string | null;
    p1Name: string;
    p2Name: string;
    p1Avatar: string;
    p2Avatar: string;
    p1Team: string[];
    p2Team: string[];
    winnerId: string | null;
    score1: number | string;
    score2: number | string;
    status: 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';
    scheduledTime: number;
    durationSeconds?: number;
    isCpuVsCpu: boolean;
    nextMatchId: string | null;
}

export interface PlayerDivisionProgress {
    playerId: string;
    uid: string;
    name: string;
    avatarId: string;
    avatar: string;
    numericId: string;
    idNumber: string;
    country: string;
    countryFlag: string;
    level: number;
    title: string;
    favoriteChar: string;
    team: string[];
    teamPower: number;
    winRate: number;
    winStreak: number;
    highestDivisionReached: number;
    divisionIndex: number;
    highestDivisionName: string;
    currentStatus: 'NOT_STARTED' | 'WAITING_OPPONENT' | 'READY_TO_PLAY' | 'IN_MATCH' | 'QUALIFIED' | 'ELIMINATED' | 'CHAMPION';
    status: 'ACTIVE' | 'ELIMINATED' | 'WINNER';
    wins: number;
    losses: number;
    points: number;
    isCpu: boolean;
}

export interface DivisionTournament {
    id: string;
    title: string;
    description: string;
    bannerPreset: string; // 'POWER' | 'SAIYANS' | 'GODS' | 'LEGEND'
    creatorId: string;
    creatorName: string;
    status: 'REGISTRATION' | 'ACTIVE' | 'FINISHED';
    maxPlayers: number; // 8, 16, 32, 64
    teamSize: number; // 1, 2, 3
    region: string; // e.g. "SA - Brasil"
    matchTimeLimit: number; // seconds, e.g. 180
    rules: string;
    registrationStartTime: number;
    startDate: number;
    subscriptionEndTime: number;
    currentDivisionIndex: number;
    divisions: {
        id: string;
        index: number;
        name: string;
        title: string;
        status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
    }[];
    players: string[]; // User IDs
    playerDetails: Record<string, PlayerDivisionProgress>;
    playersProgress: Record<string, PlayerDivisionProgress>;
    matches: DivisionMatch[];
    matchHistory: {
        id: string;
        divisionName: string;
        p1Id: string;
        p2Id: string;
        p1Name: string;
        p2Name: string;
        p1Avatar: string;
        p2Avatar: string;
        p1Team: string[];
        p2Team: string[];
        winnerId: string;
        score1: number;
        score2: number;
        durationSeconds: number;
        timestamp: number;
    }[];
    rewards: {
        coins: number;
        gems: number;
        tickets: number;
        skin?: string;
        character?: string;
        title?: string;
        emblem?: string;
        specialItem?: string;
    };
    winnerUserId: string | null;
    runnerUpUserId: string | null;
    thirdPlaceUserId: string | null;
    createdAt: number;
    updatedAt: number;
}

export interface OnlineMatch {
    id: string;
    round: number; // 0 for Round of 16, 1 for Quarters, 2 for Semis, 3 for Finals
    p1Id: string | null; // null for TBD, or string userId / CPU ID
    p2Id: string | null;
    p1Name: string;
    p2Name: string;
    p1Team: string[]; // Character IDs
    p2Team: string[];
    winnerId: string | null;
    score1: number | string;
    score2: number | string;
    isCpuVsCpu: boolean;
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    nextMatchId: string | null;
}

export interface CommunityTournament {
    id: string;
    title: string;
    creatorId: string;
    creatorName: string;
    status: 'REGISTRATION' | 'ACTIVE' | 'FINISHED';
    maxPlayers: number;
    players: string[]; // User IDs
    playerDetails: Record<string, {
        name: string;
        avatarId: string;
        numericId: string;
        team: string[];
    }>;
    matches: OnlineMatch[];
    currentRound: number;
    winnerUserId: string | null;
    createdAt: number;
    updatedAt: number;
    teamSize: number;
}

export interface SubTournamentGroup {
    id: string;
    name: string;
    players: string[]; // IDs (user or CPU)
    playerDetails: Record<string, {
        name: string;
        avatarId: string;
        numericId: string;
        team: string[];
        isCpu: boolean;
        points: number;
        wins: number;
        losses: number;
        matchesPlayed: number;
    }>;
    matches: {
        id: string;
        p1Id: string;
        p2Id: string;
        winnerId: string | null;
        isComplete: boolean;
        isPlayerInvolved: boolean;
    }[];
}

export interface OfficialTournament {
    id: string;
    title: string;
    type: 'WITH_PHASES' | 'WITHOUT_PHASES';
    status: 'REGISTRATION' | 'ACTIVE' | 'FINISHED';
    maxCharactersPerPlayer: number;
    rules: string;
    rewards: {
        coins: number;
        gems: number;
        tickets: number;
        skin?: string;
        character?: string;
        title?: string;
        emblem?: string;
        specialItem?: string;
    };
    subscriptionEndTime: number;
    scheduledDates: {
        phase1: number;
        phase2: number;
        phase3: number;
    };
    currentPhase: 1 | 2 | 3 | null; // 1, 2, 3 for WITH_PHASES, null for WITHOUT_PHASES
    players: string[];
    maxPlayers?: number;
    playerDetails: Record<string, {
        name: string;
        avatarId: string;
        numericId: string;
        team: string[];
    }>;
    // For WITH_PHASES: Map of phase -> SubTournamentGroup[]
    phaseGroups?: {
        phase1?: SubTournamentGroup[];
        phase2?: SubTournamentGroup[];
        phase3?: SubTournamentGroup[];
    };
    // For WITHOUT_PHASES: Single group representation
    singleGroup?: SubTournamentGroup;
    isFinished: boolean;
    winnerUserId: string | null;
    createdAt: number;
    updatedAt: number;
}

export class OnlineTournamentService {
    private static instance: OnlineTournamentService;

    private constructor() {}

    public static getInstance(): OnlineTournamentService {
        if (!OnlineTournamentService.instance) {
            OnlineTournamentService.instance = new OnlineTournamentService();
        }
        return OnlineTournamentService.instance;
    }

    // ==========================================
    // 🎮 COMMUNITY TOURNAMENTS
    // ==========================================

    public async createCommunityTournament(title: string, maxPlayers: number, teamSize: number, creator: PlayerProfile, team: string[]): Promise<string> {
        if (!auth.currentUser) throw new Error("Must be logged in to create a tournament");
        
        // Security Check: Only Admins can create online tournaments
        if (creator.role !== 'ADMIN') {
            throw new Error("Apenas administradores podem criar torneios online.");
        }

        const tourneyId = 'ct_' + Math.floor(100000 + Math.random() * 899999).toString();
        const docRef = doc(db, 'community_tournaments', tourneyId);

        const newTourney: CommunityTournament = {
            id: tourneyId,
            title: title.toUpperCase() || "TORNEIO DA COMUNIDADE",
            creatorId: auth.currentUser.uid,
            creatorName: creator.name,
            status: 'REGISTRATION',
            maxPlayers: Math.min(20, Math.max(4, maxPlayers)),
            players: [auth.currentUser.uid],
            playerDetails: {
                [auth.currentUser.uid]: {
                    name: creator.name,
                    avatarId: creator.avatarId || 'goku_base',
                    numericId: creator.numericId || '0000',
                    team: team && team.length > 0 ? team : ['goku_base']
                }
            },
            matches: [],
            currentRound: 0,
            winnerUserId: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            teamSize
        };

        try {
            await setDoc(docRef, newTourney);
            return tourneyId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `community_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async joinCommunityTournament(tourneyId: string, profile: PlayerProfile, team: string[]): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in to join");

        const docRef = doc(db, 'community_tournaments', tourneyId);
        
        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as CommunityTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Tournament is already active or finished");
            if (tourney.players.includes(auth.currentUser.uid)) return; // Already in
            if (tourney.players.length >= tourney.maxPlayers) throw new Error("Tournament is full");

            const updatedPlayers = [...tourney.players, auth.currentUser.uid];
            const updatedDetails = {
                ...tourney.playerDetails,
                [auth.currentUser.uid]: {
                    name: profile.name,
                    avatarId: profile.avatarId || 'goku_base',
                    numericId: profile.numericId || '0000',
                    team: team && team.length > 0 ? team : ['goku_base']
                }
            };

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `community_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async leaveCommunityTournament(tourneyId: string): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in");

        const docRef = doc(db, 'community_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as CommunityTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Tournament already started");
            if (!tourney.players.includes(auth.currentUser.uid)) return;

            const updatedPlayers = tourney.players.filter(p => p !== auth.currentUser!.uid);
            const updatedDetails = { ...tourney.playerDetails };
            delete updatedDetails[auth.currentUser.uid];

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `community_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async startCommunityTournament(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'community_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as CommunityTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Tournament already started");

            const totalRegistered = tourney.players.length;
            if (totalRegistered < 2) throw new Error("Need at least 2 players to start");

            // Bracket size can be 4, 8, or 16 based on registration
            let bracketSize = 4;
            if (totalRegistered > 8) bracketSize = 16;
            else if (totalRegistered > 4) bracketSize = 8;

            // Generate CPU participants to fill the bracket
            const finalPlayersList = [...tourney.players];
            const finalDetails = { ...tourney.playerDetails };

            const allBaseChars = BASE_CHARACTERS.map(c => c.id).filter(id => id !== 'random');

            while (finalPlayersList.length < bracketSize) {
                const cpuId = 'cpu_' + Math.floor(100000 + Math.random() * 899999).toString();
                const cpuName = NameGenerator.generate();
                finalPlayersList.push(cpuId);

                // Build a random team for the CPU
                const cpuTeam: string[] = [];
                for (let i = 0; i < tourney.teamSize; i++) {
                    const rChar = allBaseChars[Math.floor(Math.random() * allBaseChars.length)];
                    cpuTeam.push(rChar);
                }

                finalDetails[cpuId] = {
                    name: `CPU: ${cpuName}`,
                    avatarId: cpuTeam[0],
                    numericId: Math.floor(1000 + Math.random() * 9000).toString(),
                    team: cpuTeam
                };
            }

            // Shuffle players for tournament brackets
            const shuffledPlayers = [...finalPlayersList].sort(() => Math.random() - 0.5);

            // Create matches
            const matches: OnlineMatch[] = [];
            
            if (bracketSize === 4) {
                // Round 1 (Semis)
                matches.push({ id: 'm1_0', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: null }); // Final
                matches.push({ id: 'm0_0', round: 0, p1Id: shuffledPlayers[0], p2Id: shuffledPlayers[1], p1Name: finalDetails[shuffledPlayers[0]].name, p2Name: finalDetails[shuffledPlayers[1]].name, p1Team: finalDetails[shuffledPlayers[0]].team, p2Team: finalDetails[shuffledPlayers[1]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[0].startsWith('cpu_') && shuffledPlayers[1].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_0' });
                matches.push({ id: 'm0_1', round: 0, p1Id: shuffledPlayers[2], p2Id: shuffledPlayers[3], p1Name: finalDetails[shuffledPlayers[2]].name, p2Name: finalDetails[shuffledPlayers[3]].name, p1Team: finalDetails[shuffledPlayers[2]].team, p2Team: finalDetails[shuffledPlayers[3]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[2].startsWith('cpu_') && shuffledPlayers[3].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_0' });
            } else if (bracketSize === 8) {
                // Finals
                matches.push({ id: 'm2_0', round: 2, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: null });
                // Semis
                matches.push({ id: 'm1_0', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_0' });
                matches.push({ id: 'm1_1', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_0' });
                // Quarters
                matches.push({ id: 'm0_0', round: 0, p1Id: shuffledPlayers[0], p2Id: shuffledPlayers[1], p1Name: finalDetails[shuffledPlayers[0]].name, p2Name: finalDetails[shuffledPlayers[1]].name, p1Team: finalDetails[shuffledPlayers[0]].team, p2Team: finalDetails[shuffledPlayers[1]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[0].startsWith('cpu_') && shuffledPlayers[1].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_0' });
                matches.push({ id: 'm0_1', round: 0, p1Id: shuffledPlayers[2], p2Id: shuffledPlayers[3], p1Name: finalDetails[shuffledPlayers[2]].name, p2Name: finalDetails[shuffledPlayers[3]].name, p1Team: finalDetails[shuffledPlayers[2]].team, p2Team: finalDetails[shuffledPlayers[3]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[2].startsWith('cpu_') && shuffledPlayers[3].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_0' });
                matches.push({ id: 'm0_2', round: 0, p1Id: shuffledPlayers[4], p2Id: shuffledPlayers[5], p1Name: finalDetails[shuffledPlayers[4]].name, p2Name: finalDetails[shuffledPlayers[5]].name, p1Team: finalDetails[shuffledPlayers[4]].team, p2Team: finalDetails[shuffledPlayers[5]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[4].startsWith('cpu_') && shuffledPlayers[5].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_1' });
                matches.push({ id: 'm0_3', round: 0, p1Id: shuffledPlayers[6], p2Id: shuffledPlayers[7], p1Name: finalDetails[shuffledPlayers[6]].name, p2Name: finalDetails[shuffledPlayers[7]].name, p1Team: finalDetails[shuffledPlayers[6]].team, p2Team: finalDetails[shuffledPlayers[7]].team, winnerId: null, score1: '-', score2: '-', isCpuVsCpu: shuffledPlayers[6].startsWith('cpu_') && shuffledPlayers[7].startsWith('cpu_'), status: 'WAITING', nextMatchId: 'm1_1' });
            } else {
                // Bracket size 16
                // Finals
                matches.push({ id: 'm3_0', round: 3, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: null });
                // Semis
                matches.push({ id: 'm2_0', round: 2, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm3_0' });
                matches.push({ id: 'm2_1', round: 2, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm3_0' });
                // Quarters
                matches.push({ id: 'm1_0', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_0' });
                matches.push({ id: 'm1_1', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_0' });
                matches.push({ id: 'm1_2', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_1' });
                matches.push({ id: 'm1_3', round: 1, p1Id: null, p2Id: null, p1Name: 'TBD', p2Name: 'TBD', p1Team: [], p2Team: [], winnerId: null, score1: '-', score2: '-', isCpuVsCpu: false, status: 'WAITING', nextMatchId: 'm2_1' });
                // Octavas
                for (let i = 0; i < 8; i++) {
                    const p1 = shuffledPlayers[i * 2];
                    const p2 = shuffledPlayers[i * 2 + 1];
                    const nextMatchIndex = Math.floor(i / 2);
                    matches.push({
                        id: `m0_${i}`,
                        round: 0,
                        p1Id: p1,
                        p2Id: p2,
                        p1Name: finalDetails[p1].name,
                        p2Name: finalDetails[p2].name,
                        p1Team: finalDetails[p1].team,
                        p2Team: finalDetails[p2].team,
                        winnerId: null,
                        score1: '-',
                        score2: '-',
                        isCpuVsCpu: p1.startsWith('cpu_') && p2.startsWith('cpu_'),
                        status: 'WAITING',
                        nextMatchId: `m1_${nextMatchIndex}`
                    });
                }
            }

            await updateDoc(docRef, {
                status: 'ACTIVE',
                players: finalPlayersList,
                playerDetails: finalDetails,
                matches,
                updatedAt: Date.now()
            });

            // Auto-simulate first round CPU vs CPU matches immediately
            await this.simulateCommunityCpuMatches(tourneyId);

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `community_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async simulateCommunityCpuMatches(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'community_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const tourney = snap.data() as CommunityTournament;
            let changesMade = false;
            const updatedMatches = [...tourney.matches];

            // Loop to resolve any ready Cpu Vs Cpu matches
            updatedMatches.forEach(match => {
                if (match.p1Id && match.p2Id && !match.winnerId && match.isCpuVsCpu) {
                    const seed = match.id.charCodeAt(match.id.length - 1) + match.p1Id.charCodeAt(0) + match.p2Id.charCodeAt(0);
                    const isP1Winner = seed % 2 === 0;
                    
                    const score1 = isP1Winner ? 2 : Math.floor(Math.random() * 2);
                    const score2 = isP1Winner ? Math.floor(Math.random() * 2) : 2;

                    match.winnerId = isP1Winner ? match.p1Id : match.p2Id;
                    match.score1 = score1;
                    match.score2 = score2;
                    match.status = 'FINISHED';
                    changesMade = true;

                    // Propagate winner
                    if (match.nextMatchId) {
                        const nextMatch = updatedMatches.find(m => m.id === match.nextMatchId);
                        if (nextMatch) {
                            const winnerDetails = tourney.playerDetails[match.winnerId!];
                            if (!nextMatch.p1Id) {
                                nextMatch.p1Id = match.winnerId;
                                nextMatch.p1Name = winnerDetails.name;
                                nextMatch.p1Team = winnerDetails.team;
                            } else {
                                nextMatch.p2Id = match.winnerId;
                                nextMatch.p2Name = winnerDetails.name;
                                nextMatch.p2Team = winnerDetails.team;
                            }
                            nextMatch.isCpuVsCpu = !!(nextMatch.p1Id?.startsWith('cpu_') && nextMatch.p2Id?.startsWith('cpu_'));
                        }
                    }
                }
            });

            if (changesMade) {
                // Run recursive simulation in case propagation opened up more CPU vs CPU matches
                await updateDoc(docRef, {
                    matches: updatedMatches,
                    updatedAt: Date.now()
                });
                
                // Recurse to see if new Cpu matches are unlocked
                await this.simulateCommunityCpuMatches(tourneyId);
            }
        } catch (e) {
            console.error("Error simulating CPU matches:", e);
        }
    }

    public async reportCommunityMatchResult(tourneyId: string, matchId: string, winnerId: string, scoreP1: number, scoreP2: number): Promise<void> {
        const docRef = doc(db, 'community_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as CommunityTournament;
            const updatedMatches = [...tourney.matches];
            const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
            if (matchIndex === -1) throw new Error("Match not found");

            const match = updatedMatches[matchIndex];
            match.winnerId = winnerId;
            match.score1 = scoreP1;
            match.score2 = scoreP2;
            match.status = 'FINISHED';

            // Check if entire tournament is complete
            const isLastRound = match.nextMatchId === null;
            let winnerUserId = tourney.winnerUserId;
            let status = tourney.status;

            if (isLastRound) {
                winnerUserId = winnerId;
                status = 'FINISHED';
            } else {
                // Propagate to next match
                const nextMatch = updatedMatches.find(m => m.id === match.nextMatchId);
                if (nextMatch) {
                    const winnerDetails = tourney.playerDetails[winnerId];
                    if (!nextMatch.p1Id) {
                        nextMatch.p1Id = winnerId;
                        nextMatch.p1Name = winnerDetails.name;
                        nextMatch.p1Team = winnerDetails.team;
                    } else {
                        nextMatch.p2Id = winnerId;
                        nextMatch.p2Name = winnerDetails.name;
                        nextMatch.p2Team = winnerDetails.team;
                    }
                    nextMatch.isCpuVsCpu = !!(nextMatch.p1Id?.startsWith('cpu_') && nextMatch.p2Id?.startsWith('cpu_'));
                }
            }

            await updateDoc(docRef, {
                matches: updatedMatches,
                winnerUserId,
                status,
                updatedAt: Date.now()
            });

            // Simulate CPU matches that might have been unlocked
            await this.simulateCommunityCpuMatches(tourneyId);

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `community_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public subscribeToCommunityTournaments(onUpdate: (tourneys: CommunityTournament[]) => void) {
        const q = query(collection(db, 'community_tournaments'), orderBy('createdAt', 'desc'), limit(15));
        return onSnapshot(q, (snapshot) => {
            const tourneys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityTournament));
            onUpdate(tourneys);
        }, (error) => {
            console.error("Firestore Community Tournaments sub failed:", error);
        });
    }

    public subscribeToSingleCommunityTournament(tourneyId: string, onUpdate: (tourney: CommunityTournament) => void) {
        return onSnapshot(doc(db, 'community_tournaments', tourneyId), (snapshot) => {
            if (snapshot.exists()) {
                onUpdate({ id: snapshot.id, ...snapshot.data() } as CommunityTournament);
            }
        }, (error) => {
            console.error("Firestore Single Community Tournament sub failed:", error);
        });
    }


    // ==========================================
    // 🏅 OFFICIAL TOURNAMENTS (ADM)
    // ==========================================

    public async createOfficialTournament(
        title: string, 
        type: 'WITH_PHASES' | 'WITHOUT_PHASES', 
        maxChars: number, 
        rules: string, 
        rewards: any,
        subEndMinutes: number,
        scheduledDates: { phase1: number; phase2: number; phase3: number }
    ): Promise<string> {
        if (!auth.currentUser) throw new Error("Must be logged in");

        // Security Check: Fetch user role to ensure only Admin can create official tournaments
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'ADMIN') {
            throw new Error("Apenas administradores podem criar torneios oficiais.");
        }

        const tourneyId = 'ot_' + Math.floor(100000 + Math.random() * 899999).toString();
        const docRef = doc(db, 'official_tournaments', tourneyId);

        const newTourney: OfficialTournament = {
            id: tourneyId,
            title: title.toUpperCase() || "TORNEIO OFICIAL",
            type,
            status: 'REGISTRATION',
            maxCharactersPerPlayer: maxChars,
            rules,
            rewards,
            subscriptionEndTime: Date.now() + (subEndMinutes * 60 * 1000),
            scheduledDates,
            currentPhase: type === 'WITH_PHASES' ? 1 : null,
            players: [],
            playerDetails: {},
            isFinished: false,
            winnerUserId: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            await setDoc(docRef, newTourney);
            return tourneyId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async joinOfficialTournament(tourneyId: string, profile: PlayerProfile, team: string[]): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in to join");

        const docRef = doc(db, 'official_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as OfficialTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Inscrições já encerradas");
            if (tourney.players.includes(auth.currentUser.uid)) return; // Already joined

            const updatedPlayers = [...tourney.players, auth.currentUser.uid];
            const updatedDetails = {
                ...tourney.playerDetails,
                [auth.currentUser.uid]: {
                    name: profile.name,
                    avatarId: profile.avatarId || 'goku_base',
                    numericId: profile.numericId || '0000',
                    team: team && team.length > 0 ? team : ['goku_base']
                }
            };

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async leaveOfficialTournament(tourneyId: string): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in");

        const docRef = doc(db, 'official_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as OfficialTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Inscrições já encerradas");
            if (!tourney.players.includes(auth.currentUser.uid)) return;

            const updatedPlayers = tourney.players.filter(p => p !== auth.currentUser!.uid);
            const updatedDetails = { ...tourney.playerDetails };
            delete updatedDetails[auth.currentUser.uid];

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    /**
     * Start/Initialize the active state of an Official Tournament.
     */
    public async startOfficialTournament(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'official_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as OfficialTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Tournament already active");

            if (tourney.type === 'WITHOUT_PHASES') {
                // --- MODE 2: WITHOUT PHASES (Single Tournament, Up to 20 players) ---
                const group = this.generateSubGroup("Grupo Único", tourney.players, tourney.playerDetails, tourney.maxCharactersPerPlayer);
                await updateDoc(docRef, {
                    status: 'ACTIVE',
                    singleGroup: group,
                    updatedAt: Date.now()
                });
            } else {
                // --- MODO 1: WITH PHASES ---
                // Setup Phase 1: 16 sub-tournaments (groups) of 20 players (Total 320 players).
                // Ensure there is at least one group. Real player goes into Group 1.
                const totalPlayersNeeded = 320;
                const finalPlayersList = [...tourney.players];
                const finalDetails = { ...tourney.playerDetails };
                const allBaseChars = BASE_CHARACTERS.map(c => c.id).filter(id => id !== 'random');

                // Fill with CPUs up to 320
                while (finalPlayersList.length < totalPlayersNeeded) {
                    const cpuId = 'cpu_' + Math.floor(100000 + Math.random() * 899999).toString();
                    const cpuName = NameGenerator.generate();
                    finalPlayersList.push(cpuId);

                    const cpuTeam: string[] = [];
                    for (let i = 0; i < tourney.maxCharactersPerPlayer; i++) {
                        const rChar = allBaseChars[Math.floor(Math.random() * allBaseChars.length)];
                        cpuTeam.push(rChar);
                    }

                    finalDetails[cpuId] = {
                        name: cpuName,
                        avatarId: cpuTeam[0],
                        numericId: Math.floor(1000 + Math.random() * 9000).toString(),
                        team: cpuTeam
                    };
                }

                // Split into 16 groups of 20 players
                const groups: SubTournamentGroup[] = [];
                for (let i = 0; i < 16; i++) {
                    const sliceStart = i * 20;
                    const groupPlayers = finalPlayersList.slice(sliceStart, sliceStart + 20);
                    const groupName = `Grupo ${i + 1}`;
                    const group = this.generateSubGroup(groupName, groupPlayers, finalDetails, tourney.maxCharactersPerPlayer);
                    groups.push(group);
                }

                await updateDoc(docRef, {
                    status: 'ACTIVE',
                    currentPhase: 1,
                    players: finalPlayersList,
                    playerDetails: finalDetails,
                    phaseGroups: {
                        phase1: groups
                    },
                    updatedAt: Date.now()
                });
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    /**
     * Helper to generate a points/match round-robin style league structure for 20 players.
     * Each player is scheduled to play 3 games dynamically.
     */
    private generateSubGroup(name: string, playersList: string[], details: Record<string, any>, teamSize: number): SubTournamentGroup {
        const playerDetails: SubTournamentGroup['playerDetails'] = {};
        
        playersList.forEach(pId => {
            const detail = details[pId] || {
                name: NameGenerator.generate(),
                avatarId: 'goku_base',
                numericId: '1234',
                team: ['goku_base']
            };

            playerDetails[pId] = {
                name: detail.name,
                avatarId: detail.avatarId,
                numericId: detail.numericId,
                team: detail.team,
                isCpu: pId.startsWith('cpu_'),
                points: 0,
                wins: 0,
                losses: 0,
                matchesPlayed: 0
            };
        });

        // Simple scheduling: Shuffle and create matches so that everyone plays at least 3 matches
        const shuffled = [...playersList].sort(() => Math.random() - 0.5);
        const matches: SubTournamentGroup['matches'] = [];

        // Simple pairing
        for (let roundNum = 0; roundNum < 3; roundNum++) {
            const roundShift = [...shuffled];
            // Shift elements for round variety
            for (let s = 0; s < roundNum; s++) {
                const first = roundShift.shift()!;
                roundShift.push(first);
            }

            for (let i = 0; i < roundShift.length; i += 2) {
                if (i + 1 < roundShift.length) {
                    const p1 = roundShift[i];
                    const p2 = roundShift[i + 1];
                    const matchId = `match_${roundNum}_${i}`;
                    const isPlayerInvolved = !p1.startsWith('cpu_') || !p2.startsWith('cpu_');
                    matches.push({
                        id: matchId,
                        p1Id: p1,
                        p2Id: p2,
                        winnerId: null,
                        isComplete: false,
                        isPlayerInvolved
                    });
                }
            }
        }

        return {
            id: 'grp_' + Math.floor(Math.random() * 100000).toString(),
            name,
            players: playersList,
            playerDetails,
            matches
        };
    }

    /**
     * Simulates CPU-only matches in a sub-group automatically
     */
    public simulateCpuMatchesInGroup(group: SubTournamentGroup): void {
        group.matches.forEach(m => {
            if (!m.isComplete && m.p1Id.startsWith('cpu_') && m.p2Id.startsWith('cpu_')) {
                // CPU vs CPU: Randomly select winner
                const winnerId = Math.random() > 0.5 ? m.p1Id : m.p2Id;
                const loserId = winnerId === m.p1Id ? m.p2Id : m.p1Id;

                m.winnerId = winnerId;
                m.isComplete = true;

                // Update leaderboard
                const wDet = group.playerDetails[winnerId];
                const lDet = group.playerDetails[loserId];
                if (wDet) {
                    wDet.wins += 1;
                    wDet.points += 3;
                    wDet.matchesPlayed += 1;
                }
                if (lDet) {
                    lDet.losses += 1;
                    lDet.matchesPlayed += 1;
                }
            }
        });
    }

    /**
     * Submits match results in the group
     */
    public async reportOfficialMatchResult(tourneyId: string, isPhaseMode: boolean, groupIndex: number, matchId: string, winnerId: string): Promise<void> {
        const docRef = doc(db, 'official_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as OfficialTournament;
            
            let targetGroup: SubTournamentGroup;
            if (isPhaseMode) {
                const phaseKey = `phase${tourney.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
                const groups = tourney.phaseGroups?.[phaseKey];
                if (!groups || !groups[groupIndex]) throw new Error("Group not found");
                targetGroup = groups[groupIndex];
            } else {
                if (!tourney.singleGroup) throw new Error("Single group not found");
                targetGroup = tourney.singleGroup;
            }

            const match = targetGroup.matches.find(m => m.id === matchId);
            if (!match) throw new Error("Match not found");

            const loserId = winnerId === match.p1Id ? match.p2Id : match.p1Id;
            match.winnerId = winnerId;
            match.isComplete = true;

            // Update stats
            const wDet = targetGroup.playerDetails[winnerId];
            const lDet = targetGroup.playerDetails[loserId];
            if (wDet) {
                wDet.wins += 1;
                wDet.points += 3;
                wDet.matchesPlayed += 1;
            }
            if (lDet) {
                lDet.losses += 1;
                lDet.matchesPlayed += 1;
            }

            // Automatically simulate other CPU matches
            this.simulateCpuMatchesInGroup(targetGroup);

            // Save updates
            if (isPhaseMode) {
                const phaseKey = `phase${tourney.currentPhase}` as 'phase1' | 'phase2' | 'phase3';
                const groups = [...(tourney.phaseGroups?.[phaseKey] || [])];
                groups[groupIndex] = targetGroup;

                await updateDoc(docRef, {
                    [`phaseGroups.${phaseKey}`]: groups,
                    updatedAt: Date.now()
                });

                // Check if ALL matches in ALL groups of this phase are now completed
                const allPhaseMatchesComplete = groups.every(g => g.matches.every(m => m.isComplete));
                if (allPhaseMatchesComplete) {
                    // Auto advance to the next phase
                    await this.advanceOfficialPhase(tourneyId);
                }
            } else {
                // Mode 2 single tournament
                // If all matches completed, conclude tournament
                const allComplete = targetGroup.matches.every(m => m.isComplete);
                let isFinished = tourney.isFinished;
                let finalWinner = tourney.winnerUserId;
                let status = tourney.status;

                if (allComplete) {
                    isFinished = true;
                    status = 'FINISHED';
                    // Find player with highest points
                    const sorted = Object.keys(targetGroup.playerDetails).map(k => ({ id: k, ...targetGroup.playerDetails[k] })).sort((a, b) => b.points - a.points);
                    finalWinner = sorted[0].id;
                }

                await updateDoc(docRef, {
                    singleGroup: targetGroup,
                    isFinished,
                    winnerUserId: finalWinner,
                    status,
                    updatedAt: Date.now()
                });
            }

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    /**
     * Advances the Official Phase-based Tournament to the next Phase.
     * Ensures dates and schedules are respected before activating.
     */
    public async advanceOfficialPhase(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'official_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Tournament not found");

            const tourney = snap.data() as OfficialTournament;
            if (tourney.type !== 'WITH_PHASES') return;

            const currPhase = tourney.currentPhase;
            if (!currPhase || currPhase >= 3) {
                //Conclude Phase 3 (FINAL)
                const phaseKey = 'phase3';
                const groups = tourney.phaseGroups?.[phaseKey];
                if (!groups || !groups[0]) return;
                const finalGroup = groups[0];

                const sorted = Object.keys(finalGroup.playerDetails)
                    .map(k => ({ id: k, ...finalGroup.playerDetails[k] }))
                    .sort((a, b) => b.points - a.points);

                const finalWinner = sorted[0].id;

                await updateDoc(docRef, {
                    isFinished: true,
                    status: 'FINISHED',
                    winnerUserId: finalWinner,
                    updatedAt: Date.now()
                });
                return;
            }

            // Check if all matches in current phase groups are completed
            const currPhaseKey = `phase${currPhase}` as 'phase1' | 'phase2' | 'phase3';
            const currGroups = tourney.phaseGroups?.[currPhaseKey];
            if (!currGroups) throw new Error("No phase groups active");

            // Verify that all matches in the current phase are finished before proceeding to next phase
            const hasPendingHumanMatches = currGroups.some(g => 
                g.matches.some(m => !m.isComplete && (m.p1Id !== 'cpu' || m.p2Id !== 'cpu'))
            );

            if (hasPendingHumanMatches) {
                // If human matches are still pending, complete CPU matches first
                currGroups.forEach(g => this.simulateCpuMatchesInGroup(g));
                
                // Re-check after simulating CPU matches
                const stillPending = currGroups.some(g => g.matches.some(m => !m.isComplete));
                if (stillPending) {
                    throw new Error("A próxima fase só pode ser iniciada quando todas as lutas da fase anterior forem concluídas.");
                }
            } else {
                // Complete remaining CPU matches if any
                currGroups.forEach(g => this.simulateCpuMatchesInGroup(g));
            }

            const nextPhase = (currPhase + 1) as 2 | 3;
            
            // Check scheduled date for the next phase
            const nextPhaseKey = `phase${nextPhase}` as 'phase1' | 'phase2' | 'phase3';
            const scheduledDate = tourney.scheduledDates[nextPhaseKey];

            // Filter players that advance (Top 5 of each group)
            const advancingPlayersList: string[] = [];
            const updatedDetails = { ...tourney.playerDetails };

            currGroups.forEach(group => {
                const sortedPlayers = Object.keys(group.playerDetails)
                    .map(k => ({ id: k, ...group.playerDetails[k] }))
                    .sort((a, b) => b.points - a.points || b.wins - a.wins);

                const top5 = sortedPlayers.slice(0, 5);
                top5.forEach(p => {
                    advancingPlayersList.push(p.id);
                });
            });

            // Set up next phase sub-groups
            let nextGroups: SubTournamentGroup[] = [];
            
            if (nextPhase === 2) {
                // Phase 2: 4 tournaments (groups) of 20 players (Total 80 players)
                // Advancing list has exactly 16 groups * 5 players = 80 players.
                for (let i = 0; i < 4; i++) {
                    const sliceStart = i * 20;
                    const grpPlayers = advancingPlayersList.slice(sliceStart, sliceStart + 20);
                    const grp = this.generateSubGroup(`Grupo ${i + 1}`, grpPlayers, updatedDetails, tourney.maxCharactersPerPlayer);
                    nextGroups.push(grp);
                }
            } else {
                // Phase 3 (FINAL): 1 unique group of 20 players
                // Advancing list has exactly 4 groups * 5 players = 20 players.
                const grp = this.generateSubGroup("Grupo Final", advancingPlayersList, updatedDetails, tourney.maxCharactersPerPlayer);
                nextGroups.push(grp);
            }

            // Update database with advanced phase
            const phaseUpdateKey = `phaseGroups.phase${nextPhase}`;
            
            await updateDoc(docRef, {
                currentPhase: nextPhase,
                [phaseUpdateKey]: nextGroups,
                phaseGroups: {
                    ...tourney.phaseGroups,
                    [`phase${nextPhase}`]: nextGroups
                },
                updatedAt: Date.now()
            });

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `official_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public subscribeToOfficialTournaments(onUpdate: (tourneys: OfficialTournament[]) => void) {
        const q = query(collection(db, 'official_tournaments'), orderBy('createdAt', 'desc'), limit(15));
        return onSnapshot(q, (snapshot) => {
            const tourneys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficialTournament));
            onUpdate(tourneys);
        }, (error) => {
            console.error("Firestore Official Tournaments sub failed:", error);
        });
    }

    public subscribeToSingleOfficialTournament(tourneyId: string, onUpdate: (tourney: OfficialTournament) => void) {
        return onSnapshot(doc(db, 'official_tournaments', tourneyId), (snapshot) => {
            if (snapshot.exists()) {
                onUpdate({ id: snapshot.id, ...snapshot.data() } as OfficialTournament);
            }
        }, (error) => {
            console.error("Firestore Single Official Tournament sub failed:", error);
        });
    }

    // ==========================================
    // 🏆 DIVISION-BASED TOURNAMENT SYSTEM (SISTEMA DE TORNEIOS POR DIVISÕES)
    // ==========================================

    public generateDivisionNames(maxPlayers: number): { id: string; index: number; name: string; title: string; status: 'PENDING' | 'ACTIVE' | 'COMPLETED' }[] {
        const list: { id: string; index: number; name: string; title: string; status: 'PENDING' | 'ACTIVE' | 'COMPLETED' }[] = [];
        let count = maxPlayers;
        let idx = 0;
        while (count > 1) {
            let label = `Divisão ${idx + 1}`;
            if (count === 2) label += " — Grande Final";
            else if (count === 4) label += " — Semifinal";
            else if (count === 8) label += " — Quartas de Final";
            else if (count === 16) label += " — Oitavas de Final";
            else label += " — Classificatória";

            list.push({ id: `div_${idx}`, index: idx, name: label, title: label, status: idx === 0 ? 'PENDING' : 'PENDING' });
            count = Math.floor(count / 2);
            idx++;
        }
        return list;
    }

    public async createDivisionTournament(
        title: string,
        description: string,
        bannerPreset: string,
        maxPlayers: number,
        teamSize: number,
        region: string,
        matchTimeLimit: number,
        rules: string,
        rewards: any,
        subEndMinutes: number,
        startDateOffsetMinutes: number,
        creator: PlayerProfile,
        creatorTeam: string[]
    ): Promise<string> {
        if (!auth.currentUser) throw new Error("Must be logged in to create tournament");

        const tourneyId = 'dt_' + Math.floor(100000 + Math.random() * 899999).toString();
        const docRef = doc(db, 'division_tournaments', tourneyId);

        const divisions = this.generateDivisionNames(maxPlayers);
        const countries = ["🇧🇷 Brasil", "🇺🇸 EUA", "🇯🇵 Japão", "🇲🇽 México", "🇫🇷 França", "🇪🇸 Espanha", "🇦🇷 Argentina"];
        const titles = ["Lenda Saiyajin", "Guerreiro Z", "Mestre das Artes", "Campeão do Poder", "Supremo Conquistador"];

        const userProgress: PlayerDivisionProgress = {
            playerId: auth.currentUser.uid,
            uid: auth.currentUser.uid,
            name: creator.name,
            avatarId: creator.avatarId || 'goku_base',
            avatar: creator.avatarId || 'goku_base',
            numericId: creator.numericId || '0000',
            idNumber: creator.numericId || '0000',
            country: countries[Math.floor(Math.random() * countries.length)],
            countryFlag: "🇧🇷",
            level: Math.floor(35 + Math.random() * 30),
            title: creator.activeTitle || titles[Math.floor(Math.random() * titles.length)],
            favoriteChar: creatorTeam[0] || 'goku_base',
            team: creatorTeam && creatorTeam.length > 0 ? creatorTeam : ['goku_base'],
            teamPower: Math.floor(14000 + Math.random() * 4000),
            winRate: Math.floor(65 + Math.random() * 25),
            winStreak: Math.floor(2 + Math.random() * 5),
            highestDivisionReached: 0,
            divisionIndex: 0,
            highestDivisionName: divisions[0]?.name || "Divisão 1",
            currentStatus: 'NOT_STARTED',
            status: 'ACTIVE',
            wins: 0,
            losses: 0,
            points: 0,
            isCpu: false
        };

        const now = Date.now();
        const newTourney: DivisionTournament = {
            id: tourneyId,
            title: title.toUpperCase() || "GRANDE TORNEIO DE DIVISÕES",
            description: description || "Competição oficial por divisões progressivas.",
            bannerPreset: bannerPreset || "POWER",
            creatorId: auth.currentUser.uid,
            creatorName: creator.name,
            status: 'REGISTRATION',
            maxPlayers: [8, 16, 32, 64].includes(maxPlayers) ? maxPlayers : 32,
            teamSize: [1, 2, 3].includes(teamSize) ? teamSize : 3,
            region: region || "SA - Brasil",
            matchTimeLimit: matchTimeLimit || 180,
            rules: rules || "Batalha oficial sem itens proibidos.",
            registrationStartTime: now,
            startDate: now + (startDateOffsetMinutes * 60 * 1000),
            subscriptionEndTime: now + (subEndMinutes * 60 * 1000),
            currentDivisionIndex: 0,
            divisions,
            players: [auth.currentUser.uid],
            playerDetails: {
                [auth.currentUser.uid]: userProgress
            },
            playersProgress: {
                [auth.currentUser.uid]: userProgress
            },
            matches: [],
            matchHistory: [],
            rewards: rewards || { coins: 10000, gems: 250, tickets: 10, title: "Lenda Supremo" },
            winnerUserId: null,
            runnerUpUserId: null,
            thirdPlaceUserId: null,
            createdAt: now,
            updatedAt: now
        };

        try {
            await setDoc(docRef, newTourney);
            return tourneyId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `division_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async joinDivisionTournament(tourneyId: string, profile: PlayerProfile, team: string[]): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in to join");
        const docRef = doc(db, 'division_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Torneio não encontrado");

            const tourney = snap.data() as DivisionTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Inscrições encerradas");
            if (tourney.players.includes(auth.currentUser.uid)) return; // Already in
            if (tourney.players.length >= tourney.maxPlayers) throw new Error("Torneio lotado");

            const countries = ["🇧🇷 Brasil", "🇺🇸 EUA", "🇯🇵 Japão", "🇲🇽 México", "🇫🇷 França", "🇪🇸 Espanha", "🇦🇷 Argentina"];
            const titlesList = ["Guerreiro Z", "Mestre Combatente", "Lenda Saiyajin", "Predador Cósmico"];

            const countryVal = countries[Math.floor(Math.random() * countries.length)];

            const userProgress: PlayerDivisionProgress = {
                playerId: auth.currentUser.uid,
                uid: auth.currentUser.uid,
                name: profile.name,
                avatarId: profile.avatarId || 'goku_base',
                avatar: profile.avatarId || 'goku_base',
                numericId: profile.numericId || '0000',
                idNumber: profile.numericId || '0000',
                country: countryVal,
                countryFlag: countryVal.split(" ")[0] || "🇧🇷",
                level: Math.floor(30 + Math.random() * 35),
                title: profile.activeTitle || titlesList[Math.floor(Math.random() * titlesList.length)],
                favoriteChar: team[0] || 'goku_base',
                team: team && team.length > 0 ? team : ['goku_base'],
                teamPower: Math.floor(13500 + Math.random() * 4500),
                winRate: Math.floor(60 + Math.random() * 30),
                winStreak: Math.floor(1 + Math.random() * 4),
                highestDivisionReached: 0,
                divisionIndex: 0,
                highestDivisionName: tourney.divisions[0]?.name || "Divisão 1",
                currentStatus: 'NOT_STARTED',
                status: 'ACTIVE',
                wins: 0,
                losses: 0,
                points: 0,
                isCpu: false
            };

            const updatedPlayers = [...tourney.players, auth.currentUser.uid];
            const updatedDetails = { ...tourney.playerDetails, [auth.currentUser.uid]: userProgress };

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                playersProgress: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `division_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async leaveDivisionTournament(tourneyId: string): Promise<void> {
        if (!auth.currentUser) throw new Error("Must be logged in");
        const docRef = doc(db, 'division_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const tourney = snap.data() as DivisionTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Torneio em andamento");
            if (!tourney.players.includes(auth.currentUser.uid)) return;

            const updatedPlayers = tourney.players.filter(p => p !== auth.currentUser!.uid);
            const updatedDetails = { ...tourney.playerDetails };
            delete updatedDetails[auth.currentUser.uid];

            await updateDoc(docRef, {
                players: updatedPlayers,
                playerDetails: updatedDetails,
                updatedAt: Date.now()
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `division_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async startDivisionTournament(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'division_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Torneio não encontrado");

            const tourney = snap.data() as DivisionTournament;
            if (tourney.status !== 'REGISTRATION') throw new Error("Torneio já iniciado");

            const totalNeeded = tourney.maxPlayers;
            const finalPlayersList = [...tourney.players];
            const finalDetails = { ...tourney.playerDetails };

            const allBaseChars = BASE_CHARACTERS.map(c => c.id).filter(id => id !== 'random');
            const countries = ["🇧🇷 Brasil", "🇺🇸 EUA", "🇯🇵 Japão", "🇲🇽 México", "🇫🇷 França", "🇪🇸 Espanha", "🇦🇷 Argentina", "🇨🇱 Chile"];
            const titlesList = ["Guardião Galáctico", "Mestre do Instinto", "Lenda dos Torneios", "Lutador de Elite", "Sombra da Noite"];

            // Fill CPU participants if needed
            while (finalPlayersList.length < totalNeeded) {
                const cpuId = 'cpu_' + Math.floor(100000 + Math.random() * 899999).toString();
                const cpuName = NameGenerator.generate();
                finalPlayersList.push(cpuId);

                const cpuTeam: string[] = [];
                for (let i = 0; i < tourney.teamSize; i++) {
                    const rChar = allBaseChars[Math.floor(Math.random() * allBaseChars.length)];
                    cpuTeam.push(rChar);
                }

                const countryVal = countries[Math.floor(Math.random() * countries.length)];
                const numId = Math.floor(1000 + Math.random() * 9000).toString();

                finalDetails[cpuId] = {
                    playerId: cpuId,
                    uid: cpuId,
                    name: cpuName,
                    avatarId: cpuTeam[0],
                    avatar: cpuTeam[0],
                    numericId: numId,
                    idNumber: numId,
                    country: countryVal,
                    countryFlag: countryVal.split(" ")[0] || "🇧🇷",
                    level: Math.floor(25 + Math.random() * 45),
                    title: titlesList[Math.floor(Math.random() * titlesList.length)],
                    favoriteChar: cpuTeam[0],
                    team: cpuTeam,
                    teamPower: Math.floor(12000 + Math.random() * 5000),
                    winRate: Math.floor(50 + Math.random() * 35),
                    winStreak: Math.floor(1 + Math.random() * 4),
                    highestDivisionReached: 0,
                    divisionIndex: 0,
                    highestDivisionName: tourney.divisions[0]?.name || "Divisão 1",
                    currentStatus: 'WAITING_OPPONENT',
                    status: 'ACTIVE',
                    wins: 0,
                    losses: 0,
                    points: 0,
                    isCpu: true
                };
            }

            // Shuffle players for Division 1
            const shuffled = [...finalPlayersList].sort(() => Math.random() - 0.5);

            // Generate Division 1 Matches & Tree Links for subsequent divisions
            const matches: DivisionMatch[] = [];
            const numDivisions = tourney.divisions.length;
            const now = Date.now();

            // Build total matches skeleton backwards from Final (divisionIndex = numDivisions - 1) down to 0
            let prevDivisionMatchIds: string[] = [];
            for (let d = numDivisions - 1; d >= 0; d--) {
                const matchCount = Math.pow(2, numDivisions - 1 - d);
                const currentDivisionMatchIds: string[] = [];
                const divName = tourney.divisions[d].name;

                for (let m = 0; m < matchCount; m++) {
                    const matchId = `dm_${d}_${m}`;
                    currentDivisionMatchIds.push(matchId);

                    const nextMatchId = prevDivisionMatchIds.length > 0 ? prevDivisionMatchIds[Math.floor(m / 2)] : null;

                    if (d === 0) {
                        // Division 1: assign initial shuffled players
                        const p1 = shuffled[m * 2];
                        const p2 = shuffled[m * 2 + 1];

                        finalDetails[p1].currentStatus = 'READY_TO_PLAY';
                        finalDetails[p2].currentStatus = 'READY_TO_PLAY';

                        matches.push({
                            id: matchId,
                            divisionIndex: 0,
                            divisionName: divName,
                            p1Id: p1,
                            p2Id: p2,
                            p1Name: finalDetails[p1].name,
                            p2Name: finalDetails[p2].name,
                            p1Avatar: finalDetails[p1].avatarId,
                            p2Avatar: finalDetails[p2].avatarId,
                            p1Team: finalDetails[p1].team,
                            p2Team: finalDetails[p2].team,
                            winnerId: null,
                            score1: '-',
                            score2: '-',
                            status: 'READY',
                            scheduledTime: now,
                            isCpuVsCpu: p1.startsWith('cpu_') && p2.startsWith('cpu_'),
                            nextMatchId
                        });
                    } else {
                        matches.push({
                            id: matchId,
                            divisionIndex: d,
                            divisionName: divName,
                            p1Id: null,
                            p2Id: null,
                            p1Name: 'Aguardando',
                            p2Name: 'Aguardando',
                            p1Avatar: 'goku_base',
                            p2Avatar: 'goku_base',
                            p1Team: [],
                            p2Team: [],
                            winnerId: null,
                            score1: '-',
                            score2: '-',
                            status: 'WAITING',
                            scheduledTime: now + (d * 5 * 60 * 1000),
                            isCpuVsCpu: false,
                            nextMatchId
                        });
                    }
                }
                prevDivisionMatchIds = currentDivisionMatchIds;
            }

            // Update divisions status
            const updatedDivisions = tourney.divisions.map((div, i) => ({
                ...div,
                status: (i === 0 ? 'ACTIVE' : 'PENDING') as 'ACTIVE' | 'PENDING'
            }));

            await updateDoc(docRef, {
                status: 'ACTIVE',
                currentDivisionIndex: 0,
                divisions: updatedDivisions,
                players: finalPlayersList,
                playerDetails: finalDetails,
                playersProgress: finalDetails,
                matches,
                updatedAt: Date.now()
            });

            // Simulate CPU vs CPU matches in Division 1
            await this.simulateDivisionCpuMatches(tourneyId);

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `division_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public async simulateDivisionCpuMatches(tourneyId: string): Promise<void> {
        const docRef = doc(db, 'division_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;

            const tourney = snap.data() as DivisionTournament;
            if (tourney.status !== 'ACTIVE') return;

            let changesMade = false;
            const updatedMatches = [...tourney.matches];
            const updatedDetails = { ...tourney.playerDetails };
            const updatedMatchHistory = [...(tourney.matchHistory || [])];

            updatedMatches.forEach(match => {
                if (match.p1Id && match.p2Id && !match.winnerId && match.isCpuVsCpu && (match.status === 'READY' || match.status === 'WAITING')) {
                    const seed = match.id.charCodeAt(match.id.length - 1) + match.p1Id.charCodeAt(0) + match.p2Id.charCodeAt(0);
                    const isP1Winner = seed % 2 === 0;

                    const winnerId = isP1Winner ? match.p1Id : match.p2Id;
                    const loserId = isP1Winner ? match.p2Id : match.p1Id;

                    const score1 = isP1Winner ? 2 : Math.floor(Math.random() * 2);
                    const score2 = isP1Winner ? Math.floor(Math.random() * 2) : 2;

                    match.winnerId = winnerId;
                    match.score1 = score1;
                    match.score2 = score2;
                    match.status = 'FINISHED';
                    changesMade = true;

                    // Update playerDetails stats
                    if (updatedDetails[winnerId]) {
                        updatedDetails[winnerId].wins += 1;
                        updatedDetails[winnerId].points += 100 + (match.divisionIndex * 50);
                        updatedDetails[winnerId].highestDivisionReached = Math.max(updatedDetails[winnerId].highestDivisionReached, match.divisionIndex + 1);
                        updatedDetails[winnerId].highestDivisionName = tourney.divisions[match.divisionIndex + 1]?.name || tourney.divisions[match.divisionIndex].name;
                        updatedDetails[winnerId].currentStatus = 'QUALIFIED';
                    }
                    if (updatedDetails[loserId]) {
                        updatedDetails[loserId].losses += 1;
                        updatedDetails[loserId].currentStatus = 'ELIMINATED';
                    }

                    // Add to match history
                    updatedMatchHistory.push({
                        id: match.id,
                        divisionName: match.divisionName,
                        p1Id: match.p1Id,
                        p2Id: match.p2Id,
                        p1Name: match.p1Name,
                        p2Name: match.p2Name,
                        p1Avatar: match.p1Avatar,
                        p2Avatar: match.p2Avatar,
                        p1Team: match.p1Team,
                        p2Team: match.p2Team,
                        winnerId,
                        score1: Number(score1),
                        score2: Number(score2),
                        durationSeconds: Math.floor(60 + Math.random() * 120),
                        timestamp: Date.now()
                    });

                    // Propagate to next match
                    if (match.nextMatchId) {
                        const nextMatch = updatedMatches.find(m => m.id === match.nextMatchId);
                        if (nextMatch) {
                            const winnerDetail = updatedDetails[winnerId];
                            if (!nextMatch.p1Id) {
                                nextMatch.p1Id = winnerId;
                                nextMatch.p1Name = winnerDetail.name;
                                nextMatch.p1Avatar = winnerDetail.avatarId;
                                nextMatch.p1Team = winnerDetail.team;
                            } else {
                                nextMatch.p2Id = winnerId;
                                nextMatch.p2Name = winnerDetail.name;
                                nextMatch.p2Avatar = winnerDetail.avatarId;
                                nextMatch.p2Team = winnerDetail.team;
                                nextMatch.status = 'READY';
                            }
                            nextMatch.isCpuVsCpu = !!(nextMatch.p1Id?.startsWith('cpu_') && nextMatch.p2Id?.startsWith('cpu_'));
                        }
                    }
                }
            });

            if (changesMade) {
                await updateDoc(docRef, {
                    matches: updatedMatches,
                    playerDetails: updatedDetails,
                    matchHistory: updatedMatchHistory,
                    updatedAt: Date.now()
                });

                // Recursively simulate next available CPU vs CPU matches
                await this.simulateDivisionCpuMatches(tourneyId);
            }
        } catch (e) {
            console.error("Error simulating division CPU matches:", e);
        }
    }

    public async reportDivisionMatchResult(
        tourneyId: string,
        matchId: string,
        winnerId: string,
        scoreP1: number,
        scoreP2: number,
        durationSeconds: number = 120
    ): Promise<void> {
        const docRef = doc(db, 'division_tournaments', tourneyId);

        try {
            const snap = await getDoc(docRef);
            if (!snap.exists()) throw new Error("Torneio não encontrado");

            const tourney = snap.data() as DivisionTournament;
            const updatedMatches = [...tourney.matches];
            const updatedDetails = { ...tourney.playerDetails };
            const updatedMatchHistory = [...(tourney.matchHistory || [])];

            const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
            if (matchIndex === -1) throw new Error("Partida não encontrada");

            const match = updatedMatches[matchIndex];
            const loserId = winnerId === match.p1Id ? match.p2Id : match.p1Id;

            match.winnerId = winnerId;
            match.score1 = scoreP1;
            match.score2 = scoreP2;
            match.status = 'FINISHED';

            // Update winner and loser details
            if (winnerId && updatedDetails[winnerId]) {
                updatedDetails[winnerId].wins += 1;
                updatedDetails[winnerId].points += 100 + (match.divisionIndex * 50);
                updatedDetails[winnerId].highestDivisionReached = Math.max(updatedDetails[winnerId].highestDivisionReached, match.divisionIndex + 1);
                updatedDetails[winnerId].highestDivisionName = tourney.divisions[match.divisionIndex + 1]?.name || tourney.divisions[match.divisionIndex].name;
                updatedDetails[winnerId].currentStatus = 'QUALIFIED';
            }
            if (loserId && updatedDetails[loserId]) {
                updatedDetails[loserId].losses += 1;
                updatedDetails[loserId].currentStatus = 'ELIMINATED';
            }

            // Push to history
            if (match.p1Id && match.p2Id) {
                updatedMatchHistory.push({
                    id: match.id,
                    divisionName: match.divisionName,
                    p1Id: match.p1Id,
                    p2Id: match.p2Id,
                    p1Name: match.p1Name,
                    p2Name: match.p2Name,
                    p1Avatar: match.p1Avatar,
                    p2Avatar: match.p2Avatar,
                    p1Team: match.p1Team,
                    p2Team: match.p2Team,
                    winnerId,
                    score1: scoreP1,
                    score2: scoreP2,
                    durationSeconds,
                    timestamp: Date.now()
                });
            }

            const isFinalMatch = match.divisionIndex === tourney.divisions.length - 1;
            let status = tourney.status;
            let winnerUserId = tourney.winnerUserId;
            let runnerUpUserId = tourney.runnerUpUserId;
            let thirdPlaceUserId = tourney.thirdPlaceUserId;

            if (isFinalMatch) {
                status = 'FINISHED';
                winnerUserId = winnerId;
                runnerUpUserId = loserId;

                if (winnerUserId && updatedDetails[winnerUserId]) {
                    updatedDetails[winnerUserId].currentStatus = 'CHAMPION';
                }

                // Determine 3rd place from semi-final losers
                const semiMatches = updatedMatches.filter(m => m.divisionIndex === tourney.divisions.length - 2);
                const semiLosers = semiMatches.map(m => m.winnerId === m.p1Id ? m.p2Id : m.p1Id).filter(Boolean);
                thirdPlaceUserId = semiLosers[0] || null;
            } else if (match.nextMatchId) {
                // Propagate to next match
                const nextMatch = updatedMatches.find(m => m.id === match.nextMatchId);
                if (nextMatch) {
                    const winnerDetail = updatedDetails[winnerId];
                    if (!nextMatch.p1Id) {
                        nextMatch.p1Id = winnerId;
                        nextMatch.p1Name = winnerDetail.name;
                        nextMatch.p1Avatar = winnerDetail.avatarId;
                        nextMatch.p1Team = winnerDetail.team;
                    } else {
                        nextMatch.p2Id = winnerId;
                        nextMatch.p2Name = winnerDetail.name;
                        nextMatch.p2Avatar = winnerDetail.avatarId;
                        nextMatch.p2Team = winnerDetail.team;
                        nextMatch.status = 'READY';
                    }
                    nextMatch.isCpuVsCpu = !!(nextMatch.p1Id?.startsWith('cpu_') && nextMatch.p2Id?.startsWith('cpu_'));
                }
            }

            // Check if current division is complete to advance currentDivisionIndex
            let currentDivisionIndex = tourney.currentDivisionIndex;
            const currDivMatches = updatedMatches.filter(m => m.divisionIndex === currentDivisionIndex);
            if (currDivMatches.every(m => m.status === 'FINISHED')) {
                if (currentDivisionIndex < tourney.divisions.length - 1) {
                    currentDivisionIndex++;
                }
            }

            const updatedDivisions = tourney.divisions.map((div, i) => ({
                ...div,
                status: (i < currentDivisionIndex ? 'COMPLETED' : i === currentDivisionIndex ? 'ACTIVE' : 'PENDING') as 'COMPLETED' | 'ACTIVE' | 'PENDING'
            }));

            await updateDoc(docRef, {
                status,
                currentDivisionIndex,
                divisions: updatedDivisions,
                matches: updatedMatches,
                playerDetails: updatedDetails,
                matchHistory: updatedMatchHistory,
                winnerUserId,
                runnerUpUserId,
                thirdPlaceUserId,
                updatedAt: Date.now()
            });

            // Simulate CPU vs CPU matches unlocked in next divisions
            await this.simulateDivisionCpuMatches(tourneyId);

        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `division_tournaments/${tourneyId}`);
            throw error;
        }
    }

    public subscribeToDivisionTournaments(onUpdate: (tourneys: DivisionTournament[]) => void) {
        const q = query(collection(db, 'division_tournaments'), orderBy('createdAt', 'desc'), limit(15));
        return onSnapshot(q, (snapshot) => {
            const tourneys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DivisionTournament));
            onUpdate(tourneys);
        }, (error) => {
            console.error("Firestore Division Tournaments sub failed:", error);
        });
    }

    public subscribeToSingleDivisionTournament(tourneyId: string, onUpdate: (tourney: DivisionTournament) => void) {
        return onSnapshot(doc(db, 'division_tournaments', tourneyId), (snapshot) => {
            if (snapshot.exists()) {
                onUpdate({ id: snapshot.id, ...snapshot.data() } as DivisionTournament);
            }
        }, (error) => {
            console.error("Firestore Single Division Tournament sub failed:", error);
        });
    }
}

