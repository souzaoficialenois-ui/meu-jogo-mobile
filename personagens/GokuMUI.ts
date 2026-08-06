import { CharacterData, PlayerState } from "../types";

const URLS = {
  agachado: "/Assets/personagens/gokumui/agachado.gif",
  aterrisando: "/Assets/personagens/gokumui/aterrisando.gif",
  pulo: "/Assets/personagens/gokumui/pulo.gif",
  carregando_ki_1: "/Assets/personagens/gokumui/carregando_ki_1.gif",
  carregando_ki_2: "/Assets/personagens/gokumui/carregando_ki_2.gif",
  carregando_ki_3: "/Assets/personagens/gokumui/carregando_ki_3.gif",

  hit_light: "/Assets/personagens/gokumui/hit_light.gif",
  hit_medium: "/Assets/personagens/gokumui/hit_medium.gif",
  hit_heavy: "/Assets/personagens/gokumui/hit_heavy.gif",
  hit_air: "/Assets/personagens/gokumui/hit_air.gif",
  hit_launch: "/Assets/personagens/gokumui/hit_launch.gif",
  hit_bounce: "/Assets/personagens/gokumui/hit_bounce.gif",
  hit_grabbed: "/Assets/personagens/gokumui/hit_grabbed.gif",
  hit_ground_push_up: "/Assets/personagens/gokumui/hit_ground_push_up.gif",
  hit_ground_launch: "/Assets/personagens/gokumui/hit_ground_launch.gif",
  hit_air_fall: "/Assets/personagens/gokumui/hit_air_fall.gif",
  hit_ground_crash: "/Assets/personagens/gokumui/hit_ground_crash.gif",
  hit_ground_stun: "/Assets/personagens/gokumui/hit_ground_stun.gif",
  hit_ground_recover: "/Assets/personagens/gokumui/hit_ground_recover.gif",

  defesa: "/Assets/personagens/gokumui/defesa.gif",
  defesa_agachado: "/Assets/personagens/gokumui/defesa_agachado.gif",
  defesa_ar: "/Assets/personagens/gokumui/defesa_ar.gif",
  desfazendo_transformacao: "/Assets/personagens/gokumui/desfazendo_transformacao_base.gif",
  double_tap: "/Assets/personagens/gokumui/double_tap.gif",
  dragon_rush_1: "/Assets/personagens/gokumui/dragon_rush_1.gif",
  dragon_rush_2: "/Assets/personagens/gokumui/dragon_rush_2.gif",
  dragon_rush_3: "/Assets/personagens/gokumui/dragon_rush_3.gif",
  entrada_por_ko: "/Assets/personagens/gokumui/entrada_por_ko.gif",

  stand_light_1: "/Assets/personagens/gokumui/stand_light_1.gif",
  stand_light_2_2: "/Assets/personagens/gokumui/stand_light_2_2.gif",
  stand_light_3_1: "/Assets/personagens/gokumui/stand_light_3_1.gif",
  stand_light_3_2: "/Assets/personagens/gokumui/stand_light_3_2.gif",
  stand_medium_1_1: "/Assets/personagens/gokumui/stand_medium_1_1.gif",
  stand_medium_1_2: "/Assets/personagens/gokumui/stand_medium_1_2.gif",
  stand_heavy_1_1: "/Assets/personagens/gokumui/stand_heavy_1_1.gif",
  stand_heavy_1_2: "/Assets/personagens/gokumui/stand_heavy_1_2.gif",
  stand_heavy_1_3: "/Assets/personagens/gokumui/stand_heavy_1_3.gif",

  crouch_light_1: "/Assets/personagens/gokumui/crouch_light_1.gif",
  crouch_medium_1: "/Assets/personagens/gokumui/crouch_medium_1.gif",
  crouch_heavy_1_1: "/Assets/personagens/gokumui/crouch_heavy_1_1.gif",
  crouch_heavy_1_2: "/Assets/personagens/gokumui/crouch_heavy_1_2.gif",
  crouch_heavy_1_3: "/Assets/personagens/gokumui/crouch_heavy_1_3.gif",
  crouch_heavy_1_4: "/Assets/personagens/gokumui/crouch_heavy_1_4.gif",
  crouch_back_heavy_1_1: "/Assets/personagens/gokumui/crouch_back_heavy_1_1.gif",
  crouch_back_heavy_1_2: "/Assets/personagens/gokumui/crouch_back_heavy_1_2.gif",

  air_light_1: "/Assets/personagens/gokumui/air_light_1.gif",
  air_medium_1: "/Assets/personagens/gokumui/air_medium_1.gif",
  air_medium_up_1: "/Assets/personagens/gokumui/air_medium_up_1.gif",
  air_haevy_1: "/Assets/personagens/gokumui/air_haevy_1.gif",

  especial_1_1: "/Assets/personagens/gokumui/especial_1_1.gif",
  especial_1_2: "/Assets/personagens/gokumui/especial_1_2.gif",
  especial_2_1: "/Assets/personagens/gokumui/especial_2_1.gif",
  especial_2_2: "/Assets/personagens/gokumui/especial_2_2.gif",
  especial_2_3: "/Assets/personagens/gokumui/especial_2_3.gif",
  especial_3_1: "/Assets/personagens/gokumui/especial_3_1.gif",
  especial_3_2: "/Assets/personagens/gokumui/especial_3_2.gif",
  especial_4_1: "/Assets/personagens/gokumui/especial_4_1.gif",
  especial_4_2: "/Assets/personagens/gokumui/especial_4_2.gif",
  especial_4_3: "/Assets/personagens/gokumui/especial_4_3.gif",
  especial_4_4: "/Assets/personagens/gokumui/especial_4_4.gif",
  especial_4_5: "/Assets/personagens/gokumui/especial_4_5.gif",
  especial_5_1: "/Assets/personagens/gokumui/especial_5_1.gif",
  especial_5_2: "/Assets/personagens/gokumui/especial_5_2.gif",
  especial_5_3: "/Assets/personagens/gokumui/especial_5_3.gif",
  especial_5_4: "/Assets/personagens/gokumui/especial_5_4.gif",
  especial_5_5: "/Assets/personagens/gokumui/especial_5_5.gif",
  especial_5_6: "/Assets/personagens/gokumui/especial_5_6.gif",

  especial_kiblast_1_1: "/Assets/personagens/gokumui/especial_kiblast_1_1.gif",
  especial_kiblast_1_2: "/Assets/personagens/gokumui/especial_kiblast_1_2.gif",
  especial_kiblast_1_3: "/Assets/personagens/gokumui/especial_kiblast_1_3.gif",

  especial_6_1: "/Assets/personagens/gokumui/especial_6_1.gif",
  especial_6_2: "/Assets/personagens/gokumui/especial_6_2.gif",
  especial_6_3: "/Assets/personagens/gokumui/especial_6_3.gif",

  frente: "/Assets/personagens/gokumui/frente.gif",
  instinto: "/Assets/personagens/gokumui/instinto.gif",
  instinto_1_1: "/Assets/personagens/gokumui/instinto_1_1.gif",
  instinto_1_2: "/Assets/personagens/gokumui/instinto_1_2.gif",
  instinto_1_3: "/Assets/personagens/gokumui/instinto_1_3.gif",

  intro_1_1: "/Assets/personagens/gokumui/intro_1_1.gif",
  intro_1_2: "/Assets/personagens/gokumui/intro_1_2.gif",
  intro_1_3: "/Assets/personagens/gokumui/intro_1_3.gif",
  intro_1_4: "/Assets/personagens/gokumui/intro_1_4.gif",
  intro_1_5: "/Assets/personagens/gokumui/intro_1_5.gif",
  intro_1_6: "/Assets/personagens/gokumui/intro_1_6.gif",

  introducao_1_1: "/Assets/personagens/gokumui/introducao_1_1.gif",
  introducao_1_2: "/Assets/personagens/gokumui/introducao_1_2.gif",
  introducao_1_3: "/Assets/personagens/gokumui/introducao_1_3.gif",
  introducao_1_4: "/Assets/personagens/gokumui/introducao_1_4.gif",
  introducao_1_5: "/Assets/personagens/gokumui/introducao_1_5.gif",
  introducao_1_6: "/Assets/personagens/gokumui/introducao_1_6.gif",

  vitoria_1_1: "/Assets/personagens/gokumui/vitoria_1_1.gif",
  vitoria_1_2: "/Assets/personagens/gokumui/vitoria_1_2.gif",
  derrota_1_1: "/Assets/personagens/gokumui/derrota_1_1.gif",
  derrota_1_2: "/Assets/personagens/gokumui/derrota_1_2.gif",
  derrota_1_3: "/Assets/personagens/gokumui/derrota_1_3.gif",

  parado: "/Assets/personagens/gokumui/parado.gif",
  super_dash_1: "/Assets/personagens/gokumui/super_dash_1.gif",
  super_dash_2: "/Assets/personagens/gokumui/super_dash_2.gif",
  teleporte: "/Assets/personagens/gokumui/teleporte.gif",
  teleporte_1: "/Assets/personagens/gokumui/teleporte-1.gif",
  tras: "/Assets/personagens/gokumui/tras.gif",
  sprite_animation_37: "/Assets/personagens/gokumui/sprite-animation (37).gif",

  ultimate_1_1: "/Assets/personagens/gokumui/ultimate_1_1.gif",
  ultimate_1_2: "/Assets/personagens/gokumui/ultimate_1_2.gif",
  ultimate_1_3: "/Assets/personagens/gokumui/ultimate_1_3.gif",
  ultimate_1_4: "/Assets/personagens/gokumui/ultimate_1_4.gif",
  ultimate_1_5: "/Assets/personagens/gokumui/ultimate_1_5.gif",
  ultimate_1_6: "/Assets/personagens/gokumui/ultimate_1_6.gif",
  ultimate_1_7: "/Assets/personagens/gokumui/ultimate_1_7.gif",
  ultimate_1_8: "/Assets/personagens/gokumui/ultimate_1_8.gif",
  ultimate_1_9: "/Assets/personagens/gokumui/ultimate_1_9.gif",
  ultimate_1_10: "/Assets/personagens/gokumui/ultimate_1_10.gif",

  sparking_1_1: "/Assets/personagens/gokumui/sparking_1_1.gif",
  sparking_1_2: "/Assets/personagens/gokumui/sparking_1_2.gif",
};

