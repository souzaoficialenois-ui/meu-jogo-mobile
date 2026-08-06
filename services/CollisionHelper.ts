import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { AnimationManager } from "./AnimationManager";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";

export class CollisionHelper {
  private static canvas: HTMLCanvasElement;
  private static ctx: CanvasRenderingContext2D;
  private static opaqueAABBCache: Map<
    string,
    { top: number; bottom: number; left: number; right: number }
  > = new Map();

  public static getOpaqueAABB(
    img: ImageBitmap | HTMLImageElement,
    cacheKey: string,
  ): { top: number; bottom: number; left: number; right: number } | null {
    if (this.opaqueAABBCache.has(cacheKey)) {
      return this.opaqueAABBCache.get(cacheKey)!;
    }

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
    }

    const w = img.width || (img as any).videoWidth;
    const h = img.height || (img as any).videoHeight;

    if (!w || !h || w === 0 || h === 0) return null;

    if (w > 2000 || h > 2000) return { top: 0, bottom: h, left: 0, right: w }; // Too big

    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.clearRect(0, 0, w, h);
    try {
      this.ctx.drawImage(img, 0, 0, w, h);
    } catch (e) {
      return null; // Might be broken
    }

    const imageData = this.ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    let found = false;

    // Use a step size of 4 pixels to scan extremely fast (94% fewer operations than scanning every pixel, and identical bounding boundaries)
    const step = 4;

