export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // total milliseconds spent in update/render
  systems: { [key: string]: number }; // time spent in specific systems
  memoryUsage?: number; // MBs
}

export class PerformanceMonitor {
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private frameTimeSum: number = 0;
  private measureCount: number = 0;
  private currentFrameTime: number = 0;
  private systemTimings: Map<string, number> = new Map();
  private systemStarts: Map<string, number> = new Map();

  constructor() {
    this.lastTime = performance.now();
  }

  public startFrame(): number {
    return performance.now();
  }

  public endFrame(startTime: number) {
    const endTime = performance.now();
    this.currentFrameTime = endTime - startTime;
    this.frameTimeSum += this.currentFrameTime;
    this.measureCount++;

    this.frameCount++;
    if (endTime > this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (endTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = endTime;
    }
  }

  /**
   * Start tracking a specific system (e.g., 'physics', 'ai', 'rendering')
   */
  public startSystem(name: string) {
    this.systemStarts.set(name, performance.now());
  }

  /**
   * End tracking a specific system and record the duration
   */
  public endSystem(name: string) {
    const start = this.systemStarts.get(name);
    if (start) {
      const duration = performance.now() - start;
      const current = this.systemTimings.get(name) || 0;
      // Use a moving average for system timings to avoid jitter
      this.systemTimings.set(name, current * 0.9 + duration * 0.1);
    }
  }

  public getMetrics(): PerformanceMetrics {
    const avgFrameTime = this.measureCount > 0 ? this.frameTimeSum / this.measureCount : this.currentFrameTime;
    
    if (this.measureCount > 60) {
      this.frameTimeSum = 0;
      this.measureCount = 0;
    }

    const systems: { [key: string]: number } = {};
    this.systemTimings.forEach((val, key) => {
      systems[key] = Number(val.toFixed(2));
    });

    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: Number(avgFrameTime.toFixed(2)),
      systems
    };

    const perf = window.performance as any;
    if (perf && perf.memory) {
      metrics.memoryUsage = Number((perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2));
    }

    return metrics;
  }
}
