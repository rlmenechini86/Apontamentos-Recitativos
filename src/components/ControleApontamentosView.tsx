import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, ClipboardCheck, Calendar, Search, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { ComumCongregacao, Recitativo, ContagemMocidade, Usuario } from '../types';
import { apiGet } from '../utils/api';

interface ControleApontamentosViewProps {
  usuarios?: Usuario[];
}

export const ControleApontamentosView: React.FC<ControleApontamentosViewProps> = ({ usuarios = [] }) => {
  const [loading, setLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  // Default to current month (01 to 12)
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');

  const [comuns, setComuns] = useState<ComumCongregacao[]>([]);
  const [recitativos, setRecitativos] = useState<Recitativo[]>([]);
  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resComuns, resRecitativos, resContagens] = await Promise.all([
          apiGet('/api/comuns'),
          apiGet('/api/recitativos'),
          apiGet('/api/contagens')
        ]);
        
        const [jsonComuns, jsonRecitativos, jsonContagens] = await Promise.all([
          resComuns.ok ? resComuns.json() : { data: [] },
          resRecitativos.ok ? resRecitativos.json() : { data: [] },
          resContagens.ok ? resContagens.json() : { data: [] }
        ]);

        // Apenas comuns ativas
        setComuns((jsonComuns.data || []).filter((c: ComumCongregacao) => c.ativo));
        setRecitativos(jsonRecitativos.data || []);
        setContagens(jsonContagens.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados para o controle:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Arrays de filtro
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recitativos.forEach(r => years.add(r.data.split('-')[0]));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [recitativos]);

  const months = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
  ];

  // Calcular todos os domingos do mês/ano selecionado
  const sundays = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1; // 0-indexed
    
    const date = new Date(year, month, 1);
    const days: string[] = [];
    
    while (date.getMonth() === month) {
      if (date.getDay() === 0) { // 0 = Sunday
        // Formata para YYYY-MM-DD localmente sem fuso
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedYear, selectedMonth]);

  const filteredComuns = comuns.filter(c => {
    const matchesSearch = !searchTerm || c.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSecretario = !selectedSecretarioId || c.secretario_id === selectedSecretarioId;
    return matchesSearch && matchesSecretario;
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  // Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
  const formatHeaderDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Analisando apontamentos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <ClipboardCheck className="w-7 h-7 mr-3 text-emerald-600 dark:text-emerald-400" />
            Controle de Apontamentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhamento semanal de preenchimento dos recitativos pelas Comuns Congregações.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar comum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select 
            value={selectedSecretarioId}
            onChange={(e) => setSelectedSecretarioId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
          >
            <option value="">Secretário (Todos)</option>
            {usuarios
              .filter(u => u.cargo_ministerio === 'Secretário / CJM' && u.ativo)
              .map((u) => (
                <option key={u.id} value={u.id}>{u.nome_completo}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Legendas */}
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-sm bg-[#78cc73] border border-[#52c41a]"></div>
          <span className="text-slate-600 dark:text-slate-300">Apontamento Realizado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-sm bg-[#e86f77] border border-[#f5222d]"></div>
          <span className="text-slate-600 dark:text-slate-300">Falta de Apontamento</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-sm bg-[#40a9ff] border border-[#1890ff]"></div>
          <span className="text-slate-600 dark:text-slate-300">Outros (Ex: Santa Ceia)</span>
        </div>
      </div>

      {/* Tabela de Controle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <table className="w-full text-center text-sm">
            <thead className="bg-[#242424] text-white sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 border-r border-[#444] text-left">Comum</th>
                {sundays.map(sunday => (
                  <th key={sunday} className="py-3 px-2 border-r border-[#444] min-w-[100px] whitespace-nowrap">
                    {formatHeaderDate(sunday)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredComuns.length === 0 ? (
                <tr>
                  <td colSpan={sundays.length + 1} className="py-8 text-slate-500">
                    Nenhuma congregação encontrada.
                  </td>
                </tr>
              ) : (
                filteredComuns.map(comum => (
                  <tr key={comum.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900 transition-colors">
                    <td className="py-1 px-4 border-r border-slate-200 dark:border-slate-800 text-left font-bold text-slate-800 dark:text-slate-200 shadow-[inset_-1px_0_0_rgba(0,0,0,0.1)] whitespace-nowrap">
                      {comum.nome}
                    </td>
                    {sundays.map(sunday => {
                      // Procura recitativo daquela comum e domingo
                      const recitativo = recitativos.find(r => r.comum_id === comum.id && r.data === sunday);
                      
                      let bgColor = 'bg-[#e86f77]'; // Vermelho (Falta) por padrão
                      
                      if (recitativo) {
                        // Tem apontamento! Verifica se os valores são todos 0
                        const isZeroed = (recitativo.meninas + recitativo.meninos + recitativo.mocas + recitativo.mocos) === 0;
                        if (isZeroed) {
                          bgColor = 'bg-[#40a9ff]'; // Azul (Zerado / Santa Ceia)
                        } else {
                          bgColor = 'bg-[#78cc73]'; // Verde (OK com dados)
                        }
                      } else {
                        // Verifica santa ceia ou outro evento em contagens se nao tem recitativo como um fallback
                        const isSantaCeia = contagens.some(c => c.comum_id === comum.id && c.data === sunday && c.tipo === 'Santa Ceia');
                        if (isSantaCeia) {
                          bgColor = 'bg-[#40a9ff]'; // Azul
                        }
                      }

                      return (
                        <td 
                          key={sunday} 
                          className={`border-r border-b border-white/20 dark:border-slate-800/20 ${bgColor}`}
                          style={{
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                            minHeight: '32px'
                          }}
                        >
                          <div className="w-full h-8"></div>
                        </td>
                      );
                    })}
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
