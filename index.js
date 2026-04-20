const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cors = require('cors'); // Используем пакет cors для надежности

const app = express();
const PORT = process.env.PORT || 3000;

const PROXIES = [
    ["173.211.30.150", "6421", "vjbepkud", "fiwibzc0q2sg"],
    ["104.238.131.147", "6312", "vjbepkud", "fiwibzc0q2sg"],
    ["161.123.152.115", "6360", "vjbepkud", "fiwibzc0q2sg"],
    ["167.160.180.203", "6754", "vjbepkud", "fiwibzc0q2sg"],
    ["154.36.110.199", "6853", "vjbepkud", "fiwibzc0q2sg"],
    ["173.44.37.194", "6352", "vjbepkud", "fiwibzc0q2sg"]
];
const TARGET_URL = 'https://generativelanguage.googleapis.com';

// Включаем CORS для всех маршрутов и методов
app.use(cors());

// 1. Заранее создаем массив готовых мидлваров для каждого прокси
const proxyPool = PROXIES.map((proxyData, index) => {
    const [ip, port, user, pass] = proxyData;
    const proxyUri = `http://${user}:${pass}@${ip}:${port}`;
    const agent = new HttpsProxyAgent(proxyUri);

    return createProxyMiddleware({
        target: TARGET_URL,
        changeOrigin: true,
        agent: agent, // Привязываем конкретный агент к этому мидлвару
        onProxyReq: (proxyReq, req, res) => {
            if (req.headers['x-goog-api-key']) {
                proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
            }
        },
        // Убираем ручной onProxyRes с CORS, так как теперь за это отвечает app.use(cors())
        logLevel: 'silent' // 'debug' оставит много мусора в консоли, лучше выводить свой лог
    });
});

// 2. Динамический роутер: выбирает случайный прокси для каждого отдельного запроса
app.use('/', (req, res, next) => {
    const randomIndex = Math.floor(Math.random() * proxyPool.length);
    const selectedProxyIp = PROXIES[randomIndex][0];
    
    console.log(`[${new Date().toISOString()}] Routing request via proxy: ${selectedProxyIp}`);
    
    // Передаем запрос в выбранный мидлвар
    proxyPool[randomIndex](req, res, next);
});

app.listen(PORT, () => {
    console.log(`AI Proxy server is running on port ${PORT} targeting ${TARGET_URL}`);
    console.log(`Loaded ${proxyPool.length} proxies.`);
});
