import { useRef, useState } from 'react';
import { Link } from '../roteador';
import { perguntarChatbot } from './api';
import type { ChatbotMensagem } from './types';
import { ehLinkInterno } from './utils';

let proximoId = 1;

const BOAS_VINDAS: ChatbotMensagem = {
  id: 'boas-vindas',
  role: 'assistant',
  content: 'Oi! Posso ajudar com oportunidades, cursos, benefícios, mapa, Rede de Apoio e plano de carreira.',
  sugestoes: [
    { texto: 'Como funciona?', mensagem: 'Como funciona a plataforma?' },
    { texto: 'Ver oportunidades', mensagem: 'Quais oportunidades estão disponíveis?' },
  ],
};

export default function Chatbot() {
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagens, setMensagens] = useState<ChatbotMensagem[]>([BOAS_VINDAS]);
  const campo = useRef<HTMLTextAreaElement>(null);

  const enviar = async (textoForcado?: string) => {
    const texto = (textoForcado ?? mensagem).trim();
    if (!texto || enviando) return;
    const usuario: ChatbotMensagem = { id: `u-${proximoId++}`, role: 'user', content: texto };
    setMensagens((atuais) => [...atuais, usuario]);
    setMensagem('');
    setEnviando(true);
    try {
      const resposta = await perguntarChatbot(texto, [...mensagens, usuario]);
      setMensagens((atuais) => [...atuais, {
        id: `a-${proximoId++}`,
        role: 'assistant',
        content: resposta.resposta,
        fontes: resposta.fontes,
        sugestoes: resposta.sugestoes,
        requerLogin: resposta.requerLogin,
      }]);
    } catch (erro) {
      setMensagens((atuais) => [...atuais, {
        id: `e-${proximoId++}`,
        role: 'assistant',
        content: erro instanceof Error && erro.message ? erro.message : 'Não consegui responder agora. Tente novamente em instantes.',
      }]);
    } finally {
      setEnviando(false);
      window.setTimeout(() => campo.current?.focus(), 0);
    }
  };

  return (
    <div className={`chatbot ${aberto ? 'chatbot-aberto' : ''}`}>
      {aberto && (
        <section id="chatbot-painel" className="chatbot-painel" aria-label="Assistente Recife Por Elas">
          <header className="chatbot-cabeca">
            <div>
              <span className="chatbot-status">Assistente da plataforma</span>
              <h2>Recife Por Elas</h2>
            </div>
            <button type="button" className="chatbot-fechar" onClick={() => setAberto(false)} aria-label="Fechar assistente">×</button>
          </header>
          <div className="chatbot-conversa" aria-live="polite">
            {mensagens.map((item) => (
              <article key={item.id} className={`chatbot-mensagem chatbot-${item.role}`}>
                <p>{item.content}</p>
                {item.requerLogin && <Link to="/entrar" className="chatbot-link">Entrar na minha conta</Link>}
                {item.fontes && item.fontes.length > 0 && (
                  <div className="chatbot-fontes">
                    <span>Fontes na plataforma</span>
                    {item.fontes.map((fonte) => (
                      ehLinkInterno(fonte.url)
                        ? <Link key={`${fonte.titulo}-${fonte.url}`} to={fonte.url} className="chatbot-fonte">{fonte.titulo}</Link>
                        : <a key={`${fonte.titulo}-${fonte.url}`} href={fonte.url} target="_blank" rel="noopener noreferrer" className="chatbot-fonte">{fonte.titulo}</a>
                    ))}
                  </div>
                )}
                {item.sugestoes && item.sugestoes.length > 0 && (
                  <div className="chatbot-sugestoes">
                    {item.sugestoes.map((sugestao) => <button key={sugestao.mensagem} type="button" onClick={() => void enviar(sugestao.mensagem)}>{sugestao.texto}</button>)}
                  </div>
                )}
              </article>
            ))}
            {enviando && <div className="chatbot-mensagem chatbot-assistant"><p aria-label="Assistente respondendo">Consultando informações...</p></div>}
          </div>
          <form className="chatbot-form" onSubmit={(event) => { event.preventDefault(); void enviar(); }}>
            <textarea ref={campo} value={mensagem} onChange={(event) => setMensagem(event.target.value.slice(0, 1000))} placeholder="Escreva sua dúvida" rows={2} aria-label="Mensagem para o assistente" disabled={enviando} />
            <button type="submit" className="btn-primario" disabled={!mensagem.trim() || enviando}>Enviar</button>
          </form>
        </section>
      )}
      <button type="button" className="chatbot-botao" onClick={() => { setAberto((valor) => !valor); window.setTimeout(() => campo.current?.focus(), 0); }} aria-expanded={aberto} aria-controls="chatbot-painel">
        <span aria-hidden="true">?</span>
        <strong>{aberto ? 'Fechar' : 'Tire sua dúvida'}</strong>
      </button>
    </div>
  );
}
