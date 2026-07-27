// src/engine/dialogue/OpponentResponseSystem.ts
import { RelationshipSystem } from './RelationshipSystem';
import { DialogueManager } from './DialogueManager';
import { VoiceQueue } from './VoiceQueue';
import { RelationshipType, BattleEvent, CharacterEmotion, DialogueQuote } from './types';
import { Player } from '../../../services/Player';

export class OpponentResponseSystem {
    private static instance: OpponentResponseSystem;

    private constructor() {}

    public static getInstance(): OpponentResponseSystem {
        if (!OpponentResponseSystem.instance) {
            OpponentResponseSystem.instance = new OpponentResponseSystem();
        }
        return OpponentResponseSystem.instance;
    }

    /**
     * Examines a recently triggered quote, and schedules an automatic retort/reaction from the opponent actor
     */
    public handleOpponentReaction(
        speakerPlayer: Player,
        listenerPlayer: Player,
        speakerNum: 1 | 2,
        triggerEvent: BattleEvent,
        quote: DialogueQuote
    ) {
        // Responses only occur for higher interactive situations: Start of match, Ultimates, Low HP, Charging, Taunts/Idles, etc.
        const responseWhiteList = [
            BattleEvent.MATCH_START,
            BattleEvent.ULTIMATE,
            BattleEvent.ULTIMATE_2,
            BattleEvent.ULTIMATE_3,
            BattleEvent.TRANSFORMATION,
            BattleEvent.LONG_IDLE,
            BattleEvent.LOW_HP_SELF,
            BattleEvent.DESPERATE_MODE_ENTER
        ];

        if (!responseWhiteList.includes(triggerEvent)) return;

        // 35% chance to trigger unless it's MATCH_START which has a 95% response chance for cinematic intro dialogue
        const hasDirectRetort = !!this.getDirectRetort(speakerPlayer.data.id, quote, listenerPlayer.data.id);
        const chance = triggerEvent === BattleEvent.MATCH_START ? 0.98 : (hasDirectRetort ? 0.85 : 0.40);
        if (Math.random() > chance) return;

        // Schedule reaction slightly delayed (e.g. 1.8 to 2.5 seconds after) to let the spoken quote end
        const delay = triggerEvent === BattleEvent.MATCH_START ? 2400 : 1800;

        setTimeout(() => {
            const rEsc = EmotionSystem_mock_getEmotion(listenerPlayer, speakerPlayer);

            // Try to find a highly personalized direct reply
            let responseQuote = this.getDirectRetort(speakerPlayer.data.id, quote, listenerPlayer.data.id);

            if (!responseQuote) {
                let reactionEvent = BattleEvent.CLASH; // standard reactive fallback

                if (triggerEvent === BattleEvent.MATCH_START) {
                    reactionEvent = BattleEvent.MATCH_START;
                } else if (triggerEvent === BattleEvent.ULTIMATE || triggerEvent === BattleEvent.ULTIMATE_2 || triggerEvent === BattleEvent.ULTIMATE_3) {
                    reactionEvent = BattleEvent.BEING_DOMINATED;
                } else if (triggerEvent === BattleEvent.LONG_IDLE) {
                    reactionEvent = BattleEvent.COUNTER_ATTACK;
                } else if (triggerEvent === BattleEvent.LOW_HP_SELF) {
                    reactionEvent = BattleEvent.LOW_HP_OPPONENT;
                }

                // Fetch generic or relational fallback
                responseQuote = DialogueManager.getInstance().getQuote(listenerPlayer.data.id, reactionEvent, rEsc);
            }

            if (!responseQuote) return;

            const listenerNum = speakerNum === 1 ? 2 : 1;
            VoiceQueue.getInstance().requestSpeech(
                listenerPlayer.data.id,
                listenerPlayer.data.name,
                responseQuote,
                listenerNum,
                rEsc
            );
        }, delay);
    }

    /**
     * Resolves a character's ID to its canonical standard form
     */
    private resolveCanonicalId(id: string): string {
        const lower = id.toLowerCase();
        if (lower.includes('goku_black') || lower.includes('black')) return 'goku_black';
        if (lower.includes('goku') || lower.includes('gokubase') || lower.includes('gokumui') || lower.includes('gokublue') || lower.includes('gokussj')) return 'goku_base';
        if (lower.includes('vegeta') || lower.includes('vegetabase') || lower.includes('vegetaego')) return 'vegeta_base';
        if (lower.includes('trunks')) return 'trunks';
        return lower;
    }

