import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { buscarEquipamentosBackend } from '../services/mapa';
import type { PontoNormalizado } from '../services/mapa';

const CONFIG_CATEGORIAS: Record<string, { cor: string }> = {
  'Cidadania / Apoio': { cor: '#e11d48' },
  'Educação / Creches': { cor: '#2563eb' },
  'Saúde': { cor: '#059669' },
  'Trabalho e Empreendedorismo': { cor: '#d97706' },
};

const CATEGORIA_PADRAO = { cor: '#7c3aed' };

const CATEGORIAS_DISPONIVEIS = Object.keys(CONFIG_CATEGORIAS);

const ICON_SVG: Record<string, string> = {
  'Saúde': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12M6 12h12"/></svg>`,
  'Educação / Creches': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  'Cidadania / Apoio': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'Trabalho e Empreendedorismo': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  'Padrao': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
};

function IconeCategoria({ categoria, size = 16, color }: { categoria: string; size?: number; color?: string }) {
  const svgRaw = ICON_SVG[categoria] || ICON_SVG['Padrao'];
  const svgResized = svgRaw.replace('width="16" height="16"', `width="${size}" height="${size}"`);
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: color || 'currentColor' }}
      dangerouslySetInnerHTML={{ __html: svgResized }}
    />
  );
}

