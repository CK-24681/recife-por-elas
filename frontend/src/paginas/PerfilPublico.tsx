import { useState } from 'react';
import { useToast } from '../utils/toast';

export default function PerfilPublico() {
  const toast = useToast();
  const [abaAtual, setAbaAtual] = useState<'postagens' | 'servicos'>('postagens');

  // Mocks
  const nome = 'Maria Silva';
  const bairro = 'Santo Amaro';
  const bio = 'Mãe do Leo, confeiteira e buscando vagas na área de tecnologia.';
  const seguidores = 142;
  const seguindo = 89;

  return (
    <>
      <section className="perfil-publico-container">
        <div className="perfil-capa"></div>
        <div className="perfil-info">
          <div className="perfil-avatar-grande">
            {nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          
          <div className="perfil-botoes">
            <button 
              className="btn-primario" 
              style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '14px' }}
              onClick={() => toast.sucesso(`Você agora está seguindo ${nome}`)}
            >
              Seguir
            </button>
            <button 
              className="btn-secundario" 
              style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => toast.sucesso(`Mensagem para ${nome} em breve!`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Mensagem
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{nome}</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{bairro}</p>
            <p style={{ fontSize: '15px', color: '#374151', marginTop: '12px' }}>{bio}</p>
            
            <div className="perfil-stats">
              <span><strong>{seguidores}</strong> Seguidores</span>
              <span><strong>{seguindo}</strong> Seguindo</span>
            </div>
          </div>
        </div>

        <div className="mural-feed-tabs" style={{ marginTop: '16px', marginBottom: '0' }}>
          <button
            type="button"
            className={`mural-feed-tab ${abaAtual === 'postagens' ? 'ativo' : ''}`}
            onClick={() => setAbaAtual('postagens')}
          >
            Postagens
          </button>
          <button
            type="button"
            className={`mural-feed-tab ${abaAtual === 'servicos' ? 'ativo' : ''}`}
            onClick={() => setAbaAtual('servicos')}
          >
            Serviços
          </button>
        </div>

        <div style={{ padding: '20px', background: '#f9fafb', minHeight: '300px' }}>
          {abaAtual === 'postagens' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <article className="post-card">
                <header className="post-header">
                  <div className="post-avatar" aria-hidden="true">MS</div>
                  <div className="post-header-info">
                    <strong>Maria Silva</strong>
                    <p>Santo Amaro • há 2 dias</p>
                  </div>
                </header>
                <div className="post-badges">
                  <span className="mural-badge postagem">POSTAGEM</span>
                </div>
                <p className="mural-texto" style={{ fontSize: '15px', color: '#374151', lineHeight: '1.5' }}>
                  Muito feliz em compartilhar que comecei meu curso de programação ontem! A rede de apoio tem sido fundamental para conseguir conciliar com a rotina do Leo. ❤️
                </p>
                <div className="post-actions" style={{display: 'flex', justifyContent: 'space-between', gap: '4px'}}>
                  <button type="button" className="btn-acao ativo" onClick={() => toast.sucesso('Em breve: Curtir')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#E24C8F" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    <span style={{display: 'none', '@media (min-width: 600px)': {display: 'inline'}} as React.CSSProperties}>12 Curtidas</span>
                  </button>
                  <button type="button" className="btn-acao" onClick={() => toast.sucesso('Em breve: Respostas')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                    <span style={{display: 'none', '@media (min-width: 600px)': {display: 'inline'}} as React.CSSProperties}>4 Respostas</span>
                  </button>
                  <button type="button" className="btn-acao" onClick={() => toast.sucesso('Em breve: Salvar Posts!')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    <span style={{display: 'none', '@media (min-width: 600px)': {display: 'inline'}} as React.CSSProperties}>Salvar</span>
                  </button>
                  <button type="button" className="btn-acao" onClick={() => toast.sucesso('Em breve: Compartilhar Posts!')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                    <span style={{display: 'none', '@media (min-width: 600px)': {display: 'inline'}} as React.CSSProperties}>Compartilhar</span>
                  </button>
                </div>
              </article>
            </div>
          ) : (
            <div className="fd-vazio" style={{ background: 'transparent' }}>
              <h3>Nenhum serviço oferecido</h3>
              <p>Esta mãe ainda não cadastrou nenhum serviço na plataforma.</p>
            </div>
          )}
        </div>
      </section>
      
      {toast.container}
    </>
  );
}
