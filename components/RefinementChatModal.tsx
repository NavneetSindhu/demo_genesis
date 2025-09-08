import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedImage } from '../types';
import { refineCharacterImage } from '../services/geminiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  imageB64?: string; // "After" image
  beforeImageB64?: string; // "Before" image
}

interface RefinementChatModalProps {
    image: GeneratedImage | null;
    onClose: () => void;
    onComplete: (imageId: string, newHistory: string[]) => void;
    onImagePreview: (b64: string) => void;
}

const ImageComparator: React.FC<{ beforeSrc: string; afterSrc: string }> = ({ beforeSrc, afterSrc }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
    };
    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
        const handleTouchMove = (e: TouchEvent) => isDragging && e.touches[0] && handleMove(e.touches[0].clientX);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            ref={containerRef} 
            className="image-comparator w-full aspect-[4/3]" 
            onMouseDown={handleMouseDown} 
            onTouchStart={handleTouchStart}
        >
            <img src={beforeSrc} alt="Before" className="before-image" />
            <img src={afterSrc} alt="After" className="after-image" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }} />
            <div className="comparator-slider" style={{ left: `${sliderPos}%` }}>
                <div className="comparator-handle"></div>
            </div>
            <div className="comparator-label label-before">[ BEFORE ]</div>
            <div className="comparator-label label-after">[ AFTER ]</div>
        </div>
    );
};

