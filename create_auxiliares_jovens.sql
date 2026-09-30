-- Cria a tabela de Auxiliares de Jovens
CREATE TABLE public.auxiliares_jovens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    data_apresentacao DATE,
    sexo VARCHAR(20) NOT NULL CHECK (sexo IN ('Feminino', 'Masculino')),
    celular VARCHAR(20),
    data_nascimento DATE,
    comum_id UUID REFERENCES public.comum_congregacao(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.auxiliares_jovens ENABLE ROW LEVEL SECURITY;

-- Cria políticas de acesso (permitindo tudo para o papel autenticado e anônimo por enquanto, assim como as outras tabelas)
CREATE POLICY "Permitir leitura para auxiliares_jovens" 
ON public.auxiliares_jovens FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para auxiliares_jovens" 
ON public.auxiliares_jovens FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para auxiliares_jovens" 
ON public.auxiliares_jovens FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para auxiliares_jovens" 
ON public.auxiliares_jovens FOR DELETE USING (true);

-- Notifica o PostgREST para recarregar o schema do Supabase
NOTIFY pgrst, 'reload schema';
