import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useSceneManager } from '../../contexts/SceneContext';
import { 
    X, Trophy, UserPlus, UserMinus, 
    Award, RefreshCw, Send, CheckCircle2, ShieldCheck, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RankService } from '../../services/RankService';
import { AudioManager } from '../../services/AudioManager';
import { LobbyService } from '../../services/LobbyService';
import { AVATAR_LIST, BACKGROUND_LIST } from '../../personagens/CharacterDatabase';
import { PlayerTitleBadge } from '../ui/PlayerTitleBadge';

interface PlayerProfileModalProps {
    playerId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface TitleItem {
    id: string;
    name: string;
    color: string;
    bgGlow: string;
    img?: string;
    description: string;
}

const MASTER_TITLES: Record<string, TitleItem> = {
    'warrior': { id: 'warrior', name: 'Guerreiro Supremo', color: 'text-amber-400 border-amber-500/40', bgGlow: 'bg-amber-500/10', description: 'Título Inicial de Combate' },
    'instinct': { id: 'instinct', name: 'Instinto Divino', color: 'text-cyan-400 border-cyan-500/40', bgGlow: 'bg-cyan-500/10', description: 'Mestre da Agilidade e Reflexos' },
    'destroyer': { id: 'destroyer', name: 'Ego Destruidor', color: 'text-purple-400 border-purple-500/40', bgGlow: 'bg-purple-500/10', description: 'Poder Destrutivo Inigualável' },
    'legend': { id: 'legend', name: 'Lenda do Clã', color: 'text-red-400 border-red-500/40', bgGlow: 'bg-red-500/10', img: '/Assets/ui/Titulos/Exclusivo_Beta.png', description: 'Lenda Suprema da Arena' },
    'Fighter Legend': { id: 'Fighter Legend', name: 'Lenda Beta', color: 'text-orange-500 border-orange-600/40', bgGlow: 'bg-orange-500/15', img: '/Assets/ui/Titulos/Exclusivo_Beta.png', description: 'Participante da Missão Beta' },
    'fighter_legend': { id: 'fighter_legend', name: 'Lenda Beta', color: 'text-orange-500 border-orange-600/40', bgGlow: 'bg-orange-500/15', img: '/Assets/ui/Titulos/Exclusivo_Beta.png', description: 'Participante da Missão Beta' },
    'god': { id: 'god', name: 'Deus do Combate', color: 'text-orange-400 border-orange-500/40', bgGlow: 'bg-orange-500/10', description: 'Conquista de Deus da Arena' },
    'unbreakable': { id: 'unbreakable', name: 'Inabalável', color: 'text-emerald-400 border-emerald-500/40', bgGlow: 'bg-emerald-500/10', description: 'Resistência de Aço' },
    'beta_pioneer': { id: 'beta_pioneer', name: 'Pioneiro Beta', color: 'text-amber-500 border-amber-500/40', bgGlow: 'bg-amber-500/15', img: '/Assets/ui/Titulos/Exclusivo_Beta.png', description: 'Pioneiro Fighter Legend' },
    'champion': { id: 'champion', name: 'Campeão de Torneio', color: 'text-yellow-400 border-yellow-500/40', bgGlow: 'bg-yellow-500/10', description: 'Vencedor do Torneio de Artes Marciais' },
    'combo_master': { id: 'combo_master', name: 'Mestre dos Combos', color: 'text-blue-400 border-blue-500/40', bgGlow: 'bg-blue-500/10', description: 'Especialista em Sequências e Combos' },
};

const getAvatarUrl = (avatarId?: string) => {
    if (!avatarId) return "/Assets/avatar/retrato/1.png";
    const cleanId = avatarId.toString().replace('avatar_', '');
    const found = AVATAR_LIST.find(a => 
        a.id === avatarId || 
        a.id === `avatar_${cleanId}`
    );
    if (found?.url) return found.url;
    return `/Assets/avatar/retrato/${cleanId}.png`;
};

const getBackgroundInfo = (bgId?: string) => {
    if (!bgId) return { id: 'bg_1', name: 'Fundo Padrão #01', url: '/Assets/avatar/fundo/1.png' };
    const cleanId = bgId.toString().replace('bg_', '');
    const found = BACKGROUND_LIST.find(b => 
        b.id === bgId || 
        b.id === `bg_${cleanId}`
    );
    const url = found?.url || `/Assets/avatar/fundo/${cleanId}.png`;
    const label = cleanId === 'beta_pioneer' || cleanId === 'Excluviso_Beta' ? 'Fundo Pioneiro Beta' : `Fundo #${cleanId.padStart(2, '0')}`;
    return { id: found?.id || bgId, name: label, url };
};

const resolveTitleInfo = (titleKey?: string): TitleItem => {
    if (!titleKey) return MASTER_TITLES['warrior'];
    if (MASTER_TITLES[titleKey]) return MASTER_TITLES[titleKey];
    
    const foundByValue = Object.values(MASTER_TITLES).find(t => t.name.toLowerCase() === titleKey.toLowerCase());
    if (foundByValue) return foundByValue;

    return {
        id: titleKey,
        name: titleKey,
        color: 'text-orange-400 border-orange-500/40',
        bgGlow: 'bg-orange-500/10',
        description: 'Título de Honra Conquistado'
    };
};

const PanelCard: React.FC<{ title: string; subtitle?: string; icon: any; children: React.ReactNode }> = ({ title, subtitle, icon: Icon, children }) => (
    <div className="bg-stone-900/40 border border-white/5 rounded-[24px] p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <h3 className="text-white font-black text-lg sm:text-2xl uppercase tracking-widest italic leading-none">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-stone-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
        <div className="space-y-3 relative z-10">
            {children}
        </div>
    </div>
);

const SettingRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-white/[0.03] rounded-xl transition-all duration-200 gap-3 group">
        <div className="space-y-0.5 text-left">
            <h4 className="text-stone-100 font-black tracking-widest text-sm sm:text-base uppercase italic">
                {label}
            </h4>
            {description && (
                <p className="text-stone-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
                    {description}
                </p>
            )}
        </div>
        <div className="flex items-center gap-4 shrink-0 z-10">
            {children}
        </div>
    </div>
);

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ playerId, isOpen, onClose }) => {
    const { 
        playerProfile: myProfile, 
        friends, 
        sendFriendRequest, 
        removeFriend,
        currentUser
    } = useSceneManager();

    const [profile, setProfile] = useState<any | null>(null);
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

    // Resolve avatar, background & title
    const avatarUrl = getAvatarUrl(profile?.avatarId);
    const bgInfo = getBackgroundInfo(profile?.backgroundId);

    // Competitive rank
    const points = profile?.ranked?.br?.points || profile?.points || 0;
    const { name: rankName, subRank } = RankService.getRankFromPoints(points);

    // Stats
    const wins = profile?.wins || 0;
    const losses = profile?.losses || 0;
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Status styling
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

    // Resolve single active title
    const activeTitleKey = profile?.activeTitle || 'warrior';
    const activeTitleObj = resolveTitleInfo(activeTitleKey);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                {/* Backdrop Blur Layer matching SettingsScreen modal overlays */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                    onClick={() => {
                        AudioManager.getInstance().playSFX('cancel');
                        onClose();
                    }} 
                />

                {/* Modal Main Container with Settings styling */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-3xl bg-stone-950/90 border border-white/10 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col relative max-h-[88vh] overflow-hidden text-stone-200 z-10"
                >
                    {/* Background Texture & Bloom Glow Layers matching SettingsScreen */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        {/* Player's equipped Avatar Background image card as backdrop overlay */}
                        {bgInfo.url ? (
                            <img 
                                src={bgInfo.url} 
                                alt="Fundo do Avatar" 
                                className="w-full h-full object-cover opacity-20 filter contrast-125 saturate-125 scale-105" 
                            />
                        ) : (
                            <img 
                                src="/Assets/fundosdastelas/modos/m3.png" 
                                alt="Background" 
                                className="w-full h-full object-cover opacity-25 filter contrast-125 saturate-125" 
                            />
                        )}
                        <div className="absolute inset-0 bg-stone-950/70" />
                        
                        {/* Bloom / Glow Light Effect */}
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
                        
                        {/* Background Character Aura Glow */}
                        <div className="absolute left-[-8%] bottom-[-8%] opacity-20 scale-[1.0] blur-[1px]">
                            <img src="/Assets/personagens/goku/parado.gif" className="h-[60vh] w-auto object-contain" alt="" />
                        </div>

                        {/* Cubes Texture Overlay */}
                        <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    </div>

                    {/* Top Edge Light Accent */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent z-30" />

                    {/* MODAL HEADER MATCHING SETTINGS SCREEN */}
                    <header className="h-20 sm:h-24 px-6 sm:px-8 flex items-center justify-between border-b border-white/5 relative z-20 shrink-0 bg-stone-950/40 backdrop-blur-md">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <button 
                                onClick={() => { 
                                    AudioManager.getInstance().playSFX('cancel'); 
                                    onClose(); 
                                }}
                                className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                            >
                                <X className="w-6 h-6 sm:w-7 sm:h-7 text-stone-300" />
                            </button>
                            <div>
                                <h2 className="text-xl sm:text-3xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                                    PERFIL DO JOGADOR
                                </h2>
                                <p className="text-stone-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">
                                    {profile ? (profile.displayName || profile.name) : 'INFORMAÇÕES E ESTATÍSTICAS'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] text-stone-400 uppercase opacity-70">
                                GUERREIRO ID
                            </span>
                            <span className="text-[10px] sm:text-sm font-black text-orange-500 font-mono uppercase italic tracking-widest mt-0.5">
                                #{profile?.numericId || '0000'}
                            </span>
                        </div>
                    </header>

                    {/* CONTENT BODY */}
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400 relative z-10">
                            <RefreshCw className="animate-spin text-orange-500 mb-4" size={40} />
                            <p className="font-black uppercase tracking-widest text-xs">Carregando Perfil...</p>
                        </div>
                    ) : !profile ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400 relative z-10">
                            <Award className="text-red-500 mb-4" size={40} />
                            <p className="font-black uppercase tracking-widest text-sm">Jogador não encontrado</p>
                            <p className="text-xs text-stone-600 mt-1">O ID do jogador pode estar incorreto ou a conta foi removida.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar relative z-10">
                            
                            {/* PANEL 1: IDENTIDADE DO GUERREIRO */}
                            <PanelCard title="Identidade do Guerreiro" subtitle="Visual do avatar, título de honra e status" icon={ShieldCheck}>
                                <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-stone-950/80 shadow-2xl p-5 sm:p-6 transition-all">
                                    {/* Full Avatar Background Card Banner */}
                                    {bgInfo.url && (
                                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                                            <img 
                                                src={bgInfo.url} 
                                                className="w-full h-full object-cover object-center opacity-55 filter contrast-125 saturate-125 scale-105" 
                                                alt="Fundo do Avatar" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/90" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/50" />
                                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                                        </div>
                                    )}

                                    {/* Badge showcasing the equipped Avatar Background */}
                                    <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5 bg-stone-950/90 border border-orange-500/30 px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 font-mono">
                                            {bgInfo.name}
                                        </span>
                                    </div>

                                    {/* Content Layout */}
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                        {/* Avatar Frame */}
                                        <div className="flex flex-col items-center gap-2 shrink-0">
                                            <div className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-2xl border-2 border-orange-500/40 bg-stone-950/90 overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.25)] group">
                                                {bgInfo.url && (
                                                    <img 
                                                        src={bgInfo.url} 
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80 filter contrast-110" 
                                                        alt="Fundo do Avatar" 
                                                    />
                                                )}
                                                <img 
                                                    src={avatarUrl} 
                                                    className="relative z-10 w-full h-full object-contain filter contrast-125 p-1 drop-shadow-xl" 
                                                    alt="Avatar do Jogador" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                            <span className="text-[9px] font-mono text-orange-400 font-bold tracking-wider uppercase bg-stone-950/90 px-2.5 py-0.5 rounded border border-orange-500/30 shadow-md sm:hidden">
                                                {bgInfo.name}
                                            </span>
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                                            {/* Player Name */}
                                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                                <h3 className="text-xl sm:text-2xl font-black italic tracking-tight text-white uppercase drop-shadow-md leading-none">
                                                    {profile.displayName || profile.name}
                                                </h3>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                {/* Single Active Title Badge */}
                                                <PlayerTitleBadge titleKey={activeTitleKey} size="md" showRarityTag />

                                                {/* Online Status Badge */}
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusStyle.bg}`}>
                                                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                                                    {statusStyle.label}
                                                </div>
                                            </div>

                                            {/* Bio if exists */}
                                            {profile.bio && (
                                                <p className="text-xs text-stone-200 italic bg-stone-950/70 p-3 rounded-xl border border-white/10 mt-1 backdrop-blur-sm shadow-inner">
                                                    "{profile.bio}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </PanelCard>

                            {/* PANEL 2: ESTATÍSTICAS DE COMBATE */}
                            <PanelCard title="Estatísticas de Combate" subtitle="Desempenho acumulado em batalhas de arena" icon={Trophy}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                        <p className="text-stone-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Combates</p>
                                        <p className="text-white font-black text-xl sm:text-2xl font-mono mt-1">{totalMatches}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                        <p className="text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Vitórias</p>
                                        <p className="text-emerald-400 font-black text-xl sm:text-2xl font-mono mt-1">{wins}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                        <p className="text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Derrotas</p>
                                        <p className="text-red-400 font-black text-xl sm:text-2xl font-mono mt-1">{losses}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                        <p className="text-amber-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em]">Taxa Vitórias</p>
                                        <p className="text-amber-400 font-black text-xl sm:text-2xl font-mono mt-1">{winRate}%</p>
                                    </div>
                                </div>
                            </PanelCard>

                            {/* PANEL 3: CLASSIFICAÇÃO COMPETITIVA */}
                            <PanelCard title="Classificação Competitiva" subtitle="Divisão oficial e pontuação de arena" icon={Award}>
                                <SettingRow 
                                    label={`${rankName} ${subRank}`} 
                                    description="DIVISÃO DO TORNEIO COMPETITIVO"
                                >
                                    <span className="text-orange-500 font-black text-base sm:text-lg font-mono tracking-widest bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                        {points.toLocaleString()} PTS
                                    </span>
                                </SettingRow>
                            </PanelCard>

                        </div>
                    )}

                    {/* MODAL FOOTER */}
                    {profile && (
                        <div className="p-4 sm:p-6 border-t border-white/5 bg-stone-950/80 backdrop-blur-md flex flex-wrap gap-3 justify-end items-center shrink-0 relative z-20">
                            {/* Invite to custom room */}
                            {activeRoomId && playerId !== currentUser?.uid && (
                                <button 
                                    onClick={handleSendInvite}
                                    disabled={isSendingInvite || inviteSentSuccess}
                                    className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                                        inviteSentSuccess 
                                            ? 'bg-emerald-600 text-white' 
                                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'
                                    }`}
                                >
                                    {inviteSentSuccess ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            CONVITE ENVIADO!
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            CONVIDAR PARA SALA
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Friendship Action */}
                            {playerId !== currentUser?.uid && (
                                <>
                                    {isFriend ? (
                                        <button 
                                            onClick={handleRemoveFriend}
                                            className="px-6 py-3.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <UserMinus size={16} />
                                            REMOVER AMIGO
                                        </button>
                                    ) : isPending ? (
                                        <button 
                                            disabled
                                            className="px-6 py-3.5 bg-stone-900 text-stone-500 border border-white/5 text-xs font-black uppercase tracking-widest rounded-xl cursor-not-allowed flex items-center gap-2"
                                        >
                                            <UserPlus size={16} />
                                            PEDIDO PENDENTE
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleAddFriend}
                                            className="px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20"
                                        >
                                            <UserPlus size={16} />
                                            ADICIONAR AMIGO
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};


