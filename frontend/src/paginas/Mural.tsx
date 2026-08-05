import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiJSON } from '../api';
import { enviarArquivo } from '../midia';
import { enviarImagem } from '../upload';
import { useSessao } from '../sessao';
import { useToast } from '../toast';

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
  const [anexo, setAnexo] = useState<File | null>(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  const [anexoErro, setAnexoErro] = useState('');

  const destaque = useMemo(() => {
    if (modoNovo === 'pedido') {
      return 'Peça ajuda de forma clara e simples. A comunidade pode responder com indicação, apoio ou solução prática.';
    }
    return 'Compartilhe uma conquista, dica, oferta de apoio ou algo que você queira dividir com outras mães.';
  }, [modoNovo]);

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
      <section className="container mural-conteudo">
        <div className="mural-cabecalho">
          <div>
            <span className="mural-hero-tag">Rede de apoio</span>
            <h1 className="mural-titulo">Mural</h1>
            <p className="mural-subtitulo">
              {posts.length} publicações
              {bairroBase ? ` · Bairro base: ${bairroBase}` : ''}
              {usuario?.nome ? ` · Olá, ${usuario.nome.split(' ')[0]}` : ''}
            </p>
          </div>
          <button
            type="button"
            className="mural-ajuda-btn"
            onClick={() => setMostrarAjuda((valor) => !valor)}
          >
            {mostrarAjuda ? 'Ocultar ajuda' : 'Como funciona'}
          </button>
        </div>

        {mostrarAjuda && (
          <article className="mural-ajuda-card mural-card">
            <div className="mural-hero-card-linha">
              <strong>Como funciona</strong>
              <span>rápido e direto</span>
            </div>
            <ul className="mural-hero-lista">
              <li>1. Escolha entre postagem ou pedido</li>
              <li>2. Defina um tema para o pedido</li>
              <li>3. Publique e receba respostas no mural</li>
              <li>4. Curta e responda os comentários de outras mães</li>
            </ul>
          </article>
        )}

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

          <div className="mural-composer-topo">
            <div className="mural-avatar" aria-hidden="true">
              {iniciais(usuario?.nome || 'M')}
            </div>
            <div>
              <strong>{usuario?.nome || 'Sua publicação'}</strong>
              <p>{destaque}</p>
            </div>
          </div>

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
            placeholder={
              modoNovo === 'pedido'
                ? 'Ex: Preciso de ajuda para levar meu filho à escola nesta semana...'
                : 'Compartilhe uma conquista, dica, aviso ou apoio para outras mães...'
            }
            rows={5}
            required
          />

          <div className="mural-anexo-area">
            <label className="mural-anexo-btn">
              <input
                type="file"
                accept="image/*,video/*"
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
              {anexo ? 'Trocar anexo' : 'Adicionar imagem ou vídeo'}
            </label>
            {anexo && (
              <button
                type="button"
                className="mural-anexo-limpar"
                onClick={() => setAnexo(null)}
              >
                Remover anexo
              </button>
            )}
          </div>

          {anexoErro ? <p className="mural-anexo-erro">{anexoErro}</p> : null}

          {anexo && (
            <div className="mural-anexo-preview">
              {anexo.type.startsWith('image/') ? (
                <img src={anexoPreview} alt={`Prévia do anexo ${anexo.name}`} />
              ) : (
                <video src={anexoPreview} controls playsInline />
              )}
              <div className="mural-anexo-meta">
                <strong>{anexo.name}</strong>
                <span>{anexo.type.startsWith('video/') ? 'Vídeo' : 'Imagem'}</span>
              </div>
            </div>
          )}

          <div className="mural-composer-actions">
            <label className="mural-campo">
              <span>Bairro</span>
              <input
                value={bairroPublicacao}
                onChange={(e) => setBairroPublicacao(e.target.value)}
                placeholder="Ex: Ibura"
              />
            </label>

            <div className="mural-botoes">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => {
                  setTexto('');
                  setModoNovo('postagem');
                  setCategoriaPedido(categoriasPedido[0]);
                }}
              >
                Limpar
              </button>
              <button type="submit" className="btn-primario" disabled={publicando}>
                {publicando ? 'Publicando...' : modoNovo === 'pedido' ? 'Publicar pedido' : 'Publicar post'}
              </button>
            </div>
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
              <article key={i} className="mural-card skeleton">
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
      </section>

      {toast.container}
    </>
  );
}

