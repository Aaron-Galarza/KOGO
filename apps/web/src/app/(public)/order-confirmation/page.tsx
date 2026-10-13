'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ordersService } from '@/services/orders.service';
import { useOrderConfirmStore } from '@/stores/order-confirm.store';
import { Order } from '@/types';
import { OrderTicket } from '@/components/common/OrderTicket';
import { CheckCircle } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setError('Pedido no encontrado'); setLoading(false); return; }

    const stored = useOrderConfirmStore.getState().lastOrder;
    if (stored && stored._id === orderId) {
      setOrder(stored);
      useOrderConfirmStore.getState().clearLastOrder();
      setLoading(false);
      return;
    }

    ordersService.getOrder(orderId)
      .then(setOrder)
      .catch(() => setError('No pudimos cargar tu pedido'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="cart-bg min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D9383A] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="cart-bg min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-[#D9383A] mb-4">{error || 'Pedido no encontrado'}</h1>
        <Link href="/" className="inline-block bg-[#D9383A] text-white px-6 py-2 rounded-full font-bold hover:bg-[#b52d2f]">Volver al menu</Link>
      </div>
    );
  }

  return (
    <div className="cart-bg min-h-screen p-4 py-8">
      <div className="text-center mb-8">
        <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
        <h1 className="text-3xl font-extrabold text-green-600 font-[var(--font-montserrat)] mb-2">Gracias por tu pedido!</h1>
        <p className="text-[#757575]">Te notificaremos por WhatsApp cuando este listo.</p>
      </div>

      <OrderTicket order={order} />

      <div className="max-w-md mx-auto mt-6">
        <Link href="/" className="w-full block text-center bg-[#D9383A] text-white py-3 rounded-full font-bold hover:bg-[#b52d2f]">
          Volver al menu
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="cart-bg min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D9383A] border-t-transparent" /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
