import React from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

export const PanelCard: React.FC<{ title: string; subtitle?: string; icon: any; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => (
    <div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-10 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
                <h3 className="text-white font-black text-xl sm:text-3xl uppercase tracking-widest italic leading-none">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-stone-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
        <div className="space-y-4 sm:space-y-2 relative z-10">
            {children}
        </div>
    </div>
);

export const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 hover:bg-white/[0.03] rounded-xl transition-all duration-200 gap-4 group">
        <div className="space-y-1 text-left">
            <h4 className="text-stone-100 font-black tracking-widest text-sm sm:text-lg uppercase italic">
                {label}
            </h4>
            {description && (
                <p className="text-stone-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
                    {description}
                </p>
            )}
        </div>
        <div className="flex items-center gap-6 shrink-0 z-10">
            {children}
        </div>
    </div>
);

export const Toggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
    <button
        onClick={onToggle}
        className={`
            w-20 h-10 border transition-all duration-300 relative flex items-center shrink-0 rounded-full cursor-pointer p-0.5
            ${active 
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-orange-400/50 ' 
                : 'bg-stone-950 border-stone-800 hover:border-stone-700'
            }
        `}
    >
        <div className="absolute inset-x-3 flex justify-between pointer-events-none text-[8px] font-black tracking-widest text-stone-600">
            <span className={active ? 'text-white/40' : ''}>ON</span>
            <span className={!active ? 'text-stone-500' : 'hidden'}>OFF</span>
        </div>
        <div className={`
            w-8 h-8 transition-all duration-300 rounded-full shadow-lg flex items-center justify-center font-black text-[10px] uppercase tracking-wider
            ${active 
                ? 'bg-white text-orange-600 translate-x-11 scale-95 ' 
                : 'bg-stone-700 text-stone-950 translate-x-0'
            }
        `}>
            {active ? 'I' : 'O'}
        </div>
    </button>
);

export const Slider: React.FC<{ value?: number; onChange: (v: number) => void; icon?: any; onTest?: () => void }> = ({ value, onChange, icon: Icon, onTest }) => {
    let safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 100;
    if (safeValue <= 1.0 && safeValue > 0) {
        safeValue = Math.round(safeValue * 100);
    }

    return (
        <div className="flex items-center gap-4 w-full sm:w-80 group/slider">
            {onTest && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onTest(); }}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/5 hover:border-orange-500/30 flex items-center justify-center text-stone-400 hover:text-orange-500 transition-all active:scale-90 shrink-0"
                >
                    <Play size={12} fill="currentColor" />
                </button>
            )}
            {Icon && (
                <Icon className="w-4 h-4 text-stone-500 shrink-0 group-hover/slider:text-orange-500 transition-colors opacity-60" />
            )}
            <div className="flex-1 h-8 relative flex items-center">
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1" 
                    value={safeValue} 
                    onChange={(e) => { const val = parseInt(e.target.value, 10); onChange(isNaN(val) ? 100 : val); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                />
                <div className="w-full h-[1px] bg-white/10 relative overflow-hidden rounded-full">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-orange-400" style={{ width: `${safeValue}%` }} />
                </div>
            </div>
            <span className="text-white font-black text-[10px] sm:text-xs uppercase w-10 text-right shrink-0 tracking-widest opacity-90 font-mono">
                {safeValue}%
            </span>
        </div>
    );
};
