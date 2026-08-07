import { useState, useEffect } from 'react';
import { Link } from '../utils/roteador';
import { apiJSON } from '../services/api';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: string;
  link_inscricao?: string;
  bairro?: string;
}

type Nivel = 1 | 2 | 3;

interface Habilidade {
  nome: string;
  tipo: 'soft' | 'hard';
}

interface PassoTrilha {
  nivel: Nivel;
  titulo: string;
  descricao: string;
  habilidades: Habilidade[];
  filtrosTipo: string[];
}

interface Momento {
  id: string;
  icone: string;
  titulo: string;
  descricao: string;
  trilha: PassoTrilha[];
}

const MOMENTOS: Momento[] = [
  {
    id: 'renda_imediata',
    icone: '🚀',
    titulo: 'Preciso de renda imediata',
    descricao: 'Busco alternativas rápidas e flexíveis para gerar dinheiro e estabilizar as contas de casa.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Base de Estabilidade',
        descricao: 'Antes de acelerar, garanta os benefícios sociais básicos e rede de apoio para seus filhos.',
        habilidades: [
          { nome: 'Gestão de Orçamento Básico', tipo: 'hard' },
          { nome: 'Resiliência e Foco', tipo: 'soft' }
        ],
        filtrosTipo: ['benefício', 'apoio']
      },
      {
        nivel: 2,
        titulo: 'Micro-Qualificação Rápida',
        descricao: 'Aprenda uma habilidade prática de curta duração (ex: culinária, beleza, artesanato) que possa ser vendida imediatamente.',
        habilidades: [
          { nome: 'Atendimento ao Cliente', tipo: 'soft' },
          { nome: 'Técnicas de Venda', tipo: 'hard' }
        ],
        filtrosTipo: ['curso', 'oficina', 'microcapacitação']
      },
      {
        nivel: 3,
        titulo: 'Geração de Renda Ativa',
        descricao: 'Comece a oferecer seus serviços no bairro ou internet, usando redes sociais para captar os primeiros clientes.',
        habilidades: [
          { nome: 'Uso de Redes Sociais', tipo: 'hard' },
          { nome: 'Comunicação Clara', tipo: 'soft' }
        ],
        filtrosTipo: ['emprego', 'freelance', 'microcrédito']
      }
    ]
  },
  {
    id: 'formalizacao',
    icone: '📝',
    titulo: 'Quero me formalizar (Autônoma/MEI)',
    descricao: 'Já tenho uma atividade ou quero abrir um pequeno negócio e preciso de segurança jurídica e crédito.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Mapeamento do Negócio',
        descricao: 'Entenda o que você vende, quem é seu cliente e separe o dinheiro da casa do dinheiro do negócio.',
        habilidades: [
          { nome: 'Educação Financeira', tipo: 'hard' },
          { nome: 'Planejamento', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'oficina']
      },
      {
        nivel: 2,
        titulo: 'Formalização MEI',
        descricao: 'Abra seu CNPJ MEI gratuitamente. Isso garante seus direitos previdenciários (auxílio-doença, salário maternidade).',
        habilidades: [
          { nome: 'Navegação em Portais', tipo: 'hard' }
        ],
        filtrosTipo: ['apoio', 'serviço']
      },
      {
        nivel: 3,
        titulo: 'Escala e Microcrédito',
        descricao: 'Com o CNPJ em mãos, acesse linhas de crédito focadas em mulheres e amplie sua produção ou serviços.',
        habilidades: [
          { nome: 'Gestão de Estoque', tipo: 'hard' },
          { nome: 'Negociação', tipo: 'soft' }
        ],
        filtrosTipo: ['microcrédito', 'financiamento']
      }
    ]
  },
  {
    id: 'recolocacao_formal',
    icone: '💼',
    titulo: 'Busco recolocação formal (CLT)',
    descricao: 'Quero estabilidade, carteira assinada e direitos trabalhistas garantidos no fim do mês.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Preparação e Currículo',
        descricao: 'Atualize seus dados, faça um currículo claro focando em suas experiências reais (mesmo as informais).',
        habilidades: [
          { nome: 'Autoconhecimento', tipo: 'soft' },
          { nome: 'Ferramentas de Texto', tipo: 'hard' }
        ],
        filtrosTipo: ['apoio', 'benefício']
      },
      {
        nivel: 2,
        titulo: 'Atualização Profissional',
        descricao: 'Faça cursos técnicos gratuitos (SENAI, SENAC) na sua área para voltar competitiva ao mercado.',
        habilidades: [
          { nome: 'Adaptação', tipo: 'soft' },
          { nome: 'Pacote Office Básico', tipo: 'hard' }
        ],
        filtrosTipo: ['curso', 'técnico']
      },
      {
        nivel: 3,
        titulo: 'Entrevistas e Vagas',
        descricao: 'Aprenda a se portar em entrevistas e acione sua rede de contatos para indicações.',
        habilidades: [
          { nome: 'Comunicação e Oratória', tipo: 'soft' },
          { nome: 'Inteligência Emocional', tipo: 'soft' }
        ],
        filtrosTipo: ['emprego', 'vaga']
      }
    ]
  },
  {
    id: 'migracao_tec',
    icone: '💡',
    titulo: 'Quero mudar de área (Tecnologia)',
    descricao: 'Vejo o mercado digital crescendo e quero me capacitar para vagas administrativas, tecnologia ou serviços modernos.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Letramento Digital Básico',
        descricao: 'Ganhe fluência com computadores, digitação, navegadores e ferramentas de trabalho remoto (Zoom, Drive).',
        habilidades: [
          { nome: 'Informática Básica', tipo: 'hard' },
          { nome: 'Curiosidade', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'oficina']
      },
      {
        nivel: 2,
        titulo: 'Formação Específica',
        descricao: 'Entre em bootcamps ou formações técnicas focadas em Mulheres (ex: Programação, Design, Assistente Virtual).',
        habilidades: [
          { nome: 'Lógica', tipo: 'hard' },
          { nome: 'Gestão de Tempo', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'bootcamp']
      },
      {
        nivel: 3,
        titulo: 'Primeira Oportunidade Júnior',
        descricao: 'Monte um portfólio prático com projetos reais e candidate-se a vagas júnior remotas ou híbridas na RMR.',
        habilidades: [
          { nome: 'Trabalho em Equipe', tipo: 'soft' },
          { nome: 'Metodologias Ágeis', tipo: 'hard' }
        ],
        filtrosTipo: ['emprego', 'estágio', 'vaga']
      }
    ]
  }
];

