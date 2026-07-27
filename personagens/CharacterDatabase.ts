
import { CharacterData, RarityTier } from '../types';
import { SPRITE_DB, DEFAULT_SPRITE_SET } from '../constants/SpriteDatabase';
import { GokuBase } from './GokuBase';
import { GokuMUI } from './GokuMUI';
import { FriezaFinal } from './Frieza';
import { Kuririn } from './Kuririn';
import { BrolyIkari } from './BrolyIkari';
import { GogetaSSJ4 } from './GogetaSSJ4';
import { GokuSSJ } from './GokuSSJ';
import { GokuBlue } from './GokuBlue';
import { TeenGohanSSJ2 } from './TeenGohanSSJ2';
import { TrunksSSJ2 } from './TrunksSSJ2';
import { VegetaSSJMajin } from './VegetaSSJMajin';

import { CHARACTER_FAMILIES, BASE_ROSTER_IDS } from '../src/constants/CharacterFamilies';
export { CHARACTER_FAMILIES, BASE_ROSTER_IDS };

export const BASE_CHARACTERS: CharacterData[] = [
  GokuBase,
  GokuMUI,
  FriezaFinal,
  Kuririn,
  BrolyIkari,
  GogetaSSJ4,
  GokuSSJ,
  GokuBlue,
  TeenGohanSSJ2,
  TrunksSSJ2,
  VegetaSSJMajin,
];

export const CHARACTER_STAT_OVERRIDES: Record<string, { rarity: RarityTier; maxHp: number; stats: { attack: number; speed: number; defense: number } }> = {
  'goku_base': { rarity: 'COMMON', maxHp: 1950, stats: { attack: 8, speed: 9, defense: 8 } },
  'goku_mui': { rarity: 'ETERNAL', maxHp: 5000, stats: { attack: 20, speed: 20, defense: 19 } },
  'broly_ikari': { rarity: 'EPIC', maxHp: 3950, stats: { attack: 17, speed: 14, defense: 18 } },
  'frieza_final': { rarity: 'RARE', maxHp: 3850, stats: { attack: 16, speed: 18, defense: 15 } },
  'kuririn': { rarity: 'COMMON', maxHp: 3500, stats: { attack: 9, speed: 12, defense: 9 } },
  'gogeta_ssj4': { rarity: 'LEGENDARY', maxHp: 4500, stats: { attack: 18, speed: 15, defense: 17 } },
  'goku_ssj': { rarity: 'RARE', maxHp: 3200, stats: { attack: 12, speed: 12, defense: 10 } },
  'goku_blue': { rarity: 'LEGENDARY', maxHp: 4200, stats: { attack: 15, speed: 15, defense: 12 } },
  'teen_gohan_ssj2': { rarity: 'EPIC', maxHp: 4000, stats: { attack: 16, speed: 16, defense: 13 } },
  'trunks_ssj2': { rarity: 'EPIC', maxHp: 3600, stats: { attack: 13, speed: 14, defense: 12 } },
  'vegeta_ssj_majin': { rarity: 'LEGENDARY', maxHp: 4600, stats: { attack: 18, speed: 16, defense: 15 } },
};

/**
 * Calculates character stats based on their evolution level (1-10).
 * Level 10 represents 100% of the potential defined in CHARACTER_STAT_OVERRIDES.
 * Level 1 represents 60% of that potential.
 */
export function getEvolutionStats(charId: string, level: number): { maxHp: number; stats: { attack: number; speed: number; defense: number } } {
  const levelClamped = Math.max(1, Math.min(10, level));
  const override = CHARACTER_STAT_OVERRIDES[charId];
  
  // Default values if no override exists
  const basePotential = override || {
    rarity: 'COMMON',
    maxHp: 2000,
    stats: { attack: 10, speed: 10, defense: 10 }
  };

  // Linear scaling from 60% at level 1 to 100% at level 10
  // Formula: Base + (Max - Base) * (Level - 1) / 9
  // Where Base = 0.6 * Max
  const factor = 0.6 + (0.4 * (levelClamped - 1) / 9);

  return {
    maxHp: Math.floor(basePotential.maxHp * factor),
    stats: {
      attack: Math.floor(basePotential.stats.attack * factor),
      speed: Math.floor(basePotential.stats.speed * factor),
      defense: Math.floor(basePotential.stats.defense * factor)
    }
  };
}

// Apply Level 1 stats as the default for all base characters
BASE_CHARACTERS.forEach(char => {
  const evoStats = getEvolutionStats(char.id, 1);
  char.evolutionLevel = 1;
  char.availablePoints = 0;
  char.statUpgrades = { hp: 0, attack: 0, defense: 0, speed: 0 };
  char.maxHp = evoStats.maxHp;
  char.stats.attack = evoStats.stats.attack;
  char.stats.speed = evoStats.stats.speed;
  char.stats.defense = evoStats.stats.defense;
  
  const override = CHARACTER_STAT_OVERRIDES[char.id];
  if (override !== undefined) {
    char.rarity = override.rarity;
  }
});