function PostCard({
  post,
  onCurtirPost,
  onComentarioAdicionado,
}: {
  post: MuralPost;
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
    <article className="mural-card surgir">
      <header className="mural-header">
        <div className="mural-autor">
          <div className="mural-avatar grande" aria-hidden="true">
            {iniciais(post.autor_nome)}
          </div>
          <div>
            <strong>{post.autor_nome}</strong>
            <p>
              {post.bairro}
              <span aria-hidden="true"> • </span>
              {formatarData(post.criado_em)}
            </p>
          </div>
        </div>

        <div className="mural-badges">
          <span className={post.tipo === 'pedido' ? 'mural-badge pedido' : 'mural-badge postagem'}>
            {badgeTipo(post.tipo)}
          </span>
          {post.categoria ? <span className="mural-badge neutro">{post.categoria}</span> : null}
        </div>
      </header>

      <p className="mural-texto">{post.texto}</p>

      {post.media_url ? (
        <div className="mural-media">
          {post.media_tipo.startsWith('video/') ? (
            <video src={post.media_url} controls playsInline preload="metadata" />
          ) : (
            <img src={post.media_url} alt={post.media_nome || `Anexo de ${post.autor_nome}`} />
          )}
          {post.media_nome ? <span className="mural-media-legenda">{post.media_nome}</span> : null}
        </div>
      ) : null}

      <div className="mural-acoes">
        <button
          type="button"
          className={post.me_liked ? 'mural-acao ativo' : 'mural-acao'}
          onClick={async () => {
            try {
              await onCurtirPost(post.id);
            } catch (err) {
              toast.erro(err instanceof Error ? err.message : 'Erro ao curtir.');
            }
          }}
        >
          <span>♥</span>
          <span>{post.likes_count} curtir</span>
        </button>
        <button type="button" className="mural-acao" onClick={alternarComentarios}>
          <span>💬</span>
          <span>{contarComentarios} comentário{contarComentarios === 1 ? '' : 's'}</span>
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

          <form className="mural-resposta" onSubmit={enviarComentario}>
            {respondendoA && (
              <div className="mural-resposta-contexto">
                Respondendo a <strong>{respondendoA.nome}</strong>
                <button type="button" onClick={() => setRespondendoA(null)}>
                  cancelar
                </button>
              </div>
            )}
            <textarea
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              placeholder="Escreva uma resposta..."
              rows={3}
            />
            <div className="mural-resposta-acoes">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => {
                  setTextoComentario('');
                  setRespondendoA(null);
                }}
              >
                Limpar
              </button>
              <button type="submit" className="btn-primario" disabled={salvandoComentario}>
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
    <article className="mural-comentario" style={{ marginLeft: nivel > 0 ? 20 : 0 }}>
      <div className="mural-comentario-topo">
        <div>
          <strong>{comentario.autor_nome}</strong>
          <span>{formatarData(comentario.criado_em)}</span>
        </div>
      </div>

      <p className="mural-comentario-texto">{comentario.texto}</p>

      <div className="mural-comentario-acoes">
        <button
          type="button"
          className={comentario.me_liked ? 'mural-miniacao ativo' : 'mural-miniacao'}
          onClick={() => onCurtir(comentario.id)}
        >
          ♥ {comentario.likes_count}
        </button>
        <button type="button" className="mural-miniacao" onClick={() => onResponder(comentario)}>
          Responder
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
