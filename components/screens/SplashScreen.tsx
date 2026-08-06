import React, { useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { motion } from 'framer-motion';
import { SceneName } from '../../types';
import { localizeUrl } from '../../services/UrlLocalizer';
import { KiParticles } from '../KiParticles';

export const SplashScreen: React.FC = () => {
    const { changeScene, isAuthLoading } = useSceneManager();
    const transitioning = useRef(false);

    const completeSplash = () => {
        if (!transitioning.current) {
            transitioning.current = true;
            changeScene(SceneName.RESOURCE_DOWNLOAD);
        }
    };

    useEffect(() => {
        // Guaranteed safety timer: splash will force complete after max 3.5s no matter what
        const maxTimer = setTimeout(() => {
            completeSplash();
        }, 3500);

        if (!isAuthLoading && !transitioning.current) {
            const timer = setTimeout(() => {
                completeSplash();
            }, 2500);
            return () => {
                clearTimeout(timer);
                clearTimeout(maxTimer);
            };
        }

        return () => clearTimeout(maxTimer);
    }, [isAuthLoading]);

    return (
        <div 
            className="absolute inset-0 z-[1000] bg-stone-950 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
            onClick={completeSplash}
        >
            {/* Background Image with warm gradient overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-70 scale-105 transition-transform duration-[10s]"
                style={{ backgroundImage: `url('/Assets/fundosdastelas/fundobanner/b1.png')` }}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

            {/* Ki Particles */}
            <KiParticles color="orange" particleCount={20} speed={1} />

            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12 px-6 pointer-events-none"
            >
                {/* Header Subtitle */}
                <div className="flex flex-col items-center gap-1 opacity-80 mt-4">
                    <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase text-orange-400 font-mono">
                        FIGHTER LEGEND
                    </span>
                    <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-stone-400">
                        ANIME COMBAT EXPERIENCE
                    </span>
                </div>

                {/* Main Logo */}
                <div className="flex flex-col items-center my-auto">
                    <img 
                        src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
                        alt="Fighter Legend Logo" 
                        className="w-[70vw] max-w-[520px] object-contain drop-shadow-[0_0_35px_rgba(255,107,0,0.6)]" 
                        onError={(e) => {
                            // Fallback heading if logo asset fails to load
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                    <h1 className="font-header italic text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 drop-shadow-[0_4px_12px_rgba(255,107,0,0.8)] uppercase tracking-wider text-center mt-2">
                        FIGHTER LEGEND
                    </h1>
                </div>

                {/* Footer Prompt */}
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="w-12 h-1 bg-orange-500/80 rounded-full animate-pulse" />
                    <span className="text-xs md:text-sm font-bold italic tracking-widest text-stone-300 uppercase animate-pulse">
                        TOQUE PARA CONTINUAR
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

