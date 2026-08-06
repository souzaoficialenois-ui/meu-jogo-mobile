
export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;    
  down: boolean;  
  jump: boolean;
  light: boolean;   
  medium: boolean;  
  heavy: boolean;   
  kiblast?: boolean;
  special: boolean; 
  block: boolean;
  dash: boolean;
  charge: boolean;
  attack: boolean;  
  ultimate: boolean;
  ultimate2?: boolean;
  ultimate3?: boolean;
  ultimate4?: boolean;
  special2?: boolean;
  special3?: boolean;
  special4?: boolean;
  special5?: boolean;
  special6?: boolean;
  special7?: boolean;
  special8?: boolean;
  special9?: boolean;
  special10?: boolean;
  tag: boolean;
  assist1: boolean;
  assist2: boolean;
  vanish: boolean;
  transform: boolean;
  transformTarget?: string;
  fusion: boolean;
  dragonRush: boolean;
  isJoystickActive?: boolean;
}

export enum IntroPhase {
  P1_INTRO = 'P1_INTRO',
  P2_INTRO = 'P2_INTRO',
  READY = 'READY',
  FIGHT = 'FIGHT'
}

export enum PlayerState {
  IDLE = 'parado',
  RUNNING = 'frente',
  WALK_BACKWARD = 'tras',
  CROUCH = 'agachado', 
  JUMPING = 'pulo',
  FALLING = 'caindo',
  LANDING = 'aterrisando',
  ATTACKING = 'ATTACKING',
  JUMP_ATTACK = 'JUMP_ATTACK',
  CROUCH_ATTACK = 'CROUCH_ATTACK',
  STUNNED = 'atordoado',
  HIT = 'hit_high_light',
  HIT_2 = 'hit_high_medium',
  HIT_3 = 'hit_high_hard',
  FALLING_HIT = 'caindo_dano',
  FALLING_HIT_GROUND = 'aterrisando_dano',
  LAUNCHED = 'lancado',
  AIR_RECOVERY = 'recuperacao_ar',
  GROUND_RECOVERY = 'recuperacao_chao',
  KNOCKED_DOWN = 'caido',
  BLOCKING = 'defesa',
  BLOCKING_CROUCH = 'defesa_agachado',
  BLOCKING_AIR = 'defesa_ar',
  GUARD_BREAK = 'quebra_guarda',
  DASH_START = 'DASH_START',
  DASHING = 'DASHING',
  DASH_END = 'DASH_END',
  QUICK_DASH = 'QUICK_DASH',
  CHARGING = 'CHARGING',
  CHARGE_START = 'carregando_ki_1',
  CHARGE_END = 'CHARGE_END',
  ULTIMATE = 'ULTIMATE',
  ULTIMATE_2 = 'ULTIMATE_2',
  INTRO = 'INTRO',
  VICTORY = 'vitoria',
  DEFEAT = 'derrota',
  TAG_IN = 'TAG_IN',
  TAG_OUT = 'TAG_OUT',
  STANDBY = 'STANDBY',
  ASSIST_ENTRY = 'ASSIST_ENTRY',
  ASSIST_ACTION = 'ASSIST_ACTION',
  ASSIST_EXIT = 'ASSIST_EXIT',
  VANISH = 'teleporte',
  VANISH_APPEAR = 'teleporte_aparecer',
  TRANSFORM = 'TRANSFORM',
  SUPER_DASH = 'super_dash_1',
  DRAGON_RUSH = 'dragon_rush_1',
  DRAGON_COMBO = 'dragon_dash_3',
  DRAGON_DASH_FOLLOW = 'dragon_dash_2',
  REFLECT = 'REFLECT',
  SPARKING = 'SPARKING',
  MUI_DODGE = 'INSTINTO',
  FUSION = 'FUSION',
  DEFUSION = 'DEFUSION',
  DETRANSFORM = 'DETRANSFORM',
  DOUBLE_TAP = 'DOUBLE_TAP',
  GRABBED = 'GRABBED',
  // Global Hit and Recovery States
  HIT_AIR = 'HIT_AIR',
  HIT_AIR_FALL = 'HIT_AIR_FALL',
  HIT_BOUNCE = 'HIT_BOUNCE',
  HIT_GRAB = 'HIT_GRAB',
  HIT_GROUND_STUNNED = 'HIT_GROUND_STUNNED',
  HIT_GROUND_CRASH = 'HIT_GROUND_CRASH',
  HIT_GROUND_RECOVER = 'HIT_GROUND_RECOVER',
  HIT_GROUND_PUSH_UP = 'HIT_GROUND_PUSH_UP',
  HIT_GROUND_LAUNCH = 'HIT_GROUND_LAUNCH'
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  guard: number;
  maxGuard: number;
  ki: number;
  maxKi: number;
  combo: number;
  portraitUrl?: string; // Add portrait URL for tag UI
  name?: string;
  tagCooldown?: number; // Add tag cooldown per player
  assistCooldown?: number;
  assistType?: AssistType;
  assistCost?: number;
}

