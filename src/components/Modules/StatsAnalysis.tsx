import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Skull, Zap, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { fetchSteamUserStats, SteamStats } from '../../services/steam';

const data = [
  { name: 'Mon', kd: 0.8, dmg: 65, win: 0.4 },
  { name: 'Tue', kd: 1.1, dmg: 72, win: 0.6 },
  { name: 'Wed', kd: 0.9, dmg: 68, win: 0.5 },
  { name: 'Thu', kd: 1.3, dmg: 85, win: 0.7 },
  { name: 'Fri', kd: 1.2, dmg: 80, win: 0.65 },
  { name: 'Sat', kd: 1.5, dmg: 95, win: 0.8 },
  { name: 'Sun', kd: 1.4, dmg: 90, win: 0.75 },
];

export default function StatsAnalysis({ steamId, userId }: { steamId: string | null, userId?: string }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SteamStats | null>(null);

  const loadStats = async (id: string) => {
    setLoading(true);
    const result = await fetchSteamUserStats(id);
    if (result) setStats(result);
    setLoading(false);
  };

  useEffect(() => {
    if (steamId) loadStats(steamId);
  }, [steamId]);

  if (!steamId) {
    return (
      <div className="glass-card p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-white/10">
          <Skull size={40} className="text-slate-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Статистика не подключена</h2>
          <p className="text-slate-400 max-w-sm mx-auto">Пожалуйста, перейдите в раздел <b>Настройки</b> и укажите ваш SteamID64 для активации мониторинга.</p>
        </div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Steam API v2.0 Integration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="absolute inset-0 bg-bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <Loader2 className="text-primary animate-spin" size={48} />
        </div>
      )}
      
      <div className="flex items-center justify-between glass-card p-4">
        <div className="flex items-center gap-4">
          <img src={stats?.avatar} className="w-12 h-12 rounded-full border-2 border-primary/50" alt="avatar" />
          <div>
            <h3 className="font-bold text-lg">{stats?.playerName}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">CS2 Profile Active</p>
          </div>
        </div>
        <button onClick={() => steamId && loadStats(steamId)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'K/D Ratio', val: stats?.kd || '0.00', icon: Skull, color: '#8b5cf6' },
          { label: 'Avg Damage', val: stats?.adr ? stats.adr.toFixed(1) : '0.0', icon: Zap, color: '#f59e0b' },
          { label: 'Win Rate', val: (stats?.winRate || 0) + '%', icon: TrendingUp, color: '#10b981' },
          { label: 'Headshot', val: (stats?.hsPercent || 0) + '%', icon: Target, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">{s.label}</p>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black">{s.val}</span>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Динамика K/D
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorKd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#8b5cf6' }}
              />
              <Area type="monotone" dataKey="kd" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorKd)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 h-[400px]">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Zap size={20} className="text-primary" />
            Средний урон (ADR)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#f59e0b' }}
              />
              <Line type="monotone" dataKey="dmg" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
