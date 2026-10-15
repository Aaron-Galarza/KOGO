import { z } from 'zod';
import { PRODUCT_TYPES } from '../../constants';

const ProductGroupAssociationSchema = z.object({
  grupo: z.string().min(1, 'El grupo de opciones es requerido'),
  orden: z.number().default(0),
  obligatorio: z.boolean().nullable().optional(),
  minimo: z.number().int().min(0, 'El mínimo no puede ser negativo').nullable().optional(),
  maximo: z.number().int().min(1, 'El máximo debe ser al menos 1').nullable().optional(),
  ingredientes: z.array(z.string()).optional().default([]),
});

export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().min(1, 'La categoría es requerida'),
  active: z.boolean().default(true),
  controlStock: z.boolean().default(false),
  stock: z.number().min(0).default(0),
  tipoProducto: z.enum(PRODUCT_TYPES).default('simple'),
  order: z.number().default(0),
  gruposOpciones: z.array(ProductGroupAssociationSchema).optional().default([]),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductGroupAssociationInput = z.infer<typeof ProductGroupAssociationSchema>;
