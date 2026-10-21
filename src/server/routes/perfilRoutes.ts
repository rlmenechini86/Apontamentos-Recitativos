import { Router } from 'express';
import { perfilService } from '../services/perfilService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await perfilService.listAll();
    res.json({ success: true, data: result.data, isFallback: result.isFallback });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await perfilService.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, descricao, nivel_acesso } = req.body;
    if (!nome || !nivel_acesso) {
      return res.status(400).json({ success: false, error: 'Nome e nível de acesso são obrigatórios' });
    }
    const data = await perfilService.create({ nome, descricao, nivel_acesso });
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = await perfilService.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Perfil não encontrado' });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await perfilService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Perfil excluído com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
