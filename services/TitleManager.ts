import { PlayerProfile } from '../types';
import { RankService } from './RankService';

export type TitleCategory = 'ALL' | 'HALL_OF_FAME' | 'RANK' | 'ACHIEVEMENTS' | 'SPECIAL' | 'STORY';
export type TitleRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ETERNAL';

export interface TitleDefinition {
  id: string;
  name: {
    pt_br: string;
    en_us: string;
  };
  description: {
    pt_br: string;
    en_us: string;
  };
  requirement?: {
    pt_br: string;
    en_us: string;
  };
  category: TitleCategory;
  rarity: TitleRarity;
  color: string; // Tailwind text color
  borderColor: string; // Tailwind border
  bgColor: string; // Tailwind bg
  glowColor?: string; // Box shadow glow
  img?: string;
  icon?: string; // Emoji or visual icon symbol
  checkUnlock?: (profile: PlayerProfile, hallOfFameRank?: number) => boolean;
  getProgress?: (profile: PlayerProfile, hallOfFameRank?: number) => { current: number; max: number; label: string };
}

export const TITLE_REGISTRY: Record<string, TitleDefinition> = {
  // --- DEFAULT STARTER ---
  'warrior': {
    id: 'warrior',
    name: { pt_br: 'Guerreiro Supremo', en_us: 'Supreme Warrior' },
    description: { pt_br: 'Título inicial concedido a todos os lutadores da arena.', en_us: 'Starter title granted to all arena combatants.' },
    category: 'SPECIAL',
    rarity: 'COMMON',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10',
    icon: '⚔️',
    checkUnlock: () => true,
  },

  // --- HALL OF FAME & LEADERBOARD ---
  'hof_god': {
    id: 'hof_god',
    name: { pt_br: 'Soberano do Hall da Fama', en_us: 'Supreme Hall Sovereign' },
    description: { pt_br: 'Alcançou a posição #1 no Hall da Fama Global.', en_us: 'Achieved Rank #1 in the Global Hall of Fame.' },
    category: 'HALL_OF_FAME',
    rarity: 'ETERNAL',
    color: 'text-amber-300',
    borderColor: 'border-amber-400/80',
    bgColor: 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30',
    glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
    icon: '👑',
    checkUnlock: (_, hofRank) => typeof hofRank === 'number' && hofRank === 1,
  },
  'hof_top3': {
    id: 'hof_top3',
    name: { pt_br: 'Lenda do Olimpo Z', en_us: 'Z Olympus Legend' },
    description: { pt_br: 'Conquistou um lugar no Top 3 do Hall da Fama Global.', en_us: 'Earned a spot in the Top 3 of Global Hall of Fame.' },
    category: 'HALL_OF_FAME',
    rarity: 'LEGENDARY',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-400/60',
    bgColor: 'bg-yellow-500/15',
    glowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]',
    icon: '🥇',
    checkUnlock: (_, hofRank) => typeof hofRank === 'number' && hofRank >= 1 && hofRank <= 3,
  },
  'hof_top10': {
    id: 'hof_top10',
    name: { pt_br: 'Titã do Placar', en_us: 'Leaderboard Titan' },
    description: { pt_br: 'Infiltrou-se no prestigiado Top 10 do Hall da Fama.', en_us: 'Broke into the prestigious Top 10 of the Hall of Fame.' },
    category: 'HALL_OF_FAME',
    rarity: 'EPIC',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/50',
    bgColor: 'bg-orange-500/15',
    icon: '🏆',
    checkUnlock: (_, hofRank) => typeof hofRank === 'number' && hofRank >= 1 && hofRank <= 10,
  },

  // --- RANKED TIERS ---
  'rank_zeno': {
    id: 'rank_zeno',
    name: { pt_br: 'Deus Supremo Zeno', en_us: 'Omni King Zeno' },
    description: { pt_br: 'Alcançou o elo lendário Zeno em partidas ranqueadas (3000+ RP).', en_us: 'Achieved legendary Zeno Rank in competitive matches (3000+ RP).' },
    category: 'RANK',
    rarity: 'ETERNAL',
    color: 'text-pink-300',
    borderColor: 'border-pink-400/80',
    bgColor: 'bg-gradient-to-r from-pink-500/30 via-purple-500/20 to-pink-600/30',
    glowColor: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    icon: '✨',
    checkUnlock: (p) => (p.ranked?.br?.points ?? 0) >= 3000,
  },
  'rank_angel': {
    id: 'rank_angel',
    name: { pt_br: 'Anjo Guia Divino', en_us: 'Divine Angel Guide' },
    description: { pt_br: 'Alcançou o elo Anjo no modo ranqueado (2500+ RP).', en_us: 'Reached Angel Rank in competitive mode (2500+ RP).' },
    category: 'RANK',
    rarity: 'LEGENDARY',
    color: 'text-cyan-300',
    borderColor: 'border-cyan-400/60',
    bgColor: 'bg-cyan-500/20',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    icon: '🌟',
    checkUnlock: (p) => (p.ranked?.br?.points ?? 0) >= 2500,
  },
  'destroyer': {
    id: 'destroyer',
    name: { pt_br: 'Deus da Destruição', en_us: 'God of Destruction' },
    description: { pt_br: 'Alcançou o elo Deus da Destruição (2000+ RP).', en_us: 'Reached God of Destruction Rank (2000+ RP).' },
    category: 'RANK',
    rarity: 'LEGENDARY',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/60',
    bgColor: 'bg-purple-500/20',
    glowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    icon: '🔮',
    checkUnlock: (p) => (p.ranked?.br?.points ?? 0) >= 2000,
  },
  'legend': {
    id: 'legend',
    name: { pt_br: 'Lenda do Clã', en_us: 'Saiyan Legend' },
    description: { pt_br: 'Alcançou o elo Lenda no modo competitivo (1600+ RP).', en_us: 'Reached Legend Rank in competitive mode (1600+ RP).' },
    category: 'RANK',
    rarity: 'EPIC',
    color: 'text-red-400',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-500/15',
    img: '/Assets/ui/Titulos/Exclusivo_Beta.png',
    icon: '🔥',
    checkUnlock: (p) => (p.ranked?.br?.points ?? 0) >= 1600,
  },
  'rank_elite': {
    id: 'rank_elite',
    name: { pt_br: 'Super Elite Saiyajin', en_us: 'Super Elite Saiyan' },
    description: { pt_br: 'Alcançou o elo Super Elite nas arenas ranqueadas (1300+ RP).', en_us: 'Reached Super Elite Rank in competitive arenas (1300+ RP).' },
    category: 'RANK',
    rarity: 'EPIC',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/50',
    bgColor: 'bg-orange-500/15',
    icon: '⚡',
    checkUnlock: (p) => (p.ranked?.br?.points ?? 0) >= 1300,
  },

  // --- COMBAT & ACHIEVEMENTS ---
  'wins_100': {
    id: 'wins_100',
    name: { pt_br: 'Centenário Vitorioso', en_us: 'Centurion Victor' },
    description: { pt_br: 'Acumulou 100 vitórias totais em partidas da arena.', en_us: 'Accumulated 100 total victories in arena matches.' },
    category: 'ACHIEVEMENTS',
    rarity: 'EPIC',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    bgColor: 'bg-emerald-500/15',
    icon: '🎖️',
    checkUnlock: (p) => (p.wins || 0) >= 100,
  },
  'wins_50': {
    id: 'wins_50',
    name: { pt_br: 'Mestre da Arena', en_us: 'Arena Master' },
    description: { pt_br: 'Conquistou 50 vitórias em combates.', en_us: 'Achieved 50 victories in combat.' },
    category: 'ACHIEVEMENTS',
    rarity: 'RARE',
    color: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    icon: '⚔️',
    checkUnlock: (p) => (p.wins || 0) >= 50,
  },
  'win_streak_10': {
    id: 'win_streak_10',
    name: { pt_br: 'Imparável', en_us: 'Unstoppable' },
    description: { pt_br: 'Manteve uma sequência ininterrupta de 10 vitórias seguidas.', en_us: 'Maintained a 10-match winning streak.' },
    category: 'ACHIEVEMENTS',
    rarity: 'EPIC',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-500/15',
    icon: '🔥',
    checkUnlock: (p) => (p.ranked?.br?.winStreak || 0) >= 10,
  },
  'instinct': {
    id: 'instinct',
    name: { pt_br: 'Instinto Divino', en_us: 'Divine Instinct' },
    description: { pt_br: 'Demonstrou esquiva impecável e reflexos sobre-humanos.', en_us: 'Demonstrated flawless dodging and superhuman reflexes.' },
    category: 'ACHIEVEMENTS',
    rarity: 'LEGENDARY',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    bgColor: 'bg-cyan-500/15',
    icon: '👁️',
    checkUnlock: (p) => (p.wins || 0) >= 20,
  },
  'unbreakable': {
    id: 'unbreakable',
    name: { pt_br: 'Inabalável', en_us: 'The Unbreakable' },
    description: { pt_br: 'Superou duras adversidades e venceu lutas decisivas.', en_us: 'Overcame fierce adversity and won critical matches.' },
    category: 'ACHIEVEMENTS',
    rarity: 'RARE',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10',
    icon: '🛡️',
    checkUnlock: (p) => (p.wins || 0) >= 10,
  },
  'god': {
    id: 'god',
    name: { pt_br: 'Deus do Combate', en_us: 'God of Combat' },
    description: { pt_br: 'Dominou adversários com maestria absoluta.', en_us: 'Dominated opponents with absolute mastery.' },
    category: 'ACHIEVEMENTS',
    rarity: 'LEGENDARY',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/50',
    bgColor: 'bg-orange-500/15',
    icon: '⚡',
    checkUnlock: (p) => (p.wins || 0) >= 30,
  },

  // --- SPECIAL & EVENTS ---
  'beta_pioneer': {
    id: 'beta_pioneer',
    name: { pt_br: 'Pioneiro Fighter Legend', en_us: 'Fighter Legend Pioneer' },
    description: { pt_br: 'Exclusivo para os pioneiros que participaram da fase Beta.', en_us: 'Exclusive title for early Beta testers.' },
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/60',
    bgColor: 'bg-amber-500/20',
    img: '/Assets/ui/Titulos/Exclusivo_Beta.png',
    icon: '⭐',
    checkUnlock: () => true, // Granted via event or default pioneer
  },
  'Fighter Legend': {
    id: 'Fighter Legend',
    name: { pt_br: 'Lenda Beta', en_us: 'Beta Legend' },
    description: { pt_br: 'Título comemorativo de lançamento do Fighter Legend.', en_us: 'Commemorative Fighter Legend launch title.' },
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    color: 'text-orange-500',
    borderColor: 'border-orange-600/60',
    bgColor: 'bg-orange-500/20',
    img: '/Assets/ui/Titulos/Exclusivo_Beta.png',
    icon: '🔥',
    checkUnlock: () => true,
  },
  'champion': {
    id: 'champion',
    name: { pt_br: 'Campeão do Torneio', en_us: 'Tournament Champion' },
    description: { pt_br: 'Conquistou o 1º lugar no Torneio de Artes Marciais.', en_us: 'Won 1st place in the Martial Arts Tournament.' },
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/60',
    bgColor: 'bg-yellow-500/15',
    icon: '🏆',
  },
  'combo_master': {
    id: 'combo_master',
    name: { pt_br: 'Mestre dos Combos', en_us: 'Combo Master' },
    description: { pt_br: 'Executou sequências impressionantes de combos devastadores.', en_us: 'Executed devastating high-hit combo sequences.' },
    category: 'SPECIAL',
    rarity: 'RARE',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10',
    icon: '⚡',
  },
};

