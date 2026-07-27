import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSceneManager } from "../contexts/SceneContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  Search,
  Calendar,
  X,
  Play,
  Volume2,
  Info,
  ChevronRight,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Tag,
  Gamepad2,
  Sliders,
  History
} from "lucide-react";
import {
  NewsManager,
  NewsItem,
  NewsCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CURRENT_GAME_VERSION
} from "../services/NewsManager";
import { AudioManager } from "../services/AudioManager";
import { RESOURCE_SPRITES } from "../constants";

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoVersionOnly?: boolean; // If true, shows only the newly installed version's update
}

export const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, autoVersionOnly = false }) => {
  const { settings, t: globalT } = useSceneManager();
  const isPt = settings?.language === "pt";
  const lang = isPt ? "pt" : "en";

  const t = useMemo(() => ({
    title: globalT("news_title") || (isPt ? "NOVIDADES" : "NEWS"),
    subtitle: globalT("news_subtitle") || (isPt ? "Atualizações e Eventos" : "Updates and Events"),
    searchPlaceholder: globalT("news_searchPlaceholder") || (isPt ? "Buscar..." : "Search..."),
    allCategories: globalT("news_allCategories") || (isPt ? "Tudo" : "All"),
    unreadBadge: globalT("news_unreadBadge") || (isPt ? "Novo" : "New"),
    featuredBadge: globalT("news_featuredBadge") || (isPt ? "Destaque" : "Featured"),
    readMore: globalT("news_readMore") || (isPt ? "Ver Mais" : "Read More"),
    back: globalT("news_back") || (isPt ? "Voltar" : "Back"),
    close: globalT("news_close") || (isPt ? "Fechar" : "Close"),
    tabLatest: globalT("news_tabLatest") || (isPt ? "Recentes" : "Latest"),
    tabHistory: globalT("news_tabHistory") || (isPt ? "Histórico" : "History"),
    noNews: globalT("news_noNews") || (isPt ? "Nenhuma novidade encontrada" : "No news found"),
    versionLabel: globalT("news_versionLabel") || (isPt ? "Versão" : "Version"),
    releasedAt: globalT("news_releasedAt") || (isPt ? "Lançado em" : "Released at"),
    playVideo: globalT("news_playVideo") || (isPt ? "Assistir" : "Play"),
    autoHeader: globalT("news_autoHeader") || (isPt ? "NOVA VERSÃO INSTALADA!" : "NEW VERSION INSTALLED!"),
    continueBtn: globalT("news_continueBtn") || (isPt ? "CONTINUAR" : "CONTINUE"),
  }), [globalT, isPt]);

  const newsManager = NewsManager.getInstance();

  const [activeTab, setActiveTab] = useState<"latest" | "history">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [seenNewsIds, setSeenNewsIds] = useState<string[]>([]);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSeenNewsIds(newsManager.getSeenNewsIds());
      setIsVideoLoaded(false);
      
      if (autoVersionOnly) {
        const currentUpdate = newsManager.getAllNews().find(n => n.version === CURRENT_GAME_VERSION);
        if (currentUpdate) setSelectedNews(currentUpdate);
      } else {
        setSelectedNews(null);
      }
    }
  }, [isOpen, autoVersionOnly]);

  const handleCloseModal = () => {
    AudioManager.getInstance().playSFX("cancel");
    if (autoVersionOnly || (selectedNews && selectedNews.version === CURRENT_GAME_VERSION)) {
      newsManager.markCurrentVersionAsSeen();
    }
    onClose();
  };

  const categoriesList = useMemo(() => {
    const list = [{ key: "ALL", label: t.allCategories }];
    const categoryKeys = ["NEW_CHARACTERS", "NEW_TRANSFORMATIONS", "NEW_MAPS", "NEW_GAME_MODES", "NEW_SYSTEMS", "UI_IMPROVEMENTS", "PERFORMANCE", "BUG_FIXES", "BALANCING"];
    categoryKeys.forEach(key => list.push({ key, label: globalT("news_cat_" + key) || key.replace(/_/g, " ") }));
    return list;
  }, [t, globalT]);

  const allNews = useMemo(() => newsManager.getAllNews(), [isOpen]);

  const featuredNews = useMemo(() => allNews.filter(n => n.featured).slice(0, 3), [allNews]);

  const filteredNews = useMemo(() => {
    let list = allNews;
    if (selectedCategory !== "ALL") list = list.filter(n => n.category === selectedCategory);
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => 
        n.title.toLowerCase().includes(q) || 
        (n.titleEn && n.titleEn.toLowerCase().includes(q)) ||
        n.version.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNews, selectedCategory, searchQuery]);

  const handleOpenDetails = (news: NewsItem) => {
    AudioManager.getInstance().playSFX("confirm");
    setSelectedNews(news);
    newsManager.markAsSeen(news.id);
    setSeenNewsIds(newsManager.getSeenNewsIds());
    setIsVideoLoaded(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-stone-950/95 backdrop-blur-xl select-none font-sans overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative bg-stone-900/40 border border-white/5 rounded-none md:rounded-[2.5rem] w-full max-w-7xl h-full md:h-[90vh] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-md"
      >
        {/* HEADER */}
        <header className="px-6 py-5 md:px-10 md:py-8 border-b border-white/5 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-6">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-orange-600/40 to-amber-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.3)] overflow-hidden border border-white/20 p-2 backdrop-blur-xl relative group"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={RESOURCE_SPRITES.LOGO} 
                alt="Fighter Legend Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,107,0,0.5)]" 
                referrerPolicy="no-referrer" 
              />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-5xl font-header italic text-white uppercase tracking-tighter leading-none dragon-gradient-text">
                {autoVersionOnly ? t.autoHeader : t.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="h-[1px] w-8 bg-orange-500/50" />
                <p className="text-[10px] md:text-xs text-stone-500 font-black uppercase tracking-[0.4em]">
                  {autoVersionOnly ? `${t.versionLabel} ${CURRENT_GAME_VERSION}` : t.subtitle}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCloseModal}
            className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-stone-950/50 hover:bg-red-600/20 border border-white/5 flex items-center justify-center text-stone-400 hover:text-red-400 transition-all cursor-pointer active:scale-90 group"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </header>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          
          <AnimatePresence mode="wait">
            {selectedNews ? (
              /* DETAIL VIEW */
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-3xl flex flex-col lg:flex-row overflow-hidden"
              >
                <div className="lg:w-[60%] h-64 lg:h-full relative overflow-hidden bg-black shrink-0 border-r border-white/5">
                  <AnimatePresence mode="wait">
                    {selectedNews.videoUrl && isVideoLoaded ? (
                      <motion.div 
                        key="video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full"
                      >
                        {getYouTubeEmbedUrl(selectedNews.videoUrl) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(selectedNews.videoUrl)!}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={selectedNews.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="image"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative group"
                      >
                        <img
                          src={selectedNews.imageUrl}
                          alt="News Cover"
                          className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                        
                        {selectedNews.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              onClick={() => setIsVideoLoaded(true)}
                              className="w-24 h-24 rounded-full bg-orange-600/90 hover:bg-orange-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(234,88,12,0.5)] transition-all hover:scale-110 active:scale-95 cursor-pointer z-10 group"
                            >
                              <Play className="w-10 h-10 fill-white translate-x-1 group-hover:scale-110 transition-transform" />
                            </button>
                            <div className="absolute w-32 h-32 rounded-full border border-orange-500/30 animate-ping opacity-30" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 p-8 md:p-16 flex flex-col overflow-y-auto custom-scrollbar bg-stone-900/20">
                  <div className="max-w-2xl mx-auto w-full">
                    <button
                      onClick={() => setSelectedNews(null)}
                      className="w-fit flex items-center gap-3 text-stone-500 hover:text-white text-[10px] uppercase font-black tracking-widest transition-all mb-12 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </div>
                      {t.back}
                    </button>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-orange-900/20">
                            {globalT("news_cat_" + selectedNews.category) || selectedNews.category}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono font-bold uppercase tracking-widest">
                            {t.versionLabel} {selectedNews.version}
                          </span>
                        </div>
                        
                        <h2 className="text-3xl md:text-6xl font-header italic text-white uppercase tracking-tighter leading-[0.9]">
                          {lang === "en" && selectedNews.titleEn ? selectedNews.titleEn : selectedNews.title}
                        </h2>

                        <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2 text-stone-500 text-[10px] font-black uppercase tracking-widest">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            {selectedNews.publishDate}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-stone-800" />
                          <div className="flex items-center gap-2 text-stone-500 text-[10px] font-black uppercase tracking-widest">
                            <Volume2 className="w-4 h-4 text-orange-600" />
                            {selectedNews.videoUrl ? 'Video' : 'Static'}
                          </div>
                        </div>
                      </div>

                      <div className="h-px w-full bg-gradient-to-r from-orange-600/50 via-white/5 to-transparent" />

                      <div className="text-stone-300 text-sm md:text-lg leading-relaxed whitespace-pre-line font-medium selection:bg-orange-500/30">
                        {lang === "en" && selectedNews.descriptionEn ? selectedNews.descriptionEn : selectedNews.description}
                      </div>

                      <div className="pt-12">
                        <button
                          onClick={handleCloseModal}
                          className="w-full py-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-header italic uppercase tracking-widest text-sm rounded-2xl shadow-2xl shadow-orange-950/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 group"
                        >
                          <span>{t.continueBtn}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* HUB VIEW */
              <motion.div key="hub" className="flex-1 flex flex-col overflow-hidden">
                {/* FILTERS & SEARCH */}
                <div className="px-6 py-4 md:px-10 border-b border-white/5 bg-stone-950/40 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 z-20">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full md:w-auto py-1">
                    {categoriesList.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setSelectedCategory(cat.key);
                          AudioManager.getInstance().playSFX("click");
                        }}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 cursor-pointer ${
                          selectedCategory === cat.key
                            ? "bg-orange-600 border-orange-400 text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)]"
                            : "bg-stone-900/50 border-white/5 text-stone-500 hover:text-stone-300 hover:border-white/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full bg-stone-950/80 border border-white/5 rounded-2xl pl-12 pr-10 py-3 text-xs text-white placeholder-stone-700 focus:border-orange-500/50 focus:bg-stone-950 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* FEED */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-gradient-to-b from-stone-950/50 to-transparent">
                  <div className="max-w-7xl mx-auto">
                    
                    {/* HERO SECTION: Latest Featured News */}
                    {selectedCategory === "ALL" && searchQuery === "" && featuredNews.length > 0 && (
                      <section className="mb-16">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Main Hero Card */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleOpenDetails(featuredNews[0])}
                            className="lg:col-span-8 group relative h-[500px] rounded-[3rem] overflow-hidden border border-white/10 cursor-pointer shadow-2xl"
                          >
                            <img src={featuredNews[0].imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/40 via-transparent to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 flex flex-col justify-end h-full">
                              <div className="flex items-center gap-4 mb-6">
                                <span className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl">
                                  {globalT("news_cat_" + featuredNews[0].category) || featuredNews[0].category}
                                </span>
                                <span className="flex items-center gap-2 text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] bg-stone-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30 backdrop-blur-md">
                                  <Sparkles className="w-3 h-3 animate-pulse" /> {t.featuredBadge}
                                </span>
                              </div>
                              <h3 className="text-4xl md:text-7xl font-header italic text-white uppercase mb-6 tracking-tighter leading-[0.85] group-hover:text-orange-400 transition-colors">
                                {lang === "en" && featuredNews[0].titleEn ? featuredNews[0].titleEn : featuredNews[0].title}
                              </h3>
                              <p className="text-stone-400 text-sm md:text-lg max-w-xl line-clamp-2 mb-8 leading-relaxed font-medium">
                                {lang === "en" && featuredNews[0].descriptionEn ? featuredNews[0].descriptionEn : featuredNews[0].description}
                              </p>
                              <div className="flex items-center gap-3 text-orange-500 text-xs font-black uppercase tracking-[0.3em] group-hover:gap-6 transition-all">
                                {t.readMore} <ArrowRight className="w-5 h-5" />
                              </div>
                            </div>
                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-3xl rounded-full" />
                          </motion.div>

                          {/* Secondary Featured List */}
                          <div className="lg:col-span-4 flex flex-col gap-6">
                            {featuredNews.slice(1).map((news, i) => (
                              <motion.div
                                key={`featured-sub-${news.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.1 }}
                                onClick={() => handleOpenDetails(news)}
                                className="flex-1 group relative rounded-[2rem] overflow-hidden border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all shadow-xl"
                              >
                                <img src={news.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-8">
                                  <span className="text-[8px] text-orange-500 font-black uppercase tracking-widest mb-2 block opacity-80">
                                    {globalT("news_cat_" + news.category) || news.category}
                                  </span>
                                  <h4 className="text-xl md:text-2xl font-header italic text-white uppercase tracking-tight line-clamp-2 mb-3 leading-none group-hover:text-orange-400 transition-colors">
                                    {lang === "en" && news.titleEn ? news.titleEn : news.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-stone-500 text-[9px] font-bold uppercase tracking-widest">
                                    <Calendar className="w-3 h-3" /> {news.publishDate}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* HISTORY / REGULAR FEED */}
                    <section className="space-y-10">
                      <div className="flex items-center gap-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-stone-500 whitespace-nowrap">
                          {selectedCategory === "ALL" && searchQuery === "" ? t.tabHistory : t.tabLatest}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-stone-800 to-transparent" />
                      </div>
                      
                      {filteredNews.length === 0 ? (
                        <div className="py-32 text-center space-y-6 opacity-40">
                          <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                            <Info className="w-8 h-8 text-stone-700" />
                          </div>
                          <p className="text-[10px] uppercase font-black tracking-[0.3em]">{t.noNews}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {filteredNews.filter(n => !n.featured || (selectedCategory !== "ALL" || searchQuery !== "")).map((news, i) => (
                            <motion.div
                              key={`regular-${news.id}`}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.05 * i }}
                              onClick={() => handleOpenDetails(news)}
                              className="bg-stone-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-orange-500/30 hover:bg-stone-900/60 transition-all duration-500 flex flex-col"
                            >
                              <div className="h-48 relative overflow-hidden bg-stone-950">
                                <img src={news.imageUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                                
                                <div className="absolute top-4 left-4 flex gap-2">
                                  {!seenNewsIds.includes(news.id) && (
                                    <div className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-[0_0_15px_rgba(239,68,68,0.5)]">NEW</div>
                                  )}
                                  {news.videoUrl && (
                                    <div className="bg-black/60 backdrop-blur-md p-1 rounded-md">
                                      <Play className="w-3 h-3 fill-white text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <span className="absolute bottom-4 right-4 text-[7px] text-stone-500 font-mono font-black bg-stone-950/80 px-2 py-1 rounded-md border border-white/5">
                                  v{news.version}
                                </span>
                              </div>

                              <div className="p-8 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                  <span className="text-[9px] text-orange-600 font-black uppercase tracking-widest opacity-80 block">
                                    {globalT("news_cat_" + news.category) || news.category}
                                  </span>
                                  <h4 className="text-xl font-header italic text-white uppercase group-hover:text-orange-400 transition-colors line-clamp-2 leading-[1.1] tracking-tight">
                                    {lang === "en" && news.titleEn ? news.titleEn : news.title}
                                  </h4>
                                  <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed font-medium">
                                    {lang === "en" && news.descriptionEn ? news.descriptionEn : news.description}
                                  </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-[9px] text-stone-600 font-bold uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    {news.publishDate}
                                  </div>
                                  <div className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-stone-500 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Bottom Info */}
                    <div className="py-20 flex flex-col items-center gap-6 opacity-30">
                      <div className="w-px h-16 bg-gradient-to-b from-stone-500 to-transparent" />
                      <div className="flex flex-col items-center text-center">
                        <Gamepad2 className="w-8 h-8 text-stone-500 mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-stone-500">End of Transmissions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
