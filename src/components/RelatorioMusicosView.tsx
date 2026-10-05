import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, ArrowUpDown, BarChart as BarChartIcon, Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { ComumCongregacao, AuxiliarJovens } from '../types';
import { apiGet } from '../utils/api';
import { obterFamiliaInstrumento } from './AuxiliaresCJMView';
import { useAuth } from '../context/AuthContext';

interface Props {
  comuns: ComumCongregacao[];
}

export const RelatorioMusicosView: React.FC<Props> = ({ comuns: propComuns }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auxiliares, setAuxiliares] = useState<AuxiliarJovens[]>([]);
  
  const isCJM = user?.perfis?.nome?.includes('CJM') || false;
  const userIsGlobal = !isCJM && (user?.perfis?.nivel_acesso === 'global' || user?.perfis?.nivel_acesso === 'setor');
  const [selectedComumId, setSelectedComumId] = useState(user?.comum_congregacao_id || '');
  
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [familySortConfig, setFamilySortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Força o valor inicial para a comum do usuário logado (corrige problemas de estado mantido ou load assíncrono)
  useEffect(() => {
    if (user?.comum_congregacao_id) {
      setSelectedComumId(user.comum_congregacao_id);
    }
  }, [user?.comum_congregacao_id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resAuxiliares = await apiGet('/api/auxiliares').catch(() => ({ ok: true, json: () => ({ data: [] }) }));
        const jsonAuxiliares = 'ok' in resAuxiliares ? await resAuxiliares.json() : { data: [] };
        setAuxiliares(jsonAuxiliares.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const comuns = userIsGlobal ? propComuns : propComuns.filter(c => c.id === user?.comum_congregacao_id);

  const musicos = useMemo(() => {
    return auxiliares.filter(a => {
      const activeAndMusico = a.ativo && a.is_musico === true;
      const matchesComum = userIsGlobal 
        ? (selectedComumId ? (a.comum_id || '') === selectedComumId : true)
        : (a.comum_id || '') === (user?.comum_congregacao_id || '');
      const matchesFamilia = selectedFamilia ? obterFamiliaInstrumento(a.instrumento || '') === selectedFamilia : true;
      return activeAndMusico && matchesComum && matchesFamilia;
    });
  }, [auxiliares, selectedComumId, selectedFamilia]);

  const instrumentData = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    musicos.forEach(m => {
      if (m.instrumento) {
        counts[m.instrumento] = (counts[m.instrumento] || 0) + 1;
        total++;
      }
    });

    const data = Object.keys(counts).map(inst => {
      const count = counts[inst];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
      return {
        instrumento: inst,
        familia: obterFamiliaInstrumento(inst),
        quantidade: count,
        percentual: percent,
        rawPercent: total > 0 ? (count / total) * 100 : 0
      };
    });

    if (sortConfig) {
      data.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by quantity descending
      data.sort((a, b) => b.quantidade - a.quantidade);
    }

    return data;
  }, [musicos, sortConfig]);

  const totalMusicos = musicos.length;
  const topInstrumento = useMemo(() => {
    if (instrumentData.length === 0) return '-';
    // copy and sort by quantity descending
    const sorted = [...instrumentData].sort((a, b) => b.quantidade - a.quantidade);
    return sorted[0].instrumento;
  }, [instrumentData]);

  const familyData = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    musicos.forEach(m => {
      if (m.instrumento) {
        const fam = obterFamiliaInstrumento(m.instrumento);
        counts[fam] = (counts[fam] || 0) + 1;
        total++;
      }
    });

    const data = Object.keys(counts).map(fam => {
      const count = counts[fam];
      const percent = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
      return {
        familia: fam,
        quantidade: count,
        percentual: percent,
        rawPercent: total > 0 ? (count / total) * 100 : 0
      };
    });

    if (familySortConfig) {
      data.sort((a, b) => {
        let valA: any = a[familySortConfig.key as keyof typeof a];
        let valB: any = b[familySortConfig.key as keyof typeof b];

        if (valA < valB) return familySortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return familySortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      data.sort((a, b) => b.quantidade - a.quantidade);
    }

    return data;
  }, [musicos, familySortConfig]);

  const allFamilies = useMemo(() => {
    const fams = new Set<string>();
    auxiliares.forEach(a => {
      if (a.is_musico && a.instrumento) {
        fams.add(obterFamiliaInstrumento(a.instrumento));
      }
    });
    return Array.from(fams).sort();
  }, [auxiliares]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFamilySort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (familySortConfig && familySortConfig.key === key && familySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setFamilySortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando relatório...</p>
      </div>
    );
  }

  // Custom label inside the bars
  const renderInsideLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0 || height < 15) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2 + 4} 
        fill="#ffffff" 
        fontSize="12" 
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    );
  };

  // Custom label on top of the bars
  const renderTopLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 8} 
        fill="#475569" 
        fontSize="12" 
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Comum Congregação:
          </label>
          <select
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as Congregações</option>
            {comuns.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Família:
          </label>
          <select
            value={selectedFamilia}
            onChange={(e) => setSelectedFamilia(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as Famílias</option>
            {allFamilies.map((fam) => (
              <option key={fam} value={fam}>{fam}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Total Músicos */}
        <div className="bg-emerald-600 text-white rounded-xl overflow-hidden shadow-md flex flex-col">
          <div className="p-4 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-4xl font-bold">{totalMusicos}</span>
          </div>
          <div className="bg-emerald-700 py-2 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center">
            <Users className="w-4 h-4 mr-2" />
            Total de Músicos
          </div>
        </div>

        {/* Card Instrumento Mais Comum */}
        <div className="bg-sky-600 text-white rounded-xl overflow-hidden shadow-md flex flex-col">
          <div className="p-4 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl font-bold">{topInstrumento}</span>
          </div>
          <div className="bg-sky-700 py-2 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center">
            <Music className="w-4 h-4 mr-2" />
            Instrumento Mais Comum
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico por Instrumento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">QUANTIDADE POR INSTRUMENTO</h3>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 overflow-x-auto w-full h-[400px]">
            <div style={{ minWidth: `${Math.max(400, instrumentData.length * 60)}px`, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={instrumentData} margin={{ top: 30, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="instrumento" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, angle: -45, textAnchor: 'end' }} 
                    interval={0}
                    tickMargin={10}
                  />
                  <YAxis hide domain={[0, (dataMax: number) => (dataMax === 0 ? 5 : Math.ceil(dataMax * 1.2))]} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [value, name === 'quantidade' ? 'Total' : name]}
                  />
                  <Bar dataKey="quantidade" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="quantidade" content={renderTopLabel} />
                    {
                      instrumentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#38bdf8'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico por Família */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-violet-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">QUANTIDADE POR FAMÍLIA</h3>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 overflow-x-auto w-full h-[400px]">
            <div style={{ minWidth: `${Math.max(400, familyData.length * 80)}px`, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={familyData} margin={{ top: 30, right: 10, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="familia" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, angle: -45, textAnchor: 'end' }} 
                    interval={0}
                    tickMargin={10}
                  />
                  <YAxis hide domain={[0, (dataMax: number) => (dataMax === 0 ? 5 : Math.ceil(dataMax * 1.2))]} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [value, name === 'quantidade' ? 'Total' : name]}
                  />
                  <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={60}>
                    <LabelList dataKey="quantidade" content={renderTopLabel} />
                    {
                      familyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#a78bfa'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tabela de Instrumentos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <Music className="w-5 h-5 mr-2 text-sky-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">TABELA DE INSTRUMENTOS</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('familia')}>
                    <div className="flex items-center space-x-1"><span>Família</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('instrumento')}>
                    <div className="flex items-center space-x-1"><span>Instrumento</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('quantidade')}>
                    <div className="flex items-center justify-center space-x-1"><span>Quantidade</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('rawPercent')}>
                    <div className="flex items-center justify-end space-x-1"><span>Percentual</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {instrumentData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-slate-600">{item.familia}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{item.instrumento}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-700">{item.quantidade}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-semibold text-slate-600 text-xs">{item.percentual}</span>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: item.percentual }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {instrumentData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Nenhum músico ou instrumento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Famílias */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <Users className="w-5 h-5 mr-2 text-violet-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">TABELA DE FAMÍLIAS</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleFamilySort('familia')}>
                    <div className="flex items-center space-x-1"><span>Família</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleFamilySort('quantidade')}>
                    <div className="flex items-center justify-center space-x-1"><span>Quantidade</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleFamilySort('rawPercent')}>
                    <div className="flex items-center justify-end space-x-1"><span>Percentual</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {familyData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.familia}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{item.quantidade}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        <span className="font-semibold text-slate-600">{item.percentual}</span>
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full" 
                            style={{ width: item.percentual }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {familyData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma família encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
