
import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Activity, Hash, Plus, Users, Zap, ArrowLeft, Trash2, UserPlus, LogOut, ShieldCheck, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InviteFriendsDrawer } from './InviteFriendsDrawer';
import { EmoteRadialMenu } from '../emotes/EmoteRadialMenu';
import { EmoteDisplayBubble } from '../emotes/EmoteDisplayBubble';
import { EmoteData } from '../emotes/EmoteTypes';
import { NetworkManager } from '../../services/NetworkManager';

interface ActiveRoomViewProps {
    currentRoom: any;
    playerProfile: any;
    net: any;
    lobby: any;
    myReady: boolean;
    opponentReady: boolean;
    toggleReady: () => void;
    leaveRoom: () => void;
    handleStartSelection: () => void;
    s: (v: number) => number;
    playSFX: (id: string) => void;
    AVATAR_LIST: any[];
    t: (key: string) => string;
    isSpectator?: boolean;
}

export const ActiveRoomView: React.FC<ActiveRoomViewProps> = ({
    currentRoom,
    playerProfile,
    net,
    lobby,
    myReady,
    opponentReady,
    toggleReady,
    leaveRoom,
    handleStartSelection,
    s,
    playSFX,
    AVATAR_LIST,
    t,
    isSpectator = false
}) => {
    const isHost = net.isHost;

    const hostAvatar = AVATAR_LIST.find(a => a.id === (isHost ? playerProfile?.avatarId : currentRoom?.hostAvatar))?.url;
    const guestAvatar = AVATAR_LIST.find(a => a.id === (!isHost ? playerProfile?.avatarId : currentRoom?.guestAvatar))?.url;

    const hostName = isHost ? playerProfile?.name : currentRoom?.hostName;
    const guestName = !isHost ? playerProfile?.name : currentRoom?.guestName;

    const hostTitle = isHost ? playerProfile?.activeTitle : currentRoom?.hostTitle;
    const guestTitle = !isHost ? playerProfile?.activeTitle : currentRoom?.guestTitle;

    const isPt = true; // Assuming PT as per request and context
    const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
    const [activeEmotes, setActiveEmotes] = useState<{
        p1?: { emote: EmoteData; playerName: string } | null;
        p2?: { emote: EmoteData; playerName: string } | null;
    }>({});

    const triggerEmote = (side: 'p1' | 'p2', emote: EmoteData, name: string) => {
        setActiveEmotes(prev => ({
            ...prev,
            [side]: { emote, playerName: name }
        }));
        setTimeout(() => {
            setActiveEmotes(prev => ({
                ...prev,
                [side]: null
            }));
        }, 3500);
    };

    const handleSelectEmote = (emote: EmoteData) => {
        const side = isHost ? 'p1' : 'p2';
        const myName = playerProfile?.name || (isHost ? hostName : (guestName || "P2"));
        triggerEmote(side, emote, myName);

        NetworkManager.getInstance().sendEmote({
            emote,
            side,
            playerName: myName
        });
    };

    useEffect(() => {
        const net = NetworkManager.getInstance();
        net.onEmoteReceived = (data: any) => {
            if (data?.emote) {
                const remoteSide = data.side || (isHost ? 'p2' : 'p1');
                triggerEmote(remoteSide, data.emote, data.playerName || (remoteSide === 'p1' ? hostName : (guestName || "P2")));
            }
        };
    }, [isHost, hostName, guestName]);

    return (
        <div className="w-full h-full flex flex-col bg-stone-950 relative overflow-hidden font-sans text-stone-200">
            {/* Background Layer (Same as Settings) */}
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/modos/m3.png" alt="Background" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute right-[-5%] bottom-[-5%] opacity-40 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/goku/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* HEADER (Same as Settings) */}
            <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0"
            >
                <div className="flex items-center gap-3 md:gap-8">
                    <button 
                        onClick={() => { playSFX('cancel'); leaveRoom(); }}
                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
                    >
                        <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300 group-hover:text-white transition-colors" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                            {isPt ? 'ARENA DE COMBATE' : 'COMBAT ARENA'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-orange-500 uppercase">{currentRoom?.roomName || 'SALA'}</span>
                            <div className="w-1 h-1 rounded-full bg-stone-600" />
                            <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-stone-500 uppercase">ID: {currentRoom?.id?.substring(0, 8)}</span>
                            {currentRoom?.spectators && currentRoom.spectators.length > 0 && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-stone-600" />
                                    <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase flex items-center gap-1">
                                        <Eye size={12} /> {currentRoom.spectators.length} ESPECTADORES
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                    <button 
                        onClick={() => {
                            playSFX('confirm');
                            setIsInviteDrawerOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-900/40 hover:bg-stone-800/60 border border-white/5 hover:border-orange-500/40 rounded-lg text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                    >
                        <UserPlus size={12} />
                        {isPt ? 'CONVIDAR' : 'INVITE'}
                    </button>
                </div>
            </motion.header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full flex flex-col md:flex-row items-center justify-center relative z-10 p-4 md:p-12 gap-8 md:gap-16">
                
                {/* HOST CARD (Styled like PanelCard) */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-full max-w-sm bg-stone-900/10 border border-white/5 rounded-[32px] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
                    
                    <div className="flex flex-col items-center gap-6 relative z-10">
                        {/* Title Badge if exists */}
                        {hostTitle && (
                            <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                                <span className="text-[9px] font-black text-orange-400 uppercase tracking-[0.2em]">{hostTitle}</span>
                            </div>
                        )}

                        {/* Avatar Frame */}
                        <div className="relative group/avatar">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-stone-950 border-2 border-white/5 overflow-hidden transition-all duration-500 group-hover/avatar:border-orange-500/50 group-hover/avatar:scale-105 shadow-2xl">
                                <img 
                                    src={hostAvatar || "/Assets/avatar/retrato/1.png"} 
                                    className={`w-full h-full object-cover transition-all duration-700 ${ (isHost ? myReady : opponentReady) ? 'grayscale-0 scale-110' : 'grayscale group-hover/avatar:grayscale-0' }`} 
                                    alt="" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                            </div>
                            
                            {/* Host Badge */}
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg border border-orange-400/30 rotate-12 group-hover/avatar:rotate-0 transition-transform">
                                <Crown size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-widest italic leading-none">
                                {hostName}
                            </h3>
                            <div className="px-4 py-1.5 bg-stone-950/60 border border-white/5 rounded-full inline-flex items-center gap-2">
                                <ShieldCheck size={12} className="text-orange-500" />
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                    RANK: <span className="text-white">{isHost ? (t(`rank_${(playerProfile?.ranked?.br?.tier || 'APPRENTICE').toLowerCase()}`) || 'APPRENTICE') : (t(`rank_${(currentRoom?.hostRankTier || 'APPRENTICE').toLowerCase()}`) || 'APPRENTICE')}</span>
                                </span>
                            </div>
                        </div>

                        {/* Ready Status indicator */}
                        <div className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-500 ${ (isHost ? myReady : opponentReady) ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'bg-stone-950 border-white/5 text-stone-600' }`}>
                            { (isHost ? myReady : opponentReady) ? <CheckCircle2 size={18} /> : <Activity size={18} className="animate-pulse" /> }
                            <span className="text-xs font-black uppercase tracking-[0.2em] italic">
                                { (isHost ? myReady : opponentReady) ? 'PREPARADO' : 'AGUARDANDO' }
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* VS NODE (Styled like settings accents) */}
                <div className="flex flex-col items-center gap-6 md:gap-8 py-4">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                        {/* Outer rotating rings */}
                        <div className="absolute inset-0 border-[3px] border-stone-800 border-t-orange-600 rounded-full animate-spin [animation-duration:3s]" />
                        <div className="absolute inset-3 border-[1px] border-dashed border-stone-700 rounded-full animate-spin [animation-duration:10s] direction-reverse" />
                        
                        {/* VS Center */}
                        <div className="relative z-10 text-5xl md:text-7xl font-black italic text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                            VS
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em]">REGRA DE TIME</span>
                        <div className="px-6 py-2 bg-orange-600/10 border border-orange-500/20 rounded-xl backdrop-blur-md">
                            <span className="text-sm font-black text-orange-500 uppercase italic tracking-widest">{currentRoom?.maxCharacters} VS {currentRoom?.maxCharacters}</span>
                        </div>
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
                    </div>
                </div>

                {/* GUEST CARD */}
                <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`w-full max-w-sm bg-stone-900/10 border rounded-[32px] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group transition-all duration-500 ${ currentRoom?.guestId ? 'border-white/5' : 'border-dashed border-white/10 opacity-60' }`}
                >
                    {currentRoom?.guestId && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />}
                    
                    <div className="h-full flex flex-col items-center justify-center gap-6 relative z-10">
                        {currentRoom?.guestId ? (
                            <>
                                {/* Title Badge if exists */}
                                {guestTitle && (
                                    <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                        <span className="text-[9px] font-black text-green-400 uppercase tracking-[0.2em]">{guestTitle}</span>
                                    </div>
                                )}

                                <div className="relative group/avatar">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-stone-950 border-2 border-white/5 overflow-hidden transition-all duration-500 group-hover/avatar:border-green-500/50 group-hover/avatar:scale-105 shadow-2xl">
                                        <img 
                                            src={guestAvatar || "/Assets/avatar/retrato/1.png"} 
                                            className={`w-full h-full object-cover transition-all duration-700 ${ (!isHost ? myReady : opponentReady) ? 'grayscale-0 scale-110' : 'grayscale group-hover/avatar:grayscale-0' }`} 
                                            alt="" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <h3 className="text-white font-black text-2xl md:text-3xl uppercase tracking-widest italic leading-none">
                                        {guestName}
                                    </h3>
                                    <div className="px-4 py-1.5 bg-stone-950/60 border border-white/5 rounded-full inline-flex items-center gap-2">
                                        <Zap size={12} className="text-green-500" />
                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                            RANK: <span className="text-white">{!isHost ? (t(`rank_${(playerProfile?.ranked?.br?.tier || 'APPRENTICE').toLowerCase()}`) || 'APPRENTICE') : (t(`rank_${(currentRoom?.guestRankTier || 'APPRENTICE').toLowerCase()}`) || 'APPRENTICE')}</span>
                                        </span>
                                    </div>
                                </div>

                                {isHost && (
                                    <button 
                                        onClick={async () => {
                                            playSFX('cancel');
                                            await lobby.leaveRoom(currentRoom.id, currentRoom.guestId);
                                        }}
                                        className="text-[10px] font-black text-red-500/40 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        EXPULSAR OPONENTE
                                    </button>
                                )}

                                <div className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all duration-500 ${ (!isHost ? myReady : opponentReady) ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'bg-stone-950 border-white/5 text-stone-600' }`}>
                                    { (!isHost ? myReady : opponentReady) ? <CheckCircle2 size={18} /> : <Activity size={18} className="animate-pulse" /> }
                                    <span className="text-xs font-black uppercase tracking-[0.2em] italic">
                                        { (!isHost ? myReady : opponentReady) ? 'PREPARADO' : 'AGUARDANDO' }
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                <div className="w-24 h-24 rounded-full border-2 border-dashed border-stone-800 flex items-center justify-center text-stone-800">
                                    <Users size={40} />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-stone-700 font-black uppercase tracking-widest">BUSCANDO...</h4>
                                    <p className="text-[8px] font-black text-stone-800 uppercase tracking-[0.2em] max-w-[150px] mt-2">AGUARDANDO A ENTRADA DE UM DESAFIANTE NO CANAL</p>
                                </div>
                                <button
                                    onClick={() => {
                                        playSFX('click');
                                        setIsInviteDrawerOpen(true);
                                    }}
                                    className="mt-2 px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                                >
                                    <UserPlus size={14} />
                                    CONVIDAR AMIGOS
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* FOOTER ACTIONS (Same as Settings) */}
            <div className="relative z-50 p-6 md:p-10 bg-stone-900/20 backdrop-blur-3xl border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    <div className="hidden md:flex items-center gap-6">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-stone-500 uppercase tracking-[0.3em]">ESTADO DA CONEXÃO</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-black text-stone-300 uppercase italic tracking-widest">SERVIDOR OPERANDO EM CANAL SEGURO</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {isSpectator ? (
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="px-8 py-5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-300 font-black italic uppercase tracking-[0.2em] text-xs flex items-center gap-3">
                                    <Eye size={18} className="animate-pulse text-purple-400" />
                                    <span>VOCÊ ESTÁ COMO ESPECTADOR</span>
                                </div>
                                <button
                                    onClick={() => { playSFX('cancel'); leaveRoom(); }}
                                    className="px-8 py-5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-2xl border border-white/10 font-black italic uppercase tracking-widest text-xs transition-all active:scale-95 cursor-pointer"
                                >
                                    SAIR DA SALA
                                </button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={toggleReady}
                                    className={`flex-1 md:flex-none px-12 md:px-20 py-6 rounded-2xl font-black italic uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${myReady ? 'bg-stone-800 text-stone-500 border border-white/5' : 'bg-orange-600 text-black hover:bg-orange-500 shadow-[0_0_40px_rgba(234,88,12,0.3)]'}`}
                                >
                                    {myReady ? 'VOCÊ ESTÁ PRONTO' : 'ESTOU PRONTO'}
                                </button>

                                <AnimatePresence>
                                    {isHost && myReady && opponentReady && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                            onClick={handleStartSelection}
                                            className="px-10 md:px-16 py-6 bg-white text-black rounded-2xl font-black italic uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group cursor-pointer"
                                        >
                                            <Zap size={20} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                                            <span>{isPt ? 'INICIAR' : 'START'}</span>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <InviteFriendsDrawer 
                isOpen={isInviteDrawerOpen} 
                onClose={() => setIsInviteDrawerOpen(false)} 
                currentRoom={currentRoom} 
            />

            {/* Emote Bubble & Radial Menu */}
            <EmoteDisplayBubble emote={activeEmotes.p1?.emote || null} playerName={activeEmotes.p1?.playerName || hostName} position="top-left" />
            <EmoteDisplayBubble emote={activeEmotes.p2?.emote || null} playerName={activeEmotes.p2?.playerName || (guestName || "P2")} position="top-right" />
            <EmoteRadialMenu onSelectEmote={handleSelectEmote} positionClassName="bottom-8 right-8" />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3836; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #504945; }
            `}</style>
        </div>
    );
};
