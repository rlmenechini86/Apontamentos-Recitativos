import { Request, Response } from 'express';
import { auxiliarJovensService } from '../services/auxiliarJovensService.js';

export class AuxiliarJovensController {
  async list(req: Request, res: Response) {
    try {
      const data = await auxiliarJovensService.list();
      res.json({
        success: true,
        total: data.length,
        source: 'supabase',
        data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await auxiliarJovensService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
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
