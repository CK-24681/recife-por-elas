// Prova de que o /api/health passou a dizer a verdade.
//
// O defeito que isto trava: uma criação de tabela falhou no boot (FK TEXT
// apontando pra id UUID), o `.catch(console.error)` engoliu, o health respondeu
// 200, a plataforma deu a fase por publicada e a app foi pro ar com a tela
// principal quebrada. O dono descobriu usando.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const saudePath = path.join(__dirname, '..', 'dist', 'saude.js');

function carregarLimpo() {
  delete require.cache[require.resolve(saudePath)];
  return require(saudePath);
}

test('inicialização que dá certo → health 200', async () => {
  const s = carregarLimpo();
  await s.registrarInicializacao('auth', Promise.resolve());
  const { status, corpo } = s.estadoDeSaude();
  assert.equal(status, 200);
  assert.equal(corpo.status, 'ok');
});

test('inicialização que FALHA → health 503 dizendo qual', async () => {
  const s = carregarLimpo();
  await s.registrarInicializacao('produtos', Promise.reject(new Error('relation "usuarios" does not exist')));
  const { status, corpo } = s.estadoDeSaude();
  assert.equal(status, 503, 'o health mentiu: respondeu 200 com o banco quebrado');
  assert.equal(corpo.falhas.length, 1);
  assert.equal(corpo.falhas[0].nome, 'produtos');
  assert.match(corpo.falhas[0].erro, /usuarios/, 'o motivo real precisa chegar a quem lê');
});

test('uma falha entre várias já derruba o health', async () => {
  const s = carregarLimpo();
  await Promise.all([
    s.registrarInicializacao('auth', Promise.resolve()),
    s.registrarInicializacao('registros', Promise.resolve()),
    s.registrarInicializacao('pedidos', Promise.reject(new Error('coluna criado_em não existe'))),
  ]);
  const { status, corpo } = s.estadoDeSaude();
  assert.equal(status, 503);
  assert.equal(corpo.falhas.length, 1);
  assert.equal(corpo.falhas[0].nome, 'pedidos');
});

test('enquanto ainda inicializa, o health não diz "ok"', async () => {
  const s = carregarLimpo();
  let liberar;
  const p = s.registrarInicializacao('lenta', new Promise((r) => { liberar = r; }));
  assert.equal(s.estadoDeSaude().status, 503, 'disse ok antes de terminar de subir');
  assert.equal(s.estadoDeSaude().corpo.status, 'iniciando');
  liberar();
  await p;
  assert.equal(s.estadoDeSaude().status, 200);
});

// registrarInicializacao NÃO pode rejeitar: se rejeitasse, um await solto no
// server.ts derrubaria o processo e o motivo sumiria num crash loop.
test('a falha não vira exceção não tratada', async () => {
  const s = carregarLimpo();
  await assert.doesNotReject(() => s.registrarInicializacao('x', Promise.reject(new Error('boom'))));
});
