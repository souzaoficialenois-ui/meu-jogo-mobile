import { SceneName } from "../types";

export type NewsCategory =
  | "NEW_CHARACTERS"
  | "NEW_TRANSFORMATIONS"
  | "NEW_MAPS"
  | "NEW_GAME_MODES"
  | "NEW_SYSTEMS"
  | "UI_IMPROVEMENTS"
  | "PERFORMANCE"
  | "BUG_FIXES"
  | "BALANCING"
  | "PROJECT_CHANGES";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
  category: NewsCategory;
  imageUrl: string;
  videoUrl?: string; // Optional video URL as requested
  publishDate: string;
  version: string;
  featured: boolean;
  actionTarget?: SceneName;
  actionText?: string;
  actionTextEn?: string;
}

// Latest release version of the game
export const CURRENT_GAME_VERSION = "1.5.0";

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  NEW_CHARACTERS: "Novos Personagens",
  NEW_TRANSFORMATIONS: "Novas Transformações",
  NEW_MAPS: "Novos Mapas",
  NEW_GAME_MODES: "Novos Modos de Jogo",
  NEW_SYSTEMS: "Novos Sistemas",
  UI_IMPROVEMENTS: "Melhorias de Interface",
  PERFORMANCE: "Melhorias de Desempenho",
  BUG_FIXES: "Correções de Bugs",
  BALANCING: "Ajustes de Balanceamento",
  PROJECT_CHANGES: "Alterações Importantes",
};

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  NEW_CHARACTERS: "from-orange-500 to-amber-500 text-orange-400 border-orange-500/30",
  NEW_TRANSFORMATIONS: "from-fuchsia-600 to-pink-500 text-fuchsia-400 border-fuchsia-500/30",
  NEW_MAPS: "from-emerald-500 to-teal-500 text-emerald-400 border-emerald-500/30",
  NEW_GAME_MODES: "from-blue-500 to-indigo-500 text-blue-400 border-blue-500/30",
  NEW_SYSTEMS: "from-purple-500 to-indigo-500 text-purple-400 border-purple-500/30",
  UI_IMPROVEMENTS: "from-cyan-500 to-sky-500 text-cyan-400 border-cyan-500/30",
  PERFORMANCE: "from-amber-500 to-yellow-400 text-amber-400 border-amber-500/30",
  BUG_FIXES: "from-red-500 to-rose-500 text-rose-400 border-rose-500/30",
  BALANCING: "from-teal-500 to-emerald-400 text-teal-400 border-teal-500/30",
  PROJECT_CHANGES: "from-gray-600 to-slate-500 text-slate-300 border-slate-500/30",
};

