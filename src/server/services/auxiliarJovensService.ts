import { supabase } from '../config/supabase.js';

export interface AuxiliarJovemDTO {
  nome: string;
  data_apresentacao?: string;
  sexo: string;
  celular?: string;
  data_nascimento?: string;
  comum_id: string;
  ativo?: boolean;
  is_auxiliar?: boolean;
  is_musico?: boolean;
  instrumento?: string;
  nome_responsavel?: string;
}

export interface AuxiliarJovensFilterDTO {
  page?: number;
  limit?: number;
  search?: string;
  setor_id?: string;
  comum_id?: string;
  sexo?: string;
  is_auxiliar?: boolean;
  is_musico?: boolean;
  instrumento?: string;
  familia?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

export class AuxiliarJovensService {
  async list(filters?: AuxiliarJovensFilterDTO) {
    let query = supabase
      .from('mocidade')
      .select(`
        *,
        comum_congregacao:comum_id (
          id,
          nome,
          codigo,
          setor_id,
          setor_pertencente
        )
      `, { count: 'exact' });

    if (filters) {
      if (filters.search) {
        const term = filters.search.trim();
        query = query.or(`nome.ilike.%${term}%,celular.ilike.%${term}%`);
      }

      if (filters.setor_id && !filters.comum_id) {
        // Filtrar congregações pertencentes ao setor selecionado
        const { data: comunsDoSetor } = await supabase
          .from('comum_congregacao')
          .select('id')
          .eq('setor_id', filters.setor_id);
        
        if (comunsDoSetor && comunsDoSetor.length > 0) {
          query = query.in('comum_id', comunsDoSetor.map(c => c.id));
        } else {
          return { data: [], total: 0 };
        }
      } else if (filters.comum_id) {
        query = query.eq('comum_id', filters.comum_id);
      }

      if (filters.sexo) {
        query = query.eq('sexo', filters.sexo);
      }

      if (filters.is_auxiliar !== undefined) {
        query = query.eq('is_auxiliar', filters.is_auxiliar);
      }

      if (filters.is_musico !== undefined) {
        query = query.eq('is_musico', filters.is_musico);
      }

      if (filters.instrumento) {
        query = query.ilike('instrumento', `%${filters.instrumento}%`);
      }

      if (filters.familia) {
        const f = filters.familia.toLowerCase();
        if (f.includes('corda')) {
          query = query.or('instrumento.ilike.%violino%,instrumento.ilike.%viola%,instrumento.ilike.%celo%,instrumento.ilike.%violoncelo%');
        } else if (f.includes('madeira')) {
          query = query.or('instrumento.ilike.%flauta%,instrumento.ilike.%clarineta%,instrumento.ilike.%clarone%,instrumento.ilike.%sax%,instrumento.ilike.%oboé%,instrumento.ilike.%fagote%');
        } else if (f.includes('metal') || f.includes('metais')) {
          query = query.or('instrumento.ilike.%trompete%,instrumento.ilike.%trombone%,instrumento.ilike.%euphonio%,instrumento.ilike.%bombardino%,instrumento.ilike.%tuba%,instrumento.ilike.%trompa%');
        } else if (f.includes('tecla')) {
          query = query.or('instrumento.ilike.%acordeon%,instrumento.ilike.%órgão%,instrumento.ilike.%orgao%,instrumento.ilike.%teclado%,instrumento.ilike.%piano%');
        }
      }

      const sortBy = filters.sort_by || 'nome';
      const ascending = filters.sort_direction !== 'desc';
      query = query.order(sortBy, { ascending });

      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }
    } else {
      query = query.order('nome', { ascending: true });
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[AuxiliarJovensService] Erro ao listar:', error.message);
      throw error;
    }

    return {
      data: data || [],
      total: count !== null && count !== undefined ? count : (data ? data.length : 0),
    };
  }

  async create(dto: AuxiliarJovemDTO) {
    const payload: any = {
      nome: dto.nome.trim(),
      sexo: dto.sexo,
      comum_id: dto.comum_id,
      ativo: dto.ativo ?? true,
      is_auxiliar: dto.is_auxiliar ?? true,
      is_musico: dto.is_musico ?? false,
      instrumento: dto.instrumento || null,
      nome_responsavel: dto.nome_responsavel || null
    };

    if (dto.data_apresentacao) payload.data_apresentacao = dto.data_apresentacao;
    if (dto.data_nascimento) payload.data_nascimento = dto.data_nascimento;
    if (dto.celular) payload.celular = dto.celular.trim();

    const { data, error } = await supabase
      .from('mocidade')
      .insert(payload)
      .select(`
        *,
        comum_congregacao:comum_id (id, nome, codigo)
      `)
      .single();

    if (error) {
      console.error('[AuxiliarJovensService] Erro ao criar:', error.message);
      throw error;
    }

    return data;
  }

  async update(id: string, dto: Partial<AuxiliarJovemDTO>) {
    const payload: any = {};
    if (dto.nome !== undefined) payload.nome = dto.nome.trim();
    if (dto.sexo !== undefined) payload.sexo = dto.sexo;
    if (dto.comum_id !== undefined) payload.comum_id = dto.comum_id;
    if (dto.ativo !== undefined) payload.ativo = dto.ativo;
    if (dto.is_auxiliar !== undefined) payload.is_auxiliar = dto.is_auxiliar;
    if (dto.is_musico !== undefined) payload.is_musico = dto.is_musico;
    if (dto.instrumento !== undefined) payload.instrumento = dto.instrumento;
    if (dto.nome_responsavel !== undefined) payload.nome_responsavel = dto.nome_responsavel || null;
    
    if (dto.data_apresentacao !== undefined) payload.data_apresentacao = dto.data_apresentacao || null;
    if (dto.data_nascimento !== undefined) payload.data_nascimento = dto.data_nascimento || null;
    if (dto.celular !== undefined) payload.celular = dto.celular.trim() || null;

    const { data, error } = await supabase
      .from('mocidade')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        comum_congregacao:comum_id (id, nome, codigo)
      `)
      .single();

    if (error) {
      console.error('[AuxiliarJovensService] Erro ao atualizar:', error.message);
      throw error;
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('mocidade')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[AuxiliarJovensService] Erro ao excluir:', error.message);
      throw error;
    }

    return { success: true };
  }
}

export const auxiliarJovensService = new AuxiliarJovensService();
