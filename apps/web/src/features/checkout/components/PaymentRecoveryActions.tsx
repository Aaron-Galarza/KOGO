'use client';

import { Loader2, MessageCircle, RotateCcw } from 'lucide-react';
import { whatsappOrderUrl } from '@/utils/constants';
import { usePayOnline } from '../hooks/usePayOnline';

interface PaymentRecoveryActionsProps {
  orderId: string;
  /** false cuando el pedido ya no se puede re-cobrar (p. ej. cancelado). */
  canRetry: boolean;
}

/**
 * Acciones para un pedido cuyo pago online no se acreditó: reintentar el pago
 * o avisar al negocio por WhatsApp.
 */
export function PaymentRecoveryActions({ orderId, canRetry }: PaymentRecoveryActionsProps) {
  const { pay, loading, error } = usePayOnline();

  return (
    <div className="space-y-2">
      {canRetry && (
        <button
          type="button"
          onClick={() => pay(orderId)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#D95A2B] text-white py-3 rounded-xl font-bold hover:bg-[#D94B2B] disabled:bg-gray-400 active:scale-95 transition"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
          {loading ? 'Abriendo Mercado Pago…' : 'Reintentar el pago'}
        </button>
      )}
      <a
        href={whatsappOrderUrl(orderId)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 active:scale-95 transition"
      >
        <MessageCircle size={18} /> Avisar por WhatsApp
      </a>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
