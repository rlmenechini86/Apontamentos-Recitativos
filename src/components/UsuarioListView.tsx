import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Edit2,
  Trash2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { Usuario, Perfil, ComumCongregacao } from '../types';

interface UsuarioListViewProps {
  usuarios: Usuario[];
  perfis: Perfil[];
  comuns: ComumCongregacao[];
  loading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (usuario: Usuario) => void;
  onDelete: (id: string, nome: string) => void;
  dataSource: 'supabase' | 'in-memory';
}

export const UsuarioListView: React.FC<UsuarioListViewProps> = ({
  usuarios,
  perfis,
  comuns,
  loading,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  dataSource,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerfilId, setSelectedPerfilId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');

  const filteredUsuarios = usuarios.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.celular.includes(searchTerm);

    const matchesPerfil = !selectedPerfilId || user.perfil_id === selectedPerfilId;
    const matchesComum = !selectedComumId || user.comum_congregacao_id === selectedComumId;

    return matchesSearch && matchesPerfil && matchesComum;
  });

  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.perfis?.nome === 'Administrador').length;
  const totalCJMs = usuarios.filter((u) => u.perfis?.nome === 'CJM').length;
  const totalApontamentos = usuarios.filter((u) => u.perfis?.nome === 'Apontamento').length;

  const getPerfilBadge = (perfil?: Partial<Perfil>) => {
    if (!perfil || !perfil.nome) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Sem perfil
        </span>
      );
    }

    if (perfil.nome === 'Administrador') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20">
          <ShieldCheck className="w-3 h-3 mr-1 text-purple-600 dark:text-purple-400" />
          Administrador
        </span>
      );
    }

    if (perfil.nome === 'CJM') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
          <ShieldCheck className="w-3 h-3 mr-1 text-amber-600 dark:text-amber-400" />
          CJM (Setor)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
        Apontamento (Comum)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Total de Usuários
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalUsuarios}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Administradores (Global)
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalAdmins}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              CJMs (Visão Setor)
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCJMs}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-4 shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Apontamentos (Comum)
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalApontamentos}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          {/* Busca por Nome, Email ou Telefone */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filtro por Perfil */}
          <div className="w-full sm:w-52">
            <select
              value={selectedPerfilId}
              onChange={(e) => setSelectedPerfilId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todos os Perfis</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.nivel_acesso})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Comum Congregação */}
          <div className="w-full sm:w-60">
            <select
              value={selectedComumId}
              onChange={(e) => setSelectedComumId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todas as Comuns</option>
              {comuns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão Novo Usuário */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={onRefresh}
            title="Atualizar lista"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center space-x-2 shadow-sm transition flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Contato (Email / Celular)</th>
                <th className="px-6 py-4">Perfil de Acesso</th>
                <th className="px-6 py-4">Vínculo Comum (Regra 3)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum usuário encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em "Novo Usuário" para cadastrar o primeiro operador do sistema.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                          {user.nome_completo
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{user.nome_completo}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-0.5 text-[11px]">
                            {user.cargo_ministerio && (
                              <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                                {user.cargo_ministerio}
                              </span>
                            )}
                            <span className="text-slate-400 dark:text-slate-500 font-mono">
                              ID: {user.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                        <span>{user.celular}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {getPerfilBadge(user.perfis)}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {user.comum_congregacao ? (
                        <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <div>
                            <span className="font-medium">{user.comum_congregacao.nome}</span>
                            {user.comum_congregacao.codigo && (
                              <span className="text-slate-500 block text-[11px] font-mono">
                                {user.comum_congregacao.codigo}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          {user.perfis?.nome === 'Administrador' ? 'Visão Global (Sem vínculo fixo)' : 'Não vinculado'}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          user.ativo
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onOpenEdit(user)}
                          title="Editar Usuário"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user.id, user.nome_completo)}
                          title="Excluir Usuário"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
