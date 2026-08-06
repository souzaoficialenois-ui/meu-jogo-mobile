
import React, { useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, InMail } from '../../types';
import { X, Gift, User, ArrowLeft, Gem, Coins, Ticket, ChevronLeft } from 'lucide-react';
import { RESOURCE_SPRITES } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioManager } from '../../services/AudioManager';

export const MessagesScreen: React.FC = () => {
    const { 
        inbox, 
        markInMailRead, 
        claimInMailReward, 
        changeScene, 
        t,
        settings
    } = useSceneManager();
    
    const [selectedMessage, setSelectedMessage] = useState<InMail | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'REWARDS'>('ALL');

    const isPt = settings.language === 'pt';

    const handleOpenMessage = (msg: InMail) => {
        AudioManager.getInstance().playSFX('click');
        setSelectedMessage(msg);
        if (!msg.read && (!msg.reward || msg.reward.claimed)) {
            markInMailRead(msg.id);
        }
    };

    const handleCloseMessage = () => {
        AudioManager.getInstance().playSFX('cancel');
        setSelectedMessage(null);
    };

    const handleClaim = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        AudioManager.getInstance().playSFX('confirm');
        await claimInMailReward(id);
    };

    const filteredInbox = inbox.filter(msg => {
        if (activeTab === 'UNREAD') return !msg.read;
        if (activeTab === 'REWARDS') return !!msg.reward && !msg.reward.claimed;
        return true;
    });

    const renderRewardIcon = (type: string, size: number = 10) => {
        const sizeClass = `w-${size} h-${size}`;
        switch (type) {
            case 'COIN': return <img src={RESOURCE_SPRITES.curr_coins} alt="COIN" className={`${sizeClass} object-contain`} referrerPolicy="no-referrer" draggable={false} />;
            case 'GEM': return <img src={RESOURCE_SPRITES.curr_gems} alt="GEM" className={`${sizeClass} object-contain`} referrerPolicy="no-referrer" draggable={false} />;
            case 'TICKET': return <img src={RESOURCE_SPRITES.curr_tickets} alt="TICKET" className={`${sizeClass} object-contain`} referrerPolicy="no-referrer" draggable={false} />;
            default: return <Gift className={`${sizeClass} text-white`} />;
        }
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m3.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute left-[-5%] bottom-[-5%] opacity-30 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/piccolo/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

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
                        {isPt ? 'INBOX' : 'INBOX'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-stone-900/60 backdrop-blur-md border border-white/5 h-10 md:h-14 rounded-2xl items-center px-4 md:px-6 gap-3 shadow-2xl">
                        <Gift size={20} className="text-orange-500" />
                        <span className="text-xs md:text-sm font-black uppercase text-white tracking-widest">
                            {inbox.filter(m => !m.read).length} {isPt ? 'PENDENTES' : 'PENDING'}
                        </span>
                    </div>
                </div>
            </motion.header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
                
                {/* SIDEBAR - Tabs */}
                <motion.div className="flex flex-col gap-6 shrink-0 w-full md:w-80 z-20">
                    <div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-2 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        
                        <div className="flex flex-col gap-1 relative z-10">
                            {[
                                { id: 'ALL', label: isPt ? 'TODAS' : 'ALL', icon: Ticket },
                                { id: 'UNREAD', label: isPt ? 'LIDAS' : 'UNREAD', icon: User },
                                { id: 'REWARDS', label: isPt ? 'RECOMPENSAS' : 'REWARDS', icon: Gift }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => { AudioManager.getInstance().playSFX('navigation'); setActiveTab(tab.id as any); }}
                                    className={`
                                        group relative h-14 flex items-center px-6 transition-all rounded-xl overflow-hidden
                                        ${activeTab === tab.id ? 'bg-orange-600/20 text-white' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex items-center gap-4 font-black italic uppercase text-sm tracking-[0.15em] z-10 w-full">
                                        <tab.icon size={20} className={`${activeTab === tab.id ? 'text-orange-500' : 'text-stone-500'}`} />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                    </div>
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="inbox-sidebar-active"
                                            className="absolute inset-y-0 left-0 w-1 bg-orange-500 z-0"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto bg-stone-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest mb-3">{isPt ? 'SISTEMA' : 'SYSTEM'}</p>
                        <p className="text-xs text-stone-500 leading-relaxed italic uppercase font-black">
                            {isPt ? 'MENSAGENS NÃO COLETADAS EXPIRAM EM 30 DIAS.' : 'UNCLAIMED MESSAGES EXPIRE IN 30 DAYS.'}
                        </p>
                    </div>
                </motion.div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pb-20"
                        >
                            {filteredInbox.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-40 text-stone-700 opacity-50 grayscale gap-6">
                                    <Gift size={80} />
                                    <p className="text-xl font-black italic uppercase tracking-[0.4em]">{isPt ? 'SEM MENSAGENS' : 'NO MESSAGES'}</p>
                                </div>
                            ) : (
                                filteredInbox.map((msg, index) => (
                                    <MessageItem 
                                        key={`inbox-msg-${msg.id || index}-${index}`} 
                                        msg={msg} 
                                        onOpen={() => handleOpenMessage(msg)}
                                        isPt={isPt}
                                    />
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* MESSAGE DETAIL MODAL */}
            <AnimatePresence>
                {selectedMessage && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseMessage}
                            className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-stone-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-start">
                                <div className="min-w-0 pr-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{isPt ? 'MENSAGEM' : 'MESSAGE'}</span>
                                        <span className="text-stone-700 font-black tracking-widest">
                                            {(selectedMessage.timestamp as any)?.toDate ? (selectedMessage.timestamp as any).toDate().toLocaleDateString() : new Date(selectedMessage.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase text-white tracking-tight">{selectedMessage.subject}</h3>
                                    <p className="text-xs text-stone-500 font-black uppercase tracking-widest mt-2 italic">
                                        {isPt ? 'DE:' : 'FROM:'} <span className="text-orange-500">{selectedMessage.senderName}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCloseMessage}
                                    className="w-12 h-12 bg-white/5 hover:bg-stone-800 border border-white/5 rounded-2xl flex items-center justify-center transition-all"
                                >
                                    <X className="w-6 h-6 text-stone-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                                <p className="text-stone-300 text-lg leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>

                            {selectedMessage.reward && (
                                <div className="p-10 border-t border-white/5 bg-stone-950/40 flex items-center gap-6 justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-stone-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                                            {renderRewardIcon(selectedMessage.reward.type, 8)}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black italic text-white leading-none">
                                                {selectedMessage.reward.amount} <span className="text-sm text-stone-500 uppercase tracking-widest ml-1">{selectedMessage.reward.type}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        disabled={selectedMessage.reward.claimed}
                                        onClick={(e) => handleClaim(e, selectedMessage.id)}
                                        className={`
                                            px-8 py-4 rounded-2xl font-black italic uppercase tracking-widest text-sm transition-all shadow-2xl active:scale-95
                                            ${selectedMessage.reward.claimed 
                                                ? 'bg-stone-800 text-stone-600 border border-white/5 cursor-not-allowed opacity-50' 
                                                : 'bg-orange-500 hover:bg-orange-400 text-stone-950 border border-orange-400/50'
                                            }
                                        `}
                                    >
                                        {selectedMessage.reward.claimed ? (isPt ? 'COLETADO' : 'CLAIMED') : (isPt ? 'COLETAR' : 'CLAIM')}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.5); }
            `}</style>
        </div>
    );
};

const MessageItem: React.FC<{ msg: InMail, onOpen: () => void, isPt: boolean }> = ({ msg, onOpen, isPt }) => (
    <motion.div 
        onClick={onOpen}
        className={`
            bg-stone-900/10 border p-5 flex items-center justify-between group transition-all shadow-2xl backdrop-blur-md rounded-[24px] cursor-pointer
            ${msg.read ? 'border-white/5 opacity-60' : 'border-orange-500/30 bg-orange-500/5'}
            hover:border-orange-500/40 hover:opacity-100 hover:scale-[1.01]
        `}
    >
        <div className="flex items-center gap-6 min-w-0">
            <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border
                ${msg.read ? 'bg-stone-950/40 border-white/5' : 'bg-orange-600/10 border-orange-500/30'}
            `}>
                {msg.reward ? <Gift size={28} className={msg.read ? 'text-stone-600' : 'text-orange-500'} /> : <User size={28} className={msg.read ? 'text-stone-600' : 'text-orange-500'} />}
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    {!msg.read && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                    <h4 className={`text-xl font-black italic uppercase truncate tracking-tight ${msg.read ? 'text-stone-500' : 'text-white'}`}>{msg.subject}</h4>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-stone-600 font-black uppercase tracking-widest">{msg.senderName}</span>
                </div>
            </div>
        </div>

        {msg.reward && (
            <div className="shrink-0 ml-4">
                {msg.reward.claimed ? (
                    <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest bg-stone-950/40 px-3 py-1.5 rounded-lg border border-white/5 italic">{isPt ? 'COLETADO' : 'CLAIMED'}</span>
                ) : (
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 italic animate-pulse">{isPt ? 'RECOMPENSA' : 'REWARD'}</span>
                )}
            </div>
        )}
    </motion.div>
);


