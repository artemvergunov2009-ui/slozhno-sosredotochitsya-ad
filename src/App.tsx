import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/Auth/AuthForm';
import Sidebar, { SidebarSection } from './components/Sidebar';
import ChatInterface from './components/Chat/ChatInterface';
import StatsAnalysis from './components/Modules/StatsAnalysis';
import TrainingPlan from './components/Modules/TrainingPlan';
import PerformanceGap from './components/PerformanceGap';
import SupportModule from './SupportModule';
import MiniQuizzes from './components/Modules/MiniQuizzes';
import Themes, { themes } from './components/Modules/Themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, Zap, Settings, LogOut, History as HistoryIcon, MessageSquare, Clock, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { saveSteamId } from './services/steam';
import { generateDailyTip } from './services/gemini';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

function App() {
  const [activeSection, setActiveSection] = useState<SidebarSection>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [init, setInit] = useState(false);
  const [userRole, setUserRole] = useState<string>('gamer');
  const [steamId, setSteamId] = useState<string | null>(null);
  const [tempSteamId, setTempSteamId] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>(localStorage.getItem('nexus-theme') || 'nexus');
  const [dailyTip, setDailyTip] = useState<string>(localStorage.getItem('nexus-daily-tip') || '');

  useEffect(() => {
    const lastTipDate = localStorage.getItem('nexus-daily-tip-date');
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const fetchTip = async () => {
      const tip = await generateDailyTip();
      if (tip) {
        const cleanedTip = tip.trim();
        setDailyTip(cleanedTip);
        localStorage.setItem('nexus-daily-tip', cleanedTip);
        localStorage.setItem('nexus-daily-tip-date', now.toString());
      }
    };

    if (!dailyTip || !lastTipDate || (now - parseInt(lastTipDate)) > twentyFourHours) {
      fetchTip();
    }
  }, []);

  useEffect(() => {
    const theme = themes.find(t => t.id === currentTheme) || themes[0];
    localStorage.setItem('nexus-theme', currentTheme);
    
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--bg-dark', theme.colors['bg-dark']);
    root.style.setProperty('--bg-sidebar', theme.colors['bg-sidebar']);
    root.style.setProperty('--card-bg', theme.colors['card-bg']);
    root.style.setProperty('--text-main', theme.colors['text-main']);
    root.style.setProperty('--border-accent', theme.colors['border-color']);
    root.style.setProperty('--glow-strength', theme.colors['glow-intensity']);
    root.style.fontFamily = theme.colors.font;
  }, [currentTheme]);

  const fetchSessions = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setChatSessions(data);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Чтобы не переходить в чат при нажатии на удаление
    setSessionToDelete(sessionId);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionToDelete);

    if (!error) {
      if (selectedSessionId === sessionToDelete) setSelectedSessionId(null);
      fetchSessions();
    }
    setSessionToDelete(null);
  };

  useEffect(() => {
    if (activeSection === 'history') fetchSessions();
  }, [activeSection]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, steam_id')
      .eq('id', userId)
      .single();
    
    if (data && !error) {
      setUserRole(data.role);
      setSteamId(data.steam_id);
    }
  };

  useEffect(() => {
    // Проверяем текущую сессию при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user.id);
      setInit(true);
    });

    // Слушаем изменения (вход/выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserRole('gamer');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Определяем имя пользователя здесь, чтобы оно было доступно всему компоненту
  const displayUsername = session?.user?.user_metadata?.username || 
                          session?.user?.email?.split('@')[0] || 'Gamer';

  const renderContent = () => {
    switch (activeSection) {
      case 'chat':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2 flex flex-col h-full">
              <ChatInterface 
                userId={session?.user?.id} 
                activeSessionId={selectedSessionId}
                onSessionChange={setSelectedSessionId}
              />
            </div>
            <div className="hidden lg:block space-y-6 overflow-y-auto custom-scrollbar pr-2">
              <PerformanceGap />
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Lightbulb className="text-yellow-400" />
                   Краткий совет
                </h3>
                <p className="text-sm text-slate-400">
                  {dailyTip || 'Загрузка совета дня от ИИ...'}
                </p>
              </div>
            </div>
          </div>
        );
      case 'tips':
        return (
          <div className="glass-card p-12 text-center space-y-8 max-w-3xl mx-auto">
            <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
              <Lightbulb size={48} className="text-yellow-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Совет дня от Nexus AI</h2>
              <div className="p-8 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                <p className="text-xl text-slate-200 leading-relaxed italic">
                  "{dailyTip || 'Генерируем мудрость...'}"
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
              <Sparkles size={12} className="text-primary" /> Обновляется каждые 24 часа
            </p>
          </div>
        );
      case 'stats':
        return <StatsAnalysis steamId={steamId} userId={session?.user?.id} />;
      case 'training':
        return <TrainingPlan />;
      case 'quizzes':
        return <MiniQuizzes />;
      case 'themes':
        return <Themes currentTheme={currentTheme} onSelect={setCurrentTheme} />;
      case 'support':
        return <SupportModule currentUser={displayUsername} userRole={userRole} />;
      case 'history':
        return (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <HistoryIcon size={24} className="text-primary" /> История всех переписок
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatSessions.length > 0 ? chatSessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    setActiveSection('chat');
                  }}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/50 transition-all text-left group cursor-pointer relative"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={18} className="text-primary" />
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase font-bold tracking-widest">
                      <Clock size={10} /> {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <h4 className="font-bold text-sm text-slate-200 group-hover:text-primary transition-colors line-clamp-2">
                    {s.title}
                  </h4>
                </div>
              )) : (
                <div className="col-span-full p-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                   <p className="text-slate-500">У вас пока нет сохраненных чатов.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="glass-card p-8 max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="text-primary" /> Настройки профиля
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm text-slate-400 mb-1">Email аккаунта</p>
                <p className="font-medium text-white">{session?.user?.email}</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <p className="text-sm text-slate-400">Связь со Steam (SteamID64)</p>
                <div className="flex gap-2">
                  <input 
                    value={tempSteamId || steamId || ''}
                    onChange={(e) => setTempSteamId(e.target.value)}
                    placeholder="7656119xxxxxxxxxx"
                    className="flex-1 bg-black/40 border border-purple-900/30 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary"
                  />
                  <button 
                    onClick={async () => {
                      if (session?.user?.id && tempSteamId) {
                        await saveSteamId(session.user.id, tempSteamId);
                        setSteamId(tempSteamId);
                      }
                    }}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/80 transition-all"
                  >
                    Сохранить
                  </button>
                </div>
              </div>

              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 rounded-xl transition-all font-bold group"
              >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" /> Выйти из аккаунта
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
             <Search size={64} className="text-primary/30 animate-pulse" />
             <h2 className="text-3xl font-bold uppercase tracking-widest text-primary">Раздел "{activeSection}"</h2>
             <p className="text-slate-400 max-w-md">Данный функционал находится в разработке Nexus AI. Ожидайте обновления с поддержкой Steam Stats v2.0.</p>
             <button 
               onClick={() => setActiveSection('chat')}
               className="btn-shimmer text-white !px-12 py-3 rounded-full uppercase tracking-wider font-black"
             >
               Вернуться в штаб
             </button>
          </div>
        );
    }
  };

  if (!init) return null; // Ждем инициализации

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-dark text-[#e9d5ff] overflow-hidden font-sans">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        username={displayUsername}
        userRole={userRole}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="p-4 flex gap-3 justify-center border-b border-purple-900/20 bg-[#0c051a]/50 backdrop-blur-md z-10">
          <button onClick={() => setActiveSection('chat')} className="px-4 py-2 rounded-full glass-card text-xs hover:bg-purple-900/40 transition flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Анализ последней игры
          </button>
          <button onClick={() => setActiveSection('tips')} className="px-4 py-2 rounded-full glass-card text-xs hover:bg-purple-900/40 transition flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-400" /> Советы на сегодня
          </button>
          <button onClick={() => setActiveSection('training')} className="px-4 py-2 rounded-full glass-card text-xs hover:bg-purple-900/40 transition flex items-center gap-2">
            <Search size={14} className="text-primary" /> Обучи меня
          </button>
        </header>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Кастомное модальное окно удаления */}
      <AnimatePresence>
        {sessionToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-8 max-w-sm w-full text-center space-y-6 border-red-500/30"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/50">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Удалить чат?</h3>
                <p className="text-slate-400 text-sm">Это действие нельзя отменить. Все сообщения этой сессии будут стерты из базы.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSessionToDelete(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors font-bold text-sm text-slate-300"
                >
                  Отмена
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-colors font-bold text-sm text-white shadow-lg shadow-red-500/20"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;