
import { PlayerState, InputState, Rect } from '../types';
import { MAX_KI, KI_BLAST_COST, MOVE_SPEED, ATTACK_WIDTH, MAX_HP } from '../constants';
import { CpuStreakManager } from './CpuStreakManager';

export enum AIState {
    IDLE = 'IDLE',
    APPROACH = 'APPROACH',
    RETREAT = 'RETREAT',
    ATTACK = 'ATTACK',
    DEFEND = 'DEFEND',
    COMBO = 'COMBO',
    PUNISH = 'PUNISH',
    CHARGE = 'CHARGE'
}

export type AIDifficulty = 'EASY' | 'NORMAL' | 'MEDIUM' | 'HARD' | 'INSANE' | 'BOSS';

type ActionCategory = 'ATTACK_L' | 'ATTACK_M' | 'ATTACK_H' | 'SPECIAL' | 'SPECIAL_2' | 'SPECIAL_3' | 'DASH_FWD' | 'DASH_BACK' | 'JUMP' | 'BLOCK' | 'CHARGE' | 'ULTIMATE' | 'ULTIMATE_2' | 'VANISH' | 'APPROACH' | 'RETREAT' | 'IDLE' | 'SUPER_DASH';

interface AIProfile {
    reactionTime: [number, number]; // Frames to react
    decisionDelay: [number, number]; // Frames between decisions
    comboAccuracy: number; // 0.0 to 1.0
    aggressiveness: number; // Weight bias to attack/approach
    defenseSkill: number; // 0.0 to 1.0 block chance
    punishRate: number; // 0.0 to 1.0 chance to punish
    errorRate: number; // Chance to make a mistake
    openness: number; // Chance to just stand or drop guard
    actionMemorySize: number; // How many past actions to remember for anti-repetition
}

export class AIController {
    private currentState: AIState = AIState.IDLE;
    private stateTimer: number = 0;
    
    // Timing delays
    private reactionDelay: number = 0; 
    private decisionDelayTimer: number = 0;
    
    // Memory and Pattern adaptation
    private actionHistory: ActionCategory[] = [];
    private targetPatternCount: Record<string, number> = { jumps: 0, blocks: 0, attacks: 0, specials: 0 };
    private lastAction: ActionCategory | null = null;
    
    private difficultyLevel: AIDifficulty;
    private profile: AIProfile;
    private winStreak: number = 0;

    // Training dummy state variables
    private trainingBlockActionTimer: number = 0;
    private trainingCurrentBlockAction: 'BLOCK' | 'DROP' | 'ATTACK' = 'BLOCK';
    private trainingHasBlockedAttack: boolean = false;
    private trainingCounterAttackCooldown: number = 0;

    private inputs: InputState = {
        left: false, right: false, up: false, down: false, jump: false,
        light: false, medium: false, heavy: false, special: false,
        special2: false, special3: false, special4: false, special5: false, special6: false,
        block: false, dash: false, charge: false, attack: false, tag: false, ultimate: false, ultimate2: false,
        assist1: false, assist2: false, vanish: false, transform: false, fusion: false, dragonRush: false
    };

    constructor(difficultyLevel: AIDifficulty = 'HARD', winStreak?: number) {
        this.difficultyLevel = difficultyLevel;
        this.winStreak = winStreak !== undefined ? Math.max(0, winStreak) : CpuStreakManager.getStreak();
        this.profile = this.getProfile(difficultyLevel);
    }

    public setWinStreak(winStreak: number) {
        this.winStreak = Math.max(0, winStreak);
        this.profile = this.getProfile(this.difficultyLevel);
    }

    public getWinStreak(): number {
        return this.winStreak;
    }

    public getEffectiveProfile(): AIProfile {
        return { ...this.profile };
    }

