
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../contexts/SceneContext';
import { Send, X, MessageSquare, Globe, Users, Maximize2, Minimize2, ChevronRight, User } from 'lucide-react';
import { AudioManager } from '../services/AudioManager';
import { SceneName } from '../types';

import { useUI } from '../contexts/UIContext';
import { AVATAR_LIST, BACKGROUND_LIST } from '../constants';

export const GlobalChatOverlay: React.FC = () => {
    const { 
        globalMessages, 
        sendGlobalMessage, 
        isChatOpen, 
        setIsChatOpen,
        currentUser,
        playerProfile,
        setShowProfileId,
        isOfflineMode,
        currentScene,
        t
    } = useSceneManager();

    const { s } = useUI();

    const [messageInput, setMessageInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [globalMessages, isChatOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageInput.trim()) return;
        
        const text = messageInput.trim();
        setMessageInput('');
        AudioManager.getInstance().playSFX('click');
        
        try {
            await sendGlobalMessage(text);
        } catch (err) {
            console.error("Failed to send global message:", err);
        }
    };

    // Chat only appears on Main Menu
    if (currentScene !== SceneName.MAIN_MENU) return null;
    
    return (
        <AnimatePresence>
            {isChatOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex">
                    {/* Dark Backdrop Overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsChatOpen(false)}
                    />

                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[450px] max-w-[85vw] md:max-w-[45vw] bg-stone-950/95 backdrop-blur-3xl border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto relative"
                    >
                        {/* Header with User Info */}
                        <div className="bg-stone-900/50 border-b border-white/5 p-6 flex flex-col gap-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-600/20 rounded-xl border border-orange-500/20">
                                        <MessageSquare className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-wider text-white">Chat <span className="text-orange-500">Global</span></h3>
                                </div>
                                <button 
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-stone-500 hover:text-white transition-all active:scale-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Current User Stats */}
                            <div className="flex items-center gap-4 bg-stone-800/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-xl bg-stone-950 border border-stone-700 overflow-hidden shadow-lg relative">
                                        {BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url ? (
                                            <img src={BACKGROUND_LIST.find(b => b.id === playerProfile?.backgroundId)?.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-900" />
                                        )}
                                        <img 
                                            src={AVATAR_LIST.find(a => a.id === playerProfile?.avatarId)?.url || "/Assets/UI/avatar_placeholder.png"} 
                                            className="w-full h-full object-contain relative z-10"
                                            alt="avatar"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-stone-800 animate-pulse" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-base font-black italic uppercase tracking-wider text-white truncate">
                                        {playerProfile?.name || t('menu_guest')}
                                    </span>
                                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] opacity-80">
                                        {t('profile_level_label') || 'Nível'} {Math.floor((playerProfile?.exp || 0) / 100) + 1} • Online
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-radial-vignette"
                        >
                            {globalMessages.map((msg, i) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                return (
                                    <div key={`${msg.id}-${i}`} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <motion.div 
                                            initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex gap-3 max-w-[90%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <button 
                                                onClick={() => setShowProfileId(msg.senderId)}
                                                className={`w-10 h-10 rounded-xl bg-stone-900 border overflow-hidden shrink-0 transition-all active:scale-90 shadow-lg ${isMe ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-500/50'}`}
                                            >
                                                <img 
                                                    src={AVATAR_LIST.find(a => a.id === msg.senderAvatar)?.url || "/Assets/UI/avatar_placeholder.png"} 
                                                    className="w-full h-full object-contain" 
                                                    alt="avatar" 
                                                />
                                            </button>
                                            <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 px-1">
                                                    {!isMe && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                                            {msg.senderName}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-zinc-600 font-mono">
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                    {isMe && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                                                            {t('chat_you') || 'Você'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div 
                                                    className={`
                                                        rounded-2xl px-4 py-2.5 text-sm border shadow-xl transition-all relative
                                                        ${isMe 
                                                            ? 'bg-orange-600 text-white border-orange-400 rounded-tr-none' 
                                                            : 'bg-stone-900 text-stone-200 border-white/5 rounded-tl-none'}
                                                    `}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                            {globalMessages.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-10 text-center py-20">
                                    <MessageSquare className="w-20 h-20 mb-4" />
                                    <p className="text-base font-black italic uppercase tracking-widest">Silêncio na Arena...</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-stone-900/50 border-t border-white/10">
                            <form 
                                onSubmit={handleSend}
                                className="flex gap-3 bg-stone-950 border border-white/10 rounded-2xl p-2 focus-within:border-orange-500/50 transition-all shadow-2xl"
                            >
                                    <input 
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder={t('chat_placeholder') || 'Escreva algo épico...'}
                                        className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none placeholder:text-stone-600 font-medium"
                                    />
                                <button 
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className="w-10 h-10 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:bg-stone-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-orange-600/20 shrink-0"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(249, 115, 22, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(249, 115, 22, 0.4);
                }
            `}</style>
        </AnimatePresence>
    );
};
