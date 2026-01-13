
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/MetricCard.tsx';
import { Transaction, TransactionType, User } from '../types.ts';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Calendar as CalendarIcon, ReceiptText, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  user: User;
  onUpdateUser: (updatedFields: Partial<User>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, user }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthData = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const metrics = useMemo(() => {
    const income = monthData.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthData.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    
    return {
      income,
      expenses,
      balance,
      savingsRate: savingsRate.toFixed(1),
    };
  }, [monthData]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIncome = transactions
        .filter(t => t.date === dateStr && t.userId === user.id && t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.date === dateStr && t.userId === user.id && t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: d.toLocaleDateString('en-PH', { weekday: 'short' }), income: dayIncome, expense: dayExpense };
    }).reverse();
    return last7Days;
  }, [transactions, user.id]);

  const transactionsForSelectedDate = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate && t.userId === user.id);
  }, [transactions, selectedDate, user.id]);

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
      const hasTransactions = transactions.some(t => t.date === dateStr && t.userId === user.id);
      days.push({ day: i, dateStr, hasTransactions });
    }

    return days;
  }, [currentCalendarDate, transactions, user.id]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentCalendarDate(newDate);
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome, {user.name.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Financial Summary</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100">
            <CalendarIcon size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">
              {new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="INCOME" value={formatCurrency(metrics.income)} icon={TrendingUp} variant="success" />
          <MetricCard label="EXPENSE" value={formatCurrency(metrics.expenses)} icon={TrendingDown} variant="warning" />
          <MetricCard label="BALANCE" value={formatCurrency(metrics.balance)} subValue={`${metrics.savingsRate}% Savings`} icon={PiggyBank} variant="primary" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <section className="lg:col-span-3 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Cash Flow Trends</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₱${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
            <h3 className="text-xs font-extrabold tracking-[0.2em] mb-8 text-slate-400 uppercase">Daily Transactions</h3>
            <div className="space-y-4 flex-grow">
              <AnimatePresence mode="popLayout">
                {transactionsForSelectedDate.length > 0 ? (
                  transactionsForSelectedDate.map((t) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === TransactionType.INCOME ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.category}</p>
                          {t.notes && <p className="text-[10px] text-slate-400 font-medium uppercase">{t.notes}</p>}
                        </div>
                      </div>
                      <p className={`text-sm font-extrabold ${t.type === TransactionType.EXPENSE ? 'text-slate-900' : 'text-emerald-600'}`}>
                        {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 opacity-40">
                    <ReceiptText size={48} strokeWidth={1} className="mb-4 text-slate-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">No records for this date</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">Calendar</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-extrabold text-slate-700 min-w-[100px] text-center uppercase tracking-widest">
                  {new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric' }).format(currentCalendarDate)}
                </span>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <span key={day} className="text-[10px] font-extrabold text-slate-300 uppercase">{day}</span>
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
                      relative aspect-square rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1
                      ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'hover:bg-indigo-50 text-slate-600'}
                      ${isToday && !isSelected ? 'border-2 border-indigo-100' : ''}
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
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
