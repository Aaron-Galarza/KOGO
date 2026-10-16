import { create } from 'zustand';
import { CartItem, SelectedAddOn, OpcionElegida } from '@/types';

interface POSState {
  items: CartItem[];
  searchQuery: string;
  selectedCategory: string | null;
  // Entrega: el POS maneja su propio estado (independiente del carrito público).
  deliveryType: 'pickup' | 'delivery' | null;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  deliveryCost: number;
  distanceKm: number | null;
  paymentMethod: 'cash' | 'transfer' | 'mercadopago' | null;
  addItem: (product: any, quantity: number, addons: SelectedAddOn[], ingredientes?: OpcionElegida[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateAddOns: (itemId: string, addOns: SelectedAddOn[]) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setDeliveryType: (type: 'pickup' | 'delivery') => void;
  setDeliveryAddress: (address: string, coordinates: { lat: number; lng: number } | null) => void;
  setDeliveryCost: (cost: number, distanceKm: number | null) => void;
  clearDelivery: () => void;
  setPaymentMethod: (method: 'cash' | 'transfer' | 'mercadopago') => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  searchQuery: '',
  selectedCategory: null,
  deliveryType: 'pickup',
  deliveryAddress: '',
  deliveryCoordinates: null,
  deliveryCost: 0,
  distanceKm: null,
  paymentMethod: 'cash',

  addItem: (product: any, quantity: number, addons: SelectedAddOn[], ingredientes: OpcionElegida[] = []) => {
    if (product.controlStock === true) {
      const stock = product.stock ?? 0;
      if (stock <= 0) return;
      quantity = Math.min(quantity, stock);
    }
    const precioIngredientesUnidad = ingredientes.reduce((s, o) => s + o.precio * (o.cantidad || 1), 0);
    set((state) => ({
      items: [...state.items, { ...product, quantity, addOns: addons, ingredientes, precioIngredientesUnidad, cartItemId: `${product._id}-${Date.now()}` }],
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((item) => item.cartItemId !== itemId) }));
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) { get().removeItem(itemId); return; }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.cartItemId !== itemId) return i;
        if (i.controlStock === true) {
          quantity = Math.min(quantity, i.stock ?? 0);
        }
        return { ...i, quantity };
      }),
    }));
  },

  updateAddOns: (itemId: string, addOns: SelectedAddOn[]) => {
    set((state) => ({ items: state.items.map((i) => i.cartItemId === itemId ? { ...i, addOns } : i) }));
  },

  clearCart: () => {
    set({
      items: [],
      deliveryType: 'pickup',
      deliveryAddress: '',
      deliveryCoordinates: null,
      deliveryCost: 0,
      distanceKm: null,
      paymentMethod: 'cash',
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  setDeliveryType: (type) => {
    set({ deliveryType: type });
    if (type === 'pickup') get().clearDelivery();
  },

  setDeliveryAddress: (address, coordinates) => set({
    deliveryAddress: address,
    deliveryCoordinates: coordinates,
    deliveryCost: 0,
    distanceKm: null,
  }),

  setDeliveryCost: (cost, distanceKm) => set({ deliveryCost: cost, distanceKm }),

  clearDelivery: () => set({ deliveryAddress: '', deliveryCoordinates: null, deliveryCost: 0, distanceKm: null }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      let price = item.price;
      for (const ao of item.addOns) price += ao.price * ao.quantity;
      for (const op of item.ingredientes ?? []) price += op.precio * (op.cantidad || 1);
      return sum + price * item.quantity;
    }, 0);
  },

  getTotal: () => {
    const state = get();
    return state.getSubtotal() + (state.deliveryType === 'delivery' ? state.deliveryCost : 0);
  },
}));
