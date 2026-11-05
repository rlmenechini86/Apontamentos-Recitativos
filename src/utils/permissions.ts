import { Usuario, ComumCongregacao, Setor } from '../types';

export interface PermissaoRegra {
  id: string;
  funcionalidade: string;
  admin?: boolean;
  cjm?: boolean;
  apontamento?: boolean;
  [key: string]: any;
}

export const defaultMatriz: PermissaoRegra[] = [
  { id: 'dashboard', funcionalidade: 'Visualizar Dashboard Geral', admin: true, cjm: true, apontamento: true },
  { id: 'lancar_apontamento', funcionalidade: 'Lançar Apontamento da Comum', admin: true, cjm: true, apontamento: true },
  { id: 'editar_apontamento', funcionalidade: 'Editar Apontamentos do Setor', admin: true, cjm: true, apontamento: false },
  { id: 'agenda_visitas', funcionalidade: 'Visualizar e Gerenciar Agenda de Visitas', admin: true, cjm: true, apontamento: true },
  { id: 'visualizar_calendario', funcionalidade: 'Visualizar Calendário de Reuniões', admin: true, cjm: true, apontamento: false, '33333333-3333-3333-3333-333333333333': false },
  { id: 'gerenciar_reunioes', funcionalidade: 'Gerenciar Reuniões e Eventos (CRUD)', admin: true, cjm: true, apontamento: false },
  { id: 'gerenciar_tipos_evento', funcionalidade: 'Gerenciar Tipos de Eventos (CRUD)', admin: true, cjm: false, apontamento: false },
  { id: 'exportar_relatorios', funcionalidade: 'Relatórios / Gestão e Controle', admin: true, cjm: true, apontamento: false },
  { id: 'visualizar_setores', funcionalidade: 'Visualizar Dados de Outros Setores', admin: true, cjm: false, apontamento: false },
  { id: 'gerenciar_auxiliares', funcionalidade: 'Gerenciar Cadastro de Auxiliares e CJM', admin: true, cjm: true, apontamento: false },
  { id: 'gerenciar_comuns', funcionalidade: 'Gerenciar Comuns Congregações (CRUD)', admin: true, cjm: false, apontamento: false },
  { id: 'gerenciar_usuarios', funcionalidade: 'Gerenciar Usuários e Atribuir Perfis', admin: true, cjm: false, apontamento: false },
  { id: 'gerenciar_perfis', funcionalidade: 'Gerenciar Perfis de Acesso e Permissões', admin: true, cjm: false, apontamento: false },
];

export const getPermissoes = (): PermissaoRegra[] => {
  try {
    const saved = localStorage.getItem('app_permissoes');
    if (!saved) return defaultMatriz;
    
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return defaultMatriz;

    // Merge existing rules with any new rules added to defaultMatriz, preserving custom profile permissions
    const merged = defaultMatriz.map(defaultRule => {
      const existingRule = parsed.find((p: any) => p.id === defaultRule.id);
      return existingRule ? { ...defaultRule, ...existingRule } : defaultRule;
    });
    return merged;
  } catch {
    return defaultMatriz;
  }
};

export const savePermissoes = (newMatriz: PermissaoRegra[]) => {
  try {
    localStorage.setItem('app_permissoes', JSON.stringify(newMatriz));
    window.dispatchEvent(new Event('permissions-updated'));

    // Salva centralizado no backend para sincronizar todos os usuários e dispositivos
    fetch('/api/perfis/permissoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatriz),
    }).catch(err => console.error('Erro ao salvar permissões no backend:', err));
  } catch (err) {
    console.error('Erro ao salvar permissões no localStorage:', err);
  }
};

export const hasPermission = (user: Usuario | null, actionId: string): boolean => {
  if (!user || !user.perfis?.nome) return false;
  
  const matriz = getPermissoes();
  const rule = matriz.find((m: any) => m.id === actionId);
  if (!rule) return true;

  const perfilId = user.perfil_id || user.perfis?.id;
  const roleName = (user.perfis.nome || '').toLowerCase().trim();

  // 1. Verificação por ID direto do perfil (usado para perfis novos e customizados)
  if (perfilId && rule[perfilId] !== undefined) {
    return !!rule[perfilId];
  }

  // 2. Verificação por chave com o nome normalizado do perfil
  if (rule[roleName] !== undefined) {
    return !!rule[roleName];
  }

  // 3. Fallbacks para perfis clássicos do sistema
  if ((roleName === 'administrador' || roleName.includes('admin')) && !roleName.includes('setor') && user.perfis.nivel_acesso !== 'setor') {
    if (rule.admin !== undefined) return !!rule.admin;
    return true;
  }
  if (roleName.includes('cjm') || roleName.includes('setor')) {
    if (rule.cjm !== undefined) return !!rule.cjm;
  }
  if (roleName.includes('apontamento')) {
    if (rule.apontamento !== undefined) return !!rule.apontamento;
  }

  // 4. Administrador com nível global por padrão tem acesso
  if (user.perfis.nivel_acesso === 'global') return true;

  return false;
};

