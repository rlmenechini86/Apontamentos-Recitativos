import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { validatePassword } from '../utils/passwordValidator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Perfil, ComumCongregacao } from '../types';

interface LoginViewProps {
  perfis: Perfil[];
  comuns: ComumCongregacao[];
}

export const LoginView: React.FC<LoginViewProps> = ({ perfis, comuns }) => {
  const { login, register, setPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register' | 'set_password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [celular, setCelular] = useState('');
  const [perfilId, setPerfilId] = useState(perfis[0]?.id || '');
  const [comumId, setComumId] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  
  const maskPhone = (v: string) => {
    let r = v.replace(/\D/g, "");
    r = r.replace(/^(\d{2})(\d)/g, "($1) $2");
    r = r.replace(/(\d)(\d{4})$/, "$1-$2");
    return r.substring(0, 15);
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Real-time password validation
  const pwdValidation = validatePassword(senha);

  const getStrengthColor = () => {
    switch (pwdValidation.score) {
      case 0:
      case 1:
      case 2:
        return 'bg-rose-500 text-rose-500';
      case 3:
      case 4:
        return 'bg-amber-500 text-amber-500';
      case 5:
        return 'bg-emerald-500 text-emerald-500';
      default:
        return 'bg-slate-300 dark:bg-slate-700 text-slate-400';
    }
  };

  const getStrengthLabel = () => {
    switch (pwdValidation.score) {
      case 0:
      case 1:
        return 'Muito Fraca';
      case 2:
        return 'Fraca';
      case 3:
        return 'Média';
      case 4:
        return 'Boa';
      case 5:
        return 'Excelente (Segura)';
      default:
        return '';
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setLoading(true);
      await login(email, senha);
    } catch (err: any) {
      if (err.message === 'REQUIRE_PASSWORD_CHANGE') {
        setMode('set_password');
        setSenha(''); // Clear the default password
        setErrorMsg('Este é o seu primeiro acesso. Por favor, cadastre uma nova senha segura para continuar.');
      } else {
        setErrorMsg(err.message || 'Erro ao efetuar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pwdValidation.isValid) {
      setErrorMsg('A senha precisa cumprir todos os 5 requisitos de segurança listados abaixo.');
      return;
    }

    if (senha !== confirmSenha) {
      setErrorMsg('A confirmação da senha não coincide com a senha digitada.');
      return;
    }

    try {
      setLoading(true);
      await register({
        nome_completo: nomeCompleto,
        email,
        celular,
        senha,
        perfil_id: perfilId || undefined,
        comum_congregacao_id: comumId || null,
      });
      setSuccessMsg('Conta criada com sucesso com senha criptografada! Redirecionando...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!pwdValidation.isValid) {
      setErrorMsg('A senha precisa cumprir todos os 5 requisitos de segurança listados abaixo.');
      return;
    }

    if (senha !== confirmSenha) {
      setErrorMsg('A confirmação da senha não coincide com a senha digitada.');
      return;
    }

    try {
      setLoading(true);
      await setPassword(email, senha);
      setSuccessMsg('Senha cadastrada e criptografada com sucesso! Você já pode realizar o login.');
      setTimeout(() => {
        setMode('login');
        setSenha('');
        setConfirmSenha('');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar senha.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setSenha(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Botão de Tema no Topo Direito */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-600" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo Institucional */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950/50 mb-3">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Controle de Apontamentos
          </h1>
          <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
            Reunião de Jovens e Menores • Regional Guarulhos
          </p>
        </div>

        {/* Caixa de Autenticação */}
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 py-8 px-6 sm:px-8 shadow-sm rounded-2xl">
          {/* Mensagens de Feedback */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-start space-x-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}


          {/* 1. FORMULÁRIO DE LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  E-mail institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="seu.email@ccb.org.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('set_password');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Cadastrar nova senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha criptografada"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Autenticando...</span>
                ) : (
                  <>
                    <span>Acessar Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* 2. FORMULÁRIO DE CADASTRO COM SENHA CRIPTOGRAFADA */}
          {(mode === 'register' || mode === 'set_password') && (
            <form
              onSubmit={mode === 'register' ? handleRegisterSubmit : handleSetPasswordSubmit}
              className="space-y-3.5"
            >
              {mode === 'set_password' && (
                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs">
                  Informe o seu e-mail cadastrado e crie uma nova senha criptografada de alta segurança.
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: Irmão Lucas Andrade"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  E-mail institucional *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    placeholder="seu.email@ccb.org.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Celular / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={celular}
                        onChange={(e) => setCelular(maskPhone(e.target.value))}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Perfil
                      </label>
                      <select
                        value={perfilId}
                        onChange={(e) => setPerfilId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        {perfis.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Comum
                      </label>
                      <select
                        value={comumId}
                        onChange={(e) => setComumId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="">-- Comum --</option>
                        {comuns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Campo Senha com Requisitos */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Senha Criptografada *</span>
                  <span className={`text-[10px] font-bold ${getStrengthColor()}`}>
                    {senha ? getStrengthLabel() : ''}
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Crie sua senha segura"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Barra de Progresso de Força */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pwdValidation.score <= 2
                        ? 'bg-rose-500'
                        : pwdValidation.score <= 4
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(pwdValidation.score / 5) * 100}%` }}
                  />
                </div>

                {/* Checklist Visual dos 5 Requisitos Estritos Solicitados */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-1.5 mt-2">
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Critérios de Segurança Obrigatórios:</span>
                  </div>

                  {/* 1. Mínimo 8 dígitos */}
                  <div className="flex items-center space-x-2 text-xs">
                    {pwdValidation.hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasMinLength
                          ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      No mínimo 8 dígitos
                    </span>
                  </div>

                  {/* 2. Letra Maiúscula */}
                  <div className="flex items-center space-x-2 text-xs">
                    {pwdValidation.hasUppercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasUppercase
                          ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      Pelo menos uma letra maiúscula (A-Z)
                    </span>
                  </div>

                  {/* 3. Letra Minúscula */}
                  <div className="flex items-center space-x-2 text-xs">
                    {pwdValidation.hasLowercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasLowercase
                          ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      Pelo menos uma letra minúscula (a-z)
                    </span>
                  </div>

                  {/* 4. Número */}
                  <div className="flex items-center space-x-2 text-xs">
                    {pwdValidation.hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasNumber
                          ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      Pelo menos um número (0-9)
                    </span>
                  </div>

                  {/* 5. Caractere Especial */}
                  <div className="flex items-center space-x-2 text-xs">
                    {pwdValidation.hasSpecialChar ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasSpecialChar
                          ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      Pelo menos um caractere especial (!@#$%...)
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmação de Senha */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha digitada"
                    value={confirmSenha}
                    onChange={(e) => setConfirmSenha(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmSenha && senha !== confirmSenha && (
                  <span className="text-[11px] text-rose-500">As senhas não coincidem.</span>
                )}
              </div>

              {/* Badge de Criptografia */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  Proteção com algoritmo <strong>bcrypt</strong> e salt criptográfico individual.
                </span>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  disabled={loading || !pwdValidation.isValid || senha !== confirmSenha}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-40 cursor-pointer"
                >
                  {loading ? (
                    <span>Salvando...</span>
                  ) : (
                    <span>{mode === 'register' ? 'Criar Conta' : 'Gravar Senha'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
