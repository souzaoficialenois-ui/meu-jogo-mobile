
import { TournamentState, TournamentMatch, CharacterData } from '../types';
import { BASE_CHARACTERS } from '../constants';

export class TournamentManager {
    
    public static createTournament(playerTeamIds: string[], roster: CharacterData[], teamSize: number): TournamentState {
        // 1. Setup Participants (Player Team + 7 Random CPU Teams)
        const allCharacterIds = roster.filter(c => c.id !== 'random').map(c => c.id);
        
        // Generate CPU teams
        const cpuTeams: string[][] = [];
        for(let i = 0; i < 7; i++) {
            const team: string[] = [];
            // Randomly select teamSize characters for this CPU team
            const availableForCpu = [...allCharacterIds].sort(() => Math.random() - 0.5);
            for(let j = 0; j < teamSize; j++) {
                if(availableForCpu.length > 0) {
                    team.push(availableForCpu.pop()!);
                } else {
                    team.push(allCharacterIds[0]); // fallback
                }
            }
            cpuTeams.push(team);
        }
        
        const participants = [playerTeamIds, ...cpuTeams];
        // Shuffle participants for random bracket placement
        const shuffledTeams = participants.sort(() => Math.random() - 0.5);

        // 2. Create Matches Structure
        const matches: TournamentMatch[] = [];

        // Finals
        matches.push({ id: 'm2_0', round: 2, p1Team: null, p2Team: null, winnerTeam: null, nextMatchId: null });

        // Semis
        matches.push({ id: 'm1_0', round: 1, p1Team: null, p2Team: null, winnerTeam: null, nextMatchId: 'm2_0' });
        matches.push({ id: 'm1_1', round: 1, p1Team: null, p2Team: null, winnerTeam: null, nextMatchId: 'm2_0' });

        // Quarters
        matches.push({ id: 'm0_0', round: 0, p1Team: shuffledTeams[0], p2Team: shuffledTeams[1], winnerTeam: null, nextMatchId: 'm1_0' });
        matches.push({ id: 'm0_1', round: 0, p1Team: shuffledTeams[2], p2Team: shuffledTeams[3], winnerTeam: null, nextMatchId: 'm1_0' });
        matches.push({ id: 'm0_2', round: 0, p1Team: shuffledTeams[4], p2Team: shuffledTeams[5], winnerTeam: null, nextMatchId: 'm1_1' });
        matches.push({ id: 'm0_3', round: 0, p1Team: shuffledTeams[6], p2Team: shuffledTeams[7], winnerTeam: null, nextMatchId: 'm1_1' });

        return {
            id: `tourney_${Date.now()}`,
            title: "BUDOKAI TOURNAMENT",
            matches,
            currentRound: 0,
            playerTeamIds,
            isFinished: false,
            hasPlayerLost: false,
            rewards: { coins: 0, xp: 0 },
            teamSize
        };
    }

    public static simulateRound(tournament: TournamentState): TournamentState {
        const newState = { ...tournament, matches: [...tournament.matches] };
        
        const currentRoundMatches = newState.matches.filter(m => m.round === newState.currentRound && !m.winnerTeam);

        currentRoundMatches.forEach(match => {
            const hasPlayer = (match.p1Team && this.isSameTeam(match.p1Team, newState.playerTeamIds)) || 
                              (match.p2Team && this.isSameTeam(match.p2Team, newState.playerTeamIds));
            
            if (!hasPlayer && match.p1Team && match.p2Team) {
                const winnerTeam = Math.random() > 0.5 ? match.p1Team : match.p2Team;
                this.setMatchWinner(newState, match.id, winnerTeam);
            }
        });

        return newState;
    }

    public static simulateRestOfTournament(tournament: TournamentState): TournamentState {
        let state = { ...tournament, matches: [...tournament.matches.map(m => ({...m}))] };
        
        for (let round = state.currentRound; round <= 2; round++) {
            const matchesInRound = state.matches.filter(m => m.round === round && !m.winnerTeam);
            matchesInRound.forEach(match => {
                if (match.p1Team && match.p2Team) {
                    const winnerTeam = Math.random() > 0.5 ? match.p1Team : match.p2Team;
                    this.setMatchWinner(state, match.id, winnerTeam);
                }
            });
            state.currentRound = round + 1;
        }
        
        return state;
    }

    public static setMatchWinner(tournament: TournamentState, matchId: string, winnerTeam: string[]) {
        const matchIndex = tournament.matches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return;

        tournament.matches[matchIndex].winnerTeam = winnerTeam;

        const nextId = tournament.matches[matchIndex].nextMatchId;
        if (nextId) {
            const nextMatchIndex = tournament.matches.findIndex(m => m.id === nextId);
            if (nextMatchIndex !== -1) {
                if (!tournament.matches[nextMatchIndex].p1Team) {
                    tournament.matches[nextMatchIndex].p1Team = winnerTeam;
                } else {
                    tournament.matches[nextMatchIndex].p2Team = winnerTeam;
                }
            }
        }
    }

    public static getNextPlayerMatch(tournament: TournamentState): TournamentMatch | null {
        return tournament.matches.find(m => 
            ((m.p1Team && this.isSameTeam(m.p1Team, tournament.playerTeamIds)) || 
             (m.p2Team && this.isSameTeam(m.p2Team, tournament.playerTeamIds))) && 
            !m.winnerTeam
        ) || null;
    }

    public static isSameTeam(teamA: string[], teamB: string[]): boolean {
        if(teamA.length !== teamB.length) return false;
        // In this implementation, the combination of IDs precisely identifies the player team.
        return teamA.every((id, idx) => id === teamB[idx]);
    }
}
