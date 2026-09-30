import React from 'react';
import { Building2, Database, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Users } from 'lucide-react';
import { DbStatus } from '../types';

interface HeaderProps {
  status: DbStatus | null;
  activeTab: 'comuns' | 'usuarios';
  setActiveTab: (tab: 'comuns' | 'usuarios') => void;
}

export const Header: React.FC<HeaderProps> = ({ status, activeTab, setActiveTab }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Título */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/40">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                  Controle de Apontamentos
                </h1>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Módulo 1
                </span>
              </div>
              <p className="text-xs text-slate-400">Jovens e Menores • Localidades e Usuários</p>
            </div>
          </div>

          {/* Status do Banco Supabase */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs shadow-inner">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Banco:</span>
              {status?.connected && status?.tableExists ? (
                <span className="flex items-center text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Supabase Conectado
                </span>
              ) : status?.connected ? (
                <span className="flex items-center text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Conectado (SQL pendente)
                </span>
              ) : (
                <span className="flex items-center text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Modo Contingência
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex space-x-1 border-t border-slate-800/60 pt-1 -mb-px">
          <button
            onClick={() => setActiveTab('comuns')}
            className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comuns'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>CRUD Comum Congregação</span>
          </button>

          <button
            onClick={() => setActiveTab('usuarios')}
            className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'usuarios'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>CRUD Usuários</span>
          </button>
        </div>
      </div>
    </header>
  );
};
