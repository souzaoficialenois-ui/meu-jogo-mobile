
import React from 'react';
import { Trophy, Rocket, Shield, Activity, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchmakingTabProps {
    isSearching: boolean;
    startMatchmaking: () => void;
    cancelMatchmaking: () => void;
    matchmakingTimer: number;
    matchmakingStatus: string;
    playerProfile: any;
    errorMsg: string | null;
    playSFX: (id: string) => void;
    t: (key: string) => string;
}

export const MatchmakingTab: React.FC<MatchmakingTabProps> = ({
    isSearching,
    startMatchmaking,
    cancelMatchmaking,
    matchmakingTimer,
    matchmakingStatus,
    playerProfile,
    errorMsg,
    playSFX,
    t
}) => {
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full flex flex-col items-center justify-center space-y-10 pb-20 animate-in fade-in duration-700">
            <AnimatePresence mode="wait">
                {!isSearching ? (
                    <motion.div 
                        key="start"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="max-w-xl w-full flex flex-col items-center text-center space-y-10"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-orange-600 blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />
                            <img 
                                src="/Assets/ui/logo/logojogo.png" 
                                alt="Game Logo" 
                                className="w-64 h-auto relative z-10 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform duration-700"
                                referrerPolicy="no-referrer"
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter drop-shadow-2xl">PARTIDA RANQUEADA</h2>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-lg">
                            <div className="flex-1 w-full bg-stone-900/10 backdrop-blur-md p-6 rounded-3xl border border-white/5 text-left relative overflow-hidden group/rank">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                <span className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em] block mb-2">SEU RANKING ATUAL</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-stone-950 flex items-center justify-center border border-white/5">
                                        <Shield size={20} className="text-orange-500" />
                                    </div>
                                    <span className="text-2xl font-black italic text-white uppercase tracking-wider">
                                        {t(`rank_${(playerProfile?.ranked?.br?.tier || 'APPRENTICE').toLowerCase()}`)} <span className="text-orange-500">{playerProfile?.ranked?.br?.subRank || 'V'}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 w-full bg-stone-900/10 backdrop-blur-md p-6 rounded-3xl border border-white/5 text-left relative overflow-hidden group/wins">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                <span className="text-[9px] font-black text-stone-600 uppercase tracking-[0.2em] block mb-2">HISTÓRICO DE VITÓRIAS</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-stone-950 flex items-center justify-center border border-white/5">
                                        <Trophy size={20} className="text-green-500" />
                                    </div>
                                    <span className="text-2xl font-black italic text-white uppercase tracking-wider">{playerProfile?.wins || 0}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => { playSFX('confirm'); startMatchmaking(); }}
                            className="w-full max-w-sm py-8 bg-orange-600 hover:bg-orange-500 text-black font-black italic uppercase tracking-[0.4em] rounded-[32px] shadow-2xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            <Rocket size={24} className="relative z-10 group-hover:rotate-12 transition-transform" />
                            <span className="relative z-10 text-lg">BUSCAR OPONENTE</span>
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="searching"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-md w-full bg-stone-900/10 backdrop-blur-3xl border border-white/5 p-12 rounded-[48px] text-center space-y-10 relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-stone-800">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_10px_#f97316]"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                style={{ width: '40%' }}
                            />
                        </div>

                        <div className="flex flex-col items-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 border-2 border-orange-500/10 rounded-full animate-ping [animation-duration:3s]" />
                                <div className="absolute inset-[-20px] border border-orange-500/5 rounded-full animate-ping [animation-duration:4s]" />
                                <div className="w-32 h-32 rounded-full bg-stone-950 border border-orange-500/20 flex items-center justify-center relative overflow-hidden">
                                    <Activity className="text-orange-500 animate-pulse" size={40} strokeWidth={1.5} />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)]" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <span className="text-5xl font-black italic text-white font-mono tracking-tighter drop-shadow-xl">{formatTime(matchmakingTimer)}</span>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                                </div>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] italic">BUSCANDO GUERREIRO...</p>
                            </div>
                        </div>

                        <div className="bg-stone-950/60 p-6 rounded-3xl border border-white/5 relative overflow-hidden group/status">
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-900/50 to-transparent opacity-50" />
                            <p className="relative z-10 text-[9px] font-black text-stone-500 uppercase tracking-[0.2em] leading-relaxed italic">
                                {matchmakingStatus}
                            </p>
                        </div>

                        <button 
                            onClick={() => { playSFX('cancel'); cancelMatchmaking(); }}
                            className="flex items-center gap-3 mx-auto text-stone-700 hover:text-red-500 font-black uppercase tracking-[0.3em] text-[9px] transition-all hover:scale-105 active:scale-95 group/cancel"
                        >
                            <div className="w-8 h-8 rounded-lg bg-stone-900/20 flex items-center justify-center border border-white/5 group-hover/cancel:border-red-500/20 transition-colors">
                                <X size={14} />
                            </div>
                            CANCELAR BUSCA
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
