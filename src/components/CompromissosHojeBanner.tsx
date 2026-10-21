import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  MapPin, 
  Clock, 
  X, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Tag
} from 'lucide-react';
import { CompromissosHoje } from '../utils/compromissosHelper';
import { NavRoute } from './Sidebar';

interface CompromissosHojeBannerProps {
  compromissos: CompromissosHoje;
  onNavigate: (route: NavRoute) => void;
}

export const CompromissosHojeBanner: React.FC<CompromissosHojeBannerProps> = ({
  compromissos,
  onNavigate,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!compromissos.temCompromissos || isDismissed) {
    return null;
  }

  const { totalHoje, reunioesHoje, visitasHoje, todayFormatted } = compromissos;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-500/15 dark:via-emerald-500/15 dark:to-teal-500/15 border border-amber-300/60 dark:border-amber-500/30 p-4 sm:p-5 shadow-sm transition-all duration-300">
      {/* Header do Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3.5">
          <div className="relative mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] font-bold text-white items-center justify-center">
                {totalHoje}
              </span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/30">
                Compromissos de Hoje
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {todayFormatted}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              Você tem {totalHoje} {totalHoje === 1 ? 'compromisso marcado' : 'compromissos marcados'} para hoje!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              {reunioesHoje.length > 0 && (
                <span className="mr-3 font-medium text-emerald-700 dark:text-emerald-300">
                  📅 {reunioesHoje.length} {reunioesHoje.length === 1 ? 'Reunião/Evento' : 'Reuniões/Eventos'}
                </span>
              )}
              {visitasHoje.length > 0 && (
                <span className="font-medium text-teal-700 dark:text-teal-300">
                  📍 {visitasHoje.length} {visitasHoje.length === 1 ? 'Visita agendada' : 'Visitas agendadas'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo (Expandir/Fechar) */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            title="Dispensar aviso"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido dos Compromissos */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-amber-200/50 dark:border-slate-800 space-y-3">
          {/* Seção 1: Reuniões e Eventos */}
          {reunioesHoje.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Reuniões e Eventos ({reunioesHoje.length})
                </span>
                <button
                  onClick={() => onNavigate('calendario')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                >
                  Abrir Calendário
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reunioesHoje.map(reuniao => (
                  <div
                    key={reuniao.id}
                    onClick={() => onNavigate('calendario')}
                    className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-600 transition shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {reuniao.nome}
                          </h4>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          {reuniao.tipos_evento?.nome && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                              <Tag className="w-3 h-3" />
                              {reuniao.tipos_evento.nome}
                            </span>
                          )}
                          {reuniao.comum_congregacao?.nome && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {reuniao.comum_congregacao.nome}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 2: Agenda de Visitas */}
          {visitasHoje.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Agenda de Visitas ({visitasHoje.length})
                </span>
                <button
                  onClick={() => onNavigate('agenda-visitas')}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1 transition cursor-pointer"
                >
                  Abrir Agenda de Visitas
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visitasHoje.map(visita => (
                  <div
                    key={visita.id}
                    onClick={() => onNavigate('agenda-visitas')}
                    className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-900/40 hover:border-teal-300 dark:hover:border-teal-600 transition shadow-xs cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: visita.cor || '#0d9488' }}
                          />
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                            {visita.nome}
                          </h4>
                          {visita.horario && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 ml-auto">
                              <Clock className="w-3 h-3" />
                              {visita.horario}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {visita.endereco && (
                            <p className="truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {visita.endereco}
                            </p>
                          )}
                          {visita.ponto_encontro && (
                            <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                              Ponto de encontro: {visita.ponto_encontro}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Atalhos Rápidos no Rodapé do Banner */}
          <div className="pt-1 flex items-center justify-end gap-2 text-xs">
            {reunioesHoje.length > 0 && (
              <button
                onClick={() => onNavigate('calendario')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition cursor-pointer"
              >
                Ir para o Calendário
              </button>
            )}
            {visitasHoje.length > 0 && (
              <button
                onClick={() => onNavigate('agenda-visitas')}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs transition cursor-pointer"
              >
                Ir para Agenda de Visitas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
