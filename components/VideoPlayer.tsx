import React from 'react';

interface VideoPlayerProps {
    src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
    return (
        <div className="w-full aspect-video bg-black p-px" style={{ background: 'linear-gradient(to bottom, var(--theme-border-color), var(--theme-border-color-xlight))' }}>
            <video
                key={src} // Add key to force re-render if src changes
                src={src}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
            />
        </div>
    );
};
