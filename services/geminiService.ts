
import { Transaction, AIInsight } from "../types.ts";

/**
 * @deprecated Use local deterministic analysis in Analytics.tsx instead.
 * AI functionality is disabled per user request.
 */
export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  const PESO_SYMBOL = '\u20B1';
  
  return {
    analysis: "AI Analysis is disabled. Local deterministic audit is active.",
    forecast: "Projections calculated locally.",
    recommendations: ["Track expenses daily.", "Maintain a 20% savings buffer.", "Review categories monthly."],
    healthScore: 100,
    savingsPotential: `${PESO_SYMBOL}0.00`
  };
};
