import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  ClipboardCheck,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { ComumCongregacao, Setor, Usuario, ContagemMocidade, Anciao, AuxiliarJovens } from '../types';
import { NavRoute } from './Sidebar';
import { apiGet } from '../utils/api';

interface DashboardViewProps {
  comuns: ComumCongregacao[];
  setores: Setor[];
  usuarios: Usuario[];
  onNavigate: (route: NavRoute) => void;
  onOpenNovaComum: () => void;
  onOpenNovoUsuario: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  comuns,
  setores,
  usuarios,
  onNavigate,
  onOpenNovaComum,
  onOpenNovoUsuario,
}) => {
  const ativas = comuns.filter((c) => c.ativo).length;
  const reunioes10hs = comuns.filter((c) => c.dia_reuniao_jovens === 'Domingo 10hs').length;
  const reunioes1430hs = comuns.filter((c) => c.dia_reuniao_jovens === 'Domingo 14:30hs').length;

  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [anciaos, setAnciaos] = useState<Anciao[]>([]);
  const [auxiliares, setAuxiliares] = useState<AuxiliarJovens[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resContagens, resAnciaos, resAuxiliares] = await Promise.all([
          apiGet('/api/contagens'),
          apiGet('/api/anciaos'),
          apiGet('/api/auxiliares')
        ]);
        if (resContagens.ok) {
          const json = await resContagens.json();
          setContagens(json.data || []);
        }
        if (resAnciaos.ok) {
          const json = await resAnciaos.json();
          setAnciaos(json.data || []);
        }
        if (resAuxiliares.ok) {
          const json = await resAuxiliares.json();
          setAuxiliares(json.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const currentYear = new Date().getFullYear().toString();

  const totalMocidade = useMemo(() => {
    const maxPorComum: Record<string, number> = {};
    contagens.forEach(c => {
      if (c.tipo === 'Mocidade' && c.data?.startsWith(currentYear)) {
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens, currentYear]);

  const totalSantaCeia = useMemo(() => {
    const maxPorComum: Record<string, number> = {};
    contagens.forEach(c => {
      if (c.tipo === 'Santa Ceia' && c.data?.startsWith(currentYear)) {
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens, currentYear]);

  const totalCJM = usuarios.filter(u => u.cargo_ministerio?.toLowerCase().includes('cjm') && u.ativo).length;
  const totalAnciaos = anciaos.filter(a => a.ativo).length;
  const totalAuxiliares = auxiliares.filter(a => a.ativo && a.is_auxiliar).length;

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-500/20 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Integrado de Gestão • Regional Guarulhos</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Painel Geral de Apontamentos
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Controle consolidado das Reuniões de Jovens e Menores, congregações pertencentes,
            quadro de auxiliares, membros da CJM e operadores do sistema.
          </p>

          {/* Atalhos Rápidos */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('apontamentos')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Ver Apontamentos</span>
            </button>
            <button
              onClick={onOpenNovaComum}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition cursor-pointer shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Nova Comum</span>
            </button>
            <button
              onClick={onOpenNovoUsuario}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Efeito sutil de fundo */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Comuns */}
        <div
          onClick={() => onNavigate('admin-comuns')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/40 rounded-xl p-5 shadow-xs transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comuns
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{comuns.length}</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">({ativas} ativas)</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
            <span>Ver congregações</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Card Mocidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Mocidade ({currentYear})
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalMocidade}</span>
          </div>
        </div>

        {/* Card Santa Ceia */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Santa Ceia ({currentYear})
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalSantaCeia}</span>
          </div>
        </div>

        {/* Card CJM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CJM Ativos
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalCJM}</span>
          </div>
        </div>

        {/* Card Anciãos e Auxiliares */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Liderança
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Anciãos</p>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalAnciaos}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Aux. Jovens</p>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalAuxiliares}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Distribuição de Horários e Setores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários das Reuniões de Jovens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Horários das Reuniões de Jovens
              </h3>
            </div>
            <span className="text-xs text-slate-500">2 Opções Oficiais</span>
          </div>

          <div className="space-y-3">
            {/* Opção 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Domingo 10hs</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Período da Manhã</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{reunioes10hs}</span>
                <span className="text-xs text-slate-500">congregações</span>
              </div>
            </div>

            {/* Opção 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Domingo 14:30hs</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Período da Tarde</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-sky-700 dark:text-sky-400">{reunioes1430hs}</span>
                <span className="text-xs text-slate-500">congregações</span>
              </div>
            </div>
          </div>
        </div>

        {/* Setores e Congregações Vinculadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Congregações por Setor Pertencente
              </h3>
            </div>
            <button
              onClick={() => onNavigate('admin-comuns')}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2.5">
            {setores.map((setor) => {
              const count = comuns.filter((c) => c.setor_id === setor.id).length;
              return (
                <div
                  key={setor.id}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{setor.codigo}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{setor.nome}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                    {count} congregação{count === 1 ? '' : 'ões'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
