
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // CRITICAL: Initialize inside the function to ensure process.env.API_KEY is captured correctly in production environments
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No transactions to analyze.");
  }

  // Create a condensed summary to keep the context window focused and efficient
  const summary = transactions.slice(0, 40).map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date,
    notes: t.notes || ''
  }));

  const prompt = `Act as a senior financial analyst. Analyze these transactions for a user in the Philippines (PHP/₱).
    Transaction Data: ${JSON.stringify(summary)}
    
    Required Output:
    1. healthScore: A number (0-100) representing financial stability.
    2. analysis: A concise breakdown of spending patterns.
    3. forecast: Predicted financial outlook for next month.
    4. recommendations: 3 specific, actionable steps to improve savings.
    5. savingsPotential: Estimated monthly amount that could be saved (e.g., "₱2,500.00").`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded to Pro for superior reasoning in financial audits
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
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"],
          propertyOrdering: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The AI returned an empty response.");
    
    // Attempt to parse; if it fails, the catch block will handle it
    return JSON.parse(text) as AIInsight;
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    
    // Provide user-friendly specific errors
    if (error.message?.includes('403')) throw new Error("API access denied. Please check project billing and key permissions.");
    if (error.message?.includes('429')) throw new Error("AI is busy right now (Rate Limit). Please try again in 30 seconds.");
    if (error.message?.includes('API_KEY_INVALID')) throw new Error("The provided API Key is invalid.");
    
    throw new Error(error.message || "An unexpected error occurred during AI analysis.");
  }
};
