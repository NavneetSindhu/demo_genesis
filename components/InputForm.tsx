


import React, { useState, useEffect, useCallback } from 'react';
import type { ArtStyle, UploadedImage } from '../types';
import { getSceneSuggestions } from '../services/geminiService';

interface InputFormProps {
  onGenerate: (characterDesc: string, scene: string, artStyle: ArtStyle, referenceImage: UploadedImage | null, generateDossier: boolean) => void;
  isLoading: boolean;
  hasGenerated: boolean;
}

const characterArchetypes = {
  'Female Android': 'A young female android with sleek silver hair, piercing glowing blue eyes, and intricate glowing circuit patterns visible on her porcelain-like skin. She has a slender, athletic build.',
  'Space Marine': 'A grizzled male supersoldier in bulky, battle-scarred power armor. He has a square jaw, a buzz cut, and a cybernetic eye. The armor is dark green with orange accents.',
  'Elven Sorceress': 'An elegant female elf with long, flowing white hair, pointed ears, and shimmering amethyst eyes. She wears ornate, flowing robes of deep purple and silver, adorned with mystical runes.',
  'Cyberpunk Hacker': 'A non-binary hacker with a neon pink mohawk, multiple facial piercings, and augmented reality glasses permanently fixed over their eyes. They wear a worn leather jacket covered in patches and glitches.',
  'Wasteland Wanderer': 'A rugged male survivor with a weathered face, a thick beard, and a tattered duster coat over patched-up gear. He carries a modified rifle and has a look of grim determination.',
  'Custom...': ''
};

type ArchetypeName = keyof typeof characterArchetypes;

const artStyles: { name: ArtStyle; image: string }[] = [
    { name: 'Anime', image: 'https://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486609463-c409d9e6-b67a-43c5-9d3b-fb405b69b804.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052025Z&X-Amz-Expires=300&X-Amz-Signature=0db4750f5d3f5d1b4e3b8c58e34558a7f3212cfcaabd5bb8132ecaddec63d691&X-Amz-SignedHeaders=host' },
    { name: 'Realistic', image: 'https://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486609858-07403427-a7f0-4346-ab41-a3c742208ed3.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052051Z&X-Amz-Expires=300&X-Amz-Signature=107917526eb67f9d023571bd884b8711c9a7c5d9c255a52fe74cf9b73fd30f84&X-Amz-SignedHeaders=host' },
    { name: 'Cartoonish', image: 'https://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486609991-8dc60097-e9a0-45c0-a450-527cf3abb6e1.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052126Z&X-Amz-Expires=300&X-Amz-Signature=d14181bc80596a05bcd6566d5798d2448dd627595345bf6bddb7cd77d760c383&X-Amz-SignedHeaders=host' },
    { name: 'Steampunk', image: 'https://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486610102-521313fd-4cbd-41f1-a448-3261b5361f4b.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052147Z&X-Amz-Expires=300&X-Amz-Signature=80408c8ba96b3f424ce8b1ee173fe00e2c588f6c2a91088f8324ab0fd381c887&X-Amz-SignedHeaders=host' },
    { name: 'Cyberpunk', image: 'http://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486610205-eb1ed53d-c80d-42e3-9e67-29b13c5fcf83.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052211Z&X-Amz-Expires=300&X-Amz-Signature=321fa433bf6532879e2fcb68936efd882eefa91f32242c6398ceeaa7a1a006da&X-Amz-SignedHeaders=host' },
    { name: 'Fantasy', image: 'https://github-production-user-asset-6210df.s3.amazonaws.com/128820939/486610337-532fbc5d-c82e-4480-9d19-5fa059f79df9.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250908T052231Z&X-Amz-Expires=300&X-Amz-Signature=7094ab103f3221044757031bccbd91a53c2b2e6d41b32fc06472d0051c78ea7c&X-Amz-SignedHeaders=host' },
];

const DossierToggle = ({ checked, onChange, disabled }: { checked: boolean, onChange: (checked: boolean) => void, disabled: boolean }) => (
    <div className="flex items-center gap-4 cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
        <button
            type="button"
            disabled={disabled}
            className="w-8 h-8 flex items-center justify-center border transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--theme-border-color)', backgroundColor: checked ? 'var(--theme-color)' : 'transparent' }}
        >
            {checked && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="black" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            )}
        </button>
        <div className="flex flex-col">
            <label
                className="text-lg"
                style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color)' }}
            >
                [ GENERATE_DOSSIER_FILE ]
            </label>
            <p className="text-sm" style={{ color: 'var(--theme-text-color-dim)'}}>
                Generate a text data file (callsign, background, abilities, etc.) for your character.
            </p>
        </div>
    </div>
);


