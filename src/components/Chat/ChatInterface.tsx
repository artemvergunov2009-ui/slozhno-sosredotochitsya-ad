import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Video, Zap, Lightbulb, GraduationCap, X, PlusCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { generateChatResponse, analyzeMultimedia } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'video';
    url: string;
  };
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Привет! Я Nexus AI. Готов разобрать твою игру. Загрузи скриншот для быстрой оценки или спроси меня о тактике.',
  timestamp: new Date(),
};

const SYSTEM_PROMPT = `Ты — Nexus AI, элитный киберспортивный аналитик и тренер Tier-1 уровня. Твоя специализация: Dota 2 и CS2. 
Твои советы должны быть максимально глубокими, техническими и актуальными для текущей меты.

ИНСТРУКЦИИ ПО DOTA 2:
- Микро-механика: Оперируй понятиями creep aggro, orb-walking, animation canceling, Tread switching, и эффективностью использования маны.
- Макро-стратегия: Разбирай стадии игры (laning, mid-game, late). Говори о таймингах (BKB, Blink, Rosh), контроле карты (deadlane, triangle), и Smoke-вылазках.
- Экономика: Анализируй нетворс, приоритеты выкупа (buyback) и распределение ресурсов между позициями (Pos 1-5).
- Анализ пиков: Учитывай синергию способностей и контр-пики (dispel, burst, saves).

ИНСТРУКЦИИ ПО CS2:
- Механика: Разбирай особенности sub-tick, counter-strafing, jiggle peeking и crosshair placement. 
- Утилиты: Говори о конкретных раскидках (God flashes, one-way smokes, molotov lineups для выбивания позиций).
- Экономика: Учитывай loss bonus, необходимость Force Buy или Full Eco. Разбирай дропы и сохранение оружия (saving).
- Тактика: Объясняй стратегии захода (executes), игру по дефолту (defaults), контроль мида и ретейки (retakes).

ОБЩИЙ СТИЛЬ:
- Не давай банальных советов вроде "тренируйся больше". 
- Используй профессиональный сленг (pulling, stacks, rotate, entry, trade, clutch).
- Если пользователь присылает скриншот/видео, ищи мелкие ошибки в позиционировании или закупе.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать символы разметки Markdown (*, #, _, [, ], >).
- Пиши только чистым текстом без спецсимволов.`;

