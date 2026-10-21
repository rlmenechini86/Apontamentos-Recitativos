import React, { useState, useMemo, useEffect } from 'react';
import { ReuniaoEvento, TipoEvento, ComumCongregacao, Setor } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  MapPin, 
  Clock, 
  Tag, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  AlertCircle,
  Search,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/permissions';

interface CalendarioViewProps {
  reunioes: ReuniaoEvento[];
  tiposEvento?: TipoEvento[];
  comuns?: ComumCongregacao[];
  onUpdate?: () => void;
  setores?: Setor[];
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({ 
  reunioes, 
  tiposEvento: propTiposEvento, 
  comuns: propComuns, 
  onUpdate,
  setores: propSetores
}) => {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'gerenciar_reunioes');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ReuniaoEvento | null>(null);

  // Dados auxiliares caso não venham via props
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>(propTiposEvento || []);
  const [comuns, setComuns] = useState<ComumCongregacao[]>(propComuns || []);
  const [setores, setSetores] = useState<Setor[]>(propSetores || []);

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

  useEffect(() => {
    if (propTiposEvento && propTiposEvento.length > 0) {
      setTiposEvento(propTiposEvento);
    } else {
      fetch('/api/tipos-evento')
        .then(res => res.json())
        .then(json => setTiposEvento(json.data || []))
        .catch(err => console.error('Erro ao buscar tipos de evento:', err));
    }
  }, [propTiposEvento]);

  useEffect(() => {
    if (propComuns && propComuns.length > 0) {
      setComuns(propComuns);
    } else {
      fetch('/api/comuns')
        .then(res => res.json())
        .then(json => setComuns(json.data || []))
        .catch(err => console.error('Erro ao buscar comuns:', err));
    }
  }, [propComuns]);

