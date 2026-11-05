import { supabase } from '../config/supabase.js';
import { Recitativo, CreateRecitativoDTO, UpdateRecitativoDTO } from '../types/index.js';

export class RecitativosService {
  async getAll(): Promise<{ data: Recitativo[]; source: string }> {
    try {
      const allData: Recitativo[] = [];
      const batchSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('recitativos')
          .select(`
            *,
            comum_congregacao:comum_id (id, codigo, nome),
            usuario:cadastrado_por (id, nome_completo)
          `)
          .order('data', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData.push(...(data as unknown as Recitativo[]));
          from += batchSize;
          if (data.length < batchSize) hasMore = false;
        }
      }

      return { data: allData, source: 'supabase' };
    } catch (err: any) {
      console.error('[RecitativosService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  async create(dto: CreateRecitativoDTO): Promise<Recitativo> {
    if (!dto.data) throw new Error('Data é obrigatória');
    if (!dto.comum_id) throw new Error('Comum Congregação é obrigatória');

    try {
      const sanitized: Record<string, any> = {
        data: dto.data,
        comum_id: dto.comum_id,
        mocos: Number(dto.mocos) || 0,
        mocas: Number(dto.mocas) || 0,
        meninos: Number(dto.meninos) || 0,
        meninas: Number(dto.meninas) || 0,
      };
      if (dto.cadastrado_por !== undefined) {
        sanitized.cadastrado_por = dto.cadastrado_por || null;
      }

      const { data, error } = await supabase
        .from('recitativos')
        .insert([sanitized])
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
      const sanitized: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (dto.data !== undefined) sanitized.data = dto.data;
      if (dto.comum_id !== undefined) sanitized.comum_id = dto.comum_id;
      if (dto.mocos !== undefined) sanitized.mocos = Number(dto.mocos) || 0;
      if (dto.mocas !== undefined) sanitized.mocas = Number(dto.mocas) || 0;
      if (dto.meninos !== undefined) sanitized.meninos = Number(dto.meninos) || 0;
      if (dto.meninas !== undefined) sanitized.meninas = Number(dto.meninas) || 0;
      if (dto.cadastrado_por !== undefined) sanitized.cadastrado_por = dto.cadastrado_por || null;

      const { data, error } = await supabase
        .from('recitativos')
        .update(sanitized)
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

  async getById(id: string): Promise<Recitativo | null> {
    try {
      const { data, error } = await supabase
        .from('recitativos')
        .select(`
          *,
          comum_congregacao:comum_id (id, codigo, nome),
          usuario:cadastrado_por (id, nome_completo)
        `)
        .eq('id', id)
        .single();

      if (error) return null;
      return data as unknown as Recitativo;
    } catch (err: any) {
      console.error('[RecitativosService] Exceção ao buscar por ID:', err.message);
      return null;
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
