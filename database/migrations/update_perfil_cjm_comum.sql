-- Atualização do perfil CJM para nível de acesso restrito à Comum Congregação
UPDATE public.perfis
SET 
  nivel_acesso = 'comum',
  descricao = 'Cooperador de Jovens e Menores com visão consolidada da sua Comum Congregação.'
WHERE LOWER(nome) = 'cjm' OR (LOWER(nome) LIKE '%cjm%' AND LOWER(nome) NOT LIKE '%setor%');

-- Notifica o PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';

