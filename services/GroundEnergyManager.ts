import { GameEngine } from "./GameEngine";
import { Player } from "./Player";
import { Projectile } from "./Projectile";
import { PlayerState, IntroPhase } from "../types";
import { WORLD_HEIGHT } from "../constants";
import { EffectConfigKeyManager } from "./EffectConfigKeyManager";
import { AnimationManager } from "./AnimationManager";

export interface EnergyEntity {
  id: string;
  type: 'aura' | 'ki_charge' | 'transformation' | 'projectile' | 'explosion' | 'ultimate' | 'dash' | 'impact' | 'special';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  intensity: number; // 0.0 to 1.0
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  priority: number;
  state: 'birth' | 'stable' | 'fading';
  pulseSpeed?: number;
  pulseTimer?: number;
}

export interface GroundWave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  color: string;
  intensity: number;
  width: number;
  life: number;
  maxLife: number;
}

export interface GroundParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number; // For shrinking
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'pebble' | 'dust' | 'sand' | 'spark';
  rotation: number;
  rotSpeed: number;

  // DGDPS Physical Attributes
  gravity: number;
  bounciness: number;
  bounces: number;
  maxBounces: number;
  friction: number;
  isAtRest: boolean;
  restTimer: number;
  shape: 'polygon' | 'circle' | 'rect';
  vertices?: { x: number; y: number }[];
  rockIndex?: number;
}

interface MaterialConfig {
  reflection: number;      // Multiplier of reflection brightness
  absorption: number;      // Speed multiplier of light fading (absorption)
  propagation: number;     // Wave speed multiplier
  deformFactor: number;    // Amplitude multiplier of ground ripple/shimmer
  particleType: 'dust' | 'pebble' | 'sand' | 'spark';
  particleColor: string;   // Default particle base color
  bumpFactor: number;      // Height-map/emboss accent level (3D depth simulation)

  // DGDPS properties
  debrisWeight: number;    // Weight factor affecting falling gravity speed
  debrisGravity: number;   // Base vertical gravity acceleration
  bouncinessFactor: number; // Rebounds conservation coefficient (0 = land flat, 1 = super elastic)
  restDuration: number;    // Frames pebble remains resting on the ground before disappearing
  debrisShape: 'polygon' | 'circle' | 'rect';
}

const MATERIAL_DATABASE: Record<string, MaterialConfig> = {
  TORNEIO_DO_PODER: {
    reflection: 1.0,
    absorption: 0.15,
    propagation: 1.0,
    deformFactor: 1.0,
    particleType: 'pebble',
    particleColor: '#64748b',
    bumpFactor: 1.3,
    debrisWeight: 1.2,
    debrisGravity: 0.22,
    bouncinessFactor: 0.44,
    restDuration: 130,
    debrisShape: 'polygon' // sharp rock chunks
  },
  KAME_HOUSE: {
    reflection: 0.8,
    absorption: 0.35,
    propagation: 0.7,
    deformFactor: 1.4,
    particleType: 'sand',
    particleColor: '#fef08a',
    bumpFactor: 0.6,
    debrisWeight: 0.75,
    debrisGravity: 0.16,
    bouncinessFactor: 0.18, // soft sand dampens bounce
    restDuration: 70,
    debrisShape: 'circle' // fine sandy pebbles
  },
  INSIDE_BUU: {
    reflection: 1.4,
    absorption: 0.10,
    propagation: 1.3,
    deformFactor: 1.8,
    particleType: 'dust',
    particleColor: '#f472b6',
    bumpFactor: 1.5,
    debrisWeight: 0.9,
    debrisGravity: 0.14,
    bouncinessFactor: 0.58, // highly elastic organic pulp
    restDuration: 110,
    debrisShape: 'polygon'
  },
  DESERTO: {
    reflection: 0.9,
    absorption: 0.25,
    propagation: 0.9,
    deformFactor: 1.1,
    particleType: 'sand',
    particleColor: '#f59e0b',
    bumpFactor: 1.1,
    debrisWeight: 0.85,
    debrisGravity: 0.18,
    bouncinessFactor: 0.25,
    restDuration: 90,
    debrisShape: 'circle'
  },
  ESPACO: {
    reflection: 1.6,
    absorption: 0.05,
    propagation: 1.2,
    deformFactor: 0.5,
    particleType: 'spark',
    particleColor: '#38bdf8',
    bumpFactor: 1.4,
    debrisWeight: 0.45, // very light gravity in vacuum
    debrisGravity: 0.08,
    bouncinessFactor: 0.65, // zero-G bouncy rebound
    restDuration: 170,
    debrisShape: 'polygon'
  },
  ALIEN: {
    reflection: 1.3,
    absorption: 0.12,
    propagation: 1.1,
    deformFactor: 0.9,
    particleType: 'spark',
    particleColor: '#8b5cf6',
    bumpFactor: 1.2,
    debrisWeight: 1.0,
    debrisGravity: 0.20,
    bouncinessFactor: 0.48,
    restDuration: 115,
    debrisShape: 'polygon'
  },
  ARENA: {
    reflection: 1.1,
    absorption: 0.18,
    propagation: 1.0,
    deformFactor: 0.4,
    particleType: 'dust',
    particleColor: '#94a3b8',
    bumpFactor: 0.5,
    debrisWeight: 1.0,
    debrisGravity: 0.20,
    bouncinessFactor: 0.38,
    restDuration: 100,
    debrisShape: 'rect' // brick/tile debris
  },
  NIGHT: {
    reflection: 0.9,
    absorption: 0.22,
    propagation: 0.8,
    deformFactor: 0.9,
    particleType: 'pebble',
    particleColor: '#475569',
    bumpFactor: 1.0,
    debrisWeight: 1.25,
    debrisGravity: 0.24,
    bouncinessFactor: 0.35,
    restDuration: 140,
    debrisShape: 'polygon'
  }
};

