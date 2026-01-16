
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight, TransactionType } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  if (transactions.length === 0) {
    throw new Error("No transactions to analyze.");
  }

  // Create a summary of transactions to minimize token usage
  const summary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    notes: t.notes
  })).slice(0, 50); // Analyze the most recent 50 transactions

  const prompt = `Analyze these financial transactions for a user in the Philippines (Currency: PHP/₱).
    Transactions: ${JSON.stringify(summary)}
    
    Provide:
    1. A health score (0-100).
    2. A brief analysis of spending behavior.
    3. A financial forecast for the next month.
    4. Actionable savings recommendations.
    5. Estimated savings potential as a formatted string (e.g., "₱1,200.00").`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
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

    const result = JSON.parse(response.text || "{}");
    return result as AIInsight;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
