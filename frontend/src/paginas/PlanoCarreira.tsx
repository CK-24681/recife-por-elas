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
    icone: '',
    titulo: 'Preciso de renda imediata',
    descricao: 'Alternativas rápidas e flexíveis para gerar dinheiro e estabilizar as contas de casa.',
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
        descricao: 'Aprenda uma habilidade prática de curta duração (ex: culinária, beleza, artesanato).',
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
        descricao: 'Comece a oferecer seus serviços no bairro ou internet, captando os primeiros clientes.',
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
    icone: '',
    titulo: 'Quero me formalizar (MEI)',
    descricao: 'Já tenho uma atividade e preciso de segurança jurídica e crédito para crescer.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Mapeamento do Negócio',
        descricao: 'Entenda o que você vende, quem é seu cliente e separe o dinheiro da casa.',
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
        descricao: 'Abra seu CNPJ MEI gratuitamente e garanta seus direitos previdenciários.',
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
        descricao: 'Com o CNPJ em mãos, acesse linhas de crédito e amplie sua produção.',
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
    icone: '',
    titulo: 'Busco recolocação (CLT)',
    descricao: 'Quero estabilidade, carteira assinada e direitos garantidos no fim do mês.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Preparação e Currículo',
        descricao: 'Atualize seus dados, faça um currículo claro focando em suas experiências reais.',
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
        descricao: 'Faça cursos técnicos gratuitos (SENAI, SENAC) na sua área.',
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
        descricao: 'Aprenda a se portar em entrevistas e acione sua rede de contatos.',
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
    icone: '',
    titulo: 'Quero ir para Tecnologia',
    descricao: 'Vejo o mercado digital crescendo e quero me capacitar para vagas em Tech.',
    trilha: [
      {
        nivel: 1,
        titulo: 'Letramento Digital Básico',
        descricao: 'Ganhe fluência com computadores, digitação e ferramentas de trabalho remoto.',
        habilidades: [
          { nome: 'Informática Básica', tipo: 'hard' },
          { nome: 'Curiosidade', tipo: 'soft' }
        ],
        filtrosTipo: ['curso', 'oficina'],
        tarefas: [
          { id: 'mt_1_1', texto: 'Aprender a usar Google Drive e Docs' },
          { id: 'mt_1_2', texto: 'Participar de uma chamada no Zoom/Meet' },
          { id: 'mt_1_3', texto: 'Fazer curso básico de Informática' }
        ]
      },
      {
        nivel: 2,
        titulo: 'Formação Específica',
        descricao: 'Entre em bootcamps focados em Mulheres (ex: Programação, Design, Assistente Virtual).',
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
        descricao: 'Monte um portfólio prático com projetos reais e candidate-se a vagas remotas/híbridas.',
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
  
  // Wizard States
  const [passoWizard, setPassoWizard] = useState(1);
  const [isProcessando, setIsProcessando] = useState(false);

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

  const handleRespostaWizard = (passo: number, _resposta: string, metaId?: string) => {
    
    if (passo === 4 && metaId) {
       setIsProcessando(true);
       setTimeout(() => {
           setIsProcessando(false);
           const m = MOMENTOS.find(mom => mom.id === metaId) || MOMENTOS[0];
           setMomentoAtivo(m);
       }, 2500); // 2.5s delay fake para processamento de IA/análise
    } else {
       setPassoWizard(p => p + 1);
    }
  };

  const refazerDiagnostico = () => {
    setMomentoAtivo(null);
    setPassoWizard(1);
    setTarefasConcluidas([]);
  };

  const toggleTarefa = (id: string, nivel: number) => {
    setTarefasConcluidas(prev => {
      const concluido = prev.includes(id);
      if (!concluido) {
        setAnimandoTarefa(id);
        setTimeout(() => setAnimandoTarefa(null), 800);
        
        const novasTarefas = [...prev, id];
        
        if (momentoAtivo) {
          const passoAtualRef = momentoAtivo.trilha.find(p => p.nivel === nivel);
          if (passoAtualRef) {
            const completouNivel = passoAtualRef.tarefas.every(t => novasTarefas.includes(t.id));
            if (completouNivel) {
               alert(`Parabéns! Você concluiu o Nível ${nivel}. O próximo nível foi desbloqueado.`);
            }
          }
        }
        return novasTarefas;
      }
      return prev.filter(t => t !== id);
    });
  };

  const verificarNivelBloqueado = (nivel: number, trilha: PassoTrilha[]) => {
    if (nivel === 1) return false;
    const nivelAnterior = trilha.find(p => p.nivel === nivel - 1);
    if (!nivelAnterior) return false;
    return nivelAnterior.tarefas.some(t => !tarefasConcluidas.includes(t.id));
  };

  const calcularProgresso = (trilha: PassoTrilha[]) => {
    const total = trilha.reduce((acc, p) => acc + p.tarefas.length, 0);
    if (total === 0) return 0;
    const concluidas = trilha.flatMap(p => p.tarefas).filter(t => tarefasConcluidas.includes(t.id)).length;
    return Math.round((concluidas / total) * 100);
  };

  // TELA DE PROCESSAMENTO
  if (isProcessando) {
    return (
      <main className="container wl-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="wl-spinner"></div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginTop: '24px', textAlign: 'center' }}>Construindo seu roteiro...</h2>
        <p style={{ color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>Analisando seu perfil e cruzando com oportunidades no Recife.</p>
      </main>
    );
  }

  // WIZARD DE DIAGNÓSTICO (ESTADO INICIAL)
  if (!momentoAtivo) {
    return (
      <main className="container wl-page">
        <div className="wl-hero" style={{ marginBottom: '32px' }}>
          <span className="wl-badge">Diagnóstico Interativo</span>
          <h1 className="wl-hero-title">Vamos conhecer você.</h1>
          <p className="wl-hero-subtitle">
            Responda estas {passoWizard} de 4 perguntas rápidas para montarmos um plano de carreira totalmente personalizado para sua rotina.
          </p>
        </div>

        <div className="wl-wizard-container">
          <div className="wl-wizard-progress-bg">
             <div className="wl-wizard-progress-fill" style={{ width: `${(passoWizard / 4) * 100}%` }}></div>
          </div>
          <p className="wl-wizard-step-counter">Passo {passoWizard} de 4</p>

          {passoWizard === 1 && (
            <div className="wl-wizard-step animate-fade-in">
              <h2 className="wl-wizard-question">Qual o seu momento profissional atual?</h2>
              <div className="wl-wizard-options-grid">
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(1, 'Informal / Autônoma')}>
                  Informal ou Autônoma
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(1, 'Desempregada')}>
                  Desempregada buscando vaga
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(1, 'Trabalhando CLT')}>
                  Trabalho, mas quero mudar
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(1, 'Apenas Cuidado Familiar')}>
                  Dedicada ao cuidado da casa/filhos
                </button>
              </div>
            </div>
          )}

          {passoWizard === 2 && (
            <div className="wl-wizard-step animate-fade-in">
              <h2 className="wl-wizard-question">Qual a sua maior barreira de tempo hoje?</h2>
              <div className="wl-wizard-options-grid">
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(2, 'Filhos pequenos')}>
                  Cuidar de filhos pequenos
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(2, 'Parentes idosos/doentes')}>
                  Cuidar de idosos ou doentes
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(2, 'Dupla jornada')}>
                  Dupla jornada (Trabalho + Casa)
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(2, 'Nenhuma barreira')}>
                  Tenho tempo livre razoável
                </button>
              </div>
            </div>
          )}

          {passoWizard === 3 && (
            <div className="wl-wizard-step animate-fade-in">
              <h2 className="wl-wizard-question">Qual área desperta mais seu interesse?</h2>
              <div className="wl-wizard-options-grid">
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(3, 'Comércio e Vendas')}>
                  Comércio, Vendas e Atendimento
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(3, 'Tecnologia')}>
                  Tecnologia e Administração
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(3, 'Beleza e Culinária')}>
                  Beleza, Estética ou Culinária
                </button>
                <button className="wl-wizard-option" onClick={() => handleRespostaWizard(3, 'Serviços Gerais')}>
                  Serviços Gerais ou Saúde
                </button>
              </div>
            </div>
          )}

          {passoWizard === 4 && (
            <div className="wl-wizard-step animate-fade-in">
              <h2 className="wl-wizard-question">Qual a sua meta número 1 para os próximos 3 meses?</h2>
              <div className="wl-wizard-options-grid">
                <button className="wl-wizard-option wl-meta-option" onClick={() => handleRespostaWizard(4, 'Renda Imediata', 'renda_imediata')}>
                  <strong>Renda Rápida</strong>
                  <p>Qualquer alternativa flexível para fechar as contas.</p>
                </button>
                <button className="wl-wizard-option wl-meta-option" onClick={() => handleRespostaWizard(4, 'Formalizar Negócio', 'formalizacao')}>
                  <strong>Abrir MEI</strong>
                  <p>Me formalizar e conseguir crédito.</p>
                </button>
                <button className="wl-wizard-option wl-meta-option" onClick={() => handleRespostaWizard(4, 'Carteira Assinada', 'recolocacao_formal')}>
                  <strong>Vaga CLT</strong>
                  <p>Estabilidade e direitos trabalhistas.</p>
                </button>
                <button className="wl-wizard-option wl-meta-option" onClick={() => handleRespostaWizard(4, 'Estudar TI', 'migracao_tec')}>
                  <strong>Mudar para Tecnologia</strong>
                  <p>Aprender digital e buscar vagas remotas.</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // DASHBOARD DE PROGRESSÃO (RESULTADO)
  const progressoTotal = calcularProgresso(momentoAtivo.trilha);

  return (
    <main className="container wl-page">
      <header className="wl-header-dashboard">
        <button className="wl-btn-voltar" onClick={refazerDiagnostico}>
          &larr; Refazer Diagnóstico
        </button>
        <div className="wl-header-content">
          <div>
            <h1 className="wl-dashboard-title">{momentoAtivo.icone} Plano: {momentoAtivo.titulo}</h1>
            <p className="wl-dashboard-subtitle">
              Seu roteiro personalizado baseado no seu perfil. Complete as tarefas para evoluir.
            </p>
          </div>
          <div className="wl-progresso-card">
            <div className="wl-progresso-texto">
              <span className="wl-progresso-label">Progresso Geral</span>
              <span className="wl-progresso-valor">{progressoTotal}%</span>
            </div>
            <div className="wl-progress-bar-bg">
              <div className="wl-progress-bar-fill" style={{ width: `${progressoTotal}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="wl-trilha-lista">
        {momentoAtivo.trilha.map((passo) => {
          const isBloqueado = verificarNivelBloqueado(passo.nivel, momentoAtivo.trilha);
          const todasTarefasFeitas = passo.tarefas.every(t => tarefasConcluidas.includes(t.id));
          
          const oportunidadesFiltradas = oportunidades.filter(op => {
            const tipoNormalizado = normalizar(op.tipo);
            const tituloNormalizado = normalizar(op.titulo);
            return passo.filtrosTipo.some(filtro => {
              const fNorm = normalizar(filtro);
              return tipoNormalizado.includes(fNorm) || tituloNormalizado.includes(fNorm);
            });
          }).slice(0, 3);

          return (
            <section key={passo.nivel} className={`wl-card-nivel ${isBloqueado ? 'wl-bloqueado' : ''} ${todasTarefasFeitas ? 'wl-concluido' : ''}`}>
              <div className="wl-nivel-header">
                <div>
                  <span className="wl-nivel-badge">Nível {passo.nivel} {isBloqueado && '(Bloqueado)'} {todasTarefasFeitas && '(Concluído)'}</span>
                  <h2 className="wl-nivel-title">{passo.titulo}</h2>
                  <p className="wl-nivel-desc">{passo.descricao}</p>
                </div>
              </div>

              <div className="wl-nivel-content">
                <div className="wl-tarefas-secao">
                  <h3 className="wl-secao-title">Tarefas Práticas</h3>
                  <div className="wl-tarefas-lista">
                    {passo.tarefas.map(tarefa => {
                      const isConcluida = tarefasConcluidas.includes(tarefa.id);
                      const isAnimando = animandoTarefa === tarefa.id;
                      return (
                        <label key={tarefa.id} className={`wl-tarefa-item ${isConcluida ? 'wl-tarefa-concluida' : ''} ${isAnimando ? 'wl-tarefa-animando' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={isConcluida}
                            onChange={() => toggleTarefa(tarefa.id, passo.nivel)}
                            className="wl-checkbox"
                            disabled={isBloqueado}
                          />
                          <span className="wl-tarefa-texto">{tarefa.texto}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="wl-apoio-secao">
                   <h3 className="wl-secao-title">Recomendações e Apoio</h3>
                   {isBloqueado ? (
                     <div className="wl-vazio-bloqueado">
                       <span className="wl-cadeado-svg"></span>
                       <p>Termine o Nível {passo.nivel - 1} para ver cursos e vagas desta etapa.</p>
                     </div>
                   ) : (
                     <>
                        <div className="wl-habilidades-tags">
                          {passo.habilidades.map(h => (
                            <span key={h.nome} className={`wl-tag wl-tag-${h.tipo}`}>{h.nome}</span>
                          ))}
                        </div>

                        {carregando ? (
                          <p className="wl-loading">Buscando oportunidades...</p>
                        ) : oportunidadesFiltradas.length > 0 ? (
                          <div className="wl-oportunidades-lista">
                            {oportunidadesFiltradas.map(op => (
                              <div key={op.id || op.titulo} className="wl-oportunidade-card">
                                <div>
                                  <span className="wl-op-tipo">{op.tipo}</span>
                                  <h4 className="wl-op-title">{op.titulo}</h4>
                                </div>
                                {op.link_inscricao ? (
                                  <a href={op.link_inscricao} target="_blank" rel="noopener noreferrer" className="wl-btn-pequeno">Abrir ↗</a>
                                ) : op.id ? (
                                  <Link to={`/oportunidades/${op.id}`} className="wl-btn-pequeno">Detalhes →</Link>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="wl-vazio">Nenhuma recomendação pública agora.</div>
                        )}
                     </>
                   )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
