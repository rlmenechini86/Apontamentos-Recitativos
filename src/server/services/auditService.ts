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
}

export const auditService = new AuditService();