if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
  try {
    const localData = localStorage.getItem("dd2d_char_overrides");
    if (localData) {
      const parsed = JSON.parse(localData);
      BASE_CHARACTERS.forEach(char => {
        if (parsed[char.id]) {
          const overrides = parsed[char.id];
          if (overrides.attack !== undefined) char.stats.attack = overrides.attack;
          if (overrides.defense !== undefined) char.stats.defense = overrides.defense;
          if (overrides.speed !== undefined) char.stats.speed = overrides.speed;
          if (overrides.maxHp !== undefined) char.maxHp = overrides.maxHp;
          if (overrides.animations && char.spriteConfig) {
            const mergedAnims = { ...char.spriteConfig.animations };
            Object.keys(overrides.animations).forEach(key => {
              const fileAnim = char.spriteConfig?.animations?.[key];
              const overrideAnim = overrides.animations[key];
              if (fileAnim && overrideAnim) {
                // If imageUrl is different, the developer updated the source file asset. Prioritize the file!
                if (fileAnim.imageUrl !== overrideAnim.imageUrl) {
                  return; // skip stale override for this key
                }
                // If any key design properties were modified in the source code file, prioritize the code file and skip stale local storage overrides!
                if (
                  fileAnim.frameWidth !== overrideAnim.frameWidth ||
                  fileAnim.frameHeight !== overrideAnim.frameHeight ||
                  fileAnim.frames !== overrideAnim.frames ||
                  fileAnim.speed !== overrideAnim.speed ||
                  fileAnim.scale !== overrideAnim.scale ||
                  fileAnim.centerX !== overrideAnim.centerX ||
                  fileAnim.centerY !== overrideAnim.centerY ||
                  fileAnim.loop !== overrideAnim.loop ||
                  fileAnim.offsetX !== overrideAnim.offsetX ||
                  fileAnim.offsetY !== overrideAnim.offsetY ||
                  fileAnim.zoomType !== overrideAnim.zoomType ||
                  fileAnim.zoomAmount !== overrideAnim.zoomAmount ||
                  fileAnim.cameraFocusX !== overrideAnim.cameraFocusX ||
                  fileAnim.cameraFocusY !== overrideAnim.cameraFocusY ||
                  fileAnim.fullScreen !== overrideAnim.fullScreen
                ) {
                  return; // skip stale override
                }
              }
              mergedAnims[key] = {
                ...mergedAnims[key],
                ...overrideAnim
              };
            });
            char.spriteConfig.animations = mergedAnims;
          }
          if (overrides.beamOverrides) {
            const mergedBeams = { ...char.beamOverrides };
            Object.keys(overrides.beamOverrides).forEach(key => {
              const fileBeam = char.beamOverrides?.[key];
              const overrideBeam = overrides.beamOverrides[key];
              if (fileBeam && overrideBeam) {
                // If any of the start, middle, or end imageUrl properties are different in the file, skip the stale local storage override!
                if (
                  (fileBeam.start?.imageUrl !== overrideBeam.start?.imageUrl) ||
                  (fileBeam.middle?.imageUrl !== overrideBeam.middle?.imageUrl) ||
                  (fileBeam.end?.imageUrl !== overrideBeam.end?.imageUrl)
                ) {
                  return; // skip stale override
                }
              }
              mergedBeams[key] = {
                ...mergedBeams[key],
                ...overrideBeam
              };
            });
            char.beamOverrides = mergedBeams;
          }
          if (overrides.projectileOverrides) {
            const mergedProjectiles = { ...char.projectileOverrides };
            Object.keys(overrides.projectileOverrides).forEach(key => {
              const fileProj = char.projectileOverrides?.[key];
              const overrideProj = overrides.projectileOverrides[key];
              if (fileProj && overrideProj) {
                if (fileProj.middle?.imageUrl !== overrideProj.middle?.imageUrl) {
                  return; // skip stale override
                }
              }
              mergedProjectiles[key] = {
                ...mergedProjectiles[key],
                ...overrideProj
              };
            });
            char.projectileOverrides = mergedProjectiles;
          }
        }
      });
    }
  } catch (e) {
    console.error("Failed to load local character/beam overrides:", e);
  }
}


export const AVATAR_LIST = [
    ...Array.from({ length: 28 }, (_, i) => ({
        id: `avatar_${i + 1}`,
        color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'][i % 5],
        label: (i + 1).toString().padStart(2, '0'),
        url: `/Assets/avatar/retrato/${i + 1}.png`
    })),
    { id: 'avatar_beta_exclusive', color: '#f59e0b', label: 'BETA', url: '/Assets/avatar/retrato/Excluviso_Beta.png' }
];

export const BACKGROUND_LIST = [
    ...Array.from({ length: 11 }, (_, i) => ({
        id: `bg_${i + 1}`,
        url: `/Assets/avatar/fundo/${i + 1}.png`
    })),
    { id: 'bg_beta_pioneer', url: '/Assets/avatar/fundo/Excluviso_Beta.png' }
];
