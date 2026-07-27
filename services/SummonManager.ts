import { BASE_CHARACTERS, BANNERS } from '../constants';
import { CharacterData, RarityTier, Banner } from '../types';

export interface GachaItem {
    id: string;
    name: string;
    rarity: RarityTier;
    category: 'CHARACTER' | 'Avatar' | 'Fundo' | 'Cenario';
    color: string;
    description: string;
    imageUrl: string;
}

export interface GachaResult {
    type: 'CHARACTER' | 'ITEM' | 'COIN' | 'CRYSTAL';
    character?: CharacterData;
    item?: GachaItem;
    coinsAmount?: number;
    crystalCharId?: string;
    quantity?: number;
    isNew: boolean;
}

export class SummonManager {
  
  public static GACHA_ITEMS: GachaItem[] = [
    // Avatars (1-28)
    ...Array.from({ length: 28 }, (_, i) => ({
        id: `avatar_${i+1}`,
        name: `Avatar Guerreiro #${i+1}`,
        rarity: (i < 15 ? 'COMMON' : i < 24 ? 'RARE' : 'EPIC') as RarityTier,
        category: 'Avatar' as const,
        color: '#a855f7',
        description: 'Um novo avatar exclusivo para personalizar seu perfil.',
        imageUrl: `/Assets/avatar/retrato/${i+1}.png`
    })),
    
    // Backgrounds (Fundos de Perfil/Banner)
    ...['b1', 'b2', 'b3', 'b4'].map((id, i) => ({
        id: `fundo_${id}`,
        name: `Fundo de Perfil ${id.toUpperCase()}`,
        rarity: (i < 2 ? 'COMMON' : 'EPIC') as RarityTier,
        category: 'Fundo' as const,
        color: '#3b82f6',
        description: 'Um fundo temático para destacar seu perfil.',
        imageUrl: `/Assets/fundosdastelas/fundobanner/${id}.png`
    })),

    // Scenarios (Cenários de Batalha reais)
    {
        id: 'cenario_casamestrekame',
        name: 'Casa do Mestre Kame',
        rarity: 'COMMON',
        category: 'Cenario' as const,
        color: '#ef4444',
        description: 'A icônica ilha do Mestre Kame.',
        imageUrl: '/Assets/cenarios/casamestrekame/prewiew.png'
    },
    {
        id: 'cenario_deserto',
        name: 'Deserto Rochoso',
        rarity: 'COMMON',
        category: 'Cenario' as const,
        color: '#ef4444',
        description: 'Um deserto vasto perfeito para combates intensos.',
        imageUrl: '/Assets/cenarios/deserto/prewiew.png'
    },
    {
        id: 'cenario_espaco',
        name: 'Vácuo do Espaço',
        rarity: 'LEGENDARY',
        category: 'Cenario' as const,
        color: '#ef4444',
        description: 'Batalhe entre as estrelas e galáxias distantes.',
        imageUrl: '/Assets/cenarios/espaco/prewiew.png'
    },
    {
        id: 'cenario_insidebuu',
        name: 'Interior de Buu',
        rarity: 'LEGENDARY',
        category: 'Cenario' as const,
        color: '#ef4444',
        description: 'Um local bizarro e perigoso dentro do demônio Majin.',
        imageUrl: '/Assets/cenarios/insidebuu/prewiew.png'
    },
    {
        id: 'cenario_torneiopoder',
        name: 'Torneio do Poder',
        rarity: 'ETERNAL',
        category: 'Cenario' as const,
        color: '#ef4444',
        description: 'O palco supremo onde universos lutam pela sobrevivência.',
        imageUrl: '/Assets/cenarios/torneiopoder/prewiew.png'
    },
    // Beta Exclusive Items (Mission Only - Kept in list for Warehouse visibility)
    {
        id: 'avatar_beta_exclusive',
        name: 'Guerreiro Beta',
        rarity: 'LEGENDARY',
        category: 'Avatar' as const,
        color: '#fbbf24',
        description: 'Avatar exclusivo concedido apenas aos combatentes que participaram da fase de testes beta. (Fonte: Missões de Evento Especial Beta)',
        imageUrl: '/Assets/avatar/retrato/Excluviso_Beta.png'
    },
    {
        id: 'bg_beta_pioneer',
        name: 'Pioneiro da Arena',
        rarity: 'LEGENDARY',
        category: 'Fundo' as const,
        color: '#fbbf24',
        description: 'Fundo de perfil exclusivo para os primeiros guerreiros a desbravarem o mundo de Dragon Dash. (Fonte: Missões de Evento Especial Beta)',
        imageUrl: '/Assets/avatar/fundo/Excluviso_Beta.png'
    }
  ];

  // Stage 1: Category Weights (Total: 100)
  public static CATEGORY_WEIGHTS = {
    COIN: 50,
    FUNDO: 20,
    AVATAR: 18,
    CRYSTAL: 10,
    SCENARIO: 7,
    CHARACTER: 5
  };

