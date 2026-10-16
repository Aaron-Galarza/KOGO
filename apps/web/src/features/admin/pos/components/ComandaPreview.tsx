'use client';

import { usePOSStore } from '@/stores/pos.store';
import { CartItem, Coupon, OpcionElegida, SelectedAddOn } from '@/types';
import { formatCurrency } from '@/utils/format';

interface ComandaPreviewProps {
  items: CartItem[];
  subtotal: number;
  name: string;
  phone: string;
  appliedCoupon: Coupon | null;
  /** Costo de envío manual (opcional): corrige lo calculado por el sistema. */
  manualShipping: string;
  onManualShippingChange: (value: string) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

export function ComandaPreview({
  items,
  subtotal,
  name,
  phone,
  appliedCoupon,
  manualShipping,
  onManualShippingChange,
}: ComandaPreviewProps) {
  const deliveryType = usePOSStore((s) => s.deliveryType);
  const paymentMethod = usePOSStore((s) => s.paymentMethod);
  const deliveryAddress = usePOSStore((s) => s.deliveryAddress);
  const deliveryCost = usePOSStore((s) => s.deliveryCost);
  const distanceKm = usePOSStore((s) => s.distanceKm);

  const isDelivery = deliveryType === 'delivery';
  const manualValue = parseFloat(manualShipping);
  const hasManual = manualShipping.trim() !== '' && Number.isFinite(manualValue) && manualValue >= 0;
  const shipCost = isDelivery ? (hasManual ? manualValue : deliveryCost) : 0;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const total = subtotal - discount + shipCost;

  return (
    <div className="hidden md:flex flex-col bg-gray-50 rounded-lg overflow-y-auto border font-mono text-xs">
      <div className="text-center font-bold text-sm py-2 border-b bg-white">KOGO</div>
      <div className="p-3 space-y-2 flex-1">
        <div className="space-y-1">
          <p><strong>Cliente:</strong> {name || '---'}</p>
          <p><strong>Telefono:</strong> {phone || '---'}</p>
          <p><strong>Entrega:</strong> {isDelivery ? 'Domicilio' : 'Retiro'}</p>
          {isDelivery && deliveryAddress && (
            <p className="text-[#757575]">Dir: {deliveryAddress}</p>
          )}
          {isDelivery && distanceKm !== null && (
            <p className="text-[#757575]">Dist: {distanceKm} km</p>
          )}
          <p><strong>Pago:</strong> {PAYMENT_LABELS[paymentMethod || 'cash'] || 'Efectivo'}</p>
        </div>
        <div className="border-t pt-2">
          {items.map((item) => (
            <div key={item.cartItemId} className="mb-1">
              <p className="font-semibold">{item.quantity}x {item.title || item.name}</p>
              {(item.addOns || []).map((a: SelectedAddOn) => (
                <p key={a._id} className="text-[10px] ml-3 text-[#757575]">+ {a.name}</p>
              ))}
              {(item.ingredientes || []).map((o: OpcionElegida, idx: number) => (
                <p key={`${o.ingredienteId || o.ingredienteNombre}-${idx}`} className="text-[10px] ml-3 text-[#757575]">
                  · {o.ingredienteNombre}{o.cantidad > 1 ? ` x${o.cantidad}` : ''}{o.precio > 0 ? ` (+${formatCurrency(o.precio)})` : ''}
                </p>
              ))}
            </div>
          ))}
        </div>
        {isDelivery && (
          <div className="border-t pt-2">
            <p className="font-semibold mb-1">Costo de envio:</p>
            <p className="text-[#757575] mb-1">
              Calculado: {formatCurrency(deliveryCost)}
              {distanceKm !== null ? ` (${distanceKm} km)` : ''}
            </p>
            <input type="number" value={manualShipping} onChange={(e) => onManualShippingChange(e.target.value)}
              placeholder="Corregir a mano (opcional)" min={0} step="0.01"
              className="w-full px-2 py-1 border rounded text-xs" />
          </div>
        )}
        <div className="border-t pt-1.5 text-right font-bold text-xs">
          <p>Sub: {formatCurrency(subtotal)}</p>
          {discount > 0 && <p className="text-green-600">Desc: -{formatCurrency(discount)}</p>}
          {shipCost > 0 && <p>Env: {formatCurrency(shipCost)}</p>}
          <p className="text-sm mt-0.5">TOTAL: {formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
}
