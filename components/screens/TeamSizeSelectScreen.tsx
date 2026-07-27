import React, { useState } from "react";
import { useSceneManager } from "../../contexts/SceneContext";
import { SceneName } from "../../types";
import { AudioManager } from "../../services/AudioManager";
import { useUI, UIProvider } from "../../contexts/UIContext";
import {
  Zap,
  ChevronLeft,
  Users,
  Gamepad2,
  Cpu,
  Clock,
  Map,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TeamSizeSelectContent: React.FC = () => {
  const {
    changeScene,
    selectionMode,
    matchMode,
    setMatchMode,
    p1TeamSize,
    setP1TeamSize,
    p2TeamSize,
    setP2TeamSize,
    aiDifficulty,
    setAiDifficulty,
  } = useSceneManager();

  const { s } = useUI();
  
  const difficulties: import("../../services/AIController").AIDifficulty[] = [
    "EASY",
    "MEDIUM",
    "HARD",
    "INSANE",
  ];

  const handleConfirm = () => {
    AudioManager.getInstance().playSFX("confirm");
    changeScene(SceneName.BATTLE_CHAR_SELECT);
  };

  const isTraining = selectionMode === "TRAINING";

  const [selectedTab, setSelectedTab] = useState<"P1" | "P2">("P1");

  const tabs: {
    id: "P1" | "P2";
    title: string;
    subtitle: string;
    desc: string;
    img: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: "P1",
      title: "SEU TIME",
      subtitle: "TAMANHO DA EQUIPE",
      desc: "Escolha quantos guerreiros farão parte da sua equipe nesta batalha.",
      img: "/Assets/fundosdastelas/modos/m1.png",
      icon: Users,
      color: "from-orange-500 to-red-600",
    },
    ...(isTraining
      ? []
      : [
          {
            id: "P2" as const,
            title: "OPONENTES",
            subtitle: "TAMANHO E DIFICULDADE",
            desc: "Defina a quantidade de inimigos e o nível de inteligência artificial deles.",
            img: "/Assets/fundosdastelas/modos/m2.png",
            icon: Cpu,
            color: "from-orange-500 to-amber-600",
          },
        ]),
  ];

  const selectedTabData = tabs.find((t) => t.id === selectedTab);

  return (
    <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
      {/* Background Texture Layers */}
      <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-10" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] bg-orange-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-orange-600/10 rounded-full blur-[160px]" />
      </div>

      {/* Dynamic Background based on selected tab */}
      <AnimatePresence mode="wait">
        {selectedTabData && (
          <motion.div
            key={`bg-${selectedTabData.id}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.2, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <img
              src={selectedTabData.img}
              className="w-full h-full object-cover mix-blend-luminosity grayscale-[30%]"
              alt=""
            />
            <div
              className={`absolute inset-0 bg-gradient-to-tr ${selectedTabData.color} mix-blend-overlay opacity-40`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/40 to-stone-950" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <header 
        className="relative w-full px-6 flex items-center justify-between z-40 border-b border-white/5 bg-stone-900/30 backdrop-blur-xl shrink-0"
        style={{ height: s(80) }}
      >
        <button
          onClick={() => {
            AudioManager.getInstance().playSFX("cancel");
            changeScene(SceneName.SINGLE_PLAYER_MENU);
          }}
          className="rounded-xl border border-stone-800 flex items-center justify-center bg-stone-900/60 hover:border-orange-500/80 text-stone-400 hover:text-white transition-all shadow-lg active:scale-95 shrink-0 group cursor-pointer"
          style={{ width: s(48), height: s(48) }}
        >
          <ChevronLeft style={{ width: s(24), height: s(24) }} className="group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
        </button>

        <h1 
          className="font-black italic uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          style={{ fontSize: s(24) }}
        >
          CONFIGURAR BATALHA
        </h1>

        <button
          onClick={handleConfirm}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border border-orange-400 text-white transition-all uppercase font-black italic tracking-widest flex items-center rounded-2xl active:scale-95  hover: group shrink-0 duration-300 cursor-pointer"
          style={{ padding: `${s(12)}px ${s(24)}px`, gap: s(8) }}
        >
          <span style={{ fontSize: s(14) }}>AVANÇAR</span>
          <ChevronRight style={{ width: s(20), height: s(20) }} className="group-hover:translate-x-0.5 transition-transform stroke-[3]" />
        </button>
      </header>

      {/* MAIN LAYOUT */}
      <main 
        className="flex-1 w-full flex flex-row overflow-hidden relative z-10"
        style={{ marginTop: s(24), marginBottom: s(32), padding: `0 ${s(48)}px`, gap: s(32) }}
      >
        {/* LEFT NAVIGATION TABS */}
        <div 
          className="w-72 flex flex-col shrink-0 overflow-x-visible pb-0 scrollbar-none"
          style={{ width: s(280), gap: s(16) }}
        >
          {tabs.map((item, i) => {
            const isSelected = selectedTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (selectedTab !== item.id) {
                    setSelectedTab(item.id);
                    AudioManager.getInstance().playSFX("click");
                  }
                }}
                className={`
                  relative text-left rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer
                  ${isSelected ? "border-orange-500 bg-orange-500/5 shadow-lg" : "border-stone-800 hover:border-stone-600 opacity-70 hover:opacity-100 bg-stone-900/40"}
                `}
                style={{ height: s(110) }}
              >
                {/* Background inside Tab */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={item.img}
                    className={`w-full h-full object-cover mix-blend-luminosity grayscale-[40%] transition-transform duration-500 ${isSelected ? "scale-105 opacity-20" : "scale-100 opacity-5 group-hover:opacity-10"}`}
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />
                </div>

                <div 
                    className="relative z-10 flex flex-col justify-between h-full w-full"
                    style={{ padding: s(20) }}
                >
                  <div className="flex items-center mb-2 leading-none" style={{ gap: s(10) }}>
                    <div 
                        className={`rounded-lg border flex items-center justify-center ${isSelected ? "bg-orange-500 text-white border-orange-400" : "bg-stone-950 border-stone-800 text-stone-400"}`}
                        style={{ padding: s(6) }}
                    >
                      <Icon style={{ width: s(16), height: s(16) }} />
                    </div>
                    <span 
                        className={`font-black italic uppercase tracking-widest ${isSelected ? "text-orange-400" : "text-stone-500"}`}
                        style={{ fontSize: s(10) }}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                  <h3 
                    className={`font-black italic uppercase tracking-wider mt-auto ${isSelected ? "text-white" : "text-stone-400"}`}
                    style={{ fontSize: s(20) }}
                  >
                    {item.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT EDITING WORKSPACE */}
        <div className="flex-1 relative flex flex-col bg-stone-900/40 backdrop-blur-xl border border-stone-800/80 rounded-3xl shadow-2xl overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {selectedTabData && (
              <motion.div
                key={`content-${selectedTabData.id}`}
                initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col min-h-0"
              >
                {/* Glass Card Header */}
                <div 
                    className="relative z-10 border-b border-white/5 bg-stone-950/20 flex items-center shrink-0"
                    style={{ padding: `${s(24)}px ${s(32)}px`, gap: s(18) }}
                >
                  <div 
                    className={`rounded-xl bg-gradient-to-br ${selectedTabData.color} flex items-center justify-center shadow-lg text-white`}
                    style={{ padding: s(12) }}
                  >
                    <selectedTabData.icon style={{ width: s(24), height: s(24) }} className="text-white" />
                  </div>
                  <div>
                    <h2 
                        className="font-black italic uppercase tracking-wider text-white"
                        style={{ fontSize: s(24) }}
                    >
                      {selectedTabData.title}
                    </h2>
                    <p 
                        className="text-stone-400 font-medium max-w-xl mt-1 leading-snug"
                        style={{ fontSize: s(12) }}
                    >
                      {selectedTabData.desc}
                    </p>
                  </div>
                </div>

                {/* Content Workspace Form */}
                <div 
                    className="flex-1 overflow-y-auto custom-scrollbar pb-16"
                    style={{ padding: s(32), gap: s(32) }}
                >
                  {selectedTabData.id === "P1" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: s(32) }}>
                      <div>
                        <h3 
                            className="font-black italic uppercase text-stone-400 tracking-wider mb-4 flex items-center"
                            style={{ fontSize: s(12), gap: s(8), marginBottom: s(16) }}
                        >
                          <Users style={{ width: s(16), height: s(16) }} className="text-orange-500" />
                          TAMANHO DA SUA EQUIPE (LUTADORES)
                        </h3>
                        <div className="grid grid-cols-3" style={{ gap: s(12), maxWidth: s(448) }}>
                          {[1, 2, 3].map((size) => (
                            <button
                              key={`p1-${size}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setP1TeamSize(size);
                                AudioManager.getInstance().playSFX("click");
                              }}
                              className={`rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                                p1TeamSize === size
                                  ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5"
                                  : "bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                              }`}
                              style={{ padding: `${s(16)}px 0` }}
                            >
                              <span 
                                className="font-black italic leading-none"
                                style={{ fontSize: s(36) }}
                              >
                                {size}
                              </span>
                              <span 
                                className="font-black uppercase tracking-widest opacity-60"
                                style={{ fontSize: s(9), marginTop: s(6) }}
                              >
                                {size === 1 ? "LUTADOR" : "LUTADORES"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {!isTraining && (
                        <div>
                          <h3 
                            className="font-black italic uppercase text-stone-400 tracking-wider flex items-center"
                            style={{ fontSize: s(12), gap: s(8), marginBottom: s(16) }}
                          >
                            <Gamepad2 style={{ width: s(16), height: s(16) }} className="text-orange-500" />
                            MODO DE CONTROLE DO TIME
                          </h3>
                          <div className="grid grid-cols-2" style={{ gap: s(12), maxWidth: s(448) }}>
                            {[
                              {
                                id: "P1_VS_CPU",
                                label: "JOGADOR",
                                sub: "VOCÊ CONTROLA",
                                icon: Gamepad2,
                              },
                              {
                                id: "CPU_VS_CPU",
                                label: "CPU",
                                sub: "ASSISTIR LUTA",
                                icon: Cpu,
                              },
                            ].map((mode) => {
                              const isSelected = matchMode === mode.id;
                              const Icon = mode.icon;
                              return (
                                <button
                                  key={mode.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMatchMode(
                                      mode.id as "P1_VS_CPU" | "CPU_VS_CPU",
                                    );
                                    AudioManager.getInstance().playSFX(
                                      "click",
                                    );
                                  }}
                                  className={`rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                                    isSelected
                                      ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md"
                                      : "bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                                  }`}
                                  style={{ padding: `${s(16)}px ${s(12)}px` }}
                                >
                                  <Icon style={{ width: s(20), height: s(20), marginBottom: s(6) }} />
                                  <span 
                                    className="italic leading-none font-black"
                                    style={{ fontSize: s(16) }}
                                  >
                                    {mode.label}
                                  </span>
                                  <span 
                                    className="font-black uppercase tracking-widest opacity-50"
                                    style={{ fontSize: s(8), marginTop: s(6) }}
                                  >
                                    {mode.sub}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTabData.id === "P2" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: s(32) }}>
                      <div>
                        <h3 
                            className="font-black italic uppercase text-stone-400 tracking-wider flex items-center"
                            style={{ fontSize: s(12), gap: s(8), marginBottom: s(16) }}
                        >
                          <Users style={{ width: s(16), height: s(16) }} className="text-orange-500" />
                          TAMANHO DA EQUIPE INIMIGA
                        </h3>
                        <div className="grid grid-cols-3" style={{ gap: s(12), maxWidth: s(448) }}>
                          {[1, 2, 3].map((size) => (
                            <button
                              key={`p2-${size}`}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setP2TeamSize(size);
                                  AudioManager.getInstance().playSFX("click");
                              }}
                              className={`rounded-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                                p2TeamSize === size
                                  ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5"
                                  : "bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                              }`}
                              style={{ padding: `${s(16)}px 0` }}
                            >
                              <span 
                                className="font-black italic leading-none"
                                style={{ fontSize: s(36) }}
                              >
                                {size}
                              </span>
                              <span 
                                className="font-black uppercase tracking-widest opacity-60"
                                style={{ fontSize: s(9), marginTop: s(6) }}
                              >
                                {size === 1 ? "LUTADOR" : "LUTADORES"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 
                            className="font-black italic uppercase text-stone-400 tracking-wider flex items-center"
                            style={{ fontSize: s(12), gap: s(8), marginBottom: s(16) }}
                        >
                          <Cpu style={{ width: s(16), height: s(16) }} className="text-orange-500" />
                          DIFICULDADE DA INTELIGÊNCIA ARTIFICIAL
                        </h3>
                        <div className="grid grid-cols-4" style={{ gap: s(12), maxWidth: s(576) }}>
                          {difficulties.map((diff) => (
                            <button
                              key={diff}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAiDifficulty(diff);
                                AudioManager.getInstance().playSFX("click");
                              }}
                              className={`rounded-xl border font-black italic transition-all duration-300 cursor-pointer ${
                                aiDifficulty === diff
                                  ? "bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5"
                                  : "bg-stone-950/60 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300"
                              }`}
                              style={{ padding: `${s(16)}px 0`, fontSize: s(14) }}
                            >
                              {diff === "EASY" && "FÁCIL"}
                              {diff === "MEDIUM" && "MÉDIO"}
                              {diff === "HARD" && "DIFÍCIL"}
                              {diff === "INSANE" && "INSANO"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export const TeamSizeSelectScreen: React.FC = () => (
  <UIProvider>
    <TeamSizeSelectContent />
  </UIProvider>
);
