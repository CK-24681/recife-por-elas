// SESSÃO embutida — o padrão CORRETO de "quem está logado" + guarda de rota.
// REUSE isto em TODA app com login: NUNCA escreva sua própria lógica de
// "usuario null → redireciona". O bug clássico (que já custou várias rodadas):
// o usuário LOGADO dá F5 e é chutado pra home porque o eu() ainda está
// carregando (usuario começa null). O <Protegido> resolve com 3 ESTADOS:
// carregando (spinner) · logado (renderiza) · deslogado (vai pro /entrar).
//
// USO:
//   // no topo do App: envolva tudo
//   <SessaoProvider><App/></SessaoProvider>
//   // FASE DE DESIGN (protótipo navegável, SEM login — como um Figma):
//   <SessaoProvider usuarioDemo={usuarioExemplo}><App/></SessaoProvider>
//   // numa página protegida:
//   <Protegido><MinhaTelaLogada/></Protegido>
//   // em qualquer componente:
//   const { usuario, estado, definirUsuario, encerrar } = useSessao();
//   // depois do login/cadastro: definirUsuario(usuarioRetornado)
//   // no botão sair: encerrar()
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { eu as buscarEu, sair as limparToken, type Usuario } from '../services/api';
import { navegar } from '../utils/roteador';

type Estado = 'carregando' | 'logado' | 'deslogado';

interface Sessao {
  usuario: Usuario | null;
  estado: Estado;
  definirUsuario: (u: Usuario) => void; // chame APÓS login/cadastro bem-sucedido
  encerrar: () => void; // logout (limpa token + volta pra home)
  recarregar: () => void; // re-busca o eu() (raro)
}

const Ctx = createContext<Sessao | null>(null);

// usuarioDemo — MODO PROTÓTIPO (só na fase de Design). Com ele a sessão já nasce
// "logada" nesse usuário de mentira, então TODAS as telas navegam sem login e o
// dono do projeto revisa o desenho inteiro como num Figma. Repare que isto NÃO
// fura o <Protegido>: a guarda continua idêntica: ela só vê estado='logado'.
// O usuário de demonstração vem do exemplo.ts — e a fase de Desenvolvimento
// APAGA o exemplo.ts, então o modo protótipo morre junto com o mock. Se este
// prop sobreviver até produção o gate do mock reprova a fase.
export function SessaoProvider({ children, usuarioDemo }: { children: ReactNode; usuarioDemo?: Usuario | null }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioDemo ?? null);
  const [estado, setEstado] = useState<Estado>(usuarioDemo ? 'logado' : 'carregando');

  const carregar = () => {
    if (usuarioDemo) return; // protótipo: não existe backend pra perguntar quem sou
    setEstado('carregando');
    buscarEu()
      .then((u) => {
        setUsuario(u);
        setEstado(u ? 'logado' : 'deslogado');
      })
      .catch(() => {
        setUsuario(null);
        setEstado('deslogado');
      });
  };
  useEffect(carregar, []);

  const valor: Sessao = {
    usuario,
    estado,
    definirUsuario: (u) => {
      setUsuario(u);
      setEstado('logado');
    },
    encerrar: () => {
      if (usuarioDemo) {
        navegar('/'); // protótipo: "sair" só passeia pra home, a sessão de mentira continua
        return;
      }
      limparToken();
      setUsuario(null);
      setEstado('deslogado');
      navegar('/');
    },
    recarregar: carregar,
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao(): Sessao {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  return c;
}

// Protegido — envolve páginas que EXIGEM login. Enquanto a sessão carrega mostra
// um placeholder (NUNCA redireciona nesse instante — é o que chuta o usuário
// logado no F5). Só manda pro /entrar quando CONFIRMA deslogado.
export function Protegido({ children, para = '/entrar' }: { children: ReactNode; para?: string }) {
  const { estado } = useSessao();
  useEffect(() => {
    if (estado === 'deslogado') navegar(para);
  }, [estado, para]);
  if (estado === 'carregando') {
    return (
      <div className="sessao-carregando" role="status" aria-live="polite">
        <span className="sessao-spinner" aria-hidden="true" />
        Carregando…
      </div>
    );
  }
  if (estado === 'deslogado') return null;
  return <>{children}</>;
}
