import React from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { Leaderboard } from '../Leaderboard';

export const HallOfFameScreen: React.FC = () => {
  const { changeScene, settings } = useSceneManager();
  const isPt = settings?.language === 'pt';

  const handleBack = () => {
    AudioManager.getInstance().playSFX('back');
    changeScene(SceneName.MAIN_MENU);
  };

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img src="/Assets/fundosdastelas/modos/m7.png" alt="" className="w-full h-full object-cover opacity-20 filter blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/80 to-stone-950" />
      </div>

      <motion.header 
        initial={{ y: -60 }} animate={{ y: 0 }}
        className="h-20 sm:h-24 px-6 sm:px-10 flex items-center justify-between relative z-50 bg-stone-950/80 border-b border-stone-800 backdrop-blur-xl shrink-0"
      >
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={handleBack} 
            className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-900/80 hover:bg-orange-500/10 flex items-center justify-center border border-stone-800 rounded-2xl group transition-all cursor-pointer hover:border-orange-500/40"
          >
            <ArrowLeft className="w-6 h-6 text-stone-400 group-hover:text-orange-500 transition-colors" />
          </button>
          <div className="flex flex-col">
            <span className="text-orange-500/90 font-black tracking-[0.3em] uppercase text-[10px] flex items-center gap-1">
              <Trophy size={12} className="text-amber-400" />
              {isPt ? 'TEMPORADAS & LENDAS' : 'SEASONS & LEGENDS'}
            </span>
            <h2 className="text-xl sm:text-3xl font-black italic uppercase tracking-wider text-white">
              {isPt ? 'HALL DA FAMA GLOBAL' : 'GLOBAL HALL OF FAME'}
            </h2>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 z-10 overflow-hidden flex flex-col">
        <Leaderboard showTitle={false} className="flex-1" />
      </main>
    </div>
  );
};

