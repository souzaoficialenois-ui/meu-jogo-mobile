// src/engine/dialogue/types.ts

export enum CharacterEmotion {
    CALM = 'Calm',
    ANGRY = 'Angry',
    CONFIDENT = 'Confident',
    DESPERATE = 'Desperate',
    EXHAUSTED = 'Exhausted',
    AGGRESSIVE = 'Aggressive'
}

export enum BattleEvent {
    MATCH_START = 'MATCH_START',
    FIRST_STRIKE = 'FIRST_STRIKE',
    CLASH = 'CLASH',
    COMBO_HIGH = 'COMBO_HIGH',
    TRANSFORMATION = 'TRANSFORMATION',
    ULTIMATE = 'ULTIMATE',
    ULTIMATE_2 = 'ULTIMATE_2',
    ULTIMATE_3 = 'ULTIMATE_3',
    LOW_HP_SELF = 'LOW_HP_SELF',
    LOW_HP_OPPONENT = 'LOW_HP_OPPONENT',
    REVERSAL = 'REVERSAL',
    VICTORY = 'VICTORY',
    DEFEAT = 'DEFEAT',
    TIME_RUNNING_OUT = 'TIME_RUNNING_OUT',
    LONG_IDLE = 'LONG_IDLE',
    BEING_DOMINATED = 'BEING_DOMINATED',
    CRITICAL_DAMAGE = 'CRITICAL_DAMAGE',
    PERFECT_GUARD = 'PERFECT_GUARD',
    COUNTER_ATTACK = 'COUNTER_ATTACK',
    KNOCKBACK_RECOVERY = 'KNOCKBACK_RECOVERY',
    DESPERATE_MODE_ENTER = 'DESPERATE_MODE_ENTER',
    LONG_OFFENSIVE_SEQUENCE = 'LONG_OFFENSIVE_SEQUENCE',
    NO_KI = 'NO_KI',
    CHARGING_KI = 'CHARGING_KI',
    COMBO_CANCEL = 'COMBO_CANCEL',
    ULTIMATE_INTERRUPT = 'ULTIMATE_INTERRUPT',
    MATCH_POINT = 'MATCH_POINT',
    PERFECT_WIN = 'PERFECT_WIN'
}

export enum RelationshipType {
    RIVALS = 'RIVALS',
    ALLIES = 'ALLIES',
    MASTER_STUDENT = 'MASTER_STUDENT',
    HISTORICAL_ENEMIES = 'HISTORICAL_ENEMIES',
    NEUTRAL = 'NEUTRAL'
}

export interface DialogueQuote {
    id: string; // unique ID
    textEn: string;
    textPt: string;
    voiceKey?: string; // Optional real audio key
    priority: number; // For VoiceQueue hierarchy
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY'; // For rare dialogue support
    emotion?: CharacterEmotion; // Specific emotion associated, or any
}

export interface DialogueBank {
    characterId: string;
    quotes: Record<BattleEvent, DialogueQuote[]>;
    rivalResponses?: Record<string, Partial<Record<BattleEvent, DialogueQuote[]>>>; // Special reaction to rivals
    genericResponses?: Partial<Record<BattleEvent, DialogueQuote[]>>; // Response quotes
}

export interface DialogueSubtitle {
    id: string;
    characterId: string;
    characterName: string;
    color: string;
    text: string;
    durationMs: number;
    startedAt: number;
    playerNum: 1 | 2;
    emotion: CharacterEmotion;
}
