-- Adiciona a coluna secretario_id na tabela comum_congregacao
ALTER TABLE comum_congregacao ADD COLUMN IF NOT EXISTS secretario_id UUID REFERENCES usuarios(id);
