import React from 'react';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '../../constants';
import { RemoteConfigService } from '../../services/RemoteConfigService';
import { AudioManager } from '../../services/AudioManager';

interface StrictVersionBlockScreenProps {
    status: 'UPDATE_REQUIRED' | 'MAINTENANCE';
}

export const StrictVersionBlockScreen: React.FC<StrictVersionBlockScreenProps> = ({ status }) => {
    const config = RemoteConfigService.getConfig();
    const isMaintenance = status === 'MAINTENANCE';

    const handleUpdateClick = () => {
        try {
            AudioManager.getInstance().playSFX('confirm');
        } catch (_) {}
        if (config.update_url) {
            window.open(config.update_url, '_blank');
        }
    };

    return (
        <div className="absolute inset-0 z-[99999] bg-stone-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none text-stone-200">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] pointer-events-none opacity-[0.08] transition-all duration-1000 ${isMaintenance ? 'bg-orange-500' : 'bg-red-500'}`} />

            <div className="relative z-10 w-full max-w-xl px-6 flex flex-col items-center text-center">
                {/* Dynamic Icon */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg border ${isMaintenance ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                >
                    {isMaintenance ? <AlertTriangle className="w-10 h-10 animate-pulse" /> : <Download className="w-10 h-10" />}
                </motion.div>

                {/* Main Title */}
                <motion.h1 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="text-4xl md:text-5xl font-header italic uppercase tracking-wider text-white mb-2"
                >
                    {isMaintenance ? 'MANUTENÇÃO' : 'ATUALIZAÇÃO OBRIGATÓRIA'}
                </motion.h1>

                {/* Subtitle / Message */}
                <motion.p 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-stone-300 text-sm md:text-base font-bold uppercase tracking-wide max-w-md leading-relaxed mb-8 px-4"
                >
                    {isMaintenance 
                        ? (config.updateMessage || 'Nossos servidores estão passando por uma manutenção programada para melhorias. Voltaremos em breve!')
                        : 'Existe uma nova versão obrigatória disponível. Você precisa atualizar o seu jogo para continuar jogando.'}
                </motion.p>

                {/* Details Container (Only for Update Required) */}
                {!isMaintenance && (
                    <motion.div 
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="w-full bg-stone-900/60 border border-stone-800/80 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4 backdrop-blur-sm"
                    >
                        <div className="text-center border-r border-stone-800">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Sua Versão</span>
                            <span className="text-xl font-black italic text-stone-300 font-mono">{APP_VERSION}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Versão Oficial</span>
                            <span className="text-xl font-black italic text-orange-500 font-mono">{config.game_version || 'N/A'}</span>
                        </div>
                    </motion.div>
                )}

                {/* Action button */}
                <motion.div 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="w-full flex flex-col gap-3"
                >
                    {!isMaintenance ? (
                        <button 
                            onClick={handleUpdateClick}
                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 border-x-4 border-orange-400 text-white font-header italic text-lg uppercase tracking-widest transition-all shadow-lg  active:scale-[0.98] cursor-pointer animate-pulse-glow"
                        >
                            <span className="flex items-center justify-center gap-3 skew-x-0">
                                <Download className="w-5 h-5" />
                                Atualizar Jogo
                            </span>
                        </button>
                    ) : (
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-stone-900 hover:bg-stone-800 border-x-4 border-stone-700 text-stone-300 hover:text-white font-header italic text-lg uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Verificar Novamente
                            </span>
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Bottom Footer Details */}
            <div className="absolute bottom-8 flex items-center gap-2 opacity-30 text-xs">
                <span className="font-bold tracking-wider uppercase font-mono">FIGHTER LEGEND ONE 1</span>
                <span className="text-stone-500 font-mono">|</span>
                <span className="font-mono">v{APP_VERSION}</span>
            </div>
        </div>
    );
};
