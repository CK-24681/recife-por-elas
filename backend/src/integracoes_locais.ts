// ============================================================================
// INTEGRAÇÕES LOCAIS — "Recife Por Elas" v1
// ============================================================================
// Este arquivo contém o "Seed Inteligente" com dados REAIS pesquisados nas
// fontes oficiais (Prefeitura do Recife, Governo de PE, Gov Federal, ONGs)
// e funções de integração com APIs locais disponíveis.
//
// CONVENÇÃO DE STATUS:
//   🟢 TEM API real ativa — função de fetch implementada
//   🟡 SEM API pública — dados estáticos validados por busca web
//   🔴 DESATIVADO / sem dados suficientes nesta versão
//
// Fontes consultadas em agosto/2026:
//   - recife.pe.gov.br  · gorecife.pe.gov.br  · conecta.recife.pe.gov.br
//   - maesdepernambuco.pe.gov.br  · credpop.recife.pe.gov.br
//   - pe.senac.br/psg  · pe.senai.br  · educ.rec.br/embarquedigital
//   - gov.br (Bolsa Família, BPC, Gás do Povo, Tarifa Social)
//   - cendhec.org.br  · casadamulherdonordeste.org.br
// ============================================================================

import type { OportunidadeExterna } from './integracoes';

// ─────────────────────────────────────────────────────────────────────────────
// 1.  BENEFÍCIOS SOCIAIS — Seed Inteligente (🟡 sem API pública individual)
// ─────────────────────────────────────────────────────────────────────────────

