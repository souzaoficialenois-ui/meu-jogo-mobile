import { LoggerService } from "./LoggerService";

export interface IGameSystem {
  name: string;
  dependencies: string[];
  initialize(engine: any): void;
  update(engine: any, deltaTime: number): void;
  destroy(): void;
}

export class LifecycleManager {
  private systems: Map<string, IGameSystem> = new Map();
  private systemOrder: string[] = [];
  private logger = LoggerService.getInstance();
  private isInitialized: boolean = false;

  /**
   * Register a system/module to the lifecycle
   */
  public registerSystem(system: IGameSystem) {
    if (this.systems.has(system.name)) {
      this.logger.warn(`System already registered: ${system.name}`, "LifecycleManager");
      return;
    }
    this.systems.set(system.name, system);
    this.logger.info(`Registered system: ${system.name}`, "LifecycleManager");
  }

  /**
   * Validate all system dependencies and build the execution order (topological sort)
   */
  public validateAndBuildUpdateOrder() {
    this.systemOrder = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (name: string) => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected for system: ${name}`);
      }
      if (!visited.has(name)) {
        temp.add(name);
        const system = this.systems.get(name);
        if (!system) {
          throw new Error(`System "${name}" is missing from register.`);
        }
        for (const dep of system.dependencies) {
          if (!this.systems.has(dep)) {
            throw new Error(`System "${name}" depends on missing system "${dep}"`);
          }
          visit(dep);
        }
        temp.delete(name);
        visited.add(name);
        this.systemOrder.push(name);
      }
    };

    try {
      for (const name of this.systems.keys()) {
        visit(name);
      }
      this.logger.info(`Lifecycle update order built successfully: ${this.systemOrder.join(" -> ")}`, "LifecycleManager");
    } catch (error: any) {
      this.logger.error(`Validation failed: ${error.message}`, "LifecycleManager");
      throw error;
    }
  }

  /**
   * Initialize all registered systems in the dependency order
   */
  public initializeAll(engine: any) {
    if (this.isInitialized) return;

    this.validateAndBuildUpdateOrder();

    this.logger.info("Initializing game systems...", "LifecycleManager");
    for (const name of this.systemOrder) {
      const system = this.systems.get(name);
      if (system) {
        try {
          system.initialize(engine);
          this.logger.info(`System [${name}] initialized successfully.`, "LifecycleManager");
        } catch (e: any) {
          this.logger.error(`Failed to initialize system [${name}]: ${e.message}`, "LifecycleManager");
        }
      }
    }
    this.isInitialized = true;
  }

  /**
   * Execute update loop across all registered systems
   */
  public updateAll(engine: any, deltaTime: number) {
    if (!this.isInitialized) return;

    for (const name of this.systemOrder) {
      const system = this.systems.get(name);
      if (system) {
        try {
          system.update(engine, deltaTime);
        } catch (e: any) {
          this.logger.error(`Error updating system [${name}]: ${e.message}`, "LifecycleManager");
        }
      }
    }
  }

  /**
   * Gracefully destroy all registered systems
   */
  public destroyAll() {
    this.logger.info("Destroying all systems...", "LifecycleManager");
    // Destroy in reverse order of initialization
    const reverseOrder = [...this.systemOrder].reverse();
    for (const name of reverseOrder) {
      const system = this.systems.get(name);
      if (system) {
        try {
          system.destroy();
          this.logger.info(`System [${name}] destroyed.`, "LifecycleManager");
        } catch (e: any) {
          this.logger.error(`Error destroying system [${name}]: ${e.message}`, "LifecycleManager");
        }
      }
    }
    this.systems.clear();
    this.systemOrder = [];
    this.isInitialized = false;
  }
}
