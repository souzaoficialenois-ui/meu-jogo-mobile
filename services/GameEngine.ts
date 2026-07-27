import { MoveManager } from "./MoveManager";
import { UltimateManager } from "./UltimateManager";
import { BattleStateManager } from "../src/engine/dialogue/BattleStateManager";
import { GroundEnergyManager } from "./GroundEnergyManager";
import { VoiceQueue } from "../src/engine/dialogue/VoiceQueue";
import { BattleEvent } from "../src/engine/dialogue/types";
import { CombatManager } from "./CombatManager";
import { CharacterStateMachine, SkillType } from "./CharacterStateMachine";
import { ClashManager } from "./ClashManager";
import { PhysicsManager } from "./PhysicsManager";
import { GameRenderer } from "./GameRenderer";
import { MuiSpecialManager } from "./MuiSpecialManager";
import {
  Vector2,
  Rect,
  PlayerState,
  GameState,
  DummyMode,
  CpuAction,
  CounterAttackType,
  CharacterData,
  InputState,
  GameMode,
  IntroPhase,
  StageData,
} from "../types";
import { STAGE_DB } from "../constants/StageDatabase";
import { CHARACTER_INTROS } from "../personagens/IntroConfigs";
import {
  GRAVITY,
  FRICTION,
  MOVE_SPEED,
  JUMP_FORCE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  WORLD_HEIGHT,
  MAX_HP,
  ATTACK_COOLDOWN,
  ATTACK_DURATION,
  STUN_DURATION,
  KNACKBACK_X,
  KNACKBACK_Y,
  KNOCKBACK_FINISHER_X,
  KNOCKBACK_FINISHER_Y,
  SPAWN_CENTER_OFFSET,
  ATTACK_WIDTH,
  ATTACK_HEIGHT,
  ATTACK_OFFSET_X,
  ATTACK_OFFSET_Y,
  SPRITE_IDLE_URL,
  SPRITE_FRAME_SIZE,
  ANIMATION_SPEED,
  SPRITE_SCALE,
  MAX_COMBO,
  COMBO_WINDOW,
  DAMAGE_TIER_1,
  DAMAGE_TIER_2,
  DAMAGE_TIER_3,
  STAT_DMG_MULT,
  STAT_DEF_MULT,
  STAT_SPD_MULT,
  BACKGROUND_COLOR,
  GROUND_COLOR,
  MAX_GUARD,
  GUARD_REGEN_RATE,
  GUARD_REGEN_DELAY,
  GUARD_BREAK_STUN,
  CHIP_DAMAGE_PERCENT,
  MAX_KI,
  KI_CHARGE_RATE,
  KI_GAIN_ON_HIT,
  KI_GAIN_ON_DAMAGE,
  KI_COST_SPECIAL,
  KI_BLAST_COST,
  KI_BLAST_SPEED,
  KI_BLAST_DAMAGE,
  KI_BLAST_COOLDOWN,
  MAX_PROJECTILES,
  PROJECTILE_SIZE,
  STUN_DURATION_LIGHT,
  BASE_CHARACTERS,
  CAM_MAX_ZOOM,
} from "../constants";
import { Camera2D, CameraBounds } from "./Camera2D";
import { TouchInputManager } from "./TouchInputManager";
import { DummyController } from "./DummyController";
import { AIController } from "./AIController";
import { ParticleManager } from "./ParticleManager";
import { AnimationManager } from "./AnimationManager";
import { AudioManager } from "./AudioManager";
import { BattleAnnouncerManager } from "./BattleAnnouncerManager";
import { AudioCache } from "../src/engine/audio/AudioCache";
import { SoundCategory } from "../src/engine/audio/AudioManifest";
import { FrameManager } from "./FrameManager";
import { NetworkManager } from "./NetworkManager";
import { resolveAnimationKey } from "./AnimationResolver";
import { BEAM_DATABASE } from "../constants/BeamDatabase";
import { BeamConfigKeyManager } from "./BeamConfigKeyManager";
import { CollisionHelper } from "./CollisionHelper";
import { ProjectileConfigKeyManager } from "./ProjectileConfigKeyManager";
import { EffectConfigKeyManager } from "./EffectConfigKeyManager";
import { DEFAULT_EFFECTS } from "../constants/EffectDatabase";

import { Projectile } from "./Projectile";
import { Genkidama } from "./Genkidama";
import { Player, Afterimage } from "./Player";

// Refactoring Auxiliary Systems
import { LoggerService } from "./LoggerService";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { EventSystem } from "./EventSystem";
import { SceneCoordinator, GameScene } from "./SceneCoordinator";
import { LifecycleManager, IGameSystem } from "./LifecycleManager";

export class GameEngine {
  // Refactored Game Management Systems
  public logger = LoggerService.getInstance();
  public performanceMonitor = new PerformanceMonitor();
  public eventSystem = EventSystem.getInstance();
  public sceneCoordinator!: SceneCoordinator;
  public lifecycleManager = new LifecycleManager();

  public canvas: HTMLCanvasElement | null = null;
  public fgCanvas: HTMLCanvasElement | null = null;
  public fgCtx: CanvasRenderingContext2D | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  public camera: Camera2D;
  public summonUltimateTriggered = false;
  public summonHasCastUltimate = false;
  public summonActionChoice: string = "";

  public inputManager: TouchInputManager;
  public player1: Player;
  public player2: Player;
  public dummyController: DummyController;
  public aiController: AIController;
  public p1AiController: AIController | null = null;
  public projectiles: Projectile[] = [];
  public visualEffects: import("../types").VisualEffect[] = [];
  public nextVisualEffectId: number = 0;

  public particleManager: ParticleManager;
  public animationManager: AnimationManager;
  public networkManager: NetworkManager;

  public isTraining: boolean = false;
  public isOnline: boolean = false;
  public isHost: boolean = false;
  public gameMode: GameMode = "ARCADE";

  public onGameStateChange: (state: GameState) => void;
  public isRunning: boolean = false;
  public isPausedForReconnection: boolean = false;
  public animationId: number = 0;
  public introTimer: number = 600; // 10 seconds max for P1 intro
  public introPhase: IntroPhase = IntroPhase.P1_INTRO;
  public fightAudioPlayed: boolean = false;
  public introFadeAlpha: number = 0;
  public introTransitioning: boolean = false;
  public gameTimer: number = 99 * 60;
  public hitStopTimer: number = 0;
  public cameraRecoverTimer: number = 0;
  public cameraHasOverride: boolean = false;
  private p1InputBuffer: InputState = this.createEmptyInput();
  private p2InputBuffer: InputState = this.createEmptyInput();

  private createEmptyInput(): InputState {
    return {
      left: false, right: false, up: false, down: false, jump: false,
      light: false, medium: false, heavy: false, kiblast: false,
      special: false, block: false, dash: false, charge: false,
      attack: false, ultimate: false, assist1: false, assist2: false,
      vanish: false, transform: false, fusion: false, dragonRush: false,
      tag: false
    };
  }

  private copyInput(source: InputState, target: InputState) {
    target.left = !!source.left;
    target.right = !!source.right;
    target.up = !!source.up;
    target.down = !!source.down;
    target.jump = !!source.jump;
    target.light = !!source.light;
    target.medium = !!source.medium;
    target.heavy = !!source.heavy;
    target.kiblast = !!source.kiblast;
    target.special = !!source.special;
    target.block = !!source.block;
    target.dash = !!source.dash;
    target.charge = !!source.charge;
    target.attack = !!source.attack;
    target.ultimate = !!source.ultimate;
    target.ultimate2 = !!source.ultimate2;
    target.ultimate3 = !!source.ultimate3;
    target.ultimate4 = !!source.ultimate4;
    target.special2 = !!source.special2;
    target.special3 = !!source.special3;
    target.special4 = !!source.special4;
    target.special5 = !!source.special5;
    target.special6 = !!source.special6;
    target.special7 = !!source.special7;
    target.special8 = !!source.special8;
    target.special9 = !!source.special9;
    target.special10 = !!source.special10;
    target.tag = !!source.tag;
    target.assist1 = !!source.assist1;
    target.assist2 = !!source.assist2;
    target.vanish = !!source.vanish;
    target.transform = !!source.transform;
    target.transformTarget = source.transformTarget;
    target.fusion = !!source.fusion;
    target.dragonRush = !!source.dragonRush;
    target.isJoystickActive = !!source.isJoystickActive;
  }

  // Beam Clash (Disputa de energia)
  public isBeamClashActive: boolean = false;
  public beamClashTimer: number = 0;
  public beamClashProgress: number = 0.5;
  public beamClashVisualProgress: number = 0.5;
  public beamClashP1FacingRight: boolean = true;
  public beamClashEmitter1X: number = 0;
  public beamClashEmitter2X: number = 0;
  public p1BeamClashCount: number = 0;
  public p2BeamClashCount: number = 0;
  public onBeamClashPointer: ((e: PointerEvent) => void) | null = null;

  // KO Sequence State
  public koSequenceActive: boolean = false;
  public koSequenceTimer: number = 0;
  public koDefeatedPlayer: "p1" | "p2" | "both" | null = null;
  public koClashActive: boolean = false;
  public koClashPhase: number = 0;
  public koClashTimer: number = 0;
  public koClashIncomingPlayer: Player | null = null;
  public koClashWaitingPlayer: Player | null = null;
  public koClashBackgroundEffectId: number | null = null;
  public wave: number = 1;

  // Cinematic Beam Impact (Sistema de Impacto Final)
  public isCinematicBeamImpact: boolean = false;
  public cinematicImpactBeam: any = null;
  public cinematicImpactWinner: Player | null = null;
  public cinematicImpactLoser: Player | null = null;
  public cinematicImpactStage: 'ADVANCE' | 'IMPACT_FX' | 'RECOVERY' = 'ADVANCE';
  public cinematicImpactTimer: number = 0;
  public cinematicImpactEffect: any = null;

  public matchStats = {
    p1: { damageDealt: 0, maxCombo: 0 },
    p2: { damageDealt: 0, maxCombo: 0 },
  };

  public stageTheme: string = "TORNEIO_DO_PODER";
  public currentStageData: StageData | null = null;
  public worldWidth: number = 2000;
  public groundY: number = 150;
  public physLimitLeft: number = -225;
  public physLimitRight: number = 2225;

  // Ambassador custom game mechanics configuration overrides
  public customGravityMultiplier: number = 1.0;
  public customSpeedMultiplier: number = 1.0;
  public customDamageMultiplier: number = 1.0;

  // Training Mode Settings
  public trainingInfiniteKi: boolean = false;
  public trainingInfiniteHp: boolean = true;
  public trainingShowHitboxes: boolean = false;
  public cpuAction: CpuAction = CpuAction.OFF;
  public counterAttackType: CounterAttackType = CounterAttackType.LIGHT;

  // Input Edge Detection
  public currentP1Input: InputState | null = null;
  public currentP2Input: InputState | null = null;
  public prevP1Input: InputState | null = null;
  public prevP2Input: InputState | null = null;
  public frameCount: number = 0;
  public renderer: GameRenderer;

  // Network State
  public remoteInput: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    light: false,
    medium: false,
    heavy: false,
    special: false,
    block: false,
    dash: false,
    charge: false,
    attack: false,
    tag: false,
    ultimate: false,
    assist1: false,
    assist2: false,
    vanish: false,
    transform: false,
    fusion: false,
    dragonRush: false,
  };

  public p1Team: Player[] = [];
  public p2Team: Player[] = [];
  public p1ActiveIdx: number = 0;
  public p2ActiveIdx: number = 0;
  public p1TagCooldown: number = 0;
  public p2TagCooldown: number = 0;
  public readonly TAG_COOLDOWN_MAX = 300; // 5 seconds at 60fps

  // Fusion State
  public p1FusionUsed: boolean = false;
  public p2FusionUsed: boolean = false;
  public p1FusionTarget: string = "gogeta";
  public p2FusionTarget: string = "gogeta";
  public p1GokuHpBeforeFusion: number = 0;
  public p1VegetaHpBeforeFusion: number = 0;
  public p2GokuHpBeforeFusion: number = 0;
  public p2VegetaHpBeforeFusion: number = 0;
  public p1FusionInitiator: string = "";
  public p2FusionInitiator: string = "";
  public p1GogetaMaxHp: number = 0;
  public p2GogetaMaxHp: number = 0;

  public p1GogetaTimer: number = 0;
  public p2GogetaTimer: number = 0;

  public p1FusionNotificationPlayed: boolean = false;
  public p2FusionNotificationPlayed: boolean = false;

  public afterimages: Afterimage[] = [];

  constructor(
    onGameStateChange: (state: GameState) => void,
    p1TeamData: CharacterData[],
    p2TeamData: CharacterData[],
    isTraining: boolean = false,
    gameMode: GameMode = "ARCADE",
    p1TeamSize: number = 3,
    p2TeamSize: number = 3,
    aiDifficulty: import("./AIController").AIDifficulty = "MEDIUM",
    timeLimit: number = 99,
    stageTheme: string = "TORNEIO_DO_PODER",
    public isP1Bot: boolean = false,
  ) {
    this.onGameStateChange = onGameStateChange;
    this.isTraining = isTraining;
    this.gameTimer =
      timeLimit === Infinity ? Number.MAX_SAFE_INTEGER : timeLimit * 60;
    this.gameMode = gameMode;
    this.stageTheme = stageTheme;
    this.isOnline = gameMode === "ONLINE";
    this.networkManager = NetworkManager.getInstance();
    this.isHost = this.networkManager.isHost;

    const stageInfo = STAGE_DB.find((s) => s.id === this.stageTheme);
    this.currentStageData = stageInfo || null;
    this.worldWidth = stageInfo?.worldWidth ?? 2000;
    this.groundY = stageInfo?.groundY ?? 150;
    this.physLimitLeft = stageInfo?.physLimitLeft ?? -225;
    this.physLimitRight = stageInfo?.physLimitRight ?? this.worldWidth + 225;

    this.camera = new Camera2D(
      this.worldWidth,
      WORLD_HEIGHT,
      this.worldWidth,
      WORLD_HEIGHT,
      stageInfo?.limitLeft ?? 0,
      stageInfo?.limitRight ?? this.worldWidth,
      0, // limitTop
      WORLD_HEIGHT - this.groundY // limitBottom
    );
    this.camera.cameraCenterOffsetY = stageInfo?.cameraOffsetY ?? 0;
    this.inputManager = new TouchInputManager();
    this.dummyController = new DummyController();
    this.aiController = new AIController(aiDifficulty);
    if (this.isP1Bot) {
      this.p1AiController = new AIController(aiDifficulty);
    }

    // Initialize scene coordinator
    this.sceneCoordinator = new SceneCoordinator(
      this.isTraining ? GameScene.TRAINING : GameScene.INTRO
    );

    // Register modular game systems in LifecycleManager for automated coordination
    this.lifecycleManager.registerSystem({
      name: "InputSystem",
      dependencies: [],
      initialize: (engine) => {
        engine.logger.info("Initializing Touch/Gamepad Input System...", "LifecycleManager");
      },
      update: (engine, dt) => {},
      destroy: () => {}
    });

    this.lifecycleManager.registerSystem({
      name: "PhysicsSystem",
      dependencies: ["InputSystem"],
      initialize: (engine) => {
        engine.logger.info("Initializing Physics & Collision Subsystems...", "LifecycleManager");
      },
      update: (engine, dt) => {},
      destroy: () => {}
    });

    this.lifecycleManager.registerSystem({
      name: "ParticleSystem",
      dependencies: [],
      initialize: (engine) => {
        engine.logger.info("Initializing Particles & Visual FX Subsystem...", "LifecycleManager");
      },
      update: (engine, dt) => {},
      destroy: () => {}
    });

    this.lifecycleManager.registerSystem({
      name: "AudioSystem",
      dependencies: [],
      initialize: (engine) => {
        engine.logger.info("Initializing Battle Audio Subsystem...", "LifecycleManager");
      },
      update: (engine, dt) => {},
      destroy: () => {}
    });

    this.lifecycleManager.registerSystem({
      name: "AISystem",
      dependencies: ["InputSystem"],
      initialize: (engine) => {
        engine.logger.info("Initializing AI Controller Systems...", "LifecycleManager");
      },
      update: (engine, dt) => {},
      destroy: () => {}
    });

    // Automatically initialize systems & validate dependencies
    this.lifecycleManager.initializeAll(this);

    // Track state change global event via EventSystem
    this.eventSystem.subscribe("STATE_CHANGE", (payload) => {
      this.logger.info(`Global Game State Changed: ${payload}`, "GameEngine");
    });
    this.particleManager = new ParticleManager(
      (type, x, y, imageUrl, frames, loop, ownerId, scale, facingRight) => {
        this.spawnVisualEffect(
          type,
          x,
          y,
          imageUrl,
          frames,
          loop,
          ownerId,
          scale,
          facingRight,
        );
      },
    );
    this.animationManager = AnimationManager.getInstance();
    this.renderer = new GameRenderer(this);

    const centerX = this.worldWidth / 2;
    const p1Start = centerX - SPAWN_CENTER_OFFSET - PLAYER_WIDTH / 2;
    const p2Start = centerX + SPAWN_CENTER_OFFSET - PLAYER_WIDTH / 2;

    const p1TeamState = { ki: 0, maxKi: MAX_KI };
    const p2TeamState = { ki: 0, maxKi: MAX_KI };

    this.p1Team = p1TeamData.map((data) => {
      const p = new Player(p1Start, data, true);
      p.teamState = p1TeamState;
      return p;
    });
    this.p2Team = p2TeamData.map((data) => {
      const p = new Player(p2Start, data, false);
      p.teamState = p2TeamState;
      if (gameMode === "BOSS") {
        p.hp = p.maxHp * 2.5; // 2.5x HP for each boss in the 3-boss gauntlet
        p.maxHp = p.hp;
      }
      return p;
    });

    if (this.p1Team.length === 0) {
      const p = new Player(p1Start, BASE_CHARACTERS[0], true);
      p.teamState = p1TeamState;
      this.p1Team.push(p);
    }
    if (this.p2Team.length === 0) {
      const p = new Player(p2Start, BASE_CHARACTERS[0], false);
      p.teamState = p2TeamState;
      this.p2Team.push(p);
    }

    this.p1Team.forEach((p, idx) => {
      if (idx > 0) p.state = PlayerState.STANDBY;
    });
    this.p2Team.forEach((p, idx) => {
      if (idx > 0) p.state = PlayerState.STANDBY;
    });

    this.player1 =
      this.p1Team[0] || new Player(p1Start, BASE_CHARACTERS[0], true);
    this.player2 =
      this.p2Team[0] || new Player(p2Start, BASE_CHARACTERS[0], false);

    // Initialize damage callback
    [...this.p1Team, ...this.p2Team].forEach(p => {
      if (p) {
        p.onTakeDamage = (amount) => this.handlePlayerDamageReceived(p, amount);
      }
    });

    const p1Config = CHARACTER_INTROS[this.player1.data.id];
    this.introTimer = p1Config ? p1Config.maxTime : 600;

    this.camera.position = {
      x: centerX,
      y: WORLD_HEIGHT / 2 + this.camera.cameraCenterOffsetY,
    };

    p1TeamData.forEach((d) => this.animationManager.preloadCharacter(d));
    p2TeamData.forEach((d) => this.animationManager.preloadCharacter(d));

    // Preload Gogeta if either team has Goku and Vegeta, to prevent stuttering/freezing when fusion happens
    const hasFusionP1 =
      p1TeamData.some((d) => d.id === "goku_ssj") &&
      p1TeamData.some((d) => d.id === "vegeta_base");
    const hasFusionP2 =
      p2TeamData.some((d) => d.id === "goku_ssj") &&
      p2TeamData.some((d) => d.id === "vegeta_base");
    if (hasFusionP1 || hasFusionP2) {
      const gogetaData = BASE_CHARACTERS.find((c) => c.id === "gogeta");
      const gogetaBlueData = BASE_CHARACTERS.find(
        (c) => c.id === "gogeta_blue",
      );
      if (gogetaData) {
        this.animationManager.preloadCharacter(gogetaData);
      }
      if (gogetaBlueData) {
        this.animationManager.preloadCharacter(gogetaBlueData);
      }
    }

    if (this.isOnline) {
      this.networkManager.onInputReceived = (input) => {
        this.remoteInput = input;
      };
      this.networkManager.onDisconnect = () => {
        this.handleNetworkDisconnect();
      };
      this.networkManager.onReconnectSync = (state) => {
        this.applySyncedState(state);
      };
      this.networkManager.onRealtimeStateSync = (state) => {
        this.handleRealtimeStateSync(state);
      };
    }

    if (this.gameMode === "TRAINING" || this.gameMode === "SUMMON") {
      this.skipIntro();
    }

    // Centralized beam clashing / closeness check to prevent any duplicate/overlapping beam creations from any source
    const originalPush = this.projectiles.push;
    this.projectiles.push = (...items: Projectile[]) => {
      const filteredItems: Projectile[] = [];
      for (const proj of items) {
        if (proj && (proj.isBeam || proj.beamFamilyId)) {
          const p1 = this.player1;
          const p2 = this.player2;
          if (p1 && p2) {
            const p1CenterX = p1.x + p1.width / 2;
            const p1CenterY = p1.y + p1.height / 2;
            const p2CenterX = p2.x + p2.width / 2;
            const p2CenterY = p2.y + p2.height / 2;
            const dx = p1CenterX - p2CenterX;
            const dy = p1CenterY - p2CenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 50) {
              const hasExistingBeam = this.projectiles.some(
                (p_existing) => (p_existing.isBeam || p_existing.beamFamilyId) && p_existing.active
              );
              if (hasExistingBeam) {
                proj.active = false;
                proj._isForceDeactivated = true;
                console.log("[BEAM_CLASH] Blocked creating beam via projectiles.push. Distance:", distance);
                continue; // Skip pushing this beam completely!
              }
            }
          }
        }
        filteredItems.push(proj);
      }
      if (filteredItems.length > 0) {
        return originalPush.apply(this.projectiles, filteredItems);
      }
      return this.projectiles.length;
    };
  }

  public slowMoCounter: number = 0;
  public lastTime: number = 0;
  public readonly frameInterval: number = 1000 / 60;

  // --- CORE LOOP ---

  public loop = (timestamp?: number) => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    this.animationId = requestAnimationFrame(this.loop);

    if (this.isPausedForReconnection) {
      try {
        this.renderer.render();
      } catch (e) {}
      return;
    }

    if (timestamp === undefined) timestamp = performance.now();
    const elapsed = timestamp - this.lastTime;

    if (elapsed < this.frameInterval) {
      return;
    }

    this.lastTime = timestamp - (elapsed % this.frameInterval);

    // Monitor frame performance start
    const frameStartTime = this.performanceMonitor.startFrame();

    try {
      // 1. Gather Local Input
      this.performanceMonitor.startSystem("input");
      this.inputManager.update();
      this.copyInput(this.inputManager.p1Current, this.p1InputBuffer);
      let p1Input = this.p1InputBuffer;
      let p2Input: InputState = this.p2InputBuffer;
      this.performanceMonitor.endSystem("input");

      // 2. Determine Inputs
      this.performanceMonitor.startSystem("ai");
      if (this.gameMode === "LOCAL_VS") {
        this.copyInput(this.inputManager.p1Current, this.p1InputBuffer);
        this.copyInput(this.inputManager.p2Current, this.p2InputBuffer);
        p1Input = this.p1InputBuffer;
        p2Input = this.p2InputBuffer;
      } else if (this.isOnline) {
        const currentInput = this.inputManager.current;
        if (this.isHost) {
          this.copyInput(currentInput, this.p1InputBuffer);
          this.copyInput(this.remoteInput, this.p2InputBuffer);
          p1Input = this.p1InputBuffer;
          p2Input = this.p2InputBuffer;
          this.networkManager.sendInput(p1Input);
        } else {
          this.copyInput(this.remoteInput, this.p1InputBuffer);
          this.copyInput(currentInput, this.p2InputBuffer);
          p1Input = this.p1InputBuffer;
          p2Input = this.p2InputBuffer;
          this.networkManager.sendInput(p2Input);
        }
      } else if (this.gameMode === "SUMMON") {
        const currentInput = this.inputManager.current;
        const dummyInput = this.dummyController.update(
          this.player2,
          this.player1,
        ) as InputState;
        this.copyInput(dummyInput, this.p2InputBuffer);
        p2Input = this.p2InputBuffer;
        this.player1.ki = this.player1.maxKi; // max ki always

        if (
          !this.summonUltimateTriggered &&
          this.introPhase === IntroPhase.FIGHT &&
          this.frameCount > 30
        ) {
          this.summonUltimateTriggered = true;
          this.summonActionChoice =
            Math.random() > 0.5 ? "ultimate" : "special";
        }

        const shouldPress =
          this.summonUltimateTriggered && !this.summonHasCastUltimate;
        
        this.copyInput(currentInput, this.p1InputBuffer);
        if (shouldPress) {
          const action = (this.summonActionChoice || "ultimate") as keyof InputState;
          (this.p1InputBuffer as any)[action] = true;
        }
        p1Input = this.p1InputBuffer;

        const isCasting =
          this.player1.state === PlayerState.ULTIMATE ||
          (this.player1.state === PlayerState.ATTACKING &&
            this.player1.comboType === "SPECIAL") ||
          (this.player1.state === PlayerState.JUMP_ATTACK &&
            this.player1.comboType === "SPECIAL");

        if (
          this.summonUltimateTriggered &&
          !this.summonHasCastUltimate &&
          isCasting
        ) {
          this.summonHasCastUltimate = true;
        }

        // If animation finished
        if (this.summonHasCastUltimate && !isCasting) {
          this.player2.hp = 0; // instantly end game
          this.player2.state = PlayerState.DEFEAT; // Trigger game over condition
          // Mark gameOver directly to bypass koSequence if it didn't trigger correctly
          this.koSequenceActive = false; // Disable KO sequence for Summon
          this.koDefeatedPlayer = "p2";
        }
      } else if (this.isTraining) {
        p2Input = this.aiController.update(
          this.player2,
          this.player1,
          this.projectiles,
          this,
          p1Input
        );
      } else {
        p2Input = this.aiController.update(
          this.player2,
          this.player1,
          this.projectiles,
          this,
          p1Input
        );
        if (this.isP1Bot && this.p1AiController) {
          p1Input = this.p1AiController.update(
            this.player1,
            this.player2,
            this.projectiles,
            this,
            p2Input
          );
        }
      }
      this.performanceMonitor.endSystem("ai");

      // 3. Update Game Logic
      this.frameCount++;

      const p1HpBefore = this.p1Team.reduce((acc, p) => acc + p.hp, 0);
      const p2HpBefore = this.p2Team.reduce((acc, p) => acc + p.hp, 0);

      this.performanceMonitor.startSystem("simulation");
      this.simulateFrame(p1Input, p2Input);
      this.performanceMonitor.endSystem("simulation");

      if (this.isOnline && this.isHost) {
        this.sendRealtimeStateSync();
      }

      const p1HpAfter = this.p1Team.reduce((acc, p) => acc + p.hp, 0);
      const p2HpAfter = this.p2Team.reduce((acc, p) => acc + p.hp, 0);

      const p1DamageTaken = Math.max(0, p1HpBefore - p1HpAfter);
      const p2DamageTaken = Math.max(0, p2HpBefore - p2HpAfter);

      this.matchStats.p1.damageDealt += p2DamageTaken;
      this.matchStats.p2.damageDealt += p1DamageTaken;

      this.p1Team.forEach((p) => {
        if (p.comboCount > this.matchStats.p1.maxCombo) {
          this.matchStats.p1.maxCombo = p.comboCount;
        }
      });
      this.p2Team.forEach((p) => {
        if (p.comboCount > this.matchStats.p2.maxCombo) {
          this.matchStats.p2.maxCombo = p.comboCount;
        }
      });

      // Independent, decoupled battle announcer combo state tracking
      if (this.player1) {
        BattleAnnouncerManager.getInstance().updateCombo(true, this.player1.comboCount);
      }
      if (this.player2) {
        BattleAnnouncerManager.getInstance().updateCombo(false, this.player2.comboCount);
      }

      // Save previous inputs for edge detection
      this.prevP1Input = { ...p1Input };
      this.prevP2Input = { ...p2Input };

      // 4. Update Ground Energy Reflection & Deformation System (GERDS)
      this.performanceMonitor.startSystem("environment");
      GroundEnergyManager.getInstance().update(this);
      this.performanceMonitor.endSystem("environment");

      // 5. Render
      this.performanceMonitor.startSystem("rendering");
      this.renderer.render();
      this.performanceMonitor.endSystem("rendering");

      if (this.inputManager) {
        this.inputManager.endFrame();
      }

      // Record performance metrics
      this.performanceMonitor.endFrame(frameStartTime);

      // Periodically log metrics to prove the monitoring is working perfectly!
      if (this.frameCount % 300 === 0) {
        const metrics = this.performanceMonitor.getMetrics();
        this.logger.debug(`Performance Metrics - FPS: ${metrics.fps}, Frame Time: ${metrics.frameTime}ms, Memory: ${metrics.memoryUsage ?? "N/A"}MB`, "GameEngine");
        this.logger.debug(`System Breakdown - Simulation: ${metrics.systems.simulation}ms, Render: ${metrics.systems.rendering}ms, AI: ${metrics.systems.ai}ms`, "GameEngine");
      }
    } catch (error) {
      console.error("Game loop encountered an error:", error);
      // Optionally halt the loop or re-throw after logging
      // this.isRunning = false;
    }
  };

  public applyCameraOverrides(allPlayers: Player[]) {
    // 0. Update camera limits from ground sprite if needed
    this.updateCameraLimitsFromGround();

    // Check if camera shake should be locked (FULLSCREEN ANIMATIONS REQUIRE NO SHAKE)
    const isP1Full = this.player1.state === PlayerState.ULTIMATE || this.player1.state === PlayerState.ULTIMATE_2 || 
                    (this.player1.lastAnimKey && this.player1.data.spriteConfig?.animations?.[this.player1.lastAnimKey]?.fullScreen);
    const isP2Full = this.player2.state === PlayerState.ULTIMATE || this.player2.state === PlayerState.ULTIMATE_2 || 
                    (this.player2.lastAnimKey && this.player2.data.spriteConfig?.animations?.[this.player2.lastAnimKey]?.fullScreen);
    const hasFullScreenVfx = this.visualEffects.some(v => v.active && v.fullScreen);
    
    this.camera.shakeLocked = !!(isP1Full || isP2Full || hasFullScreenVfx);

    // Constraints check override before standard update
    const checkAnimCam = (p: Player) => {
      let loc = false;
      let zoom = false;
      let isDefaultCenter = false;
      let anim = null;
      if (p.lastAnimKey) {
        anim = p.data.spriteConfig?.animations[p.lastAnimKey];
      }
      if (p.state === PlayerState.ULTIMATE) {
        const animKey = resolveAnimationKey(
          p.data.id,
          p.state,
          p.comboType,
          p.comboStep,
          p.ataque,
          p.ultPhase,
          p.nextTransformId,
          p.attackTimer,
          p.ultType,
          p.isGrounded,
          p.isDetransforming,
          p.isKOTag,
          p.data.spriteConfig
        );
        anim = p.data.spriteConfig?.animations?.[animKey] || anim;
      }
      
      if (anim) {
        if (anim.zoomType === "DEFAULT_CENTER") isDefaultCenter = true;
        
        // Strictly check if zoomType, fullScreen, cameraFocusX, cameraFocusY, or zoomAmount is defined, and it's not DEFAULT_CENTER
        const hasZoomType = (anim.zoomType || anim.fullScreen || anim.cameraFocusX !== undefined || anim.cameraFocusY !== undefined || anim.zoomAmount !== undefined) && anim.zoomType !== "DEFAULT_CENTER";
        
        if (hasZoomType && !isDefaultCenter) {
          zoom = true;
          loc = true;
        }
      }
      
      return { loc, zoom };
    };

    const p1CamFlags = checkAnimCam(this.player1);
    const p2CamFlags = checkAnimCam(this.player2);

    this.cameraHasOverride = p1CamFlags.zoom || p2CamFlags.zoom;

    // We skip regular update(p1, p2) if not FIGHT phase, since intro handled it
    if (this.introPhase === IntroPhase.FIGHT) {
      if (this.koSequenceActive) {
        const died1 = this.player1.hp <= 0;
        const died2 = this.player2.hp <= 0;
        if (died1 && died2) {
          this.camera.update(this.player1, this.player2, true, false);
        } else if (died1) {
          this.camera.focusOn(this.player1, CAM_MAX_ZOOM - 0.2);
        } else if (died2) {
          this.camera.focusOn(this.player2, CAM_MAX_ZOOM - 0.2);
        }
      } else if (!this.koClashActive) {
        const inMuiDodge = this.player1.state === PlayerState.MUI_DODGE || this.player2.state === PlayerState.MUI_DODGE;
        if (inMuiDodge) {
          const dodgingPlayer = this.player1.state === PlayerState.MUI_DODGE ? this.player1 : this.player2;
          this.camera.focusOn(dodgingPlayer, 1.7);
          return;
        }

        const inUltimate = this.player1.state === PlayerState.ULTIMATE || this.player2.state === PlayerState.ULTIMATE;
        const inDragonCombo = (this.player1.state === PlayerState.DRAGON_COMBO && this.player1.comboStep === 0) || 
                              (this.player2.state === PlayerState.DRAGON_COMBO && this.player2.comboStep === 0);
        
        if (inUltimate) {
          (this as any)._lastUltimateTime = Date.now();
        }
        const wasRecentlyInUltimate = (this as any)._lastUltimateTime && (Date.now() - (this as any)._lastUltimateTime) < 1000;
        const fastZoom = inUltimate || wasRecentlyInUltimate || inDragonCombo;

        if (inDragonCombo) {
          const comboAttacker = (this.player1.state === PlayerState.DRAGON_COMBO && this.player1.comboStep === 0) ? this.player1 : this.player2;
          this.camera.focusOn(comboAttacker, 2.6);
          return;
        }

        this.camera.update(
          this.player1,
          this.player2,
          p1CamFlags.zoom || p2CamFlags.zoom,
          p1CamFlags.loc || p2CamFlags.loc,
          false,
          fastZoom
        );
      }
    }

    const processAnimationCamera = (p: Player) => {
      if (!p.lastAnimKey)
        return { hasLocOverride: false, hasZoomOverride: false };
      const currentAnim = p.data.spriteConfig?.animations[p.lastAnimKey];
      if (!currentAnim)
        return { hasLocOverride: false, hasZoomOverride: false };

      const hasZoomType = (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined) && currentAnim.zoomType !== "DEFAULT_CENTER";
      if (!hasZoomType) {
        return { hasLocOverride: false, hasZoomOverride: false };
      }

      let hasLocOverride = false;
      let hasZoomOverride = false;

      let targetX: number | null = null;
      let targetY: number | null = null;

      if (
        currentAnim.cameraFocusX !== undefined &&
        currentAnim.cameraFocusY !== undefined
      ) {
        if (currentAnim.zoomType === "DEFAULT_CENTER") {
          // Skip overriding location for default center
          hasLocOverride = false;
        } else {
          targetX = p.facingRight
            ? p.x + currentAnim.cameraFocusX
            : p.x + p.width - currentAnim.cameraFocusX;
          targetY = p.y + currentAnim.cameraFocusY;
          hasLocOverride = true;
        }
      } else if (currentAnim.fullScreen) {
        const sScale = currentAnim.scale || p.data.spriteConfig?.defaultScale || 1;
        const cWidth = currentAnim.frameWidth || 100;
        const cHeight = currentAnim.frameHeight || 100;
        const drawWidth = cWidth * sScale;
        const drawHeight = cHeight * sScale;

        const ox = currentAnim.originX !== undefined ? currentAnim.originX : p.width / 2;
        const oy = currentAnim.originY !== undefined ? currentAnim.originY : (currentAnim.fullScreen ? p.height / 2 : p.height);

        const cx = currentAnim.centerX !== undefined ? currentAnim.centerX : drawWidth / 2;
        const cy = currentAnim.centerY !== undefined ? currentAnim.centerY : (currentAnim.fullScreen ? drawHeight / 2 : drawHeight);

        targetX = p.facingRight
          ? p.x + ox - cx + (currentAnim.offsetX || 0) + drawWidth / 2
          : p.x + p.width - ox + cx - (currentAnim.offsetX || 0) - drawWidth / 2;
        targetY = p.y + oy - cy + (currentAnim.offsetY || 0) + drawHeight / 2;
        hasLocOverride = true;
      }

      // --- CUTSCENE OPPONENT POSITIONING --- (NEW)
      if (
        currentAnim.opponentPosX !== undefined &&
        currentAnim.opponentPosY !== undefined &&
        !p["launched_opp"]
      ) {
        const opp = p === this.player1 ? this.player2 : this.player1;
        if (!opp) return;
        const relativeX = currentAnim.opponentPosX;
        const relativeY = currentAnim.opponentPosY;

        // Move opponent to relative position
        // Pos.x is centered, so we add width/2 to the target left edge
        const targetX = p.facingRight
          ? p.x + relativeX
          : p.x + p.width - relativeX - opp.width;

        const targetXPivot = targetX + opp.width / 2;
        const targetYPivot = p.y + relativeY + opp.height; // Pos.y is feet, so we add height to targeted top edge

        if (currentAnim.opponentPosImmediate !== false) {
          opp.pos.x = targetXPivot;
          opp.pos.y = targetYPivot;
          opp.velocity.x = 0;
          opp.velocity.y = 0;
        } else {
          opp.pos.x = opp.pos.x + (targetXPivot - opp.pos.x) * 0.15;
          opp.pos.y = opp.pos.y + (targetYPivot - opp.pos.y) * 0.15;
          // Smoothly reduce velocity
          opp.velocity.x *= 0.8;
          opp.velocity.y *= 0.8;
        }

        if (currentAnim.opponentAnim) {
          opp.state = currentAnim.opponentAnim as PlayerState;
        }
      }

      if (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined) {
        let zoomVal = Number(currentAnim.zoomAmount) || 1;
        if (currentAnim.fullScreen && currentAnim.frameWidth > 0 && currentAnim.frameHeight > 0) {
            const defScale = p.data.spriteConfig?.defaultScale || 1;
            const sScale = currentAnim.scale || defScale;
            // Use logical screen size representing the world view matching full screen (typically around 1280x720 depending on viewport mapping)
            const zX = this.camera.viewport.width / (currentAnim.frameWidth * sScale);
            const zY = this.camera.viewport.height / (currentAnim.frameHeight * sScale);
            zoomVal = Math.max(zX, zY) + 0.2;
        }
        const totalFrames = currentAnim.frames || 1;
        let progress = 1;
        if (totalFrames > 1) {
          const rawProgress = p.animFrame / (totalFrames - 1);
          const zoomKey = p.lastAnimKey + "_" + p.state;
          if ((p as any)._lastZoomKey !== zoomKey) {
            (p as any)._lastZoomKey = zoomKey;
            (p as any)._maxZoomProgress = 0;
          }
          if (currentAnim.loop !== false) {
            if (rawProgress > ((p as any)._maxZoomProgress || 0)) {
              (p as any)._maxZoomProgress = rawProgress;
            }
            progress = Math.max(rawProgress, (p as any)._maxZoomProgress || 0);
          } else {
            progress = p.animFinished ? 1 : rawProgress;
          }
        }
        const zoomTypeStr = String(currentAnim.zoomType || 'IMMEDIATE').toUpperCase();

        // Ease In Out Sine for smooth, fluid motion
        const easedProgress = Math.min(
          1,
          Math.max(0, -(Math.cos(Math.PI * progress) - 1) / 2),
        );

        let targetZoom = this.camera.zoom;
        if (zoomTypeStr === "DEFAULT_CENTER") {
          // Dynamic
        } else if (zoomTypeStr === "IMMEDIATE") {
          this.camera.zoom = zoomVal;
          targetZoom = zoomVal;
          if (targetX === null || targetY === null) {
            targetX = p.x + p.width / 2;
            targetY = p.y + p.height / 2;
            hasLocOverride = true;
          }
        } else if (zoomTypeStr === "ZOOM_IN") {
          targetZoom = zoomVal;
        } else if (
          zoomTypeStr === "CONSERVE" ||
          zoomTypeStr === "PRESERVE" ||
          zoomTypeStr === "CONSERVED" ||
          zoomTypeStr === "PRESERVED"
        ) {
          targetZoom = this.camera.zoom;
        } else if (zoomTypeStr === "ZOOM_OUT") {
          targetZoom = 1;
        } else if (zoomTypeStr === "ZOOM_IN_OUT") {
          const pulseProgress = Math.sin(progress * Math.PI); // 0 to 1 to 0
          targetZoom = 1 + (zoomVal - 1) * pulseProgress;
        } else if (zoomTypeStr === "ZOOM_PULSE") {
          const pulseProgress = Math.abs(Math.sin(progress * Math.PI * 4)); // 4 loops
          targetZoom = 1 + (zoomVal - 1) * pulseProgress;
        } else if (zoomTypeStr === "ZOOM_BOUNCE") {
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
          targetZoom = 1 + (zoomVal - 1) * bounceProg;
        }

        if (zoomTypeStr !== "IMMEDIATE" && zoomTypeStr !== "DEFAULT_CENTER") {
          const lerpSpeed = currentAnim.zoomSpeed !== undefined 
            ? Number(currentAnim.zoomSpeed) 
            : (currentAnim.speed ? currentAnim.speed / 100 : 0.15);
          this.camera.zoom += (targetZoom - this.camera.zoom) * lerpSpeed;
        }

        hasZoomOverride = true; // Any zoomType handles zoom, so we override the game engine ult fallback
      }

      // Camera rotation is handled globally at the end of applyCameraOverrides

      if (targetX === null || targetY === null) {
        targetX = p.x + p.width / 2;
        targetY = p.y + p.height / 2;
        hasLocOverride = true;
      }

      if (targetX !== null && targetY !== null) {
        const animKeyInput = p.lastAnimKey || String(p.state);
        const isSpecialOrUlt =
          animKeyInput.includes("SPECIAL") ||
          animKeyInput.includes("ESPECIAL") ||
          animKeyInput.includes("ULT") ||
          animKeyInput.includes("TAG_IN_KO") ||
          p.state === PlayerState.ULTIMATE ||
          p.state === PlayerState.TRANSFORM ||
          p.state === PlayerState.DETRANSFORM ||
          p.state === PlayerState.DEFUSION ||
          p.state === PlayerState.FUSION ||
          p.state === PlayerState.INTRO;

        let camSpeed =
          currentAnim.cameraSpeed !== undefined ? currentAnim.cameraSpeed : 1;
        if (
          (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined) &&
          String(currentAnim.zoomType || 'IMMEDIATE').toUpperCase() === "IMMEDIATE"
        ) {
          camSpeed = 1;
        }

        if (hasLocOverride || isSpecialOrUlt) {
          this.camera.setUnboundedPosition(targetX, targetY, camSpeed);
        } else {
          this.camera.setClampedPosition(targetX, targetY, camSpeed);
        }
      }

      return { hasLocOverride, hasZoomOverride };
    };

    const p1AnimCam = processAnimationCamera(this.player1);
    const p2AnimCam = processAnimationCamera(this.player2);

    const processUltimateCamera = (
      p: Player,
      animCam: { hasLocOverride: boolean; hasZoomOverride: boolean },
    ) => {
      if (p.state !== PlayerState.ULTIMATE) return;
      
      // Removed camera limits from ultimates

      let animKey = resolveAnimationKey(
        p.data.id,
        p.state,
        p.comboType,
        p.comboStep,
        p.ataque,
        p.ultPhase,
        p.nextTransformId,
        p.attackTimer,
        p.ultType,
        p.isGrounded,
        p.isDetransforming,
        p.isKOTag,
      );

      let targetX: number | null = null;
      let targetY: number | null = null;

      const currentAnim = p.data.spriteConfig?.animations?.[animKey];

      // FALLBACK TO STANDARD CAMERA ZOOM AND FOCUS IF NO TYPE ZOOM IS SPECIFIED
      const hasZoomType = currentAnim && (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined) && currentAnim.zoomType !== "DEFAULT_CENTER";
      if (!hasZoomType) {
        return;
      }

      if (currentAnim && currentAnim.zoomType === "DEFAULT_CENTER") {
        // explicit intent to NOT track specific character, let it handle dynamically framing both
      } else if (
        currentAnim &&
        currentAnim.cameraFocusX !== undefined &&
        currentAnim.cameraFocusY !== undefined
      ) {
        targetX = p.facingRight
          ? p.x + currentAnim.cameraFocusX
          : p.x + p.width - currentAnim.cameraFocusX;
        targetY = p.y + currentAnim.cameraFocusY;
      } else if (currentAnim && currentAnim.fullScreen) {
        const sScale = currentAnim.scale || p.data.spriteConfig?.defaultScale || 1;
        const cWidth = currentAnim.frameWidth || 100;
        const cHeight = currentAnim.frameHeight || 100;
        const drawWidth = cWidth * sScale;
        const drawHeight = cHeight * sScale;

        const ox = currentAnim.originX !== undefined ? currentAnim.originX : p.width / 2;
        const oy = currentAnim.originY !== undefined ? currentAnim.originY : (currentAnim.fullScreen ? p.height / 2 : p.height);

        const cx = currentAnim.centerX !== undefined ? currentAnim.centerX : drawWidth / 2;
        const cy = currentAnim.centerY !== undefined ? currentAnim.centerY : (currentAnim.fullScreen ? drawHeight / 2 : drawHeight);

        targetX = p.facingRight
          ? p.x + ox - cx + (currentAnim.offsetX || 0) + drawWidth / 2
          : p.x + p.width - ox + cx - (currentAnim.offsetX || 0) - drawWidth / 2;
        targetY = p.y + oy - cy + (currentAnim.offsetY || 0) + drawHeight / 2;
      } else if (!animCam.hasLocOverride) {
        // Fallback
        targetX = p.x + p.width / 2;
        targetY = p.y + p.height / 2;
      }

      if (currentAnim && (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined)) {
        let zoomVal = Number(currentAnim.zoomAmount) || 1;
        if (currentAnim.fullScreen && currentAnim.frameWidth > 0 && currentAnim.frameHeight > 0) {
            const defScale = p.data.spriteConfig?.defaultScale || 1;
            const sScale = currentAnim.scale || defScale;
            // Use logical screen size representing the world view matching full screen
            const zX = this.camera.viewport.width / (currentAnim.frameWidth * sScale);
            const zY = this.camera.viewport.height / (currentAnim.frameHeight * sScale);
            zoomVal = Math.max(zX, zY) + 0.2;
        }
        const zoomSpeed = Number(currentAnim.zoomSpeed) || 0.15;
        const totalFrames = currentAnim.frames || 1;
        let progress = 1;
        if (totalFrames > 1) {
          const rawProgress = p.animFrame / (totalFrames - 1);
          const zoomKey = p.lastAnimKey + "_" + p.state;
          if ((p as any)._lastZoomKey !== zoomKey) {
            (p as any)._lastZoomKey = zoomKey;
            (p as any)._maxZoomProgress = 0;
          }
          if (currentAnim.loop !== false) {
            if (rawProgress > ((p as any)._maxZoomProgress || 0)) {
              (p as any)._maxZoomProgress = rawProgress;
            }
            progress = Math.max(rawProgress, (p as any)._maxZoomProgress || 0);
          } else {
            progress = p.animFinished ? 1 : rawProgress;
          }
        }
        const zoomTypeStr = String(currentAnim.zoomType || 'IMMEDIATE').toUpperCase();

        // Ease In Out Sine for smooth, fluid motion
        const easedProgress = Math.min(
          1,
          Math.max(0, -(Math.cos(Math.PI * progress) - 1) / 2),
        );

        let targetZoom = this.camera.zoom;
        if (zoomTypeStr === "DEFAULT_CENTER") {
          // Dynamic
        } else if (zoomTypeStr === "IMMEDIATE") {
          this.camera.zoom = zoomVal;
          targetZoom = zoomVal;
          if (targetX === null || targetY === null) {
            targetX = p.x + p.width / 2;
            targetY = p.y + p.height / 2;
            animCam.hasLocOverride = true;
          }
        } else if (zoomTypeStr === "ZOOM_IN") {
          targetZoom = 1 + (zoomVal - 1) * easedProgress;
        } else if (
          zoomTypeStr === "CONSERVE" ||
          zoomTypeStr === "PRESERVE" ||
          zoomTypeStr === "CONSERVED" ||
          zoomTypeStr === "PRESERVED"
        ) {
          targetZoom = this.camera.zoom;
        } else if (zoomTypeStr === "ZOOM_OUT") {
          if (p.animFrame === 0 && p.animTimer <= 1 && !p.animFinished) {
            this.camera.zoom = zoomVal;
          }
          targetZoom = zoomVal + (1 - zoomVal) * easedProgress;
        } else if (zoomTypeStr === "ZOOM_IN_OUT") {
          const pulseProgress = Math.sin(progress * Math.PI); // 0 to 1 to 0
          targetZoom = 1 + (zoomVal - 1) * pulseProgress;
        } else if (zoomTypeStr === "ZOOM_PULSE") {
          const pulseProgress = Math.abs(Math.sin(progress * Math.PI * 4)); // 4 loops
          targetZoom = 1 + (zoomVal - 1) * pulseProgress;
        } else if (zoomTypeStr === "ZOOM_BOUNCE") {
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
          targetZoom = 1 + (zoomVal - 1) * bounceProg;
        }

        if (
          zoomTypeStr !== "IMMEDIATE" &&
          zoomTypeStr !== "DEFAULT_CENTER" &&
          p.animTimer > 0
        ) {
          this.camera.zoom += (targetZoom - this.camera.zoom) * zoomSpeed;
        }
      }

      if (targetX !== null && targetY !== null) {
        let camSpeed =
          currentAnim && currentAnim.cameraSpeed !== undefined
            ? currentAnim.cameraSpeed
            : 1;
        if (
          currentAnim &&
          (currentAnim.zoomType || currentAnim.fullScreen || currentAnim.cameraFocusX !== undefined || currentAnim.cameraFocusY !== undefined || currentAnim.zoomAmount !== undefined) &&
          String(currentAnim.zoomType || 'IMMEDIATE').toUpperCase() === "IMMEDIATE"
        ) {
          camSpeed = 1;
        }
        this.camera.setUnboundedPosition(targetX, targetY, camSpeed);
      }
    };

    processUltimateCamera(this.player1, p1AnimCam);
    processUltimateCamera(this.player2, p2AnimCam);

    // Resolve global authoritative camera rotation immediately if 0 or not configured, otherwise lerp
    const checkRotation = (p: Player) => {
      if (p && p.lastAnimKey) {
        const anim = p.data.spriteConfig?.animations[p.lastAnimKey];
        if (anim && anim.cameraRotation !== undefined) {
          return { target: anim.cameraRotation, speed: anim.speed ? anim.speed / 100 : 0.15 };
        }
      }
      return null;
    };

    const p1Rot = checkRotation(this.player1);
    const p2Rot = checkRotation(this.player2);

    let activeRot: number = 0;
    let activeSpeed: number = 0.15;

    if (p1Rot) {
      activeRot = p1Rot.target;
      activeSpeed = p1Rot.speed;
    } else if (p2Rot) {
      activeRot = p2Rot.target;
      activeSpeed = p2Rot.speed;
    }

    if (activeRot === 0) {
      this.camera.rotation = 0;
    } else {
      this.camera.rotation += (activeRot - this.camera.rotation) * activeSpeed;
    }
  }

  public forcePositionsForFight(
    preserveSides: boolean = false,
    centerAtWorldMide: boolean = true,
  ) {
    let midX = this.worldWidth / 2;
    if (!centerAtWorldMide) {
      midX = (this.player1.pos.x + this.player2.pos.x) / 2;
    }

    let p1IsLeft = true;
    if (preserveSides) {
      p1IsLeft = this.player1.pos.x < this.player2.pos.x;
    }

    if (p1IsLeft) {
      this.player1.pos.x = midX - SPAWN_CENTER_OFFSET;
      this.player1.pos.y = WORLD_HEIGHT - this.groundY;
      this.player1.velocity = { x: 0, y: 0 };
      this.player1.facingRight = true;

      this.player2.pos.x = midX + SPAWN_CENTER_OFFSET;
      this.player2.pos.y = WORLD_HEIGHT - this.groundY;
      this.player2.velocity = { x: 0, y: 0 };
      this.player2.facingRight = false;
    } else {
      this.player1.pos.x = midX + SPAWN_CENTER_OFFSET;
      this.player1.pos.y = WORLD_HEIGHT - this.groundY;
      this.player1.velocity = { x: 0, y: 0 };
      this.player1.facingRight = false;

      this.player2.pos.x = midX - SPAWN_CENTER_OFFSET;
      this.player2.pos.y = WORLD_HEIGHT - this.groundY;
      this.player2.velocity = { x: 0, y: 0 };
      this.player2.facingRight = true;
    }

    const clamp = (p: Player) => {
      if (p.pos.x - p.width / 2 < this.physLimitLeft)
        p.pos.x = this.physLimitLeft + p.width / 2;
      if (p.pos.x + p.width / 2 > this.physLimitRight)
        p.pos.x = this.physLimitRight - p.width / 2;
    };
    clamp(this.player1);
    clamp(this.player2);
  }

  public fadeAndStopIntroSFX() {
    const introSfxKeys = ["goku_black_rose_intro_inicio", "goku_black_rose_intro_final"];
    introSfxKeys.forEach((key) => {
      AudioCache.getInstance().getOrCreateHowl(key, SoundCategory.SFX).then((howl) => {
        if (howl) {
          const volt = howl.volume() || 1.0;
          howl.fade(volt, 0.0, 1000); // 1-second fade out (sumisso)
          setTimeout(() => {
            try {
              howl.stop();
            } catch (e) {}
          }, 1100);
        }
      }).catch(err => {
        console.warn("Failed fade out of intro sfx:", key, err);
      });
    });
  }

  public handleNetworkDisconnect() {
    if (!this.isOnline) return;
    this.isPausedForReconnection = true;
    
    // Save current battle state to Firestore
    const roomId = localStorage.getItem("current_online_room_id");
    if (roomId) {
      const stateToSave = {
        hostHp: this.player1 ? this.player1.hp : null,
        guestHp: this.player2 ? this.player2.hp : null,
        hostKi: this.player1 ? this.player1.ki : 0,
        guestKi: this.player2 ? this.player2.ki : 0,
        timer: Math.floor(this.gameTimer / 60)
      };
      
      import("./LobbyService").then(({ LobbyService }) => {
        LobbyService.getInstance().updatePlayerConnection(roomId, this.isHost, false);
        LobbyService.getInstance().saveBattleState(roomId, stateToSave);
      });
    }
  }

  public applySyncedState(state: any) {
    if (!state) return;
    console.log("Applying synced combat state:", state);
    if (this.player1) {
      if (state.hostHp !== undefined && state.hostHp !== null) this.player1.hp = state.hostHp;
      if (state.hostKi !== undefined && state.hostKi !== null) this.player1.ki = state.hostKi;
    }
    if (this.player2) {
      if (state.guestHp !== undefined && state.guestHp !== null) this.player2.hp = state.guestHp;
      if (state.guestKi !== undefined && state.guestKi !== null) this.player2.ki = state.guestKi;
    }
    if (state.timer !== undefined && state.timer !== null) {
      this.gameTimer = state.timer * 60;
    }
    this.isPausedForReconnection = false;
  }

  public sendRealtimeStateSync() {
    if (!this.isOnline || !this.isHost || !this.networkManager || !this.networkManager.connection || !this.networkManager.connection.open) {
      return;
    }

    try {
      const syncState = {
        frameCount: this.frameCount,
        p1: {
          x: this.player1 ? this.player1.x : 0,
          y: this.player1 ? this.player1.y : 0,
          vx: this.player1 && this.player1.velocity ? this.player1.velocity.x : 0,
          vy: this.player1 && this.player1.velocity ? this.player1.velocity.y : 0,
          hp: this.player1 ? this.player1.hp : 0,
          ki: this.player1 ? this.player1.ki : 0,
          state: this.player1 ? this.player1.state : 0,
          facingRight: this.player1 ? this.player1.facingRight : true,
          comboType: this.player1 ? this.player1.comboType : "NONE",
          comboStep: this.player1 ? this.player1.comboStep : 0,
          comboCount: this.player1 ? this.player1.comboCount : 0,
          sparkingTimer: this.player1 ? this.player1.sparkingTimer : 0,
          hasSparked: this.player1 ? this.player1.hasSparked : false,
          animFrame: this.player1 ? this.player1.animFrame : 0,
          lastAnimKey: this.player1 ? this.player1.lastAnimKey : ""
        },
        p2: {
          x: this.player2 ? this.player2.x : 0,
          y: this.player2 ? this.player2.y : 0,
          vx: this.player2 && this.player2.velocity ? this.player2.velocity.x : 0,
          vy: this.player2 && this.player2.velocity ? this.player2.velocity.y : 0,
          hp: this.player2 ? this.player2.hp : 0,
          ki: this.player2 ? this.player2.ki : 0,
          state: this.player2 ? this.player2.state : 0,
          facingRight: this.player2 ? this.player2.facingRight : true,
          comboType: this.player2 ? this.player2.comboType : "NONE",
          comboStep: this.player2 ? this.player2.comboStep : 0,
          comboCount: this.player2 ? this.player2.comboCount : 0,
          sparkingTimer: this.player2 ? this.player2.sparkingTimer : 0,
          hasSparked: this.player2 ? this.player2.hasSparked : false,
          animFrame: this.player2 ? this.player2.animFrame : 0,
          lastAnimKey: this.player2 ? this.player2.lastAnimKey : ""
        },
        projectiles: (this.projectiles || []).filter(p => p.active).map(p => ({
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          active: p.active,
          isBeam: p.isBeam,
          ownerId: p.ownerId,
          width: p.width,
          height: p.height,
          color: p.color,
          beamFamilyId: p.beamFamilyId
        })),
        isBeamClashActive: this.isBeamClashActive,
        beamClashProgress: this.beamClashProgress,
        beamClashVisualProgress: this.beamClashVisualProgress,
        beamClashVisualX: (this as any).beamClashVisualX,
        beamClashP1FacingRight: this.beamClashP1FacingRight,
        gameTimer: this.gameTimer
      };

      this.networkManager.connection.send({ type: 'REALTIME_STATE_SYNC', state: syncState });
    } catch (e) {
      console.error("Error sending realtime state sync:", e);
    }
  }

  public handleRealtimeStateSync(state: any) {
    if (!state || this.isHost) return;

    try {
      // Sync Player 1 (Host's primary)
      if (this.player1 && state.p1) {
        this.player1.x = state.p1.x;
        this.player1.y = state.p1.y;
        if (this.player1.velocity) {
          this.player1.velocity.x = state.p1.vx;
          this.player1.velocity.y = state.p1.vy;
        }
        this.player1.hp = state.p1.hp;
        this.player1.ki = state.p1.ki;
        this.player1.state = state.p1.state;
        this.player1.facingRight = state.p1.facingRight;
        this.player1.comboType = state.p1.comboType;
        this.player1.comboStep = state.p1.comboStep;
        this.player1.comboCount = state.p1.comboCount;
        this.player1.sparkingTimer = state.p1.sparkingTimer;
        this.player1.hasSparked = state.p1.hasSparked;
        if (state.p1.animFrame !== undefined) this.player1.animFrame = state.p1.animFrame;
        if (state.p1.lastAnimKey) this.player1.lastAnimKey = state.p1.lastAnimKey;
      }

      // Sync Player 2 (My character on Guest client)
      if (this.player2 && state.p2) {
        this.player2.x = state.p2.x;
        this.player2.y = state.p2.y;
        if (this.player2.velocity) {
          this.player2.velocity.x = state.p2.vx;
          this.player2.velocity.y = state.p2.vy;
        }
        this.player2.hp = state.p2.hp;
        this.player2.ki = state.p2.ki;
        this.player2.state = state.p2.state;
        this.player2.facingRight = state.p2.facingRight;
        this.player2.comboType = state.p2.comboType;
        this.player2.comboStep = state.p2.comboStep;
        this.player2.comboCount = state.p2.comboCount;
        this.player2.sparkingTimer = state.p2.sparkingTimer;
        this.player2.hasSparked = state.p2.hasSparked;
        if (state.p2.animFrame !== undefined) this.player2.animFrame = state.p2.animFrame;
        if (state.p2.lastAnimKey) this.player2.lastAnimKey = state.p2.lastAnimKey;
      }

      // Sync active projectiles list
      if (state.projectiles && Array.isArray(state.projectiles)) {
        this.projectiles = (this.projectiles || []).filter(p => p.active);
        const hostProjCount = state.projectiles.length;

        for (let i = 0; i < Math.min(this.projectiles.length, hostProjCount); i++) {
          const p = this.projectiles[i];
          const sp = state.projectiles[i];
          p.x = sp.x;
          p.y = sp.y;
          p.vx = sp.vx;
          p.vy = sp.vy;
          p.active = sp.active;
        }

        if (this.projectiles.length < hostProjCount) {
          for (let i = this.projectiles.length; i < hostProjCount; i++) {
            const sp = state.projectiles[i];
            const p = Projectile.spawn(
              sp.x,
              sp.y,
              sp.vx,
              sp.ownerId,
              sp.color || "#ffffff",
              sp.isBeam,
              sp.beamFamilyId,
              sp.width,
              sp.height
            );
            p.active = sp.active;
            this.projectiles.push(p);
          }
        }

        for (let i = 0; i < Math.min(this.projectiles.length, hostProjCount); i++) {
          if (!state.projectiles[i].active) {
            this.projectiles[i].active = false;
          }
        }
      }

      if (state.isBeamClashActive !== undefined) {
        this.isBeamClashActive = state.isBeamClashActive;
      }
      if (state.beamClashProgress !== undefined) {
        this.beamClashProgress = state.beamClashProgress;
      }
      if (state.beamClashVisualProgress !== undefined) {
        this.beamClashVisualProgress = state.beamClashVisualProgress;
      }
      if (state.beamClashP1FacingRight !== undefined) {
        this.beamClashP1FacingRight = state.beamClashP1FacingRight;
      }
      if (state.beamClashVisualX !== undefined) {
        (this as any).beamClashVisualX = state.beamClashVisualX;
      }
      if (state.gameTimer !== undefined) {
        this.gameTimer = state.gameTimer;
      }
    } catch (e) {
      console.error("Error processing realtime state sync on guest:", e);
    }
  }

  public skipIntro() {
    if (
      this.introPhase === IntroPhase.P1_INTRO ||
      this.introPhase === IntroPhase.P2_INTRO
    ) {
      this.fadeAndStopIntroSFX();

      this.introPhase = IntroPhase.READY;
      this.fightAudioPlayed = false;
      BattleAnnouncerManager.getInstance().playReady();
      const readySec = AudioManager.getInstance().getSFXDuration("ready");
      const fightSec = AudioManager.getInstance().getSFXDuration("fight");
      const readyFrames = Math.ceil(readySec * 60);
      const fightFrames = Math.ceil(fightSec * 60);
      this.introTimer = readyFrames + fightFrames;
      this.introFadeAlpha = 0;
      this.introTransitioning = false;
      this.player1.state = PlayerState.IDLE;
      this.player2.state = PlayerState.IDLE;
      this.player1.animFinished = false;
      this.player2.animFinished = false;
      this.forcePositionsForFight(true, true);
      this.camera.update(this.player1, this.player2, false, false, true);
    }
  }

  public getPlayerTimeFreezeStatus(target: Player): boolean {
    const attacker = target === this.player1 ? this.player2 : this.player1;
    if (!attacker) return false;

    // If the target themselves are also doing an ultimate/special startup with freeze priority,
    // they should not be frozen to avoid deadlocks.
    const isTargetFreezing = this.isPlayerCausingTimeFreeze(target);
    if (isTargetFreezing) return false;

    return this.isPlayerCausingTimeFreeze(attacker);
  }

  public isPlayerCausingTimeFreeze(player: Player): boolean {
    if (player.state === PlayerState.ULTIMATE) {
      if (player.data.id === "goku_black_rose" && player.ultType === 2) {
        if (player.ultPhase < 3) return true;
      } else if (
        ((player.data.id === "goku_base_swl_removed" || player.data.id === "goku_base") ||
          player.data.id === "vegeta_ego") &&
        player.ultType === 2
      ) {
        if (player.ultPhase < 5) return true;
      } else if (
        ((player.data.id === "goku_base_swl_removed" || player.data.id === "goku_base") ||
          player.data.id === "vegeta_ego") &&
        player.ultType === 1
      ) {
        if (player.ultPhase === 1) return true;
      } else if (player.data.id === "gogeta_blue" && player.ultType === 1) {
        if (player.ultPhase < 5) return true;
      } else if (player.data.id === "gogeta_blue" && player.ultType === 2) {
        if (player.ultPhase === 1) return true;
      } else if (player.data.id === "goku_ssj") {
        if (player.ultType === 2 && player.ultPhase === 1) return true;
        if (player.ultType === 1 && player.ultPhase === 1) return true;
      } else if (player.data.id === "goku_blue_gif" && player.ultType === 1) {
        if (player.ultPhase === 1) return true;
      } else if (player.data.id === "vegeta_base" && player.ultType === 2) {
        if (player.ultPhase < 4) return true;
      } else if (player.data.id === "trunks_ssj2" && player.ultType === 2) {
        if (player.ultPhase < 3) return true;
      } else if (player.data.id === "teen_gohan_ssj2") {
        if (player.ultType === 1 && player.ultPhase <= 2) return true;
        if (player.ultType === 2 && player.ultPhase <= 2) return true;
      } else {
        if (player.ultPhase > 0 && player.ultPhase < 3.5) return true;
      }
    }

    return false;
  }

  private handleKoClash() {
    if (
      !this.koClashActive ||
      !this.koClashIncomingPlayer ||
      !this.koClashWaitingPlayer
    )
      return;

    const pIn = this.koClashIncomingPlayer;
    const pWait = this.koClashWaitingPlayer;

    this.koClashTimer++;

    if (this.koClashPhase < 3) {
      // Force gravity off or zero velocity initially
      pIn.velocity.y = 0;
      pWait.velocity.y = 0;
    }

    switch (this.koClashPhase) {
      case 1: // Fly in
        pIn.state = PlayerState.DASHING;
        pWait.state = PlayerState.IDLE;

        // Imediato zoom no personagem que está entrando (centro da sprite)
        if (this.camera) {
          this.camera.focusOn(pIn, 4.0, true, true);
        }

        const dx = pWait.x - pIn.x;
        const dist = Math.abs(dx);
        pIn.facingRight = dx > 0;
        // Incoming character hits from the front

        const speed = 20;
        if (dist > 80) {
          pIn.velocity.x = pIn.facingRight ? speed : -speed;
          if (this.frameCount % 2 === 0) {
            this.particleManager.spawn("SPEED_LINES", pIn.x, pIn.y, 2);
          }
        } else {
          // Reached the opponent! Move to Clash Phase
          this.koClashPhase = 2;
          this.koClashTimer = 0;
          pIn.velocity.x = 0;

          // Stop the background entry effect
          if (this.koClashBackgroundEffectId !== null) {
            const effect = this.visualEffects.find(
              (v) => v.id === this.koClashBackgroundEffectId,
            );
            if (effect) {
              effect.active = false;
            }
            this.koClashBackgroundEffectId = null;
          }

          // Spawn full screen dust effect at the clash center
          const centerX = (pIn.x + pWait.x) / 2 + pIn.width / 2;
          const centerY = pIn.y + pIn.height / 2;

          this.spawnVisualEffect(
            "FULL_SCREEN_DUST",
            centerX,
            centerY,
            "/Assets/efeitos/telacheia/1.gif",
            60,
            false,
            "system",
            6.5,
            true,
          );

          pIn.isKOTag = false;
          pIn.state = PlayerState.ATTACKING;
          pIn.comboType = "TAG_CLASH";
          pIn.comboStep = 1;
          pIn.ataque = true;

          // Reset animation frame so TAG_ATTACK starts from frame 0
          pIn.animFrame = 0;
          pIn.animFinished = false;

          pWait.facingRight = !pIn.facingRight;
          pWait.state = PlayerState.ATTACKING;
          pWait.comboType = "TAG_CLASH";
          pWait.comboStep = 1;
          pWait.ataque = true;
          pWait.animFrame = 0;
          pWait.animFinished = false;

          pWait.velocity.x = 0;

          // Apply zoom as soon as tag attack starts
          this.camera.focusOn(
            { x: centerX, y: centerY, width: 0, height: 0 },
            2.8,
          );
        }
        break;

      case 2: // Clash force struggle
        pIn.velocity.x = 0;
        pWait.velocity.x = 0;
        pIn.velocity.y = 0;
        pWait.velocity.y = 0;

        if (pIn.animFrame < 2) {
          // Wait for the animation to reach the impact frame
          this.koClashTimer = 0; // Don't advance the struggle timer yet
          const centerX = (pIn.x + pWait.x) / 2 + pIn.width / 2;
          const centerY = pIn.y + pIn.height / 2;
          this.camera.focusOn(
            { x: centerX, y: centerY, width: 0, height: 0 },
            2.0,
          );
        } else {
          const centerX = (pIn.x + pWait.x) / 2 + pIn.width / 2;
          const centerY = pIn.y + pIn.height / 2;

          // 2) Efeito de câmera focando o centro dos personagens continuamente
          this.camera.focusOn(
            { x: centerX, y: centerY, width: 0, height: 0 },
            2.5,
          );

          if (this.koClashTimer === 1) {
            // First frame of the impact
            // Camera effects
            this.hitStopTimer = 15; // 1) Freeze frame curto no impacto (1/4 de segundo a 60fps)
            this.camera.addScreenShake(30, 25, "IMPULSE", 1.5); // 3) Tremor leve/médio de câmera

            // 3) Impacto visual como shockwave e partículas
            this.particleManager.spawnHitSpark(centerX, centerY, true);
            this.particleManager.spawn(
              "SPARK",
              centerX,
              centerY,
              1,
              "#ffffff",
              { size: 150 },
            ); // Shockwave
            this.particleManager.spawn(
              "IMPACT",
              centerX,
              centerY,
              5,
              "#ffffff",
              { size: 40 },
            );
            this.particleManager.spawn(
              "ENERGY",
              centerX,
              centerY,
              35,
              "#ffffff",
              { size: 18, speed: 20 },
            );
          }

          // Freeze animation at the impact frame to simulate a struggle
          pIn.animFrame = 2;
          pWait.animFrame = 2;
          pIn.animTimer = 0;
          pWait.animTimer = 0;

          if (this.koClashTimer % 4 === 0) {
            this.particleManager.spawn(
              "IMPACT",
              (pIn.x + pWait.x) / 2 + pIn.width / 2,
              pIn.y + pIn.height / 2,
              1,
            );
            this.camera.addScreenShake(5, 5, "PERLIN", 1);
          }

          // Camera slowly zooms even closer for dramatic effect
          this.camera.zoom += 0.005;

          // Wait for FULL_SCREEN_DUST to finish
          const dustEffectActive = this.visualEffects.some(
            (e) => e.type === "FULL_SCREEN_DUST" && e.active,
          );

          if (this.koClashTimer > 45 && !dustEffectActive) {
            // Struggle over, transition to throw back
            this.koClashPhase = 3;
            this.koClashTimer = 0;

            // Thrown back and up
            const throwVy = -15;
            const throwVx = 10;

            pIn.state = PlayerState.LAUNCHED;
            pIn.isGrounded = false;
            pIn.ataque = false;
            pIn.velocity.y = throwVy;
            pIn.velocity.x = pIn.facingRight ? -throwVx : throwVx; // Thrown BACKWARDS

            pWait.state = PlayerState.LAUNCHED;
            pWait.isGrounded = false;
            pWait.ataque = false;
            pWait.velocity.y = throwVy;
            pWait.velocity.x = pWait.facingRight ? -throwVx : throwVx;

            this.camera.addScreenShake(15, 10, "IMPULSE", 1);
          }
        }
        break;

      case 3: // Flying away and landing
        pIn.velocity.y += GRAVITY * this.customGravityMultiplier;
        pWait.velocity.y += GRAVITY * this.customGravityMultiplier;

        // Camera follows the center
        this.camera.focusOn(
          {
            x: (pIn.x + pWait.x) / 2,
            y: (pIn.y + pWait.y) / 2,
            width: 0,
            height: 0,
          },
          1.2,
        );

        // Ground collisions
        if (pIn.pos.y >= WORLD_HEIGHT - this.groundY) {
          pIn.pos.y = WORLD_HEIGHT - this.groundY;
          pIn.velocity.y = 0;
          pIn.velocity.x = 0;
          pIn.isGrounded = true;
          if (
            pIn.state === PlayerState.LAUNCHED ||
            pIn.state === PlayerState.FALLING
          ) {
            pIn.state = PlayerState.LANDING;
            pIn.animFrame = 0;
            pIn.landingDelayTimer = 10;
            this.particleManager.spawnDust(
              pIn.x + pIn.width / 2,
              pIn.y + pIn.height,
              0,
            );
          }
        } else {
          if (pIn.state !== PlayerState.LAUNCHED)
            pIn.state = PlayerState.FALLING;
        }

        if (pWait.pos.y >= WORLD_HEIGHT - this.groundY) {
          pWait.pos.y = WORLD_HEIGHT - this.groundY;
          pWait.velocity.y = 0;
          pWait.velocity.x = 0;
          pWait.isGrounded = true;
          if (
            pWait.state === PlayerState.LAUNCHED ||
            pWait.state === PlayerState.FALLING
          ) {
            pWait.state = PlayerState.LANDING;
            pWait.animFrame = 0;
            pWait.landingDelayTimer = 10;
            this.particleManager.spawnDust(
              pWait.x + pWait.width / 2,
              pWait.y + pWait.height,
              0,
            );
          }
        } else {
          if (pWait.state !== PlayerState.LAUNCHED)
            pWait.state = PlayerState.FALLING;
        }

        if (
          pIn.isGrounded &&
          pWait.isGrounded &&
          pIn.state === PlayerState.LANDING &&
          pWait.state === PlayerState.LANDING
        ) {
          if (pIn.landingDelayTimer <= 0 && pWait.landingDelayTimer <= 0) {
            // End of cinematic!
            this.koClashActive = false;
            this.koClashIncomingPlayer = null;
            this.koClashWaitingPlayer = null;

            // Reposition characters before resuming, preserving sides and avoiding jarring camera teleports
            this.forcePositionsForFight(true, false);

            this.introPhase = IntroPhase.READY;
            this.fightAudioPlayed = true;
            BattleAnnouncerManager.getInstance().playFight();
            const fightSec = AudioManager.getInstance().getSFXDuration("fight");
            this.introTimer = Math.ceil(fightSec * 60);

            pIn.state = PlayerState.IDLE;
            pIn.isKOTag = false;
            pIn.invincibleTimer = 30; // Brief invincibility after clash

            pWait.state = PlayerState.IDLE;
            pWait.invincibleTimer = 30;

            // Let camera reset naturally
            this.cameraRecoverTimer = 0;
          } else {
            pIn.landingDelayTimer--;
            pWait.landingDelayTimer--;
          }
        }
        break;
    }

    // Explicitly apply velocity since physics is skipped during early return
    if (this.koClashPhase === 1 || this.koClashPhase === 3) {
      pIn.pos.x += pIn.velocity.x;
      pIn.pos.y += pIn.velocity.y;
      pWait.pos.x += pWait.velocity.x;
      pWait.pos.y += pWait.velocity.y;
    }

    // Apply strict world bounds only for waiting player so incoming can fly from outside
    const limitLeft = this.physLimitLeft;
    const limitRight = this.physLimitRight;
    if (pWait.x < limitLeft) pWait.pos.x = limitLeft + pWait.width / 2;
    if (pWait.x + pWait.width > limitRight)
      pWait.pos.x = limitRight - pWait.width / 2;

    // In phase 3 (bounce back), clamp incoming as well so they don't get stuck outside
    if (this.koClashPhase === 3) {
      if (pIn.x < limitLeft) pIn.pos.x = limitLeft + pIn.width / 2;
      if (pIn.x + pIn.width > limitRight)
        pIn.pos.x = limitRight - pIn.width / 2;
    }
  }

  public simulateFrame(p1Input: InputState, p2Input: InputState) {
    AudioManager.isInBattle = (this.introPhase === IntroPhase.FIGHT && !this.koSequenceActive);
    this.currentP1Input = p1Input;
    this.currentP2Input = p2Input;
    this.p1Team.forEach(p => p.input = p1Input);
    this.p2Team.forEach(p => p.input = p2Input);

    const p1HpBefore = this.player1 ? this.player1.hp : 0;
    const p2HpBefore = this.player2 ? this.player2.hp : 0;

    if (!this.isBeamClashActive) {
      const p1Beam = this.projectiles.find(p => p.ownerId === "p1" && p.isBeam && p.active && !p.isShrinking);
      const p2Beam = this.projectiles.find(p => p.ownerId === "p2" && p.isBeam && p.active && !p.isShrinking);
      if (p1Beam && p2Beam) {
        const didCollide = this.checkBeamTipCollision(p1Beam, p2Beam);

        if (didCollide) {
          this.tryStartBeamClash(p1Beam, p2Beam);
        }
      }
    }

    if (this.isBeamClashActive) {
      this.handleBeamClash();
      // Only execute basic visuals
      this.updateProjectiles();
      this.updateAfterimages([
        this.player1,
        this.player2,
        ...this.p1Team,
        ...this.p2Team,
      ]);
      this.particleManager.update();

      this.updateAnimations(this.player1);
      this.updateAnimations(this.player2);

      if (this.cameraRecoverTimer <= 0) {
        this.applyCameraOverrides([this.player1, this.player2]);
      }
      this.frameCount++;
      this.emitGameState();
      return;
    }

    if (this.isCinematicBeamImpact) {
      this.updateCinematicImpact();
      this.updateProjectiles();
      this.particleManager.update();
      this.updateAnimations(this.player1);
      this.updateAnimations(this.player2);
      this.frameCount++;
      this.emitGameState();
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer--;
      // Optionally still update particles during hitstop
      if (this.hitStopTimer % 2 === 0) {
        this.particleManager.update();
      }
      this.emitGameState();
      return;
    }

    if (this.koClashActive) {
      this.handleKoClash();
      // Only execute basic visuals
      this.updateProjectiles();
      this.updateAfterimages([
        this.player1,
        this.player2,
        ...this.p1Team,
        ...this.p2Team,
      ]);
      this.particleManager.update();

      this.updateAnimations(this.player1);
      this.updateAnimations(this.player2);

      if (this.cameraRecoverTimer <= 0) {
        this.applyCameraOverrides([this.player1, this.player2]); // Reset camera if clash ends, or apply anim overrides during it
      }
      this.frameCount++;
      this.emitGameState();
      return;
    }

    if (
      this.player1.state === PlayerState.ULTIMATE ||
      this.player2.state === PlayerState.ULTIMATE ||
      this.player1.state === PlayerState.TRANSFORM ||
      this.player1.state === PlayerState.DETRANSFORM ||
      this.player1.state === PlayerState.FUSION ||
      this.player1.state === PlayerState.DEFUSION ||
      this.player2.state === PlayerState.TRANSFORM ||
      this.player2.state === PlayerState.DETRANSFORM ||
      this.player2.state === PlayerState.FUSION ||
      this.player2.state === PlayerState.DEFUSION
    ) {
      this.cameraRecoverTimer = 45;
    } else if (this.cameraRecoverTimer > 0) {
      this.cameraRecoverTimer--;
    }

    if (this.introPhase !== IntroPhase.FIGHT) {
      if (this.introPhase === IntroPhase.P1_INTRO) {
        this.introTimer--;
        this.player1.state = PlayerState.INTRO;
        this.player2.state = PlayerState.IDLE;
        this.camera.focusOn(this.player1, CAM_MAX_ZOOM - 0.2); // slight zoom out

        // Custom Intro for P1
        const customConfig = CHARACTER_INTROS[this.player1.data.id];
        const hasPhasedIntro = !!(this.player1.data as any).phasedMoves?.['INTRO'];
        
        if (customConfig && !hasPhasedIntro) {
          customConfig.update({
            progress: customConfig.maxTime - this.introTimer,
            worldWidth: this.worldWidth,
            groundY: WORLD_HEIGHT - this.groundY,
            isPlayer1: true,
            player: this.player1,
            opponent: this.player2,
          });
        } else if (hasPhasedIntro) {
          // Phased move system handles position and state
          this.player1.pos.x = this.worldWidth / 2 + SPAWN_CENTER_OFFSET * -1;
          this.player1.pos.y = WORLD_HEIGHT - this.groundY;
          this.player1.state = PlayerState.INTRO;
        }

        // Move to P2 when P1 intro finishes
        const hasP1Intro = !!(
          (this.player1.data.spriteConfig?.animations as any)?.[PlayerState.INTRO] ||
          (this.player1.data.spriteConfig?.animations as any)?.["INTRO_1"] ||
          customConfig ||
          (this.player1.data as any).phasedMoves?.['INTRO']
        );
        
        let p1Finished = false;
        if (this.player1.data.phasedMoves?.['INTRO'] && this.player1.currentPhasedMove === 'INTRO') {
          p1Finished = false; // Phased move handles it
        } else if (this.player1.data.phasedMoves?.['INTRO'] && !this.player1.currentPhasedMove) {
          p1Finished = true; // Finished phased move
        } else if (customConfig) {
          p1Finished = customConfig.isCustomComplete
            ? customConfig.isCustomComplete(this.player1)
            : this.introTimer <= 0;
        } else if (hasP1Intro) {
          // Sequential Intro Support (INTRO_1, INTRO_2, etc.)
          const currentIntroStep = this.player1.ultPhase || 1;
          const nextIntroKey = `INTRO_${currentIntroStep + 1}`;
          const hasNextIntro = !!(this.player1.data.spriteConfig?.animations as any)?.[nextIntroKey] || 
                               !!(this.player1.data.spriteConfig?.animations as any)?.[nextIntroKey.toLowerCase()];

          const currentFinished = (this.player1.state === PlayerState.INTRO && this.player1.animFinished);
          
          // Add a 2-frame "soak" buffer after animation finishes to ensure final frame is seen
          if (currentFinished) {
            if (!(this.player1 as any).introFinishDelay) {
              (this.player1 as any).introFinishDelay = 2;
            }
            (this.player1 as any).introFinishDelay--;
          }

          if (currentFinished && (this.player1 as any).introFinishDelay <= 0) {
            (this.player1 as any).introFinishDelay = 0;
            if (hasNextIntro) {
              this.player1.ultPhase = currentIntroStep + 1;
              this.player1.animFrame = 0;
              this.player1.animTimer = 0;
              this.player1.animFinished = false;
              (this.player1 as any).customAnimFinishedThisFrame = false;
              p1Finished = false;
            } else {
              p1Finished = true;
            }
          }
        } else {
          p1Finished = this.introTimer <= 510; // Default wait if no intro
        }

        if (
          !this.introTransitioning &&
          (p1Finished || this.introTimer <= 0)
        ) {
          this.introTransitioning = true;
        }

        if (this.introTransitioning) {
          this.introFadeAlpha += 0.05;
          if (this.introFadeAlpha >= 1) {
            this.introFadeAlpha = 1;
            this.introPhase = IntroPhase.P2_INTRO;
            this.player1.state = PlayerState.IDLE;
            this.player1.animFinished = false;
            this.player2.state = PlayerState.INTRO;
            this.player2.animFinished = false;
            MoveManager.getInstance().startMove(this.player2, 'INTRO');
            const p2Config = CHARACTER_INTROS[this.player2.data.id];
            this.introTimer = p2Config ? p2Config.maxTime : 600; // Allow 10 seconds max for P2 intro
            this.introTransitioning = false;
          }
        } else if (this.introFadeAlpha > 0) {
          this.introFadeAlpha = Math.max(0, this.introFadeAlpha - 0.05);
        }
      } else if (this.introPhase === IntroPhase.P2_INTRO) {
        this.introTimer--;
        this.player1.state = PlayerState.IDLE;
        this.player2.state = PlayerState.INTRO;
        this.camera.focusOn(this.player2, CAM_MAX_ZOOM - 0.2);

        // Custom Intro for P2
        const customConfig = CHARACTER_INTROS[this.player2.data.id];
        const hasPhasedIntro = !!(this.player2.data as any).phasedMoves?.['INTRO'];
        
        if (customConfig && !hasPhasedIntro) {
          customConfig.update({
            progress: customConfig.maxTime - this.introTimer,
            worldWidth: this.worldWidth,
            groundY: WORLD_HEIGHT - this.groundY,
            isPlayer1: false,
            player: this.player2,
            opponent: this.player1,
          });
        } else if (hasPhasedIntro) {
          this.player2.pos.x = this.worldWidth / 2 + SPAWN_CENTER_OFFSET * 1;
          this.player2.pos.y = WORLD_HEIGHT - this.groundY;
          this.player2.state = PlayerState.INTRO;
        }

        // Move to READY when P2 intro finishes
        const hasP2Intro = !!(
          (this.player2.data.spriteConfig?.animations as any)?.[PlayerState.INTRO] ||
          (this.player2.data.spriteConfig?.animations as any)?.["INTRO_1"] ||
          customConfig ||
          (this.player2.data as any).phasedMoves?.['INTRO']
        );

        let p2Finished = false;
        if (this.player2.data.phasedMoves?.['INTRO'] && this.player2.currentPhasedMove === 'INTRO') {
          p2Finished = false;
        } else if (this.player2.data.phasedMoves?.['INTRO'] && !this.player2.currentPhasedMove) {
          p2Finished = true;
        } else if (customConfig) {
          p2Finished = customConfig.isCustomComplete
            ? customConfig.isCustomComplete(this.player2)
            : this.introTimer <= 0;
        } else if (hasP2Intro) {
          // Sequential Intro Support for P2
          const currentIntroStep = this.player2.ultPhase || 1;
          const nextIntroKey = `INTRO_${currentIntroStep + 1}`;
          const hasNextIntro = !!(this.player2.data.spriteConfig?.animations as any)?.[nextIntroKey] || 
                               !!(this.player2.data.spriteConfig?.animations as any)?.[nextIntroKey.toLowerCase()];

          const currentFinished = (this.player2.state === PlayerState.INTRO && this.player2.animFinished);

          // Soak buffer for P2
          if (currentFinished) {
            if (!(this.player2 as any).introFinishDelay) {
              (this.player2 as any).introFinishDelay = 2;
            }
            (this.player2 as any).introFinishDelay--;
          }

          if (currentFinished && (this.player2 as any).introFinishDelay <= 0) {
            (this.player2 as any).introFinishDelay = 0;
            if (hasNextIntro) {
              this.player2.ultPhase = currentIntroStep + 1;
              this.player2.animFrame = 0;
              this.player2.animTimer = 0;
              this.player2.animFinished = false;
              (this.player2 as any).customAnimFinishedThisFrame = false;
              p2Finished = false;
            } else {
              p2Finished = true;
            }
          }
        } else {
          p2Finished = this.introTimer <= 510;
        }

        if (
          !this.introTransitioning &&
          (p2Finished || this.introTimer <= 0)
        ) {
          this.introTransitioning = true;
          this.fadeAndStopIntroSFX();
          
          // Reset ultPhase used as counter for intros
          this.player1.ultPhase = 0;
          this.player2.ultPhase = 0;
        }

        if (this.introTransitioning) {
          this.introFadeAlpha += 0.05;
          if (this.introFadeAlpha >= 1) {
            this.introFadeAlpha = 1;
            this.introPhase = IntroPhase.READY;
            this.fightAudioPlayed = false;
            BattleAnnouncerManager.getInstance().playReady();
            this.player2.state = PlayerState.IDLE;
            this.player2.animFinished = false;
            this.player1.state = PlayerState.IDLE;
            this.player1.animFinished = false;
            this.forcePositionsForFight();

            const readySec = AudioManager.getInstance().getSFXDuration("ready");
            const fightSec = AudioManager.getInstance().getSFXDuration("fight");
            // Ensure at least 1.25s (75 frames) for READY and FIGHT text
            const readyFrames = Math.max(75, Math.ceil(readySec * 60));
            const fightFrames = Math.max(75, Math.ceil(fightSec * 60));
            this.introTimer = readyFrames + fightFrames;

            this.introTransitioning = false;
          }
        } else if (this.introFadeAlpha > 0) {
          this.introFadeAlpha = Math.max(0, this.introFadeAlpha - 0.05);
        }
      } else if (this.introPhase === IntroPhase.READY) {
        this.introTimer--;
        this.player1.state = PlayerState.IDLE;
        this.player2.state = PlayerState.IDLE;
        this.camera.update(this.player1, this.player2); // Pan camera back to center

        if (this.introFadeAlpha > 0) {
          this.introFadeAlpha = Math.max(0, this.introFadeAlpha - 0.05);
        }

        const fightSec = AudioManager.getInstance().getSFXDuration("fight");
        const fightFrames = Math.max(75, Math.ceil(fightSec * 60));

        if (this.introTimer === fightFrames && !this.fightAudioPlayed) {
          BattleAnnouncerManager.getInstance().playFight();
          this.fightAudioPlayed = true;
        }

        if (this.introTimer <= 0) {
          this.introPhase = IntroPhase.FIGHT;
          this.introTimer = fightFrames; // Show FIGHT! text for the duration
          this.player1.ultPhase = 0;
          this.player2.ultPhase = 0;
          this.camera.update(this.player1, this.player2, false, false, true);
        }
      }

      if (this.introPhase === IntroPhase.FIGHT && this.introTimer > 0) {
        this.introTimer--; // Decrement timer so FIGHT text disappears
      }

      if (this.introPhase !== IntroPhase.FIGHT) {
        // Do not process inputs or move characters while in intro
        // Only update physics for players NOT in custom intro ride
        const p1Config = CHARACTER_INTROS[this.player1.data.id];
        const p1PhysicsSkip = p1Config?.physicsOverrideDuration;
        if (
          !(
            this.introPhase === IntroPhase.P1_INTRO &&
            p1PhysicsSkip !== undefined &&
            p1Config.maxTime - this.introTimer < p1PhysicsSkip
          )
        ) {
          this.updatePhysics(this.player1);
          this.applyCameraBounds(this.player1);
        }

        const p2Config = CHARACTER_INTROS[this.player2.data.id];
        const p2PhysicsSkip = p2Config?.physicsOverrideDuration;
        if (
          !(
            this.introPhase === IntroPhase.P2_INTRO &&
            p2PhysicsSkip !== undefined &&
            p2Config.maxTime - this.introTimer < p2PhysicsSkip
          )
        ) {
          this.updatePhysics(this.player2);
          this.applyCameraBounds(this.player2);
        }

        this.resolveFacingDirection(this.player1, this.player2);
        this.updateGameLogic();

        // Render characters
        this.updateAnimations(this.player1);
        this.updateAnimations(this.player2);

        this.applyCameraOverrides([this.player1, this.player2]);
        this.frameCount++;
        this.emitGameState();
        return;
      }
    }

    if (
      !this.isTraining &&
      this.gameTimer > 0 &&
      !this.koSequenceActive &&
      !this.koClashActive
    ) {
      const p1Dead = this.p1Team.every((p) => p.hp <= 0);
      const p2Dead = this.p2Team.every((p) => p.hp <= 0);
      if (!p1Dead && !p2Dead) {
        // this.gameTimer--; // Desativado a pedido do jogador
      }
    }

    if (this.p1TagCooldown > 0) this.p1TagCooldown--;
    if (this.p2TagCooldown > 0) this.p2TagCooldown--;

    const allPlayers = [...this.p1Team, ...this.p2Team].filter(
      Boolean,
    ) as Player[];
    let finalP1Input = p1Input;
    let finalP2Input = p2Input;

    if (this.koSequenceActive || this.koDefeatedPlayer !== null) {
      // Lock inputs during KO transition
      finalP1Input = {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        attack: false,
        light: false,
        medium: false,
        heavy: false,
        special: false,
        block: false,
        vanish: false,
        assist1: false,
        assist2: false,
        tag: false,
        ultimate: false,
        dash: false,
        charge: false,
        transform: false,
        fusion: false,
        dragonRush: false,
      };
      finalP2Input = {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false,
        attack: false,
        light: false,
        medium: false,
        heavy: false,
        special: false,
        block: false,
        vanish: false,
        assist1: false,
        assist2: false,
        tag: false,
        ultimate: false,
        dash: false,
        charge: false,
        transform: false,
        fusion: false,
        dragonRush: false,
      };
    }

    const p1Frozen = this.getPlayerTimeFreezeStatus(this.player1);
    const p2Frozen = this.getPlayerTimeFreezeStatus(this.player2);

    if (!p1Frozen) this.processPlayerInput(this.player1, finalP1Input);
    if (!p2Frozen) this.processPlayerInput(this.player2, finalP2Input);

    // Physics
    allPlayers.forEach((p) => {
      if (p.state !== PlayerState.STANDBY) {
        const isFrozen =
          (p === this.player1 && p1Frozen) || (p === this.player2 && p2Frozen);
        if (isFrozen) {
          p.velocity.x = 0;
          p.velocity.y = 0;
        } else {
          this.updatePhysics(p);
        }

        // --- NEW: Continuous Super Dash Dust if strictly on ground ---
        if (p.state === PlayerState.SUPER_DASH) {
          const groundY = WORLD_HEIGHT - (this.groundY || 140);
          const distanceToGround = Math.abs((p.y + p.height) - groundY);
          if (distanceToGround < 10 && this.frameCount % 5 === 0) {
             this.spawnVisualEffect(
                "SUPER_DASH_DUST",
                p.x + p.width / 2,
                p.y + p.height,
                "/Assets/efeitos/poeira/5.gif",
                15,
                false,
                p === this.player1 ? "p1" : "p2",
                2.5,
                p.facingRight
              );
          }
        }
      }
    });

    // Handle TAG_OUT disappearing and assistCooldown
    allPlayers.forEach((p) => {
      if (p.assistCooldown > 0) p.assistCooldown--;

      if (p.state === PlayerState.TAG_OUT) {
        p.attackTimer--;
        if (p.attackTimer <= 0) {
          p.state = PlayerState.STANDBY;
        }
      } else if (p.state === PlayerState.TAG_IN) {
        const opp = [this.player1, ...this.p1Team].includes(p)
          ? this.player2
          : this.player1;
        if (!opp) {
          p.state = PlayerState.IDLE;
          return;
        }
        const dx = opp.pos.x - p.pos.x;
        const dy = opp.y - p.y;

        if (p.isKOTag) {
          p.velocity.x = 0;
          p.velocity.y = 0;
          p.facingRight = dx > 0;
          if (p.animFinished || p.attackTimer <= 0) {
            p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            p.isKOTag = false;
            p.attackTimer = 0;
            p.animFinished = false;
          }
          return; // Skip normal dash tag logic
        }

        const dist = Math.sqrt(dx * dx + dy * dy);

        p.facingRight = dx > 0;
        const speed = 50;

        if (dist > 60) {
          p.velocity.x = (dx / dist) * speed;
          p.velocity.y = (dy / dist) * speed;
        } else {
          p.velocity.x = 0;
          p.velocity.y = 0;
        }

        this.particleManager.spawn(
          "AURA",
          p.x + p.width / 2,
          p.y + p.height / 2,
          1,
          p.data.color,
          { size: 4, speed: 0 },
        );

        // attackTimer is decremented in updatePhysics
        if (dist <= 60 || p.attackTimer <= 0) {
          p.state = PlayerState.JUMPING; // Ready to combo!
          p.isKOTag = false;
          p.isGrounded = false;
          p.velocity.y = -15;
          p.velocity.x = p.facingRight ? 5 : -5; // Move towards opponent!
          p.attackTimer = 0;
          p.invincibleTimer = 30;
          p.gravityDisabledTimer = 0; // Don't suspend gravity
          p.comboWindow = 30;

          p.pos.y = opp.pos.y; // guarantee they align vertically

          // If reached opponent, hit them!
          if (
            dist <= 60 &&
            opp.hp > 0 &&
            opp.state !== PlayerState.TAG_OUT &&
            opp.state !== PlayerState.TAG_IN
          ) {
            const isOppBlocking =
              (opp.state === PlayerState.BLOCKING ||
                opp.state === PlayerState.BLOCKING_AIR ||
                opp.state === PlayerState.BLOCKING_CROUCH) &&
              opp.facingRight !== p.facingRight;

            if (isOppBlocking) {
              opp.stunTimer = 15;
              this.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                true,
              );
            } else if (
              opp.state !== PlayerState.HIT ||
              p.comboType === "BURST"
            ) {
              opp.state = PlayerState.HIT;
              if (p.comboType === "BURST") {
                opp.stunTimer = 45;
                opp.velocity.x = p.facingRight ? 20 : -20;
                opp.velocity.y = -10;
                opp.isGrounded = false;
                this.particleManager.spawn(
                  "ENERGY",
                  opp.x + opp.width / 2,
                  opp.y + opp.height / 2,
                  8,
                  "#ff0000",
                  { size: 6, speed: 6 },
                );
                p.comboType = "NONE";
              } else {
                opp.ataque = false;
                opp.stunTimer = 40; // Long enough for air combo
                opp.isGrounded = false;
                opp.velocity.y = -15; // Launch up with attacker
                opp.velocity.x = p.facingRight ? 2 : -2; // Very slow drift
                opp.gravityDisabledTimer = 0; // Don't suspend gravity
              }
              opp.hp = Math.max(1, opp.hp - 15);
              this.particleManager.spawnHitSpark(
                opp.x + opp.width / 2,
                opp.y + opp.height / 2,
                false,
              );
            }
          }
        }
      }
    });

    // Collisions (only active players or tags if needed, but for now active only)
    this.resolveBodyCollision(this.player1, this.player2);
    this.updateProjectiles();
    this.updateAfterimages(allPlayers);

    // Ensure rotation is strictly cleared for everyone unless they are in specific dash states
    allPlayers.forEach((p) => {
      const needsRotation = 
        p.state === PlayerState.SUPER_DASH || 
        p.state === PlayerState.DRAGON_RUSH || 
        p.state === PlayerState.DRAGON_COMBO ||
        p.state === PlayerState.DRAGON_DASH_FOLLOW ||
        p.state === PlayerState.DASHING;
      if (!needsRotation && p.rotation !== undefined && p.rotation !== 0) {
        p.rotation = 0;
      }
    });

    // Constraints and camera overrides
    this.applyCameraOverrides(allPlayers);

    allPlayers.forEach((p) => {
      if (p.state !== PlayerState.STANDBY) {
        this.applyCameraBounds(p);
      }
    });
    this.resolveFacingDirection(this.player1, this.player2);

    // Game Rules
    this.updateGameLogic();

    // Animations
    allPlayers.forEach((p) => {
      if (p.state !== PlayerState.STANDBY) {
        const isFrozen =
          (p === this.player1 && p1Frozen) || (p === this.player2 && p2Frozen);
        if (!isFrozen) {
          this.updateAnimations(p);
        }
      }

      // Manage ki charge sound loop and aura scaling per active player
      if (p === this.player1 || p === this.player2) {
        const chargeLoopKey = p === this.player1 ? "ki_charge_p1" : "ki_charge_p2";
        
        const isCharging = p.state === PlayerState.CHARGING || p.state === PlayerState.CHARGE_START;
        const isTransforming = p.state === PlayerState.TRANSFORM || p.state === PlayerState.DETRANSFORM;
        const isSparking = p.sparkingTimer > 0;
        
        if (isCharging || isTransforming || isSparking) {
          this.camera.addScreenShake(2, 2, "PERLIN", 1);
          
          if (isCharging) {
            try {
              AudioManager.getInstance().playLoopedSFX("ki_charge_loop", chargeLoopKey);
            } catch (e) {
              console.error("Failed to play ki_charge_loop:", e);
            }
          }
          
          // Smoothly grow aura
          p.auraHeightScale = Math.min(1.2, p.auraHeightScale + 0.08);
          p.auraWidthScale = Math.min(1.1, p.auraWidthScale + 0.06);
          
          // Lock broken ground position to the player's bottom center when they start charging
          if (p.brokenGroundAlpha === 0) {
            p.brokenGroundX = p.pos.x;
            p.brokenGroundY = p.pos.y;
          }
          // Force broken ground instantly without fade-in
          p.brokenGroundAlpha = 1.0;
        } else {
          if (chargeLoopKey) {
            try {
              AudioManager.getInstance().stopLoopedSFX(chargeLoopKey);
            } catch (e) {
              // Silence
            }
          }
          
          // Smoothly dissipate aura
          if (p.state === PlayerState.CHARGE_END) {
             p.auraHeightScale = Math.max(0, p.auraHeightScale - 0.04);
             p.auraWidthScale = Math.max(0, p.auraWidthScale - 0.03);
          } else {
             p.auraHeightScale = Math.max(0, p.auraHeightScale - 0.1);
             p.auraWidthScale = Math.max(0, p.auraWidthScale - 0.1);
          }
          
          // Fade out/disappear broken ground when they stop charging
          p.brokenGroundAlpha = Math.max(0.0, p.brokenGroundAlpha - 0.02);
        }
      } else {
        // Standby players should have their broken ground faded out and shouldn't play or block sound loops
        p.brokenGroundAlpha = Math.max(0.0, p.brokenGroundAlpha - 0.02);
      }

      // Tick and update genkidamaGroundCracks lifetimes
      if (!p.genkidamaCracks) {
        p.genkidamaCracks = [];
      }
      for (let i = p.genkidamaCracks.length - 1; i >= 0; i--) {
        const crack = p.genkidamaCracks[i];
        crack.life--;
        // fade out gracefully at the end of its life (for the last 40 frames)
        if (crack.life <= 40) {
          crack.alpha = Math.max(0.0, crack.life / 40.0);
        }
        if (crack.life <= 0) {
          p.genkidamaCracks.splice(i, 1);
        }
      }

      if (p.state === PlayerState.CHARGING) {
        // Handled above with audio
      } else if (
        p.state === PlayerState.TRANSFORM ||
        p.state === PlayerState.DETRANSFORM ||
        p.state === PlayerState.FUSION ||
        p.state === PlayerState.DEFUSION
      ) {
        this.camera.addScreenShake(2, 4, "PERLIN", 1.5);
      }
    });

    // Passive Health Regeneration System
    const p1HpAfter = this.player1 ? this.player1.hp : 0;
    const p2HpAfter = this.player2 ? this.player2.hp : 0;

    // If active player 1 or 2 took damage, reset outOfCombat timers for active players
    if (p1HpAfter < p1HpBefore || p2HpAfter < p2HpBefore) {
      if (this.player1) {
        this.player1.outOfCombatFrames = 0;
        this.player1.regenTimer = 0;
      }
      if (this.player2) {
        this.player2.outOfCombatFrames = 0;
        this.player2.regenTimer = 0;
      }
    }

    const ALLOWED_REGEN_STATES = [
      PlayerState.STANDBY,
      PlayerState.IDLE,
      PlayerState.RUNNING,
      PlayerState.WALK_BACKWARD,
      PlayerState.CROUCH,
      PlayerState.JUMPING,
      PlayerState.FALLING,
      PlayerState.LANDING
    ];

    allPlayers.forEach((p) => {
      // 1. Only alive characters can recover life
      if (p.hp <= 0 || p.hp >= p.maxHp) {
        p.outOfCombatFrames = 0;
        p.regenTimer = 0;
        return;
      }

      // 1b. Active fighters can NEVER recover health and must have recovery interrupted immediately
      const isActiveFighter = p === this.player1 || p === this.player2;
      if (isActiveFighter) {
        p.outOfCombatFrames = 0;
        p.regenTimer = 0;
        return;
      }

      // 2. Character cannot be executing attacks, abilities, specials, ultimates, combos, blocks, dodges, or any combat action
      const isExecutingCombatAction =
        !ALLOWED_REGEN_STATES.includes(p.state) ||
        p.comboStep > 0 ||
        p.comboWindow > 0 ||
        p.queuedAttack !== null ||
        p.isKOTag;

      if (isExecutingCombatAction) {
        p.outOfCombatFrames = 0;
        p.regenTimer = 0;
      } else {
        // 3. Increment out-of-combat frame counter (only during active fight phase)
        const isFightActive = this.introPhase === IntroPhase.FIGHT && !this.koSequenceActive;
        if (isFightActive) {
          p.outOfCombatFrames++;

          // 4. Regeneration starts after 3 seconds (180 frames) without receiving/dealing damage or combat action
          if (p.outOfCombatFrames >= 180) {
            p.regenTimer++;

            // 5. Recover life every 3 seconds (180 frames)
            if (p.regenTimer >= 180) {
              const regenAmount = p.maxHp * 0.03; // 3% of total max health
              p.hp = Math.min(p.maxHp, p.hp + regenAmount);
              p.regenTimer = 0; // reset the interval timer to 0
            }
          }
        } else {
          p.outOfCombatFrames = 0;
          p.regenTimer = 0;
        }
      }
    });

    this.particleManager.update();

    // Reset custom animation flags at the END of simulation so they can be read by renderers and other modules in the same frame
    if (this.player1) (this.player1 as any).customAnimFinishedThisFrame = false;
    if (this.player2) (this.player2 as any).customAnimFinishedThisFrame = false;
    this.p1Team?.forEach(p => { if (p) (p as any).customAnimFinishedThisFrame = false; });
    this.p2Team?.forEach(p => { if (p) (p as any).customAnimFinishedThisFrame = false; });
  }

  public resolveFacingDirection(p1: Player, p2: Player) {
    const p1Center = p1.pos.x;
    const p2Center = p2.pos.x;
    const dist = p1Center - p2Center;
    if (Math.abs(dist) > 5) {
      const p1ShouldFaceRight = dist < 0;
      const p2ShouldFaceRight = dist > 0;

      const shouldPreventTurn = (p: Player) => {
        if (p.state === PlayerState.ULTIMATE) return false;
        return (
          p.stunTimer > 0 ||
          p.attackTimer > 0 ||
          p.ataque === true ||
          p.state === PlayerState.HIT ||
          p.state === PlayerState.HIT_2 ||
          p.state === PlayerState.HIT_3 ||
          p.state === PlayerState.FALLING_HIT ||
          p.state === PlayerState.FALLING_HIT_GROUND ||
          p.state === PlayerState.LAUNCHED ||
          p.state === PlayerState.AIR_RECOVERY ||
          p.state === PlayerState.GROUND_RECOVERY ||
          p.state === PlayerState.KNOCKED_DOWN ||
          p.state === PlayerState.STUNNED ||
          p.state === PlayerState.GUARD_BREAK ||
          p.state === PlayerState.DRAGON_RUSH ||
          p.state === PlayerState.MUI_DODGE ||
          p.state === PlayerState.VANISH ||
          p.state === PlayerState.VANISH_APPEAR ||
          p.state === PlayerState.TRANSFORM ||
          p.state === PlayerState.DETRANSFORM ||
          p.state === PlayerState.FUSION ||
          p.state === PlayerState.DEFUSION
        );
      };

      if (
        p1.state !== PlayerState.DASHING &&
        p1.hp > 0 &&
        !shouldPreventTurn(p1)
      )
        p1.facingRight = p1ShouldFaceRight;
      if (
        p2.state !== PlayerState.DASHING &&
        p2.hp > 0 &&
        !shouldPreventTurn(p2)
      )
        p2.facingRight = p2ShouldFaceRight;
    }
  }

  public performAttack(
    p: Player,
    type:
      | "LIGHT"
      | "MEDIUM"
      | "HEAVY"
      | "KI_BLAST"
      | "SPECIAL"
      | "SPECIAL_2"
      | "SPECIAL_3"
      | "SPECIAL_4"
      | "SPECIAL_5"
      | "SPECIAL_6"
      | "SPECIAL_7"
      | "SPECIAL_8"
      | "SPECIAL_9"
      | "SPECIAL_10",
    isCrouching: boolean = false,
  ) {
    if (p.airComboLockout && !p.isGrounded) return;
    p.quickDashTimer = 0;
    const isSpecial = type.startsWith("SPECIAL") || type === "KI_BLAST";
    if (isSpecial) {
      const myProjs = this.projectiles.filter(
        (proj) => proj.ownerId === (p === this.player1 ? "p1" : "p2"),
      );
      if (myProjs.length >= MAX_PROJECTILES) return;
      if (p.projectileCooldown > 0) return;
      const stateToTest = !p.isGrounded
        ? PlayerState.JUMP_ATTACK
        : isCrouching
          ? PlayerState.CROUCH_ATTACK
          : PlayerState.ATTACKING;
      const animKey =
        resolveAnimationKey(
          p.data.id,
          stateToTest,
          type,
          undefined,
          true,
          undefined,
          undefined,
          50,
        ) || stateToTest;
      const currentAnim = p.data.spriteConfig?.animations?.[animKey];
      const hasBeam =
        currentAnim?.createsBeam ||
        p.data.spriteConfig?.animations?.["BEAM_START"] !== undefined ||
        p.data.spriteConfig?.animations?.["ATTACK_SPECIAL_LOOP"]
          ?.createsBeam !== undefined ||
        p.data.spriteConfig?.animations?.["SPECIAL_1_2"]
          ?.createsBeam !== undefined;
       const specialCost =
        type.startsWith("SPECIAL_") || hasBeam ? 200 : KI_BLAST_COST;

      const isAssist = p !== this.player1 && p !== this.player2;
      if (!isAssist) {
        if (p.ki < specialCost) return;
        p.ki -= specialCost;
      }

      let nextStep = 0;
      if (type === "KI_BLAST") {
        const KI_BLAST_LIMITS: Record<string, { ground: number; air: number }> = {
          gogeta_ssj4: { ground: 4, air: 4 },
          goku_base_swl_removed: { ground: 4, air: 4 },
          goku_base: { ground: 4, air: 4 },
          kuririn: { ground: 4, air: 3 },
          goku_ssj: { ground: 2, air: 2 },
          goku_blue: { ground: 2, air: 2 },
          goku_black_rose: { ground: 2, air: 2 },
          vegeta_base: { ground: 2, air: 2 },
          gogeta: { ground: 1, air: 1 },
          gogeta_ssj: { ground: 1, air: 1 },
          gogeta_blue: { ground: 2, air: 2 },
          goku_mui: { ground: 1, air: 1 },
          trunks_ssj2: { ground: 2, air: 2 },
          vegeta_ego: { ground: 1, air: 1 },
          majin_buu_gohan: { ground: 2, air: 2 },
          piccolo: { ground: 2, air: 2 },
          teen_gohan_ssj2: { ground: 2, air: 2 },
          frieza_final: { ground: 2, air: 2 },
          broly_ikari: { ground: 2, air: 2 },
          vegeta_ssj_majin: { ground: 2, air: 2 },
        };
        const limits = KI_BLAST_LIMITS[p.data.id] || { ground: 1, air: 1 };
        const maxK = p.isGrounded ? limits.ground : limits.air;
        const lastFrame = (p as any).lastKiBlastFrame || 0;
        const lastStep = (p as any).lastKiBlastStep || 0;
        const diff = this.frameCount - lastFrame;
        if (diff < 45 && lastStep < maxK - 1) {
          nextStep = lastStep + 1;
        }
        (p as any).lastKiBlastFrame = this.frameCount;
        (p as any).lastKiBlastStep = nextStep;
        (p as any).beamSpawned = false; // guarantee projectile spawning for next phase
      }

      p.state = stateToTest;
      if (!p.isGrounded) p.airComboUsed = true;
      p.ataque = true;
      p.comboType = type as any;
      p.comboStep = nextStep;

      // Track mission progress for human player
      if (p === this.player1 && !this.isP1Bot && type.startsWith("SPECIAL")) {
        EventSystem.getInstance().publish("MISSION_ACTION", {
          action: "SUPER_EXECUTE",
          amount: 1,
        });
      }

      let timer = hasBeam && type !== "KI_BLAST" ? 180 : 30;
      if (
        p.data.id === "gogeta_blue" ||
        p.data.id === "trunks_ssj2" ||
        p.data.id === "teen_gohan_ssj2"
      ) {
        if (type === "SPECIAL") timer = 180;
        if (type === "SPECIAL_4") {
          timer = p.data.id === "teen_gohan_ssj2" ? 999 : 300; // Sequence handles its own timers
        }
        if (type === "SPECIAL_3" && p.data.id === "teen_gohan_ssj2") timer = 999;
      }
      if ((p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base")) {
        if (type === "SPECIAL") timer = 999;
      }
      if (p.data.id === "broly_ikari") {
        if (type === "SPECIAL_4") timer = 999;
        if (type === "SPECIAL_3") timer = 999;
        if (type === "SPECIAL_2") timer = 999;
      }
      if (p.data.id === "gogeta_ssj4") {
        if (
          type === "SPECIAL" ||
          type === "SPECIAL_2" ||
          type === "SPECIAL_3" ||
          type === "SPECIAL_4"
        ) {
          timer = 999;
        }
      }
      if (p.data.id === "gogeta_ssj") {
        if (type === "SPECIAL") timer = 300;
        if (type === "SPECIAL_2") timer = 300;
      }
      if (p.data.id === "goku_black_rose") {
        if (type === "SPECIAL") timer = 999;
        if (type === "SPECIAL_2") timer = 999;
        if (type === "SPECIAL_3") timer = 999;
      }
      if (p.data.id === "kuririn") {
        if (
          type === "SPECIAL" ||
          type === "SPECIAL_2" ||
          type === "SPECIAL_3" ||
          type === "SPECIAL_4"
        ) {
          timer = 999;
        }
      }
      if (
        p.data.id === "goku_blue_gif" ||
        p.data.id === "goku_ssj"
      ) {
        if (type === "SPECIAL_2") timer = 80;
        if (type === "SPECIAL_3") timer = 80;
      }
      if (p.data.id === "goku_mui") {
        if (
          type === "SPECIAL_2" ||
          type === "SPECIAL_3" ||
          type === "SPECIAL_4" ||
          type === "SPECIAL_5" ||
          type === "SPECIAL_6" ||
          type === "SPECIAL_7" ||
          type === "SPECIAL_8" ||
          type === "SPECIAL_9" ||
          type === "SPECIAL_10"
        ) {
          timer = 180;
        }
      }
      p.attackTimer = timer;

      p.projectileCooldown = hasBeam ? 80 : KI_BLAST_COOLDOWN;
      p.animFrame = 0;
      p.animTimer = 0;
      p.animFinished = false;
      p.velocity.x = 0;
      if (p.data.id === "goku_mui" && p.comboType === "SPECIAL") {
        p.velocity.x = p.facingRight ? 20 : -20;
        p.attackTimer = 35; // Dash time
      }
      if (!p.isGrounded) p.velocity.y = 0;
      return;
    }

    const opp = p === this.player1 ? this.player2 : this.player1;
    const oppLaunched =
      opp.state === PlayerState.LAUNCHED ||
      opp.state === PlayerState.KNOCKED_DOWN ||
      (opp.state === PlayerState.HIT &&
        (Math.abs(opp.velocity.y) >= 5 || Math.abs(opp.velocity.x) >= 5)) ||
      (opp.state === PlayerState.FALLING && opp.stunTimer > 0);

    // Basic attack combo restriction: can only proceed to next attack if previous is finished
    if (p.ataque && !p.animFinished && (type === "LIGHT" || type === "MEDIUM" || type === "HEAVY")) {
      return;
    }

    let nextStep = 0;
    const targetState = !p.isGrounded
      ? PlayerState.JUMP_ATTACK
      : isCrouching
        ? PlayerState.CROUCH_ATTACK
        : PlayerState.ATTACKING;

    // Check if the auto dash should be triggered for falling state after completing an air combo
    // Disabled - Dash removed completely


    if (p.state === targetState || p.comboWindow > 0) {
      let maxComboStep = 5;
      if (p.data.id === "goku_mui" && type === "SPECIAL") maxComboStep = 13;
      if (p.comboType === type && p.comboStep < maxComboStep)
        nextStep = p.comboStep + 1;
      else if (p.comboType !== type) nextStep = 0;
      else {
        return;
      }
    }

    // New Phased Animation System Integration
    // Logic: Map standard inputs to Phased Move IDs if defined in character data
    let phasedMoveId: string | null = null;
    if (p.input) {
        const isBackHeld = p.facingRight ? p.input.left : p.input.right;

        if (p.isGrounded) {
            if (isCrouching) {
                const isForwardHeld = p.facingRight ? p.input.right : p.input.left;
                if (type === "LIGHT") {
                    phasedMoveId = 'CROUCH_LIGHT';
                } else if (type === "MEDIUM") {
                    phasedMoveId = isBackHeld ? 'CROUCH_BACK_MEDIUM' : (isForwardHeld ? 'CROUCH_FORWARD_MEDIUM' : 'CROUCH_MEDIUM');
                } else if (type === "HEAVY") {
                    phasedMoveId = isBackHeld ? 'CROUCH_BACK_HEAVY' : (isForwardHeld ? 'CROUCH_FORWARD_HEAVY' : 'CROUCH_HEAVY');
                }
            } else {
                if (type === "LIGHT") {
                    phasedMoveId = nextStep === 0 ? 'STAND_LIGHT_1' : (nextStep === 1 ? 'STAND_LIGHT_2' : (nextStep === 2 ? 'STAND_LIGHT_3' : 'STAND_LIGHT_1'));
                } else if (type === "MEDIUM") {
                    phasedMoveId = nextStep === 0 ? 'STAND_MEDIUM_1' : (nextStep === 1 ? 'STAND_MEDIUM_2' : (nextStep === 2 ? 'STAND_MEDIUM_3' : 'STAND_MEDIUM_1'));
                } else if (type === "HEAVY") {
                    phasedMoveId = 'STAND_HEAVY';
                }
            }
        } else {
            const isForwardHeld = p.facingRight ? p.input.right : p.input.left;
            if (type === "LIGHT") phasedMoveId = p.input.up ? 'AIR_LIGHT_UP' : 'AIR_LIGHT';
            else if (type === "MEDIUM") phasedMoveId = isForwardHeld ? 'AIR_MEDIUM_FORWARD' : 'AIR_MEDIUM';
            else if (type === "HEAVY") phasedMoveId = p.input.up ? 'AIR_HEAVY_UP' : 'AIR_HEAVY';
        }
    }

    // Try both phasedMoveId and the common version (with/without _1 suffix)
    if (phasedMoveId) {
        const moveManager = MoveManager.getInstance();
        const finalMoveId = (p.data.phasedMoves?.[phasedMoveId] || moveManager.hasMove(phasedMoveId)) 
            ? phasedMoveId 
            : p.data.phasedMoves?.[phasedMoveId + '_1']
                ? phasedMoveId + '_1'
                : (phasedMoveId.endsWith('_1') && (p.data.phasedMoves?.[phasedMoveId.replace('_1', '')] || moveManager.hasMove(phasedMoveId.replace('_1', ''))))
                    ? phasedMoveId.replace('_1', '')
                    : null;

        if (finalMoveId) {
            moveManager.startMove(p, finalMoveId);
            p.comboStep = nextStep;
            p.comboType = type as any;
            p.comboWindow = 60;
            p.hasHit = false;
            
            this.playComboVoice(p, type);
            return;
        }
    }

    p.state = targetState;
    if (!p.isGrounded) p.airComboUsed = true;
    p.ataque = true;
    p.comboType = type as any;
    p.comboStep = nextStep;

    // Goku Combo Voices (Goku Base, SSJ, Blue, MUI, Black Rose)
    this.playComboVoice(p, type);

    p.animFrame = 0;
    p.animTimer = 0;
    p.animFinished = false;
    p.ataque = true;
    p.hasHit = false;
    p.animDelayActive = false; // Reset delay so combo animation switches immediately
    p.comboWindow = ATTACK_COOLDOWN + 45; // Lingers much longer for better combo display

    let duration = ATTACK_COOLDOWN;
    if (type === "LIGHT") duration = 18;
    if (type === "MEDIUM") duration = 24;
    if (type === "HEAVY") duration = 30;
    p.attackTimer = duration;

    const animKey = resolveAnimationKey(
        p.data.id,
        targetState,
        type,
        nextStep,
        true,
        undefined,
        undefined,
        50,
        undefined,
        p.isGrounded,
        false,
        false,
        p.data.spriteConfig
    ) || targetState;
    const currentAnim = p.data.spriteConfig?.animations?.[animKey];

    if (p.state === PlayerState.JUMP_ATTACK) {
      p.velocity.y = currentAnim?.moveY !== undefined ? currentAnim.moveY : -2; // Stall slightly (default -2 if not specified)
      if (currentAnim?.velocityJump) {
        p.velocity.y = currentAnim.velocityJump.y;
        p.velocity.x = p.facingRight ? currentAnim.velocityJump.x : -currentAnim.velocityJump.x;
      } else {
        p.velocity.x = (p.facingRight ? 4 : -4) * 0.65; // Forward lunge in air reduced by 35%
      }
    } else {
      if (currentAnim?.velocityJump) {
        p.velocity.y = currentAnim.velocityJump.y;
        p.velocity.x = p.facingRight ? currentAnim.velocityJump.x : -currentAnim.velocityJump.x;
      } else {
        let lunge = 0;
        if (type === "LIGHT") lunge = 6;
        if (type === "MEDIUM") lunge = 4;
        if (type === "HEAVY") lunge = 2;
        if (nextStep === 2) lunge += 4;
        if (isCrouching) {
          if (type === "HEAVY") {
            lunge = 2; // slight forward movement
          } else {
            if (nextStep === 0)
              lunge = 0; // Anim 1 não move
            else if (nextStep === 1)
              lunge = 4; // Anim 2 move
            else if (nextStep === 2) lunge = 6; // Anim 3 move
          }
        }
        if (type === "HEAVY" && !isCrouching && (p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base")) {
          lunge = 0;
        }
        p.velocity.x = (p.facingRight ? lunge : -lunge) * 0.65;
        
        // Crouch/Stand only move up if specified in animation (via moveY or velocityJump)
        if (currentAnim?.moveY !== undefined) {
           p.velocity.y = currentAnim.moveY;
        }
      }
    }

    AudioManager.getInstance().playSFX("attack");

    if (nextStep === 2 || type === "HEAVY") {
      this.particleManager.spawn(
        "ENERGY",
        p.x + p.width / 2,
        p.y + p.height / 2,
        5,
        "#ffffff",
      );
    }
  }

  private playComboVoice(p: Player, type: string) {
    if (type === "LIGHT" || type === "MEDIUM" || type === "HEAVY") {
      if (
        (p.data.id === "goku_base_swl_removed" || p.data.id === "goku_base") ||
        p.data.id === "goku_ssj" ||
        p.data.id === "goku_blue_gif" ||
        p.data.id === "goku_mui"
      ) {
        const files = [1, 4, 5, 6, 7, 8, 9];
        const num = files[Math.floor(Math.random() * files.length)];
        const voiceUrl = `/Assets/SONS/DUBLAGEM/GOKU%20BASE/COMBO%20(${num}).wav`;
        try {
          AudioManager.getInstance().playVoice(voiceUrl);
        } catch (err) {
          console.error(`Failed to play Goku combo voice (Base/Transformations):`, err);
        }
      } else if (p.data.id === "goku_black_rose") {
        const files = [1, 6, 7, 8, 9];
        const num = files[Math.floor(Math.random() * files.length)];
        const voiceUrl = `/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE/COMBO%20(${num}).wav`;
        try {
          AudioManager.getInstance().playVoice(voiceUrl);
        } catch (err) {
          console.error(`Failed to play Goku Black Rose combo voice:`, err);
        }
      } else if (p.data.id === "vegeta_base") {
        const num = Math.floor(Math.random() * 9) + 1; // 1 to 9
        const voiceUrl = `/Assets/SONS/DUBLAGEM/VEGETA%20BASE/COMBO%20(${num}).wav`.replace(/ /g, "%20");
        try {
          AudioManager.getInstance().playVoice(voiceUrl);
        } catch (err) {
          console.error(`Failed to play Vegeta Base combo voice:`, err);
        }
      } else if (p.data.id === "teen_gohan_ssj2") {
        const files = ["COMBO.wav", "COMBO (2).wav", "COMBO (3).wav", "COMBO (4).wav"];
        const file = files[Math.floor(Math.random() * files.length)];
        const voiceUrl = `/Assets/SONS/DUBLAGEM/TEEN%20GOHAN%20SSJ2/${file}`.replace(/ /g, "%20");
        try {
          AudioManager.getInstance().playVoice(voiceUrl);
        } catch (err) {
          console.error(`Failed to play Gohan combo voice:`, err);
        }
      } else if (p.data.id === "frieza_final") {
        const files = ["COMBO.wav", "COMBO (2).wav", "COMBO (3).wav", "COMBO (4).wav", "COMBO (5).wav", "COMBO (6).wav"];
        const file = files[Math.floor(Math.random() * files.length)];
        const voiceUrl = `/Assets/SONS/DUBLAGEM/FREEZA/${file}`.replace(/ /g, "%20");
        try {
          AudioManager.getInstance().playVoice(voiceUrl);
        } catch (err) {
          console.error(`Failed to play Frieza combo voice:`, err);
        }
      }
    }
  }

  public tryTagBreak(p: Player, input: InputState): boolean {
    if (p.state !== PlayerState.HIT && p.state !== PlayerState.STUNNED)
      return false;
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const tagPressed = input.tag && (!prevInput || !prevInput.tag);
    if (!tagPressed) return false;

    const isP1 = p === this.player1 || this.p1Team.includes(p);
    const tagCooldown = isP1 ? this.p1TagCooldown : this.p2TagCooldown;
    if (tagCooldown > 0) return false;

    if (p.ki < 100) return false;
    if (p.hp <= 0) return false;

    const opp = isP1 ? this.player2 : this.player1;
    if (opp.state === PlayerState.ULTIMATE || opp.state === PlayerState.TAG_OUT)
      return false;

    if (this.tryTag(p, false, false, true)) {
      p.ki -= 100;
      return true;
    }
    return false;
  }

  public trySparkingBlast(p: Player, input: InputState): boolean {
    if (p.hasSparked || p.hp <= 0) return false;

    // Cannot spark if in hitstun (unlike Burst, DBFZ Sparking doesn't break combos while getting hit)
    if (
      p.state === PlayerState.HIT ||
      p.state === PlayerState.LAUNCHED ||
      p.state === PlayerState.KNOCKED_DOWN
    )
      return false;

    // Map Sparking to Light+Medium+Heavy, or checking a new sparking button (if exists). Or when 'dash' + 'block' + 'attack' is pressed?
    // For now: require Block + Tag concurrently to Spark
    if (input.block && input.tag) {
      p.hasSparked = true;
      p.sparkingTimer = 60 * 60; // ~60 seconds
      p.state = PlayerState.SPARKING;
      p.attackTimer = 60; // Long animation
      p.stunTimer = 0; // Clear blockstun
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.invincibleTimer = 60;
      // Shockwave
      const opp = p === this.player1 ? this.player2 : this.player1;
      const dx = opp.x - p.x;
      if (Math.abs(dx) < 250) {
        opp.state = PlayerState.LAUNCHED;
        opp.stunTimer = 60;
        opp.velocity.y = -15;
        opp.velocity.x = dx > 0 ? 10 : -10;
        opp.isGrounded = false;
      }
      this.particleManager.spawn(
        "ENERGY",
        p.x + p.width / 2,
        p.y + p.height / 2,
        20,
        "#ff0000",
        { size: 10, speed: 15 },
      );
      return true;
    }
    return false;
  }

  public tryFusion(p: Player, input: InputState): boolean {
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const fusionPressed = input.fusion && (!prevInput || !prevInput.fusion);
    if (!fusionPressed) return false;

    const isP1 = p === this.player1 || this.p1Team.includes(p);
    const team = isP1 ? this.p1Team : this.p2Team;

    // Check if fusion already used
    if (isP1 && this.p1FusionUsed) return false;
    if (!isP1 && this.p2FusionUsed) return false;

    // Check Ki (4 bars)
    if (p.ki < 400) return false;

    // Check characters
    const hasGogeta = team.some(
      (member) =>
        member.data.id === "gogeta" ||
        member.data.id === "gogeta_ssj" ||
        member.data.id === "gogeta_blue",
    );
    if (hasGogeta) return false;

    const goku = team.find((member) => member.data.id === "goku_ssj");
    const vegeta = team.find((member) => member.data.id === "vegeta_base");

    if (!goku || !vegeta) return false;

    // Either Goku or Vegeta must be active
    if (p !== goku && p !== vegeta) return false;

    // Neither can be KO
    if (goku.hp <= 0 || vegeta.hp <= 0) return false;

    // Must be controllable
    if (this.cannotAct(p)) return false;

    // We are good to fuse!
    p.ki -= 400; // Consume 4 bars

    if (isP1) {
      this.p1FusionUsed = true;
      this.p1FusionTarget = input.transformTarget || "gogeta";
      this.p1GokuHpBeforeFusion = goku.hp;
      this.p1VegetaHpBeforeFusion = vegeta.hp;
      this.p1FusionInitiator = p.data.id;
    } else {
      this.p2FusionUsed = true;
      this.p2FusionTarget = input.transformTarget || "gogeta";
      this.p2GokuHpBeforeFusion = goku.hp;
      this.p2VegetaHpBeforeFusion = vegeta.hp;
      this.p2FusionInitiator = p.data.id;
    }

    // Set fusing state. Will handle transformation to Gogeta at the end of the FUSION animation.
    p.state = PlayerState.FUSION;
    p.nextTransformId = isP1 ? this.p1FusionTarget : this.p2FusionTarget;
    p.animFrame = 0;
    p.animTimer = 0;
    p.comboStep = 0;
    p.animFinished = false;
    p.attackTimer = 999;
    p.invincibleTimer = 999;
    p.velocity.x = 0;
    p.velocity.y = 0;
    p.ataque = false;
    p.comboType = "LIGHT";
    p.comboStep = 0;

    // Trigger visual/camera fx
    this.particleManager.spawn(
      "ENERGY",
      p.x + p.width / 2,
      p.y + p.height / 2,
      20,
      "#ffff00",
      { size: 10, speed: 20 },
    );
    this.hitStopTimer = 15; // Slow down game for dramatic effect
    this.camera.focusOn(p, CAM_MAX_ZOOM);

    return true;
  }

  public trySuperDash(p: Player, input: InputState): boolean {
    if (p.airComboLockout && !p.isGrounded) return false;
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const dashPressed = input.dash && (!prevInput || !prevInput.dash);
    const comboPressed = (input.heavy && input.special);
    const comboJustPressed = comboPressed && (!prevInput || (!prevInput.heavy || !prevInput.special));

    if (
      (dashPressed || comboJustPressed) && p.ki > 0
    ) {
      if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.MOVIMENTO)) {
        return false;
      }

      const wasGroundedBeforeDash = p.isGrounded;
      p.state = PlayerState.SUPER_DASH;
      p.superDashActive = true;
      p.superDashPhase = 1; // Start with Phase 1
      p.isGrounded = false;
      p.velocity.x = 0;
      p.velocity.y = -6; // Small upward boost to leave the ground
      p.attackTimer = 15; // Phase 1 duration (boost phase)
      p.invincibleTimer = 0; // Phase 1: Vulnerable (no invincibility)
      p.rotation = 0; // Phase 1: No rotation applied
      p.comboWindow = 0;
      p.ataque = true;
      p.comboType = "SUPER_DASH";
      p.hasHit = false;
      p.jumpsUsed = 0;
      p.airDashUsed = false;
      p.airComboUsed = false;
      p.quickDashTimer = 0;
      p.queuedAttack = null;
      p.autoDashUsed = true;

      try {
        AudioManager.getInstance().playSFX("dash");
      } catch (e) {}

      if (wasGroundedBeforeDash) {
        this.spawnVisualEffect(
          "SUPER_DASH_DUST",
          p.x + p.width / 2,
          p.y + p.height,
          "/Assets/efeitos/poeira/5.gif",
          15,
          false,
          p === this.player1 ? "p1" : "p2",
          2.0,
          p.facingRight
        );
      }

      this.particleManager.spawn(
        "AURA",
        p.x + p.width / 2,
        p.y + p.height / 2,
        10,
        p.data.color || "#ffffff",
        { size: 5, speed: 5 },
      );

      try {
        AudioManager.getInstance().playSFX("dash");
      } catch (e) {
        console.error("Failed to play dash SFX inside trySuperDash:", e);
      }

      return true;
    }
    return false;
  }

  public cannotAct(p: Player): boolean {
    return (
      p.freezeTimer > 0 ||
      p.hp <= 0 ||
      p.stunTimer > 0 ||
      p.state === PlayerState.HIT ||
      p.state === PlayerState.LAUNCHED ||
      p.state === PlayerState.KNOCKED_DOWN ||
      p.state === PlayerState.MUI_DODGE ||
      p.state === PlayerState.VANISH ||
      p.state === PlayerState.VANISH_APPEAR ||
      p.state === PlayerState.ULTIMATE
    );
  }

  public tryReflect(p: Player, input: InputState): boolean {
    const isBackwards = p.facingRight ? input.left : input.right;
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const specialPressed = input.special && (!prevInput || !prevInput.special);

    if (isBackwards && specialPressed && p.isGrounded) {
      p.state = PlayerState.REFLECT;
      p.reflectTimer = 25; // Active for a short window
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.attackTimer = 35; // Total animation time
      this.particleManager.spawn(
        "ENERGY",
        p.x + p.width / 2 + (p.facingRight ? 20 : -20),
        p.y + p.height / 2,
        5,
        "#aaffff",
        { size: 6, speed: 1 },
      );
      return true;
    }
    return false;
  }

  public tryDragonRush(p: Player, input: InputState): boolean {
    if (p.airComboLockout && !p.isGrounded) return false;
    const opp = p === this.player1 ? this.player2 : this.player1;
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const lightPressed = input.light && (!prevInput || !prevInput.light);
    const mediumPressed = input.medium && (!prevInput || !prevInput.medium);

    // Dragon Rush usually Light + Medium. But on mobile controls, getting exactly same frame is hard.
    // Let's also trigger it if Light + Medium are down simultaneously.
    if (
      input.dragonRush || (input.light && input.medium)
    ) {
      p.state = PlayerState.DRAGON_RUSH;
      p.velocity.x = 0; // Stand still applying animation
      p.velocity.y = 0;
      p.ataque = true;
      p.comboType = "DRAGON_RUSH";
      p.comboStep = 0;
      p.hasHit = false;
      p.dragonRushCooldown = 0; // No cooldown
      p.animFrame = 0;
      p.animFinished = false;
      p.animTimer = 0;
      p.facingRight = opp.pos.x > p.pos.x; // Face the opponent

      try {
        AudioManager.getInstance().playSFX("dragon_rush_inicio");
      } catch (drErr) {
        console.error("Failed to play dragon_rush_inicio SFX:", drErr);
      }

      // Green aura effect typical of Dragon Rush
      this.particleManager.spawn(
        "AURA",
        p.x + p.width / 2,
        p.y + p.height / 2,
        10,
        "#00ff00",
        { size: 6, speed: 4 },
      );

      // Custom Dragon Rush startup visual effect centered on the character hitbox
      const pCenterX = p.hitbox.x + p.hitbox.width / 2;
      const pCenterY = p.hitbox.y + p.hitbox.height / 2;
      this.spawnVisualEffect(
        "DRAGON_RUSH_START_EFFECT",
        pCenterX,
        pCenterY,
        "/Assets/efeitos/impacto/1.gif",
        15,
        false,
        p === this.player1 ? "p1" : "p2",
        2.5,
        p.facingRight
      );
      return true;
    }
    return false;
  }

  public tryAirTech(p: Player, input: InputState): boolean {
    if (p.isGrounded) return false; // Needs to be in air
    if (p.hp <= 0) return false;

    // Only tech when stunned and almost out of stun
    if (p.state === PlayerState.HIT || p.state === PlayerState.LAUNCHED) {
      if (p.stunTimer > 0 && p.stunTimer <= 10) {
        const prevInput =
          p === this.player1 ? this.prevP1Input : this.prevP2Input;
        const lightPressed = input.light && (!prevInput || !prevInput.light);
        const dashPressed = input.dash && (!prevInput || !prevInput.dash);

        if (lightPressed || dashPressed) {
          // Air Tech
          p.stunTimer = 0;
          p.state = PlayerState.FALLING;
          p.invincibleTimer = 15; // I-frames during tech
          p.wallBounceUsed = false;
          p.groundBounceUsed = false;
          p.slidingKnockdown = false;

          if (input.up) p.velocity.y = -10;
          else if (input.down) p.velocity.y = 10;
          else p.velocity.y = -5; // Default slight pop up

          if (input.left) p.velocity.x = -8;
          else if (input.right) p.velocity.x = 8;
          else p.velocity.x = p.facingRight ? -5 : 5; // Default tech backwards

          this.particleManager.spawnDust(
            p.x + p.width / 2,
            p.y + p.height / 2,
            0,
          );
          return true;
        }
      }
    }
    return false;
  }

  public tryGroundTech(p: Player, input: InputState): boolean {
    if (!p.isGrounded) return false;
    if (p.state !== PlayerState.KNOCKED_DOWN) return false;
    if (p.hp <= 0) return false;

    // Only allow when stunned and knocked down, after a short period on ground (e.g. stunTimer <= 50)
    if (p.stunTimer > 0 && p.stunTimer <= 50) {
      const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
      const lightPressed = input.light && (!prevInput || !prevInput.light);
      const dashPressed = input.dash && (!prevInput || !prevInput.dash);
      const directionPressed = input.left || input.right || input.up || input.down;

      if (lightPressed || dashPressed || directionPressed) {
        // Clear knockdown
        p.stunTimer = 0;
        p.state = PlayerState.IDLE;
        p.invincibleTimer = 15; // I-frames during getup

        // If they pressed left/right, give them a rolling getup!
        if (input.left) {
          p.velocity.x = -10;
          p.state = PlayerState.QUICK_DASH;
          p.quickDashTimer = 8;
          p.quickDashDir = "left";
        } else if (input.right) {
          p.velocity.x = 10;
          p.state = PlayerState.QUICK_DASH;
          p.quickDashTimer = 8;
          p.quickDashDir = "right";
        } else {
          // Normal standing on the spot
          p.velocity.x = 0;
        }

        try {
          AudioManager.getInstance().playSFX("teleport");
        } catch (err) {}

        this.particleManager.spawnDust(p.x + p.width / 2, p.y + p.height, 0);
        return true;
      }
    }
    return false;
  }

  public tryExecuteQueuedSkill(p: Player): boolean {
    const fSM = CharacterStateMachine.getInstance();
    const queued = fSM.getQueuedSkill(p);
    if (!queued) return false;

    // Simulate an input state for triggering the action
    const simulatedInput: InputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      light: false,
      medium: false,
      heavy: false,
      kiblast: false,
      special: false,
      block: false,
      dash: false,
      charge: false,
      attack: false,
      ultimate: false,
      ultimate2: false,
      ultimate3: false,
      ultimate4: false,
      special2: false,
      special3: false,
      special4: false,
      special5: false,
      special6: false,
      tag: false,
      assist1: false,
      assist2: false,
      vanish: false,
      transform: false,
      transformTarget: undefined,
      fusion: false,
      dragonRush: false,
    };

    let executed = false;

    if (queued === SkillType.ULTIMATE) {
      simulatedInput.ultimate = true;
      executed = this.handleCombatInputs(p, simulatedInput);
    } else if (queued === SkillType.ESPECIAL) {
      simulatedInput.special = true;
      executed = this.handleCombatInputs(p, simulatedInput);
    } else if (queued === SkillType.ATAQUE_BASICO) {
      simulatedInput.light = true;
      executed = this.handleCombatInputs(p, simulatedInput);
    } else if (queued === SkillType.DEFESA) {
      simulatedInput.block = true;
      executed = this.handleStationaryActions(p, simulatedInput);
    } else if (queued === SkillType.VANISH) {
      simulatedInput.vanish = true;
      executed = this.tryVanish(p, simulatedInput);
    } else if (queued === SkillType.TRANSFORMACAO) {
      simulatedInput.transform = true;
      executed = this.handleCombatInputs(p, simulatedInput);
    } else if (queued === SkillType.MOVIMENTO) {
      // For movement, we just consume it when they are free to move
      executed = true;
    }

    if (executed) {
      fSM.consumeQueuedSkill(p);
      return true;
    }
    return false;
  }

  public processPlayerInput(p: Player, input: InputState) {
    const opp = p === this.player1 ? this.player2 : this.player1;
    if (
      p.freezeTimer > 0 ||
      p.hp <= 0 ||
      p.state === PlayerState.ULTIMATE ||
      p.state === PlayerState.DRAGON_RUSH ||
      p.state === PlayerState.DRAGON_COMBO ||
      p.state === PlayerState.DRAGON_DASH_FOLLOW ||
      p.state === PlayerState.MUI_DODGE ||
      p.state === PlayerState.VANISH ||
      p.state === PlayerState.VANISH_APPEAR ||
      p.state === PlayerState.TRANSFORM ||
      p.state === PlayerState.DETRANSFORM ||
      p.state === PlayerState.FUSION ||
      p.state === PlayerState.DEFUSION ||
      p.state === PlayerState.SPARKING ||
      opp.state === PlayerState.TRANSFORM ||
      opp.state === PlayerState.DETRANSFORM ||
      opp.state === PlayerState.FUSION ||
      opp.state === PlayerState.DEFUSION ||
      opp.state === PlayerState.ULTIMATE
    )
      return;

    if (this.tryTagBreak(p, input)) return;

    if (this.tryFusion(p, input)) return;

    if (this.trySparkingBlast(p, input)) return;

    // Defensive options
    if (this.tryGuardCancel(p, input)) return;

    // Try Vanish first (can be done defensively while stunned)
    if (this.tryVanish(p, input)) return;

    // Air Tech (Escaping in the air after stun expires, but we will allow it 5 frames before it expires to queue it)
    if (this.tryAirTech(p, input)) return;

    // Ground Tech (Teching a knockdown to roll or quick recover on spot)
    if (this.tryGroundTech(p, input)) return;

    // --- NEW: Block active commands and movement during defense (Durante defesa personagem não pode usar nenhum comando de combate movimento ou etc) ---
    const isDefendingState =
      p.state === PlayerState.BLOCKING ||
      p.state === PlayerState.BLOCKING_AIR ||
      p.state === PlayerState.BLOCKING_CROUCH;

    if (input.block || isDefendingState) {
      // Disable combat commands
      input.light = false;
      input.medium = false;
      input.heavy = false;
      if (input.kiblast !== undefined) input.kiblast = false;
      input.special = false;
      input.dash = false;
      input.charge = false;
      input.attack = false;
      input.ultimate = false;
      if (input.ultimate2 !== undefined) input.ultimate2 = false;
      if (input.ultimate3 !== undefined) input.ultimate3 = false;
      if (input.ultimate4 !== undefined) input.ultimate4 = false;
      if (input.special2 !== undefined) input.special2 = false;
      if (input.special3 !== undefined) input.special3 = false;
      if (input.special4 !== undefined) input.special4 = false;
      if (input.special5 !== undefined) input.special5 = false;
      if (input.special6 !== undefined) input.special6 = false;
      input.assist1 = false;
      input.assist2 = false;
      input.dragonRush = false;
      input.transform = false;
      input.fusion = false;

      // Disable movement and jump entirely (keep down for crouching defense if grounded)
      input.up = false;
      if (!p.isGrounded) {
        input.down = false;
      }
      input.left = false;
      input.right = false;
      input.jump = false;
    }

    if (!this.canControl(p)) return;
    if (this.tryExecuteQueuedSkill(p)) return;
    if (p.landingDelayTimer > 0) return; // Block all inputs when landing
    if (this.handleStationaryActions(p, input)) return;

    const isAttackingState =
      p.state === PlayerState.ATTACKING ||
      p.state === PlayerState.CROUCH_ATTACK ||
      p.state === PlayerState.JUMP_ATTACK;

    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;

    if (isAttackingState) {
      const lightPressed =
        (input.light || input.attack) &&
        (!prevInput || (!prevInput.light && !prevInput.attack));
      const mediumPressed = input.medium && (!prevInput || !prevInput.medium);
      const heavyPressed = input.heavy && (!prevInput || !prevInput.heavy);
      const kiblastPressed = input.kiblast && (!prevInput || !prevInput.kiblast);
      const specialPressed =
        input.special && (!prevInput || !prevInput.special);
      const special2Pressed =
        input.special2 && (!prevInput || !prevInput.special2);
      const special3Pressed =
        input.special3 && (!prevInput || !prevInput.special3);
      const special4Pressed =
        input.special4 && (!prevInput || !prevInput.special4);
      const special5Pressed =
        input.special5 && (!prevInput || !prevInput.special5);
      const special6Pressed =
        input.special6 && (!prevInput || !prevInput.special6);

      if (special6Pressed) {
        p.queuedAttack = "SPECIAL_6";
        p.queuedAttackTimer = 20;
      } else if (special5Pressed) {
        p.queuedAttack = "SPECIAL_5";
        p.queuedAttackTimer = 20;
      } else if (special4Pressed) {
        p.queuedAttack = "SPECIAL_4";
        p.queuedAttackTimer = 20;
      } else if (special3Pressed) {
        p.queuedAttack = "SPECIAL_3";
        p.queuedAttackTimer = 20;
      } else if (special2Pressed) {
        p.queuedAttack = "SPECIAL_2";
        p.queuedAttackTimer = 20;
      } else if (specialPressed) {
        p.queuedAttack = "SPECIAL";
        p.queuedAttackTimer = 20;
      } else if (kiblastPressed) {
        p.queuedAttack = "KI_BLAST";
        p.queuedAttackTimer = 20;
      } else if (heavyPressed) {
        p.queuedAttack = "HEAVY";
        p.queuedAttackTimer = 20;
      } else if (mediumPressed) {
        p.queuedAttack = "MEDIUM";
        p.queuedAttackTimer = 20;
      } else if (lightPressed) {
        p.queuedAttack = "LIGHT";
        p.queuedAttackTimer = 20;
      }
    }

    if (isAttackingState) {
      const isSpecialState = p.comboType && (p.comboType.startsWith("SPECIAL") || p.comboType.startsWith("ULTIMATE") || p.comboType.startsWith("METEOR") || p.comboType.startsWith("SUPER"));
      
      if (!p.animFinished || isSpecialState) {
        // Allow magic series (combo next button) if hit
        if (p.hasHit && !isSpecialState) {
          if (this.handleCombatInputs(p, input)) return;
        }

        // Allow jump cancel if hit (only for normal attacks, not specials)
        if (p.hasHit && input.jump && !isSpecialState) {
          this.handleMovementInputs(p, input);
        }
        return;
      }

      // If we are here, p.animFinished is true and it's a basic attack
      p.ataque = false;
      if (p.comboType !== "SUPER_DASH") {
        if (!p.hasHit) {
          // Rule: If the attack missed, revert to the previous phase of the combo
          p.comboStep = Math.max(0, p.comboStep - 1);
          if (p.comboStep === 0) p.comboType = "NONE";
          
          p.comboWindow = 0;
          if (!p.isGrounded) {
            p.airComboLockout = true;
          }
        } else {
          // Rule: If the attack hit, preserve comboStep and comboType
          // This allows the next input to advance to the next phase.
          // comboWindow (handled in PhysicsManager) will eventually decay the combo if the player is too slow.
          p.comboWindow = 60; // Keep the window open for the next follow-up
        }
      }
    }

    // DBFZ actions
    if (this.tryReflect(p, input)) return;
    if (this.tryDragonRush(p, input)) return;
    if (this.trySuperDash(p, input)) return;

    if (this.handleCombatInputs(p, input)) return;
    this.handleMovementInputs(p, input);
  }

  public canControl(p: Player): boolean {
    if (p.freezeTimer > 0 || p.state === PlayerState.ULTIMATE) return false;
    if (
      p.state === PlayerState.MUI_DODGE ||
      p.state === PlayerState.VANISH ||
      p.state === PlayerState.VANISH_APPEAR ||
      p.state === PlayerState.TRANSFORM ||
      p.state === PlayerState.DETRANSFORM ||
      p.state === PlayerState.FUSION ||
      p.state === PlayerState.DEFUSION ||
      p.state === PlayerState.DRAGON_RUSH ||
      p.state === PlayerState.DRAGON_COMBO ||
      p.state === PlayerState.DRAGON_DASH_FOLLOW
    )
      return false;
    if (p.state === PlayerState.TAG_IN || p.state === PlayerState.TAG_OUT)
      return false;

    const opp = p === this.player1 ? this.player2 : this.player1;
    if (
      opp.state === PlayerState.TRANSFORM ||
      opp.state === PlayerState.DETRANSFORM ||
      opp.state === PlayerState.FUSION ||
      opp.state === PlayerState.DEFUSION
    ) {
      return false;
    }

    return p.stunTimer <= 0 && p.hp > 0;
  }

  public handleStationaryActions(p: Player, input: InputState): boolean {
    const isAttackingState =
      p.state === PlayerState.ATTACKING ||
      p.state === PlayerState.CROUCH_ATTACK ||
      p.state === PlayerState.JUMP_ATTACK;

    if (isAttackingState && !p.animFinished) {
      return false; // Let attack animations finish
    }
    
    // Do not allow canceling specials or ultimates via input, even if the animation frame 'finished'.
    // PhysicsManager handles transitioning them to IDLE.
    if (isAttackingState && p.animFinished) {
      if (p.comboType && (p.comboType.startsWith("SPECIAL") || p.comboType.startsWith("ULTIMATE") || p.comboType.startsWith("METEOR"))) {
        return false;
      }
    }

    const isChargingStates =
      p.state === PlayerState.CHARGING ||
      p.state === PlayerState.CHARGE_START ||
      p.state === PlayerState.CHARGE_END;

    if (p.isGrounded && input.charge && p.ki < MAX_KI) {
      if (
        p.state !== PlayerState.CHARGE_START &&
        p.state !== PlayerState.CHARGING
      ) {
        p.state = PlayerState.CHARGE_START;
        p.attackTimer = 10; // Use attackTimer as a simple state timer
        try {
          AudioManager.getInstance().playSFX("ki_charge_start");
        } catch (e) {
          console.error("Failed to play ki_charge_start SFX:", e);
        }

        if (
          p.data?.id === "goku_base_swl_removed" ||
          p.data?.id === "goku_ssj" ||
          p.data?.id === "goku_blue_gif" ||
          p.data?.id === "goku_mui"
        ) {
          try {
            AudioManager.getInstance().playVoice(
              "/Assets/SONS/DUBLAGEM/GOKU%20BASE/CARREGANDO%20KI%20AHHHHHHH.wav"
            );
          } catch (err) {
            console.error("Failed to play Goku charging voice:", err);
          }
        }

        if (p.data?.id === "goku_black_rose") {
          try {
            AudioManager.getInstance().playVoice(
              "/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE/CARREGANDO%20KI/AHHHHHH.wav"
            );
          } catch (err) {
            console.error("Failed to play Goku Black Rose charging voice:", err);
          }
        }

        if (p.data?.id === "vegeta_base") {
          try {
            const numPart = Math.random() < 0.5 ? "" : " (2)";
            const voiceUrl = `/Assets/SONS/DUBLAGEM/VEGETA%20BASE/CARREGANDO%20KI${numPart}.wav`.replace(/ /g, "%20");
            AudioManager.getInstance().playVoice(voiceUrl);
          } catch (err) {
            console.error("Failed to play Vegeta charging voice:", err);
          }
        }

        const ownerId = p === this.player1 ? "p1" : "p2";
        if (
          p.isGrounded &&
          !this.visualEffects.some(
            (e) => e.type === "CHARGE_DUST" && e.ownerId === ownerId,
          )
        ) {
          this.spawnVisualEffect(
            "CHARGE_DUST",
            p.x + p.width / 2,
            p.y + p.height,
            "/Assets/efeitos/poeira/3.gif",
            5,
            true,
            ownerId,
          );
        }
      } else if (p.state === PlayerState.CHARGE_START && p.attackTimer <= 0) {
        p.state = PlayerState.CHARGING;
      }
      p.velocity.x = 0;
      if (p.state === PlayerState.CHARGING) {
        const prevKi = p.ki;
        p.ki = Math.min(MAX_KI, p.ki + KI_CHARGE_RATE);

        if (prevKi < MAX_KI && p.ki >= MAX_KI) {
          this.camera.addScreenShake(20, 8, "PERLIN", 2);
          
          // Play high quality narrator max power sound
          BattleAnnouncerManager.getInstance().playMaxPower();

          let maxKiVoiceUrl = "";
          if (
            p.data?.id === "goku_base_swl_removed" ||
            p.data?.id === "goku_ssj" ||
            p.data?.id === "goku_blue_gif" ||
            p.data?.id === "goku_mui"
          ) {
            maxKiVoiceUrl = "/Assets/SONS/DUBLAGEM/GOKU%20BASE/POSSO%20SENTIR%20O%20PODER%20DO%20MEU%20CORPO.wav";
          } else if (p.data?.id === "vegeta_base") {
            const screams = [
              "AHHHHHHHH.wav",
              "AHHHHHHHH (2).wav",
              "AHHHHH.wav",
              "AHHHHHH.wav"
            ];
            const screamFile = screams[Math.floor(Math.random() * screams.length)];
            maxKiVoiceUrl = `/Assets/SONS/DUBLAGEM/VEGETA%20BASE/${screamFile.replace(/ /g, "%20")}`;
          }

          if (maxKiVoiceUrl) {
            try {
              AudioManager.getInstance().playVoice(maxKiVoiceUrl);
            } catch (err) {
              console.error(`Failed to play ${p.data?.id} max ki voice:`, err);
            }
          }
        }
      }
      return true;
    } else if (p.isGrounded && isChargingStates) {
      if (p.state !== PlayerState.CHARGE_END) {
        p.state = PlayerState.CHARGE_END;
        p.attackTimer = 10;
        return true;
      } else if (p.attackTimer > 0) {
        return true; // Wait for end animation to finish
      }
      p.state = PlayerState.IDLE;
    }

    const blockHeld = input.block;
    if (blockHeld) {
      const isAlreadyBlocking =
        p.state === PlayerState.BLOCKING ||
        p.state === PlayerState.BLOCKING_AIR ||
        p.state === PlayerState.BLOCKING_CROUCH;

      if (!isAlreadyBlocking && !CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.DEFESA)) {
        return false;
      }
      p.quickDashTimer = 0;
      if (!p.isGrounded) p.state = PlayerState.BLOCKING_AIR;
      else if (input.down) p.state = PlayerState.BLOCKING_CROUCH;
      else p.state = PlayerState.BLOCKING;

      if (p.isGrounded) p.velocity.x = 0;

      p.blockFrames++;
      return true;
    } else if (
      p.state === PlayerState.BLOCKING ||
      p.state === PlayerState.BLOCKING_AIR ||
      p.state === PlayerState.BLOCKING_CROUCH
    ) {
      p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
      p.blockFrames = 0;
    } else {
      p.blockFrames = 0;
    }

    if (p.isGrounded && input.down) {
      p.state = PlayerState.CROUCH;
      p.velocity.x = 0;
      if (
        input.light ||
        input.medium ||
        input.heavy ||
        input.special ||
        input.attack
      ) {
        return false; // Let handleCombatInputs process the crouch attack
      }
      return true;
    } else if (p.state === PlayerState.CROUCH) p.state = PlayerState.IDLE;

    return false;
  }

  public tryTag(
    p: Player,
    checkCancel: boolean = false,
    isKO: boolean = false,
    isTagBreak: boolean = false,
  ): boolean {
    const isP1 = p === this.player1 || this.p1Team.includes(p);

    // Gogeta cannot tag if he is the result of a mid-game fusion
    if (
      p.data.id === "gogeta" ||
      p.data.id === "gogeta_ssj" ||
      p.data.id === "gogeta_blue"
    ) {
      if (isP1 && this.p1FusionUsed) return false;
      if (!isP1 && this.p2FusionUsed) return false;
    }

    const team = isP1 ? this.p1Team : this.p2Team;
    const tagCooldown = isP1 ? this.p1TagCooldown : this.p2TagCooldown;

    if (tagCooldown > 0) return false;

    // Cost check for cancel
    if (checkCancel && !isTagBreak) {
      if (p.ki < KI_BLAST_COST * 2) return false; // Costs 2 ki bars to cancel into tag
    }

    const currentIdx = isP1 ? this.p1ActiveIdx : this.p2ActiveIdx;
    let nextIdx = currentIdx;
    for (let i = 1; i <= team.length; i++) {
      const idx = (currentIdx + i) % team.length;
      // If isKO, force them to come in even if they are in ASSIST or TAG_OUT
      const isAvailable = isKO
        ? team[idx] && team[idx].hp > 0
        : team[idx] &&
          team[idx].hp > 0 &&
          team[idx].state === PlayerState.STANDBY;
      if (isAvailable) {
        nextIdx = idx;
        break;
      }
    }

    if (nextIdx === currentIdx) return false; // No available characters

    const nextPlayer = team[nextIdx];
    if (!nextPlayer) {
      console.error("tryTag: nextPlayer undefined at index", nextIdx);
      return false;
    }
    if (!p) {
      console.error("tryTag: p is undefined");
      return false;
    }

    // Execute Tag
    this.hitStopTimer = 0; // End slow motion/freeze frames immediately to prevent delay feel during swap

    // Play high quality narrator change swap audio
    BattleAnnouncerManager.getInstance().playChange();

    if (checkCancel) p.ki -= KI_BLAST_COST * 2;

    if (isP1) {
      this.p1TagCooldown = this.TAG_COOLDOWN_MAX;
      this.p1ActiveIdx = nextIdx;
      this.prevP1Input = null;
    } else {
      this.p2TagCooldown = this.TAG_COOLDOWN_MAX;
      this.p2ActiveIdx = nextIdx;
      this.prevP2Input = null;
    }

    // Stop any looping ki charging SFX for the tagging out player
    try {
      const oldChargeKey = isP1 ? "ki_charge_p1" : "ki_charge_p2";
      AudioManager.getInstance().stopLoopedSFX(oldChargeKey);
    } catch (err) {
      console.warn("Failed to stop charging SFX on tag out:", err);
    }

    // Previous player handling
    if (!isKO) {
      p.quickDashTimer = 0;
      p.state = PlayerState.TAG_OUT;
      p.velocity.x = 0; // Teleport out in place
      p.velocity.y = 0;
      p.isGrounded = false;
      p.attackTimer = 30; // Despawn timer for teleport
      p.ataque = false;
      p.comboType = "NONE";
      p.stunTimer = 0;
      p.hitReactionPhase = 0;
      p.animFrame = 0;
      p.animFinished = false;
      this.particleManager.spawn(
        "AURA",
        p.x + p.width / 2,
        p.y + p.height / 2,
        15,
        "#ffffff",
        { size: 6, speed: 12 },
      );
    } else {
      // If KO, don't make the dead body jump. Just let it stand by to remove from screen.
      p.state = PlayerState.STANDBY;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.attackTimer = 0;
    }

    // New player flies in
    nextPlayer.state = PlayerState.TAG_IN;
    const camBounds = this.camera.getVisibleBounds();
    const opp = isP1 ? this.player2 : this.player1;
    if (!opp) return true; // Safe break if no opponent
    const wasOnLeft = p.pos.x < opp.pos.x;

    if (isTagBreak) {
      // Burst tag
      nextPlayer.pos.x = wasOnLeft
        ? camBounds.left - 100
        : camBounds.right + 100;
      nextPlayer.pos.y = opp.pos.y;
      nextPlayer.comboType = "BURST";
      nextPlayer.ataque = true;

      // Interrupt opponent
      opp.state = opp.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
      opp.ataque = false;
      opp.comboType = "NONE";
      opp.comboCount = 0;
      opp.autoDashUsed = false;
      opp.animFrame = 0;
      opp.attackTimer = 0;
      opp.stunTimer = 0;

      this.particleManager.spawn(
        "ENERGY",
        p.x + p.width / 2,
        p.y + p.height / 2,
        10,
        "#ffffff",
        { speed: 8, size: 6 },
      );
    } else if (isKO) {
      if (this.camera)
        this.camera.update(this.player1, this.player2, true, false);
      const visibleBounds = this.camera.getVisibleBounds();

      // Move opponent to the middle of the stage to wait for collision
      opp.pos.x = this.worldWidth / 2 - opp.width / 2;

      // 1. Snap camera to center to determine entrance bounds
      if (this.camera) {
        this.camera.position.x = opp.pos.x + opp.width / 2;
        this.camera.position.y = opp.pos.y - 100;
        this.camera.update(this.player1, this.player2, true, true, true);
      }

      const newBounds = this.camera
        ? this.camera.getVisibleBounds()
        : visibleBounds;

      // 2. Position the incoming player
      nextPlayer.pos.x = wasOnLeft
        ? newBounds.left - 400
        : newBounds.right + 400;

      // Force ground positions to avoid floating weirdly
      opp.pos.y = WORLD_HEIGHT - this.groundY;
      nextPlayer.pos.y = WORLD_HEIGHT - this.groundY;

      // 3. Snap camera immediately to the incoming player (sprite center) with zoom
      if (this.camera) {
        this.camera.focusOn(nextPlayer, 4.0, true, true);
      }

      nextPlayer.comboType = "NONE";
      nextPlayer.ataque = false;

      this.koClashActive = true;
      this.koClashPhase = 1;
      this.koClashTimer = 0;
      this.koClashIncomingPlayer = nextPlayer;
      this.koClashWaitingPlayer = opp;
      nextPlayer.isKOTag = true;

      // Spawn full-screen background effect for entry (behind characters)
      const entryVfx = this.spawnVisualEffect(
        "KO_ENTRY_BACKGROUND",
        this.worldWidth / 2,
        WORLD_HEIGHT / 2,
        "/Assets/efeitos/telacheia/6.gif",
        60,
        true, // Loop until collision
        "",
        1.0,
        true
      );
      if (entryVfx) {
        entryVfx.layer = 'BACK';
        entryVfx.fullScreen = true;
        this.koClashBackgroundEffectId = entryVfx.id;
      }

      this.projectiles = []; // Clear all projectiles for cinematic sequence

      opp.state = PlayerState.IDLE;
      opp.isGrounded = true;
      opp.velocity.x = 0;
      opp.velocity.y = 0;
      // Opponent keeps facing the direction they were (towards the KO'd player)
      opp.facingRight = !wasOnLeft;

      nextPlayer.state = PlayerState.IDLE;
      nextPlayer.isGrounded = true;
    } else {
      // Manual Tag in: FighterZ style dash-in
      nextPlayer.pos.x = wasOnLeft
        ? camBounds.left - 400
        : camBounds.right + 400;
      nextPlayer.pos.y = opp.pos.y - 150; // Come from slightly above
      nextPlayer.comboType = "NONE";
      nextPlayer.ataque = false; // Do not override animation with generic ATTACKING
    }

    nextPlayer.velocity.x = 0;
    nextPlayer.velocity.y = 0;
    nextPlayer.isGrounded = false;
    nextPlayer.jumpsUsed = 0;
    nextPlayer.airDashUsed = false;
    nextPlayer.facingRight = wasOnLeft;
    nextPlayer.invincibleTimer = 60; // More invincibility
    nextPlayer.attackTimer = 90; // Longer duration to prevent "stopping" mid-air
    nextPlayer.isKOTag = isKO;
    nextPlayer.comboWindow = 0;
    nextPlayer.comboCount = 0;
    nextPlayer.autoDashUsed = false;
    nextPlayer.stunTimer = 0;
    nextPlayer.hitReactionPhase = 0;
    nextPlayer.animFrame = 0;
    nextPlayer.animFinished = false;

    if (isP1) this.player1 = nextPlayer;
    else this.player2 = nextPlayer;

    this.particleManager.spawn(
      "AURA",
      nextPlayer.x,
      nextPlayer.y,
      8,
      nextPlayer.data.color,
      { size: 6, speed: 8 },
    );
    return true;
  }

  public tryAssist(p: Player, assist1: boolean, assist2: boolean) {
    if (!assist1 && !assist2) return;

    // Gogeta cannot call assists if he is the result of a mid-game fusion
    const isP1 = p === this.player1 || this.p1Team.includes(p);
    if (
      p.data.id === "gogeta" ||
      p.data.id === "gogeta_ssj" ||
      p.data.id === "gogeta_blue"
    ) {
      if (isP1 && this.p1FusionUsed) return;
      if (!isP1 && this.p2FusionUsed) return;
    }

    // Do not allow assist during Ultimate or if dead
    if (p.state === PlayerState.ULTIMATE || p.hp <= 0) return;

    // Optional: Anti-spam delay. Global assist cooldown? We can rely on individual standby.

    const team = isP1 ? this.p1Team : this.p2Team;
    const currentIdx = isP1 ? this.p1ActiveIdx : this.p2ActiveIdx;

    // Map remaining team members to assist1 and assist2 buttons
    let standbyIndices: number[] = [];
    for (let i = 0; i < team.length; i++) {
      if (i !== currentIdx) standbyIndices.push(i);
    }

    let assistIdxToCheck = -1;
    if (assist1 && standbyIndices.length > 0)
      assistIdxToCheck = standbyIndices[0];
    if (assist2 && standbyIndices.length > 1)
      assistIdxToCheck = standbyIndices[1];

    if (assistIdxToCheck !== -1) {
      const assistPlayer = team[assistIdxToCheck];
      if (
        assistPlayer &&
        assistPlayer.hp > 0 &&
        assistPlayer.state === PlayerState.STANDBY &&
        assistPlayer.assistCooldown <= 0
      ) {
        const aType = assistPlayer.data.assistType || "SPECIAL";

        // Calculate cost exactly as in performAttack
        const stateToTest = PlayerState.ATTACKING;
        const animKey =
          resolveAnimationKey(
            assistPlayer.data.id,
            stateToTest,
            aType as any,
            undefined,
            true,
            undefined,
            undefined,
            50,
          ) || stateToTest;
        const currentAnim = assistPlayer.data.spriteConfig?.animations?.[animKey];
        const hasBeam =
          currentAnim?.createsBeam ||
          assistPlayer.data.spriteConfig?.animations?.["BEAM_START"] !== undefined ||
          assistPlayer.data.spriteConfig?.animations?.["ATTACK_SPECIAL_LOOP"]
            ?.createsBeam !== undefined ||
          assistPlayer.data.spriteConfig?.animations?.["SPECIAL_1_2"]
            ?.createsBeam !== undefined;
        const specialCost =
          aType.startsWith("SPECIAL_") || hasBeam ? 200 : KI_BLAST_COST;

        if (p.ki < specialCost) {
          try {
            AudioManager.getInstance().playSFX("click");
          } catch (e) {}
          return;
        }

        // Deduct cost from active player
        p.ki -= specialCost;

        // Execute Assist Entry
        assistPlayer.state = PlayerState.ASSIST_ENTRY;
        assistPlayer.facingRight = p.facingRight;
        assistPlayer.pos.x = p.facingRight ? p.pos.x - 200 : p.pos.x + 200;
        assistPlayer.pos.y = WORLD_HEIGHT - this.groundY; // Keep on ground
        assistPlayer.velocity.x = p.facingRight ? 18 : -18; // Dash in
        assistPlayer.velocity.y = 0;
        assistPlayer.isGrounded = true;
        assistPlayer.attackTimer = 15; // Dash in duration
        this.particleManager.spawnDust(
          assistPlayer.x + assistPlayer.width / 2,
          assistPlayer.y + assistPlayer.height,
          assistPlayer.facingRight ? -1 : 1,
        );
      }
    }
  }

  public tryGuardCancel(p: Player, input: InputState): boolean {
    if (
      p.state !== PlayerState.BLOCKING &&
      p.state !== PlayerState.BLOCKING_CROUCH &&
      p.state !== PlayerState.BLOCKING_AIR
    )
      return false;

    const isP1 = p === this.player1 || this.p1Team.includes(p);
    const tagCooldown = isP1 ? this.p1TagCooldown : this.p2TagCooldown;
    if (tagCooldown > 0) return false;
    if (p.ki < 100) return false; // 1 bar

    const isForward = p.facingRight ? input.right : input.left;
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const tagPressed = input.tag && (!prevInput || !prevInput.tag);

    if (isForward && tagPressed) {
      // Guard Cancel
      if (this.tryTag(p, false, true, true)) {
        p.ki -= 100;

        // The new character enters super dashing
        const incoming = isP1 ? this.player1 : this.player2; // Since tryTag swaps them
        if (incoming) {
          incoming.state = PlayerState.SUPER_DASH;
          incoming.superDashActive = true;
          incoming.isGrounded = false;
          incoming.hasHit = false;
          incoming.attackTimer = 60;
          incoming.invincibleTimer = 45; // I-frames during guard cancel entrance
          incoming.airComboUsed = false;
        }
        this.particleManager.spawn(
          "ENERGY",
          p.x + p.width / 2,
          p.y + p.height / 2,
          10,
          "#ffffff",
          { size: 6, speed: 2 },
        );
        return true;
      }
    }
    return false;
  }

  public tryVanish(p: Player, input: InputState): boolean {
    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const vanishPressed = input.vanish && (!prevInput || !prevInput.vanish);
    if (!vanishPressed) return false;

    p.quickDashTimer = 0;
    const isDefensive =
      p.state === PlayerState.HIT ||
      p.state === PlayerState.BLOCKING ||
      p.state === PlayerState.BLOCKING_CROUCH ||
      p.state === PlayerState.BLOCKING_AIR;
    const isAttacking =
      p.state === PlayerState.ATTACKING ||
      p.state === PlayerState.JUMP_ATTACK ||
      p.state === PlayerState.CROUCH_ATTACK;
    const isNeutral =
      p.state === PlayerState.IDLE ||
      p.state === PlayerState.RUNNING ||
      p.state === PlayerState.WALK_BACKWARD ||
      p.state === PlayerState.CROUCH ||
      p.state === PlayerState.JUMPING ||
      p.state === PlayerState.FALLING ||
      p.state === PlayerState.DASHING ||
      p.state === PlayerState.DASH_START ||
      p.state === PlayerState.DASH_END;

    const isDragonRushState = 
      p.state === PlayerState.DRAGON_RUSH || 
      p.state === PlayerState.DRAGON_COMBO || 
      p.state === PlayerState.DRAGON_DASH_FOLLOW;

    const canVanish = (isNeutral || isAttacking || isDefensive) && !isDragonRushState;
    if (!canVanish) return false;

    // HP Teleport Check (Backward + Block)
    const isBackward = p.facingRight ? input.left : input.right;
    const prevIsBackward = p.facingRight ? prevInput?.left : prevInput?.right;
    const hpTeleportTriggered =
      isBackward && input.block && (!prevIsBackward || !prevInput?.block);

    // Dash + Block Check
    const dashPressed = input.dash && (!prevInput || !prevInput.dash);
    const blockPressed = input.block && (!prevInput || !prevInput.block);
    const comboPressed =
      input.dash && input.block && (dashPressed || blockPressed);

    if (!vanishPressed && !hpTeleportTriggered && !comboPressed) return false;

    if (!CharacterStateMachine.getInstance().canExecuteSkill(p, SkillType.VANISH)) {
      return false;
    }

    let usingHpTeleport = false;
    const cost = isDefensive ? 200 : 100;

    if (hpTeleportTriggered && p.hp > 100) {
      usingHpTeleport = true;
    } else if ((vanishPressed || comboPressed) && p.ki >= cost) {
      usingHpTeleport = false;
    } else {
      return false;
    }

    // Execute Vanish
    if (usingHpTeleport) {
      p.hp -= 100;
    } else {
      p.ki -= cost;
    }

    p.state = PlayerState.VANISH;
    try {
      AudioManager.getInstance().playSFX("teleport");
    } catch (tpErr) {
      console.error("Failed to play teleport SFX inside tryVanish:", tpErr);
    }
    p.attackTimer = 10; // Frames before teleporting
    p.stunTimer = 0; // Clear hit stun
    p.velocity.x = 0;
    p.velocity.y = 0;
    p.invincibleTimer = 15; // invincible during vanish
    p.vanishIsHpTeleport = usingHpTeleport;
    p.comboWindow = 0;
    p.comboCount = 0;
    p.autoDashUsed = false;
    p.ataque = false;

    this.particleManager.spawn(
      "AURA",
      p.x + p.width / 2,
      p.y + p.height / 2,
      5,
      p.data.color || "#ffffff",
      { size: 10, speed: 0 },
    );

    return true;
  }

  public handleCombatInputs(p: Player, input: InputState) {
    return CombatManager.handleCombatInputs(this, p, input);
  }

  public handleMovementInputs(p: Player, input: InputState) {
    if (p.state === PlayerState.SUPER_DASH) {
      return;
    }

    const left = input.left;
    const right = input.right;
    const dash = input.dash;
    let baseSpeed = MOVE_SPEED * p.speedMult * this.customSpeedMultiplier;
    if (p.sparkingTimer > 0) baseSpeed *= 1.25; // Speed boost during sparking

    const prevInput = p === this.player1 ? this.prevP1Input : this.prevP2Input;
    const leftPressed = left && (!prevInput || !prevInput.left);
    const rightPressed = right && (!prevInput || !prevInput.right);
    const dashPressed = dash && (!prevInput || !prevInput.dash);

    if (p.dashCooldownTimer > 0) p.dashCooldownTimer--;
    if (p.quickDashCooldownTimer > 0) p.quickDashCooldownTimer--;

    let triggerDashLeft = false;
    let triggerDashRight = false;

    const DOUBLE_TAP_WINDOW = 250; // ms
    const now = Date.now();

    // 1. Check double tap
    if (leftPressed) {
      if (p.lastDir === "left" && now - p.lastDirTime < DOUBLE_TAP_WINDOW) {
        triggerDashLeft = true;
        p.lastDir = null; // Reset to prevent double trigger
      } else {
        p.lastDir = "left";
        p.lastDirTime = now;
      }
    }

    if (rightPressed) {
      if (p.lastDir === "right" && now - p.lastDirTime < DOUBLE_TAP_WINDOW) {
        triggerDashRight = true;
        p.lastDir = null; // Reset to prevent double trigger
      } else {
        p.lastDir = "right";
        p.lastDirTime = now;
      }
    }

    // 3. Trigger Quick Dash Left
    if (triggerDashLeft) {
      if (p.isGrounded || !p.airDashUsed) {
        p.quickDashTimer = 10;
        p.quickDashCooldownTimer = 0;
        p.quickDashDir = "left";
        if (!p.isGrounded) {
          p.airDashUsed = true;
          p.airComboUsed = false;
        }
        if (p.isGrounded) {
          this.particleManager.spawnDust(p.x + p.width / 2, p.y + p.height, 1);
          this.spawnVisualEffect(
            "DOUBLE_TAP_DUST",
            p.x + p.width / 2,
            p.y + p.height,
            "/Assets/efeitos/poeira/2.gif",
            12,
            false,
            "",
            2.5,
            false, // Facing left
          );
        }
      }
    }

    // 4. Trigger Quick Dash Right
    if (triggerDashRight) {
      if (p.isGrounded || !p.airDashUsed) {
        p.quickDashTimer = 10;
        p.quickDashCooldownTimer = 0;
        p.quickDashDir = "right";
        if (!p.isGrounded) {
          p.airDashUsed = true;
          p.airComboUsed = false;
        }
        if (p.isGrounded) {
          this.particleManager.spawnDust(p.x + p.width / 2, p.y + p.height, -1);
          this.spawnVisualEffect(
            "DOUBLE_TAP_DUST",
            p.x + p.width / 2,
            p.y + p.height,
            "/Assets/efeitos/poeira/2.gif",
            12,
            false,
            "",
            2.5,
            true, // Facing right
          );
        }
      }
    }

    if (p.quickDashTimer > 0) {
      p.quickDashTimer--;
      const dashSpeed = baseSpeed * 4.0;
      if (p.quickDashDir === "left") {
        p.velocity.x = -dashSpeed;
        if (p.isGrounded) p.state = PlayerState.QUICK_DASH;
      } else {
        p.velocity.x = dashSpeed;
        if (p.isGrounded) p.state = PlayerState.QUICK_DASH;
      }
      p.velocity.y = 0; // Suspend gravity during dash

      if (p.quickDashTimer % 3 === 0) {
        this.particleManager.spawn(
          "AURA",
          p.x + p.width / 2,
          p.y + p.height / 2,
          1,
          p.data.color || "#ffffff",
          { size: 3, speed: 0 },
        );
      }

      if (p.quickDashTimer === 0) {
        p.velocity.x *= 0.5; // Decelerate gently when dash ends
      }
      return;
    }

    // Enhanced Dashing Sequence Logic
    if (p.state === PlayerState.DASH_START) {
      p.velocity.x = 0;
      if (p.attackTimer === 8) {
        if (p.isGrounded) {
          p.velocity.y = -5; // Impulso vertical para sair do chão
          p.isGrounded = false;
        } else {
          p.velocity.y = 0;
        }
      } else {
        // Deixa o impulso vertical agir livremente sem zerar
        if (p.velocity.y === 0) {
          p.velocity.y = 0;
        }
      }
      p.attackTimer--;
      if (p.attackTimer <= 0) p.state = PlayerState.DASHING;
      return;
    } else if (p.state === PlayerState.DASH_END) {
      p.velocity.x *= 0.8;
      p.velocity.y = 0;
      p.attackTimer--;
      if (p.attackTimer <= 0) {
        p.state = p.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
        p.velocity.x = 0;
      }
      return;
    }

    if (p.state === PlayerState.DASHING) {
      if (p.ki <= 0) {
        p.state = PlayerState.DASH_END;
        p.attackTimer = 10;
        p.dashCooldownTimer = 0; // No cooldown
        p.velocity.x *= 0.5;
        p.velocity.y = 0;
        p.rotation = 0;
        return;
      }
      // Removed frame-by-frame Ki drain to use the upfront 1 bar (100 Ki) cost
      baseSpeed *= 12.0; // Faster dash
      p.velocity.y = 0; // Suspend gravity strictly
      const opponent = p === this.player1 ? this.player2 : this.player1;
      const dx = opponent.x - p.x;
      const dy = opponent.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dash continuo automático: Apenas pressionar uma vez continua perseguindo o alvo até o fim
      const reachedTarget = dist <= 70;
      if (reachedTarget || p.dragonRushTimer > -1) {
        if (dist > 0) {
          p.velocity.x = (dx / dist) * baseSpeed;
          p.velocity.y = (dy / dist) * baseSpeed;

          let angle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);
          p.rotation = angle;
        }
        if (p.facingRight && p.velocity.x < 0) p.facingRight = false;
        if (!p.facingRight && p.velocity.x > 0) p.facingRight = true;
        if (p.dragonRushTimer > 0) p.dragonRushTimer--;
      } else {
        p.state = PlayerState.DASH_END;
        p.attackTimer = 10;
        p.dashCooldownTimer = 0; // No cooldown
        p.velocity.x *= 0.5;
        p.velocity.y = 0;
        p.rotation = 0;
      }

      if (p.isGrounded && this.frameCount % 4 === 0) {
        this.spawnVisualEffect(
          "DASH_DUST",
          p.x + p.width / 2,
          p.y + p.height,
          "/Assets/efeitos/poeira/1.gif",
          5,
          false,
          p === this.player1 ? "p1" : "p2",
          1.5,
          p.facingRight,
        );
      }
      return; // Skip walking logic
    }

    if (!p.isGrounded && Math.abs(p.velocity.x) > baseSpeed) {
      p.runTimer = 0;
      // Allow steering without completely overriding high momentum
      if (left && !right) p.velocity.x -= 0.5;
      if (right && !left) p.velocity.x += 0.5;
      p.velocity.x *= 0.98;
    } else if (!p.isGrounded) {
      p.runTimer = 0;
      if (left && !right) p.velocity.x = -baseSpeed;
      else if (right && !left) p.velocity.x = baseSpeed;
      else p.velocity.x *= 0.95;
    } else if (left && !right) {
      p.state = p.facingRight ? PlayerState.WALK_BACKWARD : PlayerState.RUNNING;
      if (p.state === PlayerState.RUNNING) {
        p.runTimer++;
        const speedBoost = Math.min(0.4, p.runTimer * 0.015);
        p.velocity.x = -baseSpeed * (1 + speedBoost);
      } else {
        p.runTimer = 0;
        p.velocity.x = -baseSpeed;
      }
    } else if (right && !left) {
      p.state = !p.facingRight
        ? PlayerState.WALK_BACKWARD
        : PlayerState.RUNNING;
      if (p.state === PlayerState.RUNNING) {
        p.runTimer++;
        const speedBoost = Math.min(0.4, p.runTimer * 0.015);
        p.velocity.x = baseSpeed * (1 + speedBoost);
      } else {
        p.runTimer = 0;
        p.velocity.x = baseSpeed;
      }
    } else {
      p.runTimer = 0;
      p.velocity.x = 0;
      p.state = PlayerState.IDLE;
    }

    const jumpPressed = input.jump && (!prevInput || !prevInput.jump);

    if (dashPressed) {
      const isAttacking =
        p.state === PlayerState.ATTACKING ||
        p.state === PlayerState.CROUCH_ATTACK ||
        p.state === PlayerState.JUMP_ATTACK;
      const isLauncher =
        (p.state === PlayerState.CROUCH_ATTACK && p.comboType === "HEAVY") ||
        (p.state === PlayerState.JUMP_ATTACK &&
          (p.comboType === "HEAVY" || p.comboStep >= 2)) ||
        (p.state === PlayerState.ATTACKING &&
          (p.comboType === "HEAVY" || p.comboStep >= 2));

      const opp = p === this.player1 ? this.player2 : this.player1;
      const oppLaunched =
        opp.state === PlayerState.LAUNCHED ||
        opp.state === PlayerState.KNOCKED_DOWN ||
        (opp.state === PlayerState.HIT &&
          (Math.abs(opp.velocity.y) >= 5 || Math.abs(opp.velocity.x) >= 5)) ||
        (opp.state === PlayerState.FALLING && opp.stunTimer > 0);

      const stateObj = p.state as any;
      const isAlreadyDashing =
        stateObj === PlayerState.DASH_START ||
        stateObj === PlayerState.DASHING ||
        stateObj === PlayerState.DASH_END ||
        stateObj === PlayerState.SUPER_DASH;

      // Super Dash Trigger: if attacking with a launcher, or opponent is currently launched/flying up
      if (
        ((isAttacking && p.hasHit && isLauncher) ||
          (!isAttacking && oppLaunched) ||
          (isAttacking && p.hasHit && oppLaunched)) &&
        !p.autoDashUsed
      ) {
        p.state = PlayerState.SUPER_DASH;
        p.superDashActive = true;
        p.superDashPhase = 1;
        p.autoDashUsed = true;
        p.isGrounded = false;
        p.velocity.x = 0;
        p.velocity.y = -5;
        p.attackTimer = 15; // Phase 1 startup duration
        p.invincibleTimer = 0; // Phase 1: Vulnerable (no invincibility)
        p.rotation = 0; // Phase 1: No rotation applied
        p.comboWindow = 0;
        p.ataque = true;
        p.comboType = "SUPER_DASH";
        p.hasHit = false;
        p.jumpsUsed = 0;
        p.airDashUsed = false;
        p.airComboUsed = false;
        p.quickDashTimer = 0; // Cancel normal dash if it triggered
        this.particleManager.spawn(
          "AURA",
          p.x + p.width / 2,
          p.y + p.height / 2,
          10,
          "#ffffff",
          { size: 5, speed: 5 },
        );
        return;
      } else if (!isAttacking && !isAlreadyDashing && p.ki >= 100) {
        p.state = PlayerState.DASH_START;
        p.ki -= 100; // Consume 1 bar of Ki
        p.velocity.x = 0;
        p.velocity.y = 0;
        p.attackTimer = 8;
        p.dragonRushTimer = 15; // Minimum dash duration (can be extended by holding)
        p.invincibleTimer = 5;
        p.ataque = false;
        p.comboType = "NONE";
        p.airComboUsed = false;
        return;
      }
    }

    if (jumpPressed) {
      const isAttacking =
        p.state === PlayerState.ATTACKING ||
        p.state === PlayerState.CROUCH_ATTACK ||
        p.state === PlayerState.JUMP_ATTACK;
      const jumpCancellable = isAttacking && p.hasHit;
      const canDoubleJump = !p.isGrounded && p.jumpsUsed < 1;

      if (p.isGrounded || jumpCancellable || canDoubleJump) {
        if (jumpCancellable) {
          p.attackTimer = 0;
          p.comboWindow = 0;
          p.ataque = false;
          // Jump towards opponent on pursuit
          p.velocity.x = p.facingRight ? 8 : -8;
          // Don't reset comboCount so combo continues
        }

        const wasGrounded = p.isGrounded;
        if (!p.isGrounded) p.jumpsUsed++;

        p.velocity.y = wasGrounded ? -JUMP_FORCE : -(JUMP_FORCE * 0.5);
        p.isGrounded = false;
        p.state = PlayerState.JUMPING;
        try {
          AudioManager.getInstance().playSFX("jump");
        } catch (jumpErr) {
          console.error("Failed to play jump SFX:", jumpErr);
        }
        if (wasGrounded) {
          this.spawnVisualEffect(
            "JUMP_DUST",
            p.x + p.width / 2,
            p.y + p.height,
            "/Assets/efeitos/poeira/4.gif",
            12,
            false,
            p === this.player1 ? "p1" : "p2",
            0.80,
          );
        }
      }
    } else if (!p.isGrounded) {
      if (
        p.state !== PlayerState.ATTACKING &&
        p.state !== PlayerState.JUMP_ATTACK &&
        p.state !== PlayerState.HIT &&
        p.state !== PlayerState.STUNNED &&
        p.state !== PlayerState.CROUCH_ATTACK
      ) {
        p.state = p.velocity.y > 0 ? PlayerState.FALLING : PlayerState.JUMPING;
      }
    }
  }

  public updatePhysics(p: Player) {
    PhysicsManager.updatePhysics(this, p);
  }

  public spawnAfterimageAt(p: Player, x: number, y: number) {
    this.afterimages.push({
      data: p.data,
      state: p.state,
      x: x,
      y: y,
      width: p.width,
      height: p.height,
      facingRight: p.facingRight,
      animFrame: p.animFrame,
      stunTimer: p.stunTimer > 0,
      comboType: p.comboType as any,
      comboStep: p.comboStep,
      ataque: p.ataque,
      ultPhase: p.ultPhase,
      nextTransformId: p.nextTransformId,
      attackTimer: p.attackTimer,
      ultType: p.ultType,
      isGrounded: p.isGrounded,
      isDetransforming: p.isDetransforming,
      isKOTag: p.isKOTag,
      opacity: 0.5,
      life: 20,
      maxLife: 20,
    });
  }

  public spawnVisualEffect(
    type:
      | "CHARGE_DUST"
      | "JUMP_DUST"
      | "DASH_DUST"
      | "EXPLOSION"
      | "FULL_SCREEN_DUST"
      | string,
    x: number,
    y: number,
    imageUrl: string,
    frames: number,
    loop: boolean = false,
    ownerId?: "p1" | "p2" | string,
    scale: number = 2.2,
    facingRight: boolean = true,
    configKey?: string,
    animSpeed: number = 4,
    frameWidth?: number,
    frameHeight?: number,
    isGif?: boolean,
  ) {
    let finalX = x;
    let finalY = y;

    // --- AUTO-RESOLVE CONFIG KEY FROM IMAGE URL ---
    if (!configKey && imageUrl) {
      const entry = Object.entries(DEFAULT_EFFECTS).find(([_, url]) => url === imageUrl);
      if (entry) {
        configKey = entry[0];
      }
    }

    // --- APPLY CONFIG KEY OVERRIDES ---
    if (configKey) {
      const config = EffectConfigKeyManager.getInstance().getEffect(configKey);
      if (config) {
        if (config.imageUrl !== undefined) imageUrl = config.imageUrl;
        if (config.frames !== undefined) frames = config.frames;
        if (config.loop !== undefined) loop = config.loop;
        if (config.scale !== undefined) scale = config.scale;
        if (config.speed !== undefined) animSpeed = config.speed;
        if (config.frameWidth !== undefined) frameWidth = config.frameWidth;
        if (config.frameHeight !== undefined) frameHeight = config.frameHeight;
        if (config.isGif !== undefined) isGif = config.isGif;
      }
    }

    // Check if the effect is a combat hit effect (COMBO_HIT, COMBO_HIT_HEAVY, or contains combo/hit)
    const isCombatEffect = 
      type === "COMBO_HIT" || 
      type === "COMBO_HIT_HEAVY" || 
      type.includes("COMBO") || 
      (imageUrl && (imageUrl.includes("efeitos/impacto") || imageUrl.includes("impacto")));

    if (isCombatEffect) {
      // Direct requirement: Sprites de Efeito de colisão criado quando personagem recebe dano só pode ser criado outro assim que o anterior seja destruído de cena!
      const hasActiveCombatEffect = this.visualEffects.some(effect => 
        effect.active && (
          effect.type === "COMBO_HIT" || 
          effect.type === "COMBO_HIT_HEAVY" || 
          (effect.type && effect.type.includes("COMBO")) ||
          (effect.imageUrl && (effect.imageUrl.includes("efeitos/impacto") || effect.imageUrl.includes("impacto")))
        )
      );
      if (hasActiveCombatEffect) {
        return; // Only spawn one at a time, wait until the previous one is destroyed from the scene
      }

      // Find the closest active player currently on screen to center the effect exactly on their hitbox center
      const activePlayers = [this.player1, this.player2].filter(Boolean);
      if (activePlayers.length > 0) {
        let closestPlayer = activePlayers[0];
        let minDist = Infinity;
        for (const p of activePlayers) {
          // Calculate distance to the physical center of the player's hitbox
          const box = p.hitbox;
          const pCenterX = box.x + box.width / 2;
          const pCenterY = box.y + box.height / 2;
          const dist = Math.hypot(x - pCenterX, y - pCenterY);
          if (dist < minDist) {
            minDist = dist;
            closestPlayer = p;
          }
        }
        
        // Reposition at the perfect center of the character's hitbox
        const box = closestPlayer.hitbox;
        finalX = box.x + box.width / 2;
        finalY = box.y + box.height / 2;
      }
    }

    const effect = {
      id: this.nextVisualEffectId++,
      x: finalX,
      y: finalY,
      imageUrl,
      frames,
      animFrame: 0,
      animTimer: 0,
      animSpeed,
      frameWidth,
      frameHeight,
      isGif,
      loop,
      scale,
      facingRight,
      active: true,
      ownerId: ownerId as any,
      type: type as any,
      configKey,
      fullScreen: false as boolean | undefined,
      layer: undefined as 'FRONT' | 'BACK' | undefined,
    };
    this.visualEffects.push(effect);
    return effect;
  }

  public spawnAfterimage(p: Player) {
    this.spawnAfterimageAt(p, p.x, p.y);
  }

  public updateAfterimages(allPlayers: Player[]) {
    // 1. Fade and remove old afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const img = this.afterimages[i];
      img.life--;
      img.opacity = (img.life / img.maxLife) * 0.5;
      if (img.life <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    // Performance safety optimization: Cap active afterimages to prevent rendering performance spikes
    if (this.afterimages.length > 30) {
      this.afterimages.splice(0, this.afterimages.length - 30);
    }

    // 2. Spawn new afterimages
    allPlayers.forEach((p) => {
      if (p.state === PlayerState.STANDBY) return;
      if (
        p.state === PlayerState.HIT ||
        p.state === PlayerState.HIT_2 ||
        p.state === PlayerState.HIT_3 ||
        p.state === PlayerState.FALLING_HIT ||
        p.state === PlayerState.FALLING_HIT_GROUND ||
        p.state === PlayerState.LAUNCHED ||
        p.state === PlayerState.STUNNED ||
        p.state === PlayerState.KNOCKED_DOWN ||
        p.state === PlayerState.GUARD_BREAK
      ) {
        return;
      }

      // If other player is executing Ultimate, do not spawn afterimages of the victim
      const otherPlayer = p === this.player1 ? this.player2 : this.player1;
      if (otherPlayer && (otherPlayer.state === PlayerState.ULTIMATE || otherPlayer.state === PlayerState.ULTIMATE_2)) {
        if (p.state !== PlayerState.ULTIMATE && p.state !== PlayerState.ULTIMATE_2) {
          return;
        }
      }

      const animKeyInput = p.lastAnimKey || String(p.state);
      const isSpecialOrUlt =
        animKeyInput.includes("SPECIAL") ||
        animKeyInput.includes("ESPECIAL") ||
        animKeyInput.includes("ULT") ||
        animKeyInput.includes("TAG_IN_KO") ||
        p.state === PlayerState.ULTIMATE ||
        p.state === PlayerState.MUI_DODGE ||
        p.state === PlayerState.VANISH;

      const isFastMove =
        p.state === PlayerState.DASHING ||
        p.superDashActive ||
        isSpecialOrUlt ||
        Math.abs(p.velocity.x) >= 20 ||
        Math.abs(p.velocity.y) >= 20;

      if (!p["lastAfterimageX"]) {
        p["lastAfterimageX"] = p.x;
        p["lastAfterimageY"] = p.y;
      }

      if (isFastMove) {
        const dist = Math.hypot(
          p.x - p["lastAfterimageX"],
          p.y - p["lastAfterimageY"],
        );
        if (dist >= 45) {
          if (dist > 300) {
            // Teleport: spawn one at old pos
            this.spawnAfterimageAt(
              p,
              p["lastAfterimageX"],
              p["lastAfterimageY"],
            );
            p["lastAfterimageX"] = p.x;
            p["lastAfterimageY"] = p.y;
          } else {
            // Interpolate trails
            const steps = Math.floor(dist / 45);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const interpX =
                p["lastAfterimageX"] + (p.x - p["lastAfterimageX"]) * t;
              const interpY =
                p["lastAfterimageY"] + (p.y - p["lastAfterimageY"]) * t;
              this.spawnAfterimageAt(p, interpX, interpY);
            }
            p["lastAfterimageX"] = p.x;
            p["lastAfterimageY"] = p.y;
          }
        }
      } else {
        // Keep synced when not fast moving
        p["lastAfterimageX"] = p.x;
        p["lastAfterimageY"] = p.y;
      }
    });
  }

  private getBeamEndMetricsForClash(p: any, isPlayer1: boolean) {
    let endW = 0;
    let endOffsetX = 0;
    if (p.beamFamilyId) {
      const family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId);
      if (family) {
        const ownerData = isPlayer1 ? this.player1.data : this.player2.data;
        const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId];
        const midAnim = family.middle
          ? { ...family.middle, ...(charOverrides?.middle as any) }
          : family.middle;
        const endAnim = family.end
          ? { ...family.end, ...(charOverrides?.end as any) }
          : undefined;

        if (endAnim) {
          const scale = p.customScale ?? midAnim?.scale ?? 2.2;
          const endScale = p.customScale ?? endAnim?.scale ?? scale;

          const endFrameW = CollisionHelper.getActualFrameWidth(endAnim, p.animFrame);
          endW = Math.round(endFrameW * endScale);

          const endOx = endAnim.originX !== undefined ? endAnim.originX : 0;
          const endCx = endAnim.centerX !== undefined ? endAnim.centerX : endW / 2;
          endOffsetX = Math.round((endOx - endCx) + (endAnim.offsetX || 0));
        }
      }
    }
    return { endW, endOffsetX };
  }

  public checkBeamTipCollision(b1: any, b2: any): boolean {
    const b1FacingRight = b1.initialFacingRight ?? (b1.vx > 0);
    const b2FacingRight = b2.initialFacingRight ?? (b2.vx > 0);

    // Beams must face in opposite directions
    if (b1FacingRight === b2FacingRight) return false;

    // Get precise tip (Ponta) polygons
    const poly1 = CollisionHelper.getBeamPartVertices(b1, this, "end");
    const poly2 = CollisionHelper.getBeamPartVertices(b2, this, "end");

    // 1. Strictly check for physical intersection of the two tip hitboxes (No proximity, no anticipation, no tolerance)
    if (CollisionHelper.testPolygonCollision(poly1, poly2)) {
      return true;
    }

    // 2. Extra robust bypass check: handle high speed frame bypasses (crossed paths)
    const p1Xs = poly1.map(v => v.x);
    const p2Xs = poly2.map(v => v.x);
    const p1Ys = poly1.map(v => v.y);
    const p2Ys = poly2.map(v => v.y);

    const minX1 = Math.min(...p1Xs);
    const maxX1 = Math.max(...p1Xs);
    const minX2 = Math.min(...p2Xs);
    const maxX2 = Math.max(...p2Xs);

    const minY1 = Math.min(...p1Ys);
    const maxY1 = Math.max(...p1Ys);
    const minY2 = Math.min(...p2Ys);
    const maxY2 = Math.max(...p2Ys);

    // Vertical overlap check with reasonable buffer to allow proper alignment
    const verticalOverlap = (minY1 <= maxY2 && maxY1 >= minY2) || Math.abs((minY1 + maxY1) / 2 - (minY2 + maxY2) / 2) < 120;

    if (verticalOverlap) {
      if (b1FacingRight) {
        // b1 is moving right, b2 is moving left. If they crossed: maxX1 >= minX2
        if (maxX1 >= minX2) {
          return true;
        }
      } else {
        // b1 is moving left, b2 is moving right. If they crossed: maxX2 >= minX1
        if (maxX2 >= minX1) {
          return true;
        }
      }
    }

    return false;
  }

  public tryStartBeamClash(b1: any, b2: any): boolean {
    // Bloqueia disputa de energia durante Ultimates ou se o Beam for de um Ultimate/Genkidama
    const p1InUlt = this.player1.state === PlayerState.ULTIMATE || this.player1.state === PlayerState.ULTIMATE_2;
    const p2InUlt = this.player2.state === PlayerState.ULTIMATE || this.player2.state === PlayerState.ULTIMATE_2;
    
    const isB1Ult = b1.isUltimate || (b1.beamFamilyId && (b1.beamFamilyId.includes("ULT") || b1.beamFamilyId.includes("GENKIDAMA")));
    const isB2Ult = b2.isUltimate || (b2.beamFamilyId && (b2.beamFamilyId.includes("ULT") || b2.beamFamilyId.includes("GENKIDAMA")));

    if (p1InUlt || p2InUlt || isB1Ult || isB2Ult) {
      return false;
    }

    const origin1 = b1.initialSpawnX !== undefined ? b1.initialSpawnX : (b1.vx > 0 ? b1.x : b1.x + b1.width);
    const origin2 = b2.initialSpawnX !== undefined ? b2.initialSpawnX : (b2.vx > 0 ? b2.x : b2.x + b2.width);

    const distBetweenEmitters = Math.abs(origin1 - origin2);
    const distBetweenPlayers = Math.abs(this.player1.pos.x - this.player2.pos.x);
    const tooClose = distBetweenEmitters < 50 || distBetweenPlayers <= 50;

    if (tooClose) {
      // Regra dos 50 pixels da disputa de energia: O Beam criado DEPOIS do outro deve ser destruído.
      // O beam com o MENOR id foi criado ANTES (primeiro) -> Vence (winner)
      // O beam com o MAIOR id foi criado DEPOIS (segundo) -> É destruído (loser)
      const id1 = typeof b1.projectileId === 'number' ? b1.projectileId : 0;
      const id2 = typeof b2.projectileId === 'number' ? b2.projectileId : 0;
      
      const b1First = id1 < id2;
      const winner = b1First ? b1 : b2;
      const loser = b1First ? b2 : b1;

      loser._isForceDeactivated = true;
      loser.active = false;
      
      // Filter out loser immediately to prevent any residual collisions/updating in the current tick
      this.projectiles = this.projectiles.filter(p => p !== loser);
      
      // Spawn a dramatic burst of sparks where the younger beam was cut off
      if (this.particleManager) {
        this.particleManager.spawnHitSpark(loser.x + (loser.width / 2), loser.y + (loser.height / 2), false);
      }
      AudioManager.getInstance().playSFX("hit");

      return false;
    }

    // Otherwise, start the clash
    const p1Beam = b1.ownerId === "p1" ? b1 : b2;
    const p2Beam = b1.ownerId === "p2" ? b1 : b2;
    this.startBeamClash(p1Beam, p2Beam);
    return true;
  }

  public startBeamClash(p1Beam: any, p2Beam: any) {
    this.isBeamClashActive = true;
    this.beamClashTimer = 480;

    const p1FacingRight = p1Beam.initialFacingRight ?? (p1Beam.vx > 0);
    const p2FacingRight = p2Beam.initialFacingRight ?? (p2Beam.vx > 0);

    const emitter1X = p1FacingRight ? p1Beam.x : p1Beam.x + p1Beam.width;
    const emitter2X = p2FacingRight ? p2Beam.x : p2Beam.x + p2Beam.width;

    // Record static player coordinates and beam emission points to prevent any drift/separation
    (this as any).beamClashPlayer1X = this.player1.pos.x;
    (this as any).beamClashPlayer1Y = this.player1.pos.y;
    (this as any).beamClashPlayer2X = this.player2.pos.x;
    (this as any).beamClashPlayer2Y = this.player2.pos.y;

    (this as any).beamClashPlayer1State = this.player1.state;
    (this as any).beamClashPlayer2State = this.player2.state;

    (this as any).beamClashEmitter1X_fixed = emitter1X;
    (this as any).beamClashEmitter2X_fixed = emitter2X;
    (this as any).beamClashBeam1Y_fixed = p1Beam.y;
    (this as any).beamClashBeam2Y_fixed = p2Beam.y;

    this.beamClashEmitter1X = emitter1X;
    this.beamClashEmitter2X = emitter2X;

    // Retrieve beam end metrics to calculate the exact contact point (ponto de colisão)
    const metrics1 = this.getBeamEndMetricsForClash(p1Beam, true);
    const metrics2 = this.getBeamEndMetricsForClash(p2Beam, false);

    const endOffsetX1 = Math.round(metrics1.endOffsetX);
    const endOffsetX2 = Math.round(metrics2.endOffsetX);

    // FIXED / UNIFIED SYSTEM: At the exact moment of collision, we weld/fix both tips together
    // and start from the actual physical collision point (onde colidiram), smoothly sliding
    // (deslizando fluidamente) to the central equilibrium point (ponto médio) over a series of frames.
    const midpointX = (emitter1X + emitter2X) / 2;
    
    const tip1X = p1FacingRight ? (p1Beam.x + (p1Beam.width || 0)) : p1Beam.x;
    const tip2X = p2FacingRight ? (p2Beam.x + (p2Beam.width || 0)) : p2Beam.x;
    const actualCollisionX = typeof tip1X === 'number' && typeof tip2X === 'number' ? (tip1X + tip2X) / 2 : midpointX;

    const totalDistance = emitter2X - emitter1X;

    (this as any).beamClashInitialX = actualCollisionX;
    (this as any).beamClashMidpointX = midpointX;
    (this as any).beamClashVisualX = actualCollisionX;
    (this as any).beamClashTransitionTicks = 0;
    (this as any).beamClashTransitionMaxTicks = 90; // Over ~1.5 seconds, smoothly glide to the midpoint
    (this as any).beamClashStruggleOffset = 0;

    const clashX = Math.round(actualCollisionX);

    // Convert the actual collision point into a proportional progress value [0, 1]
    let initialProgress = 0.5; // Starts in perfect equilibrium (0.5 progress)
    if (Math.abs(totalDistance) > 1) {
      if (p1FacingRight) {
        initialProgress = (clashX - emitter1X) / totalDistance;
      } else {
        initialProgress = (emitter2X - clashX) / totalDistance;
      }
    }

    this.beamClashProgress = initialProgress;
    this.beamClashVisualProgress = initialProgress;

    this.p1BeamClashCount = 0;
    this.p2BeamClashCount = 0;
    const clashY = Math.round((p1Beam.y + p2Beam.y) / 2);
    this.particleManager.spawnHitSpark(clashX, clashY, true);
    this.camera.addScreenShake(30, 20, "IMPULSE", 1.0);

    try {
      AudioManager.getInstance().playSFX("hit");
      AudioManager.getInstance().playSFX("explosion");
    } catch (e) {}

    // Enforce perfect position snap immediately on clash start frame to prevent 1-frame visual gaps/glitches

    p1Beam.y = clashY;
    p2Beam.y = clashY;
    p1Beam.initialSpawnY = clashY;
    p2Beam.initialSpawnY = clashY;

    const r_emitter1X = Math.round(emitter1X);
    const r_emitter2X = Math.round(emitter2X);
    const endW1 = Math.round(metrics1.endW);
    const endW2 = Math.round(metrics2.endW);

    // Render pontas perfectly centered at the clashX contact point with a slight physical overlap
    const overlap1 = Math.round(endW1 * 0.85);
    const overlap2 = Math.round(endW2 * 0.85);

    if (p1FacingRight) {
      p1Beam.x = r_emitter1X;
      p1Beam.width = Math.max(5, Math.round(clashX - r_emitter1X - endOffsetX1 + overlap1));
      p2Beam.x = Math.min(r_emitter2X - 5, Math.max(0, Math.round(clashX + endOffsetX2 - overlap2)));
      p2Beam.width = Math.max(5, Math.round(r_emitter2X - p2Beam.x));
    } else {
      p2Beam.x = r_emitter2X;
      p2Beam.width = Math.max(5, Math.round(clashX - r_emitter2X - endOffsetX2 + overlap2));
      p1Beam.x = Math.min(r_emitter1X - 5, Math.max(0, Math.round(clashX + endOffsetX1 - overlap1)));
      p1Beam.width = Math.max(5, Math.round(r_emitter1X - p1Beam.x));
    }

    p1Beam.initialSpawnX = emitter1X;
    p2Beam.initialSpawnX = emitter2X;

    p1Beam.life = 90;
    p2Beam.life = 90;

    this.setupBeamClashInput();
  }

  public updateProjectiles() {
    // Reset wasBlockedThisFrame and ensure resistanceFactor defaults to 1.0 for all beams unless blocked last frame
    this.projectiles.forEach((proj) => {
      if (proj.isBeam) {
        (proj as any).wasBlockedLastFrame = (proj as any).wasBlockedThisFrame || false;
        (proj as any).wasBlockedThisFrame = false;
        proj.resistanceFactor = (proj as any).wasBlockedLastFrame ? 0.2 : 1.0;
      }
    });

    const p1Beams: Projectile[] = [];
    const p2Beams: Projectile[] = [];
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj.active || proj.isShrinking || !proj.isBeam) continue;
      if (proj.ownerId === "p1") p1Beams.push(proj);
      else p2Beams.push(proj);
    }

    if (!this.isBeamClashActive) {
      for (const b1 of p1Beams) {
        for (const b2 of p2Beams) {
          const didCollide = this.checkBeamTipCollision(b1, b2);
          if (didCollide) {
            this.tryStartBeamClash(b1, b2);
            break;
          }
        }
        if (this.isBeamClashActive) break;
      }
    }

    // Collect active Genkidama-like entities from both players (ultimate-state or projectile-based)
    interface GenkidamaEntity {
      gx: number;
      gy: number;
      radius: number;
      ownerId: "p1" | "p2";
      facingRight: boolean;
    }

    const genkidamas: GenkidamaEntity[] = [];

    for (const proj of this.projectiles) {
      if (proj.active) {
        const isGenkiProj = 
          (proj.beamFamilyId && proj.beamFamilyId.includes("GENKIDAMA")) ||
          (proj.customAnimData?.name && proj.customAnimData.name.includes("Genkidama"));
        
        if (isGenkiProj && !proj.isBeam) {
          const radius = Math.max(proj.width, proj.height) / 2;
          const gx = proj.x + proj.width / 2;
          const gy = proj.y + proj.height / 2;
          
          genkidamas.push({
            gx,
            gy,
            radius,
            ownerId: proj.ownerId as "p1" | "p2",
            facingRight: proj.vx > 0
          });
        }
      }
    }

    // Resolve head-on collision pushing force: Genkidama pushes the Beam back!
    for (const genki of genkidamas) {
      const opponentOwnerId = genki.ownerId === "p1" ? "p2" : "p1";
      const genkiPoly = CollisionHelper.getAABBVertices({
        x: genki.gx - genki.radius,
        y: genki.gy - genki.radius,
        width: genki.radius * 2,
        height: genki.radius * 2
      });

      const oppBeams = this.projectiles.filter(proj => 
        proj.ownerId === opponentOwnerId && 
        proj.isBeam && 
        proj.active && 
        !proj.isShrinking
      );

      for (const beam of oppBeams) {
        if (genki.facingRight !== beam.initialFacingRight) {
          const beamPoly = CollisionHelper.getProjectileVertices(beam, this);
          if (CollisionHelper.testPolygonCollision(genkiPoly, beamPoly)) {
            const beamOwner = beam.sourcePlayer || (beam.ownerId === "p1" ? this.player1 : this.player2);
            const startX = beamOwner.x + (beam.offsetX ?? 0);
            
            if (beam.initialFacingRight) {
              const maxAllowedWidth = (genki.gx - genki.radius) - startX;
              if (maxAllowedWidth < beam.width) {
                beam.width = Math.max(0, maxAllowedWidth);
                
                if (this.frameCount % 5 === 0) {
                  this.particleManager.spawnHitSpark(genki.gx - genki.radius, beam.y, false);
                  this.camera.addScreenShake(5, 4, "IMPULSE", 0.5);
                  AudioManager.getInstance().playSFX("hit");
                }
              }
            } else {
              const maxAllowedWidth = startX - (genki.gx + genki.radius);
              if (maxAllowedWidth < beam.width) {
                beam.width = Math.max(0, maxAllowedWidth);
                
                if (this.frameCount % 5 === 0) {
                  this.particleManager.spawnHitSpark(genki.gx + genki.radius, beam.y, false);
                  this.camera.addScreenShake(5, 4, "IMPULSE", 0.5);
                  AudioManager.getInstance().playSFX("hit");
                }
              }
            }

            if (beam.width <= 15) {
              beam.active = false;
              beam.isShrinking = true;
            }
          }
        }
      }
    }

    for (let i = this.visualEffects.length - 1; i >= 0; i--) {
      const effect = this.visualEffects[i];
      effect.animTimer++;
      const speed = effect.animSpeed ?? 4;
      if (effect.animTimer > speed) {
        effect.animTimer = 0;
        effect.animFrame++;
      }

      if (effect.type === "CHARGE_DUST") {
        const owner = effect.ownerId === "p1" ? this.player1 : this.player2;
        if (
          owner.state !== PlayerState.CHARGING &&
          owner.state !== PlayerState.CHARGE_START &&
          owner.state !== PlayerState.CHARGE_END
        ) {
          effect.active = false;
        } else {
          effect.x = owner.x + owner.width / 2;
          effect.y = owner.y + owner.height;
        }
      }

      if (effect.type === "BEAM_LAUNCH_DUST") {
        const owner = effect.ownerId === "p1" ? this.player1 : this.player2;
        const hasActiveBeam = this.projectiles.some(p => p.ownerId === effect.ownerId && p.isBeam && p.active && !p.isShrinking);
        if (!hasActiveBeam) {
          effect.active = false;
        } else {
          // Stay behind character
          effect.x = owner.x + owner.width / 2 + (owner.facingRight ? -40 : 40);
          effect.y = owner.y + owner.height;
        }
      }

      if (effect.type === "DRAGON_RUSH_START_EFFECT") {
        const owner = effect.ownerId === "p1" ? this.player1 : this.player2;
        if (owner) {
          const box = owner.hitbox;
          effect.x = box.x + box.width / 2;
          effect.y = box.y + box.height / 2;
        }
      }

      if (effect.type === "KAME_GENKI_COLLISION") {
        const target = effect.ownerId === "p1" ? this.player1 : this.player2;
        if (target) {
          const box = target.hitbox;
          effect.x = box.x + box.width / 2;
          effect.y = box.y + box.height / 2;
        }

        // Keep active while hit frame exists and receives updates
        const lastHit = (effect as any).lastHitFrame || 0;
        if (this.frameCount - lastHit > 5) {
          effect.active = false;
        }
      }

      const actualGifCount = this.animationManager.getGifFrameCount(effect.imageUrl);
      const limitFrames = actualGifCount > 0 ? actualGifCount : effect.frames;
      if (effect.animFrame >= limitFrames) {
        if (effect.loop) {
          effect.animFrame = 0;
        } else {
          // Hold for 3 frames recovery buffer to ensure visibility of the last frame
          if (!(effect as any)._finishedBuffer) (effect as any)._finishedBuffer = 3;
          (effect as any)._finishedBuffer--;
          if ((effect as any)._finishedBuffer <= 0) {
            effect.active = false;
          } else {
            effect.animFrame = limitFrames - 1; // Stay on last frame
          }
        }
      }

      if (!effect.active) {
        this.visualEffects.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(this);
      if (!p.active) {
        if (p.beamFamilyId !== "ZAMASU_CUSTOM" && p.beamFamilyId !== "ZAMASU_EFFECT_REMOVED") {
            const owner = p.ownerId === "p1" ? this.player1 : this.player2;
            const isRealBeam = p.isBeam || p.isGiantBlast || (p.beamFamilyId && !p.beamFamilyId.includes("PROJETIL") && !p.beamFamilyId.includes("PROJECTILE") && !p.beamFamilyId.includes("KI_BLAST") && !p.beamFamilyId.includes("GENKIDAMA") && !p.beamFamilyId.includes("FECHO"));
            if (isRealBeam) {
                if (
                    (owner.state === PlayerState.ATTACKING ||
                    owner.state === PlayerState.JUMP_ATTACK ||
                    owner.state === PlayerState.CROUCH_ATTACK ||
                    owner.state === PlayerState.ULTIMATE) &&
                    ((owner.comboType && typeof owner.comboType === "string" && owner.comboType.includes("SPECIAL")) || owner.comboType === "KI_BLAST" || owner.state === PlayerState.ULTIMATE)
                ) {
                     owner.attackTimer = 0;
                     owner.animFinished = true;
                     owner.animTimer = 0;
                }
            }
        }
        this.projectiles.splice(i, 1)[0].release();
        continue;
      }

      // KI CLASH (Colisão Ki vs Ki)
      let destroyedByClash = false;
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        if (i === j) continue;
        const otherP = this.projectiles[j];
        if (
          !otherP.active ||
          otherP.ownerId === p.ownerId ||
          p.disabledCollision ||
          otherP.disabledCollision
        )
          continue;

        let px1 =
          p.vx > 0
            ? p.x + (p.customOffsetX || 0)
            : p.x - (p.customOffsetX || 0);
        let py1 = p.y + (p.customOffsetY || 0);
        let px2 =
          otherP.vx > 0
            ? otherP.x + (otherP.customOffsetX || 0)
            : otherP.x - (otherP.customOffsetX || 0);
        let py2 = otherP.y + (otherP.customOffsetY || 0);

        if (
          px1 < px2 + otherP.width &&
          px1 + p.width > px2 &&
          py1 < py2 + otherP.height &&
          py1 + p.height > py2
        ) {
          // Rajada Normal vs Rajada Normal => Ambas explodem
          if (
            !p.isBeam &&
            !p.isGiantBlast &&
            !otherP.isBeam &&
            !otherP.isGiantBlast
          ) {
            p.active = false;
            otherP.active = false;
            destroyedByClash = true;
            this.particleManager.spawnHitSpark(
              px1 + p.width / 2,
              py1 + p.height / 2,
              false,
            );
            break;
          }
          // Beam vs Rajada Normal => Rajada explode, Beam continua
          else if (
            (p.isBeam || p.isGiantBlast) &&
            !otherP.isBeam &&
            !otherP.isGiantBlast
          ) {
            otherP.active = false;
            this.particleManager.spawnHitSpark(
              px2 + otherP.width / 2,
              py2 + otherP.height / 2,
              false,
            );
          }
        }
      }

      if (destroyedByClash) {
        if (p.beamFamilyId !== "ZAMASU_CUSTOM" && p.beamFamilyId !== "ZAMASU_EFFECT_REMOVED") {
            const owner = p.ownerId === "p1" ? this.player1 : this.player2;
            const isRealBeam = p.isBeam || p.isGiantBlast || (p.beamFamilyId && !p.beamFamilyId.includes("PROJETIL") && !p.beamFamilyId.includes("PROJECTILE") && !p.beamFamilyId.includes("KI_BLAST") && !p.beamFamilyId.includes("GENKIDAMA") && !p.beamFamilyId.includes("FECHO"));
            if (isRealBeam) {
                if (
                    (owner.state === PlayerState.ATTACKING ||
                    owner.state === PlayerState.JUMP_ATTACK ||
                    owner.state === PlayerState.CROUCH_ATTACK ||
                    owner.state === PlayerState.ULTIMATE) &&
                    ((owner.comboType && typeof owner.comboType === "string" && owner.comboType.includes("SPECIAL")) || owner.comboType === "KI_BLAST" || owner.state === PlayerState.ULTIMATE)
                ) {
                     owner.attackTimer = 0;
                     owner.animFinished = true;
                     owner.animTimer = 0;
                }
            }
        }
        this.projectiles.splice(i, 1)[0].release();
        continue;
      }

      const opponents =
        p.ownerId === "p1"
          ? [
              this.player2,
              ...this.p2Team.filter((x) =>
                [
                  PlayerState.ASSIST_ENTRY,
                  PlayerState.ASSIST_ACTION,
                  PlayerState.ASSIST_EXIT,
                ].includes(x.state),
              ),
            ]
          : [
              this.player1,
              ...this.p1Team.filter((x) =>
                [
                  PlayerState.ASSIST_ENTRY,
                  PlayerState.ASSIST_ACTION,
                  PlayerState.ASSIST_EXIT,
                ].includes(x.state),
              ),
            ];

      for (const opponent of opponents) {
        if (opponent.invincibleTimer > 0) continue;
        if (
          opponent.state === PlayerState.DEFEAT ||
          opponent.state === PlayerState.TAG_IN ||
          opponent.state === PlayerState.TAG_OUT
        )
          continue;

        // Skip player collision/damage checking for standard beams during an active beam clash or cinematic impact
        if ((this.isBeamClashActive || this.isCinematicBeamImpact) && p.isBeam) {
          continue;
        }

        const owner = p.ownerId === "p1" ? this.player1 : this.player2;
        const hOpp = opponent.hitbox;

        let px =
          p.vx > 0
            ? p.x + (p.customOffsetX || 0)
            : p.x - (p.customOffsetX || 0);
        let py = p.y + (p.customOffsetY || 0);
        let pw = p.width;
        let ph = p.height;

        if (p.beamFamilyId === "fechosenergia_10") {
          const config = ProjectileConfigKeyManager.getInstance().getProjectileConfig("fechosenergia_10");
          if (config && config.middle) {
            const img = AnimationManager.getInstance().getGifFrame(config.middle.imageUrl, p.animFrame);
            const scale = p.customScale ?? config.middle.scale ?? 2.0;
            const imgW = img ? img.width : 80;
            const imgH = img ? img.height : 250;
            const scaledW = imgW * scale;
            const scaledH = imgH * scale;

            px = p.x - scaledW / 2;
            py = p.y - scaledH;
            pw = scaledW;
            ph = scaledH;
          }
        } else if (p.beamFamilyId) {
          const family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId);
          const ownerData =
            p.ownerId === "p1" ? this.player1.data : this.player2.data;
          const charOverrides = p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId];
          const midAnim = family?.middle
            ? { ...family.middle, ...(charOverrides?.middle as any) }
            : family?.middle;

          if (midAnim && midAnim.imageUrl) {
            const img = AnimationManager.getInstance().getGifFrame(
              midAnim.imageUrl,
              p.animFrame,
            );
            if (img) {
              const cacheKey = midAnim.imageUrl + "_" + p.animFrame;
              const bounds = CollisionHelper.getOpaqueAABB(
                img as any,
                cacheKey,
              );
              if (bounds) {
                const scale =
                  p.customScale ?? midAnim.scale ?? (p.isBeam ? 2.2 : 1.5);
                if (p.isBeam) {
                  const originH = img.height || (img as any).videoHeight || 100;
                  const startY = (-originH * scale) / 2 + 5;
                  const opaqueTop = startY + bounds.top * scale;
                  const opaqueBottom = startY + bounds.bottom * scale;
                  const midOffsetY = midAnim.offsetY || 0;
                  const absTop = py + midOffsetY + opaqueTop;
                  const absBottom = py + midOffsetY + opaqueBottom;

                  py = absTop;
                  ph = absBottom - absTop;
                } else {
                  const facingRight = p.initialFacingRight ?? p.vx > 0;
                  const imgW = img.width || (img as any).videoWidth || p.width;
                  const imgH =
                    img.height || (img as any).videoHeight || p.height;

                  const cx = px + p.width / 2;
                  const cy = py + p.height / 2;

                  py = cy - (imgH * scale) / 2 + bounds.top * scale;
                  ph = (bounds.bottom - bounds.top) * scale;

                  if (facingRight) {
                    px = cx - (imgW * scale) / 2 + bounds.left * scale;
                    pw = (bounds.right - bounds.left) * scale;
                  } else {
                    px =
                      cx - (imgW * scale) / 2 + (imgW - bounds.right) * scale;
                    pw = (bounds.right - bounds.left) * scale;
                  }
                }
              }
            }
          }
        }

        if (p.disabledCollision) continue;

        let isHit = false;
        let hitSegment: "start" | "middle" | "end" | null = null;

        if (p.isBeam) {
          const polyOpp = CollisionHelper.getAABBVertices(hOpp);

          // Check Ponta (End) first (Dano Alto, Defesa de Beam / Fixação)
          const polyEnd = CollisionHelper.getBeamPartVertices(p, this, "end");
          const hitEnd = CollisionHelper.testPolygonCollision(polyEnd, polyOpp);

          // Check Meio (Middle) (Dano Médio)
          const polyMiddle = CollisionHelper.getBeamPartVertices(p, this, "middle");
          const hitMiddle = CollisionHelper.testPolygonCollision(polyMiddle, polyOpp);

          // Check Início (Start) (Dano Baixo)
          const polyStart = CollisionHelper.getBeamPartVertices(p, this, "start");
          const hitStart = CollisionHelper.testPolygonCollision(polyStart, polyOpp);

          if (hitEnd) {
            isHit = true;
            hitSegment = "end";
          } else if (hitMiddle) {
            isHit = true;
            hitSegment = "middle";
          } else if (hitStart) {
            isHit = true;
            hitSegment = "start";
          }
        } else {
          const rotationVal = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation;
          if (p.beamFamilyId === "fechosenergia_10" || (rotationVal && Math.abs(rotationVal) >= 0.1)) {
            const polyPrj = CollisionHelper.getProjectileVertices(p, this);
            const polyOpp = CollisionHelper.getAABBVertices(hOpp);
            isHit = CollisionHelper.testPolygonCollision(polyPrj, polyOpp);
          } else {
            isHit = (
              px < hOpp.x + hOpp.width &&
              px + pw > hOpp.x &&
              py < hOpp.y + hOpp.height &&
              py + ph > hOpp.y
            );
          }
        }

        if (isHit) {
          // INTERCEPT BEAM HIT IF OPPONENT HAS ONGOING BEAM TRIGGERING BEAM CLASH!
          if (p.isBeam && !this.isBeamClashActive) {
            const oppOwnerId = opponent === this.player1 ? "p1" : "p2";
            const oppBeam = this.projectiles.find(
              (proj) =>
                proj.ownerId === oppOwnerId &&
                proj.isBeam &&
                proj.active &&
                !proj.isShrinking
            );
            if (oppBeam) {
              const p1Beam = p.ownerId === "p1" ? p : oppBeam;
              const p2Beam = p.ownerId === "p2" ? p : oppBeam;

              const didCollide = this.checkBeamTipCollision(p1Beam, p2Beam);
              if (didCollide) {
                this.tryStartBeamClash(p1Beam, p2Beam);
                break; // Stop checking this beam for this or other players
              }
            }
          }

          // check if projectile is a Genkidama or a Kamehameha (Beams/Giant blasts etc)
          const isGenkidamaOrKame =
            p.isBeam ||
            p.isGiantBlast ||
            (p.beamFamilyId && (
              p.beamFamilyId.includes("GENKIDAMA") ||
              p.beamFamilyId.includes("BEAM") ||
              p.beamFamilyId.includes("FECHO") ||
              p.beamFamilyId.includes("SPECIAL")
            )) ||
            (p.customAnimData?.name && (
              p.customAnimData.name.includes("Kamehameha") ||
              p.customAnimData.name.includes("Genkidama")
            ));

          if (isGenkidamaOrKame) {
            const targetId = opponent === this.player1 ? "p1" : "p2";
            let existingEffect = this.visualEffects.find(
              (eff) => eff.type === "KAME_GENKI_COLLISION" && eff.ownerId === targetId
            );

            if (!existingEffect) {
              const oppCenterX = hOpp.x + hOpp.width / 2;
              const oppCenterY = hOpp.y + hOpp.height / 2;
              this.spawnVisualEffect(
                "KAME_GENKI_COLLISION",
                oppCenterX,
                oppCenterY,
                "/Assets/efeitos/impacto/2.gif",
                30,
                true, // Set loop to true to keep it playing until the hits end
                targetId,
                2.5,
                opponent.facingRight
              );
              existingEffect = this.visualEffects[this.visualEffects.length - 1];
            }

            if (existingEffect) {
              (existingEffect as any).lastHitFrame = this.frameCount;
            }
          }

          if (!p.isBeam && !p.isGiantBlast && p.beamFamilyId !== "FECHO_5" && !p.beamFamilyId?.includes("FECHO")) {
            p.active = false;

            let explosionUrl: string | undefined = undefined;
            let explosionFrames = 3;
            let explosionScale = 2.0;

            if (p.beamFamilyId) {
              const family = BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId);
              if (family && family.end) {
                explosionUrl = family.end.imageUrl;
                explosionFrames = family.end.frames;
                explosionScale = family.end.scale || p.customScale || 1.5;
              }
            }

            if (explosionUrl) {
              this.spawnVisualEffect(
                "EXPLOSION",
                px + (p.vx > 0 ? pw : 0),
                py + ph / 2,
                explosionUrl,
                explosionFrames,
                false,
                p.ownerId,
                explosionScale,
                p.vx > 0,
              );
            }
          } else {
            // Beams, Giant Blast and FECHO_5 do multihit
            if (p.isGiantBlast || p.isBeam || p.beamFamilyId === "FECHO_5" || p.beamFamilyId?.includes("FECHO")) {
              if (p.isBeam) {
                // LOCK POSITION TO ROTATED BEAM AXIS & CONTINUOUSLY PUSH OUTWARDS ALONG THE BEAM'S DIRECTION
                const facingRight = p.initialFacingRight !== undefined ? p.initialFacingRight : p.vx > 0;
                const family = p.beamFamilyId ? BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId) : undefined;
                const ownerData = p.ownerId === "p1" ? this.player1.data : this.player2.data;
                const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId || ""];
                
                const rotationDeg = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation ?? charOverrides?.rotation ?? charOverrides?.middle?.rotation ?? charOverrides?.start?.rotation ?? family?.middle?.rotation ?? family?.start?.rotation ?? 0;
                const theta = (rotationDeg * Math.PI) / 180;
                
                const dirX = facingRight ? Math.cos(theta) : -Math.cos(theta);
                const dirY = Math.sin(theta);

                // Calculate the exact tip position of the beam (p.initialSpawnX is the absolute starting/origin point of the beam)
                const startX = p.initialSpawnX !== undefined ? p.initialSpawnX : (facingRight ? p.x : p.x + p.width);
                const tipX = startX + (facingRight ? p.width * Math.cos(theta) : -p.width * Math.cos(theta));

                const isFacingProjectile = (p.vx > 0 && !opponent.facingRight) || (p.vx < 0 && opponent.facingRight);
                const isBlocking = (
                  opponent.state === PlayerState.BLOCKING ||
                  opponent.state === PlayerState.BLOCKING_CROUCH ||
                  opponent.state === PlayerState.BLOCKING_AIR ||
                  opponent.state === PlayerState.WALK_BACKWARD
                ) && isFacingProjectile; // Immediate transition anywhere inside/against the beam

                if (isBlocking) {
                  // --- CASE 1: Character is defending (blocking) ---
                  // 1. Slow down beam growth rate during block
                  p.resistanceFactor = 0.2;
                  (p as any).wasBlockedThisFrame = true;

                  // 2. Continuous Contact: Keep character's contact edge pinned strictly to the tip of the beam (never crossings/atravessamentos)
                  let targetOpponentPosX = tipX + (facingRight ? opponent.width / 2 : -opponent.width / 2);

                  // Keep within map boundaries
                  if (targetOpponentPosX + opponent.width / 2 > this.physLimitRight) {
                    targetOpponentPosX = this.physLimitRight - opponent.width / 2;
                  }
                  if (targetOpponentPosX - opponent.width / 2 < this.physLimitLeft) {
                    targetOpponentPosX = this.physLimitLeft + opponent.width / 2;
                  }

                  // Update opponent's physical logical position smoothly
                  opponent.pos.x = targetOpponentPosX;
                  opponent.velocity.x = facingRight ? 4 : -4;
                  opponent.velocity.y = 0;

                  // Align Y to the beam axis
                  const originX = p.x + (facingRight ? p.customOffsetX || 0 : p.width - (p.customOffsetX || 0));
                  const originY = p.y + (p.customOffsetY || 0);
                  const dxCurrent = opponent.x - originX;
                  if (Math.abs(dirX) > 0.01) {
                    const dist = dxCurrent / dirX;
                    opponent.pos.y = originY + dist * dirY + opponent.height / 2;
                  }

                  // Lock the beam's length/width so it stays in exact continuous contact with the opponent's boundary (no crossing!)
                  const finalContactX = facingRight ? opponent.x : opponent.x + opponent.width;
                  const cosVal = Math.cos(theta);
                  if (cosVal > 0.01) {
                    p.width = Math.abs(finalContactX - startX) / cosVal;
                  }

                  opponent.gravityDisabledTimer = 10;
                  opponent.isGrounded = false;
                } else {
                  // --- CASE 2: Character is NOT defending ---
                  // O Beam pode atravessar completamente o personagem.
                  // A ponta do Beam deve continuar seu deslocamento normalmente, sem sofrer bloqueio.
                  p.resistanceFactor = 1.0;
                  (p as any).wasBlockedThisFrame = false;

                  // Durante a travessia, o personagem deve acompanhar o movimento do Beam, sendo arrastado na direção do impacto.
                  opponent.velocity.x = facingRight ? 6 : -6;
                  opponent.pos.x += facingRight ? 4.5 : -4.5;

                  // Keep opponent aligned to the beam's Y axis
                  const originX = p.x + (facingRight ? p.customOffsetX || 0 : p.width - (p.customOffsetX || 0));
                  const originY = p.y + (p.customOffsetY || 0);
                  const dxCurrent = opponent.x - originX;
                  if (Math.abs(dirX) > 0.01) {
                    const dist = dxCurrent / dirX;
                    opponent.pos.y = originY + dist * dirY + opponent.height / 2;
                  }

                  opponent.gravityDisabledTimer = 5;
                  opponent.isGrounded = false;
                }
              }

              if (opponent.stunTimer > 0) {
                if (p.isGiantBlast) {
                  if (
                    opponent.state === PlayerState.LAUNCHED ||
                    opponent.state === PlayerState.BLOCKING ||
                    opponent.state === PlayerState.BLOCKING_CROUCH ||
                    opponent.state === PlayerState.BLOCKING_AIR
                  ) {
                    opponent.velocity.x = p.vx;
                    opponent.velocity.y = p.vy || 0;
                    opponent.gravityDisabledTimer = 10;
                  }
                }
              }
              const targetId = opponent === this.player1 ? "p1" : "p2";
              (p as any).lastHitFrames = (p as any).lastHitFrames || {};
              const lastHit = (p as any).lastHitFrames[targetId];
              if (lastHit !== undefined && this.frameCount - lastHit < 10) {
                continue;
              }
              (p as any).lastHitFrames[targetId] = this.frameCount;
            }
          }

          const isFacingProjectile =
            (p.vx > 0 && !opponent.facingRight) ||
            (p.vx < 0 && opponent.facingRight);
          const isBlocking =
            (opponent.state === PlayerState.BLOCKING ||
              opponent.state === PlayerState.BLOCKING_CROUCH ||
              opponent.state === PlayerState.BLOCKING_AIR ||
              opponent.state === PlayerState.WALK_BACKWARD) &&
            isFacingProjectile;

          const isGenkidama = p.beamFamilyId && (p.beamFamilyId.includes("GENKIDAMA") || p.beamFamilyId.includes("SPIRIT_BOMB"));
          const isFecho = p.beamFamilyId && (p.beamFamilyId.includes("FECHO") || p.beamFamilyId.includes("STREAM") || p.beamFamilyId.includes("CONTINUOUS"));
          const isBeam = p.isBeam || (p.beamFamilyId && (p.beamFamilyId.includes("BEAM") || p.beamFamilyId.includes("KAMEHAMEHA") || p.beamFamilyId.includes("FINAL_FLASH") || p.beamFamilyId.includes("MASENKO") || p.beamFamilyId.includes("GALICK") || p.beamFamilyId.includes("SPECIAL")));
          const isCommonProj = !isGenkidama && !isFecho && !isBeam;

          // Perfect Deflect is only eligible for Beams and Common Proj, not Genkidama or Fecho.
          const isEligibleForDeflection = (isBeam || isCommonProj) && !isGenkidama && !isFecho;

          const isBeamDeflectionSuccess =
            isEligibleForDeflection &&
            isBlocking &&
            opponent.blockFrames > 0 &&
            opponent.blockFrames <= 15 &&
            opponent.ki >= 200;

          if (isBeamDeflectionSuccess) {
            // 1) Consume 2 bars of Ki (200 Ki points)
            opponent.ki = Math.max(0, opponent.ki - 200);

            // 2) The character executes the deflection animation and state
            opponent.state = PlayerState.REFLECT;
            opponent.reflectTimer = 35;
            opponent.velocity.x = 0;
            opponent.velocity.y = 0;
            opponent.attackTimer = 45;

            // 3) Deflect the Beam or projectile
            if (isBeam) {
              p.isDeflected = true;
              p.disabledCollision = true;
              const randomAngle = -45 - Math.random() * 45; // between -45 and -90 deg
              const theta = (randomAngle * Math.PI) / 180;
              p.vx = (opponent.facingRight ? 1 : -1) * Math.cos(theta) * 12;
              p.vy = Math.sin(theta) * 12;
              p.rotation = opponent.facingRight ? randomAngle : -180 - randomAngle;
              p.life = 60; // Keep it alive for 60 frames to fly out of bounds
            } else {
              p.vx = -p.vx; // Reverse direction directly to attacker
              p.vy = 0;
              p.active = true; // Keep it active
              p.ownerId = opponent === this.player1 ? "p1" : "p2"; // Change ownership!
              p.sourcePlayer = opponent;
            }

            // 4) Hit Stop (Pequena pausa)
            this.hitStopTimer = 15;

            // 5) High-intensity visual impact effects & sparks
            const collisionX = p.vx > 0 ? opponent.x : opponent.x + opponent.width;
            const collisionY = opponent.y + opponent.height / 2;

            for (let i = 0; i < 25; i++) {
              this.particleManager.spawn(
                "ENERGY",
                collisionX + (Math.random() - 0.5) * 40,
                collisionY + (Math.random() - 0.5) * 40,
                15,
                "#00ffff", // bright cyan
                { size: Math.random() * 8 + 4, speed: Math.random() * 6 + 2 },
              );
              this.particleManager.spawn(
                "SPARK",
                collisionX + (Math.random() - 0.5) * 40,
                collisionY + (Math.random() - 0.5) * 40,
                15,
                "#ffffff", // white spark
                { size: Math.random() * 6 + 2, speed: Math.random() * 8 + 3 },
              );
            }

            // Spawn the intense Kamehameha collision/explosion GIF
            this.spawnVisualEffect(
              "EXPLOSION",
              opponent.x + opponent.width / 2,
              opponent.y + opponent.height / 2,
              "/Assets/efeitos/impacto/2.gif",
              30,
              false,
              undefined,
              2.5
            );

            // 6) Exclusive Perfect Guard SFX
            try {
              AudioManager.getInstance().playSFX("perfect_guard");
            } catch (err) {
              console.error("Failed to play perfect guard sfx:", err);
            }

            // High-impact screen shake
            this.camera.addScreenShake(20, 15, "IMPULSE", 0.8);

            // Deflected the beam, skip applying block or hits
            continue;
          }

          const isReflecting =
            opponent.state === PlayerState.REFLECT && isFacingProjectile;

          const isPerfectBlock =
            isBlocking &&
            opponent.blockFrames > 0 &&
            opponent.blockFrames <= 15 &&
            !isGenkidama &&
            !isFecho;

          let hitDamage = p.isBeam ? KI_BLAST_DAMAGE * 1.5 : KI_BLAST_DAMAGE;
          if (p.isBeam) {
            const baseDmg = KI_BLAST_DAMAGE * 1.2;
            if (hitSegment === "end") {
              hitDamage = baseDmg * 1.5; // Dano alto
            } else if (hitSegment === "middle") {
              hitDamage = baseDmg * 1.0; // Dano médio
            } else if (hitSegment === "start") {
              hitDamage = baseDmg * 0.5; // Dano baixo
            }
          }
          if (p.isBeam && (p as any).beamClashWin) {
            hitDamage *= 1.25; // 25% extra damage
          }

          if (isReflecting) {
            opponent.ki = Math.min(MAX_KI, opponent.ki + KI_GAIN_ON_DAMAGE);
            if (!p.isBeam) {
              p.vx = -p.vx; // Reverse direction
              p.active = true; // Keep it active if it was set to false
              p.ownerId = opponent === this.player1 ? "p1" : "p2"; // Change ownership!
              this.particleManager.spawn("ENERGY", p.x, p.y, 10, "#aaffff", {
                size: 6,
                speed: 2,
              });
            } else {
              this.particleManager.spawn(
                "BLOCK",
                p.x + (p.vx > 0 ? p.width : 0),
                p.y + p.height / 2,
                10,
                "#aaffff",
              );
            }
          } else if (isPerfectBlock) {
            opponent.ki = Math.min(
              MAX_KI,
              opponent.ki + KI_GAIN_ON_DAMAGE * 1.5,
            );
            
            // Stun attacker/source player slightly to give frame advantage
            const pOwner = p.ownerId === "p1" ? this.player1 : this.player2;
            if (pOwner) {
              pOwner.stunTimer = Math.max(pOwner.stunTimer, 15);
            }

            // Reflect ki blasts, ignore beams for reflect but don't take damage
            if (!p.isBeam) {
              p.vx = (opponent.facingRight ? 4 : -4);
              p.vy = -10;
              p.active = false;
              this.particleManager.spawn("SPARK", p.x, p.y, 10, "#ffffff", {
                size: 6,
                speed: 2,
              });
            } else {
              this.particleManager.spawn(
                "BLOCK",
                p.x + (p.vx > 0 ? p.width : 0),
                p.y + p.height / 2,
                8,
                "#ffffff",
              );
            }
          } else if (isBlocking) {
            let chipPercent = CHIP_DAMAGE_PERCENT;
            let guardCost = hitDamage * 0.2;
            let pushbackForce = 2;

            if (isGenkidama) {
              chipPercent = 0.25; // 25% chip damage
              guardCost = 80;     // Extreme guard damage
              pushbackForce = 15; // Massive pushback
              this.camera.addScreenShake(12, 10, "IMPULSE", 0.8);
            } else if (isFecho) {
              chipPercent = CHIP_DAMAGE_PERCENT;
              guardCost = 3.0;    // Continuous energy stream pressure
              pushbackForce = 8;  // Very strong pushback
            } else if (isBeam) {
              chipPercent = CHIP_DAMAGE_PERCENT;
              guardCost = 2.0;    // Medium-high continuous pressure
              pushbackForce = 5;  // Medium pushback
            } else {
              chipPercent = 0.02; // Very low chip for common projectiles
              guardCost = 3;      // Low guard consumption
              pushbackForce = 1.5; // Low pushback
              p.active = false;   // Common projectile destroyed on block
            }

            const chip = hitDamage * chipPercent;
            opponent.takeDamage(chip);
            this.camera.addScreenShake(5, 3, "IMPULSE", 0.5);
            opponent.ki = Math.min(
              MAX_KI,
              opponent.ki + KI_GAIN_ON_DAMAGE * 0.5,
            );
            opponent.guard -= guardCost;
            opponent.guardRegenTimer = GUARD_REGEN_DELAY;
            this.particleManager.spawn(
              "BLOCK",
              p.x + (p.vx > 0 ? p.width : 0),
              p.y + p.height / 2,
              5,
              "#60a5fa",
            );
            if (p.isBeam) {
              (p as any).wasBlockedThisFrame = true;
              p.resistanceFactor = 0.2;
              // Positioning, physical block and pushback are handled smoothly in the physics update phase!
            } else if (p.isBeam || isFecho) {
              const facingRight = p.initialFacingRight !== undefined ? p.initialFacingRight : p.vx > 0;
              const family = p.beamFamilyId ? BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId) : undefined;
              const ownerData = p.ownerId === "p1" ? this.player1.data : this.player2.data;
              const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId || ""];
              
              const rotationDeg = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation ?? charOverrides?.rotation ?? charOverrides?.middle?.rotation ?? charOverrides?.start?.rotation ?? family?.middle?.rotation ?? family?.start?.rotation ?? 0;
              const theta = (rotationDeg * Math.PI) / 180;
              
              const dirX = facingRight ? Math.cos(theta) : -Math.cos(theta);
              const dirY = Math.sin(theta);
              
              opponent.velocity.x = dirX * pushbackForce;
              opponent.velocity.y = dirY * pushbackForce;
              opponent.gravityDisabledTimer = 10;
            } else {
              opponent.velocity.x = p.isGiantBlast
                ? p.vx
                : p.vx > 0
                  ? pushbackForce
                  : -pushbackForce;
              if (p.isGiantBlast) {
                opponent.velocity.y = 0;
                opponent.gravityDisabledTimer = 10;
              }
            }
            if (opponent.guard <= 0) {
              opponent.guard = 0;
              opponent.state = PlayerState.GUARD_BREAK;
              try {
                AudioManager.getInstance().playSFX("guard_break");
              } catch (gbErr) {
                console.error("Failed to play guard_break SFX:", gbErr);
              }
              opponent.ataque = false;
              opponent.stunTimer = GUARD_BREAK_STUN;
              opponent.velocity.x = p.vx > 0 ? 15 : -15; // Forced recoil on guard break!
              const collisionX = (p.vx > 0 || (p as any).initialFacingRight) ? opponent.x : opponent.x + opponent.width;
              const collisionY = p.y + p.height / 2;
              this.particleManager.spawnHitSpark(collisionX, collisionY, true);
              this.camera.addScreenShake(15, 12, "IMPULSE", 1);
            }
          } else {
            // Multiplicador de dano dinâmico baseado no contador de combos atual (ComboCount) - Máximo de 10%
            const projComboBonus = Math.min(0.10, owner.comboCount * 0.01);
            let dmg = (hitDamage * owner.attackMult * this.customDamageMultiplier * opponent.defenseMult) * (1 + projComboBonus);
            owner.comboCount++;
            owner.comboWindow = COMBO_WINDOW;
            opponent.takeDamage(dmg);
            if (p.isBeam || p.isGiantBlast) {
              this.camera.addScreenShake(15, 12, "PERLIN", 0.8);
            } else {
              this.camera.addScreenShake(8, 5, "IMPULSE", 0.5);
            }
            opponent.ki = Math.min(MAX_KI, opponent.ki + KI_GAIN_ON_DAMAGE);
            
            const prevOppState = opponent.state;
            const prevOppGrounded = opponent.isGrounded;
            const prevOppAtaque = opponent.ataque;

            opponent.stunTimer =
              p.isGiantBlast ? STUN_DURATION : (p.isBeam ? 0 : STUN_DURATION_LIGHT);

            if (p.isGiantBlast) {
              opponent.gravityDisabledTimer = STUN_DURATION;
              opponent.state = PlayerState.BLOCKING;
              opponent.facingRight = p.vx < 0;
              opponent.isGrounded = false;
              opponent.ataque = false;
              opponent.velocity.y = p.vy || 0;
              opponent.velocity.x = p.vx;
            } else if (p.isBeam) {
              // Beams do not lock state, disable gravity, or disable attacks/ground status
              opponent.state = prevOppState;
              opponent.isGrounded = prevOppGrounded;
              opponent.ataque = prevOppAtaque;

              const facingRight = p.initialFacingRight !== undefined ? p.initialFacingRight : p.vx > 0;
              const family = p.beamFamilyId ? BeamConfigKeyManager.getInstance().getBeamConfig(p.beamFamilyId) : undefined;
              const ownerData = p.ownerId === "p1" ? this.player1.data : this.player2.data;
              const charOverrides = p.sourceAnimConfig?.beamConfig ?? p.customAnimData?.beamConfig ?? ownerData.beamOverrides?.[p.beamFamilyId || ""];
              
              const rotationDeg = p.rotation ?? p.sourceAnimConfig?.rotation ?? p.customAnimData?.rotation ?? charOverrides?.rotation ?? charOverrides?.middle?.rotation ?? charOverrides?.start?.rotation ?? family?.middle?.rotation ?? family?.start?.rotation ?? 0;
              const theta = (rotationDeg * Math.PI) / 180;
              
              const dirX = facingRight ? Math.cos(theta) : -Math.cos(theta);
              const dirY = Math.sin(theta);

              let pushForce = 1.0; // Início: empurrão mínimo
              if (hitSegment === "middle") {
                pushForce = 2.5; // Meio: empurrão moderado
              } else if (hitSegment === "end") {
                pushForce = 4.0; // Ponta: empurrão levemente mais forte
              }

              opponent.velocity.x = dirX * pushForce;
              opponent.velocity.y = dirY * pushForce;
            } else {
              opponent.state = PlayerState.HIT;
              opponent.isGrounded = false;
              opponent.ataque = false;
              if (p.beamFamilyId === "FECHO_5") {
                opponent.velocity.y = 8;
                opponent.velocity.x = 0;
                opponent.gravityDisabledTimer = 10;
              } else if (p.beamFamilyId === "fechosenergia_10") {
                const facingRight = p.initialFacingRight !== undefined ? p.initialFacingRight : true;
                opponent.velocity.y = 0;
                opponent.velocity.x = facingRight ? 4 : -4;
              } else {
                opponent.velocity.y = 0;
                opponent.velocity.x = p.vx > 0 ? 3 : -3;
              }
            }

            if (![this.player1, this.player2].includes(opponent)) {
              // Is assist
              opponent.assistCooldown += 300; // Penalty cooldown
            }
            if (owner.comboCount > 1 && p.beamFamilyId !== "FECHO_5" && !p.isBeam && !p.isGiantBlast) {
              opponent.pos.y = owner.pos.y;
            }
            const collisionX = (p.vx > 0 || (p as any).initialFacingRight) ? opponent.x : opponent.x + opponent.width;
            const collisionY = p.y + p.height / 2;
            this.particleManager.spawnHitSpark(
              collisionX,
              collisionY,
              false,
            );
          }
          break; // Projectile destroyed, don't test other targets
        }
      }
    }

    // Reset resistanceFactor of beams that were NOT blocked this frame
    this.projectiles.forEach((proj) => {
      if (proj.isBeam && !(proj as any).wasBlockedThisFrame) {
        proj.resistanceFactor = 1.0;
      }
    });
  }

  public applyCameraBounds(p: Player) {
    const floorY = WORLD_HEIGHT - this.groundY;
    const camBounds = this.camera.getVisibleBounds();
    const isExiting =
      p.state === PlayerState.TAG_OUT ||
      p.state === PlayerState.ASSIST_EXIT ||
      p === this.koClashIncomingPlayer ||
      p.isKOTag;

    // Y Constraint (Ground)
    if (!isExiting) {
      if (p.pos.y >= floorY && p.velocity.y >= 0) {
        const attacker = p === this.player1 ? this.player2 : this.player1;
        const isAttackerUlting =
          attacker && attacker.state === PlayerState.ULTIMATE;

        const isHitState = [
          PlayerState.HIT, 
          PlayerState.HIT_2, 
          PlayerState.HIT_3, 
          PlayerState.HIT_AIR, 
          PlayerState.HIT_AIR_FALL, 
          PlayerState.LAUNCHED,
          PlayerState.FALLING_HIT
        ].includes(p.state);

        if (
          isHitState &&
          p.velocity.y > 15 &&
          !isAttackerUlting
        ) {
          p.pos.y = floorY - 10;
          if (!p.groundBounceUsed) {
            // Hard knockdown slam bounce
            p.velocity.y = -(p.velocity.y * 0.5); // Bounce up
            p.groundBounceUsed = true;
            p.state = PlayerState.HIT_GROUND_CRASH;
          } else {
            // Sliding Knockdown behavior if ground bounce already used
            p.velocity.x = p.velocity.x > 0 ? 5 : -5;
            p.slidingKnockdown = true;
            p.velocity.y = 0;
            p.state = PlayerState.HIT_GROUND_STUNNED;
            p.stunTimer = 60; // Stay down longer
          }
          this.particleManager.spawnDust(p.pos.x, p.pos.y, 2);
          this.particleManager.spawnHitSpark(p.pos.x, p.pos.y, true); // Extra effect for slam
          
          let groundFx = this.currentStageData?.groundDestroyedConfig;
          let configKey = this.currentStageData?.groundDestroyedConfigKey || "";

          // Resolve key if it exists
          if (configKey) {
            const resolved = EffectConfigKeyManager.getInstance().getEffect(configKey);
            if (resolved) {
              groundFx = resolved as any;
            }
          }

          this.spawnVisualEffect(
            "GROUND_DESTROYED",
            p.pos.x + (groundFx?.offsetX || 0),
            floorY + (groundFx?.offsetY || 0),
            groundFx?.imageUrl || "/Assets/efeitos/chao/destruido/1.gif",
            groundFx?.frames ?? 12,
            groundFx?.loop ?? false,
            "",
            groundFx?.scale ?? 2.8,
            p.facingRight,
            configKey,
            groundFx?.speed ?? 4,
            groundFx?.frameWidth,
            groundFx?.frameHeight,
            groundFx?.isGif
          );
          p.isGrounded = false;
        } else {
          p.pos.y = floorY;
          p.velocity.y = 0;
          if (!p.isGrounded) {
            p.jumpsUsed = 0;
            p.airDashUsed = false;
            p.airComboUsed = false;
            
            p.autoDashUsed = false;
            p.superDashExecuted = false;
            p.superDashHitOpponent = false;
            p.superDashWaitingForGround = false;
            console.log("[SuperDash Reset] Player landed. Availability reset.", { player: p.data.id });

            try {
              AudioManager.getInstance().playSFX("land");
            } catch (landErr) {
              console.error("Failed to play land SFX:", landErr);
            }
            this.particleManager.spawnDust(p.pos.x, p.pos.y, 0);
            if (
              p.state !== PlayerState.INTRO &&
              p.state !== PlayerState.TAG_IN &&
              p.state !== PlayerState.TAG_OUT &&
              p.state !== PlayerState.ASSIST_EXIT &&
              !this.isBeamClashActive &&
              p.state !== PlayerState.ULTIMATE &&
              (!p.comboType || (!p.comboType.startsWith("SPECIAL") && !p.comboType.startsWith("ULT")))
            ) {
              p.landingDelayTimer = 12; // 0.2s * 60fps
              p.state = PlayerState.LANDING;
              p.velocity.x = 0;
              p.ataque = false;
              p.attackTimer = 0;
            }
          }
          p.isGrounded = true;
          p.airComboLockout = false;
        }
      } else {
        p.isGrounded = false;
      }
    }

    // X Constraints (Camera Bounds)
    const isOverriddenState =
      this.player1.state === PlayerState.INTRO ||
      this.player1.state === PlayerState.TAG_IN ||
      this.player1.state === PlayerState.TAG_OUT ||
      this.player2.state === PlayerState.INTRO ||
      this.player2.state === PlayerState.TAG_IN ||
      this.player2.state === PlayerState.TAG_OUT ||
      p.state === PlayerState.TAG_IN ||
      p.hp <= 0;

    const isZoomDependentState =
      this.player1.state === PlayerState.ULTIMATE ||
      this.player1.state === PlayerState.TRANSFORM ||
      this.player1.state === PlayerState.DETRANSFORM ||
      this.player1.state === PlayerState.FUSION ||
      this.player1.state === PlayerState.DEFUSION ||
      this.player2.state === PlayerState.ULTIMATE ||
      this.player2.state === PlayerState.TRANSFORM ||
      this.player2.state === PlayerState.DETRANSFORM ||
      this.player2.state === PlayerState.FUSION ||
      this.player2.state === PlayerState.DEFUSION;

    const ignoreBounds =
      this.introPhase !== IntroPhase.FIGHT ||
      this.koSequenceActive ||
      this.cameraRecoverTimer > 0 ||
      isOverriddenState ||
      (isZoomDependentState && this.cameraHasOverride);

    if (!isExiting && !ignoreBounds) {
      const h = p.hitbox;
      if (h.x < camBounds.left) {
        p.pos.x = camBounds.left + p.width / 2;
        if (p.velocity.x < 0) {
          if (
            p.state === PlayerState.HIT &&
            Math.abs(p.velocity.x) > 15 &&
            !p.wallBounceUsed
          ) {
            p.velocity.x = -p.velocity.x * 0.4; // Wall bounce
            p.wallBounceUsed = true;
            this.particleManager.spawnHitSpark(
              camBounds.left,
              p.y + p.height / 2,
              true,
            );
          } else {
            p.velocity.x = 0;
          }
        }
      }
      if (h.x + h.width > camBounds.right) {
        p.pos.x = camBounds.right - p.width / 2;
        if (p.velocity.x > 0) {
          if (
            p.state === PlayerState.HIT &&
            p.velocity.x > 15 &&
            !p.wallBounceUsed
          ) {
            p.velocity.x = -p.velocity.x * 0.4; // Wall bounce
            p.wallBounceUsed = true;
            this.particleManager.spawnHitSpark(
              camBounds.right,
              p.y + p.height / 2,
              true,
            );
          } else {
            p.velocity.x = 0;
          }
        }
      }
    }

    // X Constraints (World Bounds)
    if (!isExiting) {
      if (p.pos.x - p.width / 2 < this.physLimitLeft) {
        p.pos.x = this.physLimitLeft + p.width / 2;
        p.velocity.x = 0;
      }
      if (p.pos.x + p.width / 2 > this.physLimitRight) {
        p.pos.x = this.physLimitRight - p.width / 2;
        p.velocity.x = 0;
      }
    }
  }

  public resolveBodyCollision(p1: Player, p2: Player) {
    if (this.isBeamClashActive) return;

    if (
      p1.state === PlayerState.ULTIMATE ||
      p2.state === PlayerState.ULTIMATE ||
      (p1.data.id === "goku_mui" && p1.comboType && p1.comboType.startsWith("SPECIAL")) ||
      (p2.data.id === "goku_mui" && p2.comboType && p2.comboType.startsWith("SPECIAL")) ||
      p1.state === PlayerState.DRAGON_COMBO ||
      p2.state === PlayerState.DRAGON_COMBO ||
      (p1.data.id === "gogeta_blue" && p1.comboType === "SPECIAL_4") ||
      (p2.data.id === "gogeta_blue" && p2.comboType === "SPECIAL_4") ||
      (p1.data.id === "gogeta_ssj" && p1.comboType === "SPECIAL_2") ||
      (p2.data.id === "gogeta_ssj" && p2.comboType === "SPECIAL_2") ||
      (p1.data.id === "gogeta_ssj" && p1.comboType === "SPECIAL") ||
      (p2.data.id === "gogeta_ssj" && p2.comboType === "SPECIAL") ||
      p1.state === PlayerState.MUI_DODGE ||
      p2.state === PlayerState.MUI_DODGE ||
      p1.state === PlayerState.VANISH ||
      p2.state === PlayerState.VANISH ||
      p1.state === PlayerState.VANISH_APPEAR ||
      p2.state === PlayerState.VANISH_APPEAR
    )
      return;

    const h1 = p1.hitbox;
    const h2 = p2.hitbox;

    if (
      h1.x < h2.x + h2.width &&
      h1.x + h1.width > h2.x &&
      h1.y < h2.y + h2.height &&
      h1.y + h1.height > h2.y
    ) {
      // --- Super Dash Collision Logic (Mimics TAG_IN behavior) ---
      const p1SD = p1.state === PlayerState.SUPER_DASH && p1.superDashPhase === 2;
      const p2SD = p2.state === PlayerState.SUPER_DASH && p2.superDashPhase === 2;

      if (p1SD && p2SD) {
        // Clash: Both Super Dashing
        p1.state = PlayerState.JUMPING;
        p2.state = PlayerState.JUMPING;
        p1.velocity.y = -18; // Launch to the top
        p2.velocity.y = -18; // Launch to the top
        p1.velocity.x = p1.pos.x < p2.pos.x ? -3 : 3; // Slight bounce back (stays close)
        p2.velocity.x = p2.pos.x < p1.pos.x ? -3 : 3; // Slight bounce back (stays close)
        p1.isGrounded = false;
        p2.isGrounded = false;
        p1.ataque = false;
        p2.ataque = false;
        p1.superDashActive = false;
        p2.superDashActive = false;
        p1.rotation = 0;
        p2.rotation = 0;
        
        this.camera.addScreenShake(15, 10, "IMPULSE", 1);
        this.particleManager.spawnHitSpark(
          (h1.x + h1.width / 2 + h2.x + h2.width / 2) / 2,
          (h1.y + h1.height / 2 + h2.y + h2.height / 2) / 2,
          true
        );
        try { AudioManager.getInstance().playSFX("clash"); } catch(e){}
        return;
      } else if (p1SD && p2.state !== PlayerState.TAG_IN && p2.state !== PlayerState.TAG_OUT && p2.invincibleTimer <= 0) {
        // P1 (Super Dash) hits P2
        p1.state = PlayerState.JUMPING;
        p1.velocity.y = -18; // Launch attacker up
        p1.velocity.x = p1.pos.x < p2.pos.x ? 5 : -5; // Move towards opponent (stays close)
        p1.isGrounded = false;
        p1.ataque = false;
        p1.superDashActive = false;
        p1.comboWindow = 35;
        p1.rotation = 0;

        if (p2.state !== PlayerState.BLOCKING && p2.state !== PlayerState.BLOCKING_AIR && p2.state !== PlayerState.BLOCKING_CROUCH) {
          p2.state = PlayerState.HIT;
          p2.velocity.y = -18; // Launch defender up
          p2.velocity.x = p1.pos.x < p2.pos.x ? 2 : -2; // Drift away slowly (stays close)
          p2.isGrounded = false;
          p2.stunTimer = 40;
          p2.takeDamage(15);
        } else {
          p2.stunTimer = 15;
          p2.velocity.x = p1.pos.x < p2.pos.x ? 4 : -4; // Push back on block
        }

        this.particleManager.spawnHitSpark(h2.x + h2.width / 2, h2.y + h2.height / 2, false);
        this.camera.addScreenShake(10, 5, "IMPULSE", 1);
        try { AudioManager.getInstance().playSFX("hit"); } catch(e){}
        return;
      } else if (p2SD && p1.state !== PlayerState.TAG_IN && p1.state !== PlayerState.TAG_OUT && p1.invincibleTimer <= 0) {
        // P2 (Super Dash) hits P1
        p2.state = PlayerState.JUMPING;
        p2.velocity.y = -18; // Launch attacker up
        p2.velocity.x = p2.pos.x < p1.pos.x ? 5 : -5; // Move towards opponent (stays close)
        p2.isGrounded = false;
        p2.ataque = false;
        p2.superDashActive = false;
        p2.comboWindow = 35;
        p2.rotation = 0;

        if (p1.state !== PlayerState.BLOCKING && p1.state !== PlayerState.BLOCKING_AIR && p1.state !== PlayerState.BLOCKING_CROUCH) {
          p1.state = PlayerState.HIT;
          p1.velocity.y = -18; // Launch defender up
          p1.velocity.x = p2.pos.x < p1.pos.x ? 2 : -2; // Drift away slowly (stays close)
          p1.isGrounded = false;
          p1.stunTimer = 40;
          p1.takeDamage(15);
        } else {
          p1.stunTimer = 15;
          p1.velocity.x = p2.pos.x < p1.pos.x ? 4 : -4; // Push back on block
        }

        this.particleManager.spawnHitSpark(h1.x + h1.width / 2, h1.y + h1.height / 2, false);
        this.camera.addScreenShake(10, 5, "IMPULSE", 1);
        try { AudioManager.getInstance().playSFX("hit"); } catch(e){}
        return;
      }

      // --- Dash Collision Logic ---
      if (
        p1.state === PlayerState.DASHING &&
        p2.state === PlayerState.DASHING
      ) {
        p1.state = PlayerState.HIT;
        p2.state = PlayerState.HIT;
        p1.stunTimer = 15;
        p2.stunTimer = 15;
        p1.ataque = false;
        p2.ataque = false;
        p1.velocity.x = p1.pos.x < p2.pos.x ? -10 : 10;
        p2.velocity.x = p2.pos.x < p1.pos.x ? -10 : 10;
        p1.velocity.y = -10;
        p2.velocity.y = -10;
        p1.isGrounded = false;
        p2.isGrounded = false;
        this.particleManager.spawnHitSpark(
          (p1.x + p2.x) / 2 + p1.width / 2,
          (p1.y + p2.y) / 2 + p1.height / 2,
          false,
        );
      } else {
        if (p1.state === PlayerState.DASHING) {
          p1.state = PlayerState.JUMPING; // Ready to combo!
          p1.isGrounded = false;
          p1.velocity.y = -15;
          p1.velocity.x = p1.pos.x < p2.pos.x ? 5 : -5; // Move towards opponent!

          p2.takeDamage(15);
          p2.state = PlayerState.HIT;
          p2.ataque = false;
          p2.stunTimer = 40; // Long enough for air combo
          p2.isGrounded = false;
          p2.velocity.y = -15; // Launch up with attacker
          p2.velocity.x = p2.pos.x < p1.pos.x ? -2 : 2; // Very slow drift

          this.particleManager.spawnHitSpark(
            p2.x + p2.width / 2,
            p2.y + p2.height / 2,
            false,
          );
        }
        if (p2.state === PlayerState.DASHING) {
          p2.state = PlayerState.JUMPING;
          p2.isGrounded = false;
          p2.velocity.y = -15;
          p2.velocity.x = p2.pos.x < p1.pos.x ? 5 : -5;

          p1.takeDamage(15);
          p1.state = PlayerState.HIT;
          p1.ataque = false;
          p1.stunTimer = 40;
          p1.isGrounded = false;
          p1.velocity.y = -15;
          p1.velocity.x = p1.pos.x < p2.pos.x ? -2 : 2;

          this.particleManager.spawnHitSpark(
            p1.x + p1.width / 2,
            p1.y + p1.height / 2,
            false,
          );
        }
      }

      // If either player is quick dashing, don't apply bodily pushback (allow passing through)
      if (
        p1.state === PlayerState.QUICK_DASH ||
        p2.state === PlayerState.QUICK_DASH
      ) {
        return;
      }

      // Calculate precise overlap based on the hurtboxes (hitboxes)
      const overlapX = Math.min(
        h1.x + h1.width - h2.x,
        h2.x + h2.width - h1.x
      );

      if (overlapX > 0) {
        let specialRepelled = false;

        // Se um jogador está no meio de um especial e o outro encosta nele
        if (
          p1.comboType === "SPECIAL" &&
          p2.comboType !== "SPECIAL" &&
          p1.ataque
        ) {
          if (
            p2.state !== PlayerState.HIT &&
            p2.state !== PlayerState.LAUNCHED &&
            p2.state !== PlayerState.BLOCKING &&
            p2.state !== PlayerState.BLOCKING_CROUCH &&
            p2.state !== PlayerState.BLOCKING_AIR
          ) {
            p2.velocity.x = p1.pos.x < p2.pos.x ? 12 : -12;
            p2.velocity.y = -4;
            p2.takeDamage(2);
            p2.state = PlayerState.HIT;
            p2.stunTimer = 15;
            this.particleManager.spawnHitSpark(
              p2.x + p2.width / 2,
              p2.y + p2.height / 2,
              false,
            );
          }
          const push = overlapX;
          if (p1.pos.x < p2.pos.x) p2.pos.x += push;
          else p2.pos.x -= push;
          specialRepelled = true;
        } else if (
          p2.comboType === "SPECIAL" &&
          p1.comboType !== "SPECIAL" &&
          p2.ataque
        ) {
          if (
            p1.state !== PlayerState.HIT &&
            p1.state !== PlayerState.LAUNCHED &&
            p1.state !== PlayerState.BLOCKING &&
            p1.state !== PlayerState.BLOCKING_CROUCH &&
            p1.state !== PlayerState.BLOCKING_AIR
          ) {
            p1.velocity.x = p2.pos.x < p1.pos.x ? 12 : -12;
            p1.velocity.y = -4;
            p1.takeDamage(2);
            p1.state = PlayerState.HIT;
            p1.stunTimer = 15;
            this.particleManager.spawnHitSpark(
              p1.x + p1.width / 2,
              p1.y + p1.height / 2,
              false,
            );
          }
          const push = overlapX;
          if (p2.pos.x < p1.pos.x) p1.pos.x += push;
          else p1.pos.x -= push;
          specialRepelled = true;
        }

        if (!specialRepelled) {
          const push = overlapX / 2;
          if (p1.pos.x < p2.pos.x) {
            p1.pos.x -= push;
            p2.pos.x += push;
          } else {
            p1.pos.x += push;
            p2.pos.x -= push;
          }
        }
      }
    }
  }

  public unfuseFusion(isP1: boolean, isDead: boolean) {
    const wasFused = isP1 ? this.p1FusionUsed : this.p2FusionUsed;
    if (!wasFused) return;

    let team = isP1 ? this.p1Team : this.p2Team;

    const gogetaIdx = team.findIndex(
      (p) =>
        p.data.id === "gogeta" ||
        p.data.id === "gogeta_ssj" ||
        p.data.id === "gogeta_blue",
    );
    if (gogetaIdx === -1) return;

    const gogeta = team[gogetaIdx];
    team.splice(gogetaIdx, 1); // Remove Gogeta

    const baseChars = BASE_CHARACTERS;
    const gokuData = baseChars.find((c) => c.id === "goku_ssj")!;
    const vegetaData = baseChars.find((c) => c.id === "vegeta_base")!;

    const goku = new Player(gogeta.x, gokuData, gogeta.facingRight);
    const vegeta = new Player(gogeta.x, vegetaData, gogeta.facingRight);

    goku.state = gogeta.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
    vegeta.state = gogeta.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;

    goku.y = gogeta.y;
    vegeta.y = gogeta.y;

    // Put vegeta to the side so they aren't on top of each other entirely
    vegeta.x = gogeta.x + (gogeta.facingRight ? -40 : 40);

    goku.teamState = gogeta.teamState;
    vegeta.teamState = gogeta.teamState;

    if (isDead) {
      goku.hp = 0;
      vegeta.hp = 0;
      goku.state = PlayerState.DEFEAT;
      vegeta.state = PlayerState.DEFEAT;
    } else {
      // Restore HP with tax (50% of damage taken by Gogeta)
      const gogetaMax = isP1 ? this.p1GogetaMaxHp : this.p2GogetaMaxHp;
      const damageTaken = Math.max(0, gogetaMax - gogeta.hp);
      const damageTax = Math.floor(damageTaken * 0.5);

      const gokuInitial = isP1
        ? this.p1GokuHpBeforeFusion
        : this.p2GokuHpBeforeFusion;
      const vegetaInitial = isP1
        ? this.p1VegetaHpBeforeFusion
        : this.p2VegetaHpBeforeFusion;

      goku.hp = Math.max(1, gokuInitial - damageTax);
      vegeta.hp = Math.max(1, vegetaInitial - damageTax);
      goku.state = PlayerState.STANDBY;
      vegeta.state = PlayerState.STANDBY;

      const initiatorId = isP1
        ? this.p1FusionInitiator
        : this.p2FusionInitiator;
      const activeChar = initiatorId === "vegeta_base" ? vegeta : goku;

      // Active player becomes the fusion initiator since Gogeta is gone and they survive
      activeChar.state = PlayerState.IDLE;
      if (isP1) {
        this.player1 = activeChar;
      } else {
        this.player2 = activeChar;
      }
    }

    // Insert back where Gogeta was
    team.splice(gogetaIdx, 0, goku, vegeta);

    const activeCharToIdx = isDead
      ? goku
      : isP1
        ? this.p1FusionInitiator === "vegeta_base"
          ? vegeta
          : goku
        : this.p2FusionInitiator === "vegeta_base"
          ? vegeta
          : goku;

    if (isP1) {
      this.p1ActiveIdx = isDead
        ? this.p1ActiveIdx
        : team.indexOf(activeCharToIdx);
      // If they died, player1 might need to be resolved by the tagging logic
      if (isDead) {
        this.player1 = activeCharToIdx; // Temporary, koSequence will tag in next alive player
      }
    } else {
      this.p2ActiveIdx = isDead
        ? this.p2ActiveIdx
        : team.indexOf(activeCharToIdx);
      if (isDead) {
        this.player2 = activeCharToIdx;
      }
    }
  }

  public emitGameState() {
    const debugInfo = this.isTraining
      ? {
          p1Pos: {
            x: Math.round(this.player1.x),
            y: Math.round(this.player1.y),
          },
          p2Pos: {
            x: Math.round(this.player2.x),
            y: Math.round(this.player2.y),
          },
          distance: Math.round(Math.abs(this.player1.x - this.player2.x)),
        }
      : undefined;

    const getAssistCost = (p: Player) => {
      const aType = p.data.assistType || "SPECIAL";
      const stateToTest = PlayerState.ATTACKING;
      const animKey =
        resolveAnimationKey(
          p.data.id,
          stateToTest,
          aType as any,
          undefined,
          true,
          undefined,
          undefined,
          50,
        ) || stateToTest;
      const currentAnim = p.data.spriteConfig?.animations?.[animKey];
      const hasBeam =
        currentAnim?.createsBeam ||
        p.data.spriteConfig?.animations?.["BEAM_START"] !== undefined ||
        p.data.spriteConfig?.animations?.["ATTACK_SPECIAL_LOOP"]
          ?.createsBeam !== undefined ||
        p.data.spriteConfig?.animations?.["SPECIAL_1_2"]
          ?.createsBeam !== undefined;
      return aType.startsWith("SPECIAL_") || hasBeam ? 200 : KI_BLAST_COST;
    };

    const mapToP1Stats = (p: Player) => ({
      hp: p.hp,
      maxHp: p.maxHp,
      combo: p.comboCount,
      guard: p.guard,
      maxGuard: MAX_GUARD,
      ki: p.ki,
      maxKi: MAX_KI,
      portraitUrl: p.data.spriteConfig?.portraitUrl,
      name: p.data.name,
      tagCooldown: this.p1TagCooldown,
      assistCooldown: p.assistCooldown,
      assistType: p.data.assistType,
      assistCost: getAssistCost(p),
    });

    const mapToP2Stats = (p: Player) => ({
      hp: p.hp,
      maxHp: p.maxHp,
      combo: p.comboCount,
      guard: p.guard,
      maxGuard: MAX_GUARD,
      ki: p.ki,
      maxKi: MAX_KI,
      portraitUrl: p.data.spriteConfig?.portraitUrl,
      name: p.data.name,
      tagCooldown: this.p2TagCooldown,
      assistCooldown: p.assistCooldown,
      assistType: p.data.assistType,
      assistCost: getAssistCost(p),
    });

    // Optimization: Throttle React state updates to 30 FPS instead of 60 FPS
    // We update every other frame unless it's a critical sequence
    const p1Dead = this.p1Team.every((p) => p.hp <= 0);
    const p2Dead = this.p2Team.every((p) => p.hp <= 0);
    const timeOut = this.gameTimer <= 0;

    // Phase Completion for Victory/Defeat animations
    let p1Done = true;
    let p2Done = true;
    
    if (p1Dead) {
      p1Done = (this.player1.state === PlayerState.DEFEAT && 
               ((this.player1 as any).customAnimFinishedThisFrame || this.player1.animFinished)) ||
               (this.player1 as any).stateDuration > 300;
    }
    if (p2Dead) {
      p2Done = (this.player2.state === PlayerState.DEFEAT && 
               ((this.player2 as any).customAnimFinishedThisFrame || this.player2.animFinished)) ||
               (this.player2 as any).stateDuration > 300;
    }
    
    // Check winner pose completion
    if (!p1Dead && p2Dead) {
      p1Done = (this.player1.state === PlayerState.VICTORY && 
               ((this.player1 as any).customAnimFinishedThisFrame || this.player1.animFinished)) ||
               (this.player1 as any).stateDuration > 300;
    } else if (p1Dead && !p2Dead) {
      p2Done = (this.player2.state === PlayerState.VICTORY && 
               ((this.player2 as any).customAnimFinishedThisFrame || this.player2.animFinished)) ||
               (this.player2 as any).stateDuration > 300;
    }

    const gameOver =
      (!this.isTraining || this.gameMode === "SUMMON") &&
      !this.koSequenceActive &&
      (timeOut || ((p1Dead || p2Dead) && p1Done && p2Done));

    if (this.frameCount % 2 === 0 || gameOver || this.isBeamClashActive) {
      const isUlting =
        this.player1.state === PlayerState.ULTIMATE ||
        this.player2.state === PlayerState.ULTIMATE ||
        this.player1.state === PlayerState.ULTIMATE_2 ||
        this.player2.state === PlayerState.ULTIMATE_2 ||
        this.player1.state === PlayerState.TRANSFORM ||
        this.player2.state === PlayerState.TRANSFORM ||
        this.player1.state === PlayerState.DETRANSFORM ||
        this.player2.state === PlayerState.DETRANSFORM ||
        this.player1.state === PlayerState.FUSION ||
        this.player2.state === PlayerState.FUSION ||
        this.player1.state === PlayerState.DEFUSION ||
        this.player2.state === PlayerState.DEFUSION;
      const isKOSwapActive = this.koSequenceActive || !!this.koDefeatedPlayer || this.player1.isKOTag || this.player2.isKOTag;
      let winner: 1 | 2 | null = null;
      if (!this.isTraining || this.gameMode === "SUMMON") {
        if (p1Dead) winner = 2;
        else if (p2Dead) winner = 1;
        else if (timeOut) {
          const p1TotalHp = this.p1Team.reduce((acc, p) => acc + p.hp, 0);
          const p2TotalHp = this.p2Team.reduce((acc, p) => acc + p.hp, 0);
          winner = p1TotalHp >= p2TotalHp ? 1 : 2;
        }
      }

      this.onGameStateChange({
        p1Stats: mapToP1Stats(this.player1),
        p2Stats: mapToP2Stats(this.player2),
        p1Team: this.p1Team.map(mapToP1Stats),
        p2Team: this.p2Team.map(mapToP2Stats),
        p1ActiveIdx: this.p1ActiveIdx,
        p2ActiveIdx: this.p2ActiveIdx,
        p1FusionTimer: Math.max(0, Math.ceil(this.p1GogetaTimer / 60)),
        p2FusionTimer: Math.max(0, Math.ceil(this.p2GogetaTimer / 60)),
        p1HeavyCooldown: this.player1.heavyCooldownTimer,
        p2HeavyCooldown: this.player2.heavyCooldownTimer,
        p1DashCooldown: this.player1.dashCooldownTimer,
        p1ProjectileCooldown: this.player1.projectileCooldown,
        p1DragonRushCooldown: this.player1.dragonRushCooldown,
        timer: Math.max(0, Math.ceil(this.gameTimer / 60)),
        introTimer: this.introTimer,
        introPhase: this.introPhase,
        introSubtitle:
          this.introPhase === IntroPhase.P1_INTRO
            ? this.player1.data.introText
            : this.introPhase === IntroPhase.P2_INTRO
              ? this.player2.data.introText
              : undefined,
        isLoading: false, // Never show loading mid-match to prevent FPS stutter
        isUlting: isUlting,
        isKOSwapActive: isKOSwapActive,
        koSequenceActive: this.koSequenceActive,
        gameOver: gameOver,
        winner: winner,
        debug: debugInfo,
        gameMode: this.gameMode,
        wave: this.wave,
        matchStats: this.matchStats,
        isBeamClashActive: this.isBeamClashActive,
        beamClashVisualProgress: this.beamClashVisualProgress,
        beamClashProgress: this.beamClashProgress,
        beamClashTimer: this.beamClashTimer,
        beamClashP1FacingRight: this.beamClashP1FacingRight,
      });
    }

    [this.player1, this.player2, ...this.p1Team, ...this.p2Team].forEach(
      (p) => {
        if (
          p.lastState === PlayerState.DASHING &&
          p.state !== PlayerState.DASHING &&
          p.state !== PlayerState.DASH_END
        ) {
          p.dashCooldownTimer = 0; // No cooldown
        }
        p.lastState = p.state;
      },
    );
  }

  public updateGameLogic() {
    // Dynamic Battle Dialogue System Tick
    try {
      const p1Dead = this.p1Team.every((p) => p.hp <= 0);
      const p2Dead = this.p2Team.every((p) => p.hp <= 0);
      const isGameOver = (!this.isTraining || this.gameMode === "SUMMON") && (this.gameTimer <= 0 || p1Dead || p2Dead);
      let winnerNum: number | null = null;
      if (isGameOver) {
        if (p1Dead) winnerNum = 2;
        else if (p2Dead) winnerNum = 1;
        else if (this.gameTimer <= 0) {
          const p1TotalHp = this.p1Team.reduce((acc, p) => acc + p.hp, 0);
          const p2TotalHp = this.p2Team.reduce((acc, p) => acc + p.hp, 0);
          winnerNum = p1TotalHp >= p2TotalHp ? 1 : 2;
        }
      }
      BattleStateManager.getInstance().tick(
        this.player1,
        this.player2,
        this.introPhase,
        this.isTraining,
        Math.ceil(this.gameTimer / 60),
        isGameOver,
        winnerNum
      );
    } catch (e) {
      console.warn("[SPEECH_DIAL] Tick Fail:", e);
    }

    // Check for Goku and Vegeta Fusion notifications
    try {
      this.checkFusionNotification();
    } catch (e) {
      console.warn("[FUSION_NOTIFY] Check Fail:", e);
    }

    if (this.player1.specialCancelled) {
      this.cancelSpecialOrUltimate(this.player1);
    }
    if (this.player2.specialCancelled) {
      this.cancelSpecialOrUltimate(this.player2);
    }

    this.updateUltimate(this.player1, this.player2);
    this.updateUltimate(this.player2, this.player1);

    MuiSpecialManager.updateSpecialSequence(this, this.player1, this.player2);
    MuiSpecialManager.updateSpecialSequence(this, this.player2, this.player1);

    if (this.p1GogetaTimer > 0) {
      this.p1GogetaTimer--;
    }
    if (
      this.p1FusionUsed &&
      this.p1GogetaTimer <= 0 &&
      this.player1.hp > 0 &&
      this.player1.state === PlayerState.IDLE &&
      this.player1.data.id.startsWith("gogeta")
    ) {
      const p = this.player1;
      p.state = PlayerState.DEFUSION;
      p.isDetransforming = true; // Use this as flag to indicate we go back to base
      p.comboStep = 0;
      p.attackTimer = 999;
      p.animFinished = false;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.invincibleTimer = 180;
      p.ataque = false;
      p.comboType = "LIGHT";
      p.comboStep = 0;
      p.nextTransformId = undefined;
    }

    if (this.p2GogetaTimer > 0) {
      this.p2GogetaTimer--;
    }
    if (
      this.p2FusionUsed &&
      this.p2GogetaTimer <= 0 &&
      this.player2.hp > 0 &&
      this.player2.state === PlayerState.IDLE &&
      this.player2.data.id.startsWith("gogeta")
    ) {
      const p = this.player2;
      p.state = PlayerState.DEFUSION;
      p.isDetransforming = true; // Use this as flag to indicate we go back to base
      p.comboStep = 0;
      p.attackTimer = 999;
      p.animFinished = false;
      p.velocity.x = 0;
      p.velocity.y = 0;
      p.invincibleTimer = 180;
      p.ataque = false;
      p.comboType = "LIGHT";
      p.comboStep = 0;
      p.nextTransformId = undefined;
    }

    const activeP1 = [
      this.player1,
      ...this.p1Team.filter((p) =>
        [
          PlayerState.ASSIST_ENTRY,
          PlayerState.ASSIST_ACTION,
          PlayerState.ASSIST_EXIT,
        ].includes(p.state),
      ),
    ];
    const activeP2 = [
      this.player2,
      ...this.p2Team.filter((p) =>
        [
          PlayerState.ASSIST_ENTRY,
          PlayerState.ASSIST_ACTION,
          PlayerState.ASSIST_EXIT,
        ].includes(p.state),
      ),
    ];

    for (const p1 of activeP1) {
      for (const p2 of activeP2) {
        const isClashing = ClashManager.checkClash(p1, p2, this);
        if (!isClashing) {
          // Try proactive MUI dodge first
          const dodged1 = this.checkProactiveMUIDodge(p2, p1);
          const dodged2 = this.checkProactiveMUIDodge(p1, p2);
          
          if (!dodged1) this.checkHit(p1, p2);
          if (!dodged2) this.checkHit(p2, p1);
        }
      }
    }

    // Auto-Tag on KO Sequence Logic
    const checkCanStartKOSequence = (player: Player) => {
      // Wait until player finishes their action (hit reaction, attack, or landing)
      return (
        player.isGrounded &&
        player.stunTimer <= 0 &&
        !player.ataque &&
        player.landingDelayTimer <= 0 &&
        player.state !== PlayerState.HIT &&
        (player.state !== PlayerState.KNOCKED_DOWN || player.hp <= 0) &&
        player.state !== PlayerState.LAUNCHED &&
        player.state !== PlayerState.ULTIMATE &&
        player.state !== PlayerState.TRANSFORM &&
        player.state !== PlayerState.DETRANSFORM &&
        player.state !== PlayerState.FUSION &&
        player.state !== PlayerState.DEFUSION
      );
    };

    if (this.koDefeatedPlayer) {
      if (this.koSequenceTimer > 0) {
        this.koSequenceTimer--;
      }

      if (this.koSequenceTimer <= 0 && this.koSequenceActive) {
        this.koSequenceActive = false;
      }

      const bothDone =
        checkCanStartKOSequence(this.player1) &&
        checkCanStartKOSequence(this.player2);

      // Wait for timer AND for characters to finish their actions
      if (this.koSequenceTimer <= 0 && bothDone) {
        if (
          this.koDefeatedPlayer === "p1" ||
          this.koDefeatedPlayer === "both"
        ) {
          if (
            this.player1.data.id === "gogeta" ||
            this.player1.data.id === "gogeta_ssj" ||
            this.player1.data.id === "gogeta_blue"
          )
            this.unfuseFusion(true, true);
          this.player1.state = PlayerState.DEFEAT;
        }
        if (
          this.koDefeatedPlayer === "p2" ||
          this.koDefeatedPlayer === "both"
        ) {
          if (
            this.player2.data.id === "gogeta" ||
            this.player2.data.id === "gogeta_ssj" ||
            this.player2.data.id === "gogeta_blue"
          )
            this.unfuseFusion(false, true);
          this.player2.state = PlayerState.DEFEAT;
        }

        if (
          this.koDefeatedPlayer === "p1" ||
          this.koDefeatedPlayer === "both"
        ) {
          if (this.p1Team.some((p) => p.hp > 0)) {
            this.p1TagCooldown = 0;
            this.tryTag(this.player1, false, true);
            this.player1.invincibleTimer += 60;
          } else if (this.isTraining) {
            this.p1Team.forEach((p) => {
              p.hp = p.maxHp;
              p.state = PlayerState.IDLE;
            });
            this.p1TagCooldown = 0;
            if (this.p1Team.length > 1) {
              this.tryTag(this.player1, false, true);
            } else {
              this.player1.state = PlayerState.IDLE;
            }
          }
        }
        if (
          this.koDefeatedPlayer === "p2" ||
          this.koDefeatedPlayer === "both"
        ) {
          if (this.p2Team.some((p) => p.hp > 0)) {
            this.p2TagCooldown = 0;
            this.tryTag(this.player2, false, true);
            this.player2.invincibleTimer += 60;
          } else if ((this.gameMode === "SURVIVAL" && this.wave < 7) || (this.gameMode === "BOSS" && this.wave < 3)) {
            this.wave++;

            // Heal P1 and active members based on wave
            this.p1Team.forEach((p) => {
              const healAmount = this.gameMode === "BOSS" ? p.maxHp * 0.25 : p.hp * 0.1; // 25% heal for Boss mode, 10% for survival
              if (p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + healAmount);
            });

            // Generate new enemies for next wave
            const availableChars = BASE_CHARACTERS.filter(c => c.id !== "random");
            const centerX = this.worldWidth / 2;
            const p2Start = centerX + SPAWN_CENTER_OFFSET - PLAYER_WIDTH / 2;
            const p2TeamState = { ki: 0, maxKi: MAX_KI };

            // Slightly increase AI difficulty or attributes over waves if needed
            const waveMod = this.gameMode === "BOSS" ? 0.2 * this.wave : Math.min(this.wave * 0.05, 0.5); 

            this.p2Team = this.p2Team.map((old) => {
              // Try not to repeat same character back to back
              let randomChar =
                availableChars[
                  Math.floor(Math.random() * availableChars.length)
                ];
              while (
                randomChar.id === old.data.id &&
                availableChars.length > 1
              ) {
                randomChar =
                  availableChars[
                    Math.floor(Math.random() * availableChars.length)
                  ];
              }

              const p = new Player(p2Start, randomChar, false);
              p.teamState = p2TeamState;
              
              if (this.gameMode === "BOSS") {
                p.hp = p.maxHp * 2.5;
                p.maxHp = p.hp;
                p.attackMult += 0.2;
                p.defenseMult = 0.8; // Stronger defense
              } else {
                // Buff stats for survival
                p.attackMult += waveMod;
                p.defenseMult = Math.min(0.5, p.defenseMult - waveMod * 0.5);
                p.speedMult += waveMod * 0.2;
              }
              return p;
            });

            this.p2Team.forEach((p, idx) => {
              if (idx > 0) p.state = PlayerState.STANDBY;
            });
            this.player2 = this.p2Team[0];
            this.p2ActiveIdx = 0;

            // Reset timer for survival
            this.gameTimer = Number.MAX_SAFE_INTEGER;

            // Show a dramatic entrance for new wave
            this.introPhase = IntroPhase.READY;
            this.fightAudioPlayed = false;
            BattleAnnouncerManager.getInstance().playReady();
            const readySec = AudioManager.getInstance().getSFXDuration("ready");
            const fightSec = AudioManager.getInstance().getSFXDuration("fight");
            const readyFrames = Math.ceil(readySec * 60);
            const fightFrames = Math.ceil(fightSec * 60);
            this.introTimer = readyFrames + fightFrames;
          } else if (this.isTraining) {
            this.p2Team.forEach((p) => {
              p.hp = p.maxHp;
              p.state = PlayerState.IDLE;
            });
            this.p2TagCooldown = 0;
            if (this.p2Team.length > 1) {
              this.tryTag(this.player2, false, true);
            } else {
              this.player2.state = PlayerState.IDLE;
            }
          }
        }

        this.koDefeatedPlayer = null;
      }
    }

    // Check for NEW KOs to trigger sequence
    if (!this.koDefeatedPlayer) {
      const p1JustDied =
        this.player1.hp <= 0 &&
        this.player1.state !== PlayerState.TAG_OUT &&
        this.player1.state !== PlayerState.DEFEAT;
      const p2JustDied =
        this.player2.hp <= 0 &&
        this.player2.state !== PlayerState.TAG_OUT &&
        this.player2.state !== PlayerState.DEFEAT;

      if (p1JustDied || p2JustDied) {
        if (p1JustDied && p2JustDied) {
          this.koDefeatedPlayer = "both";
        } else if (p1JustDied) {
          this.koDefeatedPlayer = "p1";
        } else if (p2JustDied) {
          this.koDefeatedPlayer = "p2";
        }

        if (this.gameMode !== "SUMMON") {
          this.koSequenceActive = true;
          AudioManager.getInstance().playSFX("ko");

          // Perfect Check: Did the winning player stay on maximum HP?
          let isPerfect = false;
          if (p1JustDied && !p2JustDied) {
            isPerfect = this.p2Team.every(p => p.hp >= p.maxHp);
          } else if (p2JustDied && !p1JustDied) {
            isPerfect = this.p1Team.every(p => p.hp >= p.maxHp);
          }
          if (isPerfect) {
            setTimeout(() => {
              BattleAnnouncerManager.getInstance().playPerfect();
            }, 1200);
          }

          const koSec = AudioManager.getInstance().getSFXDuration("ko");
          this.koSequenceTimer = Math.ceil(koSec * 60);
          this.camera.addScreenShake(40, 20, "PERLIN", 0.8);
        }
      }
    }

    if (this.isTraining) {
      if (this.trainingInfiniteHp) {
        // Heal fully if not in a combo or being hit
        const isNeutral = (p: Player) =>
          p.stunTimer <= 0 &&
          p.state !== PlayerState.HIT &&
          p.state !== PlayerState.KNOCKED_DOWN &&
          p.state !== PlayerState.LAUNCHED &&
          p.state !== PlayerState.DEFEAT &&
          !this.koSequenceActive;

        // Only heal living characters to prevent zombie bugs
        if (isNeutral(this.player1)) {
          this.p1Team.forEach((p) => {
            if (p.hp > 0 && p.hp < p.maxHp) p.hp = p.maxHp;
          });
        }
        if (isNeutral(this.player2)) {
          this.p2Team.forEach((p) => {
            if (p.hp > 0 && p.hp < p.maxHp) p.hp = p.maxHp;
          });
        }
      }

      if (this.trainingInfiniteKi) {
        // Always give full Ki and Guard in training mode
        this.player1.ki = MAX_KI;
        this.player2.ki = MAX_KI;
        this.player1.guard = MAX_GUARD;
        this.player2.guard = MAX_GUARD;
      }
    }

    this.emitGameState();
  }

  private checkFusionNotification() {
    // Player 1 Team check
    if (!this.p1FusionNotificationPlayed && !this.p1FusionUsed) {
      const goku = this.p1Team.find(m => m && m.data && m.data.id === "goku_ssj");
      const vegeta = this.p1Team.find(m => m && m.data && m.data.id === "vegeta_base");
      if (goku && vegeta && goku.hp > 0 && vegeta.hp > 0) {
        // Goku is active, Vegeta is in reserve (on bench)
        const isGokuActive = this.player1 === goku;
        const isVegetaInReserve = this.p1Team.indexOf(vegeta) !== this.p1ActiveIdx;
        const hasEnoughKi = goku.ki >= 400; // 4 bars de ki

        if (isGokuActive && isVegetaInReserve && hasEnoughKi && this.introPhase === IntroPhase.FIGHT) {
          this.p1FusionNotificationPlayed = true;
          this.playGokuFusionReadyVoice(1);
        }
      }
    }

    // Player 2 Team check
    if (!this.p2FusionNotificationPlayed && !this.p2FusionUsed) {
      const goku = this.p2Team.find(m => m && m.data && m.data.id === "goku_ssj");
      const vegeta = this.p2Team.find(m => m && m.data && m.data.id === "vegeta_base");
      if (goku && vegeta && goku.hp > 0 && vegeta.hp > 0) {
        // Goku is active, Vegeta is in reserve (on bench)
        const isGokuActive = this.player2 === goku;
        const isVegetaInReserve = this.p2Team.indexOf(vegeta) !== this.p2ActiveIdx;
        const hasEnoughKi = goku.ki >= 400; // 4 bars de ki

        if (isGokuActive && isVegetaInReserve && hasEnoughKi && this.introPhase === IntroPhase.FIGHT) {
          this.p2FusionNotificationPlayed = true;
          this.playGokuFusionReadyVoice(2);
        }
      }
    }
  }

  private playGokuFusionReadyVoice(playerNum: number) {
    const quote = {
      id: "gb_fusion_ready_notify",
      textPt: "Vegeta, são 30 minutos, não passa disso!",
      textEn: "Vegeta, it's 30 minutes, no more than that!",
      voiceKey: "/Assets/SONS/DUBLAGEM/GOKU%20BASE/VEGETA%20S%C3%83O%2030%20MINUTOS%20N%C3%83O%20PASSA%20DISSO.wav",
      priority: 5,
      rarity: "LEGENDARY" as const
    };

    // Play via dialog system
    const speakerId = "goku_ssj";
    const speakerName = "Goku";
    const emotion = "AGGRESSIVE" as any;
    VoiceQueue.getInstance().requestSpeech(speakerId, speakerName, quote, playerNum as (1 | 2), emotion);
  }

  public updateUltimate(p: Player, opp: Player) {
    UltimateManager.updateUltimate(this, p, opp);
  }

  public cancelSpecialOrUltimate(p: Player) {
    p.specialCancelled = false;

    try {
      const pNum = p === this.player1 ? 1 : 2;
      const opp = p === this.player1 ? this.player2 : this.player1;
      BattleStateManager.getInstance().reportAction(p, opp, BattleEvent.COMBO_CANCEL, pNum);
    } catch (e) {
      console.warn("[SPEECH_DIAL] Combo cancel report fail:", e);
    }

    // Force-deactivate only Beams and genkidamas belonging to this player
    const ownerId = p === this.player1 ? "p1" : "p2";
    this.projectiles.forEach((proj) => {
      if (proj.ownerId === ownerId || (proj as any).sourcePlayer === p) {
        const isGenkidama = proj.isGiantBlast || (proj.beamFamilyId && proj.beamFamilyId.includes("GENKIDAMA"));
        const isBeam = proj.isBeam || (proj.beamFamilyId && (
          proj.beamFamilyId.includes("BEAM") || 
          proj.beamFamilyId.includes("FECHO") || 
          proj.beamFamilyId.includes("CHAVE_BEAM") || 
          proj.beamFamilyId.includes("KAMEHAMEHA")
        ));
        if (isBeam || isGenkidama) {
          proj._isForceDeactivated = true;
          proj.active = false;
        }
      }
    });

    // Reset player's active state to hit reaction so they cannot continue execution of Special/Ultimate
    if (p.hp > 0 && p.state !== PlayerState.TAG_OUT && p.state !== PlayerState.TAG_IN) {
      p.state = PlayerState.HIT;
      p.stunTimer = 40; // Stun duration for hit
    }

    // Reset all move-timing and special-sequencing attributes
    p.ataque = false;
    p.comboType = "NONE";
    p.comboStep = 0;
    p.ultPhase = 0;
    p.ultTimer = 0;
    p.attackTimer = 0;
    p.animFinished = true;
    p.animTimer = 0;
    p.animFrame = 0;

    // Release opponent if they were held or frozen during the Special or Ultimate
    const opp = p === this.player1 ? this.player2 : this.player1;
    if (opp && (opp.state === PlayerState.HIT || opp.stunTimer > 20)) {
       opp.stunTimer = Math.min(opp.stunTimer, 20);
       opp.gravityDisabledTimer = 0;
    }
  }

  private handlePlayerDamageReceived(p: Player, amount: number) {
    if (amount <= 0) return;

    // Reset player's attacking/specials/combinations actions immediately
    p.ataque = false;
    p.comboType = "NONE";
    p.comboStep = 0;
    p.attackTimer = 0;
    p.specialCancelled = true;
    (p as any).hasSpawnedInSequence = undefined;
    (p as any).beamSpawned = undefined;

    // Transition state immediately to hit / stun
    if (p.hp > 0 && p.state !== PlayerState.TAG_IN && p.state !== PlayerState.TAG_OUT) {
      if (p.state !== PlayerState.HIT && p.state !== PlayerState.LAUNCHED && p.state !== PlayerState.KNOCKED_DOWN) {
        p.state = p.isGrounded ? PlayerState.HIT : PlayerState.LAUNCHED;
        p.stunTimer = Math.max(p.stunTimer || 0, 30); // assure stun
      }
    }

    // Krafting precise selective object destruction (only Beams and genkidamas)
    // "Destruindo objetos criados como beans e genkidamas apenas! Projéteis e ki blast não são destruídos caso receba dano"
    const ownerId = (p === this.player1 || this.p1Team.includes(p)) ? "p1" : "p2";
    this.projectiles.forEach((proj: any) => {
      const isOwner = proj.ownerId === ownerId || proj.sourcePlayer === p;
      if (isOwner && proj.active) {
        const isGenkidama = proj.isGiantBlast || (proj.beamFamilyId && proj.beamFamilyId.includes("GENKIDAMA"));
        const isBeam = proj.isBeam || (proj.beamFamilyId && (
          proj.beamFamilyId.includes("BEAM") || 
          proj.beamFamilyId.includes("FECHO") || 
          proj.beamFamilyId.includes("CHAVE_BEAM") || 
          proj.beamFamilyId.includes("KAMEHAMEHA")
        ));
        
        if (isBeam || isGenkidama) {
          proj.active = false;
        }
      }
    });

    // Handle end of Beam Clash if this player's active beam was destroyed
    if (this.isBeamClashActive) {
      const hasActiveBeam = this.projectiles.some(
        proj => (proj.ownerId === ownerId || proj.sourcePlayer === p) && proj.isBeam && proj.active
      );
      if (!hasActiveBeam) {
        this.isBeamClashActive = false;
        if (this.onBeamClashPointer) {
          window.removeEventListener('pointerdown', this.onBeamClashPointer);
          this.onBeamClashPointer = null;
        }
      }
    }
  }

  public updateAnimations(p: Player) {
    if (p.freezeTimer > 0) return; // Do not update animations while frozen

    // Fail-safe: deactivate huge Genkidama spheres if player state is no longer an Ultimate
    if (p.state !== PlayerState.ULTIMATE && p.state !== PlayerState.ULTIMATE_2) {
      const ownerId_ = p === this.player1 ? "p1" : "p2";
      const activeGenki = this.projectiles.find(
        (proj) => proj instanceof Genkidama && proj.ownerId === ownerId_ && proj.active
      ) as Genkidama | undefined;
      if (activeGenki) {
        if (activeGenki.baseProjectileId === "CHAVE_GENKIDAMA_7") {
          if (p.comboType !== "SPECIAL_2" || !p.ataque) {
            activeGenki.active = false;
          }
        } else {
          activeGenki.active = false;
        }
      }
    }

    if (
      p.state === PlayerState.HIT ||
      p.state === PlayerState.KNOCKED_DOWN ||
      p.state === PlayerState.LAUNCHED
    ) {
      p.isKOTag = false;
    }

    p.animTimer++;
    const config = p.data.spriteConfig;
    if (config && config.animations) {
      let animKey = resolveAnimationKey(
        p.data.id,
        p.state,
        p.comboType,
        p.comboStep,
        p.ataque,
        p.ultPhase,
        p.nextTransformId,
        p.attackTimer,
        p.ultType,
        p.isGrounded,
        p.isDetransforming,
        p.isKOTag,
        config,
        p.wasCrouching,
        p.stunTimer,
        p.superDashPhase,
        p.animFinished,
        (p as any).customSubphase,
        p.currentPhaseAnim || undefined,
        p.lastState
      );

      let anim = config.animations[animKey];
      if (!anim && animKey) {
        const lowerKey = animKey.toLowerCase();
        const normalizedLowerKey = lowerKey.startsWith("special") ? lowerKey.replace("special", "especial") : (lowerKey.startsWith("especial") ? lowerKey.replace("especial", "special") : lowerKey);
        const foundKey = Object.keys(config.animations).find(
          (k) => {
            const kl = k.toLowerCase();
            return kl === lowerKey || kl === normalizedLowerKey;
          }
        );
        if (foundKey) {
          anim = config.animations[foundKey];
          animKey = foundKey;
        }
      }

      if (!anim && animKey === "TAG_ATTACK") {
        anim = config.animations["ATTACK_HEAVY"];
        animKey = "ATTACK_HEAVY";
      }

      if (!anim && p.state === PlayerState.TAG_OUT) {
        if (p.hp <= 0) {
          animKey = PlayerState.DEFEAT;
          anim = config.animations[PlayerState.DEFEAT];
        } else {
          anim =
            config.animations[PlayerState.VANISH] ||
            config.animations[PlayerState.DASHING];
          animKey = config.animations[PlayerState.VANISH]
            ? PlayerState.VANISH
            : PlayerState.DASHING;
        }
      }

      if (
        !anim &&
        (p.state === PlayerState.ASSIST_ENTRY ||
          p.state === PlayerState.ASSIST_EXIT ||
          p.state === PlayerState.TAG_IN)
      ) {
        anim = config.animations[PlayerState.DASHING];
        animKey = PlayerState.DASHING;
      }
      if (!anim && p.state === PlayerState.ASSIST_ACTION) {
        anim =
          config.animations["ATTACK_SPECIAL"] ||
          config.animations[PlayerState.ATTACKING];
        animKey = config.animations["ATTACK_SPECIAL"]
          ? "ATTACK_SPECIAL"
          : PlayerState.ATTACKING;
      }

      if (
        !anim &&
        (p.state === PlayerState.DASH_START ||
          p.state === PlayerState.DASH_END ||
          p.state === PlayerState.SUPER_DASH ||
          p.state === PlayerState.VANISH ||
          p.state === PlayerState.VANISH_APPEAR ||
          animKey === "TAG_IN_KO")
      ) {
        anim = config.animations[PlayerState.DASHING];
        animKey = PlayerState.DASHING;
      }
      if (!anim && p.state === PlayerState.DRAGON_DASH_FOLLOW) {
        anim =
          config.animations["dragon_rush_3"] ||
          config.animations["DRAGON_RUSH_3"] ||
          config.animations[PlayerState.DRAGON_DASH_FOLLOW];
        animKey = "dragon_rush_3";
      }
      if (!anim && p.state === PlayerState.DRAGON_COMBO) {
        anim =
          (p.comboStep === 1 ? config.animations["dragon_rush_3"] : config.animations["dragon_rush_2"]) ||
          config.animations["DRAGON_RUSH_2"] ||
          config.animations[PlayerState.DRAGON_COMBO];
        animKey = p.comboStep === 1 ? "dragon_rush_3" : "dragon_rush_2";
      }
      if (!anim && p.state === PlayerState.DRAGON_RUSH) {
        anim =
          config.animations["dragon_rush_1"] ||
          config.animations["DRAGON_RUSH_1"] ||
          config.animations[PlayerState.DRAGON_RUSH];
        animKey = "dragon_rush_1";
      }
      if (!anim && p.state === PlayerState.QUICK_DASH) {
        anim =
          config.animations[PlayerState.QUICK_DASH] ||
          config.animations["DOUBLE_TAP"] ||
          config.animations[PlayerState.DASHING] ||
          config.animations[PlayerState.RUNNING];
        animKey = config.animations[PlayerState.QUICK_DASH]
          ? PlayerState.QUICK_DASH
          : config.animations["DOUBLE_TAP"]
          ? "DOUBLE_TAP"
          : config.animations[PlayerState.DASHING]
          ? PlayerState.DASHING
          : PlayerState.RUNNING;
      }
      if (!anim && p.state === PlayerState.DASHING) {
        anim = config.animations[PlayerState.RUNNING];
        animKey = PlayerState.RUNNING;
      }

      if (!anim && p.state === PlayerState.JUMP_ATTACK) {
        anim =
          config.animations[`ATTACK_JUMP`] ||
          config.animations[PlayerState.ATTACKING];
        animKey = config.animations[`ATTACK_JUMP`]
          ? `ATTACK_JUMP`
          : PlayerState.ATTACKING;
      }

      if (!anim && p.state === PlayerState.CROUCH_ATTACK) {
        anim =
          config.animations[`ATTACK_CROUCH`] ||
          config.animations[PlayerState.ATTACKING];
        animKey = config.animations[`ATTACK_CROUCH`]
          ? `ATTACK_CROUCH`
          : PlayerState.ATTACKING;
      }

      if (
        !anim &&
        (p.state === PlayerState.STUNNED || p.state === PlayerState.GUARD_BREAK)
      ) {
        anim =
          config.animations[PlayerState.HIT] ||
          config.animations[PlayerState.IDLE];
        animKey = config.animations[PlayerState.HIT]
          ? PlayerState.HIT
          : PlayerState.IDLE;
      }

      if (
        !anim &&
        (p.state === PlayerState.FALLING || p.state === PlayerState.JUMPING)
      ) {
        anim =
          config.animations[PlayerState.JUMPING] ||
          config.animations[PlayerState.DASHING] ||
          config.animations[PlayerState.IDLE];
        animKey = config.animations[PlayerState.JUMPING]
          ? PlayerState.JUMPING
          : config.animations[PlayerState.DASHING]
            ? PlayerState.DASHING
            : PlayerState.IDLE;
      }

      if (!anim) {
        anim = config.animations[PlayerState.IDLE];
        animKey = PlayerState.IDLE;
      }

      // Track animation delay to pre-play audios 2 frames before animation start
      if (animKey !== p.lastAnimKey) {
        if (p.lastAnimKey && !p.animDelayActive) {
          p.animDelayActive = true;
          p.animDelayTargetKey = animKey;
          p.animDelayTimer = 2; // Keep drawing the old animation for 2 frames
          p.animDelayTargetAnimObj = anim;
        }
      }

      if (p.animDelayActive) {
        p.animDelayTimer--;
        // Override animKey and anim to hold/continue drawing the old animation
        if (p.lastAnimKey) {
          animKey = p.lastAnimKey;
          anim = config.animations[animKey] || config.animations[PlayerState.IDLE];
        }
        if (p.animDelayTimer <= 0) {
          p.animDelayActive = false;
          // Apply the new animation key switch now
          p.animFrame = 0;
          p.animTimer = 0;
          p.lastAnimKey = p.animDelayTargetKey;
          p.animFinished = false;
          animKey = p.animDelayTargetKey;
          anim = p.animDelayTargetAnimObj;
        }
      } else {
        if (animKey !== p.lastAnimKey) {
          p.animFrame = 0;
          p.animTimer = 0;
          p.lastAnimKey = animKey;
          p.animFinished = false;
        }
      }

      if (anim) {
        // Force dragon rush animations to be non-looping
        const lowerKey = animKey.toLowerCase();
        const isDragonRushKey = lowerKey.includes("dragon_rush") || lowerKey.includes("dragon_dash");
        const isDragonRushState = 
          p.state === PlayerState.DRAGON_RUSH || 
          p.state === PlayerState.DRAGON_COMBO || 
          p.state === PlayerState.DRAGON_DASH_FOLLOW;
        
        if (isDragonRushKey || isDragonRushState) {
          anim.loop = false;
        }

        let isLoaded = true;

        anim.frames = FrameManager.getInstance().getFrameCount(anim);
        if (anim.isGif) {
          const gifFrames = this.animationManager.getGifFrameCount(
            anim.imageUrl,
          );
          if (gifFrames <= 0) isLoaded = false;
        }

        if (isLoaded) {
          // Implement freezeFrame
          const isHitStunned =
            (p.state === PlayerState.HIT ||
              p.state === PlayerState.STUNNED ||
              p.state === PlayerState.GUARD_BREAK) &&
            p.stunTimer > 0;

          const isDragonDashFreeze =
            (p.state === PlayerState.DRAGON_RUSH && (p.comboStep === 1 || p.comboStep === 2)) ||
            (p.state === PlayerState.DRAGON_DASH_FOLLOW);

          const isGokuBlackRoseIntro1Freeze =
            p.data.id === "goku_black_rose" &&
            p.state === PlayerState.INTRO &&
            p.ultPhase === 1 &&
            p.animFrame >= anim.frames - 1 &&
            p.pos.y < (WORLD_HEIGHT - this.groundY);

          const isFriezaUlt1Freeze =
            p.data.id === "frieza_final" &&
            p.state === PlayerState.ULTIMATE &&
            p.ultType === 1 &&
            p.ultPhase >= 3 &&
            p.animFrame >= anim.frames - 1;

          const isGokuBaseUlt2Freeze =
            (p.data.id === "goku_base" || p.data.id === "goku_base_swl" || p.data.id === "goku_base_swl_removed") &&
            p.state === PlayerState.ULTIMATE &&
            p.ultType === 2 &&
            p.ultPhase >= 5 &&
            p.animFrame >= anim.frames - 1;

          const isFallingFreeze = 
            (p.state === PlayerState.FALLING || p.state === PlayerState.FALLING_HIT) &&
            p.animFrame >= anim.frames - 1 &&
            !p.isGrounded;

          const shouldFreeze =
            (anim.freezeFrame !== undefined &&
              p.animFrame === anim.freezeFrame) ||
            isHitStunned ||
            isDragonDashFreeze ||
            isFallingFreeze ||
            isGokuBlackRoseIntro1Freeze ||
            isFriezaUlt1Freeze ||
            isGokuBaseUlt2Freeze ||
            (!!(p as any).beamSpawned && p.animFrame >= anim.frames - 1);

          let frameSpeed = anim.speed ?? ANIMATION_SPEED;
          const fmDelay = FrameManager.getInstance().getFrameDelay(
            anim,
            p.animFrame,
          );
          if (fmDelay > 0) {
            frameSpeed = fmDelay;
          }

          if (!shouldFreeze && p.animTimer >= frameSpeed) {
            p.animTimer = 0;
            if (!p.animFinished || anim.loop !== false) {
              p.animFrame++;

              // To prevent non-looping attacks from snapping to IDLE instantly when they reach their last frame,
              // we add extra visual frame cycles for the last frame (a recovery buffer).
              // For basic attacks (LIGHT, MEDIUM, HEAVY) or very short animations, we keep it 0 to avoid freezing.
              const isBasicAttack = p.comboType === "LIGHT" || p.comboType === "MEDIUM" || p.comboType === "HEAVY";
              const isShortAnim = anim.frames <= 2;
              const recoveryBuffer = (isShortAnim || isBasicAttack) ? 0 : 3;

              const finishBound =
                anim.loop !== false
                  ? anim.frames
                  : anim.frames + recoveryBuffer;

              if (p.animFrame >= finishBound) {
                p.animFrame = anim.loop !== false ? 0 : anim.frames - 1;
                p.animFinished = true;
                (p as any).customAnimFinishedThisFrame = true;
                (p as any).animFinishedFrameCount = (this.frameCount || 0);
              } else {
                if (anim.loop !== false) p.animFinished = false;
              }
            }
          }
        }

        // --- MOMENT-OF-CREATION VFX SYSTEM (effectConfigKey) ---
        const ownerId = p === this.player1 ? "p1" : "p2";
        const currentAnimKey = p.lastAnimKey || p.state;
        if ((p as any).lastTrackedAnimKey !== currentAnimKey) {
          (p as any).lastTrackedAnimKey = currentAnimKey;
          (p as any).effectSpawnedForCurrentAnim = false;
        }

        if (anim && anim.effectConfigKey && !(p as any).effectSpawnedForCurrentAnim) {
          (p as any).effectSpawnedForCurrentAnim = true;
          const configKey = anim.effectConfigKey;
          const resolved = EffectConfigKeyManager.getInstance().getEffect(configKey);
          if (resolved) {
            const baseEffectId = resolved.baseEffectId || configKey;
            
            // CRITICAL: EFFECT_TELACHEIA_05 / EFEITO_TELAQUEIA_05 can ONLY be spawned during beam clash cinematic, NOT by the character!
            if (
              baseEffectId === "EFFECT_TELACHEIA_05" || 
              baseEffectId === "EFEITO_TELAQUEIA_05" ||
              baseEffectId.includes("TELACHEIA_05") || 
              baseEffectId.includes("TELAQUEIA_05") || 
              configKey.includes("TELACHEIA_05") || 
              configKey.includes("TELAQUEIA_05") ||
              configKey === "CHAVE_EFFECT_TELACHEIA_05_VERDE" ||
              configKey === "CHAVE_EFFECT_TELACHEIA_05_AZUL"
            ) {
              // Skip spawning here completely!
            } else {
              const effectUrl = resolved.imageUrl || (DEFAULT_EFFECTS as any)[baseEffectId] || "";
              if (effectUrl) {
                const frames = resolved.frames ?? 10;
                const loop = resolved.loop ?? false;
                const scale = resolved.scale ?? 1.5;
                const speed = resolved.speed ?? 4;

                const isFullScreen = 
                  baseEffectId.toUpperCase().includes("TELACHEIA") || 
                  (resolved.name && resolved.name.toUpperCase().includes("TELACHEIA")) || 
                  configKey.toUpperCase().includes("TELACHEIA") ||
                  (effectUrl && effectUrl.toUpperCase().includes("TELACHEIA"));
                let effX = p.x + p.width / 2;
                let effY = p.y + p.height / 2;

                if (isFullScreen) {
                  effX = this.worldWidth / 2;
                  effY = WORLD_HEIGHT - this.groundY - 150;
                }

                this.spawnVisualEffect(
                  isFullScreen ? "FULL_SCREEN_DUST" : "ANIMATION_EFFECT",
                  effX,
                  effY,
                  effectUrl,
                  frames,
                  loop,
                  ownerId,
                  scale,
                  p.facingRight,
                  configKey,
                  speed,
                  resolved.frameWidth,
                  resolved.frameHeight,
                  resolved.isGif
                );
              }
            }
          }
        }
      }
    } else {
      if (p.animTimer >= ANIMATION_SPEED) {
        p.animTimer = 0;
        p.animFrame++;
        if (p.animFrame >= 6) {
          p.animFrame = 0;
          p.animFinished = true;
        }
      }
    }
  }

  public checkProactiveMUIDodge(attacker: Player, defender: Player): boolean {
    if (!attacker || !defender) return false;
    if (defender.data.id !== "goku_mui") return false;
    if (defender.invincibleTimer > 0) return false;
    
    // Valid states for MUI dodge: strictly grounded and not currently acting
    const canDodge = defender.isGrounded &&
      (defender.state === PlayerState.IDLE ||
        defender.state === PlayerState.RUNNING ||
        defender.state === PlayerState.WALK_BACKWARD ||
        defender.state === PlayerState.CROUCH ||
        defender.state === PlayerState.LANDING ||
        defender.state === PlayerState.BLOCKING ||
        defender.state === PlayerState.BLOCKING_CROUCH) &&
      defender.velocity.y === 0;
      
    if (!canDodge) return false;

    // Is attacker actually in an attack state?
    const isAttacking = (
      attacker.state === PlayerState.ATTACKING ||
      attacker.state === PlayerState.JUMP_ATTACK ||
      attacker.state === PlayerState.CROUCH_ATTACK ||
      (attacker.state === PlayerState.SUPER_DASH && attacker.superDashPhase === 2) ||
      attacker.state === PlayerState.DRAGON_RUSH
    );
    
    if (!isAttacking) return false;

    // Check proximity (user requested proactive dodge without hitbox collision)
    const dx = Math.abs(attacker.pos.x - defender.pos.x);
    const dy = Math.abs(attacker.pos.y - defender.pos.y);
    
    // Proximity threshold: exactly 2px between edges (dx between centers <= 102)
    // User requested that dodge only activates if opponent is VERY close.
    if (dx <= 102 && dy < 120) {
      // Check if attacker is facing the defender
      const isFacing = (attacker.facingRight && defender.pos.x > attacker.pos.x) ||
                      (!attacker.facingRight && defender.pos.x < attacker.pos.x);
      
      if (isFacing) {
        // Types of attacks Goku MUI can proactively dodge
        const isDodgeableAttack = 
          attacker.comboType === "LIGHT" || 
          attacker.comboType === "MEDIUM" || 
          attacker.state === PlayerState.DRAGON_RUSH || 
          (attacker.state === PlayerState.SUPER_DASH && attacker.superDashPhase === 2) ||
          (attacker.state === PlayerState.ATTACKING && attacker.attackTimer > 0);

        if (isDodgeableAttack) {
          // MUI Dodge Trigger
          defender.state = PlayerState.MUI_DODGE;
          defender.invincibleTimer = 45; 
          defender.animFrame = 0;
          defender.animTimer = 0;
          defender.animFinished = false;

          // Store the dodge direction: slide BEHIND the attacker (opposite of attacker's facing direction)
          const dodgeDir = attacker.facingRight ? -1 : 1;
          (defender as any)["muiDodgeDir"] = dodgeDir;
          
          defender.velocity.x = 0; 
          // Defender faces the attacker
          defender.facingRight = attacker.pos.x > defender.pos.x; 

          // Apply Zoom-in during dodge
          this.camera.focusOn(defender, 1.7, false, false);

          try {
            AudioManager.getInstance().playSFX("cancel");
          } catch(e) {}

          // Freeze the attacker briefly to emphasize the dodge
          attacker.freezeTimer = 25; 
          
          return true;
        }
      }
    }
    
    return false;
  }

  public checkHit(attacker: Player, defender: Player) {
    if (!attacker || !defender) return;
    if (defender.invincibleTimer > 0) return;
    if (attacker.currentPhasedMove) return; // MoveManager handles phased moves independently
    if (
      defender.state === PlayerState.DEFEAT ||
      defender.state === PlayerState.TAG_IN ||
      defender.state === PlayerState.TAG_OUT
    )
      return;

    // Characters do not deal standard body contact damage in Ultimates or specials!
    // Only the Beams, Projectiles, and custom sequential state structures should deal damage.
    const attackAnimKey = attacker.lastAnimKey || attacker.state;
    const isSpecial1 = 
      (attacker.comboType as any) === "SPECIAL" || 
      (attacker.comboType as any) === "SPECIAL_1" || 
      (attacker.comboType && typeof attacker.comboType === "string" && (
        (attacker.comboType as any) === "SPECIAL" || 
        attacker.comboType.startsWith("SPECIAL_1") || 
        attacker.comboType.startsWith("ESPECIAL_1") ||
        attacker.comboType.startsWith("Especial_1")
      )) ||
      (typeof attackAnimKey === "string" && (
        attackAnimKey.startsWith("SPECIAL_1") || 
        attackAnimKey.startsWith("ESPECIAL_1") || 
        attackAnimKey.startsWith("Especial_1") ||
        attackAnimKey.startsWith("ATTACK_SPECIAL")
      ));

    const isSpecialOrUlt =
      isSpecial1 ||
      attacker.state === PlayerState.ULTIMATE ||
      attacker.state === PlayerState.ULTIMATE_2 ||
      attacker.state === PlayerState.DRAGON_RUSH ||
      attacker.state === PlayerState.DRAGON_COMBO ||
      attacker.state === PlayerState.DRAGON_DASH_FOLLOW ||
      (attacker.comboType && typeof attacker.comboType === "string" && (attacker.comboType.startsWith("SPECIAL") || attacker.comboType.includes("SPECIAL")));
    if (isSpecialOrUlt) {
      return;
    }

    let activeFrame = false;
    let activeBoxesToTest: Rect[] = [];

    // Check custom damageFrames
    const config = attacker.data.spriteConfig;
    const animKey = attacker.lastAnimKey || attacker.state;
    const anim = config?.animations[animKey];

    const hAtk = attacker.hitbox;
    const hDef = defender.hitbox;

    if (
      (attacker.state === PlayerState.SUPER_DASH &&
        attacker.superDashPhase === 2) ||
      (attacker.state === PlayerState.DRAGON_RUSH && attacker.comboStep === 1)
    ) {
      // Utilizar a hitbox do personagem para detectar contato direto nestes modos
      if (CollisionHelper.testAABB(hAtk, hDef)) {
        activeFrame = true;
        activeBoxesToTest.push(hAtk); // Usar a própria hitbox como área de teste
      } else {
        activeFrame = false;
      }
    } else if (String(anim?.dealsDamage) === "false") {
      activeFrame = false;
    } else {
      const isBasicAttack = 
        attacker.comboType === "LIGHT" || 
        attacker.comboType === "MEDIUM" || 
        attacker.comboType === "HEAVY";
      
      const totalFrames = anim?.frames || 6;
      const isLastTwoFrames = attacker.animFrame >= totalFrames - 2;
      
      if (isBasicAttack) {
        // Regra do Usuário: Todas os ataques básicos criam as suas hitbox nos 2 últimos frames da animação
        if (isLastTwoFrames && attacker["lastHitFrame"] !== attacker.animFrame) {
          activeFrame = true;
          // Note: We do NOT reset hasHit here if it's already true, 
          // because basic attacks should hit only once.
          attacker["lastHitFrame"] = attacker.animFrame;
        } else {
          activeFrame = false;
        }
      } else if (anim?.attackBoxes && anim.attackBoxes.length > 0) {
        const anyActive = anim.attackBoxes.some(
          (box) =>
            !box.damageFrames ||
            box.damageFrames.length === 0 ||
            box.damageFrames.includes(attacker.animFrame),
        );
        if (anyActive && attacker["lastHitFrame"] !== attacker.animFrame) {
          activeFrame = true;
          if (!attacker.hasHit) attacker.hasHit = false; // Solo reset if not hit yet or for multi-hits
          attacker["lastHitFrame"] = attacker.animFrame;
        } else {
          activeFrame = false;
        }
      } else if (anim?.damageFrames && anim.damageFrames.length > 0) {
        const isDamageFrame = anim.damageFrames.includes(attacker.animFrame);
        if (isDamageFrame && attacker["lastHitFrame"] !== attacker.animFrame) {
          activeFrame = true;
          if (!attacker.hasHit) attacker.hasHit = false;
          attacker["lastHitFrame"] = attacker.animFrame;
        } else {
          activeFrame = false;
        }
      } else {
        attacker["lastHitFrame"] = undefined;
        const targetFrame = Math.floor(totalFrames * 0.35);
        if (attacker.animFrame === targetFrame) {
          activeFrame = true;
        }
      }

      // Populate activeBoxesToTest if frame is active
      if (activeFrame) {
        if (anim?.attackBoxes && anim.attackBoxes.length > 0) {
           anim.attackBoxes.forEach((box) => {
            const isBoxActive = isBasicAttack 
                ? isLastTwoFrames 
                : (!box.damageFrames || box.damageFrames.length === 0 || box.damageFrames.includes(attacker.animFrame));

            if (isBoxActive) {
              const aW = box.width;
              const aH = box.height;
              const aXOff = box.offsetX;
              const aYOff = box.offsetY;
              const defaultX = attacker.facingRight
                ? hAtk.x + hAtk.width
                : hAtk.x - aW;
              const customX = attacker.facingRight
                ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
                : hAtk.x +
                  hAtk.width -
                  (aXOff !== undefined ? aXOff : hAtk.width) -
                  aW;
              activeBoxesToTest.push({
                x: aXOff !== undefined ? customX : defaultX,
                y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
                width: aW,
                height: aH,
              });
            }
          });
        } else {
          const aW = anim?.attackBoxWidth ?? ATTACK_WIDTH;
          const aH = anim?.attackBoxHeight ?? ATTACK_HEIGHT;
          const aXOff = anim?.attackBoxOffsetX ?? ATTACK_OFFSET_X;
          const aYOff = anim?.attackBoxOffsetY ?? ATTACK_OFFSET_Y;
          const defaultX = attacker.facingRight
            ? hAtk.x + hAtk.width
            : hAtk.x - aW;
          const customX = attacker.facingRight
            ? hAtk.x + (aXOff !== undefined ? aXOff : hAtk.width)
            : hAtk.x +
              hAtk.width -
              (aXOff !== undefined ? aXOff : hAtk.width) -
              aW;
          activeBoxesToTest.push({
            x: aXOff !== undefined ? customX : defaultX,
            y: hAtk.y + (aYOff !== undefined ? aYOff : hAtk.height * 0.3),
            width: aW,
            height: aH,
          });
        }
      }
    }

    if (
      (attacker.state === PlayerState.ATTACKING ||
        attacker.state === PlayerState.JUMP_ATTACK ||
        attacker.state === PlayerState.CROUCH_ATTACK ||
        attacker.state === PlayerState.SUPER_DASH ||
        attacker.state === PlayerState.DRAGON_RUSH) &&
      activeFrame &&
      activeBoxesToTest.length > 0
    ) {
      if (attacker.hasHit) return;

      let hittingBox: Rect | null = null;
      for (const attackBox of activeBoxesToTest) {
        if (
          attackBox.x < hDef.x + hDef.width &&
          attackBox.x + attackBox.width > hDef.x &&
          attackBox.y < hDef.y + hDef.height &&
          attackBox.y + attackBox.height > hDef.y
        ) {
          hittingBox = attackBox;
          break;
        }
      }

      if (hittingBox) {
        attacker.hasHit = true;
        // Multiplicador de dano dinâmico baseado no contador de combos atual (ComboCount) - Máximo de 10%
        const comboBonus = Math.min(0.10, attacker.comboCount * 0.01);
        attacker.comboCount++;
        // Ganho de ki combando
        attacker.ki = Math.min(
          MAX_KI,
          attacker.ki + KI_GAIN_ON_HIT + attacker.comboCount * 5,
        );
        let damage =
          anim?.baseDamage !== undefined ? anim.baseDamage : DAMAGE_TIER_1;
        let knockX = 2;
        let knockY = 0;
        let isFinisher = false;
        if (attacker.comboType === "LIGHT") {
          if (anim?.baseDamage === undefined) damage = DAMAGE_TIER_1;
          if (attacker.comboStep === 2) {
            if (anim?.baseDamage === undefined) damage = DAMAGE_TIER_2;
            if (attacker.state === PlayerState.JUMP_ATTACK) {
              knockX = 2;
              knockY = -40; // Smash straight down
            } else {
              knockX = KNOCKBACK_FINISHER_X;
              knockY = KNOCKBACK_FINISHER_Y;
            }
            isFinisher = true;
          }
        } else if (attacker.comboType === "MEDIUM") {
          if (anim?.baseDamage === undefined) damage = DAMAGE_TIER_2;
          if (attacker.comboStep === 2) {
            if (anim?.baseDamage === undefined) damage = DAMAGE_TIER_2 * 1.5;
            if (attacker.state === PlayerState.JUMP_ATTACK) {
              knockX = 2;
              knockY = -40; // Smash straight down
            } else {
              knockX = KNOCKBACK_FINISHER_X;
              knockY = KNOCKBACK_FINISHER_Y;
            }
            isFinisher = true;
          }
        } else if (attacker.comboType === "HEAVY") {
          if (anim?.baseDamage === undefined) damage = DAMAGE_TIER_3;
          if (attacker.state === PlayerState.CROUCH_ATTACK) {
            knockX = 0; // Keep them straight above for jump cancel
            knockY = 22; // Launch them high!
            defender.isGrounded = false;
          } else if (attacker.state === PlayerState.JUMP_ATTACK) {
            knockX = 2;
            knockY = -40; // Slam down!
          } else {
            knockX = KNOCKBACK_FINISHER_X * 1.5;
            knockY = 5;
          }
          isFinisher = true;
        }

        // Calculate collision point based on overlap of attack box and defender hitbox
        const intersectX = Math.max(hittingBox.x, hDef.x);
        const intersectWidth = Math.min(hittingBox.x + hittingBox.width, hDef.x + hDef.width) - intersectX;
        const hitX = intersectX + intersectWidth / 2;
        
        const intersectY = Math.max(hittingBox.y, hDef.y);
        const intersectHeight = Math.min(hittingBox.y + hittingBox.height, hDef.y + hDef.height) - intersectY;
        const hitY = intersectY + intersectHeight / 2;

        // Suspend them during air combos so they don't fall out of reach
        if (
          !attacker.isGrounded &&
          attacker.state === PlayerState.JUMP_ATTACK &&
          !isFinisher
        ) {
          knockX = 0;
          knockY = 0;
          attacker.velocity.x = 0;
          attacker.velocity.y = 0;
          attacker.gravityDisabledTimer = 30;
          defender.gravityDisabledTimer = 30;
          defender.velocity.x = 0;
          defender.velocity.y = 0;
        }

        let wasDragonRush = false;
        if (attacker.state === PlayerState.SUPER_DASH) {
          damage = DAMAGE_TIER_1;
          
          if (defender.state === PlayerState.SUPER_DASH) {
            // BOTH are in Super Dash: Trigger a Clash Launch (like Tag In clash)
            const throwVy = -15;
            const throwVx = 10;

            attacker.state = PlayerState.LAUNCHED;
            attacker.isGrounded = false;
            attacker.ataque = false;
            attacker.velocity.y = throwVy;
            attacker.velocity.x = attacker.facingRight ? -throwVx : throwVx; // Thrown BACKWARDS

            defender.state = PlayerState.LAUNCHED;
            defender.isGrounded = false;
            defender.ataque = false;
            defender.velocity.y = throwVy;
            defender.velocity.x = defender.facingRight ? -throwVx : throwVx; // Thrown BACKWARDS

            this.camera.addScreenShake(15, 12, "IMPULSE", 1.5);
            this.particleManager.spawnHitSpark(hitX, hitY, true);
            
            try {
              AudioManager.getInstance().playSFX("clash");
            } catch (e) {}

            return; // Exit checkHit as it's a clash resolution
          }

          const launchVy = -15;
          const launchVx = attacker.facingRight ? 5 : -5;
          
          attacker.state = PlayerState.JUMPING; // Transition to jumping state to allow air combos
          attacker.velocity.x = launchVx;
          attacker.velocity.y = launchVy;
          attacker.isGrounded = false;
          attacker.gravityDisabledTimer = 0; 
          attacker.comboWindow = 35; 
          attacker.airComboUsed = false; 

          defender.state = PlayerState.HIT;
          defender.velocity.x = attacker.facingRight ? 2 : -2;
          defender.velocity.y = launchVy;
          defender.isGrounded = false;
          defender.stunTimer = 45; 
          defender.gravityDisabledTimer = 0;

          this.camera.addScreenShake(12, 10, "IMPULSE", 1);
          this.particleManager.spawnHitSpark(hitX, hitY, true);
        } else if (attacker.state === PlayerState.DRAGON_RUSH) {
          // Check for Tech (Escape)
          const oppInput =
            defender === this.player1
              ? this.currentP1Input
              : this.currentP2Input;
          // Tech by matching Dragon Rush input
          if (
            oppInput &&
            (oppInput.dragonRush || (oppInput.light && oppInput.medium))
          ) {
            this.particleManager.spawn(
              "IMPACT_SPARK",
              hitX,
              hitY,
              15,
              "#ffffff",
            );
            attacker.state = PlayerState.IDLE;
            defender.state = PlayerState.IDLE;
            attacker.velocity.x = attacker.facingRight ? -10 : 10;
            attacker.velocity.y = 0;
            defender.velocity.x = defender.facingRight ? -10 : 10;
            defender.velocity.y = 0;
            attacker.dragonRushCooldown = 0;
            return;
          }

          wasDragonRush = true;
          damage = DAMAGE_TIER_1 * 2;
          knockX = 0;
          knockY = 0;

          attacker.state = PlayerState.DRAGON_COMBO;
          (attacker as any)["dragonRushDirX"] = undefined;
          (attacker as any)["dragonRushDirY"] = undefined;
          try {
            AudioManager.getInstance().playSFX("dragon_rush_combo");
          } catch (drComboErr) {
            console.error("Failed to play dragon_rush_combo SFX:", drComboErr);
          }
          attacker.comboStep = 0;
          attacker.animFrame = 0;
          attacker.animTimer = 0;
          attacker.animFinished = false;
          attacker.velocity.x = 0;
          attacker.velocity.y = 0;

          defender.state = PlayerState.HIT;
          defender.velocity.x = 0;
          defender.velocity.y = 0;
          defender.stunTimer = 180; // keep stunned

          // Hitstop curtos
          this.hitStopTimer = 15;

          // Alinhamento baseado no sprite do atacante com 30px de distância
          if (attacker.facingRight) {
            defender.pos.x = (attacker.x + attacker.width) + defender.width / 2 + 30;
          } else {
            defender.pos.x = attacker.x - defender.width / 2 - 30;
          }
          defender.pos.y = attacker.pos.y;
          defender.facingRight = !attacker.facingRight;

          this.camera.addScreenShake(8, 8, "PERLIN", 1.0);
          this.particleManager.spawn("IMPACT_SPARK", hitX, hitY, 10);
        }

        const isFacingAttacker =
          (attacker.x < defender.x && !defender.facingRight) ||
          (attacker.x > defender.x && defender.facingRight);

        if (defender.state === PlayerState.REFLECT && isFacingAttacker) {
          // Reflect success
          attacker.velocity.x = attacker.facingRight ? -15 : 15; // Repel attacker
          attacker.stunTimer = 10;
          this.particleManager.spawn("ENERGY", hitX, hitY, 15, "#aaffff", {
            size: 8,
            speed: 10,
          });
          return;
        }

        if ((attacker.state as any) === PlayerState.SUPER_DASH) {
          attacker.superDashHitOpponent = true;
        }

        const isForwardAdvancingAttack = 
          (attacker.state as any) === PlayerState.SUPER_DASH || 
          (attacker.state as any) === PlayerState.DASHING ||
          attacker.comboType === "SUPER_DASH" ||
          (((attacker.state as any) === PlayerState.ATTACKING || (attacker.state as any) === PlayerState.JUMP_ATTACK || (attacker.state as any) === PlayerState.CROUCH_ATTACK) && 
           (attacker.facingRight ? attacker.velocity.x > 3 : attacker.velocity.x < -3));

        let isBlocking =
          (defender.state === PlayerState.BLOCKING ||
            defender.state === PlayerState.BLOCKING_CROUCH ||
            defender.state === PlayerState.BLOCKING_AIR ||
            defender.state === PlayerState.WALK_BACKWARD) &&
          isFacingAttacker &&
          !wasDragonRush; // DRAGON RUSH IS UNBLOCKABLE

        const isPerfectBlock =
          isBlocking && defender.blockFrames > 0 && defender.blockFrames <= 15;

        // "Ataques com avanço só podem ser defendidos através de uma Defesa Perfeita.
        // Caso o jogador não execute a Defesa Perfeita dentro da janela correta: A defesa falha, o ataque acerta normalmente."
        if (isForwardAdvancingAttack && isBlocking && !isPerfectBlock) {
          isBlocking = false;
        }

        let wasMUISpecial = MuiSpecialManager.checkSpecialHit(
          this,
          attacker,
          defender,
          isBlocking,
        );
        if (wasMUISpecial) {
          damage = DAMAGE_TIER_2;
          knockX = 0;
          knockY = 0;
        }

        if (attacker.sparkingTimer > 0) damage *= 1.25; // 25% damage boost during Sparking

        damage *= attacker.attackMult * this.customDamageMultiplier;
        damage *= defender.defenseMult;
        // Aplica o multiplicador de combo dinâmico (comboBonus)
        damage *= (1 + comboBonus);

        if (isPerfectBlock) {
          // Perfect Block: No chip damage, no guard damage, increased knockback and stun to attacker
          try {
            const defNum = defender === this.player1 ? 1 : 2;
            BattleStateManager.getInstance().reportAction(defender, attacker, BattleEvent.PERFECT_GUARD, defNum);
          } catch (e) {
            console.warn("[SPEECH_DIAL] Perfect guard report fail:", e);
          }

          defender.ki = Math.min(MAX_KI, defender.ki + KI_GAIN_ON_DAMAGE * 1.5);
          
          if (isForwardAdvancingAttack) {
            // Cancel advance, stop at impact point, 20 frames stun for advantage
            attacker.state = attacker.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            attacker.velocity.x = 0;
            attacker.velocity.y = 0;
            attacker.stunTimer = Math.max(attacker.stunTimer, 20);
            
            // Both receive a small pushback to avoid overlap
            attacker.velocity.x = attacker.facingRight ? -4 : 4;
            defender.velocity.x = attacker.facingRight ? 4 : -4;
          } else {
            // Counter-attack frame advantage: Stun attacker briefly (15 frames)
            attacker.stunTimer = Math.max(attacker.stunTimer, 15);
            attacker.velocity.x = attacker.facingRight ? -8 : 8; // Push attacker back
            if ((attacker.state as any) === PlayerState.SUPER_DASH || (attacker.state as any) === PlayerState.DASHING) {
              attacker.state = attacker.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
            }
          }

          this.particleManager.spawn("SPARK", hitX, hitY, 15, "#ffffff", {
            size: 8,
            speed: 2,
          }); // Intense flash for perfect block
          this.camera.addScreenShake(8, 6, "IMPULSE", 1);
          AudioManager.getInstance().playSFX("block");
          
          // Just set them in block state visually
          if (defender.state === PlayerState.WALK_BACKWARD) {
            defender.state = defender.isGrounded
              ? PlayerState.BLOCKING
              : PlayerState.BLOCKING_AIR;
          }
        } else if (isBlocking) {
          // Anti-Forward Momentum (Defesa contra avanço):
          // Cancel forward movement on impact, prevent crossing through, apply proportional pushback.
          const minDistance = (attacker.width + defender.width) / 2;
          const currentDistance = Math.abs(attacker.pos.x - defender.pos.x);
          if (currentDistance < minDistance) {
            const pushDirection = attacker.pos.x < defender.pos.x ? -1 : 1;
            attacker.pos.x = defender.pos.x + pushDirection * minDistance;
          }
          if ((attacker.state as any) === PlayerState.SUPER_DASH || (attacker.state as any) === PlayerState.DASHING || (attacker.state as any) === PlayerState.RUNNING) {
            attacker.state = attacker.isGrounded ? PlayerState.IDLE : PlayerState.FALLING;
          }
          // Both suffer pushback
          attacker.velocity.x = attacker.facingRight ? -4 : 4;

          // Categorized Melee damage, guard cost, and pushback
          let chipPercent = CHIP_DAMAGE_PERCENT;
          let guardCost = damage * 0.5;
          let pushbackForce = 5;

          if (attacker.comboType === "LIGHT") {
            chipPercent = 0.0;     // No chip damage for light physical
            guardCost = 8;         // Low guard consumption
            pushbackForce = 2.5;   // Small pushback
          } else if (attacker.comboType === "MEDIUM") {
            chipPercent = 0.02;    // Low chip damage
            guardCost = 12;        // Low-medium guard consumption
            pushbackForce = 4.0;   // Medium pushback
          } else if (attacker.comboType === "HEAVY") {
            chipPercent = 0.10;    // Partial damage reduction (10% chip)
            guardCost = 28;        // High guard consumption
            pushbackForce = 12.0;  // Strong pushback
          }

          const chipDamage = damage * chipPercent;
          defender.takeDamage(chipDamage);
          defender.ki = Math.min(MAX_KI, defender.ki + KI_GAIN_ON_DAMAGE * 0.5); // Ki quando bloqueia
          defender.guard -= guardCost;
          defender.guardRegenTimer = GUARD_REGEN_DELAY;

          if (defender.guard <= 0) {
            defender.guard = 0;
            defender.state = PlayerState.GUARD_BREAK;
            try {
              AudioManager.getInstance().playSFX("guard_break");
            } catch (gbErr) {
              console.error("Failed to play guard_break SFX:", gbErr);
            }
            defender.ataque = false;
            defender.stunTimer = GUARD_BREAK_STUN;
            defender.velocity.x = attacker.facingRight ? 15 : -15; // Forced recoil / pushback
            this.particleManager.spawnHitSpark(hitX, hitY, true);
            this.camera.addScreenShake(15, 12, "IMPULSE", 1);
          } else {
            defender.velocity.x = attacker.facingRight ? pushbackForce : -pushbackForce;
            this.particleManager.spawn("BLOCK", hitX, hitY, 5, "#60a5fa");
            if (defender.state === PlayerState.WALK_BACKWARD) {
              defender.state = defender.isGrounded
                ? PlayerState.BLOCKING
                : PlayerState.BLOCKING_AIR;
            }
            AudioManager.getInstance().playSFX("block");
          }
        } else {
          // Super Armor Check
          let hasArmor = false;
          if (defender.currentPhasedMove) {
            const move = (defender.data as any).phasedMoves?.[defender.currentPhasedMove];
            const phase = move?.phases[defender.currentPhaseIndex];
            if (phase?.armor) {
              hasArmor = true;
            }
          }

          defender.takeDamage(damage);
          this.triggerDamageVoice(defender);

          if (hasArmor) {
            this.particleManager.spawnHitSpark(hitX, hitY, true);
            this.camera.addScreenShake(6, 4, "IMPULSE", 0.8);
            try {
              AudioManager.getInstance().playSFX("heavy_hit");
            } catch (e) {}
            return; // Skip flinch/state change
          }

          if (damage > 40) {
            this.camera.addScreenShake(12, 10, "IMPULSE", 1); // Strong hit
          } else if (isFinisher) {
            this.camera.addScreenShake(15, 12, "IMPULSE", 1); // Heavy finisher
          } else if (damage > 15) {
            this.camera.addScreenShake(6, 4, "IMPULSE", 1); // Normal hit
          }
          this.playComboHitSFX(attacker, damage, isFinisher);
          defender.ki = Math.min(MAX_KI, defender.ki + KI_GAIN_ON_DAMAGE); // Ki recebendo dano
          if (!wasMUISpecial) {
            defender.stunTimer = STUN_DURATION;
            
            // Set specific Hit state based on context
            if (!defender.isGrounded) {
              if (knockY < -10) {
                defender.state = PlayerState.HIT_AIR_FALL;
              } else if (knockY > 10) {
                defender.state = PlayerState.LAUNCHED; // Will resolve to HIT_BOUNCE
              } else {
                defender.state = PlayerState.HIT_AIR;
              }
            } else {
              if (knockY > 10) {
                defender.state = PlayerState.LAUNCHED; // Ground launch
              } else {
                defender.state = PlayerState.HIT;
              }
            }
            
            defender.ataque = false;
            defender.velocity.y = -knockY;
            defender.velocity.x = attacker.facingRight ? knockX : -knockX;
            if (![this.player1, this.player2].includes(defender)) {
              defender.assistCooldown += 300;
            }
            if (attacker.comboCount > 1) {
              defender.pos.y = attacker.pos.y;
            }
            // Cancel active beams/genkidamas from the defender when they take damage (retaining normal projectiles)
            for (const proj of this.projectiles) {
              if (proj.ownerId === (defender === this.player1 ? "p1" : "p2") || (proj as any).sourcePlayer === defender) {
                const isGenkidama = proj.isGiantBlast || (proj.beamFamilyId && proj.beamFamilyId.includes("GENKIDAMA"));
                const isBeam = proj.isBeam || (proj.beamFamilyId && (
                  proj.beamFamilyId.includes("BEAM") || 
                  proj.beamFamilyId.includes("FECHO") || 
                  proj.beamFamilyId.includes("CHAVE_BEAM") || 
                  proj.beamFamilyId.includes("KAMEHAMEHA")
                ));
                if (isBeam || isGenkidama) {
                  proj.active = false;
                }
              }
            }
          }
          // Removed hitstop
          this.particleManager.spawnHitSpark(hitX, hitY, isFinisher);
        }

        // Combos no chão criam pedras apenas quando combo colidir no oponente!
        if (
          attacker.isGrounded &&
          (attacker.comboType === "LIGHT" ||
            attacker.comboType === "MEDIUM" ||
            attacker.comboType === "HEAVY" ||
            attacker.comboType === "BURST" ||
            attacker.comboType === "SPECIAL" ||
            (attacker.state as any) === PlayerState.DRAGON_RUSH ||
            (attacker.state as any) === PlayerState.DRAGON_COMBO)
        ) {
          try {
            const gem = GroundEnergyManager.getInstance();
            const material = gem.getMaterialConfig(this.stageTheme);
            const floorY = WORLD_HEIGHT - this.groundY;
            
            const rockCount = isFinisher ? 5 : 3;
            for (let k = 0; k < rockCount; k++) {
              const forceX = (Math.random() - 0.5) * 6.0;
              const forceY = -Math.random() * 4.0 - 2.0;

              gem.spawnGroundParticle(
                hitX + (Math.random() - 0.5) * 15,
                floorY - 1,
                forceX,
                forceY,
                'pebble',
                material.particleColor,
                80,
                Math.random() < 0.4 ? 'medium' : 'small',
                material.debrisGravity,
                material.bouncinessFactor
              );
            }
          } catch (err) {
            console.error("Error creating ground combo rocks:", err);
          }
        }
      }
    }
  }

  /**
   * Decoupled auxiliary function to play correct combo hit sound effects.
   * Completely independent and safe from other systems.
   */
  private playComboHitSFX(attacker: any, damage: number, isFinisher: boolean): void {
    try {
      let hitSFX = "punch";
      if (attacker && typeof attacker.comboType === "string") {
        const type = attacker.comboType.toUpperCase();
        const step = typeof attacker.comboStep === "number" ? attacker.comboStep : 0;

        if (type === "LIGHT") {
          if (step === 0) {
            hitSFX = "combo_leve_1";
          } else if (step === 1) {
            hitSFX = "combo_leve_2";
          } else {
            hitSFX = "combo_leve_3";
          }
        } else if (type === "MEDIUM") {
          if (step === 0) {
            hitSFX = "combo_medio_1";
          } else if (step === 1) {
            hitSFX = "combo_medio_2";
          } else {
            hitSFX = "combo_medio_3";
          }
        } else if (type === "HEAVY") {
          hitSFX = "combo_forte";
        } else {
          if (damage > 40 || isFinisher) {
            hitSFX = "combo_forte";
          } else if (damage > 15) {
            hitSFX = "combo_medio_1";
          } else {
            hitSFX = "combo_leve_1";
          }
        }
      } else {
        if (damage > 40 || isFinisher) {
          hitSFX = "combo_forte";
        } else if (damage > 15) {
          hitSFX = "combo_medio_1";
        } else {
          hitSFX = "combo_leve_1";
        }
      }

      AudioManager.getInstance().playSFX(hitSFX);
    } catch (err) {
      console.warn("[AUDIO_COMBO] Failed to play combo hit SFX, playing punch fallback:", err);
      try {
        AudioManager.getInstance().playSFX("punch");
      } catch {}
    }
  }

  /**
   * Decoupled auxiliary function to play damage voice lines for characters.
   * Completely independent and safe from other systems.
   */
  private triggerDamageVoice(player: any): void {
    if (!player || !player.data) return;

    // Cooldown of 1.2 seconds to prevent audio chaos
    const now = Date.now();
    if (!player._lastDmgVoiceTime) {
      player._lastDmgVoiceTime = 0;
    }
    if (now - player._lastDmgVoiceTime < 1200) return;

    // 40% probability to trigger for dynamic natural sounds
    if (Math.random() >= 0.40) return;

    player._lastDmgVoiceTime = now;

    if (
      player.data.id === "goku_ssj" ||
      player.data.id === "goku_blue_gif" ||
      player.data.id === "goku_mui"
    ) {
      const gbase = "/Assets/SONS/DUBLAGEM/GOKU%20BASE";
      const randomIdx = Math.floor(Math.random() * 10) + 1; // 1 to 10
      const voiceUrl = `${gbase}/DANO%20(${randomIdx}).wav`;
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Goku damage voice:", err);
      }
    } else if (player.data.id === "goku_black_rose") {
      const gkrose = "/Assets/SONS/DUBLAGEM/GOKU%20BLACK%20ROSE";
      const danoNumbers = [1, 3, 4, 5, 6, 10, 11, 12, 13, 14];
      const randomNum = danoNumbers[Math.floor(Math.random() * danoNumbers.length)];
      const voiceUrl = `${gkrose}/DANO/DANO%20(${randomNum}).wav`;
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Goku Black damage voice:", err);
      }
    } else if (player.data.id === "vegeta_base") {
      const randomIdx = Math.floor(Math.random() * 9) + 1; // 1 to 9
      const voiceUrl = `/Assets/SONS/DUBLAGEM/VEGETA%20BASE/DANO%20(${randomIdx}).wav`.replace(/ /g, "%20");
      try {
        AudioManager.getInstance().playVoice(voiceUrl);
      } catch (err) {
        console.error("Error playing Vegeta damage voice:", err);
      }
    }
  }

  // --- RENDERING, RESET, ETC are standard ---
  public setDummyMode(mode: DummyMode) {
    this.dummyController.setMode(mode);
  }
  public setCpuAction(action: CpuAction) {
    this.cpuAction = action;
    this.dummyController.setCpuAction(action);
  }
  public setCounterAttackType(type: CounterAttackType) {
    this.counterAttackType = type;
    this.dummyController.setCounterAttackType(type);
  }
  public reset() {
    this.resetPositions();
    BattleAnnouncerManager.getInstance().reset();
    try {
      BattleStateManager.getInstance().reset();
    } catch (e) {
      console.warn("[SPEECH_DIAL] Reset Fail:", e);
    }
  }

  public resetPositions() {
    // Stop any active charging sound loops immediately on match reset/rematch
    try {
      AudioManager.getInstance().stopLoopedSFX("ki_charge_p1");
      AudioManager.getInstance().stopLoopedSFX("ki_charge_p2");
    } catch (e) {
      console.error("Failed to stop charging loops on resetPositions:", e);
    }

    // Clean up any active intro voices for players to avoid overlapping on reset/rematch
    if ((this.player1 as any).introVoice) {
      try { (this.player1 as any).introVoice.pause(); } catch (e) {}
      (this.player1 as any).introVoice = null;
    }
    (this.player1 as any).voicePlayed = false;
    (this.player1 as any).introPhaseTime = 0;

    if ((this.player2 as any).introVoice) {
      try { (this.player2 as any).introVoice.pause(); } catch (e) {}
      (this.player2 as any).introVoice = null;
    }
    (this.player2 as any).voicePlayed = false;
    (this.player2 as any).introPhaseTime = 0;

    this.koSequenceActive = false;
    this.koSequenceTimer = 0;
    this.koClashActive = false;
    this.koClashIncomingPlayer = null;
    this.koClashWaitingPlayer = null;
    if (this.koClashBackgroundEffectId !== null) {
      const effect = this.visualEffects.find(v => v.id === this.koClashBackgroundEffectId);
      if (effect) effect.active = false;
      this.koClashBackgroundEffectId = null;
    }
    this.koDefeatedPlayer = null;

    const centerX = this.worldWidth / 2;
    this.player1.pos.x = centerX - SPAWN_CENTER_OFFSET;
    this.player1.pos.y = WORLD_HEIGHT - this.groundY;
    this.player1.velocity = { x: 0, y: 0 };
    this.player1.hp = this.player1.maxHp;
    this.player1.ki = 0;
    this.player1.invincibleTimer = 0;
    this.player1.guard = MAX_GUARD;
    this.player1.stunTimer = 0;
    this.player1.state = PlayerState.INTRO;
    this.player1.lastState = PlayerState.INTRO;
    this.player1.comboCount = 0;
    this.player1.autoDashUsed = false;
    this.player1.dashCooldownTimer = 0;
    this.player1.quickDashCooldownTimer = 0;
    this.player1.facingRight = true;
    this.player1.projectileCooldown = 0;
    this.player1.jumpsUsed = 0;

    this.player2.pos.x = centerX + SPAWN_CENTER_OFFSET;
    this.player2.pos.y = WORLD_HEIGHT - this.groundY;
    this.player2.velocity = { x: 0, y: 0 };
    this.player2.hp = this.player2.maxHp;
    this.player2.ki = 0;
    this.player2.invincibleTimer = 0;
    this.player2.guard = MAX_GUARD;
    this.player2.stunTimer = 0;
    this.player2.state = PlayerState.INTRO;
    this.player2.lastState = PlayerState.INTRO;
    this.player2.comboCount = 0;
    this.player2.autoDashUsed = false;
    this.player2.dashCooldownTimer = 0;
    this.player2.quickDashCooldownTimer = 0;
    this.player2.facingRight = false;
    this.player2.projectileCooldown = 0;
    this.player2.jumpsUsed = 0;
    this.projectiles = [];

    this.p1FusionUsed = false;
    this.p2FusionUsed = false;
    this.p1FusionNotificationPlayed = false;
    this.p2FusionNotificationPlayed = false;
    this.p1GogetaTimer = 0;
    this.p2GogetaTimer = 0;

    if (this.gameMode === "TRAINING") {
      this.introPhase = IntroPhase.FIGHT;
      this.introTimer = 0;
      this.introFadeAlpha = 0;
      this.introTransitioning = false;
      this.player1.state = PlayerState.IDLE;
      this.player2.state = PlayerState.IDLE;
    } else {
      const p1Config = CHARACTER_INTROS[this.player1.data.id];
      const p2Config = CHARACTER_INTROS[this.player2.data.id];

      this.introTimer = p1Config ? p1Config.maxTime : 600; // Allow 10 seconds max for P1 intro (will skip early when anim finishes)
      this.introPhase = IntroPhase.P1_INTRO;
      this.introFadeAlpha = 0;
      this.introTransitioning = false;
      
      MoveManager.getInstance().startMove(this.player1, 'INTRO');

      if (p1Config) {
        p1Config.update({
          progress: 0,
          worldWidth: this.worldWidth,
          groundY: WORLD_HEIGHT - this.groundY,
          isPlayer1: true,
          player: this.player1,
          opponent: this.player2,
        });
      }
      if (p2Config) {
        p2Config.update({
          progress: 0,
          worldWidth: this.worldWidth,
          groundY: WORLD_HEIGHT - this.groundY,
          isPlayer1: false,
          player: this.player2,
          opponent: this.player1,
        });
      }
    }
    this.player1.animFinished = false;
    this.player2.animFinished = false;
    this.camera.position = {
      x: centerX,
      y: WORLD_HEIGHT / 2 + this.camera.cameraCenterOffsetY,
    };
  }
  public attach(canvas: HTMLCanvasElement, fgCanvas?: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    if (fgCanvas) {
      this.fgCanvas = fgCanvas;
      this.fgCtx = fgCanvas.getContext("2d", { alpha: true })!;
      this.fgCtx.imageSmoothingEnabled = false;
    }
    this.ctx.imageSmoothingEnabled = false;
    this.resize(canvas.clientWidth, canvas.clientHeight);
    this.start();
  }
  public detach() {
    this.stop();
    if (this.onBeamClashPointer) {
      window.removeEventListener('pointerdown', this.onBeamClashPointer);
      this.onBeamClashPointer = null;
    }
    this.canvas = null;
    this.fgCanvas = null;
    this.fgCtx = null;
    this.ctx = null;
  }
  public start() {
    if (!this.canvas || !this.ctx) {
      console.warn("Cannot start GameEngine: canvas or ctx is missing. Standby...");
      return;
    }
    if (this.isRunning) return;
    this.isRunning = true;
    this.inputManager.reset();
    this.lastTime = performance.now();
    try {
      GroundEnergyManager.getInstance().clear();
    } catch (err) {
      console.warn("Could not clear GroundEnergyManager on start:", err);
    }
    this.loop();
  }
  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    AudioManager.isInBattle = false;
    try {
      GroundEnergyManager.getInstance().clear();
    } catch (err) {
      console.warn("Could not clear GroundEnergyManager on stop:", err);
    }
    try {
      AudioManager.getInstance().stopLoopedSFX("ki_charge_p1");
      AudioManager.getInstance().stopLoopedSFX("ki_charge_p2");
      AudioManager.getInstance().stopAllEffects();
    } catch (e) {
      console.error("Failed to stop audio effects on engine stop:", e);
    }
  }
  public resize(width: number, height: number) {
    if (this.canvas && this.ctx) {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
      if (this.fgCanvas && this.fgCtx) {
        this.fgCanvas.width = width * dpr;
        this.fgCanvas.height = height * dpr;
        this.fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.fgCtx.imageSmoothingEnabled = false;
      }
    }
    this.camera.resize(width, height);
  }

  private setupBeamClashInput() {
    this.onBeamClashPointer = (e: PointerEvent) => {
      if (!this.isBeamClashActive) return;
      if (this.gameMode === "LOCAL_VS") {
        if (e.clientX < window.innerWidth / 2) {
          this.p1BeamClashCount++;
        } else {
          this.p2BeamClashCount++;
        }
      } else {
        this.p1BeamClashCount++;
      }
      try {
        AudioManager.getInstance().playSFX("click");
      } catch (err) {}
    };
    window.addEventListener('pointerdown', this.onBeamClashPointer);
  }

  private handleBeamClash() {
    this.beamClashTimer--;

    // Keep camera shaking slightly during beam clash to make it feel extremely intense
    this.camera.addScreenShake(3, 3, "IMPULSE", 0.1);

    const p1Beam = this.projectiles.find(p => p.ownerId === "p1" && p.isBeam && p.active && !p.isShrinking);
    const p2Beam = this.projectiles.find(p => p.ownerId === "p2" && p.isBeam && p.active && !p.isShrinking);

    // If one of the beams was deactivated unexpectedly, end the clash safely
    if (!p1Beam || !p2Beam) {
      this.isBeamClashActive = false;
      if (this.onBeamClashPointer) {
        window.removeEventListener('pointerdown', this.onBeamClashPointer);
        this.onBeamClashPointer = null;
      }
      return;
    }

    const isGuest = this.gameMode === "ONLINE" && !this.isHost;

    // Use our fixed static beam origin emitters stored at start of clash to prevent any visual drift
    const startX1 = Math.round((this as any).beamClashEmitter1X_fixed !== undefined ? (this as any).beamClashEmitter1X_fixed : (this.player1.facingRight ? this.player1.x + 76 : this.player1.x + this.player1.width - 76));
    const startX2 = Math.round((this as any).beamClashEmitter2X_fixed !== undefined ? (this as any).beamClashEmitter2X_fixed : (this.player2.facingRight ? this.player2.x + 76 : this.player2.x + this.player2.width - 76));

    this.beamClashEmitter1X = startX1;
    this.beamClashEmitter2X = startX2;

    const totalDistance = startX2 - startX1;
    const p1FacingRight = p1Beam.initialFacingRight ?? (p1Beam.vx > 0);

    let clashX = (startX1 + startX2) / 2;

    if (isGuest) {
      // Guest: bypass all struggle calculations, only use synchronized values from host
      if ((this as any).beamClashVisualX !== undefined) {
        clashX = Math.round((this as any).beamClashVisualX);
      } else {
        clashX = Math.round(startX1 + this.beamClashProgress * totalDistance);
      }
    } else {
      // 1. Process inputs (taps)
      const p1Pressed = ['light', 'medium', 'heavy', 'kiblast', 'special', 'attack', 'dash', 'block', 'jump'].some(act => 
        this.inputManager && this.inputManager.isPressed(act as any, 1)
      );
      const finalP1Taps = this.p1BeamClashCount + (p1Pressed ? 1 : 0);
      this.p1BeamClashCount = 0;

      const p2Pressed = ['light', 'medium', 'heavy', 'kiblast', 'special', 'attack', 'dash', 'block', 'jump'].some(act => 
        this.inputManager && this.inputManager.isPressed(act as any, 2)
      );
      let finalP2Taps = this.p2BeamClashCount + (p2Pressed ? 1 : 0);
      this.p2BeamClashCount = 0;

      // AI/Dummy generates organic automated tapping
      if (this.gameMode !== "LOCAL_VS") {
        let aiTapRate = 12; // default
        // If we are in training, let's make dummy behavior influence tapping or stay neutral
        if (this.isTraining) {
          aiTapRate = 15; // easier or customizable
        }
        if (this.frameCount % aiTapRate === 0) {
          finalP2Taps += 1;
        }
      }

      // Transition to the midpoint (0.5) smoothly from the initial collision point
      if ((this as any).beamClashTransitionTicks === undefined) {
        (this as any).beamClashTransitionTicks = 0;
      }
      if ((this as any).beamClashTransitionMaxTicks === undefined) {
        (this as any).beamClashTransitionMaxTicks = 120;
      }
      if ((this as any).beamClashStruggleOffset === undefined) {
        (this as any).beamClashStruggleOffset = 0;
      }

      // Re-assert/force exact player coordinates to prevent any movement/displacement during the energy clash
      if ((this as any).beamClashPlayer1X !== undefined) {
        this.player1.pos.x = (this as any).beamClashPlayer1X;
        this.player1.pos.y = (this as any).beamClashPlayer1Y;
      }
      if ((this as any).beamClashPlayer2X !== undefined) {
        this.player2.pos.x = (this as any).beamClashPlayer2X;
        this.player2.pos.y = (this as any).beamClashPlayer2Y;
      }

      if ((this as any).beamClashInitialX === undefined) {
        (this as any).beamClashInitialX = (startX1 + startX2) / 2;
      }
      if ((this as any).beamClashMidpointX === undefined) {
        (this as any).beamClashMidpointX = (startX1 + startX2) / 2;
      }

      if ((this as any).beamClashTransitionTicks < (this as any).beamClashTransitionMaxTicks) {
        (this as any).beamClashTransitionTicks++;
      }

      const t = (this as any).beamClashTransitionTicks / (this as any).beamClashTransitionMaxTicks;
      // easeInOutCubic for smooth start and land
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const baseClashX = (this as any).beamClashInitialX + ((this as any).beamClashMidpointX - (this as any).beamClashInitialX) * easeT;

      // P1 wants to move clashX towards P2.
      // If P1 is facing right, P2 is on the right, so moving towards P2 means increasing clashX (+).
      // If P1 is facing left, P2 is on the left, so moving towards P2 means decreasing clashX (-).
      const struggleDir = p1FacingRight ? 1 : -1;

      // Update struggle velocity for organic momentum and fluid/smooth movement
      if ((this as any).beamClashStruggleVelocity === undefined) {
        (this as any).beamClashStruggleVelocity = 0;
      }

      const impulsePerTap = 3.0; // Smooth physical impulse per tap
      const struggleForce = (finalP1Taps - finalP2Taps) * impulsePerTap * struggleDir;
      (this as any).beamClashStruggleVelocity += struggleForce;

      // Organic dampening/friction to slow down the beam movement naturally (fluid drag)
      (this as any).beamClashStruggleVelocity *= 0.88;

      // Cap velocity to keep physical movement within premium limits
      const maxVelocity = 12;
      (this as any).beamClashStruggleVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, (this as any).beamClashStruggleVelocity));

      // Smoothly accumulate the velocity into the struggle offset
      (this as any).beamClashStruggleOffset += (this as any).beamClashStruggleVelocity;

      // Target clashX combines the sliding base equilibrium plus the active struggle offset
      let targetClashX = baseClashX + (this as any).beamClashStruggleOffset;

      // Keep clashX safely clamped between the two players with a reasonable buffer so the tip never visually leaves the screen or flips sides
      const safeBuffer = 0;
      const minClashX = Math.min(startX1, startX2) + safeBuffer;
      const maxClashX = Math.max(startX1, startX2) - safeBuffer;
      
      // Prevent phantom offset accumulation by clamping both targetClashX and struggleOffset
      if (targetClashX < minClashX) {
        targetClashX = minClashX;
        (this as any).beamClashStruggleOffset = minClashX - baseClashX;
        (this as any).beamClashStruggleVelocity = 0;
      } else if (targetClashX > maxClashX) {
        targetClashX = maxClashX;
        (this as any).beamClashStruggleOffset = maxClashX - baseClashX;
        (this as any).beamClashStruggleVelocity = 0;
      }
      const clampedClashX = targetClashX;

      // Smoothly interpolate the clashX (lerp) for beautiful inertia and fluid movement
      if ((this as any).beamClashVisualX === undefined) {
        (this as any).beamClashVisualX = (this as any).beamClashInitialX;
      }
      (this as any).beamClashVisualX += (clampedClashX - (this as any).beamClashVisualX) * 0.08;

      clashX = Math.round((this as any).beamClashVisualX);

      // Keep proportional progress fields perfectly in sync with the absolute position for HUD / game state logic
      if (Math.abs(totalDistance) > 1) {
        this.beamClashProgress = (clampedClashX - startX1) / totalDistance;
        this.beamClashVisualProgress = (clashX - startX1) / totalDistance;
      } else {
        this.beamClashProgress = 0.5;
        this.beamClashVisualProgress = 0.5;
      }
      this.beamClashP1FacingRight = p1FacingRight;

      // Clamp progress values safely within [0.01, 0.99] to support the 1% defeat size threshold perfectly!
      this.beamClashProgress = Math.max(0.01, Math.min(0.99, this.beamClashProgress));
      this.beamClashVisualProgress = Math.max(0.01, Math.min(0.99, this.beamClashVisualProgress));
    }

    const metrics1 = this.getBeamEndMetricsForClash(p1Beam, true);
    const metrics2 = this.getBeamEndMetricsForClash(p2Beam, false);

    const endOffsetX1 = Math.round(metrics1.endOffsetX);
    const endOffsetX2 = Math.round(metrics2.endOffsetX);

    // Enforce perfect vertical alignment to prevent any visual or hitbox height drift/desalinhamento
    const y1 = (this as any).beamClashBeam1Y_fixed !== undefined ? (this as any).beamClashBeam1Y_fixed : p1Beam.y;
    const y2 = (this as any).beamClashBeam2Y_fixed !== undefined ? (this as any).beamClashBeam2Y_fixed : p2Beam.y;
    const clashY = Math.round((y1 + y2) / 2);
    (this as any).beamClashVisualY = clashY;
    p1Beam.y = clashY;
    p2Beam.y = clashY;
    p1Beam.initialSpawnY = clashY;
    p2Beam.initialSpawnY = clashY;

    const endW1 = Math.round(metrics1.endW);
    const endW2 = Math.round(metrics2.endW);

    // Render pontas perfectly centered at the clashX contact point with a slight physical overlap
    const overlap1 = Math.round(endW1 * 0.85);
    const overlap2 = Math.round(endW2 * 0.85);

    if (p1FacingRight) {
      // Standard: P1 is on the left facing right, P2 is on the right facing left
      p1Beam.x = startX1;
      p1Beam.width = Math.max(5, Math.round(clashX - startX1 - endOffsetX1 + overlap1));

      // Lock Player 2's starting/origin point to exactly startX2 by setting p2Beam.x relative to startX2 and clamping to prevent it from going past/behind the character
      p2Beam.x = Math.min(startX2 - 5, Math.max(0, Math.round(clashX + endOffsetX2 - overlap2)));
      p2Beam.width = Math.max(5, Math.round(startX2 - p2Beam.x));
    } else {
      // Swapped: P1 is on the right facing left, P2 is on the left facing right
      p2Beam.x = startX2;
      p2Beam.width = Math.max(5, Math.round(clashX - startX2 - endOffsetX2 + overlap2));

      // Lock Player 1's starting/origin point to exactly startX1 by setting p1Beam.x relative to startX1 and clamping to prevent it from going past/behind the character
      p1Beam.x = Math.min(startX1 - 5, Math.max(0, Math.round(clashX + endOffsetX1 - overlap1)));
      p1Beam.width = Math.max(5, Math.round(startX1 - p1Beam.x));
    }

    // Update dynamic spawn origins to prevent Projectile.update from resetting position to stale values and creating jitter/gaps
    p1Beam.initialSpawnX = startX1;
    p2Beam.initialSpawnX = startX2;

    p1Beam.life = 99;
    p2Beam.life = 99;

    // Keep players locked in place to make them unable to perform any actions
    this.player1.velocity.x = 0;
    this.player1.velocity.y = 0;
    this.player1.attackTimer = 20; // reset to keep casting state active
    if ((this as any).beamClashPlayer1State) {
      this.player1.state = (this as any).beamClashPlayer1State;
    }
    
    this.player2.velocity.x = 0;
    this.player2.velocity.y = 0;
    this.player2.attackTimer = 20;
    if ((this as any).beamClashPlayer2State) {
      this.player2.state = (this as any).beamClashPlayer2State;
    }

    // Check winner conditions
    const p1Poly = CollisionHelper.getProjectileVertices(p1Beam, this);
    const p2Poly = CollisionHelper.getAABBVertices(this.player2);
    const p1TouchesOpponent = CollisionHelper.testPolygonCollision(p1Poly, p2Poly);

    const p2PolyClash = CollisionHelper.getProjectileVertices(p2Beam, this);
    const p1PolyColl = CollisionHelper.getAABBVertices(this.player1);
    const p2TouchesOpponent = CollisionHelper.testPolygonCollision(p2PolyClash, p1PolyColl);

    const absDistance = Math.abs(totalDistance);
    const extendedDistance = (absDistance + 150) * 1.20;

    if (this.beamClashVisualProgress >= 0.99 || p1TouchesOpponent) {
      // Player 1 wins the clash! Player 2's beam has shrunk to <= 1% size or Player 1's beam touched them.
      p1Beam["beamClashWin"] = true;
      p1Beam.life = 240; // Extended life to accommodate cinematic sequence
      p2Beam.active = false; // destroy the loser's beam
      
      this.isBeamClashActive = false;
      this.isCinematicBeamImpact = true;
      this.cinematicImpactBeam = p1Beam;
      this.cinematicImpactWinner = this.player1;
      this.cinematicImpactLoser = this.player2;
      this.cinematicImpactStage = 'ADVANCE';
      this.cinematicImpactTimer = 0;

      if (this.onBeamClashPointer) {
        window.removeEventListener('pointerdown', this.onBeamClashPointer);
        this.onBeamClashPointer = null;
      }
    } else if (this.beamClashVisualProgress <= 0.01 || p2TouchesOpponent) {
      // Player 2 wins the clash! Player 1's beam has shrunk to <= 1% size or Player 2's beam touched them.
      p2Beam["beamClashWin"] = true;
      p2Beam.life = 240; // Extended life to accommodate cinematic sequence
      p1Beam.active = false; // destroy Player 1's beam

      this.isBeamClashActive = false;
      this.isCinematicBeamImpact = true;
      this.cinematicImpactBeam = p2Beam;
      this.cinematicImpactWinner = this.player2;
      this.cinematicImpactLoser = this.player1;
      this.cinematicImpactStage = 'ADVANCE';
      this.cinematicImpactTimer = 0;

      if (this.onBeamClashPointer) {
        window.removeEventListener('pointerdown', this.onBeamClashPointer);
        this.onBeamClashPointer = null;
      }
    } else if (this.beamClashTimer <= 0) {
      // Timeout tie! Neither winner. No damage applied. Destroy both.
      p1Beam.active = false;
      p2Beam.active = false;
      this.isBeamClashActive = false;

      // Spawn neutral explosion in the middle
      const clashY = (p1Beam.y + p2Beam.y) / 2;
      this.particleManager.spawnHitSpark(clashX, clashY, true);
      try {
        AudioManager.getInstance().playSFX("explosion");
      } catch (err) {}

      if (this.onBeamClashPointer) {
        window.removeEventListener('pointerdown', this.onBeamClashPointer);
        this.onBeamClashPointer = null;
      }
    }
  }

  private updateCinematicImpact() {
    if (!this.isCinematicBeamImpact || !this.cinematicImpactBeam || !this.cinematicImpactLoser) return;

    const beam = this.cinematicImpactBeam;
    const loser = this.cinematicImpactLoser;

    if (this.cinematicImpactStage === 'ADVANCE') {
      // Calculate beam tip
      let tipX = beam.x + (beam.initialFacingRight ? beam.width : 0);
      const loserCenterX = loser.x + loser.width / 2;
      const loserCenterY = loser.y + loser.height / 2;
      const distToLoser = Math.abs(tipX - loserCenterX);
      
      // Dynamic zoom as beam approaches (tension zoom)
      const zoomFactor = Math.max(1.1, 1.9 - (distToLoser / 800) * 0.8);
      // Focus on loser center
      this.camera.focusOn({ x: loserCenterX, y: loserCenterY }, zoomFactor);

      // Collision Detection: Trigger when tip hits the loser
      const beamPoly = CollisionHelper.getProjectileVertices(beam, this);
      const loserPoly = CollisionHelper.getAABBVertices(loser);
      if (CollisionHelper.testPolygonCollision(beamPoly, loserPoly)) {
        this.cinematicImpactStage = 'IMPACT_FX';
        this.cinematicImpactTimer = 0;

        let effectConfigKeyToUse = beam.effectConfigKey || "";
        
        // Force key for Broly's Special 1 if character is Broly and executing Special 1
        if (this.cinematicImpactWinner && (this.cinematicImpactWinner.data.id === "broly_ikari" || this.cinematicImpactWinner.data.id === "broly")) {
          effectConfigKeyToUse = "CHAVE_EFFECT_TELACHEIA_05_VERDE";
        }

        // Force key for Gogeta SSJ4's Special 1 if character is Gogeta SSJ4
        if (this.cinematicImpactWinner && (this.cinematicImpactWinner.data.id === "gogeta_ssj4" || this.cinematicImpactWinner.data.id === "gogeta")) {
          effectConfigKeyToUse = "CHAVE_EFFECT_TELACHEIA_05_AZUL";
        }

        // Spawn Impact Effect exactly at the center of the loser, passing effectConfigKeyToUse as configKey (10th arg) to inherit colors/filters
        this.cinematicImpactEffect = this.spawnVisualEffect(
          "FINAL_IMPACT_EFFECT",
          loserCenterX,
          loserCenterY,
          "/Assets/efeitos/telacheia/5.gif",
          60, // Increased frames to ensure camera has time to focus
          false,
          "",
          1.0, // Scale for cinematic impact (reduced by user)
          beam.initialFacingRight,
          effectConfigKeyToUse
        );
        
        // Trigger impact reactions
        this.spawnClashVictoryFX(loser);
        loser.state = PlayerState.HIT;
        loser.velocity.x = beam.initialFacingRight ? 8 : -8;
        loser.velocity.y = -5;
      }
    } else if (this.cinematicImpactStage === 'IMPACT_FX') {
      this.cinematicImpactTimer++;
      
      // Apply continuous damage during the impact effect
      if (this.cinematicImpactTimer % 4 === 0) {
        loser.hp -= (beam.damage || 10) * 0.25;
        if (loser.hp < 1) loser.hp = 1;
      }

      if (!this.cinematicImpactEffect) {
        this.cinematicImpactEffect = this.visualEffects.find(e => e.type === "FINAL_IMPACT_EFFECT");
      }

      if (this.cinematicImpactEffect && this.cinematicImpactEffect.active) {
        // Snap camera immediately for first frames to simulate impact, then follow
        const isImmediate = this.cinematicImpactTimer < 3;
        this.camera.focusOn({ 
          x: this.cinematicImpactEffect.x, 
          y: this.cinematicImpactEffect.y,
          width: 0,
          height: 0,
          cameraCenterOffsetY: 0 
        }, 2.6, false, isImmediate); 
      } else if (this.cinematicImpactTimer > 45) { 
        this.cinematicImpactStage = 'RECOVERY';
        this.cinematicImpactTimer = 0;
      }
    } else if (this.cinematicImpactStage === 'RECOVERY') {
      this.cinematicImpactTimer++;
      // Smoothly return camera to follow both players
      this.camera.update(this.player1, this.player2, false, false, false, true);
      
      if (this.cinematicImpactTimer > 45) {
        this.isCinematicBeamImpact = false;
        this.cinematicImpactBeam = null;
        this.cinematicImpactLoser = null;
        this.cinematicImpactWinner = null;
        this.cinematicImpactEffect = null;
      }
    }
    
    // Force loser to stay in state during sequence
    if (this.cinematicImpactStage !== 'RECOVERY' && loser.hp > 0) {
        loser.state = PlayerState.HIT;
        loser.stunTimer = 10;
    }
  }

  private spawnClashVictoryFX(target: Player) {
    try {
      AudioManager.getInstance().playSFX("explosion");
      AudioManager.getInstance().playSFX("hit");
    } catch (err) {}
    this.camera.addScreenShake(25, 15, "IMPULSE", 0.8);
    
    // Spawn gorgeous hit sparkles and explosions at target position
    const box = target.hitbox;
    const px = box.x + box.width / 2;
    const py = box.y + box.height / 2;
    
    this.particleManager.spawnHitSpark(px, py, true);
    for (let i = 0; i < 5; i++) {
      this.particleManager.spawn("SPARK", px + (Math.random() - 0.5) * 40, py + (Math.random() - 0.5) * 40, 15, "#ffaa00", {
        size: 5,
        speed: 4
      });
    }
  }

  private updateCameraLimitsFromGround() {
    if ((this as any)._groundLimitsApplied && this.frameCount % 120 !== 0) return;

    const stageInfo = STAGE_DB.find((s) => s.id === this.stageTheme);
    if (!stageInfo || !stageInfo.layers || stageInfo.layers.length === 0) return;

    // The floor sprite is typically the last layer with 0 parallax
    const groundLayer = [...stageInfo.layers].reverse().find(l => l.parallaxFactorX === 0);
    if (!groundLayer) return;

    const img = this.animationManager.loadTexture(groundLayer.img);
    if (img && img.complete && img.naturalWidth !== 0) {
      const scale = groundLayer.scale ?? 1.0;
      const bgW = img.naturalWidth * scale;
      const bgH = img.naturalHeight * scale;
      
      const centerX = this.worldWidth / 2;
      const centerY = WORLD_HEIGHT / 2;
      const yOffset = groundLayer.yOffset ?? 0;

      const limitLeft = centerX - bgW / 2;
      const limitRight = centerX + bgW / 2;
      const limitTop = centerY - bgH / 2 + yOffset;
      const limitBottom = centerY + bgH / 2 + yOffset;

      this.camera.setLimits(limitLeft, limitRight, limitTop, limitBottom);
      (this as any)._groundLimitsApplied = true;
    }
  }
}
