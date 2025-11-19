import { GoogleGenAI, Type } from "@google/genai";
import { Challenge } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChallenge = async (theme: string): Promise<Challenge> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a nostalgic LEGO building challenge based on the theme: "${theme}". 
      The theme might be something like "Space Police", "Castle", "Pirates", or "City".
      Provide a catchy 80s/90s style title, a short enthusiastic description, and 3 simple text-based steps to build it.
      Keep it simple enough for a small simulator.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "steps"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Challenge;
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "Connection Error",
      description: "Could not contact the mainframe. Try again later, cadet!",
      steps: ["Check your connection", "Reload the simulator"]
    };
  }
};