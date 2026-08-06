import { Projectile } from "./Projectile";
import { PlayerState } from "../types";
import { WORLD_HEIGHT, MAX_KI, KI_GAIN_ON_DAMAGE } from "../constants";
import { PROJECTILE_DATABASE } from "../constants/ProjectileDatabase";
import { AudioManager } from "./AudioManager";
import { VoiceManager } from "../src/engine/audio/VoiceManager";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { AnimationManager } from "./AnimationManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { CombatManager } from "./CombatManager";

export interface GenkidamaCrack {
  x: number;
  scale: number;
  alpha: number;
  maxLife: number;
  life: number;
}

export interface GenkidamaParticle {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  size: number;
  speed: number;
  angle?: number;
  radius?: number;
  orbitSpeed?: number;
  isOrbiting?: boolean;
  state?: 'gather' | 'orbit' | 'disperse';
  life?: number;
  maxLife?: number;
  alpha?: number;
}

export class Genkidama extends Projectile {
  public override isGiantBlast = true;
  public isGenkidama = true;
  public genkidamaState: "gather" | "throw" | "ground" | "explode" = "gather";
  public genkidamaScale = 0;
  public genkidamaX = 0;
  public genkidamaY = 0;
  public genkidamaFrame = 0;
  public genkidamaParticles: GenkidamaParticle[] = [];
  public genkidamaSquishTimer = 0;
  public genkidamaTrapTimer = 0;
  public genkidamaSpeed?: number;
  public baseProjectileId: string;
  public hasExploded = false;
  public hasExplodedSound = false;
  public genkidamaCracks: GenkidamaCrack[] = [];
  public dispersionEffect: any = null;
  public dispersionFixationX = 0;
  public dispersionFixationY = 0;
  public hasDispersionFixationSet = false;

  public triggerParticleDispersion() {
    let count = 0;
    for (const part of this.genkidamaParticles) {
      if (part.state !== 'disperse') {
        count++;
        if (count > 6) {
          part.alpha = 0;
          continue;
        }
        part.state = 'disperse';
        part.isOrbiting = false;
        const angle = part.angle !== undefined ? part.angle : Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        part.vx = Math.cos(angle) * speed;
        part.vy = -2.5 - Math.random() * 4;
        part.life = 25 + Math.floor(Math.random() * 15);
        part.maxLife = part.life;
        part.alpha = 0.8;
      }
    }
  }

  public getHitboxRadius(): number {
    const dynamicScale = this.genkidamaScale !== undefined ? this.genkidamaScale : 1;
    const finalFamily = ProjectileConfigKeyManager.getInstance().getProjectileConfig(this.baseProjectileId);
    if (!finalFamily) return 60 * dynamicScale;

    const gAnim = finalFamily.middle;
    const baseScale = gAnim?.scale || 2.2;
    let scaleMultiplier = baseScale * dynamicScale;

    if (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") {
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

    if (!this.active) {
      if (this.dispersionEffect) {
        this.dispersionEffect.active = false;
        this.dispersionEffect = null;
      }
      return;
    }

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
      const MAX_GENKIDAMA_PARTICLES = 18;
      if (owner.ultTimer <= GROW_TIME && owner.ultTimer % 2 === 0) {
        let part = this.genkidamaParticles.find(p => p.alpha === 0 || (p.state === 'disperse' && (p.life || 0) <= 0));
        if (!part && this.genkidamaParticles.length < MAX_GENKIDAMA_PARTICLES) {
          part = { x: 0, y: 0, size: 5, speed: 8 };
          this.genkidamaParticles.push(part);
        }

        if (part && (part.alpha === undefined || part.alpha === 0 || (part.state === 'disperse' && (part.life || 0) <= 0))) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 280 + Math.random() * 200;
          const spawnX = this.genkidamaX + Math.cos(angle) * distance;
          const spawnY = this.genkidamaY + Math.sin(angle) * distance - (isRosé || isFrieza || isBrolyIkari || isGokuBaseUlt2 ? 0 : 180);
          const orbitDir = (Math.random() < 0.5 ? 1 : -1);
          const orbitSpeed = orbitDir * (0.04 + Math.random() * 0.04);

          part.x = spawnX;
          part.y = spawnY;
          part.size = 4 + Math.random() * 6;
          part.speed = 7 + Math.random() * 4;
          part.angle = Math.atan2(spawnY - this.genkidamaY, spawnX - this.genkidamaX);
          part.radius = distance;
          part.orbitSpeed = orbitSpeed;
          part.isOrbiting = false;
          part.state = 'gather';
          part.life = 100;
          part.maxLife = 100;
          part.alpha = 1.0;
        }
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
      if (distToOpp < radius || this.genkidamaTrapTimer > 0) {
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
              'beans'
            );
          }
        }

