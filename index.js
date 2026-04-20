const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cors = require('cors'); // Используем пакет cors для надежности

const app = express();
const PORT = process.env.PORT || 3000;

// Список ваших прокси (IP, PORT, USER, PASS)
const PROXIES = [
    ["31.59.20.176", "6754", "vjbepkud", "fiwibzc0q2sg"],
    ["23.95.150.145", "6114", "vjbepkud", "fiwibzc0q2sg"],
    ["198.23.239.134", "6540", "vjbepkud", "fiwibzc0q2sg"],
    ["45.38.107.97", "6014", "vjbepkud", "fiwibzc0q2sg"],
    ["107.172.163.27", "6543", "vjbepkud", "fiwibzc0q2sg"],
    ["198.105.121.200", "6462", "vjbepkud", "fiwibzc0q2sg"],
    ["216.10.27.159", "6837", "vjbepkud", "fiwibzc0q2sg"],
    ["142.111.67.146", "5611", "vjbepkud", "fiwibzc0q2sg"],
    ["191.96.254.138", "6185", "vjbepkud", "fiwibzc0q2sg"],
    ["31.58.9.4", "6077", "vjbepkud", "fiwibzc0q2sg"]
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
