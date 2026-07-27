import React, { useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { AVATAR_LIST, BACKGROUND_LIST } from '../../constants';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Save, 
    User, 
    Image as ImageIcon,
    CheckCircle2,
    Zap,
    Shield,
    Lock,
    ChevronLeft
} from 'lucide-react';

type ProfileTabType = 'IDENTITY' | 'AVATARS' | 'BACKGROUNDS';

export const ProfileEditScreen: React.FC = () => {
    const { playerProfile, updateProfile, changeScene, t, isOfflineMode, isItemUnlocked, settings } = useSceneManager();
    const isPt = settings.language === 'pt';
    const [name, setName] = useState(playerProfile?.name || '');
    const [bio, setBio] = useState(playerProfile?.bio || '');
    const [avatarId, setAvatarId] = useState(playerProfile?.avatarId || '1');
    const [backgroundId, setBackgroundId] = useState(playerProfile?.backgroundId || '1');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTabType>('IDENTITY');

    const handleSave = async () => {
        if (isOfflineMode) {
            AudioManager.getInstance().playSFX('cancel');
            return;
        }
        setIsSaving(true);
        AudioManager.getInstance().playSFX('confirm');
        try {
            updateProfile(name, avatarId, backgroundId);
            setTimeout(() => {
                changeScene(SceneName.PROFILE);
            }, 500);
        } catch (error) {
            console.error("Save failed:", error);
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        AudioManager.getInstance().playSFX('cancel');
        changeScene(SceneName.PROFILE);
    };

    const tabList = [
        { id: 'IDENTITY' as ProfileTabType, label: isPt ? 'IDENTIDADE' : 'IDENTITY', icon: User },
        { id: 'AVATARS' as ProfileTabType, label: isPt ? 'AVATARES' : 'AVATARS', icon: ImageIcon },
        { id: 'BACKGROUNDS' as ProfileTabType, label: isPt ? 'FUNDOS' : 'BACKGROUNDS', icon: ImageIcon },
    ];

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m7.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-stone-950/60" />
                <div className="absolute left-[-5%] bottom-[-5%] opacity-30 scale-[1.1] blur-[1px]">
                    <img src="/Assets/personagens/gohan/parado.gif" className="h-[90vh] w-auto object-contain" alt="" />
                </div>
            </div>

            <div className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* HEADER */}
            <motion.header className="h-16 md:h-24 px-4 md:px-10 flex items-center justify-between relative z-50 shrink-0">
                <div className="flex items-center gap-3 md:gap-8">
                    <button 
                        onClick={handleBack}
                        className="w-12 h-12 md:w-16 md:h-16 bg-stone-900/40 hover:bg-stone-800/60 flex items-center justify-center border border-white/5 rounded-xl transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-stone-300" />
                    </button>
                    <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-widest text-white drop-shadow-2xl">
                        {isPt ? 'EDITAR PERFIL' : 'EDIT PROFILE'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || isOfflineMode}
                        className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 transition-all border font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 cursor-pointer ${
                            isSaving || isOfflineMode
                            ? 'bg-stone-900/40 border-white/5 text-stone-700 cursor-not-allowed opacity-50' 
                            : 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white'
                        }`}
                    >
                        <Save size={18} className={isSaving ? 'animate-pulse' : ''} />
                        <span>{isSaving ? (isPt ? 'SALVANDO...' : 'SAVING...') : (isPt ? 'SALVAR' : 'SAVE')}</span>
                    </button>
                </div>
            </motion.header>

            {/* MAIN CONTENT */}
            <main className="flex-1 w-full flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-6 md:gap-8">
                
                {/* SIDEBAR */}
                <motion.div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none snap-x w-full md:w-72 shrink-0">
                    {tabList.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); AudioManager.getInstance().playSFX('click'); }}
                            className={`
                                relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all min-w-[170px] md:w-full shrink-0 group cursor-pointer
                                ${activeTab === tab.id ? 'bg-orange-600/20 text-white font-black italic' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
                            `}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-orange-500' : ''}`} />
                            <span className="text-xs uppercase tracking-[0.2em] select-none truncate font-black">{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 hidden md:block" />}
                        </button>
                    ))}

                    {/* Preview Mini Box */}
                    <div className="mt-auto hidden md:flex flex-col gap-4 p-6 bg-stone-900/40 border border-white/5 rounded-3xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{isPt ? 'PRÉ-VISUALIZAÇÃO' : 'PREVIEW'}</span>
                        <div className="w-full aspect-square bg-stone-950 rounded-2xl overflow-hidden relative border border-white/5 shadow-inner">
                             {BACKGROUND_LIST.find(b => b.id === backgroundId)?.url && (
                                <img src={BACKGROUND_LIST.find(b => b.id === backgroundId)?.url} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" alt="" />
                            )}
                            <img src={AVATAR_LIST.find(a => a.id === avatarId)?.url} className="w-full h-full object-contain relative z-10 contrast-125 scale-110 p-2" alt="" />
                        </div>
                    </div>
                </motion.div>

                {/* VIEWPORT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8 pb-20"
                        >
                            {activeTab === 'IDENTITY' && (
                                <div className="space-y-8">
                                    <div className="bg-stone-900/20 border border-white/5 rounded-[32px] p-8 md:p-10 space-y-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                            <User className="text-orange-500" size={24} />
                                            <h3 className="text-xl font-black uppercase tracking-widest italic text-white">{isPt ? 'IDENTIDADE' : 'IDENTITY'}</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest ml-1">{isPt ? 'NOME DE GUERREIRO' : 'WARRIOR NAME'}</label>
                                            <input 
                                                type="text" 
                                                value={name}
                                                onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 16))}
                                                className="w-full bg-stone-900/40 border border-white/5 focus:border-orange-500/50 rounded-2xl px-6 py-5 text-2xl font-black italic text-white focus:outline-none transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-stone-600 uppercase tracking-widest ml-1">{isPt ? 'BIOGRAFIA' : 'BIOGRAPHY'}</label>
                                            <textarea 
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value.slice(0, 120))}
                                                className="w-full h-32 bg-stone-900/40 border border-white/5 focus:border-orange-500/50 rounded-2xl px-6 py-5 text-lg font-bold italic text-stone-300 focus:outline-none transition-all resize-none shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-stone-900/20 border border-white/5 rounded-[28px] p-8 flex flex-col gap-4 shadow-2xl backdrop-blur-md">
                                            <Shield className="w-8 h-8 text-orange-500" />
                                            <div>
                                                <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest block mb-2">{isPt ? 'RANKING' : 'RANKING'}</span>
                                                <span className="text-2xl font-black italic uppercase text-white tracking-widest">ELITE WARRIOR</span>
                                            </div>
                                        </div>
                                        <div className="bg-stone-900/20 border border-white/5 rounded-[28px] p-8 flex flex-col gap-4 shadow-2xl backdrop-blur-md">
                                            <Zap className="w-8 h-8 text-orange-500" />
                                            <div>
                                                <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest block mb-2">{isPt ? 'ID ÚNICO' : 'UNIQUE ID'}</span>
                                                <span className="text-2xl font-black italic text-white tracking-widest">#{playerProfile?.numericId?.slice(-6) || 'XXXXXX'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'AVATARS' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <ImageIcon className="text-orange-500" size={24} />
                                        <h3 className="text-xl font-black uppercase tracking-widest italic text-white">{isPt ? 'SELECIONAR AVATAR' : 'SELECT AVATAR'}</h3>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {AVATAR_LIST.map((avatar) => (
                                            <AssetButton 
                                                key={avatar.id}
                                                id={avatar.id}
                                                url={avatar.url}
                                                isSelected={avatarId === avatar.id}
                                                isLocked={!isItemUnlocked(`avatar:${avatar.id}`)}
                                                onSelect={() => setAvatarId(avatar.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'BACKGROUNDS' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <ImageIcon className="text-orange-500" size={24} />
                                        <h3 className="text-xl font-black uppercase tracking-widest italic text-white">{isPt ? 'SELECIONAR FUNDO' : 'SELECT BACKGROUND'}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {BACKGROUND_LIST.map((bg) => (
                                            <AssetButton 
                                                key={bg.id}
                                                id={bg.id}
                                                url={bg.url}
                                                isSelected={backgroundId === bg.id}
                                                isLocked={!isItemUnlocked(`bg:${bg.id}`)}
                                                onSelect={() => setBackgroundId(bg.id)}
                                                isLarge
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c3836; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #504945; }
                
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

const AssetButton = ({ id, url, isSelected, isLocked, onSelect, isLarge }: any) => (
    <button 
        onClick={() => {
            if (isLocked) { AudioManager.getInstance().playSFX('cancel'); return; }
            onSelect();
            AudioManager.getInstance().playSFX('click');
        }}
        className={`
            group relative ${isLarge ? 'aspect-[3/2]' : 'aspect-square'} rounded-[20px] transition-all overflow-hidden border-2 cursor-pointer
            ${isSelected 
                ? 'border-orange-500 bg-orange-500/10 scale-105 z-10 shadow-[0_0_20px_rgba(249,115,22,0.4)]' 
                : isLocked ? 'border-stone-900 bg-stone-950 grayscale opacity-40' : 'border-white/5 bg-stone-900/40 hover:border-orange-500/40'}
        `}
    >
        <img src={url} className={`w-full h-full ${isLarge ? 'object-cover opacity-60' : 'object-contain p-2'} transition-all duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} alt="" />
        {isSelected && <div className="absolute top-1.5 right-1.5 bg-orange-500 rounded-lg p-0.5"><CheckCircle2 size={12} className="text-white" /></div>}
        {isLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Lock size={16} className="text-stone-500" /></div>}
    </button>
);
