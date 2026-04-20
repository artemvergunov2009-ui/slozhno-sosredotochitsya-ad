const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Включаем CORS, чтобы запросы проходили из браузера или бота
app.use(cors());

// Просто проксируем запрос напрямую
app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
        // Передаем API ключ из заголовков, если он есть
        if (req.headers['x-goog-api-key']) {
            proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
        }
    },
    onProxyRes: (proxyRes) => {
        // Удаляем заголовки безопасности, которые могут мешать CORS в браузере
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
    },
    onError: (err, req, res) => {
        console.error('Direct Connection Error:', err.message);
        res.status(502).json({ 
            error: "Connection to Google failed", 
            details: err.message 
        });
    },
    logLevel: 'debug'
}));

app.listen(PORT, () => {
    console.log(`🚀 Proxy server started without external proxies!`);
    console.log(`📡 Port: ${PORT} -> Target: ${TARGET_URL}`);
});
