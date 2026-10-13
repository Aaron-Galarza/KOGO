import { z } from 'zod';

export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  image: z.string().url().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  active: z.boolean().default(true),
  controlStock: z.boolean().default(false),
  stock: z.number().min(0).default(0),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
