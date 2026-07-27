import { Vector2, Rect, PlayerState, CharacterData, InputState } from "../types";
import { AudioManager } from "./AudioManager";
import { CharacterStateMachine } from "./CharacterStateMachine";
import {
  MAX_HP,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  WORLD_HEIGHT,
  MAX_GUARD,
  MAX_KI,
  STAT_DMG_MULT,
  STAT_DEF_MULT,
  STAT_SPD_MULT,
  GUARD_REGEN_DELAY,
} from "../constants";

export interface Afterimage {
  data: CharacterData;
  state: PlayerState;
  x: number;
  y: number;
  width: number;
  height: number;
  facingRight: boolean;
  animFrame: number;
  stunTimer: boolean;
  comboType: any;
  comboStep: number;
  ataque: boolean;
  ultPhase: number;
  nextTransformId?: string;
  attackTimer: number;
  ultType: number;
  isGrounded: boolean;
  isDetransforming: boolean;
  opacity: number;
  life: number;
  maxLife: number;
  isKOTag: boolean;
}

export class Player {
  // Logic position (Bottom-Center)
  pos: Vector2 = { x: 0, y: 0 };
  width: number = PLAYER_WIDTH;
  height: number = PLAYER_HEIGHT;
  velocity: Vector2 = { x: 0, y: 0 };
  isGrounded: boolean = false;
  airComboLockout: boolean = false;
  gravityDisabledTimer: number = 0;
  public input: InputState | null = null;

  private _state: PlayerState = PlayerState.INTRO;
  public lastState: PlayerState = PlayerState.INTRO;
  public wasCrouching: boolean = false;
  public lastDamageTick: number = 0;

  get state(): PlayerState {
    return this._state;
  }

  set state(newValue: PlayerState) {
    // Validação da máquina de estados lógicos antes de transicionar o estado físico do jogador
    const fSM = CharacterStateMachine.getInstance();
    const fromLogical = fSM.mapPlayerStateToCharacterState(this);
    const tempPlayer = {
      hp: this.hp,
      state: newValue,
      comboType: this.comboType,
      data: this.data
    } as any as Player;
    const toLogical = fSM.mapPlayerStateToCharacterState(tempPlayer);

    if (!fSM.validateTransition(fromLogical, toLogical)) {
      return;
    }

    const isHitOrStun =
      newValue === PlayerState.HIT ||
      newValue === PlayerState.HIT_2 ||
      newValue === PlayerState.HIT_3 ||
      newValue === PlayerState.STUNNED ||
      newValue === PlayerState.LAUNCHED ||
      newValue === PlayerState.FALLING_HIT;

    if (isHitOrStun) {
      const timeSinceDamage = Date.now() - this.lastDamageTick;
      const alreadyHitOrStun =
        this._state === PlayerState.HIT ||
        this._state === PlayerState.HIT_2 ||
        this._state === PlayerState.HIT_3 ||
        this._state === PlayerState.STUNNED ||
        this._state === PlayerState.LAUNCHED ||
        this._state === PlayerState.FALLING_HIT ||
        this._state === PlayerState.GUARD_BREAK ||
        this._state === PlayerState.KNOCKED_DOWN;

      const allowed = timeSinceDamage < 150 || alreadyHitOrStun || this.guard <= 0;

      if (!allowed) {
        return;
      }
    }

    if (isHitOrStun) {
      if (
        this._state === PlayerState.CROUCH ||
        this._state === PlayerState.BLOCKING_CROUCH
      ) {
        this.wasCrouching = true;
      }
    } else if (
      newValue !== PlayerState.GUARD_BREAK &&
      newValue !== PlayerState.KNOCKED_DOWN &&
      newValue !== PlayerState.DEFEAT
    ) {
      this.wasCrouching = false;
    }

    this.lastState = this._state;
    this._state = newValue;

    if (newValue === PlayerState.SUPER_DASH) {
      this.autoDashUsed = true;
      this.superDashExecuted = true;
      this.superDashHitOpponent = false;
      this.superDashWaitingForGround = false;
      this.superDashPhase = 1;
      this.rotation = 0;
    } else if (this.lastState === PlayerState.SUPER_DASH) {
      this.rotation = 0;
      this.superDashPhase = 0;
      this.superDashActive = false;
    }
  }

