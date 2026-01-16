
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // Use the API key exclusively from the environment as required
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API_KEY_REQUIRED");
  }

  // Create a fresh instance right before making the call to ensure it uses the latest key
  const ai = new GoogleGenAI({ apiKey });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No data available to analyze.");
  }

  // Condense the transaction data for the prompt to stay within token limits
  const summary = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    cat: t.category,
    date: t.date,
    note: t.notes || ''
  }));

  const prompt = `Act as a senior financial analyst and auditor for a user in the Philippines. 
    The current currency is PHP (₱).
    Transaction Log: ${JSON.stringify(summary)}
    
    Return a professional financial audit in valid JSON format with:
    - healthScore: A number (0-100) based on saving habits.
    - analysis: A 1-2 sentence overview of spending behavior.
    - forecast: A 1-sentence outlook for next month's balance.
    - recommendations: An array of 3 actionable tips for this specific user.
    - savingsPotential: A string showing estimated monthly potential (e.g., "₱1,000.00").`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Recommended for Basic Text Tasks / Free usage tier
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

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from analysis engine.");
    
    return JSON.parse(resultText) as AIInsight;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    
    // Explicitly handle 401/403 or key-related message strings as defined by SDK
    const msg = error.message || "";
    if (msg.includes('API Key must be set') || msg.includes('403') || msg.includes('401')) {
      throw new Error("API_KEY_REQUIRED");
    }
    
    throw new Error("Analysis failed. Please try again later.");
  }
};
