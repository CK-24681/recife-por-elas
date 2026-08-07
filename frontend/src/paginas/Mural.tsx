import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiJSON } from '../services/api';
import { enviarArquivo } from '../services/midia';
import { enviarImagem } from '../services/upload';
import { useSessao } from '../context/sessao';
import { useToast } from '../utils/toast';

type MuralTipo = 'postagem' | 'pedido';
type FiltroFeed = 'todas' | 'postagem' | 'pedido' | 'bairro';

interface MuralPost {
  id: string;
  usuario_id: string;
  autor_nome: string;
  bairro: string;
  tipo: MuralTipo;
  categoria: string;
  media_url: string;
  media_tipo: string;
  media_nome: string;
  texto: string;
  criado_em: string;
  likes_count: number;
  comments_count: number;
  me_liked: boolean;
}

interface MuralComment {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  usuario_id: string;
  autor_nome: string;
  texto: string;
  criado_em: string;
  likes_count: number;
  me_liked: boolean;
}

interface CommentNode extends MuralComment {
  filhos: CommentNode[];
}

const categoriasPedido = [
  'Ajuda com filhos',
  'Indicação de vaga',
  'Transporte',
  'Doação / empréstimo',
  'Currículo',
  'Apoio emocional',
  'Troca de serviço',
  'Outro',
];

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function montarArvore(comentarios: MuralComment[]): CommentNode[] {
  const mapa = new Map<string, CommentNode>();
  const raizes: CommentNode[] = [];

  comentarios.forEach((comentario) => {
    mapa.set(comentario.id, { ...comentario, filhos: [] });
  });

  comentarios.forEach((comentario) => {
    const nodo = mapa.get(comentario.id);
    if (!nodo) return;
    if (comentario.parent_comment_id && mapa.has(comentario.parent_comment_id)) {
      mapa.get(comentario.parent_comment_id)!.filhos.push(nodo);
      return;
    }
    raizes.push(nodo);
  });

  return raizes;
}

function badgeTipo(tipo: MuralTipo): string {
  return tipo === 'pedido' ? 'PEDIDO' : 'POSTAGEM';
}

