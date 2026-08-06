import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import OpenAI from 'openai';

for (const envPath of [path.join(process.cwd(), '.env'), path.join(process.cwd(), '..', '.env')]) {
  try { loadEnvFile(envPath); } catch { /* arquivo opcional */ }
}

const diretorio = path.join(process.cwd(), 'conhecimento');
const arquivos = (await fs.readdir(diretorio)).filter((nome) => nome.endsWith('.md')).sort();
const cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let storeId = process.env.OPENAI_VECTOR_STORE_ID;
if (storeId) {
  await cliente.vectorStores.retrieve(storeId);
} else {
  const store = await cliente.vectorStores.create({ name: 'recife-por-elas-conhecimento' });
  storeId = store.id;
  console.log(`OPENAI_VECTOR_STORE_ID=${storeId}`);
}

async function aguardarProcessamento(fileId) {
  for (let tentativa = 0; tentativa < 60; tentativa += 1) {
    const item = await cliente.vectorStores.files.retrieve(storeId, fileId);
    if (item.status === 'completed') return;
    if (item.status === 'failed' || item.status === 'cancelled') throw new Error(`falha ao processar ${fileId}: ${item.status}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`tempo excedido ao processar ${fileId}`);
}

for (const nome of arquivos) {
  const caminho = path.join(diretorio, nome);
  const arquivo = await cliente.files.create({ file: createReadStream(caminho), purpose: 'assistants' });
  await cliente.vectorStores.files.create(storeId, { file_id: arquivo.id });
  await aguardarProcessamento(arquivo.id);
  console.log(`sincronizado ${nome} (${arquivo.id})`);
}

console.log(`Vector Store pronta: ${storeId}`);
