import type { Pool } from 'pg';
import { classificarIntencao, requerAutenticacao } from './intent';
import { validarChatbotRequest, validarDadosPlano, ehObjeto } from './schemas';
import { contemChaveProibida, sanitizarTexto } from './privacy';
import { montarContexto } from './consultas';
import { gerarPlanoComIA, responderComIA } from './openai';
import type {
  ChatbotFonte, ChatbotResponse, ChatbotSugestao, ContextoChatbot, DadosPlanoCarreira, Intent,
  OportunidadePublica, PlanoCarreiraResposta, RecomendacaoPlano,
} from './types';

function sugestoes(intent: Intent): ChatbotSugestao[] {
  const padrao: Record<Intent, ChatbotSugestao[]> = {
    saudacao: [{ texto: 'Ver oportunidades', mensagem: 'Quais oportunidades estão disponíveis?' }, { texto: 'Abrir mapa', mensagem: 'Como encontro os pontos no mapa?' }],
    como_funciona: [{ texto: 'Montar plano de carreira', mensagem: 'Como funciona o plano de carreira?' }, { texto: 'Ver oportunidades', mensagem: 'Quais oportunidades posso encontrar?' }],
    oportunidades: [{ texto: 'Filtrar cursos', mensagem: 'Quais cursos estão disponíveis?' }, { texto: 'Abrir mapa', mensagem: 'Onde ficam essas oportunidades?' }],
    cursos: [{ texto: 'Ver empregos', mensagem: 'Quais empregos estão disponíveis?' }, { texto: 'Plano de carreira', mensagem: 'Quero montar meu plano de carreira.' }],
    beneficios: [{ texto: 'Ver cursos', mensagem: 'Quais cursos podem me ajudar?' }, { texto: 'Abrir mapa', mensagem: 'Onde encontro atendimento perto de mim?' }],
    mapa: [{ texto: 'Ver oportunidades', mensagem: 'Quais oportunidades posso encontrar?' }, { texto: 'Benefícios', mensagem: 'Quais benefícios estão disponíveis?' }],
    rede_apoio: [{ texto: 'Abrir Rede de Apoio', mensagem: 'Como uso a Rede de Apoio?' }],
    minhas_candidaturas: [{ texto: 'Ver oportunidades', mensagem: 'Quais oportunidades estão disponíveis?' }],
    status_candidatura: [{ texto: 'Minhas candidaturas', mensagem: 'Quais são minhas candidaturas?' }],
    meu_perfil: [{ texto: 'Plano de carreira', mensagem: 'Quero montar meu plano de carreira.' }],
    recomendacoes: [{ texto: 'Plano de carreira', mensagem: 'Quero montar meu plano de carreira.' }],
    plano_carreira: [{ texto: 'Ver cursos', mensagem: 'Quais cursos estão disponíveis?' }, { texto: 'Ver benefícios', mensagem: 'Quais benefícios estão disponíveis?' }],
    fora_escopo: [{ texto: 'Como funciona', mensagem: 'Como funciona a plataforma?' }, { texto: 'Ver oportunidades', mensagem: 'Quais oportunidades estão disponíveis?' }],
  };
  return padrao[intent].slice(0, 3);
}

function fontes(contexto: ContextoChatbot, intent: Intent): ChatbotFonte[] {
  const resultado: ChatbotFonte[] = [{ titulo: 'Base de conhecimento Recife Por Elas', url: '/api/info', tipo: 'conhecimento' }];
  if (intent === 'mapa') resultado.push({ titulo: 'Mapa de oportunidades', url: '/mapa', tipo: 'pagina' as const });
  if (intent === 'rede_apoio') resultado.push({ titulo: 'Rede de Apoio', url: '/mural', tipo: 'pagina' as const });
  if (intent === 'plano_carreira' || intent === 'recomendacoes') resultado.push({ titulo: 'Plano de carreira', url: '/plano-carreira', tipo: 'pagina' as const });
  for (const item of contexto.oportunidades.slice(0, 5)) {
    const url = item.origem === 'interna' && item.oportunidadeId ? `/oportunidades/${item.oportunidadeId}` : item.link_inscricao;
    if (url) resultado.push({ titulo: item.titulo, url, tipo: 'oportunidade' as const });
  }
  return resultado.slice(0, 8);
}

