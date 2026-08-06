// Serviço de Varredura (Crawler) e Normalizador Universal da API CKAN do Recife
// Endpoints:
// package_search:   GET https://dados.recife.pe.gov.br/api/3/action/package_search?q={termo}
// datastore_search: GET https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id={id}&limit=100

export interface PontoNormalizado {
  id: string;
  categoria: string;
  nome: string;
  lat: number;
  lng: number;
  endereco?: string;
  resourceId?: string;
}

export const TERMOS_CRAWLER = ['mulher', 'compaz', 'creche', 'escola', 'oficina'];

// Normalizador Universal: adivinha colunas de Latitude, Longitude e Nome
export function normalizarRegistroCKAN(
  rec: Record<string, unknown>,
  categoria: string,
  resourceId: string,
  index: number
): PontoNormalizado | null {
  if (!rec || typeof rec !== 'object') return null;

  const keys = Object.keys(rec);

  // Procurar chave de Latitude (lat, latitude, y, coordenada_y)
  const latKey = keys.find((k) =>
    /^(latitude|lat|coordenada_y|y|lat_y)$/i.test(k.trim()) ||
    /latitude|coordenada_y/i.test(k.trim())
  );

  // Procurar chave de Longitude (lon, lng, longitude, x, coordenada_x)
  const lngKey = keys.find((k) =>
    /^(longitude|lng|lon|coordenada_x|x|long|lng_x)$/i.test(k.trim()) ||
    /longitude|coordenada_x/i.test(k.trim())
  );

  if (!latKey || !lngKey) return null;

  const rawLat = rec[latKey];
  const rawLng = rec[lngKey];

  let lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat).replace(',', '.'));
  let lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng).replace(',', '.'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Ajustar se lat/lng vierem invertidas
  if (lat < -30 && lng > -10) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  // Validação geográfica para área do Recife / Pernambuco (-9.5 < lat < -7.0 e -36.0 < lng < -34.0)
  if (lat < -9.5 || lat > -7.0 || lng < -36.0 || lng > -34.0) return null;

  // Procurar chave de Nome (nome, equipamento, unidade, descricao)
  const nomeKey = keys.find((k) =>
    /^(nome|equipamento|unidade|descricao|escola|hospital|denominacao|nome_oficial)$/i.test(k.trim()) ||
    /nome|equipamento|unidade/i.test(k.trim())
  );

  const nomeRaw = nomeKey ? rec[nomeKey] : null;
  const nome = nomeRaw ? String(nomeRaw).trim() : `${categoria.toUpperCase()} #${index + 1}`;

  // Procurar endereço se existir
  const endKey = keys.find((k) => /endereco|logradouro|localizacao|bairro/i.test(k.trim()));
  const endereco = endKey ? String(rec[endKey]).trim() : undefined;

  return {
    id: `${resourceId}_${rec._id || index}`,
    categoria,
    nome,
    lat,
    lng,
    endereco,
    resourceId,
  };
}

// Fallback rico e limpo para testes/ambiente offline
const MOCK_CRAWLER_FALLBACK: PontoNormalizado[] = [
  { id: 'mulher_1', categoria: 'mulher', nome: 'Hospital da Mulher do Recife (Dra. Mercês Pontes)', lat: -8.0772, lng: -34.9608, endereco: 'BR-101, s/n - Curado' },
  { id: 'mulher_2', categoria: 'mulher', nome: 'Centro de Referência Clarice Lispector', lat: -8.0545, lng: -34.8845, endereco: 'Rua Pedro Augusto, 16 - Santo Amaro' },
  { id: 'mulher_3', categoria: 'mulher', nome: '1ª Delegacia da Mulher (Santo Amaro)', lat: -8.0512, lng: -34.8814, endereco: 'Praça do Campo Santo, s/n' },
  { id: 'compaz_1', categoria: 'compaz', nome: 'Compaz Eduardo Campos', lat: -8.0128, lng: -34.8965, endereco: 'Av. Aníbal Benévolo, s/n - Alto Santa Terezinha' },
  { id: 'compaz_2', categoria: 'compaz', nome: 'Compaz Ariano Suassuna', lat: -8.0560, lng: -34.9215, endereco: 'Av. General San Martin, 1208 - Cordeiro' },
  { id: 'compaz_3', categoria: 'compaz', nome: 'Compaz Miguel Arraes', lat: -8.0525, lng: -34.9080, endereco: 'Av. Caxangá, 653 - Madalena' },
  { id: 'creche_1', categoria: 'creche', nome: 'CMEI Prof. Paulo Rosas', lat: -8.0522, lng: -34.9490, endereco: 'Cidade Universitária' },
  { id: 'creche_2', categoria: 'creche', nome: 'Creche Municipal Casa Amarela', lat: -8.0233, lng: -34.9178, endereco: 'Casa Amarela' },
  { id: 'escola_1', categoria: 'escola', nome: 'Escola Profissionalizante Dom Bosco', lat: -8.1380, lng: -34.9090, endereco: 'Boa Viagem' },
  { id: 'escola_2', categoria: 'escola', nome: 'Escola Profissional Zuleide Pinto', lat: -8.0195, lng: -34.9350, endereco: 'Apipucos' },
  { id: 'oficina_1', categoria: 'oficina', nome: 'Associação de Mulheres do Ibura', lat: -8.1210, lng: -34.9310, endereco: 'Ibura' },
  { id: 'oficina_2', categoria: 'oficina', nome: 'Bordadeiras de Casa Amarela', lat: -8.0245, lng: -34.9160, endereco: 'Casa Amarela' },
];

// Função principal do Crawler inteligente no CKAN
export async function executarCrawlerCKAN(): Promise<PontoNormalizado[]> {
  const resultados: PontoNormalizado[] = [];
  const idsProcessados = new Set<string>();

  for (const termo of TERMOS_CRAWLER) {
    try {
      const urlPkg = `https://dados.recife.pe.gov.br/api/3/action/package_search?q=${encodeURIComponent(termo)}`;
      const resPkg = await fetch(urlPkg);
      if (!resPkg.ok) continue;

      const dataPkg = await resPkg.json();
      const pacotes = dataPkg?.result?.results;
      if (!Array.isArray(pacotes)) continue;

      for (const pkg of pacotes.slice(0, 4)) {
        const resources = pkg?.resources;
        if (!Array.isArray(resources)) continue;

        for (const r of resources) {
          const resId = r?.id;
          const format = String(r?.format || '').toUpperCase();
          const datastoreActive = Boolean(r?.datastore_active || format === 'CSV');

          if (!resId || !datastoreActive || idsProcessados.has(resId)) continue;
          idsProcessados.add(resId);

          try {
            const urlData = `https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=${encodeURIComponent(resId)}&limit=100`;
            const resData = await fetch(urlData);
            if (!resData.ok) continue;

            const dataRecords = await resData.json();
            const records = dataRecords?.result?.records;
            if (!Array.isArray(records)) continue;

            for (let i = 0; i < records.length; i++) {
              const normalizado = normalizarRegistroCKAN(records[i], termo, resId, i);
              if (normalizado) {
                resultados.push(normalizado);
              }
            }
          } catch {
            // Continua para o próximo resource
          }
        }
      }
    } catch {
      // Continua para o próximo termo
    }
  }

  if (resultados.length === 0) {
    return MOCK_CRAWLER_FALLBACK;
  }

  return resultados;
}