function normalizar(valor: string): string {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function PlanoCarreira() {
  const [momentoAtivo, setMomentoAtivo] = useState<Momento | null>(null);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>(1);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      try {
        const [internas, externas] = await Promise.all([
          apiJSON<Oportunidade[]>('/oportunidades').catch(() => []),
          apiJSON<Oportunidade[]>('/oportunidades/externas').catch(() => []),
        ]);
        if (ativo) {
          setOportunidades([...internas, ...externas]);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  if (!momentoAtivo) {
    return (
      <main className="container" style={{ paddingBlock: '48px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px' }}>
          <span className="pc-badge-destaque" style={{ display: 'inline-block', marginBottom: '16px' }}>Plano de Carreira Inteligente</span>
          <h1 style={{ fontSize: '32px', color: 'var(--tinta)', marginBottom: '16px' }}>Onde você está hoje?</h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '16px', lineHeight: 1.6 }}>
            Sabemos que o tempo é curto e os desafios são reais. Escolha o momento que melhor descreve sua realidade atual para montarmos uma trilha passo a passo focada em resultados práticos.
          </p>
        </div>

        <div className="pc-diagnostico-grid">
          {MOMENTOS.map(momento => (
            <button 
              key={momento.id} 
              className="pc-diagnostico-card"
              onClick={() => {
                setMomentoAtivo(momento);
                setNivelAtivo(1);
              }}
            >
              <span className="pc-diagnostico-icone">{momento.icone}</span>
              <h3>{momento.titulo}</h3>
              <p>{momento.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const passoAtual = momentoAtivo.trilha.find(p => p.nivel === nivelAtivo)!;

  // Filtragem dinâmica de oportunidades baseada nos filtros do Nível Atual
  const oportunidadesFiltradas = oportunidades.filter(op => {
    const tipoNormalizado = normalizar(op.tipo);
    const tituloNormalizado = normalizar(op.titulo);
    
    // Verifica se o tipo da oportunidade combina com os filtros exigidos pelo nível (e.g., 'curso', 'vaga', 'benefício')
    return passoAtual.filtrosTipo.some(filtro => {
      const fNorm = normalizar(filtro);
      return tipoNormalizado.includes(fNorm) || tituloNormalizado.includes(fNorm);
    });
  }).slice(0, 4); // Limita a 4 recomendações para não sobrecarregar a tela

  return (
    <main className="container" style={{ paddingBlock: '40px' }}>
      <header className="pc-dashboard-header">
        <div>
          <button className="pc-btn-voltar" onClick={() => setMomentoAtivo(null)}>
            ← Voltar para as opções
          </button>
          <h1>{momentoAtivo.icone} {momentoAtivo.titulo}</h1>
          <p>Sua trilha de progressão. Um passo de cada vez. Estamos com você.</p>
        </div>
        <div className="pc-dashboard-gamification">
          <div className="pc-progress-bar">
            <div className="pc-progress-fill" style={{ width: `${(nivelAtivo / 3) * 100}%` }}></div>
          </div>
          <span>Nível {nivelAtivo} de 3</span>
          <button className="btn-secundario" style={{ marginTop: '12px', fontSize: '13px' }} onClick={() => alert('Recurso de chat com IA em breve!')}>
            💬 Tirar dúvidas com a Assistente
          </button>
        </div>
      </header>

      <div className="pc-dashboard-layout">
        <aside className="pc-trilha-nav">
          {momentoAtivo.trilha.map((passo, index) => (
            <div 
              key={passo.nivel} 
              className={`pc-trilha-step ${nivelAtivo === passo.nivel ? 'ativo' : nivelAtivo > passo.nivel ? 'concluido' : ''}`}
              onClick={() => setNivelAtivo(passo.nivel as Nivel)}
            >
              <div className="pc-step-indicator">
                {nivelAtivo > passo.nivel ? '✓' : passo.nivel}
              </div>
              <div className="pc-step-content">
                <strong>Nível {passo.nivel}</strong>
                <span>{passo.titulo}</span>
              </div>
              {index < momentoAtivo.trilha.length - 1 && <div className="pc-step-connector"></div>}
            </div>
          ))}
        </aside>

        <section className="pc-trilha-detalhe">
          <div className="pc-card-detalhe">
            <span className="pc-badge-destaque">O que focar agora</span>
            <h2>{passoAtual.titulo}</h2>
            <p className="pc-descricao-passo">{passoAtual.descricao}</p>
            
            <div className="pc-habilidades-grid">
              <div>
                <h4 className="pc-habilidades-title">📚 Hard Skills (Práticas)</h4>
                <div className="pc-skill-cloud">
                  {passoAtual.habilidades.filter(h => h.tipo === 'hard').map(h => (
                    <span key={h.nome} className="pc-skill-chip hard">{h.nome}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="pc-habilidades-title">🤝 Soft Skills (Comportamentais)</h4>
                <div className="pc-skill-cloud">
                  {passoAtual.habilidades.filter(h => h.tipo === 'soft').map(h => (
                    <span key={h.nome} className="pc-skill-chip soft">{h.nome}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pc-acoes-box">
              <h3>Oportunidades Conectadas a este Nível</h3>
              {carregando ? (
                <p style={{ color: 'var(--texto-suave)', fontSize: '14px' }}>Buscando recomendações no ecossistema...</p>
              ) : oportunidadesFiltradas.length > 0 ? (
                <div className="pc-oportunidades-grid">
                  {oportunidadesFiltradas.map(op => (
                    <div key={op.id || op.titulo} className="pc-oportunidade-card">
                      <span className="pc-op-tipo">{op.tipo}</span>
                      <h4>{op.titulo}</h4>
                      {op.empresa && <strong className="pc-op-empresa">{op.empresa}</strong>}
                      <p>{op.descricao.substring(0, 80)}...</p>
                      
                      {op.link_inscricao ? (
                        <a href={op.link_inscricao} target="_blank" rel="noopener noreferrer" className="btn-secundario pc-op-btn">
                          Acessar ↗
                        </a>
                      ) : op.id ? (
                        <Link to={`/oportunidades/${op.id}`} className="btn-secundario pc-op-btn">
                          Ver Detalhes →
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pc-oportunidade-vazia">
                  <p>Não encontramos vagas ou cursos públicos exatos para este nível no momento.</p>
                  <Link to="/mapa" className="btn-primario">
                    Acessar o Mapa de Apoio
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
