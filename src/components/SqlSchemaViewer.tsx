import React, { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, MapPin, Users, CheckCircle2 } from 'lucide-react';

const SQL_SCRIPT = `-- ==============================================================================
-- SISTEMA DE CONTROLE DE APONTAMENTOS DE JOVENS E MENORES
-- Módulo 1: Fundação do Banco de Dados e Localidades & Usuários
-- Compatibilidade: PostgreSQL 14+ / Supabase
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. Tabela: perfis (Perfis de Acesso)
-- Regra 2: "Administrador" (global), "CJM" (Setor), "Apontamento" (Comum)
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
-- 4. Tabela: comum_congregacao (Comuns Congregações)
-- Regra 1: Toda Comum Congregação pertence obrigatoriamente a um Setor
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comum_congregacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) UNIQUE,
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL DEFAULT 'SP',
    cep VARCHAR(10),
    dia_reuniao_jovens VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comum_setor_id ON public.comum_congregacao(setor_id);
CREATE INDEX IF NOT EXISTS idx_comum_cidade ON public.comum_congregacao(cidade);
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

-- Setor Inicial de Exemplo
INSERT INTO public.setores (id, codigo, nome, cidade, estado, descricao)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'SET-01', 'Setor Central', 'São Paulo', 'SP', 'Setor compreendendo as congregações centrais e adjacências')
ON CONFLICT (codigo) DO NOTHING;

-- Comum Congregação Inicial de Exemplo
INSERT INTO public.comum_congregacao (id, setor_id, codigo, nome, endereco, bairro, cidade, estado, cep, dia_reuniao_jovens)
VALUES 
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'CC-001', 'Brás - Central', 'Rua Miller, 456', 'Brás', 'São Paulo', 'SP', '03011-010', 'Domingo 09:30')
ON CONFLICT (codigo) DO NOTHING;`;

export const SqlSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo da Modelagem */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100">1. perfis</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Armazena os 3 perfis de acesso definidos na Regra 2: <strong>Administrador</strong> (global), <strong>CJM</strong> (setor) e <strong>Apontamento</strong> (comum).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <MapPin className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100">2. setores</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Regra 1: Agrupamento administrativo de congregações. Todo setor possui código, nome, cidade, UF e status.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Database className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100">3. comum_congregacao</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Entidade central do Módulo 1. Chave estrangeira obrigatória <code className="text-emerald-400">setor_id</code> com integridade referencial.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-sky-400 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-semibold text-slate-100">4. usuarios</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Regra 3: Nome Completo, E-mail, Celular, Perfil de Acesso (<code className="text-sky-400">perfil_id</code>) e Vínculo com a Comum (<code className="text-sky-400">comum_congregacao_id</code>).
          </p>
        </div>
      </div>

      {/* Editor / Visualizador SQL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm text-slate-200">database/schema.sql</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              PostgreSQL / Supabase DDL
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Script SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed select-all">
            {SQL_SCRIPT}
          </pre>
        </div>

        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Compatível com Supabase SQL Editor e migrações PostgreSQL.</span>
          </div>
          <span className="font-mono text-slate-500">database/schema.sql</span>
        </div>
      </div>
    </div>
  );
};
