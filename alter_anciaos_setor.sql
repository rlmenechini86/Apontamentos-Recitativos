-- ==============================================================================
-- MIGRATION: Adição de Setor Pertencente na tabela de Anciãos
-- Tabela: public.anciaos
-- ==============================================================================

-- 1. Adicionar o campo "setor_pertencente"
ALTER TABLE public.anciaos 
ADD COLUMN IF NOT EXISTS setor_pertencente VARCHAR(150);

-- 2. Adicionar opcionalmente a chave estrangeira "setor_id"
ALTER TABLE public.anciaos 
ADD COLUMN IF NOT EXISTS setor_id UUID REFERENCES public.setores(id) ON DELETE SET NULL;

-- 3. Criar índice para otimização de buscas por setor
CREATE INDEX IF NOT EXISTS idx_anciaos_setor_pertencente ON public.anciaos(setor_pertencente);

-- 4. Notificar a API REST do Supabase para recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
