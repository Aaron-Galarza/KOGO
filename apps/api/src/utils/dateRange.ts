import { DATE_RANGES, DateRange } from '../constants';
import { AR_OFFSET_MS, arStartOfDay, arEndOfDay } from './argentinaTime';

export type { DateRange };

export const VALID_RANGES = DATE_RANGES;

export const getRangeStartDate = (range: DateRange): { start: Date; end: Date } => {
  const now = new Date();

  switch (range) {
    case 'today':
      return { start: arStartOfDay(now), end: arEndOfDay(now) };
    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { start: arStartOfDay(yesterday), end: arEndOfDay(yesterday) };
    }
    case 'week': {
      // Misma semana que date-fns (empieza domingo), pero en hora argentina.
      const ar = new Date(now.getTime() - AR_OFFSET_MS);
      const dow = ar.getUTCDay();
      const sunday = new Date(ar.getTime() - dow * 24 * 60 * 60 * 1000);
      const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
      return { start: arStartOfDay(sunday), end: arEndOfDay(saturday) };
    }
    case 'month': {
      const ar = new Date(now.getTime() - AR_OFFSET_MS);
      const first = new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), 1));
      const last = new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth() + 1, 0));
      return { start: arStartOfDay(first), end: arEndOfDay(last) };
    }
    default:
      return { start: arStartOfDay(now), end: arEndOfDay(now) };
  }
};