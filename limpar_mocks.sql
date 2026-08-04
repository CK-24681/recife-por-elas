-- limpar_mocks.sql
-- Script idempotente para remover vagas fictícias/mockadas do banco de produção.
-- Execute APENAS se o banco já tiver sido populado com o seed de dados simulados
-- (inseridos automaticamente pela versão anterior da aplicação).
--
-- Uso:
--   psql $DATABASE_URL -f limpar_mocks.sql
--   ou via docker exec:
--   docker exec -i <container_postgres> psql -U postgres -d <banco> < limpar_mocks.sql

-- Remove as vagas inseridas pelo seed fictício (identificadas pela fonte)
DELETE FROM oportunidade
WHERE fonte IN (
  'Sine Recife',
  'Agência do Trabalho PE',
  'Qualifica Recife',
  'SENAC Pernambuco',
  'Prefeitura do Recife',
  'CredAmigo / Banco do Nordeste'
);

-- Opcional: reinicia a sequência de IDs para começar do 1 se a tabela ficou vazia
-- (remova o comentário se quiser executar este passo)
-- SELECT setval('oportunidade_id_seq', 1, false) WHERE NOT EXISTS (SELECT 1 FROM oportunidade);

-- Confirmação
DO $$
BEGIN
  RAISE NOTICE 'Limpeza concluída. Registros remanescentes: %',
    (SELECT COUNT(*) FROM oportunidade);
END;
$$;
