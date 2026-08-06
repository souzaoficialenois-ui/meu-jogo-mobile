
import { Particle, ParticleType } from '../types';

export class ParticleManager {
    private particles: Particle[] = [];
    private pool: Particle[] = [];
    private maxPoolSize: number = 200;
    private nextId: number = 0;
    private spawnVfxCallback?: (
        type: string,
        x: number,
        y: number,
        imageUrl: string,
        frames: number,
        loop?: boolean,
        ownerId?: string,
        scale?: number,
        facingRight?: boolean
    ) => void;

    constructor(spawnVfx?: typeof ParticleManager.prototype.spawnVfxCallback) {
        this.spawnVfxCallback = spawnVfx;
        // Pre-fill pool
        for (let i = 0; i < 50; i++) {
            this.pool.push(this.createNewParticle());
        }
    }

    private createNewParticle(): Particle {
        return {
            id: 0,
            type: 'DUST',
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: '#fff',
            alpha: 1,
            rotation: 0,
            rotSpeed: 0
        };
    }

    private getFromPool(): Particle {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createNewParticle();
    }

    private returnToPool(p: Particle) {
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(p);
        }
    }

    private cachedMultiplier: number = 1.0;
    private lastMultiplierCheck: number = 0;

    private getParticleMultiplier(): number {
        const now = Date.now();
        if (now - this.lastMultiplierCheck < 2000) {
            return this.cachedMultiplier;
        }
        this.lastMultiplierCheck = now;
        try {
            const saved = localStorage.getItem("dd2d_settings");
            if (saved) {
                const s = JSON.parse(saved);
                if (s.particlesEnabled === false || s.particleDensity === 'DISABLED') this.cachedMultiplier = 0;
                else if (s.particleDensity === 'VERY_LOW') this.cachedMultiplier = 0.25;
                else if (s.particleDensity === 'LOW') this.cachedMultiplier = 0.5;
                else if (s.particleDensity === 'MEDIUM') this.cachedMultiplier = 1.0;
                else if (s.particleDensity === 'HIGH') this.cachedMultiplier = 1.5;
                else if (s.particleDensity === 'MAX') this.cachedMultiplier = 2.2;
                else this.cachedMultiplier = 1.0;
            } else {
                this.cachedMultiplier = 1.0;
            }
        } catch (e) {
            this.cachedMultiplier = 1.0;
        }
        return this.cachedMultiplier;
    }

    public hasActiveParticles(): boolean {
        return this.particles.length > 0;
    }

    public spawn(
        type: ParticleType, 
        x: number, 
        y: number, 
        count: number = 1, 
        color: string = '#ffffff', 
        options?: { speed?: number, size?: number, spread?: number }
    ) {
        const mult = this.getParticleMultiplier();
        let adjustedCount = Math.round(count * mult);
        if (adjustedCount < 1 && Math.random() < mult) adjustedCount = 1;

        const speed = options?.speed || 2;
        const size = options?.size || 4;
        const spread = options?.spread || Math.PI * 2;

        const MAX_ACTIVE_PARTICLES = 150;
        for (let i = 0; i < adjustedCount; i++) {
            if (this.particles.length >= MAX_ACTIVE_PARTICLES) {
                break;
            }
            const p = this.getFromPool();
            p.id = this.nextId++;
            p.type = type;
            p.x = x;
            p.y = y;
            
            const angle = Math.random() * spread - spread / 2;
            p.vx = Math.cos(angle) * (Math.random() * speed);
            p.vy = Math.sin(angle) * (Math.random() * speed);
            
            p.life = 1.0;
            p.maxLife = 1.0;
            p.size = size * (0.5 + Math.random());
            p.color = color;
            p.alpha = 1;
            p.rotation = Math.random() * 360;
            p.rotSpeed = (Math.random() - 0.5) * 10;
            
            this.particles.push(p);
        }
    }

    public spawnRisingEnergy(
        x: number,
        y: number,
        count: number = 25,
        color: string = '#38bdf8',
        spreadX: number = 120
    ) {
        const mult = this.getParticleMultiplier();
        let adjustedCount = Math.round(count * mult);
        if (adjustedCount < 1 && Math.random() < mult) adjustedCount = 1;

        const MAX_ACTIVE_PARTICLES = 150;
        for (let i = 0; i < adjustedCount; i++) {
            if (this.particles.length >= MAX_ACTIVE_PARTICLES) {
                break;
            }
            const p = this.getFromPool();
            p.id = this.nextId++;
            p.type = 'AURA';
            p.x = x + (Math.random() - 0.5) * spreadX;
            p.y = y + (Math.random() - 0.5) * 30;
            
            p.vx = (Math.random() - 0.5) * 3.0;
            p.vy = -3.5 - Math.random() * 6.5; // Upward velocity into the sky!
            
            p.life = 1.0;
            p.maxLife = 1.0;
            p.size = 8 + Math.random() * 16;
            p.color = color;
            p.alpha = 1;
            p.rotation = Math.random() * 360;
            p.rotSpeed = (Math.random() - 0.5) * 10;
            
            this.particles.push(p);
        }
    }

    public spawnBeamAuraGrowth(
        startX: number,
        centerY: number,
        beamLength: number,
        facingRight: boolean,
        color: string = '#38bdf8',
        beamHeight: number = 80,
        count: number = 1
    ) {
        const mult = this.getParticleMultiplier();
        let adjustedCount = Math.round(count * mult);
        if (adjustedCount < 1 && Math.random() < mult) adjustedCount = 1;

        const MAX_ACTIVE_PARTICLES = 80;
        for (let i = 0; i < adjustedCount; i++) {
            if (this.particles.length >= MAX_ACTIVE_PARTICLES) break;

            const p = this.getFromPool();
            p.id = this.nextId++;
            p.type = 'AURA';

            const dist = Math.random() * beamLength;
            p.x = facingRight ? startX + dist : startX - dist;
            p.y = centerY + (Math.random() - 0.5) * (beamHeight * 0.4);

            p.vx = (Math.random() - 0.5) * 1.2;
            p.vy = (Math.random() - 0.5) * 1.2 - 0.3;

            p.life = 0.45;
            p.maxLife = 0.45;
            p.size = 4 + Math.random() * 6;
            p.color = color;
            p.alpha = 0.85;
            p.rotation = Math.random() * 360;
            p.rotSpeed = (Math.random() - 0.5) * 8;

            this.particles.push(p);
        }
    }

    public spawnBeamGenkidamaDispersion(
        x: number,
        y: number,
        count: number = 3,
        color: string = '#38bdf8',
        facingRight: boolean = true
    ) {
        const mult = this.getParticleMultiplier();
        let adjustedCount = Math.round(count * mult);
        if (adjustedCount < 1 && Math.random() < mult) adjustedCount = 1;

        const MAX_ACTIVE_PARTICLES = 80;
        for (let i = 0; i < adjustedCount; i++) {
            if (this.particles.length >= MAX_ACTIVE_PARTICLES) break;

            const p = this.getFromPool();
            p.id = this.nextId++;
            p.type = 'AURA';
            p.x = x + (Math.random() - 0.5) * 12;
            p.y = y + (Math.random() - 0.5) * 16;

            // Genkidama dispersion particle physics (scattering outward & upward)
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            p.vx = Math.cos(angle) * speed;
            p.vy = -1.8 - Math.random() * 2.5;

            p.life = 0.6;
            p.maxLife = 0.6;
            p.size = 5 + Math.random() * 8;
            p.color = color;
            p.alpha = 0.8;
            p.rotation = Math.random() * 360;
            p.rotSpeed = (Math.random() - 0.5) * 8;

            this.particles.push(p);
        }
    }

    public spawnDust(x: number, y: number, direction: number = 0) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "JUMP_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/pulo.gif",
                8,
                false,
                "",
                1.5,
                direction < 0
            );
        }
    }

    public spawnHitSpark(
        x: number, 
        y: number, 
        hitType: 'light' | 'medium' | 'heavy' | 'beans' | 'defesa_quebrada' | boolean = 'light',
        ownerId?: string
    ) {
        if (this.spawnVfxCallback) {
            let sparkUrl = "/Assets/efeitos/impacto/hit_light.gif";
            let sizeScale = 0.72;
            let effectType = "COMBO_HIT";
            let frames = 12;

            if (hitType === 'defesa_quebrada') {
                sparkUrl = "/Assets/efeitos/impacto/defesa_quebrada.gif";
                sizeScale = 1.0;
                effectType = "DEFESA_QUEBRADA";
                frames = 25;
            } else if (hitType === true || hitType === 'heavy') {
                sparkUrl = "/Assets/efeitos/impacto/hit_heavy.gif";
                sizeScale = 1.0;
                effectType = "COMBO_HIT_HEAVY";
                frames = 15;
            } else if (hitType === 'medium') {
                sparkUrl = "/Assets/efeitos/impacto/hit_medium.gif";
                sizeScale = 0.8;
                effectType = "COMBO_HIT_MEDIUM";
                frames = 12;
            } else if (hitType === 'beans') {
                sparkUrl = "/Assets/efeitos/impacto/hit_beans.gif";
                sizeScale = 1.76;
                effectType = "COMBO_HIT_BEANS";
                frames = 12;
            } else {
                // 'light' or false
                sparkUrl = "/Assets/efeitos/impacto/hit_light.gif";
                sizeScale = 0.72;
                effectType = "COMBO_HIT";
                frames = 12;
            }

            this.spawnVfxCallback(
                effectType,
                x,
                y,
                sparkUrl,
                frames,
                false,
                ownerId || "",
                sizeScale,
                Math.random() > 0.5
            );
        }
    }

    public spawnGuardBreak(x: number, y: number) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "DEFESA_QUEBRADA",
                x,
                y,
                "/Assets/efeitos/impacto/defesa_quebrada.gif",
                25,
                false,
                "",
                1.0,
                false
            );
        }
    }

    public spawnQuickDashDust(x: number, y: number, facingRight: boolean) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "DASH_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/double_tap.gif",
                8,
                false,
                "",
                1.5,
                !facingRight
            );
        }
    }

    public spawnChargeKiDust(x: number, y: number) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "CHARGE_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/carregando_ki.gif",
                10,
                true,
                "",
                1.8,
                false
            );
        }
    }

    public spawnJumpDust(x: number, y: number) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "JUMP_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/pulo.gif",
                8,
                false,
                "",
                1.5,
                false
            );
        }
    }

    public spawnSuperDashDust(x: number, y: number, facingRight: boolean) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "SUPER_DASH_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/super_dash.gif",
                8,
                false,
                "",
                1.8,
                !facingRight
            );
        }
    }

    public update() {
        let activeCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Physics
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            // Decay
            const decayRate = p.type === 'AURA' ? 0.02 : 0.05; // Longer life for rising energy particles
            p.life -= decayRate;
            
            if (p.life <= 0) {
                this.returnToPool(p);
                continue;
            }

            p.alpha = p.life / p.maxLife;

            // Specific Behavior
            if (p.type === 'DUST') {
                p.vx *= 0.9; // Friction
                p.vy *= 0.9;
                p.size *= 1.02; // Expand
            } else if (p.type === 'HIT') {
                p.vx *= 0.85;
            } else if (p.type === 'BLOCK') {
                p.vx *= 0.8;
                p.vy *= 0.8;
            }
            
            // Fast filtration: keep active particles at the front of the array
            this.particles[activeCount++] = p;
        }
        
        // Truncate the array to the number of active particles
        if (this.particles.length !== activeCount) {
            this.particles.length = activeCount;
        }
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (this.particles.length === 0) return;
        
        ctx.save();
        
        let currentAlpha = -1;
        let currentGCO = 'source-over';
        let currentFillStyle = '';
        
        for (const p of this.particles) {
            // Update GCO if changed
            const targetGCO = p.type === 'AURA' ? 'screen' : 'source-over';
            if (currentGCO !== targetGCO) {
                ctx.globalCompositeOperation = targetGCO as any;
                currentGCO = targetGCO;
            }
            
            // Update Alpha if changed
            if (Math.abs(currentAlpha - p.alpha) > 0.01) {
                ctx.globalAlpha = p.alpha;
                currentAlpha = p.alpha;
            }
            
            if (p.type === 'DUST') {
                if (currentFillStyle !== p.color) {
                    ctx.fillStyle = p.color;
                    currentFillStyle = p.color;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'HIT' || p.type === 'BLOCK' || p.type === 'IMPACT' || p.type === 'SPEED_LINES' || p.type === 'SMOKE') {
                const needsRotation = p.rotation !== 0;
                
                if (needsRotation) {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                } else {
                    ctx.save();
                    ctx.translate(p.x, p.y);
                }
                
                if (currentFillStyle !== p.color) {
                    ctx.fillStyle = p.color;
                    currentFillStyle = p.color;
                }
                
                if (p.type === 'HIT' || p.type === 'BLOCK') {
                    if (p.type === 'BLOCK') {
                        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        ctx.fillRect(-p.size/2, -p.size/2, p.size * 2, p.size / 2);
                    }
                } else if (p.type === 'IMPACT') {
                    ctx.fillRect(-p.size, -p.size/4, p.size*2, p.size/2);
                    ctx.fillRect(-p.size/4, -p.size, p.size/2, p.size*2);
                } else if (p.type === 'SMOKE') {
                    ctx.beginPath();
                    ctx.arc(0, 0, Math.max(0, p.size * (2 - p.life)), 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'SPEED_LINES') {
                    ctx.fillRect(-p.size * 5, -p.size/4, p.size * 10, p.size/2);
                }
                ctx.restore();
            } else if (p.type === 'AURA' || p.type === 'ENERGY' || p.type === 'SPARK') {
                // Energy particle (Ki / Genkidama energy particle)
                const color = p.color || "#38bdf8";
                const size = Math.max(1, p.size);
                
                // Trailing motion tail for moving aura energy particles
                if (p.vx || p.vy) {
                    const vx = p.vx || 0;
                    const vy = p.vy || 0;
                    const tailX = p.x - vx * 2.5;
                    const tailY = p.y - vy * 2.5;
                    const gradTrail = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
                    gradTrail.addColorStop(0, color);
                    gradTrail.addColorStop(1, 'transparent');

                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(tailX, tailY);
                    ctx.strokeStyle = gradTrail;
                    ctx.lineWidth = Math.max(1, size * 0.85);
                    ctx.stroke();
                }

                // Outer soft energy radial glow
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.0);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.35, color);
                grad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 2.0, 0, Math.PI * 2);
                ctx.fill();

                // Vibrant energy core
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright white hot center
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 0.45, 0, Math.PI * 2);
                ctx.fill();

                // Energy spark rays for larger particles
                if (size > 8) {
                    ctx.beginPath();
                    const sparkLen = size * 1.5;
                    ctx.moveTo(p.x - sparkLen, p.y);
                    ctx.lineTo(p.x + sparkLen, p.y);
                    ctx.moveTo(p.x, p.y - sparkLen);
                    ctx.lineTo(p.x, p.y + sparkLen);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            } else {
                if (currentFillStyle !== p.color) {
                    ctx.fillStyle = p.color;
                    currentFillStyle = p.color;
                }
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }

        ctx.restore();
    }
}
