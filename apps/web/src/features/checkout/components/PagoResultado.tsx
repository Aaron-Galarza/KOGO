'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { paymentsService, PaymentStatus } from '@/services/payments.service';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/utils/format';
import { LAST_ONLINE_ORDER_KEY } from '@/utils/constants';

type Variant = 'aprobado' | 'pendiente' | 'error';

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 12; // ~48 s de verificación

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Página de retorno desde Mercado Pago.
 *
 * IMPORTANTE: el retorno del navegador NO confirma el pago. Esta pantalla solo
 * consulta al backend (que a su vez se confirma por webhook) y muestra el estado.
 */
export function PagoResultado({ variant }: { variant: Variant }) {
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

  // Sin id de pedido no hay nada que verificar: se muestra un aviso y se evita
  // llamar setState dentro del effect.
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

  // El estado del backend manda; el `variant` de la URL es solo una pista inicial.
  const resolved: Variant = status
    ? status.paymentStatus === 'approved'
      ? 'aprobado'
      : status.paymentStatus === 'rejected' || status.paymentStatus === 'cancelled'
        ? 'error'
        : 'pendiente'
    : variant;

  const config = {
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

        {loading && !error && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#757575] mb-4">
            <Loader2 size={16} className="animate-spin" />
            Verificando el estado del pago…
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
