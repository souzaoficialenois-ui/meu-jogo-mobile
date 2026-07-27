import { Projectile } from "./Projectile";
import { PlayerState } from "../types";
import { WORLD_HEIGHT, MAX_KI, KI_GAIN_ON_DAMAGE } from "../constants";
import { PROJECTILE_DATABASE } from "../constants/ProjectileDatabase";
import { AudioManager } from "./AudioManager";
import { VoiceManager } from "../src/engine/audio/VoiceManager";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { AnimationManager } from "./AnimationManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";

export interface GenkidamaCrack {
  x: number;
  scale: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export class Genkidama extends Projectile {
  public override isGiantBlast = true;
  public isGenkidama = true;
  public genkidamaState: "gather" | "throw" | "ground" | "explode" = "gather";
  public genkidamaScale = 0;
  public genkidamaX = 0;
  public genkidamaY = 0;
  public genkidamaFrame = 0;
  public genkidamaParticles: { x: number; y: number; size: number; speed: number }[] = [];
  public genkidamaSquishTimer = 0;
  public genkidamaTrapTimer = 0;
  public genkidamaSpeed?: number;
  public baseProjectileId: string;
  public genkidamaCracks: GenkidamaCrack[] = [];

  public getHitboxRadius(): number {
    const dynamicScale = this.genkidamaScale !== undefined ? this.genkidamaScale : 1;
    const finalFamily = ProjectileConfigKeyManager.getInstance().getProjectileConfig(this.baseProjectileId);
    if (!finalFamily) return 60 * dynamicScale;

    const gAnim = finalFamily.middle;
    const baseScale = gAnim?.scale || 2.2;
    let scaleMultiplier = baseScale * dynamicScale;

    if ((this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") && this.genkidamaState !== "explode") {
      scaleMultiplier = 2.5 * dynamicScale;
    }

    if (gAnim && gAnim.imageUrl) {
      const img = AnimationManager.getInstance().getGifFrame(gAnim.imageUrl, 0);
      if (img && img.width > 0) {
        return (img.width / 2) * scaleMultiplier;
      }
    }

    if (this.baseProjectileId.startsWith("CHAVE_GENKIDAMA_") || this.baseProjectileId.includes("GENKIDAMA")) {
      // 90 pixels represents half of 1/1.gif visual diameter.
      return 90 * scaleMultiplier;
    }
    return 60 * scaleMultiplier;
  }

  constructor(
    ownerId: "p1" | "p2",
    baseId: string, // "GENKIDAMA_1", "GENKIDAMA_2", "GENKIDAMA_3"
    x: number,
    y: number,
    color: string,
    engine?: any
  ) {
    let finalBaseId = baseId;
    if (engine) {
      const owner = ownerId === "p1" ? engine.player1 : engine.player2;
      if (owner && owner.data && owner.data.id) {
        const customKey = ProjectileConfigKeyManager.getInstance().getCustomGenkidamaKey(owner.data.id, baseId);
        if (customKey) {
          finalBaseId = customKey;
        }
      }
    }
    super();
    this.init(x, y, 0, ownerId, color, false, finalBaseId, 250, 250, 0, 0, 1, 0, "TARGET_POS");
    this.baseProjectileId = finalBaseId;
    this.genkidamaX = x;
    this.genkidamaY = y;
    this.disabledCollision = true; // Programmatic custom collision
  }

  public override update(engine?: any) {
    if (!engine) return;

    const owner = this.ownerId === "p1" ? engine.player1 : engine.player2;
    const opp = this.ownerId === "p1" ? engine.player2 : engine.player1;

    // Update squish timer
    if (this.genkidamaSquishTimer > 0) {
      this.genkidamaSquishTimer--;
    }

    if (this.genkidamaState === "gather") {
      this.vx = 0;
      this.vy = 0;

      // Cleanly follow owner's head/hand position
      const isFrieza = owner.data.id === "frieza_final";
      const isRosé = owner.data.id === "goku_black_rose";
      const isGokuBaseUlt2 = this.baseProjectileId === "CHAVE_GENKIDAMA_4";
      const isBrolyIkari = owner.data.id === "broly_ikari";

      if (isRosé) {
        this.genkidamaX = owner.x + (owner.facingRight ? 20 : -20);
        this.genkidamaY = owner.y - 120;
      } else if (isFrieza || isBrolyIkari) {
        this.genkidamaX = owner.pos.x;
        this.genkidamaY = owner.pos.y - 120;
      } else if (isGokuBaseUlt2) {
        this.genkidamaX = owner.x + owner.width / 2;
        this.genkidamaY = owner.y - 180;
      } else {
        this.genkidamaX = owner.x + owner.width / 2;
        this.genkidamaY = owner.y - 75;
      }

      this.x = this.genkidamaX - this.width / 2;
      this.y = this.genkidamaY - this.height / 2;

      if (engine.frameCount % 4 === 0) {
        this.genkidamaFrame++;
      }

      const GROW_TIME = isRosé ? 150 : 120;
      if (owner.ultTimer <= GROW_TIME && owner.ultTimer % 2 === 0) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 300 + Math.random() * 200;
        this.genkidamaParticles.push({
          x: this.genkidamaX + Math.cos(angle) * distance,
          y: this.genkidamaY + Math.sin(angle) * distance - (isRosé || isFrieza || isBrolyIkari || isGokuBaseUlt2 ? 0 : 200),
          size: 4 + Math.random() * 6,
          speed: 8 + Math.random() * 4,
        });
      }

      let targetScale = 0;
      if (this.baseProjectileId === "CHAVE_GENKIDAMA_4" || this.baseProjectileId === "CHAVE_GENKIDAMA_7") {
        targetScale = Math.min(2.5, (owner.ultTimer / GROW_TIME) * 2.5);
      } else if (owner.ultTimer <= GROW_TIME) {
        targetScale = owner.ultTimer / GROW_TIME;
      } else {
        targetScale = 1.0;
      }

      if (targetScale > this.genkidamaScale) {
        this.genkidamaScale = targetScale;
      }

    } else if (this.genkidamaState === "throw") {
      if (engine.frameCount % 4 === 0) {
        this.genkidamaFrame++;
      }

      if (this.genkidamaSpeed === undefined) {
        this.genkidamaSpeed = this.baseProjectileId === "GENKIDAMA_3" ? 16 : 12.5;
      }

      const targetX = opp.x + opp.width / 2;
      const targetY = WORLD_HEIGHT - engine.groundY;
      const dx = targetX - this.genkidamaX;
      const dy = targetY - this.genkidamaY;
      const mag = Math.sqrt(dx * dx + dy * dy);

      if (mag > 0) {
        this.genkidamaX += (dx / mag) * this.genkidamaSpeed;
        this.genkidamaY += (dy / mag) * this.genkidamaSpeed;
      }

      this.x = this.genkidamaX - this.width / 2;
      this.y = this.genkidamaY - this.height / 2;

      const distToOpp = Math.sqrt(
        Math.pow(this.genkidamaX - (opp.x + opp.width / 2), 2) +
        Math.pow(this.genkidamaY - (opp.y + opp.height / 2), 2)
      );

      const radius = this.getHitboxRadius();
      if (distToOpp < radius) {
        if (this.genkidamaTrapTimer === 0) {
          this.genkidamaSquishTimer = 60;
          try {
            AudioManager.getInstance().playSFX("goku_base_genkidama_colisao");
          } catch (err) {}
        }
        this.genkidamaTrapTimer++;
        this.genkidamaSpeed = this.baseProjectileId === "GENKIDAMA_3" ? 5 : 4;

        if (engine.frameCount % 5 === 0) {
          const isFacing = (owner.facingRight && !opp.facingRight) || (!owner.facingRight && opp.facingRight);
          const isBlocking = isFacing && (
            opp.state === PlayerState.BLOCKING ||
            opp.state === PlayerState.BLOCKING_CROUCH ||
            opp.state === PlayerState.BLOCKING_AIR ||
            opp.state === PlayerState.WALK_BACKWARD
          );
          const inY = Math.abs(opp.pos.y - owner.pos.y) < 600;

          if (opp.invincibleTimer <= 0 && inY) {
            const blockColor = this.baseProjectileId === "GENKIDAMA_2" ? "#ffffff" : "#60a5fa";
            const hitDamage = (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") ? 12 : 8;

            if (isBlocking) {
              opp.takeDamage(hitDamage * 0.1);
              opp.guard -= hitDamage * 0.5;
              if (engine.particleManager) {
                engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, blockColor);
              }
              opp.velocity.x = owner.facingRight ? 5 : -5;
              if (opp.guard <= 0) {
                opp.state = PlayerState.GUARD_BREAK;
                opp.stunTimer = 60;
              }
            } else {
              opp.takeDamage(hitDamage);
              opp.stunTimer = Math.max(opp.stunTimer, 20);
            }
          }
          if (engine.particleManager) {
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2 + (Math.random() - 0.5) * 50,
              opp.y + opp.height / 2 + (Math.random() - 0.5) * 50,
              false
            );
          }
        }

        const pushDirection = owner.facingRight ? 1 : -1;
        if (this.genkidamaTrapTimer > 18) {
          opp.x += (this.genkidamaX - opp.width / 2 - opp.x) * 0.9;
        } else {
          opp.x += pushDirection * this.genkidamaSpeed * 0.8;
        }

        if (opp.y < WORLD_HEIGHT - engine.groundY - opp.height) {
          opp.y += (this.genkidamaY - opp.height / 2 - opp.y) * 0.5;
        }
        if (opp.y > WORLD_HEIGHT - engine.groundY - opp.height) {
          opp.y = WORLD_HEIGHT - engine.groundY - opp.height;
        }
        opp.isGrounded = false;
        opp.velocity.x = pushDirection * this.genkidamaSpeed * 0.8;
        opp.velocity.y = 0;
        opp.gravityDisabledTimer = 5;
        opp.state = PlayerState.HIT;
        opp.facingRight = !owner.facingRight;
        opp.stunTimer = 10;
      }

      const groundLimit = WORLD_HEIGHT - engine.groundY - 140;
      if (this.genkidamaY >= groundLimit) {
        this.genkidamaState = "ground";
        this.genkidamaFrame = 0;

        const crackX = this.genkidamaX;
        this.genkidamaCracks.push({ x: crackX, scale: 3.5, alpha: 1.0, maxLife: 240, life: 240 });

        const gem = GroundEnergyManager.getInstance();
        const material = gem.getMaterialConfig(engine.stageTheme);
        for (let j = 0; j < 12; j++) {
          const spawnX = crackX - 100 + Math.random() * 200;
          const spawnY = WORLD_HEIGHT - engine.groundY - 10;
          gem.spawnGroundParticle(
            spawnX,
            spawnY,
            (Math.random() - 0.5) * 8.0,
            -3.0 - Math.random() * 7.0,
            'pebble',
            material.particleColor,
            100 + Math.floor(Math.random() * 80),
            Math.random() < 0.4 ? 'large' : 'medium',
            material.debrisGravity,
            material.bouncinessFactor
          );
        }
      }

    } else if (this.genkidamaState === "ground") {
      if (engine.frameCount % 4 === 0) {
        this.genkidamaFrame++;
      }

      const distToOpp = Math.sqrt(
        Math.pow(this.genkidamaX - (opp.x + opp.width / 2), 2) +
        Math.pow(this.genkidamaY - (opp.y + opp.height / 2), 2)
      );

      const radius = this.getHitboxRadius();
      if (distToOpp < radius) {
        if (this.genkidamaTrapTimer === 0) {
          this.genkidamaSquishTimer = 60;
          try {
            AudioManager.getInstance().playSFX("goku_base_genkidama_colisao");
          } catch (err) {}
        }
        this.genkidamaTrapTimer++;

        if (engine.frameCount % 5 === 0) {
          const isFacing = (owner.facingRight && !opp.facingRight) || (!owner.facingRight && opp.facingRight);
          const isBlocking = isFacing && (
            opp.state === PlayerState.BLOCKING ||
            opp.state === PlayerState.BLOCKING_CROUCH ||
            opp.state === PlayerState.BLOCKING_AIR ||
            opp.state === PlayerState.WALK_BACKWARD
          );
          const inY = Math.abs(opp.pos.y - owner.pos.y) < 600;

          if (opp.invincibleTimer <= 0 && inY) {
            const blockColor = this.baseProjectileId === "GENKIDAMA_2" ? "#ffffff" : "#60a5fa";
            const hitDamage = (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") ? 15 : 12;

            if (isBlocking) {
              opp.takeDamage(hitDamage * 0.1);
              opp.guard -= hitDamage * 0.5;
              if (engine.particleManager) {
                engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, blockColor);
              }
              opp.velocity.x = owner.facingRight ? 5 : -5;
              if (opp.guard <= 0) {
                opp.state = PlayerState.GUARD_BREAK;
                opp.stunTimer = 60;
              }
            } else {
              opp.takeDamage(hitDamage);
              opp.stunTimer = Math.max(opp.stunTimer, 20);
            }
          }
          if (engine.particleManager) {
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2 + (Math.random() - 0.5) * 50,
              opp.y + opp.height / 2 + (Math.random() - 0.5) * 50,
              false
            );
            engine.particleManager.spawn(
              "AURA",
              this.genkidamaX,
              this.genkidamaY,
              1,
              this.baseProjectileId === "GENKIDAMA_2" ? "#7e22ce" : (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") ? "#c026d3" : "#60a5fa",
              { size: 10, speed: 5 }
            );
          }
        }

        const pushDirection = owner.facingRight ? 1 : -1;
        const sphereRadius = radius * 0.5;
        let trappedTargetX = this.genkidamaX + pushDirection * sphereRadius;
        if (this.genkidamaTrapTimer > 18) trappedTargetX = this.genkidamaX;

        opp.x += (trappedTargetX - opp.width / 2 - opp.x) * 0.9;

        if (opp.y < WORLD_HEIGHT - engine.groundY - opp.height) {
          opp.y += (this.genkidamaY - opp.height / 2 - opp.y) * 0.5;
        }
        if (opp.y > WORLD_HEIGHT - engine.groundY - opp.height) {
          opp.y = WORLD_HEIGHT - engine.groundY - opp.height;
        }
        opp.isGrounded = false;
        opp.velocity.x = 0;
        opp.velocity.y = 0;
        opp.gravityDisabledTimer = 5;
        opp.state = PlayerState.HIT;
        opp.facingRight = !owner.facingRight;
        opp.stunTimer = 10;
      }

      const frames = 15;
      if (this.genkidamaFrame >= frames - 1 || owner.ultTimer > 240) {
        this.genkidamaState = "explode";
        this.genkidamaFrame = 0;
        owner.ultTimer = 0;
      }

    } else if (this.genkidamaState === "explode") {
      if (engine.frameCount % 4 === 0) {
        this.genkidamaFrame++;
      }

      if (owner.ultTimer === 1) {
        try {
          if (this.baseProjectileId === "GENKIDAMA_2") {
            AudioManager.getInstance().playSFX("vegeta_ego_hakai_explosao");
          } else {
            AudioManager.getInstance().playSFX("goku_base_genkidama_explosao");
          }
        } catch (err) {}

        const isFacing = (owner.facingRight && !opp.facingRight) || (!owner.facingRight && opp.facingRight);
        const isBlocking = isFacing && (
          opp.state === PlayerState.BLOCKING ||
          opp.state === PlayerState.BLOCKING_CROUCH ||
          opp.state === PlayerState.BLOCKING_AIR ||
          opp.state === PlayerState.WALK_BACKWARD
        );
        const inY = Math.abs(opp.pos.y - owner.pos.y) < 600;

        if (opp.invincibleTimer <= 0 && inY) {
          const finalDamage = (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5" || this.baseProjectileId === "CHAVE_GENKIDAMA_7") ? 500 : this.baseProjectileId === "GENKIDAMA_2" ? 450 : 400;
          const blockColor = (this.baseProjectileId === "GENKIDAMA_2" || this.baseProjectileId === "CHAVE_GENKIDAMA_7") ? "#ffffff" : "#60a5fa";
          const glowColor = this.baseProjectileId === "GENKIDAMA_2" ? "#a855f7" : (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") ? "#c026d3" : this.baseProjectileId === "CHAVE_GENKIDAMA_7" ? "#ffffff" : "#3b82f6";

          if (isBlocking) {
            opp.takeDamage(finalDamage * 0.1);
            opp.guard -= finalDamage * 0.5;
            if (engine.particleManager) {
              engine.particleManager.spawn("BLOCK", opp.pos.x, opp.pos.y - 50, 2, blockColor);
            }
            opp.velocity.x = owner.facingRight ? 5 : -5;
            if (opp.guard <= 0) {
              opp.state = PlayerState.GUARD_BREAK;
              opp.stunTimer = 60;
            }
          } else {
            opp.takeDamage(finalDamage);
            opp.stunTimer = Math.max(opp.stunTimer, 20);
          }
          opp.ki = Math.min(MAX_KI, opp.ki + KI_GAIN_ON_DAMAGE);
          if (engine.particleManager) {
            engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 2, 50, glowColor, { size: 35, speed: 20 });
            engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, false);
          }
          opp.stunTimer = 90;
          opp.state = PlayerState.HIT;
          opp.ataque = false;
          opp.velocity.x = owner.facingRight ? 60 : -60;
          opp.velocity.y = -30;
        }
      }

      // Precise explosion resolution
      let configKey = "GENKIDAMA_1_EXPLODE";
      const baseKey = this.baseProjectileId.toUpperCase();
      if (baseKey.includes("GENKIDAMA_3") || baseKey.includes("GENKIDAMA_5") || baseKey.includes("GENKIDAMA_7") || baseKey.includes("GENKIDAMA_8")) {
        configKey = "GENKIDAMA_3_EXPLODE";
      } else if (baseKey.includes("GENKIDAMA_2")) {
        configKey = "GENKIDAMA_2_EXPLODE";
      } else {
        configKey = "GENKIDAMA_1_EXPLODE";
      }

      const activeId = this.baseProjectileId + "_EXPLODE";
      let config = PROJECTILE_DATABASE[activeId] || ProjectileConfigKeyManager.getInstance().getProjectileConfig(activeId);
      if (!config) {
        const baseConfig = ProjectileConfigKeyManager.getInstance().getProjectileConfig(this.baseProjectileId) as any;
        if (baseConfig && baseConfig.baseProjectileId) {
          const fallbackExplodeId = baseConfig.baseProjectileId + "_EXPLODE";
          config = PROJECTILE_DATABASE[fallbackExplodeId] || ProjectileConfigKeyManager.getInstance().getProjectileConfig(fallbackExplodeId);
        }
      }
      if (!config) {
        config = PROJECTILE_DATABASE[configKey] || ProjectileConfigKeyManager.getInstance().getProjectileConfig(configKey);
      }
      if (!config) {
        config = PROJECTILE_DATABASE["GENKIDAMA_1_EXPLODE"];
      }
      let limitFrames = 15; // default fallback
      let isLoaded = false;
      if (config && config.middle && config.middle.imageUrl) {
        const actualGifCount = AnimationManager.getInstance().getGifFrameCount(config.middle.imageUrl);
        if (actualGifCount > 0) {
          limitFrames = actualGifCount;
          isLoaded = true;
        } else {
          limitFrames = config.middle.frames || 15;
        }
      }

      const safetyTimeout = 90;
      const isFinished = isLoaded 
        ? (this.genkidamaFrame >= limitFrames)
        : (this.genkidamaFrame >= limitFrames && owner.ultTimer > safetyTimeout);

      if (isFinished) {
        this.active = false;
      }
    }

    // Update gathering particles
    for (let i = this.genkidamaParticles.length - 1; i >= 0; i--) {
      const part = this.genkidamaParticles[i];
      const dx = this.genkidamaX - part.x;
      const dy = this.genkidamaY - part.y;
      const mag = Math.hypot(dx, dy);
      if (mag < 20) {
        this.genkidamaParticles.splice(i, 1);
      } else {
        part.x += (dx / mag) * part.speed;
        part.y += (dy / mag) * part.speed;
      }
    }

    // Update ground cracks
    for (let i = this.genkidamaCracks.length - 1; i >= 0; i--) {
      const crack = this.genkidamaCracks[i];
      crack.life--;
      crack.alpha = crack.life / crack.maxLife;
      if (crack.life <= 0) {
        this.genkidamaCracks.splice(i, 1);
      }
    }
  }
}
