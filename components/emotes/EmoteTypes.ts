export interface EmoteData {
  id: string;
  name: string;
  text: string;
  subtext?: string;
  emoji: string;
  iconName?: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  sfx: string;
}

export const EMOTE_LIST: EmoteData[] = [
  {
    id: 'gg',
    name: 'Good Game',
    text: 'GG!',
    subtext: 'Bom Jogo!',
    emoji: '🤝',
    color: '#3b82f6',
    bgGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    borderColor: 'border-cyan-400',
    sfx: 'confirm',
  },
  {
    id: 'bring_it',
    name: 'Bring It On',
    text: 'VEM COM TUDO!',
    subtext: 'Bring It On!',
    emoji: '🔥',
    color: '#ef4444',
    bgGradient: 'from-red-600 via-orange-600 to-amber-500',
    borderColor: 'border-amber-400',
    sfx: 'clash',
  },
  {
    id: 'power_up',
    name: 'Power Up',
    text: 'PODER MAXIMO!',
    subtext: 'Max Power!',
    emoji: '⚡',
    color: '#eab308',
    bgGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    borderColor: 'border-yellow-300',
    sfx: 'narrator_max_power',
  },
  {
    id: 'respect',
    name: 'Respect',
    text: 'RESPEITO!',
    subtext: 'Salute!',
    emoji: '🫡',
    color: '#10b981',
    bgGradient: 'from-emerald-600 via-teal-600 to-green-500',
    borderColor: 'border-emerald-300',
    sfx: 'confirm',
  },
  {
    id: 'shocked',
    name: 'Shocked',
    text: 'O QUÊ?!',
    subtext: 'NANI?!',
    emoji: '😱',
    color: '#a855f7',
    bgGradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
    borderColor: 'border-fuchsia-300',
    sfx: 'teleport',
  },
  {
    id: 'victory',
    name: 'Victory',
    text: 'VITÓRIA É MINHA!',
    subtext: 'Victory is Mine!',
    emoji: '👑',
    color: '#f59e0b',
    bgGradient: 'from-yellow-500 via-amber-600 to-orange-600',
    borderColor: 'border-amber-300',
    sfx: 'narrator_perfect',
  },
  {
    id: 'ready_fight',
    name: 'Ready to Fight',
    text: 'ESTOU PRONTO!',
    subtext: 'Ready to Fight!',
    emoji: '⚔️',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600 via-blue-600 to-teal-500',
    borderColor: 'border-cyan-300',
    sfx: 'narrator_ready',
  },
  {
    id: 'never_give_up',
    name: 'Never Give Up',
    text: 'NUNCA DESISTA!',
    subtext: 'Never Surrender!',
    emoji: '💥',
    color: '#ec4899',
    bgGradient: 'from-pink-600 via-rose-600 to-red-500',
    borderColor: 'border-rose-300',
    sfx: 'ki_charge_start',
  },
];
