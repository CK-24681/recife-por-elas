import type { OportunidadeExterna } from '../integracoes';

export type Intent =
  | 'saudacao'
  | 'como_funciona'
  | 'oportunidades'
  | 'cursos'
  | 'beneficios'
  | 'mapa'
  | 'rede_apoio'
  | 'minhas_candidaturas'
  | 'status_candidatura'
  | 'meu_perfil'
  | 'recomendacoes'
  | 'plano_carreira'
  | 'fora_escopo';

export interface HistoricoMensagem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotRequest {
  mensagem: string;
  historico: HistoricoMensagem[];
}

export interface ChatbotFonte {
  titulo: string;
  url: string;
  tipo: 'pagina' | 'oportunidade' | 'conhecimento';
}

export interface ChatbotSugestao {
  texto: string;
  mensagem: string;
}

export interface ChatbotResponse {
  resposta: string;
  tipo: 'resposta' | 'login' | 'fora_escopo' | 'indisponivel';
  fontes: ChatbotFonte[];
  sugestoes: ChatbotSugestao[];
  requerLogin: boolean;
}

export interface OportunidadePublica {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  fonte: string;
  link_inscricao: string;
  bairro: string;
  horario: string;
  origem: 'interna' | 'externa';
  oportunidadeId?: number;
}

export interface ContextoPerfilSeguro {
  nome?: string;
  bairro?: string;
  filhos?: number;
  turno_disponivel?: string;
  interesses?: string[];
  experiencias?: string[];
  cursos?: string[];
  habilidades?: string[];
  sobre_mim?: string;
}

export interface ContextoChatbot {
  perfil?: ContextoPerfilSeguro;
  candidaturas?: Array<{
    id: number;
    oportunidade_id: number;
    oportunidade_titulo: string;
    oportunidade_tipo: string;
    data_candidatura: string;
    status: string;
  }>;
  oportunidades: OportunidadePublica[];
}

export interface DadosPlanoCarreira {
  objetivo?: string;
  disponibilidade?: string;
  modalidade?: string;
  interesses?: string[];
  experiencias?: string[];
  filhos?: string;
  dependentes?: string;
  apoio?: string;
  escolaridade?: string;
  tempoEstudo?: string;
  hobbies?: string[];
  desafio?: string;
  sonho?: string;
}

export interface RecomendacaoPlano {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  fonte: string;
  link: string;
  bairro: string;
  motivo: string;
}

export interface PlanoCarreiraResposta {
  modoGeracao: 'ia' | 'local';
  titulo: string;
  resumo: string;
  primeiroPasso: string;
  justificativa: string;
  habilidades: string[];
  trilha: Array<{ titulo: string; descricao: string }>;
  cursos: RecomendacaoPlano[];
  beneficios: RecomendacaoPlano[];
}

export type OportunidadeExternaSegura = Omit<OportunidadeExterna, 'latitude' | 'longitude'> & {
  latitude?: number | null;
  longitude?: number | null;
};
