import { useEffect, useState } from 'react';
import { Link, useCaminho } from '../utils/roteador';
import { apiJSON } from '../services/api';
import { useToast } from '../utils/toast';

interface Oportunidade {
  id: number;
  titulo: string;
  descricao: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito';
  fonte: string;
  link_inscricao: string;
  bairro: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  horario: string;
  data_inicio_inscricao: string;
  data_fim_inscricao: string;
}

const tagClass = (tipo: string) => {
  if (tipo === 'Emprego') return 'emprego';
  if (tipo === 'Curso') return 'curso';
  if (tipo === 'Benefício social') return 'beneficio';
  return 'credito';
};

export default function OportunidadeDetalhe() {
  const caminho = useCaminho();
  const id = caminho.split('/').pop() || '';
  const toast = useToast();

  const [op, setOp] = useState<Oportunidade | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'ok'>('carregando');

  useEffect(() => {
    (async () => {
      setEstado('carregando');
      try {
        const data = await apiJSON<Oportunidade>(`/oportunidades/${id}`);
        setOp(data);
        setEstado('ok');
      } catch {
        setEstado('erro');
      }
    })();
  }, [id]);

  if (estado === 'carregando') {
    return (
      <div className="container dt-status-container">
        <div className="sessao-spinner dt-status-spinner" />
        <p className="dt-status-texto">Carregando oportunidade...</p>
      </div>
    );
  }

  if (estado === 'erro' || !op) {
    return (
      <div className="container dt-status-container">
        <h2 className="dt-erro-titulo">Oportunidade não encontrada</h2>
        <p className="dt-erro-texto">Esta vaga pode ter expirado ou o link está incorreto.</p>
        <Link to="/" className="btn-primario">Voltar para o feed</Link>
      </div>
    );
  }

  return (
    <>
      <section className="dt-hero">
        <div className="container dt-conteudo">
          <div className="dt-principal">
            <Link to="/" className="dt-voltar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Voltar para o feed
            </Link>
            <h1 className="dt-titulo">{op.titulo}</h1>
            <p className="dt-descricao">{op.descricao}</p>
            <div className="dt-infos">
              <div className="dt-info"><strong>Bairro</strong><span>{op.bairro}</span></div>
              <div className="dt-info"><strong>Endereço</strong><span>{op.endereco}</span></div>
              <div className="dt-info"><strong>Horário</strong><span>{op.horario}</span></div>
              <div className="dt-info"><strong>Fonte</strong><span>{op.fonte}</span></div>
              <div className="dt-info"><strong>Inscrições</strong><span>{op.data_inicio_inscricao} até {op.data_fim_inscricao}</span></div>
              <div className="dt-info"><strong>Tipo</strong><span className={`dt-card-tag ${tagClass(op.tipo)}`}>{op.tipo}</span></div>
            </div>
          </div>

          <aside className="dt-sidebar">
            <div className="dt-card">
              <h4>Detalhes da oportunidade</h4>
              <span className={`dt-card-tag ${tagClass(op.tipo)}`}>{op.tipo}</span>
              <p>Use as informações abaixo para avaliar se essa oportunidade combina com seu momento.</p>
            </div>

            <div className="dt-card">
              <h4>Como funciona</h4>
              <p>As oportunidades continuam disponíveis no feed e no mapa. Se surgir um meio de contato novo, ele aparece aqui.</p>
            </div>
          </aside>
        </div>
      </section>
      {toast.container}
    </>
  );
}
