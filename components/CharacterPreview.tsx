
import React, { useRef, useEffect, useMemo } from 'react';
import { CharacterData, PlayerState } from '../types';
import { SpriteRenderer } from '../services/SpriteRenderer';
import { SPRITE_DB, DEFAULT_SPRITE_SET } from '../constants/SpriteDatabase';

interface CharacterPreviewProps {
    character: CharacterData;
    facingRight?: boolean;
    scale?: number; // Visual scale multiplier
    animate?: boolean;
    animationType?: PlayerState;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({ 
    character, 
    facingRight = true, 
    scale = 1.0,
    animate = true,
    animationType = PlayerState.IDLE
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const frameRef = useRef<number>(0);
    const timerRef = useRef<number>(0);

    useEffect(() => {
        if (character) {
            SpriteRenderer.getInstance().preloadCharacter(character);
        }
    }, [character]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animManager = SpriteRenderer.getInstance();
        
        // Robust fallback for sprite config
        const spriteConfig = character?.spriteConfig || (character?.id ? SPRITE_DB[character.id] : null) || DEFAULT_SPRITE_SET;
        
        // Robust fallback for animation data
        const rawAnimData = spriteConfig?.animations?.[animationType] || 
                         DEFAULT_SPRITE_SET.animations?.[animationType] ||
                         DEFAULT_SPRITE_SET.animations?.[PlayerState.IDLE];

        if (!rawAnimData) return;

        // Force fullScreen to false for previews to avoid covering the whole menu
        const animData = { ...rawAnimData, fullScreen: false };

        const loop = () => {
            if (!canvas) return;

            // 1. Update Animation Frame
            if (animate) {
                timerRef.current++;
                const speed = animData.speed || 5;
                if (timerRef.current >= speed) {
                    timerRef.current = 0;
                    frameRef.current++;
                    
                    // Get real frame count for GIFs if available
                    let frames = animData.frames;
                    if (animData.isGif) {
                        const gifFrames = SpriteRenderer.getInstance().getGifFrameCount(animData.imageUrl);
                        if (gifFrames > 0) frames = gifFrames;
                    }
                    
                    if (frameRef.current >= frames) {
                        frameRef.current = 0;
                    }
                }
            } else {
                frameRef.current = 0;
            }

            // 2. Clear & Resize
            // We use the parent container size for the canvas
            const parent = canvas.parentElement;
            if (parent) {
                // Handle DPR for crisp rendering
                const dpr = window.devicePixelRatio || 1;
                const rect = parent.getBoundingClientRect();
                
                // Check for valid dimensions to prevent errors
                if (rect.width > 0 && rect.height > 0) {
                    // Only resize if dimensions changed to avoid perf hit
                    // Rounding prevents sub-pixel jitter loops
                    const targetW = Math.round(rect.width * dpr);
                    const targetH = Math.round(rect.height * dpr);

                    if (canvas.width !== targetW || canvas.height !== targetH) {
                        canvas.width = targetW;
                        canvas.height = targetH;
                        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and set scale
                        canvas.style.width = `${rect.width}px`;
                        canvas.style.height = `${rect.height}px`;
                    }

                    // Use logic dimensions for clearing
                    const logicalW = rect.width;
                    const logicalH = rect.height;

                    ctx.clearRect(0, 0, logicalW, logicalH);
                    ctx.imageSmoothingEnabled = false;

                    // 3. Draw Character
                    // Maintain aspect ratio of the sprite frame
                    const padding = 10;
                    // Clamp to 0 to avoid negative dimensions which cause canvas errors
                    const drawHeight = Math.max(0, logicalH - (padding * 2));
                    const aspectRatio = (animData.frameWidth || 128) / (animData.frameHeight || 128);
                    const drawWidth = drawHeight * aspectRatio;

                    // We want the character's anchor point to be at the bottom center of our canvas.
                    // The SpriteRenderer computes the anchor as (x + ox, y + oy).
                    const paddingX = 10;
                    const paddingY = 25; // Reduzido para subir mais o personagem

                    // Calculate what the SpriteRenderer will use as ox and oy.
                    // We need to pass a fake width/height just in case it falls back to w/2.
                    const fakeWidth = 150;
                    const fakeHeight = 200;

                    const ox = animData.originX !== undefined ? animData.originX : fakeWidth / 2;
                    const oy = animData.originY !== undefined ? animData.originY : fakeHeight;

                    // Compute the top-left X/Y coordinate that will place (x+ox, y+oy) at (logicalW/2, logicalH-padding)
                    const drawX = (logicalW / 2) - ox;
                    const drawY = (logicalH - paddingY) - oy;

                    if (logicalW > 0 && logicalH > 0) {
                        ctx.save();
                        // Scale the character to fit into the container. Most character setups use originY ~ 300.
                        // Usamos um maxExpectedHeight menor (220 em vez de 350) para dar zoom na parte superior
                        const maxExpectedHeight = 220; 
                        let scaleMultiplier = (logicalH) / maxExpectedHeight;
                        if (scaleMultiplier > 2.0) scaleMultiplier = 2.0; // zoom mais agressivo
                        
                        const anchorX = logicalW / 2;
                        // O anchorY é posicionado mais abaixo para que a parte superior fique no meio do canvas
                        const anchorY = logicalH * 1.1; 
                        
                        ctx.translate(anchorX, anchorY);
                        ctx.scale(scaleMultiplier, scaleMultiplier);
                        ctx.translate(-anchorX, -anchorY);

                        // Create a modified character object to override animation properties for the preview
                        const modifiedCharacter = {
                            ...character,
                            spriteConfig: {
                                ...spriteConfig,
                                animations: {
                                    ...spriteConfig.animations,
                                    [animationType]: {
                                        ...rawAnimData,
                                        fullScreen: false
                                    }
                                }
                            }
                        };

                        animManager.drawPlayer(
                            ctx,
                            modifiedCharacter as CharacterData,
                            animationType,
                            drawX,
                            drawY,
                            fakeWidth,
                            fakeHeight,
                            facingRight,
                            frameRef.current,
                            false // not stunned
                        );

                        ctx.restore();
                    }
                }
            }

            animationRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [character, facingRight, scale, animate, animationType]);

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <canvas 
                ref={canvasRef} 
                style={{ position: 'absolute' }}
                className="block w-full h-full absolute inset-0 pointer-events-none !absolute"
            />
        </div>
    );
};
