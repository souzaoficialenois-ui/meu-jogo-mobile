import { InputState } from '../types';
import { LocalMultiplayerManager } from './LocalMultiplayerManager';

export type InputAction = keyof InputState;

/**
 * TouchInputManager
 * Acts as the centralized Input State Buffer (similar to a C# Input Manager).
 * It does NOT handle DOM events directly anymore. 
 * The UI components (VirtualControls) are responsible for calling setInput().
 * Supports 2-player local multiplayer inputs (Keyboard & 2 Gamepads).
 */
export class TouchInputManager {
  // Gamepad status tracking
  public isGamepadConnected: boolean = false;
  public activeGamepadName: string = '';
  private lastPauseTriggerTime: number = 0;

  public gamepadBindings: Record<string, number> = {
    left: 14,
    right: 15,
    jump: 0,
    block: 13,
    dash: 4,
    light: 2,
    medium: 3,
    heavy: 1,
    special: 5,
    charge: 6,
    ultimate: 7,
    tag: 8,
    assist1: 10,
    assist2: 11,
    vanish: 9,
    transform: 16,
    dragonRush: 12
  };

  public loadSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem("dd2d_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.gamepadBindings) {
            this.gamepadBindings = { ...this.gamepadBindings, ...parsed.gamepadBindings };
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // New properties for Player 1 and Player 2 data:
  public p1KeyboardTouchState: InputState = this.createDefaultState();
  public p2KeyboardTouchState: InputState = this.createDefaultState();

  public p1Current: InputState = this.createDefaultState();
  public p2Current: InputState = this.createDefaultState();

  public p1Previous: InputState = this.createDefaultState();
  public p2Previous: InputState = this.createDefaultState();

  constructor() {
    this.reset();
  }

  private createDefaultState(): InputState {
    return {
      left: false, right: false, up: false, down: false, 
      jump: false, 
      light: false, medium: false, heavy: false, kiblast: false, special: false, 
      block: false, dash: false, charge: false, 
      attack: false,
      ultimate: false,
      ultimate2: false,
      special2: false,
      special3: false,
      special4: false,
      special5: false,
      special6: false,
      tag: false,
      assist1: false,
      assist2: false,
      vanish: false,
      transform: false,
      transformTarget: undefined,
      fusion: false,
      dragonRush: false,
      isJoystickActive: false
    };
  }

  // Backward compatibility getters for Player 1
  public get keyboardTouchState(): InputState {
    return this.p1KeyboardTouchState;
  }
  public get current(): InputState {
    return this.p1Current;
  }
  public get previous(): InputState {
    return this.p1Previous;
  }

  // FORCE RESET: Call this when pausing, changing scenes, or blurring window
  public reset() {
    this.resetPlayer(1);
    this.resetPlayer(2);
  }

  public resetPlayer(playerNo: 1 | 2) {
    const ktState = playerNo === 1 ? this.p1KeyboardTouchState : this.p2KeyboardTouchState;
    const curState = playerNo === 1 ? this.p1Current : this.p2Current;

    Object.keys(curState).forEach(key => {
      if (key === 'transformTarget') {
        delete (curState as any)[key];
        delete (ktState as any)[key];
      } else {
        (curState as any)[key] = false;
        (ktState as any)[key] = false;
      }
    });
    this.syncPreviousForPlayer(playerNo);
  }

  // --- ATOMIC INPUT SETTERS ---

  public setInput(action: InputAction, isPressed: boolean, extraData?: any) {
    this.setInputForPlayer(1, action, isPressed, extraData);
  }

  public setInputForPlayer(playerNo: 1 | 2, action: InputAction, isPressed: boolean, extraData?: any) {
    const ktState = playerNo === 1 ? this.p1KeyboardTouchState : this.p2KeyboardTouchState;
    const curState = playerNo === 1 ? this.p1Current : this.p2Current;

    (ktState as any)[action] = isPressed;
    (curState as any)[action] = isPressed;
    
    if (action === 'transform' || action === 'fusion') {
       (ktState as any).transformTarget = extraData;
       (curState as any).transformTarget = extraData;
    }
    
    if (action === 'up') {
      ktState.jump = isPressed;
      curState.jump = isPressed;
    }
    if (action === 'light') {
      ktState.attack = isPressed;
      curState.attack = isPressed;
    }
  }

  // --- GAME LOOP LIFECYCLE ---

  public update() {
    // 1. Sync Keyboard/Touch states
    this.updatePlayerState(1);
    this.updatePlayerState(2);

    // 2. Poll physical gamepads
    this.pollAllGamepads();

    // 3. SOCD Cleaning
    this.cleanSOCD(1);
    this.cleanSOCD(2);
  }

  private updatePlayerState(playerNo: 1 | 2) {
    const ktState = playerNo === 1 ? this.p1KeyboardTouchState : this.p2KeyboardTouchState;
    const curState = playerNo === 1 ? this.p1Current : this.p2Current;

    Object.keys(curState).forEach(key => {
      if (key !== 'transformTarget') {
        (curState as any)[key] = !!(ktState as any)[key];
      }
    });
    if (ktState.transformTarget !== undefined) {
      curState.transformTarget = ktState.transformTarget;
    }
  }

  private cleanSOCD(playerNo: 1 | 2) {
    const curState = playerNo === 1 ? this.p1Current : this.p2Current;
    if (curState.left && curState.right) {
        curState.left = false;
        curState.right = false;
    }
    if (curState.up && curState.down) {
        curState.up = false;
        curState.down = false;
    }
  }

  // --- GAMEPAD CONTROLLER LISTENER ---
  private pollAllGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      this.isGamepadConnected = false;
      this.activeGamepadName = '';
      return;
    }
    const gamepads = navigator.getGamepads();
    if (!gamepads) {
      this.isGamepadConnected = false;
      this.activeGamepadName = '';
      return;
    }

