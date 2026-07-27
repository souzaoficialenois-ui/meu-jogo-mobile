import { PROJECTILE_DATABASE, ProjectileFamily } from "../constants/ProjectileDatabase";
import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";

export interface ConfiguredProjectile extends ProjectileFamily {
  configKey: string;
  baseProjectileId: string;
  ownerCharacterId?: string;
  ownerAnimationKey?: string;
  ownerCharacterName?: string;
}

export class ProjectileConfigKeyManager {
  private static instance: ProjectileConfigKeyManager;
  private registry: Map<string, ConfiguredProjectile> = new Map();
  private counters: Map<string, number> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ProjectileConfigKeyManager {
    if (!ProjectileConfigKeyManager.instance) {
      ProjectileConfigKeyManager.instance = new ProjectileConfigKeyManager();
    }
    return ProjectileConfigKeyManager.instance;
  }

  private normalizePrefix(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")      // replace symbols with underscores
      .replace(/__+/g, "_")            // combine duplicates
      .replace(/^_+|_+$/g, "");        // trim extremities
  }

  /**
   * Generates a new unique configuration key for a projectile family
   * Format: PROJETIL_1_0001, KI_BLAST_1_0001, etc.
   */
  public generateKey(baseProjectileId?: string, customName?: string): string {
    let rawPrefix = "PROJETIL_1";
    if (customName) {
      rawPrefix = this.normalizePrefix(customName);
    } else if (baseProjectileId) {
      const baseObj = PROJECTILE_DATABASE[baseProjectileId];
      if (baseObj && baseObj.name) {
        rawPrefix = this.normalizePrefix(baseObj.name);
      } else {
        rawPrefix = this.normalizePrefix(baseProjectileId);
      }
    }

    const prefix = rawPrefix;
    let count = (this.counters.get(prefix) || 0) + 1;
    this.counters.set(prefix, count);

    let paddedCount = String(count).padStart(4, '0');
    let key = `${prefix}_${paddedCount}`;

    while (this.registry.has(key)) {
      count++;
      this.counters.set(prefix, count);
      key = `${prefix}_${String(count).padStart(4, '0')}`;
    }
    return key;
  }

  /**
   * Generates a new unique configuration key exclusively for a character animation
   */
  public generateUniqueKeyForAnimation(charId: string, animKey: string, baseProjectileId: string): string {
    return this.generateKey(baseProjectileId);
  }

