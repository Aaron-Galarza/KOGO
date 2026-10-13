import { z } from 'zod';

const ButtonTextSchema = z
  .string()
  .trim()
  .max(30, 'El texto del botón no puede superar los 30 caracteres')
  .regex(
    /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ¡!¿?.,'"()\- ]+$/,
    'El texto del botón contiene caracteres no permitidos'
  )
  .refine((value) => value.split(/\s+/).length <= 2, {
    message: 'El texto del botón no puede tener más de 2 palabras',
  })
  .or(z.literal(''))
  .optional();

export const BannerCreateSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  image: z.string().url('La imagen debe ser una URL válida'),
  order: z.number().default(0),
  active: z.boolean().default(true),
  ctaText: ButtonTextSchema,
});

export const BannerUpdateSchema = BannerCreateSchema.partial();

export type BannerCreate = z.infer<typeof BannerCreateSchema>;
export type BannerUpdate = z.infer<typeof BannerUpdateSchema>;
