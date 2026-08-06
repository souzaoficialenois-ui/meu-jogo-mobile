import React, { useState, useEffect, useMemo } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CpuAction, CounterAttackType } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { CpuStreakManager } from '../../services/CpuStreakManager';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Settings, LogOut, BookOpen, Target, 
  ChevronRight, Zap, Swords, Shield, Activity, Sparkles, Wind, Crosshair, Flame, Sword,
  Gamepad2, MoveLeft, MoveRight, MoveUp, MoveDown, Layers, Users, UserPlus, Repeat,
  XCircle, CheckCircle2, SlidersHorizontal, Info, Orbit, RotateCcw, Bot
} from 'lucide-react';

const HUD_ICONS: Record<string, React.ReactNode> = {
  dpad: <Gamepad2 className="text-white w-5 h-5" />,
  special: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special" />,
  light: <img draggable={false} src="/Assets/icones%20ui/combo%20leve.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Light" />,
  medium: <img draggable={false} src="/Assets/icones%20ui/icone%20combo%20medio.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Medium" />,
  heavy: <img draggable={false} src="/Assets/icones%20ui/icone%20combo%20forte.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Heavy" />,
  dash: <img draggable={false} src="/Assets/icones%20ui/icone%20dash.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Dash" />,
  block: <img draggable={false} src="/Assets/icones%20ui/icone%20defeza.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Block" />,
  charge: <img draggable={false} src="/Assets/icones%20ui/icone%20carregando%20ki.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Charge" />,
  ultimate: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Ultimate" />,
  vanish: <Orbit className="text-slate-300 w-5 h-5" />,
  transform: <img draggable={false} src="/Assets/icones%20ui/icone%20transforma%C3%A7%C3%A3o.png" className="w-8 h-8 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Transform" />,
  tag: <Repeat className="text-orange-400 w-5 h-5" />,
  assist1: <Users className="text-orange-400 w-5 h-5" />,
  assist2: <UserPlus className="text-orange-400 w-5 h-5" />,
  left: <MoveLeft className="text-white w-5 h-5" />,
  right: <MoveRight className="text-white w-5 h-5" />,
  up: <MoveUp className="text-white w-5 h-5" />,
  down: <MoveDown className="text-white w-5 h-5" />,
};

const COMBO_LIST = [
  { name: 'Light Combo', inputs: ['light', 'light', 'light', 'light'] },
  { name: 'Medium Combo', inputs: ['medium', 'medium', 'medium'] },
  { name: 'Heavy Attack / Launcher', inputs: ['heavy', 'heavy'] },
  { name: 'Ki Blast', inputs: ['special'] },
  { name: 'Charge Ki', inputs: ['charge'] },
  { name: 'Ultimate Attack', inputs: ['ultimate'] },
  { name: 'Vanish', inputs: ['vanish'] },
  { name: 'Aerial Light', inputs: ['up', 'light', 'light'] },
  { name: 'Aerial Medium', inputs: ['up', 'medium', 'medium'] },
  { name: 'Crouching Attack', inputs: ['down', 'light'] },
  { name: 'Transform', inputs: ['transform'] },
  { name: 'Assist 1', inputs: ['assist1'] },
  { name: 'Assist 2', inputs: ['assist2'] },
  { name: 'Tag Character', inputs: ['tag'] },
];

