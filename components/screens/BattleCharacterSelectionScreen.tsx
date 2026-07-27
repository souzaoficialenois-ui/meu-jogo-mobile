import React, { useState, useMemo, useEffect } from "react";
import { useSceneManager } from "../../contexts/SceneContext";
import { SceneName, CharacterData, PlayerState } from "../../types";
import {
  BASE_CHARACTERS,
  RARITY_INFO,
  BASE_ROSTER_IDS,
  CHARACTER_FAMILIES
} from "../../constants";
import { getCharacterAssistSkills } from "../../constants/AssistSkills";
import { AudioManager } from "../../services/AudioManager";
import { motion, AnimatePresence } from "framer-motion";
import { LocalMultiplayerManager } from "../../services/LocalMultiplayerManager";
import { SpriteRenderer } from "../../services/SpriteRenderer";
import { SummonManager } from "../../services/SummonManager";
import { CharacterPreview } from "../CharacterPreview";
import { useUI } from "../../contexts/UIContext";
import { KiParticles } from "../KiParticles";
import {
  ChevronLeft,
  Sword,
  Zap,
  Lock,
  Cpu,
  ChevronRight,
  Shield,
  Activity,
  Users,
  RefreshCcw,
  Wand2,
} from "lucide-react";

export const BattleCharacterSelectionScreen: React.FC<{
  overrideMaxSelection?: number;
  onConfirmSelection?: (team: CharacterData[]) => void;
  onTeamChange?: (teamIds: string[]) => void;
  onBack?: () => void;
  isMultiplayer?: boolean;
}> = ({ overrideMaxSelection, onConfirmSelection, onTeamChange, onBack, isMultiplayer }) => {
  const {
    changeScene,
    completeCharacterSelection,
    unlockedCharacters,
    coins,
    p1TeamSize,
    p2TeamSize,
    selectionMode,
    settings,
    equippedSkins: rawEquippedSkins,
  } = useSceneManager();
  const equippedSkins = rawEquippedSkins || {};
  const { s, sx, sy, getPos } = useUI();
  const p1Col = settings.p1Color || "rose";
  const p2Col = settings.p2Color || "cyan";

  const [p1TeamIds, setP1TeamIds] = useState<string[]>([]);
  const [p2TeamIds, setP2TeamIds] = useState<string[]>([]);

  useEffect(() => {
    if (onTeamChange) {
      onTeamChange(p1TeamIds);
    }
  }, [p1TeamIds, onTeamChange]);
  const [assistSelections, setAssistSelections] = useState<
    Record<string, import("../../types").AssistType>
  >({});
  const [selectingFor, setSelectingFor] = useState<"P1" | "P2">("P1");
  const [previewCharId, setPreviewCharId] = useState<string | null>(null);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [selectedSkinId, setSelectedSkinId] = useState<Record<string, string>>({});
  const [p1TeamSkinIds, setP1TeamSkinIds] = useState<string[]>([]);
  const [p2TeamSkinIds, setP2TeamSkinIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (p1TeamIds.length < p1TeamSize && selectingFor !== "P1") {
      setSelectingFor("P1");
    }
  }, [p1TeamIds.length, p1TeamSize, selectingFor]);

  const actualP2TeamSize =
    isMultiplayer || selectionMode === "TOURNAMENT"
      ? 0
      : selectionMode === "BOSS"
        ? 1
        : selectionMode === "TRAINING"
          ? p1TeamSize
          : p2TeamSize;

  const roster = useMemo(() => {
    return BASE_CHARACTERS.map((base) => {
      const unlocked = unlockedCharacters.find((u) => u.id === base.id);
      const isLocked =
        selectionMode === "TRAINING"
          ? false
          : base.id === "random"
          ? false
          : !unlocked;
      return { ...base, isLocked };
    });
  }, [unlockedCharacters, selectionMode]);

  const currentTeam = selectingFor === "P1" ? p1TeamIds : p2TeamIds;
  const currentMax =
    overrideMaxSelection ??
    (selectingFor === "P1" ? p1TeamSize : actualP2TeamSize);

  const firstAvailableForCurrent = roster.find(
    (c) =>
      BASE_ROSTER_IDS.includes(c.id) &&
      !c.isLocked &&
      (c.id === "random" || !currentTeam.includes(c.id)),
  )?.id;

  const resolveSkinForCharacter = (char: CharacterData, skinId: string) => {
    let baseChar = { ...char };
    if (!skinId) return baseChar;
    
    // Check character's internal skins
    const skin = char.skins?.find(s => s.id === skinId);
    if (skin) {
      // Skin found, additional logic like sprite overrides could go here
    } else {
      // Check global GACHA_ITEMS (skins no longer in gacha items)
      // We keep the logic but it won't find anything in the current pool
      const gachaSkin = SummonManager.GACHA_ITEMS.find(i => i.id === skinId);
      if (gachaSkin && (gachaSkin as any).category === 'Skin') {
        // Gacha skin found
      }
    }
    return baseChar;
  };

  const activePreviewId =
    previewCharId || firstAvailableForCurrent || BASE_ROSTER_IDS[0];

  const activePreviewChar = useMemo(() => {
    const char = roster.find((c) => c.id === activePreviewId);
    if (!char) return roster[0];
    
    const skinId = selectedSkinId[activePreviewId] || equippedSkins[activePreviewId];
    const baseChar = resolveSkinForCharacter(char, skinId);

    return {
      ...baseChar,
      assistType: assistSelections[`${selectingFor}_${activePreviewId}`] || "SPECIAL",
    };
  }, [roster, activePreviewId, assistSelections, selectingFor, selectedSkinId, equippedSkins]);

  const cycleSkin = (direction: number) => {
    if (activePreviewChar.skins && activePreviewChar.skins.length > 0) {
      const skins = activePreviewChar.skins;
      const currentSkinId = selectedSkinId[activePreviewId] || (equippedSkins ? equippedSkins[activePreviewId] : null) || skins[0].id;
      const currentIdx = skins.findIndex(s => s.id === currentSkinId);
      let nextIdx = (currentIdx + direction) % skins.length;
      if (nextIdx < 0) nextIdx = skins.length - 1;
      
      setSelectedSkinId(prev => ({
        ...prev,
        [activePreviewId]: skins[nextIdx].id
      }));
      AudioManager.getInstance().playSFX("click");
    }
  };

  const cycleAssist = (direction: number) => {
    const specials = getCharacterAssistSkills(activePreviewId);
    const types = specials.map((s) => s.id);
    const currentIdx = types.indexOf(activePreviewChar.assistType as any);
    let nextIdx = (currentIdx + direction) % types.length;
    if (nextIdx < 0) nextIdx = types.length - 1;

    setAssistSelections((prev) => ({
      ...prev,
      [`${selectingFor}_${activePreviewId}`]: types[nextIdx],
    }));
    AudioManager.getInstance().playSFX("click");
  };

  const handleCharClick = (
    charId: string,
    isLocked: boolean,
    baseId?: string,
  ) => {
    if (isLocked) {
      AudioManager.getInstance().playSFX("cancel");
      return;
    }

    if (previewCharId !== charId) {
      setPreviewCharId(charId);
      if (baseId) setActiveFamilyId(baseId);
      AudioManager.getInstance().playSFX("click");
    } else {
      handleConfirmChar();
    }
  };

  const handleConfirmChar = () => {
    if (
      !activePreviewChar ||
      activePreviewChar.isLocked ||
      (activePreviewChar.id !== "random" && currentTeam.includes(activePreviewChar.id)) ||
      currentTeam.length >= currentMax
    ) {
      AudioManager.getInstance().playSFX("cancel");
      return;
    }

    AudioManager.getInstance().playSFX("confirm");

    let confirmedCharId = activePreviewChar.id;
    if (confirmedCharId === "random") {
      const available = roster.filter(
        (c) =>
          !c.isLocked &&
          c.id !== "random" &&
          !currentTeam.includes(c.id)
      );
      if (available.length > 0) {
        const randChar = available[Math.floor(Math.random() * available.length)];
        confirmedCharId = randChar.id;
      } else {
        AudioManager.getInstance().playSFX("cancel");
        return;
      }
    }

    if (selectingFor === "P1") {
      const next = [...p1TeamIds, confirmedCharId];
      setP1TeamIds(next);
      const skinToUse = selectedSkinId[confirmedCharId] || (equippedSkins ? equippedSkins[confirmedCharId] : "") || "";
      setP1TeamSkinIds(prev => [...prev, skinToUse]);
      setPreviewCharId(null);

      if (next.length === currentMax) {
        if (isMultiplayer) {
          // Ready to start battle/confirm in multiplayer mode
        } else if (selectionMode === "SURVIVAL") {
          let p2Team: string[] = [];
          let available = roster.filter((c) => !c.isLocked && c.id !== "random" && !next.includes(c.id));
          if (available.length > 0) {
            for (let i = 0; i < actualP2TeamSize; i++) {
              const rChar =
                available[Math.floor(Math.random() * available.length)];
              p2Team.push(rChar.id);
            }
          } else {
            p2Team.push(roster.filter(c => c.id !== "random" && !c.isLocked)[0]?.id || roster[0].id);
          }
          const fullP1SkinIds = [...p1TeamSkinIds, skinToUse];
          const p1TeamData = next
            .map((id, index) => {
              const char = roster.find((c) => c.id === id)!;
              const skinId = fullP1SkinIds[index];
              const baseChar = resolveSkinForCharacter(char, skinId);
              return {
                ...baseChar,
                assistType: assistSelections[`P1_${id}`] || "SPECIAL",
              };
            })
            .filter(Boolean) as CharacterData[];
          const p2TeamData = p2Team
            .map((id) => {
              const char = roster.find((c) => c.id === id)!;
              const specials = getCharacterAssistSkills(id);
              const assistType = specials[Math.floor(Math.random() * specials.length)]?.id || "SPECIAL";
              return {
                ...char,
                assistType,
              };
            })
            .filter(Boolean) as CharacterData[];
          completeCharacterSelection(p1TeamData, p2TeamData);
        } else if (selectionMode === "BOSS") {
          const availableBosses = roster.filter((c) => !c.isLocked && c.id !== "random" && !next.includes(c.id));
          const bossChar =
            availableBosses.length > 0
              ? availableBosses[
                  Math.floor(Math.random() * availableBosses.length)
                ]
              : roster.filter(c => c.id !== "random" && !c.isLocked)[0] || roster[roster.length - 1];
          const fullP1SkinIds = [...p1TeamSkinIds, skinToUse];
          const p1TeamData = next
            .map((id, index) => {
              const char = roster.find((c) => c.id === id)!;
              const skinId = fullP1SkinIds[index];
              const baseChar = resolveSkinForCharacter(char, skinId);
              return {
                ...baseChar,
                assistType: assistSelections[`P1_${id}`] || "SPECIAL",
              };
            })
            .filter(Boolean) as CharacterData[];
          const p2TeamData = [
            {
              ...bossChar,
              assistType: "SPECIAL" as import("../../types").AssistType,
            },
          ];
          completeCharacterSelection(p1TeamData, p2TeamData);
        } else if (selectionMode === "TOURNAMENT") {
          // For Tournament, we ONLY pick P1 team. The CPU team is created by the tournament logic per match.
          const fullP1SkinIds = [...p1TeamSkinIds, skinToUse];
          const p1TeamData = next
            .map((id, index) => {
              const char = roster.find((c) => c.id === id)!;
              const skinId = fullP1SkinIds[index];
              const baseChar = resolveSkinForCharacter(char, skinId);
              return {
                ...baseChar,
                assistType: assistSelections[`P1_${id}`] || "SPECIAL",
              };
            })
            .filter(Boolean) as CharacterData[];
          completeCharacterSelection(p1TeamData, []);
        } else {
          setSelectingFor("P2");
        }
      }
    } else {
      const next = [...p2TeamIds, confirmedCharId];
      setP2TeamIds(next);
      const skinToUse = selectedSkinId[confirmedCharId] || (equippedSkins ? equippedSkins[confirmedCharId] : "") || "";
      setP2TeamSkinIds(prev => [...prev, skinToUse]);
      setPreviewCharId(null);
    }
  };

  const handleStartBattle = () => {
    if (selectingFor === "P1" && p1TeamIds.length < currentMax) {
      AudioManager.getInstance().playSFX("cancel");
      return;
    }
    if (selectingFor === "P2" && p2TeamIds.length < currentMax) {
      AudioManager.getInstance().playSFX("cancel");
      return;
    }

    AudioManager.getInstance().playSFX("confirm");
    const p1TeamData = p1TeamIds
      .map((id, index) => {
        const char = roster.find((c) => c.id === id)!;
        const skinId = p1TeamSkinIds[index];
        const baseChar = resolveSkinForCharacter(char, skinId);
        return {
          ...baseChar,
          assistType: assistSelections[`P1_${id}`] || "SPECIAL",
        };
      })
      .filter(Boolean) as CharacterData[];

    if (isMultiplayer && onConfirmSelection) {
      onConfirmSelection(p1TeamData);
      return;
    }

    if (selectionMode === "TOURNAMENT") {
      completeCharacterSelection(p1TeamData, []);
      return;
    }

    const p2TeamData = p2TeamIds
      .map((id, index) => {
        const char = roster.find((c) => c.id === id)!;
        const skinId = p2TeamSkinIds[index];
        const baseChar = resolveSkinForCharacter(char, skinId);
        return {
          ...baseChar,
          assistType: assistSelections[`P2_${id}`] || "SPECIAL",
        };
      })
      .filter(Boolean) as CharacterData[];
    completeCharacterSelection(p1TeamData, p2TeamData);
  };

  const handleResetTeam = () => {
    AudioManager.getInstance().playSFX("cancel");
    if (selectingFor === "P2") {
      if (p2TeamIds.length > 0) {
        setP2TeamIds([]);
      } else if (p1TeamIds.length > 0) {
        setP1TeamIds([]);
        setSelectingFor("P1");
      }
    } else {
      setP1TeamIds([]);
    }
    setPreviewCharId(null);
  };

  const flatSelectableList = useMemo(() => {
    const list: { id: string; baseId: string }[] = [];
    BASE_ROSTER_IDS.forEach(baseId => {
      const baseChar = roster.find(c => c.id === baseId);
      if (!baseChar) return;
      list.push({ id: baseId, baseId });
      
      // Removed dynamic expansion here to prevent grid jumping during scroll/selection
    });
    return list;
  }, [roster]);

  const moveCursor = (dir: 1 | -1) => {
    const currentId = activePreviewId;
    const idx = flatSelectableList.findIndex(item => item.id === currentId);
    if (idx === -1) return;
    let nextIdx = idx + dir;
    if (nextIdx < 0) nextIdx = flatSelectableList.length - 1;
    if (nextIdx >= flatSelectableList.length) nextIdx = 0;
    
    const nextItem = flatSelectableList[nextIdx];
    setPreviewCharId(nextItem.id);
    setActiveFamilyId(nextItem.baseId);
    AudioManager.getInstance().playSFX("click");
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // In LOCAL_VS mode, restrict keyboard inputs only to the player who owns the keyboard
      if (selectionMode === "LOCAL_VS") {
        const mapping = LocalMultiplayerManager.getInstance().getDeviceMapping();
        if (mapping) {
          const currentDevice = selectingFor === "P1" ? mapping.p1Device : mapping.p2Device;
          if (currentDevice !== "keyboard") return;
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        moveCursor(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        moveCursor(1);
      } else if (e.key.toLowerCase() === 'q' || e.key === '1') {
        e.preventDefault();
        cycleSkin(-1);
      } else if (e.key.toLowerCase() === 'e' || e.key === '2') {
        e.preventDefault();
        cycleSkin(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        cycleAssist(-1);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        cycleAssist(1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (currentTeam.length === currentMax) {
          handleStartBattle();
        } else {
          handleConfirmChar();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (currentTeam.length > 0) {
          handleResetTeam();
        } else if (onBack) {
          onBack();
        } else {
          if (selectionMode === "BOSS" || selectionMode === "SURVIVAL") {
            changeScene(SceneName.SINGLE_PLAYER_MENU);
          } else {
            changeScene(SceneName.TEAM_SIZE_SELECT);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Polling Gamepad Input
    let rafId: number;
    let lastGpActionTime = 0;
    const gpActionDelay = 220; // ms

    const pollGamepad = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gps = navigator.getGamepads();
        // Check either Player 1 or Player 2 gamepad depending on who is choosing
        let gp: Gamepad | null = null;
        if (selectionMode === "LOCAL_VS") {
          const mapping = LocalMultiplayerManager.getInstance().getDeviceMapping();
          if (mapping) {
            const currentDevice = selectingFor === "P1" ? mapping.p1Device : mapping.p2Device;
            if (currentDevice && currentDevice.startsWith("gamepad_")) {
              const gpIndex = parseInt(currentDevice.split("_")[1]);
              gp = gps[gpIndex];
            }
          }
        } else {
          gp = selectingFor === "P1" ? (gps[0] || gps[1]) : (gps[1] || gps[0]);
        }

        if (gp && gp.connected) {
          const now = performance.now();
          const axes = gp.axes;
          const btns = gp.buttons;
          const axisThreshold = 0.5;

          const leftPressed = (axes[0] < -axisThreshold) || (btns[14] && btns[14].pressed);
          const rightPressed = (axes[0] > axisThreshold) || (btns[15] && btns[15].pressed);
          const upPressed = (axes[1] < -axisThreshold) || (btns[12] && btns[12].pressed);
          const downPressed = (axes[1] > axisThreshold) || (btns[13] && btns[13].pressed);

          const confirmPressed = btns[0] && btns[0].pressed; // Button A
          const backPressed = btns[1] && btns[1].pressed; // Button B
          const cycleLeft = btns[4] && btns[4].pressed; // LB
          const cycleRight = btns[5] && btns[5].pressed; // RB

          if (now - lastGpActionTime > gpActionDelay) {
            if (leftPressed || upPressed) {
              moveCursor(-1);
              lastGpActionTime = now;
            } else if (rightPressed || downPressed) {
              moveCursor(1);
              lastGpActionTime = now;
            } else if (cycleLeft) {
              cycleAssist(-1);
              lastGpActionTime = now;
            } else if (cycleRight) {
              cycleAssist(1);
              lastGpActionTime = now;
            }
          }

          if (confirmPressed && (now - lastGpActionTime > gpActionDelay)) {
            lastGpActionTime = now;
            if (currentTeam.length === currentMax) {
              handleStartBattle();
            } else {
              handleConfirmChar();
            }
          } else if (backPressed && (now - lastGpActionTime > gpActionDelay)) {
            lastGpActionTime = now;
            if (currentTeam.length > 0) {
              handleResetTeam();
            } else if (onBack) {
              onBack();
            } else {
              if (selectionMode === "BOSS" || selectionMode === "SURVIVAL") {
                changeScene(SceneName.SINGLE_PLAYER_MENU);
              } else {
                changeScene(SceneName.TEAM_SIZE_SELECT);
              }
            }
          }
        }
      }
      rafId = requestAnimationFrame(pollGamepad);
    };

    rafId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(rafId);
    };
  }, [flatSelectableList, activePreviewId, currentTeam, currentMax, selectingFor]);

  const handleAutoSelect = () => {
    if (currentTeam.length >= currentMax) return;
    AudioManager.getInstance().playSFX("confirm");
    const available = roster.filter((c) => !c.isLocked && c.id !== "random");
    if (available.length === 0) return;

    if (selectingFor === "P1") {
      let current = [...p1TeamIds];
      let tries = 0;
      while (current.length < p1TeamSize && tries < 100) {
        const rChar = available[Math.floor(Math.random() * available.length)];
        if (!current.includes(rChar.id)) {
          current.push(rChar.id);
        }
        tries++;
      }
      setP1TeamIds(current);
    } else {
      let current = [...p2TeamIds];
      let tries = 0;
      while (current.length < actualP2TeamSize && tries < 100) {
        const rChar = available[Math.floor(Math.random() * available.length)];
        if (!current.includes(rChar.id)) {
          current.push(rChar.id);
        }
        tries++;
      }
      setP2TeamIds(current);
    }
  };

  const handleRemoveChar = (charId: string, player: "P1" | "P2") => {
    AudioManager.getInstance().playSFX("cancel");
    if (player === "P1") {
      const idx = p1TeamIds.indexOf(charId);
      if (idx !== -1) {
        setP1TeamIds((prev) => prev.filter((_, i) => i !== idx));
        setP1TeamSkinIds((prev) => prev.filter((_, i) => i !== idx));
      }
    } else {
      const idx = p2TeamIds.indexOf(charId);
      if (idx !== -1) {
        setP2TeamIds((prev) => prev.filter((_, i) => i !== idx));
        setP2TeamSkinIds((prev) => prev.filter((_, i) => i !== idx));
      }
    }
    setPreviewCharId(null);
  };

  const canSelect =
    activePreviewChar &&
    !activePreviewChar.isLocked &&
    (activePreviewChar.id === "random" || !currentTeam.includes(activePreviewChar.id)) &&
    currentTeam.length < currentMax;

  // Visual helper mapping for Tailwind color classes to ensure they work reliably
  const p1Colors = {
    bgGlow: "from-rose-600/20 to-red-600/5",
    border: "border-rose-500",
    text: "text-rose-400",
    glow: "shadow-rose-500/30",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    btn: "bg-rose-600 hover:bg-rose-500 text-white",
  };

  const p2Colors = {
    bgGlow: "from-cyan-600/20 to-blue-600/5",
    border: "border-cyan-500",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/30",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    btn: "bg-cyan-600 hover:bg-cyan-500 text-white",
  };

  const currentTheme = selectingFor === "P1" ? p1Colors : p2Colors;

  const renderVisualPreview = (player: "P1" | "P2") => {
    if (!activePreviewChar) return null;
    return (
      <motion.div
        key={`visual-preview-${player}-${activePreviewChar.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="flex-grow flex flex-col h-full overflow-hidden"
      >
        {/* Header with back button */}
        <div 
          className="flex items-center justify-between border-b border-white/5 shrink-0"
          style={{ marginBottom: s(8), paddingBottom: s(8) }}
        >
          <span className="font-bold text-stone-500 uppercase tracking-widest" style={{ fontSize: s(10) }}>
            {settings.language.startsWith('en') ? "CHARACTER PREVIEW" : "VISUALIZAÇÃO"}
          </span>
          <button
            onClick={() => {
              setPreviewCharId(null);
              AudioManager.getInstance().playSFX("cancel");
            }}
            className="text-stone-400 hover:text-white font-black uppercase tracking-widest flex items-center bg-stone-900/50 hover:bg-stone-800 rounded-lg border border-stone-800 transition-all cursor-pointer"
            style={{ fontSize: s(9), gap: s(4), padding: `${s(4)}px ${s(8)}px` }}
          >
            ✕ {settings.language.startsWith('en') ? "CLOSE" : "FECHAR"}
          </button>
        </div>

        {/* Large/Entire character body portrait with premium card border */}
        <div 
          className="relative flex-1 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 flex items-center justify-center shadow-inner group"
          style={{ marginBottom: s(12) }}
        >
          <div className="absolute inset-0">
            <CharacterPreview 
              character={activePreviewChar} 
              facingRight={player === "P1"}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent pointer-events-none" />
          <span 
            className={`absolute rounded font-black uppercase tracking-wider ${RARITY_INFO[activePreviewChar.rarity]?.bg || "bg-stone-800"} text-white z-10`}
            style={{ bottom: s(8), left: s(8), padding: `${s(2)}px ${s(8)}px`, fontSize: s(8) }}
          >
            {settings.language.startsWith('en') ? activePreviewChar.rarity : (activePreviewChar.rarity === 'COMMON' ? 'COMUM' : activePreviewChar.rarity === 'RARE' ? 'RARO' : activePreviewChar.rarity === 'EPIC' ? 'ÉPICO' : 'LENDÁRIO')}
          </span>
        </div>

        {/* Character name and family title */}
        <div className="shrink-0" style={{ marginBottom: s(8) }}>
          <h4 className="font-black italic text-white uppercase tracking-wider leading-none mb-1" style={{ fontSize: s(18) }}>
            {activePreviewChar.name}
          </h4>
        </div>

        {/* Skin Selector */}
        {activePreviewChar.skins && activePreviewChar.skins.length > 0 && (
          <div className="border-t border-white/5 shrink-0" style={{ paddingTop: s(8), marginBottom: s(12) }}>
            <span className="font-bold tracking-widest text-stone-500 uppercase block" style={{ fontSize: s(8), marginBottom: s(6) }}>
              {settings.language.startsWith('en') ? "OUTFITS & SKINS" : "ROUPAS & SKINS"}
            </span>
            <div className="flex items-center justify-between bg-stone-900/40 rounded-xl border border-stone-800/60" style={{ padding: s(4) }}>
               <button 
                 onClick={(e) => { e.stopPropagation(); cycleSkin(-1); }}
                 className="hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-all cursor-pointer"
                 style={{ padding: s(4) }}
               >
                 <ChevronLeft size={s(16)} />
               </button>
               
               {(() => {
                 const currentSkinId = selectedSkinId[activePreviewId] || equippedSkins[activePreviewId] || activePreviewChar.skins[0].id;
                 const currentSkin = activePreviewChar.skins.find(s => s.id === currentSkinId) || activePreviewChar.skins[0];
                 
                 return (
                   <div className="flex flex-col items-center flex-1">
                      <span className="font-black text-white uppercase tracking-tight text-center" style={{ fontSize: s(10) }}>
                        {currentSkin.name}
                      </span>
                      <div className="flex mt-1" style={{ gap: s(4) }}>
                        {activePreviewChar.skins.map((s_skin) => (
                          <div 
                            key={s_skin.id}
                            className={`rounded-full transition-all ${
                              currentSkinId === s_skin.id 
                                ? "bg-yellow-500" 
                                : "bg-stone-700"
                            }`}
                            style={{ height: s(4), width: currentSkinId === s_skin.id ? s(12) : s(4) }}
                          />
                        ))}
                      </div>
                   </div>
                 );
               })()}

               <button 
                 onClick={(e) => { e.stopPropagation(); cycleSkin(1); }}
                 className="hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-all cursor-pointer"
                 style={{ padding: s(4) }}
               >
                 <ChevronRight size={s(16)} />
               </button>
            </div>
          </div>
        )}

        {/* Forms & Transformations Selector */}
        {activeFamilyId && CHARACTER_FAMILIES && CHARACTER_FAMILIES[activeFamilyId] && CHARACTER_FAMILIES[activeFamilyId].length > 0 && (
          <div className="border-t border-white/5 shrink-0" style={{ paddingTop: s(8) }}>
            <span className="font-bold tracking-widest text-stone-500 uppercase block" style={{ fontSize: s(8), marginBottom: s(6) }}>
              {settings.language.startsWith('en') ? "FORMS & TRANSFORMS" : "FORMAS & TRANSFORMAÇÕES"}
            </span>
            <div className="flex overflow-x-auto custom-scrollbar pb-1" style={{ gap: s(6) }}>
              {(() => {
                const baseChar = roster.find((c) => c.id === activeFamilyId);
                if (!baseChar) return null;
                const isSelected = previewCharId === baseChar.id || activePreviewId === baseChar.id;
                return (
                  <button
                    key={activeFamilyId}
                    onClick={() => {
                      setPreviewCharId(baseChar.id);
                      AudioManager.getInstance().playSFX("click");
                    }}
                    className={`rounded-lg overflow-hidden border transition-all duration-200 relative shrink-0 ${
                      isSelected ? "border-yellow-500 scale-105 shadow shadow-yellow-500/20" : "border-stone-800 hover:border-stone-600"
                    }`}
                    style={{ height: s(40), width: s(40) }}
                  >
                    <img src={baseChar.spriteConfig?.portraitUrl} className="w-full h-full object-cover object-[center_20%]" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-0 text-center" style={{ bottom: s(2) }}>
                      <span className="font-black uppercase text-stone-300 truncate block px-0.5" style={{ fontSize: s(5) }}>BASE</span>
                    </div>
                  </button>
                );
              })()}

              {CHARACTER_FAMILIES[activeFamilyId].map((transId) => {
                const tChar = roster.find((c) => c.id === transId);
                if (!tChar) return null;
                const isSelected = previewCharId === tChar.id;
                return (
                  <button
                    key={transId}
                    onClick={() => {
                      setPreviewCharId(tChar.id);
                      AudioManager.getInstance().playSFX("click");
                    }}
                    className={`rounded-lg overflow-hidden border transition-all duration-200 relative shrink-0 ${
                      isSelected ? "border-yellow-500 scale-105 shadow shadow-yellow-500/20" : "border-stone-800 hover:border-stone-600"
                    } ${tChar.isLocked ? "opacity-30 grayscale" : "opacity-90"}`}
                    style={{ height: s(40), width: s(40) }}
                  >
                    <img src={tChar.spriteConfig?.portraitUrl} className="w-full h-full object-cover object-[center_20%]" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-0 text-center" style={{ bottom: s(2) }}>
                      <span className="font-black uppercase text-stone-300 truncate block px-0.5" style={{ fontSize: s(5) }}>
                        {tChar.name.replace("Super Saiyan", "SSJ").replace("Mistic", "Mist")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderStatsPreview = (player: "P1" | "P2") => {
    const isP1 = player === "P1";
    const theme = isP1 ? p1Colors : p2Colors;
    
    if (!activePreviewChar) return null;
    
    const hpPercent = Math.min(100, Math.max(20, ((activePreviewChar.maxHp || 2000) / 5000) * 100));
    const attackPercent = Math.min(100, Math.max(20, (activePreviewChar.stats.attack / 20) * 100));
    const defensePercent = Math.min(100, Math.max(20, (activePreviewChar.stats.defense / 20) * 100));
    const speedPercent = Math.min(100, Math.max(20, (activePreviewChar.stats.speed / 20) * 100));

    return (
      <motion.div
        key={`stats-preview-${player}-${activePreviewChar.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="flex-grow flex flex-col h-full overflow-y-auto custom-scrollbar pr-1"
      >
        {/* Header with clear indicators */}
        <div 
          className="flex items-center bg-stone-900/30 rounded-xl border border-stone-850 shrink-0"
          style={{ gap: s(12), marginBottom: s(16), padding: s(10) }}
        >
          <div 
            className="rounded-lg overflow-hidden border border-stone-800 bg-stone-950 shrink-0"
            style={{ width: s(40), height: s(40) }}
          >
            <CharacterPreview 
              character={activePreviewChar} 
              facingRight={player === "P2"}
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-black italic text-white uppercase truncate" style={{ fontSize: s(14) }}>{activePreviewChar.name}</h4>
            <span className="font-bold tracking-widest text-stone-500 uppercase" style={{ fontSize: s(8) }}>
              {settings.language.startsWith('en') ? "CHARACTER SPECIFICATIONS" : "ESPECIFICAÇÕES DO HERÓI"}
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div 
          className="bg-stone-900/10 border border-stone-900/60 rounded-xl shrink-0"
          style={{ padding: s(12), marginBottom: s(16), gap: s(12) }}
        >
          {/* HP */}
          <div style={{ marginBottom: s(12) }}>
            <div className="flex justify-between font-bold text-stone-400 uppercase" style={{ fontSize: s(9), marginBottom: s(4) }}>
              <span>HP</span>
              <span className="text-white font-mono">{activePreviewChar.maxHp || 2000}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full overflow-hidden border border-white/5" style={{ height: s(6) }}>
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${hpPercent}%` }} />
            </div>
          </div>

          {/* ATK */}
          <div style={{ marginBottom: s(12) }}>
            <div className="flex justify-between font-bold text-stone-400 uppercase" style={{ fontSize: s(9), marginBottom: s(4) }}>
              <span>{settings.language.startsWith('en') ? "ATTACK" : "ATAQUE"}</span>
              <span className="text-white font-mono">{activePreviewChar.stats.attack}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full overflow-hidden border border-white/5" style={{ height: s(6) }}>
              <div className={`h-full ${theme.text.replace("text-", "bg-")} rounded-full transition-all duration-500`} style={{ width: `${attackPercent}%` }} />
            </div>
          </div>

          {/* DEF */}
          <div style={{ marginBottom: s(12) }}>
            <div className="flex justify-between font-bold text-stone-400 uppercase" style={{ fontSize: s(9), marginBottom: s(4) }}>
              <span>{settings.language.startsWith('en') ? "DEFENSE" : "DEFESA"}</span>
              <span className="text-white font-mono">{activePreviewChar.stats.defense}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full overflow-hidden border border-white/5" style={{ height: s(6) }}>
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${defensePercent}%` }} />
            </div>
          </div>

          {/* SPD */}
          <div>
            <div className="flex justify-between font-bold text-stone-400 uppercase" style={{ fontSize: s(9), marginBottom: s(4) }}>
              <span>{settings.language.startsWith('en') ? "SPEED" : "VELOCIDADE"}</span>
              <span className="text-white font-mono">{activePreviewChar.stats.speed}</span>
            </div>
            <div className="w-full bg-stone-900 rounded-full overflow-hidden border border-white/5" style={{ height: s(6) }}>
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${speedPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Support / Assist selector */}
        <div 
          className="bg-stone-900/40 border border-stone-850 rounded-xl flex flex-col shrink-0"
          style={{ padding: s(12), marginBottom: s(16), gap: s(8) }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-400 uppercase tracking-widest" style={{ fontSize: s(9) }}>
              {settings.language.startsWith('en') ? "ASSIST SKILL" : "HABILIDADE DE SUPORTE"}
            </span>
          </div>
          <div className="flex" style={{ gap: s(8) }}>
            {getCharacterAssistSkills(activePreviewChar.id).map((opt, idx) => {
              const isSel = (assistSelections[`${player}_${activePreviewChar.id}`] || "SPECIAL") === opt.id;
              return (
                <button
                  key={opt.id}
                  title={`${opt.name}: ${opt.description}`}
                  onClick={() => {
                    setAssistSelections((prev) => ({
                      ...prev,
                      [`${player}_${activePreviewChar.id}`]: opt.id,
                    }));
                    AudioManager.getInstance().playSFX("click");
                  }}
                  className={`flex-1 font-black uppercase transition-all border ${
                    isSel
                      ? isP1
                        ? "bg-rose-600 border-rose-500 text-white shadow shadow-rose-600/20"
                        : "bg-cyan-600 border-cyan-500 text-white shadow shadow-cyan-600/20"
                      : "bg-stone-850 border-stone-800 text-stone-400 hover:text-white"
                  }`}
                  style={{ padding: `${s(6)}px 0`, borderRadius: s(8), fontSize: s(9) }}
                >
                  {opt.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full h-full bg-stone-950 flex items-center justify-center overflow-hidden font-sans select-none text-stone-200 relative">
      {/* Dynamic Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img src="/Assets/Modos/sele%C3%A7%C3%A3o%20de%20modo%20fundo1.png" className="w-full h-full object-cover opacity-60 grayscale-[10%]" alt="" />
        <div className="absolute inset-0 bg-stone-950/30" />
        
        {/* Background character sprites for dynamic look */}
        <div className="absolute right-[-10%] top-[10%] opacity-40 scale-[1.5] blur-[1px]">
            <img src={BASE_CHARACTERS.find(c => c.id === 'goku_mui')?.spriteConfig?.animations?.[PlayerState.IDLE]?.imageUrl} className="h-[80vh] w-auto object-contain" alt="" />
        </div>
        <div className="absolute left-[-5%] bottom-[-5%] opacity-30 scale-[1.2] blur-[1px] grayscale">
            <img src={BASE_CHARACTERS.find(c => c.id === 'gogeta_ssj4')?.spriteConfig?.animations?.[PlayerState.IDLE]?.imageUrl} className="h-[70vh] w-auto object-contain" alt="" />
        </div>
      </div>

      <div className="w-full h-full relative overflow-hidden flex flex-col z-10">
        {/* Ki Particles */}
        <KiParticles color="orange" particleCount={30} speed={1.2} />

        {/* Futuristic Background Patterns and Ambient Glows */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] bg-rose-600/10 rounded-full blur-[160px]" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] bg-cyan-600/10 rounded-full blur-[160px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[40vw] bg-orange-600/[0.03] rounded-full blur-[180px]" />
        </div>

        {/* Character Portrait Background Watermark */}
        <AnimatePresence mode="wait">
          {activePreviewChar && activePreviewChar.id !== "random" && (
            <motion.div
              key={`bg-watermark-${activePreviewChar.id}`}
              initial={{ opacity: 0, scale: 1.1, x: selectingFor === "P1" ? -40 : 40 }}
              animate={{ opacity: 0.15, scale: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute inset-y-0 right-[20%] left-[20%] z-0 pointer-events-none flex items-center justify-center opacity-60 blur-[2px] grayscale mix-blend-luminosity"
            >
              <CharacterPreview 
                character={activePreviewChar} 
                facingRight={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- HIGH-TECH HEADER --- */}
        <header 
          className="relative w-full px-6 md:px-12 flex items-center justify-between z-50 bg-stone-950/60 border-b border-white/5 backdrop-blur-md pointer-events-auto shadow-2xl shrink-0"
          style={{ height: s(96) }}
        >
          <button
            onClick={() => {
              AudioManager.getInstance().playSFX("cancel");
              if (onBack) onBack();
              else {
                if (selectionMode === "BOSS" || selectionMode === "SURVIVAL") {
                  changeScene(SceneName.SINGLE_PLAYER_MENU);
                } else {
                  changeScene(SceneName.TEAM_SIZE_SELECT);
                }
              }
            }}
            className="rounded-xl border border-stone-800 flex items-center justify-center bg-stone-900/60 hover:border-orange-500 hover:bg-stone-800 text-stone-300 hover:text-white transition-all shadow-lg active:scale-95 group shrink-0 cursor-pointer"
            style={{ width: s(44), height: s(44) }}
          >
            <ChevronLeft size={s(20)} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Central Title Display */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-1" style={{ gap: s(16) }}>
              <div className="flex" style={{ marginLeft: s(8) }}>
                {p1TeamIds.map((id, idx) => {
                  const char = BASE_CHARACTERS.find(c => c.id === id);
                  return (
                    <img 
                      key={`p1-indicator-${id}-${idx}`} 
                      src={char?.spriteConfig?.portraitUrl || ""} 
                      alt="P1" 
                      className="rounded-full border-2 border-orange-500 bg-orange-950 object-cover shadow-lg" 
                      style={{ width: s(28), height: s(28), marginLeft: idx === 0 ? 0 : -s(8), zIndex: 10 - idx }}
                    />
                  );
                })}
                {Array.from({ length: Math.max(0, p1TeamSize - p1TeamIds.length) }).map((_, i) => (
                  <div 
                    key={`p1-empty-indicator-${i}`} 
                    className="rounded-full border-2 border-stone-800 bg-stone-900/60 flex items-center justify-center font-black text-stone-600"
                    style={{ width: s(28), height: s(28), marginLeft: (p1TeamIds.length === 0 && i === 0) ? 0 : -s(8), fontSize: s(10) }}
                  >?</div>
                ))}
              </div>

              <span className="rounded-full bg-orange-500 animate-pulse" style={{ width: s(6), height: s(6) }} />
              
              <div className="flex" style={{ marginLeft: s(8) }}>
                {p2TeamIds.map((id, idx) => {
                  const char = BASE_CHARACTERS.find(c => c.id === id);
                  return (
                    <img 
                      key={`p2-indicator-${id}-${idx}`} 
                      src={char?.spriteConfig?.portraitUrl || ""} 
                      alt="P2" 
                      className="rounded-full border-2 border-cyan-500 bg-cyan-950 object-cover shadow-lg" 
                      style={{ width: s(28), height: s(28), marginLeft: idx === 0 ? 0 : -s(8), zIndex: 10 - idx }}
                    />
                  );
                })}
                {Array.from({ length: Math.max(0, actualP2TeamSize - p2TeamIds.length) }).map((_, i) => (
                  <div 
                    key={`p2-empty-indicator-${i}`} 
                    className="rounded-full border-2 border-stone-800 bg-stone-900/60 flex items-center justify-center font-black text-stone-600"
                    style={{ width: s(28), height: s(28), marginLeft: (p2TeamIds.length === 0 && i === 0) ? 0 : -s(8), fontSize: s(10) }}
                  >?</div>
                ))}
              </div>
            </div>
            <h1 className="font-black italic uppercase tracking-wider text-white drop-shadow-lg flex items-center" style={{ fontSize: s(32), gap: s(12) }}>
              <span className="text-stone-500">{settings.language.startsWith('en') ? "SELECT" : "SELEÇÃO DE"}</span>
              <span className="text-orange-500">{settings.language.startsWith('en') ? "TEAMS" : "EQUIPES"}</span>
            </h1>
          </div>

          {/* Status Badge */}
          <div className="flex items-center shrink-0" style={{ gap: s(12) }}>
            <span 
              className="hidden md:inline font-bold text-stone-500 uppercase tracking-widest"
              style={{ fontSize: s(10) }}
            >
              {settings.language.startsWith('en') ? "STATUS" : "STATUS"}:
            </span>
            <div className={`px-4 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-wider ${currentTheme.badge} animate-pulse`}>
              {selectingFor === "P1" 
                ? (settings.language.startsWith('en') ? "P1 Choosing" : "P1 Escolhendo") 
                : (settings.language.startsWith('en') ? "P2 Choosing" : "P2 Escolhendo")}
            </div>
          </div>
        </header>

        {/* --- TRIPLE PANELS ARENA --- */}
        <div 
          className="flex-1 w-full flex overflow-hidden relative z-10"
          style={{ padding: s(16), gap: s(16) }}
        >
          
          {/* 1. LEFT SIDEBAR: TEAM 1 (P1) */}
          <section 
            className="bg-stone-950/70 border border-white/5 rounded-2xl flex flex-col backdrop-blur-md shadow-2xl relative overflow-hidden shrink-0"
            style={{ width: s(340), padding: s(16) }}
          >
            <div className="absolute top-0 left-0 bg-rose-500 rounded-r" style={{ width: s(4), height: s(48) }} />
            <AnimatePresence mode="wait">
              {previewCharId !== null ? (
                selectingFor === "P1" ? renderVisualPreview("P1") : renderStatsPreview("P2")
              ) : (
                <motion.div
                  key="p1-slots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-grow flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <div className="flex flex-col">
                      <span className="font-bold text-stone-500 uppercase tracking-widest" style={{ fontSize: s(10) }}>
                        {settings.language.startsWith('en') ? "Player 1" : "Jogador 1"}
                      </span>
                      <h3 className="font-black italic text-rose-500 tracking-wider" style={{ fontSize: s(16) }}>
                        {settings.language.startsWith('en') ? "ACTIVE TEAM" : "EQUIPE ATIVA"}
                      </h3>
                    </div>
                    <div 
                      className="bg-rose-500/10 rounded-lg border border-rose-500/20 font-mono font-black text-rose-400 flex items-center justify-center"
                      style={{ padding: `${s(4)}px ${s(10)}px`, fontSize: s(12) }}
                    >
                      {p1TeamIds.length}/{p1TeamSize}
                    </div>
                  </div>

                  {/* Team Slots */}
                  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1" style={{ gap: s(12) }}>
                    {Array.from({ length: p1TeamSize }).map((_, idx) => {
                      const charId = p1TeamIds[idx];
                      const char = charId ? roster.find((c) => c.id === charId) : null;
                      const isSlotSelected = charId && previewCharId === charId;

                      return (
                        <div
                          key={`slot-p1-${idx}`}
                          className={`relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col ${
                            char
                              ? isSlotSelected
                                ? "bg-rose-950/20 border-2 border-rose-500 shadow-lg shadow-rose-500/10"
                                : "bg-stone-900/40 border border-stone-800 hover:border-stone-700"
                              : "border border-dashed border-stone-800 bg-stone-950/30 flex items-center justify-center"
                          }`}
                          style={{ padding: s(10), minHeight: char ? 'auto' : s(96) }}
                        >
                          {char ? (
                            <div className="flex h-full relative group" style={{ gap: s(12) }}>
                              {/* Thumbnail */}
                              <div className="rounded-lg bg-stone-950 overflow-hidden border border-stone-700 shrink-0 relative" style={{ width: s(56), height: s(56) }}>
                                <img
                                  src={char.spriteConfig?.portraitUrl}
                                  className="w-full h-full object-cover object-[center_20%]"
                                  alt=""
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 flex flex-col justify-between overflow-hidden min-w-0">
                                <h4 className="font-black text-white truncate uppercase italic" style={{ fontSize: s(12) }}>{char.name}</h4>
                                
                                {/* Assist Direct Selector */}
                                <div className="flex items-center mt-1" style={{ gap: s(4) }}>
                                  <span className="text-stone-500 font-bold uppercase mr-1" style={{ fontSize: s(8) }}>Suporte:</span>
                                  {getCharacterAssistSkills(char.id).map((opt, idx) => {
                                    const isSel = (assistSelections[`P1_${char.id}`] || "SPECIAL") === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        title={`${opt.name}: ${opt.description}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setAssistSelections((prev) => ({
                                            ...prev,
                                            [`P1_${char.id}`]: opt.id,
                                          }));
                                          AudioManager.getInstance().playSFX("click");
                                        }}
                                        className={`rounded font-black flex items-center justify-center transition-all ${
                                          isSel
                                            ? "bg-rose-600 text-white shadow shadow-rose-600/30 font-bold scale-110"
                                            : "bg-stone-800 text-stone-400 hover:text-white"
                                        }`}
                                        style={{ width: s(20), height: s(20), fontSize: s(9) }}
                                      >
                                        {idx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Deselect Hover Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveChar(char.id, "P1");
                                }}
                                className="absolute rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                style={{ top: -s(4), right: -s(4), width: s(24), height: s(24) }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center opacity-40">
                              <span className="font-light text-rose-500/80 animate-pulse" style={{ fontSize: s(20) }}>+</span>
                              <span className="font-black tracking-widest text-stone-500 uppercase mt-1" style={{ fontSize: s(9) }}>
                                {settings.language.startsWith('en') ? "Empty Slot" : "Slot Vazio"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 2. CENTER STAGE: CHARACTER DETAIL & ROSTER GRID */}
          <main className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">

            {/* Symmetrical Character Grid Console */}
            <section className="flex-grow bg-stone-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-between overflow-hidden backdrop-blur-md shadow-2xl relative">
              
              {/* Clean Minimalist Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 shrink-0 flex-wrap gap-2">
                <div />
              </div>
              
              {/* Symmetrical Character Roster Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                <div className="grid grid-cols-4" style={{ gap: s(10) }}>
                  {BASE_ROSTER_IDS.map((baseId) => {
                    const baseChar = roster.find((c) => c.id === baseId);
                    if (!baseChar) return null;

                    // Determine which character to display in this grid slot (swapping to transformation when selected)
                    const isFamilyPreviewed = activeFamilyId === baseId && previewCharId;
                    const displayChar = isFamilyPreviewed
                      ? (roster.find((c) => c.id === previewCharId) || baseChar)
                      : baseChar;

                    const isPreview = previewCharId === displayChar.id || activePreviewId === displayChar.id;
                    const isSelectedByP1 = p1TeamIds.includes(displayChar.id);
                    const isSelectedByP2 = p2TeamIds.includes(displayChar.id);
                    const isSelectedByCurrent = displayChar.id !== "random" && currentTeam.includes(displayChar.id);

                    // Border & Highlight Colors
                    const highlightBorder =
                      selectingFor === "P1"
                        ? `border-rose-500 ring-rose-500/20 scale-105 ring-${s(2)}`
                        : `border-cyan-500 ring-cyan-500/20 scale-105 ring-${s(2)}`;

                    return (
                      <motion.button
                        key={baseChar.id}
                        onClick={() => handleCharClick(displayChar.id, !!displayChar.isLocked, baseId)}
                        className={`
                          relative aspect-[4/5] rounded-xl overflow-hidden transition-all duration-300 transform border bg-stone-900 group shrink-0
                          ${isPreview ? highlightBorder + " z-20" : "border-stone-800 hover:border-stone-600 z-10"}
                          ${displayChar.isLocked ? "opacity-35 grayscale" : "opacity-90 hover:opacity-100"}
                          ${isSelectedByCurrent ? "brightness-50" : ""}
                        `}
                      >
                        {displayChar.id === "random" ? (
                          <div className="w-full h-full bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950/30 flex flex-col items-center justify-center p-2">
                            <span className="text-orange-500 font-extrabold italic animate-pulse" style={{ fontSize: s(36) }}>?</span>
                            <span className="font-black uppercase text-stone-500 tracking-widest mt-1" style={{ fontSize: s(7) }}>
                              {settings.language.startsWith('en') ? "RANDOM" : "ALEATÓRIO"}
                            </span>
                          </div>
                        ) : (
                          <div className="relative w-full h-full overflow-hidden">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={displayChar.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="absolute inset-0 w-full h-full"
                              >
                                {/* Portrait */}
                                <img
                                  src={displayChar.spriteConfig?.portraitUrl}
                                  className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-110"
                                  style={{ imageRendering: "pixelated" }}
                                  alt=""
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                                
                                {/* Small Title */}
                                <div className="absolute inset-x-1 text-center" style={{ bottom: s(6) }}>
                                  <span className="font-black italic uppercase tracking-wider text-stone-300 drop-shadow-md group-hover:text-white truncate block" style={{ fontSize: s(9) }}>
                                    {displayChar.name.split(" ")[0]}
                                  </span>
                                </div>
                              </motion.div>
                            </AnimatePresence>

                            {/* Locked Indicator */}
                            {displayChar.isLocked && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                <Lock className="text-white/40" style={{ width: s(16), height: s(16) }} />
                              </div>
                            )}

                            {/* Selection Overlays */}
                            {isSelectedByP1 && (
                              <div 
                                className="absolute bg-rose-500 text-white font-black rounded shadow-lg z-10 flex items-center justify-center"
                                style={{ top: s(4), left: s(4), fontSize: s(8), padding: `${s(2)}px ${s(4)}px` }}
                              >
                                P1
                              </div>
                            )}
                            {isSelectedByP2 && (
                              <div 
                                className="absolute bg-cyan-500 text-black font-black rounded shadow-lg z-10 flex items-center justify-center"
                                style={{ top: s(4), right: s(4), fontSize: s(8), padding: `${s(2)}px ${s(4)}px` }}
                              >
                                P2
                              </div>
                            )}

                            {/* Current Team Selection Checkmark */}
                            {isSelectedByCurrent && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div 
                                  className={`rounded-full border-2 flex items-center justify-center font-black bg-stone-950 ${selectingFor === "P1" ? "text-rose-500 border-rose-500" : "text-cyan-500 border-cyan-500"}`}
                                  style={{ width: s(24), height: s(24), fontSize: s(14) }}
                                >
                                  ✓
                                  </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>

          {/* 3. RIGHT SIDEBAR: TEAM 2 (P2 / CPU / RIVAL) */}
          <section 
            className="bg-stone-950/70 border border-white/5 rounded-2xl flex flex-col backdrop-blur-md shadow-2xl relative overflow-hidden shrink-0"
            style={{ width: s(340), padding: s(16) }}
          >
            <div className="absolute top-0 right-0 bg-cyan-500 rounded-l" style={{ width: s(4), height: s(48) }} />
            <AnimatePresence mode="wait">
              {previewCharId !== null ? (
                selectingFor === "P2" ? renderVisualPreview("P2") : renderStatsPreview("P1")
              ) : (
                <motion.div
                  key="p2-slots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-grow flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <div className="flex flex-col">
                      <span className="font-bold text-stone-500 uppercase tracking-widest" style={{ fontSize: s(10) }}>
                        {isMultiplayer 
                          ? (settings.language.startsWith('en') ? "Rival" : "Rival") 
                          : (settings.language.startsWith('en') ? "Opponent (P2/CPU)" : "Oponente (P2/CPU)")}
                      </span>
                      <h3 className="font-black italic text-cyan-500 tracking-wider" style={{ fontSize: s(16) }}>
                        {settings.language.startsWith('en') ? "ACTIVE TEAM" : "EQUIPE ATIVA"}
                      </h3>
                    </div>
                    <div 
                      className="bg-cyan-500/10 rounded-lg border border-cyan-500/20 font-mono font-black text-cyan-400 flex items-center justify-center"
                      style={{ padding: `${s(4)}px ${s(10)}px`, fontSize: s(12) }}
                    >
                      {p2TeamIds.length}/{actualP2TeamSize}
                    </div>
                  </div>

                  {/* Team Slots */}
                  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1" style={{ gap: s(12) }}>
                    {actualP2TeamSize > 0 ? (
                      Array.from({ length: actualP2TeamSize }).map((_, idx) => {
                        const charId = p2TeamIds[idx];
                        const char = charId ? roster.find((c) => c.id === charId) : null;
                        const isSlotSelected = charId && previewCharId === charId;

                        return (
                          <div
                            key={`slot-p2-${idx}`}
                            className={`relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col ${
                              char
                                ? isSlotSelected
                                  ? "bg-cyan-950/20 border-2 border-cyan-500 shadow-lg shadow-cyan-500/10"
                                  : "bg-stone-900/40 border border-stone-800 hover:border-stone-700"
                                : "border border-dashed border-stone-800 bg-stone-950/30 flex items-center justify-center"
                            }`}
                            style={{ padding: s(10), minHeight: char ? 'auto' : s(96) }}
                          >
                            {char ? (
                              <div className="flex h-full relative group" style={{ gap: s(12) }}>
                                {/* Thumbnail */}
                                <div className="rounded-lg bg-stone-950 overflow-hidden border border-stone-700 shrink-0 relative" style={{ width: s(56), height: s(56) }}>
                                  <img
                                    src={char.spriteConfig?.portraitUrl}
                                    className="w-full h-full object-cover object-[center_20%]"
                                    alt=""
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-between overflow-hidden min-w-0">
                                  <h4 className="font-black text-white truncate uppercase italic" style={{ fontSize: s(12) }}>{char.name}</h4>
                                  
                                  {/* Assist Direct Selector */}
                                  <div className="flex items-center mt-1" style={{ gap: s(4) }}>
                                    <span className="text-stone-500 font-bold uppercase mr-1" style={{ fontSize: s(8) }}>
                                      {settings.language.startsWith('en') ? "Support:" : "Suporte:"}
                                    </span>
                                    {getCharacterAssistSkills(char.id).map((opt, idx) => {
                                      const isSel = (assistSelections[`P2_${char.id}`] || "SPECIAL") === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          title={`${opt.name}: ${opt.description}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAssistSelections((prev) => ({
                                              ...prev,
                                              [`P2_${char.id}`]: opt.id,
                                            }));
                                            AudioManager.getInstance().playSFX("click");
                                          }}
                                          className={`rounded font-black flex items-center justify-center transition-all ${
                                            isSel
                                              ? "bg-cyan-600 text-white shadow shadow-cyan-600/30 font-bold scale-110"
                                              : "bg-stone-800 text-stone-400 hover:text-white"
                                          }`}
                                          style={{ width: s(20), height: s(20), fontSize: s(9) }}
                                        >
                                          {idx + 1}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Deselect Hover Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveChar(char.id, "P2");
                                  }}
                                  className="absolute rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform scale-90 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  style={{ top: -s(4), right: -s(4), width: s(24), height: s(24) }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center opacity-40">
                                <span className="font-light text-cyan-500/80 animate-pulse" style={{ fontSize: s(20) }}>+</span>
                                <span className="font-black tracking-widest text-stone-500 uppercase mt-1" style={{ fontSize: s(9) }}>
                                  {settings.language.startsWith('en') ? "Empty Slot" : "Slot Vazio"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-stone-800 rounded-xl bg-stone-950/20">
                        <Cpu className="w-10 h-10 text-stone-600 mb-2 animate-bounce" />
                        <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">
                          {settings.language.startsWith('en') ? "ONLINE FIGHTER" : "LUTADOR ONLINE"}
                        </h4>
                        <p className="text-[9px] text-stone-500 max-w-[160px] mt-1 uppercase">
                          {settings.language.startsWith('en') 
                            ? "Opponent is choosing their own team of heroes remotely!" 
                            : "O oponente está escolhendo o seu próprio time de heróis remotamente!"}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>

        {/* --- DYNAMIC UTILITY CONSOLE & HUGE CONFIRM TRIGGER (BOTTOM) --- */}
        <footer 
          className="bg-stone-950/90 border-t border-white/5 px-6 md:px-12 flex items-center justify-between relative z-50 shrink-0"
          style={{ height: s(80) }}
        >
          
          {/* Quick Utility Options (Left) */}
          <div className="flex items-center" style={{ gap: s(12) }}>
            <button
              onClick={handleResetTeam}
              disabled={
                selectingFor === "P1"
                  ? p1TeamIds.length === 0
                  : (p1TeamIds.length === 0 && p2TeamIds.length === 0)
              }
              className="bg-stone-900 hover:bg-stone-800 disabled:opacity-45 disabled:hover:bg-stone-900 text-stone-300 rounded-xl font-black uppercase tracking-wider transition-all flex items-center border border-stone-800"
              style={{ padding: `${s(10)}px ${s(20)}px`, fontSize: s(11), gap: s(8) }}
            >
              <RefreshCcw size={s(12)} />
              <span>{settings.language.startsWith('en') ? "RESET TEAM" : "REINICIAR TIME"}</span>
            </button>
            
            <button
              onClick={handleAutoSelect}
              disabled={currentTeam.length >= currentMax}
              className="bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-45 disabled:hover:bg-orange-500/10 text-orange-400 rounded-xl font-black uppercase tracking-wider transition-all flex items-center border border-orange-500/20"
              style={{ padding: `${s(10)}px ${s(20)}px`, fontSize: s(11), gap: s(8) }}
            >
              <Wand2 size={s(12)} />
              <span>{settings.language.startsWith('en') ? "AUTO FILL" : "AUTO COMPLETAR"}</span>
            </button>
          </div>

          {/* Epic Symmetrical Ready Banner (Center overlay) */}
          <div 
            className="hidden lg:flex items-center bg-stone-900/40 border border-white/5 rounded-full backdrop-blur-md"
            style={{ gap: s(12), padding: `${s(8)}px ${s(24)}px` }}
          >
            <div className="flex" style={{ gap: s(6) }}>
              {p1TeamIds.map((id, idx) => (
                <div key={`p1-dot-${id}-${idx}`} className="rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" style={{ width: s(10), height: s(10) }} />
              ))}
              {Array.from({ length: Math.max(0, p1TeamSize - p1TeamIds.length) }).map((_, i) => (
                <div key={`p1-dot-empty-${i}`} className="rounded-full bg-stone-800" style={{ width: s(10), height: s(10) }} />
              ))}
            </div>
            <span className="font-black text-stone-500 uppercase tracking-widest" style={{ fontSize: s(10) }}>VS</span>
            <div className="flex" style={{ gap: s(6) }}>
              {p2TeamIds.map((id, idx) => (
                <div key={`p2-dot-${id}-${idx}`} className="rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" style={{ width: s(10), height: s(10) }} />
              ))}
              {Array.from({ length: Math.max(0, actualP2TeamSize - p2TeamIds.length) }).map((_, i) => (
                <div key={`p2-dot-empty-${i}`} className="rounded-full bg-stone-800" style={{ width: s(10), height: s(10) }} />
              ))}
            </div>
          </div>

          {/* Giant Fire-glowing Confirmation Button (Right) */}
          <div className="flex items-center">
            {currentTeam.length === currentMax ? (
              <motion.button
                onClick={handleStartBattle}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl shadow-2xl transition-all uppercase font-black italic tracking-widest flex items-center border-y border-orange-400/30`}
                style={{ padding: `${s(12)}px ${s(48)}px`, gap: s(12) }}
              >
                <span className="whitespace-nowrap" style={{ fontSize: s(14) }}>
                  {selectingFor === "P1" 
                    ? (settings.language.startsWith('en') ? "TEAM READY" : "PRONTA EQUIPE") 
                    : (settings.language.startsWith('en') ? "CONFIRM & FIGHT" : "CONFIRMAR E LUTAR")}
                </span>
                <Zap fill="white" className="animate-bounce" style={{ width: s(16), height: s(16) }} />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleConfirmChar}
                whileHover={canSelect ? { scale: 1.04 } : {}}
                whileTap={canSelect ? { scale: 0.98 } : {}}
                disabled={!canSelect}
                className={`border rounded-xl transition-all uppercase font-black italic tracking-widest flex items-center ${
                  canSelect
                    ? "bg-stone-100 hover:bg-white text-stone-950 border-white shadow-xl shadow-white/5"
                    : "bg-stone-900 border-stone-800 text-stone-600 grayscale cursor-not-allowed"
                }`}
                style={{ padding: `${s(12)}px ${s(48)}px`, gap: s(12) }}
              >
                <span className="whitespace-nowrap" style={{ fontSize: s(14) }}>
                  {settings.language.startsWith('en') ? "SELECT WARRIOR" : "SELECIONAR GUERREIRO"}
                </span>
                <Sword style={{ width: s(16), height: s(16) }} />
              </motion.button>
            )}
          </div>
        </footer>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>
      </div>
    </div>
  );
};
