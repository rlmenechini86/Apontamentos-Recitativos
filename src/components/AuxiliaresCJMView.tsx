import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Filter,
  Plus,
  Search,
  Building2,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  Calendar,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { ComumCongregacao, Setor } from '../types';
import { Pagination } from './Pagination';
import { useAuth } from '../context/AuthContext';
import { getUserScope } from '../utils/permissions';

const INSTRUMENTOS_PADRAO = [
  'Violino', 'Viola', 'Celo', 'Flauta', 'Clarineta', 
  'Clarone', 'Trompete', 'Sax Alto', 'Sax Tenor', 
  'Sax Baritono', 'Euphonio', 'Trombone', 'Tuba'
];


export const FAMILIAS_INSTRUMENTOS = [
  'Cordas Friccionadas',
  'Madeiras',
  'Metais',
  'Teclas',
  'Outros / Não Classificado'
];

export const obterFamiliaInstrumento = (instrumento: string): string => {
  if (!instrumento) return '';
  const inst = instrumento.toLowerCase();
  
  if (inst.includes('violino') || inst.includes('viola') || inst.includes('celo') || inst.includes('violoncelo')) {
    return 'Cordas Friccionadas';
  }
  if (inst.includes('flauta') || inst.includes('clarineta') || inst.includes('clarone') || inst.includes('sax') || inst.includes('oboé') || inst.includes('fagote') || inst.includes('corne')) {
    return 'Madeiras';
  }
  if (inst.includes('trompete') || inst.includes('trombone') || inst.includes('euphonio') || inst.includes('bombardino') || inst.includes('tuba') || inst.includes('trompa') || inst.includes('cornet')) {
    return 'Metais';
  }
  if (inst.includes('acordeon') || inst.includes('órgão') || inst.includes('orgão') || inst.includes('orgao') || inst.includes('órgao') || inst.includes('teclado') || inst.includes('piano')) {
    return 'Teclas';
  }
  
  return 'Outros / Não Classificado';
};

export interface AuxiliarJovens {
  id: string;
  nome: string;
  data_apresentacao: string;
  sexo: 'Masculino' | 'Feminino';
  celular: string;
  data_nascimento: string;
  comum_id: string;
  comum_nome?: string;
  comum_congregacao?: { id: string, nome: string, codigo: string };
  ativo: boolean;
  is_auxiliar?: boolean;
  is_musico?: boolean;
  instrumento?: string;
  nome_responsavel?: string;
}

interface AuxiliaresCJMViewProps {
  comuns: ComumCongregacao[];
  setores?: Setor[];
}

