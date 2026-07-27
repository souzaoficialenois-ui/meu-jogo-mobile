import { ManifestManager } from "./ManifestManager";

export interface Tip {
  id: string;
  category: string;
  text: {
    pt_br: string;
    en_us: string;
    [key: string]: string;
  };
}

export const TIPS_DATABASE: Tip[] = [
  // 1. Controles
  {
    id: "ctrl_movement",
    category: "Controles",
    text: {
      pt_br: "Use as teclas de direção para se movimentar e saltar estrategicamente.",
      en_us: "Use the direction keys to move and jump strategically."
    }
  },
  {
    id: "ctrl_wait",
    category: "Controles",
    text: {
      pt_br: "Nem sempre atacar é a melhor escolha; espere a abertura do inimigo.",
      en_us: "Attacking is not always the best choice; wait for the enemy's opening."
    }
  },
  // 2. Combos
  {
    id: "combo_training",
    category: "Combos",
    text: {
      pt_br: "Treine no modo de prática para dominar os limites de tempo de combos.",
      en_us: "Train in Practice Mode to master combo timing limits."
    }
  },
  {
    id: "combo_combine",
    category: "Combos",
    text: {
      pt_br: "Combine botões de ataque para realizar golpes únicos e combos devastadores.",
      en_us: "Combine attack buttons to perform unique strikes and devastating combos."
    }
  },
  // 3. Ki
  {
    id: "ki_manage",
    category: "Ki",
    text: {
      pt_br: "Gerencie seu Ki antes de utilizar habilidades poderosas.",
      en_us: "Manage your Ki before using powerful abilities."
    }
  },
  {
    id: "ki_charge",
    category: "Ki",
    text: {
      pt_br: "Carregar Ki deixa você temporariamente vulnerável, então encontre uma distância segura!",
      en_us: "Charging Ki leaves you temporarily vulnerable, so find a safe distance!"
    }
  },
  // 4. Defesa
  {
    id: "def_timing",
    category: "Defesa",
    text: {
      pt_br: "Bloquear no momento certo reduz drasticamente a pressão do adversário.",
      en_us: "Blocking at the right moment drastically reduces opponent pressure."
    }
  },
  {
    id: "def_guard_bar",
    category: "Defesa",
    text: {
      pt_br: "Bloquear consome sua Barra de Guarda. Se ela esvaziar, você ficará atordoado!",
      en_us: "Blocking consumes your Guard Bar. If it empties, you will be stunned!"
    }
  },
  // 5. Esquiva
  {
    id: "dodge_counter",
    category: "Esquiva",
    text: {
      pt_br: "Utilize a esquiva no instante exato do ataque inimigo para realizar um contra-ataque perfeito.",
      en_us: "Use dodge at the exact instant of an enemy attack to perform a perfect counter-attack."
    }
  },
  // 6. Dash
  {
    id: "dash_distance",
    category: "Dash",
    text: {
      pt_br: "Utilize o dash para encurtar a distância rapidamente ou fugir de projéteis.",
      en_us: "Use dash to shorten distance quickly or escape projectiles."
    }
  },
  // 7. Transformações
  {
    id: "trans_style",
    category: "Transformações",
    text: {
      pt_br: "Transformações podem mudar completamente o estilo de luta e aumentar seus atributos.",
      en_us: "Transformations can completely change your fighting style and increase your stats."
    }
  },
  // 8. Especiais
  {
    id: "spec_vulnerable",
    category: "Especiais",
    text: {
      pt_br: "Ataques Especiais causam grande dano, mas abrem sua guarda se forem bloqueados.",
      en_us: "Special Attacks deal high damage, but leave you vulnerable if blocked."
    }
  },
  // 9. Ultimates
  {
    id: "ult_turn_tide",
    category: "Ultimates",
    text: {
      pt_br: "Ultimates consomem uma grande quantidade de barras de Ki, mas podem virar o jogo!",
      en_us: "Ultimates consume a large amount of Ki bars, but they can turn the tide of the battle!"
    }
  },
  // 10. Recuperação de vida
  {
    id: "hp_passive",
    category: "Recuperação de vida",
    text: {
      pt_br: "Personagens fora de combate recuperam vida lentamente se não estiverem realizando nenhuma ação.",
      en_us: "Characters out of combat recover health slowly if they are not performing any actions."
    }
  },
  {
    id: "hp_standby",
    category: "Recuperação de vida",
    text: {
      pt_br: "Apenas personagens vivos podem recuperar vida de forma passiva enquanto estão na reserva.",
      en_us: "Only living characters can passively recover health while on standby."
    }
  },
  // 11. Troca de personagens
  {
    id: "swap_hp_low",
    category: "Troca de personagens",
    text: {
      pt_br: "Substitua seu personagem ativo se a vida dele estiver baixa para poupar energia.",
      en_us: "Swap your active character if their health is low to save energy."
    }
  },
  {
    id: "swap_assist",
    category: "Troca de personagens",
    text: {
      pt_br: "Chame assistências para interromper combos do adversário e criar aberturas.",
      en_us: "Call assists to interrupt opponent combos and create openings."
    }
  },
  // 12. Torneios
  {
    id: "tour_prizes",
    category: "Torneios",
    text: {
      pt_br: "No modo Torneio, cada vitória aproxima você de prêmios exclusivos e glória eterna!",
      en_us: "In Tournament mode, each victory brings you closer to exclusive prizes and eternal glory!"
    }
  },
  // 13. Partidas online
  {
    id: "online_prediction",
    category: "Partidas online",
    text: {
      pt_br: "Em partidas online, prever os movimentos do oponente é a chave para a vitória.",
      en_us: "In online matches, predicting your opponent's movements is the key to victory."
    }
  },
  // 14. Recursos da interface
  {
    id: "ui_bars",
    category: "Recursos da interface",
    text: {
      pt_br: "Fique de olho na barra de vida e Ki do seu oponente para planejar sua estratégia.",
      en_us: "Keep an eye on your opponent's health and Ki bars to plan your strategy."
    }
  },
  {
    id: "ui_graphics",
    category: "Recursos da interface",
    text: {
      pt_br: "No menu de configurações, você pode ajustar a qualidade gráfica para melhor desempenho.",
      en_us: "In the settings menu, you can adjust graphic quality for better performance."
    }
  },
  // 15. Estratégias avançadas
  {
    id: "strat_weakness",
    category: "Estratégias avançadas",
    text: {
      pt_br: "Cada personagem possui pontos fortes e fracos. Experimente todos para encontrar seu favorito.",
      en_us: "Each character has strengths and weaknesses. Try them all to find your favorite."
    }
  },
  {
    id: "strat_punish",
    category: "Estratégias avançadas",
    text: {
      pt_br: "O tempo de recuperação após um ataque errado pode ser aproveitado pelo adversário.",
      en_us: "The recovery time after a missed attack can be punished by your opponent."
    }
  },
  // 16. Lore - Dragon Ball
  {
    id: "lore_saiyan",
    category: "Lore",
    text: {
      pt_br: "Os Saiyajins são uma raça de guerreiros que ficam mais fortes após cada batalha quase fatal.",
      en_us: "Saiyans are a race of warriors who get stronger after every near-fatal battle."
    }
  },
  {
    id: "lore_dragonballs",
    category: "Lore",
    text: {
      pt_br: "Existem sete Esferas do Dragão. Quando reunidas, elas invocam Shenlong para realizar um desejo.",
      en_us: "There are seven Dragon Balls. When gathered, they summon Shenron to grant a wish."
    }
  },
  {
    id: "lore_fusion",
    category: "Lore",
    text: {
      pt_br: "A Fusão Metamoru requer que os dois guerreiros tenham níveis de poder similares e realizem uma dança perfeita.",
      en_us: "Metamoran Fusion requires both warriors to have similar power levels and perform a perfect dance."
    }
  },
  {
    id: "lore_kamehameha",
    category: "Lore",
    text: {
      pt_br: "O Kamehameha foi criado pelo Mestre Kame e levou 50 anos para ser aperfeiçoado.",
      en_us: "The Kamehameha was created by Master Roshi and took 50 years to perfect."
    }
  },
  {
    id: "lore_gravity",
    category: "Lore",
    text: {
      pt_br: "Goku treinou em gravidade 100x superior à da Terra durante sua viagem para Namekusei.",
      en_us: "Goku trained in 100x Earth's gravity during his trip to Namek."
    }
  },
  {
    id: "lore_senzu",
    category: "Lore",
    text: {
      pt_br: "As Sementes dos Deuses (Senzu Beans) podem curar instantaneamente ferimentos e restaurar a energia de um guerreiro.",
      en_us: "Senzu Beans can instantly heal wounds and restore a warrior's energy."
    }
  },
  {
    id: "lore_vegeta_pride",
    category: "Lore",
    text: {
      pt_br: "Vegeta é o Príncipe de todos os Saiyajins e seu orgulho é sua maior motivação.",
      en_us: "Vegeta is the Prince of all Saiyans and his pride is his greatest motivation."
    }
  },
  {
    id: "lore_namek",
    category: "Lore",
    text: {
      pt_br: "Os Namekuseijins não precisam comer, apenas beber água para sobreviver.",
      en_us: "Namekians don't need to eat, only drink water to survive."
    }
  },
  {
    id: "lore_gohan_rage",
    category: "Lore",
    text: {
      pt_br: "Gohan possui um potencial oculto imenso que é liberado através de sua fúria.",
      en_us: "Gohan possesses an immense hidden potential that is released through his rage."
    }
  },
  {
    id: "lore_z_sword",
    category: "Lore",
    text: {
      pt_br: "A Espada Z estava cravada em uma rocha no Planeta Sagrado dos Kaioshins por eras até ser removida por Gohan.",
      en_us: "The Z Sword was embedded in a rock on the Sacred World of the Kais for ages until Gohan removed it."
    }
  }
];

