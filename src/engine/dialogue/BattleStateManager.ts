// src/engine/dialogue/BattleStateManager.ts
import { Player } from '../../../services/Player';
import { PlayerState } from '../../../types';
import { DialogueManager } from './DialogueManager';
import { VoiceQueue } from './VoiceQueue';
import { EmotionSystem } from './EmotionSystem';
import { OpponentResponseSystem } from './OpponentResponseSystem';
import { BattleEvent, CharacterEmotion } from './types';

export class BattleStateManager {
    private static instance: BattleStateManager;

    // Tracker Flags for States (to prevent constant spamming)
    private matchStartTriggered = false;
    private flagFirstStrikeResolved = false;
    private p1LowHpTriggered = false;
    private p2LowHpTriggered = false;
    private p1DesperateTriggered = false;
    private p2DesperateTriggered = false;
    private p1ComboHighTriggered = false;
    private p2ComboHighTriggered = false;
    private matchPointTriggered = false;

    // Historic detections
    private p1ReversalDone = false;
    private p2ReversalDone = false;
    private p1DominatedDone = false;
    private p2DominatedDone = false;
    private p1OffensiveDone = false;
    private p2OffensiveDone = false;

    // Match historic states
    private p1PrevHp = 0;
    private p2PrevHp = 0;
    private p1PrevKi = 0;
    private p2PrevKi = 0;
    private p1PrevState: PlayerState = PlayerState.INTRO;
    private p2PrevState: PlayerState = PlayerState.INTRO;

    // Idle timers (in frames - 60fps)
    private p1IdleFrames = 0;
    private p2IdleFrames = 0;

    // Winning sequences
    private gameOverDone = false;

    private constructor() {}

    public static getInstance(): BattleStateManager {
        if (!BattleStateManager.instance) {
            BattleStateManager.instance = new BattleStateManager();
        }
        return BattleStateManager.instance;
    }

    public reset() {
        this.matchStartTriggered = false;
        this.flagFirstStrikeResolved = false;
        this.p1LowHpTriggered = false;
        this.p2LowHpTriggered = false;
        this.p1DesperateTriggered = false;
        this.p2DesperateTriggered = false;
        this.p1ComboHighTriggered = false;
        this.p2ComboHighTriggered = false;
        this.matchPointTriggered = false;

        this.p1ReversalDone = false;
        this.p2ReversalDone = false;
        this.p1DominatedDone = false;
        this.p2DominatedDone = false;
        this.p1OffensiveDone = false;
        this.p2OffensiveDone = false;

        this.p1PrevHp = 0;
        this.p2PrevHp = 0;
        this.p1PrevKi = 0;
        this.p2PrevKi = 0;
        this.p1PrevState = PlayerState.INTRO;
        this.p2PrevState = PlayerState.INTRO;

        this.p1IdleFrames = 0;
        this.p2IdleFrames = 0;
        this.gameOverDone = false;
        VoiceQueue.getInstance().clear();
    }

