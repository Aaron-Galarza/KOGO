import apiClient from './api';
import { GeocodePlace } from '@/types';

// ============================================================
// Búsqueda de direcciones.
//
// La consulta la resuelve el BACKEND contra Google Geocoding (con caché y tope
// mensual): la API key nunca llega al navegador y una dirección repetida no
// vuelve a gastar cuota.
// ============================================================

const inFlight = new Map<string, Promise<GeocodePlace[]>>();

export const geocodingService = {
  search: (query: string, signal?: AbortSignal): Promise<GeocodePlace[]> => {
    const key = query.trim().toLowerCase();
    const existing = inFlight.get(key);
    if (existing) return existing;

    const request = apiClient
      .get('/geocoding/search', { params: { q: query }, signal })
      .then((r) => (r.data.data?.results ?? []) as GeocodePlace[])
      .finally(() => inFlight.delete(key));

    inFlight.set(key, request);
    return request;
  },
};
