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
      const sanitized: Record<string, any> = {
        data: dto.data,
        comum_id: dto.comum_id,
        tipo: dto.tipo,
        quantidade: Number(dto.quantidade) || 0,
      };
      if (dto.auxiliares_mocos !== undefined) sanitized.auxiliares_mocos = Number(dto.auxiliares_mocos) || 0;
      if (dto.auxiliares_mocas !== undefined) sanitized.auxiliares_mocas = Number(dto.auxiliares_mocas) || 0;
      if (dto.total_musicos !== undefined) sanitized.total_musicos = Number(dto.total_musicos) || 0;
      if (dto.detalhes_musicos !== undefined) sanitized.detalhes_musicos = dto.detalhes_musicos;
      if (dto.cadastrado_por !== undefined) sanitized.cadastrado_por = dto.cadastrado_por || null;

      const { data, error } = await supabase
        .from('contagens_mocidade')
        .insert([sanitized])
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
      const sanitized: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (dto.data !== undefined) sanitized.data = dto.data;
      if (dto.comum_id !== undefined) sanitized.comum_id = dto.comum_id;
      if (dto.tipo !== undefined) sanitized.tipo = dto.tipo;
      if (dto.quantidade !== undefined) sanitized.quantidade = Number(dto.quantidade) || 0;
      if (dto.auxiliares_mocos !== undefined) sanitized.auxiliares_mocos = Number(dto.auxiliares_mocos) || 0;
      if (dto.auxiliares_mocas !== undefined) sanitized.auxiliares_mocas = Number(dto.auxiliares_mocas) || 0;
      if (dto.total_musicos !== undefined) sanitized.total_musicos = Number(dto.total_musicos) || 0;
      if (dto.detalhes_musicos !== undefined) sanitized.detalhes_musicos = dto.detalhes_musicos;
      if (dto.cadastrado_por !== undefined) sanitized.cadastrado_por = dto.cadastrado_por || null;

      const { data, error } = await supabase
        .from('contagens_mocidade')
        .update(sanitized)
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

  async getById(id: string): Promise<ContagemMocidade | null> {
    try {
      const { data, error } = await supabase
        .from('contagens_mocidade')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .eq('id', id)
        .single();

      if (error) return null;
      return data as unknown as ContagemMocidade;
    } catch (err: any) {
      console.error('[ContagensService] Exceção ao buscar por ID:', err.message);
      return null;
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