export const STATIC_NEWS: NewsItem[] = [
  {
    id: "news_v150",
    title: "Grande Atualização v1.5.0 - Broly Ikari & Multiplayer Local",
    titleEn: "Major Update v1.5.0 - Broly Ikari & Local Multiplayer",
    description: "O lendário poder descontrolado chega ao Fighter Legend! Broly Ikari foi adicionado ao elenco oficial com um estilo de luta brutal e devastador. Além disso, agora você pode batalhar com seus amigos lado a lado no mesmo dispositivo!\n\nNovos Personagens:\n- Broly Ikari (Fúria Descontrolada)\n\nNovos Sistemas:\n- Multiplayer Local (Contra Local usando gamepads ou teclado dividido)\n\nCorreções & Melhorias:\n- Otimização do sistema de animações e renderização de partículas para maior fluidez.\n- Correção de conflitos entre personagens e Beams de Ki.",
    descriptionEn: "The legendary uncontrolled power arrives in Fighter Legend! Broly Ikari has been added to the official roster with a brutal and devastating fighting style. Plus, you can now battle your friends side-by-side on the same device!\n\nNew Characters:\n- Broly Ikari (Uncontrolled Fury)\n\nNew Systems:\n- Local Multiplayer (Local Versus using gamepads or split keyboard)\n\nFixes & Improvements:\n- Optimized animation system and particle rendering for enhanced smoothness.\n- Fixed conflicts between characters and Ki Beams.",
    category: "NEW_CHARACTERS",
    imageUrl: "/Assets/personagens/brolyikari/prewiew.png",
    publishDate: "2026-06-23",
    version: "1.5.0",
    featured: true,
    actionTarget: SceneName.CHARACTER_SELECT,
    actionText: "Escolher Personagens",
    actionTextEn: "Select Characters",
  },
  {
    id: "news_v142",
    title: "Balanceamento Semanal v1.4.2 - Ajustes de Personagens & Ki",
    titleEn: "Weekly Balance v1.4.2 - Fighter & Ki Adjustments",
    description: "Revisamos o balanceamento com base no feedback competitivo da comunidade!\n\nBalanceamento:\n- Vegeta Ego: Custo de Ki de habilidades reduzido para melhorar a sustentação dos combos.\n- Gogeta SSJ4: Dano base do ataque forte levemente reduzido para equilíbrio em competições.\n- Tiros de Ki: Tempo de atordoamento (stun) reduzido em 15% para lutas mais dinâmicas e fluidas.",
    descriptionEn: "We've revised the balance based on competitive feedback from the community!\n\nBalancing:\n- Vegeta Ego: Ki cost of skills reduced to improve combo sustainability.\n- Gogeta SSJ4: Heavy attack base damage slightly reduced for competitive balance.\n- Ki Blasts: Stun time reduced by 15% for more dynamic and fluid fights.",
    category: "BALANCING",
    imageUrl: "/Assets/cenarios/deserto/prewiew.png",
    publishDate: "2026-06-15",
    version: "1.4.2",
    featured: false,
  },
  {
    id: "news_v130",
    title: "Novas Transformações v1.3.0 - Instinto Superior Divino",
    titleEn: "New Transformations v1.3.0 - Divine Ultra Instinct",
    description: "Goku alcançou o estado supremo! A nova transformação do Instinto Superior traz mecânicas de esquiva automática de golpes físicos ao custo de Ki, gasto inteligente de Ki em rajadas e efeitos visuais incríveis.\n\nNovas Transformações:\n- Goku MUI (Instinto Superior)\n\nMelhorias:\n- Otimizações no consumo de bateria em dispositivos mobile.",
    descriptionEn: "Goku has reached the ultimate state! The new Ultra Instinct transformation brings automatic physical dodge mechanics at the cost of Ki, smart Ki spending on blasts, and amazing visual effects.\n\nNew Transformations:\n- Goku MUI (Mastered Ultra Instinct)\n\nImprovements:\n- Optimized battery consumption on mobile devices.",
    category: "NEW_TRANSFORMATIONS",
    imageUrl: "/Assets/personagens/gokumui/prewiew.gif",
    publishDate: "2026-06-05",
    version: "1.3.0",
    featured: true,
  },
  {
    id: "news_v120",
    title: "Novos Mapas v1.2.0 - Templo Celestial de Kami-Sama",
    titleEn: "New Maps v1.2.0 - Kami-Sama's Lookout",
    description: "Lute acima das nuvens! O cenário sagrado do Templo Celestial de Kami-Sama está agora disponível em todos os modos.\n\nNovos Mapas:\n- Templo Celestial de Kami-Sama\n\nDetalhes:\n- Fundo paralaxe multicamadas avançado.\n- Iluminação adaptativa em tempo real com base na energia Ki dos lutadores.",
    descriptionEn: "Battle above the clouds! The sacred Kami-Sama's Lookout stage is now available in all modes.\n\nNew Maps:\n- Kami-Sama's Lookout\n\nDetails:\n- Advanced multi-layer parallax background.\n- Real-time adaptive lighting based on the fighters' Ki energy.",
    category: "NEW_MAPS",
    imageUrl: "/Assets/cenarios/casamestrekame/prewiew.png",
    publishDate: "2026-05-20",
    version: "1.2.0",
    featured: false,
  },
  {
    id: "news_v110",
    title: "Otimização & Fluidez v1.1.0 - Correção de Travamentos",
    titleEn: "Optimization & Smoothness v1.1.0 - Crash Fixes",
    description: "Focamos 100% no desempenho e suavidade dos menus de seleção de personagens e mapas.\n\nMelhorias:\n- Carregamento de interface inteligente e assíncrono em segundo plano.\n- Transições e fades otimizados sem perda de frames por segundo (60 FPS).\n- Redução de uso de memória de texturas de interface.",
    descriptionEn: "We focused 100% on performance and smoothness of the character and map selection menus.\n\nImprovements:\n- Smart, asynchronous background UI loading.\n- Optimized transitions and fades without loss of frames per second (60 FPS).\n- Reduced UI texture memory usage.",
    category: "PERFORMANCE",
    imageUrl: "/Assets/cenarios/espaco/prewiew.png",
    publishDate: "2026-05-10",
    version: "1.1.0",
    featured: false,
  },
  {
    id: "news_v100",
    title: "Lançamento Oficial Fighter Legend! v1.0.0",
    titleEn: "Official Release Fighter Legend! v1.0.0",
    description: "Bem-vindo ao Fighter Legend! O jogo de luta definitivo no navegador está oficialmente no ar com múltiplos modos de jogo, dezenas de personagens épicos, transformações em tempo real e um poderoso criador de movimentos e beams.\n\nModos de Jogo:\n- Arcade (Invasão Z)\n- Sobrevivência (Horda Infinita)\n- Treino (Sala do Tempo)\n- Chefe Colossal (Desafio Divino)",
    descriptionEn: "Welcome to Fighter Legend! The ultimate browser fighting game is officially live with multiple game modes, dozens of epic characters, real-time transformations, and a powerful move and beam creator.\n\nGame Modes:\n- Arcade (Z Invasion)\n- Survival (Infinite Horde)\n- Training (Hyperbolic Time Chamber)\n- Colossal Boss (Divine Challenge)",
    category: "NEW_GAME_MODES",
    imageUrl: "/Assets/cenarios/torneiopoder/prewiew.png",
    publishDate: "2026-05-01",
    version: "1.0.0",
    featured: false,
  }
];

