const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');

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

// Целевой URL для Gemini API
const TARGET_URL = 'https://generativelanguage.googleapis.com';

// Выбираем случайный прокси из списка
const getRandomProxyAgent = () => {
    const [ip, port, user, pass] = PROXIES[Math.floor(Math.random() * PROXIES.length)];
    const proxyUri = `http://${user}:${pass}@${ip}:${port}`;
    return new HttpsProxyAgent(proxyUri);
};

app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    agent: getRandomProxyAgent(), // Используем прокси-агент для исходящего трафика
    onProxyReq: (proxyReq, req, res) => {
        if (req.headers['x-goog-api-key']) {
            proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        // Добавляем CORS заголовки, чтобы можно было обращаться из браузера
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    },
    logLevel: 'debug'
}));

// Обработка OPTIONS запросов для CORS
app.options('*', (req, res) => {
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`AI Proxy server is running on port ${PORT} targeting ${TARGET_URL}`);
});
