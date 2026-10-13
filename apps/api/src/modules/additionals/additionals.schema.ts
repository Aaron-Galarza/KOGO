import { z } from 'zod';

export const AdicionalCreateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  price: z.number().positive('El precio debe ser positivo'),
  categories: z.array(z.string()).optional(),
  active: z.boolean().default(true),
});

export const AdicionalUpdateSchema = AdicionalCreateSchema.partial();

export type AdicionalCreate = z.infer<typeof AdicionalCreateSchema>;
export type AdicionalUpdate = z.infer<typeof AdicionalUpdateSchema>;
