// ============================================================
// Distancia real de manejo hacia el local.
//
// Proveedor primario: Google Routes API (DRIVE, sin tráfico: la variante más
// barata). Si la key no tiene la API habilitada, si hay error o si se supera el
// tope mensual, se usa una estimación local (línea recta x factor de calle):
// el envío nunca se cae por una caída del proveedor.
//
// La distancia se cachea por coordenadas (~100 m) durante 10 minutos.
// ============================================================

import axios from 'axios';
import {
  DISTANCE_CACHE_MAX_ENTRIES,
  DISTANCE_CACHE_TTL_MS,
  GOOGLE_ROUTES_API_URL,
  ROUTES_MONTHLY_CAP,
  STORE_LAT,
  STORE_LNG,
} from '../../constants';
import { coordKey, estimateRoadKm, round2 } from '../../utils/geo';
import { MonthlyCounter, TtlCache } from '../../utils/ttlCache';

export type DistanceSource = 'google' | 'estimado';

export interface DistanceResult {
  km: number;
  source: DistanceSource;
}

const cache = new TtlCache<DistanceResult>(DISTANCE_CACHE_TTL_MS, DISTANCE_CACHE_MAX_ENTRIES);
const counter = new MonthlyCounter(ROUTES_MONTHLY_CAP);

// Circuit breaker: si Google rechaza (API no habilitada, cuota, etc.) se deja de
// intentar por un rato para no insistir ni gastar tiempo en cada pedido.
let disabledUntil = 0;
const DISABLE_MS = 10 * 60 * 1000;

function getApiKey(): string | null {
  return process.env.GOOGLE_GEOCODING_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

async function googleDistanceKm(lat: number, lng: number): Promise<number | null> {
  const key = getApiKey();
  if (!key) return null;
  if (Date.now() < disabledUntil) return null;
  if (!counter.canConsume()) return null;

  counter.consume();
  try {
    const { data } = await axios.post(
      GOOGLE_ROUTES_API_URL,
      {
        origin: { location: { latLng: { latitude: STORE_LAT, longitude: STORE_LNG } } },
        destination: { location: { latLng: { latitude: lat, longitude: lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
        units: 'METRIC',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.distanceMeters',
        },
        timeout: 6000,
      }
    );

    const meters = data?.routes?.[0]?.distanceMeters;
    if (typeof meters !== 'number' || meters <= 0) return null;
    return meters / 1000;
  } catch {
    counter.refund();
    disabledUntil = Date.now() + DISABLE_MS;
    console.warn('[delivery] Google Routes no disponible: se usa distancia estimada');
    return null;
  }
}

export const DistanceService = {
  async resolve(lat: number, lng: number): Promise<DistanceResult> {
    const key = coordKey(lat, lng);
    const cached = cache.get(key);
    if (cached) return cached;

    const googleKm = await googleDistanceKm(lat, lng);
    const result: DistanceResult = googleKm
      ? { km: round2(googleKm), source: 'google' }
      : { km: round2(estimateRoadKm(STORE_LAT, STORE_LNG, lat, lng)), source: 'estimado' };

    cache.set(key, result);
    return result;
  },

  getUsage(): { count: number; limit: number; capped: boolean; cacheSize: number } {
    return { ...counter.snapshot(), cacheSize: cache.size };
  },
};
