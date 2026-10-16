'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ordersService } from '@/services/orders.service';
import { useOrderConfirmStore } from '@/stores/order-confirm.store';
import { Order } from '@/types';
import { OrderTicket } from '@/components/common/OrderTicket';
import { CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';

type Tone = 'success' | 'warning' | 'danger';

const POLL_INTERVAL_MS = 3000;

/**
 * Presenta el pedido según el ESTADO DE PAGO real (no según la URL de retorno).
 * Efectivo/transferencia se cobran al entregar, así que se muestran como éxito.
 */
function paymentPresentation(order: Order): { tone: Tone; title: string; message: string } {
  const ps = order.paymentStatus ?? 'not_required';

  if (order.paymentMethod === 'mercadopago') {
    if (ps === 'approved') {
      return {
        tone: 'success',
        title: '¡Pago aprobado!',
        message: 'Gracias por tu pedido. Te avisaremos por WhatsApp cuando esté listo.',
      };
    }
    if (ps === 'rejected') {
      return {
        tone: 'danger',
        title: 'El pago no se completó',
        message: 'Mercado Pago rechazó el pago. Podés reintentar la compra o abonar al recibir el pedido.',
      };
    }
    if (ps === 'cancelled') {
      return {
        tone: 'danger',
        title: 'El pago fue cancelado',
        message: 'El pedido no quedó pago. Podés intentar la compra nuevamente.',
      };
    }
    if (ps === 'refunded') {
      return {
        tone: 'warning',
        title: 'Pago reembolsado',
        message: 'El pago de este pedido fue devuelto.',
      };
    }
    return {
      tone: 'warning',
      title: 'Estamos confirmando tu pago',
      message: 'Mercado Pago todavía no acreditó el pago. Esta pantalla se actualiza sola.',
    };
  }

  return {
    tone: 'success',
    title: '¡Gracias por tu pedido!',
    message: 'Te avisaremos por WhatsApp cuando esté listo.',
  };
}

const TONE_STYLES: Record<Tone, { Icon: typeof CheckCircle; iconClass: string; titleClass: string }> = {
  success: { Icon: CheckCircle, iconClass: 'text-green-500', titleClass: 'text-green-600' },
  warning: { Icon: Clock, iconClass: 'text-amber-500', titleClass: 'text-amber-600' },
  danger: { Icon: XCircle, iconClass: 'text-red-500', titleClass: 'text-red-600' },
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  // El pedido recién creado se muestra al instante si coincide con el id de la
  // URL. El efecto SIEMPRE refresca el estado real desde el backend.
  const storedOrder = (() => {
    if (!orderId) return null;
    const stored = useOrderConfirmStore.getState().lastOrder;
    return stored && stored._id === orderId ? stored : null;
  })();

  const [order, setOrder] = useState<Order | null>(storedOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasOrderRef = useRef(Boolean(storedOrder));

  useEffect(() => {
    if (!orderId) return;

    useOrderConfirmStore.getState().clearLastOrder();

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const fresh = await ordersService.getOrder(orderId);
        if (!active) return;
        hasOrderRef.current = true;
        setOrder(fresh);
        setError(null);

        // Si el pago online sigue sin resolverse, se sigue verificando solo.
        const stillPending =
          fresh.paymentMethod === 'mercadopago' &&
          (fresh.paymentStatus === 'pending' || fresh.paymentStatus === 'in_process');
        if (stillPending) timer = setTimeout(load, POLL_INTERVAL_MS);
      } catch {
        if (active && !hasOrderRef.current) setError('No pudimos cargar tu pedido');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#D95A2B] mb-4">Pedido no encontrado</h1>
        <Link href="/" className="inline-block bg-[#D95A2B] text-white px-6 py-2 rounded-full font-bold hover:bg-[#D94B2B]">Volver al menu</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-bg min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D95A2B] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#D95A2B] mb-4">{error || 'Pedido no encontrado'}</h1>
        <Link href="/" className="inline-block bg-[#D95A2B] text-white px-6 py-2 rounded-full font-bold hover:bg-[#D94B2B]">Volver al menu</Link>
      </div>
    );
  }

  const info = paymentPresentation(order);
  const { Icon, iconClass, titleClass } = TONE_STYLES[info.tone];
  const needsRetry = info.tone === 'danger';

  return (
    <div className="cart-bg min-h-screen p-4 py-8">
      <div className="text-center mb-8">
        <Icon size={48} className={`mx-auto mb-2 ${iconClass}`} />
        <h1 className={`text-3xl font-extrabold font-[var(--font-montserrat)] mb-2 ${titleClass}`}>{info.title}</h1>
        <p className="text-[#757575]">{info.message}</p>
      </div>

      <OrderTicket order={order} />

      <div className="max-w-md mx-auto mt-6 space-y-2">
        {needsRetry && (
          <Link href="/menu" className="w-full flex items-center justify-center gap-2 bg-[#D95A2B] text-white py-3 rounded-full font-bold hover:bg-[#D94B2B]">
            <RotateCcw size={18} /> Intentar de nuevo
          </Link>
        )}
        <Link href="/" className="w-full block text-center bg-[#D95A2B] text-white py-3 rounded-full font-bold hover:bg-[#D94B2B]">
          Volver al menu
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="cart-bg min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D95A2B] border-t-transparent" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
