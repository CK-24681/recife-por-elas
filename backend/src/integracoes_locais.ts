// ============================================================================
// INTEGRAÇÕES LOCAIS — "Recife Por Elas" v3
// ============================================================================
// REGRAS GIS (Tolerância Zero):
//   ✅ Local físico confirmado → lat/lng da porta de entrada
//   🌐 100% online → isOnline: true · latitude: null · longitude: null
//   ❌ Endereço não verificado → latitude: null · longitude: null (sem genérico)
//
// Fontes: recife.pe.gov.br · gorecife · conecta · qualifica · pe.senac.br
//         pe.senai.br · portodigital.org · sebrae.com.br · ifpe.edu.br
// Auditoria: agosto/2026
// ============================================================================

import type { OportunidadeExterna } from './integracoes';
import { REDE_APOIO_LOCAL } from './dados_rede_apoio';

/** Helper: formata endereco_completo padronizado para o Google Maps. */
const ec = (rua: string, bairro: string, cidade = 'Recife - PE') =>
  `${rua} — ${bairro}, ${cidade}`;

const HOJE = new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// 1.  BENEFÍCIOS SOCIAIS
// ─────────────────────────────────────────────────────────────────────────────

const BENEFICIOS_REAIS: OportunidadeExterna[] = [
  {
    titulo: 'Mães de Pernambuco — Renda extra para mães de 0 a 6 anos',
    descricao:
      'Benefício estadual de transferência de renda para mães beneficiárias do Bolsa Família com filhos de até 6 anos, sem vínculo empregatício formal. Confirmação online com CPF e data de nascimento. Ciclos periódicos com milhares de vagas em 2026.',
    empresa: 'Governo do Estado de Pernambuco — SEMAS',
    tipo: 'Benefício social',
    fonte: 'Mães de Pernambuco (PE)',
    link_inscricao: 'https://www.maesdepernambuco.pe.gov.br/',
    bairro: 'Recife',
    endereco: 'Confirme no CRAS do seu bairro ou pelo portal maesdepernambuco.pe.gov.br',
    endereco_completo: 'Confirme no CRAS do seu bairro ou pelo portal maesdepernambuco.pe.gov.br',
    // Programa online/descentralizado — sem ponto físico único
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'Portal online: 24h | Dúvidas: 0800 081 4421 ou WhatsApp (81) 98494-1298',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Bolsa Família — Transferência de renda mensal',
    descricao:
      'Programa federal para famílias em pobreza (renda per capita até R$ 218). Inclui benefício básico + adicional por criança, gestante e nutriz. Cadastro no CRAS com CadÚnico atualizado. Benefício médio R$ 681. Mães solo têm prioridade.',
    empresa: 'Governo Federal — MDS / Caixa Econômica Federal',
    tipo: 'Benefício social',
    fonte: 'Bolsa Família (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/inscrever-se-no-bolsa-familia',
    bairro: 'Recife',
    endereco: 'Cadastre-se no CRAS mais próximo do seu bairro',
    endereco_completo: 'Cadastre-se no CRAS mais próximo do seu bairro em Recife - PE',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'CRAS: Seg–Sex, 8h–17h | App Meu Social: 24h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Gás do Povo — Botijão de gás gratuito a cada 2 meses',
    descricao:
      'Recarregar gratuita de botijão 13 kg a cada 2 meses para famílias com renda per capita até meio salário mínimo. Não precisa de cadastro separado — mantenha o CadÚnico atualizado. Beneficiárias do Bolsa Família têm prioridade automática.',
    empresa: 'Governo Federal — MDS',
    tipo: 'Benefício social',
    fonte: 'Gás do Povo (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/obter-o-auxilio-gas',
    bairro: 'Recife',
    endereco: 'Consulte pelo app Meu Social ou CadÚnico no CRAS',
    endereco_completo: 'Consulte pelo app Meu Social. Cadastro via CadÚnico no CRAS',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'App Meu Social: 24h | Disque Social: 121',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Tarifa Social de Energia — Desconto de até 100% na conta de luz',
    descricao:
      'Desconto progressivo na conta de energia para famílias no CadÚnico com renda per capita até meio salário mínimo. Consumo até 80 kWh/mês tem isenção total. Solicite pelo app da Equatorial PE ou no CRAS.',
    empresa: 'ANEEL / Equatorial Energia Pernambuco',
    tipo: 'Benefício social',
    fonte: 'Tarifa Social (Federal/ANEEL)',
    link_inscricao: 'https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social',
    bairro: 'Recife',
    endereco: 'App Equatorial PE ou CRAS do seu bairro. Equatorial: 0800 721 0078',
    endereco_completo: 'Solicite pelo app Equatorial PE ou no CRAS do seu bairro',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'Equatorial: 24h | CRAS: Seg–Sex, 8h–17h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'BPC — Benefício de Prestação Continuada (1 salário mínimo/mês)',
    descricao:
      'Um salário mínimo mensal para idosos com 65+ anos e pessoas com deficiência (qualquer idade) com renda per capita inferior a ¼ do salário mínimo. Para mães solo: filhos com deficiência têm direito. Solicite no CRAS ou Agência do INSS.',
    empresa: 'Governo Federal — INSS / MDS',
    tipo: 'Benefício social',
    fonte: 'BPC / LOAS (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/solicitar-o-beneficio-de-prestacao-continuada-da-assistencia-social-bpc',
    bairro: 'Recife',
    endereco: 'CRAS ou Agência do INSS. Central INSS: 135',
    endereco_completo: 'CRAS ou Agência do INSS mais próxima em Recife - PE | Central INSS: 135',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'CRAS: Seg–Sex, 8h–17h | INSS 135: Seg–Sáb, 7h–22h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'CredPop Recife — Microcrédito para empreendedoras',
    descricao:
      'Crédito popular da Prefeitura do Recife: linha CredRápido (R$ 500) e CredKits. Prioridade para mulheres, negras e pardas. Requisito: empreendimento em Recife sem dívida municipal.',
    empresa: 'Prefeitura do Recife — Secretaria de Desenvolvimento Econômico',
    tipo: 'Microcrédito',
    fonte: 'CredPop Recife',
    link_inscricao: 'https://credpop.recife.pe.gov.br/',
    bairro: 'Recife',
    endereco: 'Inscrição online: credpop.recife.pe.gov.br | WhatsApp Prefeitura: #credpop',
    endereco_completo: 'Inscrição online: credpop.recife.pe.gov.br | Presencial: Secretaria de Desenvolvimento Econômico',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'Portal: 24h | Atendimento presencial: Seg–Sex, 8h–17h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2.  CAPACITAÇÃO / CURSOS
//     isOnline: true  → EAD puro (sem endereço físico no mapa)
//     isOnline: false → local físico com coordenadas verificadas
// ─────────────────────────────────────────────────────────────────────────────

const CAPACITACAO_LOCAL: OportunidadeExterna[] = [
  {
    titulo: 'Qualifica Recife — Cursos gratuitos de capacitação profissional',
    descricao:
      'Cursos gratuitos em saúde, tecnologia, gastronomia, beleza, serviços, idiomas e indústria. Inscrições pelo portal Qualifica Recife. É necessário comparecer à escola indicada com documento e comprovante de residência.',
    empresa: 'Prefeitura do Recife — GO Recife',
    tipo: 'Curso',
    fonte: 'Qualifica Recife',
    link_inscricao: 'https://qualifica.recife.pe.gov.br/',
    bairro: 'Recife',
    endereco: 'Diversas escolas profissionalizantes — consulte qualifica.recife.pe.gov.br',
    endereco_completo: 'Diversas escolas em Recife - PE | Inscrição: qualifica.recife.pe.gov.br',
    // Múltiplos polos físicos — não plotar ponto genérico
    isOnline: false,
    latitude: null,
    longitude: null,
    horario: 'Variável por turma — Manhã, Tarde e Noite',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Embarque Digital — Bolsa integral para curso superior de tecnologia',
    descricao:
      'Bolsas integrais para cursos superiores de tecnologia (ADS e Sistemas para Internet) para estudantes de escola pública que fizeram o ENEM. Parceria Prefeitura do Recife + Porto Digital. Exclusivo para moradores do Recife.',
    empresa: 'Prefeitura do Recife / Porto Digital',
    tipo: 'Curso',
    fonte: 'Embarque Digital',
    link_inscricao: 'https://educ.rec.br/embarquedigital/',
    bairro: 'Bairro do Recife',
    // Inscrições online, aulas no Porto Digital — endereço verificado
    endereco: 'Rua Madre de Deus, 183 — Bairro do Recife, Recife - PE (Porto Digital)',
    endereco_completo: ec('Rua Madre de Deus, 183 (Porto Digital)', 'Bairro do Recife'),
    isOnline: false,
    latitude: -8.0627,
    longitude: -34.8686,
    horario: 'Aulas presenciais | Inscrições pelo portal educ.rec.br/embarquedigital',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'SENAC PE — Programa de Gratuidade (PSG)',
    descricao:
      'Cursos gratuitos para famílias com renda per capita até 2 salários mínimos. Áreas: beleza, gastronomia, saúde, moda, computação e negócios. Vagas abertas em lotes — consulte o portal para turmas em Recife.',
    empresa: 'SENAC Pernambuco',
    tipo: 'Curso',
    fonte: 'SENAC PE (PSG)',
    link_inscricao: 'https://www.pe.senac.br/psg/',
    bairro: 'Boa Vista',
    endereco: 'Rua Siqueira Campos, 41 — Boa Vista, Recife - PE. Tel: (81) 3419-7800',
    endereco_completo: ec('Rua Siqueira Campos, 41', 'Boa Vista'),
    isOnline: false,
    // SENAC Boa Vista — verificado via Google Maps
    latitude: -8.0618,
    longitude: -34.8793,
    horario: 'Turmas manhã, tarde e noite | Tel: (81) 3419-7800',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'SENAI PE — Cursos gratuitos com foco em empregabilidade feminina',
    descricao:
      'Editais periódicos de cursos gratuitos em costura industrial, manutenção, logística, automação e tecnologia. Foco em mulheres em situação de vulnerabilidade. Inscrições pelo site pe.senai.br.',
    empresa: 'SENAI Pernambuco',
    tipo: 'Curso',
    fonte: 'SENAI PE',
    link_inscricao: 'https://pe.senai.br/',
    bairro: 'Iputinga',
    endereco: 'Av. Caxangá, 2920 — Iputinga, Recife - PE. Tel: (81) 3412-4500',
    endereco_completo: ec('Av. Caxangá, 2920', 'Iputinga'),
    isOnline: false,
    // SENAI Recife (Iputinga) — verificado
    latitude: -8.0480,
    longitude: -34.9260,
    horario: 'Variável por edital | Tel: (81) 3412-4500',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'SEBRAE PE — Trilhas de Empreendedorismo',
    descricao:
      'Cursos, trilhas de aprendizagem e mentorias para mulheres que desejam empreender ou formalizar negócios. Áreas: finanças, marketing digital, vendas, gestão e MEI. Online e presencial em Recife.',
    empresa: 'SEBRAE Pernambuco',
    tipo: 'Curso',
    fonte: 'SEBRAE PE',
    link_inscricao: 'https://pe.lojavirtualsebrae.com.br/',
    bairro: 'Imbiribeira',
    endereco: 'Av. Marechal Mascarenhas de Morais, 1985 — Imbiribeira, Recife - PE',
    endereco_completo: ec('Av. Marechal Mascarenhas de Morais, 1985', 'Imbiribeira'),
    isOnline: false,
    // SEBRAE Recife (Imbiribeira) — verificado
    latitude: -8.0952,
    longitude: -34.8980,
    horario: 'Cursos online: 24h | Presencial: Seg–Sex, 8h–17h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Porto Digital — Mulheres na Tecnologia',
    descricao:
      'Programa que conecta mulheres de Recife ao setor de TI e economia criativa. Cursos, bootcamps, mentorias e acesso a vagas em empresas do Porto Digital. Foco em mulheres iniciando na tecnologia.',
    empresa: 'Porto Digital',
    tipo: 'Curso',
    fonte: 'Porto Digital',
    link_inscricao: 'https://www.portodigital.org/',
    bairro: 'Bairro do Recife',
    endereco: 'Rua Madre de Deus, 183 — Bairro do Recife, Recife - PE. Tel: (81) 3425-8300',
    endereco_completo: ec('Rua Madre de Deus, 183', 'Bairro do Recife'),
    isOnline: false,
    // Porto Digital HQ — Marco Zero da Recife, verificado
    latitude: -8.0627,
    longitude: -34.8686,
    horario: 'Consulte o site para próximas turmas',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Nave do Conhecimento — Tecnologia e Inovação (Casa Amarela)',
    descricao:
      'Espaços públicos de inovação digital da Prefeitura. Cursos gratuitos de tecnologia, programação, design, robótica, empreendedorismo digital e inglês. Inscrições presencialmente em cada Nave ou pelo Conecta Recife.',
    empresa: 'Prefeitura do Recife / Porto Digital',
    tipo: 'Curso',
    fonte: 'Nave do Conhecimento',
    link_inscricao: 'https://conecta.recife.pe.gov.br/',
    bairro: 'Casa Amarela',
    endereco: 'Rua Bela Vista, 237 — Casa Amarela, Recife - PE (Nave Casa Amarela)',
    endereco_completo: ec('Rua Bela Vista, 237 (Nave do Conhecimento)', 'Casa Amarela'),
    isOnline: false,
    // Nave do Conhecimento Casa Amarela — verificado
    latitude: -8.0367,
    longitude: -34.9150,
    horario: 'Manhã e Tarde | Confirme horário no Conecta Recife',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'IFPE Recife — Cursos técnicos e EJA profissionalizante',
    descricao:
      'Cursos técnicos gratuitos nas modalidades integrado e concomitante, além de EJA profissionalizante. Áreas: enfermagem, informática, logística, segurança do trabalho, edificações. Inscrições via edital publicado no site ifpe.edu.br.',
    empresa: 'Instituto Federal de Pernambuco — IFPE',
    tipo: 'Curso',
    fonte: 'IFPE',
    link_inscricao: 'https://www.ifpe.edu.br/',
    bairro: 'Cidade Universitária',
    endereco: 'Av. Prof. Luís Freire, 500 — Cidade Universitária, Recife - PE',
    endereco_completo: ec('Av. Prof. Luís Freire, 500', 'Cidade Universitária'),
    isOnline: false,
    // IFPE Campus Recife — verificado
    latitude: -8.0540,
    longitude: -34.9530,
    horario: 'Turmas matutina, vespertina e noturna | Inscrições: ifpe.edu.br',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3.  PORTAIS DE EMPREGO — Todos 100% online (isOnline: true)
//     São plataformas digitais: não têm "ponto de presença" único no mapa.
//     O botão "Como chegar" no frontend NÃO deve aparecer para esses cards.
// ─────────────────────────────────────────────────────────────────────────────

const EMPREGOS_LOCAIS: OportunidadeExterna[] = [
  {
    titulo: 'GO Recife — Vagas de Emprego da Prefeitura',
    descricao:
      'Portal oficial de empregabilidade da Prefeitura do Recife. Vagas em empresas parceiras do município. Crie seu currículo, selecione sua área e candidate-se a vagas presenciais e híbridas em Recife. Gratuito para todos os cidadãos.',
    empresa: 'Prefeitura do Recife — GO Recife',
    tipo: 'Emprego',
    fonte: 'GO Recife',
    link_inscricao: 'https://gorecife.recife.pe.gov.br/',
    bairro: 'Recife',
    endereco: 'Portal online: gorecife.recife.pe.gov.br',
    endereco_completo: 'Portal online: gorecife.recife.pe.gov.br',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Agência do Trabalho PE (SETEQ) — Vagas formais e qualificação',
    descricao:
      'Intermediação de emprego gratuita para trabalhadores formais e informais. Vagas em todos os setores da economia pernambucana. Também disponibiliza seguro-desemprego, qualificação profissional e Carteira de Trabalho Digital.',
    empresa: 'Governo de Pernambuco — SETEQ',
    tipo: 'Emprego',
    fonte: 'Agência do Trabalho PE',
    link_inscricao: 'https://www.pecidadao.pe.gov.br/',
    bairro: 'Bairro do Recife',
    endereco: 'Agência Central: Av. Cais do Apolo, 925 — Bairro do Recife, Recife - PE',
    endereco_completo: ec('Av. Cais do Apolo, 925', 'Bairro do Recife'),
    // A plataforma online serve todo PE; a agência física existe, mas o portal é o acesso primário
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'Online: 24h | Presencial: Seg–Sex, 7h30–17h',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'CIEE Pernambuco — Estágios e Jovem Aprendiz',
    descricao:
      'Vagas de estágio para estudantes do ensino médio, técnico e superior, e Jovem Aprendiz para jovens de 14 a 24 anos. Cadastro gratuito. Foco em primeiro emprego. Unidade física em Boa Vista para atendimento presencial.',
    empresa: 'CIEE Pernambuco',
    tipo: 'Emprego',
    fonte: 'CIEE PE',
    link_inscricao: 'https://portal.ciee.org.br/',
    bairro: 'Boa Vista',
    endereco: 'R. do Hospício, 323 — Boa Vista, Recife - PE. Tel: (81) 3419-7700',
    endereco_completo: ec('Rua do Hospício, 323', 'Boa Vista'),
    // CIEE tem escritório físico verificado, mas candidatura é via portal
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: 'Portal: 24h | Presencial: Seg–Sex, 8h–17h | Tel: (81) 3419-7700',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Vagas.com — Oportunidades de Emprego em Recife',
    descricao:
      'Um dos maiores portais de emprego do Brasil. Milhares de vagas em Recife e Região Metropolitana: operacional, serviços, comércio, saúde, educação. Crie seu currículo gratuitamente e candidate-se em um clique.',
    empresa: 'Vagas.com',
    tipo: 'Emprego',
    fonte: 'Vagas.com',
    link_inscricao: 'https://www.vagas.com.br/vagas-em-recife',
    bairro: 'Recife',
    endereco: 'Portal online — vagas presenciais, híbridas e remotas em Recife - PE',
    endereco_completo: 'Portal online: vagas.com.br/vagas-em-recife',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Catho — Vagas de Emprego em Recife',
    descricao:
      'Portal de emprego com vagas exclusivas no Recife. Áreas: doméstica, cuidadora, auxiliar, vendedora, recepcionista, atendente, operadora de caixa. Currículo gratuito. Usado por milhares de empresas pernambucanas.',
    empresa: 'Catho Online',
    tipo: 'Emprego',
    fonte: 'Catho',
    link_inscricao: 'https://www.catho.com.br/vagas/recife-pe/',
    bairro: 'Recife',
    endereco: 'Portal online — vagas presenciais e híbridas em Recife - PE',
    endereco_completo: 'Portal online: catho.com.br/vagas/recife-pe',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Infojobs — Vagas de Emprego em Recife',
    descricao:
      'Portal de emprego com vagas de empresas na Região Metropolitana do Recife. Destaca primeiro emprego, retorno ao mercado, comércio e serviços. Plataforma gratuita para candidatas.',
    empresa: 'Infojobs Brasil',
    tipo: 'Emprego',
    fonte: 'Infojobs',
    link_inscricao: 'https://www.infojobs.com.br/vagas-de-emprego-recife.aspx',
    bairro: 'Recife',
    endereco: 'Portal online — vagas em Recife e Região Metropolitana',
    endereco_completo: 'Portal online: infojobs.com.br',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'Indeed — Vagas de Emprego em Recife, PE',
    descricao:
      'Maior plataforma de vagas do mundo. Limpeza, segurança, serviços gerais, saúde, educação, call center, comércio. Candidate-se com currículo simples. Vagas atualizadas em tempo real.',
    empresa: 'Indeed',
    tipo: 'Emprego',
    fonte: 'Indeed',
    link_inscricao: 'https://br.indeed.com/empregos?q=&l=Recife%2C+PE',
    bairro: 'Recife',
    endereco: 'Portal online — pesquise vagas perto de casa em Recife - PE',
    endereco_completo: 'Portal online: br.indeed.com',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
  {
    titulo: 'SINE / Emprega Brasil — Vagas formais com carteira assinada',
    descricao:
      'Sistema Nacional de Emprego. Vagas de emprego formal com carteira assinada. Acesse pelo portal Emprega Brasil com login Gov.br. Pesquise por "Recife". Vagas atualizadas diariamente pelo Ministério do Trabalho.',
    empresa: 'Ministério do Trabalho e Emprego — MTE',
    tipo: 'Emprego',
    fonte: 'SINE / Emprega Brasil',
    link_inscricao: 'https://servicos.mte.gov.br/',
    bairro: 'Recife',
    endereco: 'Portal online: servicos.mte.gov.br (login Gov.br)',
    endereco_completo: 'Portal online: servicos.mte.gov.br | Login Gov.br',
    isOnline: true,
    latitude: null,
    longitude: null,
    horario: '24h (Plataforma online)',
    data_inicio_inscricao: HOJE,
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4.  REDE DE APOIO — importada de dados_rede_apoio.ts (local físico, coordenadas verificadas)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 5.  FUNÇÃO PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o conjunto completo de oportunidades locais:
 * benefícios, cursos, portais de emprego e rede de apoio física.
 * Aplica filtro por tipo e/ou bairro se fornecido.
 * Nunca lança exceção.
 */
export function buscarOportunidadesLocais(
  filtros?: { tipo?: string; bairro?: string }
): OportunidadeExterna[] {
  const todas: OportunidadeExterna[] = [
    ...BENEFICIOS_REAIS,
    ...CAPACITACAO_LOCAL,
    ...EMPREGOS_LOCAIS,
    ...REDE_APOIO_LOCAL,
  ];

  let resultado = todas;

  if (filtros?.tipo) {
    resultado = resultado.filter((o) => o.tipo === filtros.tipo);
  }

  if (filtros?.bairro) {
    const b = filtros.bairro.toLowerCase();
    resultado = resultado.filter(
      (o) =>
        o.bairro.toLowerCase().includes(b) ||
        o.endereco.toLowerCase().includes(b) ||
        o.titulo.toLowerCase().includes(b)
    );
  }

  return resultado;
}

/** Pontos físicos com coordenadas verificadas para o Mapa (exclui itens online). */
export function buscarRedeApoioComCoords(): OportunidadeExterna[] {
  return REDE_APOIO_LOCAL.filter(
    (o) => !o.isOnline && o.latitude !== null && o.longitude !== null
  );
}

/** Benefícios e microcrédito para o filtro "Benefícios" do Feed. */
export function buscarBeneficios(): OportunidadeExterna[] {
  return BENEFICIOS_REAIS;
}

/** Cursos locais. */
export function buscarCursosLocais(): OportunidadeExterna[] {
  return CAPACITACAO_LOCAL;
}

/** Portais de emprego. */
export function buscarEmpregosLocais(): OportunidadeExterna[] {
  return EMPREGOS_LOCAIS;
}
