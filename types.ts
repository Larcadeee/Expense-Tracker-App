
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type IncomeSource = 'Salary' | 'Freelance' | 'Business' | 'Allowance' | 'Other';
export type ExpenseCategory = 'Food' | 'Rent' | 'Utilities' | 'Transport' | 'Entertainment' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  savingsGoal?: number;
  expenseLimit?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: IncomeSource | ExpenseCategory;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  expenseRatio: number;
  avgDailyExpense: number;
}

// Fixed: Renamed from CalculatedInsight to AIInsight to match geminiService usage and fulfill missing export
export interface AIInsight {
  analysis: string;
  forecast: string;
  recommendations: string[];
  healthScore: number;
  savingsPotential: string;
}
