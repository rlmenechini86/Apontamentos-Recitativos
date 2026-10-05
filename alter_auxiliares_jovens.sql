ALTER TABLE public.auxiliares_jovens 
ADD COLUMN is_auxiliar BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN is_musico BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN instrumento VARCHAR(255);

-- Se você já havia rodado o script anterior (que criava "instrumentos TEXT[]"), 
-- pode remover a coluna antiga antes rodando: 
-- ALTER TABLE public.auxiliares_jovens DROP COLUMN IF EXISTS instrumentos;

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
