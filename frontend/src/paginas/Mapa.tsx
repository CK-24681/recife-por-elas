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
    html: `<div style="background-color: ${cor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 16px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

const userIcon = L.divIcon({
  className: 'user-leaflet-icon',
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.8);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
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
      <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
        <div className="container">
          <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700,marginBottom:6}}>Mapa de oportunidades</h1>
          <p style={{color:'var(--texto-suave)',fontSize:15}}>Veja empregos, cursos e a rede de apoio perto de você no Recife</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24, alignItems: 'center' }}>
            <div className="mp-filtros" style={{ margin: 0 }}>
              {tags.map((t) => (
                <button key={t.valor} className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} onClick={() => setFiltro(t.valor)}>
                  {t.rotulo}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                value={raio} 
                onChange={(e) => setRaio(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: 20, border: '1px solid var(--borda)', background: '#fff', fontSize: 14 }}
              >
                {distancias.map(d => (
                  <option key={d.valor} value={d.valor}>{d.rotulo}</option>
                ))}
              </select>

              <button 
                onClick={obterLocalizacao}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: 'var(--cor-primaria)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                Usar minha localização
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{paddingBlock:'clamp(28px,5vw,56px)'}}>
        {estado === 'carregando' ? (
          <div style={{ width: '100%', height: 600, borderRadius: 16, background: '#e5e7eb', animation: 'pulse 2s infinite' }} />
        ) : estado === 'erro' ? (
          <div className="fd-vazio" style={{ height: 600 }}>
            <h3>Erro ao carregar mapa</h3>
            <p>Não foi possível carregar as oportunidades.</p>
            <button className="btn-secundario" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : (
          <div style={{ width: '100%', height: 600, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--borda)', position: 'relative', zIndex: 1 }}>
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
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: coresPin[op.tipo], display: 'block', marginBottom: 4 }}>
                          {op.tipo}
                        </span>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 15, color: 'var(--texto)' }}>{op.titulo}</h3>
                        {op.empresa && <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px 0', fontWeight: 600 }}>{op.empresa}</p>}
                        
                        {/* Se tiver "Status de Vagas" na descrição (Creches) */}
                        {op.descricao.includes('Status de Vagas') ? (
                           <>
                             <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                               {op.descricao.split('Status de Vagas:')[0].trim()}
                             </p>
                             <p style={{ fontSize: 12, margin: '0 0 8px 0', padding: 6, background: '#f3f4f6', borderRadius: 6, fontWeight: 500, color: '#374151' }}>
                               Status de Vagas: {op.descricao.split('Status de Vagas:')[1].trim()}
                             </p>
                           </>
                        ) : (
                           <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 8px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                             {op.descricao}
                           </p>
                        )}
                        
                        <p style={{ fontSize: 11, color: '#666', margin: '0 0 12px 0' }}>📍 {op.endereco}</p>
                        
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={gmapsLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', flex: 1, textAlign: 'center', padding: '6px 0', background: '#3b82f6', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            🗺️ Como chegar
                          </a>
                          {op.link_inscricao && (
                            <a href={op.link_inscricao} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', flex: 1, textAlign: 'center', padding: '6px 0', background: 'var(--cor-primaria)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
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
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#991b1b', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                Clique em "Usar minha localização" para ativar o filtro de {raio}km.
              </div>
            )}
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}
