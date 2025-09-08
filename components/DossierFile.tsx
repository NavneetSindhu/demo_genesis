import React, { useState, useRef, useEffect } from 'react';
import type { Dossier } from '../types';
import { InlineTerminal } from './InlineTerminal';
import { AudioPlayer } from './AudioPlayer';
import { generateSpeech, VOICE_MAP } from '../services/elevenLabsService';
import { generateVoiceSelection } from '../services/geminiService';

interface DossierFileProps {
    dossier: Dossier | 'generating';
    historyItemId: string;
    onGenerateOriginStory?: (historyItemId: string) => void;
    onSetCharacterVoice?: (historyItemId: string, voiceArchetype: string, voiceId: string) => void;
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


export const DossierFile: React.FC<DossierFileProps> = ({ dossier, historyItemId, onGenerateOriginStory, onSetCharacterVoice }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [audioState, setAudioState] = useState<'idle' | 'loading' | 'determining_voice' | 'playing' | 'paused' | 'error'>('idle');
    const [audioError, setAudioError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioRef.current.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioRef.current.src);
                }
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
             if (audioRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(audioRef.current.src);
            }
        }
        audioRef.current = null;
        setAudioState('idle');
        setAudioError(null);
        setCurrentTime(0);
        setDuration(0);
    }, [dossier, historyItemId]);

    const handlePlayPause = async () => {
        if (typeof dossier !== 'object' || !dossier.originStory || dossier.originStory === 'generating') return;

        if (audioRef.current) {
            if (audioState === 'playing') {
                audioRef.current.pause();
            } else if (audioState === 'paused' || audioState === 'idle') {
                audioRef.current.play();
            }
            return;
        }

        setAudioError(null);
        let voiceToUse = dossier.voiceId;

        try {
            if (!voiceToUse) {
                setAudioState('determining_voice');
                const availableArchetypes = Object.keys(VOICE_MAP);
                const chosenArchetype = await generateVoiceSelection(dossier, availableArchetypes);
                voiceToUse = VOICE_MAP[chosenArchetype];
                
                if (!voiceToUse) throw new Error(`Could not find a voice ID for archetype: ${chosenArchetype}`);
                
                onSetCharacterVoice?.(historyItemId, chosenArchetype, voiceToUse);
            }

            setAudioState('loading');
            const blobUrl = await generateSpeech(dossier.originStory, voiceToUse);
            const audio = new Audio(blobUrl);
            audioRef.current = audio;
            
            audio.onloadedmetadata = () => setDuration(audio.duration);
            audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
            audio.onplaying = () => setAudioState('playing');
            audio.onpause = () => setAudioState('paused');
            audio.onended = () => {
                setAudioState('idle');
                setCurrentTime(0);
            };
            audio.onerror = () => {
                setAudioError("Playback error.");
                setAudioState('error');
                if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
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
    
    const handleSeek = (newTime: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    
    const handleRegenerate = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(audioRef.current.src);
            }
        }
        audioRef.current = null;
        setAudioState('idle');
        setAudioError(null);
        setCurrentTime(0);
        setDuration(0);
        onGenerateOriginStory?.(historyItemId);
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

    const getListenButtonText = () => {
        switch (audioState) {
            case 'determining_voice': return '[VOICE...]';
            case 'loading': return '[LOADING...]';
            case 'error': return '[ERROR]';
            case 'playing': return '[PAUSE]';
            case 'paused': return '[PLAY]';
            default: return '[LISTEN]';
        }
    };

    return (
        <div className="p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color-light), transparent)' }}>
            <div className="bg-black p-4 text-flicker-subtle">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                    <h3 className="text-xl sm:text-2xl" style={{ fontFamily: "'VT323', monospace" }}>[ DOSSIER_FILE: CLASSIFIED ]</h3>
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
                    {dossier.voiceArchetype && (
                         <DossierField label="VOICE_PROFILE">{dossier.voiceArchetype}</DossierField>
                    )}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--theme-border-color-xlight)' }}>
                    {dossier.originStory && typeof dossier.originStory === 'string' ? (
                        <div>
                            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                <h4 className="font-bold" style={{ color: 'var(--theme-text-color)' }}>&gt; ORIGIN_STORY:</h4>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleRegenerate}
                                        className="text-lg py-1 px-3 border transition-colors whitespace-nowrap"
                                        style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)' }}
                                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)'; }}
                                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--theme-border-color-light)'; }}
                                    >
                                        [ REGENERATE ]
                                    </button>
                                    { duration <= 0 && (
                                        <button
                                            onClick={handlePlayPause}
                                            disabled={audioState === 'loading' || audioState === 'determining_voice'}
                                            className="text-lg py-1 px-3 border transition-colors whitespace-nowrap disabled:opacity-50"
                                            style={{ fontFamily: "'VT323', monospace", borderColor: audioState === 'error' ? '#ff4d4d' : 'var(--theme-border-color)', color: audioState === 'error' ? '#ff4d4d' : 'var(--theme-color)' }}
                                            onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                                            onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                                        >
                                            {getListenButtonText()}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="whitespace-pre-wrap" style={{ color: 'var(--theme-text-color-dim)' }}>
                                {dossier.originStory}
                            </p>
                           {duration > 0 ? (
                                <AudioPlayer
                                    isPlaying={audioState === 'playing'}
                                    duration={duration}
                                    currentTime={currentTime}
                                    onPlayPause={handlePlayPause}
                                    onSeek={handleSeek}
                                    isDisabled={audioState === 'loading' || audioState === 'determining_voice'}
                                />
                            ) : null}
                            {audioState === 'error' && audioError && (
                                <p className="mt-2 text-sm" style={{ color: '#ff4d4d' }}>Audio Error: {audioError}</p>
                            )}
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