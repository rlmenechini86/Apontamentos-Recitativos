import React, { useState, useMemo } from 'react';
import { ReuniaoEvento } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarioViewProps {
  reunioes: ReuniaoEvento[];
}

export const CalendarioView: React.FC<CalendarioViewProps> = ({ reunioes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
                          className="px-2 py-1 text-[11px] font-medium text-white rounded shadow-sm truncate"
                          style={{ backgroundColor: event.tipos_evento?.cor || '#3b82f6' }}
                          title={event.nome || event.tipos_evento?.nome}
                        >
                          {event.nome || event.tipos_evento?.nome}
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
  );
};
