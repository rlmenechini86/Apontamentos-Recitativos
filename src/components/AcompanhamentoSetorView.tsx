import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, Users2, FileText, CheckCircle2, TrendingUp, Printer,
  BarChart as BarChartIcon, LineChart as LineChartIcon,
  X, Calendar, Search, ExternalLink, Sparkles, Filter, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';
import { ComumCongregacao, Recitativo, ContagemMocidade, Usuario, Setor } from '../types';
import { apiGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getUserScope, isItemInUserSector } from '../utils/permissions';

type ModalSortField = 'nome' | 'setor' | 'datas' | 'meninas' | 'meninos' | 'mocas' | 'mocos' | 'subtotal' | 'expectativa' | 'resultado' | 'status';
type MonthlySortField = 'mes' | 'meninas' | 'meninos' | 'mocas' | 'mocos' | 'subtotal' | 'resultado';
type AnnualSortField = 'ano' | 'meninas' | 'meninos' | 'mocas' | 'mocos' | 'subtotal' | 'expectativa' | 'resultado';
type SortDirection = 'asc' | 'desc';

interface Props {
  comuns: ComumCongregacao[];
  usuarios: Usuario[];
  setores?: Setor[];
}

export const AcompanhamentoSetorView: React.FC<Props> = ({ comuns: propComuns, usuarios: propUsuarios, setores: propSetores }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [selectedSetorId, setSelectedSetorId] = useState<string>('');
  const [selectedComumId, setSelectedComumId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonthModal, setSelectedMonthModal] = useState<string | null>(null);
  const [modalSearchComum, setModalSearchComum] = useState<string>('');

  // Sorting states
  const [modalSortField, setModalSortField] = useState<ModalSortField>('subtotal');
  const [modalSortDirection, setModalSortDirection] = useState<SortDirection>('desc');

  const [monthlySortField, setMonthlySortField] = useState<MonthlySortField>('mes');
  const [monthlySortDirection, setMonthlySortDirection] = useState<SortDirection>('asc');

  const [annualSortField, setAnnualSortField] = useState<AnnualSortField>('ano');
  const [annualSortDirection, setAnnualSortDirection] = useState<SortDirection>('asc');

  // Data states
  const [recitativos, setRecitativos] = useState<Recitativo[]>([]);
  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [auxiliares, setAuxiliares] = useState<any[]>([]);

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

  const userScope = useMemo(() => getUserScope(user, propComuns, setores), [user, propComuns, setores]);
  const isRestrictedProfile = userScope.isComum;

  // Se o usuário for Administrador (Setor), fixa a seleção no seu setor; se for Comum/CJM, fixa na comum
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

  const comuns = useMemo(() => {
    if (userScope.isComum && userScope.userComumId) {
      return propComuns.filter(c => c.id === userScope.userComumId);
    }
    if (userScope.isSetor) {
      return propComuns.filter(c => isItemInUserSector(userScope, c, propComuns, setores));
    }
    return propComuns;
  }, [propComuns, userScope, setores]);

  const usuarios = propUsuarios;

  // Comuns disponíveis conforme o setor selecionado
  const comunsDoSetor = useMemo(() => {
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c =>
      c.setor_id === selectedSetorId ||
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId]);

  // Apply Filters
  const filteredComuns = useMemo(() => {
    return comuns.filter(c => {
      if (selectedSetorId) {
        const selectedSetor = setores.find(s => s.id === selectedSetorId);
        const matchesSetor = c.setor_id === selectedSetorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome);
        if (!matchesSetor) return false;
      }
      if (selectedComumId) {
        if (c.id !== selectedComumId) return false;
      }
      return true;
    });
  }, [comuns, setores, selectedSetorId, selectedComumId]);

  const filteredComumIds = useMemo(() => new Set(filteredComuns.map(c => c.id)), [filteredComuns]);
  const filteredRecitativos = useMemo(() => recitativos.filter(r => filteredComumIds.has(r.comum_id)), [recitativos, filteredComumIds]);
  const filteredContagens = useMemo(() => contagens.filter(c => filteredComumIds.has(c.comum_id)), [contagens, filteredComumIds]);
  const filteredUsuarios = useMemo(() => usuarios.filter(u => u.comum_congregacao_id && filteredComumIds.has(u.comum_congregacao_id)), [usuarios, filteredComumIds]);
  const filteredAuxiliares = useMemo(() => auxiliares.filter(a => a.comum_id && filteredComumIds.has(a.comum_id)), [auxiliares, filteredComumIds]);

  // Helper para verificar Cargo para Ministério (CJM ou Secretário / CJM)
  const isCjmOrSecretarioCjm = (cargo?: string | null) => {
    if (!cargo) return false;
    const c = cargo.trim().toLowerCase();
    return c === 'cjm' || c === 'secretário / cjm' || c === 'secretario / cjm';
  };

  // Compute Top Cards Data
  const totalLocalidades = filteredComuns.length;
  const totalCJM = filteredUsuarios.filter(u => u.ativo && isCjmOrSecretarioCjm(u.cargo_ministerio)).length;

  const totalAuxiliares = filteredAuxiliares.length;

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
      if (c.meninas.length > 0) sumMeninas += Math.round(c.meninas.reduce((a, b) => a + b, 0) / c.meninas.length);
      if (c.meninos.length > 0) sumMeninos += Math.round(c.meninos.reduce((a, b) => a + b, 0) / c.meninos.length);
      if (c.mocas.length > 0) sumMocas += Math.round(c.mocas.reduce((a, b) => a + b, 0) / c.mocas.length);
      if (c.mocos.length > 0) sumMocos += Math.round(c.mocos.reduce((a, b) => a + b, 0) / c.mocos.length);
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

  // Detalhes da Tabela do Mês Selecionado (ao clicar no gráfico ou tabela)
  const monthDetailData = useMemo(() => {
    if (!selectedMonthModal) return null;
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthIndex = months.indexOf(selectedMonthModal) + 1;
    if (monthIndex <= 0) return null;
    const monthStr = monthIndex.toString().padStart(2, '0');

    // Filtra recitativos pertencentes a este ano e mês específico
    const monthRecs = filteredRecitativos.filter(r => r.data && r.data.startsWith(`${selectedYear}-${monthStr}`));

    // Agrupa por comum_id
    const recsByComum = new Map<string, Recitativo[]>();
    monthRecs.forEach(r => {
      const arr = recsByComum.get(r.comum_id) || [];
      arr.push(r);
      recsByComum.set(r.comum_id, arr);
    });

    const rows = filteredComuns.map(comum => {
      const arr = recsByComum.get(comum.id) || [];
      const hasLancement = arr.length > 0;

      const meninasVal = arr.filter(r => r.meninas > 0);
      const meninosVal = arr.filter(r => r.meninos > 0);
      const mocasVal = arr.filter(r => r.mocas > 0);
      const mocosVal = arr.filter(r => r.mocos > 0);

      const avgMeninas = meninasVal.length ? Math.round(meninasVal.reduce((a, b) => a + b.meninas, 0) / meninasVal.length) : 0;
      const avgMeninos = meninosVal.length ? Math.round(meninosVal.reduce((a, b) => a + b.meninos, 0) / meninosVal.length) : 0;
      const avgMocas = mocasVal.length ? Math.round(mocasVal.reduce((a, b) => a + b.mocas, 0) / mocasVal.length) : 0;
      const avgMocos = mocosVal.length ? Math.round(mocosVal.reduce((a, b) => a + b.mocos, 0) / mocosVal.length) : 0;
      const subtotal = avgMeninas + avgMeninos + avgMocas + avgMocos;

      const datas = arr.map(r => {
        const parts = r.data.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.data;
      }).join(', ');

      const setorNome = comum.setores?.nome || comum.setor_pertencente || setores.find(s => s.id === comum.setor_id)?.nome || '-';

      // 1. Mocidade mais recente da congregação no ano (ou geral se não houver no ano)
      let mocidadeQtd = 0;
      const mocidadeRegs = filteredContagens
        .filter(c => c.comum_id === comum.id && c.tipo === 'Mocidade' && c.data.startsWith(selectedYear))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      if (mocidadeRegs.length > 0) {
        mocidadeQtd = mocidadeRegs[0].quantidade;
      } else {
        const allMocidade = filteredContagens
          .filter(c => c.comum_id === comum.id && c.tipo === 'Mocidade')
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        if (allMocidade.length > 0) {
          mocidadeQtd = allMocidade[0].quantidade;
        }
      }

      // 2. Expectativa da localidade (70% da contagem de Mocidade)
      const expectativaComum = Math.round(mocidadeQtd * 0.70);
      const diffComum = subtotal - expectativaComum;
      const isAcima = diffComum >= 0;

      return {
        id: comum.id,
        codigo: comum.codigo || '-',
        nome: comum.nome,
        setor: setorNome,
        datas,
        qtdLancamentos: arr.length,
        hasLancement,
        meninas: avgMeninas,
        meninos: avgMeninos,
        mocas: avgMocas,
        mocos: avgMocos,
        subtotal,
        mocidade: mocidadeQtd,
        expectativa: expectativaComum,
        diferenca: diffComum,
        isAcima
      };
    }).sort((a, b) => {
      // Ordena: primeiro os que têm lançamento pelo subtotal decrescente, depois os pendentes alfabeticamente
      if (a.hasLancement && !b.hasLancement) return -1;
      if (!a.hasLancement && b.hasLancement) return 1;
      if (a.hasLancement && b.hasLancement) return b.subtotal - a.subtotal;
      return a.nome.localeCompare(b.nome);
    });

    const monthTotals = calculateSetorMonthlyTotals(monthRecs);
    const totalExpSoma = rows.reduce((acc, curr) => acc + curr.expectativa, 0);
    const expectativaTotal = expectativaAno > 0 ? expectativaAno : totalExpSoma;

    return {
      mes: selectedMonthModal,
      ano: selectedYear,
      rows,
      totals: monthTotals,
      expectativaTotal,
      resultado: monthTotals.subtotal - expectativaTotal,
      comunsComLancamento: rows.filter(r => r.hasLancement).length,
      totalComuns: rows.length
    };
  }, [selectedMonthModal, filteredRecitativos, filteredComuns, filteredContagens, selectedYear, expectativaAno, setores]);

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

  const handleModalSort = (field: ModalSortField) => {
    if (modalSortField === field) {
      setModalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setModalSortField(field);
      setModalSortDirection(['nome', 'setor'].includes(field) ? 'asc' : 'desc');
    }
  };

  const handleMonthlySort = (field: MonthlySortField) => {
    if (monthlySortField === field) {
      setMonthlySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMonthlySortField(field);
      setMonthlySortDirection(field === 'mes' ? 'asc' : 'desc');
    }
  };

  const handleAnnualSort = (field: AnnualSortField) => {
    if (annualSortField === field) {
      setAnnualSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setAnnualSortField(field);
      setAnnualSortDirection(field === 'ano' ? 'asc' : 'desc');
    }
  };

  const renderSortIcon = (isActive: boolean, direction: SortDirection) => {
    if (isActive) {
      return direction === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-sky-400 shrink-0 inline ml-1" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-sky-400 shrink-0 inline ml-1" />
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400/50 shrink-0 inline ml-1 opacity-60 group-hover:opacity-100 group-hover:text-white transition" />;
  };

  const sortedAnnualData = useMemo(() => {
    return [...annualData].sort((a, b) => {
      let comp = 0;
      if (annualSortField === 'ano') {
        comp = Number(a.ano) - Number(b.ano);
      } else {
        comp = ((a as any)[annualSortField] || 0) - ((b as any)[annualSortField] || 0);
      }
      return annualSortDirection === 'asc' ? comp : -comp;
    });
  }, [annualData, annualSortField, annualSortDirection]);

  const sortedMonthlyData = useMemo(() => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return [...monthlyData].sort((a, b) => {
      let comp = 0;
      if (monthlySortField === 'mes') {
        comp = months.indexOf(a.mes) - months.indexOf(b.mes);
      } else {
        comp = ((a as any)[monthlySortField] || 0) - ((b as any)[monthlySortField] || 0);
      }
      return monthlySortDirection === 'asc' ? comp : -comp;
    });
  }, [monthlyData, monthlySortField, monthlySortDirection]);

  const filteredAndSortedModalRows = useMemo(() => {
    if (!monthDetailData) return [];
    const search = modalSearchComum.trim().toLowerCase();
    const filtered = monthDetailData.rows.filter(r =>
      !search ||
      r.nome.toLowerCase().includes(search) ||
      r.codigo.toLowerCase().includes(search) ||
      r.setor.toLowerCase().includes(search)
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (modalSortField) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome, 'pt-BR');
          break;
        case 'setor':
          comparison = a.setor.localeCompare(b.setor, 'pt-BR');
          break;
        case 'datas':
          comparison = a.qtdLancamentos - b.qtdLancamentos;
          if (comparison === 0) comparison = a.datas.localeCompare(b.datas, 'pt-BR');
          break;
        case 'meninas':
          comparison = a.meninas - b.meninas;
          break;
        case 'meninos':
          comparison = a.meninos - b.meninos;
          break;
        case 'mocas':
          comparison = a.mocas - b.mocas;
          break;
        case 'mocos':
          comparison = a.mocos - b.mocos;
          break;
        case 'subtotal':
          comparison = a.subtotal - b.subtotal;
          break;
        case 'expectativa':
          comparison = a.expectativa - b.expectativa;
          break;
        case 'resultado':
          comparison = a.diferenca - b.diferenca;
          break;
        case 'status':
          comparison = (a.hasLancement ? a.qtdLancamentos : -1) - (b.hasLancement ? b.qtdLancamentos : -1);
          break;
        default:
          comparison = a.subtotal - b.subtotal;
      }

      if (comparison !== 0) {
        return modalSortDirection === 'asc' ? comparison : -comparison;
      }

      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [monthDetailData, modalSearchComum, modalSortField, modalSortDirection]);

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
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <select
            disabled={userScope.isSetor || userScope.isComum}
            value={selectedSetorId}
            onChange={(e) => {
              setSelectedSetorId(e.target.value);
              setSelectedComumId('');
            }}
            className={`bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold print:hidden ${userScope.isSetor || userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
          >
            {!userScope.isSetor && !userScope.isComum && <option value="">Todos os Setores</option>}
            {(userScope.isSetor || userScope.isComum ? (userScope.userSetor ? [userScope.userSetor] : []) : setores).map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>

          <select
            disabled={userScope.isComum}
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className={`bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold print:hidden ${userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
          >
            {!userScope.isComum && <option value="">{selectedSetorId ? 'Todas as Congregações do Setor' : 'Todas as Congregações'}</option>}
            {comunsDoSetor.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold print:hidden cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {((!userScope.isSetor && selectedSetorId) || selectedComumId) && (
            <button
              onClick={() => {
                setSelectedSetorId(userScope.isSetor && userScope.userSetorId ? userScope.userSetorId : '');
                setSelectedComumId('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition print:hidden"
            >
              Limpar filtros
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors print:hidden cursor-pointer"
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
              <thead className="bg-slate-600 text-white select-none">
                <tr>
                  <th onClick={() => handleAnnualSort('ano')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Ano">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Ano</span>
                      {renderSortIcon(annualSortField === 'ano', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('meninas')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Meninas">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Meninas</span>
                      {renderSortIcon(annualSortField === 'meninas', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('meninos')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Meninos">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Meninos</span>
                      {renderSortIcon(annualSortField === 'meninos', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('mocas')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Moças">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Moças</span>
                      {renderSortIcon(annualSortField === 'mocas', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('mocos')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Moços">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Moços</span>
                      {renderSortIcon(annualSortField === 'mocos', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('subtotal')} className="py-2 px-2 border-r border-slate-500 font-bold cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Subtotal">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Subtotal</span>
                      {renderSortIcon(annualSortField === 'subtotal', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('expectativa')} className="py-2 px-2 border-r border-slate-500 font-bold cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Expectativa">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Expectativa</span>
                      {renderSortIcon(annualSortField === 'expectativa', annualSortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleAnnualSort('resultado')} className="py-2 px-2 font-bold cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Resultado">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Resultado</span>
                      {renderSortIcon(annualSortField === 'resultado', annualSortDirection)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sortedAnnualData.map((row) => (
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
                {sortedAnnualData.length === 0 && (
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
            <span className="text-[10px] sm:text-[11px] font-medium text-sky-300 bg-sky-950/60 border border-sky-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default">
              <Sparkles className="w-3 h-3 text-sky-400" /> Clique no mês para detalhar
            </span>
          </div>

          <div className="p-4 print:p-1 bg-slate-50 dark:bg-slate-950/50">
            <div className="h-56 w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 25, right: 0, left: 0, bottom: 40 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const m = e.activePayload[0].payload.mes;
                      if (m) {
                        setSelectedMonthModal(m);
                        setModalSearchComum('');
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="mes"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, angle: -45, textAnchor: 'end' }}
                  />
                  <YAxis hide />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar
                    dataKey="subtotal"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                    className="hover:opacity-85 transition cursor-pointer"
                    onClick={(entry: any) => {
                      if (entry && entry.mes) {
                        setSelectedMonthModal(entry.mes);
                        setModalSearchComum('');
                      }
                    }}
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
              <thead className="bg-slate-600 text-white select-none">
                <tr>
                  <th onClick={() => handleMonthlySort('mes')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Mês">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Mês</span>
                      {renderSortIcon(monthlySortField === 'mes', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('meninas')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Meninas">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Meninas</span>
                      {renderSortIcon(monthlySortField === 'meninas', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('meninos')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Meninos">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Meninos</span>
                      {renderSortIcon(monthlySortField === 'meninos', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('mocas')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Moças">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Moças</span>
                      {renderSortIcon(monthlySortField === 'mocas', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('mocos')} className="py-2 px-2 border-r border-slate-500 cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Moços">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Moços</span>
                      {renderSortIcon(monthlySortField === 'mocos', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('subtotal')} className="py-2 px-2 border-r border-slate-500 font-bold cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Subtotal">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Subtotal</span>
                      {renderSortIcon(monthlySortField === 'subtotal', monthlySortDirection)}
                    </div>
                  </th>
                  <th onClick={() => handleMonthlySort('resultado')} className="py-2 px-2 font-bold cursor-pointer hover:bg-slate-500 transition group" title="Ordenar por Resultado">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Resultado</span>
                      {renderSortIcon(monthlySortField === 'resultado', monthlySortDirection)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {sortedMonthlyData.map((row) => (
                  <tr
                    key={row.mes}
                    onClick={() => {
                      setSelectedMonthModal(row.mes);
                      setModalSearchComum('');
                    }}
                    className="bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition cursor-pointer group"
                    title={`Clique para abrir a tabela de ${row.mes}`}
                  >
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      <div className="flex items-center justify-center space-x-1">
                        <span>{row.mes}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-500 inline opacity-40 group-hover:opacity-100 transition" />
                      </div>
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.meninos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocas.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{row.mocos.toLocaleString('pt-BR')}</td>
                    <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold text-sky-700 dark:text-sky-300">{row.subtotal.toLocaleString('pt-BR')}</td>
                    <td className={`py-2 px-2 font-bold ${row.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.resultado.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {sortedMonthlyData.length === 0 && (
                  <tr><td colSpan={7} className="py-8 print:py-2 text-slate-500">Nenhum dado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Detalhamento da Tabela do Mês Selecionado */}
      {selectedMonthModal && monthDetailData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMonthModal(null);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
          >
            {/* Cabeçalho Fixo */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <BarChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-lg font-bold flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="truncate">Tabela de Recitativos - {monthDetailData.mes}/{monthDetailData.ano}</span>
                    <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 whitespace-nowrap">
                      {monthDetailData.comunsComLancamento} de {monthDetailData.totalComuns} congregações
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                    {selectedSetorId ? setores.find(s => s.id === selectedSetorId)?.nome : 'Setor: Visão Consolidada de Todas as Congregações'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Imprimir Tabela"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonthModal(null)}
                  className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corpo Rolável em Bloco Único (impede colapso Flexbox da tabela no celular) */}
            <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
              {/* Cards de Resumo do Mês */}
              <div className="p-2.5 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2.5">
                  <div className="bg-white dark:bg-slate-800 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">Meninas</span>
                    <span className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100">{monthDetailData.totals.meninas.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">Meninos</span>
                    <span className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100">{monthDetailData.totals.meninos.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">Moças</span>
                    <span className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100">{monthDetailData.totals.mocas.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">Moços</span>
                    <span className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100">{monthDetailData.totals.mocos.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-sky-50 dark:bg-sky-950/40 p-1.5 sm:p-2.5 rounded-lg border border-sky-200 dark:border-sky-800 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-sky-700 dark:text-sky-300 block truncate">Subtotal</span>
                    <span className="text-xs sm:text-lg font-bold text-sky-800 dark:text-sky-200">{monthDetailData.totals.subtotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center shadow-xs">
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">Expectativa</span>
                    <span className="text-xs sm:text-lg font-bold text-slate-700 dark:text-slate-300">{monthDetailData.expectativaTotal.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={`col-span-2 sm:col-span-1 p-1.5 sm:p-2.5 rounded-lg border text-center shadow-xs ${monthDetailData.resultado >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                    <span className="text-[9px] sm:text-[11px] font-semibold block truncate">Resultado</span>
                    <span className="text-xs sm:text-lg font-bold">{monthDetailData.resultado.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Barra de Pesquisa de Congregação */}
              <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar congregação por nome ou código..."
                    value={modalSearchComum}
                    onChange={(e) => setModalSearchComum(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                    Mostrando {filteredAndSortedModalRows.length} congregações
                  </span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 sm:hidden font-medium">
                    ↔ Arraste a tabela para o lado
                  </span>
                </div>
              </div>

              {/* Tabela Detalhada por Congregação */}
              <div className="w-full overflow-x-auto">
                <table className="min-w-full text-xs text-slate-700 dark:text-slate-300 text-center border-collapse">
                  <thead className="bg-slate-700 text-white select-none">
                    <tr>
                      <th
                        onClick={() => handleModalSort('nome')}
                        className="py-2.5 px-2.5 sm:px-3 text-left border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group sticky left-0 z-10 bg-slate-700"
                        title="Clique para ordenar por Congregação"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span>Congregação</span>
                          {renderSortIcon(modalSortField === 'nome', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('setor')}
                        className="py-2.5 px-2 text-left border-r border-slate-600 hidden md:table-cell cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Setor"
                      >
                        <div className="flex items-center justify-between space-x-1">
                          <span>Setor</span>
                          {renderSortIcon(modalSortField === 'setor', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('datas')}
                        className="py-2.5 px-2 border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group whitespace-nowrap"
                        title="Clique para ordenar por Quantidade de Lançamentos"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Datas</span>
                          {renderSortIcon(modalSortField === 'datas', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('meninas')}
                        className="py-2.5 px-2 border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Meninas"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Meninas</span>
                          {renderSortIcon(modalSortField === 'meninas', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('meninos')}
                        className="py-2.5 px-2 border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Meninos"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Meninos</span>
                          {renderSortIcon(modalSortField === 'meninos', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('mocas')}
                        className="py-2.5 px-2 border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Moças"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Moças</span>
                          {renderSortIcon(modalSortField === 'mocas', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('mocos')}
                        className="py-2.5 px-2 border-r border-slate-600 cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Moços"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Moços</span>
                          {renderSortIcon(modalSortField === 'mocos', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('subtotal')}
                        className="py-2.5 px-2 border-r border-slate-600 font-bold bg-slate-800 cursor-pointer hover:bg-slate-750 transition group"
                        title="Clique para ordenar por Subtotal"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Subtotal</span>
                          {renderSortIcon(modalSortField === 'subtotal', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('expectativa')}
                        className="py-2.5 px-2 border-r border-slate-600 font-bold bg-slate-800 cursor-pointer hover:bg-slate-750 transition group"
                        title="Clique para ordenar por Expectativa"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Expectativa</span>
                          {renderSortIcon(modalSortField === 'expectativa', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('resultado')}
                        className="py-2.5 px-2 border-r border-slate-600 font-bold cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Resultado"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Resultado</span>
                          {renderSortIcon(modalSortField === 'resultado', modalSortDirection)}
                        </div>
                      </th>
                      <th
                        onClick={() => handleModalSort('status')}
                        className="py-2.5 px-2 cursor-pointer hover:bg-slate-600 transition group"
                        title="Clique para ordenar por Status"
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Status</span>
                          {renderSortIcon(modalSortField === 'status', modalSortDirection)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredAndSortedModalRows.map((r) => (
                        <tr key={r.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2 px-2.5 sm:px-3 text-left border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-slate-900">
                            {r.codigo !== '-' && <span className="text-[10px] text-slate-400 font-mono mr-1">{r.codigo}</span>}
                            {r.nome}
                          </td>
                          <td className="py-2 px-2 text-left border-r border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 hidden md:table-cell">
                            {r.setor}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 text-[11px] whitespace-nowrap">
                            {r.datas || <span className="text-slate-400 italic">Sem lançamento</span>}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{r.meninas.toLocaleString('pt-BR')}</td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{r.meninos.toLocaleString('pt-BR')}</td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{r.mocas.toLocaleString('pt-BR')}</td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">{r.mocos.toLocaleString('pt-BR')}</td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold bg-slate-50/70 dark:bg-slate-800/60 text-sky-700 dark:text-sky-300">
                            {r.subtotal.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/30">
                            {r.expectativa > 0 ? r.expectativa.toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800">
                            {r.expectativa > 0 ? (
                              r.isAcima ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs whitespace-nowrap">
                                  ▲ {r.diferenca >= 0 ? `+${r.diferenca}` : r.diferenca} (Acima)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs whitespace-nowrap">
                                  ▼ {r.diferenca} (Abaixo)
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 italic whitespace-nowrap">Sem expectativa</span>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            {r.hasLancement ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                                ✓ Lançado ({r.qtdLancamentos})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {filteredAndSortedModalRows.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                          Nenhuma congregação encontrada com os filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td className="py-2.5 px-2.5 sm:px-3 text-left border-r border-slate-300 dark:border-slate-700 whitespace-nowrap sticky left-0 z-10 bg-slate-100 dark:bg-slate-800">TOTAL DO SETOR (MÉDIA MENSAL)</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 hidden md:table-cell">-</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">-</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">{monthDetailData.totals.meninas.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">{monthDetailData.totals.meninos.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">{monthDetailData.totals.mocas.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">{monthDetailData.totals.mocos.toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50">
                        {monthDetailData.totals.subtotal.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-slate-750">
                        {monthDetailData.expectativaTotal.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-700">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${
                          monthDetailData.resultado >= 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        }`}>
                          {monthDetailData.resultado >= 0 ? `▲ +${monthDetailData.resultado} (Acima)` : `▼ ${monthDetailData.resultado} (Abaixo)`}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {monthDetailData.comunsComLancamento}/{monthDetailData.totalComuns} congregações
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Rodapé Fixo do Modal */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
