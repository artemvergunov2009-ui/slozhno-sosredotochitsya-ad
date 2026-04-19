import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, TrendingUp, Shield } from 'lucide-react';

interface MetricProps {
  label: string;
  userValue: number;
  proValue: number;
  unit: string;
  icon: React.ReactNode;
}

const Metric = ({ label, userValue, proValue, unit, icon }: MetricProps) => {
  const percentage = (userValue / proValue) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-right">
          <p className="font-bold text-xs text-purple-300">
            {userValue}{unit} vs {proValue}{unit}
          </p>
        </div>
      </div>
      <div className="pro-gap-bar">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          className="pro-gap-fill"
        />
      </div>
    </div>
  );
};

export default function PerformanceGap() {
  return (
    <div className="glass-card p-6 space-y-8">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <TrendingUp className="text-primary" />
        <h2 className="text-xl font-bold uppercase tracking-tight">Performance Gap (vs s1mple)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Metric 
          label="Damage Per Round" 
          userValue={72} 
          proValue={88} 
          unit="" 
          icon={<Zap size={16} />} 
        />
        <Metric 
          label="HS Accuracy" 
          userValue={42} 
          proValue={65} 
          unit="%" 
          icon={<Target size={16} />} 
        />
        <Metric 
          label="Survival Rate" 
          userValue={31} 
          proValue={45} 
          unit="%" 
          icon={<Shield size={16} />} 
        />
        <Metric 
          label="Kill / Death" 
          userValue={0.92} 
          proValue={1.35} 
          unit="" 
          icon={<TrendingUp size={16} />} 
        />
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <p className="text-sm italic text-slate-300">
          Анализ ИИ: Твой урон в раунде стабилен, но процент выживаемости на 14% ниже идеала. 
          Саша (s1mple) играет более сейвово. Сосредоточься на позиционировании после первого фрага.
        </p>
      </div>
    </div>
  );
}
