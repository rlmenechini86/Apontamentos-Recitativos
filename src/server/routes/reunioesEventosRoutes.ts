import { Router } from 'express';
import { reunioesEventosService } from '../services/reunioesEventosService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const data = await reunioesEventosService.list();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = await reunioesEventosService.create(req.body);
    res.status(201).json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = await reunioesEventosService.update(req.params.id, req.body);
    res.json({ data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await reunioesEventosService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
