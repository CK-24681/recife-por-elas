import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { buscarEquipamentosBackend } from '../services/mapa';
import type { PontoNormalizado } from '../services/mapa';

const CATEGORIAS_DISPONIVEIS = [
  'Cidadania / Apoio',
  'Educação / Creches',
  'Saúde',
  'Trabalho e Empreendedorismo'
];

export default function Mapa() {
  const [dados, setDados] = useState<PontoNormalizado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Set<string>>(
    new Set(CATEGORIAS_DISPONIVEIS)
  );

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

  const toggleCategoria = (categoria: string) => {
    setCategoriasSelecionadas(prev => {
      const novo = new Set(prev);
      if (novo.has(categoria)) novo.delete(categoria);
      else novo.add(categoria);
      return novo;
    });
  };

  const dadosFiltrados = useMemo(() => {
    return dados.filter(d => categoriasSelecionadas.has(d.categoria));
  }, [dados, categoriasSelecionadas]);

  return (
    <div className="container" style={{ paddingBlock: '20px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--tinta)' }}>
          Mapa de Equipamentos Públicos
        </h1>
        <p style={{ color: 'var(--texto-suave)', fontSize: '14px', margin: 0 }}>
          Explore a rede de apoio, saúde e cidadania do Recife Por Elas.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar de Filtros */}
        <aside style={{
          width: '280px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--borda)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--sombra-1)',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tinta)', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--borda)' }}>
            Filtros por Categoria
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CATEGORIAS_DISPONIVEIS.map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={categoriasSelecionadas.has(cat)}
                  onChange={() => toggleCategoria(cat)}
                  style={{ marginTop: '3px', accentColor: 'var(--primaria, #db2777)' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--texto)', lineHeight: 1.4 }}>
                  {cat}
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--texto-suave)', textAlign: 'center' }}>
              Exibindo {dadosFiltrados.length} pontos no mapa
            </p>
          </div>
        </aside>

        {/* Visualizador do Mapa */}
        <main style={{
          flex: 1,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--borda)',
          boxShadow: 'var(--sombra-1)',
          position: 'relative'
        }}>
          {carregando ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc' }}>
              <p style={{ color: 'var(--texto-suave)', fontWeight: 600 }}>Carregando mapa...</p>
            </div>
          ) : (
            <MapContainer
              center={[-8.0476, -34.8770]} // Centro do Recife
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              
              {dadosFiltrados.map((item) => (
                <Marker key={item.id} position={[item.lat, item.lng]}>
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ display: 'block', fontSize: '14px', marginBottom: '6px', color: '#0f172a' }}>
                        {item.nome}
                      </strong>
                      <span style={{ 
                        display: 'inline-block',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}>
                        {item.categoria}
                      </span>
                      {item.endereco && <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>📍 {item.endereco}</div>}
                      {item.telefone && <div style={{ fontSize: '12px', color: '#334155' }}>📞 {item.telefone}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </main>
      </div>
    </div>
  );
}
