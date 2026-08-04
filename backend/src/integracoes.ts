// Integrações com APIs públicas para alimentar o Feed de Oportunidades.
// Cada integração é assíncrona e falha isoladamente (nunca derruba as outras).
// APIs sem credencial configurada são silenciosamente ignoradas (best-effort).

export interface OportunidadeExterna {
  titulo: string;
  descricao: string;
  empresa: string;
  tipo: 'Emprego' | 'Curso' | 'Benefício social' | 'Microcrédito';
  fonte: string;
  link_inscricao: string;
  bairro: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  horario: string;
  data_inicio_inscricao: string;
  data_fim_inscricao: string;
}

// ─── Helpers ───

function criarSinalTimeout(ms: number): { signal: AbortSignal; limpar: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, limpar: () => clearTimeout(id) };
}

async function fetchJSON(url: string, headers?: Record<string, string>): Promise<any> {
  const { signal, limpar } = criarSinalTimeout(8_000);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', ...headers },
      signal,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    return null;
  } finally {
    limpar();
  }
}

// fetchComTimeout — raw fetch com timeout (usado para endpoints OAuth que não
// passam pelo fetchJSON). Retorna null em qualquer erro.
async function fetchComTimeout(url: string, opts: RequestInit = {}): Promise<Response | null> {
  const { signal, limpar } = criarSinalTimeout(8_000);
  try {
    return await fetch(url, { ...opts, signal });
  } catch {
    return null;
  } finally {
    limpar();
  }
}

// ─── ARBEITNOW (vagas remotas/flexíveis — aberto, sem chave) ───

async function buscarArbeitnow(): Promise<OportunidadeExterna[]> {
  const data = await fetchJSON('https://www.arbeitnow.com/api/job-board-api');
  if (!data) return [];
  const vagas: any[] = data?.data || [];
  return vagas.slice(0, 20).map((v: any) => ({
    titulo: String(v.title || 'Vaga de trabalho').slice(0, 200),
    descricao: String(v.description || '').replace(/<[^>]*>/g, '').slice(0, 1000),
    empresa: String(v.company_name || '').slice(0, 200),
    tipo: 'Emprego' as const,
    fonte: 'Arbeitnow',
    link_inscricao: String(v.url || ''),
    bairro: 'Remoto',
    endereco: String(v.location || 'Trabalho remoto'),
    latitude: null,
    longitude: null,
    horario: 'Flexível',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }));
}

// ─── REMOTIVE (vagas 100% remotas — aberto, público) ───

async function buscarRemotive(): Promise<OportunidadeExterna[]> {
  const data = await fetchJSON('https://remotive.com/api/remote-jobs');
  if (!data) return [];
  const vagas: any[] = data?.jobs || [];
  return vagas.slice(0, 20).map((v: any) => ({
    titulo: String(v.title || 'Vaga remota').slice(0, 200),
    descricao: String(v.description || '').replace(/<[^>]*>/g, '').slice(0, 1000),
    empresa: String(v.company_name || '').slice(0, 200),
    tipo: 'Emprego' as const,
    fonte: 'Remotive',
    link_inscricao: String(v.url || ''),
    bairro: 'Remoto',
    endereco: String(v.candidate_required_location || 'Trabalho 100% remoto'),
    latitude: null,
    longitude: null,
    horario: 'Flexível',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }));
}

// ─── ADZUNA (busca geolocalizada — App ID + App Key via env) ───

async function buscarAdzuna(): Promise<OportunidadeExterna[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const data = await fetchJSON(
    `https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=${appId}&app_key=${appKey}&where=Recife&results_per_page=12&what=mulher%20OR%20auxiliar%20OR%20operacional`
  );
  if (!data) return [];
  const vagas: any[] = data?.results || [];
  return vagas.map((v: any) => ({
    titulo: String(v.title || 'Vaga').slice(0, 200),
    descricao: String(v.description || '').slice(0, 1000),
    empresa: String(v.company?.display_name || '').slice(0, 200),
    tipo: 'Emprego' as const,
    fonte: 'Adzuna',
    link_inscricao: String(v.redirect_url || ''),
    bairro: String(v.location?.area?.[2] || v.location?.area?.[1] || 'Recife'),
    endereco: String(v.location?.display_name || ''),
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    horario: v.contract_time === 'part_time' ? 'Meio período' : 'Horário comercial',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }));
}

