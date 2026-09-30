ALTER TABLE comum_congregacao ADD COLUMN anciao_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
