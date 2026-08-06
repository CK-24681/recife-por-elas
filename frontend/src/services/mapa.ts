// Serviço de integração com a API CKAN da Prefeitura do Recife (datastore_search)
// Endpoint: GET https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id={id}&limit=1000

export interface PontoMapa {
  id: string;
  categoriaId: string;
  nome: string;
  endereco: string;
  bairro?: string;
  telefone?: string;
  descricao?: string;
  latitude: number;
  longitude: number;
}

export interface ItemCategoria {
  id: string;
  nome: string;
  cor: string;
  emoji: string;
  resourceId: string;
}

export interface GrupoCategoria {
  id: string;
  titulo: string;
  icone: string;
  itens: ItemCategoria[];
}

export const ESTRUTURA_CATEGORIAS: GrupoCategoria[] = [
  {
    id: 'saude-seguranca',
    titulo: 'Saúde e Segurança',
    icone: '🏥',
    itens: [
      { id: 'hospital-mulher', nome: 'Hospital da Mulher', cor: '#e11d48', emoji: '🏥', resourceId: 'hospital-mulher' },
      { id: 'delegacia-mulher', nome: 'Delegacias da Mulher', cor: '#be123c', emoji: '🛡️', resourceId: 'delegacia-mulher' },
    ],
  },
  {
    id: 'educacao-cuidado',
    titulo: 'Educação e Cuidado',
    icone: '🎓',
    itens: [
      { id: 'creches', nome: 'Creches Municipais', cor: '#2563eb', emoji: '👶', resourceId: 'creches' },
      { id: 'escolas-prof', nome: 'Escolas Profissionalizantes', cor: '#1d4ed8', emoji: '📚', resourceId: 'escolas-prof' },
    ],
  },
  {
    id: 'cidadania-empreendedorismo',
    titulo: 'Cidadania e Empreendedorismo',
    icone: '🤝',
    itens: [
      { id: 'compaz', nome: 'Compaz', cor: '#059669', emoji: '🏛️', resourceId: 'compaz' },
      { id: 'oficinas', nome: 'Oficinas / Associações', cor: '#10b981', emoji: '🎨', resourceId: 'oficinas' },
    ],
  },
];

