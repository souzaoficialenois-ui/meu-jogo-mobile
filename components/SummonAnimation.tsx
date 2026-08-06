import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RarityTier } from '../types';
import { AudioManager } from '../services/AudioManager';
import { RARITY_INFO, RESOURCE_SPRITES } from '../constants';
import { GachaResult } from '../services/SummonManager';
import { Eye, Award, Backpack } from 'lucide-react';

interface SummonAnimationProps {
    onComplete: () => void;
    results: GachaResult[];
}

const RARITY_EFFECTS = {
    COMMON: {
        color: '#9ca3af', // gray-400
        particles: 15,
        shakeIntensity: 2,
        flashCount: 1,
        distort: false,
    },
    RARE: {
        color: '#3b82f6', // blue-500
        particles: 30,
        shakeIntensity: 5,
        flashCount: 1,
        distort: false,
    },
    EPIC: {
        color: '#d946ef', // fuchsia-500
        particles: 50,
        shakeIntensity: 10,
        flashCount: 2,
        distort: true,
    },
    LEGENDARY: {
        color: '#eab308', // yellow-500
        particles: 100,
        shakeIntensity: 20,
        flashCount: 4,
        distort: true,
    },
    ETERNAL: {
        color: '#06b6d4', // cyan-500
        particles: 150,
        shakeIntensity: 30,
        flashCount: 6,
        distort: true,
    }
};

type AnimPhase = 'WARMUP' | 'CHARGE' | 'EXPLOSION' | 'REVEAL_PAN' | 'REVEAL_FULL';

