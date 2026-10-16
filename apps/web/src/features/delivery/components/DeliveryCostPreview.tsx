'use client';

import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { DeliveryQuote } from '@/types';
import { formatCurrency } from '@/utils/format';

interface DeliveryCostPreviewProps {
  deliveryType: 'pickup' | 'delivery' | null;
  hasCoordinates: boolean;
  quote: DeliveryQuote | null;
  cost: number;
  loading: boolean;
  error: string | null;
}

export function DeliveryCostPreview({
  deliveryType,
  hasCoordinates,
  quote,
  cost,
  loading,
  error,
}: DeliveryCostPreviewProps) {
  if (deliveryType === 'pickup') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#757575]">
        <CheckCircle2 size={16} className="text-green-600" />
        Retirás en el local: sin costo de envío.
      </div>
    );
  }

  if (deliveryType !== 'delivery') return null;

  if (!hasCoordinates) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-[#4a5568]">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
        Elegí tu dirección de la lista para calcular el envío exacto.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-[#757575]">
        <Loader2 size={16} className="animate-spin text-[#D95A2B]" />
        Calculando el envío…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        {error}. Igual podés confirmar el pedido: coordinamos el envío por WhatsApp.
      </div>
    );
  }

  if (!quote) return null;

  if (quote.details.configMissing) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        El costo de envío se coordina por WhatsApp (tabla de envío sin configurar).
      </div>
    );
  }

  if (!quote.details.deliverable) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        Estás a {quote.distanceKm} km, fuera de la zona de reparto (hasta {quote.details.maxDeliveryKm} km).
        Podés retirar en el local o escribirnos por WhatsApp.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm">
      <div className="flex items-center justify-between font-semibold text-[#212121]">
        <span>
          Envío ({quote.distanceKm} km)
          {quote.details.outOfRange && (
            <span className="ml-1 text-xs font-normal text-amber-700">· zona extendida</span>
          )}
        </span>
        <span className="text-[#D95A2B]">{formatCurrency(cost)}</span>
      </div>
      {quote.details.isRaining && quote.details.rainSurcharge > 0 && (
        <p className="mt-0.5 text-xs text-[#757575]">
          Incluye {formatCurrency(quote.details.rainSurcharge)} de recargo por lluvia.
        </p>
      )}
      {quote.details.outOfRange && (
        <p className="mt-0.5 text-xs text-[#757575]">
          Tu dirección es más lejana que la última zona: confirmamos el costo por WhatsApp antes de salir.
        </p>
      )}
    </div>
  );
}
