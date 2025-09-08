import React, { useState, useEffect } from 'react';

const messages = [
  "ACCESSING_LORE_ARCHIVES...",
  "WEAVING_STORY_THREADS...",
  "CRAFTING_NARRATIVE...",
  "EXTRACTING_KEY_EVENTS...",
  "COMPILING_BACKSTORY...",
  "FINALIZING_ORIGINS...",
];

const TypedMessage: React.FC<{ text: string; onComplete: () => void; }> = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText(''); // Reset on new text
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(intervalId);
                setTimeout(onComplete, 1000); // Pause for 1 sec on complete message
            }
        }, 35);
        return () => clearInterval(intervalId);
    }, [text, onComplete]);

    const isComplete = displayedText.length === text.length;

    return (
        <p className="text-lg" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
            [ {displayedText}
            {!isComplete && <span className="animate-ping">_</span>}
            {isComplete && <span className="animate-pulse">...</span>} ]
        </p>
    );
};


export const InlineTerminal: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    const handleMessageComplete = () => {
        setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    };
    
    return (
        <div className="p-4 bg-black/50 text-center" style={{ border: '1px dashed var(--theme-border-color-xlight)' }}>
            <TypedMessage 
                text={messages[messageIndex]}
                onComplete={handleMessageComplete}
            />
        </div>
    );
};