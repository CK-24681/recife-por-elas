import { Pool } from 'pg';
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
  verificado_manualmente?: boolean;
}

export async function sincronizarEquipamentosSeed(pool: Pool): Promise<void> {
  console.log('[Seed Sync] Iniciando sincronização manual de equipamentos locais...');

  const seedPath = path.join(__dirname, '..', 'data', 'seedEquipamentos.json');
  let seedData: EquipamentoPublico[] = [];

  try {
    if (fs.existsSync(seedPath)) {
      const raw = fs.readFileSync(seedPath, 'utf-8');
      seedData = JSON.parse(raw) as EquipamentoPublico[];
      console.log(`[Seed Sync] Carregados ${seedData.length} equipamentos do seed local.`);
    } else {
      console.warn('[Seed Sync] Arquivo seedEquipamentos.json não encontrado. Abortando.');
      return;
    }
  } catch (err) {
    console.error('[Seed Sync] Erro ao ler seedEquipamentos.json:', err);
    return;
  }

  // 2. Upsert no banco de dados
  let upsertados = 0;
  for (const eq of seedData) {
    try {
      await pool.query(
        `INSERT INTO equipamentos_locais (id, nome, categoria, endereco, bairro, telefone, horario_funcionamento, latitude, longitude, fonte_dados, verificado_manualmente)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
           verificado_manualmente = EXCLUDED.verificado_manualmente,
           atualizado_em = now()`,
        [eq.id, eq.nome, eq.categoria, eq.endereco, eq.bairro, eq.telefone, eq.horario_funcionamento, eq.latitude, eq.longitude, eq.fonte_dados, true]
      );
      upsertados++;
    } catch (err) {
      console.error(`[Seed Sync] Erro ao salvar equipamento ${eq.id}:`, err);
    }
  }

  console.log(`[Seed Sync] Finalizado! ${upsertados} registros sincronizados a partir da curadoria manual.`);
}
