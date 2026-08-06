import { AudioManager } from './AudioManager';

export interface DeviceInfo {
  id: string; // "keyboard" or "gamepad_0", "gamepad_1", "gamepad_2", etc.
  name: string; // e.g., "Teclado" or "Controle 1"
  type: 'keyboard' | 'gamepad';
  gamepadIndex?: number;
}

export type SideSelection = 'left' | 'right' | 'neutral';

export interface DeviceState {
  device: DeviceInfo;
  side: SideSelection;
  confirmed: boolean;
}

export interface LocalMultiplayerConfig {
  p1Device: string | null; // device ID assigned to Player 1 (Left Side)
  p2Device: string | null; // device ID assigned to Player 2 (Right Side)
}

export class LocalMultiplayerManager {
  private static instance: LocalMultiplayerManager | null = null;

  public keyboardAvailable: boolean = typeof window !== 'undefined' && !('ontouchstart' in window);
  public gamepads: DeviceInfo[] = [];
  
  // Side selection state
  public deviceStates: Record<string, DeviceState> = {};
  
  private listeners: Set<() => void> = new Set();
  private pollIntervalId: any = null;

  private constructor() {
    this.setupListeners();
    this.startPolling();
  }

  public static getInstance(): LocalMultiplayerManager {
    if (!LocalMultiplayerManager.instance) {
      LocalMultiplayerManager.instance = new LocalMultiplayerManager();
    }
    return LocalMultiplayerManager.instance;
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // Any keydown event confirms the physical keyboard presence
    const handleKeyDown = () => {
      if (!this.keyboardAvailable) {
        this.keyboardAvailable = true;
        this.updateDeviceList();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    window.addEventListener('gamepadconnected', () => {
      this.updateDeviceList();
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.updateDeviceList();
    });
  }

  private startPolling() {
    if (typeof window === 'undefined') return;
    // Periodically update the device list to be super reliable and reactive
    this.pollIntervalId = setInterval(() => {
      this.updateDeviceList();
    }, 1000);
  }

  public cleanup() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
  }

  public updateDeviceList() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

    const gps = navigator.getGamepads();
    const activeGamepads: DeviceInfo[] = [];

    for (let i = 0; i < gps.length; i++) {
      const gp = gps[i];
      if (gp && gp.connected) {
        activeGamepads.push({
          id: `gamepad_${i}`,
          name: gp.id || `Controle ${i + 1}`,
          type: 'gamepad',
          gamepadIndex: i
        });
      }
    }

    this.gamepads = activeGamepads;

    // Synchronize deviceStates with active devices
    const currentDeviceIds = new Set<string>();
    
    if (this.keyboardAvailable) {
      currentDeviceIds.add('keyboard');
      if (!this.deviceStates['keyboard']) {
        this.deviceStates['keyboard'] = {
          device: { id: 'keyboard', name: 'Teclado Físico', type: 'keyboard' },
          side: 'neutral',
          confirmed: false
        };
      }
    }

    activeGamepads.forEach((gp) => {
      currentDeviceIds.add(gp.id);
      if (!this.deviceStates[gp.id]) {
        this.deviceStates[gp.id] = {
          device: gp,
          side: 'neutral',
          confirmed: false
        };
      }
    });

    // Remove disconnections
    let disconnectedAny = false;
    Object.keys(this.deviceStates).forEach((id) => {
      if (!currentDeviceIds.has(id)) {
        const removedState = this.deviceStates[id];
        // If a previously mapped or confirmed device disconnects, cancel confirmations
        if (removedState && (removedState.side !== 'neutral' || removedState.confirmed)) {
          disconnectedAny = true;
        }
        delete this.deviceStates[id];
      }
    });

    if (disconnectedAny) {
      // Cancel confirmation of all players and put everything to neutral
      Object.keys(this.deviceStates).forEach((id) => {
        this.deviceStates[id].confirmed = false;
        this.deviceStates[id].side = 'neutral';
      });
      AudioManager.getInstance().playSFX('cancel');
    }

    this.notify();
  }

  public isLocalMultiplayerAllowed(): boolean {
    const gpCount = this.gamepads.length;
    const hasKb = this.keyboardAvailable;
    return hasKb || gpCount >= 2;
  }

  public setSide(deviceId: string, side: SideSelection) {
    const state = this.deviceStates[deviceId];
    if (!state || state.confirmed) return;

    // If attempting to enter left or right, verify it is not already confirmed/taken by another device
    if (side !== 'neutral') {
      const taken = Object.values(this.deviceStates).some(
        (s) => s.device.id !== deviceId && s.side === side
      );
      if (taken) {
        // Find if they can swap or do nothing
        return;
      }
    }

    state.side = side;
    this.notify();
  }

  public toggleConfirm(deviceId: string) {
    const state = this.deviceStates[deviceId];
    if (!state || state.side === 'neutral') return;

    state.confirmed = !state.confirmed;
    this.notify();
  }

  public resetSides() {
    Object.keys(this.deviceStates).forEach((id) => {
      this.deviceStates[id].side = 'neutral';
      this.deviceStates[id].confirmed = false;
    });
    this.notify();
  }

  public getDeviceMapping(): LocalMultiplayerConfig | null {
    // Find left-side (Player 1) device and right-side (Player 2) device
    let p1Device: string | null = null;
    let p2Device: string | null = null;

    Object.values(this.deviceStates).forEach((s) => {
      if (s.side === 'left' && s.confirmed) {
        p1Device = s.device.id;
      }
      if (s.side === 'right' && s.confirmed) {
        p2Device = s.device.id;
      }
    });

    if (p1Device && p2Device) {
      return { p1Device, p2Device };
    }

    // If keyboard is present and confirmed on either side or confirmed for shared keyboard play
    if (this.keyboardAvailable) {
      const kbState = this.deviceStates['keyboard'];
      if (kbState && kbState.confirmed) {
        return {
          p1Device: p1Device || 'keyboard',
          p2Device: p2Device || 'keyboard'
        };
      }
    }

    return null;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    // Initial call
    listener();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}
