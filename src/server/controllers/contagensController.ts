import { Request, Response } from 'express';
import { ContagensService } from '../services/contagensService.js';
import { CreateContagemMocidadeDTO, UpdateContagemMocidadeDTO } from '../types/index.js';

const contagensService = new ContagensService();

export const contagensController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await contagensService.getAll();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const dto: CreateContagemMocidadeDTO = req.body;
      const result = await contagensService.create(dto);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto: UpdateContagemMocidadeDTO = req.body;
      const result = await contagensService.update(id, dto);
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
