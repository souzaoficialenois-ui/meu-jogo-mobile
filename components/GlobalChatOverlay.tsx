
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../contexts/SceneContext';
import { Send, X, MessageSquare, Globe, Users, Maximize2, Minimize2, ChevronRight, User } from 'lucide-react';
import { AudioManager } from '../services/AudioManager';
import { SceneName } from '../types';

import { useUI } from '../contexts/UIContext';
import { AVATAR_LIST, BACKGROUND_LIST } from '../constants';

const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId) return "/Assets/avatar/retrato/1.png";
    if (avatarId.startsWith('/')) return avatarId;
    const formatted = avatarId.startsWith('avatar_') ? avatarId : `avatar_${avatarId}`;
    const found = AVATAR_LIST.find(a => a.id === avatarId || a.id === formatted);
    if (found) return found.url;
    const num = avatarId.replace('avatar_', '');
    return `/Assets/avatar/retrato/${num}.png`;
};

const getBackgroundUrl = (bgId?: string) => {
    if (!bgId) return undefined;
    if (bgId.startsWith('/')) return bgId;
    const formatted = bgId.startsWith('bg_') ? bgId : `bg_${bgId}`;
    return BACKGROUND_LIST.find(b => b.id === bgId || b.id === formatted)?.url;
};

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
        if (isChatOpen && scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [globalMessages, isChatOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = messageInput.trim();
        if (!text) return;
        
        setMessageInput('');
        AudioManager.getInstance().playSFX('click');
        
        try {
            await sendGlobalMessage(text);
        } catch (err) {
            console.error("Failed to send global message:", err);
        }
    };

    // Do not show chat overlay during active gameplay or initial load screens
    const disabledScenes = [
        SceneName.BATTLE,
        SceneName.TRAINING,
        SceneName.PRELOAD,
        SceneName.SPLASH_SCREEN,
        SceneName.RESOURCE_DOWNLOAD,
        SceneName.HUD_EDITOR,
    ];

    if (disabledScenes.includes(currentScene)) return null;

    return (
        <AnimatePresence>
            {isChatOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none flex">
                    {/* Dark Backdrop Overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsChatOpen(false)}
                    />

                    <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-[480px] max-w-[85vw] md:max-w-[45vw] bg-stone-950/95 backdrop-blur-3xl border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto relative"
                    >
                        {/* Header with User Info */}
                        <div className="bg-stone-900/60 border-b border-white/10 p-6 flex flex-col gap-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-600/20 rounded-xl border border-orange-500/30">
                                        <MessageSquare className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-wider text-white">Chat <span className="text-orange-500">Global</span></h3>
                                </div>
                                <button 
                                    onClick={() => setIsChatOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all active:scale-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Current User Stats */}
                            <div className="flex items-center gap-4 bg-stone-900/80 p-3 rounded-2xl border border-white/10 shadow-inner">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-xl bg-stone-950 border border-stone-700 overflow-hidden shadow-lg relative">
                                        {getBackgroundUrl(playerProfile?.backgroundId) ? (
                                            <img src={getBackgroundUrl(playerProfile?.backgroundId)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-900" />
                                        )}
                                        <img 
                                            src={getAvatarUrl(playerProfile?.avatarId)} 
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
                                        {t('profile_level_label') || 'Nível'} {Math.floor(((playerProfile as any)?.exp || 0) / 100) + 1} • {isOfflineMode ? 'Local' : 'Online'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 custom-scrollbar bg-radial-vignette"
                        >
                            {globalMessages.map((msg, i) => {
                                const isMe = msg.senderId === currentUser?.uid;
                                return (
                                    <div key={`chat-msg-${msg.id || i}-${i}`} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <motion.div 
                                            initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex gap-3 max-w-[92%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                        >
                                            <button 
                                                onClick={() => {
                                                    AudioManager.getInstance().playSFX('click');
                                                    if (msg.senderId) setShowProfileId(msg.senderId);
                                                }}
                                                className={`w-10 h-10 rounded-xl bg-stone-900 border overflow-hidden shrink-0 transition-all active:scale-90 shadow-lg ${isMe ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-500/50'}`}
                                            >
                                                <img 
                                                    src={getAvatarUrl(msg.senderAvatar)} 
                                                    className="w-full h-full object-cover" 
                                                    alt="avatar" 
                                                />
                                            </button>
                                            <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 px-1 flex-wrap">
                                                    {!isMe && (
                                                        <span className="text-[11px] font-black italic uppercase tracking-wider text-orange-400">
                                                            {msg.senderName}
                                                        </span>
                                                    )}
                                                    {msg.senderTitle && (
                                                        <span className="text-[8px] text-orange-300/70 font-bold uppercase tracking-widest">{msg.senderTitle}</span>
                                                    )}
                                                    {msg.senderRole && msg.senderRole !== 'PLAYER' && (
                                                        <span className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border ${
                                                            msg.senderRole === 'ADMIN' ? 'bg-red-950/80 text-red-400 border-red-500/30' :
                                                            msg.senderRole === 'MODERATOR' ? 'bg-purple-950/80 text-purple-400 border-purple-500/30' :
                                                            msg.senderRole === 'AMBASSADOR' ? 'bg-amber-950/80 text-amber-400 border-amber-500/30' :
                                                            msg.senderRole === 'VETERAN' ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30' : ''
                                                        }`}>
                                                            {msg.senderRole === 'ADMIN' ? '👑 ADMIN' :
                                                             msg.senderRole === 'MODERATOR' ? '🛡️ MOD' :
                                                             msg.senderRole === 'AMBASSADOR' ? '🏅 EMBAIXADOR' :
                                                             msg.senderRole === 'VETERAN' ? '⚔️ VET' : msg.senderRole}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] text-stone-500 font-mono">
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
                                                        rounded-2xl px-4 py-2.5 text-sm border shadow-xl transition-all relative leading-relaxed whitespace-pre-wrap break-words
                                                        ${isMe 
                                                            ? 'bg-orange-600 text-white border-orange-400 rounded-tr-none' 
                                                            : 'bg-stone-900 text-stone-200 border-white/10 rounded-tl-none'}
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
                                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center py-20">
                                    <MessageSquare className="w-20 h-20 mb-4 text-orange-500" />
                                    <p className="text-base font-black italic uppercase tracking-widest text-stone-400">Silêncio na Arena...</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-stone-900/60 border-t border-white/10">
                            <form 
                                onSubmit={handleSend}
                                className="flex gap-3 bg-stone-950 border border-white/15 rounded-2xl p-2 focus-within:border-orange-500/60 transition-all shadow-2xl"
                            >
                                <input 
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    onKeyUp={(e) => e.stopPropagation()}
                                    placeholder={t('chat_placeholder') || 'Escreva algo no Chat Global...'}
                                    className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none placeholder:text-stone-600 font-medium"
                                />
                                <button 
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className="w-10 h-10 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:bg-stone-800 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-orange-600/20 shrink-0 cursor-pointer"
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
                    background: rgba(249, 115, 22, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(249, 115, 22, 0.6);
                }
            `}</style>
        </AnimatePresence>
    );
};
