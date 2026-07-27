// src/engine/dialogue/DialogueManager.ts
import { DialogueQuote, DialogueBank, BattleEvent, CharacterEmotion } from './types';
import { LanguageManager } from '../../../services/LanguageManager';
import { VoiceQueue } from './VoiceQueue';

export class DialogueManager {
    private static instance: DialogueManager;
    private database: Record<string, DialogueBank>;

    private constructor() {
        this.database = {};
        this.initializeDatabase();
    }

    public static getInstance(): DialogueManager {
        if (!DialogueManager.instance) {
            DialogueManager.instance = new DialogueManager();
        }
        return DialogueManager.instance;
    }

    /**
     * Normalize Goku voice lines to point to the new flat repository commit 22e867b6e41daae6bc1c85a779510b91f88de736
     */
    private normalizeVoiceKey(voiceKey: string | undefined): string | undefined {
        if (!voiceKey) return voiceKey;
        if (
            voiceKey.includes("DUBLAGEM/GOKU%20BASE") ||
            voiceKey.includes("DUBLAGEM/GOKU BASE") ||
            voiceKey.includes("DUBLAGEM/GOKU%20SSJ") ||
            voiceKey.includes("DUBLAGEM/GOKU SSJ") ||
            voiceKey.includes("DUBLAGEM/GOKU%20BLUE") ||
            voiceKey.includes("DUBLAGEM/GOKU BLUE") ||
            voiceKey.includes("DUBLAGEM/GOKU%20MUI") ||
            voiceKey.includes("DUBLAGEM/GOKU MUI")
        ) {
            const parts = voiceKey.split('/');
            let fileName = parts[parts.length - 1];
            // Normalize DANO CONTINUO (2) to DANO CONTINUO since there is only one in the new flat list
            if (fileName.includes("DANO%20CONTINUO%20(2)") || fileName.includes("DANO CONTINUO (2)")) {
                fileName = "DANO%20CONTINUO.wav";
            }
            return `/Assets/SONS/DUBLAGEM/GOKU%20BASE/${fileName}`;
        }
        return voiceKey;
    }

