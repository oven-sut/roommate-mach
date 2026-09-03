import { useCallback, useEffect, useRef } from 'react';

/** Delays invoking `fn` until `delay` ms after the last call, so every keystroke doesn't fire a request. */
export function useDebouncedCallback<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
