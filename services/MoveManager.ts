
import { Player } from './Player';
import { MovePhase, PhasedMove, PlayerState, Vector2 } from '../types';
import { GameEngine } from './GameEngine';
import { CollisionHelper } from './CollisionHelper';
import { AudioManager } from './AudioManager';

export class MoveManager {
    private static instance: MoveManager;
    private moves: Map<string, PhasedMove> = new Map();

    private constructor() {
        // Dynamic loading from character data is now prioritized
    }

    public static getInstance(): MoveManager {
        if (!MoveManager.instance) {
            MoveManager.instance = new MoveManager();
        }
        return MoveManager.instance;
    }

    public registerMove(move: PhasedMove) {
        this.moves.set(move.id, move);
    }

    public hasMove(moveId: string): boolean {
        return this.moves.has(moveId);
    }

    public startMove(player: Player, moveId: string) {
        let move = player.data.phasedMoves?.[moveId];
        
        if (!move) {
            move = this.moves.get(moveId);
        }

        if (!move) return;

        player.currentPhasedMove = moveId;
        player.currentPhaseIndex = 0;
        player.ataque = true;
        player.animDelayActive = false;
        
        if (moveId === 'INTRO') {
            player.state = PlayerState.INTRO;
        } else {
            player.state = PlayerState.ATTACKING;
        }
        
        this.applyPhase(player, move.phases[0]);
    }

    private applyPhase(player: Player, phase: MovePhase) {
        player.animFrame = 0;
        player.animTimer = 0;
        player.animFinished = false;
        player.phaseFinished = false;
        player.phaseHitApplied = false;
        player.phaseTimer = 0;
        player.currentPhaseAnim = phase.animation;
        
        if (phase.velocityJump) {
            player.velocity.x = player.facingRight ? phase.velocityJump.x : -phase.velocityJump.x;
            player.velocity.y = phase.velocityJump.y;
        }
    }

    public update(player: Player, engine: GameEngine) {
        if (!player.currentPhasedMove) return;

        let move = player.data.phasedMoves?.[player.currentPhasedMove];
        if (!move) {
            move = this.moves.get(player.currentPhasedMove);
        }

        if (!move) {
            this.endMove(player);
            return;
        }

        const phase = move.phases[player.currentPhaseIndex];
        if (!phase) {
            this.endMove(player);
            return;
        }

        player.phaseTimer++;

        // 1. Movement logic
        if (phase.suspendGravity) {
            player.velocity.y = 0;
            player.gravityDisabledTimer = 5;
        }

        if (phase.homing) {
            const opponent = player === engine.player1 ? engine.player2 : engine.player1;
            const dx = opponent.pos.x - player.pos.x;
            const dy = (opponent.pos.y - opponent.height/2) - (player.pos.y - player.height/2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 25;
            if (dist > 10) {
                player.velocity.x = (dx / dist) * speed;
                player.velocity.y = (dy / dist) * speed;
            } else {
                player.velocity.x = 0;
                player.velocity.y = 0;
            }
        } else {
            if (phase.moveX) {
                player.pos.x += (player.facingRight ? phase.moveX : -phase.moveX);
            }
            if (phase.moveY) {
                player.pos.y += phase.moveY;
            }
        }

        if (phase.snapOpponent) {
            const opponent = player === engine.player1 ? engine.player2 : engine.player1;
            const dx = opponent.pos.x - player.pos.x;
            const dy = opponent.pos.y - player.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                const targetX = player.pos.x + (player.facingRight ? 40 : -40);
                const targetY = player.pos.y - 20;
                opponent.pos.x = opponent.pos.x * 0.85 + targetX * 0.15;
                opponent.pos.y = opponent.pos.y * 0.85 + targetY * 0.15;
                opponent.velocity.x = 0;
                opponent.velocity.y = 0;
            }
        }

        // 2. SFX/VFX
        if (phase.sfxName && player.phaseTimer === phase.sfxFrame) {
            AudioManager.getInstance().playSFX(phase.sfxName);
        }

        // 3. Hitbox Logic
        if (phase.hitboxActive) {
            const startFrame = phase.hitboxStartFrame || 0;
            const endFrame = phase.hitboxEndFrame || (phase.duration || 999);
            
            if (player.phaseTimer >= startFrame && player.phaseTimer <= endFrame && !player.phaseHitApplied) {
                const opponent = player === engine.player1 ? engine.player2 : engine.player1;
                
                let hit = false;
                const hAtk = player.hitbox;

                // Priority 1: Phase-specific attack box
                if (phase.attackBoxWidth !== undefined && phase.attackBoxHeight !== undefined) {
                    const aW = phase.attackBoxWidth;
                    const aH = phase.attackBoxHeight;
                    const aXOff = phase.attackBoxOffsetX !== undefined ? phase.attackBoxOffsetX : hAtk.width;
                    const aYOff = phase.attackBoxOffsetY !== undefined ? phase.attackBoxOffsetY : hAtk.height * 0.3;
                    
                    const customX = player.facingRight
                        ? hAtk.x + aXOff
                        : hAtk.x + hAtk.width - aXOff - aW;
                    
                    const box = {
                        x: customX,
                        y: hAtk.y + aYOff,
                        width: aW,
                        height: aH
                    };
                    hit = CollisionHelper.testAABB(box, opponent.hitbox);
                } 
                // Priority 2: Animation-specific attack boxes
                else {
                    const atkBoxes = player.attackBoxes;
                    if (atkBoxes.length > 0) {
                        hit = atkBoxes.some(box => CollisionHelper.testAABB(box, opponent.hitbox));
                    } else {
                        // Priority 3: Fallback to body contact (hitbox)
                        hit = CollisionHelper.testAABB(player.hitbox, opponent.hitbox);
                    }
                }

                if (hit) {
                    this.onHit(player, opponent, phase, engine);
                }
            }
        }

        // 4. Phase Transition
        let phaseEnded = false;
        
        // Get the current animation data
        const anim = player.data.spriteConfig?.animations[player.currentPhaseAnim || player.state];
        const isGif = anim && (anim.isGif || anim.imageUrl?.toLowerCase().endsWith('.gif'));
        const isLooping = anim && anim.loop !== false;

        if (phase.duration) {
            // If duration is reached AND animation is finished (if it's a non-looping GIF)
            if (player.phaseTimer >= phase.duration) {
                if (isLooping || !isGif || player.animFinished || (player as any).customAnimFinishedThisFrame) {
                    phaseEnded = true;
                }
            }
        } else if (player.animFinished || (player as any).customAnimFinishedThisFrame) {
            // No duration, so we strictly wait for animation finish
            phaseEnded = true;
        }

        if (phaseEnded) {
            this.nextPhase(player, move);
        }
    }

