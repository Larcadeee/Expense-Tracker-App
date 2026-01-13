
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const simplifiedData = transactions.map(t => ({
    date: t.date,
    type: t.type,
    amount: t.amount,
    category: t.category
  }));

  const prompt = `
    Analyze the following financial transaction history (Values in Philippine Peso ₱) and provide insights.
    
    Data: ${JSON.stringify(simplifiedData)}
    
    Tasks:
    1. Identify spending spikes or unusual patterns.
    2. Compare income vs expense trends.
    3. Predict next month's total income and expenses in ₱ based on these trends.
    4. Provide 3 actionable financial recommendations tailored for a Philippine context if applicable (e.g., inflation awareness, emergency fund building).
    
    Keep the tone professional yet encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Detailed analysis of current spending habits" },
            forecast: { type: Type.STRING, description: "Next month projections" },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable financial advice"
            }
          },
          required: ["analysis", "forecast", "recommendations"]
        }
      }
    });

    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text.trim()) as AIInsight;
  } catch (error) {
    console.error("AI Insight error:", error);
    return {
      analysis: "Unable to generate AI analysis at this time. Please check your connection.",
      forecast: "Projections currently unavailable in Peso.",
      recommendations: [
        "Maintain a consistent ₱ tracking habit.",
        "Review high-cost categories like Food or Transport.",
        "Target a 20% savings rate in your next cycle."
      ]
    };
  }
};
