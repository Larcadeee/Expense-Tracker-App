
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const PESO_SYMBOL = '\u20B1';

  // Safely check for API Key without crashing browser
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  if (!apiKey) {
    return {
      analysis: "API Key not found. Please set the API_KEY environment variable.",
      forecast: "Unavailable",
      recommendations: ["Ensure your environment variables are configured correctly."],
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
    Perform a professional financial audit on these transactions (Values in Philippine Peso ${PESO_SYMBOL}).
    
    Data: ${JSON.stringify(simplifiedData)}
    
    Tasks:
    1. Calculate a "Financial Health Score" (0-100) based on savings rate and spending balance.
    2. Identify specific "Savings Potential" - an estimated monthly amount (in ${PESO_SYMBOL}) recoverable from non-essentials.
    3. Analyze behavioral spending patterns.
    4. Predict next month's cash flow.
    5. Provide 3 high-impact recommendations for the Philippine market.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior financial auditor. Analyze transaction data and provide a structured JSON response. Adhere strictly to the JSON schema provided.",
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
    if (!text) throw new Error("Empty response from Gemini");
    
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis || "Audit complete.",
      forecast: parsed.forecast || "Forecast pending.",
      recommendations: parsed.recommendations || [],
      healthScore: parsed.healthScore || 50,
      savingsPotential: parsed.savingsPotential || `${PESO_SYMBOL}0.00`
    };
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    return {
      analysis: "Unable to complete AI audit at this time.",
      forecast: "Projections currently unavailable.",
      recommendations: ["Maintain consistent tracking.", "Review non-essential costs.", "Target 20% savings."],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }
};
