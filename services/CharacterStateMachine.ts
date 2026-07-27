import { Player } from './Player';
import { PlayerState } from '../types';

/**
 * Estados lógicos de alto nível que controlam as ações dos personagens.
 */
export enum CharacterState {
  IDLE = 'IDLE',
  MOVIMENTO = 'MOVIMENTO',
  SALTO = 'SALTO',
  ATAQUE = 'ATAQUE',
  ESPECIAL = 'ESPECIAL',
  ULTIMATE = 'ULTIMATE',
  DEFESA = 'DEFESA',
  DANO = 'DANO',
  ATORDOAMENTO = 'ATORDOAMENTO',
  KO = 'KO'
}

/**
 * Tipos de habilidades/ações que possuem prioridade.
 */
export enum SkillType {
  MOVIMENTO = 'MOVIMENTO',
  DEFESA = 'DEFESA',
  ATAQUE_BASICO = 'ATAQUE_BASICO',
  ESPECIAL = 'ESPECIAL',
  TRANSFORMACAO = 'TRANSFORMACAO',
  VANISH = 'VANISH',
  ULTIMATE = 'ULTIMATE',
  REACTIVE_DODGE = 'REACTIVE_DODGE'
}

/**
 * Tabela de prioridades de cada habilidade.
 * Valores maiores indicam prioridade superior.
 */
export const SKILL_PRIORITIES: Record<SkillType, number> = {
  [SkillType.MOVIMENTO]: 1,
  [SkillType.DEFESA]: 2,
  [SkillType.ATAQUE_BASICO]: 3,
  [SkillType.ESPECIAL]: 4,
  [SkillType.TRANSFORMACAO]: 5,
  [SkillType.VANISH]: 6,
  [SkillType.ULTIMATE]: 7,
  [SkillType.REACTIVE_DODGE]: 8
};

/**
 * Sistema desacoplado de Máquina de Estados (State Machine) e Prioridade de Habilidades.
 * Garante uma execução consistente das ações e evita conflitos de comandos.
 */
export class CharacterStateMachine {
  private static instance: CharacterStateMachine | null = null;

  // Fila de habilidades em espera por jogador (Player ID -> Habilidade enfileirada)
  private queuedSkills: Map<string, SkillType> = new Map();

  private constructor() {}

  /**
   * Obtém a instância única do gerenciador de estados.
   */
  public static getInstance(): CharacterStateMachine {
    if (!CharacterStateMachine.instance) {
      CharacterStateMachine.instance = new CharacterStateMachine();
    }
    return CharacterStateMachine.instance;
  }

  /**
   * Mapeia o estado físico do jogador (PlayerState) para o estado lógico unificado (CharacterState).
   */
  public mapPlayerStateToCharacterState(player: Player): CharacterState {
    if (player.hp <= 0 || player.state === PlayerState.DEFEAT) {
      return CharacterState.KO;
    }

    // Estados de Dano
    const damageStates = [
      PlayerState.HIT,
      PlayerState.HIT_2,
      PlayerState.HIT_3,
      PlayerState.FALLING_HIT,
      PlayerState.FALLING_HIT_GROUND,
      PlayerState.LAUNCHED,
      PlayerState.AIR_RECOVERY,
      PlayerState.GROUND_RECOVERY,
      PlayerState.HIT_AIR,
      PlayerState.HIT_AIR_FALL,
      PlayerState.HIT_BOUNCE,
      PlayerState.HIT_GRAB,
      PlayerState.HIT_GROUND_CRASH,
      PlayerState.HIT_GROUND_LAUNCH
    ];
    if (damageStates.includes(player.state)) {
      return CharacterState.DANO;
    }

    // Estados de Atordoamento
    const stunStates = [
      PlayerState.STUNNED,
      PlayerState.GUARD_BREAK,
      PlayerState.HIT_GROUND_STUNNED,
      PlayerState.HIT_GROUND_RECOVER,
      PlayerState.HIT_GROUND_PUSH_UP,
      PlayerState.GRABBED
    ];
    if (stunStates.includes(player.state)) {
      return CharacterState.ATORDOAMENTO;
    }

    // Estados de Ultimate
    const ultimateStates = [
      PlayerState.ULTIMATE,
      PlayerState.ULTIMATE_2
    ];
    if (ultimateStates.includes(player.state)) {
      return CharacterState.ULTIMATE;
    }

    // Estados de Ataque / Especial / Ki Blast
    const attackStates = [
      PlayerState.ATTACKING,
      PlayerState.JUMP_ATTACK,
      PlayerState.CROUCH_ATTACK
    ];
    if (attackStates.includes(player.state)) {
      const isSpecial = player.comboType?.startsWith('SPECIAL') || player.comboType === 'KI_BLAST';
      return isSpecial ? CharacterState.ESPECIAL : CharacterState.ATAQUE;
    }

    // Estados de Defesa
    const defenseStates = [
      PlayerState.BLOCKING,
      PlayerState.BLOCKING_CROUCH,
      PlayerState.BLOCKING_AIR,
      PlayerState.REFLECT
    ];
    if (defenseStates.includes(player.state)) {
      return CharacterState.DEFESA;
    }

    // Estados de Salto / Queda
    const jumpStates = [
      PlayerState.JUMPING,
      PlayerState.FALLING,
      PlayerState.LANDING
    ];
    if (jumpStates.includes(player.state)) {
      return CharacterState.SALTO;
    }

    // Estados de Movimento
    const movementStates = [
      PlayerState.RUNNING,
      PlayerState.WALK_BACKWARD,
      PlayerState.DASH_START,
      PlayerState.DASHING,
      PlayerState.DASH_END,
      PlayerState.QUICK_DASH,
      PlayerState.SUPER_DASH,
      PlayerState.DRAGON_RUSH,
      PlayerState.DRAGON_COMBO,
      PlayerState.DRAGON_DASH_FOLLOW
    ];
    if (movementStates.includes(player.state)) {
      return CharacterState.MOVIMENTO;
    }

    // Estados Ociosos
    return CharacterState.IDLE;
  }

