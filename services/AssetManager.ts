
import { SPRITE_DB, SHIELD_ANIM_DATA } from '../constants/SpriteDatabase';
import { BASE_CHARACTERS, AVATAR_LIST, BACKGROUND_LIST } from '../personagens/CharacterDatabase';
import { BEAM_DATABASE } from '../constants/BeamDatabase';
import { PROJECTILE_DATABASE } from '../constants/ProjectileDatabase';
import { DEFAULT_EFFECTS } from '../constants/EffectDatabase';
import { AnimationManager } from './AnimationManager';
import { CacheService } from './CacheService';

interface AssetInfo {
    url: string;
    isGif: boolean;
}

export class AssetManager {
    private static instance: AssetManager;
    private loadedCount: number = 0;
    private totalCount: number = 0;

    private constructor() {}

    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    /**
     * Tiered preloading: 
     * 1. Essential (UI, basic FX, beams, projectiles)
     * 2. Background (Remaining characters)
     */
    public async preloadAllAssets(onProgress: (percent: number) => void): Promise<void> {
        const priorityAssets = new Map<string, boolean>();
        const backgroundAssets = new Map<string, boolean>();

        // 1. Gather Essential Assets (UI, Effects, Beams, Projectiles)
        
        // BeamDatabase
        Object.values(BEAM_DATABASE).forEach(family => {
            if (family.start?.imageUrl) priorityAssets.set(family.start.imageUrl, !!family.start.isGif);
            if (family.middle?.imageUrl) priorityAssets.set(family.middle.imageUrl, !!family.middle.isGif);
            if (family.end?.imageUrl) priorityAssets.set(family.end.imageUrl, !!family.end.isGif);
        });

        // ProjectileDatabase
        Object.values(PROJECTILE_DATABASE).forEach(family => {
            if (family.middle?.imageUrl) {
                const isGif = family.middle.imageUrl.toLowerCase().endsWith('.gif') || family.middle.imageUrl.toLowerCase().includes('.gif?') || !!family.middle.isGif;
                priorityAssets.set(family.middle.imageUrl, isGif);
            }
        });

        // EffectDatabase
        Object.values(DEFAULT_EFFECTS).forEach(url => {
            const isGif = url.toLowerCase().endsWith('.gif') || url.toLowerCase().includes('.gif?');
            priorityAssets.set(url, isGif);
        });

        // UI & Common
        if (SHIELD_ANIM_DATA.imageUrl) priorityAssets.set(SHIELD_ANIM_DATA.imageUrl, false);
        AVATAR_LIST.forEach(item => { if (item.url) priorityAssets.set(item.url, false); });
        BACKGROUND_LIST.forEach(item => { if (item.url) priorityAssets.set(item.url, false); });

        // 2. Gather Background Assets (Characters)
        BASE_CHARACTERS.forEach(char => {
            const targetMap = char.id === 'goku_base' || char.id === 'vegeta_base' ? priorityAssets : backgroundAssets;
            if (char.spriteConfig && char.spriteConfig.animations) {
                Object.values(char.spriteConfig.animations).forEach((anim: any) => {
                    if (anim && anim.imageUrl) {
                        targetMap.set(anim.imageUrl, !!anim.isGif);
                    }
                });
            }
        });

        // SPRITE_DB (General)
        Object.values(SPRITE_DB).forEach(config => {
            if (config.animations) {
                Object.values(config.animations).forEach(anim => {
                    if (anim && anim.imageUrl) {
                        backgroundAssets.set(anim.imageUrl, !!anim.isGif);
                    }
                });
            }
        });

        const priorityList = Array.from(priorityAssets.entries()).map(([url, isGif]) => ({ url, isGif }));
        const backgroundList = Array.from(backgroundAssets.entries()).map(([url, isGif]) => ({ url, isGif }));
        
        this.totalCount = priorityList.length; // We only block for priority
        this.loadedCount = 0;

        const animMgr = AnimationManager.getInstance();

        // Phase 1: Priority Load (Blocks execution)
        await Promise.all(priorityList.map(asset => this.loadAsset(asset, onProgress, animMgr)));
        
        // Phase 2: Background Load (Non-blocking)
        this.loadBackgroundAssets(backgroundList, animMgr);

        // Minimum Loading Time Simulation
        await new Promise<void>(resolve => setTimeout(resolve, 1000));
        onProgress(100);
    }

    private async loadAsset(asset: AssetInfo, onProgress: (pct: number) => void, animMgr: AnimationManager): Promise<void> {
        try {
            if (asset.isGif) {
                await animMgr.loadGif(asset.url);
            } else {
                await animMgr.loadTextureAsync(asset.url);
            }
        } catch (e) {
            console.warn(`Failed to load asset: ${asset.url}`);
        }
        this.loadedCount++;
        onProgress(Math.floor((this.loadedCount / this.totalCount) * 100));
    }

    private async loadBackgroundAssets(assets: AssetInfo[], animMgr: AnimationManager) {
        // Load in smaller chunks to avoid CPU spikes during gameplay start
        const chunkSize = 5;
        for (let i = 0; i < assets.length; i += chunkSize) {
            const chunk = assets.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async asset => {
                try {
                    if (asset.isGif) await animMgr.loadGif(asset.url);
                    else await animMgr.loadTextureAsync(asset.url);
                } catch (e) {}
            }));
            // Brief pause between chunks
            await new Promise(r => setTimeout(r, 100));
        }
        console.log("[AssetManager] All background assets loaded.");
    }
}
