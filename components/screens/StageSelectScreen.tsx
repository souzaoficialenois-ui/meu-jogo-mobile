import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Map, Play, Zap, Sun, Moon, Orbit, Clock, ChevronRight, Lock } from 'lucide-react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { STAGE_DB } from '../../constants/StageDatabase';
import { KiParticles } from '../KiParticles';

const ICONS: Record<string, any> = {
    'DAY': Sun,
    'ALIEN': Orbit,
    'ARENA': Map,
    'NIGHT': Moon
};

const STAGES = STAGE_DB.map(s => ({
    ...s,
    icon: ICONS[s.id] || Map
}));

const BATTLE_MUSICS = [
    { id: 'random', name: 'Aleatória', url: null, creator: 'Música Aleatória' },
    { id: 'broly_theme', name: "Broly's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/brolys%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'gogeta_ssj4', name: 'Gogeta (SSJ4) Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/gogeta%20(ssj4)%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'gogeta_blue', name: 'Gogeta Blue Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/gogeta%20blues%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'hits_theme', name: "Hit's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/hits%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'super_baby_2', name: 'Super Baby 2 Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/super%20baby%202s%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'ui_goku', name: "UI Goku's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/ultra%20instinct%20gokus%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'vegito_blue', name: 'Vegito Blue Theme', url: '/Assets/SONS/MUSICAS%20BATALHA/vegito%20blues%20theme.ogg', creator: 'DBFZ OST' },
    { id: 'zamasu_theme', name: "Zamasu's Theme", url: '/Assets/SONS/MUSICAS%20BATALHA/zamasus%20theme.ogg', creator: 'DBFZ OST' },
];

import { useUI, UIProvider } from '../../contexts/UIContext';

const StageSelectScreenContent: React.FC = () => {
    const { 
        stageTheme, 
        setStageTheme, 
        timeLimit,
        setTimeLimit,
        changeScene, 
        finalizeMatchSetup, 
        pendingP1Team, 
        pendingP2Team,
        setBattleMusic,
        settings,
        isItemUnlocked
    } = useSceneManager();
    const { s } = useUI();

    const getStageName = (id: string, defaultName: string) => {
        if (settings.language.startsWith('en')) {
            switch (id) {
                case 'TORNEIO_DO_PODER': return 'Tournament of Power';
                case 'KAME_HOUSE': return 'Kame House';
                case 'INSIDE_BUU': return 'Inside Buu';
                case 'DESERTO': return 'Desert';
                case 'ESPACO': return 'Space';
                default: return defaultName;
            }
        }
        return defaultName;
    };

    const getStageDesc = (id: string, defaultDesc: string) => {
        if (settings.language.startsWith('en')) {
            switch (id) {
                case 'TORNEIO_DO_PODER': return 'Fight for the survival of your universe!';
                case 'KAME_HOUSE': return 'The legendary home of Master Roshi.';
                case 'INSIDE_BUU': return 'The weird interior of Majin Buu.';
                case 'DESERTO': return 'An arid desert perfect for battles.';
                case 'ESPACO': return 'The vast infinity of outer space.';
                default: return defaultDesc;
            }
        }
        return defaultDesc;
    };

    const getMusicName = (id: string, defaultName: string) => {
        if (settings.language.startsWith('en') && id === 'random') {
            return 'Random';
        }
        return defaultName;
    };

    const getMusicCreator = (id: string, defaultCreator: string) => {
        if (settings.language.startsWith('en') && id === 'random') {
            return 'Random Music Track';
        }
        return defaultCreator;
    };

    const [isMusicSelect, setIsMusicSelect] = useState(false);
    const [selectedMusicId, setSelectedMusicId] = useState<string>('random');

    const timeLimits = [60, 99, Infinity];

    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        if (isMusicSelect) {
            setIsMusicSelect(false);
            // Revert state BGM back to null so the coordinator restores char-select automatically
            setBattleMusic(null);
        } else {
            changeScene(SceneName.BATTLE_CHAR_SELECT);
        }
    };
    
    const selectedStageData = STAGES.find(s => s.id === stageTheme) || STAGES[0];
    const activeMusic = BATTLE_MUSICS.find(m => m.id === selectedMusicId) || BATTLE_MUSICS[0];

    const handleItemClick = (id: string) => {
        if (isMusicSelect) {
            if (!isItemUnlocked(`music:${id}`)) {
                AudioManager.getInstance().playSFX('cancel');
                return;
            }
            if (selectedMusicId !== id) {
                setSelectedMusicId(id);
                AudioManager.getInstance().playSFX('click');
                // Play live preview of the custom battle track by setting context state
                if (id !== 'random') {
                    const track = BATTLE_MUSICS.find(m => m.id === id);
                    if (track && track.url) {
                        setBattleMusic(track.url);
                    }
                } else {
                    // Restore character selection BGM for 'random'
                    setBattleMusic(null);
                }
            }
        } else {
            const stageData = STAGES.find(s => s.id === id);
            if (stageData?.isLocked && !isItemUnlocked(`stage:${id}`)) {
                AudioManager.getInstance().playSFX('cancel');
                return;
            }
            if (stageTheme !== id) {
                setStageTheme(id as any);
                AudioManager.getInstance().playSFX('click');
            }
        }
    };

    const handleStartMatch = () => {
        AudioManager.getInstance().playSFX('click');
        if (!isMusicSelect) {
            setIsMusicSelect(true);
        } else {
            // Assign randomly if 'random'
            let finalUrl = activeMusic.url;
            if (selectedMusicId === 'random') {
                const nonRandoms = BATTLE_MUSICS.filter(m => m.id !== 'random');
                const randomTrack = nonRandoms[Math.floor(Math.random() * nonRandoms.length)];
                finalUrl = randomTrack.url;
            }
            setBattleMusic(finalUrl);
            finalizeMatchSetup();
        }
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* Background Texture Layers */}
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10" />
            
            {/* Ki Particles */}
            <KiParticles color="orange" particleCount={25} speed={1.0} />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-orange-600/10 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[160px] animate-pulse" />
            </div>

            {/* Dynamic Background based on selected stage */}
            <AnimatePresence mode="wait">
                {selectedStageData && (
                    <motion.div
                        key={`bg-${selectedStageData.id}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.25, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <img src={selectedStageData.img || undefined} className="w-full h-full object-cover mix-blend-luminosity grayscale-[20%]" alt="" />
                        <div className={`absolute inset-0 bg-gradient-to-tr ${selectedStageData.color} opacity-30 mix-blend-color-dodge`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP HEADER */}
            <header 
                className="relative w-full px-6 md:px-12 flex items-center justify-between z-40 border-b border-white/5 bg-stone-900/30 backdrop-blur-xl shrink-0"
                style={{ height: s(96), padding: `0 ${s(48)}px` }}
            >
                <button 
                    onClick={handleBack}
                    className="rounded-xl border border-stone-800 flex items-center justify-center bg-stone-900/60 hover:border-orange-500/80 text-stone-400 hover:text-white transition-all shadow-lg active:scale-95 shrink-0 group cursor-pointer"
                    style={{ width: s(48), height: s(48) }}
                >
                    <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" style={{ width: s(24), height: s(24) }} />
                </button>
                
                <h1 className="font-header italic uppercase tracking-wider text-white" style={{ fontSize: s(48) }}>
                    {isMusicSelect 
                        ? (settings.language.startsWith('en') ? 'MUSIC SELECTION' : 'SELEÇÃO DE MÚSICA') 
                        : (settings.language.startsWith('en') ? 'STAGE SELECTION' : 'SELEÇÃO DE CENÁRIO')}
                </h1>

                {/* Matchup Preview Badge */}
                <div className="hidden md:flex items-center bg-stone-950/60 border border-stone-800 rounded-2xl backdrop-blur-xl" style={{ gap: s(14), padding: `${s(8)}px ${s(20)}px` }}>
                    <div className="flex" style={{ marginLeft: s(-8) }}>
                        {pendingP1Team && pendingP1Team.length > 0 ? (
                            pendingP1Team.map((char, idx) => (
                                <img key={`p1-${idx}`} src={char.spriteConfig?.portraitUrl} alt="P1" className="rounded-full border-2 border-orange-500 bg-orange-950 object-cover shadow-lg" style={{ width: s(32), height: s(32), zIndex: 10 - idx, marginLeft: idx > 0 ? s(-8) : 0 }} />
                            ))
                        ) : (
                            <div className="rounded-full border-2 border-orange-500 bg-orange-950 flex items-center justify-center font-black text-orange-300" style={{ width: s(32), height: s(32), fontSize: s(10) }}>P1</div>
                        )}
                    </div>
                    <span className="font-black italic text-orange-500 drop-shadow" style={{ fontSize: s(14) }}>VS</span>
                    <div className="flex" style={{ marginLeft: s(-8) }}>
                        {pendingP2Team && pendingP2Team.length > 0 ? (
                            pendingP2Team.map((char, idx) => (
                                <img key={`p2-${idx}`} src={char.spriteConfig?.portraitUrl} alt="P2" className="rounded-full border-2 border-red-500 bg-red-950 object-cover shadow-lg" style={{ width: s(32), height: s(32), zIndex: 10 - idx, marginLeft: idx > 0 ? s(-8) : 0 }} />
                            ))
                        ) : (
                            <div className="rounded-full border-2 border-red-500 bg-red-950 flex items-center justify-center font-black text-red-300" style={{ width: s(32), height: s(32), fontSize: s(10) }}>P2</div>
                        )}
                    </div>
                </div>
            </header>

            {/* TIME LIMIT SELECTOR (Floating Right) */}
            <div 
                className="absolute z-40 pointer-events-auto flex flex-col items-end"
                style={{ top: s(128), right: s(48), gap: s(10) }}
            >
                <div className="bg-stone-950/60 backdrop-blur-md border border-stone-800 shadow-xl rounded-xl flex items-center" style={{ padding: `${s(6)}px ${s(12)}px`, gap: s(8) }}>
                    <Clock className="text-orange-500" style={{ width: s(16), height: s(16) }} />
                    <span className="font-black italic uppercase text-stone-300 tracking-wider" style={{ fontSize: s(10) }}>
                        {settings.language.startsWith('en') ? 'BATTLE TIME' : 'TEMPO DE LUTA'}
                    </span>
                </div>
                <div className="flex flex-col" style={{ gap: s(8) }}>
                    {timeLimits.map((limit) => (
                        <button
                            key={`time-${limit}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setTimeLimit(limit);
                                AudioManager.getInstance().playSFX("click");
                            }}
                            className={`rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                                timeLimit === limit
                                    ? "bg-orange-500/10 border-orange-500 text-orange-400 font-black shadow-lg shadow-orange-500/5 scale-105"
                                    : "bg-stone-900/60 border-stone-800/80 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                            }`}
                            style={{ width: s(80), height: s(56) }}
                        >
                            <span className="font-black leading-none" style={{ fontSize: s(16) }}>{limit === Infinity ? "∞" : limit}</span>
                            <span className="font-black uppercase tracking-widest opacity-60 leading-none" style={{ fontSize: s(7), marginTop: s(4) }}>
                                {limit === Infinity 
                                    ? (settings.language.startsWith('en') ? "INFINITE" : "INFINITO") 
                                    : (settings.language.startsWith('en') ? "SECONDS" : "SEGUNDOS")}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN STAGE/MUSIC DESCRIPTION */}
            <main className="flex-1 w-full flex items-center relative z-20 pointer-events-none overflow-hidden" style={{ padding: `0 ${s(64)}px` }}>
                <AnimatePresence mode="wait">
                    {selectedStageData && (
                        <motion.div
                            key={`info-${selectedStageData.id}-${isMusicSelect}`}
                            initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                            transition={{ duration: 0.45 }}
                            className="max-w-xl md:max-w-2xl"
                        >
                            <div className="flex items-center mb-3.5" style={{ gap: s(14) }}>
                                <div className="rounded-2xl bg-stone-900/95 border border-stone-800 flex items-center justify-center shadow-2xl backdrop-blur-md transform -rotate-6" style={{ width: s(48), height: s(48) }}>
                                    {!isMusicSelect ? <selectedStageData.icon style={{ width: s(20), height: s(20) }} className="text-orange-500" /> : <Play style={{ width: s(20), height: s(20) }} className="text-orange-500" />}
                                </div>
                                <span className="font-black italic uppercase tracking-widest text-orange-400 bg-orange-400/5 rounded-xl border border-orange-500/10" style={{ fontSize: s(14), padding: `${s(4)}px ${s(12)}px` }}>
                                    {!isMusicSelect 
                                        ? (settings.language.startsWith('en') ? 'STAGE' : 'ARENA') 
                                        : (settings.language.startsWith('en') ? 'SOUNDTRACK' : 'TRILHA SONORA')}
                                </span>
                            </div>

                            <h2 className="font-black italic uppercase tracking-wider text-white leading-none mb-4 font-header drop-shadow-md" style={{ fontSize: s(64) }}>
                                {!isMusicSelect ? getStageName(selectedStageData.id, selectedStageData.name) : getMusicName(activeMusic.id, activeMusic.name)}
                            </h2>

                            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6" style={{ width: s(64), height: s(4) }} />
                            
                            <p className="font-bold italic text-stone-400 max-w-xl leading-relaxed" style={{ fontSize: s(18), marginBottom: s(32) }}>
                                {!isMusicSelect ? getStageDesc(selectedStageData.id, selectedStageData.desc) : getMusicCreator(activeMusic.id, activeMusic.creator)}
                            </p>

                            <div className="pointer-events-auto">
                                <button 
                                    onClick={handleStartMatch}
                                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-orange-400 text-white transition-all uppercase font-black italic tracking-widest flex items-center rounded-2xl active:scale-95 group duration-300 cursor-pointer"
                                    style={{ padding: `${s(18)}px ${s(32)}px`, gap: s(10) }}
                                >
                                    <span className="font-black italic" style={{ fontSize: s(16) }}>
                                        {!isMusicSelect 
                                            ? (settings.language.startsWith('en') ? 'CONFIRM STAGE' : 'CONFIRMAR ARENA') 
                                            : (settings.language.startsWith('en') ? 'START BATTLE' : 'INICIAR COMBATE')}
                                    </span>
                                    <ChevronRight className="group-hover:translate-x-0.5 transition-transform stroke-[3]" style={{ width: s(20), height: s(20) }} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* BOTTOM SELECTION CARDS */}
            <footer className="w-full relative z-30 flex items-end justify-start shrink-0 overflow-x-auto py-4 custom-scrollbar" style={{ padding: `0 ${s(48)}px ${s(96)}px`, gap: s(16) }}>
                {!isMusicSelect ? STAGES.map((item, i) => {
                    const isSelected = stageTheme === item.id;
                    const isLocked = item.isLocked && !isItemUnlocked(`stage:${item.id}`);
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`
                                relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 transform group cursor-pointer
                                ${isSelected ? 'scale-105 border-2 border-orange-500  z-20' : 'border border-stone-800/80 hover:border-stone-600 scale-100 opacity-60 hover:opacity-90'}
                                ${isLocked ? 'grayscale brightness-50' : ''}
                            `}
                            style={{ height: s(112), minWidth: s(160), maxWidth: s(180) }}
                        >
                            <div className="absolute inset-0 z-0">
                                <img src={item.img || undefined} className="w-full h-full object-cover grayscale-[30%] group-hover:scale-105 group-hover:grayscale-0 transition-transform duration-500 opacity-40" alt="" />
                                <div className={`absolute inset-0 bg-gradient-to-t ${isSelected ? item.color : 'from-stone-900 to-stone-950'} opacity-30`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
                            </div>
                            
                            <div className="absolute inset-0 flex flex-col justify-end items-center text-center z-10" style={{ padding: s(14) }}>
                                <div 
                                    className={`rounded-lg mb-1.5 transition-all duration-300 border flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white border-orange-400' : 'bg-stone-950 border-stone-800 text-stone-400 group-hover:text-stone-200'}`}
                                    style={{ padding: s(6) }}
                                >
                                    {isLocked ? <Lock style={{ width: s(16), height: s(16) }} /> : <Icon style={{ width: s(16), height: s(16) }} className="drop-shadow-md" />}
                                </div>
                                <span 
                                    className={`font-black italic uppercase tracking-wider drop-shadow-md leading-none ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`}
                                    style={{ fontSize: s(13) }}
                                >
                                    {isLocked ? (settings.language.startsWith('en') ? 'LOCKED' : 'BLOQUEADO') : getStageName(item.id, item.name)}
                                </span>
                            </div>
                        </button>
                    );
                }) : BATTLE_MUSICS.map((item, i) => {
                    const isSelected = selectedMusicId === item.id;
                    const isLocked = !isItemUnlocked(`music:${item.id}`);
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id)}
                            className={`
                                relative flex-1 rounded-2xl overflow-hidden transition-all duration-300 transform group cursor-pointer
                                ${isSelected ? 'scale-105 border-2 border-orange-500  z-20' : 'border border-stone-800/80 hover:border-stone-600 scale-100 opacity-60 hover:opacity-90'}
                                ${isLocked ? 'grayscale brightness-50' : ''}
                            `}
                            style={{ height: s(112), minWidth: s(160), maxWidth: s(180) }}
                        >
                            <div className="absolute inset-0 bg-stone-900/60 group-hover:bg-stone-900/80 transition-colors z-0" />
                            <div className="absolute inset-0 flex flex-col justify-end items-center text-center z-10" style={{ padding: s(14) }}>
                                <div 
                                    className={`rounded-lg mb-1.5 transition-all duration-300 border flex items-center justify-center ${isSelected ? 'bg-orange-500 text-white border-orange-400' : 'bg-stone-950 border-stone-800 text-stone-400 group-hover:text-stone-200'}`}
                                    style={{ padding: s(6) }}
                                >
                                    {isLocked ? <Lock style={{ width: s(16), height: s(16) }} /> : <Play style={{ width: s(16), height: s(16) }} className="drop-shadow-md fill-current" />}
                                </div>
                                <span 
                                    className={`font-black italic uppercase tracking-wider drop-shadow-md leading-none truncate max-w-full ${isSelected ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`}
                                    style={{ fontSize: s(13) }}
                                >
                                    {isLocked ? (settings.language.startsWith('en') ? 'LOCKED' : 'BLOQUEADO') : getMusicName(item.id, item.name)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </footer>
        </div>
    );
};

export const StageSelectScreen: React.FC = () => (
    <UIProvider>
        <StageSelectScreenContent />
    </UIProvider>
);
