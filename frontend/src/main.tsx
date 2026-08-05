import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { rastrearAcessos } from './acessos';
import { iniciarRevelar } from './revelar';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Telemetria de acessos (pageviews): registra o carregamento + cada navegação SPA.
rastrearAcessos();

// Animações de "aparecer ao rolar" (.surgir) — já armado pra qualquer tela.
iniciarRevelar();

// PWA: registra o service worker (vale em produção; em dev o Vite serve o /sw.js).
// updateViaCache: 'none' -> o browser SEMPRE busca o sw.js da rede (ignora o cache
// do Cloudflare/HTTP), então uma versão nova é detectada na hora. Quando um SW novo
// instala e já havia um controlando, recarrega pra aplicar — sem precisar limpar cache.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // ?v= versiona a URL do SW: o Cloudflare cacheia .js por 4h (e ignora nosso
    // no-cache), então sem isso uma versão nova do SW fica presa. A URL versionada
    // nunca está cacheada → o CF pega a versão fresca. Suba o número ao mudar o sw.js.
    navigator.serviceWorker
      .register('/sw.js?v=2', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {});
  });
}
