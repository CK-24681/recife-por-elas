import {
  useCallback,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

// Roteador mínimo por CAMINHO de URL (History API) — SEM dependência externa
// (o node_modules é compartilhado, não dá pra instalar react-router). Cada página
// tem um path REAL (/, /entrar, /sobre, /produto/123): link compartilhável, botão
// voltar do navegador e refresh funcionam — o Nginx/back já servem index.html em
// qualquer rota. Use useCaminho() pra ler a rota, navegar() pra ir por código e
// <Link to="..."> nos links. NÃO troque de página por variável de estado.

const EVENTO = 'rota:mudou';

function subscribe(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(EVENTO, cb);
  };
}

/** Troca a URL (sem recarregar) e avisa os componentes que escutam a rota. */
export function navegar(caminho: string): void {
  if (caminho === window.location.pathname) return;
  window.history.pushState({}, '', caminho);
  window.dispatchEvent(new Event(EVENTO));
  window.scrollTo(0, 0);
}

/** Pathname atual; re-renderiza quando a rota muda (popstate ou navegar()). */
export function useCaminho(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
}

/** <Link to="/sobre"> — um <a> que navega no cliente (sem reload). Respeita
 *  ctrl/cmd/clique do meio pra abrir em nova aba. */
export function Link({
  to,
  children,
  onClick,
  ...rest
}: { to: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const aoClicar = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      navegar(to);
    },
    [to, onClick],
  );
  return (
    <a href={to} onClick={aoClicar} {...rest}>
      {children}
    </a>
  );
}
