import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ArtStyle, UploadedImage, GeneratedImage, Dossier, HistoryItem } from '../types';

let ai: GoogleGenAI | null = null;

const getApiKey = (): string | null => {
  try {
    const userKey = localStorage.getItem('user-gemini-api-key');
    if (userKey && userKey.trim()) {
      return userKey;
    }
  } catch (e) {
    console.error("Could not read API key from localStorage", e);
  }
  return process.env.API_KEY || null;
};

const initializeClient = () => {
  const apiKey = getApiKey();
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    ai = null;
  }
};

initializeClient(); // Initial call

export const updateUserApiKey = (apiKey: string | null) => {
  try {
    if (apiKey) {
      localStorage.setItem('user-gemini-api-key', apiKey);
    } else {
      localStorage.removeItem('user-gemini-api-key');
    }
  } catch (e) {
    console.error("Could not write API key to localStorage", e);
  }
  initializeClient(); // Re-initialize client with new key settings
};

const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    throw new Error("Gemini API key is not configured. Please set a valid API key to continue.");
  }
  return ai;
};

export const getSceneSuggestions = async (characterDesc: string, artStyle: ArtStyle, currentScene?: string): Promise<string[]> => {
  const prompt = currentScene && currentScene.trim()
    ? `A user is creating a character.
      - Character Description: "${characterDesc}"
      - Art Style: "${artStyle}"
      - Their current idea for a scene/outfit/action is: "${currentScene}"
      Based on all this information, generate 3 short, creative, and distinct suggestions that build upon or offer cool alternatives to their current idea. The suggestions should be concise and inspiring.`
    : `Based on this character description: "${characterDesc}" and the art style "${artStyle}", generate 3 short, creative, and distinct suggestions for a scene, outfit, or action. The suggestions should be concise and inspiring.`;
  
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A single scene/outfit/action suggestion."
              }
            }
          },
          required: ["suggestions"],
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      return result.suggestions.slice(0, 3); // Ensure only 3 are returned
    }
    
    throw new Error("Failed to parse suggestions from AI response.");

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error getting scene suggestions:", errorMessage);
    throw new Error(`Failed to get scene suggestions. ${errorMessage}`);
  }
};

export const generateSceneVariations = async (characterDesc: string, initialScene: string): Promise<string[]> => {
  const prompt = `Based on the character "${characterDesc}" and their initial situation "${initialScene}", create two additional, distinct scene descriptions. These new scenes should feature the same character but in different poses, actions, or moments related to the initial scene. Each description should be a concise, single sentence.`;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A single, distinct scene description."
              }
            }
          },
          required: ["scenes"],
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && Array.isArray(result.scenes)) {
      return result.scenes.slice(0, 2); // Ensure only 2 are returned
    }
    
    throw new Error("Failed to parse scene variations from AI response.");

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error generating scene variations:", errorMessage);
    throw new Error(`Failed to generate scene variations. ${errorMessage}`);
  }
};

export const generateCharacterImage = async (
    characterDesc: string, 
    scene: string, 
    artStyle: ArtStyle,
    referenceImage?: UploadedImage
): Promise<string[]> => {
  const artStylePrompt = {
    'Anime': 'vibrant, clean-lined Japanese anime style',
    'Realistic': 'photorealistic style, detailed textures',
    'Cartoonish': 'playful, exaggerated cartoon style, bold outlines',
    'Steampunk': 'Victorian-era science fiction, gears, brass, steam-powered machinery aesthetic',
    'Cyberpunk': 'futuristic, neon-lit, dystopian, high-tech low-life aesthetic',
    'Fantasy': 'high fantasy, magical elements, medieval, epic style with intricate details'
  }[artStyle];

  let prompt: string;
  const parts: any[] = [];

  if (referenceImage) {
    prompt = `Using the provided image as a strong visual reference, generate a new image. Maintain the core identity, pose, and style of the reference, but apply these specific modifications:\n- Context: ${characterDesc}\n- Modifications (Scene/Outfit/Action): ${scene}\n- Desired Art Style: ${artStylePrompt}\n- Important: The output must be a clean image with no text, watermarks, or borders.`;
    parts.push({ inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.b64 } });
  } else {
    prompt = `Generate an image based on the following details.\n- Character Description: ${characterDesc}\n- Scene/Action: ${scene}\n- Art Style: ${artStylePrompt}\n- Important: The image must be clean, with no text, watermarks, or borders. The character is the main subject. The aspect ratio should be 4:3.`;
  }
  parts.push({ text: prompt });

  try {
    const client = getAiClient();
    const generateVariation = async () => {
      const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        const blockReason = response.candidates?.[0]?.finishReason;
        console.error("Image generation failed. Full response:", JSON.stringify(response, null, 2));
        if (blockReason === 'SAFETY') {
          throw new Error("Image generation was blocked for safety reasons. Please adjust your prompt.");
        }
        throw new Error("Image generation failed: The AI did not return an image. Please try a different prompt.");
      }
      return imagePart.inlineData.data;
    };
    
    // Serialized with a small delay to prevent XHR errors
    const result1 = await generateVariation();
    await new Promise(resolve => setTimeout(resolve, 250));
    const result2 = await generateVariation();
    return [result1, result2];

  } catch(e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error generating character image:", errorMessage);
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("API rate limit exceeded. Please wait a moment before trying again.");
    }
     if (errorMessage.toLowerCase().includes('safety')) {
       throw new Error("Image generation was blocked for safety reasons. Please adjust your prompt.");
    }
    throw new Error(`Failed to generate character image. ${errorMessage}`);
  }
};

