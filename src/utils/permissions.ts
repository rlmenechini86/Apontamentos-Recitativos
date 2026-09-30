import { Usuario } from '../types';

export const defaultMatriz = [
  { id: 'dashboard', funcionalidade: 'Visualizar Dashboard Geral', admin: true, cjm: true, apontamento: true },
  { id: 'lancar_apontamento', funcionalidade: 'Lançar Apontamento da Comum', admin: true, cjm: true, apontamento: true },
  { id: 'editar_apontamento', funcionalidade: 'Editar Apontamentos do Setor', admin: true, cjm: true, apontamento: false },
  { id: 'gerenciar_comuns', funcionalidade: 'Gerenciar Comuns Congregações (CRUD)', admin: true, cjm: false, apontamento: false },
  { id: 'gerenciar_usuarios', funcionalidade: 'Gerenciar Usuários e Atribuir Perfis', admin: true, cjm: false, apontamento: false },
  { id: 'gerenciar_auxiliares', funcionalidade: 'Gerenciar Cadastro de Auxiliares e CJM', admin: true, cjm: true, apontamento: false },
  { id: 'visualizar_setores', funcionalidade: 'Visualizar Dados de Outros Setores', admin: true, cjm: false, apontamento: false },
  { id: 'exportar_relatorios', funcionalidade: 'Consolidação e Exportação de Relatórios', admin: true, cjm: true, apontamento: false },
];

export const getPermissoes = () => {
  try {
    const saved = localStorage.getItem('ccb_permissoes');
    return saved ? JSON.parse(saved) : defaultMatriz;
  } catch {
    return defaultMatriz;
  }
};

export const hasPermission = (user: Usuario | null, actionId: string): boolean => {
  if (!user || !user.perfis?.nome) return false;
  
  const matriz = getPermissoes();
  const rule = matriz.find((m: any) => m.id === actionId);
  if (!rule) return false;

  const roleName = user.perfis.nome.toLowerCase();
  
  if (roleName.includes('admin')) return rule.admin;
  if (roleName.includes('cjm')) return rule.cjm;
  if (roleName.includes('apontamento')) return rule.apontamento;
  
  return false;
};
