
import { PlayerState, SpriteConfig } from '../types';

// Placeholder Assets (You can replace these URLs with your real assets)
const PLACEHOLDER_SHEET = '/Assets/Arquivos/Idle.png';
const GOKU_IDLE_SHEET = '/Assets/Arquivos/Idle.png';
const GOKU_WALK_SHEET = '/Assets/Arquivos/Walk.png';
const GOKU_ATTACK_SHEET_1 = '/Assets/Arquivos/Attack_1.png';
const GOKU_ATTACK_SHEET_2 = '/Assets/Arquivos/Attack_2.png';
const GOKU_ATTACK_SHEET_3 = '/Assets/Arquivos/Attack_3.png';
const GOKU_JUMP_SHEET = '/Assets/Arquivos/Jump.png';
const SHIELD_SHEET = '/Assets/Arquivos/Shield.png';

// Character 3 Assets
const CHAR3_IDLE_SHEET = '/Assets/Arquivos/j%202-a820.png';
const CHAR3_WALK_SHEET = '/Assets/Arquivos/Photo%203-aab3.png';
const CHAR3_WALK_BACK_SHEET = '/Assets/Arquivos/Photo%204-ab3a.png';
const CHAR3_CROUCH_SHEET = '/Assets/Arquivos/Photo%205-aee2.png';
// Updated URL for Ki Charge
const CHAR3_CHARGE_SHEET = '/Assets/Arquivos/carregando%20ki-b082.png';

/**
 * Helper to create a standard animation config easily
 */
const createAnim = (
    url: string, 
    frames: number, 
    w: number, 
    h: number, 
    loop: boolean = true, 
    speed: number = 5,
    row: number = 0
) => ({
    imageUrl: url,
    frames,
    frameWidth: w,
    frameHeight: h,
    loop,
    speed,
    row
});

// Animation Definitions
const GOKU_ANIMS = {
    [PlayerState.IDLE]: createAnim(GOKU_IDLE_SHEET, 6, 128, 128, true, 5),
    [PlayerState.RUNNING]: createAnim(GOKU_WALK_SHEET, 8, 128, 128, true, 6),
    [PlayerState.WALK_BACKWARD]: createAnim(GOKU_WALK_SHEET, 8, 128, 128, true, 6), // Fallback
    [PlayerState.CROUCH]: createAnim(GOKU_IDLE_SHEET, 1, 128, 128, true, 5), // Fallback
    
    // --- LIGHT COMBO CHAIN ---
    'ATTACK_LIGHT_1': createAnim(GOKU_ATTACK_SHEET_1, 4, 128, 128, false, 3), 
    'ATTACK_LIGHT_2': createAnim(GOKU_ATTACK_SHEET_2, 4, 128, 128, false, 3), 
    'ATTACK_LIGHT_3': createAnim(GOKU_ATTACK_SHEET_3, 4, 128, 128, false, 4), // New Finisher Sprite
    
    // --- MEDIUM COMBO CHAIN ---
    // Using mixed sheets to create variety
    'ATTACK_MEDIUM_1': createAnim(GOKU_ATTACK_SHEET_2, 4, 128, 128, false, 4),
    'ATTACK_MEDIUM_2': createAnim(GOKU_ATTACK_SHEET_3, 4, 128, 128, false, 4),
    'ATTACK_MEDIUM_3': createAnim(GOKU_ATTACK_SHEET_1, 4, 128, 128, false, 5),

    // --- HEAVY (KNOCKBACK) ---
    // Using Attack 3 as Heavy visually as well for impact, or fallback to Attack 1
    'ATTACK_HEAVY': createAnim(GOKU_ATTACK_SHEET_3, 4, 128, 128, false, 5),
    
    // --- SPECIAL (BEAM) ---
    'ATTACK_SPECIAL': createAnim(GOKU_ATTACK_SHEET_2, 4, 128, 128, false, 4),

    // Generic fallback
    [PlayerState.ATTACKING]: createAnim(GOKU_ATTACK_SHEET_1, 4, 128, 128, false, 4), 

    [PlayerState.BLOCKING]: createAnim(SHIELD_SHEET, 1, 128, 128, true, 5),
    
    // Jump & Fall (Updated to 3 frames based on user asset type)
    [PlayerState.JUMPING]: createAnim(GOKU_JUMP_SHEET, 3, 128, 128, false, 5),
    [PlayerState.FALLING]: createAnim(GOKU_JUMP_SHEET, 3, 128, 128, false, 5),

    [PlayerState.HIT]: createAnim(GOKU_IDLE_SHEET, 1, 128, 128, false, 5),
    [PlayerState.VICTORY]: createAnim(GOKU_IDLE_SHEET, 6, 128, 128, true, 6),
};

