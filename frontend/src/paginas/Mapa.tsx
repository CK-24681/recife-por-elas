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
          <span className="secao-etiqueta">Equipamentos Públicos &amp; CKAN Sync</span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--tinta)' }}>
            Equipamentos Públicos da Prefeitura do Recife
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '15px', margin: 0 }}>
            Dados sincronizados em segundo plano (Worker/Cron) a partir da API do CKAN do Recife.
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
            Carregando equipamentos públicos...
          </h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: '14px', marginTop: '6px' }}>
            Obtendo dados atualizados do banco de dados do backend (/api/equipamentos).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <span className="secao-etiqueta">Equipamentos Públicos &amp; CKAN Sync</span>
        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--tinta)' }}>
          Equipamentos Públicos da Prefeitura do Recife
        </h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '15px', margin: 0 }}>
          Dados sincronizados em segundo plano (Worker/Cron) a partir da API do CKAN do Recife.
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
            Total de registros: {dados.length}
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

        <div>
          {Object.entries(
            dados.reduce((acc, curr) => {
              const cat = curr.categoria || 'outros';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(curr);
              return acc;
            }, {} as Record<string, PontoNormalizado[]>)
          ).map(([cat, itens]) => (
            <div key={cat} style={{ marginBottom: '24px' }}>
              <h3 style={{ textTransform: 'capitalize', color: '#38bdf8', borderBottom: '1px dashed #334155', paddingBottom: '8px', marginBottom: '12px' }}>
                {cat} ({itens.length})
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {itens.map((item) => (
                  <div key={item.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#f8fafc' }}>{item.nome}</strong>
                    <div style={{ color: '#cbd5e1' }}>
                      {item.endereco && <div>📍 {item.endereco}</div>}
                      {item.telefone && <div>📞 {item.telefone}</div>}
                      {item.fonte_dados && <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>Fonte: {item.fonte_dados}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
