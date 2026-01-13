
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const PESO_SYMBOL = '\u20B1';
  
  // Directly access process.env.API_KEY as per instructions
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  if (!apiKey) {
    return {
      analysis: "AI Insight unavailable. Gemini API Key is missing in environment variables.",
      forecast: "Projections hidden.",
      recommendations: ["Configure API Key."],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  const simplifiedData = transactions.map(t => ({
    date: t.date,
    type: t.type,
    amount: t.amount,
    category: t.category,
    notes: t.notes
  }));

  const prompt = `
    Analyze these transactions (PHP ${PESO_SYMBOL}).
    
    Data: ${JSON.stringify(simplifiedData)}
    
    Tasks:
    1. Calculate a "Financial Health Score" (0-100).
    2. Identify specific "Savings Potential" - monthly PHP amount recoverable from non-essentials.
    3. Analyze behavioral spending patterns.
    4. Predict next month's cash flow.
    5. Provide 3 actionable recommendations for the Philippine market.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior financial auditor. Output only valid JSON based on the provided schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            forecast: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            healthScore: { type: Type.NUMBER },
            savingsPotential: { type: Type.STRING }
          },
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis || "Audit complete.",
      forecast: parsed.forecast || "Unavailable",
      recommendations: parsed.recommendations || [],
      healthScore: parsed.healthScore || 50,
      savingsPotential: parsed.savingsPotential || `${PESO_SYMBOL}0.00`
    };
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return {
      analysis: "AI audit could not be completed at this time.",
      forecast: "Projections unavailable.",
      recommendations: ["Track daily expenses.", "Avoid high-interest debt.", "Save 15% minimum."],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }
};
