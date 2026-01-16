
import { Transaction, AIInsight } from "../types.ts";

/**
 * @deprecated Use local deterministic analysis in Analytics.tsx instead.
 */
export const getFinancialInsights = async (transactions: Transaction[]): Promise<AIInsight> => {
  return {
    analysis: "Deterministic audit active.",
    forecast: "Projections calculated locally.",
    recommendations: ["Maintain a 20% savings buffer."],
    healthScore: 100,
    savingsPotential: "₱0.00"
  };
};
