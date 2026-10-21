import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  ClipboardCheck,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Eye,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ComumCongregacao, Setor, Usuario, ContagemMocidade, Anciao, AuxiliarJovens, Recitativo } from '../types';
import { NavRoute } from './Sidebar';
import { apiGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

interface DashboardViewProps {
  comuns: ComumCongregacao[];
  setores: Setor[];
  usuarios: Usuario[];
  anciaos?: Anciao[];
  contagens?: ContagemMocidade[];
  auxiliares?: AuxiliarJovens[];
  recitativos?: Recitativo[];
  loadingData?: boolean;
  onNavigate: (route: NavRoute, params?: { date?: string; comumId?: string }) => void;
  onOpenNovaComum: () => void;
  onOpenNovoUsuario: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  comuns,
  setores,
  usuarios,
  anciaos: propAnciaos,
  contagens: propContagens,
  auxiliares: propAuxiliares,
  recitativos: propRecitativos,
  loadingData = false,
  onNavigate,
  onOpenNovaComum,
  onOpenNovoUsuario,
}) => {
  const { user } = useAuth();

  const roleName = (user?.perfis?.nome || '').toLowerCase().trim();
  const cargoMinisterio = (user?.cargo_ministerio || '').toLowerCase().trim();
  const nivelAcesso = user?.perfis?.nivel_acesso;

  // Se for Auxiliar ou CJM (ou Apontamento/comum), restringe a visualização à sua comum congregação
  const isRestrictedComum = useMemo(() => {
    if (!user) return false;
    if (roleName === 'administrador' || nivelAcesso === 'global') return false;

    const isAuxiliar = roleName.includes('auxiliar') || cargoMinisterio.includes('auxiliar');
    const isCjm = roleName.includes('cjm') || cargoMinisterio.includes('cjm');
    const isApontamento = roleName.includes('apontamento');
    const isNivelComum = nivelAcesso === 'comum';

    return isAuxiliar || isCjm || isApontamento || isNivelComum || !!user.comum_congregacao_id;
  }, [user, roleName, cargoMinisterio, nivelAcesso]);

  const userComumId = user?.comum_congregacao_id || user?.comum_congregacao?.id;

  const scopedComuns = useMemo(() => {
    if (isRestrictedComum && userComumId) {
      const match = comuns.filter((c) => c.id === userComumId);
      if (match.length > 0) return match;
      if (user?.comum_congregacao?.nome) {
        const matchByName = comuns.filter(
          (c) => c.nome.toLowerCase() === user.comum_congregacao?.nome?.toLowerCase()
        );
        if (matchByName.length > 0) return matchByName;
      }
    }
    return comuns;
  }, [comuns, isRestrictedComum, userComumId, user?.comum_congregacao?.nome]);

  const scopedComumIds = useMemo(() => new Set(scopedComuns.map((c) => c.id)), [scopedComuns]);

  const ativas = scopedComuns.filter((c) => c.ativo).length;
  const reunioes10hs = scopedComuns.filter((c) => c.dia_reuniao_jovens === 'Domingo 10hs').length;
  const reunioes1430hs = scopedComuns.filter((c) => c.dia_reuniao_jovens === 'Domingo 14:30hs').length;

  const [localContagens, setLocalContagens] = useState<ContagemMocidade[]>([]);
  const [localAnciaos, setLocalAnciaos] = useState<Anciao[]>([]);
  const [localAuxiliares, setLocalAuxiliares] = useState<AuxiliarJovens[]>([]);
  const [localRecitativos, setLocalRecitativos] = useState<Recitativo[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  const contagens = propContagens ?? localContagens;
  const anciaos = propAnciaos ?? localAnciaos;
  const auxiliares = propAuxiliares ?? localAuxiliares;
  const recitativos = propRecitativos ?? localRecitativos;
  const loading = propRecitativos !== undefined ? loadingData : localLoading;

  // Filtros da seção de Apontamentos Faltantes
  const [selectedSetorId, setSelectedSetorId] = useState<string>('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<'mes_atual' | 'mes_anterior' | 'ultimos_30' | 'ano_atual'>('mes_atual');

  useEffect(() => {
    if (propRecitativos !== undefined) return;

    const fetchData = async () => {
      setLocalLoading(true);
      try {
        const [resContagens, resAnciaos, resAuxiliares, resRecitativos] = await Promise.all([
          apiGet('/api/contagens'),
          apiGet('/api/anciaos'),
          apiGet('/api/auxiliares'),
          apiGet('/api/recitativos'),
        ]);
        if (resContagens.ok) {
          const json = await resContagens.json();
          setLocalContagens(json.data || []);
        }
        if (resAnciaos.ok) {
          const json = await resAnciaos.json();
          setLocalAnciaos(json.data || []);
        }
        if (resAuxiliares.ok) {
          const json = await resAuxiliares.json();
          setLocalAuxiliares(json.data || []);
        }
        if (resRecitativos.ok) {
          const json = await resRecitativos.json();
          setLocalRecitativos(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Dashboard:', err);
      } finally {
        setLocalLoading(false);
      }
    };
    fetchData();
  }, [propRecitativos]);

  const currentYear = new Date().getFullYear().toString();

  const totalMocidade = useMemo(() => {
    const maxPorComum: Record<string, number> = {};
    contagens.forEach(c => {
      if (scopedComumIds.has(c.comum_id) && c.tipo === 'Mocidade' && c.data?.startsWith(currentYear)) {
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens, currentYear, scopedComumIds]);

  const totalSantaCeia = useMemo(() => {
    const maxPorComum: Record<string, number> = {};
    contagens.forEach(c => {
      if (scopedComumIds.has(c.comum_id) && c.tipo === 'Santa Ceia' && c.data?.startsWith(currentYear)) {
        if (!maxPorComum[c.comum_id] || c.quantidade > maxPorComum[c.comum_id]) {
          maxPorComum[c.comum_id] = c.quantidade;
        }
      }
    });
    return Object.values(maxPorComum).reduce((a, b) => a + b, 0);
  }, [contagens, currentYear, scopedComumIds]);

  const totalCJM = useMemo(() => {
    return usuarios.filter(u => {
      if (!u.ativo) return false;
      if (isRestrictedComum && userComumId) {
        if (u.comum_congregacao_id !== userComumId) return false;
      }
      const c = (u.cargo_ministerio || '').trim().toLowerCase();
      return c === 'cjm' || c === 'secretário / cjm' || c === 'secretario / cjm';
    }).length;
  }, [usuarios, isRestrictedComum, userComumId]);

  const totalAnciaos = useMemo(() => {
    if (isRestrictedComum) {
      const anciaoIds = new Set(scopedComuns.map(c => c.anciao_id).filter(Boolean));
      return anciaos.filter(a => a.ativo && anciaoIds.has(a.id)).length;
    }
    return anciaos.filter(a => a.ativo).length;
  }, [anciaos, isRestrictedComum, scopedComuns]);

  const totalAuxiliares = useMemo(() => {
    return auxiliares.filter(a => {
      if (!a.ativo || !a.is_auxiliar) return false;
      if (isRestrictedComum && userComumId) {
        return a.comum_id === userComumId;
      }
      return true;
    }).length;
  }, [auxiliares, isRestrictedComum, userComumId]);

  // =========================================================================
  // CÁLCULO DOS APONTAMENTOS FALTANTES / PENDENTES COM IDENTIFICAÇÃO DAS DATAS
  // =========================================================================

  // Calcula todos os domingos relevantes dentro do período selecionado que já ocorreram até hoje
  const relevantSundays = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sundays: string[] = [];

    const addSundaysForMonth = (year: number, month: number) => {
      const d = new Date(year, month, 1);
      while (d.getMonth() === month) {
        if (d.getDay() === 0 && d <= today) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          sundays.push(`${yyyy}-${mm}-${dd}`);
        }
        d.setDate(d.getDate() + 1);
      }
    };

    const currentYearNum = today.getFullYear();
    const currentMonthNum = today.getMonth();

    if (selectedPeriodo === 'mes_atual') {
      addSundaysForMonth(currentYearNum, currentMonthNum);
    } else if (selectedPeriodo === 'mes_anterior') {
      const prevDate = new Date(currentYearNum, currentMonthNum - 1, 1);
      addSundaysForMonth(prevDate.getFullYear(), prevDate.getMonth());
    } else if (selectedPeriodo === 'ultimos_30') {
      const startDate = new Date();
      startDate.setDate(today.getDate() - 45);
      const cur = new Date(startDate);
      while (cur <= today) {
        if (cur.getDay() === 0) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          sundays.push(`${yyyy}-${mm}-${dd}`);
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // ano_atual
      for (let m = 0; m <= currentMonthNum; m++) {
        addSundaysForMonth(currentYearNum, m);
      }
    }

    return Array.from(new Set(sundays)).sort().reverse();
  }, [selectedPeriodo]);

  // Congregações filtradas pelo Setor (e escopo de acesso)
  const filteredComuns = useMemo(() => {
    return scopedComuns.filter(c => {
      if (!c.ativo) return false;
      if (selectedSetorId && !isRestrictedComum) {
        const selectedSetor = setores.find(s => s.id === selectedSetorId);
        const matches = c.setor_id === selectedSetorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome);
        if (!matches) return false;
      }
      return true;
    });
  }, [scopedComuns, setores, selectedSetorId, isRestrictedComum]);

  // Verifica se uma congregação possui apontamento de recitativos ou Santa Ceia para a semana daquele domingo
  const isComumPresenteNaSemana = (sundayStr: string, comumId: string) => {
    // 1. Recitativo lançado na data exata ou na mesma semana (de domingo a sábado ou até 2 dias antes)
    const hasRec = recitativos.some(r => {
      if (r.comum_id !== comumId) return false;
      if (r.data === sundayStr) return true;
      const [ry, rm, rd] = r.data.split('-').map(Number);
      const [sy, sm, sd] = sundayStr.split('-').map(Number);
      const recDate = new Date(ry, rm - 1, rd);
      const sunDate = new Date(sy, sm - 1, sd);
      const diffDays = Math.round((recDate.getTime() - sunDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 6;
    });
    if (hasRec) return true;

    // 2. Santa Ceia realizada na mesma semana
    const hasSantaCeia = contagens.some(c => {
      if (c.comum_id !== comumId || c.tipo !== 'Santa Ceia') return false;
      if (c.data === sundayStr) return true;
      const [cy, cm, cd] = c.data.split('-').map(Number);
      const [sy, sm, sd] = sundayStr.split('-').map(Number);
      const contDate = new Date(cy, cm - 1, cd);
      const sunDate = new Date(sy, sm - 1, sd);
      const diffDays = Math.round((contDate.getTime() - sunDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 6;
    });
    return hasSantaCeia;
  };

  // Faltas agrupadas por Congregação (Visualização fixa)
  const pendenciasPorComum = useMemo(() => {
    return filteredComuns.map(comum => {
      const datasFaltando = relevantSundays.filter(sunday => !isComumPresenteNaSemana(sunday, comum.id));

      const responsavel = usuarios.find(u => 
        u.id === comum.secretario_id || 
        (u.comum_congregacao_id === comum.id && (u.cargo_ministerio?.toLowerCase().includes('cjm') || u.cargo_ministerio?.toLowerCase().includes('secretário')))
      );

      return {
        comum,
        datasFaltando,
        totalFaltas: datasFaltando.length,
        responsavelNome: responsavel?.nome_completo || 'Não informado',
      };
    }).filter(item => item.totalFaltas > 0)
      .sort((a, b) => b.totalFaltas - a.totalFaltas || a.comum.nome.localeCompare(b.comum.nome));
  }, [filteredComuns, relevantSundays, recitativos, contagens, usuarios]);

  const totalApontamentosFaltantes = useMemo(() => {
    return pendenciasPorComum.reduce((acc, curr) => acc + curr.totalFaltas, 0);
  }, [pendenciasPorComum]);

  // Formatadores de data para visualização clara
  const formatDateBadge = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatDateFull = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const str = dateObj.toLocaleDateString('pt-BR', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-500/20 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Integrado de Gestão • Regional Guarulhos</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Painel Geral de Apontamentos
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Controle consolidado das Reuniões de Jovens e Menores, congregações pertencentes,
            quadro de auxiliares, membros da CJM e monitoramento de preenchimento.
          </p>

          {/* Destaque para perfil restrito à comum */}
          {isRestrictedComum && scopedComuns[0] && (
            <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-500/40 shadow-xs">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Visão restrita à sua congregação: <strong>{scopedComuns[0].nome}</strong> ({scopedComuns[0].setor_pertencente || 'Setor'})</span>
            </div>
          )}

          {/* Atalhos Rápidos */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {hasPermission(user, 'lancar_apontamento') ? (
              <button
                onClick={() => onNavigate('controle-apontamentos')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Controle de Apontamentos</span>
              </button>
            ) : hasPermission(user, 'exportar_relatorios') ? (
              <button
                onClick={() => onNavigate('controle-apontamentos')}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Controle de Apontamentos</span>
              </button>
            ) : null}
            {hasPermission(user, 'gerenciar_comuns') && (
              <button
                onClick={onOpenNovaComum}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Nova Comum</span>
              </button>
            )}
            {hasPermission(user, 'gerenciar_usuarios') && (
              <button
                onClick={onOpenNovoUsuario}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-300 dark:border-slate-700 flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Novo Usuário</span>
              </button>
            )}
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Cards de Métricas Principais (6 Colunas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Comuns */}
        <div
          onClick={() => {
            if (hasPermission(user, 'gerenciar_comuns')) onNavigate('admin-comuns');
          }}
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition group ${
            hasPermission(user, 'gerenciar_comuns') ? 'hover:border-emerald-400 dark:hover:border-emerald-500/40 cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isRestrictedComum ? 'Sua Comum' : 'Comuns'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            {isRestrictedComum ? (
              <span className="text-lg font-extrabold text-slate-900 dark:text-white truncate" title={scopedComuns[0]?.nome}>
                {scopedComuns[0]?.nome || 'Vinculada'}
              </span>
            ) : (
              <>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{comuns.length}</span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">({ativas} ativas)</span>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            {isRestrictedComum ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {scopedComuns[0]?.setor_pertencente || 'Setor Pertencente'}
              </span>
            ) : (
              <div className="flex items-center group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                <span>Ver congregações</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Apontamentos Faltantes (Destaque Alerta) */}
        <div
          onClick={() => onNavigate('controle-apontamentos')}
          className={`border rounded-xl p-5 shadow-xs transition group cursor-pointer ${
            totalApontamentosFaltantes > 0
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Apontamentos Faltando
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border group-hover:scale-105 transition ${
              totalApontamentosFaltantes > 0
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${totalApontamentosFaltantes > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {totalApontamentosFaltantes}
            </span>
            <span className="text-xs font-medium text-slate-500">no período</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-rose-700 dark:text-rose-400 group-hover:underline transition">
            <span>Ver faltas no mapa</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Card 3: Total Mocidade */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Mocidade ({currentYear})
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalMocidade.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Card 4: Santa Ceia */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Santa Ceia ({currentYear})
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalSantaCeia.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Card 5: CJM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CJM Ativos
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalCJM}</span>
          </div>
        </div>

        {/* Card 6: Anciãos e Auxiliares */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Liderança
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Anciãos</p>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalAnciaos}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Aux. Jovens</p>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{totalAuxiliares}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: APONTAMENTOS PENDENTES / FALTANTES COM DATAS IDENTIFICADAS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Cabeçalho da Seção com Filtros */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center space-x-2">
                  <span>Apontamentos Faltando ser Realizados</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    totalApontamentosFaltantes > 0
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {totalApontamentosFaltantes} {totalApontamentosFaltantes === 1 ? 'pendência' : 'pendências'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identificação clara das datas de domingos em que não houve lançamento de recitativos.
                </p>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Alternância de Visualização */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Setor */}
            {!isRestrictedComum ? (
              <select
                value={selectedSetorId}
                onChange={(e) => setSelectedSetorId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos os Setores</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{scopedComuns[0]?.nome || 'Sua Comum'}</span>
              </div>
            )}

            {/* Filtro Período */}
            <select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="mes_atual">Mês Atual</option>
              <option value="mes_anterior">Mês Anterior</option>
              <option value="ultimos_30">Últimos 45 dias</option>
              <option value="ano_atual">Ano Atual ({currentYear})</option>
            </select>

            {/* Ação de Ir para Controle */}
            <button
              onClick={() => onNavigate('controle-apontamentos')}
              title="Abrir Tela de Controle Completo"
              className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver Matriz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Conteúdo: Estado Vazio ou Lista de Pendências */}
        {totalApontamentosFaltantes === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Nenhum apontamento pendente no período!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Todas as congregações ativas do setor selecionado já realizaram o registro dos seus recitativos ou tiveram Santa Ceia nos domingos correspondentes.
              </p>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VISUALIZAÇÃO FIXA: AGRUPADO POR CONGREGAÇÃO (COM TAGS DE DATA)*/
          /* ============================================================ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Comum Congregação</th>
                  <th className="px-6 py-3.5">Setor Pertencente</th>
                  <th className="px-6 py-3.5">Responsável (CJM/Secretário)</th>
                  <th className="px-6 py-3.5">Datas Faltantes (Domingos)</th>
                  <th className="px-6 py-3.5 text-center">Total Faltas</th>
                  <th className="px-6 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                {pendenciasPorComum.map((item) => (
                  <tr key={item.comum.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{item.comum.nome}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.comum.setor_pertencente || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.responsavelNome}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {item.datasFaltando.map((d) => (
                          <span
                            key={d}
                            onClick={() => onNavigate('controle-apontamentos', { date: d, comumId: item.comum.id })}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs cursor-pointer hover:bg-rose-200 dark:hover:bg-rose-900 transition"
                            title={`Clique para lançar o apontamento de ${formatDateFull(d)}`}
                          >
                            <Calendar className="w-3 h-3 mr-1 text-rose-500" />
                            {formatDateBadge(d)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold font-mono text-rose-600 dark:text-rose-400">
                      {item.totalFaltas}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('controle-apontamentos', { date: item.datasFaltando[0], comumId: item.comum.id })}
                        className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Lançar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seção 3: Distribuição de Horários e Setores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horários das Reuniões de Jovens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Horários das Reuniões de Jovens
              </h3>
            </div>
            <span className="text-xs text-slate-500">2 Opções Oficiais</span>
          </div>

          <div className="space-y-3">
            {/* Opção 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Domingo 10hs</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Período da Manhã</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{reunioes10hs}</span>
                <span className="text-xs text-slate-500">congregações</span>
              </div>
            </div>

            {/* Opção 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Domingo 14:30hs</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Período da Tarde</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-sky-700 dark:text-sky-400">{reunioes1430hs}</span>
                <span className="text-xs text-slate-500">congregações</span>
              </div>
            </div>
          </div>
        </div>

        {/* Setores e Congregações Vinculadas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                Congregações por Setor Pertencente
              </h3>
            </div>
            {hasPermission(user, 'gerenciar_comuns') && (
              <button
                onClick={() => onNavigate('admin-comuns')}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Ver todas
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {setores
              .filter((setor) => {
                if (isRestrictedComum) {
                  return scopedComuns.some(
                    (c) => c.setor_id === setor.id || (c.setor_pertencente && c.setor_pertencente === setor.nome)
                  );
                }
                return true;
              })
              .map((setor) => {
                const count = scopedComuns.filter(
                  (c) => c.setor_id === setor.id || (c.setor_pertencente && c.setor_pertencente === setor.nome)
                ).length;
                return (
                  <div
                    key={setor.id}
                    className="px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{setor.codigo}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{setor.nome}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {isRestrictedComum && scopedComuns[0]
                        ? scopedComuns[0].nome
                        : `${count} congregaç${count === 1 ? 'ão' : 'ões'}`}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
