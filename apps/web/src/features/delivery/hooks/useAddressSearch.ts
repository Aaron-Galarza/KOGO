'use client';

import { useCallback, useEffect, useState } from 'react';
import { geocodingService } from '@/services/geocoding.service';
import { GeocodePlace } from '@/types';
import { getApiError } from '@/utils/apiError';

// Estrategia para no gastar cuota de Google:
//  - espera 600 ms desde la última tecla (debounce);
//  - no busca con menos de 5 caracteres;
//  - solo busca cuando el texto "parece" una dirección (tiene número) o es largo;
//  - cancela la búsqueda anterior al seguir escribiendo;
//  - no repite una búsqueda ya resuelta ni una dirección elegida de la lista.
const DEBOUNCE_MS = 600;
const MIN_CHARS = 5;
const ALWAYS_SEARCH_FROM = 12;

interface SearchEntry {
  /** Consulta exacta con la que se resolvió esta entrada. */
  query: string;
  results: GeocodePlace[];
  error: string | null;
}

export function useAddressSearch(query: string, enabled: boolean) {
  const [entry, setEntry] = useState<SearchEntry | null>(null);
  /** Dirección elegida de la lista: no se vuelve a buscar. */
  const [selected, setSelected] = useState('');

  const trimmed = query.trim();
  const longEnough = enabled && trimmed.length >= MIN_CHARS;
  const looksLikeAddress = /\d/.test(trimmed) || trimmed.length >= ALWAYS_SEARCH_FROM;
  const alreadyResolved = entry?.query === trimmed;
  const shouldSearch = longEnough && looksLikeAddress && selected !== trimmed;

  // Estado derivado: nada de setState sincrónico dentro del efecto.
  const results = alreadyResolved ? entry.results : [];
  const error = alreadyResolved ? entry.error : null;
  const loading = shouldSearch && !alreadyResolved;

  useEffect(() => {
    if (!shouldSearch || alreadyResolved) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const found = await geocodingService.search(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setEntry({ query: trimmed, results: found, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setEntry({
          query: trimmed,
          results: [],
          error: getApiError(err, 'No pudimos buscar la dirección'),
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [shouldSearch, alreadyResolved, trimmed]);

  /** Recuerda la dirección elegida para no volver a buscarla. */
  const markSelected = useCallback((address: string) => {
    setSelected(address.trim());
  }, []);

  /** Fuerza una búsqueda inmediata (botón/Enter) sin esperar el debounce. */
  const searchNow = useCallback(async (value: string) => {
    const target = value.trim();
    if (target.length < MIN_CHARS) return;
    setSelected('');
    try {
      const found = await geocodingService.search(target);
      setEntry({ query: target, results: found, error: null });
    } catch (err) {
      setEntry({ query: target, results: [], error: getApiError(err, 'No pudimos buscar la dirección') });
    }
  }, []);

  return { results, loading, error, markSelected, searchNow };
}
