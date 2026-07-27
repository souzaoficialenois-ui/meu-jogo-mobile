// ResourceDownloadScreen.tsx - Ultra-clean minimalist download & loading scene.
// Crafted with absolute focus on user-specified requirements: only background, game logo, status texts ("Carregando", "Verificando", "Integridade") and progress bar.
import React, { useEffect, useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { DownloadManager, DownloadsOverallProgress } from '../../services/DownloadManager';
import { FirstLaunchManager } from '../../services/FirstLaunchManager';
import { VersionManager } from '../../services/VersionManager';
import { AssetFile } from '../../services/ManifestManager';
import { motion } from 'framer-motion';
import { SceneName } from '../../types';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { TipsManager } from '../../services/TipsManager';

export const ResourceDownloadScreen: React.FC = () => {
  const { changeScene, startBattleTransition, t } = useSceneManager();
  
  // Progress states
  const [downloadProgress, setDownloadProgress] = useState<DownloadsOverallProgress>({
    totalFiles: 0,
    completedFiles: 0,
    bytesTotal: 0,
    bytesDownloaded: 0,
    percentage: 0,
    speedMBs: 0,
    etaSeconds: 0,
    status: 'idle',
    isOnline: navigator.onLine
  });

  const [checkingState, setCheckingState] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [tip, setTip] = useState("");
  const [tipCategory, setTipCategory] = useState("");

  // Tip rotation effect
  useEffect(() => {
    const updateTip = () => {
      const randomTipObj = TipsManager.getRandomTip();
      const tipPrefix = t('preload_tip_prefix') || "Dica:";
      setTip(`${tipPrefix} ${TipsManager.getFormattedTipText(randomTipObj)}`);
      setTipCategory(randomTipObj.category);
    };

    updateTip();
    const interval = setInterval(updateTip, 6000);
    return () => clearInterval(interval);
  }, [t]);

  // Sparking particle trailing state
  const [particles, setParticles] = useState<Array<{
    id: number;
    y: number;
    size: number;
    color: string;
    duration: number;
    speedX: number;
    speedY: number;
  }>>([]);

  // Generate trailing sparking particles in a loop while downloading
  useEffect(() => {
    if (checkingState || downloadProgress.status === 'completed' || downloadProgress.percentage >= 100) {
      if (particles.length > 0) {
        setParticles([]);
      }
      return;
    }

    const interval = setInterval(() => {
      const count = Math.random() > 0.4 ? 2 : 1;
      const newParticles = Array.from({ length: count }).map(() => ({
        id: Math.random(),
        y: (Math.random() - 0.5) * 14,
        size: Math.random() * 4 + 2,
        color: ['#f97316', '#fbbf24', '#facc15', '#ef4444', '#ffffff'][Math.floor(Math.random() * 5)],
        duration: Math.random() * 0.4 + 0.3,
        speedX: -(Math.random() * 50 + 40),
        speedY: (Math.random() - 0.5) * 16,
      }));

      setParticles((prev) => {
        const kept = prev.slice(-30);
        return [...kept, ...newParticles];
      });
    }, 70);

    return () => clearInterval(interval);
  }, [downloadProgress.percentage, downloadProgress.status, checkingState]);

  // Sync initial setup - Compare files & prepare the download queue
  const verifyFilesAndInit = async () => {
    try {
      setCheckingState(true);
      setShowOfflineNotice(false);

      // Verify Internet Connection
      if (!navigator.onLine) {
        if (FirstLaunchManager.isFirstLaunch()) {
          setShowOfflineNotice(true);
          setCheckingState(false);
          setDownloadProgress(prev => ({ ...prev, status: 'no_internet' }));
          return;
        } else {
          // Play offline in subsequent loads since baseline files already exist
          setDownloadProgress({
            totalFiles: 0,
            completedFiles: 0,
            bytesTotal: 0,
            bytesDownloaded: 0,
            percentage: 100,
            speedMBs: 0,
            etaSeconds: 0,
            status: 'completed',
            isOnline: false
          });
          setCheckingState(false);
          setTimeout(() => {
            handleEnterGame();
          }, 1200);
          return;
        }
      }

      // 1. Get altered/missing files to build queue
      const alteredFiles = await VersionManager.getAlteredOrMissingFiles();

      if (alteredFiles.length === 0) {
        // No downloads needed! Set percentage to 100% and transition safely in 1.2s
        setDownloadProgress({
          totalFiles: 0,
          completedFiles: 0,
          bytesTotal: 0,
          bytesDownloaded: 0,
          percentage: 100,
          speedMBs: 0,
          etaSeconds: 0,
          status: 'completed',
          isOnline: true
        });
        setCheckingState(false);
        setTimeout(() => {
          handleEnterGame();
        }, 1200);
        return;
      }

      // 2. Prepare Download Queue
      await DownloadManager.prepareQueue(alteredFiles);
      setCheckingState(false);
      
      // Auto-start download queue for smooth instant download without user action
      setTimeout(() => {
        DownloadManager.startQueue();
      }, 500);
    } catch (err: any) {
      console.error("Initialization error:", err);
      setCheckingState(false);
      
      if (!FirstLaunchManager.isFirstLaunch()) {
        console.log("Could not query update manifest, but first launch is complete. Proceeding offline.");
        setDownloadProgress({
          totalFiles: 0,
          completedFiles: 0,
          bytesTotal: 0,
          bytesDownloaded: 0,
          percentage: 100,
          speedMBs: 0,
          etaSeconds: 0,
          status: 'completed',
          isOnline: false
        });
        setTimeout(() => {
          handleEnterGame();
        }, 1200);
        return;
      }

      // For first launch, network failure behaves as offline warning
      setShowOfflineNotice(true);
    }
  };

  // Run initial checklist and subscribe to queue events on mount
  useEffect(() => {
    verifyFilesAndInit();
    
    const unsubscribe = DownloadManager.subscribeToQueue((state) => {
      setDownloadProgress(state);
      
      // Keep trying to resume if there's any temporary error state
      if (state.status === 'errored' || state.status === 'no_internet') {
        const timeout = setTimeout(() => {
          if (navigator.onLine) {
            DownloadManager.resumeQueue();
          } else {
            if (FirstLaunchManager.isFirstLaunch()) {
              setShowOfflineNotice(true);
            }
          }
        }, 3000);
        return () => clearTimeout(timeout);
      }

      // Auto transition when complete
      if (state.status === 'completed') {
        setTimeout(() => {
          handleEnterGame();
        }, 1200);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleEnterGame = () => {
    // 1. Mark first launch completed
    FirstLaunchManager.markFirstLaunchCompleted();
    
    // 2. Save current game version
    VersionManager.saveLocalVersion(VersionManager.getRemoteVersion());

    // 3. Transition to the dynamic game entry flow
    startBattleTransition();
  };

  // Status text tailored to what the user explicitly requested: shows "Carregando", "Verificando", "Integridade"
  const getProgressLabel = () => {
    if (checkingState) {
      return t('res_verifying') || "Verificando...";
    }
    
    switch (downloadProgress.status) {
      case 'idle':
        return t('res_loading') || "Carregando...";
      case 'preparing':
        return t('res_verifying') || "Verificando...";
      case 'downloading':
        return t('res_loading') || "Carregando...";
      case 'validating':
        return t('res_verifying_integrity') || "Verificando integridade...";
      case 'paused':
        return t('res_awaiting_conn') || "Aguardando conexão...";
      case 'completed':
        return t('res_integrity_confirmed') || "Integridade confirmada!";
      case 'no_internet':
        return t('res_checking_internet') || "Verificando internet...";
      case 'errored':
        return t('res_loading') || "Carregando...";
      default:
        return t('res_loading') || "Carregando...";
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] bg-black text-slate-100 flex flex-col justify-center items-center overflow-hidden select-none font-sans">
      
      {/* Pristine high resolution background wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-[0.8] saturate-[1.1] scale-100 pointer-events-none"
        style={{ backgroundImage: `url('/Assets/fundosdastelas/modos/m1.png')` }}
      />

      {/* Radial soft shade overlay to integrate elements comfortably */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Main Core Container: Game Logo (Center) and Loader (Bottom Center) */}
      <div className="flex flex-col items-center justify-between h-full max-h-[500px] w-full max-w-[600px] px-6 py-8 z-10">
        
        {/* Spacer top */}
        <div />

        {/* Center Game Logo */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative max-w-[450px] aspect-[16/9] flex justify-center items-center"
        >
          {/* Gentle aesthetic back glow */}
          <div className="absolute w-[200px] h-[60px] bg-orange-500/15 rounded-full blur-[65px] pointer-events-none animate-pulse" />
          
          <img 
            src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
            alt="Fighter Legend One 1 Logo" 
            className="w-full object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] filter brightness-[1.05]" 
          />
        </motion.div>

        {/* Bottom Loading Bar and cleanly aligned dynamic status text */}
        <div className="w-full flex flex-col items-center gap-3 mb-4">
          {showOfflineNotice ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-stone-950/95 border border-orange-500/30 rounded-xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 animate-pulse">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-orange-500 text-sm font-bold tracking-widest uppercase font-sans">
                {t('res_connection_required') || "Conexão Necessária"}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed max-w-sm">
                {t('res_first_boot_warning') || "Aviso: Na primeira abertura do jogo, você deve estar conectado à internet de forma obrigatória para baixar os recursos necessários! Por favor, ative o Wi-Fi ou dados móveis e tente novamente."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    AudioManager.getInstance().playSFX('click');
                  } catch (_) {}
                  verifyFilesAndInit();
                }}
                className="mt-1 px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-bold tracking-widest rounded-lg shadow-md hover:shadow-orange-500/20 transition-all font-sans uppercase border border-orange-400/20 cursor-pointer"
              >
                {t('res_retry') || "Tentar Novamente"}
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Centered label showing strictly customized texts "Carregando", "Verificando", "Verificando integridade..." */}
              <span className="text-sm font-sans text-stone-200 font-bold tracking-wide italic drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]">
                {getProgressLabel()}
              </span>

              {/* Clean Rounded High-End Progress Bar with Energy Trails */}
              <div className="w-full h-3.5 bg-black/80 rounded-full border border-stone-800/40 relative flex items-center p-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-visible">
                {/* Subtle running background layout shimmer */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating energy glow outline */}
                <div className="absolute -inset-[1px] rounded-full border border-orange-500/20 animate-pulse pointer-events-none" />

                {/* Inner progress tube */}
                <div className="w-full h-full rounded-full relative overflow-hidden flex items-center">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${downloadProgress.percentage}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-300 relative "
                  >
                    {/* Running energy sweep highlight */}
                    <motion.div 
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                      className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                  </motion.div>
                </div>

                {/* Particle emitter & ki orb flare tracking at the edge tip */}
                <motion.div 
                  className="absolute pointer-events-none z-20 flex items-center justify-center overflow-visible"
                  style={{ left: `${downloadProgress.percentage}%` }}
                  animate={{ scale: [0.95, 1.15, 0.95] }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                >
                  {downloadProgress.percentage > 0 && downloadProgress.percentage <= 100 && (
                    <>
                      {/* Active glowing core particle head */}
                      <div className="w-3.5 h-3.5 rounded-full bg-white  absolute" />
                      <div className="w-7 h-7 rounded-full bg-orange-400/20 blur-[2px]  absolute animate-ping" style={{ animationDuration: '1.2s' }} />
                      
                      {/* Trail of spark particles flowing leftwards */}
                      {particles.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ x: 0, y: p.y, opacity: 1, scale: 1 }}
                          animate={{ x: p.speedX, y: p.y + p.speedY, opacity: 0, scale: 0 }}
                          transition={{ duration: p.duration, ease: "easeOut" }}
                          className="absolute rounded-full pointer-events-none "
                          style={{
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            color: p.color,
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              </div>

              {/* Aesthetic tiny percent subtitle if downloading */}
              {downloadProgress.percentage > 0 && downloadProgress.percentage < 100 && (
                <span className="text-[10px] font-mono text-stone-400 mt-0.5 tracking-wider">
                  {downloadProgress.percentage}%
                </span>
              )}

              {/* Dynamic Tip Section */}
              <motion.div 
                key={tip}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 px-4 py-3 bg-white/5 border border-white/5 rounded-xl max-w-sm relative"
              >
                <div className="absolute top-0 left-4 px-2 py-0.5 bg-orange-600 text-[8px] font-black uppercase tracking-widest text-white translate-y-[-50%] rounded-sm">
                  {tipCategory}
                </div>
                <p className="text-[11px] font-bold text-stone-300 italic text-center leading-relaxed">
                  {tip}
                </p>
              </motion.div>
            </>
          )}
        </div>

      </div>

    </div>
  );
};
export default ResourceDownloadScreen;
