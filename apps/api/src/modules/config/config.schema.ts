import { z } from 'zod';
import { WEEKDAY_NAMES } from '../../constants';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DayScheduleSchema = z.object({
  day: z.enum(WEEKDAY_NAMES, { error: 'Día inválido' }),
  openTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
  closeTime: z.string().regex(TIME_REGEX, 'Formato de hora inválido (HH:MM)'),
  isStoreOpen: z.boolean(),
});

export const UpdateScheduleSchema = z.object({
  dailySchedule: z.array(DayScheduleSchema).min(1, 'El horario debe tener al menos un día'),
});

export const UpdateEmergencyMessageSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido'),
});

export const UpdateBannerSchema = z.object({
  banner: z.string().min(1, 'El banner es requerido'),
});

export type UpdateSchedule = z.infer<typeof UpdateScheduleSchema>;
export type UpdateEmergencyMessage = z.infer<typeof UpdateEmergencyMessageSchema>;
export type UpdateBanner = z.infer<typeof UpdateBannerSchema>;
