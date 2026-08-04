import { useState, useEffect, type FormEvent } from 'react';
import { Link, useCaminho } from '../roteador';
import { apiJSON } from '../api';
import { useToast } from '../toast';

interface Oportunidade {
  id: number;
  titulo: string;
  descricao: string;
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

const tagClass = (tipo: string) => {
  if (tipo === 'Emprego') return 'emprego';
  if (tipo === 'Curso') return 'curso';
  if (tipo === 'Benefício social') return 'beneficio';
  return 'credito';
};

export default function OportunidadeDetalhe() {
  const caminho = useCaminho();
  const id = caminho.split('/').pop() || '';
  const toast = useToast();

  const [op, setOp] = useState<Oportunidade | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    (async () => {
      setEstado('carregando');
      try {
        const data = await apiJSON<Oportunidade>(`/oportunidades/${id}`);
        setOp(data);
        setEstado('ok');
      } catch {
        setEstado('erro');
      }
    })();
  }, [id]);

  const candidatar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await apiJSON('/candidaturas', { method: 'POST', corpo: { oportunidade_id: Number(id), mensagem } });
      setEnviado(true);
      toast.sucesso('Candidatura enviada com sucesso!');
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao se candidatar.');
    } finally {
      setEnviando(false);
    }
  };

  if (estado === 'carregando') {
    return (
      <div className="container" style={{paddingBlock:80,textAlign:'center'}}>
        <div className="sessao-spinner" style={{margin:'0 auto 16px'}} />
        <p style={{color:'var(--texto-suave)'}}>Carregando oportunidade…</p>
      </div>
    );
  }

  if (estado === 'erro' || !op) {
    return (
      <div className="container" style={{paddingBlock:80,textAlign:'center'}}>
        <h2 style={{marginBottom:12}}>Oportunidade não encontrada</h2>
        <p style={{color:'var(--texto-suave)',marginBottom:24}}>Esta vaga pode ter expirado ou o link está incorreto.</p>
        <Link to="/" className="btn-primario">Voltar para o feed</Link>
      </div>
    );
  }

  return (
    <>
      <section className="dt-hero">
        <div className="container dt-conteudo">
          <div className="dt-principal">
            <Link to="/" className="dt-voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Voltar para o feed
            </Link>
            <h1 className="dt-titulo">{op.titulo}</h1>
            <p className="dt-descricao">{op.descricao}</p>
            <div className="dt-infos">
              <div className="dt-info"><strong>Bairro</strong><span>{op.bairro}</span></div>
              <div className="dt-info"><strong>Endereço</strong><span>{op.endereco}</span></div>
              <div className="dt-info"><strong>Horário</strong><span>{op.horario}</span></div>
              <div className="dt-info"><strong>Fonte</strong><span>{op.fonte}</span></div>
              <div className="dt-info"><strong>Inscrições</strong><span>{op.data_inicio_inscricao} até {op.data_fim_inscricao}</span></div>
              <div className="dt-info"><strong>Tipo</strong><span className={`dt-card-tag ${tagClass(op.tipo)}`}>{op.tipo}</span></div>
            </div>
          </div>

          <aside className="dt-sidebar">
            <div className="dt-card">
              <h4>Candidatar-se</h4>
              <span className={`dt-card-tag ${tagClass(op.tipo)}`}>{op.tipo}</span>
              {enviado ? (
                <div style={{textAlign:'center',padding:'16px 0'}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'#ecfdf5',display:'flex',alignItems:'center',justifyContent:'center',color:'#047857',margin:'0 auto 10px'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{fontSize:13,color:'#047857',fontWeight:600}}>Candidatura enviada!</p>
                  <Link to="/candidaturas" style={{fontSize:13,color:'var(--cor-primaria)',fontWeight:600,textDecoration:'none'}}>Acompanhar status</Link>
                </div>
              ) : mostrarForm ? (
                <form className="dt-app-form" onSubmit={candidatar}>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Escreva uma mensagem para a empresa ou instituição (opcional) — conte um pouco sobre você e por que esta oportunidade combina com seu momento."
                  />
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" className="btn-secundario" style={{flex:1,fontSize:14}} onClick={() => setMostrarForm(false)}>Cancelar</button>
                    <button type="submit" className="btn-primario" style={{flex:1,fontSize:14}} disabled={enviando}>
                      {enviando ? 'Enviando…' : 'Candidatar-se'}
                    </button>
                  </div>
                </form>
              ) : (
                <button className="btn-primario" onClick={() => setMostrarForm(true)}>Quero me candidatar</button>
              )}
            </div>

            <div className="dt-card">
              <h4>Como funciona</h4>
              <p>Ao se candidatar, seu perfil e sua mensagem são enviados para a {op.fonte}. Você pode acompanhar o status da candidatura na página "Minhas candidaturas".</p>
            </div>
          </aside>
        </div>
      </section>
      {toast.container}
    </>
  );
}
