import { Request, Response } from 'express';
import { anciaoService } from '../services/anciaoService.js';

export class AnciaoController {
  async list(req: Request, res: Response) {
    try {
      const data = await anciaoService.list();
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await anciaoService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await anciaoService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await anciaoService.delete(req.params.id);
      res.status(200).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const anciaoController = new AnciaoController();
