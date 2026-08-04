import { useState, useEffect, type FormEvent } from 'react';
import { apiJSON } from '../api';
import { useToast } from '../toast';

interface MensagemMural {
  id: number;
  bairro: string;
  autor_nome: string;
  texto: string;
  data_publicacao: string;
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Mural() {
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [msgs, setMsgs] = useState<MensagemMural[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [bairro, setBairro] = useState('Ibura');

  // Carrega mensagens do bairro da usuária (R05)
  useEffect(() => {
    (async () => {
      // Tenta pegar o bairro do perfil
      try {
        const perfil = await apiJSON<{ bairro: string }>('/perfil');
        if (perfil.bairro) setBairro(perfil.bairro);
      } catch { /* usa 'Ibura' como fallback */ }
    })();
  }, []);

  const carregar = async () => {
    setEstado('carregando');
    try {
      const data = await apiJSON<MensagemMural[]>(`/mural?bairro=${encodeURIComponent(bairro)}`);
      setMsgs(data);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar mensagens.');
    }
  };

  useEffect(() => { carregar(); }, [bairro]);

  const publicar = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setPublicando(true);
    try {
      await apiJSON('/mural', { method: 'POST', corpo: { texto: texto.trim(), bairro } });
      toast.sucesso('Mensagem publicada!');
      setTexto('');
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao publicar.');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <>
      <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700,marginBottom:6}}>Rede de apoio</h1>
            <p style={{color:'var(--texto-suave)',fontSize:15}}>Mural do bairro {bairro} — troque apoio com outras mães</p>
          </div>
          <button className="btn-primario" onClick={() => setMostrarForm(!mostrarForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publicar
          </button>
        </div>
      </section>

      <section className="container" style={{paddingBlock:'clamp(28px,5vw,56px)'}}>
        {mostrarForm && (
          <form className="ml-form surgir" onSubmit={publicar}>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Compartilhe uma dúvida, dica ou mensagem de apoio com as outras mães do seu bairro…"
              required
            />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button type="button" className="btn-secundario" style={{fontSize:14}} onClick={() => { setMostrarForm(false); setTexto(''); }}>Cancelar</button>
              <button type="submit" className="btn-primario" style={{fontSize:14}} disabled={publicando}>
                {publicando ? 'Publicando…' : 'Publicar mensagem'}
              </button>
            </div>
          </form>
        )}

        <div className="ml-feed">
          {estado === 'carregando' ? (
            [1,2,3].map((i) => (
              <div key={i} className="fd-skeleton" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div className="fd-skel-tag" />
                  <div className="fd-skel-linha" style={{width:60}} />
                </div>
                <div className="fd-skel-linha" />
                <div className="fd-skel-linha curta" style={{marginTop:8}} />
              </div>
            ))
          ) : estado === 'erro' ? (
            <div className="fd-vazio">
              <h3>Erro ao carregar</h3>
              <p>Não foi possível carregar as mensagens do mural.</p>
              <button className="btn-secundario" onClick={carregar}>Tentar novamente</button>
            </div>
          ) : msgs.length === 0 ? (
            <div className="fd-vazio">
              <h3>Nenhuma mensagem ainda</h3>
              <p>Seja a primeira a escrever no mural do {bairro}!</p>
            </div>
          ) : (
            msgs.map((msg) => (
              <article key={msg.id} className="ml-msg surgir">
                <div className="ml-msg-topo">
                  <span className="ml-msg-autor">{msg.autor_nome}</span>
                  <span className="ml-msg-data">{formatarData(msg.data_publicacao)}</span>
                </div>
                <p className="ml-msg-texto">{msg.texto}</p>
              </article>
            ))
          )}
        </div>
      </section>
      {toast.container}
    </>
  );
}
