
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, ChatMessage } from '../../types';
import { 
    Send, 
    ArrowLeft, 
    UserCircle,
    BadgeCheck,
    Lock,
    Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { AudioManager } from '../../services/AudioManager';

export const PrivateChatScreen: React.FC = () => {
    const { 
        changeScene, 
        currentPrivateChatId,
        setPrivateChatWith,
        privateMessages, 
        sendPrivateMessage,
        playerProfile,
        currentUser,
        friends
    } = useSceneManager();

    const [messageInput, setMessageInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // Local state for private messages
    const [localPrivateMessages, setLocalPrivateMessages] = useState<ChatMessage[]>(privateMessages || []);

    // Fetch private messages only when this screen is open
    useEffect(() => {
        if (!currentUser || !currentPrivateChatId) {
            setLocalPrivateMessages([]);
            return;
        }
        
        import('firebase/firestore').then(({ query, collection, orderBy, limit, onSnapshot }) => {
            const { db } = require('../../services/firebase');
            const q = query(collection(db, 'private_chats', currentPrivateChatId, 'messages'), orderBy('timestamp', 'desc'), limit(50));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                })) as ChatMessage[];
                setLocalPrivateMessages(msgs.reverse());
            }, (error) => console.error("Local Private Chat Snapshot Error:", error));
            
            return () => unsubscribe();
        });
    }, [currentPrivateChatId, currentUser]);

    // Find the other user's info from friends list
    const otherUser = useMemo(() => {
        if (!currentPrivateChatId || !currentUser) return null;
        const targetId = currentPrivateChatId.replace(currentUser.uid, '').replace('_', '');
        return friends.find(f => f.friendId === targetId);
    }, [currentPrivateChatId, currentUser, friends]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [localPrivateMessages]);

    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        setPrivateChatWith(null);
        changeScene(SceneName.SOCIAL);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        AudioManager.getInstance().playSFX('click');
        await sendPrivateMessage(messageInput);
        setMessageInput('');
    };

    if (!otherUser) {
        return (
             <div className="absolute inset-0 bg-stone-950 flex items-center justify-center">
                 <button onClick={handleBack} className="text-white flex items-center gap-2">
                    <ArrowLeft /> Go Back
                 </button>
             </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-stone-950 text-white flex flex-col font-sans overflow-hidden">
            {/* --- HEADER --- */}
            <div className="h-20 bg-stone-900/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                            <UserCircle className="w-8 h-8 text-white/50" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-white">
                                {otherUser.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse "></span>
                                <span className="text-[10px] font-black italic text-orange-500 tracking-widest uppercase">Direct Link Secured</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20">
                    <Lock className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black italic text-orange-400 uppercase tracking-widest">End-to-End Encryption Active</span>
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-12 flex flex-col gap-6 custom-scrollbar relative">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-0 opacity-5">
                    <Shield className="w-96 h-96 text-white" />
                </div>
                
                {localPrivateMessages.map((msg, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={`${msg.id}-${i}`} 
                        className={`flex gap-4 relative z-10 ${msg.senderId === currentUser?.uid ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`max-w-[65%] ${msg.senderId === currentUser?.uid ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className="flex items-center gap-2 px-2">
                                <span className="text-[8px] font-bold text-slate-700">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                            </div>
                            <div className={`px-6 py-4 rounded-3xl text-sm font-medium shadow-2xl ${msg.senderId === currentUser?.uid ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-900/40 border border-orange-400/20' : 'bg-stone-900 border border-white/5 rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* --- INPUT --- */}
            <form onSubmit={handleSendMessage} className="p-8 bg-stone-900/50 backdrop-blur-xl border-t border-white/10 flex gap-4">
                <div className="flex-1 relative">
                    <input 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onBlur={() => {
                            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        }}
                        placeholder="ENTER SECURE MESSAGE..."
                        className="w-full bg-black/60 border-2 border-stone-800 focus:border-orange-500 rounded-2xl px-8 py-5 text-sm font-bold placeholder:text-stone-700 focus:outline-none transition-all shadow-inner"
                    />
                </div>
                <button 
                    className="w-20 h-20 bg-orange-600 hover:bg-orange-500 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-orange-900/40 group active:scale-95"
                    type="submit"
                >
                    <Send className="w-8 h-8 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
            </form>
        </div>
    );
};
