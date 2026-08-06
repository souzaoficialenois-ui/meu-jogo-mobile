import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  SceneName,
  GameSettings,
  CharacterData,
  PlayerProfile,
  Mission,
  MissionAction,
  GameEvent,
  TournamentState,
  GameMode,
  RarityTier,
  RPGStats,
  UserRole,
  FriendRelation,
  ChatMessage,
  InMail,
  PromoCode,
  BattlePassData,
  BattlePassTier,
  PassTier,
  CompetitiveSession,
  HallOfFameSeason,
  HallOfFameEntry,
} from "../types";
import firebaseConfig from "../firebase-applet-config.json";
import { BeamConfigKeyManager } from "../services/BeamConfigKeyManager";
import { ProjectileConfigKeyManager } from "../services/ProjectileConfigKeyManager";
import { AuraConfigKeyManager } from "../services/AuraConfigKeyManager";
import { EffectConfigKeyManager } from "../services/EffectConfigKeyManager";
import { GameEngine } from "../services/GameEngine";
import {
  BASE_CHARACTERS,
  DUPLICATE_XP_REWARD,
  XP_MULTIPLIER,
  SHOP_PRICES,
  applyEngineOverrides,
} from "../constants";
import { getEvolutionStats } from "../personagens/CharacterDatabase";
import { TRANSLATIONS } from "../constants/translations";
import { LanguageManager } from "../services/LanguageManager";
import { MissionManager } from "../services/MissionManager";
import { AudioManager } from "../services/AudioManager";
import { CodeManager } from "../services/CodeManager";
import { TournamentManager } from "../services/TournamentManager";
import { OnlineTournamentService } from "../services/OnlineTournamentService";
import { PlayerDatabase } from "../services/PlayerDatabase";
import { RankService } from "../services/RankService";
import { TitleManager } from "../services/TitleManager";
import { SummonManager } from "../services/SummonManager";
import { FirstLaunchManager } from "../services/FirstLaunchManager";
import { auth, db } from "../services/firebase";
import { handleFirestoreError, OperationType } from "../services/error_handler";

import {
  onAuthStateChanged,
  User,
  updateProfile as updateFirebaseAuthProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  addDoc,
  arrayUnion,
} from "firebase/firestore";

interface SceneContextType {
  currentScene: SceneName;
  changeScene: (scene: SceneName, options?: { skipLoading?: boolean }) => void;
  startLoading: (target: SceneName) => void;
  startBattleTransition: () => void;
  isSceneLoading: boolean;
  loadingSceneTarget: SceneName | null;
  handleTransitionComplete: () => void;

  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  resetGameProgress: () => void;

  gameEngine: GameEngine | null;
  matchResult: import("../types").GameState | null;
  setMatchResult: (result: import("../types").GameState | null) => void;
  createGameSession: (
    p1Team: CharacterData[],
    p2Team: CharacterData[],
    isTraining?: boolean,
    gameMode?: GameMode,
    initialP1Hp?: number | null,
    waveNumber?: number,
    customOverrides?: {
      customGravityMultiplier?: number;
      customSpeedMultiplier?: number;
      customDamageMultiplier?: number;
      customWorldWidth?: number;
      customGroundHeight?: number;
    }
  ) => void;
  destroyGameSession: () => void;
  handleBattleEnd: (winnerId: number) => void;

  handleSurvivalEnd: (gameState: import("../types").GameState) => void;
  isPaused: boolean;
  setPaused: (paused: boolean) => void;
  summonBattleResults: { char: CharacterData; isNew: boolean }[] | null;
  setSummonBattleResults: (
    res: { char: CharacterData; isNew: boolean }[] | null,
  ) => void;

  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;

  selectedCharacter: CharacterData | null;

  // Economy & Gacha
  coins: number;
  gems: number;
  rouletteCoins: Record<string, number>;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addTickets: (amount: number, bannerId?: string) => void;
  spendTickets: (amount: number, bannerId?: string) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  addRouletteCoins: (amount: number, bannerId: string) => void;
  spendRouletteCoins: (amount: number, bannerId: string) => boolean;
  roomTokens: number;
  addRoomTokens: (amount: number) => void;
  spendRoomTokens: (amount: number) => boolean;

  // Gacha specific
  bannerTokens: Record<string, number>;
  addTokensToBanner: (bannerId: string, amount: number) => void;
  spendTokensFromBanner: (bannerId: string, amount: number) => boolean;

  // RPG System
  unlockedCharacters: CharacterData[];
  unlockCharacter: (id: string) => { isNew: boolean; name: string };
  unlockedItems: Record<string, { quantity: number; isNew: boolean }>;
  isItemUnlocked: (id: string) => boolean;
  unlockItem: (id: string) => { isNew: boolean; name: string };
  markItemAsSeen: (id: string) => void;
  equippedSkins: Record<string, string>;
  setEquippedSkins: (skins: Record<string, string>) => void;
  upgradeStat: (id: string, stat: "attack" | "defense" | "speed") => void;
  buyCharacter: (id: string) => { success: boolean; message: string };
  crystalBalances: Record<string, number>;
  addCrystals: (charId: string, amount: number) => void;
  evolveCharacter: (charId: string) => { success: boolean; message: string };
  distributeEvolutionPoints: (charId: string, stat: 'hp' | 'attack' | 'defense' | 'speed') => { success: boolean; message: string };
  convertCrystalsToUniversal: (charId: string, amount: number) => { success: boolean; message: string };
  convertUniversalToCrystals: (charId: string, amount: number) => { success: boolean; message: string };

  // Profile System
  playerProfile: PlayerProfile | null;
  createProfile: (
    name: string,
    avatarId: string,
    backgroundId?: string,
  ) => void;
  updateProfile: (
    name: string,
    avatarId: string,
    backgroundId?: string,
    bio?: string,
    activeTitle?: string,
    unlockedTitles?: string[],
  ) => void;
  equipTitle: (titleId: string) => void;
  checkAndGrantTitles: (hallOfFameRank?: number) => void;

  // Messages System
  // Cloud systemMessages are handled via 'inbox' now
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;

  // Missions & Events
  missions: Mission[];
  activeEvents: GameEvent[];
  notifyMissionProgress: (action: MissionAction, amount?: number) => void;
  claimMissionReward: (missionId: string) => void;

  // Tournament
  activeTournament: TournamentState | null;
  startTournament: (selected: string | string[]) => void;
  exitTournament: () => void;

  // Selection & Multiplayer
  selectionMode: GameMode | null;
  p1TeamSize: number;
  p2TeamSize: number;
  aiDifficulty: import("../services/AIController").AIDifficulty;
  matchMode: "P1_VS_CPU" | "CPU_VS_CPU";
  timeLimit: number;
  stageTheme: "TORNEIO_DO_PODER" | "KAME_HOUSE";
  battleMusic: string | null;
  setP1TeamSize: (size: number) => void;
  setP2TeamSize: (size: number) => void;
  setAiDifficulty: (
    difficulty: import("../services/AIController").AIDifficulty,
  ) => void;
  setMatchMode: (mode: "P1_VS_CPU" | "CPU_VS_CPU") => void;
  setTimeLimit: (limit: number) => void;
  setStageTheme: (theme: "TORNEIO_DO_PODER" | "KAME_HOUSE") => void;
  setBattleMusic: (url: string | null) => void;
  beginCharacterSelection: (mode: GameMode) => void;
  completeCharacterSelection: (
    p1Team: CharacterData[],
    p2Team?: CharacterData[] | null,
    overrideMode?: GameMode,
  ) => void;
  pendingP1Team: CharacterData[] | null;
  pendingP2Team: CharacterData[] | null;
  finalizeMatchSetup: () => void;
  selectedOnlineCharId: string | null;
  showProfileId: string | null;
  setShowProfileId: (id: string | null) => void;
  autoJoinRoomId: string | null;
  setAutoJoinRoomId: (id: string | null) => void;

  // Auth
  currentUser: User | null;
  isAuthLoading: boolean;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateMatchStats: (isWin: boolean, p1CharIds?: string[]) => Promise<void>;
  recordMatch: (opponentId: string, opponentName: string, opponentAvatar: string, isWin: boolean, myChars: string[], oppChars: string[]) => Promise<void>;
  isAdmin: boolean;
  isAmbassador: boolean;
  isModerator: boolean;
  isVeteran: boolean;

  // Admin Tools
  adminLogin: (password: string) => Promise<boolean>;
  fetchAllUsers: () => Promise<PlayerProfile[]>;
  updatePlayerProfileByAdmin: (
    targetId: string,
    updates: Partial<PlayerProfile>,
  ) => Promise<void>;
  sendRewardToPlayer: (
    targetId: string,
    reward: { type: "COIN" | "GEM" | "TICKET"; amount: number },
  ) => Promise<void>;

  // Social & Chat
  friends: FriendRelation[];
  sendFriendRequest: (targetId: string) => Promise<void>;
  acceptFriendRequest: (targetId: string) => Promise<void>;
  removeFriend: (targetId: string) => Promise<void>;
  fetchDiscoverablePlayers: () => Promise<PlayerProfile[]>;

  // Inbox & Promo
  inbox: InMail[];
  markInMailRead: (msgId: string) => Promise<void>;
  claimInMailReward: (msgId: string) => Promise<void>;
  generatePromoCode: (
    code: string,
    reward: any,
    isSingleUse: boolean,
  ) => Promise<void>;
  sendInMail: (
    targetId: string,
    subject: string,
    content: string,
    reward?: any,
  ) => Promise<void>;

  globalMessages: ChatMessage[];
  sendGlobalMessage: (text: string) => Promise<void>;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  currentPrivateChatId: string | null;
  setPrivateChatWith: (targetId: string | null) => void;
  privateMessages: ChatMessage[];
  sendPrivateMessage: (text: string) => Promise<void>;

  // Localization
  t: (key: string, variables?: Record<string, string | number>) => string;

  // Battle Pass
  battlePass: BattlePassData;
  addPassXp: (amount: number) => void;
  claimPassReward: (level: number, tier: BattlePassTier) => void;
  buyBattlePass: (tier: BattlePassTier) => boolean;
  updateGlobalStageOverride: (stageId: string, override: any) => void;
  updateGlobalEngineOverride: (override: any) => void;
  globalEngineOverrides: any;

