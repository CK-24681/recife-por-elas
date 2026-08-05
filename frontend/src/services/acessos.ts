import { getToken, BASE } from './api';

// pingar registra UM pageview no backend (POST /api/acessos). Best-effort:
// telemetria nunca quebra nem atrasa o app (erros são ignorados).
function pingar(): void {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
    void fetch(`${BASE}/acessos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        caminho: location.pathname + location.search,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignora — telemetria não interfere no app */
  }
}

// rastrearAcessos registra um acesso no carregamento e a cada navegação SPA
// (intercepta history.pushState/replaceState e ouve popstate). Chamar uma vez no boot.
export function rastrearAcessos(): void {
  pingar(); // carga inicial
  const envolver =
    (orig: History['pushState']): History['pushState'] =>
      function (this: History, ...args: Parameters<History['pushState']>): void {
        orig.apply(this, args);
        pingar();
      };
  history.pushState = envolver(history.pushState);
  history.replaceState = envolver(history.replaceState);
  window.addEventListener('popstate', pingar);
}
