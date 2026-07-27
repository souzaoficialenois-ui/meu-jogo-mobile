import React, { useRef, useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { AudioManager } from '../../services/AudioManager';
import { localizeUrl } from '../../services/UrlLocalizer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Youtube, 
  Palette, 
  Cpu, 
  Volume2, 
  Globe, 
  Tv,
  ExternalLink,
  Github,
  History,
  ShieldCheck,
  Zap,
  Calendar
} from 'lucide-react';
import { VersionManager } from '../../services/VersionManager';

interface Contributor {
  name: string;
  role: string;
  roleEn: string;
  url: string;
  avatarUrl?: string;
  iconType: 'youtube' | 'deviantart' | 'creator' | 'tech' | 'sound' | 'tiktok' | 'github';
}

const ALL_CONTRIBUTORS: Contributor[] = [
  {
    name: "Alan Souza (Shadow Ghost Games)",
    role: "Criador do Jogo / Diretor",
    roleEn: "Game Creator / Director",
    url: "https://youtube.com/@shadow_ghost_games?si=oM1JS_k10bkN5Ahy",
    avatarUrl: "/Assets/ui/creditos/shadowghost.jpg",
    iconType: 'creator'
  },
  {
    name: "JustOruma",
    role: "Designer de Personagens",
    roleEn: "Character Designer",
    url: "https://www.deviantart.com/justoruma",
    avatarUrl: "/Assets/ui/creditos/justoruma.jpg",
    iconType: 'deviantart'
  },
  {
    name: "Blacksanyt",
    role: "Designer de Personagens",
    roleEn: "Character Designer",
    url: "https://www.deviantart.com/blacksanyt",
    avatarUrl: "/Assets/ui/creditos/blacksanyt.jpg",
    iconType: 'deviantart'
  },
  {
    name: "Samuel Higino",
    role: "Designer de Personagens",
    roleEn: "Character Designer",
    url: "https://www.deviantart.com/samuelhigino",
    avatarUrl: "/Assets/ui/creditos/samuelhigino.jpg",
    iconType: 'deviantart'
  },
  {
    name: "AthePro013",
    role: "Designer de Personagens",
    roleEn: "Character Designer",
    url: "https://www.deviantart.com/athepro013",
    avatarUrl: "/Assets/ui/creditos/athepro013.jpg",
    iconType: 'deviantart'
  },
  {
    name: "Pedro Play BR",
    role: "Apoiador do Projeto / Comunidade",
    roleEn: "Project Supporter / Community Contributor",
    url: "https://youtube.com/@pedroplaybr?si=Jd4EkznhazQic00s",
    avatarUrl: "/Assets/ui/creditos/pedroplay.jpg",
    iconType: 'youtube'
  }
];

const PATCH_NOTES = [
  {
    version: '2.2.0',
    date: '2026-07-20',
    notes: [
      'Interface de créditos reestruturada',
      'Otimização de performance de assets',
      'Aprimoramento do sistema de lobby',
      'Ajustes finos no combate'
    ],
    notesEn: [
      'Restructured credits interface',
      'Asset performance optimization',
      'Lobby system enhancement',
      'Fine combat adjustments'
    ]
  },
  {
    version: '2.1.0',
    date: '2026-06-05',
    notes: [
      'Novos personagens adicionados',
      'Sistema de reconexão automática'
    ],
    notesEn: [
      'New characters added',
      'Automatic reconnection system'
    ]
  }
];

