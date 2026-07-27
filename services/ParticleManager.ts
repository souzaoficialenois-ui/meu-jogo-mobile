
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

    public spawn(
        type: ParticleType, 
        x: number, 
        y: number, 
        count: number = 1, 
        color: string = '#ffffff', 
        options?: { speed?: number, size?: number, spread?: number }
    ) {
        const speed = options?.speed || 2;
        const size = options?.size || 4;
        const spread = options?.spread || Math.PI * 2;

        for (let i = 0; i < count; i++) {
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

    public spawnDust(x: number, y: number, direction: number) {
        this.spawn('DUST', x, y, 3, '#rgba(255,255,255,0.5)', { speed: 1.5, size: 6, spread: 0.5 });
    }

    public spawnHitSpark(x: number, y: number, heavy: boolean = false) {
        if (this.spawnVfxCallback) {
            const sizeScale = heavy ? 2.5 : 1.8;
            this.spawnVfxCallback(
                heavy ? "COMBO_HIT_HEAVY" : "COMBO_HIT",
                x,
                y,
                `/Assets/efeitos/impacto/1.gif`,
                12,
                false,
                "",
                sizeScale,
                Math.random() > 0.5
            );
        }
    }

    public spawnQuickDashDust(x: number, y: number, facingRight: boolean) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "QUICK_DASH_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/2.gif",
                10,
                false,
                "",
                1.5,
                facingRight
            );
        }
    }

    public spawnChargeKiDust(x: number, y: number) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "CHARGE_KI_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/3.gif",
                12,
                false,
                "",
                2.0,
                true
            );
        }
    }

    public spawnJumpDust(x: number, y: number) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "JUMP_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/4.gif",
                10,
                false,
                "",
                0.80,
                true
            );
        }
    }

    public spawnSuperDashDust(x: number, y: number, facingRight: boolean) {
        if (this.spawnVfxCallback) {
            this.spawnVfxCallback(
                "SUPER_DASH_DUST",
                x,
                y,
                "/Assets/efeitos/poeira/5.gif",
                15,
                false,
                "",
                2.0,
                facingRight
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
            const decayRate = 0.05; // Base decay
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
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
                    ctx.arc(0, 0, p.size * (2 - p.life), 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === 'SPEED_LINES') {
                    ctx.fillRect(-p.size * 5, -p.size/4, p.size * 10, p.size/2);
                }
                ctx.restore();
            } else if (p.type === 'AURA') {
                // Energy aura particle
                const color = p.color || "#00d2ff";
                if (currentFillStyle !== color) {
                    ctx.fillStyle = color;
                    currentFillStyle = color;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // inner bright core
                ctx.fillStyle = '#ffffff';
                currentFillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
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
