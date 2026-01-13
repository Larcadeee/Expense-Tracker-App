
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transaction, AIInsight, TransactionType } from '../types.ts';
import { getFinancialInsights } from '../services/geminiService.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Brain, Lightbulb, TrendingUp } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

  const fetchInsights = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    const data = await getFinancialInsights(transactions);
    setInsight(data);
    setLoading(false);
  };

  useEffect(() => {
    if (transactions.length > 0 && !insight) {
      fetchInsights();
    }
  }, [transactions.length]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">AI Intelligence</h2>
          <p className="text-slate-500 font-medium text-sm">Automated financial analysis and projections.</p>
        </div>
        <button onClick={fetchInsights} disabled={loading || transactions.length === 0} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg disabled:opacity-30">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Thinking...' : 'Sync Analysis'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} /></div>
          <h3 className="text-[10px] font-extrabold tracking-[0.3em] uppercase text-indigo-600 flex items-center gap-2"><Sparkles size={12} /> AI Insight Engine</h3>
          
          {loading ? (
            <div className="space-y-8 animate-pulse">
              <div className="space-y-3"><div className="h-4 bg-slate-50 w-3/4 rounded-full" /><div className="h-4 bg-slate-50 w-full rounded-full" /></div>
              <div className="h-32 bg-slate-50 w-full rounded-3xl" />
            </div>
          ) : insight ? (
            <div className="space-y-10 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-slate-400" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Analysis</h4></div>
                <p className="text-sm leading-relaxed text-slate-600 font-medium italic">"{insight.analysis}"</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-indigo-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Projections</h4></div>
                <p className="text-sm leading-relaxed text-slate-600 font-medium">{insight.forecast}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-6"><Lightbulb size={16} className="text-amber-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Recommendations</h4></div>
                <div className="space-y-4">
                  {insight.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] font-extrabold bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-lg">{i + 1}</span>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Brain size={40} className="mb-4" /><p className="text-sm font-bold italic">No analysis generated yet.</p></div>
          )}
        </section>

        <section className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Category Allocation</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">{categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Spending Intensity</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} /><YAxis fontSize={11} fontWeight={600} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f8fafc' }} /><Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={32} /></BarChart></ResponsiveContainer></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
