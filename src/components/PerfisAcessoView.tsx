import React from 'react';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import { Perfil, Usuario } from '../types';

interface PerfisAcessoViewProps {
  perfis: Perfil[];
  usuarios: Usuario[];
  onManageUsers?: () => void;
}

export const PerfisAcessoView: React.FC<PerfisAcessoViewProps> = ({
  perfis,
  usuarios,
}) => {
  const matrizPermissoes = [
    {
      funcionalidade: 'Visualizar Dashboard Geral',
      admin: true,
      cjm: true,
      apontamento: true,
    },
    {
      funcionalidade: 'Lançar Apontamento da Comum',
      admin: true,
      cjm: true,
      apontamento: true,
    },
    {
      funcionalidade: 'Editar Apontamentos do Setor',
      admin: true,
      cjm: true,
      apontamento: false,
    },
    {
      funcionalidade: 'Gerenciar Comuns Congregações (CRUD)',
      admin: true,
      cjm: false,
      apontamento: false,
    },
    {
      funcionalidade: 'Gerenciar Usuários e Atribuir Perfis',
      admin: true,
      cjm: false,
      apontamento: false,
    },
    {
      funcionalidade: 'Gerenciar Cadastro de Auxiliares e CJM',
      admin: true,
      cjm: true,
      apontamento: false,
    },
    {
      funcionalidade: 'Visualizar Dados de Outros Setores',
      admin: true,
      cjm: false,
      apontamento: false,
    },
    {
      funcionalidade: 'Consolidação e Exportação de Relatórios',
      admin: true,
      cjm: true,
      apontamento: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
          <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Perfis de Acesso e Permissões (RBAC)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estrutura hierárquica oficial de segurança com níveis de acesso Global, Setorial e Local.
        </p>
      </div>

      {/* Cards dos 3 Perfis Oficiais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Administrador */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30">
              Nível Global
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Administrador</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Visão irrestrita de toda a regional. Gerencia setores, congregações, usuários e parâmetros do sistema.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Usuários Ativos:</span>
            <span className="font-bold text-purple-700 dark:text-purple-400">
              {usuarios.filter((u) => u.perfis?.nome === 'Administrador').length}
            </span>
          </div>
        </div>

        {/* 2. CJM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30">
              Nível Setorial
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">CJM (Comissão)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Membros da Comissão de Jovens e Menores. Acompanham e validam apontamentos de todas as congregações do seu Setor.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Usuários Ativos:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {usuarios.filter((u) => u.perfis?.nome === 'CJM').length}
            </span>
          </div>
        </div>

        {/* 3. Apontamento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30">
              Nível Comum (Local)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Apontamento</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Auxiliares locais responsáveis pela chamada semanal e preenchimento dos apontamentos da sua congregação.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Usuários Ativos:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {usuarios.filter((u) => u.perfis?.nome === 'Apontamento').length}
            </span>
          </div>
        </div>
      </div>

      {/* Matriz de Permissões */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Matriz de Permissões por Perfil</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Políticas de Segurança RBAC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Funcionalidade / Módulo</th>
                <th className="px-6 py-3.5 text-center text-purple-700 dark:text-purple-400">Administrador</th>
                <th className="px-6 py-3.5 text-center text-amber-700 dark:text-amber-400">CJM (Setorial)</th>
                <th className="px-6 py-3.5 text-center text-emerald-700 dark:text-emerald-400">Apontamento (Comum)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {matrizPermissoes.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-200">
                    {p.funcionalidade}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.cjm ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {p.apontamento ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
