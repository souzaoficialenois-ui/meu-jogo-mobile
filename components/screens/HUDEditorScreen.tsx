import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, HUDLayout, HudElement } from '../../types';
import { VirtualControls, defaultHudElements, compactHudElements, getSavedHudElements } from '../VirtualControls';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, X, Edit3, Eye, Lock, Unlock, EyeOff, Smartphone } from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';

export const HUDEditorScreen: React.FC = () => {
    const { changeScene, settings, updateSettings, t } = useSceneManager();
    const [initialLayout] = useState<HUDLayout>({ ...settings.hudLayout });
    const [layout, setLayout] = useState<HUDLayout>({ ...settings.hudLayout });
    const [elements, setElements] = useState<HudElement[]>([]);
    const [initialElements, setInitialElements] = useState<HudElement[]>([]);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
    const [uiVisible, setUiVisible] = useState(true);

    useEffect(() => {
        const saved = getSavedHudElements();
        setElements(saved);
        setInitialElements(JSON.parse(JSON.stringify(saved)));
    }, []);

    const updateLive = (newLayout: HUDLayout) => {
        setLayout(newLayout);
        updateSettings({ hudLayout: newLayout });
    };

    const handleLayoutUpdate = (newElements: HudElement[]) => {
        setElements(newElements);
    };

    const saveAndExit = () => {
        updateSettings({ hudLayout: layout });
        localStorage.setItem("hud_layout_v2", JSON.stringify(elements));
        AudioManager.getInstance().playSFX('click');
        changeScene(SceneName.SETTINGS);
    };

    const resetDefault = () => {
        const defaultLayout = {
            ...settings.hudLayout,
            scale: 1.0, opacity: 0.8
        };
        updateLive(defaultLayout);
        setElements([...defaultHudElements]);
        AudioManager.getInstance().playSFX('confirm');
    };

    const resetCompact = () => {
        const defaultLayout = {
            ...settings.hudLayout,
            scale: 1.0, opacity: 0.8
        };
        updateLive(defaultLayout);
        setElements([...compactHudElements]);
        AudioManager.getInstance().playSFX('confirm');
    };

    const handleCancel = () => {
        updateSettings({ hudLayout: initialLayout });
        localStorage.setItem("hud_layout_v2", JSON.stringify(initialElements));
        AudioManager.getInstance().playSFX('cancel');
        changeScene(SceneName.SETTINGS);
    };

    const toggleAspectRatio = () => {
        setMaintainAspectRatio(!maintainAspectRatio);
        AudioManager.getInstance().playSFX('click');
    };

    return (
        <div className="absolute inset-0 z-[1000] bg-stone-950 overflow-hidden font-sans select-none">
            {/* Context Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[grid-white/5] bg-[size:60px_60px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950"></div>
                
                {/* Reference characters */}
                <div className="absolute bottom-[20%] left-[20%] w-48 h-96 bg-red-500/10 border-2 border-red-500/20 skew-x-[-10deg] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[20%] w-48 h-96 bg-orange-500/10 border-2 border-orange-500/20 skew-x-[10deg] animate-pulse"></div>
            </div>

            {/* Editable HUD */}
            <VirtualControls 
                isEditing={true} 
                editorElements={elements.length ? elements : undefined} 
                onLayoutUpdate={handleLayoutUpdate}
                maintainAspectRatio={maintainAspectRatio}
            />

            {/* Editor Top Bar */}
            <AnimatePresence>
                {uiVisible && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="absolute top-0 left-0 right-0 p-6 pointer-events-none z-50 flex justify-between items-start"
                    >
                        {/* Title & Settings (Left) */}
                        <div className="flex flex-col pointer-events-auto">
                            <div className="bg-stone-900/80 backdrop-blur-xl rounded-b-none rounded-t-2xl p-5 border border-white/10 border-b-0 shadow-2xl flex items-center gap-5 w-80">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-inner">
                                    <Edit3 size={24} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black italic uppercase tracking-wider text-white drop-shadow-md">
                                        {settings?.language?.startsWith('en') ? 'Editor' : 'Editor'}
                                    </h1>
                                    <p className="text-xs font-semibold text-stone-400 mt-1 uppercase tracking-widest">
                                        {settings?.language?.startsWith('en') ? 'Adjust Layouts' : 'Ajuste os Layouts'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-stone-900/90 backdrop-blur-xl rounded-b-2xl p-6 border border-white/10 shadow-2xl flex flex-col gap-6 w-80">
                                <button 
                                    onClick={toggleAspectRatio}
                                    className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all duration-300 ${maintainAspectRatio ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-stone-800 border-white/5 text-slate-400 hover:bg-stone-700'}`}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest block">
                                        {settings?.language?.startsWith('en') 
                                            ? `Aspect Ratio: ${maintainAspectRatio ? 'Locked' : 'Free'}` 
                                            : `Proporção: ${maintainAspectRatio ? 'Travada' : 'Livre'}`}
                                    </span>
                                    {maintainAspectRatio ? <Lock size={18} /> : <Unlock size={18} className="opacity-50" />}
                                </button>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2 text-stone-300">
                                            <Eye size={16} />
                                            <span className="text-xs font-black uppercase tracking-widest">
                                                {settings?.language?.startsWith('en') ? 'Default Opacity' : 'Opacidade Padrão'}
                                            </span>
                                        </div>
                                        <span className="text-base font-black text-white">{Math.round(layout.opacity * 100)}%</span>
                                    </div>
                                    <div className="relative pt-2">
                                        <input 
                                            type="range" min={0.1} max={1.0} step={0.05} 
                                            value={Number.isNaN(layout.opacity) ? 0.8 : layout.opacity}
                                            onChange={(e) => { const val = parseFloat(e.target.value); updateLive({ ...layout, opacity: isNaN(val) ? 0.8 : val }); }}
                                            className="w-full h-2 bg-stone-800 rounded-full appearance-none outline-none accent-orange-500 cursor-pointer focus:ring-2 focus:ring-orange-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions (Right) */}
                        <div className="flex flex-col gap-3 pointer-events-auto">
                            <button 
                                onClick={saveAndExit}
                                className="group relative overflow-hidden px-8 py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center gap-4 hover: transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                <Save size={24} className="text-white drop-shadow-md relative z-10" />
                                <span className="text-white font-black italic uppercase tracking-widest text-lg drop-shadow-md relative z-10">
                                    {settings?.language?.startsWith('en') ? 'Save' : 'Salvar'}
                                </span>
                            </button>
                             <button 
                                onClick={resetDefault}
                                className="px-8 py-4 bg-stone-900/80 backdrop-blur-xl border border-white/20 hover:border-orange-500/50 hover:bg-stone-800 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300"
                            >
                                <span className="text-stone-300 font-bold uppercase tracking-wider text-xs">
                                    {settings?.language?.startsWith('en') ? 'Original Default' : 'Padrão Original'}
                                </span>
                                <RotateCcw size={18} className="text-stone-400" />
                            </button>
                            <button 
                                onClick={resetCompact}
                                className="px-8 py-4 bg-stone-900/80 backdrop-blur-xl border border-white/20 hover:border-orange-500/50 hover:bg-stone-800 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300"
                            >
                                <span className="text-stone-300 font-bold uppercase tracking-wider text-xs">
                                    {settings?.language?.startsWith('en') ? 'Mobile Layout' : 'Layout Móvel'}
                                </span>
                                <Smartphone size={18} className="text-stone-400" />
                            </button>
                            <button 
                                onClick={handleCancel}
                                className="px-8 py-4 bg-stone-900/80 backdrop-blur-xl border border-red-500/30 hover:border-red-500/80 hover:bg-red-950/50 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300"
                            >
                                <span className="text-red-400 font-bold uppercase tracking-wider text-xs">
                                    {settings?.language?.startsWith('en') ? 'Exit Without Saving' : 'Sair Sem Salvar'}
                                </span>
                                <X size={18} className="text-red-400" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle UI Visibility Button (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                <button 
                    onClick={() => {
                        setUiVisible(!uiVisible);
                        AudioManager.getInstance().playSFX('click');
                    }}
                    className={`flex items-center gap-3 px-6 py-3 backdrop-blur-xl rounded-full border shadow-2xl transition-all duration-300 ${!uiVisible ? 'bg-orange-600 border-orange-500 scale-110 mb-4' : 'bg-stone-900/80 border-white/20 hover:bg-stone-800'}`}
                >
                    {uiVisible ? (
                        <>
                            <EyeOff size={18} className="text-slate-300" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                {settings?.language?.startsWith('en') ? 'Hide UI Controls' : 'Ocultar Controles'}
                            </span>
                        </>
                    ) : (
                        <>
                            <Eye size={18} className="text-white" />
                            <span className="text-xs font-bold uppercase tracking-wider text-white">
                                {settings?.language?.startsWith('en') ? 'Show UI Controls' : 'Mostrar Controles'}
                            </span>
                        </>
                    )}
                </button>
            </div>

            {/* Aesthetic Grain & Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
            <div className="absolute inset-0 pointer-events-none scanlines opacity-10"></div>
        </div>
    );
};

