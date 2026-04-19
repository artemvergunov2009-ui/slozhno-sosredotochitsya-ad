import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Здесь можно добавить API роуты
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'Nexus AI' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Режим Production: отдаем статические файлы из dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Nexus AI Server running at http://localhost:${PORT}`);
    console.log(`📸 Mode: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