  /**
   * Obtém o tipo de habilidade atualmente em execução baseando-se no estado físico e propriedades.
   */
  public getCurrentSkillType(player: Player): SkillType | null {
    const logicalState = this.mapPlayerStateToCharacterState(player);

    if (logicalState === CharacterState.ULTIMATE) {
      return SkillType.ULTIMATE;
    }
    if (logicalState === CharacterState.ESPECIAL) {
      return SkillType.ESPECIAL;
    }
    if (logicalState === CharacterState.ATAQUE) {
      return SkillType.ATAQUE_BASICO;
    }
    if (logicalState === CharacterState.DEFESA) {
      return SkillType.DEFESA;
    }
    if (logicalState === CharacterState.MOVIMENTO) {
      return SkillType.MOVIMENTO;
    }

    // Outras mecânicas mapeadas por estados específicos
    if (player.state === PlayerState.VANISH || player.state === PlayerState.VANISH_APPEAR) {
      return SkillType.VANISH;
    }
    if (player.state === PlayerState.TRANSFORM) {
      return SkillType.TRANSFORMACAO;
    }
    if (player.state === PlayerState.MUI_DODGE) {
      return SkillType.REACTIVE_DODGE;
    }

    return null;
  }

  /**
   * Valida se a transição entre dois estados lógicos é permitida pelas regras da State Machine.
   */
  public validateTransition(from: CharacterState, to: CharacterState): boolean {
    // Transições reativas de dano e KO são sempre permitidas pelo motor de física e regras de jogo
    if (to === CharacterState.KO || to === CharacterState.DANO) {
      return true;
    }

    // Um personagem derrotado/KO não pode sair deste estado
    if (from === CharacterState.KO) {
      return false;
    }

    // Enquanto estiver em Dano, ações voluntárias são bloqueadas (deve recuperar antes para IDLE ou SALTO)
    if (from === CharacterState.DANO) {
      return (
        to === CharacterState.IDLE ||
        to === CharacterState.SALTO ||
        to === CharacterState.ATORDOAMENTO
      );
    }

    // Enquanto estiver em Atordoamento (Stun), ações normais estão bloqueadas
    if (from === CharacterState.ATORDOAMENTO) {
      return (
        to === CharacterState.IDLE ||
        to === CharacterState.SALTO
      );
    }

    // No estado de Ultimate, o personagem é imparável e não pode cancelar voluntariamente para estados de menor prioridade
    if (from === CharacterState.ULTIMATE) {
      return (
        to === CharacterState.IDLE ||
        to === CharacterState.SALTO
      );
    }

    // No estado Especial, não é possível cancelar direto para movimento básico ou defesa
    if (from === CharacterState.ESPECIAL) {
      return (
        to === CharacterState.ULTIMATE ||
        to === CharacterState.IDLE ||
        to === CharacterState.SALTO
      );
    }

    // No estado de Ataque Básico, pode cancelar para Especial ou Ultimate (cancels do jogo)
    if (from === CharacterState.ATAQUE) {
      return (
        to === CharacterState.ESPECIAL ||
        to === CharacterState.ULTIMATE ||
        to === CharacterState.IDLE ||
        to === CharacterState.SALTO
      );
    }

    return true;
  }

