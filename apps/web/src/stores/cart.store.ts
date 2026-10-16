import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, SelectedAddOn, OpcionElegida, Coupon, Addon } from '@/types';

function normalizeOpcion(o: any): OpcionElegida {
  return {
    grupoId: o.grupoId ?? o.groupId,
    grupoNombre: o.grupoNombre ?? o.groupName,
    ingredienteId: o.ingredienteId ?? o.optionId,
    ingredienteNombre: o.ingredienteNombre ?? o.optionName,
    precio: o.precio ?? o.price,
    cantidad: o.cantidad ?? o.quantity ?? 1,
  };
}

function generateCartItemId(
  productId: string,
  addOns: SelectedAddOn[],
  ingredientes: OpcionElegida[] = []
): string {
  const parts: string[] = [];
  if (addOns && addOns.length > 0) {
    const sorted = [...addOns].sort((a, b) => a._id.localeCompare(b._id));
    parts.push('a:' + sorted.map((a) => `${a._id}:${a.quantity}`).join(','));
  }
  if (ingredientes && ingredientes.length > 0) {
    const sorted = [...ingredientes].sort((a, b) =>
      `${a.grupoId}.${a.ingredienteId}`.localeCompare(`${b.grupoId}.${b.ingredienteId}`)
    );
    parts.push('o:' + sorted.map((o) => `${o.grupoId}.${o.ingredienteId}:${o.cantidad || 1}`).join(','));
  }
  return parts.length === 0 ? productId : `${productId}__${parts.join('|')}`;
}

function precioIngredientes(ingredientes: OpcionElegida[] = []): number {
  return ingredientes.reduce((s, o) => s + o.precio * (o.cantidad || 1), 0);
}

interface CartState {
  items: CartItem[];
  deliveryType: 'pickup' | 'delivery' | null;
  paymentMethod: 'cash' | 'transfer' | 'mercadopago' | null;
  coupon: Coupon | null;
  deliveryAddress: string;
  deliveryCoordinates: { lat: number; lng: number } | null;
  deliveryCost: number;
  /** Distancia al local en km (la informa el backend al calcular el envío). */
  distanceKm: number | null;

  addToCart: (product: any, addOns: SelectedAddOn[], ingredientes?: OpcionElegida[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemAddOns: (oldCartItemId: string, newAddOns: SelectedAddOn[]) => void;
  updateCartItemOptions: (oldCartItemId: string, ingredientes: OpcionElegida[]) => void;
  clearCart: () => void;
  setDeliveryType: (t: 'pickup' | 'delivery') => void;
  setPaymentMethod: (m: 'cash' | 'transfer' | 'mercadopago') => void;
  setCoupon: (c: Coupon) => void;
  clearCoupon: () => void;
  setDeliveryAddress: (a: string, c: { lat: number; lng: number } | null) => void;
  setDeliveryCost: (c: number, km: number | null) => void;
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
      distanceKm: null,

      addToCart: (product: any, addOns: SelectedAddOn[], ingredientes: OpcionElegida[] = []) => {
        set((prev) => {
          const id = generateCartItemId(product._id, addOns, ingredientes);
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
              {
                ...product,
                quantity: 1,
                addOns,
                ingredientes,
                precioIngredientesUnidad: precioIngredientes(ingredientes),
                cartItemId: id,
              },
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

      updateCartItemOptions: (oldCartItemId: string, ingredientes: OpcionElegida[]) => {
        set((prev) => {
          const idx = prev.items.findIndex((i) => i.cartItemId === oldCartItemId);
          if (idx === -1) return prev;
          const item = prev.items[idx];
          const newId = generateCartItemId(item._id, item.addOns ?? [], ingredientes);
          if (newId === oldCartItemId) return prev;

          const precioUnidad = precioIngredientes(ingredientes);
          const next = [...prev.items];

          if (item.quantity > 1) {
            next[idx] = { ...item, quantity: item.quantity - 1 };
            const existingIdx = next.findIndex((i, k) => k !== idx && i.cartItemId === newId);
            if (existingIdx !== -1) {
              next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
            } else {
              next.splice(idx + 1, 0, { ...item, quantity: 1, ingredientes, precioIngredientesUnidad: precioUnidad, cartItemId: newId });
            }
            return { items: next };
          }

          const existingIdx = next.findIndex((i, k) => k !== idx && i.cartItemId === newId);
          if (existingIdx !== -1) {
            next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
            next.splice(idx, 1);
            return { items: next };
          }

          next[idx] = { ...item, ingredientes, precioIngredientesUnidad: precioUnidad, cartItemId: newId };
          return { items: next };
        });
      },

      clearCart: () => set({ items: [], coupon: null, deliveryCost: 0, deliveryCoordinates: null, deliveryAddress: '', deliveryType: null, paymentMethod: null, distanceKm: null }),
      setDeliveryType: (t) => { set({ deliveryType: t }); if (t === 'pickup') get().clearDelivery(); },
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setCoupon: (c) => set({ coupon: c }),
      clearCoupon: () => set({ coupon: null }),
      setDeliveryAddress: (a, c) => set({ deliveryAddress: a, deliveryCoordinates: c, deliveryCost: 0, distanceKm: null }),
      setDeliveryCost: (c, km) => set({ deliveryCost: c, distanceKm: km }),
      clearDelivery: () => set({ deliveryAddress: '', deliveryCoordinates: null, deliveryCost: 0, distanceKm: null }),

      getSubtotal: () =>
        get().items.reduce((sum, item: any) => {
          const addOnsTotal = getAddOns(item).reduce((s: number, a: any) => s + a.price * (a.quantity || 1), 0);
          const ingredientesTotal = (item.ingredientes ?? []).reduce(
            (s: number, o: any) => s + o.precio * (o.cantidad || 1),
            0
          );
          return sum + (item.price + ingredientesTotal) * item.quantity + addOnsTotal;
        }, 0),
      getDiscount: () => (get().coupon ? (get().getSubtotal() * get().coupon!.discountPercent) / 100 : 0),
      getTotal: () => get().getSubtotal() - get().getDiscount() + get().deliveryCost,
      getItemCount: () => get().items.reduce((c, i) => c + i.quantity, 0),
    }),
    {
      name: 'kogo-cart',
      version: 5,
      skipHydration: true,
      migrate: (persisted: any) => {
        const raw = (persisted?.items || []).map((item: any) => {
          const addOns = item.addOns ?? item.addons ?? [];
          const ingredientes = (item.ingredientes ?? item.selectedOptions ?? []).map(normalizeOpcion);
          const cartItemId =
            item.cartItemId ??
            generateCartItemId(item.product?._id ?? item._id, addOns, ingredientes);
          return {
            ...item,
            addOns,
            ingredientes,
            precioIngredientesUnidad: item.precioIngredientesUnidad ?? precioIngredientes(ingredientes),
            cartItemId,
          };
        });
        const merged = new Map<string, any>();
        for (const item of raw) {
          if (merged.has(item.cartItemId)) {
            merged.get(item.cartItemId).quantity += item.quantity || 1;
          } else {
            merged.set(item.cartItemId, { ...item });
          }
        }
        return {
          ...persisted,
          items: [...merged.values()],
          distanceKm: persisted?.distanceKm ?? null,
          deliveryCost: persisted?.deliveryCost ?? 0,
        };
      },
    }
  )
);