  // Competitive Sessions & Hall of Fame
  activeSession: CompetitiveSession | null;
  activeLeaderboard: HallOfFameEntry[];
  hallOfFameHistory: HallOfFameSeason[];
  lastRankedReward: {
    pointsChange: number;
    basePoints: number;
    comboBonus: number;
    damageBonus: number;
    streakBonus: number;
    newTotalPoints: number;
    newRankName: string;
    newSubRank: string;
    oldPoints: number;
  } | null;
  endCurrentSession: () => Promise<void>;
  resetLastRankedReward: () => void;
  sessionConflict: boolean;
  setSessionConflict: (val: boolean) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const useSceneManager = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useSceneManager must be used within a SceneProvider");
  }
  return context;
};

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sessionConflict, setSessionConflict] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);

  // --- Settings ---
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem("dd2d_settings");
    const defaultSettings: GameSettings = {
      masterVolume: 100,
      musicVolume: 100,
      sfxVolume: 100,
      uiVolume: 100,
      voiceVolume: 100,
      fullscreen: false,
      graphicsQuality: "MEDIUM",
      particlesEnabled: true,
      shadowsEnabled: true,
      shadowType: "OVAL",
      lightingType: "BASIC",
      particleDensity: "MEDIUM",
      effectsLevel: "MEDIUM",
      weatherEffects: true,
      stageDestruction: false,
      postProcessingEnabled: false,
      fullAuras: false,
      energyDistortion: false,
      glowQuality: "NORMAL",
      auraGlowQuality: "NORMAL",
      screenShakeEnabled: true,
      showDamageNumbers: true,
      touchEffectInBattle: true,
      touchEffectColor: "RANDOM",
      buttonSensitivity: 1.0,
      enableMultiTouch: true,
      disableMobileUI: false,
      radialMenuDelay: 0.3,
      language: LanguageManager.getInstance().getCurrentLanguage(),
      controlType: "BUTTONS", // Default to BUTTONS
      notificationsEnabled: false,
      hudVisible: true,
      subtitlesEnabled: true,
      subtitlesBackgroundEnabled: false,
      subtitlesShowSpeakerName: true,
      subtitlesFontSize: "MEDIUM",
      hudLayout: {
        dpadX: 0,
        dpadY: 0,
        actionX: 0,
        actionY: 0,
        scale: 1.0,
        opacity: 0.8,
      },
      keybindings: {
        left: "KeyA",
        right: "KeyD",
        jump: "Space",
        light: "KeyK",
        medium: "KeyL",
        heavy: "Semicolon",
        special: "KeyI",
        block: "KeyS",
        dash: "ShiftLeft",
        charge: "KeyC",
        ultimate: "KeyU",
        tag: "KeyT",
        assist1: "KeyQ",
        assist2: "KeyE",
        vanish: "KeyV",
        transform: "KeyB",
        dragonRush: "KeyR"
      },
      p2Keybindings: {
        left: "ArrowLeft",
        right: "ArrowRight",
        jump: "ArrowUp",
        block: "ArrowDown",
        dash: "ShiftRight",
        light: "Numpad1",
        medium: "Numpad2",
        heavy: "Numpad3",
        special: "Numpad5",
        charge: "Numpad7",
        ultimate: "Numpad9",
        tag: "Numpad4",
        assist1: "NumpadDivide",
        assist2: "NumpadMultiply",
        vanish: "NumpadAdd",
        transform: "NumpadEnter",
        dragonRush: "Numpad0"
      },
      gamepadBindings: {
        left: 14,
        right: 15,
        jump: 0,
        block: 13,
        dash: 4,
        light: 2,
        medium: 3,
        heavy: 1,
        special: 5,
        charge: 6,
        ultimate: 7,
        tag: 8,
        assist1: 10,
        assist2: 11,
        vanish: 9,
        transform: 16,
        dragonRush: 12
      }
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.masterVolume === "number" && parsed.masterVolume <= 1.0) parsed.masterVolume = Math.round(parsed.masterVolume * 100);
        if (typeof parsed.musicVolume === "number" && parsed.musicVolume <= 1.0) parsed.musicVolume = Math.round(parsed.musicVolume * 100);
        if (typeof parsed.sfxVolume === "number" && parsed.sfxVolume <= 1.0) parsed.sfxVolume = Math.round(parsed.sfxVolume * 100);
        if (typeof parsed.uiVolume === "number" && parsed.uiVolume <= 1.0) parsed.uiVolume = Math.round(parsed.uiVolume * 100);
        if (typeof parsed.voiceVolume === "number" && parsed.voiceVolume <= 1.0) parsed.voiceVolume = Math.round(parsed.voiceVolume * 100);

        if (parsed.masterVolume > 100) parsed.masterVolume = 100;
        if (parsed.musicVolume > 100) parsed.musicVolume = 100;
        if (parsed.sfxVolume > 100) parsed.sfxVolume = 100;
        if (parsed.uiVolume > 100) parsed.uiVolume = 100;
        if (parsed.voiceVolume > 100) parsed.voiceVolume = 100;

        return {
          ...defaultSettings,
          ...parsed,
          hudLayout: {
            ...defaultSettings.hudLayout,
            ...(parsed.hudLayout || {}),
          },
          keybindings: {
            ...defaultSettings.keybindings,
            ...(parsed.keybindings || {}),
          },
          p2Keybindings: {
            ...defaultSettings.p2Keybindings,
            ...(parsed.p2Keybindings || {}),
          },
          gamepadBindings: {
            ...defaultSettings.gamepadBindings,
            ...(parsed.gamepadBindings || {}),
          }
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    AudioManager.getInstance().updateSettings(settings);
    if (settings.language) {
      LanguageManager.getInstance().setLanguage(settings.language);
    }
  }, [settings]);

  // --- Profile (DB INTEGRATION) ---
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    () => {
      const profile = PlayerDatabase.loadProfile();
      if (profile) {
        return {
          ...profile,
          ranked: profile.ranked || {
            br: RankService.getDefaultRankedData(),
            tdm: RankService.getDefaultRankedData(),
          },
          techniqueStats: profile.techniqueStats || {
            techniqueName: "Karatê Relâmpago",
            victories: 822,
            imageUrl: "/Assets/avatar/retrato/1.png",
          },
          conductScore: profile.conductScore ?? 100,
          bio: profile.bio || 'SABOR "Ruim"',
        } as PlayerProfile;
      }
      return null;
    },
  );

  const [currentScene, setCurrentScene] = useState<SceneName>(() => {
    return SceneName.SPLASH_SCREEN;
  });
  const [isSceneLoading, setIsSceneLoading] = useState<boolean>(false);
  const [loadingSceneTarget, setLoadingSceneTarget] = useState<SceneName | null>(null);

  // --- Economy ---
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("dd2d_coins");
    return saved ? parseInt(saved) : 500;
  });

  const [gems, setGems] = useState<number>(() => {
    const saved = localStorage.getItem("dd2d_gems");
    return saved ? parseInt(saved) : 0;
  });

  const [roomTokens, setRoomTokens] = useState<number>(() => {
    const saved = localStorage.getItem("dd2d_room_tokens");
    return saved ? parseInt(saved) : 2;
  });

  const addRoomTokens = useCallback((amount: number) => {
    setRoomTokens((prev) => {
      const next = prev + amount;
      localStorage.setItem("dd2d_room_tokens", next.toString());
      if (currentUser) {
        localStorage.setItem(`dd2d_room_tokens_${currentUser.uid}`, next.toString());
        updateDoc(doc(db, "users", currentUser.uid), { roomTokens: next }).catch(console.error);
      }
      return next;
    });
  }, [currentUser]);

  const spendRoomTokens = useCallback((amount: number): boolean => {
    if (roomTokens >= amount) {
      setRoomTokens((prev) => {
        const next = prev - amount;
        localStorage.setItem("dd2d_room_tokens", next.toString());
        if (currentUser) {
          localStorage.setItem(`dd2d_room_tokens_${currentUser.uid}`, next.toString());
          updateDoc(doc(db, "users", currentUser.uid), { roomTokens: next }).catch(console.error);
        }
        return next;
      });
      return true;
    }
    return false;
  }, [roomTokens, currentUser]);

  const [rouletteCoins, setRouletteCoins] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("dd2d_roulette_tokens");
    if (saved) return JSON.parse(saved);
    return {
      'banner_standard': 0,
      'banner_legendary': 0,
      'eternal_characters': 0,
      'rare_items': 0
    };
  });

  const [bannerTokens, setBannerTokens] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem("dd2d_banner_tokens");
      if (saved) return JSON.parse(saved);
      return {
        'banner_standard': 50,
        'banner_legendary': 50,
        'eternal_characters': 50,
        'rare_items': 50
      };
    },
  );

  const [unlockedCharacters, setUnlockedCharacters] = useState<CharacterData[]>(
    () => {
      const saved = localStorage.getItem("dd2d_roster");
      if (saved) return JSON.parse(saved);
      return [BASE_CHARACTERS[0], BASE_CHARACTERS[1]];
    },
  );
  
  const unlockedCharactersRef = useRef<CharacterData[]>(unlockedCharacters);
  useEffect(() => {
    unlockedCharactersRef.current = unlockedCharacters;
  }, [unlockedCharacters]);

  const [unlockedItems, setUnlockedItems] = useState<Record<string, { quantity: number; isNew: boolean }>>(() => {
    const saved = localStorage.getItem("dd2d_unlocked_items_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse unlocked items", e);
      }
    }
    // Fallback to old key for migration
    const oldSaved = localStorage.getItem("dd2d_unlocked_items");
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        if (Array.isArray(parsed)) {
          const migrated: Record<string, { quantity: number; isNew: boolean }> = {};
          parsed.forEach(id => migrated[id] = { quantity: 1, isNew: false });
          return migrated;
        }
        return parsed;
      } catch (e) {}
    }
    return {};
  });

  const unlockedItemsRef = useRef<Record<string, { quantity: number; isNew: boolean }>>(unlockedItems);
  useEffect(() => {
    unlockedItemsRef.current = unlockedItems;
  }, [unlockedItems]);

  const isItemUnlocked = useCallback((itemId: string) => {
    return (unlockedItems[itemId]?.quantity || 0) > 0;
  }, [unlockedItems]);

  const unlockItem = useCallback((id: string) => {
    const gachaItem = SummonManager.GACHA_ITEMS.find(i => i.id === id);
    const itemName = gachaItem ? gachaItem.name : id;
    
    const existing = unlockedItemsRef.current[id];
    const isNew = !existing || existing.quantity === 0;

    setUnlockedItems(prev => {
      const current = prev[id] || { quantity: 0, isNew: true };
      return {
        ...prev,
        [id]: { quantity: current.quantity + 1, isNew: true }
      };
    });

    // Update ref immediately for sync batching
    unlockedItemsRef.current = {
        ...unlockedItemsRef.current,
        [id]: { quantity: (existing?.quantity || 0) + 1, isNew: true }
    };

    return { isNew, name: itemName };
  }, []);

  const markItemAsSeen = useCallback((id: string) => {
    setUnlockedItems(prev => {
      if (!prev[id] || !prev[id].isNew) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], isNew: false }
      };
    });
  }, []);

  const [equippedSkins, setEquippedSkins] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("dd2d_equipped_skins");
    return saved ? JSON.parse(saved) : {};
  });

  const [crystalBalances, setCrystalBalances] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("dd2d_crystal_balances");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const addCrystals = useCallback((charId: string, amount: number) => {
    setCrystalBalances(prev => {
      const next = {
        ...prev,
        [charId]: (prev[charId] || 0) + amount
      };
      if (currentUser) {
        updateDoc(doc(db, "users", currentUser.uid), { crystalBalances: next }).catch(console.error);
      }
      return next;
    });
  }, [currentUser]);

  const [evolutionLevels, setEvolutionLevels] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("dd2d_evolution_levels");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const evolveCharacter = useCallback((charId: string) => {
    let result = { success: false, message: "" };

    const currentLevel = evolutionLevels[charId] || 1;
    if (currentLevel >= 10) {
      return { success: false, message: "Nível máximo de evolução atingido." };
    }

    // Evolution cost scaling: Level 1->2 (50), 2->3 (100), ..., 9->10 (450)
    const cost = currentLevel * 50;
    const balance = crystalBalances[charId] || 0;

    if (balance < cost) {
      return { success: false, message: "Cristais insuficientes." };
    }

    // Consume crystals
    setCrystalBalances(cPrev => {
      const newBalances = {
        ...cPrev,
        [charId]: balance - cost
      };
      if (currentUser) {
        updateDoc(doc(db, "users", currentUser.uid), { crystalBalances: newBalances }).catch(console.error);
      }
      return newBalances;
    });

    // Update evolution level
    const newLevel = currentLevel + 1;
    setEvolutionLevels(prev => {
      const nextLevels = {
        ...prev,
        [charId]: newLevel
      };
      if (currentUser) {
        updateDoc(doc(db, "users", currentUser.uid), { evolutionLevels: nextLevels }).catch(console.error);
      }
      return nextLevels;
    });

    // Update character data in roster to reflect new level/stats
    setUnlockedCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const evoStats = getEvolutionStats(c.id, newLevel);
        return {
          ...c,
          evolutionLevel: newLevel,
          maxHp: evoStats.maxHp,
          stats: evoStats.stats,
          availablePoints: (c.availablePoints || 0) + 3
        };
      }
      return c;
    }));

    result = { success: true, message: "Evolução concluída!" };
    AudioManager.getInstance().playSFX("confirm");
    return result;
  }, [crystalBalances, evolutionLevels, currentUser]);

  const distributeEvolutionPoints = useCallback((charId: string, stat: 'hp' | 'attack' | 'defense' | 'speed') => {
    let result = { success: false, message: "" };
    
    const charIndex = unlockedCharacters.findIndex(c => c.id === charId);
    if (charIndex === -1) return { success: false, message: "Personagem não encontrado." };
    
    const char = { ...unlockedCharacters[charIndex] };
    if (!char.statUpgrades) {
      char.statUpgrades = { hp: 0, attack: 0, defense: 0, speed: 0 };
    }
    
    const upgradeCount = char.statUpgrades[stat];
    const cost = 1 + (upgradeCount * 2);
    
    if (char.availablePoints < cost) {
      return { success: false, message: "Pontos de evolução insuficientes." };
    }
    
    // Deduct points and increment upgrade count
    char.availablePoints -= cost;
    char.statUpgrades[stat] += 1;
    
    // Apply stat increase
    if (stat === 'hp') {
      char.maxHp = (char.maxHp || 1000) + 50;
    } else if (stat === 'attack') {
      char.stats.attack += 1;
    } else if (stat === 'defense') {
      char.stats.defense += 1;
    } else if (stat === 'speed') {
      char.stats.speed += 1;
    }
    
    // Update roster
    setUnlockedCharacters(prev => {
      const next = [...prev];
      next[charIndex] = char;
      return next;
    });
    
    if (currentUser) {
      // Sync whole roster or just the char? The current pattern seems to sync roster via useEffect but let's be explicit if needed.
      // Actually, the roster is synced in a useEffect monitoring unlockedCharacters.
    }
    
    AudioManager.getInstance().playSFX("confirm");
    return { success: true, message: "Atributo aprimorado!" };
  }, [unlockedCharacters, currentUser]);

  const convertCrystalsToUniversal = useCallback((charId: string, amount: number) => {
    if (charId === 'UNIVERSAL') return { success: false, message: "Não é possível converter cristais universais neles mesmos." };
    const balance = crystalBalances[charId] || 0;
    if (balance < amount) return { success: false, message: "Cristais insuficientes." };

    const newBalances = {
      ...crystalBalances,
      [charId]: balance - amount,
      ['UNIVERSAL']: (crystalBalances['UNIVERSAL'] || 0) + amount
    };

    setCrystalBalances(newBalances);
    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), { crystalBalances: newBalances }).catch(console.error);
    }
    AudioManager.getInstance().playSFX("confirm");
    return { success: true, message: `Convertido ${amount} cristais de personagem em universais.` };
  }, [crystalBalances, currentUser]);

  const convertUniversalToCrystals = useCallback((charId: string, amount: number) => {
    if (charId === 'UNIVERSAL') return { success: false, message: "ID de personagem inválido." };
    const universalBalance = crystalBalances['UNIVERSAL'] || 0;
    const universalCost = amount * 3;
    if (universalBalance < universalCost) return { success: false, message: "Cristais universais insuficientes." };

    const newBalances = {
      ...crystalBalances,
      ['UNIVERSAL']: universalBalance - universalCost,
      [charId]: (crystalBalances[charId] || 0) + amount
    };

    setCrystalBalances(newBalances);
    if (currentUser) {
      updateDoc(doc(db, "users", currentUser.uid), { crystalBalances: newBalances }).catch(console.error);
    }
    AudioManager.getInstance().playSFX("confirm");
    return { success: true, message: `Convertido ${universalCost} cristais universais em ${amount} cristais de personagem.` };
  }, [crystalBalances, currentUser]);

  // --- Missions & Events ---
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem("dd2d_missions");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);

  // --- Tournament State ---
  const [activeTournament, setActiveTournament] =
    useState<TournamentState | null>(null);

  // --- Battle Pass ---
  const [battlePass, setBattlePass] = useState<BattlePassData>(() => {
    const saved = localStorage.getItem("dd2d_battlepass");
    return saved
      ? JSON.parse(saved)
      : {
          currentLevel: 1,
          currentXp: 0,
          tier: 'FREE',
          claimedRewards: [],
        };
  });

  const addPassXp = useCallback((amount: number) => {
    setBattlePass((prev) => {
      let newXp = prev.currentXp + amount;
      let newLevel = prev.currentLevel;
      const xpPerLevel = 1000;
      while (newXp >= xpPerLevel) {
        newXp -= xpPerLevel;
        newLevel++;
      }
      return { ...prev, currentXp: newXp, currentLevel: newLevel };
    });
  }, []);

  const claimPassReward = useCallback((level: number, tier: BattlePassTier) => {
    setBattlePass((prev) => {
      if (level > prev.currentLevel) return prev;
      
      // Tier check
      if (tier === 'ELITE' && prev.tier === 'FREE') return prev;
      if (tier === 'PREMIUM' && prev.tier !== 'PREMIUM') return prev;

      const rewardId = `${level}-${tier}`;
      if (prev.claimedRewards.includes(rewardId)) return prev;

      return {
        ...prev,
        claimedRewards: [...prev.claimedRewards, rewardId],
      };
    });
    AudioManager.getInstance().playSFX("confirm");
  }, []);

  const buyBattlePass = useCallback((tier: BattlePassTier) => {
    const prices = {
      'FREE': 0,
      'ELITE': 500,
      'PREMIUM': 1200
    };
    const price = prices[tier];
    
    if (gems >= price) {
      setGems((prev) => prev - price);
      setBattlePass((prev) => ({ ...prev, tier }));
      AudioManager.getInstance().playSFX("confirm");
      return true;
    }
    return false;
  }, [gems]);

  // Social State
  const [friends, setFriends] = useState<FriendRelation[]>([]);
  const [inbox, setInbox] = useState<InMail[]>([]);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [showProfileId, setShowProfileId] = useState<string | null>(null);
  const [autoJoinRoomId, setAutoJoinRoomId] = useState<string | null>(null);
  const [currentPrivateChatId, setCurrentPrivateChatId] = useState<
    string | null
  >(null);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const toggleChat = (open: boolean) => {
    setIsChatOpen(open);
  };

  // --- Game State ---
  const [isPaused, setIsPaused] = useState(false);
  const [summonBattleResults, setSummonBattleResults] = useState<
    { char: CharacterData; isNew: boolean }[] | null
  >(null);
  const [isOfflineMode, setIsOfflineMode] = useState(() => {
    try {
      const config = firebaseConfig as any;
      return config.projectId === "remixed-project-id" || !config.projectId;
    } catch (e) {
      return true;
    }
  });
  const [matchResult, setMatchResult] = useState<
    import("../types").GameState | null
  >(null);
  const [globalStageOverrides, setGlobalStageOverrides] = useState<any>({});
  const [globalEngineOverrides, setGlobalEngineOverrides] = useState<any>({});

  const updateGlobalStageOverride = (stageId: string, override: any) => {
    setGlobalStageOverrides((prev: any) => {
      const next = { ...prev, [stageId]: override };
      if (engineInstance) {
        engineInstance.renderer.setStageOverrides(next);
      }
      return next;
    });
  };

  const updateGlobalEngineOverride = (override: any) => {
    setGlobalEngineOverrides((prev: any) => {
      const next = { ...prev, ...override };
      applyEngineOverrides(next);
      return next;
    });
  };

  useEffect(() => {
    const fetchConfigs = async () => {
      if (isOfflineMode) {
        const localData = localStorage.getItem("dd2d_stage_overrides");
        if (localData) {
          setGlobalStageOverrides(JSON.parse(localData));
        }
        const localEngineData = localStorage.getItem("dd2d_engine_overrides");
        if (localEngineData) {
          const parsed = JSON.parse(localEngineData);
          setGlobalEngineOverrides(parsed);
          applyEngineOverrides(parsed);
        }
      } else {
        try {
          const { collection, getDocs } = await import("firebase/firestore");
          const querySnapshot = await getDocs(
            collection(db, "stage_overrides"),
          );
          let overrides: any = {};
          querySnapshot.forEach((doc) => {
            overrides[doc.id] = doc.data();
          });
          setGlobalStageOverrides(overrides);

          const engineSnapshot = await getDocs(
            collection(db, "engine_overrides"),
          );
          let engOverrides: any = {};
          engineSnapshot.forEach((doc) => {
            if (doc.id === "global") {
              engOverrides = doc.data();
            }
          });
          setGlobalEngineOverrides(engOverrides);
          applyEngineOverrides(engOverrides);
        } catch (e) {
          console.warn("Could not fetch online configs, checking local.");
          const localData = localStorage.getItem("dd2d_stage_overrides");
          if (localData) {
            setGlobalStageOverrides(JSON.parse(localData));
          }
          const localEngineData = localStorage.getItem("dd2d_engine_overrides");
          if (localEngineData) {
            const parsed = JSON.parse(localEngineData);
            setGlobalEngineOverrides(parsed);
            applyEngineOverrides(parsed);
          }
        }
      }
    };
    fetchConfigs();
  }, [isOfflineMode]);

  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterData | null>(null);
  const [engineInstance, setEngineInstance] = useState<GameEngine | null>(null);

  // --- Selection & Multiplayer State ---
  const [selectionMode, setSelectionMode] = useState<GameMode | null>(null);
  const [p1TeamSize, setP1TeamSize] = useState(3);
  const [p2TeamSize, setP2TeamSize] = useState(3);
  const [aiDifficulty, setAiDifficulty] =
    useState<import("../services/AIController").AIDifficulty>("MEDIUM");
  const [matchMode, setMatchMode] = useState<"P1_VS_CPU" | "CPU_VS_CPU">(
    "P1_VS_CPU",
  );
  const [timeLimit, setTimeLimit] = useState(99);
  const [stageTheme, setStageTheme] = useState<
    "TORNEIO_DO_PODER" | "KAME_HOUSE"
  >("TORNEIO_DO_PODER");
  const [battleMusic, setBattleMusic] = useState<string | null>(null);
  const [selectedOnlineCharId, setSelectedOnlineCharId] = useState<
    string | null
  >(null);
  const [pendingP1Team, setPendingP1Team] = useState<CharacterData[] | null>(
    null,
  );
  const [pendingP2Team, setPendingP2Team] = useState<CharacterData[] | null>(
    null,
  );

  // --- Initial Load & Mission Reset Logic ---
  useEffect(() => {
    setActiveEvents(MissionManager.getActiveEvents());

    const lastLogin = playerProfile?.lastLoginDate || 0;
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);

    let newMissions = [...missions];
    let needsSave = false;

    // Inject Event Missions
    const activeEvts = MissionManager.getActiveEvents();
    activeEvts.forEach(evt => {
        const evtMissions = MissionManager.getEventMissions(evt.id);
        evtMissions.forEach(m => {
            if (!newMissions.find(existing => existing.id === m.id)) {
                newMissions.push(m);
                needsSave = true;
            }
        });
    });

    if (
      lastLogin < todayStart ||
      newMissions.filter((m) => m.type === "DAILY").length === 0
    ) {
      newMissions = newMissions.filter((m) => m.type !== "DAILY");
      newMissions = [...newMissions, ...MissionManager.generateDailies()];
      needsSave = true;
    }

    const weeklies = newMissions.filter((m) => m.type === "WEEKLY");
    if (
      weeklies.length === 0 ||
      (weeklies[0].expiresAt && weeklies[0].expiresAt < now)
    ) {
      newMissions = newMissions.filter((m) => m.type !== "WEEKLY");
      newMissions = [...newMissions, ...MissionManager.generateWeeklies()];
      needsSave = true;
    }

    const monthlies = newMissions.filter((m) => m.type === "MONTHLY");
    if (
      monthlies.length === 0 ||
      (monthlies[0].expiresAt && monthlies[0].expiresAt < now)
    ) {
      newMissions = newMissions.filter((m) => m.type !== "MONTHLY");
      newMissions = [...newMissions, ...MissionManager.generateMonthlies()];
      needsSave = true;
    }

    if (needsSave) {
      setMissions(newMissions);
      localStorage.setItem(currentUser ? `dd2d_missions_${currentUser.uid}` : "dd2d_missions", JSON.stringify(newMissions));
    }

    if (playerProfile) {
      const updatedProfile = { ...playerProfile, lastLoginDate: now };
      setPlayerProfile(updatedProfile);
      PlayerDatabase.saveProfile(updatedProfile);
    }
  }, []);

  useEffect(() => {
    const loadOverrides = async () => {
      try {
        // Run project safety sweep on open/load to clean invalid resources automatically
        try {
          const { ProjectSweepManager } = await import("../services/ProjectSweepManager");
          await ProjectSweepManager.getInstance().runSweep(true);
        } catch (sweepError) {
          console.error("Failed to run safety sweep on open:", sweepError);
        }

        // 1. Try loading from localStorage first (for offline support)
        const localData = localStorage.getItem("dd2d_char_overrides");
        if (localData) {
          const parsed = JSON.parse(localData);
          Object.keys(parsed).forEach((id) => {
            const data = parsed[id];
            const charToUpdate = BASE_CHARACTERS.find((c) => c.id === id);
            if (charToUpdate) {
              if (data.attack !== undefined)
                charToUpdate.stats.attack = data.attack;
              if (data.defense !== undefined)
                charToUpdate.stats.defense = data.defense;
              if (data.speed !== undefined)
                charToUpdate.stats.speed = data.speed;
              if (data.maxHp !== undefined) charToUpdate.maxHp = data.maxHp;

              if (data.animations) {
                Object.keys(data.animations).forEach((animKey) => {
                  if (charToUpdate.spriteConfig.animations[animKey]) {
                    const animData = data.animations[animKey];
                    charToUpdate.spriteConfig.animations[animKey] = {
                      ...charToUpdate.spriteConfig.animations[animKey],
                      ...animData
                    };
                  }
                });
              }

              if (data.beamOverrides) {
                charToUpdate.beamOverrides = {
                  ...charToUpdate.beamOverrides,
                  ...data.beamOverrides
                };
              }

              if (data.projectileOverrides) {
                (charToUpdate as any).projectileOverrides = {
                  ...(charToUpdate as any).projectileOverrides,
                  ...data.projectileOverrides
                };
              }
            }
          });
        }

        // 2. Fetch from Firebase to sync if online
        const snapshot = await getDocs(collection(db, "character_overrides"));
        snapshot.forEach((docSnap) => {
          const id = docSnap.id;
          const data = docSnap.data();
          const charToUpdate = BASE_CHARACTERS.find((c) => c.id === id);
          if (charToUpdate) {
            if (data.attack !== undefined)
              charToUpdate.stats.attack = data.attack;
            if (data.defense !== undefined)
              charToUpdate.stats.defense = data.defense;
            if (data.speed !== undefined) charToUpdate.stats.speed = data.speed;
            if (data.maxHp !== undefined) charToUpdate.maxHp = data.maxHp;

            if (data.animations) {
              Object.keys(data.animations).forEach((animKey) => {
                if (charToUpdate.spriteConfig.animations[animKey]) {
                  const animData = data.animations[animKey];
                  charToUpdate.spriteConfig.animations[animKey] = {
                    ...charToUpdate.spriteConfig.animations[animKey],
                    ...animData
                  };
                }
              });
            }

            if (data.beamOverrides) {
              charToUpdate.beamOverrides = {
                ...charToUpdate.beamOverrides,
                ...data.beamOverrides
              };
            }

            if (data.projectileOverrides) {
              (charToUpdate as any).projectileOverrides = {
                ...(charToUpdate as any).projectileOverrides,
                ...data.projectileOverrides
              };
            }
          }
        });

        // Sync key managers with updated BASE_CHARACTERS so battles receive all configured keys
        try {
          BeamConfigKeyManager.getInstance().initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
          ProjectileConfigKeyManager.getInstance().initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
          AuraConfigKeyManager.getInstance().initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
          EffectConfigKeyManager.getInstance().initializeExclusiveKeysForBaseCharacters(BASE_CHARACTERS);
        } catch (syncErr) {
          console.warn("Key managers sync skipped or error:", syncErr);
        }
      } catch (error) {
        console.warn("Could not fetch online character_overrides, using local defaults:", error);
      }
    };
    loadOverrides().catch((err) => {
      console.warn("Character overrides sync skipped or offline:", err);
    });
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem("dd2d_settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(`dd2d_coins_${currentUser.uid}`, coins.toString());
  }, [coins, currentUser]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(`dd2d_gems_${currentUser.uid}`, gems.toString());
  }, [gems, currentUser]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(`dd2d_roulette_coins_${currentUser.uid}`, JSON.stringify(rouletteCoins));
    localStorage.setItem("dd2d_roulette_coins_v2", JSON.stringify(rouletteCoins));
  }, [rouletteCoins, currentUser]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(
        `dd2d_roster_${currentUser.uid}`,
        JSON.stringify(unlockedCharacters),
      );
  }, [unlockedCharacters, currentUser]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(
        `dd2d_unlocked_items_${currentUser.uid}`,
        JSON.stringify(unlockedItems),
      );
    localStorage.setItem("dd2d_unlocked_items_v2", JSON.stringify(unlockedItems));
  }, [unlockedItems, currentUser]);
  useEffect(() => {
    if (currentUser)
      localStorage.setItem(
        `dd2d_equipped_skins_${currentUser.uid}`,
        JSON.stringify(equippedSkins),
      );
  }, [equippedSkins, currentUser]);
  useEffect(() => {
    localStorage.setItem(
      currentUser ? `dd2d_missions_${currentUser.uid}` : "dd2d_missions",
      JSON.stringify(missions),
    );
  }, [missions, currentUser]);

  useEffect(() => {
    if (currentUser)
      localStorage.setItem(`dd2d_battlepass_${currentUser.uid}`, JSON.stringify(battlePass));
  }, [battlePass, currentUser]);

  useEffect(() => {
    localStorage.setItem("dd2d_crystal_balances", JSON.stringify(crystalBalances));
    if (currentUser)
      localStorage.setItem(`dd2d_crystals_${currentUser.uid}`, JSON.stringify(crystalBalances));
  }, [crystalBalances, currentUser]);

  useEffect(() => {
    localStorage.setItem("dd2d_evolution_levels", JSON.stringify(evolutionLevels));
    if (currentUser)
      localStorage.setItem(`dd2d_evo_levels_${currentUser.uid}`, JSON.stringify(evolutionLevels));
  }, [evolutionLevels, currentUser]);

  // --- Firebase Sync & Auth ---
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;
    let sessionUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }
      if (sessionUnsub) {
        sessionUnsub();
        sessionUnsub = null;
      }

      if (user) {
        setIsOfflineMode(false);

        // --- Single Session Management ---
        let devId = localStorage.getItem("fighter_legend_device_id");
        if (!devId) {
          devId = "device_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
          localStorage.setItem("fighter_legend_device_id", devId);
        }

        const currentSessionToken = "session_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        sessionTokenRef.current = currentSessionToken;

        const sessionDocRef = doc(db, "sessions", user.uid);
        try {
          await setDoc(sessionDocRef, {
            session_token: currentSessionToken,
            account_id: user.uid,
            device_id: devId,
            login_timestamp: Date.now()
          }, { merge: true });
        } catch (sessError) {
          handleFirestoreError(sessError, OperationType.WRITE, "sessions");
        }

        sessionUnsub = onSnapshot(sessionDocRef, (sessSnap) => {
          if (sessSnap.exists()) {
            const sessData = sessSnap.data();
            if (sessData.session_token && sessData.session_token !== sessionTokenRef.current) {
              console.log("Forced disconnect: active session mismatch");
              setSessionConflict(true);
              auth.signOut().catch(console.error);
            }
          }
        }, (err) => {
          console.error("Session snapshot error:", err);
        });

        const userDocRef = doc(db, "users", user.uid);

        // Use onSnapshot for real-time profile updates
        profileUnsub = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              let numericId = data.numericId;

              if (!numericId) {
                numericId = Math.floor(
                  10000000 + Math.random() * 90000000,
                ).toString();
                updateDoc(userDocRef, { numericId }).catch(console.error);
              }

              // Record snapshot data signature to prevent redundant write-back loops
              const snapshotState: Record<string, any> = {
                coins: data.coins || 0,
                gems: data.gems || 0,
                roomTokens: data.roomTokens || 0,
                battlePass: data.battlePass || null,
                crystalBalances: data.crystalBalances || null,
                evolutionLevels: data.evolutionLevels || null,
                unlockedCharacterIds: data.unlockedCharacterIds || [],
                unlockedItems: data.unlockedItems || null,
                displayName: data.displayName || data.name || "GUERREIRO",
                avatarId: data.avatarId ? (data.avatarId.toString().startsWith('avatar_') ? data.avatarId : `avatar_${data.avatarId}`) : "avatar_1",
                backgroundId: data.backgroundId ? (data.backgroundId.toString().startsWith('bg_') ? data.backgroundId : `bg_${data.backgroundId}`) : "bg_1",
                bio: data.bio || "",
                activeTitle: data.activeTitle || "",
                unlockedTitles: data.unlockedTitles || [],
                conductScore: data.conductScore || 100,
              };
              Object.keys(snapshotState).forEach((k) => {
                lastServerProfileStateRef.current[k] = JSON.stringify(snapshotState[k]);
              });

              setCoins(data.coins || 0);
              setGems(data.gems || 0);
              if (data.roomTokens !== undefined) setRoomTokens(data.roomTokens);
              if (data.battlePass) setBattlePass(data.battlePass);
              if (data.crystalBalances) setCrystalBalances(data.crystalBalances);
              if (data.evolutionLevels) setEvolutionLevels(data.evolutionLevels);

              // Map Character IDs back to objects
              const rosterIds = (data.unlockedCharacterIds || []) as string[];
              const baseRoster = BASE_CHARACTERS.filter((c) =>
                rosterIds.includes(c.id),
              );
              
              if (data.unlockedItems) {
                let items = data.unlockedItems;
                if (Array.isArray(items)) {
                  const migrated: Record<string, { quantity: number; isNew: boolean }> = {};
                  items.forEach((id: string) => migrated[id] = { quantity: 1, isNew: false });
                  items = migrated;
                }
                setUnlockedItems(items);
              }

              const finalRoster =
                baseRoster.length > 0
                  ? baseRoster
                  : [];

              setUnlockedCharacters((prev) => {
                const updatedRoster = finalRoster.map(char => {
                  const evoLevel = data.evolutionLevels?.[char.id] || 1;
                  const evoStats = getEvolutionStats(char.id, evoLevel);
                  return {
                    ...char,
                    evolutionLevel: evoLevel,
                    maxHp: evoStats.maxHp,
                    stats: evoStats.stats
                  };
                });

                if (
                  prev.length === updatedRoster.length &&
                  prev.every(
                    (char, i) =>
                      char.id === updatedRoster[i].id &&
                      char.evolutionLevel === updatedRoster[i].evolutionLevel &&
                      char.maxHp === updatedRoster[i].maxHp,
                  )
                ) {
                  return prev;
                }
                return updatedRoster;
              });

              let role = data.role || "ADMIN";
              if (!data.role) {
                role = "ADMIN";
                // Fire-and-forget update
                updateDoc(userDocRef, { role: "ADMIN" }).catch(console.error);
              }

              setPlayerProfile((prev) => {
                const newProfile: PlayerProfile = {
                  playerId: user.uid,
                  numericId: numericId,
                  name: data.displayName || data.name || "GUERREIRO",
                  avatarId: data.avatarId ? (data.avatarId.toString().startsWith('avatar_') ? data.avatarId : `avatar_${data.avatarId}`) : "avatar_1",
                  backgroundId: data.backgroundId ? (data.backgroundId.toString().startsWith('bg_') ? data.backgroundId : `bg_${data.backgroundId}`) : "bg_1",
                  bio: data.bio || "",
                  createdDate: data.createdAt,
                  lastLoginDate: data.lastLoginDate || Date.now(),
                  wins: data.wins || 0,
                  losses: data.losses || 0,
                  redeemedCodes: data.redeemedCodes || [],
                  role: role as UserRole,
                  isBanned: data.isBanned || false,
                  conductScore: data.conductScore || 100,
                  unlockedTitles: data.unlockedTitles || [],
                  activeTitle: data.activeTitle || "",
                  acceptedTerms: data.acceptedTerms || false,
                  acceptedTermsAt: data.acceptedTermsAt || 0,
                  ranked: data.ranked,
                  weaponStats: data.weaponStats,
                  techniqueStats: data.techniqueStats,
                };
                if (
                  prev &&
                  JSON.stringify(prev) === JSON.stringify(newProfile)
                ) {
                  return prev; // Avoid new object reference if same
                }
                return newProfile;
              });

              if (data.isBanned) {
                alert("Acesso negado: Sua conta foi suspensa.");
                auth.signOut().catch(console.error);
                return;
              }

              setCurrentScene((prev) => {
                if (prev === SceneName.AUTH) return SceneName.MAIN_MENU;
                return prev;
              });
            } else {
              // Only redirect to PROFILE_CREATION if we are NOT preloading, on splash, or downloading assets
              setCurrentScene((prev) => {
                if (
                  prev !== SceneName.PROFILE_CREATION &&
                  prev !== SceneName.PRELOAD &&
                  prev !== SceneName.SPLASH_SCREEN &&
                  prev !== SceneName.RESOURCE_DOWNLOAD
                ) {
                  return SceneName.PROFILE_CREATION;
                }
                return prev;
              });
            }
          },
          (error) => {
            console.error("Profile sync error:", error);
          },
        );
      } else {
        // If logged out
        const local = PlayerDatabase.loadProfile();
        if (local) setPlayerProfile(local);

        setCurrentScene((prev) => {
          // We shouldn't kick them out of MAIN_MENU if they intentionally went Offline.
          // But if they just logged out, we should. Wait, if they are offline, they are already logged out.
          // Let's check if they are in a scene that requires Auth. If so, redirect to NETWORK_SELECT.
          if (prev === SceneName.PROFILE || prev === SceneName.AUTH) {
            return SceneName.NETWORK_SELECT;
          }
          // If they are in PRELOAD or SPLASH_SCREEN, don't do anything because they transition automatically.
          return prev;
        });
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
      if (sessionUnsub) sessionUnsub();
    };
  }, [auth]);

  // --- Sync Controller ---
  const lastServerProfileStateRef = useRef<Record<string, string>>({});
  const syncTimeoutRef = useRef<any>(null);

  const requestProfileSync = useCallback(
    (updates: any) => {
      if (!currentUser) return;

      // Filter out fields that match lastServerProfileStateRef to prevent unnecessary Firestore writes
      const changedUpdates: any = {};
      Object.keys(updates).forEach((key) => {
        const val = updates[key];
        if (val === undefined) return;
        const serializedNew = JSON.stringify(val);
        const serializedOld = lastServerProfileStateRef.current[key];
        if (serializedOld === undefined || serializedNew !== serializedOld) {
          changedUpdates[key] = val;
        }
      });

      if (Object.keys(changedUpdates).length === 0) {
        return; // No actual field changes, skip network write
      }

      // Keep a local ref of pending updates to batch them
      if (!(window as any).pendingProfileUpdates) {
        (window as any).pendingProfileUpdates = {};
      }
      Object.assign((window as any).pendingProfileUpdates, changedUpdates);

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(() => {
        const toSync = { ...(window as any).pendingProfileUpdates };
        (window as any).pendingProfileUpdates = {};

        if (Object.keys(toSync).length > 0) {
          // Record local sync in ref to prevent feedback loop
          Object.keys(toSync).forEach((key) => {
            lastServerProfileStateRef.current[key] = JSON.stringify(toSync[key]);
          });

          const userDocRef = doc(db, "users", currentUser.uid);
          updateDoc(userDocRef, { ...toSync, updatedAt: Date.now() }).catch(
            (err) => {
              console.log("Batched sync error:", err);
            },
          );
        }
      }, 2000); // Debounce saves by 2 seconds
    },
    [currentUser],
  );

  // Sync back to Firebase on changes (Only if triggered by local actions, verified by a specific flag)
  // Replaced automatic infinite-loop useEffect with explicit sync requests.
  useEffect(() => {
    // Only locally generated states should trigger this manually. We will let the state changes
    // enqueue sync updates efficiently if needed, but we rely on handlers.
    const updates: any = {
      coins,
      gems,
      rouletteCoins,
      unlockedCharacterIds: unlockedCharacters.map((c) => c.id),
      unlockedItems,
      equippedSkins,
      bannerTokens,
      battlePass,
      crystalBalances,
      evolutionLevels,
    };

    if (playerProfile) {
      updates.displayName = playerProfile.name;
      updates.avatarId = playerProfile.avatarId;
      updates.backgroundId = playerProfile.backgroundId || "1";
      updates.bio = playerProfile.bio || "";
      updates.activeTitle = playerProfile.activeTitle || "";
      updates.unlockedTitles = playerProfile.unlockedTitles || [];
      updates.conductScore = playerProfile.conductScore || 100;
    }

    requestProfileSync(updates);
  }, [
    coins,
    gems,
    rouletteCoins,
    unlockedCharacters,
    unlockedItems,
    equippedSkins,
    bannerTokens,
    battlePass,
    playerProfile,
    requestProfileSync,
  ]);

  const addTokensToBanner = useCallback((bannerId: string, amount: number) => {
    setBannerTokens((prev) => ({
      ...prev,
      [bannerId]: (prev[bannerId] || 0) + amount,
    }));
  }, []);

  const spendTokensFromBanner = useCallback(
    (bannerId: string, amount: number) => {
      let success = false;
      setBannerTokens((prev) => {
        const current = prev[bannerId] || 0;
        if (current >= amount) {
          success = true;
          return { ...prev, [bannerId]: current - amount };
        }
        return prev;
      });
      return success;
    },
    [],
  );

  const logout = () => {
    AudioManager.getInstance().playSFX("click");
    auth.signOut().catch(console.error);
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    if (!confirm(t("confirm_delete_account"))) return;

    try {
      const uid = currentUser.uid;
      // 1. Delete Firestore user document
      await deleteDoc(doc(db, "users", uid));

      // 2. Delete the user from Auth (requires recent login)
      await currentUser.delete();

      alert(t("account_deleted_success"));
      logout();
      changeScene(SceneName.AUTH);
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      if (error.code === "auth/requires-recent-login") {
        alert(t("delete_account_reauth_required"));
        // Try to re-authenticate or justlogout
        logout();
      } else {
        alert("Error: " + error.message);
      }
    }
  };

  // ==========================================
  // COMPETITIVE SESSIONS & HALL OF FAME SYSTEM
  // ==========================================

  const MOCK_HOF_HISTORY: HallOfFameSeason[] = [];

  const DEFAULT_ACTIVE_SESSION: CompetitiveSession = {
    id: "session_1",
    name: "Sessão 1",
    status: "ACTIVE",
    startDate: Date.now() - 24 * 60 * 60 * 1000,
    endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    description: "A nova sessão competitiva começou! Acumule pontos e suba no ranking para ganhar prêmios de prestígio!"
  };

  const DEFAULT_BOT_LEADERBOARD: HallOfFameEntry[] = [];

  const [activeSession, setActiveSession] = useState<CompetitiveSession | null>(null);
  const [activeLeaderboard, setActiveLeaderboard] = useState<HallOfFameEntry[]>([]);
  const [hallOfFameHistory, setHallOfFameHistory] = useState<HallOfFameSeason[]>([]);
  const [lastRankedReward, setLastRankedReward] = useState<{
    pointsChange: number;
    basePoints: number;
    comboBonus: number;
    damageBonus: number;
    streakBonus: number;
    newTotalPoints: number;
    newRankName: string;
    newSubRank: string;
    oldPoints: number;
  } | null>(null);

  const resetLastRankedReward = () => setLastRankedReward(null);

  // Sync and load session-based ranking data
  useEffect(() => {
    const syncSessionData = async () => {
      let currentSession = DEFAULT_ACTIVE_SESSION;
      let history = MOCK_HOF_HISTORY;
      let leaderboard = [...DEFAULT_BOT_LEADERBOARD];

      const localSession = localStorage.getItem("dd2d_active_session");
      if (localSession) {
        try { 
          const parsed = JSON.parse(localSession);
          if (parsed.name.toLowerCase().includes("saga") || parsed.id.startsWith("season_")) {
            currentSession = DEFAULT_ACTIVE_SESSION;
            localStorage.setItem("dd2d_active_session", JSON.stringify(DEFAULT_ACTIVE_SESSION));
          } else {
            currentSession = parsed;
          }
        } catch (e) {}
      } else {
        localStorage.setItem("dd2d_active_session", JSON.stringify(DEFAULT_ACTIVE_SESSION));
      }

      const localHOF = localStorage.getItem("dd2d_hof_history");
      if (localHOF) {
        try { 
          history = (JSON.parse(localHOF) as HallOfFameSeason[]).filter(s => 
            s.topPlayers && s.topPlayers.every(p => !p.userId.startsWith('bot_'))
          );
        } catch (e) {}
      } else {
        localStorage.setItem("dd2d_hof_history", JSON.stringify(MOCK_HOF_HISTORY));
      }

      const localLeaderboard = localStorage.getItem("dd2d_active_leaderboard");
      if (localLeaderboard) {
        try { 
          leaderboard = (JSON.parse(localLeaderboard) as HallOfFameEntry[]).filter(p => !p.userId.startsWith('bot_'));
        } catch (e) {}
      } else {
        localStorage.setItem("dd2d_active_leaderboard", JSON.stringify(DEFAULT_BOT_LEADERBOARD));
      }

      if (!isOfflineMode && currentUser) {
        try {
          const activeSessionRef = doc(db, "sessions", "active_session");
          const activeSessionSnap = await getDoc(activeSessionRef);
          if (activeSessionSnap.exists()) {
            const sessionData = activeSessionSnap.data() as CompetitiveSession;
            // Force reset if legacy saga name or id exists
            if (sessionData.name.toLowerCase().includes("saga") || sessionData.id.startsWith("season_")) {
              currentSession = DEFAULT_ACTIVE_SESSION;
              if (isAdmin) {
                await setDoc(activeSessionRef, DEFAULT_ACTIVE_SESSION);
              }
            } else {
              currentSession = sessionData;
            }
          } else if (isAdmin) {
            await setDoc(activeSessionRef, DEFAULT_ACTIVE_SESSION);
          }

          const hofQuery = query(collection(db, "hall_of_fame"));
          const hofSnap = await getDocs(hofQuery);
          if (!hofSnap.empty) {
            history = (hofSnap.docs.map(d => d.data()) as HallOfFameSeason[]).filter(s => 
              s.topPlayers && s.topPlayers.every(p => !p.userId.startsWith('bot_'))
            );
          }

          const lbQuery = query(collection(db, "sessions", currentSession.id, "leaderboard"), orderBy("points", "desc"));
          const lbSnap = await getDocs(lbQuery);
          if (!lbSnap.empty) {
            leaderboard = (lbSnap.docs.map(d => d.data()) as HallOfFameEntry[]).filter(p => !p.userId.startsWith('bot_'));
          }
        } catch (e) {
          console.error("Failed to load/sync sessions from Firestore", e);
        }
      }

      // Inject current player dynamically
      if (playerProfile) {
        const playerPoints = playerProfile.ranked?.br?.points ?? 1000;
        const playerWins = playerProfile.wins;
        const playerLosses = playerProfile.losses;
        const playerTitle = playerProfile.activeTitle || "Desafiante";

        const playerEntry: HallOfFameEntry = {
          rank: 0,
          userId: playerProfile.playerId,
          name: playerProfile.name,
          avatarId: playerProfile.avatarId,
          points: playerPoints,
          wins: playerWins,
          losses: playerLosses,
          title: playerTitle,
          characters: playerProfile.unlockedCharacterIds || []
        };

        const filteredLB = leaderboard.filter(e => e.userId && e.userId !== playerProfile.playerId);
        const merged = [...filteredLB, playerEntry];
        
        // Deduplicate just in case
        const seenIds = new Set<string>();
        const uniqueMerged = merged.filter(e => {
          if (!e.userId || seenIds.has(e.userId)) return false;
          seenIds.add(e.userId);
          return true;
        });

        uniqueMerged.sort((a, b) => b.points - a.points);
        uniqueMerged.forEach((item, index) => {
          item.rank = index + 1;
        });
        leaderboard = uniqueMerged;
      }

      setActiveSession(currentSession);
      setHallOfFameHistory(history);
      setActiveLeaderboard(leaderboard);
    };

    syncSessionData();
  }, [isOfflineMode, currentUser, playerProfile]);

  const updateMatchStats = async (isWin: boolean, p1CharIds?: string[]) => {
    if (!playerProfile) return;
    
    // Performance point calculations
    const myStats = matchResult?.matchStats?.p1;
    const currentRanked = playerProfile.ranked?.br || RankService.getDefaultRankedData();
    const oldPoints = currentRanked.points;
    const currentStreak = currentRanked.winStreak || 0;
    
    // Calculate Bonuses
    let comboBonus = 0;
    let damageBonus = 0;
    if (isWin) {
      if (myStats?.maxCombo) comboBonus = Math.min(10, Math.floor(myStats.maxCombo / 5));
      if (myStats?.damageDealt) damageBonus = Math.min(10, Math.floor(myStats.damageDealt / 50));
    }
    
    // We don't have opponent points here easily, so we use a reasonable estimate or 1000 if not available
    const opponentPoints = 1000; 
    
    const pointsChange = RankService.calculateRPChange(
      oldPoints,
      opponentPoints,
      isWin,
      currentStreak,
      comboBonus + damageBonus
    );

    const newPoints = Math.max(0, oldPoints + pointsChange);
    const rankInfo = RankService.getRankFromPoints(newPoints);
    
    // Calculate streak bonus for the UI
    const streakBonus = isWin && currentStreak >= 2 ? Math.min(20, (currentStreak - 1) * 5) : 0;
    const basePoints = pointsChange - comboBonus - damageBonus - streakBonus;

    setLastRankedReward({
      pointsChange,
      basePoints,
      comboBonus,
      damageBonus,
      streakBonus,
      newTotalPoints: newPoints,
      newRankName: rankInfo.name,
      newSubRank: rankInfo.subRank,
      oldPoints
    });
    
    // Update individual character win/loss stats
    const updatedCharStats = { ...(playerProfile.characterStats || {}) };
    const now = Date.now();
    if (p1CharIds && p1CharIds.length > 0) {
      p1CharIds.forEach(id => {
        if (!id) return;
        const current = updatedCharStats[id] || { wins: 0, losses: 0, matches: 0 };
        const newWins = current.wins + (isWin ? 1 : 0);
        const newLosses = current.losses + (isWin ? 0 : 1);
        updatedCharStats[id] = {
          ...current,
          wins: newWins,
          losses: newLosses,
          matches: (current.matches || (current.wins + current.losses)) + 1,
          lastUsedTimestamp: now
        };
      });
    }

    const newWins = playerProfile.wins + (isWin ? 1 : 0);
    const newLosses = playerProfile.losses + (isWin ? 0 : 1);
    const newWinStreak = isWin ? currentStreak + 1 : 0;
    const newMaxWinStreak = Math.max(currentRanked.maxWinStreak || 0, newWinStreak);
    const newWinRate = Math.round((newWins / (newWins + newLosses || 1)) * 100);

    const updatedProfile: PlayerProfile = {
        ...playerProfile,
        wins: newWins,
        losses: newLosses,
        characterStats: updatedCharStats,
        ranked: {
          ...playerProfile.ranked,
          br: {
            ...currentRanked,
            points: newPoints,
            rank: rankInfo.name,
            subRank: rankInfo.subRank,
            tier: rankInfo.tier,
            winStreak: newWinStreak,
            maxWinStreak: newMaxWinStreak,
            totalMatches: (currentRanked.totalMatches || 0) + 1,
            winRate: newWinRate,
            bestRankName: currentRanked.bestRankName === 'Aprendiz V' && rankInfo.name !== 'Aprendiz' ? rankInfo.name : currentRanked.bestRankName
          } as any
        }
    };
    
    setPlayerProfile(updatedProfile);
    PlayerDatabase.saveProfile(updatedProfile);

    if (!isOfflineMode && currentUser) {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), {
          wins: newWins,
          losses: newLosses,
          characterStats: updatedCharStats,
          updatedAt: serverTimestamp()
        });
        await RankService.updateUserRank(currentUser.uid, pointsChange, isWin);
      } catch (e) {
        console.error("Failed to update remote match stats", e);
      }
    }
  };

  const endCurrentSession = async () => {
    if (!activeSession || !playerProfile) return;

    const completedSessionName = activeSession.name;
    const completedSessionId = activeSession.id;
    
    const sortedLeaderboard = [...activeLeaderboard].sort((a, b) => b.points - a.points);
    const top10 = sortedLeaderboard.slice(0, 10);
    
    top10.forEach((player, idx) => {
      player.rank = idx + 1;
    });

    const newHofRecord: HallOfFameSeason = {
      sessionId: completedSessionId,
      sessionName: completedSessionName,
      completedAt: Date.now(),
      topPlayers: top10
    };

    const updatedHistory = [newHofRecord, ...hallOfFameHistory];
    setHallOfFameHistory(updatedHistory);
    localStorage.setItem("dd2d_hof_history", JSON.stringify(updatedHistory));

    const nextSessionNum = (activeSession?.name ? parseInt(activeSession.name.split(" ")[1]) : 1) + 1;
    const newSessionId = `session_${nextSessionNum}`;
    const newSession: CompetitiveSession = {
      id: newSessionId,
      name: `Sessão ${nextSessionNum}`,
      status: "ACTIVE",
      startDate: Date.now(),
      endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
      description: `A nova sessão competitiva começou! Acumule pontos e suba no ranking para ganhar prêmios de prestígio!`
    };

    setActiveSession(newSession);
    localStorage.setItem("dd2d_active_session", JSON.stringify(newSession));

    const freshBots = DEFAULT_BOT_LEADERBOARD.map(bot => ({
      ...bot,
      points: Math.max(1000, 1000 + Math.floor(Math.random() * 500)),
      wins: Math.floor(Math.random() * 10),
      losses: Math.floor(Math.random() * 5),
    }));
    setActiveLeaderboard(freshBots);
    localStorage.setItem("dd2d_active_leaderboard", JSON.stringify(freshBots));

    const playerRankIndex = top10.findIndex(p => p.userId === playerProfile.playerId);
    
    let rewardMailSubject = t("mail_season_end_subject");
    let rewardMailContent = t("mail_season_end_content", { seasonName: completedSessionName });
    let rewardCoins = 200;
    let rewardGems = 50;
    let newTitle = "";

    if (playerRankIndex !== -1) {
      const rank = playerRankIndex + 1;
      if (rank === 1) {
        rewardCoins = 3000;
        rewardGems = 1000;
        newTitle = "Ultimate Champion";
        rewardMailSubject = t("mail_season_champion_subject");
        rewardMailContent = t("mail_season_champion_content", { seasonName: completedSessionName });
      } else if (rank <= 3) {
        rewardCoins = 1500;
        rewardGems = 500;
        newTitle = "Tactical Master";
        rewardMailSubject = t("mail_podium_subject");
        rewardMailContent = t("mail_podium_content", { rank, seasonName: completedSessionName });
      } else {
        rewardCoins = 750;
        rewardGems = 200;
        newTitle = t("title_elite_warrior");
        rewardMailSubject = t("mail_top10_subject");
        rewardMailContent = t("mail_top10_content", { rank, seasonName: completedSessionName });
      }
    }

    const currentTitles = playerProfile.unlockedTitles || ["Desafiante"];
    const nextTitles = newTitle && !currentTitles.includes(newTitle) ? [...currentTitles, newTitle] : currentTitles;
    
    const pointsReset = 1000;
    const rankInfo = RankService.getRankFromPoints(pointsReset);

    const updatedProfile: PlayerProfile = {
      ...playerProfile,
      coins: (playerProfile.coins || 0) + rewardCoins,
      gems: (playerProfile.gems || 0) + rewardGems,
      unlockedTitles: nextTitles,
      activeTitle: newTitle || playerProfile.activeTitle || "Desafiante",
      ranked: {
        br: {
          ...RankService.getDefaultRankedData(),
          points: pointsReset,
          rank: rankInfo.name,
          subRank: rankInfo.subRank,
          bestRankName: playerProfile.ranked?.br?.bestRankName || rankInfo.name
        },
        tdm: playerProfile.ranked?.tdm || RankService.getDefaultRankedData()
      }
    };

    setPlayerProfile(updatedProfile);
    
    if (isOfflineMode) {
      PlayerDatabase.saveProfile(updatedProfile);
      
      // Inject inbox message locally
      const msgId = `mail_season_${completedSessionId}`;
      const localInbox = [
        {
          id: msgId,
          senderId: "SYSTEM_ADMIN",
          senderName: "SYSTEM ADMIN",
          subject: rewardMailSubject,
          content: rewardMailContent,
          timestamp: Date.now(),
          read: false,
          reward: {
            type: "COIN" as const,
            amount: rewardCoins,
            claimed: true
          }
        },
        ...inbox
      ];
      setInbox(localInbox);
    } else {
      try {
        const userRef = doc(db, "users", playerProfile.playerId);
        await updateDoc(userRef, {
          coins: (playerProfile.coins || 0) + rewardCoins,
          gems: (playerProfile.gems || 0) + rewardGems,
          unlockedTitles: nextTitles,
          activeTitle: newTitle || playerProfile.activeTitle || "Desafiante",
          "ranked.br": {
            points: pointsReset,
            rank: rankInfo.name,
            subRank: rankInfo.subRank,
            bestRankName: playerProfile.ranked?.br?.bestRankName || rankInfo.name
          }
        });

        const msgId = `mail_season_${completedSessionId}`;
        const mailRef = doc(db, "users", playerProfile.playerId, "inbox", msgId);
        await setDoc(mailRef, {
          id: msgId,
          senderId: "SYSTEM_ADMIN",
          senderName: "SYSTEM ADMIN",
          subject: rewardMailSubject,
          content: rewardMailContent,
          timestamp: Date.now(),
          read: false,
          reward: {
            type: "COIN",
            amount: rewardCoins,
            claimed: true
          }
        });

        await setDoc(doc(db, "hall_of_fame", completedSessionId), newHofRecord);
        await setDoc(doc(db, "sessions", "active_session"), newSession);

        for (const bot of freshBots) {
          await setDoc(doc(db, "sessions", newSessionId, "leaderboard", bot.userId), bot);
        }
      } catch (e) {
        console.error("Failed to write season end details in Firestore:", e);
      }
    }

    AudioManager.getInstance().playSFX("confirm");
  };

  const recordMatch = async (
    opponentId: string,
    opponentName: string,
    opponentAvatar: string,
    isWin: boolean,
    myChars: string[],
    oppChars: string[]
  ) => {
    if (!currentUser || isOfflineMode) return;
    try {
      const matchId = `${currentUser.uid}_${opponentId}_${Date.now()}`;
      const matchRef = doc(db, "users", currentUser.uid, "matches", matchId);
      await setDoc(matchRef, {
        id: matchId,
        opponentId,
        opponentName,
        opponentAvatar,
        isWin,
        myCharacters: myChars,
        oppCharacters: oppChars,
        timestamp: Date.now()
      });
      console.log("Match recorded successfully in history");
    } catch (e) {
      console.error("Failed to record match in history:", e);
    }
  };

  const isAdmin =
    isOfflineMode ||
    playerProfile?.role === "ADMIN" ||
    !!currentUser;
  const isAmbassador =
    playerProfile?.role === "AMBASSADOR" || playerProfile?.role === "ADMIN";
  const isModerator =
    playerProfile?.role === "MODERATOR" || playerProfile?.role === "ADMIN";
  const isVeteran =
    playerProfile?.role === "VETERAN" ||
    playerProfile?.role === "AMBASSADOR" ||
    playerProfile?.role === "MODERATOR" ||
    playerProfile?.role === "ADMIN";

  // --- Social Methods ---
  const sendFriendRequest = async (targetId: string) => {
    if (!currentUser || !playerProfile) return;

    // Target user document to get their info
    const targetDoc = await getDoc(doc(db, "users", targetId));
    if (!targetDoc.exists()) return;
    const targetData = targetDoc.data();

    // 1. Add to my list as REQUESTED
    await setDoc(doc(db, "users", currentUser.uid, "friends", targetId), {
      friendId: targetId,
      name: targetData.displayName || targetData.name,
      avatarId: targetData.avatarId || "1",
      title: targetData.activeTitle || "",
      rankTier: targetData.ranked?.br?.tier || "APPRENTICE",
      status: "REQUESTED",
      updatedAt: Date.now(),
    });

    // 2. Add to their list as PENDING
    await setDoc(doc(db, "users", targetId, "friends", currentUser.uid), {
      friendId: currentUser.uid,
      name: playerProfile.name,
      avatarId: playerProfile.avatarId,
      title: playerProfile.activeTitle || "",
      rankTier: playerProfile.ranked?.br?.tier || "APPRENTICE",
      status: "PENDING",
      updatedAt: Date.now(),
    });
  };

  const acceptFriendRequest = async (targetId: string) => {
    if (!currentUser) return;
    const batch: any = {}; // Firestore batch would be better but let's use direct updates

    await updateDoc(doc(db, "users", currentUser.uid, "friends", targetId), {
      status: "ACCEPTED",
      updatedAt: Date.now(),
    });

    await updateDoc(doc(db, "users", targetId, "friends", currentUser.uid), {
      status: "ACCEPTED",
      updatedAt: Date.now(),
    });
  };

  const removeFriend = async (targetId: string) => {
    if (!currentUser) return;
    // Not strictly implemented "deleteDoc" in rules above but let's assume it works or we update status to REMOVED
    // For simplicity, let's just use status update or implement delete logic if needed
  };

  const fetchDiscoverablePlayers = async (): Promise<PlayerProfile[]> => {
    if (!currentUser) return [];
    try {
      // Fetch some players to discover, excluding current user
      const q = query(collection(db, "users"), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .filter((doc) => doc.id !== currentUser.uid)
        .map((doc) => {
          const data = doc.data();
          return {
            playerId: doc.id,
            name: data.displayName || data.name || "Soldado",
            avatarId: data.avatarId || "1",
            activeTitle: data.activeTitle || "",
            createdDate: data.createdDate || data.createdAt,
            lastLoginDate: data.lastLoginDate || Date.now(),
            wins: data.wins || 0,
            losses: data.losses || 0,
            role: data.role || "PLAYER",
            isBanned: data.isBanned || false,
            conductScore: data.conductScore || 100,
            ranked: data.ranked,
            weaponStats: data.weaponStats,
            bio: data.bio,
          };
        });
    } catch (e) {
      console.error("Discovery error:", e);
      return [];
    }
  };

  const chatChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Sync between tabs in the same browser
    try {
      if (!chatChannel.current) {
        chatChannel.current = new BroadcastChannel('global_chat_sync');
        chatChannel.current.onmessage = (event) => {
          if (event.data?.type === 'NEW_MESSAGE' && event.data?.message) {
            const incoming = event.data.message;
            setGlobalMessages(prev => {
              if (prev.some(m => m.id === incoming.id)) return prev;
              return [...prev, incoming].slice(-50);
            });
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }

    if (isOfflineMode) {
      // Initial Welcome Message if empty
      setGlobalMessages(prev => {
        if (prev.length > 0) return prev;
        const welcome: ChatMessage = {
          id: 'welcome',
          senderId: 'system',
          senderName: 'SISTEMA',
          senderRole: 'ADMIN',
          text: 'Bem-vindo ao Chat Global! Transmissão local ativa.',
          timestamp: Date.now()
        };
        return [welcome];
      });
      return;
    }

    // Online mode: set up Firestore snapshot listener
    const q = query(
      collection(db, "global_messages"),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        let ts = Date.now();
        if (data.timestamp) {
          if (typeof data.timestamp.toMillis === 'function') {
            ts = data.timestamp.toMillis();
          } else if (typeof data.timestamp === 'number') {
            ts = data.timestamp;
          }
        }
        return {
          id: doc.id,
          senderId: data.senderId || 'unknown',
          senderName: data.senderName || 'Guerreiro',
          senderRole: data.senderRole || 'PLAYER',
          senderAvatar: data.senderAvatar || 'avatar_1',
          senderTitle: data.senderTitle || '',
          senderRankTier: data.senderRankTier || 'APPRENTICE',
          text: data.text || '',
          timestamp: ts,
        } as ChatMessage;
      }).reverse();

      setGlobalMessages(prev => {
        // Retain any pending optimistic messages sent recently that haven't shown up in snapshot yet
        const serverIds = new Set(msgs.map(m => m.id));
        const pendingOptimistic = prev.filter(p =>
          p.id.startsWith('msg_') &&
          !serverIds.has(p.id) &&
          (Date.now() - p.timestamp) < 8000 &&
          !msgs.some(m => m.senderId === p.senderId && m.text === p.text)
        );
        return [...msgs, ...pendingOptimistic].slice(-50);
      });
    }, (err) => {
      console.warn("Global chat listener failed:", err);
    });

    return () => {
      unsubscribe();
    };
  }, [isOfflineMode]);

  const sendGlobalMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser?.uid || 'guest',
      senderName: playerProfile?.name || 'Guerreiro',
      senderRole: playerProfile?.role || 'PLAYER',
      senderAvatar: playerProfile?.avatarId || 'avatar_1',
      senderTitle: playerProfile?.activeTitle || '',
      senderRankTier: playerProfile?.ranked?.br?.tier || 'APPRENTICE',
      text: trimmedText,
      timestamp: Date.now(),
    };

    // Optimistically update local UI for instant feedback
    setGlobalMessages(prev => [...prev, newMessage].slice(-50));

    if (chatChannel.current) {
      try {
        chatChannel.current.postMessage({ type: 'NEW_MESSAGE', message: newMessage });
      } catch (e) {
        console.warn("Failed to broadcast message locally", e);
      }
    }

    if (!isOfflineMode && currentUser) {
      try {
        await addDoc(collection(db, "global_messages"), {
          senderId: currentUser.uid,
          senderName: playerProfile?.name || 'Guerreiro',
          senderRole: playerProfile?.role || 'PLAYER',
          senderAvatar: playerProfile?.avatarId || 'avatar_1',
          senderTitle: playerProfile?.activeTitle || '',
          senderRankTier: playerProfile?.ranked?.br?.tier || 'APPRENTICE',
          text: trimmedText,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to send global message to Firestore:", e);
      }
    }
  };

  const setPrivateChatWith = (targetId: string | null) => {
    if (!currentUser || !targetId) {
      setCurrentPrivateChatId(null);
      return;
    }
    const chatId = [currentUser.uid, targetId].sort().join("_");
    setCurrentPrivateChatId(chatId);
  };

  const sendPrivateMessage = async (text: string) => {
    if (!currentUser || !playerProfile || !currentPrivateChatId) return;
    const msgId = `msg_${Date.now()}`;
    await setDoc(
      doc(db, "private_chats", currentPrivateChatId, "messages", msgId),
      {
        senderId: currentUser.uid,
        senderName: playerProfile.name,
        senderRole: playerProfile.role,
        text,
        timestamp: serverTimestamp(),
      },
    );
  };

  // --- Admin Methods ---
  const generatePromoCode = async (
    code: string,
    reward: any,
    isSingleUse: boolean,
  ) => {
    if (!isAdmin) return;
    if (isOfflineMode) {
      console.log(`[Offline Admin] Generated promo code ${code}`, reward);
      return;
    }
    await setDoc(doc(db, "promo_codes", code.toUpperCase()), {
      code: code.toUpperCase(),
      reward,
      isSingleUse,
      usedBy: [],
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    });
  };

  const sendInMail = async (
    targetId: string,
    subject: string,
    content: string,
    reward?: any,
  ) => {
    if (!isAdmin) {
      console.warn("Attempted to send mail without admin privileges");
      return;
    }
    const msgId = `mail_${Date.now()}`;
    if (isOfflineMode) {
      console.log(`[Offline Admin] Sent mail to ${targetId} - ${subject}`);
      return;
    }
    const mailRef = doc(db, "users", targetId, "inbox", msgId);
    await setDoc(mailRef, {
      id: msgId,
      senderId: currentUser?.uid,
      senderName: "SYSTEM ADMIN",
      subject,
      content,
      timestamp: serverTimestamp(),
      read: false,
      reward: reward ? { ...reward, claimed: false } : null,
    });
  };

  const markInMailRead = async (msgId: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid, "inbox", msgId), {
      read: true,
    });
  };

  const claimInMailReward = async (msgId: string) => {
    if (!currentUser) return;
    const mailDoc = await getDoc(
      doc(db, "users", currentUser.uid, "inbox", msgId),
    );
    if (!mailDoc.exists()) return;
    const data = mailDoc.data() as InMail;
    if (!data.reward || data.reward.claimed) return;

    // Grant reward logic
    const { type, amount } = data.reward;
    if (type === "COIN") {
      const cur = coins;
      setCoins(cur + amount);
    }
    if (type === "GEM") {
      const cur = gems;
      setGems(cur + amount);
    }
    if (type === "TICKET") {
      // Default to standard banner if no specific bannerId provided in reward
      const bannerId = (data.reward as any).bannerId || 'banner_standard';
      addTickets(amount, bannerId);
    }

    await updateDoc(doc(db, "users", currentUser.uid, "inbox", msgId), {
      "reward.claimed": true,
    });

    AudioManager.getInstance().playSFX("confirm");
  };

  const adminLogin = async (password: string): Promise<boolean> => {
    // Admin password check
    if ((password === "admin" || password === "admin123") && currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          role: "ADMIN",
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (e) {
        console.error("Admin elevation failed:", e);
        // Fallback for rules
        if (currentUser) return true;
        return false;
      }
    }
    return false;
  };

  const fetchAllUsers = async (): Promise<PlayerProfile[]> => {
    if (!isAdmin) throw new Error("Unauthorized");
    if (isOfflineMode) {
      return playerProfile
        ? [{ ...playerProfile, role: "ADMIN" as const }]
        : [
            {
              playerId: "offline_id",
              name: "Offline Admin",
              avatarId: "1",
              createdDate: Date.now(),
              lastLoginDate: Date.now(),
              wins: 999,
              losses: 0,
              role: "ADMIN",
              isBanned: false,
              conductScore: 100,
            },
          ];
    }
    try {
      const snapshot = await getDocs(collection(db, "users"));
      console.log(`Fetched ${snapshot.size} users for admin`);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          playerId: d.id,
          name: data.displayName || data.name || "Soldado",
          avatarId: data.avatarId || "1",
          createdDate: data.createdDate || data.createdAt || Date.now(),
          lastLoginDate: data.lastLoginDate || Date.now(),
          wins: data.wins || 0,
          losses: data.losses || 0,
          role: (data.role || "PLAYER") as UserRole,
          isBanned: data.isBanned || false,
          conductScore: data.conductScore || 100,
          ranked: data.ranked,
          weaponStats: data.weaponStats,
          bio: data.bio,
        };
      });
    } catch (e) {
      console.error("Error in fetchAllUsers:", e);
      throw e;
    }
  };

  const updatePlayerProfileByAdmin = async (
    targetId: string,
    updates: Partial<PlayerProfile>,
  ) => {
    if (!isAdmin) throw new Error("Unauthorized");
    if (isOfflineMode) {
      if (playerProfile && playerProfile.playerId === targetId) {
        setPlayerProfile({ ...playerProfile, ...updates });
      }
      if ((updates as any).unlockedCharacterIds !== undefined) {
        setUnlockedCharacters(
          BASE_CHARACTERS.filter((c) =>
            (updates as any).unlockedCharacterIds.includes(c.id),
          ),
        );
      }
      return;
    }
    const userDocRef = doc(db, "users", targetId);

    // Map local profile fields to Firestore fields
    const firestoreUpdates: any = {};
    if (updates.name !== undefined) firestoreUpdates.displayName = updates.name;
    if (updates.role !== undefined) firestoreUpdates.role = updates.role;
    if (updates.isBanned !== undefined)
      firestoreUpdates.isBanned = updates.isBanned;
    if ((updates as any).unlockedCharacterIds !== undefined)
      firestoreUpdates.unlockedCharacterIds = (
        updates as any
      ).unlockedCharacterIds;

    await updateDoc(userDocRef, {
      ...firestoreUpdates,
      updatedAt: serverTimestamp(),
    });
  };

  const sendRewardToPlayer = async (
    targetId: string,
    reward: { type: "COIN" | "GEM" | "TICKET"; amount: number; bannerId?: string },
  ) => {
    if (!isAdmin) throw new Error("Unauthorized");
    if (isOfflineMode) {
      if (reward.type === "COIN") setCoins((c) => c + reward.amount);
      if (reward.type === "GEM") setGems((g) => g + reward.amount);
      if (reward.type === "TICKET") addTickets(reward.amount, reward.bannerId || 'banner_standard');
      return;
    }

    // Instead of adding immediately, we send a redeemable mail
    await sendInMail(
      targetId,
      "RECOMPENSA DE ADMINISTRADOR",
      `O Alto Comando autorizou uma transferência direta de recursos para o seu setor: ${reward.amount} ${reward.type}. Favor coletar imediatamente.`,
      { type: reward.type, amount: reward.amount, bannerId: reward.bannerId },
    );
  };

  // Removed global listeners for global_chat and private_chats to prevent excessive reads
  // See SocialScreen.tsx and PrivateChatScreen.tsx for local implementations.

  // Global Chat Listeners Removed (Non-Firebase)

  // Listen to Friends
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "friends"),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const friendList = snapshot.docs.map((d) =>
          d.data(),
        ) as FriendRelation[];
        setFriends(friendList);
      },
      (error) => console.error("Friends Snapshot Error:", error),
    );
    return unsubscribe;
  }, [currentUser]);

  // Listen to Inbox
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "inbox"),
      orderBy("timestamp", "desc"),
      limit(30)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => d.data()) as InMail[];
        setInbox(msgs);
      },
      (error) => console.error("Inbox Snapshot Error:", error),
    );
    return unsubscribe;
  }, [currentUser]);

  // --- Handlers ---

  const addCoins = (amount: number) => setCoins((prev) => prev + amount);
  const addTickets = (amount: number, bannerId: string = 'banner_standard') => {
    setBannerTokens(prev => {
      const next = { ...prev, [bannerId]: (prev[bannerId] || 0) + amount };
      localStorage.setItem("dd2d_banner_tokens", JSON.stringify(next));
      return next;
    });
  };
  const addGems = (amount: number) => setGems((prev) => prev + amount);

  const addRouletteCoins = (amount: number, bannerId: string) => {
    setRouletteCoins(prev => {
      const next = { ...prev, [bannerId]: (prev[bannerId] || 0) + amount };
      localStorage.setItem("dd2d_roulette_tokens", JSON.stringify(next));
      return next;
    });
  };

  const spendRouletteCoins = (amount: number, bannerId: string) => {
    if ((rouletteCoins[bannerId] || 0) < amount) return false;
    setRouletteCoins(prev => {
      const next = { ...prev, [bannerId]: prev[bannerId] - amount };
      localStorage.setItem("dd2d_roulette_tokens", JSON.stringify(next));
      return next;
    });
    return true;
  };

  const spendCoins = (amount: number) => {
    if (coins >= amount) {
      setCoins((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const spendTickets = (amount: number, bannerId: string): boolean => {
    if ((bannerTokens[bannerId] || 0) < amount) return false;
    setBannerTokens(prev => {
      const next = { ...prev, [bannerId]: prev[bannerId] - amount };
      localStorage.setItem('dd2d_banner_tokens', JSON.stringify(next));
      return next;
    });
    return true;
  };

  const spendGems = (amount: number) => {
    if (gems >= amount) {
      setGems((prev) => prev - amount);
      return true;
    }
    return false;
  };

  // --- Mission Logic ---

  const notifyMissionProgress = useCallback(
    (action: MissionAction, amount: number = 1) => {
      setMissions((prev) => {
        return prev.map((m) => {
          if (m.claimed) return m;
          if (m.actionType === action) {
            const newCurrent = Math.min(m.target, m.current + amount);
            return { ...m, current: newCurrent };
          }
          return m;
        });
      });
    },
    [],
  );

  const claimMissionReward = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.claimed || mission.current < mission.target) return;

    if (mission.rewardType === "COIN") addCoins(mission.rewardAmount);
    if (mission.rewardType === "ROOM_TOKEN") addRoomTokens(mission.rewardAmount);
    if (mission.rewardType === "TICKET") addTickets(mission.rewardAmount, mission.rewardData || 'banner_standard');
    if (mission.rewardType === "GEM") addGems(mission.rewardAmount);
    if (mission.rewardType === "XP") addPassXp(mission.rewardAmount);
    if (mission.rewardType === "CRYSTAL" && mission.rewardData) addCrystals(mission.rewardData, mission.rewardAmount);
    if (mission.rewardType === "CHARACTER" && mission.rewardData) unlockCharacter(mission.rewardData);
    if (mission.rewardType === "AVATAR" && mission.rewardData) {
        const id = mission.rewardData.startsWith('avatar_') ? mission.rewardData : `avatar_${mission.rewardData}`;
        unlockItem(id);
    }
    if (mission.rewardType === "AVATAR_BG" && mission.rewardData) {
        const id = mission.rewardData.startsWith('bg_') ? mission.rewardData : `bg_${mission.rewardData}`;
        unlockItem(id);
    }
    if (mission.rewardType === "STAGE" && mission.rewardData) {
        const id = mission.rewardData.startsWith('stage_') ? mission.rewardData : `stage_${mission.rewardData}`;
        unlockItem(id);
    }
    if (mission.rewardType === "TITLE" && mission.rewardData) {
        setPlayerProfile(prev => {
            if (!prev) return prev;
            const unlockedTitles = prev.unlockedTitles || [];
            if (unlockedTitles.includes(mission.rewardData!)) return prev;
            return { ...prev, unlockedTitles: [...unlockedTitles, mission.rewardData!] };
        });
        
        // Persist title to firestore if logged in
        if (currentUser) {
            updateDoc(doc(db, "users", currentUser.uid), {
                unlockedTitles: arrayUnion(mission.rewardData)
            }).catch(console.error);
        }
    }
    
    const updatedMissions = missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
    setMissions(updatedMissions);
    
    // Immediate persistence
    localStorage.setItem(currentUser ? `dd2d_missions_${currentUser.uid}` : "dd2d_missions", JSON.stringify(updatedMissions));
  };

  const addXpToCharacter = (
    char: CharacterData,
    amount: number,
  ): CharacterData => {
    let newChar = { ...char };
    newChar.currentXp += amount;
    while (newChar.currentXp >= newChar.xpToNextLevel) {
      newChar.currentXp -= newChar.xpToNextLevel;
      newChar.level += 1;
      newChar.availablePoints += 3;
      newChar.xpToNextLevel = Math.floor(newChar.xpToNextLevel * XP_MULTIPLIER);
    }
    return newChar;
  };

  const unlockCharacter = useCallback((id: string) => {
    const baseChar = BASE_CHARACTERS.find((c) => c.id === id);
    if (!baseChar) return { isNew: false, name: "Unknown" };

    const existingIndex = unlockedCharactersRef.current.findIndex(c => c.id === id);
    const isNew = existingIndex < 0;

    if (!isNew) {
      const updatedRoster = [...unlockedCharactersRef.current];
      updatedRoster[existingIndex] = addXpToCharacter(
        updatedRoster[existingIndex],
        DUPLICATE_XP_REWARD,
      );
      
      unlockedCharactersRef.current = updatedRoster;
      setUnlockedCharacters(updatedRoster);
      
      return { isNew: false, name: baseChar.name };
    } else {
      const nextRoster = [...unlockedCharactersRef.current, baseChar];
      unlockedCharactersRef.current = nextRoster;
      setUnlockedCharacters(nextRoster);

      // Also track in unlockedItems for the 'New' badge in Warehouse
      const nextItems = {
        ...unlockedItemsRef.current,
        [id]: { quantity: 1, isNew: true }
      };
      unlockedItemsRef.current = nextItems;
      setUnlockedItems(nextItems);

      return { isNew: true, name: baseChar.name };
    }
  }, [addXpToCharacter]);

  const buyCharacter = (id: string) => {
    const baseChar = BASE_CHARACTERS.find((c) => c.id === id);
    if (!baseChar) return { success: false, message: "Invalid Character" };

    const price = SHOP_PRICES[baseChar.rarity];
    if (coins < price) return { success: false, message: "Insufficient Funds" };

    const existingIndex = unlockedCharacters.findIndex((c) => c.id === id);
    if (existingIndex >= 0) return { success: false, message: "Already Owned" };

    if (spendCoins(price)) {
      unlockCharacter(id);
      return { success: true, message: "Purchased Successfully!" };
    }
    return { success: false, message: "Transaction Failed" };
  };

  const redeemCode = async (
    code: string,
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !playerProfile)
      return { success: false, message: "Authentication required" };
    const cleanCode = code.toUpperCase().trim();
    if (playerProfile.redeemedCodes?.includes(cleanCode)) {
      return { success: false, message: "CODE ALREADY REDEEMED" };
    }

    try {
      const staticReward = CodeManager.validateCode(cleanCode);
      if (staticReward) {
        const { type, amount } = staticReward;
        if (type === "COIN") addCoins(amount || 0);
        if (type === "GEM") addGems(amount || 0);
        if (type === "TICKET") addTickets(amount || 0, (staticReward as any).bannerId || 'banner_standard');
        if (type === "CHARACTER" && staticReward.data) {
          unlockCharacter(staticReward.data);
        }
        await updateDoc(doc(db, "users", currentUser.uid), {
          redeemedCodes: [...(playerProfile.redeemedCodes || []), cleanCode],
        });
        AudioManager.getInstance().playSFX("confirm");
        return {
          success: true,
          message: `ACCESS GRANTED: ${amount || 1} ${type} DEPOSITED`,
        };
      }

      const codeRef = doc(db, "promo_codes", cleanCode);
      const codeDoc = await getDoc(codeRef);

      if (!codeDoc.exists()) {
        return { success: false, message: "INVALID SECURITY AUTHENTICATION" };
      }

      const data = codeDoc.data() as PromoCode;

      if (data.isSingleUse && data.usedBy.length > 0) {
        return {
          success: false,
          message: "THIS SIGNAL HAS BEEN INTERCEPTED BY ANOTHER SECTOR",
        };
      }

      const { type, amount } = data.reward;
      if (type === "COIN") addCoins(amount);
      if (type === "GEM") addGems(amount);
      if (type === "TICKET") addTickets(amount, (data.reward as any).bannerId || 'banner_standard');

      await updateDoc(codeRef, { usedBy: [...data.usedBy, currentUser.uid] });
      await updateDoc(doc(db, "users", currentUser.uid), {
        redeemedCodes: [...(playerProfile.redeemedCodes || []), cleanCode],
      });

      AudioManager.getInstance().playSFX("confirm");
      return {
        success: true,
        message: `ACCESS GRANTED: ${amount} ${type} DEPOSITED`,
      };
    } catch (e: any) {
      return { success: false, message: "TRANSMISSION ERROR: " + e.message };
    }
  };

  const upgradeStat = (id: string, stat: "attack" | "defense" | "speed") => {
    const idx = unlockedCharacters.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const char = { ...unlockedCharacters[idx] };
    if (char.availablePoints > 0) {
      char.stats = { ...char.stats };
      char.stats[stat] += 1;
      char.availablePoints -= 1;
      const updated = [...unlockedCharacters];
      updated[idx] = char;
      setUnlockedCharacters(updated);
      notifyMissionProgress("EVOLVE_STAT", 1);
    }
  };

  // --- Tournament Logic ---

  const startTournament = (teamIds: string[]) => {
    const tourney = TournamentManager.createTournament(
      teamIds,
      unlockedCharacters.length > 0 ? unlockedCharacters : BASE_CHARACTERS,
      p1TeamSize,
    );
    setActiveTournament(tourney);
    changeScene(SceneName.TOURNAMENT);
  };

  const exitTournament = () => {
    setActiveTournament(null);
    changeScene(SceneName.MAIN_MENU);
  };

  const handleBattleEnd = (winnerId: number) => {
    // Check if there was a pending online tournament match in progress
    const pendingOnlineMatchStr = localStorage.getItem('pending_online_tournament_match');
    if (pendingOnlineMatchStr) {
      localStorage.removeItem('pending_online_tournament_match');
      try {
        const pending = JSON.parse(pendingOnlineMatchStr);
        const playerWon = winnerId === 1;

        if (playerWon) {
          // Grant rewards
          if (pending.rewards) {
            if (pending.rewards.coins) addCoins(pending.rewards.coins);
            if (pending.rewards.gems) addGems(pending.rewards.gems);
          }
          
          // Add experience points to active unlocked characters in the player team
          if (pending.playerTeamIds && Array.isArray(pending.playerTeamIds)) {
            const updated = [...unlockedCharacters];
            pending.playerTeamIds.forEach((charId: string) => {
              const pIdx = updated.findIndex((c) => c.id === charId);
              if (pIdx >= 0) {
                updated[pIdx] = addXpToCharacter(updated[pIdx], 300);
              }
            });
            setUnlockedCharacters(updated);
          }
        } else {
          // Consolation reward
          addCoins(50);
        }

        const winnerUserId = playerWon ? (auth.currentUser?.uid || 'player') : pending.opponentId;

        if (pending.isOfficial) {
          OnlineTournamentService.getInstance().reportOfficialMatchResult(
            pending.tourneyId,
            pending.isPhaseMode,
            pending.groupIndex || 0,
            pending.matchId,
            winnerUserId
          ).catch(err => console.error("Failed to report official match result:", err));
        } else {
          OnlineTournamentService.getInstance().reportCommunityMatchResult(
            pending.tourneyId,
            pending.matchId,
            winnerUserId,
            playerWon ? 2 : 0,
            playerWon ? 0 : 2
          ).catch(err => console.error("Failed to report community match result:", err));
        }
      } catch (e) {
        console.error("Error processing online tournament result:", e);
      }

      changeScene(SceneName.TOURNAMENT);
      return;
    }

    if (activeTournament) {
      // Check if player (P1) won
      const playerWon = winnerId === 1;
      const newTourneyState = { ...activeTournament };
      const playerMatch = TournamentManager.getNextPlayerMatch(newTourneyState);

      if (!playerMatch) return; // Should not happen

      if (playerWon) {
        // 1. Advance Player
        TournamentManager.setMatchWinner(
          newTourneyState,
          playerMatch.id,
          newTourneyState.playerTeamIds,
        );

        // 2. Rewards
        newTourneyState.rewards.coins += 200 * (playerMatch.round + 1);
        newTourneyState.rewards.xp += 100 * (playerMatch.round + 1);

        // 3. Check if Tournament Won (Finals)
        if (playerMatch.round === 2) {
          newTourneyState.isFinished = true;
          addCoins(newTourneyState.rewards.coins + 1000); // Bonus for winning
          // Add bonus XP to all characters in team
          const updated = [...unlockedCharacters];
          newTourneyState.playerTeamIds.forEach((charId) => {
            const pIdx = updated.findIndex((c) => c.id === charId);
            if (pIdx >= 0) {
              updated[pIdx] = addXpToCharacter(
                updated[pIdx],
                newTourneyState.rewards.xp + 500,
              );
            }
          });
          setUnlockedCharacters(updated);
        } else {
          // 4. Simulate rest of round & Advance Round
          const simulated = TournamentManager.simulateRound(newTourneyState);
          simulated.currentRound += 1;
          setActiveTournament(simulated);
          changeScene(SceneName.TOURNAMENT);
          return;
        }
      } else {
        // Player Lost
        const opponentTeamIds = TournamentManager.isSameTeam(
          playerMatch.p1Team!,
          newTourneyState.playerTeamIds,
        )
          ? playerMatch.p2Team
          : playerMatch.p1Team;
        TournamentManager.setMatchWinner(
          newTourneyState,
          playerMatch.id,
          opponentTeamIds!,
        );

        let simulated =
          TournamentManager.simulateRestOfTournament(newTourneyState);
        simulated.hasPlayerLost = true;
        simulated.isFinished = true;
        // Consolation prize
        addCoins(simulated.rewards.coins + 50);
        setActiveTournament(simulated);
        changeScene(SceneName.TOURNAMENT);
        return;
      }

      setActiveTournament(newTourneyState);
      changeScene(SceneName.TOURNAMENT); // Go back to show result
    }
  };

  const handleSurvivalEnd = (gameState: import("../types").GameState) => {
    // Check if player won
    if (gameState.winner === 1) {
      if (survivalWave >= 7) {
        // Player won the whole SURVIVAL mode
        addCoins(2500); // Grand prize Example
      } else {
        // Heal 10%
        const currentHp = gameState.p1Stats.hp;
        const maxHp = gameState.p1Stats.maxHp;
        // The rule says "Recupera 10% da vida atual (não máxima)"
        // If they meant 10% of current HP based on prompt exactly:
        const healAmount = currentHp * 0.1;
        const newHp = Math.min(Math.floor(currentHp + healAmount), maxHp);

        setSurvivalHp(newHp);
        setSurvivalWave((prev) => prev + 1);

        // We generate a new enemy that hasn't appeared yet or just randomly avoiding the last one
        if (pendingP1Team) {
          let finalP2Team = pendingP2Team;
          const available = BASE_CHARACTERS.filter(
            (c) =>
              !pendingP1Team.find((p1) => p1.id === c.id) &&
              (!finalP2Team || c.id !== finalP2Team[0]?.id),
          );
          if (available.length > 0) {
            finalP2Team = [
              available[Math.floor(Math.random() * available.length)],
            ];
          } else {
            finalP2Team = [BASE_CHARACTERS[0]];
          }
          setPendingP2Team(finalP2Team);
          createGameSession(
            pendingP1Team,
            finalP2Team,
            false,
            "SURVIVAL",
            newHp,
            survivalWave + 1,
          );
          startLoading(SceneName.VS_SCREEN);
        }
      }
    } else {
      // Game Over in Survival mode
    }
  };

  const [survivalWave, setSurvivalWave] = useState(1);
  const [survivalHp, setSurvivalHp] = useState<number | null>(null);

  // --- Character Selection Flow ---

  const beginCharacterSelection = (mode: GameMode) => {
    setSelectionMode(mode);
    setBattleMusic(null);
    try {
      localStorage.setItem('fighter_legend_selected_mode', mode);
    } catch (e) {
      console.error(e);
    }
    if (mode === "ONLINE") {
      changeScene(SceneName.MULTIPLAYER);
    } else if (mode === "BOSS") {
      setP1TeamSize(1);
      setP2TeamSize(1);
      setAiDifficulty("INSANE");
      changeScene(SceneName.BATTLE_CHAR_SELECT);
    } else if (mode === "SURVIVAL") {
      setP1TeamSize(1);
      setP2TeamSize(1);
      setAiDifficulty("MEDIUM");
      setSurvivalWave(1);
      setSurvivalHp(null);
      changeScene(SceneName.BATTLE_CHAR_SELECT);
    } else {
      changeScene(SceneName.TEAM_SIZE_SELECT);
    }
  };

  const completeCharacterSelection = (
    p1Team: CharacterData[],
    p2Team?: CharacterData[] | null,
    overrideMode?: GameMode,
  ) => {
    const activeMode = overrideMode || selectionMode;
    if (!activeMode) return;
    if (overrideMode && overrideMode !== selectionMode) {
      setSelectionMode(overrideMode);
    }

    const resolveRandomTeam = (team: CharacterData[], isP1: boolean): CharacterData[] => {
      const unlockedIds = new Set(effectiveUnlockedCharacters.map((c) => c.id));
      
      let pool = BASE_CHARACTERS.filter((c) => {
        if (c.id === "random") return false;
        const isLocked = activeMode === "TRAINING" ? false : !unlockedIds.has(c.id);
        return !isLocked;
      });

      if (pool.length === 0) {
        pool = BASE_CHARACTERS.filter((c) => c.id !== "random");
      }

      const selectedIds = new Set(team.filter((c) => c.id !== "random").map((c) => c.id));

      return team.map((char) => {
        if (char.id === "random") {
          const available = pool.filter((c) => !selectedIds.has(c.id));
          const chosenPool = available.length > 0 ? available : pool;
          const chosen = chosenPool[Math.floor(Math.random() * chosenPool.length)];
          selectedIds.add(chosen.id);

          return {
            ...chosen,
            assistType: char.assistType || "SPECIAL",
          };
        }
        return char;
      });
    };

    const finalP1Team = resolveRandomTeam(p1Team, true);
    const finalP2Team = p2Team ? resolveRandomTeam(p2Team, false) : p2Team;

    setPendingP1Team(finalP1Team);
    setPendingP2Team(finalP2Team || null);

    if (activeMode === "BOSS") {
      let finalBossTeam = finalP2Team;
      if (!finalBossTeam || finalBossTeam.length === 0) {
        const available = BASE_CHARACTERS.filter(
          (c) => c.id !== "random" && !finalP1Team.find((p1) => p1.id === c.id),
        );
        if (available.length > 0) {
          finalBossTeam = [
            available[Math.floor(Math.random() * available.length)],
          ];
        } else {
          finalBossTeam = [BASE_CHARACTERS.filter(c => c.id !== "random")[0]];
        }
      }
      createGameSession(
        finalP1Team,
        finalBossTeam as CharacterData[],
        false,
        activeMode,
      );
      startLoading(SceneName.VS_SCREEN);
      return;
    }

    if (
      activeMode === "ARCADE" ||
      activeMode === "SURVIVAL" ||
      activeMode === "TRAINING" ||
      activeMode === "LOCAL_VS" ||
      activeMode === "STORY"
    ) {
      changeScene(SceneName.STAGE_SELECT);
    } else if (activeMode === "TOURNAMENT") {
      // Tournament Start using the entire p1Team
      startTournament(finalP1Team.map((p) => p.id));
    } else if (activeMode === "ONLINE") {
      // Online Mode - Prepare for Matchmaking
      setSelectedOnlineCharId(finalP1Team[0].id);
      changeScene(SceneName.MULTIPLAYER);
    }
  };

  const finalizeMatchSetup = () => {
    if (!selectionMode || !pendingP1Team) return;

    if (selectionMode === "LOCAL_VS") {
      const opponentTeam = pendingP2Team || [pendingP1Team[0]];
      createGameSession(pendingP1Team, opponentTeam, false, "LOCAL_VS");
      startLoading(SceneName.VS_SCREEN);
    } else if (
      selectionMode === "ARCADE" ||
      selectionMode === "SURVIVAL" ||
      selectionMode === "BOSS"
    ) {
      let finalP2Team = pendingP2Team;

      if (!finalP2Team || finalP2Team.length === 0) {
        // Generate AI opponent team
        const isBoss = selectionMode === "BOSS";
        // Randomly pick opponents avoiding P1 characters
        const available = BASE_CHARACTERS.filter(
          (c) => !pendingP1Team.find((p1) => p1.id === c.id),
        );
        if (available.length > 0) {
          const opponent =
            available[Math.floor(Math.random() * available.length)];
          finalP2Team = [opponent];
        } else {
          finalP2Team = [BASE_CHARACTERS[0]];
        }
      }

      createGameSession(pendingP1Team, finalP2Team, false, selectionMode);
      startLoading(SceneName.VS_SCREEN);
    } else if (selectionMode === "TRAINING") {
      const opponentTeam = pendingP2Team || [pendingP1Team[0]];
      createGameSession(pendingP1Team, opponentTeam, true, "TRAINING");
      startLoading(SceneName.VS_SCREEN);
    }
  };

  // --- Reset Progress ---
  const resetGameProgress = () => {
    localStorage.clear();
    window.location.reload();
  };

  // --- Scene Management ---
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    // Handle side effect if fullscreen changed - call directly to preserve user gesture context
    if (
      newSettings.fullscreen !== undefined &&
      newSettings.fullscreen !== settings.fullscreen
    ) {
      const toggle = async () => {
        try {
          if (newSettings.fullscreen) {
            if (!document.fullscreenElement) {
              await document.documentElement.requestFullscreen();
            }
          } else {
            if (document.fullscreenElement) {
              await document.exitFullscreen();
            }
          }
        } catch (err) {
          console.warn("Fullscreen API interaction:", err);
        }
      };
      toggle();
    }
    if (newSettings.language !== undefined) {
      LanguageManager.getInstance().setLanguage(newSettings.language);
    }
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // --- Fullscreen Sync Effect (for manual Esc exit) ---
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      if (isFs !== settings.fullscreen) {
        setSettings((prev) => ({ ...prev, fullscreen: isFs }));
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [settings.fullscreen]);

  // --- BGM Centralized Scene-based Coordinator ---
  useEffect(() => {
    const playSceneBGM = async () => {
      if (
        currentScene === SceneName.PRELOAD ||
        currentScene === SceneName.SPLASH_SCREEN
      ) {
        return;
      }

      const audioManager = AudioManager.getInstance();

      if (currentScene === SceneName.PAUSE) {
        // When on Pause, do not change or restart the background music! It should continue playing smoothly.
        return;
      }

      // Stop all battle/voices/sfx on scene transition to prevent sound leakage
      audioManager.stopAllEffects();

      if (
        currentScene === SceneName.BATTLE_CHAR_SELECT ||
        currentScene === SceneName.CHARACTER_SELECT ||
        currentScene === SceneName.TEAM_SIZE_SELECT
      ) {
        await audioManager.playMusic("char-select");
      } else if (currentScene === SceneName.STAGE_SELECT) {
        // If we are on stage select and a battle track (live preview) was selected, let it run; otherwise default to char-select
        if (battleMusic) {
          await audioManager.playBGM(battleMusic);
        } else {
          await audioManager.playMusic("char-select");
        }
      } else if (
        currentScene === SceneName.VS_SCREEN ||
        currentScene === SceneName.BATTLE ||
        currentScene === SceneName.TRAINING
      ) {
        // Play the chosen battle music immediately and let it continue running continuously without any cuts!
        if (battleMusic) {
          await audioManager.playBGM(battleMusic);
        } else {
          await audioManager.playMusic("battle");
        }
      } else if (
        currentScene === SceneName.GACHA ||
        currentScene === SceneName.SUMMON
      ) {
        await audioManager.playMusic("summon");
      } else if (
        currentScene === SceneName.MAIN_MENU ||
        currentScene === SceneName.SINGLE_PLAYER_MENU ||
        currentScene === SceneName.SHOP ||
        currentScene === SceneName.TOURNAMENT ||
        currentScene === SceneName.MESSAGES ||
        currentScene === SceneName.STORY_MODE ||
        currentScene === SceneName.SOCIAL ||
        currentScene === SceneName.FRIENDS_MANAGEMENT ||
        currentScene === SceneName.PRIVATE_CHAT ||
        currentScene === SceneName.STRIKE_PASS ||
        currentScene === SceneName.RESULTS ||
        currentScene === SceneName.PROFILE ||
        currentScene === SceneName.PROFILE_EDIT ||
        currentScene === SceneName.EVOLUTION ||
        currentScene === SceneName.MISSIONS ||
        currentScene === SceneName.SETTINGS ||
        currentScene === SceneName.ADMIN_PANEL
      ) {
        await audioManager.playMusic("menu");
      } else {
        audioManager.stopBGM();
      }
    };

    playSceneBGM().catch((err) => {
      console.warn("[SceneContext] Failed to coordinate scene BGM:", err);
    });
  }, [currentScene, battleMusic]);

  const createGameSession = useCallback((
    p1Team: CharacterData[],
    p2Team: CharacterData[],
    isTraining: boolean = false,
    gameMode: GameMode = "ARCADE",
    initialP1Hp: number | null = null,
    waveNumber: number = 1,
    customOverrides?: {
      customGravityMultiplier?: number;
      customSpeedMultiplier?: number;
      customDamageMultiplier?: number;
      customWorldWidth?: number;
      customGroundHeight?: number;
    }
  ) => {
    if (engineInstance) engineInstance.detach();

    if (isTraining || gameMode === "TRAINING") {
      notifyMissionProgress("TRAINING_PLAY", 1);
    }

    setSelectedCharacter(p1Team[0]);
    const difficultyLevel = isTraining ? "MEDIUM" : aiDifficulty;
    const isP1Bot = matchMode === "CPU_VS_CPU";
    const newEngine = new GameEngine(
      (state) => {},
      p1Team,
      p2Team,
      isTraining,
      gameMode,
      p1TeamSize,
      p2TeamSize,
      difficultyLevel,
      timeLimit,
      stageTheme,
      isP1Bot,
    );
    if (initialP1Hp !== null) {
      newEngine.p1Team[0].hp = initialP1Hp;
    }
    newEngine.wave = waveNumber;
    newEngine.renderer.setStageOverrides(globalStageOverrides);

    if (customOverrides) {
      if (customOverrides.customGravityMultiplier !== undefined && customOverrides.customGravityMultiplier !== null) {
        newEngine.customGravityMultiplier = customOverrides.customGravityMultiplier;
      }
      if (customOverrides.customSpeedMultiplier !== undefined && customOverrides.customSpeedMultiplier !== null) {
        newEngine.customSpeedMultiplier = customOverrides.customSpeedMultiplier;
      }
      if (customOverrides.customDamageMultiplier !== undefined && customOverrides.customDamageMultiplier !== null) {
        newEngine.customDamageMultiplier = customOverrides.customDamageMultiplier;
      }
      if (customOverrides.customWorldWidth !== undefined && customOverrides.customWorldWidth !== null) {
        newEngine.worldWidth = customOverrides.customWorldWidth;
      }
      if (customOverrides.customGroundHeight !== undefined && customOverrides.customGroundHeight !== null) {
        newEngine.groundY = customOverrides.customGroundHeight;
      }
    }

    setEngineInstance(newEngine);
  }, [engineInstance, aiDifficulty, matchMode, p1TeamSize, p2TeamSize, timeLimit, stageTheme, globalStageOverrides]);

  const [previousScene, setPreviousScene] = useState<SceneName | null>(null);

  const setPaused = (paused: boolean) => {
    setIsPaused(paused);
    if (paused) {
      engineInstance?.stop();
      if (currentScene !== SceneName.PAUSE) {
        setPreviousScene(currentScene);
        changeScene(SceneName.PAUSE);
      }
    } else {
      engineInstance?.start();
      if (previousScene) {
        changeScene(previousScene);
        setPreviousScene(null);
      } else {
        changeScene(SceneName.VS_SCREEN); // Fallback
      }
    }
  };

  const destroyGameSession = () => {
    if (engineInstance) {
      engineInstance.detach();
      setEngineInstance(null);
    }
  };

  const changeScene = useCallback((scene: SceneName, options?: { skipLoading?: boolean }) => {
    // 🛡️ Security & Intent Constraints
    if (isOfflineMode && (scene === SceneName.PROFILE || scene === SceneName.PROFILE_EDIT)) {
      AudioManager.getInstance().playSFX("cancel");
      alert("Acesso ao perfil não permitido no Modo Offline.");
      return;
    }

    if (scene === SceneName.ADMIN_PANEL && !isAdmin) {
      AudioManager.getInstance().playSFX("cancel");
      alert("Acesso restrito: Apenas Administradores podem acessar esta área.");
      return;
    }

    if (FirstLaunchManager.isFirstLaunch() && scene !== SceneName.RESOURCE_DOWNLOAD) {
      setCurrentScene(SceneName.RESOURCE_DOWNLOAD);
      return;
    }

    if (scene === currentScene) return;

    // Skip loading overlay for in-game pause or explicit skip
    if (options?.skipLoading || scene === SceneName.PAUSE || currentScene === SceneName.PAUSE) {
      setCurrentScene(scene);
      return;
    }

    // Trigger full screen loading transition overlay
    setLoadingSceneTarget(scene);
    setIsSceneLoading(true);
  }, [isOfflineMode, isAdmin, currentScene]);

  const handleTransitionComplete = useCallback(() => {
    if (loadingSceneTarget) {
      setCurrentScene(loadingSceneTarget);
      setLoadingSceneTarget(null);
    }
    setIsSceneLoading(false);
  }, [loadingSceneTarget]);

  const startLoading = (target: SceneName) => {
    if (FirstLaunchManager.isFirstLaunch() && target !== SceneName.RESOURCE_DOWNLOAD) {
      setCurrentScene(SceneName.RESOURCE_DOWNLOAD);
      return;
    }
    changeScene(target);
  };

  const startBattleTransition = useCallback(() => {
    if (FirstLaunchManager.isFirstLaunch()) {
      setCurrentScene(SceneName.RESOURCE_DOWNLOAD);
      return;
    }
    // This is now only called by the initial PreloadScreen
    if (currentUser) {
      if (playerProfile) {
        setCurrentScene(SceneName.MAIN_MENU);
      } else {
        setCurrentScene(SceneName.PROFILE_CREATION);
      }
    } else {
      setCurrentScene(SceneName.NETWORK_SELECT);
    }
  }, [currentUser, playerProfile]);

  const createProfile = async (
    name?: string,
    avatarId?: string,
    backgroundId?: string,
  ) => {
    if (!currentUser) return;

    // Forced random name and default avatar per user request
    const adjectives = ["Guerreiro", "Lendário", "Supremo", "Místico", "Bravo", "Ágil", "Poderoso", "Imortal"];
    const nouns = ["Z", "Sayajin", "Dragão", "Combate", "Elite", "Mestre", "Goku", "Vegeta", "Piccolo", "Trunks"];
    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} ${Math.floor(100 + Math.random() * 899)}`;
    
    const finalName = randomName;
    const finalAvatarId = "avatar_1";
    const finalBackgroundId = backgroundId ? (backgroundId.startsWith('bg_') ? backgroundId : `bg_${backgroundId}`) : "bg_1";

    const userDocRef = doc(db, "users", currentUser.uid);
    const now = Date.now();
    const role = "ADMIN";

    const numericId = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString(); // 8 digit player ID

    // Random Initial Content Logic (Normal Rarity)
    const normalChars = BASE_CHARACTERS.filter(c => c.rarity === 'COMMON');
    const initialCharIds = [...normalChars].sort(() => 0.5 - Math.random()).slice(0, 2).map(c => c.id);

    const normalAvatars = SummonManager.GACHA_ITEMS.filter(i => i.category === 'Avatar' && i.rarity === 'COMMON');
    const initialAvatars = [...normalAvatars].sort(() => 0.5 - Math.random()).slice(0, 3);

    const normalStages = SummonManager.GACHA_ITEMS.filter(i => i.category === 'Cenario' && i.rarity === 'COMMON');
    const initialStages = [...normalStages].sort(() => 0.5 - Math.random()).slice(0, 1);

    const normalBackgrounds = SummonManager.GACHA_ITEMS.filter(i => i.category === 'Fundo' && i.rarity === 'COMMON');
    const initialBackgrounds = [...normalBackgrounds].sort(() => 0.5 - Math.random()).slice(0, 2);

    const initialUnlockedItems: Record<string, { quantity: number; isNew: boolean }> = {};
    [...initialAvatars, ...initialStages, ...initialBackgrounds].forEach(item => {
      initialUnlockedItems[item.id] = { quantity: 1, isNew: true };
    });

    // Ensure the forced avatar/background are unlocked
    const aid = `avatar_${finalAvatarId}`;
    if (!initialUnlockedItems[aid]) {
      initialUnlockedItems[aid] = { quantity: 1, isNew: false };
    }
    
    const bid = `bg_${finalBackgroundId}`;
    if (!initialUnlockedItems[bid]) {
      initialUnlockedItems[bid] = { quantity: 1, isNew: false };
    }

    const newProfileData = {
      userId: currentUser.uid,
      numericId: numericId,
      displayName: finalName,
      avatarId: finalAvatarId,
      backgroundId: finalBackgroundId,
      coins: 1000,
      gems: 50,
      bannerTokens: {
        banner_standard: 3,
        banner_legendary: 0,
        eternal_characters: 0,
        rare_items: 0
      },
      unlockedCharacterIds: initialCharIds,
      unlockedItems: initialUnlockedItems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      wins: 0,
      losses: 0,
      redeemedCodes: [],
      role: role,
      conductScore: 100,
      bio: 'SABOR "Ruim"',
      acceptedTerms: true,
      acceptedTermsAt: now,
      ranked: {
        br: RankService.getDefaultRankedData(),
        tdm: RankService.getDefaultRankedData(),
      },
      techniqueStats: {
        techniqueName: "Karatê Relâmpago",
        victories: 822,
        imageUrl: "/Assets/avatar/retrato/1.png",
      },
    };

    try {
      await setDoc(userDocRef, newProfileData);

      // Update Firebase Auth Display Name
      await updateFirebaseAuthProfile(currentUser, {
        displayName: name.toUpperCase(),
      });

      const newProfile: PlayerProfile = {
        playerId: currentUser.uid,
        numericId: numericId,
        name: name,
        avatarId: avatarId,
        createdDate: now,
        lastLoginDate: now,
        wins: 0,
        losses: 0,
        redeemedCodes: [],
        role: role as UserRole,
        isBanned: false,
        conductScore: 100,
        bio: 'SABOR "Ruim"',
        acceptedTerms: true,
        acceptedTermsAt: now,
        ranked: {
          br: RankService.getDefaultRankedData(),
          tdm: RankService.getDefaultRankedData(),
        },
        techniqueStats: {
          techniqueName: "Karatê Relâmpago",
          victories: 822,
          imageUrl: "/Assets/avatar/retrato/1.png",
        },
      };

      setPlayerProfile(newProfile);
      setCoins(1000);
      setBannerTokens({
        banner_standard: 3,
        banner_legendary: 0,
        eternal_characters: 0,
        rare_items: 0
      });
      setGems(50);
      setUnlockedCharacters([BASE_CHARACTERS[0], BASE_CHARACTERS[1]]);
      setMissions([
        ...MissionManager.generateDailies(),
        ...MissionManager.generateWeeklies(),
      ]);

      setCurrentScene(SceneName.MAIN_MENU);
    } catch (err) {
      console.error("Error creating profile:", err);
      throw err;
    }
  };

  const updateProfile = (
    name: string,
    avatarId: string,
    backgroundId?: string,
    bio?: string,
    activeTitle?: string,
    unlockedTitles?: string[],
  ) => {
    if (!playerProfile) return;
    const updated = {
      ...playerProfile,
      name,
      avatarId,
      backgroundId: backgroundId || playerProfile.backgroundId,
      bio: bio !== undefined ? bio : playerProfile.bio,
      activeTitle: activeTitle !== undefined ? activeTitle : playerProfile.activeTitle,
      unlockedTitles: unlockedTitles !== undefined ? unlockedTitles : playerProfile.unlockedTitles,
    };
    setPlayerProfile(updated);
    PlayerDatabase.saveProfile(updated);
  };

  const equipTitle = useCallback((titleId: string) => {
    if (!playerProfile) return;
    const updated = {
      ...playerProfile,
      activeTitle: titleId,
    };
    setPlayerProfile(updated);
    PlayerDatabase.saveProfile(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("fighter_profile_title", titleId);
    }
  }, [playerProfile]);

  const checkAndGrantTitles = useCallback((hallOfFameRank?: number) => {
    if (!playerProfile) return;
    const currentUnlocked = new Set<string>(playerProfile.unlockedTitles || ["warrior"]);
    const newlyEvaluated = TitleManager.evaluateUnlockedTitles(playerProfile, hallOfFameRank);

    let addedNew = false;
    const updatedUnlocked = [...currentUnlocked];

    newlyEvaluated.forEach((titleId) => {
      if (!currentUnlocked.has(titleId)) {
        currentUnlocked.add(titleId);
        updatedUnlocked.push(titleId);
        addedNew = true;
      }
    });

    if (addedNew) {
      const updated = {
        ...playerProfile,
        unlockedTitles: updatedUnlocked,
      };
      setPlayerProfile(updated);
      PlayerDatabase.saveProfile(updated);
    }
  }, [playerProfile]);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    return LanguageManager.getInstance().translate(key, variables);
  };

  const effectiveUnlockedCharacters = useMemo(() => {
    if (isAdmin || selectionMode === "TRAINING") {
      const unlockedIds = new Set(unlockedCharacters.map((c) => c.id));
      const missingChars = BASE_CHARACTERS.filter(
        (c) => !unlockedIds.has(c.id),
      ).map((c) => ({ ...c }));
      return [...unlockedCharacters, ...missingChars];
    }
    return unlockedCharacters;
  }, [isAdmin, unlockedCharacters, selectionMode]);

  return (
    <SceneContext.Provider
      value={{
        currentScene,
        changeScene,
        startLoading,
        startBattleTransition,
        isSceneLoading,
        loadingSceneTarget,
        handleTransitionComplete,
        settings,
        updateSettings,
        resetGameProgress,
        gameEngine: engineInstance,
        matchResult,
        setMatchResult,
        createGameSession,
        destroyGameSession,
        handleBattleEnd,
        handleSurvivalEnd,
        isPaused,
        setPaused,
        summonBattleResults,
        setSummonBattleResults,
        selectedCharacter,
        coins,
        gems,
        rouletteCoins,
        addCoins,
        spendCoins,
        addTickets,
        spendTickets,
        addGems,
        spendGems,
        roomTokens,
        addRoomTokens,
        spendRoomTokens,
        addRouletteCoins,
        spendRouletteCoins,
        bannerTokens,
        addTokensToBanner,
        spendTokensFromBanner,
        unlockedCharacters: effectiveUnlockedCharacters,
        unlockCharacter,
        unlockedItems,
        isItemUnlocked,
        unlockItem,
        markItemAsSeen,
        equippedSkins,
        setEquippedSkins,
        upgradeStat,
        buyCharacter,
        crystalBalances,
        addCrystals,
        evolveCharacter,
        distributeEvolutionPoints,
        playerProfile,
        createProfile,
        updateProfile,
        equipTitle,
        checkAndGrantTitles,
        redeemCode,
        missions,
        activeEvents,
        notifyMissionProgress,
        claimMissionReward,
        activeTournament,
        startTournament,
        exitTournament,
        selectionMode,
        matchMode,
        setMatchMode,
        p1TeamSize,
        p2TeamSize,
        aiDifficulty,
        timeLimit,
        stageTheme,
        battleMusic,
        setP1TeamSize,
        setP2TeamSize,
        setAiDifficulty,
        setTimeLimit,
        setStageTheme,
        setBattleMusic,
        beginCharacterSelection,
        completeCharacterSelection,
        pendingP1Team,
        pendingP2Team,
        finalizeMatchSetup,
        selectedOnlineCharId,
        showProfileId,
        setShowProfileId,
        autoJoinRoomId,
        setAutoJoinRoomId,
        currentUser,
        isAuthLoading,
        logout,
        deleteAccount,
        updateMatchStats,
        recordMatch,
        isAdmin,
        isAmbassador,
        isModerator,
        isVeteran,
        adminLogin,
        fetchAllUsers,
        updatePlayerProfileByAdmin,
        sendRewardToPlayer,
        friends,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
        fetchDiscoverablePlayers,
        inbox,
        markInMailRead,
        claimInMailReward,
        generatePromoCode,
        sendInMail,
        convertCrystalsToUniversal,
        convertUniversalToCrystals,
        globalMessages,
        sendGlobalMessage,
        isChatOpen,
        setIsChatOpen: toggleChat,
        currentPrivateChatId,
        setPrivateChatWith,
        privateMessages,
        sendPrivateMessage,
        isOfflineMode,
        setIsOfflineMode,
        t,
        battlePass,
        addPassXp,
        claimPassReward,
        buyBattlePass,
        updateGlobalStageOverride,
        globalEngineOverrides,
        updateGlobalEngineOverride,
        activeSession,
        activeLeaderboard,
        hallOfFameHistory,
        lastRankedReward,
        endCurrentSession,
        resetLastRankedReward,
        sessionConflict,
        setSessionConflict,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
};
