import { useEffect, useState } from "react";

/**
 * Devuelve `value` debounciado — solo se actualiza después de que pasaron
 * `delay` ms sin nuevos cambios. Útil para búsquedas: evita un re-render
 * (o una llamada a la API) por cada tecla.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