  public generateNextSequentialProjectileKey(): string {
    let maxIdx = 0;
    const scanKey = (key: string) => {
      let match = key.match(/^CHAVE_PROJETIL_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      let legacyMatch = key.match(/^(?:CHAVE_PROJ_|PROJETIL_)(?:\d+_)?0*(\d+)$/);
      if (legacyMatch) {
        const idx = parseInt(legacyMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(PROJECTILE_DATABASE).forEach(key => scanKey(key));

    return `CHAVE_PROJETIL_${maxIdx + 1}`;
  }

  public generateNextSequentialGenkidamaKey(): string {
    let maxIdx = 0;
    const scanKey = (key: string) => {
      let match = key.match(/^CHAVE_GENKIDAMA_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      let legacyMatch = key.match(/^GENKIDAMA_(\d+)$/);
      if (legacyMatch) {
        const idx = parseInt(legacyMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(PROJECTILE_DATABASE).forEach(key => scanKey(key));

    return `CHAVE_GENKIDAMA_${maxIdx + 1}`;
  }

  public generateNextSequentialFechoKey(): string {
    let maxIdx = 0;
    const scanKey = (key: string) => {
      let match = key.match(/^CHAVE_FECHO_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
      let legacyMatch = key.match(/^(?:FECHO_DE_ENERGIA_|FECHO_)(\d+)$/);
      if (legacyMatch) {
        const idx = parseInt(legacyMatch[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    };

    this.registry.forEach((_, key) => scanKey(key));
    Object.keys(PROJECTILE_DATABASE).forEach(key => scanKey(key));

    return `CHAVE_FECHO_${maxIdx + 1}`;
  }

  /**
   * Registers or updates a projectile configuration with its exclusive key
   */
  public registerProjectile(key: string, baseProjectileId: string, name: string, properties: Partial<ProjectileFamily> & { ownerCharacterId?: string; ownerAnimationKey?: string; ownerCharacterName?: string; }): ConfiguredProjectile {
    const defaultBase = PROJECTILE_DATABASE[baseProjectileId] || PROJECTILE_DATABASE["PROJETIL_1"] || { id: baseProjectileId, name: baseProjectileId, middle: { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 } };

    const mergedMiddle = (defaultBase.middle || properties.middle) ? {
      ...defaultBase.middle,
      ...properties.middle
    } : { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 };

    const configuredProj: ConfiguredProjectile = {
      ...defaultBase,
      ...properties,
      middle: mergedMiddle,
      id: key, // ID in engine is unique key
      name: name,
      configKey: key,
      baseProjectileId: baseProjectileId,
      ownerCharacterId: properties.ownerCharacterId,
      ownerAnimationKey: properties.ownerAnimationKey,
      ownerCharacterName: properties.ownerCharacterName
    } as ConfiguredProjectile;

    if (properties.ownerCharacterId && properties.ownerAnimationKey) {
      const listToDelete: string[] = [];
      this.registry.forEach((proj) => {
        if (
          proj.ownerCharacterId === properties.ownerCharacterId &&
          proj.ownerAnimationKey === properties.ownerAnimationKey &&
          proj.id !== key
        ) {
          if (!PROJECTILE_DATABASE[proj.id]) {
            listToDelete.push(proj.id);
          } else {
            proj.ownerAnimationKey = undefined;
            proj.ownerCharacterId = undefined;
            proj.ownerCharacterName = undefined;
          }
        }
      });
      listToDelete.forEach(id => this.registry.delete(id));
    }

    this.registry.set(key, configuredProj);
    this.saveToStorage();
    return configuredProj;
  }

  /**
   * Look up configuration for a given key.
   * If key is a legacy/original projectileId, dynamically map and fallback.
   */
  public getProjectileConfig(key: string): ProjectileFamily | undefined {
    if (!key) return undefined;

    let lookupKey = key;
    if (key.startsWith("FECHO_") && !key.startsWith("FECHO_DE_ENERGIA_")) {
      const num = key.replace("FECHO_", "");
      lookupKey = `FECHO_DE_ENERGIA_${num}`;
    }

    if (this.registry.has(lookupKey)) {
      return this.registry.get(lookupKey);
    }

    if (PROJECTILE_DATABASE[lookupKey]) {
      const baseProj = PROJECTILE_DATABASE[lookupKey];
      // Check if this matches a custom registry format
      if (lookupKey.includes("_000") || lookupKey.includes("_001") || lookupKey.includes("_002")) {
        const configured = this.registerProjectile(lookupKey, lookupKey, baseProj.name || lookupKey, baseProj);
        return configured;
      }
      const fallbackKey = this.generateKey(lookupKey);
      const configured = this.registerProjectile(fallbackKey, lookupKey, baseProj.name || lookupKey, baseProj);
      this.registry.set(lookupKey, configured); // Register original key as fallback lookup too
      return configured;
    }

    if (this.registry.has(key)) {
      return this.registry.get(key);
    }

    return undefined;
  }

  /**
   * Retrieves the custom Genkidama key for a specific character if registered
   */
  public getCustomGenkidamaKey(charId: string, baseId: string): string | undefined {
    let found: string | undefined = undefined;
    this.registry.forEach((value, key) => {
      if (value.ownerCharacterId === charId && value.baseProjectileId === baseId) {
        found = key;
      }
    });
    return found;
  }

  /**
   * Validates the integrity of the data associated with a configuration key
   */
  public validateProjectileKey(key: string, requestedBaseId?: string): boolean {
    if (!key) {
      console.error("Validation failed: Projectile configuration key is void or empty.");
      return false;
    }

    const config = this.getProjectileConfig(key) as ConfiguredProjectile;
    if (!config) {
      console.error(`Validation failed: Key '${key}' not found in registry.`);
      return false;
    }

    if (!config.middle || !config.middle.imageUrl) {
      console.error(`Validation failed: Config data middle segment unavailable or incomplete for Key '${key}'.`);
      return false;
    }

    if (requestedBaseId) {
      const parentId = config.baseProjectileId || requestedBaseId;
      const expectedPrefix = requestedBaseId.replace(/_000\d{3}/g, "").replace(/_00\d{2}/g, "");
      const actualPrefix = parentId.replace(/_000\d{3}/g, "").replace(/_00\d{2}/g, "");

      const matchesBase =
        config.baseProjectileId === requestedBaseId ||
        key === requestedBaseId ||
        key.startsWith(requestedBaseId) ||
        actualPrefix === expectedPrefix;

      if (!matchesBase) {
        console.warn(`Validation warning (cosmetic/base mismatch): Key '${key}' (base: ${config.baseProjectileId}) does not correspond to requested base: '${requestedBaseId}'. Continuing anyway.`);
      }
    }

    return true;
  }

  /**
   * Get all registered configured projectiles
   */
  public getAllProjectiles(): Record<string, ProjectileFamily> {
    const result: Record<string, ProjectileFamily> = {};

    Object.keys(PROJECTILE_DATABASE).forEach(k => {
      result[k] = PROJECTILE_DATABASE[k];
    });

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
   * that creates a projectile has its own unique, exclusive CHAVE_PROJ_xxx configuration.
   */
  public initializeExclusiveKeysForBaseCharacters(characters: any[]) {
    characters.forEach((char) => {
      const anims = char.spriteConfig?.animations;
      if (!anims) return;

      // Group all Genkidama animations on the active character under a SINGLE key!
      let genkiKey: string | null = null;
      const genkAnimKeys: string[] = Object.keys(anims).filter(k => {
        const anim = anims[k];
        if (anim && anim.projectileId && anim.projectileId.toString().startsWith("CHAVE_")) {
          return false; // Skip grouping if they are already custom exclusive keys starting with CHAVE_
        }
        return k.toUpperCase().includes("GENKIDAMA") || 
               (k === "Ultimate_2_3" && char.id !== "kuririn") ||
               (anim && anim.projectileId && anim.projectileId.toString().toUpperCase().includes("GENKIDAMA"));
      });
      const hasGenki = genkAnimKeys.length > 0;

      if (hasGenki) {
        let baseId = "GENKIDAMA_1";
        if (char.id === "vegeta_ego") baseId = "GENKIDAMA_2";
        else if (char.id === "goku_black_rose" || char.id === "frieza_final" || char.id === "broly_ikari") baseId = "GENKIDAMA_3";

        // Find if we already have a key registered for this character's Genkidama
        this.registry.forEach((value, key) => {
          if (value.ownerCharacterId === char.id && value.baseProjectileId === baseId) {
            genkiKey = key;
          }
        });

        if (!genkiKey) {
          const parentProj = PROJECTILE_DATABASE[baseId] || { name: "Genkidama", middle: { imageUrl: "", frames: 1, frameWidth: 0, frameHeight: 0 } };
          genkiKey = this.generateKey(baseId, parentProj.name);
          const cleanBaseName = parentProj.name ? parentProj.name.split(" (")[0] : "Genkidama";
          const personalizedName = `${cleanBaseName} (${char.name})`;

          // Ensure any legacy overrides are fully merged!
          const legacyOverrides = char.projectileOverrides?.[baseId] || char.beamOverrides?.[baseId];

          this.registerProjectile(genkiKey, baseId, personalizedName, {
            ...parentProj,
            ...legacyOverrides,
            name: personalizedName,
            ownerCharacterId: char.id,
            ownerAnimationKey: "GENKIDAMA",
            ownerCharacterName: char.name
          });
        }

        // Assign this exact single key as projectileId to all Genkidama phases on the character
        genkAnimKeys.forEach(k => {
          if (anims[k]) {
            anims[k].projectileId = genkiKey!;
          }
        });
      }

      Object.keys(anims).forEach((animKey) => {
        const anim = anims[animKey];
        const isGenkAnim = (
          animKey.toUpperCase().includes("GENKIDAMA") || 
          (animKey === "Ultimate_2_3" && char.id !== "kuririn") ||
          (anim && anim.projectileId && anim.projectileId.toString().toUpperCase().includes("GENKIDAMA"))
        ) && !(anim && anim.projectileId && anim.projectileId.toString().startsWith("CHAVE_"));
        if (isGenkAnim) return; // Genkidama animations are completely handled and grouped above!

        if (anim) {
          if (anim.createsBeam && typeof anim.createsBeam === "string" && (
              anim.createsBeam.includes("GENKIDAMA") ||
              anim.createsBeam.includes("KI_BLAST") ||
              anim.createsBeam.includes("PROJETIL") ||
              anim.createsBeam.includes("PROJECTILE") ||
              anim.createsBeam.includes("FECHO")
          )) {
            anim.projectileId = anim.createsBeam;
            delete anim.createsBeam;
          }

          if (anim.projectileId && typeof anim.projectileId === "string") {
            const currentProjKey = anim.projectileId;

            const isExcl = currentProjKey.startsWith("CHAVE_") || currentProjKey.includes("_000") || currentProjKey.includes("_001") || currentProjKey.includes("_002") || currentProjKey.match(/_\d{3,4}$/) !== null || currentProjKey.startsWith("CHAVE_PROJ_");
            if (isExcl) {
              const charOverride = char.projectileOverrides?.[currentProjKey] || char.beamOverrides?.[currentProjKey];
              const baseProj = PROJECTILE_DATABASE[currentProjKey] || { name: `Projectile (${char.name})`, middle: { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 } };

              const mergedProperties = {
                ...baseProj,
                ...charOverride,
                ownerCharacterId: char.id,
                ownerAnimationKey: animKey,
                ownerCharacterName: char.name
              };

              const existing = this.registry.get(currentProjKey);
              if (existing) {
                const merged = {
                  ...existing,
                  ...mergedProperties,
                  middle: (existing.middle || mergedProperties.middle) ? {
                    ...existing.middle,
                    ...mergedProperties.middle
                  } : { imageUrl: '', frames: 1, frameWidth: 0, frameHeight: 0 },
                } as ConfiguredProjectile;
                this.registry.set(currentProjKey, merged);
              } else {
                this.registerProjectile(currentProjKey, currentProjKey, baseProj.name || `Proj (${char.name} - ${animKey})`, mergedProperties);
              }
            } else {
              let foundExistingKey: string | null = null;
              this.registry.forEach((value, key) => {
                if (
                  value.ownerCharacterId === char.id &&
                  value.ownerAnimationKey === animKey
                ) {
                  foundExistingKey = key;
                }
              });

              let finalKey = foundExistingKey;
              if (!finalKey) {
                const parentProj = (PROJECTILE_DATABASE[currentProjKey] || this.getProjectileConfig(currentProjKey) || { name: "Custom", middle: { imageUrl: "", frames: 1, frameWidth: 0, frameHeight: 0 } }) as any;
                finalKey = this.generateKey(currentProjKey, parentProj.name || currentProjKey);
                const cleanBaseName = parentProj.name ? parentProj.name.split(" (")[0] : currentProjKey.replace(/_/g, " ");
                const personalizedName = `${cleanBaseName} (${char.name} - ${animKey.replace(/_/g, " ")})`;

                // Merge legacy configurations so they are correctly migrated to the new key!
                const legacyOverrides = char.projectileOverrides?.[currentProjKey] || char.beamOverrides?.[currentProjKey];

                this.registerProjectile(finalKey, currentProjKey, personalizedName, {
                  ...parentProj,
                  ...legacyOverrides,
                  name: personalizedName,
                  ownerCharacterId: char.id,
                  ownerAnimationKey: animKey,
                  ownerCharacterName: char.name
                });
              }

              anim.projectileId = finalKey;
            }
          }
        }
      });
    });
    this.saveToStorage();
  }

  /**
   * Scans all keys in the registry, and deletes duplicate keys sharing the same animation,
   * plus those that are NOT referenced by any animation of any character.
   */
  public cleanupOrphanedProjectiles(characters: any[]): number {
    // 1. Remove duplicate custom keys pointing to the same character + animation
    const seenAssignments = new Map<string, string>(); // "charId:animKey" -> key (winner)
    const keysToDeleteSet = new Set<string>();

    const customKeys = Array.from(this.registry.keys())
      .filter(k => k.match(/_\d{3,4}$/) || !PROJECTILE_DATABASE[k])
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    customKeys.forEach(k => {
      const proj = this.registry.get(k);
      if (proj && proj.ownerCharacterId && proj.ownerAnimationKey) {
        const uniqueString = `${proj.ownerCharacterId}:${proj.ownerAnimationKey}`;
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
        if (anim && anim.projectileId) {
          activeKeys.add(anim.projectileId);
        }
      });
    });

    const initialSize = this.registry.size;

    // Delete duplicate-assigned keys
    keysToDeleteSet.forEach((key) => {
      this.registry.delete(key);
    });

    // We do NOT aggressively delete custom user-created keys anymore to prevent losing user-created library designs!
    // They are preserved in the DB so that they remain accessible in dropdowns and selectors.

    const deletedCount = initialSize - this.registry.size;
    if (deletedCount > 0) {
      this.saveToStorage();
    }
    return deletedCount;
  }

  public deleteProjectile(key: string) {
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
      localStorage.removeItem("EXCLUSIVE_PROJECTILES_REGISTRY");
    } catch (e) {
      // Ignore
    }

    try {
      this.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
      this.cleanupOrphanedProjectiles(BASE_CHARACTERS);
    } catch (e) {
      console.error("Failed to initialize exclusive projectile keys for base characters:", e);
    }
  }

  private saveToStorage() {
    // Completely removed local storage persistence to prevent cache sync bugs
  }
}