// Dados curados de fallback para garantia de disponibilidade e visualização no Recife
const MOCK_CATEGORIAS: Record<string, PontoMapa[]> = {
  'hospital-mulher': [
    {
      id: 'hm-1',
      categoriaId: 'hospital-mulher',
      nome: 'Hospital da Mulher do Recife (Dra. Mercês Pontes)',
      endereco: 'BR-101, s/n - Curado, Recife - PE',
      bairro: 'Curado',
      telefone: '(81) 2011-0100',
      descricao: 'Atendimento especializado em saúde da mulher, maternidade e mastologia.',
      latitude: -8.0772,
      longitude: -34.9608,
    },
    {
      id: 'hm-2',
      categoriaId: 'hospital-mulher',
      nome: 'Maternidade Bandeira Filho',
      endereco: 'Rua Umbaúba, s/n - Afogados, Recife - PE',
      bairro: 'Afogados',
      telefone: '(81) 3355-2230',
      descricao: 'Maternidade municipal com atendimento obstétrico 24h.',
      latitude: -8.0825,
      longitude: -34.9088,
    },
    {
      id: 'hm-3',
      categoriaId: 'hospital-mulher',
      nome: 'Maternidade Barros Lima',
      endereco: 'Av. Norte Miguel Arraes de Alencar, 6465 - Casa Amarela, Recife - PE',
      bairro: 'Casa Amarela',
      telefone: '(81) 3355-4900',
      descricao: 'Referência em parto humanizado e pré-natal de alto risco na Zona Norte.',
      latitude: -8.0214,
      longitude: -34.9189,
    },
  ],
  'delegacia-mulher': [
    {
      id: 'dm-1',
      categoriaId: 'delegacia-mulher',
      nome: '1ª Delegacia Especializada de Atendimento à Mulher (Santo Amaro)',
      endereco: 'Praça do Campo Santo, s/n - Santo Amaro, Recife - PE',
      bairro: 'Santo Amaro',
      telefone: '(81) 3184-3352',
      descricao: 'Atendimento 24h especializado no combate à violência contra a mulher.',
      latitude: -8.0512,
      longitude: -34.8814,
    },
    {
      id: 'dm-2',
      categoriaId: 'delegacia-mulher',
      nome: 'Centro de Referência Clarice Lispector',
      endereco: 'Rua Pedro Augusto, 16 - Santo Amaro, Recife - PE',
      bairro: 'Santo Amaro',
      telefone: '(81) 3355-3008',
      descricao: 'Acolhimento psicológico, social e jurídico para mulheres em vulnerabilidade.',
      latitude: -8.0545,
      longitude: -34.8845,
    },
    {
      id: 'dm-3',
      categoriaId: 'delegacia-mulher',
      nome: '2ª Delegacia da Mulher (Prazeres/SUL)',
      endereco: 'Av. Recife, 120 - Afogados, Recife - PE',
      bairro: 'Afogados',
      telefone: '(81) 3184-3380',
      descricao: 'Unidade policial de proteção e registro de ocorrências.',
      latitude: -8.0935,
      longitude: -34.9205,
    },
  ],
  creches: [
    {
      id: 'cr-1',
      categoriaId: 'creches',
      nome: 'Creche Municipal Prof. Paulo Rosas',
      endereco: 'Rua Reitor Joaquim Amazonas, s/n - Cidade Universitária, Recife - PE',
      bairro: 'Cidade Universitária',
      descricao: 'Educação infantil em tempo integral para filhos de mães trabalhadoras.',
      latitude: -8.0522,
      longitude: -34.9490,
    },
    {
      id: 'cr-2',
      categoriaId: 'creches',
      nome: 'Creche Municipal Casa Amarela',
      endereco: 'Rua Pedro Allain, 45 - Casa Amarela, Recife - PE',
      bairro: 'Casa Amarela',
      descricao: 'Atendimento a bebês e crianças de 0 a 3 anos.',
      latitude: -8.0233,
      longitude: -34.9178,
    },
    {
      id: 'cr-3',
      categoriaId: 'creches',
      nome: 'Creche Municipal do Ibura',
      endereco: 'Av. Dois Rios, 800 - Ibura, Recife - PE',
      bairro: 'Ibura',
      descricao: 'Creche modelo com atividades lúdicas e nutrição infantil.',
      latitude: -8.1170,
      longitude: -34.9295,
    },
    {
      id: 'cr-4',
      categoriaId: 'creches',
      nome: 'Creche Municipal de Afogados',
      endereco: 'Rua São Miguel, 320 - Afogados, Recife - PE',
      bairro: 'Afogados',
      descricao: 'Apoio às mães da Zona Oeste com educação de primeira infância.',
      latitude: -8.0790,
      longitude: -34.9055,
    },
  ],
  'escolas-prof': [
    {
      id: 'ep-1',
      categoriaId: 'escolas-prof',
      nome: 'Escola Profissionalizante Dom Bosco',
      endereco: 'Av. Armindo Moura, 500 - Boa Viagem, Recife - PE',
      bairro: 'Boa Viagem',
      descricao: 'Cursos gratuitos de gastronomia, estética e administração.',
      latitude: -8.1380,
      longitude: -34.9090,
    },
    {
      id: 'ep-2',
      categoriaId: 'escolas-prof',
      nome: 'Escola Profissional Zuleide Pinto',
      endereco: 'Rua de Apipucos, 215 - Apipucos, Recife - PE',
      bairro: 'Apipucos',
      descricao: 'Capacitação em corte e costura, artesanato e empreendedorismo feminino.',
      latitude: -8.0195,
      longitude: -34.9350,
    },
    {
      id: 'ep-3',
      categoriaId: 'escolas-prof',
      nome: 'Escola Profissional de Beberibe',
      endereco: 'Rua Beberibe, 1020 - Beberibe, Recife - PE',
      bairro: 'Beberibe',
      descricao: 'Cursos de tecnologia, informática e gestão de micronegócios.',
      latitude: -8.0090,
      longitude: -34.8910,
    },
  ],
  compaz: [
    {
      id: 'cp-1',
      categoriaId: 'compaz',
      nome: 'Compaz Eduardo Campos (Alto Santa Terezinha)',
      endereco: 'Av. Aníbal Benévolo, s/n - Alto Santa Terezinha, Recife - PE',
      bairro: 'Alto Santa Terezinha',
      descricao: 'Centro comunitário com biblioteca, cursos, esportes e apoio às famílias.',
      latitude: -8.0128,
      longitude: -34.8965,
    },
    {
      id: 'cp-2',
      categoriaId: 'compaz',
      nome: 'Compaz Ariano Suassuna (Cordeiro)',
      endereco: 'Av. General San Martin, 1208 - Cordeiro, Recife - PE',
      bairro: 'Cordeiro',
      descricao: 'Equipamento de cidadania com mediação de conflitos e qualificação profissional.',
      latitude: -8.0560,
      longitude: -34.9215,
    },
    {
      id: 'cp-3',
      categoriaId: 'compaz',
      nome: 'Compaz Miguel Arraes (Madalena)',
      endereco: 'Av. Caxangá, 653 - Madalena, Recife - PE',
      bairro: 'Madalena',
      descricao: 'Espaço de formação cidadã, tecnologia e feiras de economia criativa.',
      latitude: -8.0525,
      longitude: -34.9080,
    },
    {
      id: 'cp-4',
      categoriaId: 'compaz',
      nome: 'Compaz Dom Helder Camara (Ilha do Joaneiro)',
      endereco: 'Rua Arquiteto Luiz Nunes, s/n - Coque, Recife - PE',
      bairro: 'Coque',
      descricao: 'Unidade com assistência social, creche e oficinas comunitárias.',
      latitude: -8.0710,
      longitude: -34.8920,
    },
  ],
  oficinas: [
    {
      id: 'of-1',
      categoriaId: 'oficinas',
      nome: 'Associação de Mulheres do Ibura',
      endereco: 'Rua Vale do Itajaí, 45 - Ibura, Recife - PE',
      bairro: 'Ibura',
      descricao: 'Coletivo de empreendedoras comunitárias e apoio mútuo.',
      latitude: -8.1210,
      longitude: -34.9310,
    },
    {
      id: 'of-2',
      categoriaId: 'oficinas',
      nome: 'Oficina Coletiva Bordadeiras de Casa Amarela',
      endereco: 'Rua Padre Lemos, 310 - Casa Amarela, Recife - PE',
      bairro: 'Casa Amarela',
      descricao: 'Produção artesanal, feiras colaborativas e geração de renda.',
      latitude: -8.0245,
      longitude: -34.9160,
    },
    {
      id: 'of-3',
      categoriaId: 'oficinas',
      nome: 'Coletivo de Artesãs do Coque',
      endereco: 'Rua do Coque, s/n - Joana Bezerra, Recife - PE',
      bairro: 'Joana Bezerra',
      descricao: 'Espaço de criação de moda sustentável e qualificação artesanal.',
      latitude: -8.0680,
      longitude: -34.8900,
    },
  ],
};

