'use client';

import { useState } from 'react';
import { paymentsService } from '@/services/payments.service';
import { LAST_ONLINE_ORDER_KEY } from '@/utils/constants';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Inicia (o reanuda) el pago online de un pedido ya creado y redirige a Mercado
 * Pago. Sirve para "reintentar el pago" desde las pantallas de retorno.
 * No crea pedidos nuevos: el backend reutiliza el checkout vigente del pedido.
 */
export function usePayOnline() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { checkoutUrl } = await paymentsService.createCheckout(orderId);
      try {
        window.localStorage.setItem(LAST_ONLINE_ORDER_KEY, orderId);
      } catch {
        // localStorage puede no estar disponible; no es crítico.
      }
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(errorMessage(err, 'No pudimos iniciar el pago. Intentá de nuevo.'));
      setLoading(false);
    }
  };

  return { pay, loading, error };
}
