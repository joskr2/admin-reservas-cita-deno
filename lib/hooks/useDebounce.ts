import { useEffect, useState } from "preact/hooks";

/**
 * Hook personalizado para debounce de valores
 * @param value - El valor a debounce
 * @param delay - El delay en milisegundos (por defecto 300ms)
 * @returns El valor debounceddebounced
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Crear el timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timer si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce con callback
 * @param callback - Función a ejecutar después del debounce
 * @param delay - El delay en milisegundos (por defecto 300ms)
 * @returns Función debouncedcallback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300,
): T {
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Crear nuevo timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
      setTimeoutId(null);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}
