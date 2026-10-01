import { Router } from 'express';
import { tiposEventoService } from '../services/tiposEventoService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const data = await tiposEventoService.list();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await tiposEventoService.create(req.body);
    res.status(201).json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = await tiposEventoService.update(req.params.id, req.body);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await tiposEventoService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
