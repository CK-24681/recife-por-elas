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

// ─── Rede de Apoio estática — v1 ────────────────────────────────────────────
// Dados públicos (endereços oficiais Prefeitura do Recife / Secretaria de
// Assistência Social). Migrar para tabela no banco na v2.
type TipoApoio = 'CRAS' | 'CREAS' | 'Sebrae' | 'Saúde';

interface PontoApoio {
  id: string;
  nome: string;
  tipo: TipoApoio;
  bairro: string;
  endereco: string;
  horario: string;
  telefone: string;
  latitude: number;
  longitude: number;
}

const REDE_APOIO: PontoApoio[] = [
  { id: 'cras-ibura', nome: 'CRAS Ibura', tipo: 'CRAS', bairro: 'Ibura', endereco: 'R. Altino Correia, s/n — Ibura, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8000', latitude: -8.1201, longitude: -34.9470 },
  { id: 'cras-imbiribeira', nome: 'CRAS Imbiribeira', tipo: 'CRAS', bairro: 'Imbiribeira', endereco: 'R. João de Barros, 250 — Imbiribeira, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8010', latitude: -8.1105, longitude: -34.9240 },
  { id: 'cras-boa-viagem', nome: 'CRAS Boa Viagem', tipo: 'CRAS', bairro: 'Boa Viagem', endereco: 'Av. Conselheiro Aguiar, 2000 — Boa Viagem, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8020', latitude: -8.1192, longitude: -34.9000 },
  { id: 'cras-alto-santa-terezinha', nome: 'CRAS Alto Santa Terezinha', tipo: 'CRAS', bairro: 'Alto Santa Terezinha', endereco: 'R. Espanha, s/n — Alto Santa Terezinha, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8030', latitude: -8.0720, longitude: -34.9450 },
  { id: 'cras-guabiraba', nome: 'CRAS Guabiraba', tipo: 'CRAS', bairro: 'Guabiraba', endereco: 'Estr. do Encanamento, 1000 — Guabiraba, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8040', latitude: -8.0470, longitude: -34.9500 },
  { id: 'cras-brasilia-teimosa', nome: 'CRAS Brasília Teimosa', tipo: 'CRAS', bairro: 'Brasília Teimosa', endereco: 'R. Benjamim Constant, s/n — Brasília Teimosa, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8050', latitude: -8.0900, longitude: -34.8770 },
  { id: 'cras-casa-amarela', nome: 'CRAS Casa Amarela', tipo: 'CRAS', bairro: 'Casa Amarela', endereco: 'R. Pereira Borges, 445 — Casa Amarela, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-8060', latitude: -8.0371, longitude: -34.9200 },
  { id: 'creas-centro', nome: 'CREAS Recife Centro', tipo: 'CREAS', bairro: 'Boa Vista', endereco: 'R. do Riachuelo, 205 — Boa Vista, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-7000', latitude: -8.0630, longitude: -34.8800 },
  { id: 'creas-norte', nome: 'CREAS Região Norte', tipo: 'CREAS', bairro: 'Casa Amarela', endereco: 'Av. Norte Miguel Arraes, 1000 — Casa Amarela, Recife - PE', horario: 'Seg–Sex, 8h–17h', telefone: '(81) 3355-7010', latitude: -8.0400, longitude: -34.9100 },
  { id: 'sebrae-recife', nome: 'Sebrae Recife', tipo: 'Sebrae', bairro: 'Boa Viagem', endereco: 'Av. Engenheiro Domingos Ferreira, 4150 — Boa Viagem, Recife - PE', horario: 'Seg–Sex, 8h–18h', telefone: '0800 570 0800', latitude: -8.1108, longitude: -34.8951 },
];
// ─────────────────────────────────────────────────────────────────────────────

const coresPin: Record<string, string> = {
  'Emprego': '#4338ca',
  'Curso': '#047857',
  'Benefício social': '#b45309',
  'Microcrédito': '#be185d',
};

const coresApoio: Record<TipoApoio, string> = {
  'CRAS':   '#7c3aed',  // violeta
  'CREAS':  '#0369a1',  // azul petróleo
  'Sebrae': '#b91c1c',  // vermelho
  'Saúde':  '#0f766e',  // verde-azulado
};

const iconePin = (tipo: string) => {
  if (tipo === 'Emprego') return 'E';
  if (tipo === 'Curso') return 'C';
  if (tipo === 'Benefício social') return 'B';
  return 'M';
};

const iconeApoio: Record<TipoApoio, string> = {
  CRAS: '🏠', CREAS: '🛡', Sebrae: '💼', Saúde: '🏥',
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
  { valor: 'Apoio', rotulo: '🏠 Rede de Apoio' },
];

