import { useEffect, useMemo, useState } from 'react';
import { Link } from '../utils/roteador';

const CHAVE_PLANO_CARREIRA = 'recife-por-elas:plano-carreira:v1';
const CHAVE_FAVORITOS_CARREIRA = 'recife-por-elas:favoritos-carreira:v1';

type Objetivo = 'emprego' | 'empreender' | 'renda_extra' | 'estudar';
type Ritmo = 'muito_pouco' | 'pouco' | 'medio' | 'flexivel';
type Local = 'perto' | 'bairro' | 'presencial' | 'em_casa';

interface Respostas {
  objetivo: Objetivo;
  ritmo: Ritmo;
  filhos: boolean;
  local: Local;
  areas: string[];
}

interface CarreiraBase {
  id: string;
  titulo: string;
  tipo: 'Profissão' | 'Empreender';
  resumo: string;
  comoComecar: string;
  passos: string[];
  tags: string[];
  base: number;
}

interface CarreiraResultado extends CarreiraBase {
  percent: number;
  motivo: string;
}

const OBJETIVOS: Array<{ valor: Objetivo; titulo: string; subtitulo: string }> = [
  { valor: 'emprego', titulo: 'Quero emprego', subtitulo: 'Prioriza profissões e vagas mais diretas.' },
  { valor: 'empreender', titulo: 'Quero empreender', subtitulo: 'Prioriza serviços e renda por conta própria.' },
  { valor: 'renda_extra', titulo: 'Quero renda extra', subtitulo: 'Busca opções simples para começar rápido.' },
  { valor: 'estudar', titulo: 'Quero estudar primeiro', subtitulo: 'Destaca caminhos com aprendizagem mais leve.' },
];

const RITMOS: Array<{ valor: Ritmo; titulo: string }> = [
  { valor: 'muito_pouco', titulo: 'Pouquíssimo tempo' },
  { valor: 'pouco', titulo: 'Poucas horas' },
  { valor: 'medio', titulo: 'Algumas horas' },
  { valor: 'flexivel', titulo: 'Horário flexível' },
];

const LOCAIS: Array<{ valor: Local; titulo: string }> = [
  { valor: 'perto', titulo: 'Perto de casa' },
  { valor: 'bairro', titulo: 'No bairro' },
  { valor: 'presencial', titulo: 'Presencial' },
  { valor: 'em_casa', titulo: 'Em casa' },
];

const AREAS = [
  { valor: 'beleza', titulo: 'Beleza' },
  { valor: 'cabelo', titulo: 'Cabelo' },
  { valor: 'maquiagem', titulo: 'Maquiagem' },
  { valor: 'vendas', titulo: 'Vendas' },
  { valor: 'cozinha', titulo: 'Cozinha' },
  { valor: 'costura', titulo: 'Costura' },
  { valor: 'cuidado', titulo: 'Cuidado' },
  { valor: 'limpeza', titulo: 'Limpeza' },
  { valor: 'atendimento', titulo: 'Atendimento' },
  { valor: 'digital', titulo: 'Digital' },
  { valor: 'artesanato', titulo: 'Artesanato' },
  { valor: 'rua', titulo: 'Rua / carrinho' },
];

