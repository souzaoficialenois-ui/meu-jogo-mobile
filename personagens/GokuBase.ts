import { CharacterData, PlayerState } from '../types';
import { GokuBase_Beams } from './beams/GokuBase_Beams';

const BASE_URL = "/Assets/personagens/gokubase/";

const URLS = {
  agachado: "/Assets/personagens/gokubase/agachado.gif",
  aterrisando: "/Assets/personagens/gokubase/aterrisando.gif",
  carregando_ki_1: "/Assets/personagens/gokubase/carregando_ki_1_1.gif",
  carregando_ki_2: "/Assets/personagens/gokubase/carregando_ki_1_2.gif",
  carregando_ki_3: "/Assets/personagens/gokubase/carregando_ki_1_3.gif",

  // Novas Animações de Dano e Hits
  hit_light: "/Assets/personagens/gokubase/hit_light.gif",
  hit_medium: "/Assets/personagens/gokubase/hit_medium.gif",
  hit_heavy: "/Assets/personagens/gokubase/hit_heavy.gif",
  hit_air: "/Assets/personagens/gokubase/hit_air.gif",
  hit_launch: "/Assets/personagens/gokubase/hit_launch.gif",
  hit_grabbed: "/Assets/personagens/gokubase/hit_grabbed.gif",
  hit_bounce: "/Assets/personagens/gokubase/hit_bounce.gif",
  hit_air_fall: "/Assets/personagens/gokubase/hit_air_fall.gif",
  hit_ground_crash: "/Assets/personagens/gokubase/hit_ground_crash.gif",
  hit_ground_stun: "/Assets/personagens/gokubase/hit_ground_stun.gif",
  hit_ground_recover: "/Assets/personagens/gokubase/hit_ground_recover.gif",
  hit_ground_push_up: "/Assets/personagens/gokubase/hit_ground_push_up.gif",
  hit_ground_launch: "/Assets/personagens/gokubase/hit_ground_launch.gif",

  // Ataques Básicos
  stand_light_1: "/Assets/personagens/gokubase/stand_light_1.gif",
  stand_light_2: "/Assets/personagens/gokubase/stand_light_2.gif",
  stand_light_3: "/Assets/personagens/gokubase/stand_light_3.gif",
  crouch_light_1: "/Assets/personagens/gokubase/crouch_light_1.gif",
  air_light_up_1: "/Assets/personagens/gokubase/air_light_up_1.gif",

  stand_medium_1: "/Assets/personagens/gokubase/stand_medium_1.gif",
  crouch_medium_1: "/Assets/personagens/gokubase/crouch_medium_1.gif",
  air_medium_1: "/Assets/personagens/gokubase/air_medium_1.gif",
  air_medium_foward_1: "/Assets/personagens/gokubase/air_medium_foward_1.gif",

  stand_heavy_1_1: "/Assets/personagens/gokubase/stand_heavy_1_1.gif",
  stand_heavy_1_2: "/Assets/personagens/gokubase/stand_heavy_1_2.gif",
  stand_heavy_1_3: "/Assets/personagens/gokubase/stand_heavy_1_3.gif",
  crouch_heavy_1: "/Assets/personagens/gokubase/crouch_heavy_1.gif",
  air_heavy_up_1: "/Assets/personagens/gokubase/air_heavy_up_1.gif",

  crouch_back_medium_1_1: "/Assets/personagens/gokubase/crouch_back_medium_1_1.gif",
  crouch_back_medium_1_2: "/Assets/personagens/gokubase/crouch_back_medium_1_2.gif",
  crouch_back_medium_1_3: "/Assets/personagens/gokubase/crouch_back_medium_1_3.gif",
  crouch_back_medium_1_4: "/Assets/personagens/gokubase/crouch_back_medium_1_4.gif",
  crouch_back_medium_1_5: "/Assets/personagens/gokubase/crouch_back_medium_1_5.gif",

  crouch_back_heavy_1_1: "/Assets/personagens/gokubase/crouch_back_heavy_1_1.gif",
  crouch_back_heavy_1_2: "/Assets/personagens/gokubase/crouch_back_heavy_1_2.gif",
  crouch_back_heavy_1_3: "/Assets/personagens/gokubase/crouch_back_heavy_1_3.gif",
  crouch_back_heavy_1_4: "/Assets/personagens/gokubase/crouch_back_heavy_1_4.gif",
  crouch_back_heavy_1_5: "/Assets/personagens/gokubase/crouch_back_heavy_1_5.gif",

  defesa: "/Assets/personagens/gokubase/defesa.gif",
  defesa_agachado: "/Assets/personagens/gokubase/defesa_agachado.gif",
  defesa_ar: "/Assets/personagens/gokubase/defesa_ar.gif",
  double_tap: "/Assets/personagens/gokubase/double_tap.gif",
  dragon_rush_1: "/Assets/personagens/gokubase/dragon_rush_1.gif",
  dragon_rush_2: "/Assets/personagens/gokubase/dragon_rush_2.gif",
  dragon_rush_3: "/Assets/personagens/gokubase/dragon_rush_3.gif",
  entrada_por_ko: "/Assets/personagens/gokubase/entrada_por_ko.gif",
  especial_1_1: "/Assets/personagens/gokubase/especial_1_1.gif",
  especial_1_2: "/Assets/personagens/gokubase/especial_1_2.gif",
  especial_2_1: "/Assets/personagens/gokubase/especial_2_1.gif",
  especial_2_2: "/Assets/personagens/gokubase/especial_2_2.gif",
  especial_2_3: "/Assets/personagens/gokubase/especial_2_3.gif",
  especial_2_4: "/Assets/personagens/gokubase/especial_2_4.gif",
  especial_3_1: "/Assets/personagens/gokubase/especial_3_1.gif",
  especial_3_2: "/Assets/personagens/gokubase/especial_3_2.gif",
  especial_3_3: "/Assets/personagens/gokubase/especial_3_3.gif",
  especial_4_1: "/Assets/personagens/gokubase/especial_4_1.gif",
  especial_4_2: "/Assets/personagens/gokubase/especial_4_2.gif",
  especial_4_3: "/Assets/personagens/gokubase/especial_4_3.gif",
  especial_4_4: "/Assets/personagens/gokubase/especial_4_4.gif",
  especial_kiblast_1_1: "/Assets/personagens/gokubase/especial_kiblast_1_1.gif",
  especial_kiblast_1_2: "/Assets/personagens/gokubase/especial_kiblast_1_2.gif",
  especial_kiblast_1_3: "/Assets/personagens/gokubase/especial_kiblast_1_3.gif",
  especial_kiblast_1_4: "/Assets/personagens/gokubase/especial_kiblast_1_4.gif",
  especial_kiblast_ar_1_1: "/Assets/personagens/gokubase/especial_kiblast_ar_1_1.gif",
  especial_kiblast_ar_1_2: "/Assets/personagens/gokubase/especial_kiblast_ar_1_2.gif",
  especial_kiblast_ar_1_3: "/Assets/personagens/gokubase/especial_kiblast_ar_1_3.gif",
  especial_kiblast_ar_1_4: "/Assets/personagens/gokubase/especial_kiblast_ar_1_4.gif",
  frente: "/Assets/personagens/gokubase/frente.gif",
  fundindo_base_1_1: "/Assets/personagens/gokubase/fundindo_base_1_1.gif",
  fundindo_base_1_2: "/Assets/personagens/gokubase/fundindo_base_1_2.gif",
  fundindo_base_1_3: "/Assets/personagens/gokubase/fundindo_base_1_3.gif",
  introducao_1_1: "/Assets/personagens/gokubase/introducao_1_1.gif",
  introducao_1_2: "/Assets/personagens/gokubase/introducao_1_2.gif",
  introducao_1_3: "/Assets/personagens/gokubase/introducao_1_3.gif",
  introducao_1_4: "/Assets/personagens/gokubase/introducao_1_4.gif",
  introducao_1_5: "/Assets/personagens/gokubase/introducao_1_5.gif",
  introducao_1_6: "/Assets/personagens/gokubase/introducao_1_6.gif",
  introducao_1_7: "/Assets/personagens/gokubase/introducao_1_7.gif",
  introducao_1_8: "/Assets/personagens/gokubase/introducao_1_8.gif",
  introducao_1_9: "/Assets/personagens/gokubase/introducao_1_9.gif",
  introducao_1_10: "/Assets/personagens/gokubase/introducao_1_10.gif",
  introducao_1_11: "/Assets/personagens/gokubase/introducao_1_11.gif",
  introducao_1_12: "/Assets/personagens/gokubase/introducao_1_12.gif",
  parado: "/Assets/personagens/gokubase/parado.gif",
  pulo: "/Assets/personagens/gokubase/pulo.gif",
  sparking: "/Assets/personagens/gokubase/sparking.gif",
  super_dash_1: "/Assets/personagens/gokubase/super_dash_1.gif",
  super_dash_2: "/Assets/personagens/gokubase/super_dash_2.gif",
  teleporte: "/Assets/personagens/gokubase/teleporte.gif",
  transformacao_blue_1_1: "/Assets/personagens/gokubase/transformacao_blue_1_1.gif",
  transformacao_blue_1_2: "/Assets/personagens/gokubase/transformacao_blue_1_2.gif",
  transformacao_blue_1_3: "/Assets/personagens/gokubase/transformacao_blue_1_3.gif",
  transformacao_mui_1_1: "/Assets/personagens/gokubase/transformacao_mui_1_1.gif",
  transformacao_mui_1_2: "/Assets/personagens/gokubase/transformacao_mui_1_2.gif",
  transformacao_ssj_1_1: "/Assets/personagens/gokubase/transformacao_ssj_1_1.gif",
  transformacao_ssj_1_2: "/Assets/personagens/gokubase/transformacao_ssj_1_2.gif",
  tras: "/Assets/personagens/gokubase/tras.gif",
  air_dash_knee: "/Assets/personagens/gokubase/air_dash_knee.gif",
  ultimate_1_1: "/Assets/personagens/gokubase/ultimate_1_1.gif",
  ultimate_1_2: "/Assets/personagens/gokubase/ultimate_1_2.gif",
  ultimate_1_3: "/Assets/personagens/gokubase/ultimate_1_3.gif",
  ultimate_1_4: "/Assets/personagens/gokubase/ultimate_1_4.gif",
  ultimate_1_5: "/Assets/personagens/gokubase/ultimate_1_5.gif",
  ultimate_1_6: "/Assets/personagens/gokubase/ultimate_1_6.gif",
  ultimate_1_7: "/Assets/personagens/gokubase/ultimate_1_7.gif",
  ultimate_2_1: "/Assets/personagens/gokubase/ultimate_2_1.gif",
  ultimate_2_2: "/Assets/personagens/gokubase/ultimate_2_2.gif",
  ultimate_2_3: "/Assets/personagens/gokubase/ultimate_2_3.gif",
  ultimate_2_4: "/Assets/personagens/gokubase/ultimate_2_4.gif",
  ultimate_2_5: "/Assets/personagens/gokubase/ultimate_2_5.gif",
  ultimate_combinado_1_1: "/Assets/personagens/gokubase/ultimate_combinado_1_1.gif",
  ultimate_combinado_1_2: "/Assets/personagens/gokubase/ultimate_combinado_1_2.gif",
  ultimate_combinado_1_3: "/Assets/personagens/gokubase/ultimate_combinado_1_3.gif",
  ultimate_combinado_1_4: "/Assets/personagens/gokubase/ultimate_combinado_1_4.gif",
  ultimate_combinado_1_5: "/Assets/personagens/gokubase/ultimate_combinado_1_5.gif",
  ultimate_combinado_1_6: "/Assets/personagens/gokubase/ultimate_combinado_1_6.gif",
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
) => {
  const isGif = url.toLowerCase().endsWith(".gif") || url.toLowerCase().includes(".gif?");
  return {
    imageUrl: url,
    frames: 1,
    frameWidth: 0,
    frameHeight: 0,
    isGif,
    speed,
    loop,
    scale: 2.2,
  };
};