    private getProfile(diff: AIDifficulty): AIProfile {
        let base: AIProfile;
        switch (diff) {
            case 'EASY': base = { reactionTime: [30, 50], decisionDelay: [40, 60], comboAccuracy: 0.3, aggressiveness: 0.3, defenseSkill: 0.2, punishRate: 0.1, errorRate: 0.4, openness: 0.5, actionMemorySize: 1 }; break;
            case 'NORMAL': base = { reactionTime: [20, 35], decisionDelay: [25, 40], comboAccuracy: 0.6, aggressiveness: 0.5, defenseSkill: 0.4, punishRate: 0.3, errorRate: 0.2, openness: 0.3, actionMemorySize: 2 }; break;
            case 'MEDIUM': base = { reactionTime: [12, 22], decisionDelay: [15, 25], comboAccuracy: 0.75, aggressiveness: 0.65, defenseSkill: 0.6, punishRate: 0.6, errorRate: 0.1, openness: 0.15, actionMemorySize: 3 }; break;
            case 'HARD': base = { reactionTime: [5, 12], decisionDelay: [5, 12], comboAccuracy: 0.9, aggressiveness: 0.8, defenseSkill: 0.85, punishRate: 0.85, errorRate: 0.05, openness: 0.05, actionMemorySize: 4 }; break;
            case 'INSANE': base = { reactionTime: [1, 3], decisionDelay: [1, 4], comboAccuracy: 1.0, aggressiveness: 0.95, defenseSkill: 1.0, punishRate: 1.0, errorRate: 0.0, openness: 0.0, actionMemorySize: 6 }; break;
            case 'BOSS': base = { reactionTime: [2, 6], decisionDelay: [2, 6], comboAccuracy: 0.95, aggressiveness: 0.95, defenseSkill: 0.9, punishRate: 0.95, errorRate: 0.02, openness: 0.01, actionMemorySize: 5 }; break;
            default: base = { reactionTime: [12, 22], decisionDelay: [15, 25], comboAccuracy: 0.75, aggressiveness: 0.65, defenseSkill: 0.6, punishRate: 0.6, errorRate: 0.1, openness: 0.15, actionMemorySize: 3 }; break;
        }

        if (this.winStreak <= 0) {
            return base;
        }

        // Gradual adjustment after player win streak
        const streak = this.winStreak;

        // Boost aggressiveness gradually: +0.06 per win streak, capping at +0.40
        const aggBoost = Math.min(0.40, streak * 0.06);

        // Boost combo accuracy, defense skill, and punish rate: +0.05 per win streak
        const comboBoost = Math.min(0.35, streak * 0.05);
        const defBoost = Math.min(0.35, streak * 0.05);
        const punishBoost = Math.min(0.35, streak * 0.05);

        // Reduce error rate and openness (fewer mistakes and pauses)
        const errReduce = Math.min(base.errorRate, streak * 0.03);
        const openReduce = Math.min(base.openness, streak * 0.04);

        // Faster reaction time (fewer frames delay)
        const rx0 = Math.max(1, Math.round(base.reactionTime[0] - streak * 1.5));
        const rx1 = Math.max(2, Math.round(base.reactionTime[1] - streak * 2.0));

        // Faster decision delay (fewer frames between AI decisions)
        const dec0 = Math.max(1, Math.round(base.decisionDelay[0] - streak * 1.5));
        const dec1 = Math.max(3, Math.round(base.decisionDelay[1] - streak * 2.0));

        return {
            reactionTime: [rx0, rx1],
            decisionDelay: [dec0, dec1],
            comboAccuracy: Math.min(1.0, base.comboAccuracy + comboBoost),
            aggressiveness: Math.min(1.0, base.aggressiveness + aggBoost),
            defenseSkill: Math.min(1.0, base.defenseSkill + defBoost),
            punishRate: Math.min(1.0, base.punishRate + punishBoost),
            errorRate: Math.max(0.0, base.errorRate - errReduce),
            openness: Math.max(0.0, base.openness - openReduce),
            actionMemorySize: Math.min(6, base.actionMemorySize + Math.floor(streak / 2))
        };
    }

