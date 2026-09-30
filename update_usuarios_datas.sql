-- Adiciona colunas de datas na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS data_apresentacao DATE,
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
