import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmoteData } from './EmoteTypes';

interface EmoteDisplayBubbleProps {
  emote: EmoteData | null;
  playerName?: string;
  position?: 'top-left' | 'top-right' | 'bottom-center' | 'center';
}

export const EmoteDisplayBubble: React.FC<EmoteDisplayBubbleProps> = ({
  emote,
  playerName,
  position = 'top-right',
}) => {
  const posClasses = {
    'top-left': 'top-20 left-6',
    'top-right': 'top-20 right-6',
    'bottom-center': 'bottom-24 left-1/2 -translate-x-1/2',
    'center': 'top-24 left-1/2 -translate-x-1/2',
  }[position];

  return (
    <AnimatePresence>
      {emote && (
        <motion.div
          key={emote.id}
          initial={{ scale: 0, opacity: 0, y: -20 }}
          animate={{ scale: 1.15, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`fixed z-[9999] pointer-events-none ${posClasses}`}
        >
          <div
            className={`
              relative flex items-center gap-3.5 px-6 py-3.5 rounded-2xl
              bg-gradient-to-r ${emote.bgGradient}
              border-2 ${emote.borderColor}
              shadow-[0_0_35px_rgba(249,115,22,0.6)] text-white
            `}
          >
            {/* Animated Glow Aura */}
            <div className="absolute -inset-1.5 rounded-2xl bg-white/30 blur-md -z-10 animate-pulse" />

            {/* Emoji Badge */}
            <motion.span
              animate={{ scale: [1, 1.35, 1], rotate: [0, -12, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-4xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            >
              {emote.emoji}
            </motion.span>

            {/* Text Content */}
            <div className="flex flex-col">
              {playerName && (
                <span className="text-[10px] font-black tracking-widest text-white/90 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {playerName}
                </span>
              )}
              <span className="text-base md:text-lg font-black italic tracking-wider text-white uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                {emote.text}
              </span>
              {emote.subtext && (
                <span className="text-[11px] font-extrabold text-amber-200 italic tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {emote.subtext}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
