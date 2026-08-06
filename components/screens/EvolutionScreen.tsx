
import React, { useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { RARITY_INFO, MAX_HP, MAX_KI } from '../../constants';
import { CHARACTER_STAT_OVERRIDES } from '../../personagens/CharacterDatabase';
import { CharacterPreview } from '../CharacterPreview';
import { AudioManager } from '../../services/AudioManager';
import { ChevronRight, Zap, Shield, Sword, ChevronLeft, Star, ArrowUpCircle, Database } from 'lucide-react';

export const EvolutionScreen: React.FC = () => {
  const { changeScene, unlockedCharacters, crystalBalances, evolveCharacter, distributeEvolutionPoints } = useSceneManager();
  
  // Sorting: Favorites/Strongest first
  const sortedRoster = [...unlockedCharacters].sort((a, b) => (b.evolutionLevel || 1) - (a.evolutionLevel || 1));
  const [selectedCharId, setSelectedCharId] = useState<string>(sortedRoster[0]?.id || '');
  const selectedChar = unlockedCharacters.find(c => c.id === selectedCharId);

  const handleEvolve = () => {
      if (selectedChar) {
          const res = evolveCharacter(selectedChar.id);
          if (res.success) {
              AudioManager.getInstance().playSFX('confirm');
          } else {
              AudioManager.getInstance().playSFX('cancel');
              alert(res.message);
          }
      }
  };

  const handleDistribute = (stat: 'hp' | 'attack' | 'defense' | 'speed') => {
      if (selectedChar) {
          const res = distributeEvolutionPoints(selectedChar.id, stat);
          if (!res.success) {
              AudioManager.getInstance().playSFX('cancel');
          }
      }
  };

  const StatModule = ({ label, value, type, icon: Icon, potentialValue, upgrades, onAdd, availablePoints }: { 
      label: string, 
      value: number, 
      type: 'hp' | 'attack' | 'defense' | 'speed', 
      icon: any, 
      potentialValue: number,
      upgrades: number,
      onAdd?: () => void,
      availablePoints?: number
  }) => {
      const maxVal = Math.max(type === 'hp' ? 5000 : 50, potentialValue); // Visual scale
      const pct = Math.min(100, (value / maxVal) * 100);
      
      const cost = 1 + (upgrades * 2);
      const canAfford = availablePoints !== undefined && availablePoints >= cost;

      let colorClass = "from-orange-500 to-blue-700";
      if (type === 'attack') colorClass = "from-red-500 to-red-700";
      if (type === 'speed') colorClass = "from-yellow-400 to-yellow-600";
      if (type === 'defense') colorClass = "from-blue-500 to-blue-700";
      if (type === 'hp') colorClass = "from-green-500 to-green-700";

      return (
          <div className="mb-6 group">
              <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-black/40 border border-white/10 text-white group-hover:scale-110 transition-transform`}>
                          <Icon size="2vmin" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[1.4vmin] font-black text-slate-400 tracking-widest uppercase group-hover:text-white transition-colors italic leading-none">{label}</span>
                        <span className="text-[1vmin] text-orange-500 font-bold mt-1">LV.{upgrades}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[3.5vmin] font-header text-white leading-none italic dragon-gradient-text">{value}</span>
                    </div>
                    {onAdd && (
                        <button 
                            onClick={onAdd}
                            disabled={!canAfford}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${canAfford ? 'bg-orange-500/20 border-orange-500/50 text-white hover:bg-orange-500/40 active:scale-95' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}
                        >
                            <ArrowUpCircle size="2vmin" />
                            <span className="text-[1vmin] font-black mt-1">COST {cost}</span>
                        </button>
                    )}
                  </div>
              </div>
              
              <div className="h-[2vmin] bg-black/60 rounded-full border border-white/10 relative overflow-hidden p-[2px]">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${colorClass} relative`}
                    style={{ width: `${pct}%` }}
                  >
                      <div className="absolute inset-0 bg-white/20 animate-scanline opacity-30"></div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full h-full flex bg-stone-950 text-stone-200 relative overflow-hidden font-sans select-none">
        
        {/* --- BACKGROUND LAYERS --- */}
        <div className="absolute inset-0 z-0">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m9.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>

            <div className="absolute inset-0 opacity-20 pointer-events-none z-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-orange-500 opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />
            
            {/* Moving Energy Lines */}
            <div className="absolute inset-0 opacity-10">
                {[...Array(8)].map((_, i) => (
                    <div 
                        key={`line-${i}`}
                        className="absolute h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full animate-energy-line"
                        style={{
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            {/* Animated Grid Floor */}
            <div 
                className="absolute bottom-0 left-0 w-full h-[40%] opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    transform: 'perspective(500px) rotateX(60deg)',
                    transformOrigin: 'bottom'
                }}
            ></div>

            {/* Floating Energy Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(25)].map((_, i) => (
                    <div 
                        key={`particle-${i}`}
                        className="absolute bg-orange-400/30 rounded-full blur-[2px] animate-float "
                        style={{
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 10 + 5}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    ></div>
                ))}
            </div>
        </div>

        {/* --- TOP BAR --- */}
        <div className="absolute top-0 left-0 w-full p-[4vmin] flex justify-between items-center z-30 animate-slide-in-top">
            <div className="flex items-center gap-4 md:gap-6">
                <button 
                    onClick={() => { AudioManager.getInstance().playSFX('cancel'); changeScene(SceneName.MAIN_MENU); }}
                    className="w-12 h-12 md:w-20 md:h-20 bg-white/5 hover:bg-white/10 hover:border-orange-500 border border-white/10 rounded-2xl flex items-center justify-center transition-all group cursor-pointer shadow-lg active:scale-95"
                >
                    <ChevronLeft className="w-6 h-6 md:w-10 md:h-10 text-slate-300 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-xl md:text-[4vmin] font-header italic text-white leading-none tracking-tighter drop-shadow-dragon">
                        POWER <span className="dragon-gradient-text">AWAKENING</span>
                    </h1>
                    <div className="flex gap-2 items-center mt-1">
                        <div className="h-[2px] w-[6vmin] bg-orange-500"></div>
                        <span className="text-[1.2vmin] text-slate-400 font-bold uppercase tracking-[0.4em]">EVOLUTION LABORATORY</span>
                    </div>
                </div>
            </div>

            {selectedChar && (
                <div className="flex items-center gap-6 bg-black/40 backdrop-blur-md px-[4vmin] py-[1.5vmin] rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[1vmin] font-bold text-slate-400 uppercase tracking-widest mb-1">EVOLUTION CRYSTALS</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-[3.5vmin] font-black italic tracking-tighter text-orange-500`}>
                                {crystalBalances[selectedChar.id] || 0}
                            </span>
                            <Database size="2.5vmin" className="text-orange-500" />
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex relative z-10 pt-[15vmin]">
            
            {/* LEFT: ROSTER LIST */}
            <div className="w-[28%] h-full flex flex-col pl-[4vmin] pb-[4vmin] animate-slide-in-left">
                <div className="bg-slate-900/60 border border-white/10 h-full rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl shadow-2xl">
                    <div className="p-[2.5vmin] bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <span className="text-white font-black italic tracking-widest text-[1.4vmin] uppercase">WARRIOR ROSTER</span>
                        <span className="text-[1vmin] text-slate-500 font-bold uppercase tracking-widest">{sortedRoster.length} UNITS</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-[1.5vmin] space-y-2 custom-scrollbar">
                        {sortedRoster.map((char, index) => (
                            <button
                                key={`${char.id}-${index}`}
                                onClick={() => { setSelectedCharId(char.id); AudioManager.getInstance().playSFX('click'); }}
                                className={`
                                    w-full flex items-center gap-4 p-[1.5vmin] rounded-xl transition-all border-2 group
                                    ${selectedCharId === char.id 
                                        ? 'bg-orange-500/10 border-orange-500 ' 
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'}
                                `}
                            >
                                <div className="w-[6vmin] h-[6vmin] rounded-lg bg-black/40 border border-white/10 overflow-hidden relative flex-shrink-0">
                                    <div className="absolute inset-0 opacity-30" style={{backgroundColor: char.color}}></div>
                                    <div className="absolute inset-0 scale-150 top-2">
                                        <CharacterPreview character={char} animate={false} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className={`text-[1.8vmin] font-black italic uppercase truncate leading-none transition-colors ${selectedCharId === char.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{char.name}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[1.2vmin] text-orange-500 font-black italic">EVO.{char.evolutionLevel || 1}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                                        <span className="text-[1vmin] text-slate-500 font-bold uppercase tracking-widest">{char.rarity}</span>
                                    </div>
                                </div>
                                {(crystalBalances[char.id] || 0) >= ((char.evolutionLevel || 1) * 50) && (char.evolutionLevel || 1) < 10 && (
                                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse "></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CENTER: CHARACTER SHOWCASE */}
            <div className="flex-1 relative flex items-end justify-center pb-[8vmin] animate-fade-in">
                {selectedChar && (
                    <>
                        {/* Floor Aura */}
                        <div className="absolute bottom-[2vmin] w-[50vmin] h-[15vmin] bg-orange-500/10 rounded-[100%] border-2 border-orange-500/20 transform scale-y-50  animate-pulse-glow"></div>
                        
                        {/* Character Model */}
                        <div className="relative z-20 w-[50vmin] h-[65vmin] filter drop-shadow-dragon transition-all duration-700 hover:scale-105">
                             <CharacterPreview character={selectedChar} animate={true} scale={1.8} />
                        </div>

                        {/* Floating Stats Summary */}
        <div className="absolute top-[2vmin] left-1/2 -translate-x-1/2 z-20 flex gap-8">
            <div className="text-center">
                <span className="text-[1vmin] font-bold text-slate-500 uppercase tracking-[0.3em] block mb-1">TOTAL HP</span>
                <span className="text-[3vmin] font-header italic text-white leading-none">{(selectedChar.maxHp ?? MAX_HP) + (selectedChar.stats.defense * 20)}</span>
            </div>
            <div className="w-[1px] h-[4vmin] bg-white/10 self-center"></div>
                            <div className="text-center">
                                <span className="text-[1vmin] font-bold text-slate-500 uppercase tracking-[0.3em] block mb-1">MAX KI</span>
                                <span className="text-[3vmin] font-header italic text-white leading-none">{MAX_KI + (selectedChar.stats.speed * 5)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* RIGHT: UPGRADE PANEL */}
            <div className="w-[32%] h-full pr-[4vmin] pb-[4vmin] flex flex-col pt-[2vmin] animate-slide-in-right">
                {selectedChar ? (
                    <div className="bg-slate-900/60 flex-1 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl relative flex flex-col overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Zap size="15vmin" className="text-white" />
                        </div>
                        
                        <div className="p-[4vmin] pb-0 relative z-10 flex-shrink-0">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-[3.5vmin] font-header italic text-white tracking-tighter leading-none mb-2 uppercase">{selectedChar.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={`star-${i}`} size="1.2vmin" className={`fill-current ${i < (selectedChar.rarity === 'LEGENDARY' ? 5 : selectedChar.rarity === 'EPIC' ? 4 : 3) ? 'text-yellow-500' : 'text-white/10'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[1.2vmin] font-black text-orange-500 italic tracking-widest uppercase">{selectedChar.rarity} CLASS</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[1.2vmin] font-bold text-slate-500 uppercase tracking-widest mb-1">EVOLUTION PHASE</div>
                                    <div className="text-[4.5vmin] font-header italic text-white leading-none dragon-gradient-text">{selectedChar.evolutionLevel || 1} / 10</div>
                                </div>
                            </div>
                            
                            <div className="mb-6 p-[2vmin] bg-orange-500/10 border border-orange-500/30 rounded-xl flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[1vmin] font-bold text-slate-400 uppercase tracking-widest">AVAILABLE EVOLUTION POINTS</span>
                                    <span className="text-[3vmin] font-header text-white italic">{selectedChar.availablePoints || 0}</span>
                                </div>
                                <Zap className="text-orange-500 animate-pulse" size="3vmin" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-[4vmin] pb-[4vmin] relative z-10 custom-scrollbar space-y-4">
                            <div>
                                {(() => {
                                    const potential = CHARACTER_STAT_OVERRIDES[selectedChar.id] || { maxHp: 2000, stats: { attack: 10, speed: 10, defense: 10 } };
                                    const upgrades = selectedChar.statUpgrades || { hp: 0, attack: 0, defense: 0, speed: 0 };
                                    return (
                                        <>
                                            <StatModule 
                                                label="VITALITY (HP)" 
                                                value={selectedChar.maxHp || 1000} 
                                                potentialValue={potential.maxHp}
                                                type="hp" 
                                                icon={ArrowUpCircle}
                                                upgrades={upgrades.hp}
                                                onAdd={() => handleDistribute('hp')}
                                                availablePoints={selectedChar.availablePoints}
                                            />
                                            <StatModule 
                                                label="STRIKE POWER" 
                                                value={selectedChar.stats.attack} 
                                                potentialValue={potential.stats.attack}
                                                type="attack" 
                                                icon={Sword}
                                                upgrades={upgrades.attack}
                                                onAdd={() => handleDistribute('attack')}
                                                availablePoints={selectedChar.availablePoints}
                                            />
                                            <StatModule 
                                                label="IRON DEFENSE" 
                                                value={selectedChar.stats.defense} 
                                                potentialValue={potential.stats.defense}
                                                type="defense" 
                                                icon={Shield}
                                                upgrades={upgrades.defense}
                                                onAdd={() => handleDistribute('defense')}
                                                availablePoints={selectedChar.availablePoints}
                                            />
                                            <StatModule 
                                                label="LIGHTNING SPEED" 
                                                value={selectedChar.stats.speed} 
                                                potentialValue={potential.stats.speed}
                                                type="speed" 
                                                icon={Zap}
                                                upgrades={upgrades.speed}
                                                onAdd={() => handleDistribute('speed')}
                                                availablePoints={selectedChar.availablePoints}
                                            />
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Evolve Button Area */}
                            <div className="mt-4 p-[3vmin] bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[1vmin] font-bold text-slate-500 uppercase tracking-widest mb-1">EVOLUTION COST</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[2.5vmin] font-header italic ${ (crystalBalances[selectedChar.id] || 0) >= ((selectedChar.evolutionLevel || 1) * 50) ? 'text-white' : 'text-red-500'}`}>
                                                { (selectedChar.evolutionLevel || 1) < 10 ? (selectedChar.evolutionLevel || 1) * 50 : 'MAX' }
                                            </span>
                                            <Database size="1.5vmin" className="text-orange-500" />
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={handleEvolve}
                                        disabled={(selectedChar.evolutionLevel || 1) >= 10 || (crystalBalances[selectedChar.id] || 0) < ((selectedChar.evolutionLevel || 1) * 50)}
                                        className={`
                                            px-8 py-3 rounded-xl font-header italic uppercase tracking-widest transition-all
                                            ${ (selectedChar.evolutionLevel || 1) < 10 && (crystalBalances[selectedChar.id] || 0) >= ((selectedChar.evolutionLevel || 1) * 50)
                                                ? 'bg-orange-500 text-white hover:scale-105 shadow-lg shadow-orange-500/20'
                                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-white/5'}
                                        `}
                                    >
                                        {(selectedChar.evolutionLevel || 1) >= 10 ? 'MAX LEVEL' : 'AWAKEN POWER'}
                                    </button>
                                </div>
                                <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-orange-500 transition-all duration-1000" 
                                        style={{ width: `${(selectedChar.evolutionLevel || 1) * 10}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Progression Unlocks */}
                            {selectedChar.progressionUnlocks && selectedChar.progressionUnlocks.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between text-[1.2vmin] font-bold tracking-widest uppercase mb-4">
                                        <span className="text-slate-500">EVOLUTION UNLOCKS</span>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedChar.progressionUnlocks.map((unlock, i) => {
                                            const isUnlocked = selectedChar.level >= unlock.level;
                                            return (
                                                <div key={`evo-unlock-${unlock.level}-${i}`} className={`p-[1.5vmin] rounded-xl border flex items-center gap-3 transition-colors ${isUnlocked ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/40 border-white/5 opacity-50'}`}>
                                                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-500'}`}>
                                                        {unlock.type === 'SKILL' ? <Zap size="2vmin" /> : unlock.type === 'TRANSFORM' ? <Star size="2vmin" /> : <Shield size="2vmin" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-[1.4vmin] font-black italic uppercase truncate ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{unlock.name}</span>
                                                            <span className={`text-[1.2vmin] font-bold ${isUnlocked ? 'text-orange-400' : 'text-slate-500'}`}>LV.{unlock.level}</span>
                                                        </div>
                                                        <p className="text-[1.1vmin] text-slate-400 truncate">{unlock.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* System Status */}
                            <div className="mt-6 p-[2vmin] bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-[1.2vmin] font-bold tracking-widest uppercase">
                                    <span className="text-slate-500">SYSTEM STATUS</span>
                                    <span className="text-orange-500 animate-pulse">OPTIMIZED</span>
                                </div>
                                <div className="h-[2px] w-full bg-white/5"></div>
                                <p className="text-[1.1vmin] text-slate-400 font-medium leading-relaxed italic">
                                    "THE LIMITS OF A WARRIOR ARE ONLY DEFINED BY THEIR WILL TO SURPASS THEM."
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 opacity-30 h-full justify-center">
                        <Zap size="8vmin" className="animate-bounce" />
                        <span className="text-[2vmin] font-black italic tracking-[0.5em] uppercase">SELECT WARRIOR</span>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};
