CREATE TABLE IF NOT EXISTS public.mocidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo VARCHAR(50) NOT NULL,
    responsavel VARCHAR(255),
    telefone_contato VARCHAR(50),
    comum_id UUID REFERENCES public.comuns_congregacoes(id),
    musico BOOLEAN DEFAULT false,
    instrumento VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mocidade_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mocidade_updated_at ON public.mocidade;

CREATE TRIGGER update_mocidade_updated_at
    BEFORE UPDATE ON public.mocidade
    FOR EACH ROW
    EXECUTE FUNCTION update_mocidade_updated_at_column();

-- Políticas RLS
ALTER TABLE public.mocidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON public.mocidade FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all authenticated users" ON public.mocidade FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all authenticated users" ON public.mocidade FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all authenticated users" ON public.mocidade FOR DELETE USING (true);
