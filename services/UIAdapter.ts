
export class UIAdapter {
  public static readonly BASE_WIDTH = 1280;
  public static readonly BASE_HEIGHT = 720;

  private static scale: number = 1;
  private static offsetX: number = 0;
  private static offsetY: number = 0;
  private static canvasWidth: number = 1280;
  private static canvasHeight: number = 720;
  private static screenWidth: number = 1280;
  private static screenHeight: number = 720;

  /**
   * Updates the scaling factors based on current window/canvas dimensions.
   */
  public static update(currentWidth: number, currentHeight: number) {
    this.screenWidth = currentWidth;
    this.screenHeight = currentHeight;
    this.canvasWidth = currentWidth;
    this.canvasHeight = currentHeight;

    // We use 1280x720 as the base reference
    const baseRatio = this.BASE_WIDTH / this.BASE_HEIGHT;
    const currentRatio = currentWidth / currentHeight;

    if (currentRatio > baseRatio) {
      // Screen is wider than 16:9 (ultrawide, most modern phones)
      this.scale = currentHeight / this.BASE_HEIGHT;
    } else {
      // Screen is narrower than 16:9 (tablets, older phones)
      this.scale = currentWidth / this.BASE_WIDTH;
    }

    // Centering offsets
    this.offsetX = (currentWidth - (this.BASE_WIDTH * this.scale)) / 2;
    this.offsetY = (currentHeight - (this.BASE_HEIGHT * this.scale)) / 2;
  }

  /**
   * Scale a value from 1280x720 base to current screen.
   */
  public static s(value: number): number {
    return value * this.scale;
  }

  /**
   * Converts a base coordinate (0-1280) to the current screen coordinate.
   */
  public static scaleX(x: number): number {
    return this.offsetX + (x * this.scale);
  }

  /**
   * Converts a base coordinate (0-720) to the current screen coordinate.
   */
  public static scaleY(y: number): number {
    return this.offsetY + (y * this.scale);
  }

  /**
   * Scales a value (like width, height, or font size) without applying offsets.
   */
  public static scaleValue(value: number): number {
    return value * this.scale;
  }

  /**
   * Returns the current global scale factor.
   */
  public static getScale(): number {
    return this.scale;
  }

  /**
   * Returns the safe area offsets (could be integrated with browser API in the future)
   */
  public static getOffsets() {
    return { x: this.offsetX, y: this.offsetY };
  }

  /**
   * Adaptive positioning for anchored elements.
   * @param x Base X coordinate
   * @param y Base Y coordinate
   * @param anchor "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
   */
  public static getPos(x: number, y: number, anchor: string = "top-left") {
    switch (anchor) {
      case "top-right":
        // x is distance from the right edge in base resolution
        return { x: this.canvasWidth - this.offsetX - ((this.BASE_WIDTH - x) * this.scale), y: this.scaleY(y) };
      case "bottom-left":
        return { x: this.scaleX(x), y: this.canvasHeight - this.offsetY - ((this.BASE_HEIGHT - y) * this.scale) };
      case "bottom-right":
        return { 
          x: this.canvasWidth - this.offsetX - ((this.BASE_WIDTH - x) * this.scale), 
          y: this.canvasHeight - this.offsetY - ((this.BASE_HEIGHT - y) * this.scale) 
        };
      case "center":
        return {
          x: (this.canvasWidth / 2) + ((x - this.BASE_WIDTH / 2) * this.scale),
          y: (this.canvasHeight / 2) + ((y - this.BASE_HEIGHT / 2) * this.scale)
        };
      default:
        return { x: this.scaleX(x), y: this.scaleY(y) };
    }
  }
}
