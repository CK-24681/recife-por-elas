import { useEffect, useState } from 'react';
import { checarSaude } from './api';
import Auth from './Auth';
import { Link, navegar, useCaminho } from './roteador';
import { SessaoProvider, useSessao, Protegido } from './sessao';
import Feed from './paginas/Feed';
import OportunidadeDetalhe from './paginas/OportunidadeDetalhe';
import Mapa from './paginas/Mapa';
import Mural from './paginas/Mural';
import Perfil from './paginas/Perfil';
import Cadastro from './paginas/Cadastro';

export default function App() {
  return (
    <SessaoProvider>
      <Conteudo />
    </SessaoProvider>
  );
}

function Conteudo() {
  const { estado, definirUsuario, encerrar } = useSessao();
  const caminho = useCaminho();
  const [resetToken] = useState(() => new URLSearchParams(window.location.search).get('reset'));

  useEffect(() => {
    if (resetToken && caminho !== '/entrar') navegar('/entrar');
  }, [resetToken, caminho]);

  // ── /entrar ──
  if (caminho === '/entrar') {
    if (estado === 'logado') { navegar('/'); return null; }
    return (
      <Auth
        resetToken={resetToken}
        onLogado={(u) => { definirUsuario(u); if (resetToken) window.history.replaceState({}, '', '/'); navegar('/'); }}
        onVoltar={() => navegar('/')}
      />
    );
  }

  // ── /cadastro ──
  if (caminho === '/cadastro') {
    return <Cadastro />;
  }

  // ── /oportunidades/:id ──
  if (caminho.startsWith('/oportunidades/')) {
    return (
      <Protegido>
        <div className="pagina-topo">
          <HeaderApp />
          <OportunidadeDetalhe />
          <FooterLanding />
        </div>
      </Protegido>
    );
  }

  // ── /mapa ──
  if (caminho === '/mapa') {
    return (
      <Protegido>
        <div className="pagina-topo">
          <HeaderApp />
          <Mapa />
          <FooterLanding />
        </div>
      </Protegido>
    );
  }

  // ── /mural ──
  if (caminho === '/mural') {
    return (
      <Protegido>
        <div className="pagina-topo">
          <HeaderApp />
          <Mural />
          <FooterLanding />
        </div>
      </Protegido>
    );
  }

  // ── /perfil ──
  if (caminho === '/perfil') {
    return (
      <Protegido>
        <div className="pagina-topo">
          <HeaderApp />
          <Perfil />
          <FooterLanding />
        </div>
      </Protegido>
    );
  }

  // ── /privacidade ──
  if (caminho === '/privacidade') {
    return (
      <div className="pagina-topo">
        <HeaderLanding estado={estado} encerrar={encerrar} />
        <div className="container secao">
          <h1 className="secao-titulo" style={{marginBottom:24}}>Política de Privacidade</h1>
          <div style={{maxWidth:720,fontSize:15,color:'var(--texto-suave)',lineHeight:1.8}}>
            <p><strong>Recife Por Elas</strong> coleta apenas os dados necessários para conectar você a oportunidades de trabalho, capacitação e benefícios sociais.</p>
            <p style={{marginTop:16}}><strong>Dados coletados:</strong> nome, e-mail, cidade, bairro e preferências de oportunidades. Esses dados são usados exclusivamente para personalizar recomendações e nunca são compartilhados com terceiros sem seu consentimento.</p>
            <p style={{marginTop:16}}><strong>Seus direitos:</strong> você pode solicitar a exclusão dos seus dados a qualquer momento pelo e-mail contato@recifeporelas.org. Responderemos em até 15 dias.</p>
            <p style={{marginTop:16}}><strong>Armazenamento:</strong> seus dados ficam em servidores seguros no Brasil, seguindo a LGPD (Lei Geral de Proteção de Dados).</p>
            <p style={{marginTop:16}}>Última atualização: julho de 2026.</p>
          </div>
        </div>
        <FooterLanding />
      </div>
    );
  }

  // ── / (FEED quando logado, LANDING quando não) ──
  if (estado === 'logado') {
    return (
      <div className="pagina-topo">
        <HeaderApp />
        <Feed />
        <FooterLanding />
        <SaudeApi />
      </div>
    );
  }

  return (
    <div className="pagina-topo">
      <HeaderLanding estado={estado} encerrar={encerrar} />

      {/* HERO */}
      <section className="secao hp-hero" id="inicio">
        <div className="container hp-grade">
          <div className="hp-texto entrada-hero">
            <h1 className="hp-titulo">
              Oportunidades reais para <em>mulheres</em> que fazem o Recife acontecer
            </h1>
            <p className="hp-sub">
              Conectamos mulheres solo e mães solo a vagas de trabalho, cursos gratuitos, benefícios sociais e uma rede de apoio que entende sua realidade — tudo organizado por bairro e compatível com sua rotina.
            </p>
            <div className="hp-ctas">
              <Link to="/cadastro" className="btn-primario">Quero me cadastrar</Link>
              <a href="#como-funciona" className="hp-link">
                Como funciona
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
              </a>
            </div>
            <div className="hp-parceiros">
              <span>Apoiadores:</span>
              <div className="hp-selos">
                <span className="hp-selo"><span className="hp-selo-dot" style={{background:'var(--cor-primaria)'}}></span>Programa Recife Resolve</span>
                <span className="hp-selo"><span className="hp-selo-dot" style={{background:'var(--coral)'}}></span>Prefeitura do Recife</span>
                <span className="hp-selo"><span className="hp-selo-dot" style={{background:'#214E8A'}}></span>CESAR</span>
                <span className="hp-selo"><span className="hp-selo-dot" style={{background:'#4A90E2'}}></span>UK-Brazil Tech Hub</span>
              </div>
            </div>
          </div>
          <div className="hp-foto hover-zoom-foto entrada-hero">
            <img
              src="https://images.unsplash.com/photo-1621353417044-d9585aee7346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5ODQwNjl8MHwxfHNlYXJjaHw2fHxicmF6aWxpYW4lMjB3b21lbiUyMGNvbW11bml0eSUyMHN1cHBvcnQlMjBncm91cCUyMGVtcG93ZXJpbmclMjBkaXZlcnNlfGVufDF8MHx8fDE3ODU3NjkwMjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Mulheres em círculo de apoio mútuo, sorrindo e se abraçando"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* IMPACTO E CONTEXTO */}
      <section className="nu-faixa" id="impacto">
        <div className="container">
          <div className="nu-grade surgir">
            <div className="nu-item"><strong>11,3M</strong><span>de mães solo no Brasil</span></div>
            <div className="nu-item"><strong>Recife e RMR</strong><span>foco total de atuação</span></div>
            <div className="nu-item"><strong>100%</strong><span>gratuito para as mães</span></div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="secao cf-secao" id="como-funciona">
        <div className="container">
          <div className="secao-cabeca surgir">
            <span className="secao-etiqueta">Como funciona</span>
            <h2 className="secao-titulo">Três passos para recomeçar</h2>
            <p className="secao-sub">Simples, rápido e pensado para a sua realidade.</p>
          </div>
          <div className="cf-grade">
            <div className="cf-passo surgir">
              <span className="cf-num">1</span>
              <h3>Crie seu perfil</h3>
              <p>Conte pra gente seu bairro, horários disponíveis e o tipo de oportunidade que procura — emprego, curso, benefício ou apoio.</p>
            </div>
            <div className="cf-passo surgir surgir-2">
              <span className="cf-num">2</span>
              <h3>Receba recomendações</h3>
              <p>Todo dia, uma seleção de vagas e cursos que cabem na sua rotina, filtrados por distância e compatibilidade familiar.</p>
            </div>
            <div className="cf-passo surgir surgir-3">
              <span className="cf-num">3</span>
              <h3>Candidate-se com um toque</h3>
              <p>Viu algo que encaixa? Candidate-se direto pelo app. Acompanhe o status e receba apoio da nossa rede em cada etapa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section className="secao" id="recursos">
        <div className="container">
          <div className="secao-cabeca surgir">
            <span className="secao-etiqueta">O que oferecemos</span>
            <h2 className="secao-titulo">Tudo que você precisa, num só lugar</h2>
            <p className="secao-sub">Da busca por emprego ao acolhimento emocional — cada recurso pensado para sua jornada.</p>
          </div>
          <div className="rc-grade">
            <article className="rc-card surgir">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </span>
              <h3>Vagas de trabalho</h3>
              <p>Oportunidades com filtro por bairro, turno e compatibilidade com cuidados familiares. Vagas formais, temporárias e freelancer.</p>
            </article>
            <article className="rc-card surgir surgir-2">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </span>
              <h3>Cursos e capacitação</h3>
              <p>Formação profissional gratuita ou a preço acessível: informática, vendas, beleza, gastronomia, cuidadora e muito mais.</p>
            </article>
            <article className="rc-card surgir surgir-3">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <h3>Benefícios sociais</h3>
              <p>Informação clara sobre auxílios, bolsas e programas sociais que você tem direito, com ajuda para se inscrever.</p>
            </article>
            <article className="rc-card surgir">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </span>
              <h3>Apoio emocional</h3>
              <p>Rede de acolhimento com outras mulheres que entendem sua jornada. Grupos de apoio e escuta ativa por profissionais voluntárias.</p>
            </article>
            <article className="rc-card surgir surgir-2">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/></svg>
              </span>
              <h3>Busca por proximidade</h3>
              <p>Mapa interativo com oportunidades perto de você. Filtre por distância, avalie o transporte e escolha o que cabe no seu dia.</p>
            </article>
            <article className="rc-card surgir surgir-3">
              <span className="rc-icone">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>
              </span>
              <h3>Assistente inteligente</h3>
              <p>Recomendações diárias personalizadas: uma vaga, um curso, um benefício. E a explicação de por que cada item combina com você.</p>
            </article>
          </div>
        </div>
      </section>



      {/* FAQ */}
      <section className="secao" id="faq">
        <div className="container fq-caixa">
          <div className="secao-cabeca surgir">
            <span className="secao-etiqueta">Dúvidas</span>
            <h2 className="secao-titulo">Perguntas frequentes</h2>
          </div>
          <div className="fq-lista surgir">
            <details className="fq-item">
              <summary>O serviço é gratuito?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
              <p>Sim, totalmente gratuito para as mulheres. O Recife Por Elas é mantido por parcerias com a prefeitura, ONGs e institutos. Nenhuma taxa é cobrada em nenhuma etapa — do cadastro à candidatura.</p>
            </details>
            <details className="fq-item">
              <summary>Preciso ter experiência profissional?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
              <p>Não. Temos vagas para todos os níveis, inclusive primeiro emprego. Se você não tem experiência, o app prioriza mostrar cursos de capacitação e vagas de entrada que combinam com seu perfil.</p>
            </details>
            <details className="fq-item">
              <summary>Como vocês protegem meus dados?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
              <p>Seus dados são protegidos pela LGPD. Só usamos suas informações para personalizar recomendações de vagas e cursos. Nunca compartilhamos com terceiros sem seu consentimento explícito.</p>
            </details>
            <details className="fq-item">
              <summary>Consigo usar pelo celular?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
              <p>Sim, o Recife Por Elas foi feito para celular. Você pode acessar de qualquer smartphone com internet — não precisa instalar nada, é só abrir o navegador. Funciona até em conexões mais lentas.</p>
            </details>
            <details className="fq-item">
              <summary>E se eu não encontrar vagas no meu bairro?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></summary>
              <p>O app mostra vagas próximas, organizadas por distância. Você também pode buscar em bairros vizinhos. E se não houver nada no momento, a plataforma sugere cursos e capacitações enquanto novas vagas surgem.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ct-faixa" id="comecar">
        <div className="container ct-caixa">
          <h2 className="ct-titulo surgir">Ajude a construir essa comunidade</h2>
          <p className="ct-sub surgir">Estamos em fase inicial de testes. Cadastre-se para ser uma das nossas primeiras usuárias e ajude a moldar uma plataforma que respeita sua rotina e seu bairro.</p>
          <Link to="/cadastro" className="btn-secundario surgir">Fazer parte agora</Link>
        </div>
      </section>

      {/* FOOTER */}
      <FooterLanding />

      <SaudeApi />
    </div>
  );
}

