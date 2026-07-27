import { CharacterData, PlayerState } from "../types";
import { BrolyIkari_Beams } from "./beams/BrolyIkari_Beams";

const URLS = {
  agachado: "/Assets/personagens/brolyikari/agachado.gif",
  aterrisando: "/Assets/personagens/brolyikari/aterrisando.gif",
  carregando_ki_1: "/Assets/personagens/brolyikari/carregando_ki_1.gif",
  carregando_ki_2: "/Assets/personagens/brolyikari/carregando_ki_2.gif",
  carregando_ki_3: "/Assets/personagens/brolyikari/carregando_ki_3.gif",

  // Movimento e Estado Básico
  fall_start: "/Assets/personagens/brolyikari/pulo.gif",
  fall_loop: "/Assets/personagens/brolyikari/pulo.gif",
  fall_land: "/Assets/personagens/brolyikari/aterrisando.gif",
  ground_hit: "/Assets/personagens/brolyikari/aterrisando.gif",
  get_up_start: "/Assets/personagens/brolyikari/agachado.gif",
  get_up_middle: "/Assets/personagens/brolyikari/agachado.gif",
  get_up_end: "/Assets/personagens/brolyikari/agachado.gif",

  defesa: "/Assets/personagens/brolyikari/defesa.gif",
  defesa_agachado: "/Assets/personagens/brolyikari/defesa_agachado.gif",
  defesa_ar: "/Assets/personagens/brolyikari/defesa_ar.gif",
  double_tap: "/Assets/personagens/brolyikari/double_tap.gif",
  dragon_rush_1: "/Assets/personagens/brolyikari/dragon_rush_1.gif",
  dragon_rush_2: "/Assets/personagens/brolyikari/dragon_rush_2.gif",
  dragon_rush_3: "/Assets/personagens/brolyikari/dragon_rush_3.gif",
  entrada_por_ko: "/Assets/personagens/brolyikari/entrada_por_ko.gif",

  // Ataques Básicos em Pé
  stand_light_1: "/Assets/personagens/brolyikari/stand_light_1.gif",
  stand_light_2: "/Assets/personagens/brolyikari/stand_light_2.gif",
  stand_light_3_1: "/Assets/personagens/brolyikari/stand_light_3_1.gif",
  stand_light_3_2: "/Assets/personagens/brolyikari/stand_light_3_2.gif",
  stand_light_3_3: "/Assets/personagens/brolyikari/stand_light_3_3.gif",
  stand_medium: "/Assets/personagens/brolyikari/stand_medium.gif",
  stand_heavy: "/Assets/personagens/brolyikari/stand_heavy.gif",
  stand_heavy_foward_1_1: "/Assets/personagens/brolyikari/stand_heavy_foward_1_1.gif",
  stand_heavy_foward_1_2: "/Assets/personagens/brolyikari/stand_heavy_foward_1_2.gif",
  stand_heavy_foward_1_3: "/Assets/personagens/brolyikari/stand_heavy_foward_1_3.gif",
  stand_heavy_foward_1_4: "/Assets/personagens/brolyikari/stand_heavy_foward_1_4.gif",

  // Ataques Agachados
  crouch_light: "/Assets/personagens/brolyikari/crouch_light.gif",
  crouch_medium_1_1: "/Assets/personagens/brolyikari/crouch_medium_1_1.gif",
  crouch_medium_1_2: "/Assets/personagens/brolyikari/crouch_medium_1_2.gif",
  crouch_medium_1_3: "/Assets/personagens/brolyikari/crouch_medium_1_3.gif",
  crouch_medium_1_4: "/Assets/personagens/brolyikari/crouch_medium_1_4.gif",
  crouch_medium_foward_1_1: "/Assets/personagens/brolyikari/crouch_medium_foward_1_1.gif",
  crouch_medium_foward_1_2: "/Assets/personagens/brolyikari/crouch_medium_foward_1_2.gif",
  crouch_medium_foward_1_3: "/Assets/personagens/brolyikari/crouch_medium_foward_1_3.gif",
  crouch_medium_foward_1_4: "/Assets/personagens/brolyikari/crouch_medium_foward_1_4.gif",
  crouch_heavy_1_1: "/Assets/personagens/brolyikari/crouch_heavy_1_1.gif",
  crouch_heavy_1_2: "/Assets/personagens/brolyikari/crouch_heavy_1_2.gif",
  crouch_heavy_1_3: "/Assets/personagens/brolyikari/crouch_heavy_1_3.gif",
  crouch_heavy_1_4: "/Assets/personagens/brolyikari/crouch_heavy_1_4.gif",
  crouch_heavy_1_5: "/Assets/personagens/brolyikari/crouch_heavy_1_5.gif",
  crouch_heavy_1_6: "/Assets/personagens/brolyikari/crouch_heavy_1_6.gif",
  crouch_heavy_1_7: "/Assets/personagens/brolyikari/crouch_heavy_1_7.gif",
  crouch_heavy_back_1_1: "/Assets/personagens/brolyikari/crouch_heavy_back_1_1.gif",
  crouch_heavy_back_1_2: "/Assets/personagens/brolyikari/crouch_heavy_back_1_2.gif",
  crouch_heavy_back_1_3: "/Assets/personagens/brolyikari/crouch_heavy_back_1_3.gif",
  crouch_heavy_back_1_4: "/Assets/personagens/brolyikari/crouch_heavy_back_1_4.gif",
  crouch_heavy_back_1_5: "/Assets/personagens/brolyikari/crouch_heavy_back_1_5.gif",
  crouch_heavy_back_1_6: "/Assets/personagens/brolyikari/crouch_heavy_back_1_6.gif",
  crouch_heavy_back_1_7: "/Assets/personagens/brolyikari/crouch_heavy_back_1_7.gif",
  crouch_heavy_back_1_8: "/Assets/personagens/brolyikari/crouch_heavy_back_1_8.gif",
  crouch_heavy_back_1_9: "/Assets/personagens/brolyikari/crouch_heavy_back_1_9.gif",

  // Ataques Aéreos
  air_light: "/Assets/personagens/brolyikari/air_light.gif",
  air_medium: "/Assets/personagens/brolyikari/air_medium.gif",
  air_medium_crouch: "/Assets/personagens/brolyikari/air_medium_crouch.gif",
  air_medium_forwad: "/Assets/personagens/brolyikari/air_medium_forwad.gif",
  air_stand_heavy: "/Assets/personagens/brolyikari/air_stand_heavy.gif",
  air_heavy_up: "/Assets/personagens/brolyikari/air_heavy_up.gif",

  especial_1_1: "/Assets/personagens/brolyikari/especial_1_1.gif",
  especial_1_2: "/Assets/personagens/brolyikari/especial_1_2.gif",
  especial_2_1: "/Assets/personagens/brolyikari/especial_2_1.gif",
  especial_2_2: "/Assets/personagens/brolyikari/especial_2_2.gif",
  especial_2_3: "/Assets/personagens/brolyikari/especial_2_3.gif",
  especial_2_4: "/Assets/personagens/brolyikari/especial_2_4.gif",
  especial_2_5: "/Assets/personagens/brolyikari/especial_2_5.gif",
  especial_3_1: "/Assets/personagens/brolyikari/especial_3_1.gif",
  especial_3_2: "/Assets/personagens/brolyikari/especial_3_2.gif",
  especial_3_3: "/Assets/personagens/brolyikari/especial_3_3.gif",
  especial_4_1: "/Assets/personagens/brolyikari/especial_4_1.gif",
  especial_4_2: "/Assets/personagens/brolyikari/especial_4_2.gif",
  especial_kiblast_1: "/Assets/personagens/brolyikari/especial_kiblast_1.gif",
  especial_kiblast_2: "/Assets/personagens/brolyikari/especial_kiblast_2.gif",
  especial_kiblast_ar_1: "/Assets/personagens/brolyikari/especial_kiblast_ar_1.gif",
  especial_kiblast_ar_2: "/Assets/personagens/brolyikari/especial_kiblast_ar_2.gif",
  frente: "/Assets/personagens/brolyikari/frente.gif",
  introducao_1_1: "/Assets/personagens/brolyikari/introducao_1_1.gif",
  introducao_1_2: "/Assets/personagens/brolyikari/introducao_1_2.gif",
  introducao_1_3: "/Assets/personagens/brolyikari/introducao_1_3.gif",
  introducao_1_4: "/Assets/personagens/brolyikari/introducao_1_4.gif",
  introducao_1_5: "/Assets/personagens/brolyikari/introducao_1_5.gif",
  introducao_1_6: "/Assets/personagens/brolyikari/introducao_1_6.gif",
  introducao_1_7: "/Assets/personagens/brolyikari/introducao_1_7.gif",
  introducao_1_8: "/Assets/personagens/brolyikari/introducao_1_8.gif",
  parado: "/Assets/personagens/brolyikari/parado.gif",
  pulo: "/Assets/personagens/brolyikari/pulo.gif",
  sparking: "/Assets/personagens/brolyikari/sparking.gif",
  super_dash_1: "/Assets/personagens/brolyikari/super_dash_1.gif",
  super_dash_2: "/Assets/personagens/brolyikari/super_dash_2.gif",
  teleporte: "/Assets/personagens/brolyikari/teleporte.gif",
  tras: "/Assets/personagens/brolyikari/tras.gif",
  ultimate_1_1: "/Assets/personagens/brolyikari/ultimate_1_1.gif",
  ultimate_1_2: "/Assets/personagens/brolyikari/ultimate_1_2.gif",
  ultimate_1_3: "/Assets/personagens/brolyikari/ultimate_1_3.gif",
  ultimate_1_4: "/Assets/personagens/brolyikari/ultimate_1_4.gif",
  ultimate_1_5: "/Assets/personagens/brolyikari/ultimate_1_5.gif",
  ultimate_2_1: "/Assets/personagens/brolyikari/ultimate_2_1.gif",
  ultimate_2_2: "/Assets/personagens/brolyikari/ultimate_2_2.gif",
  ultimate_2_3: "/Assets/personagens/brolyikari/ultimate_2_3.gif",
  ultimate_2_4: "/Assets/personagens/brolyikari/ultimate_2_4.gif",
  ultimate_2_5: "/Assets/personagens/brolyikari/ultimate_2_5.gif",
  ultimate_2_6: "/Assets/personagens/brolyikari/ultimate_2_6.gif",
  ultimate_2_7: "/Assets/personagens/brolyikari/ultimate_2_7.gif",
  ultimate_2_8: "/Assets/personagens/brolyikari/ultimate_2_8.gif",
  ultimate_2_9: "/Assets/personagens/brolyikari/ultimate_2_9.gif",

  // Hit Animations
  hit_light: "/Assets/personagens/brolyikari/hit_light.gif",
  hit_medium: "/Assets/personagens/brolyikari/hit_medium.gif",
  hit_heavy: "/Assets/personagens/brolyikari/hit_heavy.gif",
  hit_air: "/Assets/personagens/brolyikari/hit_air.gif",
  hit_bounce: "/Assets/personagens/brolyikari/hit_bounce.gif",
  hit_grabbed: "/Assets/personagens/brolyikari/hit_grabbed.gif",
  hit_ground_stun: "/Assets/personagens/brolyikari/hit_ground_stun.gif",
  hit_launch: "/Assets/personagens/brolyikari/hit_launch.gif",
};

