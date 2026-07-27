import { CharacterData, PlayerState } from "../types";

const URLS = {
  agachado: "/Assets/personagens/vegetassjmajin/agachado.gif",
  aterrisando: "/Assets/personagens/vegetassjmajin/aterrisando.gif",
  caindo: "/Assets/personagens/vegetassjmajin/caindo.gif",
  carregando_ki_1: "/Assets/personagens/vegetassjmajin/carregando_ki_start.gif",
  carregando_ki_2: "/Assets/personagens/vegetassjmajin/carregando_ki_loop.gif",
  carregando_ki_3: "/Assets/personagens/vegetassjmajin/carregando_ki_end.gif",

  hit_light: "/Assets/personagens/vegetassjmajin/hit_light.gif",
  hit_medium: "/Assets/personagens/vegetassjmajin/hit_medium.gif",
  hit_heavy: "/Assets/personagens/vegetassjmajin/hit_heavy.gif",
  hit_air: "/Assets/personagens/vegetassjmajin/hit_air.gif",
  hit_launch: "/Assets/personagens/vegetassjmajin/hit_launch.gif",
  hit_bounce: "/Assets/personagens/vegetassjmajin/hit_bounce.gif",
  hit_grabbed: "/Assets/personagens/vegetassjmajin/hit_grabbed.gif",
  hit_ground_stun: "/Assets/personagens/vegetassjmajin/hit_ground_stun.gif",
  hit_ground_recover: "/Assets/personagens/vegetassjmajin/hit_ground_recover.gif",
  hit_ground_push_up: "/Assets/personagens/vegetassjmajin/hit_ground_push_up.gif",
  hit_ground_launch: "/Assets/personagens/vegetassjmajin/hit_ground_launch.gif",
  hit_ground_crash: "/Assets/personagens/vegetassjmajin/hit_ground_crash.gif",
  hit_air_fall: "/Assets/personagens/vegetassjmajin/hit_air_fall.gif",

  stand_light_1: "/Assets/personagens/vegetassjmajin/stand_light_1.gif",
  stand_light_2: "/Assets/personagens/vegetassjmajin/stand_light_2.gif",
  stand_light_3: "/Assets/personagens/vegetassjmajin/stand_light_3.gif",
  stand_medium_1: "/Assets/personagens/vegetassjmajin/stand_medium_1.gif",
  stand_heavy_1: "/Assets/personagens/vegetassjmajin/stand_heavy_1.gif",
  crouch_light_1: "/Assets/personagens/vegetassjmajin/crouch_light_1.gif",
  crouch_medium_1: "/Assets/personagens/vegetassjmajin/crouch_medium_1.gif",
  crouch_heavy_1_1: "/Assets/personagens/vegetassjmajin/crouch_heavy_1_1.gif",
  crouch_heavy_1_2: "/Assets/personagens/vegetassjmajin/crouch_heavy_1_2.gif",
  crouch_heavy_1_3: "/Assets/personagens/vegetassjmajin/crouch_heavy_1_3.gif",
  air_light_1: "/Assets/personagens/vegetassjmajin/air_light_1.gif",
  air_medium_1: "/Assets/personagens/vegetassjmajin/air_medium_1.gif",
  air_heavy_1: "/Assets/personagens/vegetassjmajin/air_heavy_1.gif",

  defesa: "/Assets/personagens/vegetassjmajin/defesa.gif",
  defesa_agachado: "/Assets/personagens/vegetassjmajin/defesa_agachado.gif",
  defesa_ar: "/Assets/personagens/vegetassjmajin/defesa_ar.gif",
  dragon_rush_1: "/Assets/personagens/vegetassjmajin/dragon_rush_start.gif",
  dragon_rush_2: "/Assets/personagens/vegetassjmajin/dragon_rush_combo.gif",
  dragon_rush_3: "/Assets/personagens/vegetassjmajin/dragon_rush_follow.gif",
  entrada_por_ko: "/Assets/personagens/vegetassjmajin/troca_por_ko.gif",
  frente: "/Assets/personagens/vegetassjmajin/frente.gif",
  parado: "/Assets/personagens/vegetassjmajin/parado.gif",
  pulo: "/Assets/personagens/vegetassjmajin/pulo.gif",
  super_dash_1: "/Assets/personagens/vegetassjmajin/super_dash_1.gif",
  super_dash_2: "/Assets/personagens/vegetassjmajin/super_dash_2.gif",
  tras: "/Assets/personagens/vegetassjmajin/tras.gif",
  sparking: "/Assets/personagens/vegetassjmajin/sparking.gif",
};

