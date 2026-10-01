import React, { useState, useEffect } from 'react';
import { CheckCircle2, Search, Plus, RefreshCw, Trash2, Edit2, Calendar, Building2, User, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Recitativo, ComumCongregacao } from '../types';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './Pagination';
import { apiGet, clearApiCache } from '../utils/api';

interface RecitativosViewProps {
  comuns: ComumCongregacao[];
  usuarios?: Usuario[];
}

export const RecitativosView: React.FC<RecitativosViewProps> = ({ comuns, usuarios = [] }) => {
  const { user } = useAuth();
  const [recitativos, setRecitativos] = useState<Recitativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSecretarioId, setSelectedSecretarioId] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recitativo | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const fetchRecitativos = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/api/recitativos');
      if (res.ok) {
        const json = await res.json();
        setRecitativos(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar recitativos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecitativos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este apontamento?')) return;
    try {
      const res = await fetch(`/api/recitativos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        clearApiCache('/api/recitativos');
        fetchRecitativos();
      } else {
        alert('Erro ao excluir recitativo.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir recitativo.');
    }
  };

  const filtered = recitativos.filter((item) => {
    // A data vem do banco no formato YYYY-MM-DD
    const [year, month] = item.data.split('-');
    const matchesMonth = selectedMonth ? month === selectedMonth : true;
    const matchesYear = selectedYear ? year === selectedYear : true;

    const matchesSearch = item.comum_congregacao?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComum = selectedComumId ? item.comum_id === selectedComumId : true;
    const isRestrictedProfile = user?.perfis?.nome === 'Apontamento' || user?.perfis?.nome === 'CJM';
    const matchesUserComum = isRestrictedProfile ? item.comum_id === user?.comum_congregacao_id : true;

    const matchesSecretario = !selectedSecretarioId || comuns.find(c => c.id === item.comum_id)?.secretario_id === selectedSecretarioId;

    return matchesSearch && matchesComum && matchesMonth && matchesYear && matchesUserComum && matchesSecretario;
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
    // Default sort by date desc
    filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedComumId, selectedMonth, selectedYear, selectedSecretarioId]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      
      {/* Filtros e Busca */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex-1 flex flex-wrap lg:flex-nowrap gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por comum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todos os Meses</option>
              <option value="01">Janeiro</option>
              <option value="02">Fevereiro</option>
              <option value="03">Março</option>
              <option value="04">Abril</option>
              <option value="05">Maio</option>
              <option value="06">Junho</option>
              <option value="07">Julho</option>
              <option value="08">Agosto</option>
              <option value="09">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todos os Anos</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedComumId}
              onChange={(e) => setSelectedComumId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">Todas as Comuns</option>
              {comuns.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
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
                  <option key={u.id} value={u.id}>{u.nome_completo}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
          <button
            onClick={fetchRecitativos}
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
            <span>Novo Apontamento</span>
          </button>
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
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('mocos')}>
                  <div className="flex items-center justify-center space-x-1"><span>Moços</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('mocas')}>
                  <div className="flex items-center justify-center space-x-1"><span>Moças</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('meninos')}>
                  <div className="flex items-center justify-center space-x-1"><span>Meninos</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('meninas')}>
                  <div className="flex items-center justify-center space-x-1"><span>Meninas</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                </th>
                <th className="px-6 py-4 text-center font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-center space-x-1"><span>Total</span><ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
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
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>Carregando recitativos...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum apontamento encontrado.</p>
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
                    <td className="px-6 py-4 text-center font-mono">{item.mocos}</td>
                    <td className="px-6 py-4 text-center font-mono">{item.mocas}</td>
                    <td className="px-6 py-4 text-center font-mono">{item.meninos}</td>
                    <td className="px-6 py-4 text-center font-mono">{item.meninas}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10">
                      {item.total}
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
        <RecitativoFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingItem}
          comuns={comuns}
          onSuccess={fetchRecitativos}
        />
      )}
    </div>
  );
};

// --- FORM MODAL ---
interface RecitativoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Recitativo | null;
  comuns: ComumCongregacao[];
  onSuccess: () => void;
}

const RecitativoFormModal: React.FC<RecitativoFormModalProps> = ({
  isOpen, onClose, initialData, comuns, onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    data: '',
    comum_id: '',
    mocos: 0,
    mocas: 0,
    meninos: 0,
    meninas: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        data: initialData.data,
        comum_id: initialData.comum_id,
        mocos: initialData.mocos,
        mocas: initialData.mocas,
        meninos: initialData.meninos,
        meninas: initialData.meninas,
      });
    } else {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        comum_id: '',
        mocos: 0,
        mocas: 0,
        meninos: 0,
        meninas: 0,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.data) {
      const [y, m, d] = formData.data.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek !== 0) {
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        if (!window.confirm(`A data escolhida é ${days[dayOfWeek]}. Tem certeza que deseja salvar esse apontamento nesta data?`)) {
          return;
        }
      }
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        cadastrado_por: user?.id || null
      };

      const url = initialData ? `/api/recitativos/${initialData.id}` : '/api/recitativos';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearApiCache('/api/recitativos');
        onSuccess();
        onClose();
      } else {
        alert('Erro ao salvar apontamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar apontamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-lg">{initialData ? 'Editar Apontamento' : 'Novo Apontamento de Recitativos'}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            x
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {formData.data && (
                <div className={`text-[11px] mt-1 font-semibold ${
                  new Date(Number(formData.data.split('-')[0]), Number(formData.data.split('-')[1]) - 1, Number(formData.data.split('-')[2])).getDay() === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-500'
                }`}>
                  {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][new Date(Number(formData.data.split('-')[0]), Number(formData.data.split('-')[1]) - 1, Number(formData.data.split('-')[2])).getDay()]}
                </div>
              )}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Moços</label>
              <input
                type="number"
                min="0"
                value={formData.mocos}
                onChange={(e) => setFormData({ ...formData, mocos: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Moças</label>
              <input
                type="number"
                min="0"
                value={formData.mocas}
                onChange={(e) => setFormData({ ...formData, mocas: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Meninos</label>
              <input
                type="number"
                min="0"
                value={formData.meninos}
                onChange={(e) => setFormData({ ...formData, meninos: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">Meninas</label>
              <input
                type="number"
                min="0"
                value={formData.meninas}
                onChange={(e) => setFormData({ ...formData, meninas: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="pt-2 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-center">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold uppercase">Total: </span>
            <span className="font-mono font-bold text-xl text-emerald-700 dark:text-emerald-400">
              {formData.mocos + formData.mocas + formData.meninos + formData.meninas}
            </span>
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
              {loading ? 'Salvando...' : 'Salvar Apontamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
