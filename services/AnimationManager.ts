
import { CharacterData, PlayerState, RarityTier, AnimationFrameData, SpriteConfig } from '../types';
import { RARITY_INFO } from '../constants';
import { SHIELD_ANIM_DATA } from '../constants/SpriteDatabase';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { CacheService } from './CacheService';
import { resolveAnimationKey } from './AnimationResolver';
import { AuraConfigKeyManager, DEFAULT_AURAS } from './AuraConfigKeyManager';
import { GlowOptimizer } from './GlowOptimizer';

import { FrameManager } from './FrameManager';
import { localizeUrl } from './UrlLocalizer';

const AURA_GIFS = {
    // 1: White/Light (Base Goku & Vegeta)
    AURA_001: "/Assets/aura/1.gif",
    // 2: Yellow/Gold (SSJ)
    AURA_002: "/Assets/aura/2.gif",
    // 3: Blue (SSJ Blue)
    AURA_003: "/Assets/aura/3.gif",
    // 4: Pink/Rose
    AURA_004: "/Assets/aura/4.gif",
    // 5: Silver/Ultra Instinct
    AURA_005: "/Assets/aura/5.gif",
    // 6: Purple (Ultra Ego / Gojo Infin)
    AURA_006: "/Assets/aura/6.gif",
    // 7: Red / Dark Red spark (Sparking mode limit-burst / special powerup)
    AURA_007: "/Assets/aura/7.gif",
    // 8-15: Additional high-fidelity auras
    AURA_008: "/Assets/aura/8.gif",
    AURA_009: "/Assets/aura/9.gif",
    AURA_010: "/Assets/aura/10.gif",
    AURA_011: "/Assets/aura/11.gif",
    AURA_012: "/Assets/aura/12.gif",
    AURA_013: "/Assets/aura/13.gif",
    AURA_014: "/Assets/aura/14.gif",
    AURA_015: "/Assets/aura/15.gif",
};

export function getCharacterAuraUrl(charId: string): string {
    const normId = (charId || '').toLowerCase();
    if (normId.includes("frieza")) {
        return AURA_GIFS.AURA_008; // Custom premium dark-purple Frieza aura
    }
    if (normId.includes("gojo")) {
        return AURA_GIFS.AURA_009; // Custom premium sky blue limitless Gojo aura
    }
    if (normId.includes("mui") || normId.includes("ultra_instinct") || normId.includes("sign")) {
        return AURA_GIFS.AURA_005;
    }
    if (normId.includes("rose")) {
        return AURA_GIFS.AURA_004;
    }
    if (normId.includes("blue") || normId.includes("god")) {
        return AURA_GIFS.AURA_003;
    }
    if (normId.includes("ssj") || normId.includes("super_saiyan") || normId.includes("gogeta_ssj") || normId.includes("trunks_ssj")) {
        return AURA_GIFS.AURA_002;
    }
    if (normId.includes("ego") || normId.includes("purificador")) {
        return AURA_GIFS.AURA_006;
    }
    return AURA_GIFS.AURA_001;
}

export class AnimationManager {
    private static instance: AnimationManager;
    private textureCache: Map<string, HTMLImageElement> = new Map();
    private gifCache: Map<string, ImageBitmap[]> = new Map();
    private gifDelays: Map<string, number[]> = new Map();
    private loadingGifs: Set<string> = new Set();
    private blobUrlMap: Map<string, string> = new Map();
    private tintCache: Map<string, HTMLCanvasElement> = new Map();
    private filterCache: Map<string, HTMLCanvasElement> = new Map();
    private animKeyCache: Map<string, string> = new Map();

    private constructor() {}

    private normalizeUrl(url: string | undefined): string {
        return localizeUrl(url);
    }

    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    public getParticleMultiplier(): number {
        return GlowOptimizer.getInstance().getParticleMultiplier();
    }

    private getFilterString(filters?: { hueRotate?: number, saturate?: number, brightness?: number, contrast?: number }): string {
        if (!filters) return "";
        let str = "";
        // Only add filters that differ from default values to minimize overhead and prevent unnecessary recalculations
        if (filters.hueRotate !== undefined && filters.hueRotate !== 0) str += ` hue-rotate(${filters.hueRotate}deg)`;
        if (filters.saturate !== undefined && filters.saturate !== 1) str += ` saturate(${filters.saturate})`;
        if (filters.brightness !== undefined && filters.brightness !== 1) str += ` brightness(${filters.brightness})`;
        if (filters.contrast !== undefined && filters.contrast !== 1) str += ` contrast(${filters.contrast})`;
        return str.trim();
    }

    /**
     * Transforms a color string using CSS filters by rendering it on a hidden 1x1 canvas.
     * This ensures consistent color matching between tinted images and their associated glow effects.
     */
    public getTransformedColor(color: string, filters: any): string {
        const filterStr = this.getFilterString(filters);
        if (!filterStr || color === "transparent") return color;

        const cacheKey = `color_trans_${color}_${filterStr}`;
        if (this.tintCache.has(cacheKey)) {
            return (this.tintCache.get(cacheKey) as any)._finalColor || color;
        }

        try {
            const temp = document.createElement('canvas');
            temp.width = 1; temp.height = 1;
            const tctx = temp.getContext('2d');
            if (!tctx) return color;

            tctx.filter = filterStr;
            tctx.fillStyle = color;
            tctx.fillRect(0, 0, 1, 1);
            
            const data = tctx.getImageData(0, 0, 1, 1).data;
            const finalColor = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
            
            // We use a dummy canvas to store the string in the existing tintCache to avoid adding another Map
            const dummy: any = document.createElement('canvas');
            dummy._finalColor = finalColor;
            this.tintCache.set(cacheKey, dummy);
            
            return finalColor;
        } catch (e) {
            console.warn("Failed to transform color:", e);
            return color;
        }
    }

    /**
     * Obtains a cached tinted and filtered canvas of an image to prevent garbage collection spikes and FPS drops.
     * Uses an advanced multi-pass tinting algorithm that preserves highlights and details.
     */
    public getCachedEffectImg(
        img: CanvasImageSource, 
        color: string, 
        cacheKey: string, 
        filters?: { hueRotate?: number, saturate?: number, brightness?: number, contrast?: number },
        width?: number, 
        height?: number
    ): any {
        let filterStr = "";
        if (filters) {
            if (filters.hueRotate !== undefined) filterStr += `_h${filters.hueRotate}`;
            if (filters.saturate !== undefined) filterStr += `_s${filters.saturate}`;
            if (filters.brightness !== undefined) filterStr += `_b${filters.brightness}`;
            if (filters.contrast !== undefined) filterStr += `_c${filters.contrast}`;
        }
        
        const fullKey = `filt_${cacheKey}_${color}${filterStr}`;
        if (this.tintCache.has(fullKey)) {
            return this.tintCache.get(fullKey)!;
        }

        const tempCanvas = document.createElement("canvas");
        
        let imgW = 0;
        let imgH = 0;
        if (img instanceof ImageBitmap || img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) {
            imgW = (img as any).width || width || 0;
            imgH = (img as any).height || height || 0;
            if (img instanceof HTMLImageElement) {
                imgW = img.naturalWidth || img.width || width || 0;
                imgH = img.naturalHeight || img.height || height || 0;
            }
        } else {
            imgW = width || 0;
            imgH = height || 0;
        }

        if (imgW <= 0 || imgH <= 0) {
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            this.tintCache.set(fullKey, tempCanvas);
            return tempCanvas;
        }

        tempCanvas.width = Math.ceil(Number(imgW)) || 120;
        tempCanvas.height = Math.ceil(Number(imgH)) || 120;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (tempCtx) {
            tempCtx.save();
            
        const canvasFilter = this.getFilterString(filters);
        
        if (color !== "#ffffff" && color !== "white" && color && color !== "transparent") {
                // ADVANCED HIGHLIGHT-PRESERVING TINTING
                // 1. Draw base with grayscale and initial contrast boost
                tempCtx.filter = "grayscale(100%) brightness(1.2) contrast(1.1)";
                tempCtx.drawImage(img, 0, 0);
                
                // 2. Multiply with the target color to inject hue into midtones/shadows
                tempCtx.globalCompositeOperation = "multiply";
                tempCtx.fillStyle = color;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // 3. Add back highlights using original grayscale image (screen mode)
                // This prevents the aura from looking "flat" or "muddy"
                tempCtx.globalCompositeOperation = "screen";
                tempCtx.globalAlpha = 0.45;
                tempCtx.filter = "grayscale(100%) brightness(1.2)";
                tempCtx.drawImage(img, 0, 0);
                tempCtx.globalAlpha = 1.0;

                // 4. Final clip with original alpha to prevent "black box" artifacts from blend modes
                tempCtx.globalCompositeOperation = "destination-in";
                tempCtx.filter = "none";
                tempCtx.drawImage(img, 0, 0);

                // 5. Apply the user-requested filters (hue-rotate, saturate, etc.) to the TINTED result
                if (canvasFilter) {
                    const postCanvas = document.createElement("canvas");
                    postCanvas.width = tempCanvas.width;
                    postCanvas.height = tempCanvas.height;
                    const postCtx = postCanvas.getContext("2d");
                    if (postCtx) {
                        postCtx.filter = canvasFilter.trim();
                        postCtx.drawImage(tempCanvas, 0, 0);
                        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                        tempCtx.globalCompositeOperation = "source-over";
                        tempCtx.drawImage(postCanvas, 0, 0);
                    }
                }
            } else {
                // ONLY FILTER LOGIC (No tinting)
                if (canvasFilter) tempCtx.filter = canvasFilter.trim();
                tempCtx.drawImage(img, 0, 0);
            }
            
            tempCtx.restore();
        }

        this.tintCache.set(fullKey, tempCanvas);
        return tempCanvas;
    }

