import React from 'react';
import { Monitor, Sparkles, Sliders, ShieldAlert, Cpu, Zap, Eye, Flame, Layers } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';
import { AudioManager } from '../../../services/AudioManager';

interface GraphicsTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    updateSettings: (s: any) => void;
    isPt: boolean;
}

export interface PresetConfig {
    key: 'very_low' | 'low' | 'medium' | 'high' | 'ultra';
    qualityKey: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
    labelPt: string;
    labelEn: string;
    badgePt: string;
    badgeEn: string;
    descPt: string;
    descEn: string;
    config: {
        shadowsEnabled: boolean;
        shadowType: 'NONE' | 'OVAL' | 'SILHOUETTE';
        lightingType: 'NONE' | 'BASIC' | 'ADVANCED' | 'DYNAMIC';
        particlesEnabled: boolean;
        particleDensity: 'DISABLED' | 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX';
        fullAuras: boolean;
        energyDistortion: boolean;
        glowQuality: 'DISABLED' | 'NORMAL' | 'ULTRA';
        auraGlowQuality: 'DISABLED' | 'NORMAL' | 'ULTRA';
        effectsLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';
        postProcessingEnabled: boolean;
        weatherEffects: boolean;
        stageDestruction: boolean;
        screenShakeEnabled: boolean;
        showDamageNumbers: boolean;
    };
}

export const PRESET_CONFIGS: Record<string, PresetConfig> = {
    very_low: {
        key: 'very_low',
        qualityKey: 'VERY_LOW',
        labelPt: 'Muito Baixo',
        labelEn: 'Very Low',
        badgePt: 'FOCO EM DESEMPENHO',
        badgeEn: 'MAX PERFORMANCE',
        descPt: 'Sem sombras, sem iluminação, poucas partículas. Foco total em desempenho.',
        descEn: 'No shadows, no lighting, few particles. Maximum performance focus.',
        config: {
            shadowsEnabled: false,
            shadowType: 'NONE',
            lightingType: 'NONE',
            particlesEnabled: false,
            particleDensity: 'DISABLED',
            fullAuras: false,
            energyDistortion: false,
            glowQuality: 'DISABLED',
            auraGlowQuality: 'DISABLED',
            effectsLevel: 'LOW',
            postProcessingEnabled: false,
            weatherEffects: false,
            stageDestruction: false,
            screenShakeEnabled: false,
            showDamageNumbers: true,
        },
    },
    low: {
        key: 'low',
        qualityKey: 'LOW',
        labelPt: 'Baixo',
        labelEn: 'Low',
        badgePt: 'ECONOMIA',
        badgeEn: 'BALANCED LOW',
        descPt: 'Sombras ovais, poucos efeitos e partículas reduzidas.',
        descEn: 'Oval shadows, few effects and reduced particles.',
        config: {
            shadowsEnabled: true,
            shadowType: 'OVAL',
            lightingType: 'NONE',
            particlesEnabled: true,
            particleDensity: 'LOW',
            fullAuras: false,
            energyDistortion: false,
            glowQuality: 'DISABLED',
            auraGlowQuality: 'DISABLED',
            effectsLevel: 'LOW',
            postProcessingEnabled: false,
            weatherEffects: false,
            stageDestruction: false,
            screenShakeEnabled: true,
            showDamageNumbers: true,
        },
    },
    medium: {
        key: 'medium',
        qualityKey: 'MEDIUM',
        labelPt: 'Médio',
        labelEn: 'Medium',
        badgePt: 'EQUILIBRADO',
        badgeEn: 'RECOMMENDED',
        descPt: 'Sombras ovais, iluminação básica e efeitos equilibrados.',
        descEn: 'Oval shadows, basic lighting and balanced effects.',
        config: {
            shadowsEnabled: true,
            shadowType: 'OVAL',
            lightingType: 'BASIC',
            particlesEnabled: true,
            particleDensity: 'MEDIUM',
            fullAuras: false,
            energyDistortion: false,
            glowQuality: 'NORMAL',
            auraGlowQuality: 'NORMAL',
            effectsLevel: 'MEDIUM',
            postProcessingEnabled: false,
            weatherEffects: true,
            stageDestruction: false,
            screenShakeEnabled: true,
            showDamageNumbers: true,
        },
    },
    high: {
        key: 'high',
        qualityKey: 'HIGH',
        labelPt: 'Alto',
        labelEn: 'High',
        badgePt: 'ALTA QUALIDADE',
        badgeEn: 'HIGH QUALITY',
        descPt: 'Mais partículas, iluminação avançada e efeitos completos.',
        descEn: 'More particles, advanced lighting and complete effects.',
        config: {
            shadowsEnabled: true,
            shadowType: 'OVAL',
            lightingType: 'ADVANCED',
            particlesEnabled: true,
            particleDensity: 'HIGH',
            fullAuras: true,
            energyDistortion: false,
            glowQuality: 'NORMAL',
            auraGlowQuality: 'NORMAL',
            effectsLevel: 'HIGH',
            postProcessingEnabled: true,
            weatherEffects: true,
            stageDestruction: true,
            screenShakeEnabled: true,
            showDamageNumbers: true,
        },
    },
    ultra: {
        key: 'ultra',
        qualityKey: 'ULTRA',
        labelPt: 'Ultra',
        labelEn: 'Ultra',
        badgePt: 'FIDELIDADE MÁXIMA',
        badgeEn: 'ULTRA FIDELITY',
        descPt: 'Sombras em silhueta, auras completas, iluminação dinâmica, distorção de energia, brilho contornado ultra, partículas no máximo e todos os efeitos visuais ativados.',
        descEn: 'Silhouette shadows, full auras, dynamic lighting, energy distortion, ultra glow outline, max particles and all visual effects enabled.',
        config: {
            shadowsEnabled: true,
            shadowType: 'SILHOUETTE',
            lightingType: 'DYNAMIC',
            particlesEnabled: true,
            particleDensity: 'MAX',
            fullAuras: true,
            energyDistortion: true,
            glowQuality: 'ULTRA',
            auraGlowQuality: 'ULTRA',
            effectsLevel: 'FULL',
            postProcessingEnabled: true,
            weatherEffects: true,
            stageDestruction: true,
            screenShakeEnabled: true,
            showDamageNumbers: true,
        },
    },
};