// ─── THE MUSE (vagas por localização — X-Muse-Api-Key via env) ───

async function buscarTheMuse(): Promise<OportunidadeExterna[]> {
  const apiKey = process.env.THE_MUSE_API_KEY;
  if (!apiKey) return [];

  const data = await fetchJSON(
    'https://www.themuse.com/api/public/v2/jobs?location=Brazil&page=0&descending=true',
    { 'X-Muse-Api-Key': apiKey }
  );
  if (!data) return [];
  const vagas: any[] = data?.results || [];
  return vagas.slice(0, 20).map((v: any) => ({
    titulo: String(v.name || 'Vaga').slice(0, 200),
    descricao: (v.contents || '').replace(/<[^>]*>/g, '').slice(0, 1000),
    empresa: String(v.company?.name || '').slice(0, 200),
    tipo: 'Emprego' as const,
    fonte: 'The Muse',
    link_inscricao: String(v.refs?.landing_page || ''),
    bairro: 'Internacional',
    endereco: (v.locations || []).map((l: any) => l.name).join(', ') || 'Brasil',
    latitude: null,
    longitude: null,
    horario: 'A consultar',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }));
}

// ─── EV.G (ENAP — aberto, público) ───

async function buscarEVG(): Promise<OportunidadeExterna[]> {
  const data = await fetchJSON('https://emnumeros.escolavirtual.gov.br/api/v1/cursos?page=1&page_size=12');
  if (!data) return [];
  const cursos: any[] = data?.results || data?.data || [];
  const lista = Array.isArray(cursos) ? cursos : [];
  return lista.slice(0, 20).map((c: any) => ({
    titulo: String(c.titulo || c.nome || c.name || 'Curso gratuito').slice(0, 200),
    descricao: String(c.descricao || c.ementa || c.description || 'Capacitação gratuita oferecida pela Escola Virtual de Governo.').slice(0, 1000),
    empresa: 'ENAP — Escola Nacional de Administração Pública',
    tipo: 'Curso' as const,
    fonte: 'EV.G (ENAP)',
    link_inscricao: String(c.link || c.url || `https://www.escolavirtual.gov.br/curso/${c.id || ''}`),
    bairro: 'Online',
    endereco: 'Plataforma EV.G — Escola Virtual de Governo',
    latitude: null,
    longitude: null,
    horario: 'Livre (EAD)',
    data_inicio_inscricao: new Date().toISOString().slice(0, 10),
    data_fim_inscricao: '',
  }));
}

// ─── DATASUS / CNES (postos de saúde — aberto, público) ───

async function buscarDATASUS(): Promise<OportunidadeExterna[]> {
  // CNES — estabelecimentos de saúde em Recife (PE = 26)
  // Usamos o endpoint de estabelecimentos por município via PostgREST do DATASUS
  try {
    const data = await fetchJSON(
      'https://servicos-datasus.saude.gov.br/rest/cnes/estabelecimentos?municipio=2611606&limit=12'
    );
    if (!data) return [];
    const estabs: any[] = data || [];
    return estabs.slice(0, 20).map((e: any) => ({
      titulo: String(e.nome_fantasia || e.razao_social || 'Posto de saúde'),
      descricao: `Tipo: ${e.tipo_unidade || 'Unidade de saúde'} — ${e.descricao_turno_atendimento || 'Atendimento à população'}. Telefone: ${e.telefone || 'não informado'}.`,
      empresa: 'DATASUS / CNES — Ministério da Saúde',
      tipo: 'Benefício social' as const,
      fonte: 'DATASUS / CNES',
      link_inscricao: '',
      bairro: String(e.bairro || e.logradouro || 'Recife'),
      endereco: `${e.logradouro || ''}, ${e.numero || ''} — ${e.bairro || ''}, Recife - PE`.trim().replace(/^, /, ''),
      latitude: e.latitude ? Number(e.latitude) : null,
      longitude: e.longitude ? Number(e.longitude) : null,
      horario: String(e.descricao_turno_atendimento || 'A consultar'),
      data_inicio_inscricao: '',
      data_fim_inscricao: '',
    }));
  } catch {
    return []; // endpoint do DATASUS pode variar — falha silenciosa
  }
}

