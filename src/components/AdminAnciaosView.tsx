import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  Building2, 
  MapPin, 
  Filter,
  CheckCircle2,
  XCircle,
  X,
  Check
} from 'lucide-react';
import { Anciao, Setor } from '../types';
import { Pagination } from './Pagination';

interface AdminAnciaosViewProps {
  setores?: Setor[];
}

export const AdminAnciaosView: React.FC<AdminAnciaosViewProps> = ({ setores: propSetores }) => {
  const [anciaos, setAnciaos] = useState<Anciao[]>([]);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetorFilter, setSelectedSetorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const [formData, setFormData] = useState({
    nome: '',
    setor_id: '',
    setor_pertencente: '',
    data_cadastro: new Date().toISOString().split('T')[0],
    ativo: true
  });

  const fetchAnciaos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/anciaos');
      if (res.ok) {
        const json = await res.json();
        setAnciaos(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar anciãos:', err);
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchAnciaos();
    if (!propSetores || propSetores.length === 0) {
      fetchSetores();
    } else {
      setSetores(propSetores);
    }
  }, [propSetores]);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ 
      nome: '', 
      setor_id: '',
      setor_pertencente: '',
      data_cadastro: new Date().toISOString().split('T')[0], 
      ativo: true 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Anciao) => {
    setEditingId(a.id);
    let matchedSetorId = a.setor_id || '';
    if (!matchedSetorId && a.setor_pertencente) {
      const match = setores.find(s => s.nome.toLowerCase() === a.setor_pertencente?.toLowerCase());
      if (match) matchedSetorId = match.id;
    }

    setFormData({ 
      nome: a.nome, 
      setor_id: matchedSetorId,
      setor_pertencente: a.setor_pertencente || '',
      data_cadastro: a.data_cadastro || '', 
      ativo: a.ativo 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja excluir o ancião ${nome}? Isso deixará congregações sem ancião vinculado caso ele esteja em uso.`)) {
      try {
        const res = await fetch(`/api/anciaos/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || 'Erro ao excluir');
        }
        window.dispatchEvent(new CustomEvent('anciaos-updated'));
        fetchAnciaos();
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  const handleSetorChange = (setorId: string) => {
    const selected = setores.find(s => s.id === setorId);
    setFormData({
      ...formData,
      setor_id: setorId,
      setor_pertencente: selected ? selected.nome : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let setorPertencente = formData.setor_pertencente;
      if (formData.setor_id && !setorPertencente) {
        const selected = setores.find(s => s.id === formData.setor_id);
        if (selected) setorPertencente = selected.nome;
      }

      const payload = {
        nome: formData.nome.trim(),
        setor_id: formData.setor_id || null,
        setor_pertencente: setorPertencente || null,
        data_cadastro: formData.data_cadastro || undefined,
        ativo: formData.ativo
      };

      const url = editingId ? `/api/anciaos/${editingId}` : '/api/anciaos';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Erro ao salvar ancião');
      }

      setIsModalOpen(false);
      window.dispatchEvent(new CustomEvent('anciaos-updated'));
      await fetchAnciaos();
    } catch (err: any) {
      console.error('Erro ao salvar ancião:', err);
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const filtered = anciaos.filter(a => {
    const matchSearch = !searchTerm || 
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.setor_pertencente && a.setor_pertencente.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchSetor = !selectedSetorFilter || 
      (a.setor_pertencente && a.setor_pertencente.toLowerCase().includes(selectedSetorFilter.toLowerCase())) ||
      a.setor_id === selectedSetorFilter;

    return matchSearch && matchSetor;
  });

  if (sortConfig) {
    filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      if (sortConfig.key === 'data_cadastro') {
        valA = a.data_cadastro ? new Date(a.data_cadastro).getTime() : 0;
        valB = b.data_cadastro ? new Date(b.data_cadastro).getTime() : 0;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Ordenação padrão por nome
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedAnciaos = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando anciãos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Anciãos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie o cadastro de Anciãos e seus respectivos setores pertencentes.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro por Setor */}
          <div className="relative">
            <select
              value={selectedSetorFilter}
              onChange={(e) => { setSelectedSetorFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.nome}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou setor..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botão Novo Ancião */}
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center space-x-2 transition cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Ancião</span>
          </button>
        </div>
      </div>

      {/* Tabela de Anciãos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('nome')}>
                  <div className="flex items-center space-x-1"><span>Nome</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('setor_pertencente')}>
                  <div className="flex items-center space-x-1"><span>Setor Pertencente</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('data_cadastro')}>
                  <div className="flex items-center space-x-1"><span>Data de Cadastro</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('ativo')}>
                  <div className="flex items-center space-x-1"><span>Status</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedAnciaos.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {a.nome}
                  </td>
                  <td className="px-6 py-4">
                    {a.setor_pertencente ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {a.setor_pertencente}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {a.data_cadastro ? new Date(a.data_cadastro + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {a.ativo ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenEdit(a)} 
                      title="Editar ancião"
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.id, a.nome)} 
                      title="Excluir ancião"
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum ancião encontrado.</td>
                </tr>
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

      {/* Modal de Cadastro / Edição de Ancião */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {editingId ? 'Editar Ancião' : 'Novo Ancião'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Setor Pertencente */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Setor Pertencente *
                </label>
                <select
                  required
                  value={formData.setor_id}
                  onChange={e => handleSetorChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione o Setor Pertencente...</option>
                  {setores.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              {/* Data de Cadastro */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Data de Cadastro
                </label>
                <input
                  type="date"
                  value={formData.data_cadastro}
                  onChange={e => setFormData({ ...formData, data_cadastro: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Ativo */}
              <div className="flex items-center space-x-2.5 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Status Ativo
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Ancião</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
