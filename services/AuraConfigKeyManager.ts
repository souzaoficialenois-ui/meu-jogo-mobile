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
  baseAuraId: keyof typeof DEFAULT_AURAS | string; // key of default list, or custom URL
  color: string; // tint color, e.g., "#ffffff"
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
      baseAuraId: "AURA_008",
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 0.85,
      auraOffsetX: -1,
      auraOffsetY: 33,
      auraScaleX: 1.6,
      auraScaleY: 1
    },
    CHAVE_AURA_002: {
      baseAuraId: "AURA_001",
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 0,
      auraBrightness: 0.85,
      auraContrast: 1.7,
      auraOpacity: 1,
      ownerCharacterId: "goku_mui",
      ownerAnimationKey: "CHARGING",
      isDefaultCharging: true,
      auraOffsetX: -2,
      auraOffsetY: 0,
      auraScaleX: 1.5,
      auraScaleY: 1.25
    },
    CHAVE_AURA_004: {
      name: "CHAVE_AURA_004",
      baseAuraId: "AURA_010",
      color: "#ffffff",
      auraHueRotate: 0,
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
    CHAVE_AURA_011: {
      baseAuraId: "AURA_013",
      color: "#ffffff",
      auraHueRotate: 191,
      auraSaturate: 4,
      auraBrightness: 0.85,
      auraContrast: 2.85,
      auraOpacity: 1,
      ownerCharacterId: "broly_ikari",
      ownerAnimationKey: "CHARGING",
      isDefaultCharging: true,
      auraOffsetX: 0,
      auraOffsetY: 1,
      auraScaleX: 1.9,
      auraScaleY: 1.4000000000000001
    },
    CHAVE_AURA_006: {
      baseAuraId: "AURA_003",
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

    const configuredAura: ConfiguredAura = {
      id: key,
      name: key,
      baseAuraId: baseAuraId,
      color: properties.color !== undefined ? properties.color : (baseDefaults.color || "#ffffff"),
      auraHueRotate: properties.auraHueRotate !== undefined ? properties.auraHueRotate : baseDefaults.auraHueRotate,
      auraSaturate: properties.auraSaturate !== undefined ? properties.auraSaturate : baseDefaults.auraSaturate,
      auraBrightness: properties.auraBrightness !== undefined ? properties.auraBrightness : baseDefaults.auraBrightness,
      auraContrast: properties.auraContrast !== undefined ? properties.auraContrast : baseDefaults.auraContrast,
      auraOpacity: properties.auraOpacity !== undefined ? properties.auraOpacity : baseDefaults.auraOpacity,
      ownerCharacterId: properties.ownerCharacterId,
      ownerAnimationKey: properties.ownerAnimationKey,
      ownerCharacterName: properties.ownerCharacterName,
      isDefaultCharging: properties.isDefaultCharging,
      isDefaultSparking: properties.isDefaultSparking,
      auraOffsetX: properties.auraOffsetX !== undefined ? properties.auraOffsetX : baseDefaults.auraOffsetX,
      auraOffsetY: properties.auraOffsetY !== undefined ? properties.auraOffsetY : baseDefaults.auraOffsetY,
      auraScaleX: properties.auraScaleX !== undefined ? properties.auraScaleX : baseDefaults.auraScaleX,
      auraScaleY: properties.auraScaleY !== undefined ? properties.auraScaleY : baseDefaults.auraScaleY,
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
    const baseKey = key.split("_GOKU_")[0].split("_TEEN_")[0].split("_NAPPA")[0].split("_GOGETA")[0].split("_BROLY")[0].split("_KURIRIN")[0]; // e.g. AURA_001
    const existsAsStd = stdDefaults[key] || (DEFAULT_AURAS as any)[key] || (DEFAULT_AURAS as any)[baseKey];

    if (existsAsStd) {
      const defs = stdDefaults[key] || stdDefaults[baseKey] || {
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

      const baseAuraUrlKey = (DEFAULT_AURAS as any)[key] ? key : ((DEFAULT_AURAS as any)[baseKey] ? baseKey : "AURA_001");

      const aura: ConfiguredAura = {
        id: key,
        name: key,
        baseAuraId: baseAuraUrlKey,
        ...defs
      } as ConfiguredAura;

      if (key.startsWith("CHAVE_") || key.startsWith("CHAVE_AURA_")) {
        // If the key itself is starting with CHAVE_, register it
        return this.registerAura(key, baseAuraUrlKey, key, defs);
      }

      // Return standard built-in auras directly without generating config keys or auto-migrating
      return aura;
    }

    return undefined;
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
      const parentId = config.baseAuraId || requestedBaseId;
      const expectedPrefix = requestedBaseId.replace(/_000\d{3}/g, "").replace(/CHAVE_AURA_\d+/g, "");
      const actualPrefix = parentId.replace(/_000\d{3}/g, "").replace(/CHAVE_AURA_\d+/g, "");
      
      const matchesBase = 
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
    this.registry.forEach((aura) => {
      if (
        aura.ownerCharacterId === characterId &&
        aura.ownerAnimationKey === animationKey
      ) {
        match = aura;
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
            
            const mergedProperties = {
              ...baseAuraDefaults,
              ownerCharacterId: char.id,
              ownerAnimationKey: animKey,
              ownerCharacterName: char.name
            };

            const existing = this.registry.get(currentAuraKey);
            if (existing) {
              const merged = {
                ...existing,
                ...mergedProperties,
              } as ConfiguredAura;
              this.registry.set(currentAuraKey, merged);
            } else {
              let baseAuraId = baseAuraDefaults.baseAuraId || "AURA_001";
              if (!baseAuraDefaults.baseAuraId) {
                const matches = currentAuraKey.match(/CHAVE_AURA_(\d+)/);
                if (matches) {
                  const num = parseInt(matches[1], 10);
                  const paddedNum = String(num).padStart(3, '0');
                  if ((DEFAULT_AURAS as any)[`AURA_${paddedNum}`]) {
                    baseAuraId = `AURA_${paddedNum}`;
                  }
                }
              }
              this.registerAura(currentAuraKey, baseAuraId, currentAuraKey, mergedProperties);
            }
          }
        }
      });
    });
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      // Clear legacy storage to prevent conflicts with codebase static configurations
      localStorage.removeItem("EXCLUSIVE_AURAS_REGISTRY");
    } catch (e) {
      // Ignore
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
    // 1. Remove duplicate custom keys pointing to the same character + animation
    const seenAssignments = new Map<string, string>(); // "charId:animKey" -> key (winner)
    const keysToDelete = new Set<string>();

    const customKeys = Array.from(this.registry.keys())
      .filter(k => k.startsWith("CHAVE_"))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    customKeys.forEach(k => {
      const aura = this.registry.get(k);
      if (aura && aura.ownerCharacterId && aura.ownerAnimationKey) {
        const uniqueString = `${aura.ownerCharacterId}:${aura.ownerAnimationKey}`;
        if (seenAssignments.has(uniqueString)) {
          keysToDelete.add(k);
        } else {
          seenAssignments.set(uniqueString, k);
        }
      }
    });

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

    const initialSize = this.registry.size;

    // Delete duplicates
    keysToDelete.forEach(k => this.registry.delete(k));

    // Specifically delete keys from CHAVE_AURA_015 to CHAVE_AURA_150 (and CHAVE_AURA_15 to CHAVE_AURA_150)
    // if they are not active (meaning they are unassigned and unconfigured)
    const specificKeysToVerify = [];
    for (let i = 15; i <= 150; i++) {
      specificKeysToVerify.push(`CHAVE_AURA_${String(i).padStart(3, '0')}`);
      specificKeysToVerify.push(`CHAVE_AURA_${i}`);
    }

    specificKeysToVerify.forEach((key) => {
      if (!activeKeys.has(key)) {
        this.registry.delete(key);
      }
    });

    const deletedCount = initialSize - this.registry.size;
    if (deletedCount > 0) {
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
    // Completely removed local storage persistence to prevent cache sync bugs
  }
}
