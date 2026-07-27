import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSceneManager } from "../../contexts/SceneContext";
import { SceneName } from "../../types";
import { SpriteRenderer } from "../../services/SpriteRenderer";
import { STAGE_DB } from "../../constants/StageDatabase";
import { ManifestManager } from "../../services/ManifestManager";
import { AudioCacheManager } from "../../services/AudioCacheManager";
import { TipsManager } from "../../services/TipsManager";
import { db } from "../../services/firebase";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useUI } from "../../contexts/UIContext";
import { AVATAR_LIST, RESOURCE_SPRITES } from "../../constants";
import { KiParticles } from "../KiParticles";
import { NetworkManager } from "../../services/NetworkManager";


const renderTextWithSprites = (text: string, s: (v: number) => number) => {
  const regex = /(Ataques Especiais|Ataque Especial|especiais|especial|Especiais|Especial|Special Attacks|Special Attack|specials|special|Specials|Block|Defense|defend|Bloquear|Bloqueio|defesa|Defesa|botões de ataque|ataques|ataque|attack buttons|attacks|attack|Carregar Ki|Charge Ki|Ki|Dragon Rush|Transformação|Transformar|Transformation|Transform|Dash|esquivar|esquiva|Esquivar|Esquiva|Dodge|dodging|dodges)/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (!part) return null;
    const lower = part.toLowerCase();
    if (lower === "bloquear" || lower === "bloqueio" || lower === "defesa" || lower === "block" || lower === "defense" || lower === "defend") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-blue-500/30 font-black text-blue-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20defeza.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Defesa" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    if (lower === "ataque especial" || lower === "especial" || lower === "especiais" || lower === "ataques especiais" || lower === "special attack" || lower === "special" || lower === "specials" || lower === "special attacks") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-orange-500/30 font-black text-orange-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20especial.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Especial" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    if (lower === "botões de ataque" || lower === "ataques" || lower === "ataque" || lower === "attack buttons" || lower === "attacks" || lower === "attack") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-sky-500/30 font-black text-sky-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <span className="flex shrink-0" style={{ marginLeft: s(-4) }}>
            <img src="/Assets/icones%20ui/combo%20leve.png" className="object-contain select-none pointer-events-none" style={{ width: s(12), height: s(12) }} alt="Leve" referrerPolicy="no-referrer" />
            <img src="/Assets/icones%20ui/icone%20combo%20medio.png" className="object-contain select-none pointer-events-none" style={{ width: s(12), height: s(12) }} alt="Médio" referrerPolicy="no-referrer" />
            <img src="/Assets/icones%20ui/icone%20combo%20forte.png" className="object-contain select-none pointer-events-none" style={{ width: s(12), height: s(12) }} alt="Forte" referrerPolicy="no-referrer" />
          </span>
          {part}
        </span>
      );
    }
    if (lower === "carregar ki" || lower === "ki" || lower === "charge ki") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-purple-500/30 font-black text-purple-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20carregando%20ki.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Ki" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    if (lower === "dragon rush") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-green-500/30 font-black text-green-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20dragon%20rush.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Dragon Rush" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    if (lower === "transformação" || lower === "transformar" || lower === "transformation" || lower === "transform") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-indigo-500/30 font-black text-indigo-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20transforma%C3%A7%C3%A3o.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Transformação" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    if (lower === "dash" || lower === "esquivar" || lower === "esquiva" || lower === "dodge" || lower === "dodging" || lower === "dodges") {
      return (
        <span key={index} className="inline-flex items-center bg-stone-900/90 rounded border border-emerald-500/30 font-black text-emerald-400 font-sans mx-1 shadow-sm shrink-0" style={{ gap: s(4), padding: `${s(2)}px ${s(4)}px`, fontSize: s(9) }}>
          <img src="/Assets/icones%20ui/icone%20dash.png" className="object-contain select-none pointer-events-none" style={{ width: s(14), height: s(14) }} alt="Dash" referrerPolicy="no-referrer" />
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const VsScreen: React.FC = () => {
  const { s, sx, sy, getPos } = useUI();
  const { gameEngine, changeScene, selectionMode, t } = useSceneManager();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tipText, setTipText] = useState("");
  const [myLoadingComplete, setMyLoadingComplete] = useState(false);
  const [opponentLoadingComplete, setOpponentLoadingComplete] = useState(selectionMode !== 'ONLINE');
  const [onlineRoomData, setOnlineRoomData] = useState<any>(null);

  const p1TeamData = gameEngine?.p1Team.map((p) => p.data) || [];
  const p2TeamData = gameEngine?.p2Team.map((p) => p.data) || [];

  const roomId = localStorage.getItem("current_online_room_id");
  const isOnlineHost = localStorage.getItem("is_online_host") === "true";

  useEffect(() => {
    const randomTipObj = TipsManager.getRandomTip();
    setTipText(TipsManager.getFormattedTipText(randomTipObj));
    
    // Safety timer to force start if stuck for too long (8 seconds)
    const safetyTimer = setTimeout(() => {
        console.log("[VS] Safety timeout triggered. Attempting to force start battle.");
        setMyLoadingComplete(true);
        if (selectionMode === 'ONLINE') {
          setOpponentLoadingComplete(true);
        }
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, [selectionMode]);

  // Update my completion status when progress reaches 100
  useEffect(() => {
    if (progress >= 100 && !myLoadingComplete) {
      console.log("[VS] Local loading complete (100%)");
      setMyLoadingComplete(true);
    }
  }, [progress, myLoadingComplete]);

  // Throttled progress sync to Firestore
  const lastSyncedProgressRef = useRef<number>(-1);
  useEffect(() => {
    if (selectionMode !== 'ONLINE') return;
    if (!roomId) return;

    // Only update every 5% steps or at exactly 100%
    const shouldUpdate = 
      (progress === 100 && lastSyncedProgressRef.current !== 100) || 
      (progress >= lastSyncedProgressRef.current + 5);

    if (!shouldUpdate) return;

    const updateFirestoreProgress = async () => {
      try {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        const updateData: any = {};
        if (isOnlineHost) {
          updateData.hostLoadingProgress = progress;
        } else {
          updateData.guestLoadingProgress = progress;
        }
        
        await updateDoc(roomRef, updateData);
        lastSyncedProgressRef.current = progress;
        console.log(`[VS] Progress synced to Firestore: ${progress}%`);
      } catch (err) {
        console.error("[VS] Failed to update loading progress in Firestore:", err);
      }
    };

    updateFirestoreProgress();
  }, [progress, selectionMode, roomId, isOnlineHost]);

  useEffect(() => {
    if (selectionMode !== 'ONLINE') return;
    
    if (!roomId) {
      console.error("[VS] Room ID not found for ONLINE mode");
      return;
    }

    console.log(`[VS] Starting progress listener for Room: ${roomId}, isHost: ${isOnlineHost}`);

    const unsubscribe = onSnapshot(doc(db, 'online_rooms_v2', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const room = docSnap.data();
        setOnlineRoomData(room);
        const oppProgress = isOnlineHost ? (room.guestLoadingProgress || 0) : (room.hostLoadingProgress || 0);
        
        if (oppProgress >= 100 && !opponentLoadingComplete) {
          console.log(`[VS] Opponent loading complete detected via Firestore`);
          setOpponentLoadingComplete(true);
        }
      }
    }, (err) => {
      console.error("[VS] Error listening to room updates:", err);
    });

    return () => unsubscribe();
  }, [selectionMode, roomId, isOnlineHost, opponentLoadingComplete]);

  const [statusUpdated, setStatusUpdated] = useState(false);
  const net = NetworkManager.getInstance();
  const [isConnected, setIsConnected] = useState(net.connection?.open || false);

  useEffect(() => {
    // Save original callbacks
    const oldOnConnect = net.onConnect;
    const oldOnDisconnect = net.onDisconnect;

    net.onConnect = (isHost, peerId, profile) => {
      console.log(`[VS] Connection established with ${peerId}`);
      setIsConnected(true);
      if (oldOnConnect) oldOnConnect(isHost, peerId, profile);
    };

    net.onDisconnect = () => {
      console.warn("[VS] Connection lost");
      setIsConnected(false);
      if (oldOnDisconnect) oldOnDisconnect();
    };

    // Listen for P2P readiness message
    const oldOnReadyReceived = net.onReadyReceived;
    net.onReadyReceived = () => {
      console.log("[VS] Received P2P_READY from opponent");
      setOpponentLoadingComplete(true);
      if (oldOnReadyReceived) oldOnReadyReceived();
    };

    // Initial check
    setIsConnected(net.connection?.open || false);

    return () => {
      net.onConnect = oldOnConnect;
      net.onDisconnect = oldOnDisconnect;
      net.onReadyReceived = oldOnReadyReceived;
    };
  }, [net]);

  // Send P2P_READY when my loading is complete
  useEffect(() => {
    if (myLoadingComplete && isConnected) {
      console.log("[VS] Sending P2P_READY to opponent");
      net.sendReady();
    }
  }, [myLoadingComplete, isConnected, net]);

  const handleManualReconnect = () => {
    if (selectionMode !== 'ONLINE' || !onlineRoomData) return;
    const opponentPeerId = isOnlineHost ? onlineRoomData.guestPeerId : onlineRoomData.hostPeerId;
    if (opponentPeerId) {
      console.log(`[VS] Manually triggering reconnection to ${opponentPeerId}`);
      net.connectToPeer(opponentPeerId);
    }
  };

  useEffect(() => {
    // If both are complete, or we are in local modes and I am complete
    const canStart = selectionMode === 'ONLINE' 
      ? (myLoadingComplete && opponentLoadingComplete)
      : myLoadingComplete;

    if (canStart && !statusUpdated) {
      console.log("[VS] All systems ready. Triggering status update...");
      setLoading(false);
      setStatusUpdated(true);
      
      // Update room status to BATTLE if host
      if (selectionMode === "ONLINE" && isOnlineHost && roomId) {
        const roomRef = doc(db, 'online_rooms_v2', roomId);
        updateDoc(roomRef, { 
          status: 'BATTLE',
          updatedAt: serverTimestamp() 
        }).catch(err => console.error("[VS] Error updating room status to BATTLE:", err));
      }
    }
  }, [myLoadingComplete, opponentLoadingComplete, selectionMode, isOnlineHost, roomId, statusUpdated]);

  useEffect(() => {
    if (statusUpdated) {
      const targetScene = selectionMode === "TRAINING" ? SceneName.TRAINING : SceneName.BATTLE;
      console.log("[VS] Status updated. Navigating to battle in 1s...", targetScene);
      
      const timer = setTimeout(() => {
        console.log("[VS] Navigating now to:", targetScene);
        changeScene(targetScene);
      }, 1000); // 1 second delay to let players see the 100%
      
      return () => clearTimeout(timer);
    }
  }, [statusUpdated, selectionMode, changeScene]);

  useEffect(() => {
    let isMounted = true;

    const preloadBattleAssets = async () => {
      console.log("[VS] preloadBattleAssets started. gameEngine present:", !!gameEngine);
      
      // Reduzido para 300ms para permitir uma transição mais fluida sem sobrecarga imediata
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      if (!isMounted) return;

      const assetsToLoad = new Set<string>();
      const gifAssets = new Set<string>();

      // Preload the custom VS screen GIF sprite
      gifAssets.add(RESOURCE_SPRITES.vs);

      // Collect assets from all characters in the current teams
      const charsToLoad = [
        ...(gameEngine?.p1Team.map((p) => p.data) || []),
        ...(gameEngine?.p2Team.map((p) => p.data) || []),
      ];

      charsToLoad.forEach((char) => {
        if (char?.spriteConfig?.animations) {
          Object.values(char.spriteConfig.animations).forEach((anim: any) => {
            if (anim && anim.imageUrl) {
              if (anim.isGif) {
                gifAssets.add(anim.imageUrl);
              } else {
                assetsToLoad.add(anim.imageUrl);
              }
            }
          });
        }
        if (char?.spriteConfig?.portraitUrl)
          assetsToLoad.add(char.spriteConfig.portraitUrl);
      });

      // Stage background can also be preloaded if available in the future
      if (gameEngine?.stageTheme) {
        const stageInfo = STAGE_DB.find((s) => s.id === gameEngine.stageTheme);
        if (stageInfo && stageInfo.layers) {
          stageInfo.layers.forEach((layer) => {
            if (layer.img) {
              assetsToLoad.add(layer.img);
            }
          });
        }
      }

      // Special Voice Pack preloads to eliminate any sound intro lags/buffering during battle entrance
      const activeLang = ManifestManager.getActiveLanguage() || "pt_br";
      const isVoicePackInstalled = ManifestManager.isPackInstalled(activeLang);
      const audioPreloads: { playerObj: any; url: string }[] = [];

      if (isVoicePackInstalled && gameEngine) {
        const p1 = gameEngine.p1Team[0];
        const p2 = gameEngine.p2Team[0];

        if (p1 && p2) {
          // Goku Black Rose vs Goku Blue
          if (p1.data?.id === "goku_black_rose" && p2.data?.id === "goku_blue_gif") {
            audioPreloads.push({
              playerObj: p1,
              url: "/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE/INTRODU%C3%87%C3%83O/GOKU%20BLUE%20OPONENTE.m4a"
            });
          }
          if (p2.data?.id === "goku_black_rose" && p1.data?.id === "goku_blue_gif") {
            audioPreloads.push({
              playerObj: p2,
              url: "/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE/INTRODU%C3%87%C3%83O/GOKU%20BLUE%20JOGADOR.m4a"
            });
          }

          // Goku Blue vs Goku Black Rose
          if (p1.data?.id === "goku_blue_gif" && p2.data?.id === "goku_black_rose") {
            audioPreloads.push({
              playerObj: p1,
              url: "/Assets/SONS/DUBLAGEM/GOKU%20BLUE/Intro%20contra%20Black%20Rose.ogg"
            });
          }
          if (p2.data?.id === "goku_blue_gif" && p1.data?.id === "goku_black_rose") {
            audioPreloads.push({
              playerObj: p2,
              url: "/Assets/SONS/DUBLAGEM/GOKU%20BLUE/Intro%20contra%20Black%20Rose.ogg"
            });
          }
        }
      }

      const totalAssets = assetsToLoad.size + gifAssets.size + audioPreloads.length;
      let loadedAssets = 0;

      const updateProgress = () => {
        loadedAssets++;
        if (isMounted)
          setProgress(Math.floor((loadedAssets / (totalAssets || 1)) * 100));
      };

      const animMgr = SpriteRenderer.getInstance();

      const loadPromises: Promise<void>[] = [];

      // Preload special voice Audio lines directly during the VS match loading screen with non-blocking timeout protection
      audioPreloads.forEach((preload) => {
        const audioCtx = AudioCacheManager.getInstance().getAudioContext();

        loadPromises.push(
          new Promise<void>(async (resolve) => {
            let completed = false;

            const timeoutId = setTimeout(() => {
              if (completed) return;
              completed = true;
              console.warn(`[DEBUG_AUDIO] Timeout loading intro voice: ${preload.url}`);
              updateProgress();
              resolve();
            }, 3000); // 3.0s max load timeout limit to prevent freezes

            try {
              if (!audioCtx) throw new Error("No AudioContext context found");
              
              const res = await fetch(preload.url);
              if (!res.ok) throw new Error(`HTTP fetch error status ${res.status}`);
              
              const arrayBuf = await res.arrayBuffer();
              const decoded = await new Promise<AudioBuffer>((resDec, rejDec) => {
                try {
                  const p = audioCtx.decodeAudioData(
                    arrayBuf,
                    (b) => resDec(b),
                    (err) => {
                      console.warn("[DEBUG_AUDIO] decodeAudioData callback error:", err);
                      rejDec(err);
                    }
                  );
                  if (p && typeof p.catch === 'function') {
                    p.catch((err) => {
                      console.warn("[DEBUG_AUDIO] decodeAudioData promise rejection caught:", err);
                      rejDec(err);
                    });
                  }
                } catch (err) {
                  console.warn("[DEBUG_AUDIO] decodeAudioData synchronous exception:", err);
                  rejDec(err);
                }
              });
              
              preload.playerObj.preloadedIntroVoiceBuffer = decoded;
              console.log(`[DEBUG_AUDIO] Successfully pre-decoded intro voice: ${preload.url}`);
            } catch (err) {
              console.warn(`[DEBUG_AUDIO] Failed to pre-decode intro voice, skipping:`, err);
            } finally {
              clearTimeout(timeoutId);
              if (!completed) {
                completed = true;
                updateProgress();
                resolve();
              }
            }
          })
        );
      });

      // Load static images
      assetsToLoad.forEach((url) => {
        loadPromises.push(
          animMgr
            .loadTextureAsync(url)
            .then(() => {
              updateProgress();
            })
            .catch(() => {
              updateProgress();
            }),
        );
      });

      // Load GIFs via SpriteRenderer
      gifAssets.forEach((url) => {
        loadPromises.push(
          animMgr
            .loadGif(url)
            .then(() => {
              updateProgress();
            })
            .catch(() => {
              updateProgress();
            }),
        );
      });

      // Minimum display time for the VS screen impact (1.5 seconds)
      const minTimePromise = new Promise<void>((resolve) =>
        setTimeout(resolve, 1500),
      );

      await Promise.all([...loadPromises, minTimePromise]);

      if (isMounted) {
        setProgress(100);
        setMyLoadingComplete(true);
      }
    };

    if (gameEngine) preloadBattleAssets();

    return () => {
      isMounted = false;
    };
  }, [changeScene, gameEngine]);

  const stageThemeId = gameEngine?.stageTheme;
  const stageInfo = STAGE_DB.find((s) => s.id === stageThemeId);

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-y-auto flex flex-col justify-start items-center select-none font-sans" style={{ padding: `${s(32)}px 0` }}>
      
      {/* 1. CINEMATIC STAGE BACKDROP PREVIEW */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Ki particles overlay */}
        <KiParticles color="gold" particleCount={35} speed={1.3} />

        {stageInfo?.img ? (
          <img
            src={stageInfo.img}
            alt="Stage Background"
            className="w-full h-full object-cover filter brightness-[0.22] saturate-[0.7] blur-[3px] scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-950" />
        )}
        {/* Ambient Dark Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#090503_100%)] opacity-80" />
        {/* Floating Scanlines and Grid */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />
      </div>

      {/* 2. DYNAMIC DIAGONAL TEAM COLLISION SPLIT (Background layer) */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        {/* Red/Orange energy side (P1) */}
        <motion.div
          initial={{ x: "-100%", skewX: -15 }}
          animate={{ x: "-20%", skewX: -15 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-red-950/40 via-orange-600/5 to-transparent border-r border-orange-500/20 shadow-[20px_0_100px_rgba(249,115,22,0.1)]"
        />
        {/* Cyan/Blue energy side (P2) */}
        <motion.div
          initial={{ x: "100%", skewX: -15 }}
          animate={{ x: "20%", skewX: -15 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-cyan-950/40 via-blue-600/5 to-transparent border-l border-cyan-500/20 shadow-[-20px_0_100px_rgba(6,182,212,0.1)]"
        />
        {/* Neon diagonal collision divider line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1.5 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-orange-500/80 to-transparent rotate-[-15deg] "
        />
      </div>

      {/* 3. SLEEK MATCH DETAILS HEADER BANNER */}
      <header 
        className="relative z-20 w-full flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent border-b border-white/5 backdrop-blur-xs"
        style={{ padding: `${s(16)}px ${s(24)}px` }}
      >
        {stageInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-stone-900/80 border border-stone-800 rounded-lg backdrop-blur-md flex items-center"
            style={{ padding: `${s(6)}px ${s(16)}px`, gap: s(8) }}
          >
            <span className="font-mono font-bold text-stone-500 uppercase tracking-widest" style={{ fontSize: s(9) }}>{t('vs_arena') || "ARENA:"}</span>
            <span className="font-black italic text-orange-400 uppercase tracking-wider" style={{ fontSize: s(12) }}>
              {stageInfo.name}
            </span>
          </motion.div>
        )}
      </header>

      {/* 4. MAIN COLLISION CONTAINER */}
      <div 
        className="relative z-10 flex-1 w-full flex flex-col md:flex-row items-center justify-between my-auto"
        style={{ maxWidth: s(1280), padding: `${s(16)}px ${s(48)}px`, gap: s(24) }}
      >
        
        {/* PLAYER 1 SIDE (CRIMSON/ORANGE GLOW) */}
        <div className="w-full md:w-[42%] flex flex-col justify-center items-center md:items-start relative">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-center md:text-left z-20"
          >
            <h3 
                className="font-header italic text-white uppercase tracking-wider leading-none"
                style={{ fontSize: s(30) }}
            >
              {selectionMode === 'ONLINE' && onlineRoomData ? (
                <div className="flex flex-col items-center md:items-start">
                    {onlineRoomData.hostTitle && (
                        <span className="text-[10px] text-orange-400 mb-1 uppercase font-black tracking-widest">{onlineRoomData.hostTitle}</span>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border-2 border-orange-500/40 overflow-hidden bg-stone-950 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                            <img 
                                src={AVATAR_LIST.find(a => a.id === onlineRoomData.hostAvatar)?.url || "/Assets/UI/avatar_placeholder.png"} 
                                className="w-full h-full object-cover" 
                                alt="" 
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="flex items-center gap-2 text-white font-header italic uppercase tracking-wider" style={{ fontSize: s(24) }}>
                                {onlineRoomData.hostName}
                                <span className="text-xs text-orange-500/60 font-black">#{onlineRoomData.hostNumericId || '0000'}</span>
                            </span>
                        </div>
                    </div>
                </div>
              ) : (t('vs_red_team') || "TIME VERMELHO")}
            </h3>
          </motion.div>

          {/* Overlapping Bento-Deck Layout for Characters */}
          <div className="flex items-center justify-center relative w-full flex-wrap md:flex-nowrap" style={{ gap: s(16) }}>
            {p1TeamData.map((char, i) => (
              <motion.div
                key={`p1-${char?.id || i}`}
                initial={{ opacity: 0, scale: 0.9, x: -50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3 + i * 0.15
                }}
                whileHover={{ scale: 1.05, zIndex: 30 }}
                className="relative rounded-2xl overflow-hidden border-2 border-orange-500/40 hover:border-orange-500 shadow-lg hover:shadow-orange-500/20 bg-stone-900 group cursor-pointer transition-all duration-300 transform md:skew-x-[-4deg]"
                style={{ width: s(176), height: s(256) }}
              >
                {/* Background Image & Ambient Fire */}
                <div className="absolute inset-0 bg-stone-950">
                  <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-950/80 via-transparent to-black/30" />
                  <img
                    src={char?.spriteConfig?.portraitUrl || undefined}
                    className="absolute inset-0 w-full h-full object-cover object-[center_20%] filter contrast-125 saturate-110 group-hover:scale-110 transition-transform duration-700 origin-center"
                    alt={char?.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                </div>

                {/* Character Name Label Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent" style={{ padding: s(12) }}>
                  <h4 
                    className="font-header italic text-stone-100 uppercase tracking-wider leading-tight truncate text-left"
                    style={{ fontSize: s(18) }}
                  >
                    {char?.name || "RANDOM"}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* MIDDLE IMPACT VS ORB */}
        <div className="shrink-0 flex items-center justify-center relative z-30" style={{ width: s(112) }}>
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.55 }}
            className="relative flex items-center justify-center"
          >
            {/* Pulsing Back Glow Solar Aura */}
            <div 
                className="absolute bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.35)_0%,_transparent_70%)] animate-pulse rounded-full pointer-events-none" 
                style={{ width: s(176), height: s(176) }}
            />
            <div 
                className="absolute bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.25)_0%,_transparent_70%)] animate-pulse rounded-full pointer-events-none delay-1000" 
                style={{ width: s(128), height: s(128) }}
            />

            <motion.img
              src={RESOURCE_SPRITES.vs}
              animate={{
                x: [-1.5, 1.5, -1.5, 0],
                y: [-1.5, 1.5, -1.5, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
              className="h-auto object-contain filter drop- relative z-10"
              style={{ width: s(112) }}
              referrerPolicy="no-referrer"
              alt="VS"
            />
          </motion.div>
        </div>

        {/* PLAYER 2 SIDE (CYAN/BLUE GLOW) */}
        <div className="w-full md:w-[42%] flex flex-col justify-center items-center md:items-end relative">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4 text-center md:text-right z-20"
          >
            <h3 
                className="font-header italic text-white uppercase tracking-wider leading-none"
                style={{ fontSize: s(30) }}
            >
              {selectionMode === 'ONLINE' && onlineRoomData ? (
                <div className="flex flex-col items-center md:items-end">
                    {onlineRoomData.guestTitle && (
                        <span className="text-[10px] text-cyan-400 mb-1 uppercase font-black tracking-widest">{onlineRoomData.guestTitle}</span>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="flex items-center gap-2 text-white font-header italic uppercase tracking-wider" style={{ fontSize: s(24) }}>
                                <span className="text-xs text-cyan-500/60 font-black">#{onlineRoomData.guestNumericId || '0000'}</span>
                                {onlineRoomData.guestName}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl border-2 border-cyan-500/40 overflow-hidden bg-stone-950 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <img 
                                src={AVATAR_LIST.find(a => a.id === onlineRoomData.guestAvatar)?.url || "/Assets/UI/avatar_placeholder.png"} 
                                className="w-full h-full object-cover" 
                                alt="" 
                            />
                        </div>
                    </div>
                </div>
              ) : (t('vs_blue_team') || "TIME AZUL")}
            </h3>
          </motion.div>

          {/* Overlapping Bento-Deck Layout for Characters (Flipped for P2) */}
          <div className="flex items-center justify-center relative w-full flex-wrap md:flex-nowrap md:flex-row-reverse" style={{ gap: s(16) }}>
            {p2TeamData.map((char, i) => (
              <motion.div
                key={`p2-${char?.id || i}`}
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.35 + i * 0.15
                }}
                whileHover={{ scale: 1.05, zIndex: 30 }}
                className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/40 hover:border-cyan-500 shadow-lg hover:shadow-cyan-500/20 bg-stone-900 group cursor-pointer transition-all duration-300 transform md:skew-x-[-4deg]"
                style={{ width: s(176), height: s(256) }}
              >
                {/* Background Image & Ambient Frost */}
                <div className="absolute inset-0 bg-stone-950">
                  <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/80 via-transparent to-black/30" />
                  <img
                    src={char?.spriteConfig?.portraitUrl || undefined}
                    className="absolute inset-0 w-full h-full object-cover object-[center_20%] filter contrast-125 saturate-110 group-hover:scale-110 transition-transform duration-700 origin-center"
                    style={{ transform: "scaleX(-1)" }}
                    alt={char?.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                </div>

                {/* Character Name Label Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent" style={{ padding: s(12) }}>
                  <h4 
                    className="font-header italic text-stone-100 uppercase tracking-wider leading-tight truncate text-left"
                    style={{ fontSize: s(18) }}
                  >
                    {char?.name || "RANDOM"}
                  </h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. FUSTRISTIC DIAGNOSTIC HUD LOADING INDICATOR */}
      <footer 
        className="relative z-20 w-full flex flex-col items-center"
        style={{ maxWidth: s(896), padding: `0 ${s(24)}`, paddingBottom: s(48), gap: s(16) }}
      >
        {/* Top telemetry reads */}
        <div className="w-full flex items-center justify-between text-stone-500 tracking-wider mb-1" style={{ fontSize: s(10) }}>
           <div className="flex gap-4 items-center">
              <span className={`font-bold ${myLoadingComplete ? 'text-green-400' : 'text-stone-300'}`}>
                VOCÊ: {progress}%
              </span>
              {selectionMode === 'ONLINE' && onlineRoomData && (
                 <>
                   <span className={`font-bold ${(isOnlineHost ? onlineRoomData.guestLoadingProgress : onlineRoomData.hostLoadingProgress) >= 100 ? 'text-green-400' : 'text-stone-300'}`}>
                     OPONENTE: {isOnlineHost ? (onlineRoomData.guestLoadingProgress || 0) : (onlineRoomData.hostLoadingProgress || 0)}%
                   </span>
                   <div className="flex items-center gap-1.5 ml-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                     <span className={`font-bold ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                       {isConnected ? 'SINCRO OK' : 'SEM SINCRO'}
                     </span>
                     {!isConnected && (
                       <button 
                         onClick={handleManualReconnect}
                         className="ml-2 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[8px] border border-white/5 cursor-pointer"
                       >
                         RECONECTAR
                       </button>
                     )}
                   </div>
                 </>
              )}
           </div>
           
           <div 
             className="text-center font-bold text-stone-300 bg-black/50 border border-white/5 rounded-full backdrop-blur-xs"
             style={{ px: s(16), py: s(6), padding: `${s(6)}px ${s(16)}px` }}
           >
             {loading ? (
               <span className="animate-pulse">SINCRONIZANDO {progress}%</span>
             ) : (
               <span className="text-orange-400 font-black tracking-widest animate-bounce">PRONTO! PREPARE-SE</span>
             )}
           </div>
        </div>

        {/* Glowing HUD gauge bar */}
        <div 
            className="w-full relative bg-stone-900/80 rounded-full border border-white/10 overflow-hidden shadow-inner backdrop-blur-xs"
            style={{ height: s(12), padding: s(2) }}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-cyan-400 "
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>

        {/* Manual Start Button if stuck at 100% */}
        {progress === 100 && (selectionMode !== 'ONLINE' || (myLoadingComplete && opponentLoadingComplete)) && !statusUpdated && (
           <motion.button
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             onClick={() => {
               console.log("[VS] Manual start triggered");
               setLoading(false);
               setStatusUpdated(true);
               changeScene(selectionMode === "TRAINING" ? SceneName.TRAINING : SceneName.BATTLE);
             }}
             className="mt-2 px-10 py-3 bg-dragon-orange hover:bg-orange-500 text-white font-header italic text-sm tracking-widest uppercase rounded shadow-lg shadow-orange-600/20 cursor-pointer"
           >
             ENTRAR NA ARENA
           </motion.button>
        )}

        {/* Small cosmetic brackets */}
        <div className="w-full flex justify-between px-1 font-mono text-stone-600" style={{ fontSize: s(10) }}>
          <span className="flex flex-wrap items-center gap-y-1">DICA: {renderTextWithSprites(tipText, s)}</span>
          <span />
        </div>
      </footer>

      {/* Flash impact shake overlay on battle ready */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.3, delay: 0.85 }}
        className="absolute inset-0 bg-orange-500/10 z-[60] pointer-events-none mix-blend-overlay"
      />
    </div>
  );
};
