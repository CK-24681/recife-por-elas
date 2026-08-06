import type { ChatbotMensagem } from './types';

export function ehLinkInterno(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

export function historicoSeguro(mensagens: ChatbotMensagem[]) {
  return mensagens.slice(-8).map((item) => ({ role: item.role, content: item.content.slice(0, 1000) }));
}