    /**
     * Obtains a cached tinted canvas of an image to prevent garbage collection spikes and FPS drops.
     */
    public getTintedImg(img: CanvasImageSource, color: string, cacheKey: string, width?: number, height?: number): any {
        const fullKey = `${cacheKey}_${color}`;
        if (this.tintCache.has(fullKey)) {
            return this.tintCache.get(fullKey)!;
        }

        const tempCanvas = document.createElement("canvas");
        
        let actualW = (img as any)?.width || width || 0;
        let actualH = (img as any)?.height || height || 0;
        if (img instanceof HTMLImageElement) {
            actualW = img.naturalWidth || img.width || width || 0;
            actualH = img.naturalHeight || img.height || height || 0;
        }

        if (!img || actualW <= 0 || actualH <= 0) {
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            this.tintCache.set(fullKey, tempCanvas);
            return tempCanvas;
        }

        tempCanvas.width = Number(actualW) || 120;
        tempCanvas.height = Number(actualH) || 120;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (tempCtx) {
            try {
                // 1. Draw the grayscaled image onto tempCtx to serve as detailed base
                tempCtx.save();
                tempCtx.filter = "grayscale(100%) brightness(1.2) contrast(1.1)";
                tempCtx.drawImage(img, 0, 0);
                tempCtx.restore();

                // 2. Create an offscreen canvas to hold the solid color masked to the image shape
                const maskCanvas = document.createElement("canvas");
                maskCanvas.width = tempCanvas.width;
                maskCanvas.height = tempCanvas.height;
                const maskCtx = maskCanvas.getContext("2d");
                if (maskCtx) {
                    maskCtx.drawImage(img, 0, 0);
                    maskCtx.globalCompositeOperation = "source-in";
                    maskCtx.fillStyle = color;
                    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                }

                // 3. Draw the solid colored mask on top of the grayscaled image using "multiply"
                tempCtx.save();
                tempCtx.globalCompositeOperation = "multiply";
                if (maskCanvas.width > 0 && maskCanvas.height > 0) {
                    tempCtx.drawImage(maskCanvas, 0, 0);
                }
                tempCtx.restore();

                // 4. Draw the grayscaled version on top using "screen" composite mode
                tempCtx.save();
                tempCtx.globalCompositeOperation = "screen";
                tempCtx.globalAlpha = 0.45;
                tempCtx.filter = "grayscale(100%) brightness(1.2)";
                tempCtx.drawImage(img, 0, 0);
                tempCtx.restore();

                // 5. Clean up transparent background clipping
                tempCtx.save();
                tempCtx.globalCompositeOperation = "destination-in";
                tempCtx.drawImage(img, 0, 0);
                tempCtx.restore();
            } catch (e) {
                // Fallback for unexpected canvas draw failures
            }
        }

        this.tintCache.set(fullKey, tempCanvas);
        return tempCanvas;
    }

    public getFilteredImg(
        img: CanvasImageSource,
        color: string,
        filters: string[],
        cacheKey: string,
        width?: number,
        height?: number,
        padding: number = 30
    ): HTMLCanvasElement {
        const filtersStr = filters.join("_");
        const fullKey = `${cacheKey}_${color}_${filtersStr}_${padding}`;
        if (this.filterCache.has(fullKey)) {
            return this.filterCache.get(fullKey)!;
        }

        let baseImg: CanvasImageSource = img;
        if (color && color !== "#ffffff" && color !== "") {
            baseImg = this.getTintedImg(img, color, cacheKey, width, height);
        }

        const tempCanvas = document.createElement("canvas");
        const baseW = (baseImg as any)?.naturalWidth || (baseImg as any)?.width || width || 0;
        const baseH = (baseImg as any)?.naturalHeight || (baseImg as any)?.height || height || 0;

        if (!baseImg || baseW <= 0 || baseH <= 0) {
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            this.filterCache.set(fullKey, tempCanvas);
            return tempCanvas;
        }

        tempCanvas.width = Number(baseW) + 2 * padding;
        tempCanvas.height = Number(baseH) + 2 * padding;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
            try {
                tempCtx.imageSmoothingEnabled = false;
                if (filters.length > 0) {
                    tempCtx.filter = filters.join(" ");
                }
                tempCtx.drawImage(baseImg, padding, padding);
            } catch (e) {
                // Fallback
            }
        }

