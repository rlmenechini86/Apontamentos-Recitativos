import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, ArrowUpDown, BarChart as BarChartIcon, Users, Calendar, Filter, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ComumCongregacao, ContagemMocidade, Setor } from '../types';
import { apiGet } from '../utils/api';
import { Pagination } from './Pagination';
import { FAMILIAS_INSTRUMENTOS } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  comuns: ComumCongregacao[];
  setores?: Setor[];
}

const CORES_FAMILIAS: Record<string, string> = {
  'Cordas Friccionadas': '#3b82f6', // blue
  'Madeiras': '#10b981',           // emerald
  'Metais': '#f59e0b',             // amber
  'Teclas': '#8b5cf6',             // violet
  'Outros': '#64748b',             // slate
};

export const RelatorioMusicosView: React.FC<Props> = ({ comuns: propComuns, setores: propSetores }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState(user?.comum_congregacao_id || '');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'data', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);

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

  const comuns = propComuns;

  const comunsDoSetor = useMemo(() => {
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c => 
      c.setor_id === selectedSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId]);

  // Filtra as contagens apenas de Mocidade com apontamento de músicos
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

      if (selectedFamilia) {
        const hasFam = Array.isArray(c.detalhes_musicos) && c.detalhes_musicos.some(d => d.familia === selectedFamilia && (Number(d.quantidade) || 0) > 0);
        if (!hasFam) return false;
      }

      return true;
    });
  }, [contagens, selectedYear, selectedSetorId, selectedComumId, selectedFamilia, comuns, setores]);

  // Totais por família de instrumentos
  const totalsByFamily = useMemo(() => {
    const totals: Record<string, number> = {
      'Cordas Friccionadas': 0,
      'Madeiras': 0,
      'Metais': 0,
      'Teclas': 0,
      'Outros': 0,
    };
    let totalGeral = 0;

    filteredContagens.forEach(c => {
      if (Array.isArray(c.detalhes_musicos)) {
        c.detalhes_musicos.forEach(d => {
          const qtd = Number(d.quantidade) || 0;
          if (totals[d.familia] !== undefined) {
            totals[d.familia] += qtd;
          } else {
            totals['Outros'] += qtd;
          }
          totalGeral += qtd;
        });
      } else if (c.total_musicos) {
        totalGeral += Number(c.total_musicos) || 0;
      }
    });

    return {
      totals,
      totalGeral,
      reunioesCount: filteredContagens.length,
    };
  }, [filteredContagens]);

  // Dados para o Gráfico de Barras
  const chartData = useMemo(() => {
    return FAMILIAS_INSTRUMENTOS.map(fam => {
      const qtd = totalsByFamily.totals[fam] || 0;
      const pct = totalsByFamily.totalGeral > 0 
        ? ((qtd / totalsByFamily.totalGeral) * 100).toFixed(1) 
        : '0';

      return {
        familia: fam,
        quantidade: qtd,
        percentual: pct,
        cor: CORES_FAMILIAS[fam] || '#10b981'
      };
    });
  }, [totalsByFamily]);

  // Linhas detalhadas por reunião
  const detailedRows = useMemo(() => {
    return filteredContagens.map(c => {
      const breakdown: Record<string, number> = {
        'Cordas Friccionadas': 0,
        'Madeiras': 0,
        'Metais': 0,
        'Teclas': 0,
        'Outros': 0,
      };
      let rowTotal = 0;

      if (Array.isArray(c.detalhes_musicos)) {
        c.detalhes_musicos.forEach(d => {
          const qtd = Number(d.quantidade) || 0;
          if (breakdown[d.familia] !== undefined) {
            breakdown[d.familia] += qtd;
          } else {
            breakdown['Outros'] += qtd;
          }
          rowTotal += qtd;
        });
      } else if (c.total_musicos) {
        rowTotal = Number(c.total_musicos) || 0;
      }

      const comumNome = c.comum_congregacao?.nome || comuns.find(item => item.id === c.comum_id)?.nome || '-';

      return {
        id: c.id,
        data: c.data,
        comumNome,
        breakdown,
        total: rowTotal,
        presencaMocidade: c.quantidade || 0
      };
    });
  }, [filteredContagens, comuns]);

  // Ordenação da Tabela
  const sortedRows = useMemo(() => {
    const list = [...detailedRows];
    if (!sortConfig) return list;

    list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortConfig.key === 'data') {
        aVal = a.data;
        bVal = b.data;
      } else if (sortConfig.key === 'comum') {
        aVal = a.comumNome;
        bVal = b.comumNome;
      } else if (sortConfig.key === 'total') {
        aVal = a.total;
        bVal = b.total;
      } else if (sortConfig.key === 'cordas') {
        aVal = a.breakdown['Cordas Friccionadas'] || 0;
        bVal = b.breakdown['Cordas Friccionadas'] || 0;
      } else if (sortConfig.key === 'madeiras') {
        aVal = a.breakdown['Madeiras'] || 0;
        bVal = b.breakdown['Madeiras'] || 0;
      } else if (sortConfig.key === 'metais') {
        aVal = a.breakdown['Metais'] || 0;
        bVal = b.breakdown['Metais'] || 0;
      } else if (sortConfig.key === 'teclas') {
        aVal = a.breakdown['Teclas'] || 0;
        bVal = b.breakdown['Teclas'] || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [detailedRows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, currentPage]);

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
            <Music className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Relatório de Músicos por Família de Instrumentos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Distribuição consolidada da orquestra apontada nas Reuniões da Mocidade
          </p>
        </div>

        {/* Filtros */}
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
            value={selectedSetorId}
            onChange={(e) => { setSelectedSetorId(e.target.value); setSelectedComumId(''); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Setores (Todos)</option>
            {setores.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          {/* Comum */}
          <select
            value={selectedComumId}
            onChange={(e) => { setSelectedComumId(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Congregações (Todas)</option>
            {comunsDoSetor.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Família */}
          <select
            value={selectedFamilia}
            onChange={(e) => { setSelectedFamilia(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Famílias (Todas)</option>
            {FAMILIAS_INSTRUMENTOS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {(selectedSetorId || selectedComumId || selectedFamilia) && (
            <button
              onClick={() => { setSelectedSetorId(''); setSelectedComumId(''); setSelectedFamilia(''); setCurrentPage(1); }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards por Família */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">🎻 Cordas</p>
          <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-2">
            {totalsByFamily.totals['Cordas Friccionadas'] || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">🎷 Madeiras</p>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
            {totalsByFamily.totals['Madeiras'] || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">🎺 Metais</p>
          <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
            {totalsByFamily.totals['Metais'] || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">🎹 Teclas</p>
          <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-2">
            {totalsByFamily.totals['Teclas'] || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">🎵 Outros</p>
          <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-2">
            {totalsByFamily.totals['Outros'] || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-teal-800 dark:text-teal-300">🎼 Total Músicos</p>
          <p className="text-xl font-bold font-mono text-teal-800 dark:text-teal-300 mt-2">
            {totalsByFamily.totalGeral}
          </p>
        </div>
      </div>

      {/* Gráfico Recharts */}
      {totalsByFamily.totalGeral > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Distribuição por Família de Instrumento</span>
            </h2>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="familia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip formatter={(value: any, name: any, item: any) => [`${value} músicos (${item.payload.percentual}%)`, 'Quantidade']} />
                <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela Detalhada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            Apontamentos de Músicos por Reunião
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {detailedRows.length} reuniões
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
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400" onClick={() => handleSort('cordas')}>
                  <div className="flex items-center justify-center space-x-1"><span>Cordas</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400" onClick={() => handleSort('madeiras')}>
                  <div className="flex items-center justify-center space-x-1"><span>Madeiras</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-400" onClick={() => handleSort('metais')}>
                  <div className="flex items-center justify-center space-x-1"><span>Metais</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-400" onClick={() => handleSort('teclas')}>
                  <div className="flex items-center justify-center space-x-1"><span>Teclas</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-center space-x-1"><span>Total Músicos</span><ArrowUpDown className="w-3 h-3" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Carregando dados...
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Nenhum apontamento de músicos encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {row.data ? row.data.split('T')[0].split('-').reverse().join('/') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
                      {row.comumNome}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400 text-xs bg-blue-50/20 dark:bg-blue-950/10">
                      {row.breakdown['Cordas Friccionadas'] || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50/20 dark:bg-emerald-950/10">
                      {row.breakdown['Madeiras'] || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-amber-700 dark:text-amber-400 text-xs bg-amber-50/20 dark:bg-amber-950/10">
                      {row.breakdown['Metais'] || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-purple-700 dark:text-purple-400 text-xs bg-purple-50/20 dark:bg-purple-950/10">
                      {row.breakdown['Teclas'] || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-teal-800 dark:text-teal-300 text-xs bg-teal-50/40 dark:bg-teal-950/30">
                      {row.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {sortedRows.length > itemsPerPage && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedRows.length / itemsPerPage)}
              totalItems={sortedRows.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
