import { Rect, PlayerState } from "../types";
import { PROJECTILE_SIZE, WORLD_HEIGHT } from "../constants";
import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { CollisionHelper } from "./CollisionHelper";

export class Projectile implements Rect {
  private static nextId: number = 1;
  private static pool: Projectile[] = [];
  public projectileId: number = 0;
  x: number;
  y: number;
  width: number = PROJECTILE_SIZE;
  height: number = PROJECTILE_SIZE;
  vx: number;
  customAnimData?: any;
  sourceAnimConfig?: any;
  effectConfigKey?: string;
  vy: number = 0;
  ownerId: "p1" | "p2";
  private _active: boolean = true;
  public _isForceDeactivated: boolean = false;
  public isShrinking: boolean = false;
  public verticalScale: number = 1.0;
  public sourcePlayer?: any;

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (!value && this.isBeam && !this._isForceDeactivated) {
      this.isShrinking = true;
      this.disabledCollision = true;
      return;
    }
    this._active = value;
  }
  color: string;
  isBeam: boolean = false;
  isUltimate: boolean = false;
  beamFamilyId?: string;
  animFrame: number = 0;
  animTimer: number = 0;
  maxLength: number = 10000;
  life?: number;
  maxAnimFrame?: number;
  freezeOnLastFrame?: boolean;
  offsetX?: number;
  offsetY?: number;

  customOffsetX?: number;
  customOffsetY?: number;
  customScale?: number;
  customSpeed?: number;
  behavior?: "STRAIGHT" | "HOMING" | "TARGET_POS" | "GROWING_STRAIGHT";
  initialFacingRight?: boolean;
  targetLocked?: boolean;
  disabledCollision?: boolean;
  isGiantBlast?: boolean;
  maxScale?: number;
  rotation?: number;
  isDeflected: boolean = false;
  resistanceFactor: number = 1.0;
  initialSpawnX?: number;
  initialSpawnY?: number;

  getTipHitbox(): Rect {
    const rotationDegrees = this.rotation ?? 0;
    const facingRight = this.initialFacingRight;
    const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const startX = facingRight ? this.x : this.x + this.width;
    const startY = this.y;

    const tipX = startX + (facingRight ? this.width * cos : -this.width * cos);
    const tipY = startY + (facingRight ? this.width * sin : -this.width * sin);

    const size = Math.max(80, this.height);
    return {
      x: tipX - size / 2,
      y: tipY - size / 2,
      width: size,
      height: size
    };
  }

  constructor() {
    // Empty constructor for pooling
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.ownerId = "p1";
    this.color = "#fff";
  }

  public static spawn(
    x: number,
    y: number,
    vx: number,
    ownerId: "p1" | "p2",
    color: string,
    isBeam: boolean = false,
    beamFamilyId?: string,
    customWidth?: number,
    customHeight?: number,
    customOffsetX?: number,
    customOffsetY?: number,
    customScale?: number,
    customSpeed?: number,
    behavior?: "STRAIGHT" | "HOMING" | "TARGET_POS" | "GROWING_STRAIGHT",
    isUltimate: boolean = false
  ): Projectile {
    let p = this.pool.pop();
    if (!p) {
      p = new Projectile();
    }
    p.init(x, y, vx, ownerId, color, isBeam, beamFamilyId, customWidth, customHeight, customOffsetX, customOffsetY, customScale, customSpeed, behavior, isUltimate);
    return p;
  }

  public release() {
    this._active = false;
    this._isForceDeactivated = false;
    this.isShrinking = false;
    this.disabledCollision = false;
    this.isDeflected = false;
    this.sourcePlayer = undefined;
    this.customAnimData = undefined;
    this.sourceAnimConfig = undefined;
    this.effectConfigKey = undefined;
    this.beamFamilyId = undefined;
    this.verticalScale = 1.0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.initialSpawnX = undefined;
    this.initialSpawnY = undefined;
    this.offsetX = undefined;
    this.offsetY = undefined;
    this.targetLocked = false;
    this["beamClashWin"] = false;
    
    if (Projectile.pool.length < 100) {
      Projectile.pool.push(this);
    }
  }

  protected init(
    x: number,
    y: number,
    vx: number,
    ownerId: "p1" | "p2",
    color: string,
    isBeam: boolean = false,
    beamFamilyId?: string,
    customWidth?: number,
    customHeight?: number,
    customOffsetX?: number,
    customOffsetY?: number,
    customScale?: number,
    customSpeed?: number,
    behavior?: "STRAIGHT" | "HOMING" | "TARGET_POS" | "GROWING_STRAIGHT",
    isUltimate: boolean = false
  ) {
    this.projectileId = Projectile.nextId++;
    this._active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = 0;
    this.ownerId = ownerId;
    this.color = color;
    this.isBeam = isBeam;
    this.isUltimate = isUltimate;
    this.beamFamilyId = beamFamilyId;
    this.isGiantBlast = !!beamFamilyId && (beamFamilyId.includes("GIGANTE") || beamFamilyId.includes("GENKIDAMA"));
    this.isShrinking = false;
    this._isForceDeactivated = false;
    this.disabledCollision = false;
    this.verticalScale = 1.0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.isDeflected = false;
    this.resistanceFactor = 1.0;

    // Lookup key configuration inside init
    let keyMiddle: any = undefined;
    let keyStart: any = undefined;
    let keyBehavior: any = undefined;
    let keyMaxScale: any = undefined;

    if (this.beamFamilyId) {
      if (this.isBeam) {
        try {
          const family = BeamConfigKeyManager.getInstance().getBeamConfig(this.beamFamilyId);
          if (family) {
            keyMiddle = family.middle;
            keyStart = family.start;
            keyBehavior = family.behavior;
            keyMaxScale = family.maxScale;
          }
        } catch (e) {
          console.warn("Error fetching beam config inside Projectile init:", e);
        }
      } else {
        try {
          const family = ProjectileConfigKeyManager.getInstance().getProjectileConfig(this.beamFamilyId);
          if (family) {
            keyMiddle = family.middle;
            keyBehavior = family.behavior;
          }
        } catch (e) {
          console.warn("Error fetching projectile config inside Projectile init:", e);
        }
      }
    }

    // Resolve width prioritizing custom param, then key values, then defaults
    let finalWidth: number | undefined = customWidth;
    if (finalWidth === undefined && keyMiddle) {
      finalWidth = this.isBeam
        ? (keyStart?.projectileWidth ?? keyMiddle?.projectileWidth)
        : keyMiddle?.projectileWidth;
    }
    if (finalWidth === undefined) {
      finalWidth = this.isBeam ? 1 : PROJECTILE_SIZE;
    }
    this.width = finalWidth;

    // Resolve height prioritizing custom param (taking absolute value), then key values, then default
    let finalHeight: number | undefined = customHeight;
    if (finalHeight === undefined && keyMiddle) {
      finalHeight = this.isBeam
        ? (keyStart?.projectileHeight ?? keyMiddle?.projectileHeight)
        : keyMiddle?.projectileHeight;
    }
    if (finalHeight === undefined) {
      finalHeight = this.isBeam ? 100 : PROJECTILE_SIZE;
    }
    this.height = Math.abs(finalHeight);

    // Resolve offsets prioritizing custom param, then key values
    let finalOffsetX: number | undefined = customOffsetX;
    if (finalOffsetX === undefined && keyMiddle) {
      finalOffsetX = this.isBeam
        ? (keyStart?.projectileOffsetX ?? keyMiddle?.projectileOffsetX)
        : keyMiddle?.projectileOffsetX;
    }
    this.customOffsetX = finalOffsetX;

    let finalOffsetY: number | undefined = customOffsetY;
    if (finalOffsetY === undefined && keyMiddle) {
      finalOffsetY = this.isBeam
        ? (keyStart?.projectileOffsetY ?? keyMiddle?.projectileOffsetY)
        : keyMiddle?.projectileOffsetY;
    }
    this.customOffsetY = finalOffsetY;

    // Resolve scale prioritizing custom param, then key values
    let finalScale: number | undefined = customScale;
    if (finalScale === undefined && keyMiddle) {
      finalScale = this.isBeam
        ? (keyStart?.projectileScale ?? keyMiddle?.projectileScale ?? keyStart?.scale ?? keyMiddle?.scale)
        : (keyMiddle?.projectileScale ?? keyMiddle?.scale);
    }
    this.customScale = finalScale;

    // Resolve behavior prioritizing key value, then custom param, then straight
    let finalBehavior = keyBehavior;
    if (!finalBehavior) {
      finalBehavior = behavior;
    }
    this.behavior = finalBehavior || "STRAIGHT";
    if (this.behavior === "GROWING_STRAIGHT") {
      this.customScale = 0;
    }

    this.initialFacingRight = this.vx > 0;

    // Resolve speed prioritizing custom param, then key values
    let finalSpeed: number | undefined = customSpeed;
    if (finalSpeed === undefined && keyMiddle) {
      finalSpeed = this.isBeam
        ? (keyStart?.projectileSpeed ?? keyMiddle?.projectileSpeed)
        : keyMiddle?.projectileSpeed;
    }
    if (finalSpeed !== undefined) {
      this.vx = this.vx > 0 ? finalSpeed : -finalSpeed;
    }

    if (keyMaxScale !== undefined) {
      this.maxScale = keyMaxScale;
    }

    if (this.isBeam) {
      this.life = 90; // All beams only last 1.5 seconds!

      const customXOff = this.customOffsetX || 0;
      const customYOff = this.customOffsetY || 0;
      if (this.initialFacingRight) {
        this.x -= customXOff;
      } else {
        this.x += customXOff;
      }
      this.y -= customYOff;
    }
  }

  update(engine?: any) {
    if (this.isBeam && !this.isShrinking) {
      if (this.life === undefined || this.life > 90) {
        this.life = 90;
      }
    }

    if (this.isBeam && this.isShrinking) {
      this.verticalScale -= 0.15; // Decrement verticalScale to flatten it
      this.disabledCollision = true;
      if (this.verticalScale <= 0) {
        this.verticalScale = 0;
        this._isForceDeactivated = true;
        this.active = false;
        return;
      }
    }

    if ((this.beamFamilyId === "ZAMASU_EFFECT" || this.beamFamilyId === "ZAMASU_CUSTOM") && engine) {
      const owner = this.sourcePlayer || (this.ownerId === "p1" ? engine.player1 : engine.player2);
      if (owner.state !== 'ATTACKING' || (!owner.comboType || typeof owner.comboType !== "string" || (!owner.comboType.startsWith("SPECIAL") && !owner.comboType.startsWith("SPECIAL_1")))) {
         this.active = false;
         return;
      }
    }
    
    if (this.life !== undefined && !this.isShrinking) {
      this.life--;
      if (this.life <= 0) {
        this.active = false;
        return;
      }
    }
    this.animTimer++;
    if (this.animTimer > 4) {
      this.animTimer = 0;
      this.animFrame++;
    }
    
    if (this.isBeam) {
      if (engine && engine.isBeamClashActive && !this.isShrinking) {
        // Position, width, and active state are entirely and authoritatively controlled by GameEngine.handleBeamClash()
        // so we bypass Projectile's internal movement/growth logic to prevent gaps/jittering or displacements!
        return;
      }
      const owner = this.isDeflected ? null : (this.sourcePlayer || (engine ? (this.ownerId === "p1" ? engine.player1 : engine.player2) : null));
      if (owner) {
        // Follow the owner's facing direction dynamically
        const ownerFacingRight = owner.facingRight;
        this.initialFacingRight = ownerFacingRight;
        if (ownerFacingRight) {
          this.vx = Math.abs(this.vx || 15);
        } else {
          this.vx = -Math.abs(this.vx || 15);
        }

        // Dynamically resolve kiOriginX and kiOriginY from configs without offset accumulation or drift
        let finalKiX = this.sourceAnimConfig?.kiOriginX;
        let finalKiY = this.sourceAnimConfig?.kiOriginY;

        if (finalKiX === undefined && this.beamFamilyId) {
          try {
            const family = BeamConfigKeyManager.getInstance().getBeamConfig(this.beamFamilyId);
            if (family) {
              finalKiX = family.start?.kiOriginX ?? family.middle?.kiOriginX;
            }
          } catch (e) {}
        }
        if (finalKiX === undefined) {
          finalKiX = owner.data.spriteConfig?.kiOriginX ?? 76;
        }

        if (finalKiY === undefined && this.beamFamilyId) {
          try {
            const family = BeamConfigKeyManager.getInstance().getBeamConfig(this.beamFamilyId);
            if (family) {
              finalKiY = family.start?.kiOriginY ?? family.middle?.kiOriginY;
            }
          } catch (e) {}
        }
        if (finalKiY === undefined) {
          finalKiY = owner.data.spriteConfig?.kiOriginY ?? 125;
        }

        // Compute the beam offset with respect to character direction, rotation, and size only once to keep point of origin 100% static
        if (this.offsetX === undefined || this.offsetY === undefined) {
          const customXOff = this.customOffsetX || 0;
          if (ownerFacingRight) {
            this.offsetX = finalKiX - customXOff;
          } else {
            this.offsetX = (owner.width - finalKiX) + customXOff;
          }

          const customYOff = this.customOffsetY || 0;
          this.offsetY = finalKiY - customYOff;
        }

        if (this.initialSpawnX === undefined || this.initialSpawnY === undefined) {
          this.initialSpawnX = owner.x + this.offsetX;
          this.initialSpawnY = owner.y + this.offsetY;
        }

        // Align the beam position relative to the static point of origin
        if (this.initialFacingRight) {
          this.x = this.initialSpawnX;
        } else {
          this.x = this.initialSpawnX - this.width;
        }
        this.y = this.initialSpawnY;
      }

      // Beam expands rapidly initially unless its tip is already off-screen to prevent CPU/GPU bloat
      let shouldGrow = !this.isShrinking && !(engine && engine.isBeamClashActive);
      if (shouldGrow && engine) {
        let rotationDegrees = this.rotation ?? this.sourceAnimConfig?.rotation ?? this.customAnimData?.rotation ?? 0;
        const facingRight = this.initialFacingRight;
        const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Calculate the camera viewport/world limits
        let limitLeft = -200;
        let limitRight = (engine.worldWidth || 2000) + 200;
        let limitTop = -200;
        let limitBottom = 1000;

        if (engine.camera && engine.camera.viewport) {
          // Use unzoomed camera coordinates to prevent premature clipping during special move zooms
          const visibleW = engine.camera.viewport.width;
          const visibleH = engine.camera.viewport.height;
          const camLeft = engine.camera.position.x - visibleW / 2;
          const camRight = engine.camera.position.x + visibleW / 2;
          const camTop = engine.camera.position.y - visibleH / 2;
          const camBottom = engine.camera.position.y + visibleH / 2;

          limitLeft = Math.min(camLeft - 100, -200);
          limitRight = Math.max(camRight + 100, (engine.worldWidth || 2000) + 200);
          limitTop = Math.min(camTop - 200, -200);
          limitBottom = Math.max(camBottom + 200, 1000);
        }

        const startX = facingRight ? this.x : this.x + this.width;
        const startY = this.y;

        const tipX = startX + (facingRight ? this.width * cos : -this.width * cos);
        const tipY = startY + (facingRight ? this.width * sin : -this.width * sin);

        const opponent = this.ownerId === "p1" ? engine.player2 : engine.player1;
        let isBlocking = false;
        if (opponent) {
          const isFacingProjectile = (this.vx > 0 && !opponent.facingRight) || (this.vx < 0 && opponent.facingRight);
          isBlocking = (
            opponent.state === PlayerState.BLOCKING ||
            opponent.state === PlayerState.BLOCKING_CROUCH ||
            opponent.state === PlayerState.BLOCKING_AIR ||
            opponent.state === PlayerState.WALK_BACKWARD
          ) && isFacingProjectile;
        }

        if (facingRight) {
          if (tipX >= limitRight || tipY <= limitTop || tipY >= limitBottom) {
            // If the opponent is not blocking or if this is the winning beam, continue advancing up to 4000px!
            const maxAllowedX = (isBlocking ? limitRight : (this["beamClashWin"] ? 4000 : 3000));
            if (tipX >= maxAllowedX) {
              shouldGrow = false;
            }
          }
        } else {
          if (tipX <= limitLeft || tipY <= limitTop || tipY >= limitBottom) {
            const minAllowedX = (isBlocking ? limitLeft : (this["beamClashWin"] ? -2000 : -1000));
            if (tipX <= minAllowedX) {
              shouldGrow = false;
            }
          }
        }
      }

      if (shouldGrow) {
        let rotationDegrees = this.rotation ?? this.sourceAnimConfig?.rotation ?? this.customAnimData?.rotation ?? 0;
        const facingRight = this.initialFacingRight;
        const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
        const cos = Math.cos(angle);
        
        let expandRate = Math.abs(this.vx) * 0.5;
        if (rotationDegrees !== 0) {
          expandRate *= Math.abs(cos);
        }
        if (this.resistanceFactor !== undefined) {
          expandRate *= this.resistanceFactor;
        }
        
        // Apply a 50% increase in growth speed if this beam won the clash!
        if (this["beamClashWin"]) {
          expandRate *= 1.50;
        }
        
        this.width += expandRate;
      }
      
      let maxWidthLimit = this["beamClashWin"] ? 4000 : 2500;
      if (this.width > maxWidthLimit) this.width = maxWidthLimit;

      if (engine && !this.isDeflected) {
        const owner = this.sourcePlayer || (this.ownerId === "p1" ? engine.player1 : engine.player2);
        if (!this.isShrinking && !this["beamClashWin"]) {
          if (
            owner.state !== PlayerState.ATTACKING &&
            owner.state !== PlayerState.JUMP_ATTACK &&
            owner.state !== PlayerState.CROUCH_ATTACK &&
            owner.state !== PlayerState.ULTIMATE &&
            owner.state !== PlayerState.ASSIST_ACTION
          ) {
            this.active = false;
          } else if (owner.state !== PlayerState.ULTIMATE && owner.comboType === "SPECIAL" && owner.attackTimer <= 10) {
            this.active = false;
          }
        }
        
        if (this.initialSpawnX !== undefined && this.initialSpawnY !== undefined) {
          if (this.initialFacingRight) {
            this.x = this.initialSpawnX;
          } else {
            this.x = this.initialSpawnX - this.width;
          }
          this.y = this.initialSpawnY;
        }

        // --- NEW: Spawns stones at ground level directly below the tip of the beam! ---
        if (!this.isShrinking) {
          let tipX = 0;
          let tipY = 0;
          let facingRight = this.initialFacingRight ?? this.vx > 0;
          try {
            const endVertices = CollisionHelper.getBeamPartVertices(this, engine, "end");
            if (endVertices && endVertices.length === 4) {
              tipX = (endVertices[0].x + endVertices[1].x + endVertices[2].x + endVertices[3].x) / 4;
              tipY = (endVertices[0].y + endVertices[1].y + endVertices[2].y + endVertices[3].y) / 4;
            } else {
              // Fallback if vertices are not found/valid
              let rotationDegrees = this.rotation ?? this.sourceAnimConfig?.rotation ?? this.customAnimData?.rotation ?? 0;
              const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              const startX = facingRight ? this.x : this.x + this.width;
              const startY = this.y;
              tipX = startX + (facingRight ? this.width * cos : -this.width * cos);
              tipY = startY + (facingRight ? this.width * sin : -this.width * sin);
            }
          } catch (e) {
            // Fallback
            let rotationDegrees = this.rotation ?? this.sourceAnimConfig?.rotation ?? this.customAnimData?.rotation ?? 0;
            const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const startX = facingRight ? this.x : this.x + this.width;
            const startY = this.y;
            tipX = startX + (facingRight ? this.width * cos : -this.width * cos);
            tipY = startY + (facingRight ? this.width * sin : -this.width * sin);
          }

          const groundY = WORLD_HEIGHT - (engine.groundY || 140);
          
          // Only spawn stones if the tip is actually touching or very close to the ground,
          // and NEVER during a beam clash!
          const isTouchingGround = Math.abs(tipY - groundY) < 30;
          const isClashing = engine.isBeamClashActive;

          if (tipX >= 0 && tipX <= (engine.worldWidth || 2000) && isTouchingGround && !isClashing) {
            const gem = GroundEnergyManager.getInstance();
            const stageTheme = engine.stageTheme || "TORNEIO_DO_PODER";
            const material = gem.getMaterialConfig(stageTheme);

            // Spawn stones/pebbles at ground level directly under the tip of the beam
            if (gem.time % 2 === 0) {
              const forceX = (Math.random() - 0.5) * 6.0;
              const forceY = -Math.random() * 5.0 - 4.5; // Upward explosive physics launch

              gem.spawnGroundParticle(
                tipX + (Math.random() - 0.5) * 30, // Random spacing around tip
                groundY - 2,
                forceX,
                forceY,
                'pebble',
                material.particleColor,
                120, // maxLife
                Math.random() < 0.25 ? 'large' : (Math.random() < 0.6 ? 'medium' : 'small'),
                material.debrisGravity,
                material.bouncinessFactor
              );
            }

            // Also spawn dust/sand/sparks occasionally at ground level under the tip of the beam
            if (gem.time % 4 === 0) {
              for (let j = 0; j < 2; j++) {
                const dustVx = (Math.random() - 0.5) * 4.0;
                const dustVy = -Math.random() * 3.0 - 1.0;
                gem.spawnGroundParticle(
                  tipX + (Math.random() - 0.5) * 40,
                  groundY - 1,
                  dustVx,
                  dustVy,
                  material.particleType || 'dust',
                  material.particleColor,
                  80,
                  'small',
                  material.debrisGravity * 0.5,
                  material.bouncinessFactor
                );
              }
            }
          }
        }
      }
      if (this.isDeflected) {
        this.x += this.vx;
        this.y += this.vy;
      }
    } else {
      if (engine && this.behavior && this.behavior !== "STRAIGHT") {
        const target = this.ownerId === "p1" ? engine.player2 : engine.player1;
        const currentSpeed = Math.abs(this.vx) !== 0 ? Math.abs(this.vx) : 15;

        if (this.behavior === "TARGET_POS" && !this.targetLocked) {
          const dx = target.x + target.width / 2 - (this.x + this.width / 2);
          const dy = target.y + target.height / 2 - (this.y + this.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            this.vx = (dx / dist) * currentSpeed;
            this.vy = (dy / dist) * currentSpeed;
          }
          this.targetLocked = true;
        } else if (this.behavior === "HOMING") {
          const dy = target.y + target.height / 2 - (this.y + this.height / 2);
          if (dy > 0) {
            this.vy += 0.5;
          } else if (dy < 0) {
            this.vy -= 0.5;
          }
          if (this.vy > currentSpeed) this.vy = currentSpeed;
          if (this.vy < -currentSpeed) this.vy = -currentSpeed;
        } else if (this.behavior === "GROWING_STRAIGHT") {
          // Aumenta escala no decorrer do tempo até Max 2.0 ou maxScale
          if (this.customScale === undefined) {
            this.customScale = 0;
          }
          const limite = this.maxScale !== undefined ? this.maxScale : 2;
          if (this.customScale < limite) {
            this.customScale += 0.15;
            if (this.customScale > limite) this.customScale = limite;
          }
        }
      }
      this.x += this.vx;
      this.y += this.vy;
    }
    
    if (this.beamFamilyId === "FECHO_7" && engine && engine.animationManager) {
      const family = BEAM_DATABASE[this.beamFamilyId];
      if (family && family.middle && family.middle.imageUrl) {
        const bitmaps = engine.animationManager.gifCache.get(family.middle.imageUrl);
        if (bitmaps && bitmaps.length > 0) {
           if (this.animFrame >= bitmaps.length) {
              this.active = false;
           }
        }
      }
    }

    if (this.beamFamilyId === "FECHO_DE_ENERGIA_10" && engine && engine.animationManager) {
      const family = ProjectileConfigKeyManager.getInstance().getProjectileConfig(this.beamFamilyId);
      if (family && family.middle && family.middle.imageUrl) {
        const bitmaps = engine.animationManager.gifCache.get(family.middle.imageUrl);
        if (bitmaps && bitmaps.length > 0) {
           if (this.animFrame >= bitmaps.length) {
              this.active = false;
           }
        }
      }
    }

    if (!this.isBeam && !this.isGiantBlast && this.beamFamilyId !== "FECHO_7" && this.beamFamilyId !== "FECHO_DE_ENERGIA_11" && this.beamFamilyId !== "FECHO_DE_ENERGIA_10" && (this.life === undefined || this.life < 1000)) {
      if (engine && engine.camera && engine.camera.viewport) {
        const visibleW = engine.camera.viewport.width / engine.camera.zoom;
        const visibleH = engine.camera.viewport.height / engine.camera.zoom;
        const camLeft = engine.camera.position.x - visibleW / 2;
        const camRight = engine.camera.position.x + visibleW / 2;
        const camTop = engine.camera.position.y - visibleH / 2;
        const camBottom = engine.camera.position.y + visibleH / 2;

        // Give a generous margin (e.g. 150 pixels) so it doesn't pop out unnaturally
        if (
          this.x + this.width < camLeft - 150 ||
          this.x > camRight + 150 ||
          this.y + this.height < camTop - 150 ||
          this.y > camBottom + 150
        ) {
          this.active = false;
        }
      } else {
        // Fallback bounds
        if (this.x < -1000 || this.x > 10000 || this.y < -1000 || this.y > 5000) {
          this.active = false;
        }
      }
    }
  }
}
