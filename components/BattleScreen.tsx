import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useSceneManager } from "../contexts/SceneContext";
import { HUDTop, HUDBottom } from "./HUD";
import { VirtualControls } from "./VirtualControls";
import { GameState, SceneName, IntroPhase, DummyMode, CpuAction, CounterAttackType } from "../types";
import { WIN_REWARD, MAX_GUARD, MAX_KI, MAX_HP, RESOURCE_SPRITES } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Zap, Trophy, RotateCcw, LogOut, Settings, Activity, ChevronDown, Check } from "lucide-react";
import { AudioManager } from "../services/AudioManager";
import { VoiceQueue } from "../src/engine/dialogue/VoiceQueue";
import { DialogueSubtitle } from "../src/engine/dialogue/types";
import { LocalMultiplayerManager } from "../services/LocalMultiplayerManager";
import { EventSystem } from "../services/EventSystem";

export const BattleScreen: React.FC = () => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameEngine,
    changeScene,
    destroyGameSession,
    createGameSession,
    startLoading,
    addCoins,
    notifyMissionProgress,
    handleBattleEnd,
    handleSurvivalEnd,
    activeTournament,
    setPaused,
    t,
    settings,
    setMatchResult,
    matchMode,
    battleMusic,
  } = useSceneManager();

  const isPt = settings?.language === 'pt';

  const [coinsAwarded, setCoinsAwarded] = useState(false);
  const [lastP1Idx, setLastP1Idx] = useState(0);
  const [lastP2Idx, setLastP2Idx] = useState(0);
  const [showP1Tag, setShowP1Tag] = useState(false);
  const [showP2Tag, setShowP2Tag] = useState(false);
  const [isExitingToPause, setIsExitingToPause] = useState(false);
  const [subtitles, setSubtitles] = useState<DialogueSubtitle[]>([]);

  useEffect(() => {
    const unsub = VoiceQueue.getInstance().subscribe((subs) => {
      setSubtitles(subs);
    });
    
    // Subscribe to mission actions from the engine
    const unsubMission = EventSystem.getInstance().subscribe("MISSION_ACTION", (payload: any) => {
      if (notifyMissionProgress) {
        notifyMissionProgress(payload.action, payload.amount);
      }
    });

    return () => {
      unsub();
      unsubMission();
    };
  }, [notifyMissionProgress]);

  // BGM is handled centrally by SceneContext to ensure seamless transitions between VS Screen and Battle, or stage-customized tracks.

  const [gameState, setGameState] = useState<GameState>({
    p1Stats: {
      hp: MAX_HP,
      maxHp: MAX_HP,
      combo: 0,
      guard: MAX_GUARD,
      maxGuard: MAX_GUARD,
      ki: 0,
      maxKi: MAX_KI,
    },
    p2Stats: {
      hp: MAX_HP,
      maxHp: MAX_HP,
      combo: 0,
      guard: MAX_GUARD,
      maxGuard: MAX_GUARD,
      ki: 0,
      maxKi: MAX_KI,
    },
    timer: 99,
    gameOver: false,
    winner: null,
    p1ActiveIdx: 0,
    p2ActiveIdx: 0,
  });

  // Training Mode configuration and synchronization
  const isTraining = gameEngine?.isTraining || gameState?.gameMode === "TRAINING";
  const [infiniteHp, setInfiniteHp] = useState(() => gameEngine ? gameEngine.trainingInfiniteHp : true);
  const [infiniteKi, setInfiniteKi] = useState(() => gameEngine ? gameEngine.trainingInfiniteKi : false);
  const [showHitboxes, setShowHitboxes] = useState(() => gameEngine ? gameEngine.trainingShowHitboxes : false);
  const [dummyMode, setDummyModeState] = useState<DummyMode>(() => gameEngine?.dummyController?.mode || DummyMode.IDLE);
  const [cpuAction, setCpuActionState] = useState<CpuAction>(() => gameEngine?.cpuAction || CpuAction.OFF);
  const [counterAttackType, setCounterAttackTypeState] = useState<CounterAttackType>(() => gameEngine?.counterAttackType || CounterAttackType.LIGHT);
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [isDummyDropdownOpen, setIsDummyDropdownOpen] = useState(false);
  const [isCpuDropdownOpen, setIsCpuDropdownOpen] = useState(false);
  const [isCounterDropdownOpen, setIsCounterDropdownOpen] = useState(false);

  useEffect(() => {
    if (!showTrainingMenu) {
      setIsDummyDropdownOpen(false);
      setIsCpuDropdownOpen(false);
      setIsCounterDropdownOpen(false);
    }
  }, [showTrainingMenu]);

  useEffect(() => {
    if (!gameEngine || !isTraining) return;
    setInfiniteHp(gameEngine.trainingInfiniteHp);
    setInfiniteKi(gameEngine.trainingInfiniteKi);
    setShowHitboxes(gameEngine.trainingShowHitboxes);
    setDummyModeState(gameEngine.dummyController?.mode || DummyMode.IDLE);
    setCpuActionState(gameEngine.cpuAction || CpuAction.OFF);
    setCounterAttackTypeState(gameEngine.counterAttackType || CounterAttackType.LIGHT);
  }, [gameEngine, isTraining, gameEngine?.trainingInfiniteHp, gameEngine?.trainingInfiniteKi, gameEngine?.trainingShowHitboxes, gameEngine?.dummyController?.mode, gameEngine?.cpuAction, gameEngine?.counterAttackType]);

  const handleToggleHp = () => {
    if (gameEngine) {
      const newValue = !gameEngine.trainingInfiniteHp;
      gameEngine.trainingInfiniteHp = newValue;
      setInfiniteHp(newValue);
      AudioManager.getInstance().playSFX("click");
    }
  };

  const handleToggleKi = () => {
    if (gameEngine) {
      const newValue = !gameEngine.trainingInfiniteKi;
      gameEngine.trainingInfiniteKi = newValue;
      setInfiniteKi(newValue);
      AudioManager.getInstance().playSFX("click");
    }
  };

  const handleToggleHitboxes = () => {
    if (gameEngine) {
      const newValue = !gameEngine.trainingShowHitboxes;
      gameEngine.trainingShowHitboxes = newValue;
      setShowHitboxes(newValue);
      AudioManager.getInstance().playSFX("click");
    }
  };

  const handleResetPositions = () => {
    if (gameEngine) {
      gameEngine.reset();
      AudioManager.getInstance().playSFX("click");
    }
  };

  useEffect(() => {
    if (
      gameState.p1ActiveIdx !== undefined &&
      gameState.p1ActiveIdx !== lastP1Idx
    ) {
      setLastP1Idx(gameState.p1ActiveIdx);
      if (gameState.p1ActiveIdx !== 0) {
        // Don't show on start
        setShowP1Tag(true);
        setTimeout(() => setShowP1Tag(false), 2000);
      }
    }
    if (
      gameState.p2ActiveIdx !== undefined &&
      gameState.p2ActiveIdx !== lastP2Idx
    ) {
      setLastP2Idx(gameState.p2ActiveIdx);
      if (gameState.p2ActiveIdx !== 0) {
        // Don't show on start
        setShowP2Tag(true);
        setTimeout(() => setShowP2Tag(false), 2000);
      }
    }
  }, [gameState.p1ActiveIdx, gameState.p2ActiveIdx, lastP1Idx, lastP2Idx]);

  useEffect(() => {
    if (!bgCanvasRef.current || !gameEngine) {
      if (!gameEngine) changeScene(SceneName.MAIN_MENU);
      return;
    }

    gameEngine.attach(bgCanvasRef.current, fgCanvasRef.current);
    (gameEngine as any).onGameStateChange = (newState: GameState) => {
      setGameState(newState);
    };

    const handleResize = () => {
      if (!bgCanvasRef.current) return;
      
      const TARGET_WIDTH = window.innerWidth;
      const TARGET_HEIGHT = window.innerHeight;

      // Ensure canvas DOM attributes are set correctly for our fixed resolution
      bgCanvasRef.current.width = TARGET_WIDTH;
      bgCanvasRef.current.height = TARGET_HEIGHT;
      if (fgCanvasRef.current) {
        fgCanvasRef.current.width = TARGET_WIDTH;
        fgCanvasRef.current.height = TARGET_HEIGHT;
      }
      
      gameEngine.resize(TARGET_WIDTH, TARGET_HEIGHT);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      gameEngine.detach();
      window.removeEventListener("resize", handleResize);
    };
  }, [gameEngine, changeScene]);

  const triggerPause = useCallback(() => {
    AudioManager.getInstance().playSFX("click");
    setPaused(true);
  }, [setPaused]);

  const handleTimerClick = useCallback(() => {
    triggerPause();
  }, [triggerPause]);

  useEffect(() => {
    if (gameState.gameOver && gameState.winner !== null && !coinsAwarded) {
      setCoinsAwarded(true);
      setTimeout(() => {
        setMatchResult(gameState);
        if (gameState.gameMode === "SURVIVAL") {
          handleSurvivalEnd(gameState);
        } else if (gameState.gameMode === "SUMMON") {
          changeScene(SceneName.SUMMON);
        } else {
          changeScene(SceneName.RESULTS);
        }
      }, 2000);
    }
  }, [
    gameState.gameOver,
    gameState.winner,
    coinsAwarded,
    setMatchResult,
    handleSurvivalEnd,
    changeScene,
  ]);

  useEffect(() => {
    let lastTapDir = "";
    let lastTapTime = 0;

    const keys = settings.keybindings || {
      left: "KeyA",
      right: "KeyD",
      jump: "Space",
      light: "KeyK",
      medium: "KeyL",
      heavy: "Semicolon",
      lp: "KeyJ",
      mp: "KeyK",
      sp: "KeyL",
      lk: "KeyM",
      mk: "Comma",
      sk: "Period",
      special: "KeyI",
      block: "KeyS",
      dash: "",
      charge: "KeyC",
      ultimate: "KeyU",
      tag: "KeyT",
      assist1: "KeyQ",
      assist2: "KeyE",
      vanish: "KeyV",
      transform: "KeyB",
      dragonRush: "KeyR"
    };

    const keysP2 = {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "ArrowUp",
      light: "KeyO",
      medium: "KeyP",
      heavy: "BracketLeft",
      special: "BracketRight",
      block: "ArrowDown",
      dash: "",
      charge: "Backslash",
      ultimate: "Enter",
      tag: "Slash",
      assist1: "Period",
      assist2: "Comma",
      vanish: "KeyM",
      transform: "KeyN",
      dragonRush: "KeyH"
    };

    const keysP2Numpad = {
      left: "Numpad4",
      right: "Numpad6",
      jump: "Numpad8",
      light: "Numpad1",
      medium: "Numpad2",
      heavy: "Numpad3",
      special: "Numpad5",
      block: "Numpad0",
      dash: "",
      charge: "Numpad7",
      ultimate: "Numpad9",
      tag: "NumpadDivide",
      assist1: "NumpadMultiply",
      assist2: "NumpadSubtract",
      vanish: "NumpadAdd",
      transform: "NumpadEnter",
      dragonRush: "Numpad0"
    };

    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      if (!gameEngine) return;
      if (matchMode === "CPU_VS_CPU" && e.code !== "Escape") return;
      const im = gameEngine.inputManager;

      let allowP1Keyboard = true;
      let allowP2Keyboard = true;

      if (matchMode === "LOCAL_VS") {
        const mapping = LocalMultiplayerManager.getInstance().getDeviceMapping();
        if (mapping) {
          allowP1Keyboard = mapping.p1Device === "keyboard";
          allowP2Keyboard = mapping.p2Device === "keyboard";
        }
      }

      // Player 1 mappings
      if (allowP1Keyboard) {
        if (e.code === keys.left) {
          im.setInputForPlayer(1, "left", isDown);
        } else if (e.code === keys.right) {
          im.setInputForPlayer(1, "right", isDown);
        } else if (e.code === keys.jump) {
          im.setInputForPlayer(1, "jump", isDown);
        } else if (e.code === keys.light) {
          im.setInputForPlayer(1, "light", isDown);
        } else if (e.code === keys.medium) {
          im.setInputForPlayer(1, "medium", isDown);
        } else if (e.code === keys.heavy) {
          im.setInputForPlayer(1, "heavy", isDown);
        } else if (e.code === keys.lp) {
          im.setInputForPlayer(1, "lp", isDown);
        } else if (e.code === keys.mp) {
          im.setInputForPlayer(1, "mp", isDown);
        } else if (e.code === keys.sp) {
          im.setInputForPlayer(1, "sp", isDown);
        } else if (e.code === keys.lk) {
          im.setInputForPlayer(1, "lk", isDown);
        } else if (e.code === keys.mk) {
          im.setInputForPlayer(1, "mk", isDown);
        } else if (e.code === keys.sk) {
          im.setInputForPlayer(1, "sk", isDown);
        } else if (e.code === keys.special) {
          im.setInputForPlayer(1, "special", isDown);
        } else if (e.code === keys.block) {
          im.setInputForPlayer(1, "block", isDown);
        } else if (e.code === keys.charge) {
          im.setInputForPlayer(1, "charge", isDown);
        } else if (e.code === keys.ultimate) {
          im.setInputForPlayer(1, "ultimate", isDown);
        } else if (e.code === keys.tag) {
          im.setInputForPlayer(1, "tag", isDown);
        } else if (e.code === keys.assist1) {
          im.setInputForPlayer(1, "assist1", isDown);
        } else if (e.code === keys.assist2) {
          im.setInputForPlayer(1, "assist2", isDown);
        } else if (e.code === keys.vanish) {
          im.setInputForPlayer(1, "vanish", isDown);
        } else if (e.code === keys.transform) {
          im.setInputForPlayer(1, "transform", isDown);
        } else if (e.code === keys.dragonRush) {
          im.setInputForPlayer(1, "dragonRush", isDown);
        }
      }

      // Player 2 mappings
      if (allowP2Keyboard) {
        if (e.code === keysP2.left || e.code === keysP2Numpad.left) {
          im.setInputForPlayer(2, "left", isDown);
        } else if (e.code === keysP2.right || e.code === keysP2Numpad.right) {
          im.setInputForPlayer(2, "right", isDown);
        } else if (e.code === keysP2.jump || e.code === keysP2Numpad.jump) {
          im.setInputForPlayer(2, "jump", isDown);
        } else if (e.code === keysP2.light || e.code === keysP2Numpad.light) {
          im.setInputForPlayer(2, "light", isDown);
        } else if (e.code === keysP2.medium || e.code === keysP2Numpad.medium) {
          im.setInputForPlayer(2, "medium", isDown);
        } else if (e.code === keysP2.heavy || e.code === keysP2Numpad.heavy) {
          im.setInputForPlayer(2, "heavy", isDown);
        } else if (e.code === "Numpad1") {
          im.setInputForPlayer(2, "lp", isDown);
        } else if (e.code === "Numpad2") {
          im.setInputForPlayer(2, "mp", isDown);
        } else if (e.code === "Numpad3") {
          im.setInputForPlayer(2, "sp", isDown);
        } else if (e.code === "Numpad0") {
          im.setInputForPlayer(2, "lk", isDown);
        } else if (e.code === "NumpadDecimal") {
          im.setInputForPlayer(2, "mk", isDown);
        } else if (e.code === "NumpadEnter") {
          im.setInputForPlayer(2, "sk", isDown);
        } else if (e.code === keysP2.special || e.code === keysP2Numpad.special) {
          im.setInputForPlayer(2, "special", isDown);
        } else if (e.code === keysP2.block || e.code === keysP2Numpad.block) {
          im.setInputForPlayer(2, "block", isDown);
        } else if (e.code === keysP2.charge || e.code === keysP2Numpad.charge) {
          im.setInputForPlayer(2, "charge", isDown);
        } else if (e.code === keysP2.ultimate || e.code === keysP2Numpad.ultimate) {
          im.setInputForPlayer(2, "ultimate", isDown);
        } else if (e.code === keysP2.tag || e.code === keysP2Numpad.tag) {
          im.setInputForPlayer(2, "tag", isDown);
        } else if (e.code === keysP2.assist1 || e.code === keysP2Numpad.assist1) {
          im.setInputForPlayer(2, "assist1", isDown);
        } else if (e.code === keysP2.assist2 || e.code === keysP2Numpad.assist2) {
          im.setInputForPlayer(2, "assist2", isDown);
        } else if (e.code === keysP2.vanish || e.code === keysP2Numpad.vanish) {
          im.setInputForPlayer(2, "vanish", isDown);
        } else if (e.code === keysP2.transform || e.code === keysP2Numpad.transform) {
          im.setInputForPlayer(2, "transform", isDown);
        } else if (e.code === keysP2.dragonRush || e.code === keysP2Numpad.dragonRush) {
          im.setInputForPlayer(2, "dragonRush", isDown);
        }
      }

      if (isDown && e.code === "Escape") {
        triggerPause();
      }
    };

    const onDown = (e: KeyboardEvent) => {
      if (!e.repeat) handleKey(e, true);
    };
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    const onBlur = () => {
      if (gameEngine) gameEngine.inputManager.reset();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [gameEngine, triggerPause, matchMode, settings]);

  const handleRematch = () => {
    if (activeTournament) return;
    if (gameEngine) {
      const p1Data = gameEngine.p1Team.map((p) => p.data);
      const p2Data = gameEngine.p2Team.map((p) => p.data);
      createGameSession(
        p1Data,
        p2Data,
        gameEngine.isTraining,
        gameEngine.gameMode,
      );
      startLoading(SceneName.VS_SCREEN);
    }
    AudioManager.getInstance().playSFX("click");
  };

  const handleCharacterSelect = () => {
    destroyGameSession();
    changeScene(SceneName.CHARACTER_SELECT);
    AudioManager.getInstance().playSFX("click");
  };

  const handleModeMenu = () => {
    destroyGameSession();
    changeScene(SceneName.SINGLE_PLAYER_MENU);
    AudioManager.getInstance().playSFX("click");
  };

  const handleContinueTournament = () => {
    if (activeTournament) {
      handleBattleEnd(gameState.winner!);
    }
    AudioManager.getInstance().playSFX("click");
  };

  const shouldShowHUD =
    gameState.introPhase === IntroPhase.FIGHT &&
    gameState.gameMode !== "SUMMON";

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none font-sans">
      <div 
        className="relative w-full h-full"
      >
        {/* Game Canvas */}
        <canvas
          ref={bgCanvasRef}
          style={{ position: 'absolute' }}
          className="absolute inset-0 block w-full h-full touch-none z-0 !absolute"
        />

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Top HUD (Behind Characters) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {shouldShowHUD && (
            <HUDTop
              p1={gameState.p1Stats}
              p2={gameState.p2Stats}
              p1Team={gameState.p1Team}
              p2Team={gameState.p2Team}
              p1ActiveIdx={gameState.p1ActiveIdx}
              p2ActiveIdx={gameState.p2ActiveIdx}
              p1FusionTimer={gameState.p1FusionTimer}
              p2FusionTimer={gameState.p2FusionTimer}
              timer={gameState.timer}
              wave={gameState.wave}
              gameMode={gameState.gameMode}
              onTimerClick={handleTimerClick}
              uiVisible={!isExitingToPause && !gameState.koSequenceActive && !gameState.isKOSwapActive}
            />
          )}
        </div>

        {/* Foreground Canvas */}
        <canvas
          ref={fgCanvasRef}
          style={{ position: 'absolute' }}
          className="absolute inset-0 block w-full h-full touch-none pointer-events-none z-20 !absolute"
        />

        {/* HUD & Controls */}
        {shouldShowHUD && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: (gameState.koSequenceActive || gameState.isKOSwapActive) ? 0 : 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-40 pointer-events-none ${(gameState.koSequenceActive || gameState.isKOSwapActive) ? "hidden" : ""}`}
          >
            {/* Beam Clash Progress Bar */}
            <AnimatePresence>
              {gameState.isBeamClashActive && (() => {
                const isP1OnLeft = gameState.beamClashP1FacingRight ?? true;
                const visualProgress = gameState.beamClashVisualProgress ?? 0.5;
                const visualPct = isP1OnLeft ? visualProgress : (1 - visualProgress);

                const leftGradient = isP1OnLeft 
                  ? "bg-gradient-to-r from-cyan-600 via-sky-400 to-white " 
                  : "bg-gradient-to-r from-purple-600 via-red-500 to-white ";

                const rightGradient = isP1OnLeft 
                  ? "bg-gradient-to-l from-purple-600 via-red-500 to-white " 
                  : "bg-gradient-to-l from-cyan-600 via-sky-400 to-white ";

                const getClashStatusText = () => {
                  if (visualProgress > 0.52) {
                    if (isP1OnLeft) {
                      return `P1 ${t('clash_advantage')} >>>`;
                    } else {
                      return `<<< P1 ${t('clash_advantage')}`;
                    }
                  } else if (visualProgress < 0.48) {
                    if (isP1OnLeft) {
                      return `<<< P2 ${t('clash_advantage')}`;
                    } else {
                      return `P2 ${t('clash_advantage')} >>>`;
                    }
                  } else {
                    return t('clash_equilibrium') || 'EQUILÍBRIO';
                  }
                };

                const statusColor = visualProgress > 0.52 ? "text-sky-400" : visualProgress < 0.48 ? "text-red-500" : "text-amber-500";

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -50 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-[18vmin] left-1/2 -translate-x-1/2 z-[45] pointer-events-none flex flex-col items-center w-[75vmin] max-w-xl px-[2vmin]"
                  >
                    {/* Main Container */}
                    <div className="relative w-full bg-slate-950/95 border-[3px] border-amber-500/80 p-[1.5vmin] rounded-lg -skew-x-12 shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_0_15px_rgba(0,0,0,0.8)]">
                      {/* Names Row */}
                      <div className="flex justify-between items-center text-white font-black italic text-[1.8vmin] md:text-[2.2vmin] tracking-wide mb-[1vmin] px-[1vmin]">
                        <span className={`${isP1OnLeft ? "text-sky-400" : "text-red-500"} truncate max-w-[20vmin] uppercase`}>
                          {isP1OnLeft ? (gameState.p1Stats.name || t('menu_guest')) : (gameState.p2Stats.name || (gameState.gameMode === 'ONLINE' ? t('menu_opponent') : 'CPU'))}
                        </span>
                        <div className={`flex gap-[0.5vmin] font-bold animate-pulse text-[1.5vmin] md:text-[1.8vmin] ${statusColor}`}>
                          <span>{getClashStatusText()}</span>
                        </div>
                        <span className={`${isP1OnLeft ? "text-red-500" : "text-sky-400"} truncate max-w-[20vmin] uppercase`}>
                          {isP1OnLeft ? (gameState.p2Stats.name || (gameState.gameMode === 'ONLINE' ? t('menu_opponent') : 'CPU')) : (gameState.p1Stats.name || t('menu_guest'))}
                        </span>
                      </div>

                      {/* Progress Bar Track */}
                      <div className="relative h-[2.5vmin] md:h-[3vmin] w-full bg-slate-900 rounded border border-white/10 overflow-hidden">
                        {/* Left Power Beam Side */}
                        <div 
                          className={`absolute top-0 bottom-0 left-0 transition-all duration-75 ${leftGradient}`}
                          style={{ width: `${visualPct * 100}%` }}
                        />
                        
                        {/* Right Power Beam Side */}
                        <div 
                          className={`absolute top-0 bottom-0 right-0 transition-all duration-75 ${rightGradient}`}
                          style={{ left: `${visualPct * 100}%` }}
                        />

                        {/* Center Equilibrium Line (Subtle marker) */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/30 z-10 border-dashed" />

                        {/* Clash Contact Point Indicator (Orb + Flares) */}
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-[6vmin] h-[6vmin] -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-all duration-75"
                          style={{ left: `${visualPct * 100}%` }}
                        >
                          {/* Glowing Flare Rings */}
                          <motion.div 
                            className="absolute w-[8vmin] h-[8vmin] rounded-full bg-yellow-400/30 mix-blend-screen"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <motion.div 
                            className="absolute w-[4vmin] h-[4vmin] rounded-full bg-white "
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          {/* Vertical Beam Spark Flare */}
                          <div className="absolute w-[0.6vmin] h-[10vmin] bg-white rounded-full opacity-80 " />
                        </div>
                      </div>
                    </div>

                    {/* Localized Helper Hint */}
                    <motion.div 
                      className="mt-[1vmin] bg-black/60 px-[2vmin] py-[0.5vmin] border border-amber-500/20 text-white text-[1.5vmin] md:text-[1.8vmin] font-bold italic tracking-wider rounded -skew-x-12 drop-shadow-md text-center"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      {t('clash_hint')}
                    </motion.div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none z-30">
              <HUDBottom
                p1={gameState.p1Stats}
                p2={gameState.p2Stats}
                p1Team={gameState.p1Team}
                p2Team={gameState.p2Team}
                p1ActiveIdx={gameState.p1ActiveIdx}
                p2ActiveIdx={gameState.p2ActiveIdx}
                p1FusionTimer={gameState.p1FusionTimer}
                p2FusionTimer={gameState.p2FusionTimer}
                timer={gameState.timer}
                wave={gameState.wave}
                gameMode={gameState.gameMode}
                onTimerClick={handleTimerClick}
                uiVisible={!isExitingToPause && !gameState.koSequenceActive && !gameState.isKOSwapActive}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 z-50">
              {!settings.disableMobileUI && matchMode !== "CPU_VS_CPU" && (
                <VirtualControls
                  inputManager={gameEngine?.inputManager}
                  p1HeavyCooldown={gameState.p1HeavyCooldown}
                  p1DashCooldown={gameState.p1DashCooldown}
                  p1ProjectileCooldown={gameState.p1ProjectileCooldown}
                  p1DragonRushCooldown={gameState.p1DragonRushCooldown}
                  assistCooldown={gameState.p1Stats.assistCooldown}
                  p1ActiveId={gameEngine?.player1?.data?.id}
                  hidden={gameState.isUlting || gameState.koSequenceActive || gameState.isKOSwapActive}
                />
              )}
            </div>
          </motion.div>
        )}

      {/* Intro Sequence (Overlays entire screen) */}
      <AnimatePresence>
        {gameState.isLoading && (
          <motion.div
            key="battle-loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[200] bg-black"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(gameState.introPhase === "P1_INTRO" ||
          gameState.introPhase === "P2_INTRO") && (
          <motion.div
            key="skip-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 right-8 z-[120] pointer-events-auto"
          >
            <button
              onClick={() => {
                gameEngine?.skipIntro();
                AudioManager.getInstance().playSFX("click");
              }}
              className="group relative px-6 py-2 bg-slate-900/80 border-2 border-white/30 text-white font-bold uppercase tracking-wider skew-x-[-12deg] transition-all hover:border-orange-500 hover:text-orange-500"
            >
              <div className="skew-x-[12deg] flex items-center gap-2">
                {t('battle_skip_intro') || 'Skip Intro'} <span className="text-xl leading-none">&raquo;</span>
              </div>
            </button>
          </motion.div>
        )}

        {settings.subtitlesEnabled !== false && gameState.introSubtitle &&
          (gameState.introPhase === "P1_INTRO" ||
            gameState.introPhase === "P2_INTRO") && (() => {
              const rawText = gameState.introSubtitle;
              const hasSplit = rawText.includes(":");
              let speakerName = "";
              let subtitleText = rawText;

              if (hasSplit) {
                const parts = rawText.split(":");
                speakerName = parts[0].trim().toUpperCase();
                subtitleText = parts.slice(1).join(":").trim();
              } else {
                const charObj = gameState.introPhase === "P1_INTRO" 
                  ? gameState.p1Team?.[gameState.p1ActiveIdx || 0]
                  : gameState.p2Team?.[gameState.p2ActiveIdx || 0];
                speakerName = charObj ? (charObj.name || "").toUpperCase() : "";
              }

              // Normalização das aspas
              let cleanedText = subtitleText.trim();
              if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
                cleanedText = cleanedText.substring(1, cleanedText.length - 1);
              }

              // Cor do nome do personagem
              let nameColorHex = "#facc15"; 
              const lowerName = (speakerName || "").toLowerCase();
              if (lowerName.includes("goku") && !lowerName.includes("black")) {
                nameColorHex = "#fbbf24"; 
              } else if (lowerName.includes("vegeta")) {
                nameColorHex = "#22d3ee"; 
              } else if (lowerName.includes("trunks")) {
                nameColorHex = "#c084fc"; 
              } else if (lowerName.includes("black")) {
                nameColorHex = "#fb7185"; 
              } else if (lowerName.includes("piccolo")) {
                nameColorHex = "#4ade80"; 
              }

              const isSmall = settings.subtitlesFontSize === 'SMALL';
              const isLarge = settings.subtitlesFontSize === 'LARGE';

              // Sizing in vmin for absolute resolution-independent crisp rendering
              const fontSizeValue = isSmall ? '2.8vmin' : isLarge ? '4.2vmin' : '3.4vmin';
              const nameSizeValue = isSmall ? '1.8vmin' : isLarge ? '3.0vmin' : '2.4vmin';

              return (
                <motion.div
                  key={"intro-subtitle-" + speakerName}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-[7%] left-0 right-0 mx-auto z-[115] pointer-events-none w-full max-w-[85vmin] px-[2vmin] text-center select-none flex flex-col items-center justify-center animate-duration-300"
                >
                  <div className={settings.subtitlesBackgroundEnabled ? "bg-black/75 px-[4vmin] py-[2vmin] rounded-[2vmin] border border-stone-800 shadow-2xl backdrop-blur-sm max-w-[70vmin] text-center" : "text-center w-full"}>
                    {speakerName && settings.subtitlesShowSpeakerName !== false && (
                      <span 
                        className="block font-black tracking-[0.1em] uppercase mb-[0.5vmin]"
                        style={{
                          color: nameColorHex,
                          fontFamily: '"Rajdhani", "Inter", sans-serif',
                          fontSize: nameSizeValue,
                          textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        -{speakerName}-
                      </span>
                    )}
                    <p 
                      className="font-extrabold tracking-wide leading-snug drop-shadow-md px-[1vmin]"
                      style={{
                        color: '#ffffff',
                        fontFamily: '"Rajdhani", "Inter", sans-serif',
                        fontSize: fontSizeValue,
                        textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0 3px 6px rgba(0,0,0,0.9)'
                      }}
                    >
                      "{cleanedText}"
                    </p>
                  </div>
                </motion.div>
              );
            })()}

        {gameState.introPhase === "READY" &&
          gameState.introTimer !== undefined &&
          gameState.introTimer > 0 &&
          gameState.gameMode !== "SUMMON" && (
            <motion.div
              key="ready-fight-anim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm"
            >
              {(() => {
                const fightSec = AudioManager.getInstance().getSFXDuration("fight");
                const fightFrames = Math.ceil(fightSec * 60);
                const isReady = gameState.introTimer > fightFrames;
                return (
                  <motion.div
                    key={isReady ? "ready" : "fight"}
                    initial={{ scale: 2, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="absolute flex items-center justify-center pointer-events-none drop-"
                  >
                    {isReady ? (
                      <img src={RESOURCE_SPRITES.ready} alt="Ready" className="w-[30vw] max-w-[400px] object-contain" />
                    ) : (
                      <img src={RESOURCE_SPRITES.fight} alt="Fight" className="w-[40vw] max-w-[500px] object-contain" />
                    )}
                  </motion.div>
                );
              })()}
            </motion.div>
          )}
      </AnimatePresence>

      {/* KO Sequence Overlay */}
      <AnimatePresence>
        {gameState.koSequenceActive && gameState.gameMode !== "SUMMON" && (
          <motion.div
            key="ko-anim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[110] flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              className="relative flex items-center justify-center"
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ 
                scale: [0, 1.8, 0.85, 1.15, 1], 
                rotate: [-15, 12, -8, 4, 0],
                opacity: [0, 1, 1, 1, 1]
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                times: [0, 0.15, 0.35, 0.5, 0.6]
              }}
            >
              <motion.img
                src={RESOURCE_SPRITES.ko}
                alt="K.O."
                className="w-full max-w-[800px] h-auto object-contain filter drop-"
                draggable={false}
                animate={{
                  x: [0, -20, 20, -15, 15, -10, 10, -5, 5, 0],
                  y: [0, -15, 15, -10, 10, -8, 8, -3, 3, 0]
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                  delay: 0.15
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Dynamic Battle Dialog Subtitles */}
      <div className="absolute bottom-[7%] left-0 right-0 mx-auto z-[111] pointer-events-none w-full max-w-[85vmin] px-[2vmin] flex flex-col items-center justify-center">
        <AnimatePresence>
          {(() => {
            if (settings.subtitlesEnabled === false || subtitles.length === 0) return null;
            // Mostra apenas a legenda ativa mais nova para evitar empilhamento desordenado e garantir foco limpo
            const activeSub = subtitles[subtitles.length - 1];
            
            let nameHex = "#facc15"; // default yellow
            if (activeSub.characterId === "goku" || activeSub.characterId.startsWith("goku")) {
              nameHex = "#fbbf24"; // amber-400
            } else if (activeSub.characterId === "vegeta" || activeSub.characterId.startsWith("vegeta")) {
              nameHex = "#22d3ee"; // cyan-400
            } else if (activeSub.characterId === "trunks" || activeSub.characterId.startsWith("trunks")) {
              nameHex = "#c084fc"; // purple-400
            } else if (activeSub.characterId === "goku_black" || activeSub.characterId.startsWith("goku_black")) {
              nameHex = "#fb7185"; // rose-400
            } else if (activeSub.characterId === "piccolo" || activeSub.characterId.startsWith("piccolo")) {
              nameHex = "#4ade80"; // green-400
            }

            const characterDisplayName = activeSub.characterName || activeSub.speakerName || activeSub.characterId || "";

            // Normalização das aspas
            let cleanedText = activeSub.text.trim();
            if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
              cleanedText = cleanedText.substring(1, cleanedText.length - 1);
            }

            const isSmall = settings.subtitlesFontSize === 'SMALL';
            const isLarge = settings.subtitlesFontSize === 'LARGE';

            // Sizing in vmin for absolute, high-dpi landscape visual correctness
            const fontSizeValue = isSmall ? '2.8vmin' : isLarge ? '4.2vmin' : '3.4vmin';
            const nameSizeValue = isSmall ? '1.8vmin' : isLarge ? '3.0vmin' : '2.4vmin';

            return (
              <motion.div
                key={activeSub.id || (activeSub.startedAt + "-" + activeSub.characterId)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col justify-center items-center text-center pointer-events-none select-none w-full"
              >
                <div className={settings.subtitlesBackgroundEnabled ? "bg-black/75 px-[4vmin] py-[2vmin] rounded-[2vmin] border border-stone-800 shadow-2xl backdrop-blur-sm max-w-[70vmin] text-center" : "text-center w-full"}>
                  {characterDisplayName && settings.subtitlesShowSpeakerName !== false && (
                    <span 
                      className="block font-black tracking-[0.1em] uppercase mb-[0.5vmin]"
                      style={{
                        color: nameHex,
                        fontFamily: '"Rajdhani", "Inter", sans-serif',
                        fontSize: nameSizeValue,
                        textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      -{characterDisplayName.toUpperCase()}-
                    </span>
                  )}
                  <p 
                    className="font-extrabold tracking-wide leading-snug drop-shadow-md px-[1vmin]"
                    style={{
                      color: '#ffffff',
                      fontFamily: '"Rajdhani", "Inter", sans-serif',
                      fontSize: fontSizeValue,
                      textShadow: '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0 3px 6px rgba(0,0,0,0.9)'
                    }}
                  >
                    "{cleanedText}"
                  </p>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Training Options Panel */}
      {isTraining && (
        <div className="absolute top-24 md:top-28 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2 items-center">
            {/* Quick Reset Position Button */}
            <button
              onClick={handleResetPositions}
              className="w-12 h-12 flex items-center justify-center rounded-lg bg-orange-600/90 hover:bg-orange-500 border border-orange-500/30 text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              title={t('training_reset_pos') || "Recomeçar Posições"}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Toggle Settings Button */}
            <button
               onClick={() => {
                 setShowTrainingMenu(!showTrainingMenu);
                 AudioManager.getInstance().playSFX("click");
               }}
               className={`h-12 px-4 flex items-center gap-2 rounded-lg border shadow-lg active:scale-95 transition-all cursor-pointer ${
                 showTrainingMenu
                   ? "bg-amber-500 text-black border-amber-400 font-bold"
                   : "bg-slate-900/90 text-white border-white/10 hover:border-amber-500/50"
               }`}
            >
              <Settings className={`w-5 h-5 ${showTrainingMenu ? "animate-spin" : ""}`} />
              <span className="text-xs uppercase font-black tracking-wider">
                {showTrainingMenu ? (t('menu_close') || "Fechar") : (t('training_options') || "Opções de Treino")}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {showTrainingMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-slate-950/95 backdrop-blur-md border border-amber-500/30 rounded-xl p-4 w-72 shadow-2xl flex flex-col gap-4 text-stone-200 mt-1"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
                      {t('training_config') || 'Configurações de Treino'}
                    </h3>
                  </div>
                </div>

                {/* Switch list */}
                <div className="flex flex-col gap-3">
                  {/* Infinite HP */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{t('training_infinite_hp') || 'Vida Infinita (HP)'}</span>
                    <button
                      onClick={handleToggleHp}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                        infiniteHp ? "bg-amber-500" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          infiniteHp ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Infinite Ki */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Ki Infinito (KI)</span>
                    <button
                      onClick={handleToggleKi}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                        infiniteKi ? "bg-amber-500" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          infiniteKi ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Show Hitboxes */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Exibir Hitboxes</span>
                    <button
                      onClick={handleToggleHitboxes}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                        showHitboxes ? "bg-amber-500" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          showHitboxes ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dummy Action Dropdown */}
                  <div className="flex flex-col gap-1 border-t border-white/5 pt-2 relative">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Comportamento do Dummy
                    </span>
                    
                    <button
                      onClick={() => {
                        setIsDummyDropdownOpen(!isDummyDropdownOpen);
                        setIsCpuDropdownOpen(false);
                        setIsCounterDropdownOpen(false);
                        AudioManager.getInstance().playSFX("click");
                      }}
                      className="flex items-center justify-between w-full bg-slate-900 border border-white/10 hover:border-amber-500/50 py-2 px-3 rounded-lg text-xs text-stone-200 transition-all cursor-pointer mt-1"
                    >
                      <span className="font-semibold text-[11px]">
                        {dummyMode === "IDLE"
                          ? "Parado (IDLE)"
                          : dummyMode === "BLOCK"
                          ? "Defesa (BLOCK)"
                          : dummyMode === "JUMP"
                          ? "Pulo (JUMP)"
                          : dummyMode === "CROUCH"
                          ? "Agachar (CROUCH)"
                          : "Repetir (MIRROR)"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${isDummyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDummyDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden flex flex-col gap-0.5 mt-1 bg-slate-900 border border-white/5 rounded-lg p-1 z-50 shadow-xl"
                        >
                          {(Object.keys(DummyMode) as Array<keyof typeof DummyMode>).map((m) => {
                            const isSelected = dummyMode === m;
                            return (
                              <button
                                key={m}
                                onClick={() => {
                                  if (gameEngine) {
                                    gameEngine.setDummyMode(DummyMode[m]);
                                    setDummyModeState(DummyMode[m]);
                                    setIsDummyDropdownOpen(false);
                                    AudioManager.getInstance().playSFX("click");
                                  }
                                }}
                                className={`flex items-center justify-between w-full py-1.5 px-2 rounded text-left text-[11px] transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-black font-bold"
                                    : "text-slate-350 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span>
                                  {m === "IDLE"
                                    ? "Parado (IDLE)"
                                    : m === "BLOCK"
                                    ? "Defesa (BLOCK)"
                                    : m === "JUMP"
                                    ? "Pulo (JUMP)"
                                    : m === "CROUCH"
                                    ? "Agachar (CROUCH)"
                                    : "Repetir (MIRROR)"}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ações da CPU */}
                  <div className="flex flex-col gap-1 border-t border-white/5 pt-2 relative">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ações da CPU (IA)
                    </span>
                    
                    <button
                      onClick={() => {
                        setIsCpuDropdownOpen(!isCpuDropdownOpen);
                        setIsDummyDropdownOpen(false);
                        setIsCounterDropdownOpen(false);
                        AudioManager.getInstance().playSFX("click");
                      }}
                      className="flex items-center justify-between w-full bg-slate-900 border border-white/10 hover:border-amber-500/50 py-2 px-3 rounded-lg text-xs text-stone-200 transition-all cursor-pointer mt-1"
                    >
                      <span className="font-semibold text-[11px]">
                        {cpuAction === "OFF"
                          ? "Desativado (Normal)"
                          : cpuAction === "DEFEND_ALWAYS"
                          ? "Defender Sempre"
                          : cpuAction === "COUNTER_ATTACK"
                          ? "Contra-atacar"
                          : cpuAction === "REFLECT_BEAM"
                          ? "Refletir Beam"
                          : "IA Completa"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${isCpuDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCpuDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden flex flex-col gap-0.5 mt-1 bg-slate-900 border border-white/5 rounded-lg p-1 z-50 shadow-xl"
                        >
                          {(Object.keys(CpuAction) as Array<keyof typeof CpuAction>).map((act) => {
                            const isSelected = cpuAction === act;
                            return (
                              <button
                                key={act}
                                onClick={() => {
                                  if (gameEngine) {
                                    gameEngine.setCpuAction(CpuAction[act]);
                                    setCpuActionState(CpuAction[act]);
                                    setIsCpuDropdownOpen(false);
                                    AudioManager.getInstance().playSFX("click");
                                  }
                                }}
                                className={`flex items-center justify-between w-full py-1.5 px-2 rounded text-left text-[11px] transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-black font-bold"
                                    : "text-slate-350 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span>
                                  {act === "OFF"
                                    ? "Desativado (Normal)"
                                    : act === "DEFEND_ALWAYS"
                                    ? "Defender Sempre"
                                    : act === "COUNTER_ATTACK"
                                    ? "Contra-atacar"
                                    : act === "REFLECT_BEAM"
                                    ? "Refletir Beam"
                                    : "IA Completa"}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Counter-Attack Action (visible only when cpuAction === 'COUNTER_ATTACK') */}
                  {cpuAction === "COUNTER_ATTACK" && (
                    <div className="flex flex-col gap-1 border-t border-white/5 pt-2 relative">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Ataque de Contra-Ataque
                      </span>
                      
                      <button
                        onClick={() => {
                          setIsCounterDropdownOpen(!isCounterDropdownOpen);
                          setIsDummyDropdownOpen(false);
                          setIsCpuDropdownOpen(false);
                          AudioManager.getInstance().playSFX("click");
                        }}
                        className="flex items-center justify-between w-full bg-slate-900 border border-white/10 hover:border-amber-500/50 py-2 px-3 rounded-lg text-xs text-stone-200 transition-all cursor-pointer mt-1"
                      >
                        <span className="font-semibold text-[11px]">
                          {counterAttackType === "LIGHT"
                            ? "Soco Leve (Light)"
                            : counterAttackType === "MEDIUM"
                            ? "Soco Médio (Medium)"
                            : counterAttackType === "HEAVY"
                            ? "Soco Forte / Lançador"
                            : counterAttackType === "SPECIAL"
                            ? "Especial / Ki Blast"
                            : "Ataque Supremo (Ultimate)"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-200 ${isCounterDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isCounterDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden flex flex-col gap-0.5 mt-1 bg-slate-900 border border-white/5 rounded-lg p-1 z-50 shadow-xl"
                          >
                            {(Object.keys(CounterAttackType) as Array<keyof typeof CounterAttackType>).map((ct) => {
                              const isSelected = counterAttackType === ct;
                              return (
                                <button
                                  key={ct}
                                  onClick={() => {
                                    if (gameEngine) {
                                      gameEngine.setCounterAttackType(CounterAttackType[ct]);
                                      setCounterAttackTypeState(CounterAttackType[ct]);
                                      setIsCounterDropdownOpen(false);
                                      AudioManager.getInstance().playSFX("click");
                                    }
                                  }}
                                  className={`flex items-center justify-between w-full py-1.5 px-2 rounded text-left text-[11px] transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-500 text-black font-bold"
                                      : "text-slate-350 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  <span>
                                    {ct === "LIGHT"
                                      ? "Soco Leve (Light)"
                                      : ct === "MEDIUM"
                                      ? "Soco Médio (Medium)"
                                      : ct === "HEAVY"
                                      ? "Soco Forte / Lançador"
                                      : ct === "SPECIAL"
                                      ? "Especial / Ki Blast"
                                      : "Ataque Supremo (Ultimate)"}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Footer/Quick Exit Actions */}
                <div className="flex gap-2 border-t border-white/10 pt-3">
                  <button
                    onClick={handleCharacterSelect}
                    className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 rounded hover:text-white cursor-pointer"
                  >
                    Lutadores
                  </button>
                  <button
                    onClick={handleModeMenu}
                    className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider bg-red-950/80 hover:bg-red-900/90 border border-red-900 text-red-300 rounded cursor-pointer"
                  >
                    Modos
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </div>
    </div>
  );
};
