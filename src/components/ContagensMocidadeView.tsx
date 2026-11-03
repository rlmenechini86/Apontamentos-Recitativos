import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Search, Plus, Music, RefreshCw, Trash2, Edit2, Calendar, Building2, 
  User, ArrowUpDown, Lock, AlertCircle, CheckCircle2, TrendingUp, 
  Layers, ListFilter, Sparkles, Filter, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { ContagemMocidade, ComumCongregacao, Usuario, Setor, DetalheMusicoFamilia } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './Pagination';
import { apiGet, clearApiCache } from '../utils/api';

export const FAMILIAS_INSTRUMENTOS = [
  'Cordas Friccionadas',
  'Madeiras',
  'Metais',
  'Teclas',
  'Outros'
];

export interface ContagemInitialParams {
  date?: string;
  comumId?: string;
  tipo?: 'Mocidade' | 'Santa Ceia';
}

interface ContagensMocidadeViewProps {
  comuns: ComumCongregacao[];
  usuarios?: Usuario[];
  setores?: Setor[];
  contagens?: ContagemMocidade[];
  onContagemSaved?: (saved: ContagemMocidade) => void;
  initialParams?: ContagemInitialParams | null;
  onClearInitialParams?: () => void;
}

export const ContagensMocidadeView: React.FC<ContagensMocidadeViewProps> = ({ 
  comuns: propComuns, 
  usuarios = [], 
  setores: propSetores,
  contagens: propContagens,
  onContagemSaved,
  initialParams,
  onClearInitialParams
}) => {
  const { user } = useAuth();

  const roleName = (user?.perfis?.nome || '').toLowerCase().trim();
  const isApontamento = roleName.includes('apontamento') || user?.perfis?.nivel_acesso === 'comum';
  const isRestrictedProfile = isApontamento || (roleName !== 'administrador' && user?.perfis?.nivel_acesso !== 'global' && !!user?.comum_congregacao_id);
  const userComumId = user?.comum_congregacao_id || user?.comum_congregacao?.id;

  const [comuns, setComuns] = useState<ComumCongregacao[]>(propComuns ? propComuns.filter(c => c.ativo) : []);
  const [contagens, setContagens] = useState<ContagemMocidade[]>(propContagens || []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);

  // Modos de Exibição: 'anual' (Matriz do Ano) | 'multi-anual' (Histórico Anos) | 'tabela' (Lista Tradicional)
  const [viewMode, setViewMode] = useState<'anual' | 'multi-anual' | 'tabela'>('anual');
  const [multiAnoTipo, setMultiAnoTipo] = useState<'Mocidade' | 'Santa Ceia'>('Mocidade');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContagemMocidade | null>(null);
  const [modalParams, setModalParams] = useState<ContagemInitialParams | null>(null);

  // Paginação da tabela detalhada
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Opção de Mostrar / Ocultar Total Lançado
  const [showTotals, setShowTotals] = useState<boolean>(() => {
    const saved = localStorage.getItem('contagens_mocidade_show_totals') ?? localStorage.getItem('controle_apontamentos_show_totals');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('contagens_mocidade_show_totals', String(showTotals));
  }, [showTotals]);


  useEffect(() => {
    if (propComuns) setComuns(propComuns.filter(c => c.ativo));
  }, [propComuns]);

  useEffect(() => {
    if (propContagens) setContagens(propContagens);
  }, [propContagens]);

  useEffect(() => {
    if (isRestrictedProfile && userComumId) {
      setSelectedComumId(userComumId);
      const userComum = comuns.find(c => c.id === userComumId);
      if (userComum) {
        const userSetor = setores.find(s => s.id === userComum.setor_id || (userComum.setor_pertencente && s.nome === userComum.setor_pertencente));
        if (userSetor) setSelectedSetorId(userSetor.id);
      }
    }
  }, [isRestrictedProfile, userComumId, comuns, setores]);

  useEffect(() => {
    if (initialParams && (initialParams.date || initialParams.comumId || initialParams.tipo)) {
      setModalParams(initialParams);
      if (initialParams.date) {
        const y = initialParams.date.split('-')[0];
        if (y) setSelectedYear(y);
      }
      if (initialParams.comumId && !isRestrictedProfile) {
        setSelectedComumId(initialParams.comumId);
      }
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [initialParams, isRestrictedProfile]);

  useEffect(() => {
    if (propSetores && propSetores.length > 0) {
      setSetores(propSetores);
    } else {
      fetch('/api/comuns/meta/setores')
        .then(res => res.json())
        .then(json => setSetores(json.data || []))
        .catch(console.error);
    }
  }, [propSetores]);

  const fetchContagens = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const res = await apiGet('/api/contagens', isManual);
      if (res.ok) {
        const json = await res.json();
        setContagens(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar contagens:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!propContagens || propContagens.length === 0) {
      fetchContagens();
    }
  }, []);

  // Lista dinâmica de anos disponíveis baseados nas contagens + ano atual e anterior/próximo
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    const currentY = new Date().getFullYear();
    yearsSet.add(currentY.toString());
    yearsSet.add((currentY - 1).toString());
    yearsSet.add((currentY + 1).toString());

    contagens.forEach(c => {
      if (c.data) {
        const y = c.data.split('T')[0].split('-')[0];
        if (y && y.length === 4) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [contagens]);

  // Lista de anos ordenados cronologicamente para a matriz multi-anual
  const multiYearsList = useMemo(() => {
    const yearsSet = new Set<string>();
    contagens.forEach(c => {
      if (c.data) {
        const y = c.data.split('T')[0].split('-')[0];
        if (y && y.length === 4) yearsSet.add(y);
      }
    });
    yearsSet.add(new Date().getFullYear().toString());
    return Array.from(yearsSet).sort((a, b) => Number(a) - Number(b));
  }, [contagens]);

  // Filtragem de Congregações
  const filteredComuns = useMemo(() => {
    return comuns.filter(c => {
      // Perfil restrito
      if (isRestrictedProfile && userComumId && c.id !== userComumId) {
        return false;
      }
      // Filtro Setor
      if (selectedSetorId) {
        const selSetor = setores.find(s => s.id === selectedSetorId);
        const matchSetor = c.setor_id === selectedSetorId || (selSetor && c.setor_pertencente === selSetor.nome);
        if (!matchSetor) return false;
      }
      // Filtro Comum específica
      if (selectedComumId && c.id !== selectedComumId) {
        return false;
      }
      // Filtro Secretário
      if (selectedSecretarioId && c.secretario_id !== selectedSecretarioId) {
        return false;
      }
      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNome = c.nome.toLowerCase().includes(term);
        const matchCodigo = c.codigo?.toLowerCase().includes(term);
        const matchSetorNome = c.setor_pertencente?.toLowerCase().includes(term);
        if (!matchNome && !matchCodigo && !matchSetorNome) return false;
      }
      return true;
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [comuns, isRestrictedProfile, userComumId, selectedSetorId, selectedComumId, selectedSecretarioId, searchTerm, setores]);

  // Lookup helper para obter o autor de um registro
  const getAuthorName = (item: ContagemMocidade | undefined): string => {
    if (!item) return '';
    if (item.usuario?.nome_completo) return item.usuario.nome_completo;
    if (item.cadastrado_por) {
      const u = usuarios.find(usr => usr.id === item.cadastrado_por);
      if (u?.nome_completo) return u.nome_completo;
    }
    return 'Sistema';
  };

  // Mapa rápido de contagens para busca O(1): "comumId_ano_tipo" -> ContagemMocidade
  const contagensMap = useMemo(() => {
    const map = new Map<string, ContagemMocidade>();
    contagens.forEach(c => {
      if (c.data && c.comum_id && c.tipo) {
        const year = c.data.split('T')[0].split('-')[0];
        const key = `${c.comum_id}_${year}_${c.tipo}`;
        map.set(key, c);
      }
    });
    return map;
  }, [contagens]);

  // Estatísticas para o ano selecionado
  const yearStats = useMemo(() => {
    let mocidadeRealizados = 0;
    let mocidadeTotalQtd = 0;
    let santaCeiaRealizados = 0;
    let santaCeiaTotalQtd = 0;
    let comunsCompletas = 0; // tem ambos

    filteredComuns.forEach(comum => {
      const itemMoc = contagensMap.get(`${comum.id}_${selectedYear}_Mocidade`);
      const itemSC = contagensMap.get(`${comum.id}_${selectedYear}_Santa Ceia`);

      if (itemMoc) {
        mocidadeRealizados++;
        mocidadeTotalQtd += itemMoc.quantidade;
      }
      if (itemSC) {
        santaCeiaRealizados++;
        santaCeiaTotalQtd += itemSC.quantidade;
      }
      if (itemMoc && itemSC) {
        comunsCompletas++;
      }
    });

    const totalComuns = filteredComuns.length;
    const totalEsperado = totalComuns * 2;
    const totalRealizado = mocidadeRealizados + santaCeiaRealizados;
    const conformidadeRate = totalEsperado > 0 ? Math.round((totalRealizado / totalEsperado) * 100) : 0;
    const pendentesCount = totalComuns - comunsCompletas;

    return {
      totalComuns,
      mocidadeRealizados,
      mocidadeTotalQtd,
      santaCeiaRealizados,
      santaCeiaTotalQtd,
      totalRealizado,
      totalEsperado,
      conformidadeRate,
      pendentesCount,
      comunsCompletas
    };
  }, [filteredComuns, contagensMap, selectedYear]);

  // Manipulação de cliques em células
  const handleCellClick = (comum: ComumCongregacao, tipo: 'Mocidade' | 'Santa Ceia', year: string) => {
    const existing = contagensMap.get(`${comum.id}_${year}_${tipo}`);
    if (existing) {
      setEditingItem(existing);
      setModalParams(null);
    } else {
      setEditingItem(null);
      setModalParams({
        comumId: comum.id,
        date: `${year}-01-01`,
        tipo: tipo
      });
    }
    setIsModalOpen(true);
  };

  // Filtragem para a tabela tradicional (viewMode === 'tabela')
  const filteredListItems = useMemo(() => {
    return contagens.filter(item => {
      const itemYear = item.data?.split('T')[0]?.split('-')[0];
      if (selectedYear && itemYear !== selectedYear) return false;

      if (isRestrictedProfile && userComumId && item.comum_id !== userComumId) return false;
      if (selectedComumId && item.comum_id !== selectedComumId) return false;

      if (selectedSetorId) {
        const c = comuns.find(x => x.id === item.comum_id);
        const selSetor = setores.find(s => s.id === selectedSetorId);
        if (c && c.setor_id !== selectedSetorId && (!selSetor || c.setor_pertencente !== selSetor.nome)) {
          return false;
        }
      }

      if (selectedSecretarioId && item.cadastrado_por !== selectedSecretarioId) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const comumNome = item.comum_congregacao?.nome?.toLowerCase() || '';
        const userNome = item.usuario?.nome_completo?.toLowerCase() || '';
        if (!comumNome.includes(term) && !userNome.includes(term)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortConfig) {
        if (sortConfig.key === 'data') {
          return sortConfig.direction === 'asc' ? a.data.localeCompare(b.data) : b.data.localeCompare(a.data);
        }
        if (sortConfig.key === 'quantidade') {
          return sortConfig.direction === 'asc' ? a.quantidade - b.quantidade : b.quantidade - a.quantidade;
        }
        if (sortConfig.key === 'tipo') {
          return sortConfig.direction === 'asc' ? a.tipo.localeCompare(b.tipo) : b.tipo.localeCompare(a.tipo);
        }
        if (sortConfig.key === 'comum_congregacao.nome') {
          const nameA = a.comum_congregacao?.nome || '';
          const nameB = b.comum_congregacao?.nome || '';
          return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
      }
      return b.data.localeCompare(a.data);
    });
  }, [contagens, selectedYear, isRestrictedProfile, userComumId, selectedComumId, selectedSetorId, selectedSecretarioId, searchTerm, sortConfig, comuns, setores]);

  const totalPages = Math.ceil(filteredListItems.length / itemsPerPage);
  const paginatedListItems = filteredListItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSaved = (saved?: ContagemMocidade) => {
    if (saved) {
      setContagens(prev => {
        const idx = prev.findIndex(c => c.id === saved.id || (c.data === saved.data && c.comum_id === saved.comum_id && c.tipo === saved.tipo));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      onContagemSaved?.(saved);
    }
    clearApiCache('/api/contagens');
    fetchContagens(true);
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* 1. CABEÇALHO DA TELA & TÍTULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Controle Anual - Mocidade & Santa Ceia
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Acompanhamento e controle dos lançamentos anuais por congregação com identificação do responsável.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Topo */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          {/* Botão Mostrar / Ocultar Total Lançado */}
          <button
            onClick={() => setShowTotals(prev => !prev)}
            className={`px-3.5 py-2.5 rounded-xl border transition text-xs sm:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
              showTotals 
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100' 
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
            title={showTotals ? "Ocultar quantidade total lançada" : "Mostrar quantidade total lançada"}
          >
            {showTotals ? (
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-500" />
            )}
            <span>{showTotals ? 'Ocultar Totais' : 'Mostrar Totais'}</span>
          </button>

          <button
            onClick={() => fetchContagens(true)}
            disabled={loading || refreshing}
            title="Atualizar dados"
            className="p-1.5 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setEditingItem(null);
              setModalParams({
                date: `${selectedYear}-01-01`,
                tipo: 'Mocidade'
              });
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 sm:space-x-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO & CONFORMIDADE ANUAL (ESTILO CONTROLE DE APONTAMENTOS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        {/* Card 1: Total Congregações */}
        <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Congregações</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {yearStats.totalComuns}
            </span>
            <span className="text-[10px] text-slate-400">ativas no filtro</span>
          </div>
        </div>

        {/* Card 2: Conformidade Geral */}
        <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Conformidade {selectedYear}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-base sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {yearStats.conformidadeRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {yearStats.totalRealizado}/{yearStats.totalEsperado}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(yearStats.conformidadeRate, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Card 3: Mocidade */}
        <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Mocidade ({selectedYear})</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
              {showTotals ? yearStats.mocidadeTotalQtd.toLocaleString() : '••••'}
            </span>
            <span className="text-[10px] font-semibold text-blue-600/80 dark:text-blue-400">
              {yearStats.mocidadeRealizados}/{yearStats.totalComuns} comuns
            </span>
          </div>
        </div>

        {/* Card 4: Santa Ceia */}
        <div className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Santa Ceia ({selectedYear})</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-base sm:text-2xl font-black text-amber-800 dark:text-amber-400 font-mono">
              {showTotals ? yearStats.santaCeiaTotalQtd.toLocaleString() : '••••'}
            </span>
            <span className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-400">
              {yearStats.santaCeiaRealizados}/{yearStats.totalComuns} comuns
            </span>
          </div>
        </div>

        {/* Card 5: Pendências */}
        <div className="col-span-2 lg:col-span-1 p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Pendências no Ano</span>
            <AlertCircle className={`w-4 h-4 ${yearStats.pendentesCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-base sm:text-2xl font-black font-mono ${yearStats.pendentesCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {yearStats.pendentesCount}
            </span>
            <span className="text-[10px] text-slate-400">
              {yearStats.comunsCompletas} de {yearStats.totalComuns} 100% ok
            </span>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & SELETOR DE MODOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-4 shadow-xs space-y-2 sm:space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Seletor de Modos (Tabs) */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start overflow-x-auto max-w-full scrollbar-none">
            <button
              onClick={() => setViewMode('anual')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'anual'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Controle Anual</span>
            </button>
            <button
              onClick={() => setViewMode('multi-anual')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'multi-anual'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Histórico Multi-Anual</span>
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lista Detalhada</span>
            </button>
          </div>

          {/* Seletor de Ano em Destaque */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros Secundários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {/* Busca por Congregação */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar congregação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filtro Setor */}
          <div>
            <select
              value={selectedSetorId}
              onChange={(e) => setSelectedSetorId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Todos os Setores --</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Filtro Secretário */}
          <div>
            <select
              value={selectedSecretarioId}
              onChange={(e) => setSelectedSecretarioId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Todos Secretários --</option>
              {usuarios
                .filter(u => u.cargo_ministerio === 'Secretário / CJM' && u.ativo)
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.nome_completo}</option>
                ))}
            </select>
          </div>

          {/* Alternador de Tipo para Matriz Multi-Anual */}
          {viewMode === 'multi-anual' ? (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setMultiAnoTipo('Mocidade')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                  multiAnoTipo === 'Mocidade'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Mocidade
              </button>
              <button
                type="button"
                onClick={() => setMultiAnoTipo('Santa Ceia')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                  multiAnoTipo === 'Santa Ceia'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Santa Ceia
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <span>{filteredComuns.length} congregações</span>
              {(searchTerm || selectedSetorId || selectedSecretarioId) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSetorId('');
                    setSelectedSecretarioId('');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. VISÃO 1: CONTROLE ANUAL (MATRIZ DO ANO SELECIONADO - PADRÃO) */}
      {viewMode === 'anual' && (
        <div className="space-y-4">
          {/* A. VISÃO MOBILE: CARDS DINÂMICOS PARA TELAS PEQUENAS (block md:hidden) */}
          <div className="block md:hidden space-y-2">
            {loading ? (
              <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <span className="text-xs">Carregando congregações...</span>
              </div>
            ) : filteredComuns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhuma congregação encontrada para os filtros aplicados.</p>
              </div>
            ) : (
              filteredComuns.map((comum) => {
                const itemMoc = contagensMap.get(`${comum.id}_${selectedYear}_Mocidade`);
                const itemSC = contagensMap.get(`${comum.id}_${selectedYear}_Santa Ceia`);

                const authorMoc = getAuthorName(itemMoc);
                const authorSC = getAuthorName(itemSC);

                const completedCount = (itemMoc ? 1 : 0) + (itemSC ? 1 : 0);

                return (
                  <div 
                    key={`mobile-comum-${comum.id}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3"
                  >
                    {/* Topo do Card: Nome, Setor e Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                            {comum.nome}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {comum.setor_pertencente || 'Sem setor'}
                          </span>
                          {comum.codigo && (
                            <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded font-semibold">
                              {comum.codigo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badge de Conformidade Anual */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                        completedCount === 2
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : completedCount === 1
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {completedCount === 2 ? '100% OK' : completedCount === 1 ? '50% OK' : 'Pendente'}
                      </span>
                    </div>

                    {/* Blocos de Ação Lado a Lado (Mocidade e Santa Ceia) */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Bloco 1: Mocidade */}
                      {itemMoc ? (
                        <div
                          onClick={() => handleCellClick(comum, 'Mocidade', selectedYear)}
                          className="flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer text-left shadow-2xs group"
                        >
                          <div className="w-full flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider">Mocidade</span>
                            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="w-full flex items-baseline space-x-1">
                            {showTotals ? (
                              <>
                                <span className="text-base font-black text-blue-700 dark:text-blue-300 font-mono">
                                  {itemMoc.quantidade}
                                </span>
                                <span className="text-[9px] text-blue-600/80 dark:text-blue-400 font-semibold">
                                  jovens
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                Realizado
                              </span>
                            )}
                          </div>
                          <div className="w-full flex items-center space-x-1 mt-1 text-[9px] font-medium text-blue-800 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/60 px-1.5 py-0.5 rounded truncate">
                            <User className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{authorMoc}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(comum, 'Mocidade', selectedYear)}
                          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer text-center shadow-2xs group"
                        >
                          <div className="w-full flex items-center justify-between text-rose-700 dark:text-rose-300 mb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider">Mocidade</span>
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                          </div>
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 group-hover:underline">
                            + Lançar
                          </span>
                          <span className="text-[8px] text-rose-500">Pendente {selectedYear}</span>
                        </div>
                      )}

                      {/* Bloco 2: Santa Ceia */}
                      {itemSC ? (
                        <div
                          onClick={() => handleCellClick(comum, 'Santa Ceia', selectedYear)}
                          className="flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer text-left shadow-2xs group"
                        >
                          <div className="w-full flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider">Santa Ceia</span>
                            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="w-full flex items-baseline space-x-1">
                            {showTotals ? (
                              <>
                                <span className="text-base font-black text-amber-800 dark:text-amber-300 font-mono">
                                  {itemSC.quantidade}
                                </span>
                                <span className="text-[9px] text-amber-700/80 dark:text-amber-400 font-semibold">
                                  irmãos
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                Realizado
                              </span>
                            )}
                          </div>
                          <div className="w-full flex items-center space-x-1 mt-1 text-[9px] font-medium text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/60 px-1.5 py-0.5 rounded truncate">
                            <User className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{authorSC}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(comum, 'Santa Ceia', selectedYear)}
                          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer text-center shadow-2xs group"
                        >
                          <div className="w-full flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider">Sta Ceia</span>
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                          </div>
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 group-hover:underline">
                            + Lançar
                          </span>
                          <span className="text-[8px] text-rose-500">Pendente {selectedYear}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* B. VISÃO DESKTOP / TABLET (hidden md:block): TABELA MATRIZ COMPLETA COM COLUNA FIXA */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 min-w-[220px] sticky left-0 z-20 bg-slate-100 dark:bg-slate-950 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)]">
                      Congregação
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center min-w-[200px]">
                      <div className="flex items-center justify-center space-x-1.5 text-blue-700 dark:text-blue-400 font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>Mocidade ({selectedYear})</span>
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center min-w-[200px]">
                      <div className="flex items-center justify-center space-x-1.5 text-amber-700 dark:text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Santa Ceia ({selectedYear})</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center w-36">Status no Ano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                          <span>Carregando dados anuais...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredComuns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-500">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhuma congregação encontrada para os filtros aplicados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredComuns.map((comum) => {
                      const itemMoc = contagensMap.get(`${comum.id}_${selectedYear}_Mocidade`);
                      const itemSC = contagensMap.get(`${comum.id}_${selectedYear}_Santa Ceia`);

                      const authorMoc = getAuthorName(itemMoc);
                      const authorSC = getAuthorName(itemSC);

                      const completedCount = (itemMoc ? 1 : 0) + (itemSC ? 1 : 0);

                      return (
                        <tr key={comum.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition group">
                          {/* Coluna 1: Congregação (Fixa à esquerda) */}
                          <td className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)] transition-colors">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                  {comum.nome}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                  {comum.setor_pertencente || 'Sem setor'}
                                </span>
                                {comum.codigo && (
                                  <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                                    {comum.codigo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Mocidade */}
                          <td className="px-3 sm:px-4 py-2.5 text-center">
                            {itemMoc ? (
                              <div
                                onClick={() => handleCellClick(comum, 'Mocidade', selectedYear)}
                                className="inline-flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-200 shadow-2xs hover:bg-blue-100/70 hover:border-blue-400 dark:hover:bg-blue-900/50 transition cursor-pointer group/cell w-full max-w-[240px] mx-auto"
                                title={`Mocidade ${selectedYear} - ${comum.nome}\n• Quantidade: ${itemMoc.quantidade}\n• Cadastrado por: ${authorMoc}\n• Data: ${itemMoc.data}\n\nClique para visualizar ou editar.`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  {showTotals ? (
                                    <>
                                      <span className="font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                                        {itemMoc.quantidade}
                                      </span>
                                      <span className="text-[10px] text-blue-600/80 dark:text-blue-400 font-semibold">
                                        jovens
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-bold text-xs text-blue-700 dark:text-blue-300">
                                      Realizado
                                    </span>
                                  )}
                                </div>

                                {/* Linha Visível com o Usuário que inseriu */}
                                <div className="flex items-center space-x-1 text-[10px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/50 px-2 py-0.5 rounded-md mt-1 max-w-full truncate border border-blue-200 dark:border-blue-800/60">
                                  <User className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  <span className="truncate">{authorMoc}</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleCellClick(comum, 'Mocidade', selectedYear)}
                                className="inline-flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 shadow-2xs hover:bg-rose-100 hover:border-rose-400 dark:hover:bg-rose-900/50 transition cursor-pointer group/cell w-full max-w-[240px] mx-auto"
                                title={`Clique para lançar a contagem de Mocidade de ${comum.nome} (${selectedYear})`}
                              >
                                <div className="flex items-center space-x-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Pendente</span>
                                </div>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold group-hover/cell:underline mt-0.5">
                                  + Lançar Mocidade
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Coluna 3: Santa Ceia */}
                          <td className="px-3 sm:px-4 py-2.5 text-center">
                            {itemSC ? (
                              <div
                                onClick={() => handleCellClick(comum, 'Santa Ceia', selectedYear)}
                                className="inline-flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 shadow-2xs hover:bg-amber-100/70 hover:border-amber-400 dark:hover:bg-amber-900/50 transition cursor-pointer group/cell w-full max-w-[240px] mx-auto"
                                title={`Santa Ceia ${selectedYear} - ${comum.nome}\n• Quantidade: ${itemSC.quantidade}\n• Cadastrado por: ${authorSC}\n• Data: ${itemSC.data}\n\nClique para visualizar ou editar.`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  {showTotals ? (
                                    <>
                                      <span className="font-mono font-black text-sm text-amber-800 dark:text-amber-300">
                                        {itemSC.quantidade}
                                      </span>
                                      <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-semibold">
                                        irmãos
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                                      Realizado
                                    </span>
                                  )}
                                </div>

                                {/* Linha Visível com o Usuário que inseriu */}
                                <div className="flex items-center space-x-1 text-[10px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/50 px-2 py-0.5 rounded-md mt-1 max-w-full truncate border border-amber-200 dark:border-amber-800/60">
                                  <User className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  <span className="truncate">{authorSC}</span>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleCellClick(comum, 'Santa Ceia', selectedYear)}
                                className="inline-flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 shadow-2xs hover:bg-rose-100 hover:border-rose-400 dark:hover:bg-rose-900/50 transition cursor-pointer group/cell w-full max-w-[240px] mx-auto"
                                title={`Clique para lançar a contagem de Santa Ceia de ${comum.nome} (${selectedYear})`}
                              >
                                <div className="flex items-center space-x-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Pendente</span>
                                </div>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold group-hover/cell:underline mt-0.5">
                                  + Lançar Sta Ceia
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Coluna 4: Status no Ano */}
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center space-y-1">
                              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                completedCount === 2
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : completedCount === 1
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}>
                                {completedCount === 2 ? '100%' : completedCount === 1 ? '50%' : '0%'}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {completedCount}/2 lançados
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Rodapé de Totais */}
                {filteredComuns.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    <tr>
                      <td className="px-4 py-3 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 shadow-[1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[1px_0_0_rgba(255,255,255,0.06)]">
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-black">
                          Total Geral ({yearStats.totalComuns} comuns)
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-sm sm:text-base text-blue-700 dark:text-blue-400">
                            {showTotals ? `${yearStats.mocidadeTotalQtd.toLocaleString()} jovens` : '••••'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {yearStats.mocidadeRealizados}/{yearStats.totalComuns} congregações
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-sm sm:text-base text-amber-700 dark:text-amber-400">
                            {showTotals ? `${yearStats.santaCeiaTotalQtd.toLocaleString()} irmãos` : '••••'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {yearStats.santaCeiaRealizados}/{yearStats.totalComuns} congregações
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          {yearStats.conformidadeRate}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. VISÃO 2: HISTÓRICO MULTI-ANUAL (ANOS NAS COLUNAS) */}
      {viewMode === 'multi-anual' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Matriz Histórica de {multiAnoTipo} por Ano
            </span>
            <span className="text-xs text-slate-400">
              Clique em qualquer valor para visualizar ou editar
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 min-w-[200px] sticky left-0 z-20 bg-slate-100 dark:bg-slate-950">Congregação</th>
                  {multiYearsList.map(y => (
                    <th key={y} className="px-3 py-3 text-center min-w-[130px] font-bold border-l border-slate-200 dark:border-slate-800">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {filteredComuns.map(comum => (
                  <tr key={comum.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 font-bold text-xs truncate max-w-[200px]">
                      {comum.nome}
                    </td>
                    {multiYearsList.map(year => {
                      const item = contagensMap.get(`${comum.id}_${year}_${multiAnoTipo}`);
                      const author = getAuthorName(item);

                      return (
                        <td key={year} className="px-2 py-2 text-center border-l border-slate-200/60 dark:border-slate-800/60">
                          {item ? (
                            <div
                              onClick={() => handleCellClick(comum, multiAnoTipo, year)}
                              className="inline-flex flex-col items-center justify-center p-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100/70 hover:border-emerald-400 transition cursor-pointer w-full"
                              title={`${multiAnoTipo} ${year} - ${comum.nome}\nQtd: ${item.quantidade}\nCadastrado por: ${author}`}
                            >
                              {showTotals ? (
                                <span className="font-mono font-extrabold text-xs text-emerald-800 dark:text-emerald-300">
                                  {item.quantidade}
                                </span>
                              ) : (
                                <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                                  Realizado
                                </span>
                              )}
                              <div className="flex items-center space-x-0.5 text-[9px] text-slate-500 dark:text-slate-400 truncate max-w-[100px] mt-0.5">
                                <User className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{author}</span>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellClick(comum, multiAnoTipo, year)}
                              className="inline-flex items-center justify-center p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs"
                              title={`Lançar ${multiAnoTipo} para ${comum.nome} em ${year}`}
                            >
                              +
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. VISÃO 3: TABELA DETALHADA COM PAGINAÇÃO */}
      {viewMode === 'tabela' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('data')}>
                    <div className="flex items-center space-x-1"><span>Data</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('comum_congregacao.nome')}>
                    <div className="flex items-center space-x-1"><span>Comum</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('tipo')}>
                    <div className="flex items-center space-x-1"><span>Tipo</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('quantidade')}>
                    <div className="flex items-center justify-center space-x-1"><span>Presença</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-center font-bold">
                    <span>Auxiliares</span>
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-center font-bold">
                    <span>Músicos</span>
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-3">
                    <div className="flex items-center space-x-1"><span>Cadastrado por</span></div>
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {paginatedListItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      Nenhuma contagem encontrada para os filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedListItems.map((item) => {
                    const author = getAuthorName(item);
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      >
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {item.data ? item.data.split('T')[0].split('-').reverse().join('/') : '-'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3.5">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {item.comum_congregacao?.nome || '-'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold ${
                            item.tipo === 'Mocidade' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {item.tipo}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 text-xs sm:text-sm">
                          {showTotals ? item.quantidade : '••••'}
                        </td>
                        <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{author}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredListItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* 7. MODAL DE FORMULÁRIO (VISUALIZAÇÃO / EDIÇÃO / CRIAÇÃO) */}
      {isModalOpen && (
        <ContagemFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            setModalParams(null);
            onClearInitialParams?.();
          }}
          initialData={editingItem}
          initialParams={modalParams}
          comuns={comuns}
          setores={setores}
          usuarios={usuarios}
          onSuccess={(saved) => {
            setIsModalOpen(false);
            setEditingItem(null);
            setModalParams(null);
            onClearInitialParams?.();
            handleSaved(saved);
          }}
        />
      )}
    </div>
  );
};

// --- MODAL DE CONTAGEM FORMULÁRIO (COM MODO SOMENTE-LEITURA E BOTÃO EDITAR) ---
export interface ContagemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ContagemMocidade | null;
  initialParams?: ContagemInitialParams | null;
  comuns: ComumCongregacao[];
  setores?: Setor[];
  usuarios?: Usuario[];
  onSuccess: (saved?: ContagemMocidade) => void;
}

export const ContagemFormModal: React.FC<ContagemFormModalProps> = ({
  isOpen, onClose, initialData, initialParams, comuns, setores = [], usuarios = [], onSuccess
}) => {
  const { user } = useAuth();

  const roleName = (user?.perfis?.nome || '').toLowerCase().trim();
  const isApontamento = roleName.includes('apontamento') || user?.perfis?.nivel_acesso === 'comum';
  const isRestrictedUser = isApontamento || (roleName !== 'administrador' && user?.perfis?.nivel_acesso !== 'global' && !!user?.comum_congregacao_id);
  const userComumId = user?.comum_congregacao_id || user?.comum_congregacao?.id;

  const [activeItem, setActiveItem] = useState<ContagemMocidade | null>(initialData);
  const [isEditing, setIsEditing] = useState<boolean>(!initialData);
  const [modalSetorId, setModalSetorId] = useState('');
  const [formData, setFormData] = useState({
    data: '',
    quantidade: 0,
    comum_id: '',
    tipo: 'Mocidade' as 'Santa Ceia' | 'Mocidade',
    auxiliares_mocos: 0,
    auxiliares_mocas: 0,
    detalhes_musicos: [] as DetalheMusicoFamilia[],
  });
  const [loading, setLoading] = useState(false);
  const recordKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = initialData?.id || (initialParams ? `${initialParams.comumId}_${initialParams.date}_${initialParams.tipo}` : 'novo');

    // Só reexecuta a inicialização do formulário se o registro selecionado tiver mudado
    if (recordKeyRef.current === currentKey) {
      return;
    }
    recordKeyRef.current = currentKey;

    if (initialData) {
      setActiveItem(initialData);
      setIsEditing(false);
      const c = comuns.find(x => x.id === initialData.comum_id);
      const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
      setModalSetorId(s?.id || c?.setor_id || '');
      setFormData({
        data: initialData.data ? initialData.data.split('T')[0] : '',
        quantidade: initialData.quantidade ?? 0,
        comum_id: initialData.comum_id,
        tipo: initialData.tipo,
        auxiliares_mocos: initialData.auxiliares_mocos ?? 0,
        auxiliares_mocas: initialData.auxiliares_mocas ?? 0,
        detalhes_musicos: Array.isArray(initialData.detalhes_musicos) ? initialData.detalhes_musicos : [],
      });
    } else {
      setActiveItem(null);
      setIsEditing(true);

      const targetComumId = (isRestrictedUser && userComumId)
        ? userComumId
        : (initialParams?.comumId || '');

      const boundComum = targetComumId
        ? comuns.find(c => c.id === targetComumId) || (user?.comum_congregacao?.nome ? comuns.find(c => c.nome.toLowerCase() === user.comum_congregacao?.nome?.toLowerCase()) : null)
        : null;
      const boundSetor = boundComum
        ? setores.find(s => s.id === boundComum.setor_id || (boundComum.setor_pertencente && s.nome === boundComum.setor_pertencente))
        : null;

      setModalSetorId(boundSetor?.id || boundComum?.setor_id || '');
      setFormData({
        data: initialParams?.date || new Date().toISOString().split('T')[0],
        quantidade: 0,
        comum_id: boundComum ? boundComum.id : targetComumId,
        tipo: initialParams?.tipo || 'Mocidade',
        auxiliares_mocos: 0,
        auxiliares_mocas: 0,
        detalhes_musicos: [],
      });
    }
  }, [initialData, initialParams, comuns, setores, isRestrictedUser, userComumId, user?.comum_congregacao?.nome]);

  const modalComunsFiltradas = useMemo(() => {
    if (isRestrictedUser && userComumId) {
      return comuns.filter(c => c.id === userComumId);
    }
    if (!modalSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === modalSetorId);
    return comuns.filter(c => 
      c.setor_id === modalSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, modalSetorId, isRestrictedUser, userComumId]);

  const canEdit = !isRestrictedUser || !userComumId || (activeItem ? activeItem.comum_id === userComumId : true);

  const handleCancelEditing = () => {
    if (activeItem) {
      setFormData({
        data: activeItem.data ? activeItem.data.split('T')[0] : '',
        quantidade: activeItem.quantidade ?? 0,
        comum_id: activeItem.comum_id,
        tipo: activeItem.tipo,
        auxiliares_mocos: activeItem.auxiliares_mocos ?? 0,
        auxiliares_mocas: activeItem.auxiliares_mocas ?? 0,
        detalhes_musicos: Array.isArray(activeItem.detalhes_musicos) ? activeItem.detalhes_musicos : [],
      });
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  const authorName = useMemo(() => {
    if (!activeItem) return '';
    if (activeItem.usuario?.nome_completo) return activeItem.usuario.nome_completo;
    if (activeItem.cadastrado_por) {
      const u = usuarios.find(usr => usr.id === activeItem.cadastrado_por);
      if (u?.nome_completo) return u.nome_completo;
    }
    return 'Sistema';
  }, [activeItem, usuarios]);

  const handleAddFamilia = () => {
    setFormData(prev => ({
      ...prev,
      detalhes_musicos: [
        ...prev.detalhes_musicos,
        { familia: 'Cordas Friccionadas', quantidade: 1 }
      ]
    }));
  };

  const handleUpdateFamilia = (index: number, field: 'familia' | 'quantidade', value: any) => {
    setFormData(prev => {
      const updated = [...prev.detalhes_musicos];
      updated[index] = {
        ...updated[index],
        [field]: field === 'quantidade' ? Math.max(0, Number(value) || 0) : value
      };
      return { ...prev, detalhes_musicos: updated };
    });
  };

  const handleRemoveFamilia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      detalhes_musicos: prev.detalhes_musicos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const enforcedComumId = (isRestrictedUser && userComumId) ? userComumId : formData.comum_id;

      const totalMusicos = formData.detalhes_musicos.reduce((s, m) => s + (Number(m.quantidade) || 0), 0);
      const payload = {
        ...formData,
        total_musicos: totalMusicos,
        comum_id: enforcedComumId,
        cadastrado_por: user?.id || null
      };

      const targetId = activeItem?.id;
      const url = targetId ? `/api/contagens/${targetId}` : '/api/contagens';
      const method = targetId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const savedData: ContagemMocidade = json?.data || {
          id: targetId || `temp-${Date.now()}`,
          data: formData.data,
          comum_id: enforcedComumId,
          quantidade: Number(formData.quantidade) || 0,
          tipo: formData.tipo,
          auxiliares_mocos: Number(formData.auxiliares_mocos) || 0,
          auxiliares_mocas: Number(formData.auxiliares_mocas) || 0,
          total_musicos: totalMusicos,
          detalhes_musicos: formData.detalhes_musicos,
          cadastrado_por: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        clearApiCache('/api/contagens');
        onSuccess(savedData);
        onClose();
      } else {
        alert('Erro ao salvar contagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar contagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800"
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {activeItem
                ? (isEditing ? 'Editar Contagem' : 'Visualizar Contagem')
                : 'Nova Contagem Anual'}
            </h2>
            {activeItem && !isEditing && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                Registrado
              </span>
            )}
            {activeItem && isEditing && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Edit2 className="w-2.5 h-2.5 text-amber-500" />
                Modo Edição
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Identificação de quem inseriu (se já registrado) */}
          {activeItem && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cadastrado por</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{authorName}</span>
              </div>
            </div>
          )}

          {/* Data / Ano */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Data de Referência *</label>
            <input
              type="date"
              required
              disabled={!isEditing}
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                if (!isEditing) return;
                try {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    (e.target as HTMLInputElement).showPicker();
                  }
                } catch (err) {}
              }}
              className={`w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 ${
                !isEditing ? 'opacity-70 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed select-none' : 'cursor-pointer'
              }`}
            />
          </div>

          {/* Setor */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Setor Pertencente</label>
            <select
              disabled={!isEditing || (isRestrictedUser && !!userComumId)}
              value={modalSetorId}
              onChange={(e) => {
                const newSetor = e.target.value;
                setModalSetorId(newSetor);
                if (newSetor) {
                  const selSetor = setores.find(s => s.id === newSetor);
                  const isComumIn = comuns.some(c => c.id === formData.comum_id && (c.setor_id === newSetor || (selSetor && c.setor_pertencente === selSetor.nome)));
                  if (!isComumIn) setFormData(prev => ({ ...prev, comum_id: '' }));
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 ${
                !isEditing || (isRestrictedUser && !!userComumId) ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60' : 'cursor-pointer'
              }`}
            >
              <option value="">-- Todos os Setores --</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Comum */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Comum Congregação *</label>
            <select
              required
              disabled={!isEditing || (isRestrictedUser && !!userComumId)}
              value={formData.comum_id}
              onChange={(e) => {
                const chosenId = e.target.value;
                setFormData({ ...formData, comum_id: chosenId });
                if (chosenId && !modalSetorId) {
                  const c = comuns.find(item => item.id === chosenId);
                  const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
                  if (s) setModalSetorId(s.id);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 ${
                !isEditing || (isRestrictedUser && !!userComumId) ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60' : 'cursor-pointer'
              }`}
            >
              <option value="">Selecione...</option>
              {modalComunsFiltradas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Tipo de Contagem *</label>
            <select
              required
              disabled={!isEditing}
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'Santa Ceia' | 'Mocidade' })}
              className={`w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 ${
                !isEditing ? 'opacity-70 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value="Mocidade">Mocidade</option>
              <option value="Santa Ceia">Santa Ceia</option>
            </select>
          </div>

          {/* Quantidade Geral */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
              {formData.tipo === 'Mocidade' ? 'Presença Geral da Mocidade *' : 'Participantes da Santa Ceia *'}
            </label>
            <input
              type="number"
              min="0"
              required
              disabled={!isEditing}
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
              className={`w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 ${
                !isEditing ? 'opacity-70 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Seção Unificada: Auxiliares e Músicos (Exclusivo para Reunião da Mocidade) */}
          {formData.tipo === 'Mocidade' && (
            <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              {/* Auxiliares de Jovens */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Auxiliares de Jovens
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Total: {(Number(formData.auxiliares_mocos) || 0) + (Number(formData.auxiliares_mocas) || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Auxiliares Moços
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!isEditing}
                      value={formData.auxiliares_mocos}
                      onChange={(e) => setFormData({ ...formData, auxiliares_mocos: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Auxiliares Moças
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!isEditing}
                      value={formData.auxiliares_mocas}
                      onChange={(e) => setFormData({ ...formData, auxiliares_mocas: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Músicos por Família */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Músicos por Família de Instrumento
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Total: {formData.detalhes_musicos.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0)}
                  </span>
                </div>

                {formData.detalhes_musicos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    Nenhuma família de instrumento apontada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.detalhes_musicos.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                        <select
                          disabled={!isEditing}
                          value={item.familia}
                          onChange={(e) => handleUpdateFamilia(idx, 'familia', e.target.value)}
                          className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          {FAMILIAS_INSTRUMENTOS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] text-slate-400">Qtd:</span>
                          <input
                            type="number"
                            min="0"
                            disabled={!isEditing}
                            value={item.quantidade}
                            onChange={(e) => handleUpdateFamilia(idx, 'quantidade', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-center text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilia(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Remover família"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddFamilia}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Família</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rodapé e Botões */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            {activeItem && !isEditing ? (
              <div className="flex items-center justify-between w-full">
                <button
                  key="btn-contagem-fechar"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Fechar
                </button>
                {canEdit && (
                  <button
                    key="btn-contagem-editar"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  key="btn-contagem-cancelar"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (activeItem) {
                      handleCancelEditing();
                    } else {
                      onClose();
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  {activeItem ? 'Cancelar Edição' : 'Cancelar'}
                </button>
                <button
                  key="btn-contagem-salvar"
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{activeItem ? 'Salvar Alterações' : 'Salvar Contagem'}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
