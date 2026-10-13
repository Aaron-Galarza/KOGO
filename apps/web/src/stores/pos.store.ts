import { create } from 'zustand';
import { CartItem, SelectedAddOn } from '@/types';

interface POSState {
  items: CartItem[];
  searchQuery: string;
  selectedCategory: string | null;
  addItem: (product: any, quantity: number, addons: SelectedAddOn[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateAddOns: (itemId: string, addOns: SelectedAddOn[]) => void;
  clearCart: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  getSubtotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  items: [],
  searchQuery: '',
  selectedCategory: null,

  addItem: (product: any, quantity: number, addons: SelectedAddOn[]) => {
    if (product.controlStock === true) {
      const stock = product.stock ?? 0;
      if (stock <= 0) return;
      quantity = Math.min(quantity, stock);
    }
    set((state) => ({
      items: [...state.items, { ...product, quantity, addOns: addons, cartItemId: `${product._id}-${Date.now()}` }],
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
    set({ items: [] });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      let price = item.price;
      for (const ao of item.addOns) price += ao.price * ao.quantity;
      return sum + price * item.quantity;
    }, 0);
  },
}));