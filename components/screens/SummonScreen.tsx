import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CharacterData, RarityTier } from '../../types';
import { RARITY_INFO, BANNERS, BASE_CHARACTERS, RESOURCE_SPRITES } from '../../constants';
import { SummonManager, GachaItem, GachaResult } from '../../services/SummonManager';
import { AudioManager } from '../../services/AudioManager';
import { SummonAnimation } from '../SummonAnimation';
import { useUI } from '../../contexts/UIContext';
import { KiParticles } from '../KiParticles';
import { 
    ChevronLeft, 
    ChevronRight,
    Zap, 
    Star, 
    Info, 
    X,
    Sparkles,
    Flame,
    Coins,
    Award,
    Shield,
    Gem as GemIcon,
    Check,
    Lock,
    Eye,
    Grid,
    Backpack,
    Layers,
    Menu,
    ShoppingCart,
    Search
} from 'lucide-react';

export const SummonScreen: React.FC = () => {
    const { 
        changeScene, gems, rouletteCoins, unlockedItems,
        spendGems, spendTickets, addRouletteCoins, unlockItem, spendRouletteCoins,
        unlockedCharacters, unlockCharacter, notifyMissionProgress, setSummonBattleResults,
        bannerTokens, addCrystals
    } = useSceneManager();
    
    // --- STATE ---
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);
    const [phase, setPhase] = useState<'SELECT' | 'RESULT' | 'PROBABILITIES' | 'REDEEM'>('SELECT');
    const [pullResults, setPullResults] = useState<GachaResult[]>([]);
    const [pullTimestamp, setPullTimestamp] = useState(0);
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [isAutoRevealing, setIsAutoRevealing] = useState(false);
    
    const [paymentMethod, setPaymentMethod] = useState<'GEM' | 'TICKET'>('GEM');
    const [pullCount, setPullCount] = useState<1 | 10>(1); 
    const [skyColor, setSkyColor] = useState('bg-slate-950');
    
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
    const [pendingCoins, setPendingCoins] = useState(0);
    const [redeemedItemForAnim, setRedeemedItemForAnim] = useState<any>(null);
    const [redeemFeedback, setRedeemFeedback] = useState<{ msg: string; success: boolean } | null>(null);
    const [redeemSearchQuery, setRedeemSearchQuery] = useState('');
    const [redeemCategory, setRedeemCategory] = useState<GachaItem['category'] | 'PERSONAGEM' | 'ALL'>('ALL');
    const [selectedRedeemItemId, setSelectedRedeemItemId] = useState<string | null>(null);
    const [isBannerMenuOpen, setIsBannerMenuOpen] = useState(false);
    const [confirmingSummon, setConfirmingSummon] = useState(false);
    const [skipConfirmations, setSkipConfirmations] = useState<Record<string, boolean>>({});

    const { s } = useUI();

    const currentBanner = BANNERS[activeBannerIdx];
    const currentBannerTickets = bannerTokens[currentBanner.id] || 0;

    const theme = useMemo(() => {
        const id = currentBanner.id;
        if (id === 'eternal_characters') return {
            accent: 'cyan',
            text: 'text-cyan-500',
            textLight: 'text-cyan-400',
            bg: 'bg-cyan-600',
            bar: 'from-cyan-600 to-blue-400',
            filter: '[filter:hue-rotate(180deg)_brightness(1.1)]',
            shadow: 'shadow-cyan-950/20',
            btn: 'from-cyan-600 to-blue-600',
            hoverBorder: 'hover:border-cyan-500',
            hex: '#06b6d4'
        };
        if (id === 'legendary_characters') return {
            accent: 'amber',
            text: 'text-amber-500',
            textLight: 'text-amber-400',
            bg: 'bg-amber-600',
            bar: 'from-amber-600 to-orange-400',
            filter: '[filter:hue-rotate(0deg)_brightness(1.2)]',
            shadow: 'shadow-amber-950/20',
            btn: 'from-amber-600 to-orange-600',
            hoverBorder: 'hover:border-amber-500',
            hex: '#fbbf24'
        };
        if (id === 'rare_items') return {
            accent: 'pink',
            text: 'text-pink-500',
            textLight: 'text-pink-400',
            bg: 'bg-pink-600',
            bar: 'from-pink-600 to-fuchsia-400',
            filter: '[filter:hue-rotate(320deg)_brightness(1.2)]',
            shadow: 'shadow-pink-950/20',
            btn: 'from-pink-600 to-fuchsia-600',
            hoverBorder: 'hover:border-pink-500',
            hex: '#ec4899'
        };
        return { // default / standard
            accent: 'purple',
            text: 'text-purple-500',
            textLight: 'text-purple-400',
            bg: 'bg-purple-600',
            bar: 'from-purple-600 to-fuchsia-400',
            filter: '[filter:hue-rotate(280deg)_brightness(1.2)]',
            shadow: 'shadow-purple-950/20',
            btn: 'from-purple-600 to-fuchsia-600',
            hoverBorder: 'hover:border-purple-500',
            hex: '#a855f7'
        };
    }, [BANNERS, activeBannerIdx]); // Changed dependency to BANNERS and activeBannerIdx since currentBanner depends on them

    const currentBannerColor = theme.hex;

    const handleStartPull = () => {
        if (skipConfirmations[currentBanner.id]) {
            startPull();
        } else {
            setConfirmingSummon(true);
            AudioManager.getInstance().playSFX('click');
        }
    };

    const toggleSkip = () => {
        setSkipConfirmations(prev => ({
            ...prev,
            [currentBanner.id]: !prev[currentBanner.id]
        }));
        AudioManager.getInstance().playSFX('click');
    };

    const featuredItem = useMemo(() => {
        const char = BASE_CHARACTERS.find(c => c.id === currentBanner.featuredCharId);
        if (char) return { type: 'CHARACTER' as const, data: char };
        const item = SummonManager.GACHA_ITEMS.find(i => i.id === currentBanner.featuredCharId);
        if (item) return { type: 'ITEM' as const, data: item };
        return null;
    }, [currentBanner]);

    const featuredChar = featuredItem?.type === 'CHARACTER' ? featuredItem.data as CharacterData : null;

    // Cost logic based on Gacha Specification
    const currentCost = useMemo(() => {
        if (currentBanner.id === 'eternal_characters') {
            return pullCount === 10 ? 500 : 50;
        } else if (currentBanner.id === 'legendary_characters') {
            return pullCount === 10 ? 300 : 30;
        } else { // rare_items
            return pullCount === 10 ? 200 : 20;
        }
    }, [currentBanner, pullCount]);

    // Auto toggle payment method if lack of funds
    useEffect(() => {
        if (paymentMethod === 'GEM' && gems < currentCost && currentBannerTickets >= (pullCount === 10 ? 10 : 1)) {
            setPaymentMethod('TICKET');
        }
    }, [gems, currentBannerTickets, currentCost, pullCount, paymentMethod]);

    const startPull = () => {
        if (phase !== 'SELECT' || isDebouncing) return; 
        
        if (paymentMethod === 'GEM' && gems < currentCost) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        if (paymentMethod === 'TICKET') {
            const requiredTickets = pullCount === 10 ? 10 : 1;
            if (currentBannerTickets < requiredTickets) {
                AudioManager.getInstance().playSFX('cancel');
                return;
            }
        }

        setIsDebouncing(true);
        
        let success = false;
        if (paymentMethod === 'GEM') {
            success = spendGems(currentCost);
        } else {
            success = spendTickets(pullCount === 10 ? 10 : 1, currentBanner.id);
        }

        if (success) {
            performSummon();
            notifyMissionProgress('SUMMON', pullCount);
            AudioManager.getInstance().playSFX('confirm');
        } else {
            setIsDebouncing(false);
            AudioManager.getInstance().playSFX('cancel');
        }
    };

    const performSummon = () => {
        const results: GachaResult[] = [];
        // Pack of 10 gives 1 bonus spin (total 11)
        const totalSpins = pullCount === 10 ? 11 : 1; 
        
        const currentRosterIds = new Set<string>(unlockedCharacters.map(c => c.id));
        const currentItemIds = new Set<string>(Object.keys(unlockedItems));

        for (let i = 0; i < totalSpins; i++) {
            const res = SummonManager.rollBanner(currentBanner.id, Array.from(currentRosterIds), Array.from(currentItemIds));
            
            // Handle actual unlocking and item saving
            if (res.type === 'CHARACTER' && res.character) {
                const unlockRes = unlockCharacter(res.character.id);
                // If we already rolled it in THIS batch, it's not new for the UI
                res.isNew = !currentRosterIds.has(res.character.id) && unlockRes.isNew;
                currentRosterIds.add(res.character.id);
            } else if (res.type === 'ITEM' && res.item) {
                const unlockRes = unlockItem(res.item.id);
                res.isNew = !currentItemIds.has(res.item.id) && unlockRes.isNew;
                currentItemIds.add(res.item.id);
            } else if (res.type === 'CRYSTAL' && res.crystalCharId && res.quantity) {
                addCrystals(res.crystalCharId, res.quantity);
            }

            results.push(res);
        }

        setPullResults(results);
        setPullTimestamp(Date.now());
        setFlippedCards({}); // Reset card states
        setPendingCoins(0);
        setIsAutoRevealing(true);

        // Best rarity glow
        const bestRarity = results.reduce((best, curr) => {
            let rarity: RarityTier = 'COMMON';
            if (curr.type === 'CHARACTER' && curr.character) rarity = curr.character.rarity;
            else if (curr.type === 'ITEM' && curr.item) rarity = curr.item.rarity;
            
            const val = (r: RarityTier) => {
                if (r === 'ETERNAL') return 4;
                if (r === 'LEGENDARY') return 3;
                if (r === 'EPIC') return 2;
                if (r === 'RARE') return 1;
                return 0;
            };
            return val(rarity) > val(best) ? rarity : best;
        }, 'COMMON' as RarityTier);

        if (bestRarity === 'ETERNAL') setSkyColor('from-cyan-950 via-slate-900 to-stone-950');
        else if (bestRarity === 'LEGENDARY') setSkyColor('from-yellow-950 via-slate-900 to-stone-950');
        else if (bestRarity === 'EPIC') setSkyColor('from-purple-950 via-slate-900 to-stone-950');
        else setSkyColor('from-orange-950 via-slate-900 to-stone-950');

        setPhase('RESULT');
        AudioManager.getInstance().playSFX('reveal');
    };

    // Auto-revelation logic
    useEffect(() => {
        if (phase === 'RESULT' && isAutoRevealing && pullResults.length > 0) {
            let revealedCount = 0;
            const total = pullResults.length;
            
            const interval = setInterval(() => {
                if (revealedCount < total) {
                    flipCard(revealedCount);
                    revealedCount++;
                } else {
                    setIsAutoRevealing(false);
                    clearInterval(interval);
                }
            }, 600); // 0.6s delay between revelations

            return () => clearInterval(interval);
        }
    }, [phase, isAutoRevealing, pullResults]);

    const resetSummon = () => {
        if (pendingCoins > 0) {
            addRouletteCoins(pendingCoins, currentBanner.id);
            setPendingCoins(0);
        }
        setPhase('SELECT');
        setPullResults([]);
        setSkyColor('bg-slate-950');
        setIsDebouncing(false);
        setIsAutoRevealing(false);
        AudioManager.getInstance().playSFX('click');
    };

    const getRepeatedCoinsAmount = (res: GachaResult): number => {
        const rarity = res.type === 'CHARACTER' ? res.character?.rarity : res.item?.rarity;
        const category = res.type === 'CHARACTER' ? 'CHARACTER' : res.item?.category;

        if (!rarity) return 1;

        const rates: Record<string, Record<string, number>> = {
            'CHARACTER': { COMMON: 10, RARE: 20, EPIC: 30, LEGENDARY: 40, ETERNAL: 50 },
            'Personagem': { COMMON: 10, RARE: 20, EPIC: 30, LEGENDARY: 40, ETERNAL: 50 },
            'Cenario':   { COMMON: 5,  RARE: 10, EPIC: 20, LEGENDARY: 30, ETERNAL: 40 },
            'Avatar':    { COMMON: 2,  RARE: 5,  EPIC: 10, LEGENDARY: 15, ETERNAL: 25 },
            'Fundo':     { COMMON: 1,  RARE: 3,  EPIC: 5,  LEGENDARY: 10, ETERNAL: 15 }
        };

        const typeRates = rates[category || 'CHARACTER'] || rates['CHARACTER'];
        return typeRates[rarity] || 1;
    };

    const flipCard = (index: number) => {
        if (flippedCards[index]) return;
        
        const res = pullResults[index];
        if (res) {
            let coinsToGain = 0;
            if (res.type === 'COIN' && res.coinsAmount) {
                coinsToGain = res.coinsAmount;
            } else if (!res.isNew) {
                coinsToGain = getRepeatedCoinsAmount(res);
            }
            
            if (coinsToGain > 0) {
                setPendingCoins(prev => prev + coinsToGain);
            }

            const rarity = res.type === 'CHARACTER' ? res.character?.rarity : res.item?.rarity;
            if (rarity === 'ETERNAL' || rarity === 'LEGENDARY') {
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            }
        }

        setFlippedCards(prev => ({ ...prev, [index]: true }));
        AudioManager.getInstance().playSFX('reveal');
    };

    const flipAll = () => {
        setIsAutoRevealing(false); // Stop auto-revelation if manual reveal all is clicked
        const next: Record<number, boolean> = {};
        let coinsToGain = 0;
        let hasHighRarity = false;
        
        pullResults.forEach((res, i) => {
            next[i] = true;
            if (!flippedCards[i]) {
                if (res.type === 'COIN' && res.coinsAmount) {
                    coinsToGain += res.coinsAmount;
                } else if (!res.isNew) {
                    coinsToGain += getRepeatedCoinsAmount(res);
                }
            }
            const rarity = res.type === 'CHARACTER' ? res.character?.rarity : res.item?.rarity;
            if (rarity === 'ETERNAL' || rarity === 'LEGENDARY') {
                hasHighRarity = true;
            }
        });
        
        if (coinsToGain > 0) {
            setPendingCoins(prev => prev + coinsToGain);
        }
        if (hasHighRarity) {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        setFlippedCards(next);
        AudioManager.getInstance().playSFX('reveal');
    };

    const isAllFlipped = useMemo(() => {
        return pullResults.length > 0 && pullResults.every((_, i) => flippedCards[i]);
    }, [pullResults, flippedCards]);


    // Filtered collection list
    return (
        <div 
            className="w-full h-full relative overflow-hidden bg-stone-950 font-sans text-stone-100 select-none bg-grain"
        >
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/fundobanner/b3.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-15"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>

            {/* Ki Particles */}
            <KiParticles color="gold" particleCount={30} speed={1.2} />

            <div className="scanline" />

            {/* --- TOP HEADER --- */}
            <header className="h-16 md:h-20 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] flex items-center justify-between relative z-50 bg-stone-950/90 border-b border-stone-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3 md:gap-5">
                    <button 
                        onClick={() => { 
                            if (phase !== 'SELECT') {
                                resetSummon();
                            } else {
                                AudioManager.getInstance().playSFX('cancel'); 
                                changeScene(SceneName.MAIN_MENU); 
                            }
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-stone-900 flex items-center justify-center border border-stone-800 hover:border-orange-500 rounded-xl group transition-all cursor-pointer active:scale-95"
                        id="summon-back-btn"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-2 h-5 bg-gradient-to-b from-orange-400 to-orange-600 skew-x-[-15deg]" />
                            <h2 className="text-lg md:text-xl font-black italic uppercase tracking-wider text-white">
                                {phase === 'REDEEM' ? 'Loja de Resgate' : 'Sistema de Gacha'}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Gacha Coins Balance */}

                    {/* Gems Counter */}
                    <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1 md:px-3.5 md:py-1.5 hover:border-cyan-500/30 transition-all">
                        <img src={RESOURCE_SPRITES.curr_gems} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" draggable={false} />
                        <div className="flex flex-col">
                            <span className="text-[7px] text-stone-500 font-bold uppercase tracking-wider leading-none">DIAMANTES</span>
                            <span className="text-xs font-mono font-black italic text-stone-100">{gems}</span>
                        </div>
                    </div>

                    {/* Tickets Counter */}
                    <div 
                        className="flex items-center gap-1.5 bg-stone-900 border rounded-xl px-2.5 py-1 md:px-3.5 md:py-1.5 transition-all"
                        style={{ borderColor: `${currentBannerColor}40` }}
                    >
                        <img src={RESOURCE_SPRITES.curr_tickets} alt="" className="w-5 h-5 object-contain" style={{ filter: `drop-shadow(0 0 5px ${currentBannerColor})` }} referrerPolicy="no-referrer" draggable={false} />
                        <div className="flex flex-col">
                            <span className="text-[7px] text-stone-500 font-bold uppercase tracking-wider leading-none">TOKENS {currentBanner.id.split('_')[0].toUpperCase()}</span>
                            <span className="text-xs font-mono font-black italic text-stone-100">{currentBannerTickets}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- SELECT PHASE --- */}
            <AnimatePresence>
                {phase === 'SELECT' && (
                    <div className="absolute inset-x-0 top-16 md:top-20 bottom-0 z-10 flex overflow-hidden">
                        
                        {/* REDEMPTION ANIMATION OVERLAY */}
                        <AnimatePresence>
                            {confirmingSummon && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="w-full max-w-sm bg-stone-900 border-2 border-stone-800 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,1)]"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <Info style={{ color: currentBannerColor }} />
                                            <h3 className="text-xl font-black italic uppercase text-white">CONFIRMAR?</h3>
                                        </div>

                                        <p className="text-stone-400 font-bold mb-8 text-sm leading-relaxed">
                                            DESEJA REALIZAR ESTA INVOCAÇÃO NA <span className="text-white" style={{ color: currentBannerColor }}>{currentBanner.title}</span>?
                                        </p>

                                        <div className="flex items-center gap-3 mb-8 bg-stone-950 p-4 rounded-2xl border border-white/5">
                                            <img 
                                                src={paymentMethod === 'GEM' ? RESOURCE_SPRITES.curr_gems : (pullCount === 10 ? RESOURCE_SPRITES.TICKET_10 : RESOURCE_SPRITES.curr_tickets)} 
                                                alt="" className="w-8 h-8 object-contain" 
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-stone-500 font-black uppercase">CUSTO DO GIRO:</span>
                                                <span className="text-xl font-black italic text-white">{paymentMethod === 'GEM' ? currentCost : (pullCount === 10 ? 10 : 1)}</span>
                                            </div>
                                        </div>

                                        {/* Skip Toggle */}
                                        <button 
                                            onClick={toggleSkip}
                                            className="flex items-center gap-3 mb-8 group cursor-pointer"
                                        >
                                            <div 
                                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${skipConfirmations[currentBanner.id] ? 'border-transparent' : 'bg-stone-950 border-stone-800 group-hover:border-stone-600'}`}
                                                style={{ backgroundColor: skipConfirmations[currentBanner.id] ? currentBannerColor : undefined }}
                                            >
                                                {skipConfirmations[currentBanner.id] && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest group-hover:text-stone-300">Não mostrar novamente</span>
                                        </button>

                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={() => {
                                                    setConfirmingSummon(false);
                                                    startPull();
                                                }}
                                                className="h-16 text-white font-black italic uppercase rounded-2xl shadow-xl transition-all"
                                                style={{ backgroundColor: currentBannerColor }}
                                            >
                                                CONFIRMAR
                                            </button>
                                            <button 
                                                onClick={() => setConfirmingSummon(false)}
                                                className="h-12 text-stone-500 hover:text-white font-black italic uppercase tracking-widest text-xs"
                                            >
                                                CANCELAR
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {redeemedItemForAnim && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        transition={{ type: "spring", damping: 15 }}
                                        className="relative flex flex-col items-center"
                                    >
                                        {/* Background Glow */}
                                        <div className="absolute inset-0 bg-orange-500/20 blur-[120px] rounded-full animate-pulse" />
                                        
                                        {/* Burst Particles (simulated with CSS/Framer) */}
                                        {[...Array(8)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: 0, y: 0, opacity: 1 }}
                                                animate={{ 
                                                    x: Math.cos(i * 45 * Math.PI / 180) * 200, 
                                                    y: Math.sin(i * 45 * Math.PI / 180) * 200,
                                                    opacity: 0
                                                }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className="absolute w-2 h-2 bg-orange-400 rounded-full"
                                            />
                                        ))}

                                        <div className="relative mb-8">
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-[-40px] border-2 border-dashed border-orange-500/30 rounded-full"
                                            />
                                            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-orange-500 shadow-[0_0_50px_rgba(234,88,12,0.5)] overflow-hidden bg-stone-900">
                                                <img 
                                                    src={redeemedItemForAnim.imageUrl} 
                                                    className="w-full h-full object-cover object-top"
                                                    alt=""
                                                />
                                            </div>
                                        </div>

                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-center"
                                        >
                                            <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter mb-2">RESGATADO!</h2>
                                            <p className="text-orange-500 text-xl md:text-2xl font-black italic uppercase tracking-widest">{redeemedItemForAnim.name}</p>
                                        </motion.div>

                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.5 }}
                                            onClick={() => setRedeemedItemForAnim(null)}
                                            className="mt-12 h-14 px-12 bg-white text-black font-black italic uppercase rounded-full hover:scale-105 transition-transform"
                                        >
                                            CONTINUAR
                                        </motion.button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 relative flex flex-col transition-all duration-500"
                        >
                            {/* Banner dynamic backdrop layer */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                                <img src={currentBanner.img} className="w-full h-full object-cover grayscale-[35%] opacity-20 transition-all duration-700" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950" />
                            </div>

                            {/* MAIN CONTENT STAGE */}
                            <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 relative z-10">
                                {/* LEFT PANEL: The Summoning Portal Visual */}
                                <div className="w-full max-w-sm md:max-w-md relative group">
                                    <div className="relative aspect-square flex items-center justify-center">
                                        {/* Dynamic Halo background */}
                                        <div className="absolute inset-[-10%] rounded-full animate-pulse" style={{ backgroundColor: `${currentBannerColor}15`, filter: 'blur(60px)' }} />
                                        
                                        {/* Orbital Rings */}
                                        <div className="absolute inset-0 border-2 border-dashed rounded-full animate-[spin_20s_linear_infinite] opacity-20" style={{ borderColor: currentBannerColor }} />
                                        <div className="absolute inset-12 border border-dashed rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-20" style={{ borderColor: currentBannerColor }} />

                                        {/* Banner Preview Frame */}
                                        <div className="relative w-full h-full p-4">
                                            <div className="w-full h-full rounded-full border-4 border-stone-800 bg-stone-900 shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden relative group-hover:border-stone-700 transition-colors">
                                                <img 
                                                    src={currentBanner.img} 
                                                    className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                                                    alt={currentBanner.title} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* TRIGGER CONTROLS PANEL */}
                                <div className="w-full max-w-sm mt-8 md:mt-12 flex flex-col items-center">
                                    
                                    {/* Payment Method Selector */}
                                    <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 mb-6">
                                        <button
                                            onClick={() => { setPaymentMethod('GEM'); AudioManager.getInstance().playSFX('click'); }}
                                            className={`px-5 py-2 rounded-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${paymentMethod === 'GEM' ? 'bg-orange-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                                        >
                                            <img src={RESOURCE_SPRITES.curr_gems} alt="" className="w-4 h-4 object-contain" />
                                            Diamantes
                                        </button>
                                        <button
                                            onClick={() => { setPaymentMethod('TICKET'); AudioManager.getInstance().playSFX('click'); }}
                                            className={`px-5 py-2 rounded-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer ${paymentMethod === 'TICKET' ? 'bg-cyan-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}`}
                                        >
                                            <img src={RESOURCE_SPRITES.curr_tickets} alt="" className="w-4 h-4 object-contain" />
                                            Tokens
                                        </button>
                                    </div>

                                    {/* Pull count and summon action buttons */}
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="flex flex-col bg-stone-900 border border-stone-800 rounded-2xl p-1 shrink-0">
                                            <button 
                                                onClick={() => { setPullCount(1); AudioManager.getInstance().playSFX('click'); }}
                                                className={`w-14 h-10 rounded-xl font-black italic text-sm flex items-center justify-center transition-all cursor-pointer ${pullCount === 1 ? 'bg-stone-800 text-orange-500 border border-orange-500/30' : 'text-stone-500 hover:text-stone-300'}`}
                                            >
                                                1x
                                            </button>
                                            <button 
                                                onClick={() => { setPullCount(10); AudioManager.getInstance().playSFX('click'); }}
                                                className={`w-14 h-10 rounded-xl font-black italic text-sm flex items-center justify-center transition-all cursor-pointer ${pullCount === 10 ? 'bg-stone-800 text-orange-500 border border-orange-500/30' : 'text-stone-500 hover:text-stone-300'}`}
                                            >
                                                10+
                                            </button>
                                        </div>

                                        <motion.button
                                            onPointerDown={(e) => { e.preventDefault(); handleStartPull(); }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`
                                                flex-1 h-20 flex items-center justify-center gap-3 transition-all border-b-4 rounded-2xl relative overflow-hidden group/btn font-black italic uppercase shrink-0 cursor-pointer shadow-2xl
                                                ${(paymentMethod === 'GEM' && gems >= currentCost) || (paymentMethod === 'TICKET' && currentBannerTickets >= (pullCount === 10 ? 10 : 1))
                                                    ? 'bg-orange-600 hover:bg-orange-500 border-orange-800 text-white' 
                                                    : 'bg-stone-800 border-stone-900 text-stone-500 grayscale cursor-not-allowed'}
                                            `}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shine" />
                                            <div className="flex flex-col items-center justify-center relative z-10">
                                                <span className="text-xl tracking-tighter leading-none font-black">INVOCAR</span>
                                                <div className="flex items-center gap-2 mt-1 opacity-95 text-xs">
                                                    <img 
                                                        src={paymentMethod === 'GEM' ? RESOURCE_SPRITES.curr_gems : (pullCount === 10 ? RESOURCE_SPRITES.TICKET_10 : RESOURCE_SPRITES.curr_tickets)} 
                                                        alt="" className="w-4 h-4 object-contain" 
                                                    />
                                                    <span className="font-bold">{paymentMethod === 'GEM' ? currentCost : (pullCount === 10 ? 10 : 1)}</span>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </div>
                                    <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-4 opacity-60">Toque para manifestar sua sorte instantaneamente</span>
                                </div>

                                {/* RIGHT PANEL: Side widgets */}
                                <div className="w-full md:w-60 flex flex-row md:flex-col gap-3 justify-end md:justify-start shrink-0 z-20 pointer-events-auto">
                                    {/* Redemption Shop Button */}
                                    <div className="flex-1 md:flex-initial">
                                        <button 
                                            onClick={() => { setPhase('REDEEM'); AudioManager.getInstance().playSFX('click'); }}
                                            className="w-full h-14 bg-stone-900/60 backdrop-blur-md border border-stone-800 hover:border-orange-500/50 rounded-2xl flex items-center gap-3 px-4 md:px-5 transition-all group active:scale-95 cursor-pointer shadow-xl"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                <ShoppingCart size={18} />
                                            </div>
                                            <div className="flex flex-col items-start leading-none overflow-hidden">
                                                <span className="text-[10px] text-stone-300 font-black uppercase tracking-wider group-hover:text-white transition-colors truncate">Loja de Resgate</span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <img src={RESOURCE_SPRITES.curr_roulette} className="w-2.5 h-2.5 object-contain" alt="" />
                                                    <span className="text-[8px] font-bold text-orange-400">{rouletteCoins[currentBanner.id] || 0}</span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </main>


                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- REVELATION / RESULT GRID PHASE --- */}
            <AnimatePresence>
                {phase === 'RESULT' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 top-16 md:top-20 bottom-0 z-[60] flex flex-col bg-stone-950"
                    >
                        {/* Interactive results grid panel */}
                        <main className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-start md:justify-center relative px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] py-4">
                            
                            <style>{`
                                .perspective-container { perspective: 1500px; }
                                .card-container { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d; }
                                .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                                .card-front { transform: rotateY(180deg); }
                                .flash-effect { animation: flash 0.6s ease-out forwards; }
                                @keyframes flash {
                                    0% { opacity: 0; transform: scale(0.9); }
                                    50% { opacity: 1; transform: scale(1.05); }
                                    100% { opacity: 0; transform: scale(1.1); }
                                }
                            `}</style>

                            {/* Header Section - Proportional scaling */}
                            <div className="text-center relative z-20 mb-6 md:mb-12 mt-4 md:mt-0 shrink-0">
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-2 md:mb-4"
                                >
                                    <img 
                                        src="/Assets/ui/logo/logojogo.png" 
                                        alt="Logo" 
                                        className="h-16 md:h-20 lg:h-28 object-contain mx-auto drop-shadow-[0_0_30px_rgba(255,107,0,0.7)]" 
                                        onError={(e) => e.currentTarget.style.display = 'none'} 
                                    />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col items-center"
                                >
                                    <span className={`text-[9px] md:text-xs ${theme.text} font-black tracking-[0.4em] mb-1 drop-shadow-sm uppercase`}>ROULETTE RESULT</span>
                                    <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter md:tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] leading-none">
                                        DESTINO REVELADO
                                    </h3>
                                </motion.div>
                            </div>

                            {/* Main Display Area - Centered Grid */}
                            <div className="w-full flex-1 flex items-center justify-center py-2 md:py-6">
                                <AnimatePresence mode="popLayout">
                                    <motion.div 
                                        key={`pull-grid-${pullResults.length}-${pullTimestamp}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`
                                            grid gap-3 md:gap-6 lg:gap-8 justify-center items-center w-full max-w-7xl mx-auto
                                            ${pullResults.length === 1 
                                                ? 'grid-cols-1 max-w-[min(85vw,400px)]' 
                                                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}
                                        `}
                                    >
                                        {pullResults.map((res, i) => {
                                        const isFlipped = flippedCards[i];
                                        
                                        let name = '';
                                        let rColor = '#9ca3af'; 
                                        let tagLabel = '';
                                        let rarity: RarityTier = 'COMMON';

                                        if (res.type === 'CHARACTER' && res.character) {
                                            name = res.character.name;
                                            rarity = res.character.rarity;
                                            tagLabel = 'GUERREIRO';
                                        } else if (res.type === 'ITEM' && res.item) {
                                            name = res.item.name;
                                            rarity = res.item.rarity;
                                            tagLabel = res.item.category.toUpperCase();
                                        } else if (res.type === 'CRYSTAL' && res.crystalCharId) {
                                            const char = BASE_CHARACTERS.find(c => c.id === res.crystalCharId);
                                            name = `CRISTAL DE ${char?.name.toUpperCase() || 'EVOLUÇÃO'}`;
                                            rarity = 'EPIC';
                                            tagLabel = 'EVOLUÇÃO';
                                        } else {
                                            name = `${res.coinsAmount} MOEDAS GACHA`;
                                            rarity = 'RARE';
                                            tagLabel = 'RECURSO';
                                        }

                                        const info = RARITY_INFO[rarity] || RARITY_INFO.COMMON;
                                        rColor = info.color;

                                        return (
                                            <div 
                                                key={`summon-res-${i}-${(res as any).id || (res as any).item?.id || 'gen'}`} 
                                                className={`perspective-container relative ${pullResults.length === 1 ? 'h-[60vh] max-h-[520px] min-h-[400px]' : 'h-64 md:h-72'} group`}
                                            >
                                                <motion.div 
                                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                                    className="card-container w-full h-full relative"
                                                >
                                                    {/* CARD BACK SIDE */}
                                                    <div className="card-face absolute inset-0 bg-stone-900 border-2 border-stone-800 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center p-6 shadow-2xl overflow-hidden">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
                                                        <span className="text-[10px] md:text-sm text-stone-400 font-black uppercase tracking-[0.5em] italic relative z-10 animate-pulse text-center leading-relaxed">
                                                            REVELANDO...
                                                        </span>
                                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl" />
                                                    </div>

                                                    {/* CARD FRONT SIDE */}
                                                    <div className="card-face card-front absolute inset-0 bg-stone-950 border-[3px] md:border-4 rounded-2xl md:rounded-3xl flex flex-col items-center justify-between p-4 md:p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
                                                        style={{ borderColor: rColor, boxShadow: `inset 0 0 60px ${rColor}15, 0 0 30px ${rColor}11` }}
                                                    >
                                                        {/* Atmospheric background */}
                                                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${rColor} 0%, transparent 85%)` }} />
                                                        
                                                        {isFlipped && (
                                                            <div className="absolute inset-0 bg-white flash-effect z-[100] pointer-events-none" />
                                                        )}

                                                        {/* Header Badge */}
                                                        <div className="flex items-center justify-between w-full relative z-20">
                                                            <div className="bg-stone-900/90 backdrop-blur-md border px-2 py-0.5 md:px-3 md:py-1 rounded-lg shadow-xl" style={{ borderColor: `${rColor}66` }}>
                                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest italic" style={{ color: rColor }}>
                                                                    {tagLabel}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5 drop-shadow-md">QUANTIDADE</span>
                                                                <div className="bg-orange-600 px-2 md:px-3 py-0.5 md:py-1 rounded-lg border border-orange-400 shadow-lg">
                                                                    <span className="text-[10px] md:text-[13px] font-black text-white italic">
                                                                        x{res.type === 'COIN' ? (res.coinsAmount || 1) : (res.quantity || 1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Central Sprite - Absolute Anchored */}
                                                        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-visible pointer-events-none">
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
                                                            {res.type === 'CHARACTER' && res.character ? (
                                                                <motion.img 
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: pullResults.length === 1 ? 2.6 : 1.8, opacity: 1 }}
                                                                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                                                                    src={res.character.spriteConfig?.portraitUrl || `/Assets/personagens/${res.character.id}/parado.gif`} 
                                                                    alt="" 
                                                                    className="object-cover object-top drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-[120%]"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = `/Assets/personagens/${res.character?.id}/parado.gif`;
                                                                    }}
                                                                />
                                                            ) : res.type === 'ITEM' && res.item ? (
                                                                <motion.img 
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: pullResults.length === 1 ? 2.0 : 1.4, opacity: 1 }}
                                                                    transition={{ delay: 0.2, type: "spring" }}
                                                                    src={res.item.imageUrl} 
                                                                    alt={res.item.name} 
                                                                    className="object-cover object-top drop-shadow-[0_0_35px_rgba(255,255,255,0.2)] max-h-[80%]"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = RESOURCE_SPRITES.curr_roulette;
                                                                    }}
                                                                />
                                                            ) : res.type === 'CRYSTAL' && res.crystalCharId ? (
                                                                <motion.img 
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: pullResults.length === 1 ? 2.0 : 1.4, opacity: 1 }}
                                                                    transition={{ delay: 0.2, type: "spring" }}
                                                                    src={RESOURCE_SPRITES[res.crystalCharId] || RESOURCE_SPRITES.curr_roulette} 
                                                                    alt="Cristal" 
                                                                    className="object-contain drop-shadow-[0_0_35px_rgba(0,255,255,0.4)] max-h-[70%]"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = RESOURCE_SPRITES.curr_roulette;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <motion.img 
                                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                                    animate={{ scale: pullResults.length === 1 ? 2.4 : 1.6, opacity: 1 }}
                                                                    transition={{ delay: 0.2, type: "spring" }}
                                                                    src={RESOURCE_SPRITES.curr_coins} 
                                                                    alt="Moeda Gold" 
                                                                    className={`object-contain drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] max-h-[70%]`}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Information Footer */}
                                                        <div className="relative z-20 w-full mt-auto mb-1 md:mb-2">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <h4 className={`text-white font-black uppercase tracking-widest italic drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)] text-center leading-none px-2 ${pullResults.length === 1 ? 'text-3xl md:text-5xl mb-2' : 'text-[11px] md:text-sm'}`}>
                                                                    {name}
                                                                </h4>
                                                                 {!res.isNew && (res.type === 'CHARACTER' || res.type === 'ITEM') && (
                                                                    <div className="bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full mt-1 md:mt-2 shadow-xl flex items-center gap-1.5 border border-amber-300/50">
                                                                        <Coins size={10} className={`${theme.textLight}`} />
                                                                        <span className="text-[8px] md:text-[10px] font-black text-white uppercase italic tracking-widest">+{getRepeatedCoinsAmount(res)} MOEDAS (REPETIDO)</span>
                                                                    </div>
                                                                )}
                                                                {res.isNew && (
                                                                    <motion.div 
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="bg-cyan-500 px-2 py-0.5 md:px-3 md:py-1 rounded-full mt-1 md:mt-2 shadow-xl flex items-center gap-1.5 border border-cyan-300/50"
                                                                    >
                                                                        <Sparkles size={10} className="text-white fill-white" />
                                                                        <span className="text-[9px] md:text-[11px] font-black text-white uppercase italic tracking-widest">NOVO!</span>
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-center gap-2 md:gap-4 mt-4 md:mt-8">
                                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
                                                                <span className={`font-black uppercase tracking-[0.3em] md:tracking-[0.5em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${pullResults.length === 1 ? 'text-lg md:text-2xl px-4' : 'text-[9px] md:text-[11px]'}`} style={{ color: rColor }}>
                                                                    {rarity}
                                                                </span>
                                                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                            {/* Footer Actions - Anchored to bottom with safe areas */}
                            <footer className="w-full flex items-center justify-center gap-4 mt-auto mb-6 px-6 safe-bottom">
                                {!isAllFlipped && pullResults.length > 1 && (
                                    <button 
                                        onClick={flipAll}
                                        className="bg-stone-800/80 backdrop-blur-md border border-stone-700 hover:border-orange-500 text-stone-300 hover:text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                                    >
                                        REVELAR TUDO
                                    </button>
                                )}
                                
                                {isAllFlipped && (
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => { setPhase('REDEEM'); AudioManager.getInstance().playSFX('click'); }}
                                            className="hidden md:flex bg-stone-900/80 backdrop-blur-md border border-stone-800 hover:border-orange-500 text-stone-400 hover:text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 items-center gap-2"
                                        >
                                            <ShoppingCart size={14} />
                                            LOJA DE RESGATE
                                        </button>
                                        <motion.button 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={resetSummon}
                                            className="relative group bg-orange-600 hover:bg-orange-500 text-white px-10 md:px-14 py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] italic transition-all shadow-[0_10px_30px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_40px_rgba(234,88,12,0.5)] active:scale-95 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                                            FECHAR REVELAÇÃO
                                        </motion.button>
                                    </div>
                                )}
                            </footer>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- REDEMPTION SHOP PHASE (Warehouse Layout) --- */}
            <AnimatePresence>
                {phase === 'REDEEM' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 top-16 md:top-20 bottom-0 z-30 flex flex-col bg-stone-950"
                    >
                        {/* Background Layer */}
                        <div className="absolute inset-0 z-0">
                            <img src="/Assets/fundosdastelas/fundobanner/b3.png" alt="" className="w-full h-full object-cover opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
                        </div>

                        {/* Ki Particles */}
                        <KiParticles color="orange" particleCount={25} speed={1.0} />

                        {/* HEADER - Wallet Summary */}
                        <div className="relative z-10 px-10 flex items-center justify-between bg-stone-900 border-b border-white/10 backdrop-blur-sm shrink-0" style={{ height: s(80) }}>
                            <div className="flex flex-col">
                                <span className="text-orange-500 font-black italic tracking-widest uppercase text-[10px]">Trocas Dimensionais</span>
                                <h3 className="text-2xl font-black italic uppercase text-white">LOJA DE RESGATE</h3>
                            </div>

                            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-4 py-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <img src={RESOURCE_SPRITES.curr_roulette} alt="" className="w-5 h-5 object-contain" />
                                    <span className="font-black italic text-orange-400 text-lg">{rouletteCoins[currentBanner.id] || 0}</span>
                                </div>
                                <div className="w-px h-5 bg-stone-800" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-stone-500 font-bold uppercase tracking-wider">Banner Ativo</span>
                                    <span className="text-[10px] text-white font-black italic uppercase">{currentBanner.title}</span>
                                </div>
                            </div>
                        </div>

                        {/* MAIN AREA */}
                        <main className="flex-1 w-full flex overflow-hidden relative z-10 p-10 gap-10">
                            
                            {/* LEFT COLUMN: Grid + Search */}
                            <div className="flex flex-col overflow-hidden gap-4" style={{ width: s(500) }}>
                                {/* Category Tabs */}
                                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                                    {(['ALL', 'PERSONAGEM', 'Avatar', 'Fundo', 'Cenario'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => { setRedeemCategory(cat); setSelectedRedeemItemId(null); AudioManager.getInstance().playSFX('click'); }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${redeemCategory === cat ? 'bg-orange-600 text-white shadow-lg' : 'bg-stone-900 text-stone-500 hover:text-stone-300 border border-stone-800'}`}
                                        >
                                            {cat === 'ALL' ? 'TUDO' : cat === 'PERSONAGEM' ? 'GUERREIROS' : cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative shrink-0">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={s(16)} />
                                    <input 
                                        type="text" 
                                        placeholder="BUSCAR NA LOJA..." 
                                        value={redeemSearchQuery}
                                        onChange={(e) => setRedeemSearchQuery(e.target.value.toUpperCase())}
                                        className="w-full bg-stone-900 border border-stone-800 rounded-xl text-stone-100 font-black tracking-widest placeholder:text-stone-700 outline-none focus:border-orange-500 transition-all uppercase"
                                        style={{ height: s(48), paddingLeft: s(44), fontSize: s(12) }}
                                    />
                                </div>

                                {/* Grid */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {(() => {
                                            const bannerItems = SummonManager.getItemsForBanner(currentBanner.id);
                                            const bannerChars = SummonManager.getPoolForBanner(currentBanner.id);

                                            const shopItems = [
                                                ...bannerChars.map(c => ({
                                                    id: c.id,
                                                    name: c.name,
                                                    rarity: c.rarity,
                                                    category: 'PERSONAGEM',
                                                    imageUrl: c.spriteConfig?.portraitUrl || '',
                                                    description: c.introText || 'Um guerreiro lendário pronto para a batalha.',
                                                    isCharacter: true
                                                })),
                                                ...bannerItems.map(i => ({
                                                    id: i.id,
                                                    name: i.name,
                                                    rarity: i.rarity,
                                                    category: i.category,
                                                    imageUrl: i.imageUrl,
                                                    description: i.description,
                                                    isCharacter: false
                                                }))
                                            ];

                                            return shopItems.filter(item => {
                                                // Category Filter
                                                if (redeemCategory !== 'ALL' && item.category !== redeemCategory) return false;

                                                // Search Filter
                                                if (redeemSearchQuery.trim()) {
                                                    return item.name.toLowerCase().includes(redeemSearchQuery.toLowerCase());
                                                }
                                                return true;
                                            }).map((item, index) => {
                                                const isSelected = selectedRedeemItemId === item.id;
                                                const isUnlocked = item.isCharacter 
                                                    ? unlockedCharacters.some(c => c.id === item.id)
                                                    : !!unlockedItems[item.id];
                                                const info = RARITY_INFO[item.rarity] || RARITY_INFO.COMMON;
                                                
                                                return (
                                                    <button
                                                        key={`${item.id}-${index}`}
                                                        onClick={() => { 
                                                            setSelectedRedeemItemId(item.id); 
                                                            AudioManager.getInstance().playSFX('click'); 
                                                        }}
                                                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${isSelected ? 'border-orange-500 scale-[1.02] shadow-lg shadow-orange-500/20' : 'border-stone-800 opacity-70 hover:opacity-100 hover:border-stone-600'}`}
                                                    >
                                                        <div className="absolute inset-0 bg-stone-900">
                                                            <img 
                                                                src={item.imageUrl} 
                                                                className={`w-full h-full ${item.isCharacter ? 'object-contain pt-4' : 'object-cover'} transition-transform duration-500 group-hover:scale-110`} 
                                                                alt="" 
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                                        
                                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 font-black italic uppercase text-white border" style={{ fontSize: s(8), borderColor: info.color }}>
                                                            {item.rarity}
                                                        </div>

                                                        {isUnlocked && (
                                                            <div className="absolute top-2 right-2 p-1 bg-green-500 text-white rounded-full z-20">
                                                                <Check size={8} />
                                                            </div>
                                                        )}

                                                        <div className="absolute bottom-2 left-2 right-2 text-left">
                                                            <span className="text-[8px] font-black text-white uppercase italic line-clamp-1">{item.name}</span>
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Preview & Purchase */}
                            <div className="flex-1 relative flex flex-col bg-stone-900 border border-stone-800 rounded-[2rem] overflow-hidden">
                                {(() => {
                                    const bannerItems = SummonManager.getItemsForBanner(currentBanner.id);
                                    const bannerChars = SummonManager.getPoolForBanner(currentBanner.id);
                                    const allBannerItems = [
                                        ...bannerChars.map(c => ({ id: c.id, name: c.name, rarity: c.rarity, category: 'PERSONAGEM', imageUrl: c.spriteConfig?.portraitUrl || '', description: c.introText || '', isCharacter: true })),
                                        ...bannerItems.map(i => ({ id: i.id, name: i.name, rarity: i.rarity, category: i.category, imageUrl: i.imageUrl, description: i.description, isCharacter: false }))
                                    ];

                                    const selectedItem = allBannerItems.find(i => i.id === selectedRedeemItemId) || allBannerItems[0];
                                    
                                    if (!selectedItem) return (
                                        <div className="flex-1 flex items-center justify-center text-stone-600 italic uppercase font-black">
                                            Nenhum item selecionado
                                        </div>
                                    );

                                    const isUnlocked = selectedItem.isCharacter
                                        ? unlockedCharacters.some(c => c.id === selectedItem.id)
                                        : !!unlockedItems[selectedItem.id];
                                        
                                    const info = RARITY_INFO[selectedItem.rarity] || RARITY_INFO.COMMON;
                                    
                                    const costs: Record<RarityTier, number> = {
                                        COMMON: 50,
                                        RARE: 120,
                                        EPIC: 300,
                                        LEGENDARY: 750,
                                        ETERNAL: 1500
                                    };
                                    // Characters cost double
                                    const baseCost = costs[selectedItem.rarity] || 50;
                                    const cost = selectedItem.isCharacter ? baseCost * 2 : baseCost;
                                    const canAfford = (rouletteCoins[currentBanner.id] || 0) >= cost;

                                    return (
                                        <motion.div
                                            key={selectedItem.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="absolute inset-0 flex flex-col"
                                        >
                                            {/* Visual Area */}
                                            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                                                <img 
                                                    src={selectedItem.imageUrl} 
                                                    className={`w-full h-full ${selectedItem.isCharacter ? 'object-contain p-16' : 'object-contain p-10'} drop-shadow-[0_0_50px_rgba(255,165,0,0.3)]`} 
                                                    alt="" 
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                                            </div>

                                            {/* Info Area */}
                                            <div className="p-10 pt-0 relative z-10">
                                                <div className="mb-4">
                                                    <img 
                                                        src="/Assets/ui/logo/logojogo.png" 
                                                        alt="Logo" 
                                                        className="w-32 h-auto object-contain drop-shadow-[0_0_15px_rgba(255,165,0,0.3)]" 
                                                    />
                                                </div>
                                                
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-3 py-1 rounded bg-stone-950 border font-black italic uppercase text-xs" style={{ color: info.color, borderColor: `${info.color}40` }}>
                                                        {selectedItem.rarity}
                                                    </span>
                                                    <span className="text-stone-500 font-black italic uppercase text-xs tracking-widest">{selectedItem.category}</span>
                                                </div>

                                                <h2 className="font-black italic uppercase tracking-tighter text-white leading-none mb-6" style={{ fontSize: s(56) }}>
                                                    {selectedItem.name}
                                                </h2>

                                                <p className="text-stone-400 text-sm font-bold leading-relaxed mb-8 max-w-lg">
                                                    {selectedItem.description}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex gap-4">
                                                    {isUnlocked ? (
                                                        <div className="h-16 px-10 bg-stone-800 text-stone-500 font-black italic uppercase rounded-2xl flex items-center gap-3 border border-stone-700">
                                                            <Check />
                                                            <span>JÁ ADQUIRIDO</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            disabled={!canAfford}
                                                            onClick={() => {
                                                                if (spendRouletteCoins(cost, currentBanner.id)) {
                                                                    if (selectedItem.isCharacter) {
                                                                        unlockCharacter(selectedItem.id);
                                                                    } else {
                                                                        unlockItem(selectedItem.id);
                                                                    }
                                                                    setRedeemedItemForAnim(selectedItem);
                                                                    AudioManager.getInstance().playSFX('confirm');
                                                                } else {
                                                                    AudioManager.getInstance().playSFX('cancel');
                                                                }
                                                            }}
                                                            className={`h-16 px-10 rounded-2xl transition-all shadow-xl flex items-center gap-4 font-black italic uppercase ${canAfford ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-stone-800 text-stone-600 cursor-not-allowed opacity-50'}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <img src={RESOURCE_SPRITES.curr_roulette} className="w-6 h-6 object-contain" alt="" />
                                                                <span className="text-2xl">{cost}</span>
                                                            </div>
                                                            <div className="w-px h-6 bg-white/20" />
                                                            <span>RESGATAR</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </div>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- PROBABILITIES VIEW (RATES SHEET) --- */}
            <AnimatePresence>
                {phase === 'PROBABILITIES' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 top-16 md:top-20 bottom-0 z-30 flex flex-col bg-stone-950/20 backdrop-blur-2xl"
                    >
                        <main className="flex-1 overflow-y-auto custom-scrollbar px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] py-6 max-w-2xl mx-auto w-full">
                            <div className="border-b border-stone-900 pb-4 mb-5">
                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">TRANSPARÊNCIA DO GACHA</span>
                                <h3 className="text-lg font-black text-white uppercase italic mt-0.5">Taxas & Probabilidades</h3>
                            </div>

                            <div className="flex flex-col gap-4 text-sm text-stone-300">
                                <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-xl">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Probabilidades por Categoria (Etapa 1)</h4>
                                    <ul className="text-[10px] space-y-2 leading-relaxed">
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Moedas da Gacha:</span> <span className="font-bold text-white">45.45%</span></li>
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Fundo de Avatar:</span> <span className="font-bold text-white">18.18%</span></li>
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Avatar:</span> <span className="font-bold text-white">16.36%</span></li>
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Cristal de Evolução:</span> <span className="font-bold text-white">9.09%</span></li>
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Cenário:</span> <span className="font-bold text-white">6.36%</span></li>
                                        <li className="flex justify-between items-center"><span className="text-stone-400">Personagem:</span> <span className="font-bold text-white">4.55%</span></li>
                                    </ul>
                                    <p className="text-[8px] text-stone-500 mt-3 italic">*As porcentagens são aproximadas com base nos pesos relativos.</p>
                                </div>

                                <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-xl">
                                    <h4 className={`text-[11px] font-black ${theme.text} uppercase tracking-widest mb-2`}>Distribuição de Moedas de Roleta</h4>
                                    <p className="text-[10px] text-stone-400 leading-normal mb-3">
                                        Quando o drop da roleta resulta em Moedas da Roleta, a quantia é selecionada conforme as seguintes chances:
                                    </p>
                                    <ul className="text-[10px] space-y-1 leading-relaxed grid grid-cols-2">
                                        <li><span className="font-bold text-stone-300">1 Moeda:</span> 35.0% (Alta)</li>
                                        <li><span className="font-bold text-stone-300">3 Moedas:</span> 30.0% (Alta)</li>
                                        <li><span className="font-bold text-stone-300">5 Moedas:</span> 20.0% (Alta)</li>
                                        <li><span className="font-bold text-stone-300">10 Moedas:</span> 7.0% (Média)</li>
                                        <li><span className="font-bold text-stone-300">25 Moedas:</span> 6.0% (Média)</li>
                                        <li><span className="font-bold text-stone-300">50 Moedas:</span> 1.5% (Baixa)</li>
                                        <li><span className="font-bold text-stone-300">100 Moedas:</span> 0.5% (Extremamente Baixa)</li>
                                    </ul>
                                </div>
                            </div>
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING SIDE MENU TOGGLE BUTTON (BOTTOM RIGHT) */}
            {phase === 'SELECT' && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        AudioManager.getInstance().playSFX('click');
                        setIsBannerMenuOpen(prev => !prev);
                    }}
                    className={`
                        fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 rounded-2xl border-2 backdrop-blur-2xl shadow-2xl transition-all cursor-pointer group
                        ${isBannerMenuOpen 
                            ? 'bg-red-600 border-red-400 text-white shadow-red-600/30' 
                            : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 border-orange-300/60 text-white shadow-orange-600/40 hover:brightness-110'
                        }
                    `}
                >
                    <div className={`p-1 rounded-lg transition-transform ${isBannerMenuOpen ? 'rotate-90 bg-red-700' : 'bg-orange-700/50 group-hover:rotate-12'}`}>
                        {isBannerMenuOpen ? <X size={20} /> : <Layers size={22} />}
                    </div>
                    <span className="font-black italic uppercase tracking-[0.2em] text-xs md:text-sm drop-shadow-md">
                        {isBannerMenuOpen ? 'FECHAR MENU' : 'MENU BANNERS'}
                    </span>
                </motion.button>
            )}

            {/* BACKDROP & SIDEBAR DRAWER OVERLAY */}
            <AnimatePresence>
                {isBannerMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                AudioManager.getInstance().playSFX('cancel');
                                setIsBannerMenuOpen(false);
                            }}
                            className="fixed inset-0 z-40 bg-stone-950/80 backdrop-blur-xs cursor-pointer"
                        />
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed inset-y-0 left-0 z-50 bg-stone-950/95 border-r border-white/10 backdrop-blur-2xl flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.9)] w-[88vw] sm:w-[360px] md:w-[420px] p-5 pt-8"
                        >
                            {/* Header of Banner Lateral Drawer */}
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
                                        <Layers size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-black italic uppercase tracking-[0.15em] text-white text-base md:text-lg">
                                            MENU DE BANNERS
                                        </h3>
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                            SELECIONE O BANNER DESEJADO
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        AudioManager.getInstance().playSFX('cancel');
                                        setIsBannerMenuOpen(false);
                                    }}
                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-stone-400 hover:text-white transition-all cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Banners List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-2.5">
                                {BANNERS.map((banner, i) => {
                                    const isSelected = activeBannerIdx === i;
                                    const isItemBanner = banner.id === 'rare_items';
                                    const IconComponent = isItemBanner ? Backpack : (banner.id === 'eternal_characters' ? Sparkles : Star);

                                    return (
                                        <motion.button
                                            key={banner.id}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setActiveBannerIdx(i);
                                                setIsBannerMenuOpen(false);
                                                AudioManager.getInstance().playSFX('click');
                                            }}
                                            className={`
                                                relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group text-left overflow-hidden
                                                ${isSelected 
                                                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 border-orange-300 text-white font-black italic shadow-lg shadow-orange-950/40' 
                                                    : 'bg-stone-900/70 border-white/5 text-stone-300 hover:bg-stone-800/80 hover:border-orange-500/40 hover:text-white'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3.5 relative z-10">
                                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-black/30 text-white' : 'bg-stone-950 text-orange-400 group-hover:text-white'}`}>
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs md:text-sm uppercase tracking-[0.15em] font-black truncate">{banner.title}</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-stone-100' : 'text-stone-500'}`}>{banner.type}</span>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] relative z-10" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