export default function Mural() {
  const toast = useToast();
  const { usuario } = useSessao();

  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');
  const [publicando, setPublicando] = useState(false);
  const [bairroBase, setBairroBase] = useState('');
  const [bairroPublicacao, setBairroPublicacao] = useState('');
  const [modoNovo, setModoNovo] = useState<MuralTipo>('postagem');
  const [categoriaPedido, setCategoriaPedido] = useState(categoriasPedido[0]);
  const [texto, setTexto] = useState('');
  const [filtroFeed, setFiltroFeed] = useState<FiltroFeed>('todas');
  const [mostrarAjuda, setMostrarAjuda] = useState(false);
  const [abaFeed, setAbaFeed] = useState<'para_voce' | 'seguindo'>('para_voce');
  const [anexo, setAnexo] = useState<File | null>(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  const [anexoErro, setAnexoErro] = useState('');


  useEffect(() => {
    (async () => {
      try {
        const perfil = await apiJSON<{ bairro: string }>('/perfil');
        const b = String(perfil.bairro || '').trim();
        setBairroBase(b);
        setBairroPublicacao((atual) => atual || b);
      } catch {
        setBairroBase('');
      }
    })();
  }, []);

  useEffect(() => {
    if (!anexo) {
      setAnexoPreview('');
      return;
    }
    const preview = URL.createObjectURL(anexo);
    setAnexoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [anexo]);

  const carregarFeed = async () => {
    setEstado('carregando');
    try {
      const qs = new URLSearchParams();
      if (filtroFeed === 'postagem') qs.set('tipo', 'postagem');
      if (filtroFeed === 'pedido') qs.set('tipo', 'pedido');
      if (filtroFeed === 'bairro' && bairroBase) qs.set('bairro', bairroBase);
      const dados = await apiJSON<MuralPost[]>(`/mural${qs.toString() ? `?${qs.toString()}` : ''}`);
      setPosts(dados);
      setEstado('ok');
    } catch {
      setEstado('erro');
      toast.erro('Erro ao carregar o mural.');
    }
  };

  useEffect(() => {
    carregarFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroFeed, bairroBase]);

  const publicar = async (e: FormEvent) => {
    e.preventDefault();
    const textoLimpo = texto.trim();
    if (!textoLimpo) return;
    setPublicando(true);
    try {
      let media_url = '';
      let media_tipo = '';
      let media_nome = '';

      if (anexo) {
        if (anexo.type.startsWith('image/')) {
          media_url = await enviarImagem(anexo);
          media_tipo = anexo.type;
        } else if (anexo.type.startsWith('video/')) {
          const enviado = await enviarArquivo(anexo);
          media_url = enviado.url;
          media_tipo = enviado.tipo;
        } else {
          throw new Error('envie uma imagem ou vídeo válido');
        }
        media_nome = anexo.name;
      }

      await apiJSON('/mural', {
        method: 'POST',
        corpo: {
          texto: textoLimpo,
          bairro: bairroPublicacao.trim() || bairroBase,
          tipo: modoNovo,
          categoria: modoNovo === 'pedido' ? categoriaPedido : '',
          media_url,
          media_tipo,
          media_nome,
        },
      });
      toast.sucesso(modoNovo === 'pedido' ? 'Pedido publicado!' : 'Postagem publicada!');
      setTexto('');
      setModoNovo('postagem');
      setCategoriaPedido(categoriasPedido[0]);
      setAnexo(null);
      setAnexoErro('');
      await carregarFeed();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao publicar.');
    } finally {
      setPublicando(false);
    }
  };

  const atualizarPostLocal = (postId: string, patch: Partial<MuralPost>) => {
    setPosts((lista) => lista.map((post) => (post.id === postId ? { ...post, ...patch } : post)));
  };

  const incrementarComentarios = (postId: string) => {
    setPosts((lista) =>
      lista.map((post) =>
        post.id === postId ? { ...post, comments_count: Math.max(0, post.comments_count + 1) } : post,
      ),
    );
  };

  const postsVisiveis = useMemo(() => {
    return posts;
  }, [posts]);

  return (
    <>
      <section className="mural-container">
        <div className="mural-cabecalho" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="mural-titulo" style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Rede de Conexões</h1>
            <p className="mural-subtitulo" style={{ fontSize: '15px', color: '#6b7280', marginTop: '4px' }}>
              {posts.length} publicações
              {bairroBase ? ` · Bairro base: ${bairroBase}` : ''}
              {usuario?.nome ? ` · Olá, ${usuario.nome.split(' ')[0]}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="btn-secundario"
            style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '14px' }}
            onClick={() => setMostrarAjuda((valor) => !valor)}
          >
            {mostrarAjuda ? 'Ocultar ajuda' : 'Como funciona'}
          </button>
        </div>

        {mostrarAjuda && (
          <article className="post-card" style={{ background: '#fdf2f8', borderColor: '#fbcfe8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: '#db2777', fontSize: '16px' }}>Como funciona</strong>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#4b5563', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>1.</strong> Escolha entre postagem ou pedido</li>
              <li><strong>2.</strong> Defina um tema para o pedido</li>
              <li><strong>3.</strong> Publique e receba respostas no mural</li>
              <li><strong>4.</strong> Curta e responda os comentários de outras mães</li>
            </ul>
          </article>
        )}

        <div className="mural-layout">
          <div className="mural-main">
            <div className="mural-feed-tabs">
              <button
                type="button"
                className={`mural-feed-tab ${abaFeed === 'para_voce' ? 'ativo' : ''}`}
                onClick={() => setAbaFeed('para_voce')}
              >
                Para Você
              </button>
              <button
                type="button"
                className={`mural-feed-tab ${abaFeed === 'seguindo' ? 'ativo' : ''}`}
                onClick={() => setAbaFeed('seguindo')}
              >
                Seguindo
              </button>
            </div>

            <form className="mural-composer" onSubmit={publicar}>
          <div className="mural-tabs">
            <button
              type="button"
              className={modoNovo === 'postagem' ? 'mural-tab ativo' : 'mural-tab'}
              onClick={() => setModoNovo('postagem')}
            >
              Postagem
            </button>
            <button
              type="button"
              className={modoNovo === 'pedido' ? 'mural-tab ativo' : 'mural-tab'}
              onClick={() => setModoNovo('pedido')}
            >
              Pedido
            </button>
          </div>

          <div className="mural-composer-main">
            <div className="post-avatar" aria-hidden="true">
              {iniciais(usuario?.nome || 'M')}
            </div>
            <div className="mural-composer-content">
              {modoNovo === 'pedido' && (
                <div className="mural-chips">
                  {categoriasPedido.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={categoriaPedido === item ? 'mural-chip ativo' : 'mural-chip'}
                      onClick={() => setCategoriaPedido(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
              
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="No que você precisa de ajuda hoje ou o que gostaria de compartilhar com as outras mães?"
                rows={3}
                required
                className="mural-textarea"
              />

              {anexoErro ? <p className="mural-anexo-erro" style={{color: 'red', fontSize: '13px'}}>{anexoErro}</p> : null}

              {anexo && (
                <div className="mural-anexo-preview" style={{position: 'relative', display: 'inline-block', marginTop: '12px'}}>
                  {anexo.type.startsWith('image/') ? (
                    <img src={anexoPreview} alt={`Prévia do anexo ${anexo.name}`} className="mural-media-content" style={{maxHeight: '200px', width: 'auto'}} />
                  ) : (
                    <video src={anexoPreview} controls playsInline className="mural-media-content" style={{maxHeight: '200px', width: 'auto'}} />
                  )}
                  <button
                    type="button"
                    style={{position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    onClick={() => setAnexo(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mural-composer-footer">
            <div className="mural-composer-actions">
              <label className="mural-miniacao" style={{cursor: 'pointer'}}>
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0] || null;
                    setAnexoErro('');
                    if (arquivo && !arquivo.type.startsWith('image/') && !arquivo.type.startsWith('video/')) {
                      setAnexo(null);
                      setAnexoErro('Selecione uma imagem ou vídeo.');
                      return;
                    }
                    setAnexo(arquivo);
                  }}
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span style={{marginLeft: '4px'}}>{anexo ? 'Trocar' : 'Mídia'}</span>
              </label>

              <label className="mural-campo-bairro">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <input
                  value={bairroPublicacao}
                  onChange={(e) => setBairroPublicacao(e.target.value)}
                  placeholder="Seu Bairro"
                />
              </label>
            </div>

            <button type="submit" className="btn-primario" disabled={publicando} style={{padding: '8px 24px', borderRadius: '999px', minHeight: '36px', fontSize: '14px'}}>
              {publicando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>

        <div className="mural-filtros">
          <button
            type="button"
            className={filtroFeed === 'todas' ? 'mural-filtro ativo' : 'mural-filtro'}
            onClick={() => setFiltroFeed('todas')}
          >
            Tudo
          </button>
          <button
            type="button"
            className={filtroFeed === 'postagem' ? 'mural-filtro ativo' : 'mural-filtro'}
            onClick={() => setFiltroFeed('postagem')}
          >
            Postagens
          </button>
          <button
            type="button"
            className={filtroFeed === 'pedido' ? 'mural-filtro ativo' : 'mural-filtro'}
            onClick={() => setFiltroFeed('pedido')}
          >
            Pedidos
          </button>
          <button
            type="button"
            className={filtroFeed === 'bairro' ? 'mural-filtro ativo' : 'mural-filtro'}
            onClick={() => setFiltroFeed('bairro')}
            disabled={!bairroBase}
          >
            Meu bairro
          </button>
        </div>

        {estado === 'carregando' ? (
          <div className="mural-loading">
            {[1, 2, 3].map((i) => (
              <article key={i} className="post-card skeleton">
                <div className="mural-skeleton-header" />
                <div className="mural-skeleton-line" />
                <div className="mural-skeleton-line curta" />
              </article>
            ))}
          </div>
        ) : estado === 'erro' ? (
          <div className="fd-vazio">
            <h3>Erro ao carregar</h3>
            <p>Não foi possível carregar o mural.</p>
            <button className="btn-secundario" onClick={carregarFeed}>
              Tentar novamente
            </button>
          </div>
        ) : postsVisiveis.length === 0 ? (
          <div className="fd-vazio">
            <h3>O mural está vazio por enquanto</h3>
            <p>Seja a primeira a publicar algo e abrir espaço para trocas com outras mães.</p>
          </div>
        ) : (
          <div className="mural-feed">
            {postsVisiveis.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isProprioPost={usuario?.id === post.usuario_id}
                onCurtirPost={async (postId) => {
                  const resposta = await apiJSON<{ ok: boolean; curtido: boolean; likes_count: number }>(
                    `/mural/${postId}/curtir`,
                    { method: 'POST' },
                  );
                  atualizarPostLocal(postId, {
                    likes_count: resposta.likes_count,
                    me_liked: resposta.curtido,
                  });
                }}
                onComentarioAdicionado={() => incrementarComentarios(post.id)}
              />
            ))}
          </div>
        )}
          </div>
          
          <aside className="mural-sidebar">
            <div className="mural-sidebar-widget">
              <h3 className="mural-sidebar-titulo">Comunidades</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="post-avatar" style={{width: '40px', height: '40px', fontSize: '14px'}}>M</div>
                  <div style={{flex: 1}}>
                    <strong style={{display: 'block', fontSize: '14px', color: '#111827'}}>Mães Empreendedoras</strong>
                    <span style={{fontSize: '12px', color: '#6b7280'}}>Ibura</span>
                  </div>
                  <button className="btn-seguir" onClick={() => toast.sucesso('Em breve: Comunidades!')}>Participar</button>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="post-avatar" style={{width: '40px', height: '40px', fontSize: '14px', background: '#eff6ff', color: '#2563eb'}}>T</div>
                  <div style={{flex: 1}}>
                    <strong style={{display: 'block', fontSize: '14px', color: '#111827'}}>Troca de Roupas</strong>
                    <span style={{fontSize: '12px', color: '#6b7280'}}>Boa Viagem</span>
                  </div>
                  <button className="btn-seguir" onClick={() => toast.sucesso('Em breve: Comunidades!')}>Participar</button>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="post-avatar" style={{width: '40px', height: '40px', fontSize: '14px', background: '#f0fdf4', color: '#16a34a'}}>A</div>
                  <div style={{flex: 1}}>
                    <strong style={{display: 'block', fontSize: '14px', color: '#111827'}}>Apoio Materno</strong>
                    <span style={{fontSize: '12px', color: '#6b7280'}}>Recife Antigo</span>
                  </div>
                  <button className="btn-seguir" onClick={() => toast.sucesso('Em breve: Comunidades!')}>Participar</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {toast.container}
    </>
  );
}

function PostCard({
  post,
  isProprioPost,
  onCurtirPost,
  onComentarioAdicionado,
}: {
  post: MuralPost;
  isProprioPost?: boolean;
  onCurtirPost: (postId: string) => Promise<void>;
  onComentarioAdicionado: (postId: string) => void;
}) {
  const toast = useToast();
  const [comentariosAbertos, setComentariosAbertos] = useState(false);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [comentarios, setComentarios] = useState<CommentNode[]>([]);
  const [textoComentario, setTextoComentario] = useState('');
  const [respondendoA, setRespondendoA] = useState<{ id: string; nome: string } | null>(null);
  const [salvandoComentario, setSalvandoComentario] = useState(false);

  const carregarComentarios = async () => {
    setCarregandoComentarios(true);
    try {
      const dados = await apiJSON<MuralComment[]>(`/mural/${post.id}/comentarios`);
      setComentarios(montarArvore(dados));
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao carregar comentários.');
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const alternarComentarios = async () => {
    const aberto = !comentariosAbertos;
    setComentariosAbertos(aberto);
    if (aberto && comentarios.length === 0) {
      await carregarComentarios();
    }
  };

  const enviarComentario = async (e: FormEvent) => {
    e.preventDefault();
    const textoLimpo = textoComentario.trim();
    if (!textoLimpo) return;
    setSalvandoComentario(true);
    try {
      await apiJSON(`/mural/${post.id}/comentarios`, {
        method: 'POST',
        corpo: {
          texto: textoLimpo,
          parent_comment_id: respondendoA?.id || '',
        },
      });
      setTextoComentario('');
      setRespondendoA(null);
      onComentarioAdicionado(post.id);
      await carregarComentarios();
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao comentar.');
    } finally {
      setSalvandoComentario(false);
    }
  };

  const contarComentarios = post.comments_count;

  return (
    <article className="post-card surgir">
      <header className="post-header">
        <button type="button" className="post-autor-click" onClick={() => toast.sucesso('Em breve: Perfil Público!')}>
          <div className="post-avatar" aria-hidden="true">
            {iniciais(post.autor_nome)}
          </div>
          <div className="post-header-info">
            <strong>{post.autor_nome}</strong>
            <p>
              {post.bairro}
              <span aria-hidden="true"> • </span>
              {formatarData(post.criado_em)}
            </p>
          </div>
        </button>
        {!isProprioPost && (
          <div className="post-header-acoes">
            <button type="button" className="btn-seguir" onClick={() => toast.sucesso(`Você começou a seguir ${post.autor_nome.split(' ')[0]}`)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              Seguir
            </button>
          </div>
        )}
      </header>

      <div className="post-badges">
        <span className={post.tipo === 'pedido' ? 'mural-badge pedido' : 'mural-badge postagem'}>
          {badgeTipo(post.tipo)}
        </span>
        {post.categoria ? <span className="mural-badge neutro" style={{marginLeft: '8px'}}>{post.categoria}</span> : null}
      </div>

      <p className="mural-texto" style={{fontSize: '15px', color: '#374151', lineHeight: '1.5'}}>{post.texto}</p>

      {post.media_url ? (
        <div className="mural-media">
          {post.media_tipo.startsWith('video/') ? (
            <video src={post.media_url} controls playsInline preload="metadata" className="mural-media-content" />
          ) : (
            <img src={post.media_url} alt={post.media_nome || `Anexo de ${post.autor_nome}`} className="mural-media-content" />
          )}
        </div>
      ) : null}

      <div className="post-actions" style={{display: 'flex', justifyContent: 'space-between', gap: '4px'}}>
        <button
          type="button"
          className={post.me_liked ? 'btn-acao ativo' : 'btn-acao'}
          onClick={async () => {
            try {
              await onCurtirPost(post.id);
            } catch (err) {
              toast.erro(err instanceof Error ? err.message : 'Erro ao curtir.');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={post.me_liked ? "#E24C8F" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <span>{post.likes_count} {post.likes_count === 1 ? 'curtida' : 'curtidas'}</span>
        </button>
        <button type="button" className="btn-acao" onClick={alternarComentarios}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          <span>{contarComentarios} comentário{contarComentarios === 1 ? '' : 's'}</span>
        </button>
        <button type="button" className="btn-acao" onClick={() => toast.sucesso('Em breve: Salvar Posts!')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
          <span>Salvar</span>
        </button>
        <button type="button" className="btn-acao" onClick={() => toast.sucesso('Em breve: Compartilhar Posts!')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          <span>Compartilhar</span>
        </button>
      </div>

      {comentariosAbertos && (
        <div className="mural-comentarios">
          {carregandoComentarios ? (
            <div className="mural-comentarios-vazio">Carregando comentários...</div>
          ) : comentarios.length === 0 ? (
            <div className="mural-comentarios-vazio">Ainda não há comentários. Seja a primeira a responder.</div>
          ) : (
            <div className="mural-comentarios-lista">
              {comentarios.map((comentario) => (
                <ComentarioItem
                  key={comentario.id}
                  comentario={comentario}
                  nivel={0}
                  onResponder={(c) => setRespondendoA({ id: c.id, nome: c.autor_nome })}
                  onCurtir={async (commentId) => {
                    try {
                      const resposta = await apiJSON<{ ok: boolean; curtido: boolean; likes_count: number }>(
                        `/mural/comentarios/${commentId}/curtir`,
                        { method: 'POST' },
                      );
                      setComentarios((lista) =>
                        atualizarComentario(lista, commentId, {
                          likes_count: resposta.likes_count,
                          me_liked: resposta.curtido,
                        }),
                      );
                    } catch (err) {
                      toast.erro(err instanceof Error ? err.message : 'Erro ao curtir comentário.');
                    }
                  }}
                />
              ))}
            </div>
          )}

          <form className="mural-resposta" onSubmit={enviarComentario} style={{marginTop: '16px', background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb'}}>
            {respondendoA && (
              <div className="mural-resposta-contexto" style={{fontSize: '13px', color: '#6b7280', marginBottom: '8px', display: 'flex', justifyContent: 'space-between'}}>
                <span>Respondendo a <strong>{respondendoA.nome}</strong></span>
                <button type="button" onClick={() => setRespondendoA(null)} style={{background: 'none', border: 'none', color: '#db2777', cursor: 'pointer', fontSize: '13px'}}>
                  cancelar
                </button>
              </div>
            )}
            <textarea
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              placeholder="Escreva uma resposta..."
              rows={3}
              className="mural-textarea"
              style={{background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px'}}
            />
            <div className="mural-resposta-acoes" style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px'}}>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => {
                  setTextoComentario('');
                  setRespondendoA(null);
                }}
                style={{padding: '8px 16px', borderRadius: '999px', fontSize: '14px', minHeight: '36px'}}
              >
                Limpar
              </button>
              <button type="submit" className="btn-primario" disabled={salvandoComentario} style={{padding: '8px 16px', borderRadius: '999px', fontSize: '14px', minHeight: '36px'}}>
                {salvandoComentario ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

function ComentarioItem({
  comentario,
  nivel,
  onResponder,
  onCurtir,
}: {
  comentario: CommentNode;
  nivel: number;
  onResponder: (comentario: CommentNode) => void;
  onCurtir: (commentId: string) => Promise<void>;
}) {
  return (
    <article className="mural-comentario" style={nivel > 0 ? { borderLeft: '2px solid #f3f4f6', marginLeft: '24px', paddingLeft: '16px', marginTop: '12px' } : { marginTop: '16px' }}>
      <div className="mural-comentario-topo">
        <div className="post-avatar" style={{width: '32px', height: '32px', fontSize: '14px'}} aria-hidden="true">
          {iniciais(comentario.autor_nome)}
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <strong>{comentario.autor_nome}</strong>
          <span>{formatarData(comentario.criado_em)}</span>
        </div>
      </div>

      <p className="mural-comentario-texto">{comentario.texto}</p>

      <div className="mural-comentario-acoes" style={{display: 'flex', gap: '8px'}}>
        <button
          type="button"
          className={comentario.me_liked ? 'mural-miniacao ativo' : 'mural-miniacao'}
          onClick={() => onCurtir(comentario.id)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={comentario.me_liked ? "#E24C8F" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <span style={{marginLeft: '4px'}}>{comentario.likes_count}</span>
        </button>
        <button type="button" className="mural-miniacao" onClick={() => onResponder(comentario)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
          <span style={{marginLeft: '4px'}}>Responder</span>
        </button>
      </div>

      {comentario.filhos.length > 0 && (
        <div className="mural-comentarios-filhos">
          {comentario.filhos.map((filho) => (
            <ComentarioItem
              key={filho.id}
              comentario={filho}
              nivel={nivel + 1}
              onResponder={onResponder}
              onCurtir={onCurtir}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function atualizarComentario(lista: CommentNode[], commentId: string, patch: Partial<MuralComment>): CommentNode[] {
  return lista.map((comentario) => {
    if (comentario.id === commentId) {
      return { ...comentario, ...patch };
    }
    if (comentario.filhos.length) {
      return { ...comentario, filhos: atualizarComentario(comentario.filhos, commentId, patch) };
    }
    return comentario;
  });
}
