import { Pool } from 'pg';

// Pool do Postgres fixando o schema do projeto (search_path), conforme o
// contrato Alfaia. A app NUNCA prefixa schema no SQL — o search_path resolve.
export function criarPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    options: process.env.DB_SCHEMA ? `-c search_path=${process.env.DB_SCHEMA}` : undefined,

    // TETO DE CONEXÕES — o default do node-postgres é 10 POR APP, e todas as apps
    // dividem o MESMO Postgres com a plataforma. Com max_connections=100, dez
    // apps sob uso simultâneo já estouram o servidor e TODAS passam a devolver
    // "sorry, too many clients already" — inclusive as que não têm carga nenhuma.
    // Uma app de negócio pequeno atende dezenas de pessoas com 3 conexões, porque
    // query dura milissegundos; o que ela precisa é de fila curta, não de pool
    // grande. Ajustável por env se alguma app crescer de verdade.
    max: Number(process.env.DB_POOL_MAX || 3),

    // Devolve a conexão pro servidor quando a app fica parada (o padrão já é 10s,
    // mas explícito porque é o que impede uma app ociosa de segurar vaga).
    idleTimeoutMillis: 10_000,

    // Falhar RÁPIDO quando o servidor está no limite é melhor que pendurar a
    // requisição do cliente final por 30s até estourar.
    connectionTimeoutMillis: 5_000,
  });
}