export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, hasGenerated }) => {
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeName>('Female Android');
  const [characterDesc, setCharacterDesc] = useState(characterArchetypes['Female Android']);
  const [scene, setScene] = useState('');
  const [artStyle, setArtStyle] = useState<ArtStyle>('Anime');
  const [generateDossier, setGenerateDossier] = useState<boolean>(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const fetchAndSetSuggestions = useCallback(async () => {
    if (!characterDesc.trim()) {
      setSuggestions([]);
      setSuggestionError(null);
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);
    try {
      const result = await getSceneSuggestions(characterDesc, artStyle, scene);
      setSuggestions(result);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : "Failed to get suggestions.");
      setSuggestions([]);
    } finally {
      setIsSuggesting(false);
    }
  }, [characterDesc, artStyle, scene]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAndSetSuggestions();
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [fetchAndSetSuggestions]);


  const handleArchetypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newArchetype = e.target.value as ArchetypeName;
    setSelectedArchetype(newArchetype);
    setCharacterDesc(characterArchetypes[newArchetype]);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const b64 = result.split(',')[1];
            setUploadedImage({ b64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
    } else {
        setUploadedImage(null);
    }
  };

  const removeImage = () => {
      setUploadedImage(null);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) {
          fileInput.value = '';
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (characterDesc.trim() && scene.trim()) {
      onGenerate(characterDesc, scene, artStyle, uploadedImage, generateDossier);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
      setScene(suggestion);
      setSuggestions([]); // Hide suggestions after one is clicked
  };

  return (
    <div className="p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color-light), var(--theme-interactive-bg-hover))' }}>
      <div className="bg-black p-6 sm:p-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="character-archetype" className="block text-lg font-semibold mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                    [ SELECT_CHARACTER_ARCHETYPE ]
                </label>
                <select
                    id="character-archetype"
                    value={selectedArchetype}
                    onChange={handleArchetypeChange}
                    disabled={isLoading}
                    className="w-full p-4 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base appearance-none"
                    style={{
                        borderColor: 'var(--theme-border-color)',
                        '--tw-ring-color': 'var(--theme-color)',
                        backgroundPosition: 'right 1rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                    } as React.CSSProperties}
                >
                    {Object.keys(characterArchetypes).map(name => (
                    <option key={name} value={name} className="bg-black text-green-400" style={{ color: 'var(--theme-color)'}}>{name}</option>
                    ))}
                </select>

                <label htmlFor="character-desc" className="block text-lg font-semibold mt-4 mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                    [ CORE_CHARACTER_DESCRIPTION ]
                </label>
                <textarea
                    id="character-desc"
                    value={characterDesc}
                    onChange={(e) => {
                      setCharacterDesc(e.target.value);
                      if (selectedArchetype !== 'Custom...') {
                        setSelectedArchetype('Custom...');
                      }
                    }}
                    className="w-full h-56 p-4 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none text-base disabled:bg-black/50"
                    style={{
                      borderColor: 'var(--theme-border-color)',
                      '--tw-ring-color': 'var(--theme-color)',
                      color: 'var(--theme-text-color)',
                    } as React.CSSProperties}
                    placeholder="Select an archetype or write your own description."
                    required
                    disabled={isLoading}
                ></textarea>
            </div>
            <div className="flex flex-col">
                <label htmlFor="scene-desc" className="block text-lg font-semibold mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                    [ SCENE / OUTFIT / ACTION ]
                </label>
                <div className="relative flex-grow flex flex-col">
                    <div className="relative flex-grow" style={{ minHeight: '120px' }}>
                        <textarea
                            id="scene-desc"
                            value={scene}
                            onChange={(e) => setScene(e.target.value)}
                            className="w-full h-full p-4 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none text-base"
                            style={{ borderColor: 'var(--theme-border-color)', '--tw-ring-color': 'var(--theme-color)' } as React.CSSProperties}
                            placeholder="e.g., Wearing a futuristic black trench coat, standing in a rainy neon-lit city street."
                            required
                            disabled={isLoading}
                        ></textarea>
                    </div>
                     <div className="z-10 mt-2 bg-black p-2 flex flex-col gap-2 min-h-[8rem] justify-center flex-shrink-0" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                        {isSuggesting ? (
                            <p className="text-center animate-pulse" style={{ color: 'var(--theme-text-color-dim)', fontFamily: "'VT323', monospace" }}>
                                [ GENERATING IDEAS... ]
                            </p>
                        ) : suggestionError ? (
                            <p className="text-red-400 text-sm p-2">{suggestionError}</p>
                        ) : suggestions.length > 0 ? (
                            suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left p-2 border transition-all text-sm"
                                    style={{ borderColor: 'var(--theme-border-color-light)', color: 'var(--theme-text-color-dim)' }}
                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; e.currentTarget.style.borderColor = 'var(--theme-border-color)'; }}
                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--theme-border-color-light)'; }}
                                >
                                    &gt; {suggestion}
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-sm" style={{ color: 'var(--theme-text-color-dim)'}}>
                                {characterDesc.trim() ? "AI suggestions will appear here as you type." : "Enter a character description to get suggestions."}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-6">
            <label className="block text-lg font-semibold mb-2" style={{ fontFamily: "'VT323', monospace" }}>
                [ UPLOAD_REFERENCE_IMAGE (OPTIONAL) ]
            </label>
            <div 
                className="w-full p-4 border flex flex-col md:flex-row items-center gap-4"
                style={{ borderColor: 'var(--theme-border-color-light)' }}
            >
                {!uploadedImage ? (
                    <>
                        <svg className="w-8 h-8" style={{ color: 'var(--theme-border-color)'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>

                        <p className="text-sm flex-grow" style={{color: 'var(--theme-text-color-dim)'}}>Upload an image to guide the AI. PNG, JPG, WEBP accepted.</p>
                        <label htmlFor="image-upload" className="cursor-pointer py-2 px-4 text-sm border transition-colors whitespace-nowrap" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                            [ SELECT_FILE ]
                            <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={isLoading}/>
                        </label>
                    </>
                ) : (
                    <>
                        <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.b64}`} alt="Reference preview" className="w-20 h-20 object-cover" style={{ border: '1px solid var(--theme-border-color)'}}/>
                        <p className="flex-grow text-sm truncate" style={{color: 'var(--theme-text-color-dim)'}}>Reference loaded successfully.</p>
                        <button type="button" onClick={removeImage} disabled={isLoading} className="py-2 px-4 text-sm border transition-colors whitespace-nowrap" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                            [ REMOVE ]
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="mt-8">
            <label className="block text-lg font-semibold mb-4" style={{ fontFamily: "'VT323', monospace" }}>[ SET_ART_STYLE ]</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {artStyles.map(({ name, image }) => (
                    <button
                        key={name}
                        type="button"
                        disabled={isLoading}
                        onClick={() => setArtStyle(name)}
                        className={`relative aspect-[4/3] p-px overflow-hidden transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${artStyle === name ? 'pulse-glow-anim' : ''}`}
                         style={{
                            '--tw-ring-color': 'var(--theme-color)',
                            background: artStyle === name ? `linear-gradient(to bottom, var(--theme-border-color), var(--theme-interactive-bg-hover))` : 'var(--theme-border-color-xlight)',
                        } as React.CSSProperties}
                    >
                        <img src={image} alt={name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors"></div>
                        <div className="relative w-full h-full flex items-center justify-center">
                            <span className="text-xl sm:text-2xl text-flicker-subtle" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color)' }}>
                                [ {name.toUpperCase()} ]
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-8">
          <DossierToggle checked={generateDossier} onChange={setGenerateDossier} disabled={isLoading} />
        </div>

        <button
          type="submit"
          disabled={isLoading || !characterDesc.trim() || !scene.trim()}
          className="w-full relative py-4 px-4 text-xl sm:text-2xl font-bold border-2 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-8"
          style={{ 
            fontFamily: "'VT323', monospace",
            backgroundColor: 'var(--theme-interactive-bg-hover)',
            color: 'var(--theme-color)',
            borderColor: 'var(--theme-color)',
            '--tw-ring-color': 'var(--theme-color)',
            '--tw-ring-opacity': '0.5',
           } as React.CSSProperties}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; e.currentTarget.style.color = 'var(--theme-color)'; }}
        >
          {isLoading ? 'GENERATING...' : hasGenerated ? 'GENERATE NEW' : 'EXECUTE'}
        </button>
      </form>
      </div>
    </div>
  );
};