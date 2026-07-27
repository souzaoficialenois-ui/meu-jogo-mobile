// AudioCacheManager.ts - High-performance Web Audio API memory cache with integrated high-fidelity procedural wave synthesizers.

export class AudioCacheManager {
    private static instance: AudioCacheManager;
    private audioContext: AudioContext | null = null;
    private decodedBuffers: Map<string, AudioBuffer> = new Map();
    private audioElements: Map<string, HTMLAudioElement> = new Map();

    private constructor() {
        this.initAudioContext();
        if (typeof window !== 'undefined') {
            const resumeAudio = () => {
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log("[DEBUG_AUDIO] AudioContext resumed successfully on user gesture. Populating/refreshing synthetic pool...");
                        this.prePopulateSyntheticPool();
                    }).catch((e) => {
                        console.warn("[DEBUG_AUDIO] Failed to resume AudioContext on gesture:", e);
                    });
                }
            };
            
            // Persistent listeners (instead of removeEventListener right away) to keep audio active and unlocked
            window.addEventListener('click', resumeAudio, { passive: true });
            window.addEventListener('touchstart', resumeAudio, { passive: true });
            window.addEventListener('keydown', resumeAudio, { passive: true });

            // Handle visibility change specifically for Android WebView suspends
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log("[DEBUG_AUDIO] AudioContext auto-resumed after visibility visibilityState change from suspended to visible.");
                    }).catch((e) => {
                        console.warn("[DEBUG_AUDIO] Failed to auto-resume AudioContext on visibility change:", e);
                    });
                }
            });
        }

        // Populate baseline synthesizers on boot so audio works on the very first frame
        this.prePopulateSyntheticPool();
    }

    public static getInstance(): AudioCacheManager {
        if (!AudioCacheManager.instance) {
            AudioCacheManager.instance = new AudioCacheManager();
        }
        return AudioCacheManager.instance;
    }

    private initAudioContext() {
        if (typeof window === 'undefined') return;
        try {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtxClass) {
                this.audioContext = new AudioCtxClass();
                console.log("[DEBUG_AUDIO] AudioContext initialized successfully.");
            }
        } catch (e) {
            console.error("[DEBUG_AUDIO] Failed to initialize AudioContext:", e);
        }
    }

    public getAudioContext(): AudioContext | null {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch((e) => {
                console.warn("[DEBUG_AUDIO] Failed to resume AudioContext dynamically:", e);
            });
        }
        return this.audioContext;
    }

    /**
     * Decode and store a sound file in RAM as AudioBuffer.
     * If decoding fails or file size is small (dummy/mock file), it generates a neat procedural fallback buffer.
     */
    public async cacheSound(key: string, data: Blob | ArrayBuffer): Promise<boolean> {
        console.log(`[DEBUG_AUDIO] Loading sound "${key}" into CacheManager...`);
        const ctx = this.getAudioContext();
        
        try {
            const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data;
            const size = arrayBuffer.byteLength;
            
            // Decodes true audio files (ignores small 44-byte placeholder clips to skip decoding errors)
            if (size > 1024 && ctx) {
                try {
                    const buffer = await new Promise<AudioBuffer>((resolve, reject) => {
                        try {
                            const p = ctx.decodeAudioData(
                                arrayBuffer.slice(0),
                                (decoded) => resolve(decoded),
                                (err) => {
                                    console.warn(`[DEBUG_AUDIO] decodeAudioData callback error for "${key}":`, err);
                                    reject(err);
                                }
                            );
                            if (p && typeof p.catch === 'function') {
                                p.catch((err) => {
                                    console.warn(`[DEBUG_AUDIO] decodeAudioData promise rejection caught for "${key}":`, err);
                                    reject(err);
                                });
                            }
                        } catch (err) {
                            console.warn(`[DEBUG_AUDIO] decodeAudioData synchronous exception for "${key}":`, err);
                            reject(err);
                        }
                    });
                    this.decodedBuffers.set(key, buffer);
                    console.log(`[DEBUG_AUDIO] SUCCESS: Cached real audio "${key}" into WebAudio Buffer (${size} bytes).`);

                    // Keep a matching HTML5 Audio Element in directory registry for safety fallback options
                    const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/ogg' });
                    const blobUrl = URL.createObjectURL(blob);
                    const audio = new Audio(blobUrl);
                    audio.preload = 'auto';
                    this.audioElements.set(key, audio);
                    return true;
                } catch (decodeErr) {
                    console.warn(`[DEBUG_AUDIO] Native decode failed for "${key}". Reverting to high-fidelity procedural synthesis fallbacks.`, decodeErr);
                }
            }
        } catch (err) {
            console.error(`[DEBUG_AUDIO] Error preparing sound data for "${key}":`, err);
        }

        // Engages beautiful dynamic wave synthesizer if file is a dummy or decoding fails
        if (ctx) {
            try {
                const buffer = this.generateSyntheticBuffer(key, ctx);
                this.decodedBuffers.set(key, buffer);
                console.log(`[DEBUG_AUDIO] SUCCESS: Procedurally synthesized clean fallback AudioBuffer for "${key}".`);
                return true;
            } catch (synthErr) {
                console.error(`[DEBUG_AUDIO] Procedural synthesis failed for "${key}":`, synthErr);
            }
        }

        return false;
    }

    public getDecodedBuffer(key: string): AudioBuffer | null {
        return this.decodedBuffers.get(key) || null;
    }

    public getAudioElement(key: string): HTMLAudioElement | null {
        return this.audioElements.get(key) || null;
    }

    public isSoundCached(key: string): boolean {
        return this.decodedBuffers.has(key);
    }

    public getSoundDuration(key: string): number {
        const decoded = this.decodedBuffers.get(key);
        if (decoded) {
            return decoded.duration;
        }
        
        // Standard durations for system/battle cues
        if (key === 'ready') return 1.5;
        if (key === 'fight') return 1.2;
        if (key === 'ko') return 1.8;
        if (key === 'click') return 0.05;
        if (key === 'confirm') return 0.22;
        if (key === 'cancel') return 0.18;
        return 1.0;
    }

    /**
     * Synthesizes a baseline of elegant procedural sound effects so the app is immediately vocal from frame 1
     */
    private prePopulateSyntheticPool() {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const allSfxKeys = [
            'click', 'confirm', 'cancel', 'punch', 'summon', 'victory', 'defeat',
            'charge', 'reveal', 'attack', 'block', 'ready', 'fight', 'ko'
        ];

        allSfxKeys.forEach((key) => {
            try {
                const buffer = this.generateSyntheticBuffer(key, ctx);
                this.decodedBuffers.set(key, buffer);
            } catch (e) {
                console.warn(`[DEBUG_AUDIO] Boot sound synthesis failed for key "${key}":`, e);
            }
        });
    }

    /**
     * High-fidelity procedural mathematical sfx synthesizer - 100% independent and clean.
     */
    private generateSyntheticBuffer(key: string, ctx: AudioContext): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        let duration = 0.5;

        // Tune durations per key
        if (key.includes('click')) duration = 0.05;
        else if (key.includes('confirm')) duration = 0.22;
        else if (key.includes('cancel')) duration = 0.18;
        else if (key.includes('block')) duration = 0.12;
        else if (key.includes('punch')) duration = 0.14;
        else if (key.includes('attack')) duration = 0.22;
        else if (key.includes('ready')) duration = 1.35;
        else if (key.includes('fight')) duration = 1.15;
        else if (key.includes('ko')) duration = 1.75;
        else if (key.includes('reveal')) duration = 0.45;
        else if (key.includes('charge')) duration = 0.8;
        else if (key.includes('summon')) duration = 1.5;
        else if (key.includes('victory') || key.includes('defeat')) duration = 2.0;

        const totalSamples = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < totalSamples; i++) {
            const t = i / sampleRate;
            let val = 0;

            if (key.includes('click')) {
                const freq = 1200 * Math.exp(-t * 80);
                const amp = Math.exp(-t * 90);
                val = Math.sin(2 * Math.PI * freq * t) * amp * 0.4;
            } 
            else if (key.includes('confirm')) {
                const amp = Math.exp(-t * 12);
                const freq = (t < 0.08) ? 523.25 : 659.25; // C5 to E5
                val = Math.sin(2 * Math.PI * freq * t) * amp * 0.35;
            } 
            else if (key.includes('cancel')) {
                const amp = Math.exp(-t * 15);
                const freq = 360 - (t / duration) * 180; // descending pitch
                val = Math.sin(2 * Math.PI * freq * t) * amp * 0.35;
            } 
            else if (key.includes('punch')) {
                const freq = 150 - (t / duration) * 105; // deep bass hit
                const bassEnv = Math.exp(-t * 22);
                const bassVal = Math.sin(2 * Math.PI * freq * t) * bassEnv;
                const noiseVal = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.45;
                val = (bassVal + noiseVal) * 0.6;
            } 
            else if (key.includes('block')) {
                const freq = 1550;
                const env = Math.exp(-t * 38);
                const noiseEnv = Math.exp(-t * 110);
                const noiseVal = (Math.random() * 2 - 1) * noiseEnv * 0.45;
                val = (Math.sin(2 * Math.PI * freq * t) * env + noiseVal) * 0.55;
            } 
            else if (key.includes('charge')) {
                const env = Math.min(1.0, t / 0.15) * Math.min(1.0, (duration - t) / 0.2);
                const baseFreq = 75 + (t / duration) * 385; // sweeps up
                const modulation = 1.0 + 0.15 * Math.sin(2 * Math.PI * 13 * t); // vibrating pulsator
                const freq = baseFreq * modulation;
                const phase = (t * freq) % 1;
                val = (2 * phase - 1) * env * 0.35; // sawtooth wave
            } 
            else if (key.includes('reveal')) {
                const env = Math.min(1.0, (duration - t) / 0.1);
                const step = Math.floor(t / 0.11);
                let freq = 523.25;
                if (step === 1) freq = 659.25;
                else if (step === 2) freq = 783.99;
                else if (step >= 3) freq = 1046.50; // glorious arpeggio
                val = Math.sin(2 * Math.PI * freq * t) * env * 0.35;
            } 
            else if (key.includes('attack')) {
                const env = Math.sin(Math.PI * (t / duration)); // parabolic bell curve
                const freq = 850 - (t / duration) * 550;
                const sineVal = Math.sin(2 * Math.PI * freq * t) * env * 0.45;
                const noiseVal = (Math.random() * 2 - 1) * env * 0.35;
                val = (sineVal + noiseVal) * 0.5;
            } 
            else if (key.includes('summon')) {
                const env = Math.min(1.0, (duration - t) / 0.4);
                const baseFreq = 65 + Math.pow(t / duration, 2) * 1100;
                const vibrato = 1 + 0.1 * Math.sin(2 * Math.PI * 22 * t);
                const freq = baseFreq * vibrato;
                const phase = (t * freq) % 1;
                val = (2 * phase - 1) * env * 0.35;
            } 
            else if (key.includes('victory')) {
                const env = Math.min(1.0, (duration - t) / 0.4);
                const step = Math.floor(t / 0.5);
                let f1 = 261.63, f2 = 329.63, f3 = 392.00, f4 = 523.25;
                if (step === 1) { // F-major
                    f1 = 349.23; f2 = 440.00; f3 = 523.25; f4 = 698.46;
                } else if (step === 2) { // G-major
                    f1 = 392.00; f2 = 493.88; f3 = 587.33; f4 = 783.99;
                } else if (step >= 3) { // High C-major
                    f1 = 523.25; f2 = 659.25; f3 = 783.99; f4 = 1046.50;
                }
                const chords = (Math.sin(2*Math.PI*f1*t) + Math.sin(2*Math.PI*f2*t) + Math.sin(2*Math.PI*f3*t) + Math.sin(2*Math.PI*f4*t));
                val = chords * 0.15 * env;
            } 
            else if (key.includes('defeat')) {
                const env = Math.min(1.0, (duration - t) / 0.5);
                const step = Math.floor(t / 0.6);
                let f1 = 220.00, f2 = 261.63, f3 = 329.63; // A minor
                if (step === 1) { // D minor
                    f1 = 293.66; f2 = 349.23; f3 = 440.00;
                } else if (step >= 2) { // pitch fall down slide
                    const slide = 1.0 - (t - 1.2) / 0.8;
                    f1 = 196.00 * slide; f2 = 233.08 * slide; f3 = 293.66 * slide;
                }
                const chords = (Math.sin(2*Math.PI*f1*t) + Math.sin(2*Math.PI*f2*t) + Math.sin(2*Math.PI*f3*t));
                val = chords * 0.15 * env;
            } 
            else if (key.includes('ready')) {
                // Speech synthetic simulation of robotic announcer shouting: "READY!"
                const env = Math.min(1.0, t / 0.1) * Math.min(1.0, (duration - t) / 0.35);
                const baseFreq = 115 + 18 * Math.sin(2 * Math.PI * 6.8 * t); // vibrating vocal chords
                const phase = (t * baseFreq) % 1;
                const saw = 2 * phase - 1;
                const formantFreq = (t < 0.55) ? 1350 : 2600; // changing vocal tract formants
                const formant = Math.sin(2 * Math.PI * formantFreq * t) * 0.35;
                const noise = (Math.random() * 2 - 1) * 0.12;
                val = (saw * 0.4 + formant * 0.45 + noise * 0.15) * env * 0.45;
            } 
            else if (key.includes('fight')) {
                // Speech synthetic simulation of announcer: "FIGHT!"
                const env = Math.sin(Math.PI * (t / duration));
                const baseFreq = 125 - (t / duration) * 35;
                const sqr = ((t * baseFreq) % 1 > 0.5) ? 1.0 : -1.0;
                const noiseAmt = (t < 0.2) ? 0.75 : (t > 0.75 ? 0.85 : 0.2); // F noise at start, T at end
                const voiceAmt = 1.0 - noiseAmt;
                const formantFreq = 1250 + Math.sin(t * 12) * 350;
                const vowel = Math.sin(2 * Math.PI * formantFreq * t) * voiceAmt;
                const noise = (Math.random() * 2 - 1) * noiseAmt;
                val = (sqr * 0.25 + vowel * 0.45 + noise * 0.3) * env * 0.45;
            } 
            else if (key.includes('ko')) {
                // Speech synthetic simulation of announcer: "K.O.!"
                const env = Math.min(1.0, t / 0.08) * Math.min(1.0, (duration - t) / 0.55);
                const baseFreq = 82;
                const sqr = ((t * baseFreq) % 1 > 0.52) ? 1.0 : -1.0;
                const syllableIdx = Math.floor(t / 0.65);
                const formantFreq = (syllableIdx === 0) ? 950 : 420; // K formant vs O formant
                const formant = Math.sin(2 * Math.PI * formantFreq * t) * 0.5;
                const noise = (Math.random() * 2 - 1) * 0.1;
                val = (sqr * 0.35 + formant * 0.5 + noise * 0.15) * env * 0.45;
            } 
            else {
                // Fallback default safe beep
                const amp = Math.exp(-t * 20);
                val = Math.sin(2 * Math.PI * 440 * t) * amp * 0.35;
            }

            channelData[i] = val;
        }

        return buffer;
    }

    public clearCache() {
        this.decodedBuffers.clear();
        this.audioElements.forEach((audio) => {
            try {
                audio.pause();
                audio.src = '';
            } catch {}
        });
        this.audioElements.clear();
        console.log("[DEBUG_AUDIO] Cached audio memory successfully garbage-collected.");
    }
}
