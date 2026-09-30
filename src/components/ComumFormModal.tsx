import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  User,
} from 'lucide-react';
import { ComumCongregacao, Setor, Usuario, Anciao } from '../types';

interface ComumFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<ComumCongregacao>) => Promise<void>;
  initialData?: ComumCongregacao | null;
  setores: Setor[];
  usuarios?: Usuario[];
}

export const ComumFormModal: React.FC<ComumFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  setores,
  usuarios = [],
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    setor_id: '',
    codigo: '',
    dia_reuniao_jovens: 'Domingo 10hs',
    anciao_id: '',
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoCodigo, setAutoCodigo] = useState<string>('');
  const [anciaos, setAnciaos] = useState<Anciao[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/anciaos')
        .then(res => res.ok ? res.json() : { data: [] })
        .then(json => setAnciaos(json.data?.filter((a: any) => a.ativo) || []))
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const defaultSetorId = setores[0]?.id || '';

      if (initialData) {
        setFormData({
          nome: initialData.nome || '',
          codigo: initialData.codigo || '',
          setor_id: initialData.setor_id || '',
          dia_reuniao_jovens: initialData.dia_reuniao_jovens || 'Domingo 10hs',
          anciao_id: initialData.anciao_id || '',
          ativo: initialData.ativo !== undefined ? initialData.ativo : true,
        });
        setAutoCodigo(initialData.codigo || '');
      } else {
        setFormData({
          nome: '',
          codigo: '',
          setor_id: defaultSetorId,
          dia_reuniao_jovens: 'Domingo 10hs',
          anciao_id: '',
          ativo: true,
        });

        // Buscar próximo código sequencial gerado pelo backend
        fetch('/api/comuns/meta/next-codigo')
          .then((res) => res.json())
          .then((json) => {
            if (json.data?.nextCodigo) {
              setAutoCodigo(json.data.nextCodigo);
            }
          })
          .catch(() => {
            setAutoCodigo('CC-001');
          });
      }
    }
  }, [isOpen, initialData, setores]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.nome.trim()) {
      setErrorMsg('O Nome da Comum Congregação é obrigatório.');
      return;
    }
    if (!formData.setor_id.trim()) {
      setErrorMsg('Selecione o Setor Pertencente.');
      return;
    }

    try {
      setLoading(true);
      const selectedSetor = setores.find((s) => s.id === formData.setor_id);
      await onSubmit({
        nome: formData.nome.trim(),
        setor_id: formData.setor_id,
        setor_pertencente: selectedSetor?.nome || undefined,
        dia_reuniao_jovens: formData.dia_reuniao_jovens?.trim() || 'Domingo 10hs',
        anciao_id: formData.anciao_id || null,
        ativo: formData.ativo !== undefined ? formData.ativo : true,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar Comum Congregação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold">
              {initialData ? 'Editar Comum Congregação' : 'Nova Comum Congregação'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Código de Controle Interno Automático */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Código de Controle Interno</span>
              </span>
              <p className="text-[11px] text-slate-500">
                {initialData
                  ? 'Código identificador exclusivo desta congregação'
                  : 'Gerado automaticamente pelo sistema'}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-sm font-bold">
              {initialData ? initialData.codigo : autoCodigo || 'Gerando...'}
            </div>
          </div>

          {/* Setor Pertencente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Setor Pertencente *</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Obrigatório</span>
            </label>
            <select
              value={formData.setor_id}
              onChange={(e) => setFormData({ ...formData, setor_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
              required
            >
              <option value="" disabled>Selecione o Setor responsável...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Nome da Comum Congregação */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span>Nome da Comum Congregação *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Vila Galvão, Brás - Central, Bonsucesso..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          {/* Ancião de Atendimento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span>Ancião que dá atendimento</span>
            </label>
            <select
              value={formData.anciao_id}
              onChange={(e) => setFormData({ ...formData, anciao_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Nenhum Ancião Selecionado</option>
              {anciaos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Reunião de Jovens e Menores */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Dia e Horário da Reunião de Jovens e Menores *</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">2 opções oficiais</span>
            </label>

            {/* Opções em Cards Clicáveis */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { valor: 'Domingo 10hs', periodo: 'Manhã (10:00)' },
                { valor: 'Domingo 14:30hs', periodo: 'Tarde (14:30)' },
              ].map((opt) => {
                const isSelected = formData.dia_reuniao_jovens === opt.valor;
                return (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, dia_reuniao_jovens: opt.valor })}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-white ring-1 ring-emerald-500/50 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{opt.valor}</span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{opt.periodo}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 pt-0.5">
              <Info className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span>Horário oficial para a chamada e registro dos apontamentos.</span>
            </p>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="comum_ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="comum_ativo" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              Congregação ativa com reuniões e apontamentos regulares
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Atualizar Congregação' : 'Cadastrar Congregação'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
