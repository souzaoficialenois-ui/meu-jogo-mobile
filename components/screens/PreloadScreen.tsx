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
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center select-none overflow-hidden font-mono text-white pointer-events-none"
        >
            <div className="flex flex-col items-center justify-center gap-3">
                <span className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-white">
                    CARREGANDO...
                </span>
                <span className="text-4xl md:text-5xl font-black italic text-white tracking-widest">
                    {!coreAudioInstalled 
                        ? downloadProg.percentage 
                        : (!systemSoundsReady ? Math.round(systemSoundsPct) : Math.round(progress))}%
                </span>
            </div>

            {/* Error state if connection fails */}
            {(downloadProg.status === 'failed' || systemSoundsError) && (
                <div className="mt-8 flex flex-col items-center gap-3 pointer-events-auto">
                    <p className="text-xs text-red-400 font-bold max-w-md text-center">
                        {downloadProg.error || systemSoundsError}
                    </p>
                    <button
                        onClick={!coreAudioInstalled ? triggerCoreAudioDownload : loadSystemSoundsAndAssets}
                        className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        {t('res_retry') || "Tentar Novamente"}
                    </button>
                </div>
            )}
        </motion.div>
    );
};
