
import { CharacterData, RarityTier, Banner, SpriteConfig, PlayerState } from './types';
import { SPRITE_DB, DEFAULT_SPRITE_SET } from './constants/SpriteDatabase';
export const CHARACTER_FAMILIES: Record<string, string[]> = {
    'goku_base': ['goku_ssj', 'goku_blue', 'goku_mui'],
    'frieza_final': [],
    'kuririn': [],
    'broly_ikari': [],
    'goku_mui': [],
    'gogeta_ssj4': [],
    'goku_ssj': [],
    'goku_blue': [],
    'teen_gohan_ssj2': [],
    'trunks_ssj2': [],
    'vegeta_ssj_majin': []
};

export const BASE_ROSTER_IDS = Object.keys(CHARACTER_FAMILIES);

export { BASE_CHARACTERS, AVATAR_LIST, BACKGROUND_LIST } from './personagens/CharacterDatabase';

export const APP_VERSION = "1.0.0";

// World Dimensions
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 1000;
export const GROUND_Y = 150; 

// Physics
export let GRAVITY = 0.8;
export let FRICTION = 0.85;
export let MOVE_SPEED = 5.6;
export let JUMP_FORCE = 22;
// Player Spawning
export let SPAWN_CENTER_OFFSET = 300; 

// Player
export let PLAYER_WIDTH = 100;
export let PLAYER_HEIGHT = 180;
export let MAX_HP = 1500;

// KI SYSTEM (New)
export let MAX_KI = 700; // 7 Bars
export let KI_CHARGE_RATE = 2.5; // Per frame when charging
export let KI_GAIN_ON_HIT = 25; // Gain on landing a hit
export let KI_GAIN_ON_DAMAGE = 15; // Gain when receiving a hit
export let KI_COST_SPECIAL = 100; // Cost for special beam (Level 1)

// KI BLAST SYSTEM (New)
export let KI_BLAST_COST = 40; // Cost per ball
export let KI_BLAST_SPEED = 18;
export let KI_BLAST_DAMAGE = 35;
export let KI_BLAST_COOLDOWN = 15; // Frames between shots
export let MAX_PROJECTILES = 3; // Max active per player
export let PROJECTILE_SIZE = 30;

// Guard System
export let MAX_GUARD = 100;
export let GUARD_REGEN_RATE = 0.5; // Per frame
export let GUARD_REGEN_DELAY = 60; // Frames before regen starts
export let GUARD_BREAK_STUN = 120; // Frames stunned after break (2 seconds at 60fps)
export let CHIP_DAMAGE_PERCENT = 0.1; // 10% damage through block

// Combat
export let MAX_COMBO = 3;
export let ATTACK_COOLDOWN = 20; 
export let ATTACK_DURATION = 15; 
export let COMBO_WINDOW = 40; 
export let ATTACK_WIDTH = 90;
export let ATTACK_HEIGHT = 45;
export let ATTACK_OFFSET_X = 45;
export let ATTACK_OFFSET_Y = 30;
export let STUN_DURATION = 20;
export let STUN_DURATION_LIGHT = 10; // For Ki Blasts

// Damage & Knockback
export let DAMAGE_TIER_1 = 30;
export let DAMAGE_TIER_2 = 45;
export let DAMAGE_TIER_3 = 90;
export let KNACKBACK_X = 15;
export let KNACKBACK_Y = 10;
export let KNOCKBACK_FINISHER_X = 40;
export let KNOCKBACK_FINISHER_Y = 25;

// Stats Multipliers
export let STAT_DMG_MULT = 0.02; 
export let STAT_DEF_MULT = 0.01; 
export let STAT_SPD_MULT = 0.015;

