-- ==============================================================================
-- Migração: Criação da Tabela de Pré-Cadastros de Usuários
-- Permite receber inscrições públicas para posterior aprovação ou recusa
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pre_cadastros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    celular VARCHAR(25) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    data_apresentacao DATE,
    data_nascimento DATE,
    ano_casamento INTEGER,
    selado_promessa BOOLEAN,
    ano_batismo INTEGER,
    setor_id UUID REFERENCES public.setores(id) ON DELETE SET NULL,
    setor_pertencente VARCHAR(100),
    comum_congregacao_id UUID REFERENCES public.comum_congregacao(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovado', 'recusado'
    motivo_recusa TEXT,
    perfil_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    aprovado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_pre_cadastros_status ON public.pre_cadastros(status);
CREATE INDEX IF NOT EXISTS idx_pre_cadastros_email ON public.pre_cadastros(email);
CREATE INDEX IF NOT EXISTS idx_pre_cadastros_setor ON public.pre_cadastros(setor_id);
CREATE INDEX IF NOT EXISTS idx_pre_cadastros_comum ON public.pre_cadastros(comum_congregacao_id);

-- Configuração de RLS
ALTER TABLE public.pre_cadastros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Liberar insert publico em pre_cadastros" ON public.pre_cadastros;
CREATE POLICY "Liberar insert publico em pre_cadastros"
ON public.pre_cadastros
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Liberar operacoes para autenticados em pre_cadastros" ON public.pre_cadastros;
CREATE POLICY "Liberar operacoes para autenticados em pre_cadastros"
ON public.pre_cadastros
FOR ALL
USING (true);

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';

