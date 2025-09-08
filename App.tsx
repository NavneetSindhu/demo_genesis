import React, { useState, useCallback, useLayoutEffect, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { InputForm } from './components/InputForm';
import { Header } from './components/Header';
import { AnimatedCursor } from './components/AnimatedCursor';
import { AnimatedBackground } from './components/AnimatedBackground';
import { SplashScreen } from './components/SplashScreen';
import { GenerationBlock } from './components/GenerationBlock';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ChatEditor } from './components/ChatEditor';
import { RefinementChatModal } from './components/RefinementChatModal';
import { generateCharacterImage, generateCharacterDossier, generateOriginStory, generateFoilCharacter, updateUserApiKey } from './services/geminiService';
import { updateUserElevenLabsApiKey } from './services/elevenLabsService';
import type { ArtStyle, GeneratedImage, UploadedImage, HistoryItem, ChatMessage, Dossier } from './types';

const DEMO_HISTORY_ITEM: HistoryItem = {
  id: 'demo-0',
  prompt: {
    title: 'GENERATION_PREVIEW',
    characterDesc: 'Your generated character\'s core description will be displayed here once generated.',
    scene: 'The scene, outfit, or action you describe will be shown here.',
    artStyle: 'Anime',
    referenceImage: undefined,
  },
  images: [
    {
      id: 'demo-img-1',
      b64History: ['placeholder'],
      characterDesc: '',
      scene: '',
      artStyle: 'Anime',
    },
    {
      id: 'demo-img-2',
      b64History: ['placeholder'],
      characterDesc: '',
      scene: '',
      artStyle: 'Anime',
    }
  ],
  timestamp: Date.now(),
  status: 'complete',
};


