import { GameEngine } from "./GameEngine";
import { Player } from "./Player";
import { PlayerState, IntroPhase, InputState } from "../types";
import { resolveAnimationKey } from "./AnimationResolver";
import {
  MAX_GUARD,
  WORLD_HEIGHT,
  GRAVITY,
  CAM_MAX_ZOOM,
  SPAWN_CENTER_OFFSET,
  MAX_KI,
} from "../constants";
import {
  GUARD_REGEN_RATE,
  KI_BLAST_SPEED,
  PROJECTILE_SIZE,
  KI_BLAST_DAMAGE,
  CHIP_DAMAGE_PERCENT,
  GUARD_BREAK_STUN,
  STUN_DURATION,
  BASE_CHARACTERS,
  STAT_DMG_MULT,
  STAT_DEF_MULT,
  STAT_SPD_MULT,
  GUARD_REGEN_DELAY,
} from "../constants";
import { AudioManager } from "./AudioManager";
import { Projectile } from "./Projectile";
import { Genkidama } from "./Genkidama";
import { VoiceManager } from "../src/engine/audio/VoiceManager";
import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { CollisionHelper } from "./CollisionHelper";
import { AnimationManager } from "./AnimationManager";
import { MoveManager } from "./MoveManager";

export class PhysicsManager {
  public static updatePhysics(engine: GameEngine, p: Player) {
    // 0. Update Phased Move System
    if (p.currentPhasedMove) {
      MoveManager.getInstance().update(p, engine);
    }

    // Background spawning for Frieza's Special 2 beams (100% independent and decoupled)
    if (p["frieza_sp2_beam_count"] !== undefined) {
      p["frieza_sp2_timer"] = (p["frieza_sp2_timer"] || 0) + 1;
      const beamCount = p["frieza_sp2_beam_count"];
      
      // Interval of 10 frames between each spawn (reduced by 35% from 15 frames)
      if (beamCount < 3 && p["frieza_sp2_timer"] >= beamCount * 10 + 1) {
        const spacing = 180; // Espaçamento fixo entre os feixes na direção do disparo
        const baseDistance = 120; // Distância base a partir do personagem
        const dist = baseDistance + beamCount * spacing;
        
        const spawnX = p.facingRight ? p.x + dist : p.x - dist;
        const spawnY = p["frieza_sp2_initial_y"] ?? p.y; 
        const ownerId = p === engine.player1 ? "p1" : "p2";

        // Cria o projétil da FECHO_DE_ENERGIA_10 (totalmente estático)
        const proj = Projectile.spawn(
          spawnX,
          spawnY,
          0, // velX = 0 (estático)
          ownerId,
          "#ffffff", // cor branca do feixe
          false, // isBeam = false
          "FECHO_DE_ENERGIA_10"
        );
        proj.initialFacingRight = p.facingRight;
        proj.life = 120; // durabilidade de 2 segundos antes de expirar
        proj.sourcePlayer = p; // define o personagem como origem
        engine.projectiles.push(proj);

        // Efeitos sonoros e partículas
        try {
          AudioManager.getInstance().playSFX("ki_blast");
          if (engine.particleManager) {
            engine.particleManager.spawn("IMPACT", spawnX, spawnY, 3, "#ffffff");
          }
        } catch (e) {}

        p["frieza_sp2_beam_count"] = beamCount + 1;
      }

      // Ao término da criação do terceiro feixe, finaliza o processo em background
      if (p["frieza_sp2_beam_count"] >= 3 && p["frieza_sp2_timer"] >= 3 * 10 + 10) {
        p["frieza_sp2_beam_count"] = undefined;
        p["frieza_sp2_timer"] = undefined;
        p["frieza_sp2_initial_y"] = undefined;
      }
    }

    if (
      p.state === PlayerState.HIT ||
      p.state === PlayerState.STUNNED ||
      p.state === PlayerState.KNOCKED_DOWN ||
      p.state === PlayerState.FALLING_HIT ||
      p.state === PlayerState.FALLING_HIT_GROUND ||
      p.state === PlayerState.LAUNCHED
    ) {
      p.ataque = false;
      p.comboType = "NONE";
      p.comboStep = 0;
      (p as any).specialPhaseTimer = undefined;
      (p as any).beamSpawned = false;
      (p as any).beamHasBeenSpawned = false;
      (p as any).hasSpawnedInSequence = false;
      (p as any).beamPhaseTimer = undefined;
    }

    if (
      (!p.ataque ||
      p.comboType === "NONE" ||
      p.state === PlayerState.IDLE ||
      p.state === PlayerState.HIT ||
      p.state === PlayerState.STUNNED) &&
      p.state !== PlayerState.ULTIMATE &&
      p.state !== PlayerState.ULTIMATE_2
    ) {
      if (
        !p.ataque &&
        (p.state === PlayerState.ATTACKING ||
          p.state === PlayerState.JUMP_ATTACK ||
          p.state === PlayerState.CROUCH_ATTACK)
      ) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        // Do not reset comboType/comboStep here; let the comboWindow handle it at the end of updatePhysics
        // p.comboType = "NONE";
        // p.comboStep = 0;
      }
      (p as any).beamSpawned = false;
      (p as any).beamHasBeenSpawned = false;
      (p as any).hasSpawnedInSequence = false;
      (p as any).spawnedBeamProjectile = undefined;
      (p as any).beamPhaseTimer = undefined;
    }

    if (
      p.state !== PlayerState.SUPER_DASH &&
      p.state !== PlayerState.DASHING &&
      p.state !== PlayerState.DRAGON_RUSH &&
      p.state !== PlayerState.DRAGON_COMBO
    ) {
      p.rotation = 0;
    }

    if (p.freezeTimer > 0) {
      p.freezeTimer--;
      return; // Freeze the player completely
    }

    if (p.heavyCooldownTimer > 0) {
      p.heavyCooldownTimer--;
    }
    if (p.queuedAttackTimer > 0) {
      p.queuedAttackTimer--;
      if (p.queuedAttackTimer <= 0) p.queuedAttack = null;
    }

    // DBFZ Healing Logic (Sparking & Standby)
    if (p.hp < p.blueHealth && p.hp > 0) {
      const isActiveFighter = p === engine.player1 || p === engine.player2;
      if (!isActiveFighter) {
        if (
          p.state === PlayerState.STANDBY ||
          p.state === PlayerState.SPARKING ||
          (p.sparkingTimer > 0 &&
            p.state !== PlayerState.HIT &&
            p.state !== PlayerState.TAG_OUT &&
            p.state !== PlayerState.TAG_IN)
        ) {
          p.hp = Math.min(
            p.blueHealth,
            p.hp + (p.sparkingTimer > 0 ? 0.3 : 0.05),
          ); // Faster heal if sparking
        }
      }
    }
    if (p.sparkingTimer > 0) p.sparkingTimer--;

    // Safety check to prevent stuck super dash effects (foot impact waves and rocks spawning)
    if (p.state !== PlayerState.SUPER_DASH) {
      p.superDashActive = false;
    }

    // Ki Charging Aura Anim State Updates
    const isChargingCurrently = 
      p.state === PlayerState.CHARGING || 
      p.state === PlayerState.CHARGE_START || 
      p.state === PlayerState.CHARGE_END;

    if (isChargingCurrently) {
      if (!p.wasChargingKi) {
        p.auraHeightScale = 0;
        p.auraWidthScale = 0.3;
        p.auraDissipating = false;
        p.auraDissipatingTimer = 0;
        p.brokenGroundAlpha = 1.0;
        p.brokenGroundX = p.pos.x;
        p.brokenGroundY = p.pos.y;
      }
      p.wasChargingKi = true;

      if (p.auraHeightScale < 1.0) {
        p.auraHeightScale = Math.min(1.0, p.auraHeightScale + 0.06);
      }
      if (p.auraWidthScale < 1.0) {
        p.auraWidthScale = Math.min(1.0, p.auraWidthScale + 0.05);
      }
    } else {
      if (p.wasChargingKi) {
        p.wasChargingKi = false;
        p.auraDissipating = true;
        p.auraDissipatingTimer = 15; // 15 frames of dissipation animation
      }

      if (p.auraDissipating) {
        if (p.auraDissipatingTimer > 0) {
          p.auraDissipatingTimer--;
          p.auraWidthScale = Math.max(0.0, p.auraWidthScale - 0.08);
          p.auraHeightScale = Math.min(1.2, p.auraHeightScale + 0.06);
        } else {
          p.auraDissipating = false;
          p.auraHeightScale = 0;
          p.auraWidthScale = 0.3;
        }
      } else {
        p.auraHeightScale = 0;
        p.auraWidthScale = 0.3;
      }
    }

    if (p.state === PlayerState.SPARKING) {
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.attackTimer--;
      if (p.attackTimer <= 0) p.state = PlayerState.IDLE;
      return;
    }

    let applyGravity = true;
    if (p.gravityDisabledTimer > 0) {
      p.gravityDisabledTimer--;
      applyGravity = false;
    }
    if (
      p.state === PlayerState.DASH_START ||
      p.state === PlayerState.DASHING ||
      p.state === PlayerState.SUPER_DASH ||
      p.state === PlayerState.DASH_END ||
      p.state === PlayerState.ULTIMATE ||
      p.state === PlayerState.ULTIMATE_2 ||
      p.state === PlayerState.TAG_IN ||
      p.state === PlayerState.TAG_OUT ||
      p.state === PlayerState.VANISH ||
      p.state === PlayerState.VANISH_APPEAR ||
      p.state === PlayerState.MUI_DODGE ||
      p.state === PlayerState.TRANSFORM ||
      p.state === PlayerState.DETRANSFORM ||
      p.state === PlayerState.FUSION ||
      p.state === PlayerState.DEFUSION ||
      p.state === PlayerState.DRAGON_RUSH ||
      p.state === PlayerState.DRAGON_COMBO ||
      p.state === PlayerState.DRAGON_DASH_FOLLOW ||
      p.currentPhasedMove !== null ||
      (p.state === PlayerState.JUMP_ATTACK &&
        p.comboType !== undefined &&
        (p.comboType.startsWith("SPECIAL") || p.comboType === "KI_BLAST")) ||
      (p.data.id === "broly_ikari" && p.comboType === "SPECIAL_3" && p.ataque && p.comboStep < 3)
    ) {
      applyGravity = false;
      if (p.comboType === "KI_BLAST") {
        p.velocity.x = 0;
        p.velocity.y = 0;
      }
      if (p.data.id === "broly_ikari" && p.comboType === "SPECIAL_3" && p.comboStep < 3) {
        p.velocity.x = 0;
        p.velocity.y = 0;
      }
    }

    // Do not apply gravity to a player if the other player is doing an ultimate and freezing them
    // We can check if the current player is stunned and velocity is managed by ultimate
    const opp = p === engine.player1 ? engine.player2 : engine.player1;
    
    // Check if the opponent is doing Goku Base Combined Ultimate and has reached the launching stage (end of Phase 4 and beyond)
    const isOpponentGokuBaseCombinedFree =
      (opp.data.id === "goku_base_swl_removed" || opp.data.id === "goku_base_swl" || opp.data.id === "goku_base") &&
      opp.ultType === 3 &&
      (opp.ultPhase >= 5 || (opp.ultPhase === 4 && opp.animFrame >= (opp.data.spriteConfig?.animations?.["Ultimate_combinado_4"]?.frames || 15) - 2));

    let isOpponentUlting =
      opp.state === PlayerState.ULTIMATE ||
      opp.state === PlayerState.ULTIMATE_2;

    if (isOpponentGokuBaseCombinedFree) {
      isOpponentUlting = false;
    }

    const isOpponentTransforming =
      opp.state === PlayerState.TRANSFORM ||
      opp.state === PlayerState.DETRANSFORM ||
      opp.state === PlayerState.FUSION ||
      opp.state === PlayerState.DEFUSION;
    const isOpponentDragonComboing =
      opp.state === PlayerState.DRAGON_COMBO;

    if (isOpponentTransforming) {
      applyGravity = false;
      p.velocity.x = 0;
      p.velocity.y = 0;
    } else if (isOpponentUlting) {
      let isUltPartEnding = false;
      if (opp.lastAnimKey) {
        const anim = opp.data.spriteConfig?.animations[opp.lastAnimKey];
        // Typical combo ultimates push the opponent around frame - 2 or - 1
        if (anim && (opp.animFrame >= anim.frames - 2 || opp.animFinished)) {
          isUltPartEnding = true;
        }
      }

      const isGokuSsjLaunching =
        opp.data.id === "goku_ssj" &&
        opp.ultType === 2 &&
        (opp.ultPhase === 3 ||
          opp.ultPhase === 3.5 ||
          opp.ultPhase === 4 ||
          opp.ultPhase === 4.5);
      const isMuiLaunching =
        opp.data.id === "goku_mui" &&
        opp.ultType === 2 &&
        (opp.ultPhase === 2 || opp.ultPhase === 3);
      const isTrunksLaunching =
        opp.data.id === "trunks_ssj2" &&
        ((opp.ultType === 2 &&
          (opp.ultPhase === 3 ||
            opp.ultPhase === 4 ||
            opp.ultPhase === 5 ||
            opp.ultPhase === 6 ||
            opp.ultPhase === 12)) ||
          (opp.ultType === 1 && opp.ultPhase === 4));
      const isGohanLaunching =
        opp.data.id === "teen_gohan_ssj2" &&
        ((opp.ultType === 2 && opp.ultPhase >= 2) ||
          (opp.ultType === 1 && opp.ultPhase >= 3));

      const isFreeflying =
        isGokuSsjLaunching || isMuiLaunching || isTrunksLaunching || isGohanLaunching;

      if (!isUltPartEnding && !isFreeflying) {
        applyGravity = false;
        // Prevent manual PhysicsManager velocity updates during the freeze unless UltimateManager just applied it for the transition
        p.velocity.x = 0;
        p.velocity.y = 0;
      } else if (!isUltPartEnding && isFreeflying) {
        applyGravity = false; // Still disable gravity, UltimateManager manually handles freeflying velocities!
      }
    } else if (isOpponentDragonComboing) {
      applyGravity = false;
      p.velocity.x = 0;
      p.velocity.y = 0;
    }

    if (p.state === PlayerState.MUI_DODGE) {
      // Ensure Goku always faces the opponent while in dodge state
      const opp = p === engine.player1 ? engine.player2 : engine.player1;
      if (opp) {
        p.facingRight = opp.pos.x > p.pos.x;
      }

      if (p.animFrame >= 4) {
        // Inicia o movimento apenas se estiver quase parado (primeira vez no frame 4+)
        if (Math.abs(p.velocity.x) < 2) {
          const dir = (p as any)["muiDodgeDir"] ?? (p.facingRight ? 1 : -1);
          p.velocity.x = dir * 40; // Increased speed for better visual feedback
        }
        p.velocity.x *= 0.90; // Smooth deceleration
      } else {
        p.velocity.x = 0; // Still during initial frames 0-3
      }
    }

    if (
      p.state === PlayerState.HIT ||
      p.state === PlayerState.HIT_2 ||
      p.state === PlayerState.HIT_3 ||
      p.state === PlayerState.LAUNCHED ||
      p.state === PlayerState.FALLING_HIT ||
      p.state === PlayerState.FALLING_HIT_GROUND ||
      p.state === PlayerState.STUNNED
    ) {
      // Apply gradual friction to these states so they don't fly forever
      p.velocity.x *= 0.95;
      if (!p.isGrounded) {
        p.velocity.y *= 0.98; // Slight air resistance
      }
    }

    if (applyGravity) {
      const gMult = engine.customGravityMultiplier !== undefined ? engine.customGravityMultiplier : 1.0;
      p.velocity.y += GRAVITY * gMult;
    }

    p.x += p.velocity.x;
    p.y += p.velocity.y;
    if (p.landingDelayTimer > 0) {
      p.landingDelayTimer--;
      if (p.landingDelayTimer === 0 && p.state === PlayerState.LANDING) {
        p.state = PlayerState.IDLE;
      }
    }
    if (p.projectileCooldown > 0) p.projectileCooldown--;
    if (p.dragonRushCooldown > 0) p.dragonRushCooldown--;
    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // Constant invincibility during transformations
    if (
      p.state === PlayerState.TRANSFORM ||
      p.state === PlayerState.DETRANSFORM ||
      p.state === PlayerState.FUSION ||
      p.state === PlayerState.DEFUSION
    ) {
      p.invincibleTimer = 5;
    }