export const refineCharacterImage = async (
    originalImageB64: string, 
    refinePrompt: string,
    originalImageDetails: GeneratedImage
): Promise<string> => {
  const prompt = `Using the provided image as a direct visual base, apply the following modification: "${refinePrompt}". Maintain the original character and art style as much as possible. The output must be a clean image with no text, watermarks, or borders.`;
  
  try {
      const client = getAiClient();
      const parts = [
          { inlineData: { mimeType: 'image/png', data: originalImageB64 } },
          { text: prompt }
      ];

      const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        const blockReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        console.error("Image refinement failed. Full response:", JSON.stringify(response, null, 2));
        console.error("Block Reason:", blockReason, "Safety Ratings:", safetyRatings);

        if (blockReason === 'SAFETY') {
          throw new Error("Image refinement was blocked for safety reasons. Please adjust your prompt.");
        }
        throw new Error("Image refinement failed: The AI did not return an image. Please try a different prompt.");
      }

      return imagePart.inlineData.data;

  } catch(e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error refining character image:", errorMessage);
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("API rate limit exceeded. Please wait a moment before trying again.");
    }
    if (errorMessage.toLowerCase().includes('safety')) {
       throw new Error("Image refinement was blocked for safety reasons. Please adjust your prompt.");
    }
    throw new Error(`Failed to refine image. ${errorMessage}`);
  }
};


export const conversationalEditImage = async (
    originalImageB64: string, 
    refinePrompt: string,
    mimeType: string,
): Promise<string> => {
  const prompt = `Using the provided image as a direct visual base, apply the following modification: "${refinePrompt}". Maintain the original subject and art style as much as possible, unless instructed otherwise. The output must be a clean image with no text, watermarks, or borders.`;
  
  try {
      const client = getAiClient();
      const parts = [
          { inlineData: { mimeType: mimeType, data: originalImageB64 } },
          { text: prompt }
      ];

      const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts },
          config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        const blockReason = response.candidates?.[0]?.finishReason;
        console.error("Conversational edit failed. Full response:", JSON.stringify(response, null, 2));
        if (blockReason === 'SAFETY') {
          throw new Error("Image edit was blocked for safety reasons. Please adjust your prompt.");
        }
        throw new Error("Image edit failed: The AI did not return an image. Please try a different prompt.");
      }

      return imagePart.inlineData.data;

  } catch(e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Error in conversational edit:", errorMessage);
     if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("API rate limit exceeded. Please wait a moment before trying again.");
    }
    if (errorMessage.toLowerCase().includes('safety')) {
       throw new Error("Image edit was blocked for safety reasons. Please adjust your prompt.");
    }
    throw new Error(`Failed to edit image. ${errorMessage}`);
  }
};