    // Find all connected gamepads
    const connectedGps: Gamepad[] = [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        connectedGps.push(gp);
      }
    }

    if (connectedGps.length === 0) {
      this.isGamepadConnected = false;
      this.activeGamepadName = '';
      return;
    }

    this.isGamepadConnected = true;
    this.activeGamepadName = connectedGps.map(g => g.id).join(' | ');

    // Match gamepads dynamically if local multiplayer side selection is active
    const mapping = LocalMultiplayerManager.getInstance().getDeviceMapping();
    if (mapping) {
      if (mapping.p1Device && mapping.p1Device.startsWith("gamepad_")) {
        const index = parseInt(mapping.p1Device.split("_")[1]);
        const gp = gamepads[index];
        if (gp && gp.connected) {
          this.applyGamepadStateToPlayer(gp, 1);
        }
      }
      if (mapping.p2Device && mapping.p2Device.startsWith("gamepad_")) {
        const index = parseInt(mapping.p2Device.split("_")[1]);
        const gp = gamepads[index];
        if (gp && gp.connected) {
          this.applyGamepadStateToPlayer(gp, 2);
        }
      }
    } else {
      // Fallback: default mapping (gamepad 0 -> P1, gamepad 1 -> P2)
      if (connectedGps[0]) {
        this.applyGamepadStateToPlayer(connectedGps[0], 1);
      }
      if (connectedGps[1]) {
        this.applyGamepadStateToPlayer(connectedGps[1], 2);
      }
    }
  }

  private applyGamepadStateToPlayer(gp: Gamepad, playerNo: 1 | 2) {
    this.loadSettings();
    const current = playerNo === 1 ? this.p1Current : this.p2Current;

    const btns = gp.buttons;
    const axes = gp.axes;
    const threshold = 0.3;

    const isPressed = (btnIdx: number | undefined): boolean => {
      if (btnIdx === undefined || btnIdx === null || btnIdx < 0) return false;
      return !!(btns[btnIdx] && btns[btnIdx].pressed);
    };

    const isBoundPressed = (action: string, defaultIndex: number): boolean => {
      const idx = this.gamepadBindings[action] !== undefined ? this.gamepadBindings[action] : defaultIndex;
      return isPressed(idx);
    };

    // 1. Directions - Mapping Left Stick & D-pad index
    const stickLeft = axes[0] !== undefined && axes[0] < -threshold;
    const stickRight = axes[0] !== undefined && axes[0] > threshold;
    const stickDown = axes[1] !== undefined && axes[1] > threshold;
    const stickUp = axes[1] !== undefined && axes[1] < -threshold;

    const gpLeft = stickLeft || isBoundPressed("left", 14);
    const gpRight = stickRight || isBoundPressed("right", 15);
    const gpDown = stickDown || isBoundPressed("block", 13) || isPressed(13);
    const gpUp = stickUp || isPressed(12);

    if (gpLeft) current.left = true;
    if (gpRight) current.right = true;
    if (gpDown) current.down = true;

    // 2. Jump
    if (gpUp || isBoundPressed("jump", 0)) {
      current.jump = true;
      current.up = true;
    }

    // 3. Combat Attacks & Specials
    if (isBoundPressed("light", 2)) {
      current.light = true;
      current.attack = true;
    }
    if (isBoundPressed("medium", 3)) {
      current.medium = true;
    }
    if (isBoundPressed("heavy", 1)) {
      current.heavy = true;
    }
    if (isBoundPressed("special", 5)) {
      current.special = true;
    }
    if (isBoundPressed("dash", 4)) {
      current.dash = true;
    }
    if (isBoundPressed("charge", 6)) {
      current.charge = true;
    }
    if (isBoundPressed("ultimate", 7)) {
      current.ultimate = true;
    }
    if (isBoundPressed("tag", 8)) {
      current.tag = true;
    }
    if (isBoundPressed("assist1", 10)) {
      current.assist1 = true;
    }
    if (isBoundPressed("assist2", 11)) {
      current.assist2 = true;
    }
    if (isBoundPressed("vanish", 9) || (isPressed(4) && isPressed(5))) {
      current.vanish = true;
    }
    if (isBoundPressed("dragonRush", 12) || (isPressed(6) && isPressed(7))) {
      current.dragonRush = true;
    }
    if (isBoundPressed("transform", 16) || (isPressed(6) && isPressed(4))) {
      current.transform = true;
    }

    // 4. Start button pausing
    if (isPressed(9)) {
      const now = performance.now();
      if (!this.lastPauseTriggerTime || (now - this.lastPauseTriggerTime > 350)) {
        this.lastPauseTriggerTime = now;
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
      }
    }
  }

  public endFrame() {
    this.syncPreviousForPlayer(1);
    this.syncPreviousForPlayer(2);
  }

  private syncPreviousForPlayer(playerNo: 1 | 2) {
    if (playerNo === 1) {
      this.p1Previous = { ...this.p1Current };
    } else {
      this.p2Previous = { ...this.p2Current };
    }
  }

  // --- QUERIES ---

  public isPressed(action: InputAction, playerNo: 1 | 2 = 1): boolean {
    const cur = playerNo === 1 ? this.p1Current : this.p2Current;
    const prev = playerNo === 1 ? this.p1Previous : this.p2Previous;
    return !!(cur as any)[action] && !(prev as any)[action];
  }

  public isHeld(action: InputAction, playerNo: 1 | 2 = 1): boolean {
    const cur = playerNo === 1 ? this.p1Current : this.p2Current;
    return !!(cur as any)[action];
  }

  public isReleased(action: InputAction, playerNo: 1 | 2 = 1): boolean {
    const cur = playerNo === 1 ? this.p1Current : this.p2Current;
    const prev = playerNo === 1 ? this.p1Previous : this.p2Previous;
    return !(cur as any)[action] && !!(prev as any)[action];
  }
}
