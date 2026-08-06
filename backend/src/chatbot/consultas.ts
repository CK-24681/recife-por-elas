import crypto from 'node:crypto';
import type { Pool } from 'pg';
import { unificarOportunidadesExternas, type OportunidadeExterna } from '../integracoes';
import { sanitizarCandidatura, sanitizarOportunidade, sanitizarPerfil } from './privacy';
import type { ContextoChatbot, Intent, OportunidadePublica } from './types';

interface FiltrosOportunidade {
  tipo?: string;
  bairro?: string;
  busca?: string;
}

let cacheExternas: { expira: number; itens: OportunidadeExterna[] } | null = null;

function idExterno(item: OportunidadeExterna): string {
  const base = `${item.fonte}|${item.titulo}|${item.link_inscricao}`;
  return `ext:${crypto.createHash('sha256').update(base).digest('hex').slice(0, 20)}`;
}

function paraOportunidadeExterna(item: OportunidadeExterna): OportunidadePublica {
  return sanitizarOportunidade(item as unknown as Record<string, unknown>, idExterno(item), 'externa');
}

async function oportunidadesExternas(filtros?: FiltrosOportunidade): Promise<OportunidadePublica[]> {
  const agora = Date.now();
  if (!cacheExternas || cacheExternas.expira < agora) {
    cacheExternas = { expira: agora + 5 * 60_000, itens: await unificarOportunidadesExternas() };
  }
  let itens = cacheExternas.itens;
  if (filtros?.tipo) itens = itens.filter((item) => item.tipo === filtros.tipo);
  if (filtros?.bairro) {
    const bairro = filtros.bairro.toLowerCase();
    itens = itens.filter((item) => `${item.bairro} ${item.endereco}`.toLowerCase().includes(bairro));
  }
  if (filtros?.busca) {
    const busca = filtros.busca.toLowerCase();
    itens = itens.filter((item) => `${item.titulo} ${item.descricao} ${item.tipo}`.toLowerCase().includes(busca));
  }
  return itens.slice(0, 30).map(paraOportunidadeExterna);
}

export async function buscarOportunidades(pool: Pool | null, filtros: FiltrosOportunidade = {}, incluirExternas = true): Promise<OportunidadePublica[]> {
  const internas: OportunidadePublica[] = [];
  if (pool) {
    const valores: string[] = [];
    const where: string[] = [];
    if (filtros.tipo) { valores.push(filtros.tipo); where.push(`tipo = $${valores.length}`); }
    if (filtros.bairro) { valores.push(`%${filtros.bairro}%`); where.push(`bairro ILIKE $${valores.length}`); }
    if (filtros.busca) {
      valores.push(`%${filtros.busca}%`);
      where.push(`(titulo ILIKE $${valores.length} OR descricao ILIKE $${valores.length} OR tipo ILIKE $${valores.length})`);
    }
    const filtroSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, titulo, descricao, tipo, fonte, link_inscricao, bairro, horario
       FROM oportunidade ${filtroSql} ORDER BY id DESC LIMIT 40`,
      valores,
    );
    for (const row of result.rows as Record<string, unknown>[]) {
      const id = Number(row.id);
      if (Number.isInteger(id) && id > 0) internas.push(sanitizarOportunidade(row, `db:${id}`, 'interna', id));
    }
  }
  if (!incluirExternas) return internas;
  const externas = await oportunidadesExternas(filtros);
  return [...internas, ...externas].slice(0, 50);
}

export async function buscarPerfilSeguro(pool: Pool, usuarioId: string) {
  const result = await pool.query(
    `SELECT u.nome, p.bairro, p.filhos, p.turno_disponivel, p.interesses,
            p.experiencias, p.cursos, p.habilidades, p.sobre_mim
       FROM usuarios u LEFT JOIN perfil p ON p.usuario_id = u.id
      WHERE u.id = $1`,
    [usuarioId],
  );
  return sanitizarPerfil(result.rows[0] as Record<string, unknown> | undefined);
}

export async function buscarCandidaturasSeguras(pool: Pool, usuarioId: string) {
  const result = await pool.query(
    `SELECT c.id, c.oportunidade_id, c.data_candidatura, c.status,
            o.titulo AS oportunidade_titulo, o.tipo AS oportunidade_tipo
       FROM candidatura c JOIN oportunidade o ON o.id = c.oportunidade_id
      WHERE c.usuario_id = $1 ORDER BY c.data_candidatura DESC LIMIT 30`,
    [usuarioId],
  );
  return result.rows.map((row) => sanitizarCandidatura(row as Record<string, unknown>));
}

export async function montarContexto(pool: Pool | null, intent: Intent, usuarioId: string | null): Promise<ContextoChatbot> {
  const contexto: ContextoChatbot = { oportunidades: [] };
  if (intent === 'oportunidades' || intent === 'cursos' || intent === 'beneficios' || intent === 'mapa') {
    contexto.oportunidades = await buscarOportunidades(pool, {
      tipo: intent === 'cursos' ? 'Curso' : intent === 'beneficios' ? 'Benefício social' : undefined,
      busca: undefined,
    });
  } else if (intent === 'recomendacoes' || intent === 'plano_carreira') {
    if (pool && usuarioId) contexto.perfil = await buscarPerfilSeguro(pool, usuarioId);
    contexto.oportunidades = await buscarOportunidades(pool, {}, true);
  } else if (intent === 'minhas_candidaturas' || intent === 'status_candidatura') {
    if (pool && usuarioId) contexto.candidaturas = await buscarCandidaturasSeguras(pool, usuarioId);
  }
  return contexto;
}
