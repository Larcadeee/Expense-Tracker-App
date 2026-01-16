
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, AIInsight } from '../types.ts';
import { getFinancialInsights } from '../services/geminiService.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Lightbulb, TrendingUp, ShieldCheck, Target, Zap, ArrowUpRight, BarChart3, Wallet, BrainCircuit, RefreshCw, Key, ExternalLink, Info } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
}

const Analytics: React.FC<AnalyticsProps> = ({ transactions }) => {
  const [aiData, setAiData] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

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

  const fetchAI = useCallback(async () => {
    if (transactions.length === 0) return;
    
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      setNeedsKey(true);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsKey(false);
    
    try {
      const insights = await getFinancialInsights(transactions);
      setAiData(insights);
    } catch (err: any) {
      if (err.message === 'API_KEY_REQUIRED') {
        setNeedsKey(true);
      } else {
        setError(err.message || "Failed to generate AI audit.");
      }
    } finally {
      setLoading(false);
    }
  }, [transactions]);

  useEffect(() => {
    fetchAI();
  }, [fetchAI]);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        fetchAI();
      } catch (err) {
        setError("The connection process was cancelled.");
      }
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <BarChart3 size={64} className="text-slate-200 mb-6" />
        <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Data Required</h2>
        <p className="text-slate-500 font-medium">Add records to your history to unlock analytical charts.</p>
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
          <p className="text-slate-500 font-medium text-sm">Visualizing your income and spending patterns.</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !needsKey && (
            <button 
              onClick={fetchAI}
              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Refresh AI Audit"
            >
              <RefreshCw size={18} />
            </button>
          )}
          <div className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg ${needsKey ? 'bg-slate-100 text-slate-400 shadow-slate-50' : 'bg-slate-900 text-white shadow-slate-200'}`}>
            <BrainCircuit size={18} />
            <span className="text-sm">{needsKey ? 'AI Offline' : 'AI Active'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-slate-50 rounded-2xl text-indigo-600"><ShieldCheck size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Health Score</p>
          <div className="relative flex items-center justify-center">
            {loading ? (
              <div className="h-14 w-14 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
            ) : (
              <>
                <span className={`text-5xl font-black ${aiData?.healthScore && aiData.healthScore >= 70 ? 'text-emerald-500' : aiData?.healthScore && aiData.healthScore >= 40 ? 'text-amber-500' : 'text-slate-200'}`}>{aiData?.healthScore || '--'}</span>
                <span className="text-sm font-bold text-slate-200 ml-1">/100</span>
              </>
            )}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${aiData?.healthScore || 0}%` }} 
              className={`h-full ${aiData?.healthScore && aiData.healthScore >= 70 ? 'bg-emerald-500' : aiData?.healthScore && aiData.healthScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Target size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Monthly Potential</p>
          <h3 className="text-3xl font-black text-slate-900">{loading ? '---' : (aiData?.savingsPotential || '₱0.00')}</h3>
          <p className="text-[10px] font-bold text-slate-300 mt-4 uppercase tracking-tighter">AI Analysis Needed</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Zap size={24} /></div>
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Strategy Status</p>
          <h3 className="text-3xl font-black text-slate-900">{loading ? '---' : (aiData ? (aiData.healthScore > 80 ? 'EXPERT' : aiData.healthScore > 50 ? 'STABLE' : 'FAIR') : 'OFFLINE')}</h3>
          <div className="flex items-center gap-1 text-slate-200 mt-4"><ArrowUpRight size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Connect AI</span></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-10 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} /></div>
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-600 flex items-center gap-2"><Sparkles size={12} /> Financial Audit</h3>
          
          <div className="space-y-10 relative z-10 flex-grow">
            {needsKey ? (
              <div className="h-full flex flex-col items-center justify-center py-10 space-y-6 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                  <Key size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">Unlock AI Insights</h4>
                  <p className="text-sm text-slate-500 font-medium max-w-[280px] mx-auto mt-2 leading-relaxed">
                    Connect your Gemini API key to receive personalized audits, health scores, and savings recommendations.
                  </p>
                </div>
                <button 
                  onClick={handleConnectKey}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Key size={16} /> Connect Gemini
                </button>
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Learn about Free Usage <ExternalLink size={10} />
                </a>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Info size={24} /></div>
                <p className="text-sm font-bold text-slate-600 max-w-xs">{error}</p>
                <button onClick={fetchAI} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Try Again</button>
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-slate-400" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Analysis</h4></div>
                  {loading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-50 rounded-lg animate-pulse w-full" />
                      <div className="h-4 bg-slate-50 rounded-lg animate-pulse w-5/6" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-600 font-medium italic border-l-2 border-indigo-100 pl-4">"{aiData?.analysis || 'Analyze your finances with AI...'}"</p>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-indigo-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">Forecast</h4></div>
                  {loading ? (
                    <div className="h-4 bg-slate-200/50 rounded-lg animate-pulse w-full" />
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-600 font-medium">{aiData?.forecast || 'Enter more records for a prediction.'}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-6"><Lightbulb size={16} className="text-amber-500" /><h4 className="text-xs font-extrabold tracking-widest text-slate-900 uppercase">AI Recommendations</h4></div>
                  <div className="space-y-4">
                    {loading ? (
                      [1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-2xl animate-pulse" />)
                    ) : (
                      (aiData?.recommendations || ["Connect AI to see custom tips."]).map((rec, i) => (
                        <motion.div key={i} whileHover={{ x: 5 }} className="flex gap-4 items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <span className="text-[10px] font-extrabold bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg">{i + 1}</span>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{rec}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-10">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Category Distribution</h3>
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
            <div className="grid grid-cols-2 gap-4 mt-6">
              {chartData.categories.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Expense Intensity</h3>
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
