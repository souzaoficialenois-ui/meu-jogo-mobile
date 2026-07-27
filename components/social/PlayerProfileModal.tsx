import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { handleFirestoreError, OperationType } from '../../services/error_handler';
import { useSceneManager } from '../../contexts/SceneContext';
import { 
    X, Trophy, Calendar, UserPlus, UserMinus, Shield, Swords, 
    Zap, Award, RefreshCw, Send, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RankService } from '../../services/RankService';
import { PlayerProfile } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { LobbyService } from '../../services/LobbyService';
import { AVATAR_LIST } from '../../personagens/CharacterDatabase';

interface PlayerProfileModalProps {
    playerId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ playerId, isOpen, onClose }) => {
    const { 
        playerProfile: myProfile, 
        friends, 
        sendFriendRequest, 
        removeFriend,
        currentUser
    } = useSceneManager();

    const [profile, setProfile] = useState<any | null>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteSentSuccess, setInviteSentSuccess] = useState(false);
    
    // Check friendship status
    const friendRecord = friends.find(f => f.friendId === playerId);
    const isFriend = friendRecord?.status === 'ACCEPTED';
    const isPending = friendRecord?.status === 'PENDING' || friendRecord?.status === 'REQUESTED';

    // Real-time listener for target player profile
    useEffect(() => {
        if (!playerId || !isOpen) return;

        setIsLoading(true);
        const docRef = doc(db, 'users', playerId);
        const unsubProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile({ id: docSnap.id, ...docSnap.data() });
            } else {
                setProfile(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to sync profile:", error);
            setIsLoading(false);
        });

        // Fetch matches history once
        const fetchHistory = async () => {
            try {
                const matchesRef = collection(db, 'users', playerId, 'matches');
                const q = query(matchesRef, orderBy('timestamp', 'desc'), limit(5));
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMatches(list);
            } catch (err) {
                handleFirestoreError(err, OperationType.LIST, `users/${playerId}/matches`);
            }
        };
        fetchHistory();

        return () => {
            unsubProfile();
        };
    }, [playerId, isOpen]);

    // Handle friend request or remove
    const handleAddFriend = async () => {
        AudioManager.getInstance().playSFX('click');
        try {
            await sendFriendRequest(playerId);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRemoveFriend = async () => {
        AudioManager.getInstance().playSFX('cancel');
        if (confirm("Deseja realmente remover este amigo?")) {
            try {
                await removeFriend(playerId);
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Check if I have an active custom room and can invite them
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    useEffect(() => {
        if (!isOpen || !currentUser) return;
        
        // Let's check if I'm currently inside an active custom room as host
        // We can listen to online_rooms_v2 where hostId === myUid and status === 'WAITING'
        const q = query(collection(db, 'online_rooms_v2'), orderBy('createdAt', 'desc'), limit(1));
        const unsub = onSnapshot(q, (snapshot) => {
            let foundRoomId: string | null = null;
            snapshot.forEach(docSnap => {
                const d = docSnap.data();
                if (d.hostId === currentUser.uid && d.status === 'WAITING') {
                    foundRoomId = docSnap.id;
                }
            });
            setActiveRoomId(foundRoomId);
        });
        return unsub;
    }, [isOpen, currentUser]);

    const handleSendInvite = async () => {
        if (!activeRoomId || !myProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        setIsSendingInvite(true);
        try {
            await LobbyService.getInstance().sendInvite(
                activeRoomId,
                myProfile,
                playerId,
                'Combate Customizado'
            );
            setInviteSentSuccess(true);
            setTimeout(() => setInviteSentSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to send room invite:", err);
        } finally {
            setIsSendingInvite(false);
        }
    };

    if (!isOpen) return null;

    // Resolve competitive rank
    const points = profile?.ranked?.br?.points || profile?.points || 0;
    const { name, subRank } = RankService.getRankFromPoints(points);

    // Calc stats
    const wins = profile?.wins || 0;
    const losses = profile?.losses || 0;
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Helper for online status styling
    const getStatusStyle = (statusStr: string) => {
        switch (statusStr?.toUpperCase()) {
            case 'ONLINE':
                return { label: 'Online', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400 animate-pulse' };
            case 'PLAYING':
                return { label: 'Em Partida', bg: 'bg-red-500/15 border-red-500/30 text-red-400', dot: 'bg-red-500 animate-ping' };
            case 'BUSY':
                return { label: 'Ocupado', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', dot: 'bg-amber-400' };
            default:
                return { label: 'Offline', bg: 'bg-stone-500/15 border-stone-800 text-stone-500', dot: 'bg-stone-600' };
        }
    };

    const statusStyle = getStatusStyle(profile?.status || 'OFFLINE');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
                style={{ maxHeight: '90vh' }}
            >
                {/* Close Button */}
                <button 
                    onClick={() => {
                        AudioManager.getInstance().playSFX('cancel');
                        onClose();
                    }}
                    className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 bg-stone-950/40 rounded-full border border-stone-800 hover:border-orange-500 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
                        <RefreshCw className="animate-spin text-orange-500 mb-4" size={40} />
                        <p className="font-bold uppercase tracking-wider text-xs">Sincronizando Perfil...</p>
                    </div>
                ) : !profile ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
                        <Award className="text-red-500 mb-4" size={40} />
                        <p className="font-bold uppercase tracking-wider text-sm">Jogador não encontrado</p>
                        <p className="text-xs text-stone-600 mt-1">O ID do jogador pode estar incorreto ou a conta foi excluída.</p>
                    </div>
                ) : (
                    <>
                        {/* Header Profile Card */}
                        <div className="relative bg-gradient-to-b from-stone-800 to-stone-900 p-6 border-b border-stone-800">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-2xl border-2 border-orange-500 bg-stone-950 overflow-hidden relative shadow-lg">
                                    <img 
                                        src={AVATAR_LIST.find(a => a.id === profile.avatarId)?.url || "/Assets/UI/avatar_placeholder.png"} 
                                        className="w-full h-full object-cover" 
                                        alt="Avatar" 
                                        referrerPolicy="no-referrer"
                                    />
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                                        <div className="flex flex-col">
                                            {profile.activeTitle && (
                                                <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1">{profile.activeTitle}</span>
                                            )}
                                            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none">{profile.displayName || profile.name}</h2>
                                        </div>
                                        
                                        {/* Status Tag */}
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusStyle.bg} self-center`}>
                                            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                                            {statusStyle.label}
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-orange-400 font-mono mt-1 font-bold">#{profile.numericId || '0000'}</p>
                                    
                                    {profile.bio && (
                                        <p className="text-xs text-stone-400 italic mt-2 bg-stone-950/30 p-2 rounded border border-stone-850 max-w-md">{profile.bio}</p>
                                    )}

                                    <div className="flex items-center gap-2 mt-3 text-[10px] text-stone-500 font-bold justify-center sm:justify-start">
                                        <Calendar size={12} />
                                        <span>Entrou em: {new Date(profile.createdAt || profile.createdDate || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl text-center">
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Combates</p>
                                    <p className="text-2xl font-black text-white font-mono mt-1">{totalMatches}</p>
                                </div>
                                <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl text-center">
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Vitórias</p>
                                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{wins}</p>
                                </div>
                                <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl text-center">
                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Derrotas</p>
                                    <p className="text-2xl font-black text-red-400 font-mono mt-1">{losses}</p>
                                </div>
                                <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl text-center">
                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Taxa Vitórias</p>
                                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">{winRate}%</p>
                                </div>
                            </div>

                            {/* Competitive rank & MMR */}
                            <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                                        <Trophy size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Divisão Competitiva</p>
                                        <h3 className="text-lg font-black text-white uppercase italic">{name} {subRank}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">MMR / Pontos</p>
                                    <p className="text-xl font-black text-orange-400 font-mono">{points} <span className="text-xs text-stone-500">PTS</span></p>
                                </div>
                            </div>

                            {/* Recent Match History */}
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-2">
                                    <Swords size={14} className="text-orange-500" />
                                    Histórico de Partidas Recentes
                                </h4>

                                {matches.length === 0 ? (
                                    <div className="bg-stone-950/40 border border-stone-850/60 p-6 rounded-xl text-center text-stone-500 text-xs">
                                        Nenhuma partida recente registrada.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {matches.map((m) => (
                                            <div key={m.id} className="bg-stone-950 border border-stone-850 p-3 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${m.isWin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        {m.isWin ? 'W' : 'L'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">vs {m.opponentName}</p>
                                                        <p className="text-[10px] text-stone-500 font-mono">{new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${m.isWin ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                    {m.isWin ? 'Vitória' : 'Derrota'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social / Action Footer */}
                        <div className="bg-stone-950 border-t border-stone-850 p-6 flex flex-wrap gap-3 justify-end items-center">
                            {/* Active room invite action */}
                            {activeRoomId && playerId !== currentUser?.uid && (
                                <button 
                                    onClick={handleSendInvite}
                                    disabled={isSendingInvite || inviteSentSuccess}
                                    className={`px-4 py-2 text-xs font-black uppercase italic tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                                        inviteSentSuccess 
                                            ? 'bg-emerald-600 text-white' 
                                            : 'bg-orange-500 hover:bg-orange-400 text-black'
                                    }`}
                                >
                                    {inviteSentSuccess ? (
                                        <>
                                            <CheckCircle2 size={14} />
                                            Enviado!
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            Convidar para Sala
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Friendship action buttons */}
                            {playerId !== currentUser?.uid && (
                                <>
                                    {isFriend ? (
                                        <button 
                                            onClick={handleRemoveFriend}
                                            className="px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase italic tracking-wider rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <UserMinus size={14} />
                                            Remover Amigo
                                        </button>
                                    ) : isPending ? (
                                        <button 
                                            disabled
                                            className="px-4 py-2 border border-stone-800 bg-stone-900 text-stone-500 text-xs font-black uppercase italic tracking-wider rounded-xl cursor-not-allowed flex items-center gap-2"
                                        >
                                            <UserPlus size={14} />
                                            Pendente
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleAddFriend}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase italic tracking-wider rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <UserPlus size={14} />
                                            Adicionar Amigo
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
