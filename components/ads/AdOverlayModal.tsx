import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle2, Award, X, ExternalLink, Sparkles, Volume2, VolumeX, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AdManager, AdReward } from '../../services/AdManager';
import { AudioManager } from '../../services/AudioManager';

interface AdOverlayModalProps {
    isOpen: boolean;
    rewardConfig: AdReward;
    onClose: (receivedReward: boolean) => void;
}

const AD_CAMPAIGNS = [
    {
        title: "Dragon Ball Sparking! ZERO",
        sponsor: "Bandai Namco",
        category: "Game 3D",
        description: "Batalhas 3D para PS5, Xbox Series X|S e PC.",
        tag: "Patrocinado",
        gradient: "from-blue-950 via-indigo-900 to-slate-950",
        accent: "text-amber-400"
    },
    {
        title: "Capsule Corp Cloud",
        sponsor: "Capsule Corp",
        category: "Nuvem",
        description: "Jogos de luta sem atrasos a 240 FPS em 4K.",
        tag: "Verificado",
        gradient: "from-amber-950 via-orange-900 to-zinc-950",
        accent: "text-orange-400"
    },
    {
        title: "Kame Energy Drink",
        sponsor: "Mestre Kame",
        category: "Suplemento",
        description: "Recupere Ki instantaneamente para o torneio.",
        tag: "Recomendado",
        gradient: "from-emerald-950 via-teal-900 to-slate-950",
        accent: "text-emerald-400"
    }
];

const TOTAL_AD_DURATION = 12; // 12 Seconds non-skippable video ad duration

