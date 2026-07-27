import { GameEngine } from "./GameEngine";
import { Player } from "./Player";
import { Projectile } from "./Projectile";
import { Genkidama } from "./Genkidama";
import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { PROJECTILE_DATABASE } from "../constants/ProjectileDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { CollisionHelper } from "./CollisionHelper";
import { PlayerState, IntroPhase, InputState } from "../types";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { AnimationManager } from "./AnimationManager";
import {
  MAX_GUARD,
  WORLD_HEIGHT,
  GRAVITY,
  CAM_MAX_ZOOM,
  SPAWN_CENTER_OFFSET,
  GUARD_REGEN_DELAY,
} from "../constants";
import { MAX_KI, KI_GAIN_ON_DAMAGE } from "../constants";
import { resolveAnimationKey } from "./AnimationResolver";
import { VoiceManager } from "../src/engine/audio/VoiceManager";
import { AudioManager } from "./AudioManager";

export class UltimateManager {
  public static updateUltimate(engine: GameEngine, p: Player, opp: Player) {
    if (!p || !opp) return;
    if (p.state !== PlayerState.ULTIMATE) return;

    // Keep opponent completely disabled during the entire Ultimate
    // Stun logic removed. We rely on the cinematic dash intercepting or beam check.

    // allow movement if being launched
    const isGokuSsjLaunching =
      p.data.id === "goku_ssj" &&
      p.ultType === 2 && (
        (p.ultPhase === 2 && !!p["ultLaunched_F2"]) ||
        (p.ultPhase === 3 && !!p["ultLaunched_F3"])
      );

    const isMuiLaunching =
      p.data.id === "goku_mui" &&
      ((p.ultType === 2 && (p.ultPhase === 2 || p.ultPhase === 3)) ||
       (p.ultType === 1 && p.ultPhase === 2));

    const isTrunksLaunching =
      p.data.id === "trunks_ssj2" &&
      ((p.ultType === 2 &&
        (p.ultPhase === 3 ||
          p.ultPhase === 4 ||
          p.ultPhase === 5 ||
          p.ultPhase === 6 ||
          p.ultPhase === 12)) ||
        (p.ultType === 1 && p.ultPhase === 4));

    const isGohanLaunching =
      p.data.id === "teen_gohan_ssj2" &&
      ((p.ultType === 2 && p.ultPhase >= 2) ||
        (p.ultType === 1 && p.ultPhase >= 4));

    let freezeOpponent = true;

    if (p.ultPhase === 2) {
      // Phase 2 is almost universally the "active" approach or beam loop phase
      freezeOpponent = false;
      if (((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base") || p.data.id === "vegeta_ego" || p.data.id === "goku_black_rose") && p.ultType === 2) {
        freezeOpponent = true;
      }
    }
    if (p.data.id === "teen_gohan_ssj2") {
      if (p.ultType === 1 && p.ultPhase >= 4) freezeOpponent = false;
      if (p.ultType === 2 && p.ultPhase >= 2) freezeOpponent = false;
    }
    if (p.data.id === "goku_mui" && p.ultType === 1) {
      if (p.ultPhase === 2) {
        freezeOpponent = false;
      } else if (p.ultPhase >= 1 && p.ultPhase <= 9) {
        freezeOpponent = true;
      }
    }

    if (p.data.id === "goku_mui" && p.ultType === 2 && p.ultPhase === 3.5) {
      freezeOpponent = false;
    }
    if (p.data.id === "trunks_ssj2" && p.ultType === 2 && p.ultPhase === 4) {
      freezeOpponent = false;
    }
    if (((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base") || p.data.id === "vegeta_ego") && p.ultType === 2 && p.ultPhase >= 5) {
      // Genkidama falling phase, let opponent attempt to move/block
      freezeOpponent = false;
    }
    if (p.data.id === "goku_black_rose" && p.ultType === 2 && p.ultPhase >= 3) {
      // Hakai thrown
      freezeOpponent = false;
    }


    // Goku base combined ultimate phase 4 release frame check and phase 5/6 physics restoration
    if (((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base")) && p.ultType === 3) {
      if (p.ultPhase >= 5) {
        freezeOpponent = false;
      } else if (p.ultPhase === 4) {
        const animKey = "Ultimate_combinado_4";
        const anim = p.data.spriteConfig?.animations?.[animKey];
        let totalFrames = anim?.frames || 15;
        if (anim && anim.isGif && anim.imageUrl) {
          const gifFrames = AnimationManager.getInstance().getGifFrameCount(anim.imageUrl);
          if (gifFrames > 1) {
            totalFrames = gifFrames;
          }
        }
        const isNearEnd = p.animFrame >= totalFrames - 2;
        if (isNearEnd) {
          freezeOpponent = false;
        }
      }
    }

    // Kuririn combined ultimate phase-by-phase precise freeze handling
    if (p.data.id === "kuririn" && p.ultType === 3) {
      if (p.ultPhase <= 3) {
        freezeOpponent = true;
      } else if (p.ultPhase === 4) {
        freezeOpponent = false;
      } else if (p.ultPhase === 5) {
        freezeOpponent = !(p as any).kuririn_ph5_launched;
      } else if (p.ultPhase === 6) {
        freezeOpponent = !(p as any).kuririn_ph6_launched;
      } else if (p.ultPhase === 7) {
        freezeOpponent = !(p as any).kuririn_ph7_launched;
      } else if (p.ultPhase === 8 || p.ultPhase === 9) {
        freezeOpponent = true;
      } else {
        freezeOpponent = false;
      }
    }

    if (freezeOpponent) {
      if (!isGokuSsjLaunching && !isMuiLaunching && !isTrunksLaunching) {
        opp.velocity.x = 0;
      }
      if (
        p.ultPhase !== 6 &&
        !isGokuSsjLaunching &&
        !isMuiLaunching &&
        !isTrunksLaunching &&
        !isGohanLaunching
      ) {
        opp.velocity.y = 0;
      }
    }

    p.ultTimer++;

    // Phase progression
    // Phase progression
    if (p.data.id === "goku_mui" && p.ultType === 1) {
      p.comboStep = p.ultPhase - 1;
      switch (p.ultPhase) {
        case 1: // Fase 1: Preparação
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Fase 2: Avanço
          p.velocity.y = 0;
          p.velocity.x = p.facingRight ? 28 : -28;

          // Check collision with opponent
          const dist2X = Math.abs(p.pos.x - opp.pos.x);
          const dist2Y = Math.abs(p.pos.y - opp.pos.y);
          const coll2 = dist2X < (p.width + opp.width) / 2 + 10 && dist2Y < 150;

          if (coll2) {
            p.velocity.x = 0;
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
            opp.takeDamage(5);
            opp.state = PlayerState.HIT;
            opp.stunTimer = 100;
          } else if (p.ultTimer > 30) { // 0.5s at 60fps is 30 ticks
            // Cancel if no collision
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
          }
          break;
        case 3: // Fase 3: Impacto
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // Fase 4: Passagem (Atravessa instantaneamente)
          p.velocity.x = 0;
          p.velocity.y = 0;
          // Teleport behind opponent
          const side = p.pos.x < opp.pos.x ? 1 : -1;
          p.pos.x = opp.pos.x + side * 80;
          p.facingRight = side < 0;
          p.ultPhase = 5;
          p.ultTimer = 0;
          p.animFinished = false;
          break;
        case 5: { // Fase 5: Sequência de 5 Teleportes
          opp.state = PlayerState.HIT;
          opp.stunTimer = 60;
          
          // Opponent stuck to Goku's center
          opp.pos.x = p.pos.x;
          opp.pos.y = p.pos.y - p.height / 2 + opp.height / 2;
          opp.velocity.x = 0;
          opp.velocity.y = 0;

          const telInt = 15;
          const tIdx = Math.floor(p.ultTimer / telInt);

          if (p.ultTimer % telInt === 0 && tIdx < 5) {
            try {
              AudioManager.getInstance().playSFX("teleport");
            } catch (e) {}

            if (tIdx === 4) {
              // Last one on ground
              p.pos.y = WORLD_HEIGHT - engine.groundY;
            } else {
              // Random teleports
              const mX = engine.physLimitLeft + 150;
              const MX = engine.physLimitRight - 150;
              p.pos.x = mX + Math.random() * (MX - mX);
              const mY = 200;
              const MY = 500;
              p.pos.y = WORLD_HEIGHT - engine.groundY - (mY + Math.random() * (MY - mY));
            }
            p.facingRight = p.pos.x < engine.worldWidth / 2;
            opp.takeDamage(15);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y, true);
            } catch (e) {}
          }

          if (p.ultTimer >= 75) { // 5 * 15
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 6: // Fase 6: Imobilização
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.HIT;
          opp.stunTimer = 60;
          
          // Ensure opponent stays in place (gravity disabled by freezeOpponent)
          // but we can enforce position if it was defined in previous phase
          // Phase 5 ended on ground, so they stay on ground.

          if (p.animFinished && p.ultTimer > 10) {
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 7: // Fase 7
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 8: // Fase 8
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 9;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 9: // Fase 9: Parado
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer > 20) {
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
          }
          break;
      }
    }

    if (p.data.id === "goku_mui" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: // Fase 1: parado na animação inicial
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Fase 2: avança em linha reta na direção em que está olhando
          p.velocity.y = 0;
          p.velocity.x = p.facingRight ? 28 : -28;

          // Check collision with opponent
          const distanceX = Math.abs(p.pos.x - opp.pos.x);
          const distanceY = Math.abs(p.pos.y - opp.pos.y);
          const collides = distanceX < (p.width + opp.width) / 2 + 10 && distanceY < 150;

          if (collides) {
            p.velocity.x = 0;
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;

            // Deal initial small hit
            opp.takeDamage(10);
            opp.state = PlayerState.HIT;
            opp.stunTimer = 60;
            try {
              engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
            } catch (err) {}
          } else if (p.ultTimer > 60) {
            // Cancel immediately if 1s passes without collision
            p.velocity.x = 0;
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // Fase 3: parado executando a animação correspondente
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // Fase 4: parado executando a animação correspondente
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: { // Fase 5: oponente preso, realiza 6 teletransportes consecutivos dentro dos limites
          // O oponente fica preso ao personagem durante toda a fase.
          opp.state = PlayerState.HIT;
          opp.stunTimer = 60;
          opp.velocity.x = 0;
          opp.velocity.y = 0;

          const teleportInterval = 12;
          const tIndex = Math.floor(p.ultTimer / teleportInterval); // 0, 1, 2, 3, 4, 5

          if (p.ultTimer % teleportInterval === 0 && tIndex < 6) {
            try {
              AudioManager.getInstance().playSFX("teleport");
              engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 10, "#ffffff");
            } catch (err) {}

            if (tIndex === 5) {
              // No sexto e último teletransporte, o personagem é reposicionado no chão da arena.
              p.pos.y = WORLD_HEIGHT - engine.groundY;
              const minX = engine.physLimitLeft + 100;
              const maxX = engine.physLimitRight - 100;
              p.pos.x = minX + Math.random() * (maxX - minX);
            } else {
              // Teleport random position within arena boundaries
              const minX = engine.physLimitLeft + 100;
              const maxX = engine.physLimitRight - 100;
              p.pos.x = minX + Math.random() * (maxX - minX);
              const minY = 200;
              const maxY = 450;
              p.pos.y = WORLD_HEIGHT - engine.groundY - (minY + Math.random() * (maxY - minY));
            }

            // Flip facing towards center/each other to look nice
            p.facingRight = p.pos.x < engine.worldWidth / 2;

            // Deal tick damage
            opp.takeDamage(10);
            try {
              engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, true);
            } catch (err) {}
          }

          // Lock opponent coordinates relative to Goku
          opp.pos.x = p.pos.x;
          opp.pos.y = p.pos.y - p.height / 2 + opp.height / 2;

          if (p.ultTimer >= 72) {
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 6: // Fase 6: oponente suspenso no ar acima do personagem
          p.velocity.x = 0;
          p.velocity.y = 0;

          // Suspend opponent high above
          opp.pos.x = p.pos.x;
          opp.pos.y = p.pos.y - 250;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.HIT;
          opp.stunTimer = 60;

          if (p.animFinished && p.ultTimer > 20) {
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 7: // Fase 7: oponente continua suspenso no ar, goku executa animação
          p.velocity.x = 0;
          p.velocity.y = 0;

          opp.pos.x = p.pos.x;
          opp.pos.y = p.pos.y - 250;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.HIT;
          opp.stunTimer = 60;

          if (p.ultTimer % 5 === 0) {
            opp.takeDamage(12);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y, false);
              engine.particleManager.spawn("ENERGY", opp.pos.x, opp.pos.y, 8, "#60a5fa", { size: 20, speed: 8 });
            } catch (err) {}
          }

          if (p.animFinished && p.ultTimer > 20) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 8: // Fase 8: goku permanece parado na animação final, encerra o golpe
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            opp.takeDamage(45);
            opp.state = PlayerState.KNOCKED_DOWN;
            opp.stunTimer = 60;
            opp.velocity.y = -10;
            opp.velocity.x = p.facingRight ? 16 : -16;
            if (engine.camera) {
              engine.camera.addScreenShake(40, 20, "IMPULSE", 1.0);
            }
          }

          if (p.animFinished && p.ultTimer > 5) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
      }
    } else if (p.data.id === "vegeta_base" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: // INICIO
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // MEIO
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // CUTSCENE (Super Kamehameha focus)
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // LOOP (Shooting Beam)
          p.velocity.y = 0;
          if (p.ultTimer % 5 === 0) {
            {
              const isFacing =
                (p.facingRight && !opp.facingRight) ||
                (!p.facingRight && opp.facingRight);
              const isBlocking =
                isFacing &&
                (opp.state === PlayerState.BLOCKING ||
                  opp.state === PlayerState.BLOCKING_CROUCH ||
                  opp.state === PlayerState.BLOCKING_AIR ||
                  opp.state === PlayerState.WALK_BACKWARD);
              const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
              if (opp.invincibleTimer <= 0 && inY) {
                if (isBlocking) {
                  opp.takeDamage(10 * 0.1);
                  opp.guard -= 10 * 0.5;
                  if (engine.particleManager)
                    engine.particleManager.spawn(
                      "BLOCK",
                      opp.pos.x,
                      opp.pos.y - 50,
                      2,
                      "#60a5fa",
                    );
                  opp.velocity.x = p.facingRight ? 5 : -5;
                  if (opp.guard <= 0) {
                    opp.state = PlayerState.GUARD_BREAK;
                    opp.stunTimer = 60;
                  }
                } else {
                  opp.takeDamage(10);
                  opp.stunTimer = Math.max(opp.stunTimer, 20);
                }
              }
            }
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              false,
            );
          }
          if (p.ultTimer >= 60) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: // FINAL
          p.velocity.y = 0;
          if (p.ultTimer === 1) {
            {
              const isFacing =
                (p.facingRight && !opp.facingRight) ||
                (!p.facingRight && opp.facingRight);
              const isBlocking =
                isFacing &&
                (opp.state === PlayerState.BLOCKING ||
                  opp.state === PlayerState.BLOCKING_CROUCH ||
                  opp.state === PlayerState.BLOCKING_AIR ||
                  opp.state === PlayerState.WALK_BACKWARD);
              const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
              if (opp.invincibleTimer <= 0 && inY) {
                if (isBlocking) {
                  opp.takeDamage(100 * 0.1);
                  opp.guard -= 100 * 0.5;
                  if (engine.particleManager)
                    engine.particleManager.spawn(
                      "BLOCK",
                      opp.pos.x,
                      opp.pos.y - 50,
                      2,
                      "#60a5fa",
                    );
                  opp.velocity.x = p.facingRight ? 5 : -5;
                  if (opp.guard <= 0) {
                    opp.state = PlayerState.GUARD_BREAK;
                    opp.stunTimer = 60;
                  }
                } else {
                  opp.takeDamage(100);
                  opp.stunTimer = Math.max(opp.stunTimer, 20);
                }
              }
            }
            engine.particleManager.spawn(
              "ENERGY",
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              30,
              "#3b82f6",
              { size: 15, speed: 10 },
            );
            opp.velocity.x = p.facingRight ? 40 : -40;
            opp.velocity.y = -10;
            opp.state = PlayerState.HIT;
            opp.stunTimer = 60;
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
      }
    } else if (p.data.id === "goku_black_rose" && p.ultType === 2) {
      const ownerId_ = p === engine.player1 ? "p1" : "p2";
      const glowColor = "#c026d3"; // Fuchsia / Purple for Hakai

      const genki = engine.projectiles.find(
        (proj) => proj instanceof Genkidama && proj.ownerId === ownerId_ && proj.active
      ) as Genkidama | undefined;

      switch (p.ultPhase) {
        case 1: // 1. Goku black teleporta. Zamasu aparece do lado (Z1).
          if (p.ultTimer === 1) {
            p.x = p.facingRight ? opp.x - 240 : opp.x + 240;
            p.y = Math.max(50, opp.y - 250); // Same as goku_base_swl
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.isGrounded = false;

            // Spawn Zamasu (Z1)
            const zamasuAnim = p.data.spriteConfig?.animations?.["ULTIMATE_2_Z1"];
            const z1_x = p.facingRight ? p.x + 80 : p.x - 80;
            const z1_y = p.y;
            const proj = Projectile.spawn(
              z1_x, z1_y, 0, ownerId_, p.data.color, false, "ZAMASU_ULT2", 100, 100,
              zamasuAnim?.offsetX || 0, zamasuAnim?.offsetY || 0, zamasuAnim?.scale || 2.2, 0, "STRAIGHT"
            );
            proj.disabledCollision = true;
            proj.freezeOnLastFrame = true;
            proj.initialFacingRight = p.facingRight;
            if (zamasuAnim) { proj.customAnimData = zamasuAnim; }
            engine.projectiles.push(proj);
          }
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 15) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;

            // Switch to Z2
            const oldZamasu = engine.projectiles.find(proj => proj.ownerId === ownerId_ && proj.beamFamilyId === "ZAMASU_ULT2");
            if (oldZamasu) oldZamasu.active = false;

            const zamasuAnim2 = p.data.spriteConfig?.animations?.["ULTIMATE_2_Z2"];
            const z2_x = p.facingRight ? p.x + 80 : p.x - 80;
            const z2_y = p.y;
            const proj2 = Projectile.spawn(
              z2_x, z2_y, 0, ownerId_, p.data.color, false, "ZAMASU_ULT2_LOOP", 100, 100,
              zamasuAnim2?.offsetX || 0, zamasuAnim2?.offsetY || 0, zamasuAnim2?.scale || 2.2, 0, "STRAIGHT"
            );
            proj2.disabledCollision = true;
            proj2.freezeOnLastFrame = false; // loops
            proj2.initialFacingRight = p.facingRight;
            if (zamasuAnim2) { proj2.customAnimData = zamasuAnim2; }
            engine.projectiles.push(proj2);
          }
          break;

        case 2: // 2. G1/Z2 in loop, creates Hakai Genkidama
          p.velocity.y = 0;
          const HAKAI_GROW_TIME = 150;

          if (p.ultTimer === 1) {
            const genkiProj = new Genkidama(ownerId_, "GENKIDAMA_3", p.x + (p.facingRight ? 20 : -20), p.y - 120, p.data.color, engine);
            engine.projectiles.push(genkiProj);
          }

          if (p.ultTimer > HAKAI_GROW_TIME) {
            // Launch Hakai
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;

            if (genki) {
              genki.genkidamaState = "throw";
            }

            // Switch to Z3
            const oldZamasu2 = engine.projectiles.find(proj => proj.ownerId === ownerId_ && proj.beamFamilyId === "ZAMASU_ULT2_LOOP");
            if (oldZamasu2) oldZamasu2.active = false;

            const zamasuAnim3 = p.data.spriteConfig?.animations?.["ULTIMATE_2_Z3"];
            const z3_x = p.facingRight ? p.x + 80 : p.x - 80;
            const z3_y = p.y;
            const proj3 = Projectile.spawn(
              z3_x, z3_y, 0, ownerId_, p.data.color, false, "ZAMASU_ULT2_END", 100, 100,
              zamasuAnim3?.offsetX || 0, zamasuAnim3?.offsetY || 0, zamasuAnim3?.scale || 2.2, 0, "STRAIGHT"
            );
            proj3.disabledCollision = true;
            proj3.freezeOnLastFrame = true; // wait on last frame
            proj3.initialFacingRight = p.facingRight;
            if (zamasuAnim3) { proj3.customAnimData = zamasuAnim3; }
            engine.projectiles.push(proj3);
          }
          break;

        case 3: // 3. Lança Hakai
          p.velocity.y = 0;
          if (genki && genki.genkidamaState === "ground") {
            p.ultPhase = 4;
            p.ultTimer = 0;
          } else if (!genki) {
            p.ultPhase = 5;
            p.ultTimer = 0;
          }
          break;

        case 4: // CHAO (Ground)
          p.velocity.y = 0;
          if (genki && genki.genkidamaState === "explode") {
            p.ultPhase = 5;
            p.ultTimer = 0;
          } else if (!genki) {
            p.ultPhase = 5;
            p.ultTimer = 0;
          }
          break;

        case 5: // EXPLODE
          p.velocity.y = 0;
          if (!genki) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;

            const oldZamasuEnd = engine.projectiles.find(proj => proj.ownerId === ownerId_ && proj.beamFamilyId === "ZAMASU_ULT2_END");
            if (oldZamasuEnd) oldZamasuEnd.active = false;
          }
          break;
      }
    } else if (p.data.id === "goku_black_rose" && p.ultType === 1) {
      const ownerId_ = p === engine.player1 ? "p1" : "p2";
      switch (p.ultPhase) {
        case 1: // 1. Personagem vai subindo para o alto até ficar numa altura boa acima do oponente
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            p.velocity.y = -10;
          }
          const targetY = Math.max(50, opp.y - 250);
          if (p.y <= targetY || p.y <= 50) {
            p.y = Math.min(p.y, targetY);
            p.velocity.y = 0;
            p.ultPhase = 2;
            p.ultTimer = 0;
          }
          break;
        case 2: // 2. Personagem parado no ar
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
            p["beamsCreated"] = 0;
          }
          break;
        case 3: // 3. Ao finalizar animação congelar último frame! Criar 8 fechos de energia 5 seguidos!
          p.velocity.y = 0;
          // Congela frame (animFinished never trigger next step automatically if handled correctly)
          if (p.animFinished) {
            p.animFinished = false;
          }

          if (p.ultTimer > 10 && p.ultTimer % 10 === 0 && p["beamsCreated"] < 8) {
            p["beamsCreated"]++;
            const beamX = opp.x + opp.width / 2 + (Math.random() - 0.5) * 150;
            const beamY = opp.y - 350 - Math.random() * 50;
            const proj = Projectile.spawn(
              beamX, beamY, 0, ownerId_, p.data.color, false, "FECHO_5", 50, 100,
              0, 0, 2.0, 0, "STRAIGHT"
            );
            proj.vy = 25; // Fecho desce do alto em direção ao chão
            proj.vx = 0;
            proj.life = 60; // Max time to live just in case
            engine.projectiles.push(proj);
          }

          // Observação: animação do personagem segue a sequência assim que os 8 fechos forem criados!
          if (p["beamsCreated"] >= 8 && p.ultTimer > 10 * 8 + 30) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // 4. Finalizando
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: // 5. Final
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.state = PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
      }

    } else if ((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base_swl" || p.data.id === "goku_base")) {
      const glowColor = "#3b82f6";
      const blockColor = "#60a5fa";
      if (p.ultType === 1) {
        switch (p.ultPhase) {
          case 1:
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 2:
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 3:
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
              if (engine.camera) engine.camera.addScreenShake(60, 8, "PERLIN", 1);
            }
            break;
          case 4:
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 5: // Intro transition (preparation)
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 6;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 6: // Intro transition (releasing stance)
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 7;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 7: // FIRE BEAM LOOP and BEAM FINAL in Ultimate_1_7
            p.velocity.y = 0;
            // Continuous tick damage while firing the giant beam
            if (p.ultTimer < 60 && p.ultTimer % 5 === 0) {
              const isFacing = (p.facingRight && !opp.facingRight) || (!p.facingRight && opp.facingRight);
              const isBlocking = isFacing && (opp.state === PlayerState.BLOCKING || opp.state === PlayerState.BLOCKING_CROUCH || opp.state === PlayerState.BLOCKING_AIR || opp.state === PlayerState.WALK_BACKWARD);
              const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
              if (opp.invincibleTimer <= 0 && inY) {
                if (isBlocking) {
                  opp.takeDamage(10 * 0.1);
                  opp.guard -= 10 * 0.5;
                  if (engine.particleManager) engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, "#60a5fa");
                  opp.velocity.x = p.facingRight ? 5 : -5;
                  if (opp.guard <= 0) {
                    opp.state = PlayerState.GUARD_BREAK;
                    opp.stunTimer = 60;
                  }
                } else {
                  opp.takeDamage(10);
                  opp.stunTimer = Math.max(opp.stunTimer, 20);
                }
              }
              if (engine.particleManager) {
                engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
                engine.particleManager.spawn("AURA", opp.x - 20, opp.y, 5, "#3b82f6");
              }
            }

            // Heavy final hit of the beam at tick 60
            if (p.ultTimer === 60) {
              if (engine.camera) engine.camera.addScreenShake(15, 12, "IMPULSE", 1);
              const isFacing = (p.facingRight && !opp.facingRight) || (!p.facingRight && opp.facingRight);
              const isBlocking = isFacing && (opp.state === PlayerState.BLOCKING || opp.state === PlayerState.BLOCKING_CROUCH || opp.state === PlayerState.BLOCKING_AIR || opp.state === PlayerState.WALK_BACKWARD);
              const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
              if (opp.invincibleTimer <= 0 && inY) {
                if (isBlocking) {
                  opp.takeDamage(100 * 0.1);
                  opp.guard -= 100 * 0.5;
                  if (engine.particleManager) engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, "#60a5fa");
                  opp.velocity.x = p.facingRight ? 5 : -5;
                  if (opp.guard <= 0) {
                    opp.state = PlayerState.GUARD_BREAK;
                    opp.stunTimer = 60;
                  }
                } else {
                  opp.takeDamage(100);
                  opp.stunTimer = Math.max(opp.stunTimer, 20);
                }
              }
              if (engine.particleManager) {
                engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 2, 30, "#3b82f6", { size: 15, speed: 10 });
              }
              opp.velocity.x = p.facingRight ? 40 : -40;
              opp.velocity.y = -10;
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
            }

            // Terminate Ultimate and return to standard states
            if (p.ultTimer >= 70 || (p.animFinished && p.ultTimer > 65)) {
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
            }
            break;
        }
      } else if (p.ultType === 2) {
        const ownerId_ = p === engine.player1 ? "p1" : "p2";
        const genki = engine.projectiles.find(
          (proj) => proj instanceof Genkidama && proj.ownerId === ownerId_ && proj.active
        ) as Genkidama | undefined;

        // Keep Goku Base suspended completely and immune to gravity/movement in air
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.gravityDisabledTimer = 5;
        p.isGrounded = false;

        switch (p.ultPhase) {
          case 1:
            if (p.ultTimer === 1) {
              p.x = p.facingRight ? opp.x - 240 : opp.x + 240;
              p.y = Math.max(50, opp.y - 250);
              try {
                VoiceManager.getInstance().playVoice(
                  "/Assets/SONS/DUBLAGEM/GOKU%20BASE/HORA%20DE%20RECEBER%20MINHA%20TECNICA%20SUPREMA%20A%20GENKIDAMA.wav"
                );
              } catch (err) {
                console.error("Failed to play goku base voice:", err);
              }
              try {
                AudioManager.getInstance().playSFX("goku_base_genkidama_inicio");
              } catch (err) {
                console.error("Failed to play goku_base_genkidama_inicio:", err);
              }
            }
            if ((p.animFinished || p.ultTimer > 40) && p.ultTimer > 15) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 2:
            if ((p.animFinished || p.ultTimer > 40) && p.ultTimer > 15) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 3: {
            const GROW_TIME = 120;
            if (p.ultTimer === 1) {
              const genkiProj = new Genkidama(ownerId_, "CHAVE_GENKIDAMA_4", p.x + p.width / 2, p.y - 180, p.data.color, engine);
              engine.projectiles.push(genkiProj);
              try {
                AudioManager.getInstance().playSFX("goku_base_genkidama_criando");
              } catch (err) {
                console.error("Failed to play goku_base_genkidama_criando:", err);
              }
            }
            if (p.ultTimer >= GROW_TIME) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 4:
            if (p.ultTimer === 1) {
              try {
                VoiceManager.getInstance().playVoice(
                  "/Assets/SONS/DUBLAGEM/GOKU%20BASE/QUERO%20VER%20VOC%C3%8A%20AGUENTAR.wav"
                );
              } catch (err) {
                console.error("Failed to play QUERO VER VOCÊ AGUENTAR:", err);
              }
            }
            if ((p.animFinished || p.ultTimer > 40) && p.ultTimer > 15) {
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
              if (genki) {
                genki.genkidamaState = "throw";
              }
            }
            break;
          case 5: {
            p.velocity.y = 0;
            if (genki && genki.genkidamaState === "ground") {
              p.ultPhase = 6;
              p.ultTimer = 0;
            } else if (!genki) {
              p.ultPhase = 7;
              p.ultTimer = 0;
            }
            break;
          }
          case 6: {
            p.velocity.y = 0;
            if (genki && genki.genkidamaState === "explode") {
              p.ultPhase = 7;
              p.ultTimer = 0;
            } else if (!genki) {
              p.ultPhase = 7;
              p.ultTimer = 0;
            }
            break;
          }
          case 7:
            p.velocity.y = 0;
            if (!genki) {
              p.state = PlayerState.FALLING;
              p.ataque = false;
              p.isGrounded = false;
              p.ultPhase = 0;
            }
            break;
        }
      } else if (p.ultType === 3) {
        switch (p.ultPhase) {
          case 1: { // 1. parado
            p.velocity.x = 0;
            p.velocity.y = 0;
            const dirX = opp.pos.x - p.pos.x;
            p.facingRight = dirX >= 0;
            
            if (p.ultTimer === 1) {
              AudioManager.getInstance().playSFX("goku_base_kamehameha_inicio");
              if (engine.particleManager) {
                engine.particleManager.spawn("ENERGY", p.pos.x + p.width / 2, p.pos.y + p.height / 2, 10, "#fed7aa", { size: 10, speed: -2 });
              }
            }

            if (p.ultTimer >= 40) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 2: { // 2. Avança em linha reta
            p.velocity.y = 0;
            const dirX = opp.pos.x - p.pos.x;
            p.facingRight = dirX >= 0;
            p.velocity.x = p.facingRight ? 45 : -45;

            if (p.ultTimer === 1) {
              AudioManager.getInstance().playSFX("teleport");
            }

            if (p.ultTimer % 4 === 0 && engine.particleManager) {
              engine.particleManager.spawn("AURA", p.pos.x + p.width / 2, p.pos.y + p.height / 2, 2, "#fed7aa");
            }

            if (Math.abs(dirX) < 110 || p.ultTimer >= 40) {
              p.velocity.x = 0;
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 3: { // 3. aplica dano
            p.velocity.x = 0;
            p.velocity.y = 0;
            const dirX = opp.pos.x - p.pos.x;
            p.facingRight = dirX >= 0;

            if (p.ultTimer === 1) {
              opp.takeDamage(100);
              opp.state = PlayerState.HIT;
              opp.stunTimer = 65;
              opp.velocity.x = 0;
              opp.velocity.y = 0;
              AudioManager.getInstance().playSFX("punch");
              if (engine.camera) engine.camera.addScreenShake(15, 8, "IMPULSE", 1);
              if (engine.particleManager) {
                engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, true);
                engine.particleManager.spawn("ENERGY", opp.pos.x, opp.pos.y - 50, 10, "#fb923c", { size: 12, speed: 5 });
              }
            }

            if (p.ultTimer >= 30) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 4: { // 4. Combined Ultimate Phase 4: Posiciona acima, agarra e gira oponente pelas costas
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              // Posicionar o atacante acima do oponente
              p.pos.y = opp.pos.y - 120;
              p.pos.x = opp.pos.x;
              
              // Nenhuma rotação adicional deve ser aplicada ao atacante por código
              p.rotation = 0;

              // Limpar afterimages para manter o visual limpo
              engine.afterimages = [];
              AudioManager.getInstance().playSFX("teleport");

              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 8, "#f97316");
              }
              (p as any).hasDecoupled = false;
            }

            const animKey = "Ultimate_combinado_4";
            const anim = p.data.spriteConfig?.animations?.[animKey];
            let totalFrames = anim?.frames || 15;
            if (anim && anim.isGif && anim.imageUrl) {
              const gifFrames = AnimationManager.getInstance().getGifFrameCount(anim.imageUrl);
              if (gifFrames > 1) {
                totalFrames = gifFrames;
              }
            }

            const isNearEnd = p.animFrame >= totalFrames - 2;

            if (!isNearEnd) {
              // Vincula o oponente ao ponto de agarrão e rotaciona pelas costas em direção à frente
              const maxGrappleFrame = Math.max(1, totalFrames - 2);
              const currentGrappleFrame = Math.min(maxGrappleFrame, p.animFrame);
              const progress = currentGrappleFrame / maxGrappleFrame;

              // Orbit angle: starts behind (180° if facing right, 0° if facing left), arches over the shoulders (to 270° / -90°), ends in front (360° / -180°)
              const orbitAngleDeg = p.facingRight 
                ? (180 + progress * 180) 
                : (0 - progress * 180);

              // 1.5 complete spin rotation (or a full 360-degree rotation) for the opponent's body to convey the grab motion beautifully
              const opponentSpin = p.facingRight ? (progress * 360) : -(progress * 360);
              opp.rotation = opponentSpin;

              // Movimento circular ao redor do atacante (pelas costas)
              const centerX = p.pos.x + p.width / 2;
              const centerY = p.pos.y + p.height / 2;
              const radius = 65; // Distância representativa do agarrão e carregamento pelas costas
              const angleRad = (orbitAngleDeg * Math.PI) / 180;

              const oppTargetCenterX = centerX + Math.cos(angleRad) * radius;
              const oppTargetUpperY = centerY + Math.sin(angleRad) * radius;

              // Posiciona oponente vinculando a parte superior do corpo (pescoço/cabeça) ao trajeto do agarrão
              opp.pos.x = oppTargetCenterX - opp.width / 2;
              opp.pos.y = oppTargetUpperY - opp.height * 0.25;

              opp.velocity.x = 0;
              opp.velocity.y = 0;
              opp.state = PlayerState.HIT;
              opp.stunTimer = 10;
              opp.gravityDisabledTimer = 5;

              if (p.ultTimer % 4 === 0 && engine.particleManager) {
                engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, false);
                AudioManager.getInstance().playSFX("punch");
              }
            } else {
              // Desacoplado do ponto de agarrão
              opp.rotation = 0;

              // Aplica impulso de lançamento para frente e para cima (trajetória ascendente horizontal) no exato instante de desacoplamento
              if (!(p as any).hasDecoupled) {
                (p as any).hasDecoupled = true;
                opp.takeDamage(100);

                // Elevada velocidade horizontal (58) e forte velocidade vertical para cima (-22) para uma trajetória alta e horizontal
                opp.velocity.x = p.facingRight ? 58 : -58;
                opp.velocity.y = -22;
                opp.isGrounded = false;
                opp.state = PlayerState.HIT;
                opp.stunTimer = 65;
                opp.gravityDisabledTimer = 0; // Física normal de gravidade restaurada imediatamente

                AudioManager.getInstance().playSFX("hit");
                AudioManager.getInstance().playSFX("explosion");

                if (engine.camera) engine.camera.addScreenShake(30, 15, "IMPULSE", 1.25);
                if (engine.particleManager) {
                  engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, true);
                  engine.particleManager.spawn("ENERGY", opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, 18, "#fb923c", { size: 18, speed: 8 });
                }
              }
            }

            // Oponente avança para a fase 5 no término da animação do atacante
            if (p.animFinished || (p as any).customAnimFinishedThisFrame || p.ultTimer >= 65) {
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 5: { // 5. posiciona acima do oponente um pouco longe
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              const faceDir = opp.pos.x >= p.pos.x;
              p.facingRight = faceDir;
              p.pos.x = faceDir ? opp.pos.x - 220 : opp.pos.x + 220;
              p.pos.y = opp.pos.y - 300;
              p.velocity.x = 0;
              p.velocity.y = 0;

              AudioManager.getInstance().playSFX("teleport");
              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#fed7aa");
              }
            }

            if (p.ultTimer % 5 === 0 && engine.particleManager) {
              engine.particleManager.spawn("ENERGY", p.pos.x + (p.facingRight ? 55 : -55), p.pos.y - 75, 4, "#fed7aa", { size: 12, speed: -4 });
            }

            if (p.ultTimer >= 35) {
              p.ultPhase = 6;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 6: { // 6. Lança o beam
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              if (engine.camera) {
                engine.camera.addScreenShake(45, 20, "IMPULSE", 1.2);
              }

              const config: any = p.data.spriteConfig?.animations?.["Ultimate_combinado_6"] || {};
              const beamId = config.createsBeam || "CHAVE_BEAM_001";
              const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
              let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
              const charOverrides = p.data.beamOverrides?.[beamId];
              if (famMiddle && charOverrides && charOverrides.middle) {
                famMiddle = { ...famMiddle, ...charOverrides.middle };
              }

              const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
              const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

              let spawnX = p.pos.x + p.width / 2;
              let spawnY = p.pos.y;

              const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
              const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

              if (p.facingRight) {
                spawnX = p.x + finalKiX;
              } else {
                spawnX = p.x + p.width - finalKiX - projWidth;
              }
              spawnY = p.y + finalKiY;

              const velX = p.facingRight ? 18 : -18;
              const velY = 12.6;
              const ownerId = p === engine.player1 ? "p1" : "p2";

              const proj = Projectile.spawn(
                spawnX,
                spawnY,
                velX,
                ownerId,
                "#ff7300",
                true,
                beamId,
                projWidth,
                projHeight,
                config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
                config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
                config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
              );
              proj.vy = velY;
              proj.sourceAnimConfig = config;

              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).hasSpawnedInSequence = true;
              (p as any).spawnedBeamProjectile = proj;
              engine.projectiles.push(proj);

              AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");

              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 25, "#f97316");
                engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, true);
              }
            }

            if (p.ultTimer % 5 === 0) {
              opp.takeDamage(25);
              opp.state = PlayerState.HIT;
              opp.stunTimer = 40;
              
              if (engine.camera) engine.camera.addScreenShake(5, 2, "PERLIN", 0.5);
              if (engine.particleManager) {
                engine.particleManager.spawn("ENERGY", opp.pos.x + (Math.random() - 0.5) * 50, opp.pos.y - 50, 4, "#ff7a00", { size: 14, speed: 6 });
                engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, false);
              }
            }

            if (p.ultTimer > 90) {
              opp.takeDamage(100);
              opp.velocity.x = p.facingRight ? 15 : -15;
              opp.velocity.y = 8;
              opp.isGrounded = false;
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
              
              const ownerId = p === engine.player1 ? "p1" : "p2";
              engine.projectiles.forEach((proj) => {
                if (proj.ownerId === ownerId && proj.isBeam && proj.active) {
                  proj.active = false;
                }
              });

              (p as any).beamSpawned = false;
              (p as any).hasSpawnedInSequence = false;
              (p as any).spawnedBeamProjectile = undefined;

              p.state = PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
            }
            break;
          }
        }
      }
    } else if (p.data.id === "vegeta_ego") {
const isEgo = p.data.id === "vegeta_ego";
const glowColor = isEgo ? "#7e22ce" : "#3b82f6";
const blockColor = isEgo ? "#4c1d95" : "#60a5fa";
      if (p.ultType === 1) {
        switch (p.ultPhase) {
          case 1: // PREP KAMEHAMEHA
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
              if (engine.camera)
                engine.camera.addScreenShake(60, 8, "PERLIN", 1);
            }
            break;
          case 2: // FIRE BEAM LOOP
            p.velocity.y = 0;
            if (p.ultTimer % 5 === 0) {
              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(10 * 0.1);
                    opp.guard -= 10 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa",
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(10);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
              engine.particleManager.spawn(
                "AURA",
                opp.x - 20,
                opp.y,
                5,
                glowColor,
              );
            }
            if (p.ultTimer >= 60) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 3: // BEAM FINAL
            p.velocity.y = 0;
            if (p.ultTimer === 1) {
              if (engine.camera)
                engine.camera.addScreenShake(15, 12, "IMPULSE", 1);
              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(100 * 0.1);
                    opp.guard -= 100 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        blockColor,
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(100);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              engine.particleManager.spawn(
                "ENERGY",
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                30,
                glowColor,
                { size: 15, speed: 10 },
              );
              opp.velocity.x = p.facingRight ? 40 : -40;
              opp.velocity.y = -10;
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
            }
            if (p.animFinished && p.ultTimer > 5) {
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
            }
            break;
        }
      } else {
        const ownerId_ = p === engine.player1 ? "p1" : "p2";
        const genki = engine.projectiles.find(
          (proj) => proj instanceof Genkidama && proj.ownerId === ownerId_ && proj.active
        ) as Genkidama | undefined;

        switch (p.ultPhase) {
          case 1: // INICIO
            if (p.ultTimer === 1) {
              p.x = p.facingRight ? opp.x - 240 : opp.x + 240;
              p.y = Math.max(50, opp.y - 250); // Teleporta pra perto e um pouco pra cima
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.isGrounded = false;
            }
            p.velocity.y = 0; // Suspend gravity
            if (p.animFinished && p.ultTimer > 15) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 2: // CUTSCENE
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 15) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 3: // CRIANDO
            p.velocity.y = 0;
            const GROW_TIME = 120; // 2 seconds

            if (p.ultTimer === 1) {
              const genkiProj = new Genkidama(ownerId_, "GENKIDAMA_2", p.x + p.width / 2, p.y - 75, p.data.color, engine);
              engine.projectiles.push(genkiProj);
            }

            if (p.animFinished && p.ultTimer >= GROW_TIME) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          case 4: // CUTSCENE MEIO (GATHER)
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 15) {
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
              if (genki) {
                genki.genkidamaState = "throw";
              }
            }
            break;
          case 5: {
            // FINAL (THROW)
            p.velocity.y = 0;
            if (genki && genki.genkidamaState === "ground") {
              p.ultPhase = 6;
              p.ultTimer = 0;
            } else if (!genki) {
              p.ultPhase = 7;
              p.ultTimer = 0;
            }
            break;
          }
          case 6: {
            p.velocity.y = 0;
            if (genki && genki.genkidamaState === "explode") {
              p.ultPhase = 7;
              p.ultTimer = 0;
            } else if (!genki) {
              p.ultPhase = 7;
              p.ultTimer = 0;
            }
            break;
          }
          case 7: // EXPLODE
            p.velocity.y = 0; // Keep character suspended while genkidama explodes
            if (!genki) {
              p.state = PlayerState.FALLING;
              p.ataque = false;
              p.isGrounded = false; // let gravity handle the character falling down
              p.ultPhase = 0;
            }
            break;
        }
      }
    } else if (p.data.id === "goku_ssj") {
      if (p.ultType === 1) {
        switch (p.ultPhase) {
          case 1: // Fase 1: Goku permanece parado executando a animação inicial da Ultimate.
            p.velocity.x = 0;
            p.velocity.y = 0;
            if ((p.animFinished && p.ultTimer >= 15) || p.ultTimer >= 45) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 2: // Fase 2: Teleporta na costa do oponente.
            p.velocity.x = 0;
            p.velocity.y = 0;
            if (p.ultTimer === 1) {
              p.x = opp.x + (opp.facingRight ? -75 : 75);
              p.y = opp.y;
              p.facingRight = (p.x < opp.x);
              
              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.x, p.y, 10, "#ffffff");
              }
              try {
                AudioManager.getInstance().playSFX("teleporte");
              } catch (err) {}
            }
            if ((p.animFinished && p.ultTimer >= 15) || p.ultTimer >= 50) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 3: // Fase 3: Parado
            p.velocity.x = 0;
            p.velocity.y = 0;
            if ((p.animFinished && p.ultTimer >= 15) || p.ultTimer >= 50) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 4: // Fase 4: Goku permanece parado executando a animação final da Ultimate e dispara o feixe CHAVE_BEAM_48!
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");
              if (engine.camera) {
                engine.camera.addScreenShake(40, 20, "IMPULSE", 1);
              }

              // Cria o Beam CHAVE_BEAM_48
              const config: any = p.data.spriteConfig?.animations?.["Ultimate_1_4"] || {};
              const beamId = config.createsBeam || "CHAVE_BEAM_48";
              const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
              let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
              const charOverrides = p.data.beamOverrides?.[beamId];
              if (famMiddle && charOverrides && charOverrides.middle) {
                 famMiddle = { ...famMiddle, ...charOverrides.middle };
              }

              const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
              const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

              let spawnX = p.pos.x + p.width / 2;
              let spawnY = p.pos.y;

              const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 71;
              const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

              if (p.facingRight) {
                spawnX = p.x + finalKiX;
              } else {
                spawnX = p.x + p.width - finalKiX - projWidth;
              }
              spawnY = p.y + finalKiY;

              const finalSpeed = config.projectileSpeed ?? famMiddle?.projectileSpeed ?? 22;
              const vx = p.facingRight ? finalSpeed : -finalSpeed;
              const vy = 0;

              const ownerId = p === engine.player1 ? "p1" : "p2";

              const proj = Projectile.spawn(
                spawnX,
                spawnY,
                vx,
                ownerId,
                p.data.color,
                true,
                beamId,
                projWidth,
                projHeight,
                config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
                config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
                config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
              );
              proj.vy = vy;
              proj.rotation = config.rotation ?? famMiddle?.rotation ?? 0;
              proj.sourceAnimConfig = config;

              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).spawnedBeamProjectile = proj;
              engine.projectiles.push(proj);
            }

            const hasActiveBeam1 = (p as any).spawnedBeamProjectile && (p as any).spawnedBeamProjectile.active;

            if (hasActiveBeam1) {
              const proj = (p as any).spawnedBeamProjectile;
              const polyPrj = CollisionHelper.getProjectileVertices(proj, engine);
              const polyOpp = CollisionHelper.getAABBVertices(opp);
              const isColliding = CollisionHelper.testPolygonCollision(polyPrj, polyOpp);

              if (isColliding) {
                (p as any).beamHasHitOpponent = true;

                if (opp.invincibleTimer <= 0) {
                  opp.state = PlayerState.STUNNED;
                  opp.stunTimer = Math.max(opp.stunTimer, 15);
                  opp.velocity.x = p.facingRight ? 1 : -1;
                  opp.velocity.y = 0;
                  
                  if (p.ultTimer % 5 === 0) {
                    opp.takeDamage(4);
                    try {
                      engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
                    } catch (err) {}
                  }
                }
              }
            } else {
              // Beam acabou ou foi destruído! Aplica o dano final de 90 e o grande knockback!
              if (p.ultTimer > 5) {
                if ((p as any).beamHasHitOpponent) {
                  if (opp.invincibleTimer <= 0) {
                    const finalDamage = 90;
                    opp.takeDamage(finalDamage);
                    opp.state = PlayerState.HIT;
                    opp.stunTimer = 60;
                    opp.velocity.x = p.facingRight ? 2 : -2;
                    opp.velocity.y = 0;
                    opp.isGrounded = false;

                    try {
                      engine.particleManager.spawn("AURA", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ff0000", { size: 30, speed: 12 });
                      engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ef4444", { size: 25, speed: 10 });
                      engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 4, true);
                    } catch (err) {}
                  }
                }

                // Deativação limpa do projétil e finaliza o estado de ultimate
                if ((p as any).spawnedBeamProjectile) {
                  (p as any).spawnedBeamProjectile.active = false;
                  (p as any).spawnedBeamProjectile = undefined;
                }
                (p as any).beamSpawned = false;
                (p as any).beamHasHitOpponent = undefined;

                p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
                p.ataque = false;
                p.ultPhase = 0;
                p.ultTimer = 0;
                p.animFinished = false;
              }
            }
            break;
        }
      } else {
        switch (p.ultPhase) {
          case 1: // Fase 1: Personagem permanece parado executando a animação inicial da Ultimate.
            p.velocity.x = 0;
            p.velocity.y = 0;
            if (p.animFinished || p.ultTimer >= 45) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 2: // Fase 2: Teleporte para as costas do oponente, hitbox e lançamento diagonal para cima + espera.
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              // Teleport to the back of the opponent
              p.x = opp.x + (opp.facingRight ? -75 : 75);
              p.y = opp.y;
              p.facingRight = opp.facingRight; // Same direction opponent is facing

              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.x, p.y, 10, "#ffffff");
              }

              // Create hitbox of attack
              const hitboxWidth = 140;
              const hitboxHeight = 120;
              const hx = p.facingRight ? p.x : p.x - hitboxWidth;
              const hy = p.y - 40;
              const collides = (
                opp.x < hx + hitboxWidth &&
                opp.x + opp.width > hx &&
                opp.y < hy + hitboxHeight &&
                opp.y + opp.height > hy
              );
              if (collides) {
                opp.takeDamage(100);
                opp.state = PlayerState.STUNNED;
                opp.stunTimer = 100;
                if (engine.particleManager) {
                  engine.particleManager.spawnHitSpark(
                    opp.x + opp.width / 2,
                    opp.y + opp.height / 2,
                    false
                  );
                }
              }
            }

            if (p.animFinished || p.ultTimer >= 50) {
              if (!p["ultLaunched_F2"]) {
                p["ultLaunched_F2"] = true;
                opp.velocity.x = p.facingRight ? 18 : -18;
                opp.velocity.y = -22; // diagonal upwards
                opp.state = PlayerState.HIT;
                opp.stunTimer = 100;
                p.y = -2000; // vanish
                p["ultWait_F2"] = 15; // wait short interval
              }
            }

            if (p["ultLaunched_F2"]) {
              p["ultWait_F2"]--;
              if (p["ultWait_F2"] <= 0) {
                p.ultPhase = 3;
                p.ultTimer = 0;
                p.animFinished = false;
                p["ultLaunched_F2"] = false;
              }
            }
            break;

          case 3: // Fase 3: Teleporte para frente/acima, hitbox e lançamento diagonal para baixo + espera.
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              // Teleport in front and above the opponent
              p.x = opp.x + (opp.facingRight ? 75 : -75);
              p.y = Math.max(50, opp.y - 120);
              p.facingRight = !opp.facingRight; // Face each other

              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.x, p.y, 10, "#ffffff");
              }

              // Create hitbox below Goku
              const hitboxWidth = 140;
              const hitboxHeight = 140;
              const hx = p.x - hitboxWidth / 2;
              const hy = p.y;
              const collides = (
                opp.x < hx + hitboxWidth &&
                opp.x + opp.width > hx &&
                opp.y < hy + hitboxHeight &&
                opp.y + opp.height > hy
              );
              if (collides) {
                opp.takeDamage(100);
                opp.state = PlayerState.STUNNED;
                opp.stunTimer = 100;
                if (engine.particleManager) {
                  engine.particleManager.spawnHitSpark(
                    opp.x + opp.width / 2,
                    opp.y + opp.height / 2,
                    false
                  );
                }
              }
            }

            if (p.animFinished || p.ultTimer >= 50) {
              if (!p["ultLaunched_F3"]) {
                p["ultLaunched_F3"] = true;
                opp.velocity.x = p.facingRight ? 18 : -18;
                opp.velocity.y = 24; // diagonal downwards
                opp.state = PlayerState.HIT;
                opp.stunTimer = 100;
                p.y = -2000; // vanish
                p["ultWait_F3"] = 15; // wait short interval
              }
            }

            if (p["ultLaunched_F3"]) {
              p["ultWait_F3"]--;
              if (p["ultWait_F3"] <= 0) {
                p.ultPhase = 4;
                p.ultTimer = 0;
                p.animFinished = false;
                p["ultLaunched_F3"] = false;
              }
            }
            break;

          case 4: // Fase 4: Teleporte para a lateral, congelamento do oponente no ar.
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              // Teleport to the side of the opponent
              p.x = opp.x + (p.facingRight ? -75 : 75);
              p.y = opp.y;
              p.facingRight = (p.x < opp.x);

              if (engine.particleManager) {
                engine.particleManager.spawn("AURA", p.x, p.y, 10, "#ffffff");
              }
            }

            // Freeze the opponent in the air, remaining motionless
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            opp.gravityDisabledTimer = 100;

            if (p.animFinished || p.ultTimer >= 45) {
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 5: // Fase 5: Goku parado preparando, oponente congelado.
            p.velocity.x = 0;
            p.velocity.y = 0;

            // Opponent remains frozen in the air, motionless
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            opp.gravityDisabledTimer = 100;

            if (p.animFinished || p.ultTimer >= 45) {
              p.ultPhase = 6;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 6: { // Fase 6: Parado finalizando preparação, dispara o Beam (Ultimate_2_6) e se mantém em loop até destruição.
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");
              if (engine.camera) {
                engine.camera.addScreenShake(40, 20, "IMPULSE", 1);
              }

              // Cria o Beam CHAVE_BEAM_47
              const config: any = p.data.spriteConfig?.animations?.["Ultimate_2_6"] || {};
              const beamId = config.createsBeam || "CHAVE_BEAM_47";
              const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
              let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
              const charOverrides = p.data.beamOverrides?.[beamId];
              if (famMiddle && charOverrides && charOverrides.middle) {
                 famMiddle = { ...famMiddle, ...charOverrides.middle };
              }

              const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
              const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

              let spawnX = p.pos.x + p.width / 2;
              let spawnY = p.pos.y;

              const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
              const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

              if (p.facingRight) {
                spawnX = p.x + finalKiX;
              } else {
                spawnX = p.x + p.width - finalKiX - projWidth;
              }
              spawnY = p.y + finalKiY;

              const finalSpeed = config.projectileSpeed ?? famMiddle?.projectileSpeed ?? 22;
              const vx = p.facingRight ? finalSpeed : -finalSpeed;
              const vy = 0;

              const ownerId = p === engine.player1 ? "p1" : "p2";

              const proj = Projectile.spawn(
                spawnX,
                spawnY,
                vx,
                ownerId,
                p.data.color,
                true,
                beamId,
                projWidth,
                projHeight,
                config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
                config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
                config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
              );
              proj.vy = vy;
              proj.rotation = config.rotation ?? famMiddle?.rotation ?? 0;
              proj.sourceAnimConfig = config;

              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).spawnedBeamProjectile = proj;
              engine.projectiles.push(proj);
            }

            const hasActiveBeam = (p as any).spawnedBeamProjectile && (p as any).spawnedBeamProjectile.active;

            if (hasActiveBeam) {
              const proj = (p as any).spawnedBeamProjectile;
              const polyPrj = CollisionHelper.getProjectileVertices(proj, engine);
              const polyOpp = CollisionHelper.getAABBVertices(opp);
              const isColliding = CollisionHelper.testPolygonCollision(polyPrj, polyOpp);

              if (isColliding) {
                (p as any).beamHasHitOpponent = true;

                if (opp.invincibleTimer <= 0) {
                  opp.state = PlayerState.STUNNED;
                  opp.stunTimer = Math.max(opp.stunTimer, 15);
                  opp.velocity.x = p.facingRight ? 1 : -1;
                  opp.velocity.y = 0;
                  
                  if (p.ultTimer % 5 === 0) {
                    opp.takeDamage(4);
                    try {
                      engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
                    } catch (err) {}
                  }
                }
              }
            } else {
              // Beam acabou ou foi destruído! Aplica o dano final de 90 e o grande knockback!
              if (p.ultTimer > 5) {
                if ((p as any).beamHasHitOpponent) {
                  if (opp.invincibleTimer <= 0) {
                    const finalDamage = 90;
                    opp.takeDamage(finalDamage);
                    opp.state = PlayerState.HIT;
                    opp.stunTimer = 60;
                    opp.velocity.x = p.facingRight ? 45 : -45;
                    opp.velocity.y = -12;
                    opp.isGrounded = false;

                    try {
                      engine.particleManager.spawn("AURA", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ff0000", { size: 30, speed: 12 });
                      engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ef4444", { size: 25, speed: 10 });
                      engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 4, true);
                    } catch (err) {}
                  }
                }

                // Deativação limpa do projétil e finaliza o estado de ultimate
                if ((p as any).spawnedBeamProjectile) {
                  (p as any).spawnedBeamProjectile.active = false;
                  (p as any).spawnedBeamProjectile = undefined;
                }
                (p as any).beamSpawned = false;
                (p as any).beamHasHitOpponent = undefined;

                p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
                p.ataque = false;
                p.ultPhase = 0;
                p.ultTimer = 0;
                p.animFinished = false;
              }
            }
            break;
          }
        }
      }
    } else if (p.data.id === "teen_gohan_ssj2" && p.ultType === 1) {
      switch (p.ultPhase) {
        case 1: // Início
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Cutscene carregamento
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // Preparação lance
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // Lançamento
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer === 1) {
            if (engine.camera)
              engine.camera.addScreenShake(30, 15, "IMPULSE", 1);

            const config: any = p.data.spriteConfig?.animations?.["ULTIMATE_1_4"] || {};
            const beamId = config.createsBeam || "BEAM_2";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const velX = p.facingRight ? 15 : -15;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              true, // isBeam is true! It must be a real beam!
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.sourceAnimConfig = config;
            proj.vy = -15;
            engine.projectiles.push(proj);
          }
          if (p.animFinished && p.ultTimer > 60) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: // Recuperação final
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            const ownerId = p === engine.player1 ? "p1" : "p2";
            // Clean up any remaining beams for this player
            engine.projectiles.forEach((proj) => {
              if (
                proj.ownerId === ownerId &&
                proj.isBeam &&
                proj.active
              ) {
                proj.active = false;
              }
            });
          }

          if (p.animFinished && p.ultTimer > 5) {
            if (p["fullKiUlt2"]) {
              p["fullKiUlt2"] = false;
              p.ultType = 2;
              p.ultPhase = 1;
              p.ultTimer = 0;
              p.animFinished = false;
              // Deduct remaining 300 KI (so 7 bars consumed in total)
              p.ki = Math.max(0, p.ki - 300);
            } else {
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              p.animFinished = false;
            }
          }
          break;
      }
    } else if (p.data.id === "teen_gohan_ssj2" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: // Início
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Lançamento de feixe / Fire beam loop
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            if (engine.camera)
              engine.camera.addScreenShake(30, 15, "IMPULSE", 1);

            const config: any = p.data.spriteConfig?.animations?.["ULTIMATE_2_2"] || {};
            const beamId = config.createsBeam || "BEAM_2";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const velX = p.facingRight ? 15 : -15;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              true, // isBeam is true
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.sourceAnimConfig = config;
            proj.vy = -15;
            engine.projectiles.push(proj);
          }
          if (p.animFinished && p.ultTimer > 60) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // Finalização / Recuperação
          p.velocity.y = 0;
          p.velocity.x = 0;

          if (p.ultTimer === 1) {
            const ownerId = p === engine.player1 ? "p1" : "p2";
            // Explicitly terminate all beams for this player
            engine.projectiles.forEach((proj) => {
              if (
                proj.ownerId === ownerId &&
                proj.isBeam &&
                proj.active
              ) {
                proj.active = false;
              }
            });
          }

          if (p.animFinished && p.ultTimer > 5) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
      }
    } else if (p.data.id === "trunks_ssj2" && p.ultType === 1) {
      switch (p.ultPhase) {
        case 1: // Início
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2; // Custscene
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Custscene
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3; // Preparando
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // Preparando
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4; // Lança especial
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // Lança especial
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer === 1) {
            if (engine.camera)
              engine.camera.addScreenShake(30, 15, "IMPULSE", 1);

            const beamId = "KI_BLAST_GIGANTE_1";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }
            const projWidth = famMiddle?.projectileWidth ?? 120;
            const projHeight = famMiddle?.projectileHeight ?? 120;
            const spawnX = p.pos.x + (p.facingRight ? 60 : -60 - projWidth);
            const spawnY = p.pos.y - p.height * 0.5;

            const velX = p.facingRight ? 15 : -15;
            const velY = -15;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              false,
              beamId,
              projWidth,
              projHeight,
              famMiddle?.projectileOffsetX,
              famMiddle?.projectileOffsetY,
              famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.vy = velY;
            engine.projectiles.push(proj);
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
      }
    } else if (p.data.id === "trunks_ssj2" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: // Personagem parado
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // Vai atrás do oponente até colidir
          p.velocity.y = 0;
          const dirX = opp.pos.x - p.pos.x;
          if (Math.abs(dirX) > 60) {
            p.velocity.x = p.facingRight ? 25 : -25;
            if (
              p.x <= -225 ||
              p.x + p.width >= engine.worldWidth + 225 ||
              p.ultTimer > 60
            ) {
              p.velocity.x = 0;
              p.state = PlayerState.IDLE;
              p.ultPhase = 0;
              opp.state = PlayerState.IDLE;
              opp.stunTimer = 0;
            }
          } else {
            const isFacingOpp = (p.facingRight && !opp.facingRight) || (!p.facingRight && opp.facingRight);
            const isBlocking = isFacingOpp && (opp.state === PlayerState.BLOCKING || opp.state === PlayerState.BLOCKING_CROUCH || opp.state === PlayerState.BLOCKING_AIR || opp.state === PlayerState.WALK_BACKWARD);
            if (isBlocking) {
              p.velocity.x = 0; p.ultPhase = 0; p.state = PlayerState.IDLE; p.ataque = false; 
              opp.velocity.x = p.facingRight ? 10 : -10; 
              if (engine.particleManager) engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 5, "#60a5fa");
              break; 
            }
            p.velocity.x = 0;
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
            }
          break;
        case 3: // Lança oponente para o ar
          p.velocity.x = 0;
          p.velocity.y = 0;

          {
            let isNearEnd = false;
            if (p.lastAnimKey) {
              const currentAnim =
                p.data.spriteConfig?.animations[p.lastAnimKey];
              if (currentAnim && currentAnim.frames) {
                isNearEnd = p.animFrame >= currentAnim.frames - 2;
              }
            }

            if (isNearEnd && !p["ultHitApplied"]) {
              p["ultHitApplied"] = true;
              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(10 * 0.1);
                    opp.guard -= 10 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa",
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(10);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_3"] || {};
              const throwVx = 0;
              const throwVy =
                config.throwOppVelocityY !== undefined
                  ? config.throwOppVelocityY
                  : -34;

              opp.pos.y -= 15; // force off ground
              opp.isGrounded = false;
              opp.velocity.y = throwVy;
              opp.velocity.x = p.facingRight ? throwVx : -throwVx;
              opp.state = PlayerState.LAUNCHED;
              opp.animFinished = false;
              opp.stunTimer = 60;
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
            }
          }

          if (p.animFinished) {
            p["ultFreezeTimer"] = (p["ultFreezeTimer"] || 0) + 1;

            if (p.pos.y - opp.pos.y > 230) {
              opp.pos.y = p.pos.y - 230;
              if (opp.velocity.y < 0) opp.velocity.y = 0;
            }
            if (opp.pos.y < 50) {
              opp.pos.y = 50;
              opp.velocity.y = 0;
            }

            if (p["ultFreezeTimer"] >= 18) {
              // 0.3 segundos
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
              p["ultFreezeTimer"] = 0;
              p["ultHitApplied"] = false;
            }
          } else {
            // Let opponent wait or fly freely after hit
            if (!p["ultHitApplied"]) {
              opp.velocity.x = 0;
              opp.velocity.y = 0;
            } else {
              if (opp.pos.y < 50) {
                opp.pos.y = 50;
                opp.velocity.y = 0;
              }
            }
          }
          break;
        case 4: // Teleporta para encima do oponente e lança ele para baixo
          p.velocity.x = 0;
          p.velocity.y = 0;

          {
            if (p.ultTimer === 1) {
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_4"] || {};
              const pxOffset =
                config.playerTargetPosX !== undefined
                  ? config.playerTargetPosX
                  : 0;
              const pyOffset =
                config.playerTargetPosY !== undefined
                  ? config.playerTargetPosY
                  : -40;

              // Teleport above opponent
              p.pos.x = opp.pos.x + (opp.facingRight ? pxOffset : -pxOffset);
              p.pos.y = opp.pos.y + pyOffset;
              p.facingRight = p.pos.x < opp.pos.x;
            }

            let isNearEnd = false;
            if (p.lastAnimKey) {
              const currentAnim =
                p.data.spriteConfig?.animations[p.lastAnimKey];
              if (currentAnim && currentAnim.frames) {
                isNearEnd = p.animFrame >= currentAnim.frames - 2;
              }
            }

            if (isNearEnd && !p["ultHitApplied"]) {
              p["ultHitApplied"] = true;
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_4"] || {};
              const throwVx = 0;
              const throwVy =
                config.throwOppVelocityY !== undefined
                  ? config.throwOppVelocityY
                  : 34;

              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(15 * 0.1);
                    opp.guard -= 15 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa",
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(15);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              opp.velocity.y = throwVy;
              opp.velocity.x = p.facingRight ? throwVx : -throwVx;
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
            }
          }

          if (p.animFinished) {
            p["ultFreezeTimer"] = (p["ultFreezeTimer"] || 0) + 1;

            // Rebate no chão ou para perto do chão
            if (opp.pos.y >= WORLD_HEIGHT - engine.groundY - 80) {
              opp.pos.y = WORLD_HEIGHT - engine.groundY - 80;
              opp.velocity.y = 0;
              opp.velocity.x = 0;
            }

            if (p["ultFreezeTimer"] >= 18) {
              // 0.3 segundos
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
              p["ultFreezeTimer"] = 0;
              p["ultHitApplied"] = false;
            }
          } else {
            if (!p["ultHitApplied"]) {
              opp.velocity.x = 0;
              opp.velocity.y = 0;
            } else {
              if (opp.pos.y >= WORLD_HEIGHT - engine.groundY) {
                opp.pos.y = WORLD_HEIGHT - engine.groundY;
                opp.velocity.y = 0;
                opp.velocity.x = 0;
              }
            }
          }
          break;
        case 5: // Teleporta para baixo do Oponente e lança ele para o ar
          p.velocity.x = 0;
          p.velocity.y = 0;

          {
            if (p.ultTimer === 1) {
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_5"] || {};
              const pxOffset =
                config.playerTargetPosX !== undefined
                  ? config.playerTargetPosX
                  : 0;
              const pyOffset =
                config.playerTargetPosY !== undefined
                  ? config.playerTargetPosY
                  : 100;

              // Teleport below opponent
              p.pos.x = opp.pos.x + (opp.facingRight ? pxOffset : -pxOffset);
              p.pos.y = opp.pos.y + pyOffset;

              // Limit to ground
              if (p.pos.y > WORLD_HEIGHT - engine.groundY) {
                p.pos.y = WORLD_HEIGHT - engine.groundY;
              }

              p.facingRight = p.pos.x < opp.pos.x;
            }

            let isNearEnd = false;
            if (p.lastAnimKey) {
              const currentAnim =
                p.data.spriteConfig?.animations[p.lastAnimKey];
              if (currentAnim && currentAnim.frames) {
                isNearEnd = p.animFrame >= currentAnim.frames - 2;
              }
            }

            if (isNearEnd && !p["ultHitApplied"]) {
              p["ultHitApplied"] = true;
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_5"] || {};
              const throwVx = 0;
              const throwVy =
                config.throwOppVelocityY !== undefined
                  ? config.throwOppVelocityY
                  : -34;

              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(15 * 0.1);
                    opp.guard -= 15 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa",
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(15);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              opp.velocity.y = throwVy;
              opp.velocity.x = p.facingRight ? throwVx : -throwVx;
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
            }
          }

          if (p.animFinished) {
            p["ultFreezeTimer"] = (p["ultFreezeTimer"] || 0) + 1;

            if (opp.pos.y < 50) {
              opp.pos.y = 50;
              opp.velocity.y = 0;
            }

            if (p["ultFreezeTimer"] >= 18) {
              // 0.3 segundos
              p.ultPhase = 6;
              p.ultTimer = 0;
              p.animFinished = false;
              p["ultFreezeTimer"] = 0;
              p["ultHitApplied"] = false;
            }
          } else {
            if (!p["ultHitApplied"]) {
              opp.velocity.x = 0;
              opp.velocity.y = 0;
            } else {
              if (p.pos.y - opp.pos.y > 230) {
                opp.pos.y = p.pos.y - 230;
                if (opp.velocity.y < 0) opp.velocity.y = 0;
              }
              if (opp.pos.y < 50) {
                opp.pos.y = 50;
                opp.velocity.y = 0;
              }
            }
          }
          break;
        case 6: // Teleporta para cima do oponente e manda ele para baixo até tocar no chão
          p.velocity.x = 0;
          p.velocity.y = 0;

          {
            if (p.ultTimer === 1) {
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_6"] || {};
              const pxOffset =
                config.playerTargetPosX !== undefined
                  ? config.playerTargetPosX
                  : 0;
              const pyOffset =
                config.playerTargetPosY !== undefined
                  ? config.playerTargetPosY
                  : -40;

              p.pos.x = opp.pos.x + (opp.facingRight ? pxOffset : -pxOffset);
              p.pos.y = opp.pos.y + pyOffset;
              p.facingRight = p.pos.x < opp.pos.x;
            }

            let isNearEnd = false;
            if (p.lastAnimKey) {
              const currentAnim =
                p.data.spriteConfig?.animations[p.lastAnimKey];
              if (currentAnim && currentAnim.frames) {
                isNearEnd = p.animFrame >= currentAnim.frames - 2;
              }
            }

            if (isNearEnd && !p["ultHitApplied"]) {
              p["ultHitApplied"] = true;
              const config: any =
                p.data.spriteConfig?.animations?.["ULTIMATE_2_6"] || {};
              const throwVx = 0;
              const throwVy =
                config.throwOppVelocityY !== undefined
                  ? config.throwOppVelocityY
                  : 47;

              opp.velocity.y = throwVy;
              opp.velocity.x = p.facingRight ? throwVx : -throwVx;
              {
                const isFacing =
                  (p.facingRight && !opp.facingRight) ||
                  (!p.facingRight && opp.facingRight);
                const isBlocking =
                  isFacing &&
                  (opp.state === PlayerState.BLOCKING ||
                    opp.state === PlayerState.BLOCKING_CROUCH ||
                    opp.state === PlayerState.BLOCKING_AIR ||
                    opp.state === PlayerState.WALK_BACKWARD);
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(15 * 0.1);
                    opp.guard -= 15 * 0.5;
                    if (engine.particleManager)
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa",
                      );
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(15);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
              }
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
              engine.camera.addScreenShake(20, 10, "PERLIN", 1);
            }
          }

          if (p.animFinished) {
            p["ultFreezeTimer"] = (p["ultFreezeTimer"] || 0) + 1;

            if (opp.pos.y >= WORLD_HEIGHT - engine.groundY) {
              opp.pos.y = WORLD_HEIGHT - engine.groundY;
              opp.velocity.y = 0;
              opp.velocity.x = 0;
            }

            if (p["ultFreezeTimer"] >= 18) {
              // 0.3 segundos
              p.ultPhase = 7;
              p.ultTimer = 0;
              p.animFinished = false;
              p["ultFreezeTimer"] = 0;
              p["ultHitApplied"] = false;
            }
          } else {
            if (!p["ultHitApplied"]) {
              opp.velocity.x = 0;
              opp.velocity.y = 0;
            } else {
              if (opp.pos.y >= WORLD_HEIGHT - engine.groundY) {
                opp.pos.y = WORLD_HEIGHT - engine.groundY;
                opp.velocity.y = 0;
                opp.velocity.x = 0;
              }
            }
          }
          break;
        case 7: // Personagem parado
        case 8: // Continua
        case 9: // Continua
        case 10: // Continua
        case 11: // Continua
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer === 1 && p.ultPhase === 7) {
            p.pos.x = opp.pos.x + (p.facingRight ? -150 : 150);
          }

          if (
            opp.pos.y >= WORLD_HEIGHT - engine.groundY &&
            opp.velocity.y > 0
          ) {
            opp.velocity.y = 0;
            opp.pos.y = WORLD_HEIGHT - engine.groundY;
            engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
            engine.particleManager.spawn("IMPACT", opp.x, opp.y, 10, "#ffffff");
          }

          if (p.animFinished && p.ultTimer > 1) {
            p.ultPhase++;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 12: // Lança especial
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            const config: any =
              p.data.spriteConfig?.animations?.["ULTIMATE_2_12"] || {};
            const beamId = config.createsBeam || "KI_BLAST_GIGANTE_1";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }
            const projWidth =
              config.projectileWidth ?? famMiddle?.projectileWidth ?? 1;
            const projHeight =
              config.projectileHeight ?? famMiddle?.projectileHeight ?? 1;
            const spawnX = p.pos.x + (p.facingRight ? 100 : -100 - projWidth);
            const spawnY = p.pos.y - p.height * 0.2;
            const velX = p.facingRight ? 15 : -15;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              false, // <---- change to false
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
              undefined, // customSpeed
              "TARGET_POS", // behavior
            );
            proj.disabledCollision = true;
            engine.projectiles.push(proj);
          }

          if (p.ultTimer === 15) {
            {
              const isFacing =
                (p.facingRight && !opp.facingRight) ||
                (!p.facingRight && opp.facingRight);
              const isBlocking =
                isFacing &&
                (opp.state === PlayerState.BLOCKING ||
                  opp.state === PlayerState.BLOCKING_CROUCH ||
                  opp.state === PlayerState.BLOCKING_AIR ||
                  opp.state === PlayerState.WALK_BACKWARD);
              const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
              if (opp.invincibleTimer <= 0 && inY) {
                if (isBlocking) {
                  opp.takeDamage(80 * 0.1);
                  opp.guard -= 80 * 0.5;
                  if (engine.particleManager)
                    engine.particleManager.spawn(
                      "BLOCK",
                      opp.pos.x,
                      opp.pos.y - 50,
                      2,
                      "#60a5fa",
                    );
                  opp.velocity.x = p.facingRight ? 5 : -5;
                  if (opp.guard <= 0) {
                    opp.state = PlayerState.GUARD_BREAK;
                    opp.stunTimer = 60;
                  }
                } else {
                  opp.takeDamage(80);
                  opp.stunTimer = Math.max(opp.stunTimer, 20);
                }
              }
            }
            engine.camera.addScreenShake(30, 20, "PERLIN", 0.8);
            engine.particleManager.spawn(
              "ENERGY",
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              40,
              "#ffff00",
              { size: 25, speed: 15 },
            );
          }

          if (p.ultTimer > 1 && p.ultTimer < 30) {
            opp.velocity.x = p.facingRight ? 5 : -5;
            opp.velocity.y = 0;
            opp.gravityDisabledTimer = 5;

            if (Math.abs(opp.pos.x - p.pos.x) >= 200) {
              opp.velocity.x = 0;
            }

            if (p.ultTimer % 5 === 0) {
              engine.particleManager.spawn(
                "AURA",
                opp.x - 20,
                opp.y,
                5,
                "#ffff00",
              );
            }
          }

          if (p.ultTimer >= 180) {
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            opp.stunTimer = 60;
            opp.state = PlayerState.HIT;
            p.animFinished = false;
            opp.gravityDisabledTimer = 0;

            // Explicitly terminate all beams for this player
            engine.projectiles.forEach((proj) => {
              if (
                proj.isBeam &&
                proj.ownerId === (p === engine.player1 ? "p1" : "p2")
              ) {
                proj.active = false;
              }
            });
          }
          break;
      }
    } else if (p.data.id === "gogeta_blue" && p.ultType === 1) {
      switch (p.ultPhase) {
        case 1:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            if (engine.camera) engine.camera.addScreenShake(40, 20, "PERLIN", 1.5);
            
            // Spawn custom projectile using Ultimate_1_5 configuration
            const config: any = p.data.spriteConfig?.animations?.["Ultimate_1_5"] || {};
            const beamId = config.createsBeam || "BEAM_3";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const velX = p.facingRight ? 18 : -18;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              !beamId.includes("KI_BLAST") && !beamId.includes("PROJECTILE"),
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale ?? 2.5,
              undefined,
              "STRAIGHT"
            );
            engine.projectiles.push(proj);
          }

          // Damage ticks
          if (p.ultTimer % 6 === 0) {
            const isFacing = (p.facingRight && !opp.facingRight) || (!p.facingRight && opp.facingRight);
            const isBlocking = isFacing && (
              opp.state === PlayerState.BLOCKING ||
              opp.state === PlayerState.BLOCKING_CROUCH ||
              opp.state === PlayerState.BLOCKING_AIR ||
              opp.state === PlayerState.WALK_BACKWARD
            );
            const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
            if (opp.invincibleTimer <= 0 && inY) {
              if (isBlocking) {
                opp.takeDamage(25 * 0.1);
                opp.guard -= 25 * 0.5;
                if (engine.particleManager)
                  engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, "#60a5fa");
                opp.velocity.x = p.facingRight ? 5 : -5;
                if (opp.guard <= 0) {
                  opp.state = PlayerState.GUARD_BREAK;
                  opp.stunTimer = 60;
                }
              } else {
                opp.takeDamage(25);
                opp.stunTimer = Math.max(opp.stunTimer, 20);
              }
            }
            engine.camera.addScreenShake(15, 5, "IMPULSE", 1);
            if (engine.particleManager) {
              engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, false);
            }
          }

          if (p.animFinished && p.ultTimer > 60) {
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 6:
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.state = PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            opp.stunTimer = 60;
            opp.state = PlayerState.HIT;
            p.animFinished = false;

            engine.projectiles.forEach((proj) => {
              if (
                proj.isBeam &&
                proj.ownerId === (p === engine.player1 ? "p1" : "p2")
              ) {
                proj.active = false;
              }
            });
          }
          break;
      }
    } else if (p.data.id === "gogeta_blue" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: // Fase 1: O personagem permanece parado executando a animação inicial da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 2: // Fase 2: O personagem avança em linha reta durante 1 segundo. Caso colida com o oponente dentro desse período, a sequência continua. Caso contrário, a Ultimate é cancelada imediatamente.
          p.velocity.y = 0;
          {
            const dir = p.facingRight ? 1 : -1;
            p.velocity.x = dir * 25; // dash speed

            const hit = Math.abs(p.x - opp.x) < 80 && Math.abs(p.y - opp.y) < 80;
            if (hit) {
              p.velocity.x = 0;
              p.x = dir > 0 ? opp.x - 60 : opp.x + 60;
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            } else if (p.ultTimer >= 60) { // 1 second = 60 frames
              // Cancel immediately
              p.velocity.x = 0;
              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              opp.state = PlayerState.IDLE;
              opp.stunTimer = 0;
            }
          }
          break;

        case 3: // Fase 3: Cria uma hitbox de dano. Caso o oponente colida com a hitbox, recebe dano e, ao término da animação, é lançado horizontalmente para longe.
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            const hit = Math.abs(p.x - opp.x) < 120 && Math.abs(p.y - opp.y) < 120;
            if (hit && opp.invincibleTimer <= 0) {
              opp.takeDamage(60);
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
              if (engine.particleManager) {
                engine.particleManager.spawnHitSpark(
                  opp.x + opp.width / 2,
                  opp.y + opp.height / 2,
                  false,
                );
              }
            }
          }

          if (p.animFinished && p.ultTimer > 5) {
            // Launch horizontally far away
            opp.velocity.x = p.facingRight ? 45 : -45;
            opp.velocity.y = 0;
            opp.state = PlayerState.HIT;
            opp.stunTimer = 60;

            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 4: // Fase 4: Após o lançamento da Fase 3, o personagem avança continuamente em direção ao oponente até ocorrer a colisão com o alvo.
          p.velocity.y = 0;
          if (p.ultTimer <= 12) {
            p.velocity.x = 0;
            opp.state = PlayerState.HIT;
            opp.stunTimer = Math.max(opp.stunTimer, 20);
          } else {
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            const dir = opp.x > p.x ? 1 : -1;
            p.facingRight = opp.x > p.x;
            p.velocity.x = dir * 35; // fast chase

            const hit = Math.abs(p.x - opp.x) < 100 && Math.abs(p.y - opp.y) < 100;
            if (hit) {
              p.velocity.x = 0;
              p.x = dir > 0 ? opp.x - 60 : opp.x + 60;
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
            }
          }
          break;

        case 5: // Fase 5: Cria uma hitbox de dano. Caso o oponente colida com a hitbox, recebe dano.
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            const hit = Math.abs(p.x - opp.x) < 120 && Math.abs(p.y - opp.y) < 120;
            if (hit && opp.invincibleTimer <= 0) {
              opp.takeDamage(60);
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
              if (engine.particleManager) {
                engine.particleManager.spawnHitSpark(
                  opp.x + opp.width / 2,
                  opp.y + opp.height / 2,
                  false,
                );
              }
            }
          }

          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 6: // Fase 6: Cria uma hitbox de dano. Caso o oponente colida com a hitbox, recebe dano e é movido para uma posição acima do personagem, preparando a continuação da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            const hit = Math.abs(p.x - opp.x) < 120 && Math.abs(p.y - opp.y) < 120;
            if (hit && opp.invincibleTimer <= 0) {
              opp.takeDamage(60);
              opp.state = PlayerState.HIT;
              opp.stunTimer = 60;
              engine.camera.addScreenShake(15, 10, "IMPULSE", 1);
              if (engine.particleManager) {
                engine.particleManager.spawnHitSpark(
                  opp.x + opp.width / 2,
                  opp.y + opp.height / 2,
                  false,
                );
              }
            }
          }

          // Move opponent to a position above and in front of the character, keeping a distance
          opp.y = p.y - 180;
          opp.x = p.facingRight ? p.x + 100 : p.x - 100;
          opp.velocity.y = 0;
          opp.velocity.x = 0;

          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 7: // Fase 7: O personagem permanece parado executando a animação de transição.
          p.velocity.y = 0;
          p.velocity.x = 0;
          opp.y = p.y - 180;
          opp.x = p.facingRight ? p.x + 100 : p.x - 100;
          opp.velocity.y = 0;
          opp.velocity.x = 0;

          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 8: // Fase 8: O personagem permanece parado dando continuidade à animação.
          p.velocity.y = 0;
          p.velocity.x = 0;
          opp.y = p.y - 180;
          opp.x = p.facingRight ? p.x + 100 : p.x - 100;
          opp.velocity.y = 0;
          opp.velocity.x = 0;
          p["purificadorActive"] = true; // Visual aura effect

          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 9;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 9: // Fase 9: O personagem permanece parado finalizando a preparação para a próxima parte da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;
          opp.y = p.y - 180;
          opp.x = p.facingRight ? p.x + 100 : p.x - 100;
          opp.velocity.y = 0;
          opp.velocity.x = 0;

          if (p.animFinished && p.ultTimer > 5) {
            p["purificadorActive"] = false;
            p.ki = 0; // Consume ki
            p.ultPhase = 10;
            p.ultTimer = 0;
            p.animFinished = false;
            // Do not freeze or force opponent's position starting from Phase 10
          }
          break;

        case 10: // Fase 10: O personagem permanece parado executando a animação de continuação da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if ((p.animFinished || p.ultTimer > 100) && p.ultTimer > 5) {
            p.ultPhase = 11;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 11: // Fase 11: O personagem permanece parado dando continuidade à animação.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if ((p.animFinished || p.ultTimer > 200) && p.ultTimer > 5) {
            p.ultPhase = 12;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 12: // Fase 12: O personagem permanece parado mantendo a sequência da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if ((p.animFinished || p.ultTimer > 100) && p.ultTimer > 5) {
            p.ultPhase = 13;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 13: // Fase 13: O personagem permanece parado executando a próxima etapa da animação.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if ((p.animFinished || p.ultTimer > 200) && p.ultTimer > 5) {
            p.ultPhase = 14;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 14: // Fase 14: O personagem permanece parado preparando o golpe final.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if (p.ultTimer === 1) {
            if (engine.particleManager) {
              engine.particleManager.spawn(
                "ENERGY",
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                50,
                "#00ffff",
                { size: 30, speed: 20 },
              );
            }

            // Create beam
            const config: any =
              p.data.spriteConfig?.animations?.["Ultimate_2_14"] || {};
            const beamId = config.createsBeam || "BEAM_3";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
              famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth =
              config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight =
              config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.x + p.width / 2;
            let spawnY = p.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const velX = p.facingRight ? 15 : -15;
            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              velX,
              ownerId,
              p.data.color,
              !beamId.includes("KI_BLAST") && !beamId.includes("PROJECTILE"), // isBeam check
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale ?? 2.2,
              undefined,
              "STRAIGHT",
            );
            (p as any).beamSpawned = true;
            (p as any).spawnedBeamProjectile = proj;
            engine.projectiles.push(proj);
          }

          if (p.ultTimer % 6 === 0) {
            if (opp.invincibleTimer <= 0) {
              opp.takeDamage(20);
              opp.stunTimer = Math.max(opp.stunTimer, 20);
              opp.state = PlayerState.HIT;
            }
            engine.camera.addScreenShake(25, 5, "IMPULSE", 1);
            if (engine.particleManager) {
              engine.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
            }
          }

          if (p.ultTimer > 90) {
            p.ultPhase = 15;
            p.ultTimer = 0;
            p.animFinished = false;

            (p as any).beamSpawned = false;
            (p as any).spawnedBeamProjectile = undefined;

            // Explicitly terminate all beams for this player
            engine.projectiles.forEach((proj) => {
              if (
                proj.isBeam &&
                proj.ownerId === (p === engine.player1 ? "p1" : "p2")
              ) {
                proj.active = false;
              }
            });
          }
          break;

        case 15: // Fase 15: O personagem permanece parado finalizando a animação e preparando a continuação da Ultimate.
          p.velocity.y = 0;
          p.velocity.x = 0;

          if (p.ultTimer === 1) {
            if (opp.invincibleTimer <= 0) {
              opp.takeDamage(150); // Massive final damage
              opp.state = PlayerState.HIT;
              opp.stunTimer = 100;
            }
            engine.camera.addScreenShake(40, 20, "PERLIN", 1.5);
            opp.velocity.x = p.facingRight ? 30 : -30;
            opp.velocity.y = -30; // Launch out of bounds
            if (engine.particleManager) {
              engine.particleManager.spawn(
                "ENERGY",
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                60,
                "#ffffff",
                { size: 40, speed: 30 },
              );
            }
          }

          if ((p.animFinished || p.ultTimer > 100) && p.ultTimer > 5) {
            p.state = PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            opp.stunTimer = 100;
            opp.state = PlayerState.HIT;
            p.animFinished = false;
          }
          break;
      }
    } else if (p.data.id === "goku_blue_gif") {
      switch (p.ultPhase) {
        case 1: // PREP / CHARGE
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
            if (engine.camera) engine.camera.addScreenShake(60, 8, "PERLIN", 1);
          }
          break;
        case 2: // TRANSITION / LAUNCH
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // BEAM LOOP / ATTACK COMBO
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer % 5 === 0) {
            const isFacing =
              (p.facingRight && !opp.facingRight) ||
              (!p.facingRight && opp.facingRight);
            const isBlocking =
              isFacing &&
              (opp.state === PlayerState.BLOCKING ||
                opp.state === PlayerState.BLOCKING_CROUCH ||
                opp.state === PlayerState.BLOCKING_AIR ||
                opp.state === PlayerState.WALK_BACKWARD);
            const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
            if (opp.invincibleTimer <= 0 && inY) {
              if (isBlocking) {
                opp.takeDamage(10 * 0.1);
                opp.guard -= 10 * 0.5;
                if (engine.particleManager)
                  engine.particleManager.spawn(
                    "BLOCK",
                    opp.pos.x,
                    opp.pos.y - 50,
                    2,
                    "#60a5fa",
                  );
                opp.velocity.x = p.facingRight ? 5 : -5;
                if (opp.guard <= 0) {
                  opp.state = PlayerState.GUARD_BREAK;
                  opp.stunTimer = 60;
                }
              } else {
                opp.takeDamage(10);
                opp.stunTimer = Math.max(opp.stunTimer, 20);
              }
            }
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              false,
            );
            engine.particleManager.spawn(
              "AURA",
              opp.x - 20,
              opp.y,
              5,
              p.data.color || "#00d2ff",
            );
          }
          if (p.ultTimer >= 60) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 4: // FINAL EXPLOSION / DISCHARGE
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultTimer === 1) {
            if (engine.camera)
              engine.camera.addScreenShake(30, 12, "IMPULSE", 1);
            const isFacing =
              (p.facingRight && !opp.facingRight) ||
              (!p.facingRight && opp.facingRight);
            const isBlocking =
              isFacing &&
              (opp.state === PlayerState.BLOCKING ||
                opp.state === PlayerState.BLOCKING_CROUCH ||
                opp.state === PlayerState.BLOCKING_AIR ||
                opp.state === PlayerState.WALK_BACKWARD);
            const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
            if (opp.invincibleTimer <= 0 && inY) {
              if (isBlocking) {
                opp.takeDamage(100 * 0.1);
                opp.guard -= 100 * 0.5;
                if (engine.particleManager)
                  engine.particleManager.spawn(
                    "BLOCK",
                    opp.pos.x,
                    opp.pos.y - 50,
                    2,
                    "#60a5fa",
                  );
                opp.velocity.x = p.facingRight ? 5 : -5;
                if (opp.guard <= 0) {
                  opp.state = PlayerState.GUARD_BREAK;
                  opp.stunTimer = 60;
                }
              } else {
                opp.takeDamage(100);
                opp.stunTimer = Math.max(opp.stunTimer, 20);
              }
            }
            engine.particleManager.spawn(
              "ENERGY",
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              30,
              p.data.color || "#00d2ff",
              { size: 15, speed: 10 },
            );
            opp.velocity.x = p.facingRight ? 40 : -40;
            opp.velocity.y = -10;
            opp.state = PlayerState.HIT;
            opp.stunTimer = 60;
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: // RECOVERY / BEAM FIRE
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p.ultType === 1) {
            if (p.ultTimer === 1) {
              if (engine.camera) engine.camera.addScreenShake(40, 20, "PERLIN", 1.5);
              
              // Spawn custom projectile using Ultimate_1_5 configuration
              const config: any = p.data.spriteConfig?.animations?.["Ultimate_1_5"] || {};
              const beamId = config.createsBeam || "CHAVE_BEAM_004";
              const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
              let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
              const charOverrides = p.data.beamOverrides?.[beamId];
              if (famMiddle && charOverrides && charOverrides.middle) {
                famMiddle = { ...famMiddle, ...charOverrides.middle };
              }

              const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
              const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

              let spawnX = p.pos.x + p.width / 2;
              let spawnY = p.pos.y;

              const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
              const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

              if (p.facingRight) {
                spawnX = p.x + finalKiX;
              } else {
                spawnX = p.x + p.width - finalKiX - projWidth;
              }
              spawnY = p.y + finalKiY;

              const velX = p.facingRight ? 18 : -18;
              const ownerId = p === engine.player1 ? "p1" : "p2";

              const proj = Projectile.spawn(
                spawnX,
                spawnY,
                velX,
                ownerId,
                p.data.color,
                !beamId.includes("KI_BLAST") && !beamId.includes("PROJECTILE"),
                beamId,
                projWidth,
                projHeight,
                config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
                config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
                config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale ?? 2.5,
                undefined,
                "STRAIGHT"
              );
              
              (p as any).beamSpawned = true;
              (p as any).beamHasBeenSpawned = true;
              (p as any).spawnedBeamProjectile = proj;
              
              engine.projectiles.push(proj);
            }

            const hasActiveBeam = (p as any).spawnedBeamProjectile && (p as any).spawnedBeamProjectile.active;

            if (hasActiveBeam && p.ultTimer <= 180) {
              // Damage ticks during Phase 5 firing duration
              if (p.ultTimer % 6 === 0) {
                const isFacing = (p.facingRight && !opp.facingRight) || (!p.facingRight && opp.facingRight);
                const isBlocking = isFacing && (
                  opp.state === PlayerState.BLOCKING ||
                  opp.state === PlayerState.BLOCKING_CROUCH ||
                  opp.state === PlayerState.BLOCKING_AIR ||
                  opp.state === PlayerState.WALK_BACKWARD
                );
                const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
                if (opp.invincibleTimer <= 0 && inY) {
                  if (isBlocking) {
                    opp.takeDamage(10 * 0.1);
                    opp.guard -= 10 * 0.5;
                    if (engine.particleManager) {
                      engine.particleManager.spawn(
                        "BLOCK",
                        opp.pos.x,
                        opp.pos.y - 50,
                        2,
                        "#60a5fa"
                      );
                    }
                    opp.velocity.x = p.facingRight ? 5 : -5;
                    if (opp.guard <= 0) {
                      opp.state = PlayerState.GUARD_BREAK;
                      opp.stunTimer = 60;
                    }
                  } else {
                    opp.takeDamage(10);
                    opp.stunTimer = Math.max(opp.stunTimer, 20);
                  }
                }
                engine.particleManager.spawnHitSpark(
                  opp.x + opp.width / 2,
                  opp.y + opp.height / 2,
                  false
                );
                engine.particleManager.spawn(
                  "AURA",
                  opp.x - 20,
                  opp.y,
                  5,
                  p.data.color || "#00d2ff"
                );
              }
            } else {
              // Beam ended or was destroyed! Terminate ultimate cleanly
              if ((p as any).spawnedBeamProjectile) {
                (p as any).spawnedBeamProjectile.active = false;
                (p as any).spawnedBeamProjectile = undefined;
              }
              (p as any).beamSpawned = false;
              (p as any).beamHasBeenSpawned = false;

              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
            }
          } else {
            // Original recovery logic for ultType 2 (cinematic)
            if (p.animFinished && p.ultTimer > 5) {
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
            }
          }
          break;
      }
    } else if (p.data.id === "gogeta_ssj4") {
      switch (p.ultPhase) {
        case 1: { // Fase 1: Caso o personagem esteja no chão, aplicar um pequeno impulso vertical apenas para retirá-lo do solo. Após esse impulso, desativar a gravidade e manter o personagem suspenso no ar.
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            const wasOnGround = p.isGrounded || (p.pos.y >= WORLD_HEIGHT - engine.groundY - 20);
            p["gogetaStartGrounded"] = wasOnGround;
            if (wasOnGround) {
              p.velocity.y = -5; // Impulso vertical para retirá-lo do solo
              p.isGrounded = false;
              p["gogetaSuspendedY"] = undefined;
            } else {
              p.velocity.y = 0;
              p["gogetaSuspendedY"] = p.pos.y;
            }

            try {
              engine.particleManager.spawn("AURA", p.x + p.width/2, p.y + p.height/2, 20, "#ef4444", { size: 10, speed: 5 });
            } catch (err) {}
          }

          if (p["gogetaStartGrounded"]) {
            if (p.ultTimer <= 6) {
              p.isGrounded = false;
            } else {
              p.velocity.y = 0;
              if (p["gogetaSuspendedY"] === undefined) {
                p["gogetaSuspendedY"] = p.pos.y;
              }
              p.pos.y = p["gogetaSuspendedY"];
            }
          } else {
            p.velocity.y = 0;
            if (p["gogetaSuspendedY"] !== undefined) {
              p.pos.y = p["gogetaSuspendedY"];
            }
          }

          const isLifted = !p["gogetaStartGrounded"] || p.ultTimer > 6;
          if (isLifted) {
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
          }
          break;
        }
        case 2: { // Fase 2: O personagem permanece parado no ar executando a animação correspondente.
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p["gogetaSuspendedY"] !== undefined) {
            p.pos.y = p["gogetaSuspendedY"];
          }
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(8, 4, "PERLIN", 0.5);
            try {
              engine.particleManager.spawn("ENERGY", p.x + p.width/2, p.y + p.height/2, 5, "#ef4444", { size: 15, speed: 8 });
            } catch (err) {}
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 3: { // Fase 3: O personagem permanece parado no ar executando a animação correspondente.
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p["gogetaSuspendedY"] !== undefined) {
            p.pos.y = p["gogetaSuspendedY"];
          }
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(12, 6, "PERLIN", 0.8);
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 4: { // Fase 4: O personagem permanece parado no ar executando a animação correspondente.
          p.velocity.x = 0;
          p.velocity.y = 0;
          if (p["gogetaSuspendedY"] !== undefined) {
            p.pos.y = p["gogetaSuspendedY"];
          }
          if (p.ultTimer === 1) {
            if (engine.camera) {
              engine.camera.addScreenShake(35, 90, "PERLIN", 1);
            }
          }
          // Aplica dano contínuo ao oponente
          if (p.ultTimer % 4 === 0) {
            const isFacing = (p.facingRight && opp.pos.x > p.pos.x) || (!p.facingRight && opp.pos.x < p.pos.x);
            const inY = Math.abs(opp.pos.y - p.pos.y) < 350;
            if (opp.invincibleTimer <= 0 && isFacing && inY) {
              opp.state = PlayerState.HIT;
              opp.stunTimer = Math.max(opp.stunTimer, 25);
              opp.velocity.x = p.facingRight ? 1 : -1;
              opp.velocity.y = 0;

              const dano = 12;
              opp.takeDamage(dano);

              try {
                engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, true);
                engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 2, 8, "#ff3333", { size: 20, speed: 10 });
              } catch (err) {}
            }
          }

          if ((p.animFinished || p.ultTimer >= 60) && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 5: { // Fase 5: O personagem permanece parado no ar executando a animação correspondente (dispara o Beam e se mantém em loop até destruição).
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");
            if (engine.camera) {
              engine.camera.addScreenShake(40, 20, "IMPULSE", 1);
            }

            // Cria o Beam CHAVE_BEAM_43
            const config: any = p.data.spriteConfig?.animations?.["Ultimate_2_5"] || {};
            const beamId = config.createsBeam || "CHAVE_BEAM_43";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
               famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const finalSpeed = config.projectileSpeed ?? famMiddle?.projectileSpeed ?? 22;
            const vx = p.facingRight ? finalSpeed : -finalSpeed;
            const vy = 0;

            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              p.data.color,
              true,
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.vy = vy;
            proj.rotation = config.rotation ?? famMiddle?.rotation ?? 0;
            proj.sourceAnimConfig = config;

            (p as any).beamSpawned = true;
            (p as any).beamHasBeenSpawned = true;
            (p as any).spawnedBeamProjectile = proj;
            engine.projectiles.push(proj);
          }

          const hasActiveBeam = (p as any).spawnedBeamProjectile && (p as any).spawnedBeamProjectile.active;

          if (hasActiveBeam) {
            const proj = (p as any).spawnedBeamProjectile;
            const polyPrj = CollisionHelper.getProjectileVertices(proj, engine);
            const polyOpp = CollisionHelper.getAABBVertices(opp);
            const isColliding = CollisionHelper.testPolygonCollision(polyPrj, polyOpp);

            if (isColliding) {
              (p as any).beamHasHitOpponent = true;

              if (opp.invincibleTimer <= 0) {
                opp.state = PlayerState.HIT;
                opp.stunTimer = Math.max(opp.stunTimer, 15);
                opp.velocity.x = p.facingRight ? 1 : -1;
                opp.velocity.y = 0;
                
                if (p.ultTimer % 5 === 0) {
                  opp.takeDamage(4);
                  try {
                    engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
                  } catch (err) {}
                }
              }
            }
          } else {
            // Beam acabou ou foi destruído! Aplica o dano final de 90 e o grande knockback!
            if (p.ultTimer > 5) {
              if ((p as any).beamHasHitOpponent) {
                if (opp.invincibleTimer <= 0) {
                  const finalDamage = 90;
                  opp.takeDamage(finalDamage);
                  opp.state = PlayerState.HIT;
                  opp.stunTimer = 60;
                  opp.velocity.x = p.facingRight ? 45 : -45;
                  opp.velocity.y = -12;
                  opp.isGrounded = false;

                  try {
                    engine.particleManager.spawn("AURA", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ff0000", { size: 30, speed: 12 });
                    engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 4, 30, "#ef4444", { size: 25, speed: 10 });
                    engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 4, true);
                  } catch (err) {}
                }
              }

              // Deativação limpa do projétil e finaliza o estado de ultimate
              if ((p as any).spawnedBeamProjectile) {
                (p as any).spawnedBeamProjectile.active = false;
                (p as any).spawnedBeamProjectile = undefined;
              }
              (p as any).beamSpawned = false;
              (p as any).beamHasHitOpponent = undefined;
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              p.animFinished = false;
            }
          }
          break;
        }
      }
    } else if (p.data.id === "kuririn" && p.ultType === 3) {
      switch (p.ultPhase) {
        case 1: // Fase 1 (Parado, sem hits/movimento)
        case 2: // Fase 2 (Parado, sem hits/movimento)
        case 3: // Fase 3 (Parado, sem hits/movimento)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase += 1;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;

        case 4: { // Fase 4 (Investida retilínea até colidir)
          p.velocity.y = 0;
          if (p.ultTimer === 1) {
            p.pos.y = opp.pos.y; // Alinhamento vertical perfeito para evitar misses
            p.facingRight = (opp.pos.x - p.pos.x) >= 0;
            (p as any).kuririn_ph4_facing = p.facingRight;
          }
          const isFacingRight = (p as any).kuririn_ph4_facing !== undefined ? (p as any).kuririn_ph4_facing : (opp.pos.x - p.pos.x >= 0);
          p.facingRight = isFacingRight;

          const dashSpeed = 32;
          p.velocity.x = isFacingRight ? dashSpeed : -dashSpeed;

          const dirX = opp.pos.x - p.pos.x;
          if (Math.abs(dirX) <= 60) {
            // Colisão com alvo detectada! Prossegue imediatamente para a Fase 5
            p.velocity.x = 0;
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
            delete (p as any).kuririn_ph4_facing;
          } else if (p.ultTimer > 60) { // Timeout de 1 segundo (60 ticks)
            p.velocity.x = 0;
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
            opp.state = opp.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            opp.stunTimer = 0;
            delete (p as any).kuririn_ph4_facing;
          }
          break;
        }

        case 5: { // Fase 5 – Golpe Frontal
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            // Hitbox check
            const hitboxWidth = 120;
            const hitboxHeight = 100;
            const hx = p.facingRight ? p.pos.x + p.width : p.pos.x - hitboxWidth;
            const hy = p.pos.y;
            
            const collides = (
              opp.pos.x < hx + hitboxWidth &&
              opp.pos.x + opp.width > hx &&
              opp.pos.y < hy + hitboxHeight &&
              opp.pos.y + opp.height > hy
            );
            
            if (collides || Math.abs(opp.pos.x - p.pos.x) < 140) {
              opp.takeDamage(100);
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(8, 3, "PERLIN", 0.3);
              try {
                engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, true);
              } catch (err) {}
            }
            
            (p as any).kuririn_ph5_launched = false;
            (p as any).kuririn_ph5_launch_timer = 0;
          }

          if (!(p as any).kuririn_ph5_launched) {
            opp.pos.x = p.pos.x + (p.facingRight ? 55 : -55);
            opp.pos.y = p.pos.y;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;

            if (p.animFinished && p.ultTimer > 5) {
              (p as any).kuririn_ph5_launched = true;
              opp.velocity.x = p.facingRight ? 26 : -26;
              opp.velocity.y = 0;
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.4);
              try {
                engine.particleManager.spawn("ENERGY", opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, 8, p.data.color || "#eab308");
              } catch (err) {}
            }
          } else {
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            (p as any).kuririn_ph5_launch_timer++;
            if ((p as any).kuririn_ph5_launch_timer >= 15) {
              p.ultPhase = 6;
              p.ultTimer = 0;
              p.animFinished = false;
              delete (p as any).kuririn_ph5_launched;
              delete (p as any).kuririn_ph5_launch_timer;
            }
          }
          break;
        }

        case 6: { // Fase 6 – Teleporte pelas Costas
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            // Teleport to the back of the opponent
            p.pos.x = opp.pos.x + (opp.facingRight ? -70 : 70);
            p.pos.y = opp.pos.y;
            p.facingRight = opp.facingRight;

            AudioManager.getInstance().playSFX("teleport");
            try {
              engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#ffffff");
            } catch (err) {}

            // Hitbox check
            const hitboxWidth = 120;
            const hitboxHeight = 100;
            const hx = p.facingRight ? p.pos.x + p.width : p.pos.x - hitboxWidth;
            const hy = p.pos.y;
            
            const collides = (
              opp.pos.x < hx + hitboxWidth &&
              opp.pos.x + opp.width > hx &&
              opp.pos.y < hy + hitboxHeight &&
              opp.pos.y + opp.height > hy
            );
            
            if (collides || Math.abs(opp.pos.x - p.pos.x) < 140) {
              opp.takeDamage(100);
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(8, 3, "PERLIN", 0.3);
              try {
                engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, true);
              } catch (err) {}
            }
            
            (p as any).kuririn_ph6_launched = false;
            (p as any).kuririn_ph6_launch_timer = 0;
          }

          if (!(p as any).kuririn_ph6_launched) {
            opp.pos.x = p.pos.x + (p.facingRight ? 55 : -55);
            opp.pos.y = p.pos.y;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;

            if (p.animFinished && p.ultTimer > 5) {
              (p as any).kuririn_ph6_launched = true;
              opp.velocity.x = p.facingRight ? 26 : -26;
              opp.velocity.y = 0;
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.4);
              try {
                engine.particleManager.spawn("ENERGY", opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, 8, p.data.color || "#eab308");
              } catch (err) {}
            }
          } else {
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            (p as any).kuririn_ph6_launch_timer++;
            if ((p as any).kuririn_ph6_launch_timer >= 15) {
              p.ultPhase = 7;
              p.ultTimer = 0;
              p.animFinished = false;
              delete (p as any).kuririn_ph6_launched;
              delete (p as any).kuririn_ph6_launch_timer;
            }
          }
          break;
        }

        case 7: { // Fase 7 – Segundo Teleporte
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            // Teleport to the back of the opponent
            p.pos.x = opp.pos.x + (opp.facingRight ? -70 : 70);
            p.pos.y = opp.pos.y;
            p.facingRight = opp.facingRight;

            AudioManager.getInstance().playSFX("teleport");
            try {
              engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#ffffff");
            } catch (err) {}

            // Hitbox check
            const hitboxWidth = 120;
            const hitboxHeight = 100;
            const hx = p.facingRight ? p.pos.x + p.width : p.pos.x - hitboxWidth;
            const hy = p.pos.y;
            
            const collides = (
              opp.pos.x < hx + hitboxWidth &&
              opp.pos.x + opp.width > hx &&
              opp.pos.y < hy + hitboxHeight &&
              opp.pos.y + opp.height > hy
            );
            
            if (collides || Math.abs(opp.pos.x - p.pos.x) < 140) {
              opp.takeDamage(120);
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(8, 3, "PERLIN", 0.3);
              try {
                engine.particleManager.spawnHitSpark(opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, true);
              } catch (err) {}
            }
            
            (p as any).kuririn_ph7_launched = false;
            (p as any).kuririn_ph7_launch_timer = 0;
          }

          if (!(p as any).kuririn_ph7_launched) {
            opp.pos.x = p.pos.x + (p.facingRight ? 55 : -55);
            opp.pos.y = p.pos.y;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;

            if (p.animFinished && p.ultTimer > 5) {
              (p as any).kuririn_ph7_launched = true;
              // Launch diagonally up
              opp.velocity.x = p.facingRight ? 22 : -22;
              opp.velocity.y = -18;
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 100;
              if (engine.camera) engine.camera.addScreenShake(16, 8, "IMPULSE", 0.5);
              try {
                engine.particleManager.spawn("ENERGY", opp.pos.x + opp.width / 2, opp.pos.y + opp.height / 2, 12, p.data.color || "#eab308");
              } catch (err) {}
            }
          } else {
            // Gravity is reenabled here, so we let the physics engine move the opponent naturally
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            (p as any).kuririn_ph7_launch_timer++;
            if ((p as any).kuririn_ph7_launch_timer >= 20) {
              p.ultPhase = 8;
              p.ultTimer = 0;
              p.animFinished = false;
              delete (p as any).kuririn_ph7_launched;
              delete (p as any).kuririn_ph7_launch_timer;
            }
          }
          break;
        }

        case 8: { // Fase 8 – Reposicionamento Lateral
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            // Teleport to the side of the opponent (a bit further back for charging beam)
            p.pos.y = opp.pos.y;
            p.pos.x = p.facingRight ? opp.pos.x - 280 : opp.pos.x + 280;

            AudioManager.getInstance().playSFX("teleport");
            try {
              engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#ffffff");
            } catch (err) {}
          }

          // Freeze opponent completely in the air (no gravity, no movement, no physics)
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;

          if (p.ultTimer >= 25 || p.animFinished) {
            p.ultPhase = 9;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }

        case 9: { // Fase 9 – Disparo do Beam alinhado
          p.velocity.x = 0;
          p.velocity.y = 0;

          if (p.ultTimer === 1) {
            if (engine.camera) {
              engine.camera.addScreenShake(45, 20, "IMPULSE", 1.2);
            }

            const config: any = p.data.spriteConfig?.animations?.["Ultimate_combinado_9"] || {};
            const beamId = config.createsBeamUlt || config.createsBeam || "CHAVE_BEAM_003";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
               famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const finalSpeed = config.projectileSpeed ?? famMiddle?.projectileSpeed ?? 22;
            const vx = p.facingRight ? finalSpeed : -finalSpeed;
            const vy = 0;

            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              "#ffaa00",
              true,
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.vy = vy;
            proj.rotation = config.rotation ?? famMiddle?.rotation ?? 0;
            p.rotation = 0;
            proj.sourceAnimConfig = config;

            (p as any).beamSpawned = true;
            (p as any).beamHasBeenSpawned = true;
            (p as any).hasSpawnedInSequence = true;
            (p as any).spawnedBeamProjectile = proj;
            engine.projectiles.push(proj);

            AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");
          }

          // Segura e imobiliza o oponente (congelamento permanece ativo continuamente)
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 10;
          
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(10, 4, "PERLIN", 0.3);
          }

          if (p.animFinished && p.ultTimer > 60) {
            p.ultPhase = 10;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }

        case 10: { // Fase 10 – Restauração Física e Fim da Sequência
          p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          p.ataque = false;
          p.ultPhase = 0;
          p.ultTimer = 0;
          p.rotation = 0;

          opp.state = opp.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          opp.stunTimer = 0;
          opp.rotation = 0;

          if ((p as any).spawnedBeamProjectile) {
            (p as any).spawnedBeamProjectile.active = false;
            (p as any).spawnedBeamProjectile = undefined;
          }
          (p as any).beamSpawned = false;
          p.animFinished = false;
          break;
        }
      }
    } else if (p.data.id === "kuririn" && p.ultType === 1) {
      switch (p.ultPhase) {
        case 1: { // Fase 1: personagem voa para o alto até atingir uma posição acima do oponente
          p.velocity.x = 0;
          if (p.ultTimer <= 1) {
            p.velocity.y = -12;
            p["ult1_touched"] = false;
          }
          const targetY = Math.max(100, opp.pos.y - 200);
          if (p.pos.y <= targetY || p.pos.y <= 100) {
            p.pos.y = Math.max(100, targetY);
            p.velocity.y = 0;
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }

        case 2: { // Fase 2: Fica parado no ar
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.facingRight = opp.pos.x > p.pos.x;

          // Ultimate_1_2 tem 12 frames a velocidade 4 = 48 ticks.
          if (p.ultTimer >= 48) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }

        case 3: { // Fase 3: Fica parado no ar, cria hitbox crescente
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.facingRight = opp.pos.x > p.pos.x;

          if (p.ultTimer <= 1) {
            p["ult1_touched"] = false;
          }

          // Detectar contato utilizando a hitbox do personagem
          const isContacting = CollisionHelper.testAABB(p.hitbox, opp.hitbox);

          if (isContacting) {
            p["ult1_touched"] = true;
          }

          const oppCenterX = opp.pos.x + opp.width / 2;
          const oppCenterY = opp.pos.y + opp.height / 2;

          if (p["ult1_touched"]) {
            // Oponente recebe dano constante após tocar no hitbox
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.takeDamage(1.6);
            opp.state = PlayerState.HIT;
            opp.stunTimer = 10;

            if (p.ultTimer % 4 === 0) {
              if (engine.camera) {
                engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
              }
              try {
                engine.particleManager.spawnHitSpark(oppCenterX, oppCenterY, false);
                engine.particleManager.spawn("ENERGY", oppCenterX + (Math.random() - 0.5) * 60, oppCenterY + (Math.random() - 0.5) * 60, 2, p.data.color || "#f59e0b", { size: 12, speed: 6 });
              } catch (err) {}
            }
          }

          // Quando terminar a animação de fase 3, finaliza o Ultimate
          if (p.animFinished && p.ultTimer > 10) {
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;

            if (p["ult1_touched"]) {
              opp.state = PlayerState.KNOCKED_DOWN;
              opp.stunTimer = 60;
            }
            p["ult1_touched"] = false;
          }
          break;
        }
      }
    } else if (p.data.id === "kuririn" && p.ultType === 2) {
      switch (p.ultPhase) {
        case 1: { // Fase 1: Carregamento Inicial (1.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(4, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 40, 2, p.data.color || "#eab308");
            } catch (err) {}
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 2: { // Fase 2: Totalmente Parado (2.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 3: { // Fase 3: Parado sem Teleporte (3.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;

          if (p.ultTimer === 1) {
            AudioManager.getInstance().playSFX("goku_base_kamehameha_lancado");
            if (engine.camera) {
              engine.camera.addScreenShake(30, 15, "IMPULSE", 1.0);
            }

            // Spawn the custom beam for Kuririn Ultimate_2_3 configured as CHAVE_BEAM_008
            const config: any = p.data.spriteConfig?.animations?.["Ultimate_2_3"] || {};
            const beamId = config.createsBeam || "CHAVE_BEAM_008";
            const activeBeam = BeamConfigKeyManager.getInstance().getBeamConfig(beamId);
            let famMiddle = (activeBeam || BEAM_DATABASE[beamId])?.middle;
            const charOverrides = p.data.beamOverrides?.[beamId];
            if (famMiddle && charOverrides && charOverrides.middle) {
               famMiddle = { ...famMiddle, ...charOverrides.middle };
            }

            const projWidth = config.projectileWidth ?? famMiddle?.projectileWidth ?? 120;
            const projHeight = config.projectileHeight ?? famMiddle?.projectileHeight ?? 120;

            let spawnX = p.pos.x + p.width / 2;
            let spawnY = p.pos.y;

            const finalKiX = config.kiOriginX ?? famMiddle?.kiOriginX ?? p.data.spriteConfig?.kiOriginX ?? 76;
            const finalKiY = config.kiOriginY ?? famMiddle?.kiOriginY ?? p.data.spriteConfig?.kiOriginY ?? 125;

            if (p.facingRight) {
              spawnX = p.x + finalKiX;
            } else {
              spawnX = p.x + p.width - finalKiX - projWidth;
            }
            spawnY = p.y + finalKiY;

            const finalSpeed = config.projectileSpeed ?? famMiddle?.projectileSpeed ?? 22;
            const vx = p.facingRight ? finalSpeed : -finalSpeed;
            const vy = 0;

            const ownerId = p === engine.player1 ? "p1" : "p2";

            const proj = Projectile.spawn(
              spawnX,
              spawnY,
              vx,
              ownerId,
              "#ffffff",
              true,
              beamId,
              projWidth,
              projHeight,
              config.projectileOffsetX ?? famMiddle?.projectileOffsetX,
              config.projectileOffsetY ?? famMiddle?.projectileOffsetY,
              config.projectileScale ?? famMiddle?.projectileScale ?? famMiddle?.scale,
            );
            proj.vy = vy;
            proj.rotation = config.rotation ?? famMiddle?.rotation ?? 0;
            proj.sourceAnimConfig = config;

            (p as any).beamSpawned = true;
            (p as any).beamHasBeenSpawned = true;
            (p as any).spawnedBeamProjectile = proj;
            engine.projectiles.push(proj);
          }

          // Deal continuous damage to opponent while the beam is active
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 40, false);
            } catch (err) {}
          }

          if (p.ultTimer >= 90) {
            // Deactivate beam projectile
            if ((p as any).spawnedBeamProjectile) {
              (p as any).spawnedBeamProjectile.active = false;
              (p as any).spawnedBeamProjectile = undefined;
            }
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 4: { // Fase 4: Combo / Golpes Iniciais sem mover oponente (4.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 40, false);
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 5: { // Fase 5: Apenas Kuririn sobe verticalmente (5.gif)
          p.velocity.x = 0;
          
          if (p.ultTimer === 1) {
            p["kuririn_ult2_orig_pos_x"] = p.pos.x;
            p["kuririn_ult2_orig_pos_y"] = p.pos.y;
          }
          
          const targetY = opp.pos.y - 120;
          if (p.pos.y > targetY) {
            p.velocity.y = -12;
          } else {
            p.velocity.y = 0;
          }
          
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 40, false);
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            if (p["kuririn_ult2_orig_pos_x"] !== undefined && p["kuririn_ult2_orig_pos_y"] !== undefined) {
              p.pos.x = p["kuririn_ult2_orig_pos_x"];
              p.pos.y = p["kuririn_ult2_orig_pos_y"];
            }
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 6: { // Fase 6: Parado na Posição Restaurada (6.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 7: { // Fase 7: Carregando Ataque Supremo Parado (7.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(5, 3, "PERLIN", 0.3);
            try {
              engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 4, "#ff7700");
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 8: { // Fase 8: Impacto Supremo de Kienzan / Blast Final no Local (8.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          
          if (p.ultTimer === 1) {
            p["kuririn_ult2_blasts_fired"] = 0;
            p["kuririn_ult2_last_blast_timer"] = 0;
            p["kuririn_anim8_finished_natural"] = false;
            
            const originX = opp.pos.x + opp.width / 2;
            const originY = opp.pos.y - 280;
            const ownerId = p === engine.player1 ? "p1" : "p2";
            
            const fechoProj = Projectile.spawn(
              originX - 40,
              originY - 40,
              0,
              ownerId,
              "#ffffff",
              false,
              "fechosenergia_11",
              80,
              80,
              0,
              0,
              2.2
            );
            fechoProj.vy = 0;
            fechoProj.life = 9999;
            engine.projectiles.push(fechoProj);
            p["kuririn_fecho_projectile"] = fechoProj;
            
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 250;
            
            if (engine.camera) engine.camera.addScreenShake(15, 8, "PERLIN", 0.5);
            try {
              AudioManager.getInstance().playSFX("explosion");
            } catch (err) {}
          }
          
          const fecho = p["kuririn_fecho_projectile"];
          if (fecho && fecho.active) {
            fecho.x = opp.pos.x + opp.width / 2 - fecho.width / 2;
            fecho.y = opp.pos.y - 280;
          }
          
          let blastsFired = p["kuririn_ult2_blasts_fired"] || 0;
          if (blastsFired < 10) {
            const lastBlastTimer = p["kuririn_ult2_last_blast_timer"] || 0;
            if (p.ultTimer - lastBlastTimer >= 15) {
              p["kuririn_ult2_blasts_fired"] = blastsFired + 1;
              p["kuririn_ult2_last_blast_timer"] = p.ultTimer;
              
              const spawnX = opp.pos.x + opp.width / 2;
              const spawnY = opp.pos.y - 280;
              
              const targetX = opp.pos.x + opp.width / 2 + (Math.random() * 80 - 40);
              const targetY = opp.pos.y + opp.height / 2 + (Math.random() * 80 - 40);
              
              const dx = targetX - spawnX;
              const dy = targetY - spawnY;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              
              const speed = 15;
              const vx = (dx / dist) * speed;
              const vy = (dy / dist) * speed;
              
              const ownerId = p === engine.player1 ? "p1" : "p2";
              
              const blast = Projectile.spawn(
                spawnX - 25,
                spawnY - 25,
                vx,
                ownerId,
                "#ffffff",
                false,
                "PROJETIL_5",
                50,
                50,
                18,
                0,
                1.5
              );
              blast.vy = vy;
              engine.projectiles.push(blast);
              
              try {
                engine.particleManager.spawn("ENERGY", spawnX, spawnY, 3, "#ffffff", { size: 10, speed: 6 });
                engine.particleManager.spawnHitSpark(targetX, targetY, Math.random() > 0.5);
              } catch (err) {}
              
              try {
                AudioManager.getInstance().playSFX("shoot");
              } catch (err) {}
              
              opp.takeDamage(18);
              if (engine.camera) engine.camera.addScreenShake(4, 2, "PERLIN", 0.15);
            }
          }
          
          if (p.animFinished) {
            p["kuririn_anim8_finished_natural"] = true;
          }
          
          const currentBlasts = p["kuririn_ult2_blasts_fired"] || 0;
          
          if ((p.animFinished || p["kuririn_anim8_finished_natural"]) && currentBlasts < 10) {
            const totalFrames = p.data.spriteConfig?.animations?.["Ultimate_2_8"]?.frames || 1;
            p.animFrame = totalFrames - 1;
            p.animFinished = false;
          }
          
          if (currentBlasts >= 10 && (p.animFinished || p["kuririn_anim8_finished_natural"])) {
            if (p["kuririn_fecho_projectile"]) {
              p["kuririn_fecho_projectile"].active = false;
              p["kuririn_fecho_projectile"] = null;
            }
            
            p["kuririn_anim8_finished_natural"] = false;
            
            opp.state = PlayerState.KNOCKED_DOWN;
            opp.stunTimer = 120;
            
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
          }
          break;
        }
      }
    } else if (p.data.id === "kuririn" && p.ultType === 4) {
      switch (p.ultPhase) {
        case 1: { // Fase 1: Carregamento Inicial (1.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(4, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 40, 2, p.data.color || "#eab308");
            } catch (err) {}
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 2: { // Fase 2: Totalmente Parado (2.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 3: { // Fase 3: Parado / Preparando Ataque (3.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer === 1) {
            try {
              AudioManager.getInstance().playSFX("shoot");
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 4;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 4: { // Fase 4: Combo / Golpes Iniciais sem mover oponente (4.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 40, false);
            } catch (err) {}
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 5: { // Fase 5: Apenas Kuririn sobe verticalmente (5.gif)
          p.velocity.x = 0;
          if (p.ultTimer === 1) {
            p["kuririn_ult4_orig_pos_x"] = p.pos.x;
            p["kuririn_ult4_orig_pos_y"] = p.pos.y;
          }
          
          const targetY = opp.pos.y - 120;
          if (p.pos.y > targetY) {
            p.velocity.y = -12;
          } else {
            p.velocity.y = 0;
          }
          
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 4 === 0) {
            opp.takeDamage(12);
            if (engine.camera) engine.camera.addScreenShake(6, 2, "PERLIN", 0.3);
            try {
              engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 40, false);
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            if (p["kuririn_ult4_orig_pos_x"] !== undefined && p["kuririn_ult4_orig_pos_y"] !== undefined) {
              p.pos.x = p["kuririn_ult4_orig_pos_x"];
              p.pos.y = p["kuririn_ult4_orig_pos_y"];
            }
            p.velocity.x = 0;
            p.velocity.y = 0;
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 6: { // Fase 6: Parado na Posição Restaurada (6.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 7: { // Fase 7: Carregando Ataque Supremo Parado (7.gif)
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          opp.state = PlayerState.STUNNED;
          opp.stunTimer = 100;
          
          if (p.ultTimer % 5 === 0) {
            if (engine.camera) engine.camera.addScreenShake(5, 3, "PERLIN", 0.3);
            try {
              engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 4, "#ff7700");
            } catch (err) {}
          }
          
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        }
        case 8: { // Fase 8: Impacto Supremo de Blasts Simulados sem Projéteis Criados no Atacante/Local
          p.velocity.x = 0;
          p.velocity.y = 0;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
          
          if (p.ultTimer === 1) {
            p["kuririn_ult4_blasts_fired"] = 0;
            p["kuririn_ult4_last_blast_timer"] = 0;
            p["kuririn_anim8_finished_natural"] = false;
            
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 250;
            
            if (engine.camera) engine.camera.addScreenShake(15, 8, "PERLIN", 0.5);
            try {
              AudioManager.getInstance().playSFX("explosion");
            } catch (err) {}
          }
          
          let blastsFired = p["kuririn_ult4_blasts_fired"] || 0;
          if (blastsFired < 10) {
            const lastBlastTimer = p["kuririn_ult4_last_blast_timer"] || 0;
            if (p.ultTimer - lastBlastTimer >= 15) {
              p["kuririn_ult4_blasts_fired"] = blastsFired + 1;
              p["kuririn_ult4_last_blast_timer"] = p.ultTimer;
              
              const targetX = opp.pos.x + opp.width / 2 + (Math.random() * 80 - 40);
              const targetY = opp.pos.y + opp.height / 2 + (Math.random() * 80 - 40);
              
              try {
                engine.particleManager.spawn("ENERGY", targetX, targetY - 40, 3, "#ffffff", { size: 10, speed: 6 });
                engine.particleManager.spawnHitSpark(targetX, targetY, Math.random() > 0.5);
              } catch (err) {}
              
              try {
                AudioManager.getInstance().playSFX("shoot");
              } catch (err) {}
              
              opp.takeDamage(18);
              if (engine.camera) engine.camera.addScreenShake(4, 2, "PERLIN", 0.15);
            }
          }
          
          if (p.animFinished) {
            p["kuririn_anim8_finished_natural"] = true;
          }
          
          const currentBlasts = p["kuririn_ult4_blasts_fired"] || 0;
          if ((p.animFinished || p["kuririn_anim8_finished_natural"]) && currentBlasts < 10) {
            const totalFrames = p.data.spriteConfig?.animations?.["Ultimate_4_8"]?.frames || 1;
            p.animFrame = totalFrames - 1;
            p.animFinished = false;
          }
          
          if (currentBlasts >= 10 && (p.animFinished || p["kuririn_anim8_finished_natural"])) {
            p["kuririn_anim8_finished_natural"] = false;
            opp.state = PlayerState.KNOCKED_DOWN;
            opp.stunTimer = 120;
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.ultPhase = 0;
            p.ultTimer = 0;
          }
          break;
        }
      }
    } else if (p.data.id === "broly_ikari") {
      if (p.ultType === 1) {
        switch (p.ultPhase) {
          case 1: // Fase 1: Grito de fúria / Preparação estática
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;
            if (p.ultTimer % 5 === 0) {
              if (engine.camera) engine.camera.addScreenShake(5, 2, "PERLIN", 0.3);
              try {
                engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 4, "#22c55e", { size: 12, speed: 5 });
              } catch (err) {}
            }
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2;
              p.ultTimer = 0; // Temporizador inicia exatamente quando a movimentação começa
              p.animFinished = false;
            }
            break;

          case 2: // Fase 2: Investida constante em linha reta
            p.velocity.y = 0;
            // Broly avança em linha reta na direção para a qual está olhando.
            p.velocity.x = p.facingRight ? 35 : -35;
            
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            const isColliding = Math.abs(opp.pos.x - p.pos.x) <= 90 && Math.abs(opp.pos.y - p.pos.y) <= 120;

            if (isColliding) {
              // Colisão possui prioridade absoluta sobre o tempo limite. O avanço é interrompido imediatamente.
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            } else if (p.ultTimer >= 60) {
              // Se Broly não atingir o oponente dentro de 1 segundo: O Ultimate é cancelado imediatamente.
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              if (opp.state === PlayerState.STUNNED) {
                opp.state = PlayerState.IDLE;
                opp.stunTimer = 0;
              }
            }
            break;

          case 3: // Fase 3: Preparação do golpe principal, estático
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 100;

            if (p.ultTimer % 5 === 0) {
              if (engine.camera) engine.camera.addScreenShake(3, 1, "PERLIN", 0.15);
              try {
                engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 2, "#22c55e", { size: 10, speed: 4 });
              } catch (err) {}
            }

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 4;
              p.ultTimer = 0;
              p.animFinished = false;
              p["broly_ult1_hit_anytime"] = false;
            }
            break;

          case 4: // Fase 4: Brutal liberação de energia com hitbox circular que cresce gradualmente
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;

            // Utilizar a hitbox do personagem para detectar colisão
            const sphereHit = CollisionHelper.testAABB(p.hitbox, opp.hitbox);

            if (sphereHit) {
              p["broly_ult1_hit_anytime"] = true;
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 30;
              if (p.ultTimer % 4 === 0 && opp.invincibleTimer <= 0) {
                opp.takeDamage(6);
                if (opp.hp < 0) opp.hp = 0;
                if (engine.camera) engine.camera.addScreenShake(8, 4, "PERLIN", 0.15);
                try {
                  const hAtk = p.hitbox;
                  const hDef = opp.hitbox;
                  const closeX = Math.max(hDef.x, Math.min(hAtk.x + hAtk.width / 2, hDef.x + hDef.width));
                  const closeY = Math.max(hDef.y, Math.min(hAtk.y + hAtk.height / 2, hDef.y + hDef.height));
                  engine.particleManager.spawnHitSpark(closeX, closeY, true);
                  engine.particleManager.spawn("HIT", closeX, closeY, 3, "#22c55e");
                } catch (err) {}
              }
            }

            if (p.animFinished && p.ultTimer > 5) {
              // Ao término da Fase 4, se o oponente colidiu em qualquer momento, ele é lançado para longe.
              if (p["broly_ult1_hit_anytime"]) {
                opp.state = PlayerState.HIT;
                opp.stunTimer = 0;
                opp.velocity.x = p.facingRight ? 38 : -38;
                opp.velocity.y = -14;
                opp.isGrounded = false;
              }
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 5: // Fase 5: Finalização estática da Ultimate sem hitbox ativa
            p.velocity.x = 0;
            p.velocity.y = 0;
            if (p.animFinished && p.ultTimer > 5) {
              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              p.animFinished = false;
              p["broly_ult1_hit_anytime"] = undefined;
            }
            break;
        }
      } else {
        // Ultimate 2: 9 phases combo
        switch (p.ultPhase) {
          case 1: // Fase 1: Broly permanece parado executando a animação da Fase 1 (Ultimate_2_1)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;
            if (p.ultTimer % 5 === 0) {
              if (engine.camera) engine.camera.addScreenShake(3, 1, "PERLIN", 0.15);
              try {
                engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 1, "#22c55e", { size: 8, speed: 3 });
              } catch (err) {}
            }
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2; // Avança obrigatoriamente para a Fase 2
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 2: // Fase 2: Broly permanece parado executando a animação da Fase 2 (Ultimate_2_2)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;
            if (p.ultTimer % 5 === 0) {
              if (engine.camera) engine.camera.addScreenShake(3, 1, "PERLIN", 0.15);
              try {
                engine.particleManager.spawn("ENERGY", p.pos.x, p.pos.y - 50, 1, "#22c55e", { size: 8, speed: 3 });
              } catch (err) {}
            }
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 3; // Avança obrigatoriamente para a Fase 3
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 3: // Fase 3: Broly permanece parado executando a animação da Fase 3 (Ultimate_2_3)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;
            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 4; // Avança obrigatoriamente para a Fase 4
              p.ultTimer = 0;
              p.animFinished = false;
              p["broly_ult2_dash_timer"] = 0; // Inicializa o timer de avanço
            }
            break;

          case 4: // Fase 4: Broly avança em linha reta na direção para a qual está olhando (Ultimate_2_4)
            // Durante todo o avanço, Broly mantém a animação da Fase 4
            p.animFinished = false;

            const distX4 = opp.pos.x - p.pos.x;
            if (p["broly_ult2_dash_timer"] === 0) {
              p.facingRight = distX4 >= 0;
            }

            const bDashSpeed = 35;
            p.velocity.x = p.facingRight ? bDashSpeed : -bDashSpeed;
            p.velocity.y = 0;

            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            p["broly_ult2_dash_timer"] = (p["broly_ult2_dash_timer"] || 0) + 1;

            // Verificação contínua de colisão física com o oponente utilizando hitboxes
            const isColliding4 = CollisionHelper.testAABB(p.hitbox, opp.hitbox);
            if (isColliding4) {
              // Caso ocorra colisão: O avanço é interrompido imediatamente e o Ultimate prossegue para a Fase 5
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.ultPhase = 5;
              p.ultTimer = 0;
              p.animFinished = false;
              p["broly_ult2_dash_timer"] = undefined;
            } else if (p["broly_ult2_dash_timer"] >= 60) {
              // Caso não ocorra colisão dentro de 1 segundo (60 frames):
              // O Ultimate é cancelado imediatamente, as Fases 5, 6, 7, 8 e 9 não são executadas, Broly retorna ao normal
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              if (opp.state === PlayerState.STUNNED) {
                opp.state = PlayerState.IDLE;
                opp.stunTimer = 0;
              }
              p["broly_ult2_dash_timer"] = undefined;
            }
            break;

          case 5: // Fase 5: Broly permanece parado executando a animação da Fase 5 (Ultimate_2_5)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.ultTimer === 1) {
              opp.takeDamage(12);
              if (engine.camera) engine.camera.addScreenShake(12, 6, "IMPULSE", 0.5);
              try {
                engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, true);
                engine.particleManager.spawn("HIT", opp.pos.x, opp.pos.y - 50, 4, "#22c55e");
              } catch (err) {}
            }

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 6; // Avança para a Fase 6
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 6: // Fase 6: Broly permanece parado executando a animação da Fase 6 (Ultimate_2_6)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 7; // Avança para a Fase 7
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 7: // Fase 7: Broly permanece parado executando a animação da Fase 7 (Ultimate_2_7)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 8; // Avança obrigatoriamente para a Fase 8
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 8: // Fase 8: Criada uma hitbox longa à frente do Broly (Ultimate_2_8)
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;

            // A hitbox deve ser posicionada à frente do personagem, respeitando a direção para a qual ele está olhando.
            // Utilizar a hitbox do personagem para detectar colisão.
            const isContacting = CollisionHelper.testAABB(p.hitbox, opp.hitbox);

            if (isContacting) {
              opp.state = PlayerState.STUNNED;
              opp.stunTimer = 15;
              // Recebe dano constante repetidamente durante o contato
              if (p.ultTimer % 4 === 0) {
                opp.takeDamage(3);
                if (engine.camera) engine.camera.addScreenShake(5, 2, "PERLIN", 0.15);
                try {
                  engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, false);
                  engine.particleManager.spawn("HIT", opp.pos.x + (Math.random() - 0.5) * 40, opp.pos.y - 50, 2, "#22c55e");
                } catch (err) {}
              }
            }

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 9; // Avança para a Fase 9
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;

          case 9: // Fase 9: Broly permanece parado executando a animação final (Ultimate_2_9). Nenhuma hitbox ativa nesta fase.
            p.velocity.x = 0;
            p.velocity.y = 0;

            if (p.ultTimer === 1) {
              opp.takeDamage(25);
              if (engine.camera) engine.camera.addScreenShake(20, 10, "IMPULSE", 0.6);
              try {
                engine.particleManager.spawnHitSpark(opp.pos.x, opp.pos.y - 50, true);
                engine.particleManager.spawn("AURA", opp.pos.x, opp.pos.y - 50, 15, "#16a34a", { size: 25, speed: 10 });
              } catch (err) {}
            }

            if (p.animFinished && p.ultTimer > 5) {
              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              opp.stunTimer = 0;
              opp.state = PlayerState.HIT;
              opp.velocity.x = p.facingRight ? 40 : -40;
              opp.velocity.y = -12;
              opp.isGrounded = false;
              p.animFinished = false;
            }
            break;
        }
      }
    } else if (p.data.id === "frieza_final") {
      if (p.ultType === 2) {
        switch (p.ultPhase) {
          case 1: {
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.ultTimer === 1) {
              // Recalculate teleport position above the opponent horizontally offset
              const horizDist = 120;
              const verticalOffset = -220;
              
              const side = p.pos.x < opp.pos.x ? -1 : 1;
              let targetX = opp.pos.x + side * horizDist;
              let targetY = opp.pos.y + verticalOffset;

              targetX = Math.max(50, Math.min(engine.worldWidth - 50, targetX));
              const floorY = WORLD_HEIGHT - engine.groundY;
              targetY = Math.max(50, Math.min(floorY - 120, targetY));

              p.pos.x = targetX;
              p.pos.y = targetY;
              p.facingRight = p.pos.x < opp.pos.x;

              try {
                engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#a855f7");
              } catch (err) {}
            }

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 2: {
            // Suspended in air, no velocities applied
            p.velocity.x = 0;
            p.velocity.y = 0;
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.animFinished && p.ultTimer > 5) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }
          case 3: {
            // 45 degrees downward speed sweep towards the ground
            const speed = 25;
            const dirX = p.facingRight ? 1 : -1;
            p.velocity.y = speed;
            p.velocity.x = dirX * speed;

            opp.velocity.x = 0;
            opp.velocity.y = 0;

            // Utilizar a hitbox do personagem para detectar colisão
            const isColliding = CollisionHelper.testAABB(p.hitbox, opp.hitbox);

            if (isColliding) {
              if (p.ultTimer % 4 === 0 && opp.invincibleTimer <= 0) {
                const damage = 3.5;
                opp.takeDamage(damage);
                opp.state = PlayerState.HIT;
                     opp.stunTimer = Math.max(opp.stunTimer, 20);

                try {
                  const hAtk = p.hitbox;
                  const hDef = opp.hitbox;
                  const closestX = Math.max(hDef.x, Math.min(hAtk.x + hAtk.width / 2, hDef.x + hDef.width));
                  const closestY = Math.max(hDef.y, Math.min(hAtk.y + hAtk.height / 2, hDef.y + hDef.height));
                  engine.particleManager.spawnHitSpark(closestX, closestY, false);
                  engine.particleManager.spawn("HIT", closestX, closestY, 4, "#a855f7");
                } catch (err) {}
              }
            }

            // Collide with ground to finish the sequence
            const floorY = WORLD_HEIGHT - engine.groundY;
            if (p.pos.y >= floorY - 5) {
              p.pos.y = floorY;
              p.velocity.x = 0;
              p.velocity.y = 0;

              p.state = PlayerState.IDLE;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;

              if (opp.state === PlayerState.HIT || opp.state === PlayerState.STUNNED) {
                opp.state = PlayerState.KNOCKED_DOWN;
                opp.stunTimer = 100;
                opp.velocity.x = p.facingRight ? 18 : -18;
                opp.velocity.y = -8;
                opp.isGrounded = false;

                if (engine.camera) {
                  engine.camera.addScreenShake(30, 15, "IMPULSE", 1.25);
                }
                try {
                  engine.particleManager.spawn("AURA", p.pos.x, floorY, 20, "#a855f7");
                  engine.particleManager.spawn("ENERGY", p.pos.x, floorY, 15, "#e9d5ff", { size: 12, speed: 8 });
                } catch (err) {}
              } else {
                opp.stunTimer = 0;
              }
            }
            break;
          }
        }
      } else {
        // Ultimate 1 for Frieza (3-phase high fidelity implementation)
        const ownerId_ = p === engine.player1 ? "p1" : "p2";
        const genki = engine.projectiles.find(
          (proj) => proj instanceof Genkidama && proj.ownerId === ownerId_ && proj.active
        ) as Genkidama | undefined;

        // Frieza stays in the air suspended
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.gravityDisabledTimer = 5;
        p.isGrounded = false;

        switch (p.ultPhase) {
          case 1: {
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.ultTimer === 1) {
              // Teleport instant to a position above opponent horizontally offset
              const horizDist = 120;
              const verticalOffset = -220;
              
              const side = p.pos.x < opp.pos.x ? -1 : 1;
              let targetX = opp.pos.x + side * horizDist;
              let targetY = opp.pos.y + verticalOffset;

              targetX = Math.max(50, Math.min(engine.worldWidth - 50, targetX));
              const floorY = WORLD_HEIGHT - engine.groundY;
              targetY = Math.max(50, Math.min(floorY - 120, targetY));

              p.pos.x = targetX;
              p.pos.y = targetY;
              p.facingRight = p.pos.x < opp.pos.x;

              try {
                engine.particleManager.spawn("AURA", p.pos.x, p.pos.y, 10, "#a855f7");
              } catch (err) {}
              
              try {
                const voiceUrl = "/Assets/SONS/DUBLAGEM/FREEZA/DENTRO DE 5 MINUTOS ESSE PLANETA SE DESTRUIRA EM PÓ.wav".replace(/ /g, "%20").replace(/Ó/g, "%C3%93");
                VoiceManager.getInstance().playVoice(voiceUrl);
              } catch (err) {}
              try {
                AudioManager.getInstance().playSFX("goku_base_genkidama_inicio");
              } catch (err) {}
            }

            if (p.animFinished || p.ultTimer > 60) {
              p.ultPhase = 2;
              p.ultTimer = 0;
              p.animFinished = false;
            }
            break;
          }

          case 2: {
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.ultTimer === 1) {
              const genkiProj = new Genkidama(ownerId_, "CHAVE_GENKIDAMA_5", p.pos.x, p.pos.y - 120, p.data.color, engine);
              genkiProj.genkidamaScale = 0; // Starts invisible
              engine.projectiles.push(genkiProj);
              try {
                AudioManager.getInstance().playSFX("goku_base_genkidama_criando");
              } catch (err) {}
            }

            const GROW_TIME = 120; // 2 seconds at 60fps
            if (genki) {
              const progress = Math.min(1.0, p.ultTimer / GROW_TIME);
              genki.genkidamaScale = progress;
            }

            if (p.ultTimer >= GROW_TIME) {
              p.ultPhase = 3;
              p.ultTimer = 0;
              p.animFinished = false;
              if (genki) {
                genki.genkidamaState = "throw";
              }
            }
            break;
          }

          case 3: {
            opp.velocity.x = 0;
            opp.velocity.y = 0;
            opp.state = PlayerState.STUNNED;
            opp.stunTimer = 10;

            if (p.ultTimer === 1) {
              try {
                const voiceUrl = "/Assets/SONS/DUBLAGEM/FREEZA/DESTA VEZ EU ACABI COM VOCÊS.wav".replace(/ /g, "%20");
                VoiceManager.getInstance().playVoice(voiceUrl);
              } catch (err) {}
            }

            if (!genki) {
              p.state = PlayerState.FALLING;
              p.ataque = false;
              p.isGrounded = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              p.animFinished = false;

              opp.state = PlayerState.KNOCKED_DOWN;
              opp.stunTimer = 100;
              opp.velocity.x = p.facingRight ? 18 : -18;
              opp.velocity.y = -8;
              opp.isGrounded = false;
            }
            break;
          }
        }
      }
    } else {
      switch (p.ultPhase) {
        case 1: // INICIO
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 2;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 2: // MEIO 1 (tela cheia)
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3: // MEIO 2 (não pode se mover)
          p.velocity.x = 0;
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 3.5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 3.5: // BUSCA (avança até colidir)
          {
            const dir = p.facingRight ? 1 : -1;
            p.velocity.x = dir * 25; // Chase

            const hitboxP = p.hitbox;
            const hitboxOpp = opp.hitbox;
            const collides =
              hitboxP.x < hitboxOpp.x + hitboxOpp.width &&
              hitboxP.x + hitboxP.width > hitboxOpp.x &&
              hitboxP.y < hitboxOpp.y + hitboxOpp.height &&
              hitboxP.y + hitboxP.height > hitboxOpp.y;

            if (
              collides ||
              (Math.abs(p.x - opp.x) < 80 && Math.abs(p.y - opp.y) < 80)
            ) {
              const isFacing =
                (p.facingRight && !opp.facingRight) ||
                (!p.facingRight && opp.facingRight);
              const isBlocking =
                isFacing &&
                (opp.state === PlayerState.BLOCKING ||
                  opp.state === PlayerState.BLOCKING_CROUCH ||
                  opp.state === PlayerState.BLOCKING_AIR ||
                  opp.state === PlayerState.WALK_BACKWARD);
              if (isBlocking) {
                p.velocity.x = 0;
                p.ultPhase = 0;
                p.state = PlayerState.IDLE;
                p.ataque = false;
                opp.velocity.x = p.facingRight ? 10 : -10;
                if (engine.particleManager)
                  engine.particleManager.spawn(
                    "BLOCK",
                    opp.pos.x,
                    opp.pos.y - 50,
                    5,
                    "#60a5fa",
                  );
              } else {
                // Collision
                p.velocity.x = 0;
                p.x = dir > 0 ? opp.x - 60 : opp.x + 60; // Lock distance
                p.ultPhase = 4;
                p.ultTimer = 0;
              }
            } else if (
              (dir > 0 && p.x >= opp.x) ||
              (dir < 0 && p.x <= opp.x) ||
              p.x <= -225 ||
              p.x + p.width >= engine.worldWidth + 225
            ) {
              // Cancel on missed opponent or wall collision
              p.velocity.x = 0;
              p.velocity.y = 0;
              p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
              p.ataque = false;
              p.ultPhase = 0;
              p.ultTimer = 0;
              p.animFrame = 0;
              p.animTimer = 0;
              p.comboWindow = 0;
              p.comboCount = 0;
              p.comboStep = 0;
              p.hasHit = false;
              opp.stunTimer = 0;
              opp.state = opp.isGrounded
                ? PlayerState.IDLE
                : PlayerState.FALLING;
            }
          }
          break;
        case 4: // COMBO 1 (damage every 3 frames)
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 5;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 5: // TELEPORTE
          if (p.ultTimer === 5) {
            // Teleport behind
            p.x = p.facingRight ? opp.x + opp.width + 50 : opp.x - 50;
            p.facingRight = !p.facingRight; // Turn around
            engine.particleManager.spawn("AURA", p.x, p.y, 10, "#ffffff");
          }
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 6;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 6: // LANCAR AR
          if (p.ultTimer >= 10 && p.ultTimer <= 30) {
            opp.velocity.y = -25; // Sobe suavemente por 20 frames
          } else {
            opp.velocity.y = 0; // Fica parado no ar
          }
          if (p.animFinished && p.ultTimer > 5) {
            opp.velocity.y = 0; // Freeze in air
            opp.velocity.x = 0;
            p.ultPhase = 7;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 7: // KAMEHAMEHA
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 8;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 8: // KAMEHAMEHA FINAL
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 9;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 9: // BUSCA FINAL
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 10;
            p.ultTimer = 0;
            p.animFinished = false;
          }
          break;
        case 10: // ATAQUE FINAL (Zoom full screen)
          if (p.animFinished && p.ultTimer > 5) {
            p.ultPhase = 11;
            p.ultTimer = 0;
            p.y = opp.y;
            p.animFinished = false;
          }
          break;
        case 11: // FINAL
          if (p.ultTimer === 1) {
            p.velocity.x = 0;
            p.x = p.facingRight ? opp.x + opp.width + 50 : opp.x - 50;
            p.y = opp.y - 50; // Ficar acima dele
            p.facingRight = !p.facingRight; // Face opponent
          }
          if (p.animFinished && p.ultTimer > 5) {
            // End ultimate
            p.state = PlayerState.IDLE;
            p.ataque = false;
            p.isGrounded = false;
            p.velocity.y = 0;
            p.ultPhase = 0; // RESET ULTIMATE PHASE
            opp.stunTimer = 0;
            opp.state = PlayerState.HIT;
            opp.ataque = false;
            // Arremessar oponente para longe
            opp.velocity.x = p.facingRight ? 40 : -40;
            opp.velocity.y = -15; // lançar para longe no ar
            p.animFinished = false;
          }
          break;
      }
    }

    // Check damageFrames logic for ultimates
    let animKey = resolveAnimationKey(
      p.data.id,
      p.state,
      p.comboType,
      p.comboStep,
      p.ataque,
      p.ultPhase,
      p.nextTransformId,
      p.attackTimer,
      p.ultType,
      p.isGrounded,
      p.isDetransforming,
      p.isKOTag,
      p.data.spriteConfig,
      p.wasCrouching,
      p.stunTimer,
      undefined,
      p.animFinished,
      (p as any).customSubphase
    );

    const config = p.data.spriteConfig;
    const anim = config?.animations[animKey];

    if (
      anim &&
      String(anim.dealsDamage) !== "false" &&
      anim.damageFrames &&
      anim.damageFrames.includes(p.animFrame)
    ) {
      if (p["lastUltHitFrame"] !== p.animFrame) {
        p["lastUltHitFrame"] = p.animFrame;

        let dano = 0;
        let isEnergy = false;
        if (p.ultPhase === 4) dano = 15;
        if (p.ultPhase === 6) {
          dano = 50;
          opp.isGrounded = false;
        }
        if (p.ultPhase === 8) {
          dano = 30;
          isEnergy = true;
        }
        if (p.ultPhase === 11) dano = 100;

        if (anim.baseDamage !== undefined) dano = anim.baseDamage;

        if (dano > 0) {
          {
            const isFacing =
              (p.facingRight && !opp.facingRight) ||
              (!p.facingRight && opp.facingRight);
            const isBlocking =
              isFacing &&
              (opp.state === PlayerState.BLOCKING ||
                opp.state === PlayerState.BLOCKING_CROUCH ||
                opp.state === PlayerState.BLOCKING_AIR ||
                opp.state === PlayerState.WALK_BACKWARD);
            const inY = Math.abs(opp.pos.y - p.pos.y) < 600;
            if (opp.invincibleTimer <= 0 && inY) {
              if (isBlocking) {
                opp.takeDamage(dano * 0.1);
                opp.guard -= dano * 0.5;
                if (engine.particleManager)
                  engine.particleManager.spawn(
                    "BLOCK",
                    opp.pos.x,
                    opp.pos.y - 50,
                    2,
                    "#60a5fa",
                  );
                opp.velocity.x = p.facingRight ? 5 : -5;
                if (opp.guard <= 0) {
                  opp.state = PlayerState.GUARD_BREAK;
                  opp.stunTimer = 60;
                }
              } else {
                opp.takeDamage(dano);
                opp.stunTimer = Math.max(opp.stunTimer, 20);
              }
            }
          }
          if (dano >= 50) {
            engine.camera.addScreenShake(20, 15, "PERLIN", 0.8);
          } else {
            engine.camera.addScreenShake(10, 8, "IMPULSE", 1);
          }
          opp.ki = Math.min(MAX_KI, opp.ki + KI_GAIN_ON_DAMAGE);
          opp.ataque = false;
          if (isEnergy) {
            engine.particleManager.spawn(
              "ENERGY",
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              20,
              "#3b82f6",
              { size: 15, speed: 10 },
            );
          } else {
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2,
              opp.y + opp.height / 2,
              Math.random() > 0.5,
            );
          }
        }
      }
    } else if (
      anim &&
      anim.damageFrames &&
      !anim.damageFrames.includes(p.animFrame)
    ) {
      p["lastUltHitFrame"] = undefined;
    }

    // Ensure HP doesn't go below 0 (handled by takeDamage mostly, but good measure)
    if (opp.hp < 0) opp.hp = 0;

    // GLOBAL DISTANCE LIMIT FOR COMBO ULTIMATES
    const isComboUlt =
      (p.data.id === "goku_ssj" && p.ultType === 2) ||
      (p.data.id === "trunks_ssj2" && p.ultType === 2) ||
      (p.data.id === "teen_gohan_ssj2" && p.ultType === 2);

    // Check if WORLD_HEIGHT exists in current scope, usually does in GameEngine.ts,
    // otherwise hardcode 600 which is standard in this app.
    if (isComboUlt && p.y > -500 && p.ultPhase >= 3) {
      const DIST_LIMIT_Y = 230;
      const DIST_LIMIT_X = 230;

      // Vertical limit
      if (opp.y < p.y - DIST_LIMIT_Y) {
        opp.y = p.y - DIST_LIMIT_Y;
        if (opp.velocity.y < 0) opp.velocity.y = 0;
      }

      // Horizontal limit
      if (opp.x < p.x - DIST_LIMIT_X) {
        opp.x = p.x - DIST_LIMIT_X;
        opp.velocity.x = 0;
      } else if (opp.x > p.x + DIST_LIMIT_X) {
        opp.x = p.x + DIST_LIMIT_X;
        opp.velocity.x = 0;
      }
    }
  }
}
