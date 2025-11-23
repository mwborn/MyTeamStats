import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats } from "../types";

// FIX: Updated to align with Gemini API guidelines.
// The API key must be obtained exclusively from `process.env.API_KEY` and is assumed to be available.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeScoreSheet = async (
  imageBase64: string, 
  players: {id: string, number: number, name: string}[],
  matchId: string
): Promise<PlayerStats[]> => {
  const ai = getAIClient();

  const playerContext = players.map(p => `#${p.number} ${p.name} (ID: ${p.id})`).join(', ');

  const prompt = `
    Analyze this basketball score sheet image (or scoreboard). 
    Extract the statistics for the players listed here: ${playerContext}.
    
    If the image contains data for players not in my list, ignore them.
    If the image contains columns like "Pts", "Fouls", "2Pt Made", etc., map them to the JSON schema.
    
    Return a JSON array of player statistics. 
    Use the provided Player ID in the JSON.
    Estimate missing values if the image is a simple scoreboard (e.g., only points and fouls).
    Set 'minutes' to "00:00:00" if not visible.
  `;

  // Schema for structured output
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        playerId: { type: Type.STRING, description: "The ID of the player from the context provided." },
        points: { type: Type.NUMBER },
        minutes: { type: Type.STRING },
        twoPtMade: { type: Type.NUMBER },
        twoPtAtt: { type: Type.NUMBER },
        threePtMade: { type: Type.NUMBER },
        threePtAtt: { type: Type.NUMBER },
        ftMade: { type: Type.NUMBER },
        ftAtt: { type: Type.NUMBER },
        rebOff: { type: Type.NUMBER },
        rebDef: { type: Type.NUMBER },
        assists: { type: Type.NUMBER },
        turnovers: { type: Type.NUMBER },
        steals: { type: Type.NUMBER },
        blocksMade: { type: Type.NUMBER },
        foulsCommitted: { type: Type.NUMBER },
        plusMinus: { type: Type.NUMBER },
        valuation: { type: Type.NUMBER }
      },
      required: ["playerId", "points"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");
    
    const data = JSON.parse(jsonText) as Partial<PlayerStats>[];

    // Hydrate missing fields with defaults and add matchId
    return data.map(stat => ({
      matchId,
      playerId: stat.playerId || '',
      minutes: stat.minutes || "00:00:00",
      points: stat.points || 0,
      twoPtMade: stat.twoPtMade || 0,
      twoPtAtt: stat.twoPtAtt || 0,
      threePtMade: stat.threePtMade || 0,
      threePtAtt: stat.threePtAtt || 0,
      ftMade: stat.ftMade || 0,
      ftAtt: stat.ftAtt || 0,
      rebOff: stat.rebOff || 0,
      rebDef: stat.rebDef || 0,
      assists: stat.assists || 0,
      turnovers: stat.turnovers || 0,
      steals: stat.steals || 0,
      blocksMade: stat.blocksMade || 0,
      blocksRec: 0,
      foulsCommitted: stat.foulsCommitted || 0,
      foulsDrawn: 0,
      valuation: stat.valuation || 0,
      plusMinus: stat.plusMinus || 0
    }));

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};