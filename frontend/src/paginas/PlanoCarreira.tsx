import { useState } from 'react';
import { Link } from '../utils/roteador';

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
  acoes: { label: string; link: string; interno?: boolean; destaque?: boolean }[];
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
        descricao: 'Antes de acelerar, garanta os benefícios sociais básicos (CRAS, Bolsa Família) e rede de apoio para seus filhos.',
        habilidades: [
          { nome: 'Gestão de Orçamento Básico', tipo: 'hard' },
          { nome: 'Resiliência e Foco', tipo: 'soft' }
        ],
        acoes: [
          { label: 'Ver Benefícios (CRAS)', link: '/mapa', interno: true },
          { label: 'Vagas Diaristas/Freelance', link: '/', interno: true, destaque: true }
        ]
      },
      {
        nivel: 2,
        titulo: 'Micro-Qualificação Rápida',
        descricao: 'Aprenda uma habilidade prática de curta duração (ex: culinária, beleza, artesanato) que possa ser vendida imediatamente.',
        habilidades: [
          { nome: 'Atendimento ao Cliente', tipo: 'soft' },
          { nome: 'Técnicas de Venda Simples', tipo: 'hard' }
        ],
        acoes: [
          { label: 'Cursos Qualifica Recife', link: 'https://qualifica.recife.pe.gov.br/' }
        ]
      },
      {
        nivel: 3,
        titulo: 'Geração de Renda Ativa',
        descricao: 'Comece a oferecer seus serviços no bairro ou internet, usando redes sociais para captar os primeiros clientes.',
        habilidades: [
          { nome: 'Uso de Redes Sociais', tipo: 'hard' },
          { nome: 'Comunicação Clara', tipo: 'soft' }
        ],
        acoes: [
          { label: 'Microcrédito CredPop', link: 'https://credpop.recife.pe.gov.br/' }
        ]
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
        acoes: [
          { label: 'Cursos SEBRAE', link: 'https://pe.lojavirtualsebrae.com.br/', destaque: true }
        ]
      },
      {
        nivel: 2,
        titulo: 'Formalização MEI',
        descricao: 'Abra seu CNPJ MEI gratuitamente. Isso garante seus direitos previdenciários (auxílio-doença, salário maternidade).',
        habilidades: [
          { nome: 'Navegação em Portais do Governo', tipo: 'hard' }
        ],
        acoes: [
          { label: 'Portal do Empreendedor', link: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor' },
          { label: 'Salas do Empreendedor', link: '/mapa', interno: true }
        ]
      },
      {
        nivel: 3,
        titulo: 'Escala e Microcrédito',
        descricao: 'Com o CNPJ em mãos, acesse linhas de crédito focadas em mulheres e amplie sua produção ou serviços.',
        habilidades: [
          { nome: 'Gestão de Estoque', tipo: 'hard' },
          { nome: 'Negociação', tipo: 'soft' }
        ],
        acoes: [
          { label: 'CredPop Recife', link: 'https://credpop.recife.pe.gov.br/', destaque: true }
        ]
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
        acoes: [
          { label: 'Gerador de CV Simples', link: '#' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Atualização Profissional',
        descricao: 'Faça cursos técnicos gratuitos (SENAI, SENAC) na sua área para voltar competitiva ao mercado.',
        habilidades: [
          { nome: 'Adaptação tecnológica', tipo: 'soft' },
          { nome: 'Pacote Office Básico', tipo: 'hard' }
        ],
        acoes: [
          { label: 'Vagas no Feed', link: '/', interno: true, destaque: true },
          { label: 'SENAC PE', link: 'https://www.pe.senac.br/psg/' }
        ]
      },
      {
        nivel: 3,
        titulo: 'Entrevistas e Networking',
        descricao: 'Aprenda a se portar em entrevistas e acione sua rede de contatos para indicações.',
        habilidades: [
          { nome: 'Comunicação e Oratória', tipo: 'soft' },
          { nome: 'Inteligência Emocional', tipo: 'soft' }
        ],
        acoes: [
          { label: 'Agências de Trabalho no Mapa', link: '/mapa', interno: true }
        ]
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
          { nome: 'Curiosidade e Aprendizado', tipo: 'soft' }
        ],
        acoes: [
          { label: 'Nave do Conhecimento (Mapa)', link: '/mapa', interno: true }
        ]
      },
      {
        nivel: 2,
        titulo: 'Formação Específica',
        descricao: 'Entre em bootcamps ou formações técnicas focadas em Mulheres (ex: Programação, Design, Assistente Virtual).',
        habilidades: [
          { nome: 'Lógica e Resolução de Problemas', tipo: 'hard' },
          { nome: 'Gestão de Tempo', tipo: 'soft' }
        ],
        acoes: [
          { label: 'Porto Digital Mulheres', link: 'https://www.portodigital.org/', destaque: true },
          { label: 'IFPE Cursos', link: 'https://www.ifpe.edu.br/' }
        ]
      },
      {
        nivel: 3,
        titulo: 'Primeira Oportunidade Júnior',
        descricao: 'Monte um portfólio prático com projetos reais e candidate-se a vagas júnior remotas ou híbridas na RMR.',
        habilidades: [
          { nome: 'Trabalho em Equipe (Remoto)', tipo: 'soft' },
          { nome: 'Metodologias Ágeis', tipo: 'hard' }
        ],
        acoes: [
          { label: 'Filtrar Vagas Tech', link: '/', interno: true }
        ]
      }
    ]
  }
];

export default function PlanoCarreira() {
  const [momentoAtivo, setMomentoAtivo] = useState<Momento | null>(null);
  const [nivelAtivo, setNivelAtivo] = useState<Nivel>(1);

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
              <h3>Recomendações e Próximos Passos</h3>
              <div className="pc-acoes-list">
                {passoAtual.acoes.map(acao => (
                  acao.interno ? (
                    <Link key={acao.label} to={acao.link} className={`btn-acao ${acao.destaque ? 'primario' : 'secundario'}`}>
                      {acao.label} →
                    </Link>
                  ) : (
                    <a key={acao.label} href={acao.link} target="_blank" rel="noopener noreferrer" className={`btn-acao ${acao.destaque ? 'primario' : 'secundario'}`}>
                      {acao.label} ↗
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
