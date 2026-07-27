import { RemoteConfigService } from './RemoteConfigService';
import { APP_VERSION } from '../constants';

export class VersionChecker {
    static isUpdateRequired(): boolean {
        const config = RemoteConfigService.getConfig();
        // The rule says EXACTLY equal. String comparison is enough for equality.
        return APP_VERSION !== config.game_version;
    }

    static isForceUpdate(): boolean {
        return this.isUpdateRequired();
    }
}
