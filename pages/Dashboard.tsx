
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/MetricCard.tsx';
import { Transaction, TransactionType, User } from '../types.ts';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Calendar as CalendarIcon, ReceiptText, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  user: User;
  onUpdateUser: (updatedFields: Partial<User>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, user }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Metrics reflect the month of the selectedDate
  const metrics = useMemo(() => {
    const selDateObj = new Date(selectedDate);
    const selMonth = selDateObj.getMonth();
    const selYear = selDateObj.getFullYear();

    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });

    const income = monthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    return {
      income,
      expenses,
      balance,
      savingsRate: savingsRate.toFixed(1),
      monthName: new Intl.DateTimeFormat('en-PH', { month: 'long' }).format(selDateObj)
    };
  }, [transactions, selectedDate]);

  // Weekly Trend: Last 7 days relative to selectedDate
  const weeklyTrendData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const dayIncome = transactions
        .filter(t => t.date === dateStr && t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.date === dateStr && t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
        
      return { 
        name: d.toLocaleDateString('en-PH', { weekday: 'short' }), 
        income: dayIncome, 
        expense: dayExpense 
      };
    });
  }, [transactions, selectedDate]);

  // General Cash Flow: 6 months leading up to the selectedDate
  const generalTrendData = useMemo(() => {
    const selDateObj = new Date(selectedDate);
    return [...Array(6)].map((_, i) => {
      const d = new Date(selDateObj.getFullYear(), selDateObj.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });

      const income = monthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

      return {
        name: d.toLocaleDateString('en-PH', { month: 'short' }),
        income,
        expense
      };
    });
  }, [transactions, selectedDate]);

  const transactionsForSelectedDate = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const formatCurrency = (val: number) => `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      const hasTransactions = transactions.some(t => t.date === dateStr);
      days.push({ day: i, dateStr, hasTransactions });
    }

    return days;
  }, [currentCalendarDate, transactions]);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Overview
            </h2>
            <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.3em]">
              Showing data for {metrics.monthName}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
            <CalendarIcon size={16} className="text-indigo-600" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
              {new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date(selectedDate))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label={`${metrics.monthName} Income`} value={formatCurrency(metrics.income)} icon={TrendingUp} variant="success" />
          <MetricCard label={`${metrics.monthName} Spending`} value={formatCurrency(metrics.expenses)} icon={TrendingDown} variant="warning" />
          <MetricCard label="Net Balance" value={formatCurrency(metrics.balance)} subValue={`${metrics.savingsRate}% Savings Rate`} icon={PiggyBank} variant="primary" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Charts Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* Main Trends Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-2">
                <TrendingUp size={14} /> Weekly View
              </h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase">Contextual to selected date</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                  <YAxis fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `₱${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" strokeDasharray="6 6" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* General Cash Flow Chart - Themed to match Weekly Review */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-2">
                <BarChart3 size={14} /> General Performance
              </h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">6 Month Trend</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generalTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                  <YAxis fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `₱${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Column */}
        <div className="lg:col-span-4 space-y-10">
          {/* Calendar Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Navigator</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => {
                  const newDate = new Date(currentCalendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentCalendarDate(newDate);
                }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black text-slate-800 min-w-[80px] text-center uppercase tracking-widest">
                  {new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(currentCalendarDate)}
                </span>
                <button onClick={() => {
                  const newDate = new Date(currentCalendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentCalendarDate(newDate);
                }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <span key={day} className="text-[10px] font-black text-slate-200 uppercase">{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                if (item === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`
                      relative aspect-square rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1
                      ${isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110 z-10' : 'hover:bg-slate-50 text-slate-600'}
                      ${isToday && !isSelected ? 'text-indigo-600 ring-1 ring-indigo-100' : ''}
                    `}
                  >
                    {item.day}
                    {item.hasTransactions && (
                      <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-400'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Records for specific day */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px]">
            <h3 className="text-[10px] font-black tracking-[0.3em] mb-8 text-slate-400 uppercase">Day Log</h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {transactionsForSelectedDate.length > 0 ? (
                  transactionsForSelectedDate.map((t) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === TransactionType.INCOME ? 'IN' : 'OUT'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{t.category}</p>
                          {t.notes && <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[100px]">{t.notes}</p>}
                        </div>
                      </div>
                      <p className={`text-xs font-black ${t.type === TransactionType.EXPENSE ? 'text-slate-900' : 'text-emerald-600'}`}>
                        {formatCurrency(t.amount)}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30">
                    <ReceiptText size={32} strokeWidth={2.5} className="mb-4 text-slate-400" />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">Empty Records</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
