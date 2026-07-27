import { AnimationFrameData } from '../types';
import { AnimationManager } from './AnimationManager';

export class FrameManager {
    private static instance: FrameManager;
    private frameCounts: Map<string, number> = new Map();
    private frameDelays: Map<string, number[]> = new Map();

    private constructor() {}

    public static getInstance(): FrameManager {
        if (!FrameManager.instance) {
            FrameManager.instance = new FrameManager();
        }
        return FrameManager.instance;
    }

    /**
     * Registers the frame count and delays for a specific animation URL.
     */
    public registerFrames(url: string, count: number, delays?: number[]) {
        this.frameCounts.set(url, count);
        if (delays) {
            this.frameDelays.set(url, delays);
        }
    }

    /**
     * Retrieves the total frame count for the given animation.
     */
    public getFrameCount(anim: AnimationFrameData | undefined): number {
        if (!anim || !anim.imageUrl) return 1;
        
        // Return from cache if we already registered it
        if (this.frameCounts.has(anim.imageUrl)) {
            const count = this.frameCounts.get(anim.imageUrl)!;
            // Update the anim object's frames property just in case
            anim.frames = count;
            return count;
        }

        // Consult AnimationManager if it's a GIF that hasn't been registered yet
        if (anim.isGif) {
            const count = AnimationManager.getInstance().getGifFrameCount(anim.imageUrl);
            if (count > 0) {
                this.frameCounts.set(anim.imageUrl, count);
                anim.frames = count;
                return count;
            } else {
                 return 999; // Force a large number while loading to prevent finishing early
            }
        }
        
        return anim.frames || 1;
    }

    /**
     * Checks if the animation has finished playing.
     */
    public isAnimationFinished(anim: AnimationFrameData | undefined, currentFrame: number): boolean {
        if (!anim) return true;
        if (anim.loop) return false;
        
        const total = this.getFrameCount(anim);
        
        // Prevent skipped animations for gifs that are still loading
        if (anim.isGif && total === 999) return false;
        
        return currentFrame >= total - 1;
    }

    /**
     * Gets the delay (in game ticks) for a specific frame of an animation.
     */
    public getFrameDelay(anim: AnimationFrameData | undefined, frameIndex: number): number {
        if (!anim || !anim.imageUrl) return -1;
        
        const count = this.getFrameCount(anim);
        // Apply modulo if count is found and valid, which correctly supports looping
        const actualFrameIndex = count > 1 && count !== 999 ? frameIndex % count : frameIndex;
        
        const delays = this.frameDelays.get(anim.imageUrl);
        if (delays && delays[actualFrameIndex] !== undefined) {
             return Math.max(1, Math.round(delays[actualFrameIndex] / 16.666));
        }

        if (anim.isGif) {
            return AnimationManager.getInstance().getGifFrameDelay(anim.imageUrl, actualFrameIndex);
        }

        return -1;
    }
}
