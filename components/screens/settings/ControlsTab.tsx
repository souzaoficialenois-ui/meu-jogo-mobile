import React, { useState } from 'react';
import { Gamepad2, Keyboard, RotateCcw, Info, AlertTriangle, Users, CheckCircle2, Sliders } from 'lucide-react';
import { PanelCard, SettingRow, Toggle } from './SettingsSharedComponents';
import { AudioManager } from '../../../services/AudioManager';

export const formatGamepadButtonCode = (btnIndex: number | undefined, isPt: boolean = false): string => {
    if (btnIndex === undefined || btnIndex === null) return "---";
    switch (btnIndex) {
        case 0: return "A / CROSS";
        case 1: return "B / CIRCLE";
        case 2: return "X / SQUARE";
        case 3: return "Y / TRIANGLE";
        case 4: return "LB / L1";
        case 5: return "RB / R1";
        case 6: return "LT / L2";
        case 7: return "RT / R2";
        case 8: return "SELECT / SHARE";
        case 9: return "START / OPTIONS";
        case 10: return "L3 (STICK)";
        case 11: return "R3 (STICK)";
        case 12: return "D-PAD UP";
        case 13: return "D-PAD DOWN";
        case 14: return "D-PAD LEFT";
        case 15: return "D-PAD RIGHT";
        default: return `BTN ${btnIndex}`;
    }
};

export interface ActiveBindingTarget {
    player: 1 | 2;
    action: string;
}

interface ControlsTabProps {
    settings: any;
    handleToggle: (key: string) => void;
    updateSettings: (s: any) => void;
    activeBindingTarget: ActiveBindingTarget | null;
    setActiveBindingTarget: (target: ActiveBindingTarget | null) => void;
    activeGamepadBinding?: string | null;
    setActiveGamepadBinding?: (b: string | null) => void;
    bindingConflictError?: string | null;
    formatKeyCode: (code: string | undefined) => string;
    gamepadName: string | null;
    isPt: boolean;
}

