import { useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username
            }
          }
        });
        if (signUpError) {
          // Если ошибка связана с БД, выводим подсказку
          if (signUpError.message.includes('Database error')) {
            throw new Error('Ошибка БД: Проверьте триггеры или отключите подтверждение почты в Supabase');
          }
          throw signUpError;
        }
        setAuthSuccess('Письмо с подтверждением отправлено на вашу почту!');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Произошла непредвиденная ошибка');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {isLogin ? <LogIn className="text-primary" /> : <UserPlus className="text-primary" />}
        {isLogin ? 'Вход' : 'Регистрация'}
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Никнейм</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-purple-900/30 rounded-xl p-3 text-white focus:border-primary outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Email</label>
          <input
            type="email"
            className="w-full bg-black/40 border border-purple-900/30 rounded-xl p-3 text-white focus:border-primary outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Пароль</label>
          <input
            type="password"
            className="w-full bg-black/40 border border-purple-900/30 rounded-xl p-3 text-white focus:border-primary outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {authError && <p className="text-red-400 text-sm">{authError}</p>}
        {authSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm animate-pulse">
            {authSuccess}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !!authSuccess}
          className="w-full btn-shimmer bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Войти' : 'Создать аккаунт')}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full mt-6 text-sm text-slate-400 hover:text-white transition-colors"
      >
        {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}