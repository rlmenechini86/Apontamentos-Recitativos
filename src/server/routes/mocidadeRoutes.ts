import { Router, Request, Response, RequestHandler } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET all mocidade
const getMocidade: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('mocidade')
      .select('*, comum_congregacao:comuns_congregacoes(id, nome)')
      .order('nome_completo');

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST new mocidade
const createMocidade: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body };
    if (body.comum_id === '') {
      body.comum_id = null;
    }

    const { data, error } = await supabase
      .from('mocidade')
      .insert([body])
      .select();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update mocidade
const updateMocidade: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (body.comum_id === '') {
      body.comum_id = null;
    }

    const { data, error } = await supabase
      .from('mocidade')
      .update(body)
      .eq('id', id)
      .select();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE mocidade
const deleteMocidade: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('mocidade')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.get('/', getMocidade);
router.post('/', createMocidade);
router.put('/:id', updateMocidade);
router.delete('/:id', deleteMocidade);

export default router;
