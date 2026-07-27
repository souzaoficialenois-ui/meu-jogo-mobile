
import React from 'react';
import { Globe, Users, Lock, RefreshCw, Search, Play, Swords, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RoomBrowserTabProps {
    rooms: any[];
    refreshRooms: () => void;
    joinRoom: (room: any) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    errorMsg: string | null;
    s: (v: number) => number;
    playSFX: (id: string) => void;
}

export const RoomBrowserTab: React.FC<RoomBrowserTabProps> = ({
    rooms,
    refreshRooms,
    joinRoom,
    searchQuery,
    setSearchQuery,
    errorMsg,
    s,
    playSFX
}) => {
    const filteredRooms = rooms.filter(r => 
        r.roomName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.includes(searchQuery)
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-900/10 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="BUSCAR POR NOME OU ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-950/60 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-xs focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-stone-700 font-black tracking-widest uppercase italic"
                    />
                </div>
                
                <button 
                    onClick={() => { refreshRooms(); playSFX('click'); }}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-stone-900/40 hover:bg-stone-800/60 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-stone-400 hover:text-white group"
                >
                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                    ATUALIZAR LISTA
                </button>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredRooms.length > 0 ? (
                        filteredRooms.map((room) => (
                            <motion.div
                                key={room.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="group relative bg-stone-900/10 backdrop-blur-xl border border-white/5 rounded-[24px] overflow-hidden hover:border-orange-500/30 transition-all p-6 flex items-center gap-6"
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <div className="absolute top-0 left-0 h-full w-[2px] bg-orange-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                
                                {/* Room Icon/Avatar */}
                                <div className="w-20 h-20 rounded-2xl bg-stone-950 flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden group-hover:border-orange-500/20 transition-all">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Swords className="text-stone-800 group-hover:text-orange-500 transition-all duration-500" size={32} strokeWidth={1.5} />
                                    
                                    {/* Small decorations */}
                                    <div className="absolute top-1 left-1 w-1 h-1 bg-stone-800 rounded-full" />
                                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-stone-800 rounded-full" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-white font-black italic uppercase truncate text-lg tracking-widest">{room.roomName}</h4>
                                        {room.isPrivate && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-1.5 rounded-lg">
                                                <Lock size={12} className="text-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md bg-stone-950 flex items-center justify-center border border-white/5">
                                                <Globe size={10} className="text-stone-600" />
                                            </div>
                                            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{room.hostName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md bg-stone-950 flex items-center justify-center border border-white/5">
                                                <Users size={10} className="text-orange-500" />
                                            </div>
                                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{room.maxCharacters}v{room.maxCharacters}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md bg-stone-950 flex items-center justify-center border border-white/5">
                                                <Hash size={10} className="text-stone-600" />
                                            </div>
                                            <span className="text-[9px] font-black text-stone-600 uppercase tracking-widest">{room.id.substring(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => { playSFX('confirm'); joinRoom(room); }}
                                    className="bg-orange-600 hover:bg-orange-500 text-black p-4 rounded-2xl transition-all shadow-xl shadow-orange-600/10 hover:shadow-orange-600/20 active:scale-90 relative overflow-hidden group/join"
                                >
                                    <Play size={20} fill="currentColor" className="relative z-10" />
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/join:translate-y-0 transition-transform duration-300" />
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-24 flex flex-col items-center justify-center text-stone-800 border-2 border-dashed border-stone-900 rounded-[32px] bg-stone-900/5"
                        >
                            <div className="w-20 h-20 rounded-full border-2 border-stone-900 flex items-center justify-center mb-6">
                                <Globe className="w-10 h-10 opacity-40" />
                            </div>
                            <span className="font-black uppercase tracking-[0.3em] text-sm text-stone-600">Nenhuma arena encontrada</span>
                            <span className="text-[10px] font-black opacity-40 mt-3 tracking-widest">TENTE BUSCAR POR OUTROS TERMOS OU CRIE SUA PRÓPRIA SALA</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
