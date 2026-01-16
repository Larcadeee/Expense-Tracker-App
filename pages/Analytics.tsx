
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction, TransactionType, AIInsight } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, ShieldCheck, Target, Zap, ArrowUpRight, BarChart3, Wallet, BrainCircuit, Lightbulb } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return null;

    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(e => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    });
    
    const categories = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { income, expense, categories };
  }, [transactions]);

  // Using AIInsight type for both locally calculated and AI-driven insights
  const insights = useMemo((): AIInsight | null => {
    if (!chartData || transactions.length === 0) return null;

    const { income, expense, categories } = chartData;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    
    // 1. Health Score Calculation
    let healthScore = Math.min(100, Math.max(0, savingsRate + 20)); // Base is savings rate + buffer
    if (expense > income) healthScore = 30; // Negative balance penalty
    if (categories.length > 4) healthScore += 10; // Bonus for detailed tracking
    healthScore = Math.min(100, Math.round(healthScore));

    // 2. Dynamic Analysis
    const topCategory = categories[0]?.name || 'N/A';
    const topCatRatio = expense > 0 ? ((categories[0]?.value || 0) / expense) * 100 : 0;
    
    const analysis = expense > income 
      ? `Your spending currently exceeds your income by ₱${(expense - income).toLocaleString()}. This is unsustainable and requires immediate reduction in non-essential categories.`
      : `You are successfully saving ${savingsRate.toFixed(1)}% of your income. Your primary expense is ${topCategory}, accounting for ${topCatRatio.toFixed(0)}% of your total budget.`;

    // 3. Forecasting (Linear Projection)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const dailyBurn = expense / Math.max(1, transactions.length > 5 ? currentDay : 1);
    const projectedExpense = dailyBurn * daysInMonth;
    const forecast = `Based on your current burn rate, you are projected to spend approximately ₱${projectedExpense.toLocaleString()} by the end of this month.`;

    // 4. Rule-based Recommendations
    const recs: string[] = [];
    if (topCatRatio > 35) recs.push(`High concentration in ${topCategory}. Consider setting a strict ₱${(expense * 0.25).toLocaleString()} limit here.`);
    if (savingsRate < 20) recs.push("Try the 50/30/20 rule: allocate 20% of income directly to savings before any spending.");
    if (income === 0) recs.push("Focus on logging your income sources to get an accurate savings rate calculation.");
    if (recs.length < 3) recs.push("Maintain a 3-month emergency fund based on your current average monthly expenses.");
    
    // 5. Savings Potential (Assuming 10% optimization of non-essential)
    const potential = (expense * 0.1).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

    return {
      healthScore,
      analysis,
      forecast,
      recommendations: recs.slice(0, 3),
      savingsPotential: potential
    };
  }, [chartData, transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <BarChart3 size={64} className="text-slate-200 mb-6" />
        <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Data Required</h2>
        <p className="text-slate-500 font-medium">Add records to your history to unlock analytical insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            Financial Analysis <BarChart3 className="text-indigo-500" size={24} />
          </h2>
          <p className="text-slate-500 font-medium text-sm">Visualizing trends with our deterministic calculation engine.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-200">
            <BrainCircuit size={18} />
            <span className="text-sm">Local Engine Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl text-indigo-600"><ShieldCheck size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Health Score</p>
          <div className="relative flex items-center justify-center">
            <span className={`text-5xl font-black ${insights?.healthScore && insights.healthScore >= 70 ? 'text-emerald-500' : insights?.healthScore && insights.healthScore >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{insights?.healthScore || '--'}</span>
            <span className="text-sm font-bold text-slate-200 ml-1">/100</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${insights?.healthScore || 0}%` }} 
              className={`h-full ${insights?.healthScore && insights.healthScore >= 70 ? 'bg-emerald-500' : insights?.healthScore && insights.healthScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Target size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Monthly Optimization</p>
          <h3 className="text-3xl font-black text-slate-900">{insights?.savingsPotential || '₱0.00'}</h3>
          <p className="text-[10px] font-bold text-emerald-600 mt-4 uppercase tracking-tighter">Calculated Recovery Potential</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Zap size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Stability Tier</p>
          <h3 className="text-3xl font-black text-slate-900">
            {insights ? (insights.healthScore > 80 ? 'EXPERT' : insights.healthScore > 50 ? 'STABLE' : 'ACTION REQ.') : '--'}
          </h3>
          <div className="flex items-center gap-1 text-slate-400 mt-4"><ArrowUpRight size={14} /><span className="text-[10px] font-bold uppercase">Dynamic Ranking</span></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} /></div>
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-600 flex items-center gap-2">Data-Driven Audit</h3>
          
          <div className="space-y-10 relative z-10 flex-grow">
            <div>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-slate-400" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Trend Analysis</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium italic border-l-2 border-indigo-100 pl-4">
                "{insights?.analysis || 'Calculating analysis...'}"
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-indigo-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Projection</h4></div>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">
                {insights?.forecast || 'Enter more records for a forecast.'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6"><Lightbulb size={16} className="text-amber-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Optimization Tips</h4></div>
              <div className="space-y-4">
                {insights?.recommendations.map((rec, i) => (
                  <motion.div key={i} whileHover={{ x: 5 }} className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
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
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Spending Mix</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {chartData.categories.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Category Focus</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.categories}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
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