const CARREIRAS: CarreiraBase[] = [
  {
    id: 'manicure',
    titulo: 'Manicure',
    tipo: 'Empreender',
    resumo: 'Serviço rápido, baixo investimento e agenda flexível.',
    comoComecar: 'Monte um kit básico, faça 2 ou 3 modelos de unha e divulgue no WhatsApp do bairro.',
    passos: ['Kit simples', 'Fotos de antes e depois', 'Agenda pelo celular'],
    tags: ['beleza', 'casa', 'flexivel'],
    base: 52,
  },
  {
    id: 'cabeleireira',
    titulo: 'Cabeleireira',
    tipo: 'Empreender',
    resumo: 'Corte, escova, hidratação e penteados para começar em casa.',
    comoComecar: 'Comece com escova, tranças ou penteados e vá aumentando os serviços aos poucos.',
    passos: ['Treino básico', 'Tabela de preços', 'Atendimento no bairro'],
    tags: ['beleza', 'cabelo', 'casa', 'flexivel'],
    base: 54,
  },
  {
    id: 'maquiadora',
    titulo: 'Maquiadora',
    tipo: 'Empreender',
    resumo: 'Boa para festas, eventos e atendimentos por hora.',
    comoComecar: 'Monte um portfólio simples, ofereça pacote para eventos e divulgue no Instagram.',
    passos: ['Portfólio simples', 'Pacotes curtos', 'Divulgação online'],
    tags: ['beleza', 'maquiagem', 'digital', 'flexivel'],
    base: 50,
  },
  {
    id: 'carrinho',
    titulo: 'Vender no carrinho',
    tipo: 'Empreender',
    resumo: 'Lanches, água, doces ou bebidas com renda diária.',
    comoComecar: 'Escolha 1 produto que gira rápido e comece no ponto mais movimentado do bairro.',
    passos: ['Produto de saída rápida', 'Ponto fixo', 'Reaproveitar lucro para crescer'],
    tags: ['vendas', 'rua', 'bairro', 'flexivel'],
    base: 56,
  },
  {
    id: 'revenda',
    titulo: 'Revenda de cosméticos',
    tipo: 'Empreender',
    resumo: 'Começa com catálogo e encomenda pelo celular.',
    comoComecar: 'Trabalhe com catálogo, combo de produtos e pagamentos simples pelo WhatsApp.',
    passos: ['Catálogo', 'Pedidos por WhatsApp', 'Entrega no bairro'],
    tags: ['beleza', 'vendas', 'casa', 'digital'],
    base: 55,
  },
  {
    id: 'cozinha',
    titulo: 'Cozinha por encomenda',
    tipo: 'Empreender',
    resumo: 'Marmitas, bolos, salgados e doces por pedido.',
    comoComecar: 'Escolha um item que você faz bem e ofereça para vizinhas, escola e comércio local.',
    passos: ['Prato principal', 'Venda por encomenda', 'Entrega curta'],
    tags: ['cozinha', 'casa', 'flexivel'],
    base: 54,
  },
  {
    id: 'costura',
    titulo: 'Costureira e ajustes',
    tipo: 'Empreender',
    resumo: 'Ajustes, barras e peças sob medida com rotina flexível.',
    comoComecar: 'Faça pequenos consertos e anuncie no bairro e nos grupos de WhatsApp.',
    passos: ['Máquina básica', 'Ajustes rápidos', 'Divulgação local'],
    tags: ['costura', 'casa', 'flexivel'],
    base: 51,
  },
  {
    id: 'cuidadora',
    titulo: 'Cuidadora',
    tipo: 'Profissão',
    resumo: 'Apoio a crianças, idosos ou pessoas que precisam de atenção.',
    comoComecar: 'Mostre responsabilidade, paciência e disponibilidade para plantões ou meio período.',
    passos: ['Currículo simples', 'Referências', 'Rotina organizada'],
    tags: ['cuidado', 'presencial', 'bairro'],
    base: 53,
  },
  {
    id: 'limpeza',
    titulo: 'Auxiliar de limpeza',
    tipo: 'Profissão',
    resumo: 'Entrada rápida no mercado com rotina direta.',
    comoComecar: 'Procure vagas em comércios, escolas, clínicas e empresas próximas de você.',
    passos: ['Vagas locais', 'Currículo curto', 'Entrevista simples'],
    tags: ['limpeza', 'presencial', 'bairro'],
    base: 52,
  },
  {
    id: 'atendente',
    titulo: 'Atendente',
    tipo: 'Profissão',
    resumo: 'Loja, salão, clínica ou comércio de bairro.',
    comoComecar: 'Treine atendimento, comunicação clara e postura para lidar com o público.',
    passos: ['Comunicação', 'Postura no atendimento', 'Vagas do bairro'],
    tags: ['atendimento', 'presencial', 'bairro'],
    base: 51,
  },
  {
    id: 'recepcao',
    titulo: 'Recepção',
    tipo: 'Profissão',
    resumo: 'Organização, telefone e contato com o público.',
    comoComecar: 'Mostre que você organiza agenda, recebe bem as pessoas e aprende rápido.',
    passos: ['Agenda e telefone', 'Boa comunicação', 'Busca por clínicas e escritórios'],
    tags: ['atendimento', 'presencial', 'bairro', 'digital'],
    base: 50,
  },
  {
    id: 'social',
    titulo: 'Social media',
    tipo: 'Empreender',
    resumo: 'Postagens, resposta de mensagens e apoio a pequenos negócios.',
    comoComecar: 'Comece cuidando de 1 perfil pequeno e montando posts no celular.',
    passos: ['Celular na mão', 'Canva ou app simples', 'Pacote mensal'],
    tags: ['digital', 'em_casa', 'flexivel'],
    base: 49,
  },
  {
    id: 'artesanato',
    titulo: 'Artesanato por encomenda',
    tipo: 'Empreender',
    resumo: 'Peças personalizadas, lembrancinhas e produtos feitos à mão.',
    comoComecar: 'Faça 3 modelos simples e mostre para amigas, escola e vizinhança.',
    passos: ['Peças pequenas', 'Foto boa', 'Entrega no bairro'],
    tags: ['artesanato', 'casa', 'flexivel'],
    base: 50,
  },
];

