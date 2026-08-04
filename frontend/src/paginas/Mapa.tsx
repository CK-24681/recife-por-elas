import { useState, useEffect } from 'react';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito' | 'Apoio';
  fonte: string;
  link_inscricao: string;
  bairro: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  horario: string;
  data_inicio_inscricao: string;
  data_fim_inscricao: string;
}

// ─── Helpers: Haversine e Cores ──────────────────────────────────────────────
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distância em km
}

const coresPin: Record<string, string> = {
  'Emprego': '#2563eb', // Azul
  'Curso': '#16a34a', // Verde
  'Benefício social': '#ea580c', // Laranja
  'Microcrédito': '#db2777', // Rosa
  'Apoio': '#9333ea', // Roxo
};

const iconePin = (tipo: string) => {
  if (tipo === 'Emprego') return '💼';
  if (tipo === 'Curso') return '🎓';
  if (tipo === 'Benefício social') return '🤝';
  if (tipo === 'Microcrédito') return '💰';
  return '🏠'; // Apoio
};

function criarIcone(tipo: string) {
  const cor = coresPin[tipo] || '#000';
  const emoji = iconePin(tipo);
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.45 16 24 16 24s16-13.55 16-24C32 7.163 24.837 0 16 0z" fill="${cor}" stroke="white" stroke-width="1.5" />
      <circle cx="16" cy="15" r="10" fill="white" />
      <text x="16" y="19" font-size="12" text-anchor="middle" font-family="sans-serif">${emoji}</text>
    </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });
}

const userIcon = L.divIcon({
  className: 'user-leaflet-icon',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" style="filter: drop-shadow(0px 0px 8px rgba(239,68,68,0.8));">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 7.838 12 20 12 20s12-12.162 12-20C24 5.373 18.627 0 12 0z" fill="#ef4444" stroke="white" stroke-width="2" />
    <circle cx="12" cy="11" r="5" fill="white" />
  </svg>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32]
});

// Componente auxiliar para centralizar o mapa na usuária
function FocusUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 14, { animate: true });
    }
  }, [position, map]);
  return null;
}

const tags = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Emprego', rotulo: 'Empregos' },
  { valor: 'Curso', rotulo: 'Cursos' },
  { valor: 'Benefício social', rotulo: 'Benefícios' },
  { valor: 'Apoio', rotulo: '🏠 Rede de Apoio' },
];

