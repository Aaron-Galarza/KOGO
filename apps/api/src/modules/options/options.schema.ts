import { z } from 'zod';

export const OptionCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre del ingrediente es requerido'),
  descripcion: z.string().optional(),
  precio: z.number().min(0, 'El precio no puede ser negativo').default(0),
  imagen: z.string().url().optional().or(z.literal('')),
  activo: z.boolean().default(true),
  disponible: z.boolean().default(true),
  orden: z.number().default(0),
});

export const OptionUpdateSchema = OptionCreateSchema.partial();

export type OptionCreate = z.infer<typeof OptionCreateSchema>;
export type OptionUpdate = z.infer<typeof OptionUpdateSchema>;
