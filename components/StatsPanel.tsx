
import React, { useEffect, useState } from 'react';
import { CharacterData } from '../types';
import { MAX_HP, MAX_KI } from '../constants';
import { Heart, Flame, Swords, Shield, Zap } from 'lucide-react';

interface StatsPanelProps {
    character: CharacterData | null;
    align?: 'left' | 'right';
    variant?: 'floating' | 'static';
    showName?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ character, align = 'left', variant = 'floating', showName = true }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (character) {
            setVisible(false);
            const t = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
        }
    }, [character?.id]);

    if (!character) return null;

    // Calculate Power Level
    const powerLevel = ((character.stats.attack + character.stats.defense + character.stats.speed) * 150) + (character.level * 50);
    const MAX_STAT = 20;

    const StatRow = ({ label, value, max, color, icon: Icon }: { label: string, value: number, max: number, color: string, icon: React.ElementType }) => {
        const pct = Math.min(100, (value / max) * 100);
        
        return (
            <div className="mb-[0.5vmin]">
                <div className="flex justify-between items-end mb-[0.2vmin]">
                    <span className="text-[1vmin] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-[0.5vmin]">
                        <Icon className="w-[1.2vmin] h-[1.2vmin]" /> {label}
                    </span>
                    <span className="text-[1.2vmin] font-header text-white">{value}</span>
                </div>
                <div className="w-full h-[0.8vmin] bg-slate-900 skew-x-[-12deg] border border-slate-700 p-[1px]">
                    <div 
                        className={`h-full transition-all duration-500 ease-out ${color} `}
                        style={{ width: visible ? `${pct}%` : '0%' }}
                    ></div>
                </div>
            </div>
        );
    };

    const positionClasses = variant === 'floating' 
        ? `absolute top-[15vmin] ${align === 'left' ? 'left-[5vmin]' : 'right-[5vmin]'}`
        : 'relative mt-[1vmin]';

    return (
        <div className={`
            ${positionClasses}
            w-[30vmin] bg-slate-900/90 border border-slate-600 rounded-xl p-[1.5vmin] z-30
            backdrop-blur-md transform transition-all duration-300 ease-out shadow-2xl
            ${visible ? 'opacity-100 translate-x-0' : `opacity-0 ${align === 'left' ? '-translate-x-[2vmin]' : 'translate-x-[2vmin]'}`}
        `}>
            {/* Header */}
            {showName && (
                <div className="border-b-2 border-yellow-500 pb-[1vmin] mb-[1.5vmin] flex justify-between items-center">
                    <div>
                        <h3 className="text-[2vmin] font-header italic text-white leading-none uppercase truncate max-w-[18vmin]">
                            {character.name}
                        </h3>
                        <div className="flex gap-[0.5vmin] mt-[0.5vmin]">
                            <span className={`text-[0.8vmin] font-bold px-[0.5vmin] py-[0.2vmin] rounded text-black uppercase`} style={{ backgroundColor: character.color }}>
                                {character.rarity}
                            </span>
                            <span className="text-[0.8vmin] font-bold px-[0.5vmin] py-[0.2vmin] rounded bg-white text-black">LV {character.level}</span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-[0.8vmin] text-slate-400 font-bold uppercase tracking-wider">POWER</div>
                        <div className="text-[2vmin] font-header text-yellow-400 leading-none drop-shadow-md">
                            {powerLevel.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {!showName && (
                 <div className="flex justify-between items-center mb-[1vmin] border-b border-white/10 pb-[0.5vmin]">
                    <div className="text-[1vmin] font-bold text-slate-400">STATS OVERVIEW</div>
                    <div className="text-[1.5vmin] font-header text-yellow-400">{powerLevel.toLocaleString()}</div>
                 </div>
            )}

            {/* Stats */}
            <div className="space-y-[0.2vmin]">
                <StatRow label="HP" value={character.maxHp ?? MAX_HP} max={character.maxHp ?? MAX_HP} color="bg-green-500" icon={Heart} />
                <StatRow label="KI" value={MAX_KI} max={MAX_KI} color="bg-yellow-400" icon={Flame} />
                <div className="h-[1px] bg-white/10 my-[0.5vmin]"></div>
                <StatRow label="ATK" value={character.stats.attack} max={MAX_STAT} color="bg-red-500" icon={Swords} />
                <StatRow label="DEF" value={character.stats.defense} max={MAX_STAT} color="bg-blue-500" icon={Shield} />
                <StatRow label="SPD" value={character.stats.speed} max={MAX_STAT} color="bg-purple-500" icon={Zap} />
            </div>

            {/* Tags */}
            <div className="mt-[1.5vmin] flex flex-wrap gap-[0.5vmin]">
                {character.tags.map(tag => (
                    <span key={tag} className="text-[0.8vmin] bg-white/10 text-slate-300 px-[0.5vmin] py-[0.2vmin] rounded border border-white/10 font-bold">
                        {tag}
                    </span>
                ))}
            </div>
            
            {/* Tech Decoration */}
            <div className="absolute -left-[1px] top-[1vmin] bottom-[1vmin] w-[2px] bg-yellow-500/50"></div>
            <div className="absolute -right-[1px] top-[1vmin] bottom-[1vmin] w-[2px] bg-yellow-500/50"></div>
        </div>
    );
};