    /**
     * Feeds active engine ticks to context scanners. Runs at 60fps but optimized with gateways to keep mobile load at 0%.
     */
    public tick(
        player1: Player,
        player2: Player,
        introPhase: string,
        isTraining: boolean,
        timerVal: number,
        isGameOver: boolean,
        winnerNum: number | null
    ) {
        // Guard allocations
        if (!player1 || !player2) return;

        // Initialize historical reference indicators on first load
        if (this.p1PrevHp === 0 && this.p2PrevHp === 0) {
            this.p1PrevHp = player1.hp;
            this.p2PrevHp = player2.hp;
            this.p1PrevKi = player1.ki;
            this.p2PrevKi = player2.ki;
            this.p1PrevState = player1.state;
            this.p2PrevState = player2.state;
            return;
        }

        // --- GAME OVER DETECTION ---
        if (isGameOver && !this.gameOverDone) {
            this.gameOverDone = true;
            this.triggerMatchEnd(player1, player2, winnerNum);
            return;
        }

        // --- ROUND INTRO / START MOOD TRANSITION ---
        if ((introPhase === 'P1_INTRO' || introPhase === 'P2_INTRO' || introPhase === 'FIGHT') && !this.matchStartTriggered) {
            this.matchStartTriggered = true;
            this.triggerSpeech(player1, player2, BattleEvent.MATCH_START, 1);
        }

        // Skip standard game event telemetry if we are still waiting in readiness modes
        if (introPhase !== 'FIGHT') {
            return;
        }

        // --- FIRST STRIKE & HEALTH TELEMETRY ANALYSIS ---
        this.analyzeHealth(player1, player2);

        // --- KI MOVEMENT TELEMETRY ---
        this.analyzeKi(player1, player2);

        // --- IDLE COUNTERS ---
        this.analyzeIdles(player1, player2);

        // --- COMBO MOUNT COUNTS & REVERSAL / DOMINATION ---
        this.analyzeCombos(player1, player2);

        // --- STATE TRANSTIONS (Ultimate interrupt, transformation, cancels) ---
        this.analyzeTransitions(player1, player2);

        // --- TIME REMAINING CHECKS ---
        if (timerVal <= 15 && timerVal > 0 && Math.random() < 0.005) {
            // Trigger speech for whoever has equal or lower health reflecting tension
            if (player1.hp <= player2.hp) {
                this.triggerSpeech(player1, player2, BattleEvent.TIME_RUNNING_OUT, 1);
            } else {
                this.triggerSpeech(player2, player1, BattleEvent.TIME_RUNNING_OUT, 2);
            }
        }

        // Store past values for differential scanning
        this.p1PrevHp = player1.hp;
        this.p2PrevHp = player2.hp;
        this.p1PrevKi = player1.ki;
        this.p2PrevKi = player2.ki;
        this.p1PrevState = player1.state;
        this.p2PrevState = player2.state;
    }

    /**
     * Reports specialized custom action executions (transform, ultimate, perfect defense) externally from game hooks
     */
    public reportAction(player: Player, opponent: Player, event: BattleEvent, playerNum: 1 | 2) {
        this.triggerSpeech(player, opponent, event, playerNum);
    }

    private analyzeHealth(player1: Player, player2: Player) {
        const p1Damage = this.p1PrevHp - player1.hp;
        const p2Damage = this.p2PrevHp - player2.hp;

        // --- FIRST STRIKE RESOLUTION ---
        if (!this.flagFirstStrikeResolved) {
            if (p1Damage > 0) {
                this.flagFirstStrikeResolved = true;
                this.triggerSpeech(player2, player1, BattleEvent.FIRST_STRIKE, 2);
            } else if (p2Damage > 0) {
                this.flagFirstStrikeResolved = true;
                this.triggerSpeech(player1, player2, BattleEvent.FIRST_STRIKE, 1);
            }
        }

        // --- CRITICAL DAMAGE RECOGNITION ---
        if (p1Damage > (player1.maxHp * 0.22)) {
            this.triggerSpeech(player1, player2, BattleEvent.CRITICAL_DAMAGE, 1);
        }
        if (p2Damage > (player2.maxHp * 0.22)) {
            this.triggerSpeech(player2, player1, BattleEvent.CRITICAL_DAMAGE, 2);
        }

        // --- LOW HEALTH STATES (<30%) ---
        if (player1.hp < (player1.maxHp * 0.3) && !this.p1LowHpTriggered) {
            this.p1LowHpTriggered = true;
            this.triggerSpeech(player1, player2, BattleEvent.LOW_HP_SELF, 1);
            // Opponent detects self low hp as opponent low hp
            this.triggerSpeech(player2, player1, BattleEvent.LOW_HP_OPPONENT, 2, 800);
        }
        if (player2.hp < (player2.maxHp * 0.3) && !this.p2LowHpTriggered) {
            this.p2LowHpTriggered = true;
            this.triggerSpeech(player2, player1, BattleEvent.LOW_HP_SELF, 2);
            this.triggerSpeech(player1, player2, BattleEvent.LOW_HP_OPPONENT, 1, 800);
        }

        // --- DESPERATE HP CONDITIONS (<15%) ---
        if (player1.hp < (player1.maxHp * 0.15) && !this.p1DesperateTriggered) {
            this.p1DesperateTriggered = true;
            this.triggerSpeech(player1, player2, BattleEvent.DESPERATE_MODE_ENTER, 1);
        }
        if (player2.hp < (player2.maxHp * 0.15) && !this.p2DesperateTriggered) {
            this.p2DesperateTriggered = true;
            this.triggerSpeech(player2, player1, BattleEvent.DESPERATE_MODE_ENTER, 2);
        }

        // --- MATCH POINT (<7% health) ---
        if ((player1.hp < (player1.maxHp * 0.08) || player2.hp < (player2.maxHp * 0.08)) && !this.matchPointTriggered) {
            this.matchPointTriggered = true;
            if (player1.hp < player2.hp) {
                this.triggerSpeech(player1, player2, BattleEvent.MATCH_POINT, 1);
            } else {
                this.triggerSpeech(player2, player1, BattleEvent.MATCH_POINT, 2);
            }
        }
    }

