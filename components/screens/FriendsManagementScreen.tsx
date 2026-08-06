import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, PlayerProfile } from '../../types';
import { 
    Users, 
    Search, 
    Plus, 
    History, 
    ChevronRight, 
    X, 
    Trophy, 
    UserPlus, 
    UserX, 
    Check,
    RotateCcw,
    Globe,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioManager } from '../../services/AudioManager';
import { AVATAR_LIST } from '../../personagens/CharacterDatabase';

type FriendsTab = 'FRIENDS' | 'RECENT' | 'ADD';

export const FriendsManagementScreen: React.FC = () => {
    const { 
        changeScene, 
        friends, 
        fetchDiscoverablePlayers,
        sendFriendRequest,
        acceptFriendRequest,
        removeFriend,
        currentUser,
        setShowProfileId,
        settings,
        t
    } = useSceneManager();

    const isPt = settings.language === 'pt';
    const [activeTab, setActiveTab] = useState<FriendsTab>('ADD');
    const [searchQuery, setSearchQuery] = useState('');
    const [discoverablePlayers, setDiscoverablePlayers] = useState<PlayerProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const pendingRequests = friends.filter(f => f.status === 'PENDING');
    const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');

    useEffect(() => {
        if (pendingRequests.length > 0) {
            setIsRequestModalOpen(true);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'ADD') {
            handleSearch();
        }
    }, [activeTab]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const players = await fetchDiscoverablePlayers();
            // Deduplicate discoverable players to prevent key collisions
            const unique = new Map<string, PlayerProfile>();
            players.forEach(p => unique.set(p.playerId, p));
            setDiscoverablePlayers(Array.from(unique.values()));
        } catch (e) {
            console.error(e);
        }
        setIsSearching(false);
    };

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        changeScene(SceneName.MAIN_MENU);
    };

    const handleTabClick = (tab: FriendsTab) => {
        AudioManager.getInstance().playSFX('navigation');
        setActiveTab(tab);
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m4.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute right-[-5%] bottom-[-5%] opacity-30 scale-[1.1] blur-[1px] transform -scale-x-100">
                    <img src="/Assets/personagens/vegeta/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* HEADER */}
            <motion.header className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0">
                <div className="flex items-center gap-3 md:gap-8">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                    </button>
                    <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                        {isPt ? 'AMIGOS' : 'FRIENDS'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-stone-900/60 backdrop-blur-md border border-white/5 h-10 md:h-14 rounded-2xl items-center px-4 md:px-6 gap-3 focus-within:border-orange-500/50 transition-all w-48 md:w-80 shadow-2xl">
                        <Search size={20} className="text-stone-500" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isPt ? 'BUSCAR...' : 'SEARCH...'}
                            className="bg-transparent flex-1 focus:outline-none text-xs md:text-sm font-black uppercase placeholder:text-stone-700 text-stone-100 tracking-wider"
                        />
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
                                { id: 'ADD', label: t('friends_tab_discover'), icon: UserPlus },
                                { id: 'FRIENDS', label: t('friends_tab_allies'), icon: Users, badge: acceptedFriends.length },
                                { id: 'RECENT', label: t('friends_tab_history'), icon: History }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id as FriendsTab)}
                                    className={`
                                        group relative h-14 flex items-center px-6 transition-all rounded-xl overflow-hidden
                                        ${activeTab === tab.id ? 'bg-orange-600/20 text-white' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex items-center gap-4 font-black italic uppercase text-sm tracking-[0.15em] z-10 w-full">
                                        <tab.icon size={20} className={`${activeTab === tab.id ? 'text-orange-500' : 'text-stone-500'}`} />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {tab.badge !== undefined && tab.badge > 0 && activeTab !== tab.id && (
                                            <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        )}
                                    </div>
                                    {activeTab === tab.id && (
                                        <motion.div 
                                            layoutId="friends-sidebar-active"
                                            className="absolute inset-y-0 left-0 w-1 bg-orange-500 z-0"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {pendingRequests.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => { AudioManager.getInstance().playSFX('confirm'); setIsRequestModalOpen(true); }}
                                className="w-full flex items-center justify-between py-5 px-6 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 rounded-2xl text-red-500 uppercase font-black italic transition-all shadow-xl active:scale-95 group"
                            >
                                <div className="flex items-center gap-3">
                                    <UserPlus size={18} />
                                    <span className="tracking-[0.2em] text-xs">{t('friends_btn_requests')}</span>
                                </div>
                                <span className="bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black">{pendingRequests.length}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 overflow-y-auto custom-scrollbar pr-2"
                        >
                            {activeTab === 'ADD' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em] mb-1">{isPt ? 'EXPLORAÇÃO' : 'EXPLORATION'}</span>
                                            <h3 className="text-3xl font-black italic uppercase text-white">{t('friends_recommended_title')}</h3>
                                        </div>
                                        <button 
                                            onClick={handleSearch}
                                            className="p-4 bg-stone-900 border border-white/5 hover:bg-stone-800 rounded-2xl transition-all shadow-xl active:scale-90"
                                        >
                                            <RotateCcw size={20} className={`text-stone-400 ${isSearching ? 'animate-spin text-orange-500' : ''}`} />
                                        </button>
                                    </div>

                                    {isSearching ? (
                                        <div className="h-full flex flex-col items-center justify-center py-40 gap-6 text-stone-500">
                                            <RotateCcw size={48} className="animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-widest">{t('friends_searching_opponents')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                                            {discoverablePlayers
                                                .filter(p => p.playerId !== currentUser?.uid)
                                                .filter(p => !friends.some(f => f.friendId === p.playerId))
                                                .filter(p => {
                                                    const search = searchQuery.toLowerCase();
                                                    return (p.name || '').toLowerCase().includes(search) || (p.playerId || '').toLowerCase().includes(search);
                                                })
                                                .map((p, idx) => (
                                                    <PlayerCard 
                                                        key={`disc-${p.playerId}-${idx}`} 
                                                        player={p} 
                                                        onAdd={() => sendFriendRequest(p.playerId)} 
                                                        onProfile={() => setShowProfileId(p.playerId)}
                                                        t={t}
                                                    />
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'FRIENDS' && (
                                <div className="space-y-6 pb-20">
                                    <div className="flex flex-col mb-10">
                                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em] mb-1">{isPt ? 'SQUADRON' : 'SQUADRON'}</span>
                                        <h3 className="text-3xl font-black italic uppercase text-white">{t('friends_allies_network')} ({acceptedFriends.length})</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {acceptedFriends.map((f, idx) => (
                                            <FriendListItem 
                                                key={`friend-${f.friendId}-${idx}`} 
                                                friend={f} 
                                                onRemove={() => removeFriend(f.friendId)} 
                                                onProfile={() => setShowProfileId(f.friendId)}
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'RECENT' && (
                                <div className="h-full flex flex-col items-center justify-center py-40 opacity-50 grayscale text-stone-700">
                                    <History size={80} className="mb-6" />
                                    <p className="text-xl font-black italic uppercase tracking-[0.4em]">{t('friends_empty_history')}</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* REQUEST MODAL */}
            <AnimatePresence>
                {isRequestModalOpen && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRequestModalOpen(false)}
                            className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-stone-900 border border-white/10 w-full max-w-3xl overflow-hidden relative z-10 rounded-[32px] shadow-2xl"
                        >
                            <div className="h-24 bg-stone-950/40 border-b border-white/5 flex items-center justify-between px-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] mb-1">{isPt ? 'PENDENTE' : 'PENDING'}</span>
                                    <h3 className="font-black italic uppercase text-3xl tracking-widest text-white">{t('alliance_beacon_main')} <span className="text-red-500">{t('alliance_beacon_sub')}</span></h3>
                                </div>
                                <button 
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-stone-400"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="p-10 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4">
                                {pendingRequests.map((req, idx) => (
                                    <div key={`req-${req.friendId}-${idx}`} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-stone-950 rounded-2xl overflow-hidden border border-white/5">
                                                <img 
                                                    src={AVATAR_LIST.find(a => a.id === req.avatarId)?.url || "/Assets/avatar/retrato/1.png"} 
                                                    className="w-full h-full object-cover filter contrast-125" 
                                                    alt=""
                                                />
                                            </div>
                                            <div>
                                                <span className="text-2xl font-black italic uppercase text-white">{req.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => removeFriend(req.friendId)}
                                                className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-stone-400 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <X size={24} />
                                            </button>
                                            <button 
                                                onClick={() => { acceptFriendRequest(req.friendId); AudioManager.getInstance().playSFX('confirm'); }}
                                                className="h-14 px-8 bg-orange-600 hover:bg-orange-500 border border-orange-400 rounded-2xl flex items-center gap-3 text-white transition-all shadow-xl"
                                            >
                                                <Check size={22} />
                                                <span className="font-black uppercase text-sm italic">{t('friends_accept_btn')}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

const PlayerCard: React.FC<{ player: PlayerProfile, onAdd: () => void, onProfile: () => void, t: any }> = ({ player, onAdd, onProfile, t }) => (
    <motion.div className="bg-stone-900/10 border border-white/5 rounded-[28px] overflow-hidden flex h-40 shadow-2xl backdrop-blur-md hover:border-orange-500/30 transition-all duration-300">
        <div onClick={onProfile} className="w-36 h-full bg-stone-950/20 border-r border-white/5 relative flex items-center justify-center cursor-pointer overflow-hidden group">
            <img 
                src={AVATAR_LIST.find(a => a.id === player.avatarId)?.url || "/Assets/avatar/retrato/1.png"} 
                className="w-full h-full object-cover filter contrast-125 group-hover:scale-110 transition-all duration-500" 
                alt=""
            />
        </div>
        <div className="flex-1 p-6 flex flex-col justify-between relative">
            <div className="absolute top-4 right-4">
                <button onClick={onAdd} className="w-11 h-11 bg-white/5 hover:bg-orange-500 border border-white/5 rounded-xl flex items-center justify-center transition-all text-stone-400 hover:text-white">
                    <UserPlus size={20} />
                </button>
            </div>
            <div className="pr-12">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-orange-600/20 border border-orange-500/30 text-[9px] text-orange-500 font-black uppercase rounded">ID {player.numericId || '0000'}</span>
                    {player.activeTitle && (
                        <span className="text-[8px] text-orange-400/60 font-black uppercase tracking-widest truncate max-w-[100px]">{player.activeTitle}</span>
                    )}
                </div>
                <h4 onClick={onProfile} className="text-2xl font-black italic uppercase text-white truncate hover:text-orange-400 transition-colors cursor-pointer leading-tight">{player.name}</h4>
                {player.ranked?.br?.tier && (
                    <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest block mt-1">{player.ranked.br.tier.replace('_', ' ')}</span>
                )}
            </div>
            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-2xl font-black italic text-stone-200 leading-none">{player.wins || 0}</span>
                    <span className="text-[9px] text-stone-500 uppercase font-black tracking-widest">{t('profile_stats_wins')}</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const FriendListItem: React.FC<{ friend: any, onRemove: () => void, onProfile: () => void, t: any }> = ({ friend, onRemove, onProfile, t }) => (
    <motion.div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-5 flex items-center justify-between group hover:border-orange-500/30 transition-all shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-6">
            <div onClick={onProfile} className="w-20 h-20 bg-stone-950/40 border border-white/5 rounded-2xl overflow-hidden relative cursor-pointer group/av">
                <img 
                    src={AVATAR_LIST.find(a => a.id === friend.avatarId)?.url || "/Assets/avatar/retrato/1.png"} 
                    className="w-full h-full object-cover filter contrast-125 group-hover/av:scale-110 transition-all duration-500" 
                    alt=""
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-orange-500 border-2 border-stone-900 rounded-full" />
            </div>
            <div>
                {friend.title && (
                    <span className="text-[8px] text-orange-500/60 font-black uppercase tracking-widest block mb-1">{friend.title}</span>
                )}
                <h4 onClick={onProfile} className="text-2xl font-black italic uppercase text-white leading-none hover:text-orange-400 transition-colors cursor-pointer">{friend.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">
                        {friend.rankTier ? friend.rankTier.replace('_', ' ') : t('friends_status_in_combat')}
                    </span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            <button onClick={onRemove} className="w-12 h-12 bg-white/5 hover:bg-red-500 border border-white/5 rounded-xl flex items-center justify-center text-stone-400 hover:text-white transition-all">
                <UserX size={22} />
            </button>
        </div>
    </motion.div>
);
