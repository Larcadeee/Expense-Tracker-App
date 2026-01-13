
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ReceiptText, BrainCircuit, LogOut, Wallet as WalletIcon, Database } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/transactions', label: 'History', icon: ReceiptText },
    { path: '/analytics', label: 'AI Analytics', icon: BrainCircuit },
  ];

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple ping to check if Supabase is reachable
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setIsConnected(!error || error.code !== 'PGRST301'); // PGRST301 is usually a projection error, not a connection error
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
  }, []);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
              <WalletIcon size={24} />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 uppercase">
              Wallet
            </span>
          </Link>

          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as</p>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-10 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200 py-10 bg-white/50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Wallet</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected === null ? 'bg-slate-300' : isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {isConnected === null ? 'Connecting...' : isConnected ? 'Supabase Live' : 'Supabase Offline'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">Intelligent financial tracking for Everyone.</p>
          </div>
          <div className="flex gap-8">
            <span className="text-xs font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors">HELP</span>
            <span className="text-xs font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors">API</span>
            <span className="text-xs font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors">SECURITY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
