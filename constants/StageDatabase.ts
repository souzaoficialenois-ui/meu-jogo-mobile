import { StageData } from '../types';

export const STAGE_DB: StageData[] = [
  {
    id: 'TORNEIO_DO_PODER',
    name: 'Torneio do Poder',
    desc: 'Lute pela sobrevivência do seu universo!',
    color: 'from-purple-900 to-indigo-900',
    img: '/Assets/cenarios/torneiopoder/prewiew.png',
    scale: 1.0,
    yOffset: 0,
    xOffset: 0,
    worldWidth: 2600,
    groundY: 150,
    limitLeft: 125,
    limitRight: 2475,
    physLimitLeft: -225,
    physLimitRight: 2825,
    isLocked: true,
    groundDestroyedConfigKey: 'VFX_CHAO_DESTRUIDO_TORNEIO',
    groundDestroyedConfig: {
      imageUrl: '/Assets/efeitos/chao/destruido/1.gif',
      frameWidth: 100,
      frameHeight: 100,
      frames: 1,
      speed: 5,
      scale: 1,
      loop: true,
      isGif: true,
      offsetX: 0,
      offsetY: 0
    },
    layers: [
      {
        img: '/Assets/cenarios/torneiopoder/1.png',
        parallaxFactorX: 0.9,
        parallaxFactorY: 0.1,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/torneiopoder/2.png',
        parallaxFactorX: 0.6,
        parallaxFactorY: 0.05,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/torneiopoder/3.png',
        parallaxFactorX: 0.3,
        parallaxFactorY: 0.0,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/torneiopoder/4.png',
        parallaxFactorX: 0.0,
        parallaxFactorY: 0.0,
        scale: 2.5,
        yOffset: -425
      }
    ]
  },
  {
    id: 'KAME_HOUSE',
    name: 'Kame House',
    desc: 'O lar lendário do Mestre Kame.',
    color: 'from-blue-400 to-cyan-400',
    img: '/Assets/cenarios/casamestrekame/prewiew.png',
    scale: 1.0,
    yOffset: 0,
    xOffset: 0,
    worldWidth: 2600,
    groundY: 125,
    cameraOffsetY: -10,
    limitLeft: 125,
    limitRight: 2475,
    physLimitLeft: -225,
    physLimitRight: 2825,
    groundDestroyedConfigKey: 'VFX_CHAO_DESTRUIDO_KAME',
    groundDestroyedConfig: {
      imageUrl: '/Assets/efeitos/chao/destruido/1.gif',
      frameWidth: 100,
      frameHeight: 100,
      frames: 1,
      speed: 5,
      scale: 1,
      loop: true,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 0,
      effectSaturate: 1,
      effectBrightness: 1.3,
      effectContrast: 1.55
    },
    layers: [
      {
        img: '/Assets/cenarios/casamestrekame/1.png',
        parallaxFactorX: 0.9,
        parallaxFactorY: 0.1,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/casamestrekame/2.png',
        parallaxFactorX: 0.6,
        parallaxFactorY: 0.05,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/casamestrekame/3.png',
        parallaxFactorX: 0.3,
        parallaxFactorY: 0.0,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/casamestrekame/5.png',
        parallaxFactorX: 0.0,
        parallaxFactorY: 0.0,
        scale: 2.5,
        yOffset: -425
      }
    ]
  },
  {
    id: 'INSIDE_BUU',
    name: 'Inside Buu',
    desc: 'O interior esquisito do Majin Buu.',
    color: 'from-pink-900 to-red-900',
    img: '/Assets/cenarios/insidebuu/prewiew.png',
    scale: 1.0,
    yOffset: 0,
    xOffset: 0,
    worldWidth: 2600,
    groundY: 150,
    limitLeft: 125,
    limitRight: 2475,
    physLimitLeft: -225,
    physLimitRight: 2825,
    isLocked: true,
    groundDestroyedConfigKey: 'VFX_CHAO_DESTRUIDO_BUU',
    groundDestroyedConfig: {
      imageUrl: '/Assets/efeitos/chao/destruido/1.gif',
      frameWidth: 100,
      frameHeight: 100,
      frames: 1,
      speed: 5,
      scale: 1,
      loop: true,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 298,
      effectSaturate: 1.9,
      effectBrightness: 0.9,
      effectContrast: 1.45
    },
    layers: [
      {
        img: '/Assets/cenarios/insidebuu/1.png',
        parallaxFactorX: 0.9,
        parallaxFactorY: 0.1,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/insidebuu/2.png',
        parallaxFactorX: 0.6,
        parallaxFactorY: 0.05,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/insidebuu/3.png',
        parallaxFactorX: 0.3,
        parallaxFactorY: 0.0,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/insidebuu/4.png',
        parallaxFactorX: 0.0,
        parallaxFactorY: 0.0,
        scale: 2.5,
        yOffset: -425
      }
    ]
  },
  {
    id: 'DESERTO',
    name: 'Deserto',
    desc: 'Um deserto árido perfeito para lutas.',
    color: 'from-yellow-700 to-orange-800',
    img: '/Assets/cenarios/deserto/prewiew.png',
    scale: 1.0,
    yOffset: 0,
    xOffset: 0,
    worldWidth: 2600,
    groundY: 150,
    limitLeft: 125,
    limitRight: 2475,
    physLimitLeft: -225,
    physLimitRight: 2825,
    groundDestroyedConfigKey: 'VFX_CHAO_DESTRUIDO_DESERTO',
    groundDestroyedConfig: {
      imageUrl: '/Assets/efeitos/chao/destruido/1.gif',
      frameWidth: 100,
      frameHeight: 100,
      frames: 1,
      speed: 5,
      scale: 1,
      loop: true,
      isGif: true,
      offsetX: 0,
      offsetY: 0
    },
    layers: [
      {
        img: '/Assets/cenarios/deserto/1.png',
        parallaxFactorX: 0.9,
        parallaxFactorY: 0.1,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/deserto/2.png',
        parallaxFactorX: 0.6,
        parallaxFactorY: 0.05,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/deserto/3.png',
        parallaxFactorX: 0.3,
        parallaxFactorY: 0.0,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/deserto/4.png',
        parallaxFactorX: 0.0,
        parallaxFactorY: 0.0,
        scale: 2.5,
        yOffset: -425
      }
    ]
  },
  {
    id: 'ESPACO',
    name: 'Espaço',
    desc: 'O vasto infinito do espaço sideral.',
    color: 'from-blue-900 to-indigo-900',
    img: '/Assets/cenarios/espaco/prewiew.png',
    scale: 1.0,
    yOffset: 0,
    xOffset: 0,
    worldWidth: 2600,
    groundY: 150,
    limitLeft: 125,
    limitRight: 2475,
    physLimitLeft: -225,
    physLimitRight: 2825,
    isLocked: true,
    groundDestroyedConfigKey: 'VFX_CHAO_DESTRUIDO_ESPACO',
    groundDestroyedConfig: {
      imageUrl: '/Assets/efeitos/chao/destruido/1.gif',
      frameWidth: 100,
      frameHeight: 100,
      frames: 1,
      speed: 5,
      scale: 1,
      loop: true,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 186,
      effectSaturate: 1.8,
      effectBrightness: 0.9,
      effectContrast: 1.6
    },
    layers: [
      {
        img: '/Assets/cenarios/espaco/1.png',
        parallaxFactorX: 0.9,
        parallaxFactorY: 0.1,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/espaco/2.png',
        parallaxFactorX: 0.6,
        parallaxFactorY: 0.05,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/espaco/3.png',
        parallaxFactorX: 0.3,
        parallaxFactorY: 0.0,
        scale: 2.2,
        yOffset: -350
      },
      {
        img: '/Assets/cenarios/espaco/4.png',
        parallaxFactorX: 0.0,
        parallaxFactorY: 0.0,
        scale: 2.5,
        yOffset: -425
      }
    ]
  }
];
