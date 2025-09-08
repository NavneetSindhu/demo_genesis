import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import type { HistoryItem, GeneratedImage } from '../types';
import { ImageCard } from './ImageCard';
import { GenerationTerminal } from './GenerationTerminal';
import { DossierFile } from './DossierFile';

interface GenerationBlockProps {
  generationSet: HistoryItem;
  isLatest: boolean;
  onImageClick: (image: GeneratedImage) => void;
  onUpdateTitle?: (historyItemId: string, newTitle: string) => void;
  onGenerateVariations?: (historyItemId: string) => void;
  onStartRefinement?: (image: GeneratedImage) => void;
  onGenerateOriginStory?: (historyItemId: string) => void;
  onSetCharacterVoice?: (historyItemId: string, voiceArchetype: string, voiceId: string) => void;
  onGenerateFoil?: (historyItemId: string) => void;
  isGeneratingVariations?: boolean;
  isGeneratingFoil?: boolean;
}

export const GenerationBlock: React.FC<GenerationBlockProps> = ({ 
    generationSet, 
    isLatest, 
    onImageClick, 
    onUpdateTitle, 
    onGenerateVariations, 
    onStartRefinement, 
    onGenerateOriginStory,
    onSetCharacterVoice,
    onGenerateFoil,
    isGeneratingVariations,
    isGeneratingFoil
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevStatusRef = useRef(generationSet.status);
  
  const { prompt, timestamp, images, id, status, dossier } = generationSet;
  const isDemo = id.startsWith('demo-');

  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(prompt.title || prompt.scene);

  useEffect(() => {
    setTitleValue(prompt.title || prompt.scene);
  }, [prompt.title, prompt.scene]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  useLayoutEffect(() => {
    const el = blockRef.current;
    if (!el) return;

    // Case 1: Transition from 'generating' to 'complete' on an existing block
    if (status === 'complete' && prevStatusRef.current === 'generating') {
      const terminal = el.querySelector('.generation-terminal');
      const results = el.querySelector('.generation-results');

      if (terminal && results) {
        gsap.timeline()
          .to(terminal, { opacity: 0, duration: 0.3, ease: 'power1.in' })
          .fromTo(results, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out', onComplete: () => {
            el.classList.add('is-animated');
          } });
      }
    } 
    // Case 2: Block is new (hasn't been animated yet)
    else if (!el.classList.contains('is-animated')) {
      gsap.from(el, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        ease: 'power3.out',
        onComplete: () => {
          // If it's complete, mark it as animated. If it's generating, the transition logic above will mark it later.
          if (status === 'complete') {
            el.classList.add('is-animated');
          }
        }
      });

      // Handle scrolling ONLY for new blocks that are starting to generate.
      if (isLatest && status === 'generating') {
        setTimeout(() => {
             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }

    prevStatusRef.current = status;

  }, [isLatest, status]);
  
  const handleSave = () => {
    if (onUpdateTitle && titleValue.trim() && titleValue.trim() !== (prompt.title || prompt.scene)) {
      onUpdateTitle(id, titleValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(prompt.title || prompt.scene);
      setIsEditing(false);
    }
  };


  return (
    <div
      ref={blockRef}
      className="group/block relative mb-8"
    >
      <div className={`transition-opacity duration-300 ease-in-out ${!isLatest && status !== 'generating' ? 'opacity-50 group-hover/block:opacity-100' : ''}`}>
        <div className="p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color-light), var(--theme-interactive-bg-hover))' }}>
          <div className="bg-black p-6 sm:p-8">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                     <div className="flex items-center text-3xl sm:text-4xl w-full" style={{ fontFamily: "'VT323', monospace" }}>
                        <span>[</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent focus:outline-none w-full mx-2"
                        />
                        <span>]</span>
                    </div>
                  ) : (
                    <h2 className="text-3xl sm:text-4xl" style={{ fontFamily: "'VT323', monospace" }}>
                      [ {status === 'generating' ? 'GENERATING_TRANSMISSION' : (prompt.title || prompt.scene)} ]
                    </h2>
                  )}

                  {!isEditing && !isDemo && onUpdateTitle && status !== 'generating' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 transition-colors"
                      aria-label="Edit title"
                      style={{ color: 'var(--theme-text-color-dim)', '--hover-color': 'var(--theme-text-color)' } as React.CSSProperties}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--hover-color)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--theme-text-color-dim)'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </div>

                <p className="text-sm truncate max-w-xl" style={{ color: 'var(--theme-text-color-dim)'}} title={prompt.characterDesc}>
                  &gt; {prompt.characterDesc}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 flex-shrink-0">
                 <p className="text-sm" style={{ color: 'var(--theme-text-color-dim)' }}>
                    {status === 'generating' ? 'Awaiting response...' : new Date(timestamp).toLocaleString()}
                </p>
                 {!isDemo && onGenerateVariations && status !== 'generating' && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                          onClick={() => onGenerateFoil?.(id)}
                          disabled={isGeneratingFoil || !dossier || dossier === 'generating'}
                          className="text-lg py-2 px-4 border transition-colors whitespace-nowrap disabled:opacity-50"
                          aria-label="Generate a foil character (companion/nemesis)"
                          title={!dossier || dossier === 'generating' ? "A dossier must be generated first" : "Generate Foil"}
                          style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-color)' }}
                          onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                          onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                      >
                          {isGeneratingFoil ? '[ GENERATING... ]' : '[ GENERATE_FOIL ]'}
                      </button>
                      <button
                          onClick={() => onGenerateVariations(id)}
                          disabled={isGeneratingVariations}
                          className="text-lg py-2 px-4 border transition-colors whitespace-nowrap disabled:opacity-50"
                          aria-label="Generate more variations"
                          style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-color)' }}
                          onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                          onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                      >
                          {isGeneratingVariations ? '[ GENERATING... ]' : '[ GENERATE_VARIATIONS ]'}
                      </button>
                    </div>
                )}
              </div>
            </div>
            {status === 'generating' ? (
              <div className="generation-terminal">
                <GenerationTerminal />
              </div>
            ) : (
              <div className="generation-results" style={{ opacity: prevStatusRef.current === 'generating' ? 0 : 1 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {images.map(image => (
                    <ImageCard 
                      key={image.id}
                      image={image}
                      onViewDetailsClick={() => onImageClick(image)}
                      onRefineClick={() => onStartRefinement?.(image)}
                    />
                  ))}
                </div>
                {dossier && status === 'complete' && (
                  <div className="mt-6">
                      <DossierFile 
                        dossier={dossier} 
                        historyItemId={id}
                        onGenerateOriginStory={onGenerateOriginStory}
                        onSetCharacterVoice={onSetCharacterVoice}
                      />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};