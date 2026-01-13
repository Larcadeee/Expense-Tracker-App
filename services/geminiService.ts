
import { Transaction, AIInsight } from "../types.ts";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)["API_KEY"];
    }
  } catch {
    return undefined;
  }
};

export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      analysis: "API Key not found. Please set the API_KEY environment variable.",
      forecast: "Unavailable",
      recommendations: ["Ensure your environment variables are configured correctly."]
    };
  }

  const simplifiedData = transactions.map(t => ({
    date: t.date,
    type: t.type,
    amount: t.amount,
    category: t.category
  }));

  const prompt = `
    Analyze the following financial transaction history (Values in Philippine Peso) and provide insights.
    
    Data: ${JSON.stringify(simplifiedData)}
    
    Tasks:
    1. Identify spending spikes or unusual patterns.
    2. Compare income vs expense trends.
    3. Predict next month's total income and expenses based on these trends.
    4. Provide 3 actionable financial recommendations tailored for a Philippine context.
    
    You must respond with a JSON object containing:
    - analysis: A string describing spending habits.
    - forecast: A string describing projections.
    - recommendations: An array of 3 strings.
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional financial advisor. Return your response in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) throw new Error("Empty response from AI");
    
    return JSON.parse(content) as AIInsight;
  } catch (error) {
    console.error("AI Insight error:", error);
    return {
      analysis: "Unable to generate AI analysis at this time. Please check your connection.",
      forecast: "Projections currently unavailable.",
      recommendations: [
        "Maintain a consistent tracking habit.",
        "Review high-cost categories like Food or Transport.",
        "Target a 20% savings rate in your next cycle."
      ]
    };
  }
};
