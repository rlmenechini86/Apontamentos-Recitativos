import { ReuniaoEvento, AgendaVisita, Usuario } from '../types';

/**
 * Retorna a data atual no formato YYYY-MM-DD considerando o fuso horário local.
 */
export const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma data YYYY-MM-DD para DD/MM/AAAA.
 */
export const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

export interface CompromissosHoje {
  todayStr: string;
  todayFormatted: string;
  reunioesHoje: ReuniaoEvento[];
  visitasHoje: AgendaVisita[];
  totalHoje: number;
  temCompromissos: boolean;
}

/**
 * Filtra as reuniões e visitas agendadas para o dia corrente,
 * aplicando as regras de visualização do perfil do usuário logado.
 */
export const filtrarCompromissosHoje = (
  reunioes: ReuniaoEvento[],
  visitas: AgendaVisita[],
  user: Usuario | null
): CompromissosHoje => {
  const todayStr = getTodayDateStr();
  const isCJM = user?.perfis?.nome?.toLowerCase().includes('cjm') || false;
  const isGlobal = !isCJM && (
    user?.perfis?.nivel_acesso === 'global' || 
    user?.perfis?.nivel_acesso === 'setor' ||
    user?.perfis?.nome?.toLowerCase().includes('admin')
  );

  // 1. Filtrar Reuniões de hoje
  const reunioesHoje = (reunioes || []).filter(r => {
    if (!r.status) return false;
    if (r.data !== todayStr) return false;

    // Se o usuário tem acesso restrito a uma comum, verifica se o evento é geral ou da sua comum
    if (!isGlobal && user?.comum_congregacao_id && r.comum_id) {
      return r.comum_id === user.comum_congregacao_id;
    }
    return true;
  });

  // 2. Filtrar Visitas de hoje
  const visitasHoje = (visitas || []).filter(v => {
    if (v.data_visita !== todayStr) return false;

    // Se o usuário tem acesso restrito a uma comum
    if (!isGlobal && user?.comum_congregacao_id) {
      return (v.comum_id || '') === user.comum_congregacao_id;
    }
    return true;
  });

  const totalHoje = reunioesHoje.length + visitasHoje.length;

  return {
    todayStr,
    todayFormatted: formatDateBR(todayStr),
    reunioesHoje,
    visitasHoje,
    totalHoje,
    temCompromissos: totalHoje > 0,
  };
};
