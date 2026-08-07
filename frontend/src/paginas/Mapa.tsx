import { useState, useEffect } from 'react';
import { buscarEquipamentosBackend } from '../services/mapa';
import type { PontoNormalizado } from '../services/mapa';

export default function Mapa() {
  const [dados, setDados] = useState<PontoNormalizado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      const resultados = await buscarEquipamentosBackend(); // Busca todos sem filtro para filtrar localmente
      if (ativo) {
        setDados(resultados);
        setCarregando(false);
      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="container" style={{ paddingBlock: '20px', height: '100vh', overflow: 'auto' }}>
      <h2>Log de Resposta JSON (Auditoria /api/mapa/locais)</h2>
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(dados, null, 2)}
        </pre>
      )}
    </div>
  );
}