export enum DummyMode {
  IDLE = 'IDLE',
  BLOCK = 'BLOCK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  MIRROR = 'MIRROR'
}

export enum CpuAction {
  OFF = 'OFF',
  DEFEND_ALWAYS = 'DEFEND_ALWAYS',
  COUNTER_ATTACK = 'COUNTER_ATTACK',
  REFLECT_BEAM = 'REFLECT_BEAM',
  FULL_AI = 'FULL_AI'
}

export enum CounterAttackType {
  LIGHT = 'LIGHT',
  MEDIUM = 'MEDIUM',
  HEAVY = 'HEAVY',
  SPECIAL = 'SPECIAL',
  ULTIMATE = 'ULTIMATE'
}

export interface DebugInfo {
  p1Pos: Vector2;
  p2Pos: Vector2;
  distance: number;
}

export type GameMode = 'ARCADE' | 'TRAINING' | 'TOURNAMENT' | 'ONLINE' | 'SURVIVAL' | 'BOSS' | 'SUMMON' | 'STORY' | 'LOCAL_VS';

export type BattleEndPhase = 'NONE' | 'DEFEAT_ANIM' | 'VICTORY_ANIM' | 'RESULT_SHOW' | 'FINISHED';

export interface GameState {
  p1Stats: PlayerStats;
  p2Stats: PlayerStats;
  p1Team?: PlayerStats[];
  p2Team?: PlayerStats[];
  p1ActiveIdx?: number;
  p2ActiveIdx?: number;
  p1FusionTimer?: number;
  p2FusionTimer?: number;
  p1HeavyCooldown?: number;
  p2HeavyCooldown?: number;
  p1DashCooldown?: number;
  p1ProjectileCooldown?: number;
  p1DragonRushCooldown?: number;
  timer: number;
  introTimer?: number;
  introPhase?: IntroPhase;
  introSubtitle?: string;
  isLoading?: boolean;
  isUlting?: boolean;
  isKOSwapActive?: boolean;
  koSequenceActive?: boolean;
  gameOver: boolean;
  winner: number | null;
  debug?: DebugInfo;
  gameMode?: GameMode;
  wave?: number;
  matchStats?: {
    p1: {
      name?: string;
      portraitUrl?: string;
      damageDealt: number;
      maxCombo: number;
      totalComboHits?: number;
      specialAttacksUsed?: number;
      ultimatesUsed?: number;
      finalHealthPct?: number;
    };
    p2: {
      name?: string;
      portraitUrl?: string;
      damageDealt: number;
      maxCombo: number;
      totalComboHits?: number;
      specialAttacksUsed?: number;
      ultimatesUsed?: number;
      finalHealthPct?: number;
    };
  };
  isBeamClashActive?: boolean;
  beamClashVisualProgress?: number;
  beamClashProgress?: number;
  beamClashTimer?: number;
  beamClashP1FacingRight?: boolean;
  battleEndPhase?: BattleEndPhase;
  battleEndResultText?: string;
  battleEndResultType?: 'WIN' | 'LOSE' | 'DRAW';
}

