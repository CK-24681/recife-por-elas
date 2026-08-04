// Testes E2E — Recife Por Elas
// Fluxos principais: cadastro, candidatura, mapa, mural.
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirApp, cadastrarELogar, nomeUnico, esperarRota } = require('./navegador');

// ═══ FLUXO 1: Criar conta e completar onboarding ═══
test('criar conta e completar onboarding', async () => {
  const { page, errosGraves, fechar, url } = await abrirApp('/cadastro');
  try {
    // Aguarda a SPA assentar na rota correta antes de interagir
    await esperarRota(page, '/cadastro');
    // Aguarda o card de cadastro aparecer (evita corrida com a renderização)
    await page.waitForSelector('.cd-onboard-card', { timeout: 15000 });
    // Passo 1: Preencher dados de acesso (nome, e-mail, senha)
    await page.waitForSelector('text=Crie sua conta gratuita');
    const nome = nomeUnico('E2E Maria');
    const email = nome.toLowerCase().replace(/\s/g, '-') + '@teste.com';
    await page.fill('input[placeholder*="Maria"]', nome);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Senha123!');
    await page.click('button:has-text("Criar conta")');

    // Passo 2: Dados pessoais
    await page.waitForSelector('text=Seus dados pessoais');
    await page.fill('input[placeholder="000.000.000-00"]', '12345678901');
    await page.fill('input[placeholder="(81) 99999-9999"]', '81999999999');
    await page.fill('input[placeholder="DD/MM/AAAA"]', '15031992');
    await page.fill('input[placeholder*="Ibura"]', 'Ibura');
    await page.click('button:has-text("Continuar")');

    // Passo 3: Contexto familiar
    await page.waitForSelector('text=Seu contexto familiar');
    // Seleciona número de filhos
    await page.selectOption('select', '1');
    await page.fill('input[placeholder*="6 e 9"]', '6 anos');
    // Seleciona turno
    const selects = await page.$$('select');
    if (selects.length >= 2) await selects[1].selectOption('manha');
    await page.click('button:has-text("Concluir cadastro")');

    // Passo 4: Concluído
    await page.waitForSelector('text=Tudo pronto');
    await page.click('text=Explorar oportunidades');

    // Deve ir para o feed (raiz)
    await esperarRota(page, '/');
    const titulo = await page.textContent('body');
    assert.ok(titulo.includes('Oportunidades'), 'deveria estar no feed');

    assert.deepEqual(errosGraves(), [], 'erros no console');
  } finally {
    await fechar();
  }
});

// ═══ FLUXO 2: Encontrar e se candidatar a uma oportunidade ═══
test('encontrar e se candidatar a uma oportunidade', async () => {
  const { page, errosGraves, fechar } = await abrirApp('/');
  const { nome } = await cadastrarELogar(page);
  try {
    // Aguarda a sessão assentar e a rota confirmar
    await esperarRota(page, '/');
    await page.waitForSelector('.hn-topo-app', { timeout: 15000 });
    // Feed deve estar visível
    await page.waitForSelector('text=Oportunidades');

    // Clica no primeiro card de oportunidade
    const card = await page.locator('.fd-card').first();
    const tituloOportunidade = await card.locator('h3').textContent();
    await card.click();

    // Deve abrir detalhe da oportunidade
    await esperarRota(page, (p) => p.startsWith('/oportunidades/'));
    await page.waitForSelector(`text=${tituloOportunidade}`);

    // Clica em "Quero me candidatar"
    await page.click('button:has-text("Quero me candidatar")');

    // Preenche mensagem e envia
    await page.waitForSelector('textarea');
    await page.fill('textarea', 'Tenho muito interesse nesta oportunidade. Meu nome é ' + nome + '.');
    await page.click('button:has-text("Candidatar-se")');

    // Deve mostrar sucesso
    await page.waitForSelector('text=Candidatura enviada');
    await page.click('text=Acompanhar status');

    // Deve ir para a página de candidaturas
    await esperarRota(page, '/candidaturas');
    await page.waitForSelector(`text=${tituloOportunidade}`);

    assert.deepEqual(errosGraves(), [], 'erros no console');
  } finally {
    await fechar();
  }
});

// ═══ FLUXO 3: Explorar oportunidades no mapa ═══
test('explorar oportunidades no mapa', async () => {
  const { page, errosGraves, fechar } = await abrirApp('/');
  await cadastrarELogar(page);
  try {
    // Aguarda a sessão assentar
    await esperarRota(page, '/');
    await page.waitForSelector('.hn-topo-app', { timeout: 15000 });
    // Navega para o mapa
    await page.click('text=Mapa');

    // Espera o mapa carregar
    await esperarRota(page, '/mapa');
    await page.waitForSelector('text=Mapa de oportunidades');

    // Deve ter pins no mapa
    const pins = await page.locator('.mp-pin');
    const count = await pins.count();
    assert.ok(count > 0, 'deveria ter pins no mapa');

    // Filtra por tipo
    await page.click('button:has-text("Empregos")');
    // Espera um pouco pela filtragem
    await page.waitForTimeout(300);

    // Clica em um pin
    const pin = await page.locator('.mp-pin').first();
    await pin.hover();
    await page.waitForSelector('.mp-pin-label');
    await pin.click();

    // Deve navegar pro detalhe da oportunidade
    await esperarRota(page, (p) => p.startsWith('/oportunidades/'));

    assert.deepEqual(errosGraves(), [], 'erros no console');
  } finally {
    await fechar();
  }
});

// ═══ FLUXO 4: Publicar no mural do bairro ═══
test('publicar no mural do bairro', async () => {
  const { page, errosGraves, fechar } = await abrirApp('/');
  const { nome } = await cadastrarELogar(page);
  try {
    // Aguarda a sessão assentar
    await esperarRota(page, '/');
    await page.waitForSelector('.hn-topo-app', { timeout: 15000 });
    // Navega para o mural
    await page.click('text=Rede');

    // Espera o mural carregar
    await esperarRota(page, '/mural');
    await page.waitForSelector('text=Rede de apoio');

    // Clica em Publicar
    await page.click('button:has-text("Publicar")');

    // Escreve uma mensagem
    const texto = nomeUnico('E2E mensagem de apoio');
    await page.waitForSelector('textarea');
    await page.fill('textarea', texto);
    await page.click('button:has-text("Publicar mensagem")');

    // Deve aparecer no mural
    await page.waitForSelector(`text=${texto}`);

    // O nome do autor deve aparecer junto
    await page.waitForSelector(`text=${nome}`);

    assert.deepEqual(errosGraves(), [], 'erros no console');
  } finally {
    await fechar();
  }
});
