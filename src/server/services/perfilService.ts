import { supabase } from '../config/supabase.js';
import { Perfil } from '../types/index.js';

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
}

export const perfilService = new PerfilService();
