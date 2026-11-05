import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Heart,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Setor, ComumCongregacao } from '../types';

export const PreCadastroPublicoView: React.FC = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [comuns, setComuns] = useState<ComumCongregacao[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form states
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [comumId, setComumId] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [cargo, setCargo] = useState('Secretário / CJM');
  const [dataApresentacao, setDataApresentacao] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [anoCasamento, setAnoCasamento] = useState('');
  const [seladoPromessa, setSeladoPromessa] = useState('');
  const [anoBatismo, setAnoBatismo] = useState('');

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    nome_completo: string;
    email: string;
    setor_nome: string;
    comum_nome: string;
    cargo: string;
  } | null>(null);

  // Carrega setores e comuns públicos
  useEffect(() => {
    fetch('/api/pre-cadastros/public-meta')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSetores(json.data.setores || []);
          setComuns(json.data.comuns || []);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar dados auxiliares:', err);
        setErrorMessage('Não foi possível carregar os setores e congregações. Tente novamente mais tarde.');
      })
      .finally(() => {
        setLoadingMeta(false);
      });
  }, []);

  // Máscara de telefone
  const maskPhone = (v: string) => {
    let r = v.replace(/\D/g, '');
    r = r.replace(/^(\d{2})(\d)/g, '($1) $2');
    r = r.replace(/(\d)(\d{4})$/, '$1-$2');
    return r.substring(0, 15);
  };

  // Comuns filtradas pelo setor selecionado
  const comunsFiltradas = useMemo(() => {
    if (!selectedSetorId) return [];
    const setorObj = setores.find((s) => s.id === selectedSetorId);
    return comuns.filter(
      (c) =>
        c.setor_id === selectedSetorId ||
        (setorObj && c.setor_pertencente === setorObj.nome)
    );
  }, [comuns, setores, selectedSetorId]);

  // Se o cargo é CJM ou Secretário / CJM
  const isCjmOrSecretario = useMemo(() => {
    const c = cargo.toLowerCase();
    return c.includes('cjm') || c.includes('secretário');
  }, [cargo]);

  const currentYear = new Date().getFullYear();

  // Cálculo tempo de ministério
  const tempoMinisterio = useMemo(() => {
    if (!dataApresentacao) return null;
    const parts = dataApresentacao.split('-');
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const startDate = new Date(y, m, d);
    const today = new Date();
    if (startDate > today) return { texto: 'Data futura', valido: false };

    let years = today.getFullYear() - startDate.getFullYear();
    let months = today.getMonth() - startDate.getMonth();
    if (today.getDate() < startDate.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return null;
    if (years === 0 && months === 0) return { texto: 'Apresentado recentemente (< 1 mês)', valido: true };
    if (years === 0) return { texto: `${months} ${months === 1 ? 'mês' : 'meses'} de ministério`, valido: true };
    if (months === 0) return { texto: `${years} ${years === 1 ? 'ano' : 'anos'} de ministério`, valido: true };
    return { texto: `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'} de ministério`, valido: true };
  }, [dataApresentacao]);

  // Cálculo idade
  const idade = useMemo(() => {
    if (!dataNascimento) return null;
    const parts = dataNascimento.split('-');
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

    const birthDate = new Date(y, m, d);
    const today = new Date();
    if (birthDate > today) return { texto: 'Data futura', valido: false };

    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 0) return null;
    return { texto: `${age} ${age === 1 ? 'ano' : 'anos'}`, valido: true };
  }, [dataNascimento]);

  // Cálculo anos casado
  const anosCasado = useMemo(() => {
    if (!anoCasamento) return null;
    const y = parseInt(anoCasamento, 10);
    if (isNaN(y) || y < 1940 || y > currentYear) return null;
    return currentYear - y;
  }, [anoCasamento, currentYear]);

  // Cálculo anos batismo
  const anosBatismo = useMemo(() => {
    if (!anoBatismo) return null;
    const y = parseInt(anoBatismo, 10);
    if (isNaN(y) || y < 1940 || y > currentYear) return null;
    return currentYear - y;
  }, [anoBatismo, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSetorId) {
      setErrorMessage('Por favor, selecione o Setor Pertencente.');
      return;
    }
    if (!comumId) {
      setErrorMessage('Por favor, selecione a Comum Congregação.');
      return;
    }
    if (!nomeCompleto.trim()) {
      setErrorMessage('O Nome Completo é obrigatório.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }
    if (!celular.trim() || celular.replace(/\D/g, '').length < 10) {
      setErrorMessage('Informe um celular/WhatsApp com DDD válido.');
      return;
    }

    const setorObj = setores.find((s) => s.id === selectedSetorId);
    const comumObj = comuns.find((c) => c.id === comumId);

    setIsSubmitting(true);
    try {
      const payload = {
        setor_id: selectedSetorId,
        setor_pertencente: setorObj?.nome || '',
        comum_congregacao_id: comumId,
        nome_completo: nomeCompleto.trim(),
        email: email.trim(),
        celular: celular.trim(),
        cargo: cargo.trim(),
        data_apresentacao: dataApresentacao || null,
        data_nascimento: dataNascimento || null,
        ano_casamento: isCjmOrSecretario && anoCasamento ? Number(anoCasamento) : null,
        selado_promessa: isCjmOrSecretario && seladoPromessa ? seladoPromessa === 'Sim' : null,
        ano_batismo: isCjmOrSecretario && anoBatismo ? Number(anoBatismo) : null,
      };

      const res = await fetch('/api/pre-cadastros/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Erro ao enviar dados do pré-cadastro.');
      }

      setSuccessData({
        nome_completo: nomeCompleto.trim(),
        email: email.trim(),
        setor_nome: setorObj?.nome || '',
        comum_nome: comumObj?.nome || '',
        cargo: cargo.trim(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocorreu um erro ao enviar suas informações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setErrorMessage(null);
    setSelectedSetorId('');
    setComumId('');
    setNomeCompleto('');
    setEmail('');
    setCelular('');
    setCargo('Secretário / CJM');
    setDataApresentacao('');
    setDataNascimento('');
    setAnoCasamento('');
    setSeladoPromessa('');
    setAnoBatismo('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl">
        {/* Top Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-3.5">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Controle de Apontamentos
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-1">
            Ficha de Pré-Cadastro de Usuário
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Preencha seus dados para solicitação de acesso. O cadastro será analisado pela administração para liberação do perfil.
          </p>
        </div>

        {/* TELA DE SUCESSO */}
        {successData ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Dados Cadastrados com Sucesso!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
              Obrigado, <strong>{successData.nome_completo}</strong>! Suas informações foram enviadas para análise da administração. Em breve você receberá as instruções para o primeiro acesso.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 text-left border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-2 mb-8 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">E-mail:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Setor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.setor_nome}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Comum:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{successData.comum_nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cargo:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{successData.cargo}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
            >
              Realizar outro pré-cadastro
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE PRÉ-CADASTRO */
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Dados de Identificação e Congregação</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Campos marcados com asterisco (*) são de preenchimento obrigatório.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. SELEÇÃO DE SETOR E COMUM (COM FILTRO DEPENDENTE) */}
              <div className="bg-emerald-50/50 dark:bg-slate-850/60 p-4 sm:p-5 rounded-2xl border border-emerald-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Localidade / Região</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Setor Pertencente */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Setor Pertencente *
                    </label>
                    <select
                      required
                      value={selectedSetorId}
                      onChange={(e) => {
                        setSelectedSetorId(e.target.value);
                        setComumId(''); // limpa congregação ao trocar o setor
                      }}
                      disabled={loadingMeta}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
                    >
                      <option value="">Selecione o Setor...</option>
                      {setores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comum Congregação */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                      Comum Congregação *
                    </label>
                    <select
                      required
                      value={comumId}
                      onChange={(e) => setComumId(e.target.value)}
                      disabled={!selectedSetorId || loadingMeta}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!selectedSetorId
                          ? 'Selecione o setor primeiro...'
                          : comunsFiltradas.length === 0
                          ? 'Nenhuma comum encontrada'
                          : 'Selecione a Comum Congregação...'}
                      </option>
                      {comunsFiltradas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.codigo ? `${c.codigo} - ` : ''}
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. DADOS PESSOAIS */}
              <div className="space-y-4">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>

                {/* Email e Celular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>E-mail *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Celular / WhatsApp *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={celular}
                      onChange={(e) => setCelular(maskPhone(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargo / Ministério *
                  </label>
                  <select
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition cursor-pointer"
                  >
                    <option value="Secretário / CJM">Secretário / CJM</option>
                    <option value="CJM">CJM (Cooperador de Jovens e Menores)</option>
                    <option value="Auxiliar de Jovens">Auxiliar de Jovens</option>
                    <option value="Ancião">Ancião</option>
                    <option value="Nenhum">Nenhum / Membro</option>
                  </select>
                </div>

                {/* Datas: Apresentação e Nascimento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Data de Apresentação */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Data de Apresentação</span>
                    </label>
                    <input
                      type="date"
                      value={dataApresentacao}
                      onChange={(e) => setDataApresentacao(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                    <div className="min-h-[22px] mt-1.5 flex items-center">
                      {tempoMinisterio && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            tempoMinisterio.valido
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {tempoMinisterio.texto}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Data de Nascimento</span>
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                    <div className="min-h-[22px] mt-1.5 flex items-center">
                      {idade && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            idade.valido
                              ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {idade.texto}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CAMPOS ESPECÍFICOS PARA CJM E SECRETÁRIO / CJM */}
              {isCjmOrSecretario && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-800/60 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Dados Complementares do Ministério ({cargo})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-start">
                    {/* Ano do Casamento */}
                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1 h-5 whitespace-nowrap mb-1 overflow-hidden">
                        <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Ano Casamento</span>
                      </label>
                      <input
                        type="number"
                        min="1940"
                        max={currentYear}
                        placeholder="Ex: 2016"
                        value={anoCasamento}
                        onChange={(e) => setAnoCasamento(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <div className="min-h-[20px] flex items-center mt-1">
                        {anosCasado !== null && (
                          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 truncate">
                            {anosCasado === 0 ? 'Casou este ano' : `${anosCasado} anos de casado`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selado com a Promessa */}
                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1 h-5 whitespace-nowrap mb-1 overflow-hidden">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Selado Promessa?</span>
                      </label>
                      <select
                        value={seladoPromessa}
                        onChange={(e) => setSeladoPromessa(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                      <div className="min-h-[20px] flex items-center mt-1">
                        {seladoPromessa && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 truncate">
                            {seladoPromessa === 'Sim' ? '✓ Selado c/ Promessa' : 'Não selado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ano de Batismo */}
                    <div className="flex flex-col min-w-0">
                      <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1 h-5 whitespace-nowrap mb-1 overflow-hidden">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">Ano Batismo</span>
                      </label>
                      <input
                        type="number"
                        min="1940"
                        max={currentYear}
                        placeholder="Ex: 2011"
                        value={anoBatismo}
                        onChange={(e) => setAnoBatismo(e.target.value)}
                        className="w-full h-9 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <div className="min-h-[20px] flex items-center mt-1">
                        {anosBatismo !== null && (
                          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 truncate">
                            {anosBatismo === 0 ? 'Batizado este ano' : `${anosBatismo} anos de batismo`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando Dados...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Pré-Cadastro</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
          © 2026 Controle de Apontamentos — Uso exclusivo eclesiástico interno (CCB)
        </div>
      </div>
    </div>
  );
};
