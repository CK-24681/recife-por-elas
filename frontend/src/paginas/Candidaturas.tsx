import { useState, useEffect } from 'react';
import { Link } from '../roteador';
import { apiJSON } from '../api';
import { useToast } from '../toast';

interface Candidatura {
  id: number;
  oportunidade_id: number;
  oportunidade_titulo: string;
  oportunidade_tipo: string;
  data_candidatura: string;
  mensagem: string;
  status: 'Enviada' | 'Em análise' | 'Aprovada' | 'Não selecionada';
}

const statusClass = (s: string) => {
  if (s === 'Enviada') return 'enviada';
  if (s === 'Em análise') return 'em-analise';
  if (s === 'Aprovada') return 'aprovada';
  return 'nao-selecionada';
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Candidaturas() {
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const toast = useToast();

  const carregar = async () => {
    setEstado('carregando');
    try {
      const data = await apiJSON<Candidatura[]>('/candidaturas');
      setCandidaturas(data);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar candidaturas.');
    }
  };

  useEffect(() => { carregar(); }, []);

  return (
    <>
      <section className="pagina-cabecalho">
        <div className="container">
          <h1 className="pagina-titulo">Minhas candidaturas</h1>
          <p className="pagina-subtitulo">{estado === 'carregando' ? 'Carregando…' : `${candidaturas.length} candidatura${candidaturas.length !== 1 ? 's' : ''} registrada${candidaturas.length !== 1 ? 's' : ''}`}</p>
        </div>
      </section>

      <section className="container">
        {estado === 'carregando' ? (
          <div className="cd-lista">
            {[1,2].map((i) => (
              <div key={i} className="fd-skeleton" style={{display:'flex',alignItems:'center',gap:16,padding:20}}>
                <div className="fd-skel-tag" />
                <div style={{flex:1}}>
                  <div className="fd-skel-linha" />
                  <div className="fd-skel-linha curta" style={{marginTop:8}} />
                </div>
              </div>
            ))}
          </div>
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--fundo-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--texto-suave)'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar suas candidaturas.</p>
            <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
          </div>
        ) : candidaturas.length === 0 ? (
          <div className="fd-vazio">
            <div style={{width:56,height:56,borderRadius:'50%',background:'var(--fundo-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--texto-suave)'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3>Nenhuma candidatura ainda</h3>
            <p>Explore as oportunidades disponíveis e candidate-se às que combinam com você.</p>
            <Link to="/" className="btn-primario">Explorar oportunidades</Link>
          </div>
        ) : (
          <div className="cd-lista">
            {candidaturas.map((c) => (
              <Link key={c.id} to={`/oportunidades/${c.oportunidade_id}`} className="cd-item surgir">
                <span className={`cd-status ${statusClass(c.status)}`}>{c.status}</span>
                <div className="cd-info">
                  <h3>{c.oportunidade_titulo}</h3>
                  <p>{c.oportunidade_tipo} · Enviada em {formatarData(c.data_candidatura)}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--texto-suave)',flex:'none'}}><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            ))}
          </div>
        )}
      </section>
      {toast.container}
    </>
  );
}
