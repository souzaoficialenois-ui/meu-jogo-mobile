// src/engine/audio/BGMManager.ts
import { Howl } from 'howler';
import { AudioCache } from './AudioCache';
import { SoundCategory } from './AudioManifest';
import { AudioSettings } from './AudioSettings';

export class BGMManager {
    private static instance: BGMManager;

    private currentHowl: Howl | null = null;
    private currentBgmId: number | null = null;
    private currentKey: string | null = null;
    private currentSourceUrl: string | null = null;
    private transitionQueue: Promise<void> = Promise.resolve();

    private constructor() {
        // Automatically sync BGM volume changes
        AudioSettings.getInstance().addListener(() => {
            this.syncVolume();
        });
    }

    public static getInstance(): BGMManager {
        if (!BGMManager.instance) {
            BGMManager.instance = new BGMManager();
        }
        return BGMManager.instance;
    }

    private log(msg: string, ...args: any[]) {
        console.log(`[BGM_MANAGER] ${msg}`, ...args);
    }

    private syncVolume() {
        if (this.currentHowl && this.currentBgmId !== null) {
            const effVol = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.BGM);
            this.currentHowl.volume(effVol, this.currentBgmId);
        }
    }

    /**
     * Plays background music using smooth crossfading, loop tracking, and memory pruning.
     */
    public async playBGM(key: string, skipFade: boolean = false) {
        // Serialize BGM calls using a sequential transition queue to prevent overlapping async races
        this.transitionQueue = this.transitionQueue.then(async () => {
            await this.executePlayBGM(key, skipFade);
        }).catch((err) => {
            console.error(`[BGM_MANAGER] Error in background music transition queue:`, err);
        });
        return this.transitionQueue;
    }

    private async executePlayBGM(key: string, skipFade: boolean = false) {
        const targetSourceUrl = await AudioCache.getInstance().resolveAssetPath(key, SoundCategory.BGM);

        // If the same physical URL is already active, synchronize play state without reloading/overlapping
        if (this.currentSourceUrl === targetSourceUrl && this.currentHowl) {
            this.log(`Track with source "${targetSourceUrl}" already active. Synchronizing play state.`);
            if (!this.currentHowl.playing(this.currentBgmId || undefined)) {
                this.currentHowl.play(this.currentBgmId || undefined);
            }
            this.currentKey = key;
            return;
        }

        this.log(`Transitioning to track: "${key}" (source: ${targetSourceUrl})`);
        const targetVolume = AudioSettings.getInstance().getEffectiveVolume(SoundCategory.BGM);

        try {
            const nextHowl = await AudioCache.getInstance().getOrCreateHowl(key, SoundCategory.BGM, true);
            if (!nextHowl) {
                console.error(`[BGM_MANAGER] Could not construct Howl for track key: ${key}`);
                return;
            }

            const oldHowl = this.currentHowl;
            const oldId = this.currentBgmId;

            this.currentHowl = nextHowl;
            this.currentKey = key;
            this.currentSourceUrl = targetSourceUrl;

            // 1. Play the incoming track silently (volume = 0)
            const nextId = nextHowl.play();
            this.currentBgmId = nextId;
            nextHowl.volume(0, nextId);

            const fadeDuration = skipFade ? 0 : 1200;

            // Stop/Fade out absolutely all other BGM tracks to enforce the single-track constraint
            const bgmHowls = AudioCache.getInstance().getAllBGMHowls();
            bgmHowls.forEach((howl) => {
                if (howl !== nextHowl) {
                    try {
                        if (skipFade) {
                            howl.stop();
                        } else {
                            const currentVol = howl.volume() as number;
                            howl.fade(currentVol, 0, fadeDuration);
                            howl.once('fade', () => {
                                try {
                                    // Protect the newly playing track from being stopped by stale callbacks
                                    if (howl !== this.currentHowl) {
                                        howl.stop();
                                    }
                                } catch {}
                            });
                        }
                    } catch (e) {
                        try { howl.stop(); } catch {}
                    }
                }
            });

            if (oldHowl && oldId !== null) {
                if (oldHowl === nextHowl && oldId !== nextId) {
                    try { oldHowl.stop(oldId); } catch {}
                }
            }

            // 2. Fade in incoming track to effective volume
            nextHowl.fade(0, targetVolume, fadeDuration, nextId);

        } catch (err) {
            console.error(`[BGM_MANAGER] Failed transitioning bgm to "${key}":`, err);
        }
    }

    /**
     * Translates high level requests (like menu, battle, summon) to assets playing.
     */
    public async playMusic(type: 'menu' | 'battle' | 'summon' | 'char-select') {
        const keyMap: Record<string, string> = {
            menu: 'bgm_menu',
            battle: 'bgm_battle',
            summon: 'bgm_summon',
            'char-select': 'bgm_char_select'
        };
        const assetKey = keyMap[type] || type;
        await this.playBGM(assetKey);
    }

    /**
     * Stop all BGMs with a clean fade-out transition
     */
    public stopBGM(skipFade: boolean = false) {
        if (this.currentHowl && this.currentBgmId !== null) {
            const howl = this.currentHowl;
            const bgmId = this.currentBgmId;
            if (skipFade) {
                try {
                    howl.stop(bgmId);
                } catch {}
            } else {
                try {
                    const currentVol = howl.volume(bgmId) as number;
                    howl.fade(currentVol, 0, 1000, bgmId);
                    howl.once('fade', () => {
                        try {
                            howl.stop(bgmId);
                        } catch {}
                    }, bgmId);
                } catch {
                    try {
                        howl.stop(bgmId);
                    } catch {}
                }
            }
        }

        // Also stop ALL BGM Howl objects to guarantee absolute silence across all channels
        try {
            const bgmHowls = AudioCache.getInstance().getAllBGMHowls();
            bgmHowls.forEach((howl) => {
                try {
                    if (skipFade) {
                        howl.stop();
                    } else {
                        const currentVol = howl.volume() as number;
                        howl.fade(currentVol, 0, 1000);
                        howl.once('fade', () => {
                            try { howl.stop(); } catch {}
                        });
                    }
                } catch {
                    try { howl.stop(); } catch {}
                }
            });
        } catch {}

        this.currentHowl = null;
        this.currentBgmId = null;
        this.currentKey = null;
        this.currentSourceUrl = null;
    }

    public pauseBGM() {
        if (this.currentHowl && this.currentBgmId !== null) {
            this.currentHowl.pause(this.currentBgmId);
        }
    }

    public resumeBGM() {
        if (this.currentHowl && this.currentBgmId !== null) {
            if (!this.currentHowl.playing(this.currentBgmId)) {
                this.currentHowl.play(this.currentBgmId);
            }
        }
    }
}
