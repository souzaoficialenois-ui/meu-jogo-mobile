import { RankedData, RankTier, PlayerProfile } from '../types';
import { db } from './firebase';
import { doc, updateDoc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

export interface RankDefinition {
    name: string;
    tier: RankTier;
    minPoints: number;
    subranks: string[];
}

export const RANKS: RankDefinition[] = [
    { name: 'Aprendiz', tier: 'APPRENTICE', minPoints: 0, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Lutador', tier: 'FIGHTER', minPoints: 1000, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Guerreiro', tier: 'WARRIOR', minPoints: 2000, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Elite', tier: 'ELITE', minPoints: 3500, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Super Elite', tier: 'SUPER_ELITE', minPoints: 5500, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Lenda', tier: 'LEGEND', minPoints: 8000, subranks: ['V', 'IV', 'III', 'II', 'I'] },
    { name: 'Deus da Destruição', tier: 'GOD_OF_DESTRUCTION', minPoints: 12000, subranks: [] },
    { name: 'Anjo', tier: 'ANGEL', minPoints: 18000, subranks: [] },
    { name: 'Zeno', tier: 'ZENO', minPoints: 25000, subranks: [] },
];

export class RankService {
    public static getRankFromPoints(points: number): { name: string, subRank: string, tier: RankTier } {
        let currentRank = RANKS[0];
        for (const r of RANKS) {
            if (points >= r.minPoints) {
                currentRank = r;
            } else {
                break;
            }
        }

        if (currentRank.subranks.length === 0) {
            return {
                name: currentRank.name,
                subRank: '',
                tier: currentRank.tier
            };
        }

        const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
        const pointsRange = nextRank ? nextRank.minPoints - currentRank.minPoints : 2000;
        const pointsInTier = points - currentRank.minPoints;
        const totalSubranks = currentRank.subranks.length;
        
        const pointsPerSubrank = pointsRange / totalSubranks;
        const subIndex = Math.min(totalSubranks - 1, Math.floor(pointsInTier / pointsPerSubrank));
        
        return {
            name: currentRank.name,
            subRank: currentRank.subranks[totalSubranks - 1 - subIndex],
            tier: currentRank.tier
        };
    }

    public static calculateRPChange(
        winnerPoints: number,
        loserPoints: number,
        isWinner: boolean,
        winStreak: number = 0,
        performanceBonus: number = 0
    ): number {
        const baseRP = 25;
        const diff = loserPoints - winnerPoints;
        
        const eloDiffBonus = Math.floor(diff / 100);
        let change = baseRP + (isWinner ? eloDiffBonus : -eloDiffBonus);
        
        if (isWinner) {
            const streakBonus = winStreak >= 3 ? Math.min(20, (winStreak - 2) * 5) : 0;
            change += streakBonus + performanceBonus;
            change = Math.min(60, Math.max(10, change));
        } else {
            change = Math.max(-50, Math.min(-5, change));
        }

        return change;
    }

    public static async updateUserRank(userId: string, pointsChange: number, isWinner: boolean, characterId?: string) {
        try {
            const userRef = doc(db, 'users', userId);
            const rankRef = doc(db, 'rankings', userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) return;

            const userData = userSnap.data() as PlayerProfile;
            const currentRanked = userData.ranked?.br || this.getDefaultRankedData();
            
            const newPoints = Math.max(0, currentRanked.points + pointsChange);
            const newRankInfo = this.getRankFromPoints(newPoints);
            const newWinStreak = isWinner ? (currentRanked.winStreak || 0) + 1 : 0;
            const newMaxWinStreak = Math.max(currentRanked.maxWinStreak || 0, newWinStreak);
            const newTotalMatches = (currentRanked.totalMatches || 0) + 1;
            const newWins = isWinner ? (userData.wins || 0) + 1 : (userData.wins || 0);
            const newLosses = isWinner ? (userData.losses || 0) : (userData.losses || 0) + 1;
            const newWinRate = Math.round((newWins / (newWins + newLosses)) * 100);

            const updatedRanked: RankedData = {
                ...currentRanked,
                points: newPoints,
                rank: newRankInfo.name,
                subRank: newRankInfo.subRank,
                tier: newRankInfo.tier,
                winStreak: newWinStreak,
                maxWinStreak: newMaxWinStreak,
                totalMatches: newTotalMatches,
                winRate: newWinRate,
                lastMatchTimestamp: Date.now(),
                topCharacterId: characterId || currentRanked.topCharacterId
            };

            // Update user profile
            await updateDoc(userRef, {
                'ranked.br': updatedRanked,
                wins: newWins,
                losses: newLosses
            });

            // Update global ranking entry
            await setDoc(rankRef, {
                userId,
                name: userData.name,
                avatarId: userData.avatarId,
                title: userData.activeTitle || '',
                points: newPoints,
                tier: newRankInfo.tier,
                winRate: newWinRate,
                topCharacterId: updatedRanked.topCharacterId,
                lastUpdated: Date.now()
            }, { merge: true });

            return updatedRanked;
        } catch (error) {
            console.error("Failed to update user rank:", error);
            throw error;
        }
    }

    public static async getGlobalLeaderboard(limitCount: number = 100) {
        try {
            const q = query(collection(db, 'rankings'), orderBy('points', 'desc'), limit(limitCount));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
            return [];
        }
    }

    public static listenToLeaderboard(callback: (data: any[]) => void, limitCount: number = 100) {
        const q = query(collection(db, 'rankings'), orderBy('points', 'desc'), limit(limitCount));
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data());
            callback(data);
        }, (error) => {
            console.error("Leaderboard listener error:", error);
        });
    }

    public static getPenaltyForAbandonment(currentPoints: number): number {
        // Abandoning results in a flat -50 RP penalty (or more at high elos)
        const basePenalty = 50;
        if (currentPoints > 12000) return 150; // God of Destruction+ has higher stakes
        if (currentPoints > 8000) return 100; // Legend has higher stakes
        return basePenalty;
    }

    public static getDefaultRankedData(): RankedData {
        return {
            rank: 'Aprendiz',
            subRank: 'V',
            points: 0,
            bestRankName: 'Aprendiz V',
            tier: 'APPRENTICE',
            winStreak: 0,
            maxWinStreak: 0,
            totalMatches: 0,
            winRate: 0
        };
    }
}