const INICIAL: Respostas = {
  objetivo: 'empreender',
  ritmo: 'medio',
  filhos: false,
  local: 'bairro',
  areas: [],
};

interface PlanoSalvo {
  respostas: Respostas;
  selecionadoId: string;
}

function carregarPlano(): PlanoSalvo | null {
  if (typeof window === 'undefined') return null;

  try {
    const valor = window.localStorage.getItem(CHAVE_PLANO_CARREIRA);
    if (!valor) return null;

    const salvo = JSON.parse(valor) as Partial<PlanoSalvo>;
    if (!salvo.respostas || typeof salvo.respostas !== 'object') return null;

    return {
      respostas: {
        ...INICIAL,
        ...salvo.respostas,
        areas: Array.isArray(salvo.respostas.areas) ? salvo.respostas.areas : [],
      },
      selecionadoId: typeof salvo.selecionadoId === 'string' ? salvo.selecionadoId : '',
    };
  } catch {
    return null;
  }
}

function carregarFavoritos(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const valor = window.localStorage.getItem(CHAVE_FAVORITOS_CARREIRA);
    if (!valor) return [];

    const favoritos = JSON.parse(valor);
    return Array.isArray(favoritos) ? favoritos.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function calcularPercentual(item: CarreiraBase, respostas: Respostas): number {
  let score = item.base;
  const objetivoEmpreender = respostas.objetivo === 'empreender' || respostas.objetivo === 'renda_extra';
  const objetivoEmprego = respostas.objetivo === 'emprego' || respostas.objetivo === 'estudar';

  if (objetivoEmpreender && item.tipo === 'Empreender') score += 18;
  if (objetivoEmprego && item.tipo === 'Profissão') score += 18;
  if (respostas.ritmo === 'muito_pouco' && item.tags.includes('flexivel')) score += 12;
  if (respostas.ritmo === 'pouco' && item.tags.includes('flexivel')) score += 8;
  if (respostas.local === 'em_casa' && item.tags.includes('casa')) score += 14;
  if (respostas.local === 'perto' && item.tags.includes('bairro')) score += 10;
  if (respostas.local === 'presencial' && item.tags.includes('presencial')) score += 12;
  if (respostas.local === 'bairro' && (item.tags.includes('bairro') || item.tags.includes('presencial'))) score += 12;
  if (respostas.filhos && (item.tags.includes('flexivel') || item.tags.includes('casa'))) score += 10;
  if (respostas.objetivo === 'estudar') score += 4;

  const matches = respostas.areas.filter((area) => item.tags.includes(area)).length;
  score += matches * 16;

  if (respostas.objetivo === 'empreender' && item.tipo === 'Empreender') score += 4;
  if (respostas.objetivo === 'renda_extra' && item.tipo === 'Empreender') score += 4;

  return clamp(Math.round(score), 26, 96);
}

function criarMotivo(item: CarreiraBase, respostas: Respostas): string {
  const partes: string[] = [];

  if ((respostas.objetivo === 'empreender' || respostas.objetivo === 'renda_extra') && item.tipo === 'Empreender') {
    partes.push('combina com sua meta de ganhar dinheiro');
  }

  if ((respostas.objetivo === 'emprego' || respostas.objetivo === 'estudar') && item.tipo === 'Profissão') {
    partes.push('fica mais perto do caminho de emprego');
  }

  if (respostas.filhos && (item.tags.includes('flexivel') || item.tags.includes('casa'))) {
    partes.push('cabe melhor na rotina com filhos');
  }

  if (respostas.local === 'em_casa' && item.tags.includes('casa')) {
    partes.push('pode começar de casa');
  }

  const areaHit = respostas.areas.find((area) => item.tags.includes(area));
  if (areaHit) {
    partes.push('bate com o que você já marcou');
  }

  if (!partes.length) return 'é uma porta de entrada simples';
  return partes.slice(0, 2).join(' e ');
}

function AreaTag({
  label,
  ativo,
  onClick,
}: {
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`cp-chip ${ativo ? 'ativo' : ''}`}
      onClick={onClick}
      aria-pressed={ativo}
    >
      {label}
    </button>
  );
}

