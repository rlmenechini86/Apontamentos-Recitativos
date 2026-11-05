import { supabase } from '../config/supabase.js';

export interface AuditLogEntry {
  usuario_id: string | null;
  usuario_email: string | null;
  acao: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN_FAILED' | 'ACCESS_DENIED';
  tabela_afetada: string;
  registro_id?: string | null;
  detalhes?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Servico de trilha de auditoria LGPD (Art. 46)
 * Registra todas as acoes sobre dados pessoais sensiveis
 */
export class AuditService {

  /**
   * Registra um evento de auditoria
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        usuario_id: entry.usuario_id,
        usuario_email: entry.usuario_email,
        acao: entry.acao,
        tabela_afetada: entry.tabela_afetada,
        registro_id: entry.registro_id || null,
        detalhes: entry.detalhes || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      // Log de auditoria nunca deve quebrar o fluxo principal
      console.error('[AuditService] Erro ao registrar auditoria:', err);
    }
  }

  /**
   * Registra login bem-sucedido
   */
  async logLogin(userId: string, email: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log({
      usuario_id: userId,
      usuario_email: email,
      acao: 'LOGIN',
      tabela_afetada: 'usuarios',
      detalhes: 'Login realizado com sucesso',
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  /**
   * Registra tentativa de login falhada
   */
  async logLoginFailed(email: string, reason: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log({
      usuario_id: null,
      usuario_email: email,
      acao: 'LOGIN_FAILED',
      tabela_afetada: 'usuarios',
      detalhes: reason,
      ip_address: ip,
      user_agent: userAgent,
    });
  }

  /**
   * Registra acesso negado
   */
  async logAccessDenied(userId: string | null, email: string | null, resource: string, ip?: string): Promise<void> {
    await this.log({
      usuario_id: userId,
      usuario_email: email,
      acao: 'ACCESS_DENIED',
      tabela_afetada: resource,
      detalhes: 'Tentativa de acesso nao autorizado',
      ip_address: ip,
    });
  }

  /**
   * Registra operacao CRUD em dados sensiveis
   */
  async logDataAccess(
    userId: string,
    email: string,
    acao: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    tabela: string,
    registroId?: string,
    detalhes?: string,
    ip?: string
  ): Promise<void> {
    await this.log({
      usuario_id: userId,
      usuario_email: email,
      acao,
      tabela_afetada: tabela,
      registro_id: registroId,
      detalhes,
      ip_address: ip,
    });
  }

  /**
   * Registra log específico de Lançamento ou Alteração de Apontamento
   * Contendo: data/hora, nome do usuário, congregação e os valores inseridos ou alterados
   */
  async logApontamentoAction(payload: {
    acao: 'CREATE' | 'UPDATE';
    tabela: 'recitativos' | 'contagens_mocidade';
    registroId: string;
    usuarioId: string | null;
    usuarioEmail: string | null;
    usuarioNome: string | null;
    comumNome?: string | null;
    dataApontamento?: string | null;
    valoresInseridos?: Record<string, any> | null;
    valoresAnteriores?: Record<string, any> | null;
    valoresAlterados?: Record<string, any> | null;
    valoresNovos?: Record<string, any> | null;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const detalhesObj = {
      tipo_operacao: payload.acao === 'CREATE' ? 'Lançamento de Apontamento' : 'Alteração de Apontamento',
      nome_usuario: payload.usuarioNome || 'Usuário Não Identificado',
      email_usuario: payload.usuarioEmail || null,
      tabela: payload.tabela,
      registro_id: payload.registroId,
      comum_nome: payload.comumNome || null,
      data_apontamento: payload.dataApontamento || null,
      valores_inseridos: payload.valoresInseridos || null,
      valores_anteriores: payload.valoresAnteriores || null,
      valores_alterados: payload.valoresAlterados || null,
      valores_novos: payload.valoresNovos || null,
      data_registro: new Date().toISOString(),
    };

    await this.log({
      usuario_id: payload.usuarioId,
      usuario_email: payload.usuarioEmail,
      acao: payload.acao,
      tabela_afetada: payload.tabela,
      registro_id: payload.registroId,
      detalhes: JSON.stringify(detalhesObj),
      ip_address: payload.ip,
      user_agent: payload.userAgent,
    });
  }

  /**
   * Consulta os logs de apontamentos gravados na trilha de auditoria
   */
  async getApontamentoLogs(limit = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('tabela_afetada', ['recitativos', 'contagens_mocidade'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data || [];
    } catch (err: any) {
      console.error('[AuditService] Erro ao buscar logs de apontamentos:', err);
      return [];
    }
  }

  /**
   * Consulta os logs de auditoria de um apontamento específico pelo seu registro_id
   */
  async getApontamentoLogsByRegistroId(registroId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('registro_id', registroId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[AuditService] Erro ao buscar por registro_id, tentando fallback em detalhes:', error.message);
        const fallback = await supabase
          .from('audit_logs')
          .select('*')
          .ilike('detalhes', `%"registro_id":"${registroId}"%`)
          .order('created_at', { ascending: false });
        return fallback.data || [];
      }

      if (!data || data.length === 0) {
        const fallback = await supabase
          .from('audit_logs')
          .select('*')
          .ilike('detalhes', `%"registro_id":"${registroId}"%`)
          .order('created_at', { ascending: false });
        return fallback.data || [];
      }

      return data || [];
    } catch (err: any) {
      console.error('[AuditService] Erro ao buscar logs por registro_id:', err);
      return [];
    }
  }
}

export const auditService = new AuditService();
