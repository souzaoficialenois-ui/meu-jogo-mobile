import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

export class KeyboardManager {
    private static instance: KeyboardManager;
    public isKeyboardOpen: boolean = false;
    public isInitialized: boolean = false;
    
    private originalHeight: number = 0;
    private resizeTimeout: any = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.originalHeight = window.innerHeight;
            this.setupVisualViewport();
            this.setupCapacitor();
        }
    }

    public static getInstance(): KeyboardManager {
        if (!KeyboardManager.instance) {
            KeyboardManager.instance = new KeyboardManager();
        }
        return KeyboardManager.instance;
    }

    public init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        // The constructor handles setup, this is just to instantiate if needed early.
    }

    private setupVisualViewport() {
        if (!window.visualViewport) return;

        window.visualViewport.addEventListener('resize', this.handleViewportResize.bind(this));
        
        // Anti layout break: prevent any external height modifications
        window.addEventListener('resize', (e) => {
            if (this.isKeyboardOpen) {
                // Ignore standard resize if keyboard is open
                e.preventDefault();
                e.stopPropagation();
            } else {
                // Debounce valid resizes
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    if (window.innerHeight > this.originalHeight * 0.8) {
                        this.originalHeight = window.innerHeight;
                    }
                }, 200);
            }
        }, { capture: true });
    }

    private handleViewportResize() {
        if (!window.visualViewport) return;

        // Detect if height reduced significantly (keyboard open)
        if (window.visualViewport.height < this.originalHeight * 0.85) {
            this.isKeyboardOpen = true;
            document.body.classList.add('keyboard-open');
        } else {
            this.isKeyboardOpen = false;
            document.body.classList.remove('keyboard-open');
        }

        // Force viewport to top when keyboard opens to prevent scrolling
        if (this.isKeyboardOpen) {
            window.scrollTo(0, 0);
        }
    }

    private async setupCapacitor() {
        try {
            if (Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web') {
                if (Capacitor.isPluginAvailable('Keyboard')) {
                    await Keyboard.setResizeMode({
                        mode: KeyboardResize.None
                    });
                }
            }
        } catch (e) {
            console.warn("Keyboard plugin not initialized", e);
        }
    }
}
