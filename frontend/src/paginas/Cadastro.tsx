import { useState, type FormEvent } from 'react';
import { Link } from '../utils/roteador';
import { cadastrar, apiJSON } from '../services/api';
import { useSessao } from '../context/sessao';
import { useToast } from '../utils/toast';

type Passo = 'criar-conta' | 'dados-pessoais' | 'contexto' | 'concluido';

export default function Cadastro() {
  const { definirUsuario } = useSessao();
  const toast = useToast();
  const [passo, setPasso] = useState<Passo>('criar-conta');

  // passo 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  // passo 2
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [bairro, setBairro] = useState('');

  // passo 3
  const [qtdFilhos, setQtdFilhos] = useState('Nenhum');
  const [idadesFilhos, setIdadesFilhos] = useState<string[]>([]);
  const [turno, setTurno] = useState('');

  // máscara CPF
  const mascaraCpf = (v: string) => {
    v = v.replace(/\D/g, '').slice(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  // máscara celular
  const mascaraTel = (v: string) => {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const criarConta = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (senha.length < 8) { setErro('A senha precisa ter pelo menos 8 caracteres.'); return; }
    setCriando(true);
    try {
      const usuario = await cadastrar(nome, email, senha);
      definirUsuario(usuario);
      setPasso('dados-pessoais');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setCriando(false);
    }
  };

  const passoDados = (e: FormEvent) => { e.preventDefault(); setPasso('contexto'); };
  const passoContexto = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiJSON('/perfil', {
        method: 'PUT',
        corpo: {
          cpf,
          telefone,
          data_nascimento: dataNascimento,
          bairro,
          filhos: qtdFilhos === 'Nenhum' ? 0 : qtdFilhos === '10+' ? idadesFilhos.length : parseInt(qtdFilhos),
          idades_filhos: qtdFilhos !== 'Nenhum' ? JSON.stringify(idadesFilhos) : '[]',
          turno_disponivel: turno,
        },
      });
      setPasso('concluido');
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao salvar contexto.');
    }
  };

  const progresso = passo === 'criar-conta' ? 1 : passo === 'dados-pessoais' ? 2 : passo === 'contexto' ? 3 : 4;

  return (
    <div className="cd-onboard">
      <header className="cd-onboard-topo">
        <Link to="/" className="cd-onboard-logo">Recife<strong>PorElas</strong></Link>
        <div className="cd-progresso">
          <span className={`cd-step-dot ${progresso >= 1 ? 'feito' : ''} ${progresso === 1 ? 'atual' : ''}`} />
          <span className={`cd-step-dot ${progresso >= 2 ? 'feito' : ''} ${progresso === 2 ? 'atual' : ''}`} />
          <span className={`cd-step-dot ${progresso >= 3 ? 'feito' : ''} ${progresso === 3 ? 'atual' : ''}`} />
          <span className={`cd-step-dot ${progresso >= 4 ? 'feito' : ''}`} />
        </div>
      </header>

      <main className="cd-onboard-corpo">
        {passo === 'criar-conta' && (
          <div className="cd-onboard-card entrada-hero">
            <h2>Crie sua conta gratuita</h2>
            <p>Leva menos de um minuto. Depois a gente personaliza as oportunidades pra você.</p>
            <form className="cd-onboard-form" onSubmit={criarConta}>
              <label>Nome completo <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria José da Silva" required /></label>
              <label>E-mail <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required /></label>
              <label>
                Senha
                <span className="auth-senha">
                  <input type={verSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required />
                  <button type="button" className="auth-olho" onClick={() => setVerSenha((v) => !v)} aria-label="mostrar/ocultar senha">{verSenha ? 'ocultar' : 'mostrar'}</button>
                </span>
              </label>
              {erro && <div className="auth-erro" role="alert">{erro}</div>}
              <p style={{fontSize:12,color:'var(--texto-suave)',margin:0}}>Ao continuar, você concorda com a nossa <Link to="/privacidade" style={{color:'var(--cor-primaria)'}}>Política de privacidade</Link>.</p>
              <button type="submit" className="btn-primario" disabled={criando} style={{justifySelf:'flex-start'}}>
                {criando ? 'Criando conta…' : 'Criar conta'}
              </button>
            </form>
            <p style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)',margin:0,paddingTop:12,borderTop:'1px solid var(--borda)'}}>
              Já tem conta? <Link to="/entrar" style={{color:'var(--cor-primaria)',fontWeight:600}}>Entrar</Link>
            </p>
          </div>
        )}

        {passo === 'dados-pessoais' && (
          <div className="cd-onboard-card entrada-hero">
            <h2>Seus dados pessoais</h2>
            <p>Essas informações nos ajudam a encontrar as melhores oportunidades para você.</p>
            <form className="cd-onboard-form" onSubmit={passoDados}>
              <label>CPF <input value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="000.000.000-00" /></label>
              <label>Telefone (WhatsApp) <input value={telefone} onChange={(e) => setTelefone(mascaraTel(e.target.value))} placeholder="(81) 99999-9999" /></label>
              <label>Data de nascimento <input type="text" value={dataNascimento} onChange={(e) => { const v = e.target.value.replace(/\D/g,'').slice(0,8); if (v.length>4) setDataNascimento(v.replace(/(\d{2})(\d{2})(\d{4})/,'$1/$2/$3')); else if (v.length>2) setDataNascimento(v.replace(/(\d{2})(\d{2})/,'$1/$2/')); else setDataNascimento(v); }} placeholder="DD/MM/AAAA" /></label>
              <label>Bairro onde mora <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex.: Ibura, Boa Viagem…" /></label>
              <div className="cd-onboard-acoes">
                <button type="button" className="btn-secundario" onClick={() => setPasso('criar-conta')}>Voltar</button>
                <button type="submit" className="btn-primario">Continuar</button>
              </div>
            </form>
          </div>
        )}

        {passo === 'contexto' && (
          <div className="cd-onboard-card entrada-hero">
            <h2>Seu contexto familiar</h2>
            <p>Isso nos ajuda a priorizar vagas que respeitam sua rotina.</p>
            <form className="cd-onboard-form" onSubmit={passoContexto}>
              <label>Quantos filhos você tem?
                <select value={qtdFilhos} onChange={(e) => {
                  const val = e.target.value;
                  setQtdFilhos(val);
                  if (val === 'Nenhum') {
                    setIdadesFilhos([]);
                  } else {
                    const minCount = val === '10+' ? 10 : parseInt(val);
                    setIdadesFilhos(prev => {
                      let novas = [...prev];
                      if (novas.length < minCount) {
                        while (novas.length < minCount) novas.push('');
                      } else if (novas.length > minCount && val !== '10+') {
                        novas = novas.slice(0, minCount);
                      }
                      return novas;
                    });
                  }
                }}>
                  <option value="Nenhum">Nenhum</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10+">10+</option>
                </select>
              </label>

              {qtdFilhos !== 'Nenhum' && idadesFilhos.map((idade, index) => (
                <label key={index}>Idade do {index + 1}º filho
                  <select value={idade} onChange={(e) => { const n = [...idadesFilhos]; n[index] = e.target.value; setIdadesFilhos(n); }} required>
                    <option value="">Selecione a idade</option>
                    {Array.from({ length: 18 }, (_, i) => (
                      <option key={i} value={String(i)}>{i}</option>
                    ))}
                    <option value="18+">18+</option>
                  </select>
                </label>
              ))}

              {qtdFilhos === '10+' && (
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setIdadesFilhos(prev => [...prev, ''])}
                  style={{ marginBottom: 16, marginTop: -8 }}
                >
                  + Adicionar mais um filho
                </button>
              )}

              <label>Turno disponível para trabalhar/estudar
                <select value={turno} onChange={(e) => setTurno(e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                  <option value="manha-tarde">Manhã e tarde</option>
                  <option value="flexivel">Horário flexível</option>
                </select>
              </label>
              <div className="cd-onboard-acoes">
                <button type="button" className="btn-secundario" onClick={() => setPasso('dados-pessoais')}>Voltar</button>
                <button type="submit" className="btn-primario">Concluir cadastro</button>
              </div>
            </form>
          </div>
        )}

        {passo === 'concluido' && (
          <div className="cd-onboard-card entrada-hero" style={{textAlign:'center',alignItems:'center'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'var(--cor-primaria-suave)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--cor-primaria)',margin:'0 auto 16px'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{marginBottom:8}}>Tudo pronto, {nome.split(' ')[0]}!</h2>
            <p style={{marginBottom:24}}>Seu cadastro foi concluído. Agora você já pode explorar as oportunidades que combinam com seu perfil.</p>
            <Link to="/" className="btn-primario">Explorar oportunidades</Link>
          </div>
        )}
      </main>
      {toast.container}
    </div>
  );
}
