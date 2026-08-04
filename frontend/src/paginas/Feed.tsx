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

const tags: { valor: string; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Emprego', rotulo: 'Empregos' },
  { valor: 'Curso', rotulo: 'Cursos' },
  { valor: 'Benefício social', rotulo: 'Benefícios' },
  { valor: 'Microcrédito', rotulo: 'Microcrédito' },
];

const iconeTipo = (tipo: string) => {
  if (tipo === 'Emprego') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
  if (tipo === 'Curso') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
  if (tipo === 'Benefício social') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
};

const tagClass = (tipo: string) => {
  if (tipo === 'Emprego') return 'emprego';
  if (tipo === 'Curso') return 'curso';
  if (tipo === 'Benefício social') return 'beneficio';
  return 'credito';
};

export default function Feed() {
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const toast = useToast();

  const carregar = async () => {
    setEstado('carregando');
    try {
      const params = new URLSearchParams();
      if (filtro) params.set('tipo', filtro);
      if (busca) params.set('bairro', busca);
      const qs = params.toString();
      const [internas, externas] = await Promise.all([
        apiJSON<Oportunidade[]>(`/oportunidades?${qs}`).catch(() => [] as Oportunidade[]),
        apiJSON<Oportunidade[]>(`/oportunidades/externas?${qs}`).catch(() => [] as Oportunidade[]),
      ]);
      // Internas primeiro (têm id, permitem candidatura), depois externas
      setOportunidades([...internas, ...externas]);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar oportunidades.');
    }
  };

  useEffect(() => { carregar(); }, [filtro]);

  // Filtro local por busca (título) — complementa o filtro de bairro do backend
  const filtradas = oportunidades.filter((o) => {
    if (busca && !o.titulo.toLowerCase().includes(busca.toLowerCase()) && !o.bairro.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <section className="fd-hero">
        <div className="container">
          <h1 className="fd-hero-titulo">Oportunidades para você</h1>
          <p className="fd-hero-sub">{estado === 'carregando' ? 'Carregando oportunidades…' : `Encontramos ${filtradas.length} oportunidade${filtradas.length !== 1 ? 's' : ''} que combinam com seu perfil.`}</p>
          <div style={{position:'relative',maxWidth:440,marginTop:20}}>
            <svg style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--texto-suave)',pointerEvents:'none'}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou bairro…"
              style={{
                width:'100%',fontFamily:'var(--fonte-corpo)',fontSize:14,
                padding:'12px 14px 12px 40px',border:'1px solid var(--borda)',
                borderRadius:999,background:'#fff',outline:'none'
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--cor-primaria)'; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--borda)'; }}
            />
          </div>
          <div className="fd-filtros surgir">
            {tags.map((t) => (
              <button key={t.valor} className={`fd-filtro ${filtro === t.valor ? 'ativo' : ''}`} onClick={() => setFiltro(t.valor)}>
                {t.valor && iconeTipo(t.valor)}{t.rotulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        {estado === 'carregando' ? (
          <div className="fd-grade" style={{paddingBlock:'clamp(32px,5vw,56px)'}}>
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="fd-skeleton">
                <div className="fd-skel-tag" />
                <div className="fd-skel-linha" />
                <div className="fd-skel-linha curta" />
                <div className="fd-skel-linha curta" style={{width:'40%'}} />
              </div>
            ))}
          </div>
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--fundo-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--texto-suave)'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar as oportunidades. Verifique sua conexão e tente novamente.</p>
            <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="fd-vazio">
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--cor-primaria-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--cor-primaria)'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>Nenhuma oportunidade encontrada</h3>
            <p>As fontes públicas são consultadas em tempo real. Tente novamente em alguns instantes, ajuste os filtros ou crie uma conta para receber oportunidades personalizadas.</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
              <a href="/cadastro" className="btn-primario">Criar minha conta gratuita</a>
              <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
            </div>
          </div>
        ) : (
          <div className="fd-grade">
            {filtradas.map((item: Oportunidade, i: number) => {
              const externo = item.link_inscricao && !item.id;
              if (externo) {
                return (
                  <a key={`ext-${i}`} href={item.link_inscricao} target="_blank" rel="noopener noreferrer" className="fd-card surgir">
                    <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
                      {iconeTipo(item.tipo)}{item.tipo}
                    </span>
                    <h3>{item.titulo}</h3>
                    {item.empresa && <p style={{fontSize:12,color:'var(--texto-suave)',marginBottom:4,marginTop:-4,fontWeight:500}}>{item.empresa}</p>}
                    <p>{item.descricao}</p>
                    <div className="fd-card-meta">
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {item.bairro}
                      </span>
                      <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {item.horario ? item.horario.split(',')[0] : 'Flexível'}
                      </span>
                    </div>
                  </a>
                );
              }
              return (
                <Link key={item.id} to={`/oportunidades/${item.id}`} className="fd-card surgir">
                  <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
                    {iconeTipo(item.tipo)}{item.tipo}
                  </span>
                  <h3>{item.titulo}</h3>
                  {item.empresa && <p style={{fontSize:12,color:'var(--texto-suave)',marginBottom:4,marginTop:-4,fontWeight:500}}>{item.empresa}</p>}
                  <p>{item.descricao}</p>
                  <div className="fd-card-meta">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {item.bairro}
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {item.horario ? item.horario.split(',')[0] : 'Flexível'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}
