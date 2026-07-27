import { PlayerState, SpriteConfig } from "../types";

export function resolveAnimationKey(
  characterId: string,
  state: PlayerState,
  comboType?: string,
  comboStep?: number,
  ataque?: boolean,
  ultPhase?: number,
  nextTransformId?: string,
  attackTimer?: number,
  ultType: number = 1,
  isGrounded: boolean = true,
  isDetransforming: boolean = false,
  isKOTag: boolean = false,
  config?: SpriteConfig,
  wasCrouching: boolean = false,
  stunTimer: number = 0,
  superDashPhase?: number,
  animFinished?: boolean,
  customSubphase?: number,
  phasedMoveAnim?: string,
  lastState?: PlayerState
): string {
  // 0. Phased Move Logic (Highest Priority)
  if (phasedMoveAnim) {
    return phasedMoveAnim;
  }

  // 1. Global Modular Hit and Recovery System (Higher Priority than specific character logic)
  const isHitState = [
    PlayerState.HIT, PlayerState.HIT_2, PlayerState.HIT_3, 
    PlayerState.STUNNED, PlayerState.FALLING_HIT, PlayerState.FALLING_HIT_GROUND,
    PlayerState.LAUNCHED, PlayerState.KNOCKED_DOWN, PlayerState.GRABBED,
    PlayerState.GROUND_RECOVERY, PlayerState.AIR_RECOVERY
  ].includes(state);

  if (isHitState && config?.animations) {
    const anims = config.animations;
    
    // Hit Air: used when character receives damage in the air
    if (!isGrounded && state === PlayerState.HIT && (anims["HIT_AIR"] || anims["hit_air"])) {
      return anims["HIT_AIR"] ? "HIT_AIR" : "hit_air";
    }

    // Hit Air Fall: applied when character is launched towards the ground
    if (state === PlayerState.FALLING_HIT && (anims["HIT_AIR_FALL"] || anims["hit_air_fall"])) {
      return anims["HIT_AIR_FALL"] ? "HIT_AIR_FALL" : "hit_air_fall";
    }

    // Hit Bounce: when the hit launches the character up (or general bounce)
    if (state === PlayerState.LAUNCHED && (anims["HIT_BOUNCE"] || anims["hit_bounce"])) {
      return anims["HIT_BOUNCE"] ? "HIT_BOUNCE" : "hit_bounce";
    }

    // Hit Grab: when character is grabbed
    if ((state === PlayerState.GRABBED || state === PlayerState.HIT_GRAB) && (anims["HIT_GRAB"] || anims["hit_grab"])) {
      return anims["HIT_GRAB"] ? "HIT_GRAB" : "hit_grab";
    }

    // Hit Ground Crash: initial impact with ground
    if (state === PlayerState.FALLING_HIT_GROUND && (anims["HIT_GROUND_CRASH"] || anims["hit_ground_crash"])) {
      return anims["HIT_GROUND_CRASH"] ? "HIT_GROUND_CRASH" : "hit_ground_crash";
    }

    // Hit Ground Stunned: lying on ground after knockdown
    if (state === PlayerState.KNOCKED_DOWN && (anims["HIT_GROUND_STUNNED"] || anims["hit_ground_stunned"] || anims["HIT_GROUND_STUN"] || anims["hit_ground_stun"])) {
      if (anims["HIT_GROUND_STUNNED"]) return "HIT_GROUND_STUNNED";
      if (anims["hit_ground_stunned"]) return "hit_ground_stunned";
      if (anims["HIT_GROUND_STUN"]) return "HIT_GROUND_STUN";
      return "hit_ground_stun";
    }

    // Hit Ground Recoveries (Phases)
    if (state === PlayerState.GROUND_RECOVERY || (state === PlayerState.KNOCKED_DOWN && stunTimer < 40)) {
      if (stunTimer > 30) {
        if (anims["HIT_GROUND_RECOVER"] || anims["hit_ground_recover"]) 
          return anims["HIT_GROUND_RECOVER"] ? "HIT_GROUND_RECOVER" : "hit_ground_recover";
      } else if (stunTimer > 15) {
        if (anims["HIT_GROUND_PUSH_UP"] || anims["hit_ground_push_up"]) 
          return anims["HIT_GROUND_PUSH_UP"] ? "HIT_GROUND_PUSH_UP" : "hit_ground_push_up";
      } else {
        if (anims["HIT_GROUND_LAUNCH"] || anims["hit_ground_launch"] || anims["hit_launch"]) {
          if (anims["HIT_GROUND_LAUNCH"]) return "HIT_GROUND_LAUNCH";
          if (anims["hit_ground_launch"]) return "hit_ground_launch";
          return "hit_launch";
        }
      }
    }

    // Hit Ground Launch: recovery phase suspended in air
    if (state === PlayerState.AIR_RECOVERY && (anims["HIT_GROUND_LAUNCH"] || anims["hit_ground_launch"] || anims["hit_launch"])) {
      if (anims["HIT_GROUND_LAUNCH"]) return "HIT_GROUND_LAUNCH";
      if (anims["hit_ground_launch"]) return "hit_ground_launch";
      return "hit_launch";
    }
  }

  // Rule: Default animation key should match the character state name
  let animKey = state as string;

  // 0. Character-Specific Hit/Recovery Logic (Optional Overrides)
  if (characterId === "broly_ikari" && comboType === "LIGHT" && comboStep === 2 && ataque) {
    const sub = customSubphase || 1;
    return `ATTACK_LIGHT_3_${sub}`;
  }
  // Only apply complex logic if character config doesn't have the direct state key
  if (state === PlayerState.FALLING && animFinished && config?.animations?.["FALLING_LOOP"]) {
    return "FALLING_LOOP";
  }

  const wasInHitState = lastState === PlayerState.HIT || 
                         lastState === PlayerState.HIT_2 || 
                         lastState === PlayerState.HIT_3 || 
                         lastState === PlayerState.STUNNED || 
                         lastState === PlayerState.FALLING_HIT || 
                         lastState === PlayerState.LAUNCHED;

  if (state === PlayerState.LANDING && config?.animations?.["LANDING_FALL"] && wasInHitState) {
    // If we land while having a certain downward velocity or coming from a high fall
    return "LANDING_FALL";
  }

  if (state === PlayerState.KNOCKED_DOWN || state === PlayerState.GROUND_RECOVERY) {
    if (stunTimer > 30 && config?.animations?.["GET_UP_START"]) return "GET_UP_START";
    if (stunTimer > 15 && config?.animations?.["GET_UP_MIDDLE"]) return "GET_UP_MIDDLE";
    if (config?.animations?.["GET_UP_END"]) return "GET_UP_END";
  }

  if (characterId.startsWith("goku_")) {
    if (
      state === PlayerState.HIT ||
      state === PlayerState.HIT_2 ||
      state === PlayerState.HIT_3 ||
      state === PlayerState.STUNNED ||
      state === PlayerState.GUARD_BREAK ||
      state === PlayerState.FALLING_HIT ||
      state === PlayerState.FALLING_HIT_GROUND ||
      state === PlayerState.LAUNCHED ||
      state === PlayerState.KNOCKED_DOWN ||
      state === PlayerState.DEFEAT ||
      state === PlayerState.GROUND_RECOVERY ||
      state === PlayerState.AIR_RECOVERY ||
      state === PlayerState.GRABBED
    ) {
      if (!isGrounded) {
        if (state === PlayerState.FALLING_HIT) {
           return config?.animations?.["FALLING_HIT"] ? "FALLING_HIT" : "AIR_HIT";
        }
        if (state === PlayerState.FALLING_HIT_GROUND) return "GROUND_BOUNCE";
        if (state === PlayerState.LAUNCHED) return "LAUNCHED";
        if (stunTimer > 0 && stunTimer <= 15) return "GET_UP_AIR";
        return "AIR_HIT";
      } else {
        if (state === PlayerState.LAUNCHED) return "GROUND_LAUNCH";
        if (state === PlayerState.KNOCKED_DOWN) {
          if (stunTimer > 30) return "DOWN_LYING_DOWN";
          if (stunTimer > 20) return "GET_UP_START";
          if (stunTimer > 10) return "GET_UP_MIDDLE";
          return "GET_UP_END";
        }
        if (state === PlayerState.DEFEAT) return "DOWN_LYING_DOWN";
        if (state === PlayerState.FALLING_HIT_GROUND) return "GROUND_BOUNCE";
        if (state === PlayerState.GRABBED) return "GRABBED";

        if (wasCrouching) {
          if (state === PlayerState.HIT_3) return "HIT_LOW_HARD";
          if (state === PlayerState.HIT_2) return "HIT_LOW_LIGHT";
          return "CROUCH_HIT";
        } else {
          if (state === PlayerState.HIT_3 || state === PlayerState.GUARD_BREAK) return "HIT_HIGH_HARD";
          if (state === PlayerState.HIT_2) return "HIT_HIGH_MEDIUM";
          return "HIT_HIGH_LIGHT";
        }
      }
    }
  }

  // 1. Direct State Pattern Resolution
  if (state === PlayerState.MUI_DODGE) return "INSTINTO";
  if (state === PlayerState.VANISH || state === PlayerState.VANISH_APPEAR) return "TELEPORTE";
  
  if (state === PlayerState.SUPER_DASH) {
    // Try phase specific names first
    const currentPhase = superDashPhase ?? ((attackTimer || 0) > 0 ? 1 : 2);
    const keys = [`SUPER_DASH_${currentPhase}`, `super_dash_${currentPhase}`, `SUPER_DASH`, `super_dash` ];
    for (const k of keys) if (config?.animations?.[k]) return k;
    return animKey;
  }

  // Hit Aliases (Handle transition between hit_high_light and dano_1 etc)
  if (state === PlayerState.HIT || state === PlayerState.HIT_2 || state === PlayerState.HIT_3) {
    if (!config?.animations?.[animKey]) {
       const hitNum = state === PlayerState.HIT ? "1" : (state === PlayerState.HIT_2 ? "2" : "3");
       const aliases = [`dano_${hitNum}`, `HIT_${hitNum}`, `hit_${hitNum}`, `DANO_${hitNum}`];
       for (const a of aliases) if (config?.animations?.[a]) return a;
    }
  }

  if (state === PlayerState.DRAGON_RUSH) {
    const keys = ["dragon_rush_1", "DRAGON_RUSH_1", PlayerState.DRAGON_RUSH];
    for (const k of keys) if (config?.animations?.[k]) return k;
    return "dragon_rush_1";
  }

  if (state === PlayerState.DRAGON_COMBO) {
    if (comboStep === 1) {
      // Phase 3: Final Strike/Pose. Use dragon_rush_3.
      const keys = ["dragon_rush_3", "DRAGON_RUSH_3", PlayerState.DRAGON_COMBO];
      for (const k of keys) if (config?.animations?.[k]) return k;
      return "dragon_rush_3";
    }
    if (comboStep === 0) {
      // Phase 2: Hits. Use dragon_rush_2.
      const keys = ["dragon_rush_2", "DRAGON_RUSH_2", PlayerState.DRAGON_COMBO];
      for (const k of keys) if (config?.animations?.[k]) return k;
      return "dragon_rush_2";
    }
    // Fallback for transitions (step 2, 3 etc) or initial phase
    const keys = ["dragon_rush_1", "DRAGON_RUSH_1", PlayerState.DRAGON_COMBO];
    for (const k of keys) if (config?.animations?.[k]) return k;
    return "dragon_rush_1";
  }

  if (state === PlayerState.DRAGON_DASH_FOLLOW) {
    // Phase 4: Suspension after teleport. Return to ready pose (dragon_rush_1).
    const keys = ["dragon_rush_1", "DRAGON_RUSH_1", PlayerState.DRAGON_DASH_FOLLOW];
    for (const k of keys) if (config?.animations?.[k]) return k;
    return "dragon_rush_1";
  }

  if (isKOTag) return "TAG_IN_KO";
  
  if (state === PlayerState.TAG_IN) {
    const keys = ["SUPER_DASH_2", "super_dash_2", "SUPER_DASH", "super_dash"];
    for (const k of keys) if (config?.animations?.[k]) return k;
  }

  // 2. Intro Resolution
  if (state === PlayerState.INTRO) {
    const step = ultPhase || 1;
    const key = `INTRO_${step}`;
    if (config?.animations?.[key]) return key;
    if (config?.animations?.[key.toLowerCase()]) return key.toLowerCase();
    return PlayerState.INTRO;
  }

  // 3. Transformation Resolution
  if (state === PlayerState.TRANSFORM || state === PlayerState.DETRANSFORM || state === PlayerState.DEFUSION) {
    if (isDetransforming || state === PlayerState.DETRANSFORM || state === PlayerState.DEFUSION) {
      return config?.animations?.["DETRANSFORM"] ? "DETRANSFORM" : "DETRANSFORM_1";
    }
    if (nextTransformId) {
      const transformKey = `TRANSFORM_${nextTransformId.toUpperCase()}_${(comboStep || 0) + 1}`;
      if (config?.animations?.[transformKey]) return transformKey;
      const simpleTransform = `TRANSFORM_${nextTransformId.toUpperCase()}`;
      if (config?.animations?.[simpleTransform]) return simpleTransform;
    }
    return state as string;
  }

  // 4. Attack Resolution
  if (ataque) {
    // Specials
    if (comboType === "SPECIAL" || comboType?.startsWith("SPECIAL_") || (comboType as any)?.startsWith("SPECIAL")) {
      const num = comboType === "SPECIAL" ? 1 : parseInt(comboType.split("_")[1]);
      const stepNum = (comboStep || 0) + 1;
      
      const key = characterId === "goku_mui" ? `SPECIAL_${num}_${stepNum}` : `Especial_${num}_${stepNum}`;
      if (!isGrounded) {
        const arPatterns = [`${key}_Ar`, `${key}_ar`, `${key}_AIR`];
        for (const p of arPatterns) if (config?.animations?.[p]) return p;
      }
      if (config?.animations?.[key]) return key;
      const altKey = key.toUpperCase();
      if (config?.animations?.[altKey]) return altKey;
      return key;
    }

    // Ki Blast
    if (comboType === "KI_BLAST") {
      const step = (comboStep || 0) + 1;
      const prefix = isGrounded ? "KI_BLAST" : "KI_BLAST_AR";
      const key = `${prefix}_${step}`;
      if (config?.animations?.[key]) return key;
      if (config?.animations?.[prefix]) return prefix;
      return "ATTACK_KI_BLAST";
    }

    // Basic Attacks
    if (state === PlayerState.JUMP_ATTACK) {
      const step = (comboStep || 0) + 1;
      const directKey = `ATTACK_AIR_${comboType}`;
      if (config?.animations?.[directKey]) return directKey;
      const jumpKey = `ATTACK_JUMP_${comboType}`;
      if (config?.animations?.[jumpKey]) return jumpKey;

      if (comboType === "LIGHT" || comboType === "MEDIUM") {
        const totalStep = comboType === "LIGHT" ? step : step + 3;
        const arKey = `Combo_Ar_${totalStep}`;
        if (config?.animations?.[arKey]) return arKey;
      }
      
      const altKey = `Combo_Ar_1`;
      if (config?.animations?.[altKey]) return altKey;
      return jumpKey;
    }

    if (state === PlayerState.CROUCH_ATTACK) {
      const step = (comboStep || 0) + 1;
      const exactSeqKey = `ATTACK_CROUCH_${comboType}_${step}_1`;
      if (config?.animations?.[exactSeqKey]) return exactSeqKey;
      const key = `ATTACK_CROUCH_${comboType}_${Math.min(6, step)}`;
      if (config?.animations?.[key]) return key;
      const seq1Key = `ATTACK_CROUCH_${comboType}_1_1`;
      if (config?.animations?.[seq1Key]) return seq1Key;
      const step1Key = `ATTACK_CROUCH_${comboType}_1`;
      if (config?.animations?.[step1Key]) return step1Key;
      const fallbackKey = `ATTACK_CROUCH_${comboType}`;
      if (config?.animations?.[fallbackKey]) return fallbackKey;
      return key;
    }

    if (state === PlayerState.ATTACKING) {
      const step = (comboStep || 0) + 1;
      const exactSeqKey = `ATTACK_${comboType}_${step}_1`;
      if (config?.animations?.[exactSeqKey]) return exactSeqKey;
      const key = `ATTACK_${comboType}_${Math.min(6, step)}`;
      if (config?.animations?.[key]) return key;
      const seq1Key = `ATTACK_${comboType}_1_1`;
      if (config?.animations?.[seq1Key]) return seq1Key;
      const step1Key = `ATTACK_${comboType}_1`;
      if (config?.animations?.[step1Key]) return step1Key;
      const fallbackKey = `ATTACK_${comboType}`;
      if (config?.animations?.[fallbackKey]) return fallbackKey;
      return key;
    }
  }

  // 5. Ultimate Resolution
  if (state === PlayerState.ULTIMATE || state === PlayerState.ULTIMATE_2 || comboType?.startsWith("ULTIMATE")) {
    const typeNumStr = comboType?.match(/ULTIMATE_(\d+)/)?.[1] || (state === PlayerState.ULTIMATE_2 ? "2" : "1");
    const typeNum = ultType || parseInt(typeNumStr);
    const phaseNum = ultPhase || ((comboStep || 0) + 1);

    const patterns = [
      `ULTIMATE_${typeNum}_${phaseNum}`,
      `Ultimate_${typeNum}_${phaseNum}`,
      `Ultimate_Parte${typeNum}_${phaseNum}`,
      `ULTIMATE_${typeNum}`,
      `Ultimate_${typeNum}`
    ];
    for (const p of patterns) if (config?.animations?.[p]) return p;
    return `ULTIMATE_${typeNum}_1`;
  }

  // 6. Generic Fallback: Try state name, then uppercase, then lowercase
  if (config?.animations?.[animKey]) return animKey;
  if (config?.animations?.[animKey.toUpperCase()]) return animKey.toUpperCase();
  if (config?.animations?.[animKey.toLowerCase()]) return animKey.toLowerCase();

  return animKey;
}