export const generateCharacterDossier = async (characterDesc: string, artStyle: ArtStyle): Promise<Dossier> => {
    const prompt = `Based on this character description: "${characterDesc}" within a "${artStyle}" world, generate a classified dossier file. The dossier should contain a callsign, a short background, a list of 3-4 key abilities, a list of 1-2 weaknesses, and a memorable quote.`;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        callsign: { type: Type.STRING, description: "A cool code name or callsign for the character." },
                        background: { type: Type.STRING, description: "A brief, one or two sentence background story." },
                        abilities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of 3 to 4 key skills or powers."
                        },
                        weaknesses: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of 1 to 2 weaknesses or flaws."
                        },
                        quote: { type: Type.STRING, description: "A short, memorable quote from the character." }
                    },
                    required: ["callsign", "background", "abilities", "weaknesses", "quote"]
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && result.callsign && result.background && Array.isArray(result.abilities) && Array.isArray(result.weaknesses) && result.quote) {
            return result as Dossier;
        }
        throw new Error("AI response did not match the required dossier format.");

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error generating character dossier:", errorMessage);
        throw new Error(`Failed to generate character dossier. ${errorMessage}`);
    }
};

export const generateOriginStory = async (characterDesc: string, dossier: Dossier): Promise<string> => {
    const prompt = `Write a compelling, single-paragraph origin story for the following character.
- Character Description: ${characterDesc}
- Callsign: ${dossier.callsign}
- Background Summary: ${dossier.background}
- Key Abilities: ${dossier.abilities.join(', ')}
- Weaknesses: ${dossier.weaknesses.join(', ')}
- Quote: "${dossier.quote}"
The origin story should be concise, evocative, and expand upon these details.`;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text.trim();
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error generating origin story:", errorMessage);
        throw new Error(`Failed to generate origin story. ${errorMessage}`);
    }
};

export const generateFoilCharacter = async (originalCharacter: HistoryItem): Promise<{ characterDesc: string, scene: string, dossier: Dossier }> => {
    const { prompt, dossier } = originalCharacter;
    const promptContext = `
Original Character Details:
- Description: ${prompt.characterDesc}
- Scene: ${prompt.scene}
- Art Style: ${prompt.artStyle}
- Dossier: ${JSON.stringify(dossier, null, 2)}
`;
    
    const fullPrompt = `Based on the provided original character, create a "foil" character for them. A foil can be a companion, a rival, or a nemesis. The foil character must be distinct but thematically connected to the original.
${promptContext}
Generate a new character description, a scene they would be in, and a full dossier for this foil character.`;

    try {
         const client = getAiClient();
         const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        characterDesc: { type: Type.STRING, description: "A detailed description of the new foil character." },
                        scene: { type: Type.STRING, description: "A description of a scene, outfit or action for the foil character." },
                        dossier: {
                            type: Type.OBJECT,
                            properties: {
                                callsign: { type: Type.STRING, description: "A cool code name or callsign." },
                                background: { type: Type.STRING, description: "A brief background story." },
                                abilities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key skills." },
                                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of weaknesses." },
                                quote: { type: Type.STRING, description: "A memorable quote." }
                            },
                             required: ["callsign", "background", "abilities", "weaknesses", "quote"]
                        }
                    },
                    required: ["characterDesc", "scene", "dossier"]
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && result.characterDesc && result.scene && result.dossier) {
            return result;
        }
        throw new Error("AI response did not match the required foil character format.");

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error generating foil character:", errorMessage);
        throw new Error(`Failed to generate foil character. ${errorMessage}`);
    }
};

export const generateVoiceSelection = async (dossier: Dossier, availableVoices: string[]): Promise<string> => {
    const prompt = `
Analyze the following character dossier and choose the most fitting voice archetype from the provided list.
Respond with ONLY the name of the chosen archetype (e.g., "Deep Male").

Character Dossier:
- Callsign: ${dossier.callsign}
- Background: ${dossier.background}
- Abilities: ${dossier.abilities.join(', ')}
- Quote: "${dossier.quote}"

Available Voice Archetypes:
${availableVoices.join('\n')}

Chosen Archetype:`;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        // Sanitize the response to improve matching reliability
        const chosenVoice = response.text.replace(/[.,]/g, '').trim();
        
        if (availableVoices.includes(chosenVoice)) {
            return chosenVoice;
        }
        
        console.warn(`AI returned an unexpected voice archetype: "${chosenVoice}". Falling back to default.`);
        return availableVoices[0]; 
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error generating voice selection:", errorMessage);
        throw new Error(`Failed to select a voice. ${errorMessage}`);
    }
};