'use client';

import { usePOSStore } from '@/stores/pos.store';

export function usePOSCart() {
  const items = usePOSStore((s) => s.items);
  const addItem = usePOSStore((s) => s.addItem);
  const removeItem = usePOSStore((s) => s.removeItem);
  const updateQuantity = usePOSStore((s) => s.updateQuantity);
  const clearCart = usePOSStore((s) => s.clearCart);
  const subtotal = usePOSStore((s) => s.getSubtotal());

  return { items, subtotal, addItem, removeItem, updateQuantity, clearCart };
}