        this.filterCache.set(fullKey, tempCanvas);
        return tempCanvas;
    }

    public async loadGif(url: string) {
        url = this.normalizeUrl(url);
        
        if (this.gifCache.has(url) || this.loadingGifs.has(url)) return;
        this.loadingGifs.add(url);
        try {
            const buff = await CacheService.getCachedArrayBuffer(url);
            const gif = parseGIF(buff);
            const frames = decompressFrames(gif, true);
            
            // Render frames onto a canvas to create ImageBitmaps
            const bitmaps: ImageBitmap[] = [];
            const delays: number[] = [];
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d')!;
            
            if (frames.length > 0) {
                tempCanvas.width = gif.lsd.width;
                tempCanvas.height = gif.lsd.height;
            }

            // frames are successive patches, need to draw them on top of each other (with respecting disposal)
            let previousData: ImageData | null = null;
            
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                
                if (frame.disposalType === 2) {
                    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                } else if (frame.disposalType === 3 && previousData) {
                    tempCtx.putImageData(previousData, 0, 0);
                }

                if (frame.disposalType !== 2 && frame.disposalType !== 3) {
                    previousData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                }

                const imageData = new ImageData(
                    new Uint8ClampedArray(frame.patch),
                    frame.dims.width,
                    frame.dims.height
                );
                
                if (frame.dims.width > 0 && frame.dims.height > 0) {
                    const patchCanvas = document.createElement('canvas');
                    patchCanvas.width = frame.dims.width;
                    patchCanvas.height = frame.dims.height;
                    patchCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

                    tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
                }
                
                const bitmap = await self.createImageBitmap(tempCanvas);
                bitmaps.push(bitmap);
                
                // GIF frame delays are in centiseconds (1/100 s). Convert to milliseconds:
                const rawDelay = frame.delay;
                const delayMs = (rawDelay && rawDelay > 0) ? (rawDelay < 1000 ? rawDelay * 10 : rawDelay) : 100;
                // Browsers clamp delays < 20 ms to 100 ms.
                const finalDelay = delayMs < 20 ? 100 : delayMs;
                delays.push(finalDelay);
            }
            this.gifCache.set(url, bitmaps);
            this.gifDelays.set(url, delays);
            FrameManager.getInstance().registerFrames(url, bitmaps.length, delays);
        } catch (e) {
            console.error("Failed to load GIF:", url, e);
        } finally {
            this.loadingGifs.delete(url);
        }
    }

    public isLoading(): boolean {
        return this.loadingGifs.size > 0;
    }

    public getGifFrameCount(url: string): number {
        url = this.normalizeUrl(url);
        const bitmaps = this.gifCache.get(url);
        return bitmaps ? bitmaps.length : 0;
    }

    public getGifInfo(url: string): { width: number, height: number } | null {
        url = this.normalizeUrl(url);
        const bitmaps = this.gifCache.get(url);
        if (bitmaps && bitmaps.length > 0) {
            return { width: bitmaps[0].width, height: bitmaps[0].height };
        }
        return null;
    }

    public getGifFrame(url: string, frame: number, freezeOnLastFrame?: boolean): ImageBitmap | HTMLImageElement | null {
        url = this.normalizeUrl(url);
        const bitmaps = this.gifCache.get(url);
        if (bitmaps && bitmaps.length > 0) {
            if (freezeOnLastFrame && frame >= bitmaps.length - 1) {
                return bitmaps[bitmaps.length - 1];
            }
            return bitmaps[frame % bitmaps.length];
        }
        
        const isStaticImg = url && (url.toLowerCase().endsWith(".png") || url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg") || url.toLowerCase().includes(".png?") || url.toLowerCase().includes(".jpg?") || url.toLowerCase().includes(".jpeg?"));
        if (isStaticImg) {
            if (!this.textureCache.has(url)) {
                this.loadTexture(url);
            }
        } else {
            // Trigger load if not loading and not loaded
            if (!this.loadingGifs.has(url)) {
                this.loadGif(url);
            }
        }
        
        // If it's a regular sprite sheet or image, try to return it
        const tex = this.textureCache.get(url);
        if (tex && tex.complete && tex.naturalWidth > 0) {
            return tex;
        }

        return null;
    }

    public getGifFrameDelay(url: string, frameIndex: number): number {
        url = this.normalizeUrl(url);
        const delays = this.gifDelays.get(url);
        if (delays && delays[frameIndex] !== undefined) {
            // delay is in milliseconds because gifuct-js converts it during parsing.
            // In 60 FPS, 1 game tick is ~16.666ms.
            // Ticks = delay / 16.666
            return Math.max(1, Math.round(delays[frameIndex] / 16.666));
        }
        return -1;
    }

    public async loadTextureAsync(url: string): Promise<HTMLImageElement> {
        url = this.normalizeUrl(url);

        if (this.textureCache.has(url)) {
            const img = this.textureCache.get(url)!;
            if (img.complete) return img;
            return new Promise((resolve) => {
                const oldOnload = img.onload;
                img.onload = (e) => {
                    if (oldOnload) (oldOnload as any)(e);
                    resolve(img);
                };
            });
        }
        
        return new Promise<HTMLImageElement>(async (resolve, reject) => {
            const img = new Image();
            this.textureCache.set(url, img);
            
            try {
                const cachedUrl = await CacheService.getCachedBlobUrl(url);
                this.blobUrlMap.set(url, cachedUrl);
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.warn("Error loading image from blob url", url);
                    resolve(img);
                };
                img.src = cachedUrl;
            } catch(err) {
                console.warn("Error getting cached blob url", err);
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img);
                img.src = url;
            }
        });
    }

    public loadTexture(url: string): HTMLImageElement {
        url = this.normalizeUrl(url);

        if (this.textureCache.has(url)) {
            return this.textureCache.get(url)!;
        }
        
        const img = new Image();
        this.textureCache.set(url, img);
        
        CacheService.getCachedBlobUrl(url).then(cachedUrl => {
            this.blobUrlMap.set(url, cachedUrl);
            img.src = cachedUrl;
        }).catch(err => {
            img.src = url;
            console.warn("Error getting cached blob url", err);
        });

        return img;
    }

    public preloadCharacter(character: CharacterData) {
        if (!character.spriteConfig || !character.spriteConfig.animations) return;
        Object.values(character.spriteConfig.animations).forEach(anim => {
            if (anim && anim.imageUrl) {
                const isGifAnim = anim.isGif || anim.imageUrl.toLowerCase().endsWith('.gif');
                if (isGifAnim) {
                    this.loadGif(anim.imageUrl);
                } else {
                    this.loadTexture(anim.imageUrl);
                }
            }
        });
        if (SHIELD_ANIM_DATA.imageUrl) this.loadTexture(SHIELD_ANIM_DATA.imageUrl);

        // Preload charging rock textures
        for (let i = 1; i <= 6; i++) {
            const rockUrl = `/Assets/efeitos/chao/pedras/${i}.png`;
            this.loadTexture(rockUrl);
        }

        // Preload destroyed/cracked ground GIF
        const crackUrl = "/Assets/efeitos/chao/destruido/1.gif";
        this.loadGif(crackUrl);
    }

    public clearKeyCache() {
        this.animKeyCache.clear();
    }

    public drawFrame(
        ctx: CanvasRenderingContext2D,
        anim: AnimationFrameData,
        frame: number,
        x: number, 
        y: number, 
        w: number, 
        h: number,
        defaultScale: number,
        facingRight: boolean,
        centerAlignY: boolean = false,
        tintColor?: string
    ) {
        if (!anim || !anim.imageUrl) return;

        let img: CanvasImageSource;
        let srcX = 0;
        let srcY = 0;
        let frameWidth = anim.frameWidth;
        let frameHeight = anim.frameHeight;
        const normalizedUrl = this.normalizeUrl(anim.imageUrl);
        let cacheKey = normalizedUrl;

        const isGifAnim = anim.isGif || (anim.imageUrl && anim.imageUrl.toLowerCase().endsWith(".gif"));

        if (isGifAnim) {
            const bitmaps = this.gifCache.get(normalizedUrl);
            if (!bitmaps || bitmaps.length === 0) {
                this.loadGif(normalizedUrl);
                return; // Still loading
            }
            
            // Adjust anim frame to match gif frame count if we just want loop
            anim.frames = bitmaps.length;

            const frameIndex = (anim.loop !== false) 
                ? frame % bitmaps.length 
                : Math.min(frame, bitmaps.length - 1);
            
            cacheKey = `${normalizedUrl}_${frameIndex}`;
            
            // Failsafe for transformations/intros to absolutely stop it from looping
            if (anim.loop === false && frame >= bitmaps.length - 1) {
                // Keep rendering the last frame
                img = bitmaps[bitmaps.length - 1];
            } else {
                img = bitmaps[frameIndex];
            }
            
            frameWidth = img.width;
            frameHeight = img.height;
            if (anim.frameWidth === 0) anim.frameWidth = frameWidth;
            if (anim.frameHeight === 0) anim.frameHeight = frameHeight;
        } else {
            const tex = this.loadTexture(normalizedUrl);
            if (!tex.complete || tex.naturalWidth === 0) return;
            img = tex;
            const frameIndex = (anim.loop !== false) 
                ? frame % anim.frames 
                : Math.min(frame, anim.frames - 1);

            const startOffset = anim.startFrame || 0;
            const actualFrameIndex = startOffset + frameIndex;
            const row = anim.row || 0;
            
            const fWidth = anim.frameWidth || tex.naturalWidth;
            const fHeight = anim.frameHeight || tex.naturalHeight;
            
            srcX = actualFrameIndex * fWidth;
            srcY = row * fHeight;

            if (anim.isVertical) {
                srcX = row * fWidth;
                srcY = actualFrameIndex * fHeight;
            }

            if (anim.isVertical) {
                if (srcY + fHeight > tex.naturalHeight) return;
            } else {
                if (srcX + fWidth > tex.naturalWidth) return;
            }
            frameWidth = fWidth;
            frameHeight = fHeight;
            if (anim.frameWidth === 0) anim.frameWidth = frameWidth;
            if (anim.frameHeight === 0) anim.frameHeight = frameHeight;
        }
        
        let scale = anim.scale || defaultScale || 1;

        const drawWidth = frameWidth * scale;
        const drawHeight = frameHeight * scale;
        
        // Origin relative to the hitbox (default is bottom-center for chars: w/2, h. For beams: w/2, h/2)
        const ox = anim.originX !== undefined ? anim.originX : w / 2;
        const oy = anim.originY !== undefined ? anim.originY : ((centerAlignY || anim.fullScreen) ? h / 2 : h);
        
        // Center relative to the sprite bounds
        const cx = anim.centerX !== undefined ? anim.centerX : drawWidth / 2;
        const cy = anim.centerY !== undefined ? anim.centerY : ((centerAlignY || anim.fullScreen) ? drawHeight / 2 : drawHeight);

        // The final render offset inside the Hitbox
        const offsetX = (ox - cx) + (anim.offsetX || 0);
        const offsetY = (oy - cy) + (anim.offsetY || 0);

        ctx.save();
        const rX = x;
        const rY = y;

        if (!facingRight) {
             ctx.translate(rX + w, rY);
             ctx.scale(-1, 1);
        } else {
             ctx.translate(rX, rY);
        }

        if (anim.rotation) {
            ctx.translate(ox, oy);
            ctx.rotate(anim.rotation * Math.PI / 180);
            ctx.translate(-ox, -oy);
        }

        // Sub-pixel rendering for high precision camera tracking
        const finalDrawX = offsetX;
        const finalDrawY = offsetY;
        const finalDrawW = drawWidth;
        const finalDrawH = drawHeight;

        if (tintColor && tintColor !== "#ffffff") {
            const tintedImg = this.getTintedImg(img, tintColor, cacheKey, (img as any).width, (img as any).height);
            ctx.drawImage(tintedImg, srcX, srcY, frameWidth, frameHeight, finalDrawX, finalDrawY, finalDrawW, finalDrawH);
        } else {
            ctx.drawImage(img, srcX, srcY, frameWidth, frameHeight, finalDrawX, finalDrawY, finalDrawW, finalDrawH);
        }
        ctx.restore();
    }

    private getGlowQuality(): 'DISABLED' | 'NORMAL' | 'ULTRA' {
        try {
            const saved = localStorage.getItem("dd2d_settings");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.auraGlowQuality) return parsed.auraGlowQuality;
                if (parsed.glowQuality) return parsed.glowQuality;
                if (parsed.graphicsQuality === 'VERY_LOW' || parsed.graphicsQuality === 'LOW') return 'DISABLED';
                if (parsed.graphicsQuality === 'ULTRA') return 'ULTRA';
            }
        } catch (e) {}
        return 'NORMAL';
    }

    public drawPlayerAura(
        ctx: CanvasRenderingContext2D,
        character: CharacterData,
        state: PlayerState,
        x: number,
        y: number,
        width: number,
        height: number,
        facingRight: boolean,
        sparkingActive: boolean = false,
        auraHScale?: number,
        auraWScale?: number,
        forceAuraConfigKey?: string
    ) {
        const actualHScale = auraHScale !== undefined ? auraHScale : 1.0;
        const actualWScale = auraWScale !== undefined ? auraWScale : 1.0;

        // Render Aura (ONLY occurs when charging/loading ki and its dissipation transition, or if forced by editor, or specified on animation)
        const animData = character.spriteConfig?.animations[state];
        const hasAnimAuraConfigKey = animData && (animData as any).auraConfigKey;
        
        const stateStr = String(state).toLowerCase();
        const isChargingOrAuraState = 
            state === PlayerState.CHARGING ||
            state === PlayerState.CHARGE_START ||
            state === PlayerState.CHARGE_END ||
            stateStr.includes("charge") ||
            stateStr.includes("carregando") ||
            stateStr.includes("sparking") ||
            stateStr.includes("aura") ||
            stateStr.includes("transform") ||
            stateStr.includes("power_up");

        const isAuraEligibleState = 
            !!forceAuraConfigKey ||
            isChargingOrAuraState ||
            sparkingActive ||
            !!hasAnimAuraConfigKey;

        if (!isAuraEligibleState) return;

        const auraMgr = AuraConfigKeyManager.getInstance();

        // Resolve Aura configuration
        let auraConfig = forceAuraConfigKey ? auraMgr.getAuraConfig(forceAuraConfigKey) : null;
        
        // 1. Check if specific animation frame config has custom overwrite configured
        if (!auraConfig && animData && (animData as any).auraConfigKey) {
            const animAuraKey = (animData as any).auraConfigKey;
            const charSpecificKey = `${animAuraKey}_${character.id.toUpperCase()}`;
            auraConfig = auraMgr.getAuraConfig(charSpecificKey) || auraMgr.getAuraConfig(animAuraKey);
        }
        
        // 1b. Fallback for CHARGE_START, CHARGING, CHARGE_END and aura dissipation
        const isChargingRelatedOrDissipating = 
            state === PlayerState.CHARGE_START || 
            state === PlayerState.CHARGING || 
            state === PlayerState.CHARGE_END ||
            (actualHScale > 0 && !sparkingActive);

        if (!auraConfig && isChargingRelatedOrDissipating) {
            const chargingAnimData = character.spriteConfig?.animations[PlayerState.CHARGING];
            if (chargingAnimData && (chargingAnimData as any).auraConfigKey) {
                const chargingAnimAuraKey = (chargingAnimData as any).auraConfigKey;
                const charSpecificKey = `${chargingAnimAuraKey}_${character.id.toUpperCase()}`;
                auraConfig = auraMgr.getAuraConfig(charSpecificKey) || auraMgr.getAuraConfig(chargingAnimAuraKey);
            }
            if (!auraConfig) {
                auraConfig = auraMgr.getAuraConfigForAnimation(character.id, PlayerState.CHARGING);
            }
        }
        
        if (!auraConfig) auraConfig = auraMgr.getAuraConfigForAnimation(character.id, state);
        if (!auraConfig && sparkingActive) auraConfig = auraMgr.getAuraConfigForCharacterSparking(character.id);
        if (!auraConfig) auraConfig = auraMgr.getAuraConfigForCharacterDefault(character.id);

        let auraUrlKey = sparkingActive ? "AURA_007" : "";
        if (!auraUrlKey) {
            const defaultUrl = getCharacterAuraUrl(character.id);
            auraUrlKey = Object.keys(AURA_GIFS).find(k => (AURA_GIFS as any)[k] === defaultUrl) || "AURA_001";
        }

        if (!auraConfig && auraUrlKey) {
            // Priority: look for specific configured key first, then by animation, then fallback to base URL key
            auraConfig = auraMgr.getAuraConfigForAnimation(character.id, state) || 
                         auraMgr.getAuraConfig(auraUrlKey);
        }

        let auraUrl = sparkingActive ? AURA_GIFS.AURA_007 : getCharacterAuraUrl(character.id);

        if (auraConfig) {
            const rawSprite = (auraConfig as any).auraSprite || (auraConfig as any).auraAnimation || (auraConfig as any).auraUrl;
            const rawBaseId = auraConfig.baseAuraId;

            // 1. Direct file path or URL in sprite/animation/url properties
            if (rawSprite && (typeof rawSprite === "string") && (rawSprite.startsWith("http") || rawSprite.startsWith("/") || rawSprite.endsWith(".gif"))) {
                auraUrl = rawSprite;
            }
            // 2. Exact match key in DEFAULT_AURAS for rawSprite
            else if (rawSprite && DEFAULT_AURAS[rawSprite as keyof typeof DEFAULT_AURAS]) {
                auraUrl = DEFAULT_AURAS[rawSprite as keyof typeof DEFAULT_AURAS];
            }
            // 3. Direct file path or URL in baseAuraId
            else if (rawBaseId && (typeof rawBaseId === "string") && (rawBaseId.startsWith("http") || rawBaseId.startsWith("/") || rawBaseId.endsWith(".gif"))) {
                auraUrl = rawBaseId;
            }
            // 4. Exact match key in DEFAULT_AURAS for baseAuraId
            else if (rawBaseId && DEFAULT_AURAS[rawBaseId as keyof typeof DEFAULT_AURAS]) {
                auraUrl = DEFAULT_AURAS[rawBaseId as keyof typeof DEFAULT_AURAS];
            }
            // 5. Fallback mapping for standard alias names or numeric aura keys (e.g. AURA_008, SSJ, BLUE, etc.)
            else if (rawBaseId || rawSprite) {
                const targetKey = (rawBaseId || rawSprite || "").trim();
                const AURA_MAP: Record<string, string> = {
                    BASE_LIGHT: "AURA_001", SSJ: "AURA_002", BLUE: "AURA_003", ROSE: "AURA_004", UI: "AURA_005", PURPLE: "AURA_006", SURGE_RED: "AURA_007"
                };
                let mappedKey = AURA_MAP[targetKey] || targetKey;
                // DO NOT perform digit matching if targetKey is a CHAVE_ key!
                if (!mappedKey.startsWith("CHAVE_")) {
                    const numMatch = mappedKey.match(/\d+/);
                    if (numMatch) {
                        const paddedKey = `AURA_${String(parseInt(numMatch[0], 10)).padStart(3, '0')}`;
                        if (DEFAULT_AURAS[paddedKey as keyof typeof DEFAULT_AURAS]) {
                            mappedKey = paddedKey;
                        }
                    }
                }
                if (DEFAULT_AURAS[mappedKey as keyof typeof DEFAULT_AURAS]) {
                    auraUrl = DEFAULT_AURAS[mappedKey as keyof typeof DEFAULT_AURAS];
                } else if (targetKey.startsWith("http") || targetKey.startsWith("/") || targetKey.endsWith(".gif")) {
                    auraUrl = targetKey;
                }
            }
        }

        const totalFrames = this.getGifFrameCount(auraUrl);
        if (totalFrames === 0) {
            this.loadGif(auraUrl);
            return;
        }

        const currentAuraFrame = Math.floor(Date.now() / 80) % totalFrames;
        let auraImg = this.getGifFrame(auraUrl, currentAuraFrame);
        
        if (auraImg) {
            const configScaleX = auraConfig && (auraConfig as any).auraScaleX !== undefined ? Number((auraConfig as any).auraScaleX) : 1.0;
            const configScaleY = auraConfig && (auraConfig as any).auraScaleY !== undefined ? Number((auraConfig as any).auraScaleY) : 1.0;

            const baseOpacity = auraConfig?.auraOpacity !== undefined ? Number(auraConfig.auraOpacity) : 0.85;

            // Clamped scales & smooth transition easing curve (sine ease)
            const hScaleClamped = Math.min(1.3, Math.max(0, actualHScale));
            const wScaleClamped = Math.min(1.3, Math.max(0, actualWScale));
            
            // Smooth transition progress (0.0 to 1.0)
            const scaleProgress = Math.min(1.0, hScaleClamped);
            const transitionEase = Math.sin((scaleProgress * Math.PI) / 2);

            // Dynamic Ki Energy Pulse (vibrant high-frequency vibration during charging/sparking)
            const now = Date.now();
            const pulseFreq = sparkingActive ? 45 : 65;
            const pulseAmt = (Math.sin(now / pulseFreq) * 0.035 + Math.cos(now / (pulseFreq * 0.75)) * 0.02) * transitionEase;
            const pulseH = 1.0 + (transitionEase > 0.2 ? pulseAmt : 0);
            const pulseW = 1.0 + (transitionEase > 0.2 ? (pulseAmt * 0.75) : 0);

            // Upward dissipation / ignition surge float offset
            const floatUp = (1.0 - transitionEase) * 18 * (scaleProgress < 1.0 ? 1 : 0);

            const auraW = width * 1.35 * wScaleClamped * configScaleX * pulseW;
            const auraH = height * 1.35 * hScaleClamped * configScaleY * pulseH;
            let auraX = x + width / 2 - auraW / 2;
            let auraY = (y + height) - auraH - floatUp;

            if (auraConfig) {
                const offsetO_X = Number(auraConfig.auraOffsetX || 0);
                const offsetO_Y = Number(auraConfig.auraOffsetY || 0);
                auraX += facingRight ? offsetO_X : -offsetO_X;
                auraY += offsetO_Y;
            }

            // Transition opacity modulation so aura smoothly fades in/out without hard pops
            const transitionOpacity = Math.pow(transitionEase, 0.85);
            const effectiveOpacity = Math.min(1.0, Math.max(0.01, baseOpacity * transitionOpacity));

            // Prepare processed image with all effects baked in (Tinting + Matrix/Filters)
            const auraColor = (auraConfig && auraConfig.color) ? auraConfig.color : "#ffffff";
            const auraFilters = {
                hueRotate: auraConfig?.auraHueRotate,
                saturate: auraConfig?.auraSaturate,
                brightness: auraConfig?.auraBrightness,
                contrast: auraConfig?.auraContrast
            };
            
            const effectCacheKey = `aura_full_${auraConfig?.id || auraUrl}_${currentAuraFrame}`;
            auraImg = this.getCachedEffectImg(
                auraImg, 
                auraColor, 
                effectCacheKey, 
                auraFilters, 
                (auraImg as any).width, 
                (auraImg as any).height
            );

            const glowQuality = this.getGlowQuality();
            const isEditorMode = !!forceAuraConfigKey;
            const hasCustomGlow = !!(auraConfig && (
                (auraConfig.glowColor && auraConfig.glowColor.trim() !== "") ||
                auraConfig.glowRadius !== undefined ||
                auraConfig.glowBlur !== undefined ||
                auraConfig.glowIntensity !== undefined
            ));

            // Determine glow color
            let glowColor = (auraConfig && auraConfig.glowColor && auraConfig.glowColor.trim() !== "")
                ? auraConfig.glowColor
                : (auraConfig && auraConfig.color && auraConfig.color !== "#ffffff")
                    ? auraConfig.color
                    : (sparkingActive ? "#fbbf24" : "#3b82f6");

            if (glowColor && auraFilters && !(auraConfig && auraConfig.glowColor)) {
                glowColor = this.getTransformedColor(glowColor, auraFilters);
            }

            // PASS 0: GROUND ENERGY IGNITION SHOCKWAVE (during transition surge)
            if (scaleProgress > 0.1 && scaleProgress < 0.98 && effectiveOpacity > 0.1) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const flareR = (auraW * 0.4) * (1.0 + (1.0 - scaleProgress) * 0.5);
                const flareY = y + height - 4;
                const flareX = x + width / 2;
                const grad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareR);
                grad.addColorStop(0, glowColor);
                grad.addColorStop(0.5, glowColor);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.globalAlpha = effectiveOpacity * (1.0 - scaleProgress) * 0.6;
                ctx.beginPath();
                ctx.ellipse(flareX, flareY, flareR, flareR * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // PASS 1: VIBRANT GLOW OUTLINE PASS
            if (glowQuality !== 'DISABLED' || isEditorMode || hasCustomGlow) {
                GlowOptimizer.getInstance().registerGlowObject();
                const isUltra = glowQuality === 'ULTRA';

                const defaultBlur = isUltra ? 28 : 18;
                const baseRadius = (auraConfig && (auraConfig.glowRadius !== undefined ? auraConfig.glowRadius : auraConfig.glowBlur)) !== undefined
                    ? (auraConfig.glowRadius ?? auraConfig.glowBlur!)
                    : defaultBlur;
                const intensity = (auraConfig && auraConfig.glowIntensity !== undefined) ? auraConfig.glowIntensity : 1.0;
                
                // Add dynamic pulse to glow blur during charging/sparking
                const blurPulse = transitionEase > 0.3 ? Math.sin(now / 50) * 4 * intensity : 0;
                const reqBlur = Math.max(1, Math.round((baseRadius + blurPulse) * intensity));
                const glowBlur = GlowOptimizer.getInstance().getOptimizedBlur(reqBlur, glowQuality);

                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = glowBlur;
                ctx.globalAlpha = Math.min(1.0, effectiveOpacity * Math.min(1.5, 0.75 + intensity * 0.25));

                const allowExtra = isEditorMode || GlowOptimizer.getInstance().allowExtraPass(glowQuality);
                const passCount = ((isUltra && allowExtra) || isEditorMode || (hasCustomGlow && allowExtra) || intensity > 1.2) ? 2 : 1;
                
                for (let pIdx = 0; pIdx < passCount; pIdx++) {
                    if (pIdx === 1) {
                        ctx.shadowBlur = Math.round(glowBlur * 1.5);
                    }
                    if (!facingRight) {
                        ctx.save();
                        ctx.translate(auraX + auraW / 2, auraY + auraH / 2);
                        ctx.scale(-1, 1);
                        ctx.drawImage(auraImg as any, -auraW / 2, -auraH / 2, auraW, auraH);
                        ctx.restore();
                    } else {
                        ctx.drawImage(auraImg as any, auraX, auraY, auraW, auraH);
                    }
                }
                ctx.restore();
            }

            // PASS 2: INNER AURA PASS
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = effectiveOpacity;

            if (!facingRight) {
                ctx.translate(auraX + auraW / 2, auraY + auraH / 2);
                ctx.scale(-1, 1);
                ctx.drawImage(auraImg as any, -auraW / 2, -auraH / 2, auraW, auraH);
            } else {
                ctx.drawImage(auraImg as any, auraX, auraY, auraW, auraH);
            }
            ctx.restore();
        }
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
        forceAuraConfigKey?: string
    ) {
        if (!character || !character.spriteConfig) return;
        const configScaleX = ((character.spriteConfig as any)?.scaleX ?? (character as any).scale ?? 1.0);
        const configScaleY = ((character.spriteConfig as any)?.scaleY ?? (character as any).scale ?? 1.0);

        const animData = character.spriteConfig.animations?.[state];
        const chargingAnimData = character.spriteConfig.animations?.[PlayerState.CHARGING];
        
        const hasAnimAuraConfigKey = animData && (animData as any).auraConfigKey;
        const stateStr = String(state).toLowerCase();
        const isChargingOrAuraState = 
            state === PlayerState.CHARGING || 
            state === PlayerState.CHARGE_START ||
            state === PlayerState.CHARGE_END ||
            stateStr.includes("charge") ||
            stateStr.includes("carregando") ||
            stateStr.includes("sparking") ||
            stateStr.includes("aura") ||
            stateStr.includes("transform") ||
            stateStr.includes("power_up");

        const isAuraEligibleState = 
            !!forceAuraConfigKey ||
            isChargingOrAuraState ||
            sparkingActive ||
            !!hasAnimAuraConfigKey;

        if (!isAuraEligibleState) return;

        const auraMgr = AuraConfigKeyManager.getInstance();
        let auraConfig = forceAuraConfigKey ? auraMgr.getAuraConfig(forceAuraConfigKey) : null;
        if (!auraConfig && animData && (animData as any).auraConfigKey) {
            const animAuraKey = (animData as any).auraConfigKey;
            const charSpecificKey = `${animAuraKey}_${character.id.toUpperCase()}`;
            auraConfig = auraMgr.getAuraConfig(charSpecificKey) || auraMgr.getAuraConfig(animAuraKey);
        }
        if (!auraConfig && (state === PlayerState.TRANSFORM || stateStr.includes("transform")) && chargingAnimData && (chargingAnimData as any).auraConfigKey) {
            const chargingAnimAuraKey = (chargingAnimData as any).auraConfigKey;
            const charSpecificKey = `${chargingAnimAuraKey}_${character.id.toUpperCase()}`;
            auraConfig = auraMgr.getAuraConfig(charSpecificKey) || auraMgr.getAuraConfig(chargingAnimAuraKey);
        }
        if (!auraConfig) auraConfig = auraMgr.getAuraConfigForAnimation(character.id, state);
        if (!auraConfig && sparkingActive) auraConfig = auraMgr.getAuraConfigForCharacterSparking(character.id);
        if (!auraConfig) auraConfig = auraMgr.getAuraConfigForCharacterDefault(character.id);

        let auraUrl = sparkingActive ? AURA_GIFS.AURA_007 : getCharacterAuraUrl(character.id);
        if (auraConfig) {
            const rawBaseId = auraConfig.baseAuraId;
            if (rawBaseId && (DEFAULT_AURAS as any)[rawBaseId]) {
                auraUrl = (DEFAULT_AURAS as any)[rawBaseId];
            } else if (rawBaseId && rawBaseId.startsWith("/")) {
                auraUrl = rawBaseId;
            } else if (rawBaseId && (AURA_GIFS as any)[rawBaseId]) {
                auraUrl = (AURA_GIFS as any)[rawBaseId];
            }
        }

        const actualHScale = (scaleH !== undefined && scaleH !== null) ? scaleH : 1.0;
        const actualWScale = (scaleW !== undefined && scaleW !== null) ? scaleW : 1.0;
        const baseOpacity = (auraConfig as any)?.opacity ?? 0.95;

        const hScaleClamped = Math.min(1.3, Math.max(0, actualHScale));
        const wScaleClamped = Math.min(1.3, Math.max(0, actualWScale));
        
        const scaleProgress = Math.min(1.0, hScaleClamped);
        const transitionEase = Math.sin((scaleProgress * Math.PI) / 2);

        const now = Date.now();
        const pulseFreq = sparkingActive ? 45 : 65;
        const pulseAmt = (Math.sin(now / pulseFreq) * 0.035 + Math.cos(now / (pulseFreq * 0.75)) * 0.02) * transitionEase;
        const pulseH = 1.0 + (transitionEase > 0.2 ? pulseAmt : 0);
        const pulseW = 1.0 + (transitionEase > 0.2 ? (pulseAmt * 0.75) : 0);

        const floatUp = (1.0 - transitionEase) * 18 * (scaleProgress < 1.0 ? 1 : 0);

        const auraW = width * 1.35 * wScaleClamped * configScaleX * pulseW;
        const auraH = height * 1.35 * hScaleClamped * configScaleY * pulseH;
        let auraX = x + width / 2 - auraW / 2;
        let auraY = (y + height) - auraH - floatUp;

        if (auraConfig) {
            const offsetO_X = Number(auraConfig.auraOffsetX || 0);
            const offsetO_Y = Number(auraConfig.auraOffsetY || 0);
            auraX += facingRight ? offsetO_X : -offsetO_X;
            auraY += offsetO_Y;
        }

        const transitionOpacity = Math.pow(transitionEase, 0.85);
        const effectiveOpacity = Math.min(1.0, Math.max(0.01, baseOpacity * transitionOpacity));

        const auraFilters = {
            hueRotate: auraConfig?.auraHueRotate,
            saturate: auraConfig?.auraSaturate,
            brightness: auraConfig?.auraBrightness,
            contrast: auraConfig?.auraContrast
        };

        let glowColor = (auraConfig && auraConfig.glowColor && auraConfig.glowColor.trim() !== "")
            ? auraConfig.glowColor
            : (auraConfig && auraConfig.color && auraConfig.color !== "#ffffff")
                ? auraConfig.color
                : (sparkingActive ? "#fbbf24" : "#3b82f6");

        if (glowColor && auraFilters && !(auraConfig && auraConfig.glowColor)) {
            glowColor = this.getTransformedColor(glowColor, auraFilters);
        }

        // CIRCULAR ENERGY PARTICLES CREATED IN FRONT OF CHARACTER (Genkidama energy particle style)
        if (effectiveOpacity > 0.15 && transitionEase > 0.15) {
            const numParticles = sparkingActive ? 18 : 12;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < numParticles; i++) {
                const pSeed = (i * 137 + 17) % 1000;
                const pCycle = ((now * 0.45 + pSeed * 14) % 800) / 800; // 0 to 1
                const pAlpha = Math.sin(pCycle * Math.PI) * effectiveOpacity * 0.95;
                if (pAlpha <= 0.02) continue;
                
                const pXOffset = (Math.sin(pSeed + pCycle * 6) * 0.42) * auraW;
                const px = auraX + auraW / 2 + pXOffset;
                const py = (y + height + 10) - pCycle * (auraH * 1.05);
                const pRadius = 2.5 + (pSeed % 4) * 1.4 + (sparkingActive ? 1.8 : 0);
                const particleColor = (pSeed % 3 === 0) ? '#ffffff' : glowColor;

                ctx.save();
                ctx.globalAlpha = pAlpha;

                // Upward motion trailing tail for rising aura energy particles
                const tailLen = Math.min(22, pCycle * (auraH * 0.22));
                if (tailLen > 2) {
                    const tailY = py + tailLen;
                    const gradTrail = ctx.createLinearGradient(px, py, px, tailY);
                    gradTrail.addColorStop(0, particleColor);
                    gradTrail.addColorStop(1, 'transparent');

                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, tailY);
                    ctx.strokeStyle = gradTrail;
                    ctx.lineWidth = Math.max(1, pRadius * 0.85);
                    ctx.stroke();
                }

                // Soft outer energy radial aura glow (Genkidama energy particle style)
                const auraRadius = pRadius * 2.2;
                const auraGrad = ctx.createRadialGradient(px, py, 0, px, py, auraRadius);
                auraGrad.addColorStop(0, '#ffffff');
                auraGrad.addColorStop(0.3, glowColor);
                auraGrad.addColorStop(0.75, particleColor);
                auraGrad.addColorStop(1, 'transparent');

                ctx.beginPath();
                ctx.arc(px, py, auraRadius, 0, Math.PI * 2);
                ctx.fillStyle = auraGrad;
                ctx.fill();

                // Main vibrant energy core
                ctx.beginPath();
                ctx.arc(px, py, pRadius * 0.85, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();

                // White-hot energy particle center
                ctx.beginPath();
                ctx.arc(px, py, pRadius * 0.45, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                // Micro energy spark rays for larger aura particles
                if (pRadius > 4.2) {
                    ctx.beginPath();
                    const sparkLen = pRadius * 1.5;
                    ctx.moveTo(px - sparkLen, py);
                    ctx.lineTo(px + sparkLen, py);
                    ctx.moveTo(px, py - sparkLen);
                    ctx.lineTo(px, py + sparkLen);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.restore();
            }
            ctx.restore();
        }
    }

    /**
     * Draws aura-style circular energy particles (glowing outer circle + bright white inner core)
     * for beams, genkidamas, beans, and projectiles.
     * Optimized for high performance (60 FPS) without heavy gradient allocations.
     */
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
    ) {
        const {
            x,
            y,
            width,
            height,
            glowColor,
            count = 16,
            facingRight = true,
            isBeam = false,
            isSpherical = false,
            speedScale = 1.0,
            opacity = 1.0,
            rotation = 0
        } = options;

        if (opacity <= 0.02 || count <= 0 || width <= 0) return;

        const mult = this.getParticleMultiplier();
        if (mult <= 0) return;

        const maxAllowed = isBeam ? 24 : 16;
        const adjustedCount = Math.min(maxAllowed, Math.max(1, Math.round(count * Math.min(1.0, mult))));

        const now = Date.now();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (rotation !== 0 && !isSpherical) {
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-x, -y);
        }

        for (let i = 0; i < adjustedCount; i++) {
            const pSeed = (i * 137 + 17) % 1000;
            const pCycle = ((now * 0.45 * speedScale + pSeed * 14) % 800) / 800; // 0 to 1
            const pAlpha = Math.sin(pCycle * Math.PI) * opacity * 0.9;
            if (pAlpha <= 0.02) continue;

            let px = x;
            let py = y;
            let pRadius = 2.2 + (pSeed % 4) * 1.2;
            let customTail: { x: number; y: number } | null = null;

            if (isBeam) {
                const particleType = i % 3;
                const bodyRatio = (((pSeed % 100) / 100 + pCycle * 0.35) % 1.0); // Covers entire beam length (0 = start, 1 = tip)
                const dist = bodyRatio * width;
                px = facingRight ? x + dist : x - dist;

                // Alternate up (-1) and down (+1) movement for particles
                const upDownSign = (i % 2 === 0) ? -1 : 1;

                if (particleType === 0) {
                    // 1. Oscillating body particles moving up and down along the beam shaft from start to tip
                    const verticalWiggle = upDownSign * (Math.sin(pSeed * 0.1 + pCycle * Math.PI * 2) * (height * 0.45) + (pCycle * 16));
                    py = y + verticalWiggle;
                    pRadius = 2.4 + (pSeed % 5) * 1.3;

                    const tailDist = Math.min(20, dist * 0.3);
                    customTail = {
                        x: facingRight ? px - tailDist : px + tailDist,
                        y: py - (upDownSign * 3)
                    };
                } else if (particleType === 1) {
                    // 2. Vertical energy eruption rising UP or going DOWN from anywhere on the beam body
                    const burstY = upDownSign * (height * 0.2 + pCycle * (25 + (pSeed % 28)));
                    py = y + burstY;
                    pRadius = 2.2 + (pSeed % 4) * 1.2;

                    customTail = {
                        x: px,
                        y: y + upDownSign * (height * 0.1)
                    };
                } else {
                    // 3. Tip and front wind dispersal floating up/down into atmosphere
                    const tipRatio = 0.6 + ((pSeed % 40) / 100) + pCycle * 0.4;
                    const tipDist = Math.min(width, tipRatio * width);
                    px = facingRight ? x + tipDist : x - tipDist;

                    const floatOffset = upDownSign * (Math.sin(pCycle * Math.PI) * (30 + (pSeed % 35)) + pCycle * 20);
                    py = y + floatOffset;
                    pRadius = 2.6 + (pSeed % 5) * 1.4;

                    const prevDist = Math.max(0, tipDist - 15);
                    const prevPx = facingRight ? x + prevDist : x - prevDist;
                    customTail = { x: prevPx, y: py - (upDownSign * 5) };
                }
            } else if (isSpherical) {
                // Spherical energy (Genkidama/Orbs) orbiting radially around center
                const angle = ((pSeed % 1000) / 1000) * Math.PI * 2 + pCycle * Math.PI * 2;
                const radiusDist = (0.25 + pCycle * 0.7) * (width / 2);
                px = x + Math.cos(angle) * radiusDist;
                py = y + Math.sin(angle) * radiusDist - pCycle * 14;
                pRadius = 2.8 + (pSeed % 5) * 1.5;
            } else {
                // Traveling projectile / Ki Blast / Bean particles trailing around core
                const dirSign = facingRight ? -1 : 1;
                const trailOffset = (pCycle - 0.5) * (width * 1.1);
                const pXOffset = (Math.sin(pSeed + pCycle * 6) * 0.35) * width;
                const pYOffset = (Math.cos(pSeed * 2 + pCycle * 5) * 0.35) * height;
                px = x + dirSign * trailOffset + pXOffset;
                py = y + pYOffset;
                pRadius = 2.2 + (pSeed % 4) * 1.2;
            }

            const particleColor = (pSeed % 3 === 0) ? '#ffffff' : glowColor;

            // Trailing motion tail
            if (isBeam && customTail) {
                const tailX = customTail.x;
                const tailY = customTail.y;
                const tailLen = Math.hypot(px - tailX, py - tailY);

                if (tailLen > 2) {
                    ctx.globalAlpha = pAlpha * 0.55;
                    ctx.strokeStyle = particleColor;
                    ctx.lineWidth = Math.max(1, pRadius * 0.75);
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(tailX, tailY);
                    ctx.stroke();
                }
            }

            // Outer soft energy aura glow (Ultra-fast arc fill with 'lighter' mode)
            const auraRadius = pRadius * 2.2;
            ctx.globalAlpha = pAlpha * 0.32;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(px, py, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            // Main vibrant energy core
            ctx.globalAlpha = pAlpha * 0.85;
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(px, py, pRadius, 0, Math.PI * 2);
            ctx.fill();

            // White-hot energy particle center
            ctx.globalAlpha = pAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, pRadius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Micro energy spark rays for larger particles
            if (pRadius > 4.2) {
                ctx.globalAlpha = pAlpha * 0.75;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const sparkLen = pRadius * 1.4;
                ctx.moveTo(px - sparkLen, py);
                ctx.lineTo(px + sparkLen, py);
                ctx.moveTo(px, py - sparkLen);
                ctx.lineTo(px, py + sparkLen);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * Draws pixel/cube voxel disintegration dispersion particles when entering destruction mode.
     * Inspired by Thanos-snap pixel disintegration (cubes & pixel dust breaking off from tip to origin).
     */
    public drawBeamDispersionParticles(
        ctx: CanvasRenderingContext2D,
        options: {
            x: number; // Front/dissolve X position in world space
            y: number; // Center Y in world space
            height: number; // Beam height
            glowColor: string; // Beam color/glow
            shrinkProgress: number; // 0.0 (tip) to 1.0 (origin)
            facingRight?: boolean;
            rotation?: number;
            count?: number;
        }
    ) {
        const {
            x,
            y,
            height,
            glowColor,
            shrinkProgress,
            facingRight = true,
            rotation = 0,
            count = 35
        } = options;

        if (shrinkProgress <= 0.001 || shrinkProgress >= 1.0) return;

        const mult = this.getParticleMultiplier();
        if (mult <= 0) return;

        const adjustedCount = Math.min(25, Math.max(1, Math.round(count * Math.min(1.0, mult))));

        const now = Date.now();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (rotation !== 0) {
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-x, -y);
        }

        const dirSign = facingRight ? 1 : -1;

        // 1. Energy Dissolution Line Front
        const fontH = height * 0.7;
        for (let py = -fontH / 2; py <= fontH / 2; py += 12) {
            const seed = (Math.floor(py) * 31 + Math.floor(now / 40)) % 1000;
            const orbX = x + ((seed % 14) - 7);
            const orbY = y + py;
            const orbSize = 4 + (seed % 5);
            const particleColor = (seed % 3 === 0) ? '#ffffff' : glowColor;

            ctx.globalAlpha = 0.35;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbSize * 2.0, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.85;
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbSize * 0.85, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Swarm of Aura Energy Particles dispersing organically with Genkidama dispersion physics
        for (let i = 0; i < adjustedCount; i++) {
            const seed = (i * 173 + Math.floor(shrinkProgress * 60)) % 1000;
            const cycle = ((now * 0.45 + seed * 19) % 700) / 700; // 0 to 1
            
            const fadeIn = Math.min(1.0, cycle * 5.0);
            const fadeOut = Math.max(0.0, 1.0 - cycle);
            const alpha = fadeIn * fadeOut * Math.sin(shrinkProgress * Math.PI) * 0.95;
            if (alpha <= 0.02) continue;

            const startX = x + ((seed % 22) - 11);
            const startY = y + (((seed % 100) / 100 - 0.5) * height * 0.9);

            // Genkidama particle dispersion formula: scattering outward and upward in arc
            const angle = ((seed % 100) / 100) * Math.PI * 2;
            const speed = 3 + (seed % 5);
            const vx = Math.cos(angle) * speed;
            const vy = -2.5 - (seed % 4);

            const px = startX + vx * (cycle * 25);
            const py = startY + vy * (cycle * 25);

            const orbSize = Math.max(2, (3.2 + (seed % 5) * 1.5) * (1.0 - cycle * 0.4));
            const particleColor = (seed % 3 === 0) ? '#ffffff' : glowColor;

            // Aura particle rendering (soft aura glow + core + white center)
            const auraRadius = orbSize * 2.0;
            ctx.globalAlpha = alpha * 0.35;
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(px, py, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(px, py, orbSize * 0.85, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px, py, orbSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Micro-Energy Dust Specks (Swirling micro energy specks)
        const microCount = Math.round(count * 0.4);
        for (let k = 0; k < microCount; k++) {
            const mSeed = (k * 241 + Math.floor(shrinkProgress * 80)) % 1000;
            const mCycle = ((now * 0.38 + mSeed * 29) % 800) / 800;
            
            const mFadeIn = Math.min(1.0, mCycle * 4.0);
            const mFadeOut = Math.max(0.0, 1.0 - mCycle);
            const mAlpha = mFadeIn * mFadeOut * 0.85;
            if (mAlpha <= 0.03) continue;

            const mTurbulenceX = Math.sin(mCycle * 8 + mSeed) * (14 + (mSeed % 10));
            const mTurbulenceY = Math.cos(mCycle * 6 + mSeed * 1.7) * (10 + (mSeed % 8));

            const mStartX = x + ((mSeed % 26) - 13);
            const mStartY = y + (((mSeed % 100) / 100 - 0.5) * height * 1.0);

            const mArcDist = (mCycle * 85 + Math.pow(mCycle, 1.25) * 105) * (0.65 + (mSeed % 5) * 0.2);
            const mArcPeak = 40 + (mSeed % 50);
            const mUpwardFloat = mCycle * (45 + (mSeed % 55));

            const mDx = dirSign * mArcDist + mTurbulenceX * mCycle;
            const mDy = - (Math.sin(mCycle * Math.PI * 0.85) * mArcPeak + mUpwardFloat) + mTurbulenceY * mCycle;

            const mpx = mStartX + mDx;
            const mpy = mStartY + mDy;
            const mSize = 1.8 + (mSeed % 3);
            const mColor = (mSeed % 3 === 0) ? '#ffffff' : glowColor;

            ctx.save();
            ctx.globalAlpha = mAlpha;

            // Outer soft energy radial aura glow
            const mAuraRadius = mSize * 2.2;
            const mGrad = ctx.createRadialGradient(mpx, mpy, 0, mpx, mpy, mAuraRadius);
            mGrad.addColorStop(0, '#ffffff');
            mGrad.addColorStop(0.3, glowColor);
            mGrad.addColorStop(0.75, mColor);
            mGrad.addColorStop(1, 'transparent');

            ctx.beginPath();
            ctx.arc(mpx, mpy, mAuraRadius, 0, Math.PI * 2);
            ctx.fillStyle = mGrad;
            ctx.fill();

            // Main vibrant energy core
            ctx.beginPath();
            ctx.arc(mpx, mpy, mSize * 0.85, 0, Math.PI * 2);
            ctx.fillStyle = mColor;
            ctx.fill();

            // White-hot energy particle center
            ctx.beginPath();
            ctx.arc(mpx, mpy, mSize * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.restore();
        }

        // 4. Electric energy arcs crackling at disintegration edge x
        const numSparks = 4 + (Math.floor(now / 50) % 3);
        for (let j = 0; j < numSparks; j++) {
            const sparkSeed = (j * 233 + Math.floor(now / 30)) % 1000;
            const sparkYOff = ((sparkSeed % 100) / 100 - 0.5) * height * 1.0;
            const sparkXOff = (sparkSeed % 16) - 8;

            ctx.beginPath();
            ctx.moveTo(x + sparkXOff, y + sparkYOff);
            const midX = x + sparkXOff + ((sparkSeed % 14) - 7);
            const midY = y + sparkYOff - (10 + (sparkSeed % 12));
            const endX = midX + ((sparkSeed % 12) - 6);
            const endY = midY - (8 + (sparkSeed % 10));

            ctx.lineTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = (j % 2 === 0) ? '#ffffff' : glowColor;
            ctx.lineWidth = 1.6 + (sparkSeed % 2) * 0.8;
            ctx.globalAlpha = 0.85;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10;
            ctx.stroke();
        }

        ctx.restore();
    }

    public drawPlayer(
        ctx: CanvasRenderingContext2D, 
        character: CharacterData, 
        state: PlayerState, 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        facingRight: boolean, 
        animFrame: number, 
        isStunned: boolean,
        comboType?: 'NONE' | 'BURST' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SPECIAL' | 'SPECIAL_2' | 'SPECIAL_3' | 'SPECIAL_4' | 'SUPER_DASH' | 'DRAGON_RUSH' | 'KI_BLAST' | 'TAG_CLASH',
        comboStep?: number,
        ataque?: boolean,
        this_ultPhase?: number,
        this_nextTransformId?: string,
        attackTimer?: number,
        ultType: number = 1,
        isGrounded: boolean = true,
        isDetransforming: boolean = false,
        isShadow: boolean = false,
        isKOTag: boolean = false,
        sparkingActive: boolean = false,
        superDashActive: boolean = false,
        auraHScale?: number,
        auraWScale?: number,
        wasCrouching: boolean = false,
        stunTimer: number = 0,
        animFinished: boolean = false,
        customSubphase?: number,
        phasedMoveAnim?: string,
        lastState?: PlayerState,
        superDashPhase?: number
    ) {
        const config = character.spriteConfig;
        if (!config || !config.animations) return;

        // Optimization: Cache animation key resolution
        const cacheKey = `${character.id}_${state}_${comboType}_${comboStep}_${ataque}_${this_ultPhase}_${this_nextTransformId}_${attackTimer}_${ultType}_${isGrounded}_${isDetransforming}_${isKOTag}_${wasCrouching}_${stunTimer}_${animFinished}_${customSubphase}_${phasedMoveAnim}_${lastState}_${superDashPhase}`;
        let animKey = this.animKeyCache.get(cacheKey);
        
        if (!animKey) {
            animKey = resolveAnimationKey(character.id, state, comboType, comboStep, ataque, this_ultPhase, this_nextTransformId, attackTimer, ultType, isGrounded, isDetransforming, isKOTag, config, wasCrouching, stunTimer, superDashPhase, animFinished, customSubphase, phasedMoveAnim, lastState);
            this.animKeyCache.set(cacheKey, animKey);
            
            // Limit cache size to prevent memory leaks
            if (this.animKeyCache.size > 500) {
                const firstKey = this.animKeyCache.keys().next().value;
                if (firstKey) this.animKeyCache.delete(firstKey);
            }
        }

        let animToDraw = (animKey && config.animations[animKey]) ||
                         (animKey && config.animations[animKey.toLowerCase()]) ||
                         (animKey && config.animations[animKey.toUpperCase()]) ||
                         (state && config.animations[state as string]) || 
                         (state && config.animations[(state as string).toLowerCase()]) ||
                         (state && config.animations[(state as string).toUpperCase()]);
        if (!animToDraw && animKey) {
            animToDraw = config.animations[animKey.toLowerCase()] || config.animations[animKey.toUpperCase()];
        }
        
        // Fallback logic (optimized)
        if (!animToDraw) {
            if (state === PlayerState.TAG_IN && !isKOTag) {
                animToDraw = config.animations[PlayerState.DASHING] || config.animations[PlayerState.RUNNING];
            } else if (state === PlayerState.SUPER_DASH) {
                const currentPhase = superDashPhase ?? ((attackTimer || 0) > 0 ? 1 : 2);
                if (currentPhase === 1) {
                  animToDraw = config.animations["SUPER_DASH_1"] || config.animations["super_dash_1"] || config.animations[PlayerState.DASH_START] || config.animations[PlayerState.SUPER_DASH];
                } else {
                  animToDraw = config.animations["SUPER_DASH_2"] || config.animations["super_dash_2"] || config.animations[PlayerState.DASHING] || config.animations[PlayerState.SUPER_DASH];
                }
            } else if (state === PlayerState.DRAGON_DASH_FOLLOW) {
                animToDraw = config.animations["dragon_rush_3"] || config.animations["DRAGON_RUSH_3"] || config.animations[PlayerState.DRAGON_DASH_FOLLOW];
            } else if (state === PlayerState.DRAGON_COMBO) {
                animToDraw = (comboStep === 1 ? config.animations["dragon_rush_3"] : config.animations["dragon_rush_2"]) || config.animations["DRAGON_RUSH_2"] || config.animations[PlayerState.DRAGON_COMBO];
            } else if (state === PlayerState.DRAGON_RUSH) {
                animToDraw = config.animations["dragon_rush_1"] || config.animations["DRAGON_RUSH_1"] || config.animations[PlayerState.DRAGON_RUSH];
            } else if (state === PlayerState.DASHING) {
                animToDraw = config.animations[PlayerState.RUNNING];
            } else if (state === PlayerState.TRANSFORM) {
                animToDraw = config.animations[PlayerState.TRANSFORM] || config.animations[PlayerState.CHARGE_START] || config.animations[PlayerState.CHARGING];
            } else if (state === PlayerState.LANDING) {
                animToDraw = config.animations[PlayerState.CROUCH] || config.animations[PlayerState.IDLE];
            }
            
            if (!animToDraw) animToDraw = config.animations[PlayerState.ATTACKING] || config.animations[PlayerState.IDLE];
        }

        if (!animToDraw) return;

        if (isShadow) {
            ctx.save();
            ctx.filter = 'brightness(0)';
            ctx.globalAlpha = ctx.globalAlpha * 0.5; // Slightly lighter shadows
            this.drawFrame(ctx, animToDraw, animFrame, x, y, width, height, config.defaultScale, facingRight);
            ctx.restore();
        } else if (isStunned && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.save();
            ctx.filter = 'brightness(2) contrast(1.2) saturate(2)';
            this.drawFrame(ctx, animToDraw, animFrame, x, y, width, height, config.defaultScale, facingRight);
            ctx.restore();
        } else {
            this.drawFrame(ctx, animToDraw, animFrame, x, y, width, height, config.defaultScale, facingRight);
        }
    }

    private applyRarityGlow(ctx: CanvasRenderingContext2D, rarity: RarityTier, x: number, y: number, w: number, h: number) {
        return; // Circle below characters removed
    }

    // --- 10+ New Animation Utility Functions ---

    public drawHitSpark(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string = '#ffffff') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color.startsWith('#') ? color + '80' : color; // simple alpha
        ctx.fill();
        ctx.restore();
    }

    public drawAura(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, intensity: number) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height/2, width/1.5, height * 0.8, 0, 0, Math.PI * 2);
        
        let c = color;
        if (c.startsWith('#')) {
            const r = parseInt(c.slice(1,3), 16) || 255;
            const g = parseInt(c.slice(3,5), 16) || 255;
            const b = parseInt(c.slice(5,7), 16) || 255;
            c = `rgba(${r}, ${g}, ${b}, 1)`;
        }
        
        const outerRadius = height * 0.8;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height) || outerRadius <= 0) {
            ctx.restore();
            return;
        }

        const gradient = ctx.createRadialGradient(x + width/2, y + height/2, 0, x + width/2, y + height/2, outerRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.8})`);
        gradient.addColorStop(0.5, c.replace('1)', `${intensity * 0.5})`));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    public drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, scale: number = 1) {
        ctx.save();
        const cx = x + width / 2;
        const cy = y;
        const rx = (width / 1.5) * scale;
        const ry = (width / 6) * scale;
        if (rx > 0 && ry > 0) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            // Replaced CSS CPU blur(4px) with hardware-accelerated radial gradient for buttery-smooth performance
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
            gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        ctx.restore();
    }

    public drawSpeedLines(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, facingRight: boolean, count: number = 5) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const dirX = facingRight ? -1 : 1;
        for (let i = 0; i < count; i++) {
            const lineY = y + Math.random() * height;
            const lineX = x + width/2 + (Math.random() * 40 * -dirX);
            const length = 20 + Math.random() * 40;
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX + (length * dirX), lineY);
        }
        // ctx.stroke();
        ctx.restore();
    }

    public applyMotionBlur(ctx: CanvasRenderingContext2D, blurAmount: number) {
        if (blurAmount > 0) {
            ctx.filter = `blur(${blurAmount}px)`;
        } else {
            ctx.filter = 'none';
        }
    }

    public clearCache() {
        // Encerra cada ImageBitmap individual para liberar os buffers de textura da GPU nativa do Android
        this.gifCache.forEach(bitmaps => {
            bitmaps.forEach(bitmap => {
                if (bitmap && typeof bitmap.close === 'function') {
                    try {
                        bitmap.close();
                    } catch (e) {
                        // ignore error
                    }
                }
            });
        });
        this.textureCache.clear();
        this.gifCache.clear();
        this.gifDelays.clear();
        this.blobUrlMap.clear();
        CacheService.clearMemoryCache();
        console.log('AnimationManager: Caches de animações e Bitmaps limpos e desalocados da GPU nativa.');
    }

    public getLoadedGifCount(): number {
        return this.gifCache.size;
    }

    public getLoadedTextureCount(): number {
        return this.textureCache.size;
    }

    public drawTeleportTrail(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.fillRect(x - 20, y, width, height);
        ctx.fillRect(x + 20, y, width, height);
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    public drawNimbusCloud(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, facingRight: boolean = true) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        // ctx.shadowColor = '#fbbf24';
        // ctx.shadowBlur = 15;
        ctx.fillStyle = '#fde68a';

        // Draw fluffy cloud shape
        ctx.beginPath();
        const rw = width * 1.5;
        const rh = height * 0.8;
        const cx = x + width / 2;
        const cy = y + height - rh / 2;

        ctx.arc(cx - rw * 0.25, cy, rh * 0.6, 0, Math.PI * 2);
        ctx.arc(cx + rw * 0.25, cy, rh * 0.6, 0, Math.PI * 2);
        ctx.arc(cx, cy - rh * 0.3, rh * 0.7, 0, Math.PI * 2);
        ctx.arc(cx, cy + rh * 0.2, rh * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Core highlight
        // ctx.shadowBlur = 0;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx - rw * 0.15, cy, rh * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + rw * 0.15, cy, rh * 0.4, 0, Math.PI * 2);
        ctx.arc(cx, cy - rh * 0.15, rh * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Speed lines behind it
        const dir = facingRight ? 1 : -1;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - (rw * 0.8 * dir), cy); ctx.lineTo(cx - (rw * 1.5 * dir), cy);
        ctx.moveTo(cx - (rw * 0.6 * dir), cy - rh * 0.3); ctx.lineTo(cx - (rw * 1.2 * dir), cy - rh * 0.4);
        ctx.moveTo(cx - (rw * 0.7 * dir), cy + rh * 0.3); ctx.lineTo(cx - (rw * 1.3 * dir), cy + rh * 0.5);
        // ctx.stroke();

        ctx.restore();
    }

    public drawBlockShield(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, isPerfect: boolean = false) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + radius/2, y + radius/2, radius, 0, Math.PI * 2);
        // ctx.strokeStyle = isPerfect ? 'rgba(100, 255, 255, 0.8)' : 'rgba(200, 200, 200, 0.5)';
        // ctx.lineWidth = isPerfect ? 4 : 2;
        // ctx.stroke();
        ctx.fillStyle = isPerfect ? 'rgba(100, 255, 255, 0.2)' : 'rgba(200, 200, 200, 0.1)';
        ctx.fill();
        ctx.restore();
    }

    public drawScreenFlash(ctx: CanvasRenderingContext2D, screenWidth: number, screenHeight: number, color: string = 'rgba(255,255,255,0.5)') {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        ctx.restore();
    }
}
