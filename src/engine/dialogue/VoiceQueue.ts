// src/engine/dialogue/VoiceQueue.ts
import { DialogueQuote, DialogueSubtitle, CharacterEmotion } from './types';
import { VoiceManager } from '../audio/VoiceManager';
import { LanguageManager } from '../../../services/LanguageManager';

export class VoiceQueue {
    private static instance: VoiceQueue;

    // Active subtitle rendering
    private activeSubtitles: DialogueSubtitle[] = [];
    private listeners: ((subs: DialogueSubtitle[]) => void)[] = [];

    // Queue parameters
    private currentQuote: { characterId: string; priority: number; endTime: number } | null = null;
    private speakerCooldowns: Record<string, number> = {}; // timestamp when speaker can talk again
    private globalSpamGate: number = 0; // standard 1 second gate between normal talks
    private playedCounts: Record<string, number> = {}; // anti-spam play counts per quote ID
    private lastPlayedQuotes: Record<string, string> = {}; // speaker -> last played quote ID (temporary context memory)
    private lastSpeechSpeakerId: string | null = null;
    private lastSpeechQuoteId: string | null = null;
    private lastSpeechTimestamp: number = 0;

    private constructor() {
        // Run tick to prune expired subtitles
        if (typeof window !== 'undefined') {
            setInterval(() => this.pruneExpiredSubtitles(), 100);
        }
    }

    public static getInstance(): VoiceQueue {
        if (!VoiceQueue.instance) {
            VoiceQueue.instance = new VoiceQueue();
        }
        return VoiceQueue.instance;
    }

    public getLastSpeechSpeakerId(): string | null {
        return this.lastSpeechSpeakerId;
    }

    public getLastSpeechQuoteId(): string | null {
        return this.lastSpeechQuoteId;
    }

    public getLastSpeechTimestamp(): number {
        return this.lastSpeechTimestamp;
    }

    public subscribe(listener: (subs: DialogueSubtitle[]) => void): () => void {
        this.listeners.push(listener);
        // Instant emit
        listener([...this.activeSubtitles]);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private emitChange() {
        this.listeners.forEach(l => l([...this.activeSubtitles]));
    }

    public clear() {
        this.activeSubtitles = [];
        this.currentQuote = null;
        this.speakerCooldowns = {};
        this.globalSpamGate = 0;
        this.playedCounts = {};
        this.lastPlayedQuotes = {};
        this.emitChange();
    }

    private pruneExpiredSubtitles() {
        const now = Date.now();
        const initialLen = this.activeSubtitles.length;
        this.activeSubtitles = this.activeSubtitles.filter(sub => (sub.startedAt + sub.durationMs) > now);
        if (this.activeSubtitles.length !== initialLen) {
            this.emitChange();
        }
        if (this.currentQuote && this.currentQuote.endTime < now) {
            this.currentQuote = null;
        }
    }

    /**
     * Attempts to register and execute a character dialogue
     * Returns true if successful
     */
    public requestSpeech(
        characterId: string,
        characterName: string,
        quote: DialogueQuote,
        playerNum: 1 | 2,
        emotion: CharacterEmotion,
        customDurationMs?: number
    ): boolean {
        const now = Date.now();

        // 1. Check if same quote is played too many times this match (To prevent excessive repetitions, up to 100 times)
        const currentCount = this.playedCounts[quote.id] || 0;
        if (currentCount >= 100) {
            return false;
        }

        // 2. Avoid immediate repetition of identical phrase (Temporary context memory)
        if (this.lastPlayedQuotes[characterId] === quote.id) {
            return false;
        }

        // 3. Evaluate priorities
        if (this.currentQuote) {
            // Cancel lower priority dialogue instantly if a higher one comes in
            if (quote.priority > this.currentQuote.priority) {
                this.cancelSpeaker(this.currentQuote.characterId);
            } else {
                // Ignore lower or equal priority dialogs if another is active
                return false;
            }
        }

        // 4. Cooldown and anti-spam gates
        // If low priority event, check cooldowns
        if (quote.priority <= 3) {
            if (this.globalSpamGate > now) return false;
            const cooldown = this.speakerCooldowns[characterId] || 0;
            if (cooldown > now) return false;
        }

        // 5. Success! Register states
        const duration = customDurationMs || this.calculateDuration(quote);
        this.currentQuote = {
            characterId,
            priority: quote.priority,
            endTime: now + duration
        };

        // Set cooldowns
        this.speakerCooldowns[characterId] = now + duration + 3000; // 3 seconds rest period
        this.globalSpamGate = now + 1200; // global space of 1.2 seconds between words
        this.playedCounts[quote.id] = currentCount + 1;
        this.lastPlayedQuotes[characterId] = quote.id;
        this.lastSpeechSpeakerId = characterId;
        this.lastSpeechQuoteId = quote.id;
        this.lastSpeechTimestamp = now;

        // Clean-up subtitles of this player prior to showing new one to avoid double visual blocks
        this.activeSubtitles = this.activeSubtitles.filter(sub => sub.playerNum !== playerNum);

        // Fetch correct translated localized string
        const langCode = LanguageManager.getInstance().getCurrentLanguage();
        const text = langCode.startsWith('pt') ? quote.textPt : quote.textEn;

        // Custom visual theme color
        const color = playerNum === 1 ? '#ef4444' : '#3b82f6'; // red vs blue or orange vs cyan

        // Add subtitle
        this.activeSubtitles.push({
            id: `${quote.id}_${now}`,
            characterId,
            characterName,
            color,
            text,
            durationMs: duration,
            startedAt: now,
            playerNum,
            emotion
        });

        this.emitChange();

        // Voice files trigger
        if (quote.voiceKey) {
            VoiceManager.getInstance().playVoice(quote.voiceKey);
        } else {
            // Simulate procedural audio feedback if actual wav assets are absent
            this.playProceduralGrunt(characterId, emotion);
        }

        return true;
    }

    private cancelSpeaker(characterId: string) {
        this.activeSubtitles = this.activeSubtitles.filter(sub => sub.characterId !== characterId);
        this.currentQuote = null;
        this.emitChange();
    }

    private calculateDuration(quote: DialogueQuote): number {
        const text = quote.textEn;
        // Average speech pace: 15 characters per second + 1.5s basic buffer
        const calculated = Math.max(2000, Math.min(6000, 1500 + (text.length * 52)));
        return calculated;
    }

    private playProceduralGrunt(characterId: string, emotion: CharacterEmotion) {
        // Plays a subtle matching sound clip using synthesized audio to reduce memory footprint on mobile
        try {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (!AudioCtx) return;
            
            let ctx = (window as any)._sharedProceduralAudioCtx;
            if (!ctx || ctx.state === 'closed') {
                ctx = new AudioCtx();
                (window as any)._sharedProceduralAudioCtx = ctx;
            }
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            let vol = 0.04;
            let dur = 0.25;
            let freq = 200;

            if (emotion === CharacterEmotion.ANGRY || emotion === CharacterEmotion.AGGRESSIVE) {
                osc.type = 'sawtooth';
                freq = 160;
                vol = 0.06;
                dur = 0.35;
            } else if (emotion === CharacterEmotion.DESPERATE || emotion === CharacterEmotion.EXHAUSTED) {
                osc.type = 'triangle';
                freq = 110;
                dur = 0.4;
            } else {
                osc.type = 'sine';
            }

            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            osc.start();
            osc.stop(ctx.currentTime + dur);
        } catch {}
    }
}
