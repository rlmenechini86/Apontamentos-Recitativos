import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { validatePassword } from '../../utils/passwordValidator.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Autentica usuário com e-mail e senha criptografada
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    const result = await authService.login(email, senha);
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
 * Cadastro de novo usuário com senha criptografada (mínimo 8 dígitos, maiúscula, minúscula, número e caracter especial)
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { nome_completo, email, celular, senha, perfil_id, comum_congregacao_id } = req.body;
    const result = await authService.register({
      nome_completo,
      email,
      celular,
      senha,
      perfil_id,
      comum_congregacao_id,
    });
    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso com senha criptografada.',
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Erro ao registrar usuário.',
    });
  }
});

/**
 * POST /api/auth/set-password
 * Cadastra ou redefine a senha do usuário
 */
authRouter.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { email, nova_senha } = req.body;
    await authService.setPassword(email, nova_senha);
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
 * Valida a força da senha em tempo real
 */
authRouter.post('/validate-password', (req: Request, res: Response) => {
  const { senha } = req.body;
  const result = validatePassword(senha || '');
  return res.json({
    success: true,
    data: result,
  });
});
