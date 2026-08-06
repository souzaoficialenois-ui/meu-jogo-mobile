import React, { useState, useEffect, useMemo } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { TitleManager, TitleCategory, TitleRarity, TitleDefinition } from '../../services/TitleManager';
import { PlayerTitleBadge } from '../ui/PlayerTitleBadge';
import { AudioManager } from '../../services/AudioManager';
import { SceneName } from '../../types';
import { 
  ChevronLeft, 
  Search, 
  Award, 
  Trophy, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  Shield, 
  Flame, 
  X, 
  Info,
  User,
  Zap,
  Check
} from 'lucide-react';

export const TitlesGalleryScreen: React.FC = () => {
  const { 
    playerProfile, 
    equipTitle, 
    changeScene, 
    settings, 
    checkAndGrantTitles,
    isOfflineMode 
  } = useSceneManager();

  const isPt = settings?.language ? (settings.language === 'pt' || settings.language.startsWith('pt')) : true;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TitleCategory>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<TitleRarity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  // Detail Modal State
  const [detailTitle, setDetailTitle] = useState<TitleDefinition | null>(null);

  useEffect(() => {
    if (checkAndGrantTitles) {
      checkAndGrantTitles();
    }
  }, []);

  const equippedTitleId = playerProfile?.activeTitle || (typeof window !== 'undefined' && localStorage.getItem('fighter_profile_title')) || 'warrior';

  const unlockedTitlesSet = useMemo(() => {
    const set = new Set<string>(playerProfile?.unlockedTitles || ['warrior']);
    set.add('warrior');
    return set;
  }, [playerProfile?.unlockedTitles]);

  const allTitles = useMemo(() => TitleManager.getAllTitles(), []);

  // Filtered Titles Calculation
  const filteredTitles = useMemo(() => {
    return allTitles.filter((title) => {
      const isUnlocked = unlockedTitlesSet.has(title.id) || (title.checkUnlock && playerProfile ? title.checkUnlock(playerProfile) : false);

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const namePt = title.name.pt_br.toLowerCase();
        const nameEn = title.name.en_us.toLowerCase();
        const descPt = title.description.pt_br.toLowerCase();
        const descEn = title.description.en_us.toLowerCase();
        const reqPt = (title.requirement?.pt_br || '').toLowerCase();
        const reqEn = (title.requirement?.en_us || '').toLowerCase();

        if (
          !namePt.includes(query) && 
          !nameEn.includes(query) && 
          !descPt.includes(query) && 
          !descEn.includes(query) &&
          !reqPt.includes(query) &&
          !reqEn.includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && title.category !== selectedCategory) {
        return false;
      }

      // Rarity filter
      if (selectedRarity !== 'ALL' && title.rarity !== selectedRarity) {
        return false;
      }

      // Status filter
      if (statusFilter === 'UNLOCKED' && !isUnlocked) return false;
      if (statusFilter === 'LOCKED' && isUnlocked) return false;

      return true;
    });
  }, [allTitles, unlockedTitlesSet, playerProfile, searchTerm, selectedCategory, selectedRarity, statusFilter]);

  // Total unlock stats
  const totalUnlockedCount = useMemo(() => {
    return allTitles.filter(t => unlockedTitlesSet.has(t.id) || (t.checkUnlock && playerProfile ? t.checkUnlock(playerProfile) : false)).length;
  }, [allTitles, unlockedTitlesSet, playerProfile]);

  const unlockPercentage = Math.min(100, Math.round((totalUnlockedCount / allTitles.length) * 100));

  const handleEquip = (titleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    AudioManager.getInstance().playSFX('confirm');
    if (equipTitle) {
      equipTitle(titleId);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('fighter_profile_title', titleId);
    }
  };

  const handleBack = () => {
    AudioManager.getInstance().playSFX('cancel');
    changeScene(SceneName.PROFILE);
  };

  const categories: { id: TitleCategory; label: { pt: string; en: string }; icon: any }[] = [
    { id: 'ALL', label: { pt: 'Todos os Títulos', en: 'All Titles' }, icon: Award },
    { id: 'HALL_OF_FAME', label: { pt: 'Hall da Fama', en: 'Hall of Fame' }, icon: Trophy },
    { id: 'RANK', label: { pt: 'Ranqueadas', en: 'Ranked' }, icon: Shield },
    { id: 'ACHIEVEMENTS', label: { pt: 'Conquistas', en: 'Achievements' }, icon: Flame },
    { id: 'SPECIAL', label: { pt: 'Especiais & Eventos', en: 'Special & Events' }, icon: Sparkles },
  ];

  const rarities: { id: TitleRarity | 'ALL'; label: { pt: string; en: string }; color: string }[] = [
    { id: 'ALL', label: { pt: 'Todas Raridades', en: 'All Rarities' }, color: 'text-stone-300' },
    { id: 'COMMON', label: { pt: 'Comum', en: 'Common' }, color: 'text-stone-400' },
    { id: 'RARE', label: { pt: 'Raro', en: 'Rare' }, color: 'text-emerald-400' },
    { id: 'EPIC', label: { pt: 'Épico', en: 'Epic' }, color: 'text-purple-400' },
    { id: 'LEGENDARY', label: { pt: 'Lendário', en: 'Legendary' }, color: 'text-amber-400' },
    { id: 'ETERNAL', label: { pt: 'Eterno', en: 'Eternal' }, color: 'text-pink-300' },
  ];

  const rarityBadgeStyles: Record<TitleRarity, { text: string; border: string; bg: string }> = {
    COMMON: { text: 'text-stone-400', border: 'border-stone-500/30', bg: 'bg-stone-500/10' },
    RARE: { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/15' },
    EPIC: { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/15' },
    LEGENDARY: { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/20' },
    ETERNAL: { text: 'text-pink-300', border: 'border-pink-400/60', bg: 'bg-pink-500/25' },
  };

  return (
    <div className="w-full h-full min-h-screen bg-stone-950 text-white flex flex-col relative overflow-hidden select-none font-sans">
      {/* Background Visual Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-stone-950 to-stone-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ki-sparkle pointer-events-none" />
      <div className="absolute top-3/4 left-1/4 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316] animate-ki-sparkle [animation-delay:1s] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047] animate-ki-sparkle [animation-delay:1.8s] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="relative z-20 bg-stone-900/90 border-b border-white/10 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-800/80 hover:bg-orange-500 hover:text-stone-950 border border-white/10 transition-all cursor-pointer group shadow-md shrink-0"
            title={isPt ? "Voltar ao Perfil" : "Back to Profile"}
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-400 animate-pulse" />
              <h1 className="text-base sm:text-xl font-black uppercase tracking-wider bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                {isPt ? 'Galeria de Títulos' : 'Titles Gallery'}
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-400 font-medium">
              {isPt ? 'Explore e conquiste títulos de honra para exibir no seu perfil' : 'Browse and unlock honorary titles to showcase on your profile'}
            </p>
          </div>
        </div>

        {/* Unlocked Stats Badge */}
        <div className="hidden sm:flex items-center gap-3 bg-stone-950/80 border border-white/10 px-4 py-2 rounded-2xl shrink-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest">
              {isPt ? 'Coleção de Títulos' : 'Title Collection'}
            </div>
            <div className="text-xs font-black text-amber-300">
              {totalUnlockedCount} / {allTitles.length} ({unlockPercentage}%)
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT BODY */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        
        {/* PROGRESS BANNER (Mobile / Small Screens) */}
        <div className="sm:hidden bg-stone-900/90 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-orange-400" />
            <div>
              <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block">
                {isPt ? 'Progresso Total' : 'Total Progress'}
              </span>
              <span className="text-xs font-black text-amber-300">
                {totalUnlockedCount} / {allTitles.length} {isPt ? 'Desbloqueados' : 'Unlocked'}
              </span>
            </div>
          </div>
          <div className="w-24 bg-stone-950 border border-stone-800 rounded-full h-2.5 overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${unlockPercentage}%` }}
            />
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-stone-900/80 border border-white/10 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-md flex flex-col gap-3.5 shadow-xl">
          
          {/* Row 1: Search Input & Status Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isPt ? 'Buscar título por nome ou requisito...' : 'Search title by name or requirement...'}
                className="w-full bg-stone-950/80 border border-white/10 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500/60 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 bg-stone-950/80 border border-white/10 p-1 rounded-xl self-start sm:self-auto shrink-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-orange-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {isPt ? 'Todos' : 'All'}
              </button>
              <button
                onClick={() => setStatusFilter('UNLOCKED')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'UNLOCKED'
                    ? 'bg-emerald-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-400 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 size={11} />
                {isPt ? 'Desbloqueados' : 'Unlocked'}
              </button>
              <button
                onClick={() => setStatusFilter('LOCKED')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'LOCKED'
                    ? 'bg-stone-700 text-stone-200 shadow-md font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Lock size={11} />
                {isPt ? 'Bloqueados' : 'Locked'}
              </button>
            </div>
          </div>

          {/* Row 2: Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    AudioManager.getInstance().playSFX('confirm');
                    setSelectedCategory(cat.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-stone-950 shadow-lg shadow-orange-500/20 scale-105'
                      : 'bg-stone-950/60 border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-orange-400'}`} />
                  {isPt ? cat.label.pt : cat.label.en}
                </button>
              );
            })}
          </div>

          {/* Row 3: Rarity Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 custom-scrollbar">
            <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest mr-1 shrink-0 flex items-center gap-1">
              <Filter size={10} />
              {isPt ? 'Raridade:' : 'Rarity:'}
            </span>
            {rarities.map((r) => {
              const isActive = selectedRarity === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    AudioManager.getInstance().playSFX('confirm');
                    setSelectedRarity(r.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border cursor-pointer ${
                    isActive
                      ? 'bg-stone-800 border-orange-500 text-orange-400 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-stone-950/40 border-white/5 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className={r.color}>{isPt ? r.label.pt : r.label.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TITLES GALLERY GRID */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[300px]">
          {filteredTitles.length === 0 ? (
            <div className="bg-stone-900/40 border border-white/5 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center">
                <Search className="w-7 h-7 text-stone-500" />
              </div>
              <p className="text-sm font-bold text-stone-300">
                {isPt ? 'Nenhum título encontrado com os filtros selecionados.' : 'No titles found with the selected filters.'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedRarity('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer"
              >
                {isPt ? 'Limpar Filtros' : 'Clear Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pb-6">
              {filteredTitles.map((title) => {
                const isUnlocked = unlockedTitlesSet.has(title.id) || (title.checkUnlock && playerProfile ? title.checkUnlock(playerProfile) : false);
                const isEquipped = equippedTitleId === title.id;
                const rStyle = rarityBadgeStyles[title.rarity] || rarityBadgeStyles.COMMON;
                const progress = title.getProgress && playerProfile ? title.getProgress(playerProfile) : null;

                return (
                  <div
                    key={title.id}
                    onClick={() => setDetailTitle(title)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden group cursor-pointer ${
                      isEquipped
                        ? 'bg-gradient-to-b from-amber-950/40 via-stone-900/90 to-stone-950 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40'
                        : isUnlocked
                        ? 'bg-stone-900/80 hover:bg-stone-900 border-white/10 hover:border-orange-500/50 hover:shadow-lg'
                        : 'bg-stone-950/60 border-stone-800/80 opacity-75 hover:opacity-100 hover:border-stone-700'
                    }`}
                  >
                    {/* TOP BADGE & EQUIPPED / RARITY TAG */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <PlayerTitleBadge titleKey={title.id} size="md" isPt={isPt} showRarityTag />
                      </div>

                      {/* Status Indicator */}
                      {isEquipped ? (
                        <span className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-md">
                          <Check size={11} className="stroke-[3]" />
                          {isPt ? 'Equipado' : 'Equipped'}
                        </span>
                      ) : isUnlocked ? (
                        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 size={10} />
                          {isPt ? 'Desbloqueado' : 'Unlocked'}
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-stone-900 text-stone-500 border border-stone-800">
                          <Lock size={10} />
                          {isPt ? 'Bloqueado' : 'Locked'}
                        </span>
                      )}
                    </div>

                    {/* DESCRIPTION & REQUIREMENT TEXT */}
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs text-stone-300 leading-relaxed line-clamp-2">
                        {isPt ? title.description.pt_br : title.description.en_us}
                      </p>

                      {/* Unlock Requirement Box */}
                      <div className={`p-2.5 rounded-xl border text-[10px] leading-snug flex items-start gap-2 ${
                        isUnlocked 
                          ? 'bg-stone-950/60 border-white/5 text-stone-400' 
                          : 'bg-stone-950/80 border-stone-800/80 text-amber-300/90'
                      }`}>
                        <Info size={13} className={`shrink-0 mt-0.5 ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <div>
                          <span className="font-bold block text-[9px] uppercase tracking-wider text-stone-400">
                            {isPt ? 'Requisito:' : 'Requirement:'}
                          </span>
                          <span>
                            {title.requirement ? (isPt ? title.requirement.pt_br : title.requirement.en_us) : (isPt ? 'Conquista especial da arena.' : 'Special arena achievement.')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR (IF QUANTIFIABLE AND LOCKED) */}
                    {!isUnlocked && progress && progress.max > 1 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-stone-400">
                          <span>{isPt ? 'Progresso' : 'Progress'}</span>
                          <span className="text-amber-400">{progress.label}</span>
                        </div>
                        <div className="w-full bg-stone-950 border border-stone-800 rounded-full h-2 overflow-hidden p-0.5">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (progress.current / progress.max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* BOTTOM ACTION BUTTON */}
                    <div className="pt-1 flex items-center justify-between border-t border-white/5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                        {isPt ? 'Clique para detalhes' : 'Click for details'}
                      </span>

                      {isUnlocked && !isEquipped && (
                        <button
                          onClick={(e) => handleEquip(title.id, e)}
                          disabled={isOfflineMode}
                          className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-400 text-stone-950 shadow-md transition-all cursor-pointer"
                        >
                          {isPt ? 'Equipar Título' : 'Equip Title'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL FOR SELECTED TITLE */}
      {detailTitle && (() => {
        const title = detailTitle;
        const isUnlocked = unlockedTitlesSet.has(title.id) || (title.checkUnlock && playerProfile ? title.checkUnlock(playerProfile) : false);
        const isEquipped = equippedTitleId === title.id;
        const progress = title.getProgress && playerProfile ? title.getProgress(playerProfile) : null;
        const rStyle = rarityBadgeStyles[title.rarity] || rarityBadgeStyles.COMMON;

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setDetailTitle(null)}
          >
            <div 
              className="bg-stone-900 border border-white/10 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative flex flex-col gap-5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Close Button */}
              <button
                onClick={() => setDetailTitle(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Title Header */}
              <div className="flex flex-col items-center text-center gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-stone-950 border border-white/10 shadow-lg">
                  <PlayerTitleBadge titleKey={title.id} size="lg" isPt={isPt} showRarityTag />
                </div>

                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-white">
                    {isPt ? title.name.pt_br : title.name.en_us}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border ${rStyle.bg} ${rStyle.border} ${rStyle.text}`}>
                      {title.rarity}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-950 px-2.5 py-0.5 rounded border border-stone-800">
                      {title.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Lore */}
              <div className="bg-stone-950/80 border border-white/5 p-4 rounded-2xl space-y-2">
                <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest block">
                  {isPt ? 'Descrição / História' : 'Description / Lore'}
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {isPt ? title.description.pt_br : title.description.en_us}
                </p>
              </div>

              {/* Unlock Requirement Checklist */}
              <div className="bg-stone-950/80 border border-white/5 p-4 rounded-2xl space-y-2.5">
                <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest block">
                  {isPt ? 'Como Desbloquear' : 'How to Unlock'}
                </span>
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-amber-400'}`}>
                    {isUnlocked ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-200">
                      {title.requirement ? (isPt ? title.requirement.pt_br : title.requirement.en_us) : (isPt ? 'Conquista de honra em batalhas.' : 'Honor achievement in battles.')}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {isUnlocked 
                        ? (isPt ? 'Requisito concluído! Título disponível no seu inventário.' : 'Requirement completed! Title available in inventory.') 
                        : (isPt ? 'Cumpra este requisito para desbloquear este título.' : 'Complete this requirement to unlock this title.')}
                    </p>
                  </div>
                </div>

                {/* Quantitative Progress */}
                {progress && (
                  <div className="pt-2 space-y-1 border-t border-white/5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-stone-400">{isPt ? 'Progresso Atual:' : 'Current Progress:'}</span>
                      <span className="text-amber-400">{progress.label}</span>
                    </div>
                    <div className="w-full bg-stone-900 border border-stone-800 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (progress.current / progress.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Profile Card Live Preview */}
              <div className="bg-stone-950/80 border border-white/5 p-3.5 rounded-2xl space-y-2">
                <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest block">
                  {isPt ? 'Pré-visualização do Perfil' : 'Profile Live Preview'}
                </span>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shrink-0">
                    <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center">
                      <User size={18} className="text-amber-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {playerProfile?.name || 'Guerreiro Z'}
                    </div>
                    <div className="mt-1">
                      <PlayerTitleBadge titleKey={title.id} size="xs" isPt={isPt} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDetailTitle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all cursor-pointer"
                >
                  {isPt ? 'Fechar' : 'Close'}
                </button>

                {isUnlocked && (
                  <button
                    onClick={() => {
                      handleEquip(title.id);
                      setDetailTitle(null);
                    }}
                    disabled={isEquipped || isOfflineMode}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer ${
                      isEquipped
                        ? 'bg-amber-500 text-stone-950 font-bold opacity-80 cursor-default'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-stone-950'
                    }`}
                  >
                    {isEquipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar Título' : 'Equip Title')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