    private analyzeKi(player1: Player, player2: Player) {
        // Charging ki detection
        if (player1.ki > this.p1PrevKi && player1.state === PlayerState.CHARGING && Math.random() < 0.003) {
            this.triggerSpeech(player1, player2, BattleEvent.CHARGING_KI, 1);
        }
        if (player2.ki > this.p2PrevKi && player2.state === PlayerState.CHARGING && Math.random() < 0.003) {
            this.triggerSpeech(player2, player1, BattleEvent.CHARGING_KI, 2);
        }

        // Emptied Ki state detection
        if (player1.ki === 0 && this.p1PrevKi > 0) {
            this.triggerSpeech(player1, player2, BattleEvent.NO_KI, 1);
        }
        if (player2.ki === 0 && this.p2PrevKi > 0) {
            this.triggerSpeech(player2, player1, BattleEvent.NO_KI, 2);
        }
    }

    private analyzeIdles(player1: Player, player2: Player) {
        // Idle is detected when player is in stand/idle state and not receiving hits
        const p1Idle = player1.stunTimer <= 0 && player1.freezeTimer <= 0 && !player1.ataque;
        const p2Idle = player2.stunTimer <= 0 && player2.freezeTimer <= 0 && !player2.ataque;

        if (p1Idle) {
            this.p1IdleFrames++;
            if (this.p1IdleFrames > 360) { // 6 seconds in idle
                this.p1IdleFrames = 0;
                this.triggerSpeech(player1, player2, BattleEvent.LONG_IDLE, 1);
            }
        } else {
            this.p1IdleFrames = 0;
        }

        if (p2Idle) {
            this.p2IdleFrames++;
            if (this.p2IdleFrames > 360) {
                this.p2IdleFrames = 0;
                this.triggerSpeech(player2, player1, BattleEvent.LONG_IDLE, 2);
            }
        } else {
            this.p2IdleFrames = 0;
        }
    }

    private analyzeCombos(player1: Player, player2: Player) {
        // --- COMBO HIGH DETECTION ---
        if (player1.comboCount > 10 && !this.p1ComboHighTriggered) {
            this.p1ComboHighTriggered = true;
            this.triggerSpeech(player1, player2, BattleEvent.COMBO_HIGH, 1);
        } else if (player1.comboCount === 0) {
            this.p1ComboHighTriggered = false;
        }

        if (player2.comboCount > 10 && !this.p2ComboHighTriggered) {
            this.p2ComboHighTriggered = true;
            this.triggerSpeech(player2, player1, BattleEvent.COMBO_HIGH, 2);
        } else if (player2.comboCount === 0) {
            this.p2ComboHighTriggered = false;
        }

        // --- REVERSAL DETECTION ---
        // Was critical low HP (<25%), now landing a strong combo chain of > 6 hits
        if (player1.hp < (player1.maxHp * 0.25) && player1.comboCount >= 6 && !this.p1ReversalDone) {
            this.p1ReversalDone = true;
            this.triggerSpeech(player1, player2, BattleEvent.REVERSAL, 1);
        }
        if (player2.hp < (player2.maxHp * 0.25) && player2.comboCount >= 6 && !this.p2ReversalDone) {
            this.p2ReversalDone = true;
            this.triggerSpeech(player2, player1, BattleEvent.REVERSAL, 2);
        }

        // --- BEING DOMINATED & LONG OFFENSIVE ---
        if (player1.comboCount >= 8 && !this.p1OffensiveDone) {
            this.p1OffensiveDone = true;
            this.triggerSpeech(player1, player2, BattleEvent.LONG_OFFENSIVE_SEQUENCE, 1);
            if (!this.p2DominatedDone) {
                this.p2DominatedDone = true;
                this.triggerSpeech(player2, player1, BattleEvent.BEING_DOMINATED, 2, 700);
            }
        } else if (player1.comboCount === 0) {
            this.p1OffensiveDone = false;
            this.p2DominatedDone = false;
        }

        if (player2.comboCount >= 8 && !this.p2OffensiveDone) {
            this.p2OffensiveDone = true;
            this.triggerSpeech(player2, player1, BattleEvent.LONG_OFFENSIVE_SEQUENCE, 2);
            if (!this.p1DominatedDone) {
                this.p1DominatedDone = true;
                this.triggerSpeech(player1, player2, BattleEvent.BEING_DOMINATED, 1, 700);
            }
        } else if (player2.comboCount === 0) {
            this.p2OffensiveDone = false;
            this.p1DominatedDone = false;
        }
    }

