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
 * Retorna a data de amanhã (1 dia antes do evento) no formato YYYY-MM-DD considerando o fuso horário local.
 */
export const getTomorrowDateStr = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formata uma data YYYY-MM-DD para DD/MM/AAAA.
 */
export const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

export interface CompromissosHoje {
  todayStr: string;
  tomorrowStr: string;
  todayFormatted: string;
  tomorrowFormatted: string;

  // Reuniões (Hoje e Amanhã - 1 dia antes)
  reunioesHoje: ReuniaoEvento[];
  reunioesAmanha: ReuniaoEvento[];
  totalReunioes: number;

  // Visitas (Hoje e Amanhã - 1 dia antes)
  visitasHoje: AgendaVisita[];
  visitasAmanha: AgendaVisita[];
  totalVisitas: number;

  // Totais
  totalHoje: number;
  totalAmanha: number;
  totalGeral: number;
  temCompromissos: boolean;

  // Tokens únicos para controle de descarte (dismiss) inteligente:
  // Se o usuário fechar o alerta 1 dia antes, quando o dia do evento chegar o token mudará para a fase 'dia' e o alerta voltará a ser exibido.
  tokensAtivos: string[];
}

const STORAGE_KEY = 'compromissos_alerta_dismissed_tokens';

/**
 * Verifica se os alertas ativos atuais já foram dispensados pelo usuário.
 * Retorna true se TODOS os tokens ativos já foram dispensados.
 * Se houver ao menos 1 evento novo ou que mudou de fase (de véspera para dia), retorna false.
 */
export const isAlertDismissed = (tokens: string[]): boolean => {
  if (!tokens || tokens.length === 0) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissed: string[] = JSON.parse(raw);
    const dismissedSet = new Set(dismissed);
    return tokens.every(t => dismissedSet.has(t));
  } catch {
    return false;
  }
};

/**
 * Salva os tokens ativos como dispensados no localStorage.
 */
export const dismissAlertTokens = (tokens: string[]): void => {
  if (!tokens || tokens.length === 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    const updated = Array.from(new Set([...existing, ...tokens])).slice(-250);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao salvar descarte de alerta:', err);
  }
};

/**
 * Filtra as reuniões e visitas agendadas para Hoje e Amanhã (1 dia antes),
 * aplicando as regras de visualização do perfil do usuário logado.
 */
export const filtrarCompromissosHoje = (
  reunioes: ReuniaoEvento[],
  visitas: AgendaVisita[],
  user: Usuario | null
): CompromissosHoje => {
  const todayStr = getTodayDateStr();
  const tomorrowStr = getTomorrowDateStr();

  const isCJM = user?.perfis?.nome?.toLowerCase().includes('cjm') || false;
  const isGlobal = !isCJM && (
    user?.perfis?.nivel_acesso === 'global' || 
    user?.perfis?.nivel_acesso === 'setor' ||
    user?.perfis?.nome?.toLowerCase().includes('admin')
  );

  const tokensAtivos: string[] = [];

  // 1. Filtrar Reuniões de Hoje e de Amanhã (1 dia antes)
  const reunioesHoje: ReuniaoEvento[] = [];
  const reunioesAmanha: ReuniaoEvento[] = [];

  (reunioes || []).forEach(r => {
    if (!r.status) return;
    const rDate = r.data ? r.data.split('T')[0].split(' ')[0] : '';
    if (!rDate) return;

    // Se o usuário tem acesso restrito a uma comum, verifica se o evento é geral ou da sua comum
    if (!isGlobal && user?.comum_congregacao_id && r.comum_id) {
      if (r.comum_id !== user.comum_congregacao_id) return;
    }

    if (rDate === todayStr) {
      reunioesHoje.push(r);
      tokensAtivos.push(`reuniao_${r.id}_dia_${todayStr}`);
    } else if (rDate === tomorrowStr) {
      reunioesAmanha.push(r);
      tokensAtivos.push(`reuniao_${r.id}_vespera_${todayStr}`);
    }
  });

  // 2. Filtrar Visitas de Hoje e de Amanhã (1 dia antes)
  const visitasHoje: AgendaVisita[] = [];
  const visitasAmanha: AgendaVisita[] = [];

  (visitas || []).forEach(v => {
    const vDate = v.data_visita ? v.data_visita.split('T')[0].split(' ')[0] : '';
    if (!vDate) return;

    // Se o usuário tem acesso restrito a uma comum
    if (!isGlobal && user?.comum_congregacao_id) {
      if ((v.comum_id || '') !== user.comum_congregacao_id) return;
    }

    if (vDate === todayStr) {
      visitasHoje.push(v);
      tokensAtivos.push(`visita_${v.id}_dia_${todayStr}`);
    } else if (vDate === tomorrowStr) {
      visitasAmanha.push(v);
      tokensAtivos.push(`visita_${v.id}_vespera_${todayStr}`);
    }
  });

  const totalHoje = reunioesHoje.length + visitasHoje.length;
  const totalAmanha = reunioesAmanha.length + visitasAmanha.length;
  const totalGeral = totalHoje + totalAmanha;

  return {
    todayStr,
    tomorrowStr,
    todayFormatted: formatDateBR(todayStr),
    tomorrowFormatted: formatDateBR(tomorrowStr),
    reunioesHoje,
    reunioesAmanha,
    totalReunioes: reunioesHoje.length + reunioesAmanha.length,
    visitasHoje,
    visitasAmanha,
    totalVisitas: visitasHoje.length + visitasAmanha.length,
    totalHoje,
    totalAmanha,
    totalGeral,
    temCompromissos: totalGeral > 0,
    tokensAtivos,
  };
};
