
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, IncomeSource, ExpenseCategory } from '../types.ts';
import { INCOME_SOURCES, EXPENSE_CATEGORIES } from '../constants.ts';
import { Plus, Trash2, X, ChevronDown, Download, Printer } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeSource | ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    onAdd({
      type,
      amount: parseFloat(amount),
      category,
      date,
      notes,
      userId: ''
    });

    setIsAdding(false);
    setAmount('');
    setNotes('');
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === TransactionType.INCOME ? INCOME_SOURCES[0] : EXPENSE_CATEGORIES[0]);
  };

  const formatCurrency = (val: number) => `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Amount (PHP)', 'Notes'];
    const rows = transactions.map(t => [t.date, t.type, t.category, t.amount.toString(), (t.notes || '').replace(/,/g, ' ')]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Transaction History</h2>
          <p className="text-slate-500 font-medium text-sm">Detailed record of your finances.</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button onClick={exportToCSV} className="p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-50 shadow-sm"><Download size={20} /></button>
          <button onClick={() => window.print()} className="p-3 bg-white border border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-50 shadow-sm"><Printer size={20} /></button>
          <button onClick={() => setIsAdding(!isAdding)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg ${isAdding ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-indigo-200'}`}>
            {isAdding ? <X size={18} /> : <Plus size={18} />} {isAdding ? 'Close' : 'New Entry'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 no-print">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl">
              <button type="button" onClick={() => handleTypeChange(TransactionType.EXPENSE)} className={`flex-1 py-3 text-xs tracking-widest font-extrabold rounded-xl ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>EXPENSE</button>
              <button type="button" onClick={() => handleTypeChange(TransactionType.INCOME)} className={`flex-1 py-3 text-xs tracking-widest font-extrabold rounded-xl ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>INCOME</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Amount (₱)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-300">₱</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-extrabold" placeholder="0.00" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold appearance-none">
                    {(type === TransactionType.INCOME ? INCOME_SOURCES : EXPENSE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" required />
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl" placeholder="Notes" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-extrabold shadow-lg shadow-indigo-100">RECORD</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">Date</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">Details</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase text-right no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">No transactions yet.</td></tr>
              ) : (
                [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="group hover:bg-slate-50/40">
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{new Date(t.date).toLocaleDateString('en-PH')}</td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-900">{t.category}</p>
                      {t.notes && <p className="text-[10px] text-slate-400 font-medium">{t.notes}</p>}
                    </td>
                    <td className={`px-8 py-6 text-sm font-extrabold text-right ${t.type === TransactionType.EXPENSE ? 'text-slate-900' : 'text-emerald-600'}`}>
                      {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-8 py-6 text-right no-print">
                      <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
