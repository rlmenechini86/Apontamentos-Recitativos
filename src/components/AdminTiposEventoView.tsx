import React, { useState } from 'react';
import { TipoEvento } from '../types';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface AdminTiposEventoViewProps {
  tiposEvento: TipoEvento[];
  onUpdate: () => void;
}

export const AdminTiposEventoView: React.FC<AdminTiposEventoViewProps> = ({ tiposEvento, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoEvento | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#3b82f6',
    status: true
  });

  const handleOpenModal = (item?: TipoEvento) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        cor: item.cor,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({ nome: '', cor: '#3b82f6', status: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/tipos-evento/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('/api/tipos-evento', {
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
      onUpdate();
    } catch (err: any) {
      alert('Erro ao salvar o tipo de evento: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return;
    try {
      await fetch(`/api/tipos-evento/${id}`, { method: 'DELETE' });
      onUpdate();
    } catch (err) {
      alert('Erro ao excluir. Verifique dependências.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cadastro de Tipo de Evento</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Nome do Evento</th>
              <th className="px-6 py-4 font-semibold text-center">Cor</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {tiposEvento.map((tipo) => (
              <tr key={tipo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium">{tipo.nome}</td>
                <td className="px-6 py-4 text-center">
                  <div 
                    className="w-6 h-6 rounded-full mx-auto border border-slate-200 dark:border-slate-700 shadow-sm" 
                    style={{ backgroundColor: tipo.cor }}
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipo.status ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                    {tipo.status ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenModal(tipo)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg mr-2">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tipo.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {tiposEvento.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Nenhum tipo de evento cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingItem ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Evento</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor no Calendário</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    required
                    value={formData.cor}
                    onChange={e => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10 w-20 bg-transparent border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-500 font-mono uppercase">{formData.cor}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativo</span>
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
