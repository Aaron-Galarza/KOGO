// ============================================================
// CONSTANTES GLOBALES DEL BACKEND
// Única fuente de verdad para constantes compartidas entre
// varios archivos. Importar SIEMPRE desde aquí, nunca duplicar
// valores inline. Mantener este archivo ordenado y comentado.
// ============================================================

// --- Estados y métodos de pago de órdenes ---
export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'transfer', 'mercadopago'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const DELIVERY_TYPES = ['pickup', 'delivery'] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

// --- Rangos de fechas (stats / analytics) ---
export const DATE_RANGES = ['today', 'yesterday', 'week', 'month'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

// --- Días de la semana (validación de cupones) ---
export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// --- Horarios de la tienda (config) ---
export const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export const DEFAULT_DAILY_SCHEDULE: Array<{ day: string; openTime: string; closeTime: string; isStoreOpen: boolean }> = [
  { day: 'Lunes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
  { day: 'Martes', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
  { day: 'Miércoles', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
  { day: 'Jueves', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
  { day: 'Viernes', openTime: '20:00', closeTime: '00:00', isStoreOpen: true },
  { day: 'Sábado', openTime: '20:00', closeTime: '00:00', isStoreOpen: true },
  { day: 'Domingo', openTime: '20:00', closeTime: '23:00', isStoreOpen: true },
];

// --- Defaults de entorno ---
export const DEFAULT_PORT = 4000;
export const DEFAULT_CLIENT_URL = 'http://localhost:3000';

export const ALLOWED_ORIGINS = (() => {
  const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [
    DEFAULT_CLIENT_URL,
    'https://cheepers-tbh.vercel.app',
    'https://cheepersapp.vercel.app',
    ...envOrigins,
  ];
})();
