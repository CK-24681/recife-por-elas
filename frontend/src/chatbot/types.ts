export interface ChatbotFonte {
  titulo: string;
  url: string;
  tipo: 'pagina' | 'oportunidade' | 'conhecimento';
}

export interface ChatbotSugestao {
  texto: string;
  mensagem: string;
}

export interface ChatbotMensagem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fontes?: ChatbotFonte[];
  sugestoes?: ChatbotSugestao[];
  requerLogin?: boolean;
}

export interface ChatbotRespostaApi {
  resposta: string;
  tipo: 'resposta' | 'login' | 'fora_escopo' | 'indisponivel';
  fontes: ChatbotFonte[];
  sugestoes: ChatbotSugestao[];
  requerLogin: boolean;
}
