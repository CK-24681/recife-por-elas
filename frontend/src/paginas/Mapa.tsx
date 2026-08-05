import { useEffect, useMemo, useState } from 'react';
import { apiJSON } from '../services/api';
import { useToast } from '../utils/toast';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito' | 'Apoio' | string;
  fonte?: string;
  link_inscricao?: string;
  bairro?: string;
  endereco?: string;
  endereco_completo?: string;
  latitude: number | null;
  longitude: number | null;
  horario?: string;
  isOnline?: boolean;
  data_inicio_inscricao?: string;
  data_fim_inscricao?: string;
  localizacao?: {
    lat: number;
    lng: number;
  };
}

type Coordenadas = [number, number];

const CONFIG_TIPO: Record<string, { cor: string; corFundo: string; emoji: string; rotulo: string }> = {
  Emprego: { cor: '#1d4ed8', corFundo: '#dbeafe', emoji: '💼', rotulo: 'Emprego' },
  Curso: { cor: '#15803d', corFundo: '#dcfce7', emoji: '📚', rotulo: 'Curso' },
  'Benefício social': { cor: '#ea580c', corFundo: '#fed7aa', emoji: '🧡', rotulo: 'Benefício' },
  Microcrédito: { cor: '#db2777', corFundo: '#fce7f3', emoji: '💰', rotulo: 'Microcrédito' },
  Apoio: { cor: '#7c3aed', corFundo: '#ede9fe', emoji: '🤝', rotulo: 'Rede de apoio' },
};

const FILTROS = [
  { valor: '', rotulo: 'Todas', corAtiva: '#475569' },
  { valor: 'Emprego', rotulo: 'Empregos', corAtiva: '#1d4ed8' },
  { valor: 'Curso', rotulo: 'Cursos', corAtiva: '#15803d' },
  { valor: 'Benefício social', rotulo: 'Benefícios', corAtiva: '#ea580c' },
  { valor: 'Apoio', rotulo: 'Rede de apoio', corAtiva: '#7c3aed' },
];

