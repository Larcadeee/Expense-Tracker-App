
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType, IncomeSource, ExpenseCategory } from '../types.ts';
import { INCOME_SOURCES, EXPENSE_CATEGORIES } from '../constants.ts';
import { Plus, Trash2, X, Download, Printer, Save, Rows, Loader2 } from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (ts: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  onDelete: (id: string) => void;
}

interface DraftEntry {
  tempId: string;
  type: TransactionType;
  amount: string;
  category: IncomeSource | ExpenseCategory;
  date: string;
  notes: string;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startAdding = () => {
    setIsAdding(true);
    setDrafts([{
      tempId: Math.random().toString(36),
      type: TransactionType.EXPENSE,
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }]);
  };

  const addRow = () => {
    setDrafts([...drafts, {
      tempId: Math.random().toString(36),
      type: TransactionType.EXPENSE,
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }]);
  };

  const removeRow = (tempId: string) => {
    if (drafts.length === 1) {
      setIsAdding(false);
      setDrafts([]);
      return;
    }
    setDrafts(drafts.filter(d => d.tempId !== tempId));
  };

  const updateDraft = (tempId: string, fields: Partial<DraftEntry>) => {
    setDrafts(drafts.map(d => {
      if (d.tempId === tempId) {
        const updated = { ...d, ...fields };
        if (fields.type && fields.type !== d.type) {
          updated.category = fields.type === TransactionType.INCOME ? INCOME_SOURCES[0] : EXPENSE_CATEGORIES[0];
        }
        return updated;
      }
      return d;
    }));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDrafts = drafts.filter(d => d.amount && parseFloat(d.amount) > 0);
    if (validDrafts.length === 0) return;

    setIsSubmitting(true);
    const payload = validDrafts.map(d => ({
      type: d.type,
      amount: parseFloat(d.amount),
      category: d.category,
      date: d.date,
      notes: d.notes,
      userId: ''
    }));

    await onAdd(payload);
    setIsSubmitting(false);
    setIsAdding(false);
    setDrafts([]);
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
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">History</h2>
          <p className="text-slate-500 font-medium text-sm">Review or audit your financial activity.</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button onClick={exportToCSV} title="Export CSV" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Download size={20} /></button>
          <button onClick={() => window.print()} title="Print Report" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Printer size={20} /></button>
          <button 
            onClick={isAdding ? () => setIsAdding(false) : startAdding} 
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all ${isAdding ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow-indigo-100'}`}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />} {isAdding ? 'Cancel' : 'Add Multiple'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            onSubmit={handleSubmitAll} 
            className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 no-print overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <Rows size={14}/> Batch Entry Mode
              </h3>
              <p className="text-[10px] font-bold text-indigo-500 uppercase">Adding {drafts.length} item{drafts.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {drafts.map((draft) => (
                <div key={draft.tempId} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 bg-slate-50 rounded-2xl relative group border border-transparent hover:border-indigo-100 transition-all">
                  <div className="md:col-span-2">
                    <select 
                      value={draft.type} 
                      onChange={(e) => updateDraft(draft.tempId, { type: e.target.value as TransactionType })}
                      className={`w-full p-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black tracking-tight outline-none ${draft.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      <option value={TransactionType.EXPENSE}>EXPENSE</option>
                      <option value={TransactionType.INCOME}>INCOME</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">₱</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full pl-7 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                      value={draft.amount}
                      onChange={(e) => updateDraft(draft.tempId, { amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <select 
                      value={draft.category} 
                      onChange={(e) => updateDraft(draft.tempId, { category: e.target.value as any })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      {(draft.type === TransactionType.INCOME ? INCOME_SOURCES : EXPENSE_CATEGORIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input 
                      type="date" 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      value={draft.date}
                      onChange={(e) => updateDraft(draft.tempId, { date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input 
                      type="text" 
                      placeholder="Notes..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                      value={draft.notes}
                      onChange={(e) => updateDraft(draft.tempId, { notes: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => removeRow(draft.tempId)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={addRow}
                className="flex-1 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Row
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save All Entries
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">Date</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">Category</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase">Notes</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] tracking-widest text-slate-400 font-extrabold uppercase text-right no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-medium">No records found.</td></tr>
              ) : (
                [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="group hover:bg-slate-50/40 transition-colors">
                    <td className="px-8 py-6 text-xs font-bold text-slate-500">{new Date(t.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-600 shadow-sm">{t.category}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-slate-400 max-w-[200px] truncate">{t.notes || '-'}</p>
                    </td>
                    <td className={`px-8 py-6 text-sm font-black text-right ${t.type === TransactionType.EXPENSE ? 'text-slate-900' : 'text-emerald-600'}`}>
                      {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-8 py-6 text-right no-print">
                      <button onClick={() => onDelete(t.id)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
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
