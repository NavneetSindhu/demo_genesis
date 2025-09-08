import React, { useState, useEffect } from 'react';

const messages = [
  "Summoning digital muses...",
  "Directing cinematic scene...",
  "Calibrating the lens flares...",
  "Rendering final cut...",
  "Synchronizing audio-visual data...",
  "Polishing the pixels...",
];

export const VideoGenerationProgress: React.FC = () => {
    const [currentMessage, setCurrentMessage] = useState(messages[0]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-4 bg-black/50 text-center mt-2" style={{ border: '1px dashed var(--theme-border-color-light)' }}>
            <p className="text-xl" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color)' }}>
                [ Generating Cinematic Intro... ]
            </p>
            <p className="mt-2 text-md" style={{ color: 'var(--theme-text-color-dim)' }}>
                {currentMessage}
            </p>
             <p className="mt-4 text-sm" style={{ color: 'var(--theme-text-color-dim)' }}>
                (This process can take several minutes. Please be patient.)
            </p>
            <div className="w-full bg-black/50 h-2 mt-4 overflow-hidden" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                <div 
                    className="h-full" 
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--theme-color)',
                        animation: 'progress-anim 4s linear infinite'
                    }}
                ></div>
            </div>
            <style>{`
                @keyframes progress-anim {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};
