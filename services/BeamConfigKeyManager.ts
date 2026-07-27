import { BEAM_DATABASE, BeamFamily } from "../constants/BeamDatabase";
import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";

export interface ConfiguredBeam extends BeamFamily {
  configKey: string;
  baseBeamId: string;
  ownerCharacterId?: string;
  ownerAnimationKey?: string;
  ownerCharacterName?: string;
}

export class BeamConfigKeyManager {
  private static instance: BeamConfigKeyManager;
  private registry: Map<string, ConfiguredBeam> = new Map();
  private counters: Map<string, number> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): BeamConfigKeyManager {
    if (!BeamConfigKeyManager.instance) {
      BeamConfigKeyManager.instance = new BeamConfigKeyManager();
    }
    return BeamConfigKeyManager.instance;
  }

  /**
   * Generates a new unique configuration key for a beam family
   * Format: CHAVE_BEAM_001, CHAVE_BEAM_002, etc.
   */
  public generateKey(baseBeamId?: string): string {
    let count = (this.counters.get("CHAVE_BEAM") || 0) + 1;
    this.counters.set("CHAVE_BEAM", count);
    
    let paddedCount = String(count).padStart(3, '0');
    let key = `CHAVE_BEAM_${paddedCount}`;
    while (this.registry.has(key)) {
      count++;
      this.counters.set("CHAVE_BEAM", count);
      key = `CHAVE_BEAM_${String(count).padStart(3, '0')}`;
    }
    return key;
  }

  /**
   * Locates the last key in the BEAM category and returns the next sequential key.
   * Prefix: CHAVE_BEAM_
   */
  public generateNextSequentialKey(): string {
    let maxIdx = 0;
    
    const scanKey = (key: string) => {
      const match = key.match(/^CHAVE_BEAM_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      const padMatch = key.match(/^CHAVE_BEAM_0+(\d+)$/);
      if (padMatch) {
        const idx = parseInt(padMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(BEAM_DATABASE).forEach((key) => scanKey(key));

    return `CHAVE_BEAM_${maxIdx + 1}`;
  }

  /**
   * Generates a new unique configuration key exclusively for a character animation
   */
  public generateUniqueKeyForAnimation(charId: string, animKey: string, baseBeamId: string): string {
    return this.generateKey(baseBeamId);
  }

  /**
   * Registers or updates a beam configuration with its exclusive key
   */
  public registerBeam(key: string, baseBeamId: string, name: string, properties: Partial<BeamFamily> & { ownerCharacterId?: string; ownerAnimationKey?: string; ownerCharacterName?: string; }): ConfiguredBeam {
    const defaultBase = BEAM_DATABASE[baseBeamId] || this.registry.get(baseBeamId) || BEAM_DATABASE["BEAM"] || { id: baseBeamId, name: baseBeamId, middle: { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 } };
    
    // Perform nested merge for start, middle, end objects to prevent losing base properties like imageUrl, frames, etc.
    let mergedStart = (defaultBase.start || properties.start) ? {
      ...defaultBase.start,
      ...properties.start
    } : undefined;

    let mergedMiddle = (defaultBase.middle || properties.middle) ? {
      ...defaultBase.middle,
      ...properties.middle
    } : { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 };

    let mergedEnd = (defaultBase.end || properties.end) ? {
      ...defaultBase.end,
      ...properties.end
    } : undefined;

    // Strict validation to avoid adding default start parts when editing or copying custom/edited beams
    if (mergedStart && (!mergedStart.imageUrl || mergedStart.imageUrl === "")) {
      mergedStart = undefined;
    }
    if (mergedEnd && (!mergedEnd.imageUrl || mergedEnd.imageUrl === "")) {
      mergedEnd = undefined;
    }

    const configuredBeam: ConfiguredBeam = {
      ...defaultBase,
      ...properties,
      start: mergedStart,
      middle: mergedMiddle,
      end: mergedEnd,
      id: key, // ID in the engine is the unique key
      name: name,
      configKey: key,
      baseBeamId: baseBeamId,
      ownerCharacterId: properties.ownerCharacterId,
      ownerAnimationKey: properties.ownerAnimationKey,
      ownerCharacterName: properties.ownerCharacterName
    } as ConfiguredBeam;

    if (properties.ownerCharacterId && properties.ownerAnimationKey) {
      const listToDelete: string[] = [];
      this.registry.forEach((beam) => {
        if (
          beam.ownerCharacterId === properties.ownerCharacterId &&
          beam.ownerAnimationKey === properties.ownerAnimationKey &&
          beam.id !== key
        ) {
          if (beam.id.startsWith("CHAVE_")) {
            listToDelete.push(beam.id);
          } else {
            beam.ownerAnimationKey = undefined;
            beam.ownerCharacterId = undefined;
            beam.ownerCharacterName = undefined;
          }
        }
      });
      listToDelete.forEach(id => this.registry.delete(id));
    }

    this.registry.set(key, configuredBeam);
    this.saveToStorage();
    return configuredBeam;
  }

  /**
   * Look up configuration for a given key.
   * If key is a legacy/original beamId, dynamically map and fallback.
   */
  public getBeamConfig(key: string): BeamFamily | undefined {
    if (!key) return undefined;
    
    if (this.registry.has(key)) {
      return this.registry.get(key);
    }

    if (BEAM_DATABASE[key]) {
      const baseBeam = BEAM_DATABASE[key];
      if (key.startsWith("CHAVE_") || key.startsWith("CHAVE_BEAM_")) {
        const configured = this.registerBeam(key, key, baseBeam.name || key, baseBeam);
        return configured;
      }
      // Return standard built-in beams directly without generating config keys or auto-migrating
      return baseBeam;
    }

    return undefined;
  }

  /**
   * Validates the integrity of the data associated with a configuration key
   */
  public validateBeamKey(key: string, requestedBaseId?: string): boolean {
    if (!key) {
      console.error("Validation failed: Beam configuration key is void or empty.");
      return false;
    }
    
    const config = this.getBeamConfig(key) as ConfiguredBeam;
    if (!config) {
      console.error(`Validation failed: Key '${key}' not found in registry.`);
      return false;
    }

    // Check if middle sprite information exists
    if (!config.middle || !config.middle.imageUrl) {
      console.error(`Validation failed: Config data middle segment unavailable or incomplete for Key '${key}'.`);
      return false;
    }

    // If requestedBaseId is provided, verify match
    if (requestedBaseId) {
      const parentId = config.baseBeamId || requestedBaseId;
      const expectedPrefix = requestedBaseId.replace(/_000\d{3}/g, "").replace(/CHAVE_BEAM_\d+/g, "");
      const actualPrefix = parentId.replace(/_000\d{3}/g, "").replace(/CHAVE_BEAM_\d+/g, "");
      
      const matchesBase = 
        config.baseBeamId === requestedBaseId || 
        key === requestedBaseId || 
        key.startsWith(requestedBaseId) ||
        actualPrefix === expectedPrefix;
        
      if (!matchesBase) {
        console.warn(`Validation warning (cosmetic/base mismatch): Key '${key}' (base: ${config.baseBeamId}) does not correspond to requested beam: '${requestedBaseId}'. Continuing anyway.`);
      }
    }

    return true;
  }

  /**
   * Get all registered configured beams
   */
  public getAllBeams(): Record<string, BeamFamily> {
    const result: Record<string, BeamFamily> = {};
    
    // First yield everything in BEAM_DATABASE
    Object.keys(BEAM_DATABASE).forEach(k => {
      result[k] = BEAM_DATABASE[k];
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
   * that creates a beam has its own unique, exclusive CHAVE_BEAM_xxx configuration.
   */
  public initializeExclusiveKeysForBaseCharacters(characters: any[]) {
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;
      
      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        if (anim && anim.createsBeam && typeof anim.createsBeam === "string") {
          const currentBeamKey = anim.createsBeam;
          
          // Skip if it is of projectile / Ki Blast / Genkidama / Fecho type
          const isProj = currentBeamKey.includes("GENKIDAMA") ||
                         currentBeamKey.includes("KI_BLAST") ||
                         currentBeamKey.includes("PROJETIL") ||
                         currentBeamKey.includes("PROJECTILE") ||
                         currentBeamKey.includes("FECHO");
          if (isProj) {
            return;
          }
          
          if (currentBeamKey.startsWith("CHAVE_") || currentBeamKey.startsWith("CHAVE_BEAM_")) {
            const charOverride = char.beamOverrides?.[currentBeamKey];
            const baseBeam = BEAM_DATABASE[currentBeamKey] || { name: `Beam (${char.name})`, middle: { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 } };
            
            const mergedProperties = {
              ...baseBeam,
              ...charOverride,
              ownerCharacterId: char.id,
              ownerAnimationKey: animKey,
              ownerCharacterName: char.name
            };

            const existing = this.registry.get(currentBeamKey);
            if (existing) {
              // Deep merge logic to make sure static overrides from files take precedence!
              const merged = {
                ...existing,
                ...mergedProperties,
                start: (existing.start || mergedProperties.start) ? {
                  ...existing.start,
                  ...mergedProperties.start
                } : undefined,
                middle: (existing.middle || mergedProperties.middle) ? {
                  ...existing.middle,
                  ...mergedProperties.middle
                } : { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 },
                end: (existing.end || mergedProperties.end) ? {
                  ...existing.end,
                  ...mergedProperties.end
                } : undefined,
              } as ConfiguredBeam;
              this.registry.set(currentBeamKey, merged);
            } else {
              this.registerBeam(currentBeamKey, currentBeamKey, baseBeam.name || `Beam (${char.name} - ${animKey})`, mergedProperties);
            }
          } else {
            // Do NOT automatically migrate standard built-in beams to exclusive CHAVE_BEAM_ keys anymore!
            // This prevents generating unexpected keys like CHAVE_BEAM_048 with Beam 1 configurations out of nowhere.
          }
        }
      });
    });
    this.saveToStorage();
  }

  /**
   * Scans all keys starting with CHAVE_BEAM_ in the registry, and deletes those
   * that are NOT referenced by any animation of any character, and also resolves duplicates.
   */
  public cleanupOrphanedBeams(characters: any[]): number {
    // 1. Remove duplicate custom keys pointing to the same character + animation
    const seenAssignments = new Map<string, string>(); // "charId:animKey" -> key (winner)
    const keysToDeleteSet = new Set<string>();

    const customKeys = Array.from(this.registry.keys())
      .filter(k => k.startsWith("CHAVE_"))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    customKeys.forEach(k => {
      const beam = this.registry.get(k);
      if (beam && beam.ownerCharacterId && beam.ownerAnimationKey) {
        const uniqueString = `${beam.ownerCharacterId}:${beam.ownerAnimationKey}`;
        if (seenAssignments.has(uniqueString)) {
          keysToDeleteSet.add(k);
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
        if (anim && anim.createsBeam) {
          activeKeys.add(anim.createsBeam);
        }
      });
    });

    const initialSize = this.registry.size;

    // Delete duplicate-assigned keys
    keysToDeleteSet.forEach((key) => {
      this.registry.delete(key);
    });

    // Specifically delete keys from CHAVE_BEAM_015 to CHAVE_BEAM_150 (and CHAVE_BEAM_15 to CHAVE_BEAM_150)
    // as well as CHAVE_BEAM_1010 if they are not active (meaning they are unassigned and unconfigured)
    const specificKeysToVerify = ["CHAVE_BEAM_1010"];
    for (let i = 15; i <= 150; i++) {
      specificKeysToVerify.push(`CHAVE_BEAM_${String(i).padStart(3, '0')}`);
      specificKeysToVerify.push(`CHAVE_BEAM_${i}`);
    }

    specificKeysToVerify.forEach((key) => {
      if (!activeKeys.has(key)) {
        this.registry.delete(key);
      }
    });

    // We do NOT aggressively delete custom user-created keys "CHAVE_" anymore to prevent losing user-created library designs!
    // They are preserved in the DB so that they remain accessible in dropdowns and selectors.

    const deletedCount = initialSize - this.registry.size;
    if (deletedCount > 0) {
      this.saveToStorage();
    }
    return deletedCount;
  }

  public deleteBeam(key: string) {
    this.registry.delete(key);
    this.saveToStorage();
  }

  public revertToDefaults() {
    this.registry.clear();
    this.counters.clear();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // Clear legacy storage to prevent conflicts with codebase static configurations
      localStorage.removeItem("EXCLUSIVE_BEAMS_REGISTRY");
    } catch (e) {
      // Ignore
    }
    
    // Ensure all base characters are migrated to exclusive animation keys and clean up orphans
    try {
      this.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
      this.cleanupOrphanedBeams(BASE_CHARACTERS);
    } catch (e) {
      console.error("Failed to initialize exclusive keys for base characters:", e);
    }
  }

  private saveToStorage() {
    // Completely removed local storage persistence to prevent cache sync bugs
  }
}