function CardOpcao({
  titulo,
  subtitulo,
  ativo,
  onClick,
}: {
  titulo: string;
  subtitulo?: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`cp-opcao ${ativo ? 'ativo' : ''}`}
      onClick={onClick}
      aria-pressed={ativo}
    >
      <strong>{titulo}</strong>
      {subtitulo && <span>{subtitulo}</span>}
    </button>
  );
}

function ResultadoCard({
  item,
  ativo,
  favoritado,
  onSelecionar,
  onFavoritar,
}: {
  item: CarreiraResultado;
  ativo: boolean;
  favoritado: boolean;
  onSelecionar: () => void;
  onFavoritar: () => void;
}) {
  return (
    <article className={`cp-card ${item.percent >= 70 ? 'cp-card-alta' : ''} ${ativo ? 'ativo' : ''}`}>
      <div className="cp-card-topo">
        <strong className="cp-percent">{item.percent}%</strong>
        <button
          type="button"
          className={`cp-star ${favoritado ? 'favoritado' : ''}`}
          onClick={onFavoritar}
          aria-label={favoritado ? `Remover ${item.titulo} dos favoritos` : `Favoritar ${item.titulo}`}
          aria-pressed={favoritado}
          title={favoritado ? 'Remover dos favoritos' : 'Favoritar esta opção'}
        >
          {favoritado ? '★' : '☆'}
        </button>
      </div>

      <span className={`cp-tag ${item.tipo === 'Empreender' ? 'empreender' : 'profissao'}`}>{item.tipo}</span>

      <h3>{item.titulo}</h3>
      <p className="cp-card-resumo">{item.resumo}</p>
      <p className="cp-card-motivo">{item.motivo}</p>

      <button type="button" className="cp-card-acao" onClick={onSelecionar}>
        Ver detalhes
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        </svg>
      </button>
    </article>
  );
}

const PASSOS = [
  'Objetivo',
  'Rotina',
  'O que combina',
  'Onde atuar',
];

