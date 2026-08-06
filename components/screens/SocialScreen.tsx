
import React, { useState, useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, ChatMessage } from '../../types';
import { 
    Users, 
    Globe, 
    ArrowLeft, 
    Send,
    Mic,
    Smile
} from 'lucide-react';
import { motion } from 'motion/react';
import { AudioManager } from '../../services/AudioManager';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { AVATAR_LIST } from '../../personagens/CharacterDatabase';

const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId) return "/Assets/avatar/retrato/1.png";
    if (avatarId.startsWith('/')) return avatarId;
    const formatted = avatarId.startsWith('avatar_') ? avatarId : `avatar_${avatarId}`;
    const found = AVATAR_LIST.find(a => a.id === avatarId || a.id === formatted);
    if (found) return found.url;
    const num = avatarId.replace('avatar_', '');
    return `/Assets/avatar/retrato/${num}.png`;
};

type ChatCategory = 'WORLD' | 'FRIENDS';

interface SocialScreenProps {
    onClose?: () => void;
}

const SocialScreenContent: React.FC<SocialScreenProps> = ({ onClose }) => {
    const { 
        changeScene, 
        friends, 
        globalMessages, 
        sendGlobalMessage,
        currentUser,
        setShowProfileId,
        settings,
        t
    } = useSceneManager();

    const { s } = useUI();

    const [activeCat, setActiveCat] = useState<ChatCategory>('WORLD');
    const [messageInput, setMessageInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isEn = settings?.language?.startsWith('en');

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [globalMessages]);

    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        if (onClose) onClose();
        else changeScene(SceneName.MAIN_MENU);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageInput.trim()) return;
        
        const text = messageInput.trim();
        setMessageInput('');
        AudioManager.getInstance().playSFX('click');
        
        try {
            await sendGlobalMessage(text);
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const categories = [
        { id: 'WORLD' as ChatCategory, icon: Globe, label: isEn ? 'Global Arena' : 'Arena Global' },
        { id: 'FRIENDS' as ChatCategory, icon: Users, label: isEn ? 'Fighter Friends' : 'Lutadores Amigos' },
    ];

    return (
        <div className="absolute inset-0 bg-[#050608]/95 backdrop-blur-2xl text-white flex font-sans overflow-hidden z-[100]">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m3.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-10"
                />
            </div>

            {/* Sidebar Tabs */}
            <motion.aside 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="border-r border-white/5 flex flex-col items-center bg-black/40"
                style={{ width: s(96), padding: `${s(32)}px 0`, gap: s(16) }}
            >
                <button 
                    onClick={handleBack}
                    className="bg-white/5 border border-white/10 hover:border-orange-500 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group cursor-pointer active:scale-95 shadow-md shrink-0"
                    style={{ width: s(64), height: s(64), marginBottom: s(16) }}
                >
                    <ArrowLeft style={{ width: s(24), height: s(24) }} className="text-orange-400 group-hover:-translate-x-1 transition-transform" />
                </button>

                {categories.map((cat, i) => (
                    <button
                        key={`${cat.id}-${i}`}
                        onClick={() => setActiveCat(cat.id)}
                        className={`rounded-2xl flex items-center justify-center transition-all relative group ${
                            activeCat === cat.id ? 'bg-orange-600 text-white shadow-lg ' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        style={{ width: s(64), height: s(64) }}
                    >
                        <cat.icon style={{ width: s(24), height: s(24) }} />
                        <div 
                            className="absolute bg-orange-600 rounded-lg font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                            style={{ left: s(80), padding: `${s(6)}px ${s(12)}px`, fontSize: s(10) }}
                        >
                            {cat.label}
                        </div>
                        {activeCat === cat.id && (
                            <div 
                                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-l-full" 
                                style={{ width: s(4), height: s(24) }}
                            />
                        )}
                    </button>
                ))}
            </motion.aside>

            {/* Main Chat Area */}
            <motion.main 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-orange-500/5 to-transparent"
            >
                {/* Chat Header */}
                <header 
                    className="flex items-center justify-between border-b border-white/5 bg-black/20"
                    style={{ height: s(80), padding: `0 ${s(32)}px` }}
                >
                    <div className="flex items-center" style={{ gap: s(16) }}>
                        <div className="bg-orange-600/10 rounded-xl flex items-center justify-center" style={{ width: s(40), height: s(40) }}>
                            {(() => {
                                const Icon = categories.find(c => c.id === activeCat)?.icon;
                                return Icon ? <Icon style={{ width: s(18), height: s(18) }} className="text-orange-400" /> : null;
                            })()}
                        </div>
                        <h2 className="font-header italic uppercase tracking-wider text-orange-400 " style={{ fontSize: s(24) }}>
                            {categories.find(c => c.id === activeCat)?.label}
                        </h2>
                    </div>
                </header>

                {/* Messages List */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: s(32) }}>
                    <div className="flex flex-col" style={{ gap: s(24) }}>
                        {activeCat === 'WORLD' && globalMessages.map((msg, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`social-msg-${msg.id || idx}-${idx}`} 
                                className="flex group"
                                style={{ gap: s(16) }}
                            >
                                <div 
                                    onClick={() => {
                                        AudioManager.getInstance().playSFX('click');
                                        setShowProfileId(msg.senderId);
                                    }}
                                    className="bg-orange-950/40 border border-orange-500/20 rounded-xl overflow-hidden shrink-0 cursor-pointer hover:border-orange-500 transition-all active:scale-95 shadow-lg"
                                    style={{ width: s(48), height: s(48) }}
                                >
                                    <img 
                                        src={getAvatarUrl(msg.senderAvatar)} 
                                        className="w-full h-full object-cover" 
                                        alt="avatar" 
                                    />
                                </div>
                                <div className="flex flex-col" style={{ gap: s(4), maxWidth: '80%' }}>
                                    <div className="flex flex-col mb-1">
                                        {msg.senderTitle && (
                                            <span className="text-[9px] text-orange-400/80 font-black uppercase tracking-widest mb-0.5">{msg.senderTitle}</span>
                                        )}
                                        <div className="flex items-center" style={{ gap: s(12) }}>
                                            <span 
                                                onClick={() => {
                                                    AudioManager.getInstance().playSFX('click');
                                                    setShowProfileId(msg.senderId);
                                                }}
                                                className="font-black italic text-orange-400 uppercase tracking-tight cursor-pointer hover:text-white transition-colors"
                                                style={{ fontSize: s(12) }}
                                            >
                                                {msg.senderName}
                                            </span>
                                            {msg.senderRole && msg.senderRole !== 'PLAYER' && (
                                                <span 
                                                    className={`rounded font-extrabold tracking-widest uppercase flex items-center ${
                                                        msg.senderRole === 'ADMIN' ? 'bg-red-950/80 text-red-400 border border-red-500/30' :
                                                        msg.senderRole === 'MODERATOR' ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30' :
                                                        msg.senderRole === 'AMBASSADOR' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' :
                                                        msg.senderRole === 'VETERAN' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30' : ''
                                                    }`}
                                                    style={{ fontSize: s(9), padding: `${s(2)}px ${s(6)}px`, gap: s(4) }}
                                                >
                                                    {msg.senderRole === 'ADMIN' ? '👑 ADMIN' :
                                                    msg.senderRole === 'MODERATOR' ? '🛡️ MOD' :
                                                    msg.senderRole === 'AMBASSADOR' ? (isEn ? '🏅 AMBASSADOR' : '🏅 EMBAIXADOR') :
                                                    msg.senderRole === 'VETERAN' ? (isEn ? '⚔️ VET' : '⚔️ VET') : msg.senderRole}
                                                </span>
                                            )}
                                            {msg.senderRankTier && (
                                                <span className="text-[8px] text-orange-500/40 font-black uppercase tracking-tighter">
                                                    {msg.senderRankTier.replace('_', ' ')}
                                                </span>
                                            )}
                                            <span className="font-mono text-slate-600" style={{ fontSize: s(10) }}>
                                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                            </span>
                                        </div>
                                    </div>
                                    <div 
                                        className="bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-slate-200 leading-relaxed transition-colors backdrop-blur-sm"
                                        style={{ padding: `${s(12)}px ${s(20)}px`, fontSize: s(14) }}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        {activeCat === 'FRIENDS' && (
                            <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: s(16) }}>
                                {friends.map((friend, idx) => (
                                    <button 
                                        key={`friend-card-${friend.friendId}-${idx}`} 
                                        onClick={() => {
                                            AudioManager.getInstance().playSFX('click');
                                            setShowProfileId(friend.friendId);
                                        }}
                                        className="bg-black/40 border border-white/5 rounded-2xl flex items-center hover:border-orange-500/30 transition-all text-left cursor-pointer active:scale-[0.98]"
                                        style={{ padding: s(16), gap: s(16) }}
                                    >
                                        <div className="bg-orange-950/40 rounded-xl overflow-hidden shrink-0 border border-white/10" style={{ width: s(56), height: s(56) }}>
                                            <img 
                                                src={getAvatarUrl(friend.avatarId)} 
                                                className="w-full h-full object-cover" 
                                                alt="friend" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {friend.title && (
                                                <span className="text-[8px] text-orange-500/60 font-black uppercase tracking-widest block mb-1">{friend.title}</span>
                                            )}
                                            <p className="font-black italic uppercase text-white truncate leading-none" style={{ fontSize: s(14) }}>{friend.name}</p>
                                            <div className="flex items-center mt-2" style={{ gap: s(6) }}>
                                                <div className="rounded-full bg-orange-500 animate-pulse" style={{ width: s(6), height: s(6) }} />
                                                <span className="font-bold text-orange-400 uppercase tracking-widest" style={{ fontSize: s(10) }}>
                                                    {friend.rankTier ? friend.rankTier.replace('_', ' ') : (isEn ? 'View Profile' : 'Ver Perfil')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {friends.length === 0 && (
                                    <div className="col-span-full text-center opacity-20" style={{ padding: `${s(80)}px 0` }}>
                                        <Users className="mx-auto mb-4" style={{ width: s(48), height: s(48) }} />
                                        <p className="font-black italic uppercase" style={{ fontSize: s(12) }}>{isEn ? 'No connected warriors' : 'Nenhum guerreiro conectado'}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Bar */}
                <div style={{ padding: s(32), paddingTop: s(16) }}>
                    <div className="bg-[#12141a]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center shadow-2xl" style={{ padding: s(16), gap: s(16) }}>
                        <button className="bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all" style={{ width: s(48), height: s(48) }}>
                            <Mic style={{ width: s(20), height: s(20) }} />
                        </button>
                        
                        <div className="flex-1 bg-black/40 rounded-2xl flex items-center border border-white/5 focus-within:border-orange-500/50 transition-all" style={{ height: s(48), padding: `0 ${s(24)}px` }}>
                            <input 
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter') handleSendMessage();
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                                        document.body.scrollTop = 0;
                                        document.documentElement.scrollTop = 0;
                                    }, 50);
                                }}
                                placeholder={isEn ? "Say something in the Dojo..." : "Diga algo no Dojo..."}
                                className="w-full bg-transparent font-medium text-white placeholder:text-slate-700 focus:outline-none"
                                style={{ fontSize: s(14) }}
                            />
                            <button className="text-slate-600 hover:text-white transition-colors">
                                <Smile style={{ width: s(20), height: s(20) }} />
                            </button>
                        </div>

                        <button 
                            onClick={() => handleSendMessage()}
                            className="bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center transition-all active:scale-95 shadow-lg "
                            style={{ padding: `0 ${s(32)}px`, height: s(48), gap: s(12) }}
                        >
                            <span className="font-black uppercase tracking-widest" style={{ fontSize: s(12) }}>{isEn ? 'Send' : 'Enviar'}</span>
                            <Send style={{ width: s(16), height: s(16) }} className="rotate-[15deg]" />
                        </button>
                    </div>
                </div>
            </motion.main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(79, 70, 229, 0.2);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export const SocialScreen: React.FC<SocialScreenProps> = (props) => (
    <UIProvider>
        <SocialScreenContent {...props} />
    </UIProvider>
);

