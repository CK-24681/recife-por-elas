// Service worker da base Alfaia.
// Estratégia que NÃO trava em versão velha:
//   • HTML / navegação  -> network-first (sempre pega o index.html novo, que aponta pros assets novos)
//   • assets com hash (/assets/...) -> cache-first (o nome muda a cada build, então é seguro/imutável)
//   • /api -> sempre rede
// Suba a versão do CACHE ao mudar a estratégia.
const CACHE = 'projeto-base-v2';

self.addEventListener('install', () => {
  // ativa o SW novo IMEDIATAMENTE (não espera abas antigas fecharem)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return; // API sempre da rede

  // Navegação / documento -> network-first (garante a versão nova na hora)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Demais GETs (assets com hash) -> cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch((err) => {
            console.error('[SW] Erro no fetch:', err);
            // Retorna um response dummy para não quebrar a Promise do worker
            return new Response('Offline ou bloqueado', { status: 503 });
          }),
    ),
  );
});
