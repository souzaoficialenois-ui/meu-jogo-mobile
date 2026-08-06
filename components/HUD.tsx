import React, { useEffect, useState, useRef } from 'react';
import { PlayerStats } from '../types';
import { useSceneManager } from '../contexts/SceneContext';
import { AVATAR_LIST } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Activity, Pause } from 'lucide-react';

interface HUDProps {
  p1: PlayerStats;
  p2: PlayerStats;
  p1Team?: PlayerStats[];
  p2Team?: PlayerStats[];
  p1ActiveIdx?: number;
  p2ActiveIdx?: number;
  p1FusionTimer?: number;
  p2FusionTimer?: number;
  timer: number;
  wave?: number;
  gameMode?: string;
  onTimerClick?: () => void;
  uiVisible?: boolean;
}

const TeamRoster = ({ team, isLeft, activeIdx = 0 }: { team?: PlayerStats[], isLeft: boolean, activeIdx?: number }) => {
    if (!team || team.length <= 1) return null;
    
    // filter out the active player
    const standby = team.filter((_, idx) => idx !== activeIdx);
    
    const { s } = useUI();

    return (
        <div 
            className={`flex mt-[1vmin] ${isLeft ? 'justify-start' : 'justify-end'}`}
            style={{ 
                gap: `${s(12)}px`,
                marginLeft: isLeft ? `${s(140)}px` : '0',
                marginRight: !isLeft ? `${s(140)}px` : '0'
            }}
        >
            {standby.map((member, idx) => {
                const isDead = member.hp <= 0;
                const hpPct = member.hp > 0 ? Math.max(2, (member.hp / member.maxHp) * 100) : 0;
                const tagCooldownPct = member.tagCooldown ? Math.min(100, (member.tagCooldown / 300) * 100) : 0;
                
                // Get assist cooldown base on type
                let maxCd = 240;
                if (member.assistType === 'SPECIAL_2') maxCd = 300;
                else if (member.assistType === 'SPECIAL_3') maxCd = 360;
                else if (member.assistType === 'SPECIAL_4') maxCd = 420;
                else if (member.assistType === 'SPECIAL_5') maxCd = 480;
                else if (member.assistType === 'SPECIAL_6') maxCd = 540;
                const assistCooldownPct = member.assistCooldown ? Math.min(100, (member.assistCooldown / maxCd) * 100) : 0;
                
                const combinedCdPct = Math.max(tagCooldownPct, assistCooldownPct);
                const activePlayer = team[activeIdx];
                const hasEnoughKi = activePlayer ? activePlayer.ki >= (member.assistCost || 0) : true;
                const isReady = combinedCdPct === 0 && !isDead && hasEnoughKi;
                
                const skewClass = isLeft ? 'skew-x-[-12deg]' : 'skew-x-[15deg]';
                const imgSkewClass = isLeft ? 'skew-x-[12deg]' : 'skew-x-[-15deg]';

                const assistLabel = member.assistType ? member.assistType.replace("SPECIAL", "S").replace("_", "") : "S1";

                return (
                    <div key={`standby-${isLeft ? 'p1' : 'p2'}-${idx}`} className="relative group">
                        {/* Assist Label */}
                        <div 
                            className={`absolute z-10 bg-slate-900 border-[2px] border-slate-700 shadow-lg flex items-center gap-1 ${skewClass}`}
                            style={{ 
                                top: `-${s(12)}px`,
                                [isLeft ? 'left' : 'right']: `-${s(8)}px`,
                                padding: `${s(2)}px ${s(5)}px`
                            }}
                        >
                            <span 
                                className={`block font-black italic uppercase tracking-tighter ${isLeft ? 'skew-x-[12deg]' : 'skew-x-[-15deg]'} ${isReady ? 'text-amber-500' : 'text-slate-500'}`}
                                style={{ fontSize: `${s(12)}px` }}
                            >
                                A{idx + 1}
                            </span>
                            <span 
                                className={`block font-bold ${isLeft ? 'skew-x-[12deg]' : 'skew-x-[-15deg]'} text-white/70 bg-black/40 rounded-sm`}
                                style={{ fontSize: `${s(10)}px`, padding: `0 ${s(2)}px` }}
                            >
                                {assistLabel}
                            </span>
                        </div>
                        
                        <div 
                            className={`relative ${skewClass} bg-slate-900 border-[3px] ${isReady ? 'border-amber-500 ' : 'border-slate-700 shadow-lg'} overflow-hidden transition-all duration-300 ${!isReady && !isDead ? 'scale-95' : ''}`}
                            style={{ width: `${s(72)}px`, height: `${s(72)}px` }}
                        >
                            <img 
                                src={member.portraitUrl || AVATAR_LIST[isLeft ? 0 : 1].url} 
                                alt="" 
                                className={`w-full h-full object-cover object-[center_20%] ${imgSkewClass} transition-all ${isDead ? 'grayscale opacity-50' : ''} ${combinedCdPct === 0 && !isDead && !hasEnoughKi ? 'brightness-[0.4] saturate-50 sepia hue-rotate-[320deg]' : ''}`}
                                style={{ transform: `scale(${isLeft ? 1.25 : -1.25}, 1.25)` }}
                                referrerPolicy="no-referrer"
                            />
                            
                            {/* Inner Shadow Polish */}
                            <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none" />

                            {/* HP Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-[0.7vmin] bg-slate-900 z-20">
                                <motion.div 
                                    className="absolute top-0 bottom-0 left-0 bg-emerald-500"
                                    animate={{ width: `${hpPct}%` }}
                                    transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/40" />
                                </motion.div>
                            </div>

                            {/* Cooldown Overlay (Sweeps from top to bottom) */}
                            {combinedCdPct > 0 && !isDead && (
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                    <motion.div 
                                        className="absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-[2px]" 
                                        animate={{ height: `${combinedCdPct}%` }}
                                        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                                    >
                                        {/* Sweeping bar edge */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[0.2vmin] bg-red-500/80 " />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-center border border-transparent">
                                       {combinedCdPct > 10 && (
                                           <span className={`text-[2vmin] text-white font-black drop- ${isLeft ? 'skew-x-[12deg]' : 'skew-x-[-15deg]'}`}>
                                               {Math.ceil(Math.max(member.tagCooldown || 0, member.assistCooldown || 0) / 60)}s
                                           </span>
                                       )}
                                    </div>
                                </div>
                            )}

                            {/* Ready Flash Overlay */}
                            {isReady && (
                                <motion.div 
                                    className="absolute inset-0 bg-amber-500/20 z-10 pointer-events-none"
                                    animate={{ opacity: [0, 0.4, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}

                            {/* Cross if dead */}
                            {isDead && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                                    <div className="w-[120%] h-[0.5vmin] bg-red-600 rotate-45 transform origin-center " />
                                    <div className="absolute w-[120%] h-[0.5vmin] bg-red-600 -rotate-45 transform origin-center " />
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const HealthBar = ({ 
    current, 
    max,
    isLeft, 
    guard, 
    maxGuard 
}: { 
    current: number, 
    max: number,
    isLeft: boolean,
    guard: number,
    maxGuard: number
}) => {
    const safeCurrent = isNaN(current) || typeof current !== 'number' ? 0 : current;
    const safeMax = isNaN(max) || typeof max !== 'number' || max <= 0 ? 100 : max;
    const safeGuard = isNaN(guard) || typeof guard !== 'number' ? 0 : guard;
    const safeMaxGuard = isNaN(maxGuard) || typeof maxGuard !== 'number' || maxGuard <= 0 ? 100 : maxGuard;

    const pct = safeCurrent > 0 ? Math.max(1, Math.min(100, (safeCurrent / safeMax) * 100)) : 0;
    const [visualPct, setVisualPct] = useState(pct);
    const [isHit, setIsHit] = useState(false);
    const [isCritical, setIsCritical] = useState(false);
    const [flashType, setFlashType] = useState<'none' | 'normal' | 'critical'>('none');
    const [hitCount, setHitCount] = useState(0);
    const prevHpRef = useRef(safeCurrent);

    useEffect(() => {
        if (safeCurrent < prevHpRef.current) {
            const damage = prevHpRef.current - safeCurrent;
            const damagePct = (damage / safeMax) * 100;
            // Critical hit if single hit >= 3.5% of max HP, >= 50 HP, or taking damage while low HP (<20%)
            const critical = damagePct >= 3.5 || damage >= 50 || (safeCurrent < safeMax * 0.20 && damage > 0);

            setIsHit(true);
            setIsCritical(critical);
            setFlashType(critical ? 'critical' : 'normal');
            setHitCount(prev => prev + 1);

            const timerDuration = critical ? 550 : 320;
            const hitTimer = setTimeout(() => {
                setIsHit(false);
                setIsCritical(false);
                setFlashType('none');
            }, timerDuration);

            return () => clearTimeout(hitTimer);
        }
        prevHpRef.current = safeCurrent;
    }, [safeCurrent, safeMax]);

    useEffect(() => {
        if (pct < visualPct) {
            const t = setTimeout(() => setVisualPct(pct), isCritical ? 800 : 600);
            return () => clearTimeout(t);
        } else if (pct > visualPct) {
            setVisualPct(pct);
        }
    }, [pct, visualPct, isCritical]);

    let barColor = "from-emerald-400 via-emerald-500 to-emerald-600";
    if (pct < 50) barColor = "from-amber-400 via-amber-500 to-amber-600";
    if (pct < 25) barColor = "from-red-500 via-red-600 to-red-700";

    const skew = isLeft ? "-skew-x-[15deg]" : "skew-x-[15deg]";
    const guardWidthPct = Math.max(0, Math.min(100, (safeGuard / safeMaxGuard) * 100));

    const { s } = useUI();

    // Critical Shake motion physics
    const shakeAnimation = isCritical ? {
        x: isLeft ? [-14, 14, -10, 10, -6, 6, -3, 3, 0] : [14, -14, 10, -10, 6, -6, 3, -3, 0],
        y: [-5, 5, -4, 4, -2, 2, -1, 1, 0],
        rotate: isLeft ? [-2.5, 2.5, -1.5, 1.5, -0.8, 0] : [2.5, -2.5, 1.5, -1.5, 0.8, 0],
        scale: [1, 1.08, 0.95, 1.04, 0.98, 1],
        filter: ["brightness(1)", "brightness(2.6) contrast(1.4)", "brightness(1.8)", "brightness(1.2)", "brightness(1)"]
    } : isHit ? {
        x: isLeft ? [-6, 6, -4, 4, -2, 0] : [6, -6, 4, -4, 2, 0],
        y: [-2, 2, -1, 1, 0],
        scale: [1, 1.03, 0.98, 1],
        filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"]
    } : {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        filter: "brightness(1)"
    };

    return (
        <motion.div 
            key={`hp-container-${hitCount}`}
            className="w-full relative"
            style={{ gap: `${s(10)}px`, display: 'flex', flexDirection: 'column' }}
            animate={shakeAnimation}
            transition={{ duration: isCritical ? 0.5 : 0.3, ease: "easeOut" }}
        >
            {/* Floating Critical Hit Badge */}
            <AnimatePresence>
                {isCritical && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.4, y: 10 }}
                        animate={{ 
                            opacity: [0, 1, 1, 0], 
                            scale: [0.4, 1.3, 1.1, 0.9], 
                            y: [10, -14, -20, -28] 
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className={`absolute z-40 pointer-events-none top-[-22px] ${isLeft ? 'left-4' : 'right-4'}`}
                    >
                        <span className="font-black italic uppercase text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,1)] tracking-widest text-[11px] sm:text-[13px] bg-stone-950/90 px-2.5 py-0.5 rounded-md border border-red-500/80">
                            CRITICAL HIT!
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Health Bar Container */}
            <div 
                className={`relative w-full bg-slate-900 border-[3px] md:border-[4px] overflow-hidden ${skew} transition-colors duration-200 ${
                    isCritical 
                        ? 'border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.95)] scale-[1.02]' 
                        : isHit 
                        ? 'border-yellow-300 shadow-[0_0_18px_rgba(253,224,71,0.7)]' 
                        : pct < 25 
                        ? 'border-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                        : 'border-white/20'
                }`}
                style={{ height: `${s(32)}px` }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                {/* Damage Catch-up (Red Trailing Bar) */}
                <motion.div 
                    className={`absolute inset-y-0 ${isCritical ? 'bg-red-600/90' : 'bg-red-500/80'} ${isLeft ? 'right-0' : 'left-0'}`}
                    animate={{ width: `${visualPct}%` }}
                    transition={{ duration: isCritical ? 0.9 : 0.7, ease: "easeOut" }}
                />
                
                {/* Actual Current Health Bar */}
                <motion.div 
                    className={`absolute inset-y-0 bg-gradient-to-r ${barColor} ${isLeft ? 'right-0' : 'left-0'} ${pct < 25 ? 'animate-pulse' : ''}`}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]"></div>
                    {/* Energy glow on tip */}
                    <div 
                        className={`absolute top-0 bottom-0 bg-white/60 blur-[4px] ${isLeft ? 'left-0' : 'right-0'}`} 
                        style={{ width: `${s(12)}px` }}
                    />
                </motion.div>

                {/* Impact Spark Flare burst on hit position */}
                <AnimatePresence>
                    {(isHit || isCritical) && (
                        <motion.div
                            key={`impact-flare-${hitCount}`}
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: isCritical ? 2.8 : 1.8, opacity: [1, 0.8, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: isCritical ? 0.45 : 0.3, ease: "easeOut" }}
                            className={`absolute top-0 bottom-0 pointer-events-none z-20 ${
                                isCritical 
                                    ? 'bg-gradient-to-r from-yellow-100 via-white to-red-500 blur-[2px] shadow-[0_0_25px_#fff,0_0_40px_#ef4444]' 
                                    : 'bg-white blur-[2px] shadow-[0_0_15px_#fff]'
                            }`}
                            style={{
                                width: `${s(isCritical ? 20 : 12)}px`,
                                [isLeft ? 'right' : 'left']: `${pct}%`,
                                transform: 'translateX(-50%)'
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Flash Overlay Effects */}
                <AnimatePresence>
                    {flashType === 'critical' && (
                        <motion.div
                            key={`flash-crit-${hitCount}`}
                            initial={{ opacity: 1 }}
                            animate={{ 
                                opacity: [1, 0.85, 1, 0.3, 0],
                                backgroundColor: [
                                    "rgba(255, 255, 255, 0.95)",
                                    "rgba(239, 68, 68, 0.85)",
                                    "rgba(254, 240, 138, 0.9)",
                                    "rgba(239, 68, 68, 0.3)",
                                    "rgba(0, 0, 0, 0)"
                                ]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, times: [0, 0.25, 0.5, 0.75, 1] }}
                            className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay border-2 border-white/90 shadow-[inset_0_0_25px_rgba(255,255,255,1)]"
                        />
                    )}
                    {flashType === 'normal' && (
                        <motion.div
                            key={`flash-norm-${hitCount}`}
                            initial={{ opacity: 0.8 }}
                            animate={{ opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28 }}
                            className="absolute inset-0 z-30 pointer-events-none bg-white/70 mix-blend-overlay"
                        />
                    )}
                </AnimatePresence>
                
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/40 pointer-events-none"></div>

                {/* Glass sheen highlight */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            </div>

            {/* Guard Gauge */}
            <div 
                className={`w-3/4 bg-slate-900 border border-white/20 overflow-hidden ${skew} ${isLeft ? 'ml-auto' : 'mr-auto'} shadow-inner`}
                style={{ height: `${s(10)}px` }}
            >
                <motion.div 
                    className={`h-full ${safeGuard < safeMaxGuard * 0.3 ? 'bg-red-500 animate-pulse ' : 'bg-sky-400 '}`}
                    animate={{ width: `${guardWidthPct}%` }}
                    transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                />
            </div>
        </motion.div>
    );
};

const KiBar = ({ ki, maxKi, isLeft }: { ki: number, maxKi: number, isLeft: boolean }) => {
    const safeKi = isNaN(ki) || typeof ki !== 'number' ? 0 : ki;
    const safeMaxKi = isNaN(maxKi) || typeof maxKi !== 'number' || maxKi <= 0 ? 100 : maxKi;

    let bars = Math.floor(safeKi / 100);
    let pct = (safeKi % 100);
    const prevBarsRef = useRef(bars);
    const [justLeveledUp, setJustLeveledUp] = useState(false);
    const [justDeflected, setJustDeflected] = useState(false);
    const [isCharging, setIsCharging] = useState(false);
    const [isSpending, setIsSpending] = useState(false);
    const [visualKi, setVisualKi] = useState(safeKi);
    const [flareCount, setFlareCount] = useState(0);
    const prevKiRef = useRef(safeKi);
    
    // When fully maxed out, display 100% full instead of 0% on the next bar
    if (safeKi > 0 && safeKi === safeMaxKi) {
        bars = Math.floor(safeMaxKi / 100);
        pct = 100;
    }

    useEffect(() => {
        if (bars > prevBarsRef.current) {
            setJustLeveledUp(true);
            const t = setTimeout(() => setJustLeveledUp(false), 500);
            return () => clearTimeout(t);
        }
        prevBarsRef.current = bars;
    }, [bars]);

    useEffect(() => {
        const delta = prevKiRef.current - safeKi;
        if (delta >= 190 && delta <= 210) {
            setJustDeflected(true);
            const t = setTimeout(() => setJustDeflected(false), 800);
            return () => clearTimeout(t);
        }

        if (safeKi > prevKiRef.current + 2) {
            setIsCharging(true);
            const t = setTimeout(() => setIsCharging(false), 300);
            return () => clearTimeout(t);
        } else if (safeKi < prevKiRef.current - 5) {
            setIsSpending(true);
            setFlareCount(prev => prev + 1);
            const t = setTimeout(() => setIsSpending(false), 450);
            return () => clearTimeout(t);
        }
        prevKiRef.current = safeKi;
    }, [safeKi]);

    useEffect(() => {
        if (safeKi < visualKi) {
            const t = setTimeout(() => setVisualKi(safeKi), 550);
            return () => clearTimeout(t);
        } else {
            setVisualKi(safeKi);
        }
    }, [safeKi, visualKi]);

    let visualBars = Math.floor(visualKi / 100);
    let visualPct = (visualKi % 100);
    if (visualKi > 0 && visualKi === safeMaxKi) {
        visualBars = Math.floor(safeMaxKi / 100);
        visualPct = 100;
    }

    const getKiColors = (b: number) => {
        switch(b) {
            case 0: return { from: '#38bdf8', via: '#0284c7', to: '#0369a1' }; // sky
            case 1: return { from: '#ef4444', via: '#dc2626', to: '#b91c1c' }; // red
            case 2: return { from: '#facc15', via: '#eab308', to: '#ca8a04' }; // yellow
            case 3: return { from: '#22c55e', via: '#16a34a', to: '#15803d' }; // green
            case 4: return { from: '#a855f7', via: '#9333ea', to: '#7e22ce' }; // purple
            case 5: return { from: '#ec4899', via: '#db2777', to: '#be185d' }; // pink
            case 6: return { from: '#f97316', via: '#ea580c', to: '#c2410c' }; // orange
            default: return { from: '#f1f5f9', via: '#e2e8f0', to: '#ffffff' }; // slate/white
        }
    };

    let currentColors = getKiColors(bars);
    let prevColors = bars > 0 ? getKiColors(bars - 1) : null;

    const isMaxed = ki > 0 && ki === maxKi;

    const { s } = useUI();

    // Calculate trailing width for same-bar or cross-bar trailing energy
    const trailingPct = visualBars === bars ? visualPct : (visualBars > bars ? 100 : pct);

    return (
        <div 
            className={`flex items-end ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            style={{ gap: `${s(28)}px` }}
        >
            {/* Level Indicator */}
            <div className="relative group">
                <motion.div 
                    className={`relative bg-black border-[3px] md:border-[4px] transition-all duration-300 ${
                        justDeflected 
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]' 
                            : isMaxed 
                            ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.9)]' 
                            : isCharging
                            ? 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.9)]'
                            : 'border-orange-500'
                    } skew-x-[-12deg] flex items-center justify-center z-10 overflow-hidden`}
                    style={{ width: `${s(80)}px`, height: `${s(80)}px` }}
                    animate={
                        justDeflected ? { scale: [1, 1.25, 1], rotate: [-10, 10, 0] } : 
                        justLeveledUp ? { scale: [1, 1.4, 1], rotate: [-5, 5, 0] } : 
                        isCharging ? { scale: [1, 1.08, 1] } :
                        isMaxed ? { scale: [1, 1.05, 1] } : 
                        { scale: 1 }
                    }
                    transition={
                        justDeflected ? { duration: 0.4 } :
                        justLeveledUp ? { duration: 0.5, times: [0, 0.5, 1] } : 
                        isCharging ? { duration: 0.3 } :
                        isMaxed ? { duration: 1, repeat: Infinity } : 
                        { type: 'spring', stiffness: 300, damping: 15 }
                    }
                >
                    {isMaxed && (
                        <div className="absolute inset-0 bg-yellow-400/20 animate-pulse pointer-events-none" />
                    )}
                    {isCharging && (
                        <div className="absolute inset-0 bg-amber-400/30 animate-ping pointer-events-none" />
                    )}
                    <span 
                        className={`font-black italic skew-x-[12deg] ${
                            isMaxed 
                                ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]' 
                                : isCharging
                                ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                                : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                        }`}
                        style={{ fontSize: `${s(40)}px` }}
                    >
                        {bars === 0 && isMaxed ? 'MAX' : bars}
                    </span>
                </motion.div>
                
                {justLeveledUp && (
                    <motion.div 
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-orange-500 rounded skew-x-[-12deg] z-0 blur-md pointer-events-none"
                    />
                )}

                {justDeflected && (
                    <motion.div 
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-cyan-500 rounded skew-x-[-12deg] z-0 blur-md pointer-events-none"
                    />
                )}

                <div 
                    className={`absolute ${
                        justDeflected 
                            ? 'bg-cyan-400 text-black' 
                            : isMaxed 
                            ? 'bg-yellow-400 text-black' 
                            : isCharging
                            ? 'bg-amber-300 text-black'
                            : 'bg-orange-500 text-black'
                    } font-black uppercase skew-x-[-12deg] z-20 transition-colors`}
                    style={{ 
                        top: `-${s(12)}px`, 
                        left: `-${s(12)}px`,
                        padding: `${s(4)}px ${s(8)}px`,
                        fontSize: `${s(14)}px`
                    }}
                >
                    <span className="skew-x-[12deg] block">{isMaxed ? 'MAX' : 'KI'}</span>
                </div>
            </div>

            {/* Ki Gauge */}
            <div className="flex-1 relative" style={{ display: 'flex', flexDirection: 'column', gap: `${s(12)}px` }}>

                <div 
                    className={`bg-slate-950 border-[3px] md:border-[4px] transition-all duration-300 ${
                        justDeflected 
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
                            : isMaxed 
                            ? 'border-yellow-400/80 shadow-[0_0_25px_rgba(250,204,21,0.7)]' 
                            : isCharging
                            ? 'border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-[1.01]'
                            : isSpending
                            ? 'border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.6)]'
                            : 'border-white/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]'
                    } skew-x-[-12deg] overflow-hidden relative`}
                    style={{ height: `${s(36)}px` }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                    {/* Previous level fill underneath */}
                    {bars > 0 && prevColors && (
                        <div 
                            className="absolute inset-0 opacity-80" 
                            style={{ background: `linear-gradient(to right, ${prevColors.from}, ${prevColors.to})` }}
                        />
                    )}

                    {/* Trailing energy bar (Catch-up bar when Ki is consumed) */}
                    <motion.div 
                        className={`absolute inset-y-0 bg-white/70 ${isLeft ? 'left-0' : 'right-0'}`}
                        animate={{ width: `${trailingPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />

                    {/* Main Active Ki level bar */}
                    <motion.div 
                        className={`absolute inset-y-0 ${isLeft ? 'left-0' : 'right-0'} ${isMaxed ? 'animate-pulse' : ''}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                        style={{ background: `linear-gradient(to right, ${currentColors.from}, ${currentColors.via}, ${currentColors.to})` }}
                    >
                        {/* Shimmer animation */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.45)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_1.5s_infinite]" />
                        
                        {/* Leading Edge Tip Aura Glow */}
                        <div 
                            className={`absolute top-0 bottom-0 bg-white/80 blur-[3px] shadow-[0_0_12px_#fff] ${isLeft ? 'right-0' : 'left-0'}`}
                            style={{ width: `${s(10)}px` }}
                        />
                    </motion.div>

                    {/* Impact Spark Flare on Ki Spend / Decrease */}
                    <AnimatePresence>
                        {isSpending && (
                            <motion.div
                                key={`ki-flare-${flareCount}`}
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 2.2, opacity: [1, 0.8, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="absolute top-0 bottom-0 pointer-events-none z-20 bg-gradient-to-r from-yellow-200 via-white to-amber-500 blur-[2px] shadow-[0_0_20px_#fff,0_0_30px_#f59e0b]"
                                style={{
                                    width: `${s(14)}px`,
                                    [isLeft ? 'left' : 'right']: `${pct}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Gloss & Sheen Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/40 pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                </div>

                {/* Mini Bars */}
                <div 
                    className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
                    style={{ gap: `${s(8)}px` }}
                >
                    {[...Array(Math.ceil(safeMaxKi / 100))].map((_, i) => {
                        const isActive = i < bars;
                        return (
                            <motion.div 
                                key={`minibar-${isLeft ? 'p1' : 'p2'}-${i}`} 
                                className={`skew-x-[-12deg] rounded-sm transition-all duration-300 ${
                                    isActive 
                                        ? (isMaxed ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]') 
                                        : 'bg-slate-800/80 border border-white/5'
                                }`} 
                                style={{ width: `${s(32)}px`, height: `${s(14)}px` }}
                                animate={{ scale: isActive && (justLeveledUp || isCharging) ? [1, 1.15, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Helper to get combo title rating
const getComboRating = (combo: number) => {
    if (combo >= 20) return { title: 'GODLIKE!', color: 'text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]' };
    if (combo >= 12) return { title: 'ULTIMATE!', color: 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' };
    if (combo >= 7) return { title: 'SUPER!', color: 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' };
    if (combo >= 4) return { title: 'GREAT!', color: 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' };
    return { title: 'COMBO', color: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]' };
};

function getColorClasses(color: string) {
    const map: Record<string, { bg: string, border: string, text: string, from: string }> = {
        orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', from: 'from-orange-500' },
        red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', from: 'from-red-500' },
        blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', from: 'from-blue-500' },
        green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', from: 'from-green-500' },
        yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500', from: 'from-yellow-500' },
        purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', from: 'from-purple-500' },
        pink: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500', from: 'from-pink-500' },
        indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-500', from: 'from-indigo-500' },
        teal: { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-500', from: 'from-teal-500' },
    };
    return map[color] || map.orange;
}

const areHUDPropsEqual = (prev: Readonly<HUDProps>, next: Readonly<HUDProps>) => {
    if (prev.timer !== next.timer ||
        prev.p1ActiveIdx !== next.p1ActiveIdx ||
        prev.p2ActiveIdx !== next.p2ActiveIdx ||
        prev.p1FusionTimer !== next.p1FusionTimer ||
        prev.p2FusionTimer !== next.p2FusionTimer ||
        prev.wave !== next.wave ||
        prev.gameMode !== next.gameMode ||
        prev.onTimerClick !== next.onTimerClick ||
        prev.uiVisible !== next.uiVisible) {
        return false;
    }

    if (prev.p1.hp !== next.p1.hp ||
        prev.p1.maxHp !== next.p1.maxHp ||
        prev.p1.combo !== next.p1.combo ||
        prev.p1.guard !== next.p1.guard ||
        prev.p1.maxGuard !== next.p1.maxGuard ||
        prev.p1.ki !== next.p1.ki ||
        prev.p1.maxKi !== next.p1.maxKi) {
        return false;
    }

    if (prev.p2.hp !== next.p2.hp ||
        prev.p2.maxHp !== next.p2.maxHp ||
        prev.p2.combo !== next.p2.combo ||
        prev.p2.guard !== next.p2.guard ||
        prev.p2.maxGuard !== next.p2.maxGuard ||
        prev.p2.ki !== next.p2.ki ||
        prev.p2.maxKi !== next.p2.maxKi) {
        return false;
    }

    if (prev.p1Team?.length !== next.p1Team?.length) return false;
    if (prev.p1Team && next.p1Team) {
        for (let i = 0; i < prev.p1Team.length; i++) {
            const a = prev.p1Team[i];
            const b = next.p1Team[i];
            if (a.hp !== b.hp || a.maxHp !== b.maxHp || a.ki !== b.ki) return false;
        }
    }

    if (prev.p2Team?.length !== next.p2Team?.length) return false;
    if (prev.p2Team && next.p2Team) {
        for (let i = 0; i < prev.p2Team.length; i++) {
            const a = prev.p2Team[i];
            const b = next.p2Team[i];
            if (a.hp !== b.hp || a.maxHp !== b.maxHp || a.ki !== b.ki) return false;
        }
    }

    return true;
};
import { useUI } from '../contexts/UIContext';

export const HUDTop: React.FC<HUDProps> = React.memo(({ p1, p2, p1Team, p2Team, p1ActiveIdx, p2ActiveIdx, p1FusionTimer, p2FusionTimer, timer, wave, gameMode, onTimerClick, uiVisible }) => {
    const { playerProfile, selectedOnlineCharId, unlockedCharacters, settings, isPaused } = useSceneManager();
    const { s, sx, sy, getPos, offsetX, offsetY, screenWidth, screenHeight } = useUI();
    
    const p1Col = settings.p1Color || 'orange';
    const p2Col = settings.p2Color || 'red';
    
    const p1Colors = getColorClasses(p1Col);
    const p2Colors = getColorClasses(p2Col);

    const p1Char = unlockedCharacters.find(c => c.id === selectedOnlineCharId);
    const p1Name = p1.name || p1Char?.name || playerProfile?.name || 'FIGHTER 1';
    // For p2, if they have a name in stats use it, else generic
    const p2Name = p2.name || (gameMode === 'ONLINE' ? 'OPPONENT' : 'CPU');

    const isVisible = settings.hudVisible !== false && uiVisible !== false && !isPaused;

    return (
        <AnimatePresence mode="wait">
            {isVisible ? (
                <motion.div
                    key="hud-top-full"
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-x-0 top-0 pointer-events-none flex flex-col justify-start overflow-hidden font-sans w-full"
                    style={{ 
                        paddingTop: `max(var(--safe-top), ${s(20)}px)`,
                        paddingLeft: `max(var(--safe-left), ${s(40)}px)`,
                        paddingRight: `max(var(--safe-right), ${s(40)}px)`
                    }}
                >
                    {/* Top Section: Health & Timer */}
                    <div className="flex justify-between items-start gap-[3vmin] md:gap-[6vmin]">
                        {/* P1 Stats */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex gap-[2vmin] md:gap-[4vmin] items-start">
                                <div className="relative shrink-0">
                                    <div 
                                        className={`skew-x-[-12deg] border-[3px] md:border-[5px] ${p1.ki >= 300 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : p1Colors.border} overflow-hidden bg-slate-900 ${p1Colors.text} relative`}
                                        style={{ width: `${s(100)}px`, height: `${s(100)}px` }}
                                    >
                                        <img 
                                            src={p1.portraitUrl || (p1Char as any)?.thumbnail || AVATAR_LIST[0].url} 
                                            alt="P1" 
                                            className={`w-full h-full object-cover object-[center_20%] skew-x-[12deg] scale-125 transition-transform duration-300 ${p1.hp < p1.maxHp * 0.25 ? 'brightness-90 contrast-125' : ''}`}
                                            referrerPolicy="no-referrer"
                                        />
                                        {p1.ki >= 300 && (
                                            <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse" />
                                        )}
                                    </div>
                                    <div 
                                        className={`absolute ${p1Colors.bg} text-white skew-x-[-12deg] font-black italic shadow-md`}
                                        style={{ 
                                            bottom: `-${s(8)}px`, 
                                            right: `-${s(8)}px`,
                                            padding: `${s(4)}px ${s(8)}px`,
                                            fontSize: `${s(14)}px`
                                        }}
                                    >
                                        P1
                                    </div>
                                </div>
                                <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: `${s(10)}px` }}>
                                    <div className="flex items-center" style={{ gap: `${s(12)}px` }}>
                                        <h2 
                                            className="font-black italic text-white tracking-tighter uppercase drop-shadow-xl truncate"
                                            style={{ fontSize: `${s(28)}px`, maxWidth: `${s(200)}px` }}
                                        >
                                            {p1Name}
                                        </h2>
                                        <div 
                                            className={`flex-1 bg-gradient-to-r ${p1Colors.from} to-transparent`}
                                            style={{ height: `${s(4)}px` }}
                                        ></div>
                                    </div>
                                    <HealthBar current={p1.hp} max={p1.maxHp} guard={p1.guard} maxGuard={p1.maxGuard} isLeft={true} />
                                    {p1FusionTimer !== undefined && p1FusionTimer > 0 && (
                                        <div className="w-3/4 ml-auto" style={{ marginTop: `-${s(12)}px` }}>
                                            <div 
                                                className="w-full bg-slate-900 border border-orange-500/50 -skew-x-[15deg] overflow-hidden shadow-inner relative"
                                                style={{ height: `${s(8)}px` }}
                                            >
                                                <motion.div 
                                                    className="h-full bg-orange-500  relative"
                                                    animate={{ width: `${Math.min(100, (p1FusionTimer / 45) * 100)}%` }}
                                                    transition={{ type: "tween", ease: "linear", duration: 1 }}
                                                >
                                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_1.5s_infinite]"></div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <TeamRoster team={p1Team} isLeft={true} activeIdx={p1ActiveIdx} />
                        </div>

                        {/* Timer and Mode Info */}
                        <div className="relative flex flex-col items-center" style={{ gap: `${s(8)}px` }}>
                            {gameMode === 'SURVIVAL' && (
                                <div 
                                    className="bg-orange-500 text-stone-900 -skew-x-12  border-[2px] border-orange-300 pointer-events-auto"
                                    style={{ padding: `${s(4)}px ${s(24)}px` }}
                                >
                                    <span 
                                        className="block skew-x-12 font-black italic tracking-widest uppercase"
                                        style={{ fontSize: `${s(20)}px` }}
                                    >
                                        Horda {wave}
                                    </span>
                                </div>
                            )}
                            {gameMode === 'BOSS' && (
                                <div 
                                    className="bg-red-700 text-stone-100 -skew-x-12  border-[2px] border-red-500 pointer-events-auto"
                                    style={{ padding: `${s(4)}px ${s(24)}px` }}
                                >
                                    <span 
                                        className="block skew-x-12 font-black italic tracking-widest uppercase"
                                        style={{ fontSize: `${s(20)}px` }}
                                    >
                                        PERIGO MÁXIMO
                                    </span>
                                </div>
                            )}
                            
                            {gameMode !== 'SURVIVAL' ? (
                                <motion.div 
                                    className={`bg-slate-900 border-[3px] md:border-[5px] ${timer <= 10 ? 'border-red-500 ' : 'border-white/20 '} skew-x-[-12deg] flex items-center justify-center relative overflow-hidden pointer-events-auto ${onTimerClick ? 'cursor-pointer hover:border-orange-500' : ''}`}
                                    style={{ width: `${s(100)}px`, height: `${s(100)}px` }}
                                    animate={timer <= 10 ? { scale: [1, 1.05, 1], backgroundColor: ['rgba(15,23,42,1)', 'rgba(69,10,10,1)', 'rgba(15,23,42,1)'] } : {}}
                                    transition={timer <= 10 ? { duration: 1, repeat: Infinity, ease: 'easeOut' } : {}}
                                    onClick={onTimerClick}
                                >
                                    {/* Inner glow on low time */}
                                    {timer <= 10 && (
                                        <motion.div 
                                            className="absolute inset-0 bg-red-500/20 mix-blend-overlay pointer-events-none"
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                                        />
                                    )}
                                    
                                    <div className="skew-x-[12deg] text-center relative z-10 pointer-events-none">
                                        {timer > 9999 ? (
                                            <span 
                                                className="font-black italic tracking-tighter leading-none text-white drop-shadow-md"
                                                style={{ fontSize: `${s(64)}px` }}
                                            >
                                                &infin;
                                            </span>
                                        ) : (
                                            <motion.span 
                                                key={`timer-${Math.ceil(timer)}`}
                                                initial={timer <= 10 ? { scale: 1.5, opacity: 0.5 } : {}}
                                                animate={timer <= 10 ? { scale: 1, opacity: 1 } : {}}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                className={`inline-block font-black italic tracking-tighter leading-none drop-shadow-lg ${timer <= 10 ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]' : 'text-white'}`}
                                                style={{ fontSize: `${s(64)}px` }}
                                            >
                                                {Math.ceil(timer)}
                                            </motion.span>
                                        )}
                                        {onTimerClick && (
                                           <div 
                                               className="absolute left-1/2 -translate-x-1/2 text-white/50 bg-black/50 rounded-full opacity-70 border border-slate-600/50 pointer-events-none"
                                               style={{ bottom: `-${s(16)}px`, padding: `${s(2)}px` }}
                                           >
                                               <Pause className="pointer-events-none" style={{ height: `${s(16)}px`, width: `${s(16)}px` }} />
                                           </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                 <div 
                                     className="bg-slate-900 border-[3px] md:border-[5px] border-orange-500/50 skew-x-[-12deg] flex items-center justify-center shadow-lg pointer-events-auto relative cursor-pointer hover:border-orange-500"
                                     style={{ width: `${s(100)}px`, height: `${s(80)}px` }}
                                     onClick={onTimerClick}
                                 >
                                     <div className="skew-x-[12deg] text-center pointer-events-none">
                                         <span 
                                             className="font-black italic text-orange-400"
                                             style={{ fontSize: `${s(40)}px` }}
                                         >&infin;</span>
                                         {onTimerClick && (
                                           <div 
                                               className="absolute left-1/2 -translate-x-1/2 text-white/50 bg-black/50 rounded-full opacity-70 border border-slate-600/50 pointer-events-none"
                                               style={{ bottom: `-${s(16)}px`, padding: `${s(2)}px` }}
                                           >
                                               <Pause className="pointer-events-none" style={{ height: `${s(16)}px`, width: `${s(16)}px` }} />
                                           </div>
                                        )}
                                     </div>
                                 </div>
                            )}
                        </div>

                        {/* P2 Stats */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex flex-row-reverse items-start" style={{ gap: `${s(32)}px` }}>
                                <div className="relative shrink-0">
                                    <div 
                                        className={`skew-x-[15deg] border-[3px] md:border-[5px] ${p2.ki >= 300 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-pulse' : p2Colors.border} overflow-hidden bg-slate-900 ${p2Colors.text} relative`}
                                        style={{ width: `${s(100)}px`, height: `${s(100)}px` }}
                                    >
                                        <img 
                                            src={p2.portraitUrl || AVATAR_LIST[1].url} 
                                            alt="P2" 
                                            className={`w-full h-full object-cover object-[center_20%] skew-x-[15deg] scale-125 transition-transform duration-300 ${p2.hp < p2.maxHp * 0.25 ? 'brightness-90 contrast-125' : ''}`}
                                            referrerPolicy="no-referrer"
                                        />
                                        {p2.ki >= 300 && (
                                            <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse" />
                                        )}
                                    </div>
                                    <div 
                                        className={`absolute ${p2Colors.bg} text-white skew-x-[15deg] font-black italic shadow-md`}
                                        style={{ 
                                            bottom: `-${s(8)}px`, 
                                            left: `-${s(8)}px`,
                                            padding: `${s(4)}px ${s(8)}px`,
                                            fontSize: `${s(14)}px`
                                        }}
                                    >
                                        CPU
                                    </div>
                                </div>
                                <div className="flex-1 text-right" style={{ display: 'flex', flexDirection: 'column', gap: `${s(10)}px` }}>
                                    <div className="flex flex-row-reverse items-center" style={{ gap: `${s(16)}px` }}>
                                        <h2 
                                            className="font-black italic text-white tracking-tighter uppercase drop-shadow-xl truncate"
                                            style={{ fontSize: `${s(28)}px`, maxWidth: `${s(200)}px` }}
                                        >
                                            {p2Name}
                                        </h2>
                                        <div 
                                            className={`flex-1 bg-gradient-to-l ${p2Colors.from} to-transparent`}
                                            style={{ height: `${s(4)}px` }}
                                        ></div>
                                    </div>
                                    <HealthBar current={p2.hp} max={p2.maxHp} guard={p2.guard} maxGuard={p2.maxGuard} isLeft={false} />
                                    {p2FusionTimer !== undefined && p2FusionTimer > 0 && (
                                        <div className="w-3/4 mr-auto" style={{ marginTop: `-${s(12)}px` }}>
                                            <div 
                                                className="w-full bg-slate-900 border border-orange-500/50 skew-x-[15deg] overflow-hidden shadow-inner relative"
                                                style={{ height: `${s(8)}px` }}
                                            >
                                                <motion.div 
                                                    className="h-full bg-orange-500  ml-auto relative"
                                                    animate={{ width: `${Math.min(100, (p2FusionTimer / 45) * 100)}%` }}
                                                    transition={{ type: "tween", ease: "linear", duration: 1 }}
                                                >
                                                    <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_1.5s_infinite]"></div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <TeamRoster team={p2Team} isLeft={false} activeIdx={p2ActiveIdx} />
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="hud-top-hidden"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute inset-x-0 top-0 pointer-events-none p-[2vmin] md:p-[4vmin] flex justify-center z-50 w-full"
                >
                    {onTimerClick && (
                        <button 
                            onClick={onTimerClick} 
                            className="pointer-events-auto w-[8vmin] h-[8vmin] md:w-[10vmin] md:h-[10vmin] bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg active:scale-95"
                        >
                            <Pause className="w-[3.5vmin] h-[3.5vmin] text-current" />
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}, areHUDPropsEqual);
export const HUDBottom: React.FC<HUDProps> = React.memo(({ p1, p2, p1Team, p2Team, p1ActiveIdx, p2ActiveIdx, p1FusionTimer, p2FusionTimer, timer, wave, gameMode, onTimerClick, uiVisible }) => {
    const { settings, isPaused } = useSceneManager();
    const { s, sx, sy, getPos, offsetX, offsetY, screenWidth, screenHeight } = useUI();
    
    const p1Col = settings.p1Color || 'orange';
    const p2Col = settings.p2Color || 'red';
    
    const p1Colors = getColorClasses(p1Col);
    const p2Colors = getColorClasses(p2Col);

    const isVisible = settings.hudVisible !== false && uiVisible !== false && !isPaused;

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key="hud-bottom-full"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end overflow-hidden font-sans h-full"
                    style={{ 
                        paddingBottom: `max(var(--safe-bottom), ${s(20)}px)`,
                        paddingLeft: `max(var(--safe-left), ${s(40)}px)`,
                        paddingRight: `max(var(--safe-right), ${s(40)}px)`
                    }}
                >
                    {/* Center Section: Combo Counters */}
                    <div 
                        className="flex justify-between items-center absolute inset-x-0" 
                        style={{ top: '30%', padding: `0 ${s(100)}px` }}
                    >
                        <AnimatePresence>
                            {p1.combo > 1 && (
                                <motion.div 
                                    key="p1-combo"
                                    initial={{ opacity: 0, x: -70, scale: 0.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1.1 }}
                                    exit={{ opacity: 0, x: -70, scale: 0.5 }}
                                    className="flex flex-col items-start"
                                >
                                    <div className="flex items-baseline" style={{ gap: `${s(14)}px` }}>
                                        <motion.span 
                                            key={`p1-hit-${p1.combo}`}
                                            initial={{ scale: 2, rotate: -5 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className={`font-black italic ${p1Colors.text} tracking-tighter drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]`}
                                            style={{ fontSize: `${s(120)}px` }}
                                        >
                                            {p1.combo}
                                        </motion.span>
                                        <span 
                                            className="font-black italic text-white uppercase tracking-widest mt-auto drop-shadow-md"
                                            style={{ fontSize: `${s(40)}px`, marginBottom: `${s(16)}px` }}
                                        >HITS</span>
                                    </div>
                                    <motion.span 
                                        key={`p1-rank-${p1.combo}`}
                                        initial={{ scale: 1.3, y: -5 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className={`font-black italic uppercase tracking-[0.2em] ml-2 ${getComboRating(p1.combo).color}`}
                                        style={{ fontSize: `${s(30)}px`, marginTop: `-${s(16)}px` }}
                                    >
                                        {getComboRating(p1.combo).title}
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {p2.combo > 1 && (
                                <motion.div 
                                    key="p2-combo"
                                    initial={{ opacity: 0, x: 70, scale: 0.5 }}
                                    animate={{ opacity: 1, x: 0, scale: 1.1 }}
                                    exit={{ opacity: 0, x: 70, scale: 0.5 }}
                                    className="flex flex-col items-end"
                                >
                                    <div className="flex items-baseline flex-row-reverse" style={{ gap: `${s(14)}px` }}>
                                        <motion.span 
                                            key={`p2-hit-${p2.combo}`}
                                            initial={{ scale: 2, rotate: 5 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className={`font-black italic ${p2Colors.text} tracking-tighter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]`}
                                            style={{ fontSize: `${s(120)}px` }}
                                        >
                                            {p2.combo}
                                        </motion.span>
                                        <span 
                                            className="font-black italic text-white uppercase tracking-widest mt-auto drop-shadow-md"
                                            style={{ fontSize: `${s(40)}px`, marginBottom: `${s(16)}px` }}
                                        >HITS</span>
                                    </div>
                                    <motion.span 
                                        key={`p2-rank-${p2.combo}`}
                                        initial={{ scale: 1.3, y: -5 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className={`font-black italic uppercase tracking-[0.2em] mr-2 ${getComboRating(p2.combo).color}`}
                                        style={{ fontSize: `${s(30)}px`, marginTop: `-${s(16)}px` }}
                                    >
                                        {getComboRating(p2.combo).title}
                                    </motion.span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Section: Ki Bars */}
                    <div 
                        className="flex justify-between items-end mt-auto"
                        style={{ gap: `${s(40)}px` }}
                    >
                        <div className="w-[45%] md:w-[40%]">
                            <KiBar ki={p1.ki} maxKi={p1.maxKi} isLeft={true} />
                        </div>
                        <div className="w-[45%] md:w-[40%]">
                            <KiBar ki={p2.ki} maxKi={p2.maxKi} isLeft={false} />
                        </div>
                    </div>

                    {/* Decorative Scanlines (Removed) */}
                    <div className="hidden"></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}, areHUDPropsEqual);
