const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { HttpsProxyAgent } = require('https-proxy-agent');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Твой рабочий японский прокси (и любые другие без пароля)
// Формат: ["IP", "PORT", "USER", "PASS"]
const PROXIES = [
    ["13.230.49.39", "8080", "", ""]
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
            console.error(`[Proxy Error for ${ip}]:`, err.message);
            res.status(502).json({
                error: 'Proxy connection failed',
                message: 'Этот прокси временно недоступен или слишком медленный.'
            });
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
