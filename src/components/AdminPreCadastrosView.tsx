import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Calendar,
  Sparkles,
  Heart,
  Droplets,
  AlertCircle,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  Layers
} from 'lucide-react';
import { PreCadastro, Perfil, Setor, ComumCongregacao } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserScope, isItemInUserSector } from '../utils/permissions';

interface AdminPreCadastrosViewProps {
  perfis: Perfil[];
  setores?: Setor[];
  comuns?: ComumCongregacao[];
  onUserApproved?: () => void;
}

export const AdminPreCadastrosView: React.FC<AdminPreCadastrosViewProps> = ({
  perfis,
  setores = [],
  comuns = [],
  onUserApproved,
}) => {
  const { user } = useAuth();
  const userScope = useMemo(() => getUserScope(user, comuns, setores), [user, comuns, setores]);

  const [preCadastros, setPreCadastros] = useState<PreCadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pendente' | 'aprovado' | 'recusado' | 'todos'>('pendente');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal de Aprovação
  const [approvingItem, setApprovingItem] = useState<PreCadastro | null>(null);
  const [selectedPerfilId, setSelectedPerfilId] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Modal de Recusa
  const [rejectingItem, setRejectingItem] = useState<PreCadastro | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Mensagem de feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPreCadastros = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pre-cadastros');
      const json = await res.json();
      if (res.ok && json.data) {
        setPreCadastros(json.data);
      }
    } catch (err) {
      console.error('Erro ao buscar pré-cadastros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreCadastros();
  }, []);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/pre-cadastro`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Filtragem dos pré-cadastros considerando escopo setorial
  const filteredList = useMemo(() => {
    return preCadastros.filter((item) => {
      // 1. Escopo Setorial
      if (userScope.isSetor) {
        if (!isItemInUserSector(userScope, item, comuns, setores)) {
          return false;
        }
      }

      // 2. Filtro de Status
      if (statusFilter !== 'todos' && item.status !== statusFilter) {
        return false;
      }

      // 3. Busca por texto
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNome = item.nome_completo?.toLowerCase().includes(q);
        const matchesEmail = item.email?.toLowerCase().includes(q);
        const matchesCelular = item.celular?.toLowerCase().includes(q);
        const matchesComum = item.comum_congregacao?.nome?.toLowerCase().includes(q);
        const matchesCargo = item.cargo?.toLowerCase().includes(q);
        if (!matchesNome && !matchesEmail && !matchesCelular && !matchesComum && !matchesCargo) {
          return false;
        }
      }

      return true;
    });
  }, [preCadastros, userScope, comuns, setores, statusFilter, searchTerm]);

  // Contagens para os badges das abas
  const countStats = useMemo(() => {
    const scoped = preCadastros.filter((item) => {
      if (userScope.isSetor) {
        return isItemInUserSector(userScope, item, comuns, setores);
      }
      return true;
    });

    return {
      pendentes: scoped.filter((x) => x.status === 'pendente').length,
      aprovados: scoped.filter((x) => x.status === 'aprovado').length,
      recusados: scoped.filter((x) => x.status === 'recusado').length,
      total: scoped.length,
    };
  }, [preCadastros, userScope, comuns, setores]);

  // Abertura do modal de aprovação
  const handleOpenApprove = (item: PreCadastro) => {
    setApprovingItem(item);
    setApproveError(null);
    // Tenta pré-selecionar o perfil mais adequado com base no cargo
    let defaultPerfil = perfis[0]?.id || '';
    const cargoLower = item.cargo.toLowerCase();
    if (cargoLower.includes('secretário')) {
      const p = perfis.find((x) => x.nome.toLowerCase().includes('apontamento') || x.nome.toLowerCase().includes('secretário'));
      if (p) defaultPerfil = p.id;
    } else if (cargoLower.includes('cjm')) {
      const p = perfis.find((x) => x.nome.toLowerCase().includes('cjm'));
      if (p) defaultPerfil = p.id;
    }
    setSelectedPerfilId(defaultPerfil);
  };

  // Submissão da aprovação
  const handleConfirmApprove = async () => {
    if (!approvingItem) return;
    if (!selectedPerfilId) {
      setApproveError('Selecione o perfil de acesso a ser atribuído.');
      return;
    }

    setIsApproving(true);
    setApproveError(null);

    try {
      const res = await fetch(`/api/pre-cadastros/${approvingItem.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_id: selectedPerfilId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erro ao aprovar cadastro.');
      }

      setFeedback({
        type: 'success',
        text: `Cadastro de "${approvingItem.nome_completo}" aprovado com sucesso! O usuário foi criado no sistema.`,
      });
      setTimeout(() => setFeedback(null), 5000);

      setApprovingItem(null);
      await fetchPreCadastros();
      onUserApproved?.();
    } catch (err: any) {
      setApproveError(err.message || 'Erro ao aprovar cadastro.');
    } finally {
      setIsApproving(false);
    }
  };

  // Abertura do modal de recusa
  const handleOpenReject = (item: PreCadastro) => {
    setRejectingItem(item);
    setMotivoRecusa('');
    setRejectError(null);
  };

  // Submissão da recusa
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;

    setIsRejecting(true);
    setRejectError(null);

    try {
      const res = await fetch(`/api/pre-cadastros/${rejectingItem.id}/recusar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRecusa.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erro ao recusar cadastro.');
      }

      setFeedback({
        type: 'success',
        text: `Pré-cadastro de "${rejectingItem.nome_completo}" foi recusado.`,
      });
      setTimeout(() => setFeedback(null), 5000);

      setRejectingItem(null);
      await fetchPreCadastros();
    } catch (err: any) {
      setRejectError(err.message || 'Erro ao recusar cadastro.');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Pré-Cadastros de Usuários
              </h2>
              {countStats.pendentes > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse">
                  {countStats.pendentes} pendente{countStats.pendentes > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Receba, avalie e atribua perfis de acesso aos cadastros enviados pelo link público.
            </p>
          </div>
        </div>

        {/* Ações do Topo: Copiar Link e Abrir Tela Externa */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Copiar link para enviar via WhatsApp ou E-mail"
          >
            {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Cadastro'}</span>
          </button>

          <a
            href="/pre-cadastro"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
            title="Abrir a tela pública em uma nova aba"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Tela Externa</span>
          </a>

          <button
            onClick={fetchPreCadastros}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Abas de Status */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pendente'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pendentes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
              {countStats.pendentes}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('aprovado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'aprovado'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Aprovados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              {countStats.aprovados}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('recusado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'recusado'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Recusados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300">
              {countStats.recusados}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'todos'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({countStats.total})
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, comum..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Lista de Pré-Cadastros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-xs">Carregando solicitações de pré-cadastro...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <UserPlus className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nenhuma solicitação de pré-cadastro encontrada.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {statusFilter === 'pendente'
                ? 'Não há solicitações pendentes para aprovação no momento.'
                : 'Não há registros com os filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((item) => {
              const setorNome = item.setores?.nome || item.setor_pertencente || item.comum_congregacao?.setor_pertencente;
              const comumNome = item.comum_congregacao?.nome || 'Não informada';

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Dados do Solicitante */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {item.nome_completo}
                      </h3>

                      {/* Badge de Status */}
                      {item.status === 'pendente' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </span>
                      )}
                      {item.status === 'aprovado' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Aprovado
                        </span>
                      )}
                      {item.status === 'recusado' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Recusado
                        </span>
                      )}

                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.cargo}
                      </span>
                    </div>

                    {/* Contato & Localidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.celular}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {comumNome} {setorNome ? `(${setorNome})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Dados Ministeriais e Pessoais Adicionais */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.data_apresentacao && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          Apresentação: {formatDate(item.data_apresentacao)}
                        </span>
                      )}
                      {item.data_nascimento && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3 text-teal-600" />
                          Nascimento: {formatDate(item.data_nascimento)}
                        </span>
                      )}
                      {item.ano_casamento && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                          <Heart className="w-3 h-3 text-rose-500" />
                          Casamento: {item.ano_casamento}
                        </span>
                      )}
                      {item.selado_promessa !== null && item.selado_promessa !== undefined && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/40">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {item.selado_promessa ? 'Selado c/ Promessa' : 'Não selado'}
                        </span>
                      )}
                      {item.ano_batismo && (
                        <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-900/40">
                          <Droplets className="w-3 h-3 text-sky-500" />
                          Batismo: {item.ano_batismo}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        • Enviado em {formatDateTime(item.created_at)}
                      </span>
                    </div>

                    {/* Detalhe de Recusa se houver */}
                    {item.status === 'recusado' && item.motivo_recusa && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
                        <strong>Motivo da recusa:</strong> {item.motivo_recusa}
                      </div>
                    )}

                    {/* Detalhe de Aprovação se houver */}
                    {item.status === 'aprovado' && item.perfis && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ Aprovado com perfil: <strong>{item.perfis.nome}</strong>
                      </div>
                    )}
                  </div>

                  {/* Ações: Aprovar / Recusar */}
                  {item.status === 'pendente' && (
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        onClick={() => handleOpenReject(item)}
                        className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>

                      <button
                        onClick={() => handleOpenApprove(item)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovar Cadastro</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: APROVAÇÃO DE PRÉ-CADASTRO */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Aprovar Cadastro
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defina o perfil de acesso para liberação do usuário
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {approveError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{approveError}</span>
                </div>
              )}

              {/* Resumo do Usuário */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {approvingItem.nome_completo}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <strong>E-mail:</strong> {approvingItem.email}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <strong>Cargo Solicitado:</strong> {approvingItem.cargo}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <strong>Comum:</strong> {approvingItem.comum_congregacao?.nome || 'Não informada'}
                </div>
              </div>

              {/* Seleção do Perfil de Acesso */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Perfil de Acesso do Usuário *
                </label>
                <select
                  required
                  value={selectedPerfilId}
                  onChange={(e) => setSelectedPerfilId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer"
                >
                  <option value="">Selecione o perfil...</option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.nivel_acesso.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  O usuário será criado com a senha provisória padrão <strong>padrao123</strong> e receberá solicitação para cadastrar sua própria senha no primeiro login.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                disabled={isApproving}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={isApproving || !selectedPerfilId}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isApproving ? 'Criando Usuário...' : 'Confirmar e Aprovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECUSA DE PRÉ-CADASTRO */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-rose-500/10 to-amber-500/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Recusar Pré-Cadastro
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Confirme a recusa da solicitação
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {rejectError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rejectError}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                Tem certeza que deseja recusar a solicitação de{' '}
                <strong>{rejectingItem.nome_completo}</strong> ({rejectingItem.email})?
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo da Recusa (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Ex: Dados incompletos ou congregação não confirmada..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                disabled={isRejecting}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isRejecting ? 'Recusando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

