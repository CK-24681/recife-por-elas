// Rotas da aplicação Recife Por Elas: oportunidades, candidaturas, mural, perfil.
// Toda rota de dado do usuário exige token (401 sem token) e filtra por
// usuario_id do TOKEN — nunca um id vindo do cliente.
import type { Express, Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { validarToken, decifrarEmail } from './auth';
import { unificarOportunidadesExternas } from './integracoes';

// Extende Request com usuarioId (validado pelo token).
interface ReqAuth extends Request {
  usuarioId?: string;
}

// Pool e schema (definidos no server.ts e passados aqui).
let _pool: Pool | null = null;
let _schema = '';

export function poolAtual(): Pool | null { return _pool; }

/** Middleware: exige token válido (Authorization: Bearer ...). */
function autenticar(req: ReqAuth, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const id = validarToken(h.startsWith('Bearer ') ? h.slice(7) : '');
  if (!id) return res.status(401).json({ erro: 'não autenticado' });
  req.usuarioId = id;
  next();
}

// ═══ INICIALIZAÇÃO DO BANCO (idempotente) ═══

export async function inicializarBanco(pool: Pool, schema: string): Promise<void> {
  _pool = pool;
  _schema = schema;

  // tabela oportunidade — compartilhada (sem dono)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS oportunidade (
      id            SERIAL PRIMARY KEY,
      titulo        TEXT NOT NULL,
      descricao     TEXT NOT NULL,
      tipo          TEXT NOT NULL CHECK (tipo IN ('Emprego','Curso','Benefício social','Microcrédito')),
      fonte         TEXT NOT NULL,
      link_inscricao TEXT DEFAULT '',
      bairro        TEXT DEFAULT '',
      endereco      TEXT DEFAULT '',
      latitude      DOUBLE PRECISION,
      longitude     DOUBLE PRECISION,
      horario       TEXT DEFAULT '',
      data_inicio_inscricao DATE,
      data_fim_inscricao    DATE
    )`);

  // tabela candidatura — PRIVADA DO DONO
  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidatura (
      id               SERIAL PRIMARY KEY,
      usuario_id       UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      oportunidade_id  INTEGER NOT NULL REFERENCES oportunidade(id) ON DELETE CASCADE,
      data_candidatura TIMESTAMPTZ NOT NULL DEFAULT now(),
      mensagem         TEXT DEFAULT '',
      status           TEXT NOT NULL DEFAULT 'Enviada' CHECK (status IN ('Enviada','Em análise','Aprovada','Não selecionada')),
      UNIQUE(usuario_id, oportunidade_id)
    )`);

  // tabela mensagem_mural — compartilhada (sem dono)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mensagem_mural (
      id              SERIAL PRIMARY KEY,
      bairro          TEXT NOT NULL,
      autor_nome      TEXT NOT NULL,
      texto           TEXT NOT NULL,
      data_publicacao TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  // tabela perfil — PRIVADA DO DONO
  await pool.query(`
    CREATE TABLE IF NOT EXISTS perfil (
      usuario_id      UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      telefone        TEXT DEFAULT '',
      cpf             TEXT DEFAULT '',
      data_nascimento TEXT DEFAULT '',
      bairro          TEXT DEFAULT '',
      filhos          INTEGER DEFAULT 0,
      idades_filhos   TEXT DEFAULT '',
      turno_disponivel TEXT DEFAULT '',
      interesses      TEXT DEFAULT ''
    )`);

  // Adiciona novas colunas caso não existam
  await pool.query(`
    ALTER TABLE perfil
    ADD COLUMN IF NOT EXISTS sobre_mim TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS experiencias TEXT DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS cursos TEXT DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS habilidades TEXT DEFAULT '[]'
  `);
}

// ═══ REGISTRO DAS ROTAS ═══

