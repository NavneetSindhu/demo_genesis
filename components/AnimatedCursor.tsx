import React, { useEffect, useRef } from 'react';

export const AnimatedCursor: React.FC = () => {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const positions = useRef<{ x: number; y: number }[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const createTrail = () => {
      const numDots = 15;
      const opacityStep = 1 / numDots;

      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        document.body.appendChild(dot);
        dotsRef.current[i] = dot;
        positions.current[i] = { x: 0, y: 0 };
        dot.style.opacity = `${1 - i * opacityStep}`;
        dot.style.transform = `scale(${1 - i * 0.04})`;
      }
    };

    const animateDots = () => {
      let x = mousePos.current.x;
      let y = mousePos.current.y;

      positions.current.forEach((pos, index) => {
        const nextPos = positions.current[index + 1] || positions.current[index];
        pos.x = x;
        pos.y = y;

        const dx = x - nextPos.x;
        const dy = y - nextPos.y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const ease = 0.35; // Increased from 0.2 for faster response

        const targetX = nextPos.x + Math.cos(angle) * distance * ease;
        const targetY = nextPos.y + Math.sin(angle) * distance * ease;

        if (dotsRef.current[index]) {
            dotsRef.current[index].style.left = `${targetX}px`;
            dotsRef.current[index].style.top = `${targetY}px`;
        }
        
        x = targetX;
        y = targetY;
      });

      animationFrameRef.current = requestAnimationFrame(animateDots);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    createTrail();
    animateDots();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      dotsRef.current.forEach(dot => dot?.remove());
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return null;
};