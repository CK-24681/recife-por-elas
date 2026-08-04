import { useState, useEffect } from 'react';
import { Link } from '../roteador';
import { apiJSON } from '../api';
import { useToast } from '../toast';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito';
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

const coresPin: Record<string, string> = {
  'Emprego': '#4338ca',
  'Curso': '#047857',
  'Benefício social': '#b45309',
  'Microcrédito': '#be185d',
};

const iconePin = (tipo: string) => {
  if (tipo === 'Emprego') return 'E';
  if (tipo === 'Curso') return 'C';
  if (tipo === 'Benefício social') return 'B';
  return 'M';
};

// limites aproximados de Recife
const RECIFE = { latMin: -8.14, latMax: -8.01, lonMin: -34.97, lonMax: -34.85 };

function toPct(lat: number, lon: number): { left: string; top: string } {
  const left = ((lon - RECIFE.lonMin) / (RECIFE.lonMax - RECIFE.lonMin)) * 100;
  const top = ((RECIFE.latMax - lat) / (RECIFE.latMax - RECIFE.latMin)) * 100;
  return { left: `${left}%`, top: `${top}%` };
}

const tags = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Emprego', rotulo: 'Empregos' },
  { valor: 'Curso', rotulo: 'Cursos' },
  { valor: 'Benefício social', rotulo: 'Benefícios' },
  { valor: 'Microcrédito', rotulo: 'Crédito' },
];

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const toast = useToast();

  useEffect(() => {
    (async () => {
      setEstado('carregando');
      try {
        // Busca oportunidades internas (com id de DB) e externas (APIs públicas) em paralelo.
        // Apenas as que tiverem latitude/longitude aparecem como pins no mapa.
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

  const todasComCoords = oportunidades.filter((o) => o.latitude != null && o.longitude != null);
  // R07: mapa exibe apenas oportunidades com coordenadas preenchidas
  const filtradas = filtro ? todasComCoords.filter((o) => o.tipo === filtro) : todasComCoords;
  const cardsFiltrados = filtro ? oportunidades.filter((o) => o.tipo === filtro) : oportunidades;

  // Chave única para cada oportunidade (id interno ou índice externo)
  const pinKey = (op: Oportunidade, idx: number) => op.id != null ? `int-${op.id}` : `ext-${idx}`;

  return (
    <>
      <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
        <div className="container">
          <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700,marginBottom:6}}>Mapa de oportunidades</h1>
          <p style={{color:'var(--texto-suave)',fontSize:15}}>Veja as oportunidades perto de você no Recife</p>
          <div className="mp-filtros">
            {tags.map((t) => (
              <button key={t.valor} className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} onClick={() => setFiltro(t.valor)}>
                {t.rotulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{paddingBlock:'clamp(28px,5vw,56px)'}}>
        <div className="mp-mapa-wrap">
          <img
            src="https://images.unsplash.com/photo-1599517736765-4c7c61536c1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5ODQwNjl8MHwxfHNlYXJjaHwzfHxyZWNpZmUlMjBicmF6aWwlMjBjaXR5JTIwbmVpZ2hib3Job29kJTIwc3RyZWV0fGVufDF8MHx8fDE3ODU3Njk4MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Vista aérea de bairro do Recife com ruas e casas"
            loading="lazy"
          />
          <div className="mp-pins">
            {filtradas.map((op: Oportunidade, idx: number) => {
              const pos = toPct(op.latitude!, op.longitude!);
              const key = pinKey(op, idx);
              const linkDest = op.id != null ? `/oportunidades/${op.id}` : null;
              return linkDest ? (
                <Link
                  key={key}
                  to={linkDest}
                  className="mp-pin"
                  style={{ left: pos.left, top: pos.top }}
                  onMouseEnter={() => setHoverId(key)}
                  onMouseLeave={() => setHoverId(null)}
                  aria-label={op.titulo}
                >
                  <span className="mp-pin-dot" style={{ background: coresPin[op.tipo] || 'var(--cor-primaria)' }}>
                    {iconePin(op.tipo)}
                  </span>
                  {hoverId === key && (
                    <span className="mp-pin-label" style={{opacity:1}}>{op.titulo}</span>
                  )}
                </Link>
              ) : (
                <a
                  key={key}
                  href={op.link_inscricao || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mp-pin"
                  style={{ left: pos.left, top: pos.top }}
                  onMouseEnter={() => setHoverId(key)}
                  onMouseLeave={() => setHoverId(null)}
                  aria-label={op.titulo}
                >
                  <span className="mp-pin-dot" style={{ background: coresPin[op.tipo] || 'var(--cor-primaria)' }}>
                    {iconePin(op.tipo)}
                  </span>
                  {hoverId === key && (
                    <span className="mp-pin-label" style={{opacity:1}}>{op.titulo}</span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Empty State no mapa — quando não há oportunidades com coords */}
          {estado === 'ok' && filtradas.length === 0 && (
            <div style={{
              position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              background:'rgba(255,255,255,0.85)',backdropFilter:'blur(4px)',
              gap:8,padding:24,textAlign:'center',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--texto-suave)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p style={{color:'var(--texto-suave)',fontSize:14,maxWidth:280}}>
                Nenhum ponto no mapa para este filtro. Oportunidades remotas e online aparecem na lista abaixo.
              </p>
            </div>
          )}
        </div>

        <div className="mp-legenda">
          {Object.entries(coresPin).map(([tipo, cor]) => (
            <span key={tipo} className="mp-legenda-item">
              <span style={{width:12,height:12,borderRadius:'50%',background:cor,flex:'none'}} />{tipo}
            </span>
          ))}
        </div>

        {estado === 'carregando' ? (
          <div className="fd-grade">
            {[1,2,3].map((i) => (
              <div key={i} className="fd-skeleton">
                <div className="fd-skel-tag" />
                <div className="fd-skel-linha" />
                <div className="fd-skel-linha curta" />
              </div>
            ))}
          </div>
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar as oportunidades.</p>
            <button className="btn-secundario" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : cardsFiltrados.length === 0 ? (
          <div className="fd-vazio">
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--fundo-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--texto-suave)'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            </div>
            <h3>Nenhuma oportunidade encontrada</h3>
            <p>As fontes públicas são consultadas em tempo real. Tente novamente em breve ou ajuste os filtros.</p>
            <button className="btn-secundario" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : (
          <div className="fd-grade">
            {cardsFiltrados.map((item: Oportunidade, idx: number) => {
              const key = pinKey(item, idx);
              if (item.id != null) {
                return (
                  <Link key={key} to={`/oportunidades/${item.id}`} className="fd-card surgir">
                    <span className={`fd-card-tag ${item.tipo === 'Emprego' ? 'emprego' : item.tipo === 'Curso' ? 'curso' : item.tipo === 'Benefício social' ? 'beneficio' : 'credito'}`}>
                      {item.tipo}
                    </span>
                    <h3>{item.titulo}</h3>
                    {item.empresa && <p style={{fontSize:12,color:'var(--texto-suave)',marginBottom:4,marginTop:-4,fontWeight:500}}>{item.empresa}</p>}
                    <p>{item.descricao}</p>
                    <div className="fd-card-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {item.bairro}
                      </span>
                    </div>
                  </Link>
                );
              }
              return (
                <a key={key} href={item.link_inscricao || '#'} target="_blank" rel="noopener noreferrer" className="fd-card surgir">
                  <span className={`fd-card-tag ${item.tipo === 'Emprego' ? 'emprego' : item.tipo === 'Curso' ? 'curso' : item.tipo === 'Benefício social' ? 'beneficio' : 'credito'}`}>
                    {item.tipo}
                  </span>
                  <h3>{item.titulo}</h3>
                  {item.empresa && <p style={{fontSize:12,color:'var(--texto-suave)',marginBottom:4,marginTop:-4,fontWeight:500}}>{item.empresa}</p>}
                  <p>{item.descricao}</p>
                  <div className="fd-card-meta">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {item.bairro}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}
