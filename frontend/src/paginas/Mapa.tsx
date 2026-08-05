import { useState, useEffect } from 'react';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { Map, Marker, Overlay } from 'pigeon-maps';

// ─── Tipos ───────────────────────────────────────────────────────────────────
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

// ─── Paleta de cores por categoria ──────────────────────────────────────────
const CONFIG_TIPO: Record<string, { cor: string; corFundo: string; emoji: string; rotulo: string }> = {
  'Emprego':          { cor: '#1d4ed8', corFundo: '#dbeafe', emoji: '💼', rotulo: 'Emprego' },
  'Curso':            { cor: '#15803d', corFundo: '#dcfce7', emoji: '📚', rotulo: 'Curso' },
  'Benefício social': { cor: '#ea580c', corFundo: '#fed7aa', emoji: '🧡', rotulo: 'Benefício' },
  'Microcrédito':     { cor: '#db2777', corFundo: '#fce7f3', emoji: '💰', rotulo: 'Microcrédito' },
  'Apoio':            { cor: '#db2777', corFundo: '#ede9fe', emoji: '🤝', rotulo: 'Rede de Apoio' },
};

const getCfg = (tipo: string) => CONFIG_TIPO[tipo] ?? { cor: '#db2777', corFundo: '#fce7f3', emoji: '📍', rotulo: tipo };

