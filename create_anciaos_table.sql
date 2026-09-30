CREATE TABLE public.anciaos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    data_cadastro DATE DEFAULT CURRENT_DATE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.anciaos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura para anciaos" 
ON public.anciaos FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para anciaos" 
ON public.anciaos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para anciaos" 
ON public.anciaos FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para anciaos" 
ON public.anciaos FOR DELETE USING (true);

-- Drop the old constraint from comum_congregacao
ALTER TABLE public.comum_congregacao 
DROP CONSTRAINT IF EXISTS comum_congregacao_anciao_id_fkey;

-- We probably should NULL out the existing anciao_id to prevent UUID type mismatches if they were pointing to usuarios
UPDATE public.comum_congregacao SET anciao_id = NULL;

-- Add new constraint pointing to anciaos
ALTER TABLE public.comum_congregacao
ADD CONSTRAINT comum_congregacao_anciao_id_fkey 
FOREIGN KEY (anciao_id) REFERENCES public.anciaos(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