export class GroundEnergyManager {
  private static instance: GroundEnergyManager | null = null;

  public engine: GameEngine | null = null;
  public entities: Map<string, EnergyEntity> = new Map();
  public waves: GroundWave[] = [];
  public particles: GroundParticle[] = [];
  
  private maxActiveEntities: number = 8; // Mobile limits
  private particleId: number = 0;
  public time: number = 0;
  private rockImages: HTMLImageElement[] = [];

  private constructor() {
    this.rockImages = [];
    for (let i = 1; i <= 6; i++) {
      const img = new Image();
      img.src = `/Assets/efeitos/chao/pedras/${i}.png`;
      this.rockImages.push(img);
    }
  }

  public static getInstance(): GroundEnergyManager {
    if (!GroundEnergyManager.instance) {
      GroundEnergyManager.instance = new GroundEnergyManager();
    }
    return GroundEnergyManager.instance;
  }

  /**
   * Helper to fetch current active material setting based on stageTheme
   */
  public getMaterialConfig(stageTheme: string): MaterialConfig {
    const theme = (stageTheme || "").toUpperCase().trim();
    if (MATERIAL_DATABASE[theme]) {
      return MATERIAL_DATABASE[theme];
    }
    return {
      reflection: 1.0,
      absorption: 0.2,
      propagation: 1.0,
      deformFactor: 1.0,
      particleType: 'dust',
      particleColor: '#94a3b8',
      bumpFactor: 1.0,
      debrisWeight: 1.0,
      debrisGravity: 0.20,
      bouncinessFactor: 0.35,
      restDuration: 90,
      debrisShape: 'polygon'
    };
  }

  /**
   * Main update cycle.
   * Auto-detects energy sources in the game and resolves entities, waves and particles frames.
   */
  public update(engine: GameEngine) {
    this.engine = engine;
    this.time += 1;

    // 1. AUTOMATIC CREATION & REGISTRATION
    this.autoDetectSources(engine);

    // 2. UPDATE ENERGY ENTITIES
    for (const [id, entity] of this.entities.entries()) {
      // Advance life
      entity.life--;
      if (entity.life <= 0) {
        this.entities.delete(id);
        continue;
      }

      // Update state
      const age = entity.maxLife - entity.life;
      if (age < 15) {
        entity.state = 'birth';
        entity.intensity = Math.min(1.0, age / 15);
      } else if (entity.life < 20) {
        entity.state = 'fading';
        entity.intensity = Math.max(0.0, entity.life / 20);
      } else {
        entity.state = 'stable';
        entity.intensity = 1.0;
      }

      // Update position according to motion constants
      entity.x += entity.vx;
      entity.y += entity.vy;

      // Handle pulsing radius
      if (entity.pulseSpeed) {
        entity.pulseTimer = (entity.pulseTimer || 0) + entity.pulseSpeed;
        const pulse = 1 + Math.sin(entity.pulseTimer) * 0.15;
        entity.radius = Math.min(entity.maxRadius, entity.radius * pulse);
      } else {
        // Expand to max radius over time
        entity.radius += (entity.maxRadius - entity.radius) * 0.08;
      }
    }

    // 3. UPDATE RIPPLE WAVES
    const material = this.getMaterialConfig(engine.stageTheme);
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.life--;
      if (wave.life <= 0) {
        this.waves.splice(i, 1);
        continue;
      }

      // Waves expand
      wave.radius += wave.speed * material.propagation;
      
      // Calculate smooth fade
      const fadeRatio = wave.life / wave.maxLife;
      wave.intensity = fadeRatio;

      // Generate dust or sparks along the ground wave
      if (Math.random() < 0.25 && this.particles.length < 60) {
        const angle = Math.random() * Math.PI * 2;
        const px = wave.x + Math.cos(angle) * wave.radius;
        const groundY = WORLD_HEIGHT - engine.groundY;
        this.spawnGroundParticle(
          px,
          groundY - 3 + Math.random() * 6,
          Math.cos(angle) * (Math.random() * 2.0 + 0.5),
          -Math.random() * 2.0 - 0.5,
          material.particleType,
          wave.color,
          80,
          'small',
          material.debrisGravity,
          material.bouncinessFactor
        );
      }
    }

    // 4. UPDATE GROUND PARTICLES (DGDPS 2D Physics Engine Loop)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.life <= 0) continue; // Skip dead pooled particles

