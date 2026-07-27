import { BASE_CHARACTERS } from "../personagens/CharacterDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { AuraConfigKeyManager } from "./AuraConfigKeyManager";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export interface SweepResult {
  deletedBeams: string[];
  deletedProjectiles: string[];
  deletedAuras: string[];
  cleanedHitboxesCount: number;
  cleanedVfxCount: number;
}

export class ProjectSweepManager {
  private static instance: ProjectSweepManager;

  private constructor() {}

  public static getInstance(): ProjectSweepManager {
    if (!ProjectSweepManager.instance) {
      ProjectSweepManager.instance = new ProjectSweepManager();
    }
    return ProjectSweepManager.instance;
  }

  /**
   * Performs a comprehensive sweep of the project to identify and permanently delete invalid
   * or unconfigured resources, including Beams, Projectiles, Auras, Hitboxes, and Effects.
   */
  public async runSweep(silent: boolean = false): Promise<SweepResult> {
    const deletedBeams: string[] = [];
    const deletedProjectiles: string[] = [];
    const deletedAuras: string[] = [];
    let cleanedHitboxesCount = 0;
    let cleanedVfxCount = 0;

    // 1. GATHER ALL ACTIVE/REFERENCED KEYS ACROSS BASE CHARACTERS AND THEIR SKINS
    const activeBeams = new Set<string>();
    const activeProjectiles = new Set<string>();
    const activeAuras = new Set<string>();

    BASE_CHARACTERS.forEach((char) => {
      // Base animations
      if (char.spriteConfig?.animations) {
        Object.values(char.spriteConfig.animations).forEach((anim) => {
          if (anim) {
            if (anim.createsBeam) activeBeams.add(anim.createsBeam);
            if (anim.createsBeamUlt) activeBeams.add(anim.createsBeamUlt);
            if (anim.projectileId) activeProjectiles.add(anim.projectileId);
            if (anim.auraConfigKey) activeAuras.add(anim.auraConfigKey);
          }
        });
      }

      // Skins animations
      if (char.skins) {
        char.skins.forEach((skin) => {
          if (skin.spriteConfig?.animations) {
            Object.values(skin.spriteConfig.animations).forEach((anim) => {
              if (anim) {
                if (anim.createsBeam) activeBeams.add(anim.createsBeam);
                if (anim.createsBeamUlt) activeBeams.add(anim.createsBeamUlt);
                if (anim.projectileId) activeProjectiles.add(anim.projectileId);
                if (anim.auraConfigKey) activeAuras.add(anim.auraConfigKey);
              }
            });
          }
        });
      }
    });

    // 2. GATHER REFERENCES FROM SAVED CHARACTER OVERRIDES IN LOCAL STORAGE
    let localData: any = null;
    try {
      const localDataStr = localStorage.getItem("dd2d_char_overrides");
      if (localDataStr) {
        localData = JSON.parse(localDataStr);
        Object.keys(localData).forEach((charId) => {
          const charOverride = localData[charId];
          if (charOverride && charOverride.animations) {
            Object.values(charOverride.animations).forEach((anim: any) => {
              if (anim) {
                if (anim.createsBeam) activeBeams.add(anim.createsBeam);
                if (anim.createsBeamUlt) activeBeams.add(anim.createsBeamUlt);
                if (anim.projectileId) activeProjectiles.add(anim.projectileId);
                if (anim.auraConfigKey) activeAuras.add(anim.auraConfigKey);
              }
            });
          }
        });
      }
    } catch (e) {
      console.error("[ProjectSweepManager] Failed to read active keys from local overrides:", e);
    }

    // 3. GATHER MANUALLY ACTIVE KEYS
    try {
      const manuallyActiveKeysStr = localStorage.getItem("dd2d_manually_active_keys");
      if (manuallyActiveKeysStr) {
        const keys = JSON.parse(manuallyActiveKeysStr);
        if (Array.isArray(keys)) {
          keys.forEach((k) => {
            if (typeof k === "string") {
              if (k.startsWith("CHAVE_BEAM_")) activeBeams.add(k);
              else if (k.startsWith("CHAVE_AURA_")) activeAuras.add(k);
              else activeProjectiles.add(k);
            }
          });
        } else if (typeof keys === "object" && keys !== null) {
          Object.keys(keys).forEach((k) => {
            if (keys[k]) {
              if (k.startsWith("CHAVE_BEAM_")) activeBeams.add(k);
              else if (k.startsWith("CHAVE_AURA_")) activeAuras.add(k);
              else activeProjectiles.add(k);
            }
          });
        }
      }
    } catch (e) {
      console.error("[ProjectSweepManager] Failed to read manually active keys:", e);
    }

    // 4. IDENTIFY AND REMOVE INVALID OR ORPHANED CUSTOM BEAMS
    const beamManager = BeamConfigKeyManager.getInstance();
    const allBeams = beamManager.getAllBeams();

    Object.keys(allBeams).forEach((key) => {
      // Only sweep custom configured resources
      if (key.startsWith("CHAVE_")) {
        const beam = allBeams[key];
        if (!beam) return;
        const isOrphaned = !activeBeams.has(key);
        
        // Invalid criteria:
        // - Missing middle segment animation imageUrl (created but never configured)
        // - Frames <= 0
        // - Empty properties or only default template values
        const isUnconfigured = !beam.middle || !beam.middle.imageUrl || beam.middle.imageUrl.trim() === "";
        const hasInvalidAnim = beam.middle && beam.middle.frames <= 0;
        const isDefaultOnly = beam.name && (beam.name === "Beam 1" || beam.name === "Beam 2") && !beam.color;

        const isInvalid = isUnconfigured || hasInvalidAnim || isDefaultOnly;

        // If the resource has absolutely no real use/reference or is invalid, remove it permanently
        if (isOrphaned || isInvalid) {
          beamManager.deleteBeam(key);
          deletedBeams.push(key);
        }
      }
    });

    // 5. IDENTIFY AND REMOVE INVALID OR ORPHANED CUSTOM PROJECTILES, GENKIDAMAS, & FECHOS
    const projManager = ProjectileConfigKeyManager.getInstance();
    const allProjectiles = projManager.getAllProjectiles();

    Object.keys(allProjectiles).forEach((key) => {
      if (key.startsWith("CHAVE_") || key.includes("PROJETIL_") || key.includes("GENKIDAMA_") || key.includes("FECHO_")) {
        const proj = allProjectiles[key];
        if (!proj) return;
        const isOrphaned = !activeProjectiles.has(key);

        const isUnconfigured = !proj.middle || !proj.middle.imageUrl || proj.middle.imageUrl.trim() === "";
        const hasInvalidAnim = proj.middle && proj.middle.frames <= 0;
        const isDefaultOnly = proj.name && (proj.name.startsWith("Projetil ") || proj.name.startsWith("Custom")) && !proj.color;

        const isInvalid = isUnconfigured || hasInvalidAnim || isDefaultOnly;

        if (isOrphaned || isInvalid) {
          projManager.deleteProjectile(key);
          deletedProjectiles.push(key);
        }
      }
    });

    // 6. IDENTIFY AND REMOVE INVALID OR ORPHANED CUSTOM AURAS
    const auraManager = AuraConfigKeyManager.getInstance();
    const allAuras = auraManager.getAllAuras();

    Object.keys(allAuras).forEach((key) => {
      if (key.startsWith("CHAVE_")) {
        const aura = allAuras[key];
        if (!aura) return;
        
        // Safety check: is it marked as default charging/sparking, or explicitly referenced?
        const isReferencedInChar = Array.from(activeAuras).includes(key) || aura.isDefaultCharging || aura.isDefaultSparking;
        const isOrphaned = !isReferencedInChar;

        const isUnconfigured = !aura.baseAuraId || aura.baseAuraId.trim() === "";
        const isInvalid = isUnconfigured;

        if (isOrphaned || isInvalid) {
          auraManager.deleteAura(key);
          deletedAuras.push(key);
        }
      }
    });

    // 7. CLEAN UP INTERNAL REFERENCES IN LOCAL STORAGE SAVED COPIES
    if (localData) {
      let charOverridesChanged = false;
      Object.keys(localData).forEach((charId) => {
        const charOverride = localData[charId];
        if (charOverride && charOverride.animations) {
          Object.keys(charOverride.animations).forEach((animKey) => {
            const anim = charOverride.animations[animKey];
            if (anim) {
              // Clear orphaned references to deleted Beams
              if (anim.createsBeam && deletedBeams.includes(anim.createsBeam)) {
                anim.createsBeam = undefined;
                charOverridesChanged = true;
              }
              if (anim.createsBeamUlt && deletedBeams.includes(anim.createsBeamUlt)) {
                anim.createsBeamUlt = undefined;
                charOverridesChanged = true;
              }
              // Clear orphaned references to deleted Projectiles
              if (anim.projectileId && deletedProjectiles.includes(anim.projectileId)) {
                anim.projectileId = undefined;
                charOverridesChanged = true;
              }
              // Clear orphaned references to deleted Auras
              if (anim.auraConfigKey && deletedAuras.includes(anim.auraConfigKey)) {
                anim.auraConfigKey = undefined;
                charOverridesChanged = true;
              }

              // 8. CLEAN INVALID OR UNUSED HITBOXES (width <= 0 or height <= 0) IN OVERRIDES
              if (anim.attackBoxes) {
                const initialLen = anim.attackBoxes.length;
                anim.attackBoxes = anim.attackBoxes.filter(
                  (box: any) => box && box.width > 0 && box.height > 0
                );
                if (anim.attackBoxes.length !== initialLen) {
                  cleanedHitboxesCount += initialLen - anim.attackBoxes.length;
                  charOverridesChanged = true;
                }
              }

              // 9. CLEAN INVALID OR UNUSED VISUAL EFFECTS (type === 'VFX') IN OVERRIDES
              if (anim.sceneObjects) {
                const initialLen = anim.sceneObjects.length;
                anim.sceneObjects = anim.sceneObjects.filter((obj: any) => {
                  if (obj && obj.type === "VFX") {
                    const isValid = obj.imageUrl && obj.imageUrl.trim() !== "" && obj.scale > 0;
                    if (!isValid) cleanedVfxCount++;
                    return isValid;
                  }
                  return true;
                });
                if (anim.sceneObjects.length !== initialLen) {
                  charOverridesChanged = true;
                }
              }
            }
          });
        }
      });

      if (charOverridesChanged) {
        try {
          localStorage.setItem("dd2d_char_overrides", JSON.stringify(localData));
        } catch (e) {
          console.error("[ProjectSweepManager] Failed to write updated local overrides:", e);
        }
      }
    }

    // 10. CLEAN IN-MEMORY BASE CHARACTERS' HITBOXES & EFFECTS
    BASE_CHARACTERS.forEach((char) => {
      // Base animations
      if (char.spriteConfig?.animations) {
        Object.keys(char.spriteConfig.animations).forEach((animKey) => {
          const anim = char.spriteConfig.animations[animKey];
          if (anim) {
            // Beams / Projectiles / Auras references
            if (anim.createsBeam && deletedBeams.includes(anim.createsBeam)) anim.createsBeam = undefined;
            if (anim.createsBeamUlt && deletedBeams.includes(anim.createsBeamUlt)) anim.createsBeamUlt = undefined;
            if (anim.projectileId && deletedProjectiles.includes(anim.projectileId)) anim.projectileId = undefined;
            if (anim.auraConfigKey && deletedAuras.includes(anim.auraConfigKey)) anim.auraConfigKey = undefined;

            if (anim.attackBoxes) {
              const initialLen = anim.attackBoxes.length;
              anim.attackBoxes = anim.attackBoxes.filter((box) => box && box.width > 0 && box.height > 0);
              cleanedHitboxesCount += initialLen - anim.attackBoxes.length;
            }
            if (anim.sceneObjects) {
              anim.sceneObjects = anim.sceneObjects.filter((obj) => {
                if (obj && obj.type === "VFX") {
                  const isValid = !!(obj.imageUrl && obj.imageUrl.trim() !== "" && obj.scale > 0);
                  if (!isValid) cleanedVfxCount++;
                  return isValid;
                }
                return true;
              });
            }
          }
        });
      }

      // Skin animations
      if (char.skins) {
        char.skins.forEach((skin) => {
          if (skin.spriteConfig?.animations) {
            Object.keys(skin.spriteConfig.animations).forEach((animKey) => {
              const anim = skin.spriteConfig.animations[animKey];
              if (anim) {
                if (anim.createsBeam && deletedBeams.includes(anim.createsBeam)) anim.createsBeam = undefined;
                if (anim.createsBeamUlt && deletedBeams.includes(anim.createsBeamUlt)) anim.createsBeamUlt = undefined;
                if (anim.projectileId && deletedProjectiles.includes(anim.projectileId)) anim.projectileId = undefined;
                if (anim.auraConfigKey && deletedAuras.includes(anim.auraConfigKey)) anim.auraConfigKey = undefined;

                if (anim.attackBoxes) {
                  const initialLen = anim.attackBoxes.length;
                  anim.attackBoxes = anim.attackBoxes.filter((box) => box && box.width > 0 && box.height > 0);
                  cleanedHitboxesCount += initialLen - anim.attackBoxes.length;
                }
                if (anim.sceneObjects) {
                  anim.sceneObjects = anim.sceneObjects.filter((obj) => {
                    if (obj && obj.type === "VFX") {
                      const isValid = !!(obj.imageUrl && obj.imageUrl.trim() !== "" && obj.scale > 0);
                      if (!isValid) cleanedVfxCount++;
                      return isValid;
                    }
                    return true;
                  });
                }
              }
            });
          }
        });
      }
    });

    // 11. CLEAN AND FILTER "dd2d_manually_active_keys" IN LOCAL STORAGE
    try {
      const manuallyActiveKeysStr = localStorage.getItem("dd2d_manually_active_keys");
      if (manuallyActiveKeysStr) {
        const keys = JSON.parse(manuallyActiveKeysStr);
        if (Array.isArray(keys)) {
          const filteredKeys = keys.filter(
            (k) =>
              !(typeof k === "string" &&
                ((k.startsWith("CHAVE_BEAM_") && deletedBeams.includes(k)) ||
                  (k.startsWith("CHAVE_AURA_") && deletedAuras.includes(k)) ||
                  (deletedProjectiles.includes(k))))
          );
          localStorage.setItem("dd2d_manually_active_keys", JSON.stringify(filteredKeys));
        } else if (typeof keys === "object" && keys !== null) {
          const filteredKeys: Record<string, boolean> = {};
          Object.keys(keys).forEach((k) => {
            const isDeleted =
              (k.startsWith("CHAVE_BEAM_") && deletedBeams.includes(k)) ||
              (k.startsWith("CHAVE_AURA_") && deletedAuras.includes(k)) ||
              (deletedProjectiles.includes(k));
            if (!isDeleted) {
              filteredKeys[k] = keys[k];
            }
          });
          localStorage.setItem("dd2d_manually_active_keys", JSON.stringify(filteredKeys));
        }
      }
    } catch (e) {
      console.error("[ProjectSweepManager] Failed to clean dd2d_manually_active_keys:", e);
    }

    // 12. SYNC SILENTLY TO FIRESTORE IF ONLINE MODE IS ACTIVE
    try {
      const isOfflineStr = localStorage.getItem("dd2d_offline_mode");
      const isOffline = isOfflineStr === "true";
      if (!isOffline && localData) {
        // Iterate and upload character overrides
        for (const charId of Object.keys(localData)) {
          const charOverride = localData[charId];
          const docRef = doc(db, "character_overrides", charId);
          await setDoc(docRef, charOverride, { merge: true }).catch((err) => {
            console.error(`[ProjectSweepManager] Firebase save error for character ${charId}:`, err);
          });
        }
      }
    } catch (e) {
      console.error("[ProjectSweepManager] Failed to sync to Firestore:", e);
    }

    if (!silent) {
      console.log("[ProjectSweepManager] Sweep complete!", {
        deletedBeams,
        deletedProjectiles,
        deletedAuras,
        cleanedHitboxesCount,
        cleanedVfxCount,
      });
    }

    return {
      deletedBeams,
      deletedProjectiles,
      deletedAuras,
      cleanedHitboxesCount,
      cleanedVfxCount,
    };
  }
}