  maxHp: number = MAX_HP;
  hp: number = MAX_HP;
  private _guard: number = MAX_GUARD;
  get guard(): number {
    return this._guard;
  }
  set guard(val: number) {
    if (val < this._guard) {
      this.guardRegenTimer = GUARD_REGEN_DELAY;
    }
    this._guard = val;
  }
  private _ki: number = 0;
  private _maxKi: number = MAX_KI;
  teamState: { ki: number; maxKi: number } | null = null;
  onTakeDamage?: (amount: number) => void;
  get ki(): number {
    return this.teamState ? this.teamState.ki : this._ki;
  }
  set ki(val: number) {
    if (this.teamState) this.teamState.ki = val;
    else this._ki = val;
  }
  get maxKi(): number {
    return this.teamState ? this.teamState.maxKi : this._maxKi;
  }
  set maxKi(val: number) {
    if (this.teamState) this.teamState.maxKi = val;
    else this._maxKi = val;
  }
  facingRight: boolean = true;
  attackTimer: number = 0;
  stunTimer: number = 0;
  freezeTimer: number = 0;
  invincibleTimer: number = 0;
  guardRegenTimer: number = 0;
  projectileCooldown: number = 0;
  heavyCooldownTimer: number = 0;
  isTransformed: boolean = false;
  isDetransforming: boolean = false;
  nextTransformId?: string;
  previousFormId?: string;
  baseFormId?: string;
  damageMultiplier: number = 1.0;
  landingDelayTimer: number = 0;
  ataque: boolean = false;
  queuedAttack:
    | "LIGHT"
    | "MEDIUM"
    | "HEAVY"
    | "KI_BLAST"
    | "SPECIAL"
    | "SPECIAL_2"
    | "SPECIAL_3"
    | "SPECIAL_4"
    | "SPECIAL_5"
    | "SPECIAL_6"
    | "SPECIAL_7"
    | "SPECIAL_8"
    | "SPECIAL_9"
    | "SPECIAL_10"
    | null = null;
  queuedAttackTimer: number = 0;
  assistCooldown: number = 0;

  lastAfterimageX: number = 0;
  lastAfterimageY: number = 0;

  jumpsUsed: number = 0;
  blockFrames: number = 0;
  airDashUsed: boolean = false;
  autoDashUsed: boolean = false;
  airComboUsed: boolean = false;
  superDashExecuted: boolean = false;
  superDashHitOpponent: boolean = false;
  superDashWaitingForGround: boolean = false;
  vanishIsHpTeleport: boolean = false;

  // DBFZ Systems
  sparkingTimer: number = 0;
  hasSparked: boolean = false;
  blueHealth: number = 0;
  superDashActive: boolean = false;
  superDashPhase: number = 0;
  superDashTimer: number = 0;
  auraHeightScale: number = 0;
  auraWidthScale: number = 0.3;
  wasChargingKi: boolean = false;
  brokenGroundAlpha: number = 0;
  brokenGroundX: number = 0;
  brokenGroundY: number = 0;
  genkidamaCracks: Array<{ x: number; scale: number; alpha: number; maxLife: number; life: number }> = [];
  auraDissipating: boolean = false;
  auraDissipatingTimer: number = 0;
  wallBounceUsed: boolean = false;
  groundBounceUsed: boolean = false;
  slidingKnockdown: boolean = false;
  dragonRushTimer: number = 0;
  dragonComboTimer: number = 0;
  dragonRushCooldown: number = 0;
  reflectTimer: number = 0;
  rotation: number = 0;

  lastDir: "left" | "right" | null = null;
  lastDirTime: number = 0;
  quickDashTimer: number = 0;
  dashCooldownTimer: number = 0;
  quickDashCooldownTimer: number = 0;
  runTimer: number = 0; // Tracks consecutive frames in RUNNING state
  quickDashDir: "left" | "right" | null = null;

  data: CharacterData;
  specialCancelled: boolean = false;

  attackMult: number = 1.0;
  defenseMult: number = 1.0;
  speedMult: number = 1.0;

