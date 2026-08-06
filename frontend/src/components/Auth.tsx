import { useState, type FormEvent } from 'react';
import { entrar, recuperar, redefinir, type Usuario } from '../services/api';
import { Link } from '../utils/roteador';

type Modo = 'entrar' | 'recuperar' | 'redefinir';

// Painel de autenticação seguro embutido no app base. Mostra login, cadastro,
// recuperação e (se vier ?reset=TOKEN na URL) a redefinição de senha.
export default function Auth({
  resetToken,
  onLogado,
  onVoltar,
}: {
  resetToken?: string | null;
  onLogado: (u: Usuario) => void;
  onVoltar: () => void;
}) {
  const [modo, setModo] = useState<Modo>(resetToken ? 'redefinir' : 'entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const limpar = () => {
    setErro('');
    setMsg('');
  };
  const trocar = (m: Modo) => {
    limpar();
    setSenha('');
    setModo(m);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    limpar();
    setCarregando(true);
    try {
      if (modo === 'entrar') {
        onLogado(await entrar(email, senha));
      } else if (modo === 'recuperar') {
        setMsg(await recuperar(email));
      } else if (modo === 'redefinir') {
        setMsg(await redefinir(resetToken || '', senha));
        setTimeout(() => trocar('entrar'), 1500);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'algo deu errado');
    } finally {
      setCarregando(false);
    }
  };

  const titulo =
    modo === 'entrar' ? 'Entrar' : modo === 'recuperar' ? 'Recuperar senha' : 'Nova senha';

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logos/quadrado.png" alt="Recife Por Elas" className="brand-logo-img" />
          <span>Recife<strong>PorElas</strong></span>
        </div>
        <button type="button" className="auth-voltar" onClick={onVoltar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Voltar ao início
        </button>
        <h2 className="auth-titulo">{titulo}</h2>

        <form className="auth-form" onSubmit={enviar}>
          {modo !== 'redefinir' && (
            <label>
              E-mail
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
            </label>
          )}
          {modo !== 'recuperar' && (
            <label>
              Senha
              <span className="auth-senha">
                <input
                  type={verSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder={modo === 'entrar' ? 'sua senha' : 'mínimo 8 caracteres'}
                  minLength={modo === 'entrar' ? undefined : 8}
                  required
                />
                <button type="button" className="auth-olho" onClick={() => setVerSenha((v) => !v)} aria-label="mostrar/ocultar senha">
                  {verSenha ? 'ocultar' : 'mostrar'}
                </button>
              </span>
            </label>
          )}

          {erro && <div className="auth-erro" role="alert">{erro}</div>}
          {msg && <div className="auth-ok" role="status">{msg}</div>}

          <button type="submit" className="auth-btn" disabled={carregando}>
            {carregando ? 'Aguarde…' : titulo}
          </button>
        </form>

        <div className="auth-links">
          {modo === 'entrar' && (
            <>
              <button type="button" onClick={() => trocar('recuperar')}>Esqueci minha senha</button>
              <p className="auth-dica" style={{ marginTop: '16px', fontSize: '14px', color: 'var(--texto-suave)' }}>
                Ainda não tem conta? <Link to="/cadastro" style={{ color: 'var(--cor-primaria)', fontWeight: 600 }}>Cadastre-se grátis</Link>
              </p>
            </>
          )}
          {(modo === 'recuperar' || modo === 'redefinir') && <button type="button" onClick={() => trocar('entrar')}>← Voltar para o login</button>}
        </div>
      </div>
    </main>
  );
}