  /**
   * Mapeia o tipo de habilidade (SkillType) de volta para o estado lógico (CharacterState).
   */
  public mapSkillTypeToCharacterState(skill: SkillType): CharacterState {
    switch (skill) {
      case SkillType.MOVIMENTO:
        return CharacterState.MOVIMENTO;
      case SkillType.DEFESA:
        return CharacterState.DEFESA;
      case SkillType.ATAQUE_BASICO:
        return CharacterState.ATAQUE;
      case SkillType.ESPECIAL:
        return CharacterState.ESPECIAL;
      case SkillType.ULTIMATE:
        return CharacterState.ULTIMATE;
      case SkillType.TRANSFORMACAO:
      case SkillType.VANISH:
      case SkillType.REACTIVE_DODGE:
        return CharacterState.MOVIMENTO;
      default:
        return CharacterState.IDLE;
    }
  }

  /**
   * Valida se uma nova habilidade pode ser executada baseando-se no sistema de prioridades.
   * Se a prioridade for igual ou inferior, ou se a transição for proibida, ela será enfileirada.
   */
  public canExecuteSkill(player: Player, requestedSkill: SkillType): boolean {
    const currentLogicalState = this.mapPlayerStateToCharacterState(player);

    // Se estiver derrotado, não pode executar nenhuma habilidade
    if (currentLogicalState === CharacterState.KO || player.hp <= 0) {
      return false;
    }

    // Dano e Atordoamento bloqueiam a execução imediata de novas habilidades voluntárias, mas podemos enfileirar!
    if (currentLogicalState === CharacterState.DANO || currentLogicalState === CharacterState.ATORDOAMENTO) {
      const playerId = player.data.id;
      this.queuedSkills.set(playerId, requestedSkill);
      return false;
    }

    const currentSkill = this.getCurrentSkillType(player);
    if (!currentSkill) {
      // Sem habilidade ativa, qualquer ação voluntária é permitida
      return true;
    }

    // Chaining basic attacks during recovery, combo window or after a hit is allowed
    if (requestedSkill === SkillType.ATAQUE_BASICO && currentSkill === SkillType.ATAQUE_BASICO) {
      if (player.animFinished || player.comboWindow > 0 || player.hasHit) {
        return true;
      }
    }

    // Comparação de prioridades
    const currentPriority = SKILL_PRIORITIES[currentSkill] || 0;
    const requestedPriority = SKILL_PRIORITIES[requestedSkill] || 0;

    if (requestedPriority > currentPriority) {
      // Habilidade de prioridade superior poderá interromper a atual,
      // desde que a interrupção seja permitida pelas regras do estado atual.
      const targetState = this.mapSkillTypeToCharacterState(requestedSkill);
      if (this.validateTransition(currentLogicalState, targetState)) {
        return true;
      } else {
        // Interrupção proibida pelas regras do estado atual, enfileira
        const playerId = player.data.id;
        this.queuedSkills.set(playerId, requestedSkill);
        return false;
      }
    } else {
      // Prioridade igual ou inferior: enfileira para execução futura e retorna falso
      const playerId = player.data.id;
      this.queuedSkills.set(playerId, requestedSkill);
      return false;
    }
  }

  /**
   * Obtém a habilidade atualmente enfileirada em espera para o jogador.
   */
  public getQueuedSkill(player: Player): SkillType | null {
    const playerId = player.data.id;
    return this.queuedSkills.get(playerId) || null;
  }

  /**
   * Consome e limpa a habilidade da fila de espera do jogador.
   */
  public consumeQueuedSkill(player: Player): SkillType | null {
    const playerId = player.data.id;
    const skill = this.queuedSkills.get(playerId) || null;
    if (skill) {
      this.queuedSkills.delete(playerId);
    }
    return skill;
  }

  /**
   * Verifica e executa transições seguras diretamente no objeto do Player com base no validador.
   */
  public requestTransition(player: Player, nextPlayerState: PlayerState): boolean {
    const fromLogical = this.mapPlayerStateToCharacterState(player);
    
    // Cria um player temporário ou mock para descobrir para qual estado lógico ele iria
    const tempPlayer = Object.create(Object.getPrototypeOf(player));
    Object.assign(tempPlayer, player, { state: nextPlayerState });
    const toLogical = this.mapPlayerStateToCharacterState(tempPlayer);

    const isAllowed = this.validateTransition(fromLogical, toLogical);
    if (isAllowed) {
      player.state = nextPlayerState;
      return true;
    }
    return false;
  }
}