const DEFAULT_RPG = {
  level: 20,
  currentXp: 0,
  xpToNextLevel: 100,
  availablePoints: 50,
};

const createGifAnim = (url: string, loop: boolean = true, speed: number = 5) => ({
  imageUrl: url,
  frames: 1,
  frameWidth: 0,
  frameHeight: 0,
  isGif: true,
  speed,
  loop,
  scale: 2.5,
});

export const BrolyIkari: CharacterData = {
  id: "broly_ikari",
  name: "BROLY IKARI",
  color: "#22c55e",
  rarity: "LEGENDARY",
  tags: ["SAIYAN", "WRATH", "HERO"],
  introText: "AAAAAAAAAHHHHHHHHH!! Vou extinguir tudo!!",
  stats: {
    attack: 16,
    defense: 15,
    speed: 11,
  },
  ...DEFAULT_RPG,
  progressionUnlocks: [],
  spriteConfig: {
    defaultScale: 2.5,
    portraitUrl: "/Assets/personagens/brolyikari/prewiew.png",
    hitboxWidth: 49,
    hitboxHeight: 101,
    hitboxOffsetX: 22,
    hitboxOffsetY: 65,
    animations: {
      [PlayerState.INTRO]: createGifAnim(URLS.introducao_1_1, false),
      INTRO_1: createGifAnim(URLS.introducao_1_1, false),
      INTRO_2: createGifAnim(URLS.introducao_1_2, false),
      INTRO_3: createGifAnim(URLS.introducao_1_3, false),
      INTRO_4: createGifAnim(URLS.introducao_1_4, false),
      INTRO_5: createGifAnim(URLS.introducao_1_5, false),
      INTRO_6: createGifAnim(URLS.introducao_1_6, false),
      INTRO_7: createGifAnim(URLS.introducao_1_7, false),
      INTRO_8: createGifAnim(URLS.introducao_1_8, false, 8),

      [PlayerState.IDLE]: createGifAnim(URLS.parado, true),
      [PlayerState.RUNNING]: createGifAnim(URLS.frente, true),
      [PlayerState.WALK_BACKWARD]: createGifAnim(URLS.tras, true),
      [PlayerState.DASH_START]: createGifAnim(URLS.super_dash_1, false, 8),
      [PlayerState.DASHING]: createGifAnim(URLS.super_dash_2, true, 8),
      [PlayerState.DASH_END]: createGifAnim(URLS.super_dash_2, false, 8),
      [PlayerState.JUMPING]: createGifAnim(URLS.pulo, false),
      [PlayerState.FALLING]: createGifAnim(URLS.pulo, true),
      FALLING_LOOP: createGifAnim(URLS.pulo, true),
      [PlayerState.LANDING]: createGifAnim(URLS.aterrisando, false),
      [PlayerState.CROUCH]: createGifAnim(URLS.agachado, true),

      [PlayerState.BLOCKING]: createGifAnim(URLS.defesa, false),
      [PlayerState.BLOCKING_CROUCH]: createGifAnim(URLS.defesa_agachado, false),
      [PlayerState.BLOCKING_AIR]: createGifAnim(URLS.defesa_ar, false),

      [PlayerState.CHARGE_START]: createGifAnim(URLS.carregando_ki_1, false, 8),
      [PlayerState.CHARGING]: {
        imageUrl: URLS.carregando_ki_2,
        frames: 2,
        frameWidth: 52,
        frameHeight: 67,
        isGif: true,
        speed: 8,
        loop: true,
        scale: 2.5,
        offsetX: 0,
        offsetY: 0,
        auraConfigKey: "CHAVE_AURA_011"
      },
      [PlayerState.CHARGE_END]: createGifAnim(URLS.carregando_ki_3, false, 8),

      // Fixed Hit Animations
      [PlayerState.HIT]: createGifAnim(URLS.hit_light, false),
      [PlayerState.HIT_2]: createGifAnim(URLS.hit_medium, false),
      [PlayerState.HIT_3]: createGifAnim(URLS.hit_heavy, false),
      [PlayerState.STUNNED]: createGifAnim(URLS.hit_ground_stun, false),
      [PlayerState.GUARD_BREAK]: createGifAnim(URLS.hit_medium, false),
      [PlayerState.KNOCKED_DOWN]: createGifAnim(URLS.hit_bounce, false),
      [PlayerState.DEFEAT]: createGifAnim(URLS.hit_bounce, false),
      [PlayerState.GROUND_RECOVERY]: createGifAnim(URLS.agachado, false),

      HIT_HIGH_LIGHT: createGifAnim(URLS.hit_light, false),
      HIT_HIGH_MEDIUM: createGifAnim(URLS.hit_medium, false),
      HIT_HIGH_HARD: createGifAnim(URLS.hit_heavy, false),
      HIT_LOW_LIGHT: createGifAnim(URLS.hit_light, false), // Broly doesn't have a specific low hit, using light
      HIT_LOW_HARD: createGifAnim(URLS.hit_heavy, false),
      CROUCH_HIT: createGifAnim(URLS.hit_light, false),
      AIR_HIT: createGifAnim(URLS.hit_air, false),
      AIR_HIT_START: createGifAnim(URLS.hit_air, false),
      GROUND_BOUNCE: createGifAnim(URLS.hit_bounce, false),
      FALL: createGifAnim(URLS.pulo, true),
      DOWN_LYING_DOWN: createGifAnim(URLS.hit_bounce, true),
      [PlayerState.FALLING_HIT]: createGifAnim(URLS.hit_air, true),
      [PlayerState.FALLING_HIT_GROUND]: createGifAnim(URLS.hit_bounce, false),
      LANDING_FALL: createGifAnim(URLS.aterrisando, false),
      GROUND_HIT: createGifAnim(URLS.hit_bounce, false),
      [PlayerState.LAUNCHED]: createGifAnim(URLS.hit_launch, false),
      [PlayerState.GRABBED]: createGifAnim(URLS.hit_grabbed, false),
      GET_UP_START: createGifAnim(URLS.agachado, false),
      GET_UP_MIDDLE: createGifAnim(URLS.agachado, false),
      GET_UP_END: createGifAnim(URLS.agachado, false),
      GET_UP_AIR: createGifAnim(URLS.pulo, false),

      [PlayerState.VANISH]: createGifAnim(URLS.teleporte, false),
      [PlayerState.VANISH_APPEAR]: createGifAnim(URLS.teleporte, false),
      TELEPORT: createGifAnim(URLS.teleporte, false),
      TELEPORTE: createGifAnim(URLS.teleporte, false),

      [PlayerState.SUPER_DASH]: createGifAnim(URLS.super_dash_1, true, 8),
      SUPER_DASH_1: createGifAnim(URLS.super_dash_1, true, 8),
      SUPER_DASH_2: createGifAnim(URLS.super_dash_2, true, 8),
      super_dash_2: createGifAnim(URLS.super_dash_2, true, 8),
      [PlayerState.QUICK_DASH]: createGifAnim(URLS.double_tap, false, 8),
      DOUBLE_TAP: createGifAnim(URLS.double_tap, false, 8),
      [PlayerState.DRAGON_RUSH]: createGifAnim(URLS.dragon_rush_1, false, 8),
      [PlayerState.DRAGON_COMBO]: createGifAnim(URLS.dragon_rush_2, false, 8),
      [PlayerState.DRAGON_DASH_FOLLOW]: createGifAnim(URLS.dragon_rush_3, false, 8),
      dragon_rush_2: createGifAnim(URLS.dragon_rush_2, false, 8),
      dragon_rush_3: createGifAnim(URLS.dragon_rush_3, false, 8),

      // Ataques Básicos Leves (Standing Light)
      [PlayerState.ATTACKING]: createGifAnim(URLS.stand_light_1, false, 2),
      ATTACK_LIGHT_1: createGifAnim(URLS.stand_light_1, false, 2),
      STAND_LIGHT_1: createGifAnim(URLS.stand_light_1, false, 2),
      Combo_Leve_1: createGifAnim(URLS.stand_light_1, false, 2),

      ATTACK_LIGHT_2: createGifAnim(URLS.stand_light_2, false, 2),
      STAND_LIGHT_2: {
        ...createGifAnim(URLS.stand_light_2, false, 15),
        attackBoxWidth: 15, // Damage only when close (~15px)
        damageFrames: [16, 17, 18], // Final damage in last frames
        opponentPosY: -20 // Positions above character
      },
      Combo_Leve_2: createGifAnim(URLS.stand_light_2, false, 2),

      ATTACK_LIGHT_3: createGifAnim(URLS.stand_light_3_1, false, 2),
      STAND_LIGHT_3_1: createGifAnim(URLS.stand_light_3_1, false, 2),
      STAND_LIGHT_3_2: createGifAnim(URLS.stand_light_3_2, false, 2),
      STAND_LIGHT_3_3: createGifAnim(URLS.stand_light_3_3, false, 2),
      Combo_Leve_3: createGifAnim(URLS.stand_light_3_1, false, 2),

      // Ataques Básicos Médios (Standing Medium)
      ATTACK_MEDIUM_1: createGifAnim(URLS.stand_medium, false, 3),
      STAND_MEDIUM_1: createGifAnim(URLS.stand_medium, false, 3),
      STAND_MEDIUM: createGifAnim(URLS.stand_medium, false, 3),
      Combo_Medio_1: createGifAnim(URLS.stand_medium, false, 3),

      // Ataques Básicos Fortes (Standing Heavy)
      ATTACK_HEAVY: createGifAnim(URLS.stand_heavy, false, 4),
      STAND_HEAVY: createGifAnim(URLS.stand_heavy, false, 4),
      Combo_Forte_1: createGifAnim(URLS.stand_heavy, false, 4),

      STAND_HEAVY_FORWARD_1: createGifAnim(URLS.stand_heavy_foward_1_1, false, 4),
      STAND_HEAVY_FORWARD_2: createGifAnim(URLS.stand_heavy_foward_1_2, false, 4),
      STAND_HEAVY_FORWARD_3: createGifAnim(URLS.stand_heavy_foward_1_3, false, 4),
      STAND_HEAVY_FORWARD_4: createGifAnim(URLS.stand_heavy_foward_1_4, false, 4),

      // Ataques Agachados (Crouch Attacks)
      [PlayerState.CROUCH_ATTACK]: createGifAnim(URLS.crouch_light, false, 2),
      ATTACK_CROUCH_LIGHT: createGifAnim(URLS.crouch_light, false, 2),
      ATTACK_CROUCH_LIGHT_1: createGifAnim(URLS.crouch_light, false, 2),
      CROUCH_LIGHT: createGifAnim(URLS.crouch_light, false, 2),

      ATTACK_CROUCH_MEDIUM: createGifAnim(URLS.crouch_medium_1_1, false, 3),
      ATTACK_CROUCH_MEDIUM_1: createGifAnim(URLS.crouch_medium_1_1, false, 3),
      CROUCH_MEDIUM_1_1: createGifAnim(URLS.crouch_medium_1_1, false, 3),
      CROUCH_MEDIUM_1_2: createGifAnim(URLS.crouch_medium_1_2, false, 3),
      CROUCH_MEDIUM_1_3: createGifAnim(URLS.crouch_medium_1_3, false, 3),
      CROUCH_MEDIUM_1_4: createGifAnim(URLS.crouch_medium_1_4, false, 3),

      CROUCH_MEDIUM_FORWARD_1: createGifAnim(URLS.crouch_medium_foward_1_1, false, 3),
      CROUCH_MEDIUM_FORWARD_2: createGifAnim(URLS.crouch_medium_foward_1_2, false, 3),
      CROUCH_MEDIUM_FORWARD_3: createGifAnim(URLS.crouch_medium_foward_1_3, false, 3),
      CROUCH_MEDIUM_FORWARD_4: createGifAnim(URLS.crouch_medium_foward_1_4, false, 3),

      ATTACK_CROUCH_HEAVY: createGifAnim(URLS.crouch_heavy_1_1, false, 4),
      CROUCH_HEAVY_1_1: createGifAnim(URLS.crouch_heavy_1_1, false, 4),
      CROUCH_HEAVY_1_2: createGifAnim(URLS.crouch_heavy_1_2, false, 4),
      CROUCH_HEAVY_1_3: createGifAnim(URLS.crouch_heavy_1_3, false, 4),
      CROUCH_HEAVY_1_4: createGifAnim(URLS.crouch_heavy_1_4, false, 4),
      CROUCH_HEAVY_1_5: createGifAnim(URLS.crouch_heavy_1_5, false, 4),
      CROUCH_HEAVY_1_6: createGifAnim(URLS.crouch_heavy_1_6, false, 4),
      CROUCH_HEAVY_1_7: createGifAnim(URLS.crouch_heavy_1_7, false, 4),

      CROUCH_HEAVY_BACK_1_1: createGifAnim(URLS.crouch_heavy_back_1_1, false, 4),
      CROUCH_HEAVY_BACK_1_2: createGifAnim(URLS.crouch_heavy_back_1_2, false, 4),
      CROUCH_HEAVY_BACK_1_3: createGifAnim(URLS.crouch_heavy_back_1_3, false, 4),
      CROUCH_HEAVY_BACK_1_4: createGifAnim(URLS.crouch_heavy_back_1_4, false, 4),
      CROUCH_HEAVY_BACK_1_5: createGifAnim(URLS.crouch_heavy_back_1_5, false, 4),
      CROUCH_HEAVY_BACK_1_6: createGifAnim(URLS.crouch_heavy_back_1_6, false, 4),
      CROUCH_HEAVY_BACK_1_7: createGifAnim(URLS.crouch_heavy_back_1_7, false, 4),
      CROUCH_HEAVY_BACK_1_8: createGifAnim(URLS.crouch_heavy_back_1_8, false, 4),
      CROUCH_HEAVY_BACK_1_9: createGifAnim(URLS.crouch_heavy_back_1_9, false, 4),

      // Ataques Aéreos (Jump / Air Attacks)
      [PlayerState.JUMP_ATTACK]: createGifAnim(URLS.air_light, false, 2),
      ATTACK_JUMP_LIGHT_1: createGifAnim(URLS.air_light, false, 2),
      Combo_Ar_1: createGifAnim(URLS.air_light, false, 2),
      AIR_LIGHT: createGifAnim(URLS.air_light, false, 2),

      ATTACK_JUMP_MEDIUM_1: createGifAnim(URLS.air_medium, false, 3),
      Combo_Ar_4: createGifAnim(URLS.air_medium, false, 3),
      AIR_MEDIUM: createGifAnim(URLS.air_medium, false, 3),

      AIR_MEDIUM_CROUCH: createGifAnim(URLS.air_medium_crouch, false, 3),
      AIR_MEDIUM_FORWARD: createGifAnim(URLS.air_medium_forwad, false, 3),

      ATTACK_JUMP_HEAVY: createGifAnim(URLS.air_stand_heavy, false, 4),
      Combo_Ar_7: createGifAnim(URLS.air_stand_heavy, false, 4),
      AIR_HEAVY: createGifAnim(URLS.air_stand_heavy, false, 4),
      AIR_STAND_HEAVY: createGifAnim(URLS.air_stand_heavy, false, 4),

      AIR_HEAVY_UP: createGifAnim(URLS.air_heavy_up, false, 4),


      KI_BLAST_1: createGifAnim(URLS.especial_kiblast_1, false, 6),
      KI_BLAST_2: createGifAnim(URLS.especial_kiblast_2, false, 6),
      KI_BLAST_AR_1: createGifAnim(URLS.especial_kiblast_ar_1, false, 6),
      KI_BLAST_AR_2: createGifAnim(URLS.especial_kiblast_ar_2, false, 6),


      Especial_1_1: {
        ...createGifAnim(URLS.especial_1_1, false, 6),
        effectConfigKey: "CHAVE_EFFECT_TELACHEIA_05_VERDE"
      },
      Especial_1_2: {
        ...createGifAnim(URLS.especial_1_2, false, 6),
        createsBeam: "CHAVE_BEAM_42",
        effectConfigKey: "CHAVE_EFFECT_TELACHEIA_05_VERDE"
      },
      Especial_1_1_Ar: {
        ...createGifAnim(URLS.especial_1_1, false, 6),
        effectConfigKey: "CHAVE_EFFECT_TELACHEIA_05_VERDE"
      },
      Especial_1_2_Ar: {
        ...createGifAnim(URLS.especial_1_2, false, 6),
        createsBeam: "CHAVE_BEAM_42",
        effectConfigKey: "CHAVE_EFFECT_TELACHEIA_05_VERDE"
      },

      Especial_2_1: createGifAnim(URLS.especial_2_1, false, 7),
      Especial_2_2: createGifAnim(URLS.especial_2_2, false, 7),
      Especial_2_3: createGifAnim(URLS.especial_2_3, false, 7),
      Especial_2_4: createGifAnim(URLS.especial_2_4, false, 7),
      Especial_2_5: createGifAnim(URLS.especial_2_5, false, 7),

      Especial_3_1: createGifAnim(URLS.especial_3_1, false, 8),
      Especial_3_2: createGifAnim(URLS.especial_3_2, false, 8),
      Especial_3_3: createGifAnim(URLS.especial_3_3, false, 8),

      Especial_4_1: createGifAnim(URLS.especial_4_1, false, 8),
      Especial_4_2: {
        ...createGifAnim(URLS.especial_4_2, true, 8),
        projectileId: "CHAVE_PROJETIL_17"
      },

      ULTIMATE_1_1: createGifAnim(URLS.ultimate_1_1, false),
      ULTIMATE_1_2: createGifAnim(URLS.ultimate_1_2, false),
      ULTIMATE_1_3: createGifAnim(URLS.ultimate_1_3, false),
      ULTIMATE_1_4: createGifAnim(URLS.ultimate_1_4, false),
      ULTIMATE_1_5: createGifAnim(URLS.ultimate_1_5, false),

      ULTIMATE_2_1: createGifAnim(URLS.ultimate_2_1, false),
      ULTIMATE_2_2: createGifAnim(URLS.ultimate_2_2, false),
      ULTIMATE_2_3: createGifAnim(URLS.ultimate_2_3, false),
      ULTIMATE_2_4: createGifAnim(URLS.ultimate_2_4, false),
      ULTIMATE_2_5: createGifAnim(URLS.ultimate_2_5, false),
      ULTIMATE_2_6: createGifAnim(URLS.ultimate_2_6, false),
      ULTIMATE_2_7: createGifAnim(URLS.ultimate_2_7, false),
      ULTIMATE_2_8: createGifAnim(URLS.ultimate_2_8, false),
      ULTIMATE_2_9: createGifAnim(URLS.ultimate_2_9, false),

      [PlayerState.STANDBY]: createGifAnim(URLS.parado, true),
      TAG_IN_KO: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.TAG_IN]: createGifAnim(URLS.entrada_por_ko, false),
      [PlayerState.TAG_OUT]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_ENTRY]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_EXIT]: createGifAnim(URLS.parado, false),
      [PlayerState.SPARKING]: createGifAnim(URLS.sparking, true),
      [PlayerState.VICTORY]: createGifAnim(URLS.parado, false),
    }
  },
  beamOverrides: BrolyIkari_Beams,
  phasedMoves: {
    'INTRO': {
        id: 'INTRO',
        phases: [
            { animation: 'INTRO_1', duration: 15, sfxName: 'intro_shout' },
            { animation: 'INTRO_2', duration: 15 },
            { animation: 'INTRO_3', duration: 15 },
            { animation: 'INTRO_4', duration: 15 },
            { animation: 'INTRO_5', duration: 15 },
            { animation: 'INTRO_6', duration: 15 },
            { animation: 'INTRO_7', duration: 15 },
            { animation: 'INTRO_8', duration: 30, shakeIntensity: 5 }
        ]
    },
    'STAND_LIGHT_1': {
        id: 'STAND_LIGHT_1',
        phases: [
            {
                animation: 'ATTACK_LIGHT_1',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 6,
                sfxName: 'attack_light',
                moveX: 4
            }
        ]
    },
    'STAND_LIGHT_2': {
        id: 'STAND_LIGHT_2',
        phases: [
            {
                animation: 'STAND_LIGHT_2',
                duration: 18,
                hitboxActive: true,
                snapOpponent: true, // Sustains and repositions opponent
                damage: 10,
                launchOpponent: { x: 15, y: -40 }, // Throws diagonal up in last frames
                sfxName: 'attack_light',
                moveX: 0 
            }
        ]
    },
    'STAND_LIGHT_3': {
        id: 'STAND_LIGHT_3',
        phases: [
            { animation: 'STAND_LIGHT_3_1', duration: 15, moveX: 0, hitboxActive: false, damage: 0 }, 
            { animation: 'STAND_LIGHT_3_2', duration: 20, hitboxActive: true, damage: 10, sfxName: 'attack', moveX: 12, moveY: -5 }, 
            { animation: 'STAND_LIGHT_3_3', duration: 22, hitboxActive: true, damage: 15, launchOpponent: { x: 10, y: -45 }, shakeIntensity: 2 } 
        ]
    },
    'STAND_MEDIUM_1': {
        id: 'STAND_MEDIUM_1',
        phases: [
            {
                animation: 'STAND_MEDIUM_1',
                duration: 20,
                hitboxActive: true,
                hitboxStartFrame: 3,
                hitboxEndFrame: 12,
                damage: 12,
                sfxName: 'attack_medium',
                moveX: 6
            }
        ]
    },
    'STAND_HEAVY': {
        id: 'STAND_HEAVY',
        phases: [
            {
                animation: 'STAND_HEAVY',
                duration: 35,
                hitboxActive: true,
                hitboxStartFrame: 5,
                hitboxEndFrame: 25,
                damage: 18,
                moveX: 12,
                launchOpponent: { x: 15, y: -40 },
                shakeIntensity: 4,
                sfxName: 'attack_heavy'
            }
        ]
    },
    'STAND_HEAVY_FORWARD': {
        id: 'STAND_HEAVY_FORWARD',
        phases: [
            { animation: 'STAND_HEAVY_FORWARD_1', duration: 15, moveX: 8, hitboxActive: false, damage: 0, sfxName: 'dash' },
            { animation: 'STAND_HEAVY_FORWARD_2', duration: 20, hitboxActive: true, damage: 5 }, 
            { animation: 'STAND_HEAVY_FORWARD_3', duration: 15, hitboxActive: true, damage: 5 }, 
            { animation: 'STAND_HEAVY_FORWARD_4', duration: 25, hitboxActive: true, damage: 20, launchOpponent: { x: 20, y: 45 }, shakeIntensity: 5, sfxName: 'attack_heavy' } 
        ]
    },
    'CROUCH_LIGHT': {
        id: 'CROUCH_LIGHT',
        phases: [
            {
                animation: 'CROUCH_LIGHT',
                duration: 15,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 10,
                damage: 6,
                moveX: 3, // Spec: "pequeno avanço e um golpe simples"
                sfxName: 'attack_light'
            }
        ]
    },
      CROUCH_MEDIUM: {
        id: 'CROUCH_MEDIUM',
        phases: [
            { animation: 'CROUCH_MEDIUM_1_1', duration: 12, moveX: 4, hitboxActive: true, damage: 5 },
            { animation: 'CROUCH_MEDIUM_1_2', duration: 12, moveX: 4, hitboxActive: true, damage: 6 },
            { animation: 'CROUCH_MEDIUM_1_3', duration: 18, moveX: 6, hitboxActive: true, damage: 10, sfxName: 'attack_medium', shakeIntensity: 2 },
            { animation: 'CROUCH_MEDIUM_1_4', duration: 12, moveX: 2, hitboxActive: true, damage: 5 }
        ]
    },
    'CROUCH_FORWARD_MEDIUM': {
        id: 'CROUCH_FORWARD_MEDIUM',
        phases: [
            { animation: 'CROUCH_MEDIUM_FORWARD_1', duration: 12, velocityJump: { x: 8, y: -15 }, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_MEDIUM_FORWARD_2', duration: 12, velocityJump: { x: 8, y: 20 }, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_MEDIUM_FORWARD_3', duration: 18, hitboxActive: false, damage: 0, shakeIntensity: 6, sfxName: 'attack_heavy' }, 
            { animation: 'CROUCH_MEDIUM_FORWARD_4', duration: 15, hitboxActive: true, damage: 20, launchOpponent: { x: 15, y: -35 } }
        ]
    },
    'CROUCH_HEAVY': {
        id: 'CROUCH_HEAVY',
        phases: [
            { animation: 'CROUCH_HEAVY_1_1', duration: 12, moveX: 8, hitboxActive: true, damage: 5 }, 
            { animation: 'CROUCH_HEAVY_1_2', duration: 15, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_HEAVY_1_3', duration: 15, hitboxActive: true, damage: 10, launchOpponent: { x: 20, y: -5 } }, 
            { animation: 'CROUCH_HEAVY_1_4', duration: 12, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_HEAVY_1_5', duration: 12, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_HEAVY_1_6', duration: 12, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_HEAVY_1_7', duration: 15, hitboxActive: true, damage: 15, launchOpponent: { x: 50, y: 0 }, sfxName: 'attack_heavy' }
        ]
    },
    'CROUCH_BACK_HEAVY': {
        id: 'CROUCH_BACK_HEAVY',
        phases: [
            { animation: 'CROUCH_HEAVY_BACK_1_1', duration: 10, moveX: 12, hitboxActive: false, damage: 0, sfxName: 'dash' },
            { animation: 'CROUCH_HEAVY_BACK_1_2', duration: 10, hitboxActive: true, damage: 4, shakeIntensity: 3 }, 
            { animation: 'CROUCH_HEAVY_BACK_1_3', duration: 10, hitboxActive: false, damage: 0 },
            { animation: 'CROUCH_HEAVY_BACK_1_4', duration: 10, hitboxActive: true, damage: 4, shakeIntensity: 3 },
            { animation: 'CROUCH_HEAVY_BACK_1_5', duration: 10, hitboxActive: false, damage: 0 },
            { animation: 'CROUCH_HEAVY_BACK_1_6', duration: 10, hitboxActive: true, damage: 4, shakeIntensity: 3 },
            { animation: 'CROUCH_HEAVY_BACK_1_7', duration: 10, hitboxActive: false, damage: 0 },
            { animation: 'CROUCH_HEAVY_BACK_1_8', duration: 15, hitboxActive: true, damage: 6, shakeIntensity: 3 },
            { animation: 'CROUCH_HEAVY_BACK_1_9', duration: 25, hitboxActive: true, damage: 15, launchOpponent: { x: 50, y: 0 }, shakeIntensity: 5, sfxName: 'attack_heavy' }
        ]
    },
    'AIR_LIGHT': {
        id: 'AIR_LIGHT',
        phases: [
            {
                animation: 'AIR_LIGHT',
                duration: 15,
                hitboxActive: true,
                damage: 5,
                suspendGravity: true,
                suspendOpponent: true, // Spec: "oponente também permanece suspenso"
                sfxName: 'attack_light'
            }
        ]
    },
    'AIR_MEDIUM': {
        id: 'AIR_MEDIUM',
        phases: [
            {
                animation: 'AIR_MEDIUM',
                duration: 18,
                hitboxActive: true,
                damage: 9,
                suspendGravity: true,
                suspendOpponent: true, // Spec: "oponente também permanece suspenso"
                sfxName: 'attack_medium'
            }
        ]
    },
    'AIR_MEDIUM_CROUCH': {
        id: 'AIR_MEDIUM_CROUCH',
        phases: [
            {
                animation: 'AIR_MEDIUM_CROUCH',
                duration: 18,
                hitboxActive: true,
                damage: 10,
                launchOpponent: { x: 20, y: 35 }, // Spec: "lançam o oponente em trajetória diagonal para baixo"
                suspendGravity: true,
                sfxName: 'attack_medium'
            }
        ]
    },
    'AIR_MEDIUM_FORWARD': {
        id: 'AIR_MEDIUM_FORWARD',
        phases: [
            {
                animation: 'AIR_MEDIUM_FORWARD',
                duration: 18,
                hitboxActive: true,
                damage: 10,
                moveX: 12,
                launchOpponent: { x: 25, y: 35 }, // Spec: "lançam o oponente em trajetória diagonal para baixo"
                suspendGravity: true,
                sfxName: 'attack_medium'
            }
        ]
    },
    'AIR_HEAVY': {
        id: 'AIR_HEAVY',
        phases: [
            {
                animation: 'AIR_HEAVY',
                duration: 20,
                hitboxActive: true,
                damage: 15,
                launchOpponent: { x: 20, y: 40 }, // Spec: "lançam o oponente em trajetória diagonal para baixo"
                suspendGravity: true,
                shakeIntensity: 4,
                sfxName: 'attack_heavy'
            }
        ]
    },
    'AIR_HEAVY_UP': {
        id: 'AIR_HEAVY_UP',
        phases: [
            {
                animation: 'AIR_HEAVY_UP',
                duration: 20,
                hitboxActive: true,
                damage: 15,
                suspendGravity: true,
                suspendOpponent: true, // Spec: "oponente também permanece suspenso"
                shakeIntensity: 4,
                sfxName: 'attack_heavy'
            }
        ]
    },
    'SPECIAL_1': {
        id: 'SPECIAL_1',
        phases: [
            { animation: 'Especial_1_1', duration: 15, sfxName: 'charge_special' },
            { animation: 'Especial_1_2', duration: 100, createsBeam: "CHAVE_BEAM_42", damage: 40, shakeIntensity: 5 }
        ]
    },
    'SPECIAL_2': {
        id: 'SPECIAL_2',
        phases: [
            { animation: 'Especial_2_1', duration: 12, homing: true }, // Push Heavy 1-5 behavior
            { animation: 'Especial_2_2', duration: 12, homing: true },
            { animation: 'Especial_2_3', duration: 25, homing: true, hitboxActive: true, damage: 22, launchOpponent: { x: 12, y: -10 }, sfxName: 'attack' },
            { animation: 'Especial_2_4', duration: 15 },
            { animation: 'Especial_2_5', duration: 12 }
        ]
    },
    'SPECIAL_3': {
        id: 'SPECIAL_3',
        phases: [
            { animation: 'Especial_3_1', duration: 15, sfxName: 'charge_special' },
            { animation: 'Especial_3_2', duration: 30, hitboxActive: true, damage: 28, launchOpponent: { x: 0, y: -30 }, shakeIntensity: 4 },
            { animation: 'Especial_3_3', duration: 20 }
        ]
    },
    'SPECIAL_4': {
        id: 'SPECIAL_4',
        phases: [
            { animation: 'Especial_4_1', duration: 15 },
            { animation: 'Especial_4_2', duration: 30, hitboxActive: true, damage: 18, projectile: 'CHAVE_PROJETIL_17', sfxName: 'kiblast' }
        ]
    },
    'ULTIMATE_1': {
        id: 'ULTIMATE_1',
        phases: [
            { animation: 'ULTIMATE_1_1', duration: 40, sfxName: 'ultimate_start' },
            { animation: 'ULTIMATE_1_2', duration: 35 },
            { animation: 'ULTIMATE_1_3', duration: 30, shakeIntensity: 3 },
            { animation: 'ULTIMATE_1_4', duration: 80, damage: 160, createsBeam: "CHAVE_BEAM_42", shakeIntensity: 10 },
            { animation: 'ULTIMATE_1_5', duration: 30 }
        ]
    },
    'ULTIMATE_2': {
        id: 'ULTIMATE_2',
        phases: [
            { animation: 'ULTIMATE_2_1', duration: 30, sfxName: 'ultimate_start' },
            { animation: 'ULTIMATE_2_2', duration: 30 },
            { animation: 'ULTIMATE_2_3', duration: 30 },
            { animation: 'ULTIMATE_2_4', duration: 30, shakeIntensity: 4 },
            { animation: 'ULTIMATE_2_5', duration: 30 },
            { animation: 'ULTIMATE_2_6', duration: 30 },
            { animation: 'ULTIMATE_2_7', duration: 30 },
            { animation: 'ULTIMATE_2_8', duration: 80, damage: 180, shakeIntensity: 12 },
            { animation: 'ULTIMATE_2_9', duration: 40 }
        ]
    },
    'KI_BLAST': {
        id: 'KI_BLAST',
        phases: [
            { animation: 'KI_BLAST_1', duration: 10 },
            { animation: 'KI_BLAST_2', duration: 15, hitboxActive: true, damage: 6, projectile: 'KI_BLAST' }
        ]
    },
    'KI_BLAST_AR': {
        id: 'KI_BLAST_AR',
        phases: [
            { animation: 'KI_BLAST_AR_1', duration: 10 },
            { animation: 'KI_BLAST_AR_2', duration: 15, hitboxActive: true, damage: 6, projectile: 'KI_BLAST' }
        ]
    },
    'DRAGON_RUSH': {
        id: 'DRAGON_RUSH',
        phases: [
            { animation: 'dragon_rush_1', duration: 15, homing: true, sfxName: 'dash' },
            { animation: 'dragon_rush_2', duration: 35, snapOpponent: true, damage: 12, sfxName: 'attack_medium' },
            { animation: 'dragon_rush_3', duration: 30, hitboxActive: true, damage: 20, launchOpponent: { x: 25, y: -12 }, shakeIntensity: 5, sfxName: 'attack_heavy' }
        ]
    }
  }
};

