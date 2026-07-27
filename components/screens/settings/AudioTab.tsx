import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Download, CheckCircle, Play, Activity } from 'lucide-react';
import { PanelCard, SettingRow, Slider } from './SettingsSharedComponents';
import { AudioManager } from '../../../services/AudioManager';
import { UISoundManager } from '../../../services/UISoundManager';
import { VoiceAudioManager } from '../../../services/VoiceAudioManager';
import { ManifestManager } from '../../../services/ManifestManager';
import { DownloadManager, DownloadProgress } from '../../../services/DownloadManager';
import { AudioDownloadManager } from '../../../services/AudioDownloadManager';
import { CacheManager } from '../../../services/CacheManager';

interface AudioTabProps {
    settings: any;
    updateSettings: (s: any) => void;
    isPt: boolean;
    t: (k: string) => string;
}

export const AudioTab: React.FC<AudioTabProps> = ({ settings, updateSettings, isPt, t }) => {
    const [uiVolume, setUiVolume] = useState<number>(() => UISoundManager.getInstance().getVolume());
    const [voiceVolume, setVoiceVolume] = useState<number>(() => VoiceAudioManager.getInstance().getVolume());
    const [uiMuted, setUiMuted] = useState<boolean>(() => UISoundManager.getInstance().isSoundMuted());
    const [voiceMuted, setVoiceMuted] = useState<boolean>(() => VoiceAudioManager.getInstance().isVoiceMuted());

    const [activeVoiceLang, setActiveVoiceLang] = useState(ManifestManager.getActiveLanguage());
    const [confirmDownloadLang, setConfirmDownloadLang] = useState<string | null>(null);
    const [confirmDeleteLang, setConfirmDeleteLang] = useState<string | null>(null);
    const [playingVoiceFeedback, setPlayingVoiceFeedback] = useState<string | null>(null);

    const [voicePacksStatus, setVoicePacksStatus] = useState<Record<string, { installed: boolean; updateAvailable: boolean }>>({
        pt_br: { installed: ManifestManager.isPackInstalled('pt_br'), updateAvailable: ManifestManager.isUpdateAvailable('pt_br') },
        en_us: { installed: ManifestManager.isPackInstalled('en_us'), updateAvailable: ManifestManager.isUpdateAvailable('en_us') },
        jp: { installed: ManifestManager.isPackInstalled('jp'), updateAvailable: ManifestManager.isUpdateAvailable('jp') },
    });

    const [downloadStates, setDownloadStates] = useState<Record<string, DownloadProgress | null>>({
        pt_br: null,
        en_us: null,
        jp: null
    });

    const [musicPacksStatus, setMusicPacksStatus] = useState<Record<string, { installed: boolean; updateAvailable: boolean }>>({
        music_ost: { installed: ManifestManager.isPackInstalled('music_ost'), updateAvailable: ManifestManager.isUpdateAvailable('music_ost') },
    });

    const [musicDownloadState, setMusicDownloadState] = useState<DownloadProgress | null>(null);
    const [systemSoundsStatus, setSystemSoundsStatus] = useState<{ installed: boolean; updateAvailable: boolean }>({ installed: false, updateAvailable: false });
    const [systemDownloadProgress, setSystemDownloadProgress] = useState<any>(null);

    const [confirmDownloadSystem, setConfirmDownloadSystem] = useState(false);
    const [confirmDeleteSystem, setConfirmDeleteSystem] = useState(false);

    useEffect(() => {
        const checkSystemSounds = async () => {
            const hasLocalFile = await CacheManager.hasFile(`audio/system/ready.ogg`);
            setSystemSoundsStatus({ installed: hasLocalFile, updateAvailable: false });
        };
        checkSystemSounds();
    }, []);

    useEffect(() => {
        const unsubSys = AudioDownloadManager.getInstance().subscribe((statusMap, overallPct) => {
            const statuses = Array.from(statusMap.values());
            const isDownloading = statuses.some(s => s.status === 'downloading');
            const isCompleted = statuses.every(s => s.status === 'completed');
            if (isDownloading) {
                setSystemDownloadProgress({ status: 'downloading', percentage: overallPct, speedMBs: 1.5 });
            } else if (isCompleted) {
                setSystemSoundsStatus({ installed: true, updateAvailable: false });
                setSystemDownloadProgress(null);
            }
        });
        return () => unsubSys();
    }, []);

    const handleVolumeChange = (key: string, value: number) => {
        updateSettings({ [key]: value });
    };

    return (
        <div className="space-y-8">
            <PanelCard title={isPt ? 'Controle de Volume' : 'Volume Control'} subtitle={isPt ? 'Ajuste os volumes de som e música do jogo' : 'Adjust general game sound and background music levels'} icon={Volume2}>
                <SettingRow label={t('settings_master_vol') || 'Volume Geral'} description={isPt ? 'Ajuste geral do som do jogo' : 'Adjust general game audio volume level'}>
                    <Slider 
                        value={settings.masterVolume} 
                        onChange={(v) => handleVolumeChange('masterVolume', v)} 
                        icon={settings.masterVolume === 0 ? VolumeX : Volume2} 
                        onTest={() => AudioManager.getInstance().playSFX('click')}
                    />
                </SettingRow>
                <SettingRow label={t('settings_music_vol') || 'Música'} description={isPt ? 'Volume da trilha sonora e músicas de fundo' : 'Adjust background soundtracks volume'}>
                    <Slider 
                        value={settings.musicVolume} 
                        onChange={(v) => handleVolumeChange('musicVolume', v)} 
                        onTest={() => AudioManager.getInstance().playSFX('click')}
                    />
                </SettingRow>
                <SettingRow label={isPt ? 'Efeitos Visuais' : 'Visual Effects'} description={isPt ? 'Volume dos efeitos de golpes, ataques e explosões' : 'Adjust sound effects for combat hits and moves'}>
                    <Slider 
                        value={settings.sfxVolume} 
                        onChange={(v) => handleVolumeChange('sfxVolume', v)} 
                        onTest={() => AudioManager.getInstance().playSFX('punch')}
                    />
                </SettingRow>
            </PanelCard>

            <PanelCard title={isPt ? 'Áudio do Sistema' : 'System Audio'} subtitle={isPt ? 'Gerencie sons de announcer (Ready, Fight, KO)' : 'Download and manage interface announcer sound effects'} icon={Volume2}>
                 <div className="space-y-6">
                    <div className={`p-6 sm:p-8 rounded-2xl border-2 transition-all flex flex-col gap-4 ${systemSoundsStatus.installed ? 'bg-orange-500/5 border-orange-500' : 'bg-stone-950/40 border-white/5'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="text-white font-black tracking-wide text-lg uppercase">{isPt ? 'Narrador de Luta' : 'Combat Announcer'}</h4>
                                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">1.2 MB • {systemSoundsStatus.installed ? (isPt ? 'INSTALADO' : 'INSTALLED') : (isPt ? 'DISPONÍVEL' : 'AVAILABLE')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {!systemSoundsStatus.installed ? (
                                    <button onClick={() => AudioDownloadManager.getInstance().startDownloadAll()} className="px-5 py-2.5 bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md flex items-center gap-2">
                                        <Download size={14} />
                                        <span>{isPt ? 'BAIXAR' : 'DOWNLOAD'}</span>
                                    </button>
                                ) : (
                                    <div className="px-5 py-2.5 bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2">
                                        <CheckCircle size={14} />
                                        <span>{isPt ? 'INSTALADO' : 'INSTALLED'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PanelCard>
        </div>
    );
};
