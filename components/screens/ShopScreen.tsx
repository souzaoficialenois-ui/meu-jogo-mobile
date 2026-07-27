import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CharacterData, RarityTier } from '../../types';
import { BASE_CHARACTERS, SHOP_PRICES, RARITY_INFO, RESOURCE_SPRITES } from '../../constants';
import { AudioManager } from '../../services/AudioManager';
import { Shield, Activity, Sword, Key, Filter, ShoppingCart, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { KiParticles } from '../KiParticles';

const RARITY_COLORS: Record<RarityTier, { text: string, border: string, bg: string, glow: string }> = {
    COMMON: { text: 'text-stone-400', border: 'border-stone-500/30', bg: 'bg-stone-500/10', glow: '' },
    RARE: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    EPIC: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    LEGENDARY: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', glow: '' },
    ETERNAL: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-400/40' },
};

const ShopScreenContent: React.FC = () => {
    const { changeScene, coins, unlockedCharacters, buyCharacter, redeemCode } = useSceneManager();
    const { s } = useUI();
    
    const [selectedRarity, setSelectedRarity] = useState<RarityTier | 'ALL'>('ALL');
    const [previewCharId, setPreviewCharId] = useState<string | null>(null);
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [redeemInput, setRedeemInput] = useState('');
    const [redeemFeedback, setRedeemFeedback] = useState<{msg: string, success: boolean} | null>(null);

    const shopList = useMemo(() => {
        return BASE_CHARACTERS.filter(c => {
            if (c.id === 'random') return false;
            if (c.rarity === 'EPIC' || c.rarity === 'LEGENDARY') return false;
            if (selectedRarity !== 'ALL' && c.rarity !== selectedRarity) return false;
            return true;
        }).sort((a, b) => SHOP_PRICES[a.rarity] - SHOP_PRICES[b.rarity]);
    }, [selectedRarity]);

    const activePreviewId = previewCharId || (shopList.length > 0 ? shopList[0].id : null);
    const activePreviewChar = shopList.find(c => c.id === activePreviewId) || shopList[0];

    // Reset preview if selected rarity changes and current preview is not in list
    useEffect(() => {
        if (activePreviewChar && selectedRarity !== 'ALL' && activePreviewChar.rarity !== selectedRarity) {
            setPreviewCharId(null);
        }
    }, [selectedRarity, shopList, activePreviewChar]);

    const handleBuy = (char: CharacterData) => {
        const result = buyCharacter(char.id);
        if (result.success) {
            AudioManager.getInstance().playSFX('confirm');
        } else {
            AudioManager.getInstance().playSFX('cancel');
        }
    };

    const handleRedeem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!redeemInput.trim()) return;
        
        const result = redeemCode(redeemInput.trim().toUpperCase());
        setRedeemFeedback({ msg: result.message, success: result.success });
        
        if (result.success) {
            AudioManager.getInstance().playSFX('confirm');
            setTimeout(() => {
                setRedeemInput('');
                setIsRedeemOpen(false);
                setRedeemFeedback(null);
            }, 1500);
        } else {
            AudioManager.getInstance().playSFX('cancel');
            setTimeout(() => setRedeemFeedback(null), 3000);
        }
    };

    const FilterTab = ({ type, label }: { type: RarityTier | 'ALL', label: string }) => {
        const isActive = selectedRarity === type;
        const { s } = useUI();
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedRarity(type); AudioManager.getInstance().playSFX('click'); }}
                className={`
                    transition-all flex items-center justify-center font-black italic tracking-widest uppercase rounded-lg border cursor-pointer
                    ${isActive ? 'border-orange-500 text-stone-100 bg-orange-500/20 shadow-md shadow-orange-500/20' : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'}
                `}
                style={{ height: s(32), padding: `0 ${s(16)}px`, fontSize: s(10) }}
            >
                {label}
            </motion.button>
        );
    };

    const isOwned = activePreviewChar ? unlockedCharacters.some(u => u.id === activePreviewChar.id) : false;
    const price = activePreviewChar ? SHOP_PRICES[activePreviewChar.rarity] : 0;
    const canAfford = coins >= price;

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/fundobanner/b2.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>

            {/* Ki Particles */}
            <KiParticles color="orange" particleCount={25} speed={1.1} />

            {/* Background Texture Layers */}
            <div className="absolute inset-0 opacity-10 pointer-events-none z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
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
                        <img src={activePreviewChar.spriteConfig?.portraitUrl || undefined} className="w-full h-full object-cover object-[center_20%] mix-blend-luminosity grayscale-[40%] opacity-20 blur-sm scale-110" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-900 to-stone-900 mix-blend-color opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950/90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-transparent to-transparent opacity-80" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- TOP BAR --- */}
            <motion.header 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute top-0 left-0 right-0 px-4 md:px-10 flex items-center justify-between z-50 bg-stone-900 border-b border-white/10 backdrop-blur-sm pointer-events-auto"
                style={{ height: s(112), padding: `0 ${s(40)}px` }}
            >
                <button 
                    onClick={() => changeScene(SceneName.MAIN_MENU)}
                    className="rounded-full border-2 border-stone-600 flex items-center justify-center bg-stone-950/40 hover:border-orange-500 hover:bg-stone-800 text-stone-300 hover:text-white transition-all active:scale-95 shrink-0 group cursor-pointer"
                    style={{ width: s(80), height: s(80) }}
                >
                    <ChevronLeft style={{ width: s(40), height: s(40) }} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <h1 className="font-header italic uppercase tracking-wider text-white text-center absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col" style={{ fontSize: s(48) }}>
                    <span className="text-orange-500 tracking-[0.4em] block font-sans" style={{ fontSize: s(12), marginBottom: s(4) }}>MERCADO CLANDESTINO</span>
                    LOJA DE HERÓIS
                </h1>

                <div className="flex items-center bg-stone-900 border-2 border-stone-700 rounded-full" style={{ gap: s(16), padding: `${s(8)}px ${s(24)}px` }}>
                    <button 
                        onClick={() => setIsRedeemOpen(true)}
                        className="flex items-center font-black uppercase tracking-widest text-stone-400 hover:text-orange-500 transition-colors cursor-pointer"
                        style={{ gap: s(8), marginRight: s(8) }}
                    >
                        <Key style={{ width: s(16), height: s(16) }} />
                        <span className="inline" style={{ fontSize: s(14) }}>CÓDIGO</span>
                    </button>
                    <div className="bg-white/20" style={{ width: s(1), height: s(24) }} />
                    <div className="flex items-center" style={{ gap: s(8) }}>
                        <img 
                            src={RESOURCE_SPRITES.curr_coins} 
                            alt="" 
                            className="object-contain" 
                            style={{ width: s(24), height: s(24) }}
                            referrerPolicy="no-referrer"
                            draggable={false}
                        />
                        <span className="font-black italic text-white text-right" style={{ fontSize: s(20), minWidth: s(40) }}>{coins}</span>
                    </div>
                </div>
            </motion.header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 w-full flex overflow-hidden relative z-10" style={{ marginTop: s(144), marginBottom: s(32), padding: `0 ${s(40)}px`, gap: s(40) }}>
                
                {/* LEFT NAVIGATION: Roster Grid + Filters */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    className="flex flex-col overflow-hidden relative"
                    style={{ width: s(500), gap: s(16) }}
                >
                    
                    {/* Filters */}
                    <div className="flex flex-wrap" style={{ gap: s(8), paddingBottom: s(8) }}>
                        <FilterTab type="ALL" label="TODOS" />
                        <FilterTab type="COMMON" label="COMUM" />
                        <FilterTab type="RARE" label="RARO" />
                    </div>

                    {/* Roster Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: s(12) }}>
                            {shopList.map(char => {
                                const isPreview = activePreviewId === char.id;
                                const charIsOwned = unlockedCharacters.some(u => u.id === char.id);
                                const charPrice = SHOP_PRICES[char.rarity];
                                const isAffordable = coins >= charPrice;

                                return (
                                    <motion.button
                                        key={`shop-${char.id}`}
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
                                        <div className={`absolute inset-0 bg-gradient-to-t via-black/40 to-transparent ${charIsOwned ? 'from-black/80' : isPreview ? 'from-orange-950/90' : 'from-black/80'}`} />
                                        
                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur font-black italic uppercase tracking-widest text-white border border-stone-700" style={{ fontSize: s(8) }}>
                                            {char.rarity}
                                        </div>

                                        <div className="absolute bottom-0 inset-x-0 text-center pointer-events-none flex flex-col items-center" style={{ padding: s(8) }}>
                                            <span 
                                                className={`font-black italic uppercase tracking-wider block truncate w-full ${isPreview ? 'text-white' : 'text-stone-400'}`}
                                                style={{ fontSize: isPreview ? s(14) : s(12) }}
                                            >
                                                {char.name.split(' ')[0]}
                                            </span>
                                            {!charIsOwned && (
                                                <div className={`font-black italic flex items-center mt-0.5 ${isAffordable ? 'text-orange-400' : 'text-red-500'}`} style={{ fontSize: s(10), gap: s(4) }}>
                                                    <img 
                                                        src={RESOURCE_SPRITES.curr_coins} 
                                                        alt="" 
                                                        className="object-contain" 
                                                        style={{ width: s(14), height: s(14) }}
                                                        referrerPolicy="no-referrer"
                                                        draggable={false}
                                                    />
                                                    {charPrice}
                                                </div>
                                            )}
                                        </div>

                                        {charIsOwned && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 grayscale group-hover:grayscale-0 transition-all">
                                                <div className="bg-orange-600/80 backdrop-blur-sm p-2 rounded-full transform -rotate-12 border border-orange-400">
                                                    <Check style={{ width: s(24), height: s(24) }} className="text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT CONTENT: Glass Container */}
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                    className="flex-1 relative flex flex-col bg-stone-900 border border-stone-800 rounded-[2rem] overflow-hidden"
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
                                {/* Giant background text */}
                                <div className="absolute top-1/4 -right-10 opacity-[0.05] pointer-events-none transform -rotate-12 z-0">
                                    <h1 className="font-black italic uppercase leading-none" style={{ fontSize: s(200) }}>{activePreviewChar.name.split(' ')[0]}</h1>
                                </div>

                                {/* Huge Character Render Area */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none -z-10">
                                    <img src={activePreviewChar.spriteConfig?.portraitUrl || undefined} className="absolute -bottom-20 -right-20 h-[120%] object-contain origin-bottom-right" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                                </div>

                                {/* Header Info */}
                                <div className="relative z-10 flex items-center" style={{ gap: s(24), padding: `${s(32)}px ${s(40)}px` }}>
                                    <div className={`skew-x-[-15deg] ${RARITY_INFO[activePreviewChar.rarity].bg}`} style={{ padding: `${s(4)}px ${s(16)}px` }}>
                                        <span className={`skew-x-[15deg] block font-black italic ${RARITY_INFO[activePreviewChar.rarity].color}`} style={{ fontSize: s(14) }}>
                                            {activePreviewChar.rarity}
                                        </span>
                                    </div>
                                    <div className="flex" style={{ gap: s(8) }}>
                                        {activePreviewChar.tags?.map((tag) => (
                                            <span key={tag} className="bg-stone-800/80 rounded font-bold uppercase tracking-wider text-stone-300 border border-stone-700 backdrop-blur-sm" style={{ padding: `${s(4)}px ${s(8)}px`, fontSize: s(10) }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-10 flex-1 flex flex-col justify-center pointer-events-none" style={{ padding: `0 ${s(40)}px` }}>
                                    <h2 className="font-black italic uppercase tracking-tighter text-white leading-none" style={{ fontSize: s(90), marginBottom: s(24) }}>
                                        {activePreviewChar.name.split(' ').map((word, i) => (
                                            <span key={`${word}-${i}`} className={i === 0 ? 'text-orange-500' : 'text-white'}>
                                                {word}{' '}
                                            </span>
                                        ))}
                                    </h2>

                                    {/* Stats visualization removed as requested */}
                                </div>

                                {/* BOTTOM ACTION BAR inside Glass */}
                                <div className="mt-auto bg-stone-950/40 border-t border-stone-800 flex justify-between items-center z-10 pointer-events-auto" style={{ padding: `${s(32)}px ${s(40)}px` }}>
                                    <div className="text-stone-400 font-black italic tracking-widest flex items-center" style={{ gap: s(8) }}>
                                        <span style={{ fontSize: s(10) }} className="uppercase">CUSTO</span>
                                        <div className="flex items-center text-white" style={{ gap: s(4) }}>
                                            <img 
                                                src={RESOURCE_SPRITES.curr_coins} 
                                                alt="" 
                                                className="object-contain" 
                                                style={{ width: s(18), height: s(18) }}
                                                referrerPolicy="no-referrer"
                                                draggable={false}
                                            />
                                            <span style={{ fontSize: s(14) }}>{price}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center" style={{ gap: s(16) }}>
                                        {isOwned ? (
                                            <div className="bg-stone-800 border-2 border-stone-700 text-stone-400 transition-all uppercase font-black italic tracking-widest rounded-xl disabled:opacity-50 flex items-center" style={{ padding: `${s(16)}px ${s(32)}px`, gap: s(12), fontSize: s(14) }}>
                                                <Check style={{ width: s(20), height: s(20) }} />
                                                ADQUIRIDO
                                            </div>
                                        ) : (
                                            <motion.button 
                                                onClick={() => handleBuy(activePreviewChar)}
                                                whileHover={canAfford ? { scale: 1.05 } : {}}
                                                disabled={!canAfford}
                                                className={`transition-all uppercase font-black italic tracking-widest rounded-xl disabled:opacity-75 flex items-center ${canAfford ? 'bg-orange-600 hover:bg-orange-500 text-white ' : 'bg-red-950 border border-red-900 text-red-500 grayscale'}`}
                                                style={{ padding: `${s(16)}px ${s(32)}px`, gap: s(12), fontSize: s(14) }}
                                            >
                                                <span>{canAfford ? 'REQUISITAR' : 'FUNDOS INSUFICIENTES'}</span>
                                                {canAfford && <ShoppingCart style={{ width: s(20), height: s(20) }} className="fill-current" />}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Redeem Code Modal */}
            <AnimatePresence>
                {isRedeemOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4" 
                        onClick={() => setIsRedeemOpen(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full bg-stone-900 border border-orange-500/30 rounded-2xl relative"
                            style={{ maxWidth: s(448), padding: s(32) }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsRedeemOpen(false)} className="absolute text-stone-500 hover:text-white transition-colors" style={{ top: s(24), right: s(24) }}>
                                <X style={{ width: s(24), height: s(24) }} />
                            </button>
                            
                            <div style={{ marginBottom: s(32) }}>
                                <span className="text-orange-500 uppercase tracking-[0.3em] font-black italic block" style={{ fontSize: s(12), marginBottom: s(8) }}>OVERRIDE DE SISTEMA</span>
                                <h3 className="font-black italic uppercase text-white tracking-widest" style={{ fontSize: s(30) }}>RESGATAR CÓDIGO</h3>
                            </div>

                            <form onSubmit={handleRedeem} className="flex flex-col" style={{ gap: s(24) }}>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={redeemInput}
                                        onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                                        placeholder="INSIRA SEU CÓDIGO"
                                        className="w-full bg-stone-950/50 border-2 border-stone-800 rounded-xl text-stone-100 uppercase font-black tracking-widest focus:border-orange-500 focus: outline-none transition-all placeholder:text-stone-700"
                                        style={{ height: s(56), padding: `0 ${s(16)}px` }}
                                    />
                                    <div className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none text-orange-500/50" style={{ right: s(16) }}>
                                        <Key style={{ width: s(20), height: s(20) }} />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!redeemInput.trim()}
                                    className="w-full bg-orange-600 text-white hover:bg-orange-500 rounded-xl disabled:bg-stone-800 disabled:text-stone-600 font-black italic uppercase tracking-widest transition-all  disabled:shadow-none flex items-center justify-center"
                                    style={{ height: s(56), gap: s(12) }}
                                >
                                    <span>CONFIRMAR CÓDIGO</span>
                                    <ChevronRight style={{ width: s(20), height: s(20) }} />
                                </button>
                                
                                {redeemFeedback && (
                                    <motion.p 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`font-black uppercase tracking-widest text-center ${redeemFeedback.success ? 'text-orange-500' : 'text-red-500'}`}
                                        style={{ fontSize: s(14), marginTop: s(8) }}
                                    >
                                        {redeemFeedback.msg}
                                    </motion.p>
                                )}
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
            `}</style>
        </div>
    );
};

export const ShopScreen: React.FC = () => (
    <UIProvider>
        <ShopScreenContent />
    </UIProvider>
);


