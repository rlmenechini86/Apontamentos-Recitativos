import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  Users,
  UserPlus,
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
  Calendar,
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
  | 'admin-pre-cadastros'
  | 'admin-anciaos'
  | 'admin-perfis'
  | 'admin-auxiliares'
  | 'admin-tipos-evento'
  | 'admin-reunioes-eventos'
  | 'calendario'
  | 'agenda-visitas'
  | 'relatorio-musicos'
  | 'relatorio-ministerio';

interface SidebarProps {
  currentRoute: NavRoute;
  onRouteChange: (route: NavRoute) => void;
  status: DbStatus | null;
  comunsCount: number;
  usuariosCount: number;
  preCadastrosCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  reunioesHojeCount?: number;
  visitasHojeCount?: number;
  reunioesAmanhaCount?: number;
  visitasAmanhaCount?: number;
  perfisCount?: number;
  onOpenLgpdModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  status,
  comunsCount,
  usuariosCount,
  preCadastrosCount = 0,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  reunioesHojeCount = 0,
  visitasHojeCount = 0,
  reunioesAmanhaCount = 0,
  visitasAmanhaCount = 0,
  perfisCount = 3,
  onOpenLgpdModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isAdminExpanded, setIsAdminExpanded] = useState(true);
  const [isApontamentosExpanded, setIsApontamentosExpanded] = useState(true);
  const [isRelatoriosExpanded, setIsRelatoriosExpanded] = useState(true);
  const [permsVersion, setPermsVersion] = useState(0);

  // No celular (drawer aberto), exibe sempre expandido; no desktop respeita isCollapsed
  const collapsed = isCollapsed && !isOpenMobile;

  useEffect(() => {
    const handleUpdate = () => setPermsVersion(v => v + 1);
    window.addEventListener('permissions-updated', handleUpdate);
    return () => window.removeEventListener('permissions-updated', handleUpdate);
  }, []);

  const isAdminRouteActive = [
    'admin-comuns',
    'admin-usuarios',
    'admin-pre-cadastros',
    'admin-anciaos',
    'admin-perfis',
    'admin-auxiliares',
    'admin-tipos-evento',
    'admin-reunioes-eventos',
  ].includes(currentRoute);

  const isApontamentosRouteActive = [
    'apontamentos',
    'controle-apontamentos',
    'apontamentos-contagens',
  ].includes(currentRoute);

  const isRelatoriosRouteActive = [
    'acompanhamento-setor',
    'acompanhamento-anciaos',
    'relatorio-auxiliares',
    'relatorio-musicos',
    'relatorio-ministerio',
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
        className={`fixed top-0 bottom-0 left-0 z-50 ${
          collapsed ? 'w-72 lg:w-20' : 'w-72'
        } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho do Menu */}
        <div
          className={`h-20 ${
            collapsed ? 'px-3 justify-center' : 'px-5 justify-between'
          } border-b border-slate-200/90 dark:border-slate-800 flex items-center bg-white dark:bg-slate-900/95 relative`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 min-w-0'}`}>
            <div
              onClick={() => {
                if (collapsed && onToggleCollapse) onToggleCollapse();
              }}
              title={collapsed ? 'Expandir menu lateral' : 'Controle de Apontamentos'}
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-900/20 dark:shadow-emerald-950/50 shrink-0 ${
                collapsed ? 'cursor-pointer hover:scale-105 transition-transform' : ''
              }`}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                  Controle de Apontamentos
                </h1>
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                  Reunião de Jovens e Menores
                </p>
              </div>
            )}
          </div>

          {/* Botão Retrair / Expandir (Desktop) */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                collapsed
                  ? 'absolute -right-3 top-7 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300'
                  : ''
              }`}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Botão fechar apenas no mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação Principal */}
        <div className={`flex-1 overflow-y-auto ${collapsed ? 'px-2.5' : 'px-4'} py-5 space-y-1.5 scrollbar-thin`}>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Navegação Principal
            </p>
          )}

          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            title={collapsed ? 'Dashboard' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
            } rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentRoute === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentRoute === 'dashboard' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              {!collapsed && <span>Dashboard</span>}
            </div>
            {!collapsed && currentRoute === 'dashboard' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* 1.5 Calendário */}
          {hasPermission(user, 'visualizar_calendario') && (
            <button
              onClick={() => handleNavClick('calendario')}
              title={collapsed ? 'Calendário de Reuniões' : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center p-2.5 relative' : 'justify-between px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentRoute === 'calendario'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                <Clock className={`w-4 h-4 shrink-0 ${currentRoute === 'calendario' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                {!collapsed && <span>Calendário de Reuniões</span>}
              </div>
              {collapsed && (reunioesHojeCount > 0 || reunioesAmanhaCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              )}
              {!collapsed && (reunioesHojeCount > 0 || reunioesAmanhaCount > 0) && (
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {reunioesHojeCount > 0 && (
                    <span 
                      title={`${reunioesHojeCount} evento(s) hoje`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                        currentRoute === 'calendario' 
                          ? 'bg-white text-emerald-700' 
                          : 'bg-amber-500 text-white animate-pulse'
                      }`}
                    >
                      Hoje ({reunioesHojeCount})
                    </span>
                  )}
                  {reunioesAmanhaCount > 0 && (
                    <span 
                      title={`${reunioesAmanhaCount} evento(s) amanhã (1 dia antes)`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                        currentRoute === 'calendario' 
                          ? 'bg-white/80 text-emerald-800' 
                          : 'bg-sky-500 text-white'
                      }`}
                    >
                      Amanhã ({reunioesAmanhaCount})
                    </span>
                  )}
                </div>
              )}
            </button>
          )}

          {/* 1.6 Agenda de Visitas */}
          {hasPermission(user, 'agenda_visitas') && (
            <button
              onClick={() => handleNavClick('agenda-visitas')}
              title={collapsed ? 'Agenda de Visitas' : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center p-2.5 relative' : 'justify-between px-3.5 py-2.5'
              } rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentRoute === 'agenda-visitas'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                <Calendar className={`w-4 h-4 shrink-0 ${currentRoute === 'agenda-visitas' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                {!collapsed && <span>Agenda de Visitas</span>}
              </div>
              {collapsed && (visitasHojeCount > 0 || visitasAmanhaCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white dark:ring-slate-900" />
              )}
              {!collapsed && (visitasHojeCount > 0 || visitasAmanhaCount > 0) && (
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {visitasHojeCount > 0 && (
                    <span 
                      title={`${visitasHojeCount} visita(s) hoje`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                        currentRoute === 'agenda-visitas' 
                          ? 'bg-white text-emerald-700' 
                          : 'bg-teal-500 text-white animate-pulse'
                      }`}
                    >
                      Hoje ({visitasHojeCount})
                    </span>
                  )}
                  {visitasAmanhaCount > 0 && (
                    <span 
                      title={`${visitasAmanhaCount} visita(s) amanhã (1 dia antes)`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                        currentRoute === 'agenda-visitas' 
                          ? 'bg-white/80 text-teal-800' 
                          : 'bg-sky-500 text-white'
                      }`}
                    >
                      Amanhã ({visitasAmanhaCount})
                    </span>
                  )}
                </div>
              )}
            </button>
          )}

          {/* 2. Apontamentos (com Submódulos) */}
          <div className="space-y-1">
            {!collapsed && (
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
            )}

            {(isApontamentosExpanded || collapsed) && (
              <div className={collapsed ? 'space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60' : 'pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150'}>
                {/* 2.1 Controle de Apontamentos */}
                <button
                  onClick={() => handleNavClick('controle-apontamentos')}
                  title={collapsed ? 'Controle de Apontamentos' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'controle-apontamentos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <ClipboardCheck className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Controle de Apontamentos</span>}
                  </div>
                </button>

                {/* 2.3 Mocidade / Santa Ceia */}
                <button
                  onClick={() => handleNavClick('apontamentos-contagens')}
                  title={collapsed ? 'Mocidade / Sta Ceia' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'apontamentos-contagens'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Users className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Mocidade / Sta Ceia</span>}
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Divisor */}
          {!collapsed && (
            <div className="pt-5 pb-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Gestão e Controle
              </p>
            </div>
          )}

          {/* Relatórios */}
          {hasPermission(user, 'exportar_relatorios') && (
          <div className="space-y-1">
            {!collapsed && (
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
            )}

            {(isRelatoriosExpanded || collapsed) && (
              <div className={collapsed ? 'space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60' : 'pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150'}>
                <button
                  onClick={() => handleNavClick('acompanhamento-setor')}
                  title={collapsed ? 'Acompanhamento Setor' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'acompanhamento-setor'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <TrendingUp className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Acompanhamento Setor</span>}
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('acompanhamento-anciaos')}
                  title={collapsed ? 'Acompanhamento Anciãos' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'acompanhamento-anciaos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <UserCheck className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Acompanhamento Anciãos</span>}
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('relatorio-auxiliares')}
                  title={collapsed ? 'Auxiliares de Jovens' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'relatorio-auxiliares'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Users className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Auxiliares de Jovens</span>}
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('relatorio-musicos')}
                  title={collapsed ? 'Relatório de Músicos' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'relatorio-musicos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <FileText className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Músicos</span>}
                  </div>
                </button>
                <button
                  onClick={() => handleNavClick('relatorio-ministerio')}
                  title={collapsed ? 'Tempo de Ministério' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'relatorio-ministerio'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Clock className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Tempo de Ministério</span>}
                  </div>
                </button>
              </div>
            )}
          </div>
          )}

          {/* 3. Administração (com Submódulos) */}
          {(hasPermission(user, 'gerenciar_comuns') || hasPermission(user, 'gerenciar_usuarios') || hasPermission(user, 'gerenciar_auxiliares') || hasPermission(user, 'gerenciar_tipos_evento') || hasPermission(user, 'gerenciar_reunioes') || hasPermission(user, 'gerenciar_perfis')) && (
          <div className="space-y-1">
            {!collapsed && (
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
            )}

            {/* Submódulos de Administração */}
            {(isAdminExpanded || collapsed) && (
              <div className={collapsed ? 'space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/60' : 'pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150'}>
                {/* 3.1 Comum Congregação */}
                {hasPermission(user, 'gerenciar_comuns') && (
                <button
                  onClick={() => handleNavClick('admin-comuns')}
                  title={collapsed ? `Comum Congregação (${comunsCount})` : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-comuns'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Building2 className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Comum Congregação</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {comunsCount}
                    </span>
                  )}
                </button>
                )}

                {/* 3.2 Usuários */}
                {hasPermission(user, 'gerenciar_usuarios') && (
                <button
                  onClick={() => handleNavClick('admin-usuarios')}
                  title={collapsed ? `Usuários (${usuariosCount})` : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-usuarios'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Users className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Usuários</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {usuariosCount}
                    </span>
                  )}
                </button>
                )}

                {/* 3.3 Pré-Cadastros */}
                {hasPermission(user, 'gerenciar_usuarios') && (
                <button
                  onClick={() => handleNavClick('admin-pre-cadastros')}
                  title={collapsed ? `Pré-Cadastros${preCadastrosCount > 0 ? ` (${preCadastrosCount})` : ''}` : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl relative' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-pre-cadastros'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <UserPlus className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Pré-Cadastros</span>}
                  </div>
                  {collapsed && preCadastrosCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                  {!collapsed && preCadastrosCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
                      {preCadastrosCount}
                    </span>
                  )}
                </button>
                )}

                {/* 3.3 Cadastro de Anciãos */}
                {user?.perfis?.nome !== 'CJM' && (
                <button
                  onClick={() => handleNavClick('admin-anciaos')}
                  title={collapsed ? 'Cadastro de Anciãos' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-anciaos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <UserCheck className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Cadastro de Anciãos</span>}
                  </div>
                </button>
                )}

                {/* 3.4 Perfis de Acesso */}
                {hasPermission(user, 'gerenciar_perfis') && (
                <button
                  onClick={() => handleNavClick('admin-perfis')}
                  title={collapsed ? 'Perfis de Acesso' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-perfis'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <KeyRound className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Perfis de Acesso</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono">
                      {perfisCount}
                    </span>
                  )}
                </button>
                )}

                {/* 3.5 Cadastro de Tipo de Evento */}
                {hasPermission(user, 'gerenciar_tipos_evento') && (
                <button
                  onClick={() => handleNavClick('admin-tipos-evento')}
                  title={collapsed ? 'Tipos de Evento' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-tipos-evento'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <ClipboardCheck className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Tipos de Evento</span>}
                  </div>
                </button>
                )}
                
                {/* 3.6 Cadastro de Reuniões / Eventos */}
                {hasPermission(user, 'gerenciar_reunioes') && (
                <button
                  onClick={() => handleNavClick('admin-reunioes-eventos')}
                  title={collapsed ? 'Reuniões / Eventos' : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center p-2.5 rounded-xl' : 'justify-between px-3 py-2 rounded-lg'
                  } text-xs font-medium transition-all cursor-pointer ${
                    currentRoute === 'admin-reunioes-eventos'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                    <Clock className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600 dark:text-emerald-400`} />
                    {!collapsed && <span>Reuniões / Eventos</span>}
                  </div>
                </button>
                )}
              </div>
            )}
          </div>
          )}

        </div>

      {/* Rodapé da Sidebar */}
      <div className={`${collapsed ? 'p-2.5' : 'p-4'} border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5`}>

          {onOpenLgpdModal && (
            <button
              type="button"
              onClick={() => {
                onOpenLgpdModal();
                onCloseMobile();
              }}
              title={collapsed ? 'Privacidade & LGPD' : undefined}
              className="w-full flex items-center justify-center space-x-1.5 py-1 text-[11px] text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {!collapsed && <span>Privacidade & LGPD</span>}
            </button>
          )}

          {/* Usuário logado atual */}
          <div
            title={collapsed ? `${user?.nome_completo || 'Operador'} (${user?.perfis?.nome || 'Acesso Autorizado'})` : undefined}
            className={`flex items-center ${
              collapsed ? 'justify-center p-1.5' : 'justify-between px-3 py-2'
            } rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50`}
          >
            <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5 min-w-0'}`}>
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs flex-shrink-0">
                {user?.nome_completo
                  ? user.nome_completo.split(' ').map((n) => n[0]).slice(0, 2).join('')
                  : 'OP'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.nome_completo || 'Operador'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.perfis?.nome || 'Acesso Autorizado'}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={() => {
                  logout();
                  onCloseMobile();
                }}
                title="Encerrar Sessão (Sair)"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              logout();
              onCloseMobile();
            }}
            title={collapsed ? 'Sair do Sistema' : undefined}
            className={`w-full flex items-center justify-center ${
              collapsed ? 'p-2' : 'space-x-2 px-3 py-2'
            } rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 font-semibold text-xs transition cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
