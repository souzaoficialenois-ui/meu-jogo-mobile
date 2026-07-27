
import React from 'react';
import { Sliders, Globe, Lock, Gamepad2, Sparkles, RefreshCw, Eye, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomConfig } from '../../services/LobbyService';

interface CreateRoomTabProps {
    roomConfig: RoomConfig;
    setRoomConfig: React.Dispatch<React.SetStateAction<RoomConfig>>;
    handleCreateRoom: () => void;
    isCreating: boolean;
    errorMsg: string | null;
    s: (v: number) => number;
    playSFX: (id: string) => void;
}

export const CreateRoomTab: React.FC<CreateRoomTabProps> = ({
    roomConfig,
    setRoomConfig,
    handleCreateRoom,
    isCreating,
    errorMsg,
    s,
    playSFX
}) => {
    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Intro */}
            <div className="flex flex-col gap-2 mb-2">
                <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-widest text-white leading-none">
                    CRIAR NOVA ARENA
                </h3>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-stone-500 opacity-80">
                    Configure as regras e o nome da sua sala de combate
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Left Side: General Settings */}
                <div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    <div className="flex items-center gap-4 mb-8 md:mb-10 relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                            <Sliders className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-widest italic leading-none">
                                GERAL
                            </h3>
                            <p className="text-stone-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                                Identificação e Privacidade
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 md:space-y-8 relative z-10">
                        {/* Room Name Input */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 pl-1">Nome da Sala</label>
                            <div className="relative group/input">
                                <input 
                                    type="text" 
                                    maxLength={20}
                                    value={roomConfig.name}
                                    onChange={e => setRoomConfig(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-stone-950/60 border border-white/5 rounded-xl text-white px-6 py-4 focus:outline-none focus:border-orange-500/40 focus:bg-stone-900/40 transition-all font-bold italic uppercase tracking-wider text-sm"
                                    placeholder="ARENA DE COMBATE"
                                />
                                <div className="absolute bottom-0 left-0 h-[2px] bg-orange-500 scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500 origin-left" />
                            </div>
                        </div>

                        {/* Privacy Toggle */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 pl-1">Tipo de Sala</label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-950/60 border border-white/5 rounded-2xl">
                                <button 
                                    onClick={() => { playSFX('click'); setRoomConfig(prev => ({ ...prev, isPrivate: false })); }}
                                    className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black italic uppercase transition-all tracking-widest text-[10px] md:text-xs ${!roomConfig.isPrivate ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}
                                >
                                    <Globe size={16} /> Público
                                </button>
                                <button 
                                    onClick={() => { playSFX('click'); setRoomConfig(prev => ({ ...prev, isPrivate: true })); }}
                                    className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black italic uppercase transition-all tracking-widest text-[10px] md:text-xs ${roomConfig.isPrivate ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}
                                >
                                    <Lock size={16} /> Privada
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {roomConfig.isPrivate && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-3"
                                >
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 pl-1">Senha de Acesso</label>
                                    <div className="relative group/input">
                                        <input 
                                            type="password" 
                                            value={roomConfig.password}
                                            onChange={e => setRoomConfig(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full bg-stone-950/60 border border-orange-500/20 rounded-xl text-white px-6 py-4 focus:outline-none focus:border-orange-500/50 focus:bg-stone-900/40 transition-all font-bold tracking-widest text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Side: Combat Rules */}
                <div className="bg-stone-900/10 border border-white/5 rounded-[24px] p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    <div className="flex items-center gap-4 mb-8 md:mb-10 relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:scale-105 transition-all duration-300">
                            <Gamepad2 className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-widest italic leading-none">
                                REGRAS
                            </h3>
                            <p className="text-stone-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
                                Limite de Personagens e Equipes
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 pl-1">Tamanho das Equipes</label>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { val: 1, label: '1 VS 1', desc: 'COMBATE CLÁSSICO - DUELO DIRETO', icon: Swords },
                                { val: 2, label: '2 VS 2', desc: 'ESTRATÉGIA EM DUPLA - REVEZAMENTO', icon: Swords },
                                { val: 3, label: '3 VS 3', desc: 'GUERRA SUPREMA - EQUIPE COMPLETA', icon: Swords }
                            ].map(item => (
                                <button
                                    key={item.val}
                                    onClick={() => { playSFX('click'); setRoomConfig(prev => ({ ...prev, maxCharacters: item.val })); }}
                                    className={`
                                        flex items-center justify-between p-5 rounded-2xl border transition-all relative overflow-hidden group/item
                                        ${roomConfig.maxCharacters === item.val 
                                            ? 'bg-orange-600/10 border-orange-500 text-white' 
                                            : 'bg-stone-950/60 border-white/5 text-stone-500 hover:border-white/10 hover:bg-stone-900/40 hover:text-stone-300'}
                                    `}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`p-3 rounded-lg ${roomConfig.maxCharacters === item.val ? 'bg-orange-600 text-white' : 'bg-stone-900 text-stone-600'} transition-all`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className={`font-black italic uppercase text-sm tracking-widest transition-all ${roomConfig.maxCharacters === item.val ? 'text-white' : 'text-stone-400 group-hover/item:text-stone-200'}`}>{item.label}</span>
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider opacity-60 mt-0.5">{item.desc}</span>
                                        </div>
                                    </div>
                                    
                                    {roomConfig.maxCharacters === item.val && (
                                        <motion.div 
                                            layoutId="active-selection-dot"
                                            className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] relative z-10" 
                                        />
                                    )}

                                    {/* Decoration */}
                                    <div className={`absolute right-0 bottom-0 opacity-[0.03] transition-all group-hover/item:opacity-[0.06] ${roomConfig.maxCharacters === item.val ? 'opacity-[0.08]' : ''}`}>
                                        <item.icon size={80} strokeWidth={1} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ERROR MESSAGE */}
            <AnimatePresence>
                {errorMsg && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-red-400 text-center text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md"
                    >
                        {errorMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Actions - Fixed to Bottom on Mobile? No, just keep as a nice footer card */}
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between bg-stone-900/20 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-white/5 gap-6">
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
                    <span className="text-[10px] font-black tracking-[0.3em] text-stone-500 uppercase opacity-70">CONFIRMAÇÃO DA SALA</span>
                    <h4 className="text-sm md:text-base font-black italic text-white uppercase tracking-widest">
                        {roomConfig.name || 'ARENA SEM NOME'} • <span className="text-orange-500">{roomConfig.maxCharacters}v{roomConfig.maxCharacters}</span> • {roomConfig.isPrivate ? 'FECHADA' : 'ABERTA'}
                    </h4>
                </div>
                
                <button 
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className={`
                        relative overflow-hidden px-16 py-6 md:py-7 rounded-[20px] font-black italic uppercase tracking-[0.3em] transition-all flex items-center gap-4 group/btn
                        ${isCreating 
                            ? 'bg-stone-800 text-stone-500 cursor-wait' 
                            : 'bg-orange-600 text-black hover:bg-orange-500 hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(234,88,12,0.2)]'}
                    `}
                >
                    {isCreating ? (
                        <>
                            <RefreshCw className="animate-spin w-5 h-5" />
                            <span>PROCESSANDO...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                            <span>CRIAR AGORA</span>
                        </>
                    )}
                    
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    );
};
