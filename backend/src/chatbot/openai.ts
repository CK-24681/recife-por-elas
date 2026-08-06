import OpenAI from 'openai';
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';
import { carregarConhecimento } from './conhecimento';
import { INSTRUCOES_CHATBOT, contextoIntent, instrucoesPlano } from './prompt';
import type { ContextoChatbot, DadosPlanoCarreira, Intent } from './types';

export class ChatbotIndisponivelError extends Error {}

interface ConfigOpenAI {
  apiKey: string;
  model: string;
  vectorStoreId: string;
  timeout: number;
}

function config(): ConfigOpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ChatbotIndisponivelError('OPENAI_API_KEY ausente');
  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || 'gpt-5.6',
    vectorStoreId: process.env.OPENAI_VECTOR_STORE_ID?.trim() || '',
    timeout: Number(process.env.OPENAI_TIMEOUT_MS || 25_000),
  };
}

function cliente(cfg: ConfigOpenAI): OpenAI {
  return new OpenAI({ apiKey: cfg.apiKey, timeout: cfg.timeout, maxRetries: 1 });
}

function serializarContexto(contexto: ContextoChatbot): string {
  return JSON.stringify(contexto, null, 2).slice(0, 24_000);
}

function parametrosBase(cfg: ConfigOpenAI, instrucoes: string, input: ResponseCreateParamsNonStreaming['input'], formato?: ResponseCreateParamsNonStreaming['text']): ResponseCreateParamsNonStreaming {
  return {
    model: cfg.model,
    instructions: instrucoes,
    input,
    store: false,
    max_output_tokens: 900,
    text: formato,
    tools: cfg.vectorStoreId ? [{ type: 'file_search', vector_store_ids: [cfg.vectorStoreId], max_num_results: 5 }] : undefined,
  };
}

export async function responderComIA(intent: Intent, mensagem: string, historico: Array<{ role: 'user' | 'assistant'; content: string }>, contexto: ContextoChatbot): Promise<string> {
  const cfg = config();
  const conhecimento = await carregarConhecimento(intent);
  const input = [
    ...historico,
    { role: 'user' as const, content: `Pergunta atual da usuaria:\n${mensagem}\n\nContexto dinamico seguro do servidor:\n${serializarContexto(contexto)}\n\nResumo da base local:\n${conhecimento}` },
  ];
  const response = await cliente(cfg).responses.create(parametrosBase(cfg, `${INSTRUCOES_CHATBOT}\n${contextoIntent(intent)}`, input));
  return response.output_text.trim();
}

const PLANO_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'resumo', 'primeiroPasso', 'justificativa', 'habilidades', 'trilha', 'recomendacoes'],
  properties: {
    titulo: { type: 'string' },
    resumo: { type: 'string' },
    primeiroPasso: { type: 'string' },
    justificativa: { type: 'string' },
    habilidades: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    trilha: { type: 'array', maxItems: 4, items: { type: 'object', additionalProperties: false, required: ['titulo', 'descricao'], properties: { titulo: { type: 'string' }, descricao: { type: 'string' } } } },
    recomendacoes: { type: 'array', maxItems: 8, items: { type: 'object', additionalProperties: false, required: ['id', 'grupo', 'motivo'], properties: { id: { type: 'string' }, grupo: { type: 'string', enum: ['curso', 'beneficio'] }, motivo: { type: 'string' } } } },
  },
};

export async function gerarPlanoComIA(respostas: DadosPlanoCarreira, contexto: ContextoChatbot) {
  const cfg = config();
  const input = `Respostas da usuaria (dados de formulario):\n${JSON.stringify(respostas)}\n\nCandidatos reais de oportunidades. Nao crie nenhum id:\n${serializarContexto({ oportunidades: contexto.oportunidades })}`;
  const formato = { format: { type: 'json_schema' as const, name: 'plano_carreira', strict: true, schema: PLANO_SCHEMA } };
  const response = await cliente(cfg).responses.create(parametrosBase(cfg, instrucoesPlano(), [{ role: 'user', content: input }], formato));
  try { return JSON.parse(response.output_text) as unknown; } catch { throw new Error('resposta de plano invalida'); }
}
