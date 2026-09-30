-- ==============================================================================
-- MIGRATION: Adição da coluna senha_hash na tabela usuarios
-- Permite autenticação com senhas criptografadas via bcrypt
-- ==============================================================================

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);

-- Notificar o PostgREST para recarregar o cache de schemas
NOTIFY pgrst, 'reload schema';
