import React, { useState, useEffect, useRef } from 'react';
import { ThemeSelector } from './ThemeSelector';
import { ApiKeyManager } from './ApiKeyManager';
import { ElevenLabsApiKeyManager } from './ElevenLabsApiKeyManager';

interface HeaderProps {
    onNavigate: (view: 'generator' | 'editor') => void;
    currentView: 'generator' | 'editor';
    onSetApiKey: (key: string) => void;
    onClearApiKey: () => void;
    hasUserApiKey: boolean;
    onSetElevenLabsApiKey: (key: string) => void;
    onClearElevenLabsApiKey: () => void;
    hasElevenLabsApiKey: boolean;
}

const useEncryptDecryptAnimation = (baseText: string, enabled: boolean) => {
    const [text, setText] = useState(baseText);
    const chars = '█▓▒░<>/\\-+=*!@#$%^&()[]{}_|';
    const timeoutRef = useRef<any>(null);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setText(baseText);
            return;
        }

        const scramble = (targetText: string, onComplete: () => void) => {
            let iteration = 0;
            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                const newText = targetText
                    .split('')
                    .map((char, index) => {
                        if (char === ' ' || char === '[' || char === ']') return char;
                        if (index < iteration) {
                            return targetText[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');
                setText(newText);

                if (iteration >= targetText.length) {
                    clearInterval(intervalRef.current);
                    onComplete();
                }
                iteration += 1 / 2;
            }, 30);
        };

        const animate = () => {
            const randomScramble = Array.from({ length: baseText.length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            
            scramble(baseText, () => {
                timeoutRef.current = setTimeout(() => {
                    scramble(randomScramble, () => {
                        timeoutRef.current = setTimeout(animate, 500);
                    });
                }, 3000); // 3-second pause on clear text
            });
        };

        animate();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [enabled, baseText]);

    return text;
};


export const Header: React.FC<HeaderProps> = ({ 
    onNavigate, 
    currentView, 
    onSetApiKey, 
    onClearApiKey, 
    hasUserApiKey,
    onSetElevenLabsApiKey,
    onClearElevenLabsApiKey,
    hasElevenLabsApiKey
}) => {
  const isGeneratorView = currentView === 'generator';
  const navButtonBaseText = isGeneratorView ? '[ CONVERSATIONAL_EDITOR ]' : '[ CHARACTER_GENERATOR ]';
  const animatedNavText = useEncryptDecryptAnimation(navButtonBaseText, isGeneratorView);

  return (
    <header className="flex justify-between items-start w-full gap-4 flex-wrap">
      <div className="text-left flex-grow">
        {isGeneratorView ? (
          <>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold title-flicker" style={{ fontFamily: "'VT323', monospace" }}>
              _CHARACTER_GENERATOR
            </h1>
            <p className="mt-4 text-lg max-w-2xl text-green-400/80" style={{ color: 'var(--theme-text-color-dim)' }}>
              &gt; Feed your ideas into the machine. Generate AI-powered comic characters from a simple text prompt.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold title-flicker" style={{ fontFamily: "'VT323', monospace" }}>
              _CONVERSATIONAL_EDITOR
            </h1>
            <p className="mt-4 text-lg max-w-2xl text-green-400/80" style={{ color: 'var(--theme-text-color-dim)' }}>
              &gt; Upload an image and refine it through a continuous chat with the AI.
            </p>
          </>
        )}
      </div>
      <div className="flex-shrink-0 flex flex-col gap-4 w-72">
        <button
          onClick={() => onNavigate(currentView === 'generator' ? 'editor' : 'generator')}
          className={`w-full py-2 px-4 border transition-colors text-lg whitespace-nowrap relative ${isGeneratorView ? 'pulse-glow-anim' : ''}`}
          style={{ 
              fontFamily: "'VT323', monospace", 
              borderColor: 'var(--theme-border-color)', 
              color: 'var(--theme-text-color-dim)' 
          }}
        >
          {isGeneratorView && (
              <span
                className="absolute -top-2 -right-2 px-2 py-1 text-xs new-tag-flicker"
                style={{
                  fontFamily: "'VT323', monospace",
                  backgroundColor: 'var(--theme-color)',
                  color: 'var(--theme-bg-color)',
                  transform: 'rotate(6deg)',
                  lineHeight: '1',
                }}
              >
                NEW!
              </span>
            )}
          <span
            className="gradient-text relative z-[1]"
            style={{
                display: 'inline-block',
                backgroundImage: `linear-gradient(45deg, var(--theme-color), var(--theme-text-color-dim))`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
            }}
          >
            {animatedNavText}
          </span>
        </button>
        <ThemeSelector />
        <ApiKeyManager 
            onSetApiKey={onSetApiKey}
            onClearApiKey={onClearApiKey}
            hasUserApiKey={hasUserApiKey}
        />
        <ElevenLabsApiKeyManager 
            onSetApiKey={onSetElevenLabsApiKey}
            onClearApiKey={onClearElevenLabsApiKey}
            hasUserApiKey={hasElevenLabsApiKey}
        />
      </div>
    </header>
  );
};
