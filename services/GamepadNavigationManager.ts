import { AudioManager } from './AudioManager';

export class GamepadNavigationManager {
    private static instance: GamepadNavigationManager | null = null;
    
    private active: boolean = false;
    private gamepadMode: boolean = false;
    private currentFocused: HTMLElement | null = null;
    private animationFrameId: number | null = null;
    
    // Cool-down and repeat states for inputs
    private lastActionTimes: Record<string, number> = {};
    private repeatIntervals: Record<string, number> = {};
    private defaultRepeatDelay = 350; // ms before first repeat
    private defaultRepeatRate = 120;  // ms between subsequent repeats

    // Memory to persist selection by screen names or routes
    private screenMemory: Record<string, string> = {}; // key: scene/screen name, value: selector or text content

    private constructor() {
        if (typeof window !== 'undefined') {
            this.setupListeners();
        }
    }

    public static getInstance(): GamepadNavigationManager {
        if (!GamepadNavigationManager.instance) {
            GamepadNavigationManager.instance = new GamepadNavigationManager();
        }
        return GamepadNavigationManager.instance;
    }

    /**
     * Start the Gamepad Navigation Service
     */
    public start() {
        if (this.active) return;
        this.active = true;
        this.gamepadMode = false;
        this.startLoop();
    }

    /**
     * Stop the Gamepad Navigation Service
     */
    public stop() {
        this.active = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.clearFocus();
    }

