// src/engine/dialogue/EmotionSystem.ts
import { CharacterEmotion } from './types';
import { Player } from '../../../services/Player';

export class EmotionSystem {
    private static instance: EmotionSystem;

    private constructor() {}

    public static getInstance(): EmotionSystem {
        if (!EmotionSystem.instance) {
            EmotionSystem.instance = new EmotionSystem();
        }
        return EmotionSystem.instance;
    }

    /**
     * Determines emotion state for a player dynamically based on battle telemetry
     */
    public determineEmotion(player: Player, opponent: Player): CharacterEmotion {
        const selfLifePercent = player.hp / player.maxHp;
        const oppLifePercent = opponent.hp / opponent.maxHp;

        // Desperate status
        const isBeingComboed = player.stunTimer > 0 || player.freezeTimer > 0;
        if (selfLifePercent < 0.3) {
            if (isBeingComboed || opponent.ataque) {
                return CharacterEmotion.DESPERATE;
            }
            return CharacterEmotion.EXHAUSTED;
        }

        // Confident status
        if (oppLifePercent < 0.3 && selfLifePercent > 0.6) {
            return CharacterEmotion.CONFIDENT;
        }

        // Angry status
        if (isBeingComboed && selfLifePercent < 0.6) {
            return CharacterEmotion.ANGRY;
        }

        // Aggressive status
        if (player.ataque || player.ki > 80) {
            return CharacterEmotion.AGGRESSIVE;
        }

        // Default Calm status
        return CharacterEmotion.CALM;
    }
}
