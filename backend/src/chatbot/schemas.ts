import type { ChatbotRequest, DadosPlanoCarreira, HistoricoMensagem } from './types';

const MAX_MENSAGEM = 1_000;
const MAX_HISTORICO = 8;
const CAMPOS_PLANO = new Set([
  'objetivo', 'disponibilidade', 'modalidade', 'interesses', 'experiencias', 'filhos',
  'dependentes', 'apoio', 'escolaridade', 'tempoEstudo', 'hobbies', 'desafio', 'sonho',
]);

function texto(valor: unknown, maximo: number): string | null {
  if (typeof valor !== 'string') return null;
  const resultado = valor.trim();
  return resultado ? resultado.slice(0, maximo) : null;
}

function historico(valor: unknown): HistoricoMensagem[] {
  if (valor === undefined) return [];
  if (!Array.isArray(valor) || valor.length > MAX_HISTORICO) {
    throw new Error('historico invalido');
  }
  return valor.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('historico invalido');
    const registro = item as Record<string, unknown>;
    const role = registro.role === 'user' || registro.role === 'assistant' ? registro.role : null;
    const content = texto(registro.content, MAX_MENSAGEM);
    if (!role || !content) throw new Error('historico invalido');
    return { role, content };
  });
}

export function validarChatbotRequest(body: unknown): ChatbotRequest {
  if (!body || typeof body !== 'object') throw new Error('corpo invalido');
  const registro = body as Record<string, unknown>;
  const mensagem = texto(registro.mensagem, MAX_MENSAGEM);
  if (!mensagem) throw new Error('informe uma mensagem');
  return { mensagem, historico: historico(registro.historico) };
}

function lista(valor: unknown): string[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  return valor
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 12);
}

export function validarDadosPlano(body: unknown): DadosPlanoCarreira {
  if (!body || typeof body !== 'object') throw new Error('respostas invalidas');
  const registro = body as Record<string, unknown>;
  const dados: DadosPlanoCarreira = {};
  for (const [chave, valor] of Object.entries(registro)) {
    if (!CAMPOS_PLANO.has(chave)) continue;
    if (Array.isArray(valor)) {
      dados[chave as 'interesses'] = lista(valor);
    } else if (typeof valor === 'string') {
      (dados as Record<string, unknown>)[chave] = valor.trim().slice(0, 240);
    }
  }
  return dados;
}

export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
}
