import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats, Player } from "../types";

const getAIClient = () => {
  // Use API_KEY directly from environment variables as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeScoreSheet = async (
  imageBase64: string, 
  players: Player[],
  matchId: string
): Promise<PlayerStats[]> => {
  const ai = getAIClient();

  const playerContext = players.map(p => `#${p.number} ${p.name} (ID: ${p.id})`).join(', ');

  const prompt = `
    Analyze this basketball score sheet image. 
    Extract the statistics for the players listed here: ${playerContext}.
    Ignore any players not in this list.
    The 'minutes' column refers to total minutes played as an integer.
    Map columns like "Pts", "Fouls", "2Pt Made", etc., to the JSON schema.
    Return a JSON array of player statistics using the provided Player IDs.
    Set 'minutes' to 0 if not visible. Default other missing stats to 0.
  `;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        playerId: { type: Type.STRING, description: "The ID of the player from the context." },
        points: { type: Type.NUMBER },
        minutes: { type: Type.NUMBER },
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

    return data.map(stat => ({
      matchId,
      playerId: stat.playerId || '',
      minutes: stat.minutes || 0,
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