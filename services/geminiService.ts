import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface TranslationContext {
  previousForeignLanguage: string | null;
  preferredEnglishDialect: string;
}

export const translateAudio = async (
  base64Audio: string, 
  mimeType: string, 
  context: TranslationContext
): Promise<TranslationResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: `
              Listen to the attached audio carefully. 
              
              Context: 
              - The previous foreign language spoken in this session was "${context.previousForeignLanguage || 'None'}".
              - The user's preferred English dialect is "${context.preferredEnglishDialect}".

              Steps:
              1. Transcribe the audio exactly as spoken in its original language.
              2. Detect the SPECIFIC language and dialect spoken (e.g., 'Mexican Spanish', 'British English', 'Mandarin Chinese', 'Australian English').
              3. Determine the target language for translation:
                 - If the detected language is English (any dialect) AND a previous foreign language exists (not "None"), the target is specifically that previous foreign language dialect.
                 - Otherwise, the target is specifically the "${context.preferredEnglishDialect}".
              4. Translate the content into the target language. Ensure the translation matches the specific vocabulary, spelling, and idioms of the target dialect.
              
              Return the result as a JSON object with the specified schema.
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalTranscription: {
              type: Type.STRING,
              description: "The verbatim transcription of the audio in its original language.",
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "The specific dialect/language detected (e.g. 'British English', 'Mexican Spanish').",
            },
            translatedText: {
              type: Type.STRING,
              description: "The translation of the audio content into the target dialect.",
            },
            targetLanguage: {
              type: Type.STRING,
              description: "The specific dialect the content was translated into.",
            }
          },
          required: ["originalTranscription", "detectedLanguage", "translatedText", "targetLanguage"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(text) as TranslationResponse;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw error;
  }
};

export const generateTts = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data returned from Gemini TTS");
    }
    return audioData;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};