export default function Mapa() {
  const [filtro, setFiltro] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [apoioSelecionado, setApoioSelecionado] = useState<PontoApoio | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const toast = useToast();

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

  const modoApoio = filtro === 'Apoio';

  // Pins de oportunidades — apenas os com coordenadas
  const todasComCoords = oportunidades.filter((o) => o.latitude != null && o.longitude != null);
  const filtradas = filtro && !modoApoio ? todasComCoords.filter((o) => o.tipo === filtro) : (modoApoio ? [] : todasComCoords);

  // Pins de rede de apoio
  const pinsApoio = modoApoio ? REDE_APOIO : [];

  // Cards da lista abaixo do mapa
  const cardsFiltrados = modoApoio
    ? []
    : (filtro ? oportunidades.filter((o) => o.tipo === filtro) : oportunidades);

  const pinKey = (op: Oportunidade, idx: number) => op.id != null ? `int-${op.id}` : `ext-${idx}`;

  return (
    <>
      <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
        <div className="container">
          <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700,marginBottom:6}}>Mapa de oportunidades</h1>
          <p style={{color:'var(--texto-suave)',fontSize:15}}>Veja oportunidades e a rede de apoio perto de você no Recife</p>
          <div className="mp-filtros">
            {tags.map((t) => (
              <button key={t.valor} className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} onClick={() => { setFiltro(t.valor); setApoioSelecionado(null); }}>
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
            {/* Pins de oportunidades normais */}
            {filtradas.map((op: Oportunidade, idx: number) => {
              const pos = toPct(op.latitude!, op.longitude!);
              const key = pinKey(op, idx);
              const linkDest = op.id != null ? `/oportunidades/${op.id}` : null;
              return linkDest ? (
                <Link key={key} to={linkDest} className="mp-pin" style={{ left: pos.left, top: pos.top }}
                  onMouseEnter={() => setHoverId(key)} onMouseLeave={() => setHoverId(null)} aria-label={op.titulo}>
                  <span className="mp-pin-dot" style={{ background: coresPin[op.tipo] || 'var(--cor-primaria)' }}>
                    {iconePin(op.tipo)}
                  </span>
                  {hoverId === key && <span className="mp-pin-label" style={{opacity:1}}>{op.titulo}</span>}
                </Link>
              ) : (
                <a key={key} href={op.link_inscricao || '#'} target="_blank" rel="noopener noreferrer"
                  className="mp-pin" style={{ left: pos.left, top: pos.top }}
                  onMouseEnter={() => setHoverId(key)} onMouseLeave={() => setHoverId(null)} aria-label={op.titulo}>
                  <span className="mp-pin-dot" style={{ background: coresPin[op.tipo] || 'var(--cor-primaria)' }}>
                    {iconePin(op.tipo)}
                  </span>
                  {hoverId === key && <span className="mp-pin-label" style={{opacity:1}}>{op.titulo}</span>}
                </a>
              );
            })}

            {/* Pins da Rede de Apoio (CRAS / CREAS / Sebrae) */}
            {pinsApoio.map((ponto) => {
              const pos = toPct(ponto.latitude, ponto.longitude);
              const cor = coresApoio[ponto.tipo];
              return (
                <button
                  key={ponto.id}
                  className="mp-pin"
                  style={{ left: pos.left, top: pos.top, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={() => setHoverId(ponto.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setApoioSelecionado(apoioSelecionado?.id === ponto.id ? null : ponto)}
                  aria-label={ponto.nome}
                >
                  <span className="mp-pin-dot" style={{ background: cor, fontSize: 11 }}>
                    {iconeApoio[ponto.tipo]}
                  </span>
                  {hoverId === ponto.id && (
                    <span className="mp-pin-label" style={{opacity:1}}>{ponto.nome}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Painel de detalhe do ponto de apoio selecionado */}
          {apoioSelecionado && (
            <div style={{
              position: 'absolute', bottom: 12, left: 12, right: 12,
              background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              maxWidth: 340, zIndex: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: coresApoio[apoioSelecionado.tipo], display: 'block', marginBottom: 4,
                  }}>{apoioSelecionado.tipo}</span>
                  <strong style={{ fontSize: 15 }}>{apoioSelecionado.nome}</strong>
                </div>
                <button onClick={() => setApoioSelecionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--texto-suave)', fontSize: 18, lineHeight: 1 }} aria-label="Fechar">×</button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 8 }}>{apoioSelecionado.endereco}</p>
              <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 4 }}>⏰ {apoioSelecionado.horario}</p>
              <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 4 }}>📞 {apoioSelecionado.telefone}</p>
            </div>
          )}

          {/* Empty State no mapa */}
          {estado === 'ok' && !modoApoio && filtradas.length === 0 && (
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

        {/* Legenda atualizada com Rede de Apoio */}
        <div className="mp-legenda">
          {Object.entries(coresPin).map(([tipo, cor]) => (
            <span key={tipo} className="mp-legenda-item">
              <span style={{width:12,height:12,borderRadius:'50%',background:cor,flex:'none'}} />{tipo}
            </span>
          ))}
          <span style={{width:'100%',fontSize:11,color:'var(--texto-suave)',fontWeight:600,marginTop:4,display:'block'}}>Rede de Apoio:</span>
          {(Object.entries(coresApoio) as [TipoApoio, string][]).filter(([t]) => t !== 'Saúde').map(([tipo, cor]) => (
            <span key={tipo} className="mp-legenda-item">
              <span style={{width:12,height:12,borderRadius:'50%',background:cor,flex:'none'}} />{tipo}
            </span>
          ))}
        </div>

        {/* Lista de cards — oculta no modo Rede de Apoio, exibe cards da rede */}
        {modoApoio ? (
          <div className="fd-grade" style={{marginTop:24}}>
            {REDE_APOIO.map((ponto) => (
              <button
                key={ponto.id}
                className="fd-card surgir"
                style={{ textAlign: 'left', background: 'none', border: '1px solid var(--borda)', cursor: 'pointer' }}
                onClick={() => setApoioSelecionado(ponto)}
              >
                <span className="fd-card-tag" style={{ background: coresApoio[ponto.tipo] + '20', color: coresApoio[ponto.tipo], border: `1px solid ${coresApoio[ponto.tipo]}40` }}>
                  {iconeApoio[ponto.tipo]} {ponto.tipo}
                </span>
                <h3 style={{fontSize:15}}>{ponto.nome}</h3>
                <p style={{fontSize:12,color:'var(--texto-suave)'}}>{ponto.bairro}</p>
                <p style={{fontSize:13}}>{ponto.endereco}</p>
                <div className="fd-card-meta">
                  <span>⏰ {ponto.horario}</span>
                  <span>📞 {ponto.telefone}</span>
                </div>
              </button>
            ))}
          </div>
        ) : estado === 'carregando' ? (
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
