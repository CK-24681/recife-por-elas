import { Pool } from 'pg';

// IDs reais ou de exemplo dos datasets do Recife (dados.recife.pe.gov.br)
const RESOURCE_IDS = [
  '2eaaed0b-af55-460c-85ce-ddc7b2cc8e21', // Ex: Unidades de Saúde
  'd4d8a7f0-d4be-4397-b950-f0c991438111', // Ex: Escolas e Creches
  '4c99736e-d4c3-424a-939e-4e4a9e1e2d42', // Ex: Assistência Social (CRAS, CREAS)
  'c62d64f0-4f51-40b9-8e6f-40e94939b4f9', // Ex: Compaz / Geração de Renda
  // Adicione outros IDs reais do CKAN Recife aqui
];

const CKAN_API_URL = 'http://dados.recife.pe.gov.br/api/3/action/datastore_search';

// Função auxiliar para tentar extrair latitude e longitude dos dados brutos
function extrairCoordenadas(record: any): { lat: number | null; lng: number | null } {
  const latStr = record.latitude || record.lat || record.LATITUDE || record.LAT;
  const lngStr = record.longitude || record.lon || record.lng || record.LONGITUDE || record.LONG;

  let lat = latStr ? parseFloat(String(latStr).replace(',', '.')) : null;
  let lng = lngStr ? parseFloat(String(lngStr).replace(',', '.')) : null;

  if (lat && isNaN(lat)) lat = null;
  if (lng && isNaN(lng)) lng = null;

  return { lat, lng };
}

// Função para categorizar com base em palavras-chave no texto
function categorizarEquipamento(record: any): string {
  // Transforma o record inteiro em string para buscar palavras em qualquer campo (nome, descricao, tipo, etc)
  const textoGeral = JSON.stringify(record).toLowerCase();

  if (textoGeral.includes('mulher') && (textoGeral.includes('delegacia') || textoGeral.includes('deam'))) {
    return 'Segurança';
  }
  if (textoGeral.includes('mulher') && (textoGeral.includes('maternidade') || textoGeral.includes('hospital') || textoGeral.includes('saúde') || textoGeral.includes('saude'))) {
    return 'Saúde da Mulher';
  }
  if (textoGeral.includes('creche') || textoGeral.includes('infantil') || textoGeral.includes('cmei') || textoGeral.includes('escola')) {
    return 'Educação Infantil';
  }
  if (textoGeral.includes('cras') || textoGeral.includes('creas') || textoGeral.includes('assistência social') || textoGeral.includes('assistencia social')) {
    return 'Assistência Social';
  }
  if (textoGeral.includes('compaz') || textoGeral.includes('empreendedor') || textoGeral.includes('renda')) {
    return 'Geração de Renda e Cidadania';
  }

  // Se for uma delegacia mas não necessariamente da mulher
  if (textoGeral.includes('delegacia')) {
    return 'Segurança';
  }

  return 'Outros'; // Itens "Outros" não aparecerão no mapa
}

export async function sincronizarEquipamentosCKAN(pool: Pool): Promise<void> {
  console.log('[CKAN Sync] Iniciando sincronização do CKAN...');

  let upsertados = 0;

  for (const resourceId of RESOURCE_IDS) {
    try {
      console.log(`[CKAN Sync] Buscando dados do resource_id: ${resourceId}`);
      // Limite alto para garantir que trazemos tudo, ou podemos paginar
      const response = await fetch(`${CKAN_API_URL}?resource_id=${resourceId}&limit=10000`);
      
      if (!response.ok) {
        console.error(`[CKAN Sync] Falha ao buscar resource_id ${resourceId}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const records = data?.result?.records || [];

      console.log(`[CKAN Sync] ${records.length} registros encontrados no resource_id ${resourceId}`);

      for (const record of records) {
        const idStr = record._id ? String(record._id) : Math.random().toString(36).substring(7);
        const uniqueId = `ckan_${resourceId}_${idStr}`; // Evita colisão entre diferentes recursos

        const nome = record.nome || record.nome_oficial || record.equipamento || record.unidade || `Equipamento ${idStr}`;
        const endereco = record.endereco || record.logradouro || '';
        const bairro = record.bairro || '';
        const telefone = record.telefone || record.fone || '';
        const horario_funcionamento = record.horario_funcionamento || record.funcionamento || '';
        const fonte_dados = `CKAN_${resourceId}`;
        const dadosBrutos = JSON.stringify(record);

        const { lat, lng } = extrairCoordenadas(record);
        const categoria = categorizarEquipamento(record);

        try {
          await pool.query(
            `INSERT INTO equipamentos_locais (
              id, nome, categoria, endereco, bairro, telefone, horario_funcionamento, latitude, longitude, fonte_dados, dados_brutos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              nome = EXCLUDED.nome,
              categoria = EXCLUDED.categoria,
              endereco = EXCLUDED.endereco,
              bairro = EXCLUDED.bairro,
              telefone = EXCLUDED.telefone,
              horario_funcionamento = EXCLUDED.horario_funcionamento,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              fonte_dados = EXCLUDED.fonte_dados,
              dados_brutos = EXCLUDED.dados_brutos,
              atualizado_em = now()`,
            [
              uniqueId,
              nome,
              categoria,
              endereco,
              bairro,
              telefone,
              horario_funcionamento,
              lat,
              lng,
              fonte_dados,
              dadosBrutos
            ]
          );
          upsertados++;
        } catch (dbErr) {
          console.error(`[CKAN Sync] Erro ao salvar registro ${uniqueId}:`, dbErr);
        }
      }
    } catch (fetchErr) {
      console.error(`[CKAN Sync] Erro de rede/fetch no resource_id ${resourceId}:`, fetchErr);
    }
  }

  console.log(`[CKAN Sync] Finalizado! ${upsertados} registros sincronizados do CKAN.`);
}