export const AuxiliaresCJMView: React.FC<AuxiliaresCJMViewProps> = ({ comuns, setores: propSetores }) => {
  const { user } = useAuth();
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [auxiliares, setAuxiliares] = useState<AuxiliarJovens[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [todosInstrumentos, setTodosInstrumentos] = useState<string[]>(INSTRUMENTOS_PADRAO);
  const instrumentosDinamicos = todosInstrumentos;
  const [searchTerm, setSearchTerm] = useState('');

  const userScope = useMemo(() => getUserScope(user, comuns, setores), [user, comuns, setores]);
  
  // Filtros em cascata da barra superior: Setor Pertencente -> Congregações
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');

  useEffect(() => {
    if (userScope.isSetor && userScope.userSetorId) {
      setSelectedSetorId(userScope.userSetorId);
    } else if (userScope.isComum && userScope.userComumId) {
      setSelectedComumId(userScope.userComumId);
      if (userScope.userSetorId) {
        setSelectedSetorId(userScope.userSetorId);
      }
    }
  }, [userScope.isSetor, userScope.userSetorId, userScope.isComum, userScope.userComumId]);
  // Novos Filtros Avançados: Sexo, Auxiliar, Músico, Família e Instrumento
  const [selectedSexo, setSelectedSexo] = useState('');
  const [selectedAuxiliar, setSelectedAuxiliar] = useState(''); // '' | 'sim' | 'nao'
  const [selectedMusico, setSelectedMusico] = useState(''); // '' | 'sim' | 'nao'
  const [selectedFamilia, setSelectedFamilia] = useState('');
  const [selectedInstrumento, setSelectedInstrumento] = useState('');


  // Filtro de setor dentro do modal de cadastro/edição
  const [formSetorId, setFormSetorId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

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

  // Congregações filtradas pelo Setor selecionado na barra de filtros
  const comunsDoSetor = React.useMemo(() => {
    if (userScope.isComum && userScope.userComumId) {
      return comuns.filter(c => c.id === userScope.userComumId);
    }
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c => 
      c.setor_id === selectedSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId, userScope]);

  // Congregações filtradas pelo Setor selecionado dentro do modal
  const modalComunsFiltradas = React.useMemo(() => {
    if (!formSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === formSetorId);
    return comuns.filter(c => 
      c.setor_id === formSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, formSetorId]);

  const handleSetorFilterChange = (setorId: string) => {
    setSelectedSetorId(setorId);
    setSelectedComumId(''); // Limpa a congregação ao trocar o setor
    setCurrentPage(1);
  };

  const handleFormSetorChange = (setorId: string) => {
    setFormSetorId(setorId);
    // Se a comum atualmente selecionada não pertencer ao novo setor, reseta
    if (setorId) {
      const selectedSetor = setores.find(s => s.id === setorId);
      const isComumInSetor = comuns.some(c => 
        c.id === formData.comum_id && 
        (c.setor_id === setorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome))
      );
      if (!isComumInSetor) {
        setFormData(prev => ({ ...prev, comum_id: '' }));
      }
    }
  };

  useEffect(() => {
    fetch('/api/auxiliares')
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data)) {
          const fromDb = (json.data as AuxiliarJovens[]).map(a => a.instrumento).filter(Boolean) as string[];
          const unique = Array.from(new Set([...INSTRUMENTOS_PADRAO, ...fromDb]));
          setTodosInstrumentos(unique.sort());
        }
      })
      .catch(() => {});
  }, []);

  const instrumentosFiltradosPorFamilia = React.useMemo(() => {
    if (!selectedFamilia) return todosInstrumentos;
    return todosInstrumentos.filter(inst => obterFamiliaInstrumento(inst) === selectedFamilia);
  }, [todosInstrumentos, selectedFamilia]);


  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const [formData, setFormData] = useState({
    nome: '',
    data_apresentacao: '',
    sexo: 'Masculino' as 'Masculino' | 'Feminino',
    celular: '',
    data_nascimento: '',
    comum_id: comuns[0]?.id || '',
    ativo: true,
    is_auxiliar: true,
    is_musico: false,
    instrumento: '',
    nome_responsavel: '',
  });

  const fetchAuxiliares = async (pageToFetch = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageToFetch));
      params.set('limit', String(itemsPerPage));

      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedSetorId) params.set('setor_id', selectedSetorId);
      if (selectedComumId) params.set('comum_id', selectedComumId);
      if (selectedSexo) params.set('sexo', selectedSexo);
      if (selectedAuxiliar) params.set('auxiliar', selectedAuxiliar);
      if (selectedMusico) params.set('musico', selectedMusico);
      if (selectedFamilia) params.set('familia', selectedFamilia);
      if (selectedInstrumento) params.set('instrumento', selectedInstrumento);
      if (sortConfig?.key) {
        params.set('sort_by', sortConfig.key);
        params.set('sort_direction', sortConfig.direction);
      }

      const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
      if (isRestrictedProfile && user?.comum_congregacao_id) {
        params.set('comum_id', user.comum_congregacao_id);
      }

      const res = await fetch(`/api/auxiliares?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAuxiliares(json.data || []);
        setTotalCount(json.total || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar auxiliares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchAuxiliares(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    selectedSetorId,
    selectedComumId,
    selectedSexo,
    selectedAuxiliar,
    selectedMusico,
    selectedFamilia,
    selectedInstrumento,
    sortConfig
  ]);

  useEffect(() => {
    fetchAuxiliares(currentPage);
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const maskPhone = (v: string) => {
    let r = v.replace(/\D/g, "");
    r = r.replace(/^(\d{2})(\d)/g, "($1) $2");
    r = r.replace(/(\d)(\d{4})$/, "$1-$2");
    return r.substring(0, 15);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    const initialSetor = selectedSetorId || '';
    setFormSetorId(initialSetor);

    const initialComumList = initialSetor
      ? comuns.filter(c => c.setor_id === initialSetor || (setores.find(s => s.id === initialSetor) && c.setor_pertencente === setores.find(s => s.id === initialSetor)?.nome))
      : comuns;

    setFormData({
      nome: '',
      data_apresentacao: '',
      sexo: 'Masculino',
      celular: '',
      data_nascimento: '',
      comum_id: selectedComumId || initialComumList[0]?.id || comuns[0]?.id || '',
      ativo: true,
      is_auxiliar: true,
      is_musico: false,
      instrumento: '',
      nome_responsavel: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (aux: AuxiliarJovens) => {
    setEditingId(aux.id);
    const auxComum = comuns.find(c => c.id === aux.comum_id);
    const matchingSetor = setores.find(s => s.id === auxComum?.setor_id || (auxComum?.setor_pertencente && s.nome === auxComum.setor_pertencente));
    setFormSetorId(matchingSetor?.id || auxComum?.setor_id || '');
    setFormData({
      nome: aux.nome,
      data_apresentacao: aux.data_apresentacao || '',
      sexo: aux.sexo,
      celular: aux.celular || '',
      data_nascimento: aux.data_nascimento || '',
      comum_id: aux.comum_id || '',
      ativo: aux.ativo,
      is_auxiliar: aux.is_auxiliar ?? true,
      is_musico: aux.is_musico ?? false,
      instrumento: aux.instrumento || '',
      nome_responsavel: aux.nome_responsavel || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja remover o cadastro de "${nome}"?`)) {
      try {
        const res = await fetch(`/api/auxiliares/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setAuxiliares(auxiliares.filter((a) => a.id !== id));
        }
      } catch (err) {
        console.error('Erro ao deletar:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    try {
      const payload = {
        ...formData,
        instrumento: formData.is_musico ? formData.instrumento : null,
        data_apresentacao: formData.is_auxiliar ? (formData.data_apresentacao || null) : null,
        comum_id: formData.comum_id || null,
        data_nascimento: formData.data_nascimento || null,
      };

      if (editingId) {
        const res = await fetch(`/api/auxiliares/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchAuxiliares();
        }
      } else {
        const res = await fetch('/api/auxiliares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchAuxiliares();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Cadastro de Mocidade</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro de Jovens e Auxiliares das congregações.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cadastro</span>
        </button>
      </div>

      {/* Barra de Filtros Multifuncional */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Linha 1: Busca e Filtros de Localidade */}
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Busca por Nome ou Celular */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou celular..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 sm:py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* 1º Filtro: Setor Pertencente */}
            <div className="w-full sm:w-auto">
              <select
                disabled={userScope.isSetor || userScope.isComum}
                value={selectedSetorId}
                onChange={(e) => handleSetorFilterChange(e.target.value)}
                className={`w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${userScope.isSetor || userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
              >
                {!userScope.isSetor && !userScope.isComum && <option value="">Todos os Setores</option>}
                {(userScope.isSetor || userScope.isComum ? (userScope.userSetor ? [userScope.userSetor] : []) : setores).map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* 2º Filtro: Congregações */}
            <div className="w-full sm:w-auto">
              <select
                disabled={userScope.isComum}
                value={selectedComumId}
                onChange={(e) => { setSelectedComumId(e.target.value); setCurrentPage(1); }}
                className={`w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-xs ${userScope.isComum ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer'}`}
              >
                {!userScope.isComum && <option value="">{selectedSetorId ? 'Todas as Congregações deste Setor' : 'Todas as Congregações'}</option>}
                {comunsDoSetor.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo ? `${c.codigo} - ` : ''}{c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 self-end md:self-center whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {totalCount} {totalCount === 1 ? 'jovem' : 'jovens'}
          </span>
        </div>

        {/* Linha 2: Filtros Específicos (Sexo, Auxiliar, Músico, Família e Instrumento) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-slate-400 text-xs font-bold mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Filtros:</span>
          </div>

          {/* Filtro Sexo */}
          <select
            value={selectedSexo}
            onChange={(e) => { setSelectedSexo(e.target.value); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedSexo 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="">Sexo (Todos)</option>
            <option value="Masculino">Masculino (Moços)</option>
            <option value="Feminino">Feminino (Moças)</option>
          </select>

          {/* Filtro Auxiliar de Jovens */}
          <select
            value={selectedAuxiliar}
            onChange={(e) => { setSelectedAuxiliar(e.target.value); setCurrentPage(1); }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedAuxiliar 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="">Auxiliar (Todos)</option>
            <option value="sim">Apenas Auxiliares</option>
            <option value="nao">Não Auxiliares</option>
          </select>

          {/* Filtro Músico */}
          <select
            value={selectedMusico}
            onChange={(e) => { 
              setSelectedMusico(e.target.value); 
              if (e.target.value === 'nao') {
                setSelectedFamilia('');
                setSelectedInstrumento('');
              }
              setCurrentPage(1); 
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedMusico 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="">Músico (Todos)</option>
            <option value="sim">Apenas Músicos</option>
            <option value="nao">Não Músicos</option>
          </select>

          {/* Filtro Família de Instrumento */}
          <select
            value={selectedFamilia}
            onChange={(e) => { 
              setSelectedFamilia(e.target.value); 
              setSelectedInstrumento('');
              if (e.target.value) setSelectedMusico('sim');
              setCurrentPage(1); 
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedFamilia 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="">Família (Todas)</option>
            {FAMILIAS_INSTRUMENTOS.map(fam => (
              <option key={fam} value={fam}>{fam}</option>
            ))}
          </select>

          {/* Filtro Instrumento */}
          <select
            value={selectedInstrumento}
            onChange={(e) => { 
              setSelectedInstrumento(e.target.value); 
              if (e.target.value) {
                setSelectedMusico('sim');
                const fam = obterFamiliaInstrumento(e.target.value);
                if (fam && !selectedFamilia) setSelectedFamilia(fam);
              }
              setCurrentPage(1); 
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedInstrumento 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <option value="">Instrumento (Todos)</option>
            {instrumentosFiltradosPorFamilia.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>

          {/* Botão Limpar Filtros Ativos */}
          {(selectedSetorId || selectedComumId || searchTerm || selectedSexo || selectedAuxiliar || selectedMusico || selectedFamilia || selectedInstrumento) && (
            <button
              onClick={() => {
                setSelectedSetorId('');
                setSelectedComumId('');
                setSearchTerm('');
                setSelectedSexo('');
                setSelectedAuxiliar('');
                setSelectedMusico('');
                setSelectedFamilia('');
                setSelectedInstrumento('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold cursor-pointer px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition whitespace-nowrap ml-auto"
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Auxiliares e CJM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('nome')}>
                  <div className="flex items-center space-x-1"><span>Nome / Contato</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('nome_responsavel')}>
                  <div className="flex items-center space-x-1"><span>Responsável</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="hidden md:table-cell px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('sexo')}>
                  <div className="flex items-center space-x-1"><span>Detalhes</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('comum_nome')}>
                  <div className="flex items-center space-x-1"><span>Comum</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="hidden sm:table-cell px-2 sm:px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('is_auxiliar')}>
                  <div className="flex items-center justify-center space-x-1"><span>Aux</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="hidden sm:table-cell px-2 sm:px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('is_musico')}>
                  <div className="flex items-center justify-center space-x-1"><span>Mús</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="hidden xl:table-cell px-3 sm:px-4 py-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('instrumento')}>
                  <div className="flex items-center space-x-1"><span>Instrumento</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-2 sm:px-3 py-3 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('ativo')}>
                  <div className="flex items-center justify-center space-x-1"><span>Status</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-3 sm:px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Carregando auxiliares...</span>
                    </div>
                  </td>
                </tr>
              ) : auxiliares.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Nenhum cadastro encontrado.
                  </td>
                </tr>
              ) : (
                auxiliares.map((aux) => (
                  <tr key={aux.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{aux.nome}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{aux.celular || 'Sem telefone'}</span>
                        </span>
                        {aux.celular && (
                          <a
                            href={`https://wa.me/55${aux.celular.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        )}
                        {/* Badges em telas menores quando colunas forem ocultadas */}
                        {aux.is_auxiliar && (
                          <span className="sm:hidden bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1 rounded text-[9px] font-semibold">
                            Aux
                          </span>
                        )}
                        {aux.is_musico && (
                          <span className="sm:hidden bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1 rounded text-[9px] font-semibold">
                            Mús{aux.instrumento ? `: ${aux.instrumento}` : ''}
                          </span>
                        )}
                        {aux.nome_responsavel && (
                          <span className="lg:hidden text-slate-400 text-[10px]">
                            • Resp: {aux.nome_responsavel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-2.5 sm:py-3">
                      {aux.nome_responsavel ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {aux.nome_responsavel}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                        <div>Sexo: <span className="font-medium text-slate-800 dark:text-slate-200">{aux.sexo}</span></div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Apres: <span className="font-medium text-slate-800 dark:text-slate-200">{aux.data_apresentacao ? new Date(aux.data_apresentacao).toLocaleDateString('pt-BR') : '-'}</span></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      {aux.comum_congregacao?.nome || aux.comum_nome ? (
                        <div>
                          <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="font-medium text-xs sm:text-sm">{aux.comum_congregacao?.nome || aux.comum_nome}</span>
                          </div>
                          {(() => {
                            const c = comuns.find(item => item.id === aux.comum_id);
                            const setorNome = c?.setor_pertencente || setores.find(s => s.id === c?.setor_id)?.nome;
                            return setorNome ? (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-4 mt-0.5">
                                Setor: {setorNome}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                          Não informada
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${aux.is_auxiliar ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {aux.is_auxiliar ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${aux.is_musico ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {aux.is_musico ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-3 sm:px-4 py-2.5 sm:py-3">
                      {aux.is_musico && aux.instrumento ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {aux.instrumento}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          aux.ativo
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {aux.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEdit(aux)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal Novo / Editar Auxiliar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-semibold text-base flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{editingId ? 'Editar Cadastro' : 'Novo Cadastro'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Irmão Marcos Souza"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Nome do Responsável</label>
                <input
                  type="text"
                  placeholder="Responsável (se menor de idade)"
                  value={formData.nome_responsavel}
                  onChange={(e) => setFormData({ ...formData, nome_responsavel: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Sexo *</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Celular</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: maskPhone(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Setor Pertencente</label>
                  <select
                    value={formSetorId}
                    onChange={(e) => handleFormSetorChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="">-- Todos os Setores --</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-600 dark:text-slate-300">Comum Congregação *</label>
                  <select
                    value={formData.comum_id}
                    onChange={(e) => {
                      const chosenComumId = e.target.value;
                      setFormData({ ...formData, comum_id: chosenComumId });
                      if (chosenComumId && !formSetorId) {
                        const foundComum = comuns.find(c => c.id === chosenComumId);
                        const foundSetor = setores.find(s => s.id === foundComum?.setor_id || (foundComum?.setor_pertencente && s.nome === foundComum.setor_pertencente));
                        if (foundSetor) {
                          setFormSetorId(foundSetor.id);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer"
                    required
                  >
                    <option value="">-- Selecione a Comum Congregação --</option>
                    {modalComunsFiltradas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo ? `${c.codigo} - ` : ''}
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aux_ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="aux_ativo" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Cadastro ativo
                  </label>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_auxiliar"
                      checked={formData.is_auxiliar}
                      onChange={(e) => setFormData({ ...formData, is_auxiliar: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_auxiliar" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      Auxiliar de Jovens
                    </label>
                  </div>
                  {formData.is_auxiliar && (
                    <div className="mt-2 ml-6 space-y-1">
                      <label className="font-semibold uppercase text-slate-600 dark:text-slate-300 text-[10px]">Data de Apresentação</label>
                      <input
                        type="date"
                        value={formData.data_apresentacao}
                        onChange={(e) => setFormData({ ...formData, data_apresentacao: e.target.value })}
                        className="w-full sm:w-48 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_musico"
                    checked={formData.is_musico}
                    onChange={(e) => setFormData({ ...formData, is_musico: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_musico" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Músico
                  </label>
                </div>
              </div>

              {formData.is_musico && (
                <div className="space-y-4 mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2 block">Instrumento</label>
                      <select
                        value={formData.instrumento}
                        onChange={(e) => setFormData({ ...formData, instrumento: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-1 focus:ring-emerald-500"
                      >
                    <option value="">-- Selecione o Instrumento --</option>
                    {instrumentosDinamicos.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                      {formData.instrumento && !instrumentosDinamicos.includes(formData.instrumento) && (
                        <option value={formData.instrumento}>{formData.instrumento} (Adicionado)</option>
                      )}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2 block">Família do Instrumento</label>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {formData.instrumento ? obterFamiliaInstrumento(formData.instrumento) : '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input 
                      type="text" 
                      id="novo_instrumento"
                      placeholder="Outro instrumento (digite e adicione)..." 
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setFormData({ ...formData, instrumento: val });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('novo_instrumento') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          setFormData({ ...formData, instrumento: val });
                        }
                        input.value = '';
                      }}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-xs font-semibold hover:bg-emerald-200 transition-colors"
                    >
                      Adicionar / Usar
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