export enum SceneName {
  RESOURCE_DOWNLOAD = 'RESOURCE_DOWNLOAD',
  PRELOAD = 'PRELOAD',
  SPLASH_SCREEN = 'SPLASH_SCREEN',
  PROFILE_CREATION = 'PROFILE_CREATION',
  PROFILE_EDIT = 'PROFILE_EDIT',
  MESSAGES = 'MESSAGES',
  MAIN_MENU = 'MAIN_MENU',
  SINGLE_PLAYER_MENU = 'SINGLE_PLAYER_MENU', 
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  VS_SCREEN = 'VS_SCREEN',
  BATTLE = 'BATTLE',
  TRAINING = 'TRAINING',
  MULTIPLAYER = 'MULTIPLAYER',
  SHOP = 'SHOP',
  TOURNAMENT = 'TOURNAMENT',
  PAUSE = 'PAUSE',
  SETTINGS = 'SETTINGS',
  GACHA = 'GACHA',
  EVOLUTION = 'EVOLUTION',
  SUMMON = 'SUMMON',
  MISSIONS = 'MISSIONS',
  HUD_EDITOR = 'HUD_EDITOR',
  AUTH = 'AUTH',
  NETWORK_SELECT = 'NETWORK_SELECT',
  ADMIN_PANEL = 'ADMIN_PANEL',
  SOCIAL = 'SOCIAL',
  FRIENDS_MANAGEMENT = 'FRIENDS_MANAGEMENT',
  PRIVATE_CHAT = 'PRIVATE_CHAT',
  STRIKE_PASS = 'STRIKE_PASS',
  BATTLE_CHAR_SELECT = 'BATTLE_CHAR_SELECT',
  RESULTS = 'RESULTS',
  ANIMATION_PREVIEW = 'ANIMATION_PREVIEW',
  PROFILE = 'PROFILE',
  TEAM_SIZE_SELECT = 'TEAM_SIZE_SELECT',
  STAGE_SELECT = 'STAGE_SELECT',
  STORY_MODE = 'STORY_MODE',
  SIDE_SELECTION = 'SIDE_SELECTION',
  CREDITS = 'CREDITS',
  HALL_OF_FAME = 'HALL_OF_FAME',
  WAREHOUSE = 'WAREHOUSE',
  TITLES_GALLERY = 'TITLES_GALLERY'
}

export type BattlePassTier = 'FREE' | 'ELITE' | 'PREMIUM';

export interface BattlePassLevel {
    level: number;
    xpRequired: number;
    freeReward: MessageReward | null;
    eliteReward: MessageReward | null;
    premiumReward: MessageReward | null;
}

export interface PassTier {
    level: number;
    xpRequired: number;
    freeReward: MessageReward | null;
    premiumReward: MessageReward | null;
}

export interface BattlePassData {
    currentLevel: number;
    currentXp: number;
    tier: BattlePassTier;
    claimedRewards: string[];
}

export interface InMail {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  content: string;
  timestamp: number;
  read: boolean;
  reward?: {
    type: 'COIN' | 'GEM' | 'TICKET';
    amount: number;
    claimed: boolean;
  };
}

export interface PromoCode {
  code: string;
  reward: {
    type: 'COIN' | 'GEM' | 'TICKET';
    amount: number;
  };
  usedBy: string[]; // List of UIDs who used it
  isSingleUse: boolean; // If true, only one person total can use it. If false, everyone can use it once.
  expiresAt: number;
}

export interface FriendRelation {
  friendId: string;
  name: string;
  avatarId: string;
  title?: string;
  rankTier?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REQUESTED';
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  senderAvatar?: string;
  senderTitle?: string;
  senderRankTier?: string;
  text: string;
  timestamp: number;
}

export interface HudElement {
  id: string;
  x: number;        // posição horizontal (0 a 1)
  y: number;        // posição vertical (0 a 1)
  width: number;    // largura relativa (0 a 1)
  height: number;   // altura relativa (0 a 1)
  rotation: number; // rotação em graus
}

