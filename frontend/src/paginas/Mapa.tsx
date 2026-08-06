import { useState, useEffect } from 'react';
import { executarCrawlerCKAN } from '../services/mapa';
import type { PontoNormalizado } from '../services/mapa';

export default function Mapa() {
  const [dados, setDados] = useState<PontoNormalizado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    let ativo = true;
    const iniciarCrawler = async () => {
      setCarregando(true);
      const resultados = await executarCrawlerCKAN();
      if (ativo) {
        setDados(resultados);
        setCarregando(false);
      }
    };
    iniciarCrawler();
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return (
      <div className="container" style={{ paddingBlock: '40px' }}>
        <header style={{ marginBottom: '24px' }}>
          <span className="secao-etiqueta">CKAN Data Crawler &amp; Normalizer</span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--tinta)' }}>
            Inspeção de Dados da Prefeitura do Recife
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '15px', margin: 0 }}>
            Varredura dinâmica de pacotes abertos em busca de coordenadas e equipamentos para mulheres.
          </p>
        </header>

        <div
          style={{
            padding: '48px 24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--borda)',
            textAlign: 'center',
            boxShadow: 'var(--sombra-1)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tinta)', margin: 0 }}>
            Buscando dados na Prefeitura...
          </h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: '14px', marginTop: '6px' }}>
            Consultando os termos: mulher, compaz, creche, escola, oficina.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <span className="secao-etiqueta">CKAN Data Crawler &amp; Normalizer</span>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--tinta)' }}>
          Inspeção de Dados da Prefeitura do Recife
        </h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '15px', margin: 0 }}>
          Varredura dinâmica de pacotes abertos em busca de coordenadas e equipamentos para mulheres.
        </p>
      </header>

      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          borderRadius: '16px',
          overflowX: 'auto',
          border: '1px solid #1e293b',
          boxShadow: 'var(--sombra-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            borderBottom: '1px solid #334155',
            paddingBottom: '12px',
          }}
        >
          <strong style={{ color: '#38bdf8', fontSize: '15px' }}>
            Total de registros normalizados: {dados.length}
          </strong>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Refazer Varredura
          </button>
        </div>

        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5 }}>
          <code>{JSON.stringify(dados, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
}
