
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Auth from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Transactions from './pages/Transactions.tsx';
import Analytics from './pages/Analytics.tsx';
import { Transaction, TransactionType, User } from './types.ts';
import { supabase, isSupabaseConfigured } from './lib/supabase.ts';
import { AlertCircle, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      }
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchTransactions();
    }
  }, [user]);

  const fetchUserProfile = async (id: string, sessionEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setUser({
          id,
          email: data.email || sessionEmail,
          name: data.name,
          savingsGoal: data.savings_goal,
          expenseLimit: data.expense_limit
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
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

      if (data) {
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
      console.error('Transaction fetch error:', err);
    }
  };

  const handleUpdateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    
    const dbFields: any = {};
    if (updatedFields.name) dbFields.name = updatedFields.name;
    if (updatedFields.savingsGoal !== undefined) dbFields.savings_goal = updatedFields.savingsGoal;
    if (updatedFields.expenseLimit !== undefined) dbFields.expense_limit = updatedFields.expenseLimit;

    const { error } = await supabase
      .from('profiles')
      .update(dbFields)
      .eq('id', user.id);

    if (!error) {
      setUser(prev => prev ? { ...prev, ...updatedFields } : null);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        notes: t.notes
      }])
      .select()
      .single();

    if (data && !error) {
      const newT: Transaction = {
        id: data.id,
        userId: data.user_id,
        type: data.type as TransactionType,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        notes: data.notes,
        createdAt: data.created_at
      };
      setTransactions([newT, ...transactions]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4 uppercase tracking-tight">Setup Required</h2>
          <p className="text-slate-500 font-medium mb-8">
            Wallet needs a Supabase connection to store your data securely.
          </p>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
          >
            Open Supabase Dashboard <ExternalLink size={18} />
          </a>
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
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    transactions={transactions} 
                    user={user} 
                    onUpdateUser={handleUpdateUser}
                  />
                } 
              />
              <Route 
                path="/transactions" 
                element={
                  <Transactions 
                    transactions={transactions} 
                    onAdd={handleAddTransaction} 
                    onDelete={handleDeleteTransaction}
                  />
                } 
              />
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
