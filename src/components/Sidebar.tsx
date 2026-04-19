import React, { useState } from 'react';
import { 
  BarChart3, 
  Lightbulb, 
  Calendar, 
  Search, 
  HelpCircle, 
  Settings, 
  Layout, 
  History, 
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SidebarSection = 
  | 'chat' 
  | 'tips' 
  | 'stats' 
  | 'training' 
  | 'review' 
  | 'quizzes' 
  | 'history' 
  | 'settings' 
  | 'themes' 
  | 'support';

interface SidebarProps {
  activeSection: SidebarSection;
  setActiveSection: (section: SidebarSection) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  username: string;
  userRole: string;
}

export default function Sidebar({ activeSection, setActiveSection, isOpen, setIsOpen, username, userRole }: SidebarProps) {
  const menuItems = [
    { id: 'chat', label: 'Чат с ИИ', icon: MessageSquare },
    { id: 'tips', label: 'Советы на сегодня', icon: Lightbulb },
    { id: 'stats', label: 'Анализ статистики', icon: BarChart3 },
    { id: 'training', label: 'План тренировок', icon: Calendar },
    { id: 'review', label: 'Разбор последней игры', icon: Search },
    { id: 'quizzes', label: 'Мини-квизы', icon: Gamepad2 },
    { id: 'history', label: 'История чата', icon: History },
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'themes', label: 'Дизайн / Темы', icon: Layout },
    { id: 'support', label: 'Помощь / Поддержка', icon: HelpCircle },
  ];

  // Проверка на админа теперь простая
  const isAdmin = userRole === 'admin';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className="h-screen bg-bg-sidebar border-r border-purple-900/50 flex flex-col relative z-50 pt-6"
    >
      <div className="px-5 flex items-center justify-between mb-8">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div 
                onClick={() => setActiveSection('chat')}
                className="w-8 h-8 rounded-lg bg-primary shadow-[0_0_15px_var(--primary)] cursor-pointer"
              ></div>
              <h1 
                onClick={() => setActiveSection('chat')}
                className="font-bold text-xl tracking-tight text-white uppercase italic cursor-pointer hover:text-primary transition-colors"
              >
                AI INSTRUCTOR
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-purple-400"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SidebarSection)}
              className={cn(
                "sidebar-item w-full transition-all duration-300 relative group",
                isActive ? "active" : "text-slate-400"
              )}
            >
              <Icon size={22} className={cn("min-w-[22px]", isActive && "text-primary")} />
              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-bg-card rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-white/10 backdrop-blur-md border border-white/10">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 border-2 border-primary/30 overflow-hidden">
             <img src="https://picsum.photos/seed/gamer/100" alt="avatar" />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{username}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                {userRole}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
