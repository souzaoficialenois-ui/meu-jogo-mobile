import React, { useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SceneName } from '../../types';
import { localizeUrl } from '../../services/UrlLocalizer';

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
        // Only transition if auth isn't loading and we haven't already started transitioning
        if (!isAuthLoading && !transitioning.current) {
            // Display logo for a few seconds minimum once things are ready
            const timer = setTimeout(() => {
                completeSplash();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isAuthLoading]);

    return (
        <div 
            className="absolute inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={completeSplash}
        >
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center brightness-50 grayscale"
                style={{ backgroundImage: `url('/Assets/fundosdastelas/fundobanner/b1.png')` }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full h-full flex flex-col items-center justify-center pointer-events-none"
            >
                <img 
                    src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
                    alt="Game Logo" 
                    className="w-[50vw] max-w-[500px] object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.5)]" 
                />
            </motion.div>
        </div>
    );
};
