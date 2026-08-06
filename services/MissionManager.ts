import { Mission, MissionType, GameEvent, MissionAction, RewardType } from '../types';

export class MissionManager {
    
    // Static Templates
    private static DAILY_TEMPLATES = [
        { id: 'd_room_token', actionType: 'BATTLE_PLAY' as MissionAction, description: 'Jogue 1 Batalha para obter Tokens de Sala', target: 1, rewardType: 'ROOM_TOKEN' as RewardType, rewardAmount: 2 },
        { id: 'd1', actionType: 'BATTLE_WIN' as MissionAction, description: 'Win 3 Matches', target: 3, rewardType: 'XP' as RewardType, rewardAmount: 500 },
        { id: 'd2', actionType: 'TRAINING_PLAY' as MissionAction, description: 'Play 1 Training Session', target: 1, rewardType: 'COIN' as RewardType, rewardAmount: 300 },
        { id: 'd3', actionType: 'BATTLE_PLAY' as MissionAction, description: 'Play 3 Battles', target: 3, rewardType: 'COIN' as RewardType, rewardAmount: 300 },
        { id: 'd4', actionType: 'LOGIN' as MissionAction, description: 'Daily Login', target: 1, rewardType: 'GEM' as RewardType, rewardAmount: 50 },
        { id: 'd5', actionType: 'DAMAGE_DEALT' as MissionAction, description: 'Deal 50,000 Damage', target: 50000, rewardType: 'XP' as RewardType, rewardAmount: 400 },
        { id: 'd6', actionType: 'SUPER_EXECUTE' as MissionAction, description: 'Execute 5 Special Attacks', target: 5, rewardType: 'COIN' as RewardType, rewardAmount: 250 },
        { id: 'd7', actionType: 'ULTIMATE_EXECUTE' as MissionAction, description: 'Execute 2 Ultimate Attacks', target: 2, rewardType: 'TICKET' as RewardType, rewardAmount: 1 },
    ];

    private static WEEKLY_TEMPLATES = [
        { id: 'w1', actionType: 'BATTLE_WIN' as MissionAction, description: 'Win 15 Battles', target: 15, rewardType: 'TICKET' as RewardType, rewardAmount: 5 },
        { id: 'w2', actionType: 'ULTIMATE_EXECUTE' as MissionAction, description: 'Execute 10 Ultimates', target: 10, rewardType: 'GEM' as RewardType, rewardAmount: 50 },
        { id: 'w3', actionType: 'SUMMON' as MissionAction, description: 'Summon 5 Times', target: 5, rewardType: 'GEM' as RewardType, rewardAmount: 50 },
        { id: 'w4', actionType: 'TAG_EXECUTE' as MissionAction, description: 'Perform 30 Tags', target: 30, rewardType: 'COIN' as RewardType, rewardAmount: 1000 },
    ];

    private static MONTHLY_TEMPLATES = [
        { id: 'm_room_token', actionType: 'BATTLE_WIN' as MissionAction, description: 'Vença 5 Batalhas para obter Tokens de Sala Mensais', target: 5, rewardType: 'ROOM_TOKEN' as RewardType, rewardAmount: 5 },
        { id: 'm1', actionType: 'DAMAGE_DEALT' as MissionAction, description: 'Cause 200.000 de Dano Total', target: 200000, rewardType: 'GEM' as RewardType, rewardAmount: 300 },
        { id: 'm2', actionType: 'BATTLE_WIN' as MissionAction, description: 'Vença 25 Batalhas', target: 25, rewardType: 'TICKET' as RewardType, rewardAmount: 10 },
    ];

    public static generateDailies(): Mission[] {
        const now = Date.now();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);

