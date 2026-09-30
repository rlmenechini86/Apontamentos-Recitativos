-- Tabela de Recitativos
CREATE TABLE public.recitativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    comum_id UUID NOT NULL REFERENCES public.comum_congregacao(id) ON DELETE RESTRICT,
    mocos INTEGER NOT NULL DEFAULT 0,
    mocas INTEGER NOT NULL DEFAULT 0,
    meninos INTEGER NOT NULL DEFAULT 0,
    meninas INTEGER NOT NULL DEFAULT 0,
    total INTEGER GENERATED ALWAYS AS (mocos + mocas + meninos + meninas) STORED,
    cadastrado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Contagens de Mocidade / Santa Ceia
CREATE TABLE public.contagens_mocidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    comum_id UUID NOT NULL REFERENCES public.comum_congregacao(id) ON DELETE RESTRICT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Santa Ceia', 'Mocidade')),
    cadastrado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS
ALTER TABLE public.recitativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contagens_mocidade ENABLE ROW LEVEL SECURITY;

-- Cria políticas genéricas por enquanto (similar as outras tabelas)
CREATE POLICY "Permitir leitura para recitativos" ON public.recitativos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para recitativos" ON public.recitativos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para recitativos" ON public.recitativos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para recitativos" ON public.recitativos FOR DELETE USING (true);

CREATE POLICY "Permitir leitura para contagens_mocidade" ON public.contagens_mocidade FOR SELECT USING (true);
CREATE POLICY "Permitir inserção para contagens_mocidade" ON public.contagens_mocidade FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização para contagens_mocidade" ON public.contagens_mocidade FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão para contagens_mocidade" ON public.contagens_mocidade FOR DELETE USING (true);

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
