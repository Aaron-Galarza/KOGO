import { z } from 'zod';

export const CouponCreateSchema = z.object({
  code: z.string().min(1, 'El código es requerido').toUpperCase(),
  discountPercent: z.number().min(1).max(100),
  active: z.boolean().default(true),
  validDays: z.array(z.string()).optional(),
  validPaymentMethods: z.array(z.string()).optional(),
});

export const CouponUpdateSchema = CouponCreateSchema.partial();

export type CouponCreate = z.infer<typeof CouponCreateSchema>;
export type CouponUpdate = z.infer<typeof CouponUpdateSchema>;
