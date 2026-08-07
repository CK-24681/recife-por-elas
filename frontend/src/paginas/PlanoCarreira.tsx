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
      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-[60vh] font-sans">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold text-gray-900 mt-6 text-center">Construindo seu roteiro...</h2>
        <p className="text-gray-600 mt-2 text-center">Analisando seu perfil e cruzando com oportunidades no Recife.</p>
      </main>
    );
  }

  // WIZARD DE DIAGNÓSTICO (ESTADO INICIAL)
  if (!momentoAtivo) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 flex flex-col gap-6 font-sans">
        
        {/* Cabeçalho */}
        <div className="text-center mb-4">
          <span className="text-sm font-bold text-pink-600 uppercase tracking-widest inline-block mb-2">
            Diagnóstico Interativo
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Vamos conhecer você.</h1>
          <p className="text-lg text-gray-600">
            Responda estas 4 perguntas rápidas para montarmos um plano de carreira totalmente personalizado para sua rotina.
          </p>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium text-gray-500">
            <span>Passo {passoWizard} de 4</span>
            <span>{passoWizard * 25}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-pink-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${(passoWizard / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Passo 1 */}
        {passoWizard === 1 && (
          <div className="animate-fade-in flex flex-col gap-2 mt-4">
            <h2 className="text-2xl font-bold text-gray-800 my-4 text-center md:text-left">Qual o seu momento profissional atual?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Informal ou Autônoma', value: 'Informal / Autônoma' },
                { label: 'Desempregada buscando vaga', value: 'Desempregada' },
                { label: 'Trabalho, mas quero mudar', value: 'Trabalhando CLT' },
                { label: 'Dedicada ao cuidado da casa/filhos', value: 'Apenas Cuidado Familiar' }
              ].map((opcao, idx) => (
                <label key={idx} className="flex items-center p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all group bg-white">
                  <input 
                    type="radio" 
                    name="momento_atual" 
                    className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500 cursor-pointer mr-3"
                    onChange={() => handleRespostaWizard(1, opcao.value)}
                  />
                  <span className="text-lg text-gray-700 font-medium group-hover:text-pink-700">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Passo 2 */}
        {passoWizard === 2 && (
          <div className="animate-fade-in flex flex-col gap-2 mt-4">
            <h2 className="text-2xl font-bold text-gray-800 my-4 text-center md:text-left">Qual a sua maior barreira de tempo hoje?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Cuidar de filhos pequenos', value: 'Filhos pequenos' },
                { label: 'Cuidar de idosos ou doentes', value: 'Parentes idosos/doentes' },
                { label: 'Dupla jornada (Trabalho + Casa)', value: 'Dupla jornada' },
                { label: 'Tenho tempo livre razoável', value: 'Nenhuma barreira' }
              ].map((opcao, idx) => (
                <label key={idx} className="flex items-center p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all group bg-white">
                  <input 
                    type="radio" 
                    name="barreira_tempo" 
                    className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500 cursor-pointer mr-3"
                    onChange={() => handleRespostaWizard(2, opcao.value)}
                  />
                  <span className="text-lg text-gray-700 font-medium group-hover:text-pink-700">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Passo 3 */}
        {passoWizard === 3 && (
          <div className="animate-fade-in flex flex-col gap-2 mt-4">
            <h2 className="text-2xl font-bold text-gray-800 my-4 text-center md:text-left">Qual área desperta mais seu interesse?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Comércio, Vendas e Atendimento', value: 'Comércio e Vendas' },
                { label: 'Tecnologia e Administração', value: 'Tecnologia' },
                { label: 'Beleza, Estética ou Culinária', value: 'Beleza e Culinária' },
                { label: 'Serviços Gerais ou Saúde', value: 'Serviços Gerais' }
              ].map((opcao, idx) => (
                <label key={idx} className="flex items-center p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all group bg-white">
                  <input 
                    type="radio" 
                    name="area_interesse" 
                    className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500 cursor-pointer mr-3"
                    onChange={() => handleRespostaWizard(3, opcao.value)}
                  />
                  <span className="text-lg text-gray-700 font-medium group-hover:text-pink-700">{opcao.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Passo 4 */}
        {passoWizard === 4 && (
          <div className="animate-fade-in flex flex-col gap-2 mt-4">
            <h2 className="text-2xl font-bold text-gray-800 my-4 text-center md:text-left">Qual a sua meta número 1 para os próximos 3 meses?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Renda Rápida', desc: 'Qualquer alternativa flexível para fechar as contas.', value: 'Renda Imediata', meta: 'renda_imediata' },
                { label: 'Abrir MEI', desc: 'Me formalizar e conseguir crédito.', value: 'Formalizar Negócio', meta: 'formalizacao' },
                { label: 'Vaga CLT', desc: 'Estabilidade e direitos trabalhistas.', value: 'Carteira Assinada', meta: 'recolocacao_formal' },
                { label: 'Mudar para Tecnologia', desc: 'Aprender digital e buscar vagas remotas.', value: 'Estudar TI', meta: 'migracao_tec' }
              ].map((opcao, idx) => (
                <label key={idx} className="flex items-start p-5 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition-all group bg-white">
                  <input 
                    type="radio" 
                    name="meta_principal" 
                    className="w-5 h-5 text-pink-600 border-gray-300 focus:ring-pink-500 cursor-pointer mr-3 mt-1"
                    onChange={() => handleRespostaWizard(4, opcao.value, opcao.meta)}
                  />
                  <div className="flex flex-col">
                    <strong className="text-lg text-gray-800 group-hover:text-pink-700 mb-1">{opcao.label}</strong>
                    <span className="text-sm text-gray-500">{opcao.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  // DASHBOARD DE PROGRESSÃO (RESULTADO)
  const progressoTotal = calcularProgresso(momentoAtivo.trilha);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <header className="flex flex-col gap-6 mb-10 pb-6 border-b border-gray-200">
        <button 
          className="self-start text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors flex items-center gap-2" 
          onClick={refazerDiagnostico}
        >
          &larr; Refazer Diagnóstico
        </button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              {momentoAtivo.icone} Plano: {momentoAtivo.titulo}
            </h1>
            <p className="text-gray-600 text-lg">
              Seu roteiro personalizado baseado no seu perfil. Complete as tarefas para evoluir.
            </p>
          </div>
          <div className="w-full md:w-64 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-600">Progresso Geral</span>
              <span className="text-lg font-bold text-pink-600">{progressoTotal}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressoTotal}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8">
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
            <section key={passo.nivel} className={`bg-white border rounded-2xl p-6 md:p-8 shadow-sm transition-all ${isBloqueado ? 'border-gray-200 opacity-60 bg-gray-50' : (todasTarefasFeitas ? 'border-green-400 bg-green-50/30' : 'border-gray-200 hover:border-pink-300 hover:shadow-md')}`}>
              <div className="flex flex-col gap-2 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${isBloqueado ? 'bg-gray-200 text-gray-600' : (todasTarefasFeitas ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700')}`}>
                    Nível {passo.nivel} {isBloqueado && '(Bloqueado)'} {todasTarefasFeitas && '(Concluído)'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{passo.titulo}</h2>
                <p className="text-gray-600 text-base">{passo.descricao}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tarefas */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-gray-800">Tarefas Práticas</h3>
                  <div className="flex flex-col gap-3">
                    {passo.tarefas.map(tarefa => {
                      const isConcluida = tarefasConcluidas.includes(tarefa.id);
                      const isAnimando = animandoTarefa === tarefa.id;
                      return (
                        <label key={tarefa.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${isConcluida ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-pink-300'} ${isAnimando ? 'scale-105 bg-green-100' : ''} ${isBloqueado ? 'cursor-not-allowed' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={isConcluida}
                            onChange={() => toggleTarefa(tarefa.id, passo.nivel)}
                            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            disabled={isBloqueado}
                          />
                          <span className={`text-base font-medium ${isConcluida ? 'text-green-800 line-through opacity-70' : 'text-gray-700'}`}>{tarefa.texto}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Apoio */}
                <div className="flex flex-col gap-4">
                   <h3 className="text-lg font-bold text-gray-800">Recomendações e Apoio</h3>
                   {isBloqueado ? (
                     <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl border border-gray-200 text-center h-full">
                       <span className="text-4xl mb-3">🔒</span>
                       <p className="text-gray-600 font-medium">Termine o Nível {passo.nivel - 1} para desbloquear recursos desta etapa.</p>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap gap-2">
                          {passo.habilidades.map(h => (
                            <span key={h.nome} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${h.tipo === 'hard' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                              {h.nome}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3">
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Oportunidades Relacionadas</h4>
                          {carregando ? (
                            <div className="text-gray-500 text-sm animate-pulse">Buscando oportunidades...</div>
                          ) : oportunidadesFiltradas.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {oportunidadesFiltradas.map(op => (
                                <div key={op.id || op.titulo} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-sm transition-all group">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-pink-600 uppercase mb-1">{op.tipo}</span>
                                    <h5 className="text-gray-900 font-semibold group-hover:text-pink-700 transition-colors">{op.titulo}</h5>
                                  </div>
                                  {op.link_inscricao ? (
                                    <a href={op.link_inscricao} target="_blank" rel="noopener noreferrer" className="shrink-0 px-4 py-2 bg-pink-50 text-pink-700 font-semibold rounded-lg hover:bg-pink-100 transition-colors text-sm">Abrir ↗</a>
                                  ) : op.id ? (
                                    <Link to={`/oportunidades/${op.id}`} className="shrink-0 px-4 py-2 bg-pink-50 text-pink-700 font-semibold rounded-lg hover:bg-pink-100 transition-colors text-sm">Detalhes &rarr;</Link>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">Nenhuma oportunidade pública encontrada no momento.</div>
                          )}
                        </div>
                     </div>
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
