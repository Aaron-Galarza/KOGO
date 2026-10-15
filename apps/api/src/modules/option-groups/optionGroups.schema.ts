import { z } from 'zod';
import { OPTION_GROUP_TYPES } from '../../constants';

const GroupOptionSchema = z.object({
  ingrediente: z.string().min(1, 'El ingrediente referenciado es requerido'),
  orden: z.number().default(0),
  activo: z.boolean().default(true),
  permiteCantidad: z.boolean().default(false),
  cantidadMaxima: z.number().int().min(1, 'La cantidad máxima debe ser al menos 1').default(1),
  precioEspecial: z.number().min(0, 'El precio no puede ser negativo').nullable().optional(),
});

const OptionGroupBaseSchema = z.object({
  nombre: z.string().min(1, 'El nombre del grupo es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(OPTION_GROUP_TYPES).default('unico'),
  obligatorio: z.boolean().default(false),
  minimo: z.number().int().min(0, 'El mínimo no puede ser negativo').default(0),
  maximo: z.number().int().min(1, 'El máximo debe ser al menos 1').default(1),
  activo: z.boolean().default(true),
  ingredientes: z.array(GroupOptionSchema).min(1, 'El grupo debe tener al menos un ingrediente'),
});

function refineOptionGroup(
  group: {
    tipo?: string;
    obligatorio?: boolean;
    minimo?: number;
    maximo?: number;
  },
  ctx: z.RefinementCtx
) {
  if (group.tipo === 'unico' && group.maximo !== undefined && group.maximo !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Un grupo de selección única debe tener máximo 1',
      path: ['maximo'],
    });
  }
  if (group.obligatorio && group.minimo !== undefined && group.minimo < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Un grupo obligatorio debe requerir al menos 1 ingrediente',
      path: ['minimo'],
    });
  }
  if (group.maximo !== undefined && group.minimo !== undefined && group.maximo < group.minimo) {
    ctx.addIssue({
      code: 'custom',
      message: 'El máximo no puede ser menor que el mínimo',
      path: ['maximo'],
    });
  }
}

export const OptionGroupCreateSchema = OptionGroupBaseSchema.superRefine(refineOptionGroup);
export const OptionGroupUpdateSchema = OptionGroupBaseSchema.partial().superRefine(refineOptionGroup);

export type OptionGroupCreate = z.infer<typeof OptionGroupCreateSchema>;
export type OptionGroupUpdate = z.infer<typeof OptionGroupUpdateSchema>;
