import React, { useState, useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { AVATAR_LIST, BACKGROUND_LIST } from '../../constants';
import { SceneName } from '../../types';
import { NameGenerator } from '../../services/NameGenerator';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { Settings, Globe, Dice5, ChevronRight, Sparkles, User, ShieldAlert, Cpu, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileCreationScreen: React.FC = () => {
  const { createProfile, t, settings, updateSettings, changeScene, currentUser } = useSceneManager();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_LIST[0].id);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_LIST[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parallax background refs
  const bgRef = useRef<HTMLDivElement>(null);
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          targetOffset.current = {
              x: (e.clientX / window.innerWidth - 0.5) * 40,
              y: (e.clientY / window.innerHeight - 0.5) * 40
          };
      };

      let animId: number;
      const updateParallax = () => {
          const lerpVal = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
          
          currentOffset.current.x = lerpVal(currentOffset.current.x, targetOffset.current.x, 0.08);
          currentOffset.current.y = lerpVal(currentOffset.current.y, targetOffset.current.y, 0.08);

          if (bgRef.current) {
              bgRef.current.style.transform = `translate3d(${currentOffset.current.x}px, ${currentOffset.current.y}px, 0)`;
          }
          animId = requestAnimationFrame(updateParallax);
      };

      window.addEventListener('mousemove', handleMouseMove);
      animId = requestAnimationFrame(updateParallax);

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          cancelAnimationFrame(animId);
      };
  }, []);

  const handleRandomName = () => {
      setName(NameGenerator.generate().slice(0, 14));
      AudioManager.getInstance().playSFX('click');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value.slice(0, 14));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    AudioManager.getInstance().playSFX('confirm');
    
    // Smooth delay for cinematic power loading
    setTimeout(() => {
        createProfile(name.trim().toUpperCase(), selectedAvatar, selectedBackground);
    }, 1500);
  };

  const toggleLanguage = () => {
      const isEn = settings.language === 'en' || settings.language === 'en-US' || settings.language?.startsWith('en');
      updateSettings({ language: isEn ? 'pt' : 'en' });
      AudioManager.getInstance().playSFX('click');
  };

  const currentAvatar = AVATAR_LIST.find(a => a.id === selectedAvatar);
  const currentBackground = BACKGROUND_LIST.find(b => b.id === selectedBackground);

  return (
    <div id="profile-creation" className="w-full h-full flex flex-col font-sans select-none overflow-hidden text-stone-200 bg-stone-950 relative bg-grain">
        <div className="scanline" />
        
        {/* Cinematic Parallax Background Layer */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div 
            ref={bgRef}
            className="absolute inset-0 pointer-events-none will-change-transform"
        >
            <div className="absolute top-1/4 left-1/3 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-1/4 right-1/3 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[150px]" />
            <img 
                src="/Assets/fundosdastelas/modos/m2.png" 
                className="absolute inset-0 w-full h-full object-cover grayscale-[30%] opacity-20"
                alt="" 
            />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <div 
                    key={`prof-p-${i}`}
                    className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full animate-float-particle opacity-35"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${70 + Math.random() * 30}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${6 + Math.random() * 8}s`
                    }}
                />
            ))}
        </div>

        {/* TOP BAR CONTROLS - Unified Header */}
        <header className="h-[8vh] min-h-[60px] max-h-20 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] flex items-center justify-between relative z-50 bg-stone-950/90 border-b border-stone-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 md:gap-5">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-600/10 border border-orange-500/20 flex items-center justify-center rounded-xl">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-orange-500 animate-pulse" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] leading-none mb-1">
                        {t('profile_subtitle') || "INICIALIZANDO SISTEMA"}
                    </span>
                    <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                        {t('profile_title') || "CRIAR PERFIL"}
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                 {/* Language Selector */}
                 <button 
                    onClick={toggleLanguage} 
                    className="bg-stone-900/50 border border-white/5 px-4 h-10 rounded-xl font-black italic text-[10px] text-stone-300 hover:text-white hover:border-orange-500/50 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                 >
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    <span className="tracking-[0.2em] uppercase">{(settings.language === 'en' || settings.language === 'en-US' || settings.language?.startsWith('en')) ? 'ENGLISH' : 'PORTUGUÊS'}</span>
                 </button>

                 {/* Settings trigger */}
                 <button 
                    onClick={() => { changeScene(SceneName.SETTINGS); AudioManager.getInstance().playSFX('click'); }} 
                    className="bg-stone-900/50 border border-white/5 w-10 h-10 rounded-xl flex items-center justify-center text-stone-300 hover:text-white hover:border-orange-500/50 transition-all group cursor-pointer shadow-lg"
                 >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                 </button>
            </div>
        </header>

        {/* MAIN PANEL CONTAINER: Always Side-by-Side row, no overlapping! */}
        <div className="flex-grow flex flex-col lg:flex-row items-stretch overflow-hidden relative z-10 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] py-6 gap-6">
            
            {/* LEFT: INTERACTIVE HOLOGRAM PREVIEW */}
            <div className="w-full lg:w-[38%] bg-stone-950/30 backdrop-blur-xl relative flex flex-col items-center justify-center p-8 border border-white/5 rounded-3xl shadow-2xl overflow-hidden shrink-0">
                
                {/* Brand Logo Watermark */}
                <div className="absolute top-6 flex items-center gap-2 opacity-10 select-none">
                    <img 
                        src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
                        alt="Mini Logo" 
                        className="w-40 md:w-48 object-contain"
                    />
                </div>

                {/* Styled War Name Preview Text */}
                <div className="absolute top-16 text-center w-full px-6">
                    <p className="text-[10px] text-stone-600 uppercase tracking-[0.4em] font-black mb-2">IDENTIFICAÇÃO</p>
                    <h3 className="text-3xl md:text-4xl font-black italic text-orange-500 tracking-tighter uppercase break-all truncate max-w-[300px] mx-auto drop-shadow-[0_0_15px_rgba(234,88,12,0.4)] leading-none">
                        {name || 'LUTADOR'}
                    </h3>
                </div>

                {/* Hologram Circle Projection */}
                <div className="relative w-[50vmin] h-[50vmin] sm:w-[40vmin] sm:h-[40vmin] lg:w-[32vmin] lg:h-[32vmin] flex items-center justify-center my-12">
                    {/* Pulsing visual rings */}
                    <div className="absolute inset-0 border-2 border-dashed border-orange-500/20 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-4 border border-orange-500/10 rounded-full animate-pulse"></div>
                    <div className="absolute inset-8 border border-white/5 rounded-full"></div>
                    
                    {/* Preview Scene Frame */}
                    <div className="relative z-10 w-[35vmin] h-[35vmin] sm:w-[28vmin] sm:h-[28vmin] lg:w-[24vmin] lg:h-[24vmin] rounded-full bg-stone-900/40 border-2 border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] group overflow-hidden">
                        {currentBackground?.url && (
                             <img src={currentBackground.url} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen transition-transform duration-700 group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-transparent to-transparent"></div>
                        
                        {currentAvatar?.url ? (
                            <img src={currentAvatar.url} alt="Avatar Frame" className="w-[85%] h-[85%] object-contain relative z-20 transform scale-100 group-hover:scale-110 transition-transform duration-500 filter contrast-125 brightness-110 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" />
                        ) : (
                            <span className="text-[12vmin] font-black text-white relative z-20 animate-float drop-shadow-lg">
                                {currentAvatar?.label || "P"}
                            </span>
                        )}
                    </div>

                    {/* Laser Scanning Line */}
                    <div className="absolute inset-x-0 w-full h-[2px] bg-orange-400/30 animate-[scan_3s_linear_infinite] shadow-[0_0_10px_rgba(234,88,12,0.5)] pointer-events-none"></div>
                </div>

                {/* Subtitle status indicator */}
                <div className="text-center space-y-2 mt-4">
                    <h2 className="text-white font-black italic text-xl md:text-2xl tracking-tighter uppercase leading-none drop-shadow-md">CARTÃO DE JOGADOR</h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.8)]"></div>
                        <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em]">PRONTO PARA O COMBATE</p>
                    </div>
                </div>
            </div>

            {/* RIGHT: COMMAND FIELDS PANEL */}
            <div className="flex-1 bg-stone-950/20 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                
                {/* Section Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] text-orange-400 font-black tracking-[0.3em] uppercase">ALISTAMENTO</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter uppercase leading-none">
                        DADOS DO GUERREIRO
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between gap-8">
                    
                    {/* Codename textbox */}
                    <div className="group relative space-y-3">
                        <label className="block text-stone-500 font-black text-[10px] tracking-[0.3em] uppercase ml-1 transition-colors group-focus-within:text-orange-500">
                            {t('profile_name_label') || "NOME DE GUERRA"}
                        </label>
                        <div className="flex items-center bg-black/40 border border-white/5 focus-within:border-orange-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-inner">
                            <div className="pl-5 text-orange-500/50">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                            <input 
                                type="text" 
                                value={name}
                                onChange={handleInput}
                                placeholder="INSIRA SEU APELIDO"
                                className="flex-1 bg-transparent text-lg md:text-xl font-black italic text-white px-4 py-4 focus:outline-none uppercase placeholder:text-stone-800 tracking-wider"
                                autoFocus
                                required
                            />
                            <button 
                                type="button"
                                onClick={handleRandomName}
                                className="px-6 h-full font-black italic text-xs text-white bg-orange-600 hover:bg-orange-500 transition-all border-l border-white/10 uppercase tracking-widest cursor-pointer flex items-center gap-2"
                            >
                                <Dice5 className="w-4 h-4" />
                                GERAR
                            </button>
                        </div>
                    </div>

                    {/* Avatar Selection list Grid */}
                    <div className="space-y-4">
                        <label className="block text-stone-500 font-black text-[10px] tracking-[0.3em] uppercase ml-1">
                            {t('profile_avatar_label') || "VISUAL DO GUERREIRO"}
                        </label>
                        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                            {AVATAR_LIST.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    type="button"
                                    onClick={() => { setSelectedAvatar(avatar.id); AudioManager.getInstance().playSFX('click'); }}
                                    className={`
                                        aspect-square relative rounded-2xl border-2 transition-all duration-300 transform scale-100 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer overflow-hidden shadow-lg
                                        ${selectedAvatar === avatar.id 
                                            ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                                            : 'border-white/5 bg-black/40 hover:border-orange-500/30'}
                                    `}
                                >
                                    <div className="w-[85%] h-[85%] flex items-center justify-center p-1 relative z-10">
                                        {avatar.url ? (
                                            <img src={avatar.url} alt={avatar.label} className={`w-full h-full object-contain filter contrast-125 transition-transform duration-500 ${selectedAvatar === avatar.id ? 'scale-110' : 'hover:scale-110'}`} />
                                        ) : (
                                            <span className="text-white font-black text-xs">{avatar.label}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background strip */}
                    <div className="space-y-4">
                        <label className="block text-stone-500 font-black text-[10px] tracking-[0.3em] uppercase ml-1">
                            ESTÁGIO FAVORITO
                        </label>
                        <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                            <div className="flex gap-3 w-max px-1">
                                {BACKGROUND_LIST.map((bg) => (
                                    <button
                                        key={bg.id}
                                        type="button"
                                        onClick={() => { setSelectedBackground(bg.id); AudioManager.getInstance().playSFX('click'); }}
                                        className={`
                                            w-28 h-16 relative rounded-2xl border-2 transition-all duration-300 transform scale-100 hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-lg
                                            ${selectedBackground === bg.id 
                                                ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                                                : 'border-white/5 bg-black/40 hover:border-orange-500/30'}
                                        `}
                                    >
                                        <img src={bg.url} alt={`Bg ${bg.id}`} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen transition-transform duration-500 group-hover:scale-110" />
                                        {selectedBackground === bg.id && (
                                            <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[2px]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Confirm CTA */}
                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className={`
                                w-full py-5 relative overflow-hidden group font-black italic text-xl tracking-widest uppercase transition-all duration-500 rounded-2xl cursor-pointer flex items-center justify-center shadow-2xl active:scale-95
                                ${!name.trim() || isSubmitting
                                    ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                                    : 'bg-orange-600 text-white hover:bg-orange-500 border border-orange-400 shadow-[0_0_30px_rgba(234,88,12,0.4)]'}
                            `}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    <span className="animate-pulse">DESPERTANDO PODER...</span>
                                </div>
                            ) : (
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {t('profile_confirm') || "ATIVAR PERFIL"}
                                    <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
                                </span>
                            )}
                            {/* Decorative flare */}
                            <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-1000 ease-in-out pointer-events-none" />
                        </button>
                    </div>

                </form>
            </div>
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                height: 4px;
                width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(87, 83, 78, 0.4);
                border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(249, 115, 22, 0.7);
            }
        `}</style>
    </div>
  );
};
