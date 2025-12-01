import { GoogleGenAI } from "@google/genai";

// Helper to get a random prompt suggestion if needed
export const generateTopics = async (context: string): Promise<string[]> => {
  if (!process.env.API_KEY) return ["Tell me about your day."];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 creative, short conversation starter questions for a video diary based on this context: "${context}". Return them as a JSON array of strings.`,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return ["What's on your mind?"];
    return JSON.parse(text) as string[];
  } catch (e) {
    console.error("Failed to generate topics", e);
    return ["What's the highlight of your week?", "What are you looking forward to?", "Tell a story about a challenge you overcame."];
  }
};
