import React, { useState, useEffect, useRef } from "react";
import { useSceneManager } from "../../contexts/SceneContext";
import {
  SceneName,
  PlayerState,
  CharacterData,
  SpriteConfig,
  AnimationFrameData,
} from "../../types";
import { BASE_CHARACTERS } from "../../personagens/CharacterDatabase";
import { BEAM_DATABASE, BeamFamily } from "../../constants/BeamDatabase";
import { BeamConfigKeyManager } from "../../services/BeamConfigKeyManager";
import {
  PROJECTILE_DATABASE,
  ProjectileFamily,
} from "../../constants/ProjectileDatabase";
import { ProjectileConfigKeyManager } from "../../services/ProjectileConfigKeyManager";
import {
  AuraConfigKeyManager,
  DEFAULT_AURAS,
  ConfiguredAura,
} from "../../services/AuraConfigKeyManager";
import {
  EffectConfigKeyManager,
  ConfiguredEffect,
} from "../../services/EffectConfigKeyManager";
import { DEFAULT_EFFECTS } from "../../constants/EffectDatabase";
import { PLAYER_WIDTH, PLAYER_HEIGHT } from "../../constants";
import {
  ArrowLeft,
  Settings,
  Play,
  Pause,
  Copy,
  Move,
  Maximize,
  Layers,
  CheckCircle,
  Clock,
  Save,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Video,
  Sword,
  Crosshair,
  Cpu,
  Box,
  Zap,
  List,
  Image as ImageIcon,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Plus,
  Clipboard,
  ClipboardPaste,
  Link,
  User,
  MessageSquare,
  Wrench,
  Palette,
  Search,
  Check,
  Edit,
  PlusCircle,
  RotateCcw,
  Flame,
  Folder,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioManager } from "../../services/AudioManager";
import { SpriteRenderer as RealSpriteRenderer } from "../../services/SpriteRenderer";
import { CollisionHelper } from "../../services/CollisionHelper";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { ProjectSweepManager } from "../../services/ProjectSweepManager";

const tintCache = new Map<string, HTMLCanvasElement>();
function getTintedFrame(
  img: CanvasImageSource,
  color: string,
  cacheKey: string,
): HTMLCanvasElement {
  const fullKey = `${cacheKey}_${color}`;
  if (tintCache.has(fullKey)) {
    return tintCache.get(fullKey)!;
  }
  const canvas = document.createElement("canvas");
  canvas.width = (img as any).width || 100;
  canvas.height = (img as any).height || 100;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Convert to grayscale first to avoid colors blending with the original hue (cyan/blue/etc.)
    ctx.save();
    ctx.filter = "grayscale(100%) brightness(1.2)";
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Layer the custom color on top
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85; // 85% tint highlights contrast beautifully
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Blend behind using grayscale to preserve contrast details
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.filter = "grayscale(100%)";
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }
  tintCache.set(fullKey, canvas);
  return canvas;
}

const SliderWithControls = ({
  value,
  min: propMin,
  max: propMax,
  step = 1,
  onChange,
  accentColor = "orange-500",
  largeStep = 10,
  disabled = false,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  largeStep?: number;
  onChange: (val: number) => void;
  accentColor?: string;
  disabled?: boolean;
}) => {
  // Dynamically expand slider limits if value exceeds them, keeping it usable
  let currentMin = propMin;
  let currentMax = propMax;

  if (value < currentMin) {
    currentMin = value - Math.abs(propMax - propMin) / 2;
  }
  if (value > currentMax) {
    currentMax = value + Math.abs(propMax - propMin) / 2;
  }

  return (
    <div
      className={`flex items-center gap-1 w-full relative ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <button
        onClick={() => onChange(value - largeStep)}
        className="w-10 h-10 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shrink-0"
      >
        <ChevronsLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => onChange(value - step)}
        className="w-10 h-10 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 flex flex-col gap-1 px-1">
        <input
          type="range"
          min={currentMin}
          max={currentMax}
          step={step}
          value={Number.isNaN(value) ? currentMin : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-${accentColor}`}
        />
        <input
          type="number"
          value={
            Number.isNaN(Number(value)) ? 0 : Number(Number(value).toFixed(2))
          }
          onChange={(e) => onChange(parseFloat(e.target.value))}
          step={step}
          className={`w-full text-center bg-slate-900 text-slate-300 text-[10px] rounded border border-slate-700 focus:border-${accentColor} focus:outline-none py-0.5`}
        />
      </div>

      <button
        onClick={() => onChange(value + step)}
        className="w-10 h-10 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange(value + largeStep)}
        className="w-10 h-10 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-400 shrink-0"
      >
        <ChevronsRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export function autoGroupAnimations(
  animations: string[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const anim of animations) {
    let groupKey = "";

    // Check if it has a double index sequence like Name_X_Y (e.g., Attack_1_3, Special_1_1)
    // We allow underscores in the name part now to support names like "Ultimate_combinado"
    const doubleSeqMatch = anim.match(/^([a-zA-Z_]+?_\d+)(?:_\d+)+$/);
    const singleSeqMatch = anim.match(/^([a-zA-Z_]+?)(?:_\d+)+$/);

    if (doubleSeqMatch && doubleSeqMatch[1]) {
      groupKey = doubleSeqMatch[1];
    } else if (singleSeqMatch && singleSeqMatch[1]) {
      groupKey = singleSeqMatch[1];
    } else {
      // Fallback matching for single states or non-sequential keys
      const parsed = anim.match(/^([a-zA-Z_]+?)(?:_?\d+)*$/);
      groupKey = parsed && parsed[1] ? parsed[1].replace(/_+$/, "") : anim;
    }

    // Capitalize first letter of groupKey
    if (groupKey && groupKey.length > 0) {
      groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(anim);
  }

  // Sort inside group
  for (const groupKey of Object.keys(groups)) {
    groups[groupKey].sort((a, b) => {
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }

  return groups;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export const AnimationPreviewScreen: React.FC = () => {
  const { changeScene, t, isOfflineMode } = useSceneManager();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedData, setCopiedData] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const cleanObj = (obj: any): any => {
    if (!obj) return obj;
    const clone = JSON.parse(JSON.stringify(obj));
    const clean = (item: any) => {
      if (!item || typeof item !== "object") return;
      Object.keys(item).forEach((key) => {
        if (item[key] === undefined || item[key] === null) {
          delete item[key];
        } else if (typeof item[key] === "object") {
          clean(item[key]);
        }
      });
    };
    clean(clone);
    return clone;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCharactersBackupRef = useRef<CharacterData[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterData>(
    BASE_CHARACTERS[0],
  );
  const [playingSequence, setPlayingSequence] = useState<string[] | null>(
    null,
  );
  const [sequenceIndex, setSequenceIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<
    | "SETTINGS"
    | "TRANSFORM"
    | "COMBAT"
    | "CINEMATIC"
    | "SCENE"
    | "COLLISION"
    | "KI_BLAST"
    | "GENKIDAMA"
    | "BEAM"
    | "fechosenergia"
    | "REFERENCE"
    | "BEAM_LINKS"
    | "BEAMS_MANAGER"
    | "GROUPINGS"
    | "AURAS"
    | "VFX"
    | "FULL_LIST"
  >("COMBAT");

  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedState, _setSelectedState] = useState<string>(PlayerState.IDLE);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  enum AnimationCategory {
    CHARACTER = "CHARACTER",
    PROJECTILE = "PROJECTILE",
    BEAM = "BEAM",
    GENKIDAMA = "GENKIDAMA",
    ENERGYCLOSURE = "ENERGYCLOSURE",
    AURA = "AURA",
    EFFECT = "EFFECT"
  }

  const getAnimationCategoryFromKey = (key: string): AnimationCategory => {
    const upper = key.toUpperCase();
    if (upper.startsWith("CHAR_")) return AnimationCategory.CHARACTER;
    if (upper.startsWith("BEAM_") || upper.startsWith("CHAVE_BEAM_")) return AnimationCategory.BEAM;
    if (upper.startsWith("PROJECTILE_") || upper.startsWith("CHAVE_PROJETIL_") || upper.startsWith("KI_BLAST_") || upper.startsWith("PROJETIL_")) return AnimationCategory.PROJECTILE;
    if (upper.startsWith("GENKIDAMA_") || upper.startsWith("CHAVE_GENKIDAMA_")) return AnimationCategory.GENKIDAMA;
    if (upper.startsWith("ENERGYCLOSURE_") || upper.startsWith("CHAVE_FECHO_") || upper.startsWith("FECHO_")) return AnimationCategory.ENERGYCLOSURE;
    if (upper.startsWith("AURA_") || upper.startsWith("CHAVE_AURA_") || upper.startsWith("CHAVE_AURA")) return AnimationCategory.AURA;
    if (upper.startsWith("EFFECT_") || upper.startsWith("VFX_") || upper.startsWith("CHAVE_VFX_")) return AnimationCategory.EFFECT;
    if (upper.startsWith("CHAVE_")) return AnimationCategory.EFFECT;

    const standardStates = ["IDLE", "RUNNING", "DASHING", "ATTACKING", "HIT", "STUNNED", "CHARGING", "ULTIMATE", "TRANSFORM", "INTRO", "WIN", "LOSE"];
    if (standardStates.some(state => upper.includes(state))) {
      return AnimationCategory.CHARACTER;
    }
    return AnimationCategory.CHARACTER;
  };

  const validateAndApplyAnimation = (
    objectType: "CHARACTER" | "BEAM" | "PROJECTILE" | "GENKIDAMA" | "ENERGYCLOSURE" | "AURA" | "EFFECT",
    animationKey: string,
    applyFn: () => void
  ) => {
    const animCat = getAnimationCategoryFromKey(animationKey);
    let isCompatible = false;
    if (objectType === "CHARACTER" && animCat === AnimationCategory.CHARACTER) isCompatible = true;
    if (objectType === "BEAM" && animCat === AnimationCategory.BEAM) isCompatible = true;
    if (objectType === "PROJECTILE" && animCat === AnimationCategory.PROJECTILE) isCompatible = true;
    if (objectType === "GENKIDAMA" && animCat === AnimationCategory.GENKIDAMA) isCompatible = true;
    if (objectType === "ENERGYCLOSURE" && animCat === AnimationCategory.ENERGYCLOSURE) isCompatible = true;
    if (objectType === "AURA" && animCat === AnimationCategory.AURA) isCompatible = true;
    if (objectType === "EFFECT" && animCat === AnimationCategory.EFFECT) isCompatible = true;

    if (!isCompatible) {
      console.error(`[Security Guard] OPERAÇÃO CANCELADA: Objeto do tipo ${objectType} tentou receber animação incompatível da categoria ${animCat} (${animationKey}).`);
      alert(`[Erro de Segurança] Não é permitido aplicar animação da categoria ${animCat} em um objeto do tipo ${objectType}!`);
      return false;
    }

    applyFn();
    return true;
  };

  const setSelectedState = (val: string) => {
    validateAndApplyAnimation("CHARACTER", val, () => {
      _setSelectedState(val);
    });
  };

  const [localBeamDatabase, setLocalBeamDatabase] = useState(BEAM_DATABASE);
  const [localProjectileDatabase, setLocalProjectileDatabase] =
    useState(PROJECTILE_DATABASE);
  const [restoredBeamKey, setRestoredBeamKey] = useState<string | null>(null);
  const [restoredProjectileKey, setRestoredProjectileKey] = useState<string | null>(null);
  const [selectedInactiveKeys, setSelectedInactiveKeys] = useState<string[]>([]);
  const [beamSearchQuery, setBeamSearchQuery] = useState("");
  const [localAuraDatabase, setLocalAuraDatabase] = useState<
    Record<string, ConfiguredAura>
  >({});
  const [selectedAuraKey, _setSelectedAuraKey] = useState<string>("");
  const setSelectedAuraKey = (val: string) => {
    if (val === "") {
      _setSelectedAuraKey(val);
      return;
    }
    validateAndApplyAnimation("AURA", val, () => {
      _setSelectedAuraKey(val);
    });
  };
  const [auraSearchQuery, setAuraSearchQuery] = useState("");

  const [localEffectDatabase, setLocalEffectDatabase] = useState<
    Record<string, ConfiguredEffect>
  >({});
  const [selectedEffectKey, _setSelectedEffectKey] = useState<string>("");
  const setSelectedEffectKey = (val: string) => {
    if (val === "") {
      _setSelectedEffectKey(val);
      return;
    }
    validateAndApplyAnimation("EFFECT", val, () => {
      _setSelectedEffectKey(val);
      
      const keyManager = EffectConfigKeyManager.getInstance();
      const existing = keyManager.getEffect(val);
      if (existing) {
        setLocalEffectDatabase((prev) => ({
          ...prev,
          [val]: existing,
        }));
      }
    });
  };
  const [effectSearchQuery, setEffectSearchQuery] = useState("");

  const [characterAnimationContext, setCharacterAnimationContext] = useState<AnimationFrameData | null>(null);
  const [projectileAnimationContext, setProjectileAnimationContext] = useState<AnimationFrameData | null>(null);
  const [editedAnimationKeys, setEditedAnimationKeys] = useState<Record<string, boolean>>({});
  const [beamAnimationContext, setBeamAnimationContext] = useState<AnimationFrameData | null>(null);
  const [genkidamaAnimationContext, setGenkidamaAnimationContext] = useState<AnimationFrameData | null>(null);
  const [energyClosureAnimationContext, setEnergyClosureAnimationContext] = useState<AnimationFrameData | null>(null);
  const [auraAnimationContext, setAuraAnimationContext] = useState<AnimationFrameData | null>(null);
  const [effectAnimationContext, setEffectAnimationContext] = useState<AnimationFrameData | null>(null);

  const editedBeamKeysRef = useRef<Set<string>>(new Set());
  const editedProjectileKeysRef = useRef<Set<string>>(new Set());

  const trackEditedKey = (key: string, category: "BEAM" | "PROJECTILE") => {
    if (!key) return;
    if (category === "BEAM") {
      editedBeamKeysRef.current.add(key);
    } else {
      editedProjectileKeysRef.current.add(key);
    }
  };

  const revertAllEdits = () => {
    // 1. Restore BASE_CHARACTERS in-place from the backup snapshot
    if (originalCharactersBackupRef.current && originalCharactersBackupRef.current.length > 0) {
      BASE_CHARACTERS.forEach((char) => {
        const backup = originalCharactersBackupRef.current.find((b) => b.id === char.id);
        if (backup) {
          // Clear all keys on char
          Object.keys(char).forEach((key) => {
            delete (char as any)[key];
          });
          // Copy keys from backup to char
          Object.assign(char, deepClone(backup));
        }
      });
    }

    // 2. Revert all KeyManagers to clean static templates in memory
    try {
      BeamConfigKeyManager.getInstance().revertToDefaults();
      ProjectileConfigKeyManager.getInstance().revertToDefaults();
      AuraConfigKeyManager.getInstance().revertToDefaults();
      EffectConfigKeyManager.getInstance().revertToDefaults();
    } catch (err) {
      console.error("Failed to revert key managers to default:", err);
    }

    // 3. Synchronize local databases so that the UI updates immediately if still mounted
    try {
      setLocalBeamDatabase(BeamConfigKeyManager.getInstance().getAllBeams());
      setLocalProjectileDatabase(ProjectileConfigKeyManager.getInstance().getAllProjectiles());
      setLocalAuraDatabase(AuraConfigKeyManager.getInstance().getAllAuras());
      setLocalEffectDatabase(EffectConfigKeyManager.getInstance().getAllEffects());
    } catch (err) {
      console.error("Failed to update local databases on revert:", err);
    }

    // 4. Update selectedChar with a shallow copy of the clean restored character to force a React re-render
    if (selectedChar) {
      const cleanChar = BASE_CHARACTERS.find((c) => c.id === selectedChar.id);
      if (cleanChar) {
        setSelectedChar({ ...cleanChar });
      }
    }

    // 5. Clear overrides on selectedChar and BASE_CHARACTERS so they do not influence battle
    BASE_CHARACTERS.forEach((char) => {
      char.beamOverrides = {};
      (char as any).projectileOverrides = {};
    });

    editedBeamKeysRef.current.clear();
    editedProjectileKeysRef.current.clear();
  };

  const getActiveContextCategory = (tab: string): "CHARACTER" | "PROJECTILE" | "BEAM" | "GENKIDAMA" | "ENERGYCLOSURE" | "AURA" | "EFFECT" => {
    if (tab === "BEAM" || tab === "BEAMS_MANAGER") return "BEAM";
    if (tab === "PROJECTILE" || tab === "KI_BLAST") return "PROJECTILE";
    if (tab === "GENKIDAMA") return "GENKIDAMA";
    if (tab === "fechosenergia") return "ENERGYCLOSURE";
    if (tab === "AURAS") return "AURA";
    if (tab === "EFFECT" || tab === "VFX") return "EFFECT";
    return "CHARACTER";
  };

  // Sequenced Animation Groupings states
  const [animationGroups, setAnimationGroups] = useState<
    Record<string, string[]>
  >({});
  const [activeSequence, setActiveSequence] = useState<string[] | null>(null);
  const [activeSequenceIndex, setActiveSequenceIndex] = useState<number>(0);
  const [isSequenceLooping, setIsSequenceLooping] = useState<boolean>(true);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChar && selectedChar.spriteConfig) {
      if (selectedChar.spriteConfig.animationSequences) {
        setAnimationGroups({ ...selectedChar.spriteConfig.animationSequences });
      } else {
        const charKeys = Object.keys(selectedChar.spriteConfig.animations || {}).filter(k => {
          return !k.toUpperCase().startsWith("CHAVE_");
        });
        const auto = autoGroupAnimations(charKeys);
        setAnimationGroups(auto);
      }
    }
    setActiveSequence(null);
    setActiveSequenceIndex(0);
    setSelectedGroupKey("");
    setEditedAnimationKeys({});
  }, [selectedChar?.id]);

  useEffect(() => {
    // Reset localBeamDatabase to base BEAM_DATABASE merged with selected character's beamOverrides or state-specific beamConfig
    const keyManager = BeamConfigKeyManager.getInstance();
    keyManager.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
    const mergedDb = { ...keyManager.getAllBeams() };
    if (selectedChar?.beamOverrides) {
      Object.keys(selectedChar.beamOverrides).forEach((key) => {
        const charOverride = selectedChar.beamOverrides![key];
        const baseBeam = (keyManager.getBeamConfig(key) || {
          id: key,
          name: key,
          middle: {},
        }) as any;
        mergedDb[key] = {
          ...baseBeam,
          start: baseBeam.start
            ? { ...baseBeam.start, ...charOverride.start }
            : (charOverride.start as any),
          middle: baseBeam.middle
            ? { ...baseBeam.middle, ...charOverride.middle }
            : (charOverride.middle as any),
          end: baseBeam.end
            ? { ...baseBeam.end, ...charOverride.end }
            : (charOverride.end as any),
        };
      });
    }
    setLocalBeamDatabase(mergedDb);
  }, [selectedChar?.id]);

  useEffect(() => {
    // Reset localProjectileDatabase to base PROJECTILE_DATABASE merged with selected character's projectileOverrides
    const keyManager = ProjectileConfigKeyManager.getInstance();
    keyManager.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
    const mergedDb = { ...keyManager.getAllProjectiles() };
    const charProjOverrides =
      (selectedChar as any).projectileOverrides ||
      (selectedChar as any).beamOverrides;
    if (charProjOverrides) {
      Object.keys(charProjOverrides).forEach((key) => {
        const charOverride = charProjOverrides[key];
        const baseProj = (keyManager.getProjectileConfig(key) || {
          id: key,
          name: key,
          middle: {},
        }) as any;
        mergedDb[key] = {
          ...baseProj,
          middle: baseProj.middle
            ? { ...baseProj.middle, ...charOverride.middle }
            : (charOverride.middle as any),
        };
      });
    }
    setLocalProjectileDatabase(mergedDb);
  }, [selectedChar?.id]);

  useEffect(() => {
    const keyManager = AuraConfigKeyManager.getInstance();
    keyManager.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
    setLocalAuraDatabase(keyManager.getAllAuras());
  }, [selectedChar?.id]);

  useEffect(() => {
    const keyManager = EffectConfigKeyManager.getInstance();
    keyManager.initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
    setLocalEffectDatabase(keyManager.getAllEffects());
  }, [selectedChar?.id]);

  useEffect(() => {
    if ((activeTab === "VFX" || activeTab === "EFFECT") && selectedEffectKey) {
      const effectConfig = EffectConfigKeyManager.getInstance().getEffect(selectedEffectKey);
      if (effectConfig) {
        setEffectAnimationContext({
          imageUrl: effectConfig.imageUrl || (DEFAULT_EFFECTS as any)[effectConfig.baseEffectId || ""] || "",
          frameWidth: effectConfig.frameWidth || 100,
          frameHeight: effectConfig.frameHeight || 100,
          frames: effectConfig.frames || 1,
          speed: effectConfig.speed || 5,
          scale: effectConfig.scale || 1,
          loop: effectConfig.loop !== false,
          isGif: true,
          offsetX: effectConfig.offsetX || 0,
          offsetY: effectConfig.offsetY || 0,
        });
      }
    }
  }, [activeTab, selectedEffectKey, localEffectDatabase]);

  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem("dd2d_char_overrides");
      } catch (e) {
        console.error("Falha ao limpar character overrides ao fechar o editor:", e);
      }
    };
  }, []);

  const [selectedBeamFamilyId, setSelectedBeamFamilyId] =
    useState<string>("BEAM");
  const [selectedProjectileFamilyId, setSelectedProjectileFamilyId] =
    useState<string>("PROJETIL_1");

  useEffect(() => {
    if (playingSequence && isPlaying) {
      const currentState = playingSequence[sequenceIndex];
      setSelectedState(currentState);

      const anim = selectedChar.spriteConfig?.animations[currentState];
      if (anim) {
        const duration = (anim.frames * 1000) / (anim.speed || 5);
        const timer = setTimeout(() => {
          if (sequenceIndex < playingSequence.length - 1) {
            setSequenceIndex(sequenceIndex + 1);
          } else {
            setPlayingSequence(null);
            setSequenceIndex(0);
          }
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [playingSequence, sequenceIndex, isPlaying, selectedChar.id]);

  const allStates = Object.keys(selectedChar.spriteConfig?.animations || {});

  const orderedStates = [...allStates].sort((a, b) => {
    const score = (s: string) => {
      if (s.includes("START")) return -3;
      if (s.includes("LOOP")) return -2;
      if (s.includes("END")) return -1;
      return 0;
    };
    return score(a) - score(b);
  });

  const fallbackFilteredStates = orderedStates.filter((state) => {
    const anim = selectedChar.spriteConfig?.animations![state];
    if (!anim) return false;
    const upperState = state.toUpperCase();
    if (upperState.startsWith("CHAVE_")) return false;
    return true;
  });

  const getAnimationGroup = (state: string) => {
    const upperState = state.toUpperCase();
    if (
      upperState.includes("COMBINADO") ||
      upperState.includes("COMBINED") ||
      upperState.includes("ULTIMATE_3") ||
      upperState.includes("ULT_3") ||
      upperState.includes("PARTE3") ||
      upperState.includes("PARTE_3")
    )
      return "Ultimate Combinado";
    if (upperState.includes("GENKIDAMA"))
      return "Bolas de Energia / Projéteis (Genkidama)";
    if (
      upperState.includes("ULTIMATE_2") ||
      upperState.includes("ULT_2") ||
      upperState.includes("PARTE2") ||
      upperState.includes("PARTE_2") ||
      (upperState.includes("ULT_SSJ_") && !upperState.includes("_1_"))
    )
      return "Ultimate 2";
    if (upperState.includes("ULTIMATE") || upperState.includes("ULT_"))
      return "Ultimate 1";
    if (upperState.includes("SUPER_ESPECIAL")) {
      const numbers = state.match(/\d+/g);
      const spNum = numbers && numbers.length > 0 ? numbers[0] : "1";
      return `Super Especial ${spNum}`;
    }
    if (upperState.includes("SPECIAL") || upperState.includes("ESPECIAL")) {
      const numbers = state.match(/\d+/g);
      const spNum = numbers && numbers.length > 0 ? numbers[0] : "1";
      return `Especial ${spNum}`;
    }
    if (upperState.includes("BEAM_")) return "Beam / Projéteis Base";
    if (upperState.includes("KI_BLAST")) return "Ki Blast";
    if (
      upperState.includes("CHARGE") ||
      upperState.includes("SPARKING") ||
      upperState.includes("CARREGANDO_KI") ||
      upperState.includes("AURA")
    )
      return "Carregamento de Ki / Sparking";
    if (
      upperState.includes("ATTACK_LIGHT") ||
      upperState === "ATTACKING" ||
      upperState.includes("JUMP_LIGHT") ||
      upperState.includes("CROUCH_LIGHT")
    )
      return "Combos de Ataque Básico (Light)";
    if (upperState.includes("ATTACK_MEDIUM"))
      return "Combos de Ataque Médio (Medium)";
    if (
      upperState.includes("ATTACK_HEAVY") ||
      upperState.includes("JUMP_HEAVY") ||
      upperState.includes("CROUCH_HEAVY")
    )
      return "Combos de Ataque Forte (Heavy)";
    if (upperState.includes("ATTACK")) return "Ataques Diversos";
    if (upperState.includes("SUPER_DASH"))
      return "Movimentação Rápida (Super Dash)";
    if (
      upperState.includes("DASH") ||
      upperState.includes("VANISH") ||
      upperState.includes("TELEPORT")
    )
      return "Movimentação Rápida / Dash";
    if (
      upperState.includes("BLOCK") ||
      upperState.includes("GUARD") ||
      upperState.includes("REFLECT")
    )
      return "Defesa e Guarda";
    if (
      upperState.includes("HIT") ||
      upperState.includes("DANO") ||
      upperState.includes("KNOCK") ||
      upperState.includes("FALL") ||
      upperState.includes("STUN") ||
      upperState.includes("LAUNCHED") ||
      upperState.includes("RECOVERY")
    )
      return "Reações de Dano (Hit)";
    if (
      upperState.includes("INTRO") ||
      upperState.includes("VICTORY") ||
      upperState.includes("DEFEAT") ||
      upperState.includes("TRANSFORM") ||
      upperState.includes("TAG") ||
      upperState.includes("ASSIST") ||
      upperState.includes("STANDBY") ||
      upperState.includes("FUSION")
    )
      return "Animações de Sistema / Cena";
    return "Movimentos Básicos";
  };

  const groupedStates = fallbackFilteredStates.reduce((acc, state) => {
    const group = getAnimationGroup(state);
    if (!acc[group]) acc[group] = [];
    acc[group].push(state);
    return acc;
  }, {} as Record<string, string[]>);

  const stateSorter = (a: string, b: string) => {
    const aMatch = a.match(/_(\d+)$/);
    const bMatch = b.match(/_(\d+)$/);
    const numA = aMatch ? parseInt(aMatch[1]) : -1;
    const numB = bMatch ? parseInt(bMatch[1]) : -1;
    const corePrefixA = a.replace(
      /_(PREP|CUTSCENE|DASH|COMBO|FINALIZANDO|LANCAMENTO|START|LOOP|END|FINAL|INICIO|MIDDLE)(_\d+)?$/,
      "",
    );
    const corePrefixB = b.replace(
      /_(PREP|CUTSCENE|DASH|COMBO|FINALIZANDO|LANCAMENTO|START|LOOP|END|FINAL|INICIO|MIDDLE)(_\d+)?$/,
      "",
    );
    if (corePrefixA === corePrefixB && numA !== -1 && numB !== -1) {
      if (numA !== numB) return numA - numB;
    }
    const getPhasePrecedence = (s: string) => {
      if (s.includes("START") || s.includes("INICIO") || s.includes("PREP"))
        return 10;
      if (s.includes("DASH") || s.includes("COMBO") || s.includes("FOLLOW"))
        return 15;
      if (
        s.includes("CHARGING") ||
        s.includes("LOOP") ||
        s.includes("MIDDLE") ||
        s.includes("CUTSCENE") ||
        s.includes("LANCAMENTO") ||
        s.includes("KAMEHAMEHA")
      )
        return 20;
      if (s.includes("FINALIZANDO")) return 25;
      if (s.includes("END") || s.includes("FINAL")) return 30;
      return 50;
    };
    const isJumpA = a.includes("JUMP_") ? 1 : 0;
    const isJumpB = b.includes("JUMP_") ? 1 : 0;
    if (isJumpA !== isJumpB) return isJumpA - isJumpB;
    const isCrouchA = a.includes("CROUCH_") ? 1 : 0;
    const isCrouchB = b.includes("CROUCH_") ? 1 : 0;
    if (isCrouchA !== isCrouchB) return isCrouchA - isCrouchB;
    const isAirA = a.includes("_AR") || a.includes("_AIR") ? 1 : 0;
    const isAirB = b.includes("_AR") || b.includes("_AIR") ? 1 : 0;
    if (isAirA !== isAirB) return isAirA - isAirB;
    const pA = getPhasePrecedence(a);
    const pB = getPhasePrecedence(b);
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  };

  for (const g in groupedStates) {
    groupedStates[g].sort(stateSorter);
  }

  const groupOrder = [
    "Combos de Ataque Básico (Light)",
    "Combos de Ataque Médio (Medium)",
    "Combos de Ataque Forte (Heavy)",
    "Ataques Diversos",
    "Ki Blast",
    "Especial 1",
    "Especial 2",
    "Especial 3",
    "Especial 4",
    "Especial 5",
    "Especial 6",
    "Especial 7",
    "Especial 8",
    "Especial 9",
    "Especial 10",
    "Especial 11",
    "Especial 12",
    "Especial 13",
    "Especial 14",
    "Beam / Projéteis Base",
    "Bolas de Energia / Projéteis (Genkidama)",
    "Super Especial 1",
    "Super Especial 2",
    "Super Especial 3",
    "Super Especial",
    "Ultimate 1",
    "Ultimate 2",
    "Ultimate Combinado",
    "Movimentos Básicos",
    "Movimentação Rápida / Dash",
    "Defesa e Guarda",
    "Reações de Dano (Hit)",
    "Carregamento / Sparking",
    "Animações de Sistema / Cena",
  ];

  const sortedGroups = Object.keys(groupedStates).sort((a, b) => {
    let indexA = groupOrder.indexOf(a);
    let indexB = groupOrder.indexOf(b);
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;
    if (indexA !== indexB) return indexA - indexB;
    return a.localeCompare(b);
  });

  const getCleanLabel = (s: string, group: string) => {
    const upperS = s.toUpperCase();
    const sequenceGroups = [
      "Ultimate 1",
      "Ultimate 2",
      "Ultimate Combinado",
      "Ki Blast",
      "Movimentação Rápida (Super Dash)",
      "Movimentação Rápida / Dash",
    ];
    const isSeqGroup =
      sequenceGroups.includes(group) ||
      group.startsWith("Super Especial") ||
      group.startsWith("Especial") ||
      group.startsWith("Combo");

    if (isSeqGroup) {
      const idxInGroup = groupedStates[group].indexOf(s);
      const seqNum = idxInGroup + 1;
      let baseName = group;
      if (group === "Ultimate Combinado") baseName = "Ultimate Combinado";
      let finalLabel = `${baseName} - ${seqNum}`;
      if (upperS.includes("AIR") || upperS.includes("AR") || upperS.includes("JUMP"))
        finalLabel += " (Ar)";
      return finalLabel;
    }
    if (upperS === "IDLE" || upperS === "PARADO") return "Parado";
    if (upperS === "JUMPING" || upperS === "PULA" || upperS === "PULAR" || upperS === "JUMP")
      return "Pula";
    if (upperS === "FALLING" || upperS === "CAINDO") return "Caindo";
    if (upperS === "LANDING" || upperS === "ATERRISSANDO") return "Aterrissando";
    if (upperS === "RUNNING" || upperS === "CORRER" || upperS.includes("WALK_FORWARD"))
      return "Correr para Frente";
    if (upperS === "WALK_BACKWARD" || upperS === "ANDAR_TRAS") return "Andar para Trás";
    if (upperS === "CROUCH" || upperS === "AGACHADO") return "Agachar";
    if (upperS === "SUPER_DASH") return "Super Dash (Voando)";
    if (upperS === "QUICK_DASH") return "Evasão Rápida";
    if (upperS === "DOUBLE_TAP") return "Double Tap";
    if (upperS === "VANISH" || upperS.includes("TELEPORT") || upperS.includes("TELEPORTE"))
      return "Teleporte (Vanish)";
    if (upperS.includes("BLOCKING") || upperS.includes("DEFESA") || upperS.includes("GUARD")) {
      const type = upperS.includes("CROUCH") ? "Agachado" : upperS.includes("AIR") || upperS.includes("AR") ? "Aéreo" : "Padrão";
      return `Defesa (${type})`;
    }
    if (upperS === "HIT" || upperS.includes("RECEBENDO_DANO")) return "Recebendo Dano (Chão)";
    if (upperS === "FALLING_HIT") return "Recebendo Dano (Ar)";
    if (upperS === "KNOCKED_DOWN") return "Nocauteado (Chão)";
    if (upperS === "STUNNED") return "Atordoado";
    if (upperS === "GUARD_BREAK") return "Quebra de Guarda";
    if (upperS === "GROUND_RECOVERY") return "Recuperação de Chão";
    if (upperS === "DEFEAT") return "Derrotado";
    if (upperS === "CHARGE_START") return "Carregar Ki (Início)";
    if (upperS === "CHARGING" || upperS === "CARREGANDO_KI") return "Carregar Ki (Carregando)";
    if (upperS === "CHARGE_END") return "Carregar Ki (Fim)";
    if (upperS === "SPARKING") return "Sparking";
    return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const [destinationBeamKey, setDestinationBeamKey] = useState<string | null>(
    null,
  );
  const [destinationProjectileKey, setDestinationProjectileKey] = useState<
    string | null
  >(null);

  const [manuallyActiveKeys, setManuallyActiveKeys] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const saved = localStorage.getItem("dd2d_manually_active_keys");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const isKeyActive = (key: string): boolean => {
    const isOfficial = !!BEAM_DATABASE[key] || !!PROJECTILE_DATABASE[key];
    return isOfficial || !!manuallyActiveKeys[key];
  };

  const toggleKeyActiveStatus = (key: string) => {
    setManuallyActiveKeys((prev) => {
      const isOfficial = !!BEAM_DATABASE[key] || !!PROJECTILE_DATABASE[key];
      if (isOfficial) return prev;
      const currentlyActive = !!prev[key];
      const next = { ...prev, [key]: !currentlyActive };
      try {
        localStorage.setItem("dd2d_manually_active_keys", JSON.stringify(next));
      } catch (e) {
        console.error("Falha ao salvar chaves ativas no localStorage:", e);
      }
      return next;
    });
  };



  const getInactiveKeys = (
    category: "BEAM" | "PROJECTILE" | "GENKIDAMA" | "FECHO" | "VFX",
  ) => {
    if (category === "BEAM") {
      return Object.keys(localBeamDatabase).filter((key) => {
        if (!key.startsWith("CHAVE_")) return false;
        return !isKeyActive(key);
      });
    } else if (category === "VFX") {
      return Object.keys(localEffectDatabase).filter((key) => {
        if (!key.startsWith("CHAVE_")) return false;
        return !isKeyActive(key);
      });
    } else {
      return Object.keys(localProjectileDatabase).filter((key) => {
        const isCustom = key.startsWith("CHAVE_") || !PROJECTILE_DATABASE[key] || key.match(/_\d{3,4}$/);
        if (!isCustom) return false;
        if (isKeyActive(key)) return false;

        if (category === "PROJECTILE") {
          return (
            key.includes("KI_BLAST") ||
            key.includes("PROJETIL") ||
            (!key.includes("GENKIDAMA") && !key.includes("FECHO"))
          );
        } else if (category === "FECHO") {
          return key.includes("FECHO") || key.includes("fechosenergia");
        } else if (category === "GENKIDAMA") {
          return (
            key.includes("GENKIDAMA") &&
            !key.includes("_EXPLODE") &&
            !key.includes("_DISSIPATE") &&
            !key.includes("_CHAO") &&
            !key.includes("_COLLISION") &&
            !key.includes("_FINAL")
          );
        }
        return false;
      });
    }
  };

  const getCategoryCounts = (
    category: "BEAM" | "PROJECTILE" | "GENKIDAMA" | "FECHO" | "VFX",
  ) => {
    let allKeys: string[] = [];
    if (category === "BEAM") {
      allKeys = Object.keys(localBeamDatabase).filter((k) =>
        k.startsWith("CHAVE_"),
      );
    } else if (category === "VFX") {
      allKeys = Object.keys(localEffectDatabase).filter((k) =>
        k.startsWith("CHAVE_"),
      );
    } else {
      allKeys = Object.keys(localProjectileDatabase).filter((key) => {
        const isCustom = key.startsWith("CHAVE_") || !PROJECTILE_DATABASE[key] || key.match(/_\d{3,4}$/);
        if (!isCustom) return false;

        if (category === "PROJECTILE") {
          return (
            key.includes("KI_BLAST") ||
            key.includes("PROJETIL") ||
            (!key.includes("GENKIDAMA") && !key.includes("FECHO"))
          );
        } else if (category === "FECHO") {
          return key.includes("FECHO") || key.includes("fechosenergia");
        } else if (category === "GENKIDAMA") {
          return (
            key.includes("GENKIDAMA") &&
            !key.includes("_EXPLODE") &&
            !key.includes("_DISSIPATE") &&
            !key.includes("_CHAO") &&
            !key.includes("_COLLISION") &&
            !key.includes("_FINAL")
          );
        }
        return false;
      });
    }

    let activeCount = 0;
    let inactiveCount = 0;
    allKeys.forEach((key) => {
      if (isKeyActive(key)) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return { active: activeCount, inactive: inactiveCount };
  };

  const exportKeyConfigString = (
    key: string,
    category: "BEAM" | "PROJECTILE" | "GENKIDAMA" | "FECHO" | "VFX",
  ) => {
    if (category === "BEAM") {
      const currentBeam = localBeamDatabase[key];
      if (!currentBeam) return "";

      const overridesObj: any = {
        start: currentBeam.start ? { ...currentBeam.start } : undefined,
        middle: currentBeam.middle ? { ...currentBeam.middle } : undefined,
        end: currentBeam.end ? { ...currentBeam.end } : undefined,
      };

      if (currentBeam.color !== undefined) overridesObj.color = currentBeam.color;
      if (currentBeam.beamOpacity !== undefined) overridesObj.beamOpacity = currentBeam.beamOpacity;
      if (currentBeam.beamBrightness !== undefined) overridesObj.beamBrightness = currentBeam.beamBrightness;
      if (currentBeam.beamHueRotate !== undefined) overridesObj.beamHueRotate = currentBeam.beamHueRotate;
      if (currentBeam.beamSaturate !== undefined) overridesObj.beamSaturate = currentBeam.beamSaturate;
      if (currentBeam.beamContrast !== undefined) overridesObj.beamContrast = currentBeam.beamContrast;
      if (currentBeam.rotation !== undefined) overridesObj.rotation = currentBeam.rotation;
      if (currentBeam.name !== undefined) overridesObj.name = currentBeam.name;

      const beamDbObj = JSON.parse(JSON.stringify(currentBeam));
      delete beamDbObj.id;
      delete beamDbObj.configKey;
      delete beamDbObj.baseBeamId;
      delete beamDbObj.ownerCharacterId;
      delete beamDbObj.ownerAnimationKey;
      delete beamDbObj.ownerCharacterName;

      let ownerCharName = "Personagem";
      let ownerAnimKey = "ANIMAÇÃO";
      let animConfig: any = null;

      if (selectedChar?.spriteConfig?.animations) {
        const anims = selectedChar.spriteConfig.animations;
        Object.keys(anims).forEach((animK) => {
          const anim = anims[animK];
          if (anim && anim.createsBeam === key) {
            ownerCharName = selectedChar.name;
            ownerAnimKey = animK;
            animConfig = anim;
          }
        });
      }

      if (!animConfig) {
        BASE_CHARACTERS.forEach((char) => {
          const anims = char.spriteConfig?.animations || {};
          Object.keys(anims).forEach((animK) => {
            const anim = anims[animK];
            if (anim && anim.createsBeam === key) {
              ownerCharName = char.name;
              ownerAnimKey = animK;
              animConfig = anim;
            }
          });
        });
      }

      if (!animConfig && currentBeam.ownerAnimationKey) {
        ownerCharName = currentBeam.ownerCharacterName || "Personagem";
        ownerAnimKey = currentBeam.ownerAnimationKey;
      }

      const animText = animConfig
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${ownerAnimKey}": ${JSON.stringify({ ...animConfig, createsBeam: key }, null, 4)},\n\n`
        : `// 1. ANIMAÇÃO DO PERSONAGEM (Exemplo - Vincule adicionando "createsBeam": "${key}")\n"${ownerAnimKey}": {\n    "createsBeam": "${key}"\n},\n\n`;

      return `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DO BEAM: ${key} (${currentBeam.name || "Sem Nome"})
// Proprietário: ${ownerCharName} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}// 2. OVERRIDES DO PERSONAGEM (Copie e cole no arquivo *_Beams.ts do seu personagem para ajustar a posição e tamanho dos segmentos do feixe):
"${key}": ${JSON.stringify(cleanObj(overridesObj), null, 4)},

// 3. ADICIONE ISSO NO BANCO DE BEAMS (BeamDatabase.ts):
"${key}": ${JSON.stringify(cleanObj(beamDbObj), null, 4)}
`;
    } else if (category === "GENKIDAMA") {
      const currentProj = localProjectileDatabase[key];
      if (!currentProj) return "";

      const projectileDbObj = JSON.parse(JSON.stringify(currentProj));
      delete projectileDbObj.id;
      delete projectileDbObj.configKey;
      delete projectileDbObj.baseProjectileId;
      delete projectileDbObj.ownerCharacterId;
      delete projectileDbObj.ownerAnimationKey;
      delete projectileDbObj.ownerCharacterName;

      // Provide defaults/fallbacks for safety if not explicitly defined
      if (projectileDbObj.color === undefined) projectileDbObj.color = "#ffffff";
      if (projectileDbObj.projectileOpacity === undefined) projectileDbObj.projectileOpacity = 1;
      if (projectileDbObj.projectileBrightness === undefined) projectileDbObj.projectileBrightness = 1;

      const middleGif =
        currentProj.middle?.imageUrl ||
        "/Assets/especiais/bolasenergia/genkidamas/1/1.gif";
      let endGif =
        "/Assets/especiais/bolasenergia/genkidamas/1/2.gif";

      const explodeProj =
        localProjectileDatabase[key + "_EXPLODE"] ||
        localProjectileDatabase["GENKIDAMA_1_EXPLODE"];
      if (explodeProj && explodeProj.middle) {
        endGif = explodeProj.middle.imageUrl || endGif;
      }

      let ownerCharName = "Personagem";
      let ownerAnimKey = "ANIMAÇÃO";
      let animConfig: any = null;

      BASE_CHARACTERS.forEach((char) => {
        const anims = char.spriteConfig?.animations || {};
        Object.keys(anims).forEach((animK) => {
          const anim = anims[animK];
          if (anim && anim.projectileId === key) {
            ownerCharName = char.name;
            ownerAnimKey = animK;
            animConfig = anim;
          }
        });
      });

      if (!animConfig && currentProj.ownerAnimationKey) {
        ownerCharName = currentProj.ownerCharacterName || "Personagem";
        ownerAnimKey = currentProj.ownerAnimationKey;
      }

      const animText = `// 1. ANIMAÇÕES DO PERSONAGEM (Substitua ou adicione no objeto "animations" dentro do arquivo do seu personagem):
"${ownerAnimKey}": {
    "imageUrl": "${animConfig?.imageUrl || ""}",
    "frames": ${animConfig?.frames || 1},
    "projectileId": "${key}"
},
"GENKIDAMA": {
    "imageUrl": "${middleGif}",
    "frames": 1,
    "loop": true,
    "projectileId": "${key}"
},
"GENKIDAMA_FINAL": {
    "imageUrl": "${endGif}",
    "frames": 1,
    "loop": false,
    "projectileId": "${key}"
}`;

      return `// =========================================================================
// CONFIGURAÇÕES DA GENKIDAMA COM CHAVE: ${key} (${currentProj.name || "Sem Nome"})
// Proprietário: ${ownerCharName} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}

// 2. BANCO DE PROJÉTEIS (Adicione ao arquivo ProjectileDatabase.ts):
"${key}": ${JSON.stringify(projectileDbObj, null, 4)}
`;
    } else if (category === "PROJECTILE" || category === "FECHO") {
      const currentProj = localProjectileDatabase[key];
      if (!currentProj) return "";

      const overridesObj: any = {
        middle: currentProj.middle ? { ...currentProj.middle } : undefined,
      };

      if (currentProj.color !== undefined) overridesObj.color = currentProj.color;
      if (currentProj.projectileOpacity !== undefined) overridesObj.projectileOpacity = currentProj.projectileOpacity;
      if (currentProj.projectileBrightness !== undefined) overridesObj.projectileBrightness = currentProj.projectileBrightness;
      if (currentProj.rotation !== undefined) overridesObj.rotation = currentProj.rotation;
      if (currentProj.name !== undefined) overridesObj.name = currentProj.name;

      const projectileDbObj = JSON.parse(JSON.stringify(currentProj));
      delete projectileDbObj.id;
      delete projectileDbObj.configKey;
      delete projectileDbObj.baseProjectileId;
      delete projectileDbObj.ownerCharacterId;
      delete projectileDbObj.ownerAnimationKey;
      delete projectileDbObj.ownerCharacterName;

      let ownerCharName = "Personagem";
      let ownerAnimKey = "ANIMAÇÃO";
      let animConfig: any = null;

      if (selectedChar?.spriteConfig?.animations) {
        const anims = selectedChar.spriteConfig.animations;
        Object.keys(anims).forEach((animK) => {
          const anim = anims[animK];
          if (anim && anim.projectileId === key) {
            ownerCharName = selectedChar.name;
            ownerAnimKey = animK;
            animConfig = anim;
          }
        });
      }

      if (!animConfig) {
        BASE_CHARACTERS.forEach((char) => {
          const anims = char.spriteConfig?.animations || {};
          Object.keys(anims).forEach((animK) => {
            const anim = anims[animK];
            if (anim && anim.projectileId === key) {
              ownerCharName = char.name;
              ownerAnimKey = animK;
              animConfig = anim;
            }
          });
        });
      }

      if (!animConfig && currentProj.ownerAnimationKey) {
        ownerCharName = currentProj.ownerCharacterName || "Personagem";
        ownerAnimKey = currentProj.ownerAnimationKey;
      }

      const animText = animConfig
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${ownerAnimKey}": ${JSON.stringify({ ...animConfig, projectileId: key }, null, 4)},\n\n`
        : `// 1. ANIMAÇÃO DO PERSONAGEM (Exemplo - Vincule adicionando "projectileId": "${key}")\n"${ownerAnimKey}": {\n    "projectileId": "${key}"\n},\n\n`;

      const labelName =
        category === "FECHO"
          ? "FECHO DE ENERGIA"
          : "PROJÉTIL / ESFERA DE ENERGIA";

      return `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DO ${labelName}: ${key} (${currentProj.name || "Sem Nome"})
// Proprietário: ${ownerCharName} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}// 2. OVERRIDES DO PERSONAGEM (Copie e adicione ao arquivo *_Beams.ts do seu personagem para ajustar posições e escalas na tela):
"${key}": ${JSON.stringify(cleanObj(overridesObj), null, 4)},

// 3. SE FOR UM PROJÉTIL CUSTOMIZADO / NOVA COR, ADICIONE ISSO NO BANCO DE PROJÉTEIS (ProjectileDatabase.ts):
"${key}": ${JSON.stringify(cleanObj(projectileDbObj), null, 4)}
`;
    } else if (category === "VFX") {
      const currentEffect = localEffectDatabase[key];
      if (!currentEffect) return "";

      const effectDbObj = JSON.parse(JSON.stringify(currentEffect));
      delete effectDbObj.id;
      delete effectDbObj.configKey;
      delete effectDbObj.baseEffectId;
      delete effectDbObj.ownerCharacterId;
      delete effectDbObj.ownerAnimationKey;
      delete effectDbObj.ownerCharacterName;

      // Garantir que color esteja presente para exportação
      if (!effectDbObj.color) {
        effectDbObj.color = "#ffffff";
      }

      // Mantemos todas as informações de posição e escala para que não se percam ao copiar
      return `// =========================================================================
// CONFIGURAÇÕES DO EFEITO / VFX: ${key}
// =========================================================================

// 1. ADICIONE ISSO NO BANCO DE EFEITOS (VFX):
"${key}": ${JSON.stringify(cleanObj(effectDbObj), null, 4)}
`;
    }
    return "";
  };

  const copyInactiveKeysToClipboard = (
    categories: ("BEAM" | "PROJECTILE" | "GENKIDAMA" | "FECHO" | "VFX")[],
    title: string,
  ) => {
    let combinedText = `// =========================================================================
// ⚡ ${title.toUpperCase()}
// Gerado em: ${new Date().toLocaleString("pt-BR")}
// =========================================================================\n\n`;

    let totalExported = 0;

    categories.forEach((cat) => {
      const keys = getInactiveKeys(cat);
      if (keys.length === 0) return;

      const catLabel =
        cat === "BEAM"
          ? "BEAMS"
          : cat === "PROJECTILE"
            ? "PROJÉTEIS"
            : cat === "GENKIDAMA"
              ? "genkidamas"
              : cat === "VFX"
                ? "EFEITOS VFX"
                : "FECHOS DE ENERGIA";
      combinedText += `// =========================================================================\n`;
      combinedText += `// CATEGORIA: ${catLabel} (${keys.length} chave(s) inativa(s))\n`;
      combinedText += `// =========================================================================\n\n`;

      keys.forEach((key) => {
        combinedText += exportKeyConfigString(key, cat);
        combinedText += `\n\n`;
        totalExported++;
      });
    });

    if (totalExported === 0) {
      alert("Nenhuma chave inativa encontrada para exportação nesta seleção!");
      return;
    }

    try {
      navigator.clipboard.writeText(combinedText);
      alert(
        `Sucesso! ${totalExported} chave(s) inativa(s) exportada(s) e copiada(s) para o clipboard!`,
      );
    } catch (e) {
      console.error("Erro ao copiar para clipboard:", e);
      alert(
        "Não foi possível copiar automaticamente para o clipboard. Veja o console.",
      );
    }
  };

  useEffect(() => {
    const currentAnim = selectedChar.spriteConfig?.animations?.[selectedState];
    if (currentAnim?.createsBeam) {
      setSelectedBeamFamilyId(currentAnim.createsBeam);
    }
    if (currentAnim?.projectileId) {
      setSelectedProjectileFamilyId(currentAnim.projectileId);
    }
  }, [selectedState, selectedChar?.id]);

  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [isDraggingLeftPanel, setIsDraggingLeftPanel] = useState(false);
  const [selectedBeamPart, setSelectedBeamPart] = useState<
    "start" | "middle" | "end"
  >("middle");
  const [activeManagerClass, setActiveManagerClass] = useState<
    "BEAM" | "PROJECTILE" | "FECHO" | "GENKIDAMA" | "AURA" | "VFX"
  >("BEAM");
  const [frameIndex, setFrameIndex] = useState(0);
  const [charFrameIndex, setCharFrameIndex] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [lastCharTime, setLastCharTime] = useState(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPanRef = useRef({ x: 0, y: 0 });
  const spriteDragOffsetRef = useRef({ x: 0, y: 0 });
  const [referenceImg, setReferenceImg] = useState({
    url: "",
    opacity: 0.5,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    show: false,
  });

  const isProjTab =
    activeTab === "KI_BLAST" ||
    activeTab === "GENKIDAMA" ||
    activeTab === "fechosenergia";
  const isBeamTab = activeTab === "BEAM";
  const isBeamOrProjTab = isProjTab || isBeamTab;

  const activeCategory = getActiveContextCategory(activeTab);

  const config = (() => {
    switch (activeCategory) {
      case "CHARACTER": return characterAnimationContext;
      case "PROJECTILE": return projectileAnimationContext;
      case "BEAM": return beamAnimationContext;
      case "GENKIDAMA": return genkidamaAnimationContext;
      case "ENERGYCLOSURE": return energyClosureAnimationContext;
      case "AURA": return auraAnimationContext;
      case "EFFECT": return effectAnimationContext;
      default: return characterAnimationContext;
    }
  })();

  const setConfig = (newVal: AnimationFrameData | null | ((prev: AnimationFrameData | null) => AnimationFrameData | null)) => {
    const resolveVal = (prev: AnimationFrameData | null) => {
      if (typeof newVal === "function") {
        return newVal(prev);
      }
      return newVal;
    };
    switch (activeCategory) {
      case "CHARACTER":
        setCharacterAnimationContext(resolveVal(characterAnimationContext));
        break;
      case "PROJECTILE":
        setProjectileAnimationContext(resolveVal(projectileAnimationContext));
        break;
      case "BEAM":
        setBeamAnimationContext(resolveVal(beamAnimationContext));
        break;
      case "GENKIDAMA":
        setGenkidamaAnimationContext(resolveVal(genkidamaAnimationContext));
        break;
      case "ENERGYCLOSURE":
        setEnergyClosureAnimationContext(resolveVal(energyClosureAnimationContext));
        break;
      case "AURA":
        setAuraAnimationContext(resolveVal(auraAnimationContext));
        break;
      case "EFFECT":
        setEffectAnimationContext(resolveVal(effectAnimationContext));
        break;
    }
  };

  const deleteKeysFromProject = (
    keysToDelete: string[],
    category: "BEAM" | "PROJECTILE" | "GENKIDAMA" | "FECHO",
    silent: boolean = false
  ) => {
    if (keysToDelete.length === 0) return;

    // 1. Delete from managers
    const beamManager = BeamConfigKeyManager.getInstance();
    const projManager = ProjectileConfigKeyManager.getInstance();

    keysToDelete.forEach((key) => {
      if (category === "BEAM") {
        beamManager.deleteBeam(key);
      } else {
        projManager.deleteProjectile(key);
      }
    });

    // 2. Delete from manuallyActiveKeys state & localStorage
    setManuallyActiveKeys((prev) => {
      const next = { ...prev };
      keysToDelete.forEach((key) => {
        delete next[key];
      });
      try {
        localStorage.setItem("dd2d_manually_active_keys", JSON.stringify(next));
      } catch (e) {
        console.error("Falha ao salvar chaves ativas no localStorage:", e);
      }
      return next;
    });

    // 3. Remove all links, overrides, and references in ALL characters (BASE_CHARACTERS and selectedChar)
    const updateCharacterRefs = (char: CharacterData) => {
      let changed = false;
      
      try {
        // Clean up beamOverrides
        if (category === "BEAM" && char.beamOverrides) {
          keysToDelete.forEach((key) => {
            if (char.beamOverrides?.[key]) {
              try {
                delete char.beamOverrides[key];
                changed = true;
              } catch (e) {
                console.warn("Could not delete beamOverride (read-only):", e);
              }
            }
          });
        }

        // Clean up projectileOverrides
        if (category !== "BEAM" && (char as any).projectileOverrides) {
          keysToDelete.forEach((key) => {
            if ((char as any).projectileOverrides?.[key]) {
              try {
                delete (char as any).projectileOverrides[key];
                changed = true;
              } catch (e) {
                console.warn("Could not delete projectileOverride (read-only):", e);
              }
            }
          });
        }

        // Clean up animations (createsBeam / projectileId)
        if (char.spriteConfig?.animations) {
          Object.keys(char.spriteConfig.animations).forEach((animKey) => {
            const anim = char.spriteConfig.animations[animKey];
            if (anim) {
              if (category === "BEAM" && anim.createsBeam) {
                keysToDelete.forEach((key) => {
                  if (anim.createsBeam === key) {
                    try {
                      anim.createsBeam = undefined;
                      changed = true;
                    } catch (e) {
                      console.warn("Could not clear createsBeam (read-only):", e);
                    }
                  }
                });
              } else if (category !== "BEAM" && anim.projectileId) {
                keysToDelete.forEach((key) => {
                  if (anim.projectileId === key) {
                    try {
                      anim.projectileId = undefined;
                      changed = true;
                    } catch (e) {
                      console.warn("Could not clear projectileId (read-only):", e);
                    }
                  }
                });
              }
            }
          });
        }
      } catch (err) {
        console.error("Error updating character refs:", err);
      }

      return changed;
    };

    // Update selectedChar
    if (selectedChar) {
      const selectedCopy = { ...selectedChar };
      const changed = updateCharacterRefs(selectedCopy);
      if (changed) {
        setSelectedChar(selectedCopy);
      }
    }

    // Update BASE_CHARACTERS
    let baseCharChanged = false;
    try {
      BASE_CHARACTERS.forEach((char) => {
        const changed = updateCharacterRefs(char);
        if (changed) baseCharChanged = true;
      });
    } catch (e) {
      console.warn("Failed to update BASE_CHARACTERS:", e);
    }

    // Save updated character configurations to localStorage to make them permanent/saved!
    if (baseCharChanged || selectedChar) {
      try {
        const localData = localStorage.getItem("dd2d_char_overrides");
        const parsed = localData ? JSON.parse(localData) : {};
        
        BASE_CHARACTERS.forEach((char) => {
          const charOverrides = {
            attack: char.stats.attack,
            defense: char.stats.defense,
            speed: char.stats.speed,
            maxHp: char.maxHp,
            animations: char.spriteConfig?.animations || {},
            beamOverrides: char.beamOverrides || {},
            projectileOverrides: (char as any).projectileOverrides || {},
          };
          parsed[char.id] = charOverrides;
        });

        localStorage.setItem("dd2d_char_overrides", JSON.stringify(parsed));
        
        // Also trigger Firestore save in the background if NOT offline (silent save)
        if (!isOfflineMode && selectedChar) {
          const charOverrides = {
            attack: selectedChar.stats.attack,
            defense: selectedChar.stats.defense,
            speed: selectedChar.stats.speed,
            maxHp: selectedChar.maxHp,
            animations: selectedChar.spriteConfig?.animations || {},
            beamOverrides: selectedChar.beamOverrides || {},
            projectileOverrides: (selectedChar as any).projectileOverrides || {},
          };
          const docRef = doc(db, "character_overrides", selectedChar.id);
          setDoc(docRef, charOverrides, { merge: true }).catch((err) => {
            console.error("Erro ao salvar exclusões no firestore:", err);
          });
        }
      } catch (e) {
        console.error("Falha ao salvar exclusão nos character overrides:", e);
      }
    }

    // 4. Update memory database states in local state
    if (category === "BEAM") {
      setLocalBeamDatabase((prev) => {
        const next = { ...prev };
        keysToDelete.forEach((key) => {
          delete next[key];
        });
        return next;
      });

      // If selected family is deleted, reset to default BEAM
      keysToDelete.forEach((key) => {
        if (selectedBeamFamilyId === key) {
          setSelectedBeamFamilyId("BEAM");
        }
      });
    } else {
      setLocalProjectileDatabase((prev) => {
        const next = { ...prev };
        keysToDelete.forEach((key) => {
          delete next[key];
        });
        return next;
      });

      // If selected projectile family is deleted, reset to default PROJETIL_1
      keysToDelete.forEach((key) => {
        if (selectedProjectileFamilyId === key) {
          setSelectedProjectileFamilyId("PROJETIL_1");
        }
      });
    }

    setSelectedInactiveKeys((prev) => prev.filter(k => !keysToDelete.includes(k)));

    if (!silent) {
      alert(`${keysToDelete.length} chaves inativas excluídas com sucesso do projeto e referências limpas!`);
    }
  };

  // Reset inactive selection list when active class changes
  useEffect(() => {
    setSelectedInactiveKeys([]);
  }, [activeManagerClass]);

  // Automatic deletion of all inactive keys when changing editor modules (tabs)
  useEffect(() => {
    const inactiveBeams = Object.keys(localBeamDatabase).filter(
      (key) => key.startsWith("CHAVE_") && !isKeyActive(key)
    );
    const inactiveProjKeys = Object.keys(localProjectileDatabase).filter((key) => {
      const isCustom = key.startsWith("CHAVE_") || !PROJECTILE_DATABASE[key] || key.match(/_\d{3,4}$/);
      return isCustom && !isKeyActive(key);
    });

    if (inactiveBeams.length > 0) {
      deleteKeysFromProject(inactiveBeams, "BEAM", true);
    }
    if (inactiveProjKeys.length > 0) {
      deleteKeysFromProject(inactiveProjKeys, "PROJECTILE", true);
    }
  }, [activeTab]);

  // Automatic cleanup of all inactive keys and local overrides on unmount (leaving/closing the Animation Tools)
  useEffect(() => {
    // Take a snapshot of the original BASE_CHARACTERS on mount before any edits are performed
    try {
      originalCharactersBackupRef.current = deepClone(BASE_CHARACTERS);
    } catch (e) {
      console.error("Failed to backup BASE_CHARACTERS on mount:", e);
    }

    return () => {
      try {
        localStorage.removeItem("dd2d_char_overrides");
        localStorage.removeItem("dd2d_manually_active_keys");
      } catch (e) {
        console.error("Failed to remove overrides on unmount:", e);
      }
      
      try {
        revertAllEdits();
      } catch (err) {
        console.error("Failed to revert all edits on unmount:", err);
      }
    };
  }, []);

  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    const EDITOR_TABS = ["BEAM", "KI_BLAST", "GENKIDAMA", "fechosenergia", "AURAS", "BEAMS_MANAGER", "BEAM_LINKS"];
    const isPrevEditor = EDITOR_TABS.includes(prevTabRef.current);
    const isCurrentEditor = EDITOR_TABS.includes(activeTab);
    
    if (isPrevEditor && !isCurrentEditor) {
      try {
        revertAllEdits();
      } catch (err) {
        console.error("Failed to revert edits on tab switch:", err);
      }
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (
      activeTab === "KI_BLAST" &&
      Object.keys(localProjectileDatabase).length > 0
    ) {
      const current = selectedProjectileFamilyId;
      const isValid =
        (current.includes("KI_BLAST") ||
          current.includes("PROJETIL") ||
          (PROJECTILE_DATABASE[current] === undefined &&
            !current.includes("GENKIDAMA") &&
            !current.includes("FECHO"))) &&
        !current.includes("BEAM");
      if (!isValid) {
        const firstBlast =
          Object.keys(PROJECTILE_DATABASE).find(
            (k) =>
              (k.includes("KI_BLAST") || k.includes("PROJETIL")) &&
              !k.includes("GENKIDAMA") &&
              !k.includes("FECHO") &&
              !k.includes("BEAM"),
          ) || Object.keys(PROJECTILE_DATABASE)[0];
        if (firstBlast) {
          setSelectedProjectileFamilyId(firstBlast);
          setSelectedBeamFamilyId(firstBlast);
        }
      }
    } else if (
      activeTab === "GENKIDAMA" &&
      Object.keys(localProjectileDatabase).length > 0
    ) {
      const current = selectedProjectileFamilyId;
      const isValid =
        current.includes("GENKIDAMA") &&
        !current.includes("_EXPLODE") &&
        !current.includes("_DISSIPATE") &&
        !current.includes("_CHAO") &&
        !current.includes("_COLLISION") &&
        !current.includes("_FINAL");
      if (!isValid) {
        const firstGenki =
          Object.keys(PROJECTILE_DATABASE).find(
            (k) =>
              k.includes("GENKIDAMA") &&
              !k.includes("_EXPLODE") &&
              !k.includes("_DISSIPATE") &&
              !k.includes("_CHAO") &&
              !k.includes("_COLLISION") &&
              !k.includes("_FINAL"),
          ) || Object.keys(PROJECTILE_DATABASE)[0];
        if (firstGenki) {
          setSelectedProjectileFamilyId(firstGenki);
          setSelectedBeamFamilyId(firstGenki);
        }
      }
    } else if (
      activeTab === "fechosenergia" &&
      Object.keys(localProjectileDatabase).length > 0
    ) {
      const current = selectedProjectileFamilyId;
      const isValid =
        current.includes("FECHO") || current.includes("fechosenergia");
      if (!isValid) {
        const firstFecho =
          Object.keys(PROJECTILE_DATABASE).find(
            (k) => k.includes("FECHO") || k.includes("fechosenergia"),
          ) || Object.keys(PROJECTILE_DATABASE)[0];
        if (firstFecho) {
          setSelectedProjectileFamilyId(firstFecho);
          setSelectedBeamFamilyId(firstFecho);
        }
      }
    } else if (
      activeTab === "BEAM" &&
      Object.keys(localBeamDatabase).length > 0
    ) {
      const current = selectedBeamFamilyId;
      const isValid =
        (current.includes("BEAM") ||
          current.includes("SUPER_ESPECIAL") ||
          current.startsWith("CHAVE_")) &&
        !current.includes("FECHO") &&
        !current.includes("KI_BLAST") &&
        !current.includes("GENKIDAMA") &&
        !current.includes("PROJETIL");
      if (!isValid) {
        const firstBeam =
          Object.keys(BEAM_DATABASE).find(
            (k) =>
              (k.includes("BEAM") || k.includes("SUPER_ESPECIAL")) &&
              !k.includes("FECHO") &&
              !k.includes("KI_BLAST") &&
              !k.includes("GENKIDAMA") &&
              !k.includes("PROJETIL"),
          ) || Object.keys(BEAM_DATABASE)[0];
        if (firstBeam) {
          setSelectedBeamFamilyId(firstBeam);
        }
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (isProjTab) {
      setSelectedBeamPart("middle");
    }
  }, [isProjTab]);

  useEffect(() => {
    const finalKeys = Object.keys(localAuraDatabase);
    const stdKeys = finalKeys.filter((k) => k.startsWith("AURA_"));
    const customKeys = finalKeys.filter((k) => k.startsWith("CHAVE_"));

    if (activeTab === "AURAS") {
      if (!selectedAuraKey || !localAuraDatabase[selectedAuraKey]) {
        const defaultBaseAuraId = (() => {
          if (!selectedChar) return "AURA_001";
          const normId = selectedChar.id.toLowerCase();
          if (normId.includes("frieza")) return "AURA_008";
          if (normId.includes("gojo")) return "AURA_009";
          if (normId.includes("mui") || normId.includes("instinct"))
            return "AURA_005";
          if (normId.includes("rose")) return "AURA_004";
          if (normId.includes("blue") || normId.includes("god"))
            return "AURA_003";
          if (
            normId.includes("ssj") ||
            normId.includes("super_saiyan") ||
            normId.includes("trunks_ssj")
          )
            return "AURA_002";
          if (normId.includes("ego")) return "AURA_006";
          return "AURA_001";
        })();
        if (stdKeys.includes(defaultBaseAuraId)) {
          setSelectedAuraKey(defaultBaseAuraId);
        } else if (stdKeys.length > 0) {
          setSelectedAuraKey(stdKeys[0]);
        }
      }
    } else if (activeTab === "BEAMS_MANAGER" && activeManagerClass === "AURA") {
      if (
        !selectedAuraKey ||
        selectedAuraKey.startsWith("AURA_") ||
        !localAuraDatabase[selectedAuraKey]
      ) {
        const existingKey = customKeys.find(
          (k) => localAuraDatabase[k].ownerCharacterId === selectedChar?.id,
        );
        if (existingKey) {
          setSelectedAuraKey(existingKey);
        } else if (customKeys.length > 0) {
          setSelectedAuraKey(customKeys[0]);
        } else {
          setSelectedAuraKey("");
        }
      }
    }
  }, [
    activeTab,
    activeManagerClass,
    selectedChar?.id,
    localAuraDatabase,
    selectedAuraKey,
  ]);

  const [previewOpponent, setPreviewOpponent] = useState<CharacterData>(
    BASE_CHARACTERS[1] || BASE_CHARACTERS[0],
  );

  const animManager = RealSpriteRenderer.getInstance();

  useEffect(() => {
    if (!selectedChar || selectedChar.id === "random") return;
    const keyManager = AuraConfigKeyManager.getInstance();
    keyManager.cleanupDuplicateAndOrphanedAuras(BASE_CHARACTERS);
    let allAuras = keyManager.getAllAuras();
    let changed = false;

    // 1. Auto-populate/pre-register default auras for ALL characters in BASE_CHARACTERS
    BASE_CHARACTERS.forEach((char) => {
      if (!char.id || char.id === "random") return;
      const charKeys = Object.keys(allAuras);
      const existing = charKeys.find(
        (k) => allAuras[k].ownerCharacterId === char.id,
      );

      if (!existing) {
        const newKey = keyManager.generateKey();
        const defaultBaseAuraId = (() => {
          const normId = char.id.toLowerCase();
          if (normId.includes("frieza")) return "AURA_008";
          if (normId.includes("gojo")) return "AURA_009";
          if (normId.includes("mui") || normId.includes("instinct"))
            return "AURA_005";
          if (normId.includes("rose")) return "AURA_004";
          if (normId.includes("blue") || normId.includes("god"))
            return "AURA_003";
          if (
            normId.includes("ssj") ||
            normId.includes("super_saiyan") ||
            normId.includes("trunks_ssj")
          )
            return "AURA_002";
          if (normId.includes("ego")) return "AURA_006";
          return "AURA_001";
        })();

        const defaultGlowColor = (() => {
          const normId = char.id.toLowerCase();
          if (normId.includes("frieza")) return "#dda0dd";
          if (normId.includes("mui") || normId.includes("instinct"))
            return "#ffffff";
          if (normId.includes("rose")) return "#ff40ff";
          if (normId.includes("blue") || normId.includes("god"))
            return "#00ffff";
          if (
            normId.includes("ssj") ||
            normId.includes("super_saiyan") ||
            normId.includes("trunks_ssj")
          )
            return "#ffd700";
          if (normId.includes("ego")) return "#da70d6";
          return "#ffffff";
        })();

        keyManager.registerAura(
          newKey,
          defaultBaseAuraId,
          `Aura Ativa - ${char.name}`,
          {
            ownerCharacterId: char.id,
            ownerAnimationKey: "CHARGING",
            isDefaultCharging: true,
            color: "#ffffff",
            auraHueRotate: 0,
            auraSaturate: 1.0,
            auraBrightness: 1.0,
            auraContrast: 1.0,
            auraOpacity: 0.85,
          },
        );

        allAuras = keyManager.getAllAuras();
        changed = true;
      }
    });

    // 2. Ensure all standard/default game auras (AURA_001 to AURA_016) are registered so they appear in the manager too!
    Object.keys(DEFAULT_AURAS).forEach((stdKey) => {
      const existing = allAuras[stdKey];
      if (!existing) {
        keyManager.getAuraConfig(stdKey);
        changed = true;
      }
    });

    if (changed) {
      allAuras = keyManager.getAllAuras();
    }

    setLocalAuraDatabase(allAuras);

    // Resolve active selection key
    const finalKeys = Object.keys(allAuras);
    if (activeTab === "AURAS") {
      if (!selectedAuraKey || !allAuras[selectedAuraKey]) {
        const stdKeys = finalKeys.filter((k) => k.startsWith("AURA_"));
        const defaultBaseAuraId = (() => {
          if (!selectedChar) return "AURA_001";
          const normId = selectedChar.id.toLowerCase();
          if (normId.includes("frieza")) return "AURA_008";
          if (normId.includes("gojo")) return "AURA_009";
          if (normId.includes("mui") || normId.includes("instinct"))
            return "AURA_005";
          if (normId.includes("rose")) return "AURA_004";
          if (normId.includes("blue") || normId.includes("god"))
            return "AURA_003";
          if (
            normId.includes("ssj") ||
            normId.includes("super_saiyan") ||
            normId.includes("trunks_ssj")
          )
            return "AURA_002";
          if (normId.includes("ego")) return "AURA_006";
          return "AURA_001";
        })();
        if (stdKeys.includes(defaultBaseAuraId)) {
          setSelectedAuraKey(defaultBaseAuraId);
        } else if (stdKeys.length > 0) {
          setSelectedAuraKey(stdKeys[0]);
        } else {
          setSelectedAuraKey("");
        }
      }
    } else {
      if (
        !selectedAuraKey ||
        selectedAuraKey.startsWith("AURA_") ||
        !allAuras[selectedAuraKey]
      ) {
        const customKeys = finalKeys.filter((k) => k.startsWith("CHAVE_"));
        const existingKey = customKeys.find(
          (k) => allAuras[k].ownerCharacterId === selectedChar?.id,
        );
        if (existingKey) {
          setSelectedAuraKey(existingKey);
        } else if (customKeys.length > 0) {
          setSelectedAuraKey(customKeys[0]);
        } else {
          setSelectedAuraKey("");
        }
      }
    }
  }, [selectedChar?.id, activeTab]);

  const [draggingPoint, setDraggingPoint] = useState<
    "NONE" | "CENTER" | "SPRITE_ORIGIN" | "KI_ORIGIN" | "CAMERA" | "PAN"
  >("NONE");
  const [beamPreviewAnimation, setBeamPreviewAnimation] = useState<
    string | null
  >(null);
  const [beamPreviewCharacterId, setBeamPreviewCharacterId] = useState<
    string | null
  >(null);

  const [showOnionSkin, setShowOnionSkin] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const [showCustomOnionSkin, setShowCustomOnionSkin] = useState(false);
  const [customOnionConfig, setCustomOnionConfig] = useState({
    characterId: BASE_CHARACTERS[0].id,
    animState: "IDLE",
    frameIndex: 0,
    opacity: 0.5,
    layer: "BACK" as "BACK" | "FRONT",
  });

  useEffect(() => {
    if (showCustomOnionSkin) {
      const refChar = BASE_CHARACTERS.find(
        (c) => c.id === customOnionConfig.characterId,
      );
      if (refChar) {
        animManager.preloadCharacter(refChar);
      }
    }
  }, [showCustomOnionSkin, customOnionConfig.characterId]);

  const getAttackContextKey = (stateStr: string, charData: CharacterData) => {
    if (isBeamOrProjTab) {
      if (beamPreviewAnimation) {
        return beamPreviewAnimation;
      }
      return Object.keys(charData.spriteConfig?.animations || {}).find(
        (k) =>
          charData.spriteConfig?.animations?.[k]?.createsBeam ===
          selectedBeamFamilyId,
      );
    }

    if (beamPreviewAnimation) {
      return beamPreviewAnimation;
    }
    let key = undefined;
    if (stateStr.includes("BEAM_")) {
      if (stateStr.includes("SUPER_ESPECIAL")) {
        const match = stateStr.match(/SUPER_ESPECIAL_BEAM_[A-Z]+_(\d+)/);
        if (match) {
          const id = match[1];
          const preferred = [
            `SUPER_ESPECIAL_MEIO_${id}`,
            `SUPER_ESPECIAL_${id}`,
          ];
          key =
            preferred.find(
              (k) =>
                charData.spriteConfig?.animations[k as any]?.kiOriginX !==
                undefined,
            ) ||
            preferred.find((k) => charData.spriteConfig?.animations[k as any]);
        } else {
          key = ["SUPER_ESPECIAL_MEIO", "SUPER_ESPECIAL"].find(
            (k) => charData.spriteConfig?.animations[k as any],
          );
        }
      } else {
        const match2 = stateStr.match(/BEAM_[A-Z]+_(\d+)/);
        let preferred: string[] = [];
        if (match2) {
          const id = match2[1];
          preferred = [
            `ULTIMATE_${id}_LOOP`,
            `ULTIMATE_LOOP_${id}`,
            `ULTIMATE_${id}_MIDDLE`,
            `ULTIMATE_${id}_START`,
            `ULTIMATE_${id}`,
          ];
        }
        preferred.push(
          "ATTACK_SPECIAL_LOOP",
          "ATTACK_SPECIAL_FIRE",
          "ESPECIAL_KAMEHAMEHA_FINAL", // which is often the loop
          "ATTACK_SPECIAL_START",
          "ESPECIAL_KAMEHAMEHA_INICIO",
          "ATTACK_SPECIAL",
          "ULTIMATE_2_LOOP",
          "ULTIMATE_2",
          "ULTIMATE_2_MIDDLE",
          "ULTIMATE_2_START",
        );
        key =
          preferred.find(
            (k) =>
              charData.spriteConfig?.animations[k as any]?.kiOriginX !==
              undefined,
          ) ||
          preferred.find((k) => charData.spriteConfig?.animations[k as any]);
      }
    }
    if (!key) {
      key = Object.keys(charData.spriteConfig?.animations || {}).find(
        (k) =>
          k === stateStr &&
          charData.spriteConfig?.animations[k as any]?.kiOriginX !== undefined,
      );
    }
    return key || stateStr;
  };

  const getOriginAndCenter = () => {
    const centerX = canvasRef.current?.width
      ? canvasRef.current.width / 2
      : 400;
    const centerY = canvasRef.current?.height
      ? canvasRef.current.height / 2
      : 225;

    const isEditingBeam =
      isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));
    const attackContextKey = getAttackContextKey(
      selectedState || "",
      selectedChar,
    );
    const hasAttackContext = isEditingBeam && attackContextKey;
    const activeCat = getActiveContextCategory(activeTab);
    const characterConfig =
      (hasAttackContext
        ? selectedChar.spriteConfig?.animations?.[attackContextKey!]
        : activeCat !== "CHARACTER"
          ? selectedChar.spriteConfig?.animations?.[selectedState] || selectedChar.spriteConfig?.animations?.["IDLE"]
          : config) || {};

    if (isEditingBeam && selectedState) {
      const animToUpdate =
        beamPreviewAnimation ||
        Object.keys(selectedChar.spriteConfig?.animations || {}).find(
          (k) =>
            selectedChar.spriteConfig?.animations?.[k]?.createsBeam ===
            selectedBeamFamilyId,
        );
      const linkedAnim = animToUpdate ? selectedChar.spriteConfig?.animations?.[animToUpdate] : undefined;

      const resolvedKiX =
        linkedAnim?.kiOriginX !== undefined
          ? linkedAnim.kiOriginX
          : (characterConfig.kiOriginX ?? selectedChar.spriteConfig?.kiOriginX ?? 76);
      const resolvedKiY =
        linkedAnim?.kiOriginY !== undefined
          ? linkedAnim.kiOriginY
          : (characterConfig.kiOriginY ?? selectedChar.spriteConfig?.kiOriginY ?? 125);

      const kiX = centerX - PLAYER_WIDTH / 2 + resolvedKiX;
      const kiY = centerY - PLAYER_HEIGHT / 2 + resolvedKiY;
      const pWidth = 2000;
      const bStartY = kiY;

      const family = localBeamDatabase[selectedBeamFamilyId];
      const startAnim = family?.start;
      const midAnim = family?.middle;
      const endAnim = family?.end;

      const scale = midAnim?.scale || 2.2;
      const startScale = startAnim?.scale || scale;

      const startW = startAnim
        ? CollisionHelper.getActualFrameWidth(startAnim, frameIndex) * startScale
        : 80 * startScale;

      let midLeft = 0;
      if (startAnim) {
        const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
        const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
        midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
      }

      const w = 0;
      const h = 80;
      // BEAM helper drawing offsets
      let rootX = kiX;
      let rootY = bStartY + 5;

      const isCurrentEnd =
        (selectedState && selectedState.includes("END")) ||
        ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "end");
      const isCurrentMid =
        (selectedState && selectedState.includes("MIDDLE")) ||
        ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "middle");
      const isCurrentStart =
        (selectedState && selectedState.includes("START")) ||
        ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "start");

      const midOffsetY = midAnim?.offsetY || 0;

      if (isCurrentEnd) {
        rootX = kiX + Math.max(midLeft, pWidth);
        rootY = bStartY + 5 + midOffsetY;
      } else if (isCurrentMid) {
        rootX = kiX + (midLeft + Math.max(midLeft, pWidth)) / 2;
        rootY = bStartY;
      } else if (isCurrentStart) {
        rootX = kiX;
        rootY = bStartY + 5 + midOffsetY;
      }

      const ox_b = (isCurrentMid || isCurrentEnd) ? 0 : (config?.originX !== undefined ? config.originX : w / 2);
      const oy_b = (isCurrentMid || isCurrentEnd) ? 0 : (config?.originY !== undefined ? config.originY : h / 2);

      const originScreenX = rootX + ox_b;
      const originScreenY = rootY + oy_b;
      const centerScreenX = originScreenX + (config?.offsetX || 0);
      const centerScreenY = originScreenY + (config?.offsetY || 0);

      return {
        originScreenX,
        originScreenY,
        centerScreenX,
        centerScreenY,
        rootX,
        rootY,
        w,
        h,
      };
    } else {
      const ox =
        config?.originX !== undefined ? config.originX : PLAYER_WIDTH / 2;
      const oy =
        config?.originY !== undefined
          ? config.originY
          : config?.fullScreen
            ? PLAYER_HEIGHT / 2
            : PLAYER_HEIGHT;
      const originScreenX = centerX - PLAYER_WIDTH / 2 + ox;
      const originScreenY = centerY - PLAYER_HEIGHT / 2 + oy;
      const centerScreenX = originScreenX + (config?.offsetX || 0);
      const centerScreenY = originScreenY + (config?.offsetY || 0);

      return {
        originScreenX,
        originScreenY,
        centerScreenX,
        centerScreenY,
        rootX: centerX - PLAYER_WIDTH / 2,
        rootY: centerY - PLAYER_HEIGHT / 2,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT,
      };
    }
  };

  const getPointerPos = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = canvasRef.current.width / 2;
    const cy = canvasRef.current.height / 2;
    const clientXZoomless = (clientX - rect.left - cx) / zoom + cx;
    const clientYZoomless = (clientY - rect.top - cy) / zoom + cy;
    return { clientXZoomless, clientYZoomless };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!config || !canvasRef.current) return;
    (e.target as Element).setPointerCapture(e.pointerId);

    const { clientXZoomless, clientYZoomless } = getPointerPos(
      e.clientX,
      e.clientY,
    );

    const pointerX = clientXZoomless - pan.x;
    const pointerY = clientYZoomless - pan.y;

    const centerX = canvasRef.current?.width
      ? canvasRef.current.width / 2
      : 400;
    const centerY = canvasRef.current?.height
      ? canvasRef.current.height / 2
      : 225;

    const { originScreenX, originScreenY, centerScreenX, centerScreenY } =
      getOriginAndCenter();
    const isEditingBeam =
      isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));
    const attackContextKey = getAttackContextKey(
      selectedState || "",
      selectedChar,
    );
    const hasAttackContext = isEditingBeam && attackContextKey;
    const activeCat = getActiveContextCategory(activeTab);
    const characterConfig =
      (hasAttackContext
        ? selectedChar.spriteConfig?.animations?.[attackContextKey!]
        : activeCat !== "CHARACTER"
          ? selectedChar.spriteConfig?.animations?.[selectedState] || selectedChar.spriteConfig?.animations?.["IDLE"]
          : config) || {};

    let resolvedKiX = characterConfig?.kiOriginX ?? 0;
    let resolvedKiY = characterConfig?.kiOriginY ?? 0;

    if (isEditingBeam && selectedState) {
      const animToUpdate =
        beamPreviewAnimation ||
        Object.keys(selectedChar.spriteConfig?.animations || {}).find(
          (k) =>
            selectedChar.spriteConfig?.animations?.[k]?.createsBeam ===
            selectedBeamFamilyId,
        );
      const linkedAnim = animToUpdate ? selectedChar.spriteConfig?.animations?.[animToUpdate] : undefined;

      resolvedKiX =
        linkedAnim?.kiOriginX !== undefined
          ? linkedAnim.kiOriginX
          : (characterConfig.kiOriginX ?? selectedChar.spriteConfig?.kiOriginX ?? 76);
      resolvedKiY =
        linkedAnim?.kiOriginY !== undefined
          ? linkedAnim.kiOriginY
          : (characterConfig.kiOriginY ?? selectedChar.spriteConfig?.kiOriginY ?? 125);
    } else if (
      config?.kiOriginX !== undefined ||
      selectedChar.spriteConfig?.kiOriginX !== undefined
    ) {
      resolvedKiX =
        config?.kiOriginX ?? selectedChar.spriteConfig?.kiOriginX ?? 76;
      resolvedKiY =
        config?.kiOriginY ?? selectedChar.spriteConfig?.kiOriginY ?? 125;
    }

    const kiX = centerX - PLAYER_WIDTH / 2 + resolvedKiX;
    const kiY = centerY - PLAYER_HEIGHT / 2 + resolvedKiY;
    const bStartY = kiY;

    const camX = centerX - PLAYER_WIDTH / 2 + (config.cameraFocusX ?? 0);
    const camY = centerY - PLAYER_HEIGHT / 2 + (config.cameraFocusY ?? 0);

    // Check distance to points
    const dist = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x2 - x1, y2 - y1);

    // BEAM DRAG INTERCEPTION
    if (isEditingBeam) {
      const isBeamTab = activeTab === "BEAM";
      const projFamilyId = selectedProjectileFamilyId || selectedBeamFamilyId;
      const family = isBeamTab
        ? localBeamDatabase[selectedBeamFamilyId]
        : localProjectileDatabase[projFamilyId] ||
          localBeamDatabase[selectedBeamFamilyId];
      if (family) {
        const charOverrides = isBeamTab
          ? (selectedChar.beamOverrides?.[selectedBeamFamilyId] ??
            selectedChar.spriteConfig?.animations?.[selectedState]?.beamConfig)
          : ((selectedChar as any).projectileOverrides?.[projFamilyId] ??
            (selectedChar as any).beamOverrides?.[projFamilyId] ??
            selectedChar.spriteConfig?.animations?.[selectedState]
              ?.projectileConfig ??
            selectedChar.spriteConfig?.animations?.[selectedState]?.beamConfig);
        const mergedStart = family.start
          ? { ...family.start, ...(charOverrides?.start as any) }
          : undefined;
        const mergedMiddle = family.middle
          ? { ...family.middle, ...(charOverrides?.middle as any) }
          : family.middle;
        const mergedEnd = family.end
          ? { ...family.end, ...(charOverrides?.end as any) }
          : undefined;

        const actStart =
          selectedBeamPart === "start"
            ? {
                ...mergedStart,
                ...config,
                imageUrl: config?.imageUrl || mergedStart?.imageUrl,
              }
            : mergedStart;
        const actMid =
          selectedBeamPart === "middle"
            ? {
                ...mergedMiddle,
                ...config,
                imageUrl: config?.imageUrl || mergedMiddle?.imageUrl,
              }
            : mergedMiddle;
        const actEnd =
          selectedBeamPart === "end"
            ? {
                ...mergedEnd,
                ...config,
                imageUrl: config?.imageUrl || mergedEnd?.imageUrl,
              }
            : mergedEnd;

        const midOffsetY = actMid?.offsetY || 0;

        const startXLoc = kiX + (actStart?.offsetX || 0);
        const startYLoc = bStartY + 5 + midOffsetY + (actStart?.offsetY || 0);

        const midXLoc = kiX + (actMid?.offsetX || 0);
        const midYLoc = bStartY + midOffsetY;

        const endXLoc = kiX + (actMid?.offsetX || 0) + 2000;
        const endYLoc = bStartY + 5 + midOffsetY + (actEnd?.offsetY || 0);

        const isProjectile = (() => {
          if (activeTab === "BEAM") return false;
          if (
            activeTab === "KI_BLAST" ||
            activeTab === "GENKIDAMA" ||
            activeTab === "fechosenergia" ||
            activeTab === "PROJECTILE"
          )
            return true;
          const anim = selectedChar.spriteConfig?.animations?.[selectedState];
          const beamId = anim?.createsBeam;
          if (beamId) {
            return (
              beamId.includes("KI_BLAST") ||
              beamId.includes("PROJECTILE") ||
              beamId.includes("PROJETIL") ||
              beamId.includes("GENKIDAMA") ||
              beamId.includes("FECHO")
            );
          }
          return (
            selectedState?.includes("KI_BLAST") ||
            selectedState?.includes("GENKIDAMA") ||
            selectedState?.includes("FECHO")
          );
        })();

        const distToStart = dist(pointerX, pointerY, startXLoc, startYLoc);
        const distToMid = dist(pointerX, pointerY, midXLoc, midYLoc);
        const distToEnd = dist(pointerX, pointerY, endXLoc, endYLoc);

        let closestPart: "start" | "middle" | "end" | null = null;
        let minDist = 40;

        if (actStart && distToStart < minDist) {
          minDist = distToStart;
          closestPart = "start";
        }
        if (actMid && distToMid < minDist) {
          minDist = distToMid;
          closestPart = "middle";
        }
        if (actEnd && !isProjectile && distToEnd < minDist) {
          minDist = distToEnd;
          closestPart = "end";
        }

        if (closestPart) {
          setSelectedBeamPart(closestPart);

          let targetPartConfig: any = null;
          if (closestPart === "start") targetPartConfig = actStart;
          else if (closestPart === "middle") targetPartConfig = actMid;
          else if (closestPart === "end") targetPartConfig = actEnd;

          if (targetPartConfig) {
            setConfig({
              ...targetPartConfig,
              offsetX:
                targetPartConfig.offsetX !== undefined
                  ? targetPartConfig.offsetX
                  : 0,
              offsetY:
                targetPartConfig.offsetY !== undefined
                  ? targetPartConfig.offsetY
                  : 0,
            });
          }

          setDraggingPoint("CENTER");
          return;
        }
      }
    }

    let imageWidth = config.scale
      ? (config.frameWidth || 100) * config.scale
      : config.frameWidth || 100;
    let imageHeight = config.scale
      ? (config.frameHeight || 100) * config.scale
      : config.frameHeight || 100;

    if (config.isGif && config.imageUrl) {
      const img = animManager.getGifFrame(config.imageUrl, frameIndex);
      if (img && img.width) {
        imageWidth = img.width * (config.scale || 1);
        imageHeight = img.height * (config.scale || 1);
      }
    } else if (config.imageUrl) {
      const img = animManager.loadTexture(config.imageUrl);
      if (img && img.width && !config.frameWidth) {
        imageWidth = img.width * (config.scale || 1);
        imageHeight = img.height * (config.scale || 1);
      }
    }

    const cx = config.centerX !== undefined ? config.centerX : imageWidth / 2;
    const cy =
      config.centerY !== undefined
        ? config.centerY
        : config.fullScreen ||
            (selectedState && selectedState.includes("BEAM_"))
          ? imageHeight / 2
          : imageHeight;
    const destX = centerScreenX - cx;
    const destY = centerScreenY - cy;

    const oppStartX = centerX - PLAYER_WIDTH / 2 + (config.opponentPosX || 0);
    const oppStartY = centerY - PLAYER_HEIGHT / 2 + (config.opponentPosY || 0);
    const oppWidth = PLAYER_WIDTH * (config.opponentScale || 1);
    const oppHeight = PLAYER_HEIGHT * (config.opponentScale || 1);

    if (
      (activeTab === "CINEMATIC" || isBeamOrProjTab) &&
      resolvedKiX !== undefined &&
      dist(pointerX, pointerY, kiX, kiY) < 20
    ) {
      setDraggingPoint("KI_ORIGIN");
    } else if (
      activeTab === "CINEMATIC" &&
      config.cameraFocusX !== undefined &&
      dist(pointerX, pointerY, camX, camY) < 20
    ) {
      setDraggingPoint("CAMERA");
    } else if (dist(pointerX, pointerY, centerScreenX, centerScreenY) < 40) {
      setDraggingPoint("CENTER");
    } else if (
      pointerX >= destX &&
      pointerX <= destX + imageWidth &&
      pointerY >= destY &&
      pointerY <= destY + imageHeight
    ) {
      setDraggingPoint("SPRITE_ORIGIN");
      spriteDragOffsetRef.current = {
        x: pointerX - destX,
        y: pointerY - destY,
      };
    } else {
      setDraggingPoint("PAN");
      dragStartRef.current = { x: clientXZoomless, y: clientYZoomless };
      initialPanRef.current = { ...pan };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingPoint === "NONE" || !config || !canvasRef.current) return;

    const { clientXZoomless, clientYZoomless } = getPointerPos(
      e.clientX,
      e.clientY,
    );

    if (draggingPoint === "PAN") {
      const dx = clientXZoomless - dragStartRef.current.x;
      const dy = clientYZoomless - dragStartRef.current.y;
      setPan({
        x: initialPanRef.current.x + dx,
        y: initialPanRef.current.y + dy,
      });
      return;
    }

    let pointerX = clientXZoomless - pan.x;
    let pointerY = clientYZoomless - pan.y;

    const centerX = canvasRef.current?.width
      ? canvasRef.current.width / 2
      : 400;
    const centerY = canvasRef.current?.height
      ? canvasRef.current.height / 2
      : 225;

    // Base relative position
    const { rootX, rootY, w, h } = getOriginAndCenter();
    const relX = pointerX - rootX;
    const relY = pointerY - rootY;

    const isEditingBeam =
      isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));

    if (draggingPoint === "KI_ORIGIN") {
      const playerRootX = centerX - PLAYER_WIDTH / 2;
      const playerRootY = centerY - PLAYER_HEIGHT / 2;
      handleConfigChange("kiOriginX", Math.round(pointerX - playerRootX));
      handleConfigChange("kiOriginY", Math.round(pointerY - playerRootY));
    } else if (draggingPoint === "CAMERA") {
      const playerRootX = centerX - PLAYER_WIDTH / 2;
      const playerRootY = centerY - PLAYER_HEIGHT / 2;
      handleConfigChange("cameraFocusX", Math.round(pointerX - playerRootX));
      handleConfigChange("cameraFocusY", Math.round(pointerY - playerRootY));
    } else if (draggingPoint === "CENTER") {
      const isCurrentMidJoint =
        (selectedState && selectedState.includes("BEAM_MIDDLE")) ||
        ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "middle");
      const isCurrentEndJoint =
        (selectedState && selectedState.includes("BEAM_END")) ||
        ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "end");

      const ox =
        config?.originX !== undefined
          ? config.originX
          : isEditingBeam
            ? w / 2
            : w / 2;
      const oy =
        config?.originY !== undefined
          ? config.originY
          : isCurrentMidJoint
            ? 0
            : config?.fullScreen || isEditingBeam
              ? h / 2
              : h;
      if (!isCurrentEndJoint && !isCurrentMidJoint) {
        handleConfigChange("offsetX", Math.round(relX - ox));
      }
      handleConfigChange("offsetY", Math.round(relY - oy));
    } else if (draggingPoint === "SPRITE_ORIGIN") {
      const newDestX = pointerX - spriteDragOffsetRef.current.x;
      const newDestY = pointerY - spriteDragOffsetRef.current.y;

      const { originScreenX, originScreenY } = getOriginAndCenter();

      if (
        (selectedState && selectedState.includes("BEAM_MIDDLE")) ||
        isEditingBeam
      ) {
        let imageWidth = config.scale
          ? (config.frameWidth || 100) * config.scale
          : config.frameWidth || 100;
        let imageHeight = config.scale
          ? (config.frameHeight || 100) * config.scale
          : config.frameHeight || 100;

        if (config.isGif && config.imageUrl) {
          const img = animManager.getGifFrame(config.imageUrl, frameIndex);
          if (img && img.width) {
            imageWidth = img.width * (config.scale || 1);
            imageHeight = img.height * (config.scale || 1);
          }
        } else if (config.imageUrl) {
          const img = animManager.loadTexture(config.imageUrl);
          if (img && img.width && !config.frameWidth) {
            imageWidth = img.width * (config.scale || 1);
            imageHeight = img.height * (config.scale || 1);
          }
        }

        const cx =
          config?.centerX !== undefined ? config.centerX : imageWidth / 2;
        const cy =
          config?.centerY !== undefined ? config.centerY : imageHeight / 2;

        const isCurrentEndJoint =
          (selectedState && selectedState.includes("BEAM_END")) ||
          ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "end");
        const isCurrentMidJoint =
          (selectedState && selectedState.includes("BEAM_MIDDLE")) ||
          ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "middle");

        if (!isCurrentEndJoint && !isCurrentMidJoint) {
          handleConfigChange(
            "offsetX",
            Math.round(newDestX - originScreenX + cx),
          );
        }
        handleConfigChange(
          "offsetY",
          Math.round(newDestY - originScreenY + cy),
        );
      } else {
        const centerScreenX = originScreenX + (config?.offsetX || 0);
        const centerScreenY = originScreenY + (config?.offsetY || 0);
        handleConfigChange("centerX", Math.round(centerScreenX - newDestX));
        handleConfigChange("centerY", Math.round(centerScreenY - newDestY));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDraggingPoint("NONE");
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!isDraggingLeftPanel) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      // minimum 200px, max 800px or 50% of window width
      const minW = 200;
      const maxW = Math.min(800, window.innerWidth * 0.8);
      const newWidth = Math.max(minW, Math.min(maxW, e.clientX));
      setLeftPanelWidth(newWidth);
    };

    const handleGlobalPointerUp = () => {
      setIsDraggingLeftPanel(false);
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [isDraggingLeftPanel]);

  useEffect(() => {
    if (
      activeTab === "TRANSFORM" &&
      selectedState &&
      selectedState.includes("BEAM_")
    ) {
      const contextKey = getAttackContextKey(selectedState, selectedChar);
      if (
        contextKey &&
        contextKey !== selectedState &&
        selectedChar.spriteConfig?.animations[contextKey]
      ) {
        setSelectedState(contextKey);
        return;
      }
    }

    // 1. Sync character context
    if (selectedChar.spriteConfig?.animations[selectedState]) {
      const originalConfig = selectedChar.spriteConfig.animations[selectedState];
      setCharacterAnimationContext({
        ...originalConfig!,
        offsetX: originalConfig!.offsetX !== undefined ? originalConfig!.offsetX : 0,
        offsetY: originalConfig!.offsetY !== undefined ? originalConfig!.offsetY : 0,
        scale: originalConfig!.scale !== undefined ? originalConfig!.scale : selectedChar.spriteConfig.defaultScale,
        speed: originalConfig!.speed || 5,
      });
    }

    // 2. Sync Beam context
    if (selectedBeamFamilyId && localBeamDatabase[selectedBeamFamilyId]) {
      const family = localBeamDatabase[selectedBeamFamilyId];
      const partKey = selectedBeamPart as "start" | "middle" | "end";
      if (family && family[partKey]) {
        const charOverrides = selectedChar.beamOverrides?.[selectedBeamFamilyId]?.[partKey];
        const originalConfig = {
          ...family[partKey],
          ...charOverrides,
        };
        setBeamAnimationContext({
          ...originalConfig,
          offsetX: originalConfig.offsetX !== undefined ? originalConfig.offsetX : 0,
          offsetY: originalConfig.offsetY !== undefined ? originalConfig.offsetY : 0,
        });
      }
    }

    // 3. Sync Projectile context
    if (selectedProjectileFamilyId && localProjectileDatabase[selectedProjectileFamilyId]) {
      const family = localProjectileDatabase[selectedProjectileFamilyId];
      const partKey = "middle";
      if (family && family[partKey]) {
        const charProjOverrides =
          (selectedChar as any).projectileOverrides?.[selectedProjectileFamilyId]?.[partKey] ||
          (selectedChar as any).beamOverrides?.[selectedProjectileFamilyId]?.[partKey];
        const originalConfig = {
          ...family[partKey],
          ...charProjOverrides,
        };
        setProjectileAnimationContext({
          ...originalConfig,
          offsetX: originalConfig.offsetX !== undefined ? originalConfig.offsetX : 0,
          offsetY: originalConfig.offsetY !== undefined ? originalConfig.offsetY : 0,
        });
      }
    }

    // 4. Sync Genkidama context (if activeTab is GENKIDAMA)
    if (selectedProjectileFamilyId && localProjectileDatabase[selectedProjectileFamilyId]) {
      const family = localProjectileDatabase[selectedProjectileFamilyId];
      const partKey = "middle";
      if (family && family[partKey]) {
        const charProjOverrides =
          (selectedChar as any).projectileOverrides?.[selectedProjectileFamilyId]?.[partKey] ||
          (selectedChar as any).beamOverrides?.[selectedProjectileFamilyId]?.[partKey];
        const originalConfig = {
          ...family[partKey],
          ...charProjOverrides,
        };
        setGenkidamaAnimationContext({
          ...originalConfig,
          offsetX: originalConfig.offsetX !== undefined ? originalConfig.offsetX : 0,
          offsetY: originalConfig.offsetY !== undefined ? originalConfig.offsetY : 0,
        });
      }
    }

    // 5. Sync Energy Closure context
    if (selectedProjectileFamilyId && localProjectileDatabase[selectedProjectileFamilyId]) {
      const family = localProjectileDatabase[selectedProjectileFamilyId];
      const partKey = "middle";
      if (family && family[partKey]) {
        const charProjOverrides =
          (selectedChar as any).projectileOverrides?.[selectedProjectileFamilyId]?.[partKey] ||
          (selectedChar as any).beamOverrides?.[selectedProjectileFamilyId]?.[partKey];
        const originalConfig = {
          ...family[partKey],
          ...charProjOverrides,
        };
        setEnergyClosureAnimationContext({
          ...originalConfig,
          offsetX: originalConfig.offsetX !== undefined ? originalConfig.offsetX : 0,
          offsetY: originalConfig.offsetY !== undefined ? originalConfig.offsetY : 0,
        });
      }
    }

    // 6. Sync Aura context
    if (selectedAuraKey && localAuraDatabase[selectedAuraKey]) {
      const currentAura = localAuraDatabase[selectedAuraKey];
      setAuraAnimationContext({
        frames: 1,
        speed: 5,
        offsetX: currentAura.auraOffsetX !== undefined ? currentAura.auraOffsetX : 0,
        offsetY: currentAura.auraOffsetY !== undefined ? currentAura.auraOffsetY : 0,
      });
    }

  }, [
    selectedState,
    selectedChar.id,
    activeTab,
    selectedBeamFamilyId,
    selectedProjectileFamilyId,
    selectedBeamPart,
    selectedAuraKey,
  ]);

  useEffect(() => {
    let requestId: number;

    const tick = (time: number) => {
      // Sync canvas size to container size
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (
          canvasRef.current.width !== clientWidth ||
          canvasRef.current.height !== clientHeight
        ) {
          canvasRef.current.width = clientWidth;
          canvasRef.current.height = clientHeight;
        }
      }

      if (isPlaying && config) {
        const speed = config.speed || 5;
        const frameDuration = (1000 / 60) * speed;

        if (time - lastTime >= frameDuration) {
          setFrameIndex((prev) => {
            const totalFrames = config.frames || 1;
            if (
              config.freezeFrame !== undefined &&
              prev === config.freezeFrame
            ) {
              return prev;
            }
            if (config.loop === false && prev >= totalFrames - 1) return prev;
            return (prev + 1) % totalFrames;
          });
          setLastTime(time);
        }

        // Tick logic for character attack context playing in loops
        const isEditingBeamTick =
          isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));
        const attackContextKey = getAttackContextKey(
          selectedState,
          selectedChar,
        );
        const hasAttackContext = isEditingBeamTick && attackContextKey;
        const activeCat = getActiveContextCategory(activeTab);
        const characterConfig =
          (hasAttackContext
            ? selectedChar.spriteConfig?.animations?.[attackContextKey!]
            : activeCat !== "CHARACTER"
              ? selectedChar.spriteConfig?.animations?.[selectedState] || selectedChar.spriteConfig?.animations?.["IDLE"]
              : config) || {};
        const charSpeed = characterConfig.speed || 5;
        const charFrameDuration = (1000 / 60) * charSpeed;

        if (time - lastCharTime >= charFrameDuration) {
          setCharFrameIndex((prev) => {
            const totalFrames = characterConfig.frames || 1;
            if (characterConfig.loop === false && prev >= totalFrames - 1)
              return prev;
            return (prev + 1) % totalFrames;
          });
          setLastCharTime(time);
        }
      }

      draw();
      requestId = requestAnimationFrame(tick);
    };

    requestId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestId);
  }, [
    isPlaying,
    config,
    frameIndex,
    charFrameIndex,
    lastTime,
    lastCharTime,
    selectedChar,
    selectedState,
    activeTab,
    selectedBeamFamilyId,
    selectedBeamPart,
    beamPreviewAnimation,
    beamPreviewCharacterId,
    pan,
    zoom,
    showOnionSkin,
    showHitboxes,
    showGrid,
    showCustomOnionSkin,
    customOnionConfig,
    localBeamDatabase,
    selectedAuraKey,
    localAuraDatabase,
  ]);

  // Sequenced Animation Playback Controller
  useEffect(() => {
    if (activeSequence && activeSequence.length > 0 && config && isPlaying) {
      const totalFrames = config.frames || 1;
      if (frameIndex >= totalFrames - 1) {
        const transitionTimer = setTimeout(
          () => {
            const nextIndex = activeSequenceIndex + 1;
            if (nextIndex < activeSequence.length) {
              setActiveSequenceIndex(nextIndex);
              setSelectedState(activeSequence[nextIndex]);
              setFrameIndex(0);
            } else {
              if (isSequenceLooping) {
                setActiveSequenceIndex(0);
                setSelectedState(activeSequence[0]);
                setFrameIndex(0);
              } else {
                setActiveSequence(null);
              }
            }
          },
          (1000 / 60) * (config.speed || 5),
        );
        return () => clearTimeout(transitionTimer);
      }
    }
  }, [
    frameIndex,
    activeSequence,
    activeSequenceIndex,
    config,
    isSequenceLooping,
    isPlaying,
  ]);

  useEffect(() => {
    if (!config || !isPlaying) return;

    // SFX Play
    if (config.sfxName && config.sfxFrame === frameIndex) {
      try {
        AudioManager.getInstance().playSFX(config.sfxName as any);
      } catch (e) {
        // If sound missing
        console.warn("Sound not found for preview:", config.sfxName);
      }
    }
  }, [frameIndex, config, isPlaying]);

  // Keyboard navigation, zoom, and micro-adjustments for fine editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in elements
      if (document.activeElement) {
        const tagName = document.activeElement.tagName;
        if (
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT"
        ) {
          return;
        }
      }

      const dx =
        e.key === "ArrowLeft" || e.key === "a" || e.key === "A"
          ? -1
          : e.key === "ArrowRight" || e.key === "d" || e.key === "D"
            ? 1
            : 0;
      const dy =
        e.key === "ArrowUp" || e.key === "w" || e.key === "W"
          ? -1
          : e.key === "ArrowDown" || e.key === "s" || e.key === "S"
            ? 1
            : 0;

      if (dx !== 0 || dy !== 0) {
        // If holding Alt, Ctrl, or Meta, micro-adjust configuration offsets (offsetX/offsetY)
        if (e.altKey || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (config) {
            const currentX = config.offsetX !== undefined ? config.offsetX : 0;
            const currentY = config.offsetY !== undefined ? config.offsetY : 0;
            const step = e.shiftKey ? 10 : 1;

            const isEditingBeam =
              isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));
            const isCurrentMidJoint =
              (selectedState && selectedState.includes("BEAM_MIDDLE")) ||
              ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "middle");
            const isCurrentEndJoint =
              (selectedState && selectedState.includes("BEAM_END")) ||
              ((isBeamOrProjTab || isEditingBeam) && selectedBeamPart === "end");

            const canEditX = !(isEditingBeam && (isCurrentMidJoint || isCurrentEndJoint));

            if (dx !== 0 && canEditX) {
              handleConfigChange("offsetX", Math.round(currentX + dx * step));
            }
            if (dy !== 0) {
              handleConfigChange("offsetY", Math.round(currentY + dy * step));
            }
          }
        } else {
          // Normal Keys without modifiers: Pan/move current canvas viewport
          e.preventDefault();
          const speed = e.shiftKey ? 45 : 15;
          setPan((p) => ({
            x: p.x - dx * speed,
            y: p.y - dy * speed,
          }));
        }
      }

      // Zoom Hotkeys: "+" or "=" to Zoom In, "-" to Zoom Out, "0" to Reset pan & zoom
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(6, z + 0.1));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.1, z - 0.1));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [config, pan, zoom]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !config) return;

    const getOffscreen = (w: number, h: number) => {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const c = offscreenCanvasRef.current;
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      } else {
        const tempCtx = c.getContext("2d");
        if (tempCtx) {
          tempCtx.imageSmoothingEnabled = false;
          tempCtx.setTransform(1, 0, 0, 1, 0, 0);
          tempCtx.clearRect(0, 0, w, h);
        }
      }
      return { canvas: c, ctx: c.getContext("2d")! };
    };

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (config.mugenEffect && config.superDarkness) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw helper grid
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-centerX, -centerY);

    ctx.translate(pan.x, pan.y);

    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;

      const w = canvas.width / zoom;
      const h = canvas.height / zoom;
      const vLeft = -pan.x - (w - canvas.width) / 2;
      const vRight = vLeft + w;
      const vTop = -pan.y - (h - canvas.height) / 2;
      const vBottom = vTop + h;

      const gridStartX = Math.floor(vLeft / 50) * 50;
      const gridStartY = Math.floor(vTop / 50) * 50;

      for (let i = gridStartX; i < vRight + 50; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, vTop);
        ctx.lineTo(i, vBottom);
        ctx.stroke();
      }
      for (let i = gridStartY; i < vBottom + 50; i += 50) {
        ctx.beginPath();
        ctx.moveTo(vLeft, i);
        ctx.lineTo(vRight, i);
        ctx.stroke();
      }

      // Draw crosshair origin of the center (without pan offset)
      ctx.strokeStyle = "#ef4444";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, vTop);
      ctx.lineTo(centerX, vBottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vLeft, centerY);
      ctx.lineTo(vRight, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();

    // Apply Screen Shake
    if (config.shakeFrames?.includes(frameIndex)) {
      const intensity = config.shakeIntensity || 5;
      const sx = (Math.random() - 0.5) * intensity * 2;
      const sy = (Math.random() - 0.5) * intensity * 2;
      ctx.translate(sx, sy);
    }

    // Emulate Game Camera Zoom and Rotation
    if (
      config.zoomType ||
      config.cameraRotation !== undefined ||
      config.fullScreen
    ) {
      let currentZoom = 1;
      let zoomVal = config.zoomAmount !== undefined ? config.zoomAmount : 1.5;

      let focusX = centerX;
      let focusY = centerY;

      if (config.fullScreen) {
        // Automatically calculate zoom to completely fill the logical screen bounds (1280x720)
        let sScale = config.scale || 1;
        let cWidth = config.frameWidth || 100;
        let cHeight = config.frameHeight || 100;

        // Wait, if it's fullScreen, it behaves exactly like GameEngine.ts
        const zX = 1280 / Math.max(1, cWidth * sScale);
        const zY = 720 / Math.max(1, cHeight * sScale);
        zoomVal = Math.max(zX, zY) + 0.2;

        const ox = config.originX !== undefined ? config.originX : PLAYER_WIDTH / 2;
        const oy = config.originY !== undefined ? config.originY : (config.fullScreen ? PLAYER_HEIGHT / 2 : PLAYER_HEIGHT);

        const cx = config.centerX !== undefined ? config.centerX : (cWidth * sScale) / 2;
        const cy = config.centerY !== undefined ? config.centerY : (config.fullScreen ? (cHeight * sScale) / 2 : (cHeight * sScale));

        const playerX = centerX - PLAYER_WIDTH / 2;
        const playerY = centerY - PLAYER_HEIGHT / 2;

        focusX = playerX + ox - cx + (config.offsetX || 0) + (cWidth * sScale) / 2;
        focusY = playerY + oy - cy + (config.offsetY || 0) + (cHeight * sScale) / 2;
      } else if (config.zoomType && config.zoomType !== "DEFAULT_CENTER") {
        focusX =
          config.cameraFocusX !== undefined
            ? centerX - PLAYER_WIDTH / 2 + config.cameraFocusX
            : centerX;
        focusY =
          config.cameraFocusY !== undefined
            ? centerY - PLAYER_HEIGHT / 2 + config.cameraFocusY
            : centerY;
      } else if (config.zoomType === "DEFAULT_CENTER") {
        const oppRawX =
          config.opponentPosX !== undefined
            ? config.opponentPosX
            : 150 * Math.sign(config.offsetX || 1);
        const oppX =
          centerX -
          PLAYER_WIDTH / 2 +
          oppRawX +
          (PLAYER_WIDTH * (config.opponentScale || 1)) / 2;
        focusX = (centerX + oppX) / 2;
        const oppY =
          centerY -
          PLAYER_HEIGHT / 2 +
          (config.opponentPosY || 0) +
          (PLAYER_HEIGHT * (config.opponentScale || 1)) / 2;
        focusY = (centerY + oppY) / 2;

        // Dynamic Zoom Calculation
        const distX = Math.abs(centerX - oppX);
        const targetZ = 1280 / (distX + 640); // 640 CAM_PADDING_X in game
        zoomVal = Math.max(1, Math.min(2.5, targetZ));
      } else if (!config.zoomType) {
        // If there's rotation but no zoom type specified, use cameraFocusX/Y if defined
        focusX =
          config.cameraFocusX !== undefined
            ? centerX - PLAYER_WIDTH / 2 + config.cameraFocusX
            : centerX;
        focusY =
          config.cameraFocusY !== undefined
            ? centerY - PLAYER_HEIGHT / 2 + config.cameraFocusY
            : centerY;
      }

      if (config.zoomType || config.fullScreen) {
        const totalFrames = config.frames || 1;
        const progress = totalFrames > 1 ? frameIndex / (totalFrames - 1) : 1;

        // Ease In Out Sine for smooth, fluid motion
        const easedProgress = Math.min(
          1,
          Math.max(0, -(Math.cos(Math.PI * progress) - 1) / 2),
        );

        if (config.fullScreen) {
          // Fullscreen ignores specific zoom animations in engine, snaps immediately to fill.
          // In GameEngine.ts, it checks `if (currentAnim.zoomType || currentAnim.fullScreen)`.
          // And if it's fullScreen, the zoomVal gets set, and applies immediately just like IMMEDIATE unless there's also a zoom animation (e.g. ZOOM_IN + fullScreen is supported).
          if (
            !config.zoomType ||
            config.zoomType === "IMMEDIATE" ||
            config.zoomType === "DEFAULT_CENTER"
          ) {
            currentZoom = zoomVal;
          } else if (config.zoomType === "ZOOM_IN") {
            currentZoom = 1 + (zoomVal - 1) * easedProgress;
          } else if (config.zoomType === "ZOOM_OUT") {
            currentZoom = zoomVal + (1 - zoomVal) * easedProgress;
          } else if (config.zoomType === "ZOOM_IN_OUT") {
            const pulseProgress = Math.sin(progress * Math.PI); // 0 to 1 to 0
            currentZoom = 1 + (zoomVal - 1) * pulseProgress;
          } else if (config.zoomType === "ZOOM_PULSE") {
            const pulseProgress = Math.abs(Math.sin(progress * Math.PI * 4)); // 4 loops
            currentZoom = 1 + (zoomVal - 1) * pulseProgress;
          } else if (config.zoomType === "ZOOM_BOUNCE") {
            const n1 = 7.5625;
            const d1 = 2.75;
            let bounceProg = progress;
            if (bounceProg < 1 / d1) {
              bounceProg = n1 * bounceProg * bounceProg;
            } else if (bounceProg < 2 / d1) {
              bounceProg = n1 * (bounceProg -= 1.5 / d1) * bounceProg + 0.75;
            } else if (bounceProg < 2.5 / d1) {
              bounceProg = n1 * (bounceProg -= 2.25 / d1) * bounceProg + 0.9375;
            } else {
              bounceProg =
                n1 * (bounceProg -= 2.625 / d1) * bounceProg + 0.984375;
            }
            currentZoom = 1 + (zoomVal - 1) * bounceProg;
          } else if (config.zoomType === "ZOOM_DRAMATIC") {
            const initialDramaZoom = zoomVal * 1.2;
            currentZoom = initialDramaZoom + progress * 0.2;
          } else if (config.zoomType === "ZOOM_SHAKE") {
            const shakeMod =
              frameIndex % 3 === 0 ? 1 : frameIndex % 3 === 1 ? 0.95 : 1.05;
            currentZoom =
              (1 + (zoomVal - 1) * Math.min(1, progress * 3)) * shakeMod;
          } else if (config.zoomType === "ZOOM_IMPACT") {
            const snapProgress = Math.min(1, progress * 4);
            currentZoom = 1 + (zoomVal * 1.5 - 1) * snapProgress;
            if (progress > 0.25) {
              const decayProgress = (progress - 0.25) / 0.75;
              currentZoom -= (currentZoom - zoomVal) * decayProgress;
            }
          }
        } else {
          // Existed before
          if (
            config.zoomType === "IMMEDIATE" ||
            config.zoomType === "DEFAULT_CENTER"
          ) {
            currentZoom = zoomVal;
          } else if (config.zoomType === "ZOOM_IN") {
            currentZoom = 1 + (zoomVal - 1) * easedProgress;
          } else if (config.zoomType === "ZOOM_OUT") {
            currentZoom = zoomVal + (1 - zoomVal) * easedProgress;
          } else if (config.zoomType === "ZOOM_IN_OUT") {
            const pulseProgress = Math.sin(progress * Math.PI); // 0 to 1 to 0
            currentZoom = 1 + (zoomVal - 1) * pulseProgress;
          } else if (config.zoomType === "ZOOM_PULSE") {
            const pulseProgress = Math.abs(Math.sin(progress * Math.PI * 4)); // 4 loops
            currentZoom = 1 + (zoomVal - 1) * pulseProgress;
          } else if (config.zoomType === "ZOOM_BOUNCE") {
            // Ease out bounce
            const n1 = 7.5625;
            const d1 = 2.75;
            let bounceProg = progress;
            if (bounceProg < 1 / d1) {
              bounceProg = n1 * bounceProg * bounceProg;
            } else if (bounceProg < 2 / d1) {
              bounceProg = n1 * (bounceProg -= 1.5 / d1) * bounceProg + 0.75;
            } else if (bounceProg < 2.5 / d1) {
              bounceProg = n1 * (bounceProg -= 2.25 / d1) * bounceProg + 0.9375;
            } else {
              bounceProg =
                n1 * (bounceProg -= 2.625 / d1) * bounceProg + 0.984375;
            }
            currentZoom = 1 + (zoomVal - 1) * bounceProg;
          } else if (config.zoomType === "ZOOM_DRAMATIC") {
            const initialDramaZoom = zoomVal * 1.2;
            currentZoom = initialDramaZoom + progress * 0.2;
          } else if (config.zoomType === "ZOOM_SHAKE") {
            const shakeMod =
              frameIndex % 3 === 0 ? 1 : frameIndex % 3 === 1 ? 0.95 : 1.05;
            currentZoom =
              (1 + (zoomVal - 1) * Math.min(1, progress * 3)) * shakeMod;
          } else if (config.zoomType === "ZOOM_IMPACT") {
            const snapProgress = Math.min(1, progress * 4);
            currentZoom = 1 + (zoomVal * 1.5 - 1) * snapProgress;
            if (progress > 0.25) {
              const decayProgress = (progress - 0.25) / 0.75;
              currentZoom -= (currentZoom - zoomVal) * decayProgress;
            }
          }
        }
      }

      ctx.translate(focusX, focusY);
      ctx.scale(currentZoom, currentZoom);
      if (config.cameraRotation !== undefined) {
        ctx.rotate((config.cameraRotation * Math.PI) / 180);
      }
      ctx.translate(-focusX, -focusY);
    }

    const isEditingBeam =
      isBeamOrProjTab || (selectedState && selectedState.includes("BEAM_"));

    // Determine the character to draw behind the beam
    const previewCharBase =
      isEditingBeam && beamPreviewCharacterId
        ? BASE_CHARACTERS.find((c) => c.id === beamPreviewCharacterId) ||
          selectedChar
        : selectedChar;

    const attackContextKey = getAttackContextKey(
      selectedState,
      previewCharBase,
    );
    const hasAttackContext = isEditingBeam && attackContextKey;

    const characterStateKey = hasAttackContext
      ? attackContextKey
      : isEditingBeam
        ? previewCharBase.id.includes("BEAM_CATALOG")
          ? "HIDDEN_STATE"
          : "IDLE"
        : selectedState;
    const activeCat = getActiveContextCategory(activeTab);
    const characterConfig =
      (hasAttackContext
        ? previewCharBase.spriteConfig?.animations?.[attackContextKey!]
        : (isEditingBeam || (activeCat !== "CHARACTER" && activeCat !== "EFFECT" && activeCat !== "AURA")) && !previewCharBase.id.includes("BEAM_CATALOG")
          ? previewCharBase.spriteConfig?.animations?.[selectedState] || previewCharBase.spriteConfig?.animations?.["IDLE"]
          : config) || {};

    if (!isEditingBeam && config.trailEffect && activeTab !== "VFX") {
      ctx.globalAlpha = 0.3;
      // Draw previous frame slightly offset
      ctx.translate(-30, 0);
      animManager.drawPlayer(
        ctx,
        {
          ...selectedChar,
          spriteConfig: {
            ...selectedChar.spriteConfig!,
            animations: { [characterStateKey!]: characterConfig },
          },
        },
        characterStateKey as PlayerState,
        centerX - PLAYER_WIDTH / 2,
        centerY - PLAYER_HEIGHT / 2,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        true,
        Math.max(0, frameIndex - 1),
        false, // isStunned
      );
      ctx.translate(30, 0);
      ctx.globalAlpha = 1.0;
    }

    if (showOnionSkin && frameIndex > 0 && !isEditingBeam && activeTab !== "VFX") {
      ctx.globalAlpha = 0.4;
      // Draw previous frame onion skin without offset
      animManager.drawPlayer(
        ctx,
        {
          ...selectedChar,
          spriteConfig: {
            ...selectedChar.spriteConfig!,
            animations: { [characterStateKey!]: characterConfig },
          },
        },
        characterStateKey as PlayerState,
        centerX - PLAYER_WIDTH / 2,
        centerY - PLAYER_HEIGHT / 2,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        true,
        frameIndex - 1,
        false, // isStunned
      );
      ctx.globalAlpha = 1.0;
    }

    // Draw Custom Onion Skin (BACK)
    if (showCustomOnionSkin && customOnionConfig.layer === "BACK" && activeTab !== "VFX") {
      const refChar = BASE_CHARACTERS.find(
        (c) => c.id === customOnionConfig.characterId,
      );
      if (refChar) {
        ctx.save();
        ctx.globalAlpha = customOnionConfig.opacity;
        animManager.drawPlayer(
          ctx,
          refChar,
          customOnionConfig.animState as PlayerState,
          centerX - PLAYER_WIDTH / 2,
          centerY - PLAYER_HEIGHT / 2,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          true,
          customOnionConfig.frameIndex,
          false,
        );
        ctx.restore();
      }
    }

          // --- DRAW SCENE OBJECTS (BACK LAYER) ---
          if (config.sceneObjects && config.sceneObjects.length > 0) {
            config.sceneObjects
              .filter((o) => o.layer === "BACK")
              .forEach((obj) => {
                ctx.save();
                const objX = centerX - PLAYER_WIDTH / 2 + obj.x;
                const objY = centerY - PLAYER_HEIGHT / 2 + obj.y;
      
                ctx.translate(objX + 20 * obj.scale, objY + 20 * obj.scale);
                if (obj.rotation) ctx.rotate((obj.rotation * Math.PI) / 180);
                ctx.translate(-(objX + 20 * obj.scale), -(objY + 20 * obj.scale));
      
                ctx.globalAlpha = obj.opacity ?? 1;

                if (obj.configKey) {
                    const vfx = localEffectDatabase[obj.configKey];
                    if (vfx) {
                      const filters = [];
                      if (vfx.effectHueRotate) filters.push(`hue-rotate(${vfx.effectHueRotate}deg)`);
                      if (vfx.effectSaturate !== undefined) filters.push(`saturate(${vfx.effectSaturate})`);
                      if (vfx.effectBrightness !== undefined) filters.push(`brightness(${vfx.effectBrightness})`);
                      if (vfx.effectContrast !== undefined) filters.push(`contrast(${vfx.effectContrast})`);
                      if (filters.length > 0) ctx.filter = filters.join(' ');
                      if (vfx.effectOpacity !== undefined) ctx.globalAlpha *= vfx.effectOpacity;
                    }
                }
      
                if (obj.imageUrl) {
            const img = obj.isGif
              ? animManager.getGifFrame(obj.imageUrl, frameIndex)
              : animManager.loadTexture(obj.imageUrl);

            if (img && img.width) {
              const w = img.width * obj.scale;
              const h = img.height * obj.scale;
              const dx = objX + 20 * obj.scale - w / 2;
              const dy = objY + 20 * obj.scale - h / 2;
              ctx.drawImage(img as CanvasImageSource, dx, dy, w, h);
            } else {
              ctx.fillStyle =
                obj.type === "VFX"
                  ? "rgba(255, 255, 0, 0.4)"
                  : "rgba(100, 100, 100, 0.6)";
              ctx.fillRect(objX, objY, 40 * obj.scale, 40 * obj.scale);
            }
          } else {
            ctx.fillStyle =
              obj.type === "VFX"
                ? "rgba(255, 255, 0, 0.4)"
                : "rgba(100, 100, 100, 0.6)";
            ctx.fillRect(objX, objY, 40 * obj.scale, 40 * obj.scale);
            ctx.strokeStyle = "white";
            ctx.strokeRect(objX, objY, 40 * obj.scale, 40 * obj.scale);
            ctx.fillStyle = "white";
            ctx.font = "8px monospace";
            ctx.fillText(obj.id, objX, objY - 5);
          }
          ctx.restore();
        });
    }

    // --- DRAW REFERENCE IMAGE (BACK) ---
    if (referenceImg.show && referenceImg.url && referenceImg.opacity > 0) {
      const refImg = animManager.loadTexture(referenceImg.url);
      if (refImg.complete && refImg.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = referenceImg.opacity;
        const rw = refImg.width * referenceImg.scale;
        const rh = refImg.height * referenceImg.scale;
        // Center it by default, apply offsets
        const rx = centerX - rw / 2 + referenceImg.offsetX;
        const ry = centerY - rh / 2 + referenceImg.offsetY;
        ctx.drawImage(refImg as CanvasImageSource, rx, ry, rw, rh);
        ctx.restore();
      }
    }

    const previewCharWithAnim = {
      ...previewCharBase,
      spriteConfig: {
        ...previewCharBase.spriteConfig!,
        animations: { [characterStateKey!]: characterConfig },
      },
    };

    // Prepare Ki Blast / Beam origin and animations for the background drawing
    let hasAnyKiOrigin =
      characterConfig.kiOriginX !== undefined ||
      config.kiOriginX !== undefined ||
      selectedChar.spriteConfig?.kiOriginX !== undefined;
    if (isEditingBeam) hasAnyKiOrigin = true; // Always draw beam preview if editing beam

    let helperKiX = 76;
    let helperKiY = 125;
    if (hasAnyKiOrigin) {
      helperKiX =
        characterConfig?.kiOriginX ?? selectedChar.spriteConfig?.kiOriginX ?? 0;
      helperKiY =
        characterConfig?.kiOriginY ?? selectedChar.spriteConfig?.kiOriginY ?? 0;

      if (isEditingBeam) {
        let startKey = selectedState
          .replace("MIDDLE", "START")
          .replace("END", "START");
        let midKey = selectedState
          .replace("START", "MIDDLE")
          .replace("END", "MIDDLE");
        const startAnim = selectedChar.spriteConfig?.animations?.[startKey];
        const midAnim = selectedChar.spriteConfig?.animations?.[midKey];

        const isPartTabActive = isBeamOrProjTab;
        const explicitStartKiX = isPartTabActive
          ? undefined
          : selectedState === startKey
            ? config?.kiOriginX
            : startAnim?.kiOriginX;
        const explicitStartKiY = isPartTabActive
          ? undefined
          : selectedState === startKey
            ? config?.kiOriginY
            : startAnim?.kiOriginY;
        const explicitMidKiX = isPartTabActive
          ? undefined
          : selectedState === midKey
            ? config?.kiOriginX
            : midAnim?.kiOriginX;
        const explicitMidKiY = isPartTabActive
          ? undefined
          : selectedState === midKey
            ? config?.kiOriginY
            : midAnim?.kiOriginY;

        helperKiX =
          explicitStartKiX !== undefined
            ? explicitStartKiX
            : explicitMidKiX !== undefined
              ? explicitMidKiX
              : (characterConfig.kiOriginX ??
                selectedChar.spriteConfig?.kiOriginX ??
                76);
        helperKiY =
          explicitStartKiY !== undefined
            ? explicitStartKiY
            : explicitMidKiY !== undefined
              ? explicitMidKiY
              : (characterConfig.kiOriginY ??
                selectedChar.spriteConfig?.kiOriginY ??
                125);
      } else if (
        config?.kiOriginX !== undefined ||
        selectedChar.spriteConfig?.kiOriginX !== undefined
      ) {
        helperKiX =
          config?.kiOriginX ?? selectedChar.spriteConfig?.kiOriginX ?? 76;
        helperKiY =
          config?.kiOriginY ?? selectedChar.spriteConfig?.kiOriginY ?? 125;
      }
    }

    const kiX = centerX - PLAYER_WIDTH / 2 + helperKiX;
    const kiY = centerY - PLAYER_HEIGHT / 2 + helperKiY;

    // --- DRAW BEAM EDIT HELPER (BEHIND CHARACTER) ---
    if (hasAnyKiOrigin && (isBeamOrProjTab || activeTab === "BEAMS_MANAGER")) {
      const isFacingRight = true;

      let startAnim: any = null;
      let midAnim: any = null;
      let endAnim: any = null;

      if (isBeamOrProjTab) {
        const isBeamTab = activeTab === "BEAM";
        const projFamilyId = selectedProjectileFamilyId || selectedBeamFamilyId;
        const family = isBeamTab
          ? localBeamDatabase[selectedBeamFamilyId]
          : localProjectileDatabase[projFamilyId] ||
            localBeamDatabase[selectedBeamFamilyId];

        if (family) {
          const charOverrides = isBeamTab
            ? (selectedChar.beamOverrides?.[selectedBeamFamilyId] ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.beamConfig)
            : ((selectedChar as any).projectileOverrides?.[projFamilyId] ??
              (selectedChar as any).beamOverrides?.[projFamilyId] ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.projectileConfig ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.beamConfig);

          const mergedStart = family.start
            ? { ...family.start, ...(charOverrides?.start as any) }
            : undefined;
          const mergedMiddle = family.middle
            ? { ...family.middle, ...(charOverrides?.middle as any) }
            : family.middle;
          const mergedEnd = family.end
            ? { ...family.end, ...(charOverrides?.end as any) }
            : undefined;

          startAnim =
            selectedBeamPart === "start"
              ? {
                  ...mergedStart,
                  ...config,
                  imageUrl: config?.imageUrl || mergedStart?.imageUrl,
                }
              : mergedStart;
          midAnim =
            selectedBeamPart === "middle"
              ? {
                  ...mergedMiddle,
                  ...config,
                  imageUrl: config?.imageUrl || mergedMiddle?.imageUrl,
                }
              : mergedMiddle;
          endAnim =
            selectedBeamPart === "end"
              ? {
                  ...mergedEnd,
                  ...config,
                  imageUrl: config?.imageUrl || mergedEnd?.imageUrl,
                }
              : mergedEnd;
        }
      } else {
        // Check if selected state creates a beam family or projectile
        const activeAnimConfig =
          selectedChar.spriteConfig?.animations?.[selectedState];
        const beamFamilyId =
          activeAnimConfig?.createsBeam || activeAnimConfig?.projectileId;
        if (beamFamilyId && localBeamDatabase[beamFamilyId]) {
          const family = localBeamDatabase[beamFamilyId];
          const charOverrides =
            selectedChar.beamOverrides?.[beamFamilyId] ??
            activeAnimConfig?.beamConfig;

          startAnim = family.start
            ? { ...family.start, ...(charOverrides?.start as any) }
            : undefined;
          midAnim = family.middle
            ? { ...family.middle, ...(charOverrides?.middle as any) }
            : family.middle;
          endAnim = family.end
            ? { ...family.end, ...(charOverrides?.end as any) }
            : undefined;
        } else if (beamFamilyId && localProjectileDatabase[beamFamilyId]) {
          const family = localProjectileDatabase[beamFamilyId];
          const charOverrides =
            (selectedChar as any).projectileOverrides?.[beamFamilyId] ??
            (selectedChar as any).beamOverrides?.[beamFamilyId] ??
            activeAnimConfig?.projectileConfig ??
            activeAnimConfig?.beamConfig;

          startAnim = undefined;
          midAnim = family.middle
            ? { ...family.middle, ...(charOverrides?.middle as any) }
            : family.middle;
          endAnim = undefined;
        } else {
          let startKey = selectedState
            .replace("MIDDLE", "START")
            .replace("END", "START");
          let midKey = selectedState
            .replace("START", "MIDDLE")
            .replace("END", "MIDDLE");
          let endKey = selectedState
            .replace("START", "END")
            .replace("MIDDLE", "END");

          const baseStartAnim =
            selectedChar.spriteConfig?.animations?.[startKey];
          const baseMidAnim = selectedChar.spriteConfig?.animations?.[midKey];
          const baseEndAnim = selectedChar.spriteConfig?.animations?.[endKey];

          startAnim =
            selectedState === startKey
              ? {
                  ...baseStartAnim,
                  ...config,
                  imageUrl: config?.imageUrl || baseStartAnim?.imageUrl,
                }
              : baseStartAnim;
          midAnim =
            selectedState === midKey
              ? {
                  ...baseMidAnim,
                  ...config,
                  imageUrl: config?.imageUrl || baseMidAnim?.imageUrl,
                }
              : baseMidAnim;
          endAnim =
            selectedState === endKey
              ? {
                  ...baseEndAnim,
                  ...config,
                  imageUrl: config?.imageUrl || baseEndAnim?.imageUrl,
                }
              : baseEndAnim;
        }
      }

      const isProjectile = (() => {
        if (activeTab === "BEAM") return false;
        if (
          activeTab === "KI_BLAST" ||
          activeTab === "GENKIDAMA" ||
          activeTab === "fechosenergia" ||
          activeTab === "PROJECTILE"
        )
          return true;
        const anim = selectedState
          ? selectedChar.spriteConfig?.animations?.[selectedState]
          : undefined;
        const beamId = anim?.createsBeam;
        if (beamId) {
          return (
            beamId.includes("KI_BLAST") ||
            beamId.includes("PROJECTILE") ||
            beamId.includes("PROJETIL") ||
            beamId.includes("GENKIDAMA") ||
            beamId.includes("FECHO")
          );
        }
        return (
          (selectedState && selectedState.includes("KI_BLAST")) ||
          (selectedState && selectedState.includes("GENKIDAMA")) ||
          (selectedState && selectedState.includes("FECHO"))
        );
      })();

      if (startAnim || midAnim || endAnim) {
        ctx.save();
        const pWidth = 2000;
        const bStartY = kiY;

        // Retrieve active family styling parameters
        const beamFamilyId =
          selectedBeamFamilyId ||
          selectedChar.spriteConfig?.animations?.[selectedState]?.createsBeam;

        let family: any = undefined;
        if (isProjectile) {
          const projFamilyId =
            activeTab === "KI_BLAST" ||
            activeTab === "GENKIDAMA" ||
            activeTab === "fechosenergia"
              ? selectedProjectileFamilyId
              : beamFamilyId || selectedProjectileFamilyId;
          const baseProj = projFamilyId
            ? localProjectileDatabase[projFamilyId]
            : undefined;
          const charProjOverrides =
            (selectedChar as any).projectileOverrides?.[projFamilyId] ||
            (selectedChar as any).beamOverrides?.[projFamilyId];
          family = baseProj ? {
            ...baseProj,
            ...charProjOverrides,
            start: baseProj.start || charProjOverrides?.start ? { ...baseProj.start, ...charProjOverrides?.start } : undefined,
            middle: baseProj.middle || charProjOverrides?.middle ? { ...baseProj.middle, ...charProjOverrides?.middle } : undefined,
            end: baseProj.end || charProjOverrides?.end ? { ...baseProj.end, ...charProjOverrides?.end } : undefined,
          } : undefined;
        } else {
          const baseFamily = beamFamilyId
            ? localBeamDatabase[beamFamilyId]
            : undefined;
          const charOverrides = selectedChar.beamOverrides?.[beamFamilyId];
          family = baseFamily ? {
            ...baseFamily,
            ...charOverrides,
            start: baseFamily.start || charOverrides?.start ? { ...baseFamily.start, ...charOverrides?.start } : undefined,
            middle: baseFamily.middle || charOverrides?.middle ? { ...baseFamily.middle, ...charOverrides?.middle } : undefined,
            end: baseFamily.end || charOverrides?.end ? { ...baseFamily.end, ...charOverrides?.end } : undefined,
          } : undefined;
        }

        if (isProjectile && midAnim) {
          const midImg = animManager.getGifFrame(midAnim.imageUrl, frameIndex);
          if (midImg) {
            ctx.save();
            ctx.translate(
              kiX + (midAnim.offsetX || 0),
              bStartY + (midAnim.offsetY || 0),
            );

            if (midAnim.rotation) {
              ctx.rotate((midAnim.rotation * Math.PI) / 180);
            }

            // Apply style filters to projectile
            let filters: string[] = [];
            if (family) {
              const glowColor =
                family.color;
              const brightness =
                family.projectileBrightness !== undefined
                  ? family.projectileBrightness
                  : (family.beamBrightness ?? 1.0);
              const opacity =
                family.projectileOpacity !== undefined
                  ? family.projectileOpacity
                  : (family.beamOpacity ?? 1.0);
              const hRotate =
                family.projectileHueRotate !== undefined
                  ? family.projectileHueRotate
                  : family.beamHueRotate;
              const saturate =
                family.projectileSaturate !== undefined
                  ? family.projectileSaturate
                  : family.beamSaturate;
              const contrast =
                family.projectileContrast !== undefined
                  ? family.projectileContrast
                  : family.beamContrast;

              if (hRotate !== undefined) {
                filters.push(`hue-rotate(${hRotate}deg)`);
              }
              if (saturate !== undefined) {
                filters.push(`saturate(${saturate})`);
              }
              if (brightness !== undefined) {
                filters.push(`brightness(${brightness})`);
              }
              if (contrast !== undefined) {
                filters.push(`contrast(${contrast})`);
              }
              if (filters.length > 0) {
                ctx.filter = filters.join(" ");
              }
              if (opacity !== undefined) {
                ctx.globalAlpha = opacity;
              }
            }

            const scale = midAnim.scale || 1.5;
            const imgW = midImg.width || midAnim.frameWidth || 100;
            const imgH = midImg.height || midAnim.frameHeight || 100;

            let drawImg = midImg;
            if (family?.color && family.color !== "#ffffff") {
              drawImg = animManager.getTintedImg(
                midImg,
                family.color,
                `${midAnim.imageUrl}_${frameIndex}`,
                midImg.width,
                midImg.height,
              );
            }

            ctx.drawImage(
              drawImg as CanvasImageSource,
              (-imgW * scale) / 2,
              (-imgH * scale) / 2,
              imgW * scale,
              imgH * scale,
            );
            ctx.restore();
          }
        } else {
          // Unified beam drawing via offscreen canvas to avoid artifact overlap bugs
          const originalTransform = ctx.getTransform();
          const { canvas: tempCanvas, ctx: tempCtx } = getOffscreen(
            canvas.width,
            canvas.height,
          );
          tempCtx.setTransform(originalTransform);

          const scale = midAnim?.scale || 2.2;
          const startScale = startAnim?.scale || scale;
          const endScale = endAnim?.scale || scale;

          const startW = startAnim
            ? CollisionHelper.getActualFrameWidth(startAnim, frameIndex) * startScale
            : 80 * startScale;
          const endW = endAnim
            ? CollisionHelper.getActualFrameWidth(endAnim, frameIndex) * endScale
            : 80 * endScale;

          // Left of Meio is aligned to center of Inicio (startW / 2, taking into account any custom origins/centers/offsets)
          let midLeft = 0;
          if (startAnim) {
            const oxStart = startAnim.originX !== undefined ? startAnim.originX : startW / 2;
            const cxStart = startAnim.centerX !== undefined ? startAnim.centerX : startW / 2;
            midLeft = (oxStart - cxStart) + (startAnim.offsetX || 0) + startW / 2;
          } else {
            midLeft = 0;
          }

          // Right of Meio is aligned to center of Ponta (pWidth, taking into account any custom origins/centers/offsets of the end frame)
          let midRight = pWidth;
          if (endAnim) {
            const oxEnd = endAnim.originX !== undefined ? endAnim.originX : 0;
            const cxEnd = endAnim.centerX !== undefined ? endAnim.centerX : endW / 2;
            midRight = pWidth + (oxEnd - cxEnd) + (endAnim.offsetX || 0) + endW / 2;
          } else {
            midRight = pWidth;
          }
          midRight = Math.max(midLeft, midRight);
          const drawMidWidth = midRight - midLeft;

          if (midAnim) {
            let baseMidImg = animManager.getGifFrame(
              midAnim.imageUrl,
              frameIndex,
            );
            if (baseMidImg) {
              let midImg = baseMidImg;
              if (family?.color && family.color !== "#ffffff") {
                midImg = animManager.getTintedImg(
                  baseMidImg,
                  family.color,
                  `${midAnim.imageUrl}_${frameIndex}`,
                  baseMidImg.width,
                  baseMidImg.height,
                );
              }
              tempCtx.save();
              const h = midImg.height || midAnim.frameHeight || 100;

              tempCtx.translate(kiX, bStartY);
              if (midAnim.rotation) {
                tempCtx.rotate((midAnim.rotation * Math.PI) / 180);
              }
              const midOffsetY = midAnim.offsetY || 0;
              tempCtx.translate(0, midOffsetY);

              if (
                typeof midAnim.beamSpacing === "number" &&
                midAnim.beamSpacing !== 0
              ) {
                tempCtx.translate(midLeft, (-h * scale) / 2 + 5);
                tempCtx.scale(scale, scale);
                const beamWidth = Math.max(0, drawMidWidth) / scale;
                tempCtx.beginPath();
                tempCtx.rect(0, 0, beamWidth, h);
                tempCtx.clip();

                const segmentWidth = midImg.width || midAnim.frameWidth || h;
                const totalSegmentWidth = Math.max(
                  1,
                  segmentWidth + midAnim.beamSpacing,
                );
                const numRepeats = Math.ceil(beamWidth / totalSegmentWidth) + 1;
                const moveX = 0;

                for (let i = 0; i <= numRepeats; i++) {
                  tempCtx.drawImage(
                    midImg as CanvasImageSource,
                    i * totalSegmentWidth - moveX,
                    0,
                  );
                }
              } else {
                const pattern = tempCtx.createPattern(
                  midImg as CanvasImageSource,
                  "repeat-x",
                );
                if (pattern) {
                  tempCtx.fillStyle = pattern;
                  tempCtx.translate(midLeft, (-h * scale) / 2 + 5);
                  tempCtx.scale(scale, scale);
                  tempCtx.fillRect(
                    0,
                    0,
                    Math.max(0, drawMidWidth) / scale,
                    h,
                  );
                }
              }
              tempCtx.restore();
            }
          }
          if (startAnim) {
            tempCtx.save();
            tempCtx.translate(kiX, bStartY);
            if (midAnim?.rotation) {
              tempCtx.rotate((midAnim.rotation * Math.PI) / 180);
            }
            const midOffsetX = midAnim?.offsetX || 0;
            const midOffsetY = midAnim?.offsetY || 0;
            if (midOffsetX !== 0 || midOffsetY !== 0) {
              tempCtx.translate(midOffsetX, midOffsetY);
            }

            const startAnimWithoutRotation = {
              ...startAnim,
              rotation: undefined,
            };

            animManager.drawFrame(
              tempCtx,
              startAnimWithoutRotation,
              frameIndex,
              0,
              5,
              startW,
              80,
              startAnim.scale || midAnim?.scale || 2.2,
              true, // Always true because direction is facing right
              true, // Center align Y
              family?.color,
            );
            tempCtx.restore();
          }
          if (endAnim) {
            tempCtx.save();
            tempCtx.translate(kiX, bStartY);
            if (midAnim?.rotation) {
              tempCtx.rotate((midAnim.rotation * Math.PI) / 180);
            }
            const midOffsetX = midAnim?.offsetX || 0;
            const midOffsetY = midAnim?.offsetY || 0;
            if (midOffsetX !== 0 || midOffsetY !== 0) {
              tempCtx.translate(midOffsetX, midOffsetY);
            }
            const endAnimWithoutRotation = {
              ...endAnim,
              rotation: undefined,
            };

            animManager.drawFrame(
              tempCtx,
              endAnimWithoutRotation,
              frameIndex,
              Math.max(midLeft, pWidth),
              5,
              0,
              10,
              endAnim.scale || midAnim?.scale || 2.2,
              true, // Facing Right
              true, // Center align Y
              family?.color,
            );
            tempCtx.restore();
          }

          // Apply filters and output offscreen composite to the main canvas
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform to draw full image
          if (family) {
            let filters: string[] = [];
            if (selectedChar?.id === "goku_black_rose") {
              if (
                family.beamHueRotate === undefined ||
                family.beamHueRotate === 0
              ) {
                filters.push("hue-rotate(130deg)");
              }
            }
            if (
              family.beamHueRotate !== undefined &&
              family.beamHueRotate !== 0
            ) {
              filters.push(`hue-rotate(${family.beamHueRotate}deg)`);
            }
            if (family.beamSaturate !== undefined) {
              filters.push(`saturate(${family.beamSaturate})`);
            }
            if (family.beamBrightness !== undefined) {
              filters.push(`brightness(${family.beamBrightness})`);
            }
            if (family.beamContrast !== undefined) {
              filters.push(`contrast(${family.beamContrast})`);
            }
            if (filters.length > 0) {
              ctx.filter = filters.join(" ");
            }
            if (family.beamOpacity !== undefined) {
              ctx.globalAlpha = family.beamOpacity;
            }
          }
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.restore();
        }
        ctx.restore(); // Dynamic filters/style outer save/restore block
      } else {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#60a5fa"; // Blue-400
        if (isFacingRight) {
          ctx.fillRect(kiX, kiY - 15, canvas.width - kiX, 30);
        } else {
          ctx.fillRect(0, kiY - 15, kiX, 30);
        }
        ctx.restore();
      }
    }

    // Draw Aura behind the character only if in the Aura/System editor tab
    if (
      (activeTab === "AURAS" ||
      (activeTab === "BEAMS_MANAGER" && activeManagerClass === "AURA")) &&
      activeTab !== "VFX"
    ) {
      const activeAuraKeyToForce =
        activeTab === "AURAS"
          ? selectedAuraKey
          : activeTab === "BEAMS_MANAGER" && activeManagerClass === "AURA"
            ? selectedAuraKey
            : undefined;
      animManager.drawPlayerAura(
        ctx,
        previewCharWithAnim,
        characterStateKey as PlayerState,
        centerX - PLAYER_WIDTH / 2,
        centerY - PLAYER_HEIGHT / 2,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        true, // facingRight
        false, // sparkingActive
        1.0, // scaleH
        1.0, // scaleW
        activeAuraKeyToForce,
      );
    }

    // Draw Character using attackContext if editing a beam, otherwise default
    if (activeTab === "VFX") {
      // Draw ONLY the VFX from config, applying its specific filters and transformations
      if (config && config.imageUrl) {
        ctx.save();
        const effectConfig = EffectConfigKeyManager.getInstance().getEffect(selectedEffectKey);
        if (effectConfig) {
          let filters = "";
          if (effectConfig.effectHueRotate) filters += ` hue-rotate(${effectConfig.effectHueRotate}deg)`;
          if (effectConfig.effectSaturate !== undefined) filters += ` saturate(${effectConfig.effectSaturate})`;
          if (effectConfig.effectBrightness !== undefined) filters += ` brightness(${effectConfig.effectBrightness})`;
          if (effectConfig.effectContrast !== undefined) filters += ` contrast(${effectConfig.effectContrast})`;

          if (filters) ctx.filter = filters.trim();
          
          if (effectConfig.effectOpacity !== undefined) ctx.globalAlpha = effectConfig.effectOpacity;
        }

        const finalScaleX = (config.scale || 1) * (effectConfig?.effectScaleX ?? 1);
        const finalScaleY = (config.scale || 1) * (effectConfig?.effectScaleY ?? 1);
        const offX = effectConfig?.effectOffsetX || 0;
        const offY = effectConfig?.effectOffsetY || 0;
        const tintColor = effectConfig?.color || "#ffffff";

        animManager.drawFrame(
          ctx,
          config,
          frameIndex,
          centerX - PLAYER_WIDTH / 2 + offX,
          centerY - PLAYER_HEIGHT / 2 + offY,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          finalScaleX, 
          true, // facingRight
          false, // centerAlignY
          tintColor
        );
        ctx.restore();
      }
    } else {
      animManager.drawPlayer(
        ctx,
        previewCharWithAnim,
        characterStateKey as PlayerState,
        centerX - PLAYER_WIDTH / 2, // Center the "character box"
        centerY - PLAYER_HEIGHT / 2,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
        true,
        isEditingBeam ? charFrameIndex : frameIndex,
        false, // isStunned
      );
    }

    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.fillText("characterStateKey: " + characterStateKey, 10, 30);
    ctx.fillText("config.imageUrl: " + config.imageUrl, 10, 50);

    const testCache = animManager.getGifFrameCount(config.imageUrl);
    ctx.fillText("GIF CACHE count: " + testCache, 10, 70);
    ctx.fillText("Anim exists in mapping?: " + !!characterConfig, 10, 90);

    ctx.fillText("animManager.isLoading?: " + animManager.isLoading(), 10, 110);
    ctx.fillText(
      "Image URL starts with: " +
        (config.imageUrl ? config.imageUrl.substring(0, 30) : "none"),
      10,
      130,
    );

    // Output debug to window so we can view it
    if (!(window as any).previewDebugLogged) {
      (window as any).previewDebugLogged = true;
      console.log("== PREVIEW DEBUG ==");
      console.log("ImageUrl: ", config.imageUrl);
      console.log("isGif: ", config.isGif);
      console.log("GIF Cache count: ", testCache);
      console.log("animManager isLoading: ", animManager.isLoading());
      console.log("Character Config exists?: ", !!characterConfig);
      if (characterConfig) {
        console.log("Character Config Keys: ", Object.keys(characterConfig));
      }
    }

    // Draw Custom Onion Skin (FRONT)
    if (showCustomOnionSkin && customOnionConfig.layer === "FRONT" && activeTab !== "VFX") {
      const refChar = BASE_CHARACTERS.find(
        (c) => c.id === customOnionConfig.characterId,
      );
      if (refChar) {
        ctx.save();
        ctx.globalAlpha = customOnionConfig.opacity;
        animManager.drawPlayer(
          ctx,
          refChar,
          customOnionConfig.animState as PlayerState,
          centerX - PLAYER_WIDTH / 2,
          centerY - PLAYER_HEIGHT / 2,
          PLAYER_WIDTH,
          PLAYER_HEIGHT,
          true,
          customOnionConfig.frameIndex,
          false,
        );
        ctx.restore();
      }
    }

    ctx.restore();

    // Draw the edited beam part centered around kiOrigin
    // (This block was removed because the BEAM EDIT HELPER below handles composed beam drawing)

    // Draw screen flash
    if (config.flashFrames?.includes(frameIndex)) {
      ctx.fillStyle = config.flashColor || "rgba(255, 255, 255, 0.8)";
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-pan.x, -pan.y, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }

    // Draw Mugen Cinematic Effects
    if (config.mugenEffect) {
      const mugenProg = frameIndex / (config.frames || 1);

      // Draw Portrait sliding in
      if (config.mugenPortraitUrl) {
        const img = animManager.loadTexture(config.mugenPortraitUrl);
        if (img.complete && img.naturalWidth !== 0) {
          ctx.save();
          const slideInX =
            Math.max(0, -canvas.width + mugenProg * (canvas.width * 2 + 200)) -
            pan.x; // Slides from left to right
          ctx.globalAlpha = mugenProg < 0.8 ? 0.7 : 0; // Fade out near end
          ctx.drawImage(img, slideInX, canvas.height - 300 - pan.y, 300, 300);

          // Draw accent line
          ctx.strokeStyle = config.mugenColor || "#d946ef";
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.moveTo(slideInX, canvas.height - pan.y);
          ctx.lineTo(slideInX + 300, canvas.height - 300 - pan.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Super Text
      if (config.mugenText) {
        ctx.save();
        ctx.translate(canvas.width / 2 - pan.x, canvas.height / 4 - pan.y);
        // Pulsing scale
        const scale = 1 + Math.sin(mugenProg * Math.PI * 4) * 0.1;
        ctx.scale(scale, scale);
        // Rotating slightly
        ctx.rotate(-0.05);

        ctx.font = 'italic 900 48px "Black Ops One", Impact, sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Color and Stroke
        ctx.fillStyle = config.mugenColor || "#d946ef";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        // Shadow
        // ctx.shadowColor = "rgba(0,0,0,0.8)";
        // ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.strokeText(config.mugenText, 0, 0);

        // Remove shadow for fill for cleaner look inside
        // ctx.shadowColor = "transparent";
        ctx.fillText(config.mugenText, 0, 0);

        ctx.restore();
      }
    }

    // Draw 16:9 screen bounds guide if Zoom is enabled
    if (config.zoomType) {
      let focusX = centerX;
      let focusY = centerY;
      if (config.zoomType !== "DEFAULT_CENTER") {
        focusX =
          config.cameraFocusX !== undefined
            ? centerX - PLAYER_WIDTH / 2 + config.cameraFocusX
            : centerX;
        focusY =
          config.cameraFocusY !== undefined
            ? centerY - PLAYER_HEIGHT / 2 + config.cameraFocusY
            : centerY;
      } else if (config.opponentPosX !== undefined) {
        const oppX =
          centerX -
          PLAYER_WIDTH / 2 +
          config.opponentPosX +
          (PLAYER_WIDTH * (config.opponentScale || 1)) / 2;
        focusX = (centerX + oppX) / 2;
        const oppY =
          centerY -
          PLAYER_HEIGHT / 2 +
          (config.opponentPosY || 0) +
          (PLAYER_HEIGHT * (config.opponentScale || 1)) / 2;
        focusY = (centerY + oppY) / 2;
      }

      // Draw game bounds guide (Game is 16:9 1280x720, Canvas expands)
      const guideW = 1280;
      const guideH = 720;
      ctx.strokeStyle = "rgba(251, 146, 60, 0.5)"; // Orange color for visibility
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(focusX - guideW / 2, focusY - guideH / 2, guideW, guideH);
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(251, 146, 60, 0.8)";
      ctx.font = '12px "Black Ops One", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        "1.0 ZOOM BOUNDS (Base 1280x720 Screen)",
        focusX,
        focusY - guideH / 2 - 8,
      );
    }

    // Default constraints for Origin and Center mapped to screen space
    const { originScreenX, originScreenY, centerScreenX, centerScreenY } =
      getOriginAndCenter();

    // Draw Hitbox Origin Indicator (Green dot)
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(originScreenX, originScreenY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#22c55e";
    ctx.font = "10px Roboto";
    ctx.fillText(isEditingBeam ? "SEGMENT ORIGIN" : "HITBOX ORIGIN", originScreenX - 35, originScreenY - 12);

    ctx.save();
    if (config.rotation) {
      ctx.translate(originScreenX, originScreenY);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.translate(-originScreenX, -originScreenY);
    }

    // Draw Center Indicator (Purple/Pink cross)
    ctx.strokeStyle = "#d946ef";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerScreenX - 5, centerScreenY - 5);
    ctx.lineTo(centerScreenX + 5, centerScreenY + 5);
    ctx.moveTo(centerScreenX + 5, centerScreenY - 5);
    ctx.lineTo(centerScreenX - 5, centerScreenY + 5);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Draw Sprite Bounds Box (Cyan)
    let imageWidth = config.scale
      ? (config.frameWidth || 100) * config.scale
      : config.frameWidth || 100;
    let imageHeight = config.scale
      ? (config.frameHeight || 100) * config.scale
      : config.frameHeight || 100;

    if (config.isGif && config.imageUrl) {
      const img = animManager.getGifFrame(config.imageUrl, frameIndex);
      if (img && img.width) {
        imageWidth = img.width * (config.scale || 1);
        imageHeight = img.height * (config.scale || 1);
      }
    } else if (config.imageUrl) {
      const img = animManager.loadTexture(config.imageUrl);
      if (img && img.width && !config.frameWidth) {
        imageWidth = img.width * (config.scale || 1);
        imageHeight = img.height * (config.scale || 1);
      }
    }

    const cx = config.centerX !== undefined ? config.centerX : imageWidth / 2;
    const cy =
      config.centerY !== undefined
        ? config.centerY
        : config.fullScreen ||
            (selectedState && selectedState.includes("BEAM_"))
          ? imageHeight / 2
          : imageHeight;
    const destX = centerScreenX - cx;
    const destY = centerScreenY - cy;

    ctx.strokeStyle = "rgba(6, 182, 212, 0.4)"; // Cyan-500
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(destX, destY, imageWidth, imageHeight);
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
    ctx.fillRect(destX - 3, destY - 3, 6, 6);
    ctx.font = "10px Roboto";
    ctx.fillText("SPRITE BOX", destX + 5, destY - 5);

    ctx.restore();

    // Draw Ki Blast Origin UI elements on top of the character if defined
    if (hasAnyKiOrigin) {
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(kiX, kiY, 10, 0, Math.PI * 2); // Make it slightly larger so it's easily clickable
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      // Add a text label
      ctx.fillStyle = "#fff";
      ctx.font = "10px Roboto";
      ctx.fillText("KI ORIGIN", kiX - 25, kiY - 15);

      // Render custom visual handles for each draggable beam/projectile part when in BEAM or PROJECTILE editor tabs
      if (isBeamOrProjTab) {
        const isBeamTab = activeTab === "BEAM";
        const projFamilyId = selectedProjectileFamilyId || selectedBeamFamilyId;
        const family = isBeamTab
          ? localBeamDatabase[selectedBeamFamilyId]
          : localProjectileDatabase[projFamilyId] ||
            localBeamDatabase[selectedBeamFamilyId];
        if (family) {
          const charOverrides = isBeamTab
            ? (selectedChar.beamOverrides?.[selectedBeamFamilyId] ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.beamConfig)
            : ((selectedChar as any).projectileOverrides?.[projFamilyId] ??
              (selectedChar as any).beamOverrides?.[projFamilyId] ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.projectileConfig ??
              selectedChar.spriteConfig?.animations?.[selectedState]
                ?.beamConfig);
          const mergedStart = family.start
            ? { ...family.start, ...(charOverrides?.start as any) }
            : undefined;
          const mergedMiddle = family.middle
            ? { ...family.middle, ...(charOverrides?.middle as any) }
            : family.middle;
          const mergedEnd = family.end
            ? { ...family.end, ...(charOverrides?.end as any) }
            : undefined;

          const actStart =
            selectedBeamPart === "start"
              ? {
                  ...mergedStart,
                  ...config,
                  imageUrl: config?.imageUrl || mergedStart?.imageUrl,
                }
              : mergedStart;
          const actMid =
            selectedBeamPart === "middle"
              ? {
                  ...mergedMiddle,
                  ...config,
                  imageUrl: config?.imageUrl || mergedMiddle?.imageUrl,
                }
              : mergedMiddle;
          const actEnd =
            selectedBeamPart === "end"
              ? {
                  ...mergedEnd,
                  ...config,
                  imageUrl: config?.imageUrl || mergedEnd?.imageUrl,
                }
              : mergedEnd;

          const bStartY = kiY;

          const midOffsetY = actMid?.offsetY || 0;

          const startXLoc = kiX + (actStart?.offsetX || 0);
          const startYLoc = bStartY + 5 + midOffsetY + (actStart?.offsetY || 0);

          const midXLoc = kiX + (actMid?.offsetX || 0);
          const midYLoc = bStartY + midOffsetY;

          const endXLoc = kiX + (actMid?.offsetX || 0) + 2000;
          const endYLoc = bStartY + 5 + midOffsetY + (actEnd?.offsetY || 0);

          const isProjectile = (() => {
            if (activeTab === "BEAM") return false;
            if (
              activeTab === "KI_BLAST" ||
              activeTab === "GENKIDAMA" ||
              activeTab === "fechosenergia" ||
              activeTab === "PROJECTILE"
            )
              return true;
            const anim = selectedChar.spriteConfig?.animations?.[selectedState];
            const beamId = anim?.createsBeam;
            if (beamId) {
              return (
                beamId.includes("KI_BLAST") ||
                beamId.includes("PROJECTILE") ||
                beamId.includes("PROJETIL") ||
                beamId.includes("GENKIDAMA") ||
                beamId.includes("FECHO")
              );
            }
            return (
              selectedState?.includes("KI_BLAST") ||
              selectedState?.includes("GENKIDAMA") ||
              selectedState?.includes("FECHO")
            );
          })();

          // Start Part indicator
          if (actStart) {
            const isSel = selectedBeamPart === "start";
            ctx.save();
            ctx.strokeStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.lineWidth = isSel ? 3 : 1.5;
            ctx.fillStyle = isSel
              ? "rgba(56, 189, 248, 0.25)"
              : "rgba(148, 163, 184, 0.1)";
            ctx.beginPath();
            ctx.arc(startXLoc, startYLoc, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner target crosshair
            ctx.beginPath();
            ctx.moveTo(startXLoc - 8, startYLoc);
            ctx.lineTo(startXLoc + 8, startYLoc);
            ctx.moveTo(startXLoc, startYLoc - 8);
            ctx.lineTo(startXLoc, startYLoc + 8);
            ctx.stroke();

            ctx.fillStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.font = "bold 9px monospace";
            ctx.fillText("BEAM START", startXLoc - 28, startYLoc - 18);
            ctx.restore();
          }

          // Middle Part indicator
          if (actMid) {
            const isSel = selectedBeamPart === "middle";
            ctx.save();
            ctx.strokeStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.lineWidth = isSel ? 3 : 1.5;
            ctx.fillStyle = isSel
              ? "rgba(56, 189, 248, 0.25)"
              : "rgba(148, 163, 184, 0.1)";
            ctx.beginPath();
            ctx.arc(midXLoc, midYLoc, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(midXLoc - 8, midYLoc);
            ctx.lineTo(midXLoc + 8, midYLoc);
            ctx.moveTo(midXLoc, midYLoc - 8);
            ctx.lineTo(midXLoc, midYLoc + 8);
            ctx.stroke();

            ctx.fillStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.font = "bold 9px monospace";
            ctx.fillText(
              isProjectile ? "PROJECTILE" : "BEAM MIDDLE",
              midXLoc - 36,
              midYLoc - 18,
            );
            ctx.restore();
          }

          // End Part indicator (skip if projectile)
          if (actEnd && !isProjectile) {
            const isSel = selectedBeamPart === "end";
            ctx.save();
            ctx.strokeStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.lineWidth = isSel ? 3 : 1.5;
            ctx.fillStyle = isSel
              ? "rgba(56, 189, 248, 0.25)"
              : "rgba(148, 163, 184, 0.1)";
            ctx.beginPath();
            ctx.arc(endXLoc, endYLoc, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(endXLoc - 8, endYLoc);
            ctx.lineTo(endXLoc + 8, endYLoc);
            ctx.moveTo(endXLoc, endYLoc - 8);
            ctx.lineTo(endXLoc, endYLoc + 8);
            ctx.stroke();

            ctx.fillStyle = isSel ? "#38bdf8" : "#94a3b8";
            ctx.font = "bold 9px monospace";
            ctx.fillText("BEAM END", endXLoc - 24, endYLoc - 18);
            ctx.restore();
          }
        }
      }
    }

    // Draw Camera Focus Origin if defined
    if (
      config.cameraFocusX !== undefined &&
      config.cameraFocusY !== undefined
    ) {
      const camX = centerX - PLAYER_WIDTH / 2 + config.cameraFocusX;
      const camY = centerY - PLAYER_HEIGHT / 2 + config.cameraFocusY;
      ctx.fillStyle = "rgba(245, 158, 11, 0.5)"; // Amber
      ctx.beginPath();
      ctx.arc(camX, camY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#f59e0b"; // Amber border
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(camX, camY, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Cross inside
      ctx.beginPath();
      ctx.moveTo(camX - 10, camY);
      ctx.lineTo(camX + 10, camY);
      ctx.moveTo(camX, camY - 10);
      ctx.lineTo(camX, camY + 10);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    // --- DRAW CUTSCENE BACKGROUND ---
    if (activeTab === "SCENE") {
      if (config.sceneBackgroundColor) {
        ctx.save();
        ctx.fillStyle = config.sceneBackgroundColor;
        ctx.fillRect(-pan.x, -pan.y, canvas.width, canvas.height);
        ctx.restore();
      }
      if (config.sceneBackgroundUrl) {
        const bgImg = animManager.loadTexture(config.sceneBackgroundUrl);
        if (bgImg.complete && bgImg.naturalWidth) {
          ctx.save();
          // Fill the screen
          ctx.drawImage(bgImg, -pan.x, -pan.y, canvas.width, canvas.height);
          ctx.restore();
        }
      }
    }

    // --- DRAW CUTSCENE OPPONENT --- (NEW)
    if (config.opponentPosX !== undefined) {
      ctx.save();
      const oppX = centerX - PLAYER_WIDTH / 2 + (config.opponentPosX || 0);
      const oppY = centerY - PLAYER_HEIGHT / 2 + (config.opponentPosY || 0);
      const oppScale = config.opponentScale || 1;
      const oppAnim = (config.opponentAnim as PlayerState) || PlayerState.HIT;

      ctx.globalAlpha = 0.6; // Slightly transparent to differentiate from main player

      animManager.drawPlayer(
        ctx,
        previewOpponent,
        oppAnim,
        oppX,
        oppY,
        PLAYER_WIDTH * oppScale,
        PLAYER_HEIGHT * oppScale,
        !selectedChar.facingRight, // Face opposite
        Math.floor(frameIndex / 2) % 4, // Simple pulse
        false,
      );

      // Draw relative crosshair for opponent
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.strokeRect(
        oppX,
        oppY,
        PLAYER_WIDTH * oppScale,
        PLAYER_HEIGHT * oppScale,
      );
      ctx.setLineDash([]);

      ctx.restore();
    }

    // --- DRAW SCENE OBJECTS (FRONT LAYER) ---
    if (config.sceneObjects && config.sceneObjects.length > 0) {
      config.sceneObjects
        .filter((o) => o.layer !== "BACK")
        .forEach((obj) => {
          ctx.save();
          const objX = centerX - PLAYER_WIDTH / 2 + obj.x;
          const objY = centerY - PLAYER_HEIGHT / 2 + obj.y;

          ctx.translate(objX + 20 * obj.scale, objY + 20 * obj.scale); // move to center of box
          if (obj.rotation) ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.translate(-(objX + 20 * obj.scale), -(objY + 20 * obj.scale));

          ctx.globalAlpha = obj.opacity ?? 1;

          if (obj.configKey) {
            const vfx = localEffectDatabase[obj.configKey];
            if (vfx) {
              const filters = [];
              if (vfx.effectHueRotate) filters.push(`hue-rotate(${vfx.effectHueRotate}deg)`);
              if (vfx.effectSaturate !== undefined) filters.push(`saturate(${vfx.effectSaturate})`);
              if (vfx.effectBrightness !== undefined) filters.push(`brightness(${vfx.effectBrightness})`);
              if (vfx.effectContrast !== undefined) filters.push(`contrast(${vfx.effectContrast})`);
              if (filters.length > 0) ctx.filter = filters.join(' ');
              if (vfx.effectOpacity !== undefined) ctx.globalAlpha *= vfx.effectOpacity;
            }
          }

          if (obj.imageUrl) {
            const img = obj.isGif
              ? animManager.getGifFrame(obj.imageUrl, frameIndex)
              : animManager.loadTexture(obj.imageUrl);

            if (img && img.width) {
              const w = img.width * obj.scale;
              const h = img.height * obj.scale;
              // Calculate centering for custom images properly if we can, otherwise just draw from top-left (objX,Y is top-left of default 40x40 box)
              // We align it to the same relative "box center"
              const dx = objX + 20 * obj.scale - w / 2;
              const dy = objY + 20 * obj.scale - h / 2;
              ctx.drawImage(img as CanvasImageSource, dx, dy, w, h);
            } else {
              // Fallback
              ctx.fillStyle =
                obj.type === "VFX"
                  ? "rgba(255, 255, 0, 0.4)"
                  : "rgba(100, 100, 100, 0.6)";
              ctx.fillRect(objX, objY, 40 * obj.scale, 40 * obj.scale);
            }
          } else {
            // For now, draw objects as visual markers or simple sprites if we can map them
            ctx.fillStyle =
              obj.type === "VFX"
                ? "rgba(255, 255, 0, 0.4)"
                : "rgba(100, 100, 100, 0.6)";
            ctx.fillRect(objX, objY, 40 * obj.scale, 40 * obj.scale);
            ctx.strokeStyle = "white";
            ctx.strokeRect(objX, objY, 40 * obj.scale, 40 * obj.scale);

            ctx.fillStyle = "white";
            ctx.font = "8px monospace";
            ctx.fillText(obj.id, objX, objY - 5);
          }

          ctx.restore();
        });
    }

    // --- DRAW CUTSCENE DIALOGUE ---
    if (activeTab === "SCENE" && config.sceneDialogueText) {
      ctx.save();
      ctx.translate(0, canvas.height - 180 - pan.y);

      // Dialogue Box
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.fillRect(100 - pan.x, 0, canvas.width - 200, 150);
      ctx.strokeRect(100 - pan.x, 0, canvas.width - 200, 150);

      // Avatar
      if (config.sceneDialogueAvatar) {
        const avatarImg = animManager.loadTexture(config.sceneDialogueAvatar);
        if (avatarImg.complete && avatarImg.naturalWidth) {
          ctx.drawImage(avatarImg, 120 - pan.x, 15, 120, 120);
          ctx.strokeStyle = "white";
          ctx.strokeRect(120 - pan.x, 15, 120, 120);
        }
      }

      // Name Plate
      let textStartX = config.sceneDialogueAvatar ? 260 : 120;
      if (config.sceneDialogueName) {
        ctx.fillStyle = "#eab308"; // yellow-500
        ctx.font = "bold 22px 'Rajdhani', sans-serif";
        ctx.fillText(config.sceneDialogueName, textStartX - pan.x, 40);
      }

      // Text Body
      ctx.fillStyle = "white";
      ctx.font = "20px 'Rajdhani', sans-serif";
      // simple wrap concept
      const lines = config.sceneDialogueText.replace(/\\n/g, "\n").split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, textStartX - pan.x, 75 + i * 25);
      });

      ctx.restore();
    }

    const characterRotation = isEditingBeam ? 0 : config.rotation || 0;

    // Draw the character box reference to show tremors
    ctx.save();
    const rx = config.originX !== undefined ? config.originX : PLAYER_WIDTH / 2;
    const ry =
      config.originY !== undefined
        ? config.originY
        : config.fullScreen
          ? PLAYER_HEIGHT / 2
          : PLAYER_HEIGHT;
    const pivotX = centerX - PLAYER_WIDTH / 2 + rx;
    const pivotY = centerY - PLAYER_HEIGHT / 2 + ry;
    if (characterRotation) {
      ctx.translate(pivotX, pivotY);
      ctx.rotate((characterRotation * Math.PI) / 180);
      ctx.translate(-pivotX, -pivotY);
    }
    ctx.strokeStyle = "rgba(79, 70, 229, 0.4)";
    ctx.strokeRect(
      centerX - PLAYER_WIDTH / 2,
      centerY - PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
    );
    ctx.restore();

    // --- DRAW COLLISION BOXES ---
    if (showHitboxes || activeTab === "COLLISION" || isBeamOrProjTab) {
      // Hitbox (Green)
      const globalHitboxW =
        selectedChar.spriteConfig?.hitboxWidth || PLAYER_WIDTH;
      const globalHitboxH =
        selectedChar.spriteConfig?.hitboxHeight || PLAYER_HEIGHT;
      const globalHitboxXOff = selectedChar.spriteConfig?.hitboxOffsetX || 0;
      const globalHitboxYOff = selectedChar.spriteConfig?.hitboxOffsetY || 0;

      const hW = isEditingBeam ? (characterConfig.hitboxWidth ?? globalHitboxW) : (config.hitboxWidth ?? globalHitboxW);
      const hH = isEditingBeam ? (characterConfig.hitboxHeight ?? globalHitboxH) : (config.hitboxHeight ?? globalHitboxH);
      const hXOff = isEditingBeam ? (characterConfig.hitboxOffsetX ?? globalHitboxXOff) : (config.hitboxOffsetX ?? globalHitboxXOff);
      const hYOff = isEditingBeam ? (characterConfig.hitboxOffsetY ?? globalHitboxYOff) : (config.hitboxOffsetY ?? globalHitboxYOff);

      const hX = centerX - PLAYER_WIDTH / 2 + hXOff;
      const hY = centerY - PLAYER_HEIGHT / 2 + hYOff;

      ctx.save();
      if (characterRotation) {
        ctx.translate(pivotX, pivotY);
        ctx.rotate((characterRotation * Math.PI) / 180);
        ctx.translate(-pivotX, -pivotY);
      }

      ctx.strokeStyle = "#22c55e"; // green-500
      ctx.lineWidth = 2;
      ctx.strokeRect(hX, hY, hW, hH);

      // Attack Box (Red)
      const drawAttackBox = (
        w: number,
        h: number,
        xOff: number,
        yOff: number,
        active: boolean,
      ) => {
        const bx = hX + xOff;
        const by = hY + yOff;

        if (active) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
          ctx.fillRect(bx, by, w, h);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, w, h);
        } else {
          ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, w, h);
          ctx.setLineDash([]);
        }
      };

      if (config.attackBoxes && config.attackBoxes.length > 0) {
        config.attackBoxes.forEach((box) => {
          const isActive =
            !box.damageFrames ||
            box.damageFrames.length === 0 ||
            box.damageFrames.includes(frameIndex + 1) ||
            box.damageFrames.includes(frameIndex);
          drawAttackBox(
            box.width,
            box.height,
            box.offsetX,
            box.offsetY,
            isActive,
          );
        });
      } else {
        const aW = config.attackBoxWidth || 90;
        const aH = config.attackBoxHeight || 45;
        const aXOff = config.attackBoxOffsetX ?? hW;
        const aYOff = config.attackBoxOffsetY ?? hH * 0.3;
        const isActive =
          !config.damageFrames ||
          config.damageFrames.length === 0 ||
          config.damageFrames.includes(frameIndex + 1) ||
          config.damageFrames.includes(frameIndex);
        drawAttackBox(aW, aH, aXOff, aYOff, isActive);
      } // <--- END of else block for attackBoxes
      ctx.restore();

      // Projectile Box (Yellow) - Independently drawn
      const drawProjectileBox = (
        w: number,
        h: number,
        xOff: number,
        yOff: number,
      ) => {
        let bx = hX + xOff;
        let by = hY + yOff;

        const isProj =
          selectedBeamFamilyId?.includes("KI_BLAST") ||
          selectedBeamFamilyId?.includes("PROJECTILE") ||
          selectedState?.includes("KI_BLAST") ||
          isProjTab ||
          !!selectedProjectileFamilyId;
        let helperKiX =
          characterConfig?.kiOriginX ??
          selectedChar.spriteConfig?.kiOriginX ??
          76;
        let helperKiY =
          characterConfig?.kiOriginY ??
          selectedChar.spriteConfig?.kiOriginY ??
          125;

        let startKey = selectedState
          .replace("MIDDLE", "START")
          .replace("END", "START");
        let midKey = selectedState
          .replace("START", "MIDDLE")
          .replace("END", "MIDDLE");
        const startAnim = selectedChar.spriteConfig?.animations?.[startKey];
        const midAnim =
          selectedChar.spriteConfig?.animations?.[midKey] ?? config;

        const isPartTabActive =
          activeTab === "BEAM" || activeTab === "PROJECTILE";
        const expStartKiX = isPartTabActive
          ? undefined
          : selectedState === startKey
            ? config?.kiOriginX
            : startAnim?.kiOriginX;
        const expStartKiY = isPartTabActive
          ? undefined
          : selectedState === startKey
            ? config?.kiOriginY
            : startAnim?.kiOriginY;
        const expMidKiX = isPartTabActive
          ? undefined
          : selectedState === midKey
            ? config?.kiOriginX
            : midAnim?.kiOriginX;
        const expMidKiY = isPartTabActive
          ? undefined
          : selectedState === midKey
            ? config?.kiOriginY
            : midAnim?.kiOriginY;

        helperKiX = expStartKiX ?? expMidKiX ?? helperKiX;
        helperKiY = expStartKiY ?? expMidKiY ?? helperKiY;

        const pKiX = centerX - PLAYER_WIDTH / 2 + helperKiX;
        const bStartY = centerY - PLAYER_HEIGHT / 2 + helperKiY;

        if (isEditingBeam) {
          bx = pKiX + xOff;
          by = bStartY + yOff;
        }

        const finalRotation = config?.rotation ?? midAnim?.rotation ?? 0;

        if (!isProj) {
          const mockP = {
            x: pKiX,
            y: bStartY,
            width: w || 2000,
            initialFacingRight: true,
            vx: 1,
            beamFamilyId: selectedBeamFamilyId,
            ownerId: "p1",
            customScale: config?.scale,
            rotation: config?.rotation,
            animFrame: frameIndex,
            customOffsetX: 0,
            customOffsetY: 0,
            verticalScale: config?.verticalScale ?? 1.0,
          };

          const mockEngine = {
            player1: { data: selectedChar },
            player2: { data: selectedChar },
          };

          const polyStart = CollisionHelper.getBeamPartVertices(mockP, mockEngine, "start");
          const polyMiddle = CollisionHelper.getBeamPartVertices(mockP, mockEngine, "middle");
          const polyEnd = CollisionHelper.getBeamPartVertices(mockP, mockEngine, "end");

          const drawPoly = (vertices: { x: number; y: number }[], label: string, color: string) => {
            if (!vertices || vertices.length < 3) return;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            
            // Outer dashed outline
            ctx.strokeStyle = color;
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Translucent fill
            ctx.fillStyle = color.replace("1)", "0.18)");
            ctx.fill();

            // Center text indicator for precision editing
            const avgX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
            const avgY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            // ctx.shadowColor = "rgba(0, 0, 0, 1)";
            // ctx.shadowBlur = 4;
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, avgX, avgY);
            ctx.restore();
          };

          const family = selectedBeamFamilyId
            ? BeamConfigKeyManager.getInstance().getBeamConfig(selectedBeamFamilyId)
            : null;

          if (family?.start) {
            drawPoly(polyStart, "HITBOX INÍCIO (START)", "rgba(234, 179, 8, 1)");
          }
          if (family?.middle) {
            drawPoly(polyMiddle, "HITBOX MEIO (MIDDLE)", "rgba(234, 179, 8, 1)");
          }
          if (family?.end) {
            drawPoly(polyEnd, "HITBOX PONTA (END)", "rgba(234, 179, 8, 1)");
          }
        } else {
          ctx.strokeStyle = "rgba(234, 179, 8, 1)"; // yellow-500
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, w, h);
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
          ctx.fillRect(bx, by, w, h);
        }
      };

      if (
        config.projectileWidth ||
        config.projectileHeight ||
        config.projectileOffsetX !== undefined ||
        config.projectileOffsetY !== undefined ||
        activeTab === "BEAM" ||
        activeTab === "PROJECTILE" ||
        activeTab === "BEAM" ||
        !!(
          config &&
          config.createsBeam &&
          !config.createsBeam.includes("KI_BLAST") &&
          !config.createsBeam.includes("PROJECTILE") &&
          !config.createsBeam.includes("PROJETIL")
        )
      ) {
        const pW = config.projectileWidth ?? 120; // Default for preview if undefined
        const pH = config.projectileHeight ?? 120;
        const pXOff =
          config.projectileOffsetX ?? config.hitboxWidth ?? globalHitboxW;
        const pYOff =
          config.projectileOffsetY ??
          (config.hitboxHeight ?? globalHitboxH) * 0.3;
        drawProjectileBox(pW, pH, pXOff, pYOff);
      }
    }

    ctx.restore(); // Restore global pan transform
  };

  const handleConfigChange = (key: keyof AnimationFrameData, value: any) => {
    handleMultipleConfigChanges({ [key]: value });
  };

  const handleBeamStyleChange = (
    beamKey: string,
    field: string,
    value: any,
  ) => {
    const current = localBeamDatabase[beamKey];
    if (!current) return;

    const updatedProps = {
      ...current,
      [field]: value,
    };

    const keyManager = BeamConfigKeyManager.getInstance();
    const baseId = (current as any).baseBeamId || "BEAM";
    const updatedBeam = keyManager.registerBeam(
      beamKey,
      baseId,
      current.name || beamKey,
      updatedProps,
    );

    if (destinationBeamKey && beamKey === "BEAM") {
      const destCurrent = localBeamDatabase[destinationBeamKey] || {};
      const destProps = {
        ...destCurrent,
        [field]: value,
      };
      keyManager.registerBeam(
        destinationBeamKey,
        destCurrent.baseBeamId || "BEAM",
        destCurrent.name || destinationBeamKey,
        destProps,
      );
    }

    setLocalBeamDatabase(keyManager.getAllBeams());
    trackEditedKey(beamKey, "BEAM");
    if (destinationBeamKey && beamKey === "BEAM") {
      trackEditedKey(destinationBeamKey, "BEAM");
    }
  };

  const handleResetBeamColors = (beamKey: string) => {
    const current = localBeamDatabase[beamKey];
    if (!current) return;

    // Resetting visual values to neutral/original defaults
    const resetProps = {
      ...current,
      color: "#ffffff",
      beamBrightness: 1,
      beamOpacity: 1,
      beamHueRotate: 0,
      beamSaturate: 1,
      beamContrast: 1,
    };

    const keyManager = BeamConfigKeyManager.getInstance();
    const baseId = (current as any).baseBeamId || "BEAM";
    const updatedBeam = keyManager.registerBeam(
      beamKey,
      baseId,
      current.name || beamKey,
      resetProps,
    );

    if (destinationBeamKey && beamKey === "BEAM") {
      const destCurrent = localBeamDatabase[destinationBeamKey] || {};
      const destProps = {
        ...destCurrent,
        ...resetProps,
      };
      keyManager.registerBeam(
        destinationBeamKey,
        destCurrent.baseBeamId || "BEAM",
        destCurrent.name || destinationBeamKey,
        destProps,
      );
    }

    setLocalBeamDatabase(keyManager.getAllBeams());
  };

  const handleRestoreBeamConfig = (beamKey: string) => {
    const current = localBeamDatabase[beamKey];
    if (!current) return;

    const baseId = (current as any).baseBeamId || "BEAM";
    const originalTemplate = BEAM_DATABASE[beamKey] || BEAM_DATABASE[baseId] || BEAM_DATABASE["BEAM"];
    if (!originalTemplate) return;

    const clonedOriginal = JSON.parse(JSON.stringify(originalTemplate));

    const restoredProps = {
      ...clonedOriginal,
      ownerCharacterId: (current as any).ownerCharacterId,
      ownerAnimationKey: (current as any).ownerAnimationKey,
      ownerCharacterName: (current as any).ownerCharacterName,
    };

    const keyManager = BeamConfigKeyManager.getInstance();
    keyManager.registerBeam(
      beamKey,
      baseId,
      current.name || originalTemplate.name || beamKey,
      restoredProps,
    );

    if (destinationBeamKey && beamKey === "BEAM") {
      const destCurrent = localBeamDatabase[destinationBeamKey] || {};
      const destProps = {
        ...destCurrent,
        ...restoredProps,
      };
      keyManager.registerBeam(
        destinationBeamKey,
        destCurrent.baseBeamId || "BEAM",
        destCurrent.name || destinationBeamKey,
        destProps,
      );
    }

    setLocalBeamDatabase(keyManager.getAllBeams());

    if (beamKey === selectedBeamFamilyId) {
      const partKey = selectedBeamPart as "start" | "middle" | "end";
      const partProps = restoredProps[partKey] || {};
      setBeamAnimationContext({
        ...partProps,
        offsetX: partProps.offsetX !== undefined ? partProps.offsetX : 0,
        offsetY: partProps.offsetY !== undefined ? partProps.offsetY : 0,
      });
    }

    setRestoredBeamKey(beamKey);
    setTimeout(() => {
      setRestoredBeamKey(null);
    }, 2000);
  };

  const handleAuraStyleChange = (
    auraKey: string,
    field: string,
    value: any,
  ) => {
    const current = localAuraDatabase[auraKey];
    if (!current) return;

    const updatedProps = {
      ...current,
      [field]: value,
    };

    const keyManager = AuraConfigKeyManager.getInstance();
    const baseId = updatedProps.baseAuraId || "AURA_001";
    const displayName = updatedProps.name || auraKey;

    const updatedAura = keyManager.registerAura(
      auraKey,
      baseId,
      displayName,
      updatedProps,
    );

    setLocalAuraDatabase(keyManager.getAllAuras());

    // Sync character animation auraConfigKey linkage!
    if (field === "ownerAnimationKey" || field === "ownerCharacterId") {
      const charId = field === "ownerCharacterId" ? value : current.ownerCharacterId;
      const animKey = field === "ownerAnimationKey" ? value : current.ownerAnimationKey;

      if (charId && selectedChar && selectedChar.id === charId) {
        setSelectedChar((prev) => {
          if (!prev.spriteConfig || !prev.spriteConfig.animations) return prev;
          const updatedAnimations = { ...prev.spriteConfig.animations };

          // 1. Remove auraConfigKey from any other animation of this character that pointed to this auraKey
          Object.keys(updatedAnimations).forEach((k) => {
            if (updatedAnimations[k]?.auraConfigKey === auraKey) {
              const cleaned = { ...updatedAnimations[k] };
              delete cleaned.auraConfigKey;
              updatedAnimations[k] = cleaned;
            }
          });

          // 2. Assign auraConfigKey to the new animation key
          if (animKey && updatedAnimations[animKey]) {
            updatedAnimations[animKey] = {
              ...updatedAnimations[animKey],
              auraConfigKey: auraKey,
            };
          }

          return {
            ...prev,
            spriteConfig: {
              ...prev.spriteConfig,
              animations: updatedAnimations,
            },
          };
        });
      }
    }
  };

  const handleResetAuraColors = (auraKey: string) => {
    const current = localAuraDatabase[auraKey];
    if (!current) return;

    const resetProps: Partial<ConfiguredAura> = {
      color: "#ffffff",
      auraHueRotate: 0,
      auraSaturate: 1,
      auraBrightness: 1,
      auraContrast: 1,
      auraOpacity: 0.85,
    };

    const keyManager = AuraConfigKeyManager.getInstance();
    const updatedAura = keyManager.registerAura(
      auraKey,
      current.baseAuraId || "AURA_001",
      current.name,
      resetProps,
    );

    setLocalAuraDatabase(keyManager.getAllAuras());
  };

  const handleEffectStyleChange = (
    effectKey: string,
    field: string,
    value: any,
  ) => {
    let current = localEffectDatabase[effectKey];
    if (!current) {
      current = EffectConfigKeyManager.getInstance().getEffect(effectKey);
    }
    if (!current) return;

    const updatedProps = {
      ...current,
      [field]: value,
    };

    const keyManager = EffectConfigKeyManager.getInstance();
    const baseId = updatedProps.baseEffectId || "EFFECT_POEIRA_01";
    const displayName = updatedProps.name || effectKey;

    keyManager.registerEffect(
      effectKey,
      baseId,
      displayName,
      updatedProps,
    );

    setLocalEffectDatabase(keyManager.getAllEffects());

    // Sync character animation effectConfigKey linkage!
    if (field === "ownerAnimationKey" || field === "ownerCharacterId") {
      const charId = field === "ownerCharacterId" ? value : current.ownerCharacterId;
      const animKey = field === "ownerAnimationKey" ? value : current.ownerAnimationKey;

      if (charId && selectedChar && selectedChar.id === charId) {
        setSelectedChar((prev) => {
          if (!prev.spriteConfig || !prev.spriteConfig.animations) return prev;
          const updatedAnimations = { ...prev.spriteConfig.animations };

          // 1. Remove effectConfigKey from any other animation of this character that pointed to this effectKey
          Object.keys(updatedAnimations).forEach((k) => {
            if (updatedAnimations[k]?.effectConfigKey === effectKey) {
              const cleaned = { ...updatedAnimations[k] };
              delete cleaned.effectConfigKey;
              updatedAnimations[k] = cleaned;
            }
          });

          // 2. Assign effectConfigKey to the new animation key
          if (animKey && updatedAnimations[animKey]) {
            updatedAnimations[animKey] = {
              ...updatedAnimations[animKey],
              effectConfigKey: effectKey,
            };
          }

          return {
            ...prev,
            spriteConfig: {
              ...prev.spriteConfig,
              animations: updatedAnimations,
            },
          };
        });
      }
    }
  };

  const handleResetEffectColors = (effectKey: string) => {
    const current = localEffectDatabase[effectKey];
    if (!current) return;

    const resetProps: Partial<ConfiguredEffect> = {
      color: "#ffffff",
      effectHueRotate: 0,
      effectSaturate: 1,
      effectBrightness: 1,
      effectContrast: 1,
      effectOpacity: 1,
    };

    const keyManager = EffectConfigKeyManager.getInstance();
    keyManager.registerEffect(
      effectKey,
      current.baseEffectId || "EFFECT_POEIRA_01",
      current.name,
      resetProps,
    );

    setLocalEffectDatabase(keyManager.getAllEffects());
  };

  const handleResetProjectileColors = (projKey: string) => {
    const current = localProjectileDatabase[projKey];
    if (!current) return;

    const resetProps = {
      ...current,
      color: "#ffffff",
      projectileBrightness: 1,
      projectileOpacity: 1,
      projectileHueRotate: 0,
      projectileSaturate: 1,
      projectileContrast: 1,
    };

    const keyManager = ProjectileConfigKeyManager.getInstance();
    let baseId = (current as any).baseProjectileId;
    if (!baseId) {
      if (projKey.includes("GENKIDAMA")) {
        if (projKey.includes("GENKIDAMA_2")) baseId = "GENKIDAMA_2";
        else if (projKey.includes("GENKIDAMA_3")) baseId = "GENKIDAMA_3";
        else baseId = "GENKIDAMA_1";
      } else if (projKey.includes("FECHO")) {
        baseId = "fechosenergia_1";
      } else {
        baseId = "PROJETIL_1";
      }
    }
    const updatedProj = keyManager.registerProjectile(
      projKey,
      baseId,
      current.name || projKey,
      resetProps,
    );

    if (
      destinationProjectileKey &&
      (projKey === "PROJETIL_1" ||
        projKey === "GENKIDAMA_1" ||
        projKey === "fechosenergia_1")
    ) {
      const destCurrent =
        localProjectileDatabase[destinationProjectileKey] || {};
      const destProps = {
        ...destCurrent,
        ...resetProps,
      };
      let destBaseId = "PROJETIL_1";
      if (destinationProjectileKey.includes("GENKIDAMA"))
        destBaseId = "GENKIDAMA_1";
      else if (destinationProjectileKey.includes("FECHO"))
        destBaseId = "fechosenergia_1";

      keyManager.registerProjectile(
        destinationProjectileKey,
        destBaseId,
        destCurrent.name || destinationProjectileKey,
        destProps,
      );
    }

    setLocalProjectileDatabase(keyManager.getAllProjectiles());
  };

  const handleRestoreProjectileConfig = (projKey: string) => {
    const current = localProjectileDatabase[projKey];
    if (!current) return;

    let baseId = (current as any).baseProjectileId;
    if (!baseId) {
      if (projKey.includes("GENKIDAMA")) {
        if (projKey.includes("GENKIDAMA_2")) baseId = "GENKIDAMA_2";
        else if (projKey.includes("GENKIDAMA_3")) baseId = "GENKIDAMA_3";
        else baseId = "GENKIDAMA_1";
      } else if (projKey.includes("FECHO")) {
        baseId = "fechosenergia_1";
      } else {
        baseId = "PROJETIL_1";
      }
    }

    const originalTemplate = PROJECTILE_DATABASE[projKey] || PROJECTILE_DATABASE[baseId] || PROJECTILE_DATABASE["PROJETIL_1"];
    if (!originalTemplate) return;

    const clonedOriginal = JSON.parse(JSON.stringify(originalTemplate));

    const restoredProps = {
      ...clonedOriginal,
      ownerCharacterId: (current as any).ownerCharacterId,
      ownerAnimationKey: (current as any).ownerAnimationKey,
      ownerCharacterName: (current as any).ownerCharacterName,
    };

    const keyManager = ProjectileConfigKeyManager.getInstance();
    keyManager.registerProjectile(
      projKey,
      baseId,
      current.name || originalTemplate.name || projKey,
      restoredProps,
    );

    if (
      destinationProjectileKey &&
      (projKey === "PROJETIL_1" ||
        projKey === "GENKIDAMA_1" ||
        projKey === "fechosenergia_1")
    ) {
      const destCurrent =
        localProjectileDatabase[destinationProjectileKey] || {};
      const destProps = {
        ...destCurrent,
        ...restoredProps,
      };
      let destBaseId = "PROJETIL_1";
      if (destinationProjectileKey.includes("GENKIDAMA"))
        destBaseId = "GENKIDAMA_1";
      else if (destinationProjectileKey.includes("FECHO"))
        destBaseId = "fechosenergia_1";

      keyManager.registerProjectile(
        destinationProjectileKey,
        destBaseId,
        destCurrent.name || destinationProjectileKey,
        destProps,
      );
    }

    setLocalProjectileDatabase(keyManager.getAllProjectiles());

    if (projKey === selectedProjectileFamilyId) {
      const partProps = restoredProps.middle || {};
      setProjectileAnimationContext({
        ...partProps,
        offsetX: partProps.offsetX !== undefined ? partProps.offsetX : 0,
        offsetY: partProps.offsetY !== undefined ? partProps.offsetY : 0,
      });
      setGenkidamaAnimationContext({
        ...partProps,
        offsetX: partProps.offsetX !== undefined ? partProps.offsetX : 0,
        offsetY: partProps.offsetY !== undefined ? partProps.offsetY : 0,
      });
      setEnergyClosureAnimationContext({
        ...partProps,
        offsetX: partProps.offsetX !== undefined ? partProps.offsetX : 0,
        offsetY: partProps.offsetY !== undefined ? partProps.offsetY : 0,
      });
    }

    setRestoredProjectileKey(projKey);
    setTimeout(() => {
      setRestoredProjectileKey(null);
    }, 2000);
  };

  const handleProjectileStyleChange = (
    projKey: string,
    field: string,
    value: any,
  ) => {
    const current = localProjectileDatabase[projKey];
    if (!current) return;

    const updatedProps = {
      ...current,
      [field]: value,
    };

    const keyManager = ProjectileConfigKeyManager.getInstance();
    let baseIdItem = (current as any).baseProjectileId;
    if (!baseIdItem) {
      if (projKey.includes("GENKIDAMA")) {
        if (projKey.includes("GENKIDAMA_2")) baseIdItem = "GENKIDAMA_2";
        else if (projKey.includes("GENKIDAMA_3")) baseIdItem = "GENKIDAMA_3";
        else baseIdItem = "GENKIDAMA_1";
      } else if (projKey.includes("FECHO")) {
        baseIdItem = "fechosenergia_1";
      } else {
        baseIdItem = "PROJETIL_1";
      }
    }
    const updatedProj = keyManager.registerProjectile(
      projKey,
      baseIdItem,
      current.name || projKey,
      updatedProps,
    );

    if (
      destinationProjectileKey &&
      (projKey === "PROJETIL_1" ||
        projKey === "GENKIDAMA_1" ||
        projKey === "fechosenergia_1")
    ) {
      const destCurrent =
        localProjectileDatabase[destinationProjectileKey] || {};
      const destProps = {
        ...destCurrent,
        [field]: value,
      };
      let destBaseId = "PROJETIL_1";
      if (destinationProjectileKey.includes("GENKIDAMA"))
        destBaseId = "GENKIDAMA_1";
      else if (destinationProjectileKey.includes("FECHO"))
        destBaseId = "fechosenergia_1";

      keyManager.registerProjectile(
        destinationProjectileKey,
        destBaseId,
        destCurrent.name || destinationProjectileKey,
        destProps,
      );
    }

    setLocalProjectileDatabase(keyManager.getAllProjectiles());
  };

  const handleMultipleConfigChanges = (
    updates: Partial<AnimationFrameData>,
  ) => {
    if (!config) return;

    // INTERCEPT: Automatically create a new custom key if a standard template aura is assigned to an animation
    if (updates.auraConfigKey !== undefined && updates.auraConfigKey !== "") {
      const selectedVal = updates.auraConfigKey;
      if (selectedVal && selectedVal.startsWith("AURA_")) {
        const auraMgr = AuraConfigKeyManager.getInstance();
        const baseAura =
          localAuraDatabase[selectedVal] || auraMgr.getAuraConfig(selectedVal);
        if (baseAura && selectedChar) {
          // Check if there is already a custom key registered for this character & state combination!
          const charKeys = Object.keys(localAuraDatabase);
          const existingKey = charKeys.find(
            (k) =>
              k.startsWith("CHAVE_") &&
              localAuraDatabase[k].ownerCharacterId === selectedChar.id &&
              localAuraDatabase[k].ownerAnimationKey === selectedState,
          );

          const useKey = existingKey || auraMgr.generateKey();

          const numPart = selectedVal.split("_")[1] || "1";
          const num = parseInt(numPart, 10);
          const newName = `Aura ${num} (${selectedChar.name})`;

          const baseDefaults =
            AuraConfigKeyManager.stdDefaults[selectedVal] || {};
          const clonedProps: Partial<ConfiguredAura> = {
            baseAuraId: selectedVal,
            color: baseAura.color ?? baseDefaults.color ?? "#ffffff",
            auraHueRotate:
              baseAura.auraHueRotate ?? baseDefaults.auraHueRotate ?? 0,
            auraSaturate:
              baseAura.auraSaturate ?? baseDefaults.auraSaturate ?? 1.0,
            auraBrightness:
              baseAura.auraBrightness ?? baseDefaults.auraBrightness ?? 1.0,
            auraContrast:
              baseAura.auraContrast ?? baseDefaults.auraContrast ?? 1.0,
            auraOpacity:
              baseAura.auraOpacity ?? baseDefaults.auraOpacity ?? 0.85,
            auraOffsetX: baseAura.auraOffsetX ?? baseDefaults.auraOffsetX ?? 0,
            auraOffsetY: baseAura.auraOffsetY ?? baseDefaults.auraOffsetY ?? 0,
            auraScaleX: baseAura.auraScaleX ?? baseDefaults.auraScaleX ?? 1.0,
            auraScaleY: baseAura.auraScaleY ?? baseDefaults.auraScaleY ?? 1.0,

            ownerCharacterId: selectedChar.id,
            ownerAnimationKey: selectedState,
            ownerCharacterName: selectedChar.name,
          };

          auraMgr.registerAura(useKey, selectedVal, newName, clonedProps);

          const allRegs = auraMgr.getAllAuras();
          setLocalAuraDatabase(allRegs);

          updates.auraConfigKey = useKey;
        }
      }
    }

    const nonKiUpdatesForConfig = isBeamOrProjTab
      ? Object.fromEntries(
          Object.entries(updates).filter(
            ([k]) => !["kiOriginX", "kiOriginY"].includes(k),
          ),
        )
      : updates;

    const newConfig = { ...config, ...nonKiUpdatesForConfig };
    setConfig(newConfig);

    if (isBeamOrProjTab) {
      const isBeamTab = activeTab === "BEAM";
      const kiUpdates = Object.fromEntries(
        Object.entries(updates).filter(([k]) =>
          ["kiOriginX", "kiOriginY"].includes(k),
        ),
      );

      if (Object.keys(kiUpdates).length > 0) {
        const animToUpdate =
          beamPreviewAnimation ||
          Object.keys(selectedChar.spriteConfig?.animations || {}).find(
            (k) =>
              selectedChar.spriteConfig?.animations?.[k]?.createsBeam ===
                selectedBeamFamilyId ||
              selectedChar.spriteConfig?.animations?.[k]?.projectileId ===
                selectedProjectileFamilyId,
          );
        if (animToUpdate) {
          setSelectedChar((prev) => {
            const updatedAnimations = prev.spriteConfig?.animations
              ? {
                  ...prev.spriteConfig.animations,
                  [animToUpdate]: {
                    ...prev.spriteConfig.animations[animToUpdate],
                    ...kiUpdates,
                  },
                }
              : {};
            return {
              ...prev,
              spriteConfig: prev.spriteConfig
                ? {
                    ...prev.spriteConfig,
                    animations: updatedAnimations,
                  }
                : prev.spriteConfig,
            };
          });
        }
      }

      const nonKiUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([k]) => !["kiOriginX", "kiOriginY"].includes(k),
        ),
      );

      if (Object.keys(nonKiUpdates).length > 0) {
        if (isBeamTab) {
          const isLegacy =
            !selectedBeamFamilyId.startsWith("CHAVE_BEAM_") &&
            !selectedBeamFamilyId.match(/_\d{3,4}$/) &&
            !destinationBeamKey;
          if (isLegacy) {
            const keyManager = BeamConfigKeyManager.getInstance();
            const newKey = keyManager.generateKey(selectedBeamFamilyId);
            const parentBeam = JSON.parse(
              JSON.stringify(
                localBeamDatabase[selectedBeamFamilyId] ||
                  BEAM_DATABASE[selectedBeamFamilyId] || {
                    name: "Custom Beam",
                    middle: {},
                  },
              ),
            );

            // Apply current edits (nonKiUpdates) directly during migration so they aren't discarded!
            const familyKeys = [
              "color",
              "beamBrightness",
              "beamOpacity",
              "collisionWidth",
              "collisionHeight",
            ];
            Object.entries(nonKiUpdates).forEach(([k, val]) => {
              if (familyKeys.includes(k)) {
                parentBeam[k] = val;
              } else {
                const part = selectedBeamPart as "start" | "middle" | "end";
                if (!parentBeam[part]) parentBeam[part] = {};
                parentBeam[part][k] = val;
              }
            });

            keyManager.registerBeam(
              newKey,
              selectedBeamFamilyId,
              parentBeam.name || "Custom Beam",
              parentBeam,
            );

            setSelectedChar((prev) => {
              const newChar = { ...prev };
              if (newChar.spriteConfig?.animations) {
                Object.keys(newChar.spriteConfig.animations).forEach(
                  (animKey) => {
                    const anim = newChar.spriteConfig!.animations![animKey];
                    if (anim && anim.createsBeam === selectedBeamFamilyId) {
                      newChar.spriteConfig!.animations![animKey] = {
                        ...anim,
                        createsBeam: newKey,
                      };
                    }
                  },
                );
              }
              return newChar;
            });

            setLocalBeamDatabase((prev) => ({
              ...prev,
              [newKey]: keyManager.getBeamConfig(newKey)!,
            }));

            setSelectedBeamFamilyId(newKey);
            return;
          }
          setSelectedChar((prev) => {
            const newChar = { ...prev };
            if (!newChar.beamOverrides) {
              newChar.beamOverrides = {};
            }
            const oldOverrides =
              newChar.beamOverrides[selectedBeamFamilyId] || {};
            const newOverrides = {
              start: oldOverrides.start ? { ...oldOverrides.start } : {},
              middle: oldOverrides.middle ? { ...oldOverrides.middle } : {},
              end: oldOverrides.end ? { ...oldOverrides.end } : {},
            };

            const part = selectedBeamPart as "start" | "middle" | "end";
            newOverrides[part] = {
              ...newOverrides[part],
              ...nonKiUpdates,
            };

            const syncKeys = ["scale", "beamSpacing"];
            const hasSyncUpdate = Object.keys(nonKiUpdates).some((k) =>
              syncKeys.includes(k),
            );
            if (hasSyncUpdate) {
              const additionalUpdates: any = {};
              if (nonKiUpdates.scale !== undefined)
                additionalUpdates.scale = nonKiUpdates.scale;
              if (nonKiUpdates.beamSpacing !== undefined)
                additionalUpdates.beamSpacing = nonKiUpdates.beamSpacing;

              newOverrides.start = {
                ...newOverrides.start,
                ...additionalUpdates,
              };
              newOverrides.middle = {
                ...newOverrides.middle,
                ...additionalUpdates,
              };
              newOverrides.end = { ...newOverrides.end, ...additionalUpdates };
            }

            newChar.beamOverrides[selectedBeamFamilyId] = newOverrides;
            if (destinationBeamKey) {
              const existingDestOverrides = newChar.beamOverrides[destinationBeamKey] || {};
              const updatedDestOverrides = {
                start: existingDestOverrides.start ? { ...existingDestOverrides.start } : {},
                middle: existingDestOverrides.middle ? { ...existingDestOverrides.middle } : {},
                end: existingDestOverrides.end ? { ...existingDestOverrides.end } : {},
              };
              updatedDestOverrides[part] = {
                ...updatedDestOverrides[part],
                ...nonKiUpdates,
              };
              if (hasSyncUpdate) {
                const additionalUpdates: any = {};
                if (nonKiUpdates.scale !== undefined)
                  additionalUpdates.scale = nonKiUpdates.scale;
                if (nonKiUpdates.beamSpacing !== undefined)
                  additionalUpdates.beamSpacing = nonKiUpdates.beamSpacing;

                updatedDestOverrides.start = {
                  ...updatedDestOverrides.start,
                  ...additionalUpdates,
                };
                updatedDestOverrides.middle = {
                  ...updatedDestOverrides.middle,
                  ...additionalUpdates,
                };
                updatedDestOverrides.end = {
                  ...updatedDestOverrides.end,
                  ...additionalUpdates,
                };
              }
              newChar.beamOverrides[destinationBeamKey] = updatedDestOverrides;
            }
            return newChar;
          });

          setLocalBeamDatabase((prev) => {
            const family = prev[selectedBeamFamilyId];
            if (!family) return prev;
            const newFamily = { ...family };

            const syncKeys = ["scale", "beamSpacing"];
            const hasSyncUpdate = Object.keys(nonKiUpdates).some((k) =>
              syncKeys.includes(k),
            );

            if (hasSyncUpdate) {
              const additionalUpdates: any = {};
              if (nonKiUpdates.scale !== undefined)
                additionalUpdates.scale = nonKiUpdates.scale;
              if (nonKiUpdates.beamSpacing !== undefined)
                additionalUpdates.beamSpacing = nonKiUpdates.beamSpacing;

              newFamily.start = { ...newFamily.start, ...additionalUpdates };
              newFamily.middle = { ...newFamily.middle, ...additionalUpdates };
              newFamily.end = { ...newFamily.end, ...additionalUpdates };
            }

            newFamily[selectedBeamPart as "start" | "middle" | "end"] = {
              ...newFamily[selectedBeamPart as "start" | "middle" | "end"],
              ...nonKiUpdates,
            };

            const nextDb = {
              ...prev,
              [selectedBeamFamilyId]: newFamily,
            };

            if (destinationBeamKey) {
              const keyManager = BeamConfigKeyManager.getInstance();
              const existingDestBeam = prev[destinationBeamKey] || keyManager.getBeamConfig(destinationBeamKey) || {};
              const updatedDestBeam = {
                ...existingDestBeam,
                id: destinationBeamKey,
                configKey: destinationBeamKey,
                start: existingDestBeam.start ? { ...existingDestBeam.start } : {},
                middle: existingDestBeam.middle ? { ...existingDestBeam.middle } : {},
                end: existingDestBeam.end ? { ...existingDestBeam.end } : {},
              };
              updatedDestBeam[selectedBeamPart as "start" | "middle" | "end"] = {
                ...updatedDestBeam[selectedBeamPart as "start" | "middle" | "end"],
                ...nonKiUpdates,
              };

              if (hasSyncUpdate) {
                const additionalUpdates: any = {};
                if (nonKiUpdates.scale !== undefined)
                  additionalUpdates.scale = nonKiUpdates.scale;
                if (nonKiUpdates.beamSpacing !== undefined)
                  additionalUpdates.beamSpacing = nonKiUpdates.beamSpacing;

                if (updatedDestBeam.start)
                  updatedDestBeam.start = { ...updatedDestBeam.start, ...additionalUpdates };
                if (updatedDestBeam.middle)
                  updatedDestBeam.middle = {
                    ...updatedDestBeam.middle,
                    ...additionalUpdates,
                  };
                if (updatedDestBeam.end)
                  updatedDestBeam.end = { ...updatedDestBeam.end, ...additionalUpdates };
              }

              keyManager.registerBeam(
                destinationBeamKey,
                existingDestBeam.baseBeamId || "BEAM",
                localBeamDatabase[destinationBeamKey]?.name ||
                  destinationBeamKey,
                updatedDestBeam,
              );
              nextDb[destinationBeamKey] = updatedDestBeam;
            }

            return nextDb;
          });
        } else {
          // It's a projectile tab (KI_BLAST, GENKIDAMA, fechosenergia)
          const isLegacy =
            !selectedProjectileFamilyId.startsWith("CHAVE_PROJ_") &&
            !selectedProjectileFamilyId.startsWith("CHAVE_PROJETIL_") &&
            !selectedProjectileFamilyId.startsWith("CHAVE_GENKIDAMA_") &&
            !selectedProjectileFamilyId.startsWith("CHAVE_FECHO_") &&
            !selectedProjectileFamilyId.match(/_\d{3,4}$/) &&
            !destinationProjectileKey;
          if (isLegacy) {
            const keyManager = ProjectileConfigKeyManager.getInstance();
            const newKey = keyManager.generateKey(selectedProjectileFamilyId);
            const parentProj = JSON.parse(
              JSON.stringify(
                localProjectileDatabase[selectedProjectileFamilyId] ||
                  PROJECTILE_DATABASE[selectedProjectileFamilyId] || {
                    name: "Custom Projectile",
                    middle: {},
                  },
              ),
            );

            const familyKeys = [
              "color",
              "behavior",
              "maxScale",
              "projectileOpacity",
              "projectileBrightness",
              "projectileHueRotate",
              "projectileSaturate",
              "projectileContrast",
            ];
            Object.entries(nonKiUpdates).forEach(([k, val]) => {
              if (familyKeys.includes(k)) {
                parentProj[k] = val;
              } else {
                if (!parentProj.middle) parentProj.middle = {};
                parentProj.middle[k] = val;
              }
            });

            keyManager.registerProjectile(
              newKey,
              selectedProjectileFamilyId,
              parentProj.name || "Custom Projectile",
              parentProj,
            );

            setSelectedChar((prev) => {
              const newChar = { ...prev };
              if (newChar.spriteConfig?.animations) {
                Object.keys(newChar.spriteConfig.animations).forEach(
                  (animKey) => {
                    const anim = newChar.spriteConfig!.animations![animKey];
                    if (
                      anim &&
                      anim.projectileId === selectedProjectileFamilyId
                    ) {
                      newChar.spriteConfig!.animations![animKey] = {
                        ...anim,
                        projectileId: newKey,
                      };
                    }
                  },
                );
              }
              return newChar;
            });

            setLocalProjectileDatabase((prev) => ({
              ...prev,
              [newKey]: keyManager.getProjectileConfig(newKey)!,
            }));

            setSelectedProjectileFamilyId(newKey);
            setSelectedBeamFamilyId(newKey);
            return;
          }

          setSelectedChar((prev) => {
            const newChar = { ...prev } as any;
            if (!newChar.projectileOverrides) {
              newChar.projectileOverrides = {};
            }
            const oldOverrides =
              newChar.projectileOverrides[selectedProjectileFamilyId] || {};
            const newOverrides = {
              middle: oldOverrides.middle ? { ...oldOverrides.middle } : {},
            };

            newOverrides.middle = {
              ...newOverrides.middle,
              ...nonKiUpdates,
            };

            const syncKeys = ["scale"];
            const hasSyncUpdate = Object.keys(nonKiUpdates).some((k) =>
              syncKeys.includes(k),
            );
            if (hasSyncUpdate) {
              const additionalUpdates: any = {};
              if (nonKiUpdates.scale !== undefined)
                additionalUpdates.scale = nonKiUpdates.scale;

              newOverrides.middle = {
                ...newOverrides.middle,
                ...additionalUpdates,
              };
            }

            newChar.projectileOverrides[selectedProjectileFamilyId] =
              newOverrides;
            if (destinationProjectileKey) {
              newChar.projectileOverrides[destinationProjectileKey] =
                JSON.parse(JSON.stringify(newOverrides));
            }
            return newChar;
          });

          setLocalProjectileDatabase((prev) => {
            const family = prev[selectedProjectileFamilyId];
            if (!family) return prev;
            const newFamily = { ...family };

            newFamily.middle = {
              ...newFamily.middle,
              ...nonKiUpdates,
            };

            const nextDb = {
              ...prev,
              [selectedProjectileFamilyId]: newFamily,
            };

            if (destinationProjectileKey) {
              const keyManager = ProjectileConfigKeyManager.getInstance();
              let destBaseId = "PROJETIL_1";
              if (destinationProjectileKey.includes("GENKIDAMA"))
                destBaseId = "GENKIDAMA_1";
              else if (destinationProjectileKey.includes("FECHO"))
                destBaseId = "fechosenergia_1";

              keyManager.registerProjectile(
                destinationProjectileKey,
                destBaseId,
                localProjectileDatabase[destinationProjectileKey]?.name ||
                  destinationProjectileKey,
                newFamily,
              );

              nextDb[destinationProjectileKey] = {
                ...nextDb[destinationProjectileKey],
                ...newFamily,
                id: destinationProjectileKey,
                configKey: destinationProjectileKey,
              };
            }

            return nextDb;
          });
        }
      }
      return;
    }

    if (activeCategory !== "CHARACTER") {
      console.log("[handleMultipleConfigChanges] Skipped character update for system category:", activeCategory);
      return;
    }

    setEditedAnimationKeys((prev) => ({
      ...prev,
      [selectedState]: true,
    }));

    setSelectedChar((prev) => {
      const newChar = { ...prev };
      if (newChar.spriteConfig && newChar.spriteConfig.animations) {
        const newAnimations = {
          ...newChar.spriteConfig.animations,
          [selectedState]: newConfig,
        };

        const syncKeys = ["scale", "kiOriginX", "kiOriginY"];
        const hasSyncUpdate = Object.keys(updates).some(
          (k) => syncKeys.includes(k) || k === "beamSpacing",
        );

        const kiUpdates = Object.fromEntries(
          Object.entries(updates).filter(([k]) =>
            ["kiOriginX", "kiOriginY"].includes(k),
          ),
        );
        if (Object.keys(kiUpdates).length > 0) {
          Object.keys(newAnimations).forEach((k) => {
            if (newAnimations[k]) {
              newAnimations[k] = { ...newAnimations[k], ...kiUpdates };
            }
          });
        }

        if (updates.scale !== undefined || updates.beamSpacing !== undefined) {
          if (selectedState && selectedState.includes("BEAM_")) {
            let startKey = selectedState
              .replace("MIDDLE", "START")
              .replace("END", "START");
            let midKey = selectedState
              .replace("START", "MIDDLE")
              .replace("END", "MIDDLE");
            let endKey = selectedState
              .replace("START", "END")
              .replace("MIDDLE", "END");

            let additionalUpdates: any = {};
            if (updates.scale !== undefined)
              additionalUpdates.scale = updates.scale;
            if (updates.beamSpacing !== undefined)
              additionalUpdates.beamSpacing = updates.beamSpacing;

            [startKey, midKey, endKey].forEach((k) => {
              if (k !== selectedState && newAnimations[k]) {
                newAnimations[k] = {
                  ...newAnimations[k],
                  ...additionalUpdates,
                };
              }
            });
          }
        }

        newChar.spriteConfig = {
          ...newChar.spriteConfig,
          animations: newAnimations,
          ...kiUpdates,
        };
      }
      return newChar;
    });
  };

  const handleRenameAnimation = (oldKey: string, newKey: string) => {
    if (!newKey || newKey.trim() === "" || oldKey === newKey) return;
    newKey = newKey.trim();

    if (selectedChar.spriteConfig?.animations[newKey]) {
      alert("Já existe uma animação com esse nome!");
      return;
    }

    setSelectedChar((prev) => {
      const newChar = { ...prev };
      if (newChar.spriteConfig) {
        const animations = { ...newChar.spriteConfig.animations };
        if (animations[oldKey]) {
          animations[newKey] = { ...animations[oldKey] };
          delete animations[oldKey];
          newChar.spriteConfig = {
            ...newChar.spriteConfig,
            animations,
          };
        }
      }
      return newChar;
    });

    const updatedGroups = { ...animationGroups };
    for (const gKey of Object.keys(updatedGroups)) {
      updatedGroups[gKey] = updatedGroups[gKey].map((anim) =>
        anim === oldKey ? newKey : anim,
      );
    }
    setAnimationGroups(updatedGroups);
    if (selectedChar.spriteConfig) {
      selectedChar.spriteConfig.animationSequences = updatedGroups;
    }

    if (selectedState === oldKey) {
      setSelectedState(newKey);
    }

    if (activeSequence) {
      setActiveSequence((prev) =>
        prev ? prev.map((anim) => (anim === oldKey ? newKey : anim)) : null,
      );
    }

    alert(`Animação renomeada de '${oldKey}' para '${newKey}' com sucesso!`);
  };

  const handleCreateAnimationInGroup = (groupKey: string) => {
    const groupAnims = animationGroups[groupKey] || [];
    let nextKey = "";

    if (groupAnims.length > 0) {
      let maxSuffix = 0;
      groupAnims.forEach((anim) => {
        const matchSuffix = anim.match(/_(\d+)$/);
        if (matchSuffix) {
          const num = parseInt(matchSuffix[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        }
      });

      const hasDigitEnd = groupKey.match(/_\d+$/);
      if (hasDigitEnd) {
        nextKey = `${groupKey}_${maxSuffix + 1}`;
      } else {
        nextKey = `${groupKey}_${maxSuffix + 1}`;
      }
    } else {
      nextKey = `${groupKey}_1`;
    }

    setSelectedChar((prev) => {
      const newChar = { ...prev };
      if (newChar.spriteConfig) {
        const animations = { ...newChar.spriteConfig.animations };
        const currentConfig = animations[selectedState] || {};
        animations[nextKey] = {
          ...currentConfig,
          frames: currentConfig.frames || 1,
          speed: currentConfig.speed || 5,
          loop: currentConfig.loop !== undefined ? currentConfig.loop : true,
        };
        newChar.spriteConfig = {
          ...newChar.spriteConfig,
          animations,
        };
      }
      return newChar;
    });

    const nextGroups = { ...animationGroups };
    if (!nextGroups[groupKey]) {
      nextGroups[groupKey] = [];
    }
    if (!nextGroups[groupKey].includes(nextKey)) {
      nextGroups[groupKey].push(nextKey);
    }
    nextGroups[groupKey].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    setAnimationGroups(nextGroups);
    if (selectedChar.spriteConfig) {
      selectedChar.spriteConfig.animationSequences = nextGroups;
    }

    setSelectedState(nextKey);
    setFrameIndex(0);
    alert(
      `Nova animação '${nextKey}' criada com sucesso clonando '${selectedState}' e agrupada em '${groupKey}'!`,
    );
  };

  const handleAddAnimationToGroup = (groupKey: string, animKey: string) => {
    if (!animKey || animKey === "") return;
    const nextGroups = { ...animationGroups };

    for (const gk of Object.keys(nextGroups)) {
      nextGroups[gk] = nextGroups[gk].filter((k) => k !== animKey);
    }

    if (!nextGroups[groupKey]) {
      nextGroups[groupKey] = [];
    }
    nextGroups[groupKey].push(animKey);
    nextGroups[groupKey].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    setAnimationGroups(nextGroups);
    if (selectedChar.spriteConfig) {
      selectedChar.spriteConfig.animationSequences = nextGroups;
    }
  };

  const copyAllCharConfigs = () => {
    if (!selectedChar || !selectedChar.spriteConfig) return;

    // Compile custom beams configured for this character in localBeamDatabase
    const keyManager = BeamConfigKeyManager.getInstance();
    const characterBeams: Record<string, any> = {};
    const auraKeyManager = AuraConfigKeyManager.getInstance();
    const characterAuras: Record<string, any> = {};
    const animations = selectedChar.spriteConfig.animations || {};

    const editedAnims: Record<string, any> = {};
    Object.keys(animations).forEach((animKey) => {
      const isEdited = (() => {
        if (editedAnimationKeys[animKey]) return true;
        const baseChar = BASE_CHARACTERS.find((c) => c.id === selectedChar.id);
        const baseAnim = baseChar?.spriteConfig?.animations?.[animKey];
        const currentAnim = animations[animKey];
        if (!currentAnim) return false;
        if (!baseAnim) return true;
        return JSON.stringify(currentAnim) !== JSON.stringify(baseAnim);
      })();

      if (isEdited) {
        editedAnims[animKey] = animations[animKey];
      }
    });

    // Gather beams and auras from ALL of this character's animations so that custom/configured assets are never missed!
    Object.keys(animations).forEach((animKey) => {
      const anim = animations[animKey];
      if (anim && anim.createsBeam) {
        const bId = anim.createsBeam;
        const beamCfg = localBeamDatabase[bId] || keyManager.getBeamConfig(bId);
        if (beamCfg) {
          characterBeams[bId] = beamCfg;
        }
      }
      if (anim && anim.auraConfigKey) {
        const aId = anim.auraConfigKey;
        const auraCfg = localAuraDatabase[aId] || auraKeyManager.getAuraConfig(aId);
        if (auraCfg) {
          characterAuras[aId] = auraCfg;
        }
      }
    });

    const cleaned = cleanObj(editedAnims);
    const formatJson = JSON.stringify(cleaned, null, 4);

    let extraExplanationText = "";
    if (Object.keys(characterBeams).length > 0) {
      extraExplanationText += `\n\n// =========================================================================\n// 📦 BANCO DE BEAMS CUSTOMIZADOS DESTE PERSONAGEM\n// (Adicione ao arquivo BeamDatabase.ts se forem novos Beams customizados):\n// =========================================================================\nconst My_Character_Beams = ${JSON.stringify(cleanObj(characterBeams), null, 4)};`;
    }
    if (Object.keys(characterAuras).length > 0) {
      const cleanedAuras: Record<string, any> = {};
      Object.keys(characterAuras).forEach((aId) => {
        const auraCfg = JSON.parse(JSON.stringify(characterAuras[aId]));
        delete auraCfg.id;
        delete auraCfg.configKey;
        cleanedAuras[aId] = auraCfg;
      });
      extraExplanationText += `\n\n// =========================================================================\n// ✨ BANCO DE AURAS CUSTOMIZADAS DESTE PERSONAGEM\n// (Adicione ao banco de dados ou inicializador do AuraConfigKeyManager):\n// =========================================================================\nconst My_Character_Auras = ${JSON.stringify(cleanObj(cleanedAuras), null, 4)};`;
    }

    const clipboardText =
      `// =========================================================================\n// 🥋 APENAS AS ANIMAÇÕES EDITADAS DO PERSONAGEM: ${selectedChar.name}\n// Copie e cole dentro do objeto "animations" no arquivo do personagem.\n// =========================================================================\n` +
      formatJson +
      extraExplanationText;

    try {
      navigator.clipboard.writeText(clipboardText);
    } catch (e) {
      console.warn("Clipboard auto-write blocked:", e);
    }

    setCopiedData({
      title: `Animações Editadas do Personagem: ${selectedChar.name}`,
      text: clipboardText,
    });
  };

  const copyToClipboard = () => {
    let targetTab = activeTab;
    if (activeTab === "BEAMS_MANAGER") {
      if (activeManagerClass === "AURA") targetTab = "AURAS";
      else if (activeManagerClass === "BEAM") targetTab = "BEAM";
      else if (activeManagerClass === "GENKIDAMA") targetTab = "GENKIDAMA";
      else if (activeManagerClass === "VFX") targetTab = "VFX";
      else if (
        activeManagerClass === "PROJECTILE" ||
        activeManagerClass === "FECHO"
      )
        targetTab = "KI_BLAST";
    }

    let actualBeamId = selectedBeamFamilyId;
    if (targetTab === "BEAM" && destinationBeamKey) {
      actualBeamId = destinationBeamKey;
    }

    let actualProjectileId = selectedProjectileFamilyId;
    if (
      (targetTab === "KI_BLAST" ||
        targetTab === "fechosenergia" ||
        targetTab === "GENKIDAMA") &&
      destinationProjectileKey
    ) {
      actualProjectileId = destinationProjectileKey;
    }

    if (targetTab === "AURAS") {
      const currentAura = localAuraDatabase[selectedAuraKey];
      if (!currentAura) {
        alert("Nenhuma configuração de Aura selecionada!");
        return;
      }

      const auraDbObj = JSON.parse(JSON.stringify(currentAura));
      delete auraDbObj.id;
      delete auraDbObj.configKey;

      // Resolve correct owner animation key and config for Aura
      let ownerAnimKey = selectedState;
      let ownerAnimConfig = selectedChar?.spriteConfig?.animations?.[selectedState] || characterAnimationContext;
      if (selectedChar?.spriteConfig?.animations) {
        const foundKey = Object.keys(selectedChar.spriteConfig.animations).find(
          (k) => {
            const animAuraKey = selectedChar.spriteConfig!.animations![k]?.auraConfigKey;
            return animAuraKey === selectedAuraKey;
          }
        );
        if (foundKey) {
          ownerAnimKey = foundKey;
          ownerAnimConfig = selectedChar.spriteConfig.animations[foundKey];
        }
      }

      const animObj = ownerAnimConfig
        ? {
            [ownerAnimKey]: {
              ...ownerAnimConfig,
              offsetX: ownerAnimConfig.offsetX || 0,
              offsetY: ownerAnimConfig.offsetY || 0,
              auraConfigKey: selectedAuraKey,
            },
          }
        : null;

      const animText = animObj
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${ownerAnimKey}": ${JSON.stringify(animObj[ownerAnimKey], null, 4)},\n\n`
        : "";

      const clipboardText = `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DA AURA EXCLUSIVA (${selectedAuraKey})
// Personagem: ${selectedChar?.name || "Personagem"} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}// 2. CONFIGURAÇÃO DA AURA EXCLUSIVA (Adicione ao banco de dados ou inicializador do AuraConfigKeyManager):
"${selectedAuraKey}": ${JSON.stringify(cleanObj(auraDbObj), null, 4)}
`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (e) {
        console.warn("Clipboard auto-write blocked:", e);
      }
      setCopiedData({
        title: `Configuração Completa da Aura: ${selectedAuraKey}`,
        text: clipboardText,
      });
      return;
    }

    if (targetTab === "BEAM") {
      const currentBeam =
        localBeamDatabase[actualBeamId] ||
        localBeamDatabase[selectedBeamFamilyId];
      if (!currentBeam) return;

      const overridesObj: any = {
        start: currentBeam.start ? { ...currentBeam.start } : undefined,
        middle: currentBeam.middle ? { ...currentBeam.middle } : undefined,
        end: currentBeam.end ? { ...currentBeam.end } : undefined,
      };

      if (currentBeam.color !== undefined) overridesObj.color = currentBeam.color;
      if (currentBeam.beamOpacity !== undefined) overridesObj.beamOpacity = currentBeam.beamOpacity;
      if (currentBeam.beamBrightness !== undefined) overridesObj.beamBrightness = currentBeam.beamBrightness;
      if (currentBeam.beamHueRotate !== undefined) overridesObj.beamHueRotate = currentBeam.beamHueRotate;
      if (currentBeam.beamSaturate !== undefined) overridesObj.beamSaturate = currentBeam.beamSaturate;
      if (currentBeam.beamContrast !== undefined) overridesObj.beamContrast = currentBeam.beamContrast;
      if (currentBeam.rotation !== undefined) overridesObj.rotation = currentBeam.rotation;
      if (currentBeam.name !== undefined) overridesObj.name = currentBeam.name;

      const beamDbObj = JSON.parse(JSON.stringify(currentBeam));
      delete beamDbObj.id;
      delete beamDbObj.configKey;
      delete beamDbObj.baseBeamId;
      delete beamDbObj.ownerCharacterId;
      delete beamDbObj.ownerAnimationKey;
      delete beamDbObj.ownerCharacterName;

      // Resolve correct owner animation key and config instead of just selectedState
      let ownerAnimKey = selectedState;
      let ownerAnimConfig = selectedChar?.spriteConfig?.animations?.[selectedState] || characterAnimationContext;
      if (selectedChar?.spriteConfig?.animations) {
        const foundKey = Object.keys(selectedChar.spriteConfig.animations).find(
          (k) => {
            const animBeam = selectedChar.spriteConfig!.animations![k]?.createsBeam;
            return animBeam === selectedBeamFamilyId || 
                   animBeam === destinationBeamKey || 
                   animBeam === "BEAM";
          }
        );
        if (foundKey) {
          ownerAnimKey = foundKey;
          ownerAnimConfig = selectedChar.spriteConfig.animations[foundKey];
        }
      }

      const animObj = ownerAnimConfig
        ? {
            [ownerAnimKey]: {
              ...ownerAnimConfig,
              offsetX: ownerAnimConfig.offsetX || 0,
              offsetY: ownerAnimConfig.offsetY || 0,
              createsBeam: actualBeamId,
            },
          }
        : null;

      const animText = animObj
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${ownerAnimKey}": ${JSON.stringify(animObj[ownerAnimKey], null, 4)},\n\n`
        : "";

      const clipboardText = `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DO BEAM / FEIXE DE ENERGIA (${actualBeamId})
// Personagem: ${selectedChar?.name || "Personagem"} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}// 2. OVERRIDES DO PERSONAGEM (Copie e cole no arquivo *_Beams.ts do seu personagem para ajustar a posição e tamanho dos segmentos do feixe):
"${actualBeamId}": ${JSON.stringify(cleanObj(overridesObj), null, 4)},

// 3. SE FOR UM BEAM CUSTOMIZADO / NOVA COR, ADICIONE ISSO NO BANCO DE BEAMS (BeamDatabase.ts):
"${actualBeamId}": ${JSON.stringify(cleanObj(beamDbObj), null, 4)}
`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (e) {
        console.warn("Clipboard auto-write blocked:", e);
      }
      setCopiedData({
        title: `Configuração do Beam: ${actualBeamId}`,
        text: clipboardText,
      });
      return;
    }

    if (targetTab === "GENKIDAMA") {
      const currentProj =
        localProjectileDatabase[actualProjectileId] ||
        localProjectileDatabase[selectedProjectileFamilyId];
      if (!currentProj) return;

      const projectileDbObj = JSON.parse(JSON.stringify(currentProj));
      delete projectileDbObj.id;
      delete projectileDbObj.configKey;
      delete projectileDbObj.baseProjectileId;
      delete projectileDbObj.ownerCharacterId;
      delete projectileDbObj.ownerAnimationKey;
      delete projectileDbObj.ownerCharacterName;

      // Provide defaults/fallbacks for safety if not explicitly defined
      if (projectileDbObj.color === undefined) projectileDbObj.color = "#ffffff";
      if (projectileDbObj.projectileOpacity === undefined) projectileDbObj.projectileOpacity = 1;
      if (projectileDbObj.projectileBrightness === undefined) projectileDbObj.projectileBrightness = 1;

      const middleGif =
        currentProj.middle?.imageUrl ||
        "/Assets/especiais/bolasenergia/genkidamas/1/1.gif";
      let endGif =
        "/Assets/especiais/bolasenergia/genkidamas/1/2.gif";

      const explodeProj =
        localProjectileDatabase[actualProjectileId + "_EXPLODE"] ||
        localProjectileDatabase["GENKIDAMA_1_EXPLODE"];
      if (explodeProj && explodeProj.middle) {
        endGif = explodeProj.middle.imageUrl || endGif;
      }

      const charAnim = selectedChar?.spriteConfig?.animations?.[selectedState] || characterAnimationContext;

      const clipboardText = `// =========================================================================
// CONFIGURAÇÕES DA GENKIDAMA COM CHAVE EXCLUSIVA (${actualProjectileId})
// Personagem: ${selectedChar?.name || "Personagem"} | Animação: ${selectedState}
// =========================================================================

// 1. ANIMAÇÕES DO PERSONAGEM (Substitua ou adicione no objeto "animations" dentro do arquivo do seu personagem):
"${selectedState}": {
    "imageUrl": "${charAnim?.imageUrl || ""}",
    "frames": ${charAnim?.frames || 1},
    "projectileId": "${actualProjectileId}"
},
"GENKIDAMA": {
    "imageUrl": "${middleGif}",
    "frames": 1,
    "loop": true,
    "projectileId": "${actualProjectileId}"
},
"GENKIDAMA_FINAL": {
    "imageUrl": "${endGif}",
    "frames": 1,
    "loop": false,
    "projectileId": "${actualProjectileId}"
},

// 2. BANCO DE PROJÉTEIS (Adicione ao arquivo ProjectileDatabase.ts para novas cores e contorno):
"${actualProjectileId}": ${JSON.stringify(projectileDbObj, null, 4)}
`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (e) {
        console.warn("Clipboard auto-write blocked:", e);
      }
      setCopiedData({
        title: `Configuração da Genkidama: ${actualProjectileId}`,
        text: clipboardText,
      });
      return;
    }

    if (targetTab === "KI_BLAST" || targetTab === "fechosenergia") {
      const currentProj =
        localProjectileDatabase[actualProjectileId] ||
        localProjectileDatabase[selectedProjectileFamilyId];
      if (!currentProj) return;

      const overridesObj: any = {
        middle: currentProj.middle ? { ...currentProj.middle } : undefined,
      };

      if (currentProj.color !== undefined) overridesObj.color = currentProj.color;
      if (currentProj.projectileOpacity !== undefined) overridesObj.projectileOpacity = currentProj.projectileOpacity;
      if (currentProj.projectileBrightness !== undefined) overridesObj.projectileBrightness = currentProj.projectileBrightness;
      if (currentProj.rotation !== undefined) overridesObj.rotation = currentProj.rotation;
      if (currentProj.name !== undefined) overridesObj.name = currentProj.name;

      const projectileDbObj = JSON.parse(JSON.stringify(currentProj));
      delete projectileDbObj.id;
      delete projectileDbObj.configKey;
      delete projectileDbObj.baseProjectileId;
      delete projectileDbObj.ownerCharacterId;
      delete projectileDbObj.ownerAnimationKey;
      delete projectileDbObj.ownerCharacterName;

      const charAnim = selectedChar?.spriteConfig?.animations?.[selectedState] || characterAnimationContext;
      const animObj = charAnim
        ? {
            [selectedState]: {
              ...charAnim,
              offsetX: charAnim.offsetX || 0,
              offsetY: charAnim.offsetY || 0,
              projectileId: actualProjectileId,
            },
          }
        : null;

      const animText = animObj
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${selectedState}": ${JSON.stringify(animObj[selectedState], null, 4)},\n\n`
        : "";

      const clipboardText = `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DO PROJÉTIL / ESFERA DE ENERGIA (${actualProjectileId})
// Personagem: ${selectedChar?.name || "Personagem"} | Animação: ${selectedState}
// =========================================================================

${animText}// 2. OVERRIDES DO PERSONAGEM (Copie e adicione ao arquivo *_Beams.ts do seu personagem para ajustar posições e escalas na tela):
"${actualProjectileId}": ${JSON.stringify(cleanObj(overridesObj), null, 4)},

// 3. SE FOR UM PROJÉTIL CUSTOMIZADO / NOVA COR, ADICIONE ISSO NO BANCO DE PROJÉTEIS (ProjectileDatabase.ts):
"${actualProjectileId}": ${JSON.stringify(cleanObj(projectileDbObj), null, 4)}
`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (e) {
        console.warn("Clipboard auto-write blocked:", e);
      }
      setCopiedData({
        title: `Configuração do Projétil: ${actualProjectileId}`,
        text: clipboardText,
      });
      return;
    }

    if (targetTab === "VFX" || targetTab === "EFFECT") {
      const currentEffect = localEffectDatabase[selectedEffectKey];
      if (!currentEffect) {
        alert("Nenhuma configuração de Efeito/VFX selecionada!");
        return;
      }

      const effectDbObj = JSON.parse(JSON.stringify(currentEffect));
      delete effectDbObj.id;
      delete effectDbObj.configKey;
      delete effectDbObj.baseEffectId;
      delete effectDbObj.ownerCharacterId;
      delete effectDbObj.ownerAnimationKey;
      delete effectDbObj.ownerCharacterName;

      // Garantir que color esteja presente para exportação
      if (!effectDbObj.color) {
        effectDbObj.color = "#ffffff";
      }

      // Resolve correct owner animation key and config for VFX
      let ownerAnimKey = selectedState;
      let ownerAnimConfig = selectedChar?.spriteConfig?.animations?.[selectedState] || characterAnimationContext;
      if (selectedChar?.spriteConfig?.animations) {
        const foundKey = Object.keys(selectedChar.spriteConfig.animations).find(
          (k) => {
            const animEffectKey = selectedChar.spriteConfig!.animations![k]?.effectConfigKey;
            return animEffectKey === selectedEffectKey;
          }
        );
        if (foundKey) {
          ownerAnimKey = foundKey;
          ownerAnimConfig = selectedChar.spriteConfig.animations[foundKey];
        }
      }

      const animObj = ownerAnimConfig
        ? {
            [ownerAnimKey]: {
              ...ownerAnimConfig,
              offsetX: ownerAnimConfig.offsetX || 0,
              offsetY: ownerAnimConfig.offsetY || 0,
              effectConfigKey: selectedEffectKey,
            },
          }
        : null;

      const animText = animObj
        ? `// 1. ANIMAÇÃO DO PERSONAGEM (Copie e cole/substitua no objeto "animations" dentro do arquivo do seu personagem):\n"${ownerAnimKey}": ${JSON.stringify(animObj[ownerAnimKey], null, 4)},\n\n`
        : "";

      const clipboardText = `// =========================================================================
// CONFIGURAÇÕES COMPLETAS DO EFEITO / VFX EXCLUSIVO (${selectedEffectKey})
// Personagem: ${selectedChar?.name || "Personagem"} | Animação: ${ownerAnimKey}
// =========================================================================

${animText}// 2. CONFIGURAÇÃO DO EFEITO / VFX EXCLUSIVO (Adicione ao banco de dados ou inicializador do EffectConfigKeyManager):
"${selectedEffectKey}": ${JSON.stringify(cleanObj(effectDbObj), null, 4)}
`;

      try {
        navigator.clipboard.writeText(clipboardText);
      } catch (e) {
        console.warn("Clipboard auto-write blocked:", e);
      }
      setCopiedData({
        title: `Configuração Completa do Efeito VFX: ${selectedEffectKey}`,
        text: clipboardText,
      });
      return;
    }

    if (!config) return;

    let beamText = "";
    const beamId = config.createsBeam;
    if (beamId) {
      const currentBeam = localBeamDatabase[beamId];
      if (currentBeam) {
        const overridesObj = {
          start: currentBeam.start ? { ...currentBeam.start } : undefined,
          middle: currentBeam.middle ? { ...currentBeam.middle } : undefined,
          end: currentBeam.end ? { ...currentBeam.end } : undefined,
        };
        const beamDbObj = JSON.parse(JSON.stringify(currentBeam));
        delete beamDbObj.id;
        delete beamDbObj.configKey;
        delete beamDbObj.baseBeamId;
        delete beamDbObj.ownerCharacterId;
        delete beamDbObj.ownerAnimationKey;
        delete beamDbObj.ownerCharacterName;

        beamText = `\n\n// ========================================== \n// ⚡ BEAM VINCULADO / ATRIBUÍDO A ESTA ANIMAÇÃO (${beamId}):\n// Copie e cole no arquivo *_Beams.ts do seu personagem:\n"${beamId}": ${JSON.stringify(cleanObj(overridesObj), null, 4)},\n\n// Se for um novo Beam customizado, adicione no BeamDatabase.ts:\n"${beamId}": ${JSON.stringify(cleanObj(beamDbObj), null, 4)}`;
      }
    }

    const formatJson = JSON.stringify(
      {
        [selectedState]: {
          ...config,
          offsetX: config.offsetX || 0,
          offsetY: config.offsetY || 0,
        },
      },
      null,
      4,
    );

    let auraText = "";
    const auraId = config.auraConfigKey;
    if (auraId) {
      const currentAura = localAuraDatabase[auraId] || AuraConfigKeyManager.getInstance().getAuraConfig(auraId);
      if (currentAura) {
        const auraDbObj = JSON.parse(JSON.stringify(currentAura));
        delete auraDbObj.id;
        delete auraDbObj.configKey;
        delete auraDbObj.ownerCharacterId;
        delete auraDbObj.ownerAnimationKey;
        delete auraDbObj.ownerCharacterName;

        auraText = `\n\n// ========================================== \n// ✨ AURA VINCULADA / ATRIBUÍDA A ESTA ANIMAÇÃO (${auraId}):\n// Adicione ao banco de dados ou inicializador do AuraConfigKeyManager:\n"${auraId}": ${JSON.stringify(cleanObj(auraDbObj), null, 4)}`;
      }
    }

    const clipboardText = formatJson + beamText + auraText;
    try {
      navigator.clipboard.writeText(clipboardText);
    } catch (e) {
      console.warn("Clipboard auto-write blocked:", e);
    }
    setCopiedData({
      title: `Configuração da Animação: ${selectedState}`,
      text: clipboardText,
    });
  };

  const handleSaveCharacterAndAnimations = async () => {
    try {
      const localData = localStorage.getItem("dd2d_char_overrides");
      const parsed = localData ? JSON.parse(localData) : {};

      const charOverrides = {
        attack: selectedChar.stats.attack,
        defense: selectedChar.stats.defense,
        speed: selectedChar.stats.speed,
        maxHp: selectedChar.maxHp,
        animations: selectedChar.spriteConfig?.animations || {},
        beamOverrides: selectedChar.beamOverrides || {},
        projectileOverrides: (selectedChar as any).projectileOverrides || {},
      };

      parsed[selectedChar.id] = charOverrides;
      localStorage.setItem("dd2d_char_overrides", JSON.stringify(parsed));

      const charToUpdate = BASE_CHARACTERS.find(
        (c) => c.id === selectedChar.id,
      );
      if (charToUpdate) {
        charToUpdate.stats.attack = selectedChar.stats.attack;
        charToUpdate.stats.defense = selectedChar.stats.defense;
        charToUpdate.stats.speed = selectedChar.stats.speed;
        charToUpdate.maxHp = selectedChar.maxHp;
        if (selectedChar.spriteConfig?.animations) {
          charToUpdate.spriteConfig.animations = {
            ...charToUpdate.spriteConfig.animations,
            ...selectedChar.spriteConfig.animations,
          };
        }
        if (selectedChar.beamOverrides) {
          charToUpdate.beamOverrides = {
            ...charToUpdate.beamOverrides,
            ...selectedChar.beamOverrides,
          };
        }
        if ((selectedChar as any).projectileOverrides) {
          (charToUpdate as any).projectileOverrides = {
            ...(charToUpdate as any).projectileOverrides,
            ...(selectedChar as any).projectileOverrides,
          };
        }
      }

      if (!isOfflineMode) {
        const docRef = doc(db, "character_overrides", selectedChar.id);
        await setDoc(docRef, charOverrides, { merge: true });
        alert(
          "Configurações do personagem salvas com sucesso localmente e no servidor!",
        );
      } else {
        alert("Configurações do personagem salvas com sucesso localmente!");
      }

      // Run automatic safety sweep on project save to clean up orphaned/invalid keys
      try {
        await ProjectSweepManager.getInstance().runSweep(true);
      } catch (sweepError) {
        console.error("Failed to run safety sweep on save:", sweepError);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar opções do personagem: " + (error as Error).message);
    }
  };

  const resetOffsets = () => {
    if (!config) return;
    setConfig({
      ...config,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const renderProjectileVisualCustomizer = (projKey: string) => {
    const proj = localProjectileDatabase[projKey];
    if (!proj) return null;

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/5 mt-4">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-amber-500" /> Customização do
            Projétil
          </span>
          <button
            type="button"
            onClick={() => handleResetProjectileColors(projKey)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all font-bold uppercase tracking-wider cursor-pointer"
            id="btn-pj-reset-visuals"
          >
            <RotateCcw className="w-3 h-3 text-red-400" /> Resetar Cores
          </button>
        </h4>

        {/* Sliders das propriedades de cor */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Matriz (Hue Rotate) */}
          <div className="col-span-2 space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Matriz de Cor (Rotação de Matiz)</span>
              <span className="text-amber-400">
                {proj.projectileHueRotate !== undefined
                  ? proj.projectileHueRotate
                  : 0}
                °
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={360}
              step={1}
              value={
                proj.projectileHueRotate !== undefined
                  ? proj.projectileHueRotate
                  : 0
              }
              onChange={(val) =>
                handleProjectileStyleChange(projKey, "projectileHueRotate", val)
              }
              accentColor="amber-500"
            />
          </div>

          {/* Saturação */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Saturação</span>
              <span className="text-amber-400">
                {proj.projectileSaturate !== undefined
                  ? proj.projectileSaturate
                  : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={4}
              step={0.05}
              value={
                proj.projectileSaturate !== undefined
                  ? proj.projectileSaturate
                  : 1
              }
              onChange={(val) =>
                handleProjectileStyleChange(projKey, "projectileSaturate", val)
              }
              accentColor="amber-500"
            />
          </div>

          {/* Contraste */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Contraste</span>
              <span className="text-amber-400">
                {proj.projectileContrast !== undefined
                  ? proj.projectileContrast
                  : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0.1}
              max={3}
              step={0.05}
              value={
                proj.projectileContrast !== undefined
                  ? proj.projectileContrast
                  : 1
              }
              onChange={(val) =>
                handleProjectileStyleChange(projKey, "projectileContrast", val)
              }
              accentColor="amber-500"
            />
          </div>

          {/* Brilho */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Brilho</span>
              <span className="text-amber-400">
                {proj.projectileBrightness !== undefined
                  ? proj.projectileBrightness
                  : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0.2}
              max={3}
              step={0.05}
              value={
                proj.projectileBrightness !== undefined
                  ? proj.projectileBrightness
                  : 1
              }
              onChange={(val) =>
                handleProjectileStyleChange(
                  projKey,
                  "projectileBrightness",
                  val,
                )
              }
              accentColor="amber-500"
            />
          </div>

          {/* Opacidade */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Opacidade</span>
              <span className="text-amber-400">
                {Math.round(
                  (proj.projectileOpacity !== undefined
                    ? proj.projectileOpacity
                    : 1) * 100,
                )}
                %
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={1}
              step={0.05}
              value={
                proj.projectileOpacity !== undefined
                  ? proj.projectileOpacity
                  : 1
              }
              onChange={(val) =>
                handleProjectileStyleChange(projKey, "projectileOpacity", val)
              }
              accentColor="amber-500"
            />
          </div>
        </div>

        {/* Cores Principais Manual */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Cor Primária
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={proj.color || "#ffffff"}
                onChange={(e) =>
                  handleProjectileStyleChange(projKey, "color", e.target.value)
                }
                className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                id="input-proj-color"
              />
              <span className="text-xs font-mono text-slate-300 uppercase select-all">
                {proj.color || "#ffffff"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuraVisualCustomizer = (auraKey: string) => {
    const currentAura = localAuraDatabase[auraKey];
    if (!currentAura) return null;

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/5 mt-4 text-xs font-black">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-orange-400" /> Customização de Aura
            (Chave)
          </span>
          <button
            type="button"
            onClick={() => handleResetAuraColors(auraKey)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all font-bold uppercase tracking-wider cursor-pointer font-black"
          >
            <RotateCcw className="w-3 h-3 text-red-400" /> Resetar Cores
          </button>
        </h4>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Target Character */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
              ID Personagem
            </label>
            <select
              value={currentAura.ownerCharacterId || ""}
              onChange={(e) =>
                handleAuraStyleChange(
                  auraKey,
                  "ownerCharacterId",
                  e.target.value,
                )
              }
              className="w-full bg-black/30 border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-bold"
            >
              <option value="">Qualquer Um (Livre)</option>
              {BASE_CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Animation State Trigger */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
              Trigger Animação
            </label>
            <select
              value={currentAura.ownerAnimationKey || ""}
              onChange={(e) =>
                handleAuraStyleChange(
                  auraKey,
                  "ownerAnimationKey",
                  e.target.value,
                )
              }
              className="w-full bg-black/30 border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-bold"
            >
              <option value="">Qualquer Animação</option>
              {(() => {
                const allStates = Object.values(PlayerState);
                const standardList = [
                  "CHARGING",
                  "CHARGE_START",
                  "CHARGE_END",
                  "ULTIMATE",
                  "SPARKING",
                ];
                allStates.forEach((s) => {
                  if (!standardList.includes(s)) standardList.push(s);
                });
                if (selectedChar?.spriteConfig?.animations) {
                  Object.keys(selectedChar.spriteConfig.animations).forEach(
                    (a) => {
                      if (!standardList.includes(a)) standardList.push(a);
                    },
                  );
                }
                return standardList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Default checkmarks */}
          <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <label className="flex items-center gap-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide select-none cursor-pointer">
              <input
                type="checkbox"
                checked={currentAura.isDefaultCharging || false}
                onChange={(e) =>
                  handleAuraStyleChange(
                    auraKey,
                    "isDefaultCharging",
                    e.target.checked,
                  )
                }
                className="rounded border-white/10 bg-black/30 text-amber-500 focus:ring-0 font-bold"
              />
              Aura de Ki Principal
            </label>
            <label className="flex items-center gap-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide select-none cursor-pointer">
              <input
                type="checkbox"
                checked={currentAura.isDefaultSparking || false}
                onChange={(e) =>
                  handleAuraStyleChange(
                    auraKey,
                    "isDefaultSparking",
                    e.target.checked,
                  )
                }
                className="rounded border-white/10 bg-black/30 text-orange-500 focus:ring-0 font-bold"
              />
              Aura de Sparking Principal
            </label>
          </div>

          {/* Original Source GIF */}
          <div className="col-span-2 space-y-1.5 pt-2 border-t border-white/5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-black">
              Animação Original (GIF Base)
            </label>
            <select
              value={currentAura.baseAuraId || "AURA_001"}
              onChange={(e) =>
                handleAuraStyleChange(auraKey, "baseAuraId", e.target.value)
              }
              className="w-full bg-black/30 border-white/10 hover:border-white/15 transition-colors rounded-lg px-2.5 py-1.5 border text-xs text-amber-400 font-black focus:outline-none font-bold"
            >
              {Object.keys(DEFAULT_AURAS).map((key) => (
                <option key={key} value={key}>
                  GIF: {key.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Hue and saturates */}
          <div className="col-span-2 pt-2 border-t border-white/5 space-y-3">
            {/* Color tint */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">
                Filtro de Spray / Tintura de Cor
              </label>
              <div className="flex items-center gap-3 bg-black/25 p-2 rounded-lg border border-white/5">
                <input
                  type="color"
                  value={currentAura.color || "#ffffff"}
                  onChange={(e) =>
                    handleAuraStyleChange(auraKey, "color", e.target.value)
                  }
                  className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                />
                <div className="space-y-0.5 font-bold">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase block select-all">
                    {currentAura.color || "#ffffff"}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                    Preencha ou selecione para tingir a aura
                  </span>
                </div>
              </div>
            </div>

            {/* Hue slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Matriz / Rotação Hue (beans HUE)</span>
                <span className="text-amber-400">
                  {currentAura.auraHueRotate !== undefined
                    ? currentAura.auraHueRotate
                    : 0}
                  °
                </span>
              </div>
              <SliderWithControls
                min={0}
                max={360}
                step={1}
                value={
                  currentAura.auraHueRotate !== undefined
                    ? currentAura.auraHueRotate
                    : 0
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraHueRotate", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Saturação */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Saturação de Cor (Color Intensity)</span>
                <span className="text-amber-400">
                  {currentAura.auraSaturate !== undefined
                    ? currentAura.auraSaturate
                    : 1.0}
                </span>
              </div>
              <SliderWithControls
                min={0}
                max={4}
                step={0.05}
                value={
                  currentAura.auraSaturate !== undefined
                    ? currentAura.auraSaturate
                    : 1
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraSaturate", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Contraste */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Contraste</span>
                <span className="text-amber-400">
                  {currentAura.auraContrast !== undefined
                    ? currentAura.auraContrast
                    : 1.0}
                </span>
              </div>
              <SliderWithControls
                min={0.1}
                max={3}
                step={0.05}
                value={
                  currentAura.auraContrast !== undefined
                    ? currentAura.auraContrast
                    : 1
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraContrast", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Brilho */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Brilho</span>
                <span className="text-amber-400">
                  {currentAura.auraBrightness !== undefined
                    ? currentAura.auraBrightness
                    : 1.0}
                </span>
              </div>
              <SliderWithControls
                min={0.2}
                max={3}
                step={0.05}
                value={
                  currentAura.auraBrightness !== undefined
                    ? currentAura.auraBrightness
                    : 1
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraBrightness", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Opacidade */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Transparência / Opacidade</span>
                <span className="text-amber-400">
                  {Math.round(
                    (currentAura.auraOpacity !== undefined
                      ? currentAura.auraOpacity
                      : 0.85) * 100,
                  )}
                  %
                </span>
              </div>
              <SliderWithControls
                min={0}
                max={1}
                step={0.05}
                value={
                  currentAura.auraOpacity !== undefined
                    ? currentAura.auraOpacity
                    : 0.85
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraOpacity", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Posicionamento - Offset X */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Posição Horizontal (Offset X)</span>
                <span className="text-amber-400">
                  {currentAura.auraOffsetX !== undefined
                    ? currentAura.auraOffsetX
                    : 0}{" "}
                  px
                </span>
              </div>
              <SliderWithControls
                min={-150}
                max={150}
                step={1}
                value={
                  currentAura.auraOffsetX !== undefined
                    ? currentAura.auraOffsetX
                    : 0
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraOffsetX", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Posicionamento - Offset Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Posição Vertical (Offset Y)</span>
                <span className="text-amber-400">
                  {currentAura.auraOffsetY !== undefined
                    ? currentAura.auraOffsetY
                    : 0}{" "}
                  px
                </span>
              </div>
              <SliderWithControls
                min={-150}
                max={150}
                step={1}
                value={
                  currentAura.auraOffsetY !== undefined
                    ? currentAura.auraOffsetY
                    : 0
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraOffsetY", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Escala Horizontal (Scale X) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Escala Horizontal (Largura)</span>
                <span className="text-amber-400">
                  {(currentAura.auraScaleX !== undefined
                    ? currentAura.auraScaleX
                    : 1.0
                  ).toFixed(2)}
                  x
                </span>
              </div>
              <SliderWithControls
                min={0.1}
                max={3.5}
                step={0.05}
                value={
                  currentAura.auraScaleX !== undefined
                    ? currentAura.auraScaleX
                    : 1.0
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraScaleX", val)
                }
                accentColor="amber-500"
              />
            </div>

            {/* Escala Vertical (Scale Y) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Escala Vertical (Altura)</span>
                <span className="text-amber-400">
                  {(currentAura.auraScaleY !== undefined
                    ? currentAura.auraScaleY
                    : 1.0
                  ).toFixed(2)}
                  x
                </span>
              </div>
              <SliderWithControls
                min={0.1}
                max={3.5}
                step={0.05}
                value={
                  currentAura.auraScaleY !== undefined
                    ? currentAura.auraScaleY
                    : 1.0
                }
                onChange={(val) =>
                  handleAuraStyleChange(auraKey, "auraScaleY", val)
                }
                accentColor="amber-500"
              />
            </div>
          </div>


        </div>
      </div>
    );
  };

  const renderVisualCustomizer = (beamKey: string) => {
    const beam = localBeamDatabase[beamKey];
    if (!beam) return null;

    return (
      <div className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/5 mt-4">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-white/5">
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-indigo-400" /> Customização do
            Laser / Beam
          </span>
          <button
            type="button"
            onClick={() => handleResetBeamColors(beamKey)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all font-bold uppercase tracking-wider cursor-pointer"
            id="btn-un-reset-visuals"
          >
            <RotateCcw className="w-3 h-3 text-red-400" /> Resetar Cores
          </button>
        </h4>

        {/* Configurações de Matriz e Cor */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Matriz (Hue Rotate) */}
          <div className="col-span-2 space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Matriz de Cor (Rotação de Matiz)</span>
              <span className="text-sky-400">
                {beam.beamHueRotate !== undefined ? beam.beamHueRotate : 0}°
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={360}
              step={1}
              value={beam.beamHueRotate !== undefined ? beam.beamHueRotate : 0}
              onChange={(val) =>
                handleBeamStyleChange(beamKey, "beamHueRotate", val)
              }
              accentColor="sky-500"
            />
          </div>

          {/* Saturação */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Saturação</span>
              <span className="text-sky-400">
                {beam.beamSaturate !== undefined ? beam.beamSaturate : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={4}
              step={0.05}
              value={beam.beamSaturate !== undefined ? beam.beamSaturate : 1}
              onChange={(val) =>
                handleBeamStyleChange(beamKey, "beamSaturate", val)
              }
              accentColor="sky-500"
            />
          </div>

          {/* Contraste */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Contraste</span>
              <span className="text-sky-400">
                {beam.beamContrast !== undefined ? beam.beamContrast : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0.1}
              max={3}
              step={0.05}
              value={beam.beamContrast !== undefined ? beam.beamContrast : 1}
              onChange={(val) =>
                handleBeamStyleChange(beamKey, "beamContrast", val)
              }
              accentColor="sky-500"
            />
          </div>

          {/* Brilho */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Brilho</span>
              <span className="text-sky-400">
                {beam.beamBrightness !== undefined ? beam.beamBrightness : 1.0}
              </span>
            </div>
            <SliderWithControls
              min={0.2}
              max={3}
              step={0.05}
              value={
                beam.beamBrightness !== undefined ? beam.beamBrightness : 1
              }
              onChange={(val) =>
                handleBeamStyleChange(beamKey, "beamBrightness", val)
              }
              accentColor="sky-500"
            />
          </div>

          {/* Opacidade */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <span>Opacidade</span>
              <span className="text-sky-400">
                {Math.round(
                  (beam.beamOpacity !== undefined ? beam.beamOpacity : 1) * 100,
                )}
                %
              </span>
            </div>
            <SliderWithControls
              min={0}
              max={1}
              step={0.05}
              value={beam.beamOpacity !== undefined ? beam.beamOpacity : 1}
              onChange={(val) =>
                handleBeamStyleChange(beamKey, "beamOpacity", val)
              }
              accentColor="sky-500"
            />
          </div>
        </div>

        {/* Cores e Brilhos principais */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Cor Base / Haz
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={beam.color || "#ffffff"}
                  onChange={(e) =>
                    handleBeamStyleChange(beamKey, "color", e.target.value)
                  }
                  className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                  id="input-base-color"
                />
                <span className="text-xs font-mono text-slate-300 uppercase select-all">
                  {beam.color || "#ffffff"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const derivedLinkedAnimation =
    beamPreviewAnimation ||
    Object.keys(selectedChar.spriteConfig?.animations || {}).find(
      (k) =>
        selectedChar.spriteConfig?.animations?.[k]?.createsBeam ===
        selectedBeamFamilyId,
    ) ||
    "";

  const isBeamOfAnim =
    activeTab === "BEAM" ||
    !!(
      config &&
      config.createsBeam &&
      !config.createsBeam.includes("KI_BLAST") &&
      !config.createsBeam.includes("PROJECTILE") &&
      !config.createsBeam.includes("PROJETIL")
    );

  return (
    <div className="absolute inset-0 bg-[#0A0A0B] text-slate-300 flex flex-col font-sans overflow-hidden select-none">
      {isDraggingLeftPanel && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize" />
      )}
      {/* Header */}
      <div className="h-16 bg-[#111113]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              AudioManager.getInstance().playSFX("click");
              changeScene(SceneName.ADMIN_PANEL);
              
              // Run cleaning and sweep tasks asynchronously in the background
              setTimeout(async () => {
                try {
                  const inactiveBeams = Object.keys(localBeamDatabase).filter(
                    (key) => key.startsWith("CHAVE_") && !isKeyActive(key)
                  );
                  const inactiveProjKeys = Object.keys(localProjectileDatabase).filter((key) => {
                    const isCustom = key.startsWith("CHAVE_") || !PROJECTILE_DATABASE[key] || key.match(/_\d{3,4}$/);
                    return isCustom && !isKeyActive(key);
                  });

                  if (inactiveBeams.length > 0) {
                    deleteKeysFromProject(inactiveBeams, "BEAM", true);
                  }
                  if (inactiveProjKeys.length > 0) {
                    deleteKeysFromProject(inactiveProjKeys, "PROJECTILE", true);
                  }

                  // Run comprehensive safety sweep
                  await ProjectSweepManager.getInstance().runSweep(true);
                } catch (err) {
                  console.error("Error during background exit cleaning:", err);
                }
              }, 50);
            }}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-all group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-base font-black italic uppercase tracking-tighter flex items-center gap-2 text-orange-400">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            Anim Preview & Origin Fix
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveCharacterAndAnimations}
            className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            title="Salva permanentemente as animações, Creates Beam, offsets e configurações do personagem no banco de dados e local storage"
          >
            <Save className="w-4 h-4" />
            Salvar Personagem
          </button>
          <button
            onClick={copyAllCharConfigs}
            className="bg-orange-900 border border-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all"
          >
            <Copy className="w-4 h-4" />
            Copy All Anims
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all shadow-lg "
          >
            <Copy className="w-4 h-4" />
            Copy Config
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Modern Controls */}
        <div
          style={{ width: `${leftPanelWidth}px` }}
          className="bg-[#111113] border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl relative"
        >
          {/* Resize Handle */}
          <div
            className="absolute -right-2 top-0 bottom-0 w-4 cursor-col-resize z-50 hover:bg-white/10 transition-colors"
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDraggingLeftPanel(true);
            }}
          />
          {/* Tabs */}
          <div className="flex border-b border-white/5 p-2 gap-1 bg-[#18181b]/50 overflow-x-auto custom-scrollbar shrink-0">
            {[
              {
                id: "SETTINGS",
                icon: <Settings className="w-5 h-5" />,
                label: "Setup",
              },
              {
                id: "TRANSFORM",
                icon: <Move className="w-5 h-5" />,
                label: "Transform",
              },
              {
                id: "COMBAT",
                icon: <Zap className="w-5 h-5 text-orange-400" />,
                label: "Combat",
              },
              {
                id: "CINEMATIC",
                icon: <Video className="w-5 h-5" />,
                label: "Camera Info",
              },
              {
                id: "SCENE",
                icon: <Box className="w-5 h-5" />,
                label: "Cutscene",
              },
              {
                id: "REFERENCE",
                icon: <ImageIcon className="w-5 h-5" />,
                label: "Reference",
              },
              {
                id: "KI_BLAST",
                icon: <Zap className="w-5 h-5 text-teal-400" />,
                label: "Ki Blast",
              },
              {
                id: "GENKIDAMA",
                icon: <Crosshair className="w-5 h-5 text-amber-400" />,
                label: "Genkidama",
              },
              {
                id: "BEAM",
                icon: <Flame className="w-5 h-5 text-sky-400" />,
                label: "Beams",
              },
              {
                id: "fechosenergia",
                icon: <Activity className="w-5 h-5 text-purple-400" />,
                label: "Fecho Energia",
              },
              {
                id: "COLLISION",
                icon: <Layers className="w-5 h-5" />,
                label: "Collision",
              },
              {
                id: "BEAMS_MANAGER",
                icon: <Wrench className="w-5 h-5" />,
                label: "Manager",
              },
              {
                id: "AURAS",
                icon: (
                  <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                ),
                label: "Auras",
              },
              {
                id: "VFX",
                icon: <Zap className="w-5 h-5 text-green-400" />,
                label: "Efeitos VFX",
              },
              {
                id: "FULL_LIST",
                icon: <List className="w-5 h-5 text-indigo-400" />,
                label: "Lista Total",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all ${activeTab === tab.id ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "text-slate-500 hover:bg-white/5 border border-transparent hover:text-white"}`}
              >
                {tab.icon}
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {/* Character & State (Always Visible Except in Beam/Projectile) */}
            {activeTab !== "BEAM" && activeTab !== "PROJECTILE" && (
              <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Character
                  </label>
                  <select
                    value={selectedChar.id}
                    onChange={(e) => {
                      const char = BASE_CHARACTERS.find(
                        (c) => c.id === e.target.value,
                      );
                      if (char) {
                        setSelectedChar(char);
                        setSelectedState("IDLE");
                        setFrameIndex(0);
                      }
                    }}
                    className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-xs font-bold font-sans italic uppercase tracking-wider focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    {BASE_CHARACTERS.map((char, index) => (
                      <option key={`${char.id}-${index}`} value={char.id}>
                        {char.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-widest flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Animation State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-xs font-bold font-sans italic uppercase tracking-wider focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    {sortedGroups.map((group) => (
                      <optgroup key={group} label={group}>
                        {groupedStates[group].map((state) => (
                          <option key={state} value={state}>
                            {getCleanLabel(state, group)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeTab === "COMBAT" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {/* Combat Categories */}
                  {sortedGroups
                    .filter(
                      (group) =>
                        group.includes("Especial") ||
                        group.includes("Ultimate") ||
                        group.includes("Dash"),
                    )
                    .map((group) => (
                      <div
                        key={group}
                        className="space-y-3 bg-[#18181b] p-4 rounded-2xl border border-white/5 shadow-xl"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4" /> {group}
                          </h4>
                          <button
                            onClick={() => {
                              setPlayingSequence(groupedStates[group]);
                              setSequenceIndex(0);
                            }}
                            className="text-[9px] font-black text-white bg-orange-600/20 hover:bg-orange-600/40 px-2 py-0.5 rounded border border-orange-500/30 transition-colors uppercase"
                          >
                            Reproduzir Sequência
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {groupedStates[group].map((state) => (
                            <button
                              key={state}
                              onClick={() => setSelectedState(state)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-left ${
                                selectedState === state
                                  ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20"
                                  : "bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              <div className="truncate">
                                {getCleanLabel(state, group)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {activeTab === "FULL_LIST" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mb-4">
                  <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <List className="w-5 h-5" /> Lista Completa de Animações
                  </h3>
                  <p className="text-[10px] text-indigo-300/60 font-medium leading-relaxed">
                    Exibindo todas as animações mapeadas no arquivo de configuração do personagem ({selectedChar.id}).
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {sortedGroups.map((group) => (
                    <div
                      key={group}
                      className="space-y-3 bg-[#18181b] p-4 rounded-2xl border border-white/5 shadow-xl"
                    >
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {group} ({groupedStates[group].length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {groupedStates[group].map((state) => (
                          <button
                            key={state}
                            onClick={() => setSelectedState(state)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-left truncate ${
                              selectedState === state
                                ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20"
                                : "bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {getCleanLabel(state, group)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "SETTINGS" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {config && (
                  <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                    <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5" />
                      Frame Data
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Width
                        </label>
                        <input
                          type="number"
                          value={
                            Number.isNaN(config.frameWidth)
                              ? ""
                              : (config.frameWidth ?? "")
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleConfigChange(
                              "frameWidth",
                              isNaN(val) ? undefined : val,
                            );
                          }}
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-[10px] font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Height
                        </label>
                        <input
                          type="number"
                          value={
                            Number.isNaN(config.frameHeight)
                              ? ""
                              : (config.frameHeight ?? "")
                          }
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleConfigChange(
                              "frameHeight",
                              isNaN(val) ? undefined : val,
                            );
                          }}
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-[10px] font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.isVertical ?? false}
                          onChange={(e) =>
                            handleConfigChange("isVertical", e.target.checked)
                          }
                          className="w-4 h-4 rounded bg-black/50 border border-white/10 text-orange-600 focus:ring-orange-500"
                        />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Vertical Sheet
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.loop ?? false}
                          onChange={(e) =>
                            handleConfigChange("loop", e.target.checked)
                          }
                          className="w-4 h-4 rounded bg-black/50 border border-white/10 text-orange-600 focus:ring-orange-500"
                        />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Loop Animation
                        </label>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-1.5 animate-pulse-subtle">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-black">
                        Vincular Aura a esta Animação (Chave Aura / Padrão)
                      </label>
                      <select
                        value={config.auraConfigKey || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            "auraConfigKey",
                            e.target.value || undefined,
                          )
                        }
                        className="w-full bg-black/40 border-white/10 hover:border-white/15 transition-colors rounded-xl px-3 py-2 text-xs text-amber-400 font-extrabold focus:outline-none"
                      >
                        <option value="">
                          -- Usar Comportamento de Aura Padrão --
                        </option>
                        {Object.keys(localAuraDatabase)
                          .sort((a, b) => {
                            const aIsChave = a.startsWith("CHAVE_");
                            const bIsChave = b.startsWith("CHAVE_");
                            if (aIsChave && !bIsChave) return -1;
                            if (!aIsChave && bIsChave) return 1;
                            return a.localeCompare(b);
                          })
                          .map((key) => {
                            const item = localAuraDatabase[key];
                            const label = item.name || key;
                            return (
                              <option
                                key={key}
                                value={key}
                                className={
                                  key.startsWith("CHAVE_")
                                    ? "text-amber-400 font-bold"
                                    : "text-slate-400 font-medium"
                                }
                              >
                                {key.startsWith("CHAVE_") ? "✨ " : "⚙️ "} {key}{" "}
                                - {label}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "TRANSFORM" && config && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <Layers className="w-5 h-5" /> Onion Skinning Mode
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showCustomOnionSkin}
                        onChange={(e) =>
                          setShowCustomOnionSkin(e.target.checked)
                        }
                        className="w-4 h-4 rounded bg-black/50 border border-white/10 text-orange-600 focus:ring-orange-500"
                      />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Show
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Character
                    </label>
                    <select
                      value={customOnionConfig.characterId}
                      onChange={(e) =>
                        setCustomOnionConfig((prev) => ({
                          ...prev,
                          characterId: e.target.value,
                          animState: "IDLE",
                          frameIndex: 0,
                        }))
                      }
                      className="w-full bg-black/30 border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs font-bold font-sans italic uppercase focus:outline-none focus:border-orange-500"
                    >
                      {BASE_CHARACTERS.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Animation State
                    </label>
                    <select
                      value={customOnionConfig.animState}
                      onChange={(e) =>
                        setCustomOnionConfig((prev) => ({
                          ...prev,
                          animState: e.target.value,
                          frameIndex: 0,
                        }))
                      }
                      className="w-full bg-black/30 border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs font-bold font-sans italic uppercase focus:outline-none focus:border-orange-500"
                    >
                      {(() => {
                        const refChar = BASE_CHARACTERS.find(
                          (c) => c.id === customOnionConfig.characterId,
                        );
                        const allStates = Object.keys(
                          refChar?.spriteConfig?.animations || {},
                        );
                        return allStates.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Frame Index: {customOnionConfig.frameIndex}
                    </label>
                    <SliderWithControls
                      min={0}
                      max={
                        (BASE_CHARACTERS.find(
                          (c) => c.id === customOnionConfig.characterId,
                        )?.spriteConfig?.animations[customOnionConfig.animState]
                          ?.frames || 1) - 1
                      }
                      step={1}
                      value={customOnionConfig.frameIndex}
                      onChange={(val) =>
                        setCustomOnionConfig((prev) => ({
                          ...prev,
                          frameIndex: val,
                        }))
                      }
                      accentColor="orange-500"
                    />
                  </div>

                  <div className="pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Opacity: {customOnionConfig.opacity}
                      </label>
                      <SliderWithControls
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        value={customOnionConfig.opacity}
                        onChange={(val) =>
                          setCustomOnionConfig((prev) => ({
                            ...prev,
                            opacity: val,
                          }))
                        }
                        accentColor="orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Layer
                    </label>
                    <select
                      value={customOnionConfig.layer}
                      onChange={(e) =>
                        setCustomOnionConfig((prev) => ({
                          ...prev,
                          layer: e.target.value as "BACK" | "FRONT",
                        }))
                      }
                      className="w-full bg-black/30 border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs font-bold font-sans italic uppercase focus:outline-none focus:border-orange-500"
                    >
                      <option value="BACK">BACK (Behind Animation)</option>
                      <option value="FRONT">FRONT (Over Animation)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Maximize className="w-5 h-5" /> Scale & Playback
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={config.fullScreen || false}
                      onChange={(e) =>
                        handleConfigChange("fullScreen", e.target.checked)
                      }
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-xs font-black uppercase text-slate-300 tracking-widest">
                      Full Screen Background
                    </span>
                  </label>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                      Scale{" "}
                      <span className="text-orange-400">
                        {Number(config.scale ?? 1).toFixed(2)}
                      </span>
                    </label>
                    <SliderWithControls
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={config.scale || 1}
                      onChange={(val) => handleConfigChange("scale", val)}
                      accentColor="orange-500"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                      Play Speed{" "}
                      <span className="text-orange-400">{config.speed}</span>
                    </label>
                    <SliderWithControls
                      min={1}
                      max={20}
                      step={1}
                      value={config.speed || 5}
                      onChange={(val) => handleConfigChange("speed", val)}
                      accentColor="orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Move className="w-5 h-5" /> Offsets
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Offset X
                      </label>
                      {(!selectedState ||
                        !selectedState.includes("BEAM_END")) && (
                        <button
                          onClick={() => handleConfigChange("offsetX", 0)}
                          className="text-[10px] text-orange-400 font-black uppercase tracking-widest hover:underline"
                        >
                          {config.offsetX} (Reset)
                        </button>
                      )}
                    </div>
                    <SliderWithControls
                      min={-1800}
                      max={1800}
                      step={1}
                      value={config.offsetX || 0}
                      onChange={(val) => handleConfigChange("offsetX", val)}
                      accentColor="orange-500"
                      disabled={
                        !selectedState || selectedState.includes("BEAM_END")
                      }
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Offset Y
                      </label>
                      <button
                        onClick={() => handleConfigChange("offsetY", 0)}
                        className="text-[10px] text-orange-400 font-black uppercase tracking-widest hover:underline"
                      >
                        {config.offsetY} (Reset)
                      </button>
                    </div>
                    <SliderWithControls
                      min={-1800}
                      max={1800}
                      step={1}
                      value={config.offsetY || 0}
                      onChange={(val) => handleConfigChange("offsetY", val)}
                      accentColor="orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Crosshair className="w-5 h-5" /> Origins
                  </h3>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Sprite Center X
                      </label>
                      <button
                        onClick={() => handleConfigChange("centerX", undefined)}
                        className="text-[10px] text-orange-500 font-black uppercase tracking-widest hover:underline"
                      >
                        {config.centerX ?? ""} (Reset)
                      </button>
                    </div>
                    <SliderWithControls
                      min={-900}
                      max={900}
                      step={1}
                      value={config.centerX ?? 0}
                      onChange={(val) => handleConfigChange("centerX", val)}
                      accentColor="orange-500"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Sprite Center Y
                      </label>
                      <button
                        onClick={() => handleConfigChange("centerY", undefined)}
                        className="text-[10px] text-orange-500 font-black uppercase tracking-widest hover:underline"
                      >
                        {config.centerY ?? ""} (Reset)
                      </button>
                    </div>
                    <SliderWithControls
                      min={-900}
                      max={900}
                      step={1}
                      value={config.centerY ?? 0}
                      onChange={(val) => handleConfigChange("centerY", val)}
                      accentColor="orange-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "SCENE" && config && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-orange-500/20">
                  <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5" /> Environment
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Background Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={config.sceneBackgroundUrl || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            "sceneBackgroundUrl",
                            e.target.value,
                          )
                        }
                        className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-2 py-2 text-xs focus:border-orange-500 text-slate-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Background Color Overlay
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.sceneBackgroundColor || "#000000"}
                          onChange={(e) =>
                            handleConfigChange(
                              "sceneBackgroundColor",
                              e.target.value,
                            )
                          }
                          className="w-10 h-8 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <button
                          onClick={() =>
                            handleConfigChange(
                              "sceneBackgroundColor",
                              undefined,
                            )
                          }
                          className="text-[10px] text-orange-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-amber-500/20">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Box className="w-5 h-5" /> Scene Objects
                    </h3>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const parts = e.target.value.split("|");
                          const newId = parts[0];
                          const url = parts
                            .slice(1, parts.length - 1)
                            .join("|"); // safety against pipes in URL
                          const isGif = parts[parts.length - 1] === "true";
                          const newObjs = [
                            ...(config.sceneObjects || []),
                            {
                              id: newId,
                              x: 0,
                              y: 0,
                              scale: 1,
                              rotation: 0,
                              opacity: 1,
                              type: "VFX" as any,
                              imageUrl: url,
                              isGif,
                            },
                          ];
                          handleConfigChange("sceneObjects", newObjs);
                          e.target.value = "";
                        }}
                        className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1.5 rounded-lg border-none focus:ring-0 uppercase font-bold tracking-widest cursor-pointer outline-none max-w-[120px]"
                      >
                        <option value="">+ FX</option>
                        {Object.keys(localBeamDatabase)
                          .filter(
                            (key) =>
                              !key.startsWith("CHAVE_") &&
                              key !== "BEAM_1" &&
                              key !== "BEAM_2",
                          )
                          .map((key) => {
                            const b = localBeamDatabase[key];
                            const url = b.middle?.imageUrl || b.start?.imageUrl;
                            if (!url) return null;
                            return (
                              <option
                                key={key}
                                value={`${key}|${url}|${b.middle?.isGif ?? false}`}
                              >
                                {b.name || key}
                              </option>
                            );
                          })}
                      </select>
                      <select
                        onChange={(e) => {
                          if (!e.target.value) return;
                          if (e.target.value === "NEW") {
                            const newId = prompt(
                              "Enter object ID (e.g. CRATER_1):",
                            );
                            if (newId) {
                              const newObjs = [
                                ...(config.sceneObjects || []),
                                {
                                  id: newId,
                                  x: 0,
                                  y: 0,
                                  scale: 1,
                                  rotation: 0,
                                  opacity: 1,
                                  type: "PROP" as any,
                                },
                              ];
                              handleConfigChange("sceneObjects", newObjs);
                            }
                          } else {
                            try {
                              const parsedObj = JSON.parse(e.target.value);
                              const newObjs = [
                                ...(config.sceneObjects || []),
                                { ...parsedObj },
                              ];
                              handleConfigChange("sceneObjects", newObjs);
                            } catch (err) {}
                          }
                          e.target.value = "";
                        }}
                        className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors uppercase font-bold tracking-wider outline-none max-w-[150px] cursor-pointer cursor-pointer border-none focus:ring-0"
                      >
                        <option value="">+ Add Object</option>
                        <option value="NEW">✨ Novo Objeto...</option>
                        <optgroup label="Objetos Existentes (Neste Personagem)">
                          {(() => {
                            const allAnims =
                              selectedChar.spriteConfig?.animations || {};
                            const uniqueObjs = new Map<string, any>();
                            Object.values(allAnims).forEach((animData: any) => {
                              if (animData.sceneObjects) {
                                animData.sceneObjects.forEach((obj: any) => {
                                  if (obj.id && !uniqueObjs.has(obj.id)) {
                                    uniqueObjs.set(obj.id, obj);
                                  }
                                });
                              }
                            });
                            return Array.from(uniqueObjs.values()).map(
                              (obj) => (
                                <option
                                  key={obj.id}
                                  value={JSON.stringify(obj)}
                                >
                                  {obj.id}
                                </option>
                              ),
                            );
                          })()}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(!config.sceneObjects ||
                      config.sceneObjects.length === 0) && (
                      <p className="text-xs text-slate-500 italic">
                        No scene objects added yet.
                      </p>
                    )}
                    {config.sceneObjects?.map((obj, idx) => (
                      <div
                        key={`scene-obj-${idx}-${obj.id || ''}`}
                        className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-3 relative group"
                      >
                        <button
                          onClick={() => {
                            const newObjs = [...config.sceneObjects!];
                            newObjs.splice(idx, 1);
                            handleConfigChange("sceneObjects", newObjs);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                        >
                          ×
                        </button>
                        <div className="flex gap-2">
                          <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                            {obj.id}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Image URL
                            </label>
                            <input
                              type="text"
                              value={obj.imageUrl || ""}
                              onChange={(e) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].imageUrl = e.target.value;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              className="w-full bg-black/40 border-white/5 rounded-md px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="space-y-1 col-span-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={obj.isGif || false}
                                onChange={(e) => {
                                  const newObjs = [...config.sceneObjects!];
                                  newObjs[idx].isGif = e.target.checked;
                                  handleConfigChange("sceneObjects", newObjs);
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Is GIF Sprite
                              </span>
                            </div>
                            <select
                              value={obj.layer || "FRONT"}
                              onChange={(e) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].layer = e.target.value as any;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              className="bg-black/40 border-white/5 rounded-md px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest outline-none"
                            >
                              <option value="FRONT">FRONT LAYER</option>
                              <option value="BACK">BACK LAYER</option>
                            </select>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                              X: <span className="text-amber-400">{obj.x}</span>
                            </label>
                            <SliderWithControls
                              min={-1000}
                              max={1000}
                              step={1}
                              value={obj.x}
                              onChange={(val) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].x = val;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              accentColor="amber-500"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                              Y: <span className="text-amber-400">{obj.y}</span>
                            </label>
                            <SliderWithControls
                              min={-1000}
                              max={1000}
                              step={1}
                              value={obj.y}
                              onChange={(val) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].y = val;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              accentColor="amber-500"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                              Scale:{" "}
                              <span className="text-amber-400">
                                {obj.scale ?? 1}
                              </span>
                            </label>
                            <SliderWithControls
                              min={0.1}
                              max={5}
                              step={0.1}
                              value={obj.scale ?? 1}
                              onChange={(val) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].scale = val;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              accentColor="amber-500"
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              VFX Config (Chave de Efeito)
                            </label>
                            <select
                              value={obj.configKey || ""}
                              onChange={(e) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].configKey = e.target.value;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              className="w-full bg-black/40 border-white/5 rounded-md px-2 py-1.5 text-xs text-green-400 font-bold focus:outline-none focus:border-green-500"
                            >
                              <option value="">Nenhum Override</option>
                              {Object.keys(localEffectDatabase).filter(k => {
                                const existsInDict = DEFAULT_EFFECTS[k] !== undefined;
                                const isNotChave = !k.startsWith("CHAVE_");
                                return !existsInDict || !isNotChave;
                              }).map(key => (
                                <option key={key} value={key}>{key}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                              Rotation:{" "}
                              <span className="text-amber-400">
                                {obj.rotation ?? 0}
                              </span>
                            </label>
                            <SliderWithControls
                              min={0}
                              max={360}
                              step={1}
                              value={obj.rotation ?? 0}
                              onChange={(val) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].rotation = val % 360; // Keep it somewhat sane, or remove % 360 if unrestricted rotation is needed.
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              accentColor="amber-500"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                              Opacity:{" "}
                              <span className="text-amber-400">
                                {obj.opacity ?? 1}
                              </span>
                            </label>
                            <SliderWithControls
                              min={0.1}
                              max={1}
                              step={0.1}
                              value={obj.opacity ?? 1}
                              onChange={(val) => {
                                const newObjs = [...config.sceneObjects!];
                                newObjs[idx].opacity = val;
                                handleConfigChange("sceneObjects", newObjs);
                              }}
                              accentColor="amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-orange-500/20">
                  <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5" /> Dialogue Window
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Avatar Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={config.sceneDialogueAvatar || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            "sceneDialogueAvatar",
                            e.target.value,
                          )
                        }
                        className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-2 py-2 text-[10px] font-mono focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Speaker Name
                      </label>
                      <input
                        type="text"
                        placeholder="GOKU"
                        value={config.sceneDialogueName || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            "sceneDialogueName",
                            e.target.value,
                          )
                        }
                        className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-2 py-2 font-bold uppercase focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Message (use \n for line breaks)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Hey! Let's fight."
                        value={config.sceneDialogueText || ""}
                        onChange={(e) =>
                          handleConfigChange(
                            "sceneDialogueText",
                            e.target.value,
                          )
                        }
                        className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-2 py-2 text-sm focus:border-orange-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-orange-500/20">
                  <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Sword className="w-5 h-5" /> Opponent Setup
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Opponent Pos X
                    </label>
                    <SliderWithControls
                      min={-800}
                      max={800}
                      step={1}
                      value={config.opponentPosX ?? 0}
                      onChange={(val) =>
                        handleConfigChange("opponentPosX", val)
                      }
                      accentColor="orange-500"
                    />
                    <button
                      onClick={() =>
                        handleConfigChange("opponentPosX", undefined)
                      }
                      className="text-[10px] text-orange-500 hover:underline"
                    >
                      Remove Opponent
                    </button>
                  </div>
                  {config.opponentPosX !== undefined && (
                    <>
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Opponent Pos Y
                        </label>
                        <SliderWithControls
                          min={-500}
                          max={500}
                          step={1}
                          value={config.opponentPosY ?? 0}
                          onChange={(val) =>
                            handleConfigChange("opponentPosY", val)
                          }
                          accentColor="orange-500"
                        />
                      </div>
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Opponent Scale
                        </label>
                        <SliderWithControls
                          min={0.1}
                          max={5}
                          step={0.1}
                          value={config.opponentScale ?? 1}
                          onChange={(val) =>
                            handleConfigChange("opponentScale", val)
                          }
                          accentColor="orange-500"
                        />
                      </div>
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Opponent Anim state
                        </label>
                        <select
                          value={config.opponentAnim || PlayerState.HIT}
                          onChange={(e) =>
                            handleConfigChange("opponentAnim", e.target.value)
                          }
                          className="w-full bg-black/40 px-2 py-2"
                        >
                          {Object.values(PlayerState).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.opponentPosImmediate ?? true}
                          onChange={(e) =>
                            handleConfigChange(
                              "opponentPosImmediate",
                              e.target.checked,
                            )
                          }
                          className="accent-orange-500 w-4 h-4 rounded border-slate-700 bg-slate-800"
                        />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          Move Immediately
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "REFERENCE" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-sky-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" /> Reference Image Overlay
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={referenceImg.show}
                        onChange={(e) =>
                          setReferenceImg((r) => ({
                            ...r,
                            show: e.target.checked,
                          }))
                        }
                        className="w-4 h-4"
                      />
                      Show
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://.../ref.png"
                        value={referenceImg.url}
                        onChange={(e) =>
                          setReferenceImg((r) => ({
                            ...r,
                            url: e.target.value,
                          }))
                        }
                        className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-2 py-2 text-xs focus:border-sky-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          Opacity{" "}
                          <span className="text-sky-400">
                            {Number(referenceImg.opacity).toFixed(2)}
                          </span>
                        </label>
                        <SliderWithControls
                          min={0.1}
                          max={1}
                          step={0.1}
                          value={referenceImg.opacity}
                          onChange={(val) =>
                            setReferenceImg((r) => ({ ...r, opacity: val }))
                          }
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          Scale{" "}
                          <span className="text-sky-400">
                            {Number(referenceImg.scale).toFixed(2)}
                          </span>
                        </label>
                        <SliderWithControls
                          min={0.1}
                          max={5}
                          step={0.1}
                          value={referenceImg.scale}
                          onChange={(val) =>
                            setReferenceImg((r) => ({ ...r, scale: val }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          Offset X{" "}
                          <span className="text-sky-400">
                            {referenceImg.offsetX}
                          </span>
                        </label>
                        <input
                          type="number"
                          value={referenceImg.offsetX}
                          onChange={(e) =>
                            setReferenceImg((r) => ({
                              ...r,
                              offsetX: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-black/40 rounded px-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                          Offset Y{" "}
                          <span className="text-sky-400">
                            {referenceImg.offsetY}
                          </span>
                        </label>
                        <input
                          type="number"
                          value={referenceImg.offsetY}
                          onChange={(e) =>
                            setReferenceImg((r) => ({
                              ...r,
                              offsetY: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full bg-black/40 rounded px-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "CINEMATIC" && config && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-orange-500/20">
                  <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5" /> Mugen FX
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.mugenEffect ?? false}
                        onChange={(e) =>
                          handleConfigChange("mugenEffect", e.target.checked)
                        }
                        className="w-4 h-4 rounded bg-black/50 border border-white/10 text-orange-600 focus:ring-orange-500"
                      />
                      <label className="text-xl font-black text-orange-400 uppercase drop-shadow-md">
                        Mugen Super Cut-in
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.superDarkness ?? false}
                        onChange={(e) =>
                          handleConfigChange("superDarkness", e.target.checked)
                        }
                        className="w-4 h-4 rounded bg-black/50 border border-white/10 text-slate-400 focus:ring-slate-500"
                      />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Darken Scene Box
                      </label>
                    </div>
                  </div>
                  {config.mugenEffect && (
                    <>
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Portrait URL
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("mugenPortraitUrl", undefined)
                            }
                            className="text-[10px] text-orange-400 font-black hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={config.mugenPortraitUrl || ""}
                          onChange={(e) =>
                            handleConfigChange(
                              "mugenPortraitUrl",
                              e.target.value,
                            )
                          }
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-3 py-2 text-xl focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Super Text
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("mugenText", undefined)
                            }
                            className="text-[10px] text-orange-400 font-black hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. SHIN-GORYUKEN"
                          value={config.mugenText || ""}
                          onChange={(e) =>
                            handleConfigChange("mugenText", e.target.value)
                          }
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-lg px-3 py-2 text-xl font-black focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Mugen Color Accent
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("mugenColor", undefined)
                            }
                            className="text-[10px] text-orange-400 font-black hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={config.mugenColor || "#d946ef"}
                            onChange={(e) =>
                              handleConfigChange("mugenColor", e.target.value)
                            }
                            className="w-10 h-8 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <span className="text-xl text-slate-400 flex items-center leading-none font-mono tracking-widest">
                            {config.mugenColor || "#d946ef"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-sky-500/20">
                  <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ZoomIn className="w-5 h-5" /> Camera System
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Zoom Type:{" "}
                        <span className="text-sky-400">
                          {config.zoomType ?? "NONE"}
                        </span>
                      </label>
                      <button
                        onClick={() =>
                          handleMultipleConfigChanges({
                            zoomType: undefined,
                            zoomAmount: undefined,
                          })
                        }
                        className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "IMMEDIATE",
                        "ZOOM_IN",
                        "ZOOM_OUT",
                        "ZOOM_IN_OUT",
                        "ZOOM_PULSE",
                        "ZOOM_BOUNCE",
                        "ZOOM_DRAMATIC",
                        "ZOOM_SHAKE",
                        "ZOOM_IMPACT",
                      ].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            const newVal =
                              config.zoomType === type
                                ? undefined
                                : (type as any);
                            const updates: Partial<AnimationFrameData> = {
                              zoomType: newVal,
                            };
                            if (newVal) {
                              updates.zoomAmount =
                                config.zoomAmount && config.zoomAmount !== 1.0
                                  ? config.zoomAmount
                                  : 1.5;
                            }
                            handleMultipleConfigChanges(updates);
                          }}
                          className={`flex-1 py-1 px-1 text-xl font-bold uppercase rounded border min-w-[120px] ${config.zoomType === type ? "bg-sky-500/20 border-sky-500 text-sky-300" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.zoomType && config.zoomType !== "DEFAULT_CENTER" && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Zoom Amount:{" "}
                            <span className="text-sky-400">
                              {Number(config.zoomAmount ?? 1.5).toFixed(2)}
                            </span>
                          </label>
                        </div>
                        <SliderWithControls
                          min={0.5}
                          max={5}
                          step={0.05}
                          value={config.zoomAmount || 1.5}
                          onChange={(val) =>
                            handleConfigChange("zoomAmount", val)
                          }
                          accentColor="sky-500"
                        />
                      </div>
                      {config.zoomType !== "IMMEDIATE" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Zoom Speed:{" "}
                              <span className="text-sky-400">
                                {Number(config.zoomSpeed ?? 0.15).toFixed(2)}
                              </span>
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange("zoomSpeed", undefined)
                              }
                              className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <SliderWithControls
                            min={0.01}
                            max={1.0}
                            step={0.01}
                            value={config.zoomSpeed || 0.15}
                            onChange={(val) =>
                              handleConfigChange("zoomSpeed", val)
                            }
                            accentColor="sky-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {config.zoomType !== "DEFAULT_CENTER" && (
                    <>
                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Cam Focus X
                          </label>
                          <button
                            onClick={() =>
                              handleMultipleConfigChanges({
                                cameraFocusX: undefined,
                                cameraFocusY: undefined,
                              })
                            }
                            className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                          >
                            {config.cameraFocusX ?? ""} (Reset)
                          </button>
                        </div>
                        <SliderWithControls
                          min={-100}
                          max={300}
                          step={1}
                          value={config.cameraFocusX || 0}
                          onChange={(val) =>
                            handleMultipleConfigChanges({
                              cameraFocusX: val,
                              cameraFocusY:
                                config.cameraFocusY === undefined
                                  ? 0
                                  : config.cameraFocusY,
                            })
                          }
                          accentColor="sky-500"
                        />
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Cam Focus Y
                          </label>
                          <button
                            onClick={() => {}}
                            className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline opacity-0 cursor-default"
                          >
                            {config.cameraFocusY ?? ""}
                          </button>
                        </div>
                        <SliderWithControls
                          min={-100}
                          max={300}
                          step={1}
                          value={config.cameraFocusY || 0}
                          onChange={(val) =>
                            handleMultipleConfigChanges({
                              cameraFocusY: val,
                              cameraFocusX:
                                config.cameraFocusX === undefined
                                  ? 0
                                  : config.cameraFocusX,
                            })
                          }
                          accentColor="sky-500"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Camera Rotation (deg)
                      </label>
                      <button
                        onClick={() =>
                          handleConfigChange("cameraRotation", undefined)
                        }
                        className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                      >
                        {config.cameraRotation ?? ""} (Reset)
                      </button>
                    </div>
                    <SliderWithControls
                      min={-180}
                      max={180}
                      step={1}
                      value={config.cameraRotation || 0}
                      onChange={(val) =>
                        handleConfigChange("cameraRotation", val)
                      }
                      accentColor="sky-500"
                    />
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Ki Blast X
                      </label>
                      <button
                        onClick={() =>
                          handleMultipleConfigChanges({
                            kiOriginX: undefined,
                            kiOriginY: undefined,
                          })
                        }
                        className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                      >
                        {config.kiOriginX ?? ""} (Reset)
                      </button>
                    </div>
                    <SliderWithControls
                      min={-300}
                      max={900}
                      step={1}
                      value={config.kiOriginX || 0}
                      onChange={(val) =>
                        handleMultipleConfigChanges({
                          kiOriginX: val,
                          kiOriginY:
                            config.kiOriginY === undefined
                              ? 0
                              : config.kiOriginY,
                        })
                      }
                      accentColor="sky-500"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Ki Blast Y
                      </label>
                      <button
                        onClick={() => {}}
                        className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline opacity-0 cursor-default"
                      >
                        {config.kiOriginY ?? ""}
                      </button>
                    </div>
                    <SliderWithControls
                      min={-300}
                      max={900}
                      step={1}
                      value={config.kiOriginY || 0}
                      onChange={(val) =>
                        handleMultipleConfigChanges({
                          kiOriginY: val,
                          kiOriginX:
                            config.kiOriginX === undefined
                              ? 0
                              : config.kiOriginX,
                        })
                      }
                      accentColor="sky-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {isBeamOrProjTab && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {activeTab === "KI_BLAST" && (
                  <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-teal-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-2 text-teal-400">
                      <Zap className="w-4 h-4 text-teal-400 animate-pulse" />{" "}
                      Editor de Ki Blast
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Configure os projéteis rápidos e rajadas de energia (Ki
                      Blasts). Você pode especificar os atributos, comportamento
                      de movimento e a animação correspondente.
                    </p>

                    {(() => {
                      const families = Object.keys(
                        localProjectileDatabase,
                      ).filter((k) => {
                        const existsInDict =
                          PROJECTILE_DATABASE[k] !== undefined;
                        const isNotChave = !k.startsWith("CHAVE_");
                        const isKiBlastOrProj =
                          k.includes("KI_BLAST") || k.includes("PROJETIL");
                        const isNotOther =
                          !k.includes("GENKIDAMA") && !k.includes("FECHO");
                        return (
                          existsInDict &&
                          isNotChave &&
                          isKiBlastOrProj &&
                          isNotOther
                        );
                      });
                      const currentFamily = selectedProjectileFamilyId;

                      return (
                        <>
                          {destinationProjectileKey &&
                            currentFamily === "PROJETIL_1" && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                                    Destino de Edição Ativo
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProjectileFamilyId(
                                        destinationProjectileKey,
                                      );
                                      setDestinationProjectileKey(null);
                                    }}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Concluir e Alternar para{" "}
                                    {destinationProjectileKey}
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-300 leading-normal">
                                  Você está ajustando o{" "}
                                  <strong>Projétil Padrão</strong> como
                                  template. Suas edições estão sendo
                                  sincronizadas automaticamente na chave{" "}
                                  <strong>{destinationProjectileKey}</strong>.
                                </p>
                              </div>
                            )}

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Família do Projétil Ki Blast
                            </label>
                            <select
                              value={currentFamily}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedProjectileFamilyId(val);
                                setSelectedBeamFamilyId(val);
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-teal-500 text-teal-400"
                            >
                              {families.map((f) => (
                                <option key={f} value={f}>
                                  {localProjectileDatabase[f]?.name ||
                                    f.replace(/_/g, " ")}
                                </option>
                              ))}
                              {currentFamily &&
                                !families.includes(currentFamily) && (
                                  <option
                                    key={currentFamily}
                                    value={currentFamily}
                                  >
                                    {localProjectileDatabase[currentFamily]
                                      ?.name ||
                                      currentFamily.replace(/_/g, " ")}
                                  </option>
                                )}
                            </select>
                          </div>

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  const baseId = "PROJETIL_1";
                                  const keyManager =
                                    ProjectileConfigKeyManager.getInstance();
                                  const parentProj = JSON.parse(
                                    JSON.stringify(
                                      localProjectileDatabase[
                                        selectedProjectileFamilyId
                                      ] ||
                                        PROJECTILE_DATABASE[baseId] || {
                                          name: "Custom Projectile",
                                          middle: {},
                                        },
                                    ),
                                  );

                                  const baseName = parentProj.name
                                    ? parentProj.name.split(" (")[0]
                                    : "Projétil Ki Blast";
                                  const newKey = keyManager.generateKey(
                                    baseId,
                                    baseName,
                                  );
                                  const newName =
                                    prompt(
                                      "Insira o nome para esta nova configuração de Ki Blast:",
                                      `${baseName} ${families.length + 1}`,
                                    ) || `${baseName} ${families.length + 1}`;

                                  const updated = keyManager.registerProjectile(
                                    newKey,
                                    baseId,
                                    newName,
                                    {
                                      ...parentProj,
                                      name: newName,
                                    },
                                  );

                                  setLocalProjectileDatabase((prev) => ({
                                    ...prev,
                                    [newKey]: updated,
                                  }));

                                  setSelectedProjectileFamilyId(newKey);
                                  setSelectedBeamFamilyId(newKey);
                                }}
                                className="mb-4 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 hover:from-teal-500/20 hover:to-emerald-500/20 border border-teal-500/20 text-teal-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                + CRIAR CONFIGURAÇÃO DE KI BLAST EXCLUSIVA
                              </button>
                              Movement Behavior
                            </label>
                            <select
                              value={
                                localProjectileDatabase[currentFamily]
                                  ?.behavior || "STRAIGHT"
                              }
                              onChange={(e) => {
                                const val = e.target.value as
                                  | "STRAIGHT"
                                  | "HOMING"
                                  | "TARGET_POS"
                                  | "GROWING_STRAIGHT";
                                setLocalProjectileDatabase((prev) => ({
                                  ...prev,
                                  [currentFamily]: {
                                    ...prev[currentFamily],
                                    behavior: val,
                                  },
                                }));
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-teal-500 text-teal-400"
                            >
                              <option value="STRAIGHT">
                                Linha Reta (STRAIGHT)
                              </option>
                              <option value="HOMING">
                                Seguir Oponente (HOMING)
                              </option>
                              <option value="TARGET_POS">
                                Posição do Oponente (TARGET_POS)
                              </option>
                              <option value="GROWING_STRAIGHT">
                                Crescimento Gradual (GROWING_STRAIGHT)
                              </option>
                            </select>
                          </div>

                          {currentFamily &&
                            renderProjectileVisualCustomizer(currentFamily)}

                          {currentFamily && (
                            <div className="space-y-3 mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-3">
                              <h4 className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                <User className="h-3.5 w-3.5" /> Vínculo de Personagem & Animação
                              </h4>
                              <p className="text-[10px] leading-normal text-slate-400">
                                Associe esta chave de Ki Blast a um personagem e animação específicos.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Personagem
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId || ""
                                    }
                                    onChange={(e) => {
                                      const charId = e.target.value;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (char) {
                                        setSelectedChar(char);
                                        setBeamPreviewCharacterId(char.id);
                                        setBeamPreviewAnimation("");
                                        setSelectedState("IDLE");

                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            updated[currentFamily] = {
                                              ...updated[currentFamily],
                                              ownerCharacterId: charId,
                                              ownerCharacterName: char.name,
                                              ownerAnimationKey: "",
                                            };
                                          }
                                          return updated;
                                        });
                                      } else {
                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            const {
                                              ownerCharacterId,
                                              ownerCharacterName,
                                              ownerAnimationKey,
                                              ...rest
                                            } = updated[currentFamily];
                                            updated[currentFamily] = rest as any;
                                          }
                                          return updated;
                                        });
                                      }
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Personagem --</option>
                                    {BASE_CHARACTERS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Animação
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerAnimationKey || ""
                                    }
                                    disabled={
                                      !localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId
                                    }
                                    onChange={(e) => {
                                      const animKey = e.target.value;
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      if (!charId) return;

                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char) return;

                                      // Enforce: Only 1 character animation per projectile ID
                                      BASE_CHARACTERS.forEach((c) => {
                                        if (c.spriteConfig?.animations) {
                                          Object.keys(c.spriteConfig.animations).forEach(
                                            (k) => {
                                              if (
                                                c.spriteConfig.animations[k]
                                                  ?.projectileId === currentFamily
                                              ) {
                                                c.spriteConfig.animations[
                                                  k
                                                ].projectileId = "";
                                              }
                                            },
                                          );
                                        }
                                      });

                                      // Register on the chosen character animation
                                      if (char.spriteConfig?.animations) {
                                        if (!char.spriteConfig.animations[animKey]) {
                                          char.spriteConfig.animations[animKey] = {
                                            imageUrl: "",
                                            frames: 1,
                                            frameWidth: 128,
                                            frameHeight: 128,
                                          };
                                        }
                                        char.spriteConfig.animations[animKey] = {
                                          ...char.spriteConfig.animations[animKey],
                                          projectileId: currentFamily,
                                        };
                                      }

                                      setLocalProjectileDatabase((prev) => {
                                        const updated = { ...prev };
                                        if (updated[currentFamily]) {
                                          updated[currentFamily] = {
                                            ...updated[currentFamily],
                                            ownerAnimationKey: animKey,
                                          };
                                        }
                                        return updated;
                                      });

                                      // Auto synchronize Preview Context for fluid workflow and ensure React state updates!
                                      const updatedChar = {
                                        ...char,
                                        spriteConfig: char.spriteConfig
                                          ? {
                                              ...char.spriteConfig,
                                              animations: {
                                                ...char.spriteConfig.animations,
                                              },
                                            }
                                          : undefined,
                                      };
                                      setSelectedChar(updatedChar);
                                      setBeamPreviewCharacterId(char.id);
                                      setBeamPreviewAnimation(animKey);
                                      setSelectedState(animKey);
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Animação --</option>
                                    {(() => {
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char || !char.spriteConfig?.animations)
                                        return null;
                                      return Object.keys(char.spriteConfig.animations)
                                        .filter((k) => !k.includes("BEAM_"))
                                        .map((k) => (
                                          <option key={k} value={k}>
                                            {k.replace(/_/g, " ")}
                                          </option>
                                        ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "GENKIDAMA" && (
                  <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-amber-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-2 text-amber-400">
                      <Crosshair className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                      Editor de Genkidama
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Configure as lendárias e massivas esferas de energia
                      (Genki Dama / Death Balls). Customize escalas colossais e
                      o visual de detonação.
                    </p>

                    {(() => {
                      const families = Object.keys(
                        localProjectileDatabase,
                      ).filter((k) => {
                        const existsInDict =
                          PROJECTILE_DATABASE[k] !== undefined;
                        const isNotChave = !k.startsWith("CHAVE_");
                        const isGenk =
                          k.includes("GENKIDAMA") &&
                          !k.includes("_EXPLODE") &&
                          !k.includes("_DISSIPATE") &&
                          !k.includes("_CHAO") &&
                          !k.includes("_COLLISION") &&
                          !k.includes("_FINAL");
                        return existsInDict && isNotChave && isGenk;
                      });
                      const currentFamily = selectedProjectileFamilyId;

                      return (
                        <>
                          {destinationProjectileKey &&
                            currentFamily === "GENKIDAMA_1" && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                                    Destino de Edição Ativo
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProjectileFamilyId(
                                        destinationProjectileKey,
                                      );
                                      setDestinationProjectileKey(null);
                                    }}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Concluir e Alternar para{" "}
                                    {destinationProjectileKey}
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-300 leading-normal">
                                  Você está ajustando a{" "}
                                  <strong>Genkidama Padrão</strong> como
                                  template. Suas edições estão sendo
                                  sincronizadas automaticamente na chave{" "}
                                  <strong>{destinationProjectileKey}</strong>.
                                </p>
                              </div>
                            )}

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Família de Genkidama
                            </label>
                            <select
                              value={currentFamily}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedProjectileFamilyId(val);
                                setSelectedBeamFamilyId(val);
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-amber-500 text-amber-400"
                            >
                              {families.map((f) => (
                                <option key={f} value={f}>
                                  {localProjectileDatabase[f]?.name ||
                                    f.replace(/_/g, " ")}
                                </option>
                              ))}
                              {currentFamily &&
                                !families.includes(currentFamily) && (
                                  <option
                                    key={currentFamily}
                                    value={currentFamily}
                                  >
                                    {localProjectileDatabase[currentFamily]
                                      ?.name ||
                                      currentFamily.replace(/_/g, " ")}
                                  </option>
                                )}
                            </select>
                          </div>

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  let baseId = "GENKIDAMA_1";
                                  if (selectedChar.id === "vegeta_ego")
                                    baseId = "GENKIDAMA_2";
                                  else if (
                                    selectedChar.id === "goku_black_rose"
                                  )
                                    baseId = "GENKIDAMA_3";

                                  const keyManager =
                                    ProjectileConfigKeyManager.getInstance();
                                  const parentProj = JSON.parse(
                                    JSON.stringify(
                                      localProjectileDatabase[
                                        selectedProjectileFamilyId
                                      ] ||
                                        PROJECTILE_DATABASE[baseId] || {
                                          name: "Custom Genkidama",
                                          middle: {},
                                        },
                                    ),
                                  );

                                  const baseName = parentProj.name
                                    ? parentProj.name.split(" (")[0]
                                    : "Genkidama";
                                  const newKey = keyManager.generateKey(
                                    baseId,
                                    baseName,
                                  );
                                  const newName =
                                    prompt(
                                      "Insira o nome para esta nova configuração de Genkidama:",
                                      `${baseName} ${families.length + 1}`,
                                    ) || `${baseName} ${families.length + 1}`;

                                  const updated = keyManager.registerProjectile(
                                    newKey,
                                    baseId,
                                    newName,
                                    {
                                      ...parentProj,
                                      name: newName,
                                    },
                                  );

                                  setLocalProjectileDatabase((prev) => ({
                                    ...prev,
                                    [newKey]: updated,
                                  }));

                                  setSelectedProjectileFamilyId(newKey);
                                  setSelectedBeamFamilyId(newKey);

                                  setSelectedChar((prev) => {
                                    const newChar = { ...prev };
                                    if (newChar.spriteConfig?.animations) {
                                      [
                                        "GENKIDAMA",
                                        "GENKIDAMA_CHAO",
                                        "GENKIDAMA_FINAL",
                                        "Ultimate_2_3",
                                        selectedState,
                                      ].forEach((gKey) => {
                                        const anim =
                                          newChar.spriteConfig!.animations![
                                            gKey
                                          ];
                                        if (anim) {
                                          newChar.spriteConfig!.animations![
                                            gKey
                                          ] = {
                                            ...anim,
                                            projectileId: newKey,
                                          };
                                        }
                                      });
                                    }
                                    return newChar;
                                  });
                                }}
                                className="mb-4 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                + CRIAR CONFIGURAÇÃO DE GENKIDAMA EXCLUSIVA
                              </button>
                              Movement Behavior
                            </label>
                            <select
                              value={
                                localProjectileDatabase[currentFamily]
                                  ?.behavior || "STRAIGHT"
                              }
                              onChange={(e) => {
                                const val = e.target.value as
                                  | "STRAIGHT"
                                  | "HOMING"
                                  | "TARGET_POS"
                                  | "GROWING_STRAIGHT";
                                setLocalProjectileDatabase((prev) => ({
                                  ...prev,
                                  [currentFamily]: {
                                    ...prev[currentFamily],
                                    behavior: val,
                                  },
                                }));
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-amber-500 text-amber-400"
                            >
                              <option value="STRAIGHT">
                                Linha Reta (STRAIGHT)
                              </option>
                              <option value="HOMING">
                                Seguir Oponente (HOMING)
                              </option>
                              <option value="TARGET_POS">
                                Posição do Oponente (TARGET_POS)
                              </option>
                              <option value="GROWING_STRAIGHT">
                                Crescimento Gradual (GROWING_STRAIGHT)
                              </option>
                            </select>
                          </div>

                          {currentFamily &&
                            renderProjectileVisualCustomizer(currentFamily)}

                          {currentFamily && (
                            <div className="space-y-3 mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-3">
                              <h4 className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                <User className="h-3.5 w-3.5" /> Vínculo de Personagem & Animação
                              </h4>
                              <p className="text-[10px] leading-normal text-slate-400">
                                Associe esta chave de Genkidama a um personagem e animação específicos.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Personagem
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId || ""
                                    }
                                    onChange={(e) => {
                                      const charId = e.target.value;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (char) {
                                        setSelectedChar(char);
                                        setBeamPreviewCharacterId(char.id);
                                        setBeamPreviewAnimation("");
                                        setSelectedState("IDLE");

                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            updated[currentFamily] = {
                                              ...updated[currentFamily],
                                              ownerCharacterId: charId,
                                              ownerCharacterName: char.name,
                                              ownerAnimationKey: "",
                                            };
                                          }
                                          return updated;
                                        });
                                      } else {
                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            const {
                                              ownerCharacterId,
                                              ownerCharacterName,
                                              ownerAnimationKey,
                                              ...rest
                                            } = updated[currentFamily];
                                            updated[currentFamily] = rest as any;
                                          }
                                          return updated;
                                        });
                                      }
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Personagem --</option>
                                    {BASE_CHARACTERS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Animação
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerAnimationKey || ""
                                    }
                                    disabled={
                                      !localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId
                                    }
                                    onChange={(e) => {
                                      const animKey = e.target.value;
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      if (!charId) return;

                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char) return;

                                      // Enforce: Only 1 character animation per projectile ID
                                      BASE_CHARACTERS.forEach((c) => {
                                        if (c.spriteConfig?.animations) {
                                          Object.keys(c.spriteConfig.animations).forEach(
                                            (k) => {
                                              if (
                                                c.spriteConfig.animations[k]
                                                  ?.projectileId === currentFamily
                                              ) {
                                                c.spriteConfig.animations[
                                                  k
                                                ].projectileId = "";
                                              }
                                            },
                                          );
                                        }
                                      });

                                      // Register on the chosen character animation
                                      if (char.spriteConfig?.animations) {
                                        if (!char.spriteConfig.animations[animKey]) {
                                          char.spriteConfig.animations[animKey] = {
                                            imageUrl: "",
                                            frames: 1,
                                            frameWidth: 128,
                                            frameHeight: 128,
                                          };
                                        }
                                        char.spriteConfig.animations[animKey] = {
                                          ...char.spriteConfig.animations[animKey],
                                          projectileId: currentFamily,
                                        };
                                      }

                                      setLocalProjectileDatabase((prev) => {
                                        const updated = { ...prev };
                                        if (updated[currentFamily]) {
                                          updated[currentFamily] = {
                                            ...updated[currentFamily],
                                            ownerAnimationKey: animKey,
                                          };
                                        }
                                        return updated;
                                      });

                                      // Auto synchronize Preview Context for fluid workflow and ensure React state updates!
                                      const updatedChar = {
                                        ...char,
                                        spriteConfig: char.spriteConfig
                                          ? {
                                              ...char.spriteConfig,
                                              animations: {
                                                ...char.spriteConfig.animations,
                                              },
                                            }
                                          : undefined,
                                      };
                                      setSelectedChar(updatedChar);
                                      setBeamPreviewCharacterId(char.id);
                                      setBeamPreviewAnimation(animKey);
                                      setSelectedState(animKey);
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Animação --</option>
                                    {(() => {
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char || !char.spriteConfig?.animations)
                                        return null;
                                      return Object.keys(char.spriteConfig.animations)
                                        .filter((k) => !k.includes("BEAM_"))
                                        .map((k) => (
                                          <option key={k} value={k}>
                                            {k.replace(/_/g, " ")}
                                          </option>
                                        ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "BEAM" && (
                  <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-sky-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-2 text-sky-400">
                      <Flame className="w-4 h-4 text-sky-400 animate-pulse" />{" "}
                      Editor de Beam
                    </h3>
                    <p className="text-slate-400 text-xs text-justify">
                      Configure os feixes contínuos e correntes de energia de
                      três partes (Beams / Kamehamehas / Masenkos). Customize
                      cada segmento: início, meio e fim.
                    </p>

                    {(() => {
                      const families = Object.keys(localBeamDatabase).filter(
                        (k) => {
                          const existsInDict = BEAM_DATABASE[k] !== undefined;
                          const isNotChave = !k.startsWith("CHAVE_");
                          const isNotOther =
                            !k.includes("FECHO") &&
                            !k.includes("KI_BLAST") &&
                            !k.includes("GENKIDAMA") &&
                            !k.includes("PROJETIL");
                          const isNotDuplicate =
                            k !== "BEAM_1" && k !== "BEAM_2";
                          return (
                            existsInDict &&
                            isNotChave &&
                            isNotOther &&
                            isNotDuplicate
                          );
                        },
                      );

                      const currentFamily = selectedBeamFamilyId;

                      return (
                        <>
                          {destinationBeamKey && currentFamily === "BEAM" && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Wrench className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                                  Destino de Edição Ativo
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBeamFamilyId(destinationBeamKey);
                                    setDestinationBeamKey(null);
                                  }}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                  Concluir e Alternar para {destinationBeamKey}
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-normal">
                                Você está ajustando o{" "}
                                <strong>Beam Padrão</strong> como template. Suas
                                edições estão sendo sincronizadas
                                automaticamente na chave{" "}
                                <strong>{destinationBeamKey}</strong>.
                              </p>
                            </div>
                          )}

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Família de Beam
                            </label>
                            <select
                              value={currentFamily}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedBeamFamilyId(val);
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-sky-500 text-sky-400"
                            >
                              {families.map((f) => (
                                <option key={f} value={f}>
                                  {localBeamDatabase[f]?.name ||
                                    f.replace(/_/g, " ")}
                                </option>
                              ))}
                              {currentFamily &&
                                !families.includes(currentFamily) && (
                                  <option
                                    key={currentFamily}
                                    value={currentFamily}
                                  >
                                    {localBeamDatabase[currentFamily]?.name ||
                                      currentFamily.replace(/_/g, " ")}
                                  </option>
                                )}
                            </select>
                            {currentFamily && (
                              <button
                                type="button"
                                onClick={() => handleRestoreBeamConfig(currentFamily)}
                                className={`w-full mt-2 px-3 py-2 rounded-xl border transition-all flex justify-center items-center gap-1.5 cursor-pointer font-black text-[10px] uppercase tracking-wider ${
                                  restoredBeamKey === currentFamily
                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                    : "bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 text-red-400"
                                }`}
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${restoredBeamKey === currentFamily ? "animate-spin" : ""}`} />
                                {restoredBeamKey === currentFamily
                                  ? "Configuração Restaurada!"
                                  : "Restaurar Configuração Original"}
                              </button>
                            )}
                          </div>

                          {currentFamily && (
                            <div className="p-3 bg-indigo-500/[0.07] rounded-xl border border-indigo-500/20 space-y-3 mt-4">
                              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> Vínculo de
                                Personagem & Animação
                              </h4>
                              <p className="text-[10px] text-slate-400 leading-normal">
                                Associe esta chave de Beam a um personagem e
                                animação específicos.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    Personagem
                                  </label>
                                  <select
                                    value={
                                      localBeamDatabase[currentFamily]
                                        ?.ownerCharacterId || ""
                                    }
                                    onChange={(e) => {
                                      const charId = e.target.value;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (char) {
                                        setLocalBeamDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            updated[currentFamily] = {
                                              ...updated[currentFamily],
                                              ownerCharacterId: charId,
                                              ownerCharacterName: char.name,
                                              ownerAnimationKey: "",
                                            };
                                          }
                                          return updated;
                                        });
                                      } else {
                                        setLocalBeamDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            const {
                                              ownerCharacterId,
                                              ownerCharacterName,
                                              ownerAnimationKey,
                                              ...rest
                                            } = updated[currentFamily];
                                            updated[currentFamily] =
                                              rest as any;
                                          }
                                          return updated;
                                        });
                                      }
                                    }}
                                    className="w-full bg-black/40 border border-white/5 hover:border-white/10 transition-colors rounded-xl px-2 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 uppercase font-black"
                                  >
                                    <option value="">
                                      -- Sem Personagem --
                                    </option>
                                    {BASE_CHARACTERS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                    Animação
                                  </label>
                                  <select
                                    value={
                                      localBeamDatabase[currentFamily]
                                        ?.ownerAnimationKey || ""
                                    }
                                    disabled={
                                      !localBeamDatabase[currentFamily]
                                        ?.ownerCharacterId
                                    }
                                    onChange={(e) => {
                                      const animKey = e.target.value;
                                      const charId =
                                        localBeamDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      if (!charId) return;

                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char) return;

                                      // Enforce Rule 3: Only 1 character animation per beam family ID!
                                      BASE_CHARACTERS.forEach((c) => {
                                        if (c.spriteConfig?.animations) {
                                          Object.keys(
                                            c.spriteConfig.animations,
                                          ).forEach((k) => {
                                            if (
                                              c.spriteConfig.animations[k]
                                                ?.createsBeam === currentFamily
                                            ) {
                                              c.spriteConfig.animations[
                                                k
                                              ].createsBeam = "";
                                            }
                                          });
                                        }
                                      });

                                      // Register on the chosen character animation
                                      if (char.spriteConfig?.animations) {
                                        if (
                                          !char.spriteConfig.animations[animKey]
                                        ) {
                                          char.spriteConfig.animations[
                                            animKey
                                          ] = {
                                            imageUrl: "",
                                            frames: 1,
                                            frameWidth: 128,
                                            frameHeight: 128,
                                          };
                                        }
                                        char.spriteConfig.animations[animKey] =
                                          {
                                            ...char.spriteConfig.animations[
                                              animKey
                                            ],
                                            createsBeam: currentFamily,
                                          };
                                      }

                                      setLocalBeamDatabase((prev) => {
                                        const updated = { ...prev };
                                        if (updated[currentFamily]) {
                                          updated[currentFamily] = {
                                            ...updated[currentFamily],
                                            ownerAnimationKey: animKey,
                                          };
                                        }
                                        return updated;
                                      });

                                      // Auto synchronize Preview Context for fluid workflow and ensure React state updates!
                                      const updatedChar = {
                                        ...char,
                                        spriteConfig: char.spriteConfig
                                          ? {
                                              ...char.spriteConfig,
                                              animations: {
                                                ...char.spriteConfig.animations,
                                              },
                                            }
                                          : undefined,
                                      };
                                      setSelectedChar(updatedChar);
                                      setBeamPreviewCharacterId(char.id);
                                      setBeamPreviewAnimation(animKey);
                                      setSelectedState(animKey);
                                    }}
                                    className="w-full bg-black/40 border border-white/5 hover:border-white/10 transition-colors rounded-xl px-2 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 uppercase font-black"
                                  >
                                    <option value="">-- Sem Animação --</option>
                                    {(() => {
                                      const charId =
                                        localBeamDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (
                                        !char ||
                                        !char.spriteConfig?.animations
                                      )
                                        return null;
                                      return Object.keys(
                                        char.spriteConfig.animations,
                                      )
                                        .filter((k) => !k.includes("BEAM_"))
                                        .map((k) => (
                                          <option key={k} value={k}>
                                            {k.replace(/_/g, " ")}
                                          </option>
                                        ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  const baseId = "BEAM";
                                  const keyManager =
                                    BeamConfigKeyManager.getInstance();
                                  const newKey = keyManager.generateKey(baseId);
                                  const newName =
                                    prompt(
                                      "Insira o nome para esta nova configuração de Beam:",
                                      `Novo Beam ${families.length + 1}`,
                                    ) || `Novo Beam ${families.length + 1}`;

                                  const parentBeam = JSON.parse(
                                    JSON.stringify(
                                      localBeamDatabase[selectedBeamFamilyId] ||
                                        BEAM_DATABASE[baseId] || {
                                          name: "Custom Beam",
                                          middle: {},
                                        },
                                    ),
                                  );
                                  keyManager.registerBeam(
                                    newKey,
                                    baseId,
                                    newName,
                                    {
                                      ...parentBeam,
                                      name: newName,
                                    },
                                  );

                                  setLocalBeamDatabase((prev) => ({
                                    ...prev,
                                    [newKey]: keyManager.getBeamConfig(newKey)!,
                                  }));

                                  setSelectedBeamFamilyId(newKey);
                                }}
                                className="mb-4 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 border border-sky-500/20 text-sky-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                + CRIAR CONFIGURAÇÃO DE BEAM EXCLUSIVA
                              </button>
                              Movement Behavior
                            </label>
                            <select
                              value={
                                localBeamDatabase[currentFamily]?.behavior ||
                                "STRAIGHT"
                              }
                              onChange={(e) => {
                                const val = e.target.value as
                                  | "STRAIGHT"
                                  | "HOMING"
                                  | "TARGET_POS";
                                setLocalBeamDatabase((prev) => ({
                                  ...prev,
                                  [currentFamily]: {
                                    ...prev[currentFamily],
                                    behavior: val,
                                  },
                                }));
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-sky-500 text-sky-400"
                            >
                              <option value="STRAIGHT">
                                Linha Reta (STRAIGHT)
                              </option>
                              <option value="HOMING">
                                Seguir Oponente (HOMING)
                              </option>
                              <option value="TARGET_POS">
                                Posição do Oponente (TARGET_POS)
                              </option>
                            </select>
                          </div>

                          {currentFamily &&
                            renderVisualCustomizer(currentFamily)}

                          <div className="flex gap-2 mb-2 bg-black/30 p-1 rounded-xl mt-4">
                            <button
                              type="button"
                              onClick={() => setSelectedBeamPart("start")}
                              className={`flex-1 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all ${selectedBeamPart === "start" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Start
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBeamPart("middle")}
                              className={`flex-1 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all ${selectedBeamPart === "middle" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              Middle
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBeamPart("end")}
                              className={`flex-1 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all ${selectedBeamPart === "end" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                              End
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {activeTab === "fechosenergia" && (
                  <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-purple-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-2 text-purple-400">
                      <Activity className="w-4 h-4 text-purple-400 animate-pulse" />{" "}
                      Editor de Fecho de Energia
                    </h3>
                    <p className="text-slate-400 text-xs text-justify">
                      Configure os feixes contínuos e correntes de energia
                      paralelos. Este sistema opera com uma única imagem
                      extendida, diferente do sistema multicamadas de Beams de
                      três partes.
                    </p>

                    {(() => {
                      const families = Object.keys(
                        localProjectileDatabase,
                      ).filter((k) => {
                        const existsInDict =
                          PROJECTILE_DATABASE[k] !== undefined;
                        const isNotChave = !k.startsWith("CHAVE_");
                        const isFecho =
                          k.includes("FECHO") || k.includes("fechosenergia");
                        return existsInDict && isNotChave && isFecho;
                      });
                      const currentFamily = selectedProjectileFamilyId;

                      return (
                        <>
                          {destinationProjectileKey &&
                            currentFamily === "fechosenergia_1" && (
                              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-amber-400 animate-pulse" />{" "}
                                    Destino de Edição Ativo
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProjectileFamilyId(
                                        destinationProjectileKey,
                                      );
                                      setDestinationProjectileKey(null);
                                    }}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Concluir e Alternar para{" "}
                                    {destinationProjectileKey}
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-300 leading-normal">
                                  Você está ajustando o{" "}
                                  <strong>Fecho Padrão</strong> como template.
                                  Suas edições estão sendo sincronizadas
                                  automaticamente na chave{" "}
                                  <strong>{destinationProjectileKey}</strong>.
                                </p>
                              </div>
                            )}

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Família de Fecho de Energia
                            </label>
                            <select
                              value={currentFamily}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedProjectileFamilyId(val);
                                setSelectedBeamFamilyId(val);
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-purple-500 text-purple-400"
                            >
                              {families.map((f) => (
                                <option key={f} value={f}>
                                  {localProjectileDatabase[f]?.name ||
                                    f.replace(/_/g, " ")}
                                </option>
                              ))}
                              {currentFamily &&
                                !families.includes(currentFamily) && (
                                  <option
                                    key={currentFamily}
                                    value={currentFamily}
                                  >
                                    {localProjectileDatabase[currentFamily]
                                      ?.name ||
                                      currentFamily.replace(/_/g, " ")}
                                  </option>
                                )}
                            </select>
                            {currentFamily && (
                              <button
                                type="button"
                                onClick={() => handleRestoreProjectileConfig(currentFamily)}
                                className={`w-full mt-2 px-3 py-2 rounded-xl border transition-all flex justify-center items-center gap-1.5 cursor-pointer font-black text-[10px] uppercase tracking-wider ${
                                  restoredProjectileKey === currentFamily
                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                    : "bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 border border-purple-500/20 text-purple-400"
                                }`}
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${restoredProjectileKey === currentFamily ? "animate-spin" : ""}`} />
                                {restoredProjectileKey === currentFamily
                                  ? "Configuração Restaurada!"
                                  : "Restaurar Configuração Original"}
                              </button>
                            )}
                          </div>

                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  const baseId = "fechosenergia_1";
                                  const keyManager =
                                    ProjectileConfigKeyManager.getInstance();
                                  const parentProj = JSON.parse(
                                    JSON.stringify(
                                      localProjectileDatabase[
                                        selectedProjectileFamilyId
                                      ] ||
                                        PROJECTILE_DATABASE[baseId] || {
                                          name: "Custom Fecho",
                                          middle: {},
                                        },
                                    ),
                                  );

                                  const baseName = "Fecho de Energia";
                                  const newKey = keyManager.generateKey(
                                    baseId,
                                    baseName,
                                  );
                                  const newName =
                                    prompt(
                                      "Insira o nome para este novo Fecho de Energia:",
                                      `${baseName} ${families.length + 1}`,
                                    ) || `${baseName} ${families.length + 1}`;

                                  const updated = keyManager.registerProjectile(
                                    newKey,
                                    baseId,
                                    newName,
                                    {
                                      ...parentProj,
                                      name: newName,
                                    },
                                  );

                                  setLocalProjectileDatabase((prev) => ({
                                    ...prev,
                                    [newKey]: updated,
                                  }));

                                  setSelectedProjectileFamilyId(newKey);
                                  setSelectedBeamFamilyId(newKey);
                                }}
                                className="mb-4 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/20 text-purple-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                                onClickCapture={(e) => e.stopPropagation()}
                              >
                                + CRIAR CONFIGURAÇÃO DE FECHO EXCLUSIVA
                              </button>
                              Movement Behavior
                            </label>
                            <select
                              value={
                                localProjectileDatabase[currentFamily]
                                  ?.behavior || "STRAIGHT"
                              }
                              onChange={(e) => {
                                const val = e.target.value as
                                  | "STRAIGHT"
                                  | "HOMING"
                                  | "TARGET_POS"
                                  | "GROWING_STRAIGHT";
                                setLocalProjectileDatabase((prev) => ({
                                  ...prev,
                                  [currentFamily]: {
                                    ...prev[currentFamily],
                                    behavior: val,
                                  },
                                }));
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black italic uppercase tracking-wider focus:outline-none focus:border-purple-500 text-purple-400"
                            >
                              <option value="STRAIGHT">
                                Linha Reta (STRAIGHT)
                              </option>
                              <option value="HOMING">
                                Seguir Oponente (HOMING)
                              </option>
                              <option value="TARGET_POS">
                                Posição do Oponente (TARGET_POS)
                              </option>
                              <option value="GROWING_STRAIGHT">
                                Crescimento Gradual (GROWING_STRAIGHT)
                              </option>
                            </select>
                          </div>

                          {currentFamily &&
                            renderProjectileVisualCustomizer(currentFamily)}

                          {currentFamily && (
                            <div className="space-y-3 mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-3">
                              <h4 className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                <User className="h-3.5 w-3.5" /> Vínculo de Personagem & Animação
                              </h4>
                              <p className="text-[10px] leading-normal text-slate-400">
                                Associe esta chave de Fecho de Energia a um personagem e animação específicos.
                              </p>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Personagem
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId || ""
                                    }
                                    onChange={(e) => {
                                      const charId = e.target.value;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (char) {
                                        setSelectedChar(char);
                                        setBeamPreviewCharacterId(char.id);
                                        setBeamPreviewAnimation("");
                                        setSelectedState("IDLE");

                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            updated[currentFamily] = {
                                              ...updated[currentFamily],
                                              ownerCharacterId: charId,
                                              ownerCharacterName: char.name,
                                              ownerAnimationKey: "",
                                            };
                                          }
                                          return updated;
                                        });
                                      } else {
                                        setLocalProjectileDatabase((prev) => {
                                          const updated = { ...prev };
                                          if (updated[currentFamily]) {
                                            const {
                                              ownerCharacterId,
                                              ownerCharacterName,
                                              ownerAnimationKey,
                                              ...rest
                                            } = updated[currentFamily];
                                            updated[currentFamily] = rest as any;
                                          }
                                          return updated;
                                        });
                                      }
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Personagem --</option>
                                    {BASE_CHARACTERS.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    Animação
                                  </label>
                                  <select
                                    value={
                                      localProjectileDatabase[currentFamily]
                                        ?.ownerAnimationKey || ""
                                    }
                                    disabled={
                                      !localProjectileDatabase[currentFamily]
                                        ?.ownerCharacterId
                                    }
                                    onChange={(e) => {
                                      const animKey = e.target.value;
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      if (!charId) return;

                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char) return;

                                      // Enforce: Only 1 character animation per projectile ID
                                      BASE_CHARACTERS.forEach((c) => {
                                        if (c.spriteConfig?.animations) {
                                          Object.keys(c.spriteConfig.animations).forEach(
                                            (k) => {
                                              if (
                                                c.spriteConfig.animations[k]
                                                  ?.projectileId === currentFamily
                                              ) {
                                                c.spriteConfig.animations[
                                                  k
                                                ].projectileId = "";
                                              }
                                            },
                                          );
                                        }
                                      });

                                      // Register on the chosen character animation
                                      if (char.spriteConfig?.animations) {
                                        if (!char.spriteConfig.animations[animKey]) {
                                          char.spriteConfig.animations[animKey] = {
                                            imageUrl: "",
                                            frames: 1,
                                            frameWidth: 128,
                                            frameHeight: 128,
                                          };
                                        }
                                        char.spriteConfig.animations[animKey] = {
                                          ...char.spriteConfig.animations[animKey],
                                          projectileId: currentFamily,
                                        };
                                      }

                                      setLocalProjectileDatabase((prev) => {
                                        const updated = { ...prev };
                                        if (updated[currentFamily]) {
                                          updated[currentFamily] = {
                                            ...updated[currentFamily],
                                            ownerAnimationKey: animKey,
                                          };
                                        }
                                        return updated;
                                      });

                                      // Auto synchronize Preview Context for fluid workflow and ensure React state updates!
                                      const updatedChar = {
                                        ...char,
                                        spriteConfig: char.spriteConfig
                                          ? {
                                              ...char.spriteConfig,
                                              animations: {
                                                ...char.spriteConfig.animations,
                                              },
                                            }
                                          : undefined,
                                      };
                                      setSelectedChar(updatedChar);
                                      setBeamPreviewCharacterId(char.id);
                                      setBeamPreviewAnimation(animKey);
                                      setSelectedState(animKey);
                                    }}
                                    className="w-full rounded-xl border border-white/5 bg-black/40 px-2 py-1.5 text-xs font-black uppercase text-indigo-300 transition-colors hover:border-white/10 focus:border-indigo-500 focus:outline-none"
                                  >
                                    <option value="">-- Sem Animação --</option>
                                    {(() => {
                                      const charId =
                                        localProjectileDatabase[currentFamily]
                                          ?.ownerCharacterId;
                                      const char = BASE_CHARACTERS.find(
                                        (c) => c.id === charId,
                                      );
                                      if (!char || !char.spriteConfig?.animations)
                                        return null;
                                      return Object.keys(char.spriteConfig.animations)
                                        .filter((k) => !k.includes("BEAM_"))
                                        .map((k) => (
                                          <option key={k} value={k}>
                                            {k.replace(/_/g, " ")}
                                          </option>
                                        ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {config && (
                  <div className="space-y-4 pt-4 border-t border-white/5 bg-[#141416] p-4 rounded-2xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      Sliders Dimensionais & Alinhamentos
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Rotação (Graus)
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("rotation", undefined)
                          }
                          className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                      <SliderWithControls
                        min={-180}
                        max={180}
                        step={1}
                        value={config.rotation || 0}
                        onChange={(val) => handleConfigChange("rotation", val)}
                        accentColor="sky-500"
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Scale / Escala
                        </label>
                        <button
                          onClick={() => handleConfigChange("scale", undefined)}
                          className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                      <SliderWithControls
                        min={0.1}
                        max={12.0}
                        step={0.05}
                        value={config.scale || 1.0}
                        onChange={(val) => handleConfigChange("scale", val)}
                        accentColor="sky-500"
                      />
                    </div>

                    {(selectedState?.includes("BEAM_") ||
                      activeTab === "BEAM") && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Espaçamento do Beam / Distância Meio (Pode ser
                            Negativo)
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("beamSpacing", undefined)
                            }
                            className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                          >
                            Limpar
                          </button>
                        </div>
                        <SliderWithControls
                          min={-400}
                          max={400}
                          step={1}
                          value={
                            config.beamSpacing !== undefined
                              ? config.beamSpacing
                              : 0
                          }
                          onChange={(val) =>
                            handleConfigChange("beamSpacing", val)
                          }
                          accentColor="sky-500"
                        />
                      </div>
                    )}

                     <div className="space-y-2 pt-2 border-t border-white/5">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           Origem do Disparo X (Shoot Pos X)
                         </label>
                         <button
                           onClick={() =>
                             handleConfigChange("kiOriginX", undefined)
                           }
                           className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                         >
                           Limpar
                         </button>
                       </div>
                       <SliderWithControls
                         min={-600}
                         max={1200}
                         step={1}
                         value={
                           (() => {
                             const activeCat = getActiveContextCategory(activeTab);
                             if (activeCat === "CHARACTER") {
                               return config.kiOriginX ?? 76;
                             }
                             const contextKey = getAttackContextKey(selectedState, selectedChar);
                             const animKeyToUse = contextKey || selectedState;
                             const animConf = selectedChar.spriteConfig?.animations?.[animKeyToUse];
                             return animConf?.kiOriginX ?? 76;
                           })()
                         }
                         onChange={(val) => handleConfigChange("kiOriginX", val)}
                         accentColor="sky-500"
                       />
                     </div>
 
                     <div className="space-y-2 pt-2 border-t border-white/5">
                       <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                           Origem do Disparo Y (Shoot Pos Y)
                         </label>
                         <button
                           onClick={() =>
                             handleConfigChange("kiOriginY", undefined)
                           }
                           className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                         >
                           Limpar
                         </button>
                       </div>
                       <SliderWithControls
                         min={-600}
                         max={1200}
                         step={1}
                         value={
                           (() => {
                             const activeCat = getActiveContextCategory(activeTab);
                             if (activeCat === "CHARACTER") {
                               return config.kiOriginY ?? 125;
                             }
                             const contextKey = getAttackContextKey(selectedState, selectedChar);
                             const animKeyToUse = contextKey || selectedState;
                             const animConf = selectedChar.spriteConfig?.animations?.[animKeyToUse];
                             return animConf?.kiOriginY ?? 125;
                           })()
                         }
                         onChange={(val) => handleConfigChange("kiOriginY", val)}
                         accentColor="sky-500"
                       />
                     </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {activeTab === "BEAM" && (selectedBeamPart === "middle" || selectedBeamPart === "end") ? (
                            <span className="text-amber-500 flex items-center gap-1">
                              Sprite Offset X (Bloqueado)
                            </span>
                          ) : (
                            "Sprite Offset X"
                          )}
                        </label>
                        {!(activeTab === "BEAM" && (selectedBeamPart === "middle" || selectedBeamPart === "end")) && (
                          <button
                            onClick={() =>
                              handleConfigChange("offsetX", undefined)
                            }
                            className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <SliderWithControls
                        min={-1800}
                        max={1800}
                        step={1}
                        value={config.offsetX || 0}
                        onChange={(val) => handleConfigChange("offsetX", val)}
                        accentColor="sky-500"
                        disabled={activeTab === "BEAM" && (selectedBeamPart === "middle" || selectedBeamPart === "end")}
                      />
                      {activeTab === "BEAM" && selectedBeamPart === "middle" && (
                        <p className="text-[9px] text-amber-500/80 italic font-medium mt-1">
                          O eixo X do Meio não é editável. Utilizado exclusivamente para alinhamento vertical.
                        </p>
                      )}
                      {activeTab === "BEAM" && selectedBeamPart === "end" && (
                        <p className="text-[9px] text-amber-500/80 italic font-medium mt-1">
                          O eixo X da Ponta é controlado pelo sistema de avanço do Beam.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Sprite Offset Y
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("offsetY", undefined)
                          }
                          className="text-[10px] text-sky-400 font-black uppercase tracking-widest hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                      <SliderWithControls
                        min={-1800}
                        max={1800}
                        step={1}
                        value={config.offsetY || 0}
                        onChange={(val) => handleConfigChange("offsetY", val)}
                        accentColor="sky-500"
                      />
                    </div>

                    {((activeTab === "BEAM" && selectedBeamPart === "middle") ||
                      activeTab === "KI_BLAST" ||
                      activeTab === "GENKIDAMA" ||
                      activeTab === "fechosenergia") && (
                      <div className="space-y-4 pt-4 border-t border-red-500/20 bg-red-500/5 p-3 rounded-lg border mt-4">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                          Collision Hitbox & Speed Data
                        </h4>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Largura do Projétil
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange("projectileWidth", undefined)
                              }
                              className="text-[10px] text-red-400 font-black hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                          <SliderWithControls
                            min={1}
                            max={1000}
                            step={1}
                            value={config.projectileWidth ?? 120}
                            onChange={(val) =>
                              handleConfigChange("projectileWidth", val)
                            }
                            accentColor="red-500"
                          />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Altura do Projétil
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  "projectileHeight",
                                  undefined,
                                )
                              }
                              className="text-[10px] text-red-400 font-black hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                          <SliderWithControls
                            min={1}
                            max={1000}
                            step={1}
                            value={config.projectileHeight ?? 60}
                            onChange={(val) =>
                              handleConfigChange("projectileHeight", val)
                            }
                            accentColor="red-500"
                          />
                        </div>

                        {activeTab !== "fechosenergia" && (
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Offset X de Colisão
                              </label>
                              <button
                                onClick={() =>
                                  handleConfigChange(
                                    "projectileOffsetX",
                                    undefined,
                                  )
                                }
                                className="text-[10px] text-red-400 font-black hover:underline"
                              >
                                Limpar
                              </button>
                            </div>
                            <SliderWithControls
                              min={-600}
                              max={600}
                              step={1}
                              value={config.projectileOffsetX ?? 0}
                              onChange={(val) =>
                                handleConfigChange("projectileOffsetX", val)
                              }
                              accentColor="red-500"
                            />
                          </div>
                        )}

                        {activeTab !== "fechosenergia" && (
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Offset Y de Colisão
                              </label>
                              <button
                                onClick={() =>
                                  handleConfigChange(
                                    "projectileOffsetY",
                                    undefined,
                                  )
                                }
                                className="text-[10px] text-red-400 font-black hover:underline"
                              >
                                Limpar
                              </button>
                            </div>
                            <SliderWithControls
                              min={-600}
                              max={600}
                              step={1}
                              value={config.projectileOffsetY ?? 0}
                              onChange={(val) =>
                                handleConfigChange("projectileOffsetY", val)
                              }
                              accentColor="red-500"
                            />
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Velocidade do Projétil
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange("projectileSpeed", undefined)
                              }
                              className="text-[10px] text-red-400 font-black hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                          <SliderWithControls
                            min={0}
                            max={150}
                            step={1}
                            value={config.projectileSpeed ?? 18}
                            onChange={(val) =>
                              handleConfigChange("projectileSpeed", val)
                            }
                            accentColor="red-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "BEAM_LINKS" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-sky-500/20">
                  <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    Beam Connections
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Configure which animations trigger which beams. This works
                    for specials, supers, and ultimates.
                  </p>

                  <div className="space-y-2 mt-4">
                    {(() => {
                      const spConfig =
                        selectedChar.spriteConfig?.animations || {};
                      // Find all animations that can reasonably trigger a beam.
                      // Let's just list the ones currently creating a beam, PLUS an "Add New Link" dropdown

                      const createOptions = Object.keys(localBeamDatabase)
                        .filter((id) => {
                          const existsInDict = BEAM_DATABASE[id] !== undefined;
                          const isNotChave = !id.startsWith("CHAVE_");
                          const isNotOther =
                            !id.includes("FECHO") &&
                            !id.includes("KI_BLAST") &&
                            !id.includes("GENKIDAMA") &&
                            !id.includes("PROJETIL");
                          const isNotDuplicate =
                            id !== "BEAM_1" && id !== "BEAM_2";
                          return (
                            existsInDict &&
                            isNotChave &&
                            isNotOther &&
                            isNotDuplicate
                          );
                        })
                        .map((id) => ({
                          value: id,
                          label: localBeamDatabase[id].name,
                        }));

                      const anims = Object.keys(spConfig).filter(
                        (k) => !k.includes("BEAM_"),
                      );

                      const visibleAnims = anims;

                      const hiddenAnims: string[] = [];

                      return (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex flex-col">
                          {visibleAnims.map((animKey) => {
                            const definesBeam = spConfig[animKey]?.createsBeam;
                            const keyManager =
                              BeamConfigKeyManager.getInstance();
                            const beamConfigObj = definesBeam
                              ? (keyManager.getBeamConfig(definesBeam) as any)
                              : undefined;
                            const resolvedBaseBeamId = beamConfigObj
                              ? beamConfigObj.baseBeamId || definesBeam
                              : definesBeam;

                            return (
                              <div
                                key={animKey}
                                className="flex flex-col bg-black/40 p-3 rounded-lg border border-white/5 space-y-2"
                              >
                                <div className="text-xs font-black text-slate-300 uppercase truncate">
                                  {animKey.replace(/_/g, " ")}
                                </div>
                                <select
                                  value={resolvedBaseBeamId || ""}
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    const newAnims = { ...spConfig };
                                    if (!newAnims[animKey])
                                      newAnims[animKey] = {
                                        frames: 1,
                                        imageUrl: "",
                                      };

                                    if (val) {
                                      const keyManager =
                                        BeamConfigKeyManager.getInstance();
                                      const parentBeam = JSON.parse(
                                        JSON.stringify(
                                          localBeamDatabase[val] ||
                                            BEAM_DATABASE[val] || {
                                              name: "Custom",
                                              middle: {
                                                imageUrl: "",
                                                frames: 1,
                                                frameWidth: 0,
                                                frameHeight: 0,
                                              },
                                            },
                                        ),
                                      ) as any;
                                      const baseBeamId =
                                        (parentBeam as any).baseBeamId ||
                                        (BEAM_DATABASE[val] ? val : "BEAM");

                                      // Generate fresh exclusive animation key
                                      const newKey =
                                        keyManager.generateUniqueKeyForAnimation(
                                          selectedChar.id,
                                          animKey,
                                          baseBeamId,
                                        );

                                      const cleanBaseName = parentBeam.name
                                        ? parentBeam.name.split(" (")[0]
                                        : val.replace(/_/g, " ");
                                      const personalizedName = `${cleanBaseName} (${selectedChar.name} - ${animKey.replace(/_/g, " ")})`;

                                      keyManager.registerBeam(
                                        newKey,
                                        baseBeamId,
                                        personalizedName,
                                        {
                                          ...parentBeam,
                                          name: personalizedName,
                                          ownerCharacterId: selectedChar.id,
                                          ownerAnimationKey: animKey,
                                          ownerCharacterName: selectedChar.name,
                                        },
                                      );

                                      setLocalBeamDatabase((prev) => ({
                                        ...prev,
                                        [newKey]:
                                          keyManager.getBeamConfig(newKey)!,
                                      }));

                                      newAnims[animKey] = {
                                        ...newAnims[animKey],
                                        createsBeam: newKey,
                                      };
                                      setSelectedBeamFamilyId(newKey);
                                    } else {
                                      const updated = { ...newAnims[animKey] };
                                      delete updated.createsBeam;
                                      newAnims[animKey] = updated;
                                    }

                                    setSelectedChar((prev) => ({
                                      ...prev,
                                      spriteConfig: {
                                        ...prev.spriteConfig!,
                                        animations: newAnims,
                                      },
                                    }));

                                    if (animKey === selectedState) {
                                      setConfig(newAnims[animKey]);
                                    }
                                  }}
                                  className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-mono focus:border-sky-500"
                                >
                                  <option value="">-- No Beam --</option>
                                  {/* Filter options to base templates so dropdown is clean and lists only blueprints */}
                                  {Object.keys(BEAM_DATABASE)
                                    .filter((id) => {
                                      const isNotChave =
                                        !id.startsWith("CHAVE_");
                                      const isNotOther =
                                        !id.includes("FECHO") &&
                                        !id.includes("KI_BLAST") &&
                                        !id.includes("GENKIDAMA") &&
                                        !id.includes("PROJETIL");
                                      const isNotDuplicate =
                                        id !== "BEAM_1" && id !== "BEAM_2";
                                      return (
                                        isNotChave &&
                                        isNotOther &&
                                        isNotDuplicate
                                      );
                                    })
                                    .map((id) => (
                                      <option key={id} value={id}>
                                        {BEAM_DATABASE[id].name ||
                                          id.replace(/_/g, " ")}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            );
                          })}

                          {hiddenAnims.length > 0 && (
                            <div className="pt-4 border-t border-white/10 mt-2 flex flex-col space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Add Beam to other animation
                              </label>
                              <select
                                value=""
                                onChange={(e) => {
                                  const animKey = e.target.value;
                                  if (!animKey) return;

                                  const newAnims = { ...spConfig };
                                  if (!newAnims[animKey])
                                    newAnims[animKey] = {
                                      frames: 1,
                                      imageUrl: "",
                                    };

                                  const keyManager =
                                    BeamConfigKeyManager.getInstance();
                                  const baseBeamId = "BEAM";
                                  const newKey =
                                    keyManager.generateUniqueKeyForAnimation(
                                      selectedChar.id,
                                      animKey,
                                      baseBeamId,
                                    );

                                  const parentBeam = JSON.parse(
                                    JSON.stringify(
                                      BEAM_DATABASE[baseBeamId] || {
                                        name: "Custom",
                                        middle: {
                                          imageUrl: "",
                                          frames: 1,
                                          frameWidth: 0,
                                          frameHeight: 0,
                                        },
                                      },
                                    ),
                                  ) as any;
                                  const personalizedName = `${parentBeam.name || baseBeamId} (${selectedChar.name} - ${animKey.replace(/_/g, " ")})`;

                                  keyManager.registerBeam(
                                    newKey,
                                    baseBeamId,
                                    personalizedName,
                                    {
                                      ...parentBeam,
                                      name: personalizedName,
                                      ownerCharacterId: selectedChar.id,
                                      ownerAnimationKey: animKey,
                                      ownerCharacterName: selectedChar.name,
                                    },
                                  );

                                  setLocalBeamDatabase((prev) => ({
                                    ...prev,
                                    [newKey]: keyManager.getBeamConfig(newKey)!,
                                  }));

                                  newAnims[animKey] = {
                                    ...newAnims[animKey],
                                    createsBeam: newKey,
                                  };

                                  setSelectedChar((prev) => ({
                                    ...prev,
                                    spriteConfig: {
                                      ...prev.spriteConfig!,
                                      animations: newAnims,
                                    },
                                  }));

                                  if (animKey === selectedState) {
                                    setConfig(newAnims[animKey]);
                                  }
                                  setSelectedBeamFamilyId(newKey);
                                }}
                                className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-mono focus:border-sky-500"
                              >
                                <option value="">-- Select Animation --</option>
                                {hiddenAnims.map((a) => (
                                  <option key={a} value={a}>
                                    {a.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === "BEAMS_MANAGER" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-5 rounded-2xl border border-sky-500/20">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-indigo-400" />{" "}
                        Gerenciador de Chaves
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Central de administração e organização de chaves de
                        configuração exclusivas por classe de ataque.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const beamMgr = BeamConfigKeyManager.getInstance();
                        const projMgr =
                          ProjectileConfigKeyManager.getInstance();
                        const auraMgr = AuraConfigKeyManager.getInstance();
                        const vfxMgr = EffectConfigKeyManager.getInstance();

                        const removedBeams =
                          beamMgr.cleanupOrphanedBeams(BASE_CHARACTERS);
                        const removedProjs =
                          projMgr.cleanupOrphanedProjectiles(BASE_CHARACTERS);
                        const removedAuras =
                          auraMgr.cleanupDuplicateAndOrphanedAuras(
                            BASE_CHARACTERS,
                          );
                        const removedVfx =
                          vfxMgr.cleanupDuplicateAndOrphanedEffects(
                            BASE_CHARACTERS,
                          );

                        setLocalBeamDatabase({ ...beamMgr.getAllBeams() });
                        setLocalProjectileDatabase({
                          ...projMgr.getAllProjectiles(),
                        });
                        setLocalAuraDatabase({ ...auraMgr.getAllAuras() });
                        setLocalEffectDatabase({ ...vfxMgr.getAllEffects() });

                        const msg =
                          removedBeams > 0 ||
                          removedProjs > 0 ||
                          removedAuras > 0 ||
                          removedVfx > 0
                            ? `Sucesso! Foram limpas/deduplicadas ${removedBeams} chave(s) de Beam, ${removedProjs} chave(s) de Projétil, ${removedAuras} chave(s) de Aura e ${removedVfx} chave(s) de VFX duplicadas ou órfãs que não estavam mais associadas.`
                            : "Tudo limpo! Nenhuma chave duplicada ou órfã encontrada. Todas as chaves estão em perfeito estado e em uso por animações ativas.";
                        alert(msg);
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                    >
                      Limpar Chaves Órfãs
                    </button>
                  </div>

                  {/* Seleção de Classe/Tipo de Chaves */}
                  <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                    {(
                      [
                        "BEAM",
                        "PROJECTILE",
                        "FECHO",
                        "GENKIDAMA",
                        "AURA",
                        "VFX",
                      ] as const
                    ).map((cls) => {
                      const isActive = activeManagerClass === cls;
                      const label =
                        cls === "BEAM"
                          ? "Beam"
                          : cls === "PROJECTILE"
                            ? "Projétil"
                            : cls === "FECHO"
                              ? "Fecho"
                              : cls === "GENKIDAMA"
                                ? "Genkidama"
                                : cls === "AURA"
                                  ? "Aura"
                                  : "VFX";
                      const count =
                        cls === "BEAM"
                          ? Object.keys(localBeamDatabase).filter((k) =>
                              k.startsWith("CHAVE_"),
                            ).length
                          : cls === "PROJECTILE"
                            ? Object.keys(localProjectileDatabase).filter(
                                (k) => {
                                  const isCustom =
                                    k.startsWith("CHAVE_") ||
                                    !PROJECTILE_DATABASE[k] ||
                                    k.match(/_\d{3,4}$/);
                                  return (
                                    isCustom &&
                                    (k.includes("KI_BLAST") ||
                                      k.includes("PROJETIL") ||
                                      (!k.includes("GENKIDAMA") &&
                                        !k.includes("FECHO")))
                                  );
                                },
                              ).length
                            : cls === "FECHO"
                              ? Object.keys(localProjectileDatabase).filter(
                                  (k) => {
                                    const isCustom =
                                      k.startsWith("CHAVE_") ||
                                      !PROJECTILE_DATABASE[k] ||
                                      k.match(/_\d{3,4}$/);
                                    return (
                                      isCustom &&
                                      (k.includes("FECHO") ||
                                        k.includes("fechosenergia"))
                                    );
                                  },
                                ).length
                              : cls === "GENKIDAMA"
                                ? Object.keys(localProjectileDatabase).filter(
                                    (k) => {
                                      const isCustom =
                                        k.startsWith("CHAVE_") ||
                                        !PROJECTILE_DATABASE[k] ||
                                        k.match(/_\d{3,4}$/);
                                      return (
                                        isCustom &&
                                        k.includes("GENKIDAMA") &&
                                        !k.includes("_EXPLODE") &&
                                        !k.includes("_DISSIPATE") &&
                                        !k.includes("_CHAO") &&
                                        !k.includes("_COLLISION") &&
                                        !k.includes("_FINAL")
                                      );
                                    },
                                  ).length
                            : cls === "VFX"
                              ? Object.keys(localEffectDatabase).filter((k) =>
                                  k.startsWith("CHAVE_"),
                                ).length
                            : Object.keys(localAuraDatabase).filter((k) =>
                                k.startsWith("CHAVE_"),
                              ).length;

                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setActiveManagerClass(cls)}
                          className={`flex-1 min-w-[70px] py-2 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                            isActive
                              ? "bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm"
                              : "text-slate-400 hover:text-white border-transparent hover:bg-white/5"
                          }`}
                        >
                          {label}{" "}
                          <span className="bg-black/30 px-1.5 py-0.5 rounded-md font-mono text-[9px] text-slate-500">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Button to Create Custom Aura Key */}
                  {activeManagerClass === "AURA" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager = AuraConfigKeyManager.getInstance();
                        const newKey = keyManager.generateKey();

                        const newAura = keyManager.registerAura(
                          newKey,
                          "AURA_001",
                          newKey,
                          {
                            ownerCharacterId: selectedChar.id,
                            ownerAnimationKey:
                              selectedState === "IDLE"
                                ? "CHARGING"
                                : selectedState,
                            isDefaultCharging: true,
                            color: "#ffffff",
                            auraHueRotate: 0,
                            auraSaturate: 1,
                            auraBrightness: 1,
                            auraContrast: 1,
                            auraOpacity: 0.85,
                          },
                        );

                        setLocalAuraDatabase((prev) => ({
                          ...prev,
                          [newKey]: newAura,
                        }));
                        setSelectedAuraKey(newKey);
                        setActiveTab("AURAS");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-amber-500/20 text-amber-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-400" /> + CRIAR NOVA
                      CHAVE DE AURA PERSONALIZADA
                    </button>
                  )}

                  {activeManagerClass === "BEAM" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager = BeamConfigKeyManager.getInstance();
                        const newKey = keyManager.generateNextSequentialKey();
                        const suffix = newKey.split("_").pop();
                        const newName =
                          prompt(
                            "Insira o nome para esta nova configuração de Beam:",
                            `CHAVE_BEAM_${suffix}`,
                          ) || `CHAVE_BEAM_${suffix}`;

                        const baseBeam = BEAM_DATABASE["BEAM"] || {
                          name: "Beam Padrão",
                          middle: {},
                        };
                        const clonedBeam = JSON.parse(JSON.stringify(baseBeam));
                        clonedBeam.name = newName;

                        keyManager.registerBeam(
                          newKey,
                          "BEAM",
                          newName,
                          clonedBeam,
                        );

                        setLocalBeamDatabase(keyManager.getAllBeams());
                        setSelectedBeamFamilyId("BEAM");
                        setDestinationBeamKey(newKey);
                        setActiveTab("BEAM");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 border border-sky-500/20 text-sky-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-sky-400" /> + CRIAR CHAVE
                      (BEAM)
                    </button>
                  )}

                  {activeManagerClass === "PROJECTILE" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager =
                          ProjectileConfigKeyManager.getInstance();
                        const newKey =
                          keyManager.generateNextSequentialProjectileKey();
                        const suffix = newKey.split("_").pop();
                        const newName =
                          prompt(
                            "Insira o nome para esta nova configuração de Projétil:",
                            `CHAVE_PROJETIL_${suffix}`,
                          ) || `CHAVE_PROJETIL_${suffix}`;

                        const baseProj = PROJECTILE_DATABASE["PROJETIL_1"] || {
                          name: "Projétil Padrão",
                          middle: {},
                        };
                        const clonedProj = JSON.parse(JSON.stringify(baseProj));
                        clonedProj.name = newName;

                        keyManager.registerProjectile(
                          newKey,
                          "PROJETIL_1",
                          newName,
                          clonedProj,
                        );

                        setLocalProjectileDatabase(
                          keyManager.getAllProjectiles(),
                        );
                        setSelectedProjectileFamilyId("PROJETIL_1");
                        setDestinationProjectileKey(newKey);
                        setActiveTab("KI_BLAST");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:to-indigo-500/20 border border-rose-500/20 text-rose-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-rose-400" /> + CRIAR CHAVE
                      (PROJÉTEIS)
                    </button>
                  )}

                  {activeManagerClass === "FECHO" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager =
                          ProjectileConfigKeyManager.getInstance();
                        const newKey =
                          keyManager.generateNextSequentialFechoKey();
                        const suffix = newKey.split("_").pop();
                        const newName =
                          prompt(
                            "Insira o nome para esta nova configuração de Fecho de Energia:",
                            `CHAVE_FECHO_${suffix}`,
                          ) || `CHAVE_FECHO_${suffix}`;

                        const baseProj = PROJECTILE_DATABASE[
                          "fechosenergia_1"
                        ] || { name: "Fecho Padrão", middle: {} };
                        const clonedProj = JSON.parse(JSON.stringify(baseProj));
                        clonedProj.name = newName;

                        keyManager.registerProjectile(
                          newKey,
                          "fechosenergia_1",
                          newName,
                          clonedProj,
                        );

                        setLocalProjectileDatabase(
                          keyManager.getAllProjectiles(),
                        );
                        setSelectedProjectileFamilyId("fechosenergia_1");
                        setDestinationProjectileKey(newKey);
                        setActiveTab("fechosenergia");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 hover:from-emerald-500/20 hover:to-indigo-500/20 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" /> + CRIAR
                      CHAVE (FECHOS DE ENERGIA)
                    </button>
                  )}

                  {activeManagerClass === "VFX" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager = EffectConfigKeyManager.getInstance();
                        const newKey = keyManager.generateKey();

                        const newEffect = keyManager.registerEffect(
                          newKey,
                          "EFFECT_POEIRA_01",
                          newKey,
                          {
                            ownerCharacterId: selectedChar.id,
                            ownerAnimationKey: selectedState,
                            ownerCharacterName: selectedChar.name,
                          },
                        );

                        setLocalEffectDatabase((prev) => ({
                          ...prev,
                          [newKey]: newEffect,
                        }));
                        setSelectedEffectKey(newKey);
                        setActiveTab("VFX");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/20 text-green-400 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-green-400" /> + CRIAR NOVA
                      CHAVE DE EFEITO VFX
                    </button>
                  )}

                  {activeManagerClass === "GENKIDAMA" && (
                    <button
                      type="button"
                      onClick={() => {
                        const keyManager =
                          ProjectileConfigKeyManager.getInstance();
                        const newKey =
                          keyManager.generateNextSequentialGenkidamaKey();
                        const suffix = newKey.split("_").pop();
                        const newName =
                          prompt(
                            "Insira o nome para esta nova configuração de Genkidama:",
                            `CHAVE_GENKIDAMA_${suffix}`,
                          ) || `CHAVE_GENKIDAMA_${suffix}`;

                        const baseProj = PROJECTILE_DATABASE["GENKIDAMA_1"] || {
                          name: "Genkidama Padrão",
                          middle: {},
                        };
                        const clonedProj = JSON.parse(JSON.stringify(baseProj));
                        clonedProj.name = newName;

                        keyManager.registerProjectile(
                          newKey,
                          "GENKIDAMA_1",
                          newName,
                          clonedProj,
                        );

                        setLocalProjectileDatabase(
                          keyManager.getAllProjectiles(),
                        );
                        setSelectedProjectileFamilyId("GENKIDAMA_1");
                        setDestinationProjectileKey(newKey);
                        setActiveTab("GENKIDAMA");
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 text-amber-500 font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-black/20 inline-flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-500" /> + CRIAR CHAVE
                      (genkidamas)
                    </button>
                  )}

                  {/* PAINEL DE CHAVES INATIVAS E EXPORTAÇÃO */}
                  {activeManagerClass !== "AURA" && (
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-sky-400" />
                          <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                            Resumo de Chaves (Ativas vs Inativas)
                          </span>
                        </div>
                        <span className="text-[9px] bg-slate-500/10 border border-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                          Local / Editor
                        </span>
                      </div>

                      {/* Grid de Contagem */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(
                          ["BEAM", "PROJECTILE", "GENKIDAMA", "FECHO"] as const
                        ).map((cat) => {
                          const counts = getCategoryCounts(cat);
                          const label =
                            cat === "BEAM"
                              ? "Beam"
                              : cat === "PROJECTILE"
                                ? "Projétil"
                                : cat === "GENKIDAMA"
                                  ? "Genkidama"
                                  : "Fecho";
                          const isCatActive = activeManagerClass === cat;
                          return (
                            <div
                              key={cat}
                              onClick={() => setActiveManagerClass(cat)}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                                isCatActive
                                  ? "bg-sky-500/5 border-sky-500/30 shadow-md shadow-sky-500/5"
                                  : "bg-black/20 border-white/5 hover:border-white/10"
                              }`}
                            >
                              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1 flex items-center justify-between">
                                <span>{label}</span>
                                {isCatActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                )}
                              </div>
                              <div className="space-y-0.5 font-mono text-[10px]">
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span>Ativas:</span>
                                  <span className="font-bold">
                                    {counts.active}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-amber-400">
                                  <span>Inativas:</span>
                                  <span className="font-bold">
                                    {counts.inactive}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Botões de Cópia / Exportação */}
                      <div className="pt-1 space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyInactiveKeysToClipboard(
                              ["BEAM", "PROJECTILE", "GENKIDAMA", "FECHO"],
                              "Exportação de Todas as Chaves Inativas",
                            )
                          }
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar Todas as
                          Chaves Inativas
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copyInactiveKeysToClipboard(
                                ["BEAM"],
                                "Exportação de Beams Inativos",
                              )
                            }
                            className="py-1.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Copiar Beams Inativos
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyInactiveKeysToClipboard(
                                ["PROJECTILE"],
                                "Exportação de Projéteis Inativos",
                              )
                            }
                            className="py-1.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Copiar Projéteis Inativos
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyInactiveKeysToClipboard(
                                ["GENKIDAMA"],
                                "Exportação de genkidamas Inativas",
                              )
                            }
                            className="py-1.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Copiar genkidamas Inativas
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyInactiveKeysToClipboard(
                                ["FECHO"],
                                "Exportação de Fechos Inativos",
                              )
                            }
                            className="py-1.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Copiar Fechos Inativos
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campo de Pesquisa */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Pesquisar chave ou nome de ${activeManagerClass.toLowerCase()}...`}
                      value={beamSearchQuery}
                      onChange={(e) => setBeamSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-sky-500 transition-all rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-medium"
                    />
                    {beamSearchQuery && (
                      <button
                        onClick={() => setBeamSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Lista de Chaves Filtrada por Categoria */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {(() => {
                      let keysList: string[] = [];
                      let databaseUsed: Record<string, any> = {};

                      if (activeManagerClass === "BEAM") {
                        databaseUsed = localBeamDatabase;
                        keysList = Object.keys(localBeamDatabase).filter(
                          (key) => {
                            if (!key.startsWith("CHAVE_")) return false;
                            // Ensure it's a beam key
                            if (!key.includes("BEAM")) return false;
                            
                            const b = localBeamDatabase[key];
                            if (!b) return false;
                            const tSearch =
                              `${b.name || ""} ${key}`.toLowerCase();
                            return tSearch.includes(
                              beamSearchQuery.toLowerCase(),
                            );
                          },
                        );
                      } else if (activeManagerClass === "AURA") {
                        databaseUsed = localAuraDatabase;
                        keysList = Object.keys(localAuraDatabase).filter(
                          (key) => {
                            if (!key.startsWith("CHAVE_")) return false;
                            // Ensure it's an aura key
                            if (!key.includes("AURA")) return false;

                            const a = localAuraDatabase[key];
                            if (!a) return false;
                            const tSearch =
                              `${a.name || ""} ${key}`.toLowerCase();
                            return tSearch.includes(
                              beamSearchQuery.toLowerCase(),
                            );
                          },
                        );
                      } else if (activeManagerClass === "VFX") {
                        databaseUsed = localEffectDatabase;
                        const standardKeys = Object.keys(DEFAULT_EFFECTS);
                        keysList = Object.keys(localEffectDatabase).filter(
                          (key) => {
                            const e = localEffectDatabase[key];
                            if (!e) return false;

                            // Strictly filter for VFX/Effect keys
                            // Priority: custom keys (not in standard), or keys starting with CHAVE_VFX_ or having image in /efeitos/ folder
                            const isStandard = standardKeys.includes(key);
                            const isVFXKey = key.startsWith("CHAVE_VFX_") || 
                                           key.startsWith("VFX_") || 
                                           key.startsWith("EFFECT_") ||
                                           key.startsWith("CHAVE_");
                                           
                            const isEffectPath = e.imageUrl?.includes("/efeitos/") || 
                                               e.spriteConfig?.animations?.default?.imageUrl?.includes("/efeitos/") ||
                                               JSON.stringify(e).includes("/efeitos/");

                            // If it's a generic key but contains Genkidama/Projectile keywords, it's NOT a VFX unless it has effect path
                            const isProjectileOrGenk = key.includes("GENKIDAMA") || 
                                                     key.includes("PROJETIL") || 
                                                     key.includes("KI_BLAST") ||
                                                     key.includes("BEAM") ||
                                                     key.includes("FECHO");

                            if (isProjectileOrGenk && !isEffectPath) return false;

                            // If it's standard, we only show if it fits VFX patterns
                            if (isStandard && !isVFXKey && !isEffectPath) return false;
                            
                            // If it's custom, we show it!
                            if (!isStandard) {
                                // show all custom keys in VFX tab
                            } else if (!isVFXKey && !isEffectPath) {
                                return false;
                            }

                            const tSearch =
                              `${e.name || ""} ${key}`.toLowerCase();
                            return tSearch.includes(
                              beamSearchQuery.toLowerCase(),
                            );
                          },
                        );
                      } else {
                        databaseUsed = localProjectileDatabase;
                        keysList = Object.keys(localProjectileDatabase).filter(
                          (key) => {
                            const isCustom =
                              key.startsWith("CHAVE_") ||
                              !PROJECTILE_DATABASE[key] ||
                              key.match(/_\d{3,4}$/);
                            if (!isCustom) return false;

                            const p = localProjectileDatabase[key];
                            if (!p) return false;

                            if (activeManagerClass === "PROJECTILE") {
                              const isProj =
                                (key.includes("KI_BLAST") || key.includes("PROJETIL") || key.includes("CHAVE_PROJETIL")) &&
                                !key.includes("GENKIDAMA") &&
                                !key.includes("FECHO");
                              if (!isProj) return false;
                            } else if (activeManagerClass === "FECHO") {
                              const isFecho =
                                key.includes("FECHO") ||
                                key.includes("fechosenergia");
                              if (!isFecho) return false;
                            } else if (activeManagerClass === "GENKIDAMA") {
                              const isGenk =
                                key.includes("GENKIDAMA") &&
                                !key.includes("_EXPLODE") &&
                                !key.includes("_DISSIPATE") &&
                                !key.includes("_CHAO") &&
                                !key.includes("_COLLISION") &&
                                !key.includes("_FINAL");
                              if (!isGenk) return false;
                            }

                            const tSearch =
                              `${p.name || ""} ${key}`.toLowerCase();
                            return tSearch.includes(
                              beamSearchQuery.toLowerCase(),
                            );
                          },
                        );
                      }

                      if (keysList.length === 0) {
                        return (
                          <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-white/5">
                            <p className="text-xs text-slate-500 font-medium">
                              Nenhuma chave configurada nesta categoria.
                            </p>
                          </div>
                        );
                      }

                      const renderKeyCard = (key: string) => {
                        const item = databaseUsed[key];
                        if (!item) return null;

                        // Determinar usos (quais personagens/animações usam esta chave)
                        const usages: {
                          charName: string;
                          animName: string;
                          charId: string;
                        }[] = [];

                        if (activeManagerClass === "AURA") {
                          const auraItem = localAuraDatabase[key];
                          if (auraItem && auraItem.ownerCharacterId) {
                            const char = BASE_CHARACTERS.find(
                              (c) => c.id === auraItem.ownerCharacterId,
                            );
                            if (char) {
                              let animLabel = auraItem.ownerAnimationKey || "Geral";
                              if (auraItem.isDefaultCharging) animLabel = "Carregamento Padrão";
                              if (auraItem.isDefaultSparking) animLabel = "Sparking Padrão";
                              usages.push({
                                charName: char.name,
                                animName: animLabel,
                                charId: char.id,
                              });
                            }
                          }
                        } else if (activeManagerClass === "VFX") {
                          const effectItem = localEffectDatabase[key];
                          // 1. Check direct ownership
                          if (effectItem && effectItem.ownerCharacterId) {
                            const char = BASE_CHARACTERS.find(
                              (c) => c.id === effectItem.ownerCharacterId,
                            );
                            if (char) {
                              usages.push({
                                charName: char.name,
                                animName: effectItem.ownerAnimationKey || "Geral",
                                charId: char.id,
                              });
                            }
                          }
                          // 2. Check all characters for references (in case ownership info is missing)
                          BASE_CHARACTERS.forEach(char => {
                            const anims = char.spriteConfig?.animations || {};
                            Object.keys(anims).forEach(animKey => {
                              const anim = anims[animKey];
                              if (anim && anim.effectConfigKey === key) {
                                // Evitar duplicatas se já adicionado via owner
                                if (!usages.some(u => u.charId === char.id && u.animName === animKey)) {
                                  usages.push({
                                    charName: char.name,
                                    animName: animKey,
                                    charId: char.id
                                  });
                                }
                              }
                            });
                          });
                        } else {
                          // Beams, Projectiles, Genkidamas, Fechos
                          BASE_CHARACTERS.forEach((char) => {
                            const anims = char.spriteConfig?.animations || {};
                            Object.keys(anims).forEach((animKey) => {
                              const anim = anims[animKey];
                              if (!anim) return;

                              if (activeManagerClass === "BEAM") {
                                if (anim.createsBeam === key || anim.projectileId === key) {
                                  usages.push({
                                    charName: char.name,
                                    animName: animKey,
                                    charId: char.id,
                                  });
                                }
                              } else {
                                if (anim.projectileId === key) {
                                  usages.push({
                                    charName: char.name,
                                    animName: animKey,
                                    charId: char.id,
                                  });
                                }
                              }
                            });
                          });
                        }

                        const hasLinks = usages.length > 0;
                        const isSelectedForEdit =
                          activeManagerClass === "AURA"
                            ? selectedAuraKey === key
                            : activeManagerClass === "VFX"
                              ? selectedEffectKey === key
                              : activeManagerClass === "BEAM"
                                ? selectedBeamFamilyId === key
                                : selectedProjectileFamilyId === key;

                        const isOfficial =
                          activeManagerClass === "BEAM"
                            ? !!BEAM_DATABASE[key]
                            : (activeManagerClass === "AURA" || activeManagerClass === "VFX")
                              ? false
                              : !!PROJECTILE_DATABASE[key];

                        const isActive = isKeyActive(key);
                        const isInactive = !isActive && activeManagerClass !== "AURA" && !isOfficial;

                        return (
                          <div
                            key={key}
                            className={`flex flex-col bg-black/40 border rounded-xl overflow-hidden transition-all ${isSelectedForEdit ? "border-sky-500/40 shadow-lg shadow-sky-500/5 bg-sky-500/5" : "border-white/5 hover:border-white/10"}`}
                          >
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              {isInactive && (
                                <div className="flex items-center pr-1.5 shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedInactiveKeys.includes(key)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setSelectedInactiveKeys(prev => [...prev, key]);
                                      } else {
                                        setSelectedInactiveKeys(prev => prev.filter(k => k !== key));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-white/15 bg-black/40 text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 cursor-pointer"
                                  />
                                </div>
                              )}
                              {/* Informações Básicas */}
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-200 uppercase tracking-wide">
                                    {item.name || key.replace(/_/g, " ")}
                                  </span>
                                  {item.color && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-white/20"
                                      style={{ backgroundColor: item.color }}
                                    />
                                  )}

                                  {/* Badges de Status (Ativa / Inativa) */}
                                  {activeManagerClass !== "AURA" && (
                                    <div className="flex items-center gap-1.5">
                                      {isOfficial ? (
                                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black uppercase text-emerald-400 tracking-wider">
                                          Oficial
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleKeyActiveStatus(key);
                                          }}
                                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border transition-all ${
                                            isActive
                                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                                              : "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20 hover:text-slate-300"
                                          }`}
                                          title={
                                            isActive
                                              ? "Clique para marcar como Inativa"
                                              : "Clique para marcar como Ativa"
                                          }
                                        >
                                          {isActive ? "● Ativa" : "○ Inativa"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400">
                                  <span>CHAVE:</span>
                                  <span className="bg-black/30 px-1.5 py-0.5 rounded text-indigo-300 font-extrabold">
                                    {key}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(key);
                                      alert("Chave de configuração copiada!");
                                    }}
                                    className="hover:text-white transition-colors"
                                    title="Copiar Chave"
                                  >
                                    <Copy className="w-3.5 h-3.5 inline ml-1" />
                                  </button>
                                </div>
                                {(item as any).ownerCharacterName && (
                                  <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                                    Proprietário:{" "}
                                    <span className="text-amber-400 font-black">
                                      {(item as any).ownerCharacterName}
                                    </span>{" "}
                                    (
                                    {(item as any).ownerAnimationKey?.replace(
                                      /_/g,
                                      " ",
                                    )}
                                    )
                                  </div>
                                )}
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  onClick={() => {
                                    if (activeManagerClass === "AURA") {
                                      setSelectedAuraKey(key);
                                      setActiveTab("AURAS");
                                    } else if (activeManagerClass === "VFX") {
                                      setSelectedEffectKey(key);
                                      setActiveTab("VFX");
                                    } else if (activeManagerClass === "BEAM") {
                                      setSelectedBeamFamilyId(key);
                                      setActiveTab("BEAM");
                                    } else {
                                      setSelectedProjectileFamilyId(key);
                                      setSelectedBeamFamilyId(key); // Sincroniza IDs
                                      if (activeManagerClass === "PROJECTILE") {
                                        setActiveTab("KI_BLAST");
                                      } else if (
                                        activeManagerClass === "FECHO"
                                      ) {
                                        setActiveTab("fechosenergia");
                                      } else if (
                                        activeManagerClass === "GENKIDAMA"
                                      ) {
                                        setActiveTab("GENKIDAMA");
                                      }
                                    }

                                    // Localizar o personagem e a animação vinculada para carregar e alinhar perfeitamente no preview do canvas
                                    let targetCharId = (item as any)
                                      .ownerCharacterId;
                                    let targetAnimKey = (item as any)
                                      .ownerAnimationKey;
                                    if (!targetCharId && usages.length > 0) {
                                      targetCharId = usages[0].charId;
                                      targetAnimKey = usages[0].animName;
                                    }

                                    if (targetCharId) {
                                      const foundChar = BASE_CHARACTERS.find(
                                        (c) => c.id === targetCharId,
                                      );
                                      if (foundChar) {
                                        setSelectedChar(foundChar);
                                        if (targetAnimKey) {
                                          if (
                                            targetAnimKey ===
                                              "Carregamento Padrão" ||
                                            targetAnimKey === "CHARGING"
                                          ) {
                                            setSelectedState("CHARGING");
                                          } else if (
                                            targetAnimKey ===
                                              "Sparking Padrão" ||
                                            targetAnimKey === "SPARKING"
                                          ) {
                                            setSelectedState("SPARKING");
                                          } else {
                                            setSelectedState(targetAnimKey);
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                                >
                                  <Edit className="w-3 h-3" /> Editar
                                </button>

                                <button
                                  onClick={() => {
                                    if (activeManagerClass === "AURA") {
                                      const keyManager =
                                        AuraConfigKeyManager.getInstance();
                                      const newKey = keyManager.generateKey();
                                      const newName = `${item.name || "Aura"} (Cópia)`;

                                      const clonedFull = {
                                        ...JSON.parse(JSON.stringify(item)),
                                        name: newName,
                                        id: newKey,
                                      };

                                      keyManager.registerAura(
                                        newKey,
                                        item.baseAuraId || "AURA_001",
                                        newName,
                                        clonedFull,
                                      );
                                      setLocalAuraDatabase((prev) => ({
                                        ...prev,
                                        [newKey]: clonedFull,
                                      }));
                                    } else if (activeManagerClass === "BEAM") {
                                      const keyManager =
                                        BeamConfigKeyManager.getInstance();
                                      const baseId =
                                        (item as any).baseBeamId || "BEAM";
                                      const newKey =
                                        keyManager.generateKey(baseId);
                                      const newName = `${item.name || "Beam"} (Cópia)`;

                                      const clonedFull = {
                                        ...JSON.parse(JSON.stringify(item)),
                                        name: newName,
                                        id: newKey,
                                        configKey: newKey,
                                      };

                                      keyManager.registerBeam(
                                        newKey,
                                        baseId,
                                        newName,
                                        clonedFull,
                                      );
                                      setLocalBeamDatabase((prev) => ({
                                        ...prev,
                                        [newKey]: clonedFull,
                                      }));
                                    } else {
                                      const keyManager =
                                        ProjectileConfigKeyManager.getInstance();
                                      let baseId = "PROJETIL_1";
                                      let baseName = "Projétil";

                                      if (activeManagerClass === "FECHO") {
                                        baseId = "fechosenergia_1";
                                        baseName = "Fecho de Energia";
                                      } else if (
                                        activeManagerClass === "GENKIDAMA"
                                      ) {
                                        baseId = "GENKIDAMA_1";
                                        baseName = "Genkidama";
                                      }

                                      const customBaseId =
                                        (item as any).baseProjectileId ||
                                        baseId;
                                      const newKey = keyManager.generateKey(
                                        customBaseId,
                                        baseName,
                                      );
                                      const newName = `${item.name || baseName} (Cópia)`;

                                      const clonedFull = {
                                        ...JSON.parse(JSON.stringify(item)),
                                        name: newName,
                                        id: newKey,
                                        configKey: newKey,
                                      };

                                      keyManager.registerProjectile(
                                        newKey,
                                        customBaseId,
                                        newName,
                                        clonedFull,
                                      );
                                      setLocalProjectileDatabase((prev) => ({
                                        ...prev,
                                        [newKey]: clonedFull,
                                      }));
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-slate-300 font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Duplicar
                                </button>

                                <button
                                  onClick={() => {
                                    if (hasLinks) {
                                      alert(
                                        `Não é possível excluir esta configuração. Ela está vinculada a ${usages.length} animações para evitar erros.`,
                                      );
                                      return;
                                    }
                                    if (activeManagerClass === "AURA") {
                                      if (
                                        confirm(
                                          `Tem certeza de que deseja excluir a aura '${item.name || key}'?`,
                                        )
                                      ) {
                                        const keyManager =
                                          AuraConfigKeyManager.getInstance();
                                        keyManager.deleteAura(key);
                                        setLocalAuraDatabase((prev) => {
                                          const next = { ...prev };
                                          delete next[key];
                                          return next;
                                        });
                                        if (selectedAuraKey === key) {
                                          setSelectedAuraKey("");
                                        }
                                      }
                                      return;
                                    }
                                    if (activeManagerClass === "BEAM") {
                                      if (BEAM_DATABASE[key]) {
                                        alert(
                                          "Não é possível excluir beams originais do banco de dados básico.",
                                        );
                                        return;
                                      }
                                    } else {
                                      if (PROJECTILE_DATABASE[key]) {
                                        alert(
                                          "Não é possível excluir originais do banco de dados básico.",
                                        );
                                        return;
                                      }
                                    }

                                    if (
                                      confirm(
                                        `Tem certeza de que deseja excluir '${item.name || key}'?`,
                                      )
                                    ) {
                                      deleteKeysFromProject(
                                        [key],
                                        activeManagerClass === "BEAM" ? "BEAM" : activeManagerClass
                                      );
                                    }
                                  }}
                                  disabled={
                                    hasLinks ||
                                    (activeManagerClass === "AURA"
                                      ? false
                                      : activeManagerClass === "BEAM"
                                        ? !!BEAM_DATABASE[key]
                                        : !!PROJECTILE_DATABASE[key])
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 border ${
                                    hasLinks ||
                                    (activeManagerClass === "AURA"
                                      ? false
                                      : activeManagerClass === "BEAM"
                                        ? !!BEAM_DATABASE[key]
                                        : !!PROJECTILE_DATABASE[key])
                                      ? "bg-slate-800/50 text-slate-600 border-white/5 cursor-not-allowed"
                                      : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400"
                                  }`}
                                  title={
                                    hasLinks
                                      ? "Indisponível: Possui conexões ativas"
                                      : "Excluir Chave"
                                  }
                                >
                                  <Trash2 className="w-3 h-3" /> Excluir
                                </button>
                              </div>
                            </div>

                            {/* Detalhes de Links de Uso */}
                            <div className="px-4 py-2 bg-black/25 text-[10px] border-t border-white/5 flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-500">
                                CONEXÕES ATIVAS:
                              </span>
                              {!hasLinks ? (
                                <span className="text-slate-500 font-medium italic">
                                  Nenhuma conexão de personagem ativa. Seguro
                                  para deletar.
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {usages.map((u, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold uppercase hover:bg-indigo-500/20 transition-all cursor-pointer text-[9px]"
                                      onClick={() => {
                                        // Ir para o personagem e animação vinculada
                                        const foundChar = BASE_CHARACTERS.find(
                                          (c) => c.id === u.charId,
                                        );
                                        if (foundChar) {
                                          setSelectedChar(foundChar);
                                          if (
                                            u.animName ===
                                              "Carregamento Padrão" ||
                                            u.animName === "CHARGING"
                                          ) {
                                            setSelectedState("CHARGING");
                                          } else if (
                                            u.animName === "Sparking Padrão" ||
                                            u.animName === "SPARKING"
                                          ) {
                                            setSelectedState("SPARKING");
                                          } else {
                                            setSelectedState(u.animName);
                                          }
                                        }
                                      }}
                                    >
                                      {u.charName} (
                                      {u.animName.replace(/_/g, " ")})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Mostrar Visual Customizer na tab principal do gerenciador se estiver selecionado */}
                            {isSelectedForEdit && (
                              <div className="border-t border-white/5 p-4 bg-black/10">
                                {activeManagerClass === "VFX" && (
                                  <div className="py-2 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedEffectKey(key);
                                        setActiveTab("VFX");
                                      }}
                                      className="text-[10px] text-green-400 font-black uppercase hover:underline"
                                    >
                                      Editar no Manager de VFX ↗
                                    </button>
                                  </div>
                                )}
                                {activeManagerClass === "BEAM" &&
                                  renderVisualCustomizer(key)}
                                {activeManagerClass === "AURA" &&
                                  renderAuraVisualCustomizer(key)}
                                {(activeManagerClass === "PROJECTILE" ||
                                  activeManagerClass === "FECHO" ||
                                  activeManagerClass === "GENKIDAMA") &&
                                  renderProjectileVisualCustomizer(key)}
                              </div>
                            )}
                          </div>
                        );
                      };

                      if (activeManagerClass === "AURA") {
                        return keysList.map(renderKeyCard);
                      }

                      const activeKeys = keysList.filter(isKeyActive);
                      const inactiveKeys = keysList.filter(
                        (k) => !isKeyActive(k),
                      );

                      return (
                        <div className="space-y-6">
                          {/* Chaves Ativas */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1 pb-1.5 border-b border-white/5">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                Chaves Ativas ({activeKeys.length})
                              </span>
                            </div>
                            {activeKeys.length === 0 ? (
                              <p className="text-[10px] text-slate-500 font-medium italic py-3 px-3 bg-black/15 rounded-xl text-center border border-dashed border-white/5">
                                Nenhuma chave ativa nesta categoria.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {activeKeys.map(renderKeyCard)}
                              </div>
                            )}
                          </div>

                          {/* Chaves Inativas */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1 pb-1.5 border-b border-white/5">
                              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                Chaves Inativas ({inactiveKeys.length})
                              </span>
                            </div>

                            {inactiveKeys.length > 0 && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#18181b] p-3 rounded-xl border border-white/5 mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={inactiveKeys.length > 0 && inactiveKeys.every(k => selectedInactiveKeys.includes(k))}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInactiveKeys(prev => {
                                          const next = [...prev];
                                          inactiveKeys.forEach(k => {
                                            if (!next.includes(k)) next.push(k);
                                          });
                                          return next;
                                        });
                                      } else {
                                        setSelectedInactiveKeys(prev => prev.filter(k => !inactiveKeys.includes(k)));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-white/15 bg-black/40 text-orange-500 focus:ring-orange-500/20 focus:ring-offset-0 cursor-pointer"
                                    id="select-all-inactive"
                                  />
                                  <label htmlFor="select-all-inactive" className="text-[10px] font-black uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                                    Selecionar Todas ({selectedInactiveKeys.filter(k => inactiveKeys.includes(k)).length}/{inactiveKeys.length})
                                  </label>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const selectedFromThisCat = selectedInactiveKeys.filter(k => inactiveKeys.includes(k));
                                      if (selectedFromThisCat.length === 0) return;
                                      if (confirm(`Deseja realmente excluir permanentemente as ${selectedFromThisCat.length} chaves inativas selecionadas?`)) {
                                        deleteKeysFromProject(selectedFromThisCat, activeManagerClass === "BEAM" ? "BEAM" : activeManagerClass);
                                      }
                                    }}
                                    disabled={selectedInactiveKeys.filter(k => inactiveKeys.includes(k)).length === 0}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                                  >
                                    <Trash2 className="w-3 h-3" /> Excluir Selecionadas
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja realmente excluir permanentemente TODAS as ${inactiveKeys.length} chaves inativas desta categoria?`)) {
                                        deleteKeysFromProject(inactiveKeys, activeManagerClass === "BEAM" ? "BEAM" : activeManagerClass);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-lg shadow-red-600/10"
                                  >
                                    <X className="w-3 h-3" /> Excluir Todas
                                  </button>
                                </div>
                              </div>
                            )}

                            {inactiveKeys.length === 0 ? (
                              <p className="text-[10px] text-slate-500 font-medium italic py-3 px-3 bg-black/15 rounded-xl text-center border border-dashed border-white/5">
                                Nenhuma chave inativa / pendente nesta
                                categoria.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {inactiveKeys.map(renderKeyCard)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === "GROUPINGS" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-emerald-500" />
                      Grupo de Sequências
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-black">
                      Ativo
                    </span>
                  </h3>

                  {/* Create New Group Card */}
                  <div className="space-y-2 p-3 bg-black/40 rounded-xl border border-white/5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Criar Novo Grupo de Ação
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Ex: Ultimate_3 ou Dash_Meio"
                        className="flex-1 bg-black/30 border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const name = newGroupName.trim();
                          if (!name) return;

                          const cleanName =
                            name.charAt(0).toUpperCase() + name.slice(1);
                          if (animationGroups[cleanName]) {
                            alert("Esse grupo já existe!");
                            return;
                          }

                          setAnimationGroups((prev) => {
                            const next = { ...prev, [cleanName]: [] };
                            if (selectedChar.spriteConfig) {
                              selectedChar.spriteConfig.animationSequences =
                                next;
                            }
                            return next;
                          });
                          setSelectedGroupKey(cleanName);
                          setNewGroupName("");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-750 px-3 py-1.5 rounded-lg text-xs font-black uppercase text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Novo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main List of Groups */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                    Selecionar Sequência / Ação (
                    {Object.keys(animationGroups).length})
                  </h4>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {Object.keys(animationGroups)
                      .sort()
                      .map((groupKey) => {
                        const list = animationGroups[groupKey] || [];
                        const isSelected = selectedGroupKey === groupKey;
                        const isCurrentlyPlaying = activeSequence === list;

                        return (
                          <div
                            key={groupKey}
                            className={`rounded-xl border transition-all ${
                              isSelected
                                ? "bg-slate-950 border-emerald-500/30 shadow-md shadow-emerald-900/5"
                                : "bg-[#18181b]/60 border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between p-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGroupKey(
                                    isSelected ? "" : groupKey,
                                  );
                                }}
                                className="flex-1 flex items-center gap-2.5 text-left select-none cursor-pointer"
                              >
                                <Folder
                                  className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`}
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase tracking-wide text-slate-200">
                                    {groupKey}
                                  </span>
                                  <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">
                                    {list.length} Animações Sequenciais
                                  </span>
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 select-none">
                                {list.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isCurrentlyPlaying) {
                                        setActiveSequence(null);
                                      } else {
                                        setActiveSequence(list);
                                        setActiveSequenceIndex(0);
                                        setSelectedState(list[0]);
                                        setFrameIndex(0);
                                        setIsPlaying(true);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isCurrentlyPlaying
                                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                    }`}
                                    title={
                                      isCurrentlyPlaying
                                        ? "Parar Reprodução"
                                        : "Reproduzir Mini-Sequência"
                                    }
                                  >
                                    {isCurrentlyPlaying ? (
                                      <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Tem certeza de que deseja excluir o grupo '${groupKey}'? (As animações internas NÃO serão deletadas)`,
                                      )
                                    ) {
                                      setAnimationGroups((prev) => {
                                        const next = { ...prev };
                                        delete next[groupKey];
                                        if (selectedChar.spriteConfig) {
                                          selectedChar.spriteConfig.animationSequences =
                                            next;
                                        }
                                        return next;
                                      });
                                      if (selectedGroupKey === groupKey) {
                                        setSelectedGroupKey("");
                                      }
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                                  title="Excluir Grupo de Sequência"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isSelected && list.length > 0 && (
                              <div className="px-3 pb-3 border-t border-white/5 pt-2 bg-black/20 text-[10px] space-y-1">
                                <span className="font-extrabold text-slate-500 tracking-wider uppercase block">
                                  ORDEM DA SEQUÊNCIA:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {list.map((it, idx) => (
                                    <span
                                      key={it}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]"
                                    >
                                      {idx + 1}. {it}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selectedGroupKey && animationGroups[selectedGroupKey] && (
                  <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Folder className="w-4 h-4 text-emerald-500 animate-pulse" />{" "}
                        Detalhes: {selectedGroupKey}
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSequenceLooping}
                            onChange={(e) =>
                              setIsSequenceLooping(e.target.checked)
                            }
                            className="rounded border-white/10 bg-black/30 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                          />
                          Loop Seq.
                        </label>
                      </div>
                    </div>

                    {activeSequence === animationGroups[selectedGroupKey] && (
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between text-[11px]">
                        <span className="text-orange-400 font-bold uppercase flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-orange-500 animate-bounce" />
                          Reproduzindo: {activeSequence[activeSequenceIndex]}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-black">
                          {activeSequenceIndex + 1} / {activeSequence.length}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        Vincular Animação Existente ao Grupo
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAddAnimationToGroup(selectedGroupKey, val);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-black/30 border-white/10 hover:border-white/15 transition-colors rounded-lg px-2 py-1.5 border text-xs text-slate-400 font-bold focus:outline-none"
                      >
                        <option value="">
                          -- Escolher Animação para Agrupar --
                        </option>
                        {Object.keys(
                          selectedChar.spriteConfig?.animations || {},
                        )
                          .filter(
                            (k) =>
                              !(
                                animationGroups[selectedGroupKey] || []
                              ).includes(k),
                          )
                          .sort()
                          .map((animKey) => (
                            <option key={animKey} value={animKey}>
                              {animKey}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Animações Internas Ordenadas
                        </label>
                        <button
                          onClick={() =>
                            handleCreateAnimationInGroup(selectedGroupKey)
                          }
                          className="text-[10px] bg-emerald-600/10 hover:bg-emerald-600/25 text-emerald-400 font-black px-2.5 py-1 rounded border border-emerald-500/20 tracking-wider uppercase transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Criar e Agrupar
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {animationGroups[selectedGroupKey].length === 0 ? (
                          <div className="text-center py-4 text-xs font-medium text-slate-500 italic bg-black/10 rounded-xl border border-dashed border-white/5">
                            Nenhuma animação vinculada a esta sequência de ação.
                          </div>
                        ) : (
                          animationGroups[selectedGroupKey].map(
                            (animKey, idx) => {
                              const isCurrentPreview =
                                selectedState === animKey;

                              return (
                                <div
                                  key={animKey}
                                  className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                                    isCurrentPreview
                                      ? "bg-slate-800 border-emerald-500/30 text-white"
                                      : "bg-black/20 border-white/5 hover:border-white/10 text-slate-300"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedState(animKey);
                                      setFrameIndex(0);
                                    }}
                                    className="flex-1 flex items-center gap-2 text-left text-xs font-bold cursor-pointer"
                                  >
                                    <span className="font-mono text-[9px] text-slate-500 font-black shrink-0 w-4">
                                      {(idx + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span className="truncate hover:text-emerald-400 transition-colors uppercase tracking-wide">
                                      {animKey}
                                    </span>
                                  </button>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const renameVal = prompt(
                                          `Qual o novo nome da animação?`,
                                          animKey,
                                        );
                                        if (renameVal) {
                                          handleRenameAnimation(
                                            animKey,
                                            renameVal,
                                          );
                                        }
                                      }}
                                      className="p-1 rounded bg-slate-850 hover:bg-slate-700 hover:text-white text-slate-400 transition-colors cursor-pointer"
                                      title="Renomear Animação"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (idx === 0) return;
                                        const nextList = [
                                          ...animationGroups[selectedGroupKey],
                                        ];
                                        const temp = nextList[idx - 1];
                                        nextList[idx - 1] = nextList[idx];
                                        nextList[idx] = temp;

                                        setAnimationGroups((prev) => {
                                          const next = {
                                            ...prev,
                                            [selectedGroupKey]: nextList,
                                          };
                                          if (selectedChar.spriteConfig) {
                                            selectedChar.spriteConfig.animationSequences =
                                              next;
                                          }
                                          return next;
                                        });
                                      }}
                                      disabled={idx === 0}
                                      className={`p-1 rounded transition-colors ${
                                        idx === 0
                                          ? "text-slate-700 cursor-not-allowed"
                                          : "bg-slate-850 hover:bg-slate-700 hover:text-white text-slate-400 cursor-pointer"
                                      }`}
                                      title="Mover para Cima de Ordem"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          idx ===
                                          animationGroups[selectedGroupKey]
                                            .length -
                                            1
                                        )
                                          return;
                                        const nextList = [
                                          ...animationGroups[selectedGroupKey],
                                        ];
                                        const temp = nextList[idx + 1];
                                        nextList[idx + 1] = nextList[idx];
                                        nextList[idx] = temp;

                                        setAnimationGroups((prev) => {
                                          const next = {
                                            ...prev,
                                            [selectedGroupKey]: nextList,
                                          };
                                          if (selectedChar.spriteConfig) {
                                            selectedChar.spriteConfig.animationSequences =
                                              next;
                                          }
                                          return next;
                                        });
                                      }}
                                      disabled={
                                        idx ===
                                        animationGroups[selectedGroupKey]
                                          .length -
                                          1
                                      }
                                      className={`p-1 rounded transition-colors ${
                                        idx ===
                                        animationGroups[selectedGroupKey]
                                          .length -
                                          1
                                          ? "text-slate-700 cursor-not-allowed"
                                          : "bg-slate-850 hover:bg-slate-700 hover:text-white text-slate-400 cursor-pointer"
                                      }`}
                                      title="Mover para Baixo de Ordem"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Tem certeza de que deseja remover a animação '${animKey}' da sequência '${selectedGroupKey}'?`,
                                          )
                                        ) {
                                          setAnimationGroups((prev) => {
                                            const next = { ...prev };
                                            next[selectedGroupKey] = next[
                                              selectedGroupKey
                                            ].filter((k) => k !== animKey);
                                            if (selectedChar.spriteConfig) {
                                              selectedChar.spriteConfig.animationSequences =
                                                next;
                                            }
                                            return next;
                                          });
                                        }
                                      }}
                                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                      title="Desvincular do Grupo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            },
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "AURAS" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-amber-500/20">
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-white/5">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />{" "}
                    Editor de Aura Premium
                  </h3>
                  <p className="text-slate-400 text-xs text-justify">
                    Edite e personalize as especificações visuais das auras
                    padrão (AURA_001 a AURA_015) do jogo. Ajuste cores,
                    saturação, rotação de matiz (estilo beans), brilhos extras
                    e opacidades em tempo real.
                  </p>

                  {/* Selection List */}
                  {(() => {
                    const auras = Object.keys(DEFAULT_AURAS);
                    if (auras.length === 0) {
                      return (
                        <div className="text-center py-6 text-xs text-slate-500 italic bg-black/20 rounded-xl border border-dashed border-white/5">
                          Nenhuma aura padrão configurada no banco de dados.
                        </div>
                      );
                    }

                    const isChave =
                      selectedAuraKey && selectedAuraKey.startsWith("CHAVE_");
                    const currentAura = localAuraDatabase[selectedAuraKey];

                    return (
                      <div className="space-y-4 font-black">
                        {isChave ? (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse-subtle">
                            <div>
                              <div className="text-[10px] uppercase font-black tracking-widest text-amber-500">
                                Editando Aura Ativa / Chave
                              </div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">
                                ✨ {selectedAuraKey}
                              </h4>
                              {currentAura?.ownerCharacterName && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Vinculada ao personagem{" "}
                                  <span className="text-amber-400 font-black">
                                    {currentAura.ownerCharacterName}
                                  </span>{" "}
                                  na animação{" "}
                                  <span className="text-amber-400 font-black">
                                    {currentAura.ownerAnimationKey?.replace(
                                      /_/g,
                                      " ",
                                    )}
                                  </span>
                                  .
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const baseAura =
                                  currentAura?.baseAuraId || "AURA_001";
                                setSelectedAuraKey(baseAura);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-wider transition-colors shrink-0"
                            >
                              ↩ Voltar para Auras Padrão
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Selecione a Aura Padrão para Exemplificar/Editar
                            </label>
                            <select
                              value={selectedAuraKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) setSelectedAuraKey(val);
                              }}
                              className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-amber-500 text-amber-400"
                            >
                              <option value="">
                                -- Escolher uma Configuração --
                              </option>
                              {auras.map((key) => {
                                return (
                                  <option key={key} value={key}>
                                    ⚙️ {key}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        {currentAura && (
                          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5 mt-2">
                            {/* General Aura Setup (Only for Custom keys / CHAVE_) */}
                            {selectedAuraKey.startsWith("CHAVE_") && (
                              <>
                                <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-between pb-1.5 border-b border-white/5">
                                  <span>Identificadores & Escopo</span>
                                  {selectedAuraKey.startsWith("CHAVE_") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Excluir permanentemente a aura '${selectedAuraKey}'?`,
                                          )
                                        ) {
                                          const keyManager =
                                            AuraConfigKeyManager.getInstance();
                                          keyManager.deleteAura(
                                            selectedAuraKey,
                                          );
                                          const all = keyManager.getAllAuras();
                                          setLocalAuraDatabase(all);
                                          const keys = Object.keys(all);
                                          setSelectedAuraKey(keys[0] || "");
                                        }
                                      }}
                                      className="text-[9px] bg-red-650 hover:bg-red-500 px-2.5 py-1 text-white border border-red-500/20 rounded font-black uppercase transition-all shrink-0 cursor-pointer"
                                    >
                                      Excluir Registro
                                    </button>
                                  )}
                                </h4>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* Name */}


                                  {/* Target Character */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                      ID Personagem
                                    </label>
                                    <select
                                      value={currentAura.ownerCharacterId || ""}
                                      onChange={(e) =>
                                        handleAuraStyleChange(
                                          selectedAuraKey,
                                          "ownerCharacterId",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-black/30 border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                                    >
                                      <option value="">
                                        Qualquer Um (Livre)
                                      </option>
                                      {BASE_CHARACTERS.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Animation State Trigger */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                      Trigger Animação
                                    </label>
                                    <select
                                      value={
                                        currentAura.ownerAnimationKey || ""
                                      }
                                      onChange={(e) =>
                                        handleAuraStyleChange(
                                          selectedAuraKey,
                                          "ownerAnimationKey",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-black/30 border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                                    >
                                      <option value="">
                                        Qualquer Animação
                                      </option>
                                      {(() => {
                                        const allStates =
                                          Object.values(PlayerState);
                                        const standardList = [
                                          "CHARGING",
                                          "CHARGE_START",
                                          "CHARGE_END",
                                          "ULTIMATE",
                                          "SPARKING",
                                        ];
                                        allStates.forEach((s) => {
                                          if (!standardList.includes(s))
                                            standardList.push(s);
                                        });
                                        if (
                                          selectedChar?.spriteConfig?.animations
                                        ) {
                                          Object.keys(
                                            selectedChar.spriteConfig
                                              .animations,
                                          ).forEach((a) => {
                                            if (!standardList.includes(a))
                                              standardList.push(a);
                                          });
                                        }
                                        return standardList.map((st) => (
                                          <option key={st} value={st}>
                                            {st}
                                          </option>
                                        ));
                                      })()}
                                    </select>
                                  </div>

                                  {/* Default checkmarks */}
                                  <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                    <label className="flex items-center gap-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide select-none cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={
                                          currentAura.isDefaultCharging || false
                                        }
                                        onChange={(e) =>
                                          handleAuraStyleChange(
                                            selectedAuraKey,
                                            "isDefaultCharging",
                                            e.target.checked,
                                          )
                                        }
                                        className="rounded border-white/10 bg-black/30 text-amber-500 focus:ring-0"
                                      />
                                      Aura de Ki Principal
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[9px] text-slate-400 font-extrabold uppercase tracking-wide select-none cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={
                                          currentAura.isDefaultSparking || false
                                        }
                                        onChange={(e) =>
                                          handleAuraStyleChange(
                                            selectedAuraKey,
                                            "isDefaultSparking",
                                            e.target.checked,
                                          )
                                        }
                                        className="rounded border-white/10 bg-black/30 text-orange-500 focus:ring-0"
                                      />
                                      Aura de Sparking Principal
                                    </label>
                                  </div>
                                </div>

                                {/* Base animation source */}
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-black">
                                    Animação Original (GIF Base)
                                  </label>
                                  <select
                                    value={currentAura.baseAuraId || "AURA_001"}
                                    onChange={(e) =>
                                      handleAuraStyleChange(
                                        selectedAuraKey,
                                        "baseAuraId",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-black/30 border-white/10 hover:border-white/15 transition-colors rounded-lg px-2.5 py-1.5 border text-xs text-amber-400 font-black focus:outline-none"
                                  >
                                    {Object.keys(DEFAULT_AURAS).map((key) => (
                                      <option key={key} value={key}>
                                        GIF: {key.replace(/_/g, " ")}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}

                            {/* COLORS & MATRICES */}
                            <div className="space-y-4 pt-3 border-t border-white/5">
                              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5 font-black">
                                  <Palette className="w-4 h-4 text-orange-400" />{" "}
                                  Cores & Matriz (Estilo beans)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleResetAuraColors(selectedAuraKey)
                                  }
                                  className="flex items-center gap-1 px-2 py-0.5 text-[9px] bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/35 border border-red-500/30 text-red-300 rounded transition-all font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" /> Resetar
                                </button>
                              </div>

                              {/* Base Tint Color */}
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">
                                  Filtro de Spray / Tintura de Cor
                                </label>
                                <div className="flex items-center gap-3 bg-black/25 p-2 rounded-lg border border-white/5">
                                  <input
                                    type="color"
                                    value={currentAura.color || "#ffffff"}
                                    onChange={(e) =>
                                      handleAuraStyleChange(
                                        selectedAuraKey,
                                        "color",
                                        e.target.value,
                                      )
                                    }
                                    className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                                  />
                                  <div className="space-y-0.5 font-bold">
                                    <span className="text-xs font-mono font-bold text-slate-300 uppercase block select-all">
                                      {currentAura.color || "#ffffff"}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">
                                      Preencha ou selecione para tingir a aura
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Hue Rotate Slider */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Matriz / Rotação Hue (beans HUE)</span>
                                  <span className="text-amber-400">
                                    {currentAura.auraHueRotate !== undefined
                                      ? currentAura.auraHueRotate
                                      : 0}
                                    °
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0}
                                  max={360}
                                  step={1}
                                  value={
                                    currentAura.auraHueRotate !== undefined
                                      ? currentAura.auraHueRotate
                                      : 0
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraHueRotate",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Saturação Slider */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>
                                    Saturação de Cor (Color Intensity)
                                  </span>
                                  <span className="text-amber-400">
                                    {currentAura.auraSaturate !== undefined
                                      ? currentAura.auraSaturate
                                      : 1.0}
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0}
                                  max={4}
                                  step={0.05}
                                  value={
                                    currentAura.auraSaturate !== undefined
                                      ? currentAura.auraSaturate
                                      : 1
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraSaturate",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Contrast Slider */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider font-black">
                                  <span>Contraste</span>
                                  <span className="text-amber-400">
                                    {currentAura.auraContrast !== undefined
                                      ? currentAura.auraContrast
                                      : 1.0}
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0.1}
                                  max={3}
                                  step={0.05}
                                  value={
                                    currentAura.auraContrast !== undefined
                                      ? currentAura.auraContrast
                                      : 1
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraContrast",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Brightness Slider */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Brilho</span>
                                  <span className="text-amber-400">
                                    {currentAura.auraBrightness !== undefined
                                      ? currentAura.auraBrightness
                                      : 1.0}
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0.2}
                                  max={3}
                                  step={0.05}
                                  value={
                                    currentAura.auraBrightness !== undefined
                                      ? currentAura.auraBrightness
                                      : 1
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraBrightness",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Opacidade Slider */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Transparência / Opacidade</span>
                                  <span className="text-amber-400">
                                    {Math.round(
                                      (currentAura.auraOpacity !== undefined
                                        ? currentAura.auraOpacity
                                        : 0.85) * 100,
                                    )}
                                    %
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={
                                    currentAura.auraOpacity !== undefined
                                      ? currentAura.auraOpacity
                                      : 0.85
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraOpacity",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Posicionamento - Offset X */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Posição Horizontal (Offset X)</span>
                                  <span className="text-amber-400">
                                    {currentAura.auraOffsetX !== undefined
                                      ? currentAura.auraOffsetX
                                      : 0}{" "}
                                    px
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={-150}
                                  max={150}
                                  step={1}
                                  value={
                                    currentAura.auraOffsetX !== undefined
                                      ? currentAura.auraOffsetX
                                      : 0
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraOffsetX",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Posicionamento - Offset Y */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Posição Vertical (Offset Y)</span>
                                  <span className="text-amber-400">
                                    {currentAura.auraOffsetY !== undefined
                                      ? currentAura.auraOffsetY
                                      : 0}{" "}
                                    px
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={-150}
                                  max={150}
                                  step={1}
                                  value={
                                    currentAura.auraOffsetY !== undefined
                                      ? currentAura.auraOffsetY
                                      : 0
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraOffsetY",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Escala Horizontal (Scale X) */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Escala Horizontal (Largura)</span>
                                  <span className="text-amber-400">
                                    {(currentAura.auraScaleX !== undefined
                                      ? currentAura.auraScaleX
                                      : 1.0
                                    ).toFixed(2)}
                                    x
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0.1}
                                  max={3.5}
                                  step={0.05}
                                  value={
                                    currentAura.auraScaleX !== undefined
                                      ? currentAura.auraScaleX
                                      : 1.0
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraScaleX",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>

                              {/* Escala Vertical (Scale Y) */}
                              <div className="space-y-1 font-black">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  <span>Escala Vertical (Altura)</span>
                                  <span className="text-amber-400">
                                    {(currentAura.auraScaleY !== undefined
                                      ? currentAura.auraScaleY
                                      : 1.0
                                    ).toFixed(2)}
                                    x
                                  </span>
                                </div>
                                <SliderWithControls
                                  min={0.1}
                                  max={3.5}
                                  step={0.05}
                                  value={
                                    currentAura.auraScaleY !== undefined
                                      ? currentAura.auraScaleY
                                      : 1.0
                                  }
                                  onChange={(val) =>
                                    handleAuraStyleChange(
                                      selectedAuraKey,
                                      "auraScaleY",
                                      val,
                                    )
                                  }
                                  accentColor="amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
            {activeTab === "VFX" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-green-500/20">
                  <h3 className="text-sm font-black text-green-400 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-white/5">
                    <Zap className="w-5 h-5 text-green-500" />{" "}
                    Editor de Efeitos VFX
                  </h3>
                  <p className="text-slate-400 text-xs text-justify">
                    Personalize os efeitos visuais (poeira, impacto, chao) do jogo.
                    Ajuste cores, filtros, escala e posição dos efeitos.
                  </p>

                  {/* Selection List */}
                  {(() => {
                    const standardEffects = Object.keys(DEFAULT_EFFECTS);
                    const customKeys = Object.keys(localEffectDatabase).filter(k => !standardEffects.includes(k));
                    const isCustom = selectedEffectKey && !standardEffects.includes(selectedEffectKey);
                    const currentEffect = localEffectDatabase[selectedEffectKey];

                    return (
                      <div className="space-y-4 font-black">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Selecione o Efeito para Editar</span>
                            {isCustom && <span className="text-green-500 animate-pulse">Editando Chave Customizada</span>}
                          </label>
                          <select
                            value={selectedEffectKey}
                            onChange={(e) => setSelectedEffectKey(e.target.value)}
                            className="w-full bg-black/30 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-green-500 text-green-400"
                          >
                            <option value="">-- Escolher uma Configuração --</option>
                            
                            {customKeys.length > 0 && (
                              <optgroup label="✨ CHAVES / VFX CUSTOMIZADOS" className="bg-[#18181b] text-green-400">
                                {customKeys.map((key) => (
                                  <option key={key} value={key}>🔑 {key}</option>
                                ))}
                              </optgroup>
                            )}

                            <optgroup label="⚙️ EFEITOS PADRÃO" className="bg-[#18181b] text-slate-400">
                              {standardEffects.map((key) => (
                                <option key={key} value={key}>🔘 {key}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Criar Nova Chave Customizada de Efeito VFX */}
                        <div className="space-y-2 bg-black/10 p-2.5 rounded-xl border border-white/5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                            Criar Nova Chave Customizada
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="NOME_DA_CHAVE"
                              id="new_vfx_custom_key_input"
                              className="flex-1 bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-green-500 text-white placeholder-slate-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const inputEl = document.getElementById("new_vfx_custom_key_input") as HTMLInputElement;
                                let key = inputEl?.value?.trim().toUpperCase();
                                if (!key) {
                                  alert("Insira um nome válido para a nova chave!");
                                  return;
                                }
                                if (!key.startsWith("VFX_") && !key.startsWith("CHAVE_") && !key.startsWith("EFFECT_")) {
                                  key = "VFX_" + key;
                                }
                                
                                const keyManager = EffectConfigKeyManager.getInstance();
                                const newEffect = keyManager.registerEffect(
                                  key,
                                  "EFFECT_POEIRA_01",
                                  key,
                                  {
                                    color: "#ffffff",
                                    effectHueRotate: 0,
                                    effectSaturate: 1.0,
                                    effectBrightness: 1.0,
                                    effectContrast: 1.0,
                                    effectOpacity: 1,
                                    effectOffsetX: 0,
                                    effectOffsetY: 0,
                                    effectScaleX: 1.0,
                                    effectScaleY: 1.0,
                                    effectRotation: 0
                                  }
                                );
                                
                                setLocalEffectDatabase(prev => ({
                                  ...prev,
                                  [key]: newEffect
                                }));
                                setSelectedEffectKey(key);
                                if (inputEl) inputEl.value = "";
                              }}
                              className="px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-black font-black text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                            >
                              Criar
                            </button>
                          </div>
                        </div>

                        {isCustom && currentEffect && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] uppercase font-black tracking-widest text-green-500">
                                Info da Chave Selecionada
                              </div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider mt-0.5">
                                ✨ {selectedEffectKey}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const baseEffect = currentEffect?.baseEffectId || "EFFECT_POEIRA_01";
                                setSelectedEffectKey(baseEffect);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-wider transition-colors shrink-0"
                            >
                              ↩ Voltar para Padrões
                            </button>
                          </div>
                        )}

                        {currentEffect && (
                          <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5 mt-2">

                            {/* Base Effect Selection for Custom Keys */}
                            {isCustom && (
                              <div className="space-y-1.5 pb-3 border-b border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                                  Animação / Sprite Base do Efeito
                                </label>
                                <select
                                  value={currentEffect.baseEffectId || "EFFECT_POEIRA_01"}
                                  onChange={(e) => handleEffectStyleChange(selectedEffectKey, "baseEffectId", e.target.value)}
                                  className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-xs uppercase tracking-wider font-black focus:outline-none focus:border-green-500 text-green-400"
                                >
                                  {Object.keys(DEFAULT_EFFECTS).map((key) => (
                                    <option key={key} value={key} className="bg-[#18181b] text-white">
                                      {key}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Base Color & Filters */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-black tracking-widest text-green-400 flex items-center gap-1.5 font-black">
                                  <Palette className="w-4 h-4" /> Cores & Filtros (Estilo beans)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetEffectColors(selectedEffectKey)}
                                  className="px-2 py-0.5 text-[9px] bg-red-500/10 border border-red-500/30 text-red-300 rounded hover:bg-red-500/20 font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Resetar
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">Cor base / Tintura</label>
                                  <input
                                    type="color"
                                    value={currentEffect.color || "#ffffff"}
                                    onChange={(e) => handleEffectStyleChange(selectedEffectKey, "color", e.target.value)}
                                    className="w-full h-8 rounded bg-transparent border-0 cursor-pointer"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">Opacidade</label>
                                  <SliderWithControls
                                    min={0} max={1} step={0.05}
                                    value={currentEffect.effectOpacity ?? 1}
                                    onChange={(val) => handleEffectStyleChange(selectedEffectKey, "effectOpacity", val)}
                                    accentColor="green-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">Saturação</label>
                                  <SliderWithControls
                                    min={0} max={4} step={0.1}
                                    value={currentEffect.effectSaturate ?? 1}
                                    onChange={(val) => handleEffectStyleChange(selectedEffectKey, "effectSaturate", val)}
                                    accentColor="green-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-black">Brilho</label>
                                  <SliderWithControls
                                    min={0} max={3} step={0.1}
                                    value={currentEffect.effectBrightness ?? 1}
                                    onChange={(val) => handleEffectStyleChange(selectedEffectKey, "effectBrightness", val)}
                                    accentColor="green-500"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 font-black">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Hue Rotate</label>
                                  <SliderWithControls
                                    min={0} max={360} step={1}
                                    value={currentEffect.effectHueRotate ?? 0}
                                    onChange={(val) => handleEffectStyleChange(selectedEffectKey, "effectHueRotate", val)}
                                    accentColor="green-500"
                                  />
                                </div>
                                <div className="space-y-1 font-black">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Contraste</label>
                                  <SliderWithControls
                                    min={0.1} max={3} step={0.05}
                                    value={currentEffect.effectContrast ?? 1}
                                    onChange={(val) => handleEffectStyleChange(selectedEffectKey, "effectContrast", val)}
                                    accentColor="green-500"
                                  />
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
            {activeTab === "COLLISION" && config && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-orange-500/20">
                  <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5" /> Hitbox Override (Blue)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Width ({config.hitboxWidth ?? "Auto"})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("hitboxWidth", undefined)
                          }
                          className="text-[10px] text-orange-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={10}
                        max={300}
                        step={1}
                        value={config.hitboxWidth || PLAYER_WIDTH}
                        onChange={(val) =>
                          handleConfigChange("hitboxWidth", val)
                        }
                        accentColor="orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Height ({config.hitboxHeight ?? "Auto"})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("hitboxHeight", undefined)
                          }
                          className="text-[10px] text-orange-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={10}
                        max={300}
                        step={1}
                        value={config.hitboxHeight || PLAYER_HEIGHT}
                        onChange={(val) =>
                          handleConfigChange("hitboxHeight", val)
                        }
                        accentColor="orange-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Offset X ({config.hitboxOffsetX ?? 0})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("hitboxOffsetX", undefined)
                          }
                          className="text-[10px] text-orange-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={-450}
                        max={450}
                        step={1}
                        value={config.hitboxOffsetX || 0}
                        onChange={(val) =>
                          handleConfigChange("hitboxOffsetX", val)
                        }
                        accentColor="orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Offset Y ({config.hitboxOffsetY ?? 0})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("hitboxOffsetY", undefined)
                          }
                          className="text-[10px] text-orange-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={-450}
                        max={450}
                        step={1}
                        value={config.hitboxOffsetY || 0}
                        onChange={(val) =>
                          handleConfigChange("hitboxOffsetY", val)
                        }
                        accentColor="orange-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-red-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <Sword className="w-5 h-5" /> Attack Boxes (Red)
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newBoxes = [...(config.attackBoxes || [])];
                          newBoxes.push({
                            width: 90,
                            height: 45,
                            offsetX: 45,
                            offsetY: 30,
                            damageFrames: [],
                          });
                          handleConfigChange("attackBoxes", newBoxes);
                        }}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Add new attack collision"
                      >
                        <Plus className="w-3 h-3" /> ADD
                      </button>
                      <button
                        onClick={() => {
                          const data = JSON.stringify(config.attackBoxes || []);
                          navigator.clipboard.writeText(data);
                          alert("Colisões copiadas!");
                        }}
                        className="px-2 py-1 bg-slate-850 border border-slate-700/50 hover:bg-slate-800 text-slate-300 rounded hover:text-white text-xs font-bold transition-all flex items-center gap-1"
                        title="Copy only attack collisions list"
                      >
                        <Clipboard className="w-3 h-3" /> COPY (Barieras)
                      </button>
                      <button
                        onClick={() => {
                          const fullData = {
                            characterId: selectedChar.id,
                            characterName: selectedChar.name,
                            animationKey: selectedState,
                            config: {
                              hitboxWidth: config.hitboxWidth,
                              hitboxHeight: config.hitboxHeight,
                              hitboxOffsetX: config.hitboxOffsetX,
                              hitboxOffsetY: config.hitboxOffsetY,
                              attackBoxes: config.attackBoxes || [],
                            },
                          };
                          navigator.clipboard.writeText(
                            JSON.stringify(fullData, null, 2),
                          );
                          alert(
                            `Configuração completa de ${selectedChar.name} (${selectedState}) copiada!`,
                          );
                        }}
                        className="px-2 py-1 bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        title="Copy absolute full config (Char + Anim + Hitbox + Attack Boxes)"
                      >
                        <Copy className="w-3 h-3" /> COPIAR COMPLETO
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const data = await navigator.clipboard.readText();
                            const parsed = JSON.parse(data);
                            if (Array.isArray(parsed)) {
                              handleConfigChange("attackBoxes", parsed);
                              alert("Colisões importadas!");
                            } else if (parsed && parsed.config) {
                              // Full configuration format!
                              const updates: Partial<AnimationFrameData> = {};
                              if (parsed.config.hitboxWidth !== undefined)
                                updates.hitboxWidth = parsed.config.hitboxWidth;
                              if (parsed.config.hitboxHeight !== undefined)
                                updates.hitboxHeight =
                                  parsed.config.hitboxHeight;
                              if (parsed.config.hitboxOffsetX !== undefined)
                                updates.hitboxOffsetX =
                                  parsed.config.hitboxOffsetX;
                              if (parsed.config.hitboxOffsetY !== undefined)
                                updates.hitboxOffsetY =
                                  parsed.config.hitboxOffsetY;
                              if (parsed.config.attackBoxes !== undefined)
                                updates.attackBoxes = parsed.config.attackBoxes;

                              handleMultipleConfigChanges(updates);
                              alert(
                                `Configuração completa colada do personagem: ${parsed.characterName || "Desconhecido"} - ${parsed.animationKey || "Animação"}`,
                              );
                            } else if (parsed && typeof parsed === "object") {
                              // Raw flat config fallback
                              const updates: Partial<AnimationFrameData> = {};
                              if (parsed.hitboxWidth !== undefined)
                                updates.hitboxWidth = parsed.hitboxWidth;
                              if (parsed.hitboxHeight !== undefined)
                                updates.hitboxHeight = parsed.hitboxHeight;
                              if (parsed.hitboxOffsetX !== undefined)
                                updates.hitboxOffsetX = parsed.hitboxOffsetX;
                              if (parsed.hitboxOffsetY !== undefined)
                                updates.hitboxOffsetY = parsed.hitboxOffsetY;
                              if (parsed.attackBoxes !== undefined)
                                updates.attackBoxes = parsed.attackBoxes;

                              handleMultipleConfigChanges(updates);
                              alert("Configurações coladas com sucesso!");
                            } else {
                              alert("Dados copiados inválidos.");
                            }
                          } catch (err) {
                            alert("Não foi possível colar do clipboard.");
                          }
                        }}
                        className="px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Paste either attack boxes list or full config"
                      >
                        <ClipboardPaste className="w-3 h-3" /> PASTE
                      </button>
                    </div>
                  </div>

                  {(config.attackBoxes || []).map((box, idx) => (
                    <div
                      key={`attack-box-${idx}`}
                      className="space-y-2 pb-4 mb-4 bg-red-500/5 p-3 rounded-xl border border-red-500/10"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                          Colisão {idx + 1}
                        </label>
                        <button
                          onClick={() => {
                            const newBoxes = [...(config.attackBoxes || [])];
                            newBoxes.splice(idx, 1);
                            handleConfigChange("attackBoxes", newBoxes);
                          }}
                          className="text-red-500 hover:bg-red-500/20 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1 pb-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Frames de Ativação (,)
                        </label>
                        <input
                          type="text"
                          placeholder="ex: 2, 4, 6"
                          value={box.damageFrames?.join(", ") || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9,]/g, "");
                            const newBoxes = [...(config.attackBoxes || [])];
                            if (!val) newBoxes[idx].damageFrames = [];
                            else
                              newBoxes[idx].damageFrames = val
                                .split(",")
                                .map((n) => parseInt(n.trim()))
                                .filter((n) => !isNaN(n));
                            handleConfigChange("attackBoxes", newBoxes);
                          }}
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-[10px] font-mono focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-2 pt-2 border-t border-red-500/10">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Width ({box.width})</span>
                          </label>
                          <SliderWithControls
                            min={10}
                            max={300}
                            step={1}
                            value={box.width}
                            onChange={(val) => {
                              const nb = [...config.attackBoxes!];
                              nb[idx].width = val;
                              handleConfigChange("attackBoxes", nb);
                            }}
                            accentColor="red-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Height ({box.height})</span>
                          </label>
                          <SliderWithControls
                            min={10}
                            max={300}
                            step={1}
                            value={box.height}
                            onChange={(val) => {
                              const nb = [...config.attackBoxes!];
                              nb[idx].height = val;
                              handleConfigChange("attackBoxes", nb);
                            }}
                            accentColor="red-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Offset X ({box.offsetX})</span>
                          </label>
                          <SliderWithControls
                            min={-450}
                            max={450}
                            step={1}
                            value={box.offsetX}
                            onChange={(val) => {
                              const nb = [...config.attackBoxes!];
                              nb[idx].offsetX = val;
                              handleConfigChange("attackBoxes", nb);
                            }}
                            accentColor="red-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Offset Y ({box.offsetY})</span>
                          </label>
                          <SliderWithControls
                            min={-450}
                            max={450}
                            step={1}
                            value={box.offsetY}
                            onChange={(val) => {
                              const nb = [...config.attackBoxes!];
                              nb[idx].offsetY = val;
                              handleConfigChange("attackBoxes", nb);
                            }}
                            accentColor="red-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {!(config.attackBoxes && config.attackBoxes.length > 0) && (
                    <>
                      <div className="space-y-2 pb-4 border-b border-white/5 mb-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Dano / Criação de Colisão (Frames de Ataque)
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("damageFrames", undefined)
                            }
                            className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="ex: 2, 4, 6"
                          value={config.damageFrames?.join(", ") || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9,]/g, "");
                            if (!val)
                              handleConfigChange("damageFrames", undefined);
                            else
                              handleConfigChange(
                                "damageFrames",
                                val
                                  .split(",")
                                  .map((n) => parseInt(n.trim()))
                                  .filter((n) => !isNaN(n)),
                              );
                          }}
                          className="w-full bg-black/40 border-white/5 hover:border-white/10 transition-colors rounded-xl px-3 py-2 border text-[10px] font-mono focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Width ({config.attackBoxWidth ?? "Auto"})
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange("attackBoxWidth", undefined)
                              }
                              className="text-[10px] text-red-500 font-black hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <SliderWithControls
                            min={10}
                            max={300}
                            step={1}
                            value={config.attackBoxWidth || 90}
                            onChange={(val) =>
                              handleConfigChange("attackBoxWidth", val)
                            }
                            accentColor="red-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Height ({config.attackBoxHeight ?? "Auto"})
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange("attackBoxHeight", undefined)
                              }
                              className="text-[10px] text-red-500 font-black hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <SliderWithControls
                            min={10}
                            max={300}
                            step={1}
                            value={config.attackBoxHeight || 45}
                            onChange={(val) =>
                              handleConfigChange("attackBoxHeight", val)
                            }
                            accentColor="red-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Offset X ({config.attackBoxOffsetX ?? "Auto"})
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  "attackBoxOffsetX",
                                  undefined,
                                )
                              }
                              className="text-[10px] text-red-500 font-black hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <SliderWithControls
                            min={-450}
                            max={450}
                            step={1}
                            value={config.attackBoxOffsetX || 0}
                            onChange={(val) =>
                              handleConfigChange("attackBoxOffsetX", val)
                            }
                            accentColor="red-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Offset Y ({config.attackBoxOffsetY ?? "Auto"})
                            </label>
                            <button
                              onClick={() =>
                                handleConfigChange(
                                  "attackBoxOffsetY",
                                  undefined,
                                )
                              }
                              className="text-[10px] text-red-500 font-black hover:underline"
                            >
                              Reset
                            </button>
                          </div>
                          <SliderWithControls
                            min={-450}
                            max={450}
                            step={1}
                            value={config.attackBoxOffsetY || 0}
                            onChange={(val) =>
                              handleConfigChange("attackBoxOffsetY", val)
                            }
                            accentColor="red-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4 bg-[#18181b] p-4 rounded-2xl border border-yellow-500/20">
                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5" /> Projectile Box (Yellow)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Proj Width ({config.projectileWidth ?? "Auto"})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("projectileWidth", undefined)
                          }
                          className="text-[10px] text-yellow-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={1}
                        max={800}
                        step={1}
                        value={config.projectileWidth || 15}
                        onChange={(val) =>
                          handleConfigChange("projectileWidth", val)
                        }
                        accentColor="yellow-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Proj Height ({config.projectileHeight ?? "Auto"})
                        </label>
                        <button
                          onClick={() =>
                            handleConfigChange("projectileHeight", undefined)
                          }
                          className="text-[10px] text-yellow-500 font-black hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                      <SliderWithControls
                        min={1}
                        max={800}
                        step={1}
                        value={config.projectileHeight || 15}
                        onChange={(val) =>
                          handleConfigChange("projectileHeight", val)
                        }
                        accentColor="yellow-500"
                      />
                    </div>
                  </div>
                  {!isBeamOfAnim && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Proj Offset X ({config.projectileOffsetX ?? "Auto"})
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("projectileOffsetX", undefined)
                            }
                            className="text-[10px] text-yellow-500 font-black hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <SliderWithControls
                          min={-450}
                          max={450}
                          step={1}
                          value={config.projectileOffsetX || 0}
                          onChange={(val) =>
                            handleConfigChange("projectileOffsetX", val)
                          }
                          accentColor="yellow-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Proj Offset Y ({config.projectileOffsetY ?? "Auto"})
                          </label>
                          <button
                            onClick={() =>
                              handleConfigChange("projectileOffsetY", undefined)
                            }
                            className="text-[10px] text-yellow-500 font-black hover:underline"
                          >
                            Reset
                          </button>
                        </div>
                        <SliderWithControls
                          min={-450}
                          max={450}
                          step={1}
                          value={config.projectileOffsetY || 0}
                          onChange={(val) =>
                            handleConfigChange("projectileOffsetY", val)
                          }
                          accentColor="yellow-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        {/* Center - Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-black relative flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 flex justify-center items-center">
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                touchAction: "none",
                position: "absolute",
              }}
              className="w-full h-full image-pixelated bg-[#111] touch-none cursor-crosshair !absolute"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>

          {/* Timeline / Playback */}
          <div className="absolute bottom-10 left-10 right-10 flex items-center gap-6 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((prev) => {
                    const totalFrames = config?.frames || 1;
                    return prev <= 0 ? totalFrames - 1 : prev - 1;
                  });
                }}
                className="w-20 h-20 bg-[#18181b] hover:bg-white/5 border border-white/5 rounded-xl flex items-center justify-center transition-all text-white shrink-0"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-24 h-24 bg-orange-600 hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all shadow-lg  shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 fill-current" />
                ) : (
                  <Play className="w-12 h-12 fill-current ml-1" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setFrameIndex((prev) => {
                    const totalFrames = config?.frames || 1;
                    return (prev + 1) % totalFrames;
                  });
                }}
                className="w-20 h-20 bg-[#18181b] hover:bg-white/5 border border-white/5 rounded-xl flex items-center justify-center transition-all text-white shrink-0"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black italic uppercase text-orange-400 tracking-widest">
                  Timeline
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Frame {frameIndex + 1} / {config?.frames || 1}
                </span>
              </div>
              <div className="relative group">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, (config?.frames || 1) - 1)}
                  value={frameIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setFrameIndex(parseInt(e.target.value));
                  }}
                  className="w-full h-8 absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative pointer-events-none group-hover:h-4 transition-all">
                  <motion.div
                    className="h-full bg-orange-500 rounded-r-full"
                    animate={{
                      width: `${((frameIndex + 1) / (config?.frames || 1)) * 100}%`,
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                  />
                </div>
                {/* SFX Marker if any */}
                {config?.sfxName && config.sfxFrame !== undefined && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 bg-yellow-400 rounded-full z-0 opacity-80"
                    style={{
                      left: `${((config.sfxFrame + 1) / (config?.frames || 1)) * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
                {/* Visual marker if attackFrame exists */}
                {config?.attackFrame !== undefined && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-full z-0 opacity-80"
                    style={{
                      left: `${((config.attackFrame + 1) / (config?.frames || 1)) * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info Overlay */}
          <div className="absolute top-10 left-10 space-y-2">
            <div className="bg-black/80 px-4 py-2 border border-white/10 rounded-xl pointer-events-none">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-widest">
                Active File
              </p>
              <p className="text-xl font-mono text-orange-400 truncate max-w-[200px]">
                {config?.imageUrl?.split("/").pop()}
              </p>
            </div>
          </div>

          {/* Animation View Tools */}
          <div className="absolute top-36 left-10 flex flex-col gap-2">
            <button
              onClick={() => setShowOnionSkin((v) => !v)}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${showOnionSkin ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "bg-black/80 backdrop-blur-md text-slate-400 border border-white/10 hover:bg-white/5"}`}
              title="Toggle Onion Skin"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${showGrid ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "bg-black/80 backdrop-blur-md text-slate-400 border border-white/10 hover:bg-white/5"}`}
              title="Toggle Helper Grid"
            >
              <Box className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowHitboxes((v) => !v)}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${showHitboxes ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30" : "bg-black/80 backdrop-blur-md text-slate-400 border border-white/10 hover:bg-white/5"}`}
              title="Toggle Hitboxes"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom UI & Pan Reset */}
          <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-2 rounded-2xl border border-white/10">
              <button
                onClick={() => setZoom((z) => z - 0.25)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-3 py-1 flex items-center justify-center text-xl font-black uppercase text-orange-400 hover:text-white transition-colors"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => z + 0.25)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
              <button
                onClick={() => {
                  handleConfigChange("fullScreen", !config?.fullScreen);
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  config?.fullScreen
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-orange-500/10 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                }`}
                title="Ativar Zoom / Tela Cheia de Batalha (Fullscreen System)"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            {(pan.x !== 0 || pan.y !== 0) && (
              <button
                onClick={() => setPan({ x: 0, y: 0 })}
                className="px-3 py-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 font-black uppercase text-sm hover:bg-orange-600/40"
              >
                Reset Pan
              </button>
            )}
          </div>
        </div>
      </div>

      {copiedData && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111113] border-4 border-orange-500 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl skew-x-[-1deg]">
            <div className="skew-x-[1deg] flex flex-col h-full">
              {/* Header */}
              <div className="bg-[#18181b] border-b-2 border-orange-500/30 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                    <Copy className="w-5 h-5 text-orange-500 animate-pulse" />
                    {copiedData.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Copiado para Área de Transferência. Fallback abaixo caso
                    precise copiar manualmente:
                  </p>
                </div>
                <button
                  onClick={() => setCopiedData(null)}
                  className="w-8 h-8 rounded-lg bg-black/40 hover:bg-neutral-800 hover:text-white flex items-center justify-center border border-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Textarea Area */}
              <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="relative flex-1 bg-black/60 rounded-xl border border-white/5 overflow-hidden">
                  <textarea
                    readOnly
                    value={copiedData.text}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full h-48 sm:h-64 p-4 bg-transparent outline-none focus:outline-none font-mono text-xs text-lime-400 resize-none select-all overflow-y-auto custom-scrollbar"
                  />
                </div>

                {/* Visual Feedback Warning about Iframe Clipboards */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-3 text-xs leading-relaxed text-orange-300">
                  <span className="text-sm">💡</span>
                  <div>
                    <span className="font-bold">Nota de Utilidade</span>: Alguns
                    navegadores bloqueiam escritas automáticas na área de
                    transferência quando o jogo está rodando dentro de um{" "}
                    <span className="underline decoration-orange-500/50">
                      iframe
                    </span>{" "}
                    (como no preview do AI Studio). Se não conseguiu colar após
                    clicar na cópia automática, clique dentro do campo de texto
                    acima (onde o texto ficará selecionado) e use{" "}
                    <kbd className="bg-stone-800 px-1.5 py-0.5 rounded text-white font-mono">
                      Ctrl + C
                    </kbd>{" "}
                    ou{" "}
                    <kbd className="bg-stone-800 px-1.5 py-0.5 rounded text-white font-mono">
                      Cmd + C
                    </kbd>{" "}
                    para copiar 100% dos dados completos!
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-[#18181b] border-t border-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setCopiedData(null)}
                  className="px-5 py-2.5 bg-black/40 border border-white/5 hover:bg-neutral-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all"
                >
                  Fechar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(copiedData.text);
                      alert("Copiado com sucesso!");
                    } catch (e) {
                      alert(
                        "Falha automática! Por favor, selecione e copie o código na caixa acima.",
                      );
                    }
                  }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all shadow-lg shadow-orange-500/20"
                >
                  Copiar Código
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
