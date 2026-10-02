import React, { useState, useEffect } from 'react';
import { Mocidade, ComumCongregacao } from '../types';
import { Plus, Pencil, Trash2, X, Check, Search, Users } from 'lucide-react';
import { apiGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface MocidadeViewProps {
  comuns: ComumCongregacao[];
}

export const MocidadeView: React.FC<MocidadeViewProps> = ({ comuns }) => {
  const { user } = useAuth();
  const [mocidadeList, setMocidadeList] = useState<Mocidade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mocidade | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    data_nascimento: '',
    sexo: 'Masculino' as 'Feminino' | 'Masculino',
    responsavel: '',
    telefone_contato: '',
    comum_id: '',
    ativo: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/mocidade');
      if (res.ok) {
        const json = await res.json();
        setMocidadeList(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar mocidade', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (item?: Mocidade) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome_completo: item.nome_completo,
        data_nascimento: item.data_nascimento,
        sexo: item.sexo,
        responsavel: item.responsavel || '',
        telefone_contato: item.telefone_contato || '',
        comum_id: item.comum_id || '',
        ativo: item.ativo
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        nome_completo: '',
        data_nascimento: '',
        sexo: 'Masculino',
        responsavel: '',
        telefone_contato: '',
        comum_id: user?.comum_congregacao_id || comuns[0]?.id || '',
        ativo: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/mocidade/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('/api/mocidade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cadastro?')) return;
    try {
      await fetch(`/api/mocidade/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString('pt-BR');
  };

  const filteredMocidade = mocidadeList.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchName = item.nome_completo.toLowerCase().includes(term);
    const matchResponsavel = item.responsavel?.toLowerCase().includes(term);
    
    // Filter by user's congregation if they are not admin
    if (user?.perfis?.nome === 'Apontamento' && user.comum_congregacao_id) {
        if (item.comum_id !== user.comum_congregacao_id) return false;
    }
    if (user?.perfis?.nome === 'CJM' && user.comum_congregacao_id) {
        if (item.comum_id !== user.comum_congregacao_id) return false;
    }

    return matchName || matchResponsavel;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Users className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-400" />
            Cadastro de Mocidade
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerenciamento dos cadastros da mocidade local.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cadastro
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome ou responsável..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome Completo</th>
                  <th className="px-6 py-4 font-semibold">Data Nasc.</th>
                  <th className="px-6 py-4 font-semibold">Sexo</th>
                  <th className="px-6 py-4 font-semibold">Comum</th>
                  <th className="px-6 py-4 font-semibold">Responsável / Telefone</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredMocidade.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.nome_completo}</td>
                    <td className="px-6 py-4">{formatDate(item.data_nascimento)}</td>
                    <td className="px-6 py-4">{item.sexo}</td>
                    <td className="px-6 py-4">{item.comum_congregacao?.nome || '-'}</td>
                    <td className="px-6 py-4">
                      {item.responsavel ? (
                        <div className="flex flex-col">
                          <span>{item.responsavel}</span>
                          <span className="text-xs text-slate-400">{item.telefone_contato || 'S/ Tel'}</span>
                        </div>
                      ) : (
                        item.telefone_contato || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg mr-2">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMocidade.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingItem ? 'Editar Cadastro' : 'Novo Cadastro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    required
                    value={formData.data_nascimento}
                    onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sexo</label>
                  <select
                    required
                    value={formData.sexo}
                    onChange={e => setFormData({ ...formData, sexo: e.target.value as 'Masculino' | 'Feminino' })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                  placeholder="Se menor de idade"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone de Contato</label>
                <input
                  type="text"
                  value={formData.telefone_contato}
                  onChange={e => setFormData({ ...formData, telefone_contato: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comum Congregação</label>
                <select
                  required
                  value={formData.comum_id}
                  onChange={e => setFormData({ ...formData, comum_id: e.target.value })}
                  disabled={user?.perfis?.nome !== 'Administrador' && user?.perfis?.nome !== 'Admin'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
                >
                  <option value="">Selecione...</option>
                  {comuns.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.ativo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cadastro Ativo</span>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center">
                  <Check className="w-4 h-4 mr-2" />
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
