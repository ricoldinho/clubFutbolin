import { useEffect, useState } from 'react';

/**
 * Retorna `value` retrasado `delayMs` ms tras el último cambio (útil para no saturar el API al escribir).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
