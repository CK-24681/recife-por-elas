// Telemetria embutida em TODA app filha:
//   - acessos: 1 linha por carregamento de página (pageview), logado ou anônimo.
//             O FRONTEND chama POST /api/acessos a cada navegação (SPA não recarrega).
//   - logs:    1 linha por chamada que ALTERA dados (POST/PUT/PATCH/DELETE) — login,
//             cadastro e qualquer CRUD — gravada AUTOMATICAMENTE por um middleware.
// Nunca registramos o corpo da requisição (evita vazar senha). Tudo best-effort:
// telemetria nunca derruba nem atrasa a request do usuário.
import type { Express, Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { validarToken } from './auth';

// Cria as tabelas de telemetria no schema da app (idempotente). Chamar no boot.
export async function inicializarRegistros(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS acessos (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id  UUID,
      caminho     TEXT NOT NULL,
      referrer    TEXT,
      user_agent  TEXT,
      ip          TEXT,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_acessos_criado ON acessos (criado_em DESC)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id  UUID,
      acao        TEXT NOT NULL,
      entidade    TEXT,
      metodo      TEXT,
      caminho     TEXT,
      status      INTEGER,
      detalhe     JSONB,
      ip          TEXT,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_logs_criado ON logs (criado_em DESC)`);
}

// ipDoRequest — IP real do cliente (atrás do Nginx vem em X-Forwarded-For).
function ipDoRequest(req: Request): string | null {
  const xff = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0].trim() || req.socket.remoteAddress || '';
  return ip || null;
}

// usuarioDoRequest — id do usuário logado a partir do Bearer (ou null se anônimo).
function usuarioDoRequest(req: Request): string | null {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? validarToken(h.slice(7)) : null;
}

// registrarLog grava uma ação na tabela logs. Best-effort (não bloqueia a request).
// O agente pode chamar isto para logs de domínio mais ricos (acao/entidade/detalhe).
export function registrarLog(
  pool: Pool | null,
  dados: {
    usuarioId?: string | null;
    acao: string;
    entidade?: string | null;
    metodo?: string | null;
    caminho?: string | null;
    status?: number | null;
    detalhe?: unknown;
    ip?: string | null;
  },
): void {
  if (!pool) return;
  pool
    .query(
      `INSERT INTO logs (usuario_id, acao, entidade, metodo, caminho, status, detalhe, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        dados.usuarioId ?? null,
        dados.acao,
        dados.entidade ?? null,
        dados.metodo ?? null,
        dados.caminho ?? null,
        dados.status ?? null,
        dados.detalhe != null ? JSON.stringify(dados.detalhe) : null,
        dados.ip ?? null,
      ],
    )
    .catch((e) => console.error('registrarLog', e));
}

// registrarTelemetria liga (chamar ANTES das rotas, para o middleware interceptá-las):
//   1) middleware que loga TODA chamada que altera dados (POST/PUT/PATCH/DELETE);
//   2) POST /api/acessos — o frontend bate a cada carregamento de página.
// ehTesteDaPlataforma — a requisição veio do navegador da suíte E2E?
//
// A suíte roda contra a app PUBLICADA, com dados de verdade, e sem esta checagem
// tudo o que ela faz vira "uso" no painel do dono: numa app real apareceram 57
// pessoas e 24 produtos, dos quais 21 produtos eram do teste. Um painel que
// conta o próprio robô como cliente não serve pra decidir nada.
function ehTesteDaPlataforma(req: Request): boolean {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' && ua.includes('AlfaiaE2E');
}

export function registrarTelemetria(app: Express, pool: Pool): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const metodo = req.method.toUpperCase();
    // GET/HEAD/OPTIONS não alteram dados; o pageview tem tabela própria (acessos).
    if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS' || req.path === '/api/acessos') {
      return next();
    }
    if (ehTesteDaPlataforma(req)) {
      return next(); // o robô da plataforma não é usuário desta app
    }
    const usuarioId = usuarioDoRequest(req);
    const ip = ipDoRequest(req);
    // Loga DEPOIS de responder (já temos o status). Nunca o corpo (pode ter senha).
    res.on('finish', () => {
      registrarLog(pool, { usuarioId, acao: 'api', metodo, caminho: req.path, status: res.statusCode, ip });
    });
    next();
  });

  // Pageview: chamado pelo frontend a cada carregamento/navegação (logado ou não).
  app.post('/api/acessos', (req: Request, res: Response) => {
    if (ehTesteDaPlataforma(req)) {
      res.status(204).end(); // visita do robô não conta como visita
      return;
    }
    const caminho = (String(req.body?.caminho || '/') || '/').slice(0, 512);
    const referrer = req.body?.referrer ? String(req.body.referrer).slice(0, 512) : null;
    const ua = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 512) : null;
    if (pool) {
      pool
        .query(
          `INSERT INTO acessos (usuario_id, caminho, referrer, user_agent, ip) VALUES ($1,$2,$3,$4,$5)`,
          [usuarioDoRequest(req), caminho, referrer, ua, ipDoRequest(req)],
        )
        .catch((e) => console.error('acessos', e));
    }
    res.status(204).end(); // fire-and-forget; sem corpo
  });
}
