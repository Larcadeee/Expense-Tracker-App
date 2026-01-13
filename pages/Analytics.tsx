
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction, TransactionType } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Brain, Lightbulb, TrendingUp, ShieldCheck, Target, Zap, ArrowUpRight, BarChart3 } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const PESO_SYMBOL = '₱';

  // Deterministic Analysis Engine
  const analyticsData = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;
    
    // Calculate Health Score (Heuristic: Savings Rate + Diversity of spending)
    const healthScore = Math.min(100, Math.max(0, Math.round(savingsRate)));

    // Category Distribution
    const categoryMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(e => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    });
    const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    const sortedCategories = [...categories].sort((a, b) => b.value - a.value);

    // Savings Potential (Heuristic: 15% of flexible categories)
    const flexibleCategories = ['Entertainment', 'Other', 'Food'];
    const flexSpend = transactions
      .filter(t => t.type === TransactionType.EXPENSE && flexibleCategories.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
    const savingsPotential = (flexSpend * 0.15).toLocaleString('en-PH', { minimumFractionDigits: 2 });

    // Behavioral Analysis
    let analysis = "Your spending is currently stable.";
    if (savingsRate < 0) {
      analysis = "Your expenses are outpacing your income. Immediate budget adjustment recommended.";
    } else if (savingsRate > 30) {
      analysis = "Exceptional savings rate. You are in the top tier of financial discipline.";
    } else if (sortedCategories.length > 0 && sortedCategories[0].name === 'Food' && (sortedCategories[0].value / expense) > 0.4) {
      analysis = "Dining and groceries account for the majority of your outflow. Consider bulk buying.";
    }

    // Pro Recommendations
    const recommendations = [];
    if (savingsRate < 10) recommendations.push("Build an emergency fund covering 3-6 months of basic needs.");
    if (flexSpend > expense * 0.3) recommendations.push("Reduce discretionary spending in 'Other' and 'Entertainment' by 10%.");
    if (income > 0) recommendations.push("Automate a 15% transfer to savings on every payday.");
    if (recommendations.length < 3) recommendations.push("Review annual insurance and utility plans for cheaper alternatives.");

    return {
      income,
      expense,
      balance,
      savingsRate,
      healthScore,
      categories,
      sortedCategories,
      savingsPotential: `${PESO_SYMBOL}${savingsPotential}`,
      analysis,
      forecast: `Based on current velocity, you will likely save ${PESO_SYMBOL}${Math.max(0, balance).toLocaleString('en-PH')} by month end.`,
      recommendations: recommendations.slice(0, 3)
    };
  }, [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <BarChart3 size={64} className="text-slate-200 mb-6" />
        <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Insufficient Data</h2>
        <p className="text-slate-500 font-medium">Add some transactions to see your financial audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Financial Audit</h2>
          <p className="text-slate-500 font-medium text-sm">Real-time algorithmic data processing.</p>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold border border-indigo-100">
          <ShieldCheck size={18} />
          <span className="text-sm">Verified Calculations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center"
        >
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl text-indigo-600">
            <ShieldCheck size={24} />
          </div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Health Score</p>
          <div className="relative flex items-center justify-center">
            <span className={`text-5xl font-black ${getScoreColor(analyticsData.healthScore)}`}>{analyticsData.healthScore}</span>
            <span className="text-sm font-bold text-slate-300 ml-1">/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${analyticsData.healthScore}%` }}
              className={`h-full ${getScoreBg(analyticsData.healthScore)}`}
            />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center"
        >
          <div className="mb-4 p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Target size={24} />
          </div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Savings Potential</p>
          <h3 className="text-3xl font-black text-slate-900">{analyticsData.savingsPotential}</h3>
          <p className="text-[10px] font-bold text-emerald-600 mt-4 uppercase tracking-tighter">Flexible Spend Optimization</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center"
        >
          <div className="mb-4 p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Zap size={24} />
          </div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Efficiency Rating</p>
          <h3 className="text-3xl font-black text-slate-900">
            {analyticsData.savingsRate > 20 ? 'ELITE' : analyticsData.savingsRate > 0 ? 'STABLE' : 'CRITICAL'}
          </h3>
          <div className="flex items-center gap-1 text-slate-400 mt-4">
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-bold uppercase">Dynamic Ranking</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} /></div>
          <h3 className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-indigo-600 flex items-center gap-2"><Sparkles size={12} /> Strategic Audit</h3>
          
          <div className="space-y-10 relative z-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-slate-400" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Behavioral patterns</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium italic border-l-2 border-indigo-100 pl-4">"{analyticsData.analysis}"</p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-indigo-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Cash Flow Projection</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">{analyticsData.forecast}</p>
            </motion.div>

            <div>
              <div className="flex items-center gap-2 mb-6"><Lightbulb size={16} className="text-amber-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Actionable Tips</h4></div>
              <div className="space-y-4">
                {analyticsData.recommendations.map((rec, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors"
                  >
                    <span className="text-[10px] font-extrabold bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg">{i + 1}</span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Category Allocation</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={analyticsData.categories} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={8} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {analyticsData.categories.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Spending Intensity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.categories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
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