export const AdOverlayModal: React.FC<AdOverlayModalProps> = ({ isOpen, rewardConfig, onClose }) => {
    const [isLoadingAd, setIsLoadingAd] = useState(true);
    const [timeLeft, setTimeLeft] = useState(TOTAL_AD_DURATION);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [adIndex, setAdIndex] = useState(0);
    const [showQuitWarning, setShowQuitWarning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoadingAd(true);
            setTimeLeft(TOTAL_AD_DURATION);
            setIsCompleted(false);
            setShowQuitWarning(false);
            setAdIndex(Math.floor(Math.random() * AD_CAMPAIGNS.length));
            AudioManager.getInstance().playSFX('confirm');

            // Simulate smooth AdMob video ad buffer/loading
            const loadTimer = setTimeout(() => {
                setIsLoadingAd(false);
            }, 900);

            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsCompleted(true);
                        AudioManager.getInstance().playSFX('victory');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearTimeout(loadTimer);
                clearInterval(timer);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const campaign = AD_CAMPAIGNS[adIndex];
    const progressPct = ((TOTAL_AD_DURATION - timeLeft) / TOTAL_AD_DURATION) * 100;

    const handleClaimReward = () => {
        if (!isCompleted) return; // Strict reward protection
        AdManager.getInstance().incrementDailyAdCount();
        onClose(true);
    };

    const handleAttemptClose = () => {
        if (isCompleted) {
            onClose(false);
        } else {
            setShowQuitWarning(true);
        }
    };

    const handleConfirmQuit = () => {
        setShowQuitWarning(false);
        onClose(false); // Quits early, NO reward delivered
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
                >
                    {/* Top Header Bar */}
                    <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-400" />
                                {campaign.tag}
                            </span>
                            <span className="text-xs font-medium text-stone-400 hidden sm:inline">
                                Rede de Anúncios Recompensados AdMob
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                                title={isMuted ? "Ativar som" : "Mutar"}
                            >
                                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                            </button>

                            {/* Close / Warning Button */}
                            <button
                                onClick={handleAttemptClose}
                                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isCompleted 
                                        ? 'bg-stone-800 hover:bg-stone-700 text-stone-300' 
                                        : 'bg-stone-800/80 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 border border-stone-700/50'
                                }`}
                                title={isCompleted ? "Fechar" : "Sair do Vídeo"}
                            >
                                {isCompleted ? (
                                    <X className="w-4 h-4" />
                                ) : (
                                    <>
                                        <Lock className="w-3.5 h-3.5 text-stone-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Sair</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-950 h-1.5 relative overflow-hidden">
                        <motion.div
                            className="h-full bg-amber-400"
                            style={{ width: `${progressPct}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>

                    {/* High Quality Video Container */}
                    <div className={`relative h-64 bg-gradient-to-br ${campaign.gradient} flex flex-col items-center justify-center p-5 text-center overflow-hidden border-b border-stone-800`}>
                        {/* Top Non-skippable Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-stone-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-stone-800 text-xs">
                            {!isCompleted ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="font-mono font-bold text-amber-300 text-xs">
                                        VÍDEO EM EXIBIÇÃO ({timeLeft}s)
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="font-bold text-emerald-300 text-xs">CONCLUÍDO</span>
                                </>
                            )}
                        </div>

                        {/* Equalizer animation */}
                        <div className="absolute top-3 right-3 flex items-end gap-1 h-3.5 bg-stone-950/80 px-2 py-1 rounded-lg border border-stone-800">
                            <span className="w-0.5 bg-amber-400 rounded-full transition-all" style={{ height: isMuted ? '20%' : '100%' }} />
                            <span className="w-0.5 bg-amber-400 rounded-full transition-all" style={{ height: isMuted ? '20%' : '60%' }} />
                            <span className="w-0.5 bg-amber-400 rounded-full transition-all" style={{ height: isMuted ? '20%' : '80%' }} />
                        </div>

                        {isLoadingAd ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative z-20 flex flex-col items-center justify-center space-y-3 my-auto"
                            >
                                <div className="relative w-8 h-8">
                                    <div className="absolute inset-0 rounded-full border-2 border-stone-800" />
                                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                                    <div className="absolute inset-1 rounded-full bg-amber-500/10 animate-pulse" />
                                </div>
                                <span className="text-xs font-medium text-stone-300 tracking-wide">
                                    Carregando anúncio AdMob...
                                </span>
                            </motion.div>
                        ) : (
                            <div className="relative z-10 space-y-2.5 max-w-sm my-auto">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-stone-950/80 border border-amber-500/20 text-xs text-amber-300 font-bold">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <span>{campaign.category}</span>
                                </div>

                                <h3 className="text-xl font-bold tracking-tight text-white">
                                    {campaign.title}
                                </h3>

                                <p className="text-xs text-stone-300 leading-relaxed font-normal">
                                    {campaign.description}
                                </p>

                                <div className="pt-1">
                                    <span className="text-[11px] font-normal text-stone-400">
                                        Patrocinado por <strong className="text-stone-200">{campaign.sponsor}</strong>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Bottom Quality Info */}
                        <div className="absolute bottom-2.5 left-3 text-[10px] text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800 font-mono">
                            HD Video • Recompensa Protegida
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Recompensa</div>
                                <div className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1">
                                    {rewardConfig.type === 'ROOM_TOKEN' && `+${rewardConfig.amount} TOKEN DE SALA`}
                                    {rewardConfig.type === 'COINS' && `+${rewardConfig.amount} MOEDAS DE OURO`}
                                    {rewardConfig.type === 'GEMS' && `+${rewardConfig.amount} CRISTAIS DE EVOLUÇÃO`}
                                    {rewardConfig.type === 'TICKET' && `+${rewardConfig.amount} TICKET DE CONVOCAÇÃO`}
                                </div>
                            </div>
                        </div>

                        {isCompleted ? (
                            <motion.button
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={handleClaimReward}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Resgatar Recompensa</span>
                            </motion.button>
                        ) : (
                            <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-xl text-stone-400 text-xs font-medium">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Aguarde {timeLeft}s para liberar</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Anti-Cheat Quit Warning Confirmation Modal */}
                {showQuitWarning && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-stone-900 border border-stone-800 rounded-xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl"
                        >
                            <div className="w-10 h-10 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-5 h-5" />
                            </div>

                            <h4 className="text-sm font-bold text-white uppercase">
                                Deseja sair do vídeo?
                            </h4>

                            <p className="text-xs text-stone-300 leading-relaxed">
                                Se você sair agora, não receberá a recompensa. Restam apenas <span className="text-amber-400 font-mono font-bold">{timeLeft}s</span>!
                            </p>

                            <div className="flex flex-col gap-2 pt-1">
                                <button
                                    onClick={() => setShowQuitWarning(false)}
                                    className="w-full py-2 bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer hover:bg-amber-400 transition-colors"
                                >
                                    Continuar Assitindo ({timeLeft}s)
                                </button>
                                <button
                                    onClick={handleConfirmQuit}
                                    className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                >
                                    Sair sem Recompensa
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};

