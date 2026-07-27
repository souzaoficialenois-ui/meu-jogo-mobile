import { AssistType } from '../types';

export interface AssistSkillOption {
  id: AssistType;
  name: string;
  description: string;
}

export const CHARACTER_ASSIST_SKILLS: Record<string, AssistSkillOption[]> = {
  goku_base: [
    { id: "SPECIAL", name: "Kamehameha", description: "Derruba o oponente com uma rajada clássica de energia." },
    { id: "SPECIAL_2", name: "Kaioken Strike", description: "Investida física veloz usando o poder do Kaioken." },
    { id: "SPECIAL_3", name: "Genki Dama", description: "Reúne energia da natureza para uma grande explosão." },
    { id: "SPECIAL_4", name: "Teleport Kamehameha", description: "Surpreende o inimigo teletransportando-se." }
  ],
  goku_ssj: [
    { id: "SPECIAL", name: "Super Kamehameha", description: "Disparo de energia ampliado no estado Super Saiyajin." },
    { id: "SPECIAL_2", name: "Dragon Fist Prep", description: "Avanço e golpe devastador para quebrar o oponente." },
    { id: "SPECIAL_3", name: "Teletransporte", description: "Aparece instantaneamente nas costas do adversário." }
  ],
  goku_blue: [
    { id: "SPECIAL", name: "God Kamehameha", description: "Feixe divino concentrado de energia azul." },
    { id: "SPECIAL_2", name: "Blue Combo", description: "Sequência rápida de socos com a aura do SSJ Blue." },
    { id: "SPECIAL_3", name: "Divine Void", description: "Esquiva perfeita e contra-ataque rápido." },
    { id: "SPECIAL_4", name: "Punho do Dragão", description: "Invocação do dragão dourado com investida implacável." }
  ],
  goku_black_rose: [
    { id: "SPECIAL", name: "Black Kamehameha", description: "Rajada de energia sombria e corrompida." },
    { id: "SPECIAL_2", name: "God Slicer", description: "Cortes de energia velozes utilizando a lâmina de Ki rosa." },
    { id: "SPECIAL_3", name: "Holy Light Grenade", description: "Esfera de Ki explosiva lançada à meia-distância." }
  ],
  vegeta_base: [
    { id: "SPECIAL", name: "Galick Gun", description: "Disparo roxo clássico de Ki concentrado." },
    { id: "SPECIAL_2", name: "Dirty Fireworks", description: "Gera uma explosão massiva sob o oponente." },
    { id: "SPECIAL_3", name: "Lucora Gun", description: "Rajada contínua de pequenas esferas de Ki." },
    { id: "SPECIAL_4", name: "Super Dash Attack", description: "Investida de ombro em alta velocidade." }
  ],
  gogeta: [
    { id: "SPECIAL", name: "Kamehameha Azul", description: "Disparo clássico de energia da fusão." },
    { id: "SPECIAL_2", name: "Galick Gun", description: "Ataque rápido de energia roxa." },
    { id: "SPECIAL_3", name: "Soul Punisher", description: "Esfera prismática que explode ao contato." },
    { id: "SPECIAL_4", name: "Stardust Fall", description: "Chuva de projéteis de energia estelar." }
  ],
  gogeta_ssj: [
    { id: "SPECIAL", name: "Super Kamehameha", description: "Feixe de energia dourada massivo." },
    { id: "SPECIAL_2", name: "Big Bang Attack", description: "Dispara uma esfera gigante de energia altamente explosiva." },
    { id: "SPECIAL_3", name: "Soul Punisher", description: "Punidor de Almas do Super Gogeta." },
    { id: "SPECIAL_4", name: "Stardust Fall", description: "Chuva estelar devastadora de Ki." }
  ],
  gogeta_blue: [
    { id: "SPECIAL", name: "God Kamehameha", description: "Feixe de energia com poder divino azul." },
    { id: "SPECIAL_2", name: "Big Bang Kamehameha", description: "Fusão de técnicas devastadoras de Goku e Vegeta." },
    { id: "SPECIAL_3", name: "Resonant Cosmic Beam", description: "Rajada de energia contínua e persistente." },
    { id: "SPECIAL_4", name: "Meteor Explosion", description: "Explosão cósmica de Ki implacável de baixo para cima." },
    { id: "SPECIAL_5", name: "Soul Punisher", description: "Esfera prismática com poder máximo." }
  ],
  gogeta_ssj4: [
    { id: "SPECIAL", name: "Big Bang Kamehameha 10x", description: "Disparo colossal de cor vermelha com alto dano." },
    { id: "SPECIAL_2", name: "Bluff Kamehameha", description: "Engana o inimigo simulando Kamehameha e disparando confete." },
    { id: "SPECIAL_3", name: "Soul Punisher", description: "Esfera cósmica instantânea." },
    { id: "SPECIAL_4", name: "Ultra Instinct Strike", description: "Ataque físico fulminante em alta velocidade." }
  ],
  goku_mui: [
    { id: "SPECIAL", name: "Supreme Kamehameha", description: "Kamehameha prateado de Ki do Instinto Superior." },
    { id: "SPECIAL_2", name: "Soaring Fist", description: "Dispara ondas de choque invisíveis à distância." },
    { id: "SPECIAL_3", name: "Autonomous Strike", description: "Aparece e ataca de surpresa pelas costas." }
  ],
  trunks_ssj2: [
    { id: "SPECIAL", name: "Buster Cannon", description: "Disparo duplo de energia amarela." },
    { id: "SPECIAL_2", name: "Shining Slash", description: "Sequência rápida de cortes de espada energizados." },
    { id: "SPECIAL_3", name: "Burning Attack", description: "Série veloz de selos com as mãos e rajada potente." },
    { id: "SPECIAL_4", name: "Heat Dome Attack", description: "Domo de energia incinerante disparado para cima." }
  ],
  vegeta_ego: [
    { id: "SPECIAL", name: "Galick Gun of Destruction", description: "Rajada roxa destrutiva de Hakai." },
    { id: "SPECIAL_2", name: "Pride Strike", description: "Golpe físico imponente que ignora guarda." },
    { id: "SPECIAL_3", name: "Destruction Sphere", description: "Esfera purpura concentrada de destruição." },
    { id: "SPECIAL_4", name: "Limit Break Combo", description: "Contra-ataque motivado pelo instinto de batalha." }
  ],
  vegeta_ssj_majin: [
    { id: "SPECIAL", name: "Atomic Blast", description: "Disparo rápido e concentrado de energia com os dedos." },
    { id: "SPECIAL_2", name: "Final Cannon", description: "Rajada potente de Ki no peito do oponente." }
  ],
  majin_buu_gohan: [
    { id: "SPECIAL", name: "Kamehameha Absorbed", description: "Kamehameha de cor rosa com dano contínuo." },
    { id: "SPECIAL_2", name: "Super Ghost Kamikaze", description: "Gera fantasmas explosivos que perseguem o rival." },
    { id: "SPECIAL_3", name: "Vice Shout", description: "Onda de som destrutiva gerada por um grito de raiva." },
    { id: "SPECIAL_4", name: "Candy Beam", description: "Raio de chocolate que paralisa temporariamente o rival." }
  ],
  piccolo: [
    { id: "SPECIAL", name: "Special Beam Cannon", description: "Makankosappo penetrante que ignora parte da defesa." },
    { id: "SPECIAL_2", name: "Light Grenade", description: "Disparo explosivo gerado com as duas mãos." },
    { id: "SPECIAL_3", name: "Hellzone Grenade", description: "Invoca esferas ao redor e as faz colidir contra o rival." },
    { id: "SPECIAL_4", name: "Demon Elbow", description: "Investida física esticando o braço com cotovelada." }
  ],
  teen_gohan_ssj2: [
    { id: "SPECIAL", name: "Father-Son Kamehameha Prep", description: "Disparo concentrado com uma mão." },
    { id: "SPECIAL_2", name: "Masenko", description: "Disparo rápido amador acima da cabeça." },
    { id: "SPECIAL_3", name: "Quiet Rage Combo", description: "Série rápida de socos e chutes aéreos." },
    { id: "SPECIAL_4", name: "Motionless Kamehameha", description: "Disparo instantâneo e direto sem preparação." }
  ],
  frieza_final: [
    { id: "SPECIAL", name: "Death Beam", description: "Feixe laser roxo extremamente veloz e perfurante." },
    { id: "SPECIAL_2", name: "Death Ball", description: "Esfera gigante destrutiva lançada lentamente." },
    { id: "SPECIAL_3", name: "You Might Die This Time", description: "Explosão surpresa gerada debaixo do oponente." },
    { id: "SPECIAL_4", name: "Nova Strike", description: "Investida protegida por barreira esférica rosa." }
  ],
  kuririn: [
    { id: "SPECIAL", name: "Kamehameha", description: "Disparo clássico de energia azul." },
    { id: "SPECIAL_2", name: "Kienzan", description: "Discos de Ki afiados que cortam a guarda inimiga." },
    { id: "SPECIAL_3", name: "Taiyoken", description: "Clarão solar que cega e atordoa o inimigo no lugar." },
    { id: "SPECIAL_4", name: "Scatter Kamehameha", description: "Rajada que se divide para atingir o oponente por cima." }
  ],
  broly_ikari: [
    { id: "SPECIAL", name: "Gigantic Breath", description: "Sopro de energia verde destrutivo." },
    { id: "SPECIAL_2", name: "Eraser Cannon", description: "Esferas verdes rápidas arremessadas consecutivamente." },
    { id: "SPECIAL_3", name: "Gigantic Charge", description: "Avanço colossal para agarrar e arrastar o oponente." },
    { id: "SPECIAL_4", name: "Omega Blaster", description: "Esfera de poder instável que aumenta ao ser lançada." },
    { id: "SPECIAL_5", name: "Meteor Smash", description: "Golpe esmagador jogando o rival ao chão." }
  ],
  nappa: [
    { id: "SPECIAL", name: "Giant Storm", description: "Grande erupção de energia sob os pés do adversário." },
    { id: "SPECIAL_2", name: "Arm Break", description: "Soco de marreta que destrói a guarda." },
    { id: "SPECIAL_3", name: "Choumakouhou", description: "Rajada gigante disparada pela boca." }
  ]
};

const DEFAULT_OPTIONS: AssistSkillOption[] = [
  { id: "SPECIAL", name: "Especial 1", description: "Disparo de habilidade especial primária." },
  { id: "SPECIAL_2", name: "Especial 2", description: "Habilidade especial secundária do personagem." },
  { id: "SPECIAL_3", name: "Especial 3", description: "Habilidade especial terciária do personagem." },
  { id: "SPECIAL_4", name: "Especial 4", description: "Habilidade especial avançada do personagem." }
];

export function getCharacterAssistSkills(charId: string): AssistSkillOption[] {
  // Normalize ID (e.g. goku_base_swl -> goku_base)
  let normalized = charId;
  if (charId.startsWith("goku_base")) normalized = "goku_base";
  
  return CHARACTER_ASSIST_SKILLS[normalized] || DEFAULT_OPTIONS;
}