const CHAR3_ANIMS = {
    ...GOKU_ANIMS, // Inherit basics
    [PlayerState.IDLE]: {
        ...createAnim(CHAR3_IDLE_SHEET, 13, 364, 431, true, 5), 
        scale: 0.5,
        isVertical: false 
    },
    [PlayerState.RUNNING]: {
        ...createAnim(CHAR3_WALK_SHEET, 7, 601, 433, true, 5), 
        scale: 0.5,
        isVertical: false
    },
    [PlayerState.WALK_BACKWARD]: {
        ...createAnim(CHAR3_WALK_BACK_SHEET, 8, 494, 433, true, 5), 
        scale: 0.5,
        isVertical: false
    },
    [PlayerState.CROUCH]: {
        ...createAnim(CHAR3_CROUCH_SHEET, 8, 347, 302, true, 5),
        scale: 0.5,
        isVertical: false
    },
    [PlayerState.VICTORY]: {
        ...createAnim(CHAR3_IDLE_SHEET, 13, 364, 431, true, 6),
        scale: 0.5,
        isVertical: false
    },
    [PlayerState.CHARGING]: {
        // Loop set to FALSE: Animation plays once (frames 0-5) and stays on frame 5 while state is active.
        ...createAnim(CHAR3_CHARGE_SHEET, 6, 443, 453, false, 5),
        scale: 0.5,
        isVertical: false
    }
};

