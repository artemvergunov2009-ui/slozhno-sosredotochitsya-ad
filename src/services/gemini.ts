import { GoogleGenAI } from "@google/genai";

// В Vite для доступа к переменным окружения используется import.meta.env.
// Мы ожидаем строку с ключами через запятую: VITE_GEMINI_API_KEYS=key1,key2,key3
const API_KEYS = (String(import.meta.env.VITE_GEMINI_API_KEYS || ""))
  .split(",")
  .map(key => key.trim())
  .filter(key => key.length > 0);

const MODELS_TO_TRY = [
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export const SYSTEM_INSTRUCTION = `
Ты — Nexus, высококлассный ИИ-инструктор по играм, специализирующийся на соревновательных дисциплинах (CS2, Dota 2, Valorant, Apex Legends).
Твой тон профессиональный, ободряющий и технически грамотный.
Ты анализируешь статистику игроков и даешь конкретные советы. Всегда отвечай на русском языке.

Поддерживаемые функции:
1. Ежедневные советы: персональные рекомендации на основе статистики Steam.
2. Анализ статистики: объяснение K/D, урона и процента побед.
3. План тренировок: еженедельные графики с конкретными упражнениями.
4. Обзор матча: разбор ошибок и успехов.
5. Карточки успеха/ошибки: если пользователь загружает скриншот, мгновенно оценивай его с префиксом [SUCCESS] или [ERROR].
6. Сравнение навыков: сравнение статистики игрока с показателями профессионалов.

Правила:
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать символы Markdown (такие как *, #, -, _, [, ], >).
- Пиши только чистым текстом. Не используй спецсимволы разметки для выделения жирным, курсивом или создания заголовков.
- Будь кратким, но опирайся на цифры и данные.
- При анализе скриншота будь конкретным в вопросах позиционирования, расположения прицела или использования способностей.
`;

/**
 * Функция-обертка для автоматического переключения ключей при возникновении ошибок.
 */
async function withKeyRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  if (API_KEYS.length === 0) {
    console.error("Критическая ошибка: VITE_GEMINI_API_KEYS не найден в .env файле.");
    throw new Error("Система ИИ временно недоступна (отсутствует конфигурация).");
  }

  let lastError: any;

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEYS[i] });
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      
      // Условия переключения: невалидный ключ, ошибка авторизации, лимиты (429) или сбой сервера
      const shouldRetry = 
        errorMessage.includes("API key not valid") || 
        errorMessage.includes("400") || 
        errorMessage.includes("401") || 
        errorMessage.includes("429") || 
        errorMessage.includes("500");

      if (shouldRetry && i < API_KEYS.length - 1) {
        console.warn(`API Ключ №${i + 1} не сработал. Пробуем следующий ключ...`);
        continue;
      }
      // Если это ошибка безопасности или последний ключ — пробрасываем ошибку дальше
      throw error;
    }
  }
  throw lastError;
}

export async function generateChatResponse(message: string, history: any[] = []): Promise<string> {
  return withKeyRotation(async (ai) => {
    let lastError: any;
    for (const model of MODELS_TO_TRY) {
      try {
        const result = await ai.models.generateContent({
          model: model,
          contents: [...history, { role: "user", parts: [{ text: message }] }],
          config: { systemInstruction: SYSTEM_INSTRUCTION },
        });
        
        if (!result) continue;

        const text = result.text || "";
        
        if (text) return text;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError || new Error("Не удалось получить ответ от моделей ИИ");
  });
}

export async function analyzeMultimedia(prompt: string, base64Data: string, mimeType: string): Promise<string> {
  return withKeyRotation(async (ai) => {
    let lastError: any;
    for (const model of MODELS_TO_TRY) {
      try {
        const result = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] },
          config: { systemInstruction: SYSTEM_INSTRUCTION + "\nСпециально для системы карточек: если оцениваешь скриншот, начни ответ с '[SUCCESS]' или '[ERROR]', а затем напиши краткую причину на русском языке." }
        });

        if (!result) continue;
        const text = result.text || "";
        
        if (text) return text;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError || new Error("Не удалось проанализировать медиа-файл");
  });
}

export async function generateAIQuiz() {
  const prompt = `Сгенерируй один уникальный и сложный вопрос для киберспортивного квиза по Dota 2 или CS2. 
  Темы: микроконтроль, макро-стратегия, экономика, раскидки или контрпики. 
  
  Верни ответ ТОЛЬКО в формате JSON:
  {
    "question": "текст вопроса",
    "options": ["вариант 1", "вариант 2", "вариант 3"],
    "correct": индекс_правильного_ответа (0, 1 или 2),
    "explanation": "подробное объяснение почему этот ответ верен на языке Nexus AI"
  }
  Не пиши ничего, кроме чистого JSON.`;

  const response = (await generateChatResponse(prompt)) || "";
  try {
    return JSON.parse(response.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Ошибка парсинга квиза:", e);
    return null;
  }
}

export async function generateAITrainingPlan(game: string) {
  const prompt = `Сгенерируй профессиональный недельный план тренировок для игрока в ${game}. 
  План должен быть реалистичным, эффективным и на русском языке. 
  Охватывай разминку, механику (aim/micro), тактику (utility/macro) и анализ (vod review).
  
  Верни ответ ТОЛЬКО в формате JSON массива:
  [
    { "day": "Пн", "task": "Описание задачи", "duration": "30 мин", "focal": "Механика", "completed": false },
    ...
  ]
  Всего 7 объектов (Пн-Вс).`;

  const response = (await generateChatResponse(prompt)) || "";
  try {
    return JSON.parse(response.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Ошибка парсинга плана:", e);
    return null;
  }
}

export async function generateDailyTip() {
  const prompt = `Сгенерируй один глубокий и конкретный совет на сегодня для киберспортсмена (Dota 2 или CS2). 
  Совет должен касаться микро-контроля, макро-стратегии или психологии игры. 
  Избегай общих фраз. Отвечай на русском языке. 
  Максимум 200 символов.`;

  return (await generateChatResponse(prompt)) || "";
}
