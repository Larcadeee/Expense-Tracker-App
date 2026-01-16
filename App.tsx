
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Auth from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Transactions from './pages/Transactions.tsx';
import Analytics from './pages/Analytics.tsx';
import { Transaction, TransactionType, User } from './types.ts';
import { supabase, isSupabaseConfigured } from './lib/supabase.ts';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (userId: string) => {
    try {
      const [profileRes, transRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
      ]);

      if (profileRes.data) {
        setUser({
          id: userId,
          email: profileRes.data.email || '',
          name: profileRes.data.name || 'User',
          savingsGoal: profileRes.data.savings_goal,
          expenseLimit: profileRes.data.expense_limit
        });
      }

      if (transRes.data) {
        setTransactions(transRes.data.map(t => ({
          id: t.id,
          userId: t.user_id,
          type: t.type as TransactionType,
          amount: parseFloat(t.amount),
          category: t.category,
          date: t.date,
          notes: t.notes,
          createdAt: t.created_at
        })));
      }
    } catch (err) {
      console.error('Data sync failed:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await fetchData(session.user.id);
        }
      } catch (err) {
        console.warn('Initial session check failed.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          fetchData(session.user.id);
        }
      } else {
        setUser(null);
        setTransactions([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const handleUpdateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    try {
      const dbFields: any = {};
      if (updatedFields.name) dbFields.name = updatedFields.name;
      const { error } = await supabase.from('profiles').update(dbFields).eq('id', user.id);
      if (!error) setUser(prev => prev ? { ...prev, ...updatedFields } : null);
    } catch (err) { console.error(err); }
  };

  const handleAddTransactions = async (newItems: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    if (!user || newItems.length === 0) return;
    try {
      const payload = newItems.map(t => ({
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        notes: t.notes
      }));

      const { data, error } = await supabase.from('transactions').insert(payload).select();
      
      if (data && !error) {
        const added = data.map(d => ({
          id: d.id,
          userId: d.user_id,
          type: d.type as TransactionType,
          amount: parseFloat(d.amount),
          category: d.category,
          date: d.date,
          notes: d.notes,
          createdAt: d.created_at
        }));
        setTransactions(prev => [...added, ...prev]);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Wallet</p>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Configuration Required</h2>
          <p className="text-slate-500 text-sm mb-8">Please set your Supabase environment variables to begin tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth onLogin={() => {}} />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard transactions={transactions} user={user} onUpdateUser={handleUpdateUser} />} />
              <Route path="/transactions" element={<Transactions transactions={transactions} onAdd={handleAddTransactions} onDelete={handleDeleteTransaction} />} />
              <Route path="/analytics" element={<Analytics transactions={transactions} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
