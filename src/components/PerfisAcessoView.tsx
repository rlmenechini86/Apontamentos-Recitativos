import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Lock,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Perfil, Usuario } from '../types';
import { getPermissoes, savePermissoes, defaultMatriz, PermissaoRegra } from '../utils/permissions';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

interface PerfisAcessoViewProps {
  perfis: Perfil[];
  usuarios: Usuario[];
  onUpdatePerfis?: () => void;
  onManageUsers?: () => void;
}

const BASE_PROFILE_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
];

export const PerfisAcessoView: React.FC<PerfisAcessoViewProps> = ({
  perfis,
  usuarios,
  onUpdatePerfis,
  onManageUsers,
}) => {
  const [matrizPermissoes, setMatrizPermissoes] = useState<PermissaoRegra[]>(() => getPermissoes());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Perfil
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    nivel_acesso: 'setor' as 'global' | 'setor' | 'comum',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const handlePermissionsUpdated = () => {
      setMatrizPermissoes(getPermissoes());
    };
    window.addEventListener('permissions-updated', handlePermissionsUpdated);
    return () => window.removeEventListener('permissions-updated', handlePermissionsUpdated);
  }, []);

  const openCreateModal = () => {
    setEditingPerfil(null);
    setFormData({
      nome: '',
      descricao: '',
      nivel_acesso: 'setor',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Perfil) => {
    setEditingPerfil(p);
    setFormData({
      nome: p.nome,
      descricao: p.descricao || '',
      nivel_acesso: p.nivel_acesso,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setModalError('O nome do perfil é obrigatório.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (editingPerfil) {
        // Atualizar
        const res = await apiPut(`/api/perfis/${editingPerfil.id}`, formData);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || 'Erro ao atualizar perfil.');
        }
      } else {
        // Criar
        const res = await apiPost('/api/perfis', formData);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || 'Erro ao cadastrar perfil.');
        }

        const newCreated = json.data as Perfil;

        // Inicializa permissões padrões na matriz para o novo perfil conforme o nível de acesso
        const newMatriz = matrizPermissoes.map(rule => {
          let defaultValue = false;
          if (newCreated.nivel_acesso === 'global') {
            defaultValue = true;
          } else if (newCreated.nivel_acesso === 'setor') {
            defaultValue = ['dashboard', 'lancar_apontamento', 'editar_apontamento', 'agenda_visitas', 'visualizar_calendario', 'gerenciar_reunioes', 'exportar_relatorios', 'gerenciar_auxiliares'].includes(rule.id);
          } else {
            defaultValue = ['dashboard', 'lancar_apontamento', 'agenda_visitas', 'visualizar_calendario'].includes(rule.id);
          }

          return {
            ...rule,
            [newCreated.id]: defaultValue,
            [newCreated.nome.toLowerCase().trim()]: defaultValue,
          };
        });

        setMatrizPermissoes(newMatriz);
        savePermissoes(newMatriz);
      }

      setIsModalOpen(false);
      onUpdatePerfis?.();
    } catch (err: any) {
      setModalError(err.message || 'Falha ao salvar perfil.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePerfil = async (perfil: Perfil) => {
    if (BASE_PROFILE_IDS.includes(perfil.id) || ['administrador', 'cjm', 'apontamento'].includes(perfil.nome.toLowerCase())) {
      alert('Este é um perfil nativo do sistema e não pode ser excluído.');
      return;
    }

    const linkedUsers = usuarios.filter(u => u.perfil_id === perfil.id || u.perfis?.nome === perfil.nome);
    if (linkedUsers.length > 0) {
      alert(`Não é possível excluir o perfil "${perfil.nome}" pois existem ${linkedUsers.length} usuário(s) associado(s) a ele.`);
      return;
    }

    if (!confirm(`Deseja realmente excluir o perfil "${perfil.nome}"?`)) {
      return;
    }

    try {
      const res = await apiDelete(`/api/perfis/${perfil.id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Erro ao excluir perfil.');
      }

      // Remove as permissões do perfil excluído
      const newMatriz = matrizPermissoes.map(rule => {
        const copy = { ...rule };
        delete copy[perfil.id];
        delete copy[perfil.nome.toLowerCase().trim()];
        return copy;
      });
      setMatrizPermissoes(newMatriz);
      savePermissoes(newMatriz);

      onUpdatePerfis?.();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir perfil.');
    }
  };

  const isPerfilChecked = (rule: PermissaoRegra, perfil: Perfil): boolean => {
    // 1. Verificação por ID
    if (rule[perfil.id] !== undefined) {
      return !!rule[perfil.id];
    }
    // 2. Verificação por nome normalizado
    const normName = perfil.nome.toLowerCase().trim();
    if (rule[normName] !== undefined) {
      return !!rule[normName];
    }
    // 3. Fallbacks para os 3 perfis nativos
    if (normName.includes('admin') || normName === 'administrador') {
      return rule.admin !== undefined ? !!rule.admin : true;
    }
    if (normName.includes('cjm')) {
      return rule.cjm !== undefined ? !!rule.cjm : false;
    }
    if (normName.includes('apontamento')) {
      return rule.apontamento !== undefined ? !!rule.apontamento : false;
    }
    // 4. Padrão baseado no nível de acesso
    return perfil.nivel_acesso === 'global';
  };

  const togglePerfilPermission = (ruleId: string, perfil: Perfil) => {
    const targetRule = matrizPermissoes.find(r => r.id === ruleId);
    if (!targetRule) return;

    const currentVal = isPerfilChecked(targetRule, perfil);
    const nextVal = !currentVal;

    const newMatriz = matrizPermissoes.map(r => {
      if (r.id === ruleId) {
        const copy: PermissaoRegra = { ...r };
        copy[perfil.id] = nextVal;
        const normName = perfil.nome.toLowerCase().trim();
        copy[normName] = nextVal;

        if (normName.includes('admin') || normName === 'administrador') copy.admin = nextVal;
        if (normName.includes('cjm')) copy.cjm = nextVal;
        if (normName.includes('apontamento')) copy.apontamento = nextVal;

        return copy;
      }
      return r;
    });

    setMatrizPermissoes(newMatriz);
    savePermissoes(newMatriz);
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as permissões padrões de segurança do sistema?')) {
      localStorage.removeItem('ccb_permissoes');
      const reset = getPermissoes();
      setMatrizPermissoes(reset);
      savePermissoes(reset);
    }
  };

  const filteredRules = useMemo(() => {
    if (!searchTerm.trim()) return matrizPermissoes;
    const term = searchTerm.toLowerCase();
    return matrizPermissoes.filter(r => 
      r.funcionalidade.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  }, [matrizPermissoes, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header com Ação de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Perfis de Acesso e Permissões (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre novos perfis e defina permissões específicas para cada funcionalidade do sistema.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Perfil</span>
          </button>
        </div>
      </div>

      {/* Grid Dinâmico de Perfis Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {perfis.map((p) => {
          const isBase = BASE_PROFILE_IDS.includes(p.id) || ['administrador', 'cjm', 'apontamento'].includes(p.nome.toLowerCase());
          const activeUsersCount = usuarios.filter((u) => u.perfil_id === p.id || u.perfis?.nome === p.nome).length;

          let badgeColor = 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
          let iconColor = 'text-slate-600 dark:text-slate-400';
          let IconComp = Shield;

          if (p.nivel_acesso === 'global') {
            badgeColor = 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
            iconColor = 'text-purple-600 dark:text-purple-400';
            IconComp = ShieldCheck;
          } else if (p.nivel_acesso === 'setor') {
            badgeColor = 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30';
            iconColor = 'text-amber-600 dark:text-amber-400';
            IconComp = Shield;
          } else {
            badgeColor = 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
            iconColor = 'text-emerald-600 dark:text-emerald-400';
            IconComp = Building2;
          }

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${badgeColor}`}>
                    {p.nivel_acesso === 'global' ? 'Nível Global' : p.nivel_acesso === 'setor' ? 'Nível Setorial' : 'Nível Comum'}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {!isBase && (
                      <>
                        <button
                          onClick={() => openEditModal(p)}
                          title="Editar Perfil"
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePerfil(p)}
                          title="Excluir Perfil"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <div className={`w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${iconColor}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.nome}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {p.descricao || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Usuários Ativos:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {activeUsersCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matriz de Permissões */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Matriz de Permissões por Perfil</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique nos ícones para conceder ou revogar permissões específicas para cada perfil.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar módulo..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleResetDefaults}
              title="Restaurar Padrões de Segurança"
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 min-w-[240px]">Funcionalidade / Módulo</th>
                {perfis.map((p) => {
                  let roleColor = 'text-slate-700 dark:text-slate-300';
                  if (p.nivel_acesso === 'global') roleColor = 'text-purple-700 dark:text-purple-400';
                  if (p.nivel_acesso === 'setor') roleColor = 'text-amber-700 dark:text-amber-400';
                  if (p.nivel_acesso === 'comum') roleColor = 'text-emerald-700 dark:text-emerald-400';

                  return (
                    <th key={p.id} className={`px-4 py-3.5 text-center ${roleColor}`}>
                      <div className="font-bold">{p.nome}</div>
                      <div className="text-[9px] font-normal opacity-70">
                        {p.nivel_acesso === 'global' ? 'Global' : p.nivel_acesso === 'setor' ? 'Setorial' : 'Comum'}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {filteredRules.map((rule) => {
                const isAgendaVisitas = rule.id === 'agenda_visitas';

                return (
                  <tr 
                    key={rule.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                      isAgendaVisitas ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-200 flex items-center space-x-2">
                      {isAgendaVisitas ? (
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className={isAgendaVisitas ? 'font-bold text-emerald-800 dark:text-emerald-300' : ''}>
                        {rule.funcionalidade}
                      </span>
                    </td>

                    {perfis.map((perfil) => {
                      const allowed = isPerfilChecked(rule, perfil);

                      return (
                        <td key={perfil.id} className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePerfilPermission(rule.id, perfil)}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/70 transition cursor-pointer"
                            title={`${allowed ? 'Revogar' : 'Conceder'} permissão para ${perfil.nome}`}
                          >
                            {allowed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {editingPerfil ? 'Editar Perfil de Acesso' : 'Cadastrar Novo Perfil'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerfil} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Perfil *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Secretário Regional, Encarregado, etc."
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nível de Acesso Hierárquico *
                </label>
                <select
                  value={formData.nivel_acesso}
                  onChange={(e) => setFormData({ ...formData, nivel_acesso: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="global">Nível Global (Todos os Setores e Congregações)</option>
                  <option value="setor">Nível Setorial (Acompanha o Setor Pertencente)</option>
                  <option value="comum">Nível Comum (Apenas Congregação Local)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Define o escopo de dados que os usuários desse perfil poderão visualizar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Perfil
                </label>
                <textarea
                  rows={3}
                  placeholder="Breve descrição da função e responsabilidades deste perfil..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? 'Salvando...' : editingPerfil ? 'Salvar Alterações' : 'Criar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
