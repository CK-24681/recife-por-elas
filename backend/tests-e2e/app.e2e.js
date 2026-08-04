// Teste E2E de base — TODA app tem: a página inicial publicada carrega, tem
// conteúdo visível e o console está limpo (sem exceção JS). É o chão do E2E;
// os testes das SUAS histórias (fluxos/CRUD) entram em arquivos irmãos
// (<historia>.e2e.js — o sufixo importa: o npm test de unidade ignora .e2e.js)
// usando o mesmo helper ./navegador.
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrirApp } = require('./navegador');

test('página inicial carrega sem erros de console', async () => {
  const { page, errosGraves, fechar } = await abrirApp('/');
  try {
    // a SPA renderizou algo de verdade (não tela branca)
    const texto = (await page.textContent('body')) || '';
    assert.ok(texto.trim().length > 20, 'página inicial parece vazia');
    assert.deepEqual(errosGraves(), [], 'erros no console da página inicial');
  } finally {
    await fechar();
  }
});