    /**
     * Build standard quotes database
     */
    private initializeDatabase() {
        // Helper to construct quotes
        const q = (
            id: string, 
            pt: string, 
            en: string, 
            priority: number = 2, 
            rarity: 'COMMON' | 'RARE' | 'LEGENDARY' = 'COMMON',
            emotion: CharacterEmotion = CharacterEmotion.CALM,
            voiceKey?: string
        ): DialogueQuote => ({
            id,
            textPt: pt,
            textEn: en,
            priority,
            rarity,
            emotion,
            voiceKey: this.normalizeVoiceKey(voiceKey)
        });

        // --- GOKU ---
        this.database['goku'] = {
            characterId: 'goku',
            quotes: this.makeCharacterQuotes('goku', {
                MATCH_START: [
                    q('gk_start_1', "Estou empolgado para lutar com você!", "I'm so excited to fight you!"),
                    q('gk_start_2', "Mostre-me tudo de que você é capaz!", "Show me everything you're capable of!"),
                    q('gk_start_rare', "Promete que não vai pegar leve comigo?", "Promise you won't hold back on me?", 3, 'RARE')
                ],
                FIRST_STRIKE: [
                    q('gk_first_1', "Opa! Rápido demais?", "Whoops! Too fast?"),
                    q('gk_first_2', "Peguei você!", "Gotcha!")
                ],
                CLASH: [
                    q('gk_clash_1', "Isso é incrível!", "This is amazing!"),
                    q('gk_clash_2', "Sim, continue assim!", "Yeah, keep it up!")
                ],
                COMBO_HIGH: [
                    q('gk_combo_1', "Você não consegue acompanhar?", "Can't keep up?"),
                    q('gk_combo_2', "Essa é a força do meu treino!", "This is the power of my training!")
                ],
                TRANSFORMATION: [
                    q('gk_trans_1', "Este é o Super Saiyajin!", "This is the Super Saiyan!"),
                    q('gk_trans_2', "Eu fui ainda mais além!", "I've gone even further beyond!")
                ],
                ULTIMATE: [
                    q('gk_ult_1', "ESTE É O MEU GOLPE MÁXIMO! KAMEHAMEHA!", "THIS IS MY ULTIMATE ATTACK! KAMEHAMEHA!", 5),
                    q('gk_ult_2', "Por favor, porção da Terra... Me dê toda a sua energia!", "Please, people of Earth... Lend me all your energy!", 5)
                ],
                LOW_HP_SELF: [
                    q('gk_lowself_1', "Cara, você é muito forte mesmo...", "Man, you really are incredibly strong...", 3, 'COMMON', CharacterEmotion.EXHAUSTED),
                    q('gk_lowself_2', "Minhas pernas estão pesadas...", "My legs are getting heavy...", 3, 'COMMON', CharacterEmotion.EXHAUSTED)
                ],
                LOW_HP_OPPONENT: [
                    q('gk_lowopp_1', "Sei que você ainda tem mais fogo que isso!", "I know you've got more fire in you!"),
                    q('gk_lowopp_2', "Não desista agora!", "Don't give up now!")
                ],
                REVERSAL: [
                    q('gk_reversal_1', "Agora é a minha vez de atacar!", "Now it's my turn to strike!"),
                    q('gk_reversal_rare', "Nunca dessubestime o poder dos humanos!", "Never underestimate the power of humans!", 4, 'RARE')
                ],
                VICTORY: [
                    q('gk_win_1', "Ufa! Essa foi uma das melhores batalhas!", "Wew! That was one of the best battles!"),
                    q('gk_win_2', "Obrigado pela luta. Vamos treinar mais!", "Thanks for the fight! Let's both train harder!")
                ],
                DEFEAT: [
                    q('gk_loss_1', "Haha... Você me superou por completo...", "Haha... You completely outclassed me..."),
                    q('gk_loss_2', "Não acredito que perdi...", "I can't believe I lost...")
                ],
                TIME_RUNNING_OUT: [
                    q('gk_time_1', "Temos que terminar isso logo!", "We've got to finish this quickly!")
                ],
                LONG_IDLE: [
                    q('gk_idle_1', "O que foi? Tá cansado de lutar?", "What's wrong? Tired of fighting?")
                ],
                BEING_DOMINATED: [
                    q('gk_dom_1', "Que força impressionante...!", "What impressive power...!"),
                    q('gk_dom_2', "Não consigo respirar...", "I can barely breathe...")
                ],
                CRITICAL_DAMAGE: [
                    q('gk_crit_1', "ARRGH! Que pancada!", "ARRGH! What a hit!", 3)
                ],
                PERFECT_GUARD: [
                    q('gk_guard_1', "Essa passou perto!", "That was a close one!")
                ],
                COUNTER_ATTACK: [
                    q('gk_counter_1', "Te peguei desprevenido!", "Caught you off guard!")
                ],
                KNOCKBACK_RECOVERY: [
                    q('gk_knock_1', "Ainda não acabei!", "I'm not done yet!")
                ],
                DESPERATE_MODE_ENTER: [
                    q('gk_desp_1', "Eu... eu não vou vacilar! Por todos que confiam em mim!", "I... I will not falter! For everyone trusting me!", 3, 'COMMON', CharacterEmotion.DESPERATE)
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('gk_off_1', "Lá vou eu, com tudo!", "Here I come, with everything!")
                ],
                NO_KI: [
                    q('gk_noki_1', "Meu Ki... secou por completo...", "My Ki... is completely dried out...")
                ],
                CHARGING_KI: [
                    q('gk_charge_1', "HAAAAAH! ME DÊ MAIS PODER!", "HAAAAAH! GIVE ME MORE POWER!")
                ],
                COMBO_CANCEL: [
                    q('gk_cancel_1', "Mudei de estratégia!", "Changed strategy!")
                ],
                ULTIMATE_INTERRUPT: [
                    q('gk_ultint_1', "Droga, ele previu meu golpe!", "Dammit, he foresaw my strike!", 4)
                ],
                MATCH_POINT: [
                    q('gk_mp_1', "A última parte! Vamos dar o nosso melhor!", "The final round! Let's give it our best!")
                ],
                PERFECT_WIN: [
                    q('gk_perfect_1', "Estou espantado! Nem sequer me arranhou!", "I'm amazed! You didn't even scratch me!", 4, 'LEGENDARY')
                ]
            })
        };

        // --- VEGETA ---
        this.database['vegeta'] = {
            characterId: 'vegeta',
            quotes: this.makeCharacterQuotes('vegeta', {
                MATCH_START: [
                    q('vg_start_1', "Eu sou o Príncipe de todos os Saiyajins!", "I am the Prince of all Saiyans!"),
                    q('vg_start_2', "Vou te mostrar o abismo intransponível entre nós!", "I will show you the insurmountable abyss between us!"),
                    q('vg_start_rare', "Ajoelhe-se diante do seu pior pesadelo!", "Kneel down before your worst nightmare!", 3, 'RARE')
                ],
                FIRST_STRIKE: [
                    q('vg_first_1', "Muito lento! Verme arrogante!", "Too slow! You arrogant worm!"),
                    q('vg_first_2', "Tome isso!", "Take that!")
                ],
                CLASH: [
                    q('vg_clash_1', "Pensa que pode igualar minha força?!", "Think you can match my strength?!"),
                    q('vg_clash_2', "Insolente!", "Impudent fool!")
                ],
                COMBO_HIGH: [
                    q('vg_combo_1', "Você não passa de um saco de pancadas!", "You're nothing but a punching bag!"),
                    q('vg_combo_2', "Estes são os golpes da verdadeira elite!", "These are the strikes of the true elite!")
                ],
                TRANSFORMATION: [
                    q('vg_trans_1', "SUPEREI OS LIMITES DIVINOS! CONTEMPLE!", "I SURPASSED GODLY LIMITS! BEHOLD!"),
                    q('vg_trans_2', "Meu orgulho me manterá de pé!", "My pride will keep me standing!")
                ],
                ULTIMATE: [
                    q('vg_ult_1', "ESTE É O SEU FIM COMPLETO! FINAL FLASH!", "THIS IS YOUR COMLPETE END! FINAL FLASH!", 5),
                    q('vg_ult_2', "EXPLODA EM POEIRA CÓSMICA!", "EXPLODE INTO COSMIC DUST!", 5)
                ],
                LOW_HP_SELF: [
                    q('vg_lowself_1', "Que humilhação... Como ouso fraquejar?!", "What absolute humiliation... How dare I weaken?!", 3, 'COMMON', CharacterEmotion.EXHAUSTED),
                    q('vg_lowself_2', "Eu não aceito perder para esse verme...", "I will not accept losing to this lowlife...", 3, 'COMMON', CharacterEmotion.EXHAUSTED)
                ],
                LOW_HP_OPPONENT: [
                    q('vg_lowopp_1', "Arrependa-se de ter me desafiado!", "Repent ever challenging me!"),
                    q('vg_lowopp_2', "Você desmoronou mais rápido do que imaginei.", "You crumbled swifter than I imagined.")
                ],
                REVERSAL: [
                    q('vg_reversal_1', "EU SOU O PRÍNCIPE! NUNCA SEREI DERROTADO!", "I AM THE PRINCE! I SHALL NEVER BE DEFEATED!"),
                    q('vg_reversal_rare', "A realeza Saiyajin não se rende!", "Saiyan royalty never yields!", 4, 'RARE')
                ],
                VICTORY: [
                    q('vg_win_1', "Verme insolente. Volte quando for digno!", "Arrogant worm. Return when you are worthy!"),
                    q('vg_win_2', "Apenas o óbvio. Ninguém supera a elite!", "Simply obvious. Nobody surpasses the elite!")
                ],
                DEFEAT: [
                    q('vg_loss_1', "Maldito... Maldito seja!", "Damn you... Curse you!"),
                    q('vg_loss_2', "Meu orgulho... foi quebrado de novo...", "My pride... has been shattered again...")
                ],
                TIME_RUNNING_OUT: [
                    q('vg_time_1', "Chega de joguinhos! Vou pulverizar você agora!", "Enough games! I will pulverize you now!")
                ],
                LONG_IDLE: [
                    q('vg_idle_1', "Seu covarde de quinta categoria! Venha lutar!", "You fifth-class coward! Come and face me!")
                ],
                BEING_DOMINATED: [
                    q('vg_dom_1', "Isso é... impossível! Como ele pode ser tão rápido?!", "This is... impossible! How can he be this fast?!"),
                    q('vg_dom_2', "Inacreditável... não consigo reagir!", "Unbelievable... I can't react!")
                ],
                CRITICAL_DAMAGE: [
                    q('vg_crit_1', "GUUAAARGH! INSOLENTE!", "GUUAAARGH! ARROGANT WRETCH!", 3)
                ],
                PERFECT_GUARD: [
                    q('vg_guard_1', "Inútil! Seus ataques são inúteis!", "Useless! Your attacks are completely useless!")
                ],
                COUNTER_ATTACK: [
                    q('vg_counter_1', "Pobre tolo!", "You poor fool!")
                ],
                KNOCKBACK_RECOVERY: [
                    q('vg_knock_1', "Levante-se, Vegeta!", "Get up, Vegeta!")
                ],
                DESPERATE_MODE_ENTER: [
                    q('vg_desp_1', "Eu vou destruir você nem que isso custe a minha própria vida!", "I will destroy you even if it costs my own life!", 3, 'COMMON', CharacterEmotion.DESPERATE)
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('vg_off_1', "MORRA! MORRA! MORRA!", "DIE! DIE! DIE!")
                ],
                NO_KI: [
                    q('vg_noki_1', "Maldição! Falta Ki!", "Curse it! Running dry on Ki!")
                ],
                CHARGING_KI: [
                    q('vg_charge_1', "SHAAAAAH! DESTRUIÇÃO TOTAL!", "SHAAAAAH! TOTAL DESTRUCTION!")
                ],
                COMBO_CANCEL: [
                    q('vg_cancel_1', "Ingênuo!", "Naïve fool!")
                ],
                ULTIMATE_INTERRUPT: [
                    q('vg_ultint_1', "COMO ELEOU-SE PASSAR PELA MINHA ULTIMATE?!", "HOW DID HE BYPASS MY ULTIMATE?!", 4)
                ],
                MATCH_POINT: [
                    q('vg_mp_1', "O ato final! Eu vou reivindicar a vitória absoluta!", "The final act! I shall claim absolute victory!")
                ],
                PERFECT_WIN: [
                    q('vg_perfect_1', "Humph, você não passa de lixo!", "Humph, you are nothing but garbage!", 4, 'LEGENDARY')
                ]
            })
        };

        // Fallback for duplicates or general fighters
        this.database['default'] = {
            characterId: 'default',
            quotes: this.makeCharacterQuotes('default', {
                MATCH_START: [q('def_start', "Vamos lutar!", "Let's do this!")],
                FIRST_STRIKE: [q('def_first', "Toma essa!", "Take that!")],
                CLASH: [q('def_clash', "Não vou recuar!", "I won't back down!")],
                COMBO_HIGH: [q('def_combo', "Excelente sequência!", "Incredible chain!")],
                TRANSFORMATION: [q('def_trans', "Sinta meu novo poder!", "Feel my new power!")],
                ULTIMATE: [q('def_ult', "ISTO É TUDO O QUE EU TENHO!", "THIS IS EVERYTHING I'VE GOT!", 5)],
                LOW_HP_SELF: [q('def_lowself', "Ainda não acabou!", "It's not over yet!")],
                LOW_HP_OPPONENT: [q('def_lowopp', "Você já está nas últimas!", "You are on your last legs!")],
                REVERSAL: [q('def_reversal', "A maré mudou!", "The tide has turned!")],
                VICTORY: [q('def_win', "Vitória excelente!", "Outstanding victory!")],
                DEFEAT: [q('def_loss', "Fui derrotado...", "I was defeated...")],
                TIME_RUNNING_OUT: [q('def_time', "O tempo está acabando!", "Time is running thin!")],
                LONG_IDLE: [q('def_idle', "O que está esperando?", "What are you waiting for?")],
                BEING_DOMINATED: [q('def_dom', "Ele é forte demais!", "He's too strong!")],
                CRITICAL_DAMAGE: [q('def_crit', "Argh! Que bico fatal!", "Argh! Fatal strike!", 3)],
                PERFECT_GUARD: [q('def_guard', "Defesa impecável!", "Flawless defense!")],
                COUNTER_ATTACK: [q('def_counter', "Contra-ataque!", "Counter strike!")],
                KNOCKBACK_RECOVERY: [q('def_knock', "Recuperação imediata!", "Instant recovery!")],
                DESPERATE_MODE_ENTER: [q('def_desp', "Forças ao limite extremo!", "Forces to extreme limits!", 3)],
                LONG_OFFENSIVE_SEQUENCE: [q('def_off', "Sinta minha fúria!", "Feel my fury!")],
                NO_KI: [q('def_noki', "Sem energia...", "Out of energy...")],
                CHARGING_KI: [q('def_charge', "Carregando o Ki interno!", "Charging inner Ki!")],
                COMBO_CANCEL: [q('def_cancel', "Cancelamento fatal!", "Combo cancel!")],
                ULTIMATE_INTERRUPT: [q('def_ultint', "Cancelamento de Ultimate!", "Ultimate interrupted!", 4)],
                MATCH_POINT: [q('def_mp', "Rodada final decisiva!", "Final match point! Overdrive!")],
                PERFECT_WIN: [q('def_perfect', "Triumpho perfeito!", "Perfect Triumph!", 4, 'LEGENDARY')]
            })
        };

        // Mirror Goku-related variants to 'goku' base quotes or add custom ones
        const gokuRef = this.database['goku'] || this.database['goku_base'];
        if (gokuRef) {
            this.database['goku'] = gokuRef;
            this.database['goku_base'] = gokuRef;
            this.database['gokubase'] = gokuRef;
            this.database['goku_ssj'] = gokuRef;
            this.database['gokussj'] = gokuRef;
            this.database['goku_blue'] = gokuRef;
            this.database['gokublue'] = gokuRef;
            this.database['goku_mui'] = gokuRef;
            this.database['gokumui'] = gokuRef;
        }
        
        if (this.database['vegeta']) {
            this.database['vegeta_base'] = this.database['vegeta'];
            this.database['vegetabase'] = this.database['vegeta'];
            this.database['vegeta_ego'] = this.database['vegeta'];
            this.database['vegetaego'] = this.database['vegeta'];
            this.database['vegeta_ssj_majin'] = this.database['vegeta'];
            this.database['vegetassjmajin'] = this.database['vegeta'];
        }

        // --- TRUNKS ---
        this.database['trunks'] = {
            characterId: 'trunks',
            quotes: this.makeCharacterQuotes('trunks', {
                MATCH_START: [
                    q('tr_start_1', "Eu protegerei o futuro de todos!", "I will protect everyone's future!"),
                    q('tr_start_2', "Não vou permitir que você destrua esta era!", "I won't let you destroy this era!")
                ],
                FIRST_STRIKE: [q('tr_first', "Tive sorte!", "Pardon me!")],
                CLASH: [q('tr_clash', "Eu preciso ser mais forte!", "I must grow stronger!")],
                COMBO_HIGH: [q('tr_combo', "Esta é a determinação do futuro!", "This is the layout of the future!")],
                TRANSFORMATION: [q('tr_trans', "SUPEREI MINHA PRÓPRIA FRAQUEZA!", "I SURPASSED MY OWN WEAKNESS!")],
                ULTIMATE: [q('tr_ult', "LÂMINA DA ESPERANÇA! MEU BRILHO MÁXIMO!", "BLADE OF HOPE! MY MAXIMUM SHINE!", 5)],
                LOW_HP_SELF: [q('tr_lowself', "Minhas esperanças não podem morrer...", "My hopes cannot wither...", 3, 'COMMON', CharacterEmotion.EXHAUSTED)],
                LOW_HP_OPPONENT: [q('tr_lowopp', "Renda-se pacíficamente!", "Surround yourself peacefully!")],
                REVERSAL: [q('tr_reversal', "Pela paz deste mundo!", "For the peace of this world!")],
                VICTORY: [q('tr_win', "O futuro está salvo... por enquanto.", "The future is safe... for now.")],
                DEFEAT: [q('tr_loss', "Incapaz... de... salvar as pessoas...", "Incapable... of... saving anyone...")],
                TIME_RUNNING_OUT: [q('tr_time', "O portal do tempo está flutuando!", "The time portal is drifting!")],
                LONG_IDLE: [q('tr_idle', "Lute de forma justa!", "Face me fairly!")],
                BEING_DOMINATED: [q('tr_dom', "N-Não pode ser... esse demônio!", "I-It can't be... this demon!")],
                CRITICAL_DAMAGE: [q('tr_crit', "Uuaarggh! Que impacto!", "Uuaarggh! Unbelievable!", 3)],
                PERFECT_GUARD: [q('tr_guard', "Consegui desviar!", "Managed to defect!")],
                COUNTER_ATTACK: [q('tr_counter', "Não esperava por essa!", "Didn't expect this!")],
                KNOCKBACK_RECOVERY: [q('tr_knock', "Continuo de pé!", "Still standing!")],
                DESPERATE_MODE_ENTER: [q('tr_desp', "Eu nunca me entregarei ao desespero!", "I will never yield to despair!", 3, 'COMMON', CharacterEmotion.DESPERATE)],
                LONG_OFFENSIVE_SEQUENCE: [q('tr_off', "Para vencer, devo lutar!", "To succeed, I must strike!")],
                NO_KI: [q('tr_noki', "Minha energia vital sumiu...", "My vital energy dissipated...")],
                CHARGING_KI: [q('tr_charge', "Sentindo a energia galáctica!", "Summoning planetary hope Ki!")],
                COMBO_CANCEL: [q('tr_cancel', "Finta perfeita!", "Perfect faint!")],
                ULTIMATE_INTERRUPT: [q('tr_ultint', "A espada de energia quebrou!", "The energy blade broke!", 4)],
                MATCH_POINT: [q('tr_mp', "O combate derradeiro pelo nosso amanhecer!", "The final battle for our dawn!")],
                PERFECT_WIN: [q('tr_perfect', "A justiça triunfou por completo!", "Justice triumphed flawlessly!", 4, 'LEGENDARY')]
            })
        };

        // --- GOKU BLACK ---
        const gkrose = '/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE';

        this.database['goku_black'] = {
            characterId: 'goku_black',
            quotes: this.makeCharacterQuotes('goku_black', {
                MATCH_START: [
                    q('bk_start_1', "Eu irei eliminar todos esses humanos.", "I will eliminate all of these humans.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/EU%20IREI%20ELIMINAR%20TODOS%20ESSES%20HUMANOS.wav'),
                    q('bk_start_2', "Esplêndido... o corpo de um Saiyajin é mesmo divino!", "Splendid... the body of a Saiyan is truly divine!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/EXPLENDIDO%20O%20CORPO%20DE%20UM%20SAYAJIN%20E%20MESMO%20DIVINO.wav'),
                    q('bk_start_3', "Pretende mesmo me enfrentar?", "Do you really intend to face me?", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/PRETENDE%20MESMO%20ME%20ENFRENTAR.wav')
                ],
                FIRST_STRIKE: [
                    q('bk_first_1', "Imprudente!", "Reckless!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/IMPRUDENTE.wav'),
                    q('bk_first_2', "Preste atenção, aperitivo.", "Pay attention, appetizer.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/PRESTE%20ATEN%C3%87%C3%83O%20APERITIVO.wav')
                ],
                CLASH: [
                    q('bk_clash_1', "Toma essa!", "Take this!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/COMBO%20(1).wav'),
                    q('bk_clash_2', "Hah!", "Hah!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/COMBO%20(6).wav'),
                    q('bk_clash_3', "Sinta o poder!", "Feel the power!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/COMBO%20(7).wav'),
                    q('bk_clash_4', "Não vai escapar!", "You won't escape!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/COMBO%20(8).wav'),
                    q('bk_clash_5', "Vamos nessa!", "Let's go!", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/COMBO%20(9).wav')
                ],
                COMBO_HIGH: [
                    q('bk_combo_1', "Tentar escapar é inútil!", "Trying to escape is useless!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/TENTAR%20ESCAPAR%20E%20INUTIL.wav'),
                    q('bk_combo_2', "Você realmente não passa de um mortal.", "You really are nothing but a mortal.", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/VOC%C3%8E%20REALMENTE%20N%C3%83O%20PASSA%20DE%20UM%20MORTAL.wav')
                ],
                TRANSFORMATION: [
                    q('bk_trans_1', "Super Saiyajin Rosé!", "Super Saiyan Rosé!", 3, 'COMMON', CharacterEmotion.ANGRY, gkrose + '/super%20sayajin%20rose.wav'),
                    q('bk_trans_2', "Veja bem esta cor!", "Take a good look at this color!", 3, 'COMMON', CharacterEmotion.ANGRY, gkrose + '/veja%20bem%20esta%20cor%20.wav')
                ],
                ULTIMATE: [
                    q('bk_ult_1', "KAMEHAMEHA!", "KAMEHAMEHA!", 5, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/ESPECIAL/KAMEHAMEHAAAAAAAA.wav')
                ],
                LOW_HP_SELF: [
                    q('bk_lowself_1', "Não pode ser... como isso é possível?", "It can't be... how is this possible?", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/N%C3%83O%20PODE%20SER.wav'),
                    q('bk_lowself_2', "Não é possível... não consigo entender!", "It's not possible... I can't understand!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/N%C3%83O%20E%20POSSIVEL%20N%C3%83O%20CONSIGO%20ENTENDER.wav')
                ],
                LOW_HP_OPPONENT: [
                    q('bk_lowopp_1', "Falta pouco para o meu sonho se tornar realidade!", "There is little left for my dream to become reality!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/FALAS%20POUCO%20PARA%20MEU%20SONHO%20SE%20TORNAR%20REALIDADE.wav'.replace('FALAS', 'FALTA')),
                    q('bk_lowopp_2', "Você continua de pé e resistindo mesmo sabendo que não pode me vencer.", "You keep standing and resisting even knowing you cannot defeat me.", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/VOC%C3%8E%20CONTINUA%20DE%20PE%20%20E%20RESISTINDO%20MESMO%20SABENDO%20QUE%20N%C3%83O%20PODE%20ME%20VENCER.wav')
                ],
                REVERSAL: [
                    q('bk_reversal_1', "Essa dor só irá me tornar mais forte!", "This pain will only make me stronger!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/ESSA%20DOR%20SO%20IRA%20ME%20TORNAR%20MAIS%20FORTE.wav'),
                    q('bk_reversal_2', "Minha força ultrapassou até mesmo meu entendimento!", "My strength surpassed even my own understanding!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/MINHA%20FOR%C3%87A%20ULTRAPASSOU%20ATE%20MESMO%20MEU%20ENTENDIMENTO.wav')
                ],
                VICTORY: [
                    q('bk_win_1', "Estou feliz com este corpo.", "I am happy with this body.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/ESTOU%20FELIZ%20COM%20ESTE%20CORPO.wav'),
                    q('bk_win_2', "A morte não passa de uma bênção para os seres humanos.", "Death is nothing more than a blessing for humans.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/A%20MORTE%20N%C3%83O%20PASSA%20DE%20UMA%20BEN%C3%87%C3%83O%20PARA%20OS%20SERES%20HUMANOS.wav')
                ],
                DEFEAT: [
                    q('bk_loss_1', "Não... não pode ser!", "No... it can't be!", 2, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/N%C3%83O%20PODE%20SER.wav')
                ],
                TIME_RUNNING_OUT: [
                    q('bk_time_1', "Não tem por que apressar a luta.", "There is no reason to rush the fight.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/nao%20tem%20por%20que%20apressar%20a%20luta.wav')
                ],
                LONG_IDLE: [
                    q('bk_idle_1', "Aquele ataque não foi tão ruim.", "That attack wasn't so bad.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/AQUELE%20ATAQUE%20N%C3%83O%20FOI%20T%C3%83O%20RUIM.wav'),
                    q('bk_idle_2', "Mostre-me mais do seu poder.", "Show me more of your power.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/MOSTRE%20ME%20MAIS%20DO%20SEU%20PODER.wav')
                ],
                BEING_DOMINATED: [
                    q('bk_dom_1', "Não estou vendo graça alguma!", "I am not seeing any amusement!", 2, 'COMMON', CharacterEmotion.DESPERATE, gkrose + '/N%C3%83O%20ESTOU%20VENDO%20GRA%C3%87A%20ALGUMA.wav')
                ],
                CRITICAL_DAMAGE: [
                    q('bk_crit_1', "Dano!", "Ouch!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(1).wav'),
                    q('bk_crit_2', "Agh!", "Agh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(3).wav'),
                    q('bk_crit_3', "Ugh!", "Ugh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(4).wav'),
                    q('bk_crit_4', "Gah!", "Gah!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(5).wav'),
                    q('bk_crit_5', "Noo!", "Noo!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(6).wav'),
                    q('bk_crit_6', "Oof!", "Oof!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(10).wav'),
                    q('bk_crit_7', "Argh!", "Argh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(11).wav'),
                    q('bk_crit_8', "Grr!", "Grr!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(12).wav'),
                    q('bk_crit_9', "Arghh!", "Arghh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(13).wav'),
                    q('bk_crit_10', "Oof!", "Oof!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20(14).wav'),
                    q('bk_crit_cont', "Ahhhhh!", "Ahhhhh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gkrose + '/DANO/DANO%20CONTINUO.wav')
                ],
                PERFECT_GUARD: [
                    q('bk_guard_1', "Certo.", "Right.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/CERTO.wav')
                ],
                COUNTER_ATTACK: [
                    q('bk_counter_1', "Hummmm...", "Hummmm...", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/HUMMMM.wav')
                ],
                KNOCKBACK_RECOVERY: [
                    q('bk_knock_1', "Risada.", "Laugh.", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/risada.wav')
                ],
                DESPERATE_MODE_ENTER: [
                    q('bk_desp_1', "Se todos os seres humanos fossem exterminados a beleza do mundo voltaria.", "If all humans were exterminated, the beauty of the world would return.", 3, 'COMMON', CharacterEmotion.DESPERATE, gkrose + '/SE%20TODOS%20OS%20SERES%20HUMANOS%20FOSSEM%20EXTERMINADOS%20A%20BELEZA%20DO%20MUNDO%20VOLTARIA.wav')
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('bk_off_1', "Não temos escolha, a hora do recreio acabou.", "We have no choice, playtime is over.", 2, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/N%C3%83O%20TEMOS%20ESCOLHA%20A%20HORA%20DO%20RECREIO%20ACABOU.wav')
                ],
                NO_KI: [
                    q('bk_noki_1', "Humph.", "Humph.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/HUMMMM.wav')
                ],
                CHARGING_KI: [
                    q('bk_charge_1', "AHHHHHH!", "AHHHHHH!", 2, 'COMMON', CharacterEmotion.ANGRY, gkrose + '/CARREGANDO%20KI/AHHHHHH.wav')
                ],
                COMBO_CANCEL: [
                    q('bk_cancel_1', "Sumiu completamente.", "Completely gone.", 2, 'COMMON', CharacterEmotion.CALM, gkrose + '/SUMIU%20COMPLETAMENTE.wav')
                ],
                ULTIMATE_INTERRUPT: [
                    q('bk_ultint_1', "Isso é imperdoável!", "This is unforgivable!", 4, 'COMMON', CharacterEmotion.ANGRY, gkrose + '/ISSO%20E%20IMPERDOAVEL.wav')
                ],
                MATCH_POINT: [
                    q('bk_mp_1', "Agora só falta você!", "Now only you're left!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gkrose + '/agora%20so%20falta%20voce.wav')
                ],
                PERFECT_WIN: [
                    q('bk_perfect_1', "Uma paisagem terrivelmente desoladora, porém posso deslumbrar um belo e iluminado futuro para essa Terra livre daqueles malditos humanos parasitas.", "A terribly desolate landscape, yet I can glimpse a beautiful and bright future for this Earth, free of those cursed parasite humans.", 4, 'LEGENDARY', CharacterEmotion.CONFIDENT, gkrose + '/UMA%20PAISAGEM%20TERRIVELMENTE%20DESOLADORA%20POR%C3%89M%20POSSO%20DESLUMBRAR%20UM%20BELO%20E%20ILUMINADO%20FUTURO%20PARA%20ESSA%20TERRA%20LIVRE%20DAQUELES%20MALDITOS%20HUMANOS%20PARASITAS.wav')
                ]
            })
        };
        this.database['gokusub_black'] = this.database['goku_black'];
        this.database['gokublack'] = this.database['goku_black'];
        this.database['goku_black_rose'] = this.database['goku_black'];

        const gbase = '/Assets/SONS/DUBLAGEM/GOKU%20BASE';

        this.database['goku_base'] = {
            characterId: 'goku_base',
            quotes: this.makeCharacterQuotes('goku_base', {
                MATCH_START: [
                    q('gb_start_1', "Acredito que tenha ficado mais forte, mas eu também fiquei!", "I believe you've grown stronger, but so have I!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/ACREDITO%20QUE%20TENHA%20FICADO%20MAIS%20FORTE%20MAIS%20EU%20TAMBEM%20FIQUEI.wav'),
                    q('gb_start_2', "Vamos dar nosso máximo nessa luta!", "Let's give our maximum in this fight!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/VAMOS%20DAR%20NOSSO%20MAXIMO%20NESSA%20LUTA.wav'),
                    q('gb_start_3', "Vamos começar nosso bate-papo!", "Let's start our chat!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/VAMOS%20COME%C3%87AR%20NOSSO%20BATE%20PAPO.wav'),
                    q('gb_start_4', "Beleza, vamos nessa!", "Alright, let's do this!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/BELEZA%20VAMOS%20NESSA.wav'),
                    q('gb_start_5', "Já que insiste, vamos lá!", "Since you insist, let's go!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/JA%20QUE%20INSISTE%20VAMOS%20LA.wav')
                ],
                FIRST_STRIKE: [
                    q('gb_first_1', "Maravilha!", "Wonderful!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/MARAVILHA.wav'),
                    q('gb_first_2', "Tá legal, exagerei um pouquinho.", "Alright, exaggerated a little bit.", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/TA%20LEGAL%20EXAGEREI%20UM%20POUQUINHO.wav'),
                    q('gb_first_3', "Não foi nada mal, não é?", "That wasn't bad at all, was it?", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/N%C3%83O%20FOI%20NADA%20MAL%20N%C3%83O%20%C3%89.wav')
                ],
                CLASH: [
                    q('gb_clash_1', "Vamos nessa!", "Let's go!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/COMBO%20(9).wav'),
                    q('gb_clash_2', "Toma essa!", "Take this!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/COMBO%20(1).wav'),
                    q('gb_clash_3', "Ahhh!", "Ahhh!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/COMBO%20(6).wav'),
                    q('gb_clash_4', "Hah!", "Hah!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/COMBO%20(7).wav'),
                    q('gb_clash_5', "Não vai escapar!", "You won't escape!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/COMBO%20(8).wav')
                ],
                COMBO_HIGH: [
                    q('gb_combo_1', "Você não consegue escapar!", "You can't escape!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/COMBO%20(5).wav'),
                    q('gb_combo_2', "Muito lento!", "Too slow!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/COMBO%20(4).wav')
                ],
                TRANSFORMATION: [
                    q('gb_trans_1', "Kaioken!", "Kaio-ken!", 3, 'COMMON', CharacterEmotion.ANGRY, gbase + '/KAIOKEN.wav'),
                    q('gb_trans_2', "Kaioken... dez vezes!", "Kaio-ken... ten times!", 3, 'RARE', CharacterEmotion.ANGRY, gbase + '/KAIOKEN%2010%20VEZES.wav'),
                    q('gb_trans_3', "Aumentado... Kaioken!", "Kaio-ken... amplified!", 3, 'LEGENDARY', CharacterEmotion.ANGRY, gbase + '/AUMENTADO%20KAIOKEN.wav'),
                    q('gb_trans_4', "HAAAAAAAAA!", "HAAAAAAAAA!", 3, 'COMMON', CharacterEmotion.ANGRY, gbase + '/HAAAAAAAAA.wav')
                ],
                ULTIMATE: [
                    q('gb_ult_2', "KAMEHAME!", "KAMEHAME!", 5, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/KAMEHAME.wav')
                ],
                ULTIMATE_2: [
                    q('gb_ult_1', "A Genkidama!", "The Spirit Bomb!", 5, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/HORA%20DE%20RECEBER%20MINHA%20TECNICA%20SUPREMA%20A%20GENKIDAMA.wav'),
                    q('gb_ult_3', "É hora de receber minha técnica suprema!", "It is time to receive my ultimate technique!", 5, 'RARE', CharacterEmotion.CONFIDENT, gbase + '/HORA%20DE%20RECEBER%20MINHA%20TECNICA%20SUPREMA%20A%20GENKIDAMA.wav')
                ],
                LOW_HP_SELF: [
                    q('gb_lowself_1', "Ainda não perdi a batalha!", "I haven't lost this battle yet!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/AINDA%20N%C3%83O%20PERDIR%20A%20BATALHA.wav'),
                    q('gb_lowself_2', "Estou em um beco sem saída...", "I'm in a dead end...", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/ESTOU%20EM%20UM%20BECO%20SEM%20SAIDA.wav')
                ],
                LOW_HP_OPPONENT: [
                    q('gb_lowopp_1', "Vamos lá, lute pra valer agora!", "Come on, fight for real now!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/VAMOS%20LA%20LUTE%20PRA%20VALER%20AGORA.wav'),
                    q('gb_lowopp_2', "Muito bem, você é incrível!", "Very well, you are incredible!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/RECOMPOSIÇÃO/MUITO%20BEM%20VOC%C3%8E%20E%20INCRIVEL.wav'),
                    q('gb_lowopp_3', "Você tá meio bravo, né?!", "You're a bit angry, aren't you?!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/RECOMPOSIÇÃO/VOC%C3%8E%20TA%20MEIO%20BRAVO%20N%C3%89!.wav')
                ],
                REVERSAL: [
                    q('gb_reversal_1', "Agora sim ficou interessante!", "Now it's starting to get interesting!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/AGORA%20SIM%20FICOU%20INTERESSANTE.wav'),
                    q('gb_reversal_2', "Posso sentir o poder no meu corpo!", "I can feel the power coursing through my body!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/POSSO%20SENTIR%20O%20PODER%20DO%20MEU%20CORPO.wav'),
                    q('gb_reversal_3', "Estou mais animado do que nunca!", "I am more excited than ever!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/ESTOU%20MAIS%20ANIMADO%20DO%20QUE%20NUNCA.wav'),
                    q('gb_reversal_4', "Agora sim estou muito empolgado!", "Now I'm really excited!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/AGORA%20SIM%20ESTOU%20MUITO%20EMPOLGADO.wav'),
                    q('gb_reversal_5', "Agora vamos começar!", "Now we begin!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/AGORA%20VAMOS%20COME%C3%87AR.wav'),
                    q('gb_reversal_6', "Sempre que enfrento alguém muito forte fico muito animado!", "Whenever I face someone really strong I get so excited!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/SEMPRE%20QUE%20ENFRENTO%20ALGUEM%20MUITO%20FORTE%20FICO%20MUITO%20ANIMADO.wav'),
                    q('gb_reversal_new', "Eu não vou perder!", "I won't lose!", 4, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/EU%20NAO%20VOU%20PEDER.wav')
                ],
                VICTORY: [
                    q('gb_win_1', "Maravilha!", "Wonderful!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/MARAVILHA.wav')
                ],
                DEFEAT: [
                    q('gb_loss_1', "Caramba...", "Geez...", 2, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/CARAMBA.wav')
                ],
                TIME_RUNNING_OUT: [
                    q('gb_time_gen', "Ainda não acabou!", "It's not over yet!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/AINDA%20N%C3%83O%20ACABOU.wav')
                ],
                LONG_IDLE: [
                    q('gb_idle_1', "E aí, como é que é?", "Well, what do you think?", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/E%20AI%20COMO%20E%20QUE%20E.wav'),
                    q('gb_idle_2', "Vem aqui e me mostre sua força!", "Come over here and show me your strength!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/VEM%20AQUI%20E%20ME%20MOSTRE%20SUA%20FOR%C3%87A.wav'),
                    q('gb_idle_3', "Anda logo, vem pra cima!", "Hurry up, bring it on!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/ANDA%20LOGO%20VEM%20PRA%20CIMA.wav')
                ],
                BEING_DOMINATED: [
                    q('gb_dom_1', "Esses caras não são fáceis de enfrentar...", "These guys are not easy to face...", 2, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/ESSES%20CARAS%20N%C3%83O%20S%C3%83O%20FACEIS%20DE%20ENFRENTAR.wav'),
                    q('gb_dom_2', "Quem diria que existia um cara desse nível...", "Who would have thought a guy of this caliber existed...", 2, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/QUEM%20DIRIA%20QUE%20EXISTIA%20UM%20CARA%20DESSE%20NIVEL.wav'),
                    q('gb_dom_3', "Você realmente me pegou de surpresa!", "You really caught me by surprise!", 2, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/RECOMPOSIÇÃO/VOC%C3%8E%20REALMENTE%20ME%20PEGOU%20DE%20SURPRESA.wav')
                ],
                CRITICAL_DAMAGE: [
                    q('gb_crit_1', "Caramba!", "Geez!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/CARAMBA.wav'),
                    q('gb_crit_2', "Argh!", "Argh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(9).wav'),
                    q('gb_crit_3', "Dano!", "Ouch!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(1).wav'),
                    q('gb_crit_4', "Ugh!", "Ugh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(2).wav'),
                    q('gb_crit_5', "Agh!", "Agh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(4).wav'),
                    q('gb_crit_6', "Gah!", "Gah!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(5).wav'),
                    q('gb_crit_7', "Nooo!", "Nooo!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(6).wav'),
                    q('gb_crit_8', "Grr!", "Grr!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(7).wav'),
                    q('gb_crit_9', "Arghh!", "Arghh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(8).wav'),
                    q('gb_crit_10', "Oof!", "Oof!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(10).wav'),
                    q('gb_crit_cont_1', "Ahhhh!", "Ahhhh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20CONTINUO.wav'),
                    q('gb_crit_cont_2', "Arghhhhh!", "Arghhhhh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20CONTINUO.wav')
                ],
                PERFECT_GUARD: [
                    q('gb_guard_1', "Não caio mais nesse truque!", "I won't fall for that trick again!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/N%C3%83O%20CAIO%20MAIS%20NESSE%20TRUQUE.wav'),
                    q('gb_guard_2', "Saiba que não vou deixar isso acontecer!", "Know that I won't let this happen!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/SAIBA%20QUE%20N%C3%83O%20VOU%20DEIXAR%20ISSO%20ACONTECER.wav')
                ],
                COUNTER_ATTACK: [
                    q('gb_counter_1', "Eitaaaa, haha!", "Whoa, haha!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/EITAAAA%20HAHA.wav')
                ],
                KNOCKBACK_RECOVERY: [
                    q('gb_knock_1', "Ainda não acabou!", "It's not over yet!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/AINDA%20N%C3%83O%20ACABOU.wav'),
                    q('gb_knock_2', "Isso ainda não acabou!", "This is far from over!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/ISSO%20AINDA%20N%C3%83O%20ACABOU.wav'),
                    q('gb_knock_3', "Finalmente resolveu me enfrentar!", "Finally decided to face me!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/FINALMENTE%20RESOLVEL%20ME%20ENFRENTAR.wav'),
                    q('gb_knock_4', "Já estava na hora de lutar comigo!", "It's about time you fought me!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/JA%20ESTAVA%20NA%20HORA%20DE%20LUTAR%20COMIGO.wav'),
                    q('gb_knock_5', "Saiba que não morri ainda!", "Know that I haven't died yet!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/SAIBA%20QUE%20N%C3%83O%20MORRI%20AINDA.wav'),
                    q('gb_knock_6', "Vamos ao segundo round!", "Let's go to the second round!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/VAMOS%20AO%20SEGUNDO%20ROUND.wav'),
                    q('gb_knock_7', "Vamos lutar!", "Let's fight!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/VAMOS%20LUTAR.wav')
                ],
                DESPERATE_MODE_ENTER: [
                    q('gb_desp_1', "Vinte vezes!", "Twenty times!", 3, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/KAIOKEN%2020%20VEZES.wav'),
                    q('gb_desp_2', "Eu vou lutar com todo o meu poder!", "I will fight with everything I've got!", 3, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/EU%20VOU%20LUTAR%20COM%20TODO%20O%20MEU%20PODER.wav'),
                    q('gb_desp_3', "Já chegaaaaaaa!", "That's enough!", 3, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/JA%20CHEGAAAAAAA.wav'),
                    q('gb_desp_4', "Vamos usar o Potara porque podemos usar a fusão!", "Let's use the Potara so we can fuse!", 3, 'COMMON', CharacterEmotion.DESPERATE, gbase + '/FUS%C3%83O.wav')
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('gb_off_1', "Quero ver você aguentar!", "Let's see if you can take this!", 2, 'COMMON', CharacterEmotion.CONFIDENT, gbase + '/PROVOCAÇÃO/QUERO%20VER%20VOC%C3%8E%20AGUENTAR.wav')
                ],
                NO_KI: [
                    q('gb_noki_1', "Argh...", "Argh...", 2, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/DANO%20(3).wav')
                ],
                CHARGING_KI: [
                    q('gb_charge_1', "AHHHHHHHHHH!", "AHHHHHHHHHH!", 2, 'COMMON', CharacterEmotion.ANGRY, gbase + '/CARREGANDO%20KI%20AHHHHHHH.wav')
                ],
                COMBO_CANCEL: [
                    q('gb_cancel_1', "Agora vamos trocar de lugar!", "Now we're swapping places!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/AGORA%20VAMOS%20TROCAR%20DE%20LUGAR.wav'),
                    q('gb_cancel_2', "Ahhhh!", "Ahhhh!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/CARREGANDO%20KI%20AHHHHHHH.wav'),
                    q('gb_cancel_3', "Fusão!", "Fusion!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/FUS%C3%83O.wav')
                ],
                ULTIMATE_INTERRUPT: [
                    q('gb_ultint_1', "Você realmente me pegou de surpresa!", "You really caught me by surprise!", 4, 'COMMON', CharacterEmotion.EXHAUSTED, gbase + '/RECOMPOSIÇÃO/VOC%C3%8E%20REALMENTE%20ME%20PEGOU%20DE%20SURPRESA.wav')
                ],
                MATCH_POINT: [
                    q('gb_mp_1', "Beleza, pode vir quem quiser!", "Alright, anyone can have a go!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/BELEZA%20PODE%20VIR%20QUEM%20QUISER.wav'),
                    q('gb_mp_2', "Pode deixar o resto comigo!", "Leave the rest of it to me!", 2, 'COMMON', CharacterEmotion.CALM, gbase + '/PODE%20DEIXAR%20O%20RESTO%20COMIGO.wav')
                ],
                PERFECT_WIN: [
                    q('gb_perfect_1', "Maravilha!", "Wonderful!", 4, 'LEGENDARY', CharacterEmotion.CALM, gbase + '/MARAVILHA.wav')
                ]
            })
        };

        this.database['gokubase'] = this.database['goku_base'];
        this.database['goku'] = this.database['goku_base'];
        this.database['goku_ssj'] = this.database['goku_base'];
        this.database['gokussj'] = this.database['goku_base'];
        this.database['goku_blue'] = this.database['goku_base'];
        this.database['gokublue'] = this.database['goku_base'];
        this.database['goku_mui'] = this.database['goku_base'];
        this.database['gokumui'] = this.database['goku_base'];

        // --- TEEN GOHAN SSJ2 ---
        const tgssj2 = '/Assets/SONS/DUBLAGEM/TEEN%20GOHAN%20SSJ2';

        this.database['teen_gohan_ssj2'] = {
            characterId: 'teen_gohan_ssj2',
            quotes: this.makeCharacterQuotes('teen_gohan_ssj2', {
                MATCH_START: [
                    q('tg_start_1', "Eu não gosto de lutar como o meu pai.", "I don't like fighting like my father does.", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/EU%20N%C3%83O%20GOSTO%20DE%20LUTAR%20%20COMO%20O%20MEU%20PAI.wav'),
                    q('tg_start_2', "Eu não quero matar você.", "I don't want to kill you.", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/EU%20N%C3%83O%20QUERO%20MATAR%20VOC%C3%8E.wav'),
                    q('tg_start_3', "Mesmo você sendo um tipo tão malvado...", "Even though you are such an evil person...", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/MESMO%20VOC%C3%8E%20SENDO%20UM%20TIPO%20T%C3%83O%20MALVADO.wav')
                ],
                FIRST_STRIKE: [
                    q('tg_first_1', "Seus malditos!", "You bastards!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/MALDITOS.wav'),
                    q('tg_first_2', "Não vou perdoar vocês!", "I will never forgive you!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/N%C3%83O%20VOU%20PERDOAR%20VOC%C3%8AS.wav')
                ],
                CLASH: [
                    q('tg_clash_1', "Tome essa!", "Take this!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/COMBO.wav'),
                    q('tg_clash_2', "Hah!", "Hah!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/COMBO%20(2).wav'),
                    q('tg_clash_3', "Yaaa!", "Yaaa!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/COMBO%20(3).wav'),
                    q('tg_clash_4', "Taaaa!", "Taaaa!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/COMBO%20(4).wav')
                ],
                COMBO_HIGH: [
                    q('tg_combo_1', "Chegou o seu fim!", "Your end has come!", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/CHEGOU%20SEU%20FIM.wav')
                ],
                TRANSFORMATION: [
                    q('tg_trans_1', "Isso não! Aaaaahhhh!", "This cannot be! Aaaaahhhh!", 3, 'COMMON', CharacterEmotion.ANGRY, tgssj2 + '/ISSO%20N%C3%83OOOOOOO.wav'),
                    q('tg_trans_2', "Vou fazer tudo o que for possível para acabar com ele!", "I will do everything possible to put an end on him!", 3, 'COMMON', CharacterEmotion.ANGRY, tgssj2 + '/VOU%20FAZER%20DE%20TUDO%20POSSIVEL%20PARA%20MATAR%20ELE.wav')
                ],
                ULTIMATE: [
                    q('tg_ult_1', "Kamehamehaaaaa!", "Kamehamehaaaaa!", 5, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/KAMEHAME.wav'),
                    q('tg_ult_2', "Esse verme merece morrer por tudo o que fez!", "This worm deserves to die for everything he did!", 5, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/ESSE%20VERMER%20MERECE%20MORRER%20POR%20TUDO%20QUE%20FEZ.wav')
                ],
                LOW_HP_SELF: [
                    q('tg_lowself_1', "Eu sinto muito, mas esse é o meu limite...", "I'm sorry, but this is my limit...", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/EU%20SINTO%20MUITO%20MAIS%20E%20O%20MEU%20LIMITE.wav'),
                    q('tg_lowself_2', "É o fim... Está tudo acabado...", "It's the end... Everything is over...", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/E%20O%20FIM%20ESTA%20TUDO%20ACABADO.wav'),
                    q('tg_lowself_3', "É impossível, não vou conseguir derrotá-lo!", "It's impossible, I won't be able to defeat him!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/E%20IMPOSSIVEL%20N%C3%83O%20VOU%20DERROTAR%20ELE.wav')
                ],
                LOW_HP_OPPONENT: [
                    q('tg_lowopp_1', "Por favor, pare com isso!", "Please, stop this!", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/PAREM%20POR%20FAVOR.wav')
                ],
                REVERSAL: [
                    q('tg_reversal_1', "Eu sei que é inútil tentar reagir e atacar de novo, mas...", "I know it's useless to try and attack you again, but...", 4, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/EU%20SEI%20QUE%20E%20INUTIL%20REAGIR%20E%20ATACAR%20VOC%C3%8E%20MAIS%20UMA%20VEZ.wav')
                ],
                VICTORY: [
                    q('tg_win_1', "Ele está morto.", "He is dead.", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/ESTA%20MORTO.wav'),
                    q('tg_win_2', "Estou feliz que tudo acabou.", "I am glad everything is over.", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/ESTOU%20FELIZ.wav'),
                    q('tg_win_3', "Eu consegui vingar a morte do meu pai!", "I was able to avenge my father's death!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/EU%20VOU%20PODER%20VINGAR%20A%20MORTE%20DO%20MEU%20PAI.wav')
                ],
                DEFEAT: [
                    q('tg_loss_1', "Papai, me perdoa... Eu não pude salvar a Terra...", "Father, forgive me... I couldn't save the Earth...", 2, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/PAI%20ME%20PERDOA%20NAO%20PUDE%20SALVAR%20A%20TERRA.wav')
                ],
                TIME_RUNNING_OUT: [
                    q('tg_time_1', "Não adianta ficar lutando nesse torneio.", "There is no point in fighting in this tournament anymore.", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/N%C3%83O%20ADIANTA%20FICAR%20LUTANDO%20NESSE%20TORNEIO.wav')
                ],
                LONG_IDLE: [
                    q('tg_idle_1', "O que foi? Vem lutar!", "What's the matter? Come on and fight!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/O%20QUE%20FOI%20VEM%20LUTAR.wav')
                ],
                BEING_DOMINATED: [
                    q('tg_dom_1', "Não pode ser...", "This can't be...", 2, 'COMMON', CharacterEmotion.DESPERATE, tgssj2 + '/N%C3%83O%20PODE%20SER.wav'),
                    q('tg_dom_2', "Não imaginei que algo assim pudesse acontecer...", "I never imagined this would happen...", 2, 'COMMON', CharacterEmotion.DESPERATE, tgssj2 + '/NUNCA%20IMAGINEI%20QUE%20ISSO%20IA%20ACONTECER.wav')
                ],
                CRITICAL_DAMAGE: [
                    q('tg_crit_1', "Aargh!", "Aargh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO.wav'),
                    q('tg_crit_2', "Ugh!", "Ugh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(2).wav'),
                    q('tg_crit_3', "Gah!", "Gah!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(3).wav'),
                    q('tg_crit_4', "Arrgh!", "Arrgh!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(4).wav'),
                    q('tg_crit_5', "Oof!", "Oof!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(5).wav'),
                    q('tg_crit_6', "Grr!", "Grr!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(6).wav'),
                    q('tg_crit_cont_1', "AAARRGHHHH!", "AAARRGHHHH!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20CONTINUO.wav'),
                    q('tg_crit_cont_2', "UAAARRRGGGHHH!", "UAAARRRGGGHHH!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20CONTINUO%20(2).wav')
                ],
                PERFECT_GUARD: [
                    q('tg_guard_1', "Melhor deixar pra lá...", "Better leave it be...", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/MELHOR%20DEIXAR%20PRA%20LA.wav'),
                    q('tg_guard_2', "Melhor deixar pra lá...", "Better leave it be...", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/MELHOR%20DEIXAR%20PRA%20LA%20(2).wav')
                ],
                COUNTER_ATTACK: [
                    q('tg_counter_1', "Aqui vou eu!", "Here I come!", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/COMBO.wav')
                ],
                KNOCKBACK_RECOVERY: [
                    q('tg_knock_1', "Ainda não acabou!", "It is not over yet!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/COMBO.wav')
                ],
                DESPERATE_MODE_ENTER: [
                    q('tg_desp_1', "Eu fui o culpado! Eu devia ter acabado com ele antes!", "I was the one to blame! I should have finished him earlier!", 3, 'COMMON', CharacterEmotion.DESPERATE, tgssj2 + '/EU%20FUI%20O%20CUPADO%20DEVIA%20TER%20ACABADO%20COM%20ELE%20ANTES.wav')
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('tg_off_1', "Não brinque comigo!", "Don't play with me!", 2, 'COMMON', CharacterEmotion.CONFIDENT, tgssj2 + '/CHEGOU%20SEU%20FIM.wav')
                ],
                NO_KI: [
                    q('tg_noki_1', "Não tenho Ki suficiente...", "No more Ki...", 2, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/DANO%20(3).wav')
                ],
                CHARGING_KI: [
                    q('tg_charge_1', "Haaaaah!", "Haaaaah!", 2, 'COMMON', CharacterEmotion.ANGRY, tgssj2 + '/CARREGANDO%20KI.wav'),
                    q('tg_charge_2', "HAAAAAAAAHHH!", "HAAAAAAAAHHH!", 2, 'COMMON', CharacterEmotion.ANGRY, tgssj2 + '/CARREGANDO%20KI%20(2).wav')
                ],
                COMBO_CANCEL: [
                    q('tg_cancel_1', "Espera...", "Wait...", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/PAREM%20POR%20FAVOR.wav')
                ],
                ULTIMATE_INTERRUPT: [
                    q('tg_ultint_1', "Maldito!", "Dammit!", 4, 'COMMON', CharacterEmotion.EXHAUSTED, tgssj2 + '/MALDITOS.wav')
                ],
                MATCH_POINT: [
                    q('tg_mp_1', "Eu irei salvar a Terra!", "I will save the Earth!", 2, 'COMMON', CharacterEmotion.CALM, tgssj2 + '/EU%20N%C3%83O%20GOSTO%20DE%20LUTAR%20%20COMO%20O%20MEU%20PAI.wav')
                ],
                PERFECT_WIN: [
                    q('tg_perfect_1', "Consegui, papai!", "I did it, dad!", 4, 'LEGENDARY', CharacterEmotion.CALM, tgssj2 + '/EU%20VOU%20PODER%20VINGAR%20A%20MORTE%20DO%20MEU%20PAI.wav')
                ]
            })
        };

        this.database['teengohanssj2'] = this.database['teen_gohan_ssj2'];
        this.database['gohan'] = this.database['teen_gohan_ssj2'];
        this.database['teen_gohan'] = this.database['teen_gohan_ssj2'];
        this.database['teengohan'] = this.database['teen_gohan_ssj2'];

        // --- FRIEZA ---
        const frieza_vo = '/Assets/SONS/DUBLAGEM/FREEZA';

        this.database['frieza_final'] = {
            characterId: 'frieza_final',
            quotes: this.makeCharacterQuotes('frieza_final', {
                MATCH_START: [
                    q('fr_start_1', "Ouça... eu sou o grande Freeza!", "Listen... I am the great Frieza!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/OU%C3%87A%20EU%20SOU%20O%20GRANDE%20FREEZA.wav'),
                    q('fr_start_2', "Estou pronto! Finalmente consegui meu poder máximo!", "I am ready! Finally I achieved my maximum power!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/ESTOU%20PRONTO%20FINALMENTE%20CONSEGUI%20MEU%20PODER%20MAXIMO.wav'),
                    q('fr_start_3', "A única coisa que se pode esperar é a morte!", "The only thing you can expect is death!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/A%20UNICA%20COISA%20QUE%20PODE%20ESPERAR%20E%20A%20MORTE.wav')
                ],
                FIRST_STRIKE: [
                    q('fr_first_1', "Este será o seu fim!", "This will be your end!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/ESTE%20SERA%20O%20SEU%20FIM.wav'),
                    q('fr_first_2', "Vou te matar de qualquer jeito!", "I will kill you anyway!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/VOU%20TE%20MATAR%20DE%20QUALQUER%20JEITO.wav')
                ],
                CLASH: [
                    q('fr_clash_1', "Bem, o aquecimento já terminou!", "Well, the warm-up is already over!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/BEM%20O%20AQUECIMENTO%20JA%20TERMINOU.wav'),
                    q('fr_clash_2', "Haaah!", "Haaah!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/COMBO.wav'),
                    q('fr_clash_3', "Haaaaaaa!", "Haaaaaaa!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/COMBO%20%282%29.wav')
                ],
                COMBO_HIGH: [
                    q('fr_combo_1', "Morra, maldito!", "Die, damn you!", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/MORRA%20MALDITO.wav'),
                    q('fr_combo_2', "Vou fazê-lo em pedaços! Hahaha!", "I will tear you to pieces! Hahaha!", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/VOU%20FAZE-LO%20EM%20PEDA%C3%87OS%20HAHAHAHA.wav')
                ],
                TRANSFORMATION: [
                    q('fr_trans_1', "Agora vou mostrar os cem por cento do meu poder!", "Now I will show you one hundred percent of my power!", 3, 'COMMON', CharacterEmotion.ANGRY, frieza_vo + '/AGORA%20VOU%20MOSTRAS%20O%20CEM%20PORCENTO%20DO%20MEU%20PODER.wav')
                ],
                ULTIMATE: [
                    q('fr_ult_1', "Você morrerá junto de todo esse planeta!", "You will die along with this whole planet!", 5, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/VOC%C3%8E%20MORRERA%20JUNTO%20DESSE%20PLANETAAAA.wav'),
                    q('fr_ult_2', "Dentro de cinco minutos, esse planeta se destruirá em pó!", "Within five minutes, this planet will be destroyed to dust!", 5, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/DENTRO%20DE%205%20MINUTOS%20ESSE%20PLANETA%20SE%20DESTRUIRA%20EM%20P%C3%93.wav')
                ],
                LOW_HP_SELF: [
                    q('fr_lowself_1', "Não serei vencido por uma criatura inferior a mim!", "I won't be defeated by an inferior creature!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, frieza_vo + '/N%C3%83O%20SEREI%20VENCIDO%20POR%20UMA%20CRIATURA%20INFERIOR%20A%20MIM.wav'),
                    q('fr_lowself_2', "Não vou deixar um verme miserável como você me vencer!", "I won't let a wretched worm like you defeat me!", 3, 'COMMON', CharacterEmotion.EXHAUSTED, frieza_vo + '/N%C3%83O%20VOU%20DEIXAR%20UM%20VERME%20MISERAVEL%20COMO%20VOC%C3%8E%20ME%20VENCER.wav')
                ],
                LOW_HP_OPPONENT: [
                    q('fr_lowopp_1', "Não adiantará nada, em breve você estará morto!", "It won't matter, soon you will be dead!", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/N%C3%83O%20ADIANTA%20EM%20BREVE%20ESTARA%20MORTO.wav'),
                    q('fr_lowopp_2', "Pobrezinho... poderia te matar sem precisar usar as mãos.", "Poor thing... I could kill you without even using my hands.", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/POBREZINHO%20PODERIA%20TE%20MATAR%20SEM%20PRECISAR%20USAR%20AS%20M%C3%83OS.wav')
                ],
                REVERSAL: [
                    q('fr_reversal_1', "Agora é que vai começar o melhor!", "Now is when the best begins!", 4, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/AGORA%20E%20QUE%20VAI%20COME%C3%87AR%20O%20MELHOR.wav')
                ],
                VICTORY: [
                    q('fr_win_1', "A dor que irão sentir é pior do que estar no inferno!", "The pain you will feel is worse than being in hell!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/A%20DOR%20QUE%20IRAM%20SENTIR%20E%20PIOR%20DO%20QUE%20ESTAR%20NO%20INFERNO.wav'),
                    q('fr_win_2', "Como se atreve a desafiar o meu poder?!", "How dare you challenge my power?!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/COMO%20SE%20ATREVE%20A%20DESAFIAR%20O%20MEU%20PODER.wav'),
                    q('fr_win_3', "Sua morte já está garantida!", "Your death is already guaranteed!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/SUA%20MORTE%20JA%20ESTA%20GARANTIDA.wav')
                ],
                DEFEAT: [
                    q('fr_loss_1', "Não posso acreditar que esse pesadelo se tornasse realidade!", "I cannot believe this nightmare could become reality!", 2, 'COMMON', CharacterEmotion.EXHAUSTED, frieza_vo + '/N%C3%83O%20POSSO%20ACREDITAR%20QUE%20ESSE%20PESADELO%20PODERIA%20SE%20TORNAR%20REALIDADE.wav'),
                    q('fr_loss_2', "Não pretendo perder... Haaaaa!", "I don't intend to lose... Haaaaa!", 2, 'COMMON', CharacterEmotion.EXHAUSTED, frieza_vo + '/N%C3%83O%20PRETENDO%20HAAA%20PERDEEEE.wav')
                ],
                TIME_RUNNING_OUT: [
                    q('fr_time_1', "Vou acabar com essa brincadeira absurda, porque já me cansei de você!", "I will put an end to this absurd joke, because I've grown tired of you!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/VOU%20ACABAR%20COM%20ESSA%20BRINCADEIRA%20ABSURDA%20POR%20QUE%20EU%20ME%20CANSEI%20DE%20VOC%C3%8E.wav')
                ],
                LONG_IDLE: [
                    q('fr_idle_1', "Quando é que vai se render?!", "When are you going to surrender?!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/QUANDO%20E%20QUE%20VAI%20SE%20RENDER.wav')
                ],
                BEING_DOMINATED: [
                    q('fr_dom_1', "Como você está vivo?!", "How are you alive?!", 2, 'COMMON', CharacterEmotion.DESPERATE, frieza_vo + '/MAS%20COMO%20VOC%C3%8E%20ESTA%20VIVO.wav'),
                    q('fr_dom_2', "Mas quem... quem é você?!", "But who... who are you?!", 2, 'COMMON', CharacterEmotion.DESPERATE, frieza_vo + '/MAS%20QUEM%20QUEM%20E%20VOC%C3%8E.wav')
                ],
                CRITICAL_DAMAGE: [
                    q('fr_crit_1', "Seu miserável!", "You wretched scoundrel!", 3, 'COMMON', CharacterEmotion.ANGRY, frieza_vo + '/SEU%20MISERAVEL.wav')
                ],
                PERFECT_GUARD: [
                    q('fr_guard_1', "Acha que vou deixar me enganar com esse plano tolo?!", "Do you think I'll let myself be fooled by such a foolish plan?!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/ACHA%20QUE%20VOU%20DEIXAR%20ME%20ENGANAR%20COM%20ESSE%20PLANO%20TOLO.wav')
                ],
                COUNTER_ATTACK: [
                    q('fr_counter_1', "Diga-me, como gostaria de morrer, garotinho atrevido?", "Tell me, how would you like to die, cheeky little boy?", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/DIGAME%20COMO%20GOSTARIA%20DE%20MORRER%20GAROTINHO%20ATREVIDO.wav')
                ],
                KNOCKBACK_RECOVERY: [
                    q('fr_knock_1', "Suba imediatamente, pois esse ataque não deve ter matado você!", "Come up immediately, for this attack must not have killed you!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/SUBA%20IMEDIATAMENTE%20POIS%20ESSE%20ATAQUE%20N%C3%83O%20DEVE%20TER%20MATADO%20VOC%C3%8E.wav')
                ],
                DESPERATE_MODE_ENTER: [
                    q('fr_desp_1', "Vou te devolver dez vezes isso, não, melhor, cem vezes mais!", "I'll return ten times this to you, no, better, a hundred times more!", 3, 'COMMON', CharacterEmotion.DESPERATE, frieza_vo + '/EU%20VOU%20TE%20DEVOLVER%2010%20VEZES%20ISSO%20N%C3%83O%20MELHOR%20100%20VEZES%20MAIS.wav')
                ],
                LONG_OFFENSIVE_SEQUENCE: [
                    q('fr_off_1', "Sua morte já está garantida!", "Your death is already guaranteed!", 2, 'COMMON', CharacterEmotion.CONFIDENT, frieza_vo + '/SUA%20MORTE%20JA%20ESTA%20GARANTIDA.wav')
                ],
                NO_KI: [
                    q('fr_noki_1', "Diga-me, vermezinho, onde está toda a sua energia?!", "Tell me, little worm, where is all your energy?!", 2, 'COMMON', CharacterEmotion.EXHAUSTED, frieza_vo + '/DIGAME%20VERMEZINHO%20ONDE%20ESTA%20TODA%20SUA%20ENERGIA.wav')
                ],
                CHARGING_KI: [
                    q('fr_charge_1', "HAAAAAAA!", "HAAAAAAA!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/HAAAAAAA.wav')
                ],
                COMBO_CANCEL: [
                    q('fr_cancel_1', "Vá embora!", "Go away!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/VA%20EMBORA.wav')
                ],
                ULTIMATE_INTERRUPT: [
                    q('fr_ultint_1', "Como você ousa?!", "How dare you?!", 4, 'COMMON', CharacterEmotion.ANGRY, frieza_vo + '/CALE-SEEEEE.wav')
                ],
                MATCH_POINT: [
                    q('fr_mp_1', "A completa extinção da sua raça está a um passo!", "The complete extinction of your race is one step away!", 2, 'COMMON', CharacterEmotion.CALM, frieza_vo + '/PRA%20MIM%20JA%20CHEGA%20A%20COMPLETA%20EXTINS%C3%83O%20DA%20SUA%20RA%C3%87A%20ESTAR%20A%20UM%20PASSO.wav')
                ],
                PERFECT_WIN: [
                    q('fr_perfect_1', "Antes de mais nada, gostaria de dizer que nunca havia me emocionado antes!", "First of all, I'd like to say that I've never been emotional before!", 4, 'LEGENDARY', CharacterEmotion.CALM, frieza_vo + '/ANTES%20DE%20MAIS%20NADA%20GOSTARIA%20DE%20DIZER%20QUE%20NUNCA%20HAVIA%20ME%20EMOCIONADO%20ANTES%20.wav')
                ]
            })
        };

        this.database['frieza'] = this.database['frieza_final'];
        this.database['freeza'] = this.database['frieza_final'];
        this.database['freeza_final'] = this.database['frieza_final'];
    }

    /**
     * Map a character base quotes map
     */
    private makeCharacterQuotes(charId: string, quotes: Record<string, DialogueQuote[]>): Record<BattleEvent, DialogueQuote[]> {
        return quotes as Record<BattleEvent, DialogueQuote[]>;
    }

    private resolveCanonicalId(characterId: string): string {
        if (!characterId) return 'default';
        const id = characterId.toLowerCase();
        
        // Exact mappings:
        if (id === 'goku_base_swl' || id === 'goku_base' || id === 'gokubase' || id === 'goku' || id === 'goku_ssj' || id === 'gokussj' || id === 'goku_blue' || id === 'gokublue' || id === 'goku_mui' || id === 'gokumui') {
            return 'goku_base';
        }
        if (id === 'goku_black_rose' || id === 'goku_black' || id === 'gokusub_black' || id === 'gokublack' || id === 'black') {
            return 'goku_black';
        }
        if (id === 'vegeta_base' || id === 'vegetabase' || id === 'vegeta') {
            return 'vegeta_base';
        }
        if (id === 'vegeta_ego' || id === 'vegetaego' || id === 'ego') {
            return 'vegeta_ego';
        }
        if (id === 'goku_blue_gif' || id === 'goku_blue' || id === 'gokublue') {
            return 'goku_blue';
        }
        if (id === 'goku_ssj' || id === 'gokussj') {
            return 'goku_ssj';
        }
        if (id === 'goku_mui' || id === 'gokumui') {
            return 'goku_mui';
        }
        if (id === 'trunks_ssj2' || id === 'trunksssj2' || id === 'trunks') {
            return 'trunks';
        }
        if (id === 'teen_gohan_ssj2' || id === 'teengohanssj2' || id === 'gohan' || id === 'teen_gohan' || id === 'teengohan') {
            return 'teen_gohan_ssj2';
        }
        if (id === 'frieza_final' || id === 'frieza' || id === 'freeza_final' || id === 'freeza') {
            return 'frieza_final';
        }
        
        return id.split('_')[0];
    }

    /**
     * Retrieves all quotes for a character under a certain event
     */
    public getCharacterQuotes(characterId: string, event: BattleEvent): DialogueQuote[] {
        if (!this.database) return [];
        const canonicalId = this.resolveCanonicalId(characterId);
        const bank = this.database[canonicalId] || this.database[characterId];
        if (!bank || !bank.quotes) return [];
        return bank.quotes[event] || [];
    }

    /**
     * Retrieves appropriate quote using probability, weight and rarity
     */
    public getQuote(characterId: string, event: BattleEvent, preferredEmotion?: CharacterEmotion): DialogueQuote | null {
        if (!this.database) return null;
        let cleanId = this.resolveCanonicalId(characterId);

        let charBank = this.database[cleanId] || this.database[characterId] || this.database['default'];
        if (!charBank || !charBank.quotes) {
            charBank = this.database['default'];
        }
        if (!charBank || !charBank.quotes) return null;

        let quotes = charBank.quotes[event];

        if ((!quotes || quotes.length === 0) && (event === BattleEvent.ULTIMATE_2 || event === BattleEvent.ULTIMATE_3)) {
            quotes = charBank.quotes[BattleEvent.ULTIMATE];
        }

        if (!quotes || quotes.length === 0) {
            // fallback to default
            quotes = this.database['default'].quotes[event] || this.database['default'].quotes[BattleEvent.ULTIMATE];
        }

        if (!quotes || quotes.length === 0) return null;

        // Try to filter by emotion if specified
        if (preferredEmotion) {
            const emotionalQuotes = quotes.filter(q => q.emotion === preferredEmotion);
            if (emotionalQuotes.length > 0) {
                quotes = emotionalQuotes;
            }
        }

        // Random selection with higher probability of COMMON over RARE/LEGENDARY
        const rand = Math.random();
        let selectable: DialogueQuote[] = [];

        if (rand < 0.05) { // 5% Legendary
            selectable = quotes.filter(q => q.rarity === 'LEGENDARY');
        }
        if (selectable.length === 0 && rand < 0.20) { // 20% Rare
            selectable = quotes.filter(q => q.rarity === 'RARE');
        }
        if (selectable.length === 0) { // Common
            selectable = quotes.filter(q => q.rarity === 'COMMON');
        }

        // Fallback to any selectable if empty
        if (selectable.length === 0) {
            selectable = quotes;
        }

        const pickedIndex = Math.floor(Math.random() * selectable.length);
        return selectable[pickedIndex] || null;
    }

    public getRelationReaction(speakerId: string, listenerId: string, event: BattleEvent): DialogueQuote | null {
        const quote = this.getRelationReactionInternal(speakerId, listenerId, event);
        if (quote) {
            quote.voiceKey = this.normalizeVoiceKey(quote.voiceKey);
        }
        return quote;
    }

    /**
     * Get specific reaction response quote (internal)
     */
    private getRelationReactionInternal(speakerId: string, listenerId: string, event: BattleEvent): DialogueQuote | null {
        const speaker = this.resolveCanonicalId(speakerId);
        const listener = this.resolveCanonicalId(listenerId);

        if (speaker === 'goku_base') {
            const gbase = '/Assets/SONS/DUBLAGEM/GOKU%20BASE';

            // 1. Check event-specific relations first (like Vegeta's time limit and Gohan's praise)
            if (listener.includes('vegeta') || listener === 'vegeta' || listener === 'vegeta_base' || listener === 'vegetabase') {
                if (event === BattleEvent.TIME_RUNNING_OUT || event === BattleEvent.DESPERATE_MODE_ENTER || event === BattleEvent.LONG_IDLE) {
                    return {
                        id: 'gb_rel_vegeta_time',
                        textPt: "Vegeta, são 30 minutos, não passa disso!",
                        textEn: "Vegeta, it's 30 minutes, no more than that!",
                        voiceKey: gbase + '/VEGETA%20S%C3%83O%2030%20MINUTOS%20N%C3%83O%20PASSA%20DISSO.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
            }

            if (listener.includes('gohan') || listener === 'gohan') {
                if (event === BattleEvent.VICTORY || event === BattleEvent.LOW_HP_OPPONENT) {
                    return {
                        id: 'gb_rel_gohan_praise',
                        textPt: "Gohan, você mandou muito bem, meu filho!",
                        textEn: "Gohan, you did very well, my son!",
                        voiceKey: gbase + '/GOHAN%20VOCE%20MANDOU%20MUITO%20BEM%20MEU%20FILHO.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
            }

            // 2. Intros (MATCH_START) with target identification
            if (event === BattleEvent.MATCH_START) {
                // Build the specific matched intro based on the opponent/listener ID
                if (listener.includes('vegeta') || listener === 'vegeta' || listener === 'vegeta_base' || listener === 'vegetabase') {
                    return {
                        id: 'gb_intro_vegeta',
                        textPt: "Você é mesmo forte, Vegeta! Que treinamento está fazendo?",
                        textEn: "You really are strong, Vegeta! What kind of training are you doing?",
                        voiceKey: gbase + '/VOC%C3%8A%20E%20MESMO%20FORTE%20VEGETA%20QUE%20TREINAMENTO%20ESTA%20FAZENDO.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('gohan') || listener === 'gohan') {
                    if (Math.random() < 0.5) {
                        return {
                            id: 'gb_intro_gohan_1',
                            textPt: "Vamos lutar agora, Gohan!",
                            textEn: "Let's fight now, Gohan!",
                            voiceKey: gbase + '/VAMOS%20LUTAR%20AGORA%20GOHAN.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    } else {
                        return {
                            id: 'gb_intro_gohan_2',
                            textPt: "Libere seu poder, Gohan!",
                            textEn: "Unleash your power, Gohan!",
                            voiceKey: gbase + '/LIBERE%20SEU%20PODER%20GOHAN.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    }
                }
                if (listener.includes('piccolo') || listener === 'piccolo') {
                    return {
                        id: 'gb_intro_piccolo',
                        textPt: "Piccolo, me mostre seu poder atual!",
                        textEn: "Piccolo, show me your current power!",
                        voiceKey: gbase + '/PICCOLO%20ME%20MOSTRE%20SEU%20PODER%20ATUAL.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('black') || listener === 'goku_black' || listener === 'gokublack') {
                    if (Math.random() < 0.5) {
                        return {
                            id: 'gb_intro_black_1',
                            textPt: "Caramba, você se parece mesmo comigo, cara!",
                            textEn: "Wow, you really look just like me, man!",
                            voiceKey: gbase + '/CARAMBA%20VOC%C3%8A%20SE%20PARECE%20MESMO%20COMIGO%20CARA.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    } else {
                        return {
                            id: 'gb_intro_black_2',
                            textPt: "Então você é amigo do Black.",
                            textEn: "So you're Black's friend.",
                            voiceKey: gbase + '/ENT%C3%83O%20VOC%C3%8A%20E%20AMIGO%20DO%20BLACK.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    }
                }
                if (listener.includes('bills') || listener === 'bills' || listener === 'beerus') {
                    return {
                        id: 'gb_intro_bills',
                        textPt: "Ninguém consegue travar uma batalha contra você, Senhor Bills.",
                        textEn: "No one can keep up a battle with you, Lord Beerus.",
                        voiceKey: gbase + '/INTRODU%C3%87%C3%83O/NINGUEM%20COSEGUE%20TRAVAR%20UMA%20BATALHA%20CONTRA%20VOC%C3%8E%20SENHOR%20BILLS.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('wis') || listener === 'whis') {
                    return {
                        id: 'gb_intro_whis',
                        textPt: "Agradeço pela ajuda, Senhor Wis.",
                        textEn: "Thank you for the help, Lord Whis.",
                        voiceKey: gbase + '/AGRADE%C3%87O%20PELA%20AJUDA%20SENHOR%20WIS.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('hit') || listener === 'hit') {
                    return {
                        id: 'gb_intro_hit',
                        textPt: "Faz muito tempo que não nos vemos, Hit!",
                        textEn: "It's been a long time since we saw each other, Hit!",
                        voiceKey: gbase + '/FAZ%20MUITO%20TEMPO%20QU%20N%C3%83O%20NOS%20VEMOS%20HIT.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('trunks') || listener === 'trunks') {
                    return {
                        id: 'gb_intro_trunks',
                        textPt: "Trunks, bora mostrar nossa força!",
                        textEn: "Trunks, let's show our strength!",
                        voiceKey: gbase + '/TRUNKS%20BORA%20MOSTRAR%20NOSSA%20FOR%C3%87A.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('kefla') || listener === 'kefla') {
                    return {
                        id: 'gb_intro_kefla',
                        textPt: "Pode vir, Kefla!",
                        textEn: "Come at me, Kefla!",
                        voiceKey: gbase + '/PODE%20VIR%20KEFLA.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('caulifla') || listener === 'caulifla') {
                    return {
                        id: 'gb_intro_caulifla',
                        textPt: "Tá falando do Blue? Você não está pronta, Caulifla!",
                        textEn: "Talking about Blue? You're not ready, Caulifla!",
                        voiceKey: gbase + '/TA%20FALANDO%20DO%20BLUER%20VOC%C3%8A%20N%C3%83O%20ESTA%20PRONTA%20KAULIFLA.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('frost') || listener === 'frost' || listener.includes('freeza') || listener === 'frieza') {
                    return {
                        id: 'gb_intro_frost',
                        textPt: "Olha só, o Freeza do Universo 6!",
                        textEn: "Look at that, the Frieza of Universe 6!",
                        voiceKey: gbase + '/OLHA%20SO%20O%20FREEZA%20DO%20UNIVERSO%206.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('kuririn') || listener === 'kuririn' || listener === 'krillin') {
                    return {
                        id: 'gb_intro_kuririn',
                        textPt: "Kuririn, você é um adversário muito forte, eu também quero te enfrentar!",
                        textEn: "Kuririn, you're a very strong opponent, I want to face you too!",
                        voiceKey: gbase + '/KURIRIN%20VOC%C3%8A%20E%20UM%20ADIVERSARIO%20MUITO%20FORTE%20EU%20TAMBEM%20QUERO%20TE%20ENFRENTAR.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('kame') || listener === 'mestre_kame' || listener === 'roshi') {
                    if (Math.random() < 0.5) {
                        return {
                            id: 'gb_intro_kame_1',
                            textPt: "Mestre Kame, agora você irá me enfrentar!",
                            textEn: "Master Roshi, now you will face me!",
                            voiceKey: gbase + '/MESTRE%20KAME%20AGORA%20VOC%C3%8A%20IRA%20ME%20ENFRENTAR.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    } else {
                        return {
                            id: 'gb_intro_kame_2',
                            textPt: "Que Ki impressionante, Mestre Kame!",
                            textEn: "What impressive Ki, Master Roshi!",
                            voiceKey: gbase + '/QUE%20KI%20IMPRESSIONANTE%20MESTRE%20KAME.wav',
                            priority: 4,
                            rarity: 'LEGENDARY'
                        };
                    }
                }
                if (listener.includes('zamasu') || listener === 'zamasu') {
                    return {
                        id: 'gb_intro_zamasu',
                        textPt: "Não nos demos por vencidos, Zamasu!",
                        textEn: "We're not defeated yet, Zamasu!",
                        voiceKey: gbase + '/N%C3%83O%20NOS%20DEMOS%20POR%20VENCIDO%20ZAMASU.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('bergamo') || listener === 'bergamo') {
                    return {
                        id: 'gb_intro_bergamo',
                        textPt: "Então seu nome é Bergamo.",
                        textEn: "So your name is Bergamo.",
                        voiceKey: gbase + '/ENT%C3%83O%20SEU%20NOME%20E%20BERGAMO.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('yamcha') || listener === 'yamcha') {
                    return {
                        id: 'gb_intro_yamcha',
                        textPt: "Opa, Yamcha, não acredito que veio!",
                        textEn: "Hey, Yamcha, I can't believe you came!",
                        voiceKey: gbase + '/OPA%20YANCHA%20N%C3%83O%20ACREDITO%20QUE%20VEIO.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('goten') || listener === 'goten') {
                    return {
                        id: 'gb_intro_goten',
                        textPt: "Oi Goten, tá de folga hoje?",
                        textEn: "Hey Goten, got the day off today?",
                        voiceKey: gbase + '/OI%20GOTEM%20TA%20DE%20FOLGA%20HOJE.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('17') || listener === 'android17' || listener === 'android_17') {
                    return {
                        id: 'gb_intro_17',
                        textPt: "Você que é o Número 17.",
                        textEn: "So you're Number 17.",
                        voiceKey: gbase + '/VOC%C3%8A%20QUE%20E%20O%20NUMERO%2017.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('bardock') || listener === 'bardock') {
                    return {
                        id: 'gb_intro_bardock',
                        textPt: "Vocês se parecem tanto comigo!",
                        textEn: "You guys look so much like me!",
                        voiceKey: gbase + '/VOC%C3%8AS%20SE%20PARECEM%20TANTO%20COMIGO.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener.includes('tien') || listener === 'tenshinhan' || listener === 'tenshi') {
                    return {
                        id: 'gb_intro_tien',
                        textPt: "Caramba, quer dizer que o Tenshinhan é mestre agora!",
                        textEn: "Wow, so Tien is a master now!",
                        voiceKey: gbase + '/CARAMBA%20QUE%20DIZER%20QUE%20O%20TENCHIRAM%20E%20MESTRE%20AGORA.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
                if (listener === 'kyabe' || listener === 'cabba' || listener === 'caba' || listener === 'keyou') {
                    return {
                        id: 'gb_intro_cabba',
                        textPt: "Quero ver toda aquela sua força, Cabba!",
                        textEn: "I want to see all your strength, Cabba!",
                        voiceKey: gbase + '/QUERO%20VER%20TODA%20AQUELA%20SUA%20FOR%C3%87A%20KEYOU.wav',
                        priority: 4,
                        rarity: 'LEGENDARY'
                    };
                }
            }
        }

        if (speaker === 'goku_black') {
            const gkrose = '/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE';

            if (listener.includes('zamasu') || listener === 'zamasu') {
                if (event === BattleEvent.MATCH_START) {
                    return {
                        id: 'bk_rel_zamasu_start',
                        textPt: "Então vamos lá, Zamasu.",
                        textEn: "Let's go then, Zamasu.",
                        voiceKey: gkrose + '/ENT%C3%83O%20VAMOS%20LA%20ZAMASU.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
                if (event === BattleEvent.VICTORY || event === BattleEvent.LOW_HP_OPPONENT) {
                    return {
                        id: 'bk_rel_zamasu_victory',
                        textPt: "Nós dois já exterminamos diversos humanos.",
                        textEn: "The two of us have already exterminated many humans.",
                        voiceKey: gkrose + '/NOIS%20DOIS%20JA%20ESTERMINAMOS%20DIVERSOS%20HUMANOS.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
            }

            if (listener.includes('goku') || listener === 'goku_base' || listener === 'goku_blue' || listener === 'goku_ssj' || listener === 'goku_mui') {
                if (event === BattleEvent.MATCH_START) {
                    if (Math.random() < 0.5) {
                        return {
                            id: 'bk_rel_goku_start_1',
                            textPt: "Goku, a partir de agora eu sou o Son Goku.",
                            textEn: "Goku, from now on, I am Son Goku.",
                            voiceKey: gkrose + '/GOKU%20APARTIR%20DE%20AGORA%20EU%20SOU%20O%20SON%20GOKU.wav',
                            priority: 5,
                            rarity: 'LEGENDARY'
                        };
                    } else {
                        return {
                            id: 'bk_rel_goku_start_2',
                            textPt: "Son Goku deveria se alegrar.",
                            textEn: "Son Goku should rejoice.",
                            voiceKey: gkrose + '/SON%20GOKU%20DEVERIA%20SE%20ALEGRAR.wav',
                            priority: 5,
                            rarity: 'LEGENDARY'
                        };
                    }
                }
                if (event === BattleEvent.VICTORY || event === BattleEvent.LOW_HP_OPPONENT || event === BattleEvent.REVERSAL) {
                    return {
                        id: 'bk_rel_goku_reversal',
                        textPt: "Finalmente tive plena consciência de todo o seu poder, Son Goku.",
                        textEn: "Finally, I have full awareness of all your power, Son Goku.",
                        voiceKey: gkrose + '/FINALMENTE%20TIVE%20PLENA%20CONSCIENCIA%20DE%20TODO%20O%20SEU%20PODER%20SN%20GOKU.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
            }

            if (listener.includes('trunks') || listener === 'trunks') {
                if (event === BattleEvent.MATCH_START) {
                    return {
                        id: 'bk_rel_trunks_start',
                        textPt: "Chegou a hora, pequeno Saiyajin.",
                        textEn: "The time has come, little Saiyan.",
                        voiceKey: gkrose + '/CHEGOU%20A%20HORA%20PEQUENO%20SAYAJIN.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
                if (event === BattleEvent.LOW_HP_OPPONENT || event === BattleEvent.VICTORY) {
                    return {
                        id: 'bk_rel_trunks_mock',
                        textPt: "Não era você que iria proteger esse mundo, rapaz?",
                        textEn: "Weren't you the one who was going to protect this world, kid?",
                        voiceKey: gkrose + '/N%C3%83O%20ERA%20VOC%C3%8E%20QUE%20IRIA%20PROTEGER%20ESSE%20MUNDO%20RAPAZ.wav',
                        priority: 5,
                        rarity: 'LEGENDARY'
                    };
                }
            }
        }

        if (speaker === 'vegeta_base') {
            const vbase = '/Assets/SONS/DUBLAGEM/VEGETA%20BASE';

            const playFile = (filename: string, textPt: string, textEn: string, priority: number = 4) => {
                return {
                    id: `vb_dyn_${filename.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    textPt,
                    textEn,
                    voiceKey: `${vbase}/${filename.replace(/ /g, "%20")}`,
                    priority,
                    rarity: 'LEGENDARY' as const
                };
            };

            if (event === BattleEvent.MATCH_START) {
                // Intro vs Goku
                if (listener.includes('goku') || listener === 'goku_base' || listener === 'goku_blue' || listener === 'goku_ssj' || listener === 'goku_mui' || listener === 'goku_base_swl' || listener === 'goku_blue_gif') {
                    const r = Math.random();
                    if (r < 0.2) {
                        return playFile("HORA ATE QUE ENFIM KAKAROTO IRA LUTAR COMO SE DEVE.wav", "Ora, até que enfim Kakaroto irá lutar como se deve!", "Well, finally Kakarot will fight like he should!", 5);
                    } else if (r < 0.4) {
                        return playFile("KAKAROTO VAMOS LUTAR VOCÊ E EU.wav", "Kakaroto, vamos lutar você e eu!", "Kakarot, let's fight, you and me!", 5);
                    } else if (r < 0.6) {
                        return playFile("POR QUE TENHO QUE ME FUNDIR A VOCÊ SE E ISSO PREFIRO QUE ME ELIMINEM.wav", "Por que tenho que me fundir a você? Se é isso, prefiro que me eliminem!", "Why do I have to fuse with you? If that's the case, I'd rather be eliminated!", 5);
                    } else if (r < 0.8) {
                        return playFile("VOCÊ ACHA QUE E MEU RIVAL NÃO ME FAÇA RIR.wav", "Você acha que é meu rival? Não me faça rir!", "You think you're my rival? Don't make me laugh!", 5);
                    } else {
                        return playFile("VOCÊ E UM CARA MUITO DESAGRADAVEL O QUE ESTA PENSANDO EM FAZER.wav", "Você é um cara muito desagradável... O que está pensando em fazer?", "You are a very unpleasant guy... What are you thinking of doing?", 5);
                    }
                }

                // Intro vs Trunks
                if (listener.includes('trunks') || listener === 'trunks' || listener === 'trunks_ssj2') {
                    const r = Math.random();
                    if (r < 0.33) {
                        return playFile("TRUNKS SE VOCÊ ME ACERTAR EU TE LEVO AO PARQUE DE DIVERSÕES.wav", "Trunks, se você me acertar eu te levo ao parque de diversões!", "Trunks, if you hit me I'll take you to the amusement park!", 5);
                    } else if (r < 0.66) {
                        return playFile("NÃO PRECISA CHORAR QUE EU TE LEVO AO PARQUE.wav", "Não precisa chorar que eu te levo ao parque!", "No need to cry, I'll take you to the park!", 5);
                    } else {
                        return playFile("ISSO SO MOSTRA O QUE A PAZ FAZ COM OS INDICIPLINADOS.wav", "Isso só mostra o que a paz faz com os indisciplinados...", "This only shows what peace does to the undisciplined...", 5);
                    }
                }

                // Intro vs Gohan
                if (listener.includes('gohan')) {
                    return playFile("QUE PATETICO VOCÊ ERA MAIS FORTE QUANDO ERA PEQUENO.wav", "Que patético, você era mais forte quando era pequeno!", "How pathetic, you were stronger when you were small!", 5);
                }

                // Intro vs Majin Buu/Monster
                if (listener.includes('buu') || listener.includes('majin') || listener.includes('frieza')) {
                    const r = Math.random();
                    if (r < 0.5) {
                        return playFile("ESSE PALHAÇO GORDO E MAJIN BULL.wav", "Esse palhaço gordo é Majin Buu?!", "Is that fat clown Majin Buu?!", 5);
                    } else {
                        return playFile("MAJIN BULL VOCÊ E IMORTAL.wav", "Majin Buu, você é imortal?", "Majin Buu, are you immortal?", 5);
                    }
                }

                // Intro vs Saiyans (including mirror matches)
                if (listener.includes('gogeta') || listener.includes('saiyajin') || listener.includes('vegeta')) {
                    if (Math.random() < 0.5) {
                        return playFile("E ISSO QUE E SER UM SAYAJIN.wav", "Isso é que é ser um saiyajin!", "That's what it means to be a Saiyan!", 5);
                    } else {
                        return playFile("VOCÊ NÃO E O KAKAROTO MAIS CERTAMENTE E UM SAYAJIN.wav", "Você não é o Kakaroto mas certamente é um saiyajin!", "You're not Kakarot, but you're certainly a Saiyan!", 5);
                    }
                }

                // Random General Intros
                const rand = Math.random();
                if (rand < 0.11) {
                    return playFile("HORA DE VOCÊ ENFRENTAR O PRINCIPE DOS SAYAJINS.wav", "Hora de você enfrentar o Príncipe dos Saiyajins!", "Time for you to face the Prince of Saiyans!");
                } else if (rand < 0.22) {
                    return playFile("BEM VAMOS LUTAR.wav", "Bem, vamos lutar!", "Well, let's fight!");
                } else if (rand < 0.33) {
                    return playFile("VAMOS LUTAR VOCÊ E EU.wav", "Vamos lutar você e eu!", "Let's fight, you and me!");
                } else if (rand < 0.44) {
                    return playFile("VAMOS DEIXAR DE ENROLAÇÃO.wav", "Vamos deixar de enrolação!", "Let's stop wasting time!");
                } else if (rand < 0.55) {
                    return playFile("VOCÊ REALMENTE ACHA QUE EUE VOU ME SEGURAR.wav", "Você realmente acha que eu vou me segurar?!", "Do you really think I'm going to hold back?!");
                } else if (rand < 0.66) {
                    return playFile("PREPARE SE.wav", "Prepare-se!", "Prepare yourself!");
                } else if (rand < 0.77) {
                    return playFile("DEIXA ISSO COMIGO.wav", "Deixa isso comigo!", "Leave this to me!");
                } else if (rand < 0.88) {
                    return playFile("NINGUEM ME CONTROLA MUITO MENOS VOCÊ.wav", "Ninguém me controla! Muito menos você!", "Nobody controls me! Much less you!");
                } else {
                    return playFile("TENTE CONTROLAR A MINHA MENTE SEU VERME.wav", "Tente controlar a minha mente, seu verme!", "Try controlling my mind, you worm!");
                }
            }

            if (event === BattleEvent.VICTORY) {
                if (listener.includes('goku') || listener === 'goku_base' || listener === 'goku_blue' || listener === 'goku_ssj' || listener === 'goku_mui' || listener === 'goku_base_swl' || listener === 'goku_blue_gif') {
                    return playFile("FINALMENTE EU DERROTEI O KAKAROTO.wav", "Finalmente eu derrotei o Kakaroto!", "Finally I've defeated Kakarot!", 5);
                }

                const r = Math.random();
                if (r < 0.14) {
                    return playFile("ATE QUE ENFIM TUDO ACABOU.wav", "Até que enfim tudo acabou!", "Finally, everything is over!");
                } else if (r < 0.28) {
                    return playFile("E O RESULTADO FOI COMO O ESPERADO.wav", "E o resultado foi como o esperado!", "And the result was as expected!");
                } else if (r < 0.42) {
                    return playFile("VOCÊ DEVERIA TREINAR MAIS ESTA DISPERDIÇANDO SEU POTENCIAL.wav", "Você deveria treinar mais, está desperdiçando seu potencial!", "You should train more, you're wasting your potential!");
                } else if (r < 0.56) {
                    return playFile("VOCÊ FICOU FRACO ENQUANTO EU CONTINUEI TREINANDO.wav", "Você ficou fraco, enquanto eu continuei treinando!", "You got weak, while I continued training!");
                } else if (r < 0.7) {
                    return playFile("VOCÊ TEM QUE TREINAR MAIS PARA BATALHAS COMO ESTA.wav", "Você tem que treinar mais para batalhas como esta!", "You need to train more for battles like this!");
                } else if (r < 0.85) {
                    return playFile("E ASSIM QUE DEVE SER.wav", "É assim que deve ser.", "That's how it's supposed to be.");
                } else {
                    return playFile("HORA DE DIZER ADEUS.wav", "Hora de dizer adeus.", "Time to say goodbye.");
                }
            }

            if (event === BattleEvent.LOW_HP_OPPONENT) {
                const r = Math.random();
                if (r < 0.2) {
                    return playFile("VOCÊ JA ERA.wav", "Você já era!", "You're done!");
                } else if (r < 0.4) {
                    return playFile("VOCÊ MERECE MORRER.wav", "Você merece morrer!", "You deserve to die!");
                } else if (r < 0.6) {
                    return playFile("O QUE FOI TA COM MEDO.wav", "O que foi? Tá com medo?!", "What is it, are you scared?!");
                } else if (r < 0.8) {
                    return playFile("EU VOU ACABAR COM ESSE SUJEITO.wav", "Eu vou acabar com esse sujeito!", "I will finish this guy!");
                } else {
                    return playFile("VOCÊ E UM INSETO.wav", "Você é um inseto!", "You are an insect!");
                }
            }

            if (event === BattleEvent.DESPERATE_MODE_ENTER || event === BattleEvent.LOW_HP_SELF) {
                const r = Math.random();
                if (r < 0.25) {
                    return playFile("EU NÃO VOU PERMITIR ISSO ESSE SUJEITO NÃO VAI ME VENCER.wav", "Eu não vou permitir isso, esse sujeito não vai me vencer!", "I won't allow this, this guy won't defeat me!", 5);
                } else if (r < 0.5) {
                    return playFile("NÃO POSSO ACREDITAR.wav", "Não posso acreditar!", "I can't believe it!");
                } else if (r < 0.75) {
                    return playFile("EU QUERO ACABAR COM ISSO DE UMA VEZ POR TODAS.wav", "Eu quero acabar com isso de uma vez por todas!", "I want to finish this once and for all!", 5);
                } else {
                    return playFile("EU VOU SUPERAR A MIM MESMO.wav", "Eu vou superar a mim mesmo!", "I will surpass myself!", 5);
                }
            }

            if (event === BattleEvent.REVERSAL) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("VOCÊ NÃO IA ACABAR COMIGO.wav", "Você não ia acabar comigo?!", "Weren't you going to finish me?!");
                } else {
                    return playFile("ISSO NÃO TERMINOU.wav", "Isso não terminou!", "This is not over!");
                }
            }

            if (event === BattleEvent.LONG_IDLE) {
                const now = Date.now();
                const lastSpeaker = VoiceQueue.getInstance().getLastSpeechSpeakerId();
                const lastTime = VoiceQueue.getInstance().getLastSpeechTimestamp();
                // Check if the other player actually spoke in the last 8 seconds
                const spokenRecently = lastSpeaker && lastSpeaker !== 'vegeta' && lastSpeaker !== 'vegeta_base' && (now - lastTime < 8000);

                if (spokenRecently) {
                    return playFile("PARE DE FICAR FALANDO E VAMOS LUTAR DE UMA VEZ.wav", "Pare de ficar falando e vamos lutar de uma vez!", "Stop talking and let's fight already!");
                } else {
                    const r = Math.random();
                    if (r < 0.5) {
                        return playFile("NÃO SOU DO TIPO QUE FICA SEM FAZER NADA .wav", "Não sou do tipo que fica sem fazer nada.", "I am not the type to sit idly by.");
                    } else {
                        return playFile("NÃO ME AMOLE.wav", "Não me amole!", "Don't pester me!");
                    }
                }
            }

            if (event === BattleEvent.CLASH) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("O QUE VAI FAZER.wav", "O que vai fazer?", "What are you going to do?");
                } else {
                    return playFile("EU JA TINHA ME ESQUECIDO DISSO.wav", "Eu já tinha me esquecido disso!", "I had already forgotten about this!");
                }
            }

            if (event === BattleEvent.PERFECT_GUARD) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("EU JA ESPERAVA.wav", "Eu já esperava!", "I already expected this!");
                } else {
                    return playFile("PRA MIM ISSO NÃO AFETA EM NADA.wav", "Pra mim isso não afeta em nada.", "To me, this affects nothing.");
                }
            }

            if (event === BattleEvent.CRITICAL_DAMAGE || event === BattleEvent.BEING_DOMINATED) {
                const r = Math.random();
                if (r < 0.33) {
                    return playFile("MISERAVEL.wav", "Miserável!", "You wretched scoundrel!");
                } else if (r < 0.66) {
                    return playFile("ISSO ME DEIXA IRRITADO.wav", "Isso me deixa irritado!", "This pisses me off!");
                } else {
                    return playFile("O QUE.wav", "O que?!", "What?!");
                }
            }

            if (event === BattleEvent.FIRST_STRIKE) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("PENSOU QUE ESCAPARIA CORVARDE.wav", "Pensou que escaparia, covarde?!", "Did you think you would escape, coward?!");
                } else {
                    return playFile("AONDE PENSA QUE VAI.wav", "Aonde pensa que vai?!", "Where do you think you are going?!");
                }
            }
        }

        if (speaker === 'frieza_final' || speaker === 'frieza' || speaker === 'freeza') {
            const fbase = '/Assets/SONS/DUBLAGEM/FREEZA';

            const playFile = (filename: string, textPt: string, textEn: string, priority: number = 4) => {
                const encodedFilename = encodeURIComponent(filename)
                    .replace(/\(/g, '%28')
                    .replace(/\)/g, '%29');
                return {
                    id: `fr_dyn_${filename.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    textPt,
                    textEn,
                    voiceKey: `${fbase}/${encodedFilename}`,
                    priority,
                    rarity: 'LEGENDARY' as const
                };
            };

            if (event === BattleEvent.MATCH_START) {
                // vs Goku
                if (listener.includes('goku') || listener === 'goku_base' || listener === 'goku_blue' || listener === 'goku_ssj' || listener === 'goku_mui' || listener === 'goku_base_swl' || listener === 'goku_blue_gif') {
                    const r = Math.random();
                    if (r < 0.33) {
                        return playFile("UM SAYAJIN DE CLASSE BAIXA E COMO UM VERME PARA MIM.wav", "Um saiyajin de classe baixa é como um verme para mim!", "A low-class Saiyan is like a worm to me!", 5);
                    } else if (r < 0.66) {
                        return playFile("EU VOU ENTERRAR VOCÊ NO TUMULO QUE ESTA O SEU PAI.wav", "Eu vou enterrar você no túmulo em que está o seu pai!", "I will bury you in the grave where your father is!", 5);
                    } else {
                        return playFile("VOCÊ NÃO PODE ME VENCER.wav", "Você não pode me vencer!", "You cannot defeat me!", 5);
                    }
                }

                // vs Vegeta
                if (listener.includes('vegeta') || listener === 'vegeta_base' || listener === 'vegeta_ego') {
                    const r = Math.random();
                    if (r < 0.5) {
                        return playFile("EM BREVE EU GOVERNAREI ESSE UNIVERSO SOBRE SEU TUMULO.wav", "Em breve eu governarei esse universo sobre seu túmulo!", "Soon I will rule this universe over your grave!", 5);
                    } else {
                        return playFile("TODOS VOCÊS QUE VEEM DA TERRA SÃO TODOS UNS IDIOTAS E IGNORANTES POR NÃO SABEREM COM QUEM ESTÃO LUTANDO.wav", "Todos vocês que vêm da Terra são todos uns idiotas e ignorantes por não saberem com quem estão lutando!", "All of you who come from Earth are all bunch of idiots and ignorants for not knowing who you are fighting with!", 5);
                    }
                }

                // vs Gohan (or kids)
                if (listener.includes('gohan') || listener.includes('trunks')) {
                    const r = Math.random();
                    if (r < 0.33) {
                        return playFile("DIGAME COMO GOSTARIA DE MORRER GAROTINHO ATREVIDO.wav", "Diga-me, como gostaria de morrer, garotinho atrevido?", "Tell me, how would you like to die, cheeky little boy?", 5);
                    } else if (r < 0.66) {
                        return playFile("E AGORA DIGA GAROTO COMO GOSTARIA DE SER ELIMINADO.wav", "E agora diga, garoto, como gostaria de ser eliminado?", "And now tell me, boy, how would you like to be eliminated?", 5);
                    } else {
                        return playFile("EHHH VOCÊ E APENAS UM GAROTO SEU PODER NÃO PASSA DESSE NIVEL.wav", "Eh... você é apenas um garoto, seu poder não passa desse nível!", "Eh... you are just a boy, your power doesn't go beyond this level!", 5);
                    }
                }

                // vs Majin Buu
                if (listener.includes('buu') || listener.includes('majin')) {
                    return playFile("MEU QUERIDO PAPAI ME ALERTOU PARA NÃO TE ENFRENTAR MAJIN BUU ESPERO QUE SEJA VERDADE.wav", "Meu querido papai me alertou para não te enfrentar, Majin Buu... Espero que seja verdade!", "My dear father warned me not to face you, Majin Buu... I hope it is true!", 5);
                }

                // vs Piccolo (Namekian)
                if (listener.includes('piccolo')) {
                    return playFile("VOCÊ E O MESMO NAMEKOSEI DAQUELE DIA NÃO E MESMO QUER TENTAR RESISTIR DENOVO.wav", "Você é o mesmo Namekosei daquele dia, não é mesmo? Quer tentar resistir de novo?", "You are the same Namekian from that day, aren't you? Want to try resisting again?", 5);
                }

                // General Intros
                const r = Math.random();
                if (r < 0.25) {
                    return playFile("OUÇA EU SOU O GRANDE FREEZA.wav", "Ouça... eu sou o grande Freeza!", "Listen... I am the great Frieza!", 5);
                } else if (r < 0.5) {
                    return playFile("ESTOU PRONTO FINALMENTE CONSEGUI MEU PODER MAXIMO.wav", "Estou pronto! Finalmente consegui meu poder máximo!", "I am ready! Finally achieved my maximum power!", 5);
                } else if (r < 0.75) {
                    return playFile("A UNICA COISA QUE PODE ESPERAR E A MORTE.wav", "A única coisa que se pode esperar é a morte!", "The only thing you can expect is death!", 5);
                } else {
                    return playFile("ANTES DE MAIS NADA GOSTARIA DE DIZER QUE NUNCA HAVIA ME EMOCIONADO ANTES .wav", "Antes de mais nada, gostaria de dizer que nunca havia me emocionado antes...", "First of all, I would like to say that I had never been emotional before...", 5);
                }
            }

            if (event === BattleEvent.VICTORY) {
                if (listener.includes('goku')) {
                    return playFile("VOU ACABAR COM ESSA BRINCADEIRA ABSURDA POR QUE EU ME CANSEI DE VOCÊ.wav", "Vou acabar com essa brincadeira absurda porque me cansei de você!", "I will put an end to this absurd joke because I got tired of you!", 5);
                }
                if (listener.includes('gohan') || listener.includes('trunks')) {
                    return playFile("NÃO SE PREOCUPE EU CUIDAREI BEM DO SEU FILHO.wav", "Não se preocupe, eu cuidarei bem do seu filho...", "Don't you worry, I will take good care of your son...", 5);
                }

                const r = Math.random();
                if (r < 0.33) {
                    return playFile("A DOR QUE IRAM SENTIR E PIOR DO QUE ESTAR NO INFERNO.wav", "A dor que irão sentir é pior do que estar no inferno!", "The pain you will feel is worse than being in hell!", 5);
                } else if (r < 0.66) {
                    return playFile("COMO SE ATREVE A DESAFIAR O MEU PODER.wav", "Como se atreve a desafiar o meu poder?!", "How dare you challenge my power?!", 5);
                } else {
                    return playFile("VOU FAZE-LO EM PEDAÇOS HAHAHAHA.wav", "Vou fazê-lo em pedaços! Hahaha!", "I will tear you to pieces! Hahaha!", 5);
                }
            }

            if (event === BattleEvent.DEFEAT) {
                const r = Math.random();
                if (r < 0.33) {
                    return playFile("NÃO POSSO ACREDITAR QUE ESSE PESADELO PODERIA SE TORNAR REALIDADE.wav", "Não posso acreditar que esse pesadelo pudesse se tornar realidade!", "I cannot believe that this nightmare could become reality!", 5);
                } else if (r < 0.66) {
                    return playFile("NÃO PRETENDO HAAA PERDEEEE.wav", "Não pretendo perder! Haaaa!", "I do not intend to lose! Haaaa!", 5);
                } else {
                    return playFile("UM IMPOSTO NUNCA PODERA ME VENCER.wav", "Um impostor nunca poderá me vencer!", "An impostor could never defeat me!", 5);
                }
            }

            if (event === BattleEvent.LOW_HP_OPPONENT) {
                const r = Math.random();
                if (r < 0.2) {
                    return playFile("DIGAME VERMEZINHO ONDE ESTA TODA SUA ENERGIA.wav", "Diga-me, vermezinho, onde está toda a sua energia?!", "Tell me, little worm, where is all your energy?!", 5);
                } else if (r < 0.4) {
                    return playFile("MESMO ESTANDO CANSADO DESSE JEITO AINDA ACHA QUE IRA CONSEGUIR LUTAR CONTRA O GRANDE FREEZA.wav", "Mesmo estando cansado desse jeito, ainda acha que irá conseguir lutar contra o grande Freeza?!", "Even though you're tired like this, do you still think you'll manage to fight against the great Frieza?!", 5);
                } else if (r < 0.6) {
                    return playFile("POBREZINHO PODERIA TE MATAR SEM PRECISAR USAR AS MÃOS.wav", "Pobrezinho... poderia te matar sem precisar usar as mãos.", "Poor thing... I could kill you without even using my hands.", 5);
                } else if (r < 0.8) {
                    return playFile("VOCÊ NÃO IRA VIVER PARA CONTAR.wav", "Você não irá viver para contar!", "You won't live to tell the tale!", 5);
                } else {
                    return playFile("NÃO ADIANTA EM BREVE ESTARA MORTO.wav", "Não adianta, em breve estará morto!", "It is no use, soon you will be dead!", 5);
                }
            }

            if (event === BattleEvent.LOW_HP_SELF || event === BattleEvent.DESPERATE_MODE_ENTER) {
                const r = Math.random();
                if (r < 0.33) {
                    return playFile("NÃO SEREI VENCIDO POR UMA CRIATURA INFERIOR A MIM.wav", "Não serei vencido por uma criatura inferior a mim!", "I will not be defeated by an inferior creature!", 5);
                } else if (r < 0.66) {
                    return playFile("NÃO VOU DEIXAR UM VERME MISERAVEL COMO VOCÊ ME VENCER.wav", "Não vou deixar um verme miserável como você me vencer!", "I won't let a wretched worm like you defeat me!", 5);
                } else {
                    return playFile("CALE-SEEEEE.wav", "Cale-seeeee!", "Shut up!", 5);
                }
            }

            if (event === BattleEvent.REVERSAL) {
                const r = Math.random();
                if (r < 0.33) {
                    return playFile("AGORA E QUE VAI COMEÇAR O MELHOR.wav", "Agora é que vai começar o melhor!", "Now is when the best begins!", 5);
                } else if (r < 0.66) {
                    return playFile("AGORA VOU MOSTRAS O CEM PORCENTO DO MEU PODER.wav", "Agora vou mostrar os cem por cento do meu poder!", "Now I'll show one hundred percent of my power!", 5);
                } else {
                    return playFile("EU VOU TE DEVOLVER 10 VEZES ISSO NÃO MELHOR 100 VEZES MAIS.wav", "Eu vou te devolver 10 vezes isso, não, melhor, 100 vezes mais!", "I'll return ten times this to you, no, better, a hundred times more!", 5);
                }
            }

            if (event === BattleEvent.CRITICAL_DAMAGE || event === BattleEvent.BEING_DOMINATED) {
                const r = Math.random();
                if (r < 0.25) {
                    return playFile("SEU MISERAVEL.wav", "Seu miserável!", "You wretched scoundrel!", 5);
                } else if (r < 0.5) {
                    return playFile("POR ESSA EU NÃO ESPERAVA.wav", "Por essa eu não esperava!", "I certainly didn't expect that!", 5);
                } else if (r < 0.75) {
                    return playFile("O QUE FOI QUE DISSE.wav", "O que foi que disse?!", "What was that you said?!", 5);
                } else {
                    return playFile("COMO VOCÊ E PERSISTENTE HAAAAA.wav", "Como você é persistent, haaaaa!", "How persistent you are, haaaaa!", 5);
                }
            }

            if (event === BattleEvent.FIRST_STRIKE) {
                const r = Math.random();
                if (r < 0.33) {
                    return playFile("O ME DESCULPE E QUE MEU PODER E MUITO GRANDE E NÃO CONSIGO CONTROLA-LO DIREITO.wav", "Oh, me desculpe, é que meu poder é muito grande e não consigo controlá-lo direito!", "Oh, forgive me, but my power is so immense that I cannot control it properly!", 5);
                } else if (r < 0.66) {
                    return playFile("ESTE SERA O SEU FIM.wav", "Este será o seu fim!", "This will be your end!", 5);
                } else {
                    return playFile("VOU TE MATAR DE QUALQUER JEITO.wav", "Vou te matar de qualquer jeito!", "I am going to kill you either way!", 5);
                }
            }

            if (event === BattleEvent.CLASH) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("UMA LUTA CORPO A CORPO ESTA CERTO LUTAREMOS COMO VOCÊ PREFERIR IDIOTA.wav", "Uma luta corpo a corpo? Está certo, lutaremos como você preferir, idiota!", "Close combat? Very well, we will fight however you prefer, idiot!", 5);
                } else {
                    return playFile("BEM O AQUECIMENTO JA TERMINOU.wav", "Bem, o aquecimento já terminou!", "Well, the warm-up is already over!", 5);
                }
            }

            if (event === BattleEvent.PERFECT_GUARD) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("ACHA QUE VOU DEIXAR ME ENGANAR COM ESSE PLANO TOLO.wav", "Acha que vou deixar me enganar com esse plano tolo?!", "Do you think I'll let myself be fooled by such a foolish plan?!", 5);
                } else {
                    return playFile("NÃO ME DIGA QUE ACHA QUE VAI CONSEGUIR.wav", "Não me diga que acha que vai conseguir!", "Don't tell me you think you will succeed!", 5);
                }
            }

            if (event === BattleEvent.LONG_IDLE) {
                const r = Math.random();
                if (r < 0.5) {
                    return playFile("QUANDO E QUE VAI SE RENDER.wav", "Quando é que vai se render?!", "When are you going to surrender?!", 5);
                } else {
                    return playFile("O TREINO JA TERMINOU VAMOS CONTINUAR COM O RESTO.wav", "O treino já terminou, vamos continuar com o resto!", "The training has already finished, let's continue with the rest!", 5);
                }
            }
        }

        return this.getQuote(speakerId, event);
    }
}
