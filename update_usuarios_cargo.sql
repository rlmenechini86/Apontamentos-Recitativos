-- Adiciona a coluna cargo_ministerio na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS cargo_ministerio VARCHAR(50);

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
