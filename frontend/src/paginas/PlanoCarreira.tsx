import { useEffect, useState } from 'react';
import { apiJSON } from '../services/api';
import { Link } from '../utils/roteador';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: string;
  link_inscricao?: string;
  bairro?: string;
  horario?: string;
  isOnline?: boolean;
}

type Objetivo =
  | 'emprego_rapido'
  | 'curso_primeiro'
  | 'renda_extra'
  | 'empreender'
  | 'recolocacao';

type Disponibilidade = 'manha' | 'tarde' | 'noite' | 'fins_semana' | 'flexivel';
type Modalidade = 'perto_casa' | 'presencial' | 'hibrido' | 'remoto';
type Dependencia = 'sim' | 'parcial' | 'nao';
type Escolaridade = 'fundamental' | 'medio' | 'tecnico' | 'superior';
type TempoEstudo = '0_2h' | '3_5h' | '6_8h' | '8h_mais';
type Desafio = 'tempo' | 'transporte' | 'dinheiro' | 'internet' | 'cuidado' | 'confianca';

interface Respostas {
  objetivo: Objetivo;
  disponibilidade: Disponibilidade;
  modalidade: Modalidade;
  interesses: string[];
  experiencias: string[];
  filhos: string;
  dependentes: Dependencia;
  apoio: 'sim' | 'as_vezes' | 'nao';
  escolaridade: Escolaridade;
  tempoEstudo: TempoEstudo;
  hobbies: string[];
  desafio: Desafio;
  sonho: string;
}

interface Recomendacao {
  titulo: string;
  descricao: string;
  tipo: string;
  empresa?: string;
  bairro?: string;
  link?: string;
  interno?: boolean;
  id?: number;
  motivo: string;
}

interface PlanoGerado {
  titulo: string;
  resumo: string;
  primeiroPasso: string;
  justificativa: string;
  habilidades: string[];
  trilha: Array<{
    titulo: string;
    descricao: string;
  }>;
  cursos: Recomendacao[];
  beneficios: Recomendacao[];
}

const OPCOES_OBJETIVO: Array<{ valor: Objetivo; label: string; ajuda: string }> = [
  { valor: 'emprego_rapido', label: 'Quero um emprego logo', ajuda: 'A IA vai priorizar vagas, cursos curtos e rotina compatível.' },
  { valor: 'curso_primeiro', label: 'Quero estudar antes', ajuda: 'A IA vai sugerir cursos e depois o caminho para vagas.' },
  { valor: 'renda_extra', label: 'Preciso de renda extra', ajuda: 'A IA vai buscar rotas mais flexiveis e ganhos rapidos.' },
  { valor: 'empreender', label: 'Quero empreender', ajuda: 'A IA vai combinar cursos, apoio e microcrédito.' },
  { valor: 'recolocacao', label: 'Quero me recolocar', ajuda: 'A IA vai olhar seu perfil e a rota mais segura para voltar.' },
];

const OPCOES_DISPONIBILIDADE: Array<{ valor: Disponibilidade; label: string }> = [
  { valor: 'manha', label: 'Manha' },
  { valor: 'tarde', label: 'Tarde' },
  { valor: 'noite', label: 'Noite' },
  { valor: 'fins_semana', label: 'Fim de semana' },
  { valor: 'flexivel', label: 'Horarios flexiveis' },
];

const OPCOES_MODALIDADE: Array<{ valor: Modalidade; label: string }> = [
  { valor: 'perto_casa', label: 'Perto de casa' },
  { valor: 'presencial', label: 'Presencial' },
  { valor: 'hibrido', label: 'Hibrido' },
  { valor: 'remoto', label: 'Remoto' },
];

const AREAS_INTERESSE: Array<{ valor: string; label: string }> = [
  { valor: 'atendimento', label: 'Atendimento ao publico' },
  { valor: 'vendas', label: 'Vendas' },
  { valor: 'cuidados', label: 'Cuidados' },
  { valor: 'beleza', label: 'Beleza' },
  { valor: 'cozinha', label: 'Cozinha' },
  { valor: 'costura', label: 'Costura' },
  { valor: 'administrativo', label: 'Administrativo' },
  { valor: 'tecnologia', label: 'Tecnologia' },
  { valor: 'logistica', label: 'Logistica' },
  { valor: 'limpeza', label: 'Limpeza e organizacao' },
  { valor: 'educacao', label: 'Educacao' },
  { valor: 'artesanato', label: 'Artesanato' },
];

const EXPERIENCIAS: Array<{ valor: string; label: string }> = [
  { valor: 'atendimento', label: 'Ja atendi pessoas' },
  { valor: 'vendas', label: 'Ja vendi algo' },
  { valor: 'cuidados', label: 'Ja cuidei de criancas ou idosos' },
  { valor: 'beleza', label: 'Ja trabalhei com beleza' },
  { valor: 'cozinha', label: 'Ja trabalhei com cozinha' },
  { valor: 'costura', label: 'Ja costurei ou produzi pecas' },
  { valor: 'administrativo', label: 'Ja organizei rotinas ou documentos' },
  { valor: 'tecnologia', label: 'Uso bem o celular ou computador' },
  { valor: 'logistica', label: 'Ja trabalhei com estoque ou entregas' },
  { valor: 'limpeza', label: 'Ja fiz limpeza ou servicos gerais' },
  { valor: 'educacao', label: 'Ja ensinei ou ajudei a ensinar' },
  { valor: 'artesanato', label: 'Ja produzi itens artesanais' },
];

const HOBBIES: Array<{ valor: string; label: string }> = [
  { valor: 'cozinhar', label: 'Cozinhar' },
  { valor: 'organizar', label: 'Organizar a casa' },
  { valor: 'maquiagem', label: 'Maquiagem e beleza' },
  { valor: 'costurar', label: 'Costurar' },
  { valor: 'arte', label: 'Arte e artesanato' },
  { valor: 'redes', label: 'Redes sociais' },
  { valor: 'cuidar', label: 'Cuidar de pessoas' },
  { valor: 'vender', label: 'Vender ou indicar coisas' },
  { valor: 'escrever', label: 'Escrever ou estudar' },
  { valor: 'tecnologia', label: 'Mexer no celular e apps' },
];

