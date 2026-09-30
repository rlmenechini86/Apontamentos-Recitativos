import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, Users2, FileText, CheckCircle2, TrendingUp, Printer,
  BarChart as BarChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';
import { ComumCongregacao, Recitativo, ContagemMocidade, Usuario } from '../types';
import { apiGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  comuns: ComumCongregacao[];
  usuarios: Usuario[];
}

export const AcompanhamentoSetorView: React.FC<Props> = ({ comuns: propComuns, usuarios: propUsuarios }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedComumId, setSelectedComumId] = useState<string>('');

  // Data states
  const [recitativos, setRecitativos] = useState<Recitativo[]>([]);
  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [auxiliares, setAuxiliares] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resRecitativos, resContagens, resAuxiliares] = await Promise.all([
          apiGet('/api/recitativos'),
          apiGet('/api/contagens'),
          apiGet('/api/auxiliares')
        ]);
        
        const [jsonRecitativos, jsonContagens, jsonAuxiliares] = await Promise.all([
          resRecitativos.ok ? resRecitativos.json() : { data: [] },
          resContagens.ok ? resContagens.json() : { data: [] },
          resAuxiliares.ok ? resAuxiliares.json() : { data: [] },
        ]);

        setRecitativos(jsonRecitativos.data || []);
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

  const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
  const comuns = propComuns.filter(c => isRestrictedProfile ? c.id === user?.comum_congregacao_id : true);
  const usuarios = propUsuarios;

  // Apply Filters
  const filteredComuns = selectedComumId ? comuns.filter(c => c.id === selectedComumId) : comuns;
  const filteredRecitativos = selectedComumId ? recitativos.filter(r => r.comum_id === selectedComumId) : recitativos;
  const filteredContagens = selectedComumId ? contagens.filter(c => c.comum_id === selectedComumId) : contagens;
  const filteredUsuarios = selectedComumId ? usuarios.filter(u => u.comum_congregacao_id === selectedComumId) : usuarios;

  // Compute Top Cards Data
  const totalLocalidades = filteredComuns.length;
  const totalCJM = filteredUsuarios.filter(u => u.cargo_ministerio?.trim().toUpperCase() === 'CJM').length;
  const totalAuxiliares = auxiliares.length; // Auxiliares may not have comum_congregacao_id in this scope, keeping total
  
  const contagensAno = filteredContagens.filter(c => c.data.startsWith(selectedYear));
  
  // Para Mocidade e Santa Ceia, se houver múltiplos registros no ano, pegar o mais recente de cada congregação antes de somar.
  const getLatestSum = (tipo: string) => {
    const porComum = new Map<string, any>();
    contagensAno.filter(c => c.tipo === tipo).forEach(c => {
      if (!porComum.has(c.comum_id) || new Date(c.data) > new Date(porComum.get(c.comum_id).data)) {
        porComum.set(c.comum_id, c);
      }
    });
    return Array.from(porComum.values()).reduce((acc, curr) => acc + curr.quantidade, 0);
  };

  const totalSantaCeia = getLatestSum('Santa Ceia');
  const totalMocidade = getLatestSum('Mocidade');

  const expectativaAno = Math.round(totalMocidade * 0.70);

  // Helper to calculate averages for a list of recitativos (belonging to a specific month)
  // It groups by comum_id, averages each type (excluding 0), and then sums the averages across all comuns.
  const calculateSetorMonthlyTotals = (recs: Recitativo[]) => {
    const porComum: Record<string, { meninas: number[], meninos: number[], mocas: number[], mocos: number[] }> = {};
    recs.forEach(r => {
      if (!porComum[r.comum_id]) {
        porComum[r.comum_id] = { meninas: [], meninos: [], mocas: [], mocos: [] };
      }
      if (r.meninas > 0) porComum[r.comum_id].meninas.push(r.meninas);
      if (r.meninos > 0) porComum[r.comum_id].meninos.push(r.meninos);
      if (r.mocas > 0) porComum[r.comum_id].mocas.push(r.mocas);
      if (r.mocos > 0) porComum[r.comum_id].mocos.push(r.mocos);
    });

    let sumMeninas = 0, sumMeninos = 0, sumMocas = 0, sumMocos = 0;

    Object.values(porComum).forEach(c => {
      if (c.meninas.length > 0) sumMeninas += Math.round(c.meninas.reduce((a,b) => a+b, 0) / c.meninas.length);
      if (c.meninos.length > 0) sumMeninos += Math.round(c.meninos.reduce((a,b) => a+b, 0) / c.meninos.length);
      if (c.mocas.length > 0) sumMocas += Math.round(c.mocas.reduce((a,b) => a+b, 0) / c.mocas.length);
      if (c.mocos.length > 0) sumMocos += Math.round(c.mocos.reduce((a,b) => a+b, 0) / c.mocos.length);
    });

    return {
      meninas: sumMeninas,
      meninos: sumMeninos,
      mocas: sumMocas,
      mocos: sumMocos,
      subtotal: sumMeninas + sumMeninos + sumMocas + sumMocos
    };
  };

  // Média Anual Data (Gráfico de Linha & Tabela)
  const annualData = useMemo(() => {
    // Agrupa todos os recitativos por Ano -> Mês
    const byYearMonth: Record<string, Record<string, Recitativo[]>> = {};
    
    filteredRecitativos.forEach(r => {
      const [y, m] = r.data.split('-');
      if (!y || !m) return;
      if (!byYearMonth[y]) byYearMonth[y] = {};
      if (!byYearMonth[y][m]) byYearMonth[y][m] = [];
      byYearMonth[y][m].push(r);
    });

    // Calcula total Mocidade por Ano para expectativa
    const mocidadeByYear: Record<string, number> = {};
    filteredContagens.filter(c => c.tipo === 'Mocidade').forEach(c => {
      const y = c.data.split('-')[0];
      if (!mocidadeByYear[y]) mocidadeByYear[y] = 0;
      mocidadeByYear[y] += c.quantidade;
    });

    const result = Object.keys(byYearMonth).sort().map(year => {
      const monthsData = byYearMonth[year];
      const monthKeys = Object.keys(monthsData);
      
      let yearSumMeninas = 0, yearSumMeninos = 0, yearSumMocas = 0, yearSumMocos = 0;

      monthKeys.forEach(m => {
        const monthTotals = calculateSetorMonthlyTotals(monthsData[m]);
        yearSumMeninas += monthTotals.meninas;
        yearSumMeninos += monthTotals.meninos;
        yearSumMocas += monthTotals.mocas;
        yearSumMocos += monthTotals.mocos;
      });

      const activeMonthsCount = monthKeys.length;
      const avgMeninas = activeMonthsCount ? Math.round(yearSumMeninas / activeMonthsCount) : 0;
      const avgMeninos = activeMonthsCount ? Math.round(yearSumMeninos / activeMonthsCount) : 0;
      const avgMocas = activeMonthsCount ? Math.round(yearSumMocas / activeMonthsCount) : 0;
      const avgMocos = activeMonthsCount ? Math.round(yearSumMocos / activeMonthsCount) : 0;
      const avgSubtotal = avgMeninas + avgMeninos + avgMocas + avgMocos;
      
      const exp = Math.round((mocidadeByYear[year] || 0) * 0.70);
      
      return {
        ano: year,
        meninas: avgMeninas,
        meninos: avgMeninos,
        mocas: avgMocas,
        mocos: avgMocos,
        subtotal: avgSubtotal,
        expectativa: exp,
        resultado: avgSubtotal - exp
      };
    });

    return result;
  }, [filteredRecitativos, filteredContagens]);

  // Média Mensal Data (Gráfico de Barras & Tabela)
  const monthlyData = useMemo(() => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const byMonth: Record<string, Recitativo[]> = {};
    
    months.forEach((_, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      byMonth[monthStr] = [];
    });

    filteredRecitativos.forEach(r => {
      const [y, m] = r.data.split('-');
      if (y === selectedYear && byMonth[m]) {
        byMonth[m].push(r);
      }
    });

    return Object.keys(byMonth).sort().map(m => {
      const monthTotals = calculateSetorMonthlyTotals(byMonth[m]);
      return {
        mes: months[parseInt(m) - 1],
        meninas: monthTotals.meninas,
        meninos: monthTotals.meninos,
        mocas: monthTotals.mocas,
        mocos: monthTotals.mocos,
        subtotal: monthTotals.subtotal,
        resultado: monthTotals.subtotal - expectativaAno
      };
    });
  }, [filteredRecitativos, selectedYear, expectativaAno]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recitativos.forEach(r => {
      if (r.data) years.add(r.data.split('-')[0]);
    });
    contagens.forEach(c => {
      if (c.data) years.add(c.data.split('-')[0]);
    });
    const currentYearStr = new Date().getFullYear().toString();
    years.add(currentYearStr);
    return Array.from(years).sort().reverse();
  }, [recitativos, contagens]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 print:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl print:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <TrendingUp className="w-7 h-7 print:w-4 print:h-4 mr-3 text-emerald-600 dark:text-emerald-400" />
            Acompanhamento de Recitativos - {selectedComumId ? comuns.find(c => c.id === selectedComumId)?.nome || 'Setor' : 'Setor'}
          </h1>
          <p className="text-sm print:text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Métricas, acompanhamento anual e mensal de expectativas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <select
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold print:hidden"
          >
            <option value="">Todas as Congregações (Setor)</option>
            {comuns.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold print:hidden"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors print:hidden"
          >
            <Printer className="w-5 h-5" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 print:grid-cols-6 gap-4 print:gap-1">
        <div className="bg-slate-700 text-white rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{totalLocalidades.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
            Localidade
          </div>
        </div>
        
        <div className="bg-slate-600 text-white rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{totalSantaCeia.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
            Santa Ceia
          </div>
        </div>

        <div className="bg-slate-500 text-white rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{totalCJM.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
            CJM
          </div>
        </div>

        <div className="bg-slate-400 text-white rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{totalAuxiliares.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
            Auxiliares
          </div>
        </div>

        <div className="bg-slate-400 text-white rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{totalMocidade.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider">
            Mocidade
          </div>
        </div>

        <div className="bg-slate-300 text-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col print:break-inside-avoid">
          <div className="p-4 print:p-1 flex-1 flex flex-col justify-center items-center text-center">
            <span className="text-3xl print:text-xl font-bold">{expectativaAno.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-slate-800 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
            Expectativa - {selectedYear}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
        {/* Média Anual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col print:break-inside-avoid">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center">
            <LineChartIcon className="w-5 h-5 mr-2 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wider">MÉDIA ANUAL DE RECITATIVOS</h3>
          </div>
          
          <div className="p-4 print:p-1 bg-slate-50 dark:bg-slate-950/50">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={annualData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="ano" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [Number(value).toLocaleString('pt-BR'), 'Média Anual']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="subtotal" 
                    stroke="#0ea5e9" 
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 0 }} 
                    activeDot={{ r: 8 }}
                    label={{ position: 'top', fill: '#1e293b', fontSize: 12, fontWeight: 'bold', formatter: (val: any) => Number(val).toLocaleString('pt-BR') }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-center text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-600 text-white">
                <tr>
                   <th className="py-2 px-2 border-r border-slate-500">Ano</th>
                  <th className="py-2 px-2 border-r border-slate-500">Meninas</th>
                  <th className="py-2 px-2 border-r border-slate-500">Meninos</th>
                  <th className="py-2 px-2 border-r border-slate-500">Moças</th>
                  <th className="py-2 px-2 border-r border-slate-500">Moços</th>
                  <th className="py-2 px-2 border-r border-slate-500 font-bold">Subtotal</th>
                  <th className="py-2 px-2 border-r border-slate-500 font-bold">Expectativa</th>
                  <th className="py-2 px-2 font-bold">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {annualData.map((row) => (
                  <tr key={row.ano} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-semibold">{row.ano}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold">{row.subtotal.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-500">{row.expectativa.toLocaleString('pt-BR')}</td>
                    <td className={`py-2 px-2 font-bold ${row.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.resultado.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {annualData.length === 0 && (
                  <tr><td colSpan={8} className="py-8 print:py-2 text-slate-500">Nenhum dado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Média Mensal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col print:break-inside-avoid">
          <div className="bg-slate-800 text-white px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-sky-400" />
              <h3 className="font-bold text-sm tracking-wider">MÉDIA MENSAL DE RECITATIVOS</h3>
            </div>
          </div>
          
          <div className="p-4 print:p-1 bg-slate-50 dark:bg-slate-950/50">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 25, right: 0, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, angle: -45, textAnchor: 'end' }} />
                  <YAxis hide />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="subtotal" 
                    fill="#0ea5e9" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30} 
                    label={{ position: 'top', fill: '#1e293b', fontSize: 12, fontWeight: 'bold', formatter: (val: any) => val > 0 ? Number(val).toLocaleString('pt-BR') : '' }}
                  />
                  <ReferenceLine 
                    y={expectativaAno} 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                    strokeWidth={2}
                    label={{ position: 'top', value: 'Expectativa', fill: '#10b981', fontSize: 12, fontWeight: 'bold' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-center text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-600 text-white">
                <tr>
                  <th className="py-2 px-2 border-r border-slate-500">Mês</th>
                  <th className="py-2 px-2 border-r border-slate-500">Meninas</th>
                  <th className="py-2 px-2 border-r border-slate-500">Meninos</th>
                  <th className="py-2 px-2 border-r border-slate-500">Moças</th>
                  <th className="py-2 px-2 border-r border-slate-500">Moços</th>
                  <th className="py-2 px-2 border-r border-slate-500 font-bold">Subtotal</th>
                  <th className="py-2 px-2 font-bold">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {monthlyData.map((row) => (
                  <tr key={row.mes} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-semibold">{row.mes}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold">{row.subtotal.toLocaleString('pt-BR')}</td>
                    <td className={`py-2 px-2 font-bold ${row.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.resultado.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {monthlyData.length === 0 && (
                  <tr><td colSpan={7} className="py-8 print:py-2 text-slate-500">Nenhum dado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
