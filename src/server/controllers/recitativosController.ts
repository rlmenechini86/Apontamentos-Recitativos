import { Request, Response } from 'express';
import { RecitativosService } from '../services/recitativosService.js';
import { CreateRecitativoDTO, UpdateRecitativoDTO } from '../types/index.js';
import { auditService } from '../services/auditService.js';
import { usuarioService } from '../services/usuarioService.js';

const recitativosService = new RecitativosService();

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

export const recitativosController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await recitativosService.getAll();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await recitativosService.getById(id);
      if (!result) return res.status(404).json({ error: 'Apontamento não encontrado' });
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
      const dto: CreateRecitativoDTO = req.body;
      const result = await recitativosService.create(dto);

      const userInfo = await resolveUserInfo(req, dto.cadastrado_por);
      await auditService.logApontamentoAction({
        acao: 'CREATE',
        tabela: 'recitativos',
        registroId: result.id,
        usuarioId: userInfo.userId,
        usuarioEmail: userInfo.userEmail,
        usuarioNome: userInfo.userName,
        comumNome: result.comum_congregacao?.nome || null,
        dataApontamento: result.data,
        valoresInseridos: {
          comum_id: result.comum_id,
          data: result.data,
          mocos: result.mocos,
          mocas: result.mocas,
          meninos: result.meninos,
          meninas: result.meninas,
          total: result.total,
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
      const dto: UpdateRecitativoDTO = req.body;

      const previous = await recitativosService.getById(id);
      const result = await recitativosService.update(id, dto);

      const userInfo = await resolveUserInfo(req, dto.cadastrado_por || previous?.cadastrado_por);

      // Calcular quais valores foram alterados
      const alteracoes: Record<string, { de: any; para: any }> = {};
      const fields = ['mocos', 'mocas', 'meninos', 'meninas', 'data', 'comum_id'] as const;
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
        tabela: 'recitativos',
        registroId: id,
        usuarioId: userInfo.userId,
        usuarioEmail: userInfo.userEmail,
        usuarioNome: userInfo.userName,
        comumNome: result.comum_congregacao?.nome || previous?.comum_congregacao?.nome || null,
        dataApontamento: result.data,
        valoresAnteriores: previous ? {
          mocos: previous.mocos,
          mocas: previous.mocas,
          meninos: previous.meninos,
          meninas: previous.meninas,
          total: previous.total,
          data: previous.data,
        } : null,
        valoresAlterados: Object.keys(alteracoes).length > 0 ? alteracoes : null,
        valoresNovos: {
          mocos: result.mocos,
          mocas: result.mocas,
          meninos: result.meninos,
          meninas: result.meninas,
          total: result.total,
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
      await recitativosService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
};
