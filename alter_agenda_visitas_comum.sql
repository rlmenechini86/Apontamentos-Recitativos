ALTER TABLE agenda_visitas ADD COLUMN comum_id UUID REFERENCES comum_congregacao(id);
