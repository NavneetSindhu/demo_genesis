import React, { useState, useEffect } from 'react';

const messages = [
  "ACCESSING_LORE_ARCHIVES...",
  "WEAVING_STORY_THREADS...",
  "CRAFTING_NARRATIVE...",
  "EXTRACTING_KEY_EVENTS...",
  "COMPILING_BACKSTORY...",
  "FINALIZING_ORIGINS...",
];

export const InlineTerminal: React.FC = () => {
    const [currentMessage, setCurrentMessage] = useState(messages[0]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 1500); // Change message every 1.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 bg-black/50 text-center" style={{ border: '1px dashed var(--theme-border-color-xlight)' }}>
            <p className="text-lg animate-pulse" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
                [ {currentMessage} ]
            </p>
        </div>
    );
};