    public update(ai: any, target: any, projectiles: any[] = [], engine?: any, opponentInput?: any): InputState {
        this.resetInputs();

        if (!ai || !target) return this.inputs;

        // 1. Cannot act if dead or knocked down
        if (ai.hp <= 0 || ai.state === PlayerState.KNOCKED_DOWN) {
            return this.inputs;
        }

        // Cannot act during transformations
        if (
            ai.state === PlayerState.TRANSFORM || ai.state === PlayerState.DETRANSFORM || ai.state === PlayerState.FUSION || ai.state === PlayerState.DEFUSION ||
            target.state === PlayerState.TRANSFORM || target.state === PlayerState.DETRANSFORM || target.state === PlayerState.FUSION || target.state === PlayerState.DEFUSION
        ) {
            return this.inputs;
        }

        // Handle Training Mode dummy behaviors if engine is passed and isTraining is active
        if (engine && engine.isTraining) {
            const cpuAction = engine.cpuAction || 'OFF';
            const dummyMode = engine.dummyController?.mode || 'IDLE';

            if (cpuAction !== 'FULL_AI') {
                const dx = target.x - ai.x;
                const isToRight = dx > 0;

                // Handle Dummy Modes when CpuAction is OFF
                if (cpuAction === 'OFF') {
                    switch (dummyMode) {
                        case 'IDLE':
                            return this.inputs; // Stand still

                        case 'MIRROR':
                            if (opponentInput) {
                                this.inputs = { ...opponentInput };
                            }
                            return this.inputs;

                        case 'BLOCK':
                            if (this.trainingBlockActionTimer > 0) {
                                this.trainingBlockActionTimer--;
                            } else {
                                const rand = Math.random();
                                if (rand < 0.05) {
                                    this.trainingCurrentBlockAction = 'DROP';
                                    this.trainingBlockActionTimer = 30 + Math.floor(Math.random() * 30);
                                } else if (rand < 0.10) {
                                    this.trainingCurrentBlockAction = 'ATTACK';
                                    this.trainingBlockActionTimer = 15;
                                } else {
                                    this.trainingCurrentBlockAction = 'BLOCK';
                                    this.trainingBlockActionTimer = 40 + Math.floor(Math.random() * 40);
                                }
                            }

                            if (this.trainingCurrentBlockAction === 'BLOCK') {
                                if (isToRight) {
                                    this.inputs.left = true;
                                } else {
                                    this.inputs.right = true;
                                }
                                this.inputs.block = true;
                            } else if (this.trainingCurrentBlockAction === 'ATTACK') {
                                if (isToRight) {
                                    this.inputs.right = true;
                                } else {
                                    this.inputs.left = true;
                                }
                                this.inputs.light = true;
                            }
                            return this.inputs;

                        case 'JUMP':
                            if (ai.isGrounded) {
                                this.inputs.jump = true;
                            }
                            return this.inputs;

                        case 'CROUCH':
                            if (ai.isGrounded) {
                                this.inputs.down = true;
                            }
                            return this.inputs;
                    }
                }

                // Handle other CpuActions (DEFEND_ALWAYS, COUNTER_ATTACK, REFLECT_BEAM)
                const opponentIsAttacking = target && (
                    target.state === PlayerState.ATTACKING ||
                    target.state === PlayerState.JUMP_ATTACK ||
                    target.state === PlayerState.CROUCH_ATTACK ||
                    target.state === PlayerState.ULTIMATE ||
                    target.state === PlayerState.ULTIMATE_2 ||
                    target.state === PlayerState.SUPER_DASH ||
                    target.state === PlayerState.DRAGON_RUSH ||
                    target.attackTimer > 0
                );

                const incomingProjectile = projectiles && projectiles.some(
                    p => p.ownerId !== ai.id && p.active && Math.abs(p.x - ai.x) < 400
                );

                const shouldBlock = opponentIsAttacking || incomingProjectile;

                switch (cpuAction) {
                    case 'DEFEND_ALWAYS':
                        if (shouldBlock) {
                            if (isToRight) {
                                this.inputs.left = true;
                            } else {
                                this.inputs.right = true;
                            }
                            this.inputs.block = true;
                            if (target && target.state === PlayerState.CROUCH_ATTACK) {
                                this.inputs.down = true;
                            }
                        }
                        break;

                    case 'COUNTER_ATTACK':
                        if (shouldBlock) {
                            if (isToRight) {
                                this.inputs.left = true;
                            } else {
                                this.inputs.right = true;
                            }
                            this.inputs.block = true;
                            if (target && target.state === PlayerState.CROUCH_ATTACK) {
                                this.inputs.down = true;
                            }
                            this.trainingHasBlockedAttack = true;
                        } else if (this.trainingHasBlockedAttack) {
                            this.trainingCounterAttackCooldown = 25;
                            this.trainingHasBlockedAttack = false;
                        }

                        if (this.trainingCounterAttackCooldown > 0) {
                            this.trainingCounterAttackCooldown--;
                            
                            const counterAttackType = engine.dummyController?.counterAttackType || 'LIGHT';
                            if (counterAttackType === 'SPECIAL' && ai.ki < 200) {
                                ai.ki = 200;
                            } else if (counterAttackType === 'ULTIMATE' && ai.ki < 400) {
                                ai.ki = 400;
                            }

                            if (isToRight) {
                                this.inputs.right = true;
                            } else {
                                this.inputs.left = true;
                            }

                            switch (counterAttackType) {
                                case 'LIGHT':
                                    this.inputs.light = true;
                                    break;
                                case 'MEDIUM':
                                    this.inputs.medium = true;
                                    break;
                                case 'HEAVY':
                                    this.inputs.heavy = true;
                                    break;
                                case 'SPECIAL':
                                    this.inputs.special = true;
                                    break;
                                case 'ULTIMATE':
                                    this.inputs.ultimate = true;
                                    break;
                            }
                        }
                        break;

                    case 'REFLECT_BEAM':
                        const approachingBeamOrProj = projectiles && projectiles.find(
                            p => p.ownerId !== ai.id && p.active && Math.abs(p.x - ai.x) < 250
                        );

                        if (approachingBeamOrProj) {
                            if (approachingBeamOrProj.isBeam && ai.ki < 200) {
                                ai.ki = 200;
                            }
                            if (isToRight) {
                                this.inputs.left = true;
                            } else {
                                this.inputs.right = true;
                            }
                            this.inputs.block = true;
                        }
                        break;
                }

                return this.inputs;
            }
        }

        // 2. Defensive Overrides / Hit state
        if (ai.state === PlayerState.HIT || ai.stunTimer > 0) {
            // Use Vanish to break out of enemy combos if we have enough Ki!
            if (ai.ki >= 200 && target.comboCount > 2 && Math.random() < this.profile.defenseSkill * 0.4) {
                this.inputs.vanish = true;
                return this.inputs;
            }

            // Chance to Tag or Burst if available and getting comboed
            if (ai.ki >= 100 && target.comboCount > 3 && Math.random() < this.profile.defenseSkill * 0.1) {
                this.inputs.tag = true;
            }
            return this.inputs;
        }

        // Track target patterns
        this.updateTargetMemory(target);

        const dx = target.x - ai.x;
        const dist = Math.abs(dx);
        const forward = dx > 0 ? 'right' : 'left';
        const backward = dx > 0 ? 'left' : 'right';

        // 3. Execution (Combo continuation)
        const isAttacking = ai.state === PlayerState.ATTACKING || ai.state === PlayerState.JUMP_ATTACK || ai.state === PlayerState.CROUCH_ATTACK;
        if (isAttacking) {
            if (this.handleComboSystem(ai, target, dist, forward)) {
                return this.inputs;
            }
        }

        // 4. Time Delays
        if (this.reactionDelay > 0) {
            this.reactionDelay--;
            this.applyStateInputs(ai, dist, forward, backward); // Keep executing current state 
            return this.inputs;
        }

        if (this.decisionDelayTimer > 0) {
            this.decisionDelayTimer--;
            this.applyStateInputs(ai, dist, forward, backward);
            return this.inputs;
        }

        // 5. Read State & Decide Next Action
        this.decideNextState(ai, target, dist, projectiles);

        // 6. Check for transformations if idle/charging
        if (this.currentState === AIState.IDLE || this.currentState === AIState.CHARGE) {
            if (dist > 250 && ai.ki >= 300) {
                if (Math.random() < 0.05 && ai.data?.transformTo?.length > 0) {
                    this.inputs.transform = true;
                    // Randomly select one of available transformations
                    this.inputs.transformTarget = ai.data.transformTo[Math.floor(Math.random() * ai.data.transformTo.length)];
                }
            }
            if (ai.ki >= 400 && dist > 300) {
                if (Math.random() < 0.02) this.inputs.fusion = true;
            }
        }

        // 7. Apply Filtered Action
        this.applyStateInputs(ai, dist, forward, backward);

        return this.inputs;
    }