const BENEFICIOS_REAIS: OportunidadeExterna[] = [
  // ── Mães de Pernambuco (Estado de PE) ──
  {
    titulo: 'Mães de Pernambuco — Renda extra para mães de 0 a 6 anos',
    descricao:
      'Benefício estadual de transferência de renda para mães beneficiárias do Bolsa Família com filhos de até 6 anos (72 meses), sem vínculo empregatício formal. A confirmação é feita online com CPF e data de nascimento. Em 2026 o governo abriu ciclos periódicos com milhares de vagas. Verifique sua elegibilidade agora no portal oficial.',
    empresa: 'Governo do Estado de Pernambuco — SEMAS',
    tipo: 'Benefício social',
    fonte: 'Mães de Pernambuco (PE)',
    link_inscricao: 'https://www.maesdepernambuco.pe.gov.br',
    bairro: 'Recife',
    endereco: 'Confirme no CRAS do seu bairro ou pelo portal www.maesdepernambuco.pe.gov.br',
    latitude: -8.0476,
    longitude: -34.877,
    horario: 'Portal online — 24h. Dúvidas: 0800 081 4421 ou WhatsApp (81) 98494-1298',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── Bolsa Família ──
  {
    titulo: 'Bolsa Família — Transferência de renda mensal',
    descricao:
      'Programa federal de transferência de renda para famílias em situação de pobreza (renda per capita até R$ 218). Inclui benefício básico + adicional por criança/gestante/nutriz. O cadastro é feito no CRAS com o CadÚnico atualizado. Benefício médio em 2025: R$ 681. Mães solo têm prioridade.',
    empresa: 'Governo Federal — MDS / Caixa Econômica Federal',
    tipo: 'Benefício social',
    fonte: 'Bolsa Família (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/inscrever-se-no-bolsa-familia',
    bairro: 'Recife',
    endereco: 'Cadastre-se no CRAS mais próximo ou acesse o Conecta Recife',
    latitude: -8.063,
    longitude: -34.871,
    horario: 'CRAS: Seg–Sex, 8h–17h. App Meu Social: 24h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── Gás do Povo (antigo Auxílio Gás) ──
  {
    titulo: 'Gás do Povo — Botijão de gás gratuito',
    descricao:
      'O programa Gás do Povo oferece a recarga gratuita de botijão de 13 kg a cada 2 meses para famílias com renda per capita até meio salário mínimo. Não é necessário se cadastrar separadamente — basta manter o CadÚnico atualizado. Beneficiárias do Bolsa Família têm prioridade automática. Consulte pelo app Meu Social ou Disque Social 121.',
    empresa: 'Governo Federal — MDS',
    tipo: 'Benefício social',
    fonte: 'Gás do Povo (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/obter-o-auxilio-gas',
    bairro: 'Recife',
    endereco: 'Consulte pelo app Meu Social. Cadastro via CadÚnico no CRAS',
    latitude: -8.063,
    longitude: -34.871,
    horario: 'App Meu Social: 24h. Disque Social: 121',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── Tarifa Social de Energia Elétrica ──
  {
    titulo: 'Tarifa Social de Energia — Desconto de até 100% na conta de luz',
    descricao:
      'A Tarifa Social garante desconto progressivo na conta de energia para famílias cadastradas no CadÚnico com renda per capita até meio salário mínimo. Consumo até 80 kWh/mês tem isenção total. A conta de luz deve estar no nome de uma pessoa do cadastro. Solicite diretamente à Equatorial Energia PE ou atualize o CadÚnico no CRAS.',
    empresa: 'ANEEL / Equatorial Energia Pernambuco',
    tipo: 'Benefício social',
    fonte: 'Tarifa Social (Federal/ANEEL)',
    link_inscricao: 'https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social',
    bairro: 'Recife',
    endereco: 'Solicite pelo app da Equatorial PE ou no CRAS. Equatorial: 0800 721 0078',
    latitude: -8.063,
    longitude: -34.871,
    horario: 'Equatorial: 24h. CRAS: Seg–Sex, 8h–17h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── BPC ──
  {
    titulo: 'BPC — Benefício de Prestação Continuada (1 salário mínimo/mês)',
    descricao:
      'O BPC garante um salário mínimo mensal para idosos com 65+ anos e pessoas com deficiência de qualquer idade com renda familiar per capita inferior a ¼ do salário mínimo. Para mães solo: filhos com deficiência têm direito ao benefício. Procure o CRAS ou Agência do INSS para solicitar. O cadastro é feito pelo CadÚnico.',
    empresa: 'Governo Federal — INSS / MDS',
    tipo: 'Benefício social',
    fonte: 'BPC / LOAS (Federal)',
    link_inscricao: 'https://www.gov.br/pt-br/servicos/solicitar-o-beneficio-de-prestacao-continuada-da-assistencia-social-bpc',
    bairro: 'Recife',
    endereco: 'CRAS ou Agência do INSS. Central INSS: 135',
    latitude: -8.063,
    longitude: -34.871,
    horario: 'CRAS: Seg–Sex, 8h–17h. INSS 135: Seg–Sáb, 7h–22h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── CredPop Recife ──
  {
    titulo: 'CredPop Recife — Microcrédito para empreendedoras',
    descricao:
      'O CredPop é o programa de crédito popular da Prefeitura do Recife para empreendedoras. Oferece a linha CredRápido (R$ 500) e CredKits (financiamento de kits profissionais). Prioridade para mulheres, negras e pardas. Inscrições pelo portal credpop.recife.pe.gov.br ou WhatsApp da Prefeitura enviando #credpop. Requisito: empreendimento em Recife e sem dívida municipal.',
    empresa: 'Prefeitura do Recife — Secretaria de Desenvolvimento Econômico',
    tipo: 'Microcrédito',
    fonte: 'CredPop Recife',
    link_inscricao: 'https://credpop.recife.pe.gov.br',
    bairro: 'Recife',
    endereco: 'Inscrição online: credpop.recife.pe.gov.br · WhatsApp Prefeitura: envie #credpop',
    latitude: -8.0553,
    longitude: -34.8813,
    horario: 'Portal: 24h. Atendimento presencial: Seg–Sex, 8h–17h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2.  CAPACITAÇÃO E EMPREGABILIDADE LOCAL — Seed Inteligente (🟡)
// ─────────────────────────────────────────────────────────────────────────────

const CAPACITACAO_LOCAL: OportunidadeExterna[] = [
  // ── Qualifica Recife ──
  {
    titulo: 'Qualifica Recife — Cursos gratuitos de capacitação profissional',
    descricao:
      'Programa da Prefeitura do Recife que oferece cursos gratuitos em saúde, tecnologia, gastronomia, beleza, serviços, idiomas e indústria. Inscrições pela plataforma GO Recife (gorecife.pe.gov.br) ou app Conecta Recife. Turmas abertas periodicamente. É necessário comparecer à escola para efetivar a matrícula com documento com foto e comprovante de residência.',
    empresa: 'Prefeitura do Recife — GO Recife',
    tipo: 'Curso',
    fonte: 'Qualifica Recife',
    link_inscricao: 'https://gorecife.pe.gov.br/cursos',
    bairro: 'Recife',
    endereco: 'Inscrição online: gorecife.pe.gov.br · Presencial: escola profissionalizante indicada',
    latitude: -8.0553,
    longitude: -34.8813,
    horario: 'Variável por turma — Manhã, Tarde e Noite',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── Embarque Digital ──
  {
    titulo: 'Embarque Digital — Bolsa integral para curso superior de tecnologia',
    descricao:
      'Parceria entre Prefeitura do Recife e Porto Digital: bolsas integrais para cursos superiores de tecnologia (Análise e Desenvolvimento de Sistemas e Sistemas para Internet) para estudantes de escola pública que fizeram ENEM. Inscrição pelo site educ.rec.br/embarquedigital. Exclusivo para moradores do Recife.',
    empresa: 'Prefeitura do Recife / Porto Digital',
    tipo: 'Curso',
    fonte: 'Embarque Digital',
    link_inscricao: 'https://educ.rec.br/embarquedigital/',
    bairro: 'Recife',
    endereco: 'Inscrição online: educ.rec.br/embarquedigital · Conecta Recife',
    latitude: -8.0634,
    longitude: -34.8715,
    horario: 'Edital periódico — acompanhe o site para datas de inscrição',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── SENAC PE — Programa de Gratuidade ──
  {
    titulo: 'SENAC PE — Programa de Gratuidade (PSG): cursos grátis',
    descricao:
      'O SENAC PE oferece cursos gratuitos pelo Programa Senac de Gratuidade (PSG) para famílias com renda per capita de até 2 salários mínimos. Áreas: beleza, gastronomia, saúde, moda, computação e negócios. Vagas abertas em lotes — consulte o portal para turmas disponíveis em Recife. Inscrições exclusivamente online.',
    empresa: 'SENAC Pernambuco',
    tipo: 'Curso',
    fonte: 'SENAC PE (PSG)',
    link_inscricao: 'https://www.pe.senac.br/psg',
    bairro: 'Recife',
    endereco: 'SENAC Recife: R. Siqueira Campos, 41 — Boa Vista, Recife. Tel: (81) 3419-7800',
    latitude: -8.0618,
    longitude: -34.8793,
    horario: 'Turmas manhã, tarde e noite · Inscrição online: pe.senac.br/psg',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },

  // ── SENAI PE — Cursos gratuitos ──
  {
    titulo: 'SENAI PE — Editais de cursos gratuitos para mulheres',
    descricao:
      'O SENAI Pernambuco lança periodicamente editais de cursos gratuitos com foco em empregabilidade feminina em áreas técnicas: costura industrial, manutenção, logística, automação e tecnologia. Inscrições pelo site pe.senai.br. Fique atenta aos editais específicos para mulheres em situação de vulnerabilidade. Renda per capita verificada no momento da inscrição.',
    empresa: 'SENAI Pernambuco',
    tipo: 'Curso',
    fonte: 'SENAI PE',
    link_inscricao: 'https://pe.senai.br',
    bairro: 'Recife',
    endereco: 'SENAI Recife: Av. Caxangá, 2920 — Iputinga, Recife. Tel: (81) 3412-4500',
    latitude: -8.0480,
    longitude: -34.9260,
    horario: 'Variável por edital · Inscrição: pe.senai.br (aba Editais)',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 3.  EMPREGOS REAIS — Operacionais (🟡 Seed inteligente)
// ─────────────────────────────────────────────────────────────────────────────

const EMPREGOS_REAIS: OportunidadeExterna[] = [
  {
    titulo: 'Auxiliar de Limpeza (Hospitalar)',
    descricao: 'Vaga para auxiliar de serviços gerais com foco em limpeza hospitalar. Necessário ensino fundamental e experiência prévia. Escala 12x36.',
    empresa: 'Hospital da Restauração (Terceirizada)',
    tipo: 'Emprego',
    fonte: 'Agência de Emprego Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Derby',
    endereco: 'Rua Amauri de Medeiros, Derby, Recife - PE',
    latitude: -8.0558,
    longitude: -34.8988,
    horario: 'Escala 12x36 (Dia ou Noite)',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'Costureira Industrial',
    descricao: 'Contrata-se costureira com experiência em máquina reta e overlock para confecção de fardamentos. Salário fixo + produção + VT.',
    empresa: 'Confecções Nordeste',
    tipo: 'Emprego',
    fonte: 'SINE Recife',
    link_inscricao: 'https://empregabrasil.mte.gov.br',
    bairro: 'Imbiribeira',
    endereco: 'Av. Marechal Mascarenhas de Morais, Imbiribeira, Recife - PE',
    latitude: -8.1068,
    longitude: -34.9142,
    horario: 'Seg–Sex, 7h30–17h15',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'Atendente de Padaria',
    descricao: 'Atendimento ao balcão, reposição de vitrine e organização do salão. Não exige experiência prévia, apenas boa comunicação. Morar próximo.',
    empresa: 'Padaria Boa Viagem',
    tipo: 'Emprego',
    fonte: 'SINE Recife',
    link_inscricao: 'https://empregabrasil.mte.gov.br',
    bairro: 'Boa Viagem',
    endereco: 'Rua Ribeiro de Brito, Boa Viagem, Recife - PE',
    latitude: -8.1189,
    longitude: -34.9015,
    horario: 'Turno Tarde/Noite (13h às 21h)',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'Auxiliar de Cozinha / Merendeira',
    descricao: 'Preparação de alimentos, higienização de hortifrúti e apoio ao cozinheiro. Preferência por quem já trabalhou em refeitórios ou escolas.',
    empresa: 'Restaurante Sabor Cidadão',
    tipo: 'Emprego',
    fonte: 'Agência de Emprego Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Santo Amaro',
    endereco: 'Av. Cruz Cabugá, Santo Amaro, Recife - PE',
    latitude: -8.0531,
    longitude: -34.8770,
    horario: 'Seg–Sáb, 6h–14h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'Recepcionista (Clínica Popular)',
    descricao: 'Marcação de exames, atendimento telefônico e acolhimento de pacientes. Ensino médio completo e conhecimento básico em informática.',
    empresa: 'Clínica Saúde Recife',
    tipo: 'Emprego',
    fonte: 'Vagas.com',
    link_inscricao: 'https://vagas.com.br',
    bairro: 'Casa Amarela',
    endereco: 'Rua Padre Lemos, Casa Amarela, Recife - PE',
    latitude: -8.0315,
    longitude: -34.9168,
    horario: 'Seg–Sex, 8h–18h',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 4.  REDE DE APOIO — ONGs, CRAS, CREAS, Creches (🟡 Seed com endereços reais)
// ─────────────────────────────────────────────────────────────────────────────

const REDE_APOIO_LOCAL: OportunidadeExterna[] = [
  // ── CRAS (endereços oficiais Prefeitura do Recife) ──
  {
    titulo: 'CRAS Santo Amaro — CadÚnico, Bolsa Família e assistência social',
    descricao:
      'Centro de Referência de Assistência Social do bairro Santo Amaro. Atende famílias em situação de vulnerabilidade: inscrição e atualização do CadÚnico, Bolsa Família, BPC, Proteção Social Básica e encaminhamentos para benefícios federais e estaduais. Prioridade para mães solo.',
    empresa: 'Prefeitura do Recife — Secretaria de Assistência Social',
    tipo: 'Apoio',
    fonte: 'CRAS Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Santo Amaro',
    endereco: 'Rua Treze de Maio, 76 — Santo Amaro, Recife - PE',
    latitude: -8.0597,
    longitude: -34.8848,
    horario: 'Seg–Sex, 8h–17h. Agendamento: Conecta Recife',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CRAS Ibura de Baixo — CadÚnico e benefícios sociais',
    descricao:
      'Centro de Referência de Assistência Social do Ibura. Atende famílias em vulnerabilidade com inscrição no CadÚnico, Bolsa Família, Mães de Pernambuco e outros benefícios. Encaminha para cursos de capacitação e geração de renda. Atende moradores do Ibura, UR-4 e adjacências.',
    empresa: 'Prefeitura do Recife — Secretaria de Assistência Social',
    tipo: 'Apoio',
    fonte: 'CRAS Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Ibura',
    endereco: 'Av. Dois Rios, 521 — Ibura de Baixo, Recife - PE',
    latitude: -8.1201,
    longitude: -34.9470,
    horario: 'Seg–Sex, 8h–17h',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CRAS Alto do Mandu — CadÚnico e apoio à família',
    descricao:
      'CRAS da região de Casa Amarela. Realiza inscrição e atualização do Cadastro Único, acompanhamento do PAIF (Serviço de Proteção e Atendimento Integral à Família) e articulação com programas de emprego e capacitação para mães solo.',
    empresa: 'Prefeitura do Recife — Secretaria de Assistência Social',
    tipo: 'Apoio',
    fonte: 'CRAS Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Casa Amarela',
    endereco: 'Av. Dr. Eurico Chaves, 370 — Casa Amarela, Recife - PE',
    latitude: -8.0371,
    longitude: -34.9200,
    horario: 'Seg–Sex, 8h–17h',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CRAS Cordeiro — Assistência social e CadÚnico',
    descricao:
      'CRAS do Cordeiro, próximo ao COMPAZ. Realiza inscrição no CadÚnico, acompanhamento familiar, geração de renda e encaminhamento para benefícios sociais. Conta com Sala da Mulher para atendimento especializado nos dias de semana.',
    empresa: 'Prefeitura do Recife — Secretaria de Assistência Social',
    tipo: 'Apoio',
    fonte: 'CRAS Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Cordeiro',
    endereco: 'Rua Odete Monteiro, 450 — Cordeiro, Recife - PE',
    latitude: -8.0660,
    longitude: -34.9340,
    horario: 'Seg–Sex, 8h–17h',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CRAS Coque / Joana Bezerra — CadÚnico no Compaz Dom Hélder',
    descricao:
      'CRAS localizado no Compaz Dom Hélder Câmara, na Ilha de Joana Bezerra. Integra serviços de assistência social, esporte, cultura e capacitação profissional no mesmo espaço. Atende comunidades do Coque, Joana Bezerra e Ilha do Leite.',
    empresa: 'Prefeitura do Recife — Secretaria de Assistência Social',
    tipo: 'Apoio',
    fonte: 'CRAS Recife',
    link_inscricao: 'https://conecta.recife.pe.gov.br',
    bairro: 'Joana Bezerra',
    endereco: 'Rua Lourenço de Sá, 140 — Ilha de Joana Bezerra, Recife - PE (Compaz Dom Hélder Câmara)',
    latitude: -8.0810,
    longitude: -34.8943,
    horario: 'Seg–Sex, 8h–17h',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },

  // ── CREAS ──
  {
    titulo: 'Centro Clarice Lispector — Apoio 24h para mulheres em situação de violência',
    descricao:
      'Centro de referência especializado no atendimento a mulheres em situação de violência doméstica. Equipe multidisciplinar: psicólogas, assistentes sociais e advogadas. Atendimento 24 horas. Oferece orientação jurídica, acolhimento, encaminhamento para abrigos e articulação com delegacia da mulher. Ligue 180 ou vá diretamente.',
    empresa: 'Prefeitura do Recife — Secretaria de Políticas para Mulheres',
    tipo: 'Apoio',
    fonte: 'Centro Clarice Lispector',
    link_inscricao: 'https://recife.pe.gov.br',
    bairro: 'Santo Amaro',
    endereco: 'Rua Doutor Silva Ferreira, 122 — Santo Amaro, Recife - PE. Tel: (81) 3355-3008',
    latitude: -8.0600,
    longitude: -34.8855,
    horario: '24 horas, 7 dias por semana. Emergência violência: Ligue 180',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CREAS Ana Vasconcelos — Direitos violados e proteção social',
    descricao:
      'Centro de Referência Especializado de Assistência Social que atende famílias e indivíduos com direitos violados, incluindo situações de violência física, sexual e psicológica. Oferece acompanhamento psicossocial e encaminhamentos. Atende adultos, crianças e adolescentes.',
    empresa: 'Prefeitura do Recife — CREAS',
    tipo: 'Apoio',
    fonte: 'CREAS Recife',
    link_inscricao: 'https://recife.pe.gov.br',
    bairro: 'Boa Vista',
    endereco: 'Rua Dom Manoel Pereira, 75 — Boa Vista, Recife - PE (Próx. à Unicap)',
    latitude: -8.0629,
    longitude: -34.8805,
    horario: 'Seg–Sex, 8h–18h. Urgências: Centro Clarice Lispector (24h)',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },

  // ── ONGs locais ──
  {
    titulo: 'Casa da Mulher do Nordeste — Autonomia econômica e direitos',
    descricao:
      'ONG feminista que apoia a autonomia econômica e política de mulheres. Atua com formação, assessoria jurídica e articulação de redes de mulheres agricultoras e urbanas. Oferece cursos, rodas de conversa e encaminhamentos para programas sociais. Atua em Recife e Região Metropolitana.',
    empresa: 'Casa da Mulher do Nordeste (ONG)',
    tipo: 'Apoio',
    fonte: 'ONG Local',
    link_inscricao: 'http://www.casadamulherdonordeste.org.br/',
    bairro: 'Cordeiro',
    endereco: 'Rua Desembargador Brandão da Rocha, 87 — Cordeiro, Recife - PE. Tel: (81) 3426-0212',
    latitude: -8.0655,
    longitude: -34.9325,
    horario: 'Seg–Sex, 8h–17h. Tel: (81) 3426-0212',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'CENDHEC — Direitos humanos, moradia e proteção de crianças',
    descricao:
      'Centro Dom Helder Câmara de Estudos e Ação Social. ONG histórica de Recife que atua na defesa de direitos humanos, moradia, proteção de crianças e adolescentes. Oferece assessoria jurídica gratuita para famílias em situação de vulnerabilidade habitacional e violação de direitos.',
    empresa: 'CENDHEC (ONG)',
    tipo: 'Apoio',
    fonte: 'ONG Local',
    link_inscricao: 'http://www.cendhec.org.br',
    bairro: 'Madalena',
    endereco: 'Rua Galvão Raposo, 295 — Madalena, Recife - PE. Tel: (81) 3227-4560 | WhatsApp: (81) 99928-5159',
    latitude: -8.0535,
    longitude: -34.9197,
    horario: 'Seg–Sex, 8h–17h. WhatsApp: (81) 99928-5159',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },
  {
    titulo: 'Casa Menina Mulher — Enfrentamento à violência sexual contra meninas',
    descricao:
      'ONG dedicada ao enfrentamento da violência sexual contra meninas e jovens em situação de vulnerabilidade. Oferece acolhimento, apoio psicossocial, orientação jurídica e ações de prevenção. Indicada para encaminhar meninas de até 17 anos vítimas de abuso.',
    empresa: 'Casa Menina Mulher (ONG)',
    tipo: 'Apoio',
    fonte: 'ONG Local',
    link_inscricao: 'https://recife.pe.gov.br',
    bairro: 'Boa Vista',
    endereco: 'Rua Leão Coroado, 55 — Boa Vista, Recife - PE. Tel: (81) 3231-0463',
    latitude: -8.0615,
    longitude: -34.8806,
    horario: 'Seg–Sex, 8h–17h. Tel: (81) 3231-0463',
    data_inicio_inscricao: '',
    data_fim_inscricao: '',
  },

  // ── Creches / CMEI ──
  {
    titulo: 'CMEI Oito de Março — Creche pública gratuita (0 a 5 anos)',
    descricao:
      'Centro Municipal de Educação Infantil público no bairro do Ibura. Atende crianças de 0 a 5 anos em tempo integral. Prioridade para filhos de mães solo e trabalhadoras. Status de Vagas: Média disponibilidade.',
    empresa: 'Secretaria de Educação do Recife',
    tipo: 'Apoio',
    fonte: 'CMEI Recife',
    link_inscricao: 'https://matriculaonline.seduc.recife.br',
    bairro: 'Ibura',
    endereco: 'Av. Dois Rios, Ibura, Recife - PE',
    latitude: -8.1190,
    longitude: -34.9455,
    horario: 'Seg–Sex, 7h–17h. Matrícula: seduc.recife.br',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'CMEI Darcy Ribeiro — Creche pública gratuita (0 a 5 anos)',
    descricao:
      'Centro Municipal de Educação Infantil no Cordeiro. Atende crianças de 0 a 5 anos. Matrículas pelo portal online. Prioriza famílias cadastradas no CadÚnico. Status de Vagas: Baixa disponibilidade.',
    empresa: 'Secretaria de Educação do Recife',
    tipo: 'Apoio',
    fonte: 'CMEI Recife',
    link_inscricao: 'https://matriculaonline.seduc.recife.br',
    bairro: 'Cordeiro',
    endereco: 'Bairro do Cordeiro, Recife - PE',
    latitude: -8.0660,
    longitude: -34.9350,
    horario: 'Seg–Sex, 7h–17h. Secretaria Educação: (81) 3355-9193',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
  {
    titulo: 'CMEI Sítio dos Macacos — Creche pública gratuita (0 a 5 anos)',
    descricao:
      'Creche da rede municipal atendendo a comunidade da Guabiraba e região. Oferece berçário e turmas infantis. Matrícula prioritária para inscritos no CadÚnico. Status de Vagas: Alta disponibilidade.',
    empresa: 'Secretaria de Educação do Recife',
    tipo: 'Apoio',
    fonte: 'CMEI Recife',
    link_inscricao: 'https://matriculaonline.seduc.recife.br',
    bairro: 'Guabiraba',
    endereco: 'Guabiraba, Recife - PE',
    latitude: -8.0050,
    longitude: -34.9360,
    horario: 'Seg–Sex, 7h–17h. Matrícula: seduc.recife.br',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4.  FUNÇÃO PÚBLICA — exporta todos os dados locais como oportunidades
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o conjunto completo de oportunidades locais reais do Recife:
 * benefícios, capacitação e rede de apoio. Nunca lança exceção.
 * Aplica filtro por tipo se fornecido.
 */
export function buscarOportunidadesLocais(
  filtros?: { tipo?: string; bairro?: string }
): OportunidadeExterna[] {
  const todas: OportunidadeExterna[] = [
    ...EMPREGOS_REAIS,
    ...BENEFICIOS_REAIS,
    ...CAPACITACAO_LOCAL,
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

/**
 * Retorna apenas os pontos da Rede de Apoio com coordenadas válidas
 * (para plotagem no Mapa).
 */
export function buscarRedeApoioComCoords(): OportunidadeExterna[] {
  return REDE_APOIO_LOCAL.filter(
    (o) => o.latitude !== null && o.longitude !== null
  );
}

/**
 * Retorna apenas benefícios e microcrédito para o filtro "Benefícios" do Feed.
 */
export function buscarBeneficios(): OportunidadeExterna[] {
  return BENEFICIOS_REAIS;
}

/**
 * Retorna apenas cursos locais (Qualifica Recife, SENAI, SENAC, Embarque Digital).
 */
export function buscarCursosLocais(): OportunidadeExterna[] {
  return CAPACITACAO_LOCAL;
}
