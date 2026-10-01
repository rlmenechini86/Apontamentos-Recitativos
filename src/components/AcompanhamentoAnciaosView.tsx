import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, TrendingUp, Search, BarChart as BarChartIcon, List
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { ComumCongregacao, Recitativo, ContagemMocidade, Anciao } from '../types';
import { apiGet } from '../utils/api';

import { useAuth } from '../context/AuthContext';

interface Props {
  comuns: ComumCongregacao[];
  anciaos: Anciao[];
}

export const AcompanhamentoAnciaosView: React.FC<Props> = ({ comuns: propComuns, anciaos: propAnciaos }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Vazio = Ano Inteiro
  const [selectedAnciaoId, setSelectedAnciaoId] = useState<string>('');

  // Data states
  const [recitativos, setRecitativos] = useState<Recitativo[]>([]);
  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resRecitativos, resContagens] = await Promise.all([
          apiGet('/api/recitativos'),
          apiGet('/api/contagens')
        ]);
        
        const [jsonRecitativos, jsonContagens] = await Promise.all([
          resRecitativos.ok ? resRecitativos.json() : { data: [] },
          resContagens.ok ? resContagens.json() : { data: [] }
        ]);

        setRecitativos(jsonRecitativos.data || []);
        setContagens(jsonContagens.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
  const comuns = propComuns.filter((c: any) => isRestrictedProfile ? c.id === user?.comum_congregacao_id : true);
  const anciaos = propAnciaos;

  // Filter available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recitativos.forEach(r => years.add(r.data.split('-')[0]));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [recitativos]);

  const months = [
    { value: '', label: 'Todos os Meses' },
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
  ];

  // Select first anciao by default when loaded if none selected
  useEffect(() => {
    if (!selectedAnciaoId && anciaos.length > 0) {
      setSelectedAnciaoId(anciaos[0].id);
    }
  }, [anciaos, selectedAnciaoId]);

  const selectedAnciao = anciaos.find(a => a.id === selectedAnciaoId);
  const comunsDoAnciao = comuns.filter(c => c.anciao_id === selectedAnciaoId).sort((a, b) => a.nome.localeCompare(b.nome));

  // Compute Data for Table and Chart
  const tableData = useMemo(() => {
    return comunsDoAnciao.map(comum => {
      // 1. Mocidade (Filtra por Ano - Pega a contagem mais recente do ano para todos os meses)
      const mocidadeRegistros = contagens
        .filter(c => c.comum_id === comum.id && c.tipo === 'Mocidade' && 
                     c.data.startsWith(selectedYear))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        
      const mocidadeTotal = mocidadeRegistros.length > 0 ? mocidadeRegistros[0].quantidade : 0;

      // 2. Expectativa
      const expectativa = Math.round(mocidadeTotal * 0.70);

      // 3. Total de Recitativos (Média ignorando zeros)
      const recsPeriodo = recitativos.filter(r => r.comum_id === comum.id && 
                                               r.data.startsWith(selectedMonth ? `${selectedYear}-${selectedMonth}` : selectedYear));
      const validRecs = recsPeriodo
        .map(r => r.meninas + r.meninos + r.mocas + r.mocos)
        .filter(total => total > 0);
      
      const mediaAnual = validRecs.length > 0 
        ? Math.round(validRecs.reduce((a, b) => a + b, 0) / validRecs.length) 
        : 0;

      // 4. Expectativa x Resultado
      const diff = mediaAnual - expectativa;

      return {
        comumNome: comum.nome,
        mocidade: mocidadeTotal,
        expectativa: expectativa,
        totalRecitativos: mediaAnual,
        diferenca: diff,
        resultadoStatus: diff >= 0 ? 'Acima' : 'Abaixo'
      };
    });
  }, [comunsDoAnciao, contagens, recitativos, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#242b3d] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header - Dark Blue like mockup */}
      <div className="bg-[#2a3449] text-white rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden border border-slate-700">
        <div className="flex-1 px-8 py-4 flex items-center border-b md:border-b-0 md:border-r border-slate-600/50 relative overflow-hidden">
          {/* Subtle background pattern/image effect could go here */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1548625361-ec4a572db0f8?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
          
          <h1 className="text-3xl font-bold tracking-tight relative z-10 drop-shadow-md">
            {selectedAnciao ? selectedAnciao.nome : 'Selecione um Ancião'}
          </h1>
        </div>
        
        <div className="px-8 py-4 flex items-center justify-center bg-[#242b3d]">
          <div className="text-center">
            <span className="text-4xl font-bold block leading-none">{comunsDoAnciao.length}</span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-300 mt-1 block">Qtde de Localidade</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ancião:</span>
          <select
            value={selectedAnciaoId}
            onChange={(e) => setSelectedAnciaoId(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a3449] font-medium"
          >
            <option value="">Selecione...</option>
            {anciaos.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Mês:</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a3449] font-medium"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ano:</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a3449] font-medium"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area (Chart + Table) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Chart */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">{selectedMonth ? 'MÉDIA MENSAL' : 'MÉDIA ANUAL DE RECITATIVOS'}</h3>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tableData} margin={{ top: 25, right: 30, left: 0, bottom: 80 }} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis 
                  dataKey="comumNome" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                  interval={0}
                  tickMargin={10}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis hide />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" layout="horizontal" iconType="circle" wrapperStyle={{ top: -10 }} />
                
                <Bar dataKey="totalRecitativos" name="Recitativos" fill="#1890ff" maxBarSize={30}>
                  <LabelList dataKey="totalRecitativos" position="top" fill="#1e293b" fontSize={11} fontWeight="bold" />
                </Bar>
                <Bar dataKey="expectativa" name="Expectativa" fill="#141414" maxBarSize={30}>
                  <LabelList dataKey="expectativa" position="top" fill="#1e293b" fontSize={11} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Table */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <List className="w-5 h-5 mr-2 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wider uppercase">MÉDIA MENSAL</h3>
          </div>

          <div className="overflow-x-auto p-4 bg-slate-50 dark:bg-slate-950/50">
            <table className="w-full text-center text-sm font-medium">
              <thead className="bg-[#6b7280] text-white">
                <tr>
                  <th className="py-2 px-3 border-r border-[#4b5563] text-left">Comum</th>
                  <th className="py-2 px-2 border-r border-[#4b5563]">Mocidade</th>
                  <th className="py-2 px-2 border-r border-[#4b5563]">Expectativa</th>
                  <th className="py-2 px-2 border-r border-[#4b5563]">Total de<br/>Recitativos</th>
                  <th className="py-2 px-2 border-r border-[#4b5563]">Expectativa<br/>x Resultado</th>
                  <th className="py-2 px-2">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-slate-500">Nenhuma congregação encontrada para este Ancião.</td>
                  </tr>
                ) : (
                  tableData.map(row => (
                    <tr key={row.comumNome} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                      <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-left text-slate-900 dark:text-white font-semibold">
                        {row.comumNome}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700">{row.mocidade}</td>
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.expectativa}</td>
                      <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-bold">{row.totalRecitativos}</td>
                      <td className={`py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-bold ${row.diferenca < 0 ? 'text-[#e86f77]' : 'text-[#52c41a]'}`}>
                        {row.diferenca}
                      </td>
                      <td className={`py-2 px-2 font-bold ${row.resultadoStatus === 'Abaixo' ? 'text-[#e86f77]' : 'text-[#52c41a]'}`}>
                        {row.resultadoStatus}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
