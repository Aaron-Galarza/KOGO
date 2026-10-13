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

// --- Tipos de grupos de opciones configurables de producto ---
// single: el cliente elige como máximo 1 opción del grupo (ej: proteína, tamaño)
// multiple: el cliente puede elegir varias opciones (ej: salsas, extras)
export const OPTION_GROUP_TYPES = ['single', 'multiple'] as const;
export type OptionGroupType = (typeof OPTION_GROUP_TYPES)[number];

// --- Rangos de fechas (stats / analytics) ---
export const DATE_RANGES = ['today', 'yesterday', 'week', 'month'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

// --- Días de la semana (validación de cupones) ---
export const WEEK_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// --- Horarios de la tienda (config) ---
export const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export interface DayRange {
  open: string;
  close: string;
}

export interface DefaultDaySchedule {
  day: string;
  isStoreOpen: boolean;
  ranges: DayRange[];
}

export const DEFAULT_DAILY_SCHEDULE: DefaultDaySchedule[] = [
  { day: 'Lunes', isStoreOpen: false, ranges: [] },
  { day: 'Martes', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
  { day: 'Miércoles', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
  { day: 'Jueves', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
  { day: 'Viernes', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '23:00' }] },
  { day: 'Sábado', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '23:00' }] },
  { day: 'Domingo', isStoreOpen: true, ranges: [{ open: '19:00', close: '23:00' }] },
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
    ...envOrigins,
  ];
})();
