
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Auth from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Transactions from './pages/Transactions.tsx';
import Analytics from './pages/Analytics.tsx';
import { Transaction, TransactionType, User } from './types.ts';
import { supabase, isSupabaseConfigured } from './lib/supabase.ts';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (id: string, sessionEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setUser({
          id,
          email: data.email || sessionEmail,
          name: data.name || 'User',
          savingsGoal: data.savings_goal,
          expenseLimit: data.expense_limit
        });
      } else {
        setUser({
          id,
          email: sessionEmail,
          name: sessionEmail.split('@')[0],
        });
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (data && !error) {
        setTransactions(data.map(t => ({
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
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    let timeoutId: any;

    const init = async () => {
      // Immediate boot if config is missing
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      // Safety timeout: forced loading end after 5s to prevent white screen
      timeoutId = setTimeout(() => {
        setLoading(prev => {
          if (prev) {
            console.warn('Boot timeout triggered - forcing UI reveal.');
            setError('Connection is slow. Authenticate to sync your data.');
            return false;
          }
          return prev;
        });
      }, 5000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email!);
        }
      } catch (err) {
        console.error('Initialization Error:', err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setTransactions([]);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchTransactions();
    }
  }, [user]);

  const handleUpdateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    try {
      const dbFields: any = {};
      if (updatedFields.name) dbFields.name = updatedFields.name;
      const { error } = await supabase.from('profiles').update(dbFields).eq('id', user.id);
      if (!error) setUser(prev => prev ? { ...prev, ...updatedFields } : null);
    } catch (err) {
      console.error('Update Error:', err);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('transactions').insert([{
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        notes: t.notes
      }]).select().single();

      if (data && !error) {
        setTransactions([{
          id: data.id,
          userId: data.user_id,
          type: data.type as TransactionType,
          amount: parseFloat(data.amount),
          category: data.category,
          date: data.date,
          notes: data.notes,
          createdAt: data.created_at
        }, ...transactions]);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Securing Connection...</p>
        </div>
      </div>
    );
  }

  // Fallback UI if Supabase isn't reachable or configured
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">Configuration Error</h2>
          <p className="text-slate-500 text-sm font-medium mb-8">Invalid Supabase credentials detected. Please check your environment variables.</p>
          <a href="https://supabase.com" target="_blank" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]">
            Setup Supabase <ExternalLink size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        {error && !user && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xs p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-xl flex items-center gap-3">
             <AlertCircle size={18} className="text-amber-600 shrink-0" />
             <p className="text-[10px] font-bold text-amber-700 leading-tight flex-grow">{error}</p>
             <button onClick={() => window.location.reload()} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700"><RefreshCw size={14}/></button>
          </div>
        )}
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth onLogin={() => {}} />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard transactions={transactions} user={user} onUpdateUser={handleUpdateUser} />} />
              <Route path="/transactions" element={<Transactions transactions={transactions} onAdd={handleAddTransaction} onDelete={handleDeleteTransaction} />} />
              <Route path="/analytics" element={<Analytics transactions={transactions} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