    if (
      p.state !== PlayerState.STUNNED &&
      p.state !== PlayerState.GUARD_BREAK &&
      p.state !== PlayerState.DEFEAT
    ) {
      if (p.guardRegenTimer > 0) p.guardRegenTimer--;
      else p.guard = Math.min(MAX_GUARD, p.guard + GUARD_REGEN_RATE);
    }
    if (p.stunTimer > 0) {
      p.stunTimer--;
      if (p.state !== PlayerState.DEFEAT) {
        if (p.stunTimer <= 0) {
          if (p !== engine.player1 && p !== engine.player2) {
            p.state = PlayerState.ASSIST_EXIT;
            p.velocity.x = p.facingRight ? -15 : 15;
            p.velocity.y = -10;
            p.isGrounded = false;
            p.attackTimer = 60;
          } else {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            if (p.guard <= 0) p.guard = MAX_GUARD / 2;

            // Reset DBFZ Smash uses when recovering
            p.wallBounceUsed = false;
            p.groundBounceUsed = false;
            p.slidingKnockdown = false;
          }
        } else {
          // Dynamic Recovery States based on stunTimer
          if (p.isGrounded) {
            if (p.state === PlayerState.HIT_GROUND_CRASH || p.state === PlayerState.HIT_GROUND_STUNNED) {
              if (p.stunTimer <= 15) {
                p.state = PlayerState.HIT_GROUND_LAUNCH;
                p.velocity.y = -8; // Small launch for recovery
                p.isGrounded = false;
              } else if (p.stunTimer <= 30) {
                p.state = PlayerState.HIT_GROUND_PUSH_UP;
              } else if (p.stunTimer <= 40) {
                p.state = PlayerState.HIT_GROUND_RECOVER;
              }
            }
          }

          if (p.guard <= 0) {
            p.state = PlayerState.GUARD_BREAK;
          } else if (
            p.state !== PlayerState.KNOCKED_DOWN && 
            p.state !== PlayerState.HIT_GROUND_STUNNED &&
            p.state !== PlayerState.HIT_GROUND_CRASH &&
            p.state !== PlayerState.HIT_GROUND_RECOVER &&
            p.state !== PlayerState.HIT_GROUND_PUSH_UP &&
            p.state !== PlayerState.HIT_GROUND_LAUNCH &&
            p.state !== PlayerState.HIT_AIR &&
            p.state !== PlayerState.HIT_AIR_FALL &&
            p.state !== PlayerState.HIT_BOUNCE &&
            p.state !== PlayerState.HIT_GRAB &&
            p.state !== PlayerState.LAUNCHED
          ) {
            p.state = PlayerState.HIT;
          }
        }
      }
      p.ataque = false;
    }

    const waitAnimStates = [
      PlayerState.ATTACKING,
      PlayerState.JUMP_ATTACK,
      PlayerState.CROUCH_ATTACK,
      PlayerState.TRANSFORM,
      PlayerState.DETRANSFORM,
      PlayerState.FUSION,
      PlayerState.DEFUSION,
      PlayerState.MUI_DODGE,
    ];
    if (p.state === PlayerState.ASSIST_ACTION && p.comboType === "SPECIAL") {
      waitAnimStates.push(PlayerState.ASSIST_ACTION);
    }
    const isWaitAnimState = waitAnimStates.includes(p.state as PlayerState);
    
    if (p.state !== (p as any)._prevPhysState) {
      (p as any)._prevPhysState = p.state;
      (p as any).stateDuration = 0;
    } else {
      (p as any).stateDuration = ((p as any).stateDuration || 0) + 1;
    }

    const animKey = p.lastAnimKey || (p.state as string);
    const currentAnim = p.data.spriteConfig?.animations[animKey];
    const isLooping = currentAnim ? currentAnim.loop !== false : false;

    let triggeredStateEnd = false;

    // Safety Timeout: Force state recovery if stuck too long in a transient/animation action state during gameplay
    const isStableState = [
      PlayerState.IDLE,
      PlayerState.STANDBY,
      PlayerState.DEFEAT,
      PlayerState.VICTORY,
      PlayerState.RUNNING,
      PlayerState.WALK_BACKWARD,
      PlayerState.CROUCH,
      PlayerState.JUMPING,
      PlayerState.FALLING,
      PlayerState.BLOCKING,
      PlayerState.BLOCKING_CROUCH,
      PlayerState.BLOCKING_AIR,
      PlayerState.CHARGING,
      PlayerState.STUNNED,
      PlayerState.HIT,
      PlayerState.HIT_2,
      PlayerState.HIT_3,
      PlayerState.FALLING_HIT,
      PlayerState.FALLING_HIT_GROUND,
      PlayerState.LAUNCHED,
      PlayerState.KNOCKED_DOWN,
    ].includes(p.state as PlayerState);

    const maxAllowedDuration = (p.state === PlayerState.ULTIMATE || p.state === PlayerState.ULTIMATE_2) ? 1200 : 300;
    const isFightPhase = engine && engine.introPhase === IntroPhase.FIGHT;

