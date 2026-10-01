import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  KeyRound,
  Clock,
  UserCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  FileText,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { DbStatus } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

export type NavRoute =
  | 'dashboard'
  | 'apontamentos'
  | 'apontamentos-recitativos'
  | 'apontamentos-contagens'
  | 'acompanhamento-setor'
  | 'acompanhamento-anciaos'
  | 'controle-apontamentos'
  | 'relatorio-auxiliares'
  | 'admin-comuns'
  | 'admin-usuarios'
  | 'admin-anciaos'
  | 'admin-perfis'
  | 'admin-auxiliares';

interface SidebarProps {
  currentRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  status: DbStatus | null;
  comunsCount: number;
  usuariosCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  status,
  comunsCount,
  usuariosCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  const [isApontamentosExpanded, setIsApontamentosExpanded] = useState(true);
  const [isRelatoriosExpanded, setIsRelatoriosExpanded] = useState(true);
  const [permsVersion, setPermsVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setPermsVersion(v => v + 1);
    window.addEventListener('permissions-updated', handleUpdate);
    return () => window.removeEventListener('permissions-updated', handleUpdate);
  }, []);

  const isAdminRouteActive = [
    'admin-comuns',
    'admin-usuarios',
    'admin-anciaos',
    'admin-perfis',
    'admin-auxiliares',
  ].includes(currentRoute);

  const isApontamentosRouteActive = [
    'apontamentos',
    'apontamentos-recitativos',
    'apontamentos-contagens',
  ].includes(currentRoute);

  const isRelatoriosRouteActive = [
    'acompanhamento-setor',
    'acompanhamento-anciaos',
    'controle-apontamentos',
    'relatorio-auxiliares',
  ].includes(currentRoute);

  const handleNavClick = (route: NavRoute) => {
    onRouteChange(route);
    onCloseMobile();
  };

  return (
    <>
      {/* Overlay escuro para mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Barra Lateral Vertical */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho do Menu */}
        <div className="h-20 px-6 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/95">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-900/20 dark:shadow-emerald-950/50">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                CCB Apontamentos
              </h1>
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Reunião de Jovens e Menores
              </p>
            </div>
          </div>

          {/* Botão fechar apenas no mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação Principal */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Navegação Principal
          </p>

          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentRoute === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className={`w-4 h-4 ${currentRoute === 'dashboard' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Dashboard</span>
            </div>
            {currentRoute === 'dashboard' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* 2. Apontamentos (com Submódulos) */}
          <div className="space-y-1">
            <button
              onClick={() => setIsApontamentosExpanded(!isApontamentosExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isApontamentosRouteActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Apontamentos</span>
              </div>
              {isApontamentosExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isApontamentosExpanded && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">


                {/* 2.2 Recitativos */}
                <button
                  onClick={() => handleNavClick('apontamentos-recitativos')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'apontamentos-recitativos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Recitativos</span>
                  </div>
                </button>

                {/* 2.3 Mocidade / Santa Ceia */}
                <button
                  onClick={() => handleNavClick('apontamentos-contagens')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'apontamentos-contagens'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mocidade / Sta Ceia</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="pt-5 pb-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Gestão e Controle
            </p>
          </div>

          {/* Relatórios */}
          {hasPermission(user, 'exportar_relatorios') && (
          <div className="space-y-1">
            <button
              onClick={() => setIsRelatoriosExpanded(!isRelatoriosExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isRelatoriosRouteActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Relatórios</span>
              </div>
              {isRelatoriosExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isRelatoriosExpanded && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => handleNavClick('acompanhamento-setor')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'acompanhamento-setor'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Acompanhamento Setor</span>
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('acompanhamento-anciaos')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'acompanhamento-anciaos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Acompanhamento Anciãos</span>
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('controle-apontamentos')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'controle-apontamentos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Controle de Apontamentos</span>
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('relatorio-auxiliares')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'relatorio-auxiliares'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Auxiliares de Jovens</span>
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('relatorio-ministerio')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'relatorio-ministerio'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tempo de Ministério</span>
                  </div>
                </button>
              </div>
            )}
          </div>
          )}

          {/* 3. Administração (com Submódulos) */}
          {(hasPermission(user, 'gerenciar_comuns') || hasPermission(user, 'gerenciar_usuarios') || hasPermission(user, 'gerenciar_auxiliares')) && (
          <div className="space-y-1">
            <button
              onClick={() => setIsAdminExpanded(!isAdminExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isAdminRouteActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Administração</span>
              </div>
              {isAdminExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Submódulos de Administração */}
            {isAdminExpanded && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* 3.1 Comum Congregação */}
                {hasPermission(user, 'gerenciar_comuns') && (
                <button
                  onClick={() => handleNavClick('admin-comuns')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-comuns'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Comum Congregação</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {comunsCount}
                  </span>
                </button>
                )}

                {/* 3.2 Usuários */}
                {hasPermission(user, 'gerenciar_usuarios') && (
                <button
                  onClick={() => handleNavClick('admin-usuarios')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-usuarios'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Usuários</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {usuariosCount}
                  </span>
                </button>
                )}

                {/* 3.3 Cadastro de Anciãos */}
                {user?.perfis?.nome !== 'CJM' && (
                <button
                  onClick={() => handleNavClick('admin-anciaos')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-anciaos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Cadastro de Anciãos</span>
                  </div>
                </button>
                )}

                {/* 3.4 Perfis de Acesso */}
                {user?.perfis?.nome !== 'CJM' && (
                <button
                  onClick={() => handleNavClick('admin-perfis')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-perfis'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Perfis de Acesso</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono">
                    3
                  </span>
                </button>
                )}

                {/* 3.4 Cadastro de Auxiliares de Jovens */}
                {hasPermission(user, 'gerenciar_auxiliares') && (
                <button
                  onClick={() => handleNavClick('admin-auxiliares')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-auxiliares'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Auxiliares de Jovens</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">
                    Ativo
                  </span>
                </button>
                )}
              </div>
            )}
          </div>
          )}

        </div>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">

          {/* Usuário logado atual */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs flex-shrink-0">
                {user?.nome_completo
                  ? user.nome_completo.split(' ').map((n) => n[0]).slice(0, 2).join('')
                  : 'OP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.nome_completo || 'Operador'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.perfis?.nome || 'Acesso Autorizado'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Encerrar Sessão (Sair)"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
