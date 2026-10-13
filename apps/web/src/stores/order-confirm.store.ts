import { create } from 'zustand';
import { Order } from '@/types';

interface OrderConfirmState {
  lastOrder: Order | null;
  setLastOrder: (order: Order) => void;
  clearLastOrder: () => void;
}

export const useOrderConfirmStore = create<OrderConfirmState>((set) => ({
  lastOrder: null,
  setLastOrder: (order) => set({ lastOrder: order }),
  clearLastOrder: () => set({ lastOrder: null }),
}));
