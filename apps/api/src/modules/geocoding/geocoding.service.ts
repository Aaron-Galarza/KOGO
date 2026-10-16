// ============================================================
// Geocodificación (búsqueda de direcciones) con control de gasto.
//
// Estrategia para no quemar la capa gratuita de Google:
//  1. Caché en memoria por consulta normalizada (30 días): repetir la misma
//     búsqueda no cuesta ni una llamada.
//  2. Tope mensual de consultas pagas; al alcanzarlo se deja de llamar a Google
//     y se responde con lo cacheado o con un aviso (nunca se sigue gastando).
//  3. El endpoint está detrás de un rate limit por IP.
// ============================================================

import { GEOCODE_CACHE_MAX_ENTRIES, GEOCODE_CACHE_TTL_MS, GEOCODE_MONTHLY_CAP } from '../../constants';
import { AppError } from '../../utils/appError';
import { MonthlyCounter, TtlCache } from '../../utils/ttlCache';
import { GeocodePlace, GoogleGeocodingClient } from './googleGeocoding.client';

const cache = new TtlCache<GeocodePlace[]>(GEOCODE_CACHE_TTL_MS, GEOCODE_CACHE_MAX_ENTRIES);
const counter = new MonthlyCounter(GEOCODE_MONTHLY_CAP);

/** Normaliza la consulta para que variantes equivalentes compartan caché. */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface GeocodingSearchResult {
  results: GeocodePlace[];
  cached: boolean;
}

export const GeocodingService = {
  isConfigured(): boolean {
    return GoogleGeocodingClient.isConfigured();
  },

  async search(rawQuery: string): Promise<GeocodingSearchResult> {
    const query = String(rawQuery ?? '').trim().slice(0, 160);
    if (query.length < 4) {
      throw new AppError('Escribí al menos 4 caracteres para buscar la dirección', 400);
    }

    const key = normalizeQuery(query);
    const cached = cache.get(key);
    if (cached) return { results: cached, cached: true };

    if (!counter.canConsume()) {
      throw new AppError(
        'Se alcanzó el límite de búsquedas de direcciones por hoy. Podés escribirla a mano y te la confirmamos por WhatsApp.',
        503
      );
    }

    counter.consume();
    try {
      const results = await GoogleGeocodingClient.search(query);
      cache.set(key, results);
      return { results, cached: false };
    } catch (error) {
      // Si la llamada no sirvió, no se descuenta del tope mensual.
      counter.refund();
      throw error;
    }
  },

  getUsage(): { count: number; limit: number; capped: boolean; cacheSize: number } {
    return { ...counter.snapshot(), cacheSize: cache.size };
  },
};
