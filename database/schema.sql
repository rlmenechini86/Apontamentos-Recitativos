-- ==============================================================================
-- SISTEMA DE CONTROLE DE APONTAMENTOS DE JOVENS E MENORES
-- Módulo 1: Fundação do Banco de Dados e Localidades & Usuários
-- Compatibilidade: PostgreSQL 14+ / Supabase
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. Tabela: perfis (Perfis de Acesso)
-- Regra 2: Perfis "Administrador" (global), "CJM" (Setor), "Apontamento" (Comum)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    nivel_acesso VARCHAR(20) NOT NULL CHECK (nivel_acesso IN ('global', 'setor', 'comum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Tabela: setores (Setores Administrativos)
-- Regra 1: Agrupamento geográfico/administrativo das Comuns Congregações
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.setores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL DEFAULT 'SP',
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. Tabela: comum_congregacao (Comuns Congregações Simplificada)
-- Regra 1: Toda Comum Congregação possui o Setor Pertencente vinculado
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comum_congregacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setor_id UUID REFERENCES public.setores(id) ON DELETE RESTRICT,
    setor_pertencente VARCHAR(150),
    codigo VARCHAR(30) UNIQUE,
    nome VARCHAR(150) NOT NULL,
    dia_reuniao_jovens VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comum_setor_id ON public.comum_congregacao(setor_id);
CREATE INDEX IF NOT EXISTS idx_comum_setor_pertencente ON public.comum_congregacao(setor_pertencente);
CREATE INDEX IF NOT EXISTS idx_comum_ativo ON public.comum_congregacao(ativo);

-- ==============================================================================
-- 5. Tabela: usuarios (Usuários do Sistema)
-- Regra 3: Nome Completo, E-mail, Celular, Perfil de Acesso e Vínculo com a Comum
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    celular VARCHAR(25) NOT NULL,
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE RESTRICT,
    comum_congregacao_id UUID REFERENCES public.comum_congregacao(id) ON DELETE SET NULL,
    senha_hash VARCHAR(255),
    trocar_senha_proximo_login BOOLEAN NOT NULL DEFAULT true,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil_id ON public.usuarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_comum_id ON public.usuarios(comum_congregacao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);

-- ==============================================================================
-- 6. Trigger para atualização automática da coluna updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_perfis_updated_at ON public.perfis;
CREATE TRIGGER trigger_update_perfis_updated_at
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_setores_updated_at ON public.setores;
CREATE TRIGGER trigger_update_setores_updated_at
    BEFORE UPDATE ON public.setores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_comum_congregacao_updated_at ON public.comum_congregacao;
CREATE TRIGGER trigger_update_comum_congregacao_updated_at
    BEFORE UPDATE ON public.comum_congregacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER trigger_update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. Seeds Iniciais (Perfis obrigatórios e dados de demonstração)
-- ==============================================================================
INSERT INTO public.perfis (id, nome, descricao, nivel_acesso)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso irrestrito com visão global de todos os setores e congregações.', 'global'),
    ('22222222-2222-2222-2222-222222222222', 'CJM', 'Cooperador de Jovens e Menores com visão consolidada do seu Setor.', 'setor'),
    ('33333333-3333-3333-3333-333333333333', 'Apontamento', 'Responsável pelo registro de apontamentos da sua própria Comum Congregação.', 'comum')
ON CONFLICT (nome) DO UPDATE 
SET descricao = EXCLUDED.descricao, nivel_acesso = EXCLUDED.nivel_acesso;

-- Setores Solicitados
INSERT INTO public.setores (id, codigo, nome, cidade, estado, descricao)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'SET-01', 'Setor 1 - Centro', 'Guarulhos', 'SP', 'Setor 1 - Região Central e adjacências'),
    ('592b68a0-d1a1-4eed-b5e0-a866a8959265', 'SET-02', 'Setor 2 - Aeroporto', 'Guarulhos', 'SP', 'Setor 2 - Região Aeroporto e adjacências'),
    ('fb53a1b8-945d-43a6-b825-61ba481d59d9', 'SET-03', 'Setor 3 - Bonsucesso', 'Guarulhos', 'SP', 'Setor 3 - Região Bonsucesso e adjacências'),
    ('c5b312d8-6bbd-437d-aafa-ccbbff7369d0', 'SET-04', 'Setor 4 - Pimentas', 'Guarulhos', 'SP', 'Setor 4 - Região Pimentas e adjacências')
ON CONFLICT (codigo) DO UPDATE 
SET nome = EXCLUDED.nome, cidade = EXCLUDED.cidade, estado = EXCLUDED.estado, descricao = EXCLUDED.descricao;

-- Comum Congregação Inicial de Exemplo
INSERT INTO public.comum_congregacao (id, setor_id, setor_pertencente, codigo, nome, dia_reuniao_jovens)
VALUES 
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Setor 1 - Centro', 'CC-001', 'Brás - Central', 'Domingo 10hs')
ON CONFLICT (codigo) DO UPDATE
SET setor_pertencente = EXCLUDED.setor_pertencente, dia_reuniao_jovens = EXCLUDED.dia_reuniao_jovens;
