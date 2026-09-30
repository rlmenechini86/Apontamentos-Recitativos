import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, RefreshCw, Trash2, Edit2, Calendar, Building2, User, ArrowUpDown } from 'lucide-react';
import { ContagemMocidade, ComumCongregacao } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './Pagination';
import { apiGet, clearApiCache } from '../utils/api';

interface ContagensMocidadeViewProps {
  comuns: ComumCongregacao[];
  usuarios?: Usuario[];
}

export const ContagensMocidadeView: React.FC<ContagensMocidadeViewProps> = ({ comuns, usuarios = [] }) => {
  const { user } = useAuth();
  const [contagens, setContagens] = useState<ContagemMocidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContagemMocidade | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchContagens = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/api/contagens');
      if (res.ok) {
        const json = await res.json();
        setContagens(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar contagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContagens();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta contagem?')) return;
    try {
      const res = await fetch(`/api/contagens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        clearApiCache('/api/contagens');
        fetchContagens();
      } else {
        alert('Erro ao excluir contagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir contagem.');
    }
  };

  const filtered = contagens.filter((item) => {
    const matchesSearch = item.comum_congregacao?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesComum = selectedComumId ? item.comum_id === selectedComumId : true;
    const matchesYear = selectedYear ? item.data?.startsWith(selectedYear) : true;
    const matchesTipo = selectedTipo ? item.tipo === selectedTipo : true;
    const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
    const matchesUserComum = isRestrictedProfile ? item.comum_id === user?.comum_congregacao_id : true;
    
    const matchesSecretario = !selectedSecretarioId || comuns.find(c => c.id === item.comum_id)?.secretario_id === selectedSecretarioId;

    return matchesSearch && matchesComum && matchesYear && matchesTipo && matchesUserComum && matchesSecretario;
  });

  if (sortConfig) {
    filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      if (sortConfig.key === 'comum_congregacao.nome') {
        valA = a.comum_congregacao?.nome || '';
        valB = b.comum_congregacao?.nome || '';
      } else if (sortConfig.key === 'usuario.nome_completo') {
        valA = a.usuario?.nome_completo || '';
        valB = b.usuario?.nome_completo || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    // Default sort by data desc
    filtered.sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedComumId, selectedYear, selectedTipo, selectedSecretarioId]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const availableYears = Array.from(new Set(contagens.map(c => c.data?.substring(0, 4)).filter(Boolean))).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
        
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full flex-1">
            <div className="relative">
              <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Buscar</span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nome da comum..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Comum</span>
              <select
                value={selectedComumId}
                onChange={(e) => setSelectedComumId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todas</option>
                {comuns.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Ano</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Tipo</span>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="Mocidade">Mocidade</option>
                <option value="Santa Ceia">Santa Ceia</option>
              </select>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Secretário</span>
              <select
                value={selectedSecretarioId}
                onChange={(e) => setSelectedSecretarioId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Todos</option>
                {usuarios
                  .filter(u => u.cargo_ministerio === 'Secretário / CJM' && u.ativo)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.nome_completo}</option>
                  ))}
              </select>
            </div>
          </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchContagens}
            title="Atualizar lista"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center space-x-2 shadow-sm transition flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Contagem</span>
          </button>
        </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('data')}>
                  <div className="flex items-center space-x-1"><span>Data</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('comum_congregacao.nome')}>
                  <div className="flex items-center space-x-1"><span>Comum Congregação</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('tipo')}>
                  <div className="flex items-center space-x-1"><span>Tipo</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-center font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('quantidade')}>
                  <div className="flex items-center justify-center space-x-1"><span>Quantidade</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('usuario.nome_completo')}>
                  <div className="flex items-center space-x-1"><span>Cadastrado por</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Carregando contagens...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhuma contagem encontrada.</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.data ? item.data.split('T')[0].split('-').reverse().join('/') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.comum_congregacao?.nome || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.tipo === 'Mocidade' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                      {item.quantidade}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{item.usuario?.nome_completo || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.perfis?.nome !== 'Apontamento' && (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      )}
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

      {isModalOpen && (
        <ContagemFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingItem}
          comuns={comuns}
          onSuccess={fetchContagens}
        />
      )}
    </div>
  );
};

// --- FORM MODAL ---
interface ContagemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ContagemMocidade | null;
  comuns: ComumCongregacao[];
  onSuccess: () => void;
}

const ContagemFormModal: React.FC<ContagemFormModalProps> = ({
  isOpen, onClose, initialData, comuns, onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    data: '',
    quantidade: 0,
    comum_id: '',
    tipo: 'Mocidade' as 'Santa Ceia' | 'Mocidade',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        data: initialData.data,
        quantidade: initialData.quantidade,
        comum_id: initialData.comum_id,
        tipo: initialData.tipo,
      });
    } else {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        quantidade: 0,
        comum_id: '',
        tipo: 'Mocidade',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...formData,
        cadastrado_por: user?.id || null
      };

      const url = initialData ? `/api/contagens/${initialData.id}` : '/api/contagens';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearApiCache('/api/contagens');
        onSuccess();
        onClose();
      } else {
        alert('Erro ao salvar contagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar contagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg">{initialData ? 'Editar Contagem' : 'Nova Contagem'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Data *</label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              onKeyDown={(e) => e.preventDefault()}
              onClick={(e) => {
                try {
                  if ('showPicker' in HTMLInputElement.prototype) {
                    (e.target as HTMLInputElement).showPicker();
                  }
                } catch (err) {}
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Comum Congregação *</label>
            <select
              required
              value={formData.comum_id}
              onChange={(e) => setFormData({ ...formData, comum_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione...</option>
              {comuns.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Tipo de Contagem *</label>
            <select
              required
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'Santa Ceia' | 'Mocidade' })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Mocidade">Mocidade</option>
              <option value="Santa Ceia">Santa Ceia</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Quantidade *</label>
            <input
              type="number"
              min="0"
              required
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
