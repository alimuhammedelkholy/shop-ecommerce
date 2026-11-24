import { Signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, concat, debounceTime, map, of, switchMap } from 'rxjs';

export interface QueryState<T> {
  status: 'loading' | 'ready' | 'error';
  /** Last successful value. Kept while a new request is loading so the UI never flashes empty. */
  data: T | null;
}

/**
 * Tiny reactive data helper: re-runs `load` whenever the signals read inside `params` change,
 * cancels the previous request (switchMap) and exposes a Signal of loading / ready / error.
 * Must be called in an injection context (field initializer or constructor).
 */
export function queryFrom<P, T>(
  params: () => P,
  load: (p: P) => Observable<T>,
  options: { debounceMs?: number } = {},
): Signal<QueryState<T>> {
  let last: T | null = null;
  const p$ = toObservable(computed(params));
  const source$ = options.debounceMs ? p$.pipe(debounceTime(options.debounceMs)) : p$;

  return toSignal(
    source$.pipe(
      switchMap((p) =>
        concat(
          of<QueryState<T>>({ status: 'loading', data: last }),
          load(p).pipe(
            map((data): QueryState<T> => {
              last = data;
              return { status: 'ready', data };
            }),
            catchError(() => of<QueryState<T>>({ status: 'error', data: last })),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', data: null } as QueryState<T> },
  );
}
