import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { TouchInputManager, InputAction } from "../services/TouchInputManager";
import { useSceneManager } from "../contexts/SceneContext";
import {
  Shield,
  Zap,
  Target,
  Activity,
  Maximize2,
  RotateCw,
  Flame,
  Swords,
  Sparkles,
  Repeat,
  Users,
  UserPlus,
  Wind,
  Layers,
  Circle,
  Triangle,
  Square,
  Crosshair,
  Gamepad2,
} from "lucide-react";
import { motion } from "framer-motion";
import { AudioManager } from "../services/AudioManager";
import { HudElement } from "../types";

export const defaultHudElements: HudElement[] = [
  { id: "dpad", x: 0.05, y: 0.5, width: 0.2, height: 0.35, rotation: 0 },
  { id: "kiblast", x: 0.75, y: 0.35, width: 0.08, height: 0.14, rotation: 0 },
  { id: "special", x: 0.8, y: 0.65, width: 0.09, height: 0.16, rotation: 0 },
  { id: "light", x: 0.65, y: 0.75, width: 0.09, height: 0.16, rotation: 0 },
  { id: "medium", x: 0.7, y: 0.55, width: 0.09, height: 0.16, rotation: 0 },
  { id: "heavy", x: 0.85, y: 0.45, width: 0.09, height: 0.16, rotation: 0 },
  { id: "block", x: 0.7, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "charge", x: 0.8, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "ultimate", x: 0.9, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "tag", x: 0.5, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "assist1", x: 0.05, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "assist2", x: 0.15, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "vanish", x: 0.4, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "transform", x: 0.3, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "dash", x: 0.6, y: 0.1, width: 0.06, height: 0.1, rotation: 0 },
  { id: "dragonRush", x: 0.85, y: 0.8, width: 0.08, height: 0.14, rotation: 0 },
];

export const compactHudElements: HudElement[] = [
  // Super accessible D-pad on the left
  { id: "dpad", x: 0.02, y: 0.45, width: 0.32, height: 0.50, rotation: 0 },
  
  // Right thumb action cluster (Arc/circular layout)
  { id: "light", x: 0.65, y: 0.72, width: 0.12, height: 0.20, rotation: 0 },
  { id: "medium", x: 0.72, y: 0.50, width: 0.12, height: 0.20, rotation: 0 },
  { id: "heavy", x: 0.86, y: 0.45, width: 0.12, height: 0.20, rotation: 0 },
  { id: "special", x: 0.86, y: 0.72, width: 0.12, height: 0.20, rotation: 0 },
  { id: "kiblast", x: 0.75, y: 0.62, width: 0.10, height: 0.16, rotation: 0 }, // Center of the arc
  
  // Auxiliary combat (easy reach)
  { id: "dragonRush", x: 0.86, y: 0.25, width: 0.09, height: 0.15, rotation: 0 },
  { id: "vanish", x: 0.72, y: 0.30, width: 0.09, height: 0.15, rotation: 0 },
  
  // Resource/Mobility (Top right corner-ish)
  { id: "block", x: 0.65, y: 0.10, width: 0.08, height: 0.14, rotation: 0 },
  { id: "charge", x: 0.75, y: 0.10, width: 0.08, height: 0.14, rotation: 0 },
  { id: "ultimate", x: 0.85, y: 0.10, width: 0.08, height: 0.14, rotation: 0 },
  { id: "dash", x: 0.55, y: 0.10, width: 0.08, height: 0.14, rotation: 0 },
  
  // Utility and Team (Top left / Center)
  { id: "transform", x: 0.40, y: 0.10, width: 0.07, height: 0.12, rotation: 0 },
  { id: "tag", x: 0.50, y: 0.10, width: 0.07, height: 0.12, rotation: 0 },
  { id: "assist1", x: 0.05, y: 0.15, width: 0.08, height: 0.14, rotation: 0 },
  { id: "assist2", x: 0.15, y: 0.15, width: 0.08, height: 0.14, rotation: 0 },
];

export const getSavedHudElements = (): HudElement[] => {
  try {
    const saved = localStorage.getItem("hud_layout_v2");
    if (saved) {
      const parsedArray = JSON.parse(saved) as HudElement[];
      const parsed = [];
      const ids = new Set();
      for (const item of parsedArray) {
        if (item.id && !ids.has(item.id)) {
          ids.add(item.id);
          parsed.push(item);
        }
      }

      // Ensure new buttons like vanish exist
      if (!parsed.find((e) => e.id === "vanish")) {
        const defaultVanish = defaultHudElements.find((e) => e.id === "vanish");
        if (defaultVanish) parsed.push(defaultVanish);
      }
      if (!parsed.find((e) => e.id === "transform")) {
        const defaultTransform = defaultHudElements.find(
          (e) => e.id === "transform",
        );
        if (defaultTransform) parsed.push(defaultTransform);
      }
      if (!parsed.find((e) => e.id === "dragonRush")) {
        const defaultDr = defaultHudElements.find((e) => e.id === "dragonRush");
        if (defaultDr) parsed.push(defaultDr);
      }
      if (!parsed.find((e) => e.id === "kiblast")) {
        const defaultKb = defaultHudElements.find((e) => e.id === "kiblast");
        if (defaultKb) parsed.push(defaultKb);
      }
      if (!parsed.find((e) => e.id === "dash")) {
        const defaultDash = defaultHudElements.find((e) => e.id === "dash");
        if (defaultDash) parsed.push(defaultDash);
      }
      return parsed;
    }
  } catch (e) {}

  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return compactHudElements;
  }
  return defaultHudElements;
};

const SPACING = 0.02;

export const isOverlapping = (a: HudElement, b: HudElement) => {
  return (
    a.x < b.x + b.width + SPACING &&
    a.x + a.width + SPACING > b.x &&
    a.y < b.y + b.height + SPACING &&
    a.y + a.height + SPACING > b.y
  );
};

export const validateLayout = (elements: HudElement[], current: HudElement) => {
  for (const el of elements) {
    if (el.id !== current.id && isOverlapping(current, el)) {
      return false;
    }
  }
  return true;
};

interface VirtualControlsProps {
  inputManager?: TouchInputManager;
  p1HeavyCooldown?: number;
  p1DashCooldown?: number;
  p1ProjectileCooldown?: number;
  p1DragonRushCooldown?: number;
  assistCooldown?: number;
  p1ActiveId?: string;
  isEditing?: boolean;
  onLayoutUpdate?: (elements: HudElement[]) => void;
  editorElements?: HudElement[];
  maintainAspectRatio?: boolean;
  hidden?: boolean;
}

// Custom internal components to map visual IDs
const iconMap: Record<string, React.ReactNode> = {
  dpad: <Gamepad2 className="text-white/50 w-1/3 h-1/3 opacity-30 pointer-events-none" />,
  kiblast: <Target className="w-1/2 h-1/2 pointer-events-none" />,
  special: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special" />,
  special2: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special 2" />,
  special3: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special 3" />,
  special4: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special 4" />,
  special5: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special 5" />,
  special6: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Special 6" />,
  light: <img draggable={false} src="/Assets/icones%20ui/combo%20leve.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Light" />,
  medium: <img draggable={false} src="/Assets/icones%20ui/icone%20combo%20medio.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Medium" />,
  heavy: <img draggable={false} src="/Assets/icones%20ui/icone%20combo%20forte.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Heavy" />,
  dash: <img draggable={false} src="/Assets/icones%20ui/icone%20dash.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Dash" />,
  block: <img draggable={false} src="/Assets/icones%20ui/icone%20defeza.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Block" />,
  charge: <img draggable={false} src="/Assets/icones%20ui/icone%20carregando%20ki.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Charge" />,
  ultimate: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Ultimate" />,
  ultimate2: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Ultimate 2" />,
  ultimate3: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Ultimate 3" />,
  ultimate4: <img draggable={false} src="/Assets/icones%20ui/icone%20especial.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Ultimate 4" />,
  tag: <Repeat className="w-1/2 h-1/2 pointer-events-none" />,
  assist1: <Users className="w-1/2 h-1/2 pointer-events-none" />,
  assist2: <UserPlus className="w-1/2 h-1/2 pointer-events-none" />,
  vanish: <Wind className="w-1/2 h-1/2 pointer-events-none" />,
  transform: <img draggable={false} src="/Assets/icones%20ui/icone%20transforma%C3%A7%C3%A3o.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Transform" />,
  dragonRush: <img draggable={false} src="/Assets/icones%20ui/icone%20dragon%20rush.png" className="w-1/2 h-1/2 object-contain filter drop-shadow-md pointer-events-none" referrerPolicy="no-referrer" alt="Dragon Rush" />,
};

const colorMap: Record<string, string> = {
  dpad: "border-transparent bg-transparent text-white",
  kiblast: "border-[#1F1B1B] bg-[#3C3737] text-yellow-400 ",
  special:
    "border-[#1F1B1B] bg-[#3C3737] text-orange-500 ",
  special2:
    "border-[#1F1B1B] bg-[#3C3737] text-blue-500 ",
  special3:
    "border-[#1F1B1B] bg-[#3C3737] text-purple-500 ",
  special4:
    "border-[#1F1B1B] bg-[#3C3737] text-green-500 ",
  special5:
    "border-[#1F1B1B] bg-[#3C3737] text-emerald-500 ",
  special6:
    "border-[#1F1B1B] bg-[#3C3737] text-cyan-500 ",
  ultimate:
    "border-[#eab308] bg-[#ca8a04] text-white ",
  ultimate2:
    "border-[#ef4444] bg-[#b91c1c] text-white ",
  ultimate3:
    "border-[#c026d3] bg-[#a21caf] text-white ",
  ultimate4:
    "border-[#f43f5e] bg-[#e11d48] text-white ",
  light:
    "border-[#1F1B1B] bg-[#3C3737] text-sky-500 ",
  medium:
    "border-[#1F1B1B] bg-[#3C3737] text-amber-500 ",
  heavy:
    "border-[#1F1B1B] bg-[#3C3737] text-red-500 ",
  dash: "border-[#1F1B1B] bg-[#3C3737] text-emerald-500 ",
  block:
    "border-[#1F1B1B] bg-[#3C3737] text-blue-500 ",
  charge:
    "border-[#1F1B1B] bg-[#3C3737] text-purple-500 ",
  tag: "border-[#1F1B1B] bg-[#3C3737] text-pink-500 ",
  assist1:
    "border-[#1F1B1B] bg-[#3C3737] text-teal-400 ",
  assist2:
    "border-[#1F1B1B] bg-[#3C3737] text-teal-400 ",
  vanish:
    "border-[#1F1B1B] bg-[#3C3737] text-white ",
  transform:
    "border-[#1F1B1B] bg-[#3C3737] text-indigo-400 ",
  dragonRush:
    "border-[#1F1B1B] bg-[#3C3737] text-green-400 ",
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    1,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    0,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");

  return d;
};

