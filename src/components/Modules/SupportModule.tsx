import React, { useState } from 'react';
import { Heart, Search, User, ShieldCheck, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMINS = ["Wnsuuu", "MrNewton", "Youngpbbitch!", "IT.Moscow"];

export default function SupportModule({ currentUser = "Wnsuuu" }) {
  const isAdmin = ADMINS.includes(currentUser);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const mockUsers = [
    { name: "Gamer123", status: "online", lastMsg: "Как настроить Steam?", time: "12:45" },
    { name: "ProSkill", status: "offline", lastMsg: "План не обновился.", time: "10:20" },
    { name: "JohnDoe", status: "online", lastMsg: "Спасибо за вчерашний разбор!", time: "Вчера" },
  ];

  return (
    <div className="h-full flex gap-6">
      {/* User Support View (Standard) */}
      {!isAdmin && (
        <div className="flex-1 flex flex-col gap-6">
          <div className="glass-card p-8 text-center space-y-4">
             <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-primary/50">
               <Mail size={40} className="text-primary" />
             </div>
             <h2 className="text-2xl font-bold">Служба Поддержки</h2>
             <p className="text-slate-400 max-w-md mx-auto">
               Если у вас возникли вопросы по работе Nexus AI или оплате, наши специалисты ответят вам в течение 15 минут.
             </p>
             <button className="btn-shimmer text-white mt-4">Написать в чат</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="glass-card p-6 border-l-4 border-primary">
               <h4 className="font-bold mb-2">Частые вопросы</h4>
               <ul className="text-sm text-slate-400 space-y-2">
                 <li className="hover:text-primary cursor-pointer transition-colors">• Как подключить Steam?</li>
                 <li className="hover:text-primary cursor-pointer transition-colors">• Бесплатные функции ИИ</li>
                 <li className="hover:text-primary cursor-pointer transition-colors">• Как работают квизы?</li>
               </ul>
             </div>
          </div>
        </div>
      )}

      {/* Admin Support View */}
      {isAdmin && (
        <>
          <div className="w-80 glass-card p-4 space-y-4">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <h3 className="font-bold text-lg uppercase tracking-wider">Тикеты ({mockUsers.length})</h3>
               <ShieldCheck size={20} className="text-emerald-500" />
             </div>
             <div className="space-y-2">
               {mockUsers.map((u, i) => (
                 <motion.button
                   key={i}
                   whileHover={{ scale: 1.02 }}
                   onClick={() => setActiveChat(u.name)}
                   className={`w-full text-left p-4 rounded-xl border border-transparent transition-all hover:bg-white/5 ${activeChat === u.name ? 'bg-primary/10 border-primary/30' : ''}`}
                 >
                   <div className="flex justify-between items-start mb-1">
                     <p className="font-bold text-sm">{u.name}</p>
                     <span className="text-[10px] text-slate-500">{u.time}</span>
                   </div>
                   <p className="text-xs text-slate-500 truncate">{u.lastMsg}</p>
                 </motion.button>
               ))}
             </div>
          </div>

          <div className="flex-1 glass-card flex flex-col items-center justify-center p-8">
            {activeChat ? (
              <div className="w-full h-full flex flex-col text-left">
                 <div className="border-b border-white/5 pb-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <User size={32} className="text-primary" />
                       <h3 className="font-bold">{activeChat}</h3>
                    </div>
                    <button className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase rounded">Активен</button>
                 </div>
                 <div className="flex-1 space-y-4 p-4 overflow-y-auto custom-scrollbar">
                    <div className="bg-white/5 p-3 rounded-xl max-w-[80%] text-sm">
                       Привет! Почему статистика из Steam не обновляется сразу после матча?
                    </div>
                 </div>
                 <div className="mt-auto p-4 flex gap-2">
                    <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm" placeholder="Введите ответ..." />
                    <button className="p-3 bg-primary rounded-xl"><MessageSquare size={18} /></button>
                 </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Search size={48} className="text-slate-700 mx-auto" />
                <p className="text-slate-500 font-medium">Выберите тикет для начала работы</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
