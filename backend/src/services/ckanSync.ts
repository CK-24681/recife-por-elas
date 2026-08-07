import { Pool } from 'pg';

// IDs reais dos datasets do Recife (dados.recife.pe.gov.br)
const RESOURCE_IDS = [
  '64cc8ab3-bd69-4629-b145-74552fe31e1c', // Unidades de Saúde da Família (USF)
  'c727e8f8-40e9-415e-b14d-2c46406abb60', // Núcleos de Apoio à Saúde da Família (NASF)
  'ec99525c-3a8b-486b-9aa3-c495fcc37c7e', // Unidades Educacionais / Escolas / Creches
  '34dd0736-6ebf-40de-87d3-dbc53cb56bd5', // Rede COMPAZ
  '779bde79-29bf-44df-ac5c-f88c01e04278', // CRAS - Centros de Referência de Assistência Social
  'b68ff504-bbe3-4827-8bbe-b03de22866c2', // Salas do Empreendedor e Agências SINE (Trabalho e Empreendedorismo)
  '8ac5a7a2-8467-46e2-ae28-43c9ed4604f3', // Escolas Profissionalizantes do Recife (Trabalho e Empreendedorismo)
];

const CKAN_API_URL = 'http://dados.recife.pe.gov.br/api/3/action/datastore_search';

function formatarCoordNum(valor: any): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  let str = String(valor).trim().replace(',', '.');
  const partes = str.split('.');
  if (partes.length > 2) {
    str = partes[0] + '.' + partes.slice(1).join('');
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function extrairCoordenadas(record: any): { lat: number | null; lng: number | null } {
  const latRaw = record.latitude || record.lat || record.LATITUDE || record.LAT || record.wgs84_y || record.y;
  const lngRaw = record.longitude || record.lon || record.lng || record.LONGITUDE || record.LONG || record.wgs84_x || record.x;

  const lat = formatarCoordNum(latRaw);
  const lng = formatarCoordNum(lngRaw);

  return { lat, lng };
}

function categorizarEquipamento(record: any): string {
  const textoGeral = JSON.stringify(record).toLowerCase();

  // 1. Cidadania / Apoio (inclui CRAS, CREAS, Acolhimento, etc.)
  if (textoGeral.includes('cras') || textoGeral.includes('creas') || 
      textoGeral.includes('socioassistencial') || textoGeral.includes('suas') ||
      textoGeral.includes('abrigo') || textoGeral.includes('acolhimento') || 
      textoGeral.includes('mulher') || textoGeral.includes('delegacia') || textoGeral.includes('deam') ||
      textoGeral.includes('conselho tutelar') || textoGeral.includes('direitos humanos')) {
    return 'Cidadania / Apoio';
  }
  
  // 2. Trabalho e Empreendedorismo (compaz, sine, sala do empreendedor, escola profissionalizante / profissional, qualificação)
  if (textoGeral.includes('compaz') || textoGeral.includes('empreendedor') || textoGeral.includes('sine') ||
      textoGeral.includes('profissionalizante') || textoGeral.includes('profissional') || textoGeral.includes('renda') ||
      textoGeral.includes('qualificação') || textoGeral.includes('qualificacao')) {
    return 'Trabalho e Empreendedorismo';
  }

  // 3. Educação / Creches (NOMEESCOLA, creche, infantil, cmei, eja, escola, unidade educacional)
  if (textoGeral.includes('nomeescola') || textoGeral.includes('creche') || textoGeral.includes('infantil') ||
      textoGeral.includes('cmei') || textoGeral.includes('eja') || textoGeral.includes('escola') || textoGeral.includes('educa')) {
    return 'Educação / Creches';
  }
  
  // 4. Saúde (USF, PSF, NASF, UPA, Maternidade, Hospital, Posto de Saúde, Policlínica)
  if (textoGeral.includes('maternidade') || textoGeral.includes('hospital') || textoGeral.includes('saúde') || textoGeral.includes('saude') || textoGeral.includes('unidade materno') || textoGeral.includes('usf') || textoGeral.includes('psf') || textoGeral.includes('nasf') || textoGeral.includes('upa') || textoGeral.includes('policlínica') || textoGeral.includes('policlinica') || textoGeral.includes('posto')) {
    return 'Saúde';
  }

  return 'Outros'; 
}

function formatarNomeEquipamento(rawNome: any, record: any, categoria: string, idStr: string): string {
  if (!rawNome) return `Equipamento ${idStr}`;
  let nome = String(rawNome).trim();

  // 1. Substituir "US" por "Unidade de Saúde" e "USF" por "Unidade de Saúde da Família"
  nome = nome.replace(/^US\b/i, 'Unidade de Saúde')
             .replace(/^USF\b/i, 'Unidade de Saúde da Família')
             .replace(/\bUS\b/g, 'Unidade de Saúde');

  // 2. Para a categoria Educação / Creches: garantir prefixo Escola ou Creche
  if (categoria === 'Educação / Creches') {
    const nomeLower = nome.toLowerCase();
    const ehCreche = nomeLower.includes('creche') || nomeLower.includes('cmei') || nomeLower.includes('infantil');
    
    if (ehCreche) {
      if (!nomeLower.startsWith('creche')) {
        nome = `Creche - ${nome}`;
      }
    } else {
      if (!nomeLower.startsWith('escola')) {
        nome = `Escola - ${nome}`;
      }
    }
  }

  return nome;
}

export async function sincronizarEquipamentosCKAN(pool: Pool): Promise<void> {
  console.log('[CKAN Sync] Iniciando sincronização do CKAN...');

  try {
    console.log('[CKAN Sync] Limpando base antiga de equipamentos (TRUNCATE)...');
    await pool.query('TRUNCATE TABLE equipamentos_locais CASCADE');
  } catch (err) {
    console.error('[CKAN Sync] Erro ao limpar a base antiga:', err);
  }

  let upsertados = 0;

  for (const resourceId of RESOURCE_IDS) {
    try {
      console.log(`[CKAN Sync] Buscando dados do resource_id: ${resourceId}`);
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
        const uniqueId = `ckan_${resourceId}_${idStr}`;

        const { lat, lng } = extrairCoordenadas(record);
        const categoria = categorizarEquipamento(record);

        // Extrai e formata o nome real
        const rawNome = record.unidade || record.NOMEESCOLA || record.nome || record.nome_oficial || record.q0_1 || record.equipamento || record.nome_unidade;
        const nome = formatarNomeEquipamento(rawNome, record, categoria, idStr);

        const rawLogradouro = record.endereco || record['endereço'] || record.logradouro || record.LOGRADOURO || (record.q0_2 ? `${record.q0_2} ${record.q0_3 || ''}` : '') || '';
        const num = record.N ? `, ${String(record.N).trim()}` : (record.q0_4 ? `, ${record.q0_4}` : '');
        const endereco = `${rawLogradouro}${num}`.trim();
        const bairro = record.bairro || record.BAIRRO || record.q0_6 || '';
        const telefone = record.telefone || record.fone || record.telefone1 || (record.q0_12 ? String(record.q0_12) : '') || '';
        const horario_funcionamento = record.horario_funcionamento || record.horario || record.funcionamento || '';
        const fonte_dados = `CKAN_${resourceId}`;
        const dadosBrutos = JSON.stringify(record);

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

