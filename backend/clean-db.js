const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgres://postgres:@localhost:5432/app' });
  try {
    await client.connect();
    const res = await client.query(`DELETE FROM app_recife_por_elas.oportunidade WHERE fonte IN ('Sine Recife', 'Agência do Trabalho PE', 'Qualifica Recife', 'SENAC Pernambuco', 'Prefeitura do Recife', 'CredAmigo / Banco do Nordeste')`);
    console.log(`Deleted ${res.rowCount} rows`);
  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
