import { z } from 'zod';
import { DATE_RANGES } from '../../constants';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');

export const GetStatsQuerySchema = z
  .object({
    range: z.enum(DATE_RANGES).optional(),
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
  })
  .refine((data) => !!data.range || (!!data.from && !!data.to), {
    message: "Debe indicar 'range' o el par 'from'/'to'",
  });

export type GetStatsQuery = z.infer<typeof GetStatsQuerySchema>;
