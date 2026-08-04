import { useState, useEffect, type FormEvent } from 'react';
import { Link } from '../roteador';
import { apiJSON } from '../api';
import { useToast } from '../toast';
import { useSessao } from '../sessao';

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

// ─── Helper: decodifica entidades HTML e remove tags residuais ───────────────
// Seguro contra XSS: usa DOMParser isolado, nunca injeta no DOM real.
function decodeHtml(raw: string): string {
  if (!raw) return '';
  // Remove tags HTML primeiro
  const semTags = raw.replace(/<[^>]*>/g, ' ');
  // Decodifica entidades comuns sem usar innerHTML
  return semTags
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
// ─────────────────────────────────────────────────────────────────────────────

const tags: { valor: string; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'Emprego', rotulo: 'Empregos' },
  { valor: 'Curso', rotulo: 'Cursos' },
  { valor: 'Benefício social', rotulo: 'Benefícios' },
  { valor: 'Apoio', rotulo: 'Rede de Apoio' },
];

const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Manhã e tarde', 'Horário flexível'];

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

// Empty state específico por filtro
const emptyStateMensagem = (filtro: string): { titulo: string; texto: string } => {
  if (filtro === 'Curso') return {
    titulo: 'Nenhum curso disponível agora',
    texto: 'A plataforma EV.G (ENAP) e outros parceiros são consultados em tempo real. As vagas de cursos gratuitos costumam ser publicadas em lotes — tente novamente em instantes.',
  };
  if (filtro === 'Benefício social') return {
    titulo: 'Informações de benefícios indisponíveis',
    texto: 'O Portal da Transparência do Governo Federal está temporariamente sem resposta. As informações sobre Bolsa Família, BPC e PETI devem voltar em breve.',
  };
  if (filtro === 'Emprego') return {
    titulo: 'Nenhuma vaga em Recife agora',
    texto: 'A busca em tempo real não retornou vagas no momento. Novas oportunidades em Recife são publicadas todos os dias — volte mais tarde ou ajuste o filtro.',
  };
  return {
    titulo: 'Nenhuma oportunidade encontrada',
    texto: 'As fontes públicas são consultadas em tempo real. Tente novamente em alguns instantes, ajuste os filtros ou experimente uma categoria diferente.',
  };
};

