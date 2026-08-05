import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('ok');
  
  const [center, setCenter] = useState<[number, number]>([-8.0476, -34.8770]);
  const [zoom, setZoom] = useState(13);
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);

  const toast = useToast();

  // Carga dos dados com proteção contra loop infinito (array vazio = run on mount only)
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (mounted) setEstado('carregando');
      try {
        const [internas, externas] = await Promise.all([
          apiJSON<Oportunidade[]>('/oportunidades').catch(() => [] as Oportunidade[]),
          apiJSON<Oportunidade[]>('/oportunidades/externas').catch(() => [] as Oportunidade[]),
        ]);
        if (mounted) {
          setOportunidades([...internas, ...externas]);
          setEstado('ok');
        }
      } catch (error) {
        if (mounted) {
          setEstado('erro');
          setOportunidades([]); // Fallback seguro
          toast.erro('Erro ao carregar oportunidades.');
        }
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []); // <--- ESTE ARRAY VAZIO É INEGOCIÁVEL

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
          <div className="mapa-wrapper" style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <div className="map-filtros-flutuante" style={{ zIndex: 10 }}>
              {FILTROS.map((f) => {
                const ativo = filtro === f.valor;
                return (
                  <button
                    key={f.valor}
                    className={`map-filtro-btn ${ativo ? 'map-filtro-btn--ativo' : ''}`}
                    onClick={() => {
                       setFiltro(f.valor);
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

            {/* ESTRUTURA BLINDADA DO MAPA (JSX) OBRIGATÓRIA PARA EVITAR COLAPSO */}
            <div style={{ height: '75vh', minHeight: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
              <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <MapUpdater center={center} zoom={zoom} />
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                
                {posicaoUsuario && (
                  <Marker position={posicaoUsuario}>
                    <Popup>Você está aqui</Popup>
                  </Marker>
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

                  const cfg = getCfg(op.tipo);
                  const enderecoExibido = op.endereco_completo || op.endereco || '';

                  // Marker icon personalizado
                  const markerIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `<div style="background-color: ${cor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  });

                  return (
                    <Marker
                      key={key}
                      position={[lat, lng]}
                      icon={markerIcon}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <span style={{ color: cfg.cor, background: cfg.corFundo, display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                            {cfg.emoji} {cfg.rotulo}
                          </span>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            <strong>{op.titulo}</strong>
                          </h3>
                          {op.empresa && (
                            <p style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '14px' }}>
                              {op.empresa}
                            </p>
                          )}
                          {enderecoExibido && (
                            <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                              📍 {enderecoExibido}
                            </p>
                          )}
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '8px', borderRadius: '4px', background: '#2563eb', color: '#fff', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}
                          >
                            Como Chegar
                          </a>
                          {op.link_inscricao && (
                            <a
                              href={op.link_inscricao}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: '#2563eb', fontSize: '14px' }}
                            >
                              Ver detalhes →
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
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