export const PauseScreen: React.FC = () => {
  const { setPaused, changeScene, t, gameEngine, settings, createGameSession, startLoading } = useSceneManager();
  const isPt = settings?.language === 'pt';
  
  const [activePanel, setActivePanel] = useState<'main' | 'commands' | 'training'>('main');
  const [activeTrainingTab, setActiveTrainingTab] = useState<'dummy' | 'cpu' | 'system'>('dummy');
  const [, setForceUpdate] = useState(0);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(0);

  // Update selection if activePanel changes to commands
  useEffect(() => {
    if (activePanel === 'commands') {
      setSelectedMoveIndex(0);
    }
  }, [activePanel]);

  // MOVES_ICONS extensions to map secondary skills to their corresponding icons
  const MOVES_ICONS: Record<string, React.ReactNode> = useMemo(() => ({
    ...HUD_ICONS,
    special2: HUD_ICONS.special,
    special3: HUD_ICONS.special,
    special4: HUD_ICONS.special,
    ultimate2: HUD_ICONS.ultimate,
    ultimate3: HUD_ICONS.ultimate,
  }), []);

  // Compute dynamic moves list based on active character's files & spriteConfig animations!
  const dynamicMoves = useMemo(() => {
    const p1 = gameEngine?.player1;
    if (!p1) {
      // Fallback if no active player
      return COMBO_LIST.map(c => ({
        name: isPt ? (
          c.name === 'Light Combo' ? 'Combo Leve' :
          c.name === 'Medium Combo' ? 'Combo Médio' :
          c.name === 'Heavy Attack / Launcher' ? 'Golpe Forte / Lançador' :
          c.name === 'Ki Blast' ? 'Disparo de Ki' :
          c.name === 'Dash' ? 'Investida' :
          c.name === 'Charge Ki' ? 'Carregar Ki' :
          c.name === 'Ultimate Attack' ? 'Ataque Supremo' :
          c.name === 'Vanish' ? 'Teleporte' :
          c.name === 'Aerial Light' ? 'Leve Aéreo' :
          c.name === 'Aerial Medium' ? 'Médio Aéreo' :
          c.name === 'Crouching Attack' ? 'Ataque Agachado' :
          c.name === 'Transform' ? 'Transformar' :
          c.name === 'Assist 1' ? 'Assistente 1' :
          c.name === 'Assist 2' ? 'Assistente 2' :
          c.name === 'Tag Character' ? 'Trocar Personagem' : c.name
        ) : c.name,
        inputs: c.inputs,
        imageUrl: "",
        category: isPt ? "Básicos" : "Basics"
      }));
    }

    const charId = (p1.data?.id || "").toLowerCase();
    const charName = (p1.data?.name || "").toLowerCase();
    const animConfig = p1.data?.spriteConfig?.animations || {};
    const animKeys = Object.keys(animConfig);
    const upperKeys = animKeys.map(k => k.toUpperCase());

    const hasAnyKey = (patterns: string[]) => {
      return upperKeys.some(k => patterns.some(p => k.includes(p.toUpperCase()) || k === p.toUpperCase()));
    };

    const getFirstImage = (patterns: string[]) => {
      const foundKey = animKeys.find(k => patterns.some(p => k.toUpperCase().includes(p.toUpperCase()) || k.toUpperCase() === p.toUpperCase()));
      return foundKey ? animConfig[foundKey]?.imageUrl || "" : "";
    };

    const moves = [];

    // Category: Movimentação & Básicos
    moves.push({
      name: isPt ? 'Carregar Ki' : 'Charge Ki',
      inputs: ['charge'],
      imageUrl: getFirstImage(['charge_1', 'carregando_ki_inicio', 'carregando_ki_loop', 'charge']),
      category: isPt ? 'Básicos' : 'Basics'
    });
    moves.push({
      name: isPt ? 'Ki Blast' : 'Ki Blast',
      inputs: ['special'],
      imageUrl: getFirstImage(['especiais_ki_blast_padrão_1', 'especiais_ki_blast_padrao_1', 'especiais_ki_blast_ar_1', 'ki_blast']),
      category: isPt ? 'Básicos' : 'Basics'
    });
    moves.push({
      name: isPt ? 'Vanish' : 'Vanish',
      inputs: ['vanish'],
      imageUrl: getFirstImage(['teleporte_teleporte', 'teleporte']),
      category: isPt ? 'Básicos' : 'Basics'
    });
    if (hasAnyKey(['transformacao', 'transform'])) {
      moves.push({
        name: isPt ? 'Transformar' : 'Transform',
        inputs: ['transform'],
        imageUrl: getFirstImage(['transformacoes_formas_ssj_1', 'transformacao_formas_ssj_1', 'transformacao', 'transform']),
        category: isPt ? 'Básicos' : 'Basics'
      });
    }

    // Category: Combos
    moves.push({
      name: isPt ? 'Combo Leve' : 'Light Combo',
      inputs: ['light', 'light', 'light', 'light'],
      imageUrl: getFirstImage(['combo_leve_1', 'combo_leve_padrão_1']),
      category: isPt ? 'Combos' : 'Combos'
    });
    moves.push({
      name: isPt ? 'Combo Médio' : 'Medium Combo',
      inputs: ['medium', 'medium', 'medium'],
      imageUrl: getFirstImage(['combo_medio_1', 'combo_medio_padrão_1', 'combo_medio_agachado_combo_médio_agachado']),
      category: isPt ? 'Combos' : 'Combos'
    });
    moves.push({
      name: isPt ? 'Golpe Forte / Lançador' : 'Heavy Attack / Launcher',
      inputs: ['heavy', 'heavy'],
      imageUrl: getFirstImage(['combo_forte_1', 'combo_forte_padrão_1']),
      category: isPt ? 'Combos' : 'Combos'
    });

    // Category: Especiais (ONLY show the ones the character actually has!)
    if (hasAnyKey(["ESPECIAL_1", "ESPCEIAL_1", "SPECIAL_1", "SPECIAL", "ESPECIAL"])) {
      moves.push({
        name: isPt ? 'Especial 1' : 'Special 1',
        inputs: ['special'],
        imageUrl: getFirstImage(['ESPECIAL_1', 'ESPCEIAL_1', 'SPECIAL_1', 'SPECIAL', 'ESPECIAL']),
        category: isPt ? 'Especiais (Especial)' : 'Specials (Special)'
      });
    }

    if (hasAnyKey(["ESPECIAL_2", "ESPCEIAL_2", "SPECIAL_2", "SPE_2"])) {
      moves.push({
        name: isPt ? 'Especial 2' : 'Special 2',
        inputs: ['special2'],
        imageUrl: getFirstImage(['ESPECIAL_2', 'ESPCEIAL_2', 'SPECIAL_2', 'SPE_2']),
        category: isPt ? 'Especiais (Especial)' : 'Specials (Special)'
      });
    }

    if (hasAnyKey(["ESPECIAL_3", "ESPCEIAL_3", "SPECIAL_3", "SPE_3"])) {
      moves.push({
        name: isPt ? 'Especial 3' : 'Special 3',
        inputs: ['special3'],
        imageUrl: getFirstImage(['ESPECIAL_3', 'ESPCEIAL_3', 'SPECIAL_3', 'SPE_3']),
        category: isPt ? 'Especiais (Especial)' : 'Specials (Special)'
      });
    }

    if (hasAnyKey(["ESPECIAL_4", "ESPCEIAL_4", "SPECIAL_4", "SPE_4"])) {
      moves.push({
        name: isPt ? 'Especial 4' : 'Special 4',
        inputs: ['special4'],
        imageUrl: getFirstImage(['ESPECIAL_4', 'ESPCEIAL_4', 'SPECIAL_4', 'SPE_4']),
        category: isPt ? 'Especiais (Especial)' : 'Specials (Special)'
      });
    }

    if (hasAnyKey(["ESPECIAL_5", "ESPCEIAL_5", "SPECIAL_5", "SPE_5"])) {
      moves.push({
        name: isPt ? 'Especial 5' : 'Special 5',
        inputs: ['special5'],
        imageUrl: getFirstImage(['ESPECIAL_5', 'ESPCEIAL_5', 'SPECIAL_5', 'SPE_5']),
        category: isPt ? 'Especiais (Especial)' : 'Specials (Special)'
      });
    }

    // Category: Ultimates / Supremos (ONLY show the ones the character actually has!)
    if (hasAnyKey(["ULTIMATE_1", "ULTIMATE_PARTE1", "ULT_1", "ULTIMATE", "SUPER_ESPECIAL"])) {
      moves.push({
        name: isPt ? 'Ultimate 1' : 'Ultimate 1',
        inputs: ['ultimate'],
        imageUrl: getFirstImage(['ULTIMATE_1', 'ULTIMATE_PARTE1', 'ULT_1', 'ULTIMATE', 'SUPER_ESPECIAL']),
        category: isPt ? 'Poderes Supremos (Ultimate)' : 'Supreme Powers (Ultimate)'
      });
    }

    if (hasAnyKey(["ULTIMATE_2", "ULTIMATE_PARTE2", "ULT_2"])) {
      moves.push({
        name: isPt ? 'Ultimate 2' : 'Ultimate 2',
        inputs: ['ultimate2'],
        imageUrl: getFirstImage(['ULTIMATE_2', 'ULTIMATE_PARTE2', 'ULT_2']),
        category: isPt ? 'Poderes Supremos (Ultimate)' : 'Supreme Powers (Ultimate)'
      });
    }

    if (hasAnyKey(["ULTIMATE_3", "ULTIMATE_PARTE3", "ULT_3"])) {
      moves.push({
        name: isPt ? 'Ultimate 3' : 'Ultimate 3',
        inputs: ['ultimate3'],
        imageUrl: getFirstImage(['ULTIMATE_3', 'ULTIMATE_PARTE3', 'ULT_3']),
        category: isPt ? 'Poderes Supremos (Ultimate)' : 'Supreme Powers (Ultimate)'
      });
    }

    // Ultimate Combinado Checks
    if (upperKeys.some(k => k.includes("COMBINADO") || k.includes("COMBINADAS") || k.includes("COMBINADA_"))) {
      let partnerName = "";
      const combinados = upperKeys.filter(k => k.includes("COMBINADO"));
      for (const k of combinados) {
          if (k.includes("ANDROID18") || k.includes("ANDROID_18") || k.includes("A18")) partnerName = "Android 18";
          else if (k.includes("ZAMASU") || k.includes("ZAMAS") || k.includes("Z1") || k.includes("Z2")) partnerName = "Zamasu";
          else if (k.includes("GOKU_BLACK") || k.includes("GOKU_BLACK_ROSE") || k.includes("GB")) partnerName = "Goku Black";
          else if (k.includes("VEGETA")) partnerName = "Vegeta";
          else if (k.includes("GOKU")) partnerName = "Goku";
      }
      
      if (!partnerName) {
          if (charId === "goku_base" || charId === "gokubase" || charName.includes("goku base")) partnerName = "Bardock";
          else if (charId === "kuririn" || charName.includes("kuririn")) partnerName = "Android 18";
      }

      moves.push({
        name: partnerName 
          ? (isPt ? `Ultimate Combinado (${partnerName})` : `Combined Ultimate (${partnerName})`)
          : (isPt ? "Ultimate Combinado" : "Combined Ultimate"),
        inputs: ['ultimate'],
        imageUrl: getFirstImage(['COMBINADO', 'COMBINADAS']),
        category: isPt ? 'Poderes Supremos (Ultimate)' : 'Supreme Powers (Ultimate)'
      });
    }

    return moves;
  }, [gameEngine, isPt]);

  const p1CharacterName = gameEngine?.player1?.data?.name || (isPt ? "GUERREIRO" : "WARRIOR");
  const currentSelectedMove = dynamicMoves[selectedMoveIndex] || dynamicMoves[0] || null;

  const gameState = (gameEngine as any)?.gameState;
  const isTraining = gameState?.gameMode === 'TRAINING';

  const handleResume = () => {
    AudioManager.getInstance().playSFX('click');
    setPaused(false);
  };

  const handleRestart = () => {
    if (!gameEngine) return;
    AudioManager.getInstance().playSFX('confirm');
    setPaused(false);
    const p1Team = gameEngine.p1Team.map(p => p.data);
    const p2Team = gameEngine.p2Team.map(p => p.data);
    const mode = (gameEngine as any).gameState?.gameMode || 'ARCADE';
    createGameSession(p1Team, p2Team, mode === 'TRAINING', mode);
    startLoading(SceneName.VS_SCREEN);
  };

  const handleQuit = () => {
    AudioManager.getInstance().playSFX('cancel');
    setPaused(false);
    changeScene(SceneName.MAIN_MENU);
  };

  const togglePanel = (panel: 'commands' | 'training') => {
    AudioManager.getInstance().playSFX('click');
    setActivePanel(prev => prev === panel ? 'main' : panel);
  };

  const handleToggleSetting = (settingName: 'trainingInfiniteKi' | 'trainingInfiniteHp' | 'trainingShowHitboxes') => {
    AudioManager.getInstance().playSFX('click');
    if (gameEngine) {
      gameEngine[settingName] = !gameEngine[settingName];
      setForceUpdate(prev => prev + 1);
    }
  };

  const setDummyMode = (mode: string) => {
    AudioManager.getInstance().playSFX('click');
    if (gameEngine && gameEngine.dummyController) {
      gameEngine.setDummyMode(mode as any);
      setForceUpdate(prev => prev + 1);
    }
  };

  const currentDummyMode = gameEngine?.dummyController?.mode || 'IDLE';

  // Floating background particles
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5
  }));

  const setCpuAction = (mode: CpuAction) => {
    AudioManager.getInstance().playSFX('click');
    if (gameEngine) {
      gameEngine.setCpuAction(mode);
      setForceUpdate(prev => prev + 1);
    }
  };

  const setCounterAttackType = (type: CounterAttackType) => {
    AudioManager.getInstance().playSFX('click');
    if (gameEngine) {
      gameEngine.setCounterAttackType(type);
      setForceUpdate(prev => prev + 1);
    }
  };

  const handleResetPositions = () => {
    AudioManager.getInstance().playSFX('click');
    if (gameEngine) {
      gameEngine.reset();
    }
    setPaused(false);
  };

  const currentCpuAction = gameEngine?.cpuAction || CpuAction.OFF;
  const currentCounterAttackType = gameEngine?.counterAttackType || CounterAttackType.LIGHT;

  const mainMenuItems = [
    { id: 'resume', label: t('pause_resume') || 'Resume Game', icon: Play, onClick: handleResume, color: 'from-orange-500 to-orange-400' },
    { id: 'restart', label: isPt ? 'Reiniciar Partida' : 'Restart Match', icon: Repeat, onClick: handleRestart, color: 'from-orange-500 to-orange-400' },
    ...(isTraining ? [
      { 
        id: 'reset_pos', 
        label: isPt ? 'Resetar Posições' : 'Reset Positions', 
        icon: RotateCcw, 
        onClick: handleResetPositions, 
        color: 'from-amber-600 to-yellow-500' 
      },
      { 
        id: 'training', 
        label: isPt ? 'Opções de Treino' : 'Training Options', 
        icon: Target, 
        onClick: () => togglePanel('training'), 
        color: 'from-orange-500 to-orange-500' 
      },
    ] : []),
    { id: 'commands', label: t('pause_commands') || 'Command List', icon: BookOpen, onClick: () => togglePanel('commands'), color: 'from-orange-500 to-orange-400' },
    { id: 'settings', label: t('pause_settings') || 'Settings', icon: Settings, onClick: () => { AudioManager.getInstance().playSFX('click'); changeScene(SceneName.SETTINGS); }, color: 'from-slate-500 to-slate-400' },
    { id: 'quit', label: t('pause_quit') || 'Quit to Menu', icon: LogOut, onClick: handleQuit, color: 'from-red-600 to-orange-500', isDanger: true },
  ];

  return (
    <div className="absolute inset-0 z-[1000] overflow-hidden bg-black/60 backdrop-blur-sm flex font-sans">
      
      {/* Dynamic particles background */}
      {particles.map(p => (
        <motion.div
           key={p.id}
           className="absolute rounded-full bg-white/20"
           style={{
             width: p.size,
             height: p.size,
             left: `${p.x}%`,
             top: `${p.y}%`,
           }}
           animate={{
             y: [0, -100, 0],
             opacity: [0.2, 0.8, 0.2]
           }}
           transition={{
             duration: p.duration,
             repeat: Infinity,
             delay: p.delay,
             ease: "linear"
           }}
        />
      ))}

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] pointer-events-none opacity-50" />

      {/* Main Container */}
      <div className="relative w-full h-full flex items-center justify-center p-8 lg:p-16 z-10 gap-8">
        
        {/* Left Side: Main Menu Options */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col w-full max-w-[300px] md:max-w-[400px] h-full justify-center gap-[2vmin] md:gap-4 relative z-20 shrink-0"
        >
          {/* Pause Title */}
          <div className="mb-[4vmin] md:mb-8 pl-[2vmin] md:pl-4 border-l-4 border-white">
            <h1 className="text-[8vmin] md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none drop-shadow-[-4px_4px_0_rgba(0,0,0,0.5)]">
              PAUSED
            </h1>
            <p className="text-slate-400 font-mono text-[2vmin] md:text-sm tracking-[0.2em] uppercase mt-2">
              Combat Sequence Suspended
            </p>
          </div>

          <div className="space-y-[1.5vmin] md:space-y-3">
            {mainMenuItems.map((item, index) => {
              const isActive = (item.id === 'commands' && activePanel === 'commands') || 
                               (item.id === 'training' && activePanel === 'training');
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  onClick={item.onClick}
                  className={`
                    relative w-full group overflow-hidden rounded-xl border
                    transition-all duration-300 transform outline-none
                    hover:scale-105 hover:shadow-2xl hover:-translate-y-1
                    ${isActive 
                      ? 'border-white bg-white/10 ' 
                      : 'border-white/10 bg-black/40 hover:bg-black/80 hover:border-white/30'}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                  
                  {isActive && <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20`} />}

                  <div className="relative px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        p-2 rounded-lg bg-black/50 border border-white/10
                        group-hover:border-white/30 transition-colors
                        ${item.isDanger ? 'text-red-400 group-hover:text-red-300' : 'text-slate-300 group-hover:text-white'}
                        ${isActive ? 'text-white border-white/50' : ''}
                      `}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className={`
                        text-base md:text-2xl font-black italic uppercase tracking-wider
                        ${item.isDanger ? 'text-red-400 group-hover:text-red-300' : 'text-slate-200 group-hover:text-white'}
                        ${isActive ? 'text-white' : ''}
                      `}>
                        {item.label}
                      </span>
                    </div>
                    {(item.id === 'commands' || item.id === 'training') && (
                      <ChevronRight className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'rotate-90 text-white' : 'text-slate-500 group-hover:text-white group-hover:translate-x-1'}`} />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Right Side: Context Panels */}
        <div className="flex-1 h-[80%] max-w-3xl relative">
          <AnimatePresence mode="wait">
            
            {activePanel === 'commands' && (
              <motion.div
                key="commands"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className="w-full h-full flex flex-col rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/20 to-transparent flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-orange-400" />
                    <div>
                      <h2 className="text-2xl font-black italic text-white uppercase tracking-wider">COMANDO & HABILIDADES</h2>
                      <p className="text-orange-300/60 font-mono text-xs uppercase tracking-widest">{p1CharacterName}</p>
                    </div>
                  </div>
                  <button onClick={() => togglePanel('commands')} className="header-close-btn p-2 rounded-full hover:bg-white/10 transition">
                    <XCircle className="w-6 h-6 text-slate-400 hover:text-white" />
                  </button>
                </div>
                
                {/* Split Layout: Left for list of skills, right for live gif preview */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {/* LEFT: ListView of moves */}
                  <div className="w-[50%] h-full flex flex-col border-r border-white/10">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {['Básicos', 'Combos', 'Especiais (Especial)', 'Poderes Supremos (Ultimate)'].map(cat => {
                        const catMoves = dynamicMoves.filter(m => m.category === cat || (cat === 'Básicos' && m.category === 'Báshicos'));
                        if (catMoves.length === 0) return null;
                        
                        return (
                          <div key={cat} className="space-y-2">
                            <h3 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] px-2 mb-1">
                              {cat}
                            </h3>
                            <div className="space-y-1.5">
                              {catMoves.map((combo) => {
                                const globalIndex = dynamicMoves.indexOf(combo);
                                const isSelected = selectedMoveIndex === globalIndex;
                                
                                return (
                                  <motion.div
                                    key={combo.name}
                                    onClick={() => {
                                      setSelectedMoveIndex(globalIndex);
                                      AudioManager.getInstance().playSFX('click');
                                    }}
                                    onMouseEnter={() => {
                                      setSelectedMoveIndex(globalIndex);
                                    }}
                                    className={`
                                      flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group
                                      ${isSelected 
                                        ? 'bg-orange-500/15 border-orange-500/60 ' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                                    `}
                                  >
                                    <div className="flex flex-col items-start min-w-0 pr-2">
                                      <span className={`text-[12px] md:text-[13px] font-bold uppercase tracking-wider truncate leading-none ${isSelected ? 'text-orange-400 font-black' : 'text-slate-300'}`}>
                                        {combo.name}
                                      </span>
                                      {combo.inputs && combo.inputs.includes('ultimate') && (
                                        <span className="text-[9px] font-bold text-yellow-500 mt-1 uppercase tracking-widest flex items-center gap-1">
                                          <Sparkles className="w-2.5 h-2.5" /> SUPREMO
                                        </span>
                                      )}
                                      {combo.inputs && combo.inputs.some(inp => inp.startsWith('special') && inp !== 'special') && (
                                        <span className="text-[9px] font-bold text-orange-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                                          <Flame className="w-2.5 h-2.5" /> ESPECIAL
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                      {combo.inputs.map((input, j) => (
                                        <div key={j} className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-0.5">
                                          {MOVES_ICONS[input] || <span className="text-[9px] font-bold text-white uppercase">{input}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: Live Playing GIF Preview Monitor */}
                  <div className="w-[50%] h-full flex flex-col items-center justify-between p-4 bg-slate-950/40 relative min-h-0">
                    {currentSelectedMove ? (
                      <div className="w-full flex flex-col h-full justify-between items-center relative min-h-0">
                        {/* Header status indicator */}
                        <div className="w-full flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                              PREVISÃO DE ANIMAÇÃO
                            </span>
                          </div>
                          <span className="text-[9px] font-bold font-mono text-slate-500">
                            {p1CharacterName}
                          </span>
                        </div>
                        
                        {/* GIF animation preview section */}
                        <div className="flex-1 w-full flex items-center justify-center my-3 overflow-hidden relative rounded-xl border border-white/10 bg-black/80 shadow-inner group min-h-0">
                          {/* Matrix grid accents */}
                          <div className="absolute inset-x-0 h-[1px] bg-cyan-500/10 top-1/2 -translate-y-1/2 pointer-events-none z-10 animate-pulse" />
                          <div className="absolute inset-y-0 w-[1px] bg-cyan-500/10 left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-pulse" />
                          
                          {/* Scanning effect Overlay */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] pointer-events-none opacity-20 z-20" />
                          
                          {currentSelectedMove.imageUrl ? (
                            <motion.img
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1.15 }}
                              key={currentSelectedMove.imageUrl}
                              src={currentSelectedMove.imageUrl}
                              referrerPolicy="no-referrer"
                              className="max-h-[85%] max-w-[85%] object-contain filter drop- select-none pointer-events-none"
                              alt={currentSelectedMove.name}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-600 select-none">
                              <Sword className="w-10 h-10 text-slate-700 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">STANDBY MODE</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Summary description details */}
                        <div className="w-full bg-black/60 border border-white/5 p-3 rounded-xl flex flex-col items-start gap-0.5 shrink-0">
                          <h4 className="text-[13px] font-black italic uppercase tracking-wider text-orange-400">
                            {currentSelectedMove.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-normal">
                            {currentSelectedMove.category.includes('Básico') 
                              ? 'Ação de movimento padrão, carregamento de energia Ki ou investida rápida.' 
                              : currentSelectedMove.category.includes('Combo') 
                              ? 'Combinação contínua de golpes físicos de curto alcance.' 
                              : currentSelectedMove.category.includes('Especial')
                              ? 'Poder especial ou técnica concentrada característica do guerreiro ativo.'
                              : 'O golpe supremo absoluto de destruição maciça. Consome grande quantidade de Ki.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-30 my-auto">
                        <BookOpen size={40} className="text-slate-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          {isPt ? "Selecione uma habilidade para visualizar" : "Select an ability to view"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activePanel === 'training' && (
              <motion.div
                key="training"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className="w-full h-full flex flex-col rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/20 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Target className="w-8 h-8 text-orange-400" />
                    <div>
                      <h2 className="text-2xl font-black italic text-white uppercase tracking-wider">
                        {isPt ? "Configurar Treino" : "Training Config"}
                      </h2>
                      <p className="text-orange-300/60 font-mono text-xs uppercase tracking-widest">
                        {isPt ? "Configurações de Simulação" : "Simulation Settings"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => togglePanel('training')} className="header-close-btn p-2 rounded-full hover:bg-white/10 transition">
                    <XCircle className="w-6 h-6 text-slate-400 hover:text-white" />
                  </button>
                </div>
                
                <div className="flex border-b border-white/10 bg-black/20">
                  <button
                    onClick={() => setActiveTrainingTab('dummy')}
                    className={`flex-1 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2
                      ${activeTrainingTab === 'dummy' ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Orbit className="w-4 h-4" /> {isPt ? "Estado do Alvo" : "Dummy State"}
                  </button>
                  <button
                    onClick={() => setActiveTrainingTab('cpu')}
                    className={`flex-1 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2
                      ${activeTrainingTab === 'cpu' ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Bot className="w-4 h-4" /> {isPt ? "Ações da CPU" : "CPU Actions"}
                  </button>
                  <button
                    onClick={() => setActiveTrainingTab('system')}
                    className={`flex-1 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2
                      ${activeTrainingTab === 'system' ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <SlidersHorizontal className="w-4 h-4" /> {isPt ? "Sistema" : "System"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {activeTrainingTab === 'dummy' && (
                      <motion.div key="dummy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        
                        <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-4">
                           <div className="flex items-center gap-3 mb-4">
                             <Orbit className="w-5 h-5 text-orange-400" />
                             <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                               {isPt ? "Modo de Comportamento" : "Behavior Mode"}
                             </h3>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             {['IDLE', 'JUMP', 'BLOCK', 'CROUCH', 'MIRROR'].map(mode => (
                               <button 
                                  key={mode}
                                  onClick={() => setDummyMode(mode)}
                                  className={`
                                    py-3 px-4 rounded-lg font-bold uppercase tracking-wider border transition-all flex items-center justify-between
                                    ${currentDummyMode === mode 
                                      ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                                      : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}
                                  `}
                               >
                                 {mode === 'MIRROR' ? (isPt ? 'MIRROR (REPETIR)' : 'MIRROR (REPEAT)') : (
                                   mode === 'IDLE' ? (isPt ? 'PARADO' : 'IDLE') :
                                   mode === 'JUMP' ? (isPt ? 'PULAR' : 'JUMP') :
                                   mode === 'BLOCK' ? (isPt ? 'DEFENDER' : 'BLOCK') :
                                   mode === 'CROUCH' ? (isPt ? 'AGACHADO' : 'CROUCH') : mode
                                 )}
                                 {currentDummyMode === mode && <CheckCircle2 className="w-5 h-5" />}
                               </button>
                             ))}
                           </div>
                           <p className="text-slate-500 text-xs flex items-center gap-2 mt-4">
                             <Info className="w-4 h-4" /> {isPt ? "Selecione como o oponente reage durante a simulação de treino." : "Select how the dummy reacts during simulation."}
                           </p>
                        </div>

                      </motion.div>
                    )}

                    {activeTrainingTab === 'cpu' && (
                      <motion.div key="cpu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <div className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Bot className="w-5 h-5 text-orange-400" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                              {isPt ? "Modo da CPU / IA" : "CPU / AI Behavior"}
                            </h3>
                          </div>

                          {/* Adaptive AI Streak Banner */}
                          <div className="p-3 rounded-lg bg-orange-950/40 border border-orange-500/30 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                              <div>
                                <div className="text-xs font-bold text-orange-300 uppercase tracking-wider">
                                  {isPt ? "I.A. Adaptativa Ativa" : "Adaptive AI Active"}
                                </div>
                                <div className="text-[10px] text-slate-300">
                                  {isPt 
                                    ? `Sequência: ${CpuStreakManager.getStreak()} vitórias (+${Math.round((CpuStreakManager.getAggressivenessMultiplier() - 1) * 100)}% agressividade)` 
                                    : `Streak: ${CpuStreakManager.getStreak()} wins (+${Math.round((CpuStreakManager.getAggressivenessMultiplier() - 1) * 100)}% aggression)`}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-orange-400 bg-orange-500/20 px-2 py-1 rounded border border-orange-500/40">
                              {CpuStreakManager.getStreak()}x Streak
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { key: CpuAction.OFF, labelPt: 'Desativado (Normal)', labelEn: 'Off (Normal)' },
                              { key: CpuAction.DEFEND_ALWAYS, labelPt: 'Defender Sempre', labelEn: 'Defend Always' },
                              { key: CpuAction.COUNTER_ATTACK, labelPt: 'Contra-Atacar', labelEn: 'Counter Attack' },
                              { key: CpuAction.REFLECT_BEAM, labelPt: 'Refletir Beam', labelEn: 'Reflect Beam' },
                              { key: CpuAction.FULL_AI, labelPt: 'IA Completa', labelEn: 'Full AI' },
                            ].map(act => (
                              <button
                                key={act.key}
                                onClick={() => setCpuAction(act.key)}
                                className={`
                                  py-3 px-4 rounded-lg font-bold uppercase tracking-wider border transition-all flex items-center justify-between
                                  ${currentCpuAction === act.key 
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                                    : 'bg-black/40 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}
                                `}
                              >
                                <span className="text-xs font-bold">{isPt ? act.labelPt : act.labelEn}</span>
                                {currentCpuAction === act.key && <CheckCircle2 className="w-5 h-5 text-orange-400" />}
                              </button>
                            ))}
                          </div>

                          {currentCpuAction === CpuAction.COUNTER_ATTACK && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                              <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                                {isPt ? "Tipo de Golpe do Contra-Ataque" : "Counter-Attack Move Type"}
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                  { key: CounterAttackType.LIGHT, labelPt: 'Golpe Leve', labelEn: 'Light Attack' },
                                  { key: CounterAttackType.MEDIUM, labelPt: 'Golpe Médio', labelEn: 'Medium Attack' },
                                  { key: CounterAttackType.HEAVY, labelPt: 'Golpe Forte / Lançador', labelEn: 'Heavy / Launcher' },
                                  { key: CounterAttackType.SPECIAL, labelPt: 'Especial / Ki Blast', labelEn: 'Special / Ki Blast' },
                                  { key: CounterAttackType.ULTIMATE, labelPt: 'Ataque Supremo', labelEn: 'Ultimate Attack' },
                                ].map(ct => (
                                  <button
                                    key={ct.key}
                                    onClick={() => setCounterAttackType(ct.key)}
                                    className={`
                                      py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all text-center
                                      ${currentCounterAttackType === ct.key
                                        ? 'bg-orange-500/30 border-orange-500 text-white'
                                        : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}
                                    `}
                                  >
                                    {isPt ? ct.labelPt : ct.labelEn}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTrainingTab === 'system' && (
                      <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                        <ToggleRow 
                          title={isPt ? "Vida Infinita" : "Infinite Health"} 
                          description={isPt ? "Impede que o HP caia abaixo de 1" : "Prevents HP from dropping below 1"}
                          isActive={!!gameEngine?.trainingInfiniteHp} 
                          onToggle={() => handleToggleSetting('trainingInfiniteHp')} 
                        />
                        <ToggleRow 
                          title={isPt ? "Ki Infinito" : "Infinite Ki"} 
                          description={isPt ? "Mantém a barra de energia sempre cheia" : "Keeps the energy gauge always full"}
                          isActive={!!gameEngine?.trainingInfiniteKi} 
                          onToggle={() => handleToggleSetting('trainingInfiniteKi')} 
                        />
                        <ToggleRow 
                          title={isPt ? "Exibir Hitboxes" : "Show Hitboxes"} 
                          description={isPt ? "Exibe retângulos de colisão para golpes" : "Displays collision rectangles for attacks"}
                          isActive={!!gameEngine?.trainingShowHitboxes} 
                          onToggle={() => handleToggleSetting('trainingShowHitboxes')} 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            
            {activePanel === 'main' && (
               <motion.div
                 key="logo"
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 0.4, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 className="absolute inset-0 flex items-center justify-center pointer-events-none"
               >
                  {/* Subtle placeholder when no panel is open */}
                  <div className="w-[400px] h-[400px] border-[40px] border-white/5 rounded-full flex items-center justify-center relative">
                     <div className="absolute inset-x-[-100px] h-[2px] bg-white/10 rotate-45"></div>
                     <div className="absolute inset-x-[-100px] h-[2px] bg-white/10 -rotate-45"></div>
                  </div>
               </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      
      {/* Custom Scrollbar CSS embedded */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

const ToggleRow = ({ title, description, isActive, onToggle }: { title: string, description: string, isActive: boolean, onToggle: () => void }) => (
  <div onClick={onToggle} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group">
    <div>
      <h4 className="text-lg font-bold text-slate-200 uppercase tracking-wide group-hover:text-white">{title}</h4>
      <p className="text-sm text-slate-500 font-mono mt-1">{description}</p>
    </div>
    <div className={`
      relative w-14 h-8 rounded-full transition-colors duration-300
      ${isActive ? 'bg-orange-500 ' : 'bg-black/50'}
    `}>
      <div className={`
        absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300
        ${isActive ? 'left-[calc(100%-1.75rem)]' : 'left-1 opacity-50'}
      `} />
    </div>
  </div>
);