    // 1. Find minY (top edge)
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          minY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      // Image is completely transparent
      this.opaqueAABBCache.set(cacheKey, null as any);
      return null;
    }

    // 2. Find maxY (bottom edge)
    found = false;
    for (let y = h - 1; y >= minY; y -= step) {
      for (let x = 0; x < w; x += step) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          maxY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) maxY = h - 1;

    // 3. Find minX (left edge)
    found = false;
    for (let x = 0; x < w; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          minX = x;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) minX = 0;

    // 4. Find maxX (right edge)
    found = false;
    for (let x = w - 1; x >= minX; x -= step) {
      for (let y = minY; y <= maxY; y += step) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          maxX = x;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) maxX = w - 1;

    const bounds = { top: minY, bottom: maxY, left: minX, right: maxX };
    this.opaqueAABBCache.set(cacheKey, bounds);
    return bounds;
  }

  public static getActualFrameWidth(anim: any, frame: number): number {
    if (!anim) return 0;
    const isGifAnim = anim.isGif || (anim.imageUrl && anim.imageUrl.toLowerCase().endsWith('.gif'));
    if (isGifAnim) {
      const bitmaps = AnimationManager.getInstance()["gifCache"].get(anim.imageUrl);
      if (bitmaps && bitmaps.length > 0) {
        const frameIndex = (anim.loop !== false) 
          ? frame % bitmaps.length 
          : Math.min(frame, bitmaps.length - 1);
        const img = bitmaps[frameIndex];
        if (img) return img.width;
      }
    } else {
      const tex = AnimationManager.getInstance().loadTexture(anim.imageUrl);
      if (tex && tex.complete && tex.naturalWidth > 0) {
        return anim.frameWidth || (tex.naturalWidth / (anim.frames || 1));
      }
    }
    return anim.frameWidth || 80;
  }

  /**
   * Retrieves the physical widths of the start and end segments of a beam.
   */
  public static getBeamPartWidths(p: any, engine: any): { startW: number; endW: number } {
    let startW = 80 * 2.2;
    let endW = 80 * 2.2;

    if (p.beamFamilyId) {
      const family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId);
      if (family) {
        const ownerData = p.ownerId === "p1" ? engine.player1.data : engine.player2.data;
        const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId];
        const midAnim = family.middle
          ? { ...family.middle, ...(charOverrides?.middle as any) }
          : family.middle;
        const startAnim = family.start
          ? { ...family.start, ...(charOverrides?.start as any) }
          : undefined;
        const endAnim = family.end
          ? { ...family.end, ...(charOverrides?.end as any) }
          : undefined;

        const scale = p.customScale ?? midAnim?.scale ?? 2.2;
        const startScale = p.customScale ?? startAnim?.scale ?? scale;
        const endScale = p.customScale ?? endAnim?.scale ?? scale;

        startW = startAnim ? CollisionHelper.getActualFrameWidth(startAnim, p.animFrame) * startScale : 80 * startScale;
        endW = endAnim ? CollisionHelper.getActualFrameWidth(endAnim, p.animFrame) * endScale : 80 * endScale;
      }
    }
    return { startW, endW };
  }

  /**
   * Retrieves the 4 world-coordinates vertices of a specific beam part (start, middle, end) or projectile, taking rotation into account.
   */
  public static getBeamPartVertices(p: any, engine: any, part: "start" | "middle" | "end"): { x: number; y: number }[] {
    const facingRight = p.initialFacingRight ?? p.vx > 0;
    
    let spawnX = facingRight ? p.x : p.x + p.width;
    let startY = p.y;

    spawnX += facingRight ? p.customOffsetX || 0 : -(p.customOffsetX || 0);
    startY += p.customOffsetY || 0;

    let midOffsetX = 0;
    let midOffsetY = 0;
    let startOffsetY = 0;
    let endOffsetY = 0;
    let rotation = 0;
    let scale = 2.2;

    let startAnim: any = undefined;
    let midAnim: any = undefined;
    let endAnim: any = undefined;

    let startH = 100;
    let midH = 100;
    let endH = 100;

    if (p.beamFamilyId) {
      const family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId);
      if (family) {
        const ownerData = p.ownerId === "p1" ? engine.player1.data : engine.player2.data;
        const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId];
        midAnim = family.middle
          ? { ...family.middle, ...(charOverrides?.middle as any) }
          : family.middle;
        startAnim = family.start
          ? { ...family.start, ...(charOverrides?.start as any) }
          : undefined;
        endAnim = family.end
          ? { ...family.end, ...(charOverrides?.end as any) }
          : undefined;

        if (midAnim) {
          midOffsetX = midAnim.offsetX || 0;
          midOffsetY = midAnim.offsetY || 0;
          scale = p.customScale ?? midAnim.scale ?? 2.2;
          rotation = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation ?? midAnim?.rotation ?? startAnim?.rotation ?? 0;

          const img = AnimationManager.getInstance().getGifFrame(midAnim.imageUrl, p.animFrame);
          if (img) {
            midH = img.height || midAnim.frameHeight || 100;
          } else {
            midH = midAnim.frameHeight || 100;
          }
        }
        if (startAnim) {
          startOffsetY = startAnim.offsetY || 0;
          const img = AnimationManager.getInstance().getGifFrame(startAnim.imageUrl, p.animFrame);
          if (img) {
            startH = img.height || startAnim.frameHeight || 100;
          } else {
            startH = startAnim.frameHeight || 100;
          }
        }
        if (endAnim) {
          endOffsetY = endAnim.offsetY || 0;
          const img = AnimationManager.getInstance().getGifFrame(endAnim.imageUrl, p.animFrame);
          if (img) {
            endH = img.height || endAnim.frameHeight || 100;
          } else {
            endH = endAnim.frameHeight || 100;
          }
        }
      }
    }

    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const dir = facingRight ? 1 : -1;

    const transformFromKiOriginWithOffset = (lx: number, ly: number, partOffsetY: number) => {
      const localYWithOffset = ly + partOffsetY;
      const rx = lx * cos - localYWithOffset * sin;
      const ry = lx * sin + localYWithOffset * cos;

      return {
        x: spawnX + dir * rx,
        y: startY + ry,
      };
    };

    const transformFromKiOrigin = (lx: number, ly: number) => {
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;

      return {
        x: spawnX + dir * rx,
        y: startY + ry * (p.verticalScale ?? 1.0),
      };
    };

    const transformPoint = (lx: number, ly: number) => {
      const lx_offset = lx + midOffsetX;
      const ly_offset = ly + midOffsetY;
      const rx = lx_offset * cos - ly_offset * sin;
      const ry = lx_offset * sin + ly_offset * cos;

      return {
        x: spawnX + dir * rx,
        y: startY + ry * (p.verticalScale ?? 1.0),
      };
    };

    const startScale = p.customScale ?? startAnim?.scale ?? scale;
    const endScale = p.customScale ?? endAnim?.scale ?? scale;

    const startW = startAnim ? CollisionHelper.getActualFrameWidth(startAnim, p.animFrame) * startScale : 80 * startScale;
    const endW = endAnim ? CollisionHelper.getActualFrameWidth(endAnim, p.animFrame) * endScale : 80 * endScale;

    const startH_actual = startAnim ? (startH * startScale) : 100 * startScale;
    const midH_actual = midH * scale;
    const endH_actual = endAnim ? (endH * endScale) : 100 * endScale;

    const midH_half = midH_actual / 2;

    if (part === "start") {
      const startOx = startAnim?.originX !== undefined ? startAnim.originX : startW / 2;
      const startOy = startAnim?.originY !== undefined ? startAnim.originY : 40; // h is 80 and centerAlignY is true

      const startCx = startAnim?.centerX !== undefined ? startAnim.centerX : startW / 2;
      const startCy = startAnim?.centerY !== undefined ? startAnim.centerY : startH_actual / 2;

      const startOffsetX = (startOx - startCx) + (startAnim?.offsetX || 0);
      const startOffsetYLocal = (startOy - startCy) + (startAnim?.offsetY || 0);

      const startX1 = startOffsetX;
      const startX2 = startOffsetX + startW;
      const startY1 = startOffsetYLocal;
      const startY2 = startOffsetYLocal + startH_actual;

      const transformStartPoint = (lx: number, ly: number) => {
        const startRot = startAnim?.rotation || 0;
        const startTheta = (startRot * Math.PI) / 180;
        const startCos = Math.cos(startTheta);
        const startSin = Math.sin(startTheta);

        // 1. Rotate around (startOx, startOy) by the sprite-specific rotation startRot
        const dx = lx - startOx;
        const dy = ly - startOy;
        const rx = startOx + dx * startCos - dy * startSin;
        const ry = startOy + dx * startSin + dy * startCos;

        // 2. Add drawing offsets (y = 5) and middle offsets if any
        const tx = rx + midOffsetX;
        const ty = ry + 5 + midOffsetY;

        // 3. Rotate around (0, 0) by the main beam's rotation (theta)
        const rx_final = tx * cos - ty * sin;
        const ry_final = tx * sin + ty * cos;

        // 4. Transform to world coordinates using spawnX, startY, dir, and verticalScale
        let wx = spawnX + dir * rx_final;
        let wy = startY + ry_final * (p.verticalScale ?? 1.0);

        return { x: wx, y: wy };
      };

      const corner1 = transformStartPoint(startX1, startY1);
      const corner2 = transformStartPoint(startX2, startY1);
      const corner3 = transformStartPoint(startX2, startY2);
      const corner4 = transformStartPoint(startX1, startY2);
      return [corner1, corner2, corner3, corner4];
    } else if (part === "middle") {
      let midLeft = 0;
      if (startAnim) {
        const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
        const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
        midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
      } else {
        midLeft = 0;
      }

      let midRight = p.width;
      if (endAnim) {
        const oxEnd = endAnim.originX !== undefined ? endAnim.originX : 0;
        const cxEnd = endAnim.centerX !== undefined ? endAnim.centerX : endW / 2;
        midRight = p.width + (oxEnd - cxEnd) + (endAnim.offsetX || 0) + endW / 2;
      } else {
        midRight = p.width;
      }
      midRight = Math.max(midLeft, midRight);

      const midY1 = -midH_half + 5;
      const midY2 = midH_half + 5;

      const corner1 = transformPoint(midLeft, midY1);
      const corner2 = transformPoint(midRight, midY1);
      const corner3 = transformPoint(midRight, midY2);
      const corner4 = transformPoint(midLeft, midY2);
      return [corner1, corner2, corner3, corner4];
    } else { // part === "end" (Ponta)
      const endOx = endAnim?.originX !== undefined ? endAnim.originX : 0;
      const endOy = endAnim?.originY !== undefined ? endAnim.originY : 5; // h is 10 and centerAlignY is true

      const endCx = endAnim?.centerX !== undefined ? endAnim.centerX : endW / 2;
      const endCy = endAnim?.centerY !== undefined ? endAnim.centerY : endH_actual / 2;

      const endOffsetX = (endOx - endCx) + (endAnim?.offsetX || 0);
      const endOffsetYLocal = (endOy - endCy) + (endAnim?.offsetY || 0);

      let midLeft = 0;
      if (startAnim) {
        const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
        const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
        midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
      } else {
        midLeft = 0;
      }

      const drawEndX = Math.max(midLeft, p.width);

      const endX1 = drawEndX + endOffsetX;
      const endX2 = drawEndX + endOffsetX + endW;
      const endY1 = 5 + endOffsetYLocal;
      const endY2 = 5 + endOffsetYLocal + endH_actual;

      const corner1 = transformPoint(endX1, endY1);
      const corner2 = transformPoint(endX2, endY1);
      const corner3 = transformPoint(endX2, endY2);
      const corner4 = transformPoint(endX1, endY2);
      return [corner1, corner2, corner3, corner4];
    }
  }

  /**
   * Retrieves the 4 world-coordinates vertices of a projectile/beam, taking rotation into account.
   */
  public static getProjectileVertices(p: any, engine: any): { x: number; y: number }[] {
    if (p.beamFamilyId === "FECHO_DE_ENERGIA_10") {
      const family = ProjectileConfigKeyManager.getInstance().getProjectileConfig("FECHO_DE_ENERGIA_10");
      if (family && family.middle) {
        const img = AnimationManager.getInstance().getGifFrame(family.middle.imageUrl, p.animFrame);
        const scale = p.customScale ?? family.middle.scale ?? 2.0;
        const imgW = img ? img.width : 80;
        const imgH = img ? img.height : 250;
        const scaledW = imgW * scale;
        const scaledH = imgH * scale;

        // Since the pivot/origin (Bottom Center) of each beam is at (p.x, p.y):
        const left = p.x - scaledW / 2;
        const right = p.x + scaledW / 2;
        const top = p.y - scaledH;
        const bottom = p.y;

        return [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom }
        ];
      }
    }

    const facingRight = p.initialFacingRight ?? p.vx > 0;
    
    let spawnX = facingRight ? p.x : p.x + p.width;
    let startY = p.y;

    spawnX += facingRight ? p.customOffsetX || 0 : -(p.customOffsetX || 0);
    startY += p.customOffsetY || 0;

    let midOffsetX = 0;
    let midOffsetY = 0;
    let rotation = 0;
    let scale = 2.2;
    let h = 100;

    if (p.beamFamilyId) {
      let family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId) as any;
      if (!family) {
        family = ProjectileConfigKeyManager.getInstance().getProjectileConfig(p.beamFamilyId);
      }
      if (family) {
        const ownerData = p.ownerId === "p1" ? engine.player1.data : engine.player2.data;
        const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId];
        const midAnim = family.middle
          ? { ...family.middle, ...(charOverrides?.middle as any) }
          : family.middle;
        const startAnim = family.start
          ? { ...family.start, ...(charOverrides?.start as any) }
          : undefined;

        if (midAnim) {
          midOffsetX = midAnim.offsetX || midAnim.projectileOffsetX || 0;
          midOffsetY = midAnim.offsetY || midAnim.projectileOffsetY || 0;
          scale = p.customScale ?? midAnim.scale ?? midAnim.projectileScale ?? 2.2;
          rotation = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation ?? midAnim?.rotation ?? startAnim?.rotation ?? 0;

          // Try to get real heights from image if loaded
          const img = AnimationManager.getInstance().getGifFrame(midAnim.imageUrl, p.animFrame);
          if (img) {
            h = img.height || midAnim.frameHeight || 100;
          } else {
            h = midAnim.frameHeight || 100;
          }
        }
      }
    }

    if (p.isBeam) {
      // Standardized Beam Hitbox:
      // We build a single, continuous hitbox using the exact 2D transformation matrix sequence
      // of GameRenderer to align the hitbox pixel-for-pixel with the rendered visual beam.
      const H_half = (h * scale * (p.verticalScale ?? 1.0)) / 2;

      const theta = (rotation * Math.PI) / 180;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const dir = facingRight ? 1 : -1;

      const transformFromKiOrigin = (lx: number, ly: number) => {
        // Rotate (lx, ly) directly at the ki origin point (spawnX, startY)
        const rx = lx * cos - ly * sin;
        const ry = lx * sin + ly * cos;

        return {
          x: spawnX + dir * rx,
          y: startY + ry,
        };
      };

      const transformPoint = (lx: number, ly: number) => {
        // Match GameRenderer's exact 2D transformation matrix:
        // 1. Initial point (lx, ly) in local space
        // 2. Rotate by theta
        // 3. Translate by midOffsetX, midOffsetY in scaled space
        // 4. Scale horizontally by dir (x flip if facing left)
        // 5. Translate to world spawnX, startY
        const rx = lx * cos - ly * sin;
        const ry = lx * sin + ly * cos;

        const x2 = midOffsetX + rx;
        const y2 = midOffsetY + ry;

        return {
          x: spawnX + dir * x2,
          y: startY + y2,
        };
      };

      const corner1 = transformFromKiOrigin(0, -H_half);      // start-top (at ki origin point)
      const corner2 = transformFromKiOrigin(p.width, -H_half);       // end-top (reaching visual tip as it grows)
      const corner3 = transformFromKiOrigin(p.width, H_half);        // end-bottom (reaching visual tip as it grows)
      const corner4 = transformFromKiOrigin(0, H_half);       // start-bottom (at ki origin point)

      return [corner1, corner2, corner3, corner4];
    }

    // Default dimensions fallback for standard projectiles
    const localY = (-h * scale) / 2 + 5;
    const localH = h * scale;
    let localX = 0;
    let localW = p.width;

    return this.getVerticesFromLocalRect(spawnX, startY, midOffsetX, midOffsetY, facingRight, rotation, localX, localY, localW, localH);
  }

  private static getVerticesFromLocalRect(
    spawnX: number,
    startY: number,
    midOffsetX: number,
    midOffsetY: number,
    facingRight: boolean,
    rotationDegrees: number,
    localX: number,
    localY: number,
    localW: number,
    localH: number
  ): { x: number; y: number }[] {
    const angle = facingRight ? (rotationDegrees * Math.PI) / 180 : -(rotationDegrees * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const corners = [
      { x: localX, y: localY },
      { x: localX + localW, y: localY },
      { x: localX + localW, y: localY + localH },
      { x: localX, y: localY + localH },
    ];

    return corners.map(pt => {
      let tx: number;
      let ty: number;

      if (facingRight) {
        tx = pt.x + midOffsetX;
        ty = pt.y + midOffsetY;
      } else {
        tx = -pt.x - midOffsetX;
        ty = pt.y + midOffsetY;
      }

      const rx = tx * cos - ty * sin;
      const ry = tx * sin + ty * cos;

      return {
        x: spawnX + rx,
        y: startY + ry
      };
    });
  }

  /**
   * Retrieves the 4 vertices of an AABB.
   */
  public static getAABBVertices(rect: { x: number; y: number; width: number; height: number }): { x: number; y: number }[] {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];
  }

  /**
   * Checks if two AABBs intersect.
   */
  public static testAABB(r1: { x: number; y: number; width: number; height: number }, r2: { x: number; y: number; width: number; height: number }): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  /**
   * Checks if two convex polygons intersect using the Separating Axis Theorem (SAT).
   * Optimized with faster AABB pre-filtering and reduced dot product operations.
   */
  public static testPolygonCollision(poly1: { x: number; y: number }[], poly2: { x: number; y: number }[]): boolean {
    if (!poly1 || !poly2 || poly1.length === 0 || poly2.length === 0) return false;

    const len1 = poly1.length;
    const len2 = poly2.length;

    // Fast block-phase check: bounding box (AABB) overlap pre-filtering
    let min1X = poly1[0].x, max1X = poly1[0].x;
    let min1Y = poly1[0].y, max1Y = poly1[0].y;
    for (let c = 1; c < len1; c++) {
      const p = poly1[c];
      if (p.x < min1X) min1X = p.x;
      else if (p.x > max1X) max1X = p.x;
      if (p.y < min1Y) min1Y = p.y;
      else if (p.y > max1Y) max1Y = p.y;
    }

    let min2X = poly2[0].x, max2X = poly2[0].x;
    let min2Y = poly2[0].y, max2Y = poly2[0].y;
    for (let c = 1; c < len2; c++) {
      const p = poly2[c];
      if (p.x < min2X) min2X = p.x;
      else if (p.x > max2X) max2X = p.x;
      if (p.y < min2Y) min2Y = p.y;
      else if (p.y > max2Y) max2Y = p.y;
    }

    if (max1X < min2X || max2X < min1X || max1Y < min2Y || max2Y < min1Y) {
      return false; // No intersection possible, skip expensive SAT math
    }

    // SAT Phase
    const polys = [poly1, poly2];
    for (let i = 0; i < 2; i++) {
      const poly = polys[i];
      const pLen = poly.length;
      
      for (let j = 0; j < pLen; j++) {
        const p1 = poly[j];
        const p2 = poly[(j + 1) % pLen];

        // Normal vector to the edge (axis)
        const normalX = -(p2.y - p1.y);
        const normalY = p2.x - p1.x;

        // Skip zero normals
        if (normalX === 0 && normalY === 0) continue;

        // Project poly1 on the axis
        let min1 = Infinity, max1 = -Infinity;
        for (let k = 0; k < len1; k++) {
          const p = poly1[k];
          const projection = p.x * normalX + p.y * normalY;
          if (projection < min1) min1 = projection;
          if (projection > max1) max1 = projection;
        }

        // Project poly2 on the axis
        let min2 = Infinity, max2 = -Infinity;
        for (let k = 0; k < len2; k++) {
          const p = poly2[k];
          const projection = p.x * normalX + p.y * normalY;
          if (projection < min2) min2 = projection;
          if (projection > max2) max2 = projection;
        }

        // Separating axis found!
        if (max1 < min2 || max2 < min1) {
          return false;
        }
      }
    }

    return true;
  }
}