// ─── Componentes compartilhados ───

// ─── Header do app logado (menu principal) ───
function HeaderApp() {
  const { usuario, encerrar } = useSessao();
  const caminho = useCaminho();
  const ativo = (p: string) => caminho === p || (p !== '/' && caminho.startsWith(p));
  const iniciais = (usuario?.nome || 'A').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <header className="hn-topo-app">
      <div className="container hn-linha-app">
        <Link to="/" className="hn-logo-app">Recife<strong>PorElas</strong></Link>
        <nav className="hn-menu-app">
          <Link to="/" className={ativo('/') && !ativo('/oportunidades') ? 'ativo' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span>Feed</span>
          </Link>
          <Link to="/mapa" className={ativo('/mapa') ? 'ativo' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/></svg>
            <span>Mapa</span>
          </Link>
          <Link to="/mural" className={ativo('/mural') ? 'ativo' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Rede</span>
          </Link>
        </nav>
        <div className="hn-acoes-app">
          <Link to="/perfil" className="hn-usuario-app" style={{textDecoration:'none'}}>
            <span className="hn-avatar-app">{iniciais}</span>
            <span>{usuario?.nome?.split(' ')[0]}</span>
          </Link>
          <button className="btn-secundario" style={{fontSize:13,padding:'0 12px',minHeight:34}} onClick={encerrar}>Sair</button>
        </div>
      </div>
    </header>
  );
}

function HeaderLanding({ estado, encerrar }: { estado: string; encerrar: () => void }) {
  return (
    <header className="hn-topo">
      <div className="container hn-linha">
        <a href="/" className="hn-logo">Recife<strong>PorElas</strong></a>
        <nav className="hn-nav">
          <a href="/#como-funciona">Como funciona</a>
          <a href="/#recursos">Recursos</a>
          <a href="/#faq">Dúvidas</a>
        </nav>
        <div className="hn-acoes">
          {estado === 'logado' ? (
            <>
              <Link to="/perfil" className="btn-secundario" style={{fontSize:14,padding:'0 14px',minHeight:38}}>Meu perfil</Link>
              <button className="btn-primario" style={{fontSize:14,padding:'0 14px',minHeight:38}} onClick={encerrar}>Sair</button>
            </>
          ) : (
            <Link to="/cadastro" className="btn-primario">Cadastre-se grátis</Link>
          )}
          <input type="checkbox" id="hn-menu" className="hn-check" aria-hidden="true" />
          <label htmlFor="hn-menu" className="hn-burger" aria-label="Abrir menu">
            <span></span><span></span><span></span>
          </label>
        </div>
        <nav className="hn-nav-movel">
          <a href="/#como-funciona">Como funciona</a>
          <a href="/#recursos">Recursos</a>
          <a href="/#faq">Dúvidas</a>
          {estado === 'logado' ? (
            <>
              <a href="/perfil">Meu perfil</a>
              <a href="/mural">Rede de apoio</a>
            </>
          ) : (
            <a href="/entrar">Entrar</a>
          )}
        </nav>
      </div>
    </header>
  );
}

function FooterLanding() {
  return (
    <footer className="rp-rodape">
      <div className="container">
        <div className="rp-grade">
          <div className="rp-marca">
            <a href="/" className="rp-logo">Recife<strong>PorElas</strong></a>
            <p>Conectando mulheres do Recife a oportunidades de trabalho, capacitação e apoio — respeitando sua rotina e seu território.</p>
          </div>
          <nav className="rp-col">
            <h4>Plataforma</h4>
            <a href="/#como-funciona">Como funciona</a>
            <a href="/#recursos">Recursos</a>
            <a href="/#faq">Dúvidas</a>
            <a href="/mapa">Mapa</a>
          </nav>
          <nav className="rp-col">
            <h4>Para você</h4>
            <a href="/cadastro">Criar conta</a>
            <a href="/mural">Rede de apoio</a>
          </nav>
          <nav className="rp-col">
            <h4>Legal</h4>
            <a href="/privacidade">Política de privacidade</a>
          </nav>
        </div>
        <div className="rp-base">
          <span>&copy; 2026 Recife Por Elas. Todos os direitos reservados.</span>
          <span>contato@recifeporelas.org</span>
        </div>
      </div>
    </footer>
  );
}

function SaudeApi() {
  const [, setStatus] = useState<'verificando' | 'online' | 'offline'>('verificando');
  useEffect(() => { checarSaude().then((ok) => setStatus(ok ? 'online' : 'offline')); }, []);
  return null; // invisível na landing — só debug
}
