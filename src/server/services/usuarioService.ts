import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import {
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  UsuarioFilterOptions,
} from '../types/index.js';
import { perfilService } from './perfilService.js';
import { comumCongregacaoService } from './comumCongregacaoService.js';

let inMemoryUsuarios: Usuario[] = [];

export class UsuarioService {
  /**
   * READ: Lista usuários com suporte a filtros e joins
   */
  async list(filters?: UsuarioFilterOptions): Promise<{ data: Usuario[]; source: 'supabase' | 'in-memory' }> {
    try {
      let query = supabase
        .from('usuarios')
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            descricao,
            nivel_acesso
          ),
          comum_congregacao:comum_congregacao_id (
            id,
            codigo,
            nome
          )
        `)
        .order('nome_completo', { ascending: true });

      if (filters?.perfil_id) {
        query = query.eq('perfil_id', filters.perfil_id);
      }
      if (filters?.comum_congregacao_id) {
        query = query.eq('comum_congregacao_id', filters.comum_congregacao_id);
      }
      if (filters?.ativo !== undefined) {
        query = query.eq('ativo', filters.ativo);
      }
      if (filters?.search) {
        query = query.or(`nome_completo.ilike.%${filters.search}%,email.ilike.%${filters.search}%,celular.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { data: (data as unknown as Usuario[]) || [], source: 'supabase' };
    } catch (err: any) {
      console.error('[UsuarioService] Exceção na listagem:', err.message);
      throw err;
    }
  }

  /**
   * READ: Obtém usuário por ID
   */
  async getById(id: string): Promise<Usuario | null> {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            descricao,
            nivel_acesso
          ),
          comum_congregacao:comum_congregacao_id (
            id,
            codigo,
            nome
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Usuario;
    } catch (err: any) {
      console.error('[UsuarioService] Exceção ao buscar por ID:', err.message);
      return null;
    }
  }

  /**
   * READ: Obtém usuário por E-mail
   */
  async getByEmail(email: string): Promise<Usuario | null> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            descricao,
            nivel_acesso
          ),
          comum_congregacao:comum_congregacao_id (
            id,
            codigo,
            nome
          )
        `)
        .ilike('email', cleanEmail)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Usuario;
    } catch (err: any) {
      console.error('[UsuarioService] Exceção ao buscar por Email:', err.message);
      return null;
    }
  }

  /**
   * CREATE: Cadastra novo Usuário
   */
  async create(dto: CreateUsuarioDTO): Promise<Usuario> {
    // Validações de Regra de Negócio
    if (!dto.nome_completo?.trim()) {
      throw new Error('O Nome Completo do usuário é obrigatório.');
    }
    if (!dto.email?.trim()) {
      throw new Error('O E-mail é obrigatório.');
    }
    if (!dto.celular?.trim()) {
      throw new Error('O Celular/WhatsApp é obrigatório.');
    }
    if (!dto.perfil_id?.trim()) {
      throw new Error('O Perfil de Acesso é obrigatório.');
    }

    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash('ccb123', salt);

    const newRecordPayload = {
      nome_completo: dto.nome_completo.trim(),
      email: dto.email.trim().toLowerCase(),
      celular: dto.celular.trim(),
      cargo_ministerio: dto.cargo_ministerio || null,
      data_apresentacao: dto.data_apresentacao || null,
      data_nascimento: dto.data_nascimento || null,
      perfil_id: dto.perfil_id,
      comum_congregacao_id: dto.comum_congregacao_id || null,
      ativo: dto.ativo !== undefined ? dto.ativo : true,
      senha_hash,
      trocar_senha_proximo_login: true,
    };

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([newRecordPayload])
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            descricao,
            nivel_acesso
          ),
          comum_congregacao:comum_congregacao_id (
            id,
            codigo,
            nome
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Usuario;
    } catch (err: any) {
      console.error('[UsuarioService] Exceção ao gravar no Supabase:', err.message);
      throw err;
    }
  }

  /**
   * UPDATE: Atualiza dados de um Usuário
   */
  async update(id: string, dto: UpdateUsuarioDTO): Promise<Usuario> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Usuário com ID '${id}' não encontrado.`);
    }

    const updatePayload: Record<string, any> = {};
    if (dto.nome_completo !== undefined) updatePayload.nome_completo = dto.nome_completo.trim();
    if (dto.email !== undefined) updatePayload.email = dto.email.trim().toLowerCase();
    if (dto.celular !== undefined) updatePayload.celular = dto.celular.trim();
    if (dto.cargo_ministerio !== undefined) updatePayload.cargo_ministerio = dto.cargo_ministerio || null;
    if (dto.data_apresentacao !== undefined) updatePayload.data_apresentacao = dto.data_apresentacao || null;
    if (dto.data_nascimento !== undefined) updatePayload.data_nascimento = dto.data_nascimento || null;
    if (dto.perfil_id !== undefined) updatePayload.perfil_id = dto.perfil_id;
    if (dto.comum_congregacao_id !== undefined) updatePayload.comum_congregacao_id = dto.comum_congregacao_id || null;
    if (dto.senha_hash !== undefined) updatePayload.senha_hash = dto.senha_hash;
    if (dto.trocar_senha_proximo_login !== undefined) updatePayload.trocar_senha_proximo_login = dto.trocar_senha_proximo_login;
    if (dto.ativo !== undefined) updatePayload.ativo = dto.ativo;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            descricao,
            nivel_acesso
          ),
          comum_congregacao:comum_congregacao_id (
            id,
            codigo,
            nome
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Usuario;
    } catch (err: any) {
      console.error('[UsuarioService] Exceção no update Supabase:', err.message);
      throw err;
    }
  }

  /**
   * DELETE: Remove um Usuário
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Usuário com ID '${id}' não encontrado.`);
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
      return true;
    } catch (err: any) {
      console.error('[UsuarioService] Exceção no delete Supabase:', err.message);
      throw err;
    }
  }
}

export const usuarioService = new UsuarioService();