    private decideNextState(ai: any, target: any, dist: number, projectiles: any[]) {
        const targetAttacking = target.state === PlayerState.ATTACKING || target.state === PlayerState.CROUCH_ATTACK || target.state === PlayerState.JUMP_ATTACK || target.state === 'SPECIAL' as any;
        const targetWhiffed = targetAttacking && dist > 180;
        const incomingProjectile = projectiles.find(p => p.ownerId !== ai.id && Math.abs(p.x - ai.x) < (this.profile.reactionTime[1] * 15));
        
        let chosenAction: ActionCategory | null = null;
        let newState = this.currentState;

        // Contextual Checks
        
        // 1. Defend
        if ((targetAttacking && dist < 220) || incomingProjectile) {
            if (Math.random() < this.profile.defenseSkill) {
                newState = AIState.DEFEND;
                chosenAction = 'BLOCK';
                // Anti-spam / Burst
                if (ai.ki >= KI_BLAST_COST && dist < 100 && Math.random() < this.profile.defenseSkill * 0.5) {
                    chosenAction = 'SPECIAL'; // Try to interrupt
                }
            } else if (Math.random() < this.profile.errorRate) {
                // Made a mistake, didn't defend
                newState = AIState.IDLE;
                chosenAction = 'IDLE';
            }
        }
        // 2. Punish
        else if (targetWhiffed && Math.random() < this.profile.punishRate) {
            newState = AIState.PUNISH;
            chosenAction = dist > 150 ? 'DASH_FWD' : 'ATTACK_H';
        }
        // 3. Low HP behavior (Retreat/Defensive)
        else if (ai.hp < ai.maxHp * 0.25 && target.hp > target.maxHp * 0.4 && Math.random() < 0.6) {
            newState = AIState.RETREAT;
            chosenAction = 'DASH_BACK';
        }
        // 4. Idle/Openness (simulating human pausing or breather)
        else if (Math.random() < this.profile.openness * 0.1) {
            newState = AIState.IDLE;
            chosenAction = 'IDLE';
        }
        // 5. Neutral Game (Approach, Attack, Charge)
        else {
            const weights = this.generateActionWeights(ai, dist);
            chosenAction = this.selectActionWithAntiRepetition(weights);
            
            if (chosenAction.includes('ATTACK') || chosenAction.includes('SPECIAL') || chosenAction.includes('ULTIMATE') || chosenAction === 'SUPER_DASH') newState = AIState.ATTACK;
            else if (chosenAction === 'DASH_FWD' || chosenAction === 'APPROACH') newState = AIState.APPROACH;
            else if (chosenAction === 'DASH_BACK' || chosenAction === 'RETREAT' || chosenAction === 'VANISH') newState = AIState.RETREAT;
            else if (chosenAction === 'CHARGE') newState = AIState.CHARGE;
            else newState = AIState.IDLE;
        }

        // Mistake override (fat finger / wrong input)
        if (Math.random() < this.profile.errorRate * 0.2 && chosenAction !== 'IDLE') {
             chosenAction = Math.random() > 0.5 ? 'JUMP' : 'ATTACK_L'; // Wrong button
        }

        this.currentState = newState;
        this.trackAction(chosenAction || 'IDLE');
        this.setDecisionDelay(chosenAction === 'IDLE');
    }

