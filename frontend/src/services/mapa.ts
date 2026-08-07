import { BASE } from './api';

export interface PontoNormalizado {
  id: string;
  categoria: string;
  nome: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  endereco?: string;
  telefone?: string;
  fonte_dados?: string;
  resourceId?: string;
}

export const TERMOS_CRAWLER = ['mulher', 'compaz', 'creche', 'escola', 'oficina'];

// Busca os equipamentos públicos sincronizados no banco de dados via API local /api/mapa/locais
export async function buscarEquipamentosBackend(categorias?: string[]): Promise<PontoNormalizado[]> {
  try {
    let url = `${BASE}/mapa/locais`;
    if (categorias && categorias.length > 0) {
      const query = categorias.map(c => encodeURIComponent(c)).join(',');
      url += `?categorias=${query}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao buscar equipamentos do backend');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: Record<string, unknown>) => {
        const latNum = Number(item.latitude ?? item.lat ?? 0);
        const lngNum = Number(item.longitude ?? item.lng ?? 0);
        return {
          id: String(item.id),
          categoria: String(item.categoria || ''),
          nome: String(item.nome || ''),
          lat: latNum,
          lng: lngNum,
          latitude: latNum,
          longitude: lngNum,
          endereco: item.endereco ? String(item.endereco) : undefined,
          telefone: item.telefone ? String(item.telefone) : undefined,
          fonte_dados: item.fonte_dados ? String(item.fonte_dados) : undefined,
        };
      });
    }
  } catch (err) {
    console.warn('Erro ao buscar equipamentos via API backend:', err);
  }
  return [];
}

export const executarCrawlerCKAN = buscarEquipamentosBackend;
