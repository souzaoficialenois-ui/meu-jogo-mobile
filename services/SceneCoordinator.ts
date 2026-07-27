import { LoggerService } from "./LoggerService";

export enum GameScene {
  MAIN_MENU = "MAIN_MENU",
  CHARACTER_SELECT = "CHARACTER_SELECT",
  INTRO = "INTRO",
  COMBAT = "COMBAT",
  GAME_OVER = "GAME_OVER",
  TRAINING = "TRAINING",
  ONLINE_LOBBY = "ONLINE_LOBBY"
}

export class SceneCoordinator {
  private currentScene: GameScene = GameScene.MAIN_MENU;
  private logger = LoggerService.getInstance();
  private onSceneChangeCallbacks: Set<(scene: GameScene) => void> = new Set();

  constructor(initialScene: GameScene = GameScene.MAIN_MENU) {
    this.currentScene = initialScene;
  }

  public getActiveScene(): GameScene {
    return this.currentScene;
  }

  /**
   * Request transitioning to a new scene
   */
  public transitionTo(scene: GameScene, onLoaded?: () => void) {
    if (this.currentScene === scene) {
      this.logger.warn(`Already in scene: ${scene}`, "SceneCoordinator");
      return;
    }

    this.logger.info(`Transitioning from ${this.currentScene} to ${scene}...`, "SceneCoordinator");
    
    // Unload logic of current scene
    this.unloadScene(this.currentScene);

    // Update scene state
    const oldScene = this.currentScene;
    this.currentScene = scene;

    // Load new scene
    this.loadScene(scene);

    // Call scene change listeners
    this.onSceneChangeCallbacks.forEach((cb) => cb(scene));

    if (onLoaded) {
      onLoaded();
    }

    this.logger.info(`Successfully loaded scene: ${scene}`, "SceneCoordinator");
  }

  public onSceneChange(callback: (scene: GameScene) => void): () => void {
    this.onSceneChangeCallbacks.add(callback);
    return () => {
      this.onSceneChangeCallbacks.delete(callback);
    };
  }

  private loadScene(scene: GameScene) {
    switch (scene) {
      case GameScene.INTRO:
        this.logger.info("Setting up Intro phase camera, characters and timers", "SceneCoordinator");
        break;
      case GameScene.COMBAT:
        this.logger.info("Initializing active combat loop, inputs, physics and timers", "SceneCoordinator");
        break;
      case GameScene.TRAINING:
        this.logger.info("Setting up infinite metrics and dummy controls", "SceneCoordinator");
        break;
      default:
        break;
    }
  }

  private unloadScene(scene: GameScene) {
    switch (scene) {
      case GameScene.INTRO:
        this.logger.info("Cleaning up intro phase assets", "SceneCoordinator");
        break;
      case GameScene.COMBAT:
        this.logger.info("Saving fight logs and stopping physics update loops", "SceneCoordinator");
        break;
      default:
        break;
    }
  }
}
