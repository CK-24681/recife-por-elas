// Harness de teste E2E embutido — abre a APP PUBLICADA num Chrome headless de
// verdade (playwright-core + Chrome do sistema; nenhum download de browser).
// CommonJS, roda com `npm run test:e2e` (node --test tests-e2e/*.e2e.js).
// Os arquivos usam o sufixo .e2e.js DE PROPÓSITO: o `npm test` de unidade
// (descoberta automática do node --test) NÃO os enxerga — E2E só roda no gate
// próprio, depois do deploy.
//
// USO num teste (tests-e2e/minha-historia.e2e.js):
//   const test = require('node:test');
//   const assert = require('node:assert/strict');
//   const { abrirApp } = require('./navegador');
//   test('pergunta com áudio aparece na lista', async () => {
//     const { page, fechar, errosGraves } = await abrirApp('/');
//     try {
//       await page.click('text=Ver produto');           // navegue como o usuário
//       await page.fill('#pergunta', 'Ainda disponível?');
//       await page.click('button:has-text("Enviar")');
//       await page.waitForSelector('text=Ainda disponível?');
//       assert.deepEqual(errosGraves(), []);             // console limpo = obrigatório
//     } finally { await fechar(); }
//   });
//
// MÍDIA: o Chrome de teste sobe com microfone/câmera FALSOS e permissão
// concedida (--use-fake-device-for-media-stream) — fluxos de GRAVAÇÃO de
// áudio/vídeo funcionam de verdade no teste (o mic falso emite um tom).
const { chromium } = require('playwright-core');
const path = require('node:path');
const fs = require('node:fs');

const CANDIDATOS_CHROME = [
  process.env.CHROME_BIN || '',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function chromePath() {
  for (const c of CANDIDATOS_CHROME) {
    try {
      fs.accessSync(c);
      return c;
    } catch {
      /* tenta o próximo */
    }
  }
  throw new Error('Chrome não encontrado para o teste E2E');
}

// URL pública da app: APP_URL (se injetada) ou derivada da pasta /aplicacoes/<slug>.
function urlDaApp() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const slug = path.basename(path.resolve(__dirname, '..', '..'));
  return `https://${slug}.alfaia.app.br`;
}

// Abre a app num Chrome novo e coleta erros de página/console.
// Devolve { page, context, browser, url, erros, errosGraves(), fechar() }.
async function abrirApp(caminho = '/') {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });
  // O navegador de teste se IDENTIFICA. Sem isto, as contas e os cliques da
  // suíte entram no registro de uso da app como se fossem gente de verdade: numa
  // app real o painel "Está dando certo?" mostrou 57 pessoas e 24 produtos, e 21
  // daqueles produtos eram do teste. O dono olhou um número que era 87% ruído
  // produzido pela própria plataforma.
  //
  // A marca vai no user-agent porque ele acompanha TODA requisição feita por
  // este navegador — inclusive as que o JavaScript da página dispara sozinho
  // (o pageview), que um header customizado não alcançaria.
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AlfaiaE2E/1',
  });
  try {
    await context.grantPermissions(['microphone', 'camera']);
  } catch {
    /* permissões falsas já cobrem na maioria dos casos */
  }
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push('console: ' + m.text());
  });
  const url = urlDaApp();
  await page.goto(url + caminho, { waitUntil: 'networkidle', timeout: 30000 });

  // errosGraves: exceções JS sempre contam; erros de console contam MENOS o
  // ruído benigno (favicon ausente, 401/403 esperados de tela deslogada).
  const errosGraves = () =>
    erros.filter((e) => {
      if (e.startsWith('pageerror:')) return true;
      if (/favicon/i.test(e)) return false;
      if (/status of (401|403)/i.test(e)) return false;
      return true;
    });

  return {
    browser,
    context,
    page,
    url,
    erros,
    errosGraves,
    fechar: () => browser.close(),
  };
}

// nomeUnico — valor de teste ÚNICO com prefixo "E2E ..." (não colide entre
// execuções nem suja dados reais). Ex.: nomeUnico('E2E Tarefa').
function nomeUnico(prefixo = 'E2E') {
  return `${prefixo} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// cadastrarELogar — cria uma conta NOVA e já deixa a página LOGADA, usando o
// login seguro padrão (/api/auth/cadastro) e injetando o token. Use no setup de
// QUALQUER teste de fluxo logado — não reimplemente (nem erre) o cadastro em
// cada teste. Devolve { nome, email, senha, token }.
async function cadastrarELogar(page, url) {
  const base = (url || urlDaApp()).replace(/\/$/, '');
  const suf = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const nome = `E2E ${suf}`;
  const email = `e2e-${suf}@teste.com`;
  const senha = 'Senha123!';
  const resp = await page.request.post(`${base}/api/auth/cadastro`, { data: { nome, email, senha } });
  if (!resp.ok()) throw new Error(`cadastrarELogar: /api/auth/cadastro respondeu ${resp.status()}`);
  const { token } = await resp.json();
  if (!token) throw new Error('cadastrarELogar: cadastro não devolveu token');
  // injeta o token (mesma chave do api.ts) ANTES de carregar → a app abre logada.
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('app_token', t);
    } catch {
      /* localStorage indisponível */
    }
  }, token);
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  return { nome, email, senha, token };
}

// esperarRota — espera a SPA CHEGAR numa rota antes de você tocar na tela.
//
// Use SEMPRE depois de uma ação que navega (salvar, excluir, entrar). O motivo é
// uma armadilha que já reprovou uma fase inteira: ao salvar, a app mostra um
// TOAST de sucesso com o nome que você acabou de digitar — e o toast vive na
// tela ANTIGA. Um `waitForSelector('text=' + nome)` casa com o TOAST, seu clique
// cai nele, a navegação acontece por baixo, e o teste falha num seletor da tela
// nova que "deveria estar lá". O erro parece bug da app; é corrida do teste.
//
//   await page.click('button:has-text("Salvar")');
//   await esperarRota(page, '/');            // <- a lista, de verdade
//   await page.locator('.item-card').first().click();
//
// rota pode ser string exata ('/') ou função (p => p.startsWith('/pets/')).
async function esperarRota(page, rota, opcoes = {}) {
  const { timeout = 10000 } = opcoes;
  const bate = typeof rota === 'function' ? rota : (p) => p === rota;
  await page.waitForURL((u) => bate(new URL(u).pathname), { timeout });
}

module.exports = { abrirApp, urlDaApp, nomeUnico, cadastrarELogar, esperarRota };
