
import React, { useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, BattlePassTier } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { BATTLE_PASS_LEVELS } from '../../constants/BattlePassDatabase';
import { RESOURCE_SPRITES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { KiParticles } from '../KiParticles';
import { 
    ChevronLeft, 
    Lock, 
    CheckCircle2, 
    CircleDollarSign, 
    Star, 
    Crown, 
    Flame, 
    Sparkles, 
    UserCircle2,
    Trophy
} from 'lucide-react';

export const StrikePassScreen: React.FC = () => {
    const { changeScene, battlePass, claimPassReward, buyBattlePass, gems, t, settings } = useSceneManager();
    const isPt = settings.language === 'pt';
    
    const getTierIcon = (tier: BattlePassTier) => {
        switch (tier) {
            case 'FREE': return <UserCircle2 size={16} className="text-stone-500" />;
            case 'ELITE': return <Star size={16} className="text-yellow-500" />;
            case 'PREMIUM': return <Crown size={16} className="text-orange-500" />;
        }
    };

    const getTierColor = (tier: BattlePassTier) => {
        switch (tier) {
            case 'FREE': return 'text-stone-500';
            case 'ELITE': return 'text-yellow-500';
            case 'PREMIUM': return 'text-orange-500';
        }
    };

    const currentXpTarget = BATTLE_PASS_LEVELS.find(l => l.level === battlePass.currentLevel)?.xpRequired || 1000;

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m8.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute left-[-5%] bottom-[-5%] opacity-30 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/goku/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <KiParticles color="gold" particleCount={25} speed={1.1} />

            {/* HEADER */}
            <motion.header className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0">
                <div className="flex items-center gap-3 md:gap-8">
                    <button 
                        onClick={() => { AudioManager.getInstance().playSFX('cancel'); changeScene(SceneName.MAIN_MENU); }}
                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                    </button>
                    <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                        {isPt ? 'STRIKE PASS' : 'STRIKE PASS'}
                    </h2>
                </div>
                
                <div className="flex flex-col items-end">
                    <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">{isPt ? 'PASSE ATUAL' : 'CURRENT PASS'}</span>
                    <div className="flex items-center gap-2 mt-1">
                        {getTierIcon(battlePass.tier)}
                        <span className={`text-[10px] md:text-sm font-black uppercase italic tracking-widest drop-shadow-lg ${getTierColor(battlePass.tier)}`}>
                            {battlePass.tier}
                        </span>
                    </div>
                </div>
            </motion.header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
                
                {/* SIDEBAR - Stats */}
                <motion.div className="flex flex-col gap-6 shrink-0 w-full md:w-80 z-20">
                    <div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all group">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        
                        <div className="flex flex-col gap-6 relative z-10">
                            <div>
                                <span className="text-[11px] font-black text-orange-600 uppercase tracking-[0.4em] pl-1 opacity-80">{isPt ? 'PROGRESSÃO' : 'PROGRESS'}</span>
                                <h3 className="text-white font-black text-3xl uppercase tracking-widest italic leading-none mt-2">
                                    NÍVEL {battlePass.currentLevel}
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                    <span>XP: {battlePass.currentXp}</span>
                                    <span>{currentXpTarget}</span>
                                </div>
                                <div className="h-2 bg-stone-950 border border-white/5 rounded-full overflow-hidden p-0.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(battlePass.currentXp / currentXpTarget) * 100}%` }}
                                        className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{isPt ? 'TEMPO RESTANTE' : 'TIME LEFT'}</span>
                                    <span className="text-xs font-black italic text-red-500 uppercase tracking-tight">14 DIAS</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{isPt ? 'SEUS GEMS' : 'YOUR GEMS'}</span>
                                    <div className="flex items-center gap-2">
                                        <CircleDollarSign className="text-yellow-500" size={14} />
                                        <span className="text-sm font-black text-white">{gems}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {battlePass.tier === 'FREE' && (
                            <button 
                                onClick={() => buyBattlePass('ELITE')}
                                className="w-full py-5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-black italic text-sm uppercase rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 border border-yellow-400/30"
                            >
                                <Star size={18} fill="currentColor" />
                                <span>ASSINAR ELITE</span>
                            </button>
                        )}
                        {battlePass.tier !== 'PREMIUM' && (
                            <button 
                                onClick={() => buyBattlePass('PREMIUM')}
                                className="w-full py-5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black italic text-sm uppercase rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 border border-orange-400/30"
                            >
                                <Crown size={18} fill="currentColor" />
                                <span>PREMIUM+</span>
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* TRACK */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-xs sm:text-sm font-black text-orange-500 tracking-[0.25em] bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 uppercase">
                            {isPt ? 'TRILHA DE RECOMPENSAS' : 'REWARD TRACK'}
                        </span>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-8 pb-10 select-none px-4">
                        {BATTLE_PASS_LEVELS.map((levelData, idx) => {
                            const isUnlocked = battlePass.currentLevel >= levelData.level;
                            return (
                                <div key={`sp-level-${levelData.level}-${idx}`} className="flex flex-col gap-6 shrink-0 pt-10">
                                    <RewardCard 
                                        reward={levelData.premiumReward} 
                                        tier="PREMIUM" 
                                        isUnlocked={isUnlocked && battlePass.tier === 'PREMIUM'} 
                                        isClaimed={battlePass.claimedRewards.includes(`${levelData.level}-PREMIUM`)}
                                        onClaim={() => claimPassReward(levelData.level, 'PREMIUM')}
                                    />
                                    <RewardCard 
                                        reward={levelData.eliteReward} 
                                        tier="ELITE" 
                                        isUnlocked={isUnlocked && (battlePass.tier === 'ELITE' || battlePass.tier === 'PREMIUM')} 
                                        isClaimed={battlePass.claimedRewards.includes(`${levelData.level}-ELITE`)}
                                        onClaim={() => claimPassReward(levelData.level, 'ELITE')}
                                    />
                                    <div className="relative flex items-center justify-center h-16 w-full">
                                        <div className={`w-14 h-14 flex items-center justify-center border-4 rounded-2xl rotate-45 transition-all z-10 shadow-2xl ${isUnlocked ? 'bg-orange-500 border-orange-400' : 'bg-stone-900 border-stone-800 text-stone-700'}`}>
                                            <span className="text-2xl font-black italic text-stone-100 rotate-[-45deg]">{levelData.level}</span>
                                        </div>
                                        {levelData.level < 50 && (
                                            <div className={`absolute left-1/2 w-48 h-1 -z-0 translate-x-7 ${isUnlocked ? 'bg-orange-500/30' : 'bg-stone-800/50'}`} />
                                        )}
                                    </div>
                                    <RewardCard 
                                        reward={levelData.freeReward} 
                                        tier="FREE" 
                                        isUnlocked={isUnlocked} 
                                        isClaimed={battlePass.claimedRewards.includes(`${levelData.level}-FREE`)}
                                        onClaim={() => claimPassReward(levelData.level, 'FREE')}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.5); }
            `}</style>
        </div>
    );
};

interface RewardCardProps {
    reward: any;
    tier: BattlePassTier;
    isUnlocked: boolean;
    isClaimed: boolean;
    onClaim: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, tier, isUnlocked, isClaimed, onClaim }) => {
    if (!reward) return <div className="w-40 h-32" />;

    const getTierGradient = () => {
        switch (tier) {
            case 'FREE': return 'from-stone-800 to-stone-900';
            case 'ELITE': return 'from-yellow-900/50 to-stone-900';
            case 'PREMIUM': return 'from-orange-900/50 to-stone-900';
        }
    };

    const getTierBorder = () => {
        if (!isUnlocked) return 'border-stone-800';
        switch (tier) {
            case 'FREE': return 'border-stone-600';
            case 'ELITE': return 'border-yellow-600';
            case 'PREMIUM': return 'border-orange-600';
        }
    };

    return (
        <motion.div 
            whileHover={isUnlocked && !isClaimed ? { scale: 1.05, y: tier === 'FREE' ? 5 : -5 } : {}}
            className={`
                w-40 h-32 rounded-xl border-2 flex flex-col relative overflow-hidden transition-all
                bg-gradient-to-br ${getTierGradient()} ${getTierBorder()}
                ${!isUnlocked ? 'opacity-50 grayscale' : ''}
                ${isClaimed ? 'opacity-40' : ''}
            `}
        >
            <div className="absolute inset-0 z-0 opacity-40">
                <RewardIconBackground type={reward.type} />
            </div>

            <div className="flex justify-between items-start mb-1 p-3 relative z-10">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-stone-500'}`}>{tier}</span>
                {isClaimed ? (
                    <CheckCircle2 size={12} className="text-green-500" />
                ) : !isUnlocked && (
                    <Lock size={12} className="text-stone-600" />
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <RewardIcon type={reward.type} amount={reward.amount} />
            </div>

            {isUnlocked && !isClaimed && (
                <button 
                    onClick={onClaim}
                    className="absolute bottom-2 left-2 right-2 z-20 bg-orange-500 text-white text-[10px] font-black py-1 rounded-md hover:bg-orange-600 transition-colors uppercase tracking-widest"
                >
                    RESGATAR
                </button>
            )}
        </motion.div>
    );
};

const RewardIconBackground = ({ type }: { type: string }) => {
    const getSrc = () => {
        switch (type) {
            case 'COIN': return RESOURCE_SPRITES.curr_coins;
            case 'GEM': return RESOURCE_SPRITES.curr_gems;
            case 'TICKET': return RESOURCE_SPRITES.curr_tickets;
            default: return null;
        }
    };

    const src = getSrc();
    if (!src) return <div className="w-full h-full bg-stone-900/50" />;
    return <img src={src} className="w-full h-full object-cover" alt="" />;
};

const RewardIcon = ({ type, amount }: { type: string, amount: number }) => {
    const getIcon = () => {
        switch (type) {
            case 'COIN': return <img src={RESOURCE_SPRITES.curr_coins} alt="COIN" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" draggable={false} />;
            case 'GEM': return <img src={RESOURCE_SPRITES.curr_gems} alt="GEM" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" draggable={false} />;
            case 'TICKET': return <img src={RESOURCE_SPRITES.curr_tickets} alt="TICKET" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" draggable={false} />;
            case 'XP': return <Flame size={20} className="text-red-500" />;
            case 'CHARACTER': return <UserCircle2 size={20} className="text-purple-500" />;
            default: return <Sparkles size={20} className="text-white" />;
        }
    };

    return (
        <div className="flex flex-col items-center">
            {getIcon()}
            <span className="text-xs font-black text-white">x{amount}</span>
        </div>
    );
};