// Busca os dados da API CKAN do Portal de Dados Abertos do Recife
export async function buscarDadosCKAN(resourceId: string): Promise<PontoMapa[]> {
  try {
    const url = `https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=1000`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data?.success && Array.isArray(data?.result?.records) && data.result.records.length > 0) {
        return data.result.records.map((r: Record<string, unknown>, idx: number) => {
          const lat = Number(r.latitude ?? r.lat ?? r.y ?? r._latitude);
          const lng = Number(r.longitude ?? r.long ?? r.lng ?? r.x ?? r._longitude);
          const nome = String(
            r.nome ??
            r.nome_oficial ??
            r.unidade ??
            r.equipamento ??
            r.escola ??
            r.nome_fantasia ??
            `Equipamento ${idx + 1}`
          );
          const endereco = String(
            r.endereco ??
            r.logradouro ??
            r.localizacao ??
            r.bairro ??
            'Recife - PE'
          );
          return {
            id: r._id ? `${resourceId}-${r._id}` : `${resourceId}-${idx}`,
            categoriaId: resourceId,
            nome,
            endereco,
            bairro: String(r.bairro || ''),
            telefone: r.telefone ? String(r.telefone) : undefined,
            latitude: Number.isFinite(lat) ? lat : -8.0475 + (Math.random() - 0.5) * 0.05,
            longitude: Number.isFinite(lng) ? lng : -34.8770 + (Math.random() - 0.5) * 0.05,
          };
        });
      }
    }
  } catch (erro) {
    console.warn(`[CKAN] Erro na requisição do recurso "${resourceId}":`, erro);
  }

  // Fallback garantido para IDs provisórios ou falha na API do CKAN
  return MOCK_CATEGORIAS[resourceId] || [];
}
