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
}

// FIX: Changed operationName to operation to store the entire operation object, which is required for polling.
export interface VideoState {
  status: 'generating' | 'complete' | 'error';
  blobUrl?: string;
  error?: string;
  operation?: any;
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
  video?: VideoState;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  imageB64?: string; // AI's output image
  inputImageB64?: string; // The image context the user's prompt was based on
  actions?: string[];
}