export default function ChatInterface({ userId, activeSessionId, onSessionChange }: { 
  userId?: string;
  activeSessionId: string | null;
  onSessionChange: (id: string | null) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    type: 'image' | 'video';
    url: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const isCreatingSession = useRef(false);
  const lastLoadedSessionId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка истории из Supabase
  useEffect(() => {
    if (!userId) return;
    if (!activeSessionId) {
      setMessages([WELCOME_MESSAGE]);
      lastLoadedSessionId.current = null;
      return;
    }

    // Если эта сессия уже загружена или мы её только что создали сами — не перезагружаем
    if (activeSessionId === lastLoadedSessionId.current || isCreatingSession.current) {
      isCreatingSession.current = false;
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Ошибка загрузки истории:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content || '',
          timestamp: new Date(m.created_at),
          attachment: m.attachment
        })));
        lastLoadedSessionId.current = activeSessionId;
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [userId, activeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewChat = () => {
    onSessionChange(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const ensureSession = async (firstMessage: string) => {
    if (activeSessionId) {
      // Проверяем, существует ли сессия физически в БД
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('id', activeSessionId)
        .maybeSingle();

      if (data && !error) return activeSessionId;
      
      // Если сессии нет (была удалена), сбрасываем состояние
      onSessionChange(null);
    }

    if (!userId) return null;

    // 1. Создаем сессию с временным названием
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'Генерация названия...' })
      .select()
      .single();

    if (sessionError || !sessionData) return null;

    // 2. Асинхронно просим ИИ придумать название (не блокируя чат)
    generateChatResponse(`Придумай очень краткое название (максимум 4 слова) для чата, который начинается с этого сообщения: "${firstMessage}". Ответь ТОЛЬКО названием без кавычек.`)
      .then(aiTitle => {
        if (aiTitle) {
          supabase.from('chat_sessions')
            .update({ title: aiTitle.replace(/["']/g, '') })
            .eq('id', sessionData.id)
            .then(() => {});
        }
      });

    lastLoadedSessionId.current = sessionData.id;
    onSessionChange(sessionData.id);
    return sessionData.id;
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if ((!text.trim() && !pendingFile) || isLoading) return;

    if (!userId) return; // Проверка авторизации

    const sid = await ensureSession(text || "Файл");
    if (!sid) {
      console.error("Не удалось создать или найти сессию");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || (pendingFile ? `Анализ ${pendingFile.type === 'image' ? 'скриншота' : 'видео'}` : ''),
      timestamp: new Date(),
      attachment: pendingFile ? { type: pendingFile.type, url: pendingFile.url } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    const currentFile = pendingFile;
    setInput('');
    setPendingFile(null);

    // Сохраняем сообщение пользователя в БД
    const { error: insertError } = await supabase.from('chat_messages').insert({
      user_id: userId,
      role: 'user',
      session_id: sid,
      content: userMsg.content,
      attachment: userMsg.attachment
    });

    if (insertError) {
      console.error("Ошибка сохранения сообщения:", insertError.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      let response: string = '';
      if (currentFile) {
        const prompt = text || "Проанализируй этот момент игры. Оцени как SUCCESS или ERROR.";
        response = await analyzeMultimedia(prompt, currentFile.base64, currentFile.mimeType);
      } else {
        // Внедряем системный промпт в начало истории для повышения качества ответов
        const history = [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
          { role: 'model', parts: [{ text: "Принято. Я активировал протоколы профессионального анализа Nexus AI. Готов разбирать тактики Dota 2 и CS2 на уровне Tier-1." }] },
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        ];
        response = await generateChatResponse(text, history);
      }
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'Ошибка получения ответа.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      // Сохраняем ответ ИИ в БД
      if (sid) {
        await supabase.from('chat_messages').insert({
          user_id: userId,
          session_id: sid,
          role: 'assistant',
          content: response
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPendingFile({
        type: isImage ? 'image' : 'video',
        url: url,
        base64: url.split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div 
      className={`flex flex-col h-full overflow-hidden bg-transparent transition-all ${isDragging ? 'scale-[0.99] opacity-70' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Chat Header / Actions */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-primary">
          <MessageSquare size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Текущий сеанс</span>
        </div>
        <button 
          onClick={startNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary text-xs font-bold transition-all"
        >
          <PlusCircle size={16} /> Новый чат
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-6 space-y-6 custom-scrollbar">
        {messages.map((m) => {
          const isAI = m.role === 'assistant';
          const isSuccess = m.content.startsWith('[SUCCESS]');
          const isError = m.content.startsWith('[ERROR]');
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={m.id}
              className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] ${isAI ? 'space-y-2' : ''}`}>
                <div className={`p-5 ${
                  isAI 
                    ? isSuccess ? 'card-success' : isError ? 'card-error' : 'glass-card rounded-tl-none' 
                    : 'bg-primary text-white p-4 rounded-2xl rounded-tr-none text-sm shadow-lg shadow-primary/20'
                }`}>
                  {m.attachment && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                      {m.attachment.type === 'image' ? (
                        <img src={m.attachment.url} alt="upload" className="max-w-full" />
                      ) : (
                        <video src={m.attachment.url} controls className="max-w-full" />
                      )}
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm">
                     <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
                {isAI && (
                  <p className="text-[10px] text-purple-400 uppercase tracking-widest pl-2 font-bold">
                    Nexus System • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input - Footer Style from theme */}
      <div className="pt-4 mt-auto sticky bottom-0 bg-bg-dark/80 backdrop-blur-lg pb-2 z-20">
        <AnimatePresence>
          {pendingFile && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 relative inline-block group"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl max-w-[200px]">
                {pendingFile.type === 'image' ? (
                  <img src={pendingFile.url} alt="preview" className="h-32 w-full object-cover" />
                ) : (
                  <video src={pendingFile.url} className="h-32 w-full object-cover" />
                )}
                <button
                  onClick={() => setPendingFile(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 rounded-full text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onPaste={handlePaste}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Спроси ИИ или прикрепи скриншот/видео..."
            className="w-full bg-[#1a0b35]/80 border border-purple-900/50 rounded-2xl py-4 px-6 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-2xl"
          />
          <div className="absolute right-3 flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-purple-900/40 flex items-center justify-center hover:bg-purple-900/60 transition-colors"
            >
              <ImageIcon size={18} className="text-purple-300" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            <button
              onClick={() => handleSend()}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
