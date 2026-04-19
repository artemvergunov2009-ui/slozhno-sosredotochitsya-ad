import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Circle, Trophy, Loader2, Target, Sword } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateAITrainingPlan } from '../../services/gemini';

interface ScheduleItem {
  day: string;
  task: string;
  duration: string;
  focal: string;
  completed: boolean;
}

export default function TrainingPlan() {
  const [game, setGame] = useState<'CS2' | 'Dota 2'>('CS2');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlan = async (selectedGame: string) => {
    setLoading(true);
    const data = await generateAITrainingPlan(selectedGame);
    if (data) {
      setSchedule(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlan(game);
  }, []);

  const toggleComplete = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].completed = !newSchedule[index].completed;
    setSchedule(newSchedule);
  };

  const completedCount = schedule.filter(s => s.completed).length;
  const progress = schedule.length > 0 ? Math.round((completedCount / schedule.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <button 
          onClick={() => { setGame('CS2'); loadPlan('CS2'); }}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${game === 'CS2' ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
        >
          <Target size={18} /> CS2
        </button>
        <button 
          onClick={() => { setGame('Dota 2'); loadPlan('Dota 2'); }}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${game === 'Dota 2' ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
        >
          <Sword size={18} /> Dota 2
        </button>
      </div>

      <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-primary/20 to-transparent border-primary/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Trophy className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Прогресс недели: {progress}%</h3>
            <p className="text-sm text-slate-400">
              {game === 'CS2' ? 'Твой путь к Global Elite' : 'Твой путь к рангу Immortal'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => loadPlan(game)}
          disabled={loading}
          className="btn-shimmer text-white uppercase text-xs tracking-widest flex items-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />} Обновить план ИИ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 relative">
        {loading && (
          <div className="absolute inset-0 bg-bg-dark/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 rounded-2xl">
            <Loader2 className="text-primary animate-spin" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Составляем план...</p>
          </div>
        )}

        {schedule.length > 0 ? schedule.map((s, i) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            onClick={() => toggleComplete(i)}
            className={`glass-card p-4 flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer ${s.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-6">
              <span className="text-lg font-black text-slate-500 w-10">{s.day}</span>
              <div className="h-10 w-[2px] bg-white/5" />
              <div>
                <p className="font-bold text-slate-200">{s.task}</p>
                <div className="flex gap-4 mt-1 text-xs text-slate-500 uppercase font-bold">
                   <span className="flex items-center gap-1"><Calendar size={12} /> {s.duration}</span>
                   <span className="text-primary">Фокус: {s.focal}</span>
                </div>
              </div>
            </div>
            {s.completed ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <Circle className="text-slate-700 group-hover:text-primary transition-colors" />
            )}
          </motion.div>
        )) : !loading && (
          <div className="p-12 text-center glass-card border-dashed border-white/10">
             <Calendar className="mx-auto text-slate-600 mb-4" size={48} />
             <p className="text-slate-400">Нажмите кнопку выше, чтобы ИИ составил план тренировок для {game}</p>
          </div>
        )}
      </div>
    </div>
  );
}
