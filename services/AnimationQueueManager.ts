import { Player } from './Player';
import { PlayerState } from '../types';

export interface AnimationQueueItem {
  id: string;
  attackType:
    | "LIGHT"
    | "MEDIUM"
    | "HEAVY"
    | "KI_BLAST"
    | "SPECIAL"
    | "SPECIAL_2"
    | "SPECIAL_3"
    | "SPECIAL_4"
    | "SPECIAL_5"
    | "SPECIAL_6"
    | "SPECIAL_7"
    | "SPECIAL_8"
    | "SPECIAL_9"
    | "SPECIAL_10"
    | string;
  isCrouching?: boolean;
  timestamp: number;
  priority?: number;
  data?: any;
}

export class AnimationQueueManager {
  private static instance: AnimationQueueManager;
  private queues: Map<Player, AnimationQueueItem[]> = new Map();
  private maxQueueSize: number = 4;

  private constructor() {}

  public static getInstance(): AnimationQueueManager {
    if (!AnimationQueueManager.instance) {
      AnimationQueueManager.instance = new AnimationQueueManager();
    }
    return AnimationQueueManager.instance;
  }

  /**
   * Enqueues an attack animation request for a player.
   * Ensures requests are queued sequentially without overwriting or skipping.
   */
  public enqueue(
    player: Player,
    attackType: string,
    isCrouching: boolean = false,
    data?: any
  ): boolean {
    if (!player || !attackType) return false;

    let queue = this.queues.get(player);
    if (!queue) {
      queue = [];
      this.queues.set(player, queue);
    }

    // Avoid immediate duplicate spamming (same attack queued in less than 120ms)
    const lastItem = queue[queue.length - 1];
    if (
      lastItem &&
      lastItem.attackType === attackType &&
      Date.now() - lastItem.timestamp < 120
    ) {
      return false;
    }

    // Limit queue size to avoid stale commands buildup
    if (queue.length >= this.maxQueueSize) {
      queue.shift();
    }

    const item: AnimationQueueItem = {
      id: `${player.data?.id || 'p'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      attackType,
      isCrouching,
      timestamp: Date.now(),
      data,
    };

    queue.push(item);

    // Keep player's legacy queuedAttack updated as preview of current head of queue
    player.queuedAttack = queue[0].attackType as any;
    player.queuedAttackTimer = 30;

    return true;
  }

  /**
   * Dequeues the next item from the player's queue.
   */
  public dequeue(player: Player): AnimationQueueItem | undefined {
    const queue = this.queues.get(player);
    if (!queue || queue.length === 0) {
      player.queuedAttack = null;
      player.queuedAttackTimer = 0;
      return undefined;
    }

    const item = queue.shift();
    const nextHead = queue[0];
    player.queuedAttack = nextHead ? (nextHead.attackType as any) : null;
    player.queuedAttackTimer = nextHead ? 30 : 0;
    return item;
  }

  /**
   * Peeks at the next item in the queue.
   */
  public peek(player: Player): AnimationQueueItem | undefined {
    const queue = this.queues.get(player);
    if (!queue || queue.length === 0) return undefined;
    return queue[0];
  }

  /**
   * Checks if the player's queue is empty.
   */
  public isEmpty(player: Player): boolean {
    const queue = this.queues.get(player);
    return !queue || queue.length === 0;
  }

  /**
   * Clears the player's queue (e.g. when hit, stunned, or KO'd).
   */
  public clear(player: Player): void {
    this.queues.delete(player);
    player.queuedAttack = null;
    player.queuedAttackTimer = 0;
  }

  /**
   * Processes the attack animation queue for a player.
   * Safely advances to the next attack when the current attack animation finishes completely.
   */
  public processQueue(player: Player, engine: any): boolean {
    if (!player || this.isEmpty(player) || !engine) return false;

    // Flush queue if player is damaged, stunned, frozen, or KO'd
    if (player.stunTimer > 0 || player.freezeTimer > 0 || player.hp <= 0) {
      this.clear(player);
      return false;
    }

    const isAttackingState =
      player.state === PlayerState.ATTACKING ||
      player.state === PlayerState.CROUCH_ATTACK ||
      player.state === PlayerState.JUMP_ATTACK;

    const isSpecialState =
      player.comboType &&
      typeof player.comboType === 'string' &&
      (player.comboType.startsWith('SPECIAL') ||
        player.comboType.startsWith('ULTIMATE') ||
        player.comboType.startsWith('METEOR') ||
        player.comboType.startsWith('SUPER'));

    // If character is currently performing an attack, verify that its animation frame sequence finished
    if (isAttackingState) {
      if (!player.animFinished) {
        return false; // MUST wait for current animation frames to run to completion!
      }
      if (isSpecialState && player.comboStep > 0) {
        // Multi-phase specials continue via PhysicsManager until animFinished on final phase
        return false;
      }
    }

    // Ready to dequeue and execute next queued attack cleanly
    const item = this.dequeue(player);
    if (!item) return false;

    // Guarantee crisp transition by resetting animation counters to 0
    player.resetPhaseAnimationState();

    // Perform attack
    engine.performAttack(
      player,
      item.attackType as any,
      item.isCrouching || false
    );
    return true;
  }
}