export const CreditsScreen: React.FC = () => {
  const { changeScene, settings } = useSceneManager();
  const isPt = settings.language === 'pt';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const currentVersion = VersionManager.getRemoteVersion();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      const current = el.scrollLeft;
      setScrollProgress(current / maxScroll);
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    AudioManager.getInstance().playSFX('click');
    changeScene(SceneName.MAIN_MENU);
  };

  const handleLink = (url: string) => {
    AudioManager.getInstance().playSFX('confirm');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-500" />;
      case 'deviantart': return <Palette className="w-5 h-5 text-emerald-400" />;
      case 'tech': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'sound': return <Volume2 className="w-5 h-5 text-amber-400" />;
      case 'tiktok': return <Tv className="w-5 h-5 text-fuchsia-400" />;
      case 'github': return <Github className="w-5 h-5 text-white" />;
      default: return <Globe className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
      {/* Background Layer with Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          src="/Assets/fundosdastelas/modos/m5.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/20 to-stone-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-transparent to-stone-950" />
      </div>

      <div className="scanline" />
      
      {/* Dark cosmic glowing nebula effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-orange-600/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-blue-600/5 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* TOP HEADER */}
      <header className="relative w-full h-16 md:h-24 px-6 md:px-12 flex items-center justify-between z-50 bg-stone-950/40 border-b border-white/5 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-3 bg-stone-900/50 border border-white/5 hover:border-orange-500/50 px-5 py-2.5 rounded-2xl text-stone-400 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-header italic uppercase text-xs tracking-widest">{isPt ? "VOLTAR" : "BACK"}</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-xl md:text-3xl font-header italic text-white uppercase tracking-tighter leading-none">
            {isPt ? "CRÉDITOS" : "CREDITS"}
          </h1>
          <p className="text-[9px] text-stone-500 font-black uppercase tracking-[0.4em] mt-1">
            {isPt ? "Equipe e Desenvolvimento" : "Team & Development"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              AudioManager.getInstance().playSFX('click');
              const el = scrollRef.current;
              if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
            }}
            className="hidden md:flex items-center gap-3 bg-orange-600/10 border border-orange-500/20 hover:bg-orange-600/20 px-5 py-2.5 rounded-2xl text-orange-400 hover:text-orange-300 transition-all cursor-pointer group"
          >
            <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
            <span className="font-header italic uppercase text-[10px] tracking-widest">{isPt ? "HISTÓRICO" : "HISTORY"}</span>
          </button>
        </div>
      </header>

      {/* Horizontal Cards Container (The Slider) */}
      <div className="flex-1 relative flex flex-col justify-center overflow-hidden z-10">
        <div 
          ref={scrollRef}
          className="flex h-full items-center overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide px-[10vw] md:px-[25vw] gap-8 md:gap-16 py-12"
        >
          {/* 1. Game Info Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] h-[80%] bg-stone-900/30 border border-white/5 rounded-[3rem] p-10 md:p-16 flex flex-col items-center justify-center text-center snap-center backdrop-blur-2xl relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.6)] shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            
            <motion.img 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src={localizeUrl("/Assets/ui/logo/logojogo.png")} 
              alt="Logo" 
              className="w-72 md:w-96 object-contain mb-10 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-700"
            />
            
            <h2 className="text-3xl md:text-5xl font-header italic text-white uppercase tracking-tighter mb-6 leading-none">
              Fighter Legend One
            </h2>
            
            <p className="text-stone-400 text-sm md:text-lg leading-relaxed max-w-sm font-medium opacity-80">
              {isPt 
                ? "A experiência definitiva de luta 2D. Criado com paixão para os verdadeiros fãs de combate e superação." 
                : "The ultimate 2D fighting experience. Created with passion for true fans of combat and overcoming limits."}
            </p>

            <div className="mt-12 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.5em]">LIVE VERSION {currentVersion}</span>
            </div>
          </motion.div>

          {/* 2. Contributors Cards */}
          {ALL_CONTRIBUTORS.map((item, index) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => handleLink(item.url)}
              className="min-w-[80vw] md:min-w-[35vw] lg:min-w-[25vw] h-[80%] bg-stone-900/30 border border-white/5 rounded-[3rem] p-8 md:p-12 flex flex-col items-center justify-between snap-center backdrop-blur-2xl group cursor-pointer hover:border-orange-500/30 transition-all duration-500 shadow-[0_30px_100px_rgba(0,0,0,0.5)] hover:translate-y-[-10px] shrink-0"
            >
              <div className="w-full flex flex-col items-center">
                <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-[2.5rem] border-2 border-white/5 overflow-hidden mb-10 group-hover:border-orange-500/40 transition-all duration-700 shadow-2xl">
                  <img 
                    src={item.avatarUrl || "/Assets/UI/avatar_placeholder.png"} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = "/Assets/UI/avatar_placeholder.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="space-y-4 text-center px-4">
                  <h3 className="text-2xl md:text-4xl font-header italic text-white uppercase tracking-tight leading-none group-hover:text-orange-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="inline-block px-4 py-1 bg-orange-600/10 border border-orange-500/20 rounded-lg">
                    <p className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                      {isPt ? item.role : item.roleEn}
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full bg-stone-950/60 rounded-[2rem] p-6 flex items-center justify-between border border-white/5 group-hover:bg-orange-600/10 group-hover:border-orange-500/20 transition-all duration-500 mt-8">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-stone-900 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all text-stone-500 shadow-xl">
                    {getIcon(item.iconType)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-stone-600 uppercase font-black tracking-widest mb-1">
                      {isPt ? "REDES" : "SOCIALS"}
                    </span>
                    <span className="text-[11px] text-stone-300 truncate max-w-[150px] font-medium lowercase">
                      {item.url.replace('https://', '').replace('www.', '')}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}

          {/* 3. Version Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] h-[80%] bg-stone-900/30 border border-white/5 rounded-[3rem] p-10 md:p-16 flex flex-col items-center justify-center snap-center backdrop-blur-2xl relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.6)] shrink-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl border border-blue-500/20 flex items-center justify-center text-blue-500 mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <ShieldCheck size={40} />
              </div>
              
              <h3 className="text-stone-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">
                {isPt ? "VERSÃO DO SISTEMA" : "SYSTEM VERSION"}
              </h3>
              
              <div className="relative">
                <span className="text-7xl md:text-8xl font-header italic text-white uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  v{currentVersion}
                </span>
                <div className="absolute -top-4 -right-4">
                  <Zap size={24} className="text-blue-400 animate-pulse" />
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center">
                <div className="px-6 py-2 bg-stone-950/60 border border-white/5 rounded-full flex items-center gap-3">
                  <Calendar size={14} className="text-stone-500" />
                  <span className="text-stone-300 font-mono text-sm tracking-widest font-bold">
                    {PATCH_NOTES[0].date}
                  </span>
                </div>
                <span className="text-[9px] text-stone-600 font-black uppercase tracking-[0.3em] mt-3">
                  {isPt ? "ESTÁVEL E ATUALIZADO" : "STABLE & UPDATED"}
                </span>
              </div>
            </div>

            <div className="absolute bottom-10 flex items-center gap-2 opacity-30">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <div className="w-1 h-1 rounded-full bg-blue-500" />
            </div>
          </motion.div>

          {/* End Spacer */}
          <div className="min-w-[10vw] shrink-0" />
        </div>

        {/* Navigation Indicators Overlay */}
        <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-6 pointer-events-none">
          {/* Progress Bar Container */}
          <div className="w-64 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-600 to-amber-500 shadow-[0_0_15px_rgba(234,88,12,0.5)]"
              animate={{ width: `${scrollProgress * 100}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>

          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-stone-600 opacity-60">
            <motion.span animate={{ x: [-5, 0, -5] }} transition={{ repeat: Infinity, duration: 2 }}>{isPt ? "<- ARRASTE" : "<- SWIPE"}</motion.span>
            <div className="flex gap-2">
              {[...Array(ALL_CONTRIBUTORS.length + 2)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${Math.round(scrollProgress * (ALL_CONTRIBUTORS.length + 1)) === i ? 'bg-orange-500 scale-150' : 'bg-stone-800'}`} 
                />
              ))}
            </div>
            <motion.span animate={{ x: [5, 0, 5] }} transition={{ repeat: Infinity, duration: 2 }}>{isPt ? "ARRASTE ->" : "SWIPE ->"}</motion.span>
          </div>
        </div>
      </div>
    </div>
  );
};

