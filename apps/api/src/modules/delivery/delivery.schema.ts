import { z } from 'zod';

export const CalculateDeliverySchema = z.object({
  lat: z.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida'),
  lng: z.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'),
});

export const UpdateDeliveryConfigSchema = z
  .object({
    maxDeliveryKm: z.number().min(0.5, 'El radio mínimo es 0.5 km').max(100).optional(),
    extraRain: z.number().min(0, 'El recargo no puede ser negativo').max(1_000_000).optional(),
    isRaining: z.boolean().optional(),
    originLat: z.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida').optional(),
    originLng: z.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida').optional(),
    originLabel: z.string().trim().max(160, 'La dirección es demasiado larga').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No hay cambios para aplicar' });

export const AddKmRangeSchema = z.object({
  maxKm: z.number().positive('Los km deben ser mayores a 0').max(100, 'Máximo 100 km'),
  price: z.number().min(0, 'El precio no puede ser negativo').max(10_000_000),
});

export const UpdateRainSchema = z.object({
  isRaining: z.boolean(),
  extraRain: z.number().min(0, 'El recargo no puede ser negativo').max(1_000_000).optional(),
});

export type CalculateDeliveryInput = z.infer<typeof CalculateDeliverySchema>;
export type UpdateDeliveryConfigInput = z.infer<typeof UpdateDeliveryConfigSchema>;
export type AddKmRangeInput = z.infer<typeof AddKmRangeSchema>;
export type UpdateRainInput = z.infer<typeof UpdateRainSchema>;
