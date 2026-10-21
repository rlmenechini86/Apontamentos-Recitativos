import { supabase } from '../config/supabase.js';

export class AnciaoService {
  async list() {
    const { data, error } = await supabase.from('anciaos').select('*').order('nome');
    if (error) throw new Error(error.message);
    return data;
  }

  async create(payload: any) {
    if (!payload.nome) throw new Error('Nome é obrigatório');
    
    const insertData: any = {
      nome: payload.nome,
      setor_pertencente: payload.setor_pertencente || null,
      setor_id: payload.setor_id || null,
      data_cadastro: payload.data_cadastro || undefined,
      ativo: payload.ativo ?? true 
    };

    try {
      const { data, error } = await supabase.from('anciaos').insert([insertData]).select().single();
      if (error) throw error;
      return data;
    } catch (err: any) {
      // Fallback caso a migration da coluna ainda não tenha sido executada no Supabase
      if (err.message?.includes('setor_pertencente') || err.message?.includes('column')) {
        console.warn('[AnciaoService] Coluna setor_pertencente pode não existir ainda no banco. Tentando insert básico...');
        delete insertData.setor_pertencente;
        delete insertData.setor_id;
        const { data, error } = await supabase.from('anciaos').insert([insertData]).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
      throw new Error(err.message);
    }
  }

  async update(id: string, payload: any) {
    const updateData: any = {
      nome: payload.nome,
      setor_pertencente: payload.setor_pertencente || null,
      setor_id: payload.setor_id || null,
      data_cadastro: payload.data_cadastro || undefined,
      ativo: payload.ativo
    };

    try {
      const { data, error } = await supabase.from('anciaos').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (err: any) {
      if (err.message?.includes('setor_pertencente') || err.message?.includes('column')) {
        console.warn('[AnciaoService] Coluna setor_pertencente pode não existir ainda no banco. Tentando update básico...');
        delete updateData.setor_pertencente;
        delete updateData.setor_id;
        const { data, error } = await supabase.from('anciaos').update(updateData).eq('id', id).select().single();
        if (error) throw new Error(error.message);
        return data;
      }
      throw new Error(err.message);
    }
  }

  async delete(id: string) {
    const { error } = await supabase.from('anciaos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}

export const anciaoService = new AnciaoService();
