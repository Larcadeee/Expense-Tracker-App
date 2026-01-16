
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // Use the API key exclusively from the environment variable process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API_KEY_REQUIRED");
  }

  // Initialize the GenAI client with the current key
  const ai = new GoogleGenAI({ apiKey });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No data available to analyze.");
  }

  // Summarize the transactions to stay within free-tier context limits
  const summary = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    cat: t.category,
    date: t.date,
    note: t.notes || ''
  }));

  const prompt = `Act as a senior financial analyst.
    Context: User based in the Philippines (Currency: ₱).
    Data: ${JSON.stringify(summary)}
    
    Provide a professional financial audit in JSON format with exactly these fields:
    - healthScore (Number 0-100): overall stability.
    - analysis (String): 1-2 sentences on patterns.
    - forecast (String): 1 sentence on next month.
    - recommendations (Array of 3 strings): actionable tips.
    - savingsPotential (String): Formatted ₱ currency string.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Optimal free-tier model for text/JSON tasks
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

    const result = response.text;
    if (!result) throw new Error("The analysis engine returned an empty response.");
    
    return JSON.parse(result) as AIInsight;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    const msg = error.message || "";
    // Check for common auth/key errors in production
    if (msg.includes('API Key') || msg.includes('403') || msg.includes('401') || msg.includes('entity was not found')) {
      throw new Error("API_KEY_REQUIRED");
    }
    
    throw new Error("Financial audit failed. Please try again in a moment.");
  }
};