    private setupListeners() {
        // Toggle input modes seamlessly: mouse move, touch or keydown turns off gamepad highlight
        const deactivateGamepadMode = () => {
            if (this.gamepadMode) {
                this.gamepadMode = false;
                this.removeVisualFocus();
            }
        };

        window.addEventListener('mousemove', deactivateGamepadMode, { passive: true });
        window.addEventListener('mousedown', deactivateGamepadMode, { passive: true });
        window.addEventListener('touchstart', deactivateGamepadMode, { passive: true });
        window.addEventListener('keydown', (e) => {
            const active = document.activeElement as HTMLElement | null;
            const target = e.target as HTMLElement | null;
            const isInput = (el: HTMLElement | null) => !!(el && (
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.tagName === 'SELECT' ||
                el.isContentEditable
            ));

            if (isInput(active) || isInput(target)) {
                return;
            }

            // Keyboard arrows can also trigger gamepad-like keyboard navigation!
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
                if (!this.gamepadMode) {
                    this.gamepadMode = true;
                    this.syncFocus();
                }
                this.handleKeyboardNav(e);
            }
        });
    }

    private startLoop() {
        const loop = () => {
            if (!this.active) return;
            this.pollGamepads();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    private pollGamepads() {
        if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

        const gps = navigator.getGamepads();
        if (!gps) return;

        const now = Date.now();

        for (let i = 0; i < gps.length; i++) {
            const gp = gps[i];
            if (!gp || !gp.connected) continue;

            // 1. Read D-pad (buttons 12, 13, 14, 15) and Left Analog stick (axes 0, 1)
            const upPressed = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
            const downPressed = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
            const leftPressed = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
            const rightPressed = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;

            // 2. Read Confirm/Back/Menu Buttons
            const confirmPressed = gp.buttons[0]?.pressed; // A / X
            const backPressed = gp.buttons[1]?.pressed;    // B / Circle
            const startPressed = gp.buttons[9]?.pressed;   // Start
            const selectPressed = gp.buttons[8]?.pressed;  // Select

            // Handle directional movements with repeat rate
            if (upPressed) this.triggerDirectionalAction('up', () => this.navigate('up'), now);
            else this.clearDirectionalAction('up');

            if (downPressed) this.triggerDirectionalAction('down', () => this.navigate('down'), now);
            else this.clearDirectionalAction('down');

            if (leftPressed) this.triggerDirectionalAction('left', () => this.navigate('left'), now);
            else this.clearDirectionalAction('left');

            if (rightPressed) this.triggerDirectionalAction('right', () => this.navigate('right'), now);
            else this.clearDirectionalAction('right');

            // Handle functional clicks on positive edge (press down once, wait for release)
            if (confirmPressed) {
                this.triggerFunctionalAction('confirm', () => this.triggerClick(), now);
            } else {
                this.clearFunctionalAction('confirm');
            }

            if (backPressed) {
                this.triggerFunctionalAction('back', () => this.triggerBack(), now);
            } else {
                this.clearFunctionalAction('back');
            }

            if (startPressed) {
                this.triggerFunctionalAction('start', () => this.triggerSecondaryMenu(), now);
            } else {
                this.clearFunctionalAction('start');
            }

            if (selectPressed) {
                this.triggerFunctionalAction('select', () => this.triggerExtraAction(), now);
            } else {
                this.clearFunctionalAction('select');
            }
        }
    }

    private triggerDirectionalAction(dir: string, action: () => void, now: number) {
        if (!this.gamepadMode) {
            this.gamepadMode = true;
            this.syncFocus();
            this.lastActionTimes[dir] = now;
            return;
        }

        const lastTime = this.lastActionTimes[dir] || 0;
        const isRepeating = this.repeatIntervals[dir] || false;

        if (lastTime === 0) {
            // First press
            action();
            this.lastActionTimes[dir] = now;
        } else {
            const elapsed = now - lastTime;
            const threshold = isRepeating ? this.defaultRepeatRate : this.defaultRepeatDelay;
            if (elapsed >= threshold) {
                action();
                this.lastActionTimes[dir] = now;
                this.repeatIntervals[dir] = 1; // Mark as repeating
            }
        }
    }

    private clearDirectionalAction(dir: string) {
        delete this.lastActionTimes[dir];
        delete this.repeatIntervals[dir];
    }

    private triggerFunctionalAction(btn: string, action: () => void, now: number) {
        if (!this.gamepadMode) {
            this.gamepadMode = true;
            this.syncFocus();
            this.lastActionTimes[btn] = now;
            return;
        }

        const lastTime = this.lastActionTimes[btn] || 0;
        if (lastTime === 0) {
            action();
            this.lastActionTimes[btn] = now;
        }
    }

    private clearFunctionalAction(btn: string) {
        delete this.lastActionTimes[btn];
    }

    private handleKeyboardNav(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') this.navigate('up');
        else if (e.key === 'ArrowDown') this.navigate('down');
        else if (e.key === 'ArrowLeft') this.navigate('left');
        else if (e.key === 'ArrowRight') this.navigate('right');
        else if (e.key === 'Enter') this.triggerClick();
        else if (e.key === 'Escape') this.triggerBack();
        
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Get all currently visible focusable elements in the active screen
     */
    private getNavigableElements(): HTMLElement[] {
        if (typeof document === 'undefined') return [];

        // Query candidates
        const candidates = document.querySelectorAll<HTMLElement>(
            'button, a, input, select, textarea, [tabindex="0"], [role="button"], .cursor-pointer, [data-gamepad-nav]'
        );

        const navigable: HTMLElement[] = [];

        candidates.forEach((el) => {
            // 1. Filter out hidden or non-interactive elements
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
            if (style.pointerEvents === 'none') {
                // If the element has pointer-events: none, but has specific gamepad override, let it pass
                if (!el.hasAttribute('data-gamepad-nav')) return;
            }

            // 2. Check bounding size
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            // 3. Check if element is disabled
            if ((el as any).disabled || el.getAttribute('aria-disabled') === 'true') return;

            // Avoid duplicating nested children if both are interactive
            if (navigable.some((existing) => existing.contains(el) || el.contains(existing))) {
                // If el is contained inside an existing navigable element, prefer the outer navigable wrapper
                if (navigable.some((existing) => existing.contains(el))) return;
            }

            navigable.push(el);
        });

        return navigable;
    }

    /**
     * Focus default or stored element
     */
    private syncFocus() {
        const elements = this.getNavigableElements();
        if (elements.length === 0) return;

        // Try to recover the last focused element on this screen or view
        let target: HTMLElement | null = null;

        // Check if we can find an element with standard autofoci or default class
        target = document.querySelector('[data-gamepad-default="true"]') ||
                 document.querySelector('[autofocus]') ||
                 elements.find(el => el.classList.contains('dragon-button')) ||
                 elements[0];

        if (target) {
            this.setFocus(target);
        }
    }

    /**
     * Spatial Navigation core calculation
     */
    private navigate(direction: 'up' | 'down' | 'left' | 'right') {
        const elements = this.getNavigableElements();
        if (elements.length === 0) return;

        if (!this.currentFocused || !document.body.contains(this.currentFocused)) {
            this.syncFocus();
            return;
        }

        const rectA = this.currentFocused.getBoundingClientRect();
        const centerA = {
            x: rectA.left + rectA.width / 2,
            y: rectA.top + rectA.height / 2
        };

        let bestCandidate: HTMLElement | null = null;
        let lowestScore = Infinity;

        // Spatial Search passes: 
        // 1. Strict Cone (orthogonal <= principal * 1.5)
        // 2. Relaxed Cone (orthogonal <= principal * 3.0)
        // 3. Wide Half-Plane (principal > 0)
        const passes = [1.5, 3.0, Infinity];

        for (const threshold of passes) {
            for (const el of elements) {
                if (el === this.currentFocused) continue;

                const rectB = el.getBoundingClientRect();
                const centerB = {
                    x: rectB.left + rectB.width / 2,
                    y: rectB.top + rectB.height / 2
                };

                const dx = centerB.x - centerA.x;
                const dy = centerB.y - centerA.y;

                let principal = 0;
                let orthogonal = 0;
                let directionMatched = false;

                switch (direction) {
                    case 'right':
                        principal = dx;
                        orthogonal = Math.abs(dy);
                        directionMatched = dx > 2; // small offset to prevent micro-overlaps
                        break;
                    case 'left':
                        principal = -dx;
                        orthogonal = Math.abs(dy);
                        directionMatched = dx < -2;
                        break;
                    case 'down':
                        principal = dy;
                        orthogonal = Math.abs(dx);
                        directionMatched = dy > 2;
                        break;
                    case 'up':
                        principal = -dy;
                        orthogonal = Math.abs(dx);
                        directionMatched = dy < -2;
                        break;
                }

                if (directionMatched) {
                    // Check if orthogonal deviation is within the current pass's threshold
                    if (threshold === Infinity || orthogonal <= principal * threshold) {
                        const score = principal + 2 * orthogonal;
                        if (score < lowestScore) {
                            lowestScore = score;
                            bestCandidate = el;
                        }
                    }
                }
            }

            // If we found a candidate in this pass, we stop searching
            if (bestCandidate) break;
        }

        // Apply fallback wrap-around for menus/lists if no candidates in that half-plane
        if (!bestCandidate) {
            // Find the element furthest in the opposite direction
            let furthestValue = -Infinity;
            for (const el of elements) {
                if (el === this.currentFocused) continue;
                const rectB = el.getBoundingClientRect();
                const centerB = {
                    x: rectB.left + rectB.width / 2,
                    y: rectB.top + rectB.height / 2
                };

                let val = 0;
                switch (direction) {
                    case 'right': val = -centerB.x; break; // lowest X
                    case 'left': val = centerB.x; break;   // highest X
                    case 'down': val = -centerB.y; break; // lowest Y
                    case 'up': val = centerB.y; break;   // highest Y
                }

                if (val > furthestValue) {
                    furthestValue = val;
                    bestCandidate = el;
                }
            }
        }

        if (bestCandidate) {
            this.setFocus(bestCandidate);
            // Play directional click sound
            try {
                AudioManager.getInstance().playSFX('click');
            } catch (e) {
                // Ignore silent audio errors
            }
        }
    }

    private setFocus(el: HTMLElement) {
        this.removeVisualFocus();
        this.currentFocused = el;
        
        if (this.gamepadMode) {
            el.classList.add('gamepad-focused');
            el.focus();
            
            // Smoothly center or bring the item into view
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    private removeVisualFocus() {
        if (this.currentFocused) {
            this.currentFocused.classList.remove('gamepad-focused');
        }
    }

    private clearFocus() {
        this.removeVisualFocus();
        this.currentFocused = null;
    }

    private safeClick(el: Element | null) {
        if (!el) return;
        if (typeof (el as any).click === 'function') {
            (el as any).click();
        } else {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            el.dispatchEvent(clickEvent);
        }
    }

    /**
     * Trigger a physical or virtual click on the active element
     */
    private triggerClick() {
        const el = this.currentFocused;
        if (!el || !document.body.contains(el)) return;

        // Perform visual flash or scales
        el.classList.add('gamepad-clicked');
        setTimeout(() => el.classList.remove('gamepad-clicked'), 150);

        // Click element safely
        this.safeClick(el);

        // Play confirm sound
        try {
            AudioManager.getInstance().playSFX('confirm');
        } catch (e) {
            // Ignore sound errors
        }
    }

    /**
     * Handle global B / Back Action
     */
    private triggerBack() {
        // Find any visible exit/back button
        const backButtons = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]'))
            .filter((btn) => {
                const style = window.getComputedStyle(btn);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
                
                const text = (btn.textContent || '').toUpperCase();
                const ariaLabel = (btn.getAttribute('aria-label') || '').toUpperCase();
                const classStr = (typeof btn.className === 'string' ? btn.className : (btn.getAttribute('class') || '')).toUpperCase();
                const idStr = (btn.id || '').toUpperCase();
                const gamepadAttr = btn.getAttribute('data-gamepad-back');

                return (
                    gamepadAttr === 'true' ||
                    text.includes('VOLTAR') ||
                    text.includes('BACK') ||
                    text.includes('SAIR') ||
                    text.includes('CANCEL') ||
                    ariaLabel.includes('BACK') ||
                    ariaLabel.includes('VOLTAR') ||
                    ariaLabel.includes('CLOSE') ||
                    classStr.includes('BACK') ||
                    idStr.includes('BACK') ||
                    idStr.includes('CLOSE')
                );
            });

        if (backButtons.length > 0) {
            // Click the back/close button
            const bestBackBtn = backButtons[0];
            bestBackBtn.classList.add('gamepad-clicked');
            setTimeout(() => bestBackBtn.classList.remove('gamepad-clicked'), 150);
            this.safeClick(bestBackBtn);
            try {
                AudioManager.getInstance().playSFX('cancel');
            } catch (e) {}
        } else {
            // Fallback: Dispatch Escape key event
            const escEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(escEvent);
        }
    }

    private triggerSecondaryMenu() {
        // Simulate click on pause button if we're in battle or similar screens
        const pauseBtn = document.querySelector<HTMLElement>('[data-gamepad-pause="true"]') || 
                         document.querySelector<HTMLElement>('.pause-button');
        if (pauseBtn) {
            this.safeClick(pauseBtn);
        }
    }

    private triggerExtraAction() {
        // Custom secondary action
        const extraBtn = document.querySelector<HTMLElement>('[data-gamepad-extra="true"]');
        if (extraBtn) {
            this.safeClick(extraBtn);
        }
    }
}
