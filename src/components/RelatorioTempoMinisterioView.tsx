import React, { useState, useMemo } from 'react';
import { 
  Users, BarChart as BarChartIcon, Clock, ArrowUpDown, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ComumCongregacao, Usuario } from '../types';

interface RelatorioTempoMinisterioViewProps {
  comuns: ComumCongregacao[];
  usuarios: Usuario[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const RelatorioTempoMinisterioView: React.FC<RelatorioTempoMinisterioViewProps> = ({ 
  comuns, 
  usuarios 
}) => {
  const [selectedComumId, setSelectedComumId] = useState<string>('');
  const [selectedCargo, setSelectedCargo] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filtra apenas usuários ativos que possuem data de apresentação
  const usuariosValidos = useMemo(() => {
    return usuarios.filter(u => u.ativo && u.data_apresentacao);
  }, [usuarios]);

  // Lista de cargos únicos para o filtro
  const cargos = useMemo(() => {
    const unique = new Set(usuariosValidos.map(u => u.cargo_ministerio).filter(Boolean) as string[]);
    return Array.from(unique).sort();
  }, [usuariosValidos]);

  const filteredUsuarios = useMemo(() => {
    let data = usuariosValidos;
    if (selectedComumId) {
      data = data.filter(u => u.comum_congregacao_id === selectedComumId);
    }
    if (selectedCargo) {
      data = data.filter(u => u.cargo_ministerio === selectedCargo);
    }
    return data;
  }, [usuariosValidos, selectedComumId, selectedCargo]);

  // Processa dados para a tabela
  const tableData = useMemo(() => {
    const processed = filteredUsuarios.map(u => {
      const comumNome = comuns.find(c => c.id === u.comum_congregacao_id)?.nome || 'Sem Comum';
      
      let tempoAnos = 0;
      let dataFormatada = '-';
      
      if (u.data_apresentacao) {
        const [y, m, d] = u.data_apresentacao.split('-');
        dataFormatada = `${d}/${m}/${y}`;
        const presDate = new Date(Number(y), Number(m) - 1, Number(d));
        const today = new Date();
        let years = today.getFullYear() - presDate.getFullYear();
        if (today.getMonth() < presDate.getMonth() || (today.getMonth() === presDate.getMonth() && today.getDate() < presDate.getDate())) {
          years--;
        }
        tempoAnos = years >= 0 ? years : 0;
      }
      
      return { 
        ...u, 
        comumNome, 
        dataFormatada, 
        tempoAnos, 
        cargo: u.cargo_ministerio || 'Não informado',
        timeMs: u.data_apresentacao ? new Date(u.data_apresentacao).getTime() : 0 
      };
    });

    if (sortConfig) {
      processed.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];
        
        if (sortConfig.key === 'dataFormatada') {
           valA = a.timeMs;
           valB = b.timeMs;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      processed.sort((a, b) => a.comumNome.localeCompare(b.comumNome) || b.tempoAnos - a.tempoAnos);
    }
    
    return processed;
  }, [filteredUsuarios, comuns, sortConfig]);

  // Processa dados para o gráfico de barras (Faixas de Tempo)
  const chartData = useMemo(() => {
    const faixas = [
      { id: '0-2', label: '0 a 2 anos', min: 0, max: 2, count: 0 },
      { id: '3-5', label: '3 a 5 anos', min: 3, max: 5, count: 0 },
      { id: '6-10', label: '6 a 10 anos', min: 6, max: 10, count: 0 },
      { id: '11-15', label: '11 a 15 anos', min: 11, max: 15, count: 0 },
      { id: '16-20', label: '16 a 20 anos', min: 16, max: 20, count: 0 },
      { id: '21+', label: 'Mais de 20 anos', min: 21, max: 999, count: 0 },
    ];

    tableData.forEach(user => {
      const f = faixas.find(faixa => user.tempoAnos >= faixa.min && user.tempoAnos <= faixa.max);
      if (f) {
        f.count++;
      }
    });

    return faixas.filter(f => f.count > 0);
  }, [tableData]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            {payload[0].value} {payload[0].value === 1 ? 'irmão' : 'irmãos'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[98%] mx-auto">
      
      {/* Header */}
      <div className="bg-slate-800 text-white rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden border border-slate-700">
        <div className="flex-1 px-8 py-6 flex items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1548625361-ec4a572db0f8?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
          <Clock className="w-10 h-10 mr-4 text-emerald-400 relative z-10" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-tight">Tempo de Ministério</h1>
            <p className="text-slate-300 text-sm mt-1">Análise do tempo de apresentação dos irmãos cadastrados</p>
          </div>
        </div>
      </div>

      {/* Filtros Minimalistas */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="flex items-center text-slate-500 dark:text-slate-400 mr-2">
            <Filter className="w-5 h-5 mr-2" />
            <span className="font-medium">Filtros:</span>
          </div>
          
          <select
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as Congregações</option>
            {comuns.sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            value={selectedCargo}
            onChange={(e) => setSelectedCargo(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos os Cargos</option>
            {cargos.map((cargo) => (
              <option key={cargo} value={cargo}>{cargo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
          <BarChartIcon className="w-5 h-5 mr-2 text-sky-400" />
          <h3 className="font-bold text-sm tracking-wider uppercase">DISTRIBUIÇÃO POR FAIXA DE TEMPO</h3>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 w-full h-[350px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b' }} 
                  allowDecimals={false}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              Nenhum dado encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">DETALHAMENTO DE IRMÃOS</h3>
          </div>
          <span className="text-xs font-medium bg-slate-700 px-2.5 py-1 rounded-full">
            Total: {tableData.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleSort('comumNome')}>
                  <div className="flex items-center space-x-1"><span>Comum Congregação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleSort('nome_completo')}>
                  <div className="flex items-center space-x-1"><span>Nome</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleSort('cargo')}>
                  <div className="flex items-center space-x-1"><span>Cargo / Ministério</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleSort('dataFormatada')}>
                  <div className="flex items-center justify-center space-x-1"><span>Data de Apresentação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handleSort('tempoAnos')}>
                  <div className="flex items-center justify-center space-x-1"><span>Tempo (Anos)</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum irmão encontrado com data de apresentação.
                  </td>
                </tr>
              ) : (
                tableData.map((u, i) => (
                  <tr key={u.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{u.comumNome}</td>
                    <td className="px-4 py-3">{u.nome_completo}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.cargo}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{u.dataFormatada}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.tempoAnos}
                      </span>
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
