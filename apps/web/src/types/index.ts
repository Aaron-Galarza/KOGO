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

export interface CartItem extends Product {
  quantity: number;
  addOns: SelectedAddOn[];
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
}

export interface Order {
  _id?: string;
  customer: { name: string; phone: string };
  items: OrderItem[];
  deliveryType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'transfer' | 'mercadopago';
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
  _id?: string;
  title: string;
  imageUrl: string;
  publicId: string;
  order: number;
  active: boolean;
  createdAt?: Date;
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

export interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isStoreOpen: boolean;
}
