import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ResultsDisplayProps {
  images: string[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    const ctx = gsap.context(() => {
      gsap.from(".character-panel-anim", {
        opacity: 0,
        filter: 'blur(5px)',
        duration: 0.5,
        ease: 'power1.inOut',
        stagger: {
            amount: 0.5,
            from: "start"
        },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [images]);

  return (
    <div ref={containerRef} className="mt-12">
      <div className="p-px bg-gradient-to-b from-green-400/30 to-green-400/10">
        <div className="bg-black p-6 sm:p-8">
            <h2 className="text-4xl mb-6" style={{ fontFamily: "'VT323', monospace" }}>[ CHARACTER_VARIATIONS_OUTPUT ]</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((imageB64, index) => (
                <div key={index} className="character-panel-anim aspect-[4/3] bg-black/50 p-px bg-gradient-to-b from-green-400/40 to-green-400/20">
                    <img
                        src={`data:image/png;base64,${imageB64}`}
                        alt={`Generated Character Variation ${index + 1}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};