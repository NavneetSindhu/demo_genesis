import React, { useState, useEffect } from 'react';

const lines = [
    '[CONNECTING_TO_ARTIST_AI]...',
    '[ALLOCATING_PIXEL_BUFFER]...',
    '[RENDERING_LAYER_1_OUTLINES]...',
    '[APPLYING_TEXTURE_SHADERS]...',
    '[FINALIZING_IMAGE_MATRIX]...',
];

const TypedLine: React.FC<{ text: string; onComplete: () => void; isLastLine: boolean }> = ({ text, onComplete, isLastLine }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(intervalId);
                setTimeout(onComplete, isLastLine ? 250 : 300 + Math.random() * 200);
            }
        }, 25);
        return () => clearInterval(intervalId);
    }, [text, onComplete, isLastLine]);

    const isComplete = displayedText.length === text.length;

    return (
        <p>
            &gt; {displayedText}
            {!isComplete && <span className="animate-ping">_</span>}
            {isComplete && !isLastLine && ' COMPLETE'}
            {isComplete && isLastLine && ' [COMPLETE]'}
        </p>
    );
};


export const GenerationTerminal: React.FC = () => {
    const [currentLine, setCurrentLine] = useState(0);

    return (
        <div className="h-full min-h-[40vh] flex flex-col justify-center p-8" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color)', fontSize: '1.25rem' }}>
            {lines.slice(0, currentLine).map((line, index) => (
                <p key={index}>&gt; {line} COMPLETE</p>
            ))}
            {currentLine < lines.length && (
                 <TypedLine
                    text={lines[currentLine]}
                    onComplete={() => setCurrentLine(c => c + 1)}
                    isLastLine={currentLine === lines.length - 1}
                />
            )}
        </div>
    );
};