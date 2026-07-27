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

            // Check if all player-involved matches in current phase groups are completed
            const currPhaseKey = `phase${currPhase}` as 'phase1' | 'phase2' | 'phase3';
            const currGroups = tourney.phaseGroups?.[currPhaseKey];
            if (!currGroups) throw new Error("No phase groups active");

            // Complete simulation of all other groups & matches
            currGroups.forEach(g => this.simulateCpuMatchesInGroup(g));

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
}
