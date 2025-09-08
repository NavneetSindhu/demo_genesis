import React from 'react';
import type { GeneratedImage } from '../types';

interface ImagePreviewModalProps {
    data: { image: GeneratedImage, timestamp: number } | null;
    onClose: () => void;
    onUndo: (imageId: string) => void;
    onDownload: (b64: string, id: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ data, onClose, onUndo, onDownload }) => {

    if (!data) return null;

    const { image, timestamp } = data;
    const isFromEditor = image.source === 'editor';
    const currentB64 = image.b64History[image.b64History.length - 1];
    const hasHistory = image.b64History.length > 1;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="w-full max-w-6xl h-[90vh] bg-black p-6 sm:p-8 relative flex flex-col md:flex-row gap-8" style={{ border: '2px solid var(--theme-border-color)' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 text-3xl transition-colors z-10" style={{ fontFamily: "'VT323', monospace", color: 'var(--theme-color)' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'var(--theme-color)'}>[ X ]</button>
                
                {/* Image Display */}
                <div className="w-full md:w-2/3 h-1/2 md:h-full flex flex-col items-center justify-center bg-black/50 p-8" style={{ border: '1px solid var(--theme-border-color-xlight)'}}>
                    <img 
                        src={`data:image/png;base64,${currentB64}`} 
                        alt={`Preview of ${image.id}`} 
                        className="max-w-full max-h-full object-contain"
                        style={{ boxShadow: '0 0 25px -5px var(--theme-color)' }}
                    />
                </div>

                {/* Details and Actions */}
                <div className="w-full md:w-1/3 flex flex-col h-1/2 md:h-full overflow-y-auto">
                    <h3 className="text-4xl mb-4" style={{ fontFamily: "'VT323', monospace" }}>[ IMAGE_DETAILS ]</h3>
                    <div className="text-sm space-y-3 mb-6 flex-shrink-0" style={{ color: 'var(--theme-text-color-dim)' }}>
                        <p><strong style={{ color: 'var(--theme-text-color)' }}>&gt; CHARACTER:</strong> {image.characterDesc}</p>
                        <p><strong style={{ color: 'var(--theme-text-color)' }}>&gt; SCENE:</strong> {image.scene}</p>
                        <p><strong style={{ color: 'var(--theme-text-color)' }}>&gt; ART STYLE:</strong> {image.artStyle}</p>
                        <p><strong style={{ color: 'var(--theme-text-color)' }}>&gt; TIMESTAMP:</strong> {new Date(timestamp).toLocaleString()}</p>
                        <p><strong style={{ color: 'var(--theme-text-color)' }}>&gt; VERSIONS:</strong> {image.b64History.length}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-6 flex-shrink-0">
                        {hasHistory && !isFromEditor && (
                            <button onClick={() => onUndo(image.id)} className="text-lg py-2 px-4 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                                [ UNDO ]
                            </button>
                        )}
                        <button onClick={() => onDownload(currentB64, image.id)} className="text-lg py-2 px-4 border transition-colors" style={{ fontFamily: "'VT323', monospace", borderColor: 'var(--theme-color)', color: 'var(--theme-color)' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--theme-color)'; e.currentTarget.style.color = 'black'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-color)'; }}>
                            [ DOWNLOAD ]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};