export async function processarChatbot(body: unknown, pool: Pool | null, usuarioId: string | null): Promise<ChatbotResponse> {
  const pedido = validarChatbotRequest(body);
  const { intent, insegura } = classificarIntencao(pedido.mensagem);
  if (requerAutenticacao(intent) && !usuarioId) {
    return {
      resposta: 'Para consultar informações personalizadas, entre na sua conta. Assim consigo usar somente os seus dados autorizados.',
      tipo: 'login', fontes: [], sugestoes: sugestoes(intent), requerLogin: true,
    };
  }
  if (insegura || intent === 'fora_escopo') {
    return {
      resposta: 'Posso ajudar apenas com a plataforma Recife Por Elas: oportunidades, cursos, benefícios, mapa, Rede de Apoio, candidaturas e plano de carreira.',
      tipo: 'fora_escopo', fontes: [{ titulo: 'Como funciona a plataforma', url: '/#como-funciona', tipo: 'pagina' }], sugestoes: sugestoes(intent), requerLogin: false,
    };
  }

  const contexto = await montarContexto(pool, intent, usuarioId);
  if (contemChaveProibida(contexto)) throw new Error('contexto inseguro bloqueado');
  const resposta = await responderComIA(intent, pedido.mensagem, pedido.historico, contexto);
  if (!resposta) throw new Error('resposta vazia da IA');
  return { resposta: sanitizarTexto(resposta, 4_000), tipo: 'resposta', fontes: fontes(contexto, intent), sugestoes: sugestoes(intent), requerLogin: false };
}

