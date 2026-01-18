import React, { useEffect, useRef, memo } from 'react';

const NeuralBackground: React.FC = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Reduced for performance
        const particleCount = 50; // Reduced from 100
        const connectionDistance = 150; // Reduced from 180
        let frameCount = 0;

        // Mouse interaction with throttling
        const mouse = {
            x: undefined as number | undefined,
            y: undefined as number | undefined,
            radius: 150
        };

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.3; // Slower
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 1.5 + 0.5;
                this.color = Math.random() > 0.5 ? '#6366f1' : '#a855f7';
            }

            update(w: number, h: number) {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;

                // Mouse attraction (simplified)
                if (mouse.x !== undefined && mouse.y !== undefined) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distSq = dx * dx + dy * dy; // Avoid sqrt
                    const radiusSq = mouse.radius * mouse.radius;

                    if (distSq < radiusSq) {
                        const distance = Math.sqrt(distSq);
                        const force = (mouse.radius - distance) / mouse.radius * 0.008;
                        this.vx += (dx / distance) * force;
                        this.vy += (dy / distance) * force;

                        // Limit speed
                        const speedSq = this.vx * this.vx + this.vy * this.vy;
                        if (speedSq > 0.64) { // maxSpeed = 0.8
                            const speed = Math.sqrt(speedSq);
                            this.vx = (this.vx / speed) * 0.8;
                            this.vy = (this.vy / speed) * 0.8;
                        }
                    }
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.25;
                ctx.fill();
            }
        }

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Limit DPR
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.scale(dpr, dpr);
            init();
        };

        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(window.innerWidth, window.innerHeight));
            }
        };

        // Throttled mouse handler
        let lastMouseUpdate = 0;
        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastMouseUpdate > 50) { // Max 20 updates/sec
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                lastMouseUpdate = now;
            }
        };

        const handleMouseLeave = () => {
            mouse.x = undefined;
            mouse.y = undefined;
        };

        const animate = () => {
            frameCount++;

            // Skip connection drawing every other frame for performance
            const drawConnections = frameCount % 2 === 0;

            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const len = particles.length;
            for (let i = 0; i < len; i++) {
                const p = particles[i];
                p.update(window.innerWidth, window.innerHeight);
                p.draw();

                // Only draw connections every other frame
                if (drawConnections) {
                    for (let j = i + 1; j < len; j++) {
                        const p2 = particles[j];
                        const dx = p.x - p2.x;
                        const dy = p.y - p2.y;
                        const distSq = dx * dx + dy * dy;
                        const connDistSq = connectionDistance * connectionDistance;

                        if (distSq < connDistSq) {
                            const dist = Math.sqrt(distSq);
                            ctx.beginPath();
                            ctx.strokeStyle = p.color;
                            ctx.globalAlpha = (1 - dist / connectionDistance) * 0.15;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
            }
            ctx.globalAlpha = 1;

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="neural-background"
            className="fixed inset-0 -z-10 bg-transparent pointer-events-none"
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />
    );
});

NeuralBackground.displayName = 'NeuralBackground';

export default NeuralBackground;

