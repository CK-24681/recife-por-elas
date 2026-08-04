// Exemplo de teste com o runner NATIVO do Node (node:test) — sem libs extras.
// CommonJS (use require) porque o backend é CommonJS. Rode com: npm test
// Troque/expanda pelos testes da SUA história. Este arquivo já passa e serve de
// MODELO do padrão seguro de senha (scrypt + salt + comparação em tempo constante).
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verificarSenha(senha, guardado) {
  const [salt, hash] = guardado.split(':');
  const calc = crypto.scryptSync(senha, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calc, 'hex'));
}

test('senha nunca é guardada em texto puro e verifica corretamente', () => {
  const guardado = hashSenha('segredo123');
  assert.notEqual(guardado, 'segredo123');
  assert.ok(verificarSenha('segredo123', guardado));
  assert.ok(!verificarSenha('senha-errada', guardado));
});
