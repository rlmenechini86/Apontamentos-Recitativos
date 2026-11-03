import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ccb_jwt_secret_change_in_production_2026';

export interface JwtPayload {
  userId: string;
  email: string;
  perfilId: string;
  perfilNome: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Gera um JWT assinado com expiracao de 12 horas
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

/**
 * Verifica e decodifica um JWT
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Middleware de autenticacao - valida Bearer token JWT em todas as rotas protegidas.
 * Rotas publicas (login, register, set-password, validate-password, health) sao isentas.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Rotas publicas que nao exigem autenticacao
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/set-password',
    '/api/auth/validate-password',
    '/api/health',
  ];

  if (publicPaths.some(p => req.path === p || req.path.startsWith(p + '?'))) {
    return next();
  }

  // Nao intercepta rotas fora de /api
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Token de autenticacao nao fornecido. Faca login novamente.',
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Sessao expirada. Faca login novamente.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Token invalido. Faca login novamente.',
      code: 'TOKEN_INVALID',
    });
    return;
  }
}
