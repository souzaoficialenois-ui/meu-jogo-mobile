
import React from 'react';
import { Rocket, Globe, Plus, Settings, Shield, User, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AVATAR_LIST } from '../../personagens/CharacterDatabase';

interface SidebarTab {
    id: string;
    label: string;
    icon: any;
    desc?: string;
}

interface MultiplayerSidebarProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    tabs: SidebarTab[];
    onBack: () => void;
    playerProfile: any;
    t: (key: string) => string;
}

export const MultiplayerSidebar: React.FC<MultiplayerSidebarProps> = ({
    activeTab,
    onTabChange,
    tabs,
    onBack,
    playerProfile,
    t
}) => {
    return (
        <motion.div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none snap-x w-full md:w-72 shrink-0">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all min-w-[170px] md:w-full shrink-0 group
                            ${isActive ? 'bg-orange-600/20 text-white font-black italic' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                        `}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : ''}`} />
                        <div className="flex flex-col items-start">
                            <span className="text-xs uppercase tracking-[0.2em] select-none truncate font-black">{tab.label}</span>
                        </div>
                        {isActive && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 hidden md:block" />}
                    </button>
                );
            })}
            
            <div className="mt-auto hidden md:flex flex-col gap-4">
                {/* Profile Card Mini */}
                <div className="p-4 bg-stone-900/40 rounded-xl border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white overflow-hidden">
                        <img src={AVATAR_LIST.find(a => a.id === playerProfile?.avatarId)?.url || "/Assets/avatar/retrato/1.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-white truncate uppercase italic">{playerProfile?.name || 'PLAYER'}</span>
                        <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">
                            {t(playerProfile?.ranked?.br?.tier ? `rank_${playerProfile.ranked.br.tier.toLowerCase()}` : 'rank_apprentice')}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={onBack}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-stone-900/20 hover:bg-red-900/10 text-red-500/80 hover:text-red-500 rounded-xl transition-all text-[10px] font-black tracking-[0.2em] uppercase border border-white/5"
                >
                    <LogOut size={14} />
                    <span>SAIR DO LOBBY</span>
                </button>
            </div>
        </motion.div>
    );
};
