
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UIAdapter } from '../services/UIAdapter';

interface UIContextType {
  scale: number;
  offsetX: number;
  offsetY: number;
  screenWidth: number;
  screenHeight: number;
  s: (value: number) => number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  getPos: (x: number, y: number, anchor?: string) => { x: number, y: number };
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  const updateScale = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Prevent jitter from mobile address bar hiding/showing
    const widthDiff = Math.abs(width - dimensions.width);
    const heightDiff = Math.abs(height - dimensions.height);

    if (widthDiff < 5 && heightDiff < 100 && dimensions.width !== 0) {
      return;
    }

    UIAdapter.update(width, height);
    
    const scale = UIAdapter.getScale();
    const offsets = UIAdapter.getOffsets();

    setDimensions({
      width,
      height,
      scale,
      offsetX: offsets.x,
      offsetY: offsets.y
    });

    // Update global CSS variables
    const root = document.documentElement;
    root.style.setProperty('--global-scale', scale.toString());
    root.style.setProperty('--ui-offset-x', `${offsets.x}px`);
    root.style.setProperty('--ui-offset-y', `${offsets.y}px`);
    
    // Safe area values
    root.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-right', 'env(safe-area-inset-right, 0px)');
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  const value: UIContextType = {
    scale: dimensions.scale,
    offsetX: dimensions.offsetX,
    offsetY: dimensions.offsetY,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    s: (v) => UIAdapter.s(v),
    sx: (x) => UIAdapter.scaleX(x),
    sy: (y) => UIAdapter.scaleY(y),
    getPos: (x, y, anchor) => UIAdapter.getPos(x, y, anchor)
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
