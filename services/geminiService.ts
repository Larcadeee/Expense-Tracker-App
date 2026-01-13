
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types";

/**
 * Refactored getFinancialInsights to use the Google GenAI SDK.
 * Obtained API key from process.env.API_KEY directly as per requirements.
 * Resolves 'Cannot find name global' by removing the custom helper.
 */
export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const PESO_SYMBOL = '\u20B1'; // Philippine Peso sign

  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  if (!process.env.API_KEY) {
    return {
      analysis: "API Key not found. Please set the API_KEY environment variable.",
      forecast: "Unavailable",
      recommendations: ["Ensure your environment variables are configured correctly."],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }

  // Use this process.env.API_KEY string directly when initializing the @google/genai client instance.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const simplifiedData = transactions.map(t => ({
    date: t.date,
    type: t.type,
    amount: t.amount,
    category: t.category
  }));

  const prompt = `
    Perform a professional financial audit on these transactions (Values in Philippine Peso ${PESO_SYMBOL}).
    
    Data: ${JSON.stringify(simplifiedData)}
    
    Tasks:
    1. Calculate a "Financial Health Score" (0-100) based on savings rate, spending volatility, and category balance.
    2. Identify specific "Savings Potential" - an estimated monthly amount (in ${PESO_SYMBOL}) that could be saved by optimizing non-essential spending.
    3. Analyze behavioral spending patterns.
    4. Predict next month's cash flow.
    5. Provide 3 high-impact recommendations for the Philippine market.
  `;

  try {
    // Select gemini-3-pro-preview for complex reasoning and audit tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior financial auditor. Analyze the transaction data and provide a JSON response summarizing the financial health, forecast, and recommendations for a user in the Philippines. You must return the output in JSON format matching the provided schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "Audit of behavioral spending patterns.",
            },
            forecast: {
              type: Type.STRING,
              description: "Next month's cash flow projection.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 3 financial recommendations.",
            },
            healthScore: {
              type: Type.NUMBER,
              description: "Financial health score (0-100).",
            },
            savingsPotential: {
              type: Type.STRING,
              description: `Formatted monthly savings potential (e.g. "${PESO_SYMBOL}1,000.00").`,
            },
          },
          required: ["analysis", "forecast", "recommendations", "healthScore", "savingsPotential"],
        },
      },
    });

    // Access the text property directly (not as a method).
    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini API");
    
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis || "Analysis pending.",
      forecast: parsed.forecast || "Forecast pending.",
      recommendations: parsed.recommendations || [],
      healthScore: parsed.healthScore || 50,
      savingsPotential: parsed.savingsPotential || `${PESO_SYMBOL}0.00`
    };
  } catch (error) {
    console.error("Gemini AI Insight error:", error);
    return {
      analysis: "Unable to generate AI analysis at this time.",
      forecast: "Projections currently unavailable.",
      recommendations: [
        "Maintain consistent tracking.",
        "Review high-cost categories.",
        "Target a 20% savings rate."
      ],
      healthScore: 0,
      savingsPotential: `${PESO_SYMBOL}0.00`
    };
  }
};
