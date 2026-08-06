// Hook de toast simples — o CSS .toast-canto já existe no styles.css.
import { useState, useCallback, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  texto: ReactNode;
  tipo: 'sucesso' | 'erro';
}

let _id = 0;

export function useToast() {
  const [lista, setLista] = useState<ToastItem[]>([]);

  const push = useCallback((texto: ReactNode, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    const id = ++_id;
    setLista((prev) => [...prev, { id, texto, tipo }]);
    setTimeout(() => setLista((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  const sucesso = useCallback((texto: ReactNode) => push(texto, 'sucesso'), [push]);
  const erro = useCallback((texto: ReactNode) => push(texto, 'erro'), [push]);

  const remover = useCallback((id: number) => {
    setLista((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const container = lista.length > 0 ? (
    <div className="toast-canto" role="status" aria-live="polite">
      {lista.map((t) => (
        <div key={t.id} className={`toast-item ${t.tipo}`}>
          <span>{t.texto}</span>
          <button className="toast-fechar" onClick={() => remover(t.id)} aria-label="Fechar">&times;</button>
        </div>
      ))}
    </div>
  ) : null;

  return { sucesso, erro, container };
}
