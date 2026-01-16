
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_REQUIRED");
  }

  // Initialize right before call to ensure we have the latest injected key
  const ai = new GoogleGenAI({ apiKey });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No data to analyze.");
  }

  // Summarize recent activity to stay within context limits and focus the AI
  const summary = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    cat: t.category,
    date: t.date,
    note: t.notes || ''
  }));

  const prompt = `Act as a senior financial auditor for a user in the Philippines (Currency: PHP/₱).
    Transaction Summary: ${JSON.stringify(summary)}
    
    Analyze the data and provide:
    1. A healthScore (0-100) based on savings rate and spending intensity.
    2. A concise analysis of spending patterns.
    3. A realistic forecast for the next 30 days.
    4. 3 specific, actionable recommendations to improve financial health.
    5. Estimated savingsPotential as a formatted string (e.g., "₱1,250.00").`;

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
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"],
          propertyOrdering: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty results.");
    
    return JSON.parse(text) as AIInsight;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Check for specific key-related issues
    if (error.message?.includes('API Key must be set') || error.message?.includes('403') || error.message?.includes('401')) {
      throw new Error("API_KEY_REQUIRED");
    }
    
    throw new Error(error.message || "Financial audit failed.");
  }
};
