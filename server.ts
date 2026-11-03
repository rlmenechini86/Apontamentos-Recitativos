import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './src/server/routes/index.js';
import { applySecurityMiddleware } from './src/server/middleware/securityMiddleware.js';
import { authMiddleware } from './src/server/middleware/authMiddleware.js';

dotenv.config();

// Bypass para firewall corporativo (SSL Inspection) no ambiente de desenvolvimento
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 8080;

async function startServer() {
  const app = express();

  // LGPD Fase 1: Middlewares de seguranca (Helmet, CORS, Rate Limit)
  applySecurityMiddleware(app);

  app.use(express.json());

  // LGPD Fase 1: Middleware de autenticacao JWT em todas as rotas /api
  app.use(authMiddleware);

  // Rota de documentacao breve e saude do backend
  app.use('/api', apiRouter);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('[Server] Sistema de Controle de Apontamentos ativo na porta ' + PORT);
    console.log('[LGPD] Helmet, CORS, Rate Limit e JWT Auth ativos');
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
});
