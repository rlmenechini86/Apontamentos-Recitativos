import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, User, Calendar, Building2, ArrowUpDown, TrendingUp, Filter, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { ComumCongregacao, ContagemMocidade, Setor } from '../types';
import { apiGet } from '../utils/api';
import { Pagination } from './Pagination';
import { useAuth } from '../context/AuthContext';
import { getUserScope, isItemInUserSector } from '../utils/permissions';

interface Props {
  comuns: ComumCongregacao[];
  usuarios?: any[];
  setores?: Setor[];
}

export const RelatorioAuxiliaresView: React.FC<Props> = ({ comuns: propComuns, setores: propSetores }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'data', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);

  const userScope = useMemo(() => getUserScope(user, propComuns, setores), [user, propComuns, setores]);

  useEffect(() => {
    if (userScope.isSetor && userScope.userSetorId) {
      setSelectedSetorId(userScope.userSetorId);
    } else if (userScope.isComum && userScope.userComumId) {
      setSelectedComumId(userScope.userComumId);
      if (userScope.userSetorId) {
        setSelectedSetorId(userScope.userSetorId);
      }
    }
  }, [userScope.isSetor, userScope.userSetorId, userScope.isComum, userScope.userComumId]);

  useEffect(() => {
    if (propSetores && propSetores.length > 0) {
      setSetores(propSetores);
    } else {
      fetch('/api/comuns/meta/setores')
        .then(res => res.json())
        .then(json => setSetores(json.data || []))
        .catch(err => console.error('Erro ao buscar setores:', err));
    }
  }, [propSetores]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet('/api/contagens');
        const json = res.ok ? await res.json() : { data: [] };
        setContagens(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const comuns = useMemo(() => {
    if (userScope.isComum && userScope.userComumId) {
      return propComuns.filter(c => c.id === userScope.userComumId);
    }
    if (userScope.isSetor) {
      return propComuns.filter(c => isItemInUserSector(userScope, c, propComuns, setores));
    }
    return propComuns;
  }, [propComuns, userScope, setores]);

  const comunsDoSetor = useMemo(() => {
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c =>
      c.setor_id === selectedSetorId ||
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId]);

  // Filtra as contagens apenas de Mocidade
  const filteredContagens = useMemo(() => {
    return contagens.filter(c => {
      if (c.tipo !== 'Mocidade') return false;
      if (selectedYear && !c.data.startsWith(selectedYear)) return false;

      if (selectedSetorId) {
        const comum = comuns.find(item => item.id === c.comum_id);
        const selectedSetor = setores.find(s => s.id === selectedSetorId);
        const matchesSetor = comum && (comum.setor_id === selectedSetorId || (selectedSetor && comum.setor_pertencente === selectedSetor.nome));
        if (!matchesSetor) return false;
      }

      if (selectedComumId && c.comum_id !== selectedComumId) return false;

      return true;
    });
  }, [contagens, selectedYear, selectedSetorId, selectedComumId, comuns, setores]);

  const totalCongregacoes = useMemo(() => {
    return selectedComumId ? 1 : comunsDoSetor.length;
  }, [selectedComumId, comunsDoSetor]);

  // Totais Consolidados
  const totals = useMemo(() => {
    let mocos = 0;
    let mocas = 0;
    let presencaTotal = 0;

    filteredContagens.forEach(c => {
      mocos += Number(c.auxiliares_mocos) || 0;
      mocas += Number(c.auxiliares_mocas) || 0;
      presencaTotal += Number(c.quantidade) || 0;
    });

    const totalAux = mocos + mocas;
    const mediaPorReuniao = filteredContagens.length > 0 ? (totalAux / filteredContagens.length).toFixed(1) : '0';

    return {
      mocos,
      mocas,
      totalAux,
      presencaTotal,
      reunioesCount: filteredContagens.length,
      mediaPorReuniao
    };
  }, [filteredContagens]);

  // Dados para o Gráfico Recharts (agrupado por congregação - todas as localidades)
  const chartData = useMemo(() => {
    const targetComuns = selectedComumId
      ? comunsDoSetor.filter(c => c.id === selectedComumId)
      : comunsDoSetor;

    const agrupado: Record<string, { nome: string; mocos: number; mocas: number; total: number }> = {};

    // Inicializa todas as congregações para que todas apareçam no gráfico
    targetComuns.forEach(c => {
      agrupado[c.id] = { nome: c.nome, mocos: 0, mocas: 0, total: 0 };
    });

    filteredContagens.forEach(c => {
      const comumId = c.comum_id;
      const comum = comuns.find(item => item.id === comumId);
      const comumNome = c.comum_congregacao?.nome || comum?.nome || 'Outros';
      const key = comumId || comumNome;

      if (!agrupado[key]) {
        agrupado[key] = { nome: comumNome, mocos: 0, mocas: 0, total: 0 };
      }
      agrupado[key].mocos += Number(c.auxiliares_mocos) || 0;
      agrupado[key].mocas += Number(c.auxiliares_mocas) || 0;
      agrupado[key].total += (Number(c.auxiliares_mocos) || 0) + (Number(c.auxiliares_mocas) || 0);
    });

    return Object.values(agrupado).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.nome.localeCompare(b.nome);
    });
  }, [filteredContagens, comuns, comunsDoSetor, selectedComumId]);

  // Ordenação da Tabela
  const sortedItems = useMemo(() => {
    const list = [...filteredContagens];
    if (!sortConfig) return list;

    list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortConfig.key === 'data') {
        aVal = a.data;
        bVal = b.data;
      } else if (sortConfig.key === 'comum') {
        aVal = a.comum_congregacao?.nome || '';
        bVal = b.comum_congregacao?.nome || '';
      } else if (sortConfig.key === 'mocos') {
        aVal = a.auxiliares_mocos || 0;
        bVal = b.auxiliares_mocos || 0;
      } else if (sortConfig.key === 'mocas') {
        aVal = a.auxiliares_mocas || 0;
        bVal = b.auxiliares_mocas || 0;
      } else if (sortConfig.key === 'total') {
        aVal = (a.auxiliares_mocos || 0) + (a.auxiliares_mocas || 0);
        bVal = (b.auxiliares_mocos || 0) + (b.auxiliares_mocas || 0);
      } else if (sortConfig.key === 'presenca') {
        aVal = a.quantidade || 0;
        bVal = b.quantidade || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredContagens, sortConfig]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Relatório de Auxiliares de Jovens</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidado de presença de Auxiliares Moços e Moças nas Reuniões da Mocidade
          </p>
        </div>

        {/* Filtros de Topo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ano */}
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          {/* Setor */}
          <select
            disabled={userScope.isSetor || userScope.isComum}
            value={selectedSetorId}
            onChange={(e) => { setSelectedSetorId(e.target.value); setSelectedComumId(''); setCurrentPage(1); }}
            className={`px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 ${userScope.isSetor || userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
          >
            {!userScope.isSetor && !userScope.isComum && <option value="">Setores (Todos)</option>}
            {(userScope.isSetor || userScope.isComum ? (userScope.userSetor ? [userScope.userSetor] : []) : setores).map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          {/* Comum */}
          <select
            disabled={userScope.isComum}
            value={selectedComumId}
            onChange={(e) => { setSelectedComumId(e.target.value); setCurrentPage(1); }}
            className={`px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 ${userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
          >
            {!userScope.isComum && <option value="">Congregações (Todas)</option>}
            {comunsDoSetor.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {((!userScope.isSetor && selectedSetorId) || selectedComumId) && (
            <button
              onClick={() => { setSelectedSetorId(userScope.isSetor && userScope.userSetorId ? userScope.userSetorId : ''); setSelectedComumId(''); setCurrentPage(1); }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Total de Localidade</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {totalCongregacoes}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <User className="w-4 h-4" />
            <span>Auxiliares Moços</span>
          </div>
          <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-2">
            {totals.mocos}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-400 text-xs font-semibold">
            <User className="w-4 h-4" />
            <span>Auxiliares Moças</span>
          </div>
          <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-2">
            {totals.mocas}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Users className="w-4 h-4" />
            <span>Total Auxiliares</span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
            {totals.totalAux}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Média / Reunião</span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
            {totals.mediaPorReuniao}
          </p>
        </div>
      </div>

      {/* Gráfico Recharts */}
      {chartData.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Distribuição de Auxiliares Moços e Moças por Congregação (Todas as Localidades)</span>
            </h2>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <div style={{ minWidth: chartData.length > 8 ? `${Math.max(chartData.length * 55, 600)}px` : '100%' }} className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="mocos" name="Auxiliares Moços" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="mocas" name="Auxiliares Moças" fill="#a855f7" stackId="a" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="total"
                      position="top"
                      offset={6}
                      className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300"
                      formatter={(val: any) => (Number(val) > 0 ? val : '')}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Detalhada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            Listagem de Apontamentos de Auxiliares
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {filteredContagens.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('data')}>
                  <div className="flex items-center space-x-1"><span>Data</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('comum')}>
                  <div className="flex items-center space-x-1"><span>Congregação</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold" onClick={() => handleSort('mocos')}>
                  <div className="flex items-center justify-center space-x-1"><span>Moços</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-400 font-bold" onClick={() => handleSort('mocas')}>
                  <div className="flex items-center justify-center space-x-1"><span>Moças</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-bold" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-center space-x-1"><span>Total Aux.</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('presenca')}>
                  <div className="flex items-center justify-center space-x-1"><span>Total de Mocidade</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Carregando dados...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Nenhum apontamento com auxiliares encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  const totalAux = (item.auxiliares_mocos || 0) + (item.auxiliares_mocas || 0);
                  const comumNome = item.comum_congregacao?.nome || comuns.find(c => c.id === item.comum_id)?.nome || '-';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {item.data ? item.data.split('T')[0].split('-').reverse().join('/') : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
                        {comumNome}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400 text-xs bg-blue-50/30 dark:bg-blue-950/20">
                        {item.auxiliares_mocos || 0}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400 text-xs bg-purple-50/30 dark:bg-purple-950/20">
                        {item.auxiliares_mocas || 0}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50/40 dark:bg-emerald-950/30">
                        {totalAux}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {item.quantidade || 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {sortedItems.length > itemsPerPage && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedItems.length / itemsPerPage)}
              totalItems={sortedItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