export const ControlsTab: React.FC<ControlsTabProps> = ({ 
    settings, 
    handleToggle, 
    updateSettings,
    activeBindingTarget, 
    setActiveBindingTarget, 
    activeGamepadBinding = null,
    setActiveGamepadBinding = () => {},
    bindingConflictError = null,
    formatKeyCode, 
    gamepadName, 
    isPt 
}) => {
    const [viewMode, setViewMode] = useState<'p1' | 'p2' | 'both'>('both');

    const p1Keybindings = settings.keybindings || {};
    const p2Keybindings = settings.p2Keybindings || {
        left: "ArrowLeft",
        right: "ArrowRight",
        jump: "ArrowUp",
        block: "ArrowDown",
        dash: "ShiftRight",
        light: "Numpad1",
        medium: "Numpad2",
        heavy: "Numpad3",
        special: "Numpad5",
        charge: "Numpad7",
        ultimate: "Numpad9",
        tag: "Numpad4",
        assist1: "NumpadDivide",
        assist2: "NumpadMultiply",
        vanish: "NumpadAdd",
        transform: "NumpadEnter",
        dragonRush: "Numpad0"
    };
    const gamepadBindings = settings.gamepadBindings || {};

    const applyP1Preset = () => {
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

    const applyP2Preset = () => {
        AudioManager.getInstance().playSFX('confirm');
        updateSettings({
            p2Keybindings: {
                left: "ArrowLeft",
                right: "ArrowRight",
                jump: "ArrowUp",
                block: "ArrowDown",
                dash: "ShiftRight",
                light: "Numpad1",
                medium: "Numpad2",
                heavy: "Numpad3",
                special: "Numpad5",
                charge: "Numpad7",
                ultimate: "Numpad9",
                tag: "Numpad4",
                assist1: "NumpadDivide",
                assist2: "NumpadMultiply",
                vanish: "NumpadAdd",
                transform: "NumpadEnter",
                dragonRush: "Numpad0"
            }
        });
    };

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
            },
            p2Keybindings: {
                left: "ArrowLeft",
                right: "ArrowRight",
                jump: "ArrowUp",
                block: "ArrowDown",
                dash: "ShiftRight",
                light: "Numpad1",
                medium: "Numpad2",
                heavy: "Numpad3",
                special: "Numpad5",
                charge: "Numpad7",
                ultimate: "Numpad9",
                tag: "Numpad4",
                assist1: "NumpadDivide",
                assist2: "NumpadMultiply",
                vanish: "NumpadAdd",
                transform: "NumpadEnter",
                dragonRush: "Numpad0"
            },
            gamepadBindings: {
                left: 14,
                right: 15,
                jump: 0,
                block: 13,
                dash: 4,
                light: 2,
                medium: 3,
                heavy: 1,
                special: 5,
                charge: 6,
                ultimate: 7,
                tag: 8,
                assist1: 10,
                assist2: 11,
                vanish: 9,
                transform: 16,
                dragonRush: 12
            }
        });
    };

    const BindingRow: React.FC<{ action: string; label: string }> = ({ action, label }) => {
        const isKbActiveP1 = activeBindingTarget?.player === 1 && activeBindingTarget?.action === action;
        const isKbActiveP2 = activeBindingTarget?.player === 2 && activeBindingTarget?.action === action;
        const isGpActive = activeGamepadBinding === action;

        const p1Key = p1Keybindings[action];
        const p2Key = p2Keybindings[action];

        return (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-stone-900/50 border border-white/5 rounded-xl hover:border-orange-500/30 transition-all gap-2 group">
                <span className="text-[11px] font-black text-stone-200 uppercase tracking-widest">{label}</span>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                    {/* PLAYER 1 BUTTON (If viewMode is 'p1' or 'both') */}
                    {(viewMode === 'p1' || viewMode === 'both') && (
                        <button
                            onClick={() => {
                                setActiveGamepadBinding(null);
                                setActiveBindingTarget({ player: 1, action });
                            }}
                            title={isPt ? "Mapeamento Teclado P1" : "Keyboard Mapping P1"}
                            className={`flex-1 md:flex-none min-w-[110px] px-3 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                                isKbActiveP1 
                                ? 'bg-orange-500 text-white border-orange-400 animate-pulse shadow-lg shadow-orange-500/30' 
                                : 'bg-stone-950 text-blue-400 border-blue-900/40 hover:border-blue-500/60 hover:text-blue-300'
                            }`}
                        >
                            <Keyboard size={12} className={isKbActiveP1 ? 'text-white' : 'text-blue-400'} />
                            <span>{isKbActiveP1 ? (isPt ? 'PRESSIONE...' : 'PRESS KEY...') : `P1: ${formatKeyCode(p1Key)}`}</span>
                        </button>
                    )}

                    {/* PLAYER 2 BUTTON (If viewMode is 'p2' or 'both') */}
                    {(viewMode === 'p2' || viewMode === 'both') && (
                        <button
                            onClick={() => {
                                setActiveGamepadBinding(null);
                                setActiveBindingTarget({ player: 2, action });
                            }}
                            title={isPt ? "Mapeamento Teclado P2" : "Keyboard Mapping P2"}
                            className={`flex-1 md:flex-none min-w-[110px] px-3 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                                isKbActiveP2 
                                ? 'bg-orange-500 text-white border-orange-400 animate-pulse shadow-lg shadow-orange-500/30' 
                                : 'bg-stone-950 text-red-400 border-red-900/40 hover:border-red-500/60 hover:text-red-300'
                            }`}
                        >
                            <Keyboard size={12} className={isKbActiveP2 ? 'text-white' : 'text-red-400'} />
                            <span>{isKbActiveP2 ? (isPt ? 'PRESSIONE...' : 'PRESS KEY...') : `P2: ${formatKeyCode(p2Key)}`}</span>
                        </button>
                    )}

                    {/* GAMEPAD BUTTON */}
                    <button
                        onClick={() => {
                            setActiveBindingTarget(null);
                            setActiveGamepadBinding(action);
                        }}
                        title={isPt ? "Mapeamento de Gamepad" : "Gamepad Mapping"}
                        className={`flex-1 md:flex-none min-w-[110px] px-3 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                            isGpActive 
                            ? 'bg-cyan-500 text-black border-cyan-300 animate-pulse shadow-lg shadow-cyan-500/30' 
                            : 'bg-stone-950 text-cyan-400 border-stone-800 hover:border-cyan-500/50 hover:text-cyan-300'
                        }`}
                    >
                        <Gamepad2 size={12} className={isGpActive ? 'text-black' : 'text-cyan-500'} />
                        <span>{isGpActive ? (isPt ? 'PRESSIONE...' : 'PRESS BTN...') : formatGamepadButtonCode(gamepadBindings[action], isPt)}</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <PanelCard title={isPt ? 'Dispositivos & Sensores' : 'Devices & Feedback'} icon={Gamepad2}>
                <SettingRow label={isPt ? 'Vibração do Controle' : 'Controller Vibration'} description={isPt ? 'Habilita feedback tátil no joystick' : 'Enables haptic feedback on the joystick'}>
                    <Toggle active={settings.vibrationEnabled} onToggle={() => handleToggle('vibrationEnabled')} />
                </SettingRow>
                <SettingRow label={isPt ? 'Gamepad Detectado' : 'Gamepad Detected'}>
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest bg-stone-950 border border-cyan-500/20 px-4 py-2 rounded-lg truncate max-w-[250px] inline-block">
                        {gamepadName || (isPt ? 'NENHUM CONTROLE DETECTADO' : 'NO GAMEPAD DETECTED')}
                    </span>
                </SettingRow>
            </PanelCard>

            <PanelCard 
                title={isPt ? 'Mapeamento de Teclas - Multijogador Local (P1 & P2)' : 'Local Multiplayer Keybindings (P1 & P2)'} 
                subtitle={isPt ? 'Configure comandos independentes para o Jogador 1 e Jogador 2 no mesmo teclado ou joysticks. Salvo no armazenamento local.' : 'Configure independent controls for Player 1 and Player 2 on the same keyboard or joysticks. Saved in localStorage.'} 
                icon={Users}
            >
                {/* LocalStorage Status Badge */}
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-xl mb-4 text-emerald-300 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span>{isPt ? 'Configurações de atalho são salvas automaticamente no armazenamento local (localStorage).' : 'Keybindings are automatically saved to browser storage (localStorage).'}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-500/40">localStorage</span>
                </div>

                {/* Conflict Error Banner */}
                {bindingConflictError && (
                    <div className="p-4 rounded-xl mb-4 bg-red-950/80 border-2 border-red-500 text-red-200 flex items-center gap-3 animate-shake shadow-lg shadow-red-900/50">
                        <AlertTriangle className="w-6 h-6 shrink-0 text-red-400 animate-bounce" />
                        <div className="flex-1">
                            <p className="font-black text-xs uppercase tracking-wider">{isPt ? 'CONFLITO DE TECLAS DETECTADO!' : 'KEY CONFLICT DETECTED!'}</p>
                            <p className="text-xs mt-0.5 font-medium">{bindingConflictError}</p>
                        </div>
                    </div>
                )}

                {/* Active Rebinding Prompt Banner */}
                {(activeBindingTarget || activeGamepadBinding) && (
                    <div className={`p-4 rounded-xl mb-6 border flex items-center justify-between animate-pulse ${
                        activeBindingTarget ? 'bg-orange-950/60 border-orange-500/50 text-orange-200' : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="font-black text-xs uppercase tracking-wider">
                                    {activeBindingTarget 
                                        ? (isPt ? `Pressione uma nova tecla para Jogador ${activeBindingTarget.player} [${activeBindingTarget.action.toUpperCase()}]` : `Press a new key for Player ${activeBindingTarget.player} [${activeBindingTarget.action.toUpperCase()}]`)
                                        : (isPt ? `Pressione qualquer botão no Gamepad para remapear [${activeGamepadBinding?.toUpperCase()}]` : `Press any Gamepad button to remap [${activeGamepadBinding?.toUpperCase()}]`)}
                                </p>
                                <p className="text-[10px] opacity-75 mt-0.5">
                                    {isPt ? 'Teclas repetidas entre Jogador 1 e 2 serão bloqueadas. Pressione ESC para cancelar' : 'Duplicate keys between Player 1 and 2 will be blocked. Press ESC to cancel'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setActiveBindingTarget(null);
                                setActiveGamepadBinding(null);
                            }}
                            className="px-3 py-1.5 bg-black/40 hover:bg-black/80 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10"
                        >
                            {isPt ? 'CANCELAR' : 'CANCEL'}
                        </button>
                    </div>
                )}

                {/* View Mode & Preset Controls Bar */}
                <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-stone-900/60 p-3 rounded-2xl border border-white/10">
                    {/* View mode buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mr-1 flex items-center gap-1 shrink-0">
                            <Sliders size={12} /> {isPt ? 'VISUALIZAÇÃO:' : 'VIEW:'}
                        </span>

                        <button
                            onClick={() => {
                                setViewMode('both');
                                AudioManager.getInstance().playSFX('click');
                            }}
                            className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
                                viewMode === 'both'
                                    ? 'bg-orange-600/30 text-orange-300 border-orange-500 shadow-md shadow-orange-500/20'
                                    : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
                            }`}
                        >
                            <Users size={14} className={viewMode === 'both' ? 'text-orange-400' : 'text-stone-600'} />
                            <span>{isPt ? 'AMBOS (P1 & P2)' : 'BOTH (P1 & P2)'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setViewMode('p1');
                                AudioManager.getInstance().playSFX('click');
                            }}
                            className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
                                viewMode === 'p1'
                                    ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-md shadow-blue-500/20'
                                    : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
                            }`}
                        >
                            <Keyboard size={14} className={viewMode === 'p1' ? 'text-blue-400' : 'text-stone-600'} />
                            <span>{isPt ? 'JOGADOR 1' : 'PLAYER 1'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setViewMode('p2');
                                AudioManager.getInstance().playSFX('click');
                            }}
                            className={`px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
                                viewMode === 'p2'
                                    ? 'bg-red-600/30 text-red-300 border-red-500 shadow-md shadow-red-500/20'
                                    : 'bg-stone-950 text-stone-500 border-stone-800 hover:text-stone-300'
                            }`}
                        >
                            <Keyboard size={14} className={viewMode === 'p2' ? 'text-red-400' : 'text-stone-600'} />
                            <span>{isPt ? 'JOGADOR 2' : 'PLAYER 2'}</span>
                        </button>
                    </div>

                    {/* Presets buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        <button
                            onClick={applyP1Preset}
                            title={isPt ? "WASD + IJKL para P1" : "WASD + IJKL for P1"}
                            className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 text-blue-300 hover:text-blue-200 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shrink-0"
                        >
                            {isPt ? 'PRESET P1 (WASD)' : 'P1 PRESET (WASD)'}
                        </button>

                        <button
                            onClick={applyP2Preset}
                            title={isPt ? "Setas + Numpad para P2" : "Arrows + Numpad for P2"}
                            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/40 text-red-300 hover:text-red-200 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shrink-0"
                        >
                            {isPt ? 'PRESET P2 (SETAS)' : 'P2 PRESET (ARROWS)'}
                        </button>

                        <button 
                            onClick={resetToDefaults}
                            className="px-3 py-1.5 bg-stone-900 border border-white/10 hover:border-red-500/40 text-stone-400 hover:text-red-400 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shrink-0"
                        >
                            <RotateCcw size={10} />
                            <span>{isPt ? 'RESTAURAR TUDO' : 'RESET ALL'}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* CATEGORY 1: MOVEMENT */}
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-orange-500/20">
                            {isPt ? '1. Movimentação' : '1. Movement'}
                        </h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <BindingRow action="left" label={isPt ? 'MOVER PARA ESQUERDA' : 'MOVE LEFT'} />
                            <BindingRow action="right" label={isPt ? 'MOVER PARA DIREITA' : 'MOVE RIGHT'} />
                            <BindingRow action="jump" label={isPt ? 'PULAR' : 'JUMP'} />
                            <BindingRow action="block" label={isPt ? 'DEFESA / AGACHAR' : 'BLOCK / CROUCH'} />
                            <BindingRow action="dash" label={isPt ? 'DASH / CORRER' : 'DASH / RUN'} />
                        </div>
                    </div>

                    {/* CATEGORY 2: COMBAT */}
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-orange-500/20">
                            {isPt ? '2. Ataques Básicos & Especiais' : '2. Basic & Special Attacks'}
                        </h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <BindingRow action="light" label={isPt ? 'ATAQUE FRACO' : 'LIGHT ATTACK'} />
                            <BindingRow action="medium" label={isPt ? 'ATAQUE MÉDIO' : 'MEDIUM ATTACK'} />
                            <BindingRow action="heavy" label={isPt ? 'ATAQUE FORTE' : 'HEAVY ATTACK'} />
                            <BindingRow action="special" label={isPt ? 'ESPECIAL (KI BLAST / FEIXE)' : 'SPECIAL (KI BLAST / BEAM)'} />
                            <BindingRow action="ultimate" label={isPt ? 'ATAQUE ULTIMATE' : 'ULTIMATE ATTACK'} />
                            <BindingRow action="charge" label={isPt ? 'CARREGAR KI' : 'CHARGE KI'} />
                        </div>
                    </div>

                    {/* CATEGORY 3: SPECIAL ACTIONS & ASSISTS */}
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-orange-500/20">
                            {isPt ? '3. Ações Especiais & Suporte' : '3. Special Actions & Assists'}
                        </h5>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <BindingRow action="dragonRush" label={isPt ? 'INVESTIDA DRAGÃO (DRAGON RUSH)' : 'DRAGON RUSH'} />
                            <BindingRow action="vanish" label={isPt ? 'TELEPORTE (VANISH)' : 'VANISH TELEPORT'} />
                            <BindingRow action="transform" label={isPt ? 'TRANSFORMAÇÃO' : 'TRANSFORM'} />
                            <BindingRow action="tag" label={isPt ? 'TROCAR PERSONAGEM' : 'SWITCH TAG'} />
                            <BindingRow action="assist1" label={isPt ? 'APOIO 1 (ASSIST 1)' : 'ASSIST 1'} />
                            <BindingRow action="assist2" label={isPt ? 'APOIO 2 (ASSIST 2)' : 'ASSIST 2'} />
                        </div>
                    </div>
                </div>
            </PanelCard>
        </div>
    );
};