function criarIconePersonalizado(categoria: string) {
  const config = CONFIG_CATEGORIAS[categoria] || CATEGORIA_PADRAO;
  const svgIcon = ICON_SVG[categoria] || ICON_SVG['Padrao'];
  
  const html = `
    <div style="
      background-color: ${config.cor};
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
      color: #ffffff;
      cursor: pointer;
    ">
      <span style="
        transform: rotate(45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">${svgIcon}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

export default function Mapa() {
  const [dados, setDados] = useState<PontoNormalizado[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [filtrosAbertos, setFiltrosAbertos] = useState<boolean>(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Set<string>>(
    new Set(CATEGORIAS_DISPONIVEIS)
  );

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      const resultados = await buscarEquipamentosBackend();
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

  const toggleCategoria = (cat: string) => {
    setCategoriasSelecionadas((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(cat)) {
        proximo.delete(cat);
      } else {
        proximo.add(cat);
      }
      return proximo;
    });
  };

  const alternarTodasCategorias = () => {
    if (categoriasSelecionadas.size === CATEGORIAS_DISPONIVEIS.length) {
      setCategoriasSelecionadas(new Set());
    } else {
      setCategoriasSelecionadas(new Set(CATEGORIAS_DISPONIVEIS));
    }
  };

  const dadosFiltrados = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();
    return dados.filter((item) => {
      const bateCategoria = categoriasSelecionadas.size === 0 || categoriasSelecionadas.has(item.categoria);
      if (!bateCategoria) return false;

      if (!termoBusca) return true;
      const nomeMatch = item.nome.toLowerCase().includes(termoBusca);
      const enderecoMatch = (item.endereco || '').toLowerCase().includes(termoBusca);
      const categoriaMatch = item.categoria.toLowerCase().includes(termoBusca);
      return nomeMatch || enderecoMatch || categoriaMatch;
    });
  }, [dados, categoriasSelecionadas, busca]);

  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '16px 20px', height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--tinta)' }}>
            Mapa de Equipamentos Públicos
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '14px', margin: 0 }}>
            Explore a rede de apoio, saúde, educação e cidadania do Recife Por Elas.
          </p>
        </div>

        {/* Botão de abrir/fechar filtros no mobile */}
        <button
          className="btn-toggle-mobile-filtros"
          onClick={() => setFiltrosAbertos(!filtrosAbertos)}
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--primaria, #db2777)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <IconeCategoria categoria="Padrao" size={16} color="#fff" />
          <span>{filtrosAbertos ? 'Ocultar Filtros' : `Filtros (${dadosFiltrados.length})`}</span>
        </button>
      </header>

      <div className="mapa-layout-flex" style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Painel de Filtros */}
        <aside className={`mapa-painel-sidebar ${filtrosAbertos ? 'aberto' : ''}`} style={{
          width: '320px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--borda)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--sombra-1)',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          {/* Busca por texto */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tinta)', display: 'block', marginBottom: '6px' }}>
              Buscar equipamento
            </label>
            <input
              type="text"
              placeholder="Nome, bairro ou endereço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--borda)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filtro por Categorias */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--borda)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--tinta)', margin: 0 }}>
              Categorias
            </h3>
            <button
              onClick={alternarTodasCategorias}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primaria, #db2777)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              {categoriasSelecionadas.size === CATEGORIAS_DISPONIVEIS.length ? 'Desmarcar todas' : 'Marcar todas'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CATEGORIAS_DISPONIVEIS.map((cat) => {
              const config = CONFIG_CATEGORIAS[cat] || CATEGORIA_PADRAO;
              const marcado = categoriasSelecionadas.has(cat);
              const qtd = dados.filter((d) => d.categoria === cat).length;

              return (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--texto)' }}>
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => toggleCategoria(cat)}
                    style={{ accentColor: config.cor, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: `${config.cor}18`,
                      color: config.cor
                    }}>
                      <IconeCategoria categoria={cat} size={14} color={config.cor} />
                    </span>
                    <span>{cat}</span>
                  </span>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    {qtd}
                  </span>
                </label>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--borda)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--texto-suave)', margin: 0 }}>
              Exibindo <strong>{dadosFiltrados.length}</strong> de {dados.length} pontos
            </p>
          </div>
        </aside>

        {/* Visualizador do Mapa */}
        <main style={{
          flex: 1,
          minWidth: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--borda)',
          boxShadow: 'var(--sombra-1)',
          position: 'relative',
          height: '100%'
        }}>
          {carregando ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc' }}>
              <p style={{ color: 'var(--texto-suave)', fontWeight: 600 }}>Carregando mapa e equipamentos...</p>
            </div>
          ) : (
            <MapContainer
              center={[-8.0476, -34.8770]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {dadosFiltrados.map((item) => {
                const config = CONFIG_CATEGORIAS[item.categoria] || CATEGORIA_PADRAO;
                return (
                  <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={criarIconePersonalizado(item.categoria)}
                  >
                    <Popup className="mapa-conecta-popup">
                      <div className="mapa-popup-conteudo">
                        <span
                          className="mapa-popup-badge"
                          style={{
                            color: config.cor,
                            backgroundColor: `${config.cor}15`,
                            borderColor: `${config.cor}33`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <IconeCategoria categoria={item.categoria} size={12} color={config.cor} />
                          <span>{item.categoria}</span>
                        </span>
                        <h3 className="mapa-popup-titulo">{item.nome}</h3>
                        {item.endereco && (
                          <p className="mapa-popup-endereco">
                            <strong>📍 Endereço:</strong> {item.endereco}
                          </p>
                        )}
                        {item.telefone && (
                          <p className="mapa-popup-tel">
                            <strong>📞 Contato:</strong> {item.telefone}
                          </p>
                        )}

                        <div className="mapa-popup-acoes">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mapa-popup-btn"
                          >
                            Como chegar (Google Maps) →
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .btn-toggle-mobile-filtros {
            display: inline-flex !important;
          }
          .mapa-layout-flex {
            flex-direction: column !important;
          }
          .mapa-painel-sidebar {
            width: 100% !important;
            max-height: ${filtrosAbertos ? '320px' : '0px'} !important;
            padding: ${filtrosAbertos ? '16px' : '0px'} !important;
            border: ${filtrosAbertos ? '1px solid var(--borda)' : 'none'} !important;
            overflow: hidden !important;
            transition: all 0.3s ease !important;
          }
        }
      `}</style>
    </div>
  );
}


