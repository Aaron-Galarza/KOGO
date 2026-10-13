'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders.service';
import { useCartStore } from '@/stores/cart.store';
import { useOrderConfirmStore } from '@/stores/order-confirm.store';

export function useCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useCartStore((s) => s.items);
  const deliveryType = useCartStore((s) => s.deliveryType);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const coupon = useCartStore((s) => s.coupon);
  const deliveryAddress = useCartStore((s) => s.deliveryAddress);
  const deliveryCoordinates = useCartStore((s) => s.deliveryCoordinates);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleCreateOrder = async (customerData: { name: string; phone: string }) => {
    try {
      setLoading(true);
      setError(null);

      if (items.length === 0) throw new Error('El carrito está vacío');
      if (!deliveryType) throw new Error('Selecciona un tipo de entrega');
      if (!paymentMethod) throw new Error('Selecciona un metodo de pago');
      if (deliveryType === 'delivery' && (!deliveryAddress || deliveryAddress.trim().length < 5)) {
        throw new Error('Ingresa una direccion valida (minimo 5 caracteres)');
      }

      const safeAddress = deliveryAddress
        ? deliveryAddress.replace(/<[^>]*>/g, '').replace(/[^\w\sáéíóúñÁÉÍÓÚÑ,.\-#°]/g, '').trim()
        : null;

      const orderPayload = {
        customer: customerData,
        items: items.map((item) => ({
          productId: item._id,
          title: item.title || item.name,
          price: item.price,
          quantity: item.quantity,
          additionals: item.addOns.map((a) => ({
            name: a.name,
            addonId: a._id,
            price: a.price,
            quantity: a.quantity,
          })),
        })),
        deliveryType,
        paymentMethod,
        couponCode: coupon?.code || null,
        deliveryAddress: safeAddress,
        deliveryCoordinates: deliveryCoordinates || null,
      };

      const order = await ordersService.createOrder(orderPayload);
      useOrderConfirmStore.getState().setLastOrder(order);
      clearCart();
      router.push(`/order-confirmation?orderId=${order._id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  return { handleCreateOrder, loading, error };
}
