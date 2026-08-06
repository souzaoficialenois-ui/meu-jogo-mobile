import { Howl } from 'howler';

export type SpatialAudioMode = 'DISABLED' | 'NORMAL' | 'ADVANCED';

export interface SpatialSoundTrack {
  soundId: number;
  howl: Howl;
  getPositionX: () => number;
  lastPan?: number;
}

export class SpatialAudioService {
  private static instance: SpatialAudioService;
  private mode: SpatialAudioMode = 'NORMAL';
  private activeTracks: Map<number, SpatialSoundTrack> = new Map();
  private cameraX: number = 1000;
  private halfViewportWidth: number = 640;

  private constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('spatial_audio_mode');
        if (saved === 'DISABLED' || saved === 'NORMAL' || saved === 'ADVANCED') {
          this.mode = saved as SpatialAudioMode;
        }
      }
    } catch {}
  }

  public static getInstance(): SpatialAudioService {
    if (!SpatialAudioService.instance) {
      SpatialAudioService.instance = new SpatialAudioService();
    }
    return SpatialAudioService.instance;
  }

  public setMode(mode: SpatialAudioMode) {
    this.mode = mode;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('spatial_audio_mode', mode);
      }
    } catch {}
    this.update(this.cameraX, this.halfViewportWidth);
  }

  public getMode(): SpatialAudioMode {
    return this.mode;
  }

  public updateCamera(cameraX: number, halfViewportWidth: number = 640) {
    this.cameraX = cameraX;
    this.halfViewportWidth = halfViewportWidth > 0 ? halfViewportWidth : 640;
  }

  /**
   * Calculates stereo pan (-1.0 to +1.0) for a given world position relative to camera center.
   * - Left side of screen -> Negative pan (Left channel dominant)
   * - Right side of screen -> Positive pan (Right channel dominant)
   * - Center of screen -> 0.0 (Equal 100% / 100%)
   */
  public calculatePan(worldX: number, customCamX?: number, customHalfWidth?: number): number {
    if (this.mode === 'DISABLED') {
      return 0;
    }

    const camX = customCamX !== undefined ? customCamX : this.cameraX;
    const halfWidth = (customHalfWidth !== undefined && customHalfWidth > 0) ? customHalfWidth : this.halfViewportWidth;

    // Relative offset from camera center normalized by half viewport width (-1.0 = left screen edge, +1.0 = right screen edge)
    const relOffset = (worldX - camX) / halfWidth;

    if (this.mode === 'NORMAL') {
      // Step balance based on screen division
      if (relOffset < -0.6) return -0.75;      // Extremo esquerdo (Left 100%, Right 20%)
      if (relOffset < -0.15) return -0.35;     // Entre centro e esquerda (Left 80%, Right 40%)
      if (relOffset <= 0.15) return 0.0;       // Exatamente no centro (Left 100%, Right 100%)
      if (relOffset <= 0.6) return 0.35;       // Entre centro e direita (Left 40%, Right 80%)
      return 0.75;                             // Extremo direito (Left 20%, Right 100%)
    }

    // ADVANCED MODE: Smooth continuous panning proportional to exact X position on screen
    return Math.max(-0.85, Math.min(0.85, relOffset * 0.9));
  }

  /**
   * Applies stereo pan to a Howl instance (or specific sound ID).
   */
  public applyPan(howl: Howl, soundId?: number, worldX?: number, customCamX?: number, customHalfWidth?: number): number {
    const pan = worldX !== undefined ? this.calculatePan(worldX, customCamX, customHalfWidth) : 0;
    try {
      if (typeof (howl as any).stereo === 'function') {
        if (soundId !== undefined) {
          (howl as any).stereo(pan, soundId);
        } else {
          (howl as any).stereo(pan);
        }
      }
    } catch (e) {
      // Ignore if stereo panner node is unsupported
    }
    return pan;
  }

  /**
   * Registers a continuous/looping sound to automatically update its panning as the entity moves.
   */
  public registerActiveTrack(soundId: number, howl: Howl, getPositionX: () => number) {
    if (!soundId || soundId <= 0) return;
    this.activeTracks.set(soundId, {
      soundId,
      howl,
      getPositionX
    });
    // Apply initial pan
    this.applyPan(howl, soundId, getPositionX());
  }

  public unregisterActiveTrack(soundId: number) {
    this.activeTracks.delete(soundId);
  }

  /**
   * Called on every game frame to update panning for active sounds as characters move, jump, dash or teleport.
   */
  public update(cameraX?: number, halfViewportWidth?: number) {
    if (cameraX !== undefined) this.cameraX = cameraX;
    if (halfViewportWidth !== undefined && halfViewportWidth > 0) this.halfViewportWidth = halfViewportWidth;

    if (this.activeTracks.size === 0) return;

    this.activeTracks.forEach((track, soundId) => {
      try {
        if (!track.howl.playing(soundId)) {
          this.activeTracks.delete(soundId);
          return;
        }

        const x = track.getPositionX();
        const pan = this.calculatePan(x, this.cameraX, this.halfViewportWidth);

        if (track.lastPan === undefined || Math.abs(track.lastPan - pan) > 0.02) {
          track.lastPan = pan;
          if (typeof (track.howl as any).stereo === 'function') {
            (track.howl as any).stereo(pan, soundId);
          }
        }
      } catch (e) {
        this.activeTracks.delete(soundId);
      }
    });
  }

  public clear() {
    this.activeTracks.clear();
  }
}