    /**
     * Provides a highly specific retort "à altura" to what the speaker player said
     */
    public getDirectRetort(
        speakerId: string,
        quote: DialogueQuote,
        listenerId: string
    ): DialogueQuote | null {
        const speaker = this.resolveCanonicalId(speakerId);
        const listener = this.resolveCanonicalId(listenerId);
        const qId = quote.id.toLowerCase();

        // 1. VEGETA speaking -> GOKU response
        if (speaker === 'vegeta_base' && listener === 'goku_base') {
            if (qId.includes('kakaroto_vamos_lutar') || qId.includes('hora_ate_que_enfim_kakaroto')) {
                // "Kakaroto, vamos lutar você e eu!" -> "Beleza, vamos nessa!" or "Já que insiste, vamos lá!"
                return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.MATCH_START) || null;
            }
            if (qId.includes('rival_n__o_me_fa__a_rir') || qId.includes('rival_nao_me_faca_rir') || qId.includes('rival_')) {
                // "Você acha que é meu rival? Não me faça rir!" -> "Eu não vou perder!" or "Agora sim ficou interessante!"
                return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.REVERSAL) || null;
            }
            if (qId.includes('principe') || qId.includes('pr_ncipe')) {
                // "Principe..." -> "Vamos dar nosso máximo nessa luta!"
                return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.MATCH_START) || null;
            }
            if (qId.includes('vencer') || qId.includes('miseravel') || qId.includes('irritado')) {
                // Vegeta in rage/pain -> Goku: "Não desista agora!" or "Sei que você ainda tem mais fogo!"
                return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.LOW_HP_OPPONENT) || null;
            }
        }

        // 2. GOKU speaking -> VEGETA response
        if (speaker === 'goku_base' && listener === 'vegeta_base') {
            if (qId === 'gb_start_3') {
                // "Vamos começar nosso bate-papo!" -> Vegeta cuts him off: "Pare de ficar falando e vamos lutar de uma vez!"
                const idleQuotes = DialogueManager.getInstance().getCharacterQuotes('vegeta', BattleEvent.LONG_IDLE);
                const shutUpQuote = idleQuotes.find(q => q.id.includes('pare_de_ficar_falando') || q.textPt.includes('Pare de ficar falando'));
                if (shutUpQuote) return shutUpQuote;
                return DialogueManager.getInstance().getQuote('vegeta_base', BattleEvent.LONG_IDLE) || null;
            }
            if (qId === 'gb_start_1') {
                // "Acredito que tenha ficado mais forte, mas eu também..." -> "Vou te mostrar o abismo..."
                return DialogueManager.getInstance().getQuote('vegeta_base', BattleEvent.MATCH_START) || null;
            }
            if (qId.includes('gb_idle') || qId.includes('gb_lowopp_1')) {
                // Idles -> "Seu covarde de quinta categoria!" or "Vamos deixar de enrolação!"
                return DialogueManager.getInstance().getQuote('vegeta_base', BattleEvent.LONG_IDLE) || null;
            }
        }

        // 3. GOKU BLACK speaking -> GOKU or VEGETA response
        if (speaker === 'goku_black') {
            if (listener === 'goku_base') {
                if (qId.includes('bk_start_3') || qId.includes('mortal')) {
                    // "Pretende mesmo me enfrentar?" or "Mortal..." -> "Eu não vou perder!"
                    return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.REVERSAL) || null;
                }
                if (qId.includes('eliminar')) {
                    return DialogueManager.getInstance().getQuote('goku_base', BattleEvent.MATCH_START) || null;
                }
            }
            if (listener === 'vegeta_base') {
                if (qId.includes('mortal') || qId.includes('parasita') || qId.includes('exterminados')) {
                    // "Parasitas" / "Mortais" -> Vegeta: "Insolente!" or "Miserável!"
                    return DialogueManager.getInstance().getQuote('vegeta_base', BattleEvent.CRITICAL_DAMAGE) || null;
                }
            }
        }

        // 4. GOKU BLACK speaking -> TRUNKS response
        if (speaker === 'goku_black' && listener === 'trunks') {
            if (qId.includes('bk_start_1') || qId.includes('eliminar')) {
                // Black: "Vou eliminar..." -> Trunks: "Não vou permitir que destrua esta era!"
                return DialogueManager.getInstance().getQuote('trunks', BattleEvent.MATCH_START) || null;
            }
            if (qId.includes('rapaz') || qId.includes('proteger') || qId.includes('protect')) {
                // Black: "Não era você que protegeria..." -> Trunks: "Eu nunca me entregarei ao desespero!"
                return DialogueManager.getInstance().getQuote('trunks', BattleEvent.DESPERATE_MODE_ENTER) || null;
            }
        }

        // 5. TRUNKS speaking -> GOKU BLACK response
        if (speaker === 'trunks' && listener === 'goku_black') {
            if (qId.includes('tr_start_1') || qId.includes('tr_start_2')) {
                // "Vou proteger..." -> Black: "Pretende mesmo me enfrentar?"
                return DialogueManager.getInstance().getQuote('goku_black', BattleEvent.MATCH_START) || null;
            }
            if (qId.includes('esperança') || qId.includes('paz')) {
                // "Esperança..." -> Black: "Você realmente não passa de um mortal."
                return DialogueManager.getInstance().getQuote('goku_black', BattleEvent.COMBO_HIGH) || null;
            }
        }

        return null;
    }
}

// Inline helper to prevent circular dependency
function EmotionSystem_mock_getEmotion(player: Player, opponent: Player): CharacterEmotion {
    const life = player.hp / player.maxHp;
    if (life < 0.3) return CharacterEmotion.DESPERATE;
    if (opponent.hp / opponent.maxHp < 0.3) return CharacterEmotion.CONFIDENT;
    return CharacterEmotion.CALM;
}