export function registrarRotas(app: Express, pool: Pool): void {

  // ── OPORTUNIDADES (compartilhadas, sem dono) ──

  // GET /api/oportunidades?tipo=&bairro=&horario=
  app.get('/api/oportunidades', async (_req: Request, res: Response) => {
    if (!pool) return res.status(503).json({ erro: 'banco indisponivel' });
    try {
      const tipo = String(_req.query.tipo || '').trim();
      const bairro = String(_req.query.bairro || '').trim();
      const horario = String(_req.query.horario || '').trim();

      let sql = 'SELECT * FROM oportunidade WHERE 1=1';
      const params: (string | number)[] = [];
      let idx = 1;

      if (tipo) { sql += ` AND tipo = $${idx++}`; params.push(tipo); }
      if (bairro) { sql += ` AND LOWER(bairro) LIKE LOWER($${idx++})`; params.push(`%${bairro}%`); }
      if (horario) { sql += ` AND LOWER(horario) LIKE LOWER($${idx++})`; params.push(`%${horario}%`); }

      sql += ' ORDER BY id DESC';

      const { rows } = await pool.query(sql, params);
      res.json(rows);
    } catch (e) {
      console.error('oportunidades', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  let cacheOportunidades = {
    dados: null as any,
    ultimaAtualizacao: 0
  };
  const TEMPO_CACHE = 60 * 60 * 1000; // 1 hora em milissegundos

  function filtrarOportunidadesExternas(
    dados: any[],
    filtros: { tipo?: string; bairro?: string; horario?: string },
  ): any[] {
    let filtradas = Array.isArray(dados) ? [...dados] : [];

    if (filtros.tipo) {
      filtradas = filtradas.filter((o) => o.tipo === filtros.tipo);
    }

    if (filtros.bairro) {
      const b = filtros.bairro.toLowerCase();
      filtradas = filtradas.filter(
        (o) =>
          String(o.bairro || '').toLowerCase().includes(b) ||
          String(o.endereco || '').toLowerCase().includes(b),
      );
    }

    if (filtros.horario) {
      const h = filtros.horario.toLowerCase();
      filtradas = filtradas.filter((o) => String(o.horario || '').toLowerCase().includes(h));
    }

    return filtradas;
  }

  // GET /api/oportunidades/externas — dados de APIs públicas (Arbeitnow, Remotive, EV.G, DATASUS, etc.)
  // ⚠️ REGISTRADA ANTES de /:id para que "externas" não seja capturado como :id.
  app.get('/api/oportunidades/externas', async (req: Request, res: Response) => {
    try {
      const tipo = String(req.query.tipo || '').trim();
      const bairro = String(req.query.bairro || '').trim();
      const horario = String(req.query.horario || '').trim();
      const filtros = {
        tipo: tipo || undefined,
        bairro: bairro || undefined,
        horario: horario || undefined,
      };

      let dadosBase = cacheOportunidades.dados;
      const cacheValido = dadosBase && (Date.now() - cacheOportunidades.ultimaAtualizacao < TEMPO_CACHE);

      if (!cacheValido) {
        dadosBase = await unificarOportunidadesExternas();
        cacheOportunidades.dados = dadosBase;
        cacheOportunidades.ultimaAtualizacao = Date.now();
      }

      res.json(filtrarOportunidadesExternas(dadosBase || [], filtros));
    } catch (e) {
      console.error('oportunidades externas', e);
      res.status(500).json({ erro: 'erro ao buscar oportunidades externas' });
    }
  });

  // GET /api/oportunidades/:id
  app.get('/api/oportunidades/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ erro: 'id inválido' });
    }
    try {
      const { rows } = await pool.query('SELECT * FROM oportunidade WHERE id=$1', [id]);
      if (!rows[0]) return res.status(404).json({ erro: 'oportunidade não encontrada' });
      res.json(rows[0]);
    } catch (e) {
      console.error('oportunidade', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // ── CANDIDATURAS (privadas do dono) ──

  // GET /api/candidaturas (só as da usuária logada)
  app.get('/api/candidaturas', autenticar, async (req: ReqAuth, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.*, o.titulo as oportunidade_titulo, o.tipo as oportunidade_tipo
         FROM candidatura c JOIN oportunidade o ON c.oportunidade_id = o.id
         WHERE c.usuario_id = $1 ORDER BY c.data_candidatura DESC`,
        [req.usuarioId],
      );
      res.json(rows);
    } catch (e) {
      console.error('candidaturas', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // POST /api/candidaturas { oportunidade_id, mensagem }
  app.post('/api/candidaturas', autenticar, async (req: ReqAuth, res: Response) => {
    try {
      const oportunidade_id = Number(req.body?.oportunidade_id);
      const mensagem = String(req.body?.mensagem || '').trim();

      if (!oportunidade_id || Number.isNaN(oportunidade_id)) {
        return res.status(400).json({ erro: 'informe a oportunidade' });
      }

      // R04: verifica se já se candidatou a esta oportunidade
      const existente = await pool.query(
        'SELECT 1 FROM candidatura WHERE usuario_id=$1 AND oportunidade_id=$2',
        [req.usuarioId, oportunidade_id],
      );
      if (existente.rowCount && existente.rowCount > 0) {
        return res.status(409).json({ erro: 'você já se candidatou a esta oportunidade' });
      }

      // Verifica se a oportunidade existe
      const op = await pool.query('SELECT 1 FROM oportunidade WHERE id=$1', [oportunidade_id]);
      if (!op.rowCount || op.rowCount === 0) {
        return res.status(404).json({ erro: 'oportunidade não encontrada' });
      }

      const { rows } = await pool.query(
        `INSERT INTO candidatura (usuario_id, oportunidade_id, mensagem)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.usuarioId, oportunidade_id, mensagem],
      );
      res.status(201).json(rows[0]);
    } catch (e: any) {
      if (e?.code === '23505') {
        return res.status(409).json({ erro: 'você já se candidatou a esta oportunidade' });
      }
      console.error('candidatar', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // ── MURAL (compartilhado, sem dono) ──

  // GET /api/mural?bairro=
  app.get('/api/mural', async (req: Request, res: Response) => {
    try {
      const bairro = String(req.query.bairro || '').trim();
      if (!bairro) {
        return res.status(400).json({ erro: 'informe o bairro' });
      }
      // R05: filtra por bairro (case-insensitive)
      const { rows } = await pool.query(
        `SELECT * FROM mensagem_mural WHERE LOWER(bairro) = LOWER($1) ORDER BY data_publicacao DESC`,
        [bairro],
      );
      res.json(rows);
    } catch (e) {
      console.error('mural', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // POST /api/mural { texto, bairro }
  app.post('/api/mural', autenticar, async (req: ReqAuth, res: Response) => {
    try {
      const texto = String(req.body?.texto || '').trim();
      const bairro = String(req.body?.bairro || '').trim();

      if (!texto) return res.status(400).json({ erro: 'escreva uma mensagem' });
      if (!bairro) return res.status(400).json({ erro: 'informe o bairro' });

      // Pega o nome da usuária
      const u = await pool.query('SELECT nome FROM usuarios WHERE id=$1', [req.usuarioId]);
      const autor_nome = u.rows[0]?.nome || 'Anônima';

      const { rows } = await pool.query(
        `INSERT INTO mensagem_mural (bairro, autor_nome, texto)
         VALUES ($1, $2, $3) RETURNING *`,
        [bairro, autor_nome, texto],
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      console.error('mural post', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // ── PERFIL (privado do dono) ──

  // GET /api/perfil
  app.get('/api/perfil', autenticar, async (req: ReqAuth, res: Response) => {
    try {
      const { rows } = await pool.query('SELECT * FROM perfil WHERE usuario_id=$1', [req.usuarioId]);
      // Pega nome e email dos usuarios
      const u = await pool.query('SELECT nome, email_cifrado FROM usuarios WHERE id=$1', [req.usuarioId]);
      const nome = u.rows[0]?.nome || '';
      const email = u.rows[0]?.email_cifrado ? decifrarEmail(u.rows[0].email_cifrado) : '';

      // Se não existe perfil ainda, retorna um perfil vazio com nome/email do usuario
      if (!rows[0]) {
        return res.json({
          usuario_id: req.usuarioId,
          nome,
          email,
          telefone: '',
          cpf: '',
          data_nascimento: '',
          bairro: '',
          filhos: 0,
          idades_filhos: '',
          turno_disponivel: '',
          interesses: '',
          sobre_mim: '',
          experiencias: '[]',
          cursos: '[]',
          habilidades: '[]',
        });
      }
      // Merge: dados do perfil + nome/email do usuario
      res.json({ ...rows[0], nome, email });
    } catch (e) {
      console.error('perfil', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });

  // PUT /api/perfil
  app.put('/api/perfil', autenticar, async (req: ReqAuth, res: Response) => {
    try {
      const { nome, email, telefone, cpf, data_nascimento, bairro, filhos, idades_filhos, turno_disponivel, interesses, sobre_mim, experiencias, cursos, habilidades } = req.body || {};

      // Atualiza nome na tabela usuarios (se informado)
      if (nome && typeof nome === 'string' && nome.trim()) {
        await pool.query('UPDATE usuarios SET nome=$1 WHERE id=$2', [nome.trim(), req.usuarioId]);
      }

      // R06: UPSERT no perfil da usuária logada
      await pool.query(
        `INSERT INTO perfil (usuario_id, telefone, cpf, data_nascimento, bairro, filhos, idades_filhos, turno_disponivel, interesses, sobre_mim, experiencias, cursos, habilidades)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (usuario_id) DO UPDATE SET
           telefone=EXCLUDED.telefone, cpf=EXCLUDED.cpf, data_nascimento=EXCLUDED.data_nascimento,
           bairro=EXCLUDED.bairro, filhos=EXCLUDED.filhos, idades_filhos=EXCLUDED.idades_filhos,
           turno_disponivel=EXCLUDED.turno_disponivel, interesses=EXCLUDED.interesses,
           sobre_mim=EXCLUDED.sobre_mim, experiencias=EXCLUDED.experiencias, cursos=EXCLUDED.cursos,
           habilidades=EXCLUDED.habilidades`,
        [
          req.usuarioId,
          String(telefone || ''),
          String(cpf || ''),
          String(data_nascimento || ''),
          String(bairro || ''),
          Number(filhos || 0),
          String(idades_filhos || ''),
          String(turno_disponivel || ''),
          String(interesses || ''),
          String(sobre_mim || ''),
          String(experiencias || '[]'),
          String(cursos || '[]'),
          String(habilidades || '[]')
        ],
      );
      res.json({ ok: true });
    } catch (e) {
      console.error('perfil put', e);
      res.status(500).json({ erro: 'erro interno' });
    }
  });
}
