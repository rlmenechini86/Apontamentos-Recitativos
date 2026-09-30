import { supabase } from '../config/supabase.js';
import { Setor } from '../types/index.js';

// Memória local para contingência com os setores solicitados
let inMemorySetores: Setor[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    codigo: 'SET-01',
    nome: 'Setor 1 - Centro',
    cidade: 'Guarulhos',
    estado: 'SP',
    descricao: 'Setor 1 - Região Central e adjacências',
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '592b68a0-d1a1-4eed-b5e0-a866a8959265',
    codigo: 'SET-02',
    nome: 'Setor 2 - Aeroporto',
    cidade: 'Guarulhos',
    estado: 'SP',
    descricao: 'Setor 2 - Região Aeroporto e adjacências',
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fb53a1b8-945d-43a6-b825-61ba481d59d9',
    codigo: 'SET-03',
    nome: 'Setor 3 - Bonsucesso',
    cidade: 'Guarulhos',
    estado: 'SP',
    descricao: 'Setor 3 - Região Bonsucesso e adjacências',
    ativo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5b312d8-6bbd-437d-aafa-ccbbff7369d0',
    codigo: 'SET-04',
    nome: 'Setor 4 - Pimentas',
    cidade: 'Guarulhos',
    estado: 'SP',
    descricao: 'Setor 4 - Região Pimentas e adjacências',
    ativo: true,
    created_at: new Date().toISOString(),
  },
];

export class SetorService {
  /**
   * Lista todos os setores cadastrados
   */
  async listAll(): Promise<{ data: Setor[]; isFallback?: boolean }> {
    try {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.warn('[SetorService] Supabase retornou erro (tabela pode ainda não ter sido criada no SQL editor):', error.message);
        return { data: inMemorySetores, isFallback: true };
      }

      return { data: (data as Setor[]) || [], isFallback: false };
    } catch (err: any) {
      console.warn('[SetorService] Falha de conexão com Supabase, usando memória local:', err.message);
      return { data: inMemorySetores, isFallback: true };
    }
  }

  /**
   * Busca setor por ID
   */
  async getById(id: string): Promise<Setor | null> {
    try {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return inMemorySetores.find((s) => s.id === id) || null;
      }
      return data as Setor;
    } catch {
      return inMemorySetores.find((s) => s.id === id) || null;
    }
  }
}

export const setorService = new SetorService();
