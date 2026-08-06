import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Award, Sparkles, X } from 'lucide-react';
import { RESOURCE_SPRITES } from '../../constants';

interface RewardToastModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    coins?: number;
    gems?: number;
    tokens?: number;
    tickets?: number;
}

export const RewardToastModal: React.FC<RewardToastModalProps> = ({
    isOpen,
    onClose,
    title = "RECOMPENSA DE VÍDEO RECEBIDA!",
    coins = 0,
    gems = 0,
    tokens = 0,
    tickets = 0
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 30 }}
                    className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-zinc-950 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden"
                >
                    {/* Glowing background aura */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Header Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/30 mb-4 flex items-center justify-center"
                    >
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                            <Sparkles className="w-10 h-10 animate-pulse" />
                        </div>
                    </motion.div>

                    <h3 className="text-xl font-black italic tracking-wide text-amber-400 uppercase mb-1">
                        {title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-medium">
                        Parabéns! Seus itens foram creditados instantaneamente.
                    </p>

                    {/* Item list */}
                    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 mb-6">
                        {coins > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-amber-500/20">
                                <div className="flex items-center gap-3">
                                    <img src={RESOURCE_SPRITES.curr_coins} alt="Ouro" className="w-7 h-7 object-contain" />
                                    <span className="font-bold text-slate-200 text-sm">Ouro / Moedas</span>
                                </div>
                                <span className="font-black text-amber-400 text-base">+{coins}</span>
                            </div>
                        )}

                        {gems > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-sky-500/20">
                                <div className="flex items-center gap-3">
                                    <img src={RESOURCE_SPRITES.curr_gems} alt="Gemas" className="w-7 h-7 object-contain" />
                                    <span className="font-bold text-slate-200 text-sm">Cristais de Evolução</span>
                                </div>
                                <span className="font-black text-sky-400 text-base">+{gems}</span>
                            </div>
                        )}

                        {tokens > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-orange-500/20">
                                <div className="flex items-center gap-3">
                                    <img src={RESOURCE_SPRITES.curr_room_tokens} alt="Token" className="w-7 h-7 object-contain" />
                                    <span className="font-bold text-slate-200 text-sm">Tokens de Sala</span>
                                </div>
                                <span className="font-black text-orange-400 text-base">+{tokens}</span>
                            </div>
                        )}

                        {tickets > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-rose-500/20">
                                <div className="flex items-center gap-3">
                                    <img src={RESOURCE_SPRITES.TICKET} alt="Ticket" className="w-7 h-7 object-contain" />
                                    <span className="font-bold text-slate-200 text-sm">Tickets de Convocação</span>
                                </div>
                                <span className="font-black text-rose-400 text-base">+{tickets}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>ENTENDIDO</span>
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
