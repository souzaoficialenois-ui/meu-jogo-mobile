import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { BASE_CHARACTERS } from '../../personagens/CharacterDatabase';
import { AudioManager } from '../../services/AudioManager';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Flame, 
  Play, 
  CheckCircle2, 
  Lock, 
  Star, 
  Sparkles, 
  MessageCircle, 
  Swords, 
  Trophy,
  Compass,
  ArrowRight
} from 'lucide-react';

export interface StoryChapter {
  id: string;
  number: number;
  title: string;
  titleEn: string;
  synopsis: string;
  synopsisEn: string;
  stageTheme: 'TORNEIO_DO_PODER' | 'KAME_HOUSE';
  playerCharId: string;
  opponentCharId: string;
  coinReward: number;
  gemReward: number;
  unlockCharId?: string;
  bannerImg: string;
  dialogues: {
    speaker: string;
    speakerEn?: string;
    avatarUrl: string;
    text: string;
    textEn: string;
    side: 'left' | 'right';
  }[];
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'story_chapter_1',
    number: 1,
    title: 'Saga Saiyajin: O Rival Lendário',
    titleEn: 'Saiyan Saga: The Legendary Rival',
    synopsis: 'Goku treina pesado para testar suas forças contra seu eterno rival, Vegeta. Uma batalha clássica para preparar o corpo e a mente!',
    synopsisEn: 'Goku trains heavily to test his limits against his eternal rival, Vegeta. A classic clash to prepare body and mind!',
    stageTheme: 'KAME_HOUSE',
    playerCharId: 'goku_ssj',
    opponentCharId: 'vegeta_base',
    coinReward: 500,
    gemReward: 50,
    bannerImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcKETFx5AUzrTZVZDFXwfxO7tNeYm-pFSTmH-JktSTB8efKilbkGQvmMpDvQQD-wjM3KiwcYFSlZAzZpcdsJxVFhwAzgXe9gDfVHL0-Vls5PzqPTzJCCsdbLnPgYUSJcQcKgcP3F2N1vy_0JgnMMzORgcHbdtDQjWG9hdmmMMrI7Z_9LAILFHRdhK3FPT8c5Qja2YcwtkJd7BhbNK0cWemurcovjzp5M7vo0tPyok_Q-rcJx4_VL6UrBzbMQEG9IK3hob75jLTxRc',
    dialogues: [
      {
        speaker: 'Goku',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'Vegeta! Treinei muito na Sala do Tempo. Vamos ver quem é o Saiyajin mais forte hoje!',
        textEn: "Vegeta! I've trained hard in the Hyperbolic Time Chamber. Let's see who is the strongest Saiyan today!",
        side: 'left'
      },
      {
        speaker: 'Vegeta',
        avatarUrl: '/Assets/Avatares/Avatar2.png',
        text: 'Kakarotto... Você sempre acha que está um passo à frente. Vou lhe mostrar o verdadeiro orgulho da nossa raça!',
        textEn: "Kakarot... You always think you are one step ahead. I will show you the true pride of our race!",
        side: 'right'
      },
      {
        speaker: 'Goku',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'É isso aí! Não se segure, Vegeta! HAAAAAA!',
        textEn: "That's the spirit! Don't hold back, Vegeta! HAAAAAA!",
        side: 'left'
      }
    ]
  },
  {
    id: 'story_chapter_2',
    number: 2,
    title: 'Saga Namekusei: A Fúria Imperdoável',
    titleEn: 'Namek Saga: The Unforgivable Fury',
    synopsis: 'Freeza ressuscitou e jura destruir a Terra. Do futuro distante, Trunks surge com sua espada reluzente para fatiar o imperador!',
    synopsisEn: 'Frieza has resurrected and vows to destroy Earth. From the distant future, Trunks emerges with his shining sword to slice the emperor!',
    stageTheme: 'KAME_HOUSE',
    playerCharId: 'trunks_ssj2',
    opponentCharId: 'frieza_final',
    coinReward: 750,
    gemReward: 80,
    bannerImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmSqIN0tlImU7QBPBkyN2P_bOAYbzZCGSf-CjYuDcrxKq886_7VQ1NiRZtLvB56TQxiRd9XREPfrpTCcn_AUSNaAscDhmctWXMNnjvTZACoqxFoAEpY3wUAVnU0stcImxiBT4-Kf4egsQhG6ZM8O3Od8el-mw6ovfIpc8FdcY2-ru06CczC3_X5C5Iw3LhtXSKY7jHes8tj9R6Z98fcKBVdwwIIBJjMAN1sMgKrcOkC0t0eoJObse4vp2gNJ4T5fD77UjmJndYn3c',
    dialogues: [
      {
        speaker: 'Freeza',
        avatarUrl: '/Assets/Avatares/Avatar3.png',
        text: 'Hahaha! Vocês Saiyajins imundos são apenas insetos perante o meu poder soberano!',
        textEn: 'Hahaha! You filthy Saiyans are nothing but insects before my sovereign power!',
        side: 'right'
      },
      {
        speaker: 'Trunks',
        avatarUrl: '/Assets/Avatares/Avatar4.png',
        text: 'Freeza! Você já destruiu o futuro uma vez. Eu não permitirei que fira mais ninguém nesta linha temporal!',
        textEn: "Frieza! You already destroyed the future once. I won't allow you to hurt anyone else in this timeline!",
        side: 'left'
      },
      {
        speaker: 'Freeza',
        avatarUrl: '/Assets/Avatares/Avatar3.png',
        text: 'O que?! Outro pirralho de cabelo loiro?! Eu vou te pulverizar!',
        textEn: "What?! Another golden-haired brat?! I will pulverize you!",
        side: 'right'
      }
    ]
  },
  {
    id: 'story_chapter_3',
    number: 3,
    title: 'Saga Futuro: O Julgamento Divino',
    titleEn: 'Future Saga: The Divine Judgment',
    synopsis: 'Zamasu assume o corpo de Goku em outra realidade e autodeclara-se o executor divino. Goku domina o Super Saiyajin Blue para detê-lo!',
    synopsisEn: "Zamasu steals Goku's body in another reality and declares himself the divine executioner. Goku masters Super Saiyan Blue to stop him!",
    stageTheme: 'TORNEIO_DO_PODER',
    playerCharId: 'goku_blue_gif',
    opponentCharId: 'goku_black_rose',
    coinReward: 1000,
    gemReward: 100,
    bannerImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLkr1TGiYsGjXnY5gMmGzQEIGhucvafj-u7_4b2YDroXwuj3_aX9r-oWr4q2-Hwo5fsy0q-l8RTnsso2y_2nnlxe4VFmZoMLVZ1lY_r9-hgiWlc4DrnlmYbxZqVI8ej22KIofr7XzNNGLD_XoZ3d7MNgLbC6LCjiog959HarJOJjTWHa9wTpfrvmjVRmNY-69XbZJKOgMxJgz9gsX0z1YCHD8UNjmtwI0sSg8DikIWOJZ_GjZAVHn6RLqNBESOkvEhdTkaIJ4qViI',
    dialogues: [
      {
        speaker: 'Goku Black',
        avatarUrl: '/Assets/Avatares/Avatar5.png',
        text: 'Os humanos são a única mancha na perfeição divina deste cosmos. Eu trarei a purificação eterna com minha rosa sagrada!',
        textEn: 'Humans are the sole stain on the divine perfection of this cosmos. I shall bring eternal purification with my sacred rose!',
        side: 'right'
      },
      {
        speaker: 'Goku',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'Seu farsante! Roubar o meu corpo não lhe dará o verdadeiro poder de um guerreiro que treina para proteger seus amigos!',
        textEn: "You fraud! Stealing my body won't grant you the true strength of a warrior who trains to protect his friends!",
        side: 'left'
      },
      {
        speaker: 'Goku Blue',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'Prepare-se, Black. Esse é o Super Saiyajin Deus Super Saiyajin! KAMEHAMEHA!',
        textEn: 'Prepare yourself, Black. This is Super Saiyan God Super Saiyan! KAMEHAMEHA!',
        side: 'left'
      }
    ]
  },
  {
    id: 'story_chapter_4',
    number: 4,
    title: 'Saga Divina: O Instinto Supremo vs O Ego',
    titleEn: 'Divine Saga: Mastered Ultra Instinct vs Ultra Ego',
    synopsis: 'A colisão de dois conceitos divinos lendários. O Instinto Superior Completo de Goku desafia o Ego Superior Destruidor de Vegeta!',
    synopsisEn: "The collision of two legendary divine concepts. Goku's Mastered Ultra Instinct challenges Vegeta's Destructive Ultra Ego!",
    stageTheme: 'TORNEIO_DO_PODER',
    playerCharId: 'goku_mui',
    opponentCharId: 'vegeta_ego',
    coinReward: 1500,
    gemReward: 150,
    bannerImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR3s5sp-sLFQA6oYzhSLsGGOBe0WBgaTy571gByELPIG3ENrg-ohJHo3bJMJ3x1B9FJUO_Z5320z0fvq3MwKHOHYAJ2ycVzxoRVzn_kqscrBwEb9muS2oQ5zQy5mfFC1QW704S9aiGv2OoUUxMSSDY-mgyB0aQbjzA7hkX9RicMaC2H-gECEt1Hb8-WcNX4InIx5l8GQyLTy3mMwUcunBG4PLUqOd5BaokqkM79Z9r3CY1blRbDYkxhThPewonzGdwzO_WrQveXPo',
    dialogues: [
      {
        speaker: 'Vegeta Ego',
        avatarUrl: '/Assets/Avatares/Avatar2.png',
        text: 'Eu me rendi puramente ao poder da destruição. Quanto mais dano meu corpo recebe, maior se torna meu poder. Ataque-me, Kakarotto!',
        textEn: "I have surrendered completely to the power of destruction. The more damage my body receives, the greater my power becomes. Attack me, Kakarot!",
        side: 'right'
      },
      {
        speaker: 'Goku MUI',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'A mente limpa... o corpo agindo perfeitamente por si só. Esse é o Instinto Superior Completo. Vamos ver quem resiste!',
        textEn: 'A clear mind... the body acting perfectly on its own. This is complete Ultra Instinct. Let\'s see who stands tall!',
        side: 'left'
      }
    ]
  },
  {
    id: 'story_chapter_5',
    number: 5,
    title: 'Fusão Suprema: O Combate Final das Divindades',
    titleEn: 'Supreme Fusion: The Final Divine Clash',
    synopsis: 'O terrível demônio Majin Buu com Gohan absorvido ameaça consumir toda a existência. Gogeta Blue surge com o poder divino da fusão para selar a criatura para sempre!',
    synopsisEn: "The dreadful demon Majin Buu with Gohan absorbed threatens to consume all existence. Gogeta Blue rises with the divine power of fusion to seal the beast forever!",
    stageTheme: 'TORNEIO_DO_PODER',
    playerCharId: 'gogeta_blue',
    opponentCharId: 'majin_buu_gohan',
    coinReward: 2500,
    gemReward: 250,
    bannerImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxIUR1FRRs7LWrtIBh1Q7SUaKfZWdeBa4flPbPJtZBBCpefVHd2gS9KXzNIL8-EVCZJ2d4wb_e0MUNc8Dq4Scx2kyN40QqtEY4eRo0_BWe9IDN3bIPav2h6-kvH8aj6oo787rif_u_rCcRwV2SH816Q7axfKxOR6susBZmyyn9wwkwjNDiRwP4KBfZinRYlTNy0_VJWRxoYUNS-W9RsD6lL0XNx7hL4rNnfm09ahcp39hTnszkICSVgWrnhNdwvHBNf5p8YZTIIZY',
    dialogues: [
      {
        speaker: 'Majin Buu',
        avatarUrl: '/Assets/Avatares/Avatar5.png',
        text: 'Ninguém escapará de mim! Agora que tenho a força de Gohan, sou o guerreiro supremo deste universo!',
        textEn: 'No one shall escape me! Now that I possess Gohan\'s strength, I am the supreme warrior of this universe!',
        side: 'right'
      },
      {
        speaker: 'Gogeta Blue',
        avatarUrl: '/Assets/Avatares/Avatar1.png',
        text: 'Nós não somos Goku e nem Vegeta... Nós somos o guerreiro que vai acabar com o seu reinado de terror!',
        textEn: "We are neither Goku nor Vegeta... We are the warrior who will end your reign of terror!",
        side: 'left'
      },
      {
        speaker: 'Majin Buu',
        avatarUrl: '/Assets/Avatares/Avatar5.png',
        text: 'Tolos! Podem se fundir quantas vezes quiserem... todos se tornarão chocolate!',
        textEn: 'Fools! You can fuse as many times as you like... you will all turn into chocolate!',
        side: 'right'
      }
    ]
  }
];

