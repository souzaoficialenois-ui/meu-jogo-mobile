// services/VoiceAudioManager.ts - Backwards-compatible proxy routing voiced monologue dialogues to our new Howler Voice Manager
import { VoiceManager as NewVoiceManager } from '../src/engine/audio/VoiceManager';
import { AudioSettings } from '../src/engine/audio/AudioSettings';
import { SoundCategory } from '../src/engine/audio/AudioManifest';
import { AudioManager } from './AudioManager';

export enum VoicePriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2
}

export class VoiceAudioManager {
    private static instance: VoiceAudioManager;

    private constructor() {}

    public static getInstance(): VoiceAudioManager {
        if (!VoiceAudioManager.instance) {
            VoiceAudioManager.instance = new VoiceAudioManager();
        }
        return VoiceAudioManager.instance;
    }

    public getVolume(): number {
        return AudioSettings.getInstance().getVolume(SoundCategory.VOICE);
    }

    public getEffectiveVolume(): number {
        return AudioSettings.getInstance().getEffectiveVolume(SoundCategory.VOICE);
    }

    public setMixFactors(master: number, sfx: number) {
        // Automatically coordinated by new global settings
    }

    public setVolume(vol: number) {
        AudioSettings.getInstance().setVolume(SoundCategory.VOICE, vol);
    }

    public setMuted(muted: boolean) {
        AudioSettings.getInstance().setMuted(SoundCategory.VOICE, muted);
    }

    public isVoiceMuted(): boolean {
        return AudioSettings.getInstance().isMuted(SoundCategory.VOICE);
    }

    public async playVoice(voiceKey: string) {
        if (!AudioManager.isInBattle) {
            const lower = (voiceKey || "").toLowerCase();
            const isWhiteListed = lower.includes('intro') || 
                                  lower.includes('win') || 
                                  lower.includes('victory') || 
                                  lower.includes('defeat') || 
                                  lower.startsWith('narrator');
            if (!isWhiteListed) {
                return;
            }
        }
        await NewVoiceManager.getInstance().playVoice(voiceKey);
    }

    public stopAllVoices() {
        NewVoiceManager.getInstance().stopAllVoices();
    }
}
export default VoiceAudioManager;
