
import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { ChevronLeft, Globe, WifiOff, Zap, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsModal } from '../NewsModal';
import { NewsManager } from '../../services/NewsManager';

export const NetworkSelectScreen: React.FC = () => {
    const { t, changeScene, currentUser, setIsOfflineMode, isAuthLoading, settings } = useSceneManager();
    const [selectedMode, setSelectedMode] = useState<'online' | 'offline'>('online');

    // News Updates State
    const [isNewsOpen, setIsNewsOpen] = useState(false);
    const [unreadNewsCount, setUnreadNewsCount] = useState(0);
    const [isAutoNews, setIsAutoNews] = useState(false);

    useEffect(() => {
        const newsManager = NewsManager.getInstance();
        setUnreadNewsCount(newsManager.getUnreadNewsCount());

        // Automatically trigger news view if player has not seen this version yet
        if (!newsManager.hasSeenCurrentVersion()) {
            setIsAutoNews(true);
            setIsNewsOpen(true);
        }

        const handleNewsUpdate = () => {
            setUnreadNewsCount(newsManager.getUnreadNewsCount());
        };
        window.addEventListener("dd2d_news_updated", handleNewsUpdate);

        return () => {
            window.removeEventListener("dd2d_news_updated", handleNewsUpdate);
        };
    }, []);

    const handleConfirm = () => {
        if (!selectedMode || isAuthLoading) return;
        
        AudioManager.getInstance().playSFX('confirm');
        if (selectedMode === 'online') {
            if (currentUser) {
                changeScene(SceneName.MAIN_MENU);
            } else {
                changeScene(SceneName.AUTH);
            }
        } else {
            setIsOfflineMode(true);
            changeScene(SceneName.MAIN_MENU);
        }
    };

    const handleModeClick = (mode: 'online' | 'offline') => {
        if (selectedMode === mode) return;
        setSelectedMode(mode);
        AudioManager.getInstance().playSFX('click');
    };

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        changeScene(SceneName.MAIN_MENU);
    };

    const modes = [
        {
            id: 'online',
            title: 'GLOBAL WARS',
            subtitle: settings?.language?.startsWith('en') ? 'MULTIPLAYER ONLINE' : 'MULTIPLAYER ONLINE',
            desc: settings?.language?.startsWith('en') 
                ? 'Connect to the servers and face real warriors from around the world. Stable connection required.' 
                : 'Conecte-se aos servidores e enfrente guerreiros reais de todo o mundo. Requer conexão estável.',
            icon: Globe,
            img: '/Assets/fundosdastelas/modos/m4.png',
            color: 'from-orange-600 to-orange-500'
        },
        {
            id: 'offline',
            title: 'LOCAL',
            subtitle: settings?.language?.startsWith('en') ? 'STORY & PRACTICE' : 'HISTÓRIA & TREINO',
            desc: settings?.language?.startsWith('en') 
                ? 'Play Arcade, Survival, and Training modes offline without limits.' 
                : 'Jogue offline os modos Arcade, Sobrevivência e Treinamento sem limites.',
            icon: WifiOff,
            img: '/Assets/fundosdastelas/modos/m5.png',
            color: 'from-orange-600 to-red-600'
        }
    ] as const;

    const selectedModeData = modes.find(m => m.id === selectedMode);

    return (
        <div className="w-full h-full bg-stone-950 flex font-sans select-none overflow-hidden text-stone-200 relative">
            
            {/* Background of the currently selected mode */}
            <div className="absolute inset-0 pointer-events-none transition-colors duration-700">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                
                <AnimatePresence mode="wait">
                    {selectedModeData && (
                        <motion.img 
                            key={`bg-${selectedModeData.id}`}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            src={selectedModeData.img} 
                            className="absolute inset-0 w-full h-full object-cover grayscale-[10%]"
                        />
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-stone-950/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-16 md:h-32 px-4 md:px-10 flex items-center justify-between z-50 pointer-events-none">
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 group pointer-events-auto cursor-pointer"
                >
                    <div className="w-12 h-12 md:w-18 md:h-18 bg-stone-800 border-2 border-stone-600 flex items-center justify-center transform skew-x-[-12deg] group-hover:bg-orange-600 group-hover:border-orange-500 transition-all ">
                        <ChevronLeft className="w-6 h-6 md:w-10 md:h-10 text-stone-300 group-hover:text-white transform skew-x-[12deg]" />
                    </div>
                    <span className="text-sm md:text-xl font-black italic uppercase tracking-widest text-stone-300 group-hover:text-white transition-colors drop-shadow-md">
                        {settings?.language?.startsWith('en') ? 'BACK' : 'VOLTAR'}
                    </span>
                </button>

                <button 
                    onClick={() => {
                        AudioManager.getInstance().playSFX('click');
                        setIsAutoNews(false);
                        setIsNewsOpen(true);
                    }}
                    className={`
                        flex items-center gap-2 group pointer-events-auto cursor-pointer border-2 rounded-xl px-4 py-2 bg-stone-900/80 hover:bg-stone-800 transition-all shadow-lg active:scale-95 font-black tracking-wider text-xs md:text-sm uppercase italic z-10
                        ${unreadNewsCount > 0 ? 'border-orange-500 text-orange-400 ring-2 ring-orange-500/20 animate-pulse' : 'border-stone-600 text-stone-300 hover:text-white'}
                    `}
                >
                    <Newspaper className="w-4 h-4 md:w-5 md:h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span>{settings?.language?.startsWith('en') ? 'News' : 'Novidades'}</span>
                    {unreadNewsCount > 0 && (
                        <span className="w-4 h-4 md:w-5 md:h-5 bg-red-600 text-white rounded-full font-black text-[9px] md:text-xs flex items-center justify-center border border-stone-950 scale-100 group-hover:scale-110 transition-transform shrink-0">
                            {unreadNewsCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Left Content: Mode Details */}
            <div className="flex-1 max-w-[60%] lg:max-w-[50%] h-full flex flex-col justify-center px-10 md:px-20 relative z-10 pt-20 pointer-events-none">
                <AnimatePresence mode="wait">
                    {selectedModeData && (
                        <motion.div
                            key={`info-${selectedModeData.id}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, type: 'spring', damping: 20 }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 rounded-xl bg-stone-900/80 border-2 border-stone-700 backdrop-blur-md shadow-lg transform rotate-[-5deg]">
                                    <selectedModeData.icon className="w-10 h-10 text-orange-500 drop-" />
                                </div>
                                <span className="text-2xl font-black italic uppercase tracking-widest text-orange-500 drop-shadow-md">
                                    {selectedModeData.subtitle}
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-[110px] font-header italic uppercase tracking-widest text-white leading-[0.85] mb-8 drop-shadow-[0_4px_24px_rgba(249,115,22,0.4)]"
                                style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>
                                {selectedModeData.title}
                            </h1>

                            <div className="w-32 h-2 bg-gradient-to-r from-orange-500 to-yellow-500 mb-8 rounded-full " />

                            <p className="text-xl md:text-2xl font-bold italic text-stone-300 max-w-2xl leading-relaxed drop-shadow-lg mb-16">
                                {selectedModeData.desc}
                            </p>

                            <div className="pointer-events-auto">
                                <button
                                    onClick={handleConfirm}
                                    disabled={isAuthLoading}
                                    className={`px-12 py-5 md:px-16 md:py-6 border-x-4 transition-all uppercase font-black italic text-2xl md:text-3xl tracking-widest flex items-center gap-6 transform skew-x-[-10deg] group active:scale-95 origin-left ${
                                        isAuthLoading
                                        ? 'bg-stone-800 border-stone-600 text-stone-400 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white  hover:'
                                    }`}
                                >
                                    <span className="skew-x-[10deg]">
                                        {isAuthLoading 
                                            ? (settings?.language?.startsWith('en') ? 'CONNECTING...' : 'CONECTANDO...') 
                                            : (settings?.language?.startsWith('en') ? 'CONFIRM' : 'CONFIRMAR')}
                                    </span>
                                    {!isAuthLoading && <Zap className="w-8 h-8 group-hover:scale-125 transition-transform skew-x-[10deg]" />}
                                    {isAuthLoading && <span className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin skew-x-[10deg]"></span>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Content: Vertical Slanted List */}
            <div className="flex-1 w-full max-w-[40%] lg:max-w-[50%] h-full flex flex-col justify-center items-end gap-3 md:gap-5 relative z-20 pr-10 lg:pr-20 pointer-events-none">
                {modes.map((mode) => {
                    const isSelected = selectedMode === mode.id;
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => handleModeClick(mode.id as any)}
                            className={`
                                relative w-[280px] md:w-[350px] lg:w-[450px] h-20 md:h-24 flex items-center justify-between px-6 md:px-8 transform skew-x-[-15deg] transition-all duration-300 group overflow-hidden pointer-events-auto
                                ${isSelected ? 'bg-orange-600 border-2 border-orange-400 -translate-x-8 md:-translate-x-12 ' : 'bg-stone-900/80 border-2 border-stone-800 hover:border-stone-600 hover:bg-stone-800 hover:-translate-x-4'}
                            `}
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
                            
                            <div className="flex flex-col items-start gap-1 skew-x-[15deg] relative z-10 w-full overflow-hidden whitespace-nowrap">
                                <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${isSelected ? 'text-orange-200' : 'text-stone-500 group-hover:text-stone-400'}`}>
                                    {mode.subtitle}
                                </span>
                                <span className={`text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-widest truncate w-full text-left ${isSelected ? 'text-white drop-shadow-md' : 'text-stone-400 group-hover:text-white'}`}>
                                    {mode.title}
                                </span>
                            </div>

                            <div className={`skew-x-[15deg] transition-transform duration-300 relative z-10 flex-shrink-0 ${isSelected ? 'scale-125 text-white' : 'text-stone-600 group-hover:text-stone-400 group-hover:scale-110'}`}>
                                <Icon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />
                            </div>

                            {isSelected && (
                                <div className="absolute right-0 top-0 bottom-0 w-2 md:w-3 bg-white  z-20" />
                            )}
                        </button>
                    )
                })}
            </div>

            <NewsModal
                isOpen={isNewsOpen}
                onClose={() => {
                    setIsNewsOpen(false);
                    setIsAutoNews(false);
                }}
                autoVersionOnly={isAutoNews}
            />
        </div>
    );
};