export interface UserScope {
  isGlobal: boolean;            // Administrador Geral (vê e cadastra em todos os setores)
  isSetor: boolean;             // Administrador (Setor) ou CJM (somente do seu setor pertencente)
  isComum: boolean;             // Apontamento (somente da sua congregação)
  userSetorId: string | null;   // ID do setor do usuário
  userSetorNome: string | null; // Nome do setor do usuário
  userComumId: string | null;   // ID da comum do usuário
  userComumNome: string | null; // Nome da comum do usuário
  userComum?: ComumCongregacao | Partial<ComumCongregacao> | null;
  userSetor?: Setor | null;
}

/**
 * Retorna o escopo de atuação do usuário no sistema (Global, Setorial ou Comum)
 * e os identificadores do seu setor e comum pertencentes.
 */
export function getUserScope(
  user: Usuario | null, 
  comuns: ComumCongregacao[] = [], 
  setores: Setor[] = []
): UserScope {
  if (!user) {
    return {
      isGlobal: false,
      isSetor: false,
      isComum: false,
      userSetorId: null,
      userSetorNome: null,
      userComumId: null,
      userComumNome: null,
      userComum: null,
      userSetor: null
    };
  }

  const roleName = (user.perfis?.nome || '').toLowerCase().trim();
  const nivelAcesso = user.perfis?.nivel_acesso;
  const canViewAllSectors = hasPermission(user, 'visualizar_setores');

  // Identifica a comum e o setor do usuário
  const userComum = comuns.find(c => c.id === user.comum_congregacao_id) || user.comum_congregacao || null;
  const userSetor = setores.find(s => 
    (userComum?.setor_id && s.id === userComum.setor_id) || 
    (userComum?.setor_pertencente && s.nome.toLowerCase() === userComum.setor_pertencente.toLowerCase()) ||
    (s.id && (userComum as any)?.setores?.id === s.id)
  ) || null;

  const userSetorId = userSetor?.id || userComum?.setor_id || (userComum as any)?.setores?.id || null;
  const userSetorNome = userSetor?.nome || userComum?.setor_pertencente || (userComum as any)?.setores?.nome || null;
  const userComumId = user.comum_congregacao_id || user.comum_congregacao?.id || null;
  const userComumNome = userComum?.nome || null;

  // 1. Perfil Comum (Apontamento)
  const isComum = nivelAcesso === 'comum' || roleName.includes('apontamento');

  // 2. Perfil Global (Administrador Geral com visão global de todos os setores)
  const isGlobal = !isComum && (
    (nivelAcesso === 'global' && canViewAllSectors) || 
    (roleName === 'administrador' && !roleName.includes('setor') && canViewAllSectors)
  );

  // 3. Perfil Setorial: Administrador (Setor), CJM ou qualquer usuário restrito ao seu setor
  const isSetor = !isGlobal && !isComum && (
    nivelAcesso === 'setor' || 
    roleName.includes('setor') || 
    roleName.includes('cjm') || 
    !canViewAllSectors
  );

  const resolvedSetor = userSetor || (userSetorId ? setores.find(s => s.id === userSetorId) : null) || null;

  return {
    isGlobal,
    isSetor,
    isComum,
    userSetorId,
    userSetorNome,
    userComumId,
    userComumNome,
    userComum,
    userSetor: resolvedSetor
  };
}

/**
 * Verifica se um registro pertence ao setor do usuário corrente
 */
export function isItemInUserSector(
  scope: UserScope, 
  item: { setor_id?: string | null; setor_pertencente?: string | null; comum_congregacao_id?: string | null; comum_id?: string | null }, 
  comuns: ComumCongregacao[] = [],
  setores: Setor[] = []
): boolean {
  if (scope.isGlobal) return true;
  if (!scope.isSetor) return true;
  if (!scope.userSetorId && !scope.userSetorNome) return true;

  // Verificação direta por setor_id ou setor_pertencente
  if (item.setor_id && scope.userSetorId && item.setor_id === scope.userSetorId) return true;
  if (item.setor_pertencente && scope.userSetorNome && item.setor_pertencente.toLowerCase() === scope.userSetorNome.toLowerCase()) return true;

  // Verificação indireta através da comum de congregação
  const targetComumId = item.comum_congregacao_id || item.comum_id;
  if (targetComumId) {
    const c = comuns.find(x => x.id === targetComumId);
    if (c) {
      if (scope.userSetorId && c.setor_id === scope.userSetorId) return true;
      if (scope.userSetorNome && c.setor_pertencente && c.setor_pertencente.toLowerCase() === scope.userSetorNome.toLowerCase()) return true;
      const s = setores.find(st => st.id === scope.userSetorId);
      if (s && c.setor_pertencente && c.setor_pertencente.toLowerCase() === s.nome.toLowerCase()) return true;
    }
  }

  return false;
}

export const initPermissoesSync = async () => {
  try {
    const res = await fetch('/api/perfis/permissoes');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem('app_permissoes', JSON.stringify(json.data));
        window.dispatchEvent(new Event('permissions-updated'));
      }
    }
  } catch (e) {
    console.warn('Sync de permissões offline, usando cache local');
  }
};

// Dispara sync em background
if (typeof window !== 'undefined') {
  initPermissoesSync();
}