export interface HUDLayout {
  dpadX: number;
  dpadY: number;
  actionX: number;
  actionY: number;
  scale: number;
  opacity: number;
}

export type ControlType = 'BUTTONS'; 

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
  graphicsQuality: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'CUSTOM';
  particlesEnabled: boolean;
  postProcessingEnabled?: boolean;
  shadowsEnabled?: boolean;
  shadowType?: 'NONE' | 'OVAL' | 'SILHOUETTE';
  lightingType?: 'NONE' | 'BASIC' | 'ADVANCED' | 'DYNAMIC';
  particleDensity?: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX';
  fullAuras?: boolean;
  energyDistortion?: boolean;
  effectsLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';
  weatherEffects?: boolean;
  stageDestruction?: boolean;
  screenShakeEnabled: boolean;
  showDamageNumbers: boolean;
  buttonSensitivity: number;
  enableMultiTouch: boolean;
  disableMobileUI?: boolean;
  instantRadialMenu?: boolean;
  radialMenuDelay: number;
  hudLayout: HUDLayout;
  p1Color?: string;
  p2Color?: string;
  language: string;
  controlType: ControlType;
  notificationsEnabled?: boolean;
  hudVisible?: boolean;
  uiVolume?: number;
  voiceVolume?: number;
  keybindings?: Record<string, string>;
  p2Keybindings?: Record<string, string>;
  gamepadBindings?: Record<string, number>;
  subtitlesEnabled?: boolean;
  subtitlesBackgroundEnabled?: boolean;
  subtitlesShowSpeakerName?: boolean;
  subtitlesFontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  spatialAudioMode?: 'DISABLED' | 'NORMAL' | 'ADVANCED';
  glowQuality?: 'DISABLED' | 'NORMAL' | 'ULTRA';
  auraGlowQuality?: 'DISABLED' | 'NORMAL' | 'ULTRA';
  touchEffectInBattle?: boolean;
  touchEffectColor?: 'RANDOM' | 'GOLD' | 'BLUE' | 'ROSE' | 'GREEN' | 'PURPLE' | 'RED' | 'SILVER';
}

export interface RPGStats {
  attack: number;
  defense: number;
  speed: number;
}

export type RarityTier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ETERNAL';

export interface AnimationFrameData {
    imageUrl: string;
    frames: number;
    frameWidth: number;
    frameHeight: number;
    row?: number;
    startFrame?: number; 
    speed?: number;
    loop?: boolean;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    originX?: number; // Origin point relative to the Character Hitbox
    originY?: number;
    startImageUrl?: string;
    endImageUrl?: string;
    centerX?: number; // Center pivot point relative to the Sprite Animation
    centerY?: number;
    createsBeam?: string; // ID of the Beam Family this animation creates (e.g., 'SUPER_ESPECIAL_BEAM_1')
    createsBeamUlt?: string; // ID of the Beam Family this animation creates exclusively in ultimate (avoids duplication)
    beamConfig?: CharacterBeamOverrides; // Character-specific visual overrides for this beam when spawned
    projectileConfig?: CharacterBeamOverrides; // Character-specific visual overrides for this projectile when spawned
    projectileId?: string; // ID of the Custom Projectile for non-beams
    createsProjectile?: string; // ID of created projectile
    specialAnim?: string;
    createsBeamCharacterId?: string; // ID of the character the beam belongs to (if different from current char)
    isVertical?: boolean;
    isGif?: boolean;
    useGifDelay?: boolean;
    kiOriginX?: number;
    kiOriginY?: number;
    cameraFocusX?: number; // Camera focus point
    cameraFocusY?: number; // Camera focus point
    cameraSpeed?: number; // Camera smoothing factor (lerp speed)
    cameraRotation?: number; // Camera rotation in degrees
    zoomType?: 'IMMEDIATE' | 'ZOOM_IN' | 'ZOOM_OUT' | 'DEFAULT_CENTER' | 'ZOOM_PULSE' | 'ZOOM_IN_OUT' | 'ZOOM_BOUNCE' | 'ZOOM_DRAMATIC' | 'ZOOM_SHAKE' | 'ZOOM_IMPACT';
    zoomAmount?: number;
    zoomSpeed?: number;
    freezeFrame?: number; // Frame index to pause on
    damageFrames?: number[]; // Array of frame indices where damage is dealt
    dealsDamage?: boolean;
    baseDamage?: number; // Custom damage value for this animation
    fullScreen?: boolean; // Whether the sprite should fill the entire screen, respecting zoom
    moveY?: number; // Y movement for this animation
    velocityJump?: Vector2; // Velocity burst for this animation

