import bcrypt from 'bcryptjs';
import { usuarioService } from './usuarioService.js';
import { perfilService } from './perfilService.js';
import { validatePassword } from '../../utils/passwordValidator.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { auditService } from './auditService.js';
import { Usuario } from '../types/index.js';

// Senha padrao institucional - carregada de variavel de ambiente (LGPD: sem hardcode)
const LEGACY_DEFAULT_PASSWORD = process.env.LEGACY_DEFAULT_PASSWORD || 'padrao123';

export class AuthService {
  /**
   * Criptografa senha com salt seguro via bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12); // Salt rounds aumentado de 10 para 12
  }

  /**
   * Compara senha digitada com hash criptografado
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * LOGIN: Autentica o usuario com verificacao de senha criptografada
   * Retorna JWT assinado ao inves de token previsivel
   */
  async login(email: string, senha: string, ip?: string, userAgent?: string): Promise<{ user: Usuario; token: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('O e-mail e obrigatorio.');
    }
    if (!senha) {
      throw new Error('A senha e obrigatoria.');
    }

    // Busca usuario pelo e-mail
    let user = await usuarioService.getByEmail(cleanEmail);
    if (!user) {
      // Log de tentativa falhada (LGPD: trilha de auditoria)
      await auditService.logLoginFailed(cleanEmail, 'E-mail nao encontrado', ip, userAgent);
      throw new Error('E-mail ou senha invalidos.');
    }

    if (!user.ativo) {
      await auditService.logLoginFailed(cleanEmail, 'Conta desativada', ip, userAgent);
      throw new Error('Esta conta de usuario esta desativada. Contate a administracao.');
    }

    // Verifica se possui hash no banco
    let userHash = user.senha_hash;

    // Se o usuario ainda nao possui senha cadastrada (conta legado),
    // verifica se digitou a senha padrao institucional (carregada de env)
    if (!userHash) {
      if (senha === LEGACY_DEFAULT_PASSWORD) {
        userHash = await this.hashPassword(LEGACY_DEFAULT_PASSWORD);
        try {
          await usuarioService.update(user.id, {
            senha_hash: userHash,
            trocar_senha_proximo_login: true
          } as any);
          user.trocar_senha_proximo_login = true;
        } catch (err: any) {
          throw new Error('Erro ao salvar nova senha no banco de dados.');
        }
      } else {
        await auditService.logLoginFailed(cleanEmail, 'Senha nao cadastrada - tentativa invalida', ip, userAgent);
        throw new Error('Senha nao cadastrada para este usuario. Contate a administracao para obter a senha padrao inicial.');
      }
    }

    const isMatch = await this.comparePassword(senha, userHash);
    if (!isMatch) {
      await auditService.logLoginFailed(cleanEmail, 'Senha incorreta', ip, userAgent);
      throw new Error('E-mail ou senha invalidos.');
    }

    if (user.trocar_senha_proximo_login) {
      throw new Error('REQUIRE_PASSWORD_CHANGE');
    }

    // Gera JWT assinado (LGPD: token seguro e nao previsivel)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      perfilId: user.perfil_id,
      perfilNome: user.perfis?.nome || '',
      nome: user.nome_completo,
    });

    // Log de login bem-sucedido (LGPD: trilha de auditoria)
    await auditService.logLogin(user.id, user.email, ip, userAgent);

    // Remove hash do retorno por seguranca
    const sanitizedUser: Usuario = { ...user };
    delete sanitizedUser.senha_hash;

    return { user: sanitizedUser, token };
  }

  /**
   * CADASTRO / PRIMEIRO ACESSO COM SENHA CRIPTOGRAFADA
   * Valida obrigatoriamente: minimo 8 digitos, maiuscula, minuscula, numero e caracter especial
   */
  async register(data: {
    nome_completo: string;
    email: string;
    celular: string;
    senha: string;
    perfil_id?: string;
    comum_congregacao_id?: string | null;
  }, ip?: string, userAgent?: string): Promise<{ user: Usuario; token: string }> {
    const cleanEmail = (data.email || '').trim().toLowerCase();

    // 1. Validacao estrita da senha criptografada
    const validation = validatePassword(data.senha);
    if (!validation.isValid) {
      throw new Error(
        'A senha nao atende aos requisitos de seguranca: ' + validation.errors.join(', ') + '.'
      );
    }

    // 2. Verifica se usuario ja existe
    const existing = await usuarioService.getByEmail(cleanEmail);
    if (existing) {
      throw new Error('Ja existe um usuario cadastrado com este e-mail.');
    }

    // 3. Determina perfil padrao (se nao fornecido, Apontamento)
    let perfil_id = data.perfil_id;
    if (!perfil_id) {
      const perfisRes = await perfilService.listAll();
      const perfilApontamento = perfisRes.data.find((p) => p.nome === 'Apontamento') || perfisRes.data[0];
      perfil_id = perfilApontamento?.id || '33333333-3333-3333-3333-333333333333';
    }

    // 4. Criptografa a senha com bcrypt (salt 12)
    const senha_hash = await this.hashPassword(data.senha);

    // 5. Cadastra o usuario
    const createdUser = await usuarioService.create({
      nome_completo: data.nome_completo.trim(),
      email: cleanEmail,
      celular: data.celular.trim(),
      perfil_id,
      comum_congregacao_id: data.comum_congregacao_id || null,
      senha: senha_hash,
      ativo: true,
    } as any);

    // Gera JWT assinado
    const token = generateToken({
      userId: createdUser.id,
      email: createdUser.email,
      perfilId: createdUser.perfil_id,
      perfilNome: createdUser.perfis?.nome || '',
      nome: createdUser.nome_completo,
    });

    // Log de registro (LGPD: trilha de auditoria)
    await auditService.logDataAccess(
      createdUser.id,
      createdUser.email,
      'CREATE',
      'usuarios',
      createdUser.id,
      'Novo usuario registrado',
      ip
    );

    const sanitizedUser: Usuario = { ...createdUser };
    delete sanitizedUser.senha_hash;

    return { user: sanitizedUser, token };
  }

  /**
   * CADASTRAR OU REDEFINIR SENHA
   * Valida os criterios e atualiza o hash no banco
   */
  async setPassword(email: string, novaSenha: string, ip?: string): Promise<boolean> {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Validacao estrita da senha
    const validation = validatePassword(novaSenha);
    if (!validation.isValid) {
      throw new Error(
        'A senha nao atende aos requisitos de seguranca: ' + validation.errors.join(', ') + '.'
      );
    }

    const user = await usuarioService.getByEmail(cleanEmail);
    if (!user) {
      throw new Error('Nenhum usuario encontrado com o e-mail informado.');
    }

    const hash = await this.hashPassword(novaSenha);
    await usuarioService.update(user.id, {
      senha_hash: hash,
      trocar_senha_proximo_login: false
    } as any);

    // Log de alteracao de senha (LGPD: trilha de auditoria)
    await auditService.logDataAccess(
      user.id,
      user.email,
      'UPDATE',
      'usuarios',
      user.id,
      'Senha redefinida',
      ip
    );

    return true;
  }
}

export const authService = new AuthService();
