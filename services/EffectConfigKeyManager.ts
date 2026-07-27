import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";
import { DEFAULT_EFFECTS } from "../constants/EffectDatabase";

export interface ConfiguredEffect {
  id: string; // unique key, e.g., CHAVE_VFX_001
  name: string;
  baseEffectId: keyof typeof DEFAULT_EFFECTS | string; // key of default list, or custom URL
  color: string; // tint color, e.g., "#ffffff"
  effectHueRotate?: number;
  effectSaturate?: number;
  effectBrightness?: number;
  effectContrast?: number;
  effectOpacity?: number;
  ownerCharacterId?: string;
  ownerAnimationKey?: string;
  ownerCharacterName?: string;
  effectOffsetX?: number;
  effectOffsetY?: number;
  effectScaleX?: number;
  effectScaleY?: number;
  effectRotation?: number;
  // Animation Properties
  imageUrl?: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  speed?: number;
  scale?: number;
  loop?: boolean;
  isGif?: boolean;
  offsetX?: number;
  offsetY?: number;
}

export class EffectConfigKeyManager {
  private static instance: EffectConfigKeyManager;
  private registry: Map<string, ConfiguredEffect> = new Map();
  private counters: Map<string, number> = new Map();

  public static stdDefaults: Record<string, Partial<ConfiguredEffect>> = {
    EFFECT_POEIRA_01: {
      color: "#ffffff",
      effectHueRotate: 0,
      effectSaturate: 1.0,
      effectBrightness: 1.0,
      effectContrast: 1.0,
      effectOpacity: 1,
      effectOffsetX: 0,
      effectOffsetY: 0,
      effectScaleX: 1.0,
      effectScaleY: 1.0,
      effectRotation: 0,
    },
    EFFECT_POEIRA_04: {
      scale: 0.80
    },
    EFFECT_TELACHEIA_05: {
      scale: 1.0
    },
    EFFECT_TELACHEIA_06: {
      scale: 1.0,
      effectOpacity: 1.0
    },
    VFX_CHAO_DESTRUIDO_BUU: {
      imageUrl: "/Assets/efeitos/chao/destruido/1.gif",
      frameWidth: 100,
      frameHeight: 100,
      frames: 12,
      speed: 5,
      scale: 1,
      loop: false,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 298,
      effectSaturate: 1.9,
      effectBrightness: 0.9,
      effectContrast: 1.45
    },
    VFX_CHAO_DESTRUIDO_KAME: {
      name: "VFX_CHAO_DESTRUIDO_KAME",
      imageUrl: "/Assets/efeitos/chao/destruido/1.gif",
      frameWidth: 100,
      frameHeight: 100,
      frames: 12,
      speed: 5,
      scale: 1,
      loop: false,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 0,
      effectSaturate: 1,
      effectBrightness: 1.3,
      effectContrast: 1.55
    },
    VFX_CHAO_DESTRUIDO_TORNEIO: {
      imageUrl: "/Assets/efeitos/chao/destruido/1.gif",
      frameWidth: 100,
      frameHeight: 100,
      frames: 12,
      speed: 5,
      scale: 1,
      loop: false,
      isGif: true,
      offsetX: 0,
      offsetY: 0
    },
    VFX_CHAO_DESTRUIDO_ESPACO: {
      name: "VFX_CHAO_DESTRUIDO_ESPACO",
      imageUrl: "/Assets/efeitos/chao/destruido/1.gif",
      frameWidth: 100,
      frameHeight: 100,
      frames: 12,
      speed: 5,
      scale: 1,
      loop: false,
      isGif: true,
      offsetX: 0,
      offsetY: 0,
      color: "#ffffff",
      effectHueRotate: 186,
      effectSaturate: 1.8,
      effectBrightness: 0.9,
      effectContrast: 1.6
    },
    VFX_CHAO_DESTRUIDO_DESERTO: {
      imageUrl: "/Assets/efeitos/chao/destruido/1.gif",
      frameWidth: 100,
      frameHeight: 100,
      frames: 12,
      speed: 5,
      scale: 1,
      loop: false,
      isGif: true,
      offsetX: 0,
      offsetY: 0
    },
    CHAVE_EFFECT_TELACHEIA_05_VERDE: {
      name: "EFFECT_TELACHEIA_05",
      baseEffectId: "EFFECT_TELACHEIA_05",
      color: "#ffffff",
      effectHueRotate: 28,
      effectSaturate: 3.3,
      effectBrightness: 1,
      effectContrast: 2.9,
      effectOpacity: 1,
      effectOffsetX: 0,
      effectOffsetY: 0,
      effectScaleX: 1,
      effectScaleY: 1,
      effectRotation: 0,
      scale: 1.0,
      ownerCharacterId: "broly_ikari",
      ownerAnimationKey: "Especial_1_2",
      ownerCharacterName: "BROLY IKARI"
    },
    CHAVE_EFFECT_TELACHEIA_05_AZUL: {
      name: "EFFECT_TELACHEIA_05",
      baseEffectId: "EFFECT_TELACHEIA_05",
      color: "#ffffff",
      effectHueRotate: 138,
      effectSaturate: 2.4,
      effectBrightness: 1.3,
      effectContrast: 2.45,
      effectOpacity: 1,
      imageUrl: "/Assets/efeitos/telacheia/5.gif",
      frames: 10,
      speed: 5,
      scale: 1.0,
      loop: false,
      isGif: true,
      ownerCharacterId: "gogeta_ssj4",
      ownerAnimationKey: "Especial_1_2",
      ownerCharacterName: "GOGETA SSJ4"
    }
    // Add more defaults if needed
  };

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): EffectConfigKeyManager {
    if (!EffectConfigKeyManager.instance) {
      EffectConfigKeyManager.instance = new EffectConfigKeyManager();
    }
    return EffectConfigKeyManager.instance;
  }

  /**
   * Generates a new unique configuration key for an effect
   * Format: CHAVE_VFX_001, CHAVE_VFX_002, etc.
   */
  public generateKey(): string {
    let count = (this.counters.get("CHAVE_VFX") || 0) + 1;
    this.counters.set("CHAVE_VFX", count);
    
    let paddedCount = String(count).padStart(3, '0');
    let key = `CHAVE_VFX_${paddedCount}`;
    while (this.registry.has(key)) {
      count++;
      this.counters.set("CHAVE_VFX", count);
      key = `CHAVE_VFX_${String(count).padStart(3, '0')}`;
    }
    return key;
  }

  /**
   * Locates the last key in the VFX category and returns the next sequential key.
   * Prefix: CHAVE_VFX_
   */
  public generateNextSequentialKey(): string {
    let maxIdx = 0;
    
    const scanKey = (key: string) => {
      const match = key.match(/^CHAVE_VFX_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      const padMatch = key.match(/^CHAVE_VFX_0+(\d+)$/);
      if (padMatch) {
        const idx = parseInt(padMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(EffectConfigKeyManager.stdDefaults).forEach((key) => scanKey(key));

    return `CHAVE_VFX_${maxIdx + 1}`;
  }

  /**
   * Registers or updates an effect configuration with its exclusive key
   */
  public registerEffect(key: string, baseEffectId: string, name: string, properties: Partial<ConfiguredEffect>): ConfiguredEffect {
    const baseDefaults: any = EffectConfigKeyManager.stdDefaults[baseEffectId] || {
      imageUrl: (DEFAULT_EFFECTS as any)[baseEffectId] || baseEffectId,
      frames: 10,
      speed: 4,
      scale: 2.2,
      loop: false,
      isGif: true,
      color: "#ffffff",
      effectHueRotate: 0,
      effectSaturate: 1.0,
      effectBrightness: 1.0,
      effectContrast: 1.0,
      effectOpacity: 1,
      effectOffsetX: 0,
      effectOffsetY: 0,
      effectScaleX: 1.0,
      effectScaleY: 1.0,
      effectRotation: 0,
    };

    const configuredEffect: ConfiguredEffect = {
      id: key,
      name: name || key,
      baseEffectId: baseEffectId,
      color: properties.color !== undefined ? properties.color : (baseDefaults.color || "#ffffff"),
      effectHueRotate: properties.effectHueRotate !== undefined ? properties.effectHueRotate : baseDefaults.effectHueRotate,
      effectSaturate: properties.effectSaturate !== undefined ? properties.effectSaturate : baseDefaults.effectSaturate,
      effectBrightness: properties.effectBrightness !== undefined ? properties.effectBrightness : baseDefaults.effectBrightness,
      effectContrast: properties.effectContrast !== undefined ? properties.effectContrast : baseDefaults.effectContrast,
      effectOpacity: properties.effectOpacity !== undefined ? properties.effectOpacity : baseDefaults.effectOpacity,
      ownerCharacterId: properties.ownerCharacterId,
      ownerAnimationKey: properties.ownerAnimationKey,
      ownerCharacterName: properties.ownerCharacterName,
      effectOffsetX: properties.effectOffsetX !== undefined ? properties.effectOffsetX : baseDefaults.effectOffsetX,
      effectOffsetY: properties.effectOffsetY !== undefined ? properties.effectOffsetY : baseDefaults.effectOffsetY,
      effectScaleX: properties.effectScaleX !== undefined ? properties.effectScaleX : baseDefaults.effectScaleX,
      effectScaleY: properties.effectScaleY !== undefined ? properties.effectScaleY : baseDefaults.effectScaleY,
      effectRotation: properties.effectRotation !== undefined ? properties.effectRotation : baseDefaults.effectRotation,
      
      // Animation properties
      imageUrl: properties.imageUrl !== undefined ? properties.imageUrl : baseDefaults.imageUrl,
      frameWidth: properties.frameWidth !== undefined ? properties.frameWidth : baseDefaults.frameWidth,
      frameHeight: properties.frameHeight !== undefined ? properties.frameHeight : baseDefaults.frameHeight,
      frames: properties.frames !== undefined ? properties.frames : baseDefaults.frames,
      speed: properties.speed !== undefined ? properties.speed : baseDefaults.speed,
      scale: properties.scale !== undefined ? properties.scale : baseDefaults.scale,
      loop: properties.loop !== undefined ? properties.loop : baseDefaults.loop,
      isGif: properties.isGif !== undefined ? properties.isGif : baseDefaults.isGif,
      offsetX: properties.offsetX !== undefined ? properties.offsetX : baseDefaults.offsetX,
      offsetY: properties.offsetY !== undefined ? properties.offsetY : baseDefaults.offsetY,
    };

    if (properties.ownerCharacterId && properties.ownerAnimationKey) {
      const listToDelete: string[] = [];
      this.registry.forEach((effect) => {
        if (
          effect.ownerCharacterId === properties.ownerCharacterId &&
          effect.ownerAnimationKey === properties.ownerAnimationKey &&
          effect.id !== key
        ) {
          if (effect.id.startsWith("CHAVE_")) {
            listToDelete.push(effect.id);
          } else {
            effect.ownerAnimationKey = undefined;
            effect.ownerCharacterId = undefined;
            effect.ownerCharacterName = undefined;
          }
        }
      });
      listToDelete.forEach(id => this.registry.delete(id));
    }

    this.registry.set(key, configuredEffect);
    this.saveToStorage();
    return configuredEffect;
  }

  /**
   * Look up configuration for a given key.
   */
  public getEffect(key: string): ConfiguredEffect | undefined {
    if (!key) return undefined;

    if (this.registry.has(key)) {
      return this.registry.get(key);
    }

    const stdDefaults = EffectConfigKeyManager.stdDefaults;
    const existsAsStd = stdDefaults[key] || (DEFAULT_EFFECTS as any)[key];

    if (existsAsStd) {
      const defs = stdDefaults[key] || {
        color: "#ffffff",
        effectHueRotate: 0,
        effectSaturate: 1.0,
        effectBrightness: 1.0,
        effectContrast: 1.0,
        effectOpacity: 1,
        effectOffsetX: 0,
        effectOffsetY: 0,
        effectScaleX: 1.0,
        effectScaleY: 1.0,
        effectRotation: 0
      };

      const baseEffectId = (defs as any).baseEffectId || ((DEFAULT_EFFECTS as any)[key] ? key : "EFFECT_POEIRA_01");

      const effect: ConfiguredEffect = {
        id: key,
        name: key,
        baseEffectId: baseEffectId,
        ...defs
      } as ConfiguredEffect;

      if (key.startsWith("CHAVE_") || key.startsWith("CHAVE_VFX_") || key.startsWith("VFX_") || key.startsWith("EFFECT_")) {
        return this.registerEffect(key, baseEffectId, key, defs);
      }

      return effect;
    }

    // Auto-create/register configuration for any new custom keys starting with standard prefixes
    if (key.startsWith("VFX_") || key.startsWith("CHAVE_") || key.startsWith("CHAVE_VFX_") || key.startsWith("EFFECT_")) {
      const baseEffectId = "EFFECT_POEIRA_01";
      const defs = {
        color: "#ffffff",
        effectHueRotate: 0,
        effectSaturate: 1.0,
        effectBrightness: 1.0,
        effectContrast: 1.0,
        effectOpacity: 1,
        effectOffsetX: 0,
        effectOffsetY: 0,
        effectScaleX: 1.0,
        effectScaleY: 1.0,
        effectRotation: 0
      };
      return this.registerEffect(key, baseEffectId, key, defs);
    }

    return undefined;
  }

  /**
   * Get all registered configured effects
   */
  public getAllEffects(): Record<string, ConfiguredEffect> {
    const result: Record<string, ConfiguredEffect> = {};
    
    Object.keys(EffectConfigKeyManager.stdDefaults).forEach(k => {
      const standard = this.getEffect(k);
      if (standard) {
        result[k] = standard;
      }
    });

    this.registry.forEach((value, key) => {
      result[key] = {
        ...result[key],
        ...value
      };
    });
    
    return result;
  }

  public initializeExclusiveKeysForBaseCharacters(characters: any[]) {
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;
      
      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        if (anim && anim.effectConfigKey && typeof anim.effectConfigKey === "string") {
          const currentEffectKey = anim.effectConfigKey;
          
          if (currentEffectKey.startsWith("CHAVE_") || currentEffectKey.startsWith("CHAVE_VFX_")) {
            const baseDefaults = EffectConfigKeyManager.stdDefaults[currentEffectKey] || {
              color: "#ffffff",
              effectHueRotate: 0,
              effectSaturate: 1.0,
              effectBrightness: 1.0,
              effectContrast: 1.0,
              effectOpacity: 1,
              effectOffsetX: 0,
              effectOffsetY: 0,
              effectScaleX: 1.0,
              effectScaleY: 1.0,
              effectRotation: 0
            };
            
            const mergedProperties = {
              ...baseDefaults,
              ownerCharacterId: char.id,
              ownerAnimationKey: animKey,
              ownerCharacterName: char.name
            };

            const existing = this.registry.get(currentEffectKey);
            if (existing) {
              const merged = {
                ...existing,
                ...mergedProperties,
              } as ConfiguredEffect;
              this.registry.set(currentEffectKey, merged);
            } else {
                let baseId = (baseDefaults as any).baseEffectId || "EFFECT_POEIRA_01";
                this.registerEffect(currentEffectKey, baseId, currentEffectKey, mergedProperties);
            }
          }
        }
      });
    });
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      this.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
      this.cleanupDuplicateAndOrphanedEffects(BASE_CHARACTERS);
    } catch (e) {
      console.error("Failed to initialize exclusive effect keys for base characters:", e);
    }
  }

  public cleanupDuplicateAndOrphanedEffects(characters: any[]): number {
    const seenAssignments = new Map<string, string>();
    const keysToDelete = new Set<string>();

    const customKeys = Array.from(this.registry.keys())
      .filter(k => k.startsWith("CHAVE_"))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    customKeys.forEach(k => {
      const effect = this.registry.get(k);
      if (effect && effect.ownerCharacterId && effect.ownerAnimationKey) {
        const uniqueString = `${effect.ownerCharacterId}:${effect.ownerAnimationKey}`;
        if (seenAssignments.has(uniqueString)) {
          keysToDelete.add(k);
        } else {
          seenAssignments.set(uniqueString, k);
        }
      }
    });

    const activeKeys = new Set<string>();
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;
      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        if (anim && anim.effectConfigKey) {
          activeKeys.add(anim.effectConfigKey);
        }
      });
    });

    const initialSize = this.registry.size;

    keysToDelete.forEach(k => this.registry.delete(k));

    const deletedCount = initialSize - this.registry.size;
    if (deletedCount > 0) {
      this.saveToStorage();
    }
    return deletedCount;
  }

  public deleteEffect(key: string) {
    this.registry.delete(key);
    this.saveToStorage();
  }

  public revertToDefaults() {
    this.registry.clear();
    this.counters.clear();
    this.loadFromStorage();
  }

  public saveToStorage() {
    // Persistent storage disabled per pattern
  }
}