    // NEW ADM TOOLS FUNCTIONS
    shakeFrames?: number[]; // Screen shake trigger frames
    shakeIntensity?: number; // How strong the screen shakes
    sfxName?: string; // Sound effect to play
    sfxFrame?: number; // Frame to play sound
    dashFrames?: number[]; // Specific frames where character moves forward
    dashSpeed?: number; // Dash velocity
    invincible?: boolean; // Invulnerability window
    trailEffect?: boolean; // Draw ghost trail
    trailColor?: string; // Color of ghost trail
    
    // NEW ANIMATION VIEW FUNCTIONS
    hitstopFrames?: number; // How many game frames to apply hitstop logic when hit lands
    rotation?: number; // Base rotation of the sprite in degrees
    flashFrames?: number[]; // Frames that flash screen
    flashColor?: string; // Hex color for flash
    beamSpacing?: number; // Distance between beam pattern repetitions
    auraConfigKey?: string; // Custom Aura Key override for this animation state
    effectConfigKey?: string; // Custom Effect (VFX) Key override for this animation state
    
    // MUGEN / SUPER SPECIAL SYSTEMS
    mugenEffect?: boolean; // Enable Mugen style cinematic super
    mugenPortraitUrl?: string; // Character portrait to slide in
    superDarkness?: boolean; // Darken background during animation
    mugenText?: string; // Text to display (e.g. "SUPER ARTS")
    mugenColor?: string; // Main color of the effect

    // SCENE & CUTSCENE EDITING (NEW)
    opponentPosX?: number; // Opponent relative X during cutscene
    opponentPosY?: number; // Opponent relative Y during cutscene
    opponentScale?: number; // Opponent relative scale
    opponentAnim?: string; // Animation state for opponent
    opponentPosImmediate?: boolean; // Whether the opponent snaps to position immediately
    playerTargetPosX?: number; // Player position relative to opponent X
    playerTargetPosY?: number; // Player position relative to opponent Y
    throwOppVelocityX?: number; // X Velocity applied to opponent on hit
    throwOppVelocityY?: number; // Y Velocity applied to opponent on hit
    sceneObjects?: { id: string; x: number; y: number; scale: number; rotation?: number; opacity?: number; anim?: string; type: 'PROP' | 'VFX'; imageUrl?: string; isGif?: boolean; layer?: 'FRONT' | 'BACK'; configKey?: string }[];
    sceneBackgroundUrl?: string; // Cutscene background
    sceneBackgroundColor?: string; // Cutscene background color overlay
    sceneDialogueText?: string; // Cutscene dialogue text
    sceneDialogueName?: string; // Cutscene dialogue speaker name
    sceneDialogueAvatar?: string; // Avatar for the dialogue
    
    projectileWidth?: number;
    projectileHeight?: number;
    projectileOffsetX?: number;
    projectileOffsetY?: number;
    projectileScale?: number;
    projectileSpeed?: number;
    projectileColor?: string;
    
    // MULTIPLE ATTACK BOXES
    attackBoxes?: {
        width: number;
        height: number;
        offsetX: number;
        offsetY: number;
        damageFrames?: number[];
    }[];
    
    // COLLISION SYSTEM
    hitboxWidth?: number;
    hitboxHeight?: number;
    hitboxOffsetX?: number;
    hitboxOffsetY?: number;
    attackBoxWidth?: number;
    attackBoxHeight?: number;
    attackBoxOffsetX?: number;
    attackBoxOffsetY?: number;
}

