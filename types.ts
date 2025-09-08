export type ArtStyle = 'Cartoonish' | 'Anime' | 'Realistic' | 'Steampunk' | 'Cyberpunk' | 'Fantasy' | 'Custom';

export interface UploadedImage {
  b64: string;
  mimeType: string;
}

export interface GeneratedImage {
  id: string;
  b64History: string[];
  characterDesc: string;
  scene: string;
  artStyle: ArtStyle;
  referenceImage?: UploadedImage | null;
  source?: 'generator' | 'editor';
}

export interface Dossier {
  callsign: string;
  background: string;
  abilities: string[];
  weaknesses: string[];
  quote: string;
  originStory?: string | 'generating';
  voiceArchetype?: string;
  voiceId?: string;
}

export interface HistoryItem {
  id: string;
  prompt: {
    title?: string;
    characterDesc: string;
    scene: string;
    artStyle: ArtStyle;
    referenceImage?: UploadedImage | null;
  };
  images: GeneratedImage[];
  timestamp: number;
  status?: 'generating' | 'complete';
  dossier?: Dossier | 'generating';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  imageB64?: string; // AI's output image
  inputImageB64?: string; // The image context the user's prompt was based on
  actions?: string[];
}
