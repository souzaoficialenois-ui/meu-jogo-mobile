import { BattlePassLevel } from '../types';

export const BATTLE_PASS_LEVELS: BattlePassLevel[] = [
    {
        level: 1,
        xpRequired: 1000,
        freeReward: { type: 'COIN', amount: 100, claimed: false },
        eliteReward: { type: 'CHARACTER', amount: 1, data: 'goku_base', claimed: false },
        premiumReward: { type: 'CHARACTER', amount: 1, data: 'gogeta_ssj4', claimed: false },
    },
    {
        level: 2,
        xpRequired: 1100,
        freeReward: { type: 'XP', amount: 200, claimed: false },
        eliteReward: { type: 'COIN', amount: 150, claimed: false },
        premiumReward: { type: 'GEM', amount: 10, claimed: false },
    },
    {
        level: 3,
        xpRequired: 1200,
        freeReward: { type: 'COIN', amount: 120, claimed: false },
        eliteReward: { type: 'GEM', amount: 5, claimed: false },
        premiumReward: { type: 'TICKET', amount: 1, claimed: false },
    },
    {
        level: 4,
        xpRequired: 1300,
        freeReward: { type: 'XP', amount: 250, claimed: false },
        eliteReward: { type: 'COIN', amount: 200, claimed: false },
        premiumReward: { type: 'GEM', amount: 15, claimed: false },
    },
    {
        level: 5,
        xpRequired: 1500,
        freeReward: { type: 'TICKET', amount: 1, data: 'token_standard', claimed: false }, // Using valid token IDs from RESOURCE_SPRITES
        eliteReward: { type: 'TICKET', amount: 2, data: 'token_legendary', claimed: false },   
        premiumReward: { type: 'TICKET', amount: 3, data: 'token_eternal', claimed: false }, 
    },
    // ... Levels 6-9
    {
        level: 10,
        xpRequired: 2000,
        freeReward: { type: 'CHARACTER', amount: 1, data: 'kuririn', claimed: false },
        eliteReward: { type: 'CHARACTER', amount: 1, data: 'frieza_final', claimed: false },
        premiumReward: { type: 'CHARACTER', amount: 1, data: 'broly_ikari', claimed: false },
    },
    // ... Levels 11-19
    {
        level: 20,
        xpRequired: 3000,
        freeReward: { type: 'COIN', amount: 500, claimed: false },
        eliteReward: { type: 'CHARACTER', amount: 1, data: 'goku_ssj', claimed: false },
        premiumReward: { type: 'CHARACTER', amount: 1, data: 'goku_blue', claimed: false },
    },
    // ... Levels 21-49
    {
        level: 50,
        xpRequired: 10000,
        freeReward: { type: 'CHARACTER', amount: 1, data: 'teen_gohan_ssj2', claimed: false },
        eliteReward: { type: 'CHARACTER', amount: 1, data: 'trunks_ssj2', claimed: false },
        premiumReward: { type: 'CHARACTER', amount: 1, data: 'goku_mui', claimed: false },
    }
];

// Fill gaps for simple logic
for (let i = 1; i <= 50; i++) {
    if (!BATTLE_PASS_LEVELS.find(l => l.level === i)) {
        BATTLE_PASS_LEVELS.push({
            level: i,
            xpRequired: 1000 + (i * 100),
            freeReward: { type: 'COIN', amount: 50, claimed: false },
            eliteReward: { type: 'COIN', amount: 100, claimed: false },
            premiumReward: { type: 'COIN', amount: 200, claimed: false },
        });
    }
}
BATTLE_PASS_LEVELS.sort((a, b) => a.level - b.level);