export const GokuBase: CharacterData = {
  id: "goku_base",
  name: "GOKU BASE",
  color: "#f97316",
  rarity: "COMMON",
  tags: ["SAIYAN", "HERO"],
  transformTo: ["goku_ssj", "goku_blue", "goku_mui"],
  detransformTo: [],
  beamOverrides: GokuBase_Beams,
  introText: "Oi, eu sou o Goku!",
  stats: {
    attack: 8,
    defense: 8,
    speed: 8,
  },
  ...DEFAULT_RPG,
  spriteConfig: {
    defaultScale: 2.2,
    portraitUrl: "/Assets/personagens/gokubase/prewiew.png",
    hitboxWidth: 49,
    hitboxHeight: 101,
    hitboxOffsetX: 26,
    hitboxOffsetY: 79,
    animations: {
      [PlayerState.INTRO]: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_1.gif",
        "frames": 5,
        "frameWidth": 78,
        "frameHeight": 66,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 50,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 3.6
      },
      INTRO_1: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_1.gif",
        "frames": 5,
        "frameWidth": 78,
        "frameHeight": 66,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 50,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 3.6
      },
      INTRO_2: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_2.gif",
        "frames": 7,
        "frameWidth": 89,
        "frameHeight": 89,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 1.5999999999999996,
        "offsetX": 49,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 4.4,
        "cameraFocusX": 50,
        "cameraFocusY": 108
      },
      INTRO_3: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_3.gif",
        "frames": 5,
        "frameWidth": 78,
        "frameHeight": 66,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 47,
        "offsetY": 0
      },
      INTRO_4: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_4.gif",
        "frames": 3,
        "frameWidth": 31,
        "frameHeight": 55,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 2.75
      },
      INTRO_5: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_5.gif",
        "frames": 6,
        "frameWidth": 64,
        "frameHeight": 46,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 1.1,
        "offsetX": 10,
        "offsetY": 67,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5,
        "fullScreen": true
      },
      INTRO_6: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_6.gif",
        "frames": 23,
        "frameWidth": 31,
        "frameHeight": 57,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 8.15,
        "cameraFocusY": 117,
        "cameraFocusX": 51,
        "cameraRotation": -28
      },
      INTRO_7: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_7.gif",
        "frames": 5,
        "frameWidth": 160,
        "frameHeight": 90,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 0.4,
        "offsetX": -6,
        "offsetY": 34,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5,
        "fullScreen": true
      },
      INTRO_8: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_8.gif",
        "frames": 3,
        "frameWidth": 30,
        "frameHeight": 54,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 5
      },
      INTRO_9: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_9.gif",
        "frames": 4,
        "frameWidth": 31,
        "frameHeight": 54,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 3.6
      },
      INTRO_10: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_10.gif",
        "frames": 9,
        "frameWidth": 37,
        "frameHeight": 51,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 4.9,
        "cameraFocusX": 51,
        "cameraFocusY": 110
      },
      INTRO_11: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_11.gif",
        "frames": 7,
        "frameWidth": 38,
        "frameHeight": 51,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 5,
        "cameraFocusX": 49,
        "cameraFocusY": 117
      },
      INTRO_12: {
        "imageUrl": "/Assets/personagens/gokubase/introducao_1_12.gif",
        "frames": 9,
        "frameWidth": 131,
        "frameHeight": 74,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 0.30000000000000004,
        "offsetX": 0,
        "offsetY": 24,
        "fullScreen": true,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5
      },

      [PlayerState.IDLE]: createGifAnim(URLS.parado, true),
      [PlayerState.RUNNING]: createGifAnim(URLS.frente, true),
      [PlayerState.WALK_BACKWARD]: createGifAnim(URLS.tras, true),
      [PlayerState.DASH_START]: createGifAnim(URLS.super_dash_1, false),
      [PlayerState.DASHING]: createGifAnim(URLS.super_dash_2, true),
      [PlayerState.DASH_END]: createGifAnim(URLS.super_dash_2, false),
      [PlayerState.CROUCH]: createGifAnim(URLS.agachado, true),
      [PlayerState.JUMPING]: createGifAnim(URLS.pulo, false),
      [PlayerState.FALLING]: createGifAnim(URLS.pulo, true),
      [PlayerState.LANDING]: createGifAnim(URLS.aterrisando, false),
      FALLING_LOOP: createGifAnim(URLS.pulo, true),

      [PlayerState.HIT]: createGifAnim(URLS.hit_light, false, 8),
      [PlayerState.HIT_2]: createGifAnim(URLS.hit_medium, false, 8),
      [PlayerState.HIT_3]: createGifAnim(URLS.hit_heavy, false, 8),
      [PlayerState.FALLING_HIT]: createGifAnim(URLS.hit_air_fall, true, 8),
      [PlayerState.FALLING_HIT_GROUND]: createGifAnim(URLS.hit_ground_crash, false, 8),
      [PlayerState.LAUNCHED]: createGifAnim(URLS.hit_launch, false, 8),
      [PlayerState.STUNNED]: createGifAnim(URLS.hit_ground_stun, false, 8),
      [PlayerState.GUARD_BREAK]: createGifAnim(URLS.hit_heavy, false, 8),
      [PlayerState.KNOCKED_DOWN]: createGifAnim(URLS.hit_ground_stun, false, 8),
      [PlayerState.DEFEAT]: createGifAnim(URLS.hit_ground_crash, false, 8),
      [PlayerState.GROUND_RECOVERY]: createGifAnim(URLS.hit_ground_recover, false, 8),
      [PlayerState.GRABBED]: createGifAnim(URLS.hit_grabbed, false, 8),
      
      HIT_HIGH_LIGHT: createGifAnim(URLS.hit_light, false, 8),
      HIT_HIGH_MEDIUM: createGifAnim(URLS.hit_medium, false, 8),
      HIT_HIGH_HARD: createGifAnim(URLS.hit_heavy, false, 8),
      HIT_LOW_LIGHT: createGifAnim(URLS.hit_light, false, 8),
      HIT_LOW_HARD: createGifAnim(URLS.hit_medium, false, 8),
      CROUCH_HIT: createGifAnim(URLS.hit_light, false, 8),
      AIR_HIT: createGifAnim(URLS.hit_air, false, 8),
      AIR_HIT_START: createGifAnim(URLS.hit_air, false, 8),
      GROUND_BOUNCE: createGifAnim(URLS.hit_bounce, false, 8),
      GROUND_LAUNCH: createGifAnim(URLS.hit_ground_launch, false, 8),
      FALL: createGifAnim(URLS.pulo, true, 8),
      LAUNCHED: createGifAnim(URLS.hit_launch, false, 8),
      DOWN_LYING_DOWN: createGifAnim(URLS.hit_ground_stun, true, 8),
      GET_UP_START: createGifAnim(URLS.hit_ground_push_up, false, 8),
      GET_UP_MIDDLE: createGifAnim(URLS.hit_ground_recover, false, 8),
      GET_UP_END: createGifAnim(URLS.parado, false, 8),
      GET_UP_AIR: createGifAnim(URLS.hit_air, false, 8),

      // Ataques Básicos
      [PlayerState.ATTACKING]: createGifAnim(URLS.stand_light_1, false, 15),
      ATTACK_LIGHT_1: createGifAnim(URLS.stand_light_1, false, 15),
      ATTACK_LIGHT_2: createGifAnim(URLS.stand_light_2, false, 15),
      ATTACK_LIGHT_3: createGifAnim(URLS.stand_light_3, false, 15),
      STAND_LIGHT_1: createGifAnim(URLS.stand_light_1, false, 15),
      STAND_LIGHT_2: createGifAnim(URLS.stand_light_2, false, 15),
      STAND_LIGHT_3: createGifAnim(URLS.stand_light_3, false, 15),

      ATTACK_MEDIUM_1: createGifAnim(URLS.stand_medium_1, false, 12),
      STAND_MEDIUM_1: createGifAnim(URLS.stand_medium_1, false, 12),

      ATTACK_HEAVY: createGifAnim(URLS.stand_heavy_1_1, false, 10),
      STAND_HEAVY_1_1: createGifAnim(URLS.stand_heavy_1_1, false, 10),
      STAND_HEAVY_1_2: createGifAnim(URLS.stand_heavy_1_2, false, 10),
      STAND_HEAVY_1_3: {
        ...createGifAnim(URLS.stand_heavy_1_3, false, 10),
        damageFrames: [23, 24, 25] // Damage only in the last frames as requested
      },

      [PlayerState.CROUCH_ATTACK]: createGifAnim(URLS.crouch_light_1, false, 15),
      ATTACK_CROUCH_LIGHT: createGifAnim(URLS.crouch_light_1, false, 15),
      CROUCH_LIGHT_1: createGifAnim(URLS.crouch_light_1, false, 15),

      ATTACK_CROUCH_MEDIUM: createGifAnim(URLS.crouch_medium_1, false, 12),
      CROUCH_MEDIUM_1: createGifAnim(URLS.crouch_medium_1, false, 12),

      ATTACK_CROUCH_HEAVY: createGifAnim(URLS.crouch_heavy_1, false, 10),
      CROUCH_HEAVY_1: createGifAnim(URLS.crouch_heavy_1, false, 10),

      CROUCH_BACK_MEDIUM_1: createGifAnim(URLS.crouch_back_medium_1_1, false, 12),
      CROUCH_BACK_MEDIUM_1_1: createGifAnim(URLS.crouch_back_medium_1_1, false, 12),
      CROUCH_BACK_MEDIUM_1_2: createGifAnim(URLS.crouch_back_medium_1_2, false, 12),
      CROUCH_BACK_MEDIUM_1_3: createGifAnim(URLS.crouch_back_medium_1_3, false, 12),
      CROUCH_BACK_MEDIUM_1_4: createGifAnim(URLS.crouch_back_medium_1_4, false, 12),
      CROUCH_BACK_MEDIUM_1_5: createGifAnim(URLS.crouch_back_medium_1_5, false, 12),

      CROUCH_BACK_HEAVY_1: createGifAnim(URLS.crouch_back_heavy_1_1, false, 10),
      CROUCH_BACK_HEAVY_1_1: createGifAnim(URLS.crouch_back_heavy_1_1, false, 10),
      CROUCH_BACK_HEAVY_1_2: createGifAnim(URLS.crouch_back_heavy_1_2, false, 10),
      CROUCH_BACK_HEAVY_1_3: createGifAnim(URLS.crouch_back_heavy_1_3, false, 10),
      CROUCH_BACK_HEAVY_1_4: createGifAnim(URLS.crouch_back_heavy_1_4, false, 10),
      CROUCH_BACK_HEAVY_1_5: createGifAnim(URLS.crouch_back_heavy_1_5, false, 10),

      AIR_LIGHT: createGifAnim(URLS.air_light_up_1, false, 15),
      AIR_LIGHT_UP: createGifAnim(URLS.air_light_up_1, false, 15),
      AIR_MEDIUM: createGifAnim(URLS.air_medium_1, false, 12),
      AIR_MEDIUM_FORWARD: createGifAnim(URLS.air_medium_foward_1, false, 12),
      AIR_HEAVY: createGifAnim(URLS.air_heavy_up_1, false, 15),
      AIR_HEAVY_UP: createGifAnim(URLS.air_heavy_up_1, false, 10),
      AIR_DASH_KNEE: createGifAnim(URLS.air_dash_knee, false, 15),

      [PlayerState.CHARGE_START]: createGifAnim(URLS.carregando_ki_1, false),
      [PlayerState.CHARGING]: {
        imageUrl: URLS.carregando_ki_2,
        frames: 2,
        frameWidth: 32,
        frameHeight: 46,
        isGif: true,
        speed: 5,
        loop: true,
        scale: 2.2,
        offsetX: 0,
        offsetY: 0,
        auraConfigKey: "CHAVE_AURA_001"
      },
      [PlayerState.CHARGE_END]: createGifAnim(URLS.carregando_ki_3, false),

      [PlayerState.BLOCKING]: createGifAnim(URLS.defesa, true, 4),
      [PlayerState.BLOCKING_CROUCH]: createGifAnim(URLS.defesa_agachado, true, 4),
      [PlayerState.BLOCKING_AIR]: createGifAnim(URLS.defesa_ar, true, 4),
      
      [PlayerState.VANISH]: createGifAnim(URLS.teleporte, false),
      TELEPORTE: createGifAnim(URLS.teleporte, false),
      [PlayerState.SPARKING]: createGifAnim(URLS.sparking, true),

      [PlayerState.SUPER_DASH]: createGifAnim(URLS.super_dash_1, true, 5),
      SUPER_DASH_1: createGifAnim(URLS.super_dash_1, true, 5),
      SUPER_DASH_2: createGifAnim(URLS.super_dash_2, true, 5),
      super_dash_2: createGifAnim(URLS.super_dash_2, true, 5),
      [PlayerState.QUICK_DASH]: createGifAnim(URLS.double_tap, false),
      DOUBLE_TAP: createGifAnim(URLS.double_tap, false),
      
      TRANSFORM_GOKU_SSJ_1: createGifAnim(URLS.transformacao_ssj_1_1, false, 4),
      TRANSFORM_GOKU_SSJ_2: createGifAnim(URLS.transformacao_ssj_1_2, false, 4),
      TRANSFORM_GOKU_BLUE_1: createGifAnim(URLS.transformacao_blue_1_1, false, 4),
      TRANSFORM_GOKU_BLUE_2: createGifAnim(URLS.transformacao_blue_1_2, false, 4),
      TRANSFORM_GOKU_BLUE_3: createGifAnim(URLS.transformacao_blue_1_3, false, 4),
      TRANSFORM_GOKU_MUI_1: createGifAnim(URLS.transformacao_mui_1_1, false, 4),
      TRANSFORM_GOKU_MUI_2: createGifAnim(URLS.transformacao_mui_1_2, false, 4),
      
      DEFUSION_1: createGifAnim(URLS.fundindo_base_1_1, false, 4),
      DEFUSION_2: createGifAnim(URLS.fundindo_base_1_2, false, 4),
      DEFUSION_3: createGifAnim(URLS.fundindo_base_1_3, false, 4),

      FUSION_1: createGifAnim(URLS.fundindo_base_1_1, false),
      FUSION_2: createGifAnim(URLS.fundindo_base_1_2, false),
      FUSION_3: createGifAnim(URLS.fundindo_base_1_3, false),

      [PlayerState.DRAGON_RUSH]: createGifAnim(URLS.dragon_rush_1, false, 4),
      DRAGON_RUSH_1: createGifAnim(URLS.dragon_rush_1, false, 4),
      DRAGON_RUSH_2: createGifAnim(URLS.dragon_rush_2, false, 4),
      DRAGON_RUSH_3: createGifAnim(URLS.dragon_rush_3, false, 4),
      DRAGON_DASH_FOLLOW: createGifAnim(URLS.dragon_rush_2, false, 4),
      DRAGON_COMBO: createGifAnim(URLS.dragon_rush_3, false, 4),

      KI_BLAST_1: createGifAnim(URLS.especial_kiblast_1_1, false),
      KI_BLAST_2: createGifAnim(URLS.especial_kiblast_1_2, false),
      KI_BLAST_3: createGifAnim(URLS.especial_kiblast_1_3, false),
      KI_BLAST_4: createGifAnim(URLS.especial_kiblast_1_4, false),

      KI_BLAST_AR_1: createGifAnim(URLS.especial_kiblast_ar_1_1, false),
      KI_BLAST_AR_2: createGifAnim(URLS.especial_kiblast_ar_1_2, false),
      KI_BLAST_AR_3: createGifAnim(URLS.especial_kiblast_ar_1_3, false),
      KI_BLAST_AR_4: createGifAnim(URLS.especial_kiblast_ar_1_4, false),

      Especial_1_1: createGifAnim(URLS.especial_1_1, false),
      Especial_1_2: {
        ...createGifAnim(URLS.especial_1_2, false),
        createsBeam: "CHAVE_BEAM_002",
        effectConfigKey: "CHAVE_EFFECT_TELACHEIA_05_AZUL"
      },

      Especial_2_1: createGifAnim(URLS.especial_2_1, false),
      Especial_2_2: createGifAnim(URLS.especial_2_2, false),
      Especial_2_3: createGifAnim(URLS.especial_2_3, false),
      Especial_2_4: createGifAnim(URLS.especial_2_4, false),

      Especial_3_1: createGifAnim(URLS.especial_3_1, false),
      Especial_3_2: createGifAnim(URLS.especial_3_2, false),
      Especial_3_3: createGifAnim(URLS.especial_3_3, false),

      Especial_4_1: createGifAnim(URLS.especial_4_1, false),
      Especial_4_2: createGifAnim(URLS.especial_4_2, false),
      Especial_4_3: createGifAnim(URLS.especial_4_3, false),
      Especial_4_4: createGifAnim(URLS.especial_4_4, false),

      ULTIMATE_1_1: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_1_1.gif",
        "frames": 8,
        "frameWidth": 104,
        "frameHeight": 78,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": -10,
        "offsetY": 12,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 9.3,
        "cameraRotation": -23,
        "cameraFocusX": 56,
        "cameraFocusY": 107
      },
      ULTIMATE_1_2: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_1_2.gif",
        "frames": 7,
        "frameWidth": 63,
        "frameHeight": 65,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 6,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 2.8
      },
      ULTIMATE_1_3: createGifAnim(URLS.ultimate_1_3, false),
      ULTIMATE_1_4: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_1_4.gif",
        "frames": 17,
        "frameWidth": 159,
        "frameHeight": 90,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.5,
        "offsetX": 50,
        "offsetY": 30,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5,
        "fullScreen": true
      },
      ULTIMATE_1_5: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_1_5.gif",
        "frames": 3,
        "frameWidth": 83,
        "frameHeight": 89,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 3.85
      },
      ULTIMATE_1_6: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_1_6.gif",
        "frames": 8,
        "frameWidth": 122,
        "frameHeight": 74,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 0.8,
        "offsetX": 12,
        "offsetY": 30,
        "fullScreen": true,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5
      },
      ULTIMATE_1_7: createGifAnim(URLS.ultimate_1_7, false),

      ULTIMATE_2_1: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_2_1.gif",
        "frames": 6,
        "frameWidth": 43,
        "frameHeight": 61,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 2.2,
        "offsetX": 0,
        "offsetY": 0,
        "zoomType": "ZOOM_IN",
        "zoomAmount": 3.1
      },
      ULTIMATE_2_2: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_2_2.gif",
        "frames": 13,
        "frameWidth": 160,
        "frameHeight": 90,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 0.49999999999999933,
        "offsetX": 4,
        "offsetY": 20,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5,
        "fullScreen": true
      },
      ULTIMATE_2_3: createGifAnim(URLS.ultimate_2_3, false),
      ULTIMATE_2_4: {
        "imageUrl": "/Assets/personagens/gokubase/ultimate_2_4.gif",
        "frames": 11,
        "frameWidth": 160,
        "frameHeight": 90,
        "isGif": true,
        "speed": 5,
        "loop": false,
        "scale": 0.49999999999999933,
        "offsetX": -15,
        "offsetY": 20,
        "fullScreen": true,
        "zoomType": "IMMEDIATE",
        "zoomAmount": 1.5
      },
      ULTIMATE_2_5: createGifAnim(URLS.ultimate_2_5, false),
      ULTIMATE_3_1: createGifAnim(URLS.ultimate_combinado_1_1, false, 4),
      ULTIMATE_3_2: createGifAnim(URLS.ultimate_combinado_1_2, false, 4),
      ULTIMATE_3_3: createGifAnim(URLS.ultimate_combinado_1_3, false, 4),
      ULTIMATE_3_4: createGifAnim(URLS.ultimate_combinado_1_4, false, 4),
      ULTIMATE_3_5: createGifAnim(URLS.ultimate_combinado_1_5, false, 4),
      ULTIMATE_3_6: {
        ...createGifAnim(URLS.ultimate_combinado_1_6, false),
        createsBeam: "CHAVE_BEAM_001"
      },

      [PlayerState.STANDBY]: createGifAnim(URLS.parado, true),
      [PlayerState.TAG_IN]: createGifAnim(URLS.parado, true),
      [PlayerState.TAG_OUT]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_ENTRY]: createGifAnim(URLS.parado, false),
      [PlayerState.ASSIST_EXIT]: createGifAnim(URLS.parado, false),

      [PlayerState.TRANSFORM]: createGifAnim(URLS.transformacao_ssj_1_1, false),
      [PlayerState.VICTORY]: createGifAnim(URLS.parado, false),
    }
  },
  phasedMoves: {
    'STAND_LIGHT_1': {
        id: 'STAND_LIGHT_1',
        phases: [
            {
                animation: 'ATTACK_LIGHT_1',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 5,
                sfxName: 'attack_light',
                sfxFrame: 2,
                moveX: 0 // Spec: "apenas executa o ataque básico, sem movimento adicional"
            }
        ]
    },
    'STAND_LIGHT_2': {
        id: 'STAND_LIGHT_2',
        phases: [
            {
                animation: 'ATTACK_LIGHT_2',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 5,
                sfxName: 'attack_light',
                sfxFrame: 2,
                moveX: 3 // Spec: "leve movimento, semelhante ao do Stand Light 1"
            }
        ]
    },
    'STAND_LIGHT_3': {
        id: 'STAND_LIGHT_3',
        phases: [
            {
                animation: 'ATTACK_LIGHT_3',
                duration: 22,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 15,
                damage: 8,
                sfxName: 'attack',
                sfxFrame: 2,
                moveX: 8, // Spec: "leve aumento no deslocamento"
                launchOpponent: { x: 35, y: 0 } // Spec: "lança o oponente horizontalmente"
            }
        ]
    },
    'STAND_MEDIUM': {
        id: 'STAND_MEDIUM',
        phases: [
            {
                animation: 'STAND_MEDIUM_1',
                duration: 25,
                hitboxActive: true,
                hitboxStartFrame: 4,
                hitboxEndFrame: 18,
                damage: 12,
                sfxName: 'attack_medium',
                moveX: 10
            }
        ]
    },
    'STAND_MEDIUM_1': {
        id: 'STAND_MEDIUM_1',
        phases: [
            {
                animation: 'STAND_MEDIUM_1',
                duration: 25,
                hitboxActive: true,
                hitboxStartFrame: 4,
                hitboxEndFrame: 18,
                damage: 12,
                sfxName: 'attack_medium',
                moveX: 10
            }
        ]
    },
    'STAND_HEAVY': {
        id: 'STAND_HEAVY',
        phases: [
            { animation: 'STAND_HEAVY_1_1', duration: 15, moveX: 0, hitboxActive: false, damage: 0 }, 
            { animation: 'STAND_HEAVY_1_2', duration: 12, moveX: 12, hitboxActive: false, damage: 0 }, 
            { animation: 'STAND_HEAVY_1_3', duration: 25, hitboxActive: true, damage: 15, moveX: 10, launchOpponent: { x: 45, y: 0 }, shakeIntensity: 5, sfxName: 'attack_heavy' } 
        ]
    },
    'CROUCH_LIGHT': {
        id: 'CROUCH_LIGHT',
        phases: [
            {
                animation: 'ATTACK_CROUCH_LIGHT',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 5,
                sfxName: 'attack_light',
                moveX: 3
            }
        ]
    },
    'CROUCH_MEDIUM': {
        id: 'CROUCH_MEDIUM',
        phases: [
            {
                animation: 'ATTACK_CROUCH_MEDIUM',
                duration: 25,
                hitboxActive: true,
                hitboxStartFrame: 4,
                hitboxEndFrame: 18,
                damage: 10,
                sfxName: 'attack_medium',
                moveX: 6
            }
        ]
    },
    'CROUCH_HEAVY': {
        id: 'CROUCH_HEAVY',
        phases: [
            {
                animation: 'ATTACK_CROUCH_HEAVY',
                duration: 30,
                hitboxActive: true,
                hitboxStartFrame: 6,
                hitboxEndFrame: 22,
                damage: 15,
                sfxName: 'attack_heavy',
                moveX: 12,
                launchOpponent: { x: 5, y: -25 },
                shakeIntensity: 4
            }
        ]
    },
    'AIR_LIGHT': {
        id: 'AIR_LIGHT',
        phases: [
            {
                animation: 'AIR_LIGHT',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 5,
                sfxName: 'attack_light',
                suspendOpponent: true, // Spec: "oponente atingido fica suspenso no ar por pouco tempo"
                moveY: -2
            }
        ]
    },
    'AIR_LIGHT_UP': {
        id: 'AIR_LIGHT_UP',
        phases: [
            {
                animation: 'AIR_LIGHT_UP',
                duration: 18,
                hitboxActive: true,
                hitboxStartFrame: 2,
                hitboxEndFrame: 12,
                damage: 5,
                sfxName: 'attack_light',
                launchOpponent: { x: 5, y: -20 },
                moveY: -15
            }
        ]
    },
    'AIR_MEDIUM': {
        id: 'AIR_MEDIUM',
        phases: [
            {
                animation: 'AIR_MEDIUM',
                duration: 25,
                hitboxActive: true,
                hitboxStartFrame: 4,
                hitboxEndFrame: 18,
                damage: 10,
                sfxName: 'attack_medium',
                launchOpponent: { x: 15, y: 35 }, // Spec: "lança o oponente em trajetória diagonal para baixo"
                moveX: 5
            }
        ]
    },
    'AIR_MEDIUM_FORWARD': {
        id: 'AIR_MEDIUM_FORWARD',
        phases: [
            {
                animation: 'AIR_MEDIUM_FORWARD',
                duration: 25,
                hitboxActive: true,
                damage: 10,
                sfxName: 'attack_medium',
                suspendOpponent: true // Spec: "oponente atingido fica suspenso por um curto período"
            }
        ]
    },
    'AIR_HEAVY': {
        id: 'AIR_HEAVY',
        phases: [
            {
                animation: 'AIR_HEAVY',
                duration: 30,
                hitboxActive: true,
                hitboxStartFrame: 6,
                hitboxEndFrame: 22,
                damage: 15,
                sfxName: 'attack_heavy',
                launchOpponent: { x: 20, y: 45 }, // Spec: "lança o oponente em trajetória diagonal para baixo"
                shakeIntensity: 5
            }
        ]
    },
    'AIR_HEAVY_UP': {
        id: 'AIR_HEAVY_UP',
        phases: [
            {
                animation: 'AIR_HEAVY_UP',
                duration: 30,
                hitboxActive: true,
                hitboxStartFrame: 6,
                hitboxEndFrame: 22,
                damage: 15,
                sfxName: 'attack_heavy',
                launchOpponent: { x: 5, y: -35 },
                moveY: -10
            }
        ]
    },
    'CROUCH_BACK_MEDIUM': {
        id: 'CROUCH_BACK_MEDIUM',
        phases: [
            { animation: 'CROUCH_BACK_MEDIUM_1_1', duration: 10, hitboxActive: false, damage: 0 },
            { animation: 'CROUCH_BACK_MEDIUM_1_2', duration: 10, moveX: 15, hitboxActive: false, damage: 0 },
            { animation: 'CROUCH_BACK_MEDIUM_1_3', duration: 20, hitboxActive: true, hitboxStartFrame: 2, hitboxEndFrame: 12, damage: 12, sfxName: 'attack', moveX: 10 },
            { animation: 'CROUCH_BACK_MEDIUM_1_4', duration: 15, hitboxActive: true, damage: 15, launchOpponent: { x: 25, y: -25 } },
            { animation: 'CROUCH_BACK_MEDIUM_1_5', duration: 10, hitboxActive: false, damage: 0 }
        ]
    },
    'CROUCH_BACK_HEAVY': {
        id: 'CROUCH_BACK_HEAVY',
        phases: [
            { animation: 'CROUCH_BACK_HEAVY_1_1', duration: 15, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_BACK_HEAVY_1_2', duration: 15, moveX: 12, hitboxActive: false, damage: 0 }, 
            { animation: 'CROUCH_BACK_HEAVY_1_3', duration: 15, snapOpponent: true, hitboxActive: true, damage: 5 }, 
            { animation: 'CROUCH_BACK_HEAVY_1_4', duration: 30, snapOpponent: true, hitboxActive: true, damage: 10, shakeIntensity: 3 }, 
            { animation: 'CROUCH_BACK_HEAVY_1_5', duration: 25, hitboxActive: true, damage: 15, launchOpponent: { x: 60, y: 0 }, shakeIntensity: 6, sfxName: 'attack_heavy' } 
        ]
    },
    'KI_BLAST': {
        id: 'KI_BLAST',
        phases: [
            { animation: 'KI_BLAST_1', duration: 10 },
            { animation: 'KI_BLAST_2', duration: 15, hitboxActive: true, damage: 5, projectile: 'KI_BLAST' },
            { animation: 'KI_BLAST_3', duration: 10 },
            { animation: 'KI_BLAST_4', duration: 10 }
        ]
    },
    'KI_BLAST_AR': {
        id: 'KI_BLAST_AR',
        phases: [
            { animation: 'KI_BLAST_AR_1', duration: 10 },
            { animation: 'KI_BLAST_AR_2', duration: 15, hitboxActive: true, damage: 5, projectile: 'KI_BLAST' },
            { animation: 'KI_BLAST_AR_3', duration: 10 },
            { animation: 'KI_BLAST_AR_4', duration: 10 }
        ]
    },
    'SPECIAL_1': {
        id: 'SPECIAL_1',
        phases: [
            { animation: 'Especial_1_1', duration: 15 },
            { animation: 'Especial_1_2', duration: 100, createsBeam: "CHAVE_BEAM_002", damage: 45, shakeIntensity: 5 }
        ]
    },
    'SPECIAL_2': {
        id: 'SPECIAL_2',
        phases: [
            { animation: 'Especial_2_1', duration: 12 },
            { animation: 'Especial_2_2', duration: 12, moveX: 20 },
            { animation: 'Especial_2_3', duration: 25, hitboxActive: true, damage: 25, launchOpponent: { x: 15, y: -10 } },
            { animation: 'Especial_2_4', duration: 15 }
        ]
    },
    'SPECIAL_3': {
        id: 'SPECIAL_3',
        phases: [
            { animation: 'Especial_3_1', duration: 15 },
            { animation: 'Especial_3_2', duration: 30, hitboxActive: true, damage: 30, launchOpponent: { x: 0, y: -30 } },
            { animation: 'Especial_3_3', duration: 20 }
        ]
    },
    'SPECIAL_4': {
        id: 'SPECIAL_4',
        phases: [
            { animation: 'Especial_4_1', duration: 12 },
            { animation: 'Especial_4_2', duration: 15, moveX: 30, hitboxActive: true, damage: 15 },
            { animation: 'Especial_4_3', duration: 15, moveX: 30, hitboxActive: true, damage: 15 },
            { animation: 'Especial_4_4', duration: 20, hitboxActive: true, damage: 20, launchOpponent: { x: 40, y: -5 } }
        ]
    },
    'ULTIMATE_1': {
        id: 'ULTIMATE_1',
        phases: [
            { animation: 'ULTIMATE_1_1', duration: 40 },
            { animation: 'ULTIMATE_1_2', duration: 35 },
            { animation: 'ULTIMATE_1_3', duration: 30 },
            { animation: 'ULTIMATE_1_4', duration: 80, damage: 150, createsBeam: "CHAVE_BEAM_001", shakeIntensity: 10 },
            { animation: 'ULTIMATE_1_5', duration: 25 },
            { animation: 'ULTIMATE_1_6', duration: 40 },
            { animation: 'ULTIMATE_1_7', duration: 30 }
        ]
    },
    'ULTIMATE_2': {
        id: 'ULTIMATE_2',
        phases: [
            { animation: 'ULTIMATE_2_1', duration: 30 },
            { animation: 'ULTIMATE_2_2', duration: 60, damage: 120, shakeIntensity: 8 },
            { animation: 'ULTIMATE_2_3', duration: 30 },
            { animation: 'ULTIMATE_2_4', duration: 50 },
            { animation: 'ULTIMATE_2_5', duration: 30 }
        ]
    },
    'ULTIMATE_3': {
        id: 'ULTIMATE_3',
        phases: [
            { animation: 'ULTIMATE_3_1', duration: 20 },
            { animation: 'ULTIMATE_3_2', duration: 20 },
            { animation: 'ULTIMATE_3_3', duration: 20 },
            { animation: 'ULTIMATE_3_4', duration: 20 },
            { animation: 'ULTIMATE_3_5', duration: 20 },
            { animation: 'ULTIMATE_3_6', duration: 100, damage: 200, createsBeam: "CHAVE_BEAM_001", shakeIntensity: 15 }
        ]
    },
    'INTRO': {
        id: 'INTRO',
        phases: [
            { animation: 'INTRO_1', duration: 15 },
            { animation: 'INTRO_2', duration: 15 },
            { animation: 'INTRO_3', duration: 15 },
            { animation: 'INTRO_4', duration: 15 },
            { animation: 'INTRO_5', duration: 15 },
            { animation: 'INTRO_6', duration: 15 },
            { animation: 'INTRO_7', duration: 15 },
            { animation: 'INTRO_8', duration: 15 },
            { animation: 'INTRO_9', duration: 15 },
            { animation: 'INTRO_10', duration: 15 },
            { animation: 'INTRO_11', duration: 15 },
            { animation: 'INTRO_12', duration: 30 }
        ]
    },
    'DRAGON_RUSH': {
        id: 'DRAGON_RUSH',
        phases: [
            { animation: 'dragon_rush_1', duration: 15, homing: true, sfxName: 'dash' },
            { animation: 'dragon_rush_2', duration: 35, snapOpponent: true, damage: 10, sfxName: 'attack_medium' },
            { animation: 'dragon_rush_3', duration: 30, hitboxActive: true, damage: 15, launchOpponent: { x: 20, y: -10 }, shakeIntensity: 4, sfxName: 'attack_heavy' }
        ]
    }
  }
};