    if (isFightPhase && !isStableState && (p as any).stateDuration > maxAllowedDuration) {
      console.warn(`[PhysicsManager] Stuck safety timeout triggered for state ${p.state} on character ${p.data.id}`);
      triggeredStateEnd = true;
      p.attackTimer = 0;
      p.stunTimer = 0;
      p.freezeTimer = 0;
      p.ataque = false;
      p.comboType = "NONE";
      p.comboStep = 0;
      if (p.state === PlayerState.ULTIMATE || p.state === PlayerState.ULTIMATE_2) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
      }
    }

    if (p.state === PlayerState.SUPER_DASH) {
      const opp = p === engine.player1 ? engine.player2 : engine.player1;

      if (p.superDashPhase === 1) {
        // Phase 1: Upward boost and initial animation. Rotation is NOT applied in Phase 1!
        p.rotation = 0;
        p.invincibleTimer = 0; // Vulnerable in Phase 1

        const dx = opp.x - p.x;
        if (Math.abs(dx) > 10) {
          p.facingRight = dx > 0;
        }

        if (p.attackTimer > 0) {
          p.attackTimer--;
          p.velocity.y = -5;
          p.velocity.x *= 0.8; 
        } else {
          // Phase 2 can ONLY start after Phase 1 finishes
          p.superDashPhase = 2;
          p.superDashTimer = 180; // 3 seconds max duration
          p.animFinished = false;
          p.animFrame = 0;
          p.animTimer = 0;
        }
      }

      if (p.superDashPhase === 2) {
        // Phase 2: Automatic homing advance towards opponent position
        const dx = opp.x - p.x;
        const dy = (opp.y + opp.height / 2) - (p.y + p.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 26;

        // Constant Ki consumption during advance
        p.ki = Math.max(0, p.ki - 0.25); 

        // Cancellation logic: Direction contrary to advance
        const inputs = p === engine.player1 ? engine.currentP1Input : engine.currentP2Input;
        const isCancelling = inputs && ((dx > 0 && inputs.left) || (dx < 0 && inputs.right));

        if (p.ki <= 0 || isCancelling) {
          p.state = PlayerState.FALLING;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.superDashActive = false;
          p.ataque = false;
          p.rotation = 0;
          p.superDashPhase = 0;
          return;
        }

        if (dist > 10 && !p.hasHit) {
          p.velocity.x = (dx / dist) * speed;
          p.velocity.y = (dy / dist) * speed;
          p.facingRight = dx > 0;

          const targetAngle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);
          const rotationAngle = targetAngle;
          
          // Smooth rotation transition
          if (p.rotation === undefined) p.rotation = 0;
          p.rotation = p.rotation * 0.4 + rotationAngle * 0.6;
        }

        if (p.superDashTimer <= 0 || p.hasHit) {
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.superDashActive = false;
          p.ataque = false;
          p.rotation = 0;
          p.superDashPhase = 0;
        } else {
          p.superDashTimer--;
          if (engine.frameCount % 2 === 0) {
            engine.particleManager.spawn(
              "SPEED_LINES",
              p.pos.x,
              p.pos.y - p.height / 2,
              1,
            );
          }
        }
      }
    } else if (p.state === PlayerState.REFLECT) {
      p.reflectTimer--;
      if (p.reflectTimer <= 0) {
        p.state = PlayerState.IDLE;
      }
    } else if (p.state === PlayerState.DRAGON_RUSH) {
      p.invincibleTimer = 10; // Garantir invencibilidade durante o rush
      let animKey = resolveAnimationKey(p.data.id, p.state, p.comboType, p.comboStep, p.ataque, undefined, undefined, undefined, 1, p.isGrounded, false, false, p.data.spriteConfig);
      
      let anim = p.data.spriteConfig?.animations[animKey];
      if (!anim) {
          animKey = "dragon_rush_1";
          anim = p.data.spriteConfig?.animations[animKey];
      }
      if (!anim) anim = p.data.spriteConfig?.animations[PlayerState.DRAGON_RUSH];
      const totalFrames = (anim as any)?.frames?.length || anim?.frames || 8;

      p.rotation = 0;

      if (p.comboStep === 0) {
        // Fase 1: Executar animação startup corretamente até ser finalizada
        const opponent = p === engine.player1 ? engine.player2 : engine.player1;
        p.facingRight = opponent.x > p.x;
        p.velocity.x = 0;
        p.velocity.y = 0;

        if (!p.attackTimer) p.attackTimer = 0;
        p.attackTimer++;

        // Ao finalizar animação da Fase 1:
        if (p.animFinished || p.attackTimer >= 30) {
          p.animFrame = totalFrames - 1; // Congelar no último frame da Fase 1
          p.comboStep = 1; // Transição para a sub-fase de avanço
          p.attackTimer = 30; // Aplicar avanço de 0.5 segundos (30 frames)
          p.animFinished = false; // Garante que o último frame congelado persista
          p.animTimer = 0;
          (p as any)["dragonRushDirX"] = p.facingRight ? 1 : -1;
          
          try {
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - p.height / 2, 5);
          } catch (e) {}
        }
      } else if (p.comboStep === 1) {
        // Fase 1 (Parte 2): Congelar último frame e aplicar avanço de 0.5s na direção em que o personagem está olhando
        p.animFrame = totalFrames - 1; 
        p.animFinished = false; 
        
        const opponent = p === engine.player1 ? engine.player2 : engine.player1;
        const dirX = (p as any)["dragonRushDirX"] ?? (p.facingRight ? 1 : -1);
        const speed = 35; 

        p.velocity.x = dirX * speed;
        p.velocity.y = 0;

        if (engine.frameCount % 3 === 0) {
          engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - p.height / 2, 1);
        }
        engine.spawnAfterimageAt(p, p.x, p.y);

        // Hitbox de contato (Rush Hitbox)
        const rushHitbox = {
          x: p.facingRight ? p.hitbox.x + p.hitbox.width - 20 : p.hitbox.x - 30,
          y: p.hitbox.y,
          width: 60,
          height: p.hitbox.height
        };

        const isContacting = CollisionHelper.testAABB(rushHitbox, opponent.hitbox) || CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting) {
          // HOUVE COLISÃO: Avança para FASE 2
          p.state = PlayerState.DRAGON_COMBO;
          p.comboStep = 0;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 0;
          p.dragonComboTimer = 0;
          p.rotation = 0;
          
          // Alinhar oponente muito próximo na frente do atacante (pequena sobreposição de 25px)
          const overlap = 25;
          const sideOffset = p.facingRight 
            ? (p.width / 2 + opponent.width / 2 - overlap) 
            : -(p.width / 2 + opponent.width / 2 - overlap);
          
          opponent.pos.x = p.pos.x + sideOffset;
          opponent.pos.y = p.pos.y;
          (p as any)["dragonRushPhase2LockPos"] = { x: p.pos.x, y: p.pos.y };
          opponent.facingRight = !p.facingRight;
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;
          p.velocity.x = 0;
          p.velocity.y = 0;
          
          opponent.gravityDisabledTimer = 10;
          opponent.stunTimer = 60;
          
          p.gravityDisabledTimer = 10;
          
          try {
            AudioManager.getInstance().playSFX("dragon_rush_impact");
          } catch (e) {}
          
          if (engine.camera) engine.camera.addScreenShake(12, 8, "IMPULSE", 1.2);
          return;
        }

        p.attackTimer--;
        if (p.attackTimer <= 0) {
          // NÃO HOUVE COLISÃO EM 0.5s: CANCELAR DRAGON RUSH!
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.comboStep = 0;
          p.ataque = false;
          p.comboType = "NONE";
          p.rotation = 0;
        }
      }
    } else if (
      p.comboType === "SPECIAL" &&
      p.data.id === "gogeta_ssj" &&
      p.ataque
    ) {
      // Sequencia especial 1 Gogeta SSJ (Kamehameha)
      p.gravityDisabledTimer = 10;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        // 1. Preparando
        if (p.animFrame >= 2) {
          // Spawns aura or particles during charge if needed
          if (engine.frameCount % 5 === 0) {
            engine.particleManager.spawn(
              "ENERGY",
              p.pos.x + (p.facingRight ? 20 : -20),
              p.pos.y - p.height / 2,
              1,
            );
          }
          if (p.animTimer === 0 && p.animFrame === 3) {
            engine.camera.addScreenShake(3, 3, "PERLIN", 1.0);
          }
        }

        if ((p.animFinished && p.attackTimer <= 250) || p.attackTimer <= 180) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.hasHit = false;
          p.animFinished = false;
          p.attackTimer = 180;
        }
      } else if (p.comboStep === 1) {
        // 2. Lança especial (fire the beam)
        if (!p.hasHit) {
          p.hasHit = true;
          const finalKiX = p.data.spriteConfig?.kiOriginX ?? 76;
          const finalKiY = p.data.spriteConfig?.kiOriginY ?? 125;
          const beamOriginX = p.facingRight ? p.x + finalKiX : p.x + p.width - finalKiX - 1; // 1 is width default for BEAM
          const beamOriginY = p.y + finalKiY;
          const velX = p.facingRight
            ? KI_BLAST_SPEED * 1.5
            : -KI_BLAST_SPEED * 1.5;
          const ownerId = p === engine.player1 ? "p1" : "p2";

          engine.projectiles.push(
            Projectile.spawn(
              beamOriginX,
              beamOriginY,
              velX,
              ownerId,
              p.data.color,
              true,
              "BEAM",
            ),
          );
          engine.camera.addScreenShake(20, 20, "IMPULSE", 1.2);
          AudioManager.getInstance().playSFX("attack");
        }

        if ((p.animFinished && p.attackTimer <= 140) || p.attackTimer <= 90) {
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.hasHit = false;
          p.animFinished = false;
          p.attackTimer = 90;
        }
      } else if (p.comboStep === 2) {
        // 3. Final
        if (p.animFinished || p.attackTimer <= 0) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        }
        p.attackTimer--;
      }
    } else if (
      p.comboType === "SPECIAL" &&
      p.data.id === "gogeta_ssj4" &&
      p.ataque
    ) {
      // Especial 1 (Kamehameha) - Gogeta SSJ4
      p.gravityDisabledTimer = 10;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        p.attackTimer--;
        if (p.animFinished || p.attackTimer <= 900) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 120;
          (p as any).beamSpawned = false;
        }
      } else if (p.comboStep === 1) {
        p.attackTimer--;
        if (p.attackTimer <= 118 && !(p as any).beamSpawned) {
          (p as any).beamSpawned = true;
          const ownerId = p === engine.player1 ? "p1" : "p2";

          const animConfig = (p.data.spriteConfig?.animations?.["Especial_1_2"] as any) || {};
          const beamId = animConfig.createsBeam || "CHAVE_BEAM_44";

          const family = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
          const familyStart = family?.start;
          const familyMiddle = family?.middle;

          const kiOriginX = animConfig.kiOriginX ?? familyStart?.kiOriginX ?? familyMiddle?.kiOriginX;
          const kiOriginY = animConfig.kiOriginY ?? familyStart?.kiOriginY ?? familyMiddle?.kiOriginY;

          const projWidth = animConfig.projectileWidth ?? familyStart?.projectileWidth ?? familyMiddle?.projectileWidth ?? 1;
          const projHeight = animConfig.projectileHeight ?? familyStart?.projectileHeight ?? familyMiddle?.projectileHeight;
          const projOffsetX = animConfig.projectileOffsetX ?? familyStart?.projectileOffsetX ?? familyMiddle?.projectileOffsetX;
          const projOffsetY = animConfig.projectileOffsetY ?? familyStart?.projectileOffsetY ?? familyMiddle?.projectileOffsetY;
          const projSpeed = animConfig.projectileSpeed ?? familyStart?.projectileSpeed ?? familyMiddle?.projectileSpeed;
          const initialScale = animConfig.projectileScale ?? familyStart?.projectileScale ?? familyMiddle?.projectileScale ?? familyStart?.scale ?? familyMiddle?.scale;
          const behavior = family?.behavior || "STRAIGHT";

           // Override with kiOrigin from Animation configuration if present, with safe defaults representing physical KiOrigin (never hitbox edges)
          const finalKiX = kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
          const finalKiY = kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

          const customXOff = projOffsetX ?? 0;
          const customYOff = projOffsetY ?? 0;

          let spawnX: number;
          if (p.facingRight) {
            spawnX = p.x + finalKiX + customXOff;
          } else {
            spawnX = p.x + p.width - finalKiX - customXOff - projWidth;
          }

          const spawnY = p.y + finalKiY - customYOff;

          const speedValue = projSpeed ?? KI_BLAST_SPEED * 1.5;
          const velX = p.facingRight ? speedValue : -speedValue;

          const proj = Projectile.spawn(
            spawnX,
            spawnY,
            velX,
            ownerId,
            p.data.color,
            true,
            beamId,
            projWidth,
            projHeight,
            projOffsetX,
            projOffsetY,
            initialScale,
            speedValue,
            behavior
          );

          if (family && (family as any).maxScale !== undefined) {
            proj.maxScale = (family as any).maxScale;
          }

          proj.sourceAnimConfig = animConfig;
          proj.effectConfigKey = animConfig.effectConfigKey;

          engine.projectiles.push(proj);

          if (engine.camera) engine.camera.addScreenShake(20, 20, "IMPULSE", 1.2);
          try {
            AudioManager.getInstance().playSFX("attack");
          } catch (e) {}
        }

        if (p.attackTimer <= 0) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          (p as any).beamSpawned = false;
        }
      }
    } else if (
      p.comboType === "SPECIAL_3" &&
      p.data.id === "gogeta_ssj4" &&
      p.ataque
    ) {
      // Especial 3 - Gogeta SSJ4
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        p.attackTimer--;
        if (p.animFinished || p.attackTimer <= 900) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 100;
          (p as any).ssj4_spec3_hit = false;
        }
      } else if (p.comboStep === 1) {
        p.attackTimer--;

        // Slide toward opponent during strike
        if (p.attackTimer > 60 && !(p as any).ssj4_spec3_hit) {
          p.velocity.x = p.facingRight ? 8 : -8;
        } else {
          p.velocity.x = 0;
        }

        const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting && !(p as any).ssj4_spec3_hit) {
          (p as any).ssj4_spec3_hit = true;
          opponent.takeDamage(20);
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 24 : -24;
          opponent.velocity.y = -8;
          opponent.stunTimer = 45;
          if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.6);
          try {
            AudioManager.getInstance().playSFX("heavy_hit");
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 3);
          } catch (e) {}
        }

        if (p.animFinished || p.attackTimer <= 0) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          (p as any).ssj4_spec3_hit = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_2" &&
      p.data.id === "gogeta_ssj" &&
      p.ataque
    ) {
      // Sequencia especial 2 Gogeta SSJ
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.gravityDisabledTimer = 10; // disable gravity while executing special

      if (p.comboStep === 0) {
        // 1. Vai atrás do oponente loop
        const dx = opponent.pos.x - p.pos.x;
        const dy = opponent.pos.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 25; // rushing speed
        if (dist > 120) {
          p.velocity.x = (dx / dist) * speed;
          p.velocity.y = (dy / dist) * speed;
          engine.spawnAfterimageAt(p, p.x, p.y);
          if (engine.frameCount % 3 === 0) {
            engine.particleManager.spawn(
              "SPEED_LINES",
              p.pos.x,
              p.pos.y - p.height / 2,
              2,
            );
          }
        } else {
          const isFacingAttacker =
            (p.facingRight && !opponent.facingRight) ||
            (!p.facingRight && opponent.facingRight);
          const isBlocking =
            (opponent.state === PlayerState.BLOCKING ||
              opponent.state === PlayerState.BLOCKING_CROUCH ||
              opponent.state === PlayerState.BLOCKING_AIR ||
              opponent.state === PlayerState.WALK_BACKWARD) &&
            isFacingAttacker;

          if (isBlocking) {
            opponent.takeDamage(10);
            opponent.guard -= 20;
            opponent.guardRegenTimer = GUARD_REGEN_DELAY;
            opponent.velocity.x = p.facingRight ? 10 : -10;
            p.comboType = "NONE";
            p.comboStep = 0;
            p.ataque = false;
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            engine.particleManager.spawn(
              "BLOCK",
              opponent.x,
              opponent.y + opponent.height / 2,
              5,
              "#60a5fa",
            );
          } else {
            p.comboStep = 1;
            p.animFrame = 0;
            p.animTimer = 0;
            p.animFinished = false;
            p.attackTimer = 180;
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.facingRight = opponent.pos.x > p.pos.x;
          }
        }
      } else if (p.comboStep === 1) {
        // 2. Aplica dano
        p.velocity.x = 0;
        p.velocity.y = 0;
        opponent.velocity.x = 0;
        opponent.velocity.y = 0;
        opponent.stunTimer = 15;
        opponent.gravityDisabledTimer = 15;

        // Keep aligned
        const sideOffset = p.facingRight ? 120 : -120;
        opponent.pos.x = p.pos.x + sideOffset;

        if (p.animFrame % 2 === 0 && p.animTimer === 0) {
          opponent.takeDamage(2);
          engine.particleManager.spawn(
            "IMPACT",
            opponent.pos.x,
            opponent.pos.y - opponent.height / 2,
            1,
          );
          if (engine.camera) engine.camera.addScreenShake(3, 3, "PERLIN", 1.0);
        }

        if (p.animFinished) {
          p.comboStep = 2;
          p.hasHit = false;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
        }
      } else if (p.comboStep === 2) {
        // 3. Lança oponente pro alto
        p.velocity.x = 0;
        p.velocity.y = 0;

        if (!p.hasHit && p.animFrame >= 1) {
          p.hasHit = true;
          opponent.takeDamage(10);
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 4.5 : -4.5; // diagonal
          opponent.velocity.y = -4.5; // arremessa pro alto
          engine.particleManager.spawn(
            "IMPACT",
            opponent.pos.x,
            opponent.pos.y - opponent.height / 2,
            2,
          );
          if (engine.camera) engine.camera.addScreenShake(8, 8, "IMPULSE", 1.0);
        }

        if (p.animFinished) {
          p.comboStep = 3;
          p.hasHit = false;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
        }
      } else if (p.comboStep === 3) {
        // 4. Personagem vai para cima do oponente aplicar dano e arremessar ele para baixo
        p.velocity.x = 0;
        p.velocity.y = 0;

        if (p.animFrame === 0 && p.animTimer === 0) {
          p.pos.x = opponent.pos.x;
          p.pos.y = Math.max(0, opponent.pos.y - 80); // vai pra cima dele
          engine.spawnAfterimageAt(p, p.x, p.y + 50);
        }

        if (p.animFrame >= 0 && !p.hasHit) {
          opponent.velocity.x = 0;
          opponent.velocity.y = 0; // stop falling
          opponent.stunTimer = 30;
          opponent.gravityDisabledTimer = 30;
        }

        if (!p.hasHit && p.animFrame >= 2) {
          p.hasHit = true;
          opponent.velocity.y = 12; // smash down hard
          opponent.velocity.x = p.facingRight ? 6 : -6; // diagonal fall
          opponent.takeDamage(15);
          engine.particleManager.spawn(
            "IMPACT",
            opponent.pos.x,
            opponent.pos.y - opponent.height / 2,
            3,
          );
          if (engine.camera)
            engine.camera.addScreenShake(12, 12, "IMPULSE", 1.0);
        }

        if (p.animFinished) {
          p.comboStep = 4;
          p.hasHit = false;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
        }
      } else if (p.comboStep === 4) {
        // 5. Personagem vai para baixo do Oponente e lança ele pro alto novamente
        p.velocity.x = 0;
        p.velocity.y = 0;

        if (p.animFrame === 0 && p.animTimer === 0) {
          p.pos.x = opponent.pos.x;
          p.pos.y = opponent.pos.y + 80; // vai pra baixo do oponente que está caindo
          engine.spawnAfterimageAt(p, p.x, p.y - 50);
        }

        if (p.animFrame >= 0 && !p.hasHit) {
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;
          opponent.stunTimer = 30;
          opponent.gravityDisabledTimer = 30;
          opponent.pos.y = p.pos.y - 80; // segurando
        }

        if (!p.hasHit && p.animFrame >= 2) {
          p.hasHit = true;
          opponent.velocity.x = p.facingRight ? 7 : -7; // diagonal up
          opponent.velocity.y = -10; // launched up again
          opponent.takeDamage(20);
          if (engine.camera)
            engine.camera.addScreenShake(15, 15, "IMPULSE", 1.2);
          engine.particleManager.spawn(
            "IMPACT",
            opponent.pos.x,
            opponent.pos.y - opponent.height / 2,
            4,
          );
        }

        if (p.animFinished || p.attackTimer <= 0) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.hasHit = false;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          opponent.stunTimer = 60;
          opponent.gravityDisabledTimer = 0;
        }
        p.attackTimer--;
      }
    } else if (
      p.comboType === "SPECIAL_2" &&
      p.data.id === "frieza_final" &&
      p.ataque
    ) {
      // Especial 2 – Freeza
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 15; // Desativa a gravidade durante a execução do especial

      if (p.comboStep === 0) {
        // Fase 1: O personagem permanece completamente parado durante a fase 1 (Especial_2_1).
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;

          // Inicializa o processo em background para spawnar os feixes
          p["frieza_sp2_beam_count"] = 0;
          p["frieza_sp2_timer"] = 0;
          p["frieza_sp2_initial_y"] = p.pos ? p.pos.y : p.y; // Salva a posição Y exata no momento de criação
        }
      } else if (p.comboStep === 1) {
        // Fase 2: O personagem permanece parado executando a animação de ataque (Especial_2_2) apenas até ela ser finalizada.
        if (p.animFinished) {
          // Libera o personagem imediatamente assim que a animação finaliza!
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
        }
      }
      p.attackTimer--;
    } else if (
      p.comboType === "SPECIAL_2" &&
      p.data.id === "gogeta_ssj4" &&
      p.ataque
    ) {
      // Especial 2 – Gogeta SSJ4
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 15; // disable gravity during special execution

      if (p.comboStep === 0) {
        // Fase 1: O personagem permanece parado executando a animação inicial do golpe (Especial_2_1).
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["ssj4_spec2_teleported"] = undefined;
          p["ssj4_spec2_hit"] = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: O personagem se teleporta para as costas do oponente (Especial_2_2).
        if (p["ssj4_spec2_teleported"] !== 1) {
          p["ssj4_spec2_teleported"] = 1;
          const backOffset = opponent.facingRight ? -110 : 110;
          p.pos.x = opponent.pos.x + backOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        // Ao final da animação, utilizar a hitbox do personagem para detectar colisão.
        if (!p["ssj4_spec2_hit"] && p.animFrame >= 3) {
          const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

          if (isContacting) {
            p["ssj4_spec2_hit"] = true;
            opponent.takeDamage(12);
            // Após o impacto, o oponente é lançado horizontalmente para longe.
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 20 : -20;
            opponent.velocity.y = -2;
            opponent.stunTimer = 45;

            if (engine.camera) engine.camera.addScreenShake(12, 8, "IMPULSE", 0.8);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 3);
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["ssj4_spec2_teleported"] = undefined;
          p["ssj4_spec2_hit"] = false;
        }
      } else if (p.comboStep === 2) {
        // Fase 3: O personagem aparece nas costas do oponente (Especial_2_3).
        if (p["ssj4_spec2_teleported"] !== 2) {
          p["ssj4_spec2_teleported"] = 2;
          const backOffset = opponent.facingRight ? -110 : 110;
          p.pos.x = opponent.pos.x + backOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          // Parar a velocidade horizontal acumulada do oponente brevemente para conectar perfeitamente
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        // Ao final da animação, utilizar a hitbox do personagem para detectar colisão.
        if (!p["ssj4_spec2_hit"] && p.animFrame >= 4) {
          const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

          if (isContacting) {
            p["ssj4_spec2_hit"] = true;
            opponent.takeDamage(14);
            // Após o impacto, o oponente é lançado para cima em trajetória diagonal.
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 10 : -10;
            opponent.velocity.y = -16;
            opponent.stunTimer = 50;

            if (engine.camera) engine.camera.addScreenShake(14, 10, "IMPULSE", 0.9);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 3);
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          p.comboStep = 3;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["ssj4_spec2_teleported"] = undefined;
          p["ssj4_spec2_hit"] = false;
        }
      } else if (p.comboStep === 3) {
        // Fase 4: O personagem se teleporta para acima do oponente (Especial_2_4).
        if (p["ssj4_spec2_teleported"] !== 3) {
          p["ssj4_spec2_teleported"] = 3;
          p.pos.x = opponent.pos.x;
          p.pos.y = opponent.pos.y - 120;
          p.facingRight = opponent.pos.x > p.pos.x;

          // Parar temporariamente para conectar o golpe final de cima para baixo
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        // Ao final da animação, utilizar a hitbox do personagem para detectar colisão.
        if (!p["ssj4_spec2_hit"] && p.animFrame >= 1) {
          const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

          if (isContacting) {
            p["ssj4_spec2_hit"] = true;
            opponent.takeDamage(18);
            // Após o impacto, o oponente é lançado para baixo.
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 4 : -4;
            opponent.velocity.y = 22; // arremessa pra baixo forte
            opponent.stunTimer = 60;

            if (engine.camera) engine.camera.addScreenShake(18, 14, "IMPULSE", 1.2);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 4);
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          p["ssj4_spec2_teleported"] = undefined;
          p["ssj4_spec2_hit"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_4" &&
      p.data.id === "gogeta_ssj4" &&
      p.ataque
    ) {
      // Especial 4 – Gogeta SSJ4
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        // Fase 1: O personagem permanece parado executando a animação inicial do golpe.
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: O personagem se teleporta para a frente do oponente.
        // Após o teleporte, criar uma hitbox de ataque. Caso o oponente colida com a hitbox, receberá dano. Após o impacto, o oponente é lançado para cima em trajetória diagonal.
        if (p["ssj4_spec4_teleported"] !== 1) {
          p["ssj4_spec4_teleported"] = 1;
          const frontOffset = opponent.facingRight ? 110 : -110;
          p.pos.x = opponent.pos.x + frontOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting && !p["ssj4_spec4_hit_fase2"]) {
          p["ssj4_spec4_hit_fase2"] = true;
          opponent.takeDamage(15);
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 20 : -20;
          opponent.velocity.y = -22; // Trajetória diagonal para cima
          opponent.stunTimer = 60;
          if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.6);
          try {
            AudioManager.getInstance().playSFX("heavy_hit");
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 4);
          } catch (e) {}
        }

        if (p.animFinished) {
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 2) {
        // Fase 3: O personagem se teleporta para as costas do oponente.
        if (p["ssj4_spec4_teleported"] !== 2) {
          p["ssj4_spec4_teleported"] = 2;
          const backOffset = opponent.facingRight ? -110 : 110;
          p.pos.x = opponent.pos.x + backOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        if (p.animFinished) {
          p.comboStep = 3;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 3) {
        // Fase 4: O personagem desfere o golpe final (Especial_4_4), esmagando o oponente contra o chão.
        const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting && !p["ssj4_spec4_hit_fase4"]) {
          p["ssj4_spec4_hit_fase4"] = true;
          opponent.takeDamage(25); // Dano do golpe final
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 10 : -10;
          opponent.velocity.y = 28; // Empurra violentamente para BAIXO!
          opponent.stunTimer = 60;
          if (engine.camera) engine.camera.addScreenShake(20, 10, "IMPULSE", 0.9);
          try {
            AudioManager.getInstance().playSFX("heavy_hit");
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 5);
          } catch (e) {}
        }

        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          p["ssj4_spec4_teleported"] = undefined;
          p["ssj4_spec4_hit_fase2"] = undefined;
          p["ssj4_spec4_hit_fase4"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_3" &&
      p.data.id === "teen_gohan_ssj2" &&
      p.ataque
    ) {
      // Especial 3 – Gohan Teen
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        // Fase 1: O personagem permanece parado executando a animação inicial do golpe.
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: O personagem permanece parado. Utilizar a hitbox do personagem.
        const hasCollided = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (hasCollided) {
          opponent.state = PlayerState.STUNNED;
          opponent.stunTimer = 15;
          if (engine.frameCount % 5 === 0) {
            opponent.takeDamage(4);
            if (engine.camera) engine.camera.addScreenShake(4, 2, "PERLIN", 0.15);
            try {
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, false);
              engine.particleManager.spawn("HIT", opponent.pos.x + (Math.random() - 0.5) * 40, opponent.pos.y - 50, 1, "#a855f7");
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 2) {
        // Fase 3: O personagem permanece parado executando a animação final do golpe. Encerrar o Especial ao término da animação.
        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
        }
      }
    } else if (
      p.comboType === "SPECIAL_2" &&
      p.data.id === "goku_ssj" &&
      p.ataque
    ) {
      // Especial 2 – Goku SSJ
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 15; // disable gravity during special execution

      if (p.comboStep === 0) {
        // Fase 1: O personagem se teleporta para as costas do oponente e cria uma hitbox de dano no início da animação. Caso o oponente colida com a hitbox, recebe dano e, ao término da animação, é lançado na diagonal para cima.
        if (p["goku_ssj_sp2_teleported1"] !== true) {
          p["goku_ssj_sp2_teleported1"] = true;
          const backOffset = opponent.facingRight ? -110 : 110;
          p.pos.x = opponent.pos.x + backOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        // Utilizar a hitbox do personagem para detectar colisão
        if (!p["goku_ssj_sp2_hit1"]) {
          const isHit = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

          if (isHit) {
            p["goku_ssj_sp2_hit1"] = true;
            opponent.takeDamage(12);
            opponent.state = PlayerState.STUNNED;
            opponent.stunTimer = 15;
            opponent.velocity.x = 0;
            opponent.velocity.y = 0;

            if (engine.camera) engine.camera.addScreenShake(12, 8, "IMPULSE", 0.8);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 3);
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          if (p["goku_ssj_sp2_hit1"]) {
            // Lançado na diagonal para cima
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 12 : -12;
            opponent.velocity.y = -20;
            opponent.stunTimer = 45;

            if (engine.camera) engine.camera.addScreenShake(15, 10, "IMPULSE", 0.9);
            try {
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 4);
            } catch (e) {}
          }

          p.comboStep = 1; // Avançar para o curto intervalo
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 1) {
        // Aguarda um curto intervalo para o oponente ser afastado corretamente
        if (!p["goku_ssj_sp2_timer"]) p["goku_ssj_sp2_timer"] = 0;
        p["goku_ssj_sp2_timer"]++;

        if (p["goku_ssj_sp2_timer"] >= 15) {
          p["goku_ssj_sp2_timer"] = undefined;
          p.comboStep = 2; // Avançar para Fase 2
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 2) {
        // Fase 2: o personagem se teleporta novamente para as costas do oponente e cria uma hitbox de dano no início da animação. Caso o oponente colida com a hitbox, recebe dano e, ao término da animação, é lançado na horizontal.
        if (p["goku_ssj_sp2_teleported2"] !== true) {
          p["goku_ssj_sp2_teleported2"] = true;
          const backOffset = opponent.facingRight ? -110 : 110;
          p.pos.x = opponent.pos.x + backOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          // Parar velocidade do oponente brevemente para conectar perfeitamente
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;

          try {
            AudioManager.getInstance().playSFX("teleport");
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}
        }

        // Utilizar a hitbox do personagem para detectar colisão
        if (!p["goku_ssj_sp2_hit2"]) {
          const isHit = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

          if (isHit) {
            p["goku_ssj_sp2_hit2"] = true;
            opponent.takeDamage(15);
            opponent.state = PlayerState.STUNNED;
            opponent.stunTimer = 15;
            opponent.velocity.x = 0;
            opponent.velocity.y = 0;

            if (engine.camera) engine.camera.addScreenShake(14, 10, "IMPULSE", 0.9);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 4);
            } catch (e) {}
          }
        }

        if (p.animFinished) {
          if (p["goku_ssj_sp2_hit2"]) {
            // Lançado na horizontal ao término da animação
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 24 : -24;
            opponent.velocity.y = -2;
            opponent.stunTimer = 50;

            if (engine.camera) engine.camera.addScreenShake(20, 14, "IMPULSE", 1.2);
            try {
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 5);
            } catch (e) {}
          }

          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;

          p["goku_ssj_sp2_hit1"] = undefined;
          p["goku_ssj_sp2_hit2"] = undefined;
          p["goku_ssj_sp2_teleported1"] = undefined;
          p["goku_ssj_sp2_teleported2"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_3" &&
      p.data.id === "goku_ssj" &&
      p.ataque
    ) {
      // Especial 3 – Goku SSJ
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;

      if (p.comboStep === 0) {
        // Fase 1: Personagem permanece parado executando a animação inicial.
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: Personagem permanece parado dando continuidade à animação de preparação.
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 2;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 2) {
        // Fase 3: Personagem permanece parado, mantendo a sequência da animação.
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 3;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 3) {
        // Fase 4: Personagem permanece parado finalizando a preparação do golpe.
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 4;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 4) {
        // Fase 5: O personagem avança continuamente em linha reta em direção ao oponente, mantendo o avanço até ocorrer a colisão com o alvo, sem impor limites de tempo ou distância.
        p.facingRight = p.pos.x < opponent.pos.x;
        const speed = 28;
        p.velocity.x = p.facingRight ? speed : -speed;
        p.velocity.y = 0;

        // Impede que o avanço termine automaticamente por animação terminada antes da colisão
        p.animFinished = false;

        // Detectar colisão com o oponente utilizando a hitbox do personagem
        const isColliding = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isColliding) {
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.comboStep = 5; // Avançar para Fase 6
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["goku_ssj_sp3_hit"] = false;
        }
      } else if (p.comboStep === 5) {
        // Fase 6: Cria uma hitbox de dano à frente do personagem. Caso o oponente colida com a hitbox, recebe dano e, ao término da animação, é lançado na diagonal para cima.
        p.velocity.x = 0;
        p.velocity.y = 0;

        // Utilizar a hitbox do personagem para detectar colisão
        const isHit = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isHit) {
          opponent.state = PlayerState.STUNNED;
          opponent.stunTimer = 15;
          opponent.velocity.x = 0;
          opponent.velocity.y = 0;
          p["goku_ssj_sp3_hit"] = true;

          if (engine.frameCount % 5 === 0 && opponent.invincibleTimer <= 0) {
            opponent.takeDamage(4);
            if (engine.camera) engine.camera.addScreenShake(6, 3, "PERLIN", 0.15);
            try {
              engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, false);
              engine.particleManager.spawn("HIT", opponent.pos.x + (Math.random() - 0.5) * 30, opponent.pos.y - 50, 1, "#eab308");
            } catch (err) {}
          }
        }

        if (p.animFinished) {
          if (p["goku_ssj_sp3_hit"]) {
            // Lançar na diagonal para cima ao término da animação
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = p.facingRight ? 18 : -18;
            opponent.velocity.y = -22;
            opponent.stunTimer = 45;

            if (engine.camera) engine.camera.addScreenShake(25, 15, "IMPULSE", 1.2);
            try {
              engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 5);
            } catch (err) {}
          }

          p.comboStep = 6; // Avançar para Fase 7
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 6) {
        // Fase 7: Personagem permanece parado executando a animação final de recuperação, encerrando completamente o Especial.
        p.velocity.x = 0;
        p.velocity.y = 0;

        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          p["goku_ssj_sp3_hit"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_2" &&
      p.data.id === "broly_ikari" &&
      p.ataque
    ) {
      // Sequencia Especial 2 Broly-Ikari (5-fase custom physics implementation - Anteriormente Especial 3)
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;

      if (p.comboStep === 0) {
        // Fase 1: Broly permanece parado executando a animação da Fase 1 (ESPECIAL_2_1)
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 1; // Avança obrigatoriamente para a Fase 2
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: Broly permanece parado executando a animação da Fase 2 (ESPECIAL_2_2)
        p.velocity.x = 0;
        p.velocity.y = 0;
        if (p.animFinished) {
          p.comboStep = 2; // Avança obrigatoriamente para a Fase 3
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["broly_sp2_timer"] = 0; // Temporizador de 1 segundo para a investida
        }
      } else if (p.comboStep === 2) {
        // Fase 3: Broly avança em linha reta na direção para a qual está olhando (ESPECIAL_2_3)
        if (p["broly_sp2_timer"] === undefined) {
          p["broly_sp2_timer"] = 0;
        }

        const speed = 32;
        p.velocity.x = p.facingRight ? speed : -speed;
        p.velocity.y = 0;

        // Checar colisão física com o oponente utilizando a hitbox do personagem
        const isColliding = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isColliding) {
          // Colisão com o oponente interrompe o avanço imediatamente e avança para a Fase 4
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.comboStep = 3; // Avança obrigatoriamente para a Fase 4
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["broly_sp2_timer"] = undefined;
          p["broly_sp2_hit_applied"] = false;
        } else {
          p["broly_sp2_timer"]++;
          if (p["broly_sp2_timer"] >= 60) {
            // Se passar de 1 segundo (60 frames) sem colisão, o especial é cancelado imediatamente
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.comboType = "NONE";
            p.comboStep = 0;
            p.ataque = false;
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p["broly_sp2_timer"] = undefined;
            p["broly_sp2_hit_applied"] = undefined;
          }
        }
      } else if (p.comboStep === 3) {
        // Fase 4: Broly permanece parado e uma hitbox é criada exclusivamente nesta fase
        p.velocity.x = 0;
        p.velocity.y = 0;

        // Utilizar a hitbox do personagem para detectar colisão
        const isHit = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isHit && !p["broly_sp2_hit_applied"]) {
          p["broly_sp2_hit_applied"] = true;

          // Dano é aplicado
          opponent.takeDamage(25);

          // O oponente é lançado para longe em uma trajetória diagonal para cima
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 35 : -35;
          opponent.velocity.y = -20;
          opponent.stunTimer = 45;

          if (engine.camera) engine.camera.addScreenShake(30, 20, "IMPULSE", 1.5);
          try {
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 7);
          } catch (err) {}
        }

        // Ao término da animação da Fase 4, avança obrigatoriamente para a Fase 5
        if (p.animFinished) {
          p.comboStep = 4; // Fase 5
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
        }
      } else if (p.comboStep === 4) {
        // Fase 5: Broly permanece parado executando a animação final (ESPECIAL_2_5)
        p.velocity.x = 0;
        p.velocity.y = 0;

        // Ao término da animação, o especial é encerrado e Broly retorna ao estado normal
        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          p["broly_sp2_hit_applied"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_3" &&
      p.data.id === "broly_ikari" &&
      p.ataque
    ) {
      // Sequencia Especial 3 Broly Akari (Ikari) - Anteriormente Especial 4
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      
      // Permanecer imóvel nas fases 1, 2 e 3 (comboStep < 3)
      if (p.comboStep < 3) {
        p.velocity.x = 0;
        p.velocity.y = 0;
      }

      if (p.comboStep === 0) {
        // Fase 1: Sobe verticalmente em direção ao céu até estar acima da posição do oponente
        // Mantém sua posição X durante toda a subida
        p.facingRight = p.pos.x < opponent.pos.x;
        const targetY = Math.max(80, opponent.pos.y - 180);

        if (p.pos.y > targetY) {
          p.pos.y -= 7; // Sobe verticalmente suavemente
          if (p.pos.y <= targetY) {
            p.pos.y = targetY; // Interrompe imediatamente ao atingir a altura
          }
          if (engine.frameCount % 4 === 0) {
            try {
              engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y, 2);
            } catch (e) {}
          }
        } else {
          p.pos.y = targetY;
        }

        // Ao atingir a altura definida, permanece parado no ar.
        // Ao término da animação (Especial_3_1), avança obrigatoriamente para a Fase 2.
        if (p.pos.y <= targetY && p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["broly_special3_timer"] = 0;
          p["broly_wave1_spawned"] = false;
          p["broly_wave2_spawned"] = false;
          p["broly_wave3_spawned"] = false;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: Suspenso no ar, loop da animação Especial_3_2 ativo
        p.animFinished = false; // Garante que a animação continue em loop e não auto-finalize durante toda a fase 2

        if (p["broly_special3_timer"] === undefined) {
          p["broly_special3_timer"] = 0;
        }

        const timer = p["broly_special3_timer"];
        const FIRST_BURST_DELAY = 10;
        const RAJADA_INTERVAL = 30; // Intervalo configurável entre ondas em frames (ex: 30 frames ≈ 0.5s)
        const WAVE_END_DELAY = 20;  // Tempo após a terceira onda para encerrar a Fase 2

        const ownerId = p === engine.player1 ? "p1" : "p2";
        
        // Origem no centro da hitbox de receber dano do personagem Broly
        const bHitbox = p.hitbox;
        const spawnX = bHitbox.x + bHitbox.width / 2;
        const spawnY = bHitbox.y + bHitbox.height / 2;
        const projSpeed = 12; // Velocidade dos projéteis

        // Primeira onda: cria simultaneamente 4 projéteis nas direções Right, Left, Up, Down exatamente no mesmo frame
        if (timer === FIRST_BURST_DELAY && !p["broly_wave1_spawned"]) {
          p["broly_wave1_spawned"] = true;
          const directions = [
            { x: 1, y: 0 },   // Right
            { x: -1, y: 0 },  // Left
            { x: 0, y: -1 },  // Up
            { x: 0, y: 1 }    // Down
          ];
          directions.forEach(dir => {
            const vx = dir.x * projSpeed;
            const vy = dir.y * projSpeed;
            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              "#22c55e",
              false,
              "CHAVE_PROJETIL_17",
              undefined,
              undefined,
              0, // customOffsetX = 0 (descarta offset padrão do sistema)
              0, // customOffsetY = 0 (descarta offset padrão do sistema)
              undefined,
              undefined,
              "STRAIGHT"
            );
            proj.vy = vy;
            proj.behavior = "STRAIGHT";
            proj.sourcePlayer = p;

            // Força offsets nulos para evitar carregar deslocamentos da configuração de CHAVE_PROJETIL_17
            proj.sourceAnimConfig = {
              projectileConfig: {
                middle: {
                  offsetX: 0,
                  offsetY: 0
                }
              },
              beamConfig: {
                middle: {
                  offsetX: 0,
                  offsetY: 0
                }
              }
            };

            // Ajusta x e y para que o centro físico do projétil fique exatamente no meio (centro) do Broly
            proj.x = spawnX - proj.width / 2;
            proj.y = spawnY - proj.height / 2;

            engine.projectiles.push(proj);
          });

          try {
            engine.camera?.addScreenShake(10, 5, "PERLIN", 0.4);
            AudioManager.getInstance().playSFX("attack");
          } catch (e) {}
        }

        // Segunda onda: cria simultaneamente 4 projéteis nas direções Up-Right, Up-Left, Down-Right, Down-Left exatamente no mesmo frame
        else if (timer === FIRST_BURST_DELAY + RAJADA_INTERVAL && !p["broly_wave2_spawned"]) {
          p["broly_wave2_spawned"] = true;
          const directions = [
            { x: 0.7071, y: -0.7071 },  // Up-Right
            { x: -0.7071, y: -0.7071 }, // Up-Left
            { x: 0.7071, y: 0.7071 },   // Down-Right
            { x: -0.7071, y: 0.7071 }   // Down-Left
          ];
          directions.forEach(dir => {
            const vx = dir.x * projSpeed;
            const vy = dir.y * projSpeed;
            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              "#22c55e",
              false,
              "CHAVE_PROJETIL_17",
              undefined,
              undefined,
              0, // customOffsetX = 0 (descarta offset padrão do sistema)
              0, // customOffsetY = 0 (descarta offset padrão do sistema)
              undefined,
              undefined,
              "STRAIGHT"
            );
            proj.vy = vy;
            proj.behavior = "STRAIGHT";
            proj.sourcePlayer = p;
            proj.sourceAnimConfig = { projectileConfig: { middle: { offsetX: 0, offsetY: 0 } }, beamConfig: { middle: { offsetX: 0, offsetY: 0 } } };
            proj.x = spawnX - proj.width / 2;
            proj.y = spawnY - proj.height / 2;
            engine.projectiles.push(proj);
          });
          try {
            engine.camera?.addScreenShake(10, 5, "PERLIN", 0.4);
            AudioManager.getInstance().playSFX("attack");
          } catch (e) {}
        }

        // Terceira onda: cria simultaneamente 4 projéteis nas direções Right, Left, Up, Down exatamente no mesmo frame
        else if (timer === FIRST_BURST_DELAY + 2 * RAJADA_INTERVAL && !p["broly_wave3_spawned"]) {
          p["broly_wave3_spawned"] = true;
          const directions = [
            { x: 1, y: 0 },   // Right
            { x: -1, y: 0 },  // Left
            { x: 0, y: -1 },  // Up
            { x: 0, y: 1 }    // Down
          ];
          directions.forEach(dir => {
            const vx = dir.x * projSpeed;
            const vy = dir.y * projSpeed;
            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              "#22c55e",
              false,
              "CHAVE_PROJETIL_17",
              undefined,
              undefined,
              0, // customOffsetX = 0 (descarta offset padrão do sistema)
              0, // customOffsetY = 0 (descarta offset padrão do sistema)
              undefined,
              undefined,
              "STRAIGHT"
            );
            proj.vy = vy;
            proj.behavior = "STRAIGHT";
            proj.sourcePlayer = p;
            proj.sourceAnimConfig = { projectileConfig: { middle: { offsetX: 0, offsetY: 0 } }, beamConfig: { middle: { offsetX: 0, offsetY: 0 } } };
            proj.x = spawnX - proj.width / 2;
            proj.y = spawnY - proj.height / 2;
            engine.projectiles.push(proj);
          });
          try {
            engine.camera?.addScreenShake(10, 5, "PERLIN", 0.4);
            AudioManager.getInstance().playSFX("attack");
          } catch (e) {}
        }

        p["broly_special3_timer"]++;

        // A Fase 2 somente pode ser encerrada após a criação completa da terceira e última onda de projéteis e o tempo configurado (WAVE_END_DELAY)
        if (timer >= FIRST_BURST_DELAY + 2 * RAJADA_INTERVAL + WAVE_END_DELAY && p["broly_wave3_spawned"]) {
          p.comboStep = 2; // Transição para Fase 3 (Especial_3_3)
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["broly_special3_timer"] = undefined;
          p["broly_wave1_spawned"] = undefined;
          p["broly_wave2_spawned"] = undefined;
          p["broly_wave3_spawned"] = undefined;
        }
      } else if (p.comboStep === 2) {
        // Fase 3: Broly permanece parado no ar. Nenhum projétil pode ser criado nesta fase.
        // Ao término da animação (Especial_3_3), o especial é finalizado e Broly retorna ao estado normal.
        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
        }
      }
    } else if (
      p.comboType === "SPECIAL_4" &&
      p.data.id === "teen_gohan_ssj2" &&
      p.ataque
    ) {
      // Especial 4 – Gohan Teen
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.x = 0;
      p.velocity.y = 0;

      if (p.comboStep === 0) {
        // Fase 1: Utilizar a hitbox do personagem para detectar colisão.
        const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting && !p["gohan_special4_hit_phase1"]) {
          p["gohan_special4_hit_phase1"] = true;
          opponent.takeDamage(18);
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 18 : -18;
          opponent.velocity.y = -18; // Trajetória diagonal para cima
          opponent.stunTimer = 60;

          if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.6);
          try {
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 4);
          } catch (e) {}
        }

        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p["gohan_special4_hit_phase1"] = undefined;
        }
      } else if (p.comboStep === 1) {
        // Fase 2: O personagem se teleporta para uma das laterais do oponente. Após o teleporte, criar uma nova hitbox. Caso o oponente colida com a hitbox, receberá dano. Após o impacto, o oponente é lançado para longe na horizontal.
        if (!p["gohan_special4_teleported_phase2"]) {
          const sideOffset = opponent.facingRight ? -100 : 100;
          p.pos.x = opponent.pos.x + sideOffset;
          p.pos.y = opponent.pos.y;
          p.facingRight = p.pos.x < opponent.pos.x;

          try {
            engine.particleManager.spawn("SPEED_LINES", p.pos.x, p.pos.y - 50, 5);
          } catch (e) {}

          p["gohan_special4_teleported_phase2"] = true;
        }

        const isContacting = CollisionHelper.testAABB(p.hitbox, opponent.hitbox);

        if (isContacting && !p["gohan_special4_hit_phase2"]) {
          p["gohan_special4_hit_phase2"] = true;
          opponent.takeDamage(22);
          opponent.state = PlayerState.LAUNCHED;
          opponent.isGrounded = false;
          opponent.velocity.x = p.facingRight ? 35 : -35; // Lançado longe na horizontal
          opponent.velocity.y = -3;
          opponent.stunTimer = 60;

          if (engine.camera) engine.camera.addScreenShake(20, 12, "IMPULSE", 0.9);
          try {
            engine.particleManager.spawnHitSpark(opponent.pos.x, opponent.pos.y - 50, true);
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 6);
          } catch (e) {}
        }

        if (p.animFinished) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.animFinished = false;
          p["gohan_special4_teleported_phase2"] = undefined;
          p["gohan_special4_hit_phase2"] = undefined;
        }
      }
    } else if (
      p.comboType === "SPECIAL_4" &&
      p.data.id === "gogeta_blue" &&
      p.ataque
    ) {
      // Sequencia especial 4 Gogeta Blue
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;
      p.velocity.y = 0; // maintain height

      if (p.comboStep === 0) {
        // 1. Preparando
        p.velocity.x = 0;
        if (p.animFinished) {
          p.comboStep = 1;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
        }
      } else if (p.comboStep === 1) {
        // 2. Indo atrás do oponente loop
        const dx = opponent.pos.x - p.pos.x;
        const dy = opponent.pos.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 25; // rushing speed
        if (dist > 120) {
          p.velocity.x = (dx / dist) * speed;
          p.velocity.y = (dy / dist) * speed;
          engine.spawnAfterimageAt(p, p.x, p.y);
          if (engine.frameCount % 3 === 0) {
            engine.particleManager.spawn(
              "SPEED_LINES",
              p.pos.x,
              p.pos.y - p.height / 2,
              2,
            );
          }
        } else {
          const isFacingAttacker =
            (p.facingRight && !opponent.facingRight) ||
            (!p.facingRight && opponent.facingRight);
          const isBlocking =
            (opponent.state === PlayerState.BLOCKING ||
              opponent.state === PlayerState.BLOCKING_CROUCH ||
              opponent.state === PlayerState.BLOCKING_AIR ||
              opponent.state === PlayerState.WALK_BACKWARD) &&
            isFacingAttacker;

          if (isBlocking) {
            opponent.takeDamage(10);
            opponent.guard -= 20;
            opponent.guardRegenTimer = GUARD_REGEN_DELAY;
            opponent.velocity.x = p.facingRight ? 10 : -10;
            p.comboType = "NONE";
            p.comboStep = 0;
            p.ataque = false;
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            engine.particleManager.spawn(
              "BLOCK",
              opponent.x,
              opponent.y + opponent.height / 2,
              5,
              "#60a5fa",
            );
          } else {
            p.comboStep = 2;
            p.animFrame = 0;
            p.animTimer = 0;
            p.animFinished = false;
            p.attackTimer = 180;
            p.velocity.x = 0;
            p.velocity.y = 0;
            // Face the opponent right before jump
            p.facingRight = opponent.pos.x > p.pos.x;
          }
        }
      } else if (p.comboStep === 2) {
        // 3. Salta por cima do oponente indo para as costas dele
        let animKey = resolveAnimationKey(p.data.id, p.state, p.comboType, p.comboStep, p.ataque, undefined, undefined, undefined, 1, p.isGrounded, false, false, p.data.spriteConfig);
        let anim = p.data.spriteConfig?.animations[animKey];
        if (!anim) {
            anim = p.data.spriteConfig?.animations["SPECIAL_4_3"] || p.data.spriteConfig?.animations["Especial_4_3"] || p.data.spriteConfig?.animations["especial_4_3"];
        }
        const totalFrames = anim?.frames || 10;

        opponent.velocity.x = 0;
        opponent.velocity.y = 0;
        // We stun them slightly here so they don't break out easily
        opponent.stunTimer = 15;
        opponent.gravityDisabledTimer = 15;

        if (p.animFrame < totalFrames - 1) {
          // Calculate progress 0 to 1
          const progress = Math.min(
            1,
            p.animFrame / Math.max(1, totalFrames - 2),
          );
          // Start with a small jump upward (-7) and curve downward (to +5)
          p.velocity.y = -7 + progress * 12;

          const sideOffset = opponent.facingRight ? -130 : 130;
          const targetX = opponent.pos.x + sideOffset;
          const framesLeft = Math.max(1, totalFrames - 1 - p.animFrame);
          p.velocity.x = (targetX - p.pos.x) / framesLeft;
        } else {
          p.velocity.x = 0;
          p.velocity.y = 0;
          const sideOffset = opponent.facingRight ? -130 : 130;
          p.pos.x = opponent.pos.x + sideOffset;
          p.facingRight = opponent.pos.x > p.pos.x;
        }

        if (p.animFinished || p.animFrame >= totalFrames - 1) {
          p.comboStep = 3;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 180;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.facingRight = opponent.pos.x > p.pos.x;
        }
      } else if (p.comboStep === 3) {
        // 4. Lança especial (PREP)
        p.velocity.x = 0;
        p.velocity.y = 0;
        opponent.velocity.x = 0;
        opponent.velocity.y = 0;
        opponent.stunTimer = 30;
        if (p.animFinished) {
          p.comboStep = 4;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = 90;

          // Fire Projectile 1!
          const finalKiX = p.data.spriteConfig?.kiOriginX ?? 76;
          const finalKiY = p.data.spriteConfig?.kiOriginY ?? 125;
          let spawnX = p.facingRight ? p.x + finalKiX : p.x + p.width - finalKiX - 30; // 30 is width fallback/or default
          let spawnY = p.y + finalKiY;
          const velX = p.facingRight ? 35 : -35;
          const ownerId = p === engine.player1 ? "p1" : "p2";
          engine.projectiles.push(
            // @ts-ignore
            Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              false,
              "FECHO_DE_ENERGIA_1",
              undefined,
              undefined,
              undefined,
              undefined,
              1,
              35,
            ),
          );
        }
      } else if (p.comboStep === 4) {
        // 5. Lança especial (FIRE 2)
        p.velocity.x = 0;
        p.velocity.y = 0;

        // Fire Projectile 2 maybe at specific frame?
        if (p.animFrame === 5) {
          const finalKiX = p.data.spriteConfig?.kiOriginX ?? 76;
          const finalKiY = p.data.spriteConfig?.kiOriginY ?? 125;
          let spawnX = p.facingRight ? p.x + finalKiX : p.x + p.width - finalKiX - 30; // 30 is width fallback/or default
          let spawnY = p.y + finalKiY + 20;
          const velX = p.facingRight ? 35 : -35;
          const ownerId = p === engine.player1 ? "p1" : "p2";
          engine.projectiles.push(
            // @ts-ignore
            Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              false,
              "FECHO_DE_ENERGIA_1",
              undefined,
              undefined,
              undefined,
              undefined,
              1,
              35,
            ),
          );
        }

        if (p.animFinished || p.attackTimer <= 0) {
          p.comboType = "NONE";
          p.comboStep = 0;
          p.ataque = false;
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        }
        p.attackTimer--;
      }
    } else if (p.state === PlayerState.DRAGON_COMBO) {
      p.invincibleTimer = 10;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.ataque = false;
      p.comboType = "NONE";
      
      let animKey = resolveAnimationKey(p.data.id, p.state, p.comboType, p.comboStep, p.ataque, undefined, undefined, undefined, 1, p.isGrounded, false, false, p.data.spriteConfig);
      let anim = p.data.spriteConfig?.animations[animKey];
      if (!anim) {
          animKey = p.comboStep === 1 ? "dragon_rush_3" : "dragon_rush_2";
          anim = p.data.spriteConfig?.animations[animKey];
      }
      if (!anim) anim = p.data.spriteConfig?.animations[PlayerState.DRAGON_COMBO];
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;

      // Ensure opponent is also fully suppressed
      opponent.invincibleTimer = 10;
      opponent.velocity.x = 0;
      opponent.velocity.y = 0;
      opponent.ataque = false;
      opponent.comboType = "NONE";
      opponent.gravityDisabledTimer = 10;
      opponent.state = PlayerState.HIT;
      opponent.stunTimer = 80;

      const lockPos = (p as any)["dragonRushPhase2LockPos"] || { x: p.pos.x, y: p.pos.y };

      // Trava de posição na colisão original (FASES 2 e 3)
      // O teleporte ocorre na transição para comboStep 2, então paramos de travar aqui.
      if (p.comboStep < 2) {
        p.pos.x = lockPos.x;
        p.pos.y = lockPos.y;
      }

      if (p.comboStep === 0) {
        // FASE 2: Ambos travados na posição de colisão.
        if (p.dragonComboTimer && p.dragonComboTimer % 15 === 0 && p.dragonComboTimer < 60) {
          opponent.takeDamage(4);
          try {
            AudioManager.getInstance().playSFX("hit_medium");
            engine.particleManager.spawn("HIT", opponent.pos.x, opponent.pos.y - 50, 3);
          } catch (e) {}
        }
        const overlap = 25;
        const targetX = p.facingRight
          ? (p.x + p.width) + opponent.width / 2 - overlap
          : p.x - opponent.width / 2 + overlap;

        opponent.pos.x = targetX;
        opponent.pos.y = lockPos.y;
        opponent.facingRight = !p.facingRight;
        
        p.gravityDisabledTimer = 10;
        opponent.gravityDisabledTimer = 10;

        if (!p.dragonComboTimer) p.dragonComboTimer = 0;
        p.dragonComboTimer++;

        if (p.animFinished || p.dragonComboTimer >= 80) {
          // Final strike damage before transitioning to Phase 3 pose
          opponent.takeDamage(15);
          try {
            AudioManager.getInstance().playSFX("hit_heavy");
            engine.particleManager.spawn("IMPACT", opponent.pos.x, opponent.pos.y - 50, 5);
          } catch (e) {}

          p.comboStep = 1; 
          p.dragonComboTimer = 0;
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;

          // Definir trajetoria de fixação para o oponente na Fase 3
          (p as any)["dragonRushStartPos"] = { x: opponent.pos.x, y: opponent.pos.y };
          const offsetDir = p.facingRight ? 1 : -1;
          (p as any)["dragonRushTargetPos"] = { 
              x: p.pos.x + offsetDir * 180, 
              y: p.pos.y - 120 
          };
          
          try {
            AudioManager.getInstance().playSFX("dragon_rush_combo");
          } catch (e) {}
        }
      } else if (p.comboStep === 1) {
        // FASE 3: Transição e Posição Final (Sem dano adicional)
        const startPos = (p as any)["dragonRushStartPos"];
        const targetPos = (p as any)["dragonRushTargetPos"];
        
        if (startPos && targetPos) {
           const duration = 5; // Velocidade aumentada significativamente (+0.4 speed approx)
           const t = Math.min(1, p.dragonComboTimer / duration);
           opponent.pos.x = startPos.x + (targetPos.x - startPos.x) * t;
           opponent.pos.y = startPos.y + (targetPos.y - startPos.y) * t;
           
           // Oponente deve estar em estado de hit enquanto é lançado
           opponent.state = PlayerState.HIT;
           opponent.stunTimer = 60;
        }

        opponent.facingRight = !p.facingRight;
        p.gravityDisabledTimer = 10;
        opponent.gravityDisabledTimer = 10;

        if (!p.dragonComboTimer) p.dragonComboTimer = 0;
        p.dragonComboTimer++;

        // Obter animação atual para verificar frames e garantir término real
        const animKey = resolveAnimationKey(p.data.id, p.state, p.comboType, p.comboStep, p.ataque, undefined, undefined, undefined, 1, p.isGrounded, false, false, p.data.spriteConfig);
        const anim = p.data.spriteConfig?.animations[animKey];
        let totalFrames = (anim as any)?.frames?.length || anim?.frames || 8;
        if (anim?.isGif) {
          const gifFrames = AnimationManager.getInstance().getGifFrameCount(anim.imageUrl);
          if (gifFrames > 0) totalFrames = gifFrames;
        }

        // Condição de término: Animação chegou ao fim (animFinished) 
        if ((p.animFinished && p.dragonComboTimer >= 2) || p.dragonComboTimer >= 70) {
          // Transição direta para DRAGON_DASH_FOLLOW (Suspensão e Lançamento)
          p.state = PlayerState.DRAGON_DASH_FOLLOW;
          p.comboStep = 0;
          
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.dragonComboTimer = 0;
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.gravityDisabledTimer = 40;

          // TELEPORTE IMEDIATO (Executar no momento da transição para evitar 1 frame de atraso)
          const sideOffset = 80;
          p.pos.x = opponent.pos.x + (opponent.facingRight ? sideOffset : -sideOffset);
          p.pos.y = opponent.pos.y;
          p.facingRight = !opponent.facingRight;
          
          (p as any)["dragonRushSuspensionPlayerPos"] = { x: p.pos.x, y: p.pos.y };
          (p as any)["dragonRushSuspensionOpponentPos"] = { x: opponent.pos.x, y: opponent.pos.y };

          try {
            AudioManager.getInstance().playSFX("vanish");
            engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y, 15);
          } catch (e) {}
        }
      }
    } else if (p.state === PlayerState.DRAGON_DASH_FOLLOW) {
      p.invincibleTimer = 10;
      const opponent = p === engine.player1 ? engine.player2 : engine.player1;

      opponent.invincibleTimer = 10;
      opponent.stunTimer = 10;
      opponent.state = PlayerState.HIT; // Manter em hit durante a suspensão
      opponent.velocity.x = 0;
      opponent.velocity.y = 0;
      opponent.gravityDisabledTimer = 10;

      let animKey = resolveAnimationKey(p.data.id, p.state, p.comboType, p.comboStep, p.ataque, undefined, undefined, undefined, 1, p.isGrounded, false, false, p.data.spriteConfig);
      let anim = p.data.spriteConfig?.animations[animKey];
      if (!anim) {
          // Fallback para pose de suspensão usando a pose inicial (dragon_rush_1)
          anim = p.data.spriteConfig?.animations["DRAGON_DASH_FOLLOW"] ||
                 p.data.spriteConfig?.animations["dragon_rush_1"] ||
                 p.data.spriteConfig?.animations["DRAGON_RUSH_1"];
      }
      
      // Obter contagem de frames real para GIFs através do AnimationManager
      let totalFrames = (anim as any)?.frames?.length || anim?.frames || 8;
      if (anim?.isGif) {
        const gifFrames = AnimationManager.getInstance().getGifFrameCount(anim.imageUrl);
        if (gifFrames > 0) totalFrames = gifFrames;
      }

      p.animFinished = false;

      // Manter ambos parados no ar por 0.2 segundos com trava de posição absoluta
      const suspensionPlayerPos = (p as any)["dragonRushSuspensionPlayerPos"];
      const suspensionOpponentPos = (p as any)["dragonRushSuspensionOpponentPos"];

      if (suspensionPlayerPos) {
        p.pos.x = suspensionPlayerPos.x;
        p.pos.y = suspensionPlayerPos.y;
      }
      if (suspensionOpponentPos) {
        opponent.pos.x = suspensionOpponentPos.x;
        opponent.pos.y = suspensionOpponentPos.y;
      }

      p.velocity.x = 0;
      p.velocity.y = 0;
      p.gravityDisabledTimer = 2;

      opponent.velocity.x = 0;
      opponent.velocity.y = 0;
      opponent.gravityDisabledTimer = 2;
      opponent.state = PlayerState.HIT;
      opponent.stunTimer = 15;

      if (p.dragonComboTimer === undefined) p.dragonComboTimer = 0;
      p.dragonComboTimer++;

      // 0.2s = 12 frames a 60 FPS
      if (p.dragonComboTimer >= 12) {
        // FINALIZA A SUSPENSÃO SEM LANÇAMENTO AUTOMÁTICO
        // Deixa o oponente vulnerável (HIT) por um curto período para permitir o combo aéreo
        opponent.state = PlayerState.HIT;
        opponent.stunTimer = 40; 
        opponent.gravityDisabledTimer = 0;
        opponent.velocity.x = 0;
        opponent.velocity.y = 0;

        // Libera o atacante para agir no ar
        p.state = PlayerState.FALLING;
        p.comboStep = 0;
        p.dragonComboTimer = undefined;
        p.animFrame = 0;
        p.animTimer = 0;
        p.comboType = "NONE";
        p.ataque = false;
        p.gravityDisabledTimer = 0;
      }
    }

    // Exception: Do not end prematurely for multi-phase transformations, fusions, and all specials.
    let isMultiPhaseSequence =
      p.state === PlayerState.INTRO ||
      p.state === PlayerState.ULTIMATE ||
      p.state === PlayerState.TRANSFORM ||
      p.state === PlayerState.DETRANSFORM ||
      p.state === PlayerState.FUSION ||
      p.state === PlayerState.DEFUSION ||
      (!!p.comboType && p.comboType.startsWith("SPECIAL"));

    if (p.comboType === "KI_BLAST" && p.ataque) {
      isMultiPhaseSequence = true;
      if (!p.isGrounded) {
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.gravityDisabledTimer = 10;
      }
    }

    if (
      (p.comboType === "SPECIAL" ||
        p.comboType === "SPECIAL_2" ||
        p.comboType === "SPECIAL_3") &&
      p.data.id === "goku_black_rose"
    ) {
      isMultiPhaseSequence = true;

      if (p.comboType === "SPECIAL" && false) {
        const ownerId_ = p === engine.player1 ? "p1" : "p2";
        const myZamasu = engine.projectiles.find(
          (proj) =>
            proj.ownerId === ownerId_ && proj.beamFamilyId === "ZAMASU_CUSTOM",
        );
        if (myZamasu && myZamasu.active) {
          if (
            p.state === PlayerState.HIT ||
            p.state === PlayerState.FALLING_HIT ||
            p.state === PlayerState.KNOCKED_DOWN ||
            p.state === PlayerState.STUNNED ||
            p.state === PlayerState.IDLE ||
            p.state === PlayerState.WALK_BACKWARD ||
            p.state === PlayerState.RUNNING ||
            p.state === PlayerState.BLOCKING
          ) {
            myZamasu.active = false;
          } else {
            const opp_ = p === engine.player1 ? engine.player2 : engine.player1;
            opp_.velocity.x = 0;
            opp_.velocity.y = 0;
            opp_.stunTimer = 10;
            opp_.gravityDisabledTimer = 10;

            // Ensure visual stun state
            if (
              opp_.state !== PlayerState.STUNNED &&
              opp_.state !== PlayerState.HIT
            ) {
              opp_.state = PlayerState.STUNNED;
              opp_.animFrame = 0;
              opp_.animTimer = 0;
            }
          }
        }
      }

      if (
        p.comboType === "SPECIAL" &&
        p.comboStep === 0 &&
        p.animTimer === 0 &&
        p.animFrame === 0 &&
        p.attackTimer === 999 &&
        false
      ) {
        const opp_ = p === engine.player1 ? engine.player2 : engine.player1;
        const ownerId_ = p === engine.player1 ? "p1" : "p2";
        // Zamasu doesn't apply stun or effects, but wait until beam spawns.

        const zamasuAnim =
          p.data.spriteConfig?.animations?.["SPECIAL_1_ZAMASU"] ||
          p.data.spriteConfig?.animations?.["ESPECIAL_1_ZAMASU"];
        const family = {
          middle: {
            offsetX: zamasuAnim ? zamasuAnim.offsetX : 0,
            offsetY: zamasuAnim ? zamasuAnim.offsetY : 0,
            scale: zamasuAnim ? zamasuAnim.scale : 2.2,
          },
        };
        let proj_x = p.facingRight ? opp_.x + 40 : opp_.x - 40;
        let proj_y = opp_.y + 15; // Align closer to ground and closer horizontally

        const proj = Projectile.spawn(
          proj_x,
          proj_y,
          0,
          ownerId_,
          p.data.color,
          false,
          "ZAMASU_CUSTOM",
          100,
          100,
          family.middle?.offsetX,
          family.middle?.offsetY,
          family.middle?.scale,
          0,
          "STRAIGHT",
        );
        proj.disabledCollision = true;
        proj.freezeOnLastFrame = true;
        proj.initialFacingRight = !p.facingRight;
        if (zamasuAnim) {
          proj.customAnimData = zamasuAnim;
        }
        engine.projectiles.push(proj);
      }
    }

    if (p.attackTimer > 0) {
      p.attackTimer--;

      // Keep attackTimer refreshed and active for players who have an active beam
      // (especially during a clash or after a clash victory) so they can safely
      // continue their casting animation until the beam is completely destroyed!
      if (isWaitAnimState) {
        const specificProj = (p as any).spawnedBeamProjectile;
        const hasActiveBeam = specificProj && specificProj.active && engine.projectiles.includes(specificProj);
        if (hasActiveBeam) {
          p.attackTimer = Math.max(p.attackTimer, 20);
        }
      }

      let animKeyToUse = p.lastAnimKey || (p.state as string);
      if (p.comboType.startsWith("SPECIAL")) {
        animKeyToUse = resolveAnimationKey(
          p.data.id,
          p.state,
          p.comboType,
          p.comboStep,
          p.ataque,
          undefined,
          undefined,
          p.attackTimer,
          p.ultType,
          p.isGrounded,
          p.isDetransforming,
          p.isKOTag,
          p.data.spriteConfig
        );
      }
      let actualAnim = p.data.spriteConfig?.animations[animKeyToUse];
      if (!actualAnim && p.data.spriteConfig?.animations) {
        const lowerKey = animKeyToUse.toLowerCase();
        const matchedKey = Object.keys(p.data.spriteConfig.animations).find(k => k.toLowerCase() === lowerKey);
        if (matchedKey) {
          actualAnim = p.data.spriteConfig.animations[matchedKey];
        }
      }
      if (!actualAnim) {
        actualAnim = currentAnim;
      }
      
      let isConfiguredForBeam = false;
      let foundComboAnimWithKey: any = undefined;

      if (p.comboType && typeof p.comboType === "string" && p.comboType.startsWith("SPECIAL")) {
        let specialNum = "1";
        if (p.comboType.endsWith("_2")) specialNum = "2";
        else if (p.comboType.endsWith("_3")) specialNum = "3";
        else if (p.comboType.endsWith("_4")) specialNum = "4";
        else if (p.comboType.endsWith("_5")) specialNum = "5";
        else if (p.comboType.endsWith("_6")) specialNum = "6";

        const animKeys = Object.keys(p.data.spriteConfig?.animations || {});
        for (const key of animKeys) {
          const kUpper = key.toUpperCase();
          let isSameGroup = false;

          if (specialNum === "1") {
            isSameGroup = kUpper.includes("SPECIAL_1") || 
                          kUpper.includes("ESPECIAL_1") || 
                          (kUpper.startsWith("ATTACK_SPECIAL") && !kUpper.includes("SPECIAL_2") && !kUpper.includes("SPECIAL_3") && !kUpper.includes("SPECIAL_4"));
          } else {
            isSameGroup = kUpper.includes(`SPECIAL_${specialNum}`) || kUpper.includes(`ESPECIAL_${specialNum}`);
          }

          if (isSameGroup) {
            const anim = p.data.spriteConfig?.animations[key];
            if (anim && (anim.createsBeam || anim.projectileId || anim.beamConfig)) {
              isConfiguredForBeam = true;
              foundComboAnimWithKey = anim;
              break;
            }
          }
        }
      } else {
        if (actualAnim && (actualAnim.createsBeam || actualAnim.projectileId || actualAnim.beamConfig)) {
          isConfiguredForBeam = true;
          foundComboAnimWithKey = actualAnim;
        }
      }

      if (p.data.beamOverrides && p.data.beamOverrides[animKeyToUse]) {
        isConfiguredForBeam = true;
      }

      let tempAnim = foundComboAnimWithKey || actualAnim;

      const hasBeamConfig =
        tempAnim?.createsBeam ||
        p.data.spriteConfig?.animations?.["BEAM_START"] !== undefined;
      let specialTriggerTime =
        hasBeamConfig && p.comboType !== "KI_BLAST" ? 95 : 15;

      if (
        ((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base") ||
          p.data.id === "gogeta_blue" ||
          p.data.id === "trunks_ssj2" ||
          p.data.id === "teen_gohan_ssj2") &&
        (p.comboType === "SPECIAL" || p.comboType === "SPECIAL_2")
      ) {
        specialTriggerTime = 160;
      }

      const isBlackRoseSpecial2 =
        p.data.id === "goku_black_rose" &&
        p.comboType === "SPECIAL_2" &&
        p.comboStep > 0;
      const isLateTrigger = isBlackRoseSpecial2 && p.animFinished;
      const isGokuBaseComboStep1 =
        (p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base" || p.data.id === "goku_base_swl") &&
        p.comboType === "SPECIAL" &&
        p.comboStep === 1 &&
        p.animFrame === 0 &&
        p.animTimer <= 2;
      const triggersNormally =
        !isBlackRoseSpecial2 &&
        (p.attackTimer === specialTriggerTime ||
          (p.attackTimer === 998 && p.animFrame === 0 && p.animTimer <= 2) ||
          isGokuBaseComboStep1);

      let gohanCanSpawn = true;
      if (p.data.id === "teen_gohan_ssj2") {
        if (p.comboType === "SPECIAL") {
          gohanCanSpawn = (animKeyToUse === "ATTACK_SPECIAL_LOOP" || animKeyToUse === "SPECIAL_1_2" || animKeyToUse === "ESPECIAL_1_2");
        } else if (p.comboType === "SPECIAL_2") {
          gohanCanSpawn = (animKeyToUse === "SPECIAL_2_2" || animKeyToUse === "ESPECIAL_2_2");
        } else {
          gohanCanSpawn = false;
        }
      }

      let correctPhaseForBeam = true;
      if (p.comboType && typeof p.comboType === "string" && p.comboType.startsWith("SPECIAL")) {
        let hasAnyGroupBeam = false;
        let specialNum = "1";
        if (p.comboType.endsWith("_2")) specialNum = "2";
        else if (p.comboType.endsWith("_3")) specialNum = "3";
        else if (p.comboType.endsWith("_4")) specialNum = "4";
        else if (p.comboType.endsWith("_5")) specialNum = "5";
        else if (p.comboType.endsWith("_6")) specialNum = "6";

        const animKeys = Object.keys(p.data.spriteConfig?.animations || {});
        for (const key of animKeys) {
          const kUpper = key.toUpperCase();
          let isSameGroup = false;
          if (specialNum === "1") {
            isSameGroup = kUpper.includes("SPECIAL_1") || 
                          kUpper.includes("ESPECIAL_1") || 
                          (kUpper.startsWith("ATTACK_SPECIAL") && !kUpper.includes("SPECIAL_2") && !kUpper.includes("SPECIAL_3") && !kUpper.includes("SPECIAL_4"));
          } else {
            isSameGroup = kUpper.includes(`SPECIAL_${specialNum}`) || kUpper.includes(`ESPECIAL_${specialNum}`);
          }
          if (isSameGroup) {
            const anim = p.data.spriteConfig?.animations[key];
            if (anim && (anim.createsBeam || anim.projectileId || anim.beamConfig)) {
              hasAnyGroupBeam = true;
              break;
            }
          }
        }

        if (hasAnyGroupBeam) {
          const currentAnimConfig = p.data.spriteConfig?.animations[animKeyToUse];
          const hasBeamNow = !!(currentAnimConfig && (currentAnimConfig.createsBeam || currentAnimConfig.projectileId || currentAnimConfig.beamConfig));
          if (!hasBeamNow) {
            correctPhaseForBeam = false;
          }
        }
      }

      if (
        (triggersNormally || isLateTrigger) &&
        !(p as any).beamSpawned &&
        !(p as any).hasSpawnedInSequence &&
        isConfiguredForBeam &&
        gohanCanSpawn &&
        correctPhaseForBeam &&
        p.state !== PlayerState.ULTIMATE &&
        p.state !== PlayerState.ULTIMATE_2 &&
        !p.lastAnimKey?.startsWith("Ultimate_") &&
        !p.lastAnimKey?.includes("Ultimate") &&
        (p.comboType.startsWith("SPECIAL") || p.comboType === "KI_BLAST" || tempAnim?.createsBeam) &&
        p.state !== PlayerState.HIT &&
        p.state !== PlayerState.STUNNED &&
        p.data.id !== "goku_mui" &&
        !(p.data.id === "gogeta_blue" && p.comboType === "SPECIAL_4") &&
        !(p.data.id === "gogeta_ssj" && p.comboType === "SPECIAL_2") &&
        !(p.data.id === "gogeta_ssj" && p.comboType === "SPECIAL") &&
        !(
          (p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base" || p.data.id === "goku_base_swl") &&
          p.comboType === "SPECIAL" &&
          p.comboStep !== 1
        ) &&
        !(
          p.data.id === "kuririn" &&
          p.comboType === "SPECIAL" &&
          p.comboStep !== 1
        ) &&
        !(
          p.data.id === "kuririn" &&
          p.comboType === "SPECIAL_3" &&
          p.comboStep !== 2
        ) &&
        !(
          p.data.id === "goku_black_rose" &&
          ((p.comboType === "SPECIAL" && p.comboStep !== 1) ||
            (p.comboType === "SPECIAL_2" && p.comboStep === 0) ||
            (p.comboType === "SPECIAL_3" && p.comboStep === 0))
        )
      ) {
        let isBeam = false;
        let beamFamilyId = undefined;
        let shouldSpawn = true;

        if (p.data.id === "broly_ikari" && p.comboType === "SPECIAL_4") {
          shouldSpawn = false;
        }

        if ((p.comboType && typeof p.comboType === "string" && p.comboType.startsWith("SPECIAL")) || p.comboType === "KI_BLAST" || tempAnim?.createsBeam) {
          const declaredBeam = tempAnim?.createsBeam;

          if (declaredBeam) {
            if (declaredBeam.includes("GENKIDAMA")) {
              // Genkidama has its own separate state-based ultimate rendering/logic;
              // we don't want standard physical beam projectile spawned in PhysicsManager
              shouldSpawn = false;
            }

            // Proper database lookup for classification
            const isKnownBeam = !!BeamConfigKeyManager.getInstance().getBeamConfig(declaredBeam);
            const isKnownProj = !!ProjectileConfigKeyManager.getInstance().getProjectileConfig(declaredBeam);

            if (isKnownBeam) {
              isBeam = true;
            } else if (isKnownProj) {
              isBeam = false;
            } else {
              // Fallback to name pattern
              isBeam = !(
                declaredBeam.includes("KI_BLAST") ||
                declaredBeam.includes("PROJECTILE") ||
                declaredBeam.includes("PROJETIL") ||
                declaredBeam.includes("GENKIDAMA") ||
                declaredBeam.includes("FECHO")
              );
            }

            beamFamilyId = declaredBeam;
            if (isBeam) {
              if (engine.camera)
                engine.camera.addScreenShake(20, 15, "IMPULSE", 0.8);
            } else {
              if (engine.camera)
                engine.camera.addScreenShake(12, 10, "IMPULSE", 0.5);
            }
          } else {
            if (engine.camera)
              engine.camera.addScreenShake(8, 6, "IMPULSE", 0.5);
          }
        }

        // Custom Projectile fallback
        if (shouldSpawn && !isBeam && !beamFamilyId) {
          if (tempAnim?.projectileId) {
            beamFamilyId = tempAnim.projectileId;
            if (beamFamilyId && typeof beamFamilyId === "string" && beamFamilyId.includes("GENKIDAMA")) {
              shouldSpawn = false;
            }
          } else if (p.comboType && typeof p.comboType === "string" && p.comboType.startsWith("SPECIAL")) {
            // SPECIAL attacks MUST have a configured beam or projectile!
            // If they don't have projectileId or createsBeam, we should NOT spawn any default PROJETIL_2 or BEAM.
            shouldSpawn = false;
          } else {
            beamFamilyId = "PROJETIL_2"; // Default energy ball
          }
        }

        if (shouldSpawn) {
          let sourceAnimConfig = tempAnim;
          if (beamFamilyId) {
            if (tempAnim && (tempAnim.createsBeam === beamFamilyId || tempAnim.projectileId === beamFamilyId || tempAnim.beamConfig)) {
              sourceAnimConfig = tempAnim;
            } else {
              sourceAnimConfig =
                Object.values(p.data.spriteConfig?.animations || {}).find(
                  (a) =>
                    a.createsBeam === beamFamilyId ||
                    a.projectileId === beamFamilyId,
                ) || tempAnim;
            }
          }

          let familyMiddle: any = undefined;
          let familyStart: any = undefined;
          let charOverrides: any = undefined;
          if (beamFamilyId) {
            if (isBeam) {
              const keyManager = BeamConfigKeyManager.getInstance();
              const requestedBase = tempAnim?.createsBeam || beamFamilyId;
              const isKeyValid = keyManager.validateBeamKey(beamFamilyId, requestedBase);
              if (!isKeyValid) {
                console.warn(`Beam creation interrupted: config key '${beamFamilyId}' failed validation for requested beam.`);
                shouldSpawn = false;
              } else {
                const family = keyManager.getBeamConfig(beamFamilyId);
                if (family && family.middle) {
                  familyMiddle = { ...family.middle };
                }
                if (family && family.start) {
                  familyStart = { ...family.start };
                }
                charOverrides =
                  sourceAnimConfig?.beamConfig ??
                  p.data.beamOverrides?.[beamFamilyId];
              }
            } else {
              const keyManager = ProjectileConfigKeyManager.getInstance();
              const requestedBase = tempAnim?.projectileId || tempAnim?.createsBeam || beamFamilyId;
              let isKeyValid = keyManager.validateProjectileKey(beamFamilyId, requestedBase);
              if (!isKeyValid) {
                // Backward fallback check on Beam registry
                const beamKM = BeamConfigKeyManager.getInstance();
                if (beamKM.getBeamConfig(beamFamilyId)) {
                  isKeyValid = true;
                }
              }
              if (!isKeyValid) {
                console.warn(`Projectile creation interrupted: config key '${beamFamilyId}' failed validation.`);
                shouldSpawn = false;
              } else {
                const family = keyManager.getProjectileConfig(beamFamilyId) || (BeamConfigKeyManager.getInstance().getBeamConfig(beamFamilyId) as any);
                if (family && family.middle) {
                  familyMiddle = { ...family.middle };
                }
                charOverrides =
                  sourceAnimConfig?.projectileConfig ?? sourceAnimConfig?.beamConfig ??
                  p.data.projectileOverrides?.[beamFamilyId] ?? p.data.beamOverrides?.[beamFamilyId];
              }
            }

            if (shouldSpawn && charOverrides && charOverrides.middle) {
              familyMiddle = { ...familyMiddle, ...charOverrides.middle };
            }
            if (shouldSpawn && charOverrides && charOverrides.start) {
              familyStart = { ...familyStart, ...charOverrides.start };
            }
          }

          if (shouldSpawn) {
            // Se for um feixe, tenta ler os offsets do 'start' (início) antes de cair para o 'middle' (meio)
            const kiOriginX =
              sourceAnimConfig?.kiOriginX ??
              (isBeam
                ? (familyStart?.kiOriginX ?? familyMiddle?.kiOriginX)
                : familyMiddle?.kiOriginX);
            const kiOriginY =
              sourceAnimConfig?.kiOriginY ??
              (isBeam
                ? (familyStart?.kiOriginY ?? familyMiddle?.kiOriginY)
                : familyMiddle?.kiOriginY);

            const projWidth = isBeam
              ? (sourceAnimConfig?.projectileWidth ??
                familyStart?.projectileWidth ??
                familyMiddle?.projectileWidth ??
                1)
              : (sourceAnimConfig?.projectileWidth ??
                familyMiddle?.projectileWidth ??
                PROJECTILE_SIZE);

            // Override with kiOrigin from Animation configuration if present, with safe defaults representing physical KiOrigin (never hitbox edges)
            const finalKiX = kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            const customXOff = sourceAnimConfig?.projectileOffsetX ?? familyStart?.projectileOffsetX ?? familyMiddle?.projectileOffsetX ?? 0;
            const customYOff = sourceAnimConfig?.projectileOffsetY ?? familyStart?.projectileOffsetY ?? familyMiddle?.projectileOffsetY ?? 0;

            let spawnX: number;
            if (p.facingRight) {
              spawnX = p.x + finalKiX + customXOff;
            } else {
              spawnX = p.x + p.width - finalKiX - customXOff - projWidth;
            }

            const spawnY = p.y + finalKiY - customYOff;

            const velX = p.facingRight ? KI_BLAST_SPEED : -KI_BLAST_SPEED;
            const ownerId = (p === engine.player1 || engine.p1Team.includes(p)) ? "p1" : "p2";

            let behavior:
              | "STRAIGHT"
              | "HOMING"
              | "TARGET_POS"
              | "GROWING_STRAIGHT" = "STRAIGHT";
            let initialScale = sourceAnimConfig?.projectileScale;
            if (beamFamilyId) {
              if (isBeam) {
                const family = BeamConfigKeyManager.getInstance().getBeamConfig(beamFamilyId);
                if (family && family.behavior) {
                  behavior = family.behavior;
                }
              } else {
                const family = ProjectileConfigKeyManager.getInstance().getProjectileConfig(beamFamilyId) || (BeamConfigKeyManager.getInstance().getBeamConfig(beamFamilyId) as any);
                if (family && family.behavior) {
                  behavior = family.behavior;
                }
              }
            }

            if (initialScale === undefined) {
              initialScale = isBeam
                ? (familyStart?.projectileScale ?? familyMiddle?.projectileScale ?? familyStart?.scale ?? familyMiddle?.scale)
                : (familyMiddle?.projectileScale ?? familyMiddle?.scale);
            }

            if (behavior === "GROWING_STRAIGHT") {
              initialScale = 0;
              // Reduz a velocidade do dragão/bolso para o crescimento
              // velX = p.facingRight ? (KI_BLAST_SPEED * 0.7) : -(KI_BLAST_SPEED * 0.7);
            }

            let skipBeamDueToClashDistance = false;
            if (isBeam || beamFamilyId) {
              const opponent = p === engine.player1 ? engine.player2 : engine.player1;
              if (opponent) {
                const pHBox = p.hitbox;
                const oppHBox = opponent.hitbox;
                const pCenterX = pHBox.x + pHBox.width / 2;
                const pCenterY = pHBox.y + pHBox.height / 2;
                const oppCenterX = oppHBox.x + oppHBox.width / 2;
                const oppCenterY = oppHBox.y + oppHBox.height / 2;
                const dx = pCenterX - oppCenterX;
                const dy = pCenterY - oppCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 50) {
                  const hasExistingBeam = engine.projectiles.some(
                    (p_proj) => (p_proj.isBeam || p_proj.beamFamilyId) && p_proj.active
                  );
                  if (hasExistingBeam) {
                    skipBeamDueToClashDistance = true;
                    console.log("[BEAM_CLASH] Blocked creating beam in PhysicsManager. Distance:", distance);
                  }
                }
              }
            }

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              isBeam,
              beamFamilyId,
              projWidth,
              sourceAnimConfig?.projectileHeight ??
                (isBeam
                  ? (familyStart?.projectileHeight ??
                    familyMiddle?.projectileHeight)
                  : familyMiddle?.projectileHeight),
              sourceAnimConfig?.projectileOffsetX ??
                (isBeam
                  ? (familyStart?.projectileOffsetX ?? familyMiddle?.projectileOffsetX)
                  : familyMiddle?.projectileOffsetX),
              sourceAnimConfig?.projectileOffsetY ??
                (isBeam
                  ? (familyStart?.projectileOffsetY ?? familyMiddle?.projectileOffsetY)
                  : familyMiddle?.projectileOffsetY),
              initialScale,
              sourceAnimConfig?.projectileSpeed ??
                (isBeam
                  ? (familyStart?.projectileSpeed ?? familyMiddle?.projectileSpeed)
                  : familyMiddle?.projectileSpeed),
              behavior,
            );
            if (beamFamilyId) {
              const family = BeamConfigKeyManager.getInstance().getBeamConfig(beamFamilyId);
              if (family && (family as any).maxScale !== undefined) {
                proj.maxScale = (family as any).maxScale;
              }
            }
            
            // --- NEW: Beam launch dust effect behind character if grounded ---
            if (isBeam && p.isGrounded && engine) {
              engine.spawnVisualEffect(
                "BEAM_LAUNCH_DUST",
                p.x + p.width / 2 + (p.facingRight ? -40 : 40),
                p.y + p.height,
                "/Assets/efeitos/poeira/5.gif",
                10,
                true,
                p === engine.player1 ? "p1" : "p2",
                2.0,
                p.facingRight
              );
            }

            proj.sourceAnimConfig = sourceAnimConfig;
            proj.effectConfigKey = sourceAnimConfig?.effectConfigKey;
            proj.rotation = sourceAnimConfig?.rotation ?? charOverrides?.rotation ?? charOverrides?.middle?.rotation ?? charOverrides?.start?.rotation ?? familyMiddle?.rotation;

            if (skipBeamDueToClashDistance) {
              proj.active = false;
              (proj as any)._isForceDeactivated = true;
              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).hasSpawnedInSequence = true;
              (p as any).spawnedBeamProjectile = proj; // Track this specific projectile, but active is false and not in engine.projectiles
            } else {
              (proj as any).sourcePlayer = p;
              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).hasSpawnedInSequence = true;
              (p as any).spawnedBeamProjectile = proj; // Track this specific projectile!
              engine.projectiles.push(proj);
              engine.particleManager.spawn(
                "AURA",
                spawnX,
                spawnY + PROJECTILE_SIZE / 2,
                10,
                p.data.color,
                { size: 8, speed: 6 },
              );
              engine.particleManager.spawn(
                "ENERGY",
                spawnX + (p.facingRight ? 20 : -20),
                spawnY + PROJECTILE_SIZE / 2,
                15,
                "#ffffff",
                { size: 10, speed: 8, spread: 1.5 },
              );
            }
          }
        }
      }
      if (
        p.attackTimer <= 0 &&
        (!isWaitAnimState || isLooping || isMultiPhaseSequence)
      ) {
        triggeredStateEnd = true;
      }
    }

    // If it's NOT looping, wait for the animation to actually finish
    // Exception: For SPECIAL attacks, only terminate if the attackTimer is almost done (e.g. at the END phase)
    const isEarlySpecialPhase =
      p.comboType && typeof p.comboType === "string" && p.comboType.startsWith("SPECIAL") && p.attackTimer > 10;

    const currentAnimCreatesBeam =
      p.data.spriteConfig?.animations?.[p.lastAnimKey || ""]?.createsBeam;

    if ((p as any).beamSpawned) {
      const currentOwnerId = (p === engine.player1 || engine.p1Team.includes(p)) ? "p1" : "p2";
      
      const specificProj = (p as any).spawnedBeamProjectile;
      
      // Monitor EXCLUSIVELY the Beam created by the current skill execution.
      // Do not use owner search fallback or global checks to avoid dependencies on other Beams.
      let hasActiveBeam = false;
      if (specificProj) {
        hasActiveBeam = specificProj.active && engine.projectiles.includes(specificProj);
      } else {
        // Safe default briefly until projectile registry is handled synchronously
        hasActiveBeam = true;
      }

      // Safety measure: Maximum duration/timer for the beam phase.
      // If the character stays casting too long (failsafe timeout), automatically terminate.
      if ((p as any).beamPhaseTimer === undefined) {
        (p as any).beamPhaseTimer = 0;
      }
      (p as any).beamPhaseTimer++;

      const MAX_BEAM_PHASE_DURATION = 150; // Maximum duration (failsafe timeout)
      if (!hasActiveBeam || (p as any).beamPhaseTimer >= MAX_BEAM_PHASE_DURATION) {
        (p as any).beamSpawned = false; // consume it
        // Do NOT reset hasSpawnedInSequence here to prevent duplicate beam/bean spawns during the same attack sequence!
        // It will be reset cleanly when the overall attack/state terminates or is interrupted.
        (p as any).spawnedBeamProjectile = undefined;
        (p as any).beamPhaseTimer = undefined;

        if (p.data.id === "goku_black_rose") {
          engine.projectiles.forEach((proj) => {
            if (
              proj.ownerId === currentOwnerId &&
              proj.beamFamilyId === "ZAMASU_CUSTOM"
            ) {
              proj.active = false;
            }
          });
        }

        // Only automatically revert standard states.
        // For PlayerState.ULTIMATE, let UltimateManager handle phase & state progression safely.
        if ((p.state as any) !== PlayerState.ULTIMATE) {
          // Voltar imediatamente para idle quando o feixe for destruido
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.ataque = false;
          p.comboType = "NONE";
          p.comboStep = 0;
          p.attackTimer = 0;
          p.animFinished = true;
          p.animFrame = 0;
          p.animTimer = 0;
          p.ultPhase = 0;
          (p as any).specialPhaseTimer = undefined;
          triggeredStateEnd = false; // Bypass typical sequence continuation
          return;
        }
      } else {
        // The beam is still active, hold the animation at the last frame
        if (isWaitAnimState || (p.state as any) === PlayerState.ULTIMATE) {
          const animKey = p.lastAnimKey || "";
          const anim = p.data.spriteConfig?.animations?.[animKey];
          if (anim) {
            const totalFrames = anim.frames || 1;
            p.animFrame = totalFrames - 1;
            p.animFinished = false;
            p.animTimer = 0;
          }
        }
      }
    }

    if (
      isWaitAnimState &&
      !isLooping &&
      p.animFinished &&
      (!isEarlySpecialPhase || isMultiPhaseSequence)
    ) {
      if (isMultiPhaseSequence) {
        let shouldEnd = false;
        if (p.comboType === "KI_BLAST") {
          const limits = {
            gogeta_ssj4: { ground: 4, air: 4 },
            goku_base_swl_removed: { ground: 4, air: 4 },
            goku_base_swl: { ground: 4, air: 4 },
            goku_base: { ground: 4, air: 4 },
            kuririn: { ground: 4, air: 3 },
            goku_ssj: { ground: 2, air: 2 },
            goku_blue: { ground: 2, air: 2 },
            goku_black_rose: { ground: 2, air: 2 },
            vegeta_base: { ground: 2, air: 2 },
            gogeta: { ground: 1, air: 1 },
            gogeta_ssj: { ground: 1, air: 1 },
            gogeta_blue: { ground: 2, air: 2 },
            goku_mui: { ground: 1, air: 1 },
            trunks_ssj2: { ground: 2, air: 2 },
            vegeta_ego: { ground: 1, air: 1 },
            majin_buu_gohan: { ground: 2, air: 2 },
            piccolo: { ground: 2, air: 2 },
            teen_gohan_ssj2: { ground: 2, air: 2 },
            frieza_final: { ground: 2, air: 2 },
            broly_ikari: { ground: 2, air: 2 },
            vegeta_ssj_majin: { ground: 2, air: 2 },
          }[p.data.id] || { ground: 1, air: 1 };
          const maxK = p.isGrounded ? limits.ground : limits.air;
          if (p.comboStep >= maxK - 1) {
            shouldEnd = true;
          }
        } else if (
          p.lastAnimKey === "TRANSFORM_GOKU_SSJ_3" ||
          p.lastAnimKey === "TRANSFORM_GOKU_BLUE_3" ||
          p.lastAnimKey === "TRANSFORM_GOKU_MUI_2" ||
          p.lastAnimKey === "DETRANSFORM_2" ||
          p.lastAnimKey === "FUSION_3" ||
          p.lastAnimKey === "DETRANSFORM" ||
          p.lastAnimKey === "TRANSFORM_EGO_4" ||
          p.lastAnimKey === "TRANSFORM_TRUNKS_SSJ2" ||
          p.lastAnimKey === "ULTIMATE_1_5" ||
          p.lastAnimKey === "ULTIMATE_2_Z3" ||
          p.lastAnimKey === "ULTIMATE_3_C1"
        ) {
          shouldEnd = true;
        } else if (
          p.data.id === "goku_ssj" &&
          p.lastAnimKey === "TRANSFORM_GOKU_BLUE_2"
        ) {
          shouldEnd = true;
        } else if (
          !p.lastAnimKey.match(/_\d+$/) &&
          ![
            "ULTIMATE_2_G1",
            "ULTIMATE_2_Z1",
            "ULTIMATE_2_G2",
            "ULTIMATE_2_Z2",
            "ULTIMATE_2_G3",
          ].includes(p.lastAnimKey)
        ) {
          shouldEnd = true;
        }

        if (!shouldEnd) {
          // Dynamic next key check for any multi-phase seq (Specials, Transforms, Fusions, Detransforms, Ultimates)
          const nextKey = resolveAnimationKey(
            p.data.id,
            p.state,
            p.comboType,
            p.comboStep + 1,
            p.ataque,
            p.ultPhase !== undefined ? p.ultPhase + 1 : undefined,
            p.nextTransformId,
            p.attackTimer,
            p.ultType || 1,
            p.isGrounded,
            p.isDetransforming,
            p.isKOTag,
            p.data.spriteConfig
          );
          const keys = Object.keys(p.data.spriteConfig?.animations || {});
          const nextKeyUpper = nextKey.toUpperCase();
          const currentKeyUpper = p.lastAnimKey?.toUpperCase();
          
          let nextExists = keys.some(k => k.toUpperCase() === nextKeyUpper);
          if (!nextExists && p.data.spriteConfig?.animations) {
            nextExists = (nextKey in p.data.spriteConfig.animations);
          }
          if (!nextExists || nextKeyUpper === currentKeyUpper || nextKey === (p.state as string)) {
            shouldEnd = true;
          }
        }

        if (shouldEnd) {
          triggeredStateEnd = true;
          p.attackTimer = 0;
        } else {
          p.comboStep++;
          if (p.ultPhase !== undefined) {
            p.ultPhase++;
          }
          p.animFrame = 0;
          p.animTimer = 0;
          p.animFinished = false;
          p.attackTimer = p.comboType === "KI_BLAST" ? 30 : 999; // ensure timer doesn't end the state prematurely
        }
      } else {
        triggeredStateEnd = true;
        p.attackTimer = 0; // ensure timer is reset
        console.log(
          `[GameEngine] State end triggered for ${p.lastAnimKey} because animFinished`,
        );
      }
    }

    if (triggeredStateEnd) {
      if (p.state === PlayerState.VANISH) {
        const isP1 = [engine.player1, ...engine.p1Team].includes(p);
        const opp = isP1 ? engine.player2 : engine.player1;
        const distanceBehind = 60;
        const dir = opp.facingRight ? -1 : 1;

        p.pos.x = Math.max(
          0,
          Math.min(
            engine.worldWidth - p.width,
            opp.pos.x + dir * distanceBehind,
          ),
        );
        p.pos.y = opp.pos.y;
        p.facingRight = dir < 0 ? true : false;

        p.state = PlayerState.VANISH_APPEAR;
        try {
          AudioManager.getInstance().playSFX("teleport");
        } catch (tpErr) {
          console.error("Failed to play teleport SFX on reappear:", tpErr);
        }
        p.attackTimer = 5;
        p.isGrounded = opp.isGrounded;
        p.velocity.y = 0;
        p.velocity.x = 0;

        engine.particleManager.spawn(
          "AURA",
          p.x + p.width / 2,
          p.y + p.height / 2,
          5,
          p.data.color,
          { size: 10, speed: 0 },
        );
      } else if (p.state === PlayerState.VANISH_APPEAR) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.invincibleTimer = 0; // remove invincibility
        if (!p.vanishIsHpTeleport) {
          const opp = p === engine.player1 ? engine.player2 : engine.player1;
          PhysicsManager.executeVanishStrike(engine, p, opp);
        }
        p.vanishIsHpTeleport = false;
      } else if (p.state === PlayerState.MUI_DODGE) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.invincibleTimer = 0;
        p.velocity.x = 0;
        const opp = p === engine.player1 ? engine.player2 : engine.player1;
        opp.freezeTimer = 0;
      } else if (p.state === PlayerState.FUSION) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.invincibleTimer = 0;

        const isP1 = p === engine.player1 || engine.p1Team.includes(p);
        const targetId = isP1 ? engine.p1FusionTarget : engine.p2FusionTarget;

        // Find Fusion target data
        const gogetaData =
          BASE_CHARACTERS.find((c) => c.id === targetId) ||
          BASE_CHARACTERS.find((c) => c.id === "gogeta");
        if (gogetaData) {
          let team = isP1 ? engine.p1Team : engine.p2Team;

          // Generate Gogeta player
          const gogeta = new Player(p.x, gogetaData, p.facingRight);
          gogeta.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          gogeta.lastState = gogeta.state;
          gogeta.hp = gogeta.maxHp;
          gogeta.ki = p.ki;
          if (isP1) {
            engine.p1GogetaMaxHp = gogeta.maxHp;
            engine.p1GogetaTimer = 45 * 60; // 45 seconds
          } else {
            engine.p2GogetaMaxHp = gogeta.maxHp;
            engine.p2GogetaTimer = 45 * 60;
          }
          gogeta.teamState = p.teamState;

          // Remove Goku and Vegeta, insert Gogeta
          const gokuIdx = team.findIndex(
            (member) => (member.data.id === "goku_base_swl_removed" || member.data.id === "goku_base_swl" || member.data.id === "goku_base"),
          );
          if (gokuIdx !== -1) team.splice(gokuIdx, 1);

          const vegetaIdx = team.findIndex(
            (member) => member.data.id === "vegeta_base",
          );
          if (vegetaIdx !== -1) team.splice(vegetaIdx, 1);

          // Insert Gogeta where the active player was, or just at the active slot
          const activeIdx = isP1 ? engine.p1ActiveIdx : engine.p2ActiveIdx;

          // Usually, p is the active player. Replace p with Gogeta.
          const idx = team.indexOf(p);
          if (idx !== -1) {
            team[idx] = gogeta;
          } else {
            team.unshift(gogeta); // fallback
          }

          if (isP1) {
            engine.player1 = gogeta;
            engine.p1ActiveIdx = Math.max(0, team.indexOf(gogeta));
          } else {
            engine.player2 = gogeta;
            engine.p2ActiveIdx = Math.max(0, team.indexOf(gogeta));
          }

          engine.animationManager.preloadCharacter(gogetaData);
          engine.particleManager.spawn("ENERGY", p.x, p.y, 10, "#ffffff", {
            speed: 5,
            size: 20,
          });
          engine.camera.addScreenShake(30, 15, "LINEAR", 0.5);
        }
      } else if (
        p.state === PlayerState.TRANSFORM ||
        p.state === PlayerState.DETRANSFORM ||
        p.state === PlayerState.DEFUSION
      ) {
        const wasDefusion = p.state === PlayerState.DEFUSION;
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.invincibleTimer = 0;
        if (p.nextTransformId) {
          const nextData = BASE_CHARACTERS.find(
            (c) => c.id === p.nextTransformId,
          );
          if (nextData) {
            if (!p.baseFormId) {
              p.baseFormId = p.data.id;
            }
            p.previousFormId = p.data.id;

            const currentDefaultChar = BASE_CHARACTERS.find((c) => c.id === p.data.id);
            const addedAttack = currentDefaultChar ? p.data.stats.attack - currentDefaultChar.stats.attack : 0;
            const addedDefense = currentDefaultChar ? p.data.stats.defense - currentDefaultChar.stats.defense : 0;
            const addedSpeed = currentDefaultChar ? p.data.stats.speed - currentDefaultChar.stats.speed : 0;

            p.data = {
              ...nextData,
              level: p.data.level,
              currentXp: p.data.currentXp,
              xpToNextLevel: p.data.xpToNextLevel,
              availablePoints: p.data.availablePoints,
              stats: {
                attack: nextData.stats.attack + addedAttack,
                defense: nextData.stats.defense + addedDefense,
                speed: nextData.stats.speed + addedSpeed
              }
            };
            // Recalculate health and stat multipliers
            const oldMaxHp = p.maxHp || 1500;
            const healthRatio = p.hp / oldMaxHp;
            p.maxHp = p.data.maxHp ?? 1500;
            p.hp = Math.max(1, Math.round(healthRatio * p.maxHp));

            // Recalculate stat multipliers
            p.attackMult = 1 + p.data.stats.attack * STAT_DMG_MULT;
            p.defenseMult = Math.max(
              0.1,
              1 - p.data.stats.defense * STAT_DEF_MULT,
            );
            p.speedMult = 1 + p.data.stats.speed * STAT_SPD_MULT;
            engine.animationManager.preloadCharacter(p.data);
          }
          p.nextTransformId = undefined;
          p.isDetransforming = false;
        } else {
          if (
            wasDefusion ||
            (p.isDetransforming &&
              (p.data.id === "gogeta" ||
                p.data.id === "gogeta_ssj" ||
                p.data.id === "gogeta_blue"))
          ) {
            const isP1 = [engine.player1, ...engine.p1Team].includes(p);
            p.isDetransforming = false;
            engine.unfuseFusion(isP1, false);
            return;
          } else {
            p.attackMult *= 1.3;
            p.speedMult *= 1.3;
            p.data.color = "#ffbb00";
          }
        }
        engine.particleManager.spawn(
          "AURA",
          p.x + p.width / 2,
          p.y + p.height / 2,
          30,
          p.data.color || "#ffbb00",
          { size: 20, speed: 5 },
        );
      } else if (p.state === PlayerState.ASSIST_ENTRY) {
        p.attackTimer--;
        if (p.attackTimer <= 0) {
          p.velocity.x = 0;
          p.velocity.y = 0;
          const aType = p.data.assistType || "SPECIAL";
          engine.performAttack(p, aType as any, false);
        }
      } else if (p.state === PlayerState.ASSIST_ACTION) {
        p.state = PlayerState.ASSIST_EXIT;
        p.velocity.x = p.facingRight ? -15 : 15;
        p.velocity.y = -10;
        p.isGrounded = false;
        p.attackTimer = 60;
        p.ataque = false;
        p.comboType = "NONE";
      } else if (
        p.state === PlayerState.ASSIST_EXIT ||
        p.state === PlayerState.TAG_OUT
      ) {
        if (p.state === PlayerState.ASSIST_EXIT) {
          const aType = p.data.assistType || "SPECIAL";
          let cd = 240;
          if (aType === "SPECIAL_2") cd = 300;
          else if (aType === "SPECIAL_3") cd = 360;
          else if (aType === "SPECIAL_4") cd = 420;
          else if (aType === "SPECIAL_5") cd = 480;
          else if (aType === "SPECIAL_6") cd = 540;
          p.assistCooldown = p.assistCooldown <= 0 ? cd : p.assistCooldown + cd;
        }
        p.state = PlayerState.STANDBY;
      } else if (p.state === PlayerState.TAG_IN) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.velocity.x = 0;
        p.ataque = false;
        p.isKOTag = false;
        p.comboType = "NONE";
      } else if (p.state === PlayerState.ULTIMATE || p.state === PlayerState.ULTIMATE_2) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.ultPhase = 0;
        p.ataque = false;
        p.comboType = "NONE";
        p.comboStep = 0;
      } else if (
        p.state !== PlayerState.CHARGE_START &&
        p.state !== PlayerState.CHARGE_END &&
        p.state !== PlayerState.DRAGON_RUSH &&
        p.state !== PlayerState.DRAGON_COMBO &&
        p.state !== PlayerState.DRAGON_DASH_FOLLOW
      ) {
        if (!p.hasHit && !p.isGrounded && p.state === PlayerState.JUMP_ATTACK) {
          p.comboWindow = 0;
          p.landingDelayTimer = 20;
        }

        if (p.comboType === "HEAVY") {
          p.landingDelayTimer = 18;
        }

        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.isKOTag = false;
        p.ataque = false;
      }
    }
    if (p.comboWindow > 0) {
      p.comboWindow--;
      if (p.comboWindow === 0 && p.state !== PlayerState.ATTACKING && p.state !== PlayerState.JUMP_ATTACK && p.state !== PlayerState.CROUCH_ATTACK) {
        if (p.comboStep > 0) {
          if (!p.hasHit) {
            // Rule: If window expires and we MISSED, revert one step in the sequence
            p.comboStep--;
            if (p.comboStep > 0) {
              p.comboWindow = 45; // Give another 45 frames before next decay
            } else {
              p.comboType = "NONE";
              p.comboCount = 0;
              p.autoDashUsed = false;
            }
          } else {
            // Rule: If window expires and we HIT, just reset the combo to neutral (don't revert)
            // This satisfies "O retorno à fase anterior só ocorre quando o golpe não acerta"
            p.comboStep = 0;
            p.comboType = "NONE";
            p.comboCount = 0;
            p.autoDashUsed = false;
          }
        } else {
          p.comboCount = 0;
          p.autoDashUsed = false;
          p.comboStep = 0;
          p.comboType = "NONE";
        }
      }
    }

    // Catch-all: transition active assist players back to exit when idle or falling after their special finishes
    const isAssist = p !== engine.player1 && p !== engine.player2;
    if (isAssist) {
      if (p.state === PlayerState.IDLE || p.state === PlayerState.FALLING) {
        p.state = PlayerState.ASSIST_EXIT;
        p.velocity.x = p.facingRight ? -15 : 15;
        p.velocity.y = -10;
        p.isGrounded = false;
        p.attackTimer = 60;
        p.ataque = false;
        p.comboType = "NONE";
      }
    }
  }

  public static executeVanishStrike(engine: GameEngine, attacker: Player, defender: Player) {
    if (!attacker || !defender) return;
    
    // 1) Set attacker state to ATTACKING so they play the strike animation
    attacker.state = attacker.isGrounded ? PlayerState.ATTACKING : PlayerState.JUMP_ATTACK;
    attacker.ataque = true;
    attacker.comboType = "HEAVY";
    attacker.comboStep = 0;
    attacker.animFrame = 0;
    attacker.animTimer = 0;
    attacker.animFinished = false;
    attacker.attackTimer = 30; // 30 frames for heavy animation
    attacker.hasHit = true; // Set to true so custom checkHit doesn't double-hit
    attacker.comboWindow = 60; // Long combo window to continue combo
    
    // Make sure attacker faces defender
    attacker.facingRight = defender.pos.x > attacker.pos.x;

    // 2) Check distance to apply guaranteed hit (rectangular math is best for fighters)
    const dx = defender.pos.x - attacker.pos.x;
    const dy = defender.pos.y - attacker.pos.y;
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    // If defender is within strike range (e.g. 150px)
    if (distanceX <= 150 && distanceY <= 100) {
      // Check if defender is blocking
      const isFacingAttacker = (defender.facingRight && !attacker.facingRight) || (!defender.facingRight && attacker.facingRight);
      const isBlocking = (
        defender.state === PlayerState.BLOCKING ||
        defender.state === PlayerState.BLOCKING_CROUCH ||
        defender.state === PlayerState.BLOCKING_AIR ||
        defender.state === PlayerState.WALK_BACKWARD
      ) && isFacingAttacker;

      if (isBlocking) {
        // Guard hit
        defender.takeDamage(15);
        defender.guard = Math.max(0, defender.guard - 25);
        defender.guardRegenTimer = GUARD_REGEN_DELAY;
        defender.velocity.x = attacker.facingRight ? 12 : -12;
        defender.stunTimer = 15;
        
        try {
          AudioManager.getInstance().playSFX("block");
        } catch (e) {
          console.warn("Failed to play block SFX:", e);
        }

        engine.particleManager.spawn(
          "BLOCK",
          defender.x,
          defender.y + defender.height / 2,
          5,
          "#60a5fa"
        );
      } else {
        // Satisfying hit!
        attacker.comboCount++;
        attacker.ki = Math.min(MAX_KI, attacker.ki + 40); // gain some Ki
        
        // Apply damage
        defender.takeDamage(45); // highly satisfying HEAVY damage

        // Place defender in launched / knockback state
        defender.state = PlayerState.LAUNCHED;
        defender.isGrounded = false;
        
        // Classic DBZ Vanish blow away: knock back hard horizontally
        const knockSpeedX = attacker.facingRight ? 18 : -18;
        defender.velocity.x = knockSpeedX;
        defender.velocity.y = -3; // slight upward pop for smash feel
        defender.stunTimer = 60; // long stun so player can follow up (e.g. with super dash!)
        defender.gravityDisabledTimer = 15; // suspend for 15 frames for follow-up fluidity

        // Camera shake and hit effects
        if (engine.camera) {
          engine.camera.addScreenShake(10, 10, "IMPULSE", 1.2);
        }

        try {
          // Play satisfying heavy hit sound!
          AudioManager.getInstance().playSFX("heavy_hit");
        } catch (e) {
          try {
            AudioManager.getInstance().playSFX("attack");
          } catch (e2) {}
        }

        // Spawn beautiful hit spark particles
        engine.particleManager.spawnHitSpark(
          defender.x + defender.width / 2,
          defender.y + defender.height / 2,
          true
        );

        engine.particleManager.spawn(
          "IMPACT",
          defender.x + defender.width / 2,
          defender.y + defender.height / 2,
          3
        );
      }
    }
  }
}
