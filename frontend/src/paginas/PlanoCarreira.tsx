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

interface Tarefa {
  id: string;
  texto: string;
}

interface PassoTrilha {
  nivel: Nivel;
  titulo: string;
  descricao: string;
  habilidades: Habilidade[];
  filtrosTipo: string[];
  tarefas: Tarefa[];
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
        filtrosTipo: ['benefício', 'apoio'],
        tarefas: [
          { id: 'ri_1_1', texto: 'Verificar inscrição no Cadastro Único' },
          { id: 'ri_1_2', texto: 'Identificar rede de apoio para cuidado dos filhos' },
          { id: 'ri_1_3', texto: 'Pesquisar benefícios sociais ativos no app' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Micro-Qualificação Rápida',
        descricao: 'Aprenda uma habilidade prática de curta duração (ex: culinária, beleza, artesanato) que possa ser vendida imediatamente.',
        habilidades: [
          { nome: 'Atendimento ao Cliente', tipo: 'soft' },
          { nome: 'Técnicas de Venda', tipo: 'hard' }
        ],
        filtrosTipo: ['curso', 'oficina', 'microcapacitação'],
        tarefas: [
          { id: 'ri_2_1', texto: 'Escolher um micro-curso gratuito na API' },
          { id: 'ri_2_2', texto: 'Completar a primeira aula' },
          { id: 'ri_2_3', texto: 'Listar 3 possíveis primeiros clientes' }
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
        filtrosTipo: ['emprego', 'freelance', 'microcrédito'],
        tarefas: [
          { id: 'ri_3_1', texto: 'Fazer o primeiro anúncio no WhatsApp ou Instagram' },
          { id: 'ri_3_2', texto: 'Atender o primeiro cliente' },
          { id: 'ri_3_3', texto: 'Simular um pedido de microcrédito (opcional)' }
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
        filtrosTipo: ['curso', 'oficina'],
        tarefas: [
          { id: 'fo_1_1', texto: 'Listar todos os custos fixos mensais do negócio' },
          { id: 'fo_1_2', texto: 'Definir o preço base do seu serviço/produto' },
          { id: 'fo_1_3', texto: 'Abrir uma conta digital separada para a empresa' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Formalização MEI',
        descricao: 'Abra seu CNPJ MEI gratuitamente. Isso garante seus direitos previdenciários (auxílio-doença, salário maternidade).',
        habilidades: [
          { nome: 'Navegação em Portais', tipo: 'hard' }
        ],
        filtrosTipo: ['apoio', 'serviço'],
        tarefas: [
          { id: 'fo_2_1', texto: 'Acessar o Portal do Empreendedor Gov.br' },
          { id: 'fo_2_2', texto: 'Escolher a ocupação principal (CNAE)' },
          { id: 'fo_2_3', texto: 'Emitir o Certificado de MEI (CCMEI)' }
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
        filtrosTipo: ['microcrédito', 'financiamento'],
        tarefas: [
          { id: 'fo_3_1', texto: 'Emitir a primeira nota fiscal' },
          { id: 'fo_3_2', texto: 'Consultar opções de CredPop na Prefeitura' },
          { id: 'fo_3_3', texto: 'Fazer curso de marketing do SEBRAE' }
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
        filtrosTipo: ['apoio', 'benefício'],
        tarefas: [
          { id: 'rf_1_1', texto: 'Listar todas as experiências de trabalho anteriores' },
          { id: 'rf_1_2', texto: 'Escrever o currículo no Word ou Canva' },
          { id: 'rf_1_3', texto: 'Revisar erros de português com um familiar ou amigo' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Atualização Profissional',
        descricao: 'Faça cursos técnicos gratuitos (SENAI, SENAC) na sua área para voltar competitiva ao mercado.',
        habilidades: [
          { nome: 'Adaptação', tipo: 'soft' },
          { nome: 'Pacote Office Básico', tipo: 'hard' }
        ],
        filtrosTipo: ['curso', 'técnico'],
        tarefas: [
          { id: 'rf_2_1', texto: 'Pesquisar cursos técnicos gratuitos abertos' },
          { id: 'rf_2_2', texto: 'Realizar matrícula e frequentar a 1ª semana' },
          { id: 'rf_2_3', texto: 'Atualizar o currículo com o novo curso' }
        ]
      },
      {
        nivel: 3,
        titulo: 'Entrevistas e Vagas',
        descricao: 'Aprenda a se portar em entrevistas e acione sua rede de contatos para indicações.',
        habilidades: [
          { nome: 'Comunicação e Oratória', tipo: 'soft' },
          { nome: 'Inteligência Emocional', tipo: 'soft' }
        ],
        filtrosTipo: ['emprego', 'vaga'],
        tarefas: [
          { id: 'rf_3_1', texto: 'Enviar currículo para 3 vagas no app' },
          { id: 'rf_3_2', texto: 'Treinar apresentação pessoal no espelho' },
          { id: 'rf_3_3', texto: 'Realizar a primeira entrevista de emprego' }
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
          { nome: 'Curiosidade', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'oficina'],
        tarefas: [
          { id: 'mt_1_1', texto: 'Aprender a usar Google Drive e Docs' },
          { id: 'mt_1_2', texto: 'Participar de uma chamada no Zoom/Meet' },
          { id: 'mt_1_3', texto: 'Fazer curso básico de Informática (Nave do Conhecimento)' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Formação Específica',
        descricao: 'Entre em bootcamps ou formações técnicas focadas em Mulheres (ex: Programação, Design, Assistente Virtual).',
        habilidades: [
          { nome: 'Lógica', tipo: 'hard' },
          { nome: 'Gestão de Tempo', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'bootcamp'],
        tarefas: [
          { id: 'mt_2_1', texto: 'Inscrever-se no MinAs ou Porto Digital' },
          { id: 'mt_2_2', texto: 'Concluir 50% da formação técnica escolhida' },
          { id: 'mt_2_3', texto: 'Criar perfil no LinkedIn' }
        ]
      },
      {
        nivel: 3,
        titulo: 'Primeira Oportunidade Júnior',
        descricao: 'Monte um portfólio prático com projetos reais e candidate-se a vagas júnior remotas ou híbridas na RMR.',
        habilidades: [
          { nome: 'Trabalho em Equipe', tipo: 'soft' },
          { nome: 'Metodologias Ágeis', tipo: 'hard' }
        ],
        filtrosTipo: ['emprego', 'estágio', 'vaga'],
        tarefas: [
          { id: 'mt_3_1', texto: 'Subir o primeiro projeto no GitHub ou Canva' },
          { id: 'mt_3_2', texto: 'Adicionar portfólio no LinkedIn' },
          { id: 'mt_3_3', texto: 'Candidatar-se a 3 vagas Júnior/Estágio' }
        ]
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
  
  // Estado gamificado
  const [tarefasConcluidas, setTarefasConcluidas] = useState<string[]>([]);
  const [animandoTarefa, setAnimandoTarefa] = useState<string | null>(null);

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

  const toggleTarefa = (id: string) => {
    setTarefasConcluidas(prev => {
      const concluido = prev.includes(id);
      if (!concluido) {
        // Dispara animação de sucesso
        setAnimandoTarefa(id);
        setTimeout(() => setAnimandoTarefa(null), 800);
        return [...prev, id];
      }
      return prev.filter(t => t !== id);
    });
  };

  const verificarNivelBloqueado = (nivel: number, trilha: PassoTrilha[]) => {
    if (nivel === 1) return false;
    const nivelAnterior = trilha.find(p => p.nivel === nivel - 1);
    if (!nivelAnterior) return false;
    // O nível está bloqueado se alguma tarefa do nível anterior NÃO estiver concluída
    return nivelAnterior.tarefas.some(t => !tarefasConcluidas.includes(t.id));
  };

  const calcularProgresso = (trilha: PassoTrilha[]) => {
    const total = trilha.reduce((acc, p) => acc + p.tarefas.length, 0);
    if (total === 0) return 0;
    const concluidas = trilha.flatMap(p => p.tarefas).filter(t => tarefasConcluidas.includes(t.id)).length;
    return Math.round((concluidas / total) * 100);
  };

  if (!momentoAtivo) {
    return (
      <main className="container" style={{ paddingBlock: '48px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px' }}>
          <span className="pc-badge-destaque" style={{ display: 'inline-block', marginBottom: '16px' }}>Plano de Carreira Interativo</span>
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

  const progressoTotal = calcularProgresso(momentoAtivo.trilha);
  const passoAtual = momentoAtivo.trilha.find(p => p.nivel === nivelAtivo)!;
  const isPassoAtualBloqueado = verificarNivelBloqueado(nivelAtivo, momentoAtivo.trilha);

  const oportunidadesFiltradas = oportunidades.filter(op => {
    const tipoNormalizado = normalizar(op.tipo);
    const tituloNormalizado = normalizar(op.titulo);
    return passoAtual.filtrosTipo.some(filtro => {
      const fNorm = normalizar(filtro);
      return tipoNormalizado.includes(fNorm) || tituloNormalizado.includes(fNorm);
    });
  }).slice(0, 4);

  return (
    <main className="container" style={{ paddingBlock: '40px' }}>
      <header className="pc-dashboard-header">
        <div>
          <button className="pc-btn-voltar" onClick={() => setMomentoAtivo(null)}>
            ← Voltar para as opções
          </button>
          <h1>{momentoAtivo.icone} {momentoAtivo.titulo}</h1>
          <p>
            {progressoTotal > 0 
              ? `Incrível! Você avançou ${progressoTotal}% no seu plano hoje.` 
              : 'Sua trilha de progressão começou. Um passo de cada vez.'}
          </p>
        </div>
        <div className="pc-dashboard-gamification">
          <div className="pc-progress-bar">
            <div className="pc-progress-fill" style={{ width: `${progressoTotal}%` }}></div>
          </div>
          <span>Concluído: {progressoTotal}%</span>
          <button className="btn-secundario" style={{ marginTop: '12px', fontSize: '13px', width: '100%' }} onClick={() => alert('Assistente IA indisponível no momento.')}>
            💬 Tirar dúvidas
          </button>
        </div>
      </header>

      <div className="pc-dashboard-layout">
        <aside className="pc-trilha-nav">
          {momentoAtivo.trilha.map((passo, index) => {
            const isBloqueado = verificarNivelBloqueado(passo.nivel, momentoAtivo.trilha);
            const todasTarefasFeitas = passo.tarefas.every(t => tarefasConcluidas.includes(t.id));
            const classAtivo = nivelAtivo === passo.nivel ? 'ativo' : '';
            const classConcluido = todasTarefasFeitas ? 'concluido' : '';
            const classBloqueado = isBloqueado ? 'bloqueado' : '';
            
            return (
              <div 
                key={passo.nivel} 
                className={`pc-trilha-step ${classAtivo} ${classConcluido} ${classBloqueado}`}
                onClick={() => {
                  if (!isBloqueado || classConcluido) {
                    setNivelAtivo(passo.nivel as Nivel);
                  }
                }}
              >
                <div className="pc-step-indicator">
                  {isBloqueado && !todasTarefasFeitas ? '🔒' : todasTarefasFeitas ? '✓' : passo.nivel}
                </div>
                <div className="pc-step-content">
                  <strong>Nível {passo.nivel} {isBloqueado && !todasTarefasFeitas ? '(Bloqueado)' : ''}</strong>
                  <span>{passo.titulo}</span>
                </div>
                {index < momentoAtivo.trilha.length - 1 && <div className="pc-step-connector"></div>}
              </div>
            );
          })}
        </aside>

        <section className="pc-trilha-detalhe">
          <div className="pc-card-detalhe">
            {isPassoAtualBloqueado ? (
              <div className="pc-estado-bloqueado">
                <span className="pc-icone-grande">🔒</span>
                <h2>Nível Bloqueado</h2>
                <p>Para destravar o Nível {nivelAtivo}, você precisa primeiro concluir todas as tarefas práticas do Nível {nivelAtivo - 1}.</p>
                <button className="btn-primario" onClick={() => setNivelAtivo((nivelAtivo - 1) as Nivel)}>
                  Voltar para o Nível {nivelAtivo - 1}
                </button>
              </div>
            ) : (
              <>
                <span className="pc-badge-destaque">Sua Missão Agora</span>
                <h2>{passoAtual.titulo}</h2>
                <p className="pc-descricao-passo">{passoAtual.descricao}</p>
                
                <div className="pc-tarefas-bloco">
                  <h3>Checklist Prático</h3>
                  <div className="pc-tarefas-lista">
                    {passoAtual.tarefas.map(tarefa => {
                      const isConcluida = tarefasConcluidas.includes(tarefa.id);
                      const isAnimando = animandoTarefa === tarefa.id;
                      return (
                        <label key={tarefa.id} className={`pc-tarefa-item ${isConcluida ? 'concluida' : ''} ${isAnimando ? 'animando' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={isConcluida}
                            onChange={() => toggleTarefa(tarefa.id)}
                            className="pc-checkbox"
                          />
                          <span className="pc-tarefa-texto">{tarefa.texto}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pc-habilidades-grid" style={{ marginTop: '32px' }}>
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

                <div className="pc-acoes-box" style={{ marginTop: '32px' }}>
                  <h3>Apoio para essas Tarefas</h3>
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
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