export const SummonAnimation: React.FC<SummonAnimationProps> = ({ onComplete, results }) => {
    const [phase, setPhase] = useState<AnimPhase>('WARMUP');
    
    // Select the best result for the cinematic
    const featured = useMemo(() => {
        return results.reduce((best, curr) => {
            const val = (r: RarityTier) => {
                if (r === 'ETERNAL') return 4;
                if (r === 'LEGENDARY') return 3;
                if (r === 'EPIC') return 2;
                if (r === 'RARE') return 1;
                return 0;
            };
            
            const currRarity = curr.type === 'CHARACTER' ? curr.character?.rarity : curr.type === 'ITEM' ? curr.item?.rarity : 'COMMON';
            const bestRarity = best.type === 'CHARACTER' ? best.character?.rarity : best.type === 'ITEM' ? best.item?.rarity : 'COMMON';
            
            return val(currRarity as RarityTier) > val(bestRarity as RarityTier) ? curr : best;
        }, results[0]);
    }, [results]);

    const featuredRarity = featured.type === 'CHARACTER' ? featured.character?.rarity : featured.type === 'ITEM' ? featured.item?.rarity : 'COMMON';
    const effects = RARITY_EFFECTS[featuredRarity as RarityTier] || RARITY_EFFECTS.COMMON;

    // Timeline
    useEffect(() => {
        AudioManager.getInstance().playMusic('summon');
        AudioManager.getInstance().playSFX('charge'); // Warmup sound

        const t1 = setTimeout(() => {
            setPhase('CHARGE');
            AudioManager.getInstance().playSFX('charge'); 
        }, 2000);

        const t2 = setTimeout(() => {
            setPhase('EXPLOSION');
            AudioManager.getInstance().playSFX('punch');
        }, 4500);

        const t3 = setTimeout(() => {
            setPhase('REVEAL_PAN');
            AudioManager.getInstance().playSFX('attack');
        }, 5000);

        const t4 = setTimeout(() => {
            setPhase('REVEAL_FULL');
            AudioManager.getInstance().playSFX('reveal');
            setTimeout(() => AudioManager.getInstance().playSFX('summon'), 500);
        }, 7000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            AudioManager.getInstance().stopBGM();
        };
    }, [featured]);

    // Screen Shake based on phase
    const getShake = () => {
        if (phase === 'CHARGE') return { x: [-effects.shakeIntensity, effects.shakeIntensity], y: [-effects.shakeIntensity, effects.shakeIntensity] };
        if (phase === 'EXPLOSION') return { x: [-effects.shakeIntensity*2, effects.shakeIntensity*2], y: [-effects.shakeIntensity*2, effects.shakeIntensity*2] };
        return { x: 0, y: 0 };
    };

    const skip = () => {
        AudioManager.getInstance().stopBGM();
        onComplete();
    };

    // Generate random particles
    const particles = useMemo(() => {
        return Array.from({ length: effects.particles }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            scale: Math.random() * 1.5 + 0.5,
            duration: Math.random() * 2 + 1,
            delay: Math.random() * 1
        }));
    }, [effects]);

    const renderFeaturedImage = () => {
        if (featured.type === 'CHARACTER' && featured.character) {
            return (
                <motion.img
                    src={featured.character.spriteConfig?.portraitUrl || undefined}
                    initial={phase === 'REVEAL_PAN' ? { y: '50%', scale: 2, filter: 'brightness(0)' } : { y: 0, scale: 1, filter: 'brightness(1) drop-shadow(0 0 20px ' + effects.color + ')' }}
                    animate={phase === 'REVEAL_PAN' ? { y: '-20%' } : { y: 0, scale: 1, filter: 'brightness(1) drop-shadow(0 0 20px ' + effects.color + ')' }}
                    transition={phase === 'REVEAL_PAN' ? { duration: 2, ease: "linear" } : { duration: 0.5, type: 'spring' }}
                    className="object-cover object-[center_20%] w-full will-change-transform"
                    style={{ imageRendering: 'pixelated' }}
                />
            );
        } else if (featured.type === 'ITEM' && featured.item) {
            return (
                <motion.div
                    initial={phase === 'REVEAL_PAN' ? { y: '50%', scale: 0.5, opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
                    animate={phase === 'REVEAL_PAN' ? { y: '0%', scale: 1, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative flex items-center justify-center w-full h-full"
                >
                    {featured.item.imageUrl ? (
                        <img 
                            src={featured.item.imageUrl} 
                            alt="" 
                            className="w-48 h-48 md:w-64 md:h-64 object-contain drop-"
                        />
                    ) : (
                        <div className="w-48 h-48 rounded-full bg-stone-900 border-4 border-stone-800 flex items-center justify-center">
                             {(featured.item.category as string) === 'Skin' ? <Eye className="w-20 h-20 text-orange-400" /> : <Award className="w-20 h-20 text-purple-400" />}
                        </div>
                    )}
                </motion.div>
            );
        } else if (featured.type === 'COIN') {
            return (
                <motion.img
                    src={RESOURCE_SPRITES.curr_roulette}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-32 h-32 md:w-48 md:h-48 object-contain drop-"
                />
            );
        }
        return null;
    };

    const featuredName = featured.type === 'CHARACTER' ? featured.character?.name : featured.type === 'ITEM' ? featured.item?.name : `${featured.coinsAmount} Moedas`;

    return (
        <div 
            className="w-full h-full absolute inset-0 overflow-hidden bg-black select-none z-[300]"
            onClick={phase === 'REVEAL_FULL' ? skip : undefined}
        >
            {/* Camera Shake Wrapper */}
            <motion.div 
                className="w-full h-full absolute inset-0 origin-center"
                animate={getShake()}
                transition={{ duration: 0.1, repeat: Infinity, repeatType: 'reverse' }}
            >
                
                {/* WARMUP / CHARGE PHASE BACKGROUND */}
                {(phase === 'WARMUP' || phase === 'CHARGE') && (
                    <motion.div 
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: phase === 'CHARGE' ? 2 : 1, opacity: 1 }}
                        transition={{ duration: phase === 'CHARGE' ? 2.5 : 2, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {/* Spinning Energy Core */}
                        <motion.div 
                            animate={{ rotate: 360, scale: phase === 'CHARGE' ? [1, 1.5, 1] : 1 }}
                            transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 0.5, repeat: Infinity } }}
                            className="w-32 h-32 rounded-full blur-[20px]"
                            style={{ background: `radial-gradient(circle, ${effects.color} 0%, transparent 70%)` }}
                        />
                        
                        {/* Particles flowing in */}
                        {particles.map(p => (
                            <motion.div
                                key={p.id}
                                initial={{ top: `${p.y}%`, left: `${p.x}%`, opacity: 0 }}
                                animate={{ 
                                    top: '50%', 
                                    left: '50%', 
                                    opacity: [0, 1, 0],
                                    scale: p.scale 
                                }}
                                transition={{ 
                                    duration: phase === 'CHARGE' ? p.duration * 0.5 : p.duration, 
                                    delay: p.delay, 
                                    repeat: Infinity,
                                    ease: "easeIn"
                                }}
                                className="absolute w-1 h-4 bg-white rounded-full blur-[1px]"
                                style={{
                                    transform: `rotate(${Math.atan2(50 - p.y, 50 - p.x)}rad)`,
                                    boxShadow: `0 0 10px ${effects.color}`
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* EXPLOSION PHASE */}
                {phase === 'EXPLOSION' && (
                    <motion.div 
                        initial={{ opacity: 1, scale: 0.5 }}
                        animate={{ opacity: 0, scale: 5 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-white z-50 mix-blend-screen"
                    />
                )}

                {/* REVEAL (PAN & FULL) */}
                {(phase === 'REVEAL_PAN' || phase === 'REVEAL_FULL') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Dramatic Background */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 overflow-hidden"
                            style={{ background: `radial-gradient(circle at center, ${effects.color}20 0%, black 100%)` }}
                        >
                            {/* Epic/Legendary extra FX */}
                            {effects.distort && (
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 10, repeat: Infinity }}
                                    className="absolute inset-0 opacity-30 mix-blend-overlay"
                                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}
                                />
                            )}
                            {/* Speed lines */}
                            <motion.div 
                                animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)' }}
                            />
                        </motion.div>

                        {/* Image container */}
                        <div className="relative w-[300px] md:w-[500px] h-full flex items-center justify-center z-10 perspective-1000">
                            {renderFeaturedImage()}
                            
                            {/* Final Reveal Name & Rarity */}
                            <AnimatePresence>
                                {phase === 'REVEAL_FULL' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="absolute bottom-[10%] inset-x-0 flex flex-col items-center justify-center text-center backdrop-blur-2xl bg-stone-950/20 py-6 border-y border-white/5"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-800/50 to-transparent pointer-events-none" />
                                        
                                        <div className="flex items-center gap-3 mb-2">
                                            <motion.div 
                                                initial={{ x: -100, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                                className="px-4 py-1 border-l-4 shadow-lg"
                                                style={{ borderColor: RARITY_INFO[featuredRarity as RarityTier].color, backgroundColor: 'rgba(0,0,0,0.6)' }}
                                            >
                                                <span 
                                                    className="font-black tracking-widest text-sm uppercase"
                                                    style={{ color: RARITY_INFO[featuredRarity as RarityTier].color }}
                                                >
                                                    {featuredRarity}
                                                </span>
                                            </motion.div>

                                            {(featured.quantity && featured.quantity > 1) || (featured.type === 'COIN' && featured.coinsAmount) ? (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.6, type: 'spring' }}
                                                    className="bg-orange-500 text-white font-black px-3 py-1 rounded-md text-lg italic shadow-lg border border-orange-400"
                                                >
                                                    x{featured.type === 'COIN' ? featured.coinsAmount : featured.quantity}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.6 }}
                                                    className="bg-stone-800 text-stone-400 font-black px-2 py-0.5 rounded text-[10px] uppercase border border-stone-700"
                                                >
                                                    x1
                                                </motion.div>
                                            )}
                                        </div>

                                        <h2 
                                            className="text-4xl md:text-6xl font-black italic uppercase text-white drop-shadow-2xl"
                                            style={{ WebkitTextStroke: `1px ${effects.color}` }}
                                        >
                                            {featuredName}
                                        </h2>
                                        
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                                            className="mt-8 text-stone-400 text-xs tracking-[0.3em] font-bold"
                                        >
                                            TOQUE PARA CONTINUAR
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Cinematic Black Bars */}
            <div className="absolute top-0 inset-x-0 h-16 md:h-24 bg-black z-50"></div>
            <div className="absolute bottom-0 inset-x-0 h-16 md:h-24 bg-black z-50"></div>

            {/* Skip Button */}
            <button 
                onClick={skip}
                className="absolute top-4 right-6 z-[100] text-stone-500 hover:text-white font-black tracking-widest text-xs py-2 px-4 border border-stone-800 hover:border-stone-500 rounded bg-black/50 transition-colors"
            >
                PULAR
            </button>
        </div>
    );
};

