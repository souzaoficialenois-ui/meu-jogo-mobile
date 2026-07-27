
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

  public addScreenShake(frames: number, intensity: number, type: ShakeType = 'IMPULSE', frequency: number = 0.5) {
      if (this.shakeLocked) return;
      if (frames > this.shakeTimer) {
          this.shakeTimer = frames;
          this.shakeMaxFrames = frames;
          this.shakeIntensity = intensity;
          this.shakeType = type;
          this.shakeFrequency = frequency;
          this.perlinTime = Math.random() * 1000;
      }
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
          left: (this.position.x + this.shakeOffsetX) - (visibleWidth / 2),
          right: (this.position.x + this.shakeOffsetX) + (visibleWidth / 2),
          top: (this.position.y + this.shakeOffsetY) - (visibleHeight / 2),
          bottom: (this.position.y + this.shakeOffsetY) + (visibleHeight / 2)
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
            this.rotation = 0;
        } else {
            const zoomSpeed = fastZoom ? 0.35 : CAM_ZOOM_SPEED;
            this.zoom += (targetZoom - this.zoom) * zoomSpeed;
            this.rotation += (0 - this.rotation) * CAM_ZOOM_SPEED;
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
    if (this.shakeTimer > 0) {
        if (!this.shakeLocked) {
            let currentIntensity = this.shakeIntensity;
            
            switch (this.shakeType) {
                case 'IMPULSE': {
                    const progress = this.shakeTimer / this.shakeMaxFrames;
                    currentIntensity = this.shakeIntensity * (progress * progress);
                    this.shakeOffsetX = (Math.random() - 0.5) * currentIntensity;
                    this.shakeOffsetY = (Math.random() - 0.5) * currentIntensity;
                    break;
                }
                case 'PERLIN': {
                    this.perlinTime += this.shakeFrequency;
                    const progress = this.shakeTimer / this.shakeMaxFrames;
                    currentIntensity = this.shakeIntensity * progress;
                    this.shakeOffsetX = Math.sin(this.perlinTime) * Math.cos(this.perlinTime * 0.8) * currentIntensity;
                    this.shakeOffsetY = Math.cos(this.perlinTime * 1.1) * Math.sin(this.perlinTime * 0.9) * currentIntensity;
                    break;
                }
                case 'LINEAR':
                default: {
                    this.shakeOffsetX = (Math.random() - 0.5) * currentIntensity;
                    this.shakeOffsetY = (Math.random() - 0.5) * currentIntensity;
                    break;
                }
            }
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
        
        this.shakeTimer--;
    } else {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    this.enforceLimits();
  }

  getRenderPosition(): Vector2 {
      return {
          x: this.position.x + this.shakeOffsetX,
          y: this.position.y + this.shakeOffsetY
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

  focusOn(p: any, zoomLevel: number = CAM_MAX_ZOOM, disableLimits: boolean = false, immediate: boolean = false) {
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

    if (!disableLimits) {
      const visibleW = this.viewport.width / this.zoom;
      const visibleH = this.viewport.height / this.zoom;

      if (clampedX - visibleW / 2 < this.limitLeft) clampedX = this.limitLeft + visibleW / 2;
      if (clampedX + visibleW / 2 > this.limitRight) clampedX = this.limitRight - visibleW / 2;
      
      if (clampedY + visibleH / 2 > this.limitBottom) clampedY = this.limitBottom - visibleH / 2;
      if (clampedY - visibleH / 2 < this.limitTop) clampedY = this.limitTop + visibleH / 2;
    }

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
    const worldW = Math.max(0, this.limitRight - this.limitLeft);
    const worldH = Math.max(0, this.limitBottom - this.limitTop);

    // 1. Recalculate minimum zoom to prevent showing area outside limits
    if (worldW > 0 && this.viewport.width > 0) {
      const minZoomX = this.viewport.width / worldW;
      if (this.zoom < minZoomX) {
        this.zoom = minZoomX;
      }
    }
    if (worldH > 0 && this.viewport.height > 0) {
      const minZoomY = this.viewport.height / worldH;
      if (this.zoom < minZoomY) {
        this.zoom = minZoomY;
      }
    }

    // 2. Calculate current visible dimensions at current zoom
    const visibleW = this.viewport.width / this.zoom;
    const visibleH = this.viewport.height / this.zoom;

    // 3. Enforce horizontal limits
    if (visibleW >= worldW) {
        // If viewport is larger than world, center the camera
        this.position.x = this.limitLeft + worldW / 2;
    } else {
        if (this.position.x - visibleW / 2 < this.limitLeft) {
            this.position.x = this.limitLeft + visibleW / 2;
        }
        if (this.position.x + visibleW / 2 > this.limitRight) {
            this.position.x = this.limitRight - visibleW / 2;
        }
    }

    // 4. Enforce vertical limits
    if (visibleH >= worldH) {
        // If viewport is taller than world, center vertically
        this.position.y = this.limitTop + worldH / 2;
    } else {
        if (this.position.y - visibleH / 2 < this.limitTop) {
            this.position.y = this.limitTop + visibleH / 2;
        }
        if (this.position.y + visibleH / 2 > this.limitBottom) {
            this.position.y = this.limitBottom - visibleH / 2;
        }
    }
  }

  resize(width: number, height: number) {
    this.viewport.width = width;
    this.viewport.height = height;
    this.enforceLimits();
  }
}

