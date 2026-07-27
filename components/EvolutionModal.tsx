import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../contexts/SceneContext';
import { CharacterData } from '../types';
import { RESOURCE_SPRITES } from '../constants';
import { AudioManager } from '../services/AudioManager';
import { getEvolutionStats } from '../personagens/CharacterDatabase';
import { Zap, Shield, Flame, Star, ChevronRight, X, TrendingUp } from 'lucide-react';

interface EvolutionModalProps {
    character: CharacterData;
    onClose: () => void;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({ character, onClose }) => {
    const { crystalBalances, evolveCharacter } = useSceneManager();
    
    const charId = character.id;
    const currentLevel = character.evolutionLevel || 1;
    const crystalBalance = crystalBalances[charId] || 0;
    
    // Evolution cost scaling: Level 1->2 (50), 2->3 (100), ..., 9->10 (450)
    const cost = currentLevel * 50;
    const isMaxLevel = currentLevel >= 10;
    const canEvolve = !isMaxLevel && crystalBalance >= cost;

    // Calculate projected stats for next level
    const nextLevelStats = !isMaxLevel ? getEvolutionStats(charId, currentLevel + 1) : null;
    const attackBonus = nextLevelStats ? nextLevelStats.stats.attack - character.stats.attack : 0;
    const defenseBonus = nextLevelStats ? nextLevelStats.stats.defense - character.stats.defense : 0;
    const speedBonus = nextLevelStats ? nextLevelStats.stats.speed - character.stats.speed : 0;

    const handleEvolve = () => {
        if (!canEvolve) return;
        const res = evolveCharacter(charId);
        if (res.success) {
            AudioManager.getInstance().playSFX('confirm');
        } else {
            AudioManager.getInstance().playSFX('cancel');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg bg-stone-900 border-2 border-stone-800 rounded-[2rem] overflow-hidden shadow-2xl relative"
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 bg-stone-950/50 hover:bg-red-500/20 border border-stone-800 hover:border-red-500 rounded-full flex items-center justify-center text-stone-500 hover:text-red-500 transition-all z-50"
                >
                    <X size={20} />
                </button>

                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-orange-600/20 to-transparent pointer-events-none" />

                <div className="p-8 relative z-10">
                    <div className="flex items-center gap-6 mb-8">
                        {/* Portrait */}
                        <div className="relative w-24 h-24 rounded-2xl border-2 border-orange-500/30 bg-stone-950 overflow-hidden shrink-0 shadow-lg">
                            <img 
                                src={character.spriteConfig?.portraitUrl || `/Assets/personagens/selecao/${character.id}.png`} 
                                className="w-full h-full object-cover object-top"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                            <div className="absolute bottom-1 right-1 bg-orange-600 px-1.5 py-0.5 rounded text-[10px] font-black italic text-white border border-orange-400">
                                LVL {currentLevel}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black italic uppercase text-white leading-none mb-2">EVOLUÇÃO</h2>
                            <h3 className="text-xl font-bold text-orange-500 uppercase tracking-tighter">{character.name}</h3>
                            <div className="flex items-center gap-1 mt-2">
                                {[...Array(10)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 w-4 rounded-full border border-white/5 ${i < currentLevel ? 'bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.6)]' : 'bg-stone-800'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Comparison */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <StatBox 
                            label="ATAQUE" 
                            value={character.stats.attack} 
                            bonus={attackBonus} 
                            icon={<Flame className="text-red-500" size={14} />} 
                        />
                        <StatBox 
                            label="DEFESA" 
                            value={character.stats.defense} 
                            bonus={defenseBonus} 
                            icon={<Shield className="text-blue-500" size={14} />} 
                        />
                        <StatBox 
                            label="VELOC." 
                            value={character.stats.speed} 
                            bonus={speedBonus} 
                            icon={<Zap className="text-yellow-500" size={14} />} 
                        />
                    </div>

                    {/* Crystals Progress */}
                    <div className="bg-stone-950 rounded-2xl border border-white/5 p-6 mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={RESOURCE_SPRITES[charId] || RESOURCE_SPRITES.curr_roulette} 
                                    className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                                    alt="Cristal" 
                                />
                                <div>
                                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest block">MEUS CRISTAIS</span>
                                    <span className="text-lg font-black italic text-stone-100 font-mono">
                                        {crystalBalance} <span className="text-stone-600">/ {isMaxLevel ? '--' : cost}</span>
                                    </span>
                                </div>
                            </div>
                            {!isMaxLevel && (
                                <div className={`px-3 py-1 rounded-lg border font-black italic text-xs ${canEvolve ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-stone-800 text-stone-600 bg-stone-900/50'}`}>
                                    {canEvolve ? 'PRONTO!' : 'INSUFICIENTE'}
                                </div>
                            )}
                        </div>

                        <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-white/5 relative z-10 shadow-inner">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${isMaxLevel ? 100 : Math.min((crystalBalance / cost) * 100, 100)}%` }}
                                transition={{ duration: 1, type: "spring" }}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleEvolve}
                        disabled={!canEvolve || isMaxLevel}
                        className={`
                            w-full h-20 rounded-2xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group
                            ${canEvolve 
                                ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] active:scale-[0.98]' 
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
                        `}
                    >
                        {canEvolve && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />}
                        
                        <TrendingUp size={24} className={canEvolve ? 'animate-bounce' : ''} />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">SISTEMA DE EVOLUÇÃO</span>
                            <span className="text-xl font-black italic uppercase tracking-wider">
                                {isMaxLevel ? 'EVOLUÇÃO MÁXIMA' : `EVOLUIR PARA NV. ${currentLevel + 1}`}
                            </span>
                        </div>
                        <ChevronRight size={20} className={canEvolve ? 'group-hover:translate-x-1 transition-transform' : ''} />
                    </button>

                    <p className="text-center text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-6">
                        A evolução consome cristais e aumenta atributos base permanentemente.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

const StatBox: React.FC<{ label: string; value: number; bonus: number; icon: React.ReactNode }> = ({ label, value, bonus, icon }) => (
    <div className="bg-stone-950/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <span className="text-[8px] text-stone-500 font-black uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-center gap-1.5">
            <span className="text-base font-black italic text-white font-mono">{value}</span>
            {bonus > 0 && (
                <div className="flex items-center text-green-500 font-black italic text-[10px]">
                    <ChevronRight size={8} />
                    <span>+{bonus}</span>
                </div>
            )}
        </div>
    </div>
);
