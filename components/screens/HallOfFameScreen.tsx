import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  Crown,
  Medal,
  Flame,
  History
} from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { BASE_CHARACTERS, AVATAR_LIST } from '../../personagens/CharacterDatabase';
import { RankService } from '../../services/RankService';
import { useUI } from '../../contexts/UIContext';

// Helper to resolve player avatar URL
const getPlayerAvatar = (avatarId: string, name: string): string => {
  const found = AVATAR_LIST.find(a => a.id === avatarId);
  if (found) return found.url;
  return "/Assets/UI/avatar_placeholder.png";
};

const getCharacterPortrait = (charId: string) => {
  const char = BASE_CHARACTERS.find(c => c.id === charId);
  return char?.spriteConfig?.portraitUrl || '';
};

const getCharacterName = (charId: string) => {
  const char = BASE_CHARACTERS.find(c => c.id === charId);
  return char?.name || '';
};

export const HallOfFameScreen: React.FC = () => {
  const { s, sx, sy, getPos } = useUI();
  const { 
    changeScene, 
    playerProfile, 
    settings,
    t
  } = useSceneManager();
  const isPt = settings?.language === 'pt';
  
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = RankService.listenToLeaderboard((data) => {
      setLeaderboard(data);
      setLoading(false);
    }, 100);

    return () => unsubscribe();
  }, []);

  const handleBack = () => {
    AudioManager.getInstance().playSFX('back');
    changeScene(SceneName.MAIN_MENU);
  };

  const renderPodiumCard = (player: any | null, rank: 1 | 2 | 3) => {
    if (!player) {
      return (
        <div 
          className={`relative flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-sm opacity-20`}
          style={{ height: rank === 1 ? '460px' : rank === 2 ? '400px' : '380px' }}
        >
          <Trophy size={48} className="text-stone-700" />
          <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-stone-600">#{rank} Awaiting</span>
        </div>
      );
    }

    const portrait = player.topCharacterId ? getCharacterPortrait(player.topCharacterId) : getPlayerAvatar(player.avatarId, player.name);
    const mainCharName = player.topCharacterId ? getCharacterName(player.topCharacterId) : '';
    const avatarUrl = getPlayerAvatar(player.avatarId, player.name);
    const isMe = playerProfile && player.userId === playerProfile.playerId;

    const rankInfo = RankService.getRankFromPoints(player.points);

    const config = {
      1: {
        borderColor: 'border-orange-500/40',
        bg: 'bg-orange-500/10',
        height: '460px',
        icon: <Crown className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" size={36} />,
        label: isPt ? 'CAMPEÃO' : 'CHAMPION'
      },
      2: {
        borderColor: 'border-stone-300/30',
        bg: 'bg-stone-300/5',
        height: '400px',
        icon: <Medal className="text-stone-300 drop-shadow-[0_0_10px_rgba(214,211,209,0.4)]" size={32} />,
        label: isPt ? 'DESAFIANTE' : 'CHALLENGER'
      },
      3: {
        borderColor: 'border-orange-900/30',
        bg: 'bg-orange-900/5',
        height: '380px',
        icon: <Medal className="text-orange-900 drop-shadow-[0_0_10px_rgba(124,45,18,0.4)]" size={28} />,
        label: isPt ? 'GUERREIRO' : 'WARRIOR'
      }
    }[rank];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        onClick={() => setSelectedPlayer(player)}
        className={`relative flex flex-col justify-between rounded-[2.5rem] border ${config.borderColor} ${config.bg} backdrop-blur-md transition-all cursor-pointer group shadow-2xl overflow-hidden hover:-translate-y-2`}
        style={{ height: config.height }}
      >
        <div className={`absolute inset-0 opacity-10 blur-[80px] pointer-events-none rounded-full ${rank === 1 ? 'bg-orange-500' : 'bg-white'}`} />
        
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
          <div className="flex items-center gap-2">
            {config.icon}
          </div>
          <span className="text-[9px] font-black tracking-[0.4em] text-stone-500 uppercase">{config.label}</span>
        </div>

        <div className="flex-1 flex items-center justify-center relative mt-16 px-4">
          <img
            src={portrait}
            alt={player.name}
            className={`relative z-10 w-auto h-full max-h-[75%] object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-700`}
          />
          {mainCharName && (
            <div className="absolute bottom-4 bg-black/70 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              {mainCharName}
            </div>
          )}
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5 relative z-10 backdrop-blur-lg">
          <div className="flex items-center gap-4 mb-5">
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-2xl bg-stone-950 border border-white/10 shadow-lg" />
            <div className="flex flex-col">
              {player.title && (
                <span className="text-[8px] text-orange-500/80 font-black uppercase tracking-[0.2em] mb-1">{player.title}</span>
              )}
              <h3 className={`text-xl font-black italic uppercase tracking-tighter leading-none ${isMe ? 'text-orange-500' : 'text-white'}`}>
                {player.name}
                {isMe && <span className="ml-2 text-[8px] bg-orange-500 text-black px-2 py-0.5 rounded italic">YOU</span>}
              </h3>
              <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest mt-2">
                {t(`rank_${rankInfo.tier.toLowerCase()}`)} {rankInfo.subRank}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest mb-1">{isPt ? 'WIN RATE' : 'WIN RATE'}</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-mono font-black text-emerald-500/90">{player.winRate}%</span>
                {player.winStreak >= 3 && (
                  <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    <Flame size={8} className="text-orange-500" />
                    <span className="text-[8px] font-black text-orange-500">{player.winStreak}W</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest mb-1">{isPt ? 'PONTOS RP' : 'RP POINTS'}</span>
              <span className="text-2xl font-mono font-black text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">{player.points}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;
  const remainingLeaderboard = leaderboard.slice(3);

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img src="/Assets/fundosdastelas/modos/m7.png" alt="" className="w-full h-full object-cover opacity-20 filter blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/80 to-stone-950" />
      </div>

      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="h-28 px-12 flex items-center justify-between relative z-50 bg-stone-950/40 border-b border-white/5 backdrop-blur-xl"
      >
        <div className="flex items-center gap-10">
          <button 
            onClick={handleBack} 
            className="w-16 h-16 bg-stone-900/40 hover:bg-orange-500/10 flex items-center justify-center border border-white/5 rounded-2xl group transition-all cursor-pointer hover:border-orange-500/20"
          >
            <ArrowLeft className="w-8 h-8 text-stone-400 group-hover:text-orange-500 transition-colors" />
          </button>
          <div className="flex flex-col">
            <span className="text-orange-500/70 font-black tracking-[0.5em] uppercase text-[10px] mb-1">{isPt ? 'HALL DA FAMA' : 'HALL OF FAME'}</span>
            <h2 className="text-5xl font-black italic uppercase tracking-widest text-white">{isPt ? 'RANKING GLOBAL' : 'GLOBAL RANKING'}</h2>
          </div>
        </div>

        <div className="flex items-center bg-stone-900/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => { setActiveTab('current'); AudioManager.getInstance().playSFX('navigation'); }}
            className={`px-8 py-3 rounded-xl flex items-center gap-3 transition-all text-xs font-black uppercase tracking-widest ${activeTab === 'current' ? 'bg-orange-500 text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <TrendingUp size={16} />
            {isPt ? 'ATUAL' : 'CURRENT'}
          </button>
          <button 
            onClick={() => { setActiveTab('history'); AudioManager.getInstance().playSFX('navigation'); }}
            className={`px-8 py-3 rounded-xl flex items-center gap-3 transition-all text-xs font-black uppercase tracking-widest ${activeTab === 'history' ? 'bg-orange-500 text-white shadow-xl' : 'text-stone-500 hover:text-stone-300'}`}
          >
            <History size={16} />
            {isPt ? 'LEGADO' : 'LEGACY'}
          </button>
        </div>
      </motion.header>

      <main className="flex-1 w-full flex flex-col overflow-y-auto custom-scrollbar p-12 z-10 gap-12">
        <AnimatePresence mode="wait">
          {activeTab === 'current' ? (
            <motion.div 
              key="current"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-7xl mx-auto space-y-12"
            >
              {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-6 opacity-40">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isPt ? 'CONECTANDO AO RANKING...' : 'SYNCING RANKINGS...'}</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end py-10 px-4">
                    <div className="order-2 md:order-1">{renderPodiumCard(top2, 2)}</div>
                    <div className="order-1 md:order-2">{renderPodiumCard(top1, 1)}</div>
                    <div className="order-3 md:order-3">{renderPodiumCard(top3, 3)}</div>
                  </div>

                  <div className="bg-stone-900/20 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 shadow-lg">
                        <Users size={24} />
                      </div>
                      <h3 className="text-3xl font-black italic uppercase tracking-widest text-white">{isPt ? 'TOP 100 MUNDIAL' : 'TOP 100 WORLD'}</h3>
                    </div>

                    <div className="space-y-4">
                      {remainingLeaderboard.map((player, idx) => {
                        const rankInfo = RankService.getRankFromPoints(player.points);
                        const isMe = playerProfile && player.userId === playerProfile.playerId;
                        const uniqueKey = player.userId || `rank-${idx + 4}-${player.name}`;
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={uniqueKey} 
                            onClick={() => setSelectedPlayer(player)}
                            className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all cursor-pointer group ${isMe ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'}`}
                          >
                            <div className="flex items-center gap-8">
                              <span className="w-12 text-center font-mono font-black text-xl text-stone-500 group-hover:text-orange-500 transition-colors">#{idx + 4}</span>
                              <div className="w-14 h-14 bg-stone-950 rounded-2xl border border-white/10 overflow-hidden relative shadow-inner">
                                <img src={getPlayerAvatar(player.avatarId, player.name)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col">
                                {player.title && (
                                  <span className="text-[8px] text-orange-500/60 font-black uppercase tracking-widest mb-1">{player.title}</span>
                                ) }
                                <span className={`text-lg font-black uppercase tracking-wide italic leading-none ${isMe ? 'text-orange-500' : 'text-white'}`}>{player.name}</span>
                                <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.2em] mt-1">{t(`rank_${rankInfo.tier.toLowerCase()}`)} {rankInfo.subRank}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-12">
                              <div className="hidden md:flex flex-col items-center px-6 border-x border-white/5">
                                <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest mb-1">{isPt ? 'W RATE' : 'W RATE'}</span>
                                <span className="font-mono font-black text-emerald-500/80">{player.winRate}%</span>
                              </div>
                              <div className="flex flex-col items-end min-w-[80px]">
                                <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest mb-1">{isPt ? 'PONTOS' : 'POINTS'}</span>
                                <span className="text-2xl font-mono font-black text-orange-500">{player.points}</span>
                              </div>
                              <ChevronRight className="text-stone-700 group-hover:text-orange-500 transition-colors" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20 gap-6">
                  <History size={80} />
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase tracking-[0.5em]">{isPt ? 'NENHUM REGISTRO HISTÓRICO' : 'NO HISTORICAL RECORDS'}</span>
                    <p className="mt-2 text-[10px] font-medium opacity-60">{isPt ? 'A primeira temporada ainda está em andamento.' : 'The first season is still in progress.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-stone-950/95 backdrop-blur-md"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-2xl bg-stone-900 border border-white/10 rounded-[4rem] p-14 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-10 group">
                  <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full group-hover:bg-orange-500/30 transition-all duration-700" />
                  <img 
                    src={selectedPlayer.topCharacterId ? getCharacterPortrait(selectedPlayer.topCharacterId) : getPlayerAvatar(selectedPlayer.avatarId, selectedPlayer.name)} 
                    alt="" 
                    className="relative z-10 h-72 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" 
                  />
                </div>

                <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">{selectedPlayer.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="px-6 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 font-black uppercase tracking-[0.3em] text-[10px]">
                    {t(`rank_${RankService.getRankFromPoints(selectedPlayer.points).tier.toLowerCase()}`)} {RankService.getRankFromPoints(selectedPlayer.points).subRank}
                  </span>
                  {selectedPlayer.winStreak >= 3 && (
                    <span className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
                      <Flame size={12} />
                      {selectedPlayer.winStreak} WINS STREAK
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-6 w-full mt-14">
                  <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2rem] border border-white/5">
                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-2">WIN RATE</span>
                    <span className="text-4xl font-mono font-black text-emerald-500">{selectedPlayer.winRate}%</span>
                  </div>
                  <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2rem] border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-2">POINTS</span>
                    <span className="text-4xl font-mono font-black text-orange-500">{selectedPlayer.points}</span>
                  </div>
                  <div className="flex flex-col items-center p-8 bg-white/5 rounded-[2rem] border border-white/5">
                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-2">UPDATED</span>
                    <span className="text-xs font-black text-white/60">{new Date(selectedPlayer.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="mt-14 px-16 py-5 bg-stone-800 hover:bg-stone-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95"
                >
                  {isPt ? 'FECHAR REGISTRO' : 'CLOSE RECORD'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
