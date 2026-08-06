import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, X, Copy, Check, Send, CheckCircle2, Hash } from 'lucide-react';
import { useSceneManager } from '../../contexts/SceneContext';
import { LobbyService } from '../../services/LobbyService';
import { AudioManager } from '../../services/AudioManager';
import { AVATAR_LIST } from '../../constants';

interface InviteFriendsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoom: any;
}

export const InviteFriendsDrawer: React.FC<InviteFriendsDrawerProps> = ({
    isOpen,
    onClose,
    currentRoom
}) => {
    const { friends, playerProfile } = useSceneManager();
    const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({});
    const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
    const [copiedCode, setCopiedCode] = useState(false);

    const acceptedFriends = friends ? friends.filter(f => f.status === 'ACCEPTED') : [];

    const handleCopyCode = () => {
        if (!currentRoom?.id) return;
        navigator.clipboard.writeText(currentRoom.id);
        setCopiedCode(true);
        AudioManager.getInstance().playSFX('confirm');
        setTimeout(() => setCopiedCode(false), 2500);
    };

    const handleSendInvite = async (friendId: string) => {
        if (!currentRoom?.id || !playerProfile || sendingMap[friendId]) return;

        setSendingMap(prev => ({ ...prev, [friendId]: true }));
        AudioManager.getInstance().playSFX('click');

        try {
            await LobbyService.getInstance().sendInvite(
                currentRoom.id,
                playerProfile,
                friendId,
                currentRoom.maxCharacters ? `${currentRoom.maxCharacters}v${currentRoom.maxCharacters}` : 'SALA PRIVADA'
            );
            AudioManager.getInstance().playSFX('confirm');
            setSentMap(prev => ({ ...prev, [friendId]: true }));
        } catch (err) {
            console.error("Failed to send room invite:", err);
            AudioManager.getInstance().playSFX('cancel');
        } finally {
            setSendingMap(prev => ({ ...prev, [friendId]: false }));
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            AudioManager.getInstance().playSFX('cancel');
                            onClose();
                        }}
                        className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Lateral Menu Sliding from Right to Left (matching Main Menu style) */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-[90vw] sm:w-[420px] md:w-[460px] lg:w-[500px] bg-stone-950/95 border-l border-white/10 backdrop-blur-2xl shadow-[0_0_100px_rgba(0,0,0,0.95)] flex flex-col p-6 md:p-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.2)]">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black italic uppercase tracking-[0.2em] text-white text-lg md:text-xl drop-shadow-md">
                                        CONVIDAR AMIGOS
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-widest">
                                        CHAMAR LUTADORES PARA A SALA
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    AudioManager.getInstance().playSFX('cancel');
                                    onClose();
                                }}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/40 text-stone-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Room Code Banner */}
                        <div className="mb-6 p-4 rounded-2xl bg-stone-900/60 border border-white/10 flex items-center justify-between gap-3 shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                                    <Hash size={18} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 block">CÓDIGO DA SALA</span>
                                    <span className="text-sm font-black uppercase tracking-widest text-white truncate block">{currentRoom?.id || '---'}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyCode}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                    copiedCode 
                                        ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50' 
                                        : 'bg-orange-600 hover:bg-orange-500 text-stone-950 font-extrabold shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                                }`}
                            >
                                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedCode ? 'COPIADO!' : 'COPIAR'}</span>
                            </button>
                        </div>

                        {/* Friends List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                                    AMIGOS ({acceptedFriends.length})
                                </span>
                            </div>

                            {acceptedFriends.length > 0 ? (
                                acceptedFriends.map((friend) => {
                                    const avatarUrl = AVATAR_LIST.find(a => a.id === friend.avatarId)?.url || "/Assets/avatar/retrato/1.png";
                                    const isSending = sendingMap[friend.friendId];
                                    const isSent = sentMap[friend.friendId];

                                    return (
                                        <div
                                            key={friend.friendId}
                                            className="p-3.5 rounded-2xl bg-stone-900/40 hover:bg-stone-900/80 border border-white/5 hover:border-orange-500/30 transition-all duration-300 flex items-center justify-between gap-3 group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-xl bg-stone-950 border border-white/10 overflow-hidden relative group-hover:border-orange-500/50 transition-colors shrink-0 shadow-md">
                                                    <img
                                                        src={avatarUrl}
                                                        alt={friend.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* Details */}
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="font-black italic uppercase tracking-wider text-white text-sm truncate group-hover:text-orange-400 transition-colors">
                                                        {friend.name}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest truncate">
                                                        {friend.title || (friend.rankTier ? friend.rankTier.replace('_', ' ') : 'LUTADOR')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Invite Button */}
                                            <button
                                                onClick={() => handleSendInvite(friend.friendId)}
                                                disabled={isSending || isSent}
                                                className={`px-3.5 py-2 rounded-xl text-[10px] font-black italic uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                                                    isSent
                                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                                                        : isSending
                                                        ? 'bg-stone-800 text-stone-400 border border-white/5 animate-pulse'
                                                        : 'bg-stone-800 hover:bg-orange-600 text-stone-200 hover:text-black border border-white/10 hover:border-orange-400 shadow-md'
                                                }`}
                                            >
                                                {isSent ? (
                                                    <>
                                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                                        <span>ENVIADO!</span>
                                                    </>
                                                ) : isSending ? (
                                                    <span>ENVIANDO...</span>
                                                ) : (
                                                    <>
                                                        <Send size={12} />
                                                        <span>CHAMAR</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 px-4 text-center bg-stone-900/20 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center text-stone-600">
                                        <Users size={28} />
                                    </div>
                                    <h4 className="text-stone-300 font-black uppercase tracking-wider text-sm">
                                        NENHUM AMIGO ENCONTRADO
                                    </h4>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest max-w-[240px] leading-relaxed">
                                        Adicione lutadores na Central Social para convidá-los diretamente para sua arena!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 mt-auto border-t border-white/10">
                            <button
                                onClick={() => {
                                    AudioManager.getInstance().playSFX('cancel');
                                    onClose();
                                }}
                                className="w-full py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 text-stone-300 hover:text-white font-black italic uppercase tracking-[0.2em] text-xs transition-all cursor-pointer text-center"
                            >
                                FECHAR MENU
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
