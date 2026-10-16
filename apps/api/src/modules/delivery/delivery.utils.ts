// ============================================================
// Precios de envío: lógica pura (sin base de datos ni red).
//
// Se separa del servicio para poder probarla y para que el cálculo sea siempre
// determinista: distancia -> rango de km -> precio base -> + recargo por lluvia.
// ============================================================

import { round2 } from '../../utils/geo';

export interface KmRangeLike {
  maxKm: number;
  price: number;
}

export interface DeliveryPricingInput {
  kmRanges: KmRangeLike[];
  maxDeliveryKm: number;
  extraRain: number;
  isRaining: boolean;
  distanceKm: number;
}

export interface DeliveryPricing {
  deliveryCost: number;
  baseCost: number;
  rainSurcharge: number;
  /** Tope del rango que se aplicó (null si no hay rangos). */
  matchedMaxKm: number | null;
  /** true si la distancia supera el último rango configurado. */
  outOfRange: boolean;
  /** false si no hay tabla configurada o si supera el radio máximo. */
  deliverable: boolean;
  /** true si todavía no se cargaron rangos de envío en el admin. */
  configMissing: boolean;
}

export function computeDeliveryPricing(input: DeliveryPricingInput): DeliveryPricing {
  const ranges = [...(input.kmRanges ?? [])].sort((a, b) => a.maxKm - b.maxKm);
  const rainSurcharge = input.isRaining ? Math.max(0, Number(input.extraRain) || 0) : 0;

  let baseCost = 0;
  let matchedMaxKm: number | null = null;
  let outOfRange = false;

  if (ranges.length === 0) {
    // Sin tabla configurada no se inventa un precio: se coordina a mano.
    outOfRange = true;
  } else {
    const matched = ranges.find((r) => input.distanceKm <= r.maxKm);
    if (matched) {
      baseCost = matched.price;
      matchedMaxKm = matched.maxKm;
    } else {
      // Más lejos que el último rango: se cobra el último tramo y se avisa.
      outOfRange = true;
      const last = ranges[ranges.length - 1];
      baseCost = last.price;
      matchedMaxKm = last.maxKm;
    }
  }

  const configMissing = ranges.length === 0;
  const deliverable = !configMissing && input.distanceKm <= input.maxDeliveryKm;

  return {
    deliveryCost: deliverable ? round2(baseCost + rainSurcharge) : 0,
    baseCost,
    rainSurcharge,
    matchedMaxKm,
    outOfRange,
    deliverable,
    configMissing,
  };
}
