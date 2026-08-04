import { useState, useEffect } from 'react';
import { Link } from '../roteador';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { useSessao } from '../sessao';

interface Oportunidade {
  id?: number;
  titulo: string;
  descricao: string;
  empresa?: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito' | 'Apoio' | string;
  link_inscricao?: string;
  bairro?: string;
  endereco?: string;
  latitude?: number | null;
  longitude?: number | null;
  horario?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function decodeHtml(raw: string): string {
  if (!raw) return '';
  return raw.replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const tags = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Emprego', rotulo: 'Empregos' },
  { valor: 'Curso', rotulo: 'Cursos' },
  { valor: 'Benefício social', rotulo: 'Benefícios' },
  { valor: 'Apoio', rotulo: 'Rede de Apoio' },
];

const iconeTipo = (tipo: string) => {
  if (tipo === 'Emprego') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
  if (tipo === 'Curso') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
  if (tipo === 'Benefício social') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  if (tipo === 'Apoio') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
};

const tagClass = (tipo: string) => {
  if (tipo === 'Emprego') return 'emprego';
  if (tipo === 'Curso') return 'curso';
  if (tipo === 'Benefício social') return 'beneficio';
  if (tipo === 'Apoio') return 'apoio';
  return 'credito';
};

// ─── Componentes de Card ─────────────────────────────────────────────────────
function CardGuiaVagas() {
  return (
    <a
      href="https://servicos.mte.gov.br/"
      target="_blank"
      rel="noopener noreferrer"
      className="fd-card surgir"
    >
      <span className="fd-card-tag emprego">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        Emprego
      </span>
      <h3>Portal Emprega Brasil / Agência do Trabalho PE</h3>
      <p className="fd-empresa-meta">Ministério do Trabalho e Emprego</p>
      <p className="mapa-popup-desc truncate-3">
        As vagas oficiais do governo são atualizadas diariamente. Acesse gratuitamente com seu Gov.br, pesquise por "Recife" e candidate-se a oportunidades perto de você.
      </p>
      <div className="fd-card-meta">
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Recife
        </span>
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          24h (Plataforma online)
        </span>
      </div>
    </a>
  );
}

function CardApoio({ item }: { item: Oportunidade }) {
  const destination = item.latitude && item.longitude 
    ? `${item.latitude},${item.longitude}`
    : encodeURIComponent(item.endereco || '');
  const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  const descricaoLimpa = decodeHtml(item.descricao);

  return (
    <div className="fd-card surgir fd-card-apoio">
      <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
        {iconeTipo(item.tipo)}{item.tipo}
      </span>
      <h3>{item.titulo}</h3>
      {item.empresa && <p className="fd-empresa">{item.empresa}</p>}
      
      <div className="mapa-popup-desc-container">
        <p className="mapa-popup-desc truncate-4">
          {descricaoLimpa}
        </p>
      </div>
      
      {item.endereco && <p className="apoio-endereco">📍 {item.endereco}</p>}
      
      <div className="fd-card-acoes">
        <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="btn-secundario btn-mapa">
          🗺️ Como chegar
        </a>
        {item.link_inscricao && (
          <a href={item.link_inscricao} target="_blank" rel="noopener noreferrer" className="btn-primario btn-contato">
            Entrar em contato
          </a>
        )}
      </div>
    </div>
  );
}

function CardOportunidade({ item }: { item: Oportunidade }) {
  const externo = item.link_inscricao && !item.id;
  const descricaoLimpa = decodeHtml(item.descricao);

  const conteudo = (
    <>
      <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
        {iconeTipo(item.tipo)}{item.tipo}
      </span>
      <h3>{item.titulo}</h3>
      {item.empresa && <p className="fd-empresa-meta">{item.empresa}</p>}
      <p className="mapa-popup-desc truncate-3">{descricaoLimpa}</p>
      <div className="fd-card-meta">
        {item.bairro && (
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {item.bairro}
          </span>
        )}
        {item.horario && (
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {item.horario.split(',')[0]}
          </span>
        )}
      </div>
    </>
  );

  if (externo) {
    return (
      <a href={item.link_inscricao} target="_blank" rel="noopener noreferrer" className="fd-card surgir">
        {conteudo}
      </a>
    );
  }

  return (
    <Link to={`/oportunidades/${item.id}`} className="fd-card surgir">
      {conteudo}
    </Link>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Feed() {
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  
  const toast = useToast();
  const { estado: estadoSessao } = useSessao();
  const logada = estadoSessao === 'logado';

  const carregar = async () => {
    setEstado('carregando');
    try {
      const params = new URLSearchParams();
      if (filtro) params.set('tipo', filtro);
      if (busca) params.set('bairro', busca);
      const qs = params.toString();
      
      const [internas, externas] = await Promise.all([
        apiJSON<Oportunidade[]>(`/oportunidades?${qs}`).catch(() => []),
        apiJSON<Oportunidade[]>(`/oportunidades/externas?${qs}`).catch(() => []),
      ]);
      
      setOportunidades([...internas, ...externas]);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar oportunidades.');
    }
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  // Filtro local por busca (título/bairro)
  const filtradas = oportunidades.filter((o) => {
    if (busca) {
      const termo = busca.toLowerCase();
      const matchTitulo = o.titulo.toLowerCase().includes(termo);
      const matchBairro = o.bairro?.toLowerCase().includes(termo) ?? false;
      return matchTitulo || matchBairro;
    }
    return true;
  });

  const isEmpregoEmptyFallback = (estado === 'erro' || (estado === 'ok' && filtradas.length === 0)) && filtro === 'Emprego';

  return (
    <>
      <section className="fd-hero">
        <div className="container">
          <h1 className="fd-hero-titulo">Oportunidades para você</h1>
          <p className="fd-hero-sub">
            {estado === 'carregando' 
              ? 'Carregando oportunidades…' 
              : `Encontramos ${filtradas.length} oportunidade${filtradas.length !== 1 ? 's' : ''} que combinam com seu perfil.`}
          </p>
          
          <div className="fd-hero-busca-container">
            <svg className="fd-hero-busca-icone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou bairro…"
              className="fd-hero-busca-input"
            />
          </div>

          <div className="fd-filtros surgir">
            {tags.map((t) => (
              <button 
                key={t.valor} 
                className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} 
                onClick={() => setFiltro(t.valor)}
              >
                {t.valor && iconeTipo(t.valor)}
                {t.rotulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        {estado === 'carregando' ? (
          <div className="fd-grade fd-grade-padded">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="fd-skeleton">
                <div className="fd-skel-tag" />
                <div className="fd-skel-linha" />
                <div className="fd-skel-linha curta" />
                <div className="fd-skel-linha curta fd-skel-linha-40" />
              </div>
            ))}
          </div>
        ) : isEmpregoEmptyFallback ? (
          <div className="fd-grade">
            <CardGuiaVagas />
          </div>
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <div className="fd-vazio-icone">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar as oportunidades. Verifique sua conexão e tente novamente.</p>
            <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="fd-vazio">
            <div className="fd-vazio-icone-destaque">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>Nenhuma oportunidade encontrada</h3>
            <p>Tente novamente em alguns instantes, ajuste os filtros ou experimente uma categoria diferente.</p>
            <div className="fd-vazio-acoes">
              {!logada && (
                <a href="/cadastro" className="btn-primario">Criar minha conta gratuita</a>
              )}
              <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
            </div>
          </div>
        ) : (
          <div className="fd-grade">
            {/* Sempre mostra o Guia de Vagas primeiro se estiver buscando por Emprego ou Todas */}
            {(filtro === '' || filtro === 'Emprego') && <CardGuiaVagas />}
            
            {filtradas.map((item, i) => {
              if (!item) return null;
              const key = item.id ? `item-${item.id}` : `idx-${i}`;
              if (item.tipo === 'Apoio') {
                return <CardApoio key={key} item={item} />;
              }
              return <CardOportunidade key={key} item={item} />;
            })}
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}