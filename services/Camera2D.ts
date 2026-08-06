
import { Vector2, Rect } from '../types';
import { 
  WORLD_HEIGHT, 
  CAM_MIN_ZOOM, CAM_MAX_ZOOM, CAM_ZOOM_SPEED, CAM_PADDING_X 
} from '../constants';

export interface CameraBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export type ShakeType = 'LINEAR' | 'PERLIN' | 'IMPULSE';

export class Camera2D {
  public position: Vector2 = { x: 0, y: 0 };
  public zoom: number = 1;
  public rotation: number = 0; // rotation in degrees
  public viewport: Rect;
  private shakeTimer: number = 0;
  private shakeMaxFrames: number = 0;
  private shakeIntensity: number = 0;
  private shakeType: ShakeType = 'LINEAR';
  private shakeFrequency: number = 0.5;
  private perlinTime: number = 0;
  private shakeOffsetX: number = 0;
  private shakeOffsetY: number = 0;

  public worldWidth: number;
  public worldHeight: number;
  
  public limitLeft: number;
  public limitRight: number;
  public limitTop: number;
  public limitBottom: number;
  public cameraCenterOffsetY: number = 0;
  public shakeLocked: boolean = false;
  public limitsEnabled: boolean = true;

  constructor(
      viewportWidth: number, 
      viewportHeight: number, 
      worldWidth: number = 2000, 
      worldHeight: number = WORLD_HEIGHT,
      limitLeft?: number,
      limitRight?: number,
      limitTop?: number,
      limitBottom?: number
  ) {
    this.viewport = { x: 0, y: 0, width: viewportWidth, height: viewportHeight };
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.limitLeft = limitLeft ?? 0;
    this.limitRight = limitRight ?? worldWidth;
    this.limitTop = limitTop ?? 0;
    this.limitBottom = limitBottom ?? worldHeight;
  }

  public setLimits(limitLeft?: number, limitRight?: number, limitTop?: number, limitBottom?: number) {
      this.limitLeft = limitLeft ?? 0;
      this.limitRight = limitRight ?? this.worldWidth;
      this.limitTop = limitTop ?? 0;
      this.limitBottom = limitBottom ?? this.worldHeight;
  }

  public clearShake() {
      this.shakeTimer = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
  }

  public addScreenShake(frames: number, intensity: number, type: ShakeType = 'IMPULSE', frequency: number = 0.5) {
      if (this.shakeLocked) {
          this.clearShake();
          return;
      }
      this.shakeTimer = frames;
      this.shakeMaxFrames = Math.max(1, frames);
      this.shakeIntensity = intensity;
      this.shakeType = type;
      this.shakeFrequency = frequency;
      this.perlinTime = 0;
  }

  /**
   * Returns the world coordinates of the current camera edges.
   * Acts as the "BoxCollider2D" edges attached to the camera.
   */
  public getVisibleBounds(): CameraBounds {
      // Calculate the visible width/height in world units
      const visibleWidth = this.viewport.width / this.zoom;
      const visibleHeight = this.viewport.height / this.zoom;

      return {
          left: this.position.x - (visibleWidth / 2),
          right: this.position.x + (visibleWidth / 2),
          top: this.position.y - (visibleHeight / 2),
          bottom: this.position.y + (visibleHeight / 2)
      };
  }

