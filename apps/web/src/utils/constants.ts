export const PAYS = ['cash', 'transfer', 'mercadopago'] as const;
export type PaymentKey = (typeof PAYS)[number];

export const PAYMENT_LABELS: Record<PaymentKey, string> = {
  cash: '💵 Efectivo',
  transfer: '🏦 Transferencia',
  mercadopago: '💳 Mercado Pago',
};

// ── Datos de la cuenta para pagos por transferencia ────────────────────────
export const TRANSFER_INFO = {
  alias: 'kogo.bh',
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
export const BUSINESS_NAME = 'KOGO';
export const SLOGAN = 'Comida coreana en Corrientes: alta calidad y una experiencia diferente';
export const ADDRESS = 'Pasaje Agustín González 1075, W3400 Corrientes, Corrientes, Argentina';
export const PHONE = '+54 9 3794 20-1646';
export const WHATSAPP_NUMBER = '5493794201646';
export const WHATSAPP_MESSAGE = 'Hola KOGO! Quiero hacer un pedido de comida coreana 🍜';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
export const GOOGLE_MAPS_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d885.0183705887081!2d-58.83767523033696!3d-27.46697159852008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94456d9a92b13741%3A0x88c9bb11c6772785!2sKOGO%20%7C%20Korean%20Street%20Food!5e0!3m2!1ses-419!2sar!4v1791905887546!5m2!1ses-419!2sar';
export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=KOGO%20%7C%20Korean%20Street%20Food%2C%20Corrientes';
export const FACEBOOK_URL = '#';
export const INSTAGRAM_URL = '#';
export const FOUNDATION_YEAR = 2019;
export const FOUNDER = 'Ricardo Salas';
export const SCHEDULE =
  'Martes a Jueves: 11:30–14:00 | 18:30–22:30 · Viernes y Sábados: 11:30–14:00 | 18:30–23:00 · Domingo: 19:00–23:00 · Lunes: Cerrado';

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