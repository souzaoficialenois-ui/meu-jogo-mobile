import React, { useEffect, useState, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { AssetManager } from '../../services/AssetManager';
import { AudioManager } from '../../services/AudioManager';
import { ManifestManager } from '../../services/ManifestManager';
import { DownloadManager, DownloadProgress } from '../../services/DownloadManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, Shield, Download, Wifi, WifiOff, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { SceneName } from '../../types';
import { AudioDownloadManager } from '../../services/AudioDownloadManager';
import { TipsManager } from '../../services/TipsManager';


const renderTextWithSprites = (text: string) => {
    const regex = /(Ataques Especiais|Ataque Especial|especiais|especial|Especiais|Especial|Bloquear|Bloqueio|defesa|Defesa|botões de ataque|ataques|ataque|Carregar Ki|Ki|Dragon Rush|Transformação|Transformar|Dash|esquiva|Esquivar|Esquiva)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
        if (!part) return null;
        const lower = part.toLowerCase();
        if (lower === "bloquear" || lower === "bloqueio" || lower === "defesa") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-blue-500/30 text-xs font-black text-blue-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20defeza.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Defesa" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        if (lower === "ataque especial" || lower === "especial" || lower === "especiais" || lower === "ataques especiais") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-orange-500/30 text-xs font-black text-orange-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20especial.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Especial" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        if (lower === "botões de ataque" || lower === "ataques" || lower === "ataque") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-sky-500/30 text-xs font-black text-sky-400 font-sans mx-1 shadow-sm shrink-0">
                    <span className="flex -space-x-1 shrink-0">
                        <img src="/Assets/icones%20ui/combo%20leve.png" className="w-3.5 h-3.5 object-contain select-none pointer-events-none" alt="Leve" referrerPolicy="no-referrer" />
                        <img src="/Assets/icones%20ui/icone%20combo%20medio.png" className="w-3.5 h-3.5 object-contain select-none pointer-events-none" alt="Médio" referrerPolicy="no-referrer" />
                        <img src="/Assets/icones%20ui/icone%20combo%20forte.png" className="w-3.5 h-3.5 object-contain select-none pointer-events-none" alt="Forte" referrerPolicy="no-referrer" />
                    </span>
                    {part}
                </span>
            );
        }
        if (lower === "carregar ki" || lower === "ki") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-purple-500/30 text-xs font-black text-purple-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20carregando%20ki.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Ki" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        if (lower === "dragon rush") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-green-500/30 text-xs font-black text-green-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20dragon%20rush.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Dragon Rush" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        if (lower === "transformação" || lower === "transformar") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-indigo-500/30 text-xs font-black text-indigo-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20transforma%C3%A7%C3%A3o.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Transformação" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        if (lower === "dash" || lower === "esquivar" || lower === "esquiva") {
            return (
                <span key={index} className="inline-flex items-center gap-1 bg-stone-900/90 px-1.5 py-0.5 rounded-md border border-emerald-500/30 text-xs font-black text-emerald-400 font-sans mx-1 shadow-sm shrink-0">
                    <img src="/Assets/icones%20ui/icone%20dash.png" className="w-4 h-4 object-contain select-none pointer-events-none" alt="Dash" referrerPolicy="no-referrer" />
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

export const PreloadScreen: React.FC = () => {
    const { changeScene, t } = useSceneManager();
    const [progress, setProgress] = useState(0);
    const [tip, setTip] = useState("");
    const [tipCategory, setTipCategory] = useState("");
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // Core Audio downloading states
    const [coreAudioInstalled, setCoreAudioInstalled] = useState(false);
    const [downloadProg, setDownloadProg] = useState<DownloadProgress>({
        packId: 'core_audio',
        bytesTotal: 47185920, // 45MB
        bytesDownloaded: 0,
        percentage: 0,
        speedMBs: 0,
        etaSeconds: 0,
        status: 'idle',
        retryCount: 0
    });
    
    // System sounds download states (ready, fight, ko)
    const [systemSoundsReady, setSystemSoundsReady] = useState(false);
    const [systemSoundsPct, setSystemSoundsPct] = useState(0);
    const [systemSoundsStatusText, setSystemSoundsStatusText] = useState(t('preload_awaiting_verification') || "Aguardando verificação do sistema...");
    const [systemSoundsError, setSystemSoundsError] = useState<string | null>(null);

    const [networkLoss, setNetworkLoss] = useState(false);
    const [extractorLog, setExtractorLog] = useState(t('preload_awaiting_verification') || "Aguardando verificação do sistema...");
    const transitioning = useRef(false);

    // Tip rotation effect
    useEffect(() => {
        const updateTip = () => {
            const randomTipObj = TipsManager.getRandomTip();
            const tipPrefix = t('preload_tip_prefix') || "Dica:";
            setTip(`${tipPrefix} ${TipsManager.getFormattedTipText(randomTipObj)}`);
            setTipCategory(randomTipObj.category);
        };

        updateTip();
        const interval = setInterval(updateTip, 5000);
        return () => clearInterval(interval);
    }, [t]);

    // Initial check and boot flow
    useEffect(() => {
        const checkAndLoad = async () => {
            // STEP 1: Verify Core Audio Pack
            const isInstalled = ManifestManager.isPackInstalled('core_audio');
            setCoreAudioInstalled(isInstalled);

            if (!isInstalled) {
                console.log("[DEBUG_AUDIO] Core Audio missing! Auto-launching download flow...");
                triggerCoreAudioDownload();
            } else {
                // Proceed to system sounds check and load
                loadSystemSoundsAndAssets();
            }
        };

        checkAndLoad();
    }, []);

    // Subscribe to download updates of Core Audio
    useEffect(() => {
        const unsubscribe = DownloadManager.subscribe('core_audio', (prog) => {
            setDownloadProg(prog);
            
            // Feed extractor file logs realistically during extraction phase
            if (prog.status === 'unpacking') {
                const logs = [
                    t('preload_verifying_downloaded') || "Verificando arquivos baixados...",
                    `${t('preload_extracting_file') || "Extraindo"} audio/core/menu_music.ogg...`,
                    `${t('preload_extracting_file') || "Extraindo"} audio/core/battle_music.ogg...`,
                    `${t('preload_extracting_file') || "Extraindo"} audio/core/announcer_ready.ogg...`,
                    `${t('preload_extracting_file') || "Extraindo"} audio/core/click.ogg...`,
                    `${t('preload_extracting_file') || "Extraindo"} audio/core/punch.ogg...`,
                    t('preload_registering_effects') || "Registrando pacotes de efeitos essenciais...",
                    t('preload_indexing_local') || "Indexando arquivos locais..."
                ];
                let currentLogIndex = 0;
                const interval = setInterval(() => {
                    if (currentLogIndex < logs.length) {
                        setExtractorLog(logs[currentLogIndex]);
                        currentLogIndex++;
                    } else {
                        clearInterval(interval);
                    }
                }, 100);
                return () => clearInterval(interval);
            }
        });

        return () => unsubscribe();
    }, []);

    // Watch for download completions of core_audio to load system sounds & static assets
    useEffect(() => {
        if (downloadProg.status === 'completed' && !coreAudioInstalled) {
            setCoreAudioInstalled(true);
            loadSystemSoundsAndAssets();
        }
    }, [downloadProg.status, coreAudioInstalled]);

    const triggerCoreAudioDownload = () => {
        DownloadManager.startDownload('core_audio');
    };

    const loadSystemSoundsAndAssets = async () => {
        try {
            setSystemSoundsError(null);
            setSystemSoundsStatusText(t('preload_verifying_integrity') || "Verificando integridade dos áudios...");
            
            // STEP 2: Verify existing system sounds Offline Cache
            const downloadManager = AudioDownloadManager.getInstance();
            const alreadyCached = await downloadManager.verifyAndPreloadAll();
            
            if (alreadyCached) {
                console.log("[DEBUG_AUDIO] All system sounds ready locally in RAM.");
                setSystemSoundsReady(true);
                setSystemSoundsPct(100);
                
                // STEP 3: Preload standard static assets
                await loadStaticAssets();
                return;
            }

            // If not cached, start downloading mandatory sounds
            setSystemSoundsStatusText(t('preload_downloading_system') || "Baixando sons do sistema...");
            
            // Subscribe to system sounds download progress
            const unsubscribe = downloadManager.subscribe((statusMap, overallPct) => {
                setSystemSoundsPct(overallPct);
                
                let systemFailed = false;
                let errMsg = "";
                let isVerifying = false;
                
                statusMap.forEach(st => {
                    if (st.status === 'failed') {
                        systemFailed = true;
                        errMsg = st.error || t('preload_network_error_sfx') || "Erro de rede ao baixar efeitos.";
                    }
                    if (st.status === 'verifying') {
                        isVerifying = true;
                    }
                });

                if (systemFailed) {
                    setSystemSoundsStatusText(t('preload_failed_download_system') || "Falha ao baixar sons do sistema.");
                    setSystemSoundsError(errMsg);
                } else if (isVerifying) {
                    setSystemSoundsStatusText(t('res_loading') || "Carregando áudio...");
                } else if (overallPct < 100) {
                    setSystemSoundsStatusText(`${t('preload_downloading_system') || "Baixando sons do sistema..."} (${overallPct}%)...`);
                } else {
                    setSystemSoundsStatusText(t('preload_success_system') || "Sons do sistema carregados com sucesso!");
                }
            });

            // Start actual download of system sounds
            const downloadSuccess = await downloadManager.startDownloadAll();
            unsubscribe();

            if (downloadSuccess) {
                setSystemSoundsReady(true);
                setSystemSoundsError(null);
                // Proceed to assets load
                await loadStaticAssets();
            } else {
                setSystemSoundsStatusText(t('preload_failed_download_system') || "Falha ao baixar sons do sistema.");
                setSystemSoundsError(t('preload_persistent_connection_error') || "Erro de conexão persistente. Por favor, verifique sua conexão e tente novamente.");
            }

        } catch (e: any) {
            console.error("[DEBUG_AUDIO] Boot audio sequence error:", e);
            setSystemSoundsStatusText(t('preload_error_init_sound') || "Erro ao inicializar som.");
            setSystemSoundsError(e?.message || t('preload_internal_decoding_error') || "Ocorreu um erro interno durante a decodificação.");
        }
    };

    const loadStaticAssets = async () => {
        setSystemSoundsStatusText(t('preload_preparing_battle') || "Preparando batalha...");
        await AssetManager.getInstance().preloadAllAssets((pct) => {
            setProgress(prev => Math.max(prev, pct));
        });
        setAssetsLoaded(true);
    };
    
    // Toggle simulated internet loss (gives preview testers a brilliant sandbox dial)
    const toggleInternetLossSimulator = () => {
        const nextState = !networkLoss;
        setNetworkLoss(nextState);
        DownloadManager.setSimulatedNetworkLoss(nextState);
    };

    // Auto navigate once preload is ready (both core audio, system sounds and static assets are fully loaded)
    useEffect(() => {
        if (coreAudioInstalled && systemSoundsReady && assetsLoaded && !transitioning.current) {
            transitioning.current = true;
            setTimeout(() => {
                changeScene(SceneName.SPLASH_SCREEN);
            }, 1000);
        }
    }, [coreAudioInstalled, systemSoundsReady, assetsLoaded, changeScene]);

    return (
        <div className="absolute inset-0 z-[1000] bg-stone-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none text-stone-200">
            {/* Ambient Backgrounds */}
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-orange-600 opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[40vw] bg-orange-600 opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-950/20 via-transparent to-transparent"></div>
            </div>

            {/* Top Toolbar: Sandbox Connectivity Simulator Card */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                <button
                    onClick={toggleInternetLossSimulator}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                        networkLoss
                            ? 'bg-red-950/80 border-red-500 text-red-100 hover:bg-red-900'
                            : 'bg-stone-900/90 border-stone-700 text-slate-300 hover:border-orange-500'
                    }`}
                >
                    {networkLoss ? (
                        <>
                            <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                            <span>Simulador: Internet OFF</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span>Simular Queda de Conexão</span>
                        </>
                    )}
                </button>
            </div>

            {/* Main Content Card Container */}
            <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
                
                {/* 1. CORE AUDIO DOWNLOAD VIEW (MANDATORY ON BOOT) */}
                {!coreAudioInstalled ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full bg-[#0d0f14] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500 animate-[pulse_2s_infinite]" style={{ width: `${downloadProg.percentage}%` }} />
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-white/5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                                    <h2 className="text-xl font-black uppercase italic tracking-wider text-orange-400">INSTALAÇÃO OBRIGATÓRIA</h2>
                                </div>
                                <h3 className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Core Audio Pack (Efeitos de Batalha, Announcer & Interface)</h3>
                            </div>
                            
                            <div className="bg-stone-900 border border-white/5 px-4 py-2 rounded-xl text-right shrink-0">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">Tamanho</span>
                                <span className="text-sm font-black text-slate-300">45 MB total</span>
                            </div>
                        </div>

                        {/* Middle Info / Visual progress graph */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            
                            {/* Byte size indicator */}
                            <div className="bg-stone-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-1">Status de Rede</span>
                                {downloadProg.status === 'unstable_network' || downloadProg.status === 'retrying' ? (
                                    <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase animate-pulse">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Rede Instável ({downloadProg.retryCount}/3)</span>
                                    </div>
                                ) : downloadProg.status === 'unpacking' ? (
                                    <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase">
                                        <Activity className="w-4 h-4 animate-spin" />
                                        <span>Extraindo Arquivos</span>
                                    </div>
                                ) : downloadProg.status === 'verifying_hash' ? (
                                    <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase animate-pulse">
                                        <Shield className="w-4 h-4" />
                                        <span>Garantindo Integridade</span>
                                    </div>
                                ) : (
                                    <div className="text-xs text-stone-200 font-bold flex items-center gap-2">
                                        <Wifi className="w-4 h-4 text-emerald-400" />
                                        <span>Download Ativo (4G/Wi-Fi)</span>
                                    </div>
                                )}
                            </div>

                            {/* Download Rate indicator */}
                            <div className="bg-stone-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-1">Velocidade</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black italic text-white leading-none">
                                        {downloadProg.status === 'downloading' ? downloadProg.speedMBs : '0'}
                                    </span>
                                    <span className="text-xs text-orange-500 font-bold uppercase">MB/s</span>
                                </div>
                            </div>

                            {/* Time remaining */}
                            <div className="bg-stone-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-1">{t('strike_pass_time_remaining') || "Tempo Restante"}</span>
                                <div className="text-slate-300 font-bold text-sm">
                                    {downloadProg.status === 'downloading'
                                        ? `${downloadProg.etaSeconds} ${t('preload_seconds') || "segundos"}`
                                        : downloadProg.status === 'unpacking'
                                        ? (t('preload_minutes') || 'Minutos...')
                                        : '--'}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Extractor Console Logs ticker */}
                        <div className="bg-black/90 p-4 rounded-xl border border-white/5 mb-6 text-left relative overflow-hidden">
                            <span className="text-[8px] font-black tracking-wider text-orange-500/80 uppercase block mb-1.5 font-mono">{t('preload_extraction_terminal_simulator') || "Simulador de Terminal de Extração:"}</span>
                            <div className="font-mono text-[10px] text-emerald-400/90 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{downloadProg.status === 'downloading' ? `${t('preload_downloading_data_chunks') || "Baixando chunks de dados"} [${Math.round(downloadProg.bytesDownloaded / 1024 / 1024)}MB / 45MB]...` : extractorLog}</span>
                            </div>
                        </div>

                        {/* Progress Bar Gauge */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">{t('preload_core_audio_progress') || "Progresso do Core Audio"}</span>
                                <span className="text-3xl font-black italic text-orange-500">
                                    {downloadProg.percentage}%
                                </span>
                            </div>
                            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div 
                                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400"
                                    animate={{ width: `${downloadProg.percentage}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>

                        {/* Connection drop & failure prompt */}
                        {downloadProg.status === 'failed' && (
                            <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-red-200 font-bold">{downloadProg.error}</p>
                                <button
                                    onClick={triggerCoreAudioDownload}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase italic tracking-wider shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {t('preload_reinstall_pack') || "Reinstalar pacote"}
                                </button>
                            </div>
                        )}
                        
                    </motion.div>
                ) : (
                    
                    /* 2. STANDARD STATIC LOGO & LOADING BAR (FOR CORE BOOT / SYSTEM SOUNDS) */
                    <div className="w-full max-w-4xl px-12 flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mb-14 relative"
                        >
                            <Zap className="absolute -top-12 -left-12 w-24 h-24 text-orange-500/20 animate-pulse" />
                            <h1 className="text-8xl font-black italic text-white tracking-tighter uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                                {!systemSoundsReady ? (t('preload_audio_loading_title') || "ÁUDIO") : (t('res_loading_uppercase') || "CARREGANDO")}<span className="text-orange-500 animate-pulse">...</span>
                            </h1>
                            <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                        </motion.div>

                        <div className="w-full space-y-6">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
                                    <span className="text-xs font-black text-slate-400 separator uppercase tracking-[0.2em]">
                                        {!systemSoundsReady 
                                            ? (t('preload_downloading_mandatory_sfx') || "BAIXANDO SONS DO SISTEMA OBRIGATÓRIOS") 
                                            : (t('preload_preparing_battle_resources') || "PREPARANDO BATALHA E RECURSOS")
                                        }
                                    </span>
                                </div>
                                <span className="text-4xl font-black italic text-white tracking-tighter">
                                    {!systemSoundsReady ? Math.round(systemSoundsPct) : Math.round(progress)}
                                    <span className="text-sm text-orange-500 ml-1">%</span>
                                </span>
                            </div>

                            <div className="relative h-4.5 w-full bg-[#0d0f14] border border-white/5 skew-x-[-12deg] overflow-hidden p-0.5 rounded-sm">
                                <motion.div 
                                    className="h-full rounded-sm bg-gradient-to-r from-orange-600 via-orange-400 to-slate-200"
                                    animate={{ width: `${!systemSoundsReady ? systemSoundsPct : progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            {/* Additional status text feedback */}
                            <div className="text-left font-mono text-[11px] text-zinc-400 pl-2">
                                <span className="text-orange-500 font-bold mr-1.5">&gt;</span> 
                                {systemSoundsStatusText}
                            </div>

                            {/* Connection failure state for system sounds */}
                            {systemSoundsError && (
                                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                                    <div>
                                        <p className="text-xs text-red-200 font-bold">{t('preload_transmission_failure') || "Falha de Transmissão"}</p>
                                        <p className="text-[10px] text-red-300/80 mt-0.5">{systemSoundsError}</p>
                                    </div>
                                    <button
                                        onClick={loadSystemSoundsAndAssets}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase italic tracking-wider shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        {t('res_retry') || "Tentar Novamente"}
                                    </button>
                                </div>
                            )}

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={tip}
                                className="bg-white/5 border-l-4 border-orange-500 p-6 skew-x-[-12deg] relative"
                            >
                                <div className="absolute top-0 right-0 px-3 py-1 bg-orange-600 skew-x-[12deg] text-[10px] font-black uppercase tracking-widest text-white translate-y-[-50%] translate-x-[10px]">
                                    {tipCategory}
                                </div>
                                <div className="skew-x-[12deg] flex gap-4 items-start">
                                    <Cpu className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
                                    <p className="text-base font-bold text-slate-300 italic leading-relaxed text-left flex flex-wrap items-center gap-y-1">
                                        {renderTextWithSprites(tip)}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Footer Info */}
            <div className="absolute bottom-8 left-8 flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 border border-white/10 flex items-center justify-center skew-x-[-12deg]">
                    <Shield className="w-5 h-5 skew-x-[12deg]" />
                </div>
                <div className="text-left">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FIGHTER LEGEND ONE 1</p>
                </div>
            </div>
        </div>
    );
};
