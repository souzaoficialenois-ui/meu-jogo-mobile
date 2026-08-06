import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTE_LIST, EmoteData } from './EmoteTypes';
import { AudioManager } from '../../services/AudioManager';
import { Smile, X, Sparkles } from 'lucide-react';

interface EmoteRadialMenuProps {
  onSelectEmote: (emote: EmoteData) => void;
  buttonLabel?: string;
  positionClassName?: string;
}

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, endInner.x, endInner.y,
    'Z',
  ].join(' ');
};

export const EmoteRadialMenu: React.FC<EmoteRadialMenuProps> = ({
  onSelectEmote,
  buttonLabel = 'EMOTES',
  positionClassName = 'bottom-6 right-6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isSelectingRef = useRef(false);

  const toggleMenu = () => {
    try {
      AudioManager.getInstance().playSFX(isOpen ? 'cancel' : 'click');
    } catch (e) {}
    setIsOpen((prev) => !prev);
    setSelectedIndex(null);
  };

  const handleSelect = (emote: EmoteData, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;

    try {
      AudioManager.getInstance().playSFX(emote.sfx || 'confirm');
    } catch (err) {
      console.warn('Emote SFX playback:', err);
    }

    onSelectEmote(emote);
    setIsOpen(false);
    setSelectedIndex(null);

    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  const total = EMOTE_LIST.length;
  const SLICE_ANGLE = 360 / total;
  const HALF_SLICE = SLICE_ANGLE / 2;

  const hoveredEmote = selectedIndex !== null ? EMOTE_LIST[selectedIndex] : null;

  return (
    <>
      {/* Centered Radial Skill Wheel Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center select-none pointer-events-auto">
            {/* Darkened Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Central Radial Wheel Container */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative z-10 flex items-center justify-center pointer-events-auto"
            >
              {/* Radial Skills Style Wheel Wrapper */}
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: 'spring', damping: 25, stiffness: 380 }}
                className="relative w-[340px] h-[340px] md:w-[380px] md:h-[380px] flex items-center justify-center filter drop-shadow-[0_0_35px_rgba(249,115,22,0.45)]"
              >
                {/* SVG Background Slices */}
                <svg
                  viewBox="0 0 320 320"
                  className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                >
                  <defs>
                    <radialGradient id="radial-bg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1c1917" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#0c0a09" stopOpacity="0.98" />
                    </radialGradient>
                    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer Glowing Energy Ring */}
                  <circle
                    cx="160"
                    cy="160"
                    r="154"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    opacity="0.6"
                    className="animate-spin-slow"
                  />

                  {/* Radial Slices (Skills Wheel Style) */}
                  {EMOTE_LIST.map((emote, i) => {
                    const startAngle = i * SLICE_ANGLE - HALF_SLICE;
                    const endAngle = i * SLICE_ANGLE + HALF_SLICE;
                    const isSelected = selectedIndex === i;

                    const innerRadius = 46;
                    const outerRadius = isSelected ? 154 : 144;

                    const slicePath = describeArc(
                      160,
                      160,
                      innerRadius,
                      outerRadius,
                      startAngle,
                      endAngle,
                    );

                    return (
                      <path
                        key={`path-${emote.id}`}
                        d={slicePath}
                        fill={isSelected ? 'rgba(249, 115, 22, 0.55)' : 'rgba(28, 25, 23, 0.92)'}
                        stroke={isSelected ? '#f97316' : '#57534e'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        style={{ transition: 'all 0.15s ease-out' }}
                        filter={isSelected ? 'url(#glow-orange)' : undefined}
                      />
                    );
                  })}

                  {/* Inner Hub Center Circle */}
                  <circle
                    cx="160"
                    cy="160"
                    r="46"
                    fill="#0c0a09"
                    stroke={hoveredEmote ? '#f97316' : '#78716c'}
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />
                  <circle
                    cx="160"
                    cy="160"
                    r="43"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    opacity="0.5"
                  />
                </svg>

                {/* 8 Interactive HTML Buttons orbiting the center hub */}
                {EMOTE_LIST.map((emote, i) => {
                  const angleInDegrees = i * SLICE_ANGLE - 90;
                  const rad = (angleInDegrees * Math.PI) / 180;
                  const DISTANCE_PX = 108;
                  const x = DISTANCE_PX * Math.cos(rad);
                  const y = DISTANCE_PX * Math.sin(rad);
                  const isSelected = selectedIndex === i;

                  return (
                    <div
                      key={emote.id}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="z-20 w-16 h-16 flex items-center justify-center pointer-events-auto"
                    >
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.22 }}
                        whileTap={{ scale: 0.92 }}
                        animate={{ scale: isSelected ? 1.12 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onMouseEnter={() => {
                          setSelectedIndex(i);
                          try { AudioManager.getInstance().playSFX('click'); } catch(e){}
                        }}
                        onClick={(e) => handleSelect(emote, e)}
                        className={`
                          w-full h-full rounded-full flex flex-col items-center justify-center
                          bg-gradient-to-br ${emote.bgGradient}
                          border-2 ${isSelected ? 'border-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.9)]' : emote.borderColor}
                          shadow-[0_0_20px_rgba(249,115,22,0.5)]
                          cursor-pointer group hover:brightness-125 transition-colors
                        `}
                        title={`${emote.name} - ${emote.text}`}
                      >
                        <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform pointer-events-none">
                          {emote.emoji}
                        </span>
                        <span className="text-[8.5px] font-black italic tracking-tighter text-white uppercase truncate max-w-[58px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none">
                          {emote.text}
                        </span>
                      </motion.button>
                    </div>
                  );
                })}

                {/* Center Hub Overlay Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="absolute z-30 w-22 h-22 rounded-full flex flex-col items-center justify-center text-white cursor-pointer group pointer-events-auto"
                >
                  {hoveredEmote ? (
                    <motion.div
                      key={hoveredEmote.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-center px-1 pointer-events-none"
                    >
                      <span className="text-xl leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {hoveredEmote.emoji}
                      </span>
                      <span className="text-[9px] font-black italic tracking-wider text-orange-400 uppercase mt-0.5 line-clamp-1">
                        {hoveredEmote.text}
                      </span>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center text-center pointer-events-none">
                      <Smile className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-black italic tracking-widest text-orange-400 uppercase mt-0.5">
                        EMOTES
                      </span>
                    </div>
                  )}
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <div className={`fixed z-40 ${positionClassName}`}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleMenu}
          className={`
            px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black italic tracking-wider text-xs uppercase
            ${isOpen
              ? 'bg-red-600 text-white border-2 border-red-400 shadow-lg shadow-red-500/40'
              : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-2 border-amber-300/60 shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60'
            }
            cursor-pointer backdrop-blur-md transition-all
          `}
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>FECHAR</span>
            </>
          ) : (
            <>
              <Smile className="w-4 h-4 text-yellow-300 animate-bounce" />
              <span>{buttonLabel}</span>
              <Sparkles className="w-3 h-3 text-amber-200" />
            </>
          )}
        </motion.button>
      </div>
    </>
  );
};
