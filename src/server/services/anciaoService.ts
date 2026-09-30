import { supabase } from '../config/supabase.js';

export class AnciaoService {
  async list() {
    const { data, error } = await supabase.from('anciaos').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data;
  }

  async create(payload: any) {
    if (!payload.nome) throw new Error('Nome é obrigatório');
    const { data, error } = await supabase.from('anciaos').insert([{ 
      nome: payload.nome, 
      data_cadastro: payload.data_cadastro || undefined,
      ativo: payload.ativo ?? true 
    }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, payload: any) {
    const { data, error } = await supabase.from('anciaos').update({
      nome: payload.nome,
      data_cadastro: payload.data_cadastro || undefined,
      ativo: payload.ativo
    }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('anciaos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const anciaoService = new AnciaoService();
