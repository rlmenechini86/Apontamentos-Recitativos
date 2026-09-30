import { Request, Response } from 'express';
import { usuarioService } from '../services/usuarioService.js';
import { perfilService } from '../services/perfilService.js';
import { UsuarioFilterOptions } from '../types/index.js';

export class UsuarioController {
  /**
   * GET /api/usuarios
   * Lista usuários com filtros opcionais
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters: UsuarioFilterOptions = {};
      if (req.query.perfil_id) filters.perfil_id = String(req.query.perfil_id);
      if (req.query.comum_congregacao_id) filters.comum_congregacao_id = String(req.query.comum_congregacao_id);
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.ativo !== undefined) {
        filters.ativo = req.query.ativo === 'true' || req.query.ativo === '1';
      }

      const result = await usuarioService.list(filters);
      res.status(200).json({
        success: true,
        total: result.data.length,
        source: result.source,
        data: result.data,
      });
    } catch (error: any) {
      console.error('[UsuarioController.list] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar usuários.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtém detalhes de um usuário por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuario = await usuarioService.getById(id);

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: `Usuário com ID '${id}' não encontrado.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      console.error('[UsuarioController.getById] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar usuário.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/usuarios
   * Cadastra novo usuário
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nome_completo, email, celular, perfil_id, comum_congregacao_id, ativo } = req.body;

      if (!nome_completo || !email || !celular || !perfil_id) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: Nome Completo, E-mail, Celular e Perfil de Acesso são obrigatórios.',
        });
        return;
      }

      const created = await usuarioService.create({
        nome_completo,
        email,
        celular,
        perfil_id,
        comum_congregacao_id: comum_congregacao_id || null,
        ativo: ativo !== undefined ? ativo : true,
      });

      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        data: created,
      });
    } catch (error: any) {
      console.error('[UsuarioController.create] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao cadastrar usuário.',
      });
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Atualiza dados de um usuário
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await usuarioService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Usuário atualizado com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[UsuarioController.update] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao atualizar usuário.',
      });
    }
  }

  /**
   * DELETE /api/usuarios/:id
   * Remove um usuário
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await usuarioService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Usuário removido com sucesso.',
      });
    } catch (error: any) {
      console.error('[UsuarioController.delete] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao remover usuário.',
      });
    }
  }

  /**
   * GET /api/usuarios/meta/perfis
   * Lista perfis de acesso disponíveis
   */
  async listPerfis(_req: Request, res: Response): Promise<void> {
    try {
      const result = await perfilService.listAll();
      res.status(200).json({
        success: true,
        data: result.data,
        isFallback: result.isFallback,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar perfis de acesso.',
        error: error.message,
      });
    }
  }
}

export const usuarioController = new UsuarioController();
