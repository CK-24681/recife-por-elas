import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ESTRUTURA_CATEGORIAS,
  buscarDadosCKAN,
} from '../services/mapa';
import type {
  GrupoCategoria,
  ItemCategoria,
  PontoMapa,
} from '../services/mapa';

// Ícone personalizado por categoria com suporte a SVG e Emoji
function criarIcone(cor: string, emoji: string) {
  return L.divIcon({
    className: 'pin-mapa-custom',
    html: `<div style="
      background-color: ${cor};
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #ffffff;
      transition: transform 0.2s ease;
    ">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

function findCategoriaConfig(id: string): ItemCategoria | undefined {
  for (const grupo of ESTRUTURA_CATEGORIAS) {
    const item = grupo.itens.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}

export default function Mapa() {
  // Estado dos checkboxes selecionados (IDs dos itens)
  const [selecionadas, setSelecionadas] = useState<string[]>([
    'hospital-mulher',
    'delegacia-mulher',
    'compaz',
  ]);

  // Estado dos grupos de categoria expandidos (Accordion)
  const [gruposExpandidos, setGruposExpandidos] = useState<Record<string, boolean>>({
    'saude-seguranca': true,
    'educacao-cuidado': true,
    'cidadania-empreendedorismo': true,
  });

  // Estado dos pontos de dados agrupados por ID da categoria
  const [pontosPorCategoria, setPontosPorCategoria] = useState<Record<string, PontoMapa[]>>({});

  // Estado de carregamento por categoria
  const [carregando, setCarregando] = useState<Record<string, boolean>>({});

  // Carrega dados iniciais das categorias marcadas por padrão no boot
  useEffect(() => {
    let ativo = true;
    const carregarIniciais = async () => {
      for (const catId of selecionadas) {
        const config = findCategoriaConfig(catId);
        if (config && !pontosPorCategoria[catId]) {
          setCarregando((prev) => ({ ...prev, [catId]: true }));
          const pontos = await buscarDadosCKAN(config.resourceId);
          if (ativo) {
            setPontosPorCategoria((prev) => ({ ...prev, [catId]: pontos }));
            setCarregando((prev) => ({ ...prev, [catId]: false }));
          }
        }
      }
    };
    carregarIniciais();
    return () => {
      ativo = false;
    };
  }, []);

  // Alterna expansão de um grupo no Accordion
  const alternarGrupo = (grupoId: string) => {
    setGruposExpandidos((prev) => ({ ...prev, [grupoId]: !prev[grupoId] }));
  };

  // Alterna estado do checkbox de uma categoria
  const alternarCategoria = async (item: ItemCategoria) => {
    const estaSelecionada = selecionadas.includes(item.id);
    if (estaSelecionada) {
      setSelecionadas((prev) => prev.filter((id) => id !== item.id));
    } else {
      setSelecionadas((prev) => [...prev, item.id]);
      if (!pontosPorCategoria[item.id]) {
        setCarregando((prev) => ({ ...prev, [item.id]: true }));
        const pontos = await buscarDadosCKAN(item.resourceId);
        setPontosPorCategoria((prev) => ({ ...prev, [item.id]: pontos }));
        setCarregando((prev) => ({ ...prev, [item.id]: false }));
      }
    }
  };

  // Seleciona ou desmarca todas as categorias de um grupo
  const alternarTodosDoGrupo = async (grupo: GrupoCategoria) => {
    const todosItensGrupo = grupo.itens.map((i) => i.id);
    const todosSelecionados = todosItensGrupo.every((id) => selecionadas.includes(id));

    if (todosSelecionados) {
      setSelecionadas((prev) => prev.filter((id) => !todosItensGrupo.includes(id)));
    } else {
      const novosId = Array.from(new Set([...selecionadas, ...todosItensGrupo]));
      setSelecionadas(novosId);
      for (const item of grupo.itens) {
        if (!pontosPorCategoria[item.id]) {
          setCarregando((prev) => ({ ...prev, [item.id]: true }));
          const pontos = await buscarDadosCKAN(item.resourceId);
          setPontosPorCategoria((prev) => ({ ...prev, [item.id]: pontos }));
          setCarregando((prev) => ({ ...prev, [item.id]: false }));
        }
      }
    }
  };

  // Junta todos os pontos das categorias ativas
  const todosPontos = selecionadas.flatMap((catId) => {
    const config = findCategoriaConfig(catId);
    const pontos = pontosPorCategoria[catId] || [];
    return pontos.map((p) => ({ ...p, config }));
  });

  return (
    <div className="mapa-estatico-pagina">
      {/* CABEÇALHO DA PÁGINA */}
      <section className="mapa-secao-cabecalho">
        <div className="container">
          <span className="secao-etiqueta">Prefeitura do Recife • CKAN</span>
          <h1 className="mapa-estatico-titulo">Recife por Elas — Mapa de Equipamentos</h1>
          <p className="mapa-estatico-subtitulo">
            Encontre hospitais da mulher, delegacias, creches, escolas profissionalizantes e unidades do Compaz na cidade.
          </p>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL (CONTAINER PADRÃO DA PÁGINA) */}
      <section className="container mapa-secao-conteudo">
        <div className="mapa-estatico-grid">
          {/* COLUNA ESQUERDA (40% DESKTOP): FILTROS EM ACORDEÃO */}
          <aside className="mapa-coluna-filtros">
            <div className="mapa-painel-estatico">
              <header className="mapa-painel-estatico-cabeca">
                <h3>Filtrar por Categoria</h3>
                <span className="mapa-contador-badge">
                  {todosPontos.length} ponto{todosPontos.length === 1 ? '' : 's'}
                </span>
              </header>

              <div className="mapa-arvore-categorias">
                {ESTRUTURA_CATEGORIAS.map((grupo) => {
                  const expandido = gruposExpandidos[grupo.id] ?? true;
                  const itensSelecionados = grupo.itens.filter((i) => selecionadas.includes(i.id));
                  const todosMarcados = itensSelecionados.length === grupo.itens.length;

                  return (
                    <div key={grupo.id} className="mapa-grupo-item">
                      <div className="mapa-grupo-cabeca">
                        <button
                          type="button"
                          className="mapa-grupo-btn"
                          onClick={() => alternarGrupo(grupo.id)}
                        >
                          <span className="mapa-grupo-seta">{expandido ? '▼' : '▶'}</span>
                          <span className="mapa-grupo-icone">{grupo.icone}</span>
                          <strong className="mapa-grupo-titulo">{grupo.titulo}</strong>
                        </button>
                        <button
                          type="button"
                          className="mapa-grupo-atalho"
                          onClick={() => alternarTodosDoGrupo(grupo)}
                        >
                          {todosMarcados ? 'Desmarcar' : 'Marcar'}
                        </button>
                      </div>

                      {expandido && (
                        <ul className="mapa-grupo-lista">
                          {grupo.itens.map((item) => {
                            const marcado = selecionadas.includes(item.id);
                            const estaCarregando = carregando[item.id];
                            const qtdPontos = pontosPorCategoria[item.id]?.length;

                            return (
                              <li key={item.id} className="mapa-categoria-linha">
                                <label className="mapa-checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={marcado}
                                    onChange={() => alternarCategoria(item)}
                                    className="mapa-checkbox-input"
                                  />
                                  <span
                                    className="mapa-cor-indicador"
                                    style={{ backgroundColor: item.cor }}
                                  />
                                  <span className="mapa-item-emoji">{item.emoji}</span>
                                  <span className="mapa-item-nome">{item.nome}</span>
                                </label>
                                {estaCarregando ? (
                                  <span className="mapa-item-spinner" title="Buscando na API do CKAN..." />
                                ) : marcado && qtdPontos !== undefined ? (
                                  <span className="mapa-item-qtd">{qtdPontos}</span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {selecionadas.length > 0 && (
                <div className="mapa-painel-estatico-pe">
                  <button
                    type="button"
                    className="mapa-btn-limpar-estatico"
                    onClick={() => setSelecionadas([])}
                  >
                    Limpar todas as categorias
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* COLUNA DIREITA (60% DESKTOP): MAPA ESTRITAMENTE ESTÁTICO (ALTURA FIXA, SEM STICKY/FIXED) */}
          <main className="mapa-coluna-mapa">
            <div className="mapa-frame-estatico">
              <MapContainer
                center={[-8.0475, -34.8770]}
                zoom={13}
                scrollWheelZoom={false}
                className="mapa-leaflet-estatico"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://dados.recife.pe.gov.br">Prefeitura do Recife (CKAN)</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {todosPontos.map((ponto) => (
                  <Marker
                    key={ponto.id}
                    position={[ponto.latitude, ponto.longitude]}
                    icon={criarIcone(ponto.config?.cor || '#e11d48', ponto.config?.emoji || '📍')}
                  >
                    <Popup className="mapa-conecta-popup">
                      <div className="mapa-popup-conteudo">
                        <span
                          className="mapa-popup-badge"
                          style={{
                            color: ponto.config?.cor || '#e11d48',
                            backgroundColor: `${ponto.config?.cor || '#e11d48'}15`,
                            borderColor: `${ponto.config?.cor || '#e11d48'}33`,
                          }}
                        >
                          {ponto.config?.emoji} {ponto.config?.nome}
                        </span>
                        <h3 className="mapa-popup-titulo">{ponto.nome}</h3>
                        <p className="mapa-popup-endereco">
                          <strong>📍 Endereço:</strong> {ponto.endereco}
                        </p>
                        {ponto.telefone && (
                          <p className="mapa-popup-tel">
                            <strong>📞 Contato:</strong> {ponto.telefone}
                          </p>
                        )}
                        {ponto.descricao && (
                          <p className="mapa-popup-desc">{ponto.descricao}</p>
                        )}
                        <div className="mapa-popup-acoes">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${ponto.latitude},${ponto.longitude}`}
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
                ))}
              </MapContainer>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
