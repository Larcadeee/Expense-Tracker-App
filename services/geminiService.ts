
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types.ts";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // Initialize right before the call to ensure the latest API key from the environment is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (!transactions || transactions.length === 0) {
    throw new Error("No transactions to analyze.");
  }

  // Summarize transactions to minimize tokens while maintaining context
  const summary = transactions.slice(0, 40).map(t => ({
    t: t.type,
    a: t.amount,
    c: t.category,
    d: t.date,
    n: t.notes || ''
  }));

  const prompt = `Act as a senior financial advisor. Analyze the following transaction history for a user in the Philippines (Currency: PHP/₱).
    Transactions (recent first): ${JSON.stringify(summary)}
    
    Tasks:
    1. Calculate a financial health score (0-100) based on spending vs income patterns.
    2. Analyze specific spending behavior (identify trends or anomalies).
    3. Provide a realistic forecast for the next month.
    4. List 3 actionable, specific savings recommendations.
    5. Estimate monthly savings potential in PHP format (e.g., "₱2,500.00").
    
    Response must be valid JSON according to the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded for better reasoning on financial data
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { 
              type: Type.STRING,
              description: "A concise analysis of the user's spending habits."
            },
            forecast: { 
              type: Type.STRING,
              description: "A financial outlook for the upcoming month."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of actionable savings tips."
            },
            healthScore: { 
              type: Type.NUMBER,
              description: "A numerical score from 0 to 100."
            },
            savingsPotential: { 
              type: Type.STRING,
              description: "Formatted string representing potential savings."
            }
          },
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"],
          propertyOrdering: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI returned an empty response.");
    }

    return JSON.parse(text) as AIInsight;
  } catch (error: any) {
    console.error("Gemini AI Analysis failed:", error);
    // Provide a more descriptive error if possible
    if (error.message?.includes('403')) throw new Error("API Key permissions issue. Please verify billing.");
    if (error.message?.includes('429')) throw new Error("AI Rate limit reached. Please try again in a moment.");
    if (error.message?.includes('API_KEY_INVALID')) throw new Error("Invalid API Key provided.");
    throw error;
  }
};
