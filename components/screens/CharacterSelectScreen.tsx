
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CharacterData, RarityTier } from '../../types';
import { BASE_CHARACTERS, RARITY_INFO } from '../../constants';
import { BASE_ROSTER_IDS } from '../../personagens/CharacterDatabase';
import { AudioManager } from '../../services/AudioManager';
import { ChevronLeft, Check, Shield, Activity, Sword, Lock, Users, Sparkles } from 'lucide-react';
import { KiParticles } from '../KiParticles';

const RARITY_COLORS: Record<RarityTier, { text: string, border: string, bg: string, glow: string }> = {
    COMMON: { text: 'text-stone-400', border: 'border-stone-500/30', bg: 'bg-stone-500/10', glow: '' },
    RARE: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    EPIC: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    LEGENDARY: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    ETERNAL: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', glow: '' },
};

export const CharacterSelectScreen: React.FC<{
  overrideMaxSelection?: number;
  onConfirmSelection?: (team: CharacterData[]) => void;
  onBack?: () => void;
}> = ({ onBack }) => {
    const { changeScene, unlockedCharacters, settings, pendingP1Team } = useSceneManager();
    
    const [selectedRarity, setSelectedRarity] = useState<RarityTier | 'ALL'>('ALL');
    const [previewCharId, setPreviewCharId] = useState<string | null>(null);
    const [selectedSelectSkill, setSelectedSelectSkill] = useState<any>(null);

    const rosterList = useMemo(() => {
        const list = (unlockedCharacters || []).filter(c => {
            if (!c || c.id === 'random') return false;
            // Filter by selected rarity
            if (selectedRarity !== 'ALL' && c.rarity !== selectedRarity) return false;
            // Only show characters in the base roster (optional, but keep for consistency)
            if (!BASE_ROSTER_IDS.includes(c.id)) return false;
            return true;
        }).sort((a, b) => {
            const tiers: Record<RarityTier, number> = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, ETERNAL: 5 };
            return tiers[b.rarity] - tiers[a.rarity];
        });

        return list;
    }, [selectedRarity, unlockedCharacters]);

    const activePreviewId = previewCharId || (rosterList.length > 0 ? rosterList[0]?.id : null);
    const activePreviewChar = rosterList.find(c => c.id === activePreviewId) || rosterList[0] || BASE_CHARACTERS[0];

    useEffect(() => {
        if (activePreviewChar && selectedRarity !== 'ALL' && activePreviewChar.rarity !== selectedRarity) {
            setPreviewCharId(null);
        }
    }, [selectedRarity, rosterList, activePreviewChar]);

    useEffect(() => {
        if (activePreviewChar) {
            // Find first skill and preselect it
            const anims = activePreviewChar.spriteConfig?.animations || {};
            const keys = Object.keys(anims);
            const firstEspecialKey = keys.find(x => x.toUpperCase().includes("ESPECIAL_1") || x.toUpperCase().includes("SPECIAL_1") || x.toUpperCase() === "ESPECIAL");
            if (firstEspecialKey) {
                setSelectedSelectSkill({
                    name: settings.language.startsWith('en') ? "Special 1" : "Especial 1",
                    url: anims[firstEspecialKey]?.imageUrl || ""
                });
            } else {
                setSelectedSelectSkill(null);
            }
        } else {
            setSelectedSelectSkill(null);
        }
    }, [activePreviewChar, settings.language]);

    const FilterTab = ({ type, label }: { type: RarityTier | 'ALL', label: string }) => {
        const isActive = selectedRarity === type;
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedRarity(type); AudioManager.getInstance().playSFX('click'); }}
                className={`
                    px-4 h-8 transition-all flex items-center justify-center font-black italic tracking-widest text-[10px] uppercase rounded-lg border cursor-pointer
                    ${isActive ? 'border-orange-500 text-stone-100 bg-orange-500/20 shadow-md shadow-orange-500/20' : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}
                `}
            >
                {label}
            </motion.button>
        );
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <KiParticles color="orange" particleCount={25} speed={1.1} />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-orange-600/5 rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-stone-600/10 rounded-full animate-pulse" />
            </div>

            <AnimatePresence mode="wait">
                {activePreviewChar && (
                    <motion.div
                        key={`bg-${activePreviewChar.id}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <img src={'/Assets/fundosdastelas/fundobanner/b2.png'} className="w-full h-full object-cover mix-blend-luminosity grayscale-[40%] opacity-20 blur-sm scale-110" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900 to-stone-900 mix-blend-color opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950/90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-transparent to-transparent opacity-80" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.header 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full h-16 md:h-24 px-4 md:px-10 flex items-center justify-between z-50 bg-stone-900/40 border-b border-white/10 backdrop-blur-sm pointer-events-auto notch-safe-top"
            >
                <button 
                    onClick={() => {
                        if (onBack) onBack(); else changeScene(SceneName.MAIN_MENU);
                    }}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-stone-600 flex items-center justify-center bg-stone-950/40 hover:border-orange-500 hover:bg-stone-800 text-stone-300 hover:text-white transition-all active:scale-95 shrink-0 group cursor-pointer"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <h1 className="text-xl md:text-4xl font-header italic uppercase tracking-wider text-white text-center absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col">
                    <span className="text-[8px] md:text-xs text-orange-500 tracking-[0.4em] block mb-0.5 md:mb-1 font-sans">TEAM MANAGEMENT</span>
                    {settings.language.startsWith('en') ? 'CLAN ROSTER' : 'ROSTER DO CLÃ'}
                </h1>

                <div className="flex items-center gap-4 bg-stone-900 px-4 py-2 border-2 border-stone-700 rounded-full">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-orange-400" />
                        <span className="text-base md:text-xl font-black italic text-white min-w-[40px] text-right">
                            {rosterList.length} {settings.language.startsWith('en') ? 'FIGHTERS' : 'LUTADORES'}
                        </span>
                    </div>

                    {pendingP1Team && pendingP1Team.length > 0 && (
                        <div className="flex items-center gap-2 border-l border-stone-700 pl-4 ml-2">
                            <div className="flex -space-x-2">
                                {pendingP1Team.map((char, idx) => (
                                    <img 
                                        key={`team-${idx}-${char.id}`} 
                                        src={char.spriteConfig?.portraitUrl} 
                                        alt="Team" 
                                        className="w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-orange-500 bg-orange-950 object-cover" 
                                        style={{ zIndex: 10 - idx }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.header>

            <main className="flex-1 w-full flex flex-row px-4 md:px-10 gap-4 md:gap-10 overflow-hidden relative z-10 my-4">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    className="rigid-container w-1/2 xl:w-[480px] flex flex-col gap-4 overflow-hidden relative"
                >
                    <div className="flex flex-wrap gap-2 pb-2">
                        <FilterTab type="ALL" label={settings.language.startsWith('en') ? "ALL" : "TODOS"} />
                        <FilterTab type="COMMON" label={settings.language.startsWith('en') ? "COMMON" : "COMUM"} />
                        <FilterTab type="RARE" label={settings.language.startsWith('en') ? "RARE" : "RARO"} />
                        <FilterTab type="EPIC" label={settings.language.startsWith('en') ? "EPIC" : "ÉPICO"} />
                        <FilterTab type="LEGENDARY" label={settings.language.startsWith('en') ? "LEGENDARY" : "LENDÁRIO"} />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 safe-content-flow">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {rosterList.map((char, index) => {
                                const isPreview = activePreviewId === char.id;
                                const unlockedChar = unlockedCharacters.find(u => u.id === char.id);
                                const level = unlockedChar ? unlockedChar.level : 1;

                                return (
                                    <motion.button
                                        key={`roster-${char.id}-${index}`}
                                        onClick={() => {
                                            setPreviewCharId(char.id);
                                            AudioManager.getInstance().playSFX('click');
                                        }}
                                        className={`
                                            relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300 group
                                            ${isPreview ? 'border-orange-500  scale-[1.02]' : 'border-stone-800 opacity-70 hover:opacity-100 hover:border-stone-600'}
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-stone-900">
                                            <img src={char.spriteConfig?.portraitUrl || undefined} className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-110" alt="" />
                                        </div>
                                        <div className={`absolute inset-0 bg-gradient-to-t via-black/40 to-transparent ${isPreview ? 'from-orange-950/90' : 'from-black/80'}`} />
                                        
                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[8px] font-black italic uppercase tracking-widest text-white border border-stone-700 truncate-text max-w-[80%]">
                                            {settings.language.startsWith('en') ? char.rarity : (char.rarity === 'COMMON' ? 'COMUM' : char.rarity === 'RARE' ? 'RARO' : char.rarity === 'EPIC' ? 'ÉPICO' : 'LENDÁRIO')}
                                        </div>

                                        <div className="absolute bottom-0 inset-x-0 p-2 text-center pointer-events-none flex flex-col items-center">
                                            <span className={`font-black italic uppercase tracking-wider block truncate w-full ${isPreview ? 'text-[11px] md:text-sm text-white' : 'text-[9px] md:text-xs text-stone-400'}`}>
                                                {char.name.split(' ')[0]}
                                            </span>
                                            <div className="text-[10px] font-black italic flex items-center gap-1 mt-0.5 text-orange-400">
                                                <span>LVL {level}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                        {rosterList.length === 0 && (
                            <div className="w-full h-full flex flex-col items-center justify-center opacity-50 mt-10">
                                <Lock size={48} className="mb-4 text-stone-600" />
                                <span className="font-black uppercase tracking-widest text-stone-500 text-center">
                                    {settings.language.startsWith('en') 
                                        ? <>No characters<br/>of this rarity unlocked</> 
                                        : <>Nenhum personagem<br/>desta raridade adquirido</>}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                    className="rigid-container flex-1 relative flex flex-col bg-stone-900 border border-stone-800 rounded-[2rem] overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {activePreviewChar && (
                            <motion.div
                                key={`content-${activePreviewChar.id}`}
                                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                <div className="absolute top-1/4 -right-10 opacity-[0.05] pointer-events-none transform -rotate-12 z-0">
                                    <h1 className="text-[200px] font-black italic uppercase leading-none">{activePreviewChar.name.split(' ')[0]}</h1>
                                </div>

                                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10">
                                    <img src={activePreviewChar.spriteConfig?.portraitUrl || undefined} className="absolute -bottom-20 -right-20 h-[120%] object-contain origin-bottom-right" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                                </div>

                                <div className="relative z-10 px-10 py-8 flex items-center gap-6">
                                    <div className={`px-4 py-1 skew-x-[-15deg] ${RARITY_INFO[activePreviewChar.rarity].bg}`}>
                                        <span className={`skew-x-[15deg] block font-black italic text-sm ${RARITY_INFO[activePreviewChar.rarity].color}`}>
                                            {settings.language.startsWith('en') ? activePreviewChar.rarity : (activePreviewChar.rarity === 'COMMON' ? 'COMUM' : activePreviewChar.rarity === 'RARE' ? 'RARO' : activePreviewChar.rarity === 'EPIC' ? 'ÉPICO' : 'LENDÁRIO')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {activePreviewChar.tags?.map((tag) => (
                                            <span key={`tag-${tag}`} className="bg-stone-800/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-stone-300 border border-stone-700 backdrop-blur-sm">
                                                {settings.language.startsWith('en') 
                                                    ? (tag === 'SAIYAJIN' ? 'SAIYAN' : tag === 'MESTRE' ? 'MASTER' : tag === 'CLÃ GOKU' ? 'GOKU CLAN' : tag === 'TERRÁQUEO' ? 'EARTHLING' : tag === 'HUMANO' ? 'HUMAN' : tag === 'NÃO-HUMANO' ? 'NON-HUMAN' : tag === 'ANDROID' ? 'CYBORG' : tag)
                                                    : tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-10 px-10 flex-1 flex flex-col justify-center">
                                    <h2 className="text-4xl md:text-5xl lg:text-[60px] font-black italic uppercase tracking-tighter text-white leading-none mb-4">
                                        {activePreviewChar.name.split(' ').map((word, i) => (
                                            <span key={`name-word-${word}-${i}`} className={i === 0 ? 'text-orange-500' : 'text-white'}>
                                                {word}{' '}
                                            </span>
                                        ))}
                                    </h2>

                                    {/* REAL character specials and ultimates list & live animation preview */}
                                    <div className="flex flex-col gap-3 mt-1 pointer-events-auto max-w-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs font-black tracking-widest text-orange-500 uppercase">
                                                {settings.language.startsWith('en') ? 'TECHNIQUES & SKILLS' : 'TÉCNICAS & HABILIDADES'}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 items-stretch">
                                            {/* Skill Pills */}
                                            <div className="flex flex-col gap-1.5 w-1/2 justify-start max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                                {(() => {
                                                    const anims = activePreviewChar.spriteConfig?.animations || {};
                                                    const keys = Object.keys(anims);
                                                    const getGif = (patt: string) => {
                                                       const k = keys.find(x => x.toUpperCase().includes(patt.toUpperCase()));
                                                       return k ? anims[k]?.imageUrl || "" : "";
                                                    };
                                                    
                                                    const skillsList = [];
                                                    const isEn = settings.language.startsWith('en');
                                                    const specLabel = isEn ? "Special" : "Especial";
                                                    
                                                    if (keys.some(x => x.toUpperCase().includes("ESPECIAL_1") || x.toUpperCase().includes("SPECIAL_1") || x.toUpperCase() === "ESPECIAL")) {
                                                       skillsList.push({ name: `${specLabel} 1`, url: getGif("ESPECIAL_1") || getGif("SPECIAL_1") || getGif("ESPECIAL") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ESPECIAL_2") || x.toUpperCase().includes("SPECIAL_2"))) {
                                                       skillsList.push({ name: `${specLabel} 2`, url: getGif("ESPECIAL_2") || getGif("SPECIAL_2") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ESPECIAL_3") || x.toUpperCase().includes("SPECIAL_3"))) {
                                                       skillsList.push({ name: `${specLabel} 3`, url: getGif("ESPECIAL_3") || getGif("SPECIAL_3") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ESPECIAL_4") || x.toUpperCase().includes("SPECIAL_4"))) {
                                                       skillsList.push({ name: `${specLabel} 4`, url: getGif("ESPECIAL_4") || getGif("SPECIAL_4") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ESPECIAL_5") || x.toUpperCase().includes("SPECIAL_5"))) {
                                                        skillsList.push({ name: `${specLabel} 5`, url: getGif("ESPECIAL_5") || getGif("SPECIAL_5") });
                                                     }
                                                     if (keys.some(x => x.toUpperCase().includes("ULTIMATE_1") || x.toUpperCase() === "ULTIMATE")) {
                                                       skillsList.push({ name: "Ultimate 1", url: getGif("ULTIMATE_1") || getGif("ULTIMATE") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ULTIMATE_2"))) {
                                                       skillsList.push({ name: "Ultimate 2", url: getGif("ULTIMATE_2") });
                                                    }
                                                    if (keys.some(x => x.toUpperCase().includes("ULTIMATE_3"))) {
                                                       skillsList.push({ name: "Ultimate 3", url: getGif("ULTIMATE_3") });
                                                    }
                                                    
                                                    // Ultimate combinados
                                                    if (keys.some(x => x.toUpperCase().includes("COMBINADO") || x.toUpperCase().includes("COMBINADAS"))) {
                                                        const partner = (activePreviewChar?.id === "goku_base") ? "Bardock" : activePreviewChar?.id === "kuririn" ? "Android 18" : "";
                                                        skillsList.push({ 
                                                           name: partner 
                                                               ? (isEn ? `Combo Ult (${partner})` : `Ult Combinado (${partner})`) 
                                                               : (isEn ? "Combo Ultimate" : "Ultimate Combinado"), 
                                                           url: getGif("COMBINADO") || getGif("COMBINADAS") 
                                                        });
                                                    }
                                                    
                                                    if (skillsList.length === 0) {
                                                       return <span className="text-xs text-stone-500 font-bold uppercase font-mono">
                                                           {isEn ? 'No techniques mapped' : 'Nenhuma técnica mapeada'}
                                                       </span>;
                                                    }
                                                    
                                                    return skillsList.map((sk, index) => {
                                                       const isSelectedSk = selectedSelectSkill?.name === sk.name;
                                                       return (
                                                           <button
                                                              key={`select-skill-${sk.name}-${index}`}
                                                              onClick={() => { setSelectedSelectSkill(sk); AudioManager.getInstance().playSFX('click'); }}
                                                              className={`
                                                                 px-3 py-1.5 text-left rounded-lg border font-bold text-[10px] uppercase transition-all shrink-0
                                                                 ${isSelectedSk ? 'bg-orange-500/10 border-orange-500/60 text-white shadow-lg font-black' : 'bg-stone-900/40 border-stone-850 text-stone-400 hover:text-stone-200 hover:bg-stone-900/85'}
                                                              `}
                                                           >
                                                              {sk.name}
                                                           </button>
                                                       );
                                                    });
                                                })()}
                                            </div>
                                            
                                            {/* Skill Preview Window */}
                                            <div className="flex-1 w-1/2 aspect-[16/10] bg-stone-950/70 border border-stone-900 rounded-xl flex items-center justify-center overflow-hidden relative max-h-[160px]">
                                                {/* Retro CRT/Hologram screen overlay */}
                                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.12)_50%)] bg-[size:100%_4px] pointer-events-none opacity-25 z-10" />
                                                
                                                {selectedSelectSkill?.url ? (
                                                    <img 
                                                       key={selectedSelectSkill.url}
                                                       src={selectedSelectSkill.url} 
                                                       className="max-h-[85%] max-w-[85%] object-contain animate-fade-in" 
                                                       referrerPolicy="no-referrer"
                                                       alt="" 
                                                    />
                                                ) : (
                                                    <div className="text-stone-600 flex flex-col items-center gap-1">
                                                       <Activity size={20} className="animate-pulse" />
                                                       <span className="text-[9px] font-bold uppercase tracking-widest font-mono">STANDBY ACTIVE</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto px-10 py-8 bg-stone-950/40 border-t border-stone-800 flex justify-between items-center z-10 pointer-events-auto">
                                    <div className="text-stone-400 text-sm font-black italic tracking-widest flex items-center gap-2">
                                        <span className="text-[10px] uppercase">STATUS</span>
                                        <div className="flex items-center gap-1 text-white">
                                            <span className="text-orange-500">
                                                {settings.language.startsWith('en') ? 'UNLOCKED' : 'ADQUIRIDO'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="px-8 py-4 bg-stone-800 border-2 border-stone-700 text-stone-400 transition-all uppercase font-black italic tracking-widest rounded-xl flex items-center gap-3">
                                            <Check className="w-5 h-5" />
                                            {settings.language.startsWith('en') ? 'COLLECTION' : 'COLEÇÃO'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
            `}</style>
        </div>
    );
};

