import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agenda_visitas')
      .select('*, comum_congregacao(id, nome, codigo)')
      .order('data_visita', { ascending: true })
      .order('horario', { ascending: true });

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, endereco, horario, ponto_encontro, cor, data_visita, comum_id } = req.body;
    
    if (!nome || !data_visita) {
      return res.status(400).json({ error: 'Nome e data da visita são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('agenda_visitas')
      .insert([{ 
        nome, 
        endereco, 
        horario, 
        ponto_encontro, 
        cor, 
        data_visita,
        comum_id: comum_id || null
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, endereco, horario, ponto_encontro, cor, data_visita, comum_id } = req.body;
    
    const { data, error } = await supabase
      .from('agenda_visitas')
      .update({ 
        nome, 
        endereco, 
        horario, 
        ponto_encontro, 
        cor, 
        data_visita,
        comum_id: comum_id || null
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('agenda_visitas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Visita deletada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
