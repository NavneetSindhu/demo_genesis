import React, { useState, useEffect } from 'react';

const lines = [
    { text: "> Authenticating secure channel...", delay: 200 },
    { text: "> Compiling render modules...", delay: 500 },
    { text: "> System ready. Welcome Operator.", delay: 900 },
];

const decryptionChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()[]{}<>-=_+';
const decryptionBase = '> DECRYPTING_DATA_STREAM... ';

export const SplashScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [isFading, setIsFading] = useState(false);
    const [decryptionText, setDecryptionText] = useState(decryptionBase);

    useEffect(() => {
        // Manage the appearance of the sequential lines
        const lineTimeouts = lines.map((line) => 
            setTimeout(() => {
                setVisibleLines(prev => prev + 1);
            }, line.delay)
        );

        // Manage the constantly scrambling decryption line
        const scrambleInterval = setInterval(() => {
            let scramble = '';
            for(let i=0; i < 15; i++) {
                scramble += decryptionChars[Math.floor(Math.random() * decryptionChars.length)];
            }
            setDecryptionText(`${decryptionBase}[${scramble}]`);
        }, 60);

        // Manage the end of the splash screen
        const endTimeout = setTimeout(() => {
            clearInterval(scrambleInterval);
            setDecryptionText(`${decryptionBase}[DECRYPTION_SUCCESS]`); // Final state
            
            // Short pause after final state, then fade
            const fadeTimeout = setTimeout(() => {
                setIsFading(true);
                // Call onFinished after the fade animation completes
                setTimeout(onFinished, 500); 
            }, 300);

            // This cleanup is for the nested timeout
            return () => clearTimeout(fadeTimeout);

        }, 1500); // Total duration before fade sequence starts

        // Main cleanup function for the effect
        return () => {
            lineTimeouts.forEach(clearTimeout);
            clearInterval(scrambleInterval);
            clearTimeout(endTimeout);
        };
    }, [onFinished]);

    return (
        <div 
            className={`splash-screen fixed inset-0 flex flex-col justify-center items-center z-[9999] p-4 ${isFading ? 'fade-out' : ''}`} 
            style={{ backgroundColor: 'var(--theme-bg-color)' }}
        >
            <div className="w-full max-w-3xl whitespace-pre-wrap" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }}>
                <p className="text-xl sm:text-2xl">{decryptionText}</p>
                {lines.slice(0, visibleLines).map((line, index) => (
                    <p key={index} className="text-xl sm:text-2xl">{line.text}</p>
                ))}
            </div>
        </div>
    );
};
