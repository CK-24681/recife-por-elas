// Revela elementos com a classe .surgir quando entram na viewport.
// PROGRESSIVO: o CSS só esconde os .surgir depois que este módulo "arma"
// (classe revelar-armado no <html>) — sem JS/observer, tudo fica visível.
// O cardápio de animações injetado pelo agente define os estilos; aqui só
// existe a mecânica. Respeita prefers-reduced-motion (o CSS desliga lá).
export function iniciarRevelar() {
  if (typeof IntersectionObserver === 'undefined') return;
  document.documentElement.classList.add('revelar-armado');
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          e.target.classList.add('visivel');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );
  const observar = () =>
    document.querySelectorAll('.surgir:not(.visivel)').forEach((el) => io.observe(el));
  observar();
  // O React renderiza (e re-renderiza) depois: observa o DOM pra armar os novos.
  new MutationObserver(observar).observe(document.body, { childList: true, subtree: true });
}
