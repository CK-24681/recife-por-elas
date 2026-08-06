import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../utils/toast';

type Coordenadas = [number, number];
type TipoPonto = 'escola' | 'emprego' | 'hospital' | 'maternidade' | 'mae_coruja';

interface PontoMapa {
  id: string;
  tipo: TipoPonto;
  titulo: string;
  descricao: string;
  bairro: string;
  endereco: string;
  telefone: string;
  horario: string;
  coords: Coordenadas;
  fonte: string;
}

type GeoRing = Array<[number, number]>;
type GeoPolygon = GeoRing[];

interface BairroFeature {
  properties?: Record<string, unknown>;
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: GeoPolygon | GeoPolygon[];
  };
}

interface DadosMapa {
  pontos: PontoMapa[];
  bairros: BairroFeature[];
  redeCredenciada: number;
}

interface Limites {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const CONFIG_TIPO: Record<TipoPonto, { cor: string; corFundo: string; emoji: string; rotulo: string }> = {
  escola: { cor: '#15803d', corFundo: '#dcfce7', emoji: '📚', rotulo: 'Escolas profissionalizantes' },
  emprego: { cor: '#1d4ed8', corFundo: '#dbeafe', emoji: '💼', rotulo: 'Postos de emprego' },
  hospital: { cor: '#be123c', corFundo: '#ffe4e6', emoji: '✚', rotulo: 'Hospitais' },
  maternidade: { cor: '#db2777', corFundo: '#fce7f3', emoji: '♡', rotulo: 'Maternidades' },
  mae_coruja: { cor: '#c2410c', corFundo: '#ffedd5', emoji: '●', rotulo: 'Mãe Coruja' },
};

const FILTROS: Array<{ valor: TipoPonto | ''; rotulo: string; corAtiva: string }> = [
  { valor: '', rotulo: 'Todos', corAtiva: '#475569' },
  { valor: 'escola', rotulo: 'Escolas', corAtiva: '#15803d' },
  { valor: 'emprego', rotulo: 'Emprego', corAtiva: '#1d4ed8' },
  { valor: 'hospital', rotulo: 'Hospitais', corAtiva: '#be123c' },
  { valor: 'maternidade', rotulo: 'Maternidades', corAtiva: '#db2777' },
  { valor: 'mae_coruja', rotulo: 'Mãe Coruja', corAtiva: '#c2410c' },
];

const CAMINHO_DADOS = `${import.meta.env.BASE_URL}dados/mapa`;

function normalizarChave(valor: string): string {
  return valor
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function dividirLinhaCsv(linha: string): string[] {
  const valores: string[] = [];
  let atual = '';
  let entreAspas = false;

  for (let indice = 0; indice < linha.length; indice += 1) {
    const caractere = linha[indice];
    const proximo = linha[indice + 1];

    if (caractere === '"' && entreAspas && proximo === '"') {
      atual += '"';
      indice += 1;
      continue;
    }

    if (caractere === '"') {
      entreAspas = !entreAspas;
    } else if (caractere === ';' && !entreAspas) {
      valores.push(atual.trim());
      atual = '';
    } else {
      atual += caractere;
    }
  }

  valores.push(atual.trim());
  return valores;
}

function lerCsv(conteudo: string): Array<Record<string, string>> {
  const linhas = conteudo
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((linha) => linha.trim().length > 0);

  if (linhas.length < 2) return [];

  const cabecalho = dividirLinhaCsv(linhas[0]).map(normalizarChave);
  return linhas.slice(1).map((linha) => {
    const valores = dividirLinhaCsv(linha);
    return cabecalho.reduce<Record<string, string>>((registro, chave, indice) => {
      registro[chave] = valores[indice] ?? '';
      return registro;
    }, {});
  });
}

function campo(registro: Record<string, string>, ...chaves: string[]): string {
  for (const chave of chaves) {
    const valor = registro[normalizarChave(chave)]?.trim();
    if (valor) return valor;
  }
  return '';
}

function numero(valor: string): number | null {
  const resultado = Number(String(valor).trim().replace(',', '.'));
  return Number.isFinite(resultado) ? resultado : null;
}

function formatarNome(valor: string): string {
  const limpo = valor.replace(/\s+/g, ' ').trim();
  if (!limpo) return 'Ponto de atendimento';

  const base = limpo === limpo.toUpperCase() ? limpo.toLocaleLowerCase('pt-BR') : limpo;
  return base.replace(/(^|[\s/-])([a-záàâãéêíóôõúç])/gi, (_match, separador: string, letra: string) => (
    `${separador}${letra.toLocaleUpperCase('pt-BR')}`
  ));
}

function formatarEndereco(logradouro: string, bairro: string): string {
  const partes = [formatarNome(logradouro), formatarNome(bairro)].filter((item) => item !== 'Ponto de atendimento');
  return partes.join(' · ') || 'Endereço não informado';
}

function resumo(texto: string, limite = 280): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return limpo.length > limite ? `${limpo.slice(0, limite - 1)}…` : limpo;
}

function coordenadasDoRegistro(registro: Record<string, string>): Coordenadas | null {
  const lat = numero(campo(registro, 'latitude'));
  const lng = numero(campo(registro, 'longitude'));
  if (lat === null || lng === null) return null;
  return [lat, lng];
}

function criarPonto(
  registro: Record<string, string>,
  tipo: TipoPonto,
  indice: number,
  fonte: string,
  tituloChave: string,
  descricaoChaves: string[],
): PontoMapa | null {
  const coords = coordenadasDoRegistro(registro);
  if (!coords) return null;

  const bairro = formatarNome(campo(registro, 'bairro'));
  const logradouro = campo(registro, 'logradouro', 'endereco');
  const descricao = descricaoChaves
    .map((chave) => campo(registro, chave))
    .filter(Boolean)
    .join(' ');

  return {
    id: `${tipo}-${indice}`,
    tipo,
    titulo: formatarNome(campo(registro, tituloChave)),
    descricao: resumo(descricao || `Ponto oficial de ${CONFIG_TIPO[tipo].rotulo.toLocaleLowerCase('pt-BR')}.`),
    bairro,
    endereco: formatarEndereco(logradouro, bairro),
    telefone: campo(registro, 'telefone', 'fone'),
    horario: campo(registro, 'horario'),
    coords,
    fonte,
  };
}

function extrairCoordenadasBairro(feature: BairroFeature): Coordenadas[] {
  const geometria = feature.geometry;
  if (!geometria) return [];

  const poligonos: GeoPolygon[] = geometria.type === 'Polygon'
    ? [geometria.coordinates as GeoPolygon]
    : geometria.coordinates as GeoPolygon[];

  return poligonos.flatMap((poligono) => poligono.flatMap((anel) => (
    anel.map(([lng, lat]) => [lat, lng] as Coordenadas)
  )));
}

function pathDoBairro(feature: BairroFeature, limites: Limites): string[] {
  const geometria = feature.geometry;
  if (!geometria) return [];

  const poligonos: GeoPolygon[] = geometria.type === 'Polygon'
    ? [geometria.coordinates as GeoPolygon]
    : geometria.coordinates as GeoPolygon[];

  return poligonos.flatMap((poligono) => poligono.map((anel) => {
    const comandos = anel.map(([lng, lat], indice) => {
      const posicao = projectarPonto([lat, lng], limites);
      return `${indice === 0 ? 'M' : 'L'}${posicao.x},${posicao.y}`;
    });
    return `${comandos.join(' ')} Z`;
  }));
}

async function buscarTexto(nome: string): Promise<string> {
  const resposta = await fetch(`${CAMINHO_DADOS}/${nome}`);
  if (!resposta.ok) throw new Error(`Não foi possível carregar ${nome}`);
  return resposta.text();
}

async function buscarJson(nome: string): Promise<{ features?: BairroFeature[] }> {
  const resposta = await fetch(`${CAMINHO_DADOS}/${nome}`);
  if (!resposta.ok) throw new Error(`Não foi possível carregar ${nome}`);
  return resposta.json() as Promise<{ features?: BairroFeature[] }>;
}

async function carregarDadosMapa(): Promise<DadosMapa> {
  const [escolasCsv, empregosCsv, hospitaisCsv, maternidadesCsv, maeCorujaCsv, redeCsv, bairrosJson] = await Promise.all([
    buscarTexto('escolas-profissionalizantes.csv'),
    buscarTexto('postos-emprego.csv'),
    buscarTexto('hospitais.csv'),
    buscarTexto('maternidades.csv'),
    buscarTexto('mae-coruja.csv'),
    buscarTexto('rede-credenciada.csv'),
    buscarJson('bairros-recife.geojson'),
  ]);

  const pontos = [
    ...lerCsv(escolasCsv).map((registro, indice) => criarPonto(
      registro,
      'escola',
      indice,
      'Escolas profissionalizantes',
      'nome',
      ['observacao'],
    )),
    ...lerCsv(empregosCsv).map((registro, indice) => criarPonto(
      registro,
      'emprego',
      indice,
      'Postos do sistema público de emprego',
      'unidade',
      ['horario'],
    )),
    ...lerCsv(hospitaisCsv).map((registro, indice) => criarPonto(
      registro,
      'hospital',
      indice,
      'Hospitais',
      'nome_oficial',
      ['especialidade', 'como_usar'],
    )),
    ...lerCsv(maternidadesCsv).map((registro, indice) => criarPonto(
      registro,
      'maternidade',
      indice,
      'Maternidades',
      'nome_oficial',
      ['especialidade', 'como_usar'],
    )),
    ...lerCsv(maeCorujaCsv).map((registro, indice) => criarPonto(
      registro,
      'mae_coruja',
      indice,
      'Espaços Mãe Coruja',
      'nome_oficial',
      ['especialidade', 'como_usar'],
    )),
  ].filter((ponto): ponto is PontoMapa => ponto !== null);

  return {
    pontos,
    bairros: Array.isArray(bairrosJson.features) ? bairrosJson.features : [],
    redeCredenciada: lerCsv(redeCsv).length,
  };
}

function getCfg(tipo: TipoPonto) {
  return CONFIG_TIPO[tipo];
}

function linkGoogleMapsExterno(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function projectarPonto(
  coords: Coordenadas,
  limites: Limites,
) {
  const largura = Math.max(0.0001, limites.maxLng - limites.minLng);
  const altura = Math.max(0.0001, limites.maxLat - limites.minLat);
  const x = ((coords[1] - limites.minLng) / largura) * 100;
  const y = (1 - (coords[0] - limites.minLat) / altura) * 100;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

function calcularLimites(pontos: Coordenadas[]): Limites {
  const latitudes = pontos.map(([lat]) => lat);
  const longitudes = pontos.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const paddingLat = Math.max(0.008, (maxLat - minLat) * 0.05 || 0.008);
  const paddingLng = Math.max(0.008, (maxLng - minLng) * 0.05 || 0.008);

  return {
    minLat: minLat - paddingLat,
    maxLat: maxLat + paddingLat,
    minLng: minLng - paddingLng,
    maxLng: maxLng + paddingLng,
  };
}

function nomeCurtoLocal(ponto: PontoMapa): string {
  return ponto.bairro || ponto.endereco || 'Recife';
}

export default function Mapa() {
  const [filtro, setFiltro] = useState<TipoPonto | ''>('');
  const [dados, setDados] = useState<DadosMapa>({ pontos: [], bairros: [], redeCredenciada: 0 });
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [posicaoUsuario, setPosicaoUsuario] = useState<Coordenadas | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    let montado = true;

    carregarDadosMapa()
      .then((resultado) => {
        if (!montado) return;
        setDados(resultado);
        setEstado('ok');
      })
      .catch(() => {
        if (!montado) return;
        setEstado('erro');
        toast.erro('Não foi possível carregar os pontos oficiais do mapa.');
      });

    return () => {
      montado = false;
    };
  }, []);

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.erro('Geolocalização não suportada neste navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setPosicaoUsuario([posicao.coords.latitude, posicao.coords.longitude]);
        toast.sucesso('Localização obtida!');
      },
      () => toast.erro('Não foi possível obter a localização.'),
    );
  };

  const filtrados = useMemo(
    () => filtro ? dados.pontos.filter((ponto) => ponto.tipo === filtro) : dados.pontos,
    [dados.pontos, filtro],
  );

  const selecionadoAtual = filtrados.find((ponto) => ponto.id === selecionado) ?? filtrados[0] ?? null;

  useEffect(() => {
    if (!selecionadoAtual) {
      setSelecionado(null);
      return;
    }
    if (!selecionado || !filtrados.some((ponto) => ponto.id === selecionado)) {
      setSelecionado(selecionadoAtual.id);
    }
  }, [filtrados, selecionado, selecionadoAtual]);

  const limites = useMemo(() => {
    const coordenadasBairros = dados.bairros.flatMap(extrairCoordenadasBairro);
    const pontosBase = [...coordenadasBairros, ...filtrados.map((ponto) => ponto.coords)];
    if (posicaoUsuario) pontosBase.push(posicaoUsuario);

    return pontosBase.length > 0
      ? calcularLimites(pontosBase)
      : { minLat: -8.12, maxLat: -7.98, minLng: -34.98, maxLng: -34.84 };
  }, [dados.bairros, filtrados, posicaoUsuario]);

  const caminhosBairros = useMemo(
    () => dados.bairros.flatMap((bairro) => pathDoBairro(bairro, limites)),
    [dados.bairros, limites],
  );

  const total = filtrados.length;

  return (
    <>
      <section className="mapa-secao">
        <div className="container">
          <h1 className="mapa-titulo">Mapa de oportunidades</h1>
          <p className="mapa-subtitulo">
            Pontos oficiais dos arquivos públicos enviados, organizados por localização em Recife.
          </p>

          <button
            type="button"
            onClick={obterLocalizacao}
            className={`map-loc-btn ${posicaoUsuario ? 'map-loc-btn--ativo' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {posicaoUsuario ? 'Localização ativa' : 'Usar minha localização'}
          </button>
        </div>
      </section>

      <section className="container mapa-secao-padding">
        {estado === 'carregando' ? (
          <div className="mapa-carregando" aria-label="Carregando mapa" />
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <h3>Não foi possível carregar o mapa</h3>
            <p>Confira se os arquivos locais estão dentro da pasta pública da aplicação.</p>
            <button type="button" className="btn-secundario" onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="mapa-layout">
            <div className="mapa-canvas">
              <div className="map-filtros-flutuante">
                {FILTROS.map((item) => {
                  const ativo = filtro === item.valor;
                  return (
                    <button
                      key={item.valor || 'todos'}
                      type="button"
                      className={`map-filtro-btn ${ativo ? 'map-filtro-btn--ativo' : ''}`}
                      onClick={() => setFiltro(item.valor)}
                      style={ativo ? { background: item.corAtiva, borderColor: item.corAtiva, color: '#fff' } : undefined}
                      aria-pressed={ativo}
                    >
                      {item.rotulo}
                    </button>
                  );
                })}
              </div>

              <div className="mapa-mapa-real">
                <div className="mapa-preview-badge">Base geográfica local</div>
                <div className="mapa-mapa-topo">
                  <div>
                    <h2>Pontos reais no Recife</h2>
                    <p>Os contornos mostram os bairros e os marcadores usam somente coordenadas presentes nos arquivos.</p>
                  </div>
                  <div className="mapa-mapa-resumo">
                    <strong>{total}</strong>
                    <span>ponto{total === 1 ? '' : 's'} no filtro</span>
                  </div>
                </div>

                <div className="mapa-mapa-superficie">
                  <svg viewBox="0 0 100 100" className="mapa-svg" role="img" aria-label="Mapa local de pontos de oportunidades do Recife">
                    <defs>
                      <linearGradient id="mapa-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f8fbff" />
                        <stop offset="100%" stopColor="#eef4ff" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" fill="url(#mapa-bg)" />
                    {caminhosBairros.map((caminho, indice) => (
                      <path
                        key={`bairro-${indice}`}
                        d={caminho}
                        fill="rgba(255, 255, 255, 0.48)"
                        stroke="rgba(100, 116, 139, 0.34)"
                        strokeWidth="0.12"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    {filtrados.map((ponto) => {
                      const ativo = selecionado === ponto.id;
                      const posicao = projectarPonto(ponto.coords, limites);
                      const cfg = getCfg(ponto.tipo);

                      return (
                        <g
                          key={ponto.id}
                          className={`mapa-ponto ${ativo ? 'mapa-ponto--ativo' : ''}`}
                          transform={`translate(${posicao.x} ${posicao.y})`}
                          onClick={() => setSelecionado(ponto.id)}
                          onKeyDown={(evento) => {
                            if (evento.key === 'Enter' || evento.key === ' ') {
                              evento.preventDefault();
                              setSelecionado(ponto.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${ponto.titulo}, ${nomeCurtoLocal(ponto)}`}
                        >
                          <circle cx="0" cy="0" r={ativo ? 3.1 : 2.3} fill={cfg.cor} opacity="0.2" />
                          <circle cx="0" cy="0" r={ativo ? 2.2 : 1.7} fill={cfg.cor} stroke="#fff" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                          <circle cx="0" cy="0" r={ativo ? 4.8 : 3.6} fill="transparent" stroke={cfg.cor} strokeWidth={ativo ? 1.4 : 0.8} opacity="0.82" vectorEffect="non-scaling-stroke" />
                          <title>{ponto.titulo}</title>
                        </g>
                      );
                    })}
                    {posicaoUsuario && (
                      <g transform={`translate(${projectarPonto(posicaoUsuario, limites).x} ${projectarPonto(posicaoUsuario, limites).y})`} aria-label="Sua localização">
                        <circle cx="0" cy="0" r="4" fill="#ef4444" opacity="0.2" />
                        <circle cx="0" cy="0" r="2.3" fill="#ef4444" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                      </g>
                    )}
                  </svg>

                  <div className="mapa-mapa-overlay">
                    <div className="mapa-mapa-card">
                      <strong>{selecionadoAtual ? selecionadoAtual.titulo : 'Selecione um ponto'}</strong>
                      <span>{selecionadoAtual ? nomeCurtoLocal(selecionadoAtual) : 'Clique em um marcador para ver os detalhes'}</span>
                    </div>
                    {selecionadoAtual && (
                      <a
                        className="mapa-preview-btn mapa-preview-btn--inline"
                        href={linkGoogleMapsExterno(selecionadoAtual.coords[0], selecionadoAtual.coords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir no Google Maps
                      </a>
                    )}
                  </div>
                </div>

                <div className="mapa-badge">
                  {total} ponto{total === 1 ? '' : 's'} com coordenadas reais
                </div>
              </div>
            </div>

            <aside className="mapa-painel">
              <div>
                <span className="secao-etiqueta" style={{ marginBottom: 12 }}>Selecionado</span>
                {selecionadoAtual ? (
                  <div className="mapa-card">
                    <span
                      className="mapa-popup-tag"
                      style={{
                        color: getCfg(selecionadoAtual.tipo).cor,
                        background: getCfg(selecionadoAtual.tipo).corFundo,
                      }}
                    >
                      {getCfg(selecionadoAtual.tipo).emoji} {getCfg(selecionadoAtual.tipo).rotulo}
                    </span>
                    <h3 className="mapa-popup-titulo" style={{ marginTop: 8 }}>
                      {selecionadoAtual.titulo}
                    </h3>
                    <p className="mapa-popup-empresa">Fonte: {selecionadoAtual.fonte}</p>
                    <p className="mapa-popup-end">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{selecionadoAtual.endereco}</span>
                    </p>
                    {selecionadoAtual.telefone && <p className="mapa-popup-empresa">Telefone: {selecionadoAtual.telefone}</p>}
                    {selecionadoAtual.horario && <p className="mapa-popup-empresa">Horário: {selecionadoAtual.horario}</p>}
                    <p className="mapa-popup-desc" style={{ marginTop: 10 }}>
                      {selecionadoAtual.descricao}
                    </p>
                    <div className="mapa-acoes">
                      <a
                        href={linkGoogleMapsExterno(selecionadoAtual.coords[0], selecionadoAtual.coords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mapa-btn-chegar"
                      >
                        Abrir endereço no Google Maps
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="fd-vazio" style={{ margin: 0, minHeight: 220 }}>
                    <h3>Sem pontos</h3>
                    <p>Não há pontos com coordenadas neste filtro.</p>
                  </div>
                )}
              </div>

              <div className="mapa-legenda">
                {Object.entries(CONFIG_TIPO).map(([tipo, cfg]) => (
                  <div key={tipo} className="mapa-legenda-item">
                    <span className="mapa-legenda-cor" style={{ background: cfg.cor }} />
                    <span>{cfg.rotulo}</span>
                  </div>
                ))}
              </div>

              <div className="mapa-fonte-nota">
                <strong>Base utilizada</strong>
                <span>{dados.pontos.length} pontos com latitude e longitude nos arquivos enviados.</span>
                <small>{dados.redeCredenciada} registros da rede credenciada foram mantidos na base, mas não viraram pinos porque o CSV não possui coordenadas.</small>
              </div>

              <div className="mapa-lista">
                <span className="secao-etiqueta" style={{ marginBottom: 8 }}>Pontos no filtro</span>
                {filtrados.map((ponto, indice) => {
                  const ativo = selecionado === ponto.id;
                  return (
                    <button
                      key={ponto.id}
                      type="button"
                      className={`mapa-lista-item ${ativo ? 'ativo' : ''}`}
                      onClick={() => setSelecionado(ponto.id)}
                    >
                      <span className="mapa-lista-num">{indice + 1}</span>
                      <span className="mapa-lista-texto">
                        <strong>{ponto.titulo}</strong>
                        <small>{nomeCurtoLocal(ponto)}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        )}
      </section>

      {toast.container}
    </>
  );
}
