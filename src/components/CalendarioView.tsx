import React, { useState, useMemo } from 'react';
import { ReuniaoEvento } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, MapPin, Clock, Tag } from 'lucide-react';

interface CalendarioViewProps {
  reunioes: ReuniaoEvento[];
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({ reunioes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ReuniaoEvento | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null); // Empty days before 1st
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

    return reunioes.filter(r => r.data === dateStr && r.status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Calendário</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Reuniões e Eventos Programados</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={prevMonth} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day, idx) => {
                const events = getEventsForDate(day);
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div 
                    key={idx} 
                    className={`min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-slate-800/60 ${!day ? 'bg-slate-50/50 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'}`}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                          {day}
                        </span>
                        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                          {events.map(event => (
                            <div 
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="px-2 py-1.5 text-[11px] font-medium text-white rounded shadow-sm flex flex-col leading-tight cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: event.tipos_evento?.cor || '#3b82f6' }}
                              title={`${event.tipos_evento?.nome} - ${event.comum_congregacao?.nome || 'Regional/Geral'}`}
                            >
                              <span className="font-bold whitespace-normal break-words">{event.tipos_evento?.nome}</span>
                              <span className="text-[10px] opacity-90 whitespace-normal break-words mt-0.5">{event.comum_congregacao?.nome || 'Regional/Geral'}</span>
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

      {/* Modal de Detalhes do Evento (Somente Leitura) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div 
              className="p-4 flex items-center justify-between text-white"
              style={{ backgroundColor: selectedEvent.tipos_evento?.cor || '#3b82f6' }}
            >
              <h3 className="font-bold text-lg">Detalhes do Evento</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-start space-x-3">
                <Tag className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Evento</p>
                  <p className="text-base font-medium text-slate-800 dark:text-slate-100">{selectedEvent.tipos_evento?.nome}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Local (Comum)</p>
                  <p className="text-base font-medium text-slate-800 dark:text-slate-100">{selectedEvent.comum_congregacao?.nome || 'Regional/Geral'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Data</p>
                  <p className="text-base font-medium text-slate-800 dark:text-slate-100">
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
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
