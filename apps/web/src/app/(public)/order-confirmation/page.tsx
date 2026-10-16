'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ordersService } from '@/services/orders.service';
import { useOrderConfirmStore } from '@/stores/order-confirm.store';
import { Order } from '@/types';
import { OrderTicket } from '@/components/common/OrderTicket';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { paymentPresentation, PaymentTone } from '@/features/checkout/payment-status';
import { PaymentRecoveryActions } from '@/features/checkout/components/PaymentRecoveryActions';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 15; // ~45 s verificando antes de decir "no cobrado"

const TONE_STYLES: Record<PaymentTone, { Icon: typeof CheckCircle; iconClass: string; titleClass: string }> = {
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
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasOrderRef = useRef(Boolean(storedOrder));
  const attemptsRef = useRef(0);

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

        // Si el pago online sigue sin resolverse, se sigue verificando un rato.
        const stillPending =
          fresh.paymentMethod === 'mercadopago' &&
          (fresh.paymentStatus === 'pending' || fresh.paymentStatus === 'in_process');
        if (stillPending && attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current += 1;
          timer = setTimeout(load, POLL_INTERVAL_MS);
        } else {
          setVerifying(false);
        }
      } catch {
        if (active && !hasOrderRef.current) setError('No pudimos cargar tu pedido');
        if (active) setVerifying(false);
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

  const info = paymentPresentation(order, { verifying });
  const { Icon, iconClass, titleClass } = TONE_STYLES[info.tone];
  const canRetry = order.status !== 'cancelled';

  return (
    <div className="cart-bg min-h-screen p-4 py-8">
      <div className="text-center mb-8">
        <Icon size={48} className={`mx-auto mb-2 ${iconClass}`} />
        <h1 className={`text-3xl font-extrabold font-[var(--font-montserrat)] mb-2 ${titleClass}`}>{info.title}</h1>
        <p className="text-[#757575]">{info.message}</p>
      </div>

      <OrderTicket order={order} />

      <div className="max-w-md mx-auto mt-6 space-y-2">
        {info.recovery && <PaymentRecoveryActions orderId={orderId} canRetry={canRetry} />}
        <Link href="/" className="w-full block text-center py-3 rounded-full font-bold bg-gray-100 text-[#212121] hover:bg-gray-200">
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