export class NewsManager {
  private static instance: NewsManager;

  private constructor() {}

  public static getInstance(): NewsManager {
    if (!NewsManager.instance) {
      NewsManager.instance = new NewsManager();
    }
    return NewsManager.instance;
  }

  /**
   * Get all news items sorted: Highlights (Featured) first, then by publish date descending
   */
  public getAllNews(): NewsItem[] {
    return [...STATIC_NEWS].sort((a, b) => {
      // Featured first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then by date descending
      return b.publishDate.localeCompare(a.publishDate);
    });
  }

  /**
   * Returns whether the player has seen the newly installed update (version comparison)
   */
  public hasSeenCurrentVersion(): boolean {
    try {
      const lastSeenVersion = localStorage.getItem("dd2d_last_seen_version");
      return lastSeenVersion === CURRENT_GAME_VERSION;
    } catch {
      return false;
    }
  }

  /**
   * Marks the current game version update as seen/visualized
   */
  public markCurrentVersionAsSeen(): void {
    try {
      localStorage.setItem("dd2d_last_seen_version", CURRENT_GAME_VERSION);
      // Automatically add this version's news ID to seen list as well
      const currentNews = STATIC_NEWS.find(n => n.version === CURRENT_GAME_VERSION);
      if (currentNews) {
        this.markAsSeen(currentNews.id);
      }
      window.dispatchEvent(new CustomEvent("dd2d_news_updated"));
    } catch (e) {
      console.error("Failed to mark current version as seen:", e);
    }
  }

  /**
   * Returns a list of seen news IDs from local storage
   */
  public getSeenNewsIds(): string[] {
    try {
      const data = localStorage.getItem("dd2d_seen_news_ids");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Marks a news item as seen/read
   */
  public markAsSeen(id: string): void {
    try {
      const seen = this.getSeenNewsIds();
      if (!seen.includes(id)) {
        seen.push(id);
        localStorage.setItem("dd2d_seen_news_ids", JSON.stringify(seen));
        window.dispatchEvent(new CustomEvent("dd2d_news_updated"));
      }
    } catch (e) {
      console.error("Failed to mark news as seen:", e);
    }
  }

  /**
   * Marks ALL news items as seen/read
   */
  public markAllAsSeen(): void {
    try {
      const allIds = STATIC_NEWS.map((n) => n.id);
      localStorage.setItem("dd2d_seen_news_ids", JSON.stringify(allIds));
      // Also ensure the version is marked as seen
      localStorage.setItem("dd2d_last_seen_version", CURRENT_GAME_VERSION);
      window.dispatchEvent(new CustomEvent("dd2d_news_updated"));
    } catch (e) {
      console.error("Failed to mark all news as seen:", e);
    }
  }

  /**
   * Returns unread news count
   */
  public getUnreadNewsCount(): number {
    const seen = this.getSeenNewsIds();
    return STATIC_NEWS.filter((n) => !seen.includes(n.id)).length;
  }

  /**
   * Checks if there's any unread news item at all
   */
  public hasUnreadNews(): boolean {
    return this.getUnreadNewsCount() > 0;
  }
}