function extrairCoordenadas(op: Oportunidade): Coordenadas | null {
  const lat = Number(op.latitude ?? op.localizacao?.lat);
  const lng = Number(op.longitude ?? op.localizacao?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function getCfg(tipo: string) {
  return CONFIG_TIPO[tipo] ?? { cor: '#db2777', corFundo: '#fce7f3', emoji: '📍', rotulo: tipo };
}

function linkGoogleMapsExterno(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=0&pitch=0&fov=80`;
}

function destaqueTexto(texto: string, max = 180): string {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1)}…` : limpo;
}

function getTitulo(op: Oportunidade) {
  return String(op.titulo || 'Oportunidade');
}

function projectarPonto(
  coords: Coordenadas,
  limite: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const largura = Math.max(0.0001, limite.maxLng - limite.minLng);
  const altura = Math.max(0.0001, limite.maxLat - limite.minLat);
  const x = ((coords[1] - limite.minLng) / largura) * 100;
  const y = (1 - (coords[0] - limite.minLat) / altura) * 100;
  const xAjustado = Math.max(4, Math.min(96, x));
  const yAjustado = Math.max(4, Math.min(96, y));
  return { x: xAjustado, y: yAjustado };
}

function calcularLimites(pontos: Coordenadas[]) {
  const latitudes = pontos.map(([lat]) => lat);
  const longitudes = pontos.map(([, lng]) => lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const paddingLat = Math.max(0.02, (maxLat - minLat) * 0.16 || 0.02);
  const paddingLng = Math.max(0.02, (maxLng - minLng) * 0.16 || 0.02);
  return {
    minLat: minLat - paddingLat,
    maxLat: maxLat + paddingLat,
    minLng: minLng - paddingLng,
    maxLng: maxLng + paddingLng,
  };
}

function nomeCurtoLocal(op: Oportunidade) {
  return op.bairro || op.endereco_completo || op.endereco || 'Recife';
}

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('ok');
  const [posicaoUsuario, setPosicaoUsuario] = useState<Coordenadas | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (mounted) setEstado('carregando');
      try {
        const [internas, externas] = await Promise.all([
          apiJSON<Oportunidade[]>('/oportunidades').catch(() => [] as Oportunidade[]),
          apiJSON<Oportunidade[]>('/oportunidades/externas').catch(() => [] as Oportunidade[]),
        ]);
        if (!mounted) return;
        setOportunidades([...internas, ...externas]);
        setEstado('ok');
      } catch {
        if (!mounted) return;
        setEstado('erro');
        setOportunidades([]);
        toast.erro('Erro ao carregar oportunidades.');
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.erro('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordenadas = [pos.coords.latitude, pos.coords.longitude];
        setPosicaoUsuario(coords);
        toast.sucesso('Localização obtida!');
      },
      () => toast.erro('Não foi possível obter a localização.'),
    );
  };

  const pontosComCoords = oportunidades
    .filter((o) => !o.isOnline)
    .map((op) => ({ op, coords: extrairCoordenadas(op) }))
    .filter((item): item is { op: Oportunidade; coords: Coordenadas } => item.coords !== null);

  const filtrados = filtro
    ? pontosComCoords.filter((item) => item.op.tipo === filtro)
    : pontosComCoords;

  const selecionadoAtual =
    filtrados.find((item) => String(item.op.id ?? item.op.titulo) === selecionado) ?? filtrados[0] ?? null;

  useEffect(() => {
    const primeiro = filtrados[0];
    if (!selecionado && primeiro) {
      setSelecionado(String(primeiro.op.id ?? primeiro.op.titulo));
      return;
    }
    if (selecionado && !filtrados.some((item) => String(item.op.id ?? item.op.titulo) === selecionado)) {
      setSelecionado(primeiro ? String(primeiro.op.id ?? primeiro.op.titulo) : null);
    }
  }, [selecionado, filtrados]);

  const total = filtrados.length;
  const limites = useMemo(() => {
    const pontosBase = filtrados.map((item) => item.coords);
    if (posicaoUsuario) pontosBase.push(posicaoUsuario);
    if (pontosBase.length === 0) {
      return { minLat: -8.2, maxLat: -7.9, minLng: -34.95, maxLng: -34.75 };
    }
    if (pontosBase.length === 1) {
      const [lat, lng] = pontosBase[0];
      return { minLat: lat - 0.04, maxLat: lat + 0.04, minLng: lng - 0.04, maxLng: lng + 0.04 };
    }
    return calcularLimites(pontosBase);
  }, [filtrados, posicaoUsuario]);

  return (
    <>
      <section className="mapa-secao">
        <div className="container">
          <h1 className="mapa-titulo">Mapa de Oportunidades</h1>
          <p className="mapa-subtitulo">
            Street View aberto direto no Google Maps para evitar bloqueio de embed.
          </p>

          <button
            onClick={obterLocalizacao}
            className={`map-loc-btn ${posicaoUsuario ? 'map-loc-btn--ativo' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {posicaoUsuario ? 'Localização ativa ✓' : 'Usar minha localização'}
          </button>
        </div>
      </section>

      <section className="container mapa-secao-padding">
        {estado === 'carregando' ? (
          <div className="mapa-carregando" aria-label="Carregando mapa…" />
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar os pontos do mapa.</p>
            <button className="btn-secundario" onClick={() => window.location.reload()}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="mapa-layout">
            <div className="mapa-canvas">
              <div className="map-filtros-flutuante">
                {FILTROS.map((f) => {
                  const ativo = filtro === f.valor;
                  return (
                    <button
                      key={f.valor}
                      className={`map-filtro-btn ${ativo ? 'map-filtro-btn--ativo' : ''}`}
                      onClick={() => setFiltro(f.valor)}
                      style={ativo ? { background: f.corAtiva, borderColor: f.corAtiva, color: '#fff' } : undefined}
                      aria-pressed={ativo}
                    >
                      <span className="map-filtro-rotulo">{f.rotulo}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mapa-mapa-real">
                <div className="mapa-preview-badge">Mapa com pontos de referência</div>
                <div className="mapa-mapa-topo">
                  <div>
                    <h2>Pontos visíveis no mapa</h2>
                    <p>Clique em um marcador para ver os detalhes e abrir o Street View do local selecionado.</p>
                  </div>
                  <div className="mapa-mapa-resumo">
                    <strong>{total}</strong>
                    <span>ponto{total === 1 ? '' : 's'} no filtro</span>
                  </div>
                </div>

                <div className="mapa-mapa-superficie">
                  <svg viewBox="0 0 100 100" className="mapa-svg" role="img" aria-label="Mapa de oportunidades com pontos de referência">
                    <defs>
                      <linearGradient id="mapa-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#eff6ff" />
                        <stop offset="100%" stopColor="#f8fafc" />
                      </linearGradient>
                      <radialGradient id="mapa-glow" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="rgba(219,39,119,0.18)" />
                        <stop offset="100%" stopColor="rgba(219,39,119,0)" />
                      </radialGradient>
                    </defs>
                    <rect x="0" y="0" width="100" height="100" rx="18" fill="url(#mapa-bg)" />
                    <circle cx="74" cy="24" r="24" fill="url(#mapa-glow)" />
                    <path d="M8 76 C22 66, 26 78, 36 70 S58 62, 66 68 S80 77, 94 66" fill="none" stroke="#dbeafe" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M10 28 C18 24, 24 20, 30 24 S44 38, 52 32 S68 18, 82 28 S92 44, 98 40" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    <path d="M14 52 C24 46, 34 48, 42 55 S58 63, 68 57 S82 48, 92 52" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" />
                    {filtrados.map((item, index) => {
                      const key = String(item.op.id ?? item.op.titulo);
                      const ativo = selecionado === key;
                      const pos = projectarPonto(item.coords, limites);
                      const cfg = getCfg(item.op.tipo);
                      return (
                        <g
                          key={key}
                          className={`mapa-ponto ${ativo ? 'mapa-ponto--ativo' : ''}`}
                          transform={`translate(${pos.x} ${pos.y})`}
                          onClick={() => setSelecionado(key)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSelecionado(key);
                          }}
                        >
                          <circle cx="0" cy="0" r={ativo ? 2.8 : 2.2} fill={cfg.cor} opacity="0.22" />
                          <circle cx="0" cy="0" r={ativo ? 2.1 : 1.8} fill={cfg.cor} stroke="#fff" strokeWidth="1.2" />
                          <circle cx="0" cy="0" r={ativo ? 4.5 : 3.6} fill="transparent" stroke={cfg.cor} strokeWidth={ativo ? 1.4 : 1} opacity="0.8" />
                          <g transform="translate(0 -5)">
                            <rect x="-7" y="-8" width="14" height="6" rx="3" fill="#fff" opacity="0.9" />
                            <text x="0" y="-3.4" textAnchor="middle" fontSize="4" fontWeight="700" fill={cfg.cor}>{index + 1}</text>
                          </g>
                          <title>{getTitulo(item.op)}</title>
                        </g>
                      );
                    })}
                    {posicaoUsuario ? (
                      <g transform={`translate(${projectarPonto(posicaoUsuario, limites).x} ${projectarPonto(posicaoUsuario, limites).y})`}>
                        <circle cx="0" cy="0" r="3.8" fill="#ef4444" opacity="0.25" />
                        <circle cx="0" cy="0" r="2.3" fill="#ef4444" stroke="#fff" strokeWidth="1.2" />
                      </g>
                    ) : null}
                  </svg>

                  <div className="mapa-mapa-overlay">
                    <div className="mapa-mapa-card">
                      <strong>{selecionadoAtual ? getTitulo(selecionadoAtual.op) : 'Selecione um ponto'}</strong>
                      <span>{selecionadoAtual ? nomeCurtoLocal(selecionadoAtual.op) : 'Clique em um marcador para ver o local'}</span>
                    </div>
                    {selecionadoAtual ? (
                      <a
                        className="mapa-preview-btn mapa-preview-btn--inline"
                        href={linkGoogleMapsExterno(selecionadoAtual.coords[0], selecionadoAtual.coords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir Street View
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mapa-badge">
                  {total} ponto{total === 1 ? '' : 's'} com coordenadas no filtro atual
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
                        color: getCfg(selecionadoAtual.op.tipo).cor,
                        background: getCfg(selecionadoAtual.op.tipo).corFundo,
                      }}
                    >
                      {getCfg(selecionadoAtual.op.tipo).emoji} {getCfg(selecionadoAtual.op.tipo).rotulo}
                    </span>
                    <h3 className="mapa-popup-titulo" style={{ marginTop: 8 }}>
                      {getTitulo(selecionadoAtual.op)}
                    </h3>
                    {selecionadoAtual.op.empresa && (
                      <p className="mapa-popup-empresa">{selecionadoAtual.op.empresa}</p>
                    )}
                    <p className="mapa-popup-end">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{selecionadoAtual.op.endereco_completo || selecionadoAtual.op.endereco || selecionadoAtual.op.bairro || 'Sem endereço informado'}</span>
                    </p>
                    <p className="mapa-popup-desc" style={{ marginTop: 10 }}>
                      {destaqueTexto(selecionadoAtual.op.descricao)}
                    </p>
                    <div className="mapa-acoes">
                      <a
                        href={linkGoogleMapsExterno(selecionadoAtual.coords[0], selecionadoAtual.coords[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mapa-btn-chegar"
                      >
                        Abrir Street View no Google Maps
                      </a>
                      {selecionadoAtual.op.link_inscricao && (
                        <a
                          href={selecionadoAtual.op.link_inscricao}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mapa-btn-detalhes"
                        >
                          Abrir oportunidade →
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="fd-vazio" style={{ margin: 0, minHeight: 220 }}>
                    <h3>Sem pontos</h3>
                    <p>Não encontrei oportunidades com coordenadas para este filtro.</p>
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

              <div className="mapa-lista">
                <span className="secao-etiqueta" style={{ marginBottom: 8 }}>Pontos no filtro</span>
                {filtrados.slice(0, 8).map((item, index) => {
                  const key = String(item.op.id ?? item.op.titulo);
                  const ativo = selecionado === key;
                  return (
                    <button
                      key={key}
                      className={`mapa-lista-item ${ativo ? 'ativo' : ''}`}
                      onClick={() => setSelecionado(key)}
                    >
                      <span className="mapa-lista-num">{index + 1}</span>
                      <span className="mapa-lista-texto">
                        <strong>{getTitulo(item.op)}</strong>
                        <small>{item.op.bairro || item.op.endereco || 'Sem bairro'}</small>
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
