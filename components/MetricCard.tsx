
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  icon?: LucideIcon;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, variant = 'primary', icon: Icon }) => {
  const themes = {
    primary: 'from-indigo-600 to-blue-600 text-white',
    success: 'from-emerald-500 to-teal-500 text-white',
    warning: 'from-rose-500 to-orange-500 text-white',
    info: 'from-slate-800 to-slate-900 text-white'
  };

  const shadowColor = {
    primary: 'shadow-indigo-200',
    success: 'shadow-emerald-200',
    warning: 'shadow-rose-200',
    info: 'shadow-slate-200'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden bg-gradient-to-br ${themes[variant]} p-6 rounded-3xl shadow-xl ${shadowColor[variant]} transition-all`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        {Icon && <Icon size={80} />}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon size={16} className="opacity-80" />}
          <span className="text-[10px] font-extrabold tracking-[0.2em] uppercase opacity-80">{label}</span>
        </div>
        
        <h3 className="text-3xl font-extrabold tracking-tight">
          {value}
        </h3>
        
        {subValue && (
          <p className="text-xs mt-2 font-medium opacity-80">{subValue}</p>
        )}
      </div>
      
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </motion.div>
  );
};

export default MetricCard;