    private generateActionWeights(ai: any, dist: number): Record<ActionCategory, number> {
        let weights: Partial<Record<ActionCategory, number>> = {};
        
        // Base weights from aggressiveness
        let agg = this.profile.aggressiveness;

        const hasSpecial2 = ai.data?.skills?.some((s: any) => s.id === 'special_2') || Math.random() < 0.5; // Simulate if we don't rigidly check
        const hasSpecial3 = ai.data?.skills?.some((s: any) => s.id === 'special_3') || Math.random() < 0.3;
        
        if (dist > 300) {
            weights['DASH_FWD'] = 20 * agg;
            weights['APPROACH'] = 25 * agg;
            weights['SUPER_DASH'] = 35 * agg; // Active Super Dash to close neutral distance!
            weights['CHARGE'] = (ai.ki < MAX_KI * 0.5) ? 50 : 0;
            weights['SPECIAL'] = (ai.ki >= KI_BLAST_COST) ? 20 * agg : 0;
            if (ai.ki >= 200 && hasSpecial2) weights['SPECIAL_2'] = 15 * agg;
            weights['DASH_BACK'] = 10 * (1 - agg);
        } else if (dist > 120) {
            weights['DASH_FWD'] = 20 * agg;
            weights['APPROACH'] = 25 * agg;
            weights['SUPER_DASH'] = 25 * agg; // Gap closing Super Dash!
            weights['JUMP'] = 20;
            weights['SPECIAL'] = (ai.ki >= KI_BLAST_COST) ? 30 * agg : 0;
            if (ai.ki >= 200 && hasSpecial2) weights['SPECIAL_2'] = 25 * agg;
            if (ai.ki >= 200 && hasSpecial3) weights['SPECIAL_3'] = 20 * agg;
            weights['ATTACK_H'] = 15; // Try moving heavy
            weights['RETREAT'] = 15 * (1 - agg);
            if (ai.ki >= 200) weights['VANISH'] = 5 * agg; // Mix vanishing
        } else {
            // Close combat Mix-ups
            weights['ATTACK_L'] = 50 * agg;
            weights['ATTACK_M'] = 30 * agg;
            weights['ATTACK_H'] = 15 * agg;
            weights['DASH_BACK'] = 15;
            weights['BLOCK'] = 20 * this.profile.defenseSkill;
            if (ai.ki >= 200) weights['VANISH'] = 10 * agg; // Cross up attempt
            
            // Adapt if they block a lot
            if (this.targetPatternCount.blocks > 6) {
                weights['ATTACK_H'] += 40; // Heavy to break guard / mixup
                weights['DASH_FWD'] += 30; // Try dragon rush/throw equivalent
                weights['ATTACK_L'] -= 20; // Lower basic attacks to avoid getting blocked
            }
        }

        if (ai.ki >= MAX_KI) {
            weights['ULTIMATE'] = dist < 200 ? 50 : 10;
            if (ai.data?.level >= 15) {
                weights['ULTIMATE_2'] = dist < 200 ? 40 : 5;
            }
        }

        if (this.winStreak > 0) {
            const streakBonus = Math.min(1.0, this.winStreak * 0.15);
            if (weights['SUPER_DASH'] !== undefined) weights['SUPER_DASH'] += 15 * streakBonus;
            if (weights['DASH_FWD'] !== undefined) weights['DASH_FWD'] += 10 * streakBonus;
            if (weights['ATTACK_L'] !== undefined) weights['ATTACK_L'] += 10 * streakBonus;
            if (weights['VANISH'] !== undefined) weights['VANISH'] += 8 * streakBonus;
        }

        return weights as Record<ActionCategory, number>;
    }

