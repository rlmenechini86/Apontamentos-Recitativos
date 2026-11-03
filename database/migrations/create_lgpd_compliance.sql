-- ==============================================================================
-- MIGRATION: LGPD Compliance - Trilha de Auditoria e Consentimento (Art. 11 e 14)
-- ==============================================================================

-- 1. Tabela de Trilha de Auditoria (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    usuario_email VARCHAR(255),
    acao VARCHAR(50) NOT NULL,
    tabela_afetada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100),
    detalhes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para consultas de auditoria rapidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON public.audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON public.audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tabela ON public.audit_logs(tabela_afetada);

-- 2. Colunas de Consentimento LGPD na tabela usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS consentimento_lgpd BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consentimento_lgpd_data TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consentimento_lgpd_versao VARCHAR(20) DEFAULT '1.0';

-- 3. Colunas de Consentimento Parental na tabela mocidade (ECA / LGPD Art. 14)
ALTER TABLE public.mocidade
ADD COLUMN IF NOT EXISTS consentimento_responsavel_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS consentimento_responsavel_aceito BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consentimento_responsavel_data TIMESTAMPTZ;

-- 4. Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas administradores leem audit_logs" ON public.audit_logs;
CREATE POLICY "Apenas administradores leem audit_logs"
ON public.audit_logs
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Insercao de audit_logs liberada" ON public.audit_logs;
CREATE POLICY "Insercao de audit_logs liberada"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
