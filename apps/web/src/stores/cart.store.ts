import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, SelectedAddOn, Coupon, Addon } from '@/types';

function generateCartItemId(productId: string, addOns: SelectedAddOn[]): string {
  if (!addOns || addOns.length === 0) return productId;
  const sorted = [...addOns].sort((a, b) => a._id.localeCompare(b._id));
  const parts = sorted.map((a) => `${a._id}:${a.quantity}`).join(',');
  return `${productId}__${parts}`;
}

interface CartState {
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery' | null;
  paymentMethod: 'cash' | 'debito' | 'credito' | 'transferencia' | null;
  coupon: Coupon | null;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  deliveryCost: number;

  addToCart: (product: any, addOns: SelectedAddOn[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemAddOns: (oldCartItemId: string, newAddOns: SelectedAddOn[]) => void;
  clearCart: () => void;
  setDeliveryType: (t: 'pickup' | 'delivery') => void;
  setPaymentMethod: (m: 'cash' | 'debito' | 'credito' | 'transferencia') => void;
  setCoupon: (c: Coupon) => void;
  clearCoupon: () => void;
  setDeliveryAddress: (a: string, c: { lat: number; lng: number }) => void;
  setDeliveryCost: (c: number) => void;
  clearDelivery: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

function getAddOns(item: any): SelectedAddOn[] {
  return item.addOns ?? item.addons ?? [];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryType: null,
      paymentMethod: null,
      coupon: null,
      deliveryAddress: '',
      deliveryCoordinates: null,
      deliveryCost: 0,

      addToCart: (product: any, addOns: SelectedAddOn[]) => {
        set((prev) => {
          const id = generateCartItemId(product._id, addOns);
          const exists = prev.items.find((item) => item.cartItemId === id);
          if (exists) {
            const maxStock = product.controlStock === true ? (product.stock ?? 0) : Infinity;
            if (exists.quantity + 1 > maxStock) return prev;
            return {
              items: prev.items.map((item) =>
                item.cartItemId === id ? { ...item, quantity: item.quantity + 1 } : item
              ),
            };
          }
          if (product.controlStock === true && (product.stock ?? 0) <= 0) return prev;
          return {
            items: [
              ...prev.items,
              { ...product, quantity: 1, addOns, cartItemId: id },
            ],
          };
        });
      },

      removeFromCart: (cartItemId: string) => {
        set((prev) => {
          const item = prev.items.find((i) => i.cartItemId === cartItemId);
          if (!item) return prev;
          if (item.quantity > 1) {
            return {
              items: prev.items.map((i) =>
                i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i
              ),
            };
          }
          return { items: prev.items.filter((i) => i.cartItemId !== cartItemId) };
        });
      },

      updateCartItemAddOns: (oldCartItemId: string, newAddOns: SelectedAddOn[]) => {
        set((prev) => {
          const item = prev.items.find((i) => i.cartItemId === oldCartItemId);
          if (!item) return prev;

          const newId = generateCartItemId(item._id, newAddOns);
          const idx = prev.items.findIndex((i) => i.cartItemId === oldCartItemId);

          // RAMA 1 — FUSIÓN: quitar TODOS los adicionales
          if (newAddOns.length === 0) {
            const plainIdx = prev.items.findIndex(
              (i) =>
                i.cartItemId === item._id &&
                (!i.addOns || i.addOns.length === 0) &&
                i.cartItemId !== oldCartItemId
            );
            if (plainIdx !== -1) {
              const next = [...prev.items];
              next[plainIdx] = { ...next[plainIdx], quantity: next[plainIdx].quantity + item.quantity };
              next.splice(idx, 1);
              return { items: next };
            }
            const next = [...prev.items];
            next[idx] = { ...item, addOns: [], cartItemId: newId };
            return { items: next };
          }

          // RAMA 2 — DIVISIÓN: ítem con quantity > 1, se personaliza 1 unidad
          if (item.quantity > 1) {
            const next = [...prev.items];
            next[idx] = { ...item, quantity: item.quantity - 1, addOns: [], cartItemId: generateCartItemId(item._id, []) };
            const personalized = { ...item, quantity: 1, addOns: newAddOns, cartItemId: newId };

            const existingIdx = next.findIndex(
              (i) => i.cartItemId === newId && i.cartItemId !== oldCartItemId
            );
            if (existingIdx !== -1) {
              next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
            } else {
              next.splice(idx + 1, 0, personalized);
            }
            return { items: next };
          }

          // RAMA 3 — ACTUALIZACIÓN SIMPLE: quantity=1, cambiar adicionales
          const existingIdx = prev.items.findIndex(
            (i) => i.cartItemId === newId && i.cartItemId !== oldCartItemId
          );
          if (existingIdx !== -1) {
            const next = [...prev.items];
            next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
            next.splice(idx, 1);
            return { items: next };
          }
          const next = [...prev.items];
          next[idx] = { ...item, addOns: newAddOns, cartItemId: newId };
          return { items: next };
        });
      },

      clearCart: () => set({ items: [], coupon: null, deliveryCost: 0, deliveryCoordinates: null, deliveryAddress: '', deliveryType: null, paymentMethod: null }),
      setDeliveryType: (t) => { set({ deliveryType: t }); if (t === 'pickup') get().clearDelivery(); },
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setCoupon: (c) => set({ coupon: c }),
      clearCoupon: () => set({ coupon: null }),
      setDeliveryAddress: (a, c) => set({ deliveryAddress: a, deliveryCoordinates: c }),
      setDeliveryCost: (c) => set({ deliveryCost: c }),
      clearDelivery: () => set({ deliveryAddress: '', deliveryCoordinates: null, deliveryCost: 0 }),

      getSubtotal: () =>
        get().items.reduce((sum, item: any) => {
          const addOnsTotal = getAddOns(item).reduce((s: number, a: any) => s + a.price * (a.quantity || 1), 0);
          return sum + item.price * item.quantity + addOnsTotal;
        }, 0),
      getDiscount: () => (get().coupon ? (get().getSubtotal() * get().coupon!.discountPercent) / 100 : 0),
      getTotal: () => get().getSubtotal() - get().getDiscount() + get().deliveryCost,
      getItemCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    {
      name: 'cheepers-cart',
      version: 2,
      skipHydration: true,
      migrate: (persisted: any) => {
        const raw = (persisted?.items || []).map((item: any) => {
          const addOns = item.addOns ?? item.addons ?? [];
          const cartItemId =
            item.cartItemId ??
            generateCartItemId(item.product?._id ?? item._id, addOns);
          return { ...item, addOns, cartItemId };
        });
        const merged = new Map<string, any>();
        for (const item of raw) {
          if (merged.has(item.cartItemId)) {
            merged.get(item.cartItemId).quantity += item.quantity || 1;
          } else {
            merged.set(item.cartItemId, { ...item });
          }
        }
        return { ...persisted, items: [...merged.values()] };
      },
    }
  )
);
