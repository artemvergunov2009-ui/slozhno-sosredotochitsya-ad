import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, XCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { generateAIQuiz } from '../../services/gemini';

interface QuizData {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function MiniQuizzes() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);

  const loadNewQuiz = async () => {
    setIsLoading(true);
    setSelected(null);
    setShowResult(false);
    const data = await generateAIQuiz();
    if (data) setQuiz(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNewQuiz();
  }, []);

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    setShowResult(true);
    if (idx === quiz?.correct) {
      setScore(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-primary/20 rounded-2xl mb-4 border border-primary/30 text-primary">
          <Brain size={32} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight">AI Тренажер Знаний</h2>
        <p className="text-slate-400">Проверь свою игровую теорию, пока ждешь матч.</p>
      </div>

      <div className="glass-card p-8 space-y-8 relative overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-primary animate-spin" size={40} />
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">ИИ генерирует испытание...</p>
          </div>
        ) : quiz ? (
          <>
            <div className="space-y-4">
               <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Новое испытание</span>
               <h3 className="text-xl font-bold">{quiz.question}</h3>
            </div>

            <div className="space-y-3">
              {quiz.options.map((opt, i) => {
                const isCorrect = i === quiz.correct;
                const isSelected = selected === i;

                return (
                  <button
                    key={i}
                    disabled={showResult}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                      showResult
                        ? isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                          : isSelected
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-500'
                          : 'bg-white/5 border-white/5 opacity-50'
                        : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt}</span>
                      {showResult && isCorrect && <CheckCircle size={18} />}
                      {showResult && isSelected && !isCorrect && <XCircle size={18} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-10 space-y-4">
            <XCircle size={40} className="text-rose-500 mx-auto" />
            <p className="text-slate-400">Не удалось загрузить квиз. Попробуйте еще раз.</p>
            <button onClick={loadNewQuiz} className="btn-primary">Повторить</button>
          </div>
        )}

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <p className="text-sm font-medium text-slate-300 mb-4 tracking-wide">
                <span className="text-primary font-bold">Nexus ИИ поясняет:</span> {quiz.explanation}
              </p>
              <button 
                onClick={loadNewQuiz}
                className="btn-shimmer text-white w-full py-3 uppercase text-xs font-black tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Следующий вопрос
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500">
         <div className="flex items-center gap-2">
           <Trophy size={14} className="text-yellow-500" />
           Правильных ответов: {score}
         </div>
      </div>
    </div>
  );
}