        return this.DAILY_TEMPLATES.map(t => ({
            ...t,
            id: `daily_${t.id}_${now}`, 
            type: 'DAILY' as MissionType,
            current: 0,
            claimed: false,
            expiresAt: tomorrow.getTime()
        }));
    }

    public static generateWeeklies(): Mission[] {
        const now = Date.now();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);

        return this.WEEKLY_TEMPLATES.map(t => ({
            ...t,
            id: `weekly_${t.id}_${now}`,
            type: 'WEEKLY' as MissionType,
            current: 0,
            claimed: false,
            expiresAt: nextWeek.getTime()
        }));
    }

    public static generateMonthlies(): Mission[] {
        const now = Date.now();
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);

        return this.MONTHLY_TEMPLATES.map(t => ({
            ...t,
            id: `monthly_${t.id}_${now}`,
            type: 'MONTHLY' as MissionType,
            current: 0,
            claimed: false,
            expiresAt: nextMonth.getTime()
        }));
    }

    public static getActiveEvents(): GameEvent[] {
        const now = Date.now();
        return [
            {
                id: 'evt_beta',
                title: 'BETA TEST EXCLUSIVE',
                description: 'Thank you for testing Fighter Legend! Claim your exclusive rewards for being a pioneer.',
                type: 'SPECIAL',
                startsAt: now - (1000 * 60 * 60 * 24),
                endsAt: now + (1000 * 60 * 60 * 24 * 365),
                bannerUrl: '/Assets/fundosdastelas/modos/m3.png',
                color: 'from-orange-600 to-yellow-500',
                status: 'ACTIVE',
                participationConditions: 'Beta participants only.',
                missions: ['evt_beta_coins', 'evt_beta_gems', 'evt_beta_tickets', 'evt_beta_avatar', 'evt_beta_bg', 'evt_beta_title', 'evt_beta_damage', 'evt_beta_supers', 'evt_beta_ultimates']
            },
            {
                id: 'evt_anniv',
                title: '1ST ANNIVERSARY CELEBRATION',
                description: 'Celebrate our first year with exclusive rewards and challenges!',
                type: 'ANNIVERSARY',
                startsAt: now - (1000 * 60 * 60 * 24),
                endsAt: now + (1000 * 60 * 60 * 24 * 14),
                bannerUrl: '/Assets/fundosdastelas/modos/m1.png',
                color: 'from-yellow-600 to-orange-500',
                status: 'ACTIVE',
                participationConditions: 'Open for all players.',
                missions: ['evt_anniv_m1', 'evt_anniv_m2', 'evt_anniv_m3', 'evt_anniv_m4']
            },
            {
                id: 'evt_launch',
                title: 'LAUNCH EVENT',
                description: 'Welcome to Fighter Legend! Complete these starter missions for a huge boost.',
                type: 'LAUNCH',
                startsAt: now - (1000 * 60 * 60 * 24 * 10),
                endsAt: now + (1000 * 60 * 60 * 24 * 30),
                bannerUrl: '/Assets/fundosdastelas/modos/m4.png',
                color: 'from-purple-600 to-pink-500',
                status: 'ACTIVE',
                missions: ['evt_launch_m1', 'evt_launch_m2']
            },
            {
                id: 'evt_summer',
                title: 'SUMMER FESTIVAL',
                description: 'Beat the heat with seasonal missions and earn summer coins!',
                type: 'SEASONAL',
                startsAt: now - (1000 * 60 * 60 * 24 * 5),
                endsAt: now + (1000 * 60 * 60 * 24 * 25),
                bannerUrl: '/Assets/fundosdastelas/modos/m2.png',
                color: 'from-blue-600 to-cyan-400',
                status: 'ACTIVE',
                missions: ['evt_summer_m1']
            }
        ];
    }

    public static getEventMissions(eventId: string): Mission[] {
        if (eventId === 'evt_beta') {
            return [
                { 
                    id: 'evt_beta_coins', 
                    type: 'SPECIAL', 
                    actionType: 'LOGIN', 
                    description: 'Beta Reward: 5000 Coins', 
                    target: 1, 
                    current: 1, 
                    rewardType: 'COIN' as RewardType, 
                    rewardAmount: 5000, 
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_gems', 
                    type: 'SPECIAL', 
                    actionType: 'LOGIN', 
                    description: 'Beta Reward: 500 Gems', 
                    target: 1, 
                    current: 1, 
                    rewardType: 'GEM' as RewardType, 
                    rewardAmount: 500, 
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_tickets', 
                    type: 'SPECIAL', 
                    actionType: 'LOGIN', 
                    description: 'Beta Reward: 10 Tickets', 
                    target: 1, 
                    current: 1, 
                    rewardType: 'TICKET' as RewardType, 
                    rewardAmount: 10, 
                    rewardData: 'banner_standard',
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_avatar', 
                    type: 'SPECIAL', 
                    actionType: 'BATTLE_WIN', 
                    description: 'Beta Reward: Win 5 Battles (Exclusive Avatar)', 
                    target: 5, 
                    current: 0, 
                    rewardType: 'AVATAR' as RewardType, 
                    rewardAmount: 1, 
                    rewardData: 'avatar_beta_exclusive',
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_bg', 
                    type: 'SPECIAL', 
                    actionType: 'BATTLE_PLAY', 
                    description: 'Beta Reward: Play 10 Battles (Pioneer Background)', 
                    target: 10, 
                    current: 0, 
                    rewardType: 'AVATAR_BG' as RewardType, 
                    rewardAmount: 1, 
                    rewardData: 'bg_beta_pioneer',
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_title', 
                    type: 'SPECIAL', 
                    actionType: 'BATTLE_WIN', 
                    description: 'Beta Reward: Win 15 Battles (Fighter Legend Title)', 
                    target: 15, 
                    current: 0, 
                    rewardType: 'TITLE' as RewardType, 
                    rewardAmount: 1, 
                    rewardData: 'Fighter Legend',
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_damage', 
                    type: 'SPECIAL', 
                    actionType: 'DAMAGE_DEALT', 
                    description: 'Beta Trial: Deal 100,000 Total Damage', 
                    target: 100000, 
                    current: 0, 
                    rewardType: 'COIN' as RewardType, 
                    rewardAmount: 5000, 
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_supers', 
                    type: 'SPECIAL', 
                    actionType: 'SUPER_EXECUTE', 
                    description: 'Beta Mastery: Execute 30 Special Attacks', 
                    target: 30, 
                    current: 0, 
                    rewardType: 'GEM' as RewardType, 
                    rewardAmount: 1000, 
                    claimed: false, 
                    eventId: 'evt_beta' 
                },
                { 
                    id: 'evt_beta_ultimates', 
                    type: 'SPECIAL', 
                    actionType: 'ULTIMATE_EXECUTE', 
                    description: 'Beta Legend: Execute 10 Ultimate Attacks', 
                    target: 10, 
                    current: 0, 
                    rewardType: 'TICKET' as RewardType, 
                    rewardAmount: 10, 
                    claimed: false, 
                    eventId: 'evt_beta' 
                }
            ];
        }
        if (eventId === 'evt_anniv') {
            return [
                { id: 'evt_anniv_m1', type: 'ANNIVERSARY', actionType: 'ULTIMATE_EXECUTE', description: 'Execute 10 Ultimates', target: 10, current: 0, rewardType: 'GEM', rewardAmount: 100, claimed: false, eventId: 'evt_anniv' },
                { id: 'evt_anniv_m2', type: 'ANNIVERSARY', actionType: 'STORY_COMPLETE', description: 'Complete Story Mode', target: 1, current: 0, rewardType: 'CHARACTER', rewardAmount: 1, rewardData: 'goku_mui', claimed: false, eventId: 'evt_anniv' },
                { id: 'evt_anniv_m3', type: 'ANNIVERSARY', actionType: 'BATTLE_WIN', description: 'Vença 50 partidas', target: 50, current: 0, rewardType: 'TITLE', rewardAmount: 1, rewardData: 'Lenda do Aniversário', claimed: false, eventId: 'evt_anniv' },
                { id: 'evt_anniv_m4', type: 'ANNIVERSARY', actionType: 'SUMMON', description: 'Realize 5 Invocações', target: 5, current: 0, rewardType: 'CRYSTAL', rewardAmount: 10, rewardData: 'UNIVERSAL', claimed: false, eventId: 'evt_anniv' }
            ];
        }
        if (eventId === 'evt_launch') {
            return [
                { id: 'evt_launch_m1', type: 'LAUNCH', actionType: 'REACH_LEVEL', description: 'Reach Level 10', target: 10, current: 1, rewardType: 'GEM', rewardAmount: 500, claimed: false, eventId: 'evt_launch' },
                { id: 'evt_launch_m2', type: 'LAUNCH', actionType: 'SUMMON', description: 'Open 10 Gacha Summons', target: 10, current: 0, rewardType: 'TICKET', rewardAmount: 5, claimed: false, eventId: 'evt_launch' }
            ];
        }
        if (eventId === 'evt_summer') {
            return [
                { id: 'evt_summer_m1', type: 'SEASONAL', actionType: 'BATTLE_WIN', description: 'Win 10 Online Battles', target: 10, current: 0, rewardType: 'TICKET', rewardAmount: 10, claimed: false, eventId: 'evt_summer' }
            ];
        }
        return [];
    }
}
