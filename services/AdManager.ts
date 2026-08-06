import { AudioManager } from './AudioManager';

export interface AdReward {
    type: 'COINS' | 'GEMS' | 'ROOM_TOKEN' | 'TICKET';
    amount: number;
}

export const ADMOB_CONFIG = {
    PUBLISHER_ID: 'ca-pub-9449841612546705',
    APP_ID: 'ca-app-pub-9449841612546705~8608794937',
    REWARDED_VIDEO_UNIT_ID: 'ca-app-pub-9449841612546705/8608794937'
};

export class AdManager {
    private static instance: AdManager;
    private activeModalCallback: ((reward: AdReward | null) => void) | null = null;
    private isAdShowing = false;

    private constructor() {}

    public static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    public getDailyAdCount(): number {
        const today = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem(`fighter_legend_ads_${today}`);
        return saved ? parseInt(saved, 10) : 0;
    }

    public incrementDailyAdCount(): void {
        const today = new Date().toISOString().split('T')[0];
        const current = this.getDailyAdCount();
        localStorage.setItem(`fighter_legend_ads_${today}`, (current + 1).toString());
    }

    public canWatchAd(maxDaily: number = 10): boolean {
        return this.getDailyAdCount() < maxDaily;
    }

    public setAdCallback(cb: ((reward: AdReward | null) => void) | null) {
        this.activeModalCallback = cb;
    }

    public triggerReward(reward: AdReward | null) {
        if (this.activeModalCallback) {
            this.activeModalCallback(reward);
            this.activeModalCallback = null;
        }
        this.isAdShowing = false;
    }

    public isShowing(): boolean {
        return this.isAdShowing;
    }

    public setIsShowing(showing: boolean) {
        this.isAdShowing = showing;
    }
}
