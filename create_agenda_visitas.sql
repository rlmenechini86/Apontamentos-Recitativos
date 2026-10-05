CREATE TABLE IF NOT EXISTS agenda_visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  endereco TEXT,
  horario VARCHAR(10),
  ponto_encontro TEXT,
  cor VARCHAR(50) DEFAULT '#10b981',
  data_visita DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
