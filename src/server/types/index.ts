export type PerfilNivel = 'global' | 'setor' | 'comum';
export type PerfilNome = 'Administrador' | 'CJM' | 'Apontamento';

export interface Perfil {
  id: string;
  nome: PerfilNome | string;
  descricao?: string;
  nivel_acesso: PerfilNivel;
  created_at?: string;
  updated_at?: string;
}

export interface Setor {
  id: string;
  codigo: string;
  nome: string;
  cidade: string;
  estado: string;
  descricao?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ComumCongregacao {
  id: string;
  setor_id: string;
  setor_pertencente?: string;
  codigo: string;
  nome: string;
  dia_reuniao_jovens?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Campos legados opcionais
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  anciao_id?: string | null;
  // Campos relacionados (join)
  setores?: Partial<Setor>;
}

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  celular: string;
  cargo_ministerio?: string | null;
  data_apresentacao?: string | null;
  data_nascimento?: string | null;
  perfil_id: string;
  comum_congregacao_id?: string | null;
  senha_hash?: string;
  trocar_senha_proximo_login?: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // Campos relacionados (join)
  perfis?: Partial<Perfil>;
  comum_congregacao?: Partial<ComumCongregacao>;
}

export interface CreateComumDTO {
  setor_id: string;
  setor_pertencente?: string;
  codigo?: string;
  nome: string;
  dia_reuniao_jovens?: string;
  ativo?: boolean;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  anciao_id?: string | null;
}

export interface UpdateComumDTO {
  setor_id?: string;
  setor_pertencente?: string;
  codigo?: string;
  nome?: string;
  dia_reuniao_jovens?: string;
  ativo?: boolean;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  anciao_id?: string | null;
}

export interface ComumFilterOptions {
  setor_id?: string;
  cidade?: string;
  search?: string;
  ativo?: boolean;
}

export interface CreateUsuarioDTO {
  nome_completo: string;
  email: string;
  celular: string;
  cargo_ministerio?: string | null;
  data_apresentacao?: string | null;
  data_nascimento?: string | null;
  perfil_id: string;
  comum_congregacao_id?: string | null;
  senha?: string;
  ativo?: boolean;
}

export interface UpdateUsuarioDTO {
  nome_completo?: string;
  email?: string;
  celular?: string;
  cargo_ministerio?: string | null;
  data_apresentacao?: string | null;
  data_nascimento?: string | null;
  perfil_id?: string;
  comum_congregacao_id?: string | null;
  senha?: string;
  senha_hash?: string;
  trocar_senha_proximo_login?: boolean;
  ativo?: boolean;
}

export interface UsuarioFilterOptions {
  perfil_id?: string;
  comum_congregacao_id?: string;
  search?: string;
  ativo?: boolean;
}

export interface Recitativo {
  id: string;
  data: string;
  comum_id: string;
  mocos: number;
  mocas: number;
  meninos: number;
  meninas: number;
  total: number;
  cadastrado_por: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRecitativoDTO {
  data: string;
  comum_id: string;
  mocos: number;
  mocas: number;
  meninos: number;
  meninas: number;
  cadastrado_por?: string | null;
}

export interface UpdateRecitativoDTO {
  data?: string;
  comum_id?: string;
  mocos?: number;
  mocas?: number;
  meninos?: number;
  meninas?: number;
}

export interface ContagemMocidade {
  id: string;
  data: string;
  quantidade: number;
  comum_id: string;
  tipo: 'Santa Ceia' | 'Mocidade';
  cadastrado_por: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContagemMocidadeDTO {
  data: string;
  quantidade: number;
  comum_id: string;
  tipo: 'Santa Ceia' | 'Mocidade';
  cadastrado_por?: string | null;
}

export interface UpdateContagemMocidadeDTO {
  data?: string;
  quantidade?: number;
  comum_id?: string;
  tipo?: 'Santa Ceia' | 'Mocidade';
}