const ESCOLARIDADE: Array<{ valor: Escolaridade; label: string }> = [
  { valor: 'fundamental', label: 'Fundamental' },
  { valor: 'medio', label: 'Medio' },
  { valor: 'tecnico', label: 'Tecnico' },
  { valor: 'superior', label: 'Superior' },
];

const TEMPO_ESTUDO: Array<{ valor: TempoEstudo; label: string }> = [
  { valor: '0_2h', label: '0 a 2 horas por semana' },
  { valor: '3_5h', label: '3 a 5 horas por semana' },
  { valor: '6_8h', label: '6 a 8 horas por semana' },
  { valor: '8h_mais', label: 'Mais de 8 horas por semana' },
];

const DESAFIOS: Array<{ valor: Desafio; label: string }> = [
  { valor: 'tempo', label: 'Falta de tempo' },
  { valor: 'transporte', label: 'Transporte' },
  { valor: 'dinheiro', label: 'Dinheiro curto' },
  { valor: 'internet', label: 'Internet / celular' },
  { valor: 'cuidado', label: 'Cuidado com filhos' },
  { valor: 'confianca', label: 'Falta de confiança' },
];

const CATALOGO_CURSOS: Recomendacao[] = [
  {
    titulo: 'Qualifica Recife',
    descricao: 'Cursos gratuitos de saude, tecnologia, gastronomia, beleza, servicos e idiomas. Bom para quem quer entrada rapida.',
    tipo: 'Curso',
    empresa: 'Prefeitura do Recife',
    bairro: 'Recife',
    link: 'https://qualifica.recife.pe.gov.br/',
    motivo: 'Trilha curta e pratica para quem precisa ganhar ritmo rapido.',
  },
  {
    titulo: 'SENAC PE - Programa de Gratuidade',
    descricao: 'Cursos gratuitos em beleza, gastronomia, saude, moda, computacao e negocios.',
    tipo: 'Curso',
    empresa: 'SENAC Pernambuco',
    bairro: 'Boa Vista',
    link: 'https://www.pe.senac.br/psg/',
    motivo: 'Bom para quem quer certificacao reconhecida e curso profissionalizante.',
  },
  {
    titulo: 'SENAI PE - Cursos com foco em empregabilidade',
    descricao: 'Costura industrial, manutencao, logistica, automacao e tecnologia com foco em vagas reais.',
    tipo: 'Curso',
    empresa: 'SENAI Pernambuco',
    bairro: 'Iputinga',
    link: 'https://pe.senai.br/',
    motivo: 'Combina com quem quer aprender algo pratico para entrar no mercado.',
  },
  {
    titulo: 'SEBRAE PE - Trilhas de empreendedorismo',
    descricao: 'Financas, marketing digital, vendas, gestao e MEI para quem pensa em empreender.',
    tipo: 'Curso',
    empresa: 'SEBRAE Pernambuco',
    bairro: 'Imbiribeira',
    link: 'https://pe.lojavirtualsebrae.com.br/',
    motivo: 'Ajuda quem quer vender por conta propria ou organizar um negocio pequeno.',
  },
  {
    titulo: 'Porto Digital - Mulheres na tecnologia',
    descricao: 'Cursos, bootcamps e mentorias para mulheres que querem entrar na area de tecnologia.',
    tipo: 'Curso',
    empresa: 'Porto Digital',
    bairro: 'Bairro do Recife',
    link: 'https://www.portodigital.org/',
    motivo: 'Interessante para quem gosta de celular, internet e ferramentas digitais.',
  },
  {
    titulo: 'Nave do Conhecimento',
    descricao: 'Tecnologia, programacao, design e empreendedorismo digital com acesso presencial e gratuito.',
    tipo: 'Curso',
    empresa: 'Prefeitura do Recife / Porto Digital',
    bairro: 'Casa Amarela',
    link: 'https://conecta.recife.pe.gov.br/',
    motivo: 'Boa porta de entrada para quem quer aprender no proprio bairro.',
  },
  {
    titulo: 'IFPE Recife',
    descricao: 'Cursos tecnicos gratuitos em enfermagem, informatica, logistica e outras areas.',
    tipo: 'Curso',
    empresa: 'Instituto Federal de Pernambuco',
    bairro: 'Cidade Universitaria',
    link: 'https://www.ifpe.edu.br/',
    motivo: 'Indicado para quem quer algo mais estruturado e com peso no curriculo.',
  },
];

const CATALOGO_BENEFICIOS: Recomendacao[] = [
  {
    titulo: 'Mães de Pernambuco',
    descricao: 'Renda extra para maes com filhos de 0 a 6 anos que estejam dentro dos criterios do programa.',
    tipo: 'Benefício social',
    empresa: 'Governo do Estado de Pernambuco',
    bairro: 'Recife',
    link: 'https://www.maesdepernambuco.pe.gov.br/',
    motivo: 'Ajuda a aliviar a pressao financeira enquanto voce se reorganiza.',
  },
  {
    titulo: 'Bolsa Familia',
    descricao: 'Programa de transferencia de renda para familias em vulnerabilidade. Cadastro no CRAS com CadUnico atualizado.',
    tipo: 'Benefício social',
    empresa: 'Governo Federal',
    bairro: 'Recife',
    link: 'https://www.gov.br/pt-br/servicos/inscrever-se-no-bolsa-familia',
    motivo: 'Importante para familias que precisam reforcar a renda mensal.',
  },
  {
    titulo: 'Gás do Povo',
    descricao: 'Recarrega gratuita de botijao em ciclos para familias com renda mais baixa.',
    tipo: 'Benefício social',
    empresa: 'Governo Federal',
    bairro: 'Recife',
    link: 'https://www.gov.br/pt-br/servicos/obter-o-auxilio-gas',
    motivo: 'Pode reduzir um custo fixo importante da casa.',
  },
  {
    titulo: 'Tarifa Social de Energia',
    descricao: 'Desconto na conta de luz para familias no CadUnico dentro dos criterios do programa.',
    tipo: 'Benefício social',
    empresa: 'ANEEL / Equatorial',
    bairro: 'Recife',
    link: 'https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social',
    motivo: 'Boa escolha quando o objetivo e aliviar gastos do mes.',
  },
  {
    titulo: 'CredPop Recife',
    descricao: 'Microcredito para pequenos empreendimentos e para quem quer iniciar uma renda propria.',
    tipo: 'Microcrédito',
    empresa: 'Prefeitura do Recife',
    bairro: 'Recife',
    link: 'https://credpop.recife.pe.gov.br/',
    motivo: 'Ajuda muito quem quer empreender com pouco dinheiro inicial.',
  },
  {
    titulo: 'CRAS e CadUnico',
    descricao: 'Porta de entrada para varios beneficios, apoio social e orientacao da rede publica.',
    tipo: 'Apoio',
    empresa: 'Assistencia Social',
    bairro: 'Recife',
    motivo: 'Organiza sua base de protecao social e abre portas para outros programas.',
  },
];

