import React, { useState, useEffect } from 'react';
import {
  UserCheck,
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

const INSTRUMENTOS_PADRAO = [
  'Violino', 'Viola', 'Celo', 'Flauta', 'Clarineta', 
  'Clarone', 'Trompete', 'Sax Alto', 'Sax Tenor', 
  'Sax Baritono', 'Euphonio', 'Trombone', 'Tuba'
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros em cascata da barra superior: Setor Pertencente -> Congregações
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');

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
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c => 
      c.setor_id === selectedSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId]);

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

  const instrumentosDinamicos = React.useMemo(() => {
    const fromDb = auxiliares.map(a => a.instrumento).filter(Boolean) as string[];
    const unique = Array.from(new Set([...INSTRUMENTOS_PADRAO, ...fromDb]));
    return unique.sort();
  }, [auxiliares]);

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

  const fetchAuxiliares = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auxiliares');
      if (res.ok) {
        const json = await res.json();
        setAuxiliares(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar auxiliares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliares();
  }, []);

  const filtered = auxiliares.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.celular && item.celular.includes(searchTerm));

    const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
    const matchesUserComum = isRestrictedProfile ? item.comum_id === user?.comum_congregacao_id : true;

    // Filtro por Setor
    let matchesFilterSetor = true;
    if (selectedSetorId) {
      const itemComum = comuns.find(c => c.id === item.comum_id);
      const selectedSetor = setores.find(s => s.id === selectedSetorId);
      matchesFilterSetor = Boolean(
        itemComum && (
          itemComum.setor_id === selectedSetorId || 
          (selectedSetor && itemComum.setor_pertencente === selectedSetor.nome)
        )
      );
    }

    // Filtro por Congregação específica
    const matchesFilterComum = selectedComumId ? item.comum_id === selectedComumId : true;

    return matchesSearch && matchesUserComum && matchesFilterSetor && matchesFilterComum;
  });

  if (sortConfig) {
    filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      if (sortConfig.key === 'comum_nome') {
        const comumA = comuns.find(c => c.id === a.comum_id)?.nome || '';
        const comumB = comuns.find(c => c.id === b.comum_id)?.nome || '';
        valA = comumA;
        valB = comumB;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort by name asc
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedAuxiliares = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      {/* Filtros em Cascata: Setor Pertencente -> Congregações */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Busca por Nome ou Celular */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou celular..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* 1º Filtro: Setor Pertencente */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedSetorId}
              onChange={(e) => handleSetorFilterChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todos os Setores</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* 2º Filtro: Congregações (filtradas pelo setor) */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedComumId}
              onChange={(e) => { setSelectedComumId(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="">{selectedSetorId ? 'Todas as Congregações deste Setor' : 'Todas as Congregações'}</option>
              {comunsDoSetor.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo ? `${c.codigo} - ` : ''}{c.nome}
                </option>
              ))}
            </select>
          </div>

          {(selectedSetorId || selectedComumId || searchTerm) && (
            <button
              onClick={() => {
                setSelectedSetorId('');
                setSelectedComumId('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition whitespace-nowrap"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {filtered.length} jovem(ns) cadastrado(s)
        </span>
      </div>

      {/* Tabela de Auxiliares e CJM */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('nome')}>
                  <div className="flex items-center space-x-1"><span>Nome Completo / Contato</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('nome_responsavel')}>
                  <div className="flex items-center space-x-1"><span>Responsável</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('sexo')}>
                  <div className="flex items-center space-x-1"><span>Detalhes</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('comum_nome')}>
                  <div className="flex items-center space-x-1"><span>Comum Congregação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('is_auxiliar')}>
                  <div className="flex items-center justify-center space-x-1"><span>Auxiliar</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('is_musico')}>
                  <div className="flex items-center justify-center space-x-1"><span>Músico</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('instrumento')}>
                  <div className="flex items-center space-x-1"><span>Instrumento</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('ativo')}>
                  <div className="flex items-center justify-center space-x-1"><span>Status</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-5 py-3.5 text-right">Ações</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Nenhum cadastro encontrado.
                  </td>
                </tr>
              ) : (
                paginatedAuxiliares.map((aux) => (
                  <tr key={aux.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{aux.nome}</div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{aux.celular || 'Sem telefone'}</span>
                        {aux.celular && (
                          <a
                            href={`https://wa.me/55${aux.celular.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 ml-1 inline-flex items-center"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {aux.nome_responsavel ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {aux.nome_responsavel}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-600 dark:text-slate-400">
                        <div>Sexo: <span className="font-medium text-slate-800 dark:text-slate-200">{aux.sexo}</span></div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Apresentação: <span className="font-medium text-slate-800 dark:text-slate-200">{aux.data_apresentacao ? new Date(aux.data_apresentacao).toLocaleDateString('pt-BR') : '-'}</span></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {aux.comum_congregacao?.nome || aux.comum_nome ? (
                        <div>
                          <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="font-medium">{aux.comum_congregacao?.nome || aux.comum_nome}</span>
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
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${aux.is_auxiliar ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {aux.is_auxiliar ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${aux.is_musico ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {aux.is_musico ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {aux.is_musico && aux.instrumento ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {aux.instrumento}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          aux.ativo
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {aux.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
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
          totalItems={filtered.length}
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
