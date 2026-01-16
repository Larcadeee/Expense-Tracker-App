
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // Obtain the key directly from the environment variable as required.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  // Create instance right before use to ensure it uses the most up-to-date key
  const ai = new GoogleGenAI({ apiKey });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No transactions to analyze.");
  }

  // Condense transaction data to minimize token usage and stay within limits
  const summary = transactions.slice(0, 40).map(t => ({
    t: t.type === 'INCOME' ? 'IN' : 'OUT',
    a: t.amount,
    c: t.category,
    d: t.date,
    n: t.notes || ''
  }));

  const prompt = `Act as a professional financial advisor. Analyze these transactions for a user in the Philippines (PHP/₱).
    Data: ${JSON.stringify(summary)}
    
    Return a JSON object with:
    - healthScore: Number (0-100)
    - analysis: String (max 2 sentences)
    - forecast: String (1 sentence)
    - recommendations: Array of 3 strings
    - savingsPotential: String (e.g., "₱1,500.00")`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Switched to Flash for better production stability
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
    if (!text) throw new Error("AI returned an empty response.");
    
    return JSON.parse(text) as AIInsight;
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    
    // Handle specific error codes or messages for UI feedback
    if (error.message?.includes('API Key must be set') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error("API_KEY_INVALID");
    }
    
    throw new Error(error.message || "An error occurred during AI analysis.");
  }
};