const RadialSkillsButton = React.memo(({
  inputManager,
  onOpenChange,
  delayMs = 300,
  instantRadialMenu = false,
  hidden = false,
}: {
  inputManager?: TouchInputManager;
  onOpenChange?: (open: boolean) => void;
  delayMs?: number;
  instantRadialMenu?: boolean;
  hidden?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exitedButton, setExitedButton] = useState(false);
  const [hasEverExited, setHasEverExited] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [rStickPos, setRStickPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchOrigin = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const { gameEngine } = useSceneManager();
  const hasTriggeredOnDown = useRef(false);

  useEffect(() => {
    if (hidden) {
      if (isOpen) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
      setExitedButton(false);
      setHasEverExited(false);
      setSelectedOption(null);
      setIsPressing(false);
      setRStickPos({ x: 0, y: 0 });
      if (holdTimer.current) clearTimeout(holdTimer.current);
      touchOrigin.current = null;
    }
  }, [hidden, isOpen, onOpenChange]);

  const [activeCharacterId, setActiveCharacterId] = useState(gameEngine?.player1?.data?.id || "");
  const [activeAnimKeys, setActiveAnimKeys] = useState(
    Object.keys(gameEngine?.player1?.data?.spriteConfig?.animations || {}).join(",")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const p1 = gameEngine?.player1;
      if (p1) {
        if (p1.data.id !== activeCharacterId) {
          setActiveCharacterId(p1.data.id);
        }
        const animKeys = Object.keys(p1.data.spriteConfig?.animations || {}).join(",");
        if (animKeys !== activeAnimKeys) {
          setActiveAnimKeys(animKeys);
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [gameEngine, activeCharacterId, activeAnimKeys]);

  const p1CharacterId = activeCharacterId;
  const p1AnimKeys = activeAnimKeys;

  const slots = useMemo(() => {
    const detectSkillKeyLoc = (skillId: string): string => {
      const p1 = gameEngine?.player1;
      if (!p1) return "";
      
      const animConfig = p1.data.spriteConfig?.animations;
      if (!animConfig) return "";

      const keys = Object.keys(animConfig);

      const findKeyInsensitive = (patterns: string[], fallbackPatterns?: string[]) => {
        // First pass: exact matches or case-insensitive exact matches
        for (const pattern of patterns) {
          const found = keys.find(k => k === pattern || k.toUpperCase() === pattern.toUpperCase());
          if (found) return found;
        }

        // Second pass: more flexible prefix/suffix matches, but avoid greedy matches
        if (fallbackPatterns) {
          for (const fp of fallbackPatterns) {
            const fpUpper = fp.toUpperCase();
            
            const found = keys.find(k => {
              const kUpper = k.toUpperCase();
              if (kUpper === fpUpper) return true;
              
              // Handle special cases where we want specific numbered specials
              const match = fpUpper.match(/SPECIAL_(\d+)/) || fpUpper.match(/ESPECIAL_(\d+)/) || fpUpper.match(/ULTIMATE_(\d+)/) || fpUpper.match(/ULT_(\d+)/);
              if (match) {
                const num = match[1];
                // Check if the key strictly contains this number but not others
                // e.g. "SPECIAL_1_1" matches "SPECIAL_1" pattern, but "SPECIAL_2_1" should not.
                const keyNumMatch = kUpper.match(/SPECIAL_(\d+)/) || kUpper.match(/ESPECIAL_(\d+)/) || kUpper.match(/ULTIMATE_(\d+)/) || kUpper.match(/ULT_(\d+)/) || kUpper.match(/SPECIAL(\d+)/);
                if (keyNumMatch && keyNumMatch[1] !== num) return false;
              }

              if (kUpper.startsWith(fpUpper + "_")) return true;
              
              // Handle "SPECIAL" specifically
              if (fpUpper === "SPECIAL" || fpUpper === "ESPECIAL") {
                if (kUpper === "SPECIAL" || kUpper === "ESPECIAL") return true;
                if (kUpper === "SPECIAL_1" || kUpper === "ESPECIAL_1") return true;
                if (kUpper.startsWith("SPECIAL_1_") || kUpper.startsWith("ESPECIAL_1_")) return true;
                return false;
              }

              // Default behavior for other patterns
              return kUpper.includes(fpUpper);
            });
            if (found) return found;
          }
        }
        return "";
      };

      if (skillId.startsWith('special')) {
        const num = skillId === 'special' ? '1' : skillId.replace('special', '');
        return findKeyInsensitive(
          [`ATTACK_SPECIAL${num}_START`, `SPECIAL_${num}_1`, `SPECIAL_${num}`, `Especial_${num}_1`, `Especial_${num}`, `ATTACK_SPECIAL_${num}`],
          [`SPECIAL_${num}_1`, `ESPECIAL_${num}_1`, `SPECIAL_${num}`, `ESPECIAL_${num}`, `SPE_${num}`, `ATTACK_SPECIAL_${num}`]
        );
      } else if (skillId === 'ultimate') {
        const primaryKey = findKeyInsensitive(
          ["SUPER_ESPECIAL_INICIO_1", "ULTIMATE_1_1", "ULTIMATE_1", "ULTIMATE", "Ultimate_Parte1_1", "Ultimate_1_1"],
          ["ULTIMATE_1", "ULTIMATE_PARTE1", "ULT_1", "SUPER_ESPECIAL_INICIO_1", "ULTIMATE_COMBINADO"]
        );
        if (primaryKey) return primaryKey;
        // Fallback: if character has Ultimate 2 but no Ultimate 1 (e.g. Gogeta SSJ4), map Ultimate 1 to Ultimate 2!
        return findKeyInsensitive(
          ["SUPER_ESPECIAL_INICIO_2", "ULTIMATE_2_1", "ULTIMATE_2", "Ultimate_Parte2_1", "Ultimate_2_1"],
          ["ULTIMATE_2", "ULTIMATE_PARTE2", "ULT_2", "SUPER_ESPECIAL_INICIO_2"]
        );
      } else if (skillId === 'ultimate2') {
        return findKeyInsensitive(
          ["SUPER_ESPECIAL_INICIO_2", "ULTIMATE_2_1", "ULTIMATE_2", "Ultimate_Parte2_1", "Ultimate_2_1"],
          ["ULTIMATE_2", "ULTIMATE_PARTE2", "ULT_2", "SUPER_ESPECIAL_INICIO_2"]
        );
      } else if (skillId === 'ultimate3') {
        return findKeyInsensitive(
          ["ULTIMATE_3_1", "ULTIMATE_3", "Ultimate_Parte3_1", "Ultimate_3_1", "Ultimate_combinado_1"],
          ["ULTIMATE_3", "ULTIMATE_PARTE3", "ULT_3", "ULTIMATE_COMBINADO"]
        );
      } else if (skillId === 'ultimate4') {
        return findKeyInsensitive(
          ["ULTIMATE_4_1", "ULTIMATE_4", "Ultimate_Parte4_1", "Ultimate_4_1"],
          ["ULTIMATE_4", "ULTIMATE_PARTE4", "ULT_4"]
        );
      }

      return "";
    };

    const hasSkillLoc = (skillId: string): boolean => {
      return detectSkillKeyLoc(skillId) !== "";
    };

    const isSkillImportedLoc = (skillId: string): boolean => {
      const p1 = gameEngine?.player1;
      if (!p1) return false;

      const animConfig = p1.data.spriteConfig?.animations;
      if (!animConfig) return false;

      // Handle duplicate ultimate slot (avoid showing Ult 2 if it's the same as Ult 1)
      if (skillId === 'ultimate2') {
        const animKeysUpper = p1AnimKeys.toUpperCase();
        const hasRealUlt1 = animKeysUpper.includes("ULTIMATE_1") || 
                            animKeysUpper.includes("ULTIMATE_PARTE1") || 
                            animKeysUpper.includes("SUPER_ESPECIAL_INICIO_1") ||
                            animKeysUpper.includes("ULTIMATE_COMBINADO");
        
        // If they don't have a real Ultimate 1, but they DO have a real Ultimate 2,
        // then detectSkillKeyLoc('ultimate') will return Ultimate 2.
        // In that case, we hide 'ultimate2' slot to avoid duplicates.
        if (!hasRealUlt1) return false;
      }

      const key = detectSkillKeyLoc(skillId);
      if (!key) return false;

      const anim = animConfig[key];
      if (!anim) return false;

      // Check if it's a valid animation with a real image
      const url = anim.imageUrl || "";
      const isPlaceholder = url.includes("base64") || url.length < 10;
      
      if (isPlaceholder) return false;

      // Special check: ensure we are not matching a "SPECIAL_2" for a "SPECIAL_1" slot
      // This is extra safety on top of findKeyInsensitive
      if (skillId === 'special') {
         if (key.toUpperCase().includes("_2") || key.toUpperCase().includes("_3") || key.toUpperCase().includes("_4") || key.toUpperCase().includes("_5") || key.toUpperCase().includes("_6")) {
            // If it matched SPECIAL_2 for SPECIAL slot, it's probably because it only has SPECIAL_2.
            // But we should be careful.
         }
      }

      return true;
    };

    const getSkillImage = (skillId: string) => {
      const p1 = gameEngine?.player1;
      const animConfig = p1?.data?.spriteConfig?.animations;
      if (!animConfig) return "/Assets/icones%20ui/icone%20especial.png";
      const foundKey = detectSkillKeyLoc(skillId);
      return (foundKey && animConfig[foundKey]?.imageUrl) || "/Assets/icones%20ui/icone%20especial.png";
    };

    const allSlots = [
      {
        id: "special",
        label: "Especial",
        short: "SPC",
        color: "#f97316",
        icon: "🔥",
        imageUrl: getSkillImage("special")
      },
      {
        id: "ultimate",
        label: "Ultimate 1",
        short: "U1",
        color: "#eab308",
        icon: "✨",
        imageUrl: getSkillImage("ultimate")
      },
      {
        id: "ultimate2",
        label: "Ultimate 2",
        short: "U2",
        color: "#ef4444",
        icon: "💥",
        imageUrl: getSkillImage("ultimate2")
      },
      {
        id: "ultimate3",
        label: (gameEngine?.player1?.data?.id === "kuririn" || gameEngine?.player1?.data?.id === "goku_base") ? "Ult. Combinado" : "Ultimate 3",
        short: (gameEngine?.player1?.data?.id === "kuririn" || gameEngine?.player1?.data?.id === "goku_base") ? "UTC" : "U3",
        color: "#c026d3",
        icon: "🌠",
        imageUrl: getSkillImage("ultimate3")
      },
      {
        id: "ultimate4",
        label: "Ultimate 4",
        short: "U4",
        color: "#f43f5e",
        icon: "⚡",
        imageUrl: getSkillImage("ultimate4")
      },
      {
        id: "special2",
        label: "Especial 2",
        short: "SP2",
        color: "#3b82f6",
        icon: "waves",
        imageUrl: getSkillImage("special2")
      },
      {
        id: "special3",
        label: "Especial 3",
        short: "SP3",
        color: "#8b5cf6",
        icon: "⚡",
        imageUrl: getSkillImage("special3")
      },
      {
        id: "special4",
        label: "Especial 4",
        short: "SP4",
        color: "#22c55e",
        icon: "🌪️",
        imageUrl: getSkillImage("special4")
      },
      {
        id: "special5",
        label: "Especial 5",
        short: "SP5",
        color: "#10b981",
        icon: "✨",
        imageUrl: getSkillImage("special5")
      },
      {
        id: "special6",
        label: "Especial 6",
        short: "SP6",
        color: "#06b6d4",
        icon: "🌟",
        imageUrl: getSkillImage("special6")
      },
      {
        id: "special7",
        label: "Especial 7",
        short: "SP7",
        color: "#0d9488",
        icon: "⚡",
        imageUrl: getSkillImage("special7")
      },
      {
        id: "special8",
        label: "Especial 8",
        short: "SP8",
        color: "#0891b2",
        icon: "💥",
        imageUrl: getSkillImage("special8")
      },
      {
        id: "special9",
        label: "Especial 9",
        short: "SP9",
        color: "#0284c7",
        icon: "🌠",
        imageUrl: getSkillImage("special9")
      },
      {
        id: "special10",
        label: "Especial 10",
        short: "SP10",
        color: "#2563eb",
        icon: "🌪️",
        imageUrl: getSkillImage("special10")
      }
    ];

    let filteredSlots = allSlots.filter(s => isSkillImportedLoc(s.id));
    
    // Final check to ensure we don't have duplicates if something slipped through
    const seenKeys = new Set<string>();
    filteredSlots = filteredSlots.filter(s => {
      const key = detectSkillKeyLoc(s.id);
      if (!key || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    return filteredSlots.length > 0 ? filteredSlots : allSlots.slice(0, 1); // Fallback to at least 1 slot if somehow none found
  }, [p1CharacterId, gameEngine?.p1ActiveIdx, p1AnimKeys]);

  const SLICE_ANGLE = slots.length === 1 ? 359.99 : (slots.length > 0 ? 360 / slots.length : 360);
  const HALF_SLICE = SLICE_ANGLE / 2;

  // Poll physical/virtual joystick directions to preselect or dynamically update the selected skill
  useEffect(() => {
    if (!isPressing || !inputManager) return;
    let active = true;

    const poll = () => {
      if (!active) return;
      const p1 = inputManager.current;
      let dx = 0;
      let dy = 0;
      if (p1.right) dx = 1;
      if (p1.left) dx = -1;
      if (p1.down) dy = 1;
      if (p1.up) dy = -1;

      if (dx !== 0 || dy !== 0) {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        const normalizedAngle = (angleDeg + HALF_SLICE) % 360;
        const joystickIndex = Math.floor(normalizedAngle / SLICE_ANGLE);

        if (joystickIndex >= 0 && joystickIndex < slots.length) {
          setSelectedOption(joystickIndex);
          setExitedButton(true);
          setHasEverExited(true);
          if (!isOpen) {
            setIsOpen(true);
            if (onOpenChange) onOpenChange(true);
            if (holdTimer.current) {
              clearTimeout(holdTimer.current);
              holdTimer.current = null;
            }
          }
        }
      }
      requestAnimationFrame(poll);
    };

    poll();
    return () => {
      active = false;
    };
  }, [isPressing, isOpen, inputManager, SLICE_ANGLE, HALF_SLICE, slots.length, onOpenChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setExitedButton(false);
    setHasEverExited(false);
    setSelectedOption(null);
    setIsPressing(true);
    setRStickPos({ x: 0, y: 0 });
    hasTriggeredOnDown.current = false;
    touchOrigin.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    if (holdTimer.current) clearTimeout(holdTimer.current);

    // Initial check for joystick position to trigger instant directional special selection
    let joystickIndex: number | null = null;
    if (inputManager) {
      const p1 = inputManager.current;
      let dx = 0;
      let dy = 0;
      if (p1.right) dx = 1;
      if (p1.left) dx = -1;
      if (p1.down) dy = 1;
      if (p1.up) dy = -1;

      if (dx !== 0 || dy !== 0) {
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angleDeg < 0) angleDeg += 360;

        const normalizedAngle = (angleDeg + HALF_SLICE) % 360;
        joystickIndex = Math.floor(normalizedAngle / SLICE_ANGLE);
      }
    }

    if (joystickIndex !== null && slots[joystickIndex]) {
      // Instantly trigger this special/ultimate without opening the radial menu!
      const targetSkill = slots[joystickIndex];
      inputManager.setInput(targetSkill.id as InputAction, true);
      AudioManager.getInstance().playSFX("click");
      
      hasTriggeredOnDown.current = true;
      setIsOpen(false);
      setExitedButton(false);
      setHasEverExited(false);
      setSelectedOption(joystickIndex);
    } else {
      if (instantRadialMenu) {
        setIsOpen(true);
        if (onOpenChange) onOpenChange(true);
      } else {
        holdTimer.current = setTimeout(() => {
          setIsOpen(true);
          if (onOpenChange) onOpenChange(true);
        }, delayMs);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchOrigin.current || !containerRef.current) return;

    if (!isOpen) {
        const dx = e.clientX - touchOrigin.current.x;
        const dy = e.clientY - touchOrigin.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const maxVisualTilt = 18;
        const scale = dist > 0 ? (Math.min(dist, maxVisualTilt) / dist) : 0;
        setRStickPos({ x: dx * scale, y: dy * scale });

        if (dist > 25) {
            setHasEverExited(true);
        }
        return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxVisualTilt = 18;
    const scale = dist > 0 ? (Math.min(dist, maxVisualTilt) / dist) : 0;
    setRStickPos({ x: dx * scale, y: dy * scale });

    if (dist > 25) {
      setExitedButton(true);
      setHasEverExited(true);
      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      const normalizedAngle = (angleDeg + HALF_SLICE) % 360;
      const hoverIndex = Math.floor(normalizedAngle / SLICE_ANGLE);

      if (dist < 300) {
        setSelectedOption(hoverIndex);
      } else {
        setSelectedOption(null);
      }
    } else {
      setExitedButton(false);
      // Let joystick direction keep the selection if joystick is active, otherwise clear it
      if (inputManager) {
        const p1 = inputManager.current;
        const joystickActive = p1.right || p1.left || p1.down || p1.up;
        if (!joystickActive) {
          setSelectedOption(null);
        }
      } else {
        setSelectedOption(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setIsPressing(false);
    setRStickPos({ x: 0, y: 0 });

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (inputManager && !hasTriggeredOnDown.current) {
      if (isOpen) {
        if (selectedOption !== null && slots[selectedOption]) {
          const form = slots[selectedOption];
          inputManager.setInput(form.id as InputAction, true);
          AudioManager.getInstance().playSFX("click");
        } else if (!hasEverExited) {
          // Just tapped and didn't select anything
          if (slots.length > 0) {
            inputManager.setInput(slots[0].id as InputAction, true);
            AudioManager.getInstance().playSFX("click");
          }
        }
      } else {
        // Did not open radial menu (delay not reached), normal tap
        const tapDuration = touchOrigin.current ? Date.now() - touchOrigin.current.time : 0;
        if (!hasEverExited && tapDuration < delayMs) {
          if (slots.length > 0) {
            inputManager.setInput(slots[0].id as InputAction, true);
            AudioManager.getInstance().playSFX("click");
          }
        }
      }
    }

    hasTriggeredOnDown.current = false;
    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
    setExitedButton(false);
    setHasEverExited(false);
    setSelectedOption(null);
    touchOrigin.current = null;

    setTimeout(() => {
      if (inputManager) {
          inputManager.setInput("special", false);
          inputManager.setInput("ultimate", false);
          inputManager.setInput("ultimate2", false);
          inputManager.setInput("ultimate3", false);
          inputManager.setInput("ultimate4", false);
          inputManager.setInput("special2", false);
          inputManager.setInput("special3", false);
          inputManager.setInput("special4", false);
          inputManager.setInput("special5", false);
          inputManager.setInput("special6", false);
      }
    }, 50);
  };

  const hoveredSlot = selectedOption !== null && slots[selectedOption] ? slots[selectedOption] : null;

  const getStickRImg = () => {
    const PS_BASE = "/Assets/ui/playstation/";
    if (!isPressing) return `${PS_BASE}playstation_stick_r.png`;
    
    const dist = Math.sqrt(rStickPos.x * rStickPos.x + rStickPos.y * rStickPos.y);
    if (dist < 4) return `${PS_BASE}playstation_stick_r_press.png`;

    const angle = Math.atan2(rStickPos.y, rStickPos.x) * 180 / Math.PI;

    if (angle >= -22.5 && angle <= 22.5) {
      return `${PS_BASE}playstation_stick_r_right.png`;
    } else if (angle > 22.5 && angle < 67.5) {
      return `${PS_BASE}playstation_stick_r_down.png`;
    } else if (angle >= 67.5 && angle <= 112.5) {
      return `${PS_BASE}playstation_stick_r_down.png`;
    } else if (angle > 112.5 && angle < 157.5) {
      return `${PS_BASE}playstation_stick_r_down.png`;
    } else if (angle >= 157.5 || angle <= -157.5) {
      return `${PS_BASE}playstation_stick_r_left.png`;
    } else if (angle > -157.5 && angle < -112.5) {
      return `${PS_BASE}playstation_stick_r_up.png`;
    } else if (angle >= -112.5 && angle <= -67.5) {
      return `${PS_BASE}playstation_stick_r_up.png`;
    } else {
      return `${PS_BASE}playstation_stick_r_up.png`;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none] [-webkit-user-drag:none] rounded-full"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={`absolute w-[85%] h-[85%] rounded-full bg-gradient-to-b from-[#08090c] to-[#15171e] border-[0.6vmin] border-zinc-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center transition-opacity duration-200 ${isOpen && !exitedButton ? "opacity-0" : "opacity-100"}`}
      >
        <div className="absolute inset-0 rounded-full opacity-5 border border-dashed border-white scale-90" />
      </div>
      <div
        className={`relative z-20 w-[54%] h-[54%] flex items-center justify-center pointer-events-none select-none transition-transform ${
            (isOpen && !exitedButton) || (isPressing && !isOpen) ? "scale-90" : "scale-100"
        } ${isOpen && !exitedButton ? "opacity-0" : "opacity-100"}`}
        style={{ 
          transform: `translate(${rStickPos.x}px, ${rStickPos.y}px)`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.75))"
        }}
      >
        <img 
          draggable={false} 
          src={getStickRImg()} 
          className="w-full h-full object-contain pointer-events-none select-none" 
          referrerPolicy="no-referrer"
          alt="R-Stick" 
        />
        <span className="absolute bottom-[-18%] left-1/2 -translate-x-1/2 text-[1.4vmin] uppercase font-bold text-white tracking-wider bg-black/40 px-[0.6vmin] py-[0.15vmin] rounded-sm filter drop-shadow font-sans backdrop-blur-[1px] select-none pointer-events-none">
          SKILLS
        </span>
      </div>

      {isOpen && (
          <motion.div
          initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="absolute top-1/2 left-1/2 w-[45vmin] h-[45vmin] pointer-events-none z-50 flex items-center justify-center filter drop-"
        >
          <svg
            viewBox="0 0 320 320"
            className="absolute w-full h-full overflow-visible"
          >
            <defs>
              {slots.map((slot, i) => {
                const startAngle = i * SLICE_ANGLE - HALF_SLICE;
                const endAngle = i * SLICE_ANGLE + HALF_SLICE;
                const isSelected = selectedOption === i;
                const innerRadius = 45;
                const outerRadius = isSelected ? 150 : 140;
                return (
                  <clipPath id={`clip-skills-${i}`} key={`clip-skills-${i}`}>
                    <path
                      d={describeArc(
                        160,
                        160,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle,
                      )}
                    />
                  </clipPath>
                );
              })}
            </defs>
            {slots.map((slot, i) => {
              const startAngle = i * SLICE_ANGLE - HALF_SLICE;
              const endAngle = i * SLICE_ANGLE + HALF_SLICE;
              const isSelected = selectedOption === i;

              const innerRadius = 45;
              const outerRadius = isSelected ? 150 : 140;

              const slicePath = describeArc(
                160,
                160,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
              );
              const angle = i * SLICE_ANGLE;
              const pos = polarToCartesian(160, 160, 100, angle);

              return (
                <g key={`${slot.id}-path-${i}`}>
                  <path
                    d={slicePath}
                    fill={isSelected ? "rgba(249, 115, 22, 0.4)" : "#262626"}
                    stroke="none"
                    style={{ transition: "all 0.15s ease-out" }}
                  />
                  {slot.imageUrl ? (
                    <g clipPath={`url(#clip-skills-${i})`}>
                      <image
                        href={slot.imageUrl}
                        x={pos.x - 90}
                        y={pos.y - 90}
                        width="180"
                        height="180"
                        className="transition-opacity duration-200"
                        opacity={isSelected ? "0.7" : "0.2"}
                        preserveAspectRatio="xMidYMid slice"
                        style={{ filter: "grayscale(100%) contrast(120%)" }}
                      />
                    </g>
                  ) : (
                    <text
                      x={pos.x}
                      y={pos.y + 10}
                      textAnchor="middle"
                      fill="white"
                      fontSize="30"
                      opacity={isSelected ? "1" : "0.5"}
                    >
                      {slot.icon}
                    </text>
                  )}
                  <path
                    d={slicePath}
                    fill="none"
                    stroke={isSelected ? "#f97316" : "#404040"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    style={{ transition: "all 0.15s ease-out" }}
                  />
                </g>
              );
            })}

            {slots.map((slot, i) => {
              const isSelected = selectedOption === i;
              if (!isSelected) return null;

              const startOuter = polarToCartesian(160, 160, 150, i * SLICE_ANGLE - HALF_SLICE);
              const endOuter = polarToCartesian(160, 160, 150, i * SLICE_ANGLE + HALF_SLICE);
              const startInner = polarToCartesian(160, 160, 45, i * SLICE_ANGLE - HALF_SLICE);
              const endInner = polarToCartesian(160, 160, 45, i * SLICE_ANGLE + HALF_SLICE);

              return (
                <g key={`dots-skills-${i}`}>
                  <circle cx={startOuter.x} cy={startOuter.y} r="4.5" fill="#a3a3a3" stroke="#262626" strokeWidth="1.5" />
                  <circle cx={endOuter.x} cy={endOuter.y} r="4.5" fill="#a3a3a3" stroke="#262626" strokeWidth="1.5" />
                  <circle cx={startInner.x} cy={startInner.y} r="4.5" fill="#a3a3a3" stroke="#262626" strokeWidth="1.5" />
                  <circle cx={endInner.x} cy={endInner.y} r="4.5" fill="#a3a3a3" stroke="#262626" strokeWidth="1.5" />
                </g>
              );
            })}

            <circle cx="160" cy="160" r="45" fill="#171717" stroke="#404040" strokeWidth="2" />
            {selectedOption !== null && slots[selectedOption]?.imageUrl && (
              <g clipPath="url(#clip-skills-center)">
                 <clipPath id="clip-skills-center">
                    <circle cx="160" cy="160" r="45" />
                 </clipPath>
                 <image 
                   href={slots[selectedOption].imageUrl!}
                   x={115}
                   y={115}
                   width="90"
                   height="90"
                   opacity="0.5"
                   preserveAspectRatio="xMidYMid slice"
                   style={{ filter: "grayscale(100%) contrast(120%)" }}
                 />
              </g>
            )}
          </svg>

          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none w-[15vmin] h-[15vmin]">
              {hoveredSlot ? (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={`center-${hoveredSlot.id}`}
                    className="w-full h-full rounded-full flex items-center justify-center text-[4vmin] shadow-inner border-[0.5vmin] border-black/40 overflow-hidden"
                    style={{ backgroundColor: hoveredSlot.color, filter: 'grayscale(100%)' }}
                  >
                    {hoveredSlot.imageUrl ? (
                      <img
                        draggable={false}
                        src={hoveredSlot.imageUrl}
                        className="absolute inset-0 w-full h-full object-cover scale-[1.2] pointer-events-none filter contrast-125"
                        alt=""
                      />
                    ) : (
                      <span className="filter drop-shadow-md">
                        {hoveredSlot.icon}
                      </span>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`label-${hoveredSlot.id}`}
                    className="absolute top-[110%] left-1/2 -translate-x-1/2 text-zinc-100 text-[1.5vmin] font-bold whitespace-nowrap bg-zinc-900/90 px-[1vmin] py-[0.5vmin] rounded border border-zinc-700/50 shadow-2xl backdrop-blur-md flex items-center justify-center gap-[0.5vmin]"
                  >
                    {hoveredSlot.label}
                    <div className="w-[0.8vmin] h-[0.8vmin] rounded-sm bg-orange-500 animate-pulse border border-orange-300" />
                  </motion.div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative filter drop-shadow-md">
                  {React.cloneElement(iconMap["special"] as React.ReactElement<any>, { className: "w-[65%] h-[65%] object-contain pointer-events-none" })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});

const RadialTransformButton = React.memo(({
  inputManager,
  onOpenChange,
  delayMs = 300,
  instantRadialMenu = false,
  hidden = false,
}: {
  inputManager?: TouchInputManager;
  onOpenChange?: (open: boolean) => void;
  delayMs?: number;
  instantRadialMenu?: boolean;
  hidden?: boolean;
}) => {
  const { gameEngine } = useSceneManager();
  const [isOpen, setIsOpen] = useState(false);
  const [exitedButton, setExitedButton] = useState(false);
  const [hasEverExited, setHasEverExited] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [activeFormIndex, setActiveFormIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchOrigin = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hidden) {
      if (isOpen) {
        setIsOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
      setExitedButton(false);
      setHasEverExited(false);
      setSelectedOption(null);
      setIsPressing(false);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      touchOrigin.current = null;
    }
  }, [hidden, isOpen, onOpenChange]);

  const activeId = gameEngine?.player1?.data?.id || "";
  const teamIdsStr = useMemo(() => {
    return gameEngine?.p1Team ? gameEngine.p1Team.map((c: any) => c?.data?.id).filter((id): id is string => typeof id === "string").join(",") : "";
  }, [gameEngine?.p1Team]);

  const p1FusionUsed = gameEngine?.p1FusionUsed;

  const { slots, SLICE_ANGLE, HALF_SLICE } = React.useMemo(() => {
    const teamIds = teamIdsStr ? teamIdsStr.split(",") : [];

    const getFormLevel = (id: string): string => {
      const lower = (id || "").toLowerCase();
      if (lower.includes("ego")) return "ego";
      if (lower.includes("ui") || lower.includes("instinct")) return "ui";
      if (lower.includes("blue") || lower.includes("ssb")) return "blue";
      if (lower.includes("god")) return "god";
      if (lower.includes("ssj3")) return "ssj3";
      if (lower.includes("ssj2")) return "ssj2";
      if (lower.includes("ssj")) return "ssj";
      return "base";
    };

    const getBaseName = (id: string) => {
      const lower = (id || "").toLowerCase();
      if (lower.includes('goku_black')) return 'goku_black';
      if (lower.includes('gogeta')) return 'gogeta';
      if (lower.includes('goku')) return 'goku';
      if (lower.includes('vegeta')) return 'vegeta';
      return lower;
    };

    const activeFormLevel = getFormLevel(activeId);
    const activeBaseName = getBaseName(activeId);

    const gokuIds = teamIds.filter((id: string) => getBaseName(id) === "goku");
    const vegetaIds = teamIds.filter((id: string) => getBaseName(id) === "vegeta");

    const hasGokuOfCurrentForm = gokuIds.some((id: string) => getFormLevel(id) === activeFormLevel);
    const hasVegetaOfCurrentForm = vegetaIds.some((id: string) => getFormLevel(id) === activeFormLevel);

    const isGokuOrVegetaActive = activeBaseName === "goku" || activeBaseName === "vegeta";
    const hasGogetaInTeam = teamIds.some((id: string) => (id || "").toLowerCase().includes("gogeta"));

    const gogetaFormMap: Record<string, any> = {
      "base": {
        id: "gogeta",
        label: "Fusão: Gogeta Base",
        short: "FUSION",
        color: "#f97316",
        icon: "🔥",
        imageUrl: "/Assets/gogeta/parado.gif",
      },
      "ssj": {
        id: "gogeta_ssj",
        label: "Fusão: Gogeta SSJ",
        short: "FUSION_SSJ",
        color: "#eab308",
        icon: "⚡",
        imageUrl: "/Assets/gogeta%20ssj/parado.gif",
      },
      "blue": {
        id: "gogeta_blue",
        label: "Fusão: Gogeta Blue",
        short: "FUSION_BLUE",
        color: "#0ea5e9",
        icon: "🌊",
        imageUrl: "/Assets/GOGETA%20BLUE/parado.gif",
      }
    };

    const fusionOption = gogetaFormMap[activeFormLevel];
    const canFuseGogeta = hasGokuOfCurrentForm && hasVegetaOfCurrentForm && isGokuOrVegetaActive && !p1FusionUsed && !!fusionOption && !hasGogetaInTeam;

    const gokuSlots = [
      {
        id: "ssj",
        label: "Super Saiyajin",
        short: "SSJ",
        color: "#eab308",
        icon: "⚡",
        imageUrl:
          "/Assets/PERSONAGENS/GOKU%20SSJ/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssj2",
        label: "Super Saiyajin 2",
        short: "SSJ2",
        color: "#fde047",
        icon: "✨",
        imageUrl: "/Assets/PERSONAGENS/TRUNKS%20SSJ2/Anima%C3%A7%C3%B5es/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssj3",
        label: "Super Saiyajin 3",
        short: "SSJ3",
        color: "#f59e0b",
        icon: "💫",
        imageUrl: "/Assets/PERSONAGENS/TRUNKS%20SSJ2/Anima%C3%A7%C3%B5es/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "god",
        label: "Deus Super Saiyajin",
        short: "GOD",
        color: "#ef4444",
        icon: "🔥",
        imageUrl: "/Assets/PERSONAGENS/GOKU%20BLUE/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssb",
        label: "Super Saiyajin Blue",
        short: "SSB",
        color: "#06b6d4",
        icon: "🌊",
        imageUrl:
          "/Assets/PERSONAGENS/GOKU%20BLUE/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ui",
        label: "Instinto Superior",
        short: "UI",
        color: "#cbd5e1",
        icon: "☄️",
        imageUrl: "/Assets/PERSONAGENS/GOKU%20MUI/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif"
      },
    ];

    const vegetaSlots = [
      {
        id: "base",
        label: "Forma Base (Destransformar)",
        short: "BASE",
        color: "#6b7280",
        icon: "🌀",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20BASE/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssj",
        label: "Super Saiyajin",
        short: "SSJ",
        color: "#eab308",
        icon: "⚡",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20BASE/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssj2",
        label: "Super Saiyajin 2",
        short: "SSJ2",
        color: "#fde047",
        icon: "✨",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20BASE/ANIMA%C3%87%C3%95ES/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "god",
        label: "Deus Super Saiyajin",
        short: "GOD",
        color: "#ef4444",
        icon: "🔥",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20EGO/Anima%C3%A7%C3%B5es/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ssb",
        label: "Super Saiyajin Blue",
        short: "SSB",
        color: "#06b6d4",
        icon: "🌊",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20EGO/Anima%C3%A7%C3%B5es/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif",
      },
      {
        id: "ego",
        label: "Ego Superior",
        short: "EGO",
        color: "#9b59b6",
        icon: "💜",
        imageUrl: "/Assets/PERSONAGENS/VEGETA%20EGO/Anima%C3%A7%C3%B5es/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif"
      },
    ];

    const gogetaSlots = [
      {
        id: "base",
        label: "Gogeta Base",
        short: "BASE",
        color: "#6b7280",
        icon: "🌀",
        imageUrl: "/Assets/gogeta/parado.gif",
      },
      {
        id: "gogeta_ssj",
        label: "Super Saiyajin",
        short: "SSJ",
        color: "#eab308",
        icon: "⚡",
        imageUrl: "/Assets/gogeta%20ssj/parado.gif",
      },
      {
        id: "gogeta_blue",
        label: "Super Saiyajin Blue",
        short: "SSB",
        color: "#06b6d4",
        icon: "🌊",
        imageUrl: "/Assets/GOGETA%20BLUE/parado.gif",
      },
      {
        id: "gogeta_ssj4",
        label: "Super Saiyajin 4",
        short: "SSJ4",
        color: "#ef4444",
        icon: "🐒",
        imageUrl: "/Assets/PERSONAGENS/GOGETA%20SSJ4/MOVIMENTOS%20PADR%C3%95ES/PARADO.gif"
      }
    ];

    let charSlots = [];
    if (activeId.includes("gogeta")) {
        charSlots = gogetaSlots;
    } else if (activeId.includes("vegeta")) {
        charSlots = vegetaSlots;
    } else {
        charSlots = gokuSlots;
    }

    let activeIndex = -1;
    if (activeId === "goku_ssj" || activeId === "vegeta_base" || activeId === "gogeta") {
        activeIndex = 0;
    } else if (activeId === "gogeta_ssj") {
        activeIndex = 1;
    } else if (activeId === "gogeta_blue") {
        activeIndex = 2;
    } else if (activeId === "gogeta_ssj4") {
        activeIndex = 3;
    } else {
        const tgt = (activeId || "").toLowerCase();
        if (tgt.includes("ui") || tgt.includes("instinct")) activeIndex = charSlots.findIndex(s => s.id === "ui");
        else if (tgt.includes("blue") || tgt.includes("ssb")) activeIndex = charSlots.findIndex(s => s.id === "ssb" || s.id === "gogeta_blue");
        else if (tgt.includes("ssj4")) activeIndex = charSlots.findIndex(s => s.id === "gogeta_ssj4" || s.id === "ssj4");
        else if (tgt.includes("god")) activeIndex = charSlots.findIndex(s => s.id === "god");
        else if (tgt.includes("ssj3")) activeIndex = charSlots.findIndex(s => s.id === "ssj3");
        else if (tgt.includes("ssj2")) activeIndex = charSlots.findIndex(s => s.id === "ssj2");
        else if (tgt.includes("ssj")) activeIndex = charSlots.findIndex(s => s.id === "ssj");
    }
    
    if (activeIndex === -1) activeIndex = 0;

    const filteredCharSlots = [];
    if (activeIndex > 0) {
        filteredCharSlots.push(charSlots[0]);
    }
    
    for (let i = activeIndex + 1; i < charSlots.length; i++) {
        filteredCharSlots.push(charSlots[i]);
    }

    const calculatedSlots = canFuseGogeta && !activeId.includes("gogeta") && fusionOption ? [
      ...filteredCharSlots,
      fusionOption
    ] : filteredCharSlots;

    const sliceAngle = 360 / calculatedSlots.length;
    const halfSlice = sliceAngle / 2;

    return { slots: calculatedSlots, SLICE_ANGLE: sliceAngle, HALF_SLICE: halfSlice };
  }, [activeId, teamIdsStr, p1FusionUsed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setExitedButton(false);
    setHasEverExited(false);
    setSelectedOption(null);
    setIsPressing(true);
    touchOrigin.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (instantRadialMenu) {
      setIsOpen(true);
      if (onOpenChange) onOpenChange(true);
    } else {
      holdTimer.current = setTimeout(() => {
        setIsOpen(true);
        if (onOpenChange) onOpenChange(true);
      }, delayMs);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchOrigin.current || !containerRef.current) return;

    if (!isOpen) {
        const dx = e.clientX - touchOrigin.current.x;
        const dy = e.clientY - touchOrigin.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 25) {
            setHasEverExited(true);
        }
        return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 25) {
      setExitedButton(true);
      setHasEverExited(true);
      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;

      const normalizedAngle = (angleDeg + HALF_SLICE) % 360;
      const hoverIndex = Math.floor(normalizedAngle / SLICE_ANGLE);

      if (dist < 300) {
        setSelectedOption(hoverIndex);
      } else {
        setSelectedOption(null);
      }
    } else {
      setExitedButton(false);
      setSelectedOption(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setIsPressing(false);

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (inputManager) {
      if (isOpen) {
        if (selectedOption !== null && slots[selectedOption]) {
          const form = slots[selectedOption];
          console.log("Selected Form:", form.id);
          setActiveFormIndex(selectedOption);
          
          if (form.id.startsWith('gogeta') && !activeId.includes("gogeta")) {
             inputManager.setInput("fusion", true, form.id);
          } else {
             inputManager.setInput("transform", true, form.id);
          }
          AudioManager.getInstance().playSFX("click");
        } else if (!hasEverExited) {
          // Just tapped and didn't drag
          inputManager.setInput("transform", true);
          AudioManager.getInstance().playSFX("click");
        }
      } else {
        // Just a normal tap without dragging before delay was reached
        const tapDuration = touchOrigin.current ? Date.now() - touchOrigin.current.time : 0;
        if (!hasEverExited && tapDuration < delayMs) {
          inputManager.setInput("transform", true);
          AudioManager.getInstance().playSFX("click");
        }
      }
    }

    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
    setExitedButton(false);
    setHasEverExited(false);
    setSelectedOption(null);
    touchOrigin.current = null;

    // Ensure input resets on next frame if pressed
    setTimeout(() => {
      if (inputManager) {
          inputManager.setInput("transform", false, undefined);
          inputManager.setInput("fusion", false);
      }
    }, 50);
  };

  const hoveredSlot = selectedOption !== null && slots[selectedOption] ? slots[selectedOption] : null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none] [-webkit-user-drag:none] rounded-full"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* The main base button icon (when not dragging menu) */}
      <div
        className={`relative z-20 w-full h-full flex items-center justify-center rounded-full transition-all ${
            (isOpen && !exitedButton) || (isPressing && !isOpen) ? "scale-90 opacity-90" : "scale-100 opacity-80 hover:opacity-100"
        } ${isOpen && !exitedButton ? "opacity-0" : "opacity-100"}`}
      >
        <img
          draggable={false}
          src={isPressing ? `/Assets/ui/playstation/playstation4_button_options.png` : `/Assets/ui/playstation/playstation4_button_options_outline.png`}
          className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-md"
          referrerPolicy="no-referrer"
          alt="Options"
        />
        <span className="absolute bottom-[-2%] left-1/2 -translate-x-1/2 text-[1.4vmin] uppercase font-bold text-white tracking-wider bg-black/40 px-[0.6vmin] py-[0.15vmin] rounded-sm filter drop-shadow font-sans backdrop-blur-[1px] select-none pointer-events-none">
          TRANSFORM
        </span>
      </div>

      {/* Radial Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="absolute top-1/2 left-1/2 w-[45vmin] h-[45vmin] pointer-events-none z-50 flex items-center justify-center filter drop-"
        >
          <svg
            viewBox="0 0 320 320"
            className="absolute w-full h-full overflow-visible"
          >
            <defs>
              {slots.map((slot, i) => {
                const startAngle = i * SLICE_ANGLE - HALF_SLICE;
                const endAngle = i * SLICE_ANGLE + HALF_SLICE;
                const isSelected = selectedOption === i;
                const innerRadius = 45;
                const outerRadius = isSelected ? 150 : 140;
                return (
                  <clipPath id={`clip-transform-${i}`} key={`clip-transform-${i}`}>
                    <path
                      d={describeArc(
                        160,
                        160,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle,
                      )}
                    />
                  </clipPath>
                );
              })}
            </defs>
            {slots.map((slot, i) => {
              const startAngle = i * SLICE_ANGLE - HALF_SLICE;
              const endAngle = i * SLICE_ANGLE + HALF_SLICE;
              const isSelected = selectedOption === i;

              const innerRadius = 45;
              const outerRadius = isSelected ? 150 : 140;

              const slicePath = describeArc(
                160,
                160,
                innerRadius,
                outerRadius,
                startAngle,
                endAngle,
              );
              const angle = i * SLICE_ANGLE;
              const pos = polarToCartesian(160, 160, 100, angle);

              return (
                <g key={`${slot.id}-path-${i}`}>
                  <path
                    d={slicePath}
                    fill={isSelected ? "rgba(239, 68, 68, 0.4)" : "#262626"}
                    stroke="none"
                    style={{ transition: "all 0.15s ease-out" }}
                  />
                  <g clipPath={`url(#clip-transform-${i})`}>
                    {slot.imageUrl && (
                      <image
                        href={slot.imageUrl}
                        x={pos.x - 90}
                        y={pos.y - 90}
                        width="180"
                        height="180"
                        className="transition-opacity duration-200"
                        opacity={isSelected ? "0.7" : "0.2"}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    )}
                  </g>
                  <path
                    d={slicePath}
                    fill="none"
                    stroke={isSelected ? "#ef4444" : "#404040"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    style={{ transition: "all 0.15s ease-out" }}
                  />
                </g>
              );
            })}

            {/* Hover visual accents matching the reference image */}
            {slots.map((slot, i) => {
              const isSelected = selectedOption === i;
              if (!isSelected) return null;

              const startOuter = polarToCartesian(160, 160, 150, i * SLICE_ANGLE - HALF_SLICE);
              const endOuter = polarToCartesian(160, 160, 150, i * SLICE_ANGLE + HALF_SLICE);
              const startInner = polarToCartesian(160, 160, 45, i * SLICE_ANGLE - HALF_SLICE);
              const endInner = polarToCartesian(160, 160, 45, i * SLICE_ANGLE + HALF_SLICE);

              return (
                <g key={`dots-${i}`}>
                  <circle
                    cx={startOuter.x}
                    cy={startOuter.y}
                    r="4.5"
                    fill="#a3a3a3"
                    stroke="#262626"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={endOuter.x}
                    cy={endOuter.y}
                    r="4.5"
                    fill="#a3a3a3"
                    stroke="#262626"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={startInner.x}
                    cy={startInner.y}
                    r="4.5"
                    fill="#a3a3a3"
                    stroke="#262626"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={endInner.x}
                    cy={endInner.y}
                    r="4.5"
                    fill="#a3a3a3"
                    stroke="#262626"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Central circle background */}
            <circle
              cx="160"
              cy="160"
              r="45"
              fill="#171717"
              stroke="#404040"
              strokeWidth="2"
            />
            {activeFormIndex !== null && slots[activeFormIndex]?.imageUrl && (
              <g clipPath="url(#clip-center)">
                 <clipPath id="clip-center">
                    <circle cx="160" cy="160" r="45" />
                 </clipPath>
                 <image 
                   href={slots[activeFormIndex].imageUrl!}
                   x={115}
                   y={115}
                   width="90"
                   height="90"
                   opacity="0.3"
                   preserveAspectRatio="xMidYMid slice"
                 />
              </g>
            )}
          </svg>

          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Center Display */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none w-[15vmin] h-[15vmin]">
              {hoveredSlot ? (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={`center-${hoveredSlot.id}`}
                    className="w-full h-full rounded-full flex items-center justify-center text-[4vmin] shadow-inner border-[0.5vmin] border-black/40 overflow-hidden"
                    style={{ backgroundColor: hoveredSlot.color }}
                  >
                    {hoveredSlot.imageUrl ? (
                      <img
                        draggable={false}
                        src={hoveredSlot.imageUrl}
                        className="absolute inset-0 w-full h-full object-cover scale-[1.2] pointer-events-none"
                        alt=""
                      />
                    ) : (
                      <span className="filter drop-shadow-md">
                        {hoveredSlot.icon}
                      </span>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`label-${hoveredSlot.id}`}
                    className="absolute top-[110%] left-1/2 -translate-x-1/2 text-zinc-100 text-[1.5vmin] font-bold whitespace-nowrap bg-zinc-900/90 px-[1vmin] py-[0.5vmin] rounded border border-zinc-700/50 shadow-2xl backdrop-blur-md flex items-center justify-center gap-[0.5vmin]"
                  >
                    {hoveredSlot.label}
                    <div className="w-[0.8vmin] h-[0.8vmin] rounded-sm bg-red-500 animate-pulse border border-red-300" />
                  </motion.div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative filter drop-shadow-md">
                  <img
                    draggable={false}
                    src="/Assets/ui/playstation/playstation4_button_options_outline.png"
                    className="w-[65%] h-[65%] object-contain pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                    alt="Options"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
});

const GamepadThumbstick = React.memo(({
  inputManager,
}: {
  inputManager?: TouchInputManager;
}) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<{ dir: string; time: number }>({
    dir: "",
    time: 0,
  });
  const activeDashRef = useRef<boolean>(false);
  const previousInputsRef = useRef({ up: false, down: false, left: false, right: false });

  const updateInputs = (
    clientX: number,
    clientY: number,
    checkDoubleTap: boolean = false,
  ) => {
    if (!containerRef.current || !inputManager) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxDist = rect.width / 2.5;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      const ratio = maxDist / dist;
      dx *= ratio;
      dy *= ratio;
    }

    setKnobPos({ x: dx, y: dy });

    const normalizedDist = dist / maxDist;
    
    // Hysteresis on deadzone to prevent on/off fluttering near the border
    const hasActiveInput = previousInputsRef.current.up || previousInputsRef.current.down || previousInputsRef.current.left || previousInputsRef.current.right;
    const deadzone = hasActiveInput ? 0.22 : 0.3;
    
    const newState = { up: false, down: false, left: false, right: false };
    let primaryDir = "";

    if (normalizedDist > deadzone) {
      const angle = Math.atan2(dy, dx);
      const deg = (angle * 180) / Math.PI;

      // Hysteresis angle thresholds to prevent fluttering on boundaries
      const wasLeft = previousInputsRef.current.left;
      const wasRight = previousInputsRef.current.right;
      const wasUp = previousInputsRef.current.up;
      const wasDown = previousInputsRef.current.down;

      const leftAngleThreshold = wasLeft ? 150.0 : 157.5;
      const rightAngleThreshold = wasRight ? 30.0 : 22.5;
      const upAngleLow = wasUp ? -120.0 : -112.5;
      const upAngleHigh = wasUp ? -60.0 : -67.5;
      const downAngleLow = wasDown ? 60.0 : 67.5;
      const downAngleHigh = wasDown ? 120.0 : 112.5;

      if (deg >= upAngleLow && deg <= upAngleHigh) {
        newState.up = true;
        primaryDir = "up";
      }
      if (deg >= downAngleLow && deg <= downAngleHigh) {
        newState.down = true;
        primaryDir = "down";
      }
      if (deg >= -rightAngleThreshold && deg <= rightAngleThreshold) {
        newState.right = true;
        primaryDir = "right";
      }
      if (deg >= leftAngleThreshold || deg <= -leftAngleThreshold) {
        newState.left = true;
        primaryDir = "left";
      }

      // Diagonals with hysteresis buffers
      if (deg > upAngleHigh && deg < -rightAngleThreshold) {
        newState.up = true;
        newState.right = true;
        primaryDir = "right";
      }
      if (deg > rightAngleThreshold && deg < downAngleLow) {
        newState.down = true;
        newState.right = true;
        primaryDir = "right";
      }
      if (deg > downAngleHigh && deg < leftAngleThreshold) {
        newState.down = true;
        newState.left = true;
        primaryDir = "left";
      }
      if (deg > -leftAngleThreshold && deg < upAngleLow) {
        newState.up = true;
        newState.left = true;
        primaryDir = "left";
      }
    }

    previousInputsRef.current = newState;

    Object.keys(newState).forEach((dir) => {
      inputManager.setInput(
        dir as InputAction,
        newState[dir as keyof typeof newState],
      );
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsPressed(true);
    if (inputManager) {
      inputManager.setInput("isJoystickActive" as any, true);
    }
    updateInputs(e.clientX, e.clientY, true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPressed) updateInputs(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setIsPressed(false);
    activeDashRef.current = false;
    previousInputsRef.current = { up: false, down: false, left: false, right: false };
    setKnobPos({ x: 0, y: 0 });
    if (inputManager) {
      ["up", "down", "left", "right", "dash"].forEach((dir) =>
        inputManager.setInput(dir as InputAction, false),
      );
      inputManager.setInput("isJoystickActive" as any, false);
    }
  };

  const getStickLImg = () => {
    const PS_BASE = "/Assets/ui/playstation/";
    if (!isPressed) return `${PS_BASE}playstation_stick_l.png`;
    
    // Check if neutral press or heavily displaced
    const dist = Math.sqrt(knobPos.x * knobPos.x + knobPos.y * knobPos.y);
    if (dist < 8) return `${PS_BASE}playstation_stick_l_press.png`;

    const angle = Math.atan2(knobPos.y, knobPos.x) * 180 / Math.PI;

    if (angle >= -22.5 && angle <= 22.5) {
      return `${PS_BASE}playstation_stick_l_right.png`;
    } else if (angle > 22.5 && angle < 67.5) {
      return `${PS_BASE}playstation_stick_l_down.png`;
    } else if (angle >= 67.5 && angle <= 112.5) {
      return `${PS_BASE}playstation_stick_l_down.png`;
    } else if (angle > 112.5 && angle < 157.5) {
      return `${PS_BASE}playstation_stick_l_down.png`;
    } else if (angle >= 157.5 || angle <= -157.5) {
      return `${PS_BASE}playstation_stick_l_left.png`;
    } else if (angle > -157.5 && angle < -112.5) {
      return `${PS_BASE}playstation_stick_l_up.png`;
    } else if (angle >= -112.5 && angle <= -67.5) {
      return `${PS_BASE}playstation_stick_l_up.png`;
    } else {
      return `${PS_BASE}playstation_stick_l_up.png`;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative touch-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none] [-webkit-user-drag:none] flex items-center justify-center"
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute w-[85%] h-[85%] rounded-full bg-gradient-to-b from-[#08090c] to-[#15171e] border-[0.6vmin] border-zinc-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full opacity-5 border border-dashed border-white scale-90" />
      </div>
      <div
        className="relative w-[54%] h-[54%] transition-all duration-75 flex items-center justify-center pointer-events-none select-none"
        style={{ 
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.75))"
        }}
      >
        <img 
          draggable={false} 
          src={getStickLImg()} 
          className="w-full h-full object-contain pointer-events-none select-none" 
          referrerPolicy="no-referrer"
          alt="L-Stick" 
        />
      </div>
    </div>
  );
});

import { useUI } from "../contexts/UIContext";

export const VirtualControls: React.FC<VirtualControlsProps> = React.memo(
  ({
    inputManager,
    p1HeavyCooldown,
    p1DashCooldown,
    p1ProjectileCooldown,
    p1DragonRushCooldown,
    assistCooldown,
    p1ActiveId,
    isEditing = false,
    onLayoutUpdate,
    editorElements,
    maintainAspectRatio = false,
    hidden = false,
  }) => {
    const { settings, gameEngine } = useSceneManager();
    const { s, sx, sy, getPos, offsetX, offsetY, screenWidth, screenHeight } = useUI();
    const containerRef = useRef<HTMLDivElement>(null);
    const [localElements, setLocalElements] = useState<HudElement[]>(() =>
      getSavedHudElements(),
    );
    const [openRadial, setOpenRadial] = useState<string | null>(null);
    const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (hidden && inputManager) {
             inputManager.reset(); 
        }
    }, [hidden, inputManager]);

    const activeElements =
      isEditing && editorElements && editorElements.length > 0
        ? editorElements
        : localElements;

    const teamStatusKey = useMemo(() => {
        const team = gameEngine?.p1Team || [];
        return team.map((c: any) => `${c?.data?.id}:${c?.hp > 0 ? "alive" : "dead"}`).join(",");
    }, [gameEngine?.p1Team]);

    const renderElements = useMemo(() => {
        let elements = activeElements;
        if (!isEditing && gameEngine) {
            const team = gameEngine.p1Team || [];
            const teamIds = team.map((c: any) => c?.data?.id).filter((id): id is string => typeof id === "string");
            const activeId = gameEngine.player1?.data?.id || "";
            const currentIdx = gameEngine.p1ActiveIdx ?? 0;

            const getBaseName = (id: string) => {
                const lower = (id || "").toLowerCase();
                if (lower.includes('goku_black')) return 'goku_black';
                if (lower.includes('gogeta')) return 'gogeta';
                if (lower.includes('goku')) return 'goku';
                if (lower.includes('vegeta')) return 'vegeta';
                return lower;
            };

            const canTransform = (id: string): boolean => {
                const lower = (id || "").toLowerCase();
                if (lower.includes('goku_black')) return false;
                return lower.includes('goku') || lower.includes('vegeta') || lower.includes('gogeta');
            };

            const activeBaseName = getBaseName(activeId);
            const sameCharacterCount = teamIds.filter((id: string) => getBaseName(id) === activeBaseName).length;

            // Standby companions indices
            const standbyIndices: number[] = [];
            for (let i = 0; i < team.length; i++) {
                if (i !== currentIdx) standbyIndices.push(i);
            }

            const aliveStandbyCount = standbyIndices.filter(idx => team[idx] && team[idx].hp > 0).length;

            elements = activeElements.filter((el) => {
                if (el.id === "transform") {
                    // Hide transform button if the active character cannot transform, or sameCharacterCount > 1
                    return canTransform(activeId) && sameCharacterCount <= 1;
                }
                if (el.id === "tag") {
                    // Hide tag button if there is no other alive team member to swap with
                    return aliveStandbyCount >= 1;
                }
                if (el.id === "assist1") {
                    // Hide assist1 button if there's no first standby companion or if they are dead
                    if (standbyIndices.length < 1) return false;
                    const companion = team[standbyIndices[0]];
                    return companion && companion.hp > 0;
                }
                if (el.id === "assist2") {
                    // Hide assist2 button if there's no second standby companion or if they are dead
                    if (standbyIndices.length < 2) return false;
                    const companion = team[standbyIndices[1]];
                    return companion && companion.hp > 0;
                }
                return true;
            });
        }
        return elements;
    }, [isEditing, activeElements, gameEngine, p1ActiveId, gameEngine?.p1ActiveIdx, teamStatusKey]);

    // Editor State
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [invalidId, setInvalidId] = useState<string | null>(null);
    const pointerData = useRef<Record<number, { x: number; y: number }>>({});

    const handlePointerDown = (
      e: React.PointerEvent,
      id: string,
      type: "drag" | "resize" | "rotate",
    ) => {
      if (!isEditing) {
        if (
          type === "drag" &&
          id !== "dpad" &&
          id !== "transform" &&
          id !== "special" &&
          inputManager
        ) {
          // Button Press
          (e.target as Element).setPointerCapture(e.pointerId);
          inputManager.setInput(id as InputAction, true);
          AudioManager.getInstance().playSFX("click");
          setPressedButtons((prev) => ({ ...prev, [id]: true }));
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);

      pointerData.current[e.pointerId] = { x: e.clientX, y: e.clientY };

      if (type === "drag") setDraggingId(id);
      if (type === "resize") setResizingId(id);
      if (type === "rotate") setRotatingId(id);
      setInvalidId(null);
    };

    const handlePointerUp = (e: React.PointerEvent, id: string) => {
      if (!isEditing) {
        if (id !== "dpad" && id !== "transform" && id !== "special" && inputManager) {
          (e.target as Element).releasePointerCapture(e.pointerId);
          inputManager.setInput(id as InputAction, false);
          setPressedButtons((prev) => ({ ...prev, [id]: false }));
        }
        return;
      }

      (e.target as Element).releasePointerCapture(e.pointerId);
      delete pointerData.current[e.pointerId];

      setDraggingId(null);
      setResizingId(null);
      setRotatingId(null);
      setInvalidId(null);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isEditing) return;
      if (!draggingId && !resizingId && !rotatingId) return;

      const container = containerRef.current;
      if (!container) return;

      const lastPointer = pointerData.current[e.pointerId];
      if (!lastPointer) return;

      const rect = container.getBoundingClientRect();
      const activeId = draggingId || resizingId || rotatingId;
      const currentEl = activeElements.find((el) => el.id === activeId);
      if (!currentEl) return;

      const movementX = e.clientX - lastPointer.x;
      const movementY = e.clientY - lastPointer.y;

      // Update last pointer
      pointerData.current[e.pointerId] = { x: e.clientX, y: e.clientY };

      // Relative deltas
      const dx = movementX / rect.width;
      const dy = movementY / rect.height;

      let nextEl = { ...currentEl };

      if (draggingId) {
        nextEl.x = Math.max(0, Math.min(nextEl.x + dx, 1 - nextEl.width));
        nextEl.y = Math.max(0, Math.min(nextEl.y + dy, 1 - nextEl.height));
      } else if (resizingId) {
        const minWidth = 0.05,
          maxWidth = 0.4;
        const minHeight = 0.05,
          maxHeight = 0.4;

        let newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, nextEl.width + dx),
        );
        let newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, nextEl.height + dy),
        );

        if (maintainAspectRatio) {
          const ratio = currentEl.width / currentEl.height;
          const avgDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          newWidth = Math.max(
            minWidth,
            Math.min(maxWidth, nextEl.width + avgDelta),
          );
          newHeight = newWidth / ratio;
        }

        if (nextEl.x + newWidth > 1) newWidth = 1 - nextEl.x;
        if (nextEl.y + newHeight > 1) newHeight = 1 - nextEl.y;

        nextEl.width = newWidth;
        nextEl.height = newHeight;
      } else if (rotatingId) {
        nextEl.rotation = (nextEl.rotation + (movementY + movementX)) % 360;
      }

      const nextElements = activeElements.map((el) =>
        el.id === activeId ? nextEl : el,
      );

      if (onLayoutUpdate) {
        onLayoutUpdate(nextElements);
      } else {
        setLocalElements(nextElements);
      }
    };

    const activeRadialElement = openRadial ? activeElements.find(e => e.id === openRadial) : null;
    const isOverlappedByRadial = (el: HudElement) => {
       if (!activeRadialElement) return false;
       if (el.id === openRadial) return false;
       if (!containerRef.current) return false;
       
       const widthPx = containerRef.current.clientWidth;
       const heightPx = containerRef.current.clientHeight;

       const c1x = (activeRadialElement.x + activeRadialElement.width / 2) * widthPx;
       const c1y = (activeRadialElement.y + activeRadialElement.height / 2) * heightPx;
       
       // Radial menu is 320x320 unconditionally, but give it 340x340 AABB for safety
       const rLeft = c1x - 170;
       const rRight = c1x + 170;
       const rTop = c1y - 170;
       const rBottom = c1y + 170;

       const elLeft = el.x * widthPx;
       const elRight = (el.x + el.width) * widthPx;
       const elTop = el.y * heightPx;
       const elBottom = (el.y + el.height) * heightPx;

       // AABB overlap check
       return !(
         elLeft > rRight ||
         elRight < rLeft ||
         elTop > rBottom ||
         elBottom < rTop
       );
    };

    const hasAnySpecial = useMemo(() => {
      const keys = Object.keys(gameEngine?.player1?.data?.spriteConfig?.animations || {});
      return keys.some((k) => {
        const u = k.toUpperCase();
        return u.includes("SPECIAL") || u.includes("ESPECIAL") || u.includes("ULT") || u.includes("SPC") || u.includes("ATTACK");
      });
    }, [p1ActiveId, gameEngine?.player1]);

    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 z-50 overflow-hidden text-white touch-none select-none cq-container transition-opacity duration-300 ${hidden ? 'opacity-0 pointer-events-none' : ''}`}
        style={{
          opacity: hidden ? 0 : (isEditing ? 1 : (settings.hudLayout?.opacity ?? 0.8)),
          pointerEvents: (hidden || !isEditing) ? "none" : "auto", // only interactive to elements
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          setDraggingId(null);
          setResizingId(null);
          setRotatingId(null);
        }}
      >
        {renderElements.map((el, i) => {
          if (!isEditing && el.id === "special" && !hasAnySpecial) {
             return null;
          }

          const isActive =
            draggingId === el.id ||
            resizingId === el.id ||
            rotatingId === el.id;
          const isInvalid = invalidId === el.id;

          let classes = colorMap[el.id || "dpad"] || colorMap["dpad"];
          let opacityStyle: any = undefined;

          if (isEditing) {
            classes = `border-2 border-dashed ${isInvalid ? "border-red-500 bg-red-500/20" : "border-green-500 bg-green-500/10"} backdrop-blur-sm`;
            if (isActive) classes += " opacity-70";
          } else {
            const isPressed = !!pressedButtons[el.id];
            const pressedClass = isPressed ? "scale-90 opacity-95 brightness-110" : "scale-100 opacity-80 hover:opacity-100 active:scale-90";
            classes = `rounded-full transition-all duration-100 ${pressedClass} ${hidden ? 'pointer-events-none' : 'pointer-events-auto'} flex items-center justify-center`;
            if (openRadial && isOverlappedByRadial(el)) {
                classes += ` pointer-events-none`;
                opacityStyle = { opacity: 0 };
            }
          }

          const anchorX = el.x < 0.35 ? 'left' : el.x > 0.65 ? 'right' : 'center';
          const pos = getPos(el.x * 1280, el.y * 720, anchorX as any);
          const elementWidth = s(el.width * 1280);
          const elementHeight = s(el.height * 720);

          return (
            <div
              key={`${el.id || "fallback"}-${i}`}
              className={`absolute flex items-center justify-center select-none [-webkit-touch-callout:none] [-webkit-user-select:none] [-webkit-user-drag:none] ${classes} ${isEditing ? "cursor-move" : ""}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: (isEditing || el.id === 'dpad') ? `${elementWidth}px` : 'auto',
                height: `${elementHeight}px`,
                aspectRatio: (isEditing || el.id === 'dpad') ? undefined : '1 / 1',
                transform: `rotate(${el.rotation}deg)`,
                transition: isEditing && !isActive ? "all 0.1s ease-out" : "origin 0s, left 0s, top 0s, width 0s, height 0s, transform 0s, opacity 0.2s ease-out",
                ...opacityStyle
              }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false; }}
              onPointerDown={(e) => handlePointerDown(e, el.id, "drag")}
              onPointerUp={(e) => handlePointerUp(e, el.id)}
              onPointerLeave={(e) => !isEditing && handlePointerUp(e, el.id)}
              onPointerCancel={(e) => !isEditing && handlePointerUp(e, el.id)}
              onPointerOut={(e) => !isEditing && handlePointerUp(e, el.id)}
            >
              {/* Render Icon or Thumbstick */}
              {el.id === "dpad" && !isEditing ? (
                <GamepadThumbstick inputManager={inputManager} />
              ) : el.id === "transform" && !isEditing ? (
                <RadialTransformButton inputManager={inputManager} delayMs={(settings?.radialMenuDelay ?? 0.3) * 1000} instantRadialMenu={!!settings?.instantRadialMenu} onOpenChange={(open) => setOpenRadial(open ? el.id : null)} hidden={hidden} />
              ) : el.id === "special" && !isEditing ? (
                <RadialSkillsButton inputManager={inputManager} delayMs={(settings?.radialMenuDelay ?? 0.3) * 1000} instantRadialMenu={!!settings?.instantRadialMenu} onOpenChange={(open) => setOpenRadial(open ? el.id : null)} hidden={hidden} />
              ) : (
                <div className="pointer-events-none relative z-10 w-full h-[85%] flex items-center justify-center">
                  {!isEditing ? (
                    (() => {
                      const PS_BASE = "/Assets/ui/playstation/";
                      const isPressed = !!pressedButtons[el.id];
                      let src = "";
                      let altText = el.id || "button";
                      let customFilter = "";
                      let customBlurColor = "bg-blue-500 ";

                      if (el.id === "light") {
                        src = isPressed ? `${PS_BASE}playstation_button_square.png` : `${PS_BASE}playstation_button_square_outline.png`;
                        altText = "Square";
                        customBlurColor = "bg-pink-500 ";
                      } else if (el.id === "medium") {
                        src = isPressed ? `${PS_BASE}playstation_button_triangle.png` : `${PS_BASE}playstation_button_triangle_outline.png`;
                        altText = "Triangle";
                        customBlurColor = "bg-emerald-500 ";
                      } else if (el.id === "heavy") {
                        src = `${PS_BASE}playstation_button_circle_outline.png`;
                        altText = "Circle";
                        customBlurColor = "bg-rose-500 ";
                        if (isPressed) {
                          customFilter = "brightness-[1.2] saturate-[1.6] contrast-[1.1] drop-";
                        }
                      } else if (el.id === "kiblast") {
                        src = isPressed ? `${PS_BASE}playstation_button_cross.png` : `${PS_BASE}playstation_button_cross_outline.png`;
                        altText = "Cross";
                        customBlurColor = "bg-blue-500 ";
                      } else if (el.id === "block") {
                        src = isPressed ? `${PS_BASE}playstation_button_l3.png` : `${PS_BASE}playstation_button_l3_outline.png`;
                        altText = "L3";
                        customBlurColor = "bg-sky-500 ";
                      } else if (el.id === "dash") {
                        src = isPressed ? `${PS_BASE}playstation_button_r3.png` : `${PS_BASE}playstation_button_r3_outline.png`;
                        altText = "R3";
                        customBlurColor = "bg-purple-500 ";
                      } else if (el.id === "charge") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_press.png` : `${PS_BASE}playstation4_touchpad_outline.png`;
                        altText = "Touchpad";
                        customBlurColor = "bg-lime-500 ";
                      } else if (el.id === "tag") {
                        src = isPressed ? `${PS_BASE}playstation4_button_share.png` : `${PS_BASE}playstation4_button_share_outline.png`;
                        altText = "Share";
                        customBlurColor = "bg-orange-500 ";
                      } else if (el.id === "assist1") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_press_left.png` : `${PS_BASE}playstation4_touchpad_touch_outline.png`;
                        altText = "Touchpad Left";
                        customBlurColor = "bg-indigo-500 ";
                      } else if (el.id === "assist2") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_press_right.png` : `${PS_BASE}playstation4_touchpad_touch_outline.png`;
                        altText = "Touchpad Right";
                        customBlurColor = "bg-cyan-500 ";
                      } else if (el.id === "vanish") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_touch.png` : `${PS_BASE}playstation4_touchpad_swipe_horizontal.png`;
                        altText = "Vanish";
                        customBlurColor = "bg-teal-500 ";
                      } else if (el.id === "dragonRush") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_swipe_up.png` : `${PS_BASE}playstation4_touchpad_swipe_vertical.png`;
                        altText = "Dragon Rush";
                        customBlurColor = "bg-amber-500 ";
                      } else if (el.id === "ultimate") {
                        src = isPressed ? `${PS_BASE}playstation4_touchpad_press_center.png` : `${PS_BASE}playstation4_touchpad_touch_outline.png`;
                        altText = "Ultimate";
                        customBlurColor = "bg-red-500 ";
                      } else {
                        // fallback
                        return iconMap[el.id] || null;
                      }

                      return (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <img 
                            draggable={false} 
                            src={src} 
                            className={`w-full h-full object-contain pointer-events-none select-none filter drop-shadow-md transition-all duration-75 ${customFilter}`} 
                            referrerPolicy="no-referrer"
                            alt={altText} 
                          />
                          {/* Label help */}
                          {["block", "dash", "charge", "tag", "assist1", "assist2", "vanish", "dragonRush", "ultimate"].includes(el.id) && (
                            <span className="absolute bottom-[2%] left-1/2 -translate-x-1/2 text-[1.4vmin] uppercase font-bold text-white tracking-wider bg-black/40 px-[0.6vmin] py-[0.15vmin] rounded-sm filter drop-shadow font-sans backdrop-blur-[1px] select-none pointer-events-none">
                              {el.id === "block" ? "BLOCK" :
                               el.id === "dash" ? "DASH" :
                               el.id === "charge" ? "CHARGE" :
                               el.id === "tag" ? "TAG / SWITCH" :
                               el.id === "assist1" ? "ASSIST 1" :
                               el.id === "assist2" ? "ASSIST 2" :
                               el.id === "vanish" ? "VANISH" :
                               el.id === "dragonRush" ? "DRG RUSH" :
                               el.id === "ultimate" ? "ULTIMATE" : el.id}
                            </span>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-black/30 border border-white/25 rounded-md">
                       <span className="text-white text-xs font-bold font-mono tracking-wide">{el.id}</span>
                    </div>
                  )}
                  {el.id === "heavy" && !isEditing && p1HeavyCooldown && p1HeavyCooldown > 0 ? (
                    <div className="absolute w-[60%] h-[60%] top-[20%] left-[20%] z-20 bg-black/60 rounded-full flex flex-col items-center justify-center">
                        <div className="text-white text-xs font-bold leading-none">{Math.ceil(p1HeavyCooldown / 60)}</div>
                    </div>
                  ) : el.id === "dash" && !isEditing && p1DashCooldown && p1DashCooldown > 0 ? (
                    <div className="absolute w-[60%] h-[60%] top-[20%] left-[20%] z-20 bg-black/60 rounded-full flex flex-col items-center justify-center">
                        <div className="text-white text-xs font-bold leading-none">{Math.ceil(p1DashCooldown / 60)}</div>
                    </div>
                  ) : el.id === "kiblast" && !isEditing && p1ProjectileCooldown && p1ProjectileCooldown > 0 ? (
                    <div className="absolute w-[60%] h-[60%] top-[20%] left-[20%] z-20 bg-black/60 rounded-full flex flex-col items-center justify-center">
                        <div className="text-white text-xs font-bold leading-none">{Math.ceil(p1ProjectileCooldown / 60)}</div>
                    </div>
                  ) : el.id === "dragonRush" && !isEditing && p1DragonRushCooldown && p1DragonRushCooldown > 0 ? (
                    <div className="absolute w-[60%] h-[60%] top-[20%] left-[20%] z-20 bg-black/60 rounded-full flex flex-col items-center justify-center">
                        <div className="text-white text-xs font-bold leading-none">{Math.ceil(p1DragonRushCooldown / 60)}</div>
                    </div>
                  ) : (el.id === "tag" || el.id === "assist1" || el.id === "assist2") && !isEditing && assistCooldown && assistCooldown > 0 ? (
                    <div className="absolute w-[60%] h-[60%] top-[20%] left-[20%] z-20 bg-black/60 rounded-full flex flex-col items-center justify-center">
                        <div className="text-white text-xs font-bold leading-none">{Math.ceil(assistCooldown / 60)}</div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Editor Handles */}
              {isEditing && (
                <>
                  {/* Resize Handle */}
                  <div
                    className="absolute -bottom-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-nwse-resize shadow-lg border-2 border-white pointer-events-auto hover:bg-blue-400 active:scale-90"
                    onPointerDown={(e) => handlePointerDown(e, el.id, "resize")}
                  >
                    <Maximize2 size={16} className="text-white" />
                  </div>
                  {/* Rotate Handle */}
                  <div
                    className="absolute -top-3 -right-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-crosshair shadow-lg border-2 border-white pointer-events-auto hover:bg-purple-400 active:scale-90"
                    onPointerDown={(e) => handlePointerDown(e, el.id, "rotate")}
                  >
                    <RotateCw size={16} className="text-white" />
                  </div>
                  {/* Label */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white/80 uppercase pointer-events-none whitespace-nowrap">
                    {el.id}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);
