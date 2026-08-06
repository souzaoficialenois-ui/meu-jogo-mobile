import { InputState } from '../types';

export interface BufferedInput {
  id: string;
  playerNo: 1 | 2;
  action: string;
  direction: 'left' | 'right' | 'up' | 'down' | 'down_left' | 'down_right' | 'neutral';
  timestamp: number;
  expiresFrame: number;
  consumed: boolean;
  extraData?: any;
}

export interface MotionStep {
  direction: string;
  action?: string;
  timestamp: number;
}

/**
 * InputBufferManager
 * Centralized Input Buffer System for Movement and Combat Controls.
 * Stores recent button presses, motion commands, and special attack combinations
 * within a buffer window (18 frames / ~300ms).
 * Ensures fluid execution of combo chains, special attacks, cancels, and movement commands.
 */
export class InputBufferManager {
  private static instance: InputBufferManager;

  private p1Buffer: BufferedInput[] = [];
  private p2Buffer: BufferedInput[] = [];

  private p1MotionHistory: MotionStep[] = [];
  private p2MotionHistory: MotionStep[] = [];

  // Default buffer lifespan in frames (18 frames ~ 300ms at 60fps)
  public readonly BUFFER_WINDOW_FRAMES = 18;
  // Default buffer lifespan in milliseconds
  public readonly BUFFER_WINDOW_MS = 300;

  private constructor() {}

  public static getInstance(): InputBufferManager {
    if (!InputBufferManager.instance) {
      InputBufferManager.instance = new InputBufferManager();
    }
    return InputBufferManager.instance;
  }

  /**
   * Resets all player buffers.
   */
  public reset() {
    this.p1Buffer = [];
    this.p2Buffer = [];
    this.p1MotionHistory = [];
    this.p2MotionHistory = [];
  }

  /**
   * Clears buffer for a specific player (e.g., when hit or stunned).
   */
  public clearPlayerBuffer(playerNo: 1 | 2) {
    if (playerNo === 1) {
      this.p1Buffer = [];
      this.p1MotionHistory = [];
    } else {
      this.p2Buffer = [];
      this.p2MotionHistory = [];
    }
  }

