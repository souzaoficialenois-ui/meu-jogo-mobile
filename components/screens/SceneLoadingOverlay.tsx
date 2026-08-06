import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SceneName } from '../../types';
import { BASE_CHARACTERS, AVATAR_LIST, BACKGROUND_LIST } from '../../personagens/CharacterDatabase';

interface SceneLoadingOverlayProps {
  targetScene: SceneName;
  onComplete: () => void;
}

const getSceneImages = (scene: SceneName): string[] => {
  const images: string[] = [
    '/Assets/icones%20ui/icone%20especial.png',
    '/Assets/icones%20ui/icone%20defeza.png',
    '/Assets/icones%20ui/combo%20leve.png',
    '/Assets/icones%20ui/icone%20carregando%20ki.png'
  ];

  switch (scene) {
    case SceneName.MAIN_MENU:
    case SceneName.SINGLE_PLAYER_MENU:
    case SceneName.PROFILE:
    case SceneName.PROFILE_EDIT:
      AVATAR_LIST.slice(0, 8).forEach(a => images.push(a.url));
      BACKGROUND_LIST.slice(0, 4).forEach(b => images.push(b.url));
      break;

    case SceneName.CHARACTER_SELECT:
    case SceneName.BATTLE_CHAR_SELECT:
    case SceneName.EVOLUTION:
      BASE_CHARACTERS.forEach(c => {
        if (c.portraitUrl) images.push(c.portraitUrl);
      });
      break;

    case SceneName.STAGE_SELECT:
    case SceneName.VS_SCREEN:
    case SceneName.BATTLE:
      images.push('/Assets/cenarios/1.png', '/Assets/cenarios/2.png');
      BASE_CHARACTERS.slice(0, 6).forEach(c => {
        if (c.portraitUrl) images.push(c.portraitUrl);
      });
      break;

    default:
      AVATAR_LIST.slice(0, 5).forEach(a => images.push(a.url));
      break;
  }

  return Array.from(new Set(images));
};

export const SceneLoadingOverlay: React.FC<SceneLoadingOverlayProps> = ({ targetScene, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    // Preload target scene images
    const targetImages = getSceneImages(targetScene);
    let loadedCount = 0;
    const totalCount = Math.max(1, targetImages.length);

    targetImages.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
      };
      img.src = src;
    });

    const startTime = Date.now();
    const duration = 520; // ms minimum load buffer

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timePercent = Math.min(100, (elapsed / duration) * 100);
      const imgPercent = Math.min(100, (loadedCount / totalCount) * 100);

      const currentProgress = Math.floor((timePercent * 0.6) + (imgPercent * 0.4));

      setProgress(currentProgress);

      if (elapsed >= duration && loadedCount >= totalCount && !isCompletedRef.current) {
        isCompletedRef.current = true;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 180);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [targetScene, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none overflow-hidden font-mono text-white pointer-events-none"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <span className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-white">
          CARREGANDO...
        </span>
        <span className="text-4xl md:text-5xl font-black italic text-white tracking-widest">
          {progress}%
        </span>
      </div>
    </motion.div>
  );
};

