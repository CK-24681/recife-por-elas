import { useState, useEffect } from 'react';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
}

// ─── Paleta de cores por categoria ──────────────────────────────────────────
const CONFIG_TIPO: Record<string, { cor: string; corFundo: string; emoji: string; rotulo: string }> = {
  'Emprego':          { cor: '#2563eb', corFundo: '#dbeafe', emoji: '💼', rotulo: 'Emprego' },
  'Curso':            { cor: '#16a34a', corFundo: '#dcfce7', emoji: '🎓', rotulo: 'Curso' },
  'Benefício social': { cor: '#ea580c', corFundo: '#fed7aa', emoji: '🤝', rotulo: 'Benefício' },
  'Microcrédito':     { cor: '#db2777', corFundo: '#fce7f3', emoji: '💰', rotulo: 'Microcrédito' },
  'Apoio':            { cor: '#7c3aed', corFundo: '#ede9fe', emoji: '🏠', rotulo: 'Rede de Apoio' },
};

const getCfg = (tipo: string) => CONFIG_TIPO[tipo] ?? { cor: '#64748b', corFundo: '#f1f5f9', emoji: '📍', rotulo: tipo };

// ─── Ícone circular customizado via L.divIcon ────────────────────────────────
function criarIcone(tipo: string) {
  const { cor } = getCfg(tipo);
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="map-pin" style="background:${cor}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

const userIcon = L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div class="map-pin map-pin--user"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// ─── URL do Google Maps para "Como Chegar" ───────────────────────────────────
function urlComoChegar(op: Oportunidade): string {
  // Preferência: lat/lng exatos → endereço completo → título
  if (op.latitude && op.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${op.latitude},${op.longitude}`;
  }
  const query = encodeURIComponent(
    op.endereco_completo || op.endereco || op.titulo
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// ─── Filtros do mapa ─────────────────────────────────────────────────────────
const FILTROS = [
  { valor: '',                  rotulo: 'Todas',          icone: '🗺️' },
  { valor: 'Emprego',           rotulo: 'Empregos',       icone: '💼' },
  { valor: 'Curso',             rotulo: 'Cursos',         icone: '🎓' },
  { valor: 'Benefício social',  rotulo: 'Benefícios',     icone: '🤝' },
  { valor: 'Apoio',             rotulo: 'Rede de Apoio',  icone: '🏠' },
];

// ─── Componente auxiliar: foca o mapa na usuária ─────────────────────────────
function FocusUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 15, { animate: true });
  }, [position, map]);
  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
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
  }, []);

  // Geolocalização
  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.erro('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosicaoUsuario([pos.coords.latitude, pos.coords.longitude]);
        toast.sucesso('Localização obtida!');
      },
      () => toast.erro('Não foi possível obter a localização.')
    );
  };

  // ── REGRA GIS: apenas locais físicos com coordenadas válidas e não-online ──
  const pontosNoMapa = oportunidades.filter(
    (o) => !o.isOnline && typeof o.latitude === 'number' && typeof o.longitude === 'number'
  );
  const filtrados = filtro
    ? pontosNoMapa.filter((o) => o.tipo === filtro)
    : pontosNoMapa;

  const total = filtrados.length;

  return (
    <>
      {/* ── Hero / Cabeçalho ── */}
      <section className="mapa-secao">
        <div className="container">
          <h1 className="mapa-titulo">Mapa de Oportunidades</h1>

          {/* Botão de localização */}
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

      {/* ── Mapa + Filtros flutuantes ── */}
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
          <div className="mapa-wrapper" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100vh', width: '100%' }}>
            {/* ── Barra de filtros flutuante sobre o mapa ── */}
            <div className="map-filtros-flutuante">
              {FILTROS.map((f) => {
                const cfg = f.valor ? getCfg(f.valor) : null;
                const ativo = filtro === f.valor;
                return (
                  <button
                    key={f.valor}
                    className={`map-filtro-btn ${ativo ? 'map-filtro-btn--ativo' : ''}`}
                    onClick={() => setFiltro(f.valor)}
                    style={ativo && cfg ? {
                      background: cfg.cor,
                      borderColor: cfg.cor,
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

            <MapContainer
              center={[-8.0476, -34.8770]}
              zoom={13}
              className="mapa-container-interno"
              zoomControl={false}
              style={{ height: '70vh', minHeight: '500px', width: '100%', zIndex: 0, borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FocusUser position={posicaoUsuario} />

              {/* Pino da usuária */}
              {posicaoUsuario && (
                <Marker position={posicaoUsuario} icon={userIcon}>
                  <Popup>
                    <div className="mapa-popup-content">
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>📍 Você está aqui</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Pinos das oportunidades */}
              {filtrados.map((op, idx) => {
                if (typeof op.latitude !== 'number' || typeof op.longitude !== 'number') return null;
                
                const key = op.id != null ? `int-${op.id}` : `ext-${idx}`;
                const cfg = getCfg(op.tipo);
                const gmaps = urlComoChegar(op);
                const enderecoExibido = op.endereco_completo || op.endereco || '';

                return (
                  <Marker
                    key={key}
                    position={[op.latitude!, op.longitude!]}
                    icon={criarIcone(op.tipo)}
                  >
                    <Popup minWidth={240} maxWidth={280}>
                      <div className="mapa-popup-content">
                        {/* Tag de categoria */}
                        <span
                          className="mapa-popup-tag"
                          style={{ color: cfg.cor, background: cfg.corFundo }}
                        >
                          {cfg.emoji} {cfg.rotulo}
                        </span>

                        {/* Título */}
                        <h3 className="mapa-popup-titulo">{op.titulo}</h3>

                        {/* Empresa */}
                        {op.empresa && (
                          <p className="mapa-popup-empresa">{op.empresa}</p>
                        )}

                        {/* Endereço compacto */}
                        {enderecoExibido && (
                          <p className="mapa-popup-end">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {enderecoExibido}
                          </p>
                        )}

                        {/* CTA "Como Chegar" — largo e proeminente */}
                        <a
                          href={gmaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mapa-btn-chegar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                          Como Chegar
                        </a>

                        {/* Link secundário discreto */}
                        {op.link_inscricao && (
                          <a
                            href={op.link_inscricao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mapa-btn-detalhes"
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

            {/* Legenda de contagem */}
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
