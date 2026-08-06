import React from 'react';
import { TitleManager, TitleRarity } from '../../services/TitleManager';

interface PlayerTitleBadgeProps {
  titleKey?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isPt?: boolean;
  className?: string;
  showRarityTag?: boolean;
}

export const PlayerTitleBadge: React.FC<PlayerTitleBadgeProps> = ({
  titleKey,
  size = 'md',
  isPt = true,
  className = '',
  showRarityTag = false,
}) => {
  const title = TitleManager.getTitle(titleKey);
  const name = isPt ? title.name.pt_br : title.name.en_us;

  // Size variations
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[8px] gap-1 rounded-md border',
    sm: 'px-2.5 py-0.5 text-[9px] gap-1.5 rounded-lg border',
    md: 'px-3 py-1 text-[11px] gap-2 rounded-xl border',
    lg: 'px-4 py-1.5 text-xs gap-2.5 rounded-2xl border',
  }[size];

  const imgHeight = {
    xs: 'h-3.5',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  }[size];

  const rarityColors: Record<TitleRarity, string> = {
    COMMON: 'text-stone-400 bg-stone-500/10 border-stone-500/20',
    RARE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    EPIC: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    LEGENDARY: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
    ETERNAL: 'text-pink-300 bg-pink-500/20 border-pink-400/50',
  };

  return (
    <div
      className={`inline-flex items-center font-black uppercase tracking-wider select-none relative overflow-hidden backdrop-blur-md transition-all duration-300 group/badge ${sizeClasses} ${title.bgColor} ${title.borderColor} ${title.color} ${title.glowColor || ''} ${
        title.rarity === 'ETERNAL' ? 'animate-badge-shimmer bg-gradient-to-r from-pink-950/40 via-purple-900/40 to-pink-950/40' : ''
      } ${title.rarity === 'LEGENDARY' ? 'bg-gradient-to-r from-amber-950/30 via-yellow-900/30 to-amber-950/30' : ''} ${className}`}
    >
      {/* Animated Shine Sweep Effect */}
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine-sweep pointer-events-none" />

      {/* Background glow animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />

      {/* Title Image Asset or Icon */}
      {title.img ? (
        <img
          src={title.img}
          alt={name}
          className={`${imgHeight} object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-transform group-hover/badge:scale-110`}
        />
      ) : (
        <span className="leading-none text-[1.1em] transition-transform group-hover/badge:scale-110">{title.icon || '🎖️'}</span>
      )}

      {/* Title Name Text */}
      <span className="truncate drop-shadow-sm font-black">{name}</span>

      {/* Rarity Tag */}
      {showRarityTag && (
        <span
          className={`ml-1 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border shadow-sm ${rarityColors[title.rarity]}`}
        >
          {title.rarity}
        </span>
      )}
    </div>
  );
};
