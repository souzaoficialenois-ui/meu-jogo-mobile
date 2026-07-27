import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, WifiOff, AlertTriangle } from 'lucide-react';
import { OnlineStatus } from '../../services/OnlineService';
import { RemoteConfigService } from '../../services/RemoteConfigService';
import { AudioManager } from '../../services/AudioManager';

interface UpdatePopupProps {
    isOpen: boolean;
    status: OnlineStatus;
    onClose: () => void;
}

export const UpdatePopup: React.FC<UpdatePopupProps> = ({ isOpen, status, onClose }) => {
    if (!isOpen) return null;

    const config = RemoteConfigService.getConfig();
    
    // Determine the content based on status
    const isMaintenance = status === 'MAINTENANCE';
    const isUpdate = status === 'UPDATE_REQUIRED';
    
    // Default values if somehow opened in other state
    let title = 'AVISO DO SERVIDOR';
    let message = 'Ocorreu um erro ao conectar com o serviço online.';
    let icon = <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    
    if (isMaintenance) {
        title = 'MANUTENÇÃO';
        message = 'Servidores em manutenção';
        icon = <AlertTriangle className="w-12 h-12 text-orange-500" />;
    } else if (isUpdate) {
        title = 'ATUALIZAÇÃO DISPONÍVEL';
        message = config.updateMessage || 'Atualize o jogo para acessar o multiplayer online.';
        icon = <Download className="w-12 h-12 text-blue-500" />;
    }

    const handleUpdateClick = () => {
        AudioManager.getInstance().playSFX('confirm');
        if (config.downloadUrl) {
            window.open(config.downloadUrl, '_blank');
        }
    };

    const handlePlayOfflineClick = () => {
        AudioManager.getInstance().playSFX('cancel');
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={handlePlayOfflineClick}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-stone-900 border border-stone-700 p-8 rounded-2xl shadow-2xl max-w-xl w-[90%] md:w-[600px] flex flex-col items-center text-center overflow-hidden"
                >
                    {/* Background glow */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[80px] opacity-20 pointer-events-none 
                        ${isMaintenance ? 'bg-orange-500' : isUpdate ? 'bg-blue-500' : 'bg-stone-500'}`} />

                    <div className="mb-6 z-10">
                        {icon}
                    </div>

                    <h2 className="text-3xl font-black italic uppercase tracking-widest text-white mb-4 z-10">
                        {title}
                    </h2>
                    
                    <p className="text-lg text-stone-300 mb-8 font-bold z-10 px-4 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full z-10">
                        {isUpdate && (
                            <button 
                                onClick={handleUpdateClick}
                                className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 rounded-xl text-white font-black italic uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Download className="w-5 h-5" />
                                Atualizar Agora
                            </button>
                        )}
                        <button 
                            onClick={handlePlayOfflineClick}
                            className="flex-1 px-6 py-4 bg-stone-800 hover:bg-stone-700 border-2 border-stone-600 rounded-xl text-stone-300 hover:text-white font-black italic uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <WifiOff className="w-5 h-5" />
                            Jogar Offline
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
