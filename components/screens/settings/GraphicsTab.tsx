import React from 'react';
import { Monitor, Sparkles } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';
import { AudioManager } from '../../../services/AudioManager';

interface GraphicsTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    updateSettings: (s: any) => void;
    isPt: boolean;
}

export const GraphicsTab: React.FC<GraphicsTabProps> = ({ settings, handleToggle, updateSettings, isPt }) => {
    const applyPreset = (preset: 'low' | 'medium' | 'high' | 'ultra') => {
        AudioManager.getInstance().playSFX('confirm');
        switch (preset) {
            case 'low':
                updateSettings({
                    particlesEnabled: false,
                    postProcessingEnabled: false,
                    shadowsEnabled: false,
                    weatherEffects: false,
                    stageDestruction: false
                });
                break;
            case 'medium':
                updateSettings({
                    particlesEnabled: true,
                    postProcessingEnabled: false,
                    shadowsEnabled: false,
                    weatherEffects: true,
                    stageDestruction: false
                });
                break;
            case 'high':
                updateSettings({
                    particlesEnabled: true,
                    postProcessingEnabled: true,
                    shadowsEnabled: true,
                    weatherEffects: true,
                    stageDestruction: true
                });
                break;
            case 'ultra':
                updateSettings({
                    particlesEnabled: true,
                    postProcessingEnabled: true,
                    shadowsEnabled: true,
                    weatherEffects: true,
                    stageDestruction: true
                });
                break;
        }
    };

    return (
        <div className="space-y-8">
            <PanelCard title={isPt ? 'Presets de Qualidade' : 'Quality Presets'} subtitle={isPt ? 'Configuração rápida de desempenho' : 'Quick performance configuration'} icon={Sparkles}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    {(['low', 'medium', 'high', 'ultra'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => applyPreset(p)}
                            className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                                // Logic to detect if current settings match a preset could be complex, 
                                // so we'll just highlight based on a "virtual" selection or just leave as buttons.
                                'bg-stone-900/40 border-white/5 hover:border-orange-500/50 text-stone-400 hover:text-white'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </PanelCard>

            <PanelCard title={isPt ? 'Qualidade Visual' : 'Visual Quality'} subtitle={isPt ? 'Ajuste o desempenho e fidelidade visual' : 'Adjust performance and visual fidelity'} icon={Monitor}>
                <SettingRow label={isPt ? 'Efeitos de Partículas' : 'Particle Effects'} description={isPt ? 'Habilita faíscas e efeitos de aura complexos' : 'Enables complex aura and sparks effects'}>
                    <Toggle active={settings.particlesEnabled} onToggle={() => handleToggle('particlesEnabled')} />
                </SettingRow>
                <SettingRow label={isPt ? 'Pós-Processamento' : 'Post-Processing'} description={isPt ? 'Habilita filtros de imagem e correção de cor' : 'Enables image filters and color correction'}>
                    <Toggle active={settings.postProcessingEnabled} onToggle={() => handleToggle('postProcessingEnabled')} />
                </SettingRow>
                <SettingRow label={isPt ? 'Sombras Dinâmicas' : 'Dynamic Shadows'} description={isPt ? 'Habilita sombras em tempo real nos cenários' : 'Enables real-time shadows in stages'}>
                    <Toggle active={settings.shadowsEnabled} onToggle={() => handleToggle('shadowsEnabled')} />
                </SettingRow>
            </PanelCard>

            <PanelCard title={isPt ? 'Ambiente' : 'Environment'} subtitle={isPt ? 'Configurações de clima e cenário' : 'Weather and stage settings'} icon={Sparkles}>
                <SettingRow label={isPt ? 'Clima Dinâmico' : 'Dynamic Weather'} description={isPt ? 'Habilita chuva, neve e efeitos climáticos' : 'Enables rain, snow and weather effects'}>
                    <Toggle active={settings.weatherEffects} onToggle={() => handleToggle('weatherEffects')} />
                </SettingRow>
                <SettingRow label={isPt ? 'Destruição de Cenário' : 'Stage Destruction'} description={isPt ? 'Habilita danos persistentes no mapa' : 'Enables persistent damage to the map'}>
                    <Toggle active={settings.stageDestruction} onToggle={() => handleToggle('stageDestruction')} />
                </SettingRow>
            </PanelCard>
        </div>
    );
};