export const applyEngineOverrides = (overrides: any) => {
    if (!overrides) return;
    if (overrides.GRAVITY !== undefined) GRAVITY = overrides.GRAVITY;
    if (overrides.FRICTION !== undefined) FRICTION = overrides.FRICTION;
    if (overrides.MOVE_SPEED !== undefined) MOVE_SPEED = overrides.MOVE_SPEED;
    if (overrides.JUMP_FORCE !== undefined) JUMP_FORCE = overrides.JUMP_FORCE;
    if (overrides.MAX_HP !== undefined) MAX_HP = overrides.MAX_HP;
    if (overrides.MAX_KI !== undefined) MAX_KI = overrides.MAX_KI;
    if (overrides.KI_CHARGE_RATE !== undefined) KI_CHARGE_RATE = overrides.KI_CHARGE_RATE;
    if (overrides.KI_GAIN_ON_HIT !== undefined) KI_GAIN_ON_HIT = overrides.KI_GAIN_ON_HIT;
    if (overrides.KI_GAIN_ON_DAMAGE !== undefined) KI_GAIN_ON_DAMAGE = overrides.KI_GAIN_ON_DAMAGE;
    if (overrides.KI_COST_SPECIAL !== undefined) KI_COST_SPECIAL = overrides.KI_COST_SPECIAL;
    if (overrides.KI_BLAST_COST !== undefined) KI_BLAST_COST = overrides.KI_BLAST_COST;
    if (overrides.KI_BLAST_SPEED !== undefined) KI_BLAST_SPEED = overrides.KI_BLAST_SPEED;
    if (overrides.KI_BLAST_DAMAGE !== undefined) KI_BLAST_DAMAGE = overrides.KI_BLAST_DAMAGE;
    if (overrides.KI_BLAST_COOLDOWN !== undefined) KI_BLAST_COOLDOWN = overrides.KI_BLAST_COOLDOWN;
    if (overrides.MAX_GUARD !== undefined) MAX_GUARD = overrides.MAX_GUARD;
    if (overrides.GUARD_REGEN_RATE !== undefined) GUARD_REGEN_RATE = overrides.GUARD_REGEN_RATE;
    if (overrides.GUARD_REGEN_DELAY !== undefined) GUARD_REGEN_DELAY = overrides.GUARD_REGEN_DELAY;
    if (overrides.GUARD_BREAK_STUN !== undefined) GUARD_BREAK_STUN = overrides.GUARD_BREAK_STUN;
    if (overrides.CHIP_DAMAGE_PERCENT !== undefined) CHIP_DAMAGE_PERCENT = overrides.CHIP_DAMAGE_PERCENT;
    if (overrides.MAX_COMBO !== undefined) MAX_COMBO = overrides.MAX_COMBO;
    if (overrides.DAMAGE_TIER_1 !== undefined) DAMAGE_TIER_1 = overrides.DAMAGE_TIER_1;
    if (overrides.DAMAGE_TIER_2 !== undefined) DAMAGE_TIER_2 = overrides.DAMAGE_TIER_2;
    if (overrides.DAMAGE_TIER_3 !== undefined) DAMAGE_TIER_3 = overrides.DAMAGE_TIER_3;
};

// Sprites & Camera
export const SPRITE_IDLE_URL = '/Assets/ui/logo/logojogo.png';
export const SPRITE_FRAME_SIZE = 128;
export const ANIMATION_SPEED = 4;
export const SPRITE_SCALE = 2.2;
export const CAM_MIN_ZOOM = 0.7;
export const CAM_MAX_ZOOM = 1.3;
export const CAM_ZOOM_SPEED = 0.05;
export const CAM_PADDING_X = 640;

// Colors
export const P1_COLOR = '#ef4444'; 
export const P2_COLOR = '#3b82f6'; 
export const GROUND_COLOR = '#334155'; 
export const BACKGROUND_COLOR = '#0f172a'; 

// Economy & RPG
export const BASE_XP_REQ = 100;
export const XP_MULTIPLIER = 1.2; 
export const DUPLICATE_XP_REWARD = 250; 
export const MAX_STAT_POINTS = 50;
export const GACHA_COST = 100; // Cost in Gems
export const GACHA_BULK_COST = 1000; // Cost for 10 Spins (Gems)
export const WIN_REWARD = 50;

// Shop Prices
export const SHOP_PRICES: Record<RarityTier, number> = {
    COMMON: 5000,
    RARE: 8000,
    EPIC: 10000,
    LEGENDARY: 15000,
    ETERNAL: 25000
};

export const EVOLUTION_CRYSTALS: Record<string, string> = {
  goku_base: '/Assets/ui/Cristais de Evolucao/Goku_Base.png',
  kuririn: '/Assets/ui/Cristais de Evolucao/Kuririn.png',
  frieza_final: '/Assets/ui/Cristais de Evolucao/Freeza.png',
  trunks_ssj2: '/Assets/ui/Cristais de Evolucao/Trunks_Ssj2.png',
  goku_ssj: '/Assets/ui/Cristais de Evolucao/Goku_Ssj.png',
  goku_mui: '/Assets/ui/Cristais de Evolucao/Goku_Mui.png',
  gogeta_ssj4: '/Assets/ui/Cristais de Evolucao/Gogeta_Ssj4.png',
  goku_blue: '/Assets/ui/Cristais de Evolucao/Goku_Blue.png',
  teen_gohan_ssj2: '/Assets/ui/Cristais de Evolucao/Teen_Gohan_Ssj2.png',
  broly_ikari: '/Assets/ui/Cristais de Evolucao/Broly_Ikari.png',
  vegeta_ssj_majin: '/Assets/ui/Cristais de Evolucao/Trunks_Ssj2.png'
};