export class TipsManager {
  private static readonly STORAGE_KEY = "last_shown_tip_id";

  /**
   * Retrieves a random tip from the database, ensuring it doesn't repeat consecutively.
   * Stored in sessionStorage to persist across screen transitions but clean up on new sessions.
   */
  public static getRandomTip(): Tip {
    const lastId = typeof window !== "undefined" ? sessionStorage.getItem(this.STORAGE_KEY) : null;
    
    // Filter out the last shown tip to avoid repeating it consecutively
    const availableTips = TIPS_DATABASE.filter(tip => tip.id !== lastId);
    
    // Fallback to full database if there's only 1 or 0 available tips (unlikely)
    const listToChooseFrom = availableTips.length > 0 ? availableTips : TIPS_DATABASE;
    
    const randomIndex = Math.floor(Math.random() * listToChooseFrom.length);
    const selectedTip = listToChooseFrom[randomIndex];
    
    if (typeof window !== "undefined") {
      sessionStorage.setItem(this.STORAGE_KEY, selectedTip.id);
    }
    
    return selectedTip;
  }

  /**
   * Formats the Tip's text according to the current active language
   */
  public static getFormattedTipText(tip: Tip): string {
    const activeLang = ManifestManager.getActiveLanguage().toLowerCase();
    
    // Support language matching, fallback to 'pt_br', then 'en_us', then first available
    if (tip.text[activeLang]) {
      return tip.text[activeLang];
    } else if (tip.text["pt_br"]) {
      return tip.text["pt_br"];
    } else if (tip.text["en_us"]) {
      return tip.text["en_us"];
    }
    
    // Absolute fallback: first available text key
    const keys = Object.keys(tip.text);
    return keys.length > 0 ? tip.text[keys[0]] : "";
  }
}