// Card rápido de turno — permite alterar sem sair do feed
function CardTurnoRapido() {
  const { usuario } = useSessao();
  const toast = useToast();
  const [turno, setTurno] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    apiJSON<{ turno_disponivel: string }>('/perfil')
      .then((d) => { setTurno(d.turno_disponivel || ''); setCarregado(true); })
      .catch(() => setCarregado(true));
  }, [usuario]);

  const salvarTurno = async (e: FormEvent<HTMLSelectElement>) => {
    const novoTurno = e.currentTarget.value;
    setTurno(novoTurno);
    setSalvando(true);
    try {
      await apiJSON('/perfil', { method: 'PUT', corpo: { turno_disponivel: novoTurno } });
      toast.sucesso('Turno atualizado!');
    } catch {
      toast.erro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (!carregado) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      background: 'var(--fundo-suave)', border: '1px solid var(--borda)',
      borderRadius: 10, padding: '10px 16px', marginTop: 16, maxWidth: 440,
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cor-primaria)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span style={{ fontSize: 13, color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>Seu turno disponível:</span>
      <select
        id="turno-rapido"
        value={turno}
        onChange={salvarTurno}
        disabled={salvando}
        aria-label="Alterar turno disponível"
        style={{
          fontSize: 13, fontFamily: 'var(--fonte-corpo)', border: '1px solid var(--borda)',
          borderRadius: 6, padding: '4px 8px', background: '#fff',
          color: 'var(--texto)', cursor: 'pointer', flex: 1, minWidth: 140,
        }}
      >
        <option value="">Não informado</option>
        {TURNOS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {salvando && <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>Salvando…</span>}
    </div>
  );
}

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

  // Filtro local por busca (título/bairro) — complementa o filtro de tipo do backend
  const filtradas = oportunidades.filter((o) => {
    if (busca && !o.titulo.toLowerCase().includes(busca.toLowerCase()) && !o.bairro.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const { titulo: emptyTitulo, texto: emptyTexto } = emptyStateMensagem(filtro);

  return (
    <>
      <section className="fd-hero">
        <div className="container">
          <h1 className="fd-hero-titulo">Oportunidades para você</h1>
          <p className="fd-hero-sub">{estado === 'carregando' ? 'Carregando oportunidades…' : `Encontramos ${filtradas.length} oportunidade${filtradas.length !== 1 ? 's' : ''} que combinam com seu perfil.`}</p>
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
          {/* Card de turno rápido — apenas para usuárias logadas */}
          {logada && <CardTurnoRapido />}
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
            <h3>{emptyTitulo}</h3>
            <p>{emptyTexto}</p>
            <div className="fd-vazio-acoes">
              {/* CTA de cadastro visível apenas para usuárias NÃO logadas */}
              {!logada && (
                <a href="/cadastro" className="btn-primario">Criar minha conta gratuita</a>
              )}
              <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
            </div>
          </div>
        ) : (
          <div className="fd-grade">
            {(filtro === '' || filtro === 'Emprego') && (
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
            )}
            {filtradas.map((item: Oportunidade, i: number) => {
              const externo = item.link_inscricao && !item.id;
              // Descrição decodificada e limpa — seguro contra XSS
              const descricaoLimpa = decodeHtml(item.descricao);

              if (item.tipo === 'Apoio') {
                const gmapsLink = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
                return (
                  <div key={`apoio-${i}`} className="fd-card surgir">
                    <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
                      {iconeTipo(item.tipo)}{item.tipo}
                    </span>
                    <h3>{item.titulo}</h3>
                    {item.empresa && <p className="fd-empresa">{item.empresa}</p>}
                    
                    {/* Se tiver "Status de Vagas" na descrição (Creches) */}
                    {item.descricao.includes('Status de Vagas') ? (
                       <>
                         <p className="mapa-popup-desc truncate-3">
                           {item.descricao.split('Status de Vagas:')[0].trim()}
                         </p>
                         <p className="mapa-popup-status">
                           Status de Vagas: {item.descricao.split('Status de Vagas:')[1].trim()}
                         </p>
                       </>
                    ) : (
                       <p className="mapa-popup-desc truncate-4">
                         {item.descricao}
                       </p>
                    )}
                    
                    <p className="apoio-endereco">📍 {item.endereco}</p>
                    
                    <div className="mapa-popup-actions mt-24">
                      {item.latitude && item.longitude && (
                        <a href={gmapsLink} target="_blank" rel="noopener noreferrer" className="mapa-btn-acao secundario">
                          🗺️ Como chegar
                        </a>
                      )}
                      {item.link_inscricao && (
                        <a href={item.link_inscricao} target="_blank" rel="noopener noreferrer" className="mapa-btn-acao primario">
                          Entrar em contato
                        </a>
                      )}
                    </div>
                  </div>
                );
              }

              if (externo) {
                return (
                  <a key={`ext-${i}`} href={item.link_inscricao} target="_blank" rel="noopener noreferrer" className="fd-card surgir">
                    <span className={`fd-card-tag ${tagClass(item.tipo)}`}>
                      {iconeTipo(item.tipo)}{item.tipo}
                    </span>
                    <h3>{item.titulo}</h3>
                    {item.empresa && <p className="fd-empresa">{item.empresa}</p>}
                    <p className="mapa-popup-desc truncate-3">{descricaoLimpa}</p>
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
                  {item.empresa && <p className="fd-empresa-meta">{item.empresa}</p>}
                  <p className="mapa-popup-desc truncate-3">{descricaoLimpa}</p>
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