const distancias = [
  { valor: 0, rotulo: 'Qualquer distância' },
  { valor: 2, rotulo: 'Até 2 km' },
  { valor: 5, rotulo: 'Até 5 km' },
  { valor: 10, rotulo: 'Até 10 km' },
];

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [raio, setRaio] = useState<number>(0);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);
  const toast = useToast();

  const centroRecife: [number, number] = [-8.0476, -34.8770];

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

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      toast.erro('Geolocalização não é suportada no seu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosicaoUsuario([position.coords.latitude, position.coords.longitude]);
        toast.sucesso('Localização obtida com sucesso!');
      },
      (error) => {
        console.error(error);
        toast.erro('Permissão negada ou falha ao obter localização.');
      }
    );
  };

  // Filtragem
  const oportunidadesComCoords = oportunidades.filter(o => o.latitude != null && o.longitude != null);
  let filtradas = filtro ? oportunidadesComCoords.filter(o => o.tipo === filtro) : oportunidadesComCoords;

  if (raio > 0 && posicaoUsuario) {
    filtradas = filtradas.filter(o => {
      const dist = calcularDistancia(posicaoUsuario[0], posicaoUsuario[1], o.latitude!, o.longitude!);
      return dist <= raio;
    });
  }

  return (
    <>
      <section className="mapa-secao">
        <div className="container">
          <h1 className="mapa-titulo">Mapa de oportunidades</h1>
          <p className="mapa-subtitulo">Veja empregos, cursos e a rede de apoio perto de você no Recife</p>
          
          <div className="mapa-filtros-row">
            <div className="mp-filtros" style={{ margin: 0 }}>
              {tags.map((t) => (
                <button key={t.valor} className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} onClick={() => setFiltro(t.valor)}>
                  {t.rotulo}
                </button>
              ))}
            </div>

            <div className="mapa-acoes">
              <select 
                value={raio} 
                onChange={(e) => setRaio(Number(e.target.value))}
                className="mapa-select"
              >
                {distancias.map(d => (
                  <option key={d.valor} value={d.valor}>{d.rotulo}</option>
                ))}
              </select>

              <button 
                onClick={obterLocalizacao}
                className="btn-primario"
                style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 14 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                Usar minha localização
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBlock: 'clamp(28px,5vw,56px)' }}>
        {estado === 'carregando' ? (
          <div className="mapa-carregando" />
        ) : estado === 'erro' ? (
          <div className="fd-vazio mapa-erro">
            <h3>Erro ao carregar mapa</h3>
            <p>Não foi possível carregar as oportunidades.</p>
            <button className="btn-secundario" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : (
          <div className="mapa-wrapper">
            <MapContainer 
              center={centroRecife} 
              zoom={13} 
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <FocusUser position={posicaoUsuario} />

              {posicaoUsuario && (
                <Marker position={posicaoUsuario} icon={userIcon}>
                  <Popup>
                    <strong>Você está aqui!</strong>
                  </Popup>
                </Marker>
              )}

              {filtradas.map((op, idx) => {
                const key = op.id != null ? `int-${op.id}` : `ext-${idx}`;
                const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${op.latitude},${op.longitude}`;
                
                return (
                  <Marker 
                    key={key} 
                    position={[op.latitude!, op.longitude!]} 
                    icon={criarIcone(op.tipo)}
                  >
                    <Popup>
                      <div style={{ minWidth: 200 }}>
                        <span className="mapa-popup-tag" style={{ color: coresPin[op.tipo] }}>
                          {op.tipo}
                        </span>
                        <h3 className="mapa-popup-titulo">{op.titulo}</h3>
                        {op.empresa && <p className="mapa-popup-empresa">{op.empresa}</p>}
                        
                        {/* Se tiver "Status de Vagas" na descrição (Creches) */}
                        {op.descricao.includes('Status de Vagas') ? (
                           <>
                             <p className="mapa-popup-desc" style={{ WebkitLineClamp: 2 }}>
                               {op.descricao.split('Status de Vagas:')[0].trim()}
                             </p>
                             <p className="mapa-popup-status">
                               Status de Vagas: {op.descricao.split('Status de Vagas:')[1].trim()}
                             </p>
                           </>
                        ) : (
                           <p className="mapa-popup-desc">
                             {op.descricao}
                           </p>
                        )}
                        
                        <p className="mapa-popup-end">📍 {op.endereco}</p>
                        
                        <div className="mapa-popup-actions">
                          <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="mapa-btn-acao secundario">
                            🗺️ Como chegar
                          </a>
                          {op.link_inscricao && (
                            <a href={op.link_inscricao} target="_blank" rel="noopener noreferrer" className="mapa-btn-acao primario">
                              Detalhes
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            {/* Aviso caso o raio seja filtrado mas a usuária não tenha dado permissão */}
            {raio > 0 && !posicaoUsuario && (
              <div className="mapa-aviso-localizacao">
                Clique em "Usar minha localização" para ativar o filtro de {raio}km.
              </div>
            )}
          </div>
        )}
        
        {/* Card Educativo (Guia de Vagas Oficiais) */}
        {(filtro === '' || filtro === 'Emprego') && estado === 'ok' && (
          <div className="fd-grade" style={{ marginTop: 24 }}>
            <div className="fd-card surgir fd-card-alerta">
              <span className="fd-card-tag tag-alerta">
                ⚠️ Guia de Vagas Oficiais
              </span>
              <h3 className="alerta-titulo">Portal Emprega Brasil / Agência do Trabalho PE</h3>
              <p className="alerta-texto">
                As vagas oficiais do estado são atualizadas diariamente no portal do governo. Siga os passos: 1. Clique no botão abaixo. 2. Acesse com seu Gov.br. 3. No filtro de cidade, digite 'Recife' e busque pela sua área de interesse.
              </p>
              <a href="https://servicos.mte.gov.br/" target="_blank" rel="noopener noreferrer" className="btn-alerta">
                Acessar Portal de Vagas
              </a>
            </div>
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}
