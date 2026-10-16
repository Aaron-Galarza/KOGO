// ============================================================
// Cliente HTTP de Google Geocoding API (dirección -> coordenadas).
//
// SEGURIDAD:
//  - La API key se lee de variables de entorno y NUNCA se devuelve al cliente
//    ni se loguea. Todas las llamadas salen desde el backend.
//  - Los parámetros se envían acotados: país AR, idioma es, sesgo geográfico
//    (bounds) y timeout corto.
//  - De la respuesta de Google se loguea solo el `status` y el `error_message`
//    (útil para diagnosticar; no contienen la key).
// ============================================================

import axios from 'axios';
import { GEOCODE_BOUNDS, GOOGLE_GEOCODING_API_URL } from '../../constants';
import { AppError } from '../../utils/appError';

export interface GeocodePlace {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  /** ROOFTOP | RANGE_INTERPOLATED | GEOMETRIC_CENTER | APPROXIMATE */
  locationType: string;
}

interface GoogleResponse {
  status?: string;
  error_message?: string;
  results?: any[];
}

const TIMEOUT_MS = 8000;
// Google documenta UNKNOWN_ERROR como un fallo de su lado que "puede funcionar
// si se reintenta": un único reintento corto suele resolverlo.
const RETRY_DELAY_MS = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getApiKey(): string | null {
  const raw = process.env.GOOGLE_GEOCODING_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
  // Una key pegada con comillas o espacios es un error de configuración muy común.
  return raw ? raw.trim().replace(/^["']|["']$/g, '') : null;
}

/**
 * Traduce el estado de Google a un error propio.
 * El status de Google se agrega al mensaje para poder diagnosticarlo sin acceso
 * a los logs (no es información sensible).
 */
function mapGoogleStatus(status: string, errorMessage?: string): AppError {
  const detail = errorMessage ? ` — ${errorMessage}` : '';
  switch (status) {
    case 'OVER_QUERY_LIMIT':
    case 'OVER_DAILY_LIMIT':
      return new AppError('La búsqueda de direcciones está saturada. Probá en unos minutos.', 503);
    case 'REQUEST_DENIED':
      return new AppError(
        `La búsqueda de direcciones no está habilitada en Google (revisá que la Geocoding API esté habilitada y la facturación activa)${detail}`,
        503
      );
    case 'INVALID_REQUEST':
      return new AppError('La dirección buscada no es válida', 400);
    case 'UNKNOWN_ERROR':
      return new AppError(`Google no pudo procesar la búsqueda (UNKNOWN_ERROR)${detail}`, 502);
    default:
      return new AppError(
        `Google devolvió una respuesta inesperada (${status || 'sin estado'})${detail}`,
        502
      );
  }
}

function parseResults(data: GoogleResponse): GeocodePlace[] {
  if (!Array.isArray(data.results)) return [];
  return data.results
    .map((r: any): GeocodePlace | null => {
      const lat = r?.geometry?.location?.lat;
      const lng = r?.geometry?.location?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      return {
        placeId: String(r.place_id ?? ''),
        formattedAddress: String(r.formatted_address ?? ''),
        lat,
        lng,
        locationType: String(r.geometry?.location_type ?? ''),
      };
    })
    .filter((p: GeocodePlace | null): p is GeocodePlace => p !== null);
}

async function callGoogle(query: string, key: string): Promise<GoogleResponse> {
  const bounds = `${GEOCODE_BOUNDS.south},${GEOCODE_BOUNDS.west}|${GEOCODE_BOUNDS.north},${GEOCODE_BOUNDS.east}`;

  const { data } = await axios.get(GOOGLE_GEOCODING_API_URL, {
    params: {
      address: query,
      components: 'country:AR',
      bounds,
      region: 'ar',
      language: 'es',
      key,
    },
    timeout: TIMEOUT_MS,
    headers: {
      // Un User-Agent propio identifica al servidor ante Google (axios pone el
      // suyo por defecto y algunos filtros anti-abuso castigan clientes anónimos).
      'User-Agent': 'KOGO-API/1.0 (+https://kogo-nine.vercel.app)',
      Accept: 'application/json',
    },
  });

  if (!data || typeof data !== 'object') {
    // Suele ser una página HTML de error de la infraestructura de Google.
    console.warn('[geocoding] respuesta no-JSON de Google:', String(data).slice(0, 200));
    throw new AppError('No pudimos buscar la dirección en este momento.', 502);
  }

  return data as GoogleResponse;
}

async function searchOnce(query: string, key: string): Promise<GeocodePlace[]> {
  const data = await callGoogle(query, key);
  const status = String(data.status ?? '');

  if (status === 'OK') return parseResults(data);
  if (status === 'ZERO_RESULTS') return [];

  // Se loguea el motivo real (sin la key) para poder diagnosticar en el servidor.
  console.warn(
    `[geocoding] Google respondió status=${status || 'vacío'}` +
      (data.error_message ? ` — ${data.error_message}` : '')
  );
  throw mapGoogleStatus(status, data.error_message);
}

export const GoogleGeocodingClient = {
  isConfigured(): boolean {
    return Boolean(getApiKey());
  },

  async search(query: string): Promise<GeocodePlace[]> {
    const key = getApiKey();
    if (!key) {
      throw new AppError(
        'La búsqueda de direcciones no está configurada. Escribí la dirección a mano.',
        503
      );
    }

    try {
      return await searchOnce(query, key);
    } catch (error) {
      // Reintento único ante UNKNOWN_ERROR (fallo transitorio del lado de Google).
      const retryable = error instanceof AppError && error.statusCode === 502;
      if (!retryable) throw error;

      await wait(RETRY_DELAY_MS);
      return await searchOnce(query, key);
    }
  },
};