export default function PlanoCarreira() {
  const [planoSalvoInicial] = useState<PlanoSalvo | null>(() => carregarPlano());
  const [respostas, setRespostas] = useState<Respostas>(() => planoSalvoInicial?.respostas ?? INICIAL);
  const [passo, setPasso] = useState(0);
  const [mostrarPlano, setMostrarPlano] = useState(() => Boolean(planoSalvoInicial));
  const [selecionadoId, setSelecionadoId] = useState(() => planoSalvoInicial?.selecionadoId ?? '');
  const [favoritos, setFavoritos] = useState<string[]>(() => carregarFavoritos());

  const resultados = useMemo<CarreiraResultado[]>(() => {
    return [...CARREIRAS]
      .map((item) => ({
        ...item,
        percent: calcularPercentual(item, respostas),
        motivo: criarMotivo(item, respostas),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 9);
  }, [respostas]);

  const selecionado = resultados.find((item) => item.id === selecionadoId) ?? resultados[0] ?? null;

  useEffect(() => {
    if (!mostrarPlano) return;

    try {
      window.localStorage.setItem(
        CHAVE_PLANO_CARREIRA,
        JSON.stringify({ respostas, selecionadoId }),
      );
    } catch {
      // A página continua funcionando mesmo quando o navegador bloqueia o armazenamento local.
    }
  }, [mostrarPlano, respostas, selecionadoId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_FAVORITOS_CARREIRA, JSON.stringify(favoritos));
    } catch {
      // A preferência visual permanece disponível durante a sessão.
    }
  }, [favoritos]);

  function atualizar<K extends keyof Respostas>(chave: K, valor: Respostas[K]) {
    setRespostas((atual) => ({ ...atual, [chave]: valor }));
  }

  function alternarArea(valor: string) {
    setRespostas((atual) => ({
      ...atual,
      areas: atual.areas.includes(valor)
        ? atual.areas.filter((item) => item !== valor)
        : [...atual.areas, valor],
    }));
  }

  function gerarPlano() {
    setMostrarPlano(true);
    setSelecionadoId(resultados[0]?.id || '');
    window.setTimeout(() => {
      document.getElementById('cp-resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function refazer() {
    try {
      window.localStorage.removeItem(CHAVE_PLANO_CARREIRA);
      window.localStorage.removeItem(CHAVE_FAVORITOS_CARREIRA);
    } catch {
      // O reset visual continua funcionando mesmo sem acesso ao armazenamento local.
    }

    setRespostas(INICIAL);
    setPasso(0);
    setMostrarPlano(false);
    setSelecionadoId('');
    setFavoritos([]);
    window.setTimeout(() => {
      document.getElementById('cp-questionario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function alternarFavorito(id: string) {
    setFavoritos((atuais) => (
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id]
    ));
  }

  const maxPasso = PASSOS.length - 1;

  const renderPergunta = () => {
    if (passo === 0) {
      return (
        <div className="cp-bloco">
          <div className="cp-bloco-cabeca">
            <span className="cp-numero">1</span>
            <div>
              <h3>O que você quer agora?</h3>
              <p>Escolha o foco principal para encontrar opções de profissão e empreendedorismo.</p>
            </div>
          </div>
          <div className="cp-opcoes-grid">
            {OBJETIVOS.map((item) => (
              <CardOpcao
                key={item.valor}
                titulo={item.titulo}
                subtitulo={item.subtitulo}
                ativo={respostas.objetivo === item.valor}
                onClick={() => atualizar('objetivo', item.valor)}
              />
            ))}
          </div>
        </div>
      );
    }

    if (passo === 1) {
      return (
        <div className="cp-bloco">
          <div className="cp-bloco-cabeca">
            <span className="cp-numero">2</span>
            <div>
              <h3>Sua rotina está mais apertada ou mais livre?</h3>
              <p>Indique quanto tempo você tem para encontrar caminhos que caibam no seu dia.</p>
            </div>
          </div>

          <div className="cp-dupla">
            <div className="cp-subbloco">
              <strong>Tempo por semana</strong>
              <div className="cp-chip-grid">
                {RITMOS.map((item) => (
                  <AreaTag
                    key={item.valor}
                    label={item.titulo}
                    ativo={respostas.ritmo === item.valor}
                    onClick={() => atualizar('ritmo', item.valor)}
                  />
                ))}
              </div>
            </div>

            <div className="cp-subbloco">
              <strong>Filhos dependem de você?</strong>
              <div className="cp-chip-grid">
                <AreaTag
                  label="Sim"
                  ativo={respostas.filhos}
                  onClick={() => atualizar('filhos', true)}
                />
                <AreaTag
                  label="Não"
                  ativo={!respostas.filhos}
                  onClick={() => atualizar('filhos', false)}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (passo === 2) {
      return (
        <div className="cp-bloco">
          <div className="cp-bloco-cabeca">
            <span className="cp-numero">3</span>
            <div>
              <h3>O que combina com você?</h3>
              <p>Selecione as áreas que despertam seu interesse. Você pode escolher mais de uma.</p>
            </div>
          </div>
          <div className="cp-opcoes-tags">
            {AREAS.map((item) => (
              <AreaTag
                key={item.valor}
                label={item.titulo}
                ativo={respostas.areas.includes(item.valor)}
                onClick={() => alternarArea(item.valor)}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="cp-bloco">
        <div className="cp-bloco-cabeca">
          <span className="cp-numero">4</span>
          <div>
            <h3>Onde você quer atuar?</h3>
            <p>Escolha o formato que mais respeita sua realidade.</p>
          </div>
        </div>
        <div className="cp-opcoes-grid cp-opcoes-grid-curta">
          {LOCAIS.map((item) => (
            <CardOpcao
              key={item.valor}
              titulo={item.titulo}
              ativo={respostas.local === item.valor}
              onClick={() => atualizar('local', item.valor)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="cp-page">
      <section className="cp-hero">
        <div className="container cp-hero-grid">
      <div className="cp-hero-texto">
        <span className="cp-etiqueta">Plano de carreira</span>
        <h1>Menos perguntas. Mais caminhos claros.</h1>
        <p>
          Responda 4 perguntas rápidas e receba uma lista de profissões e formas de empreender
          que combinam com sua rotina.
        </p>
        <div className="cp-hero-chips">
          <span>Leve e rápido</span>
          <span>Cards com percentuais</span>
          <span>Profissões e renda extra</span>
        </div>
      </div>

      <aside className="cp-hero-box">
        <span className="cp-hero-mini">Como funciona</span>
        <h3>Você responde, a plataforma organiza.</h3>
        <ol className="cp-hero-lista">
          <li>Perguntas curtas.</li>
          <li>Resultado em cards.</li>
          <li>Destaque para caminhos práticos.</li>
        </ol>
      </aside>
        </div>
      </section>

      {!mostrarPlano && (
      <section className="cp-questionario" id="cp-questionario">
        <div className="container">
          <div className="cp-secao-topo">
            <div>
              <span className="cp-etiqueta">Perguntas rápidas</span>
              <h2>Escolha o que combina com você</h2>
              <p>São apenas quatro etapas rápidas para chegar a um plano feito para você.</p>
            </div>
            <div className="cp-progresso">
              <strong>{passo + 1}/4</strong>
              <span>{PASSOS[passo]}</span>
            </div>
          </div>

          <div className="cp-question-card">
            {renderPergunta()}

            <div className="cp-acoes">
              <button type="button" className="btn-secundario" onClick={() => setPasso((v) => Math.max(0, v - 1))} disabled={passo === 0}>
                Voltar
              </button>
              {passo < maxPasso ? (
                <button type="button" className="btn-primario" onClick={() => setPasso((v) => Math.min(maxPasso, v + 1))}>
                  Próxima
                </button>
              ) : (
                <button type="button" className="btn-primario" onClick={gerarPlano}>
                  Ver meu plano
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="cp-resultados" id="cp-resultados" aria-live="polite" aria-atomic="true">
        <div className="container">
          <div className="cp-resultados-topo">
            <div>
              <h2>{mostrarPlano ? 'Seu plano personalizado' : 'Encontre caminhos para o seu futuro'}</h2>
              <p>
                {mostrarPlano
                  ? 'Este plano fica salvo para você consultar quando quiser. Considere 70% ou mais como um bom ponto de partida.'
                  : 'Responda às perguntas acima para receber opções de profissão e empreendedorismo alinhadas à sua rotina.'}
              </p>
            </div>
            {mostrarPlano && (
              <button type="button" className="cp-limpar" onClick={refazer}>
                Refazer meu plano
              </button>
            )}
          </div>

          {!mostrarPlano ? (
            <div className="cp-vazio">
              <h3>Faça as 4 perguntas para ver os cards</h3>
              <p>Depois disso, a plataforma mostrará os caminhos mais compatíveis com você.</p>
            </div>
          ) : (
            <>
              <div className="cp-grid">
                {resultados.map((item) => (
                  <ResultadoCard
                    key={item.id}
                    item={item}
                    ativo={selecionado?.id === item.id}
                    favoritado={favoritos.includes(item.id)}
                    onSelecionar={() => setSelecionadoId(item.id)}
                    onFavoritar={() => alternarFavorito(item.id)}
                  />
                ))}
              </div>

              {selecionado && (
                <article className="cp-detalhe" aria-live="polite" aria-atomic="true">
                  <div className="cp-detalhe-cabeca">
                    <div>
                      <span className={`cp-tag ${selecionado.tipo === 'Empreender' ? 'empreender' : 'profissao'}`}>
                        {selecionado.tipo}
                      </span>
                      <h3>{selecionado.titulo}</h3>
                      <p>{selecionado.comoComecar}</p>
                    </div>
                    <div className="cp-detalhe-percentual">
                      <strong>{selecionado.percent}%</strong>
                      <span>compatibilidade</span>
                    </div>
                  </div>

                  <div className="cp-detalhe-grade">
                    {selecionado.passos.map((passoItem) => (
                      <span key={passoItem} className="cp-detalhe-passos">
                        {passoItem}
                      </span>
                    ))}
                  </div>

                  <div className="cp-detalhe-acoes">
                    <Link to="/" className="btn-secundario">
                      Ver feed
                    </Link>
                    <Link to="/mapa" className="btn-secundario">
                      Abrir mapa
                    </Link>
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
