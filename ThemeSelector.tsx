import React, { useState, useEffect, useRef } from 'react';

const themes: Record<string, Record<string, string>> = {
  blue: {
    '--theme-color': '#00d0ff',
    '--theme-color-rgb': '0, 208, 255',
    '--theme-text-color': '#00d0ff',
    '--theme-text-color-dim': 'rgba(0, 208, 255, 0.8)',
    '--theme-border-color': 'rgba(0, 208, 255, 0.5)',
    '--theme-border-color-light': 'rgba(0, 208, 255, 0.3)',
    '--theme-border-color-xlight': 'rgba(0, 208, 255, 0.2)',
    '--theme-interactive-bg-hover': 'rgba(0, 208, 255, 0.1)',
  },
  green: {
    '--theme-color': '#39FF14',
    '--theme-color-rgb': '57, 255, 20',
    '--theme-text-color': '#39FF14',
    '--theme-text-color-dim': 'rgba(57, 255, 20, 0.8)',
    '--theme-border-color': 'rgba(57, 255, 20, 0.5)',
    '--theme-border-color-light': 'rgba(57, 255, 20, 0.3)',
    '--theme-border-color-xlight': 'rgba(57, 255, 20, 0.2)',
    '--theme-interactive-bg-hover': 'rgba(57, 255, 20, 0.1)',
  },
  violet: {
    '--theme-color': '#7F58FF',
    '--theme-color-rgb': '127, 88, 255',
    '--theme-text-color': '#7F58FF',
    '--theme-text-color-dim': 'rgba(127, 88, 255, 0.8)',
    '--theme-border-color': 'rgba(127, 88, 255, 0.5)',
    '--theme-border-color-light': 'rgba(127, 88, 255, 0.3)',
    '--theme-border-color-xlight': 'rgba(127, 88, 255, 0.2)',
    '--theme-interactive-bg-hover': 'rgba(127, 88, 255, 0.1)',
  },
  teal: {
    '--theme-color': '#00F5D4',
    '--theme-color-rgb': '0, 245, 212',
    '--theme-text-color': '#00F5D4',
    '--theme-text-color-dim': 'rgba(0, 245, 212, 0.8)',
    '--theme-border-color': 'rgba(0, 245, 212, 0.5)',
    '--theme-border-color-light': 'rgba(0, 245, 212, 0.3)',
    '--theme-border-color-xlight': 'rgba(0, 245, 212, 0.2)',
    '--theme-interactive-bg-hover': 'rgba(0, 245, 212, 0.1)',
  },
};

const themeNames: Record<string, string> = {
  blue: 'Cyber Blue',
  green: 'Matrix Green',
  violet: 'Data-stream Violet',
  teal: 'Plasma Teal',
};

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