export class TitleManager {
  /**
   * Get Title definition by ID with robust fallbacks
   */
  public static getTitle(id?: string): TitleDefinition {
    if (!id) return TITLE_REGISTRY['warrior'];
    if (TITLE_REGISTRY[id]) return TITLE_REGISTRY[id];

    // Case-insensitive / normalized lookup
    const found = Object.values(TITLE_REGISTRY).find(
      t => t.id.toLowerCase() === id.toLowerCase() || t.name.pt_br.toLowerCase() === id.toLowerCase()
    );
    if (found) return found;

    // Generic dynamic fallback for custom or unlisted titles
    return {
      id,
      name: { pt_br: id, en_us: id },
      description: { pt_br: 'Título de Honra Conquistado na Arena', en_us: 'Honorary Title Earned in Arena' },
      category: 'SPECIAL',
      rarity: 'EPIC',
      color: 'text-orange-400',
      borderColor: 'border-orange-500/40',
      bgColor: 'bg-orange-500/10',
      icon: '🎖️',
    };
  }

  /**
   * Evaluate player profile to check all eligible unlocked titles
   */
  public static evaluateUnlockedTitles(
    profile: PlayerProfile,
    hallOfFameRank?: number
  ): string[] {
    if (!profile) return ['warrior'];
    const existing = new Set<string>(profile.unlockedTitles || ['warrior']);

    Object.values(TITLE_REGISTRY).forEach((titleDef) => {
      if (titleDef.checkUnlock && titleDef.checkUnlock(profile, hallOfFameRank)) {
        existing.add(titleDef.id);
      }
    });

    return Array.from(existing);
  }

  /**
   * Get all registered titles
   */
  public static getAllTitles(): TitleDefinition[] {
    return Object.values(TITLE_REGISTRY);
  }

  /**
   * Filter titles by category
   */
  public static getTitlesByCategory(category: TitleCategory): TitleDefinition[] {
    if (category === 'ALL') return this.getAllTitles();
    return this.getAllTitles().filter((t) => t.category === category);
  }
}
