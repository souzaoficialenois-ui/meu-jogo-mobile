
import { DummyMode, PlayerState, InputState, CpuAction, CounterAttackType } from '../types';

export class DummyController {
  public mode: DummyMode = DummyMode.IDLE;
  public cpuAction: CpuAction = CpuAction.OFF;
  public counterAttackType: CounterAttackType = CounterAttackType.LIGHT;

  private blockActionTimer: number = 0;
  private currentBlockAction: 'BLOCK' | 'DROP' | 'ATTACK' = 'BLOCK';
  private hasBlockedAttack: boolean = false;
  private counterAttackCooldown: number = 0;

  constructor() {}

  public setMode(mode: DummyMode) {
    this.mode = mode;
    this.blockActionTimer = 0;
    this.currentBlockAction = 'BLOCK';
  }

  public setCpuAction(action: CpuAction) {
    this.cpuAction = action;
    this.hasBlockedAttack = false;
    this.counterAttackCooldown = 0;
  }

  public setCounterAttackType(type: CounterAttackType) {
    this.counterAttackType = type;
  }

  // Generate input for the dummy based on the selected mode
  public update(dummy: any, opponent: any, opponentInput?: Partial<InputState>, projectiles: any[] = []): Partial<InputState> {
    const inputs: Partial<InputState> = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      light: false,
      medium: false,
      heavy: false,
      special: false,
      block: false,
      dash: false,
      ultimate: false,
      ultimate2: false
    };

    if (!dummy || dummy.stunTimer > 0) return inputs;

    const dx = opponent?.x ? opponent.x - dummy.x : 0;
    const isToRight = dx > 0;

    // Handle CPU actions if enabled
    if (this.cpuAction !== CpuAction.OFF) {
      const opponentIsAttacking = opponent && (
        opponent.state === PlayerState.ATTACKING ||
        opponent.state === PlayerState.JUMP_ATTACK ||
        opponent.state === PlayerState.CROUCH_ATTACK ||
        opponent.state === PlayerState.ULTIMATE ||
        opponent.state === PlayerState.ULTIMATE_2 ||
        opponent.state === PlayerState.SUPER_DASH ||
        opponent.state === PlayerState.DRAGON_RUSH ||
        opponent.attackTimer > 0
      );

      const incomingProjectile = projectiles && projectiles.some(
        p => p.ownerId !== dummy.id && p.active && Math.abs(p.x - dummy.x) < 400
      );

      const shouldBlock = opponentIsAttacking || incomingProjectile;

      switch (this.cpuAction) {
        case CpuAction.DEFEND_ALWAYS:
          if (shouldBlock) {
            if (isToRight) {
              inputs.left = true;
            } else {
              inputs.right = true;
            }
            inputs.block = true;
            // Crouch block if opponent is crouch attacking
            if (opponent && opponent.state === PlayerState.CROUCH_ATTACK) {
              inputs.down = true;
            }
          }
          break;

        case CpuAction.COUNTER_ATTACK:
          if (shouldBlock) {
            if (isToRight) {
              inputs.left = true;
            } else {
              inputs.right = true;
            }
            inputs.block = true;
            if (opponent && opponent.state === PlayerState.CROUCH_ATTACK) {
              inputs.down = true;
            }
            this.hasBlockedAttack = true;
          } else if (this.hasBlockedAttack) {
            // Trigger counter-attack when opponent stops attacking
            this.counterAttackCooldown = 25; // execute for 25 frames
            this.hasBlockedAttack = false;
          }

          if (this.counterAttackCooldown > 0) {
            this.counterAttackCooldown--;
            
            // Auto top-up Ki to ensure they can cast the attack
            if (this.counterAttackType === CounterAttackType.SPECIAL && dummy.ki < 200) {
              dummy.ki = 200;
            } else if (this.counterAttackType === CounterAttackType.ULTIMATE && dummy.ki < 400) {
              dummy.ki = 400;
            }

            // Move towards opponent
            if (isToRight) {
              inputs.right = true;
            } else {
              inputs.left = true;
            }

            // Apply selected counter-attack input
            switch (this.counterAttackType) {
              case CounterAttackType.LIGHT:
                inputs.light = true;
                break;
              case CounterAttackType.MEDIUM:
                inputs.medium = true;
                break;
              case CounterAttackType.HEAVY:
                inputs.heavy = true;
                break;
              case CounterAttackType.SPECIAL:
                inputs.special = true;
                break;
              case CounterAttackType.ULTIMATE:
                inputs.ultimate = true;
                break;
            }
          }
          break;

        case CpuAction.REFLECT_BEAM:
          // Check for any approaching beam or projectile
          const approachingBeamOrProj = projectiles && projectiles.find(
            p => p.ownerId !== dummy.id && p.active && Math.abs(p.x - dummy.x) < 250
          );

          if (approachingBeamOrProj) {
            // Ensure enough Ki for perfect guard beam deflection (needs 200)
            if (approachingBeamOrProj.isBeam && dummy.ki < 200) {
              dummy.ki = 200;
            }
            
            // Start blocking at the exact perfect moment to trigger perfect guard reflection!
            if (isToRight) {
              inputs.left = true;
            } else {
              inputs.right = true;
            }
            inputs.block = true;
          }
          break;
      }

      return inputs;
    }

    // Normal Dummy Modes
    switch (this.mode) {
      case DummyMode.IDLE:
        // Do nothing
        break;

      case DummyMode.MIRROR:
        if (opponentInput) {
          return { ...opponentInput };
        }
        break;

      case DummyMode.BLOCK:
        if (this.blockActionTimer > 0) {
            this.blockActionTimer--;
        } else {
            const rand = Math.random();
            if (rand < 0.05) {
                // 5% chance to drop guard for a short duration
                this.currentBlockAction = 'DROP';
                this.blockActionTimer = 30 + Math.floor(Math.random() * 30);
            } else if (rand < 0.10) {
                // 5% chance to perform a counter attack
                this.currentBlockAction = 'ATTACK';
                this.blockActionTimer = 15;
            } else {
                // Otherwise normal block state
                this.currentBlockAction = 'BLOCK';
                this.blockActionTimer = 40 + Math.floor(Math.random() * 40); 
            }
        }

        if (this.currentBlockAction === 'BLOCK') {
            if (isToRight) {
                inputs.left = true; // Block left
            } else {
                inputs.right = true; // Block right
            }
        } else if (this.currentBlockAction === 'ATTACK') {
             // Turn towards opponent and attack
             if (isToRight) {
                 inputs.right = true;
             } else {
                 inputs.left = true;
             }
             inputs.attack = true;
             inputs.light = true;
        }
        break;

      case DummyMode.JUMP:
        if (dummy.isGrounded) {
            inputs.jump = true;
        }
        break;
      
      case DummyMode.CROUCH:
        if (dummy.isGrounded) {
            inputs.down = true;
        }
        break;
    }

    return inputs;
  }
}