export const ThemeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState('blue');
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempCustomColor, setTempCustomColor] = useState('#00d0ff');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const applyStyles = (properties: Record<string, string>) => {
    Object.entries(properties).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    
    const themeColor = properties['--theme-color'];
    const arrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${themeColor.replace('#', '%23')}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
    document.documentElement.style.setProperty('--select-arrow-url', arrowSvg);
    
    document.dispatchEvent(new CustomEvent('themeChanged'));
  };

  const applyTheme = (themeName: string) => {
    const theme = themes[themeName];
    if (!theme) return;
    
    applyStyles(theme);

    setActiveTheme(themeName);
    setCustomColor(null);
    localStorage.setItem('comic-theme', themeName);
    localStorage.removeItem('comic-custom-color');
    setIsOpen(false);
  };
  
  const applyCustomTheme = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return;

    const [r, g, b] = rgb;
    const customTheme = {
      '--theme-color': hexColor,
      '--theme-color-rgb': `${r}, ${g}, ${b}`,
      '--theme-text-color': hexColor,
      '--theme-text-color-dim': `rgba(${r}, ${g}, ${b}, 0.8)`,
      '--theme-border-color': `rgba(${r}, ${g}, ${b}, 0.5)`,
      '--theme-border-color-light': `rgba(${r}, ${g}, ${b}, 0.3)`,
      '--theme-border-color-xlight': `rgba(${r}, ${g}, ${b}, 0.2)`,
      '--theme-interactive-bg-hover': `rgba(${r}, ${g}, ${b}, 0.1)`,
    };
    
    applyStyles(customTheme);

    setActiveTheme('custom');
    setCustomColor(hexColor);
    localStorage.setItem('comic-theme', 'custom');
    localStorage.setItem('comic-custom-color', hexColor);
    setIsOpen(false);
  };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('comic-theme');
    const savedCustomColor = localStorage.getItem('comic-custom-color');
    if (savedTheme === 'custom' && savedCustomColor) {
      applyCustomTheme(savedCustomColor);
    } else if (savedTheme && themes[savedTheme]) {
      applyTheme(savedTheme);
    } else {
      applyTheme('blue'); // Default to blue
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCustomPicker = () => {
    const initialColor = customColor || (themes[activeTheme] ? themes[activeTheme]['--theme-color'] : '#00d0ff');
    setTempCustomColor(initialColor);
    setShowCustomPicker(true);
  };

  const handleApplyCustomColor = () => {
    applyCustomTheme(tempCustomColor);
    setShowCustomPicker(false);
  };

  const getButtonText = () => {
    if (activeTheme === 'custom' && customColor) {
      return `Custom ${customColor.toUpperCase()}`;
    }
    return themeNames[activeTheme] || 'Unknown';
  };

  return (
    <div ref={wrapperRef} className="relative z-[101] w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-4 border transition-colors text-lg"
        style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-border-color)', color: 'var(--theme-text-color-dim)' }}
      >
        [ THEME: {getButtonText()} ]
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-black z-50 p-2" style={{ border: '1px solid var(--theme-border-color)' }}>
          {!showCustomPicker ? (
            <ul className="flex flex-col gap-1">
              {Object.entries(themeNames).map(([key, name]) => (
                <li key={key}>
                  <button
                    onClick={() => applyTheme(key)}
                    className="w-full text-left py-2 px-3 transition-colors flex items-center gap-3"
                    style={{ color: 'var(--theme-text-color)' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <span className="w-4 h-4" style={{ backgroundColor: themes[key]['--theme-color'] }}></span>
                    {name}
                  </button>
                </li>
              ))}
              <li>
                  <button
                    onClick={openCustomPicker}
                    className="w-full text-left py-2 px-3 transition-colors flex items-center gap-3"
                    style={{ color: 'var(--theme-text-color)' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                     <span className="w-4 h-4" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', border: '1px solid var(--theme-border-color)' }}></span>
                    Custom...
                  </button>
              </li>
            </ul>
          ) : (
            <div className="p-1">
              <div className="flex items-center justify-between gap-2 mb-3">
                 <label htmlFor="color-picker-input" className="text-sm cursor-pointer" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>SELECT_COLOR</label>
                 <input
                    ref={colorInputRef}
                    id="color-picker-input"
                    type="color"
                    value={tempCustomColor}
                    onChange={(e) => setTempCustomColor(e.target.value)}
                    className="w-10 h-8 p-0 border-none cursor-pointer bg-transparent"
                    style={{ border: '1px solid var(--theme-border-color)'}}
                  />
              </div>
              <button
                onClick={handleApplyCustomColor}
                className="w-full text-center py-2 px-3 transition-opacity text-sm"
                style={{ fontFamily: "'VT323', monospace", backgroundColor: 'var(--theme-color)', color: 'black' }}
                onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
              >
                APPLY
              </button>
              <button
                onClick={() => setShowCustomPicker(false)}
                className="w-full text-center py-1 px-3 transition-colors mt-2 text-sm"
                style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)', border: '1px solid var(--theme-border-color-light)' }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-interactive-bg-hover)'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                BACK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};