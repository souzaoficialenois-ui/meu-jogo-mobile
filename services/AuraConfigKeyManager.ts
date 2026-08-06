import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";

export const DEFAULT_AURAS = {
  AURA_001: "/Assets/aura/1.gif",
  AURA_002: "/Assets/aura/2.gif",
  AURA_003: "/Assets/aura/3.gif",
  AURA_004: "/Assets/aura/4.gif",
  AURA_005: "/Assets/aura/5.gif",
  AURA_006: "/Assets/aura/6.gif",
  AURA_007: "/Assets/aura/7.gif",
  AURA_008: "/Assets/aura/8.gif",
  AURA_009: "/Assets/aura/9.gif",
  AURA_010: "/Assets/aura/10.gif",
  AURA_011: "/Assets/aura/11.gif",
  AURA_012: "/Assets/aura/12.gif",
  AURA_013: "/Assets/aura/13.gif",
  AURA_014: "/Assets/aura/14.gif",
  AURA_015: "/Assets/aura/15.gif",
};

export interface ConfiguredAura {
  id: string; // unique key, e.g., CHAVE_AURA_001
  name: string;
  auraSprite: keyof typeof DEFAULT_AURAS | string; // key of default list, or custom URL
  auraAnimation?: string;
  auraUrl?: string;
  baseAuraId: keyof typeof DEFAULT_AURAS | string; // legacy fallback
  color: string; // tint color, e.g., "#ffffff"
  glowColor?: string; // custom glow / outline shadow color
  glowBlur?: number; // custom glow blur radius in px (0-60)
  glowRadius?: number; // custom glow radius in px
  glowIntensity?: number; // glow intensity multiplier (0.0 - 3.0)
  auraHueRotate?: number;
  auraSaturate?: number;
  auraBrightness?: number;
  auraContrast?: number;
  auraOpacity?: number;
  ownerCharacterId?: string;
  ownerAnimationKey?: string; // specific animation this aura should display on (e.g. "carregando_ki_loop", etc)
  ownerCharacterName?: string;
  isDefaultCharging?: boolean; // is this the default charging aura for this character?
  isDefaultSparking?: boolean; // is this the default sparking mode aura for this character?
  auraOffsetX?: number;
  auraOffsetY?: number;
  auraScaleX?: number;
  auraScaleY?: number;
}

export class AuraConfigKeyManager {
  private static instance: AuraConfigKeyManager;
  private registry: Map<string, ConfiguredAura> = new Map();
  private counters: Map<string, number> = new Map();

