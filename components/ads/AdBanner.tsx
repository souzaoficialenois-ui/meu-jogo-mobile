import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, Minimize2, Maximize2, ShieldCheck, ChevronRight, X, Info, Award } from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';

interface AdBannerProps {
    position?: 'top' | 'bottom';
    className?: string;
}

interface Sponsor {
    id: string;
    title: string;
    subtitle: string;
    sponsor: string;
    tag: string;
    badgeColor: string;
    linkText: string;
    description: string;
    perkText?: string;
}

const SPONSORS_LIST: Sponsor[] = [
    {
        id: 'bandai',
        title: 'Dragon Ball Sparking! ZERO',
        subtitle: 'Batalhas 3D oficiais',
        sponsor: 'Bandai Namco',
        tag: 'Patrocinador',
        badgeColor: 'from-amber-500 to-orange-500',
        linkText: 'Ver Jogo',
        description: 'Jogo 3D oficial para PS5, Xbox e PC.',
        perkText: 'Parceiro Oficial'
    },
    {
        id: 'capsule_cloud',
        title: 'Capsule Corp Cloud',
        subtitle: 'Jogos na nuvem a 240 FPS',
        sponsor: 'Capsule Corp',
        tag: 'Tecnologia',
        badgeColor: 'from-cyan-500 to-blue-500',
        linkText: 'Testar',
        description: 'Servidores de baixa latência para lutas.',
        perkText: 'Conexão Otimizada'
    },
    {
        id: 'kame_nutrition',
        title: 'Kame Energy Drink',
        subtitle: 'Energia máxima para combates',
        sponsor: 'Mestre Kame',
        tag: 'Suplemento',
        badgeColor: 'from-emerald-500 to-teal-500',
        linkText: 'Conhecer',
        description: 'Fórmula com eletrólitos de Sennzu.',
        perkText: 'Energia de Torneio'
    },
    {
        id: 'red_ribbon_tech',
        title: 'Red Ribbon Cyber',
        subtitle: 'Proteção Anti-Cheat & P2P',
        sponsor: 'Red Ribbon',
        tag: 'Segurança',
        badgeColor: 'from-rose-500 to-red-600',
        linkText: 'Saber Mais',
        description: 'Sincronização rápida e batalhas justas.',
        perkText: 'Fair-Play Certificado'
    }
];

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSponsorModal, setShowSponsorModal] = useState(false);
    const [activeSponsorDetails, setActiveSponsorDetails] = useState<Sponsor | null>(null);
    const [isAdLoading, setIsAdLoading] = useState(true);

    // Initial AdMob load simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAdLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // Auto rotate sponsors every 8 seconds
    useEffect(() => {
        if (isMinimized) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % SPONSORS_LIST.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isMinimized]);

    const currentSponsor = SPONSORS_LIST[currentIndex];

    const handleOpenSponsorDetails = (sponsor: Sponsor) => {
        try { AudioManager.getInstance().playSFX('confirm'); } catch (e) {}
        setActiveSponsorDetails(sponsor);
        setShowSponsorModal(true);
    };

    if (isMinimized) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full max-w-4xl mx-auto px-3 py-1 relative z-30 flex justify-end ${className}`}
            >
                <button
                    onClick={() => {
                        try { AudioManager.getInstance().playSFX('click'); } catch (e) {}
                        setIsMinimized(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-stone-900/90 hover:bg-stone-800 border border-stone-700/50 hover:border-amber-500/50 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-300 hover:text-amber-300 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
                >
                    <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>Patrocinadores</span>
                    <Maximize2 className="w-3 h-3 text-stone-400 group-hover:text-white" />
                </button>
            </motion.div>
        );
    }

    return (
        <>
            <div className={`w-full max-w-4xl mx-auto px-3 relative z-30 ${className}`}>
                <motion.div 
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-900/80 hover:bg-stone-900/95 border border-stone-800/80 hover:border-amber-500/30 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 shadow-lg backdrop-blur-lg text-white relative overflow-hidden transition-all group"
                >
                    {/* Subtle Left Accent */}
                    <div className="shrink-0 w-1 h-7 rounded-full bg-amber-500/80 group-hover:bg-amber-400 transition-colors" />

                    {/* Sponsor Content Carousel */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isAdLoading ? (
                            <div className="flex items-center gap-2 py-0.5 min-w-0 flex-1">
                                <div className="relative w-3.5 h-3.5 shrink-0">
                                    <div className="absolute inset-0 rounded-full border border-stone-700" />
                                    <div className="absolute inset-0 rounded-full border border-amber-400 border-t-transparent animate-spin" />
                                </div>
                                <span className="text-[10px] text-stone-400 font-medium tracking-wide">
                                    Carregando anúncio AdMob...
                                </span>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSponsor.id}
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                    onClick={() => handleOpenSponsorDetails(currentSponsor)}
                                >
                                    <span className="shrink-0 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-md flex items-center gap-1">
                                        <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                                        {currentSponsor.tag}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold truncate text-stone-100 group-hover:text-amber-300 transition-colors">
                                                {currentSponsor.title}
                                            </span>
                                            <span className="text-[10px] text-stone-400 font-medium hidden sm:inline truncate">
                                                • {currentSponsor.sponsor}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-stone-400 truncate font-normal">
                                            {currentSponsor.subtitle}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Controls & Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Dots indicator */}
                        <div className="hidden sm:flex items-center gap-1 mr-1.5">
                            {SPONSORS_LIST.map((sp, idx) => (
                                <button
                                    key={sp.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                        idx === currentIndex ? 'bg-amber-400 w-3.5' : 'bg-stone-700 hover:bg-stone-500 w-1.5'
                                    }`}
                                    title={sp.title}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => handleOpenSponsorDetails(currentSponsor)}
                            className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700/60 hover:border-amber-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider text-stone-200 hover:text-amber-300 transition-all cursor-pointer"
                        >
                            <span>Detalhes</span>
                            <ChevronRight className="w-3 h-3 text-stone-400" />
                        </button>

                        <button
                            onClick={() => {
                                try { AudioManager.getInstance().playSFX('click'); } catch (e) {}
                                handleOpenSponsorDetails(currentSponsor);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-200 transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                            title="Ver Todos"
                        >
                            <Info className="w-3.5 h-3.5" />
                        </button>

                        <button
                            onClick={() => {
                                try { AudioManager.getInstance().playSFX('click'); } catch (e) {}
                                setIsMinimized(true);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-200 transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                            title="Minimizar"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Clean Sponsor Hub Modal */}
            <AnimatePresence>
                {showSponsorModal && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl flex flex-col text-white max-h-[85vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3.5 border-b border-stone-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                        <Award className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-wide text-stone-100 uppercase leading-none">
                                            Patrocinadores & Parceiros
                                        </h3>
                                        <p className="text-[11px] text-stone-400 mt-1 font-normal">
                                            Apoiadores oficiais da comunidade Fighter Legend.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        try { AudioManager.getInstance().playSFX('cancel'); } catch (e) {}
                                        setShowSponsorModal(false);
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-all cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Sponsor Cards List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar my-3 space-y-2.5 pr-1">
                                {SPONSORS_LIST.map((sp) => {
                                    const isSelected = activeSponsorDetails?.id === sp.id;
                                    return (
                                        <div
                                            key={sp.id}
                                            onClick={() => setActiveSponsorDetails(sp)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-stone-800/90 border-amber-500/40 shadow-sm' 
                                                    : 'bg-stone-950/40 border-stone-800/70 hover:border-stone-700 hover:bg-stone-800/40'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded">
                                                            {sp.tag}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-stone-400">
                                                            {sp.sponsor}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-sm font-bold text-stone-100">
                                                        {sp.title}
                                                    </h4>

                                                    <p className="text-xs text-stone-300 leading-relaxed font-normal pt-0.5">
                                                        {sp.description}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 pt-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300 flex items-center gap-1 transition-colors">
                                                        <span>{sp.linkText}</span>
                                                        <ExternalLink className="w-3 h-3 text-stone-400" />
                                                    </span>
                                                </div>
                                            </div>

                                            {sp.perkText && (
                                                <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                                                    <span className="text-emerald-400 flex items-center gap-1">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        {sp.perkText}
                                                    </span>
                                                    <span className="text-stone-500 font-mono">Verificado</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* AdSense Container */}
                                <div className="p-3 rounded-xl bg-stone-950/60 border border-dashed border-stone-800 text-center space-y-1.5 flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-3.5 h-3.5 shrink-0">
                                            <div className="absolute inset-0 rounded-full border border-stone-800" />
                                            <div className="absolute inset-0 rounded-full border border-amber-400 border-t-transparent animate-spin" />
                                        </div>
                                        <div className="text-xs font-semibold text-stone-300">
                                            Bloco Google AdSense / AdMob
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-stone-500">
                                        Carregando anúncios da rede oficial Google...
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                                <div className="text-[10px] text-stone-500 font-medium">
                                    Fighter Legend • Rede de Apoio
                                </div>
                                <button
                                    onClick={() => setShowSponsorModal(false)}
                                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
