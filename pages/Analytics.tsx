
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction, TransactionType } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Brain, Lightbulb, TrendingUp, ShieldCheck, Target, Zap, ArrowUpRight, BarChart3, Wallet } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const PESO_SYMBOL = '₱';

  // Deterministic Analysis Logic
  const data = useMemo(() => {
    if (transactions.length === 0) return null;

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    
    // Category Breakdown
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(e => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    const categories = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Heuristic Health Score (0-100)
    let healthScore = 70; // Base score
    if (income > 0) {
      const savingsRate = (balance / income) * 100;
      if (savingsRate > 20) healthScore += 20;
      else if (savingsRate > 10) healthScore += 10;
      else if (savingsRate < 0) healthScore -= 30;
    } else if (expense > 0) {
      healthScore = 20;
    }
    healthScore = Math.min(100, Math.max(0, healthScore));

    // Savings Potential (Optimization logic)
    // Heuristic: 10% of Food, 25% of Entertainment, 15% of Other
    const potential = (catMap.get('Food') || 0) * 0.1 + 
                     (catMap.get('Entertainment') || 0) * 0.25 + 
                     (catMap.get('Other') || 0) * 0.15;

    // Behavioral Analysis Strings
    let analysisText = "Your financial profile shows consistent activity.";
    if (expense > income && income > 0) {
      analysisText = "Your spending exceeds your income. We recommend auditing discretionary categories like 'Other' or 'Entertainment' immediately.";
    } else if (income > 0 && (balance / income) > 0.3) {
      analysisText = "Excellent wealth accumulation. You are saving more than 30% of your income, which puts you in a high-security bracket.";
    }

    const recs = [
      "Set aside 20% of your next income for an emergency fund.",
      "Review 'Entertainment' subscriptions to identify unused services.",
      "Use the 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings."
    ];

    return {
      income,
      expense,
      balance,
      categories,
      healthScore,
      savingsPotential: `${PESO_SYMBOL}${potential.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      analysis: analysisText,
      forecast: `Based on current velocity, you are on track to end the month with a net position of ${PESO_SYMBOL}${balance.toLocaleString('en-PH')}.`,
      recommendations: recs
    };
  }, [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <BarChart3 size={64} className="text-slate-200 mb-6" />
        <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Data Required</h2>
        <p className="text-slate-500 font-medium">Log some transactions to generate your financial audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Financial Insights</h2>
          <p className="text-slate-500 font-medium text-sm">Deterministic analysis of your recent activity.</p>
        </div>
        <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center gap-2 border border-indigo-100">
          <ShieldCheck size={18} />
          <span className="text-sm">Mathematical Audit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl text-indigo-600"><ShieldCheck size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Health Score</p>
          <div className="relative flex items-center justify-center">
            <span className={`text-5xl font-black ${data.healthScore >= 70 ? 'text-emerald-500' : data.healthScore >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{data.healthScore}</span>
            <span className="text-sm font-bold text-slate-300 ml-1">/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data.healthScore}%` }} className={`h-full ${data.healthScore >= 70 ? 'bg-emerald-500' : data.healthScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Target size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Savings Potential</p>
          <h3 className="text-3xl font-black text-slate-900">{data.savingsPotential}</h3>
          <p className="text-[10px] font-bold text-emerald-600 mt-4 uppercase tracking-tighter">Available monthly recovery</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Zap size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Strategy Tier</p>
          <h3 className="text-3xl font-black text-slate-900">{data.healthScore > 80 ? 'ELITE' : data.healthScore > 50 ? 'STABLE' : 'ACTION REQ.'}</h3>
          <div className="flex items-center gap-1 text-slate-400 mt-4"><ArrowUpRight size={14} /><span className="text-[10px] font-bold uppercase">Dynamic Ranking</span></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} /></div>
          <h3 className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-indigo-600 flex items-center gap-2"><Sparkles size={12} /> Strategic Audit</h3>
          
          <div className="space-y-10 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-slate-400" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Analysis</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium italic border-l-2 border-indigo-100 pl-4">"{data.analysis}"</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-indigo-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Forecast</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">{data.forecast}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6"><Lightbulb size={16} className="text-amber-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Recommendations</h4></div>
              <div className="space-y-4">
                {data.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-extrabold bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg">{i + 1}</span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {data.categories.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Intensity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
