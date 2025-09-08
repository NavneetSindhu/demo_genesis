import React, { useRef, useEffect } from 'react';

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const orbsRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationFrameId: number;

    class Orb {
      x: number;
      y: number;
      baseRadius: number;
      radius: number;
      angle: number;
      speed: number;
      color: string;
      waveFrequency: number;
      waveAmplitude: number;
      waveOffset: number;
      colorRgb: string;

      constructor(colorRgb: string) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseRadius = 800 + Math.random() * 500; // Much larger for aurora effect
        this.radius = this.baseRadius;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.1 + Math.random() * 0.2; // Slower, more ambient movement
        this.colorRgb = colorRgb;
        this.color = `rgba(${this.colorRgb}, ${0.05 + Math.random() * 0.08})`; // More transparent
        this.waveFrequency = 0.001 + Math.random() * 0.002;
        this.waveAmplitude = 50 + Math.random() * 50;
        this.waveOffset = Math.random() * Math.PI * 2;
      }
      
      setColor(newColorRgb: string) {
        this.colorRgb = newColorRgb;
        this.color = `rgba(${this.colorRgb}, ${0.05 + Math.random() * 0.08})`;
      }

      update() {
        this.angle += 0.001;
        // Wavy, flowing movement
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed * 0.5 + Math.sin(Date.now() * this.waveFrequency + this.waveOffset) * 0.3;

        // Wrap around screen edges
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
        
        // Mouse interaction
        const dx = this.x - mousePos.current.x;
        const dy = this.y - mousePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Warp radius on mouse proximity
        const warpFactor = Math.max(0, 1 - dist / 500);
        this.radius = this.baseRadius + warpFactor * 200;

        // Push away from cursor
        if (dist < 400) {
            const force = (1 - dist / 400) * 2;
            if (dist > 1) { 
                this.x += (dx / dist) * force;
                this.y += (dy / dist) * force;
            }
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        const currentOpacity = parseFloat(this.color.split(',')[3] || '0.1)');
        gradient.addColorStop(0, `rgba(${this.colorRgb}, ${currentOpacity})`);
        gradient.addColorStop(1, `rgba(${this.colorRgb}, 0)`);
        context.fillStyle = gradient;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    const initOrbs = () => {
        const colorRgb = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-rgb').trim();
        orbsRef.current = Array.from({ length: 6 }, () => new Orb(colorRgb));
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      orbsRef.current.forEach(orb => {
        orb.update();
        orb.draw(ctx);
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
    }

    const handleThemeChange = () => {
        const newColorRgb = getComputedStyle(document.documentElement).getPropertyValue('--theme-color-rgb').trim();
        orbsRef.current.forEach(orb => orb.setColor(newColorRgb));
    };
    
    document.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    initOrbs();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />;
};