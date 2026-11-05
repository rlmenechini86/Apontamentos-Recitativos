import React, { useState, useEffect } from 'react';
import { History, User, Clock, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, RefreshCw, FileText } from 'lucide-react';
import { apiGet } from '../utils/api';

interface Props {
  registroId: string;
  tabela: 'recitativos' | 'contagens_mocidade';
  initialCreatorName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  defaultExpanded?: boolean;
}

export const ApontamentoAuditLogView: React.FC<Props> = ({
  registroId,
  tabela,
  initialCreatorName,
  createdAt,
  updatedAt,
  defaultExpanded = true
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!registroId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const endpoint = tabela === 'recitativos' 
          ? `/api/recitativos/logs?registro_id=${encodeURIComponent(registroId)}`
          : `/api/contagens/logs?registro_id=${encodeURIComponent(registroId)}`;

        const res = await apiGet(endpoint);
        if (res.ok) {
          const json = await res.json();
          setLogs(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar logs do apontamento:', err);
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    };

    fetchLogs();
  }, [registroId, tabela]);

  const formatDate = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoDate;
    }
  };

  const parseDetails = (log: any) => {
    try {
      if (typeof log.detalhes === 'object' && log.detalhes !== null) return log.detalhes;
      return JSON.parse(log.detalhes || '{}');
    } catch {
      return { descricao: log.detalhes };
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden">
      {/* Header do Accordion de Logs */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Histórico & Logs deste Apontamento
          </span>
          {logs.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? 'Ocultar' : 'Visualizar'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
              <span className="text-xs font-medium">Carregando histórico do apontamento...</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-2.5">
              {logs.map((log, index) => {
                const det = parseDetails(log);
                const isCreate = log.acao === 'CREATE';
                const userName = det.nome_usuario || log.usuario_email || 'Usuário do Sistema';
                const formattedTime = formatDate(det.data_registro || log.created_at);

                return (
                  <div
                    key={log.id || index}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
                  >
                    {/* Top line: ação, usuário e data/hora */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCreate
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          }`}
                        >
                          {isCreate ? '✓ Lançamento Inicial' : '✎ Alteração'}
                        </span>
                        <div className="flex items-center space-x-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{userName}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formattedTime}</span>
                      </div>
                    </div>

                    {/* Valores inseridos no Lançamento */}
                    {isCreate && det.valores_inseridos && (
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Valores Lançados:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(det.valores_inseridos)
                            .filter(([key]) => !['comum_id', 'data', 'cadastrado_por', 'id'].includes(key))
                            .map(([key, val]: any) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300"
                              >
                                <span className="font-semibold capitalize mr-1 text-slate-500 dark:text-slate-400">
                                  {key}:
                                </span>
                                <strong className="text-slate-900 dark:text-slate-100">{val}</strong>
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Valores alterados na Atualização */}
                    {!isCreate && det.valores_alterados && (
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block mb-1">
                          Valores Alterados:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(det.valores_alterados).map(([key, diff]: any) => (
                            <div
                              key={key}
                              className="flex items-center justify-between px-2 py-1 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs"
                            >
                              <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                                {key}:
                              </span>
                              <div className="flex items-center space-x-1.5 font-mono">
                                <span className="line-through text-slate-400 text-[11px]">
                                  {diff?.de ?? '-'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-blue-500" />
                                <strong className="text-blue-700 dark:text-blue-300 font-bold">
                                  {diff?.para ?? '-'}
                                </strong>
                                {typeof diff?.de === 'number' && typeof diff?.para === 'number' && (
                                  <span
                                    className={`text-[10px] font-bold px-1 rounded ${
                                      diff.para >= diff.de
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    }`}
                                  >
                                    {diff.para >= diff.de ? `+${diff.para - diff.de}` : `${diff.para - diff.de}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback quando o registro foi feito antes da ativação do sistema de auditoria detalhado */
            <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Cadastrado por: <strong className="text-slate-900 dark:text-slate-100">{initialCreatorName || 'Sistema'}</strong>
                </span>
              </div>
              {createdAt && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Data de lançamento: {formatDate(createdAt)}</span>
                </div>
              )}
              {updatedAt && updatedAt !== createdAt && (
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Última atualização registrada: {formatDate(updatedAt)}</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 italic pt-1">
                Todas as novas alterações feitas neste apontamento serão registradas com usuário, data/hora e valores.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

