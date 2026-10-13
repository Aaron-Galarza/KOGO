import { z } from 'zod';
import { OPTION_GROUP_TYPES } from '../../constants';

const ProductOptionSchema = z.object({
  name: z.string().min(1, 'El nombre de la opción es requerido'),
  price: z.number().min(0, 'El precio no puede ser negativo').default(0),
  active: z.boolean().default(true),
  default: z.boolean().default(false),
  allowQuantity: z.boolean().default(false),
  maxQuantity: z.number().int().min(1, 'La cantidad máxima debe ser al menos 1').default(1),
  order: z.number().default(0),
});

const ProductOptionGroupSchema = z
  .object({
    name: z.string().min(1, 'El nombre del grupo es requerido'),
    type: z.enum(OPTION_GROUP_TYPES).default('single'),
    required: z.boolean().default(false),
    min: z.number().int().min(0, 'El mínimo no puede ser negativo').default(0),
    max: z.number().int().min(1, 'El máximo debe ser al menos 1').default(1),
    options: z.array(ProductOptionSchema).min(1, 'El grupo debe tener al menos una opción'),
    order: z.number().default(0),
  })
  .superRefine((group, ctx) => {
    if (group.type === 'single' && group.max !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Un grupo de selección simple debe tener máximo 1',
        path: ['max'],
      });
    }
    if (group.required && group.min < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Un grupo obligatorio debe requerir al menos 1 opción',
        path: ['min'],
      });
    }
    if (group.max < group.min) {
      ctx.addIssue({
        code: 'custom',
        message: 'El máximo no puede ser menor que el mínimo',
        path: ['max'],
      });
    }
  });

export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  image: z.string().url().optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  active: z.boolean().default(true),
  controlStock: z.boolean().default(false),
  stock: z.number().min(0).default(0),
  optionGroups: z.array(ProductOptionGroupSchema).optional().default([]),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductOptionGroupInput = z.infer<typeof ProductOptionGroupSchema>;
