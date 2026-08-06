import type { ContextoPerfilSeguro, OportunidadePublica } from './types';

const CHAVES_PROIBIDAS = new Set([
  'senha', 'senha_hash', 'password', 'hash', 'cpf', 'telefone', 'email', 'email_cifrado',
  'email_indice', 'token', 'token_hash', 'reset_senha', 'ip', 'user_agent', 'referrer',
  'authorization', 'cookie', 'session', 'session_id', 'foto_url', 'photo_url',
]);

function chaveProibida(chave: string): boolean {
  const normalizada = chave.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return CHAVES_PROIBIDAS.has(normalizada) || /senha|password|cpf|token|email_cifrado|ip|user_agent/.test(normalizada);
}

export function sanitizarTexto(valor: unknown, maximo = 500): string {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[e-mail removido]')
    .replace(/\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g, '[CPF removido]')
    .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}\b/g, '[telefone removido]')
    .trim().slice(0, maximo);
}

function urlPublica(valor: unknown): string {
  const url = sanitizarTexto(valor, 400);
  return /^https?:\/\//i.test(url) ? url : '';
}

function listaSegura(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.filter((item): item is string => typeof item === 'string').map((item) => sanitizarTexto(item, 120)).filter(Boolean).slice(0, 12);
  if (typeof valor === 'string') {
    try { return listaSegura(JSON.parse(valor)); } catch { return []; }
  }
  return [];
}

export function sanitizarPerfil(row: Record<string, unknown> | undefined): ContextoPerfilSeguro | undefined {
  if (!row) return undefined;
  return {
    nome: sanitizarTexto(row.nome, 80).split(/\s+/)[0] || undefined,
    bairro: sanitizarTexto(row.bairro, 100) || undefined,
    filhos: typeof row.filhos === 'number' ? Math.max(0, Math.min(20, row.filhos)) : undefined,
    turno_disponivel: sanitizarTexto(row.turno_disponivel, 100) || undefined,
    interesses: listaSegura(row.interesses),
    experiencias: listaSegura(row.experiencias),
    cursos: listaSegura(row.cursos),
    habilidades: listaSegura(row.habilidades),
    sobre_mim: sanitizarTexto(row.sobre_mim, 400) || undefined,
  };
}

export function sanitizarOportunidade(row: Record<string, unknown>, id: string, origem: 'interna' | 'externa', oportunidadeId?: number): OportunidadePublica {
  return {
    id,
    titulo: sanitizarTexto(row.titulo, 180),
    descricao: sanitizarTexto(row.descricao, 500),
    tipo: sanitizarTexto(row.tipo, 80),
    fonte: sanitizarTexto(row.fonte || row.empresa, 120),
    link_inscricao: urlPublica(row.link_inscricao),
    bairro: sanitizarTexto(row.bairro, 100),
    horario: sanitizarTexto(row.horario, 160),
    origem,
    oportunidadeId,
  };
}

export function sanitizarCandidatura(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    oportunidade_id: Number(row.oportunidade_id),
    oportunidade_titulo: sanitizarTexto(row.oportunidade_titulo, 180),
    oportunidade_tipo: sanitizarTexto(row.oportunidade_tipo, 80),
    data_candidatura: sanitizarTexto(row.data_candidatura, 40),
    status: sanitizarTexto(row.status, 80),
  };
}

export function contemChaveProibida(valor: unknown): boolean {
  if (Array.isArray(valor)) return valor.some(contemChaveProibida);
  if (!valor || typeof valor !== 'object') return false;
  return Object.entries(valor).some(([chave, item]) => chaveProibida(chave) || contemChaveProibida(item));
}

export function sanitizarObjetoGenerico(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(sanitizarObjetoGenerico);
  if (!valor || typeof valor !== 'object') return valor;
  const resultado: Record<string, unknown> = {};
  for (const [chave, item] of Object.entries(valor)) {
    if (!chaveProibida(chave)) resultado[chave] = sanitizarObjetoGenerico(item);
  }
  return resultado;
}
