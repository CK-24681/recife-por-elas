import fs from 'node:fs/promises';
import path from 'node:path';

const DIRETORIO = path.join(__dirname, '..', '..', 'conhecimento');
const DOCUMENTOS: Record<string, string[]> = {
  geral: ['visao-geral.md'],
  como_funciona: ['visao-geral.md'],
  oportunidades: ['oportunidades.md'],
  cursos: ['oportunidades.md'],
  beneficios: ['oportunidades.md'],
  mapa: ['oportunidades.md'],
  rede_apoio: ['rede-apoio.md'],
  plano_carreira: ['plano-carreira.md'],
};

export async function carregarConhecimento(chave: string): Promise<string> {
  const nomes = DOCUMENTOS[chave] || DOCUMENTOS.geral;
  const partes = await Promise.all(nomes.map(async (nome) => {
    try { return await fs.readFile(path.join(DIRETORIO, nome), 'utf8'); } catch { return ''; }
  }));
  return partes.filter(Boolean).join('\n\n').slice(0, 12_000);
}

export function diretorioConhecimento(): string {
  return DIRETORIO;
}