// ─── PORTAL DA TRANSPARÊNCIA — BOLSA FAMÍLIA (token via env) ───

async function buscarBolsaFamilia(): Promise<OportunidadeExterna[]> {
  const token = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!token) return [];

  try {
    const data = await fetchJSON(
      'https://api.portaldatransparencia.gov.br/api-de-dados/novo-bolsa-familia-por-municipio?codigoIbge=2611606&mesAno=202607&pagina=1',
      { 'chave-api-dados': token }
    );
    if (!data) return [];
    return [{
      titulo: 'Bolsa Família — Auxílio mensal disponível',
      descricao: 'O programa Bolsa Família está ativo no Recife. Verifique sua elegibilidade pelo CadÚnico e mantenha seu cadastro atualizado. O benefício é pago mensalmente conforme a composição familiar.',
      empresa: 'Governo Federal — MDS',
      tipo: 'Benefício social' as const,
      fonte: 'Portal da Transparência (CGU)',
      link_inscricao: 'https://www.gov.br/cidadania/pt-br/acoes-e-programas/bolsa-familia',
      bairro: 'Recife',
      endereco: 'Centro de Referência de Assistência Social (CRAS) mais próximo',
      latitude: null,
      longitude: null,
      horario: 'Consulte o CRAS do seu bairro',
      data_inicio_inscricao: new Date().toISOString().slice(0, 10),
      data_fim_inscricao: '',
    }];
  } catch {
    return [];
  }
}

// ─── PORTAL DA TRANSPARÊNCIA — BPC (token via env) ───

async function buscarBPC(): Promise<OportunidadeExterna[]> {
  const token = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!token) return [];

  try {
    await fetchJSON(
      'https://api.portaldatransparencia.gov.br/api-de-dados/bpc-por-cpf-ou-nis?cpfOuNis=00000000000&pagina=1',
      { 'chave-api-dados': token }
    );
    // O endpoint requer CPF/NIS individual — para o feed, listamos o programa como oportunidade
    return [{
      titulo: 'BPC — Benefício de Prestação Continuada',
      descricao: 'O BPC garante um salário mínimo mensal ao idoso com 65 anos ou mais e à pessoa com deficiência de qualquer idade que comprovem não possuir meios de prover a própria manutenção. A renda familiar per capita deve ser inferior a 1/4 do salário mínimo. Procure o CRAS do seu bairro para orientação.',
      empresa: 'Governo Federal — INSS / MDS',
      tipo: 'Benefício social' as const,
      fonte: 'Portal da Transparência (CGU)',
      link_inscricao: 'https://www.gov.br/inss/pt-br/assuntos/beneficio-assistencial-bpc',
      bairro: 'Recife',
      endereco: 'CRAS ou Agência do INSS mais próxima',
      latitude: null,
      longitude: null,
      horario: 'Consulte o CRAS do seu bairro',
      data_inicio_inscricao: new Date().toISOString().slice(0, 10),
      data_fim_inscricao: '',
    }];
  } catch {
    return [];
  }
}

// ─── PORTAL DA TRANSPARÊNCIA — PETI (token via env) ───

