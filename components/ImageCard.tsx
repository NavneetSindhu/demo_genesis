import React, { useRef, useEffect } from 'react';
import type { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onViewDetailsClick: () => void;
  onRefineClick: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onViewDetailsClick, onRefineClick }) => {
  const isPlaceholder = image.b64History.length === 1 && image.b64History[0] === 'placeholder';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When the history changes (a refinement is added), scroll to the newest image.
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [image.b64History.length]);

  return (
    <div 
      className={`group/card w-full aspect-[4/3] bg-black/50 p-px relative overflow-hidden`}
      style={{ background: 'linear-gradient(to bottom, var(--theme-border-color), var(--theme-border-color-xlight))' }}
    >
      {isPlaceholder ? (
        <div 
          className="w-full h-full flex items-center justify-center p-4 bg-black/20"
          style={{ border: '2px dashed var(--theme-border-color-light)' }}
        >
          <p className="text-xl text-center" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
            [ CHARACTER_OUTPUT ]
          </p>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 w-full h-full">
            <div ref={scrollContainerRef} className="w-full h-full flex overflow-x-auto snap-x snap-mandatory">
              {image.b64History.map((b64, index) => (
                <img
                  key={`${image.id}-${index}`}
                  src={`data:image/png;base64,${b64}`}
                  alt={`Generated Character ${image.id} Version ${index + 1}`}
                  className="w-full h-full object-cover flex-shrink-0 snap-center transition-transform duration-300"
                />
              ))}
            </div>
          </div>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center p-4 flex-col gap-4 pointer-events-none">
              <button onClick={onViewDetailsClick} className="text-lg py-2 px-4 border transition-colors w-48 pointer-events-auto" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                  [ VIEW_DETAILS ]
              </button>
              <button onClick={onRefineClick} className="text-lg py-2 px-4 border transition-colors w-48 pointer-events-auto" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                  [ REFINE ]
              </button>
               {image.b64History.length > 1 && (
                <p className="absolute bottom-4 text-sm font-bold animate-pulse" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
                    [ SCROLL_FOR_VERSIONS ]
                </p>
              )}
          </div>

          {image.b64History.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 opacity-100 group-hover/card:opacity-0 transition-opacity">
                {image.b64History.map((_, index) => (
                    <div key={index} className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-color)', opacity: '0.7' }}></div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};