import React from 'react';
import { motion } from 'framer-motion';
import { Palette, CheckCircle2, Sparkles } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    'bg-dark': string;
    'bg-sidebar': string;
    'card-bg': string;
    'text-main': string;
    'border-color': string;
    'glow-intensity': string;
    font: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'nexus',
    name: 'Nexus Classic',
    description: 'Стандартный футуристичный фиолетовый',
    preview: 'from-purple-600 to-indigo-600',
    colors: {
      primary: '#a855f7',
      'bg-dark': '#0c051a',
      'bg-sidebar': '#080312',
      'card-bg': 'rgba(24, 12, 44, 0.6)',
      'text-main': '#e9d5ff',
      'border-color': 'rgba(168, 85, 247, 0.3)',
      'glow-intensity': '15px',
      font: "'Inter', sans-serif",
    }
  },
  {
    id: 'toxic',
    name: 'Toxic Viper',
    description: 'Кислотный зеленый для хардкорных игроков',
    preview: 'from-lime-400 to-emerald-600',
    colors: {
      primary: '#84cc16',
      'bg-dark': '#050a02',
      'bg-sidebar': '#020501',
      'card-bg': 'rgba(15, 25, 10, 0.8)',
      'text-main': '#d9f99d',
      'border-color': 'rgba(132, 204, 22, 0.4)',
      'glow-intensity': '20px',
      font: "'JetBrains Mono', monospace",
    }
  },
  {
    id: 'ghost',
    name: 'Ghost Protocol',
    description: 'Минималистичный stealth-режим',
    preview: 'from-slate-300 to-slate-500',
    colors: {
      primary: '#94a3b8',
      'bg-dark': '#0f172a',
      'bg-sidebar': '#1e293b',
      'card-bg': 'rgba(30, 41, 59, 0.5)',
      'text-main': '#f1f5f9',
      'border-color': 'rgba(255, 255, 255, 0.1)',
      'glow-intensity': '0px',
      font: "'Plus Jakarta Sans', sans-serif",
    }
  },
  {
    id: 'blood',
    name: 'Abyssal Rage',
    description: 'Агрессивный черно-красный интерфейс',
    preview: 'from-red-600 to-black',
    colors: {
      primary: '#ef4444',
      'bg-dark': '#0a0000',
      'bg-sidebar': '#120000',
      'card-bg': 'rgba(30, 0, 0, 0.6)',
      'text-main': '#fecaca',
      'border-color': 'rgba(239, 68, 68, 0.3)',
      'glow-intensity': '25px',
      font: "'Oswald', sans-serif",
    }
  },
  {
    id: 'gold',
    name: 'Elite Nova',
    description: 'Премиальный золотой для чемпионов',
    preview: 'from-yellow-400 to-amber-700',
    colors: {
      primary: '#fbbf24',
      'bg-dark': '#0c0a09',
      'bg-sidebar': '#1c1917',
      'card-bg': 'rgba(41, 37, 36, 0.7)',
      'text-main': '#fef3c7',
      'border-color': 'rgba(251, 191, 36, 0.2)',
      'glow-intensity': '10px',
      font: "'Inter', sans-serif",
    }
  }
];

export default function Themes({ currentTheme, onSelect }: { currentTheme: string, onSelect: (id: string) => void }) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_30px_var(--primary)]"
        >
          <Sparkles className="text-primary" size={40} />
        </motion.div>
        <h2 className="text-4xl font-black uppercase tracking-tighter italic">
          <Palette className="text-primary" /> Кастомизация интерфейса
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`glass-card p-6 text-left transition-all relative overflow-hidden group ${
              currentTheme === theme.id ? 'border-primary ring-1 ring-primary/50' : 'hover:border-white/20'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.preview} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.preview} shadow-lg shadow-black/20`} />
              {currentTheme === theme.id && <CheckCircle2 className="text-primary" />}
            </div>
            <h3 className="text-lg font-bold mb-1">{theme.name}</h3>
            <p className="text-sm text-slate-400">{theme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}