async function buscarPETI(): Promise<OportunidadeExterna[]> {
  const token = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!token) return [];

  try {
    await fetchJSON(
      'https://api.portaldatransparencia.gov.br/api-de-dados/peti-por-cpf-ou-nis?cpfOuNis=00000000000&pagina=1',
      { 'chave-api-dados': token }
    );
    return [{
      titulo: 'PETI — Programa de Erradicação do Trabalho Infantil',
      descricao: 'O PETI atua na prevenção e erradicação do trabalho infantil, com ações de proteção social e transferência de renda para famílias em situação de vulnerabilidade com crianças e adolescentes em risco de trabalho precoce. Inclui atividades no contraturno escolar (jornada ampliada).',
      empresa: 'Governo Federal — MDS',
      tipo: 'Benefício social' as const,
      fonte: 'Portal da Transparência (CGU)',
      link_inscricao: 'https://www.gov.br/cidadania/pt-br/acoes-e-programas/assistencia-social/protecao-social-especial/peti',
      bairro: 'Recife',
      endereco: 'CRAS ou CREAS mais próximo',
      latitude: null,
      longitude: null,
      horario: 'Consulte o CRAS do seu bairro',
      data_inicio_inscricao: new Date().toISOString().slice(0, 10),
      data_fim_inscricao: '',
    }];
  } catch {
    return [];
  }
}

// ─── EDX / OPEN EDX (cursos — JWT/OAuth via env) ───

async function buscarEdX(): Promise<OportunidadeExterna[]> {
  const clientId = process.env.EDX_CLIENT_ID;
  const clientSecret = process.env.EDX_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  try {
    // OAuth 2.0 client credentials
    const tokenRes = await fetchComTimeout('https://api.edx.org/oauth2/v1/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&token_type=jwt`,
    });
    if (!tokenRes || !tokenRes.ok) return [];
    const tokenData = await tokenRes.json().catch(() => null);
    if (!tokenData?.access_token) return [];
    const accessToken = tokenData.access_token;

    const data = await fetchJSON(
      'https://discovery.edx.org/api/v1/catalogs/1/courses/?page_size=12&status=published',
      { 'Authorization': `JWT ${accessToken}` }
    );
    if (!data) return [];
    const cursos: any[] = data?.results || [];
    return cursos.map((c: any) => ({
      titulo: String(c.title || 'Curso edX').slice(0, 200),
      descricao: String(c.full_description || c.short_description || 'Curso oferecido pela plataforma edX com certificado.').slice(0, 1000),
      empresa: String((c.owners || [])[0]?.name || 'edX').slice(0, 200),
      tipo: 'Curso' as const,
      fonte: 'edX',
      link_inscricao: String(c.marketing_url || c.url || ''),
      bairro: 'Online',
      endereco: 'Plataforma edX — cursos livres de universidades globais',
      latitude: null,
      longitude: null,
      horario: 'Livre (EAD)',
      data_inicio_inscricao: c.enrollment_start ? String(c.enrollment_start).slice(0, 10) : new Date().toISOString().slice(0, 10),
      data_fim_inscricao: c.enrollment_end ? String(c.enrollment_end).slice(0, 10) : '',
    }));
  } catch {
    return [];
  }
}

// ─── COURSERA (cursos — OAuth 2.0 Bearer via env) ───

async function buscarCoursera(): Promise<OportunidadeExterna[]> {
  const clientId = process.env.COURSERA_CLIENT_ID;
  const clientSecret = process.env.COURSERA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  try {
    // OAuth 2.0 client credentials
    const tokenRes = await fetchComTimeout('https://api.coursera.org/oauth2/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
    });
    if (!tokenRes || !tokenRes.ok) return [];
    const tokenData = await tokenRes.json().catch(() => null);
    if (!tokenData?.access_token) return [];
    const accessToken = tokenData.access_token;

    const data = await fetchJSON(
      'https://api.coursera.org/api/courses.v1?fields=name,description,slug,partnerIds,primaryLanguages&limit=12',
      { 'Authorization': `Bearer ${accessToken}` }
    );
    if (!data) return [];
    const cursos: any[] = data?.elements || [];
    return cursos.map((c: any) => ({
      titulo: String(c.name || 'Curso Coursera').slice(0, 200),
      descricao: String(c.description || 'Curso oferecido pela plataforma Coursera com certificado de universidades e empresas parceiras.').slice(0, 1000),
      empresa: String(c.partnerName || 'Coursera').slice(0, 200),
      tipo: 'Curso' as const,
      fonte: 'Coursera',
      link_inscricao: `https://www.coursera.org/learn/${c.slug || ''}`,
      bairro: 'Online',
      endereco: 'Plataforma Coursera — cursos e especializações profissionais',
      latitude: null,
      longitude: null,
      horario: 'Livre (EAD)',
      data_inicio_inscricao: new Date().toISOString().slice(0, 10),
      data_fim_inscricao: '',
    }));
  } catch {
    return [];
  }
}

