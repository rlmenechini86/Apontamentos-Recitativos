import { Request, Response } from 'express';
import { ContagensService } from '../services/contagensService.js';
import { CreateContagemMocidadeDTO, UpdateContagemMocidadeDTO } from '../types/index.js';
import { auditService } from '../services/auditService.js';
import { usuarioService } from '../services/usuarioService.js';

const contagensService = new ContagensService();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function resolveUserInfo(req: Request, fallbackId?: string | null) {
  let userId = req.user?.userId || fallbackId || null;
  let userEmail = req.user?.email || null;
  let userName = req.user?.nome || null;

  if (userId && (!userName || !userEmail)) {
    try {
      const u = await usuarioService.getById(userId);
      if (u) {
        if (!userName) userName = u.nome_completo;
        if (!userEmail) userEmail = u.email;
      }
    } catch (e) {
      // ignore
    }
  }

  if (!userName && (req.body as any)?.cadastrado_por_nome) {
    userName = (req.body as any).cadastrado_por_nome;
  }

  return {
    userId,
    userEmail,
    userName: userName || 'Usuário do Sistema'
  };
}

export const contagensController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await contagensService.getAll();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await contagensService.getById(id);
      if (!result) return res.status(404).json({ error: 'Contagem não encontrada' });
      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getLogs: async (req: Request, res: Response) => {
    try {
      const { registro_id } = req.query;
      let logs: any[];
      if (registro_id) {
        logs = await auditService.getApontamentoLogsByRegistroId(String(registro_id));
      } else {
        logs = await auditService.getApontamentoLogs(100);
      }
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const dto: CreateContagemMocidadeDTO = req.body;
      const result = await contagensService.create(dto);

      const userInfo = await resolveUserInfo(req, dto.cadastrado_por);
      await auditService.logApontamentoAction({
        acao: 'CREATE',
        tabela: 'contagens_mocidade',
        registroId: result.id,
        usuarioId: userInfo.userId,
        usuarioEmail: userInfo.userEmail,
        usuarioNome: userInfo.userName,
        comumNome: result.comum_congregacao?.nome || null,
        dataApontamento: result.data,
        valoresInseridos: {
          tipo: result.tipo,
          quantidade: result.quantidade,
          comum_id: result.comum_id,
          data: result.data,
          ...(result.justificativas_diminuicao && result.justificativas_diminuicao.length > 0
            ? { justificativas_diminuicao: result.justificativas_diminuicao }
            : {}),
        },
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto: UpdateContagemMocidadeDTO = req.body;

      const previous = await contagensService.getById(id);
      const result = await contagensService.update(id, dto);

      const userInfo = await resolveUserInfo(req, dto.cadastrado_por || previous?.cadastrado_por);

      const alteracoes: Record<string, { de: any; para: any }> = {};
      const fields = ['quantidade', 'tipo', 'data', 'comum_id'] as const;
      for (const f of fields) {
        if (dto[f] !== undefined && previous && (previous as any)[f] !== (dto as any)[f]) {
          alteracoes[f] = {
            de: (previous as any)[f],
            para: (dto as any)[f]
          };
        }
      }

      await auditService.logApontamentoAction({
        acao: 'UPDATE',
        tabela: 'contagens_mocidade',
        registroId: id,
        usuarioId: userInfo.userId,
        usuarioEmail: userInfo.userEmail,
        usuarioNome: userInfo.userName,
        comumNome: result.comum_congregacao?.nome || previous?.comum_congregacao?.nome || null,
        dataApontamento: result.data,
        valoresAnteriores: previous ? {
          tipo: previous.tipo,
          quantidade: previous.quantidade,
          data: previous.data,
        } : null,
        valoresAlterados: Object.keys(alteracoes).length > 0 ? alteracoes : null,
        valoresNovos: {
          tipo: result.tipo,
          quantidade: result.quantidade,
          data: result.data,
        },
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] as string,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await contagensService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
