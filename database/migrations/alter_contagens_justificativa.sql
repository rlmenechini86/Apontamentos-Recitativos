-- ==============================================================================
-- MIGRATION: Justificativa de Diminuição da Mocidade
-- Adiciona coluna JSONB justificativas_diminuicao na tabela contagens_mocidade
-- ==============================================================================

ALTER TABLE public.contagens_mocidade
ADD COLUMN IF NOT EXISTS justificativas_diminuicao JSONB DEFAULT '[]'::jsonb;

-- Notificar PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

