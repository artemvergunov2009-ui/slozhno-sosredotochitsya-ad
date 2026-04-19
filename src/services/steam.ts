import { supabase } from '../lib/supabase';

// В идеале API_KEY должен быть на бэкенде. 
// Для работы из фронтенда (при наличии прокси) используем переменные окружения.
const STEAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY;
const PROXY_URL = 'https://api.allorigins.win/raw?url='; // Временный прокси для обхода CORS

export interface SteamStats {
  kd: string;
  adr: number;
  winRate: number;
  hsPercent: number;
  playerName: string;
  avatar: string;
  playtime: number;
}

export async function saveSteamId(userId: string, steamId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ steam_id: steamId })
    .eq('id', userId);
  
  if (error) console.error('Ошибка сохранения SteamID:', error);
  return !error;
}

export async function fetchSteamUserStats(steamId: string): Promise<SteamStats | null> {
  try {
    if (!STEAM_API_KEY || STEAM_API_KEY === 'your_steam_api_key_here') {
      console.error('Steam API Key не настроен в .env');
      return null;
    }

    // 1. Получаем общую информацию о пользователе (имя, аватар)
    const summaryUrl = `${PROXY_URL}${encodeURIComponent(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`
    )}`;
    
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    const player = summaryData.response.players[0];

    if (!player) return null;

    // 2. Получаем статистику по CS2 (AppID: 730)
    // Примечание: У пользователя должен быть открыт профиль и статистика игр
    const statsUrl = `${PROXY_URL}${encodeURIComponent(
      `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${STEAM_API_KEY}&steamid=${steamId}`
    )}`;

    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    
    if (!statsData.playerstats || !statsData.playerstats.stats) {
      // Возвращаем базовые данные, если игровая статистика скрыта
      return {
        playerName: player.personaname,
        avatar: player.avatarfull,
        kd: '0.00', adr: 0, winRate: 0, hsPercent: 0, playtime: 0
      };
    }

    const s = statsData.playerstats.stats.reduce((acc: any, curr: any) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});

    // Расчет метрик (пример для CS2)
    const totalKills = s.total_kills || 0;
    const totalDeaths = s.total_deaths || 1;
    const totalWins = s.total_wins || 0;
    const totalMatches = s.total_matches_played || 1;

    return {
      playerName: player.personaname,
      avatar: player.avatarfull,
      kd: (totalKills / totalDeaths).toFixed(2),
      adr: (s.total_damage_done / (s.total_rounds_played || 1)),
      winRate: Math.round((totalWins / totalMatches) * 100),
      hsPercent: Math.round(((s.total_kills_headshot || 0) / totalKills) * 100),
      playtime: Math.round((s.total_time_played || 0) / 3600)
    };
  } catch (err) {
    console.error('Ошибка Steam API:', err);
    return null;
  }
}