  update(p1: Rect, p2: Rect, disableZoom: boolean = false, disablePos: boolean = false, instantSnap: boolean = false, fastZoom: boolean = false) {
    // 1. Calculate Midpoint (Focus Target)
    const midX = (p1.x + p1.width / 2 + p2.x + p2.width / 2) / 2;
    const currentDistX = Math.abs((p1.x + p1.width/2) - (p2.x + p2.width/2));
    
    // Dynamic offset: decreases the upward offset (camera goes down max -50) when characters are close
    const closeFactor = Math.max(0, 1 - (currentDistX / 500));
    const dynamicOffsetY = -100 + (closeFactor * 100) + this.cameraCenterOffsetY;
    
    const midY = ((p1.y + p1.height / 2 + p2.y + p2.height / 2) / 2) + dynamicOffsetY;
    
    let targetZoom = this.zoom;

    // 2. Calculate Required Zoom
    if (!disableZoom) {
        const distX = Math.abs((p1.x + p1.width/2) - (p2.x + p2.width/2));
        
        // We want 'distX + padding' to fit in 'viewport.width / zoom'
        targetZoom = this.viewport.width / (distX + CAM_PADDING_X);
        
        // Clamp Zoom
        targetZoom = Math.max(CAM_MIN_ZOOM, Math.min(CAM_MAX_ZOOM, targetZoom));

        // Smooth Zoom Transition (Lerp)
        if (instantSnap) {
            this.zoom = targetZoom;
        } else {
            const zoomSpeed = fastZoom ? 0.35 : CAM_ZOOM_SPEED;
            this.zoom += (targetZoom - this.zoom) * zoomSpeed;
        }
    }

    // 3. Calculate Target Position (Center of view)
    if (!disablePos) {
        let targetX = midX;
        let targetY = midY;

        // 4. Clamp Camera Position to World Bounds
        const visibleW = this.viewport.width / this.zoom;
        const visibleH = this.viewport.height / this.zoom;

        // Left Limit
        if (targetX - visibleW / 2 < this.limitLeft) {
            targetX = this.limitLeft + visibleW / 2;
        }
        // Right Limit
        if (targetX + visibleW / 2 > this.limitRight) {
            targetX = this.limitRight - visibleW / 2;
        }
        
        // Bottom Limit
        if (targetY + visibleH / 2 > this.limitBottom) {
            targetY = this.limitBottom - visibleH / 2;
        }
        // Top Limit
        if (targetY - visibleH / 2 < this.limitTop) {
            targetY = this.limitTop + visibleH / 2;
        }

        // 5. Smooth Pan (Lerp)
        if (instantSnap) {
            this.position.x = targetX;
            this.position.y = targetY;
        } else {
            // Using a slightly faster lerp for position to keep players in frame
            this.position.x += (targetX - this.position.x) * 0.15;
            this.position.y += (targetY - this.position.y) * 0.15;
        }
    }

    // 6. Apply Screen Shake
    if (this.shakeTimer > 0 && !this.shakeLocked) {
      const progress = this.shakeTimer / this.shakeMaxFrames;
      const currentIntensity = this.shakeIntensity * progress;
      if (this.shakeType === 'PERLIN') {
        this.perlinTime += this.shakeFrequency;
        this.shakeOffsetX = Math.sin(this.perlinTime * 1.5) * currentIntensity;
        this.shakeOffsetY = Math.cos(this.perlinTime * 2.1) * currentIntensity;
      } else {
        // IMPULSE / LINEAR
        this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
        this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
      }
      this.shakeTimer--;
    } else {
      this.shakeTimer = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    this.enforceLimits();
  }

  getRenderPosition(): Vector2 {
      this.enforceLimits();
      return {
          x: this.position.x + (this.shakeLocked ? 0 : this.shakeOffsetX),
          y: this.position.y + (this.shakeLocked ? 0 : this.shakeOffsetY)
      };
  }

  setClampedPosition(targetX: number, targetY: number, speed: number = 1) {
    let clampedX = targetX;
    let clampedY = targetY;

    const visibleW = this.viewport.width / this.zoom;
    const visibleH = this.viewport.height / this.zoom;

    if (clampedX - visibleW / 2 < this.limitLeft) clampedX = this.limitLeft + visibleW / 2;
    if (clampedX + visibleW / 2 > this.limitRight) clampedX = this.limitRight - visibleW / 2;
    
    if (clampedY + visibleH / 2 > this.limitBottom) clampedY = this.limitBottom - visibleH / 2;
    if (clampedY - visibleH / 2 < this.limitTop) clampedY = this.limitTop + visibleH / 2;

    if (speed >= 1) {
      this.position.x = clampedX;
      this.position.y = clampedY;
    } else {
      this.position.x += (clampedX - this.position.x) * speed;
      this.position.y += (clampedY - this.position.y) * speed;
    }

    this.enforceLimits();
  }

  setUnboundedPosition(targetX: number, targetY: number, speed: number = 1) {
    if (speed >= 1) {
      this.position.x = targetX;
      this.position.y = targetY;
    } else {
      this.position.x += (targetX - this.position.x) * speed;
      this.position.y += (targetY - this.position.y) * speed;
    }

    this.enforceLimits();
  }

  setClampedPositionUltimate(targetX: number, targetY: number, speed: number = 1) {
    if (speed >= 1) {
      this.position.x = targetX;
      this.position.y = targetY;
    } else {
      this.position.x += (targetX - this.position.x) * speed;
      this.position.y += (targetY - this.position.y) * speed;
    }

    this.enforceLimits();
  }

  focusOn(p: any, zoomLevel: number = CAM_MAX_ZOOM, _disableLimits: boolean = false, immediate: boolean = false) {
    const targetX = p.x + (p.width || 0) / 2;
    const offset = p.height ? (p.cameraCenterOffsetY || this.cameraCenterOffsetY || 0) : 0;
    const targetY = p.y + (p.height || 0) / 2 + offset;

    if (immediate) {
      this.zoom = zoomLevel;
    } else {
      this.zoom += (zoomLevel - this.zoom) * CAM_ZOOM_SPEED;
    }

    let clampedX = targetX;
    let clampedY = targetY;

    const visibleW = this.viewport.width / this.zoom;
    const visibleH = this.viewport.height / this.zoom;

    if (clampedX - visibleW / 2 < this.limitLeft) clampedX = this.limitLeft + visibleW / 2;
    if (clampedX + visibleW / 2 > this.limitRight) clampedX = this.limitRight - visibleW / 2;
    
    if (clampedY + visibleH / 2 > this.limitBottom) clampedY = this.limitBottom - visibleH / 2;
    if (clampedY - visibleH / 2 < this.limitTop) clampedY = this.limitTop + visibleH / 2;

    if (immediate) {
      this.position.x = clampedX;
      this.position.y = clampedY;
    } else {
      this.position.x += (clampedX - this.position.x) * 0.15;
      this.position.y += (clampedY - this.position.y) * 0.15;
    }

    this.enforceLimits();
  }

  enforceLimits() {
    if (!this.limitsEnabled) return;

    const limitL = this.limitLeft ?? 0;
    const limitR = this.limitRight ?? (this.worldWidth || 2000);
    const limitT = this.limitTop ?? 0;
    const limitB = this.limitBottom ?? (this.worldHeight || WORLD_HEIGHT);

    const worldW = Math.max(0, limitR - limitL);
    const worldH = Math.max(0, limitB - limitT);

    if (worldW <= 0 || worldH <= 0 || !this.viewport.width || !this.viewport.height) return;

    // 1. Minimum zoom so camera viewport is never larger than world bounds
    const minZoomX = this.viewport.width / worldW;
    const minZoomY = this.viewport.height / worldH;
    const minZoomNeeded = Math.max(minZoomX, minZoomY);
    if (this.zoom < minZoomNeeded) {
      this.zoom = minZoomNeeded;
    }

    // 2. Calculate visible dimensions at current zoom
    const visibleW = this.viewport.width / this.zoom;
    const visibleH = this.viewport.height / this.zoom;

    // 3. Horizontal bounds clamping
    if (visibleW >= worldW) {
      this.position.x = limitL + worldW / 2;
    } else {
      const halfW = visibleW / 2;
      this.position.x = Math.max(limitL + halfW, Math.min(limitR - halfW, this.position.x));
    }

    // 4. Vertical bounds clamping
    if (visibleH >= worldH) {
      this.position.y = limitT + worldH / 2;
    } else {
      const halfH = visibleH / 2;
      this.position.y = Math.max(limitT + halfH, Math.min(limitB - halfH, this.position.y));
    }
  }

  resize(width: number, height: number) {
    this.viewport.width = width;
    this.viewport.height = height;
    this.enforceLimits();
  }
}

