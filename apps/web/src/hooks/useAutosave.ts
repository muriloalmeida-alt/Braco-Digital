import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Autosave — docs/design/23-preparation-experience-spec.md §5,
 * docs/technical/20-sprint-02-tech-readiness.md §9.
 *
 * - debounce ~600ms após o usuário parar de editar;
 * - no máximo 1 requisição em voo por vez: uma edição que chega enquanto
 *   a anterior ainda está em voo fica em fila e dispara assim que ela
 *   termina (nunca em paralelo, para não ter respostas fora de ordem
 *   sobrescrevendo uma a outra);
 * - status é sempre confirmado pelo servidor (`saved` só depois da
 *   resposta 2xx) — nunca otimista;
 * - erro é explícito, com retry manual (`retry()`), nunca mascarado como
 *   sucesso nem re-tentado silenciosamente em loop.
 */
export function useAutosave<T>(save: (value: T) => Promise<unknown>, debounceMs = 600) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingValueRef = useRef<T | null>(null);
  const hasPendingRef = useRef(false);
  const lastValueRef = useRef<T | null>(null);

  const runSave = useCallback(
    async (value: T) => {
      inFlightRef.current = true;
      setStatus('saving');
      setError(null);
      try {
        await save(value);
        setStatus('saved');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Não foi possível salvar esta alteração.');
      } finally {
        inFlightRef.current = false;
        if (hasPendingRef.current) {
          const next = pendingValueRef.current as T;
          hasPendingRef.current = false;
          pendingValueRef.current = null;
          void runSave(next);
        }
      }
    },
    [save],
  );

  const trigger = useCallback(
    (value: T) => {
      lastValueRef.current = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (inFlightRef.current) {
          hasPendingRef.current = true;
          pendingValueRef.current = value;
        } else {
          void runSave(value);
        }
      }, debounceMs);
    },
    [debounceMs, runSave],
  );

  /** Força o envio imediato (ex.: ao sair do campo/etapa), sem esperar o debounce. */
  const flush = useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (inFlightRef.current) {
        hasPendingRef.current = true;
        pendingValueRef.current = value;
      } else {
        void runSave(value);
      }
    },
    [runSave],
  );

  const retry = useCallback(() => {
    if (lastValueRef.current !== null) void runSave(lastValueRef.current);
  }, [runSave]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { status, error, trigger, flush, retry };
}
