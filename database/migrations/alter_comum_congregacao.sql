-- ==============================================================================
-- MIGRATION: Adição de Setor Pertencente e Remoção de Campos Obsoletos
-- Tabela: public.comum_congregacao
-- ==============================================================================

-- 1. Adicionar o novo campo "setor_pertencente"
ALTER TABLE public.comum_congregacao 
ADD COLUMN IF NOT EXISTS setor_pertencente VARCHAR(150);

-- 2. Preencher "setor_pertencente" com base no setor_id já vinculado para dados existentes
UPDATE public.comum_congregacao c
SET setor_pertencente = s.nome
FROM public.setores s
WHERE c.setor_id = s.id AND (c.setor_pertencente IS NULL OR c.setor_pertencente = '');

-- Se houver congregação sem setor_id vinculado, define um padrão
UPDATE public.comum_congregacao
SET setor_pertencente = 'Setor 1 - Centro'
WHERE setor_pertencente IS NULL OR setor_pertencente = '';

-- 3. Remover índices vinculados a colunas que serão excluídas
DROP INDEX IF EXISTS public.idx_comum_cidade;

-- 4. Criar índice para buscas otimizadas pelo campo setor_pertencente
CREATE INDEX IF NOT EXISTS idx_comum_setor_pertencente ON public.comum_congregacao(setor_pertencente);

-- 5. Remover definitivamente os campos que não serão mais utilizados
-- (Cidade, UF, Bairro, CEP e Endereço)
ALTER TABLE public.comum_congregacao 
DROP COLUMN IF EXISTS endereco,
DROP COLUMN IF EXISTS bairro,
DROP COLUMN IF EXISTS cidade,
DROP COLUMN IF EXISTS estado,
DROP COLUMN IF EXISTS cep;

-- 6. Notificar o serviço de cache da API REST do Supabase para recarregar o schema imediatamente
NOTIFY pgrst, 'reload schema';