    private onHit(player: Player, opponent: Player, phase: MovePhase, engine: GameEngine) {
        player.phaseHitApplied = true;
        const dmg = phase.damage || 0;
        opponent.takeDamage(dmg);
        
        if (phase.knockdown) {
            opponent.state = PlayerState.KNOCKED_DOWN;
            opponent.velocity.x = player.facingRight ? 5 : -5;
            opponent.velocity.y = 5;
            opponent.stunTimer = 60;
        }

        if (phase.suspendOpponent) {
            opponent.velocity.x = 0;
            opponent.velocity.y = 0;
            opponent.stunTimer = Math.max(opponent.stunTimer, 15);
        }

        if (phase.launchOpponent) {
            opponent.state = PlayerState.LAUNCHED;
            opponent.isGrounded = false;
            opponent.velocity.x = player.facingRight ? phase.launchOpponent.x : -phase.launchOpponent.x;
            opponent.velocity.y = phase.launchOpponent.y;
            opponent.stunTimer = 45;
        }

        if (phase.onHitTransition) {
             let move = player.data.phasedMoves?.[player.currentPhasedMove!];
             if (!move) move = this.moves.get(player.currentPhasedMove!);
             
             if (move) {
                 const nextIdx = move.phases.findIndex(p => (p as any).id === phase.onHitTransition || p.animation === phase.onHitTransition);
                 if (nextIdx !== -1) {
                     player.currentPhaseIndex = nextIdx;
                     this.applyPhase(player, move.phases[nextIdx]);
                     return;
                 }
             }
        }
        
        if (phase.shakeIntensity) {
            engine.camera?.addScreenShake(phase.duration || 10, phase.shakeIntensity, 'IMPULSE');
        }

        // Air hit impact freeze
        if (!player.isGrounded) {
            player.gravityDisabledTimer = 20;
            opponent.gravityDisabledTimer = 20;
            player.velocity.x = 0;
            player.velocity.y = 0;
            opponent.velocity.x = 0;
            opponent.velocity.y = 0;
            opponent.stunTimer = Math.max(opponent.stunTimer, 20);
        }
    }

    private nextPhase(player: Player, move: PhasedMove) {
        const currentPhase = move.phases[player.currentPhaseIndex];
        
        if (currentPhase.transitionTo) {
            const nextIdx = move.phases.findIndex(p => (p as any).id === currentPhase.transitionTo || p.animation === currentPhase.transitionTo);
            if (nextIdx !== -1) {
                player.currentPhaseIndex = nextIdx;
                this.applyPhase(player, move.phases[nextIdx]);
                return;
            }
        }

        // Default: just go to next in array
        if (player.currentPhaseIndex < move.phases.length - 1) {
            player.currentPhaseIndex++;
            this.applyPhase(player, move.phases[player.currentPhaseIndex]);
        } else {
            this.endMove(player);
        }
    }

    public endMove(player: Player) {
        player.currentPhasedMove = null;
        player.currentPhaseIndex = -1;
        player.currentPhaseAnim = null;
        player.phaseTimer = 0;
        player.phaseFinished = false;
        player.phaseHitApplied = false;
        player.ataque = false;
        player.state = player.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
    }
}
