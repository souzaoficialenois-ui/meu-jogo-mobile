import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './error_handler';

export interface AppConfigData {
    game_version: string;
    maintenance_mode?: boolean;
    update_url: string;

    // Backward compatibility mappings
    currentVersion?: string;
    forceUpdate?: boolean;
    maintenance?: boolean;
    updateMessage?: string;
    downloadUrl?: string;
}

export class APIManager {
    static async getAppConfig(): Promise<AppConfigData | null> {
        try {
            const docRef = doc(db, 'system_config', 'app_version');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const game_version = data.game_version || '1.0.0';
                const maintenance_mode = data.maintenance_mode || false;
                const update_url = data.update_url || 'https://site.com/download';

                return {
                    game_version,
                    maintenance_mode,
                    update_url,
                    currentVersion: game_version,
                    forceUpdate: true,
                    maintenance: maintenance_mode,
                    downloadUrl: update_url,
                    updateMessage: "Atualize o jogo para a versão mais recente para continuar jogando."
                } as AppConfigData;
            }
            return null;
        } catch (error: any) {
            console.warn("APIManager getAppConfig warning:", error);
            return null;
        }
    }
    
    static async setAppConfig(config: AppConfigData): Promise<void> {
        try {
            const docRef = doc(db, 'system_config', 'app_version');
            const dataToSave = {
                game_version: config.game_version || config.currentVersion || '1.0.0',
                maintenance_mode: config.maintenance_mode !== undefined ? config.maintenance_mode : (config.maintenance || false),
                update_url: config.update_url || config.downloadUrl || 'https://site.com/download'
            };
            await setDoc(docRef, dataToSave);
        } catch (error) {
            console.error("APIManager setAppConfig error:", error);
            throw error;
        }
    }
}
