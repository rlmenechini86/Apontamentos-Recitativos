import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';

/**
 * Aplica todos os middlewares de seguranca no servidor Express:
 * - Helmet: Headers HTTP de seguranca (XSS, clickjacking, MIME sniffing)
 * - CORS: Controle de origens permitidas
 * - Rate Limiting: Protecao contra forca bruta e DDoS
 */
export function applySecurityMiddleware(app: Express): void {
  // 1. Helmet - Headers de seguranca HTTP
  app.use(
    helmet({
      contentSecurityPolicy: false, // Desabilitado para SPA (Vite injeta scripts inline)
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS - Controla origens permitidas
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permite requests sem origin (mobile apps, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
          return callback(null, true);
        }
        callback(new Error('Origem nao permitida pelo CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Rate Limiting Global - max 100 requests por IP a cada 15 min
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Muitas requisicoes. Tente novamente em 15 minutos.',
    },
  });
  app.use('/api', globalLimiter);

  // 4. Rate Limiting Estrito para login - max 10 tentativas por IP a cada 15 min
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    },
  });
  app.use('/api/auth/login', loginLimiter);

  // 5. Rate Limiting para registro - max 5 por IP a cada 1 hora
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Muitos cadastros deste IP. Tente novamente em 1 hora.',
    },
  });
  app.use('/api/auth/register', registerLimiter);
}
