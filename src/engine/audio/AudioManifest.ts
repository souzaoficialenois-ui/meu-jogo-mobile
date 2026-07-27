// src/engine/audio/AudioManifest.ts

export enum SoundCategory {
    BGM = 'bgm',
    SFX = 'sfx',
    VOICE = 'voice',
    UI = 'ui'
}

export enum AudioPriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2
}

export interface SoundDefinition {
    key: string;
    category: SoundCategory;
    fallbackUrl: string;
    defaultPriority: AudioPriority;
}

export const AUDIO_MANIFEST: Record<string, SoundDefinition> = {
    // UI Category Sounds
    click: {
        key: 'click',
        category: SoundCategory.UI,
        fallbackUrl: '/Assets/SONS/MENUS/CLICK.ogg',
        defaultPriority: AudioPriority.LOW
    },
    confirm: {
        key: 'confirm',
        category: SoundCategory.UI,
        fallbackUrl: '/Assets/SONS/MENUS/CONFIRMAR.ogg',
        defaultPriority: AudioPriority.LOW
    },
    cancel: {
        key: 'cancel',
        category: SoundCategory.UI,
        fallbackUrl: '/Assets/SONS/MENUS/VOLTAR.ogg',
        defaultPriority: AudioPriority.LOW
    },
    reveal: {
        key: 'reveal',
        category: SoundCategory.UI,
        fallbackUrl: '/Assets/SONS/MENUS/CONFIRMAR.ogg',
        defaultPriority: AudioPriority.LOW
    },

    // SFX Category Sounds (High intensity battle impacts, etc)
    punch: {
        key: 'punch',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/HIT.ogg',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_leve_1: {
        key: 'combo_leve_1',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/LEVE%201.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_leve_2: {
        key: 'combo_leve_2',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/LEVE%202.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_leve_3: {
        key: 'combo_leve_3',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/LEVE%203.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_medio_1: {
        key: 'combo_medio_1',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/MEDIO%201.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_medio_2: {
        key: 'combo_medio_2',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/MEDIO%202.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_medio_3: {
        key: 'combo_medio_3',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/MEDIO%203.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    combo_forte: {
        key: 'combo_forte',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/COMBATE/FORTE.wav',
        defaultPriority: AudioPriority.MEDIUM
    },
    attack: {
        key: 'attack',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/HIT.ogg',
        defaultPriority: AudioPriority.MEDIUM
    },
    block: {
        key: 'block',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/BLOCK.ogg',
        defaultPriority: AudioPriority.MEDIUM
    },
    charge: {
        key: 'charge',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/KI_CHARGE.ogg',
        defaultPriority: AudioPriority.LOW
    },
    dash: {
        key: 'dash',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/DASH.ogg',
        defaultPriority: AudioPriority.MEDIUM
    },
    ready: {
        key: 'ready',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/READY.ogg',
        defaultPriority: AudioPriority.HIGH
    },
    fight: {
        key: 'fight',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/FIGHT.ogg',
        defaultPriority: AudioPriority.HIGH
    },
    ko: {
        key: 'ko',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/KO.ogg',
        defaultPriority: AudioPriority.HIGH
    },
    summon: {
        key: 'summon',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/HIT.ogg',
        defaultPriority: AudioPriority.HIGH
    },
    victory: {
        key: 'victory',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/VICTORY.ogg',
        defaultPriority: AudioPriority.HIGH
    },
    defeat: {
        key: 'defeat',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/DEFEAT.ogg',
        defaultPriority: AudioPriority.HIGH
    },

    // New High Intensity Battle Narrator / Announcer Voices
    narrator_ready: {
        key: 'narrator_ready',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/READY.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_fight: {
        key: 'narrator_fight',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/FIGHT.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_change: {
        key: 'narrator_change',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/CHANG.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_nice_combo: {
        key: 'narrator_nice_combo',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/NICE.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_great_combo: {
        key: 'narrator_great_combo',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/GREAT.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_excellent_combo: {
        key: 'narrator_excellent_combo',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/EXCELENT.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_wonderful_power: {
        key: 'narrator_wonderful_power',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/WONDER%20FULL%20POWER.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    narrator_max_power: {
        key: 'narrator_max_power',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/MAXIMO%20POWER.m4a',
        defaultPriority: AudioPriority.MEDIUM
    },
    narrator_perfect: {
        key: 'narrator_perfect',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/NARRADOR/PERFECT.m4a',
        defaultPriority: AudioPriority.HIGH
    },

    // Action SFX Category Sounds (Ki charge, Jumps, Dragon Rush, Teleport, Guard Break)
    ki_charge_start: {
        key: 'ki_charge_start',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/CARREGANDO%20KI/INICIO.m4a',
        defaultPriority: AudioPriority.LOW
    },
    ki_charge_loop: {
        key: 'ki_charge_loop',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/CARREGANDO%20KI/LOOP.m4a',
        defaultPriority: AudioPriority.LOW
    },
    jump: {
        key: 'jump',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/PULO/PULO.m4a',
        defaultPriority: AudioPriority.MEDIUM
    },
    land: {
        key: 'land',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/PULO/CAIU%20NO%20CHAO.m4a',
        defaultPriority: AudioPriority.MEDIUM
    },
    dragon_rush_inicio: {
        key: 'dragon_rush_inicio',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/DRAGON%20RUSH/INICIO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    dragon_rush_combo: {
        key: 'dragon_rush_combo',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/DRAGON%20RUSH/COMBO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    dragon_rush_final: {
        key: 'dragon_rush_final',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/DRAGON%20RUSH/FINAL.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    teleport: {
        key: 'teleport',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/TELEPORTE/TELEPORTE.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    guard_break: {
        key: 'guard_break',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/DEFESA/ROMPIDA.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_kamehameha_inicio: {
        key: 'goku_base_kamehameha_inicio',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ESPECIAL%201/KAMEHAMEHA%20INICIO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_kamehameha_lancado: {
        key: 'goku_base_kamehameha_lancado',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ESPECIAL%201/KAMEHAMEHA%20LANCADO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_genkidama_inicio: {
        key: 'goku_base_genkidama_inicio',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ULTIMATE%202/INICIO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_genkidama_criando: {
        key: 'goku_base_genkidama_criando',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ULTIMATE%202/CRIANDO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_genkidama_colisao: {
        key: 'goku_base_genkidama_colisao',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ULTIMATE%202/COLISAO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_base_genkidama_explosao: {
        key: 'goku_base_genkidama_explosao',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BASE/ULTIMATE%202/EXPLOS%C3%83O.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_black_rose_intro_inicio: {
        key: 'goku_black_rose_intro_inicio',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BLACK%20ROSE/INTRODU%C3%87%C3%83O/INICIO.m4a',
        defaultPriority: AudioPriority.HIGH
    },
    goku_black_rose_intro_final: {
        key: 'goku_black_rose_intro_final',
        category: SoundCategory.SFX,
        fallbackUrl: '/Assets/SONS/EFEITOS/GOKU%20BLACK%20ROSE/INTRODU%C3%87%C3%83O/FINAL.m4a',
        defaultPriority: AudioPriority.HIGH
    },

    // BGM Background Tracks
    bgm_menu: {
        key: 'bgm_menu',
        category: SoundCategory.BGM,
        fallbackUrl: '/Assets/SONS/MENUS/SELE%C3%87%C3%83O%20DE%20PERSONAGEM.ogg',
        defaultPriority: AudioPriority.LOW
    },
    bgm_battle: {
        key: 'bgm_battle',
        category: SoundCategory.BGM,
        fallbackUrl: '/Assets/SONS/MUSICAS%20BATALHA/hits%20theme.ogg',
        defaultPriority: AudioPriority.LOW
    },
    bgm_summon: {
        key: 'bgm_summon',
        category: SoundCategory.BGM,
        fallbackUrl: '/Assets/SONS/MUSICAS%20BATALHA/ultra%20instinct%20gokus%20theme.ogg',
        defaultPriority: AudioPriority.LOW
    },
    bgm_char_select: {
        key: 'bgm_char_select',
        category: SoundCategory.BGM,
        fallbackUrl: '/Assets/SONS/MENUS/SELE%C3%87%C3%83O%20DE%20PERSONAGEM.ogg',
        defaultPriority: AudioPriority.LOW
    }
};

export const MAX_CHANNELS = 24; // Limit Howler instances playing in parallel to save lower/mid Android specs from core crashes
export const ANTISPAM_LIMIT_MS = 25; // Discard clicks occurring faster than this
export const TYPE_LIMITS: Record<string, number> = {
    punch: 4,
    attack: 4,
    block: 3,
    dash: 3,
    charge: 1, // Only 1 aura humming at once
    aura: 1
};
