import { Request, Response } from 'express';
import { comumCongregacaoService } from '../services/comumCongregacaoService.js';
import { setorService } from '../services/setorService.js';
import { ComumFilterOptions } from '../types/index.js';

export class ComumCongregacaoController {
  /**
   * GET /api/comuns
   * Lista congregações com filtros opcionais
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const filters: ComumFilterOptions = {};
      if (req.query.setor_id) filters.setor_id = String(req.query.setor_id);
      if (req.query.cidade) filters.cidade = String(req.query.cidade);
      if (req.query.search) filters.search = String(req.query.search);
      if (req.query.ativo !== undefined) {
        filters.ativo = req.query.ativo === 'true' || req.query.ativo === '1';
      }

      const result = await comumCongregacaoService.list(filters);
      res.status(200).json({
        success: true,
        total: result.data.length,
        source: result.source,
        data: result.data,
      });
    } catch (error: any) {
      console.error('[ComumController.list] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao consultar Comuns Congregações.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/comuns/:id
   * Obtém detalhes de uma congregação por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const comum = await comumCongregacaoService.getById(id);

      if (!comum) {
        res.status(404).json({
          success: false,
          message: `Comum Congregação com ID '${id}' não foi encontrada.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: comum,
      });
    } catch (error: any) {
      console.error('[ComumController.getById] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar Comum Congregação.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/comuns
   * Cadastra nova Comum Congregação vinculada ao Setor
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { setor_id, nome, codigo, endereco, bairro, cidade, estado, cep, dia_reuniao_jovens, ativo, anciao_id } = req.body;

      if (!nome || !setor_id) {
        res.status(400).json({
          success: false,
          message: 'Campos obrigatórios ausentes: Nome da Congregação e Setor Pertencente são obrigatórios.',
        });
        return;
      }

      const created = await comumCongregacaoService.create({
        setor_id,
        nome,
        codigo,
        endereco,
        bairro,
        cidade,
        estado: estado || 'SP',
        cep,
        dia_reuniao_jovens,
        anciao_id: anciao_id || null,
        ativo: ativo !== undefined ? ativo : true,
      });

      res.status(201).json({
        success: true,
        message: 'Comum Congregação cadastrada com sucesso!',
        data: created,
      });
    } catch (error: any) {
      console.error('[ComumController.create] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao cadastrar Comum Congregação.',
      });
    }
  }

  /**
   * GET /api/comuns/meta/next-codigo
   * Retorna o próximo código de controle interno gerado automaticamente
   */
  async getNextCodigo(_req: Request, res: Response): Promise<void> {
    try {
      const nextCodigo = await comumCongregacaoService.generateNextCodigo();
      res.status(200).json({
        success: true,
        data: { nextCodigo },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar próximo código.',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/comuns/:id
   * Atualiza dados da Comum Congregação
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await comumCongregacaoService.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Comum Congregação atualizada com sucesso!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[ComumController.update] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao atualizar Comum Congregação.',
      });
    }
  }

  /**
   * DELETE /api/comuns/:id
   * Remove uma congregação
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await comumCongregacaoService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Comum Congregação removida com sucesso.',
      });
    } catch (error: any) {
      console.error('[ComumController.delete] Erro:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Falha ao remover Comum Congregação.',
      });
    }
  }

  /**
   * GET /api/comuns/meta/setores
   * Lista setores disponíveis para vincular à Comum
   */
  async listSetores(_req: Request, res: Response): Promise<void> {
    try {
      const result = await setorService.listAll();
      res.status(200).json({
        success: true,
        data: result.data,
        isFallback: result.isFallback,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao carregar lista de setores.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/comuns/meta/status
   * Diagnóstico do banco e tabelas
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await comumCongregacaoService.checkStatus();
      res.status(200).json({
        success: true,
        ...status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        connected: false,
        tableExists: false,
        message: error.message,
      });
    }
  }
}

export const comumCongregacaoController = new ComumCongregacaoController();
