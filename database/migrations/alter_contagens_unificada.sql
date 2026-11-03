-- ==============================================================================
-- MIGRATION: Unificação de Apontamentos de Mocidade (Auxiliares e Músicos)
-- Adiciona campos de Auxiliares Moças, Auxiliares Moços e Músicos por Família
-- ==============================================================================

ALTER TABLE public.contagens_mocidade
ADD COLUMN IF NOT EXISTS auxiliares_mocas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auxiliares_mocos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_musicos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS detalhes_musicos JSONB DEFAULT '[]'::jsonb;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
