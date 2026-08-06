import { describe, expect, it } from 'vitest';
import { ehLinkInterno, historicoSeguro } from './utils';

describe('chatbot utils', () => {
  it('aceita apenas links internos absolutos', () => {
    expect(ehLinkInterno('/mapa')).toBe(true);
    expect(ehLinkInterno('//site-externo.test')).toBe(false);
    expect(ehLinkInterno('https://site.test')).toBe(false);
  });

  it('limita histórico e tamanho de conteúdo', () => {
    const mensagens = Array.from({ length: 10 }, (_, indice) => ({ id: String(indice), role: 'user' as const, content: 'x'.repeat(1200) }));
    const resultado = historicoSeguro(mensagens);
    expect(resultado).toHaveLength(8);
    expect(resultado[0].content).toHaveLength(1000);
  });
});
