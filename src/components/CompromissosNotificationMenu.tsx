import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Tag, 
  Sparkles 
} from 'lucide-react';
import { CompromissosHoje } from '../utils/compromissosHelper';
import { NavRoute } from './Sidebar';

interface CompromissosNotificationMenuProps {
  compromissos: CompromissosHoje;
  onNavigate: (route: NavRoute) => void;
}

export const CompromissosNotificationMenu: React.FC<CompromissosNotificationMenuProps> = ({
  compromissos,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const { totalHoje, reunioesHoje, visitasHoje, todayFormatted, temCompromissos } = compromissos;

  const handleItemClick = (route: NavRoute) => {
    onNavigate(route);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão de Sino com Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={temCompromissos ? `${totalHoje} compromisso(s) para hoje` : 'Notificações de compromissos'}
        className={`relative p-2 rounded-lg transition cursor-pointer ${
          isOpen
            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
            : temCompromissos
            ? 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
      >
        <Bell className="w-4 h-4" />

        {temCompromissos && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] font-bold text-white items-center justify-center shadow-xs">
              {totalHoje > 9 ? '9+' : totalHoje}
            </span>
          </span>
        )}
      </button>

      {/* Popover / Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Cabeçalho do Dropdown */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Compromissos de Hoje
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {todayFormatted}
                </p>
              </div>
            </div>

            {temCompromissos && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                {totalHoje} {totalHoje === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {/* Lista de Compromissos com Scroll */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {!temCompromissos ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Nenhum compromisso marcado para hoje!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Não há reuniões nem visitas agendadas para esta data.
                </p>
              </div>
            ) : (
              <>
                {/* Seção Reuniões */}
                {reunioesHoje.length > 0 && (
                  <div className="p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Reuniões & Eventos ({reunioesHoje.length})
                    </span>

                    {reunioesHoje.map(reuniao => (
                      <div
                        key={reuniao.id}
                        onClick={() => handleItemClick('calendario')}
                        className="p-2.5 rounded-xl hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-500/20 transition cursor-pointer flex items-start justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {reuniao.nome}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            {reuniao.tipos_evento?.nome && (
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {reuniao.tipos_evento.nome}
                              </span>
                            )}
                            {reuniao.comum_congregacao?.nome && (
                              <span className="flex items-center gap-0.5">
                                • {reuniao.comum_congregacao.nome}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex-shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Seção Visitas */}
                {visitasHoje.length > 0 && (
                  <div className="p-3 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Agenda de Visitas ({visitasHoje.length})
                    </span>

                    {visitasHoje.map(visita => (
                      <div
                        key={visita.id}
                        onClick={() => handleItemClick('agenda-visitas')}
                        className="p-2.5 rounded-xl hover:bg-teal-50/60 dark:hover:bg-teal-500/10 border border-transparent hover:border-teal-200 dark:hover:border-teal-500/20 transition cursor-pointer flex items-start justify-between gap-2 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: visita.cor || '#0d9488' }}
                            />
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                              {visita.nome}
                            </p>
                            {visita.horario && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 ml-auto">
                                {visita.horario}
                              </span>
                            )}
                          </div>
                          {visita.endereco && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                              {visita.endereco}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex-shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rodapé do Menu com Links Diretos */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => handleItemClick('calendario')}
              className="text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 font-semibold transition cursor-pointer"
            >
              Ver Calendário
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => handleItemClick('agenda-visitas')}
              className="text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 font-semibold transition cursor-pointer"
            >
              Ver Agenda de Visitas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
