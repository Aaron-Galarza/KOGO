// ============================================================
// Utilidades geográficas.
//
// Sin dependencias externas ni cuota: se usan como respaldo cuando la API de
// rutas de Google no está disponible, para que el envío nunca falle por una
// caída del proveedor.
// ============================================================

import { ROAD_DISTANCE_FACTOR } from '../constants';

const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Distancia en línea recta (haversine) en kilómetros. */
export function haversineKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Estimación de distancia de manejo a partir de la distancia en línea recta.
 * Es aproximada (se usa solo si Google Routes no responde) y siempre se
 * informa su origen para que la UI pueda aclararlo.
 */
export function estimateRoadKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  return haversineKm(fromLat, fromLng, toLat, toLng) * ROAD_DISTANCE_FACTOR;
}

/** Redondea a 2 decimales (evita ruido de flotantes en respuestas y precios). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clave estable para cachear por coordenadas (aprox. 100 m de resolución). */
export function coordKey(lat: number, lng: number, decimals = 3): string {
  return `${lat.toFixed(decimals)},${lng.toFixed(decimals)}`;
}
