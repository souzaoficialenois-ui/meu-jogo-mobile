
import { PlayerProfile } from '../types';
import { RankService } from './RankService';

/**
 * PlayerDatabase
 * Acts as a local persistence layer. In a full production app, 
 * this would connect to Firebase, Supabase, or a custom REST API.
 */
export class PlayerDatabase {
    private static STORAGE_KEY = 'dd2d_profile';

    public static createNewProfile(name: string, avatarId: string, backgroundId?: string): PlayerProfile {
        // Generate a UUID for the player. 
        // Fallback to timestamp+random if crypto.randomUUID is not available (older browsers).
        let uuid: string;
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            uuid = crypto.randomUUID();
        } else {
            uuid = 'player-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
        }

        const numericId = Math.floor(10000000 + Math.random() * 90000000).toString();

        const newProfile: PlayerProfile = {
            playerId: uuid,
            numericId: numericId,
            name: name,
            avatarId: avatarId,
            backgroundId: backgroundId || '1',
            createdDate: Date.now(),
            lastLoginDate: Date.now(),
            redeemedCodes: [],
            wins: 0,
            losses: 0,
            conductScore: 100,
            bio: 'SABOR "Ruim"',
            ranked: {
                br: RankService.getDefaultRankedData(),
                tdm: RankService.getDefaultRankedData()
            },
            weaponStats: {
                weaponName: 'INP9',
                kills: 8229,
                imageUrl: '/Assets/avatar/retrato/1.png'
            }
        };

        this.saveProfile(newProfile);
        return newProfile;
    }

    public static saveProfile(profile: PlayerProfile) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    }

    public static loadProfile(): PlayerProfile | null {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse profile data", e);
            return null;
        }
    }

    public static updateWinLoss(win: boolean) {
        const profile = this.loadProfile();
        if (profile) {
            if (win) profile.wins++;
            else profile.losses++;
            this.saveProfile(profile);
        }
    }

    public static updateCharacterWinLoss(characterIds: string[], win: boolean) {
        const profile = this.loadProfile();
        if (profile) {
            if (win) profile.wins++;
            else profile.losses++;

            const stats = profile.characterStats || {};
            const now = Date.now();
            characterIds.forEach(id => {
                if (!id) return;
                const current = stats[id] || { wins: 0, losses: 0, matches: 0 };
                const newWins = current.wins + (win ? 1 : 0);
                const newLosses = current.losses + (win ? 0 : 1);
                stats[id] = {
                    ...current,
                    wins: newWins,
                    losses: newLosses,
                    matches: (current.matches || (current.wins + current.losses)) + 1,
                    lastUsedTimestamp: now
                };
            });
            profile.characterStats = stats;
            this.saveProfile(profile);
        }
    }
}
