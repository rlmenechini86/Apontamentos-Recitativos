import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { validatePassword } from '../../utils/passwordValidator.js';

export const authRouter = Router();

/**
 * Extrai IP real do request (compativel com proxy/load balancer)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * POST /api/auth/login
 * Autentica usuario com e-mail e senha criptografada (JWT)
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.login(email, senha, ip, userAgent);
    return res.json({
      success: true,
      message: 'Login realizado com sucesso.',
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Falha ao autenticar.',
    });
  }
});

/**
 * POST /api/auth/register
 * Cadastro de novo usuario com senha criptografada
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { nome_completo, email, celular, senha, perfil_id, comum_congregacao_id } = req.body;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const result = await authService.register({
      nome_completo,
      email,
      celular,
      senha,
      perfil_id,
      comum_congregacao_id,
    }, ip, userAgent);
    return res.status(201).json({
      success: true,
      message: 'Usuario cadastrado com sucesso com senha criptografada.',
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao registrar usuario.',
    });
  }
});

/**
 * POST /api/auth/set-password
 * Cadastra ou redefine a senha do usuario
 */
authRouter.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { email, nova_senha } = req.body;
    const ip = getClientIp(req);
    await authService.setPassword(email, nova_senha, ip);
    return res.json({
      success: true,
      message: 'Senha cadastrada e criptografada com sucesso.',
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao definir senha.',
    });
  }
});

/**
 * POST /api/auth/validate-password
 * Valida a forca da senha em tempo real
 */
authRouter.post('/validate-password', (req: Request, res: Response) => {
  const { senha } = req.body;
  const result = validatePassword(senha || '');
  return res.json({
    success: true,
    data: result,
  });
});
