import { supabase } from '../config/supabase.js';
import { ContagemMocidade, CreateContagemMocidadeDTO, UpdateContagemMocidadeDTO } from '../types/index.js';

export class ContagensService {
  async getAll(): Promise<{ data: ContagemMocidade[]; source: string }> {
    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .order('data', { ascending: false });

      if (error) throw new Error(error.message);
      return { data: (data as unknown as ContagemMocidade[]) || [], source: 'supabase' };
    } catch (err: any) {
      console.error('[ContagensService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  async create(dto: CreateContagemMocidadeDTO): Promise<ContagemMocidade> {
    if (!dto.data) throw new Error('Data é obrigatória');
    if (!dto.comum_id) throw new Error('Comum Congregação é obrigatória');
    if (!dto.tipo) throw new Error('Tipo é obrigatório');

    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
        .insert([dto])
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data as unknown as ContagemMocidade;
    } catch (err: any) {
      console.error('[ContagensService] Exceção na criação:', err.message);
      throw err;
    }
  }

  async update(id: string, dto: UpdateContagemMocidadeDTO): Promise<ContagemMocidade> {
    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
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
      return data as unknown as ContagemMocidade;
    } catch (err: any) {
      console.error('[ContagensService] Exceção na atualização:', err.message);
      throw err;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('contagens_mocidade')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    } catch (err: any) {
      console.error('[ContagensService] Exceção na exclusão:', err.message);
      throw err;
    }
  }
}
