import React from 'react';
import { Bell } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';

interface NotificationsTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    isPt: boolean;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ settings, handleToggle, isPt }) => (
    <div className="space-y-8">
        <PanelCard title={isPt ? 'Alertas do Jogo' : 'Game Alerts'} subtitle={isPt ? 'Configure avisos e lembretes' : 'Setup warnings and reminders'} icon={Bell}>
            <SettingRow label={isPt ? 'Notificações Push' : 'Push Notifications'} description={isPt ? 'Receba alertas de eventos e recompensas' : 'Get alerts about events and rewards'}>
                <Toggle active={settings.notificationsEnabled} onToggle={() => handleToggle('notificationsEnabled')} />
            </SettingRow>
            <SettingRow label={isPt ? 'Sons de Alerta' : 'Alert Sounds'} description={isPt ? 'Habilita bips e sons de sistema' : 'Enables beeps and system sounds'}>
                <Toggle active={settings.notificationSounds} onToggle={() => handleToggle('notificationSounds')} />
            </SettingRow>
        </PanelCard>
    </div>
);
