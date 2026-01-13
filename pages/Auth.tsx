
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowRight, User as UserIcon, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [isLogin]);

  const withTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timed out. Please check your internet or Supabase status.')), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: loginError } = await withTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (loginError) throw loginError;
      } else {
        const { data: signUpData, error: signUpError } = await withTimeout(supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || 'New User' }
          }
        }));

        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          if (!signUpData.session) {
            setSuccess("Verification email sent! Please check your inbox.");
            setIsLogin(true);
            setPassword('');
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/30">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            layout
            className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6"
          >
            <WalletIcon size={32} />
          </motion.div>
          <motion.h1 layout className="text-3xl font-extrabold text-slate-900 mb-2 uppercase tracking-tighter">Wallet</motion.h1>
          <motion.p layout className="text-slate-500 font-medium text-center text-sm">Empower your financial future.</motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isLogin && (
              <motion.div 
                key="name-field"
                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative pb-4">
                  <UserIcon className="absolute left-4 top-[22px] text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm disabled:opacity-50"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                key="error-msg"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3"
              >
                <AlertCircle className="text-rose-500 shrink-0" size={16} />
                <p className="text-[11px] text-rose-600 font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div 
                key="success-msg"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 items-center"
              >
                <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                <p className="text-[11px] text-emerald-600 font-bold leading-relaxed">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <span className="flex items-center gap-2">
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={20} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            disabled={loading}
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50 uppercase tracking-widest"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
