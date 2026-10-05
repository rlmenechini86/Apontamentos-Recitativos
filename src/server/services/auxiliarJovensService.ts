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

export class AuxiliarJovensService {
  async list() {
    const { data, error } = await supabase
      .from('mocidade')
      .select(`
        *,
        comum_congregacao:comum_id (
          id,
          nome,
          codigo
        )
      `)
      .order('nome');

    if (error) {
      console.error('[AuxiliarJovensService] Erro ao listar:', error.message);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('[LIST Auxiliares] Exemplo de registro retornado pelo Supabase:', data[0]);
    }

    return data || [];
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
    
    // allow nulls for dates/celular
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