export const StoryScreen: React.FC = () => {
  const { changeScene, createGameSession, startLoading, setAiDifficulty, coins, gems, settings, t } = useSceneManager();
  const isPt = settings?.language === 'pt';
  
  const [completedChapters, setCompletedChapters] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<StoryChapter>(STORY_CHAPTERS[0]);
  const [isPlayingDialogue, setIsPlayingDialogue] = useState(false);
  const [currentDialogueIdx, setCurrentDialogueIdx] = useState(0);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const targetScrollLeft = React.useRef<number | null>(null);
  const animationFrameId = React.useRef<number | null>(null);

  // Smooth lerped horizontal scrolling when active chapter changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    
    // Find selected node
    const selectedNode = container.querySelector('[data-selected="true"]') as HTMLElement;
    if (selectedNode) {
      const nodeCenter = selectedNode.offsetLeft + selectedNode.offsetWidth / 2;
      const containerCenter = container.offsetWidth / 2;
      targetScrollLeft.current = nodeCenter - containerCenter;

      const updateScroll = () => {
        if (targetScrollLeft.current !== null && scrollContainerRef.current) {
          const cur = scrollContainerRef.current.scrollLeft;
          const diff = targetScrollLeft.current - cur;
          if (Math.abs(diff) > 1.5) {
            scrollContainerRef.current.scrollLeft = cur + diff * 0.12; // Linear Interpolation!
            animationFrameId.current = requestAnimationFrame(updateScroll);
          } else {
            scrollContainerRef.current.scrollLeft = targetScrollLeft.current;
            targetScrollLeft.current = null;
          }
        }
      };

      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = requestAnimationFrame(updateScroll);
    }

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [selectedChapter]);

  // Load completed chapters
  useEffect(() => {
    const saved = localStorage.getItem('dd2d_completed_stories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedChapters(parsed);
        } else {
          setCompletedChapters([]);
        }
      } catch (e) {
        console.error('Error parsing story progress', e);
        setCompletedChapters([]);
      }
    } else {
      setCompletedChapters([]);
    }
  }, []);

  const handleSelectChapter = (chapter: StoryChapter) => {
    const prevIdx = STORY_CHAPTERS.findIndex(c => c.id === chapter.id) - 1;
    const isLocked = prevIdx >= 0 && !completedChapters.includes(STORY_CHAPTERS[prevIdx].id);
    
    if (isLocked) {
      AudioManager.getInstance().playSFX('cancel');
      return;
    }
    
    setSelectedChapter(chapter);
    AudioManager.getInstance().playSFX('click');
  };

  const handleStartChapter = () => {
    AudioManager.getInstance().playSFX('confirm');
    setIsPlayingDialogue(true);
    setCurrentDialogueIdx(0);
  };

  const handleDialogueNext = () => {
    AudioManager.getInstance().playSFX('click');
    if (currentDialogueIdx < selectedChapter.dialogues.length - 1) {
      setCurrentDialogueIdx(prev => prev + 1);
    } else {
      // Start actual fight!
      setIsPlayingDialogue(false);
      
      // Save playing chapter ID
      localStorage.setItem('dd2d_active_story_chapter', selectedChapter.id);

      // Find the character objects
      const p1Char = BASE_CHARACTERS.find(c => c.id === selectedChapter.playerCharId) || BASE_CHARACTERS[0];
      const p2Char = BASE_CHARACTERS.find(c => c.id === selectedChapter.opponentCharId) || BASE_CHARACTERS[1];

      // Boss level has extra aggression/difficulty
      const difficulty = selectedChapter.number >= 4 ? 'BOSS' : 'HARD';
      setAiDifficulty(difficulty);

      // Launch the session
      createGameSession([p1Char], [p2Char], false, 'STORY');
      startLoading(SceneName.VS_SCREEN);
    }
  };

  const currentDialogue = selectedChapter.dialogues[currentDialogueIdx];
  const progressPercentage = Math.round((completedChapters.length / STORY_CHAPTERS.length) * 100);

  return (
    <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative bg-grain">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/Assets/fundosdastelas/modos/m3.png" 
          alt="Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
      </div>

      <div className="scanline pointer-events-none" />
      {/* Dynamic Animated Glow background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[45vw] h-[45vw] bg-orange-600/30 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-yellow-600/10 rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* Header Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 md:h-20 px-4 md:px-10 flex items-center justify-between z-45 bg-stone-900/60 border-b-2 border-stone-850 backdrop-blur-md">
        <button 
          onClick={() => { AudioManager.getInstance().playSFX('cancel'); changeScene(SceneName.SINGLE_PLAYER_MENU); }}
          className="flex items-center gap-2 group text-stone-300 hover:text-white cursor-pointer"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl border border-stone-800 bg-stone-950 flex items-center justify-center group-hover:border-orange-500 group-hover:bg-stone-900 transition-colors shadow-lg skew-x-[-10deg] active:scale-95 duration-100">
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform skew-x-[10deg] text-orange-500" />
          </div>
          <span className="font-black uppercase italic tracking-widest text-xs md:text-sm">{t('back') || "Voltar"}</span>
        </button>

        <h1 className="text-sm md:text-xl font-extrabold italic uppercase tracking-[0.25em] text-white absolute left-1/2 -translate-x-1/2 flex items-center gap-2 drop-shadow">
          <Flame className="text-orange-500 animate-pulse" size={18} />
          {t('menu_story_mode') || 'MODO HISTÓRIA'}
        </h1>

        {/* Global Wallet Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-950 border-2 border-stone-850 px-3 py-1 rounded skew-x-[-10deg]">
            <span className="text-[10px] bg-amber-500/15 text-amber-500 font-extrabold px-1 rounded skew-x-[10deg] font-mono">GP</span>
            <span className="font-extrabold text-xs text-amber-500 skew-x-[10deg] font-mono">{coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-stone-950 border-2 border-stone-850 px-3 py-1 rounded skew-x-[-10deg]">
            <span className="text-[10px] bg-orange-600/15 text-orange-500 font-extrabold px-1 rounded skew-x-[10deg] font-mono">GEM</span>
            <span className="font-extrabold text-xs text-orange-500 skew-x-[10deg] font-mono">{gems.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 w-full grid grid-cols-12 gap-5 mt-20 p-4 md:p-6 overflow-hidden relative z-10">
        
        {/* Left Side: STORY MAP SAGA LINE (Takes 7 Cols on desktop) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between overflow-y-auto max-h-[80vh] pr-2 gap-4">
          
          {/* Progress Header Badge */}
          <div className="bg-stone-900 border border-stone-850 p-4 rounded-xl flex items-center justify-between text-left shadow-md">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-black tracking-widest uppercase">
                <Compass size={12} className="text-orange-500 animate-spin" /> {isPt ? 'PROGRESSO DA CAMPANHA' : 'CAMPAIGN PROGRESS'}
              </div>
              <h2 className="text-xl font-black text-stone-100 uppercase italic mt-1 flex items-center gap-2">
                Z-SAGA AWAKENING <span className="text-orange-500 font-mono">({progressPercentage}%)</span>
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-32 bg-stone-950 border border-stone-800 rounded-full relative overflow-hidden hidden sm:block">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-600 to-amber-500  transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[10px] bg-orange-500 text-white font-black px-2.5 py-1.5 rounded uppercase tracking-wider skew-x-[-10deg]">
                <span className="skew-x-[10deg] block">
                  {completedChapters.length} / {STORY_CHAPTERS.length} {isPt ? 'CAP' : 'CH'}
                </span>
              </span>
            </div>
          </div>

          {/* SAGA NODE MAP SYSTEM (Horizontal Flow) */}
          <div className="relative bg-stone-900/40 border border-stone-850/60 rounded-2xl p-6 flex flex-col justify-center min-h-[360px] shadow-inner overflow-hidden">
            
            {/* Dynamic Connecting Paths behind nodes */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M 50,180 C 180,110 320,250 480,180 S 680,100 850,180" 
                  fill="none" 
                  stroke="#3f2d26" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 50,180 C 180,110 320,250 480,180 S 680,100 850,180" 
                  fill="none" 
                  stroke="#f97316" 
                  strokeWidth="2" 
                  strokeDasharray="8 8" 
                  className="opacity-60"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Scrollable Container with horizontal nodes representing Saga */}
            <div 
              ref={scrollContainerRef}
              className="horizontal-scroll-container overflow-x-auto flex items-center py-4 px-6 gap-20 relative z-10 snap-x scroll-smooth"
            >
              {STORY_CHAPTERS.map((chapter, index) => {
                const isCompleted = completedChapters.includes(chapter.id);
                const isSelected = selectedChapter.id === chapter.id;
                
                // Lock criteria
                const prevIdx = index - 1;
                const isLocked = prevIdx >= 0 && !completedChapters.includes(STORY_CHAPTERS[prevIdx].id);

                return (
                  <div 
                    key={chapter.id} 
                    data-selected={isSelected}
                    className="snap-center shrink-0 flex flex-col items-center relative"
                  >
                    
                    {/* Upper Status Ribbon */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                      {isLocked ? (
                        <div className="bg-stone-950 border border-stone-800 text-stone-600 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase flex items-center gap-1">
                          <Lock size={8} /> {isPt ? 'BLOQUEADO' : 'LOCKED'}
                        </div>
                      ) : isCompleted ? (
                        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase flex items-center gap-1 shadow-md">
                          <CheckCircle2 size={8} className="fill-emerald-400 text-emerald-950" /> {isPt ? 'COMPLETO' : 'COMPLETED'}
                        </div>
                      ) : (
                        <span className="bg-orange-500 animate-pulse text-white px-3 py-1 rounded text-[8px] font-black tracking-widest uppercase flex items-center gap-1 shadow-md skew-x-[-10deg]">
                          <span className="skew-x-[10deg] block">CHALLENGE</span>
                        </span>
                      )}
                    </div>

                    {/* Manga Style Cut Card Panel */}
                    <motion.div
                      whileHover={isLocked ? {} : { scale: 1.05, y: -4 }}
                      whileTap={isLocked ? {} : { scale: 0.98 }}
                      onClick={() => handleSelectChapter(chapter)}
                      className={`w-52 h-64 border-4 overflow-hidden rounded-xl transition-all duration-300 relative cursor-pointer flex flex-col justify-end text-left shadow-2xl
                        ${isSelected 
                          ? 'border-orange-500 ' 
                          : isLocked 
                            ? 'border-stone-900 grayscale opacity-40 cursor-not-allowed'
                            : 'border-stone-800 hover:border-stone-700'
                        }
                      `}
                    >
                      {/* Banner Background Illustration */}
                      <img 
                        src={chapter.bannerImg} 
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" 
                        alt={chapter.title} 
                      />
                      {/* Dark gradient mapping & half-tone overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent z-0" />
                      <div className="absolute inset-0 halftone-overlay opacity-10 pointer-events-none" />

                      {/* Info Overlay at the bottom */}
                      <div className="p-3 relative z-10 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
                          {isPt ? `CAPÍTULO 0${chapter.number}` : `CHAPTER 0${chapter.number}`}
                        </span>
                        
                        <h4 className="font-extrabold text-sm text-stone-100 uppercase tracking-wide line-clamp-1 mt-0.5">
                          {(isPt ? chapter.title : chapter.titleEn).split(':')[1]?.trim() || (isPt ? chapter.title : chapter.titleEn)}
                        </h4>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-850/60">
                          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                            {chapter.stageTheme === 'KAME_HOUSE' ? (isPt ? 'Casa do Kame' : 'Kame House') : (isPt ? 'Torneio do Poder' : 'Tournament of Power')}
                          </span>
                          <span className="text-[10px] font-extrabold text-white bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                            {chapter.number >= 4 ? 'BOSS' : 'HARD'}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Selector Circle below representing mapping node dot */}
                    <div className="flex justify-center mt-3">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                        ${isSelected 
                          ? 'bg-orange-500 border-white scale-110 ' 
                          : isLocked 
                            ? 'bg-stone-950 border-stone-800' 
                            : 'bg-stone-900 border-stone-600'
                        }
                      `}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Small Navigation Legend */}
            <div className="absolute bottom-2 left-6 right-6 hidden sm:flex items-center justify-between text-[9px] text-stone-500 font-extrabold tracking-widest uppercase">
              <span>{isPt ? '* Use o scroll do mouse ou arraste para navegar no tempo' : '* Use mouse scroll or drag to navigate through time'}</span>
              <div className="flex items-center gap-1 text-orange-500/80">
                {isPt ? 'Saga do Despertar' : 'Awakening Saga'} <ArrowRight size={10} />
              </div>
            </div>

          </div>

          {/* Quick Informational Guide */}
          <div className="bg-stone-900/30 border border-stone-850/60 p-3.5 rounded-xl text-left">
            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed">
              {isPt 
                ? '⭐ Nota da Campanha: Vencer os capítulos libera as respectivas moedas GP e Gemas instantaneamente! Adicionalmente, derrotar Majin Buu no Capítulo final desbloqueia permanentemente o personagem lendário no mercado de lutadores!' 
                : '⭐ Campaign Note: Winning chapters unlocks their respective GP and Gems instantly! Additionally, defeating Majin Buu in the final Chapter permanently unlocks the legendary character in the Fighter Market!'}
            </p>
          </div>

        </div>

        {/* Right Side: EXPLICIT SELECTED CHAPTER BRIEFING (Takes 5 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-stone-900 border-2 border-stone-850/80 rounded-2xl p-4 md:p-6 flex flex-col justify-between overflow-y-auto max-h-[80vh] shadow-xl relative text-left">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/5 to-transparent pointer-events-none" />
          
          <div className="space-y-4">
            
            {/* Briefing Header Label */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-stone-850">
              <span className="text-[10px] font-black tracking-widest uppercase text-orange-500 flex items-center gap-1">
                <Trophy size={12} /> {isPt ? 'DIRETRIZ DA MISSÃO' : 'MISSION DIRECTIVE'}
              </span>
              <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase font-mono">
                {isPt ? `Capítulo ${selectedChapter.number} de 5` : `Chapter ${selectedChapter.number} of 5`}
              </span>
            </div>

            {/* Chapter Hero Title */}
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-wider text-white leading-tight">
                {isPt ? selectedChapter.title : selectedChapter.titleEn}
              </h2>
              <p className="text-stone-400 text-xs mt-2.5 leading-relaxed font-semibold uppercase tracking-wider">
                {isPt ? selectedChapter.synopsis : selectedChapter.synopsisEn}
              </p>
            </div>

            {/* Explicit Fighter Preview Versus */}
            <div className="bg-stone-950 border border-stone-850/85 rounded-xl p-3.5 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-stone-950/60 opacity-80 pointer-events-none" />
              
              <div className="grid grid-cols-7 gap-1 items-center relative z-10 text-center">
                
                {/* User Fighter Preview Card */}
                <div className="col-span-3 flex flex-col items-center">
                  <span className="text-[9px] bg-red-650/15 text-red-500 border border-red-900/30 font-black tracking-widest px-1.5 py-0.5 rounded uppercase block mb-1.5">
                    {isPt ? 'ALIADO' : 'ALLY'}
                  </span>
                  <div className="w-14 h-14 rounded-full border-2 border-red-500 bg-stone-900/80 overflow-hidden shadow-md flex items-center justify-center">
                    <img 
                      src={selectedChapter.dialogues.find(d => d.side === 'left')?.avatarUrl || "/Assets/Avatares/Avatar1.png"} 
                      className="w-full h-full object-cover scale-110" 
                      alt="" 
                    />
                  </div>
                  <span className="font-extrabold text-[10px] text-stone-300 uppercase tracking-wider mt-2 line-clamp-1">
                    {selectedChapter.playerCharId.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Central VS Badge */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="font-black italic text-lg text-stone-700 font-mono">VS</div>
                </div>

                {/* Opponent Fighter Preview Card */}
                <div className="col-span-3 flex flex-col items-center">
                  <span className="text-[9px] bg-blue-650/15 text-blue-400 border border-blue-900/30 font-black tracking-widest px-1.5 py-0.5 rounded uppercase block mb-1.5">
                    {selectedChapter.number >= 4 ? (isPt ? 'CHEFE' : 'BOSS') : (isPt ? 'OPONENTE' : 'OPPONENT')}
                  </span>
                  <div className="w-14 h-14 rounded-full border-2 border-blue-400 bg-stone-900/80 overflow-hidden shadow-md flex items-center justify-center">
                    <img 
                      src={selectedChapter.dialogues.find(d => d.side === 'right')?.avatarUrl || "/Assets/Avatares/Avatar2.png"} 
                      className="w-full h-full object-cover scale-110" 
                      alt="" 
                    />
                  </div>
                  <span className="font-extrabold text-[10px] text-stone-300 uppercase tracking-wider mt-2 line-clamp-1">
                    {selectedChapter.opponentCharId.replace(/_/g, ' ')}
                  </span>
                </div>

              </div>
            </div>

            {/* Setting Location and Match Difficulty Indicators */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-stone-950 p-3.5 border border-stone-850 rounded-lg text-center flex flex-col justify-center">
                <span className="text-[8px] text-stone-500 font-black uppercase tracking-widest">{isPt ? 'Cenário da Luta' : 'Battle Stage'}</span>
                <span className="text-xs font-black text-stone-200 uppercase mt-1">
                  {selectedChapter.stageTheme === 'KAME_HOUSE' ? (isPt ? 'Casa do Kame' : 'Kame House') : (isPt ? 'Torneio do Poder' : 'Tournament of Power')}
                </span>
              </div>
              <div className="bg-stone-950 p-3.5 border border-stone-850 rounded-lg text-center flex flex-col justify-center">
                <span className="text-[8px] text-stone-500 font-black uppercase tracking-widest">{isPt ? 'RANK / DIFICULDADE' : 'RANK / DIFFICULTY'}</span>
                <span className={`text-xs font-black uppercase mt-1 ${selectedChapter.number >= 4 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                  {selectedChapter.number >= 4 ? (isPt ? 'X - CHEFE DIVINO' : 'X - DIVINE BOSS') : (isPt ? 'S - DIFÍCIL' : 'S - HARD')}
                </span>
              </div>
            </div>

            {/* REWARDS GRID METRICS */}
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4 text-left">
              <span className="text-[9px] text-orange-500 font-black tracking-widest uppercase block mb-2.5 flex items-center gap-1">
                <Star size={11} className="fill-orange-500 text-orange-500" /> {isPt ? 'RECOMPENSAS SAGA' : 'SAGA REWARDS'}
              </span>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 border border-stone-850 rounded">
                  <span className="text-[10px] bg-amber-500/15 text-amber-500 font-black px-1.5 rounded font-mono">GP</span>
                  <span className="font-black text-sm text-amber-500 font-mono">+{selectedChapter.coinReward}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 border border-stone-850 rounded">
                  <span className="text-[10px] bg-orange-600/15 text-orange-500 font-black px-1.5 rounded font-mono">GEM</span>
                  <span className="font-black text-sm text-orange-500 font-mono">+{selectedChapter.gemReward}</span>
                </div>

                {selectedChapter.unlockCharId && (
                  <div className="text-[9px] border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5 rounded text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                    <Sparkles size={10} /> {isPt ? 'DESBLOQUEIA PERSONAGEM' : 'UNLOCKS CHARACTER'}
                  </div>
                )}
              </div>
              {completedChapters.includes(selectedChapter.id) && (
                <span className="text-[9px] font-bold text-emerald-500 uppercase mt-3 block">
                  {isPt ? '✓ Recompensa histórica do capítulo coletada no local storage.' : '✓ Historical chapter reward collected in local storage.'}
                </span>
              )}
            </div>

          </div>

          {/* SKEWED INTENSE BATTLE BUTTON */}
          <div className="mt-5 pt-4 border-t border-stone-850">
            <button
              onClick={handleStartChapter}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 text-white font-black text-sm uppercase tracking-[0.2em]  flex items-center justify-center gap-2.5 rounded-xl transform active:scale-95 transition-all text-center skew-x-[-10deg]"
            >
              <Swords size={16} className="skew-x-[10deg] fill-white" />
              <span className="skew-x-[10deg] font-mono">
                {completedChapters.includes(selectedChapter.id) 
                  ? (isPt ? 'REJOGAR DESAFIO' : 'REPLAY CHALLENGE') 
                  : (isPt ? 'LUTAR NA HISTÓRIA' : 'FIGHT STORY')}
              </span>
            </button>
          </div>

        </div>

      </main>

      {/* Visual Novel dialogue Overlay (Dialogue scene mode) */}
      <AnimatePresence>
        {isPlayingDialogue && currentDialogue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-[200] flex flex-col justify-end p-6 md:p-10"
          >
            {/* Speed line cinematic background overlay */}
            <div className="absolute inset-0 speed-lines opacity-10 pointer-events-none" />
            
            {/* Cinematic visual novel double character stance */}
            <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-between px-6 md:px-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              
              {/* Allied / Left Fighter portrait dynamic shadow */}
              <motion.div
                initial={{ x: -120, opacity: 0 }}
                animate={{ x: 0, opacity: currentDialogue.side === 'left' ? 1 : 0.35 }}
                transition={{ type: 'spring', damping: 22 }}
                className={`flex flex-col items-center ${currentDialogue.side === 'left' ? 'scale-110 z-20' : 'scale-90 opacity-40 z-0'}`}
              >
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 ${currentDialogue.side === 'left' ? 'border-orange-500 ' : 'border-stone-800'} overflow-hidden bg-stone-900/90 transform skew-y-[-4deg]`}>
                  <img 
                    src={STORY_CHAPTERS.find(c => c.playerCharId === selectedChapter.playerCharId)?.dialogues.find(d => d.side === 'left')?.avatarUrl || currentDialogue.avatarUrl} 
                    className="w-full h-full object-cover contrast-115 shadow-inner scale-110" 
                    alt="Left Character"
                  />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-red-500 mt-4 bg-red-950/40 border border-red-900/30 px-2.5 py-0.5 rounded transform skew-x-[-10deg]">
                  <span className="skew-x-[10deg] block">{isPt ? 'ALIADO' : 'ALLY'}</span>
                </span>
              </motion.div>

              <div className="text-stone-800 font-extrabold italic text-4xl font-mono">VS</div>

              {/* Opponent / Right Fighter portrait dynamic shadow */}
              <motion.div
                initial={{ x: 120, opacity: 0 }}
                animate={{ x: 0, opacity: currentDialogue.side === 'right' ? 1 : 0.35 }}
                transition={{ type: 'spring', damping: 22 }}
                className={`flex flex-col items-center ${currentDialogue.side === 'right' ? 'scale-110 z-20' : 'scale-90 opacity-40 z-0'}`}
              >
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 ${currentDialogue.side === 'right' ? 'border-blue-500 ' : 'border-stone-800'} overflow-hidden bg-stone-900/90 transform skew-y-[4deg]`}>
                  <img 
                    src={STORY_CHAPTERS.find(c => c.id === selectedChapter.id)?.dialogues.find(d => d.side === 'right')?.avatarUrl || currentDialogue.avatarUrl} 
                    className="w-full h-full object-cover contrast-115 shadow-inner scale-110" 
                    alt="Right Character"
                  />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-[#3b82f6] mt-4 bg-blue-950/40 border border-blue-900/30 px-2.5 py-0.5 rounded transform skew-x-[-10deg]">
                  <span className="skew-x-[10deg] block font-mono">{isPt ? 'OPONENTE' : 'OPPONENT'}</span>
                </span>
              </motion.div>
            </div>

            {/* Dialogue Dialogue layout frame */}
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              onClick={handleDialogueNext}
              className="relative w-full max-w-4xl mx-auto bg-stone-900 border-2 border-stone-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between cursor-pointer "
            >
              {/* Active Speaker Label */}
              <div className="absolute top-0 left-6 -translate-y-1/2 bg-orange-600 border-2 border-orange-400 px-4 py-1.5 font-extrabold italic text-sm uppercase tracking-wider text-white rounded shadow-md skew-x-[-10deg]">
                <span className="skew-x-[10deg] block">{isPt ? currentDialogue.speaker : (currentDialogue.speakerEn || currentDialogue.speaker)}</span>
              </div>

              <div className="text-left mt-3.5 mb-5 min-h-[70px]">
                <p className="text-base md:text-lg font-bold tracking-wide leading-relaxed text-stone-105">
                  "{isPt ? currentDialogue.text : (currentDialogue.textEn || currentDialogue.text)}"
                </p>
              </div>

              {/* Tap Indicator */}
              <div className="flex items-center justify-end text-[10px] font-black uppercase text-orange-500 animate-pulse tracking-widest gap-2">
                <MessageCircle size={12} />
                <span>{isPt ? 'Clique na tela para continuar...' : 'Tap screen to continue...'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
