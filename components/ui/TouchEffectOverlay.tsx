import React, { useEffect, useRef } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';

interface KiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

interface TouchBurst {
  id: number;
  x: number;
  y: number;
  startTime: number;
  duration: number; // in ms
  maxRadius: number;
  color: string; // primary Ki color
  secondaryColor: string;
  particles: KiParticle[];
}

export interface TouchColorPalette {
  primary: string;
  secondary: string;
  glow: string;
}

export const TOUCH_COLOR_PALETTES: Record<string, TouchColorPalette> = {
  GOLD: { primary: '#ff9900', secondary: '#ffe600', glow: '#ff5500' }, // Gold / Saiyan Aura
  BLUE: { primary: '#00e5ff', secondary: '#66f0ff', glow: '#0088ff' }, // God / Blue Ki
  ROSE: { primary: '#ff3366', secondary: '#ff99bb', glow: '#cc0033' }, // Rose / Kaioken
  GREEN: { primary: '#00ff66', secondary: '#99ffbb', glow: '#00cc44' }, // Broly Green
  PURPLE: { primary: '#aa00ff', secondary: '#e088ff', glow: '#7700cc' }, // Hakai Purple
  RED: { primary: '#ff1100', secondary: '#ff7766', glow: '#b30000' }, // God Red
  SILVER: { primary: '#ffffff', secondary: '#e0f7fa', glow: '#80deea' }, // Silver Instinct
};

export const TouchEffectOverlay: React.FC = () => {
  const { currentScene, settings } = useSceneManager();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstsRef = useRef<TouchBurst[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const nextIdRef = useRef<number>(1);
  const lastTouchTimeRef = useRef<number>(0);

  // Determine if touch effects are allowed in the current state
  const isEffectAllowed = (): boolean => {
    // Check if we are in active combat gameplay
    const isCombatScene =
      currentScene === SceneName.BATTLE ||
      currentScene === SceneName.TRAINING ||
      currentScene === SceneName.VS_SCREEN;

    if (isCombatScene) {
      // In battle scenes, respect the setting toggle
      return settings?.touchEffectInBattle !== false;
    }

    // In all menu scenes (MainMenu, CharacterSelect, Pause, Settings, Shop, etc.), always enabled!
    return true;
  };

  // Function to create a burst at (x, y)
  const spawnBurst = (x: number, y: number) => {
    if (!isEffectAllowed()) return;

    // Pick Ki color palette according to user settings
    const userColorChoice = settings?.touchEffectColor || 'RANDOM';
    let palette: TouchColorPalette;

    if (userColorChoice === 'RANDOM' || !TOUCH_COLOR_PALETTES[userColorChoice]) {
      const allKeys = Object.keys(TOUCH_COLOR_PALETTES);
      const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
      palette = TOUCH_COLOR_PALETTES[randomKey];
    } else {
      palette = TOUCH_COLOR_PALETTES[userColorChoice];
    }
    
    // Create 10-14 Ki sparks
    const particleCount = Math.floor(Math.random() * 5) + 10;
    const particles: KiParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? palette.primary : palette.secondary,
        alpha: 1,
        maxLife: Math.floor(Math.random() * 15) + 18, // 18-32 frames (~300-500ms)
        life: 0,
      });
    }

    const burst: TouchBurst = {
      id: nextIdRef.current++,
      x,
      y,
      startTime: performance.now(),
      duration: 420, // 420ms ring animation
      maxRadius: Math.random() * 15 + 50, // 50-65px max radius
      color: palette.primary,
      secondaryColor: palette.secondary,
      particles,
    };

    burstsRef.current.push(burst);

    // Start animation loop if not running
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      requestAnimationFrame(renderLoop);
    }
  };

  // Main canvas rendering loop
  const renderLoop = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      isAnimatingRef.current = false;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isAnimatingRef.current = false;
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeBursts: TouchBurst[] = [];

    for (const burst of burstsRef.current) {
      const elapsed = now - burst.startTime;
      const progress = Math.min(1, elapsed / burst.duration);

      if (progress < 1 || burst.particles.some((p) => p.life < p.maxLife)) {
        activeBursts.push(burst);

        // 1. Draw Core Energy Burst Flash
        if (progress < 0.6) {
          const coreAlpha = (1 - progress / 0.6) * 0.9;
          const coreRadius = (1 - progress / 0.6) * 14;

          ctx.save();
          ctx.beginPath();
          ctx.arc(burst.x, burst.y, Math.max(1, coreRadius), 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = burst.color;
          ctx.shadowBlur = 20;
          ctx.globalAlpha = coreAlpha;
          ctx.fill();
          ctx.restore();
        }

        // 2. Draw Primary Expanding Shockwave Ring
        const currentRadius = Math.max(0, burst.maxRadius * Math.sin((progress * Math.PI) / 2)); // Eased expansion
        const ringAlpha = Math.pow(1 - progress, 1.5);
        const lineWidth = Math.max(0.5, (1 - progress) * 4);

        ctx.save();
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, Math.max(0, currentRadius), 0, Math.PI * 2);
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = burst.secondaryColor;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = ringAlpha;
        ctx.stroke();
        ctx.restore();

        // 3. Draw Outer Secondary Aura Wave
        if (progress > 0.1) {
          const outerRadius = Math.max(0, currentRadius * 1.25);
          const outerAlpha = ringAlpha * 0.5;

          ctx.save();
          ctx.beginPath();
          ctx.arc(burst.x, burst.y, Math.max(0, outerRadius), 0, Math.PI * 2);
          ctx.strokeStyle = burst.secondaryColor;
          ctx.lineWidth = lineWidth * 0.6;
          ctx.globalAlpha = outerAlpha;
          ctx.stroke();
          ctx.restore();
        }

        // 4. Update & Draw Ki Particles
        for (const p of burst.particles) {
          if (p.life < p.maxLife) {
            p.life++;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.91; // Drag factor
            p.vy *= 0.91;

            const pProgress = p.life / p.maxLife;
            const pAlpha = (1 - pProgress) * 0.95;
            const pSize = p.size * (1 - pProgress * 0.5);

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, pSize), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.globalAlpha = pAlpha;
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    burstsRef.current = activeBursts;

    if (activeBursts.length > 0) {
      requestAnimationFrame(renderLoop);
    } else {
      isAnimatingRef.current = false;
    }
  };

  useEffect(() => {
    // Handle Window Resize
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Event Handlers for Pointer & Touch
    const handlePointerDown = (e: PointerEvent) => {
      // Avoid duplicated touchstart handling
      if (e.pointerType === 'touch') {
        lastTouchTimeRef.current = Date.now();
      }
      spawnBurst(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        spawnBurst(touch.clientX, touch.clientY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Ignore mouse events that were synthesized from recent touch events
      if (Date.now() - lastTouchTimeRef.current < 500) return;
      spawnBurst(e.clientX, e.clientY);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [currentScene, settings]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[999999]"
      style={{ pointerEvents: 'none' }}
    />
  );
};
