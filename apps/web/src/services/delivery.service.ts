import apiClient from './api';
import { DeliveryConfig, DeliveryQuote } from '@/types';

// ============================================================
// Envío: la distancia y el precio SIEMPRE los calcula el backend.
// Lo que devuelve este servicio es una vista previa; al crear el pedido el
// servidor recalcula el costo por su cuenta.
// ============================================================

// Deduplicación de requests en vuelo: evita repetir el cálculo cuando varios
// componentes piden el mismo par de coordenadas a la vez.
const inFlight = new Map<string, Promise<DeliveryQuote>>();

export const deliveryService = {
  calculate: (lat: number, lng: number): Promise<DeliveryQuote> => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const existing = inFlight.get(key);
    if (existing) return existing;

    const request = apiClient
      .post('/delivery/calculate', { lat, lng })
      .then((r) => r.data.data as DeliveryQuote)
      .finally(() => inFlight.delete(key));

    inFlight.set(key, request);
    return request;
  },

  /** Tabla de envío pública (rangos y lluvia) para mostrar en el checkout. */
  fetchPublicConfig: () =>
    apiClient.get('/delivery/config/public').then((r) => r.data.data as DeliveryConfig),

  // ── Admin ────────────────────────────────────────────────────────────────
  fetchConfig: () => apiClient.get('/delivery/config').then((r) => r.data.data as DeliveryConfig),

  updateConfig: (payload: { maxDeliveryKm?: number; extraRain?: number; isRaining?: boolean }) =>
    apiClient.put('/delivery/config', payload).then((r) => r.data.data as DeliveryConfig),

  updateRain: (isRaining: boolean, extraRain?: number) =>
    apiClient.patch('/delivery/config/rain', { isRaining, extraRain }).then((r) => r.data.data as DeliveryConfig),

  addRange: (maxKm: number, price: number) =>
    apiClient.post('/delivery/config/ranges', { maxKm, price }).then((r) => r.data.data as DeliveryConfig),

  deleteRange: (rangeId: string) =>
    apiClient.delete(`/delivery/config/ranges/${rangeId}`).then((r) => r.data.data as DeliveryConfig),
};