  comboType:
    | "NONE"
    | "BURST"
    | "LIGHT"
    | "MEDIUM"
    | "HEAVY"
    | "KI_BLAST"
    | "SPECIAL"
    | "SPECIAL_2"
    | "SPECIAL_3"
    | "SPECIAL_4"
    | "SPECIAL_5"
    | "SPECIAL_6"
    | "SUPER_DASH"
    | "DRAGON_RUSH"
    | "TAG_CLASH" = "NONE";
  comboStep: number = 0;
  comboCount: number = 0;
  comboWindow: number = 0;
  hitReactionPhase: number = 0;
  hasHit: boolean = false;

  ultPhase: number = 0;
  ultTimer: number = 0;
  ultType: number = 1;

  isKOTag: boolean = false;
  lastCombatTick: number = 0;
  regenTimer: number = 0;
  outOfCombatFrames: number = 0;

  // Phased Move System
  currentPhasedMove: string | null = null;
  currentPhaseIndex: number = -1;
  currentPhaseAnim: string | null = null;
  phaseTimer: number = 0;
  phaseFinished: boolean = false;
  phaseHitApplied: boolean = false;

  animFrame: number = 0;
  animTimer: number = 0;
  lastAnimKey: string = "";
  animFinished: boolean = false;
  animDelayActive: boolean = false;
  animDelayTimer: number = 0;
  animDelayTargetKey: string = "";
  animDelayTargetAnimObj: any = null;
  _lastDmgVoiceTime: number = 0;