// ─── Filtros do mapa ─────────────────────────────────────────────────────────
const FILTROS = [
  { valor: '',                  rotulo: 'Todas',          icone: '🗺️', corAtiva: '#475569' },
  { valor: 'Emprego',           rotulo: 'Empregos',       icone: '💼', corAtiva: '#1d4ed8' },
  { valor: 'Curso',             rotulo: 'Cursos',         icone: '📚', corAtiva: '#15803d' },
  { valor: 'Benefício social',  rotulo: 'Benefícios',     icone: '🧡', corAtiva: '#ea580c' },
  { valor: 'Apoio',             rotulo: 'Rede de Apoio',  icone: '🤝', corAtiva: '#db2777' },
];

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('ok');
  
  // Para gerenciar o popup do Pigeon Maps (que será um Overlay)
  const [pinoSelecionado, setPinoSelecionado] = useState<Oportunidade | null>(null);

  const [center, setCenter] = useState<[number, number]>([-8.0476, -34.8770]);
  const [zoom, setZoom] = useState(13);
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);

  const toast = useToast();

  // Carga dos dados
  useEffect(() => {
    (async () => {
      setEstado('carregando');
      try {
        const [internas, externas] = await Promise.all([
          apiJSON<Oportunidade[]>('/oportunidades').catch(() => [] as Oportunidade[]),
          apiJSON<Oportunidade[]>('/oportunidades/externas').catch(() => [] as Oportunidade[]),
        ]);
        setOportunidades([...internas, ...externas]);
        setEstado('ok');
      } catch {
        setEstado('erro');
        toast.erro('Erro ao carregar oportunidades.');
      }
    })();
  }, [toast]);

  // Geolocalização
  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.erro('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosicaoUsuario(coords);
        setCenter(coords);
        setZoom(15);
        toast.sucesso('Localização obtida!');
      },
      () => toast.erro('Não foi possível obter a localização.')
    );
  };

  const pontosNoMapa = oportunidades.filter(
    (o) => !o.isOnline && typeof o.latitude === 'number' && typeof o.longitude === 'number'
  );
  
  const filtrados = filtro
    ? pontosNoMapa.filter((o) => o.tipo === filtro)
    : pontosNoMapa;

  const total = filtrados.length;

  return (
    <>
      <section className="mapa-secao">
        <div className="container">
          <h1 className="mapa-titulo">Mapa de Oportunidades</h1>

          <button
            onClick={obterLocalizacao}
            className={`map-loc-btn ${posicaoUsuario ? 'map-loc-btn--ativo' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
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
          <div className="mapa-wrapper" style={{ height: '75vh', width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <div className="map-filtros-flutuante" style={{ zIndex: 10 }}>
              {FILTROS.map((f) => {
                const ativo = filtro === f.valor;
                return (
                  <button
                    key={f.valor}
                    className={`map-filtro-btn ${ativo ? 'map-filtro-btn--ativo' : ''}`}
                    onClick={() => {
                       setFiltro(f.valor);
                       setPinoSelecionado(null);
                    }}
                    style={ativo ? {
                      background: f.corAtiva,
                      borderColor: f.corAtiva,
                      color: '#fff',
                    } : undefined}
                    aria-pressed={ativo}
                  >
                    <span className="map-filtro-icone">{f.icone}</span>
                    <span className="map-filtro-rotulo">{f.rotulo}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ flexGrow: 1, position: 'relative', zIndex: 0 }}>
              <Map 
                center={center} 
                zoom={zoom} 
                onBoundsChanged={({ center, zoom }) => { 
                  setCenter(center); 
                  setZoom(zoom); 
                }}
              >
                {posicaoUsuario && (
                  <Marker 
                    anchor={posicaoUsuario} 
                    color="#2563eb" 
                    width={40}
                  />
                )}

                {filtrados.map((op, idx) => {
                  const lat = Number((op as any).latitude || (op as any).localizacao?.lat);
                  const lng = Number((op as any).longitude || (op as any).localizacao?.lng);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  
                  const key = op.id != null ? `int-${op.id}` : `ext-${idx}`;
                  
                  let cor = '#db2777'; // Rosa padrão
                  const t = (op.tipo || '').toUpperCase();
                  if (t.includes('EMPREGO')) cor = '#1d4ed8'; // Azul
                  else if (t.includes('CURSO')) cor = '#15803d'; // Verde
                  else if (t.includes('BENEF')) cor = '#ea580c'; // Laranja

                  return (
                    <Marker
                      key={key}
                      anchor={[lat, lng]}
                      color={cor}
                      width={40}
                      onClick={() => setPinoSelecionado(op)}
                    />
                  );
                })}

                {pinoSelecionado && (
                  (() => {
                    const lat = Number((pinoSelecionado as any).latitude || (pinoSelecionado as any).localizacao?.lat);
                    const lng = Number((pinoSelecionado as any).longitude || (pinoSelecionado as any).localizacao?.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    const cfg = getCfg(pinoSelecionado.tipo);
                    const enderecoExibido = pinoSelecionado.endereco_completo || pinoSelecionado.endereco || '';

                    return (
                      <Overlay anchor={[lat, lng]} offset={[120, 260]}>
                        <div 
                          className="mapa-popup-content" 
                          style={{ 
                            background: '#fff', 
                            padding: '16px', 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            width: '240px',
                            position: 'relative'
                          }}
                        >
                          <button 
                            onClick={() => setPinoSelecionado(null)}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'none',
                              border: 'none',
                              fontSize: '16px',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                          >
                            ✖
                          </button>
                          
                          <span
                            className="mapa-popup-tag"
                            style={{ color: cfg.cor, background: cfg.corFundo, display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}
                          >
                            {cfg.emoji} {cfg.rotulo}
                          </span>

                          <h3 className="mapa-popup-titulo" style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            <strong>{pinoSelecionado.titulo}</strong>
                          </h3>

                          {pinoSelecionado.empresa && (
                            <p className="mapa-popup-empresa" style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '14px' }}>
                              {pinoSelecionado.empresa}
                            </p>
                          )}

                          {enderecoExibido && (
                            <p className="mapa-popup-end" style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              {enderecoExibido}
                            </p>
                          )}

                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-primario"
                            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '8px', borderRadius: '4px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 500 }}
                          >
                            Como Chegar
                          </a>

                          {pinoSelecionado.link_inscricao && (
                            <a
                              href={pinoSelecionado.link_inscricao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mapa-btn-detalhes"
                              style={{ display: 'block', textAlign: 'center', marginTop: '8px', textDecoration: 'none', color: '#2563eb', fontSize: '14px' }}
                            >
                              Ver detalhes →
                            </a>
                          )}
                        </div>
                      </Overlay>
                    );
                  })()
                )}
              </Map>
            </div>

            {total === 0 && estado === 'ok' && (
              <div className="map-sem-resultados">
                Nenhum local físico encontrado para este filtro.
              </div>
            )}
          </div>
        )}
      </section>

      {toast.container}
    </>
  );
}
