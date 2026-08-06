import type { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export interface EquipamentoPublico {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  bairro: string;
  telefone: string;
  horario_funcionamento: string;
  latitude: number;
  longitude: number;
  fonte_dados: string;
}

export const TERMOS_CATEGORIAS = [
  { termo: 'hospital da mulher', categoria: 'saude' },
  { termo: 'maternidade', categoria: 'saude' },
  { termo: 'policlinica', categoria: 'saude' },
  { termo: 'delegacia da mulher', categoria: 'seguranca' },
  { termo: 'protecao', categoria: 'seguranca' },
  { termo: 'deam', categoria: 'seguranca' },
  { termo: 'compaz', categoria: 'empreendedorismo' },
  { termo: 'sala do empreendedor', categoria: 'empreendedorismo' },
  { termo: 'qualifica', categoria: 'empreendedorismo' },
  { termo: 'cras', categoria: 'apoio' },
  { termo: 'creas', categoria: 'apoio' },
  { termo: 'assistencia social', categoria: 'apoio' }
];

// Normalizador Universal: adivinha colunas de Latitude, Longitude, Nome e Endereço
export function normalizarRegistroCKAN(
  rec: Record<string, unknown>,
  categoria: string,
  resourceId: string,
  index: number
): EquipamentoPublico | null {
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

  // Validação geográfica para a região do Recife / Pernambuco (-9.5 < lat < -7.0 e -36.0 < lng < -34.0)
  if (lat < -9.5 || lat > -7.0 || lng < -36.0 || lng > -34.0) return null;

  // Procurar chave de Nome (nome, equipamento, unidade, descricao)
  const nomeKey = keys.find((k) =>
    /^(nome|equipamento|unidade|descricao|escola|hospital|denominacao|nome_oficial)$/i.test(k.trim()) ||
    /nome|equipamento|unidade/i.test(k.trim())
  );

  const nomeRaw = nomeKey ? rec[nomeKey] : null;
  const nome = nomeRaw ? String(nomeRaw).trim() : `${categoria.toUpperCase()} #${index + 1}`;

  // Procurar endereço se existir
  const endKey = keys.find((k) => /endereco|logradouro|localizacao/i.test(k.trim()) && !/bairro/i.test(k.trim()));
  const endereco = endKey ? String(rec[endKey]).trim() : '';

  const bairroKey = keys.find((k) => /bairro/i.test(k.trim()));
  const bairro = bairroKey ? String(rec[bairroKey]).trim() : '';

  const telKey = keys.find((k) => /telefone|celular|contato/i.test(k.trim()));
  const telefone = telKey ? String(rec[telKey]).trim() : '';

  const horKey = keys.find((k) => /horario|funcionamento/i.test(k.trim()));
  const horario_funcionamento = horKey ? String(rec[horKey]).trim() : '';

  const fonte_dados = 'API Dados Abertos Recife (CKAN)';

  const id = `${resourceId}_${rec._id || index}`;

  return {
    id,
    nome,
    categoria,
    endereco,
    bairro,
    telefone,
    horario_funcionamento,
    latitude: lat,
    longitude: lng,
    fonte_dados
  };
}

// Serviço de Sincronização em Segundo Plano (Worker/Cron)
export async function sincronizarEquipamentosCKAN(pool: Pool): Promise<void> {
  console.log('[CKAN Sync] Iniciando sincronização com API do Recife em segundo plano...');
  const equipamentos: EquipamentoPublico[] = [];
  const idsProcessados = new Set<string>();

  let seedData: EquipamentoPublico[] = [];
  try {
    const seedPath = path.join(__dirname, '../data/seedEquipamentos.json');
    if (fs.existsSync(seedPath)) {
      const raw = fs.readFileSync(seedPath, 'utf8');
      seedData = JSON.parse(raw);
    }
  } catch(e) {
    console.error('[CKAN Sync] Erro ao ler seedEquipamentos.json:', e);
  }

  for (const tc of TERMOS_CATEGORIAS) {
    const termo = tc.termo;
    const categoriaDaBusca = tc.categoria;
    try {
      const urlPkg = `https://dados.recife.pe.gov.br/api/3/action/package_search?q=${encodeURIComponent(termo)}`;
      const resPkg = await fetch(urlPkg);
      if (!resPkg.ok) continue;

      const dataPkg = (await resPkg.json()) as { result?: { results?: Array<{ resources?: Array<{ id?: string; format?: string; datastore_active?: boolean }> }> } };
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

            const dataRecords = (await resData.json()) as { result?: { records?: Array<Record<string, unknown>> } };
            const records = dataRecords?.result?.records;
            if (!Array.isArray(records)) continue;

            for (let i = 0; i < records.length; i++) {
              const eq = normalizarRegistroCKAN(records[i], categoriaDaBusca, resId, i);
              if (eq) {
                equipamentos.push(eq);
              }
            }
          } catch (e) {
            console.warn(`[CKAN Sync] Erro ao ler resource ${resId}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn(`[CKAN Sync] Erro ao buscar pacotes para o termo '${termo}':`, e);
    }
  }

  if (equipamentos.length === 0 && seedData.length === 0) {
    console.log('[CKAN Sync] Nenhum registro retornado da API ou serviço indisponível no momento.');
    return;
  }

  equipamentos.push(...seedData);

  const deduplicados = equipamentos.reduce((acc, current) => {
    const existe = acc.find(item => 
      (Math.abs(item.latitude - current.latitude) < 0.0001 && Math.abs(item.longitude - current.longitude) < 0.0001) ||
      (item.nome.toLowerCase().trim() === current.nome.toLowerCase().trim())
    );
    if (!existe) {
      acc.push(current);
    } else {
      if (current.id.startsWith('seed_') && !existe.id.startsWith('seed_')) {
        const idx = acc.indexOf(existe);
        acc[idx] = current;
      }
    }
    return acc;
  }, [] as EquipamentoPublico[]);

  console.log(`[CKAN Sync] ${deduplicados.length} registros (após deduplicação). Executando Upsert no banco de dados...`);

  for (const eq of deduplicados) {
    try {
      await pool.query(
        `INSERT INTO equipamentos_publicos (id, nome, categoria, endereco, bairro, telefone, horario_funcionamento, latitude, longitude, fonte_dados)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           nome = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.nome ELSE EXCLUDED.nome END,
           categoria = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.categoria ELSE EXCLUDED.categoria END,
           endereco = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.endereco ELSE EXCLUDED.endereco END,
           bairro = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.bairro ELSE EXCLUDED.bairro END,
           telefone = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.telefone ELSE EXCLUDED.telefone END,
           horario_funcionamento = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.horario_funcionamento ELSE EXCLUDED.horario_funcionamento END,
           latitude = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.latitude ELSE EXCLUDED.latitude END,
           longitude = CASE WHEN equipamentos_publicos.verificado_manualmente = true THEN equipamentos_publicos.longitude ELSE EXCLUDED.longitude END,
           fonte_dados = EXCLUDED.fonte_dados,
           atualizado_em = now()`,
        [eq.id, eq.nome, eq.categoria, eq.endereco, eq.bairro, eq.telefone, eq.horario_funcionamento, eq.latitude, eq.longitude, eq.fonte_dados]
      );
    } catch (e) {
      console.error(`[CKAN Sync] Erro ao salvar equipamento ${eq.id}:`, e);
    }
  }

  console.log(`[CKAN Sync] Sincronização concluída com sucesso. Total de registros salvos/atualizados: ${equipamentos.length}`);
}