    private selectActionWithAntiRepetition(weights: Record<ActionCategory, number>): ActionCategory {
        // Remove or penalize recent actions
        const availableActions = { ...weights };
        
        this.actionHistory.forEach((pastAction, idx) => {
            if (availableActions[pastAction]) {
                const recentPenalty = 1 - (0.2 * (this.profile.actionMemorySize - idx)); // more penalty if very recent
                availableActions[pastAction] *= Math.max(0, recentPenalty);
            }
        });

        // Ensure we don't spam the exact last action in hard modes
        if (this.lastAction && this.profile.actionMemorySize > 2 && availableActions[this.lastAction]) {
             availableActions[this.lastAction] *= 0.1; 
        }

        // Pick weighted random
        let sum = 0;
        for (const w of Object.values(availableActions)) sum += w;
        
        if (sum === 0) {
            // No good actions, force IDLE with penalty
            this.decisionDelayTimer += 10; 
            return 'IDLE';
        }

        let rand = Math.random() * sum;
        for (const [action, weight] of Object.entries(availableActions)) {
            if (rand < weight) return action as ActionCategory;
            rand -= weight;
        }
        
        return 'IDLE';
    }

    private applyStateInputs(ai: any, dist: number, forward: string, backward: string) {
        switch (this.lastAction) {
            case 'ATTACK_L': this.inputs.light = true; break;
            case 'ATTACK_M': this.inputs.medium = true; if (Math.random() < 0.3) this.inputs.down = true; break;
            case 'ATTACK_H': this.inputs.heavy = true; break;
            case 'SPECIAL': this.inputs.special = true; break;
            case 'SPECIAL_2': this.inputs.special2 = true; break;
            case 'SPECIAL_3': this.inputs.special3 = true; break;
            case 'ULTIMATE': this.inputs.ultimate = true; break;
            case 'ULTIMATE_2': this.inputs.ultimate2 = true; break;
            case 'DASH_FWD': this.inputs.dash = true; (this.inputs as any)[forward] = true; break;
            case 'DASH_BACK': this.inputs.dash = true; (this.inputs as any)[backward] = true; break;
            case 'APPROACH': (this.inputs as any)[forward] = true; break;
            case 'RETREAT': (this.inputs as any)[backward] = true; break;
            case 'JUMP': this.inputs.jump = true; if (Math.random() > 0.5) (this.inputs as any)[forward] = true; break;
            case 'CHARGE': this.inputs.charge = true; break;
            case 'BLOCK': 
                this.inputs.block = true; 
                (this.inputs as any)[backward] = true; 
                if (Math.random() < 0.4) this.inputs.down = true; // Random low block
                break;
            case 'VANISH': this.inputs.vanish = true; break;
            case 'SUPER_DASH':
                this.inputs.heavy = true;
                this.inputs.special = true;
                break;
        }

        this.handleAssists(ai, dist);
    }