    private analyzeTransitions(player1: Player, player2: Player) {
        // --- TRANSFORMATION ---
        if (player1.state === PlayerState.TRANSFORM && this.p1PrevState !== PlayerState.TRANSFORM) {
            this.triggerSpeech(player1, player2, BattleEvent.TRANSFORMATION, 1);
        }
        if (player2.state === PlayerState.TRANSFORM && this.p2PrevState !== PlayerState.TRANSFORM) {
            this.triggerSpeech(player2, player1, BattleEvent.TRANSFORMATION, 2);
        }

        // --- ULTIMATE INTERRUPT / CANCELS ---
        // If player was in ULTIMATE, and is suddenly stunned (hit), it means Ultimate was interrupted!
        if (this.p1PrevState === PlayerState.ULTIMATE && player1.state !== PlayerState.ULTIMATE && player1.stunTimer > 0) {
            this.triggerSpeech(player1, player2, BattleEvent.ULTIMATE_INTERRUPT, 1);
        }
        if (this.p2PrevState === PlayerState.ULTIMATE && player2.state !== PlayerState.ULTIMATE && player2.stunTimer > 0) {
            this.triggerSpeech(player2, player1, BattleEvent.ULTIMATE_INTERRUPT, 2);
        }
    }

    private triggerMatchEnd(player1: Player, player2: Player, winnerNum: number | null) {
        if (winnerNum === 1) {
            const isPerfect = player1.hp === player1.maxHp;
            const event = isPerfect ? BattleEvent.PERFECT_WIN : BattleEvent.VICTORY;
            this.triggerSpeech(player1, player2, event, 1);
            this.triggerSpeech(player2, player1, BattleEvent.DEFEAT, 2, 1000); // Trigger opponent defeat dialogue slightly delayed
        } else if (winnerNum === 2) {
            const isPerfect = player2.hp === player2.maxHp;
            const event = isPerfect ? BattleEvent.PERFECT_WIN : BattleEvent.VICTORY;
            this.triggerSpeech(player2, player1, event, 2);
            this.triggerSpeech(player1, player2, BattleEvent.DEFEAT, 1, 1000);
        }
    }

    /**
     * Standard internal routine playing dialog sentences and notifying interactive answer engine
     */
    private triggerSpeech(
        speaker: Player,
        listener: Player,
        event: BattleEvent,
        playerNum: 1 | 2,
        delayMs = 0
    ) {
        const routine = () => {
            const emo = EmotionSystem.getInstance().determineEmotion(speaker, listener);
            const quote = DialogueManager.getInstance().getRelationReaction(speaker.data.id, listener.data.id, event);

            if (!quote) return;

            const success = VoiceQueue.getInstance().requestSpeech(
                speaker.data.id,
                speaker.data.name,
                quote,
                playerNum,
                emo
            );

            if (success) {
                // Pass dialog output to Opponent Response system to check for matching response/retort dialogue
                OpponentResponseSystem.getInstance().handleOpponentReaction(speaker, listener, playerNum, event, quote);
            }
        };

        if (delayMs > 0) {
            setTimeout(routine, delayMs);
        } else {
            routine();
        }
    }
}
export default BattleStateManager;
