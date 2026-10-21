import { Usuario } from '../types';

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
  { id: 'visualizar_calendario', funcionalidade: 'Visualizar Calendário de Reuniões', admin: true, cjm: true, apontamento: true },
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
    const saved = localStorage.getItem('ccb_permissoes');
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
    localStorage.setItem('ccb_permissoes', JSON.stringify(newMatriz));
    window.dispatchEvent(new Event('permissions-updated'));
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
  if (roleName.includes('admin') || roleName === 'administrador') {
    if (rule.admin !== undefined) return !!rule.admin;
    return true;
  }
  if (roleName.includes('cjm')) {
    if (rule.cjm !== undefined) return !!rule.cjm;
  }
  if (roleName.includes('apontamento')) {
    if (rule.apontamento !== undefined) return !!rule.apontamento;
  }

  // 4. Administrador com nível global por padrão tem acesso
  if (user.perfis.nivel_acesso === 'global') return true;

  return false;
};
