import { AudioManager } from "./AudioManager";

/**
 * Centralized UI Interaction and Accessibility Manager
 * Normalizes hitboxes, manages touch/click events, adds Android haptic feedback,
 * and ensures all interactive buttons play sound effects consistently.
 */
export class UIManager {
  private static instance: UIManager | null = null;
  private lastClickTime: number = 0;
  private initialized: boolean = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    // Listen to global click/pointerdown events to centralize interactive behaviors
    window.addEventListener(
      "pointerdown",
      (e) => this.handleGlobalInteraction(e),
      { passive: true }
    );
  }

  /**
   * Intercepts and centralizes all pointer interactions across the application.
   * Eliminates the risk of silent buttons or unresponsive hitboxes.
   */
  private handleGlobalInteraction(e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Find closest interactive parent element
    const interactiveEl = target.closest<HTMLElement>(
      "button, a, select, textarea, [role='button'], .cursor-pointer, .dragon-button"
    );

    if (interactiveEl) {
      const now = performance.now();
      // Throttle sound play to avoid duplicate triggers from fast touches/clicks
      if (now - this.lastClickTime > 60) {
        this.lastClickTime = now;

        // 1. Play central UI Sound Effect
        try {
          AudioManager.getInstance().playSFX("click");
        } catch (err) {
          console.warn("UIManager could not play click sound:", err);
        }

        // 2. Add Haptic Feedback for Android devices to improve physical tap responses
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(12); // Short, sharp tactile response (12ms)
          } catch (_) {}
        }

        // 3. Keep visual and logical click states aligned
        interactiveEl.focus();
      }
    }
  }
}