const MAPA_HABILIDADES: Record<string, string[]> = {
  atendimento: ['comunicacao', 'escuta ativa', 'acolhimento'],
  vendas: ['persuasao', 'relacionamento', 'negociacao'],
  cuidados: ['cuidado', 'paciencia', 'responsabilidade'],
  beleza: ['capricho', 'atencao aos detalhes', 'estetica'],
  cozinha: ['higiene', 'organizacao', 'producao'],
  costura: ['precisao', 'criatividade', 'capricho'],
  administrativo: ['organizacao', 'escrita', 'rotina'],
  tecnologia: ['ferramentas digitais', 'aprendizado rapido', 'celular'],
  logistica: ['controle', 'organizacao', 'movimentacao'],
  limpeza: ['capricho', 'disciplina', 'organizacao'],
  educacao: ['didatica', 'paciencia', 'escuta'],
  artesanato: ['criatividade', 'producoes manuais', 'capricho'],
  cozinhar: ['higiene', 'criatividade', 'organizacao'],
  organizar: ['gestao de rotina', 'organizacao', 'planejamento'],
  maquiagem: ['capricho', 'estetica', 'atencao aos detalhes'],
  redes: ['comunicacao digital', 'criatividade', 'autogestao'],
  cuidar: ['cuidado', 'paciencia', 'responsabilidade'],
  vender: ['comunicacao', 'persuasao', 'iniciativa'],
  escrever: ['escrita', 'comunicacao', 'aprendizado'],
};

