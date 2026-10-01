export interface Setor {
  id: string;
  codigo: string;
  nome: string;
  cidade: string;
  estado: string;
  descricao?: string;
  ativo: boolean;
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
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  anciao_id?: string | null;
  secretario_id?: string | null;
  setores?: Partial<Setor>;
}

export interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
  nivel_acesso: 'global' | 'setor' | 'comum';
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
  ativo: boolean;
  perfis?: Partial<Perfil>;
  comum_congregacao?: Partial<ComumCongregacao>;
}

export interface DbStatus {
  connected: boolean;
  tableExists: boolean;
  message: string;
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
  comum_congregacao?: ComumCongregacao;
  usuario?: Usuario;
}

export interface Anciao {
  id: string;
  nome: string;
  data_cadastro?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuxiliarJovens {
  id: string;
  nome: string;
  data_apresentacao?: string;
  sexo: 'Feminino' | 'Masculino';
  celular?: string;
  data_nascimento?: string;
  comum_id: string;
  ativo: boolean;
  comum?: Partial<ComumCongregacao>;
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
  comum_congregacao?: ComumCongregacao;
  usuario?: Usuario;
}

export interface TipoEvento {
  id: string;
  data: string;
  nome: string;
  cor: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReuniaoEvento {
  id: string;
  data: string;
  tipo_evento_id: string;
  nome?: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  tipos_evento?: TipoEvento;
}