const createGifAnim = (
  url: string,
  loop: boolean = true,
  speed: number = 5,
) => ({
  imageUrl:
    url ||
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  frames: 1,
  frameWidth: 0,
  frameHeight: 0,
  isGif: true,
  speed,
  loop,
  scale: 2.2,
});

export const VegetaSSJMajin: CharacterData = {
  id: "vegeta_ssj_majin",
  name: "VEGETA (MAJIN)",
  color: "#3b82f6",
  rarity: "LEGENDARY",
  tags: ["SAIYAN", "MAJIN", "ELITE"],
  level: 1,
  currentXp: 0,
  xpToNextLevel: 100,
  availablePoints: 0,
  stats: {
    attack: 18,
    defense: 15,
    speed: 16,
  },

  spriteConfig: {
    defaultScale: 2.2,
    portraitUrl: "/Assets/personagens/vegetassjmajin/parado.gif",
    iconUrl: "/Assets/personagens/vegetassjmajin/parado.gif",
    hitboxWidth: 50,
    hitboxHeight: 100,
    hitboxOffsetX: 35,
    hitboxOffsetY: 70,
    animations: {
      [PlayerState.IDLE]: createGifAnim(URLS.parado, true),
      [PlayerState.RUNNING]: createGifAnim(URLS.frente, true),
      [PlayerState.WALK_BACKWARD]: createGifAnim(URLS.tras, true),
      [PlayerState.CROUCH]: createGifAnim(URLS.agachado, true),
      [PlayerState.JUMPING]: createGifAnim(URLS.pulo, false),
      [PlayerState.FALLING]: createGifAnim(URLS.pulo, true),
      FALLING_LOOP: createGifAnim(URLS.pulo, true),
      [PlayerState.LANDING]: createGifAnim(URLS.aterrisando, false),

      [PlayerState.BLOCKING]: createGifAnim(URLS.defesa, true),
      Defesa_Agachado: createGifAnim(URLS.defesa_agachado, true),
      Defesa_Ar: createGifAnim(URLS.defesa_ar, true),

      KI_BLAST_1: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_1_ar.gif", false),
      KI_BLAST_2: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_2_ar.gif", false),
      KI_BLAST_AR_1: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_1_ar.gif", false),
      KI_BLAST_AR_2: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_2_ar.gif", false),

      Especial_1_1: createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_1.gif", false),
      Especial_1_2: {
        ...createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_2.gif", false),
        createsBeam: "CHAVE_BEAM_47",
      },
      Especial_1_3: createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_3.gif", false),

      Especial_2_1: createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_1.gif", false),
      Especial_2_2: {
        ...createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_2.gif", false),
        createsBeam: "CHAVE_BEAM_47",
      },
      Especial_2_3: createGifAnim("/Assets/personagens/vegetassjmajin/especial_2_3.gif", false),

      Especial_Air_1: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_1_ar.gif", false),
      Especial_Air_2: createGifAnim("/Assets/personagens/vegetassjmajin/especial_kiblast_2_ar.gif", false),

      [PlayerState.HIT]: createGifAnim(URLS.hit_light, false),
      [PlayerState.HIT_2]: createGifAnim(URLS.hit_medium, false),
      [PlayerState.HIT_3]: createGifAnim(URLS.hit_heavy, false),
      HIT_HIGH_LIGHT: createGifAnim(URLS.hit_light, false),
      HIT_HIGH_MEDIUM: createGifAnim(URLS.hit_medium, false),
      HIT_HIGH_HARD: createGifAnim(URLS.hit_heavy, false),
      HIT_LOW_LIGHT: createGifAnim(URLS.hit_light, false),
      HIT_LOW_HARD: createGifAnim(URLS.hit_medium, false),
      CROUCH_HIT: createGifAnim(URLS.hit_light, false),
      AIR_HIT: createGifAnim(URLS.hit_air, false),
      AIR_HIT_START: createGifAnim(URLS.hit_heavy, false),
      AIR_HIT_FALL: createGifAnim(URLS.hit_air_fall, true),
      HIT_BOUNCE: createGifAnim(URLS.hit_bounce, false),
      HIT_LAUNCH: createGifAnim(URLS.hit_launch, false),
      HIT_GRABBED: createGifAnim(URLS.hit_grabbed, true),
      HIT_GROUND_STUN: createGifAnim(URLS.hit_ground_stun, true),
      HIT_GROUND_RECOVER: createGifAnim(URLS.hit_ground_recover, false),
      HIT_GROUND_PUSH_UP: createGifAnim(URLS.hit_ground_push_up, false),
      HIT_GROUND_LAUNCH: createGifAnim(URLS.hit_ground_launch, false),
      HIT_GROUND_CRASH: createGifAnim(URLS.hit_ground_crash, false),

      STAND_LIGHT_1: createGifAnim(URLS.stand_light_1, false),
      STAND_LIGHT_2: createGifAnim(URLS.stand_light_2, false),
      STAND_LIGHT_3: createGifAnim(URLS.stand_light_3, false),
      STAND_MEDIUM_1: createGifAnim(URLS.stand_medium_1, false),
      STAND_HEAVY_1: createGifAnim(URLS.stand_heavy_1, false),
      CROUCH_LIGHT_1: createGifAnim(URLS.crouch_light_1, false),
      CROUCH_MEDIUM_1: createGifAnim(URLS.crouch_medium_1, false),
      CROUCH_HEAVY_1_1: { ...createGifAnim(URLS.crouch_heavy_1_1, false), dealsDamage: false },
      CROUCH_HEAVY_1_2: { ...createGifAnim(URLS.crouch_heavy_1_2, false), dealsDamage: true },
      CROUCH_HEAVY_1_3: { ...createGifAnim(URLS.crouch_heavy_1_3, false), dealsDamage: false },
      AIR_LIGHT_1: createGifAnim(URLS.air_light_1, false),
      AIR_MEDIUM_1: createGifAnim(URLS.air_medium_1, false),
      AIR_HEAVY_1: createGifAnim(URLS.air_heavy_1, false),

      GROUND_BOUNCE: createGifAnim(URLS.hit_bounce, false),
      FALL: createGifAnim(URLS.pulo, true),
      [PlayerState.FALLING_HIT]: createGifAnim(URLS.hit_air_fall, true),
      [PlayerState.FALLING_HIT_GROUND]: createGifAnim(URLS.hit_ground_crash, false),
      LANDING_FALL: createGifAnim(URLS.aterrisando, false),
      GROUND_HIT: createGifAnim(URLS.hit_ground_crash, false),
      [PlayerState.LAUNCHED]: createGifAnim(URLS.hit_launch, false),
      [PlayerState.STUNNED]: createGifAnim(URLS.hit_ground_stun, true),
      [PlayerState.GUARD_BREAK]: createGifAnim(URLS.hit_heavy, false),
      [PlayerState.KNOCKED_DOWN]: createGifAnim(URLS.hit_ground_crash, false),
      [PlayerState.GROUND_RECOVERY]: createGifAnim(URLS.hit_ground_recover, false),

      GET_UP_START: createGifAnim(URLS.hit_ground_push_up, false),
      GET_UP_MIDDLE: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_END: createGifAnim(URLS.parado, false),
      GET_UP: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_AIR: createGifAnim(URLS.hit_air, false),
      DOWN_LYING_DOWN: createGifAnim(URLS.hit_ground_crash, true),

      [PlayerState.DASH_START]: createGifAnim(URLS.super_dash_1, false),
      [PlayerState.DASHING]: createGifAnim(URLS.super_dash_2, true),
      [PlayerState.DASH_END]: createGifAnim(URLS.super_dash_2, false),
      TAG_IN_KO: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.SUPER_DASH]: createGifAnim(URLS.super_dash_1, true, 5),
      [PlayerState.DRAGON_RUSH]: createGifAnim(URLS.dragon_rush_1, false),
      [PlayerState.DRAGON_COMBO]: createGifAnim(URLS.dragon_rush_2, false),
      [PlayerState.DRAGON_DASH_FOLLOW]: createGifAnim(URLS.dragon_rush_3, false),
      dragon_rush_2: createGifAnim(URLS.dragon_rush_2, false),
      dragon_rush_3: createGifAnim(URLS.dragon_rush_3, false),

      [PlayerState.CHARGE_START]: createGifAnim(URLS.carregando_ki_1, false),
      [PlayerState.CHARGING]: createGifAnim(URLS.carregando_ki_2, true),
      [PlayerState.CHARGE_END]: createGifAnim(URLS.carregando_ki_3, false),
      [PlayerState.SPARKING]: createGifAnim(URLS.sparking, false),

      INTRO_1: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_1.gif", false),
      INTRO_2: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_2.gif", false),
      INTRO_3: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_3.gif", false),
      INTRO_4: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_4.gif", false),
      INTRO_5: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_5.gif", false),
      INTRO_6: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_6.gif", false),
      INTRO_7: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_7.gif", false),
      INTRO_8: createGifAnim("/Assets/personagens/vegetassjmajin/intro_1_8.gif", false),

      ULTIMATE_1_1: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_1.gif", false),
      ULTIMATE_1_2: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_2.gif", false),
      ULTIMATE_1_3: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_3.gif", false),
      ULTIMATE_1_4: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_4.gif", false),
      ULTIMATE_1_5: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate1_5.gif", false),
      ULTIMATE_1_6: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_6.gif", false),
      ULTIMATE_1_7: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_1_7.gif", false),

      ULTIMATE_2_1: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_1.gif", false),
      ULTIMATE_2_2: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_2.gif", false),
      ULTIMATE_2_3: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_3.gif", false),
      ULTIMATE_2_4: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_4.gif", false),
      ULTIMATE_2_5: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_5.gif", false),
      ULTIMATE_2_6: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_6.gif", false),
      ULTIMATE_2_7: createGifAnim("/Assets/personagens/vegetassjmajin/ultimate_2_7.gif", false),
      [PlayerState.STANDBY]: createGifAnim(URLS.parado, true),
      [PlayerState.TAG_IN]: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.TAG_OUT]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_ENTRY]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_EXIT]: createGifAnim(URLS.parado, false),
      [PlayerState.VICTORY]: createGifAnim(URLS.parado, false),
    },
  },

  skills: [
    {
      id: "final_explosion",
      name: "Explosão Final",
      type: "PRIMARY",
      description: "O sacrifício final do Príncipe dos Saiyajins.",
    },
  ],
  phasedMoves: {
    'STAND_LIGHT_1': {
        id: 'STAND_LIGHT_1',
        phases: [{ animation: 'STAND_LIGHT_1', duration: 12, hitboxActive: true, damage: 5, moveX: 2, sfxName: 'attack_light' }]
    },
    'STAND_LIGHT_2': {
        id: 'STAND_LIGHT_2',
        phases: [{ animation: 'STAND_LIGHT_2', duration: 12, hitboxActive: true, damage: 5, moveX: 2, sfxName: 'attack_light' }]
    },
    'STAND_LIGHT_3': {
        id: 'STAND_LIGHT_3',
        phases: [{ animation: 'STAND_LIGHT_3', duration: 18, hitboxActive: true, damage: 10, moveX: 10, launchOpponent: { x: 40, y: 0 }, shakeIntensity: 2, sfxName: 'attack_medium' }]
    },
    'STAND_MEDIUM_1': {
        id: 'STAND_MEDIUM_1',
        phases: [{ animation: 'STAND_MEDIUM_1', duration: 15, hitboxActive: true, damage: 12, moveX: 4, sfxName: 'attack_medium' }]
    },
    'STAND_HEAVY': {
        id: 'STAND_HEAVY',
        phases: [
            { animation: 'STAND_HEAVY_1', duration: 25, hitboxActive: true, damage: 18, moveX: 12, launchOpponent: { x: 50, y: 0 }, shakeIntensity: 4, sfxName: 'attack_heavy' }
        ]
    },
    'CROUCH_LIGHT': {
        id: 'CROUCH_LIGHT',
        phases: [{ animation: 'CROUCH_LIGHT_1', duration: 15, hitboxActive: true, damage: 6, sfxName: 'attack_light' }]
    },
    'CROUCH_MEDIUM': {
        id: 'CROUCH_MEDIUM',
        phases: [{ animation: 'CROUCH_MEDIUM_1', duration: 18, hitboxActive: true, damage: 12, knockdown: true, sfxName: 'attack_medium' }]
    },
    'CROUCH_HEAVY': {
        id: 'CROUCH_HEAVY',
        phases: [
            { animation: 'CROUCH_HEAVY_1_1', duration: 15, hitboxActive: false, damage: 0 }, 
            { 
                animation: 'CROUCH_HEAVY_1_2', 
                duration: 25, 
                hitboxActive: true, 
                damage: 15, 
                launchOpponent: { x: 40, y: -60 }, 
                velocityJump: { x: 12, y: -7.2 }, 
                sfxName: 'attack_heavy',
                attackBoxWidth: 80,
                attackBoxHeight: 80,
                attackBoxOffsetX: 50,
                attackBoxOffsetY: 10,
                armor: true
            }, 
            { animation: 'CROUCH_HEAVY_1_3', duration: 20, hitboxActive: false, damage: 0 } 
        ]
    },
    'AIR_LIGHT': {
        id: 'AIR_LIGHT',
        phases: [{ animation: 'AIR_LIGHT_1', duration: 12, hitboxActive: true, damage: 6, velocityJump: { x: 4, y: -6 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_light' }]
    },
    'AIR_MEDIUM': {
        id: 'AIR_MEDIUM',
        phases: [{ animation: 'AIR_MEDIUM_1', duration: 18, hitboxActive: true, damage: 12, velocityJump: { x: 6, y: -8 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_medium' }]
    },
    'AIR_HEAVY': {
        id: 'AIR_HEAVY',
        phases: [{ animation: 'AIR_HEAVY_1', duration: 22, hitboxActive: true, damage: 20, velocityJump: { x: 4, y: -4 }, launchOpponent: { x: 20, y: 45 }, suspendGravity: true, sfxName: 'attack_heavy' }]
    },
    'KI_BLAST': {
        id: 'KI_BLAST',
        phases: [
            { animation: 'KI_BLAST_1', duration: 10 },
            { animation: 'KI_BLAST_2', duration: 15, hitboxActive: true, damage: 6, projectile: 'KI_BLAST', sfxName: 'kiblast' }
        ]
    },
    'KI_BLAST_AR': {
        id: 'KI_BLAST_AR',
        phases: [
            { animation: 'KI_BLAST_AR_1', duration: 10 },
            { animation: 'KI_BLAST_AR_2', duration: 15, hitboxActive: true, damage: 6, projectile: 'KI_BLAST', sfxName: 'kiblast' }
        ]
    },
    'DRAGON_RUSH': {
        id: 'DRAGON_RUSH',
        phases: [
            { animation: 'dragon_rush_1', duration: 15, homing: true, sfxName: 'dash' },
            { animation: 'dragon_rush_2', duration: 35, snapOpponent: true, damage: 10, sfxName: 'attack_medium' },
            { animation: 'dragon_rush_3', duration: 30, hitboxActive: true, damage: 20, launchOpponent: { x: 25, y: -10 }, shakeIntensity: 5, sfxName: 'attack_heavy' }
        ]
    },
    'SPECIAL_1': {
        id: 'SPECIAL_1',
        phases: [
            { animation: 'Especial_1_1', duration: 15, sfxName: 'charge_special' },
            { animation: 'Especial_1_2', duration: 100, damage: 45, createsBeam: "CHAVE_BEAM_47", shakeIntensity: 6 },
            { animation: 'Especial_1_3', duration: 20 }
        ]
    },
    'SPECIAL_2': {
        id: 'SPECIAL_2',
        phases: [
            { animation: 'Especial_2_1', duration: 15 },
            { animation: 'Especial_2_2', duration: 80, damage: 40, createsBeam: "CHAVE_BEAM_47", shakeIntensity: 5 },
            { animation: 'Especial_2_3', duration: 20 }
        ]
    }
  }
};
