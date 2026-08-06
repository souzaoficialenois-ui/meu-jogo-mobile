import * as TWEEN from '@tweenjs/tween.js';
import { mat2d, vec2 } from 'gl-matrix';

/**
 * GlowOptimizer - High-performance dynamic optimizer for Glow Outline shaders and Canvas shadowBlur rendering.
 * Automatically manages object counts, dynamic blur radius scaling, offscreen sprite glow caching,
 * and adaptive multi-pass shadow throttling under heavy projectile/aura screen loads.
 */
export class GlowOptimizer {
  private static instance: GlowOptimizer;
  private currentFrameGlowObjects: number = 0;
  private maxFrameGlowObjects: number = 0;
  private lastFps: number = 60;
  private dynamicScaleFactor: number = 1.0;
  private glowCanvasCache: Map<string, HTMLCanvasElement> = new Map();
  private cacheSizeLimit: number = 150;
  private tweenGroup: TWEEN.Group = new TWEEN.Group();

  private constructor() {}

  public static getInstance(): GlowOptimizer {
    if (!GlowOptimizer.instance) {
      GlowOptimizer.instance = new GlowOptimizer();
    }
    return GlowOptimizer.instance;
  }

  /**
   * Call at start of each rendering frame to update load metrics and update tween animations
   */
  public beginFrame(fps: number = 60, time?: number): void {
    this.maxFrameGlowObjects = Math.max(this.maxFrameGlowObjects, this.currentFrameGlowObjects);
    this.currentFrameGlowObjects = 0;
    this.lastFps = fps;

    // Update active TWEEN group animations
    this.tweenGroup.update(time);

    // Adapt scale factor based on FPS and active glow objects count
    if (this.lastFps < 45 || this.maxFrameGlowObjects > 10) {
      this.dynamicScaleFactor = Math.max(0.4, Math.min(1.0, this.lastFps / 60));
    } else {
      this.dynamicScaleFactor = 1.0;
    }
  }

  /**
   * Create a smooth tween animation for glow scale and intensity using @tweenjs/tween.js
   */
  public animateGlow(
    state: { intensity: number; scale: number },
    target: { intensity: number; scale: number },
    durationMs: number = 300,
    onUpdate?: (state: { intensity: number; scale: number }) => void
  ): TWEEN.Tween<{ intensity: number; scale: number }> {
    const tween = new TWEEN.Tween(state, this.tweenGroup)
      .to(target, durationMs)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((obj) => {
        if (onUpdate) onUpdate(obj);
      })
      .start();
    return tween;
  }

  /**
   * Calculate 2D matrix transformation for glow sprites using gl-matrix
   */
  public createGlowMatrix(x: number, y: number, scaleX: number, scaleY: number): mat2d {
    const matrix = mat2d.create();
    mat2d.fromTranslation(matrix, vec2.fromValues(x, y));
    mat2d.scale(matrix, matrix, vec2.fromValues(scaleX, scaleY));
    return matrix;
  }

  /**
   * Register an active glow object in the current frame
   */
  public registerGlowObject(): void {
    this.currentFrameGlowObjects++;
  }

  /**
   * Get total glow objects count rendered in current frame
   */
  public getCurrentGlowObjectCount(): number {
    return this.currentFrameGlowObjects;
  }

  /**
   * Calculate performance-optimized blur radius based on object load and target quality
   */
  public getParticleMultiplier(): number {
    if (this.lastFps < 40) return 0.5;
    if (this.lastFps < 52) return 0.75;
    return this.dynamicScaleFactor;
  }

  public getOptimizedBlur(
    requestedBlur: number,
    quality: 'DISABLED' | 'NORMAL' | 'ULTRA' = 'NORMAL'
  ): number {
    if (quality === 'DISABLED') return 0;

    let baseBlur = requestedBlur;

    // If active glow load is high, dynamically scale down blur to keep high FPS
    if (this.currentFrameGlowObjects > 14) {
      baseBlur *= 0.5;
    } else if (this.currentFrameGlowObjects > 7) {
      baseBlur *= 0.75;
    }

    baseBlur *= this.dynamicScaleFactor;

    return Math.max(1, Math.round(baseBlur));
  }

  /**
   * Check if multi-pass secondary glow (ultra outline) is allowed under current load
   */
  public allowExtraPass(quality: 'DISABLED' | 'NORMAL' | 'ULTRA' = 'NORMAL'): boolean {
    if (quality !== 'ULTRA') return false;
    // Suppress secondary shadowBlur passes if heavy load or frame rate drop
    if (this.currentFrameGlowObjects > 6 || this.lastFps < 50) {
      return false;
    }
    return true;
  }

  /**
   * Get or pre-render a cached glowing offscreen canvas sprite for fast reuse
   */
  public getCachedGlowSprite(
    img: HTMLImageElement | HTMLCanvasElement,
    color: string,
    blur: number,
    frameKey: string,
    width: number,
    height: number,
    padding: number = 20
  ): HTMLCanvasElement | null {
    if (!img || width <= 0 || height <= 0) return null;

    const cacheKey = `${frameKey}_${color}_${blur}_${width}x${height}`;
    if (this.glowCanvasCache.has(cacheKey)) {
      return this.glowCanvasCache.get(cacheKey)!;
    }

    // LRU cleanup if cache exceeds maximum allowed elements
    if (this.glowCanvasCache.size >= this.cacheSizeLimit) {
      const keys = Array.from(this.glowCanvasCache.keys());
      for (let i = 0; i < 30; i++) {
        this.glowCanvasCache.delete(keys[i]);
      }
    }

    try {
      if (!img || width <= 0 || height <= 0) return null;
      const imgW = (img as any)?.naturalWidth || (img as any)?.width || 0;
      const imgH = (img as any)?.naturalHeight || (img as any)?.height || 0;
      if (imgW <= 0 || imgH <= 0) return null;

      const offscreen = document.createElement('canvas');
      const paddedW = width + padding * 2;
      const paddedH = height + padding * 2;
      if (paddedW <= 0 || paddedH <= 0) return null;

      offscreen.width = paddedW;
      offscreen.height = paddedH;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;

      offCtx.shadowColor = color;
      offCtx.shadowBlur = blur;
      offCtx.drawImage(img as any, padding, padding, width, height);

      this.glowCanvasCache.set(cacheKey, offscreen);
      return offscreen;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear cached glow canvases
   */
  public clearCache(): void {
    this.glowCanvasCache.clear();
    this.tweenGroup.removeAll();
  }
}