  // Stage 2: Rarity Probabilities per Banner Type
  public static BANNER_RARITY_RATES: Record<string, Record<RarityTier, number>> = {
    STANDARD: { // Gacha Geral
      COMMON: 70,
      RARE: 25,
      EPIC: 4.5,
      LEGENDARY: 0.4,
      ETERNAL: 0.1
    },
    LEGENDARY: { // Gacha Lendária
      COMMON: 20,
      RARE: 35,
      EPIC: 30,
      LEGENDARY: 14,
      ETERNAL: 1
    },
    EPIC: { // Gacha Épica
      COMMON: 40,
      RARE: 35,
      EPIC: 20,
      LEGENDARY: 4.5,
      ETERNAL: 0.5
    },
    EVENT: { // Gacha Eterna / Eventos
      COMMON: 10,
      RARE: 25,
      EPIC: 40,
      LEGENDARY: 20,
      ETERNAL: 5
    }
  };

  public static initialize() {
      // Basic initialization
  }

  public static rollBanner(bannerId: string, currentRosterIds: string[], unlockedItemIds: string[]): GachaResult {
      const banner = BANNERS.find(b => b.id === bannerId) || BANNERS[0];
      
      // Stage 1: Roll Category
      const totalWeight = Object.values(this.CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
      const categoryRoll = Math.random() * totalWeight;
      
      let category: keyof typeof SummonManager.CATEGORY_WEIGHTS = 'COIN';
      let cumulativeWeight = 0;
      
      for (const [cat, weight] of Object.entries(this.CATEGORY_WEIGHTS)) {
          cumulativeWeight += weight;
          if (categoryRoll < cumulativeWeight) {
              category = cat as any;
              break;
          }
      }

      // Stage 2: Roll Rarity based on Banner Type
      const rarity = this.rollRarity(banner.type);

      // Handle Category Reward
      switch (category) {
          case 'COIN':
              return {
                  type: 'COIN',
                  coinsAmount: this.rollCoinAmount(),
                  quantity: 1,
                  isNew: false
              };

          case 'CRYSTAL':
              return this.rollCrystalWithRarity(bannerId, rarity);

          case 'AVATAR':
              return this.rollSpecificItem(bannerId, 'Avatar', rarity, unlockedItemIds);

          case 'FUNDO':
              return this.rollSpecificItem(bannerId, 'Fundo', rarity, unlockedItemIds);

          case 'SCENARIO':
              return this.rollSpecificItem(bannerId, 'Cenario', rarity, unlockedItemIds);

          case 'CHARACTER': {
              const char = this.rollCharacter(bannerId, rarity);
              const isNew = !currentRosterIds.includes(char.id);
              
              if (!isNew) {
                  // Duplicate character gives crystals
                  return {
                      type: 'CRYSTAL',
                      crystalCharId: char.id,
                      quantity: 10,
                      isNew: false
                  };
              }

              return {
                  type: 'CHARACTER',
                  character: char,
                  quantity: 1,
                  isNew: true
              };
          }
          
          default:
              return {
                  type: 'COIN',
                  coinsAmount: 5,
                  quantity: 1,
                  isNew: false
              };
      }
  }

  private static rollRarity(bannerType: string): RarityTier {
      const rates = this.BANNER_RARITY_RATES[bannerType] || this.BANNER_RARITY_RATES.STANDARD;
      const rand = Math.random() * 100;
      
      let cumulative = 0;
      // Order: ETERNAL, LEGENDARY, EPIC, RARE, COMMON
      const order: RarityTier[] = ['ETERNAL', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
      
      for (const tier of order) {
          cumulative += rates[tier];
          if (rand < cumulative) return tier;
      }
      
      return 'COMMON';
  }

  private static rollSpecificItem(bannerId: string, category: 'Avatar' | 'Fundo' | 'Cenario', rarity: RarityTier, unlockedItemIds: string[]): GachaResult {
      const bannerItemPool = this.getItemsForBanner(bannerId);
      let pool = bannerItemPool.filter(item => item.category === category && item.rarity === rarity);
      
      // Fallback if rarity doesn't exist in pool for this category but STAY IN BANNER
      if (pool.length === 0) {
          pool = bannerItemPool.filter(item => item.category === category);
      }
      
      // If absolutely nothing found for this category in this banner
      if (pool.length === 0) {
          return {
              type: 'COIN',
              coinsAmount: 10,
              quantity: 1,
              isNew: false
          };
      }

      const item = pool[Math.floor(Math.random() * pool.length)];
      return {
          type: 'ITEM',
          item: item,
          quantity: 1,
          isNew: !unlockedItemIds.includes(item.id)
      };
  }

  private static rollCharacter(bannerId: string, rarity: RarityTier): CharacterData {
      const banner = BANNERS.find(b => b.id === bannerId) || BANNERS[0];
      const bannerPool = this.getPoolForBanner(bannerId);
      
      if (bannerPool.length === 0) return BASE_CHARACTERS[0];
      
      // Try to find character of rolled rarity in banner pool
      let pool = bannerPool.filter(c => c.rarity === rarity);
      
      if (pool.length === 0) {
          // If no char of that rarity in banner, try to find in ANY rarity in banner
          pool = bannerPool;
      }

      // Featured Logic
      if (rarity === 'LEGENDARY' || rarity === 'ETERNAL') {
          const featured = bannerPool.find(c => c.id === banner.featuredCharId);
          if (featured && Math.random() < 0.5) {
              return featured;
          }
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex];
  }

  private static rollCrystalWithRarity(bannerId: string, rarity: RarityTier): GachaResult {
      // If rarity is ETERNAL or LEGENDARY, high chance of Universal or high-tier crystals
      if (rarity === 'ETERNAL' || rarity === 'LEGENDARY') {
          if (Math.random() < 0.4) {
              return {
                  type: 'CRYSTAL',
                  crystalCharId: 'UNIVERSAL',
                  quantity: rarity === 'ETERNAL' ? 10 : 5,
                  isNew: false
              };
          }
      }

      const pool = this.getPoolForBanner(bannerId).filter(c => c.rarity === rarity);
      const char = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : this.getPoolForBanner(bannerId)[0];
      
      const quantities = {
          COMMON: [5, 10, 15],
          RARE: [3, 5, 10],
          EPIC: [2, 3, 5],
          LEGENDARY: [1, 2, 3],
          ETERNAL: [1, 2]
      };
      
      const qPool = quantities[rarity] || quantities.COMMON;
      const quantity = qPool[Math.floor(Math.random() * qPool.length)];
      
      return {
          type: 'CRYSTAL',
          crystalCharId: char?.id || 'UNIVERSAL',
          quantity: quantity,
          isNew: false
      };
  }

  private static rollCoinAmount(): number {
      const rand = Math.random() * 100;
      if (rand < 0.5) return 100;
      if (rand < 2.0) return 50;
      if (rand < 8.0) return 25;
      if (rand < 15.0) return 10;
      if (rand < 35.0) return 5;
      if (rand < 65.0) return 3;
      return 1;
  }

  /**
   * Returns items filtered by banner, ensuring exclusivity.
   */
  public static getItemsForBanner(bannerId: string): GachaItem[] {
    if (bannerId === 'rare_items') {
        // Exclusive: Legendary and Eternal Scenarios
        return this.GACHA_ITEMS.filter(item => 
            item.category === 'Cenario' && 
            (item.rarity === 'LEGENDARY' || item.rarity === 'ETERNAL' || item.rarity === 'EPIC')
        );
    }

    if (bannerId === 'banner_epic') {
        return this.GACHA_ITEMS.filter(item => {
            if (item.category === 'Avatar') {
                const idNum = parseInt(item.id.replace('avatar_', ''));
                return idNum >= 11 && idNum <= 20;
            }
            if (item.category === 'Fundo') {
                return item.id === 'fundo_b2';
            }
            return false;
        });
    }

    if (bannerId === 'banner_legendary') {
        // Exclusive: High tier Avatars (21-28), Backgrounds b3-b4
        return this.GACHA_ITEMS.filter(item => {
            if (item.category === 'Avatar') {
                const idNum = parseInt(item.id.replace('avatar_', ''));
                return idNum >= 21;
            }
            if (item.category === 'Fundo') {
                return item.id === 'fundo_b3' || item.id === 'fundo_b4';
            }
            return false;
        });
    }

    if (bannerId === 'banner_standard') {
        // Exclusive: Low-tier Avatars (1-10) and Background b1
        return this.GACHA_ITEMS.filter(item => {
            if (item.category === 'Avatar') {
                const idNum = parseInt(item.id.replace('avatar_', ''));
                return idNum <= 10;
            }
            if (item.category === 'Fundo') {
                return item.id === 'fundo_b1';
            }
            if (item.category === 'Cenario') {
                return item.rarity === 'COMMON';
            }
            return false;
        });
    }
    
    return [];
  }

  /**
   * Returns the list of characters available in a specific banner, ensuring exclusivity.
   */
  public static getPoolForBanner(bannerId: string): CharacterData[] {
      if (bannerId === 'banner_standard') {
          return BASE_CHARACTERS.filter(c => 
              ['goku_base', 'kuririn', 'frieza_final', 'goku_ssj'].includes(c.id)
          );
      }
      
      if (bannerId === 'banner_epic') {
          return BASE_CHARACTERS.filter(c => 
              ['broly_ikari', 'trunks_ssj2'].includes(c.id)
          );
      }
      
      if (bannerId === 'banner_legendary') {
          return BASE_CHARACTERS.filter(c => 
              ['gogeta_ssj4', 'goku_blue'].includes(c.id)
          );
      }

      if (bannerId === 'eternal_characters') {
          return BASE_CHARACTERS.filter(c => 
              ['goku_mui', 'teen_gohan_ssj2'].includes(c.id)
          );
      }

      return [];
  }
}
