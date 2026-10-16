'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { paymentsService, PaymentStatus } from '@/services/payments.service';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/utils/format';
import { LAST_ONLINE_ORDER_KEY } from '@/utils/constants';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20; // ~60 s verificando contra el backend

type Resolved = 'verificando' | 'aprobado' | 'pendiente' | 'error';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Página de retorno desde Mercado Pago.
 *
 * IMPORTANTE: la URL de retorno NO confirma el pago. Esta pantalla arranca en
 * "verificando" y solo muestra un resultado cuando el BACKEND informa un estado
 * de pago (confirmado por webhook o por conciliación autenticada contra MP).
 * El `variant` de la URL nunca se usa como verdad.
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
          try {
            window.localStorage.removeItem(LAST_ONLINE_ORDER_KEY);
          } catch {
            // localStorage puede no estar disponible; no es crítico.
          }
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

  // Sin id de pedido no hay nada que verificar: se muestra un aviso.
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
          <Link
            href={`/pago/pendiente?orderId=${orderId}`}
            className="block w-full bg-[#D95A2B] text-white py-3 rounded-xl font-bold hover:bg-[#D94B2B]"
          >
            Volver a verificar
          </Link>
        </div>
      </div>
    );
  }

  // El resultado lo decide SIEMPRE el backend. Si todavía no hay estado, queda
  // en "verificando": la URL nunca confirma el pago.
  const resolved: Resolved = status
    ? status.paymentStatus === 'approved'
      ? 'aprobado'
      : status.paymentStatus === 'rejected' || status.paymentStatus === 'cancelled'
        ? 'error'
        : 'pendiente'
    : 'verificando';

  const config = {
    verificando: {
      Icon: Loader2,
      iconClass: 'text-[#D95A2B] animate-spin',
      title: 'Verificando el pago…',
      message:
        'Estamos confirmando tu pago con Mercado Pago. No cierres esta pantalla, se actualiza sola.',
    },
    aprobado: {
      Icon: CheckCircle,
      iconClass: 'text-green-500',
      title: '¡Pago aprobado!',
      message: 'Registramos tu pago. Te avisaremos por WhatsApp cuando el pedido esté listo.',
    },
    pendiente: {
      Icon: Clock,
      iconClass: 'text-amber-500',
      title: 'Pago pendiente',
      message:
        'Mercado Pago todavía no confirmó el pago. Si ya pagaste, se acreditará en unos minutos. Te avisaremos por WhatsApp.',
    },
    error: {
      Icon: XCircle,
      iconClass: 'text-red-500',
      title: 'El pago no se completó',
      message: 'No pudimos acreditar el pago. Podés volver a intentarlo o abonar al recibir el pedido.',
    },
  }[resolved];

  return (
    <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
        <config.Icon size={56} className={`mx-auto mb-3 ${config.iconClass}`} />
        <h1 className="text-2xl font-extrabold text-[#212121] font-[var(--font-montserrat)] mb-2">
          {config.title}
        </h1>
        <p className="text-[#757575] mb-4">{config.message}</p>

        {status && (
          <p className="text-sm text-[#4a5568] mb-4">
            Total: <span className="font-semibold">{formatCurrency(status.total)}</span>
          </p>
        )}

        {loading && !error && resolved !== 'verificando' && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#757575] mb-4">
            <Loader2 size={16} className="animate-spin" />
            Actualizando el estado…
          </div>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-2">
          <Link
            href={`/order-confirmation?orderId=${orderId}`}
            className="block w-full bg-[#D95A2B] text-white py-3 rounded-xl font-bold hover:bg-[#D94B2B]"
          >
            Ver mi pedido
          </Link>
          <Link
            href="/menu"
            className="block w-full py-3 rounded-xl font-bold bg-gray-100 text-[#212121] hover:bg-gray-200"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    </div>
  );
}
