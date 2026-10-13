export const PAYS = ['cash', 'debito', 'credito', 'transferencia'] as const;
export type PaymentKey = (typeof PAYS)[number];

export const PAYMENT_LABELS: Record<PaymentKey, string> = {
  cash: '💵 Efectivo',
  debito: '🏧 Débito',
  credito: '💳 Crédito',
  transferencia: '🏦 Transferencia',
};

// ── Datos de la cuenta para pagos por transferencia ────────────────────────
export const TRANSFER_INFO = {
  alias: 'cheepers.bh',
  holder: 'Ricardo Salas',
} as const;

// ── Días de la semana ───────────────────────────────────────────────────────
export const CDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const DS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

// ── Estados de órdenes ──────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
] as const;

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  pending: 'Pendiente',
  'preparing': 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

// ── Datos de negocio ────────────────────────────────────────────────────────
export const BUSINESS_NAME = 'Cheepers The Burger House';
export const SLOGAN = 'Alta calidad a precios bajos';
export const ADDRESS = 'San Juan 1360, Resistencia - Chaco';
export const PHONE = '+54 362 4063011';
export const WHATSAPP_URL = 'https://wa.me/543624063011';
export const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3540.43240223599!2d-58.989694!3d-27.432417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDI1JzU2LjciUyA1OMKwNTknMjIuOSJX!5e0!3m2!1ses!2sar!4v1719000000000!5m2!1ses!2sar';
export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps?q=-27.432417,-58.989694';
export const FACEBOOK_URL = 'https://www.facebook.com/CheepersTBH';
export const INSTAGRAM_URL = 'https://www.instagram.com/cheeperstbh/';
export const FOUNDATION_YEAR = 2019;
export const FOUNDER = 'Ricardo Salas';
export const SCHEDULE = 'Miércoles a Domingo: 20:00 - 23:00, Viernes y Sábados: hasta 00:00';

export const HERO_SLIDES = [
  {
    title: 'CON QUESO',
    text: 'Ketchup, carne, cebollita, cheddar y mostaza.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    cta: '¡SABOR INIGUALABLE!',
    ctaHref: '/menu',
  },
  {
    title: 'PAPAS BACON',
    text: 'Crujientes papas con bacon dorado y cheddar.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop',
    cta: '¡IRRESISTIBLE!',
    ctaHref: '/menu',
  },
  {
    title: 'PIZZAS',
    text: 'Gran variedad de pizzas. No te quedes sin probar.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop',
    cta: '¡PROBALAS!',
    ctaHref: '/menu',
  },
  {
    title: 'CALIDAD ÚNICA',
    text: 'Ingredientes frescos, pasión y tradición desde 2019.',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop',
    cta: '¡CONOCÉ MÁS!',
    ctaHref: '/menu',
  },
];