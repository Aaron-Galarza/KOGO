import { z } from 'zod';

export const CategoriaCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  order: z.number().default(0),
  active: z.boolean().default(true),
  icon: z.string().optional(),
});

export const CategoriaUpdateSchema = CategoriaCreateSchema.partial();

export type CategoriaCreate = z.infer<typeof CategoriaCreateSchema>;
export type CategoriaUpdate = z.infer<typeof CategoriaUpdateSchema>;