      if (p.isAtRest) {
        // Lingering resting tick count
        p.restTimer--;
        if (p.restTimer <= 0) {
          // Fade and fade-scale shrink both at once (Filtro Suave Sem Cortes)
          p.alpha *= 0.91;
          p.size *= 0.89;
          if (p.alpha < 0.04 || p.size < 0.5) {
            p.life = 0; // Completely free pool slot
            p.alpha = 0;
          }
        }
      } else {
        // Flight physics processing
        p.life--;
        p.vy += p.gravity * material.debrisWeight; // Gravity with material mass weighting
        p.vx *= 0.985; // Air drag/friction
        p.rotation += p.rotSpeed;

        p.x += p.vx;
        p.y += p.vy;

        // Collision with Ground Detection
        const groundY = WORLD_HEIGHT - engine.groundY;
        if (p.y >= groundY) {
          p.y = groundY; // Keep grounded exactly

          if (p.type === 'pebble' || p.type === 'sand') {
            // Elastic collision bounce reaction
            p.vy = -p.vy * p.bounciness * material.bouncinessFactor;
            p.vx *= p.friction; // Ground damping slide friction
            p.rotSpeed = (Math.random() - 0.5) * 16 * (1 - p.bounces / p.maxBounces);
            p.bounces++;

            // ADVANCED IMPACT SPARK EMISSION (REQUISITO AVANÇADO)
            // Emits 1 or 2 fast micro-particles of dust when pebble hits the ground
            if (Math.random() < 0.40 && this.particles.length < 150) {
              const microColor = p.color;
              this.spawnGroundParticle(
                p.x,
                groundY - 1,
                (Math.random() - 0.5) * 2.0,
                -Math.random() * 1.5 - 0.8,
                'dust',
                microColor,
                25
              );
            }

            // Exceed bounces threshold or velocity drops heavily
            if (p.bounces >= p.maxBounces || Math.abs(p.vy) < 0.7) {
              p.isAtRest = true;
              p.restTimer = material.restDuration + Math.floor((Math.random() - 0.5) * 40); // randomize resting frames
              p.vy = 0;
              p.vx = 0;
              p.rotSpeed = 0;
            }
          } else {
            // Dissipate steam/sparks instantly upon ground impact
            p.isAtRest = true;
            p.restTimer = 4;
            p.vy = 0;
            p.vx = 0;
          }
        }
      }

