
import { CharacterData, PlayerState, AnimationFrameData } from '../types';
import { AnimationManager } from './AnimationManager';

export class SpriteRenderer {
  private static instance: SpriteRenderer;

  public static getInstance(): SpriteRenderer {
    if (!SpriteRenderer.instance) {
      SpriteRenderer.instance = new SpriteRenderer();
    }
    return SpriteRenderer.instance;
  }

  public drawCharacter(
    ctx: CanvasRenderingContext2D,
    character: CharacterData,
    state: PlayerState,
    x: number,
    y: number,
    width: number,
    height: number,
    facingRight: boolean = true,
    frame: number = 0,
    stunned: boolean = false
  ) {
    AnimationManager.getInstance().drawPlayer(
      ctx,
      character,
      state,
      x,
      y,
      width,
      height,
      facingRight,
      frame,
      stunned
    );
  }

  public preloadCharacter(character: CharacterData) {
    AnimationManager.getInstance().preloadCharacter(character);
  }

  public getGifFrameCount(url: string): number {
    return AnimationManager.getInstance().getGifFrameCount(url);
  }

  public getGifFrame(url: string, frameIndex: number): any {
    return AnimationManager.getInstance().getGifFrame(url, frameIndex);
  }

  public loadTexture(url: string): any {
    return AnimationManager.getInstance().loadTexture(url);
  }

  public loadTextureAsync(url: string): Promise<any> {
    return AnimationManager.getInstance().loadTextureAsync(url);
  }

  public loadGif(url: string): Promise<void> {
    return AnimationManager.getInstance().loadGif(url);
  }

  public getTintedImg(img: any, color: string, cacheKey: string, width?: number, height?: number): any {
    return AnimationManager.getInstance().getTintedImg(img, color, cacheKey, width, height);
  }

  public getCachedEffectImg(img: any, color: string, cacheKey: string, filters?: any, width?: number, height?: number): any {
    return AnimationManager.getInstance().getCachedEffectImg(img, color, cacheKey, filters, width, height);
  }

  public drawFrame(
    ctx: CanvasRenderingContext2D,
    animConfig: AnimationFrameData,
    frameIndex: number,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number = 1,
    facingRight: boolean = true,
    centerAlignY: boolean = false,
    colorKey?: string
  ): void {
    AnimationManager.getInstance().drawFrame(
      ctx,
      animConfig,
      frameIndex,
      x,
      y,
      width,
      height,
      scale,
      facingRight,
      centerAlignY,
      colorKey
    );
  }

  public drawPlayerAura(
    ctx: CanvasRenderingContext2D,
    character: CharacterData,
    state: PlayerState,
    x: number,
    y: number,
    width: number,
    height: number,
    facingRight: boolean = true,
    sparkingActive: boolean = false,
    scaleH: number = 1.0,
    scaleW: number = 1.0,
    forcedAuraKey?: string
  ): void {
    AnimationManager.getInstance().drawPlayerAura(
      ctx,
      character,
      state,
      x,
      y,
      width,
      height,
      facingRight,
      sparkingActive,
      scaleH,
      scaleW,
      forcedAuraKey
    );
  }

  public drawPlayerAuraParticles(
    ctx: CanvasRenderingContext2D,
    character: CharacterData,
    state: PlayerState,
    x: number,
    y: number,
    width: number,
    height: number,
    facingRight: boolean = true,
    sparkingActive: boolean = false,
    scaleH: number = 1.0,
    scaleW: number = 1.0,
    forcedAuraKey?: string
  ): void {
    AnimationManager.getInstance().drawPlayerAuraParticles(
      ctx,
      character,
      state,
      x,
      y,
      width,
      height,
      facingRight,
      sparkingActive,
      scaleH,
      scaleW,
      forcedAuraKey
    );
  }

  public drawEnergyParticles(
    ctx: CanvasRenderingContext2D,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      glowColor: string;
      count?: number;
      facingRight?: boolean;
      isBeam?: boolean;
      isSpherical?: boolean;
      speedScale?: number;
      opacity?: number;
      rotation?: number;
    }
  ): void {
    AnimationManager.getInstance().drawEnergyParticles(ctx, options);
  }

  public drawBeamDispersionParticles(
    ctx: CanvasRenderingContext2D,
    options: {
      x: number;
      y: number;
      height: number;
      glowColor: string;
      shrinkProgress: number;
      facingRight?: boolean;
      rotation?: number;
      count?: number;
    }
  ): void {
    AnimationManager.getInstance().drawBeamDispersionParticles(ctx, options);
  }

  public isLoading(): boolean {
    return AnimationManager.getInstance().isLoading();
  }

  // Alias for drawCharacter if screens use drawPlayer
  public drawPlayer(
    ctx: CanvasRenderingContext2D,
    character: CharacterData,
    state: PlayerState,
    x: number,
    y: number,
    width: number,
    height: number,
    facingRight: boolean = true,
    frame: number = 0,
    stunned: boolean = false
  ) {
    this.drawCharacter(ctx, character, state, x, y, width, height, facingRight, frame, stunned);
  }
}
