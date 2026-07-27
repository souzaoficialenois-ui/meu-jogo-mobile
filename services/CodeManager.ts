
import { MessageReward } from '../types';

interface RedeemCode {
    id: string;
    reward: MessageReward;
}

const VALID_CODES: Record<string, MessageReward> = {
    'FIGHTERZ2024': { type: 'COIN', amount: 5000, claimed: false },
    'KAKAROT': { type: 'TICKET', amount: 1, claimed: false },
    'KURIRIN': { type: 'CHARACTER', amount: 1, data: 'kuririn', claimed: false },
    'SENZU': { type: 'GEM', amount: 50, claimed: false },
    'SPARKLING': { type: 'COIN', amount: 10000, claimed: false },
    'SHADOW': { type: 'TICKET', amount: 300, claimed: false }
};

export class CodeManager {
    public static validateCode(code: string): MessageReward | null {
        const normalized = code.trim().toUpperCase();
        return VALID_CODES[normalized] || null;
    }
}
