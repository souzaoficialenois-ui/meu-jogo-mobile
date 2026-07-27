import React, { useEffect, useRef } from 'react';

interface KiParticlesProps {
    color?: 'orange' | 'cyan' | 'gold' | 'red' | 'purple';
    particleCount?: number;
    speed?: number;
    className?: string;
}

const COLOR_MAPS = {
    orange: {
        primary: 'rgba(249, 115, 22, ',
        secondary: 'rgba(234, 179, 8, ',
        glow: 'rgba(249, 115, 22, 0.3)'
    },
    cyan: {
        primary: 'rgba(6, 182, 212, ',
        secondary: 'rgba(59, 130, 246, ',
        glow: 'rgba(6, 182, 212, 0.3)'
    },
    gold: {
        primary: 'rgba(234, 179, 8, ',
        secondary: 'rgba(250, 204, 21, ',
        glow: 'rgba(234, 179, 8, 0.3)'
    },
    red: {
        primary: 'rgba(239, 68, 68, ',
        secondary: 'rgba(249, 115, 22, ',
        glow: 'rgba(239, 68, 68, 0.3)'
    },
    purple: {
        primary: 'rgba(168, 85, 247, ',
        secondary: 'rgba(236, 72, 153, ',
        glow: 'rgba(168, 85, 247, 0.3)'
    }
};

export const KiParticles: React.FC<KiParticlesProps> = ({
    color = 'orange',
    particleCount = 35,
    speed = 1,
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        };

        window.addEventListener('resize', handleResize);

        const theme = COLOR_MAPS[color] || COLOR_MAPS.orange;

        interface Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            speedX: number;
            alpha: number;
            maxAlpha: number;
            pulseSpeed: number;
            colorType: 'primary' | 'secondary';
            decay: number;
        }

        const particles: Particle[] = [];

        const createParticle = (resetAtBottom = false): Particle => {
            const size = Math.random() * 3.5 + 1;
            return {
                x: Math.random() * width,
                y: resetAtBottom ? height + Math.random() * 20 : Math.random() * height,
                size,
                speedY: (Math.random() * 1.2 + 0.4) * speed,
                speedX: (Math.random() - 0.5) * 0.6 * speed,
                alpha: Math.random() * 0.6 + 0.2,
                maxAlpha: Math.random() * 0.7 + 0.3,
                pulseSpeed: Math.random() * 0.03 + 0.01,
                colorType: Math.random() > 0.3 ? 'primary' : 'secondary',
                decay: Math.random() * 0.002 + 0.001
            };
        };

        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle(false));
        }

        let time = 0;

        const render = () => {
            time += 0.02;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.y -= p.speedY;
                p.x += Math.sin(time + i) * 0.4 + p.speedX;
                p.alpha += Math.sin(time * 3 + i) * p.pulseSpeed;

                if (p.alpha > p.maxAlpha) p.alpha = p.maxAlpha;
                if (p.alpha < 0.1) p.alpha = 0.1;

                if (p.y < -10 || p.x < -20 || p.x > width + 20) {
                    particles[i] = createParticle(true);
                    continue;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                const colorStr = theme[p.colorType];
                ctx.fillStyle = `${colorStr}${p.alpha})`;

                // Glow halo for larger particles
                if (p.size > 2.2) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = theme[p.colorType] + '0.8)';
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, particleCount, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none z-10 opacity-70 ${className}`}
        />
    );
};
