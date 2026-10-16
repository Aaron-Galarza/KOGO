import mongoose from 'mongoose';
import { DeliveryConfigModel, IDeliveryConfig, IKmRange } from './delivery.model';
import { DistanceService, DistanceSource } from './distance.service';
import { computeDeliveryPricing } from './delivery.utils';
import { AppError } from '../../utils/appError';
import {
  AddKmRangeInput,
  UpdateDeliveryConfigInput,
  UpdateRainInput,
} from './delivery.schema';

// ============================================================
// Cálculo del envío.
//
// El precio surge SIEMPRE de la tabla de rangos guardada en la base
// (nunca de lo que mande el navegador): distancia real -> rango -> precio
// base -> + recargo por lluvia si está activo.
// ============================================================

export interface DeliveryQuote {
  distanceKm: number;
  deliveryCost: number;
  details: {
    baseCost: number;
    rainSurcharge: number;
    isRaining: boolean;
    matchedMaxKm: number | null;
    /** true si la distancia supera el último rango configurado. */
    outOfRange: boolean;
    /** false si no hay tabla configurada o si supera el radio máximo. */
    deliverable: boolean;
    maxDeliveryKm: number;
    distanceSource: DistanceSource;
    /** true si todavía no se cargaron rangos de envío en el admin. */
    configMissing: boolean;
  };
}

function plainRanges(config: IDeliveryConfig): IKmRange[] {
  return Array.from(config.kmRanges ?? [])
    .map((r) => ({ id: r.id, maxKm: r.maxKm, price: r.price }))
    .sort((a, b) => a.maxKm - b.maxKm);
}

export const DeliveryService = {
  getConfig: async (): Promise<IDeliveryConfig> => {
    return await DeliveryConfigModel.getOrCreateConfig();
  },

  /** Presupuesto de envío para unas coordenadas. */
  calculate: async (lat: number, lng: number): Promise<DeliveryQuote> => {
    const config = await DeliveryService.getConfig();
    // La distancia se mide SIEMPRE desde el punto de partida configurado.
    const distance = await DistanceService.resolve(lat, lng, {
      lat: Number(config.originLat),
      lng: Number(config.originLng),
    });

    const ranges = plainRanges(config);
    const pricing = computeDeliveryPricing({
      kmRanges: ranges,
      maxDeliveryKm: config.maxDeliveryKm,
      extraRain: Number(config.extraRain) || 0,
      isRaining: Boolean(config.isRaining),
      distanceKm: distance.km,
    });

    return {
      distanceKm: distance.km,
      deliveryCost: pricing.deliveryCost,
      details: {
        baseCost: pricing.baseCost,
        rainSurcharge: pricing.rainSurcharge,
        isRaining: Boolean(config.isRaining),
        matchedMaxKm: pricing.matchedMaxKm,
        outOfRange: pricing.outOfRange,
        deliverable: pricing.deliverable,
        maxDeliveryKm: config.maxDeliveryKm,
        distanceSource: distance.source,
        configMissing: pricing.configMissing,
      },
    };
  },

  /**
   * Igual que calculate pero sin romper el flujo del pedido: si algo falla,
   * devuelve null y el pedido se crea con envío a coordinar.
   */
  calculateSafe: async (lat: number, lng: number): Promise<DeliveryQuote | null> => {
    try {
      return await DeliveryService.calculate(lat, lng);
    } catch (error) {
      console.error('[delivery] no se pudo calcular el envío:', (error as Error).message);
      return null;
    }
  },

  // ── Configuración (admin) ────────────────────────────────────────────────
  updateConfig: async (payload: UpdateDeliveryConfigInput): Promise<IDeliveryConfig> => {
    const config = await DeliveryService.getConfig();
    if (payload.maxDeliveryKm !== undefined) config.maxDeliveryKm = payload.maxDeliveryKm;
    if (payload.extraRain !== undefined) config.extraRain = payload.extraRain;
    if (payload.isRaining !== undefined) config.isRaining = payload.isRaining;
    if (payload.originLat !== undefined) config.originLat = payload.originLat;
    if (payload.originLng !== undefined) config.originLng = payload.originLng;
    if (payload.originLabel !== undefined) config.originLabel = payload.originLabel;
    return await config.save();
  },

  setRain: async ({ isRaining, extraRain }: UpdateRainInput): Promise<IDeliveryConfig> => {
    const config = await DeliveryService.getConfig();
    config.isRaining = isRaining;
    if (extraRain !== undefined) config.extraRain = extraRain;
    return await config.save();
  },

  addRange: async ({ maxKm, price }: AddKmRangeInput): Promise<IDeliveryConfig> => {
    const config = await DeliveryService.getConfig();
    config.kmRanges.push({
      id: new mongoose.Types.ObjectId().toString(),
      maxKm,
      price,
    } as IKmRange);
    return await config.save();
  },

  deleteRange: async (rangeId: string): Promise<IDeliveryConfig> => {
    const config = await DeliveryService.getConfig();
    const before = config.kmRanges.length;
    config.kmRanges = config.kmRanges.filter((r) => r.id !== rangeId) as any;
    if (config.kmRanges.length === before) {
      throw new AppError('El rango de envío no existe', 404);
    }
    return await config.save();
  },

  /** Vista pública mínima (sin datos internos) para el checkout. */
  publicConfig: async () => {
    const config = await DeliveryService.getConfig();
    return {
      kmRanges: plainRanges(config),
      maxDeliveryKm: config.maxDeliveryKm,
      extraRain: config.extraRain,
      isRaining: config.isRaining,
    };
  },

  /** Configuración completa para el admin (incluye el punto de partida). */
  fullConfig: async () => {
    const config = await DeliveryService.getConfig();
    return {
      kmRanges: plainRanges(config),
      maxDeliveryKm: config.maxDeliveryKm,
      extraRain: config.extraRain,
      isRaining: config.isRaining,
      originLat: Number(config.originLat),
      originLng: Number(config.originLng),
      originLabel: config.originLabel || '',
    };
  },
};
