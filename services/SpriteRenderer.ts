
import { CharacterData, PlayerState } from '../types';
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

  public getGifFrameCount(...args: any[]): number { return 1; }
  public getGifFrame(...args: any[]): any { return null; }
  public loadTexture(...args: any[]): any { return null; }
  public loadTextureAsync(...args: any[]): Promise<any> { return Promise.resolve(null); }
  public loadGif(...args: any[]): Promise<void> { return Promise.resolve(); }
  public getTintedImg(...args: any[]): any { return null; }
  public drawFrame(...args: any[]): void {}
  public drawPlayerAura(...args: any[]): void {}
  public isLoading(...args: any[]): boolean { return false; }

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
