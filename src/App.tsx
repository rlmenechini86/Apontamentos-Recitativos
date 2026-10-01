import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Menu,
  LayoutDashboard,
  ClipboardCheck,
  KeyRound,
  UserCheck,
  Sun,
  Moon,
  LogOut,
  ArrowUpDown,
} from 'lucide-react';
import { Sidebar, NavRoute } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ApontamentosView } from './components/ApontamentosView';
import { AcompanhamentoSetorView } from './components/AcompanhamentoSetorView';
import { AcompanhamentoAnciaosView } from './components/AcompanhamentoAnciaosView';
import { ControleApontamentosView } from './components/ControleApontamentosView';
import { RelatorioAuxiliaresView } from './components/RelatorioAuxiliaresView';
import { RecitativosView } from './components/RecitativosView';
import { ContagensMocidadeView } from './components/ContagensMocidadeView';
import { PerfisAcessoView } from './components/PerfisAcessoView';
import { AuxiliaresCJMView } from './components/AuxiliaresCJMView';
import { LoginView } from './components/LoginView';
import { ComumFormModal } from './components/ComumFormModal';
import { UsuarioFormModal } from './components/UsuarioFormModal';
import { UsuarioListView } from './components/UsuarioListView';
import { AdminAnciaosView } from './components/AdminAnciaosView';
import { Pagination } from './components/Pagination';
import { ComumCongregacao, Setor, Perfil, Usuario, DbStatus } from './types';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dados de Comuns e Setores
  const [comuns, setComuns] = useState<ComumCongregacao[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [anciaos, setAnciaos] = useState<Anciao[]>([]);

  // Dados de Usuários e Perfis
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  // Estados de Carregamento e Conexão
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loadingComuns, setLoadingComuns] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'in-memory'>('in-memory');

  // Filtros Comuns
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnciaoId, setSelectedAnciaoId] = useState('');
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');
  const [comunsPage, setComunsPage] = useState(1);
  const comunsPerPage = 10;
  const [comunsSortConfig, setComunsSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleComunsSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (comunsSortConfig && comunsSortConfig.key === key && comunsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setComunsSortConfig({ key, direction });
  };

  useEffect(() => {
    setComunsPage(1);
  }, [searchTerm, selectedAnciaoId, selectedSecretarioId]);

  // Modais Comum
  const [isComumModalOpen, setIsComumModalOpen] = useState(false);
  const [editingComum, setEditingComum] = useState<ComumCongregacao | null>(null);

  // Modais Usuário
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  // Feedback Banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/comuns/meta/status');
      if (res.ok) {
        const json = await res.json();
        setStatus(json);
      }
    } catch {
      // Ignora erro inicial
    }
  };

  const fetchSetores = async () => {
    try {
      const res = await fetch('/api/comuns/meta/setores');
      if (res.ok) {
        const json = await res.json();
        setSetores(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar setores:', err);
    }
  };

  const fetchAnciaos = async () => {
    try {
      const res = await fetch('/api/anciaos');
      if (res.ok) {
        const json = await res.json();
        setAnciaos(json.data?.filter((a: any) => a.ativo) || []);
      }
    } catch (err) {
      console.error('Erro ao buscar anciãos:', err);
    }
  };

  const fetchPerfis = async () => {
    try {
      const res = await fetch('/api/usuarios/meta/perfis');
      if (res.ok) {
        const json = await res.json();
        setPerfis(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar perfis:', err);
    }
  };

  const fetchComuns = async () => {
    try {
      setLoadingComuns(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/comuns?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setComuns(json.data || []);
        if (json.source) setDataSource(json.source);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Erro ao carregar Comuns Congregações do backend.' });
    } finally {
      setLoadingComuns(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const json = await res.json();
        setUsuarios(json.data || []);
        if (json.source) setDataSource(json.source);
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Erro ao carregar lista de usuários.' });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSetores();
    fetchAnciaos();
    fetchPerfis();
    fetchComuns();
    fetchUsuarios();
  }, []);

  // --- HANDLERS COMUM ---
  const handleSaveComum = async (formData: Partial<ComumCongregacao>) => {
    try {
      if (editingComum) {
        const res = await fetch(`/api/comuns/${editingComum.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erro ao atualizar congregação.');
        setFeedbackMsg({ type: 'success', text: 'Comum Congregação atualizada com sucesso!' });
      } else {
        const res = await fetch('/api/comuns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erro ao cadastrar congregação.');
        setFeedbackMsg({ type: 'success', text: 'Comum Congregação cadastrada com sucesso!' });
      }

      await fetchComuns();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteComum = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir a congregação "${nome}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/comuns/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao excluir.');

      setFeedbackMsg({ type: 'success', text: `Comum Congregação "${nome}" removida com sucesso.` });
      await fetchComuns();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao excluir congregação.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // --- HANDLERS USUÁRIO ---
  const handleSaveUsuario = async (formData: Partial<Usuario>) => {
    try {
      if (editingUsuario) {
        const res = await fetch(`/api/usuarios/${editingUsuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erro ao atualizar usuário.');
        setFeedbackMsg({ type: 'success', text: 'Usuário atualizado com sucesso!' });
      } else {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Erro ao cadastrar usuário.');
        setFeedbackMsg({ type: 'success', text: 'Usuário cadastrado com sucesso!' });
      }

      await fetchUsuarios();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteUsuario = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente remover o usuário "${nome}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao excluir.');

      setFeedbackMsg({ type: 'success', text: `Usuário "${nome}" removido com sucesso.` });
      await fetchUsuarios();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao excluir usuário.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Filtragem local complementar para resposta instantânea
  const filteredComuns = comuns.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAnciao = !selectedAnciaoId || item.anciao_id === selectedAnciaoId;
    const matchesSecretario = !selectedSecretarioId || item.secretario_id === selectedSecretarioId;

    return matchesSearch && matchesAnciao && matchesSecretario;
  });

  if (comunsSortConfig) {
    filteredComuns.sort((a, b) => {
      let valA: any = a[comunsSortConfig.key as keyof typeof a];
      let valB: any = b[comunsSortConfig.key as keyof typeof b];

      if (comunsSortConfig.key === 'anciao') {
        valA = anciaos.find(an => an.id === a.anciao_id)?.nome || '';
        valB = anciaos.find(an => an.id === b.anciao_id)?.nome || '';
      } else if (comunsSortConfig.key === 'secretario') {
        valA = usuarios.find(u => u.id === a.secretario_id)?.nome_completo || '';
        valB = usuarios.find(u => u.id === b.secretario_id)?.nome_completo || '';
      }

      if (valA < valB) return comunsSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return comunsSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort by nome
    filteredComuns.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const comunsTotalPages = Math.ceil(filteredComuns.length / comunsPerPage);
  const paginatedComuns = filteredComuns.slice((comunsPage - 1) * comunsPerPage, comunsPage * comunsPerPage);

  const getRouteTitle = () => {
    switch (currentRoute) {
      case 'dashboard':
        return {
          title: 'Dashboard Geral',
          category: 'Visão Consolidada',
          icon: <LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'apontamentos':
        return {
          title: 'Apontamentos Semanais',
          category: 'Reunião de Jovens e Menores',
          icon: <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'acompanhamento-setor':
        return {
          title: 'Acompanhamento de Recitativos',
          category: 'Gestão de Setor',
          icon: <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'admin-comuns':
        return {
          title: 'Comum Congregação',
          category: 'Administração',
          icon: <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'admin-usuarios':
        return {
          title: 'Gestão de Usuários',
          category: 'Administração',
          icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'admin-perfis':
        return {
          title: 'Perfis de Acesso (RBAC)',
          category: 'Administração',
          icon: <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'admin-auxiliares':
        return {
          title: 'Auxiliares de Jovens',
          category: 'Administração',
          icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
      default:
        return {
          title: 'Dashboard',
          category: 'Sistema',
          icon: <LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        };
    }
  };

  const routeInfo = getRouteTitle();

  // Se não estiver autenticado, exibe a tela de Login e Cadastro de Senha Criptografada
  if (!isAuthenticated) {
    return <LoginView perfis={perfis} comuns={comuns} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Menu Vertical Lado Esquerdo */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
        status={status}
        comunsCount={comuns.length}
        usuariosCount={usuarios.length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo (Lado Direito) */}
      <div className="flex-1 lg:pl-72 print:pl-0 flex flex-col min-w-0 min-h-screen print:min-h-0 print:h-auto print:block">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            {/* Botão Hamburger (Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Título da Rota Ativa */}
            <div className="flex items-center space-x-2.5">
              <div className="hidden sm:flex items-center justify-center">
                {routeInfo.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    {routeInfo.category}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Guarulhos / SP</span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  {routeInfo.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Ações Rápidas Topbar */}
          <div className="flex items-center space-x-2">
            {/* Toggle de Tema Claro/Escuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            <button
              onClick={() => {
                fetchComuns();
                fetchUsuarios();
                fetchStatus();
              }}
              title="Atualizar dados"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              title="Sair do Sistema (Logout)"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {currentRoute === 'admin-comuns' && (
              <button
                onClick={() => {
                  setEditingComum(null);
                  setIsComumModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Comum</span>
              </button>
            )}

            {currentRoute === 'admin-usuarios' && (
              <button
                onClick={() => {
                  setEditingUsuario(null);
                  setIsUsuarioModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Usuário</span>
              </button>
            )}
          </div>
        </header>

        {/* Conteúdo Central da Página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[98%] w-full mx-auto print:p-0 print:max-w-none print:block">
          {/* Banner de Feedback */}
          {feedbackMsg && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 text-sm border animate-in fade-in duration-200 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* ROTA 1: DASHBOARD */}
          {currentRoute === 'dashboard' && (
            <DashboardView
              comuns={comuns}
              setores={setores}
              usuarios={usuarios}
              onNavigate={setCurrentRoute}
              onOpenNovaComum={() => {
                setEditingComum(null);
                setIsComumModalOpen(true);
              }}
              onOpenNovoUsuario={() => {
                setEditingUsuario(null);
                setIsUsuarioModalOpen(true);
              }}
            />
          )}

          {/* ROTA 2.1: ACOMPANHAMENTO SETOR */}
          {currentRoute === 'acompanhamento-setor' && (
            <AcompanhamentoSetorView comuns={comuns} usuarios={usuarios} />
          )}

          {/* ROTA 2.2: ACOMPANHAMENTO ANCIÃOS */}
          {currentRoute === 'acompanhamento-anciaos' && (
            <AcompanhamentoAnciaosView comuns={comuns} anciaos={anciaos} />
          )}

          {/* ROTA 2.3: CONTROLE DE APONTAMENTOS */}
          {currentRoute === 'controle-apontamentos' && (
            <ControleApontamentosView usuarios={usuarios} />
          )}

          {/* ROTA 2.4: RELATORIO DE AUXILIARES */}
          {currentRoute === 'relatorio-auxiliares' && (
            <RelatorioAuxiliaresView comuns={comuns} usuarios={usuarios} />
          )}

          {/* ROTA 2.3: APONTAMENTOS - RECITATIVOS */}
          {currentRoute === 'apontamentos-recitativos' && (
            <RecitativosView comuns={comuns} usuarios={usuarios} />
          )}

          {/* ROTA 2.3: APONTAMENTOS - CONTAGENS */}
          {currentRoute === 'apontamentos-contagens' && (
            <ContagensMocidadeView comuns={comuns} usuarios={usuarios} />
          )}

          {/* ROTA 3: ADMINISTRAÇÃO -> COMUM CONGREGAÇÃO */}
          {currentRoute === 'admin-comuns' && (
            <div className="space-y-6">
              {/* Barra de Busca e Filtros */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar congregação por nome ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <select
                      value={selectedAnciaoId}
                      onChange={(e) => setSelectedAnciaoId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="">Ancião (Todos)</option>
                      {anciaos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      value={selectedSecretarioId}
                      onChange={(e) => setSelectedSecretarioId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="">Secretário (Todos)</option>
                      {usuarios
                        .filter(u => u.cargo_ministerio === 'Secretário / CJM' && u.ativo)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome_completo}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      setEditingComum(null);
                      setIsComumModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center space-x-2 shadow-sm transition flex-shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Comum</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Comuns Congregações */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('codigo')}>
                          <div className="flex items-center space-x-1"><span>Código (Controle Interno)</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('nome')}>
                          <div className="flex items-center space-x-1"><span>Comum Congregação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('anciao')}>
                          <div className="flex items-center space-x-1"><span>Ancião</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('secretario')}>
                          <div className="flex items-center space-x-1"><span>Secretário / CJM</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('dia_reuniao_jovens')}>
                          <div className="flex items-center space-x-1"><span>Reunião de Jovens</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleComunsSort('ativo')}>
                          <div className="flex items-center space-x-1"><span>Status</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                        </th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                      {loadingComuns ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            <div className="flex items-center justify-center space-x-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                              <span>Carregando congregações...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredComuns.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            <Building2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhuma Comum Congregação encontrada.</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Clique em "Nova Comum" para cadastrar a primeira congregação.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedComuns.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {item.codigo || '-'}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                              {item.nome}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {anciaos.find(a => a.id === item.anciao_id)?.nome || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {usuarios.find(u => u.id === item.secretario_id)?.nome_completo || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                              <div className="flex items-center space-x-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <span>{item.dia_reuniao_jovens || 'Não informado'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                  item.ativo
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {item.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingComum(item);
                                    setIsComumModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComum(item.id, item.nome)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={comunsPage}
                  totalPages={comunsTotalPages}
                  totalItems={filteredComuns.length}
                  itemsPerPage={comunsPerPage}
                  onPageChange={setComunsPage}
                />
              </div>
            </div>
          )}

          {/* ROTA 4: ADMINISTRAÇÃO -> USUÁRIOS */}
          {currentRoute === 'admin-usuarios' && (
            <UsuarioListView
              usuarios={usuarios}
              perfis={perfis}
              comuns={comuns}
              loading={loadingUsuarios}
              onRefresh={fetchUsuarios}
              onOpenCreate={() => {
                setEditingUsuario(null);
                setIsUsuarioModalOpen(true);
              }}
              onOpenEdit={(user: Usuario) => {
                setEditingUsuario(user);
                setIsUsuarioModalOpen(true);
              }}
              onDelete={(id: string, nome: string) => handleDeleteUsuario(id, nome)}
              dataSource={dataSource}
            />
          )}

          {/* ROTA 5: ADMINISTRAÇÃO -> PERFIS DE ACESSO */}
          {currentRoute === 'admin-perfis' && (
            <PerfisAcessoView
              perfis={perfis}
              usuarios={usuarios}
              onManageUsers={() => setCurrentRoute('admin-usuarios')}
            />
          )}

          {/* ROTA 6: ADMINISTRAÇÃO -> ANCIÃOS */}
          {currentRoute === 'admin-anciaos' && (
            <AdminAnciaosView />
          )}

          {/* ROTA 7: ADMINISTRAÇÃO -> AUXILIARES E CJM */}
          {currentRoute === 'admin-auxiliares' && (
            <AuxiliaresCJMView comuns={comuns} setores={setores} />
          )}
        </main>
      </div>

      {/* Modais Globais */}
      <ComumFormModal
        isOpen={isComumModalOpen}
        onClose={() => setIsComumModalOpen(false)}
        onSubmit={handleSaveComum}
        initialData={editingComum}
        setores={setores}
        usuarios={usuarios}
      />

      <UsuarioFormModal
        isOpen={isUsuarioModalOpen}
        onClose={() => setIsUsuarioModalOpen(false)}
        onSubmit={handleSaveUsuario}
        initialData={editingUsuario}
        perfis={perfis}
        comuns={comuns}
      />
    </div>
  );
}
