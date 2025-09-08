import React, { useState, useEffect, useRef } from 'react';

interface LoaderProps {
  log: string[];
}

const useScrambleText = (text: string) => {
    const [scrambledText, setScrambledText] = useState('');
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    const frameRef = useRef<number | null>(null);
    const frame = useRef(0);
    const queue = useRef<{from: string, to: string, start: number, end: number}[]>([]);
    
    useEffect(() => {
        let isMounted = true;
        const from = scrambledText;
        const to = text;
        const start = frame.current;
        const newQueue: {from: string, to: string, start: number, end: number}[] = [];

        for (let i = 0; i < Math.max(from.length, to.length); i++) {
            const fromChar = from[i] || '';
            const toChar = to[i] || '';
            if (fromChar !== toChar) {
                newQueue.push({ from: fromChar, to: toChar, start: start, end: start + Math.floor(Math.random() * 20) });
            } else {
                 newQueue.push({ from: fromChar, to: toChar, start: start, end: start });
            }
        }
        queue.current = newQueue;

        const animate = () => {
            if (!isMounted) return;
            let output = '';
            let complete = 0;
            for (let i = 0; i < queue.current.length; i++) {
                let { from, to, start, end } = queue.current[i];
                if (frame.current >= end) {
                    complete++;
                    output += to;
                } else if (frame.current >= start) {
                    output += chars[Math.floor(Math.random() * chars.length)];
                } else {
                    output += from;
                }
            }
            setScrambledText(output);
            if (complete !== queue.current.length) {
                frame.current++;
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frame.current = 0;
        frameRef.current = requestAnimationFrame(animate);

        return () => {
          isMounted = false;
          if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
          }
        };
    }, [text]);

    return scrambledText;
}

const ScrambledLine: React.FC<{ text: string }> = ({ text }) => {
    const scrambledText = useScrambleText(text);
    return <>{scrambledText}</>;
}

const hackingPhrases = [
  '[ DECRYPTING_VISUAL_DATA... ]',
  '[ ACCESSING_NEURAL_CORE... ]',
  '[ COMPILING_PHOTON_MATRIX... ]',
  '[ REROUTING_DATA_STREAM... ]',
  '[ CALIBRATING_ARTIST_BOT... ]',
  '[ INITIALIZING_DREAM_ENGINE... ]',
  '[ AUTHENTICATING_AI_SIGNATURE... ]',
];

export const Loader: React.FC<LoaderProps> = ({ log }) => {
  const lastLogLine = log[log.length - 1] || '';
  const [hackingText, setHackingText] = useState(hackingPhrases[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHackingText(hackingPhrases[Math.floor(Math.random() * hackingPhrases.length)]);
    }, 250);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center z-50 p-4 gap-8">
      <div className="text-center">
        <p className="text-3xl title-flicker" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }}>
          <ScrambledLine text={hackingText} />
        </p>
      </div>
      <div className="text-left w-full max-w-3xl bg-black/50 border p-6" style={{ borderColor: 'var(--theme-border-color-light)'}}>
        {log.slice(0, -1).map((line, index) => (
          <p key={index} className="text-lg" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }}>
            {line}
          </p>
        ))}
        {lastLogLine && (
           <p className="text-lg" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }}>
             <ScrambledLine text={lastLogLine} /> <span className="animate-ping">_</span>
           </p>
        )}
      </div>
    </div>
  );
};