export interface MovePhase {
    animation: string;
    duration?: number; // in frames. If 0 or undefined, depends on animation completion
    hitboxActive?: boolean;
    hitboxStartFrame?: number;
    hitboxEndFrame?: number;
    damage?: number;
    moveX?: number; // relative movement per frame
    moveY?: number;
    velocityJump?: Vector2; // initial velocity burst on phase start
    sfxName?: string;
    sfxFrame?: number;
    vfxName?: string;
    vfxFrame?: number;
    canCancel?: boolean;
    transitionTo?: string; // name of next phase, or null to end
    onHitTransition?: string; // branch if hit lands
    homing?: boolean; // dash towards opponent like super dash
    suspendOpponent?: boolean; // freeze opponent in air on hit
    suspendGravity?: boolean; // suspend attacker's gravity during this phase
    knockdown?: boolean; // knock down opponent on hit
    snapOpponent?: boolean; // move opponent to character's attack position
    launchOpponent?: Vector2; // diagonal launch force on hit
    shakeIntensity?: number;
    shakeFrame?: number;
    createsBeam?: string;
    projectile?: string;
    armor?: boolean; // If true, player doesn't flinch during this phase
    
    // Custom Attack Box for this phase
    attackBoxWidth?: number;
    attackBoxHeight?: number;
    attackBoxOffsetX?: number;
    attackBoxOffsetY?: number;
}

export interface PhasedMove {
    id: string;
    phases: MovePhase[];
}

export interface SpriteConfig {
    defaultScale: number;
    animations: Partial<Record<string, AnimationFrameData>>; 
    iconUrl?: string;
    portraitUrl?: string;
    kiOriginX?: number;
    kiOriginY?: number;
    hitboxWidth?: number;
    hitboxHeight?: number;
    hitboxOffsetX?: number;
    hitboxOffsetY?: number;
    animationSequences?: Record<string, string[]>;
}

export interface SpecialSkill {
  id: string;
  name: string;
  type: 'PRIMARY' | 'PASSIVE' | 'EVO';
  description: string;
  icon?: string;
}

