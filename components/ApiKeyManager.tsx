import React, { useState, useRef, useEffect } from 'react';

interface ApiKeyManagerProps {
  onSetApiKey: (key: string) => void;
  onClearApiKey: () => void;
  hasUserApiKey: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onSetApiKey, onClearApiKey, hasUserApiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSetApiKey(inputValue.trim());
      setInputValue('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onClearApiKey();
    setInputValue('');
    setIsOpen(false);
  };

  const getButtonText = () => {
    return hasUserApiKey ? '[ API_KEY: USER ]' : '[ API_KEY: DEFAULT ]';
  };

  return (
    <div ref={wrapperRef} className="relative z-[100] w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-4 border transition-colors text-lg"
        style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-text-color-dim)' }}
        title={hasUserApiKey ? "A user-provided API key is active. Click to manage." : "Using the default API key. Click to provide your own."}
      >
        {getButtonText()}
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full bg-black z-50 p-4" style={{ border: '1px solid var(--theme-border-color)' }}>
          <label htmlFor="api-key-input" className="block text-sm mb-2" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
            {hasUserApiKey ? "Update Gemini API Key:" : "Provide Gemini API Key:"}
          </label>
          <input
            id="api-key-input"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 bg-black border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-base"
            // FIX: Added `as React.CSSProperties` to allow for CSS custom properties.
            style={{ borderColor: 'var(--theme-border-color)', '--tw-ring-color': 'var(--theme-color)', color: 'var(--theme-text-color)' } as React.CSSProperties}
            placeholder="Enter your API key..."
          />
          <div className="flex justify-end gap-2 mt-3">
            {hasUserApiKey && (
              <button
                onClick={handleClear}
                className="py-1 px-3 border transition-colors text-base"
                style={{ fontFamily: "'VT323', monospace", borderColor: '#ff4d4d', color: '#ff4d4d' }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#ff4d4d'; e.currentTarget.style.color = 'black'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ff4d4d'; }}
              >
                [ CLEAR ]
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className="py-1 px-3 border transition-colors text-base disabled:opacity-50"
              style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }}
              onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
              onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
            >
              [ SAVE ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