const App: React.FC = () => {
  const [view, setView] = useState<'generator' | 'editor'>('generator');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [variationsLoadingId, setVariationsLoadingId] = useState<string | null>(null);
  const [foilLoadingId, setFoilLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [generationHistory, setGenerationHistory] = useState<HistoryItem[]>([]);
  const [previewData, setPreviewData] = useState<{ image: GeneratedImage, timestamp: number } | null>(null);
  const [refiningImage, setRefiningImage] = useState<GeneratedImage | null>(null);
  
  // State for persistent Chat Editor
  const [chatBaseImage, setChatBaseImage] = useState<UploadedImage | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // State for user-provided API Keys
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string | null>(null);


  const mainContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Load user API keys from local storage
  useEffect(() => {
    try {
      const storedGeminiKey = localStorage.getItem('user-gemini-api-key');
      if (storedGeminiKey) {
        setUserApiKey(storedGeminiKey);
      }
       const storedElevenLabsKey = localStorage.getItem('user-elevenlabs-api-key');
       if (storedElevenLabsKey) {
           setElevenLabsApiKey(storedElevenLabsKey);
       }
    } catch (e) {
      console.error("Could not read API key(s) from localStorage:", e);
    }
  }, []);

  // Load generator history from session storage
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem('character-gen-history');
      if (savedHistory) {
        const loadedHistory: HistoryItem[] = JSON.parse(savedHistory);
        
        // Sanitize history to remove any 'generating' states from a page refresh
        const sanitizedHistory = loadedHistory
          .filter(item => item.status !== 'generating') // Remove items that were mid-generation
          .map(item => {
            const newItem = { ...item };
            if (newItem.dossier === 'generating') {
              newItem.dossier = undefined;
            }
            if (typeof newItem.dossier === 'object' && newItem.dossier.originStory === 'generating') {
               const { originStory, ...restDossier } = newItem.dossier;
               newItem.dossier = restDossier as Dossier;
            }
            return newItem;
          });

        setGenerationHistory(sanitizedHistory);
      }
    } catch (e) {
      console.error("Failed to load history from session storage:", e);
    }
  }, []);

  // Save generator history to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('character-gen-history', JSON.stringify(generationHistory));
    } catch (e) {
      console.error("Failed to save history to session storage:", e);
    }
  }, [generationHistory]);

  // Load chat session from session storage
  useEffect(() => {
    try {
        const savedChatImage = sessionStorage.getItem('chat-base-image');
        const savedChatHistory = sessionStorage.getItem('chat-history');
        if (savedChatImage) {
            setChatBaseImage(JSON.parse(savedChatImage));
        }
        if (savedChatHistory) {
            setChatHistory(JSON.parse(savedChatHistory));
        }
    } catch (e) {
        console.error("Failed to load chat session from storage:", e);
    }
  }, []);

  // Save chat session to session storage
  useEffect(() => {
      try {
          if (chatBaseImage) {
              sessionStorage.setItem('chat-base-image', JSON.stringify(chatBaseImage));
          } else {
              sessionStorage.removeItem('chat-base-image');
          }
          if (chatHistory.length > 0) {
              sessionStorage.setItem('chat-history', JSON.stringify(chatHistory));
          } else {
              sessionStorage.removeItem('chat-history');
          }
      } catch (e) {
          console.error("Failed to save chat session to storage:", e);
      }
  }, [chatBaseImage, chatHistory]);


  useLayoutEffect(() => {
    if (showSplash || !mainContainerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".header-anim", {
        duration: 1,
        opacity: 0,
        y: -30,
        ease: "power3.out",
        delay: 0.2
      }).from(".form-anim", {
        duration: 1,
        opacity: 0,
        filter: 'blur(10px)',
        ease: "power3.out",
      }, "-=0.7");
    }, mainContainerRef);
    return () => ctx.revert();
  }, [showSplash]);

  const handleSetApiKey = (key: string) => {
    setUserApiKey(key);
    updateUserApiKey(key);
  };

  const handleClearApiKey = () => {
    setUserApiKey(null);
    updateUserApiKey(null);
  };
  
  const handleSetElevenLabsApiKey = (key: string) => {
    setElevenLabsApiKey(key);
    updateUserElevenLabsApiKey(key);
  };

  const handleClearElevenLabsApiKey = () => {
    setElevenLabsApiKey(null);
    updateUserElevenLabsApiKey(null);
  };


  const handleGenerate = useCallback(async (characterDesc: string, scene: string, artStyle: ArtStyle, referenceImage?: UploadedImage | null, generateDossier?: boolean) => {
    setError(null);

    const newHistoryItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        status: 'generating',
        prompt: { characterDesc, scene, artStyle, referenceImage },
        images: [],
        timestamp: Date.now()
    };
    setGenerationHistory(prev => [newHistoryItem, ...prev]);

    try {
      const imageB64s = await generateCharacterImage(characterDesc, scene, artStyle, referenceImage ?? undefined);
      
      const newImages: GeneratedImage[] = imageB64s.map((b64, index) => ({
        id: `${Date.now()}-${index}`,
        b64History: [b64],
        characterDesc,
        scene,
        artStyle,
        referenceImage,
        source: 'generator',
      }));
      
      setGenerationHistory(prev => prev.map(item =>
        item.id === newHistoryItem.id
          ? { ...item, status: 'complete', images: newImages, dossier: generateDossier ? 'generating' : undefined }
          : item
      ));

      if (generateDossier) {
        try {
            const dossierData = await generateCharacterDossier(characterDesc, artStyle);
            setGenerationHistory(prev => prev.map(item =>
                item.id === newHistoryItem.id
                    ? { ...item, dossier: dossierData }
                    : item
            ));
        } catch (dossierErr) {
            console.error("Error generating dossier:", dossierErr);
            setGenerationHistory(prev => prev.map(item =>
                item.id === newHistoryItem.id
                    ? { ...item, dossier: undefined } 
                    : item
            ));
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error during generation:", errorMessage);
      setError(errorMessage);
      setGenerationHistory(prev => prev.filter(item => item.id !== newHistoryItem.id));
    }
  }, []);

  const handleGenerateVariations = async (historyItemId: string) => {
    const historyItem = generationHistory.find(item => item.id === historyItemId);
    if (!historyItem) return;

    setVariationsLoadingId(historyItemId);
    setError(null);

    const { characterDesc, scene, artStyle, referenceImage } = historyItem.prompt;

    try {
        const imageB64s = await generateCharacterImage(characterDesc, scene, artStyle, referenceImage ?? undefined);
      
        const newImages: GeneratedImage[] = imageB64s.map((b64, index) => ({
            id: `${Date.now()}-${index}`,
            b64History: [b64],
            characterDesc,
            scene,
            artStyle,
            referenceImage,
            source: 'generator',
        }));

        setGenerationHistory(prev => 
            prev.map(item => 
                item.id === historyItemId 
                    ? { ...item, images: [...item.images, ...newImages] } 
                    : item
            )
        );
        
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Error during variation generation:", errorMessage);
        setError(errorMessage);
    } finally {
       setVariationsLoadingId(null);
    }
};

  const handleGenerateFoil = async (originalHistoryItemId: string) => {
    const originalItem = generationHistory.find(item => item.id === originalHistoryItemId);
    if (!originalItem || !originalItem.dossier || originalItem.dossier === 'generating') {
      setError("Cannot generate a foil character without a complete dossier on the original.");
      return;
    }

    setError(null);
    setFoilLoadingId(originalHistoryItemId);

    const newFoilItem: HistoryItem = {
      id: `hist-foil-${Date.now()}`,
      status: 'generating',
      prompt: {
        title: `FOIL: ${originalItem.prompt.title || originalItem.prompt.scene}`,
        characterDesc: 'Generating foil character concept...',
        scene: 'Compiling narrative connections...',
        artStyle: originalItem.prompt.artStyle,
      },
      images: [],
      timestamp: Date.now(),
      dossier: 'generating',
    };
    setGenerationHistory(prev => [newFoilItem, ...prev]);

    try {
      const foilData = await generateFoilCharacter(originalItem);

      setGenerationHistory(prev => prev.map(item =>
        item.id === newFoilItem.id
          ? { ...item, prompt: { ...item.prompt, characterDesc: foilData.characterDesc, scene: foilData.scene }, dossier: foilData.dossier }
          : item
      ));

      const imageB64s = await generateCharacterImage(foilData.characterDesc, foilData.scene, originalItem.prompt.artStyle);

      const newImages: GeneratedImage[] = imageB64s.map((b64, index) => ({
        id: `${Date.now()}-${index}`,
        b64History: [b64],
        characterDesc: foilData.characterDesc,
        scene: foilData.scene,
        artStyle: originalItem.prompt.artStyle,
        source: 'generator',
      }));

      setGenerationHistory(prev => prev.map(item =>
        item.id === newFoilItem.id
          ? { ...item, status: 'complete', images: newImages }
          : item
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Error generating foil:", errorMessage);
      setError(`Failed to generate foil: ${errorMessage}`);
      setGenerationHistory(prev => prev.filter(item => item.id !== newFoilItem.id));
    } finally {
      setFoilLoadingId(null);
    }
  };

  const handleGenerateOriginStory = async (historyItemId: string) => {
    const itemIndex = generationHistory.findIndex(item => item.id === historyItemId);
    if (itemIndex === -1) return;

    const item = generationHistory[itemIndex];
    if (!item.dossier || item.dossier === 'generating' || (item.dossier as Dossier).originStory === 'generating') return;
    
    setGenerationHistory(prev => prev.map((h, i) => {
        if (i === itemIndex) {
            return { ...h, dossier: { ...(h.dossier as Dossier), originStory: 'generating' }};
        }
        return h;
    }));

    try {
        const story = await generateOriginStory(item.prompt.characterDesc, item.dossier as Dossier);
         setGenerationHistory(prev => prev.map((h, i) => {
            if (i === itemIndex) {
                return { ...h, dossier: { ...(h.dossier as Dossier), originStory: story }};
            }
            return h;
        }));
    } catch (err) {
        console.error("Error generating origin story:", err);
         setGenerationHistory(prev => prev.map((h, i) => {
            if (i === itemIndex) {
                const { originStory, ...restDossier } = (h.dossier as Dossier);
                return { ...h, dossier: restDossier };
            }
            return h;
        }));
    }
  };

  const handleSetCharacterVoice = (historyItemId: string, voiceArchetype: string, voiceId: string) => {
    setGenerationHistory(prev => prev.map(item => {
        if (item.id === historyItemId && typeof item.dossier === 'object') {
            return {
                ...item,
                dossier: {
                    ...item.dossier,
                    voiceArchetype,
                    voiceId,
                }
            };
        }
        return item;
    }));
  };


  const handleUpdateTitle = (historyItemId: string, newTitle: string) => {
    setGenerationHistory(prevHistory =>
      prevHistory.map(item =>
        item.id === historyItemId
          ? { ...item, prompt: { ...item.prompt, title: newTitle } }
          : item
      )
    );
  };
  
  const handleDownload = (b64: string, id: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${b64}`;
    link.download = `character-${id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleUndoRefinement = (imageId: string) => {
    setGenerationHistory(prevHistory =>
      prevHistory.map(historyItem => ({
        ...historyItem,
        images: historyItem.images.map(img => {
          if (img.id === imageId && img.b64History.length > 1) {
            const newHistory = [...img.b64History];
            newHistory.pop();
            const updatedImage = { ...img, b64History: newHistory };
            // If the preview is showing this image, update it
            if (previewData?.image.id === imageId) {
              setPreviewData({ ...previewData, image: updatedImage });
            }
            return updatedImage;
          }
          return img;
        })
      }))
    );
  };

  const handleStartRefinement = (image: GeneratedImage) => {
    setRefiningImage(image);
  };

  const handleRefinementComplete = (imageId: string, newB64History: string[]) => {
    setGenerationHistory(prevHistory =>
      prevHistory.map(historyItem => ({
        ...historyItem,
        images: historyItem.images.map(img =>
          img.id === imageId ? { ...img, b64History: newB64History } : img
        )
      }))
    );
    setRefiningImage(null);
  };


  const handleChatImagePreview = (b64: string) => {
    if (!b64) return;
    const previewImage: GeneratedImage = {
      id: `editor-preview-${Date.now()}`,
      b64History: [b64],
      characterDesc: 'Image from Conversational Editor',
      scene: 'N/A',
      artStyle: 'Custom',
      source: 'editor',
    };
    setPreviewData({ image: previewImage, timestamp: Date.now() });
  };

  return (
    <>
      <AnimatedCursor />
      <AnimatedBackground />
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}
      {!showSplash && (
      <div ref={mainContainerRef} className="min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-7xl">
          <div className="header-anim relative z-30">
            <Header 
              onNavigate={setView} 
              currentView={view}
              onSetApiKey={handleSetApiKey}
              onClearApiKey={handleClearApiKey}
              hasUserApiKey={!!userApiKey}
              onSetElevenLabsApiKey={handleSetElevenLabsApiKey}
              onClearElevenLabsApiKey={handleClearElevenLabsApiKey}
              hasElevenLabsApiKey={!!elevenLabsApiKey}
            />
          </div>
          {view === 'generator' ? (
             <main className="mt-8 w-full">
              <div className="form-anim">
                <InputForm onGenerate={handleGenerate} isLoading={generationHistory[0]?.status === 'generating' || !!variationsLoadingId || !!foilLoadingId} hasGenerated={generationHistory.length > 0} />
              </div>
              {error && <div className="mt-8 text-center" style={{ color: 'var(--theme-color)', border: '1px solid var(--theme-border-color)', backgroundColor: 'rgba(var(--theme-color-rgb), 0.1)', padding: '1rem'}}>{`[ERROR]: ${error}`}</div>}
              
              {generationHistory.length === 0 && !error && (
                <div ref={resultsRef} className="mt-12 relative">
                  <GenerationBlock
                    key={DEMO_HISTORY_ITEM.id}
                    generationSet={DEMO_HISTORY_ITEM}
                    isLatest={true}
                    onImageClick={() => { /* No action for placeholders */ }}
                  />
                </div>
              )}
              
              {generationHistory.length > 0 && (
                <div ref={resultsRef} className="mt-12 relative">
                  {generationHistory.map((historyItem, index) => (
                    <GenerationBlock 
                      key={historyItem.id}
                      generationSet={historyItem}
                      isLatest={index === 0}
                      onImageClick={(image) => setPreviewData({ image, timestamp: historyItem.timestamp })}
                      onUpdateTitle={handleUpdateTitle}
                      onGenerateVariations={handleGenerateVariations}
                      onStartRefinement={handleStartRefinement}
                      onGenerateOriginStory={handleGenerateOriginStory}
                      onSetCharacterVoice={handleSetCharacterVoice}
                      onGenerateFoil={handleGenerateFoil}
                      isGeneratingVariations={variationsLoadingId === historyItem.id}
                      isGeneratingFoil={foilLoadingId === historyItem.id}
                    />
                  ))}
                </div>
              )}
            </main>
          ) : (
            <main className="mt-8 w-full form-anim">
              <ChatEditor 
                onImagePreview={handleChatImagePreview}
                baseImage={chatBaseImage}
                chatHistory={chatHistory}
                onBaseImageChange={setChatBaseImage}
                onChatHistoryChange={setChatHistory}
              />
            </main>
          )}
        </div>
      </div>
      )}

      <ImagePreviewModal
        data={previewData}
        onClose={() => setPreviewData(null)}
        onUndo={handleUndoRefinement}
        onDownload={handleDownload}
      />

      <RefinementChatModal
        image={refiningImage}
        onClose={() => setRefiningImage(null)}
        onComplete={handleRefinementComplete}
        onImagePreview={handleChatImagePreview}
      />
    </>
  );
};

export default App;
