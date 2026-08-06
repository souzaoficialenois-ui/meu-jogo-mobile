
export const DEFAULT_EFFECTS = {
  EFFECT_CHAO_DESTRUIDO_01: "/Assets/efeitos/chao/destruido/1.gif",
  EFFECT_POEIRA_01: "/Assets/efeitos/poeira/1.gif",
  EFFECT_POEIRA_02: "/Assets/efeitos/poeira/2.gif",
  EFFECT_POEIRA_03: "/Assets/efeitos/poeira/3.gif",
  EFFECT_POEIRA_04: "/Assets/efeitos/poeira/4.gif",
  EFFECT_POEIRA_05: "/Assets/efeitos/poeira/5.gif",
  EFFECT_TELACHEIA_01: "/Assets/efeitos/telacheia/1.gif",
  EFFECT_TELACHEIA_02: "/Assets/efeitos/telacheia/2.gif",
  EFFECT_TELACHEIA_03: "/Assets/efeitos/telacheia/3.gif",
  EFFECT_TELACHEIA_04: "/Assets/efeitos/telacheia/4.gif",
  EFFECT_TELACHEIA_05: "/Assets/efeitos/telacheia/5.gif",
  EFFECT_TELACHEIA_06: "/Assets/efeitos/telacheia/6.gif",
  EFFECT_IMPACTO_01: "/Assets/efeitos/impacto/1.gif",
  EFFECT_IMPACTO_02: "/Assets/efeitos/impacto/2.gif",
  VFX_CHAO_DESTRUIDO_BUU: "/Assets/efeitos/chao/destruido/1.gif",
  VFX_CHAO_DESTRUIDO_KAME: "/Assets/efeitos/chao/destruido/1.gif",
  VFX_CHAO_DESTRUIDO_TORNEIO: "/Assets/efeitos/chao/destruido/1.gif",
  VFX_CHAO_DESTRUIDO_ESPACO: "/Assets/efeitos/chao/destruido/1.gif",
  VFX_CHAO_DESTRUIDO_DESERTO: "/Assets/efeitos/chao/destruido/1.gif",
};

export interface EffectFamily {
    id: string;
    name: string;
    imageUrl: string;
    color?: string;
    glowColor?: string;
    glowBlur?: number;
    glowRadius?: number;
    glowIntensity?: number;
    frames?: number;
    frameWidth?: number;
    frameHeight?: number;
    loop?: boolean;
    speed?: number;
}
