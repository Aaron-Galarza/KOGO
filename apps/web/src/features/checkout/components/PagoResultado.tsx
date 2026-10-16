'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { paymentsService, PaymentStatus } from '@/services/payments.service';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/utils/format';
import { LAST_ONLINE_ORDER_KEY } from '@/utils/constants';
import { paymentPresentation, PaymentTone } from '../payment-status';
import { PaymentRecoveryActions } from './PaymentRecoveryActions';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20; // ~60 s verificando contra el backend

const TONE_STYLES: Record<PaymentTone, { Icon: typeof CheckCircle; iconClass: string }> = {
  success: { Icon: CheckCircle, iconClass: 'text-green-500' },
  warning: { Icon: Clock, iconClass: 'text-amber-500' },
  danger: { Icon: XCircle, iconClass: 'text-red-500' },
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Página de retorno desde Mercado Pago.
 *
 * IMPORTANTE: la URL de retorno NO confirma el pago. Esta pantalla arranca en
 * "verificando" y solo muestra un resultado cuando el BACKEND informa un estado
 * de pago (confirmado por webhook o por conciliación autenticada contra MP).
 */
export function PagoResultado() {
  const searchParams = useSearchParams();
  const queryOrderId =
    searchParams.get('external_reference') ||
    searchParams.get('orderId') ||
    searchParams.get('order_id');
  // Si la URL no trae el pedido, se recupera del respaldo en localStorage.
  const [orderId] = useState<string | null>(() => {
    if (queryOrderId) return queryOrderId;
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(LAST_ONLINE_ORDER_KEY);
    } catch {
      return null;
    }
  });
  const clearCart = useCartStore((s) => s.clearCart);

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  // El pago ya se inició: recién ahora vaciamos el carrito.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const current = await paymentsService.getStatus(orderId);
        if (!active) return;
        setStatus(current);
        setError(null);
        const stillWaiting =
          current.paymentStatus === 'pending' || current.paymentStatus === 'in_process';
        if (stillWaiting && attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current += 1;
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        } else {
          // Se conserva el id del pedido en localStorage: así, al refrescar la
          // pantalla, se vuelve a verificar el estado real contra el backend.
          setLoading(false);
        }
      } catch (err) {
        if (!active) return;
        setError(errorMessage(err, 'No pudimos verificar el pago.'));
        setLoading(false);
      }
    };

    poll();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  // Sin id de pedido no hay nada que verificar.
  if (!orderId) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
          <XCircle size={56} className="mx-auto mb-3 text-red-500" />
          <h1 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
            No pudimos identificar tu pedido
          </h1>
          <p className="text-[#757575] mb-6">
            Volvé al menú para revisar tus pedidos o intentar la compra nuevamente.
          </p>
          <Link
            href="/menu"
            className="block w-full bg-[#D95A2B] text-white py-3 rounded-xl font-bold hover:bg-[#D94B2B]"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    );
  }

  // No se pudo consultar el estado: no se afirma nada sobre el pago.
  if (error && !status) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
          <XCircle size={56} className="mx-auto mb-3 text-amber-500" />
          <h1 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
            No pudimos verificar el pago
          </h1>
          <p className="text-[#757575] mb-2">
            No cierres esta pantalla: si ya pagaste, tu pedido se acredita igual con la
            confirmación de Mercado Pago.
          </p>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <PaymentRecoveryActions orderId={orderId} canRetry />
        </div>
      </div>
    );
  }

  // Todavía sin respuesta del backend.
  if (!status) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
          <Loader2 size={56} className="mx-auto mb-3 text-[#D95A2B] animate-spin" />
          <h1 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
            Verificando el pago…
          </h1>
          <p className="text-[#757575]">
            Estamos confirmando tu pago con Mercado Pago. No cierres esta pantalla.
          </p>
        </div>
      </div>
    );
  }

  const presentation = paymentPresentation(status, { verifying: loading });
  const { Icon, iconClass } = TONE_STYLES[presentation.tone];
  const canRetry = status.orderStatus !== 'cancelled';

  return (
    <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
        <Icon size={56} className={`mx-auto mb-3 ${iconClass}`} />
        <h1 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
          {presentation.title}
        </h1>
        <p className="text-[#757575] mb-4">{presentation.message}</p>

        <p className="text-sm text-[#4a5568] mb-4">
          Total: <span className="font-semibold">{formatCurrency(status.total)}</span>
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {presentation.recovery ? (
          <div className="mb-4">
            <PaymentRecoveryActions orderId={orderId} canRetry={canRetry} />
          </div>
        ) : (
          loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#757575] mb-4">
              <Loader2 size={16} className="animate-spin" />
              Actualizando el estado…
            </div>
          )
        )}

        <Link
          href={`/order-confirmation?orderId=${orderId}`}
          className="block w-full py-3 rounded-xl font-bold bg-gray-100 text-[#212121] hover:bg-gray-200"
        >
          Ver mi pedido
        </Link>
        <Link
          href="/menu"
          className="block w-full mt-2 py-3 rounded-xl font-bold bg-gray-100 text-[#212121] hover:bg-gray-200"
        >
          Volver al menú
        </Link>
      </div>
    </div>
  );
}