  public static stdDefaults: Record<string, Partial<ConfiguredAura>> = {
    AURA_001: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 1.05,
      auraContrast: 1.1,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 1,
      auraScaleX: 1.9,
      auraScaleY: 1.15
    },
    AURA_001_GOKU_MUI: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 1.05,
      auraContrast: 1.1,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 1,
      auraScaleX: 1.9,
      auraScaleY: 1.15
    },
    AURA_002: {
      color: "#ffffff",
      auraHueRotate: 313,
      auraSaturate: 4,
      auraBrightness: 0.85,
      auraContrast: 1.4,
      auraOpacity: 1,
      auraOffsetX: -6,
      auraOffsetY: 0,
      auraScaleX: 1.55,
      auraScaleY: 1.2
    },
    AURA_003: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 2.2,
      auraBrightness: 1.1,
      auraContrast: 2.5,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 12,
      auraScaleX: 1.85,
      auraScaleY: 1.05
    },
    AURA_002_TEEN_GOHAN_SSJ2: {
      color: "#ffffff",
      auraHueRotate: 313,
      auraSaturate: 4,
      auraBrightness: 0.85,
      auraContrast: 1.4,
      auraOpacity: 1,
      auraOffsetX: -6,
      auraOffsetY: 0,
      auraScaleX: 1.55,
      auraScaleY: 1.2
    },
    AURA_004: {
      color: "#ffffff",
      auraHueRotate: 359,
      auraSaturate: 1.95,
      auraBrightness: 1.3,
      auraContrast: 2.35,
      auraOpacity: 0.85,
      auraOffsetX: -7,
      auraOffsetY: 12,
      auraScaleX: 1.9,
      auraScaleY: 1
    },
    AURA_004_GOKU_SSJ: {
      color: "#ffffff",
      auraHueRotate: 359,
      auraSaturate: 1.95,
      auraBrightness: 1.3,
      auraContrast: 2.35,
      auraOpacity: 0.85,
      auraOffsetX: -7,
      auraOffsetY: 12,
      auraScaleX: 1.9,
      auraScaleY: 1
    },
    AURA_004_NAPPA: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 1.3,
      auraContrast: 0.9,
      auraOpacity: 0.75,
      auraOffsetX: 3,
      auraOffsetY: 17,
      auraScaleX: 2.15,
      auraScaleY: 1.15
    },
    AURA_004_GOGETA_SSJ4: {
      color: "#ffffff",
      auraHueRotate: 319,
      auraSaturate: 4,
      auraBrightness: 0.95,
      auraContrast: 3,
      auraOpacity: 0.75,
      auraOffsetX: 4,
      auraOffsetY: 17,
      auraScaleX: 2.35,
      auraScaleY: 1.15
    },
    AURA_005: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 0.85,
      auraOffsetX: -11,
      auraOffsetY: 46,
      auraScaleX: 1.5,
      auraScaleY: 1.25
    },
    AURA_006: {
      color: "#ffffff",
      auraHueRotate: 260,
      auraSaturate: 3,
      auraBrightness: 1.2,
      auraContrast: 1.8,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 10,
      auraScaleX: 1.9,
      auraScaleY: 1.1
    },
    AURA_007: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 4,
      auraBrightness: 1.5,
      auraContrast: 3,
      auraOpacity: 1,
      auraOffsetX: 2,
      auraOffsetY: 0,
      auraScaleX: 1.45,
      auraScaleY: 0.8
    },
    AURA_005_GOKU_BLACK_ROSE: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 0.85,
      auraOffsetX: -11,
      auraOffsetY: 46,
      auraScaleX: 1.5,
      auraScaleY: 1.25
    },
    AURA_008: {
      color: "#ffffff",
      auraHueRotate: 19,
      auraSaturate: 3.2,
      auraBrightness: 1.45,
      auraContrast: 1.95,
      auraOpacity: 1,
      auraOffsetX: -1,
      auraOffsetY: 33,
      auraScaleX: 1.6,
      auraScaleY: 1
    },
    CHAVE_AURA_001: {
      name: "CHAVE_AURA_001",
      baseAuraId: "AURA_008",
      auraSprite: "/Assets/aura/8.gif",
      auraAnimation: "/Assets/aura/8.gif",
      auraUrl: "/Assets/aura/8.gif",
      color: "#ffffff",
      glowColor: "#d7d0d0",
      glowBlur: 53,
      glowRadius: 53,
      glowIntensity: 1,
      auraHueRotate: 0,
      auraSaturate: 0.05000000000000002,
      auraBrightness: 0.6000000000000001,
      auraContrast: 3,
      auraOpacity: 1,
      ownerCharacterId: "goku_base",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "GOKU BASE",
      isDefaultCharging: true,
      auraOffsetX: -1,
      auraOffsetY: 33,
      auraScaleX: 1.6,
      auraScaleY: 1
    },
    CHAVE_AURA_002: {
      name: "CHAVE_AURA_002",
      baseAuraId: "AURA_001",
      auraSprite: "/Assets/aura/1.gif",
      auraAnimation: "/Assets/aura/1.gif",
      auraUrl: "/Assets/aura/1.gif",
      color: "#ffffff",
      glowColor: "#e9e7e7",
      glowBlur: 31,
      glowRadius: 31,
      glowIntensity: 2.15,
      auraHueRotate: 51,
      auraSaturate: 0.15,
      auraBrightness: 0.8,
      auraContrast: 0.6,
      auraOpacity: 1,
      ownerCharacterId: "goku_mui",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "GOKU (MUI)",
      isDefaultCharging: true,
      auraOffsetX: 4,
      auraOffsetY: 1,
      auraScaleX: 1.4,
      auraScaleY: 1.1
    },
    CHAVE_AURA_003: {
      name: "CHAVE_AURA_003",
      baseAuraId: "AURA_002",
      auraSprite: "/Assets/aura/2.gif",
      auraAnimation: "/Assets/aura/2.gif",
      auraUrl: "/Assets/aura/2.gif",
      color: "#ffffff",
      glowColor: "#ffd700",
      glowBlur: 35,
      glowRadius: 35,
      glowIntensity: 1.8,
      auraHueRotate: 0,
      auraSaturate: 1.2,
      auraBrightness: 1.1,
      auraContrast: 1.2,
      auraOpacity: 1,
      ownerCharacterId: "goku_ssj",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "GOKU (SSJ)",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 10,
      auraScaleX: 1.6,
      auraScaleY: 1.1
    },
    CHAVE_AURA_004: {
      name: "CHAVE_AURA_004",
      baseAuraId: "AURA_010",
      auraSprite: "/Assets/aura/10.gif",
      auraAnimation: "/Assets/aura/10.gif",
      auraUrl: "/Assets/aura/10.gif",
      color: "#ffffff",
      glowColor: "#dad8d8",
      glowBlur: 43,
      glowRadius: 43,
      glowIntensity: 1.4,
      auraHueRotate: 186,
      auraSaturate: 0,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 0.85,
      ownerCharacterId: "kuririn",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "KURIRIN",
      isDefaultCharging: true,
      auraOffsetX: 1,
      auraOffsetY: 21,
      auraScaleX: 1.5,
      auraScaleY: 0.7999999999999996
    },
    CHAVE_AURA_005: {
      name: "CHAVE_AURA_005",
      baseAuraId: "AURA_008",
      auraSprite: "/Assets/aura/8.gif",
      auraAnimation: "/Assets/aura/8.gif",
      auraUrl: "/Assets/aura/8.gif",
      color: "#a855f7",
      glowColor: "#9333ea",
      glowBlur: 45,
      glowRadius: 45,
      glowIntensity: 2.0,
      auraHueRotate: 280,
      auraSaturate: 1.8,
      auraBrightness: 1.1,
      auraContrast: 1.5,
      auraOpacity: 0.95,
      ownerCharacterId: "frieza_final",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "FRIEZA FINAL",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 15,
      auraScaleX: 1.6,
      auraScaleY: 1.05
    },
    CHAVE_AURA_007: {
      name: "CHAVE_AURA_007",
      baseAuraId: "AURA_002",
      auraSprite: "/Assets/aura/2.gif",
      auraAnimation: "/Assets/aura/2.gif",
      auraUrl: "/Assets/aura/2.gif",
      color: "#ffffff",
      glowColor: "#fbbf24",
      glowBlur: 40,
      glowRadius: 40,
      glowIntensity: 2.0,
      auraHueRotate: 0,
      auraSaturate: 1.3,
      auraBrightness: 1.2,
      auraContrast: 1.4,
      auraOpacity: 1,
      ownerCharacterId: "teen_gohan_ssj2",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "TEEN GOHAN (SSJ2)",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 10,
      auraScaleX: 1.6,
      auraScaleY: 1.1
    },
    CHAVE_AURA_011: {
      name: "CHAVE_AURA_011",
      baseAuraId: "AURA_013",
      auraSprite: "/Assets/aura/13.gif",
      auraAnimation: "/Assets/aura/13.gif",
      auraUrl: "/Assets/aura/13.gif",
      color: "#ffffff",
      glowColor: "#00aa00",
      glowBlur: 37,
      glowRadius: 37,
      glowIntensity: 2.1,
      auraHueRotate: 182,
      auraSaturate: 1.35,
      auraBrightness: 1.15,
      auraContrast: 1.3,
      auraOpacity: 0.95,
      ownerCharacterId: "broly_ikari",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "BROLY IKARI",
      isDefaultCharging: true,
      auraOffsetX: 14,
      auraOffsetY: 0,
      auraScaleX: 1.7000000000000002,
      auraScaleY: 1.25
    },
    CHAVE_AURA_006: {
      baseAuraId: "AURA_003",
      auraSprite: "/Assets/aura/3.gif",
      auraAnimation: "/Assets/aura/3.gif",
      auraUrl: "/Assets/aura/3.gif",
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1.65,
      auraBrightness: 0.95,
      auraContrast: 1.95,
      auraOpacity: 0.85,
      ownerCharacterId: "gogeta_ssj4",
      ownerAnimationKey: "CHARGING",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 11,
      auraScaleX: 2,
      auraScaleY: 1.05
    },
    CHAVE_AURA_008: {
      baseAuraId: "AURA_007",
      auraSprite: "/Assets/aura/7.gif",
      auraAnimation: "/Assets/aura/7.gif",
      auraUrl: "/Assets/aura/7.gif",
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1.95,
      auraBrightness: 1.3,
      auraContrast: 2.85,
      auraOpacity: 1,
      ownerCharacterId: "goku_blue",
      ownerAnimationKey: "CHARGING",
      isDefaultCharging: true,
      auraOffsetX: 2,
      auraOffsetY: 0,
      auraScaleX: 1.45,
      auraScaleY: 0.8
    },
    CHAVE_AURA_010: {
      baseAuraId: "AURA_003",
      auraSprite: "/Assets/aura/3.gif",
      auraAnimation: "/Assets/aura/3.gif",
      auraUrl: "/Assets/aura/3.gif",
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0.9,
      auraBrightness: 1.25,
      auraContrast: 3,
      auraOpacity: 0.85,
      ownerCharacterId: "trunks_ssj2",
      ownerAnimationKey: "CHARGING",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 12,
      auraScaleX: 1.9999999999999998,
      auraScaleY: 1.05
    },
    CHAVE_AURA_014: {
      id: "CHAVE_AURA_014",
      name: "CHAVE_AURA_014",
      baseAuraId: "/Assets/aura/3.gif",
      auraSprite: "/Assets/aura/3.gif",
      auraAnimation: "/Assets/aura/3.gif",
      auraUrl: "/Assets/aura/3.gif",
      color: "#ffffff",
      glowColor: "#fafe21",
      glowBlur: 40,
      glowRadius: 40,
      glowIntensity: 2.35,
      auraHueRotate: 19,
      auraSaturate: 2.1,
      auraBrightness: 1.25,
      auraContrast: 1.55,
      auraOpacity: 0.85,
      ownerCharacterId: "vegeta_ssj_majin",
      ownerAnimationKey: "CHARGING",
      ownerCharacterName: "VEGETA (MAJIN)",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 11,
      auraScaleX: 1.8500000000000003,
      auraScaleY: 0.95
    },
    AURA_008_GOKU_BLUE_GIF: {
      color: "#ffffff",
      auraHueRotate: 19,
      auraSaturate: 3.2,
      auraBrightness: 1.45,
      auraContrast: 1.95,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 0,
      auraScaleX: 1.6,
      auraScaleY: 1
    },
    AURA_009: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 49,
      auraScaleX: 1.85,
      auraScaleY: 1
    },
    AURA_009_GOKU_BASE: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 49,
      auraScaleX: 1.85,
      auraScaleY: 1
    },
    AURA_010: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0.9,
      auraBrightness: 1.25,
      auraContrast: 3,
      auraOpacity: 0.85,
      auraOffsetX: 0,
      auraOffsetY: 12,
      auraScaleX: 2.0,
      auraScaleY: 1.05
    },
    AURA_011: {
      color: "#ffffff",
      auraHueRotate: 30,
      auraSaturate: 2.5,
      auraBrightness: 1.3,
      auraContrast: 2.0,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 5,
      auraScaleX: 1.7,
      auraScaleY: 1.15
    },
    AURA_012: {
      color: "#ffffff",
      auraHueRotate: 200,
      auraSaturate: 1.5,
      auraBrightness: 1.1,
      auraContrast: 1.5,
      auraOpacity: 0.9,
      auraOffsetX: -5,
      auraOffsetY: 15,
      auraScaleX: 1.8,
      auraScaleY: 1.1
    },
    AURA_013: {
      color: "#ffffff",
      auraHueRotate: 120,
      auraSaturate: 3.5,
      auraBrightness: 1.4,
      auraContrast: 2.2,
      auraOpacity: 1,
      auraOffsetX: 0,
      auraOffsetY: 20,
      auraScaleX: 1.65,
      auraScaleY: 1.0
    },
    AURA_014: {
      color: "#ffffff",
      auraHueRotate: 180,
      auraSaturate: 3,
      auraBrightness: 2.05,
      auraContrast: 2.25,
      auraOpacity: 1,
      auraOffsetX: 8,
      auraOffsetY: 0,
      auraScaleX: 1.55,
      auraScaleY: 1.25
    },
    AURA_014_BROLY_IKARI: {
      color: "#ffffff",
      auraHueRotate: 180,
      auraSaturate: 3,
      auraBrightness: 2.05,
      auraContrast: 2.25,
      auraOpacity: 1,
      auraOffsetX: 8,
      auraOffsetY: 0,
      auraScaleX: 1.55,
      auraScaleY: 1.25
    },
    AURA_015: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 1,
      auraContrast: 1.25,
      auraOpacity: 1,
      auraOffsetX: 1,
      auraOffsetY: 26,
      auraScaleX: 1.75,
      auraScaleY: 1.2
    },
    AURA_015_KURIRIN: {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 1,
      auraContrast: 1.25,
      auraOpacity: 1,
      auraOffsetX: 1,
      auraOffsetY: 26,
      auraScaleX: 1.75,
      auraScaleY: 1.2
    }
  };

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): AuraConfigKeyManager {
    if (!AuraConfigKeyManager.instance) {
      AuraConfigKeyManager.instance = new AuraConfigKeyManager();
    }
    return AuraConfigKeyManager.instance;
  }

  /**
   * Generates a new unique configuration key for an aura
   * Format: CHAVE_AURA_001, CHAVE_AURA_002, etc.
   */
  public generateKey(): string {
    let count = (this.counters.get("CHAVE_AURA") || 0) + 1;
    this.counters.set("CHAVE_AURA", count);
    
    let paddedCount = String(count).padStart(3, '0');
    let key = `CHAVE_AURA_${paddedCount}`;
    while (this.registry.has(key)) {
      count++;
      this.counters.set("CHAVE_AURA", count);
      key = `CHAVE_AURA_${String(count).padStart(3, '0')}`;
    }
    return key;
  }

  /**
   * Locates the last key in the AURA category and returns the next sequential key.
   * Prefix: CHAVE_AURA_
   */
  public generateNextSequentialKey(): string {
    let maxIdx = 0;
    
    const scanKey = (key: string) => {
      const match = key.match(/^CHAVE_AURA_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      const padMatch = key.match(/^CHAVE_AURA_0+(\d+)$/);
      if (padMatch) {
        const idx = parseInt(padMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(AuraConfigKeyManager.stdDefaults).forEach((key) => scanKey(key));

    return `CHAVE_AURA_${maxIdx + 1}`;
  }

  /**
   * Registers or updates an aura configuration with its exclusive key
   */
  public registerAura(key: string, baseAuraId: string, name: string, properties: Partial<ConfiguredAura>): ConfiguredAura {
    const existing = this.registry.get(key);
    // Resolve standard defaults for baseAuraId so we don't lose filters, offsets or scaling!
    const baseDefaults = AuraConfigKeyManager.stdDefaults[baseAuraId] || {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1.0,
      auraBrightness: 1.0,
      auraContrast: 1.0,
      auraOpacity: 0.85,
      auraOffsetX: 0,
      auraOffsetY: 0,
      auraScaleX: 1.0,
      auraScaleY: 1.0
    };

    const getVal = <T>(prop: keyof ConfiguredAura, fallback: T): T => {
      if (prop in properties) {
        return properties[prop] as unknown as T;
      }
      if (existing && (existing as any)[prop] !== undefined) {
        return (existing as any)[prop] as unknown as T;
      }
      return fallback;
    };

    const configuredAura: ConfiguredAura = {
      id: key,
      name: name || (existing ? existing.name : key),
      auraSprite: (properties.auraSprite as string) || (properties.baseAuraId as string) || baseAuraId || (existing ? (existing as any).auraSprite || (existing as any).baseAuraId : "AURA_001"),
      baseAuraId: (properties.baseAuraId as string) || baseAuraId || (existing ? (existing as any).baseAuraId : "AURA_001"),
      color: getVal("color", baseDefaults.color || "#ffffff"),
      glowColor: getVal("glowColor", (baseDefaults as any).glowColor),
      glowBlur: getVal("glowBlur", (baseDefaults as any).glowBlur),
      glowRadius: getVal("glowRadius", (baseDefaults as any).glowRadius),
      glowIntensity: getVal("glowIntensity", (baseDefaults as any).glowIntensity),
      auraHueRotate: getVal("auraHueRotate", baseDefaults.auraHueRotate),
      auraSaturate: getVal("auraSaturate", baseDefaults.auraSaturate),
      auraBrightness: getVal("auraBrightness", baseDefaults.auraBrightness),
      auraContrast: getVal("auraContrast", baseDefaults.auraContrast),
      auraOpacity: getVal("auraOpacity", baseDefaults.auraOpacity),
      ownerCharacterId: getVal("ownerCharacterId", undefined),
      ownerAnimationKey: getVal("ownerAnimationKey", undefined),
      ownerCharacterName: getVal("ownerCharacterName", undefined),
      isDefaultCharging: getVal("isDefaultCharging", undefined),
      isDefaultSparking: getVal("isDefaultSparking", undefined),
      auraOffsetX: getVal("auraOffsetX", baseDefaults.auraOffsetX),
      auraOffsetY: getVal("auraOffsetY", baseDefaults.auraOffsetY),
      auraScaleX: getVal("auraScaleX", baseDefaults.auraScaleX),
      auraScaleY: getVal("auraScaleY", baseDefaults.auraScaleY),
    };

    // If marked as default charging or sparking, unset others for this character
    if (properties.ownerCharacterId) {
      if (properties.isDefaultCharging) {
        this.registry.forEach((aura) => {
          if (aura.ownerCharacterId === properties.ownerCharacterId && aura.id !== key) {
            aura.isDefaultCharging = false;
          }
        });
      }
      if (properties.isDefaultSparking) {
        this.registry.forEach((aura) => {
          if (aura.ownerCharacterId === properties.ownerCharacterId && aura.id !== key) {
            aura.isDefaultSparking = false;
          }
        });
      }
    }

    if (properties.ownerCharacterId && properties.ownerAnimationKey) {
      const listToDelete: string[] = [];
      this.registry.forEach((aura) => {
        if (
          aura.ownerCharacterId === properties.ownerCharacterId &&
          aura.ownerAnimationKey === properties.ownerAnimationKey &&
          aura.id !== key
        ) {
          if (aura.id.startsWith("CHAVE_")) {
            listToDelete.push(aura.id);
          } else {
            aura.ownerAnimationKey = undefined;
            aura.ownerCharacterId = undefined;
            aura.ownerCharacterName = undefined;
          }
        }
      });
      listToDelete.forEach(id => this.registry.delete(id));
    }

    this.registry.set(key, configuredAura);
    this.saveToStorage();
    return configuredAura;
  }

  /**
   * Look up configuration for a given key.
   * If key is a legacy/original auraId, dynamically map and fallback.
   */
  public getAuraConfig(key: string): ConfiguredAura | undefined {
    if (!key) return undefined;

    if (this.registry.has(key)) {
      return this.registry.get(key);
    }

    const stdDefaults = AuraConfigKeyManager.stdDefaults;

    // Extract primary key (e.g. "CHAVE_AURA_001" from "CHAVE_AURA_001_GOKU_BASE")
    let primaryKey = key;
    const chaveMatch = key.match(/^(CHAVE_AURA_\d+)/);
    if (chaveMatch) {
      primaryKey = chaveMatch[1];
    } else {
      primaryKey = key.split("_GOKU_")[0].split("_TEEN_")[0].split("_NAPPA")[0].split("_GOGETA")[0].split("_BROLY")[0].split("_KURIRIN")[0].split("_VEGETA")[0].split("_TRUNKS")[0].split("_FRIEZA")[0];
    }

    if (this.registry.has(primaryKey)) {
      return this.registry.get(primaryKey);
    }

    const existsAsStd = stdDefaults[key] || stdDefaults[primaryKey] || (DEFAULT_AURAS as any)[key] || (DEFAULT_AURAS as any)[primaryKey];

    if (existsAsStd) {
      const defs = stdDefaults[key] || stdDefaults[primaryKey] || {
        color: "#ffffff",
        auraHueRotate: 0,
        auraSaturate: 1.0,
        auraBrightness: 1.0,
        auraContrast: 1.0,
        auraOpacity: 0.85,
        auraOffsetX: 0,
        auraOffsetY: 0,
        auraScaleX: 1.0,
        auraScaleY: 1.0
      };

      const baseAuraUrlKey = (defs.auraSprite as string) || (defs.auraAnimation as string) || (defs.auraUrl as string) || (defs.baseAuraId as string) || ((DEFAULT_AURAS as any)[primaryKey] ? primaryKey : "AURA_001");

      const aura: ConfiguredAura = {
        id: key,
        name: key,
        auraSprite: baseAuraUrlKey,
        baseAuraId: (defs.baseAuraId as string) || baseAuraUrlKey,
        ...defs
      } as ConfiguredAura;

      if (key.startsWith("CHAVE_") || key.startsWith("CHAVE_AURA_")) {
        return this.registerAura(key, baseAuraUrlKey, key, defs);
      }

      return aura;
    }

    // Dynamic fallback matching ONLY for standard AURA_xxx keys or legacy numeric aliases
    let targetAuraKey = "AURA_001";
    if (!key.startsWith("CHAVE_")) {
      const numMatch = key.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        const paddedKey = `AURA_${String(num).padStart(3, '0')}`;
        if ((DEFAULT_AURAS as any)[paddedKey] || stdDefaults[paddedKey]) {
          targetAuraKey = paddedKey;
        }
      }
    }

    const defs = stdDefaults[targetAuraKey] || {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1.0,
      auraBrightness: 1.0,
      auraContrast: 1.0,
      auraOpacity: 0.85,
      auraOffsetX: 0,
      auraOffsetY: 0,
      auraScaleX: 1.0,
      auraScaleY: 1.0
    };

    return this.registerAura(key, targetAuraKey, key, defs);
  }

  /**
   * Validates the integrity of the data associated with a configuration key
   */
  public validateAuraKey(key: string, requestedBaseId?: string): boolean {
    if (!key) {
      console.error("Validation failed: Aura configuration key is void or empty.");
      return false;
    }
    
    const config = this.getAuraConfig(key);
    if (!config) {
      console.error(`Validation failed: Key '${key}' not found in registry.`);
      return false;
    }

    if (requestedBaseId) {
      const parentId = (config as any).auraSprite || config.baseAuraId || requestedBaseId;
      const expectedPrefix = requestedBaseId.replace(/_000\d{3}/g, "").replace(/CHAVE_AURA_\d+/g, "");
      const actualPrefix = parentId.replace(/_000\d{3}/g, "").replace(/CHAVE_AURA_\d+/g, "");
      
      const matchesBase = 
        (config as any).auraSprite === requestedBaseId ||
        config.baseAuraId === requestedBaseId || 
        key === requestedBaseId || 
        key.startsWith(requestedBaseId) ||
        actualPrefix === expectedPrefix;
        
      if (!matchesBase) {
        console.warn(`Validation warning (cosmetic/base mismatch): Key '${key}' (base: ${config.baseAuraId}) does not correspond to requested aura: '${requestedBaseId}'. Continuing anyway.`);
      }
    }

    return true;
  }

  /**
   * Delete an aura configuration
   */
  public deleteAura(key: string) {
    this.registry.delete(key);
    this.saveToStorage();
  }

  /**
   * Find a customized aura configured for a specific animation of a character
   */
  public getAuraConfigForAnimation(characterId: string, animationKey: string): ConfiguredAura | undefined {
    let match: ConfiguredAura | undefined = undefined;
    
    // Check registry first (dynamic/user configs)
    this.registry.forEach((aura) => {
      if (
        aura.ownerCharacterId === characterId &&
        aura.ownerAnimationKey === animationKey
      ) {
        match = aura;
      }
    });
    
    if (match) return match;

    // Check stdDefaults as fallback
    Object.keys(AuraConfigKeyManager.stdDefaults).forEach(key => {
        const def = AuraConfigKeyManager.stdDefaults[key];
        if (def && def.ownerCharacterId === characterId && def.ownerAnimationKey === animationKey) {
            match = this.getAuraConfig(key);
        }
    });

    return match;
  }

  /**
   * Find default charging aura for a character
   */
  public getAuraConfigForCharacterDefault(characterId: string): ConfiguredAura | undefined {
    let match: ConfiguredAura | undefined = undefined;
    
    this.registry.forEach((aura) => {
      if (aura.ownerCharacterId === characterId && aura.isDefaultCharging) {
        match = aura;
      }
    });

    if (match) return match;

    Object.keys(AuraConfigKeyManager.stdDefaults).forEach(key => {
        const def = AuraConfigKeyManager.stdDefaults[key];
        if (def && def.ownerCharacterId === characterId && def.isDefaultCharging) {
            match = this.getAuraConfig(key);
        }
    });

    return match;
  }

  /**
   * Find default sparking aura for a character
   */
  public getAuraConfigForCharacterSparking(characterId: string): ConfiguredAura | undefined {
    let match: ConfiguredAura | undefined = undefined;
    
    this.registry.forEach((aura) => {
      if (aura.ownerCharacterId === characterId && aura.isDefaultSparking) {
        match = aura;
      }
    });

    if (match) return match;

    Object.keys(AuraConfigKeyManager.stdDefaults).forEach(key => {
        const def = AuraConfigKeyManager.stdDefaults[key];
        if (def && def.ownerCharacterId === characterId && def.isDefaultSparking) {
            match = this.getAuraConfig(key);
        }
    });

    return match;
  }

  /**
   * Get all registered configured auras
   */
  public getAllAuras(): Record<string, ConfiguredAura> {
    const result: Record<string, ConfiguredAura> = {};
    
    // First yield everything in stdDefaults / DEFAULT_AURAS
    Object.keys(AuraConfigKeyManager.stdDefaults).forEach(k => {
      const standardAura = this.getAuraConfig(k);
      if (standardAura) {
        result[k] = standardAura;
      }
    });

    Object.keys(DEFAULT_AURAS).forEach(k => {
      if (!result[k]) {
        const standardAura = this.getAuraConfig(k);
        if (standardAura) {
          result[k] = standardAura;
        }
      }
    });

    // Overwrite with registry values which contain the rich metadata / owner mapping
    this.registry.forEach((value, key) => {
      result[key] = {
        ...result[key],
        ...value
      };
    });
    
    return result;
  }

  /**
   * Scans all animations of all base characters, and guarantees that any animation
   * that defines an aura has its own unique, exclusive CHAVE_AURA_xxx configuration.
   */
  public initializeExclusiveKeysForBaseCharacters(characters: any[]) {
    if (!characters || characters.length === 0) return;

    console.log("[AuraConfig] Initializing exclusive aura keys for characters...");
    
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;

      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        if (anim && anim.auraConfigKey && typeof anim.auraConfigKey === "string") {
          const currentAuraKey = anim.auraConfigKey;
          
          if (currentAuraKey.startsWith("CHAVE_") || currentAuraKey.startsWith("CHAVE_AURA_")) {
            const baseAuraDefaults = AuraConfigKeyManager.stdDefaults[currentAuraKey] || {
              color: "#ffffff",
              auraHueRotate: 0,
              auraSaturate: 1.0,
              auraBrightness: 1.0,
              auraContrast: 1.0,
              auraOpacity: 0.85,
              auraOffsetX: 0,
              auraOffsetY: 0,
              auraScaleX: 1.0,
              auraScaleY: 1.0
            };

            const existing = this.registry.get(currentAuraKey);
            if (existing) {
              // PRESERVE user changes while ensuring ownership metadata is correct
              const merged = {
                ...baseAuraDefaults,
                ...existing, // user's custom changes take priority
                ownerCharacterId: char.id,
                ownerAnimationKey: animKey,
                ownerCharacterName: char.name
              } as ConfiguredAura;
              
              // Ensure baseAuraId/auraSprite are never lost if they were in defaults but missing or invalid in existing
              if ((!merged.baseAuraId || merged.baseAuraId === currentAuraKey) && baseAuraDefaults.baseAuraId) {
                merged.baseAuraId = baseAuraDefaults.baseAuraId;
              }
              if ((!merged.auraSprite || merged.auraSprite === currentAuraKey) && baseAuraDefaults.auraSprite) {
                merged.auraSprite = baseAuraDefaults.auraSprite;
              }
              if ((!merged.auraAnimation || merged.auraAnimation === currentAuraKey) && baseAuraDefaults.auraAnimation) {
                merged.auraAnimation = baseAuraDefaults.auraAnimation;
              }
              if ((!merged.auraUrl || merged.auraUrl === currentAuraKey) && baseAuraDefaults.auraUrl) {
                merged.auraUrl = baseAuraDefaults.auraUrl;
              }
              
              this.registry.set(currentAuraKey, merged);
            } else {
              // Create new entry from defaults
              let baseAuraId = baseAuraDefaults.baseAuraId || "AURA_001";
              
              // Guess base aura ID from key if it's missing (e.g. CHAVE_AURA_008 -> AURA_008)
              if (!baseAuraDefaults.baseAuraId) {
                const matches = currentAuraKey.match(/CHAVE_AURA_(\d+)/);
                if (matches) {
                  const num = parseInt(matches[1], 10);
                  const paddedNum = String(num).padStart(3, '0');
                  const potentialKey = `AURA_${paddedNum}`;
                  if ((DEFAULT_AURAS as any)[potentialKey]) {
                    baseAuraId = potentialKey;
                  }
                }
              }

              const props = {
                ...baseAuraDefaults,
                ownerCharacterId: char.id,
                ownerAnimationKey: animKey,
                ownerCharacterName: char.name
              };
              
              this.registerAura(currentAuraKey, baseAuraId, currentAuraKey, props);
            }
          }
        }
      });
    });

    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem("EXCLUSIVE_AURAS_REGISTRY_V2");
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.keys(parsed).forEach((k) => {
            this.registry.set(k, parsed[k]);
          });
        }
      }
    } catch (e) {
      console.error("Error loading AuraConfigKeyManager from storage:", e);
    }
    
    // Ensure all base characters are migrated to exclusive animation keys and clean up orphans
    try {
      this.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
      this.cleanupDuplicateAndOrphanedAuras(BASE_CHARACTERS);
    } catch (e) {
      console.error("Failed to initialize exclusive keys for base characters:", e);
    }
  }

  public cleanupDuplicateAndOrphanedAuras(characters: any[]): number {
    let deletedCount = 0;
    
    // 1. Identify valid standard keys that should never be deleted
    const standardKeys = new Set([
      ...Object.keys(AuraConfigKeyManager.stdDefaults),
      ...Object.keys(DEFAULT_AURAS)
    ]);

    // 2. Identify active keys in characters animations
    const activeKeys = new Set<string>();
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;
      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        if (anim && anim.auraConfigKey) {
          activeKeys.add(anim.auraConfigKey);
        }
      });
    });

    // Also consider default charging and default sparking as active
    this.registry.forEach((aura, k) => {
      if (aura.isDefaultCharging || aura.isDefaultSparking) {
        activeKeys.add(k);
      }
    });

    // 3. Remove orphaned keys from registry
    // ONLY delete if it's not a standard key AND not active in any character
    const registryKeys = Array.from(this.registry.keys());
    registryKeys.forEach((key) => {
      if (!activeKeys.has(key) && !standardKeys.has(key)) {
        this.registry.delete(key);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`[AuraConfig] Cleaned up ${deletedCount} orphaned aura configurations.`);
      this.saveToStorage();
    }
    
    return deletedCount;
  }

  public revertToDefaults() {
    this.registry.clear();
    this.counters.clear();
    this.loadFromStorage();
  }

  public saveToStorage() {
    try {
      if (typeof localStorage === "undefined") return;
      const obj: Record<string, ConfiguredAura> = {};
      this.registry.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem("EXCLUSIVE_AURAS_REGISTRY_V2", JSON.stringify(obj));
    } catch (e) {
      console.error("Error saving AuraConfigKeyManager to storage:", e);
    }
  }
}