  playDamageVoice(): void {
    if (!this.data) return;

    const now = Date.now();
    if (now - this._lastDmgVoiceTime < 600) return; // Cooldown of 600ms

    this._lastDmgVoiceTime = now;

    if (
      this.data.id === "goku_ssj" ||
      this.data.id === "goku_blue_gif" ||
      this.data.id === "goku_mui"
    ) {
      const gbase = "/Assets/SONS/DUBLAGEM/GOKU%20BASE";
      const randomIdx = Math.floor(Math.random() * 10) + 1; // 1 to 10
      const voiceUrl = `${gbase}/DANO%20(${randomIdx}).wav`;
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Goku damage voice:", err);
      }
    } else if (this.data.id === "goku_black_rose") {
      const gkrose = "/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE";
      const danoNumbers = [1, 3, 4, 5, 6, 10, 11, 12, 13, 14];
      const randomNum = danoNumbers[Math.floor(Math.random() * danoNumbers.length)];
      const voiceUrl = `${gkrose}/DANO/DANO%20(${randomNum}).wav`;
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Goku Black damage voice:", err);
      }
    } else if (this.data.id === "vegeta_base") {
      const randomIdx = Math.floor(Math.random() * 9) + 1; // 1 to 9
      const voiceUrl = `/Assets/SONS/DUBLAGEM/VEGETA%20BASE/DANO%20(${randomIdx}).wav`.replace(/ /g, "%20");
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Vegeta damage voice:", err);
      }
    } else if (this.data.id === "teen_gohan_ssj2") {
      const files = ["DANO.wav", "DANO (2).wav", "DANO (3).wav", "DANO (4).wav", "DANO (5).wav", "DANO (6).wav", "DANO CONTINUO.wav", "DANO CONTINUO (2).wav"];
      const file = files[Math.floor(Math.random() * files.length)];
      const voiceUrl = `/Assets/SONS/DUBLAGEM/TEEN%20GOHAN%20SSJ2/${file}`.replace(/ /g, "%20");
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Gohan damage voice:", err);
      }
    } else if (this.data.id === "frieza_final") {
      const files = ["DANO.wav", "DANO (2).wav", "DANO (3).wav", "DANO (4).wav", "DANO (5).wav", "DANO (6).wav"];
      const file = files[Math.floor(Math.random() * files.length)];
      const voiceUrl = `/Assets/SONS/DUBLAGEM/FREEZA/${file}`.replace(/ /g, "%20");
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Frieza damage voice:", err);
      }
    }
  }

  takeDamage(amount: number): number {
    this.quickDashTimer = 0;
    if (this.hp <= 0) return 0;
    if (this.state === PlayerState.TAG_IN || this.state === PlayerState.TAG_OUT)
      return 0;

    const isSpecialOrUlt =
      this.state === PlayerState.ULTIMATE ||
      this.state === PlayerState.ULTIMATE_2 ||
      ((this.state === PlayerState.ATTACKING ||
        this.state === PlayerState.JUMP_ATTACK ||
        this.state === PlayerState.CROUCH_ATTACK) &&
        typeof this.comboType === "string" &&
        (this.comboType.startsWith("SPECIAL") || this.comboType === "KI_BLAST"));

    if (amount > 0 && isSpecialOrUlt) {
      this.specialCancelled = true;
    }

    const actual = Math.min(this.hp, amount);

    // Save previous hp before damage to know how much to convert to blue bar
    const beforeHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);

    if (actual > 0) {
      this.lastDamageTick = Date.now();
      if (this.onTakeDamage) {
        this.onTakeDamage(actual);
      }
    }

    if (actual > 0 && this.hp > 0) {
      this.playDamageVoice();
    }

    // Update Blue Health only if alive
    if (this.hp > 0) {
      if (this.blueHealth < beforeHp) {
        this.blueHealth = Math.max(this.blueHealth, beforeHp);
      }
    } else {
      this.blueHealth = 0;
    }

    return actual;
  }

  constructor(startX: number, data: CharacterData, facingRight: boolean) {
    this.pos.x = startX + this.width / 2; // Center it
    this.pos.y = WORLD_HEIGHT - 150; // Feet on ground
    this.facingRight = facingRight;

    // Override level for testing max skills
    this.data = JSON.parse(JSON.stringify(data));
    this.data.level = 20;
    this.data.availablePoints = 50;

    // Wrap animations in a Proxy to dynamically support both Portuguese and English/Legacy keys seamlessly
    if (this.data.spriteConfig && this.data.spriteConfig.animations) {
      const equivalenceGroups: string[][] = [
        // Idle
        ["Idle_1", "Idle_2", "Parado", "IDLE"],
        
        // Walk Forward
        ["Walk_1", "WALK_FORWARD", "Andar", "Andando", "WALK"],
        
        // Walk Backward
        ["Walk_2", "WALK_BACKWARD", "Andar_Costas", "Andando_Costas"],
        
        // Running
        ["Run_1", "Run_2", "RUNNING", "Correr", "Correndo"],
        
        // Dash Start
        ["Dash_1", "DASH_START", "QUICK_DASH"],
        
        // Dash Loop
        ["Dash_2", "DASHING", "SUPER_DASH", "DRAGON_DASH_FOLLOW", "Voo_Loop", "Dash_2_Loop"],
        
        // Dash End
        ["Dash_3", "DASH_END"],
        
        // Jumping
        ["Jump_1", "Jump_2", "JUMPING", "Pulo_Subindo", "Pulo", "JUMP"],
        
        // Falling
        ["Fall_1", "FALLING", "Caindo"],
        
        // Landing
        ["Land_1", "LANDING", "Landing", "Aterrissando"],
        
        // Blocking normal
        ["Block_1", "BLOCKING", "Defesa"],
        
        // Blocking crouch
        ["Block_2", "BLOCKING_CROUCH", "Defesa_Agachado"],
        
        // Blocking air
        ["Block_3", "BLOCKING_AIR", "Defesa_Ar"],
        
        // Hit 1
        ["Hit_1", "HIT", "Dano"],
        
        // Hit 2
        ["Hit_2", "HIT_2", "HIT_3", "Dano_Forte"],
        
        // Hit 3 (Launched / Knocked / recovers)
        ["Hit_3", "LAUNCHED", "STUNNED", "FALLING_HIT", "FALLING_HIT_GROUND", "Dano_Lançado"],
        
        // Charge 1
        ["Charge_1", "CHARGING", "CHARGE_START", "Carregar", "Carregar_Ki", "Carregando_Ki"],
        
        // Charge 2
        ["Charge_2", "CHARGE_END", "Charge"],
        
        // Transform 1
        ["Transform_1", "TRANSFORM", "Transformar"],
        
        // Transform 2
        ["Transform_2", "DETRANSFORM", "Destransformar"],
        
        // Victory
        ["Victory_1", "VICTORY", "Vitoria", "Victory"],
        
        // Defeat
        ["Defeat_1", "DEFEAT", "Derrota", "Defeat"],

        // Attacks Light Ground
        ["Attack_1_1", "ATTACK_LIGHT_1", "Combo_Leve_1", "Combo_leve_1", "ATTACKING"],
        ["Attack_1_2", "ATTACK_LIGHT_2", "Combo_Leve_2", "Combo_leve_2"],
        ["Attack_1_3", "ATTACK_LIGHT_3", "Combo_Leve_3", "Combo_leve_3"],
        
        // Crouch Light
        ["Attack_1_4", "ATTACK_CROUCH_LIGHT", "ATTACK_CROUCH_LIGHT_1", "Combo_Leve_Agachado_1", "Combo_leve_agachado_1"],
        ["Attack_1_5", "ATTACK_CROUCH_LIGHT_2", "Combo_Leve_Agachado_2", "Combo_leve_agachado_2"],
        ["Attack_1_6", "ATTACK_CROUCH_LIGHT_3", "Combo_Leve_Agachado_3", "Combo_leve_agachado_3"],

        // Attacks Medium Ground
        ["Attack_2_1", "ATTACK_MEDIUM_1", "Combo_Medio_1", "Combo_medio_1"],
        ["Attack_2_2", "ATTACK_MEDIUM_2", "Combo_Medio_2", "Combo_medio_2"],
        ["Attack_2_3", "ATTACK_MEDIUM_3", "Combo_Medio_3", "Combo_medio_3"],

        // Crouch Medium
        ["Attack_2_4", "ATTACK_CROUCH_MEDIUM", "ATTACK_CROUCH_MEDIUM_1", "Combo_Medio_Agachado_1", "Combo_medio_agachado_1"],
        ["Attack_2_5", "ATTACK_CROUCH_MEDIUM_2", "Combo_Medio_Agachado_2", "Combo_medio_agachado_2"],
        ["Attack_2_6", "ATTACK_CROUCH_MEDIUM_3", "Combo_Medio_Agachado_3", "Combo_medio_agachado_3"],

        // Heavy
        ["Attack_3_1", "ATTACK_HEAVY", "Combo_Forte_1", "Combo_forte_1"],
        ["Attack_3_2", "ATTACK_HEAVY_2", "Combo_Forte_2", "Combo_forte_2"],

        // Attacks Jump Air Light
        ["Attack_4_1", "ATTACK_JUMP_LIGHT_1", "Combo_Ar_1"],
        ["Attack_4_2", "ATTACK_JUMP_LIGHT_2", "Combo_Ar_2"],
        ["Attack_4_3", "ATTACK_JUMP_LIGHT_3", "Combo_Ar_3"],

        // Attacks Jump Air Medium
        ["Attack_4_4", "ATTACK_JUMP_MEDIUM_1", "Combo_Ar_4"],
        ["Attack_4_5", "ATTACK_JUMP_MEDIUM_2", "Combo_Ar_5"],
        ["Attack_4_6", "ATTACK_JUMP_MEDIUM_3", "Combo_Ar_6"],

        // Attacks Jump Air Heavy
        ["Attack_4_7", "ATTACK_JUMP_HEAVY", "Combo_Ar_7", "Attack_3_3"],

        // Specials (Especial 1)
        ["Special_1_1", "ATTACK_SPECIAL_START", "Especial_1_1", "Especial_1_1_Inicio", "ATTACK_SPECIAL"],
        ["Special_1_2", "ATTACK_SPECIAL_LOOP", "Especial_1_2", "Especial_1_1_Loop"],
        ["Special_1_3", "ATTACK_SPECIAL_END", "Especial_1_3", "Especial_1_1_Fim", "Especial_1_1_Final"],

        // Special 1 Air
        ["Special_1_1_Air", "Special_1_4", "Especial_1_1_Ar", "ATTACK_SPECIAL_START_AIR", "ATTACK_JUMP_SPECIAL_START"],
        ["Special_1_2_Air", "Special_1_5", "Especial_1_2_Ar", "ATTACK_SPECIAL_LOOP_AIR", "ATTACK_JUMP_SPECIAL_LOOP"],
        ["Special_1_3_Air", "Special_1_6", "Especial_1_3_Ar", "ATTACK_SPECIAL_END_AIR", "ATTACK_JUMP_SPECIAL_END"],

        // Ultimate 1
        ["Ultimate_1_1", "SUPER_ESPECIAL_INICIO_1", "Ultimate_Parte1_1", "ULT_SSJ_1_KAME_PREP"],
        ["Ultimate_1_2", "SUPER_ESPECIAL_MEIO_1", "Ultimate_Parte1_2", "ULT_SSJ_1_KAME_LOOP"],
        ["Ultimate_1_3", "SUPER_ESPECIAL_BEAM_1", "SUPER_ESPECIAL_MID_1", "Ultimate_Parte1_3", "ULT_SSJ_1_KAME_FINAL"],
        ["Ultimate_1_4", "SUPER_ESPECIAL_FINAL_1", "Ultimate_Parte1_4", "Ultimate_Parte1_5", "ULT_SSJ_1_KAME_END"],

        // Ultimate 2
        ["Ultimate_2_1", "SUPER_ESPECIAL_INICIO_2", "Ultimate_Parte2_1", "ULT_SSJ_START_1"],
        ["Ultimate_2_2", "SUPER_ESPECIAL_MEIO_2", "SUPER_ESPECIAL_MID_2", "Ultimate_Parte2_2", "ULT_SSJ_START_2"],
        ["Ultimate_2_3", "SUPER_ESPECIAL_FINAL_2", "Ultimate_Parte2_3", "Ultimate_Parte2_4", "Ultimate_Parte2_5", "ULT_SSJ_COMBO_1", "ULT_SSJ_COMBO_2", "ULT_SSJ_KAME_PREP", "ULT_SSJ_KAME_LOOP", "ULT_SSJ_KAME_FINAL"],
      ];

      const equivMap = new Map<string, string[]>();
      for (const group of equivalenceGroups) {
        for (const key of group) {
          const upperKey = key.toUpperCase();
          const existing = equivMap.get(upperKey) || [];
          for (const otherKey of group) {
            if (!existing.includes(otherKey)) {
              existing.push(otherKey);
            }
          }
          equivMap.set(upperKey, existing);
        }
      }

      const getProxyKey = (target: any, prop: string | symbol): string | symbol => {
        if (typeof prop !== "string") return prop;
        if (prop in target) return prop;

        const upper = prop.trim().toUpperCase();

        // 1. Group check
        if (equivMap.has(upper)) {
          const equivalents = equivMap.get(upper)!;
          for (const eq of equivalents) {
            if (eq in target) return eq;
            const keysObj = Object.keys(target);
            const eqUpper = eq.toUpperCase();
            const matched = keysObj.find(k => k.toUpperCase() === eqUpper);
            if (matched) return matched;
          }
        }

        // 2. Specific custom handlings (e.g. complex logic)

        // Specials fallback pattern: SPECIAL_X_Y or ESPECIAL_X_Y
        const specMatchObj = upper.match(/^(?:SPECIAL|ESPECIAL)_(\d+)_(\d+)(_AIR|_AR)?$/);
        if (specMatchObj) {
          const x = specMatchObj[1];
          const y = specMatchObj[2];
          const isAir = !!specMatchObj[3];
          const airSuffix = isAir ? "_Ar" : "";
          const airSuffixEng = isAir ? "_Air" : "";

          const candidates = [
            `Special_${x}_${y}${airSuffixEng}`,
            `Special_${x}_${y}${airSuffix}`,
            `Especial_${x}_${y}${airSuffix}`,
            `Especial_${x}_${y}${airSuffixEng}`,
            `Special_${x}_${y}`,
            `Especial_${x}_${y}`
          ];

          for (const cand of candidates) {
            if (cand in target) return cand;
            const keysObj = Object.keys(target);
            const candUpper = cand.toUpperCase();
            const matched = keysObj.find(k => k.toUpperCase() === candUpper);
            if (matched) return matched;
          }
        }

        // Ultimates fallback pattern: ULTIMATE_X_Y or SUPER_ESPECIAL_COMBINADO_X
        const ultMatchObj = upper.match(/^(?:ULTIMATE|SUPER_ESPECIAL)_(\d+)_(\d+)$/);
        if (ultMatchObj) {
          const x = ultMatchObj[1];
          const y = ultMatchObj[2];
          
          const candidates = [
            `Ultimate_${x}_${y}`,
            `Ultimate_Parte${x}_${y}`,
            `Ultimate_${x}_Parte${x}_${y}`,
            `Ultimate_${x}_Parte1_${y}`,
            `ultimate_${x}_parte_1_${y}`,
            `ultimate_${x}_parte_2_${y}`,
          ];

          if (x === "3") {
            candidates.push(`SUPER_ESPECIAL_COMBINADO_${y}`, `Ultimate_Parte3_${y}`);
          }

          for (const cand of candidates) {
            if (cand in target) return cand;
            const keysObj = Object.keys(target);
            const candUpper = cand.toUpperCase();
            const matched = keysObj.find(k => k.toUpperCase() === candUpper);
            if (matched) return matched;
          }
        }

        // Case-insensitive direct match
        const matchInsensitive = Object.keys(target).find(k => k.toUpperCase() === upper);
        if (matchInsensitive) return matchInsensitive;

        return prop;
      };

      this.data.spriteConfig.animations = new Proxy(this.data.spriteConfig.animations, {
        get(target: any, prop: string | symbol) {
          const resolved = getProxyKey(target, prop);
          return target[resolved];
        },
        has(target: any, prop: string | symbol) {
          const resolved = getProxyKey(target, prop);
          return resolved in target;
        }
      });
    }

    this.maxHp = this.data.maxHp ?? MAX_HP;
    this.hp = this.maxHp;

    this.attackMult = 1 + this.data.stats.attack * STAT_DMG_MULT;
    this.defenseMult = Math.max(
      0.1,
      1 - this.data.stats.defense * STAT_DEF_MULT,
    );
    this.speedMult = 1 + this.data.stats.speed * STAT_SPD_MULT;
  }

  get hitbox(): Rect {
    const animKey = this.lastAnimKey || this.state;
    const anim = this.data.spriteConfig?.animations[animKey];

    const sf = this.data.spriteConfig;
    const hW = anim?.hitboxWidth ?? sf?.hitboxWidth ?? this.width;
    const hH = anim?.hitboxHeight ?? sf?.hitboxHeight ?? this.height;
    const xOff = anim?.hitboxOffsetX ?? sf?.hitboxOffsetX ?? 0;
    const yOff = anim?.hitboxOffsetY ?? sf?.hitboxOffsetY ?? 0;

    // Alignment with AnimationPreviewScreen formulas for pixel-perfect hitbox mapping
    // Left edge of the player is at: this.pos.x - this.width / 2
    // Top edge of the player is at: this.pos.y - this.height
    const hX = this.facingRight 
      ? (this.pos.x - this.width / 2 + xOff) 
      : (this.pos.x + this.width / 2 - xOff - hW);
    const hY = this.pos.y - this.height + yOff;

    return {
      x: hX,
      y: hY,
      width: hW,
      height: hH,
    };
  }

  get attackBoxes(): Rect[] {
    const animKey = this.lastAnimKey || this.state;
    const anim = this.data.spriteConfig?.animations[animKey];
    if (!anim || anim.dealsDamage === false) return [];

    const boxes: Rect[] = [];
    const hAtk = this.hitbox;

    // Support multiple attack boxes if defined
    if (anim.attackBoxes && anim.attackBoxes.length > 0) {
      anim.attackBoxes.forEach((box) => {
        const isBoxActive = !box.damageFrames || 
                           box.damageFrames.length === 0 || 
                           box.damageFrames.includes(this.animFrame);
        
        if (isBoxActive) {
          const aW = box.width;
          const aH = box.height;
          const aXOff = box.offsetX;
          const aYOff = box.offsetY;
          
          const customX = this.facingRight
            ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
            : hAtk.x + hAtk.width - (aXOff !== undefined ? aXOff : hAtk.width) - aW;
            
          boxes.push({
            x: customX,
            y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
            width: aW,
            height: aH,
          });
        }
      });
    } 
    // Fallback to single attack box properties if defined
    else if (anim.attackBoxWidth !== undefined && anim.attackBoxHeight !== undefined) {
      const aW = anim.attackBoxWidth;
      const aH = anim.attackBoxHeight;
      const aXOff = anim.attackBoxOffsetX;
      const aYOff = anim.attackBoxOffsetY;
      
      const customX = this.facingRight
        ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
        : hAtk.x + hAtk.width - (aXOff !== undefined ? aXOff : hAtk.width) - aW;
        
      boxes.push({
        x: customX,
        y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
        width: aW,
        height: aH,
      });
    }

    return boxes;
  }

  get x() {
    return this.pos.x - this.width / 2;
  }
  get y() {
    return this.pos.y - this.height;
  }
  set x(val: number) {
    this.pos.x = val + this.width / 2;
  }
  set y(val: number) {
    this.pos.y = val + this.height;
  }
}
