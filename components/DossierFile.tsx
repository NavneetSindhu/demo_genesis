import React, { useState, useRef, useEffect } from 'react';
import type { Dossier } from '../types';
import { InlineTerminal } from './InlineTerminal';
import { generateSpeech } from '../services/elevenLabsService';

interface DossierFileProps {
    dossier: Dossier | 'generating';
    historyItemId: string;
    onGenerateOriginStory?: (historyItemId: string) => void;
}

const DossierField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <span className="font-bold" style={{ color: 'var(--theme-text-color)' }}>&gt; {label}:</span>
        <span className="ml-2" style={{ color: 'var(--theme-text-color-dim)' }}>{children}</span>
    </div>
);

const DossierListField: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
    <div>
        <span className="font-bold" style={{ color: 'var(--theme-text-color)' }}>&gt; {label}:</span>
        <ul className="ml-6 mt-1 space-y-1" style={{ color: 'var(--theme-text-color-dim)' }}>
            {items.map((item, index) => <li key={index}>- {item}</li>)}
        </ul>
    </div>
);


export const DossierFile: React.FC<DossierFileProps> = ({ dossier, historyItemId, onGenerateOriginStory }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Cleanup function to stop audio and revoke URL when component unmounts or dossier changes
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
                audioRef.current = null;
            }
        };
    }, [dossier]);

    const handlePlayAudio = async () => {
        if (typeof dossier !== 'object' || !dossier.originStory) return;

        if (audioRef.current) {
            if (audioState === 'playing') {
                audioRef.current.pause();
            } else if (audioState === 'paused') {
                audioRef.current.play();
            }
            return;
        }

        setAudioState('loading');
        setAudioError(null);
        try {
            const blobUrl = await generateSpeech(dossier.originStory);
            const audio = new Audio(blobUrl);
            audioRef.current = audio;
            
            audio.onplaying = () => setAudioState('playing');
            audio.onpause = () => setAudioState('paused');
            audio.onended = () => {
                setAudioState('idle');
                URL.revokeObjectURL(blobUrl);
                audioRef.current = null;
            };
            audio.onerror = () => {
                setAudioError("Playback error.");
                setAudioState('error');
                URL.revokeObjectURL(blobUrl);
            };
            audio.play();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
             if (errorMessage.includes('API key')) {
                setAudioError("ElevenLabs API key is missing or invalid.");
            } else {
                setAudioError(errorMessage);
            }
            setAudioState('error');
        }
    };

    if (dossier === 'generating') {
        return (
             <div className="p-4 bg-black/50 text-center mt-6" style={{ border: '1px dashed var(--theme-border-color-light)'}}>
                <p className="text-lg animate-pulse" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
                    [ RETRIEVING_DOSSIER_DATA... ]
                </p>
            </div>
        )
    }

    const handleCopy = () => {
        const dossierText = `
CALLSIGN: ${dossier.callsign}
BACKGROUND: ${dossier.background}

ABILITIES:
${dossier.abilities.map(a => `- ${a}`).join('\n')}

WEAKNESSES:
${dossier.weaknesses.map(w => `- ${w}`).join('\n')}

QUOTE: "${dossier.quote}"
${dossier.originStory && typeof dossier.originStory === 'string' ? `\nORIGIN STORY:\n${dossier.originStory}`: ''}
        `.trim();

        navigator.clipboard.writeText(dossierText).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        }).catch(err => {
            console.error('Failed to copy dossier text:', err);
        });
    };

    const isGeneratingStory = dossier.originStory === 'generating';

    const renderTTSButton = () => {
        let icon;
        let title = "Listen to origin story";
        switch (audioState) {
            case 'loading':
                title = "Loading audio...";
                icon = <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-text-color)' }}></div>;
                break;
            case 'playing':
                title = "Pause narration";
                icon = <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>;
                break;
            case 'paused':
                title = "Resume narration";
                 icon = <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5"><path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/></svg>;
                break;
            case 'error':
                 title = `Error: ${audioError}`;
                icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
                break;
            default:
                 icon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>;
                break;
        }
        return (
            <button
                onClick={handlePlayAudio}
                className="p-1 transition-colors"
                aria-label={title}
                title={title}
                style={{ color: 'var(--theme-text-color-dim)', '--hover-color': 'var(--theme-text-color)' } as React.CSSProperties}
                onMouseOver={e => e.currentTarget.style.color = 'var(--hover-color)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--theme-text-color-dim)'}
            >
                {icon}
            </button>
        );
    }

    return (
        <div className="p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color-light), transparent)' }}>
            <div className="bg-black p-4 text-flicker-subtle">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                    <h3 className="text-2xl" style={{ fontFamily: "'VT323', monospace" }}>[ DOSSIER_FILE: CLASSIFIED ]</h3>
                    <button
                        onClick={handleCopy}
                        className="text-lg py-1 px-3 border transition-colors whitespace-nowrap"
                        style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-color)' }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}
                    >
                        {copyStatus === 'copied' ? '[ COPIED! ]' : '[ COPY_DATA ]'}
                    </button>
                </div>
                <div className="space-y-3 font-mono text-base">
                    <DossierField label="CALLSIGN">{dossier.callsign}</DossierField>
                    <DossierField label="BACKGROUND">{dossier.background}</DossierField>
                    <DossierListField label="ABILITIES" items={dossier.abilities} />
                    <DossierListField label="WEAKNESSES" items={dossier.weaknesses} />
                    <DossierField label="QUOTE">"{dossier.quote}"</DossierField>
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border-color-xlight)' }}>
                    {dossier.originStory && typeof dossier.originStory === 'string' ? (
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold" style={{ color: 'var(--theme-text-color)' }}>&gt; ORIGIN_STORY:</h4>
                                <button
                                    onClick={() => onGenerateOriginStory?.(historyItemId)}
                                    className="p-1 transition-colors"
                                    aria-label="Regenerate origin story"
                                    title="Regenerate origin story"
                                    style={{ color: 'var(--theme-text-color-dim)', '--hover-color': 'var(--theme-text-color)' } as React.CSSProperties}
                                    onMouseOver={e => e.currentTarget.style.color = 'var(--hover-color)'}
                                    onMouseOut={e => e.currentTarget.style.color = 'var(--theme-text-color-dim)'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l4.992-4.993m-4.993 0l-3.181 3.183a8.25 8.25 0 000 11.664l3.181 3.183" /></svg>
                                </button>
                                {renderTTSButton()}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--theme-text-color-dim)' }}>
                                {dossier.originStory}
                            </p>
                        </div>
                    ) : isGeneratingStory ? (
                        <InlineTerminal />
                    ) : (
                        <button
                            onClick={() => onGenerateOriginStory?.(historyItemId)}
                            disabled={isGeneratingStory}
                            className="w-full text-lg py-2 px-4 border transition-colors whitespace-nowrap disabled:opacity-50"
                            style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-color)' }}
                            onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                            onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                        >
                            [ GENERATE_ORIGIN_STORY ]
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