export const RESOURCE_SPRITES: Record<string, string> = {
  ...EVOLUTION_CRYSTALS,
  UNIVERSAL: '/Assets/ui/Cristais de Evolucao/Universal.png',
  curr_coins: '/Assets/ui/moeda.png',
  curr_gems: '/Assets/ui/diamante.png',
  curr_tickets: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  curr_roulette: '/Assets/ui/gacha/moeda_gacha.png',
  token_standard: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  token_eternal: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  token_legendary: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  token_items: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  TICKET_10: '/Assets/ui/gacha/ticket_gacha_10_giros.png',
  COIN: '/Assets/ui/moeda.png',
  GEM: '/Assets/ui/diamante.png',
  TICKET: '/Assets/ui/gacha/ticket_gachas_1_giro.png',
  XP: '/Assets/ui/xp.png',
  ready: '/Assets/ui/ready.png',
  fight: '/Assets/ui/fight.png',
  ko: '/Assets/ui/ko.gif',
  vs: '/Assets/ui/vs.gif',
  LOGO: '/Assets/ui/logo/logojogo.png',
  TITLE_LEGEND: '/Assets/ui/Titulos/Fighter Legend.png'
};

// --- RARITY SYSTEM ---
export const RARITY_INFO: Record<RarityTier, { color: string, border: string, glow: string, bg: string }> = {
    COMMON: { 
        color: '#9ca3af', // Gray-400
        border: 'border-slate-500', 
        glow: 'shadow-slate-500/50',
        bg: 'bg-slate-800'
    },
    RARE: { 
        color: '#3b82f6', // Blue-500
        border: 'border-blue-500', 
        glow: 'shadow-blue-500/50',
        bg: 'bg-blue-900'
    },
    EPIC: { 
        color: '#a855f7', // Purple-500
        border: 'border-purple-500', 
        glow: 'shadow-purple-500/50',
        bg: 'bg-purple-900'
    },
    LEGENDARY: { 
        color: '#eab308', // Yellow-500
        border: 'border-yellow-500', 
        glow: 'shadow-yellow-500/80',
        bg: 'bg-yellow-900'
    },
    ETERNAL: {
        color: '#ef4444', // Red-500
        border: 'border-red-500',
        glow: 'shadow-red-500/80',
        bg: 'bg-red-950'
    }
};

// --- BANNERS ---
export const BANNERS: Banner[] = [
    {
        id: 'banner_standard',
        title: 'Goku Super Saiyajin',
        description: 'Contém personagens de todas as sagas. Taxas equilibradas.',
        color: 'from-blue-900 to-slate-900',
        featuredCharId: 'goku_ssj',
        type: 'STANDARD',
        img: '/Assets/fundosdastelas/fundobanner/b1.png'
    },
    {
        id: 'banner_epic',
        title: 'Broly Fúria Incontrolável',
        description: 'Chances aumentadas para personagens ÉPICOS!',
        color: 'from-green-900 to-slate-900',
        featuredCharId: 'broly_ikari',
        type: 'EPIC',
        img: '/Assets/fundosdastelas/fundobanner/b1.png'
    },
    {
        id: 'banner_legendary',
        title: 'Goku Super Saiyajin Blue',
        description: 'Alta chance para personagens de raridade LENDÁRIA!',
        color: 'from-yellow-900 to-slate-900',
        featuredCharId: 'goku_blue',
        type: 'LEGENDARY',
        img: '/Assets/fundosdastelas/fundobanner/b2.png'
    },
    {
        id: 'eternal_characters',
        title: 'Goku Instinto Superior Completo',
        description: 'Os guerreiros mais poderosos de todos os universos!',
        color: 'from-cyan-900 to-slate-900',
        featuredCharId: 'goku_mui',
        type: 'EVENT',
        img: '/Assets/fundosdastelas/fundobanner/b2.png'
    },
    {
        id: 'rare_items',
        title: 'ROULETTE DE ITENS',
        description: 'Avatares, Fundos, Cenários e Moedas Gacha!',
        color: 'from-purple-900 to-slate-900',
        featuredCharId: 'avatar_1',
        type: 'EVENT',
        img: '/Assets/fundosdastelas/fundobanner/b3.png'
    }
];


