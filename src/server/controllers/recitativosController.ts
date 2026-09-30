import { Request, Response } from 'express';
import { RecitativosService } from '../services/recitativosService.js';
import { CreateRecitativoDTO, UpdateRecitativoDTO } from '../types/index.js';

const recitativosService = new RecitativosService();

export const recitativosController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await recitativosService.getAll();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const dto: CreateRecitativoDTO = req.body;
      const result = await recitativosService.create(dto);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto: UpdateRecitativoDTO = req.body;
      const result = await recitativosService.update(id, dto);
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