function normalizarTipo(tipo: string): string {
  return tipo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function candidatosParaPlano(oportunidades: OportunidadePublica[], grupo: 'curso' | 'beneficio'): OportunidadePublica[] {
  return oportunidades.filter((item) => {
    const tipo = normalizarTipo(item.tipo);
    return grupo === 'curso' ? tipo.includes('curso') : tipo.includes('benef') || tipo.includes('micro') || tipo.includes('apoio');
  });
}

function motivoLocal(item: OportunidadePublica, respostas: DadosPlanoCarreira): string {
  const texto = `${item.titulo} ${item.descricao}`.toLowerCase();
  const interesses = [...(respostas.interesses || []), ...(respostas.experiencias || []), ...(respostas.hobbies || [])];
  const alinhamentos = interesses.filter((interesse) => texto.includes(interesse.toLowerCase())).length;
  if (alinhamentos > 0) return 'Tem relação com os seus interesses e pode ser um próximo passo prático.';
  if (respostas.modalidade === 'perto_casa' && item.bairro) return `Pode ser considerada por estar associada a ${item.bairro}.`;
  if (respostas.objetivo === 'empreender' && normalizarTipo(item.tipo).includes('micro')) return 'Pode apoiar uma primeira iniciativa de empreendedorismo.';
  return 'Foi selecionada entre as oportunidades reais disponíveis na plataforma.';
}

function recomendacao(item: OportunidadePublica, respostas: DadosPlanoCarreira): RecomendacaoPlano {
  return {
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao,
    tipo: item.tipo,
    fonte: item.fonte,
    link: item.origem === 'interna' && item.oportunidadeId ? `/oportunidades/${item.oportunidadeId}` : item.link_inscricao,
    bairro: item.bairro,
    motivo: motivoLocal(item, respostas),
  };
}

function gerarPlanoLocal(respostas: DadosPlanoCarreira, oportunidades: OportunidadePublica[]): PlanoCarreiraResposta {
  const cursos = candidatosParaPlano(oportunidades, 'curso').slice(0, 3).map((item) => recomendacao(item, respostas));
  const beneficios = candidatosParaPlano(oportunidades, 'beneficio').slice(0, 3).map((item) => recomendacao(item, respostas));
  const habilidades = [...new Set([...(respostas.interesses || []), ...(respostas.experiencias || []), ...(respostas.hobbies || [])])].slice(0, 8);
  const objetivo = sanitizarTexto(respostas.objetivo || 'seu próximo passo', 80).replace(/_/g, ' ');
  return {
    modoGeracao: 'local',
    titulo: `Plano para ${objetivo}`,
    resumo: 'Uma trilha inicial foi organizada a partir das suas respostas e das oportunidades reais disponíveis.',
    primeiroPasso: respostas.objetivo === 'curso_primeiro' ? 'Escolha um curso compatível com sua rotina.' : 'Confira as oportunidades mais alinhadas e escolha uma ação possível esta semana.',
    justificativa: 'O plano local usa objetivo, rotina, interesses e modalidade informados no questionário. Ele pode ser refeito quando você quiser.',
    habilidades: habilidades.length ? habilidades : ['Organização', 'Persistência', 'Experiência de vida'],
    trilha: [
      { titulo: 'Escolha uma prioridade', descricao: 'Comece pelo primeiro passo que cabe na sua rotina atual.' },
      { titulo: 'Fortaleça uma habilidade', descricao: 'Use um curso ou recurso disponível para avançar com segurança.' },
      { titulo: 'Acompanhe novas oportunidades', descricao: 'Volte ao Feed e ao Mapa para encontrar opções atualizadas.' },
    ],
    cursos,
    beneficios,
  };
}

function validarPlanoIA(valor: unknown, oportunidades: OportunidadePublica[], respostas: DadosPlanoCarreira): PlanoCarreiraResposta | null {
  if (!ehObjeto(valor) || contemChaveProibida(valor)) return null;
  const porId = new Map(oportunidades.map((item) => [item.id, item]));
  const recomendacoes = Array.isArray(valor.recomendacoes) ? valor.recomendacoes : [];
  const cursos: RecomendacaoPlano[] = [];
  const beneficios: RecomendacaoPlano[] = [];
  for (const item of recomendacoes) {
    if (!ehObjeto(item) || typeof item.id !== 'string' || (item.grupo !== 'curso' && item.grupo !== 'beneficio')) continue;
    const oportunidade = porId.get(item.id);
    if (!oportunidade || !oportunidade.link_inscricao && oportunidade.origem !== 'interna') continue;
    const registro = recomendacao(oportunidade, respostas);
    registro.motivo = sanitizarTexto(item.motivo, 280) || registro.motivo;
    (item.grupo === 'curso' ? cursos : beneficios).push(registro);
  }
  const textoObrigatorio = (chave: string, limite: number) => typeof valor[chave] === 'string' ? sanitizarTexto(valor[chave], limite) : '';
  const trilha = Array.isArray(valor.trilha) ? valor.trilha.filter(ehObjeto).map((item) => ({ titulo: sanitizarTexto(item.titulo, 120), descricao: sanitizarTexto(item.descricao, 280) })).filter((item) => item.titulo && item.descricao).slice(0, 4) : [];
  const habilidades = Array.isArray(valor.habilidades) ? valor.habilidades.filter((item): item is string => typeof item === 'string').map((item) => sanitizarTexto(item, 80)).filter(Boolean).slice(0, 8) : [];
  if (!textoObrigatorio('titulo', 160) || !textoObrigatorio('resumo', 600) || !textoObrigatorio('primeiroPasso', 300)) return null;
  return {
    modoGeracao: 'ia', titulo: textoObrigatorio('titulo', 160), resumo: textoObrigatorio('resumo', 600),
    primeiroPasso: textoObrigatorio('primeiroPasso', 300), justificativa: textoObrigatorio('justificativa', 600),
    habilidades, trilha, cursos: cursos.slice(0, 3), beneficios: beneficios.slice(0, 3),
  };
}

export async function processarPlanoCarreira(body: unknown, pool: Pool | null, usuarioId: string): Promise<PlanoCarreiraResposta> {
  if (!pool) throw new Error('banco indisponivel');
  const respostas = validarDadosPlano(body);
  const contexto = await montarContexto(pool, 'plano_carreira', usuarioId);
  try {
    const plano = validarPlanoIA(await gerarPlanoComIA(respostas, contexto), contexto.oportunidades, respostas);
    if (plano) return plano;
  } catch (erro) {
    console.error('plano carreira IA indisponivel; usando gerador local', erro instanceof Error ? erro.name : 'erro');
  }
  return gerarPlanoLocal(respostas, contexto.oportunidades);
}