    private lastAssistUsedTime: number = 0;

    private handleAssists(ai: any, dist: number) {
        if (this.lastAssistUsedTime > 0) {
            this.lastAssistUsedTime--;
            return;
        }

        const rand = Math.random();
        let shouldAssist = false;

        switch (this.difficultyLevel) {
            case 'EASY': 
                if (rand < 0.002) shouldAssist = true; 
                break;
            case 'NORMAL':
                if (this.lastAction?.startsWith('ATTACK_') && rand < 0.02) shouldAssist = true;
                break;
            case 'MEDIUM':
                if ((this.lastAction?.startsWith('ATTACK_') || this.lastAction === 'DASH_FWD') && rand < 0.05) shouldAssist = true;
                break;
            case 'HARD':
                if ((this.lastAction?.startsWith('ATTACK_') || this.lastAction === 'DASH_FWD' || this.lastAction === 'SPECIAL') && rand < 0.1) shouldAssist = true;
                break;
            case 'BOSS':
            case 'INSANE':
                if ((this.lastAction?.startsWith('ATTACK_') || this.lastAction === 'DASH_FWD' || this.lastAction === 'APPROACH' || this.lastAction === 'SPECIAL') && rand < 0.2) shouldAssist = true;
                break;
        }

        if (shouldAssist) {
            if (Math.random() > 0.5) this.inputs.assist1 = true;
            else this.inputs.assist2 = true;
            this.lastAssistUsedTime = 60 + Math.random() * 120; // Internal CPU delay between assists (1 to 3 seconds minimum, independent of actual assist cooldown)
        }
    }

