export type ProductType = 'simple' | 'configurable';

export interface OpcionConfigurable {
  ingredienteId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  permiteCantidad: boolean;
  cantidadMaxima: number;
  orden: number;
}

export interface GrupoConfigurable {
  grupoId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'unico' | 'multiple';
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  orden: number;
  ingredientes: OpcionConfigurable[];
}

export interface ConfiguracionProducto {
  productoId: string;
  tipoProducto: string;
  grupos: GrupoConfigurable[];
}

export interface Product {
  _id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  promotionalLabel?: string;
  featured?: boolean;
  imageUrl?: string;
  image?: string;
  category: string | { _id: string; name: string; order?: number };
  isActive: boolean;
  active?: boolean;
  tags?: string[];
  controlStock?: boolean;
  stock?: number;
  tipoProducto?: ProductType;
  order?: number;
  gruposOpciones?: any[];
  configuracion?: ConfiguracionProducto;
}

export interface Category {
  _id?: string;
  name: string;
  isActive?: boolean;
  icon?: string;
  order?: number;
}

/** Adicional tal como lo devuelve la API (colección `additionals`). */
export interface IAddOn {
  _id: string;
  title: string;
  price: number;
  /** Categorías donde se ofrece. Vacío = disponible en todas. */
  categories?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Addon = IAddOn;

export interface SelectedAddOn {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OpcionElegida {
  grupoId: string;
  grupoNombre: string;
  ingredienteId: string;
  ingredienteNombre: string;
  precio: number;
  cantidad: number;
}

export interface OpcionElegidaInput {
  grupoId: string;
  ingredienteId: string;
  cantidad?: number;
}

export interface CartItem extends Product {
  quantity: number;
  addOns: SelectedAddOn[];
  ingredientes: OpcionElegida[];
  precioIngredientesUnidad: number;
  cartItemId: string;
}

export interface Coupon {
  _id?: string;
  code: string;
  discountPercent: number;
  validDays?: string[];
  validPaymentMethods?: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Banner {
  _id: string;
  title: string;
  description?: string;
  subtitle?: string;
  image: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  active: boolean;
  isActive?: boolean;
}

export interface OrderAddon {
  name: string;
  title?: string;
  addonId?: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  additionals?: OrderAddon[];
  ingredientes?: OpcionElegida[];
  precioBaseUnidad?: number;
  precioIngredientesUnidad?: number;
  precioFinalUnidad?: number;
  totalLinea?: number;
}

export interface Order {
  _id?: string;
  customer: { name: string; phone: string };
  items: OrderItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'transfer' | 'mercadopago';
  paymentStatus?: 'not_required' | 'pending' | 'in_process' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  couponCode?: string | null;
  discountPercent: number;
  subtotal: number;
  deliveryCost: number;
  total: number;
  netTotal?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  delivery?: {
    address?: string;
    coordinates?: { lat: number; lng: number };
    /** Distancia al local en km (la calcula el backend). */
    distanceKm?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GalleryImage {
  id: string;
  name: string;
  url: string;
  createdAt?: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
}

export interface GalleryPage {
  images: GalleryImage[];
  nextCursor: string | null;
  totalCount?: number;
}

export interface StoreConfig {
  _id?: string;
  isOpen: boolean;
  message?: string;
  schedule?: string;
  deliveryAvailable: boolean;
  isEmergencyClosed?: boolean;
  emergencyMessage?: string;
  banner?: string;
  dailySchedule?: DaySchedule[];
  pricePerKm?: number;
}

export interface DayRange {
  open: string;
  close: string;
}

export interface DaySchedule {
  day: string;
  isStoreOpen: boolean;
  ranges: DayRange[];
}

// ── Envío / direcciones ─────────────────────────────────────────────────────
/** Origen de la distancia: Google Routes o estimación local (respaldo). */
export type DistanceSource = 'google' | 'estimado';

export interface DeliveryQuoteDetails {
  baseCost: number;
  rainSurcharge: number;
  isRaining: boolean;
  matchedMaxKm: number | null;
  outOfRange: boolean;
  deliverable: boolean;
  maxDeliveryKm: number;
  distanceSource: DistanceSource;
  configMissing: boolean;
}

export interface DeliveryQuote {
  distanceKm: number;
  deliveryCost: number;
  details: DeliveryQuoteDetails;
}

export interface DeliveryKmRange {
  id: string;
  maxKm: number;
  price: number;
}

export interface DeliveryConfig {
  kmRanges: DeliveryKmRange[];
  maxDeliveryKm: number;
  extraRain: number;
  isRaining: boolean;
  /** Punto de partida de los repartos (solo lo devuelve la API del admin). */
  originLat?: number;
  originLng?: number;
  originLabel?: string;
}

/** Resultado de la búsqueda de direcciones (lo resuelve el backend con Google). */
export interface GeocodePlace {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  locationType: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}
