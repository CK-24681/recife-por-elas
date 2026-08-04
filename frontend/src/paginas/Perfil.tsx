import { useState, useEffect, type FormEvent } from 'react';
import { apiJSON } from '../api';
import { useSessao } from '../sessao';
import { useToast } from '../toast';

interface PerfilDados {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  bairro: string;
  filhos: number;
  idades_filhos: string;
  turno_disponivel: string;
  interesses: string;
}

const mascaraCpf = (v: string) => {
  v = v.replace(/\D/g, '').slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const mascaraTel = (v: string) => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};
const mascaraData = (v: string) => {
  v = v.replace(/\D/g, '').slice(0, 8);
  if (v.length > 4) return v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d{2})/, '$1/$2');
  return v;
};

export default function Perfil() {
  const { usuario } = useSessao();
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState<PerfilDados>({ nome: '', email: '', telefone: '', cpf: '', data_nascimento: '', bairro: '', filhos: 0, idades_filhos: '', turno_disponivel: '', interesses: '' });
  const [form, setForm] = useState<PerfilDados>(dados);
  const [salvando, setSalvando] = useState(false);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');

  const carregar = async () => {
    setEstado('carregando');
    try {
      const data = await apiJSON<PerfilDados>('/perfil');
      setDados(data);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar perfil.');
    }
  };

  useEffect(() => { carregar(); }, []);

  const iniciarEdicao = () => { setForm({ ...dados }); setEditando(true); };
  const cancelar = () => { setEditando(false); setForm({ ...dados }); };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await apiJSON('/perfil', { method: 'PUT', corpo: form });
      toast.sucesso('Perfil salvo!');
      setDados({ ...form });
      setEditando(false);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const iniciais = (dados.nome || usuario?.nome || 'A').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  const listaInteresses = (raw: string): string[] => {
    if (!raw) return [];
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch { /* segue */ }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  if (estado === 'carregando') {
    return (
      <>
        <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
          <div className="container">
            <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700}}>Meu perfil</h1>
          </div>
        </section>
        <section className="container" style={{paddingBlock:48,textAlign:'center'}}>
          <div className="sessao-spinner" style={{margin:'0 auto'}} />
        </section>
      </>
    );
  }

  return (
    <>
      <section style={{background:'var(--fundo-suave)',borderBottom:'1px solid var(--borda)',paddingBlock:'clamp(28px,4vw,48px)'}}>
        <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <h1 style={{fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:700}}>Meu perfil</h1>
          {!editando && (
            <button className="btn-secundario" onClick={iniciarEdicao}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar dados
            </button>
          )}
        </div>
      </section>

      <section className="container">
        {!editando ? (
          <div className="pf-grid">
            <div className="pf-sidebar">
              <div className="pf-avatar-g">{iniciais}</div>
              <h3>{dados.nome}</h3>
              <p>{dados.filhos} filho{dados.filhos !== 1 ? 's' : ''} · {dados.bairro}</p>
              <p style={{fontSize:12,color:'var(--texto-suave)'}}>{dados.email}</p>
            </div>
            <div className="pf-info">
              <div className="pf-campo"><strong>CPF</strong><span>{dados.cpf}</span></div>
              <div className="pf-campo"><strong>Telefone</strong><span>{dados.telefone}</span></div>
              <div className="pf-campo"><strong>Data de nascimento</strong><span>{dados.data_nascimento}</span></div>
              <div className="pf-campo"><strong>Bairro</strong><span>{dados.bairro}</span></div>
              <div className="pf-campo"><strong>Filhos</strong><span>{dados.filhos}</span></div>
              <div className="pf-campo"><strong>Idades</strong><span>{dados.idades_filhos}</span></div>
              <div className="pf-campo"><strong>Turno disponível</strong><span>{dados.turno_disponivel}</span></div>
              <div className="pf-campo cheio">
                <strong>Interesses</strong>
                <div className="pf-interesses">
                  {listaInteresses(dados.interesses).map((i) => <span key={i} className="pf-interesse">{i}</span>)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="container" onSubmit={salvar} style={{paddingBlock:'clamp(28px,5vw,48px)',maxWidth:640}}>
            <div className="pf-form">
              <label className="cheio">Nome completo <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome completo" required /></label>
              <label>E-mail <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required /></label>
              <label>Telefone <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: mascaraTel(e.target.value) })} placeholder="(81) 99999-9999" /></label>
              <label>CPF <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: mascaraCpf(e.target.value) })} placeholder="000.000.000-00" /></label>
              <label>Data de nascimento <input value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: mascaraData(e.target.value) })} placeholder="DD/MM/AAAA" /></label>
              <label>Bairro <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Ex.: Ibura" /></label>
              <label>Filhos <select value={form.filhos} onChange={(e) => setForm({ ...form, filhos: Number(e.target.value) })}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4 ou mais</option></select></label>
              <label>Idades dos filhos <input value={form.idades_filhos} onChange={(e) => setForm({ ...form, idades_filhos: e.target.value })} placeholder="Ex.: 6 e 9 anos" /></label>
              <label>Turno disponível
                <select value={form.turno_disponivel} onChange={(e) => setForm({ ...form, turno_disponivel: e.target.value })}>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Manhã e tarde">Manhã e tarde</option>
                  <option value="Horário flexível">Horário flexível</option>
                </select>
              </label>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:24}}>
              <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>
              <button type="submit" className="btn-primario" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </section>
      {toast.container}
    </>
  );
}