  // Estados de Filtro da Agenda do Calendário
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedComumId, setSelectedComumId] = useState('');

  // Estados do Modal de Formulário (Cadastro / Edição)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReuniaoEvento | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filtroSetorId, setFiltroSetorId] = useState('');
  const [searchComum, setSearchComum] = useState('');

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo_evento_id: '',
    comum_id: '',
    nome: '',
    status: true
  });

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Comuns disponíveis conforme o setor selecionado no filtro principal
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

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (day: number | null) => {
    if (!day) return [];
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    return reunioes.filter(r => {
      if (r.data !== dateStr || !r.status) return false;

      // Filtro por Setor Pertencente
      if (selectedSetorId) {
        const c = comuns.find(item => item.id === r.comum_id);
        const s = setores.find(st => st.id === selectedSetorId);
        const matchesSetor = c?.setor_id === selectedSetorId || (s && (c?.setor_pertencente === s.nome || r.comum_congregacao?.setor_pertencente === s.nome));
        if (!matchesSetor) return false;
      }

      // Filtro por Comum Congregação
      if (selectedComumId) {
        if (r.comum_id !== selectedComumId) return false;
      }

      return true;
    });
  };

  // Abrir tela de cadastro ao clicar no dia
  const handleDayClick = (day: number) => {
    if (!canManage) return;

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;

    setEditingItem(null);
    setFormError(null);
    setFiltroSetorId(selectedSetorId || '');
    setSearchComum('');
    setFormData({
      data: formattedDate,
      tipo_evento_id: tiposEvento[0]?.id || '',
      comum_id: selectedComumId || '',
      nome: '',
      status: true
    });
    setIsFormModalOpen(true);
  };

  const handleOpenNewEvent = () => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(new Date().getDate()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${dayStr}`;

    setEditingItem(null);
    setFormError(null);
    setFiltroSetorId(selectedSetorId || '');
    setSearchComum('');
    setFormData({
      data: defaultDate,
      tipo_evento_id: tiposEvento[0]?.id || '',
      comum_id: selectedComumId || '',
      nome: '',
      status: true
    });
    setIsFormModalOpen(true);
  };

  const handleEditEvent = (item: ReuniaoEvento) => {
    setSelectedEvent(null);
    setEditingItem(item);
    setFormError(null);
    setSearchComum('');
    const c = comuns.find(x => x.id === item.comum_id);
    const s = setores.find(st => st.id === c?.setor_id || (c?.setor_pertencente && st.nome === c.setor_pertencente));
    setFiltroSetorId(s?.id || c?.setor_id || '');
    setFormData({
      data: item.data,
      tipo_evento_id: item.tipo_evento_id || tiposEvento[0]?.id || '',
      comum_id: item.comum_id || '',
      nome: item.nome || '',
      status: item.status
    });
    setIsFormModalOpen(true);
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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente excluir este evento/reunião?')) return;
    try {
      const res = await fetch(`/api/reunioes-eventos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedEvent(null);
        window.dispatchEvent(new CustomEvent('reunioes-updated'));
        onUpdate?.();
      } else {
        alert('Erro ao excluir registro.');
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.data) {
      setFormError('A data é obrigatória.');
      return;
    }
    if (!formData.tipo_evento_id) {
      setFormError('Selecione o tipo de evento.');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingItem ? `/api/reunioes-eventos/${editingItem.id}` : '/api/reunioes-eventos';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao salvar reunião/evento');
      }

      setIsFormModalOpen(false);
      window.dispatchEvent(new CustomEvent('reunioes-updated'));
      onUpdate?.();
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Calendário de Reuniões e Eventos</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {canManage 
                ? 'Clique em qualquer dia para cadastrar um novo compromisso.'
                : 'Visualização dos eventos e reuniões programadas.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          {/* Navegação entre meses */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={prevMonth} 
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[130px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button 
              onClick={nextMonth} 
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botão de Novo Evento */}
          {canManage && (
            <button
              onClick={handleOpenNewEvent}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros: Setor Pertencente e Comum Congregação */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Filtrar Calendário:</span>
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

      {/* Grade do Calendário */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <div className="min-w-[800px]">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Células dos dias */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day, idx) => {
                const events = getEventsForDate(day);
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() && 
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div 
                    key={idx} 
                    onClick={() => day && handleDayClick(day)}
                    className={`min-h-[125px] p-2 border-r border-b border-slate-100 dark:border-slate-800/60 transition-all ${
                      !day 
                        ? 'bg-slate-50/40 dark:bg-slate-900/30' 
                        : canManage
                        ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 cursor-pointer group'
                        : 'bg-white dark:bg-slate-900'
                    }`}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-transform ${
                            isToday 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : 'text-slate-700 dark:text-slate-300 group-hover:scale-110'
                          }`}>
                            {day}
                          </span>

                          {/* Ícone sutil de '+' no hover para indicar que o dia é clicável */}
                          {canManage && (
                            <span 
                              className="opacity-0 group-hover:opacity-100 p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md transition"
                              title="Adicionar evento neste dia"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Lista de eventos do dia */}
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5 custom-scrollbar">
                          {events.map(event => (
                            <div 
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              className="px-2 py-1.5 text-[11px] font-medium text-white rounded-lg shadow-2xs flex flex-col leading-tight cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all"
                              style={{ backgroundColor: event.tipos_evento?.cor || '#059669' }}
                              title={`${event.tipos_evento?.nome} - ${event.comum_congregacao?.nome || 'Regional/Geral'}`}
                            >
                              <span className="font-bold truncate">{event.tipos_evento?.nome}</span>
                              <span className="text-[10px] opacity-90 truncate mt-0.5">
                                {event.comum_congregacao?.nome || 'Regional/Geral'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Detalhes do Evento (Visualização) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div 
              className="p-5 flex items-center justify-between text-white"
              style={{ backgroundColor: selectedEvent.tipos_evento?.cor || '#059669' }}
            >
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Detalhes do Evento</span>
                <h3 className="font-bold text-lg leading-tight mt-0.5">{selectedEvent.tipos_evento?.nome}</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-start space-x-3">
                <Tag className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tipo</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedEvent.tipos_evento?.nome}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Local / Congregação</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {selectedEvent.comum_congregacao?.nome || 'Regional / Geral (Todas as congregações)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Data</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {(() => {
                      const [y, m, d] = selectedEvent.data.split('-');
                      return `${d}/${m}/${y}`;
                    })()}
                  </p>
                </div>
              </div>
              
              {selectedEvent.nome && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição Adicional</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedEvent.nome}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                {canManage && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {canManage && (
                  <button
                    onClick={() => handleEditEvent(selectedEvent)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Formulário de Cadastro / Edição ao Clicar no Dia */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {editingItem ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {editingItem ? 'Editar Reunião / Evento' : 'Novo Evento no Calendário'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os dados do compromisso
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campo Data */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
              </div>

              {/* Campo Tipo de Evento */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo de Evento *
                </label>
                <select
                  required
                  value={formData.tipo_evento_id}
                  onChange={e => setFormData({ ...formData, tipo_evento_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                >
                  <option value="">Selecione o tipo...</option>
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

              {/* Campo Comum Congregação */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition cursor-pointer"
                >
                  <option value="">Nenhuma / Regional / Geral</option>
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

              {/* Descrição Adicional */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição / Detalhes (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Reunião de Jovens, Ensaio com Encarregados..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition"
                />
              </div>

              {/* Status Ativo/Confirmado */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Status do Evento
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: !formData.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.status ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.status ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)} 
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? 'Atualizar Evento' : 'Cadastrar Evento'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
