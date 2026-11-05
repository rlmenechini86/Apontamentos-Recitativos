import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, ClipboardCheck, Calendar, Search, CheckCircle2,
  AlertCircle, AlertTriangle, Clock, Sparkles, Filter,
  Printer, RefreshCw, Users, ShieldCheck, ArrowRight, Eye, EyeOff,
  X, History, Layers
} from 'lucide-react';
import { ComumCongregacao, Recitativo, ContagemMocidade, Usuario, Setor } from '../types';
import { apiGet, clearApiCache } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { NavRoute } from './Sidebar';
import { RecitativoFormModal, RecitativoInitialParams } from './RecitativosView';
import { getUserScope, isItemInUserSector } from '../utils/permissions';

interface ControleApontamentosViewProps {
  usuarios?: Usuario[];
  comuns?: ComumCongregacao[];
  setores?: Setor[];
  recitativos?: Recitativo[];
  contagens?: ContagemMocidade[];
  onRecitativoSaved?: (saved: Recitativo) => void;
  onNavigate?: (route: NavRoute, params?: { date?: string; comumId?: string }) => void;
  initialParams?: RecitativoInitialParams | null;
  onClearInitialParams?: () => void;
}

export const ControleApontamentosView: React.FC<ControleApontamentosViewProps> = ({
  usuarios = [],
  comuns: propComuns,
  setores: propSetores,
  recitativos: propRecitativos,
  contagens: propContagens,
  onRecitativoSaved,
  onNavigate,
  initialParams,
  onClearInitialParams
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!propRecitativos || propRecitativos.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [selectedSetorId, setSelectedSetorId] = useState<string>('');

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  // Default to current month (01 to 12)
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'completos'>('todos');

  const [comuns, setComuns] = useState<ComumCongregacao[]>(propComuns || []);
  const [recitativos, setRecitativos] = useState<Recitativo[]>(propRecitativos || []);
  const [contagens, setContagens] = useState<ContagemMocidade[]>(propContagens || []);

  useEffect(() => {
    if (propRecitativos) setRecitativos(propRecitativos);
  }, [propRecitativos]);

  useEffect(() => {
    if (propContagens) setContagens(propContagens);
  }, [propContagens]);

  useEffect(() => {
    if (propComuns) setComuns(propComuns.filter(c => c.ativo));
  }, [propComuns]);

  // Modal de Lançamento Direto na Tela
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalParams, setModalParams] = useState<RecitativoInitialParams | null>(null);
  const [editingRecitativo, setEditingRecitativo] = useState<Recitativo | null>(null);

  // Opção de Mostrar / Ocultar Total Lançado
  const [showTotals, setShowTotals] = useState<boolean>(() => {
    const saved = localStorage.getItem('controle_apontamentos_show_totals');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('controle_apontamentos_show_totals', String(showTotals));
  }, [showTotals]);

  // Modal de Histórico e Logs de Apontamentos
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState('');

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await apiGet('/api/recitativos/logs');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isLogsModalOpen) {
      fetchLogs();
    }
  }, [isLogsModalOpen]);

  const filteredLogs = useMemo(() => {
    if (!searchLogs.trim()) return logs;
    const q = searchLogs.toLowerCase().trim();
    return logs.filter(log => {
      let parsed: any = {};
      try {
        parsed = typeof log.detalhes === 'string' ? JSON.parse(log.detalhes) : (log.detalhes || {});
      } catch {
        parsed = { descricao: log.detalhes };
      }
      return (
        log.usuario_email?.toLowerCase().includes(q) ||
        parsed.nome_usuario?.toLowerCase().includes(q) ||
        parsed.comum_nome?.toLowerCase().includes(q) ||
        parsed.data_apontamento?.includes(q) ||
        log.created_at?.includes(q)
      );
    });
  }, [logs, searchLogs]);


  // RBAC permissions & scope check
  const userScope = useMemo(() => getUserScope(user, comuns, setores), [user, comuns, setores]);
  const isRestrictedProfile = userScope.isComum;
  const userComumId = userScope.userComumId;

  // Se o usuário for Administrador (Setor), fixa a seleção no seu setor
  useEffect(() => {
    if (userScope.isSetor && userScope.userSetorId) {
      setSelectedSetorId(userScope.userSetorId);
    }
  }, [userScope.isSetor, userScope.userSetorId]);

  // Se vier com parâmetros iniciais de lançamento (ex: do Dashboard), abre o modal diretamente
  useEffect(() => {
    if (initialParams && (initialParams.date || initialParams.comumId)) {
      setModalParams(initialParams);
      if (initialParams.date && initialParams.comumId) {
        const found = recitativos.find(r =>
          (r.data ? r.data.split('T')[0] : '') === initialParams.date &&
          r.comum_id === initialParams.comumId
        );
        setEditingRecitativo(found || null);
      } else {
        setEditingRecitativo(null);
      }
      setIsModalOpen(true);
      if (initialParams.date) {
        const parts = initialParams.date.split('-');
        if (parts[0]) setSelectedYear(parts[0]);
        if (parts[1]) setSelectedMonth(parts[1]);
      }
    }
  }, [initialParams, recitativos]);

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

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [resComuns, resRecitativos, resContagens] = await Promise.all([
        apiGet('/api/comuns', isManualRefresh),
        apiGet('/api/recitativos', isManualRefresh),
        apiGet('/api/contagens', isManualRefresh)
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!propRecitativos || propRecitativos.length === 0) {
      fetchData();
    }
  }, []);

  // Anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recitativos.forEach(r => {
      if (r.data) years.add(r.data.split('-')[0]);
    });
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
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedYear, selectedMonth]);

  // Hoje em formato YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Helper de busca inteligente de recitativo daquela semana
  const getRecitativoForSunday = (comumId: string, sundayStr: string): Recitativo | undefined => {
    const exact = recitativos.find(r => r.comum_id === comumId && r.data === sundayStr);
    if (exact) return exact;

    return recitativos.find(r => {
      if (r.comum_id !== comumId) return false;
      const [ry, rm, rd] = r.data.split('-').map(Number);
      const [sy, sm, sd] = sundayStr.split('-').map(Number);
      const recDate = new Date(ry, rm - 1, rd);
      const sunDate = new Date(sy, sm - 1, sd);
      const diffDays = Math.round((recDate.getTime() - sunDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 6;
    });
  };

  // Helper de busca de Santa Ceia daquela semana
  const getSantaCeiaForSunday = (comumId: string, sundayStr: string): ContagemMocidade | undefined => {
    const exact = contagens.find(c => c.comum_id === comumId && c.data === sundayStr && c.tipo === 'Santa Ceia');
    if (exact) return exact;

    return contagens.find(c => {
      if (c.comum_id !== comumId || c.tipo !== 'Santa Ceia') return false;
      const [cy, cm, cd] = c.data.split('-').map(Number);
      const [sy, sm, sd] = sundayStr.split('-').map(Number);
      const contDate = new Date(cy, cm - 1, cd);
      const sunDate = new Date(sy, sm - 1, sd);
      const diffDays = Math.round((contDate.getTime() - sunDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 6;
    });
  };

  // Avaliação de status de cada domingo para uma congregação
  const evaluateSundayStatus = (comumId: string, sundayStr: string) => {
    const recitativo = getRecitativoForSunday(comumId, sundayStr);
    const santaCeia = getSantaCeiaForSunday(comumId, sundayStr);
    const isFuture = sundayStr > todayStr;

    if (recitativo) {
      const total = (recitativo.mocos || 0) + (recitativo.mocas || 0) + (recitativo.meninos || 0) + (recitativo.meninas || 0);
      if (total === 0) {
        return { type: 'especial', label: 'Zerado', recitativo, total: 0 };
      }
      return { type: 'realizado', label: 'Realizado', recitativo, total };
    }

    if (santaCeia) {
      return { type: 'santaceia', label: 'Suspensa', santaCeia, total: 0 };
    }

    if (isFuture) {
      return { type: 'aguardando', label: 'Aguardando', total: 0 };
    }

    return { type: 'falta', label: 'Pendente', total: 0 };
  };

  // Filtro de Comuns
  const filteredComuns = useMemo(() => {
    return comuns.filter(c => {
      if (userScope.isComum && userComumId) {
        if (c.id !== userComumId) return false;
      }

      if (userScope.isSetor && !isItemInUserSector(userScope, c, comuns, setores)) {
        return false;
      }

      const matchesSetor = !selectedSetorId || (() => {
        const selectedSetor = setores.find(s => s.id === selectedSetorId);
        return c.setor_id === selectedSetorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome);
      })();

      const matchesSearch = !searchTerm || c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (c.codigo && c.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSecretario = !selectedSecretarioId || c.secretario_id === selectedSecretarioId;
      if (!matchesSearch || !matchesSecretario || !matchesSetor) return false;

      // Filtro por status
      if (statusFilter !== 'todos') {
        const pastSundays = sundays.filter(s => s <= todayStr);
        const hasPending = pastSundays.some(s => {
          const st = evaluateSundayStatus(c.id, s);
          return st.type === 'falta';
        });

        if (statusFilter === 'pendentes' && !hasPending) return false;
        if (statusFilter === 'completos' && hasPending) return false;
      }

      return true;
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [comuns, isRestrictedProfile, userComumId, selectedSetorId, setores, searchTerm, selectedSecretarioId, statusFilter, sundays, todayStr, recitativos, contagens]);

  // Estatísticas gerais para os KPI Cards
  const stats = useMemo(() => {
    const pastSundays = sundays.filter(s => s <= todayStr);
    let totalEsperado = 0;
    let totalRealizado = 0;
    let totalSantaCeia = 0;
    let totalFaltas = 0;
    let totalRecitadosNoMes = 0;
    let totalMocos = 0;
    let totalMocas = 0;
    let totalCriancas = 0;

    let comunsComPendencia = 0;
    let comunsCompletas = 0;

    filteredComuns.forEach(comum => {
      let comumTemFalta = false;

      pastSundays.forEach(sunday => {
        totalEsperado++;
        const st = evaluateSundayStatus(comum.id, sunday);
        if (st.type === 'realizado') {
          totalRealizado++;
          if (st.recitativo) {
            totalRecitadosNoMes += st.total;
            totalMocos += (st.recitativo.mocos || 0);
            totalMocas += (st.recitativo.mocas || 0);
            totalCriancas += ((st.recitativo.meninos || 0) + (st.recitativo.meninas || 0));
          }
        } else if (st.type === 'santaceia' || st.type === 'especial') {
          totalSantaCeia++;
        } else if (st.type === 'falta') {
          totalFaltas++;
          comumTemFalta = true;
        }
      });

      if (pastSundays.length > 0) {
        if (comumTemFalta) comunsComPendencia++;
        else comunsCompletas++;
      }
    });

    const conformidadeRate = totalEsperado > 0
      ? Math.round(((totalRealizado + totalSantaCeia) / totalEsperado) * 100)
      : 100;

    return {
      totalEsperado,
      totalRealizado,
      totalSantaCeia,
      totalFaltas,
      conformidadeRate,
      totalRecitadosNoMes,
      totalMocos,
      totalMocas,
      totalCriancas,
      comunsComPendencia,
      comunsCompletas,
      pastSundaysCount: pastSundays.length
    };
  }, [filteredComuns, sundays, todayStr, recitativos, contagens]);

  // Formata data de YYYY-MM-DD para DD/MM/YYYY
  const formatHeaderDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return { day: d, month: m, year: y, full: `${d}/${m}/${y}` };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-80 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Carregando matriz de apontamentos...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-3 sm:space-y-6 animate-in fade-in duration-300 pb-6 sm:pb-12">

      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 sm:gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ClipboardCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Controle de Apontamentos
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Matriz Semanal
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acompanhamento dinâmico do preenchimento semanal de recitativos por domingo para cada congregação.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-end">
          {/* Botão Mostrar / Ocultar Total Lançado */}
          <button
            onClick={() => setShowTotals(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl border transition text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs ${showTotals
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            title={showTotals ? "Ocultar quantidade de recitativos lançados" : "Mostrar quantidade de recitativos lançados"}
          >
            {showTotals ? (
              <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{showTotals ? 'Ocultar Totais' : 'Mostrar Totais'}</span>
          </button>

          <button
            onClick={() => setIsLogsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Visualizar histórico e logs de apontamentos"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Logs de Apontamentos</span>
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Atualizar dados do servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Imprimir visualização"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Card 1: Taxa de Conformidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conformidade no Mês
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                {stats.conformidadeRate}%
              </span>
              <span className="text-xs text-slate-500">
                ({stats.totalRealizado + stats.totalSantaCeia}/{stats.totalEsperado} reuniões)
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${stats.conformidadeRate >= 90 ? 'bg-emerald-500' : stats.conformidadeRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                style={{ width: `${stats.conformidadeRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Congregações Monitoradas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Congregações Ativas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/60">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {filteredComuns.length}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedSetorId ? (setores.find(s => s.id === selectedSetorId)?.nome || 'Setor filtrado') : 'Todos os setores'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Recitados no Mês */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total de Recitados
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800/60">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              {showTotals ? stats.totalRecitadosNoMes.toLocaleString('pt-BR') : '••••'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title={`${stats.totalMocos} moços, ${stats.totalMocas} moças, ${stats.totalCriancas} crianças`}>
              {showTotals ? `${stats.totalMocos}M • ${stats.totalMocas}F • ${stats.totalCriancas} Crianças` : 'Totais ocultados'}
            </p>
          </div>
        </div>

        {/* Card 4: Apontamentos Pendentes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pendências no Mês
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stats.totalFaltas > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
              }`}>
              {stats.totalFaltas > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-black ${stats.totalFaltas > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats.totalFaltas}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${stats.totalFaltas > 0
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}>
                {stats.totalFaltas > 0 ? 'Atenção' : '100% em dia'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stats.comunsComPendencia > 0
                ? `${stats.comunsComPendencia} congregações c/ faltas`
                : 'Nenhuma pendência pendente'}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Status Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs space-y-2 sm:space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

          {/* Busca por comum */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar comum ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Setor */}
            {userScope.isGlobal ? (
              <select
                value={selectedSetorId}
                onChange={(e) => setSelectedSetorId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Setor (Todos)</option>
                {setores.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            ) : userScope.isSetor ? (
              <div className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center space-x-1.5 shadow-xs">
                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{userScope.userSetorNome || 'Seu Setor'}</span>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{comuns.find(c => c.id === userComumId)?.nome || 'Sua Comum'}</span>
              </div>
            )}

            {/* Mês */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Ano */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Secretário */}
            <select
              value={selectedSecretarioId}
              onChange={(e) => setSelectedSecretarioId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[180px] truncate"
            >
              <option value="">Secretário (Todos)</option>
              {usuarios
                .filter(u => u.cargo_ministerio === 'Secretário / CJM' && u.ativo)
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.nome_completo}</option>
                ))}
            </select>

            {/* Limpar Filtros */}
            {((!userScope.isSetor && selectedSetorId) || searchTerm || selectedSecretarioId || statusFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSelectedSetorId(userScope.isSetor && userScope.userSetorId ? userScope.userSetorId : '');
                  setSearchTerm('');
                  setSelectedSecretarioId('');
                  setStatusFilter('todos');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition whitespace-nowrap"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs & Legenda Integrada */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === 'todos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              Todas ({filteredComuns.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${statusFilter === 'pendentes'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
            >
              <span>Com Pendência</span>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
            <button
              onClick={() => setStatusFilter('completos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${statusFilter === 'completos'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
            >
              <span>100% Conforme</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          </div>

          {/* Legenda Moderna */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Realizado</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Falta / Pendente</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Suspensa</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Aguardando (Futuro)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Matriz Moderna */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">

            {/* Cabeçalho da Tabela */}
            <thead className="bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                {/* Coluna Comum Fixa */}
                <th className="py-2.5 sm:py-4 px-2.5 sm:px-5 font-extrabold text-slate-900 dark:text-slate-100 min-w-[130px] sm:min-w-[180px] md:min-w-[220px] sticky left-0 z-20 bg-slate-100/95 dark:bg-slate-950/95 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)]">
                  Comum
                </th>

                {/* Colunas de Domingos */}
                {sundays.map((sunday) => {
                  const dObj = formatHeaderDate(sunday);
                  const isPast = sunday <= todayStr;
                  return (
                    <th key={sunday} className="py-2 sm:py-3 px-1 sm:px-2.5 text-center min-w-[75px] sm:min-w-[105px] md:min-w-[125px] border-l border-slate-200/80 dark:border-slate-800">
                      <div className="flex flex-col items-center justify-center space-y-0.5 sm:space-y-1">
                        <div className={`px-1.5 sm:px-2.5 py-0.5 rounded-md font-extrabold text-[10px] sm:text-xs inline-flex items-center space-x-1 ${isPast
                            ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                          }`}>
                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>DOM {dObj.day}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 lowercase">
                          {dObj.full}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Coluna Desempenho / Resumo */}
                <th className="py-2 sm:py-4 px-1.5 sm:px-3 text-center min-w-[65px] sm:min-w-[95px] border-l border-slate-200/80 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-100">
                  <span className="hidden sm:inline">Conformidade</span>
                  <span className="sm:hidden">Conf.</span>
                </th>
              </tr>
            </thead>

            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {filteredComuns.length === 0 ? (
                <tr>
                  <td colSpan={sundays.length + 2} className="py-16 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nenhuma congregação encontrada para os filtros selecionados.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tente alterar os filtros de setor ou o termo de busca.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComuns.map((comum) => {
                  // Calcula conformidade da congregação no mês
                  const pastSundays = sundays.filter(s => s <= todayStr);
                  let realizadosComum = 0;
                  let totalEsperadosComum = pastSundays.length;

                  pastSundays.forEach(s => {
                    const st = evaluateSundayStatus(comum.id, s);
                    if (st.type === 'realizado' || st.type === 'santaceia' || st.type === 'especial') {
                      realizadosComum++;
                    }
                  });

                  const pctComum = totalEsperadosComum > 0
                    ? Math.round((realizadosComum / totalEsperadosComum) * 100)
                    : 100;

                  const responsavel = usuarios.find(u =>
                    u.id === comum.secretario_id ||
                    (u.comum_congregacao_id === comum.id && (u.cargo_ministerio?.toLowerCase().includes('cjm') || u.cargo_ministerio?.toLowerCase().includes('secretário')))
                  );

                  return (
                    <tr
                      key={comum.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Coluna Comum Fixa */}
                      <td className="py-2 sm:py-3 px-2 sm:px-5 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)] transition-colors">
                        <div className="flex flex-col max-w-[130px] sm:max-w-[190px]">
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate" title={comum.nome}>
                              {comum.nome}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5 sm:mt-1">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {comum.setor_pertencente || 'Sem setor'}
                            </span>
                            {comum.codigo && (
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded flex-shrink-0">
                                {comum.codigo}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Células de Cada Domingo */}
                      {sundays.map((sunday) => {
                        const status = evaluateSundayStatus(comum.id, sunday);

                        // 1. REALIZADO COM DADOS
                        if (status.type === 'realizado') {
                          const r = status.recitativo;
                          return (
                            <td
                              key={sunday}
                              className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 text-center border-l border-slate-200/60 dark:border-slate-800/60"
                            >
                              <div
                                onClick={() => {
                                  if (r) {
                                    setEditingRecitativo(r);
                                    setModalParams(null);
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="inline-flex flex-col items-center justify-center px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 shadow-2xs hover:bg-emerald-100 hover:border-emerald-400 dark:hover:bg-emerald-900/60 transition cursor-pointer group/cell w-full"
                                title={r ? `Apontamento Realizado!\n• Total: ${status.total}\n• Moços: ${r.mocos} | Moças: ${r.mocas}\n• Meninos: ${r.meninos} | Meninas: ${r.meninas}\n• Data: ${r.data}\n\nClique para visualizar ou editar.` : 'Apontamento Realizado (Clique para abrir)'}
                              >
                                <div className="flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                  {showTotals ? (
                                    <span className="font-extrabold text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300">
                                      {status.total}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300">
                                      Realizado
                                    </span>
                                  )}
                                </div>
                                {showTotals && (
                                  <span className="hidden sm:inline text-[9px] sm:text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium leading-none mt-0.5 group-hover/cell:underline">
                                    recitativos
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // 2. REUNIÃO SUSPENSA
                        if (status.type === 'santaceia' || status.type === 'especial') {
                          return (
                            <td
                              key={sunday}
                              className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 text-center border-l border-slate-200/60 dark:border-slate-800/60"
                            >
                              <div
                                className="inline-flex flex-col items-center justify-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/70 text-sky-800 dark:text-sky-200 shadow-2xs w-full"
                                title="Reunião Suspensa para esta congregação (Ex: Santa Ceia)"
                              >
                                <div className="flex items-center space-x-1">
                                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                                  <span className="font-bold text-[10px] sm:text-[11px] text-sky-700 dark:text-sky-300">
                                    Suspensa
                                  </span>
                                </div>
                                <span className="hidden sm:inline text-[9px] text-sky-600/80 dark:text-sky-400/80 font-medium leading-none mt-0.5">
                                  dispensada
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // 3. FALTA / PENDÊNCIA
                        if (status.type === 'falta') {
                          return (
                            <td
                              key={sunday}
                              className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 text-center border-l border-slate-200/60 dark:border-slate-800/60"
                            >
                              <div
                                onClick={() => {
                                  setEditingRecitativo(null);
                                  setModalParams({ date: sunday, comumId: comum.id });
                                  setIsModalOpen(true);
                                }}
                                className="inline-flex flex-col items-center justify-center px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-200 shadow-2xs hover:bg-rose-100 hover:border-rose-400 dark:hover:bg-rose-900/60 transition cursor-pointer group/cell w-full"
                                title={`Clique para lançar o apontamento de ${formatHeaderDate(sunday).full}`}
                              >
                                <div className="flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                  <span className="font-bold text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300">
                                    Pendente
                                  </span>
                                </div>
                                <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold group-hover/cell:underline leading-none mt-0.5">
                                  + Lançar
                                </span>
                              </div>
                            </td>
                          );
                        }

                        // 4. AGUARDANDO (DATA FUTURA)
                        return (
                          <td
                            key={sunday}
                            className="py-1.5 sm:py-2.5 px-1 sm:px-2.5 text-center border-l border-slate-200/60 dark:border-slate-800/60"
                          >
                            <div
                              className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-medium space-x-1 w-full"
                              title="Data futura no calendário mensal"
                            >
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 flex-shrink-0" />
                              <span className="hidden sm:inline">Aguardando</span>
                              <span className="sm:hidden text-[9px]">-</span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Coluna Desempenho / Resumo */}
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center border-l border-slate-200/80 dark:border-slate-800">
                        <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                          <span className={`text-[11px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-full ${pctComum === 100
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : pctComum >= 70
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                            {pctComum}%
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400">
                            {realizadosComum}/{totalEsperadosComum} <span className="hidden sm:inline">domingos</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Rodapé de Totais Semanais */}
            {filteredComuns.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="py-2 sm:py-3 px-2 sm:px-5 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)]">
                    <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-500">
                      Total
                    </span>
                  </td>

                  {sundays.map((sunday) => {
                    let totalRealizados = 0;
                    let totalRecitadosNoDomingo = 0;

                    filteredComuns.forEach(comum => {
                      const st = evaluateSundayStatus(comum.id, sunday);
                      if (st.type === 'realizado') {
                        totalRealizados++;
                        totalRecitadosNoDomingo += st.total;
                      } else if (st.type === 'santaceia' || st.type === 'especial') {
                        totalRealizados++;
                      }
                    });

                    return (
                      <td key={sunday} className="py-2 sm:py-3 px-1 sm:px-3 text-center border-l border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white">
                            {totalRealizados}/{filteredComuns.length}
                          </span>
                          {showTotals && totalRecitadosNoDomingo > 0 && (
                            <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[70px]">
                              {totalRecitadosNoDomingo} <span className="hidden sm:inline">recit.</span>
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center border-l border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {stats.conformidadeRate}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal de Lançamento de Apontamento Direto na Tela de Controle */}
      {isModalOpen && (
        <RecitativoFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalParams(null);
            setEditingRecitativo(null);
            onClearInitialParams?.();
          }}
          initialData={editingRecitativo}
          initialParams={modalParams}
          comuns={comuns}
          setores={setores}
          recitativos={recitativos}
          onSuccess={async (saved) => {
            setIsModalOpen(false);
            setModalParams(null);
            setEditingRecitativo(null);
            onClearInitialParams?.();
            if (saved) {
              setRecitativos(prev => {
                const idx = prev.findIndex(r => r.id === saved.id || (r.data === saved.data && r.comum_id === saved.comum_id));
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = saved;
                  return next;
                }
                return [saved, ...prev];
              });
              onRecitativoSaved?.(saved);
            }
            clearApiCache('/api/recitativos');
            fetchData(true);
          }}
        />
      )}

      {/* Modal de Logs de Apontamentos */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">
                    Trilha de Logs de Apontamentos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Histórico detalhado com data, autor do lançamento e valores inseridos ou alterados.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={loadingLogs}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Recarregar Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogsModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filtro de Logs */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por usuário, congregação ou data..."
                  value={searchLogs}
                  onChange={(e) => setSearchLogs(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total de {filteredLogs.length} registros
              </span>
            </div>

            {/* Lista de Logs */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Carregando histórico de apontamentos...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenhum log de lançamento ou alteração encontrado.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  let parsed: any = {};
                  try {
                    parsed = typeof log.detalhes === 'string' ? JSON.parse(log.detalhes) : (log.detalhes || {});
                  } catch {
                    parsed = { descricao: log.detalhes };
                  }

                  const isCreate = log.acao === 'CREATE';
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-';
                  const userName = parsed.nome_usuario || log.usuario_email || 'Usuário do Sistema';

                  return (
                    <div 
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850/90 shadow-2xs space-y-2.5 transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Top linha do log */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCreate 
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          }`}>
                            {isCreate ? '✓ Lançamento' : '✎ Alteração'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {userName}
                          </span>
                          {log.usuario_email && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              ({log.usuario_email})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Informações de contexto */}
                      <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                        {parsed.comum_nome && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold">{parsed.comum_nome}</span>
                          </div>
                        )}
                        {parsed.data_apontamento && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            <span>Data da Reunião: <strong>{new Date(parsed.data_apontamento + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>
                          </div>
                        )}
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Tabela: {log.tabela_afetada}
                        </span>
                      </div>

                      {/* Detalhes de Valores */}
                      {isCreate && parsed.valores_inseridos && (
                        <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                            Valores Inseridos:
                          </span>
                          <div className="flex flex-wrap gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            {parsed.valores_inseridos.mocos !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                Moços: <strong>{parsed.valores_inseridos.mocos}</strong>
                              </span>
                            )}
                            {parsed.valores_inseridos.mocas !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                Moças: <strong>{parsed.valores_inseridos.mocas}</strong>
                              </span>
                            )}
                            {parsed.valores_inseridos.meninos !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                Meninos: <strong>{parsed.valores_inseridos.meninos}</strong>
                              </span>
                            )}
                            {parsed.valores_inseridos.meninas !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                Meninas: <strong>{parsed.valores_inseridos.meninas}</strong>
                              </span>
                            )}
                            {parsed.valores_inseridos.total !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                                Total: {parsed.valores_inseridos.total}
                              </span>
                            )}
                            {parsed.valores_inseridos.quantidade !== undefined && (
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {parsed.valores_inseridos.tipo || 'Qtd'}: <strong>{parsed.valores_inseridos.quantidade}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!isCreate && (
                        <div className="p-2.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 text-xs space-y-1.5">
                          <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 block">
                            Valores Alterados:
                          </span>
                          {parsed.valores_alterados && Object.keys(parsed.valores_alterados).length > 0 ? (
                            <div className="flex flex-wrap gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              {Object.entries(parsed.valores_alterados).map(([k, diff]: [string, any]) => (
                                <span key={k} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200">
                                  {k}: <span className="line-through text-rose-500 mr-1">{diff.de}</span> ➔ <strong className="text-emerald-600 dark:text-emerald-400 ml-1">{diff.para}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              Registro atualizado (sem alteração nos campos numéricos).
                            </div>
                          )}
                          {parsed.valores_novos && (
                            <div className="flex flex-wrap gap-2 text-slate-600 dark:text-slate-400 font-mono text-[10px] pt-1">
                              <span>Novos valores:</span>
                              {Object.entries(parsed.valores_novos).map(([k, v]) => (
                                <span key={k}>{k}: <strong>{String(v)}</strong></span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsLogsModalOpen(false)}
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
