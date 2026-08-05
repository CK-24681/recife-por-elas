import { useEffect, useMemo, useState } from 'react';
import { apiJSON } from '../api';
import { useToast } from '../toast';

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

  const centro = useMemo(() => {
    if (selecionadoAtual) return selecionadoAtual.coords;
    if (posicaoUsuario) return posicaoUsuario;
    return [-8.0476, -34.877] as Coordenadas;
  }, [selecionadoAtual, posicaoUsuario]);

  const total = filtrados.length;

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

              <div className="mapa-preview">
                <div className="mapa-preview-badge">Google Maps Street View</div>
                <h2>Visualização externa do ponto selecionado</h2>
                <p>
                  O navegador está bloqueando o embed direto. Aqui no app você ainda vê o ponto escolhido,
                  e o Street View abre corretamente em nova aba.
                </p>
                <div className="mapa-preview-coords">
                  <strong>{centro[0].toFixed(4)}, {centro[1].toFixed(4)}</strong>
                  <span>{selecionadoAtual?.op.endereco_completo || selecionadoAtual?.op.endereco || selecionadoAtual?.op.bairro || 'Recife, PE'}</span>
                </div>
                <a
                  className="mapa-preview-btn"
                  href={linkGoogleMapsExterno(centro[0], centro[1])}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir Street View no Google Maps
                </a>
              </div>

              <div className="mapa-badge">
                {total} ponto{total === 1 ? '' : 's'} com coordenadas no filtro atual
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
