import { Request, Response } from 'express';
import { auxiliarJovensService } from '../services/auxiliarJovensService.js';

export class AuxiliarJovensController {
  async list(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const setor_id = req.query.setor_id as string | undefined;
      const comum_id = req.query.comum_id as string | undefined;
      const sexo = req.query.sexo as string | undefined;
      
      let is_auxiliar: boolean | undefined = undefined;
      if (req.query.auxiliar === 'sim') is_auxiliar = true;
      if (req.query.auxiliar === 'nao') is_auxiliar = false;

      let is_musico: boolean | undefined = undefined;
      if (req.query.musico === 'sim') is_musico = true;
      if (req.query.musico === 'nao') is_musico = false;

      const instrumento = req.query.instrumento as string | undefined;
      const familia = req.query.familia as string | undefined;
      const sort_by = req.query.sort_by as string | undefined;
      const sort_direction = req.query.sort_direction as 'asc' | 'desc' | undefined;

      const result = await auxiliarJovensService.list({
        page,
        limit,
        search,
        setor_id,
        comum_id,
        sexo,
        is_auxiliar,
        is_musico,
        instrumento,
        familia,
        sort_by,
        sort_direction,
      });

      res.json({
        success: true,
        total: result.total,
        page: page || 1,
        limit: limit || result.total,
        totalPages: limit ? Math.ceil(result.total / limit) : 1,
        source: 'supabase',
        data: result.data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      console.log('[CREATE Auxiliar] Payload recebido:', req.body);
      const data = await auxiliarJovensService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      console.log('[UPDATE Auxiliar] ID:', req.params.id, 'Payload:', req.body);
      const data = await auxiliarJovensService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await auxiliarJovensService.delete(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const auxiliarJovensController = new AuxiliarJovensController();
