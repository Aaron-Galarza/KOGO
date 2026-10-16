// ============================================================
// Cliente HTTP de Google Geocoding API (dirección -> coordenadas).
//
// SEGURIDAD:
//  - La API key se lee de variables de entorno y NUNCA se devuelve al cliente
//    ni se loguea. Todas las llamadas salen desde el backend.
//  - Los parámetros se envían acotados: país AR, idioma es, sesgo geográfico
//    (bounds) y timeout corto.
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

function getApiKey(): string | null {
  return process.env.GOOGLE_GEOCODING_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

/** Traduce el estado de Google a un error propio con mensaje entendible. */
function mapGoogleStatus(status: string): AppError | null {
  switch (status) {
    case 'ZERO_RESULTS':
      return null; // no es un error: no hay coincidencias
    case 'OVER_QUERY_LIMIT':
    case 'OVER_DAILY_LIMIT':
      return new AppError('La búsqueda de direcciones está saturada. Probá en unos minutos.', 503);
    case 'REQUEST_DENIED':
      return new AppError(
        'La búsqueda de direcciones no está habilitada en el servidor. Escribí la dirección a mano.',
        503
      );
    case 'INVALID_REQUEST':
      return new AppError('La dirección buscada no es válida', 400);
    default:
      return new AppError('No pudimos buscar la dirección en este momento.', 502);
  }
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
      timeout: 8000,
    });

    const error = mapGoogleStatus(String(data?.status ?? ''));
    if (error) throw error;
    if (!Array.isArray(data?.results)) return [];

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
  },
};
