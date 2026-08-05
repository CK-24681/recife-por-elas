import { useEffect, useRef, useState, type FormEvent } from 'react';
import { apiJSON } from '../api';
import { useSessao } from '../sessao';
import { useToast } from '../toast';
import { enviarImagem } from '../upload';

interface Experiencia {
  id: string;
  titulo: string;
  local: string;
  periodo: string;
}

interface Curso {
  id: string;
  nome: string;
  instituicao: string;
  periodo: string;
}

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
  sobre_mim: string;
  experiencias: string;
  cursos: string;
  habilidades: string;
  photo_url: string;
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

const extrairArray = (jsonStr: string): any[] => {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export default function Perfil() {
  const { usuario } = useSessao();
  const toast = useToast();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState(false);
  const [dados, setDados] = useState<PerfilDados>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    bairro: '',
    filhos: 0,
    idades_filhos: '',
    turno_disponivel: '',
    interesses: '',
    sobre_mim: '',
    experiencias: '[]',
    cursos: '[]',
    habilidades: '[]',
    photo_url: '',
  });
  const [form, setForm] = useState<PerfilDados>(dados);
  const [qtdFilhos, setQtdFilhos] = useState('Nenhum');
  const [idadesFilhos, setIdadesFilhos] = useState<string[]>([]);
  const [habilidadesStr, setHabilidadesStr] = useState('');
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [fotoSalvando, setFotoSalvando] = useState(false);
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

  useEffect(() => {
    carregar();
  }, []);

  const iniciarEdicao = () => {
    setForm({ ...dados });
    setEditando(true);
    const qty = dados.filhos;
    setQtdFilhos(qty === 0 ? 'Nenhum' : qty >= 10 ? '10+' : String(qty));
    setIdadesFilhos(extrairArray(dados.idades_filhos));
    const hab = extrairArray(dados.habilidades);
    setHabilidadesStr(hab.join(', '));
    setExperiencias(extrairArray(dados.experiencias) as Experiencia[]);
    setCursos(extrairArray(dados.cursos) as Curso[]);
  };

  const cancelar = () => {
    setEditando(false);
  };

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const arrayHabilidades = habilidadesStr.split(',').map((h) => h.trim()).filter(Boolean);

    const payload = {
      ...form,
      filhos: qtdFilhos === 'Nenhum' ? 0 : qtdFilhos === '10+' ? idadesFilhos.length : parseInt(qtdFilhos),
      idades_filhos: qtdFilhos !== 'Nenhum' ? JSON.stringify(idadesFilhos) : '[]',
      habilidades: JSON.stringify(arrayHabilidades),
      experiencias: JSON.stringify(experiencias),
      cursos: JSON.stringify(cursos),
    };

    try {
      await apiJSON('/perfil', { method: 'PUT', corpo: payload });
      toast.sucesso('Perfil salvo!');
      setDados(payload);
      setEditando(false);
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarFoto = async (arquivo: File | null) => {
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      toast.erro('Selecione uma imagem para a foto do perfil.');
      return;
    }
    setFotoSalvando(true);
    try {
      const photo_url = await enviarImagem(arquivo);
      const payload = { ...dados, photo_url };
      await apiJSON('/perfil', { method: 'PUT', corpo: payload });
      setDados(payload);
      setForm((atual) => ({ ...atual, photo_url }));
      toast.sucesso('Foto do perfil atualizada!');
    } catch (err) {
      toast.erro(err instanceof Error ? err.message : 'Erro ao salvar a foto.');
    } finally {
      setFotoSalvando(false);
    }
  };

  const fotoUrl = dados.photo_url || '';
  const nomeExibido = dados.nome || usuario?.nome || 'A';

  const renderIdadesFilhos = () => {
    try {
      const lista = JSON.parse(dados.idades_filhos || '[]');
      if (Array.isArray(lista) && lista.length > 0) {
        return lista.join(', ').replace(/, ([^,]*)$/, ' e $1') + ' anos';
      }
      return 'Não informadas';
    } catch {
      return 'Não informadas';
    }
  };

  if (estado === 'carregando') {
    return (
      <>
        <section className="pagina-cabecalho">
          <div className="container">
            <h1 className="pagina-titulo">Meu perfil</h1>
          </div>
        </section>
        <section className="container pf-container-centralizado">
          <div className="sessao-spinner" style={{ margin: '0 auto' }} />
        </section>
      </>
    );
  }

  const listaHabilidades = extrairArray(dados.habilidades);
  const listaExp = extrairArray(dados.experiencias) as Experiencia[];
  const listaCursos = extrairArray(dados.cursos) as Curso[];

  return (
    <>
      <section className="pagina-cabecalho">
        <div className="container">
          <h1 className="pagina-titulo">Meu perfil</h1>
        </div>
      </section>

      <section className="container" style={{ paddingBlock: 40 }}>
        {!editando ? (
          <div className="pf-container-linkedin">
            <div className="pf-card-linkedin header">
              <div className="pf-btns-header">
                <button
                  type="button"
                  className="btn-primario pf-btn-foto"
                  onClick={() => fotoInputRef.current?.click()}
                  disabled={fotoSalvando}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  {fotoSalvando ? 'Salvando foto...' : 'Adicionar foto'}
                </button>
                <button className="btn-secundario pf-btn-editar" type="button" onClick={iniciarEdicao}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar dados
                </button>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const arquivo = e.target.files?.[0] || null;
                    e.target.value = '';
                    await salvarFoto(arquivo);
                  }}
                />
              </div>

              <div className="pf-header-top">
                <div className="pf-foto-perfil">
                  {fotoUrl ? <img src={fotoUrl} alt={`Foto de perfil de ${nomeExibido}`} /> : iniciais(nomeExibido)}
                </div>
                <div className="pf-info-basica">
                  <h1>{dados.nome || 'Nome não informado'}</h1>
                  <p>{dados.bairro ? `${dados.bairro}, Recife` : 'Bairro não informado'}</p>
                  <div className="pf-contatos">
                    {dados.email && <span>📧 {dados.email}</span>}
                    {dados.telefone && <span>📱 {dados.telefone}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-card-linkedin">
              <h2>Sobre mim</h2>
              {dados.sobre_mim ? (
                <p className="pf-texto-livre">{dados.sobre_mim}</p>
              ) : (
                <p className="pf-texto-livre" style={{ color: 'var(--texto-suave)' }}>
                  Conte um pouco sobre sua história para que as empresas e a comunidade a conheçam melhor.
                </p>
              )}
            </div>

            <div className="pf-card-linkedin">
              <h2>Contexto Familiar</h2>
              <div className="pf-lista-experiencia">
                <div className="pf-item-experiencia">
                  <span className="pf-item-experiencia-titulo">Filhos</span>
                  <span className="pf-item-experiencia-local">
                    {dados.filhos === 0 ? 'Nenhum filho registrado' : `${dados.filhos} filho${dados.filhos > 1 ? 's' : ''} (Idades: ${renderIdadesFilhos()})`}
                  </span>
                </div>
                <div className="pf-item-experiencia">
                  <span className="pf-item-experiencia-titulo">Turno Disponível</span>
                  <span className="pf-item-experiencia-local">{dados.turno_disponivel || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div className="pf-card-linkedin">
              <h2>Habilidades</h2>
              {listaHabilidades.length > 0 ? (
                <div className="pf-tags-container">
                  {listaHabilidades.map((hab, idx) => (
                    <span key={idx} className="pf-tag-habilidade">{hab}</span>
                  ))}
                </div>
              ) : (
                <p className="pf-texto-livre" style={{ color: 'var(--texto-suave)' }}>Nenhuma habilidade cadastrada.</p>
              )}
            </div>

            <div className="pf-card-linkedin">
              <h2>Experiências e Trabalhos</h2>
              {listaExp.length > 0 ? (
                <div className="pf-lista-experiencia">
                  {listaExp.map((exp) => (
                    <div key={exp.id} className="pf-item-experiencia">
                      <span className="pf-item-experiencia-titulo">{exp.titulo}</span>
                      <span className="pf-item-experiencia-local">{exp.local}</span>
                      <span className="pf-item-experiencia-periodo">{exp.periodo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pf-texto-livre" style={{ color: 'var(--texto-suave)' }}>Nenhuma experiência cadastrada.</p>
              )}
            </div>

            <div className="pf-card-linkedin">
              <h2>Escolaridade e Cursos</h2>
              {listaCursos.length > 0 ? (
                <div className="pf-lista-experiencia">
                  {listaCursos.map((curso) => (
                    <div key={curso.id} className="pf-item-experiencia">
                      <span className="pf-item-experiencia-titulo">{curso.nome}</span>
                      <span className="pf-item-experiencia-local">{curso.instituicao}</span>
                      <span className="pf-item-experiencia-periodo">{curso.periodo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pf-texto-livre" style={{ color: 'var(--texto-suave)' }}>Nenhum curso cadastrado.</p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={salvar} className="pf-container-linkedin">
            <div className="pf-card-linkedin header">
              <h2>Editar dados</h2>
              <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginBottom: 16 }}>
                Atualize suas informações para manter seu perfil atraente para oportunidades.
              </p>

              <div className="pf-form-dinamico">
                <label>Nome completo <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome completo" required /></label>
                <label>E-mail <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required /></label>
                <label>Telefone <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: mascaraTel(e.target.value) })} placeholder="(81) 99999-9999" /></label>
                <label>CPF <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: mascaraCpf(e.target.value) })} placeholder="000.000.000-00" /></label>
                <label>Data de nascimento <input value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: mascaraData(e.target.value) })} placeholder="DD/MM/AAAA" /></label>
                <label>Bairro <input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Ex.: Ibura" /></label>
              </div>

              <div className="pf-form-dinamico">
                <label>Sobre mim
                  <textarea rows={4} value={form.sobre_mim} onChange={(e) => setForm({ ...form, sobre_mim: e.target.value })} placeholder="Conte um pouco da sua história..."></textarea>
                </label>
              </div>

              <div className="pf-form-dinamico">
                <label>Quantos filhos você tem?
                  <select value={qtdFilhos} onChange={(e) => {
                    const val = e.target.value;
                    setQtdFilhos(val);
                    if (val === 'Nenhum') {
                      setIdadesFilhos([]);
                    } else {
                      const minCount = val === '10+' ? 10 : parseInt(val);
                      setIdadesFilhos((prev) => {
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
                    onClick={() => setIdadesFilhos((prev) => [...prev, ''])}
                    style={{ marginBottom: 16, marginTop: -8 }}
                  >
                    + Adicionar mais um filho
                  </button>
                )}

                <label>Turno disponível
                  <select value={form.turno_disponivel} onChange={(e) => setForm({ ...form, turno_disponivel: e.target.value })}>
                    <option value="">Selecione um turno</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Manhã e tarde">Manhã e tarde</option>
                    <option value="Horário flexível">Horário flexível</option>
                  </select>
                </label>
              </div>

              <div className="pf-form-dinamico">
                <label>Habilidades (separadas por vírgula)
                  <input value={habilidadesStr} onChange={(e) => setHabilidadesStr(e.target.value)} placeholder="Ex.: Costura, Atendimento ao Público, Pacote Office" />
                </label>
              </div>

              <div className="pf-form-dinamico">
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Experiências e Trabalhos</h3>
                {experiencias.map((exp, index) => (
                  <div key={exp.id} style={{ display: 'grid', gap: 12, paddingBottom: 16, borderBottom: '1px dashed var(--borda)', marginBottom: 16, position: 'relative' }}>
                    <button type="button" className="pf-btn-remover-item" onClick={() => setExperiencias(experiencias.filter((e) => e.id !== exp.id))}>X</button>
                    <label>Título / Cargo
                      <input value={exp.titulo} onChange={(e) => { const n = [...experiencias]; n[index].titulo = e.target.value; setExperiencias(n); }} placeholder="Ex.: Costureira, Vendedora..." required />
                    </label>
                    <label>Empresa / Local
                      <input value={exp.local} onChange={(e) => { const n = [...experiencias]; n[index].local = e.target.value; setExperiencias(n); }} placeholder="Ex.: Confecção Maria, Trabalho Autônomo" required />
                    </label>
                    <label>Período
                      <input value={exp.periodo} onChange={(e) => { const n = [...experiencias]; n[index].periodo = e.target.value; setExperiencias(n); }} placeholder="Ex.: 2020 - 2022, Atual" required />
                    </label>
                  </div>
                ))}
                <button type="button" className="pf-btn-adicionar-item" onClick={() => setExperiencias([...experiencias, { id: Date.now().toString(), titulo: '', local: '', periodo: '' }])}>
                  + Adicionar experiência
                </button>
              </div>

              <div className="pf-form-dinamico">
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Escolaridade e Cursos</h3>
                {cursos.map((curso, index) => (
                  <div key={curso.id} style={{ display: 'grid', gap: 12, paddingBottom: 16, borderBottom: '1px dashed var(--borda)', marginBottom: 16, position: 'relative' }}>
                    <button type="button" className="pf-btn-remover-item" onClick={() => setCursos(cursos.filter((c) => c.id !== curso.id))}>X</button>
                    <label>Grau ou Nome do Curso
                      <input value={curso.nome} onChange={(e) => { const n = [...cursos]; n[index].nome = e.target.value; setCursos(n); }} placeholder="Ex.: Ensino Médio Completo, Curso de Maquiagem..." required />
                    </label>
                    <label>Instituição
                      <input value={curso.instituicao} onChange={(e) => { const n = [...cursos]; n[index].instituicao = e.target.value; setCursos(n); }} placeholder="Ex.: Escola Estadual, SENAC" required />
                    </label>
                    <label>Período
                      <input value={curso.periodo} onChange={(e) => { const n = [...cursos]; n[index].periodo = e.target.value; setCursos(n); }} placeholder="Ex.: 2018 - 2019" required />
                    </label>
                  </div>
                ))}
                <button type="button" className="pf-btn-adicionar-item" onClick={() => setCursos([...cursos, { id: Date.now().toString(), nome: '', instituicao: '', periodo: '' }])}>
                  + Adicionar curso
                </button>
              </div>

              <div className="pf-form-dinamico">
                <label>Foto do perfil
                  <div className="mural-anexo-area">
                    <button type="button" className="mural-anexo-btn" onClick={() => fotoInputRef.current?.click()}>
                      Selecionar nova foto
                    </button>
                    {fotoUrl ? <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Foto atual já salva</span> : null}
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn-secundario" onClick={cancelar}>Cancelar</button>
                <button type="submit" className="btn-primario" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
      {toast.container}
    </>
  );
}
