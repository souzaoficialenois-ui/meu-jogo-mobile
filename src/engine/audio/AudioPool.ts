// src/engine/audio/AudioPool.ts
import { Howl } from 'howler';
import { MAX_CHANNELS, TYPE_LIMITS, ANTISPAM_LIMIT_MS, AudioPriority, SoundCategory } from './AudioManifest';

export interface ActiveSoundInstance {
    key: string;
    category: SoundCategory;
    priority: AudioPriority;
    howlId: number;
    howlRef: Howl;
    startTime: number;
}

export class AudioPool {
    private static instance: AudioPool;
    private activeSounds: Set<ActiveSoundInstance> = new Set();
    private lastPlayedTimestamps: Map<string, number> = new Map();

    private constructor() {}

    public static getInstance(): AudioPool {
        if (!AudioPool.instance) {
            AudioPool.instance = new AudioPool();
        }
        return AudioPool.instance;
    }

    /**
     * Checks if a sound option should play, applying anti-spam, polyphony caps, and global channel ceilings.
     * Pruning low priority sound outputs when the system is capped.
     */
    public registerAndCheck(key: string, category: SoundCategory, priority: AudioPriority, howl: Howl, howlId: number): boolean {
        const now = Date.now();

        // 1. Apply Anti-Spam Control for high velocity clicks
        const lastPlay = this.lastPlayedTimestamps.get(key) || 0;
        if (now - lastPlay < ANTISPAM_LIMIT_MS) {
            return false; // Suppress redundant overlaps
        }
        this.lastPlayedTimestamps.set(key, now);

        // 2. Enforce Category-Specific Polyphony Limits (e.g., preventing 8 punch sounds from stacking and blowing up speakers)
        const activeCount = [...this.activeSounds].filter(act => act.key === key).length;
        const polyphonyLimit = TYPE_LIMITS[key] || 4;
        
        if (activeCount >= polyphonyLimit) {
            if (priority === AudioPriority.HIGH) {
                // If the new sound has maximum importance (HIGH), drop the oldest active sound instance of this type
                const oldestOfKey = [...this.activeSounds]
                    .filter(act => act.key === key)
                    .sort((a, b) => a.startTime - b.startTime)[0];
                if (oldestOfKey) {
                    this.stopSoundInstance(oldestOfKey);
                }
            } else {
                return false; // Skip duplicate play request
            }
        }

        // 3. Enforce Global Channel Constraints
        if (this.activeSounds.size >= MAX_CHANNELS) {
            // Attempt to evict the oldest sound of a lower priority
            const evictable = [...this.activeSounds]
                .filter(act => act.priority < priority)
                .sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return a.priority - b.priority; // Prune lowest priority first
                    }
                    return a.startTime - b.startTime; // Or the oldest
                })[0];

            if (evictable) {
                console.log(`[AUDIO_POOL] Evicting low-priority channel "${evictable.key}" (howlId: ${evictable.howlId}) to play "${key}"`);
                this.stopSoundInstance(evictable);
            } else {
                // No lower priority sound is playing, we must drop this play if incoming is not HIGH importance
                if (priority !== AudioPriority.HIGH) {
                    console.warn(`[AUDIO_POOL] Hard cap reached (${MAX_CHANNELS} channels). Ignoring sound: ${key}`);
                    return false;
                }
            }
        }

        // Add to tracking pool
        const instance: ActiveSoundInstance = {
            key,
            category,
            priority,
            howlId,
            howlRef: howl,
            startTime: now
        };

        this.activeSounds.add(instance);

        // Setup end/stop/error triggers for automatic resource tracking
        const cleanup = () => {
            this.activeSounds.delete(instance);
        };
        howl.once('end', cleanup, howlId);
        howl.once('stop', cleanup, howlId);
        howl.once('playerror', cleanup, howlId);
        howl.once('loaderror', cleanup, howlId);

        return true;
    }

    /**
     * Stop a specific active sound instance
     */
    public stopSoundInstance(instance: ActiveSoundInstance) {
        try {
            instance.howlRef.stop(instance.howlId);
        } catch {}
        this.activeSounds.delete(instance);
    }

    /**
     * Set volume level for active channels of a specific category
     */
    public applyCategoryVolume(category: SoundCategory, volume: number) {
        this.activeSounds.forEach(instance => {
            if (instance.category === category) {
                try {
                    instance.howlRef.volume(volume, instance.howlId);
                } catch {}
            }
        });
    }

    /**
     * Wipe all active battle, interface, or voice clips
     */
    public stopCategory(category: SoundCategory) {
        this.activeSounds.forEach(instance => {
            if (instance.category === category) {
                this.stopSoundInstance(instance);
            }
        });
    }

    /**
     * Immediately silence every asset playing (excluding BGMs specifically)
     */
    public stopAllEffects() {
        this.activeSounds.forEach(instance => {
            if (instance.category !== SoundCategory.BGM) {
                this.stopSoundInstance(instance);
            }
        });
        this.activeSounds.clear();
    }

    public getActiveCount(): number {
        return this.activeSounds.size;
    }
}