// ─── CADÚNICO (MDS / Conecta gov.br — validação de situação cadastral) ───
// Esta função é para validação individual, não para o feed de oportunidades.
// Exige OAuth 2.0 via Barramento Conecta Gov.

export async function validarCadUnico(cpf: string): Promise<{ valido: boolean; dados?: Record<string, unknown>; erro?: string }> {
  const clientId = process.env.CONECTA_GOV_CLIENT_ID;
  const clientSecret = process.env.CONECTA_GOV_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { valido: false, erro: 'credenciais do Conecta Gov não configuradas' };
  }
  if (!cpf || !/^\d{11}$/.test(cpf.replace(/\D/g, ''))) {
    return { valido: false, erro: 'CPF inválido' };
  }

  try {
    // OAuth 2.0 — token de acesso
    const tokenRes = await fetchComTimeout('https://sso.acesso.gov.br/auth/realms/govbr/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
    });
    if (!tokenRes || !tokenRes.ok) return { valido: false, erro: `erro na autenticação (${tokenRes?.status || 'desconhecido'})` };
    const tokenData = await tokenRes.json().catch(() => null);
    if (!tokenData?.access_token) return { valido: false, erro: 'token de acesso não obtido' };
    const accessToken = tokenData.access_token;

    const cpfLimpo = cpf.replace(/\D/g, '');
    const data = await fetchJSON(
      `https://api.conecta.gov.br/cadunico/v1/familia?cpf=${cpfLimpo}`,
      { 'Authorization': `Bearer ${accessToken}` }
    );

    return { valido: true, dados: data };
  } catch (e: any) {
    return { valido: false, erro: `erro ao consultar CadÚnico: ${e.message}` };
  }
}

// ─── AGREGADOR PRINCIPAL ───

export async function buscarOportunidadesExternas(
  filtros?: { tipo?: string; bairro?: string; horario?: string }
): Promise<OportunidadeExterna[]> {
  try {
    // Lança todas as integrações em paralelo — cada uma falha isoladamente
    const resultados = await Promise.allSettled([
      // Emprego
      buscarArbeitnow(),
      buscarRemotive(),
      buscarAdzuna(),
      buscarTheMuse(),
      // Cursos
      buscarEVG(),
      buscarEdX(),
      buscarCoursera(),
      // Benefícios
      buscarDATASUS(),
      buscarBolsaFamilia(),
      buscarBPC(),
      buscarPETI(),
    ]);

    // Achata resultados bem-sucedidos
    const todas: OportunidadeExterna[] = [];
    for (const r of resultados) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        todas.push(...r.value);
      }
    }

    // Aplica filtros (se fornecidos)
    let filtradas = todas;
    if (filtros?.tipo) {
      filtradas = filtradas.filter((o) => o.tipo === filtros.tipo);
    }
    if (filtros?.bairro) {
      const b = filtros.bairro.toLowerCase();
      filtradas = filtradas.filter(
        (o) =>
          o.bairro.toLowerCase().includes(b) ||
          o.endereco.toLowerCase().includes(b)
      );
    }
    if (filtros?.horario) {
      const h = filtros.horario.toLowerCase();
      filtradas = filtradas.filter((o) => o.horario.toLowerCase().includes(h));
    }

    // Limita a 50 resultados totais para não sobrecarregar o front
    return filtradas.slice(0, 50);
  } catch (e) {
    console.error('buscarOportunidadesExternas — erro inesperado:', e);
    return [];
  }
}