const ChatBubble: React.FC<{ message: ChatMessage, onDownload: (b64: string) => void, onPreview: (b64: string) => void }> = ({ message, onDownload, onPreview }) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isError = message.text.startsWith('[ERROR]');
    
    if (isSystem) {
        return (
            <div className="w-full text-center text-xs py-2" style={{ color: 'var(--theme-text-color-dim)'}}>
                <p>{message.text}</p>
            </div>
        )
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div 
                className={`max-w-xs lg:max-w-sm rounded-lg px-3 py-2 my-1 flex flex-col`}
                style={{
                    backgroundColor: isUser ? 'var(--theme-interactive-bg-hover)' : 'rgba(0,0,0,0.2)',
                    color: isError ? '#ff4d4d' : 'var(--theme-text-color-dim)',
                    border: '1px solid',
                    borderColor: isUser ? 'var(--theme-border-color-light)' : 'var(--theme-border-color-xlight)'
                }}
            >
                <p className="text-sm">{message.text}</p>
                 {message.imageB64 && message.beforeImageB64 ? (
                    <div className="mt-2 flex flex-col gap-2">
                        <ImageComparator
                            beforeSrc={`data:image/png;base64,${message.beforeImageB64}`}
                            afterSrc={`data:image/png;base64,${message.imageB64}`}
                        />
                        <div className="flex gap-2">
                             <button onClick={() => onPreview(message.imageB64!)} className="flex-1 text-xs py-1 px-2 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                [ PREVIEW_AFTER ]
                            </button>
                             <button onClick={() => onDownload(message.imageB64!)} className="flex-1 text-xs py-1 px-2 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                [ DOWNLOAD_AFTER ]
                            </button>
                        </div>
                    </div>
                ) : message.imageB64 && (
                     <div className="mt-2 flex flex-col gap-2">
                        <img src={`data:image/png;base64,${message.imageB64}`} alt="Refinement result" className="rounded-md" />
                        <div className="flex gap-2">
                             <button onClick={() => onPreview(message.imageB64!)} className="flex-1 text-xs py-1 px-2 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                [ PREVIEW ]
                            </button>
                             <button onClick={() => onDownload(message.imageB64!)} className="flex-1 text-xs py-1 px-2 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                [ DOWNLOAD ]
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export const RefinementChatModal: React.FC<RefinementChatModalProps> = ({ image, onClose, onComplete, onImagePreview }) => {
    const [localHistory, setLocalHistory] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const filmstripRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (image) {
            const history = image.b64History;
            setLocalHistory(history);
            setSelectedIndex(history.length - 1);
            setChatHistory([{
                id: 'init-0',
                role: 'system',
                text: 'Refinement session started. Select a version from the filmstrip below or describe your changes for the current image.'
            }]);
        } else {
            // Reset state when modal is closed
            setLocalHistory([]);
            setSelectedIndex(0);
            setChatHistory([]);
            setUserInput('');
            setIsLoading(false);
        }
    }, [image]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);

    useEffect(() => {
        if (filmstripRef.current?.children[selectedIndex]) {
            filmstripRef.current.children[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [selectedIndex]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !image) return;

        const textToSend = userInput;
        const baseImageForRefinement = localHistory[selectedIndex];
        
        setChatHistory(prev => [...prev, { id: `msg-${Date.now()}`, role: 'user', text: textToSend }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const newImageB64 = await refineCharacterImage(baseImageForRefinement, textToSend, image);
            const newHistoryBranch = [...localHistory.slice(0, selectedIndex + 1), newImageB64];
            
            setLocalHistory(newHistoryBranch);
            setSelectedIndex(newHistoryBranch.length - 1);
            setChatHistory(prev => [...prev, {
                id: `msg-${Date.now()}-ai`,
                role: 'ai',
                text: `Applied change: "${textToSend}"`,
                imageB64: newImageB64,
                beforeImageB64: baseImageForRefinement
            }]);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setChatHistory(prev => [...prev, {
                id: `msg-${Date.now()}-ai-error`,
                role: 'ai',
                text: `[ERROR] ${errorMessage}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFilmstripClick = (index: number) => {
        setSelectedIndex(index);
        setChatHistory(prev => [...prev, {
            id: `sys-${Date.now()}`,
            role: 'system',
            text: `Context switched to version ${index + 1}.`
        }]);
    };
    
    const handleDownload = (b64: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${b64}`;
        link.download = `refined-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveAndClose = () => {
        if (image) {
            onComplete(image.id, localHistory);
        }
    };
    
    if (!image) return null;
    
    const currentPreviewB64 = localHistory[selectedIndex];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-7xl h-[90vh] bg-black p-6 sm:p-8 relative flex flex-col gap-4" style={{ border: '2px solid var(--theme-border-color)' }} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 className="text-4xl" style={{ fontFamily: "'VT323', monospace" }}>[ REFINE_CHARACTER ]</h2>
                     <button onClick={onClose} className="text-3xl transition-colors z-10" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'var(--theme-color)'}>[ X ]</button>
                </div>
                
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
                    <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
                        <div className="flex-grow flex items-center justify-center bg-black/50 p-4 min-h-0" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                           {currentPreviewB64 ? (
                             <img 
                                src={`data:image/png;base64,${currentPreviewB64}`} 
                                alt="Currently selected version for refinement" 
                                className="max-w-full max-h-full object-contain"
                                style={{ boxShadow: '0 0 25px -5px var(--theme-color)' }}
                            />
                           ) : <p>Loading preview...</p>}
                        </div>
                        <div className="flex-shrink-0 bg-black/50 p-2" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                             <h3 className="text-lg mb-2 text-center" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>[ VERSION_HISTORY ]</h3>
                             <div ref={filmstripRef} className="flex gap-2 overflow-x-auto p-2">
                                {localHistory.map((b64, index) => (
                                    <div key={index} className="relative group/filmstrip-item flex-shrink-0 w-24 h-24">
                                        <button 
                                            onClick={() => handleFilmstripClick(index)}
                                            className={`w-full h-full p-1 bg-black/50 transition-all duration-200 outline-none focus:ring-2`}
                                            style={{'--tw-ring-color': 'var(--theme-color)', outlineColor: selectedIndex === index ? 'var(--theme-color)' : 'transparent', outlineWidth: '2px', outlineStyle: 'solid' } as React.CSSProperties}
                                        >
                                            <img src={`data:image/png;base64,${b64}`} alt={`Version ${index+1}`} className="w-full h-full object-cover"/>
                                        </button>
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/filmstrip-item:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center p-1 flex-col gap-1">
                                            <button onClick={() => onImagePreview(b64)} className="text-xs py-1 px-2 border transition-colors w-full" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                [ PREVIEW ]
                                            </button>
                                            <button onClick={() => handleDownload(b64)} className="text-xs py-1 px-2 border transition-colors w-full" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                [ DOWNLOAD ]
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-3 h-full flex flex-col bg-black/50 p-4 min-h-0" style={{ border: '1px solid var(--theme-border-color-xlight)' }}>
                        <h3 className="text-2xl mb-4 flex-shrink-0" style={{ fontFamily: "'VT323', monospace" }}>[ EDIT_LOG ]</h3>
                        <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-1">
                           {chatHistory.map(msg => <ChatBubble key={msg.id} message={msg} onDownload={handleDownload} onPreview={onImagePreview}/>)}
                           {isLoading && <p className="text-center text-sm p-2" style={{ color: 'var(--theme-text-color-dim)' }}>Processing...</p>}
                           <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="mt-4 flex-shrink-0 flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                disabled={isLoading}
                                className="flex-grow p-3 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base"
                                style={{ borderColor: 'var(--theme-border-color)', '--tw-ring-color': 'var(--theme-color)', color: 'var(--theme-text-color)' } as React.CSSProperties}
                                placeholder="Describe your changes..."
                            />
                            <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 border transition-all disabled:opacity-50 flex items-center gap-2" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}>
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                               </svg>
                               <span className="hidden sm:inline">[ SEND ]</span>
                            </button>
                        </form>
                    </div>
                </div>
                 <div className="flex justify-end mt-4 flex-shrink-0">
                    <button onClick={handleSaveAndClose} className="text-xl py-3 px-6 border-2 transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                        [ SAVE_&_CLOSE ]
                    </button>
                 </div>
            </div>
        </div>
    );
};