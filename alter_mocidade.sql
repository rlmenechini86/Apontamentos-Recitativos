ALTER TABLE public.mocidade 
ADD COLUMN IF NOT EXISTS is_auxiliar BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_musico BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS instrumento VARCHAR(255);

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
