import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  Check,
  AlertCircle,
  Info,
  Calendar,
} from 'lucide-react';
import { Usuario, Perfil, ComumCongregacao } from '../types';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<Usuario>) => Promise<void>;
  initialData?: Usuario | null;
  perfis: Perfil[];
  comuns: ComumCongregacao[];
}

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  perfis,
  comuns,
}) => {
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    celular: '',
    cargo_ministerio: '',
    data_apresentacao: '',
    data_nascimento: '',
    perfil_id: '',
    comum_congregacao_id: null as string | null,
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const defaultPerfilId = perfis[0]?.id || '';

      if (initialData) {
        setFormData({
          nome_completo: initialData.nome_completo || '',
          email: initialData.email || '',
          celular: initialData.celular || '',
          cargo_ministerio: initialData.cargo_ministerio || '',
          data_apresentacao: initialData.data_apresentacao ? initialData.data_apresentacao.substring(0, 10) : '',
          data_nascimento: initialData.data_nascimento ? initialData.data_nascimento.substring(0, 10) : '',
          perfil_id: initialData.perfil_id || defaultPerfilId,
          comum_congregacao_id: initialData.comum_congregacao_id || null,
          ativo: initialData.ativo !== undefined ? initialData.ativo : true,
        });
      } else {
        setFormData({
          nome_completo: '',
          email: '',
          celular: '',
          cargo_ministerio: '',
          data_apresentacao: '',
          data_nascimento: '',
          perfil_id: defaultPerfilId,
          comum_congregacao_id: null,
          ativo: true,
        });
      }
    }
  }, [isOpen, initialData, perfis]);

  if (!isOpen) return null;

  const selectedPerfil = perfis.find((p) => p.id === formData.perfil_id);

  const maskPhone = (v: string) => {
    let r = v.replace(/\D/g, "");
    r = r.replace(/^(\d{2})(\d)/g, "($1) $2");
    r = r.replace(/(\d)(\d{4})$/, "$1-$2");
    return r.substring(0, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações
    if (!formData.nome_completo.trim()) {
      setErrorMsg('O Nome Completo é obrigatório.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg('O E-mail é obrigatório.');
      return;
    }
    if (!formData.celular.trim()) {
      setErrorMsg('O Celular é obrigatório.');
      return;
    }
    if (!formData.perfil_id) {
      setErrorMsg('Selecione um Perfil de Acesso.');
      return;
    }

    // Regra 3 CCB: Se perfil for "Apontamento", a comum é estritamente obrigatória
    if (selectedPerfil?.nome === 'Apontamento' && !formData.comum_congregacao_id) {
      setErrorMsg('Para o perfil "Apontamento", a Comum Congregação de vínculo é obrigatória.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim(),
        cargo_ministerio: formData.cargo_ministerio || null,
        data_apresentacao: formData.data_apresentacao || null,
        data_nascimento: formData.data_nascimento || null,
        perfil_id: formData.perfil_id,
        comum_congregacao_id: formData.comum_congregacao_id || null,
        ativo: formData.ativo,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold">
              {initialData ? 'Editar Usuário' : 'Novo Usuário'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome Completo */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Irmão Roberto Carlos Silva"
              value={formData.nome_completo}
              onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          {/* E-mail e Celular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>E-mail *</span>
              </label>
              <input
                type="email"
                placeholder="nome@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Celular (WhatsApp) *</span>
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: maskPhone(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Cargo / Ministério */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span>Cargo / Ministério</span>
            </label>
            <select
              value={formData.cargo_ministerio}
              onChange={(e) => setFormData({ ...formData, cargo_ministerio: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="Nenhum">Nenhum</option>
              <option value="Secretário / CJM">Secretário / CJM</option>
              <option value="Auxiliar de Jovens">Auxiliar de Jovens</option>
              <option value="CJM">CJM</option>
              <option value="Ancião">Ancião</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Data de Apresentação</span>
              </label>
              <input
                type="date"
                value={formData.data_apresentacao}
                onChange={(e) => setFormData({ ...formData, data_apresentacao: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Data de Nascimento</span>
              </label>
              <input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Seleção do Perfil de Acesso */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              <span>Perfil de Acesso (RBAC) *</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {perfis.map((p) => {
                const isSelected = formData.perfil_id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, perfil_id: p.id })}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-white ring-1 ring-emerald-500/50 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{p.nome}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          p.nivel_acesso === 'global'
                            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                            : p.nivel_acesso === 'setor'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {p.nivel_acesso}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {p.nome === 'Administrador' && 'Visão global e irrestrita'}
                      {p.nome === 'CJM' && 'Visão consolidada do Setor'}
                      {p.nome === 'Apontamento' && 'Visão apenas da sua Comum'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vínculo com a Comum Congregação */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
                <span>Vínculo com a Comum Congregação</span>
              </label>
              {selectedPerfil?.nome === 'Apontamento' && (
                <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                  Obrigatório para Apontamento
                </span>
              )}
            </div>

            <select
              value={formData.comum_congregacao_id || ''}
              onChange={(e) => setFormData({ ...formData, comum_congregacao_id: e.target.value || null })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              <option value="">
                {selectedPerfil?.nome === 'Administrador'
                  ? 'Sem vínculo específico (Acesso Global)'
                  : '-- Selecione a Comum Congregação vinculada --'}
              </option>
              {comuns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo ? `${c.codigo} - ` : ''}
                  {c.nome}
                  {c.setores?.nome ? ` (${c.setores.nome})` : ''}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
              <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>
                {selectedPerfil?.nome === 'Apontamento'
                  ? 'O perfil Apontamento restringe os lançamentos estritamente à congregação selecionada.'
                  : 'Para perfis CJM ou Administrador, a congregação serve como referência de congregação base.'}
              </span>
            </p>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="usuario_ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="usuario_ativo" className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer">
              Usuário ativo com permissão de login no sistema
            </label>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
