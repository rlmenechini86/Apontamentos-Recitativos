import { supabase } from '../config/supabase.js';

export class TiposEventoService {
  async list() {
    const { data, error } = await supabase.from('tipos_evento').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data;
  }

  async create(payload: any) {
    if (!payload.nome) throw new Error('Nome é obrigatório');
    const { data, error } = await supabase.from('tipos_evento').insert([{ 
      data: payload.data || new Date().toISOString().split('T')[0],
      nome: payload.nome,
      cor: payload.cor || '#3b82f6',
      status: payload.status ?? true 
    }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, payload: any) {
    const { data, error } = await supabase.from('tipos_evento').update({
      data: payload.data || undefined,
      nome: payload.nome,
      cor: payload.cor,
      status: payload.status
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('tipos_evento').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const tiposEventoService = new TiposEventoService();
