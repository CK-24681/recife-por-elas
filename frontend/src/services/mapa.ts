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

// Fallback rico e limpo para testes/ambiente offline
const MOCK_CRAWLER_FALLBACK: PontoNormalizado[] = [
  { id: 'mulher_1', categoria: 'mulher', nome: 'Hospital da Mulher do Recife (Dra. Mercês Pontes)', lat: -8.0772, lng: -34.9608, latitude: -8.0772, longitude: -34.9608, endereco: 'BR-101, s/n - Curado' },
  { id: 'mulher_2', categoria: 'mulher', nome: 'Centro de Referência Clarice Lispector', lat: -8.0545, lng: -34.8845, latitude: -8.0545, longitude: -34.8845, endereco: 'Rua Pedro Augusto, 16 - Santo Amaro' },
  { id: 'mulher_3', categoria: 'mulher', nome: '1ª Delegacia da Mulher (Santo Amaro)', lat: -8.0512, lng: -34.8814, latitude: -8.0512, longitude: -34.8814, endereco: 'Praça do Campo Santo, s/n' },
  { id: 'compaz_1', categoria: 'compaz', nome: 'Compaz Eduardo Campos', lat: -8.0128, lng: -34.8965, latitude: -8.0128, longitude: -34.8965, endereco: 'Av. Aníbal Benévolo, s/n - Alto Santa Terezinha' },
  { id: 'compaz_2', categoria: 'compaz', nome: 'Compaz Ariano Suassuna', lat: -8.0560, lng: -34.9215, latitude: -8.0560, longitude: -34.9215, endereco: 'Av. General San Martin, 1208 - Cordeiro' },
  { id: 'compaz_3', categoria: 'compaz', nome: 'Compaz Miguel Arraes', lat: -8.0525, lng: -34.9080, latitude: -8.0525, longitude: -34.9080, endereco: 'Av. Caxangá, 653 - Madalena' },
  { id: 'creche_1', categoria: 'creche', nome: 'CMEI Prof. Paulo Rosas', lat: -8.0522, lng: -34.9490, latitude: -8.0522, longitude: -34.9490, endereco: 'Cidade Universitária' },
  { id: 'creche_2', categoria: 'creche', nome: 'Creche Municipal Casa Amarela', lat: -8.0233, lng: -34.9178, latitude: -8.0233, longitude: -34.9178, endereco: 'Casa Amarela' },
  { id: 'escola_1', categoria: 'escola', nome: 'Escola Profissionalizante Dom Bosco', lat: -8.1380, lng: -34.9090, latitude: -8.1380, longitude: -34.9090, endereco: 'Boa Viagem' },
  { id: 'escola_2', categoria: 'escola', nome: 'Escola Profissional Zuleide Pinto', lat: -8.0195, lng: -34.9350, latitude: -8.0195, longitude: -34.9350, endereco: 'Apipucos' },
  { id: 'oficina_1', categoria: 'oficina', nome: 'Associação de Mulheres do Ibura', lat: -8.1210, lng: -34.9310, latitude: -8.1210, longitude: -34.9310, endereco: 'Ibura' },
  { id: 'oficina_2', categoria: 'oficina', nome: 'Bordadeiras de Casa Amarela', lat: -8.0245, lng: -34.9160, latitude: -8.0245, longitude: -34.9160, endereco: 'Casa Amarela' },
];

// Busca os equipamentos públicos sincronizados no banco de dados via API local /api/equipamentos
export async function buscarEquipamentosBackend(): Promise<PontoNormalizado[]> {
  try {
    const res = await fetch(`${BASE}/equipamentos`);
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
    console.warn('Erro ao buscar equipamentos via API backend, utilizando fallback:', err);
  }
  return MOCK_CRAWLER_FALLBACK;
}

export const executarCrawlerCKAN = buscarEquipamentosBackend;