function normalizar(valor: string): string {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function rotuloObjetivo(valor: Objetivo): string {
  return OPCOES_OBJETIVO.find((op) => op.valor === valor)?.label ?? valor;
}

function rotuloDisponibilidade(valor: Disponibilidade): string {
  return OPCOES_DISPONIBILIDADE.find((op) => op.valor === valor)?.label ?? valor;
}

function rotuloModalidade(valor: Modalidade): string {
  return OPCOES_MODALIDADE.find((op) => op.valor === valor)?.label ?? valor;
}

function rotuloEscolaridade(valor: Escolaridade): string {
  return ESCOLARIDADE.find((op) => op.valor === valor)?.label ?? valor;
}

function rotuloTempo(valor: TempoEstudo): string {
  return TEMPO_ESTUDO.find((op) => op.valor === valor)?.label ?? valor;
}

function rotuloDesafio(valor: Desafio): string {
  return DESAFIOS.find((op) => op.valor === valor)?.label ?? valor;
}

function extrairNumero(valor: string): number {
  const n = Number(String(valor || '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function contemAlgum(texto: string, termos: string[]): boolean {
  const base = normalizar(texto);
  return termos.some((termo) => base.includes(normalizar(termo)));
}

function mapearOportunidade(op: Oportunidade): Recomendacao {
  const tipo = normalizar(op.tipo);
  let tipoFinal = 'Apoio';
  if (tipo.includes('curso')) tipoFinal = 'Curso';
  else if (tipo.includes('benef')) tipoFinal = 'Benefício social';
  else if (tipo.includes('micro')) tipoFinal = 'Microcrédito';
  else if (tipo.includes('apoio')) tipoFinal = 'Apoio';

  return {
    id: op.id,
    titulo: op.titulo,
    descricao: op.descricao,
    tipo: tipoFinal,
    empresa: op.empresa,
    bairro: op.bairro,
    link: op.link_inscricao,
    interno: Boolean(op.id && !op.link_inscricao),
    motivo: '',
  };
}

function escolherMaisRelevantes(
  itens: Recomendacao[],
  respostas: Respostas,
  limite: number,
  tipoDesejado: string,
): Recomendacao[] {
  const palavrasPorArea: Record<string, string[]> = {
    atendimento: ['atendimento', 'cliente', 'recepcao', 'call center', 'telemarketing', 'escuta'],
    vendas: ['venda', 'vendas', 'comercial', 'negociacao', 'lojista', 'promotor'],
    cuidados: ['cuidador', 'cuidados', 'crianca', 'idoso', 'bab', 'acolhimento'],
    beleza: ['beleza', 'estetica', 'cabelo', 'maquiagem', 'unhas', 'salao'],
    cozinha: ['cozinha', 'culinaria', 'gastronomia', 'confeitaria', 'alimentos'],
    costura: ['costura', 'moda', 'artesanato', 'linha', 'tecido'],
    administrativo: ['administrativo', 'escritorio', 'planilha', 'excel', 'rotina'],
    tecnologia: ['tecnologia', 'informatica', 'digital', 'celular', 'computador', 'canva'],
    logistica: ['logistica', 'estoque', 'expedicao', 'almoxarifado'],
    limpeza: ['limpeza', 'servicos gerais', 'organizacao', 'higiene'],
    educacao: ['educacao', 'ensino', 'didatica', 'alfabetizacao'],
    artesanato: ['artesanato', 'manual', 'criatividade', 'feito a mao'],
    cozinhar: ['cozinha', 'gastronomia', 'culinaria', 'alimentos'],
    organizar: ['organizacao', 'rotina', 'planejamento', 'agenda'],
    maquiagem: ['maquiagem', 'beleza', 'estetica'],
    redes: ['redes sociais', 'digital', 'social media', 'marketing'],
    cuidar: ['cuidador', 'cuidado', 'acolhimento'],
    vender: ['venda', 'vendas', 'comercial', 'negociacao'],
    escrever: ['texto', 'escrita', 'comunicacao', 'redacao'],
  };

  const score = (item: Recomendacao): number => {
    const base = normalizar([item.titulo, item.descricao, item.empresa, item.bairro, item.tipo].filter(Boolean).join(' '));
    let total = 0;

    if (normalizar(item.tipo).includes(normalizar(tipoDesejado))) {
      total += 4;
    }

    Object.entries(palavrasPorArea).forEach(([area, termos]) => {
      if (respostas.interesses.includes(area) || respostas.experiencias.includes(area) || respostas.hobbies.includes(area)) {
        if (termos.some((termo) => base.includes(termo))) total += 3;
      }
    });

    if (respostas.objetivo === 'curso_primeiro' && normalizar(item.tipo).includes('curso')) total += 2;
    if (respostas.objetivo === 'emprego_rapido' && normalizar(item.tipo).includes('curso')) total += 1;
    if (respostas.objetivo === 'empreender' && contemAlgum(base, ['empreendedor', 'negocio', 'mei', 'marketing', 'venda'])) total += 3;
    if (respostas.objetivo === 'renda_extra' && contemAlgum(base, ['renda', 'apoio', 'credito', 'venda'])) total += 2;

    if (respostas.modalidade === 'remoto' && contemAlgum(base, ['online', 'ead', 'virtual', '24h'])) total += 2;
    if (respostas.modalidade === 'hibrido' && contemAlgum(base, ['online', 'presencial'])) total += 1;
    if (respostas.modalidade === 'perto_casa' && item.bairro && !contemAlgum(base, ['online', 'remoto'])) total += 1.5;

    if (respostas.disponibilidade === 'noite' && contemAlgum(base, ['noite', 'noturno', 'flexivel'])) total += 1.5;
    if (respostas.disponibilidade === 'fins_semana' && contemAlgum(base, ['fim', 'flexivel', 'online'])) total += 1;
    if (respostas.desafio === 'tempo' && contemAlgum(base, ['curto', 'flexivel', 'online', 'rapido'])) total += 1.5;
    if (respostas.desafio === 'internet' && contemAlgum(base, ['presencial', 'bairro'])) total += 1;
    if (respostas.desafio === 'transporte' && contemAlgum(base, ['perto', 'bairro', 'presencial'])) total += 1.5;

    return total;
  };

  return [...itens]
    .map((item) => ({ item, score: score(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map(({ item }) => item);
}

function gerarMotivoCurso(item: Recomendacao, respostas: Respostas): string {
  const areas: string[] = [];
  const texto = normalizar([item.titulo, item.descricao, item.empresa].filter(Boolean).join(' '));

  Object.entries({
    atendimento: ['atendimento', 'cliente', 'recepcao', 'escuta'],
    vendas: ['venda', 'comercial', 'negociacao'],
    cuidados: ['cuidador', 'cuidado', 'acolhimento'],
    beleza: ['beleza', 'estetica', 'maquiagem'],
    cozinha: ['cozinha', 'gastronomia', 'culinaria'],
    costura: ['costura', 'moda', 'artesanato'],
    administrativo: ['administrativo', 'escritorio', 'planilha', 'rotina'],
    tecnologia: ['tecnologia', 'informatica', 'digital', 'canva'],
    logistica: ['logistica', 'estoque', 'expedicao'],
    limpeza: ['limpeza', 'servicos gerais', 'higiene'],
    educacao: ['educacao', 'ensino', 'didatica'],
    artesanato: ['artesanato', 'manual'],
  }).forEach(([area, termos]) => {
    if ((respostas.interesses.includes(area) || respostas.experiencias.includes(area) || respostas.hobbies.includes(area)) && termos.some((termo) => texto.includes(termo))) {
      areas.push(area);
    }
  });

  if (areas.length > 0) {
    return `Combina com ${areas.slice(0, 2).join(' e ')} e com sua rotina.`;
  }
  if (respostas.objetivo === 'empreender') {
    return 'Ajuda a abrir uma porta pratica para voce ganhar mais autonomia.';
  }
  if (respostas.objetivo === 'curso_primeiro') {
    return 'Boa opcao para comecar com formacao antes de ir para as vagas.';
  }
  return 'Pode encaixar bem com o caminho que voce escolheu agora.';
}

function gerarMotivoBeneficio(item: Recomendacao, respostas: Respostas): string {
  const texto = normalizar([item.titulo, item.descricao].filter(Boolean).join(' '));
  if (respostas.objetivo === 'empreender' && contemAlgum(texto, ['credito', 'microcredito', 'empreendedor'])) {
    return 'Pode dar folego financeiro para iniciar um negocio pequeno.';
  }
  if (Number(respostas.filhos) > 0 && contemAlgum(texto, ['mae', 'bolsa familia', 'crianca', 'filhos', 'gas'])) {
    return 'Ajuda na organizacao da casa e na protecao dos filhos.';
  }
  if (respostas.desafio === 'dinheiro' && contemAlgum(texto, ['renda', 'desconto', 'credito', 'gas', 'tarifa'])) {
    return 'Pode aliviar um gasto importante enquanto voce se reorganiza.';
  }
  if (respostas.desafio === 'cuidado' && contemAlgum(texto, ['cras', 'creas', 'apoio', 'rede'])) {
    return 'Da suporte para voce nao carregar tudo sozinha.';
  }
  return 'Combina com o seu momento e com a rotina que voce descreveu.';
}

function gerarHabilidades(respostas: Respostas): string[] {
  const habilidades = new Set<string>();

  const adicionar = (itens: string[]) => itens.forEach((item) => habilidades.add(item));

  [...respostas.interesses, ...respostas.experiencias, ...respostas.hobbies].forEach((valor) => {
    adicionar(MAPA_HABILIDADES[valor] || []);
  });

  if (Number(respostas.filhos) > 0) adicionar(['gestao de rotina', 'priorizacao']);
  if (respostas.dependentes !== 'nao') adicionar(['resiliencia', 'organizacao familiar']);
  if (respostas.objetivo === 'empreender') adicionar(['autonomia', 'planejamento']);
  if (respostas.modalidade === 'remoto') adicionar(['autogestao digital']);
  if (respostas.desafio === 'tempo') adicionar(['gestao de tempo']);

  return Array.from(habilidades).slice(0, 8);
}

function gerarTrilha(
  respostas: Respostas,
  cursos: Recomendacao[],
  beneficios: Recomendacao[],
): Array<{ titulo: string; descricao: string }> {
  const cursoPrincipal = cursos[0];
  const beneficioPrincipal = beneficios[0];
  const passos: Array<{ titulo: string; descricao: string }> = [];

  const precisaBase =
    Number(respostas.filhos) > 0 ||
    respostas.dependentes !== 'nao' ||
    respostas.desafio === 'dinheiro' ||
    respostas.desafio === 'cuidado';

  if (precisaBase && beneficioPrincipal) {
    passos.push({
      titulo: `Organizar ${beneficioPrincipal.titulo}`,
      descricao: 'Comece tirando o peso financeiro e burocratico da frente.',
    });
  } else {
    passos.push({
      titulo: 'Atualizar perfil e documentos',
      descricao: 'Deixe tudo pronto para acelerar as proximas escolhas.',
    });
  }

  passos.push({
    titulo: cursoPrincipal ? `Fazer ${cursoPrincipal.titulo}` : 'Fazer um curso curto',
    descricao: 'A fase seguinte e ganhar uma habilidade pratica que caiba na sua rotina.',
  });

  if (respostas.objetivo === 'empreender') {
    passos.push({
      titulo: 'Testar uma oferta pequena',
      descricao: 'Abra uma renda inicial simples, com apoio da rede e do proprio bairro.',
    });
  } else if (respostas.objetivo === 'curso_primeiro') {
    passos.push({
      titulo: 'Depois ir para o feed',
      descricao: 'Use o feed para escolher vagas e oportunidades que combinem com o curso.',
    });
  } else {
    passos.push({
      titulo: 'Buscar vagas e combinar com sua rotina',
      descricao: 'Use o feed e o mapa para entrar em vagas mais proximas e viaveis.',
    });
  }

  return passos.slice(0, 3);
}

function gerarResumo(respostas: Respostas): string {
  const filhos = extrairNumero(respostas.filhos);
  const dependentes =
    respostas.dependentes === 'sim'
      ? 'dependentes'
      : respostas.dependentes === 'parcial'
        ? 'dependencia parcial'
        : 'sem dependencia atual';

  return [
    rotuloObjetivo(respostas.objetivo),
    `rotina ${rotuloDisponibilidade(respostas.disponibilidade).toLowerCase()}`,
    `modalidade ${rotuloModalidade(respostas.modalidade).toLowerCase()}`,
    filhos > 0 ? `${filhos} filho${filhos === 1 ? '' : 's'}` : 'sem filhos informados',
    dependentes,
  ].join(' • ');
}

function gerarPrimeiroPasso(
  respostas: Respostas,
  cursos: Recomendacao[],
  beneficios: Recomendacao[],
): string {
  const cursoPrincipal = cursos[0];
  const beneficioPrincipal = beneficios[0];

  if ((extrairNumero(respostas.filhos) > 0 || respostas.dependentes !== 'nao') && beneficioPrincipal) {
    return `Comece por ${beneficioPrincipal.titulo} e, em seguida, faça ${cursoPrincipal?.titulo || 'um curso curto'} para acelerar a sua saida.`;
  }

  if (respostas.objetivo === 'curso_primeiro') {
    return `Comece pelo curso ${cursoPrincipal?.titulo || 'mais alinhado'} e depois volte para as vagas.`;
  }

  if (respostas.objetivo === 'empreender') {
    return `Abra uma oferta pequena e use ${beneficioPrincipal?.titulo || 'o apoio da rede'} para dar sustentacao.`;
  }

  if (respostas.objetivo === 'renda_extra') {
    return `Priorize uma fonte de renda flexivel e use ${cursoPrincipal?.titulo || 'um curso curto'} para fortalecer seu perfil.`;
  }

  return `Atualize o perfil e entre em ${cursoPrincipal?.titulo || 'uma qualificacao curta'} antes de procurar as vagas mais parecidas.`;
}

function gerarPlano(respostas: Respostas, oportunidades: Oportunidade[]): PlanoGerado {
  const mapeadas = oportunidades.map(mapearOportunidade);
  const cursosBase = [
    ...mapeadas.filter((item) => normalizar(item.tipo).includes('curso')),
    ...CATALOGO_CURSOS,
  ];
  const beneficiosBase = [
    ...mapeadas.filter((item) => normalizar(item.tipo).includes('benef') || normalizar(item.tipo).includes('micro') || normalizar(item.tipo).includes('apoio')),
    ...CATALOGO_BENEFICIOS,
  ];

  const cursos = escolherMaisRelevantes(cursosBase, respostas, 3, 'curso').map((item) => ({
    ...item,
    motivo: gerarMotivoCurso(item, respostas),
  }));

  const beneficios = escolherMaisRelevantes(beneficiosBase, respostas, 3, 'benefício').map((item) => ({
    ...item,
    motivo: gerarMotivoBeneficio(item, respostas),
  }));

  return {
    titulo: `Plano para ${rotuloObjetivo(respostas.objetivo).toLowerCase()}`,
    resumo: gerarResumo(respostas),
    primeiroPasso: gerarPrimeiroPasso(respostas, cursos, beneficios),
    justificativa:
      'A IA considerou sua disponibilidade, seus filhos, a modalidade preferida, o que voce gosta de fazer e o que mais pesa na sua rotina.',
    habilidades: gerarHabilidades(respostas),
    trilha: gerarTrilha(respostas, cursos, beneficios),
    cursos,
    beneficios,
  };
}

function Badge({ children, tonalidade = 'neutra' }: { children: string; tonalidade?: 'neutra' | 'destaque' | 'sucesso' }) {
  return <span className={`pc-badge-${tonalidade}`}>{children}</span>;
}

function PillButton({
  label,
  ajuda,
  ativo,
  onClick,
}: {
  label: string;
  ajuda?: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`pc-pill ${ativo ? 'ativo' : ''}`} onClick={onClick}>
      <strong>{label}</strong>
      {ajuda && <span>{ajuda}</span>}
    </button>
  );
}

function MultiPillButton({
  label,
  ativo,
  onClick,
}: {
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`pc-chip ${ativo ? 'ativo' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

function RecomendacaoCard({ item }: { item: Recomendacao }) {
  const botao = item.interno && item.id ? (
    <Link to={`/oportunidades/${item.id}`} className="btn-secundario pc-reco-btn">
      Ver detalhe
    </Link>
  ) : item.link ? (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn-secundario pc-reco-btn">
      Abrir
    </a>
  ) : null;

  return (
    <article className="pc-reco-card">
      <div className="pc-reco-topo">
        <span className={`pc-tipo ${normalizar(item.tipo).includes('curso') ? 'curso' : normalizar(item.tipo).includes('benef') ? 'beneficio' : normalizar(item.tipo).includes('micro') ? 'micro' : 'apoio'}`}>
          {item.tipo}
        </span>
        {item.bairro && <span className="pc-bairro">{item.bairro}</span>}
      </div>
      <h4>{item.titulo}</h4>
      {item.empresa && <p className="pc-empresa">{item.empresa}</p>}
      <p className="pc-desc">{item.descricao}</p>
      <p className="pc-motivo">{item.motivo}</p>
      {botao && <div className="pc-reco-acao">{botao}</div>}
    </article>
  );
}

const RESPOSTAS_INICIAIS: Respostas = {
  objetivo: 'emprego_rapido',
  disponibilidade: 'flexivel',
  modalidade: 'perto_casa',
  interesses: [],
  experiencias: [],
  filhos: '1',
  dependentes: 'sim',
  apoio: 'as_vezes',
  escolaridade: 'medio',
  tempoEstudo: '3_5h',
  hobbies: [],
  desafio: 'tempo',
  sonho: '',
};

const PASSOS = [
  'Objetivo',
  'Rotina',
  'Onde trabalhar',
  'Areas de interesse',
  'O que voce ja faz',
  'Filhos e apoio',
  'Estudo e tempo',
  'Hobbies e meta',
];

export default function PlanoCarreira() {
  const [respostas, setRespostas] = useState<Respostas>(RESPOSTAS_INICIAIS);
  const [passo, setPasso] = useState(0);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [plano, setPlano] = useState<PlanoGerado | null>(null);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setCarregando(true);
      try {
        const [internas, externas] = await Promise.all([
          apiJSON<Oportunidade[]>('/oportunidades').catch(() => [] as Oportunidade[]),
          apiJSON<Oportunidade[]>('/oportunidades/externas').catch(() => [] as Oportunidade[]),
        ]);
        if (!ativo) return;
        setOportunidades([...internas, ...externas]);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const totalPassos = PASSOS.length;
  const progresso = Math.round(((passo + 1) / totalPassos) * 100);
  const habilidadesPrevias = gerarHabilidades(respostas);
  const resumoAgora = gerarResumo(respostas);

  const atualizar = <K extends keyof Respostas>(chave: K, valor: Respostas[K]) => {
    setRespostas((atual) => ({ ...atual, [chave]: valor }));
  };

  const alternarLista = (chave: 'interesses' | 'experiencias' | 'hobbies', valor: string) => {
    setRespostas((atual) => {
      const lista = atual[chave];
      return {
        ...atual,
        [chave]: lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor],
      } as Respostas;
    });
  };

  const gerar = async () => {
    setGerando(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const resultado = gerarPlano(respostas, oportunidades);
    setPlano(resultado);
    setGerando(false);
    window.setTimeout(() => {
      document.getElementById('pc-plano')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const avancar = async () => {
    if (passo < totalPassos - 1) {
      setPasso((valor) => Math.min(valor + 1, totalPassos - 1));
      return;
    }
    await gerar();
  };

  const voltar = () => {
    setPasso((valor) => Math.max(valor - 1, 0));
  };

  const renderPasso = () => {
    switch (passo) {
      case 0:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 1 de 8</p>
            <h3>Qual e o seu objetivo principal agora?</h3>
            <p className="pc-ajuda">A IA usa sua resposta para definir se o plano comeca por curso, emprego, renda extra ou empreendedorismo.</p>
            <div className="pc-grid-opcoes">
              {OPCOES_OBJETIVO.map((opcao) => (
                <PillButton
                  key={opcao.valor}
                  label={opcao.label}
                  ajuda={opcao.ajuda}
                  ativo={respostas.objetivo === opcao.valor}
                  onClick={() => atualizar('objetivo', opcao.valor)}
                />
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 2 de 8</p>
            <h3>Quando voce consegue se dedicar?</h3>
            <p className="pc-ajuda">Isso ajuda a IA a sugerir opcoes que cabem na sua rotina.</p>
            <div className="pc-grid-opcoes pc-grid-opcoes-pequenas">
              {OPCOES_DISPONIBILIDADE.map((opcao) => (
                <MultiPillButton
                  key={opcao.valor}
                  label={opcao.label}
                  ativo={respostas.disponibilidade === opcao.valor}
                  onClick={() => atualizar('disponibilidade', opcao.valor)}
                />
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 3 de 8</p>
            <h3>Onde voce gostaria de trabalhar?</h3>
            <p className="pc-ajuda">Pode ser perto de casa, remoto, hibrido ou presencial.</p>
            <div className="pc-grid-opcoes pc-grid-opcoes-pequenas">
              {OPCOES_MODALIDADE.map((opcao) => (
                <MultiPillButton
                  key={opcao.valor}
                  label={opcao.label}
                  ativo={respostas.modalidade === opcao.valor}
                  onClick={() => atualizar('modalidade', opcao.valor)}
                />
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 4 de 8</p>
            <h3>Quais areas combinam mais com voce?</h3>
            <p className="pc-ajuda">Selecione quantas quiser. A IA vai cruzar com cursos e vagas parecidas.</p>
            <div className="pc-grid-tags">
              {AREAS_INTERESSE.map((opcao) => (
                <MultiPillButton
                  key={opcao.valor}
                  label={opcao.label}
                  ativo={respostas.interesses.includes(opcao.valor)}
                  onClick={() => alternarLista('interesses', opcao.valor)}
                />
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 5 de 8</p>
            <h3>O que voce ja faz bem ou ja fez antes?</h3>
            <p className="pc-ajuda">Essas experiencias ajudam a IA a reconhecer habilidades que ja existem em voce.</p>
            <div className="pc-grid-tags">
              {EXPERIENCIAS.map((opcao) => (
                <MultiPillButton
                  key={opcao.valor}
                  label={opcao.label}
                  ativo={respostas.experiencias.includes(opcao.valor)}
                  onClick={() => alternarLista('experiencias', opcao.valor)}
                />
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 6 de 8</p>
            <h3>Como esta sua realidade familiar?</h3>
            <p className="pc-ajuda">A IA usa isso para sugerir beneficios, horarios e cursos mais viaveis.</p>
            <div className="pc-form-grid">
              <label>
                Quantos filhos voce tem?
                <input
                  className="pc-input"
                  type="number"
                  min={0}
                  value={respostas.filhos}
                  onChange={(e) => atualizar('filhos', e.target.value)}
                />
              </label>
              <label>
                Eles dependem de voce?
                <select
                  className="pc-input"
                  value={respostas.dependentes}
                  onChange={(e) => atualizar('dependentes', e.target.value as Dependencia)}
                >
                  <option value="sim">Sim, totalmente</option>
                  <option value="parcial">Em parte</option>
                  <option value="nao">Nao no momento</option>
                </select>
              </label>
              <label className="pc-cheio">
                Voce tem alguem para ajudar nos cuidados?
                <select
                  className="pc-input"
                  value={respostas.apoio}
                  onChange={(e) => atualizar('apoio', e.target.value as Respostas['apoio'])}
                >
                  <option value="sim">Sim, tenho apoio</option>
                  <option value="as_vezes">As vezes</option>
                  <option value="nao">Nao tenho apoio fixo</option>
                </select>
              </label>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 7 de 8</p>
            <h3>Qual e sua escolaridade e quanto tempo voce pode estudar?</h3>
            <p className="pc-ajuda">Isso ajuda a IA a indicar o nivel certo de curso para o seu momento.</p>
            <div className="pc-form-grid">
              <label>
                Escolaridade
                <select
                  className="pc-input"
                  value={respostas.escolaridade}
                  onChange={(e) => atualizar('escolaridade', e.target.value as Escolaridade)}
                >
                  {ESCOLARIDADE.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tempo para estudar
                <select
                  className="pc-input"
                  value={respostas.tempoEstudo}
                  onChange={(e) => atualizar('tempoEstudo', e.target.value as TempoEstudo)}
                >
                  {TEMPO_ESTUDO.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      case 7:
      default:
        return (
          <div className="pc-bloco">
            <p className="pc-rotulo">Pergunta 8 de 8</p>
            <h3>Quais hobbies te representam e o que mais atrapalha hoje?</h3>
            <p className="pc-ajuda">A IA pode transformar seus gostos em habilidades e evitar rotas que nao cabem na sua rotina.</p>
            <div className="pc-subbloco">
              <strong>Hobbies ou gostos</strong>
              <div className="pc-grid-tags">
                {HOBBIES.map((opcao) => (
                  <MultiPillButton
                    key={opcao.valor}
                    label={opcao.label}
                    ativo={respostas.hobbies.includes(opcao.valor)}
                    onClick={() => alternarLista('hobbies', opcao.valor)}
                  />
                ))}
              </div>
            </div>
            <div className="pc-form-grid pc-form-grid-dupla">
              <label>
                Principal desafio
                <select
                  className="pc-input"
                  value={respostas.desafio}
                  onChange={(e) => atualizar('desafio', e.target.value as Desafio)}
                >
                  {DESAFIOS.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Seu sonho para os proximos 6 meses
                <textarea
                  className="pc-input pc-textarea"
                  rows={4}
                  value={respostas.sonho}
                  onChange={(e) => atualizar('sonho', e.target.value)}
                  placeholder="Ex.: conseguir um trabalho perto de casa, terminar um curso, abrir uma renda extra..."
                />
              </label>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="pc-page">
      <section className="pc-hero">
        <div className="container pc-hero-grid">
          <div className="pc-hero-texto">
            <Badge tonalidade="destaque">Plano de carreira com IA</Badge>
            <h1>Um caminho mais claro para o seu proximo passo</h1>
            <p>
              Responda perguntas sobre sua rotina, seus filhos, seus interesses e sua
              disponibilidade. A IA cruza essas respostas com cursos, beneficios e rotas
              possiveis para montar um plano de carreira feito para a sua realidade.
            </p>
            <div className="pc-hero-acoes">
              <a href="#pc-questionario" className="btn-primario">
                Comecar agora
              </a>
              <Link to="/" className="btn-secundario">
                Ver feed
              </Link>
            </div>
            <div className="pc-hero-fitas">
              <span>Leva menos de 3 minutos</span>
              <span>Mostra cursos, beneficios e o primeiro passo</span>
              <span>Funciona no celular</span>
            </div>
          </div>
          <aside className="pc-hero-card">
            <div className="pc-hero-card-topo">
              <Badge tonalidade="sucesso">Como funciona</Badge>
              <span className="pc-hero-card-status">{carregando ? 'Carregando oportunidades' : 'Pronto para personalizar'}</span>
            </div>
            <h3>3 movimentos para sair do zero com mais seguranca</h3>
            <ul className="pc-hero-lista">
              <li>
                <strong>1.</strong>
                <span>Voce responde perguntas sobre rotina, filhos, trabalho e preferencia de horario.</span>
              </li>
              <li>
                <strong>2.</strong>
                <span>A IA identifica habilidades e aponta cursos e beneficios que cabem na sua vida.</span>
              </li>
              <li>
                <strong>3.</strong>
                <span>Voce recebe um plano de prioridade com o primeiro passo e proximas acoes.</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="pc-faixa">
        <div className="container pc-tres-colunas">
          <article className="pc-mini-card">
            <Badge>Clareza</Badge>
            <h3>Voce entende por onde comecar</h3>
            <p>A plataforma organiza a bagunca da busca em uma trilha simples, com prioridade realista.</p>
          </article>
          <article className="pc-mini-card">
            <Badge>Rotina</Badge>
            <h3>O plano respeita sua vida</h3>
            <p>Horarios, filhos, transporte e apoio da rede entram na decisao da IA.</p>
          </article>
          <article className="pc-mini-card">
            <Badge>Avanco</Badge>
            <h3>Curso, beneficio e vaga juntos</h3>
            <p>Em vez de escolher uma coisa so, o plano mostra a sequencia mais inteligente.</p>
          </article>
        </div>
      </section>

      <section className="pc-secao">
        <div className="container pc-layout">
          <article className="pc-card pc-questionario" id="pc-questionario">
            <div className="pc-cabeca">
              <div>
                <Badge tonalidade="destaque">Questionario</Badge>
                <h2>Responda para a IA montar seu plano</h2>
                <p>
                  Quanto mais detalhadas forem as respostas, mais perto do seu momento real o
                  plano fica.
                </p>
              </div>
              <div className="pc-progresso-card">
                <strong>{passo + 1}/{totalPassos}</strong>
                <span>{progresso}% concluido</span>
              </div>
            </div>

            <div className="pc-stepper">
              {PASSOS.map((item, indice) => (
                <span key={item} className={`pc-stepper-item ${indice === passo ? 'ativo' : indice < passo ? 'feito' : ''}`}>
                  {item}
                </span>
              ))}
            </div>

            {renderPasso()}

            <div className="pc-navegacao">
              <button type="button" className="btn-secundario" onClick={voltar} disabled={passo === 0 || gerando}>
                Voltar
              </button>
              <button type="button" className="btn-primario" onClick={avancar} disabled={gerando}>
                {gerando
                  ? 'Gerando plano...'
                  : passo === totalPassos - 1
                    ? 'Gerar meu plano'
                    : 'Proxima pergunta'}
              </button>
            </div>
          </article>

          <aside className="pc-lateral">
            <article className="pc-card pc-resumo-card">
              <Badge>Seu perfil agora</Badge>
              <h3>Resumo vivo do que a IA ja entendeu</h3>
              <p>{resumoAgora}</p>
              <div className="pc-lista-resumo">
                <span>
                  <strong>Objetivo</strong>
                  {rotuloObjetivo(respostas.objetivo)}
                </span>
                <span>
                  <strong>Rotina</strong>
                  {rotuloDisponibilidade(respostas.disponibilidade)}
                </span>
                <span>
                  <strong>Onde</strong>
                  {rotuloModalidade(respostas.modalidade)}
                </span>
                <span>
                  <strong>Tempo de estudo</strong>
                  {rotuloTempo(respostas.tempoEstudo)}
                </span>
                <span>
                  <strong>Escolaridade</strong>
                  {rotuloEscolaridade(respostas.escolaridade)}
                </span>
                <span>
                  <strong>Desafio</strong>
                  {rotuloDesafio(respostas.desafio)}
                </span>
              </div>
            </article>

            <article className="pc-card pc-resumo-card">
              <Badge tonalidade="sucesso">Habilidades que apareceram</Badge>
              <h3>O que a IA ja pode reconhecer em voce</h3>
              <div className="pc-skill-cloud">
                {habilidadesPrevias.length > 0 ? (
                  habilidadesPrevias.map((item) => (
                    <span key={item} className="pc-skill-chip">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="pc-skill-vazio">Escolha areas e hobbies para revelar suas habilidades.</span>
                )}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="pc-secao pc-resultados" id="pc-plano">
        <div className="container">
          <div className="pc-cabeca pc-cabeca-resultados">
            <div>
              <Badge tonalidade="destaque">Plano gerado</Badge>
              <h2>Seu plano de carreira personalizado</h2>
              <p>
                A IA organiza o caminho mais forte para o seu momento, com prioridade, cursos,
                beneficios e habilidades.
              </p>
            </div>
            <div className="pc-resultados-acoes">
              <Link to="/" className="btn-secundario">
                Ver vagas no feed
              </Link>
              <Link to="/mapa" className="btn-secundario">
                Abrir mapa
              </Link>
            </div>
          </div>

          {!plano ? (
            <article className="pc-card pc-estado-vazio">
              <h3>Seu plano vai aparecer aqui</h3>
              <p>
                Responda o questionario acima e clique em <strong>Gerar meu plano</strong> para ver
                cursos, beneficios e o primeiro passo mais inteligente.
              </p>
            </article>
          ) : (
            <div className="pc-resultado-grade">
              <article className="pc-card pc-plano-principal">
                <div className="pc-plano-topo">
                  <div>
                    <Badge tonalidade="sucesso">IA personalizada</Badge>
                    <h3>{plano.titulo}</h3>
                    <p>{plano.resumo}</p>
                  </div>
                  <div className="pc-primeiro-passo">
                    <span>Primeiro passo</span>
                    <strong>{plano.primeiroPasso}</strong>
                  </div>
                </div>

                <div className="pc-trilha">
                  {plano.trilha.map((passoPlano, indice) => (
                    <article key={`${passoPlano.titulo}-${indice}`} className="pc-trilha-item">
                      <span>{indice + 1}</span>
                      <div>
                        <h4>{passoPlano.titulo}</h4>
                        <p>{passoPlano.descricao}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="pc-plano-bloco">
                  <h4>Habilidades que a IA identificou</h4>
                  <div className="pc-skill-cloud">
                    {plano.habilidades.map((skill) => (
                      <span key={skill} className="pc-skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pc-plano-bloco">
                  <h4>Por que este plano?</h4>
                  <p>{plano.justificativa}</p>
                </div>
              </article>

              <div className="pc-coluna-recomendacoes">
                <article className="pc-card">
                  <div className="pc-bloco-titulo">
                    <div>
                      <Badge tonalidade="destaque">Cursos sugeridos</Badge>
                      <h3>O que pode combinar com voce</h3>
                    </div>
                    {carregando && <span className="pc-status-pequeno">Carregando catalogo</span>}
                  </div>
                  <div className="pc-grid-recos">
                    {plano.cursos.map((item) => (
                      <RecomendacaoCard key={`${item.titulo}-curso`} item={item} />
                    ))}
                  </div>
                </article>

                <article className="pc-card">
                  <div className="pc-bloco-titulo">
                    <div>
                      <Badge tonalidade="sucesso">Beneficios e apoio</Badge>
                      <h3>O que pode aliviar sua caminhada</h3>
                    </div>
                  </div>
                  <div className="pc-grid-recos">
                    {plano.beneficios.map((item) => (
                      <RecomendacaoCard key={`${item.titulo}-beneficio`} item={item} />
                    ))}
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
