import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, MapPin, Clock, Users, X, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search, Layers
} from 'lucide-react';
import { AgendaVisita, ComumCongregacao, Setor } from '../types';
import { apiGet, clearApiCache } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  comuns: ComumCongregacao[];
  setores?: Setor[];
}

export const AgendaVisitasView: React.FC<Props> = ({ comuns, setores: propSetores }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visitas, setVisitas] = useState<AgendaVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);

  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');
  const [modalSetorId, setModalSetorId] = useState('');
  const [searchComum, setSearchComum] = useState('');

  useEffect(() => {
    if (propSetores && propSetores.length > 0) {
      setSetores(propSetores);
    } else {
      fetch('/api/comuns/meta/setores')
        .then(res => res.json())
        .then(json => setSetores(json.data || []))
        .catch(console.error);
    }
  }, [propSetores]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    horario: '',
    ponto_encontro: '',
    cor: '#10b981',
    data_visita: '',
    comum_id: user?.comum_congregacao_id || ''
  });

  const fetchVisitas = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/visitas');
      const json = await res.json();
      
      const isCJM = user?.perfis?.nome?.includes('CJM') || false;
      const isGlobal = !isCJM && (user?.perfis?.nivel_acesso === 'global' || user?.perfis?.nivel_acesso === 'setor');
      
      const filtered = (json.data || []).filter((v: AgendaVisita) => 
        isGlobal ? true : (v.comum_id || '') === (user?.comum_congregacao_id || '')
      );
      setVisitas(filtered);
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const comunsDoSetor = useMemo(() => {
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

  const filteredVisitas = useMemo(() => {
    return visitas.filter((v) => {
      if (selectedSetorId) {
        const c = comuns.find(item => item.id === v.comum_id);
        const s = setores.find(st => st.id === selectedSetorId);
        const matchesSetor = c?.setor_id === selectedSetorId || (s && c?.setor_pertencente === s.nome);
        if (!matchesSetor) return false;
      }
      if (selectedComumId) {
        if (v.comum_id !== selectedComumId) return false;
      }
      return true;
    });
  }, [visitas, comuns, setores, selectedSetorId, selectedComumId]);

  const modalFilteredComuns = useMemo(() => {
    return comuns.filter((c) => {
      if (modalSetorId) {
        const selectedSetor = setores.find(s => s.id === modalSetorId);
        const matchesSetor = c.setor_id === modalSetorId || (selectedSetor && c.setor_pertencente === selectedSetor.nome);
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
  }, [comuns, setores, modalSetorId, searchComum]);

  const displayComuns = useMemo(() => {
    if (formData.comum_id && !modalFilteredComuns.some(c => c.id === formData.comum_id)) {
      const selectedComum = comuns.find(c => c.id === formData.comum_id);
      if (selectedComum) {
        return [selectedComum, ...modalFilteredComuns];
      }
    }
    return modalFilteredComuns;
  }, [modalFilteredComuns, formData.comum_id, comuns]);

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;
    setModalSetorId(selectedSetorId || '');
    setSearchComum('');
    setFormData({
      nome: '',
      endereco: '',
      horario: '',
      ponto_encontro: '',
      cor: '#10b981',
      data_visita: formattedDate,
      comum_id: user?.comum_congregacao_id || ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (v: AgendaVisita, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchComum('');
    const c = comuns.find(x => x.id === v.comum_id);
    const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
    setModalSetorId(s?.id || c?.setor_id || '');
    setFormData({
      nome: v.nome,
      endereco: v.endereco || '',
      horario: v.horario || '',
      ponto_encontro: v.ponto_encontro || '',
      cor: v.cor || '#10b981',
      data_visita: v.data_visita,
      comum_id: v.comum_id || user?.comum_congregacao_id || ''
    });
    setEditingId(v.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir esta visita?')) {
      try {
        const res = await fetch(`/api/visitas/${id}`, { method: 'DELETE' });
        if (res.ok) {
          clearApiCache('/api/visitas');
          window.dispatchEvent(new CustomEvent('visitas-updated'));
          fetchVisitas();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/visitas/${editingId}` : '/api/visitas';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        clearApiCache('/api/visitas');
        window.dispatchEvent(new CustomEvent('visitas-updated'));
        fetchVisitas();
        setIsModalOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao salvar: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro na requisição: ${err.message}`);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Agenda de Visitas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gerenciamento de datas, horários e pontos de encontro.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm self-start">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-[120px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Setor Pertencente e Comum Congregação */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Filtrar Agenda:</span>
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
            {comunsDoSetor.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {(selectedSetorId || selectedComumId) && (
          <button
            type="button"
            onClick={() => { setSelectedSetorId(''); setSelectedComumId(''); }}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer ml-auto"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(day).padStart(2, '0');
            const currentDayDate = `${year}-${month}-${dayStr}`;
            
            const todayDate = new Date();
            const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
            
            const dayVisitas = filteredVisitas.filter(v => {
              if (!v.data_visita) return false;
              // Ignore any time part returned by Supabase
              return v.data_visita.split('T')[0] === currentDayDate;
            });
            const isToday = currentDayDate === todayStr;

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] sm:min-h-[140px] p-2 border-b border-r border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 group ${isToday ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-emerald-600'}`}>
                    {day}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-full transition-opacity">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto max-h-[80px] sm:max-h-[100px] pr-1 styled-scrollbars">
                  {dayVisitas.map(visita => (
                    <div 
                      key={visita.id} 
                      onClick={(e) => handleEdit(visita, e)}
                      className="text-xs p-1.5 rounded border flex flex-col gap-1 transition-all hover:brightness-95 cursor-pointer relative group/event"
                      style={{ 
                        backgroundColor: `${visita.cor}15`, 
                        borderColor: `${visita.cor}40`,
                        color: visita.cor !== '#ffffff' ? visita.cor : '#000000',
                      }}
                    >
                      <div className="font-semibold truncate pr-6">{visita.nome}</div>
                      {visita.horario && (
                        <div className="flex items-center space-x-1 opacity-80 text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>{visita.horario}</span>
                        </div>
                      )}
                      {visita.ponto_encontro && (
                        <div className="flex items-center space-x-1 opacity-80 text-[10px]" title={`Ponto de Encontro: ${visita.ponto_encontro}`}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate font-medium">Ponto de Encontro:</span>
                          <span className="truncate">{visita.ponto_encontro}</span>
                        </div>
                      )}
                      {visita.comum_congregacao && (
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/10 text-[9px] font-semibold">
                            {visita.comum_congregacao.nome}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute top-1 right-1 opacity-0 group-hover/event:opacity-100 flex items-center space-x-1 bg-white/80 dark:bg-slate-900/80 rounded px-1">
                        <button onClick={(e) => handleDelete(visita.id, e)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 md:p-8 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                {editingId ? <Edit2 className="w-5 h-5 mr-2 text-emerald-500" /> : <Plus className="w-5 h-5 mr-2 text-emerald-500" />}
                {editingId ? 'Editar Visita' : 'Nova Visita'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Data: {new Date(formData.data_visita).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Local / Pessoas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors"
                    placeholder="Ex: Visita Irmão João"
                  />
                </div>
              </div>

              {/* Campo de Vínculo: Setor Pertencente e Pesquisa de Comum */}
              <div className="space-y-3 pt-1">
                <div className="bg-slate-50 dark:bg-slate-850/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
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
                        value={modalSetorId}
                        onChange={(e) => setModalSetorId(e.target.value)}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Comum Congregação
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {displayComuns.length} congregação(ões) disponível(is)
                    </span>
                  </div>
                  <select
                    value={formData.comum_id}
                    onChange={e => {
                      const chosenId = e.target.value;
                      setFormData({...formData, comum_id: chosenId});
                      if (chosenId && !modalSetorId) {
                        const c = comuns.find(item => item.id === chosenId);
                        const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
                        if (s) setModalSetorId(s.id);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">Selecione uma Comum (Opcional)</option>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Horário
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="time"
                      value={formData.horario}
                      onChange={e => setFormData({...formData, horario: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cor de Destaque
                  </label>
                  <div className="flex space-x-2">
                    {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({...formData, cor: c})}
                        className={`w-8 h-8 rounded-full transition-transform ${formData.cor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Endereço
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={e => setFormData({...formData, endereco: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors"
                    placeholder="Rua Exemplo, 123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ponto de Encontro
                </label>
                <input
                  type="text"
                  value={formData.ponto_encontro}
                  onChange={e => setFormData({...formData, ponto_encontro: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors"
                  placeholder="Ex: Em frente à congregação"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Visita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
