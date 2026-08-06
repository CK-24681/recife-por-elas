import type { Intent } from './types';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const PADRAO_INJECAO = /(ignore|ignora|desconsidere).{0,40}(instruc|prompt|regra)|mostre.{0,30}(senha|token|cpf|sql)|qualquer usuario|outro usuario|system prompt|prompt do sistema/i;

export function classificarIntencao(mensagem: string): { intent: Intent; insegura: boolean } {
  const texto = normalizar(mensagem);
  if (PADRAO_INJECAO.test(mensagem)) return { intent: 'fora_escopo', insegura: true };
  if (/^(oi|ola|bom dia|boa tarde|boa noite|tudo bem)\b/.test(texto)) return { intent: 'saudacao', insegura: false };
  if (/minha[s]? candidatura|me candidatei|onde me candidatei/.test(texto)) return { intent: 'minhas_candidaturas', insegura: false };
  if (/status.*candidatura|andamento.*candidatura|fui aprovada|resultado.*vaga/.test(texto)) return { intent: 'status_candidatura', insegura: false };
  if (/meu perfil|meus dados|alterar perfil/.test(texto)) return { intent: 'meu_perfil', insegura: false };
  if (/recomenda|o que combina comigo|qual vaga.*para mim|melhor oportunidade/.test(texto)) return { intent: 'recomendacoes', insegura: false };
  if (/plano de carreira|plano.*carreira|profissao|empreender|renda extra/.test(texto)) return { intent: 'plano_carreira', insegura: false };
  if (/como funciona|o que voces fazem|o que a plataforma faz|como usar/.test(texto)) return { intent: 'como_funciona', insegura: false };
  if (/curso|capacita|qualifica|estudar|formacao/.test(texto)) return { intent: 'cursos', insegura: false };
  if (/beneficio|bolsa familia|auxilio|cras|cadunico|microcredito/.test(texto)) return { intent: 'beneficios', insegura: false };
  if (/mapa|localiza|endereco|onde fica|perto/.test(texto)) return { intent: 'mapa', insegura: false };
  if (/rede de apoio|mural|outras maes|pedido de ajuda|postagem/.test(texto)) return { intent: 'rede_apoio', insegura: false };
  if (/vaga|emprego|trabalho|oportunidade|contrata/.test(texto)) return { intent: 'oportunidades', insegura: false };
  return { intent: 'fora_escopo', insegura: false };
}

export function requerAutenticacao(intent: Intent): boolean {
  return intent === 'minhas_candidaturas' || intent === 'status_candidatura' || intent === 'meu_perfil' || intent === 'recomendacoes' || intent === 'plano_carreira';
}