  /**
   * Called every frame to capture newly pressed inputs, process motion sequences,
   * and clean up expired buffer entries.
   */
  public processFrameInputs(
    playerNo: 1 | 2,
    current: InputState,
    previous: InputState | null,
    frameCount: number
  ) {
    if (!current) return;

    const now = Date.now();
    const buffer = playerNo === 1 ? this.p1Buffer : this.p2Buffer;
    const history = playerNo === 1 ? this.p1MotionHistory : this.p2MotionHistory;

    // Determine current direction
    let currentDir: 'left' | 'right' | 'up' | 'down' | 'down_left' | 'down_right' | 'neutral' = 'neutral';
    if (current.down && current.left) currentDir = 'down_left';
    else if (current.down && current.right) currentDir = 'down_right';
    else if (current.down) currentDir = 'down';
    else if (current.left) currentDir = 'left';
    else if (current.right) currentDir = 'right';
    else if (current.up || current.jump) currentDir = 'up';

    // List of action buttons to monitor
    const actionKeys: (keyof InputState)[] = [
      'light',
      'medium',
      'heavy',
      'kiblast',
      'special',
      'special2',
      'special3',
      'special4',
      'special5',
      'special6',
      'special7',
      'special8',
      'special9',
      'special10',
      'ultimate',
      'ultimate2',
      'ultimate3',
      'ultimate4',
      'jump',
      'dash',
      'charge',
      'vanish',
      'dragonRush',
      'transform',
      'fusion',
      'tag',
      'assist1',
      'assist2',
    ];

    // Helper to check if button turned from false to true
    const isEdgeTriggered = (key: keyof InputState): boolean => {
      return !!current[key] && (!previous || !previous[key]);
    };

    // 1. Record Edge-Triggered Actions
    for (const key of actionKeys) {
      if (isEdgeTriggered(key)) {
        const extraData = key === 'transform' || key === 'fusion' ? current.transformTarget : undefined;
        this.addBufferedInput(playerNo, key as string, currentDir, now, frameCount, extraData);

        // Record motion step for combination detection
        history.push({
          direction: currentDir,
          action: key as string,
          timestamp: now,
        });
      }
    }

    // Explicit check for attack key alias
    if (isEdgeTriggered('attack') && !isEdgeTriggered('light')) {
      this.addBufferedInput(playerNo, 'light', currentDir, now, frameCount);
    }

    // 2. Motion / Combination Detection
    // Direction change detection
    const prevDir = previous
      ? (previous.down && previous.left ? 'down_left' : previous.down && previous.right ? 'down_right' : previous.down ? 'down' : previous.left ? 'left' : previous.right ? 'right' : previous.up ? 'up' : 'neutral')
      : 'neutral';

    if (currentDir !== prevDir && currentDir !== 'neutral') {
      history.push({
        direction: currentDir,
        timestamp: now,
      });
    }

    // Prune motion history older than 500ms
    while (history.length > 0 && now - history[0].timestamp > 500) {
      history.shift();
    }

    // Check for Quarter-Circle / Special Command Combinations
    this.detectMotionCombinations(playerNo, now, frameCount);

    // 3. Clean up expired or consumed entries from buffer
    const maxAgeFrames = this.BUFFER_WINDOW_FRAMES;
    const activeBuffer = buffer.filter(
      (item) => !item.consumed && frameCount - item.expiresFrame < maxAgeFrames && now - item.timestamp < this.BUFFER_WINDOW_MS
    );

    if (playerNo === 1) {
      this.p1Buffer = activeBuffer;
    } else {
      this.p2Buffer = activeBuffer;
    }
  }

  /**
   * Adds a new buffered input entry for a player.
   */
  public addBufferedInput(
    playerNo: 1 | 2,
    action: string,
    direction: 'left' | 'right' | 'up' | 'down' | 'down_left' | 'down_right' | 'neutral',
    timestamp: number,
    frameCount: number,
    extraData?: any
  ) {
    const buffer = playerNo === 1 ? this.p1Buffer : this.p2Buffer;

    const entry: BufferedInput = {
      id: `${playerNo}_${action}_${timestamp}_${Math.random().toString(36).substr(2, 4)}`,
      playerNo,
      action,
      direction,
      timestamp,
      expiresFrame: frameCount + this.BUFFER_WINDOW_FRAMES,
      consumed: false,
      extraData,
    };

    buffer.push(entry);
  }

  /**
   * Detects special motion patterns like Quarter-Circle Forward/Backward,
   * Double Tap Dash, and Down+Special combinations.
   */
  private detectMotionCombinations(playerNo: 1 | 2, now: number, frameCount: number) {
    const history = playerNo === 1 ? this.p1MotionHistory : this.p2MotionHistory;
    if (history.length < 2) return;

    const lastStep = history[history.length - 1];
    const prevSteps = history.slice(0, history.length - 1);

    // Special button combo trigger
    if (lastStep.action === 'special' || lastStep.action === 'special2' || lastStep.action === 'ultimate') {
      const hasDownRecent = prevSteps.some(s => s.direction === 'down' || s.direction === 'down_left' || s.direction === 'down_right');
      const hasRightRecent = prevSteps.some(s => s.direction === 'right');
      const hasLeftRecent = prevSteps.some(s => s.direction === 'left');

      if (hasDownRecent && hasRightRecent) {
        this.addBufferedInput(playerNo, 'MOTION_SPECIAL_RIGHT', 'right', now, frameCount);
      } else if (hasDownRecent && hasLeftRecent) {
        this.addBufferedInput(playerNo, 'MOTION_SPECIAL_LEFT', 'left', now, frameCount);
      } else if (hasDownRecent) {
        this.addBufferedInput(playerNo, 'DOWN_SPECIAL', 'down', now, frameCount);
      }
    }

    // Double Tap Direction Detection for Quick Dash
    const recentDirections = history.filter(s => s.direction === 'left' || s.direction === 'right');
    if (recentDirections.length >= 2) {
      const d1 = recentDirections[recentDirections.length - 2];
      const d2 = recentDirections[recentDirections.length - 1];
      if (d1.direction === d2.direction && d2.timestamp - d1.timestamp < 250 && d2.timestamp - d1.timestamp > 30) {
        const dashAction = d2.direction === 'left' ? 'quickDashLeft' : 'quickDashRight';
        this.addBufferedInput(playerNo, dashAction, d2.direction as any, now, frameCount);
      }
    }
  }

