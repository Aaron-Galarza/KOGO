'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders.service';
import { paymentsService } from '@/services/payments.service';
import { useCartStore } from '@/stores/cart.store';
import { useOrderConfirmStore } from '@/stores/order-confirm.store';
import { LAST_ONLINE_ORDER_KEY } from '@/utils/constants';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// Respaldo para la página de retorno: guarda el último pedido online iniciado,
// por si Mercado Pago no devuelve el id del pedido en la URL de retorno.
function rememberOrder(orderId: string) {
  try {
    window.localStorage.setItem(LAST_ONLINE_ORDER_KEY, orderId);
  } catch {
    // localStorage puede no estar disponible; no es crítico.
  }
}

export function useCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pedido online ya creado cuyo checkout no llegó a iniciarse: permite reintentar el pago
  // sin volver a crear la orden (evita pedidos duplicados).
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

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

      // Reintento: la orden ya existe, solo reintentamos iniciar el pago online.
      if (pendingOrderId) {
        const { checkoutUrl } = await paymentsService.createCheckout(pendingOrderId);
        rememberOrder(pendingOrderId);
        clearCart();
        window.location.href = checkoutUrl;
        return;
      }

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
          ingredientes: (item.ingredientes ?? []).map((o) => ({
            grupoId: o.grupoId,
            ingredienteId: o.ingredienteId,
            cantidad: o.cantidad,
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

      // Pago online: crear la orden queda pendiente y redirigimos a Mercado Pago.
      // La confirmación real llega por webhook, no por esta redirección.
      if (order.paymentMethod === 'mercadopago') {
        if (!order._id) throw new Error('No pudimos identificar el pedido');
        try {
          const { checkoutUrl } = await paymentsService.createCheckout(order._id);
          rememberOrder(order._id);
          clearCart();
          window.location.href = checkoutUrl;
          return;
        } catch (payErr) {
          // Conservamos el carrito y recordamos el pedido para reintentar el pago.
          setPendingOrderId(order._id);
          throw new Error(
            errorMessage(
              payErr,
              'No pudimos iniciar el pago online. Tu pedido quedó registrado: volvé a intentar en unos segundos.'
            )
          );
        }
      }

      clearCart();
      router.push(`/order-confirmation?orderId=${order._id}`);
    } catch (err) {
      setError(errorMessage(err, 'Error al crear la orden'));
    } finally {
      setLoading(false);
    }
  };

  return { handleCreateOrder, loading, error };
}
