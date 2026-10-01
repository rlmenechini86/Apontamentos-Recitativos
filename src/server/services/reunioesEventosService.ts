import { supabase } from '../config/supabase.js';

export class ReunioesEventosService {
  async list() {
    const { data, error } = await supabase
      .from('reunioes_eventos')
      .select('*, tipos_evento(*)')
      .order('data');
    if (error) throw new Error(error.message);
    return data;
  }

  async create(payload: any) {
    if (!payload.data) throw new Error('Data é obrigatória');
    if (!payload.nome) throw new Error('Nome é obrigatório');
    
    const { data, error } = await supabase.from('reunioes_eventos').insert([{ 
      data: payload.data,
      tipo_evento_id: payload.tipo_evento_id || null,
      nome: payload.nome,
      status: payload.status ?? true 
    }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, payload: any) {
    const { data, error } = await supabase.from('reunioes_eventos').update({
      data: payload.data,
      tipo_evento_id: payload.tipo_evento_id,
      nome: payload.nome,
      status: payload.status
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('reunioes_eventos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const reunioesEventosService = new ReunioesEventosService();