  /**
   * Checks if a specified action is buffered and unconsumed within the buffer window.
   */
  public hasBufferedAction(playerNo: 1 | 2, action: string, maxAgeMs: number = 300): boolean {
    const buffer = playerNo === 1 ? this.p1Buffer : this.p2Buffer;
    const now = Date.now();
    return buffer.some(
      (item) => !item.consumed && item.action === action && now - item.timestamp <= maxAgeMs
    );
  }

  /**
   * Checks if any of the specified actions are buffered.
   */
  public hasAnyBufferedAction(playerNo: 1 | 2, actions: string[], maxAgeMs: number = 300): boolean {
    return actions.some((act) => this.hasBufferedAction(playerNo, act, maxAgeMs));
  }

  /**
   * Checks if an action is buffered, and if so, consumes it and returns true.
   * If not buffered, returns false.
   */
  public checkAndConsume(playerNo: 1 | 2, action: string, maxAgeMs: number = 300): boolean {
    const item = this.consumeAction(playerNo, action, maxAgeMs);
    return !!item;
  }

  /**
   * Checks a list of actions in order of priority and consumes the first matching buffered action.
   */
  public checkAndConsumeAny(playerNo: 1 | 2, actions: string[], maxAgeMs: number = 300): string | null {
    for (const act of actions) {
      if (this.checkAndConsume(playerNo, act, maxAgeMs)) {
        return act;
      }
    }
    return null;
  }

  /**
   * Consumes a buffered action entry and returns it, marking it consumed.
   */
  public consumeAction(playerNo: 1 | 2, action: string, maxAgeMs: number = 300): BufferedInput | undefined {
    const buffer = playerNo === 1 ? this.p1Buffer : this.p2Buffer;
    const now = Date.now();

    const index = buffer.findIndex(
      (item) => !item.consumed && item.action === action && now - item.timestamp <= maxAgeMs
    );

    if (index !== -1) {
      buffer[index].consumed = true;
      return buffer[index];
    }
    return undefined;
  }

  /**
   * Peek at the latest unconsumed buffered action without consuming it.
   */
  public peekAction(playerNo: 1 | 2, action: string, maxAgeMs: number = 300): BufferedInput | undefined {
    const buffer = playerNo === 1 ? this.p1Buffer : this.p2Buffer;
    const now = Date.now();

    return buffer.find(
      (item) => !item.consumed && item.action === action && now - item.timestamp <= maxAgeMs
    );
  }

  /**
   * Convenience check combining frame edge detection AND buffer check.
   * Ensures instant Frame 0 execution AND buffered execution if pressed early.
   */
  public isActionTriggered(
    playerNo: 1 | 2,
    current: InputState,
    previous: InputState | null,
    action: string,
    maxAgeMs: number = 300
  ): boolean {
    // 1. Direct Edge Trigger on current frame
    const actKey = action as keyof InputState;
    const isDirectPress = !!current[actKey] && (!previous || !previous[actKey]);
    
    if (isDirectPress) {
      // Mark buffered entry consumed if present
      this.consumeAction(playerNo, action, maxAgeMs);
      return true;
    }

    // 2. Buffered Input check
    return this.checkAndConsume(playerNo, action, maxAgeMs);
  }
}
