// Argentina (UTC-3, sin DST). El server corre en UTC.
// Estas utilidades permiten calcular "días" en hora local argentina.
export const AR_OFFSET_MS = 3 * 60 * 60 * 1000;

// Desplaza una fecha para leer sus componentes UTC como hora argentina
// (misma técnica que usa ConfigService.isOpenNow).
export const toArgentina = (date: Date): Date => new Date(date.getTime() - AR_OFFSET_MS);

// Inicio (00:00:00.000) del día argentino al que pertenece `date`.
export const arStartOfDay = (date: Date): Date => {
  const ar = toArgentina(date);
  return new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()) + AR_OFFSET_MS);
};

// Fin (23:59:59.999) del día argentino al que pertenece `date`.
export const arEndOfDay = (date: Date): Date =>
  new Date(arStartOfDay(date).getTime() + 24 * 60 * 60 * 1000 - 1);

// Start y end instantáneos para un día dado por "yyyy-MM-dd" en Argentina.
export const arDayRange = (dateStr: string): { start: Date; end: Date } => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) + AR_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) };
};

// Clave "yyyy-MM-dd" en la zona argentina.
export const arDateKey = (date: Date): string => toArgentina(date).toISOString().slice(0, 10);