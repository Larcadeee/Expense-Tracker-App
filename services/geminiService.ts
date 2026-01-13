
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const PESO_SYMBOL = '\u20B1';
  
  // Requirement: Use process.env.API_KEY directly
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

  if (!apiKey) {
    return {
      analysis: "AI Audit unavailable. API Key not found in environment.",
      forecast: "Projections paused.",
      recommendations: ["Configure Gemini API Key to enable insights."],
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

  const prompt = `Analyze these financial records (Currency: PHP ${PESO_SYMBOL}). Provide a technical audit in JSON format.
  Data: ${JSON.stringify(simplifiedData)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior financial data scientist. Analyze the user's spending habits and return a precise JSON response according to the schema. Be critical but constructive. Focus on the Philippine economy and typical cost of living.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "A summary of spending behavior." },
            forecast: { type: Type.STRING, description: "Estimated next month status." },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 actionable tips."
            },
            healthScore: { type: Type.NUMBER, description: "Score from 0-100." },
            savingsPotential: { type: Type.STRING, description: "Formatted PHP string." }
          },
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis || "Audit successful.",
      forecast: parsed.forecast || "Status quo expected.",
      recommendations: parsed.recommendations || [],
      healthScore: Math.min(100, Math.max(0, parsed.healthScore || 50)),
      savingsPotential: parsed.savingsPotential || `${PESO_SYMBOL}0.00`
    };
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return {
      analysis: "AI Analytics are currently unavailable.",
      forecast: "Unable to generate forecast.",
      recommendations: ["Track daily food/transpo costs.", "Review monthly subscriptions.", "Save at least 10% of gross income."],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }
};
