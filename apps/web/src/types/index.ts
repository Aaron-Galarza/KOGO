export type ProductType = 'simple' | 'configurable';

export interface OpcionConfigurable {
  ingredienteId: string;
  nombre: string;
  descripcion?: string;
  imagen?: string;
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

export interface IAddOn {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  isActive: boolean;
  associatedProductCategories: string[];
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
  delivery?: { address: string; coordinates: { lat: number; lng: number }; distanceKm: number };
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
  _id?: string;
  title?: string;
  imageUrl?: string;
  publicId?: string;
  order?: number;
  active?: boolean;
  updatedAt?: Date;
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