export const GraphicsTab: React.FC<GraphicsTabProps> = ({ settings, handleToggle, updateSettings, isPt }) => {
    // Check if current settings match any preset
    const checkCurrentPreset = (): 'very_low' | 'low' | 'medium' | 'high' | 'ultra' | 'custom' => {
        const keys = [
            'shadowsEnabled',
            'shadowType',
            'lightingType',
            'particlesEnabled',
            'particleDensity',
            'fullAuras',
            'energyDistortion',
            'glowQuality',
            'auraGlowQuality',
            'effectsLevel',
            'postProcessingEnabled',
            'weatherEffects',
            'stageDestruction',
            'screenShakeEnabled',
            'showDamageNumbers',
        ] as const;

        for (const preset of Object.values(PRESET_CONFIGS)) {
            let match = true;
            for (const key of keys) {
                const currentVal = settings[key];
                const presetVal = preset.config[key];
                if (currentVal !== presetVal) {
                    match = false;
                    break;
                }
            }
            if (match) return preset.key;
        }

        if (settings.graphicsQuality && settings.graphicsQuality !== 'CUSTOM') {
            const mappedKey = settings.graphicsQuality.toLowerCase() as any;
            if (PRESET_CONFIGS[mappedKey]) return mappedKey;
        }

        return 'custom';
    };

    const activePresetKey = checkCurrentPreset();

    const applyPreset = (presetKey: 'very_low' | 'low' | 'medium' | 'high' | 'ultra' | 'custom') => {
        AudioManager.getInstance().playSFX('confirm');
        if (presetKey === 'custom') {
            updateSettings({ graphicsQuality: 'CUSTOM' });
            return;
        }

        const preset = PRESET_CONFIGS[presetKey];
        updateSettings({
            graphicsQuality: preset.qualityKey,
            ...preset.config,
        });
    };

    const handleCustomValueChange = (key: string, value: any) => {
        const updatedSettings = { ...settings, [key]: value };

        // Check if matching a preset
        let matchedPreset: string | null = null;
        const keys = [
            'shadowsEnabled',
            'shadowType',
            'lightingType',
            'particlesEnabled',
            'particleDensity',
            'fullAuras',
            'energyDistortion',
            'glowQuality',
            'auraGlowQuality',
            'effectsLevel',
            'postProcessingEnabled',
            'weatherEffects',
            'stageDestruction',
            'screenShakeEnabled',
            'showDamageNumbers',
        ] as const;

        for (const preset of Object.values(PRESET_CONFIGS)) {
            let match = true;
            for (const k of keys) {
                const val = k === key ? value : updatedSettings[k];
                const presetVal = preset.config[k];
                if (val !== presetVal) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matchedPreset = preset.qualityKey;
                break;
            }
        }

        updateSettings({
            [key]: value,
            graphicsQuality: matchedPreset || 'CUSTOM',
        });
        AudioManager.getInstance().playSFX('click');
    };

    const activePresetInfo = PRESET_CONFIGS[activePresetKey];

    return (
        <div className="space-y-8 font-sans">
            {/* PRESETS SELECTION */}
            <PanelCard
                title={isPt ? 'Perfil Gráfico' : 'Graphics Profile'}
                subtitle={isPt ? 'Selecione um perfil pronto para desempenho ou fidelidade visual' : 'Select a preset profile for performance or visual fidelity'}
                icon={Sparkles}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-1">
                    {(['very_low', 'low', 'medium', 'high', 'ultra', 'custom'] as const).map((pKey) => {
                        const isSelected = activePresetKey === pKey;
                        const preset = PRESET_CONFIGS[pKey];
                        const label = pKey === 'custom' 
                            ? (isPt ? 'Personalizado' : 'Custom') 
                            : (isPt ? preset.labelPt : preset.labelEn);

                        return (
                            <button
                                key={pKey}
                                onClick={() => applyPreset(pKey)}
                                className={`relative py-4 px-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer overflow-hidden ${
                                    isSelected
                                        ? 'bg-gradient-to-b from-orange-500/20 to-orange-600/30 border-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.35)] scale-[1.03]'
                                        : 'bg-stone-900/40 border-white/5 hover:border-orange-500/40 text-stone-400 hover:text-white'
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                                )}
                                <span className="text-xs font-black italic tracking-wider">{label}</span>
                                <span className="text-[8px] opacity-70 font-bold tracking-widest">
                                    {isSelected ? (isPt ? '• ATIVO •' : '• ACTIVE •') : (isPt ? 'SELECIONAR' : 'SELECT')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Preset Summary Banner */}
                {activePresetInfo && (
                    <div className="mt-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black italic uppercase text-white text-sm">
                                        {isPt ? activePresetInfo.labelPt : activePresetInfo.labelEn}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                        {isPt ? activePresetInfo.badgePt : activePresetInfo.badgeEn}
                                    </span>
                                </div>
                                <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                                    {isPt ? activePresetInfo.descPt : activePresetInfo.descEn}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </PanelCard>

            {/* DETAILED GRAPHICS CONFIGURATION */}
            <PanelCard
                title={isPt ? 'Configurações Detalhadas' : 'Detailed Settings'}
                subtitle={isPt ? 'Ajuste individualmente os elementos visuais e de iluminação' : 'Finely adjust visual and lighting components'}
                icon={Monitor}
            >
                {/* SOMBRAS */}
                <SettingRow
                    label={isPt ? 'Perfil de Sombras' : 'Shadow Profile'}
                    description={isPt ? 'Sem sombras (Muito Baixo), Sombras Ovais (Baixo/Médio/Alto), Silhueta em Tempo Real (Ultra)' : 'No shadows (Very Low), Oval Shadows (Low/Medium/High), Real-time Silhouette (Ultra)'}
                >
                    <OptionSelector
                        options={[
                            { value: 'NONE', labelPt: 'Sem Sombras', labelEn: 'No Shadows' },
                            { value: 'OVAL', labelPt: 'Sombras Ovais', labelEn: 'Oval Shadows' },
                            { value: 'SILHOUETTE', labelPt: 'Silhueta Real', labelEn: 'Silhouette' },
                        ]}
                        currentValue={settings.shadowType || (settings.shadowsEnabled ? 'OVAL' : 'NONE')}
                        onChange={(val) => {
                            const shadowsOn = val !== 'NONE';
                            handleCustomValueChange('shadowsEnabled', shadowsOn);
                            handleCustomValueChange('shadowType', val);
                        }}
                        isPt={isPt}
                    />
                </SettingRow>

                {/* ILUMINAÇÃO */}
                <SettingRow
                    label={isPt ? 'Iluminação do Cenário' : 'Stage Lighting'}
                    description={isPt ? 'Sem iluminação, básica, avançada ou iluminação dinâmica completa' : 'No lighting, basic, advanced or dynamic stage lighting'}
                >
                    <OptionSelector
                        options={[
                            { value: 'NONE', labelPt: 'Sem Iluminação', labelEn: 'Off' },
                            { value: 'BASIC', labelPt: 'Básica', labelEn: 'Basic' },
                            { value: 'ADVANCED', labelPt: 'Avançada', labelEn: 'Advanced' },
                            { value: 'DYNAMIC', labelPt: 'Dinâmica', labelEn: 'Dynamic' },
                        ]}
                        currentValue={settings.lightingType || 'NONE'}
                        onChange={(val) => handleCustomValueChange('lightingType', val)}
                        isPt={isPt}
                    />
                </SettingRow>

                {/* DENSIDADE DE PARTÍCULAS */}
                <SettingRow
                    label={isPt ? 'Densidade de Partículas' : 'Particle Density'}
                    description={isPt ? 'Quantidade de faíscas, poeira e partículas de aura emitidas' : 'Amount of sparks, dust and aura particles emitted'}
                >
                    <OptionSelector
                        options={[
                            { value: 'DISABLED', labelPt: 'Desativado', labelEn: 'Off' },
                            { value: 'VERY_LOW', labelPt: 'Poucas (Muito Baixo)', labelEn: 'Very Low' },
                            { value: 'LOW', labelPt: 'Reduzidas (Baixo)', labelEn: 'Reduced (Low)' },
                            { value: 'MEDIUM', labelPt: 'Normal (Médio)', labelEn: 'Normal (Medium)' },
                            { value: 'HIGH', labelPt: 'Alto', labelEn: 'High' },
                            { value: 'MAX', labelPt: 'Ultra (Máximo)', labelEn: 'Max (Ultra)' },
                        ]}
                        currentValue={settings.particleDensity || (settings.particlesEnabled ? 'MEDIUM' : 'DISABLED')}
                        onChange={(val) => {
                            const particlesOn = val !== 'DISABLED';
                            handleCustomValueChange('particlesEnabled', particlesOn);
                            handleCustomValueChange('particleDensity', val);
                        }}
                        isPt={isPt}
                    />
                </SettingRow>

                {/* AURAS COMPLETAS */}
                <SettingRow
                    label={isPt ? 'Auras Completas' : 'Full Auras'}
                    description={isPt ? 'Exibe auras com múltiplos efeitos e brilho avançado ao carregar Ki' : 'Renders full multi-layered aura effects during Ki charging'}
                >
                    <Toggle
                        active={!!settings.fullAuras}
                        onToggle={() => handleCustomValueChange('fullAuras', !settings.fullAuras)}
                    />
                </SettingRow>

                {/* DISTORÇÃO DE ENERGIA */}
                <SettingRow
                    label={isPt ? 'Distorção de Energia' : 'Energy Distortion'}
                    description={isPt ? 'Efeitos térmicos e distorção visual em rajadas de Ki e poderes' : 'Heat haze and optical distortion on Ki beams and powers'}
                >
                    <Toggle
                        active={!!settings.energyDistortion}
                        onToggle={() => handleCustomValueChange('energyDistortion', !settings.energyDistortion)}
                    />
                </SettingRow>

                {/* BRILHO DAS AURAS */}
                <SettingRow
                    label={isPt ? 'Efeito de Brilho das Auras' : 'Aura Glow Effect'}
                    description={isPt ? 'Brilho que contorna a aura dos personagens ao carregar Ki' : 'Glow outline effect on character auras during Ki charging'}
                >
                    <OptionSelector
                        options={[
                            { value: 'DISABLED', labelPt: 'Desativado', labelEn: 'Off' },
                            { value: 'NORMAL', labelPt: 'Normal', labelEn: 'Normal' },
                            { value: 'ULTRA', labelPt: 'Ultra', labelEn: 'Ultra' },
                        ]}
                        currentValue={settings.auraGlowQuality || 'NORMAL'}
                        onChange={(val) => handleCustomValueChange('auraGlowQuality', val)}
                        isPt={isPt}
                    />
                </SettingRow>

                {/* BRILHO DE FECHOS, GENKIDAMAS & PROJÉTEIS */}
                <SettingRow
                    label={isPt ? 'Efeito de Brilho de Fechos & Projéteis' : 'Beams, Genkidamas & Projectiles Glow'}
                    description={isPt ? 'Brilho que contorna fechos de energia (beams), genkidamas e projéteis' : 'Glow effect outlining energy beams, genkidamas and projectiles'}
                >
                    <OptionSelector
                        options={[
                            { value: 'DISABLED', labelPt: 'Desativado', labelEn: 'Off' },
                            { value: 'NORMAL', labelPt: 'Normal', labelEn: 'Normal' },
                            { value: 'ULTRA', labelPt: 'Ultra', labelEn: 'Ultra' },
                        ]}
                        currentValue={settings.glowQuality || 'NORMAL'}
                        onChange={(val) => handleCustomValueChange('glowQuality', val)}
                        isPt={isPt}
                    />
                </SettingRow>
            </PanelCard>

            {/* AMBIENTE & FÍSICA */}
            <PanelCard
                title={isPt ? 'Ambiente & Pós-Processamento' : 'Environment & Post-FX'}
                subtitle={isPt ? 'Configurações de pós-processamento, clima e destruição do mapa' : 'Post-processing, weather and map destruction settings'}
                icon={Sparkles}
            >
                <SettingRow
                    label={isPt ? 'Pós-Processamento' : 'Post-Processing'}
                    description={isPt ? 'Filtros atmosféricos, saturação e ajuste de cor' : 'Atmospheric filters, saturation and color adjustment'}
                >
                    <Toggle
                        active={!!settings.postProcessingEnabled}
                        onToggle={() => handleCustomValueChange('postProcessingEnabled', !settings.postProcessingEnabled)}
                    />
                </SettingRow>

                <SettingRow
                    label={isPt ? 'Clima Dinâmico' : 'Dynamic Weather'}
                    description={isPt ? 'Habilita chuva, neve, tempestade de areia e efeitos do ambiente' : 'Enables rain, snow, sandstorm and environmental effects'}
                >
                    <Toggle
                        active={!!settings.weatherEffects}
                        onToggle={() => handleCustomValueChange('weatherEffects', !settings.weatherEffects)}
                    />
                </SettingRow>

                <SettingRow
                    label={isPt ? 'Destruição de Cenário' : 'Stage Destruction'}
                    description={isPt ? 'Habilita crateras no chão e pedras voadoras no combate' : 'Enables ground craters and flying debris during battle'}
                >
                    <Toggle
                        active={!!settings.stageDestruction}
                        onToggle={() => handleCustomValueChange('stageDestruction', !settings.stageDestruction)}
                    />
                </SettingRow>
            </PanelCard>

            {/* COMBAT FEEDBACK */}
            <PanelCard
                title={isPt ? 'Feedback de Batalha' : 'Combat Feedback'}
                subtitle={isPt ? 'Efeitos de câmera e marcadores visuais no combate' : 'Camera shake and visual combat hit markers'}
                icon={Sliders}
            >
                <SettingRow
                    label={isPt ? 'Tremor de Tela (Screen Shake)' : 'Screen Shake'}
                    description={isPt ? 'Habilita tremores de câmera em impactos e golpes especiais' : 'Enables camera shaking on heavy impacts and special moves'}
                >
                    <Toggle
                        active={!!settings.screenShakeEnabled}
                        onToggle={() => handleCustomValueChange('screenShakeEnabled', !settings.screenShakeEnabled)}
                    />
                </SettingRow>

                <SettingRow
                    label={isPt ? 'Números de Dano' : 'Damage Numbers'}
                    description={isPt ? 'Exibe valores numéricos dos acertos durante os combos' : 'Displays hit damage numbers during combos'}
                >
                    <Toggle
                        active={!!settings.showDamageNumbers}
                        onToggle={() => handleCustomValueChange('showDamageNumbers', !settings.showDamageNumbers)}
                    />
                </SettingRow>

                <SettingRow
                    label={isPt ? 'Efeito de Toque na Batalha' : 'Touch Effect in Battle'}
                    description={isPt ? 'Ativa/Desativa o efeito visual de toque Ki durante as batalhas (nos menus está sempre ativo)' : 'Enable/Disable Ki touch visual effect during battle (always active in menus)'}
                >
                    <Toggle
                        active={settings.touchEffectInBattle !== false}
                        onToggle={() => handleCustomValueChange('touchEffectInBattle', settings.touchEffectInBattle === false)}
                    />
                </SettingRow>

                <SettingRow
                    label={isPt ? 'Cor do Efeito de Toque' : 'Touch Effect Color'}
                    description={isPt ? 'Escolha a cor do efeito visual de Ki emitido ao tocar na tela' : 'Choose the Ki visual effect color emitted when touching the screen'}
                >
                    <OptionSelector
                        options={[
                            { value: 'RANDOM', labelPt: 'Aleatório', labelEn: 'Random', colorDot: 'linear-gradient(135deg, #ff9900, #00e5ff, #ff3366, #aa00ff)' },
                            { value: 'GOLD', labelPt: 'Dourado', labelEn: 'Gold', colorDot: '#ff9900' },
                            { value: 'BLUE', labelPt: 'Azul God', labelEn: 'God Blue', colorDot: '#00e5ff' },
                            { value: 'ROSE', labelPt: 'Rosé', labelEn: 'Rosé', colorDot: '#ff3366' },
                            { value: 'GREEN', labelPt: 'Verde', labelEn: 'Green', colorDot: '#00ff66' },
                            { value: 'PURPLE', labelPt: 'Hakai', labelEn: 'Hakai', colorDot: '#aa00ff' },
                            { value: 'RED', labelPt: 'Vermelho', labelEn: 'Red', colorDot: '#ff1100' },
                            { value: 'SILVER', labelPt: 'Prata', labelEn: 'Silver', colorDot: '#ffffff' },
                        ]}
                        currentValue={settings.touchEffectColor || 'RANDOM'}
                        onChange={(val) => handleCustomValueChange('touchEffectColor', val)}
                        isPt={isPt}
                    />
                </SettingRow>
            </PanelCard>
        </div>
    );
};

interface OptionSelectorProps {
    options: { value: string; labelPt: string; labelEn: string; colorDot?: string }[];
    currentValue: string;
    onChange: (val: any) => void;
    isPt: boolean;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ options, currentValue, onChange, isPt }) => {
    return (
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-950/80 border border-white/10 rounded-xl">
            {options.map((opt) => {
                const active = currentValue === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black italic uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            active
                                ? 'bg-orange-600 text-white border border-orange-400 shadow-[0_0_12px_rgba(234,88,12,0.4)]'
                                : 'text-stone-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {opt.colorDot && (
                            <span
                                className="w-2.5 h-2.5 rounded-full border border-black/40 shrink-0 shadow-sm"
                                style={{
                                    background: opt.colorDot,
                                }}
                            />
                        )}
                        {isPt ? opt.labelPt : opt.labelEn}
                    </button>
                );
            })}
        </div>
    );
};