    private handleComboSystem(ai: any, target: any, dist: number, forward: string): boolean {
        // Chase opponent during combo if too far away!
        if (dist > 120 && !ai.autoDashUsed) {
            this.inputs.heavy = true;
            this.inputs.special = true;
            return true;
        }

        // Simulated execution drop
        if (!ai.hasHit || Math.random() > this.profile.comboAccuracy) return false;

        // Auto-combo progression logic
        if (ai.comboType === 'LIGHT') {
            if (ai.comboStep < 2) {
                this.inputs.light = true; 
            } else {
                this.inputs.medium = true;
                if (Math.random() > 0.4) this.inputs.down = true; // mix low
            }
        } else if (ai.comboType === 'MEDIUM') {
            if (Math.random() > 0.6) {
                this.inputs.light = true; // reset or trap
            } else {
                this.inputs.heavy = true;
            }
        } else if (ai.comboType === 'HEAVY') {
            // Delay slightly or instant reaction
            if (ai.ki >= 200 && Math.random() < 0.85) {
                const hasSpecial2 = ai.data?.skills?.some((s: any) => s.id === 'special_2');
                const hasSpecial3 = ai.data?.skills?.some((s: any) => s.id === 'special_3');
                
                let choice = Math.random();
                if (hasSpecial3 && choice < 0.2) {
                    this.inputs.special3 = true;
                } else if (hasSpecial2 && choice < 0.5) {
                    this.inputs.special2 = true;
                } else {
                    this.inputs.special = true;
                }
            } else if (ai.ki >= MAX_KI * 0.75 && Math.random() < 0.6) {
                if (ai.data?.level >= 15 && Math.random() < 0.5) {
                    this.inputs.ultimate2 = true;
                } else {
                    this.inputs.ultimate = true;
                }
            }
        } else if (ai.comboType === 'COMBO') {
           this.inputs.light = true; 
        }

        // Randomly vanish for combo extension if plenty of Ki
        if (ai.ki >= 200 && ai.comboStep > 2 && Math.random() < (this.profile.comboAccuracy * 0.2)) {
            this.inputs.vanish = true;
        }

        return true;
    }

    private trackAction(action: ActionCategory) {
        if (action === 'IDLE') return; // Don't track idle to let it decay
        this.lastAction = action;
        this.actionHistory.push(action);
        if (this.actionHistory.length > this.profile.actionMemorySize) {
            this.actionHistory.shift();
        }
    }

    private updateTargetMemory(target: any) {
        if (!target.isGrounded) this.targetPatternCount.jumps++;
        if (target.state === PlayerState.BLOCKING || target.state === PlayerState.BLOCKING_CROUCH || target.state === PlayerState.BLOCKING_AIR) this.targetPatternCount.blocks++;
        if (target.state === PlayerState.ATTACKING || target.state === PlayerState.CROUCH_ATTACK) this.targetPatternCount.attacks++;
        if (target.state === 'SPECIAL' as any) this.targetPatternCount.specials++;

        // Decay
        if (Math.random() < 0.05) {
            this.targetPatternCount.jumps = Math.floor(this.targetPatternCount.jumps * 0.9);
            this.targetPatternCount.blocks = Math.floor(this.targetPatternCount.blocks * 0.9);
            this.targetPatternCount.attacks = Math.floor(this.targetPatternCount.attacks * 0.9);
            this.targetPatternCount.specials = Math.floor(this.targetPatternCount.specials * 0.9);
        }
    }

    private setDecisionDelay(wasIdle: boolean) {
        this.decisionDelayTimer = Math.floor(Math.random() * (this.profile.decisionDelay[1] - this.profile.decisionDelay[0])) + this.profile.decisionDelay[0];
        
        // Add reaction time if we're reacting to something new suddenly (simulated)
        if (Math.random() < 0.3) {
            this.reactionDelay = Math.floor(Math.random() * (this.profile.reactionTime[1] - this.profile.reactionTime[0])) + this.profile.reactionTime[0];
        }
        
        if (wasIdle) {
             this.decisionDelayTimer = Math.floor(this.decisionDelayTimer * 1.5); // Stay idle a bit longer
        }
    }

    private resetInputs() {
        this.inputs = {
            left: false, right: false, up: false, down: false, jump: false,
            light: false, medium: false, heavy: false, special: false,
            special2: false, special3: false, special4: false, special5: false, special6: false,
            block: false, dash: false, charge: false, attack: false, tag: false, ultimate: false, ultimate2: false,
            assist1: false, assist2: false, vanish: false, transform: false, fusion: false, dragonRush: false
        };
    }
}

