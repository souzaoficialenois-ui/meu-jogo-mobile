// services/MusicAudioManager.ts - Backwards-compatible proxy routing background music to our new Howler BGM Manager
import { BGMManager as NewBGMManager } from '../src/engine/audio/BGMManager';
import { AudioSettings } from '../src/engine/audio/AudioSettings';
import { SoundCategory } from '../src/engine/audio/AudioManifest';

export class MusicAudioManager {
    private static instance: MusicAudioManager;

    private constructor() {}

    public static getInstance(): MusicAudioManager {
        if (!MusicAudioManager.instance) {
            MusicAudioManager.instance = new MusicAudioManager();
        }
        return MusicAudioManager.instance;
    }

    public getVolume(): number {
        return AudioSettings.getInstance().getVolume(SoundCategory.BGM);
    }

    public getEffectiveVolume(): number {
        return AudioSettings.getInstance().getEffectiveVolume(SoundCategory.BGM);
    }

    public setVolume(vol: number) {
        AudioSettings.getInstance().setVolume(SoundCategory.BGM, vol);
    }

    public setMuted(muted: boolean) {
        AudioSettings.getInstance().setMuted(SoundCategory.BGM, muted);
    }

    public isTrackMuted(): boolean {
        return AudioSettings.getInstance().isMuted(SoundCategory.BGM);
    }

    public async playBGM(url: string) {
        await NewBGMManager.getInstance().playBGM(url);
    }

    public async playMusic(type: 'menu' | 'battle' | 'summon' | 'char-select') {
        await NewBGMManager.getInstance().playMusic(type);
    }

    public stopBGM(skipFade: boolean = false) {
        NewBGMManager.getInstance().stopBGM(skipFade);
    }

    public pauseBGM() {
        NewBGMManager.getInstance().pauseBGM();
    }

    public resumeBGM() {
        NewBGMManager.getInstance().resumeBGM();
    }
}
export default MusicAudioManager;
