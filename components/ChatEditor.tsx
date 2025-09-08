import React, { useState, useRef, useEffect } from 'react';
import { conversationalEditImage } from '../services/geminiService';
import type { UploadedImage, ChatMessage } from '../types';

interface ChatEditorProps {
  onImagePreview: (b64: string) => void;
  baseImage: UploadedImage | null;
  chatHistory: ChatMessage[];
  onBaseImageChange: (image: UploadedImage | null) => void;
  onChatHistoryChange: (history: ChatMessage[]) => void;
}

// Sub-component for displaying a single message
const Message: React.FC<{ 
    message: ChatMessage; 
    onDownload: (b64: string) => void; 
    onImagePreview: (b64: string) => void;
    onEdit: (messageId: string, newText: string) => void;
    onActionClick: (action: string) => void;
}> = ({ message, onDownload, onImagePreview, onEdit, onActionClick }) => {
    const isUser = message.role === 'user';
    const isError = message.text.startsWith('[ERROR]');

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [isEditing]);

    const handleSaveEdit = () => {
        if (editText.trim() && editText !== message.text) {
            onEdit(message.id, editText);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(message.text);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <div className={`flex group/message ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div 
                className={`max-w-xs lg:max-w-sm rounded-lg px-4 py-2 my-1 flex flex-col relative`}
                style={{
                    backgroundColor: isUser ? 'var(--theme-interactive-bg-hover)' : 'rgba(0,0,0,0.2)',
                    color: isError ? '#ff4d4d' : 'var(--theme-text-color-dim)',
                    border: '1px solid',
                    borderColor: isUser ? 'var(--theme-border-color-light)' : 'var(--theme-border-color-xlight)'
                }}
            >
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                         <textarea
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={3}
                            className="w-full p-2 bg-black border-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base resize-none"
                             style={{
                                borderColor: 'var(--theme-color)',
                                '--tw-ring-color': 'var(--theme-color)',
                                color: 'var(--theme-text-color)',
                            } as React.CSSProperties}
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={handleCancelEdit} 
                                className="py-2 px-4 border transition-colors text-lg" 
                                style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                [ CANCEL ]
                            </button>
                            <button 
                                onClick={handleSaveEdit} 
                                className="py-2 px-4 border transition-colors text-lg" 
                                style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)'}}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}
                            >
                                [ SAVE ]
                            </button>
                        </div>
                    </div>
                ) : (
                    <p>{message.text}</p>
                )}

                {message.actions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.actions.map(action => (
                            <button
                                key={action}
                                onClick={() => onActionClick(action)}
                                className="text-sm py-1 px-2 border transition-colors"
                                style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)'}}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                {message.imageB64 && (
                    <div className="relative mt-2 group/image-bubble">
                        <button 
                          onClick={() => onImagePreview(message.imageB64!)}
                          className="w-full appearance-none p-0 border-0 bg-transparent cursor-pointer block text-left transition-transform duration-200 hover:scale-[1.02]"
                          aria-label="Enlarge image"
                        >
                          <img 
                              src={`data:image/png;base64,${message.imageB64}`} 
                              alt="AI generated edit" 
                              className="rounded-md w-full"
                          />
                        </button>
                        <button 
                            onClick={() => onDownload(message.imageB64!)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover/image-bubble:opacity-100 transition-opacity"
                            aria-label="Download image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
                    </div>
                )}
                {isUser && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 opacity-0 group-hover/message:opacity-100 transition-opacity"
                        aria-label="Edit message"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                         </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const quickActions = [
    "Crop the image to a 1:1 square",
    "Increase the brightness and contrast",
    "Make the background blurry",
    "Convert to black and white",
];

export const ChatEditor: React.FC<ChatEditorProps> = ({ onImagePreview, baseImage, chatHistory, onBaseImageChange, onChatHistoryChange }) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollTopText, setScrollTopText] = useState('[ JUMP_TO_ORIGIN ]');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);
  
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
        const isScrolledUp = container.scrollTop > 50;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        setShowScrollTop(isScrolledUp && !isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!showScrollTop) return;
    const phrases = ['[ JUMP_TO_ORIGIN ]', '[ REWIND_LOG... ]', '[ ACCESSING_START ]', '[ DECRYPTING... ]', '[ SCROLL_TO_TOP ]', '[ RETURN_TO_ZERO ]'];
    const interval = setInterval(() => {
        setScrollTopText(phrases[Math.floor(Math.random() * phrases.length)]);
    }, 300);
    return () => clearInterval(interval);
  }, [showScrollTop]);

  const handleScrollToTop = () => {
    chatContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = (b64: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${b64}`;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const b64 = result.split(',')[1];
            const uploadedImage = { b64, mimeType: file.type };
            onBaseImageChange(uploadedImage);
            onChatHistoryChange([{ 
                id: 'init-0', 
                role: 'ai', 
                text: 'Image loaded. How would you like to edit it?',
                actions: quickActions
            }]);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const submitPrompt = async (prompt: string, imageContext: string) => {
    if (!baseImage) return;
    setIsLoading(true);
    try {
        const newImageB64 = await conversationalEditImage(imageContext, prompt, baseImage.mimeType);
        onChatHistoryChange([...chatHistory, { id: `msg-${Date.now()}-ai`, role: 'ai', text: `Here's the result for: "${prompt}"`, imageB64: newImageB64 }]);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        onChatHistoryChange([...chatHistory, { id: `msg-${Date.now()}-ai`, role: 'ai', text: `[ERROR] ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  const getLastAiImageB64 = () => {
    const lastAiMsgWithImage = [...chatHistory].reverse().find(m => m.role === 'ai' && m.imageB64);
    return lastAiMsgWithImage?.imageB64 || baseImage?.b64;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const imageContext = getLastAiImageB64();
    if (!userInput.trim() || !imageContext) return;
    
    const textToSend = userInput;
    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      inputImageB64: imageContext,
    };

    onChatHistoryChange([...chatHistory, newUserMessage]);
    setUserInput('');
    submitPrompt(textToSend, imageContext);
  };

  const handleQuickActionClick = (prompt: string) => {
    const imageContext = getLastAiImageB64();
    if (!imageContext) return;

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: prompt,
      inputImageB64: imageContext,
    };
    onChatHistoryChange([...chatHistory, newUserMessage]);
    submitPrompt(prompt, imageContext);
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
      const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1 || chatHistory[messageIndex].role !== 'user') return;
      
      const originalMessage = chatHistory[messageIndex];
      const contextImageB64 = originalMessage.inputImageB64;
      if (!contextImageB64) return;

      const truncatedHistory = chatHistory.slice(0, messageIndex);
      const editedUserMessage: ChatMessage = { ...originalMessage, text: newText };
      
      onChatHistoryChange([...truncatedHistory, editedUserMessage]);
      
      await submitPrompt(newText, contextImageB64);
  };

  const startOver = () => {
    onBaseImageChange(null);
    onChatHistoryChange([]);
  };

  return (
    <div className="p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color-light), var(--theme-interactive-bg-hover))' }}>
      <div className="bg-black p-6 sm:p-8">
        {!baseImage ? (
            <div className="flex flex-col items-center justify-center h-96">
                 <h2 className="text-3xl sm:text-4xl mb-6 text-center" style={{ fontFamily: "'VT323', monospace" }}>[ CONVERSATIONAL_IMAGE_EDITOR ]</h2>
                 <p className="mb-8 text-center" style={{ color: 'var(--theme-text-color-dim)' }}>Upload an image to begin an interactive editing session with the AI.</p>
                 <label htmlFor="chat-image-upload" className="cursor-pointer py-3 px-6 text-xl border-2 transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                    [ UPLOAD_IMAGE ]
                    <input id="chat-image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                </label>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:h-[75vh]">
                <div className="lg:col-span-2 h-full flex flex-col items-center justify-center bg-black/50 p-4 relative min-h-0" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                    <img 
                        src={`data:${baseImage.mimeType};base64,${baseImage.b64}`} 
                        alt="Original uploaded image"
                        className="max-w-full max-h-full object-contain"
                        style={{ boxShadow: '0 0 25px -5px var(--theme-color)' }}
                    />
                     <button onClick={startOver} className="absolute top-2 right-2 text-lg py-1 px-3 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                        [ START_OVER ]
                    </button>
                </div>
                <div className="lg:col-span-3 h-full flex flex-col bg-black/50 p-4" style={{ border: '1px solid var(--theme-border-color-xlight)' }}>
                    <h3 className="text-2xl mb-4 flex-shrink-0" style={{ fontFamily: "'VT323', monospace" }}>[ EDIT_LOG ]</h3>
                    <div className="relative flex-grow min-h-0">
                      <div ref={chatContainerRef} className="absolute inset-0 overflow-y-auto pr-2 space-y-2">
                         {chatHistory.map((msg) => <Message key={msg.id} message={msg} onDownload={handleDownload} onImagePreview={onImagePreview} onEdit={handleEditMessage} onActionClick={handleQuickActionClick} />)}
                         {isLoading && <Message message={{id: 'loading', role: 'ai', text: 'Processing...'}} onDownload={() => {}} onImagePreview={() => {}} onEdit={() => {}} onActionClick={() => {}} />}
                         <div ref={chatEndRef} />
                      </div>
                      {showScrollTop && (
                           <button
                              onClick={handleScrollToTop}
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 py-2 px-4 border transition-all text-lg bg-black/80 backdrop-blur-sm z-10"
                              style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-text-color)' }}
                           >
                              {scrollTopText}
                           </button>
                      )}
                    </div>
                    
                    <form onSubmit={handleSendMessage} className="mt-4 flex-shrink-0 flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-grow p-3 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base disabled:opacity-50"
                            style={{
                                borderColor: 'var(--theme-border-color)',
                                '--tw-ring-color': 'var(--theme-color)',
                                color: 'var(--theme-text-color)',
                            } as React.CSSProperties}
                            placeholder="Type your edit here..."
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !userInput.trim()} 
                            className="py-3 px-4 border transition-all disabled:opacity-50" 
                            style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}
                            onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                            onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                           </svg>
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};