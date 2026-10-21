import React, { useState, useMemo, useEffect } from 'react';
import { ReuniaoEvento, TipoEvento, ComumCongregacao, Setor } from '../types';
import { Plus, Pencil, Trash2, X, Check, Search, Layers } from 'lucide-react';

interface AdminReunioesEventosViewProps {
  reunioes: ReuniaoEvento[];
  tiposEvento: TipoEvento[];
  comuns: ComumCongregacao[];
  onUpdate: () => void;
  setores?: Setor[];
}

export const AdminReunioesEventosView: React.FC<AdminReunioesEventosViewProps> = ({ reunioes, tiposEvento, comuns, onUpdate, setores: propSetores }) => {
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReuniaoEvento | null>(null);
  
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
  
  // Filtros da listagem principal
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');

  // Filtros do modal de cadastro/edição
  const [filtroSetorId, setFiltroSetorId] = useState('');
  const [searchComum, setSearchComum] = useState('');
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo_evento_id: '',
    comum_id: '',
    nome: '',
    status: true
  });

  // Comuns disponíveis para o filtro principal da lista
  const listComunsDoSetor = useMemo(() => {
    if (!selectedSetorId) return comuns;
    const selectedSetor = setores.find(s => s.id === selectedSetorId);
    return comuns.filter(c => 
      c.setor_id === selectedSetorId || 
      (selectedSetor && c.setor_pertencente === selectedSetor.nome)
    );
  }, [comuns, setores, selectedSetorId]);

  const handleSetorFilterChange = (setorId: string) => {
    setSelectedSetorId(setorId);
    setSelectedComumId('');
  };

  // Reuniões filtradas para a tabela
  const filteredReunioes = useMemo(() => {
    return reunioes.filter((r) => {
      if (selectedSetorId) {
        const c = comuns.find(item => item.id === r.comum_id);
        const s = setores.find(st => st.id === selectedSetorId);
        const matchesSetor = c?.setor_id === selectedSetorId || (s && (c?.setor_pertencente === s.nome || r.comum_congregacao?.setor_pertencente === s.nome));
        if (!matchesSetor) return false;
      }
      if (selectedComumId) {
        if (r.comum_id !== selectedComumId) return false;
      }
      return true;
    });
  }, [reunioes, comuns, setores, selectedSetorId, selectedComumId]);

  const handleOpenModal = (item?: ReuniaoEvento) => {
    setSearchComum('');
    if (item) {
      setEditingItem(item);
      const c = comuns.find(x => x.id === item.comum_id);
      const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
      setFiltroSetorId(s?.id || c?.setor_id || '');
      setFormData({
        data: item.data,
        tipo_evento_id: item.tipo_evento_id || '',
        comum_id: item.comum_id || '',
        nome: item.nome || '',
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFiltroSetorId(selectedSetorId || '');
      setFormData({ 
        data: new Date().toISOString().split('T')[0], 
        tipo_evento_id: tiposEvento[0]?.id || '', 
        comum_id: selectedComumId || '',
        nome: '', 
        status: true 
      });
    }
    setIsModalOpen(true);
  };

  const filteredComuns = useMemo(() => {
    return comuns.filter((c) => {
      if (filtroSetorId) {
        const selectedSetor = setores.find(s => s.id === filtroSetorId);
        const matchesSetor = c.setor_id === filtroSetorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome);
        if (!matchesSetor) return false;
      }
      if (searchComum.trim()) {
        const query = searchComum.toLowerCase().trim();
        const matchesNome = c.nome.toLowerCase().includes(query);
        const matchesCodigo = c.codigo?.toLowerCase().includes(query);
        const matchesSetorNome = c.setores?.nome?.toLowerCase().includes(query) || c.setor_pertencente?.toLowerCase().includes(query);
        if (!matchesNome && !matchesCodigo && !matchesSetorNome) return false;
      }
      return true;
    });
  }, [comuns, setores, filtroSetorId, searchComum]);

  const displayComuns = useMemo(() => {
    if (formData.comum_id && !filteredComuns.some(c => c.id === formData.comum_id)) {
      const selectedComum = comuns.find(c => c.id === formData.comum_id);
      if (selectedComum) {
        return [selectedComum, ...filteredComuns];
      }
    }
    return filteredComuns;
  }, [filteredComuns, formData.comum_id, comuns]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/reunioes-eventos/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('/api/reunioes-eventos', {
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
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return;
    try {
      await fetch(`/api/reunioes-eventos/${id}`, { method: 'DELETE' });
      onUpdate();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cadastro de Reuniões e Eventos</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Registro
        </button>
      </div>

      {/* Barra de Filtros: Setor Pertencente e Comum Congregação */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Filtrar:</span>
        </div>

        {/* 1º Filtro: Setor Pertencente */}
        <div className="w-full sm:w-56">
          <select
            value={selectedSetorId}
            onChange={(e) => handleSetorFilterChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">Todos os Setores</option>
            {setores.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>

        {/* 2º Filtro: Comum Congregação (filtrada pelo setor) */}
        <div className="w-full sm:w-56">
          <select
            value={selectedComumId}
            onChange={(e) => setSelectedComumId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">
              {selectedSetorId ? 'Todas as Comuns do Setor' : 'Todas as Comuns'}
            </option>
            {listComunsDoSetor.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {(selectedSetorId || selectedComumId) && (
          <button
            onClick={() => {
              setSelectedSetorId('');
              setSelectedComumId('');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Comum Congregação</th>
              <th className="px-6 py-4 font-semibold">Descrição Extra</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filteredReunioes.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-medium">{formatDate(item.data)}</td>
                <td className="px-6 py-4 font-medium">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.tipos_evento?.cor || '#ccc' }}
                    />
                    <span>{item.tipos_evento?.nome || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{item.comum_congregacao?.nome || 'Geral/Regional'}</td>
                <td className="px-6 py-4">{item.nome || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                    {item.status ? 'Ativo' : 'Cancelado'}
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
            {filteredReunioes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {selectedSetorId || selectedComumId 
                    ? 'Nenhuma reunião ou evento encontrado para os filtros selecionados.' 
                    : 'Nenhuma reunião ou evento cadastrado.'}
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
                {editingItem ? 'Editar Registro' : 'Novo Registro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Evento</label>
                <select
                  required
                  value={formData.tipo_evento_id}
                  onChange={e => setFormData({ ...formData, tipo_evento_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {tiposEvento.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Painel de Facilitação: Setor Pertencente e Pesquisa de Comum */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Localizar Comum Congregação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Filtro Setor Pertencente */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Setor Pertencente
                    </label>
                    <select
                      value={filtroSetorId}
                      onChange={(e) => setFiltroSetorId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Todos os Setores --</option>
                      {setores.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pesquisar Comum */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase text-slate-600 dark:text-slate-400">
                      Pesquisar Congregação
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Nome ou código..."
                        value={searchComum}
                        onChange={(e) => setSearchComum(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                      />
                      {searchComum && (
                        <button
                          type="button"
                          onClick={() => setSearchComum('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Limpar pesquisa"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Comum Congregação (Opcional)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {displayComuns.length} congregação(ões) disponível(is)
                  </span>
                </div>
                <select
                  value={formData.comum_id}
                  onChange={e => {
                    const chosenId = e.target.value;
                    setFormData({ ...formData, comum_id: chosenId });
                    if (chosenId && !filtroSetorId) {
                      const c = comuns.find(item => item.id === chosenId);
                      const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
                      if (s) setFiltroSetorId(s.id);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">Nenhuma / Geral / Regional</option>
                  {displayComuns.map(c => {
                    const setorNome = c.setores?.nome || c.setor_pertencente || setores.find(s => s.id === c.setor_id)?.nome;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.codigo ? `${c.codigo} - ` : ''}
                        {c.nome}
                        {setorNome ? ` (${setorNome})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Nome Específico (Opcional)</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Ensaio Regional, Culto Especial..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativo / Confirmado</span>
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
