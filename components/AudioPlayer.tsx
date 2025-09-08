import React from 'react';

interface AudioPlayerProps {
    isPlaying: boolean;
    duration: number;
    currentTime: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    isDisabled: boolean;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) {
        return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
    isPlaying,
    duration,
    currentTime,
    onPlayPause,
    onSeek,
    isDisabled,
}) => {
    return (
        <div className="mt-4 p-4" style={{ border: '1px solid var(--theme-border-color-xlight)', backgroundColor: 'rgba(0,0,0,0.2)'}}>
            <div className="flex items-center gap-4">
                <button
                    onClick={onPlayPause}
                    disabled={isDisabled}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center border transition-colors disabled:opacity-50"
                    style={{ borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }}
                    onMouseOver={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; } }}
                    onMouseOut={e => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; } }}
                    aria-label={isPlaying ? "Pause narration" : "Play narration"}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
                <div className="flex-grow flex items-center gap-2">
                    <span className="text-sm w-12 text-center" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
                        {formatTime(currentTime)}
                    </span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => onSeek(Number(e.target.value))}
                        className="w-full h-1 appearance-none bg-transparent cursor-pointer"
                    />
                     <span className="text-sm w-12 text-center" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-text-color-dim)' }}>
                        {formatTime(duration)}
                    </span>
                </div>
            </div>
        </div>
    );
};