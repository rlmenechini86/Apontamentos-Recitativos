import { Request, Response } from 'express';
import { preCadastroService } from '../services/preCadastroService.js';
import { auditService } from '../services/auditService.js';
import { usuarioService } from '../services/usuarioService.js';

export class PreCadastroController {
  /**
   * GET /api/pre-cadastros/public-meta (Público)
   * Retorna setores e congregações ativas para alimentar o formulário público
   */
  async getPublicMeta(_req: Request, res: Response): Promise<void> {
    try {
      const data = await preCadastroService.getPublicMeta();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Erro ao carregar dados auxiliares.' });
    }
  }

  /**
   * POST /api/pre-cadastros/public (Público)
   * Submissão pública da solicitação de pré-cadastro
   */
  async createPublic(req: Request, res: Response): Promise<void> {
    try {
      const data = await preCadastroService.createPublic(req.body);
      res.status(201).json({
        success: true,
        message: 'Dados Cadastrados com Sucesso!',
        data,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Erro ao processar pré-cadastro.',
      });
    }
  }

  /**
   * GET /api/pre-cadastros (Autenticado)
   * Lista pré-cadastros para a administração
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, setorId } = req.query;

      // Se o usuário logado for de escopo restrito a setor (Administrador Setor / CJM), filtra para seu setor
      let resolvedSetorId = setorId ? String(setorId) : undefined;
      let resolvedSetorNome: string | undefined = undefined;

      const user = req.user;
      if (user?.userId) {
        const dbUser = await usuarioService.getById(user.userId);
        if (dbUser && dbUser.perfis?.nivel_acesso === 'setor') {
          // Obtém o setor da comum do usuário
          if (dbUser.comum_congregacao_id) {
            const comum = (dbUser as any).comum_congregacao;
            resolvedSetorNome = comum?.setor_pertencente || undefined;
          }
        }
      }

      const list = await preCadastroService.list({
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
        setorId: resolvedSetorId,
        setorNome: resolvedSetorNome,
      });

      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Erro ao listar pré-cadastros.' });
    }
  }

  /**
   * POST /api/pre-cadastros/:id/aprovar (Autenticado)
   * Aprova o pré-cadastro e cria o usuário no sistema com o perfil selecionado
   */
  async aprovar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { perfil_id } = req.body;
      const adminUserId = req.user?.userId;

      if (!perfil_id) {
        res.status(400).json({ success: false, message: 'Selecione o perfil de acesso para aprovar o usuário.' });
        return;
      }

      const result = await preCadastroService.aprovar(id, perfil_id, adminUserId);

      // Trilha de Auditoria LGPD
      await auditService.log({
        usuario_id: adminUserId || null,
        usuario_email: req.user?.email || null,
        acao: 'CREATE',
        tabela_afetada: 'usuarios',
        registro_id: result.usuario?.id,
        detalhes: `Pré-cadastro aprovado para ${result.preCadastro.nome_completo} (${result.preCadastro.email}). Perfil ID: ${perfil_id}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Cadastro de "${result.preCadastro.nome_completo}" aprovado com sucesso!`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Erro ao aprovar pré-cadastro.' });
    }
  }

  /**
   * POST /api/pre-cadastros/:id/recusar (Autenticado)
   * Recusa o pré-cadastro
   */
  async recusar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const adminUserId = req.user?.userId;

      const result = await preCadastroService.recusar(id, motivo, adminUserId);

      await auditService.log({
        usuario_id: adminUserId || null,
        usuario_email: req.user?.email || null,
        acao: 'UPDATE',
        tabela_afetada: 'pre_cadastros',
        registro_id: id,
        detalhes: `Pré-cadastro de ${result.nome_completo} recusado. Motivo: ${motivo || 'Sem motivo especificado'}`,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Pré-cadastro de "${result.nome_completo}" foi recusado.`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Erro ao recusar pré-cadastro.' });
    }
  }
}

export const preCadastroController = new PreCadastroController();

