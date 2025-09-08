const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"; // Voice ID for "Rachel"

const getApiKey = (): string | null => {
  try {
    const userKey = localStorage.getItem('user-elevenlabs-api-key');
    if (userKey && userKey.trim()) {
      return userKey;
    }
  } catch (e) {
    console.error("Could not read ElevenLabs API key from localStorage", e);
  }
  return null;
};

export const updateUserElevenLabsApiKey = (apiKey: string | null) => {
  try {
    if (apiKey) {
      localStorage.setItem('user-elevenlabs-api-key', apiKey);
    } else {
      localStorage.removeItem('user-elevenlabs-api-key');
    }
  } catch (e) {
    console.error("Could not write ElevenLabs API key to localStorage", e);
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("ElevenLabs API key not provided. Please set it in the header.");
    }

    try {
        const response = await fetch(ELEVENLABS_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ detail: { message: "Unknown error occurred" } }));
            const errorMessage = errorBody?.detail?.message || response.statusText;
            throw new Error(`ElevenLabs API Error: ${errorMessage}`);
        }

        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error generating speech:", errorMessage);
        throw new Error(`Failed to generate speech. ${errorMessage}`);
    }
};
