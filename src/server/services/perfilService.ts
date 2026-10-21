import { supabase } from '../config/supabase.js';
import { Perfil } from '../types/index.js';
import crypto from 'crypto';

let inMemoryPerfis: Perfil[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Administrador',
    descricao: 'Acesso irrestrito com visão global de todos os setores e congregações.',
    nivel_acesso: 'global',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'CJM',
    descricao: 'Cooperador de Jovens e Menores com visão consolidada do seu Setor.',
    nivel_acesso: 'setor',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Apontamento',
    descricao: 'Responsável pelo registro de apontamentos da sua própria Comum Congregação.',
    nivel_acesso: 'comum',
  },
];

export class PerfilService {
  async listAll(): Promise<{ data: Perfil[]; isFallback?: boolean }> {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        return { data: inMemoryPerfis, isFallback: true };
      }

      return { data: (data as Perfil[]) || [], isFallback: false };
    } catch {
      return { data: inMemoryPerfis, isFallback: true };
    }
  }

  async getById(id: string): Promise<Perfil | null> {
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemoryPerfis.find((p) => p.id === id) || null;
      }

      return data as Perfil;
    } catch {
      return inMemoryPerfis.find((p) => p.id === id) || null;
    }
  }

  async create(dto: { nome: string; descricao?: string; nivel_acesso: 'global' | 'setor' | 'comum' }): Promise<Perfil> {
    const newId = crypto.randomUUID();
    const newPerfil: Perfil = {
      id: newId,
      nome: dto.nome.trim(),
      descricao: dto.descricao?.trim() || '',
      nivel_acesso: dto.nivel_acesso,
    };

    try {
      const { data, error } = await supabase
        .from('perfis')
        .insert({
          id: newId,
          nome: newPerfil.nome,
          descricao: newPerfil.descricao,
          nivel_acesso: newPerfil.nivel_acesso,
        })
        .select()
        .single();

      if (error) {
        console.warn('[PerfilService] Fallback to inMemoryPerfis ao criar perfil:', error.message);
        inMemoryPerfis.push(newPerfil);
        return newPerfil;
      }

      inMemoryPerfis.push(data as Perfil);
      return data as Perfil;
    } catch (err: any) {
      console.warn('[PerfilService] Exceção ao criar perfil, usando inMemory:', err.message);
      inMemoryPerfis.push(newPerfil);
      return newPerfil;
    }
  }

  async update(id: string, dto: { nome?: string; descricao?: string; nivel_acesso?: 'global' | 'setor' | 'comum' }): Promise<Perfil | null> {
    const payload: any = {};
    if (dto.nome !== undefined) payload.nome = dto.nome.trim();
    if (dto.descricao !== undefined) payload.descricao = dto.descricao.trim();
    if (dto.nivel_acesso !== undefined) payload.nivel_acesso = dto.nivel_acesso;
    payload.updated_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('perfis')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const idx = inMemoryPerfis.findIndex(p => p.id === id);
        if (idx !== -1) {
          inMemoryPerfis[idx] = { ...inMemoryPerfis[idx], ...payload };
          return inMemoryPerfis[idx];
        }
        return null;
      }

      const idx = inMemoryPerfis.findIndex(p => p.id === id);
      if (idx !== -1) inMemoryPerfis[idx] = data as Perfil;
      return data as Perfil;
    } catch {
      const idx = inMemoryPerfis.findIndex(p => p.id === id);
      if (idx !== -1) {
        inMemoryPerfis[idx] = { ...inMemoryPerfis[idx], ...payload };
        return inMemoryPerfis[idx];
      }
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const baseIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ];
    if (baseIds.includes(id)) {
      throw new Error('Não é permitido excluir os perfis nativos do sistema.');
    }

    try {
      const { error } = await supabase
        .from('perfis')
        .delete()
        .eq('id', id);

      if (error) {
        inMemoryPerfis = inMemoryPerfis.filter(p => p.id !== id);
        return true;
      }

      inMemoryPerfis = inMemoryPerfis.filter(p => p.id !== id);
      return true;
    } catch {
      inMemoryPerfis = inMemoryPerfis.filter(p => p.id !== id);
      return true;
    }
  }
}

export const perfilService = new PerfilService();
