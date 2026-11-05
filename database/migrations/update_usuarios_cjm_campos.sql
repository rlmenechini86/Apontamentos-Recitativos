-- ==============================================================================
-- Migração: Adiciona campos específicos para CJM e Secretário / CJM na tabela usuarios
-- Campos: ano_casamento, selado_promessa, ano_batismo
-- ==============================================================================

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS ano_casamento INTEGER,
ADD COLUMN IF NOT EXISTS selado_promessa BOOLEAN,
ADD COLUMN IF NOT EXISTS ano_batismo INTEGER;

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';

