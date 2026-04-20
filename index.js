const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Твой рабочий японский прокси (и любые другие без пароля)
// Формат: ["IP", "PORT", "USER", "PASS"]
const PROXIES = [
    ["135.148.11.233", "3128", "", ""],   // USA
    ["15.204.144.137", "3128", "", ""],   // USA
    ["185.138.116.150", "8080", "", ""],  // France
    ["51.158.154.173", "3128", "", ""],   // France
    ["15.204.161.11", "3128", "", ""]     // USA
];

const TARGET_URL = 'https://generativelanguage.googleapis.com';

// Включаем CORS
app.use(cors());

// Создаем пул прокси-мидлваров
const proxyPool = PROXIES.map((proxyData) => {
    const [ip, port, user, pass] = proxyData;
    
    // Если user и pass пустые, создаем простую ссылку, иначе — с авторизацией
    const proxyUri = (user && pass) 
        ? `http://${user}:${pass}@${ip}:${port}` 
        : `http://${ip}:${port}`;
    
    const agent = new HttpsProxyAgent(proxyUri);

    return createProxyMiddleware({
        target: TARGET_URL,
        changeOrigin: true,
        agent: agent,
        // Увеличиваем таймауты для бесплатных прокси
        proxyTimeout: 30000, 
        timeout: 30000,
        onProxyReq: (proxyReq, req) => {
            // Пробрасываем ключ API в заголовки
            if (req.headers['x-goog-api-key']) {
                proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
            }
        },
        onError: (err, req, res) => {
            console.error(`[CRITICAL ERROR] Proxy: ${ip} | Error: ${err.message}`);
            if (err.code === 'ETIMEDOUT') {
                res.status(504).json({ error: "Proxy timed out. Try again." });
            } else {
                res.status(502).json({ error: "Proxy connection failed", details: err.message });
            }
        },
        logLevel: 'debug'
    });
});

// Роутер запросов
app.use('/', (req, res, next) => {
    // Если список прокси пуст, выдаем ошибку
    if (proxyPool.length === 0) {
        return res.status(500).send('No proxies configured.');
    }

    const randomIndex = Math.floor(Math.random() * proxyPool.length);
    const selectedIp = PROXIES[randomIndex][0];
    
    console.log(`[${new Date().toLocaleTimeString()}] Target: ${req.url} | Via: ${selectedIp}`);
    
    // Передаем управление мидлвару
    proxyPool[randomIndex](req, res, next);
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server is running on port ${PORT}`);
    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log(`🌐 Loaded ${proxyPool.length} proxy address(es).`);
});