export interface SkinData {
  id: string;
  name: string;
  rarity: RarityTier;
  description: string;
  portraitUrl?: string;
  spriteConfig?: SpriteConfig;
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface CharacterBeamOverrides {
    name?: string;
    rotation?: number;
    start?: Partial<AnimationFrameData>;
    middle?: Partial<AnimationFrameData>;
    end?: Partial<AnimationFrameData>;
    // Customização Visual do Beam para o personagem
    color?: string;
    beamOpacity?: number;
    beamBrightness?: number;
    beamHueRotate?: number;
    beamSaturate?: number;
    beamContrast?: number;
}

export interface CharacterData {
  id: string;
  name: string;
  maxHp?: number;
  color: string;
  rarity: RarityTier;
  portraitUrl?: string;
  tags: string[];
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  availablePoints: number;
  statUpgrades?: { hp: number; attack: number; defense: number; speed: number; };
  stats: RPGStats;
  spriteConfig?: SpriteConfig;
  skills?: SpecialSkill[];
  skins?: SkinData[];
  currentSkinId?: string;
  transformTo?: string[];
  detransformTo?: string[];
  introText?: string;
  assistType?: AssistType;
  progressionUnlocks?: { level: number; name: string; description: string; type: 'SKILL' | 'TRANSFORM' | 'SKIN' | 'STAT_BOOST'; icon?: string }[];
  isLocked?: boolean;
  beamOverrides?: Record<string, CharacterBeamOverrides>;
  projectileOverrides?: Record<string, CharacterBeamOverrides>;
  phasedMoves?: Record<string, PhasedMove>;
  evolutionLevel?: number;
  evolutionCrystals?: number;
}

export type UserRole = 'PLAYER' | 'VETERAN' | 'AMBASSADOR' | 'MODERATOR' | 'ADMIN';

export type AssistType = "SPECIAL" | "SPECIAL_2" | "SPECIAL_3" | "SPECIAL_4" | "SPECIAL_5" | "SPECIAL_6";

export type RankTier = 'APPRENTICE' | 'FIGHTER' | 'WARRIOR' | 'ELITE' | 'SUPER_ELITE' | 'LEGEND' | 'GOD_OF_DESTRUCTION' | 'ANGEL' | 'ZENO';

export interface RankedData {
  rank: string; // e.g. Aprendiz, Guerreiro, Zeno
  subRank: string; // e.g. V, IV, I (or empty for high elos)
  points: number;
  bestRankName: string; 
  tier?: RankTier;
  winStreak?: number;
  maxWinStreak?: number;
  totalMatches?: number;
  winRate?: number; // 0 to 100
  lastMatchTimestamp?: number;
  topCharacterId?: string;
  seasonRewardsClaimed?: boolean;
}

export interface InventoryItem {
    id: string;
    quantity: number;
    isNew: boolean;
}

export interface CharacterCombatStats {
  wins: number;
  losses: number;
  matches: number;
  koCount?: number;
  maxCombo?: number;
  lastUsedTimestamp?: number;
}

export interface PlayerProfile {
  id?: string;
  playerId: string; // GLOBAL UNIQUE ID (UUID)
  numericId?: string; // 4+ DIGIT DISPLAY ID
  name: string;
  avatarId: string;
  backgroundId?: string;
  createdDate: number;
  lastLoginDate: number;
  redeemedCodes?: string[];
  wins: number;
  losses: number;
  characterStats?: Record<string, CharacterCombatStats>;
  coins?: number;
  gems?: number;
  unlockedCharacterIds?: string[];
  role?: UserRole;
  isBanned?: boolean;
  bio?: string;
  ranked?: {
    br: RankedData;
    tdm: RankedData;
  };
  weaponStats?: {
    weaponName: string;
    kills: number;
    imageUrl: string;
  };
  techniqueStats?: {
    techniqueName: string;
    victories: number;
    imageUrl: string;
  };
  conductScore: number;
  unlockedTitles?: string[];
  activeTitle?: string;
  acceptedTerms?: boolean;
  acceptedTermsAt?: number;
}

export interface MessageReward {
    type: 'COIN' | 'TICKET' | 'GEM' | 'XP' | 'CHARACTER' | 'CRYSTAL';
    amount: number;
    data?: string; // Character ID for Crystals or specific item
    claimed: boolean;
}

export interface SystemMessage {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  reward?: MessageReward;
}

export interface Banner {
    id: string;
    title: string;
    description: string;
    color: string;
    featuredCharId: string;
    type: 'STANDARD' | 'EVENT' | 'LEGENDARY' | 'EPIC';
    img?: string;
}

export type MissionType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASONAL' | 'SPECIAL' | 'LAUNCH' | 'ANNIVERSARY' | 'COLLAB' | 'COMPETITIVE' | 'WEEKEND' | 'EVENT';
export type MissionAction = 'BATTLE_PLAY' | 'BATTLE_WIN' | 'TRAINING_PLAY' | 'SUMMON' | 'EVOLVE_STAT' | 'LOGIN' | 'DAMAGE_DEALT' | 'SUPER_EXECUTE' | 'ULTIMATE_EXECUTE' | 'TAG_EXECUTE' | 'STORY_COMPLETE' | 'SURVIVAL_COMPLETE' | 'BOSS_DEFEAT' | 'REACH_LEVEL';
export type RewardType = 'COIN' | 'TICKET' | 'GEM' | 'CRYSTAL' | 'CHARACTER' | 'AVATAR' | 'AVATAR_BG' | 'STAGE' | 'TITLE' | 'FRAME' | 'EMOJI' | 'XP' | 'BUNDLE' | 'ROOM_TOKEN';

export interface Mission {
    id: string;
    type: MissionType;
    actionType: MissionAction;
    description: string;
    target: number;
    current: number;
    rewardType: RewardType;
    rewardAmount: number;
    rewardData?: string; 
    claimed: boolean;
    expiresAt?: number;
    eventId?: string;
}

export interface StageData {
    id: string;
    name: string;
    desc: string;
    color: string;
    img: string;
    scale?: number;
    yOffset?: number;
    xOffset?: number;
    worldWidth?: number;
    groundY?: number;
    cameraOffsetY?: number;
    limitLeft?: number;
    limitRight?: number;
    limitTop?: number;
    limitBottom?: number;
    physLimitLeft?: number;
    physLimitRight?: number;
    isLocked?: boolean;
    effectConfigKey?: string; // Custom Effect (VFX) Key override for this stage
    groundDestroyedConfigKey?: string; // Custom Effect (VFX) Key override for ground destruction
    groundDestroyedConfig?: {
        imageUrl: string;
        frameWidth: number;
        frameHeight: number;
        frames: number;
        speed: number;
        scale: number;
        loop: boolean;
        isGif: boolean;
        offsetX?: number;
        offsetY?: number;
        color?: string;
        effectHueRotate?: number;
        effectSaturate?: number;
        effectBrightness?: number;
        effectContrast?: number;
    };
    layers?: {
        img: string;
        parallaxFactorX?: number;
        parallaxFactorY?: number;
        scale?: number;
        yOffset?: number;
        xOffset?: number;
    }[];
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    startsAt: number;
    endsAt: number;
    bannerUrl: string;
    color: string;
    status: 'ACTIVE' | 'SCHEDULED' | 'FINISHED';
    participationConditions?: string;
    missions: string[];
}

export type ParticleType = 'DUST' | 'SPARK' | 'HIT' | 'ENERGY' | 'AURA' | 'BLOCK' | 'SPEED_LINES' | 'IMPACT' | 'IMPACT_SPARK' | 'SMOKE';

export interface VisualEffect {
    id: number;
    x: number;
    y: number;
    imageUrl: string;
    frames: number;
    animFrame: number;
    animTimer: number;
    loop: boolean;
    scale: number;
    facingRight: boolean;
    active: boolean;
    offsetY?: number;
    offsetX?: number;
    frameWidth?: number;
    frameHeight?: number;
    animSpeed?: number;
    isGif?: boolean;
    ownerId?: "p1" | "p2";
    type?: "CHARGE_DUST" | "JUMP_DUST" | "DASH_DUST" | "EXPLOSION" | "FULL_SCREEN_DUST" | string;
    configKey?: string; // Reference to EffectConfigKeyManager registry
    fullScreen?: boolean; // Whether the effect should ignore camera zoom/position
    layer?: 'FRONT' | 'BACK'; // Whether to render behind or in front of characters
    vy?: number;
    rotation?: number;
    alpha?: number;
    life?: number;
    maxLife?: number;
}

export interface Particle {
    id: number;
    type: ParticleType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    rotation: number;
    rotSpeed: number;
    alpha: number;
}

export interface TournamentMatch {
    id: string;
    round: number; 
    p1Team: string[] | null;
    p2Team: string[] | null;
    winnerTeam: string[] | null;
    nextMatchId: string | null;
}

export interface TournamentState {
    id: string;
    title: string;
    matches: TournamentMatch[];
    currentRound: number;
    playerTeamIds: string[];
    isFinished: boolean;
    hasPlayerLost: boolean;
    rewards: {
        coins: number;
        xp: number;
    };
    teamSize: number;
}

export interface NetworkPacket {
    type: 'DISCOVER' | 'WELCOME' | 'INPUT' | 'SYNC' | 'START_GAME' | 'READY_CHECK' | 'PING' | 'PONG';
    payload?: any;
    senderId: string;
    senderProfile?: PlayerProfile; // Carry identity info
}

export interface HallOfFameEntry {
  rank: number;
  userId: string;
  name: string;
  avatarId: string;
  points: number;
  wins: number;
  losses: number;
  title: string;
  characters: string[]; // Character IDs used in season
}

export interface HallOfFameSeason {
  sessionId: string;
  sessionName: string;
  completedAt: number;
  topPlayers: HallOfFameEntry[];
}

export interface CompetitiveSession {
  id: string;
  name: string;
  status: 'ACTIVE' | 'COMPLETED';
  startDate: number;
  endDate: number;
  description: string;
}
