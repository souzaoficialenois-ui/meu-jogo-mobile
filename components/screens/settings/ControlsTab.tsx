import React from 'react';
import { Gamepad2, Keyboard } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';
import { AudioManager } from '../../../services/AudioManager';

interface ControlsTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    updateSettings: (s: any) => void;
    activeBinding: string | null;
    setActiveBinding: (b: string | null) => void;
    formatKeyCode: (code: string | undefined) => string;
    gamepadName: string | null;
    isPt: boolean;
}

export const ControlsTab: React.FC<ControlsTabProps> = ({ 
    settings, 
    handleToggle, 
    updateSettings,
    activeBinding, 
    setActiveBinding, 
    formatKeyCode, 
    gamepadName, 
    isPt 
}) => {
    const keybindings = settings.keybindings || {};
    
    const resetToDefaults = () => {
        AudioManager.getInstance().playSFX('confirm');
        updateSettings({
            keybindings: {
                left: "KeyA",
                right: "KeyD",
                jump: "Space",
                light: "KeyK",
                medium: "KeyL",
                heavy: "Semicolon",
                special: "KeyI",
                block: "KeyS",
                dash: "ShiftLeft",
                charge: "KeyC",
                ultimate: "KeyU",
                tag: "KeyT",
                assist1: "KeyQ",
                assist2: "KeyE",
                vanish: "KeyV",
                transform: "KeyB",
                dragonRush: "KeyR"
            }
        });
    };
    const BindingButton: React.FC<{ action: string; label: string }> = ({ action, label }) => (
        <div className="flex items-center justify-between p-3 bg-stone-900/40 border border-white/5 rounded-xl hover:border-orange-500/30 transition-all group">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{label}</span>
            <button
                onClick={() => setActiveBinding(action)}
                className={`min-w-[100px] px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                    activeBinding === action 
                    ? 'bg-orange-500 text-white animate-pulse' 
                    : 'bg-stone-950 text-stone-300 hover:text-orange-500'
                }`}
            >
                {activeBinding === action ? (isPt ? 'PRESSIONE...' : 'PRESS...') : formatKeyCode(keybindings[action])}
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            <PanelCard title={isPt ? 'Dispositivos' : 'Devices'} icon={Gamepad2}>
                <SettingRow label={isPt ? 'Vibração do Controle' : 'Controller Vibration'} description={isPt ? 'Habilita feedback tátil no joystick' : 'Enables haptic feedback on the joystick'}>
                    <Toggle active={settings.vibrationEnabled} onToggle={() => handleToggle('vibrationEnabled')} />
                </SettingRow>
                <SettingRow label={isPt ? 'Gamepad Detectado' : 'Gamepad Detected'}>
                    <span className="text-xs font-black text-stone-500 uppercase tracking-widest bg-stone-950 px-4 py-2 rounded-lg">
                        {gamepadName || (isPt ? 'NENHUM' : 'NONE')}
                    </span>
                </SettingRow>
            </PanelCard>

            <PanelCard title={isPt ? 'Mapeamento de Teclas' : 'Key Bindings'} subtitle={isPt ? 'Clique em uma tecla para remapear' : 'Click a key to remap it'} icon={Keyboard}>
                <div className="mb-6 flex justify-end">
                    <button 
                        onClick={resetToDefaults}
                        className="px-6 py-2 bg-stone-900 border border-white/5 hover:border-red-500/30 text-stone-400 hover:text-red-400 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                    >
                        {isPt ? 'REDEFINIR PADRÕES' : 'RESET TO DEFAULTS'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.2em] mb-4">{isPt ? 'Movimentação' : 'Movement'}</h5>
                        <BindingButton action="left" label={isPt ? 'ESQUERDA' : 'LEFT'} />
                        <BindingButton action="right" label={isPt ? 'DIREITA' : 'RIGHT'} />
                        <BindingButton action="jump" label={isPt ? 'PULAR' : 'JUMP'} />
                        <BindingButton action="dash" label={isPt ? 'DASH / CORRER' : 'DASH / RUN'} />
                        <BindingButton action="block" label={isPt ? 'DEFESA' : 'BLOCK'} />
                    </div>
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.2em] mb-4">{isPt ? 'Combate' : 'Combat'}</h5>
                        <BindingButton action="light" label={isPt ? 'ATAQUE FRACO' : 'LIGHT ATTACK'} />
                        <BindingButton action="medium" label={isPt ? 'ATAQUE MÉDIO' : 'MEDIUM ATTACK'} />
                        <BindingButton action="heavy" label={isPt ? 'ATAQUE FORTE' : 'HEAVY ATTACK'} />
                        <BindingButton action="special" label={isPt ? 'ESPECIAL' : 'SPECIAL'} />
                        <BindingButton action="ultimate" label={isPt ? 'ULTIMATE' : 'ULTIMATE'} />
                        <BindingButton action="charge" label={isPt ? 'CARREGAR KI' : 'CHARGE KI'} />
                    </div>
                </div>
            </PanelCard>
        </div>
    );
};
