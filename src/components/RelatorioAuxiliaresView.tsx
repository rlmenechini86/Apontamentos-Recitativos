import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, HeartHandshake, ArrowUpDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { ComumCongregacao, Usuario, ContagemMocidade, AuxiliarJovens } from '../types';
import { apiGet } from '../utils/api';

interface Props {
  comuns: ComumCongregacao[];
  usuarios: Usuario[];
}

export const RelatorioAuxiliaresView: React.FC<Props> = ({ comuns: propComuns, usuarios: propUsuarios }) => {
  const [loading, setLoading] = useState(true);

  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [auxiliares, setAuxiliares] = useState<AuxiliarJovens[]>([]);
  
  const [selectedComumId, setSelectedComumId] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resContagens, resAuxiliares] = await Promise.all([
          apiGet('/api/contagens'),
          apiGet('/api/auxiliares').catch(() => ({ ok: true, json: () => ({ data: [] }) }))
        ]);
        
        const [jsonContagens, jsonAuxiliares] = await Promise.all([
          resContagens.ok ? resContagens.json() : { data: [] },
          'ok' in resAuxiliares ? resAuxiliares.json() : { data: [] }
        ]);

        setContagens(jsonContagens.data || []);
        setAuxiliares(jsonAuxiliares.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const comuns = propComuns;
  const usuarios = propUsuarios;

  const filteredComuns = useMemo(() => {
    return selectedComumId ? comuns.filter(c => c.id === selectedComumId) : comuns;
  }, [comuns, selectedComumId]);

  const totalCjms = useMemo(() => {
    return usuarios.filter(u => 
      u.cargo_ministerio?.toLowerCase().includes('cjm') && 
      u.ativo &&
      (selectedComumId ? u.comum_congregacao_id === selectedComumId : true)
    ).length;
  }, [usuarios, selectedComumId]);

  const totalAuxiliares = useMemo(() => {
    return auxiliares.filter(a => 
      a.ativo &&
      (selectedComumId ? a.comum_id === selectedComumId : true)
    ).length;
  }, [auxiliares, selectedComumId]);

  const totalMocidade = useMemo(() => {
    // Pega a maior contagem de mocidade de cada congregação no ano atual
    const currentYear = new Date().getFullYear().toString();
    const maxPorComum: Record<string, number> = {};
    
    contagens.forEach(c => {
      if (c.tipo === 'Mocidade' && c.data.startsWith(currentYear)) {
        if (selectedComumId && c.comum_id !== selectedComumId) return;
        
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens, selectedComumId]);

  const chartData = useMemo(() => {
    const data = filteredComuns.map(comum => {
      const auxComum = auxiliares.filter(a => a.comum_id === comum.id && a.ativo);
      const irmaos = auxComum.filter(a => a.sexo === 'Masculino').length;
      const irmas = auxComum.filter(a => a.sexo === 'Feminino').length;
      const total = irmaos + irmas;
      
      // Encurta nomes muito grandes
      let shortName = comum.nome;
      if (shortName.length > 15) {
        shortName = shortName.substring(0, 15) + '...';
      }

      return {
        id: comum.id,
        nome: comum.nome,
        shortName,
        irmaos,
        irmas,
        total
      };
    });
    
    // Sort by name or total? The mockup seems random or alphabetical.
    return data.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredComuns, auxiliares]);

  const tableData = useMemo(() => {
    let data = auxiliares.filter(a => a.ativo);
    if (selectedComumId) {
      data = data.filter(a => a.comum_id === selectedComumId);
    }
    
    const processed = data.map(aux => {
      const comumNome = comuns.find(c => c.id === aux.comum_id)?.nome || 'Desconhecida';
      const cjmNames = usuarios
        .filter(u => u.comum_congregacao_id === aux.comum_id && u.cargo_ministerio?.toLowerCase().includes('cjm') && u.ativo)
        .map(u => u.nome_completo)
        .join(', ') || '-';
      
      let tempoAnos: number | '-' = '-';
      let dataFormatada = '-';
      if (aux.data_apresentacao) {
        const [y, m, d] = aux.data_apresentacao.split('-');
        dataFormatada = `${d}/${m}/${y}`;
        const presDate = new Date(Number(y), Number(m) - 1, Number(d));
        const today = new Date();
        let years = today.getFullYear() - presDate.getFullYear();
        if (today.getMonth() < presDate.getMonth() || (today.getMonth() === presDate.getMonth() && today.getDate() < presDate.getDate())) {
          years--;
        }
        tempoAnos = years >= 0 ? years : 0;
      }
      return { ...aux, comumNome, cjmNames, dataFormatada, tempoAnos, timeMs: aux.data_apresentacao ? new Date(aux.data_apresentacao).getTime() : 0 };
    });

    if (sortConfig) {
      processed.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];
        
        if (sortConfig.key === 'tempoAnos') {
          valA = a.tempoAnos === '-' ? -1 : a.tempoAnos;
          valB = b.tempoAnos === '-' ? -1 : b.tempoAnos;
        } else if (sortConfig.key === 'dataFormatada') {
           valA = a.timeMs;
           valB = b.timeMs;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      processed.sort((a, b) => a.comumNome.localeCompare(b.comumNome) || a.nome.localeCompare(b.nome));
    }
    return processed;
  }, [auxiliares, comuns, usuarios, selectedComumId, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando relatório...</p>
      </div>
    );
  }

  // Custom Label for the total on top of stacked bars
  const renderTotalLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    let total = chartData[index]?.total;
    if (total === undefined || total === null) {
       total = Array.isArray(value) ? value[1] : Number(value);
    }
    
    if (!total || total === 0) return null;

    return (
      <g>
        <rect 
          x={Number(x) + Number(width) / 2 - 12} 
          y={Number(y) - 25} 
          width="24" 
          height="16" 
          fill="#f1f5f9" 
          rx="4"
        />
        <text 
          x={Number(x) + Number(width) / 2} 
          y={Number(y) - 14} 
          fill="#1e293b" 
          fontSize="11" 
          fontWeight="bold"
          textAnchor="middle"
        >
          {total}
        </text>
      </g>
    );
  };

  // Custom label inside the bars
  const renderInsideLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0 || height < 15) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2 + 4} 
        fill="#ffffff" 
        fontSize="10" 
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filtro de Comum Congregação */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
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
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded shadow-md overflow-hidden border border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        
        {/* Card CJMs */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalCjms}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de CJMs
          </div>
        </div>

        {/* Card Auxiliares */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalAuxiliares}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de Auxiliares
          </div>
        </div>

        {/* Card Mocidade */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-black text-slate-800">{totalMocidade.toLocaleString('pt-BR')}</div>
          <div className="w-full bg-[#c0c0c0] text-[#333] text-center text-xs font-bold py-1.5 mt-2 rounded">
            Quantidade de Mocidade
          </div>
        </div>

      </div>

      {/* Gráfico Stacked */}
      <div className="bg-white p-4 rounded shadow-md border border-slate-200 h-[600px] overflow-x-auto w-full">
        <div style={{ minWidth: `${Math.max(1000, chartData.length * 45)}px`, height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 80, right: 10, left: 10, bottom: 150 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="shortName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, angle: -45, textAnchor: 'end' }} 
                interval={0}
              />
              <YAxis hide domain={[0, (dataMax: number) => (dataMax === 0 ? 5 : Math.ceil(dataMax * 1.3))]} />
            <RechartsTooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => [value, name]}
            />
            
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Bar dataKey="irmaos" name="Moços (Azul)" stackId="a" fill="#3b82f6" barSize={20}>
              <LabelList dataKey="irmaos" content={renderInsideLabel} />
            </Bar>
            <Bar dataKey="irmas" name="Moças (Rosa)" stackId="a" fill="#f472b6" barSize={20}>
              <LabelList dataKey="irmas" content={renderInsideLabel} />
              <LabelList dataKey="total" content={renderTotalLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Detalhamento dos Auxiliares de Jovens</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('nome')}>
                  <div className="flex items-center space-x-1"><span>Nome do Auxiliar</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('sexo')}>
                  <div className="flex items-center space-x-1"><span>Sexo</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('comumNome')}>
                  <div className="flex items-center space-x-1"><span>Comum Congregação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('cjmNames')}>
                  <div className="flex items-center space-x-1"><span>Nome do CJM</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('dataFormatada')}>
                  <div className="flex items-center space-x-1"><span>Data de Apres.</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-4 py-3 font-semibold text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('tempoAnos')}>
                  <div className="flex items-center justify-center space-x-1"><span>Tempo (anos)</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tableData.map(aux => (
                <tr key={aux.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{aux.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      aux.sexo === 'Feminino' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {aux.sexo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{aux.comumNome}</td>
                  <td className="px-4 py-3 text-xs">{aux.cjmNames}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{aux.dataFormatada}</td>
                  <td className="px-4 py-3 text-center font-semibold">{aux.tempoAnos}</td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum auxiliar encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
