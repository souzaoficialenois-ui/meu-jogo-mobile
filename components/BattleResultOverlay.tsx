import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, LogOut, Users, Trophy, Coins, Gem, Award, ChevronRight, Flame } from 'lucide-react';
import { RESOURCE_SPRITES } from '../constants';
import { CpuStreakManager } from '../services/CpuStreakManager';

interface BattleResultOverlayProps {
  isVisible: boolean;
  resultText: string;
  resultType?: 'WIN' | 'LOSE' | 'DRAW';
  earnedCoins?: number;
  earnedGems?: number;
  unlockedCharName?: string;
  gameMode?: string;
  isSurvivalNext?: boolean;
  survivalWave?: number;
  isTournament?: boolean;
  onRematch?: () => void;
  onNextMatch?: () => void;
  onCharacterSelect?: () => void;
  onMainMenu?: () => void;
  isPt?: boolean;
}

export const BattleResultOverlay: React.FC<BattleResultOverlayProps> = ({
  isVisible,
  resultText,
  resultType = 'WIN',
  earnedCoins = 0,
  earnedGems = 0,
  unlockedCharName,
  gameMode,
  isSurvivalNext = false,
  survivalWave = 1,
  isTournament = false,
  onRematch,
  onNextMatch,
  onCharacterSelect,
  onMainMenu,
  isPt = true
}) => {
  const isWin = resultType === 'WIN';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="battle-result-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 z-[120] flex flex-col items-center justify-center select-none overflow-hidden p-4"
        >
          {/* Subtle Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Radial Light Burst Background */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: [0.3, 1.8, 1.4], opacity: [0, 0.85, 0.6], rotate: 0 }}
            exit={{ scale: 2.0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none ${
              isWin
                ? 'bg-gradient-to-r from-amber-400/60 via-yellow-300/80 to-orange-500/60'
                : 'bg-gradient-to-r from-red-600/70 via-rose-500/80 to-red-800/70'
            }`}
          />

          {/* Energy Rays Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.9, 0.5], scale: [0.5, 1.3, 1.1], rotate: [0, 45] }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
            className={`absolute w-[800px] h-[200px] blur-2xl rounded-full pointer-events-none ${
              isWin ? 'bg-yellow-400/40' : 'bg-red-600/40'
            }`}
          />

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0, y: 30 }}
            animate={{ scale: [0.2, 1.15, 1.0], opacity: [0, 1, 1], y: [30, -10, 0] }}
            exit={{ scale: 1.15, opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.175, 0.885, 0.32, 1.275]
            }}
            className="relative z-20 flex flex-col items-center justify-center max-w-xl w-full px-6 py-6 rounded-3xl bg-stone-950/90 border border-white/10 shadow-2xl backdrop-blur-md"
          >
            {/* Ambient Glow */}
            <motion.div
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute inset-0 rounded-3xl blur-xl pointer-events-none ${
                isWin
                  ? 'bg-gradient-to-r from-yellow-500/20 via-amber-400/30 to-orange-500/20'
                  : 'bg-gradient-to-r from-red-600/20 via-rose-500/30 to-red-800/20'
              }`}
            />

            {/* Localized Result Header Title */}
            <motion.h1
              animate={{
                textShadow: isWin
                  ? [
                      "0 0 20px rgba(250, 204, 21, 0.9), 0 0 40px rgba(234, 179, 8, 0.8)",
                      "0 0 35px rgba(250, 204, 21, 1.0), 0 0 70px rgba(234, 179, 8, 1.0)",
                      "0 0 20px rgba(250, 204, 21, 0.9), 0 0 40px rgba(234, 179, 8, 0.8)"
                    ]
                  : [
                      "0 0 20px rgba(239, 68, 68, 0.9), 0 0 40px rgba(220, 38, 38, 0.8)",
                      "0 0 35px rgba(239, 68, 68, 1.0), 0 0 70px rgba(220, 38, 38, 1.0)",
                      "0 0 20px rgba(239, 68, 68, 0.9), 0 0 40px rgba(220, 38, 38, 0.8)"
                    ]
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className={`relative z-30 text-5xl sm:text-6xl md:text-7xl font-black italic tracking-widest uppercase text-center font-sans ${
                isWin
                  ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]'
                  : 'text-transparent bg-clip-text bg-gradient-to-b from-red-100 via-rose-400 to-red-700 drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]'
              }`}
            >
              {resultText}
            </motion.h1>

            {/* Sparkle decorative line */}
            <div className={`w-3/4 h-1 my-3 rounded-full ${
              isWin
                ? 'bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_15px_#fde047]'
                : 'bg-gradient-to-r from-transparent via-red-400 to-transparent shadow-[0_0_15px_#f87171]'
            }`} />

            {/* REWARDS CARD IF APPLICABLE */}
            {(earnedCoins > 0 || earnedGems > 0 || unlockedCharName) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-stone-900/80 border border-white/10 rounded-2xl p-3 my-3 flex flex-wrap items-center justify-center gap-4 text-center z-30"
              >
                {earnedCoins > 0 && (
                  <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <img src={RESOURCE_SPRITES.coin} alt="Coins" className="w-5 h-5 object-contain" />
                    <span className="font-black text-amber-300 text-sm">+{earnedCoins} {isPt ? 'MOEDAS' : 'COINS'}</span>
                  </div>
                )}

                {earnedGems > 0 && (
                  <div className="flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
                    <Gem size={18} className="text-cyan-400 animate-pulse" />
                    <span className="font-black text-cyan-300 text-sm">+{earnedGems} {isPt ? 'GEMAS' : 'GEMS'}</span>
                  </div>
                )}

                {unlockedCharName && (
                  <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-xl w-full justify-center">
                    <Award size={18} className="text-purple-400" />
                    <span className="font-black text-purple-200 text-xs uppercase tracking-wider">
                      {isPt ? 'NOVO PERSONAGEM:' : 'UNLOCKED:'} <span className="text-yellow-400">{unlockedCharName}</span>
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ADAPTIVE AI / STREAK BADGE */}
            {CpuStreakManager.getStreak() > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-950/80 via-red-950/80 to-stone-900/90 border border-orange-500/40 px-4 py-2 rounded-xl my-2 shadow-lg shadow-orange-950/50 text-center z-30"
              >
                <Flame className="w-4 h-4 text-orange-400 animate-bounce shrink-0" />
                <span className="font-extrabold text-orange-200 text-xs uppercase tracking-wider">
                  {isPt
                    ? `I.A. ADAPTATIVA: ${CpuStreakManager.getStreak()}x Vitórias (+${Math.round((CpuStreakManager.getAggressivenessMultiplier() - 1) * 100)}% Agressividade)`
                    : `ADAPTIVE AI: ${CpuStreakManager.getStreak()}x Win Streak (+${Math.round((CpuStreakManager.getAggressivenessMultiplier() - 1) * 100)}% Aggression)`}
                </span>
              </motion.div>
            )}

            {/* ACTION BUTTONS */}
            <div className="relative z-30 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full mt-4 pointer-events-auto">
              {/* Next Match or Tournament or Survival Advance Button */}
              {isSurvivalNext && onNextMatch && (
                <button
                  onClick={onNextMatch}
                  className="w-full sm:w-auto flex-1 min-w-[160px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 border border-emerald-300/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ChevronRight size={16} />
                  <span>{isPt ? `PRÓXIMA ONDA (${survivalWave})` : `NEXT WAVE (${survivalWave})`}</span>
                </button>
              )}

              {isTournament && onNextMatch && (
                <button
                  onClick={onNextMatch}
                  className="w-full sm:w-auto flex-1 min-w-[160px] px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 border border-amber-300/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trophy size={16} />
                  <span>{isPt ? 'CONTINUAR TORNEIO' : 'CONTINUE TOURNAMENT'}</span>
                </button>
              )}

              {/* Standard Rematch Button */}
              {!isSurvivalNext && !isTournament && onRematch && (
                <button
                  onClick={onRematch}
                  className="w-full sm:w-auto flex-1 min-w-[150px] px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 border border-orange-300/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RotateCcw size={16} />
                  <span>{isPt ? 'JOGAR NOVAMENTE' : 'REMATCH'}</span>
                </button>
              )}

              {/* Character Select Button */}
              {onCharacterSelect && gameMode !== 'STORY' && gameMode !== 'SURVIVAL' && !isTournament && (
                <button
                  onClick={onCharacterSelect}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-900 border border-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Users size={16} />
                  <span>{isPt ? 'PERSONAGENS' : 'CHARACTERS'}</span>
                </button>
              )}

              {/* Main Menu / Story Menu Button */}
              {onMainMenu && (
                <button
                  onClick={onMainMenu}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-stone-900 border border-white/10 hover:border-red-500/50 text-stone-300 hover:text-red-400 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut size={16} />
                  <span>{gameMode === 'STORY' ? (isPt ? 'MODO HISTÓRIA' : 'STORY MENU') : (isPt ? 'MENU PRINCIPAL' : 'MAIN MENU')}</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