export const SPRITE_DB: Record<string, SpriteConfig> = {
    'goku_base': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/f97316/ffffff?text=GOKU',
        portraitUrl: 'https://via.placeholder.com/300/f97316/ffffff?text=GOKU+BASE',
        animations: GOKU_ANIMS
    },
    'vegeta_base': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/1e3a8a/ffffff?text=VEGETA',
        portraitUrl: 'https://via.placeholder.com/300/1e3a8a/ffffff?text=VEGETA',
        animations: GOKU_ANIMS // Sharing for demo
    },
    'goku_ui': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/f8fafc/000000?text=UI',
        portraitUrl: 'https://via.placeholder.com/300/f8fafc/000000?text=GOKU+UI',
        animations: GOKU_ANIMS
    },
    'goku_ui_sign': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/94a3b8/000000?text=UIS',
        portraitUrl: 'https://via.placeholder.com/300/94a3b8/000000?text=GOKU+UI+SIGN',
        animations: GOKU_ANIMS
    },
    'vegeta_ultra_ego': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/7e22ce/ffffff?text=EGO',
        portraitUrl: 'https://via.placeholder.com/300/7e22ce/ffffff?text=VEGETA+EGO',
        animations: GOKU_ANIMS
    },
    'gohan_beast': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/ffffff/000000?text=BEAST',
        portraitUrl: 'https://via.placeholder.com/300/ffffff/000000?text=GOHAN+BEAST',
        animations: GOKU_ANIMS
    },
    'piccolo_orange': {
        defaultScale: 2.5,
        iconUrl: 'https://via.placeholder.com/64/ea580c/ffffff?text=ORANGE',
        portraitUrl: 'https://via.placeholder.com/300/ea580c/ffffff?text=PICCOLO+ORANGE',
        animations: GOKU_ANIMS
    },
    'cell_max': {
        defaultScale: 3.0,
        iconUrl: 'https://via.placeholder.com/64/dc2626/ffffff?text=MAX',
        portraitUrl: 'https://via.placeholder.com/300/dc2626/ffffff?text=CELL+MAX',
        animations: GOKU_ANIMS
    },
    'gamma_1': {
        defaultScale: 2.1,
        iconUrl: 'https://via.placeholder.com/64/ef4444/ffffff?text=G1',
        portraitUrl: 'https://via.placeholder.com/300/ef4444/ffffff?text=GAMMA+1',
        animations: GOKU_ANIMS
    },
    'gamma_2': {
        defaultScale: 2.1,
        iconUrl: 'https://via.placeholder.com/64/3b82f6/ffffff?text=G2',
        portraitUrl: 'https://via.placeholder.com/300/3b82f6/ffffff?text=GAMMA+2',
        animations: GOKU_ANIMS
    },
    'broly_fp': {
        defaultScale: 2.5,
        iconUrl: 'https://via.placeholder.com/64/16a34a/ffffff?text=BROLY',
        portraitUrl: 'https://via.placeholder.com/300/16a34a/ffffff?text=LEGENDARY+BROLY',
        animations: GOKU_ANIMS // Sharing for demo
    },
    'gogeta_blue': { // Character 3
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/2563eb/ffffff?text=GOGETA',
        portraitUrl: 'https://via.placeholder.com/300/2563eb/ffffff?text=GOGETA',
        animations: CHAR3_ANIMS
    },
    'vegito_blue': {
        defaultScale: 2.2,
        iconUrl: 'https://via.placeholder.com/64/3b82f6/ffffff?text=VEGITO',
        portraitUrl: 'https://via.placeholder.com/300/3b82f6/ffffff?text=VEGITO',
        animations: GOKU_ANIMS
    },
    'jiren': {
        defaultScale: 2.4,
        iconUrl: 'https://via.placeholder.com/64/ef4444/ffffff?text=JIREN',
        portraitUrl: 'https://via.placeholder.com/300/ef4444/ffffff?text=JIREN',
        animations: GOKU_ANIMS
    },
    'beerus': {
        defaultScale: 2.0,
        iconUrl: 'https://via.placeholder.com/64/7c3aed/ffffff?text=BEERUS',
        portraitUrl: 'https://via.placeholder.com/300/7c3aed/ffffff?text=BEERUS',
        animations: GOKU_ANIMS
    },
    'frieza_final': {
        defaultScale: 2.0,
        iconUrl: 'https://via.placeholder.com/64/ffffff/000000?text=FRIEZA',
        portraitUrl: 'https://via.placeholder.com/300/ffffff/000000?text=FRIEZA',
        animations: GOKU_ANIMS
    },
    'cell_perfect': {
        defaultScale: 2.3,
        iconUrl: 'https://via.placeholder.com/64/4ade80/ffffff?text=CELL',
        portraitUrl: 'https://via.placeholder.com/300/4ade80/ffffff?text=CELL',
        animations: GOKU_ANIMS
    },
    'buu_kid': {
        defaultScale: 1.8,
        iconUrl: 'https://via.placeholder.com/64/f472b6/ffffff?text=BUU',
        portraitUrl: 'https://via.placeholder.com/300/f472b6/ffffff?text=KID+BUU',
        animations: GOKU_ANIMS
    }
};

export const DEFAULT_SPRITE_SET: SpriteConfig = {
    defaultScale: 2.2,
    iconUrl: 'https://via.placeholder.com/64/000000/ffffff?text=CHAR',
    portraitUrl: 'https://via.placeholder.com/300/000000/ffffff?text=CHARACTER',
    animations: GOKU_ANIMS
};

export const SHIELD_ANIM_DATA = {
    imageUrl: SHIELD_SHEET,
    frames: 1,
    frameWidth: 128,
    frameHeight: 128
};