        // Smooth movement towards fixation point (center of Genkidama) with gravity disabled
        const centerTargetX = this.genkidamaX - opp.width / 2;
        const centerTargetY = this.genkidamaY - opp.height / 2;

        opp.x += (centerTargetX - opp.x) * 0.25;
        opp.y += (centerTargetY - opp.y) * 0.25;

        opp.isGrounded = false;
        opp.velocity.x = 0;
        opp.velocity.y = 0;
        opp.gravityDisabledTimer = 10;
        opp.state = PlayerState.HIT;
        opp.facingRight = !owner.facingRight;
        opp.stunTimer = 10;
      }

      const groundLimit = WORLD_HEIGHT - engine.groundY - 140;
      if (this.genkidamaY >= groundLimit) {
        this.genkidamaState = "explode";
        this.genkidamaFrame = 0;
        owner.ultTimer = 0;
        this.triggerParticleDispersion();

        const crackX = this.genkidamaX;
        this.genkidamaCracks.push({ x: crackX, scale: 3.5, alpha: 1.0, maxLife: 240, life: 240 });

        const gem = GroundEnergyManager.getInstance();
        const material = gem.getMaterialConfig(engine.stageTheme);
        for (let j = 0; j < 5; j++) {
          const spawnX = crackX - 100 + Math.random() * 200;
          const spawnY = WORLD_HEIGHT - engine.groundY - 10;
          gem.spawnGroundParticle(
            spawnX,
            spawnY,
            (Math.random() - 0.5) * 6.0,
            -2.0 - Math.random() * 5.0,
            'pebble',
            material.particleColor,
            80 + Math.floor(Math.random() * 40),
            Math.random() < 0.4 ? 'large' : 'medium',
            material.debrisGravity,
            material.bouncinessFactor
          );
        }
      }

    } else if (this.genkidamaState === "ground") {
      this.genkidamaState = "explode";
      this.genkidamaFrame = 0;
      owner.ultTimer = 0;
    } else if (this.genkidamaState === "explode") {
      if (engine.frameCount % 4 === 0) {
        this.genkidamaFrame++;
      }

      // Capture and lock initial dispersion/fixation position (ponto de fixação)
      if (!this.hasDispersionFixationSet) {
        this.dispersionFixationX = this.genkidamaX;
        this.dispersionFixationY = this.genkidamaY;
        this.hasDispersionFixationSet = true;
      }

      // Move Genkidama downward into the ground while dissipating
      this.genkidamaY += 2.5;

      // Maintain dispersion dust effect centered at fixed attachment point in front of characters
      const currentRadius = this.getHitboxRadius();
      const genkidamaWidth = currentRadius * 2;
      const targetDustWidth = genkidamaWidth * 1.4; // >0.35 a mais que a largura da genkidama (1.4x)
      const dustImg = AnimationManager.getInstance().getGifFrame("/Assets/efeitos/poeira/genkidama.gif", 0);
      const baseDustWidth = (dustImg && dustImg.width > 0) ? dustImg.width : 140;
      const calculatedScale = Math.max(0.1, targetDustWidth / baseDustWidth);

      if (!this.dispersionEffect || !this.dispersionEffect.active) {
        this.dispersionEffect = engine.spawnVisualEffect(
          "GENKIDAMA_DISPERSION_DUST",
          this.dispersionFixationX,
          this.dispersionFixationY,
          "/Assets/efeitos/poeira/genkidama.gif",
          160,
          true,
          this.ownerId,
          calculatedScale,
          true
        );
        if (this.dispersionEffect) {
          this.dispersionEffect.layer = "FRONT";
        }
      } else {
        // O efeito NÃO PODE SE MOVER! É mantido fixo na posição de fixação até a destruição total da Genkidama.
        this.dispersionEffect.x = this.dispersionFixationX;
        this.dispersionEffect.y = this.dispersionFixationY;
        this.dispersionEffect.scale = calculatedScale;
        this.dispersionEffect.layer = "FRONT";
        this.dispersionEffect.life = 100;
      }

      if (!this.hasExplodedSound) {
        this.hasExplodedSound = true;
        try {
          if (this.baseProjectileId === "GENKIDAMA_2") {
            AudioManager.getInstance().playSFX("vegeta_ego_hakai_explosao");
          } else {
            AudioManager.getInstance().playSFX("goku_base_genkidama_explosao");
          }
        } catch (err) {}
      }

      const TOTAL_DISSIPATE_STEPS = 40;
      const progress = Math.min(1.0, this.genkidamaFrame / TOTAL_DISSIPATE_STEPS);

      const distToOpp = Math.sqrt(
        Math.pow(this.genkidamaX - (opp.x + opp.width / 2), 2) +
        Math.pow(this.genkidamaY - (opp.y + opp.height / 2), 2)
      );
      const radius = this.getHitboxRadius();
      const isOpponentTrapped = this.genkidamaTrapTimer > 0 || distToOpp < (radius * 1.5);

      // Trapping and gravity disable until destruction reaches 75% dispersion
      if (isOpponentTrapped && progress < 0.75) {
        this.genkidamaTrapTimer++;
        const centerTargetX = this.genkidamaX - opp.width / 2;
        const centerTargetY = this.genkidamaY - opp.height / 2;

        opp.x += (centerTargetX - opp.x) * 0.25;
        opp.y += (centerTargetY - opp.y) * 0.25;

        opp.isGrounded = false;
        opp.velocity.x = 0;
        opp.velocity.y = 0;
        opp.gravityDisabledTimer = 10;
        opp.state = PlayerState.HIT;
        opp.facingRight = !owner.facingRight;
        opp.stunTimer = 10;

        if (engine.frameCount % 4 === 0 && opp.invincibleTimer <= 0) {
          opp.takeDamage(6);
          if (engine.particleManager) {
            engine.particleManager.spawnHitSpark(
              opp.x + opp.width / 2 + (Math.random() - 0.5) * 40,
              opp.y + opp.height / 2 + (Math.random() - 0.5) * 40,
              'beans'
            );
          }
        }
      }

      const energyColor = this.baseProjectileId === "GENKIDAMA_2" 
        ? "#a855f7" 
        : (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") 
          ? "#c026d3" 
          : this.baseProjectileId === "CHAVE_GENKIDAMA_7" 
            ? "#ffffff" 
            : "#38bdf8";

      if (engine.frameCount % 20 === 0 && engine.particleManager) {
        engine.particleManager.spawnRisingEnergy(
          this.genkidamaX,
          this.genkidamaY,
          3,
          energyColor,
          160
        );
      }

      // At 75% dispersion phase, launch final burst & reactivate the opponent!
      if (progress >= 0.75) {
        if (!this.hasExploded) {
          this.hasExploded = true;
          this.triggerParticleDispersion();

          if (engine.particleManager) {
            engine.particleManager.spawn(
              "ENERGY",
              this.genkidamaX,
              this.genkidamaY,
              8,
              energyColor,
              { size: 22, speed: 12 }
            );
          }

          if (isOpponentTrapped && opp.invincibleTimer <= 0) {
            const finalDamage = CombatManager.getDamageByPercentage(opp, 'COMBINED_ULTIMATE', 60);
            const glowColor = this.baseProjectileId === "GENKIDAMA_2" ? "#a855f7" : (this.baseProjectileId === "GENKIDAMA_3" || this.baseProjectileId === "CHAVE_GENKIDAMA_5") ? "#c026d3" : this.baseProjectileId === "CHAVE_GENKIDAMA_7" ? "#ffffff" : "#3b82f6";

            opp.takeDamage(finalDamage);
            opp.ki = Math.min(MAX_KI, opp.ki + KI_GAIN_ON_DAMAGE);
            if (engine.particleManager) {
              engine.particleManager.spawn("ENERGY", opp.x + opp.width / 2, opp.y + opp.height / 2, 6, glowColor, { size: 24, speed: 14 });
              engine.particleManager.spawnHitSpark(opp.x + opp.width / 2, opp.y + opp.height / 2, 'beans');
            }

            // Reactivate character with restored gravity and launch velocity!
            opp.gravityDisabledTimer = 0;
            opp.velocity.x = owner.facingRight ? 60 : -60;
            opp.velocity.y = -30;
            opp.stunTimer = 90;
            opp.state = PlayerState.HIT;
            opp.ataque = false;
          }
        }

        this.active = false;
        if (this.dispersionEffect) {
          this.dispersionEffect.active = false;
          this.dispersionEffect = null;
        }
        this.triggerParticleDispersion();
      }

      // Continuously spawn rising energy particles during dispersion
      if (engine.frameCount % 6 === 0 && engine.particleManager) {
        engine.particleManager.spawnRisingEnergy(
          this.genkidamaX,
          this.genkidamaY - 10,
          1,
          energyColor,
          140
        );
      }

      // Spawn ground particles while sinking into ground
      if (engine.frameCount % 8 === 0) {
        const gem = GroundEnergyManager.getInstance();
        const material = gem.getMaterialConfig(engine.stageTheme);
        gem.spawnGroundParticle(
          this.genkidamaX + (Math.random() - 0.5) * 120,
          WORLD_HEIGHT - engine.groundY - 5,
          (Math.random() - 0.5) * 5.0,
          -1.0 - Math.random() * 3.0,
          material.particleType || 'dust',
          material.particleColor,
          50,
          'small',
          material.debrisGravity * 0.5,
          material.bouncinessFactor * 0.5
        );
      }
    }

    // Update gathering / dispersing particles
    const currentHitboxRadius = this.getHitboxRadius();

    for (let i = 0; i < this.genkidamaParticles.length; i++) {
      const part = this.genkidamaParticles[i];
      if (part.alpha === undefined || part.alpha <= 0) continue;

      if (part.state === 'disperse') {
        part.x += (part.vx || 0);
        part.y += (part.vy || 0);
        part.life = (part.life || 1) - 1;
        part.alpha = Math.max(0, (part.life || 0) / (part.maxLife || 1));
      } else {
        // Moving towards Genkidama center (gather)
        part.isOrbiting = false;
        part.state = 'gather';

        const dx = this.genkidamaX - part.x;
        const dy = this.genkidamaY - part.y;
        const mag = Math.hypot(dx, dy);

        // Distance from center where sphere surface lies
        const targetOrbitR = currentHitboxRadius * (0.85 + ((i % 5) * 0.1));

        if (mag <= targetOrbitR || mag < 20) {
          // Reached sphere surface -> REUSE particle by placing it outside again to gather
          const angle = Math.random() * Math.PI * 2;
          const distance = 250 + Math.random() * 200;
          part.x = this.genkidamaX + Math.cos(angle) * distance;
          part.y = this.genkidamaY + Math.sin(angle) * distance;
          part.angle = Math.atan2(part.y - this.genkidamaY, part.x - this.genkidamaX);
          part.radius = distance;
          part.isOrbiting = false;
          part.state = 'gather';
          part.alpha = 1.0;
        } else {
          // Travel inwards toward Genkidama center
          part.x += (dx / mag) * part.speed;
          part.y += (dy / mag) * part.speed;
        }
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

  public override release() {
    super.release();
    if (this.dispersionEffect) {
      this.dispersionEffect.active = false;
      this.dispersionEffect = null;
    }
    this.hasDispersionFixationSet = false;
    this.dispersionFixationX = 0;
    this.dispersionFixationY = 0;
    this.hasExploded = false;
    this.hasExplodedSound = false;
    this.genkidamaState = "gather";
    this.genkidamaScale = 0;
    this.genkidamaFrame = 0;
    for (const part of this.genkidamaParticles) {
      part.isOrbiting = false;
      part.state = 'gather';
      part.alpha = 0;
      part.life = 0;
    }
    this.genkidamaSquishTimer = 0;
    this.genkidamaTrapTimer = 0;
    this.genkidamaCracks = [];
  }
}