      // Continuous dynamic reaction to active character energy fields (Wind blasts)
      if (!p.isAtRest && p.type === 'pebble') {
        this.entities.forEach((entity) => {
          const dx = p.x - entity.x;
          const dy = p.y - (WORLD_HEIGHT - engine.groundY);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < entity.radius && dist > 1) {
            const force = (1 - dist / entity.radius) * entity.intensity * 0.35;
            p.vx += (dx / dist) * force;
            p.vy -= force * 0.28;
          }
        });
      }
    }
  }

  /**
   * Scans players and engine state to automatically register/renew Ground Energy Entities
   */
  private autoDetectSources(engine: GameEngine) {
    const groundY = WORLD_HEIGHT - engine.groundY;
    const allPlayers = [...engine.p1Team, ...engine.p2Team].filter(Boolean) as Player[];

    // Limit tracking to active/visible players
    const activePlayers = allPlayers.filter(p => p.state !== PlayerState.STANDBY);

    activePlayers.forEach((p) => {
      const isP1 = p === engine.player1 || engine.p1Team.includes(p);
      const entityId = `player_${isP1 ? 'p1' : 'p2'}_${p.data.id}`;
      const charColor = this.getCharacterEnergyColor(p.data.id, p.state);

      if (p.state !== PlayerState.TRANSFORM && p.state !== PlayerState.SPARKING) {
        (p as any).groundBurstTriggered = false;
      }

      // Check current action states to map the corresponding Ground Energy Entity
      let hasEnergy = false;
      let radius = 120;
      let maxRadius = 150;
      let energyType: EnergyEntity['type'] = 'aura';
      let importance = 1;

      const material = this.getMaterialConfig(engine.stageTheme);

      if (p.state === PlayerState.CHARGING || p.state === PlayerState.CHARGE_START || p.state === PlayerState.CHARGE_END) {
        hasEnergy = true;
        energyType = 'ki_charge';
        radius = 160;
        maxRadius = 220;
        importance = 3;

        // Spawn beautiful physical debris throwing upward from under feet
        if (p.state === PlayerState.CHARGING && this.time % 6 === 0) {
          const forceX = (Math.random() - 0.5) * 4.0;
          const forceY = -Math.random() * 5.0 - 2.0; // Medium rising speed
          
          this.spawnGroundParticle(
            p.x + p.width / 2 + (Math.random() - 0.5) * p.width * 0.8,
            groundY - 1,
            forceX,
            forceY,
            'pebble',
            material.particleColor,
            110,
            'small',
            material.debrisGravity,
            material.bouncinessFactor
          );
        }
      } 
      else if (p.state === PlayerState.TRANSFORM || p.state === PlayerState.SPARKING) {
        hasEnergy = true;
        energyType = 'transformation';
        radius = 280;
        maxRadius = 350;
        importance = 4;

        // Secure cooldown shield: Ensure ground bursts of rocks and severe ripples cannot be spammed in rapid loops.
        // This stops persistent automatic stone-recreation under characters like Broly Ikari.
        const lastBurstTime = (p as any).lastGroundBurstTime || 0;
        if (this.time - lastBurstTime > 300) {
          (p as any).lastGroundBurstTime = this.time;
          (p as any).groundBurstTriggered = true;
          this.triggerWave(p.x + p.width/2, groundY, 15, 300, charColor, 35, 15);

          // Burst high speed medium/large stones upwards!
          for (let k = 0; k < 4; k++) {
            const forceX = (Math.random() - 0.5) * 8.0;
            const forceY = -Math.random() * 7.5 - 4.0; // Severe upward explosive launch

            this.spawnGroundParticle(
              p.x + p.width / 2 + (Math.random() - 0.5) * p.width * 1.6,
              groundY - 2,
              forceX,
              forceY,
              'pebble',
              material.particleColor,
              160,
              Math.random() < 0.3 ? 'large' : 'medium',
              material.debrisGravity,
              material.bouncinessFactor
            );
          }
        }
      }
      else if (p.state === PlayerState.ULTIMATE || p.state === PlayerState.ULTIMATE_2) {
        hasEnergy = true;
        energyType = 'ultimate';
        radius = 380;
        maxRadius = 450;
        importance = 5;

        // Massive trembling ripple waves
        if (p.ultTimer && p.ultTimer % 18 === 0) {
          this.triggerWave(p.x + p.width/2, groundY, 12, 500, charColor, 50, 60);

          // Massive floor craters launcher
          for (let k = 0; k < 6; k++) {
            const forceX = (Math.random() - 0.5) * 11.0;
            const forceY = -Math.random() * 9.0 - 5.0; // Extreme peaks height

            this.spawnGroundParticle(
              p.x + p.width / 2 + (Math.random() - 0.5) * p.width * 2.5,
              groundY - 2,
              forceX,
              forceY,
              'pebble',
              material.particleColor,
              230,
              Math.random() < 0.55 ? 'large' : 'medium',
              material.debrisGravity,
              material.bouncinessFactor
            );
          }
        }
      }
      else if (p.superDashActive || p.state === PlayerState.SUPER_DASH) {
        hasEnergy = true;
        energyType = 'dash';
        radius = 90;
        maxRadius = 110;
        importance = 2;

        // S-Dash floor scraping trail pebbles
        if (p.isGrounded && this.time % 3 === 0) {
          this.triggerWave(p.x + p.width/2, groundY, 3, 70, charColor, 20, 10);

          this.spawnGroundParticle(
            p.x + p.width / 2 + (Math.random() - 0.5) * p.width,
            groundY - 1,
            -p.velocity.x * 0.4 + (Math.random() - 0.5) * 2,
            -Math.random() * 3.0 - 1.0,
            'pebble',
            material.particleColor,
            80,
            'small',
            material.debrisGravity,
            material.bouncinessFactor
          );
        }
      }
      else if (p.brokenGroundAlpha > 0) {
        hasEnergy = true;
        energyType = 'impact';
        radius = 160;
        maxRadius = 160;
        importance = 2;
      }

      if (hasEnergy) {
        // Register or renew
        const box = p.hitbox;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const chosenColor = (energyType === 'impact') ? '#ea580c' : charColor;

        const existing = this.entities.get(entityId);
        if (existing) {
          existing.x = centerX;
          existing.y = centerY;
          existing.life = 30; // reset decay window
          existing.maxRadius = maxRadius;
          existing.color = chosenColor;
          existing.priority = importance;
        } else {
          this.entities.set(entityId, {
            id: entityId,
            type: energyType,
            x: centerX,
            y: centerY,
            vx: 0,
            vy: 0,
            color: chosenColor,
            intensity: 0.1,
            radius: 40,
            maxRadius: maxRadius,
            life: 30,
            maxLife: 30,
            priority: importance,
            state: 'birth'
          });
        }
      } else {
        // Suave fading if state ended - reduce life of existing
        const existing = this.entities.get(entityId);
        if (existing && existing.state !== 'fading') {
          existing.maxLife = 20;
          existing.life = Math.min(existing.life, 20); // enforce fade decay
        }
      }
    });

    // Projectiles auto-registration
    engine.projectiles.forEach((proj, idx) => {
      const isBeam = !!proj.beamFamilyId;
      if (isBeam) return; // Remove energy effects from beam projectiles

      const projId = `projectile_${proj.ownerId}_${idx}`;
      const pColor = proj.color || proj.customAnimData?.projectileColor || this.getProjectileColor(proj);

      const verticalProjectionY = groundY;

      // Project projectiles onto the ground
      this.entities.set(projId, {
        id: projId,
        type: 'projectile',
        x: proj.x + proj.width / 2,
        y: verticalProjectionY,
        vx: 0,
        vy: 0,
        color: pColor,
        intensity: 0.8,
        radius: 80,
        maxRadius: 120,
        life: 5, // very short life, must be renewed every frame
        maxLife: 5,
        priority: 1,
        state: 'stable'
      });

      // Special wave burst if projectile hits or flies low
      if (proj.y + proj.height >= groundY - 40 && this.time % 10 === 0) {
        this.triggerWave(proj.x + proj.width / 2, groundY, 4, 60, pColor, 15, 10);
      }
    });

    // Special effects auto-registration (Explosions/Ultimates on the floor)
    engine.visualEffects.forEach((fx, idx) => {
      if (!fx.active) return;
      const fxId = `vfx_${idx}`;
      
      const isGiantExplosion = fx.type === 'KAME_GENKI_COLLISION' || fx.imageUrl?.includes("COLLISION") || fx.type === 'DRAGON_RUSH_START_EFFECT';
      const isGroundImpact = fx.type === 'GROUND_DESTROYED' || fx.imageUrl?.includes("CH%C3%83O");

      if (isGiantExplosion || isGroundImpact) {
        const energyColor = isGiantExplosion ? '#f97316' : '#ea580c';
        
        this.entities.set(fxId, {
          id: fxId,
          type: 'explosion',
          x: fx.x,
          y: groundY,
          vx: 0,
          vy: 0,
          color: energyColor,
          intensity: 1.0,
          radius: isGiantExplosion ? 380 : 150,
          maxRadius: isGiantExplosion ? 480 : 200,
          life: 8,
          maxLife: 8,
          priority: isGiantExplosion ? 5 : 3,
          state: 'stable'
        });

        // Trigger waves for explosive expansion
        if (isGiantExplosion && this.time % 6 === 0) {
          this.triggerWave(fx.x, groundY, 14, 520, '#ffffff', 40, 40);
        }
      }
    });

    // Beam Clash auto-registration for ground waves and vibration (identical to Dragon Rush startup wave)
    if (engine.isBeamClashActive) {
      let cx = (engine as any).beamClashVisualX;
      if (cx === undefined) {
        const p1 = engine.player1;
        const p2 = engine.player2;
        cx = (p1.x + p2.x) / 2;
      }
      if (cx !== undefined) {
        const clashId = "beam_clash_ground_energy";
        
        this.entities.set(clashId, {
          id: clashId,
          type: 'explosion',
          x: cx,
          y: groundY,
          vx: 0,
          vy: 0,
          color: '#ffffff',
          intensity: 1.0,
          radius: 380,
          maxRadius: 480,
          life: 8,
          maxLife: 8,
          priority: 5,
          state: 'stable'
        });

        if (this.time % 6 === 0) {
          this.triggerWave(cx, groundY, 14, 520, '#ffffff', 40, 40);
        }
      }
    }

    // Mobile Culling: Sort by priority and cap to preserve high frames rates
    if (this.entities.size > this.maxActiveEntities) {
      const sorted = Array.from(this.entities.values()).sort((a, b) => b.priority - a.priority);
      this.entities.clear();
      for (let i = 0; i < this.maxActiveEntities; i++) {
        this.entities.set(sorted[i].id, sorted[i]);
      }
    }
  }

  /**
   * Spawns a physical ground particulate (pebble, dust, sand particle)
   * High performance pooling: Overwrites dead ones when exceeding max limits (150 particles count cap)
   */
  public spawnGroundParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: GroundParticle['type'],
    color: string,
    maxLife: number,
    customType?: 'small' | 'medium' | 'large',
    specificGravity?: number,
    specificBounciness?: number
  ) {
    if (type === 'dust') return; // Disabled dust particles per user request

    if (type === 'pebble') {
      let activePebblesCount = 0;
      const activePebbles: GroundParticle[] = [];
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.life > 0 && p.type === 'pebble') {
          activePebbles.push(p);
          activePebblesCount++;
        }
      }
      if (activePebblesCount >= 10) {
        // Enforce max 10 pebbles limit. Destroy oldest ones
        activePebbles.sort((a, b) => a.id - b.id);
        const toDestroyCount = activePebblesCount - 9;
        for (let k = 0; k < toDestroyCount; k++) {
          activePebbles[k].life = 0;
          activePebbles[k].alpha = 0;
        }
      }
    }

    const maxActiveParticles = 300;
    let reusedIndex = -1;

    // Fast pool slot recycle routing: always look for dead slots first to minimize array footprint
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].life <= 0) {
        reusedIndex = i;
        break;
      }
    }

    if (reusedIndex === -1 && this.particles.length >= maxActiveParticles) {
      // If all slots are alive, replace the one with the lowest life remaining
      let lowestLife = Infinity;
      let lowestLifeIndex = 0;
      for (let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].life < lowestLife) {
          lowestLife = this.particles[i].life;
          lowestLifeIndex = i;
        }
      }
      reusedIndex = lowestLifeIndex;
    }

    this.particleId++;

    // Size determinations
    let size = 3;
    if (type === 'pebble') {
      let baseSize = 3;
      if (customType === 'large') {
        baseSize = Math.random() * 5 + 10; // 10 to 15px
      } else if (customType === 'medium') {
        baseSize = Math.random() * 4 + 6; // 6 to 10px
      } else {
        baseSize = Math.random() * 3 + 3; // 3 to 6px
      }
      // "podem ter tamanhos diferentes min tamanho atual Max 2 vezes e meio o tamanho atual"
      // Size varies randomly between original current size (1.0x) and 2.5x times the current size (2.5x)
      const sizeMultiplier = 1.0 + Math.random() * 1.5; // multiplier from 1.0 to 2.5
      size = baseSize * sizeMultiplier;
    } else if (type === 'sand') {
      size = Math.random() * 2 + 1.5;
    } else if (type === 'spark') {
      size = Math.random() * 4 + 2;
    } else {
      size = Math.random() * 4 + 3; // dust
    }

    // "devem poder ir em uma altura aleatória com limite"
    // Calculate a dynamic velocity based on a random peak height with a physical screen safety limit
    if (type === 'pebble') {
      const gEff = (specificGravity ?? 0.20) * 1.25; // effective gravity in DGDPS matching material weight multiplier
      const originalVy = Math.abs(vy || -3.0);
      
      // Calculate the original peak height in pixels: H = vy^2 / (2 * g)
      const basePeakHeight = (originalVy * originalVy) / (2 * gEff);
      
      // Set random target heights ranging up to 2.5x times the original launch peak heights, cap the max height limit at 420px
      const maxHeightLimit = Math.min(420, basePeakHeight * 2.5);
      const minHeightLimit = Math.max(10, basePeakHeight * 0.4);
      const targetHeight = minHeightLimit + Math.random() * (maxHeightLimit - minHeightLimit);
      
      // Convert target height back to a beautiful upward starting velocity: vy = -sqrt(2 * g * H)
      vy = -Math.sqrt(2 * gEff * targetHeight);
    }

    // Determine physics shape config
    let shape: GroundParticle['shape'] = 'rect';
    if (type === 'pebble') {
      shape = 'polygon';
    } else if (type === 'sand' || type === 'spark') {
      shape = 'circle';
    }

    // Dynamic Multi-Vertex Convex geometry compiler
    let vertices: GroundParticle['vertices'] = undefined;
    if (shape === 'polygon') {
      const numPoints = Math.floor(Math.random() * 3) + 4; // 4 to 6 sided polygonal stones
      vertices = [];
      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        const radius = (0.6 + Math.random() * 0.4) * (size / 2);
        vertices.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
    }

    const newParticle: GroundParticle = {
      id: this.particleId,
      x,
      y,
      vx,
      vy,
      size,
      baseSize: size,
      color,
      alpha: 1.0,
      life: maxLife,
      maxLife,
      type,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 22,
      
      // DGDPS Attributes
      gravity: specificGravity ?? 0.20,
      bounciness: specificBounciness ?? 0.35,
      bounces: 0,
      maxBounces: type === 'pebble' ? 3 : 1,
      friction: 0.75, // Roll slidings loss speed
      isAtRest: false,
      restTimer: 0,
      shape,
      vertices,
      rockIndex: type === 'pebble' ? Math.floor(Math.random() * 6) : undefined
    };

    if (reusedIndex !== -1) {
      this.particles[reusedIndex] = newParticle;
    } else {
      this.particles.push(newParticle);
    }
  }

  /**
   * Triggers a shockwave ripple propagating on the ground
   */
  public triggerWave(
    x: number,
    y: number,
    speed: number,
    maxRadius: number,
    color: string,
    width: number = 20,
    maxLife: number = 40
  ) {
    if (this.waves.length > 0) {
      return; // Only create another impact wave once the existing one is destroyed!
    }
    const id = `wave_${this.time}_${Math.random()}`;
    this.waves.push({
      id,
      x,
      y,
      radius: 5,
      maxRadius,
      speed,
      color,
      intensity: 1.0,
      width,
      life: maxLife,
      maxLife
    });
  }

  /**
   * Translates character ID to appropriate energy aura color for dynamic reflection
   */
  private getCharacterEnergyColor(charId: string, state?: PlayerState): string {
    const sId = (charId || "").toLowerCase();
    
    // Check Kaioken vs default Goku
    if (sId.includes("goku_base") && state === PlayerState.CHARGING) {
      return '#3b82f6'; // Mystic blue glow base
    }

    if (sId.includes("ssj4")) return '#f43f5e'; // Reddish wild energy
    if (sId.includes("ssj")) return '#eab308'; // Classic Golden SSJ
    if (sId.includes("blue")) return '#06b6d4'; // Saiyan Blue Cyan
    if (sId.includes("ego")) return '#a855f7'; // Ultra Ego purple
    if (sId.includes("rose") || sId.includes("black")) return '#d946ef'; // Magenta fuchsia Rose
    if (sId.includes("mui")) return '#f8fafc'; // Divine Ultra Instinct Silver/White
    if (sId.includes("broly") || sId.includes("ikari")) return '#22c55e'; // Iconic green
    if (sId.includes("frieza")) return '#c084fc'; // Purple Emperor
    if (sId.includes("buu")) return '#f472b6'; // Buu Pink
    if (sId.includes("piccolo")) return '#4ade80'; // Namekian green
    if (sId.includes("kuririn") || sId.includes("krillin")) return '#fca5a5'; // Light Orange
    
    return '#60a5fa'; // Standard blue energy
  }

  /**
   * Translates projectile family to color
   */
  private getProjectileColor(proj: Projectile): string {
    const family = (proj.beamFamilyId || "").toUpperCase();
    if (family.includes("BEAM_SSJ") || family.includes("BEAM_2")) return '#fbbf24'; // Golden
    if (family.includes("SUPER_ESPECIAL") || family.includes("BEAM")) return '#38bdf8'; // Blue
    if (family.includes("FECHO_5") || family.includes("fechosenergia_5") || family.includes("ZAMASU")) return '#d946ef'; // Magenta-pink
    return '#60a5fa';
  }

  /**
   * Renders the complete Ground Energy Reflection, Emboss Normal map Depth, Sine Waves
   * and Particulates directly on the unique ground layer sprite.
   */
  public drawGround(
    ctx: CanvasRenderingContext2D,
    groundSprite: HTMLImageElement,
    bgX: number,
    bgY: number,
    bgW: number,
    bgH: number,
    stageInfo: any
  ) {
    const groundY = WORLD_HEIGHT - stageInfo.groundY;
    const material = this.getMaterialConfig(stageInfo.id);

    // Filter deactivated or completely out of bound entities to preserve performances (Mobile Culling)
    const activeWaves = this.waves.filter(wave => wave.intensity > 0.05);
    const activeEntities = Array.from(this.entities.values());

    // 1. WAVE & DEFORMATION SYSTEM (SINUSOIDAL SLICING)
    // Slices ground image into horizontal bands to apply heat distortion and wave amplitude (highly optimized for 60 FPS)
    const distortionEntities = activeEntities.filter(
      (e) =>
        e.type === 'ki_charge' ||
        e.type === 'ultimate' ||
        e.type === 'transformation'
    );
    const hasDistortion = activeWaves.length > 0 || distortionEntities.length > 0;
    
    ctx.save();

    if (hasDistortion && groundSprite.complete && groundSprite.naturalWidth !== 0) {
      const sliceHeight = 64; // Massive reduction in drawImage calls (reduced from 24 to 64)
      const numSlices = Math.ceil(bgH / sliceHeight);

      for (let i = 0; i < numSlices; i++) {
        const sy = (i * sliceHeight * groundSprite.naturalHeight) / bgH;
        const sh = (sliceHeight * groundSprite.naturalHeight) / bgH;
        
        const dy = bgY + i * sliceHeight;
        const dh = sliceHeight;

        // Calculate dynamic horizontal wave displacement for this strip
        const absY = dy;
        let dX = 0;

        // Apply heat shimmers for active static energies (uses highly optimized filtered set)
        distortionEntities.forEach((entity) => {
          const distance = Math.abs(absY - groundY);
          if (distance < 200) {
            const shimmerFactor = (1 - distance / 200) * entity.intensity * material.deformFactor;
            // Heat wavy vibration
            dX += Math.sin(absY * 0.12 + this.time * 0.4) * (entity.type === 'ultimate' ? 6 : 2.5) * shimmerFactor;
          }
        });

        // Apply shockwave expanding deformation math
        activeWaves.forEach((wave) => {
          const dyDist = Math.abs(absY - wave.y);
          const dyRadiusDist = Math.abs(dyDist - wave.radius);
          if (dyRadiusDist < wave.width) {
            const ratio = 1 - dyRadiusDist / wave.width;
            dX += Math.sin((dyDist - wave.radius) * 0.15) * (wave.speed * 0.8) * ratio * wave.intensity * material.deformFactor;
          }
        });

        // Avoid infinite offset leaks
        const maxDisp = 35;
        if (groundSprite.complete && groundSprite.naturalWidth > 0 && groundSprite.naturalHeight > 0 && sh > 0 && dh > 0 && bgW > 0) {
          if (Math.abs(dX) > 0.1) {
            dX = Math.max(-maxDisp, Math.min(maxDisp, dX));
            ctx.drawImage(
              groundSprite,
              0,
              sy,
              groundSprite.naturalWidth,
              sh,
              bgX + dX,
              dy,
              bgW,
              dh
            );
          } else {
            ctx.drawImage(
              groundSprite,
              0,
              sy,
              groundSprite.naturalWidth,
              sh,
              bgX,
              dy,
              bgW,
              dh
            );
          }
        }
      }
    } else if (groundSprite.complete && groundSprite.naturalWidth > 0 && groundSprite.naturalHeight > 0) {
      // Draw single fast sprite if no distortions are active
      ctx.drawImage(groundSprite, bgX, bgY, bgW, bgH);
    }

    // 2. DYNAMIC REFLECTION & HERANÇA DE COR
    // Mask lighting reflections strictly within the drawn non-transparent pixels of the ground
    if (activeEntities.length > 0 || activeWaves.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";

      // Character circular light system removed to comply with "remover completamente sistema de luz criado em personagens"

      // Draw expanding shockwave illumination
      activeWaves.forEach((wave) => {
        const hex = wave.color;
        let r = 255, g = 255, b = 255;
        if (hex && hex.startsWith('#')) {
          const c = hex.substring(1);
          r = parseInt(c.substring(0, 2), 16);
          g = parseInt(c.substring(2, 4), 16);
          b = parseInt(c.substring(4, 6), 16);
        }

        const gradient = ctx.createRadialGradient(
          wave.x,
          groundY,
          Math.max(0, wave.radius - wave.width),
          wave.x,
          groundY,
          wave.radius + wave.width
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${wave.intensity * 0.4})`);
        gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${wave.intensity * 0.45})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(wave.x, groundY, Math.max(0, wave.radius + wave.width), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // 3. GROUND NORMAL SYSTEM (EMBOSSED 3D DEPTH SIMULATION) - Removed to comply with "Remova sistema de luz dinâmica"

    ctx.restore(); // restore global ctx
  }

  /**
   * Performance-optimized fallback ground texture and reflection rendering
   */
  public drawFallbackGround(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    worldWidth: number,
    groundHeight: number
  ) {
    ctx.save();
    
    // Draw flat ground color
    ctx.fillStyle = "#334155"; // Slate
    ctx.fillRect(0, groundY, worldWidth, groundHeight);

    // Procedural lines/cracks for the fallback ground
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < worldWidth; x += 150) {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 30, groundY + groundHeight);
    }
    // Horizontal texture bands
    ctx.moveTo(0, groundY + 10);
    ctx.lineTo(worldWidth, groundY + 10);
    ctx.moveTo(0, groundY + groundHeight - 15);
    ctx.lineTo(worldWidth, groundY + groundHeight - 15);
    // ctx.stroke();

    // Project dynamic reflections and waves on the fallback
    const activeEntities = Array.from(this.entities.values());
    const activeWaves = this.waves.filter(wave => wave.intensity > 0.05);

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";

    // Character circular light system removed to comply with "remover completamente sistema de luz criado em personagens"

    activeWaves.forEach((wave) => {
      const hex = wave.color;
      let r = 255, g = 255, b = 255;
      if (hex && hex.startsWith('#')) {
        const c = hex.substring(1);
        r = parseInt(c.substring(0, 2), 16);
        g = parseInt(c.substring(2, 4), 16);
        b = parseInt(c.substring(4, 6), 16);
      }
      const grad = ctx.createRadialGradient(wave.x, groundY, Math.max(0, wave.radius - wave.width), wave.x, groundY, wave.radius + wave.width);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${wave.intensity * 0.35})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(wave.x, groundY, Math.max(0, wave.radius + wave.width), 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    ctx.restore();
  }

  /**
   * Internal drawer for pebbles, dust columns, sand particles (DGDPS polygons)
   */
  public drawGroundParticles(ctx: CanvasRenderingContext2D, stageTheme: string) {
    ctx.save();
    
    const stageKey = this.engine?.currentStageData?.groundDestroyedConfigKey || "";
    const stageConfig = stageKey ? EffectConfigKeyManager.getInstance().getEffect(stageKey) : null;
    
    this.particles.forEach((p) => {
      if (p.life <= 0) return; // skip dead pooled particles

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'pebble') {
        const pebbleConfig = stageConfig;
        const pebbleKey = stageKey;

        let filters: any = null;
        if (pebbleConfig && (
          (pebbleConfig.effectHueRotate && pebbleConfig.effectHueRotate !== 0) || 
          (pebbleConfig.effectSaturate !== undefined && pebbleConfig.effectSaturate !== 1) || 
          (pebbleConfig.effectBrightness !== undefined && pebbleConfig.effectBrightness !== 1) || 
          (pebbleConfig.effectContrast !== undefined && pebbleConfig.effectContrast !== 1)
        )) {
          filters = {
            hueRotate: pebbleConfig.effectHueRotate,
            saturate: pebbleConfig.effectSaturate,
            brightness: pebbleConfig.effectBrightness,
            contrast: pebbleConfig.effectContrast
          };
        }

        if (p.rockIndex !== undefined) {
          const img = this.rockImages[p.rockIndex];
          if (img && img.complete && img.naturalWidth !== 0) {
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            
            const w = p.size * 1.5; // Scale up slightly to make them look nice and chunky
            const h = p.size * 1.5;
            const dx = -w / 2;
            const dy = -h / 2;
            
            const tintColor = pebbleConfig?.color || "#ffffff";
            if (tintColor !== "#ffffff" || filters) {
              const cacheKey = `rock_part_${pebbleKey || "default"}_${p.rockIndex}`;
              const drawImg = AnimationManager.getInstance().getCachedEffectImg(img, tintColor, cacheKey, filters, img.width, img.height);
              ctx.drawImage(drawImg as any, dx, dy, w, h);
            } else {
              ctx.drawImage(img, dx, dy, w, h);
            }
          } else {
            this.drawFallbackPolygon(ctx, p);
          }
        } else {
          this.drawFallbackPolygon(ctx, p);
        }
      } 
      else if (p.type === 'sand') {
        // Small sandy pebbles
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0, p.size / 2), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
      else if (p.type === 'spark') {
        // Brilliant energy sparks
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size / 2), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = p.color;
        // ctx.beginPath();
        // ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        // ctx.fill();
      }
      else {
        // Wind-carried heat dust
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }

  private drawFallbackPolygon(ctx: CanvasRenderingContext2D, p: GroundParticle) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    
    // Desenha uma pedra irregular facetada e pontiaguda com detalhes de rachadura/textura em vez de um círculo perfeito
    if (p.vertices && p.vertices.length > 0) {
      ctx.beginPath();
      ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
      for (let i = 1; i < p.vertices.length; i++) {
        ctx.lineTo(p.vertices[i].x, p.vertices[i].y);
      }
      ctx.closePath();
      ctx.fill();

      // Adiciona linhas internas que dividem faces/facetas para dar profundidade de rocha lascada
      if (p.vertices.length >= 3) {
      }
    } else {
      // Criação determinística de polígono irregular para evitar cintilação entre frames
      const numPoints = 5;
      const cachedVertices: { x: number; y: number }[] = [];
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const seedValue = Math.sin(p.id * 832.3 + i * 45.1) * 0.5 + 0.5;
        const radius = (0.7 + seedValue * 0.3) * (p.size / 2);
        const vx = Math.cos(angle) * radius;
        const vy = Math.sin(angle) * radius;
        cachedVertices.push({ x: vx, y: vy });
        if (i === 0) {
          ctx.moveTo(vx, vy);
        } else {
          ctx.lineTo(vx, vy);
        }
      }
      ctx.closePath();
      ctx.fill();

      if (cachedVertices.length >= 3) {
      }
    }
    
    ctx.restore();
  }

  /**
   * Clean-up resources (useful when switching scenes or ending game matches)
   */
  public clear() {
    this.entities.clear();
    this.waves = [];
    this.particles = [];
  }
}