const DEFAULT_RPG = {
  level: 1,
  currentXp: 0,
  xpToNextLevel: 100,
  availablePoints: 0,
};

const createGifAnim = (
  url: string,
  loop: boolean = true,
  speed: number = 5,
  fullScreen: boolean = false,
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
  fullScreen,
});

export const GokuMUI: CharacterData = {
  id: "goku_mui",
  name: "GOKU (MUI)",
  color: "#e2e8f0",
  rarity: "LEGENDARY",
  tags: ["SAIYAN", "GOD", "MUI"],
  detransformTo: ["goku_base", "goku_ssj"],
  level: 1,
  currentXp: 0,
  xpToNextLevel: 100,
  availablePoints: 0,
  stats: {
    attack: 16,
    defense: 11,
    speed: 16,
  },

  spriteConfig: {
    defaultScale: 2.2,
    portraitUrl: "/Assets/personagens/gokumui/prewiew.gif",
    iconUrl: "/Assets/personagens/gokumui/prewiew.gif",
    hitboxWidth: 49,
    hitboxHeight: 101,
    hitboxOffsetX: 35,
    hitboxOffsetY: 70,
    animations: {
      [PlayerState.INTRO]: createGifAnim(URLS.intro_1_1, false, 5, true),
      INTRO_1: createGifAnim(URLS.intro_1_1, false, 5, true),
      INTRO_2: createGifAnim(URLS.intro_1_2, false, 5, true),
      INTRO_3: createGifAnim(URLS.intro_1_3, false, 5, true),
      INTRO_4: createGifAnim(URLS.intro_1_4, false, 5, true),
      INTRO_5: createGifAnim(URLS.intro_1_5, false, 5, true),
      INTRO_6: createGifAnim(URLS.intro_1_6, false, 5, true),
      INTRODUCAO_1: createGifAnim(URLS.introducao_1_1, false, 5, true),
      INTRODUCAO_2: createGifAnim(URLS.introducao_1_2, false, 5, true),
      INTRODUCAO_3: createGifAnim(URLS.introducao_1_3, false, 5, true),
      INTRODUCAO_4: createGifAnim(URLS.introducao_1_4, false, 5, true),
      INTRODUCAO_5: createGifAnim(URLS.introducao_1_5, false, 5, true),
      INTRODUCAO_6: createGifAnim(URLS.introducao_1_6, false, 5, true),

      [PlayerState.IDLE]: createGifAnim(URLS.parado, true),
      [PlayerState.RUNNING]: createGifAnim(URLS.frente, true),
      [PlayerState.WALK_BACKWARD]: createGifAnim(URLS.tras, true),
      [PlayerState.CROUCH]: createGifAnim(URLS.agachado, true),

      [PlayerState.JUMPING]: createGifAnim(URLS.pulo, false),
      [PlayerState.FALLING]: createGifAnim(URLS.pulo, true),
      FALLING_LOOP: createGifAnim(URLS.pulo, true),
      [PlayerState.LANDING]: createGifAnim(URLS.aterrisando, false),

      STAND_LIGHT_1: createGifAnim(URLS.stand_light_1, false),
      STAND_LIGHT_2: createGifAnim(URLS.stand_light_2_2, false),
      STAND_LIGHT_3: createGifAnim(URLS.stand_light_3_1, false),
      STAND_LIGHT_3_1: createGifAnim(URLS.stand_light_3_1, false),
      STAND_LIGHT_3_2: createGifAnim(URLS.stand_light_3_2, false),
      ATTACK_LIGHT_1: createGifAnim(URLS.stand_light_1, false),
      ATTACK_LIGHT_2: createGifAnim(URLS.stand_light_2_2, false),
      ATTACK_LIGHT_3: createGifAnim(URLS.stand_light_3_1, false),
      Attack_1_1: createGifAnim(URLS.stand_light_1, false),
      Attack_1_2: createGifAnim(URLS.stand_light_2_2, false),
      Attack_1_3: createGifAnim(URLS.stand_light_3_1, false),

      STAND_MEDIUM_1: createGifAnim(URLS.stand_medium_1_1, false),
      STAND_MEDIUM_2: createGifAnim(URLS.stand_medium_1_2, false),
      STAND_MEDIUM_1_1: createGifAnim(URLS.stand_medium_1_1, false),
      STAND_MEDIUM_1_2: createGifAnim(URLS.stand_medium_1_2, false),
      ATTACK_MEDIUM_1: createGifAnim(URLS.stand_medium_1_1, false),
      ATTACK_MEDIUM_2: createGifAnim(URLS.stand_medium_1_2, false),
      Attack_2_1: createGifAnim(URLS.stand_medium_1_1, false),
      Attack_2_2: createGifAnim(URLS.stand_medium_1_2, false),

      STAND_HEAVY: createGifAnim(URLS.stand_heavy_1_1, false),
      STAND_HEAVY_1: createGifAnim(URLS.stand_heavy_1_1, false),
      STAND_HEAVY_2: createGifAnim(URLS.stand_heavy_1_2, false),
      STAND_HEAVY_3: createGifAnim(URLS.stand_heavy_1_3, false),
      STAND_HEAVY_1_1: createGifAnim(URLS.stand_heavy_1_1, false),
      STAND_HEAVY_1_2: createGifAnim(URLS.stand_heavy_1_2, false),
      STAND_HEAVY_1_3: createGifAnim(URLS.stand_heavy_1_3, false),
      ATTACK_HEAVY: createGifAnim(URLS.stand_heavy_1_1, false),
      Attack_3_1: createGifAnim(URLS.stand_heavy_1_1, false),

      CROUCH_LIGHT: createGifAnim(URLS.crouch_light_1, false),
      CROUCH_LIGHT_1: createGifAnim(URLS.crouch_light_1, false),
      ATTACK_CROUCH_LIGHT: createGifAnim(URLS.crouch_light_1, false),
      ATTACK_CROUCH_LIGHT_1: createGifAnim(URLS.crouch_light_1, false),
      Attack_1_4: createGifAnim(URLS.crouch_light_1, false),

      CROUCH_MEDIUM: createGifAnim(URLS.crouch_medium_1, false),
      CROUCH_MEDIUM_1: createGifAnim(URLS.crouch_medium_1, false),
      ATTACK_CROUCH_MEDIUM: createGifAnim(URLS.crouch_medium_1, false),
      ATTACK_CROUCH_MEDIUM_1: createGifAnim(URLS.crouch_medium_1, false),
      Attack_2_4: createGifAnim(URLS.crouch_medium_1, false),

      CROUCH_HEAVY: createGifAnim(URLS.crouch_heavy_1_1, false),
      CROUCH_HEAVY_1: createGifAnim(URLS.crouch_heavy_1_1, false),
      CROUCH_HEAVY_2: createGifAnim(URLS.crouch_heavy_1_2, false),
      CROUCH_HEAVY_3: createGifAnim(URLS.crouch_heavy_1_3, false),
      CROUCH_HEAVY_4: createGifAnim(URLS.crouch_heavy_1_4, false),
      CROUCH_HEAVY_1_1: createGifAnim(URLS.crouch_heavy_1_1, false),
      CROUCH_HEAVY_1_2: createGifAnim(URLS.crouch_heavy_1_2, false),
      CROUCH_HEAVY_1_3: createGifAnim(URLS.crouch_heavy_1_3, false),
      CROUCH_HEAVY_1_4: createGifAnim(URLS.crouch_heavy_1_4, false),
      ATTACK_CROUCH_HEAVY: createGifAnim(URLS.crouch_heavy_1_1, false),

      CROUCH_BACK_HEAVY: createGifAnim(URLS.crouch_back_heavy_1_1, false),
      CROUCH_BACK_HEAVY_1: createGifAnim(URLS.crouch_back_heavy_1_1, false),
      CROUCH_BACK_HEAVY_2: createGifAnim(URLS.crouch_back_heavy_1_2, false),
      CROUCH_BACK_HEAVY_1_1: createGifAnim(URLS.crouch_back_heavy_1_1, false),
      CROUCH_BACK_HEAVY_1_2: createGifAnim(URLS.crouch_back_heavy_1_2, false),

      AIR_LIGHT: createGifAnim(URLS.air_light_1, false),
      AIR_LIGHT_1: createGifAnim(URLS.air_light_1, false),
      ATTACK_AIR_LIGHT: createGifAnim(URLS.air_light_1, false),
      ATTACK_JUMP_LIGHT_1: createGifAnim(URLS.air_light_1, false),
      Combo_Ar_1: createGifAnim(URLS.air_light_1, false),
      Attack_4_1: createGifAnim(URLS.air_light_1, false),

      AIR_MEDIUM: createGifAnim(URLS.air_medium_1, false),
      AIR_MEDIUM_1: createGifAnim(URLS.air_medium_1, false),
      AIR_MEDIUM_FORWARD: createGifAnim(URLS.air_medium_1, false),
      ATTACK_AIR_MEDIUM: createGifAnim(URLS.air_medium_1, false),
      ATTACK_JUMP_MEDIUM_1: createGifAnim(URLS.air_medium_1, false),
      Combo_Ar_4: createGifAnim(URLS.air_medium_1, false),
      Attack_4_4: createGifAnim(URLS.air_medium_1, false),

      AIR_MEDIUM_UP: createGifAnim(URLS.air_medium_up_1, false),
      AIR_MEDIUM_UP_1: createGifAnim(URLS.air_medium_up_1, false),

      AIR_HEAVY: createGifAnim(URLS.air_haevy_1, false),
      AIR_HEAVY_1: createGifAnim(URLS.air_haevy_1, false),
      ATTACK_AIR_HEAVY: createGifAnim(URLS.air_haevy_1, false),
      ATTACK_JUMP_HEAVY: createGifAnim(URLS.air_haevy_1, false),
      Combo_Ar_7: createGifAnim(URLS.air_haevy_1, false),
      Attack_4_7: createGifAnim(URLS.air_haevy_1, false),

      ATTACK_KI_BLAST: createGifAnim(URLS.especial_kiblast_1_1, false),
      KI_BLAST: createGifAnim(URLS.especial_kiblast_1_1, false),

      KI_BLAST_1: createGifAnim(URLS.especial_kiblast_1_1, false),
      KI_BLAST_2: createGifAnim(URLS.especial_kiblast_1_2, false),
      KI_BLAST_3: createGifAnim(URLS.especial_kiblast_1_3, false),
      KI_BLAST_AR_1: createGifAnim(URLS.especial_kiblast_1_1, false),
      KI_BLAST_AR_2: createGifAnim(URLS.especial_kiblast_1_2, false),
      KI_BLAST_AR_3: createGifAnim(URLS.especial_kiblast_1_3, false),

      SPECIAL_1_1: createGifAnim(URLS.especial_1_1, false),
      SPECIAL_1_2: createGifAnim(URLS.especial_1_2, false),
      SPECIAL_2_1: createGifAnim(URLS.especial_2_1, false),
      SPECIAL_2_2: createGifAnim(URLS.especial_2_2, false),
      SPECIAL_2_3: createGifAnim(URLS.especial_2_3, false),
      SPECIAL_3_1: createGifAnim(URLS.especial_3_1, false),
      SPECIAL_3_2: createGifAnim(URLS.especial_3_2, false),
      SPECIAL_4_1: createGifAnim(URLS.especial_4_1, false),
      SPECIAL_4_2: createGifAnim(URLS.especial_4_2, false),
      SPECIAL_4_3: createGifAnim(URLS.especial_4_3, false),
      SPECIAL_4_4: createGifAnim(URLS.especial_4_4, false),
      SPECIAL_4_5: createGifAnim(URLS.especial_4_5, false),
      SPECIAL_5_1: createGifAnim(URLS.especial_5_1, false),
      SPECIAL_5_2: createGifAnim(URLS.especial_5_2, false),
      SPECIAL_5_3: createGifAnim(URLS.especial_5_3, false),
      SPECIAL_5_4: createGifAnim(URLS.especial_5_4, false),
      SPECIAL_5_5: createGifAnim(URLS.especial_5_5, false),
      SPECIAL_5_6: createGifAnim(URLS.especial_5_6, false),

      [PlayerState.ULTIMATE]: createGifAnim(URLS.ultimate_1_1, false, 5, true),
      ULTIMATE_1_1: createGifAnim(URLS.ultimate_1_1, false, 5, true),
      ULTIMATE_1_2: createGifAnim(URLS.ultimate_1_2, false, 5, true),
      ULTIMATE_1_3: createGifAnim(URLS.ultimate_1_3, false, 5, true),
      ULTIMATE_1_4: createGifAnim(URLS.ultimate_1_4, false, 5, true),
      ULTIMATE_1_5: createGifAnim(URLS.ultimate_1_5, false, 5, true),
      ULTIMATE_1_6: createGifAnim(URLS.ultimate_1_6, false, 5, true),
      ULTIMATE_1_7: createGifAnim(URLS.ultimate_1_7, false, 5, true),
      ULTIMATE_1_8: createGifAnim(URLS.ultimate_1_8, false, 5, true),
      ULTIMATE_1_9: createGifAnim(URLS.ultimate_1_9, false, 5, true),
      ULTIMATE_1_10: createGifAnim(URLS.ultimate_1_10, false, 5, true),

      [PlayerState.BLOCKING]: createGifAnim(URLS.defesa, true),
      Defesa_Agachado: createGifAnim(URLS.defesa_agachado, true),
      Defesa_Ar: createGifAnim(URLS.defesa_ar, true),

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
      HIT_GROUND_LAUNCH: createGifAnim(URLS.hit_ground_launch, false),
      HIT_GROUND_PUSH_UP: createGifAnim(URLS.hit_ground_push_up, false),
      HIT_GROUND_RECOVER: createGifAnim(URLS.hit_ground_recover, false),
      GROUND_BOUNCE: createGifAnim(URLS.hit_bounce, false),
      FALL: createGifAnim(URLS.pulo, true),
      DOWN_LYING_DOWN: createGifAnim(URLS.hit_ground_crash, true),
      [PlayerState.FALLING_HIT]: createGifAnim(URLS.hit_air_fall, true),
      [PlayerState.FALLING_HIT_GROUND]: createGifAnim(URLS.hit_ground_crash, false),
      LANDING_FALL: createGifAnim(URLS.aterrisando, false),
      GROUND_HIT: createGifAnim(URLS.hit_ground_crash, false),
      [PlayerState.LAUNCHED]: createGifAnim(URLS.hit_launch, false),
      [PlayerState.STUNNED]: createGifAnim(URLS.hit_ground_stun, true),
      [PlayerState.GUARD_BREAK]: createGifAnim(URLS.hit_heavy, false),
      [PlayerState.KNOCKED_DOWN]: createGifAnim(URLS.hit_ground_crash, false),
      [PlayerState.GROUND_RECOVERY]: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_START: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_MIDDLE: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_END: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP: createGifAnim(URLS.hit_ground_recover, false),
      GET_UP_AIR: createGifAnim(URLS.hit_air, false),
      LAUNCHED: createGifAnim(URLS.hit_launch, true),

      [PlayerState.DASH_START]: createGifAnim(URLS.super_dash_1, false),
      [PlayerState.DASHING]: createGifAnim(URLS.super_dash_2, true),
      [PlayerState.DASH_END]: createGifAnim(URLS.super_dash_2, false),
      [PlayerState.MUI_DODGE]: createGifAnim(URLS.instinto, false),
      INSTINTO_1: createGifAnim(URLS.instinto_1_1, false),
      INSTINTO_2: createGifAnim(URLS.instinto_1_2, false),
      INSTINTO_3: createGifAnim(URLS.instinto_1_3, false),

      SPECIAL_6_1: createGifAnim(URLS.especial_6_1, false),
      SPECIAL_6_2: createGifAnim(URLS.especial_6_2, false),
      SPECIAL_6_3: createGifAnim(URLS.especial_6_3, false),

      [PlayerState.VANISH]: createGifAnim(URLS.teleporte, false, 5),
      [PlayerState.VANISH_APPEAR]: createGifAnim(URLS.teleporte, false, 5),
      TELEPORT: createGifAnim(URLS.teleporte, false),
      TELEPORTE: createGifAnim(URLS.teleporte, false),
      TELEPORTE_1: createGifAnim(URLS.teleporte_1, false),

      [PlayerState.SUPER_DASH]: createGifAnim(URLS.super_dash_1, true, 5),
      SUPER_DASH_1: createGifAnim(URLS.super_dash_1, true, 5),
      SUPER_DASH_2: createGifAnim(URLS.super_dash_2, true, 5),
      [PlayerState.QUICK_DASH]: createGifAnim(URLS.double_tap, false),
      DOUBLE_TAP: createGifAnim(URLS.double_tap, false),
      [PlayerState.DRAGON_RUSH]: createGifAnim(URLS.dragon_rush_1, false),
      [PlayerState.DRAGON_COMBO]: createGifAnim(URLS.dragon_rush_2, false),
      [PlayerState.DRAGON_DASH_FOLLOW]: createGifAnim(URLS.dragon_rush_3, false),

      [PlayerState.CHARGE_START]: createGifAnim(URLS.carregando_ki_1, false),
      [PlayerState.CHARGING]: {
        "imageUrl": "/Assets/personagens/gokumui/carregando_ki_2.gif",
        "frames": 2,
        "frameWidth": 31,
        "frameHeight": 59,
        "isGif": true,
        "speed": 5,
        "loop": true,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "auraConfigKey": "CHAVE_AURA_002"
      },
      [PlayerState.CHARGE_END]: createGifAnim(URLS.carregando_ki_3, false),
      [PlayerState.SPARKING]: createGifAnim(URLS.sparking_1_1, false),
      SPARKING_1: createGifAnim(URLS.sparking_1_1, false),
      SPARKING_2: createGifAnim(URLS.sparking_1_2, false),

      [PlayerState.STANDBY]: createGifAnim(URLS.parado, true),
      TAG_IN_KO: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.TAG_IN]: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.TAG_OUT]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_ENTRY]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_EXIT]: createGifAnim(URLS.parado, false),
      [PlayerState.VICTORY]: createGifAnim(URLS.vitoria_1_1, false, 5, true),
      VITORIA_1: createGifAnim(URLS.vitoria_1_1, false, 5, true),
      VITORIA_2: createGifAnim(URLS.vitoria_1_2, false, 5, true),
      [PlayerState.DEFEAT]: createGifAnim(URLS.derrota_1_1, false, 5, true),
      DERROTA_1: createGifAnim(URLS.derrota_1_1, false, 5, true),
      DERROTA_2: createGifAnim(URLS.derrota_1_2, false, 5, true),
      DERROTA_3: createGifAnim(URLS.derrota_1_3, false, 5, true),
      DETRANSFORM: createGifAnim(URLS.desfazendo_transformacao, false),
    },
  },

  phasedMoves: {
    'STAND_LIGHT_1': {
        id: 'STAND_LIGHT_1',
        phases: [{ animation: 'STAND_LIGHT_1', duration: 10, hitboxActive: true, damage: 4, moveX: 2, sfxName: 'attack_light' }]
    },
    'STAND_LIGHT_2': {
        id: 'STAND_LIGHT_2',
        phases: [{ animation: 'STAND_LIGHT_2', duration: 10, hitboxActive: true, damage: 4, moveX: 2, sfxName: 'attack_light' }]
    },
    'STAND_LIGHT_3': {
        id: 'STAND_LIGHT_3',
        phases: [
            { animation: 'STAND_LIGHT_3_1', duration: 8, hitboxActive: true, damage: 4, moveX: 4, sfxName: 'attack_medium' },
            { animation: 'STAND_LIGHT_3_2', duration: 12, hitboxActive: true, damage: 6, moveX: 6, launchOpponent: { x: 35, y: 0 }, shakeIntensity: 1.5, sfxName: 'attack_medium' }
        ]
    },
    'STAND_MEDIUM': {
        id: 'STAND_MEDIUM',
        phases: [
            { animation: 'STAND_MEDIUM_1_1', duration: 10, hitboxActive: true, damage: 6, moveX: 4, sfxName: 'attack_medium' },
            { animation: 'STAND_MEDIUM_1_2', duration: 10, hitboxActive: true, damage: 8, moveX: 4, sfxName: 'attack_medium' }
        ]
    },
    'STAND_MEDIUM_1': {
        id: 'STAND_MEDIUM_1',
        phases: [
            { animation: 'STAND_MEDIUM_1_1', duration: 10, hitboxActive: true, damage: 6, moveX: 4, sfxName: 'attack_medium' }
        ]
    },
    'STAND_MEDIUM_2': {
        id: 'STAND_MEDIUM_2',
        phases: [
            { animation: 'STAND_MEDIUM_1_2', duration: 10, hitboxActive: true, damage: 8, moveX: 4, sfxName: 'attack_medium' }
        ]
    },
    'STAND_HEAVY': {
        id: 'STAND_HEAVY',
        phases: [
            { animation: 'STAND_HEAVY_1_1', duration: 12, hitboxActive: false, moveX: 15, sfxName: 'dash' },
            { animation: 'STAND_HEAVY_1_2', duration: 8, hitboxActive: true, damage: 12, moveX: 5, sfxName: 'attack_heavy' },
            { animation: 'STAND_HEAVY_1_3', duration: 14, hitboxActive: true, damage: 10, launchOpponent: { x: 45, y: 0 }, shakeIntensity: 3, sfxName: 'attack_heavy' }
        ]
    },
    'CROUCH_LIGHT': {
        id: 'CROUCH_LIGHT',
        phases: [{ animation: 'CROUCH_LIGHT_1', duration: 12, hitboxActive: true, damage: 5, sfxName: 'attack_light' }]
    },
    'CROUCH_MEDIUM': {
        id: 'CROUCH_MEDIUM',
        phases: [{ animation: 'CROUCH_MEDIUM_1', duration: 16, hitboxActive: true, damage: 10, knockdown: true, sfxName: 'attack_medium' }]
    },
    'CROUCH_BACK_MEDIUM': {
        id: 'CROUCH_BACK_MEDIUM',
        phases: [{ animation: 'CROUCH_MEDIUM_1', duration: 16, hitboxActive: true, damage: 10, knockdown: true, sfxName: 'attack_medium' }]
    },
    'CROUCH_FORWARD_MEDIUM': {
        id: 'CROUCH_FORWARD_MEDIUM',
        phases: [{ animation: 'CROUCH_MEDIUM_1', duration: 16, hitboxActive: true, damage: 10, moveX: 4, sfxName: 'attack_medium' }]
    },
    'CROUCH_HEAVY': {
        id: 'CROUCH_HEAVY',
        phases: [
            { animation: 'CROUCH_HEAVY_1_1', duration: 8, hitboxActive: false, sfxName: 'dash' },
            { animation: 'CROUCH_HEAVY_1_2', duration: 8, hitboxActive: true, damage: 8, sfxName: 'attack_heavy' },
            { animation: 'CROUCH_HEAVY_1_3', duration: 8, hitboxActive: true, damage: 8, sfxName: 'attack_heavy' },
            { animation: 'CROUCH_HEAVY_1_4', duration: 12, hitboxActive: true, damage: 10, launchOpponent: { x: 40, y: -80 }, velocityJump: { x: 10, y: -6 }, sfxName: 'attack_heavy', armor: true }
        ]
    },
    'CROUCH_FORWARD_HEAVY': {
        id: 'CROUCH_FORWARD_HEAVY',
        phases: [
            { animation: 'CROUCH_HEAVY_1_1', duration: 8, hitboxActive: false, sfxName: 'dash' },
            { animation: 'CROUCH_HEAVY_1_2', duration: 8, hitboxActive: true, damage: 8, sfxName: 'attack_heavy' },
            { animation: 'CROUCH_HEAVY_1_3', duration: 8, hitboxActive: true, damage: 8, sfxName: 'attack_heavy' },
            { animation: 'CROUCH_HEAVY_1_4', duration: 12, hitboxActive: true, damage: 10, launchOpponent: { x: 40, y: -80 }, velocityJump: { x: 10, y: -6 }, sfxName: 'attack_heavy', armor: true }
        ]
    },
    'CROUCH_BACK_HEAVY': {
        id: 'CROUCH_BACK_HEAVY',
        phases: [
            { animation: 'CROUCH_BACK_HEAVY_1_1', duration: 14, hitboxActive: true, damage: 12, knockdown: true, sfxName: 'attack_heavy' },
            { animation: 'CROUCH_BACK_HEAVY_1_2', duration: 14, hitboxActive: true, damage: 12, knockdown: true, sfxName: 'attack_heavy' }
        ]
    },
    'AIR_LIGHT': {
        id: 'AIR_LIGHT',
        phases: [{ animation: 'AIR_LIGHT_1', duration: 10, hitboxActive: true, damage: 5, velocityJump: { x: 3, y: -4 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_light' }]
    },
    'AIR_LIGHT_UP': {
        id: 'AIR_LIGHT_UP',
        phases: [{ animation: 'AIR_LIGHT_1', duration: 10, hitboxActive: true, damage: 5, velocityJump: { x: 3, y: -4 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_light' }]
    },
    'AIR_MEDIUM': {
        id: 'AIR_MEDIUM',
        phases: [
            { animation: 'AIR_MEDIUM_1', duration: 16, hitboxActive: true, damage: 12, velocityJump: { x: 4, y: 0 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_medium' }
        ]
    },
    'AIR_MEDIUM_FORWARD': {
        id: 'AIR_MEDIUM_FORWARD',
        phases: [
            { animation: 'AIR_MEDIUM_1', duration: 16, hitboxActive: true, damage: 12, velocityJump: { x: 4, y: 0 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_medium' }
        ]
    },
    'AIR_MEDIUM_UP': {
        id: 'AIR_MEDIUM_UP',
        phases: [
            { animation: 'AIR_MEDIUM_UP_1', duration: 16, hitboxActive: true, damage: 12, velocityJump: { x: 2, y: -8 }, suspendGravity: true, suspendOpponent: true, sfxName: 'attack_medium' }
        ]
    },
    'AIR_HEAVY': {
        id: 'AIR_HEAVY',
        phases: [
            { animation: 'AIR_HEAVY_1', duration: 20, hitboxActive: true, damage: 15, moveX: 10, launchOpponent: { x: 40, y: 40 }, knockdown: true, sfxName: 'attack_heavy' }
        ]
    },
    'AIR_HEAVY_UP': {
        id: 'AIR_HEAVY_UP',
        phases: [
            { animation: 'AIR_HEAVY_1', duration: 20, hitboxActive: true, damage: 15, moveX: 10, launchOpponent: { x: 40, y: -40 }, knockdown: true, sfxName: 'attack_heavy' }
        ]
    },
    'KI_BLAST': {
        id: 'KI_BLAST',
        phases: [
            { animation: 'KI_BLAST_1', duration: 8, projectile: 'KI_BLAST', sfxName: 'kiblast' },
            { animation: 'KI_BLAST_2', duration: 8, projectile: 'KI_BLAST', sfxName: 'kiblast' },
            { animation: 'KI_BLAST_3', duration: 12, projectile: 'KI_BLAST', sfxName: 'kiblast' }
        ]
    },
    'SPECIAL_1': {
        id: 'SPECIAL_1',
        phases: [
            { animation: 'SPECIAL_1_1', duration: 12, hitboxActive: true, damage: 20, moveX: 10, sfxName: 'attack_heavy' },
            { animation: 'SPECIAL_1_2', duration: 16, hitboxActive: true, damage: 25, launchOpponent: { x: 50, y: -20 }, sfxName: 'attack_heavy' }
        ]
    },
    'SPECIAL_2': {
        id: 'SPECIAL_2',
        phases: [
            { animation: 'SPECIAL_2_1', duration: 10, moveX: 20, sfxName: 'dash' },
            { animation: 'SPECIAL_2_2', duration: 12, hitboxActive: true, damage: 15, sfxName: 'attack_medium' },
            { animation: 'SPECIAL_2_3', duration: 14, hitboxActive: true, damage: 20, knockdown: true, sfxName: 'attack_heavy' }
        ]
    },
    'SPECIAL_3': {
        id: 'SPECIAL_3',
        phases: [
            { animation: 'SPECIAL_3_1', duration: 10, sfxName: 'vanish' },
            { animation: 'SPECIAL_3_2', duration: 15, hitboxActive: true, damage: 30, launchOpponent: { x: 40, y: -40 }, sfxName: 'attack_heavy' }
        ]
    },
    'SPECIAL_4': {
        id: 'SPECIAL_4',
        phases: [
            { animation: 'SPECIAL_4_1', duration: 8 },
            { animation: 'SPECIAL_4_2', duration: 8, projectile: 'KI_BLAST' },
            { animation: 'SPECIAL_4_3', duration: 8, projectile: 'KI_BLAST' },
            { animation: 'SPECIAL_4_4', duration: 8, projectile: 'KI_BLAST' },
            { animation: 'SPECIAL_4_5', duration: 12, projectile: 'KI_BLAST', sfxName: 'kiblast' }
        ]
    },
    'SPECIAL_5': {
        id: 'SPECIAL_5',
        phases: [
            { animation: 'SPECIAL_5_1', duration: 10 },
            { animation: 'SPECIAL_5_2', duration: 10 },
            { animation: 'SPECIAL_5_3', duration: 10 },
            { animation: 'SPECIAL_5_4', duration: 10 },
            { animation: 'SPECIAL_5_5', duration: 10 },
            { animation: 'SPECIAL_5_6', duration: 15, createsBeam: 'CHAVE_BEAM_45', sfxName: 'beam' }
        ]
    },
    'ULTIMATE': {
        id: 'ULTIMATE',
        phases: [
            { animation: 'ULTIMATE_1_1', duration: 15 },
            { animation: 'ULTIMATE_1_2', duration: 15 },
            { animation: 'ULTIMATE_1_3', duration: 15 },
            { animation: 'ULTIMATE_1_4', duration: 15 },
            { animation: 'ULTIMATE_1_5', duration: 15 },
            { animation: 'ULTIMATE_1_6', duration: 15 },
            { animation: 'ULTIMATE_1_7', duration: 15 },
            { animation: 'ULTIMATE_1_8', duration: 15 },
            { animation: 'ULTIMATE_1_9', duration: 15 },
            { animation: 'ULTIMATE_1_10', duration: 25, createsBeam: 'CHAVE_BEAM_46', shakeIntensity: 5, sfxName: 'ultimate' }
        ]
    },
    'INTRO': {
        id: 'INTRO',
        phases: [
            { animation: 'INTRO_1', duration: 30 },
            { animation: 'INTRO_2', duration: 30 },
            { animation: 'INTRO_3', duration: 30 },
            { animation: 'INTRO_4', duration: 30 },
            { animation: 'INTRO_5', duration: 30 },
            { animation: 'INTRO_6', duration: 40 }
        ]
    },
    'VICTORY': {
        id: 'VICTORY',
        phases: [
            { animation: 'VITORIA_1', duration: 40 },
            { animation: 'VITORIA_2', duration: 60 }
        ]
    },
    'DEFEAT': {
        id: 'DEFEAT',
        phases: [
            { animation: 'DERROTA_1', duration: 30 },
            { animation: 'DERROTA_2', duration: 30 },
            { animation: 'DERROTA_3', duration: 60 }
        ]
    },
    'INSTINTO': {
        id: 'INSTINTO',
        phases: [
            { animation: 'INSTINTO_1', duration: 10 },
            { animation: 'INSTINTO_2', duration: 10 },
            { animation: 'INSTINTO_3', duration: 10 }
        ]
    },
    'MUI_DODGE': {
        id: 'MUI_DODGE',
        phases: [
            { animation: 'INSTINTO_1', duration: 10 },
            { animation: 'INSTINTO_2', duration: 10 },
            { animation: 'INSTINTO_3', duration: 10 }
        ]
    },
    'SPARKING': {
        id: 'SPARKING',
        phases: [
            { animation: 'SPARKING_1', duration: 20 },
            { animation: 'SPARKING_2', duration: 40 }
        ]
    },
    'SPECIAL_6': {
        id: 'SPECIAL_6',
        phases: [
            { animation: 'SPECIAL_6_1', duration: 10, sfxName: 'vanish' },
            { animation: 'SPECIAL_6_2', duration: 40, sfxName: 'charge' },
            { animation: 'SPECIAL_6_3', duration: 30, hitboxActive: true, damage: 150, moveY: -20, sfxName: 'impact' }
        ]
    }
  }
};
