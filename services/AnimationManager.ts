
import { CharacterData, PlayerState, RarityTier, AnimationFrameData, SpriteConfig } from '../types';
import { RARITY_INFO } from '../constants';
import { SHIELD_ANIM_DATA } from '../constants/SpriteDatabase';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { CacheService } from './CacheService';
import { resolveAnimationKey } from './AnimationResolver';
import { AuraConfigKeyManager, DEFAULT_AURAS } from './AuraConfigKeyManager';

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
    // 8-16: Additional high-fidelity auras
    AURA_008: "/Assets/aura/8.gif",
    AURA_009: "/Assets/aura/9.gif",
    AURA_010: "/Assets/aura/10.gif",
    AURA_011: "/Assets/aura/11.gif",
    AURA_012: "/Assets/aura/12.gif",
    AURA_013: "/Assets/aura/13.gif",
    AURA_014: "/Assets/aura/14.gif",
    AURA_015: "/Assets/aura/15.gif",
    AURA_016: "/Assets/aura/16.gif",
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

    /**
     * Obtains a cached tinted and filtered canvas of an image to prevent garbage collection spikes and FPS drops.
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
            if (filters.hueRotate) filterStr += `_h${filters.hueRotate}`;
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
            
            // Apply filters to the intermediate draw if requested
            let canvasFilter = "";
            if (filters) {
                if (filters.hueRotate) canvasFilter += ` hue-rotate(${filters.hueRotate}deg)`;
                if (filters.saturate !== undefined) canvasFilter += ` saturate(${filters.saturate})`;
                if (filters.brightness !== undefined) canvasFilter += ` brightness(${filters.brightness})`;
                if (filters.contrast !== undefined) canvasFilter += ` contrast(${filters.contrast})`;
            }

            if (color !== "#ffffff" && color !== "white" && color) {
                // TINTING LOGIC (Simplified version of getTintedImg logic integrated here)
                // 1. Draw grayscale version
                tempCtx.filter = (canvasFilter + " grayscale(100%) brightness(1.2) contrast(1.1)").trim();
                tempCtx.drawImage(img, 0, 0);
                
                // 2. Multiply with color
                tempCtx.globalCompositeOperation = "multiply";
                tempCtx.fillStyle = color;
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // 3. Mask with original alpha
                tempCtx.globalCompositeOperation = "destination-in";
                tempCtx.filter = "none";
                tempCtx.drawImage(img, 0, 0);
            } else {
                // ONLY FILTER LOGIC
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
        
        let imgW = 0;
        let imgH = 0;
        if (img instanceof ImageBitmap || img instanceof HTMLImageElement || img instanceof HTMLCanvasElement) {
            imgW = img.width || width || 0;
            imgH = img.height || height || 0;
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

        tempCanvas.width = Number(imgW) || 120;
        tempCanvas.height = Number(imgH) || 120;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (tempCtx) {
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
            // This multiplies the color by the grayscale details, beautifully preserving shadows, midtones, and details!
            tempCtx.save();
            tempCtx.globalCompositeOperation = "multiply";
            if (maskCanvas.width > 0 && maskCanvas.height > 0) {
                tempCtx.drawImage(maskCanvas, 0, 0);
            }
            tempCtx.restore();

            // 4. Draw the grayscaled version on top using "screen" composite mode to add back the brilliant
            // white/bright inner core highlights and glowing details of the original sprite.
            tempCtx.save();
            tempCtx.globalCompositeOperation = "screen";
            tempCtx.globalAlpha = 0.45;
            tempCtx.filter = "grayscale(100%) brightness(1.2)";
            tempCtx.drawImage(img, 0, 0);
            tempCtx.restore();

            // 5. Clean up transparent background clipping to fix "black boxes" in multiply/screen blend modes
            tempCtx.save();
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(img, 0, 0);
            tempCtx.restore();
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
        const w = (baseImg as any).width || width || 100;
        const h = (baseImg as any).height || height || 100;

        if (w <= 0 || h <= 0) {
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            this.filterCache.set(fullKey, tempCanvas);
            return tempCanvas;
        }

        tempCanvas.width = Number(w) + 2 * padding;
        tempCanvas.height = Number(h) + 2 * padding;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
            tempCtx.imageSmoothingEnabled = false;
            if (filters.length > 0) {
                tempCtx.filter = filters.join(" ");
            }
            tempCtx.drawImage(baseImg, padding, padding);
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
                
                // Browsers clamp delays <= 20 ms to 100 ms.
                const rawDelay = frame.delay;
                const finalDelay = (!rawDelay || rawDelay <= 20) ? 100 : rawDelay;
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
                if (anim.isGif) {
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
        if (!anim.imageUrl) return;

        let img: CanvasImageSource;
        let srcX = 0;
        let srcY = 0;
        let frameWidth = anim.frameWidth;
        let frameHeight = anim.frameHeight;
        let cacheKey = anim.imageUrl;

        if (anim.isGif) {
            const bitmaps = this.gifCache.get(anim.imageUrl);
            if (!bitmaps || bitmaps.length === 0) {
                this.loadGif(anim.imageUrl);
                return; // Still loading
            }
            
            // Adjust anim frame to match gif frame count if we just want loop
            anim.frames = bitmaps.length;

            const frameIndex = (anim.loop !== false) 
                ? frame % bitmaps.length 
                : Math.min(frame, bitmaps.length - 1);
            
            cacheKey = `${anim.imageUrl}_${frameIndex}`;
            
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
            const tex = this.loadTexture(anim.imageUrl);
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
        
        const isAuraEligibleState = 
            !!forceAuraConfigKey ||
            (state === PlayerState.CHARGING ||
             state === PlayerState.CHARGE_START ||
             state === PlayerState.CHARGE_END) ||
            (actualHScale > 0) ||
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

        if (!auraConfig && auraUrlKey) auraConfig = auraMgr.getAuraConfig(auraUrlKey);

        let auraUrl = sparkingActive ? AURA_GIFS.AURA_007 : getCharacterAuraUrl(character.id);

        if (auraConfig) {
            let baseId = auraConfig.baseAuraId;
            if (baseId) {
                const match = baseId.match(/AURA_\d{3}/i) || baseId.match(/CHAVE_AURA_(\d{3})/i);
                if (match) baseId = match[1] ? `AURA_${match[1]}` : match[0].toUpperCase();
            }

            const AURA_MAP: any = {
                BASE_LIGHT: "AURA_001", SSJ: "AURA_002", BLUE: "AURA_003", ROSE: "AURA_004", UI: "AURA_005", PURPLE: "AURA_006", SURGE_RED: "AURA_007"
            };
            const mappedId = AURA_MAP[baseId || ""] || baseId;
            if (DEFAULT_AURAS[mappedId as keyof typeof DEFAULT_AURAS]) {
                auraUrl = DEFAULT_AURAS[mappedId as keyof typeof DEFAULT_AURAS];
            } else if (baseId && (baseId.startsWith("http"))) {
                auraUrl = baseId;
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
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            
            const configScaleX = auraConfig && (auraConfig as any).auraScaleX !== undefined ? Number((auraConfig as any).auraScaleX) : 1.0;
            const configScaleY = auraConfig && (auraConfig as any).auraScaleY !== undefined ? Number((auraConfig as any).auraScaleY) : 1.0;

            const auraW = width * 1.35 * actualWScale * configScaleX;
            const auraH = height * 1.35 * actualHScale * configScaleY;
            let auraX = x + width / 2 - auraW / 2;
            let auraY = (y + height) - auraH;

            if (auraConfig) {
                const offsetO_X = Number(auraConfig.auraOffsetX || 0);
                const offsetO_Y = Number(auraConfig.auraOffsetY || 0);
                auraX += facingRight ? offsetO_X : -offsetO_X;
                auraY += offsetO_Y;
                ctx.globalAlpha = auraConfig.auraOpacity !== undefined ? Number(auraConfig.auraOpacity) : 0.85;
                
                if (auraConfig.auraHueRotate || auraConfig.auraSaturate || auraConfig.auraBrightness || auraConfig.auraContrast) {
                    ctx.filter = `hue-rotate(${auraConfig.auraHueRotate || 0}deg) saturate(${auraConfig.auraSaturate ?? 1}) brightness(${auraConfig.auraBrightness ?? 1}) contrast(${auraConfig.auraContrast ?? 1})`;
                }
                
                if (auraConfig.color && auraConfig.color !== "#ffffff") {
                    const cacheKey = `aura_${auraConfig.id}_${currentAuraFrame}`;
                    auraImg = this.getTintedImg(auraImg, auraConfig.color, cacheKey, (auraImg as any).width, (auraImg as any).height);
                }
            } else {
                ctx.globalAlpha = 0.85;
            }

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
        lastState?: PlayerState
    ) {
        const config = character.spriteConfig;
        if (!config || !config.animations) return;

        // Optimization: Cache animation key resolution
        const cacheKey = `${character.id}_${state}_${comboType}_${comboStep}_${ataque}_${this_ultPhase}_${this_nextTransformId}_${attackTimer}_${ultType}_${isGrounded}_${isDetransforming}_${isKOTag}_${wasCrouching}_${stunTimer}_${animFinished}_${customSubphase}_${phasedMoveAnim}_${lastState}`;
        let animKey = this.animKeyCache.get(cacheKey);
        
        if (!animKey) {
            animKey = resolveAnimationKey(character.id, state, comboType, comboStep, ataque, this_ultPhase, this_nextTransformId, attackTimer, ultType, isGrounded, isDetransforming, isKOTag, config, wasCrouching, stunTimer, undefined, animFinished, customSubphase, phasedMoveAnim, lastState);
            this.animKeyCache.set(cacheKey, animKey);
            
            // Limit cache size to prevent memory leaks
            if (this.animKeyCache.size > 500) {
                const firstKey = this.animKeyCache.keys().next().value;
                if (firstKey) this.animKeyCache.delete(firstKey);
            }
        }

        let animToDraw = config.animations[animKey];
        
        // Fallback logic (optimized)
        if (!animToDraw) {
            if (state === PlayerState.TAG_IN && !isKOTag) {
                animToDraw = config.animations[PlayerState.DASHING] || config.animations[PlayerState.RUNNING];
            } else if (state === PlayerState.SUPER_DASH) {
                animToDraw = config.animations["SUPER_DASH_1"] || config.animations["super_dash_1"] || config.animations[PlayerState.SUPER_DASH];
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
