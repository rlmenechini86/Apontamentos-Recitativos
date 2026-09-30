import { supabase } from '../config/supabase.js';
import { Recitativo, CreateRecitativoDTO, UpdateRecitativoDTO } from '../types/index.js';

export class RecitativosService {
  async getAll(): Promise<{ data: Recitativo[]; source: string }> {
    try {
      const { data, error } = await supabase
        .from('recitativos')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .order('data', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: (data as unknown as Recitativo[]) || [], source: 'supabase' };
    } catch (err: any) {
      console.error('[RecitativosService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  async create(dto: CreateRecitativoDTO): Promise<Recitativo> {
    if (!dto.data) throw new Error('Data é obrigatória');
    if (!dto.comum_id) throw new Error('Comum Congregação é obrigatória');

    try {
      const { data, error } = await supabase
        .from('recitativos')
        .insert([dto])
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as Recitativo;
    } catch (err: any) {
      console.error('[RecitativosService] Exceção na criação:', err.message);
      throw err;
    }
  }

  async update(id: string, dto: UpdateRecitativoDTO): Promise<Recitativo> {
    try {
      const { data, error } = await supabase
        .from('recitativos')
        .update({
          ...dto,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as Recitativo;
    } catch (err: any) {
      console.error('[RecitativosService] Exceção na atualização:', err.message);
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recitativos')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    } catch (err: any) {
      console.error('[RecitativosService] Exceção na exclusão:', err.message);
      throw err;
    }
  }
}
