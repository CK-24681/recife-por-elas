import { apiJSON } from '../api';
import type { ChatbotRespostaApi, ChatbotMensagem } from './types';
import { historicoSeguro } from './utils';

export async function perguntarChatbot(mensagem: string, historico: ChatbotMensagem[]): Promise<ChatbotRespostaApi> {
  return apiJSON<ChatbotRespostaApi>('/chatbot', {
    method: 'POST',
    corpo: {
      mensagem,
      historico: historicoSeguro(historico),
    },
  });
}
