
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/MetricCard';
import { Transaction, TransactionType, User } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Calendar as CalendarIcon, ReceiptText, ChevronLeft, ChevronRight, Settings, Check, X, Shield, Eye, EyeOff, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  user: User;
  onUpdateUser: (updatedFields: Partial<User>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, user, onUpdateUser }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tempSavingsGoal, setTempSavingsGoal] = useState(user.savingsGoal?.toString() || '20000');
  const [tempExpenseLimit, setTempExpenseLimit] = useState(user.expenseLimit?.toString() || '30000');

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

  // Calendar Helper Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty spaces for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of the month
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

  const handleSaveTargets = () => {
    onUpdateUser({
      savingsGoal: parseFloat(tempSavingsGoal) || 0,
      expenseLimit: parseFloat(tempExpenseLimit) || 0,
    });
    setIsEditingTargets(false);
  };

  const savingsGoal = user.savingsGoal || 20000;
  const expenseLimit = user.expenseLimit || 30000;
  const savingsProgress = Math.max(0, Math.min((metrics.balance / savingsGoal) * 100, 100));
  const expenseProgress = Math.max(0, Math.min((metrics.expenses / expenseLimit) * 100, 100));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {user.name.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Your financial snapshot for this month</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100">
            <CalendarIcon size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">
              {new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            label="MONTHLY INCOME" 
            value={formatCurrency(metrics.income)} 
            icon={TrendingUp} 
            variant="success" 
          />
          <MetricCard 
            label="MONTHLY EXPENSE" 
            value={formatCurrency(metrics.expenses)} 
            icon={TrendingDown} 
            variant="warning" 
          />
          <MetricCard 
            label="NET BALANCE" 
            value={formatCurrency(metrics.balance)} 
            subValue={`${metrics.savingsRate}% SAVINGS RATE`}
            icon={PiggyBank} 
            variant="primary" 
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <section className="lg:col-span-3 space-y-8">
          {/* Trend Chart */}
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

          {/* Transactions for Selected Date */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">Transactions on {new Date(selectedDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
            </div>
            <div className="space-y-4 flex-grow">
              <AnimatePresence mode="popLayout">
                {transactionsForSelectedDate.length > 0 ? (
                  transactionsForSelectedDate.map((t, idx) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:border-indigo-100 transition-colors"
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
                  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                    <ReceiptText size={48} strokeWidth={1} className="mb-4 text-slate-400" />
                    <p className="text-xs font-bold uppercase tracking-widest">No transactions found for this day</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-8">
          {/* Calendar Widget */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">Interactive Calendar</h3>
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

          {/* User Profile / Security */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">Account Profile</h3>
               <Shield size={16} className="text-emerald-500" />
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <UserIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">Registered Email</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Shield size={18} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter">Saved Password</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {showPassword ? (user.password || 'Not Set') : '••••••••••••'}
                      </p>
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Quick Stats / Targets */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">Monthly Targets</h3>
               <button 
                onClick={() => setIsEditingTargets(!isEditingTargets)}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
               >
                 {isEditingTargets ? <X size={16} /> : <Settings size={16} />}
               </button>
             </div>
             
             <div className="space-y-8">
                {isEditingTargets ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">Savings Goal (₱)</label>
                      <input 
                        type="number"
                        value={tempSavingsGoal}
                        onChange={(e) => setTempSavingsGoal(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">Expense Limit (₱)</label>
                      <input 
                        type="number"
                        value={tempExpenseLimit}
                        onChange={(e) => setTempExpenseLimit(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-sm font-bold"
                      />
                    </div>
                    <button 
                      onClick={handleSaveTargets}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <Check size={14} /> SAVE TARGETS
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Savings Goal</span>
                        <span className="text-xs font-extrabold text-indigo-600">{formatCurrency(savingsGoal)}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${savingsProgress}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-400" 
                        ></motion.div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
                        {savingsProgress >= 100 ? "Goal achieved!" : `Currently at ${savingsProgress.toFixed(0)}% of your savings goal.`}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expense Limit</span>
                        <span className="text-xs font-extrabold text-rose-500">{formatCurrency(expenseLimit)}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${expenseProgress}%` }}
                          className={`h-full ${expenseProgress > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-rose-400 to-orange-300'}`}
                        ></motion.div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">
                        {expenseProgress > 100 ? "Warning: Limit exceeded!" : `You've utilized ${expenseProgress.toFixed(0)}% of your budget.`}
                      </p>
                    </div>
                  </>
                )}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
